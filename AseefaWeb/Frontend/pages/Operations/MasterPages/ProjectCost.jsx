import React, { useState, useEffect } from "react";
import api from "../../apiService";
import { usePermission } from "../../../src/context/permissionContex";

import {
  FaCalculator, FaPlus, FaTrashAlt, FaChevronDown, FaEraser, FaSave,
  FaUsers, FaMoneyBillWave, FaHome, FaBusAlt, FaUtensils, FaIdBadge,
  FaGasPump, FaHeartbeat, FaHardHat, FaBolt, FaSnowflake, FaBed,
  FaWater, FaLayerGroup, FaChartLine, FaArrowUp, FaArrowDown,
  FaTruckMoving, FaClipboardList, FaBuilding, FaPhone, FaLock,
} from "react-icons/fa";

const C = {
  primary: '#2D4BA9',primary10: '#EEF1FB',primary20: '#D5DBEF',surface: '#FFFFFF',bg: '#F4F6FB',
  border: '#DDE2EF',text: '#1C2340',muted: '#6B7399',danger: '#E04055',success: '#27AE60',
  warn: '#F59E0B',
};

const emptyTrade = () => ({
  id: Date.now() + Math.random(),
  Trade: "", Quantity: "", ClientRate: "", SupplierRate: "", Hours: "",
});

const emptyProjectCosts = () => ({
  Accomodation: "", Transportation: "", Food: "",GatePass: "", Fuel: "", MedicalInsurance: "", SafetyEquipment: "",
  Electricity: "", AC: "", Bed: "", Sewage: "",OverHead: "", CampRunningCost: "",
});

const emptySupplier = () => ({
  id: Date.now() + Math.random(),
  SupplierID: "",
  SupplierName: "",
  RoleID: "",
  Trade: "",
  NoOfEmployees: "",
  HourlyRate: "",
  MonthlyRate: "",
});
const sanitizeTrades = (trades) =>
  trades
    .filter(t => t.Trade) // drop rows where no trade was even selected
    .map(t => ({
      ...t,
      Quantity: t.Quantity === "" ? 0 : Number(t.Quantity),
      ClientRate: t.ClientRate === "" ? 0 : Number(t.ClientRate),
      SupplierRate: t.SupplierRate === "" ? 0 : Number(t.SupplierRate),
      Hours: t.Hours === "" ? 0 : Number(t.Hours),
    }));

const n = (v) => (v === "" || v === null || v === undefined || isNaN(Number(v)) ? 0 : Number(v));
const fmt = (v) =>
  `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 0 })}`;

function computeTrade(t) {
  const qty = n(t.Quantity);
  const hours = n(t.Hours);
  const revenue = qty * n(t.ClientRate) * hours;
  const supplierCost = qty * n(t.SupplierRate) * hours;
  const grossMargin = revenue - supplierCost;
  const hourlyCost = hours > 0 ? supplierCost / hours : 0;
  const hourlyCostPerEmployee = qty > 0 ? hourlyCost / qty : 0;
  return { qty, hours, revenue, supplierCost, grossMargin, hourlyCost, hourlyCostPerEmployee };
}

const inputStyle = {
  width: "100%", padding: "8px 11px", fontSize: 13, color: C.text,
  border: `1.5px solid ${C.border}`, borderRadius: 7, outline: "none",
  background: C.surface, transition: "border-color 0.15s", boxSizing: "border-box",
};

function SectionCard({ icon: Icon, title, children, right }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 10, overflow: "hidden", marginBottom: 16
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
        padding: "10px 16px", borderBottom: `1px solid ${C.border}`,
        background: C.primary10
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon size={13} color={C.primary} />
          <span style={{
            fontSize: 12, fontWeight: 700, color: C.primary,
            letterSpacing: "0.05em", textTransform: "uppercase"
          }}>{title}</span>
        </div>
        {right}
      </div>
      <div style={{ padding: "14px 16px 8px" }}>{children}</div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 600,
        color: C.muted, marginBottom: 4, letterSpacing: "0.03em", textTransform: "uppercase"
      }}>
        {label}{required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{
        ...inputStyle,
        ...(focused ? { borderColor: C.primary } : {}),
        ...props.style
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function ActionBtn({ icon: Icon, label, onClick, disabled, variant = "outline" }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6,padding: "8px 18px", fontSize: 13, fontWeight: 600, borderRadius: 7,
    cursor: disabled ? "not-allowed" : "pointer",border: `1.5px solid ${C.primary}`, transition: "all 0.15s",
    whiteSpace: "nowrap", opacity: disabled ? 0.5 : 1,
  };
  const styles = variant === "solid"
    ? { ...base, background: C.primary, color: "#fff" }: { ...base, background: "transparent", color: C.primary };

  return (
    <button type="button" style={styles} onClick={onClick} disabled={disabled}>
      <Icon size={12} />{label}
    </button>
  );
}

function StatCard({ label, value, danger, positive, sub }) {
  return (
    <div style={{
      background: danger ? "#FFF2F2" : positive ? "#EEF9F1" : C.bg,
      border: `1px solid ${danger ? "#F6D2D6" : positive ? "#CBEBD4" : C.border}`,
      borderRadius: 8,
      padding: "10px 12px"
    }}>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: danger ? C.danger : positive ? C.success : C.text, marginTop: 2 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Trade card — ONLY the core row now (Trade/Qty/Rates/Hours) ────
// Expense fields moved out to shared project-level sections below.
function TradeCard({ trade, index, onChange, onRemove, canRemove, roleList = [], usedTrades = [] }) {
  const [expanded, setExpanded] = useState(true);
  const update = (field, val) => onChange(index, { ...trade, [field]: val });
  const calc = computeTrade(trade);

  const numField = (label, key, placeholder = "0") => (
    <Field label={label}>
      <Input type="number" min="0" step="0.01" value={trade[key]}
        onChange={e => update(key, e.target.value)} placeholder={placeholder} />
    </Field>
  );
  const availableRoles = roleList.filter(
    r => r.RoleName === trade.Trade || !usedTrades.includes(r.RoleName)
  );

  return (
    <div style={{
      background: C.surface, border: `1.5px solid ${C.border}`,
      borderRadius: 10, marginBottom: 12, overflow: "hidden"
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", background: C.primary10, cursor: "pointer"
      }} onClick={() => setExpanded(e => !e)}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <FaUsers size={13} color={C.primary} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
            {trade.Trade || `Trade ${index + 1}`}
          </span>
          <span style={{ fontSize: 11, color: C.muted }}>
            Qty {calc.qty || 0} · {calc.hours || 0} hrs
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
            background: calc.grossMargin >= 0 ? "#E7F6EC" : "#FFEAEC",
            color: calc.grossMargin >= 0 ? C.success : C.danger
          }}>
            {calc.grossMargin >= 0 ? "Margin " : "Loss "}{fmt(Math.abs(calc.grossMargin))}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {canRemove && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(index); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: C.danger }}>
              <FaTrashAlt size={12} />
            </button>
          )}
          <FaChevronDown size={11} color={C.muted}
            style={{ transform: `rotate(${expanded ? 180 : 0}deg)`, transition: "transform 0.2s" }} />
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "14px 16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "0 12px" }}>
            <Field label="Trade">
              <select
                style={inputStyle}
                value={trade.Trade}
                onChange={e => update("Trade", e.target.value)}
              >
                <option value="">— Select Trade —</option>
                {availableRoles.map(r => (
                  <option key={r.RoleID} value={r.RoleName}>{r.RoleName}</option>
                ))}
              </select>
            </Field>
            {numField("Quantity", "Quantity")}
            {numField("Client Rate", "ClientRate")}
            {numField("Supplier Rate", "SupplierRate")}
            {numField("Hours", "Hours")}
          </div>

          {/* Live per-trade result strip */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8,
            marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.border}`
          }}>
            <StatCard label="Revenue" value={fmt(calc.revenue)} />
            <StatCard label="Supplier Cost" value={fmt(calc.supplierCost)} />
            <StatCard label="Gross Margin" value={fmt(calc.grossMargin)} danger={calc.grossMargin < 0} positive={calc.grossMargin >= 0} />
            <StatCard label="Hourly Cost / Emp" value={fmt(calc.hourlyCostPerEmployee)} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Supplier row ────────────────────────────────────────────────
function SupplierRow({ supplier, index, onChange, onRemove, supplierList = [], roleList = [], usedSupplierIDs = [] }) {
  const update = (field, val) => onChange(index, { ...supplier, [field]: val });

  const availableSuppliers = supplierList.filter(
    s => String(s.AccountID) === String(supplier.SupplierID) || !usedSupplierIDs.includes(String(s.AccountID))
  );

  const handleSupplierChange = (e) => {
    const id = e.target.value;
    const found = supplierList.find(s => String(s.AccountID) === id);
    onChange(index, { ...supplier, SupplierID: id, SupplierName: found ? found.AccountName : "" });
  };

  const handleTradeChange = (e) => {
    const id = e.target.value;
    const found = roleList.find(r => String(r.RoleID) === id);
    onChange(index, { ...supplier, RoleID: id, Trade: found ? found.RoleName : "" });
  };

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1.4fr 1fr 0.8fr 0.8fr 0.8fr auto",
      gap: 8, alignItems: "center", padding: "9px 12px",
      background: C.surface, border: `1.5px solid ${C.border}`,
      borderRadius: 8, marginBottom: 8,
    }}>
      <select style={inputStyle} value={supplier.SupplierID} onChange={handleSupplierChange}>
        <option value="">— Select Supplier —</option>
        {availableSuppliers.map(s => (
          <option key={s.AccountID} value={s.AccountID}>{s.AccountName}</option>
        ))}
      </select>
      <select style={inputStyle} value={supplier.RoleID} onChange={handleTradeChange}>
        <option value="">— Select Trade —</option>
        {roleList.map(r => (
          <option key={r.RoleID} value={r.RoleID}>{r.RoleName}</option>
        ))}
      </select>
      <Input type="number" min="0" value={supplier.NoOfEmployees} onChange={e => update("NoOfEmployees", e.target.value)} placeholder="No. of Emp" />
      <Input type="number" min="0" value={supplier.HourlyRate} onChange={e => update("HourlyRate", e.target.value)} placeholder="Hourly Rate" />
      <Input type="number" min="0" value={supplier.MonthlyRate} onChange={e => update("MonthlyRate", e.target.value)} placeholder="Monthly Rate" />
      <button type="button" onClick={onRemove}
        style={{ background: "none", border: "none", cursor: "pointer", color: C.danger, padding: 4 }}>
        <FaTrashAlt size={12} />
      </button>
    </div>
  );
}
// ════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
function ProjectCost({ estimationId = null }) {
  const [trades, setTrades] = useState([emptyTrade()]);
  const [suppliers, setSuppliers] = useState([emptySupplier()]);
  const [commission, setCommission] = useState("");
  const [projectName, setProjectName] = useState("");
  const [activeTab, setActiveTab] = useState("data");

  // ── Client / Project selection (top of Trade-wise Cost Input) ──
  const [clientID, setClientID] = useState("");
  const [projectID, setProjectID] = useState("");
  const [clientList, setClientList] = useState([]);
  const [projectList, setProjectList] = useState([]);

  // ── Shared project-level expense inputs (entered once) ──
  const [projectCosts, setProjectCosts] = useState(emptyProjectCosts());
  const updateProjectCost = (key, val) => setProjectCosts(p => ({ ...p, [key]: val }));

  // ── Persistence / submission-lock state ──
  const [estimationID, setEstimationID] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState(1); // 1 = editable, 0 = locked
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(!!estimationId);       // full-page, initial load only
  const [checkingProject, setCheckingProject] = useState(false); // inline, on project selection
  const isLocked = submissionStatus === 0;
  const [roleList, setRoleList] = useState([]);
  const { getPermission, refreshPermissions } = usePermission();
  const permission = getPermission("PROJECT_COST");
  const canView = !!permission?.CanView;
  const canAdd = !!permission?.CanAdd;
  const canEdit = !!permission?.CanEdit;
  const canDelete = !!permission?.CanDelete;
  useEffect(() => {
    refreshPermissions();
  }, []);
  useEffect(() => {
    if (!canView) return;
    api.get('/api/GetRoleList', { params: { CompanyID: sessionStorage.getItem("CompanyID") } })
      .then(res => setRoleList(res.data || []))
      .catch(() => { });
  }, []);
  const [supplierList, setSupplierList] = useState([]);
useEffect(() => {
  api.get(`/api/GetSuppliers/${sessionStorage.getItem("CompanyID")}`)
    .then(res => setSupplierList(res.data.suppliers || []))
    .catch(() => {});
}, []);


  const applyEstimationData = (d) => {
    setEstimationID(d.EstimationID);
    setProjectName(d.ProjectName || "");
    setCommission(d.Commission ?? "");
    setSubmissionStatus(d.SubmissionStatus === false || d.SubmissionStatus === 0 ? 0 : 1);
    setTrades(
      (d.trades || []).map(t => ({
        id: t.TradeDetailID ?? (Date.now() + Math.random()),
        Trade: t.Trade || "",
        Quantity: t.Quantity ?? "",
        ClientRate: t.ClientRate ?? "",
        SupplierRate: t.SupplierRate ?? "",
        Hours: t.Hours ?? "",
      }))
    );

    const pc = d.projectCosts || {};
    setProjectCosts({
      Accomodation: pc.Accomodation ?? "", Transportation: pc.Transportation ?? "", Food: pc.Food ?? "",
      GatePass: pc.GatePass ?? "", Fuel: pc.Fuel ?? "", MedicalInsurance: pc.MedicalInsurance ?? "",
      SafetyEquipment: pc.SafetyEquipment ?? "", Electricity: pc.Electricity ?? "", AC: pc.AC ?? "",
      Bed: pc.Bed ?? "", Sewage: pc.Sewage ?? "", OverHead: pc.OverHead ?? "", CampRunningCost: pc.CampRunningCost ?? "",
    });

    setSuppliers(
  (d.suppliers || []).map(s => ({
    id: s.SupplierDetailID ?? (Date.now() + Math.random()),
    SupplierID: s.SupplierID ?? "",
    SupplierName: s.SupplierName || "",
    RoleID: s.RoleID ?? "",
    Trade: s.Trade || "",
    NoOfEmployees: s.NoOfEmployees ?? "",
    HourlyRate: s.HourlyRate ?? "",
    MonthlyRate: s.MonthlyRate ?? "",
  }))
);
  };

  // ── Reset to a blank draft — used when a selected project has no saved estimation ──
  const resetDraft = () => {
    setEstimationID(null);
    setSubmissionStatus(1);
    setProjectName("");
    setCommission("");
    setTrades([emptyTrade()]);
    setSuppliers([emptySupplier()]);
    setProjectCosts(emptyProjectCosts());
  };

  // ── Load an existing (draft or submitted) estimation, if an id was passed in ──
  useEffect(() => {
    if (!estimationId) return;
    setLoading(true);
    api.get(`/api/GetProjectEstimationDetails/${estimationId}`)
      .then(res => {
        const d = res.data;
        if (!d.success) { alert(d.message || "Estimation not found."); return; }
        setClientID(String(d.ClientID));
        setProjectID(String(d.ProjectID));
        applyEstimationData(d);
      })
      .catch(err => {
        console.error("Load estimation failed:", err);
        alert(err.response?.data?.message || "Failed to load estimation.");
      })
      .finally(() => setLoading(false));
  }, [estimationId]);

  useEffect(() => {
    if (estimationId) return;          // already handled by the effect above
    if (!clientID || !projectID) return;

    let cancelled = false;
    setCheckingProject(true);
    api.get("/api/GetProjectEstimationByProject", {
      params: {
        CompanyID: sessionStorage.getItem("CompanyID"),
        ClientID: clientID,
        ProjectID: projectID,
      },
    })
      .then(res => {
        if (cancelled) return;
        const d = res.data;
        if (d.success && d.exists) {
          applyEstimationData(d);
        } else {
          resetDraft(); // no saved estimation for this project yet — start fresh
        }
      })
      .catch(err => {
        console.error("GetProjectEstimationByProject failed:", err);
        // Non-fatal: fall back to a blank draft rather than blocking the user
        if (!cancelled) resetDraft();
      })
      .finally(() => { if (!cancelled) setCheckingProject(false); });

    return () => { cancelled = true; };
  }, [clientID, projectID, estimationId]);

  // fetch clients once on mount
  useEffect(() => {
    api.get(`/api/GetCustomers/${sessionStorage.getItem("CompanyID")}`)
      .then(res => setClientList(res.data.customers || []))
      .catch(() => { });
  }, []);

  // fetch projects when client changes
  useEffect(() => {
    if (!clientID) { setProjectList([]); setProjectID(""); return; }
    api.get('/api/getprojectsbyclient', { params: { ClientID: clientID, CompanyId: sessionStorage.getItem("CompanyID") } })
      .then(res => setProjectList(res.data.projects || []))
      .catch(() => { });
  }, [clientID]);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const addTrade = () => setTrades(p => [...p, emptyTrade()]);
  const updateTrade = (idx, updated) => setTrades(p => p.map((t, i) => i === idx ? updated : t));
  const removeTrade = (idx) => setTrades(p => p.filter((_, i) => i !== idx));

  const addSupplier = () => setSuppliers(p => [...p, emptySupplier()]);
  const updateSupplier = (idx, updated) => setSuppliers(p => p.map((s, i) => i === idx ? updated : s));
  const removeSupplier = (idx) => setSuppliers(p => p.filter((_, i) => i !== idx));

  const handleClear = () => {
    setTrades([emptyTrade()]);
    setSuppliers([emptySupplier()]);
    setCommission("");
    setProjectName("");
    setProjectCosts(emptyProjectCosts());
    setClientID(""); 
    setProjectID("");
    setEstimationID(null);
    setSubmissionStatus(1);
  };
 

  const handleSave = async () => {
    if (!canAdd && !canEdit) {
      alert("You do not have permission to save project cost estimates.");
      return;
    }
    if (!clientID || !projectID) {
      alert("Please select a client and project first.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        EstimationID: estimationID,
        CompanyID: sessionStorage.getItem("CompanyID"),
        ClientID: clientID,
        ProjectID: projectID,
        ProjectName: projectName,
        Commission: commission,
        UserID: sessionStorage.getItem("UserID"),
        Trades: sanitizeTrades(trades),
        ProjectCosts: projectCosts,
        Suppliers: suppliers,
      };
      const res = await api.post("/api/InsertUpdateProjectEstimation", payload);
      setEstimationID(res.data.EstimationID);
    } catch (err) {
      console.error("Save estimation failed:", err);
      alert(err.response?.data?.message || "Failed to save estimation.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!canEdit) {
      alert("You do not have permission to submit project cost estimates.");
      return;
    }
    if (!estimationID) return;
    if (!window.confirm("Submitting will lock this estimation — it can no longer be edited. Continue?")) return;
    setSubmitting(true);
    try {
      const res = await api.post("/api/SubmitProjectEstimation", {
    EstimationID: estimationID,
    UserID: sessionStorage.getItem("UserID"),
  });
  setSubmissionStatus(0);
  if (res.data.emailSent) {
    alert(`Estimation submitted. Notified: ${res.data.emailedTo.join(", ")}`);
  } else {
    alert("Estimation submitted successfully. (Notification email did not send — check with admin.)");
  }
    } catch (err) {
      console.error("Submit estimation failed:", err);
      alert(err.response?.data?.message || "Failed to submit estimation.");
    } finally {
      setSubmitting(false);
    }
  };

  const calcs = trades.map(computeTrade);
  const tradeTotals = calcs.reduce((acc, c) => ({
    qty: acc.qty + c.qty,
    revenue: acc.revenue + c.revenue,
    supplierCost: acc.supplierCost + c.supplierCost,
    grossMargin: acc.grossMargin + c.grossMargin,
  }), { qty: 0, revenue: 0, supplierCost: 0, grossMargin: 0 });

  // Shared (project-level) direct / indirect cost — entered once, not per trade
  const directCost =
    n(projectCosts.Accomodation) + n(projectCosts.Transportation) + n(projectCosts.Food) +
    n(projectCosts.GatePass) + n(projectCosts.Fuel);
  const indirectCost =
    n(projectCosts.MedicalInsurance) + n(projectCosts.SafetyEquipment) + n(projectCosts.Electricity) +
    n(projectCosts.AC) + n(projectCosts.Bed) + n(projectCosts.Sewage) +
    n(projectCosts.OverHead) + n(projectCosts.CampRunningCost);

  const totalCost = tradeTotals.supplierCost + directCost + indirectCost;
  const totalResult = tradeTotals.revenue - totalCost;

  const commissionAmt = n(commission);
  const netProfitLoss = totalResult - commissionAmt;

  if (!canView) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", width: "100%", padding: 24 }}>
        <div className="alert alert-danger">You do not have permission to view Project Cost Estimation.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        background: C.bg, minHeight: "100vh", width: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Inter', 'Segoe UI', sans-serif", color: C.muted, fontSize: 13,
      }}>
        Loading estimation…
      </div>
    );
  }

  const TABS = [
    { key: "data", label: "Trade & Manpower Setup", icon: FaClipboardList, badge: trades.length || undefined },
    { key: "results", label: "Results", icon: FaChartLine },
    { key: "abstract", label: "Abstract", icon: FaLayerGroup },
    { key: "suppliers", label: "Supplier Overview", icon: FaTruckMoving, badge: suppliers.length || undefined },
  ];
  const tabOrder = TABS.map(t => t.key);

  return (
    <div style={{
      background: C.bg, minHeight: "100vh", width: "100%",
      fontFamily: "'Inter', 'Segoe UI', sans-serif", boxSizing: "border-box"
    }}>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 24px", background: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0,
          flexWrap: "wrap", gap: 10
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, background: C.primary, borderRadius: 9,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <FaCalculator size={15} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
                Project Cost Estimation
                {projectName && <span style={{ color: C.muted, fontWeight: 400 }}>— {projectName}</span>}
                {isLocked && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 999,
                    background: "#FFF2E0", color: C.warn, textTransform: "uppercase", letterSpacing: "0.04em"
                  }}>
                    <FaLock size={9} /> Submitted — Locked
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                {trades.length} trades · {tradeTotals.qty} manpower · {fmt(tradeTotals.revenue)} revenue
              </div>
            </div>
          </div>
          <div style={{ minWidth: 220 }}>
            <Input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Project / Estimation name" disabled={isLocked} />
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", borderBottom: `1px solid ${C.border}`,
          background: C.surface, overflowX: "auto", flexShrink: 0
        }}>
          {TABS.map(t => {
            const active = activeTab === t.key;
            return (
              <button key={t.key} type="button"
                onClick={() => setActiveTab(t.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "12px 20px", fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? C.primary : C.muted,
                  background: "transparent", border: "none",
                  borderBottom: active ? `2.5px solid ${C.primary}` : "2.5px solid transparent",
                  cursor: "pointer",
                  whiteSpace: "nowrap", transition: "all 0.15s",
                }}>
                <t.icon size={12} />
                {t.label}
                {t.badge > 0 && (
                  <span style={{
                    background: active ? C.primary : C.muted, color: "#fff",
                    borderRadius: 999, padding: "1px 6px", fontSize: 10, fontWeight: 700
                  }}>{t.badge}</span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{
          flex: 1, overflowY: "auto", padding: "20px 24px",
          opacity: isLocked ? 0.6 : 1,
          pointerEvents: isLocked ? "none" : "auto",
        }}>

          {/* ── TAB: Trade & Manpower Setup ── */}
          {activeTab === "data" && (
            <div>
              {/* Client & Project selectors */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 }}>
                <Field label="Client" required>
                  <select style={inputStyle} value={clientID} onChange={e => setClientID(e.target.value)}>
                    <option value="">— Select Client —</option>
                    {clientList.map(c => <option key={c.AccountID} value={c.AccountID}>{c.AccountName}</option>)}
                  </select>
                </Field>
                <Field label="Project" required>
                  <select style={inputStyle} value={projectID} onChange={e => setProjectID(e.target.value)} disabled={!clientID}>
                    <option value="">— Select Project —</option>
                    {projectList.map(p => <option key={p.UnitID} value={p.UnitID}>{p.UnitName}</option>)}
                  </select>
                </Field>
              </div>
              {checkingProject && (
                <div style={{ fontSize: 12, color: C.primary, marginBottom: 12 }}>
                  Checking for a saved estimation on this project…
                </div>
              )}

              {!projectID ? (
                <div style={{
                  border: `1.5px dashed ${C.border}`, borderRadius: 10, padding: "40px 16px",
                  textAlign: "center", color: C.muted, fontSize: 13
                }}>
                  <FaBuilding size={26} style={{ display: "block", margin: "0 auto 10px", opacity: 0.25 }} />
                  Select a client and project above to start adding trades and cost details.
                </div>
              ) : (
                <>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${C.border}`
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Trade-wise Cost Input</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                        Add each trade with its manpower rates. Shared project expenses are entered once alongside.
                      </div>
                    </div>
                    <button type="button" onClick={addTrade} style={{
                      display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px",
                      fontSize: 12, fontWeight: 700, color: C.primary, background: C.primary10,
                      border: `1px solid ${C.primary20}`, borderRadius: 7, cursor: "pointer", whiteSpace: "nowrap"
                    }}>
                      <FaPlus size={10} /> Add Trade
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>

                    <div>
                      {trades.map((trade, idx) => (
                        <TradeCard
                          key={trade.id}
                          trade={trade}
                          index={idx}
                          onChange={updateTrade}
                          onRemove={removeTrade}
                          canRemove={trades.length > 1}
                          roleList={roleList}
                          usedTrades={trades.filter((_, i) => i !== idx).map(t => t.Trade).filter(Boolean)}
                        />
                      ))}
                    </div>

                    <div>
                      <SectionCard icon={FaHome} title="Monthly Amount">
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
                          <Field label="Accomodation">
                            <Input type="number" min="0" step="0.01" value={projectCosts.Accomodation}
                              onChange={e => updateProjectCost("Accomodation", e.target.value)} placeholder="0" />
                          </Field>
                          <Field label="Transportation">
                            <Input type="number" min="0" step="0.01" value={projectCosts.Transportation}
                              onChange={e => updateProjectCost("Transportation", e.target.value)} placeholder="0" />
                          </Field>
                          <Field label="Food">
                            <Input type="number" min="0" step="0.01" value={projectCosts.Food}
                              onChange={e => updateProjectCost("Food", e.target.value)} placeholder="0" />
                          </Field>
                        </div>
                      </SectionCard>

                      <SectionCard icon={FaIdBadge} title="One Time Expenses (Total Monthly Cost)">
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0 12px" }}>
                          <Field label="Gate Pass">
                            <Input type="number" min="0" step="0.01" value={projectCosts.GatePass}
                              onChange={e => updateProjectCost("GatePass", e.target.value)} placeholder="0" />
                          </Field>
                          <Field label="Fuel">
                            <Input type="number" min="0" step="0.01" value={projectCosts.Fuel}
                              onChange={e => updateProjectCost("Fuel", e.target.value)} placeholder="0" />
                          </Field>
                          <Field label="Medical Insurance">
                            <Input type="number" min="0" step="0.01" value={projectCosts.MedicalInsurance}
                              onChange={e => updateProjectCost("MedicalInsurance", e.target.value)} placeholder="0" />
                          </Field>
                          <Field label="Safety Equipment">
                            <Input type="number" min="0" step="0.01" value={projectCosts.SafetyEquipment}
                              onChange={e => updateProjectCost("SafetyEquipment", e.target.value)} placeholder="0" />
                          </Field>
                        </div>
                      </SectionCard>

                      <SectionCard icon={FaSnowflake} title="Own Camp Expenses (Total Monthly Cost)">
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0 12px" }}>
                          <Field label="Electricity">
                            <Input type="number" min="0" step="0.01" value={projectCosts.Electricity}
                              onChange={e => updateProjectCost("Electricity", e.target.value)} placeholder="0" />
                          </Field>
                          <Field label="AC">
                            <Input type="number" min="0" step="0.01" value={projectCosts.AC}
                              onChange={e => updateProjectCost("AC", e.target.value)} placeholder="0" />
                          </Field>
                          <Field label="Bed">
                            <Input type="number" min="0" step="0.01" value={projectCosts.Bed}
                              onChange={e => updateProjectCost("Bed", e.target.value)} placeholder="0" />
                          </Field>
                          <Field label="Sewage">
                            <Input type="number" min="0" step="0.01" value={projectCosts.Sewage}
                              onChange={e => updateProjectCost("Sewage", e.target.value)} placeholder="0" />
                          </Field>
                        </div>
                      </SectionCard>

                      <SectionCard icon={FaBolt} title="Overhead & Camp Running Cost">
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                          <Field label="Over Head">
                            <Input type="number" min="0" step="0.01" value={projectCosts.OverHead}
                              onChange={e => updateProjectCost("OverHead", e.target.value)} placeholder="0" />
                          </Field>
                          <Field label="Camp Running Cost">
                            <Input type="number" min="0" step="0.01" value={projectCosts.CampRunningCost}
                              onChange={e => updateProjectCost("CampRunningCost", e.target.value)} placeholder="0" />
                          </Field>
                        </div>
                      </SectionCard>
                    </div>

                  </div>

                  <SectionCard icon={FaLayerGroup} title="Totals">
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                      <StatCard label="Total Manpower" value={tradeTotals.qty} />
                      <StatCard label="Total Revenue" value={fmt(tradeTotals.revenue)} />
                      <StatCard label="Total Cost" value={fmt(totalCost)} />
                      <StatCard label="Total Result" value={fmt(totalResult)} danger={totalResult < 0} positive={totalResult >= 0} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 10 }}>
                      <StatCard label="Supplier Cost" value={fmt(tradeTotals.supplierCost)} />
                      <StatCard label="Direct Cost (shared)" value={fmt(directCost)} />
                      <StatCard label="Indirect Cost (shared)" value={fmt(indirectCost)} />
                    </div>
                  </SectionCard>
                </>
              )}
            </div>
          )}

          {/* ── TAB: Results ── */}
          {activeTab === "results" && (
            <div>
              <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Cost & Revenue Results</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                  Revenue and supplier cost per trade. Direct/indirect/camp costs are shared project-wide (see totals row).
                </div>
              </div>

              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
                  <thead>
                    <tr style={{ background: C.primary10 }}>
                      {["Trade", "Qty", "Supplier Rate", "Revenue", "Supplier Cost", "Gross Margin"].map(h => (
                        <th key={h} style={{
                          padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700,
                          color: C.primary, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap"
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((t, i) => {
                      const c = calcs[i];
                      return (
                        <tr key={t.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? "#fff" : "#FAFBFD" }}>
                          <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: C.text }}>{t.Trade || `Trade ${i + 1}`}</td>
                          <td style={{ padding: "10px 14px", fontSize: 13, color: C.text }}>{c.qty}</td>
                          <td style={{ padding: "10px 14px", fontSize: 13, color: C.text }}>{fmt(n(t.SupplierRate))}</td>
                          <td style={{ padding: "10px 14px", fontSize: 13, color: C.text }}>{fmt(c.revenue)}</td>
                          <td style={{ padding: "10px 14px", fontSize: 13, color: C.text }}>{fmt(c.supplierCost)}</td>
                          <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: c.grossMargin >= 0 ? C.success : C.danger }}>
                            {c.grossMargin >= 0 ? <FaArrowUp size={10} style={{ marginRight: 4 }} /> : <FaArrowDown size={10} style={{ marginRight: 4 }} />}
                            {fmt(Math.abs(c.grossMargin))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: `2px solid ${C.border}`, background: C.primary10 }}>
                      <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: C.text }}>Totals</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: C.text }}>{tradeTotals.qty}</td>
                      <td style={{ padding: "10px 14px" }} />
                      <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: C.text }}>{fmt(tradeTotals.revenue)}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: C.text }}>{fmt(tradeTotals.supplierCost)}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: tradeTotals.grossMargin >= 0 ? C.success : C.danger }}>
                        {fmt(tradeTotals.grossMargin)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Shared cost + final result summary */}
              <div style={{ marginTop: 16 }}>
                <SectionCard icon={FaLayerGroup} title="Project-wide Result (incl. shared costs)">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                    <StatCard label="Direct Cost" value={fmt(directCost)} />
                    <StatCard label="Indirect Cost" value={fmt(indirectCost)} />
                    <StatCard label="Total Cost" value={fmt(totalCost)} />
                    <StatCard label="Total Result" value={fmt(totalResult)} danger={totalResult < 0} positive={totalResult >= 0} />
                  </div>
                </SectionCard>
              </div>
            </div>
          )}

          {/* ── TAB: Abstract ── */}
          {activeTab === "abstract" && (
            <div>
              <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Abstract Summary</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                  Trade-wise revenue, supplier cost, and hourly cost breakdown.
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginBottom: 16 }}>
                {trades.map((t, i) => {
                  const c = calcs[i];
                  return (
                    <div key={t.id} style={{
                      background: C.surface, border: `1.5px solid ${C.border}`,
                      borderRadius: 10, padding: 14
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 8, background: C.primary,
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                        }}>
                          <FaUsers size={13} color="#fff" />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{t.Trade || `Trade ${i + 1}`}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <StatCard label="Supplier Cost" value={fmt(c.supplierCost)} />
                        <StatCard label="Revenue" value={fmt(c.revenue)} />
                        <StatCard label="Gross Margin" value={fmt(c.grossMargin)} danger={c.grossMargin < 0} positive={c.grossMargin >= 0} />
                        <StatCard label="Hourly Cost" value={fmt(c.hourlyCost)} />
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <StatCard label="Hourly Cost / Employee" value={fmt(c.hourlyCostPerEmployee)} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <SectionCard icon={FaMoneyBillWave} title="Overall Profit & Loss">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
                  <Field label="Commission">
                    <Input type="number" min="0" step="0.01" value={commission}
                      onChange={e => setCommission(e.target.value)} placeholder="0" />
                  </Field>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, paddingTop: 4 }}>
                    <StatCard label="Total Result" value={fmt(totalResult)} danger={totalResult < 0} positive={totalResult >= 0} />
                    <StatCard label="Net Profit / Loss" value={fmt(netProfitLoss)} danger={netProfitLoss < 0} positive={netProfitLoss >= 0}
                      sub="After commission" />
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {/* ── TAB: Supplier Overview ── */}
          {activeTab === "suppliers" && (
            <div>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${C.border}`
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Supplier Overview</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                    Manpower suppliers considered for this project.
                  </div>
                </div>
                <button type="button" onClick={addSupplier} style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px",
                  fontSize: 12, fontWeight: 700, color: C.primary, background: C.primary10,
                  border: `1px solid ${C.primary20}`, borderRadius: 7, cursor: "pointer", whiteSpace: "nowrap"
                }}>
                  <FaPlus size={10} /> Add Supplier
                </button>
              </div>

              <div style={{
                display: "grid", gridTemplateColumns: "1.4fr 1fr 0.8fr 0.8fr 0.8fr auto",
                gap: 8, padding: "0 12px", marginBottom: 8
              }}>
                {["Supplier Name", "Trade", "No of Employees", "Hourly Rate", "Monthly Rate", ""].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.03em", textTransform: "uppercase" }}>{h}</span>
                ))}
              </div>

              {suppliers.length === 0 ? (
                <div style={{
                  border: `1.5px dashed ${C.border}`, borderRadius: 10, padding: "28px 16px",
                  textAlign: "center", color: C.muted, fontSize: 13
                }}>
                  <FaTruckMoving size={24} style={{ display: "block", margin: "0 auto 8px", opacity: 0.25 }} />
                  No suppliers added yet
                </div>
              ) : suppliers.map((s, idx) => (
  <SupplierRow key={s.id} supplier={s} index={idx}
    onChange={updateSupplier} onRemove={() => removeSupplier(idx)}
    supplierList={supplierList}
    roleList={roleList}
    usedSupplierIDs={suppliers.filter((_, i) => i !== idx).map(x => String(x.SupplierID)).filter(Boolean)}
  />
))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 24px", borderTop: `1px solid ${C.border}`,
          background: C.surface, flexShrink: 0, gap: 10, flexWrap: "wrap"
        }}>
          <div style={{ display: "flex", gap: 8 }}>
            <ActionBtn icon={FaEraser} label="Clear" onClick={handleClear} disabled={isLocked} />
            <ActionBtn icon={FaSave} label={saving ? "Saving..." : "Save Estimation"}
              onClick={handleSave} disabled={saving || isLocked || !clientID || !projectID || (!canAdd && !canEdit)} />
            <ActionBtn icon={FaSave} label={submitting ? "Submitting..." : "Submit Estimation"}
              onClick={handleSubmit} variant="solid" disabled={submitting || !estimationID || isLocked || !canEdit} />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {activeTab !== "data" && (
              <button type="button"
                onClick={() => {
                  const idx = tabOrder.indexOf(activeTab);
                  if (idx > 0) setActiveTab(tabOrder[idx - 1]);
                }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 18px", fontSize: 13, fontWeight: 600, borderRadius: 7,
                  border: `1.5px solid ${C.border}`, background: C.surface,
                  color: C.muted, cursor: "pointer"
                }}>
                ← Previous
              </button>
            )}
            {activeTab !== "suppliers" && (
              <button type="button"
                onClick={() => {
                  const idx = tabOrder.indexOf(activeTab);
                  if (idx < tabOrder.length - 1) setActiveTab(tabOrder[idx + 1]);
                }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 18px", fontSize: 13, fontWeight: 600, borderRadius: 7,
                  border: "none", background: C.primary,
                  color: "#fff", cursor: "pointer"
                }}>
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectCost;