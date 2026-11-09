
import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

import api from "../../apiService";
import "bootstrap-icons/font/bootstrap-icons.css";
import { usePermission } from '../../../src/context/permissionContex';

const DOC_TYPES = [
  { key: "EID", label: "Emirates ID", icon: "bi-person-vcard", noField: "EIDNo", expiryField: "EIDExpiryDate", daysField: "EIDDaysLeft" },
  { key: "Passport", label: "Passport", icon: "bi-passport", noField: "PPNo", expiryField: "PPExpiryDate", daysField: "PassportDaysLeft" },
  { key: "Visa", label: "Visa", icon: "bi-airplane", noField: "VisaNo", expiryField: "VisaExpiryDate", daysField: "VisaDaysLeft" },
  { key: "Insurance", label: "Insurance", icon: "bi-heart-pulse", noField: "InsuranceNo", expiryField: "InsuranceExpiryDate", daysField: "InsuranceDaysLeft" },
  { key: "GatePass", label: "Gate Pass", icon: "bi-door-open", noField: "GatePassNo", expiryField: "GatePassExpiryDate", daysField: "GatePassDaysLeft" },
  { key: "WorkmenComp", label: "Workmen Comp", icon: "bi-shield-check", noField: "WorkmenCompNo", expiryField: "WorkmenCompExpiryDate", daysField: "WorkmenCompDaysLeft" },
  { key: "ProfLicense", label: "Trade License", icon: "bi-file-earmark-text", noField: "ProfLicenseNo", expiryField: "ProfLicenseExpiryDate", daysField: "ProfLicenseDaysLeft" },
];

const FILTER_OPTIONS = [
  { value: "expired", label: "Expired" },
  { value: "30", label: "Next 30 Days" },
  { value: "60", label: "Next 60 Days" },
  { value: "90", label: "Next 90 Days" },
  { value: "all", label: "All" },
  { value: "custom", label: "Custom Range" },
];

// Buckets used for both the status chip (Tab 1) and the board columns (Tab 2)
const BUCKETS = [
  { key: "expired", label: "Expired", chip: "ed-chip-expired", badge: "ed-count-expired", test: (d) => d !== null && d !== undefined && d < 0 },
  { key: "30", label: "0 – 30 Days", chip: "ed-chip-urgent", badge: "ed-count-urgent", test: (d) => d !== null && d !== undefined && d >= 0 && d <= 30 },
  { key: "60", label: "31 – 60 Days", chip: "ed-chip-soon", badge: "ed-count-soon", test: (d) => d !== null && d !== undefined && d > 30 && d <= 60 },
  { key: "90", label: "61 – 90 Days", chip: "ed-chip-watch", badge: "ed-count-watch", test: (d) => d !== null && d !== undefined && d > 60 && d <= 90 },
  { key: "90plus", label: "90+ Days", chip: "ed-chip-ok", badge: "ed-count-ok", test: (d) => d !== null && d !== undefined && d > 90 },
];

const formatDate = (val) => {
  if (!val) return "-";
  const d = new Date(val);
  if (isNaN(d)) return "-";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const getStatus = (daysLeft) => {
  if (daysLeft === null || daysLeft === undefined) return { label: "N/A", chip: "ed-chip-na" };
  if (daysLeft < 0) return { label: "Expired", chip: "ed-chip-expired" };
  if (daysLeft <= 30) return { label: `${daysLeft}d left`, chip: "ed-chip-urgent" };
  if (daysLeft <= 60) return { label: `${daysLeft}d left`, chip: "ed-chip-soon" };
  if (daysLeft <= 90) return { label: `${daysLeft}d left`, chip: "ed-chip-watch" };
  return { label: `${daysLeft}d left`, chip: "ed-chip-ok" };
};

const statusText = (daysLeft) => {
  if (daysLeft === null || daysLeft === undefined) return "N/A";
  if (daysLeft < 0) return "Expired";
  if (daysLeft <= 30) return "Urgent (0-30d)";
  if (daysLeft <= 60) return "Due Soon (31-60d)";
  if (daysLeft <= 90) return "Watch (61-90d)";
  return "Healthy (90d+)";
};

const initials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
};
const getProjectsArray = (worker) => {
  const raw = worker?.Projects;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  }
  // single object case
  if (typeof raw === "object") return [raw];
  return [];
};

const ExpiryDoc = () => {
  const [activeTab, setActiveTab] = useState("expiry"); // "expiry" | "board"
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Permissions ───────────────────────────────────────────────
  const { getPermission, refreshPermissions } = usePermission();
  const permission = getPermission("DOCUMENT_EXPIRY_REPORT");
  const canView = !!permission?.CanView;
  const canExport = !!permission?.CanExport;

  // Tab 1 — filter state
  const [filter, setFilter] = useState("30");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [search, setSearch] = useState("");

  // Tab 2 — selected document type
  const [selectedDocType, setSelectedDocType] = useState(DOC_TYPES[0].key);

  // Modals
  const [selectedRow, setSelectedRow] = useState(null); // quick-info popup
  const [detailsWorker, setDetailsWorker] = useState(null); // full details modal

  useEffect(() => {
    refreshPermissions();
  }, [refreshPermissions]);

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    const fetchExpiryDocs = async () => {
      try {
        setLoading(true);
        const CompanyID = sessionStorage.getItem("CompanyID");
        const res = await api.get(`/api/getExpiryDoc?CompanyID=${CompanyID}`);
        setWorkers((res.data && res.data.data) || []);
        setError(null);
      } catch (err) {
        setError("Failed to load document expiry data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchExpiryDocs();
  }, [canView]);

  // Flatten: one row per worker per document type that actually has an expiry date
  const flatRows = useMemo(() => {
    const rows = [];
    workers.forEach((w) => {
      DOC_TYPES.forEach((dt) => {
        const expiryDate = w[dt.expiryField];
        if (!expiryDate) return;
        rows.push({
          id: `${w.UserId}-${dt.key}`,
          UserId: w.UserId,
          UserName: w.UserName,
          TradeName: w.TradeName,
          SupplierName: w.SupplierName,
          BadgeNo: w.BadgeNo,
          Mobile: w.Mobile,
          docLabel: dt.label,
          docIcon: dt.icon,
          docNo: w[dt.noField],
          expiryDate,
          daysLeft: w[dt.daysField],
          worker: w,
        });
      });
    });
    return rows;
  }, [workers]);

  const filteredRows = useMemo(() => {
    let rows = flatRows;

    if (filter === "expired") {
      rows = rows.filter((r) => r.daysLeft !== null && r.daysLeft !== undefined && r.daysLeft < 0);
    } else if (filter === "30" || filter === "60" || filter === "90") {
      const limit = Number(filter);
      rows = rows.filter((r) => r.daysLeft !== null && r.daysLeft !== undefined && r.daysLeft >= 0 && r.daysLeft <= limit);
    } else if (filter === "custom") {
      if (customFrom && customTo) {
        const from = new Date(customFrom);
        const to = new Date(customTo);
        rows = rows.filter((r) => {
          const d = new Date(r.expiryDate);
          return d >= from && d <= to;
        });
      }
    }
    // "all" -> no date filtering

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.UserName || "").toLowerCase().includes(q) ||
          (r.TradeName || "").toLowerCase().includes(q) ||
          (r.SupplierName || "").toLowerCase().includes(q)
      );
    }

    return rows.sort((a, b) => (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity));
  }, [flatRows, filter, customFrom, customTo, search]);

  // ---- Tab 2: rows for the currently selected document type, grouped into buckets ----
  const selectedDocConfig = DOC_TYPES.find((dt) => dt.key === selectedDocType);

  const docTypeRows = useMemo(() => {
    if (!selectedDocConfig) return [];
    return workers
      .filter((w) => !!w[selectedDocConfig.expiryField])
      .map((w) => ({
        UserId: w.UserId,
        UserName: w.UserName,
        TradeName: w.TradeName,
        docNo: w[selectedDocConfig.noField],
        expiryDate: w[selectedDocConfig.expiryField],
        daysLeft: w[selectedDocConfig.daysField],
        worker: w,
      }))
      .sort((a, b) => (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity));
  }, [workers, selectedDocConfig]);

  const boardColumns = useMemo(
    () =>
      BUCKETS.map((bucket) => ({
        ...bucket,
        items: docTypeRows.filter((r) => bucket.test(r.daysLeft)),
      })),
    [docTypeRows]
  );

  const [exportingList, setExportingList] = useState(false);
  const [exportingBoard, setExportingBoard] = useState(false);

  // Tab 1 — Expiry List export (respects current filter/search), single sheet
  const handleExportExpiryList = () => {
    setExportingList(true);
    try {
      // const expiryListData = filteredRows.map((r) => ({
      //   Worker: r.UserName || "",
      //   Trade: r.TradeName || "",
      //   Supplier: r.SupplierName || "",
      //   Document: r.docLabel || "",
      //   "Doc No": r.docNo || "",
      //   "Expiry Date": formatDate(r.expiryDate),
      //   "Days Left": r.daysLeft ?? "",
      //   Status: statusText(r.daysLeft),
      // }));
      const expiryListData = filteredRows.flatMap((r) => {
  const projects = getProjectsArray(r.worker);

  // If no project exists, export one row
  if (projects.length === 0) {
    return [{
      Worker: r.UserName || "",
      Trade: r.TradeName || "",
      Supplier: r.SupplierName || "",
      Project: "",
      "Project Code": "",
      "Project Start Date": "",
      "Allocation Start Date": "",
      Document: r.docLabel || "",
      "Doc No": r.docNo || "",
      "Expiry Date": formatDate(r.expiryDate),
      "Days Left": r.daysLeft ?? "",
      Status: statusText(r.daysLeft),
    }];
  }

  // Export one row for each project
  return projects.map((p) => ({
    Worker: r.UserName || "",
    Trade: r.TradeName || "",
    Supplier: r.SupplierName || "",

    Project: p.ProjectName || "",
    "Project Code": p.ProjectCode || "",
    "Project Start Date": formatDate(p.ProjectStartDate),
    "Allocation Start Date": formatDate(p.AllocationStartDate),

    Document: r.docLabel || "",
    "Doc No": r.docNo || "",
    "Expiry Date": formatDate(r.expiryDate),
    "Days Left": r.daysLeft ?? "",
    Status: statusText(r.daysLeft),
  }));
});

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(expiryListData);
      // ws["!cols"] = [{ wch: 22 }, { wch: 18 }, { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 18 }];
      ws["!cols"] = [
  { wch: 22 }, // Worker
  { wch: 18 }, // Trade
  { wch: 22 }, // Supplier
  { wch: 35 }, // Project
  { wch: 18 }, // Project Code
  { wch: 18 }, // Project Start Date
  { wch: 20 }, // Allocation Start Date
  { wch: 18 }, // Document
  { wch: 20 }, // Doc No
  { wch: 16 }, // Expiry Date
  { wch: 12 }, // Days Left
  { wch: 18 }, // Status
];
      XLSX.utils.book_append_sheet(wb, ws, "Expiry List");

      const stamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `Expiry_List_${stamp}.xlsx`);
    } finally {
      setExportingList(false);
    }
  };

  // Tab 2 — Document Board export (currently selected document type, grouped by bucket), single sheet
  const handleExportDocumentBoard = () => {
    setExportingBoard(true);
    try {
      // const documentBoardData = boardColumns.flatMap((bucket) =>
      //   bucket.items.map((item) => ({
      //     Worker: item.UserName || "",
      //     Trade: item.TradeName || "",
      //     Document: selectedDocConfig?.label || "",
      //     "Doc No": item.docNo || "",
      //     "Expiry Date": formatDate(item.expiryDate),
      //     "Days Left": item.daysLeft ?? "",
      //     Bucket: bucket.label,
      //   }))
      // );
      const documentBoardData = boardColumns.flatMap((bucket) =>
  bucket.items.flatMap((item) => {
    const projects = getProjectsArray(item.worker);

    // No project
    if (projects.length === 0) {
      return [{
        Worker: item.UserName || "",
        Trade: item.TradeName || "",
        Supplier: item.worker.SupplierName || "",

        Project: "",
        "Project Code": "",
        "Project Start Date": "",
        "Allocation Start Date": "",

        Document: selectedDocConfig?.label || "",
        "Doc No": item.docNo || "",
        "Expiry Date": formatDate(item.expiryDate),
        "Days Left": item.daysLeft ?? "",
        Bucket: bucket.label,
      }];
    }

    // One row per project
    return projects.map((p) => ({
      Worker: item.UserName || "",
      Trade: item.TradeName || "",
      Supplier: item.worker.SupplierName || "",

      Project: p.ProjectName || "",
      "Project Code": p.ProjectCode || "",
      "Project Start Date": formatDate(p.ProjectStartDate),
      "Allocation Start Date": formatDate(p.AllocationStartDate),

      Document: selectedDocConfig?.label || "",
      "Doc No": item.docNo || "",
      "Expiry Date": formatDate(item.expiryDate),
      "Days Left": item.daysLeft ?? "",
      Bucket: bucket.label,
    }));
  })
);

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(documentBoardData);
      // ws["!cols"] = [{ wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 16 }];
      ws["!cols"] = [
  { wch: 22 }, // Worker
  { wch: 18 }, // Trade
  { wch: 22 }, // Supplier
  { wch: 35 }, // Project
  { wch: 18 }, // Project Code
  { wch: 18 }, // Project Start Date
  { wch: 20 }, // Allocation Start Date
  { wch: 18 }, // Document
  { wch: 20 }, // Doc No
  { wch: 16 }, // Expiry Date
  { wch: 12 }, // Days Left
  { wch: 18 }, // Bucket
];
      XLSX.utils.book_append_sheet(wb, ws, "Document Board");

      const stamp = new Date().toISOString().slice(0, 10);
      const docLabel = (selectedDocConfig?.label || "Board").replace(/\s+/g, "_");
      XLSX.writeFile(wb, `Document_Board_${docLabel}_${stamp}.xlsx`);
    } finally {
      setExportingBoard(false);
    }
  };

  const expiredCount = useMemo(
    () => flatRows.filter((r) => r.daysLeft !== null && r.daysLeft !== undefined && r.daysLeft < 0).length,
    [flatRows]
  );
  const urgentCount = useMemo(
    () => flatRows.filter((r) => r.daysLeft !== null && r.daysLeft !== undefined && r.daysLeft >= 0 && r.daysLeft <= 30).length,
    [flatRows]
  );

  // ── Block the whole page if the user has no view access ────────
  if (!canView) {
    return (
      <div className="ed-root container-fluid py-4">
        <style>{`
          :root {
            --ed-primary: #10299b;
            --ed-red: #dc2626;
            --ed-red-dark: #a51616;
            --ed-red-soft: #fdecec;
            --ed-red-tint: #fbd2d2;
          }
          .ed-alert-error {
            background: var(--ed-red-soft);
            border: 1px solid var(--ed-red-tint);
            color: var(--ed-red-dark);
            border-radius: 12px;
            padding: 14px 18px;
            font-size: 0.86rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 10px;
          }
        `}</style>
        <div className="ed-alert-error">
          <i className="bi bi-exclamation-triangle-fill"></i>
          You do not have permission to view Document Expiry Report.
        </div>
      </div>
    );
  }

  return (
    <div className="ed-root container-fluid py-4">
      <style>{`
        :root {
          --ed-primary: #10299b;
          --ed-primary-dark: #0b1c6e;
          --ed-primary-mid: #4a5fc1;
          --ed-primary-soft: #eef1fb;
          --ed-primary-tint: #d6ddf5;
          --ed-primary-line: #c3cdf0;
          --ed-red: #dc2626;
          --ed-red-dark: #a51616;
          --ed-red-soft: #fdecec;
          --ed-red-tint: #fbd2d2;
          --ed-ink: #1a1f36;
          --ed-muted: #6b7290;
        }
        .ed-root {
          font-family: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
          color: var(--ed-ink);
          letter-spacing: 0.1px;
        }
        .ed-root * { box-sizing: border-box; }

        /* ---------- Header ---------- */
        .ed-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px 24px;
          background: linear-gradient(135deg, var(--ed-primary) 0%, var(--ed-primary-dark) 100%);
          border-radius: 16px;
          color: #fff;
          margin-bottom: 24px;
          box-shadow: 0 8px 24px rgba(16, 41, 155, 0.18);
        }
        .ed-header-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(255,255,255,0.14);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          flex-shrink: 0;
        }
        .ed-header-title {
          font-size: 1.15rem;
          font-weight: 700;
          margin: 0;
          letter-spacing: 0.2px;
        }
        .ed-header-sub {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.75);
          margin-top: 2px;
        }
        .ed-header-stats {
          margin-left: auto;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .ed-stat-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.16);
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 0.78rem;
          font-weight: 600;
        }
        .ed-stat-pill.ed-stat-alert {
          background: rgba(220,38,38,0.22);
          border-color: rgba(220,38,38,0.4);
        }
        .ed-stat-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #fff;
        }
        .ed-stat-alert .ed-stat-dot { background: #ff8a8a; }
        .ed-export-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          border: none;
          background: var(--ed-primary);
          color: #fff;
          border-radius: 9px;
          padding: 9px 16px;
          font-size: 0.8rem;
          font-weight: 700;
          white-space: nowrap;
          transition: all 0.15s ease;
        }
        .ed-export-btn:hover:not(:disabled) {
          background: var(--ed-primary-dark);
          box-shadow: 0 4px 10px rgba(16, 41, 155, 0.25);
        }
        .ed-export-btn:disabled { opacity: 0.5; cursor: default; box-shadow: none; }
        .ed-export-btn-inline { margin-left: auto; }

        /* ---------- Tabs ---------- */
        .ed-tabs {
          display: inline-flex;
          background: var(--ed-primary-soft);
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 20px;
          gap: 4px;
        }
        .ed-tab-btn {
          border: none;
          background: transparent;
          padding: 9px 20px;
          border-radius: 9px;
          font-size: 0.86rem;
          font-weight: 600;
          color: var(--ed-primary-mid);
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ed-tab-btn:hover { color: var(--ed-primary); }
        .ed-tab-btn.active {
          background: var(--ed-primary);
          color: #fff;
          box-shadow: 0 4px 10px rgba(16, 41, 155, 0.25);
        }

        /* ---------- Toolbar ---------- */
        .ed-toolbar {
          background: #fff;
          border: 1px solid var(--ed-primary-tint);
          border-radius: 14px;
          padding: 14px 18px;
          margin-bottom: 20px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          box-shadow: 0 2px 8px rgba(16, 41, 155, 0.04);
        }
        .ed-toolbar-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ed-select, .ed-date-input, .ed-search-input {
          border: 1px solid var(--ed-primary-tint);
          border-radius: 9px;
          padding: 8px 12px;
          font-size: 0.85rem;
          color: var(--ed-ink);
          background: var(--ed-primary-soft);
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .ed-select:focus, .ed-date-input:focus, .ed-search-input:focus {
          border-color: var(--ed-primary);
          box-shadow: 0 0 0 3px rgba(16, 41, 155, 0.12);
          background: #fff;
        }
        .ed-search-wrap {
          position: relative;
          margin-left: auto;
          min-width: 260px;
        }
        .ed-search-wrap i {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--ed-primary-mid);
          font-size: 0.85rem;
        }
        .ed-search-input { width: 100%; padding-left: 34px; }
        .ed-divider-dot {
          color: var(--ed-primary-tint);
          font-size: 0.8rem;
        }

        /* ---------- Table card ---------- */
        .ed-table-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid var(--ed-primary-tint);
          overflow: hidden;
          box-shadow: 0 4px 18px rgba(16, 41, 155, 0.06);
        }
        .ed-table { width: 100%; border-collapse: collapse; margin: 0; }
        .ed-table thead th {
          position: sticky;
          top: 0;
          z-index: 1;
          background: var(--ed-primary-soft);
          color: var(--ed-primary-dark);
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          padding: 13px 16px;
          border-bottom: 2px solid var(--ed-primary-tint);
          text-align: left;
        }
        .ed-table tbody td {
          padding: 13px 16px;
          font-size: 0.86rem;
          border-bottom: 1px solid #f0f2fa;
          vertical-align: middle;
        }
        .ed-table tbody tr { cursor: pointer; transition: background 0.15s ease; }
        .ed-table tbody tr:nth-child(even) { background: #f8f9fd; }
        .ed-table tbody tr:hover { background: var(--ed-primary-soft); }
        .ed-row-name { font-weight: 600; color: var(--ed-ink); }
        .ed-row-sub { color: var(--ed-muted); font-size: 0.78rem; }
        .ed-doc-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--ed-primary);
        }

        /* ---------- Chips ---------- */
        .ed-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.2px;
          white-space: nowrap;
        }
        .ed-chip-expired { background: var(--ed-red); color: #fff; }
        .ed-chip-urgent { background: var(--ed-red-soft); color: var(--ed-red-dark); border: 1px solid var(--ed-red-tint); }
        .ed-chip-soon { background: var(--ed-primary-tint); color: var(--ed-primary-dark); }
        .ed-chip-watch { background: var(--ed-primary-soft); color: var(--ed-primary-mid); border: 1px solid var(--ed-primary-tint); }
        .ed-chip-ok { background: var(--ed-primary-dark); color: #fff; }
        .ed-chip-na { background: #eef0f5; color: var(--ed-muted); }

        /* ---------- Empty / loading states ---------- */
        .ed-empty, .ed-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 56px 20px;
          color: var(--ed-muted);
          text-align: center;
        }
        .ed-empty i, .ed-loading i {
          font-size: 2.1rem;
          color: var(--ed-primary-tint);
          margin-bottom: 10px;
        }
        .ed-empty-title { font-weight: 700; color: var(--ed-primary-dark); font-size: 0.92rem; margin-bottom: 2px; }
        .ed-empty-sub { font-size: 0.8rem; }
        .ed-spinner {
          width: 30px; height: 30px;
          border-radius: 50%;
          border: 3px solid var(--ed-primary-tint);
          border-top-color: var(--ed-primary);
          animation: ed-spin 0.8s linear infinite;
          margin-bottom: 12px;
        }
        @keyframes ed-spin { to { transform: rotate(360deg); } }

        .ed-alert-error {
          background: var(--ed-red-soft);
          border: 1px solid var(--ed-red-tint);
          color: var(--ed-red-dark);
          border-radius: 12px;
          padding: 14px 18px;
          font-size: 0.86rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* ---------- Board (Tab 2) ---------- */
        .ed-doctype-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          background: #fff;
          border: 1px solid var(--ed-primary-tint);
          border-radius: 14px;
          padding: 14px 16px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(16, 41, 155, 0.04);
        }
        .ed-doctype-btn {
          border: 1px solid var(--ed-primary-tint);
          background: var(--ed-primary-soft);
          color: var(--ed-primary-mid);
          border-radius: 999px;
          padding: 7px 15px;
          font-size: 0.8rem;
          font-weight: 600;
          transition: all 0.15s ease;
        }
        .ed-doctype-btn:hover { border-color: var(--ed-primary); color: var(--ed-primary); }
        .ed-doctype-btn.active {
          background: var(--ed-primary);
          border-color: var(--ed-primary);
          color: #fff;
          box-shadow: 0 4px 10px rgba(16, 41, 155, 0.22);
        }

        .ed-board-col {
          background: #f6f7fc;
          border: 1px solid var(--ed-primary-tint);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .ed-board-col-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 16px;
          background: #fff;
          border-bottom: 1px solid var(--ed-primary-tint);
        }
        .ed-board-col-title {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--ed-primary-dark);
        }
        .ed-count-badge {
          min-width: 24px;
          height: 22px;
          padding: 0 7px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.72rem;
          font-weight: 700;
        }
        .ed-count-expired { background: var(--ed-red); color: #fff; }
        .ed-count-urgent { background: var(--ed-red-soft); color: var(--ed-red-dark); }
        .ed-count-soon { background: var(--ed-primary-tint); color: var(--ed-primary-dark); }
        .ed-count-watch { background: var(--ed-primary-soft); color: var(--ed-primary-mid); }
        .ed-count-ok { background: var(--ed-primary-dark); color: #fff; }

        .ed-board-col-body {
          padding: 10px;
          overflow-y: auto;
          flex: 1;
        }
        .ed-worker-card {
          width: 100%;
          text-align: left;
          background: #fff;
          border: 1px solid var(--ed-primary-tint);
          border-radius: 11px;
          padding: 10px 12px;
          margin-bottom: 8px;
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
          cursor: pointer;
        }
        .ed-worker-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(16, 41, 155, 0.14);
          border-color: var(--ed-primary-mid);
        }
        .ed-worker-card-name { font-weight: 700; font-size: 0.83rem; color: var(--ed-ink); }
        .ed-worker-card-sub { font-size: 0.74rem; color: var(--ed-muted); margin-top: 2px; }
        .ed-board-empty {
          text-align: center;
          color: var(--ed-muted);
          font-size: 0.78rem;
          padding: 24px 8px;
        }

        /* ---------- Modals ---------- */
        .ed-modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(15, 20, 50, 0.55);
          display: flex; align-items: center; justify-content: center;
          z-index: 1050;
          padding: 20px;
          animation: ed-fade-in 0.15s ease;
        }
        @keyframes ed-fade-in { from { opacity: 0; } to { opacity: 1; } }
        .ed-modal-card {
          background: #fff;
          border-radius: 18px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 20px 50px rgba(16, 41, 155, 0.25);
          overflow: hidden;
          animation: ed-pop-in 0.18s ease;
        }
        .ed-modal-card.ed-modal-lg { max-width: 700px; }
        @keyframes ed-pop-in { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .ed-modal-head {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 20px 22px;
          background: linear-gradient(135deg, var(--ed-primary) 0%, var(--ed-primary-dark) 100%);
          color: #fff;
        }
        .ed-avatar {
          width: 44px; height: 44px;
          border-radius: 12px;
          background: rgba(255,255,255,0.16);
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.95rem;
          flex-shrink: 0;
        }
        .ed-modal-head-name { font-weight: 700; font-size: 1rem; margin: 0; }
        .ed-modal-head-sub { font-size: 0.78rem; color: rgba(255,255,255,0.75); }
        .ed-modal-close {
          margin-left: auto;
          border: none;
          background: rgba(255,255,255,0.14);
          color: #fff;
          width: 30px; height: 30px;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s ease;
        }
        .ed-modal-close:hover { background: rgba(220,38,38,0.55); }
        .ed-modal-body { padding: 22px; }
        .ed-field-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px 18px;
        }
        .ed-field label {
          display: block;
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--ed-primary-mid);
          margin-bottom: 3px;
        }
        .ed-field .ed-field-value {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--ed-ink);
        }
        .ed-field.ed-field-full { grid-column: 1 / -1; }
        .ed-doc-highlight {
          margin-top: 16px;
          padding: 14px 16px;
          background: var(--ed-primary-soft);
          border: 1px solid var(--ed-primary-tint);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .ed-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 16px 22px;
          border-top: 1px solid var(--ed-primary-soft);
        }
        .ed-btn {
          border: none;
          border-radius: 10px;
          padding: 9px 18px;
          font-size: 0.84rem;
          font-weight: 600;
          transition: all 0.15s ease;
        }
        .ed-btn-primary { background: var(--ed-primary); color: #fff; }
        .ed-btn-primary:hover { background: var(--ed-primary-dark); }
        .ed-btn-ghost { background: var(--ed-primary-soft); color: var(--ed-primary); }
        .ed-btn-ghost:hover { background: var(--ed-primary-tint); }
        .ed-btn-danger-outline { background: #fff; color: var(--ed-red); border: 1px solid var(--ed-red-tint); }
        .ed-btn-danger-outline:hover { background: var(--ed-red-soft); }

        .ed-detail-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
        .ed-detail-table thead th {
          background: var(--ed-primary-soft);
          color: var(--ed-primary-dark);
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 10px 12px;
          text-align: left;
        }
        .ed-detail-table tbody td {
          padding: 10px 12px;
          font-size: 0.82rem;
          border-bottom: 1px solid #f0f2fa;
        }
        .ed-detail-table tbody tr:nth-child(even) { background: #f8f9fd; }

        @media (max-width: 767px) {
          .ed-field-grid { grid-template-columns: 1fr; }
          .ed-header-stats { width: 100%; margin-left: 0; }
          .ed-search-wrap { margin-left: 0; width: 100%; min-width: 0; }
        }
      `}</style>

      {/* Header */}
      <div className="ed-header">
        <div className="ed-header-icon">
          <i className="bi bi-file-earmark-excel"></i>
        </div>
        <div>
          <h5 className="ed-header-title">Document Expiry</h5>
          <div className="ed-header-sub">Track worker document validity and upcoming renewals</div>
        </div>
        {!loading && !error && (
          <div className="ed-header-stats">
            <span className="ed-stat-pill ed-stat-alert">
              <span className="ed-stat-dot"></span>
              {expiredCount} Expired
            </span>
            <span className="ed-stat-pill">
              <span className="ed-stat-dot"></span>
              {urgentCount} Due in 30 Days
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="ed-tabs">
        <button className={`ed-tab-btn ${activeTab === "expiry" ? "active" : ""}`} onClick={() => setActiveTab("expiry")}>
          <i className="bi bi-list-check"></i>
          Expiry List
        </button>
        <button className={`ed-tab-btn ${activeTab === "board" ? "active" : ""}`} onClick={() => setActiveTab("board")}>
          <i className="bi bi-kanban"></i>
          Document Board
        </button>
      </div>

      {loading && (
        <div className="ed-table-card">
          <div className="ed-loading">
            <div className="ed-spinner"></div>
            <div className="ed-empty-title">Loading document data…</div>
            <div className="ed-empty-sub">Fetching the latest expiry records for your workers.</div>
          </div>
        </div>
      )}

      {error && (
        <div className="ed-alert-error mb-3">
          <i className="bi bi-exclamation-triangle-fill"></i>
          {error}
        </div>
      )}

      {!loading && !error && activeTab === "expiry" && (
        <>
          {/* Toolbar */}
          <div className="ed-toolbar">
            <div className="ed-toolbar-group">
              <select className="ed-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
                {FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {filter === "custom" && (
              <div className="ed-toolbar-group">
                <input type="date" className="ed-date-input" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
                <span className="ed-divider-dot">→</span>
                <input type="date" className="ed-date-input" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
              </div>
            )}

            <div className="ed-search-wrap">
              <i className="bi bi-search"></i>
              <input
                type="text"
                className="ed-search-input"
                placeholder="Search worker, trade, supplier…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button
              className="ed-export-btn"
              onClick={() => {
                if (!canExport) return;
                handleExportExpiryList();
              }}
              disabled={exportingList || filteredRows.length === 0 || !canExport}
              title={!canExport ? "You do not have permission to export this report." : undefined}
            >
              <i className={`bi ${exportingList ? "bi-hourglass-split" : "bi-file-earmark-spreadsheet"}`}></i>
              {exportingList ? "Exporting…" : "Export to Excel"}
            </button>
          </div>

          {/* Table */}
          <div className="ed-table-card">
            <div className="table-responsive" style={{ maxHeight: "62vh" }}>
              <table className="ed-table">
                <thead>
                  <tr>
                    <th>Worker</th>
                    <th>Trade</th>
                    <th>Supplier</th>
                    <th>Document</th>
                    <th>Doc No</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={7}>
                        <div className="ed-empty">
                          <i className="bi bi-inbox"></i>
                          <div className="ed-empty-title">No records found</div>
                          <div className="ed-empty-sub">Try adjusting your filter or search terms.</div>
                        </div>
                      </td>
                    </tr>
                  )}
                  {filteredRows.map((row) => {
                    const status = getStatus(row.daysLeft);
                    return (
                      <tr key={row.id} onClick={() => setSelectedRow(row)}>
                        <td className="ed-row-name">{row.UserName}</td>
                        <td>{row.TradeName}</td>
                        <td>{row.SupplierName}</td>
                        <td>
                          <span className="ed-doc-tag">
                            <i className={`bi ${row.docIcon}`}></i>
                            {row.docLabel}
                          </span>
                        </td>
                        <td className="ed-row-sub">{row.docNo || "-"}</td>
                        <td>{formatDate(row.expiryDate)}</td>
                        <td>
                          <span className={`ed-chip ${status.chip}`}>{status.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && !error && activeTab === "board" && (
        <>
          {/* Document type selector */}
          <div className="ed-doctype-bar">
            {DOC_TYPES.map((dt) => (
              <button
                key={dt.key}
                className={`ed-doctype-btn ${selectedDocType === dt.key ? "active" : ""}`}
                onClick={() => setSelectedDocType(dt.key)}
              >
                <i className={`bi ${dt.icon} me-1`}></i>
                {dt.label}
              </button>
            ))}
            <button
              className="ed-export-btn ed-export-btn-inline"
              onClick={() => {
                if (!canExport) return;
                handleExportDocumentBoard();
              }}
              disabled={exportingBoard || docTypeRows.length === 0 || !canExport}
              title={!canExport ? "You do not have permission to export this report." : undefined}
            >
              <i className={`bi ${exportingBoard ? "bi-hourglass-split" : "bi-file-earmark-spreadsheet"}`}></i>
              {exportingBoard ? "Exporting…" : "Export to Excel"}
            </button>
          </div>

          {/* Status board */}
          <div className="row row-cols-1 row-cols-md-3 row-cols-xl-5 g-3">
            {boardColumns.map((col) => (
              <div className="col" key={col.key}>
                <div className="ed-board-col">
                  <div className="ed-board-col-header">
                    <span className="ed-board-col-title">{col.label}</span>
                    <span className={`ed-count-badge ${col.badge}`}>{col.items.length}</span>
                  </div>
                  <div className="ed-board-col-body" style={{ maxHeight: "58vh" }}>
                    {col.items.length === 0 && <div className="ed-board-empty">No records</div>}
                    {col.items.map((item) => (
                      <button
                        type="button"
                        key={item.UserId}
                        className="ed-worker-card"
                        onClick={() =>
                          setSelectedRow({
                            UserName: item.UserName,
                            TradeName: item.TradeName,
                            SupplierName: item.worker.SupplierName,
                            docLabel: selectedDocConfig.label,
                            docIcon: selectedDocConfig.icon,
                            docNo: item.docNo,
                            expiryDate: item.expiryDate,
                            worker: item.worker,
                          })
                        }
                      >
                        <div className="ed-worker-card-name">{item.UserName}</div>
                        <div className="ed-worker-card-sub">
                          {selectedDocConfig.label}: {formatDate(item.expiryDate)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Quick-info popup */}
      {selectedRow && (
        <div className="ed-modal-backdrop" onClick={() => setSelectedRow(null)}>
          <div className="ed-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ed-modal-head">
              <div className="ed-avatar">{initials(selectedRow.UserName)}</div>
              <div>
                <p className="ed-modal-head-name">{selectedRow.UserName}</p>
                <div className="ed-modal-head-sub">{selectedRow.TradeName}</div>
              </div>
              <button className="ed-modal-close" onClick={() => setSelectedRow(null)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="ed-modal-body">
              <div className="ed-field-grid">
                <div className="ed-field">
                  <label>Supplier</label>
                  <div className="ed-field-value">{selectedRow.SupplierName || "-"}</div>
                </div>
                <div className="ed-field">
                  <label>Trade</label>
                  <div className="ed-field-value">{selectedRow.TradeName || "-"}</div>
                </div>
              </div>

              <div className="ed-doc-highlight">
                <span className="ed-doc-tag">
                  <i className={`bi ${selectedRow.docIcon || "bi-file-earmark-text"}`}></i>
                  {selectedRow.docLabel}: {selectedRow.docNo || "-"}
                </span>
                <span className="ed-field-value">Expires {formatDate(selectedRow.expiryDate)}</span>
              </div>
            </div>
            <div className="ed-modal-footer">
              <button className="ed-btn ed-btn-danger-outline" onClick={() => setSelectedRow(null)}>
                Close
              </button>
              <button
                className="ed-btn ed-btn-primary"
                onClick={() => {
                  setDetailsWorker(selectedRow.worker);
                  setSelectedRow(null);
                }}
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full details modal - all documents for the worker */}
      {detailsWorker && (
        <div className="ed-modal-backdrop" onClick={() => setDetailsWorker(null)}>
          <div className="ed-modal-card ed-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="ed-modal-head">
              <div className="ed-avatar">{initials(detailsWorker.UserName)}</div>
              <div>
                <p className="ed-modal-head-name">{detailsWorker.UserName}</p>
                <div className="ed-modal-head-sub">{detailsWorker.TradeName}</div>
              </div>
              <button className="ed-modal-close" onClick={() => setDetailsWorker(null)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            {/* <div className="ed-modal-body">
              <div className="ed-field-grid mb-3">
                <div className="ed-field">
                  <label>Supplier</label>
                  <div className="ed-field-value">{detailsWorker.SupplierName || "-"}</div>
                </div>
                <div className="ed-field">
                  <label>Mobile</label>
                  <div className="ed-field-value">{detailsWorker.Mobile || "-"}</div>
                </div>
              </div>
              <div className="table-responsive">
                <table className="ed-detail-table"> */}
            <div className="ed-modal-body">
              <div className="ed-field-grid mb-3">
                <div className="ed-field">
                  <label>Supplier</label>
                  <div className="ed-field-value">{detailsWorker.SupplierName || "-"}</div>
                  {detailsWorker.SupplierMobile && (
                    <div className="ed-row-sub mt-1">
                      <i className="bi bi-telephone me-1"></i>
                      {detailsWorker.SupplierMobile}
                    </div>
                  )}
                </div>
                <div className="ed-field">
                  <label>Mobile</label>
                  <div className="ed-field-value">{detailsWorker.Mobile || "-"}</div>
                </div>
              </div>

              <div className="table-responsive mb-3">
                <table className="ed-detail-table">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Code</th>
                      <th>Start Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    
                    {getProjectsArray(detailsWorker).length === 0 && (
                      <tr>
                        <td colSpan={3} className="ed-row-sub">No project allocations</td>
                      </tr>
                    )}
                    {getProjectsArray(detailsWorker).map((p) => (
                      <tr key={p.WorkerAllocationId}>
                        <td>{p.ProjectName || "-"}</td>
                        <td className="ed-row-sub">{p.ProjectCode || "-"}</td>
                        <td>{formatDate(p.AllocationStartDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="table-responsive">
                <table className="ed-detail-table">
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>No.</th>
                      <th>Expiry Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DOC_TYPES.map((dt) => {
                      const expiryDate = detailsWorker[dt.expiryField];
                      if (!expiryDate) return null;
                      const status = getStatus(detailsWorker[dt.daysField]);
                      return (
                        <tr key={dt.key}>
                          <td>
                            <span className="ed-doc-tag">
                              <i className={`bi ${dt.icon}`}></i>
                              {dt.label}
                            </span>
                          </td>
                          <td className="ed-row-sub">{detailsWorker[dt.noField] || "-"}</td>
                          <td>{formatDate(expiryDate)}</td>
                          <td>
                            <span className={`ed-chip ${status.chip}`}>{status.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="ed-modal-footer">
              <button className="ed-btn ed-btn-ghost" onClick={() => setDetailsWorker(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpiryDoc;