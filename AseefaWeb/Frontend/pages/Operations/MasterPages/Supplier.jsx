import React, { useState, useEffect, useRef } from "react";
import api from "../../apiService";
import { ToastContainer, toast } from "react-toastify";
import { usePermission } from "../../../src/context/permissionContex";
import "react-toastify/dist/ReactToastify.css";
import {
  FaSearch, FaPlus, FaTruck, FaUser, FaPhone, FaEnvelope,
  FaMapMarkerAlt, FaSave, FaEdit, FaTrashAlt,
  FaEraser, FaArrowLeft, FaTimesCircle, FaPaperclip, FaEye,
  FaDownload, FaIdCard, FaUsers, FaFileInvoice, FaToggleOn, FaToggleOff
} from "react-icons/fa";

const C = {
  primary: '#2D4BA9',
  primary10: '#EEF1FB',
  primary20: '#D5DBEF',
  surface: '#FFFFFF',
  bg: '#F4F6FB',
  border: '#DDE2EF',
  text: '#1C2340',
  muted: '#6B7399',
  danger: '#E04055',
  success: '#27AE60',
  warn: '#F59E0B',
};
// Keep these as aliases so nothing else in the file breaks:
const PRIMARY = C.primary;
const PRIMARY_LIGHT = C.primary10;
const PRIMARY_BORDER = C.primary20;

// ── tiny helpers ──────────────────────────────────────────────────────────
const normalizeDate = (d) => (!d ? "" : d.split("T")[0]);

const parsePhones = (phones, fallbackMob = "") => {
  if (Array.isArray(phones) && phones.length > 0)
    return phones.map(p => ({ name: p.name || '', number: p.number || '', label: p.label || 'Mobile' }));
  if (typeof phones === "string") {
    try {
      const p = JSON.parse(phones);
      if (Array.isArray(p) && p.length > 0)
        return p.map(ph => ({ name: ph.name || '', number: ph.number || '', label: ph.label || 'Mobile' }));
    } catch { }
  }
  return [{ name: '', number: fallbackMob || '', label: 'Mobile' }];
};

// Generic array-of-JSON parser used for Sponsors / SubSponsors
const parseJsonArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const p = JSON.parse(val);
      if (Array.isArray(p)) return p;
    } catch { }
  }
  return [];
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";
}

// ── sub-components ────────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#64748b", marginBottom: 5, letterSpacing: "0.1px" }}>
        {label}{required && <span style={{ color: "#e53e3e", marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function SectionCard({ icon: Icon, title, children, headerRight }) {
  return (
    <div style={{ borderRadius: 12, border: "0.5px solid var(--color-border-tertiary, #e2e8f0)", background: "#fff", overflow: "hidden" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 16px", borderBottom: "0.5px solid #e2e8f0",
        background: "#fafbfd"
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 500, color: PRIMARY, fontSize: 13, letterSpacing: "0.2px" }}>
          <Icon size={13} />{title}
        </span>
        {headerRight}
      </div>
      <div style={{ padding: "16px" }}>{children}</div>
    </div>
  );
}

function ExpiryBadge({ dateStr }) {
  if (!dateStr) return null;
  const days = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  const [bg, color, label] =
    days < 0  ? ["#fee2e2", "#991b1b", "Expired"] :
    days < 30 ? ["#fef3c7", "#92400e", `${days}d`] :
                ["#dcfce7", "#166534", "Valid"];
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color, background: bg, borderRadius: 99, padding: "2px 7px", marginLeft: 5, letterSpacing: "0.3px" }}>
      {label}
    </span>
  );
}

function EmptyState({ onCreateNew }) {
  return (
    <tr>
      <td colSpan="8" className="text-center p-5">
        <FaTruck className="mb-3" style={{ fontSize: 48, color: "#cbd5e0" }} />
        <p className="text-muted mb-3">No suppliers found</p>
        <button
          className="btn"
          onClick={onCreateNew}
          style={{
            borderRadius: 5, padding: "10px 24px",
            background: PRIMARY, border: "none", color: "white", fontSize: 14
          }}
        >
          <FaPlus className="me-2" />Create New Supplier
        </button>
      </td>
    </tr>
  );
}

// Small reusable "attach with free-typed name" row used by the
// supplier-level Attachments panel (both LPO and Other sections),
// and by the per-person (sponsor / sub-sponsor) document panels.
function NamedAttachInput({ placeholder, onAttach }) {
  const [docName, setDocName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef(null);

  const commit = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    if (!docName.trim()) {
      toast.warning("Enter a document name first");
      return;
    }
    onAttach(files, docName.trim());
    setDocName("");
  };

  const triggerPick = () => {
    if (!docName.trim()) {
      toast.warning("Enter a document name first");
      return;
    }
    fileRef.current?.click();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    commit(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `1.5px dashed ${isDragging ? PRIMARY : "transparent"}`,
        borderRadius: 8,
        background: isDragging ? PRIMARY_LIGHT : "transparent",
        padding: isDragging ? "6px 6px 2px" : "0",
        marginBottom: isDragging ? 4 : 0,
        transition: "all 0.12s"
      }}
    >
      <div className="d-flex gap-2 mb-2">
        <input
          className="form-control form-control-sm"
          placeholder={placeholder}
          value={docName}
          onChange={(e) => setDocName(e.target.value)}
          style={{ fontSize: 12 }}
        />
        <button
          type="button"
          onClick={triggerPick}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 12, padding: "4px 12px", whiteSpace: "nowrap",
            border: `1px solid ${PRIMARY}`, color: PRIMARY,
            background: PRIMARY_LIGHT, borderRadius: 5, cursor: "pointer"
          }}
        >
          <FaPaperclip size={11} /> Attach
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={(e) => { commit(e.target.files); e.target.value = ""; }}
        />
      </div>
      {isDragging ? (
        <div style={{ fontSize: 11, color: PRIMARY, textAlign: "center", paddingBottom: 6 }}>
          {docName.trim()
            ? `Drop to attach as "${docName.trim()}"`
            : "Enter a document name first, then drop"}
        </div>
      ) : (
        <div style={{ fontSize: 10.5, color: "#a0aec0", marginTop: -4, marginBottom: 6 }}>
          or drag & drop files here
        </div>
      )}
    </div>
  );
}

// Compact document row shown inside sponsor / sub-sponsor cards and the
// supplier-level Attachments panel. Shows Saved/New badge + remove button.
function DocRow({ doc, onRemove, onPreview }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
      border: `0.5px solid ${doc.AttachmentID ? "#e2e8f0" : "#fde68a"}`,
      borderRadius: 8, background: doc.AttachmentID ? "#fafbfd" : "#fffbeb",
      marginBottom: 6
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
        background: PRIMARY_LIGHT, display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <FaPaperclip size={11} style={{ color: PRIMARY }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#1e293b" }}>
          {doc.docName || doc.name}
        </div>
        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>
          {doc.AttachmentID ? "Saved" : "Pending upload"}
        </div>
      </div>
      <span style={{
        fontSize: 9, borderRadius: 99, padding: "2px 7px", fontWeight: 600, letterSpacing: "0.3px",
        background: doc.AttachmentID ? "#dcfce7" : "#fef3c7",
        color: doc.AttachmentID ? "#166534" : "#92400e",
      }}>
        {doc.AttachmentID ? "Saved" : "New"}
      </span>
      {onPreview && (
        <button type="button" onClick={() => onPreview(doc)}
          style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "0 2px", lineHeight: 1 }}>
          <FaEye size={12} />
        </button>
      )}
      <button type="button" onClick={() => onRemove(doc)}
        style={{ background: "none", border: "none", color: "#fca5a5", cursor: "pointer", padding: "0 2px", lineHeight: 1 }}>
        <FaTimesCircle size={12} />
      </button>
    </div>
  );
}

// ── empty state ───────────────────────────────────────────────────────────
const EMPTY_SUPPLIER = {
  AccountID: 0, AcHeadId: 0,
  Name: "", Address: "", Email: "",
  Phones: [{ name: "", number: "", label: "Mobile" }],
  City: "", Country: "",
  TinNo: "", VatNo: "", VatExpiry: "", GSTinNo: "",
  EIDNo: "",
  ProjectIDs: [],
  EmiratesIDExpiry: "",
  TradeLicenceNo: "", TradeLicenceExpiry: "",
  PassportNo: "", PassportExpiry: "",
  IsActive: 1,
  Sponsors: [],
  SubSponsors: [],
  Attachments: []
};

const EMPTY_SPONSOR = () => ({
  id: Date.now() + Math.random(),
  Key: null,
  name: "", EID: "", EIDExpiry: "",
  Attachments: []
});

const EMPTY_SUBSPONSOR = () => ({
  id: Date.now() + Math.random(),
  Key: null,
  name: "", contact: "", EID: "",
  Attachments: []
});

// derive base URL from the same axios instance so it works in dev & prod
const BASE_URL = api.defaults.baseURL || "";

const attachmentUrl = (storagePath) => {
  if (!storagePath) return "";
  if (storagePath.startsWith("http")) return storagePath;
  return `${BASE_URL}${storagePath}`;
};

// ═════════════════════════════════════════════════════════════════════════
function Supplier() {
  const [supplier, setSupplier] = useState(EMPTY_SUPPLIER);
  const [supplierList, setSupplierList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);
  const [isDeleteDisabled, setIsDeleteDisabled] = useState(true);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [deletedAttachmentIDs, setDeletedAttachmentIDs] = useState([]);
  const { getPermission, refreshPermissions } = usePermission();
  const permission = getPermission("SUPPLIER");
  const canView = !!permission?.CanView;
  const canAdd = !!permission?.CanAdd;
  const canEdit = !!permission?.CanEdit;
  const canDelete = !!permission?.CanDelete;
  // Tracks AttachmentIDs removed from sponsor / sub-sponsor document panels,
  // queued for soft-delete on save just like the top-level attachments.
  const [deletedSponsorAttachmentIDs, setDeletedSponsorAttachmentIDs] = useState([]);
  const [deletedSubSponsorAttachmentIDs, setDeletedSubSponsorAttachmentIDs] = useState([]);
  const [countryList, setCountryList] = useState([]);
const [stateList, setStateList] = useState([]);
const [loadingStates, setLoadingStates] = useState(false);
const [emiratesIDs, setEmiratesIDs] = useState([{ name: '', number: '', expiry: '' }]);
const [passports, setPassports] = useState([{ name: '', number: '', expiry: '' }]);
const [activeTab, setActiveTab] = useState("basic");

  const fileInputRef = useRef(null);
const API_KEY = '00dd47d2e22c4448871f7a6695224488df68502d3c8e17845bbcb815c81fc42d';
const CSC_HEADERS = { "X-CSCAPI-KEY": API_KEY };
  useEffect(() => {
    refreshPermissions();
  }, []);

  useEffect(() => {
    if (!canView) {
      setSupplierList([]);
      setShowForm(false);
      return;
    }
    fetchSuppliers();
  }, [canView]);

  useEffect(() => {
  fetch("https://api.countrystatecity.in/v1/countries", { headers: CSC_HEADERS })
    .then(r => r.json())
    .then(data => setCountryList(data.sort((a, b) => a.name.localeCompare(b.name))))
    .catch(() => toast.error("Failed to load countries"));
}, []);

  // ── fetch list ─────────────────────────────────────────────────────────
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/GetSuppliers/${sessionStorage.getItem("CompanyID")}`);
      setSupplierList(res.data.suppliers || []);
    } catch {
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  // ── fetch attachments for a supplier / sponsor / sub-sponsor ───────────
  // ownerType + ownerKey let one endpoint serve supplier-level, sponsor-level
  // and sub-sponsor-level documents. supplierID is always required by the
  // route (used for the WHERE SupplierID = ... scoping); ownerKey is the
  // sponsor/sub-sponsor's stable Key string when fetching their documents.
  const fetchAttachments = async (supplierID, ownerType = "supplier", ownerKey = null) => {
    try {
      const res = await api.get(`/api/GetSupplierAttachments/${supplierID}`, {
        params: { ownerType, ownerKey: ownerKey ?? supplierID }
      });
      return (res.data.attachments || []).map((a) => ({
        id: a.AttachmentID,
        AttachmentID: a.AttachmentID,
        name: a.FileName,
        docName: a.DocName || a.FileName,   // free-typed name, falls back to filename
        url: attachmentUrl(a.StoragePath),
        type: a.FileType,
        isLPO: !!a.IsLPO,
        file: null
      }));
    } catch {
      return [];
    }
  };

  // ── state helpers ──────────────────────────────────────────────────────
  const set = (key, value) => setSupplier((prev) => ({ ...prev, [key]: value }));
  const handleInputChange = (e) => set(e.target.name, e.target.value);
  const handleCountryChange = async (e) => {
  const selected = countryList.find(c => c.name === e.target.value);
  set("Country", selected?.name || "");
  setStateList([]);
  if (!selected) return;
  try {
    setLoadingStates(true);
    const res = await fetch(
      `https://api.countrystatecity.in/v1/countries/${selected.iso2}/states`,
      { headers: CSC_HEADERS }
    );
    const data = await res.json();
    setStateList(data.sort((a, b) => a.name.localeCompare(b.name)));
  } catch {
    toast.error("Failed to load states");
  } finally {
    setLoadingStates(false);
  }
};

const handleClear = () => {
  setSupplier(EMPTY_SUPPLIER);
  setIsSubmitDisabled(false);
  setIsUpdateDisabled(true);
  setIsDeleteDisabled(true);
  setDeletedAttachmentIDs([]);
  setDeletedSponsorAttachmentIDs([]);
  setDeletedSubSponsorAttachmentIDs([]);
  setEmiratesIDs([{ name: '', number: '', expiry: '' }]);
setPassports([{ name: '', number: '', expiry: '' }]);
  toast.dismiss();

};

  const handleCreateNew = () => {
  if (!canAdd) {
    toast.error("You do not have permission to create suppliers.");
    return;
  }
  handleClear();
  setIsSubmitDisabled(false);
  setIsUpdateDisabled(true);
  setIsDeleteDisabled(true);
  setShowForm(true);
};
  const handleBackToList = () => { setShowForm(false); handleClear(); }; 

  // ── row click ──────────────────────────────────────────────────────────
  const handleRowClick = async (item) => {
    if (!canView) {
      toast.error("You do not have permission to view suppliers.");
      return;
    }

    const attachments = await fetchAttachments(item.AccountID, "supplier");

    
    const sponsors = parseJsonArray(item.Sponsors).map((s) => ({
      id: s.Key || Date.now() + Math.random(),
      Key: s.Key || null,
      name: s.name || s.Name || "",
      EID: s.EID || "",
      EIDExpiry: normalizeDate(s.EIDExpiry),
      Attachments: []
    }));
    const subSponsors = parseJsonArray(item.SubSponsors).map((s) => ({
      id: s.Key || Date.now() + Math.random(),
      Key: s.Key || null,
      name: s.name || s.Name || "",
      contact: s.contact || s.Contact || "",
      EID: s.EID || "",
      Attachments: []
    }));
  setEmiratesIDs(
  item.EmiratesIDs
    ? (() => { try { return JSON.parse(item.EmiratesIDs); } catch { return [{ name: '', number: item.EIDNo || '', expiry: normalizeDate(item.EmiratesIDExpiry) }]; } })()
    : [{ name: '', number: item.EIDNo || '', expiry: normalizeDate(item.EmiratesIDExpiry) }]
);
setPassports(
  item.Passports
    ? (() => { try { return JSON.parse(item.Passports); } catch { return [{ name: '', number: item.PassportNo || '', expiry: normalizeDate(item.PassportExpiry) }]; } })()
    : [{ name: '', number: item.PassportNo || '', expiry: normalizeDate(item.PassportExpiry) }]
);

    // Fetch documents for each sponsor / sub-sponsor that already has a Key
    // (i.e. was saved on a previous submit, so the backend assigned one)
    await Promise.all(sponsors.map(async (sp) => {
      if (sp.Key) sp.Attachments = await fetchAttachments(item.AccountID, "sponsor", sp.Key);
    }));
    await Promise.all(subSponsors.map(async (ss) => {
      if (ss.Key) ss.Attachments = await fetchAttachments(item.AccountID, "subsponsor", ss.Key);
    }));

    setSupplier({
      AccountID: item.AccountID,
      AcHeadId: Number(item.AcHeadId || item.AcHeadNo) || 0,
      Name: item.AccountName,
      Address: item.Address || "",
      Email: item.Email || "",
      Phones: parsePhones(item.Phones, item.Mob),
      City: item.city || "",
      Country: item.country || "",
      TinNo: item.TinNo || "",
      VatNo: item.vatNo || item.VatNo || "",
      VatExpiry: normalizeDate(item.VatExpiry),
      GSTinNo: item.GSTinNo || "",
      EIDNo: item.EIDNo || "",
      ProjectIDs: item.ProjectIDs || [],
      EmiratesIDExpiry: normalizeDate(item.EmiratesIDExpiry),
      TradeLicenceNo: item.TradeLicenceNo || "",
      TradeLicenceExpiry: normalizeDate(item.TradeLicenceExpiry),
      PassportNo: item.PassportNo || "",
      PassportExpiry: normalizeDate(item.PassportExpiry),
      IsActive: (item.Status === 0 || item.IsActive === 0) ? 0 : 1,
      Sponsors: sponsors,
      SubSponsors: subSponsors,
      Attachments: attachments
    });
    // Load states for the selected country on row click
const foundCountry = countryList.find(c => c.name === item.country);
if (foundCountry?.iso2) {
  setLoadingStates(true);
  fetch(
    `https://api.countrystatecity.in/v1/countries/${foundCountry.iso2}/states`,
    { headers: CSC_HEADERS }
  )
    .then(r => r.json())
    .then(data => setStateList(data.sort((a, b) => a.name.localeCompare(b.name))))
    .catch(() => {})
    .finally(() => setLoadingStates(false));
}
    setDeletedAttachmentIDs([]);
    setDeletedSponsorAttachmentIDs([]);
    setDeletedSubSponsorAttachmentIDs([]);
   setIsSubmitDisabled(true);
setIsUpdateDisabled(false);
setIsDeleteDisabled(false);
setShowForm(true);
  };

  // ── phones ─────────────────────────────────────────────────────────────
const addPhone = () =>
    setSupplier((prev) => ({
      ...prev,
      Phones: [...prev.Phones, { name: "", number: "", label: "Mobile" }]
    }));
  const removePhone = (i) =>
    setSupplier((prev) => ({
      ...prev,
      Phones: prev.Phones.filter((_, idx) => idx !== i)
    }));

  const updatePhone = (i, field, value) =>
    setSupplier((prev) => {
      const phones = [...prev.Phones];
      phones[i] = { ...phones[i], [field]: value };
      return { ...prev, Phones: phones };
    });

  // ── sponsors ───────────────────────────────────────────────────────────
  const addSponsor = () =>
    setSupplier((prev) => ({ ...prev, Sponsors: [...prev.Sponsors, EMPTY_SPONSOR()] }));

  const removeSponsor = (id) =>
    setSupplier((prev) => ({ ...prev, Sponsors: prev.Sponsors.filter((s) => s.id !== id) }));

  const updateSponsor = (id, field, value) =>
    setSupplier((prev) => ({
      ...prev,
      Sponsors: prev.Sponsors.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    }));

  const attachSponsorDocs = (sponsorId, files, docName) => {
    const newDocs = files.map((f) => ({
      id: Date.now() + Math.random(),
      AttachmentID: null,
      name: f.name,
      docName,
      file: f,
      url: URL.createObjectURL(f),
      type: f.type
    }));
    setSupplier((prev) => ({
      ...prev,
      Sponsors: prev.Sponsors.map((s) =>
        s.id === sponsorId ? { ...s, Attachments: [...s.Attachments, ...newDocs] } : s
      )
    }));
  };

  const removeSponsorDoc = (sponsorId, doc) => {
    if (doc.AttachmentID) {
      setDeletedSponsorAttachmentIDs((prev) => [...prev, doc.AttachmentID]);
    }
    setSupplier((prev) => ({
      ...prev,
      Sponsors: prev.Sponsors.map((s) =>
        s.id === sponsorId
          ? { ...s, Attachments: s.Attachments.filter((a) => a.id !== doc.id) }
          : s
      )
    }));
  };

  // ── sub-sponsors ───────────────────────────────────────────────────────
  const addSubSponsor = () =>
    setSupplier((prev) => ({ ...prev, SubSponsors: [...prev.SubSponsors, EMPTY_SUBSPONSOR()] }));

  const removeSubSponsor = (id) =>
    setSupplier((prev) => ({ ...prev, SubSponsors: prev.SubSponsors.filter((s) => s.id !== id) }));

  const updateSubSponsor = (id, field, value) =>
    setSupplier((prev) => ({
      ...prev,
      SubSponsors: prev.SubSponsors.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    }));

  const attachSubSponsorDocs = (subSponsorId, files, docName) => {
    const newDocs = files.map((f) => ({
      id: Date.now() + Math.random(),
      AttachmentID: null,
      name: f.name,
      docName,
      file: f,
      url: URL.createObjectURL(f),
      type: f.type
    }));
    setSupplier((prev) => ({
      ...prev,
      SubSponsors: prev.SubSponsors.map((s) =>
        s.id === subSponsorId ? { ...s, Attachments: [...s.Attachments, ...newDocs] } : s
      )
    }));
  };

  const removeSubSponsorDoc = (subSponsorId, doc) => {
    if (doc.AttachmentID) {
      setDeletedSubSponsorAttachmentIDs((prev) => [...prev, doc.AttachmentID]);
    }
    setSupplier((prev) => ({
      ...prev,
      SubSponsors: prev.SubSponsors.map((s) =>
        s.id === subSponsorId
          ? { ...s, Attachments: s.Attachments.filter((a) => a.id !== doc.id) }
          : s
      )
    }));
  };

  // ── supplier-level attachments (Other + LPO) ────────────────────────────
  // docName is now free-typed by the user instead of chosen from a dropdown.
  // isLPO flags whether it was added via the LPO section so the backend can
  // file it under the right document type / folder.
  const attachSupplierDocs = (files, docName, isLPO = false) => {
    const newAtts = files.map((f) => ({
      id: Date.now() + Math.random(),
      name: f.name,
      docName,
      isLPO,
      file: f,
      url: URL.createObjectURL(f),
      type: f.type,
      AttachmentID: null
    }));
    setSupplier((prev) => ({
      ...prev,
      Attachments: [...prev.Attachments, ...newAtts]
    }));
  };

  // Mark a saved attachment for deletion (soft-delete via SP on save)
  // or just remove a pending (not yet saved) attachment immediately
  const removeAttachment = (att) => {
    if (att.AttachmentID) {
      setDeletedAttachmentIDs((prev) => [...prev, att.AttachmentID]);
    }
    setSupplier((prev) => ({
      ...prev,
      Attachments: prev.Attachments.filter((a) => a.id !== att.id)
    }));
  };

  const isImage = (t) => t?.startsWith("image/");
  const isPDF = (t) => t === "application/pdf";

  // ── build multipart FormData for create / update ───────────────────────
  // Matches what the Express route + sp_CreateUpdateSupplier expect.
  // Sponsors / SubSponsors are sent as JSON (their own files are appended
  // separately, namespaced by owner so the backend can route them).
  const buildFormData = () => {
    const fd = new FormData();
    fd.append("EmiratesIDs", JSON.stringify(emiratesIDs));
fd.append("Passports",   JSON.stringify(passports));

    const fields = {
      AccountID: supplier.AccountID || 0,
      AcHeadId: supplier.AcHeadId || 0,
      AccountName: supplier.Name.trim(),
      Address: supplier.Address || "",
      city: supplier.City || "",
      country: supplier.Country || "",
      mob: supplier.Phones[0]?.number || "",
      phone: supplier.Phones[1]?.number || "",
      Phones: JSON.stringify(supplier.Phones),
      email: supplier.Email || "",
      TinNo: supplier.TinNo || "",
      VatNo: supplier.VatNo || "",
      VatExpiry: supplier.VatExpiry || "",
      EIDNo: supplier.EIDNo || "",
      EmiratesIDExpiry: supplier.EmiratesIDExpiry || "",
      TradeLicenceNo: supplier.TradeLicenceNo || "",
      TradeLicenceExpiry: supplier.TradeLicenceExpiry || "",
      PassportNo: supplier.PassportNo || "",
      PassportExpiry: supplier.PassportExpiry || "",
      ProjectIDs: JSON.stringify(supplier.ProjectIDs),
      IsActive: supplier.IsActive ? 1 : 0,
      Sponsors: JSON.stringify(
        supplier.Sponsors.map(({ id, Attachments, ...rest }) => rest)
      ),
      SubSponsors: JSON.stringify(
        supplier.SubSponsors.map(({ id, Attachments, ...rest }) => rest)
      ),
      Companyid: sessionStorage.getItem("CompanyID"),
      CreatedBy: supplier.AccountID ? 0 : (sessionStorage.getItem("UserId") || 0),
      ModifiedBy: supplier.AccountID ? (sessionStorage.getItem("UserId") || 0) : 0,
      AccountParent: 22,
      IsSupplier: 1,
      deletedAttachmentIDs: JSON.stringify(deletedAttachmentIDs),
      deletedSponsorAttachmentIDs: JSON.stringify(deletedSponsorAttachmentIDs),
      deletedSubSponsorAttachmentIDs: JSON.stringify(deletedSubSponsorAttachmentIDs)
    };

    Object.entries(fields).forEach(([k, v]) => fd.append(k, v));

    // Supplier-level attachments (Other + LPO). Each carries its free-typed
    // docName + isLPO flag via attachmentMeta so the backend can store both.
    const meta = [];
    supplier.Attachments
      .filter((a) => a.file instanceof File)
      .forEach((att, idx) => {
        fd.append(
          "attachments",
          new File([att.file], `${att.name}__IDX__${idx}`, { type: att.type })
        );
        meta.push({ index: idx, docName: att.docName || att.name, isLPO: !!att.isLPO });
      });
    fd.append("attachmentMeta", JSON.stringify(meta));

    // Sponsor documents — namespaced by sponsor index; Key (once assigned by
    // the backend on first save) lets the server tie new uploads to the
    // right sponsor even though Sponsors itself is just a JSON column.
    const sponsorMeta = [];
    supplier.Sponsors.forEach((sp, sIdx) => {
      sp.Attachments
        .filter((a) => a.file instanceof File)
        .forEach((att, idx) => {
          fd.append(
            "sponsorAttachments",
            new File([att.file], `${att.name}__SPONSOR_${sIdx}__IDX__${idx}`, { type: att.type })
          );
          sponsorMeta.push({
            sponsorIndex: sIdx,
            sponsorKey: sp.Key || null,
            index: idx,
            docName: att.docName || att.name
          });
        });
    });
    fd.append("sponsorAttachmentMeta", JSON.stringify(sponsorMeta));

    // Sub-sponsor documents — same namespacing pattern
    const subSponsorMeta = [];
    supplier.SubSponsors.forEach((ss, ssIdx) => {
      ss.Attachments
        .filter((a) => a.file instanceof File)
        .forEach((att, idx) => {
          fd.append(
            "subSponsorAttachments",
            new File([att.file], `${att.name}__SUBSPONSOR_${ssIdx}__IDX__${idx}`, { type: att.type })
          );
          subSponsorMeta.push({
            subSponsorIndex: ssIdx,
            subSponsorKey: ss.Key || null,
            index: idx,
            docName: att.docName || att.name
          });
        });
    });
    fd.append("subSponsorAttachmentMeta", JSON.stringify(subSponsorMeta));

    return fd;
  };

  // ── refresh attachments + sponsor/sub-sponsor Keys after a successful save ──
  // serverSponsors / serverSubSponsors come back from the save response with
  // a Key now assigned to each entry (by array position) — merge those Keys
  // into local state, then fetch documents for anyone who didn't have one
  // before (new sponsors/sub-sponsors just saved for the first time).
  const refreshAttachments = async (supplierID, serverSponsors = [], serverSubSponsors = []) => {
    const fresh = await fetchAttachments(supplierID, "supplier");

    const sponsorsWithKeys = await Promise.all(
      supplier.Sponsors.map(async (sp, idx) => {
        const key = serverSponsors[idx]?.Key || sp.Key;
        const attachments = key ? await fetchAttachments(supplierID, "sponsor", key) : sp.Attachments;
        return { ...sp, Key: key, Attachments: attachments };
      })
    );
    const subSponsorsWithKeys = await Promise.all(
      supplier.SubSponsors.map(async (ss, idx) => {
        const key = serverSubSponsors[idx]?.Key || ss.Key;
        const attachments = key ? await fetchAttachments(supplierID, "subsponsor", key) : ss.Attachments;
        return { ...ss, Key: key, Attachments: attachments };
      })
    );

    setSupplier((prev) => ({
      ...prev,
      Attachments: fresh,
      Sponsors: sponsorsWithKeys,
      SubSponsors: subSponsorsWithKeys
    }));
    setDeletedAttachmentIDs([]);
    setDeletedSponsorAttachmentIDs([]);
    setDeletedSubSponsorAttachmentIDs([]);
  };

  // ── submit (insert) ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canAdd) {
      toast.error("You do not have permission to create suppliers.");
      return;
    }
    if (!supplier.Name?.trim()) { toast.warning("Supplier name is required"); return; }
    if (
      supplierList.some(
        (s) =>
          s.AccountName?.toLowerCase().trim() === supplier.Name.toLowerCase().trim() &&
          s.AccountID !== supplier.AccountID
      )
    ) {
      toast.warning("Supplier name already exists");
      return;
    }
    if (supplier.Sponsors.some((s) => !s.name?.trim())) {
      toast.warning("Each sponsor needs a name");
      return;
    }
    if (supplier.SubSponsors.some((s) => !s.name?.trim())) {
      toast.warning("Each sub-sponsor needs a name");
      return;
    }

    try {
      setLoadingSubmit(true);
      const res = await api.post("/api/CreateupdateSupplier", buildFormData(), {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        toast.success(res.data.message);
        const newID = res.data.AccountID;
        await refreshAttachments(newID, res.data.Sponsors, res.data.SubSponsors);
        setSupplier((prev) => ({ ...prev, AccountID: newID }));
        setIsSubmitDisabled(true);
        setIsUpdateDisabled(false);
        setIsDeleteDisabled(false);
        fetchSuppliers();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setLoadingSubmit(false);
    }
  };

  // ── update ─────────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!canEdit) {
      toast.error("You do not have permission to update suppliers.");
      return;
    }
    if (!supplier.AccountID || !supplier.Name?.trim()) {
      toast.warning("Select a supplier first");
      return;
    }
    if (
      supplierList.some(
        (s) =>
          s.AccountName?.toLowerCase().trim() === supplier.Name.toLowerCase().trim() &&
          s.AccountID !== supplier.AccountID
      )
    ) {
      toast.warning("Supplier name already exists");
      return;
    }

    try {
      setLoadingUpdate(true);
      const res = await api.post("/api/CreateupdateSupplier", buildFormData(), {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        toast.success("Supplier updated successfully");
        await refreshAttachments(supplier.AccountID, res.data.Sponsors, res.data.SubSponsors);
        fetchSuppliers();
      } else {
        toast.error(res.data.message);
      }
    } catch {
      toast.error("Update failed");
    } finally {
      setLoadingUpdate(false);
    }
  };

  // ── delete supplier ────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!canDelete) {
      toast.error("You do not have permission to delete suppliers.");
      return;
    }
    const confirmed = await confirmDeleteToast();
    if (!confirmed) return;

    try {
      setLoadingDelete(true);
      await api.post("/api/SupplierDeleteAccountHead", {
        HSlNo: supplier.AcHeadId,
        userid: sessionStorage.getItem("UserId")
      });
      toast.success("Supplier deleted");
      fetchSuppliers();
      handleClear();
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setLoadingDelete(false);
    }
  };

  const confirmDeleteToast = () =>
    new Promise((resolve) => {
      const id = toast.warning(
        () => (
          <div>
            <div className="mb-2">Delete this supplier?</div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-danger btn-sm"
                onClick={() => { toast.dismiss(id); resolve(true); }}
              >
                Yes, delete
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => { toast.dismiss(id); resolve(false); }}
              >
                Cancel
              </button>
            </div>
          </div>
        ),
        {
          position: "top-center", autoClose: false,
          closeOnClick: false, draggable: false, closeButton: false
        }
      );
    });

  // ── filtered list ──────────────────────────────────────────────────────
  const filteredSuppliers = supplierList.filter(
    (s) =>
      s.AccountName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.Mob?.includes(searchTerm) ||
      s.Email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

const outlineBtn = (extra = {}) => ({
  borderRadius: 8, fontWeight: 500, background: "transparent",
  border: `1.5px solid ${PRIMARY}`, color: PRIMARY,
  padding: "8px 20px", fontSize: 13,
  display: "inline-flex", alignItems: "center", gap: 6,
  transition: "all 0.15s", cursor: "pointer",
  ...extra
});
const TABS = [
  { key: "basic", label: "Basic Info", icon: FaUser },
  { key: "identification", label: "Identification", icon: FaIdCard },
  { key: "sponsors", label: "Sponsors", icon: FaUsers,
    badge: supplier.Sponsors.length + supplier.SubSponsors.length || undefined },
  { key: "attachments", label: "Attachments", icon: FaPaperclip,
    badge: supplier.Attachments.length || undefined },
];

  const addBtnStyle = {
    background: PRIMARY_LIGHT, border: `1px solid ${PRIMARY_BORDER}`,
    color: PRIMARY, borderRadius: 5, padding: "3px 10px", fontSize: 12,
    cursor: "pointer", display: "flex", alignItems: "center", gap: 4
  };

  // ══════════════════════════════════════════════════════════════════════
  return (
    <div className="page-wrapper" style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
     
<style>{`
  .form-control, .form-select {
    border: 1px solid #e2e8f0 !important;
    border-radius: 8px !important;
    font-size: 13px !important;
    color: #1e293b !important;
    background: #fff !important;
    box-shadow: none !important;
    transition: border-color 0.15s !important;
  }
  .form-control:focus, .form-select:focus {
    border-color: ${PRIMARY} !important;
    box-shadow: 0 0 0 3px rgba(45,75,169,0.08) !important;
  }
  .form-control::placeholder { color: #cbd5e0 !important; }
  .table-hover tbody tr:hover { background: #f8faff !important; }
  .card-header { border-radius: 0 !important; }
  button:disabled {
    opacity: 0.38 !important;
    cursor: not-allowed !important;
    pointer-events: none !important;
  }
`}</style>
      <div className="page-body mt-1">
        <div className="container-fluid px-4">
          <ToastContainer position="top-center" autoClose={3000} />

          {/* ── Attachment preview modal ── */}
          {previewAttachment && (
            <div
              style={{
                position: "fixed", inset: 0,
                background: "rgba(0,0,0,0.7)", zIndex: 9999,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
              onClick={() => setPreviewAttachment(null)}
            >
              <div
                style={{
                  background: "#fff", borderRadius: 12, padding: 20,
                  maxWidth: "90vw", maxHeight: "90vh", overflow: "auto"
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span style={{ fontWeight: 600 }}>{previewAttachment.docName || previewAttachment.name}</span>
                  <button
                    className="btn btn-sm btn-light"
                    onClick={() => setPreviewAttachment(null)}
                  >
                    <FaTimesCircle />
                  </button>
                </div>
                {isImage(previewAttachment.type) ? (
                  <img
                    src={previewAttachment.url}
                    alt={previewAttachment.name}
                    style={{ maxWidth: "80vw", maxHeight: "75vh", borderRadius: 8, display: "block" }}
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                ) : isPDF(previewAttachment.type) ? (
                  <iframe
                    src={previewAttachment.url}
                    title={previewAttachment.name}
                    style={{ width: "75vw", height: "75vh", border: "none" }}
                  />
                ) : (
                  <div style={{ textAlign: "center", padding: 40 }}>
                    <p style={{ marginBottom: 16, color: "#4a5568" }}>
                      Preview not available for this file type.
                    </p>
                    <a
                      href={previewAttachment.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: "10px 24px", background: "rgb(45,75,169)",
                        color: "#fff", borderRadius: 6, textDecoration: "none",
                        fontWeight: 600, fontSize: 14
                      }}
                    >
                      Open File
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════ LIST VIEW ════════════ */}
          {!showForm ? (
            <>
              <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
                <div className="card-body p-4">
                  <h2 style={{ fontWeight: 600, color: "#2d3748", fontSize: 26 }} className="mb-3">
                    <FaTruck className="me-2" style={{ color: PRIMARY }} />Suppliers
                  </h2>
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div style={{ maxWidth: 600, flex: 1 }}>
                      <div className="input-group" style={{ height: 44 }}>
                        <span className="input-group-text text-white" style={{ background: PRIMARY }}>
                          <FaSearch />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search by name, mobile, or email…"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={{ height: 44, fontSize: 14 }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateNew}
                      className="btn d-flex align-items-center gap-2"
                      style={{
                        background: PRIMARY, border: "none", color: "white",
                        borderRadius: 5, padding: "9px 20px", height: 44, whiteSpace: "nowrap"
                      }}
                      disabled={!canAdd}
                    >
                      <FaPlus /> Create New
                    </button>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm" style={{ borderRadius: 12, overflow: "hidden" }}>
                <div className="card-body p-0">
                  {loading ? (
                    <div className="text-center p-5">
                      <div className="spinner-border" role="status" style={{ color: PRIMARY }} />
                      <p className="mt-3 text-muted">Loading suppliers…</p>
                    </div>
                  ) : (
                    <div style={{ maxHeight: 600, overflowY: "auto" }}>
                      <table className="table table-hover mb-0">
                        <thead
                          className="bg-light"
                          style={{ position: "sticky", top: 0, zIndex: 1 }}
                        >
                          <tr>
                            {[
                              "Supplier Name", "Status", "Mobile", "Email", "City",
                              "Emirates ID", "Trade Licence", "Passport Expiry"
                            ].map((h) => (
                              <th
                                key={h}
                                className="py-3 px-3"
                                style={{ color: "#4a5568", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSuppliers.length > 0
                            ? filteredSuppliers.map((s) => (
                              <tr
                                key={s.AccountID}
                                onClick={() => handleRowClick(s)}
                                className="align-middle"
                                style={{
                                  cursor: "pointer",
                                  transition: "all 0.15s",
                                  borderLeft:
                                    supplier.AccountID === s.AccountID
                                      ? `4px solid ${PRIMARY}`
                                      : "4px solid transparent"
                                }}
                              >
                                <td className="py-3 px-3">
                                  <div className="d-flex align-items-center gap-2">
                                    <div
                                      className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                                      style={{ width: 34, height: 34, flexShrink: 0 }}
                                    >
                                      <FaTruck style={{ color: PRIMARY, fontSize: 14 }} />
                                    </div>
                                    <span style={{ fontWeight: 500, fontSize: 14 }}>
                                      {s.AccountName}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <span style={{
                                    fontSize: 11, fontWeight: 600, borderRadius: 8,
                                    padding: "2px 8px",
                                    background: s.Status === 0 ? "#fed7d7" : "#c6f6d5",
                                    color: s.Status === 0 ? "#9b2c2c" : "#276749"
                                  }}>
                                    {s.Status === 0 ? "Inactive" : "Active"}
                                  </span>
                                </td>
                                <td className="py-3 px-3" style={{ color: "#4a5568", fontSize: 13, whiteSpace: "nowrap" }}>
                                  <FaPhone className="me-1" style={{ color: "#48bb78", fontSize: 12 }} />
                                  {s.Mob || "—"}
                                </td>
                                <td className="py-3 px-3" style={{ color: "#4a5568", fontSize: 13 }}>
                                  <FaEnvelope className="me-1" style={{ color: "#4299e1", fontSize: 12 }} />
                                  {s.Email || "—"}
                                </td>
                                <td className="py-3 px-3" style={{ color: "#4a5568", fontSize: 13, whiteSpace: "nowrap" }}>
                                  <FaMapMarkerAlt className="me-1" style={{ color: "#f56565", fontSize: 12 }} />
                                  {s.city || "—"}
                                </td>
                                <td className="py-3 px-3" style={{ fontSize: 12 }}>
                                  {(() => {
                                    const eidArr = (() => {
                                      if (!s.EmiratesIDs) return [];
                                      try { return JSON.parse(s.EmiratesIDs).filter(e => e.number || e.expiry); }
                                      catch { return []; }
                                    })();

                                    if (eidArr.length > 0) {
                                      return eidArr.map((e, i) => (
                                        <div key={i} style={{ marginBottom: i < eidArr.length - 1 ? 4 : 0 }}>
                                          {e.name && (
                                            <span style={{ fontSize: 10, color: '#94a3b8', display: 'block' }}>{e.name}</span>
                                          )}
                                          <div style={{ whiteSpace: 'nowrap' }}>{e.number || '—'}</div>
                                          {e.expiry && (
                                            <div style={{ color: '#718096', marginTop: 1 }}>
                                              {formatDate(normalizeDate(e.expiry))}
                                              <ExpiryBadge dateStr={normalizeDate(e.expiry)} />
                                            </div>
                                          )}
                                        </div>
                                      ));
                                    }

                                    // Legacy fallback
                                    return (
                                      <>
                                        <div style={{ whiteSpace: 'nowrap' }}>{s.EIDNo || '—'}</div>
                                        {s.EmiratesIDExpiry && (
                                          <div style={{ color: '#718096', marginTop: 2 }}>
                                            {formatDate(normalizeDate(s.EmiratesIDExpiry))}
                                            <ExpiryBadge dateStr={normalizeDate(s.EmiratesIDExpiry)} />
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </td>
                                <td className="py-3 px-3" style={{ fontSize: 12 }}>
                                  <div style={{ whiteSpace: "nowrap" }}>{s.TradeLicenceNo || "—"}</div>
                                  {s.TradeLicenceExpiry && (
                                    <div style={{ color: "#718096", marginTop: 2 }}>
                                      {formatDate(normalizeDate(s.TradeLicenceExpiry))}
                                      <ExpiryBadge dateStr={normalizeDate(s.TradeLicenceExpiry)} />
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-3" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                                  {(() => {
                                    // Try new multi-passport JSON first, fall back to legacy single field
                                    const passportArr = (() => {
                                      if (!s.Passports) return [];
                                      try { return JSON.parse(s.Passports).filter(p => p.expiry); }
                                      catch { return []; }
                                    })();

                                    if (passportArr.length > 0) {
                                      return passportArr.map((p, i) => (
                                        <div key={i} style={{ marginBottom: i < passportArr.length - 1 ? 4 : 0 }}>
                                          {p.name && (
                                            <span style={{ fontSize: 10, color: '#94a3b8', marginRight: 4 }}>{p.name}</span>
                                          )}
                                          {formatDate(normalizeDate(p.expiry))}
                                          <ExpiryBadge dateStr={normalizeDate(p.expiry)} />
                                        </div>
                                      ));
                                    }

                                    // Legacy fallback
                                    if (s.PassportExpiry) {
                                      return (
                                        <>
                                          {formatDate(normalizeDate(s.PassportExpiry))}
                                          <ExpiryBadge dateStr={normalizeDate(s.PassportExpiry)} />
                                        </>
                                      );
                                    }

                                    return "—";
                                  })()}
                                </td>
                              </tr>
                            ))
                            : <EmptyState onCreateNew={handleCreateNew} />}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>

          ) : (
            /* ════════════ FORM VIEW ════════════ */
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12, overflow: "hidden" }}>
  <div
    className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center"
    style={{ borderBottom: "1px solid #e2e8f0" }}
  >
    <div>
      <h4 style={{ color: "#1e293b", fontWeight: 600, fontSize: 16, margin: 0 }}>
        <FaTruck className="me-2" style={{ color: PRIMARY }} />
        {supplier.AccountID ? "Edit Supplier" : "New Supplier"}
      </h4>
      <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
        {supplier.AccountID ? "Update supplier details below" : "Fill in the details to create a new supplier"}
      </p>
    </div>
    <button onClick={handleBackToList} style={outlineBtn()}>
      <FaArrowLeft size={12} /> Back
    </button>
  </div>

  <div className="card-body" style={{ padding: "28px 32px", background: "#f8fafc" }}>
    <form onSubmit={handleSubmit}>

  {/* ── Tab bar ── */}
  <div style={{
    display: "flex", borderBottom: `1px solid ${C.border}`,
    background: "#fff", overflowX: "auto", marginBottom: 20,
    borderRadius: 10, boxShadow: "0 1px 0 #fff"
  }}>
    {TABS.map((t) => {
      const active = activeTab === t.key;
      return (
        <button
          key={t.key}
          type="button"
          onClick={() => setActiveTab(t.key)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "12px 20px", fontSize: 13,
            fontWeight: active ? 700 : 500,
            color: active ? C.primary : C.muted,
            background: "transparent", border: "none",
            borderBottom: active ? `2.5px solid ${C.primary}` : "2.5px solid transparent",
            cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s"
          }}
        >
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

  {/* ── TAB: Basic Info ── */}
  {activeTab === "basic" && (
    <div className="row g-3">
      <div className="col-xl-7">
        <SectionCard icon={FaUser} title="Basic Information">

          <Field label="Supplier Name" required>
            <input
              className="form-control"
              name="Name"
              value={supplier.Name}
              onChange={handleInputChange}
              placeholder="Enter supplier name"
            />
          </Field>

          <Field label="Email">
            <input
              className="form-control"
              name="Email"
              type="email"
              value={supplier.Email}
              onChange={handleInputChange}
              placeholder="Enter email"
            />
          </Field>

          {/* Phone numbers */}
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <label className="form-label fw-medium mb-0" style={{ fontSize: 13 }}>
                Phone Numbers
              </label>
              <button type="button" onClick={addPhone} style={addBtnStyle}>
                <FaPlus size={10} /> Add
              </button>
            </div>
            {supplier.Phones.map((ph, i) => (
              <div key={i} className="mb-2 p-2 rounded" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                    Contact {i + 1}
                  </span>
                  {supplier.Phones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePhone(i)}
                      style={{
                        background: 'none', border: 'none',
                        color: '#e53e3e', cursor: 'pointer', padding: 0
                      }}
                    >
                      <FaTimesCircle size={12} />
                    </button>
                  )}
                </div>
                <div className="row g-2">
                  <div className="col-4">
                    <label style={{ fontSize: 11, color: '#64748b', marginBottom: 3, display: 'block' }}>Name</label>
                    <input
                      className="form-control form-control-sm"
                      placeholder="Contact name"
                      value={ph.name || ''}
                      onChange={(e) => updatePhone(i, 'name', e.target.value)}
                    />
                  </div>
                  <div className="col-4">
                    <label style={{ fontSize: 11, color: '#64748b', marginBottom: 3, display: 'block' }}>Number</label>
                    <input
                      className="form-control form-control-sm"
                      placeholder={`Phone ${i + 1}`}
                      value={ph.number}
                      inputMode="numeric"
                      maxLength={15}
                      onChange={(e) =>
                        updatePhone(i, 'number', e.target.value.replace(/\D/g, ''))
                      }
                    />
                  </div>
                  <div className="col-4">
                    <label style={{ fontSize: 11, color: '#64748b', marginBottom: 3, display: 'block' }}>Type</label>
                    <select
                      value={ph.label}
                      onChange={(e) => updatePhone(i, 'label', e.target.value)}
                      className="form-select form-select-sm"
                    >
                      {['Mobile', 'Home', 'Work', 'Other'].map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="row g-2">
            <div className="col-6">
              <Field label="City">
                <input
                  className="form-control"
                  name="City"
                  value={supplier.City}
                  onChange={handleInputChange}
                  placeholder="City"
                />
              </Field>
            </div>
            <div className="col-6">
              <Field label="Country">
                <select
                  className="form-select"
                  name="Country"
                  value={supplier.Country}
                  onChange={handleCountryChange}
                >
                  <option value="">— Select Country —</option>
                  {countryList.map(c => (
                    <option key={c.iso2} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <Field label="Address">
            <textarea
              className="form-control"
              name="Address"
              rows="3"
              value={supplier.Address}
              onChange={handleInputChange}
              placeholder="Enter address"
            />
          </Field>

        </SectionCard>
      </div>

      <div className="col-xl-5">
        <SectionCard icon={supplier.IsActive ? FaToggleOn : FaToggleOff} title="Status">
          <div className="d-flex align-items-center gap-3">
            <button
              type="button"
              onClick={() => set("IsActive", supplier.IsActive ? 0 : 1)}
              style={{
                width: 46, height: 24, borderRadius: 99, border: "none",
                cursor: "pointer", position: "relative", flexShrink: 0,
                background: supplier.IsActive ? PRIMARY : "#cbd5e0",
                transition: "background 0.15s"
              }}
              aria-pressed={!!supplier.IsActive}
              aria-label="Toggle supplier active status"
            >
              <span style={{
                position: "absolute", top: 3,
                left: supplier.IsActive ? 25 : 3,
                width: 18, height: 18, borderRadius: "50%",
                background: "#fff", transition: "left 0.15s"
              }} />
            </button>
            <span style={{
              fontWeight: 600, fontSize: 14,
              color: supplier.IsActive ? PRIMARY : "#718096"
            }}>
              {supplier.IsActive ? "Active" : "Inactive"}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#a0aec0", marginTop: 6 }}>
            Toggle to mark this supplier inactive without deleting the record.
          </div>
        </SectionCard>
      </div>
    </div>
  )}

  {/* ── TAB: Identification ── */}
  {activeTab === "identification" && (
    <div className="row g-3">
      <div className="col-12">
        <SectionCard icon={FaIdCard} title="Documents & Identification">

          {/* Emirates ID */}
          <div className="p-2 mb-3 rounded" style={{ background: "#f8faff", border: "1px solid #dbeafe" }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="fw-medium" style={{ fontSize: 11, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Emirates ID
              </div>
              <button
                type="button"
                onClick={() => setEmiratesIDs(prev => [...prev, { name: '', number: '', expiry: '' }])}
                style={addBtnStyle}
              >
                <FaPlus size={10} /> Add
              </button>
            </div>

            {emiratesIDs.map((eid, i) => (
              <div key={i} className="mb-2 p-2 rounded" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Entry {i + 1}</span>
                  {emiratesIDs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setEmiratesIDs(prev => prev.filter((_, idx) => idx !== i))}
                      style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', padding: 0 }}
                    >
                      <FaTimesCircle size={12} />
                    </button>
                  )}
                </div>
                <div className="row g-2">
                  <div className="col-4">
                    <label className="form-label mb-1" style={{ fontSize: 11 }}>Name</label>
                    <input
                      className="form-control form-control-sm"
                      placeholder="Holder name"
                      value={eid.name}
                      onChange={e => setEmiratesIDs(prev => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                    />
                  </div>
                  <div className="col-4">
                    <label className="form-label mb-1" style={{ fontSize: 11 }}>ID Number</label>
                    <input
                      className="form-control form-control-sm"
                      placeholder="784-XXXX-XXXXXXX-X"
                      value={eid.number}
                      onChange={e => setEmiratesIDs(prev => prev.map((x, idx) => idx === i ? { ...x, number: e.target.value.toUpperCase().replace(/[^0-9A-Z\-]/g, '').slice(0, 18) } : x))}
                    />
                  </div>
                  <div className="col-4">
                    <label className="form-label mb-1" style={{ fontSize: 11 }}>
                      Expiry <ExpiryBadge dateStr={eid.expiry} />
                    </label>
                    <input
                      className="form-control form-control-sm"
                      type="date"
                      value={eid.expiry}
                      onChange={e => setEmiratesIDs(prev => prev.map((x, idx) => idx === i ? { ...x, expiry: e.target.value } : x))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trade Licence */}
          <div className="p-2 mb-3 rounded" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <div className="fw-medium mb-2" style={{ fontSize: 11, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Trade Licence
            </div>
            <div className="row g-2">
              <div className="col-7">
                <label className="form-label mb-1" style={{ fontSize: 12 }}>Licence Number</label>
                <input
                  className="form-control form-control-sm"
                  name="TradeLicenceNo"
                  value={supplier.TradeLicenceNo}
                  onChange={handleInputChange}
                  placeholder="Licence number"
                />
              </div>
              <div className="col-5">
                <label className="form-label mb-1" style={{ fontSize: 12 }}>
                  Expiry <ExpiryBadge dateStr={supplier.TradeLicenceExpiry} />
                </label>
                <input
                  className="form-control form-control-sm"
                  type="date"
                  name="TradeLicenceExpiry"
                  value={supplier.TradeLicenceExpiry}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Passport */}
          <div className="p-2 mb-3 rounded" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="fw-medium" style={{ fontSize: 11, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Passport
              </div>
              <button
                type="button"
                onClick={() => setPassports(prev => [...prev, { name: '', number: '', expiry: '' }])}
                style={addBtnStyle}
              >
                <FaPlus size={10} /> Add
              </button>
            </div>

            {passports.map((pp, i) => (
              <div key={i} className="mb-2 p-2 rounded" style={{ background: '#fff', border: '1px solid #fde68a' }}>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Entry {i + 1}</span>
                  {passports.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setPassports(prev => prev.filter((_, idx) => idx !== i))}
                      style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', padding: 0 }}
                    >
                      <FaTimesCircle size={12} />
                    </button>
                  )}
                </div>
                <div className="row g-2">
                  <div className="col-4">
                    <label className="form-label mb-1" style={{ fontSize: 11 }}>Name</label>
                    <input
                      className="form-control form-control-sm"
                      placeholder="Holder name"
                      value={pp.name}
                      onChange={e => setPassports(prev => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                    />
                  </div>
                  <div className="col-4">
                    <label className="form-label mb-1" style={{ fontSize: 11 }}>Passport Number</label>
                    <input
                      className="form-control form-control-sm"
                      placeholder="Passport number"
                      value={pp.number}
                      onChange={e => setPassports(prev => prev.map((x, idx) => idx === i ? { ...x, number: e.target.value } : x))}
                    />
                  </div>
                  <div className="col-4">
                    <label className="form-label mb-1" style={{ fontSize: 11 }}>
                      Expiry <ExpiryBadge dateStr={pp.expiry} />
                    </label>
                    <input
                      className="form-control form-control-sm"
                      type="date"
                      value={pp.expiry}
                      onChange={e => setPassports(prev => prev.map((x, idx) => idx === i ? { ...x, expiry: e.target.value } : x))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* VAT Registration */}
          <div className="p-2 mb-3 rounded" style={{ background: "#f0fdf4", border: "1px solid #a7f3d0" }}>
            <div className="fw-medium mb-2" style={{ fontSize: 11, color: "#059669", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              VAT Registration
            </div>
            <div className="row g-2">
              <div className="col-7">
                <label className="form-label mb-1" style={{ fontSize: 12 }}>VAT Number</label>
                <input
                  className="form-control form-control-sm"
                  name="VatNo"
                  value={supplier.VatNo}
                  onChange={handleInputChange}
                  placeholder="Enter VAT number"
                />
              </div>
              <div className="col-5">
                <label className="form-label mb-1" style={{ fontSize: 12 }}>Expiry</label>
                <input
                  className="form-control form-control-sm"
                  type="date"
                  name="VatExpiry"
                  value={supplier.VatExpiry}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

        </SectionCard>
      </div>
    </div>
  )}

  {/* ── TAB: Sponsors & Sub-sponsors ── */}
  {activeTab === "sponsors" && (
    <div className="row g-3">
      <div className="col-lg-6">
        <SectionCard
          icon={FaUsers}
          title="Sponsors"
          headerRight={
            <button type="button" onClick={addSponsor} style={addBtnStyle}>
              <FaPlus size={10} /> Add Sponsor
            </button>
          }
        >
          {supplier.Sponsors.length === 0 ? (
            <div style={{ textAlign: "center", padding: "16px 0", color: "#a0aec0", fontSize: 13 }}>
              No sponsors added
            </div>
          ) : (
            supplier.Sponsors.map((sp) => (
              <div key={sp.id} className="p-3 mb-2 rounded" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: 28, height: 28, background: PRIMARY, color: "#fff", fontSize: 11, fontWeight: 600, flexShrink: 0 }}
                    >
                      {initials(sp.name)}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#4a5568" }}>
                      Sponsor{sp.EIDExpiry && <ExpiryBadge dateStr={sp.EIDExpiry} />}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSponsor(sp.id)}
                    style={{ background: "none", border: "none", color: "#e53e3e", cursor: "pointer" }}
                  >
                    <FaTrashAlt size={13} />
                  </button>
                </div>
                <div className="row g-2 mb-2">
                  <div className="col-md-4">
                    <label className="form-label mb-1" style={{ fontSize: 11 }}>Sponsor Name <span className="text-danger">*</span></label>
                    <input
                      className="form-control form-control-sm"
                      value={sp.name}
                      onChange={(e) => updateSponsor(sp.id, "name", e.target.value)}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label mb-1" style={{ fontSize: 11 }}>Emirates ID</label>
                    <input
                      className="form-control form-control-sm"
                      value={sp.EID}
                      onChange={(e) => updateSponsor(sp.id, "EID", e.target.value)}
                      placeholder="784-XXXX-XXXXXXX-X"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label mb-1" style={{ fontSize: 11 }}>EID Expiry</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={sp.EIDExpiry}
                      onChange={(e) => updateSponsor(sp.id, "EIDExpiry", e.target.value)}
                    />
                  </div>
                </div>
                <div className="p-2 rounded" style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "#718096", marginBottom: 6 }}>Sponsor Documents</div>
                  <NamedAttachInput
                    placeholder="Type document name (e.g. Emirates ID copy)…"
                    onAttach={(files, docName) => attachSponsorDocs(sp.id, files, docName)}
                  />
                  {sp.Attachments.map((doc) => (
                    <DocRow
                      key={doc.id}
                      doc={doc}
                      onPreview={isImage(doc.type) || isPDF(doc.type) ? setPreviewAttachment : null}
                      onRemove={(d) => removeSponsorDoc(sp.id, d)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </SectionCard>
      </div>

      <div className="col-lg-6">
        <SectionCard
          icon={FaUsers}
          title="Sub-Supplier"
          headerRight={
            <button type="button" onClick={addSubSponsor} style={addBtnStyle}>
              <FaPlus size={10} /> Add Sub-sponsor
            </button>
          }
        >
          {supplier.SubSponsors.length === 0 ? (
            <div style={{ textAlign: "center", padding: "16px 0", color: "#a0aec0", fontSize: 13 }}>
              No sub-sponsors added
            </div>
          ) : (
            supplier.SubSponsors.map((ss) => (
              <div key={ss.id} className="p-3 mb-2 rounded" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: 28, height: 28, background: "#0F6E56", color: "#fff", fontSize: 11, fontWeight: 600, flexShrink: 0 }}
                    >
                      {initials(ss.name)}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#4a5568" }}>Sub-sponsor</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSubSponsor(ss.id)}
                    style={{ background: "none", border: "none", color: "#e53e3e", cursor: "pointer" }}
                  >
                    <FaTrashAlt size={13} />
                  </button>
                </div>
                <div className="row g-2 mb-2">
                  <div className="col-md-4">
                    <label className="form-label mb-1" style={{ fontSize: 11 }}>Sub-sponsor Name <span className="text-danger">*</span></label>
                    <input
                      className="form-control form-control-sm"
                      value={ss.name}
                      onChange={(e) => updateSubSponsor(ss.id, "name", e.target.value)}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label mb-1" style={{ fontSize: 11 }}>Contact Number</label>
                    <input
                      className="form-control form-control-sm"
                      value={ss.contact}
                      onChange={(e) => updateSubSponsor(ss.id, "contact", e.target.value.replace(/\D/g, ""))}
                      placeholder="Contact number"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label mb-1" style={{ fontSize: 11 }}>Emirates ID</label>
                    <input
                      className="form-control form-control-sm"
                      value={ss.EID}
                      onChange={(e) => updateSubSponsor(ss.id, "EID", e.target.value)}
                      placeholder="784-XXXX-XXXXXXX-X"
                    />
                  </div>
                </div>
                <div className="p-2 rounded" style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "#718096", marginBottom: 6 }}>Sub-sponsor Documents</div>
                  <NamedAttachInput
                    placeholder="Type document name (e.g. Passport copy)…"
                    onAttach={(files, docName) => attachSubSponsorDocs(ss.id, files, docName)}
                  />
                  {ss.Attachments.map((doc) => (
                    <DocRow
                      key={doc.id}
                      doc={doc}
                      onPreview={isImage(doc.type) || isPDF(doc.type) ? setPreviewAttachment : null}
                      onRemove={(d) => removeSubSponsorDoc(ss.id, d)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </SectionCard>
      </div>
    </div>
  )}

  {/* ── TAB: Attachments ── */}
  {activeTab === "attachments" && (
    <div className="row g-3">
      <div className="col-12">
        <SectionCard icon={FaPaperclip} title="Attachments">

          {/* LPO documents */}
          <div className="p-2 mb-3 rounded" style={{ background: "rgba(83,74,183,0.05)", border: "1px solid rgba(83,74,183,0.2)" }}>
            <div
              className="fw-medium mb-2 d-flex align-items-center gap-1"
              style={{ fontSize: 11, color: "#3C3489", textTransform: "uppercase", letterSpacing: "0.5px" }}
            >
              <FaFileInvoice size={12} /> LPO Documents
            </div>
            <NamedAttachInput
              placeholder="Type LPO document name (e.g. LPO-2026-0045)…"
              onAttach={(files, docName) => attachSupplierDocs(files, docName, true)}
            />
            {supplier.Attachments.filter((a) => a.isLPO).map((att) => (
              <DocRow
                key={att.id}
                doc={att}
                onPreview={isImage(att.type) || isPDF(att.type) ? setPreviewAttachment : null}
                onRemove={removeAttachment}
              />
            ))}
          </div>

          {/* Other attachments */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
              Other Attachments
            </div>
            <NamedAttachInput
              placeholder="Type document name (e.g. Fire Safety Certificate)…"
              onAttach={(files, docName) => attachSupplierDocs(files, docName, false)}
            />
            {supplier.Attachments.filter((a) => !a.isLPO).length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "#a0aec0", fontSize: 13, border: "1px dashed #e2e8f0", borderRadius: 8 }}>
                <FaPaperclip style={{ fontSize: 22, display: "block", margin: "0 auto 6px" }} />
                No attachments yet
              </div>
            ) : (
              supplier.Attachments.filter((a) => !a.isLPO).map((att) => (
                <DocRow
                  key={att.id}
                  doc={att}
                  onPreview={isImage(att.type) || isPDF(att.type) ? setPreviewAttachment : null}
                  onRemove={removeAttachment}
                />
              ))
            )}
          </div>

        </SectionCard>
      </div>
    </div>
  )}

  {/* ── Action buttons ── */}
  <div style={{
    display: "flex", justifyContent: "space-between", gap: 10,
    marginTop: 28, paddingTop: 20, borderTop: "1px solid #e2e8f0", flexWrap: "wrap"
  }}>
    <div style={{ display: "flex", gap: 10 }}>
      <button type="button" onClick={handleClear} style={outlineBtn({ border: "1.5px solid #e2e8f0", color: "#64748b" })}>
        <FaEraser size={12} /> Clear
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleteDisabled || loadingDelete || !canDelete}
        style={{
          ...outlineBtn({ borderColor: "#e53e3e", color: "#e53e3e" }),
          opacity: (isDeleteDisabled || loadingDelete || !canDelete) ? 0.38 : 1,
          cursor: (isDeleteDisabled || loadingDelete || !canDelete) ? "not-allowed" : "pointer",
          pointerEvents: (isDeleteDisabled || loadingDelete || !canDelete) ? "none" : "auto"
        }}
      >
        {loadingDelete
          ? <><span className="spinner-border spinner-border-sm me-1" />Deleting…</>
          : <><FaTrashAlt size={12} /> Delete</>}
      </button>
    </div>

    <div style={{ display: "flex", gap: 10 }}>
      {activeTab !== "basic" && (
        <button
          type="button"
          onClick={() => {
            const order = ["basic", "identification", "sponsors", "attachments"];
            const idx = order.indexOf(activeTab);
            if (idx > 0) setActiveTab(order[idx - 1]);
          }}
          style={outlineBtn({ border: "1.5px solid #e2e8f0", color: "#64748b" })}
        >
          ← Previous
        </button>
      )}
      {activeTab !== "attachments" ? (
        <button
          type="button"
          onClick={() => {
            const order = ["basic", "identification", "sponsors", "attachments"];
            const idx = order.indexOf(activeTab);
            if (idx < order.length - 1) setActiveTab(order[idx + 1]);
          }}
          style={outlineBtn({ background: PRIMARY, color: "#fff", border: "none" })}
        >
          Next →
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={handleUpdate}
            disabled={isUpdateDisabled || loadingUpdate || !canEdit}
            style={{
              ...outlineBtn(),
              opacity: (isUpdateDisabled || loadingUpdate || !canEdit) ? 0.38 : 1,
              cursor: (isUpdateDisabled || loadingUpdate || !canEdit) ? "not-allowed" : "pointer",
              pointerEvents: (isUpdateDisabled || loadingUpdate || !canEdit) ? "none" : "auto"
            }}
          >
            {loadingUpdate
              ? <><span className="spinner-border spinner-border-sm me-1" />Updating…</>
              : <><FaEdit size={12} /> Update</>}
          </button>
          <button
            type="submit"
            disabled={isSubmitDisabled || loadingSubmit || !canAdd}
            style={{
              ...outlineBtn({ background: PRIMARY, color: "#fff", border: "none", padding: "8px 28px", fontWeight: 600 }),
              opacity: (isSubmitDisabled || loadingSubmit || !canAdd) ? 0.38 : 1,
              cursor: (isSubmitDisabled || loadingSubmit || !canAdd) ? "not-allowed" : "pointer",
              pointerEvents: (isSubmitDisabled || loadingSubmit || !canAdd) ? "none" : "auto"
            }}
          >
            {loadingSubmit
              ? <><span className="spinner-border spinner-border-sm me-1" />Creating…</>
              : <><FaSave size={12} /> Submit</>}
          </button>
        </>
      )}
    </div>
  </div>

</form>
  </div>
</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Supplier;