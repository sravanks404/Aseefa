import React, { useState, useEffect, useRef } from "react";
import api from "../../apiService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { usePermission } from "../../../src/context/permissionContex";

import {
  FaUsers, FaSearch, FaPlus, FaUser, FaPhone, FaEnvelope,
  FaMapMarkerAlt, FaEdit, FaTrashAlt, FaEraser, FaSave,
  FaArrowLeft, FaPaperclip, FaTimes, FaUpload,
  FaIdCard, FaFilePdf, FaFileImage, FaFileWord, FaChevronDown,
  FaWarehouse, FaBed, FaDoorOpen, FaWifi, FaUtensils, FaTshirt,
  FaTint, FaSnowflake, FaBath, FaParking, FaShieldAlt, FaFirstAid,
  FaCheck, FaLayerGroup
} from "react-icons/fa";

// ─── Design tokens (kept identical to Customer.jsx for visual consistency) ─

const BASE_URL = api.defaults.baseURL || "";
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

const ROOM_TYPES = ["Standard", "Family", "Supervisor"];
const BED_TYPES = ["Upper", "Lower"];


const DOC_TYPES = [
  { key: "tradeLicence", label: "Trade Licence", icon: FaIdCard },
  { key: "campPermit", label: "Camp Permit", icon: FaFileAltSafe },
  { key: "municipalityApproval", label: "Municipality Approval", icon: FaFileAltSafe },
  { key: "civilDefenceApproval", label: "Civil Defence Approval", icon: FaFileAltSafe },
];

const FACILITIES = [
  { key: "WifiAvailable", label: "WiFi Available", icon: FaWifi },
  { key: "KitchenAvailable", label: "Kitchen Available", icon: FaUtensils },
  { key: "LaundryAvailable", label: "Laundry Available", icon: FaTshirt },
  { key: "DrinkingWater", label: "Drinking Water", icon: FaTint },
  { key: "AC", label: "AC", icon: FaSnowflake },
  { key: "AttachedBathroom", label: "Attached Bathroom", icon: FaBath },
  { key: "CommonBathroom", label: "Common Bathroom", icon: FaBath },
  { key: "Parking", label: "Parking", icon: FaParking },
  { key: "SecurityAvailable", label: "Security Available", icon: FaShieldAlt },
  { key: "FirstAidFacility", label: "First Aid Facility", icon: FaFirstAid },
];

const emptyCamp = () => ({
  CampID: 0,
  CampCode: "",
  CampName: "",
  Description: "",
  CampLocation: "",
  Address: "",
  CampManagerName: "",
  CampManagerContactNo: "",
  AlternateContactNo: "",
  TotalRooms: 0,
  TotalCapacity: 0,
  CampStatus: 1,
  Latitude: "",
  Longitude: "",
  FromDate: "",   // ← new
  ToDate: "",
});

const emptyFacilities = () =>
  FACILITIES.reduce((acc, f) => ({ ...acc, [f.key]: false }), {});

const emptyRoom = () => ({
  RoomID: 0,
  RoomNo: "",
  FloorNo: "",
  RoomType: "Standard",
  BedCapacity: 1,
  RoomStatus: "Available",
  RatePerRoom: "",
  beds: [],
});

const emptyBed = () => ({
  BedID: 0,
  BedNo: "",
  BedType: "Lower",
  Status: "Available",
});

// ─── Utility helpers ───────────────────────────────────────────────
function fileIcon(name = "") {
  const ext = (name || "").split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return FaFileImage;
  if (ext === "pdf") return FaFilePdf;
  if (["doc", "docx"].includes(ext)) return FaFileWord;
  return FaFileAltSafe;
}

// Generic file icon fallback (avoids importing FaFileAlt twice under a clashing name)
function FaFileAltSafe(props) {
  return <FaPaperclip {...props} />;
}

function toDateInputValue(val) {
  if (!val) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

function occupiedBeds(room) {
  return (room.beds || []).filter(b => b.Status === "Occupied").length;
}
function availableBeds(room) {
  return (room.beds || []).length - occupiedBeds(room);
}

// ─── Base input style ──────────────────────────────────────────────
const inputStyle = {
  width: "100%", padding: "8px 11px", fontSize: 13, color: C.text,
  border: `1.5px solid ${C.border}`, borderRadius: 7, outline: "none",
  background: C.surface, transition: "border-color 0.15s", boxSizing: "border-box",
};

// ─── Sub-components ────────────────────────────────────────────────
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

function Select({ children, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      {...props}
      style={{
        ...inputStyle,
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236B7399'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 11px center",
        paddingRight: 28,
        ...(focused ? { borderColor: C.primary } : {}),
        ...props.style
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {children}
    </select>
  );
}

function TextArea({ ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      {...props}
      style={{
        ...inputStyle, resize: "vertical", minHeight: 64,
        ...(focused ? { borderColor: C.primary } : {}),
        ...props.style
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function ActionBtn({ icon: Icon, label, loading, loadingLabel, onClick, disabled, variant = "outline" }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "8px 18px", fontSize: 13, fontWeight: 600, borderRadius: 7,
    cursor: disabled ? "not-allowed" : "pointer",
    border: `1.5px solid ${C.primary}`, transition: "all 0.15s",
    whiteSpace: "nowrap", opacity: disabled ? 0.5 : 1,
  };
  const styles = variant === "solid"
    ? { ...base, background: C.primary, color: "#fff" }
    : { ...base, background: "transparent", color: C.primary };

  return (
    <button type="button" style={styles} onClick={onClick} disabled={disabled}>
      {loading ? (
        <>
          <span style={{
            width: 12, height: 12, border: "2px solid currentColor",
            borderTopColor: "transparent", borderRadius: "50%",
            display: "inline-block", animation: "spin 0.7s linear infinite"
          }} />
          {loadingLabel}
        </>
      ) : <><Icon size={12} />{label}</>}
    </button>
  );
}

// ─── Bed chip row inside a room card ───────────────────────────────
function BedRow({ bed, onChange, onRemove }) {
  const update = (field, val) => onChange({ ...bed, [field]: val });
  const occupied = bed.Status === "Occupied";
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto",
      gap: 8, alignItems: "center", padding: "7px 10px",
      background: occupied ? "#FFF2F2" : C.bg,
      border: `1.5px solid ${occupied ? "#F6D2D6" : C.border}`,
      borderRadius: 7, marginBottom: 6,
    }}>
      <Input value={bed.BedNo} onChange={e => update("BedNo", e.target.value)} placeholder="Bed No (B1)" />
      <Select value={bed.BedType} onChange={e => update("BedType", e.target.value)}>
        {BED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </Select>
      <Select
        value={bed.Status}
        onChange={e => update("Status", e.target.value)}
        disabled
        style={{ background: C.bg, color: C.muted, cursor: "not-allowed" }}
      >
        <option value="Available">Available</option>
        <option value="Occupied">Occupied</option>
      </Select>
      <button type="button" onClick={onRemove}
        style={{ background: "none", border: "none", cursor: "pointer", color: C.danger, padding: 4 }}>
        <FaTimes size={12} />
      </button>
    </div>
  );
}
// ─── Room card with nested bed management ──────────────────────────
function RoomCard({ room, index, onChange, onRemove, canRemove }) {
  const [expanded, setExpanded] = useState(true);
  const update = (field, val) => onChange(index, { ...room, [field]: val });

  const updateBed = (bedIdx, updatedBed) => {
    const beds = room.beds.map((b, i) => i === bedIdx ? updatedBed : b);
    onChange(index, { ...room, beds });
  };
  const removeBed = (bedIdx) => {
    const beds = room.beds.filter((_, i) => i !== bedIdx);
    onChange(index, { ...room, beds });
  };
  const addBed = () => {
    const nextNo = `B${room.beds.length + 1}`;
    onChange(index, { ...room, beds: [...room.beds, { ...emptyBed(), BedNo: nextNo }] });
  };

  // Keep BedCapacity in sync if user manually adds/removes beds
  useEffect(() => {
    if (room.beds.length !== Number(room.BedCapacity)) {
      onChange(index, { ...room, BedCapacity: room.beds.length || room.BedCapacity });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.beds.length]);

  const occ = occupiedBeds(room);
  const avail = availableBeds(room);

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
          <FaDoorOpen size={13} color={C.primary} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
            {room.RoomNo || `Room ${index + 1}`}
          </span>
          <span style={{ fontSize: 11, color: C.muted }}>
            {room.RoomType} · Floor {room.FloorNo || "—"}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
            background: avail > 0 ? "#E7F6EC" : "#FFEAEC",
            color: avail > 0 ? C.success : C.danger
          }}>
            {occ}/{room.beds.length || 0} occupied
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "0 12px" }}>
            <Field label="Room No">
              <Input value={room.RoomNo} onChange={e => update("RoomNo", e.target.value)} placeholder="R101" />
            </Field>
            <Field label="Floor No">
              <Input value={room.FloorNo} onChange={e => update("FloorNo", e.target.value)} placeholder="1" />
            </Field>
            <Field label="Room Type">
              <Select value={room.RoomType} onChange={e => update("RoomType", e.target.value)}>
                {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Room Status">
              <Select value={room.RoomStatus} onChange={e => update("RoomStatus", e.target.value)}>
                <option value="Available">Available</option>
                <option value="Full">Full</option>
                <option value="Maintenance">Maintenance</option>
              </Select>
            </Field>
            <Field label="Rate per Room">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={room.RatePerRoom}
                onChange={e => update("RatePerRoom", e.target.value)}
                placeholder="e.g. 500"
              />
            </Field>
          </div>

          <div style={{ marginTop: 6 }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8
            }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: C.muted,
                letterSpacing: "0.04em", textTransform: "uppercase"
              }}>
                Beds ({room.beds.length} total · {avail} available)
              </span>
              <button type="button" onClick={addBed} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "5px 11px", fontSize: 11, fontWeight: 700,
                color: C.primary, background: C.primary10,
                border: `1px solid ${C.primary20}`, borderRadius: 6, cursor: "pointer"
              }}>
                <FaPlus size={9} /> Add Bed
              </button>
            </div>

            {room.beds.length === 0 ? (
              <div style={{
                border: `1.5px dashed ${C.border}`, borderRadius: 7, padding: "12px",
                textAlign: "center", color: C.muted, fontSize: 12
              }}>
                <FaBed size={14} style={{ display: "block", margin: "0 auto 4px", opacity: 0.35 }} />
                No beds added yet
              </div>
            ) : room.beds.map((bed, bi) => (
              <BedRow key={bi} bed={bed}
                onChange={(updated) => updateBed(bi, updated)}
                onRemove={() => removeBed(bi)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Generic attachment panel (mirrors Customer.jsx) ───────────────
function AttachmentPanel({ docType, label, icon: Icon, data, onChangeNew, onRemoveExisting }) {
  const inputRef = useRef();
  const { existing = [], newFiles = [] } = data;

  const handleFiles = (e) => {
    const chosen = Array.from(e.target.files);
    onChangeNew(docType, [...newFiles, ...chosen]);
    e.target.value = "";
  };
  const removeNew = (idx) => onChangeNew(docType, newFiles.filter((_, i) => i !== idx));

  return (
    <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: C.bg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Icon size={13} color={C.primary} />
          <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{label}</span>
          {(existing.length + newFiles.length) > 0 && (
            <span style={{
              fontSize: 11, background: C.primary10, color: C.primary,
              border: `0.5px solid ${C.primary20}`, borderRadius: 99, padding: "2px 8px", fontWeight: 500
            }}>
              {existing.length + newFiles.length}
            </span>
          )}
        </div>
        <label style={{
          display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12,
          padding: "4px 11px", borderRadius: 6, cursor: "pointer",
          background: C.primary, color: "#fff", fontWeight: 500
        }}>
          Attach
          <input ref={inputRef} type="file" multiple style={{ display: "none" }} onChange={handleFiles} />
        </label>
      </div>

      {existing.length === 0 && newFiles.length === 0 && (
        <div style={{ padding: "20px 14px", textAlign: "center", color: C.muted, fontSize: 12 }}>
          <FaPaperclip style={{ fontSize: 18, opacity: 0.2, display: "block", margin: "0 auto 6px" }} />
          No files attached
        </div>
      )}

      {existing.map((filePath, i) => {
        const fname = filePath.split("/").pop();
        const FIcon = fileIcon(fname);
        return (
          <div key={`e-${i}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderTop: `0.5px solid ${C.border}` }}>
            <FIcon size={13} color={C.primary} />
            <a href={`${BASE_URL}/api/campfile?path=${encodeURIComponent(filePath)}`} target="_blank" rel="noreferrer"
              style={{ flex: 1, fontSize: 12, color: C.text, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {fname}
            </a>
            <button type="button" onClick={() => onRemoveExisting(docType, filePath)}
              style={{ background: "none", border: "none", cursor: "pointer", color: C.danger }}>
              <FaTimes size={11} />
            </button>
          </div>
        );
      })}

      {newFiles.map((f, i) => {
        const FIcon = fileIcon(f.name);
        return (
          <div key={`n-${i}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderTop: `0.5px solid ${C.border}`, background: "#FFFBF0" }}>
            <FIcon size={13} color={C.warn} />
            <div style={{ flex: 1, fontSize: 12 }}>{f.name} <span style={{ color: C.muted }}>(pending)</span></div>
            <button type="button" onClick={() => removeNew(i)}
              style={{ background: "none", border: "none", cursor: "pointer", color: C.danger }}>
              <FaTimes size={11} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
function Camp() {
  const [camp, setCamp] = useState(emptyCamp());
  const [rooms, setRooms] = useState([]);
  const [facilities, setFacilities] = useState(emptyFacilities());
  const [attachments, setAttachments] = useState({
    tradeLicence: { existing: [], newFiles: [] },
    campPermit: { existing: [], newFiles: [] },
    municipalityApproval: { existing: [], newFiles: [] },
    civilDefenceApproval: { existing: [], newFiles: [] },
  });
  const [docExpiry, setDocExpiry] = useState({
    tradeLicence: "", campPermit: "", municipalityApproval: "", civilDefenceApproval: "",
  });

  const [campList, setCampList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);
  const [isDeleteDisabled, setIsDeleteDisabled] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [fieldErrors, setFieldErrors] = useState({});
  const [otherDocuments, setOtherDocuments] = useState([]);
  const [clientLocations, setClientLocations] = useState([]); // [{AccountID, AccountName, ClientLocation}]
  const [loadingLocations, setLoadingLocations] = useState(false);
  const { getPermission, refreshPermissions } = usePermission();
  const permission = getPermission("CAMP");
  const canView = !!permission?.CanView;
  const canAdd = !!permission?.CanAdd;
  const canEdit = !!permission?.CanEdit;
  const canDelete = !!permission?.CanDelete;

  useEffect(() => {
    refreshPermissions();
  }, []);

  useEffect(() => {
    if (!canView) {
      setCampList([]);
      setShowForm(false);
      return;
    }
    fetchCamps();
  }, [canView]);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Keep TotalRooms / TotalCapacity in sync with the rooms list
  useEffect(() => {
    const totalCapacity = rooms.reduce((sum, r) => sum + (r.beds?.length || 0), 0);
    setCamp(p => ({ ...p, TotalRooms: rooms.length, TotalCapacity: totalCapacity }));
  }, [rooms]);
  const emptyOtherDoc = () => ({
    id: Date.now() + Math.random(),
    title: "",
    existing: [],
    newFiles: [],
    expiryDate: "",
  });

  const addOtherDoc = () => setOtherDocuments(p => [...p, emptyOtherDoc()]);

  const updateOtherDocTitle = (id, title) =>
    setOtherDocuments(p => p.map(d => d.id === id ? { ...d, title } : d));

  const updateOtherDocExpiry = (id, expiryDate) =>
    setOtherDocuments(p => p.map(d => d.id === id ? { ...d, expiryDate } : d));

  const removeOtherDoc = (id) =>
    setOtherDocuments(p => p.filter(d => d.id !== id));

  const handleOtherDocNewFiles = (id, files) =>
    setOtherDocuments(p => p.map(d => d.id === id ? { ...d, newFiles: files } : d));

  const removeOtherDocExisting = async (id, filePath) => {
    const doc = otherDocuments.find(d => d.id === id);
    if (!camp.CampID || !doc) return;
    try {
      await api.post("/api/deleteCampDoc", {
        campId: camp.CampID,
        docType: "other",
        filePath,
        title: doc.title,
      });
      setOtherDocuments(p =>
        p.map(d => d.id === id ? { ...d, existing: d.existing.filter(x => x !== filePath) } : d)
      );
      toast.success("File removed");
    } catch {
      toast.error("Failed to remove file");
    }
  };
// const fetchCampClientLocations = async (campId) => {
//   if (!campId) { setClientLocations([]); return; }
//   try {
//     setLoadingLocations(true);
//     const res = await api.get(`/api/GetCampClientLocations/${campId}`);
//     if (res.data.success) {
//       const locs = (res.data.locations || []).filter(l => l.ClientLocation);
//       setClientLocations(locs);

//       const distinct = [...new Set(locs.map(l => l.ClientLocation))];
//       if (distinct.length === 1) {
//         setCamp(p => ({ ...p, CampLocation: distinct[0] })); // pre-select if only one option
//       }
//     }
//   } catch { /* silent */ }
//   finally { setLoadingLocations(false); }
// };
  // ── Fetch helpers ──────────────────────────────────────────────
  const fetchCamps = async () => {
    try {
      setLoading(true);
      const CompanyID = sessionStorage.getItem("CompanyID");
      const res = await api.get("/api/GetCamp", { params: { CompanyID } });
      console.log("FULL first camp:", JSON.stringify(res.data.camps?.[0]));
      if (res.data.success) setCampList(res.data.camps || []);
      else toast.error("Failed to load camps");
    } catch { toast.error("Error fetching camps"); }
    finally { setLoading(false); }
  };

  const fetchCampDetails = async (campId) => {
    try {
      const res = await api.get(`/api/GetCampDetails/${campId}`);
      console.log(res)
      if (res.data.success) {
        const d = res.data;

        // Merge basic info from GetCampDetails (authoritative) into camp state.
        // Falls back gracefully if a field is missing or named differently.
        setCamp(prev => ({
          ...prev,
          CampCode: d.CampCode ?? prev.CampCode,
          CampName: d.CampName ?? prev.CampName,
          Description: d.Description ?? prev.Description,
          CampLocation: d.CampLocation ?? prev.CampLocation,
          Address: d.Address ?? prev.Address,
          CampManagerName: d.CampManagerName ?? prev.CampManagerName,
          CampManagerContactNo: d.CampManagerContactNo ?? d.CampManagerContactNO ?? prev.CampManagerContactNo,
          AlternateContactNo: d.AlternateContactNo ?? d.AlternateContactNO ?? prev.AlternateContactNo,
          CampStatus: d.CampStatus ?? prev.CampStatus,
          Latitude: d.Latitude ?? prev.Latitude,
          Longitude: d.Longitude ?? prev.Longitude,
          FromDate: toDateInputValue(d.FromDate) || prev.FromDate,   // ← new
          ToDate: toDateInputValue(d.ToDate) || prev.ToDate,         // ← new
        }));

        setRooms((d.rooms || []).map(r => ({
          RoomID: r.RoomID,
          RoomNo: r.RoomNo || "",
          FloorNo: r.FloorNo || "",
          RoomType: r.RoomType || "Standard",
          BedCapacity: r.BedCapacity || (r.beds || []).length,
          RoomStatus: r.RoomStatus || "Available",
          RatePerRoom: r.RatePerRoom ?? "",   // ← new
          beds: (r.beds || []).map(b => ({
            BedID: b.BedID, BedNo: b.BedNo || "",
            BedType: b.BedType || "Lower", Status: b.Status || "Available",
          })),
        })));
        if (d.facilities) setFacilities({ ...emptyFacilities(), ...d.facilities });
        if (d.documents) {
          setOtherDocuments(
            (d.documents.other || []).map(o => ({
              id: Date.now() + Math.random(),
              title: o.title || "",
              existing: o.files || [],
              newFiles: [],
              expiryDate: toDateInputValue(o.expiryDate),
            }))
          );
          setAttachments({
            tradeLicence: { existing: d.documents.tradeLicence || [], newFiles: [] },
            campPermit: { existing: d.documents.campPermit || [], newFiles: [] },
            municipalityApproval: { existing: d.documents.municipalityApproval || [], newFiles: [] },
            civilDefenceApproval: { existing: d.documents.civilDefenceApproval || [], newFiles: [] },
          });
          setDocExpiry({
            tradeLicence: toDateInputValue(d.documents.tradeLicenceExpiry),
            campPermit: toDateInputValue(d.documents.campPermitExpiry),
            municipalityApproval: toDateInputValue(d.documents.municipalityApprovalExpiry),
            civilDefenceApproval: toDateInputValue(d.documents.civilDefenceApprovalExpiry),
          });
        }
      }
    } catch { /* silent — camp basic info still usable without sub-details */ }
  };
 
  // ── Validation ─────────────────────────────────────────────────
  const isDuplicateCamp = (name, currentId = 0) =>
    campList.some(c =>
      c.CampName?.toLowerCase().trim() === name.toLowerCase().trim() && c.CampID !== currentId
    );

  const validate = (isUpdate = false) => {
    const errors = {};
    if (!camp.CampName?.trim()) errors.CampName = "Camp name is required";
    else if (isDuplicateCamp(camp.CampName, isUpdate ? camp.CampID : 0)) errors.CampName = "Camp name already exists";
    if (!camp.CampLocation?.trim()) errors.CampLocation = "Camp location is required";
    if (camp.CampManagerContactNo && !/^\d{7,15}$/.test(camp.CampManagerContactNo)) {
      errors.CampManagerContactNo = "Enter a valid contact number";
    }
    for (const r of rooms) {
      if (!r.RoomNo?.trim()) { toast.warning("Every room needs a Room No"); return false; }
    }

    // ↓ paste this block here ↓
    if (otherDocuments.some(d => !d.title?.trim())) {
      toast.warning("Every other document needs a title");
      return false;
    }
    // ↑ new block ↑

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.warning(Object.values(errors)[0]);
      return false;
    }
    return true;
  };

  // ── Input handlers ─────────────────────────────────────────────
  const handleInput = (e) => {
    let { name, value } = e.target;
    if (name === "CampManagerContactNo" || name === "AlternateContactNo") {
      value = value.replace(/\D/g, "");
    }
    setCamp(p => ({ ...p, [name]: value }));
  };

  const handleNewFiles = (docType, files) =>
    setAttachments(p => ({ ...p, [docType]: { ...p[docType], newFiles: files } }));

  const handleRemoveExisting = async (docType, filePath) => {
    if (!camp.CampID) return;
    try {
      await api.post("/api/deleteCampDoc", { campId: camp.CampID, docType, filePath });
      setAttachments(p => ({
        ...p, [docType]: { ...p[docType], existing: p[docType].existing.filter(x => x !== filePath) }
      }));
      toast.success("File removed");
    } catch { toast.error("Failed to remove file"); }
  };

  const toggleFacility = (key) => setFacilities(p => ({ ...p, [key]: !p[key] }));

  // ── Room handlers ──────────────────────────────────────────────
  const addRoom = () => setRooms(p => [...p, emptyRoom()]);
  const updateRoom = (idx, updated) => setRooms(p => p.map((r, i) => i === idx ? updated : r));
  const removeRoom = (idx) => setRooms(p => p.filter((_, i) => i !== idx));

  // ── Row click (list → form) ────────────────────────────────────
  const handleRowClick = async (item) => {
    if (!canView) {
      toast.error("You do not have permission to view camps.");
      return;
    }

    setCamp({
      CampID: item.CampID,
      CampCode: item.CampCode || "",
      CampName: item.CampName || "",
      Description: item.Description || "",
      CampLocation: item.CampLocation || item.Location || "",
      Address: item.Address || "",
      CampManagerName: item.CampManagerName || "",
      CampManagerContactNo: item.CampManagerContactNo || "",
      AlternateContactNo: item.AlternateContactNo || "",
      TotalRooms: item.TotalRooms || 0,
      TotalCapacity: item.TotalCapacity || 0,
      CampStatus: item.CampStatus ?? 1,
      Latitude: item.Latitude || "",
      Longitude: item.Longitude || "",
      FromDate: toDateInputValue(item.FromDate),   // ← new
      ToDate: toDateInputValue(item.ToDate),
    });
    setIsSubmitDisabled(true); setIsUpdateDisabled(false); setIsDeleteDisabled(false);
    setShowForm(true); setActiveTab("basic"); setFieldErrors({});
    await fetchCampDetails(item.CampID);
    await fetchCampClientLocations(item.CampID);

  };

  const buildPayload = (isUpdate = false) => {
    const CompanyID = sessionStorage.getItem("CompanyID");
    const CreatedBy = sessionStorage.getItem("UserId");

    // compute here so the values are fresh at submit time
    const totalRent = rooms.reduce((sum, r) => sum + (Number(r.RatePerRoom) || 0), 0);
    const rentLoss = rooms.reduce((sum, r) => {
      const rate = Number(r.RatePerRoom) || 0;
      if (!rate) return sum;
      const bedCount = r.beds?.length || 0;
      if (bedCount === 0) return sum + rate;
      const perBedRate = rate / bedCount;
      return sum + perBedRate * availableBeds(r);
    }, 0);

    return {
      CampID: isUpdate ? camp.CampID : 0,
      CampName: camp.CampName,
      Description: camp.Description,
      CampLocation: camp.CampLocation,
      Address: camp.Address || null,
      CampManagerName: camp.CampManagerName,
      CampManagerContactNo: camp.CampManagerContactNo,
      AlternateContactNo: camp.AlternateContactNo,
      TotalRooms: rooms.length,
      TotalCapacity: rooms.reduce((s, r) => s + (r.beds?.length || 0), 0),
      CampStatus: camp.CampStatus ?? 1,
      Latitude: camp.Latitude || null,
      Longitude: camp.Longitude || null,
      FromDate: camp.FromDate || null,
      ToDate: camp.ToDate || null,
      TotalRent: totalRent,   // ← new
      RentLoss: parseFloat(rentLoss.toFixed(2)),  // ← new
      Rooms: rooms.map(r => ({
        RoomID: r.RoomID || 0,
        RoomNo: r.RoomNo,
        FloorNo: r.FloorNo,
        RoomType: r.RoomType,
        BedCapacity: r.beds.length,
        RoomStatus: r.RoomStatus,
        RatePerRoom: r.RatePerRoom ? Number(r.RatePerRoom) : null,
        Beds: r.beds.map(b => ({
          BedID: b.BedID || 0,
          BedNo: b.BedNo,
          BedType: b.BedType,
          Status: b.Status,
        })),
      })),
      Facilities: facilities,
      DocumentExpiry: docExpiry,
      CompanyID,
      CreatedBy,
      OtherDocuments: otherDocuments.map(d => ({
        title: d.title,
        expiryDate: d.expiryDate || null,
      })),
    };
  };
  // ── Upload pending docs ────────────────────────────────────────
  const uploadPendingDocs = async (campId) => {
    // 1. Fixed document types (tradeLicence, campPermit, municipalityApproval, civilDefenceApproval)
    for (const docType of Object.keys(attachments)) {
      const doc = attachments[docType];
      if (!doc.newFiles.length) continue;
      const formData = new FormData();
      formData.append("campId", campId);
      formData.append("docType", docType);
      if (docExpiry[docType]) formData.append("expiryDate", docExpiry[docType]);
      doc.newFiles.forEach(f => formData.append("files", f));
      try {
        const res = await api.post("/api/uploadCampDocs", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data.success) {
          setAttachments(p => ({
            ...p,
            [docType]: { existing: res.data.files, newFiles: [] },
          }));
        }
      } catch {
        toast.error(`Failed to upload "${docType}" files`);
      }
    }

    // 2. "Other" custom-titled documents
    for (const doc of otherDocuments) {
      if (!doc.newFiles.length) continue;
      const formData = new FormData();
      formData.append("campId", campId);
      formData.append("docType", "other");
      formData.append("title", doc.title);
      if (doc.expiryDate) formData.append("expiryDate", doc.expiryDate);
      doc.newFiles.forEach(f => formData.append("files", f));
      try {
        const res = await api.post("/api/uploadCampDocs", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data.success) {
          setOtherDocuments(p =>
            p.map(d => d.id === doc.id ? { ...d, existing: res.data.files, newFiles: [] } : d)
          );
        }
      } catch {
        toast.error(`Failed to upload "${doc.title || "Untitled"}" files`);
      }
    }
  };

  // ── Submit (Insert) ──────────────────────────────────────────── 
  const handleSubmit = async () => {
    if (!canAdd) {
      toast.error("You do not have permission to create camps.");
      return;
    }
    if (!validate()) return;
    try {
      setLoadingSubmit(true);
      const res = await api.post("/api/InsertUpdateCampFull", buildPayload(false));
      if (res.data.success) {
        toast.success("Camp added successfully");
        const newCampId = res.data.CampID;
        await uploadPendingDocs(newCampId);
        fetchCamps();
        setCamp(prev => ({ ...prev, CampID: newCampId }));
        setIsSubmitDisabled(true); setIsUpdateDisabled(false); setIsDeleteDisabled(false);
        await fetchCampDetails(newCampId);
      } else toast.error(res.data.message || "Insert failed");
    } catch (err) { toast.error(err.response?.data?.message || "Insert failed"); }
    finally { setLoadingSubmit(false); }
  };

  // ── Update ─────────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!canEdit) {
      toast.error("You do not have permission to update camps.");
      return;
    }
    if (!camp.CampID) { toast.warning("Please select a camp to update"); return; }
    if (!validate(true)) return;
    try {
      setLoadingUpdate(true);
      const res = await api.post("/api/InsertUpdateCampFull", buildPayload(true));
      if (res.data.success) {
        toast.success("Camp updated successfully");
        await uploadPendingDocs(camp.CampID);
        fetchCamps();
        await fetchCampDetails(camp.CampID);
      } else toast.error(res.data.message || "Update failed");
    } catch (err) { toast.error(err.response?.data?.message || "Update failed"); }
    finally { setLoadingUpdate(false); }
  };

  // ── Delete ─────────────────────────────────────────────────────
  const confirmDeleteToast = (message) => new Promise(resolve => {
    const id = toast.warning(
      () => (
        <div>
          <div style={{ marginBottom: 10, fontWeight: 600 }}>{message}</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-danger btn-sm" onClick={() => { toast.dismiss(id); resolve(true); }}>Delete</button>
            <button className="btn btn-secondary btn-sm" onClick={() => { toast.dismiss(id); resolve(false); }}>Cancel</button>
          </div>
        </div>
      ),
      { position: "top-center", autoClose: false, closeOnClick: false, draggable: false, closeButton: false }
    );
  });

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error("You do not have permission to delete camps.");
      return;
    }
    if (!camp.CampID) { toast.error("No camp selected"); return; }
    const ok = await confirmDeleteToast("Delete this camp? All rooms and beds will be removed.");
    if (!ok) return;
    try {
      setLoadingDelete(true);
      const DeletedBy = parseInt(sessionStorage.getItem("UserId"), 10);
      const res = await api.post("/api/deleteCamp", { CampID: camp.CampID, DeletedBy });
      if (res.data.success) {
        toast.success("Camp deleted"); fetchCamps(); handleClear(); setShowForm(false);
      } else toast.error(res.data.message || "Delete failed");
    } catch (err) { toast.error(err.response?.data?.message || "Delete failed"); }
    finally { setLoadingDelete(false); }
  };

  // ── Clear / navigation ─────────────────────────────────────────
  const handleClear = () => {
    setCamp(emptyCamp());
    setRooms([]);
    setFacilities(emptyFacilities());
    setAttachments({
      tradeLicence: { existing: [], newFiles: [] },
      campPermit: { existing: [], newFiles: [] },
      municipalityApproval: { existing: [], newFiles: [] },
      civilDefenceApproval: { existing: [], newFiles: [] },
    });
    setDocExpiry({ tradeLicence: "", campPermit: "", municipalityApproval: "", civilDefenceApproval: "" });
    setIsSubmitDisabled(false); setIsUpdateDisabled(true); setIsDeleteDisabled(true);
    setFieldErrors({}); toast.dismiss();
    setOtherDocuments([]);
    setClientLocations([]);
  };

  const handleCreateNew = () => {
    if (!canAdd) {
      toast.error("You do not have permission to create camps.");
      return;
    }
    handleClear(); setShowForm(true); setActiveTab("basic");
  };
  const handleBackToList = () => { setShowForm(false); handleClear(); };

  const filteredCamps = campList.filter(c =>
    c.CampName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.CampCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.CampLocation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAttachments =
    Object.values(attachments).reduce((s, a) => s + a.existing.length + a.newFiles.length, 0) +
    otherDocuments.reduce((s, d) => s + d.existing.length + d.newFiles.length, 0);
  const totalBeds = rooms.reduce((s, r) => s + (r.beds?.length || 0), 0);
  const totalOccupied = rooms.reduce((s, r) => s + occupiedBeds(r), 0);

  // ── Rent & loss calculations ──────────────────────────────────
  const totalRent = rooms.reduce((sum, r) => sum + (Number(r.RatePerRoom) || 0), 0);

  const rentLoss = rooms.reduce((sum, r) => {
    const rate = Number(r.RatePerRoom) || 0;
    if (!rate) return sum; // no rent set, nothing to lose
    const bedCount = r.beds?.length || 0;
    if (bedCount === 0) return sum + rate; // no beds to occupy → entire rent is loss
    const perBedRate = rate / bedCount;
    const unoccupied = availableBeds(r); // beds.length - occupiedBeds
    return sum + perBedRate * unoccupied;
  }, 0);

  const TABS = [
    { key: "basic", label: "Basic Info", icon: FaWarehouse },
    { key: "rooms", label: "Rooms & Beds", icon: FaBed, badge: rooms.length || undefined },
    { key: "facilities", label: "Facilities", icon: FaCheck, badge: Object.values(facilities).filter(Boolean).length || undefined },
    { key: "documents", label: "Documents", icon: FaPaperclip, badge: totalAttachments || undefined },
  ];
  const tabOrder = TABS.map(t => t.key);

  if (!canView) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", width: "100%" }}>
        <ToastContainer position="top-center" autoClose={3000} />
        <div style={{ padding: 24 }}>
          <div className="alert alert-danger">You do not have permission to view Camp Management.</div>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div style={{
      background: C.bg, minHeight: "100vh", width: "100%",
      fontFamily: "'Inter', 'Segoe UI', sans-serif", boxSizing: "border-box"
    }}>
      <ToastContainer position="top-center" autoClose={3000} />

      {!showForm ? (
        // ══ LIST VIEW ════════════════════════════════════════════
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 24px", background: C.surface,
            borderBottom: `1px solid ${C.border}`, flexShrink: 0
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, background: C.primary, borderRadius: 9,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <FaWarehouse size={16} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Camps</div>
                <div style={{ fontSize: 11, color: C.muted }}>{campList.length} total camps</div>
              </div>
            </div>
            <button type="button" onClick={handleCreateNew} disabled={!canAdd} style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px",
              background: C.primary, color: "#fff", border: "none", borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: "pointer"
            }}>
              <FaPlus size={11} /> New Camp
            </button>
          </div>

          {/* Search bar */}
          <div style={{ padding: "12px 24px", flexShrink: 0 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "8px 14px"
            }}>
              <FaSearch size={13} color={C.muted} />
              <input type="text" placeholder="Search by camp name, code or location…"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: C.text, background: "transparent" }} />
            </div>
          </div>

          {/* Table */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 24px" }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
                  <div style={{ width: 30, height: 30, border: `3px solid ${C.primary}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 10px", animation: "spin 0.7s linear infinite" }} />
                  Loading camps…
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                    <tr style={{ background: C.primary10 }}>
                      {["Camp", "Manager", "Contact", "Rooms", "Capacity", "Status"].map(h => (
                        <th key={h} style={{
                          padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700,
                          color: C.primary, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap"
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCamps.length > 0 ? filteredCamps.map((c, idx) => (
                      <tr key={c.CampID} onClick={() => handleRowClick(c)}
                        style={{
                          cursor: "pointer", borderTop: `1px solid ${C.border}`,
                          background: camp.CampID === c.CampID ? C.primary10 : idx % 2 === 0 ? "#fff" : "#FAFBFD",
                          transition: "background 0.1s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = C.primary10}
                        onMouseLeave={e => e.currentTarget.style.background = camp.CampID === c.CampID ? C.primary10 : idx % 2 === 0 ? "#fff" : "#FAFBFD"}>
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: "50%", background: C.primary,
                              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                            }}>
                              <FaWarehouse size={13} color="#fff" />
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{c.CampName}</div>
                              {c.CampLocation && <div style={{ fontSize: 11, color: C.muted }}>{c.CampLocation}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "10px 16px", fontSize: 13, color: C.text }}>{c.CampManagerName || "—"}</td>
                        <td style={{ padding: "10px 16px", fontSize: 13, color: C.muted }}>{c.CampManagerContactNo || "—"}</td>
                        <td style={{ padding: "10px 16px", fontSize: 13, color: C.text }}>{c.TotalRooms || 0}</td>
                        <td style={{ padding: "10px 16px", fontSize: 13, color: C.text }}>{c.TotalCapacity || 0}</td>
                        <td style={{ padding: "10px 16px" }}>
                          <span style={{
                            display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                            background: Number(c.CampStatus) === 0 ? C.danger : C.success,
                            marginRight: 6, verticalAlign: "middle"
                          }} />
                          <span style={{ fontSize: 12, color: Number(c.CampStatus) === 0 ? C.danger : C.success, fontWeight: 600 }}>
                            {Number(c.CampStatus) === 0 ? "Inactive" : "Active"}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} style={{ padding: 60, textAlign: "center", color: C.muted }}>
                          <FaWarehouse size={38} style={{ display: "block", margin: "0 auto 10px", opacity: 0.25 }} />
                          No camps found
                          <br />
                          <button onClick={handleCreateNew} style={{
                            marginTop: 12, padding: "8px 18px", background: C.primary,
                            color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer"
                          }}>
                            <FaPlus style={{ marginRight: 5 }} />Create New Camp
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : (
        // ══ FORM VIEW ════════════════════════════════════════════
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>

          {/* Form header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 24px", background: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34, height: 34, background: C.primary, borderRadius: 9,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <FaWarehouse size={15} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                  {camp.CampID ? "Edit Camp" : "New Camp"}
                  {camp.CampName && <span style={{ color: C.muted, fontWeight: 400, marginLeft: 6 }}>— {camp.CampName}</span>}
                </div>
                {camp.CampID > 0 && (
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                    {rooms.length} rooms · {totalBeds} beds · {totalOccupied} occupied
                  </div>
                )}
              </div>
            </div>
            <button onClick={handleBackToList} style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px",
              fontSize: 13, fontWeight: 600, color: C.primary, background: C.surface,
              border: `1.5px solid ${C.primary}`, borderRadius: 7, cursor: "pointer"
            }}>
              <FaArrowLeft size={11} /> Back
            </button>
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

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

            {/* ── TAB: Basic Info ── */}
            {activeTab === "basic" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
                <div>
                  <SectionCard icon={FaWarehouse} title="Camp Identity">
                    <Field label="Camp Name" required>
                      <Input name="CampName" value={camp.CampName} onChange={handleInput}
                        placeholder="Enter camp name"
                        style={fieldErrors.CampName ? { borderColor: C.danger } : {}} />
                      {fieldErrors.CampName && (
                        <span style={{ fontSize: 11, color: C.danger, display: "block", marginTop: 2 }}>{fieldErrors.CampName}</span>
                      )}
                    </Field>
                    {camp.CampCode && (
                      <Field label="Camp Code">
                        <Input value={camp.CampCode} disabled style={{ background: C.bg, color: C.muted }} />
                      </Field>
                    )}
                    <Field label="Description">
                      <TextArea name="Description" value={camp.Description} onChange={handleInput}
                        placeholder="Brief description of the camp" rows={2} />
                    </Field>
                    <Field label="Status">
                      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4 }}>
                        <button
                          type="button"
                          onClick={() => setCamp(p => ({ ...p, CampStatus: p.CampStatus ? 0 : 1 }))}
                          style={{
                            width: 44, height: 24, borderRadius: 999, border: "none",
                            background: camp.CampStatus ? C.primary : C.border,
                            position: "relative", cursor: "pointer",
                            transition: "background 0.2s", flexShrink: 0,
                          }}
                        >
                          <span style={{
                            position: "absolute", top: 3, width: 18, height: 18,
                            borderRadius: "50%", background: "#fff",
                            left: camp.CampStatus ? 23 : 3,
                            transition: "left 0.2s",
                          }} />
                        </button>
                        <span style={{ fontSize: 13, fontWeight: 600, color: camp.CampStatus ? C.primary : C.muted }}>
                          {camp.CampStatus ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </Field>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px", marginTop: 4 }}>
                      <Field label="From Date">
                        <Input
                          type="date"
                          name="FromDate"
                          value={camp.FromDate}
                          onChange={handleInput}
                        />
                      </Field>
                      <Field label="To Date">
                        <Input
                          type="date"
                          name="ToDate"
                          value={camp.ToDate}
                          onChange={handleInput}
                        />
                      </Field>
                    </div>
                  </SectionCard>
                  <SectionCard icon={FaLayerGroup} title="Occupancy Summary">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                      {[
                        { label: "Total Rooms", value: rooms.length },
                        { label: "Total Beds", value: totalBeds },
                        { label: "Occupied", value: totalOccupied },
                        { label: "Available", value: totalBeds - totalOccupied },
                        { label: "Total Rent", value: `₹${totalRent.toLocaleString("en-IN")}` },
                        {
                          label: "Rent Loss",
                          value: `₹${rentLoss.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
                          danger: rentLoss > 0,
                        },
                      ].map(s => (
                        <div key={s.label} style={{
                          background: s.danger ? "#FFF2F2" : C.bg,
                          border: `1px solid ${s.danger ? "#F6D2D6" : C.border}`,
                          borderRadius: 8,
                          padding: "10px 12px"
                        }}>
                          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                            {s.label}
                          </div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: s.danger ? C.danger : C.text, marginTop: 2 }}>
                            {s.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </div>

                <div>
                  <SectionCard icon={FaMapMarkerAlt} title="Location & Manager">
                    {/* <Field label="Camp Location" required>
  {clientLocations.length > 0 ? (
    <Select
  value={camp.CampLocation}
  onChange={e => setCamp(p => ({ ...p, CampLocation: e.target.value }))}
  style={fieldErrors.CampLocation ? { borderColor: C.danger } : {}}
>
  <option value="">— Select Client Location —</option>
  {[...new Set(clientLocations.map(l => l.ClientLocation))].map(loc => (
    <option key={loc} value={loc}>{loc}</option>
  ))}
</Select>
  ) : (
    <Input
      name="CampLocation"
      value={camp.CampLocation}
      onChange={handleInput}
      placeholder="e.g. Dubai Investment Park"
      style={fieldErrors.CampLocation ? { borderColor: C.danger } : {}}
    />
  )}
  {loadingLocations && (
    <span style={{ fontSize: 11, color: C.muted, display: "block", marginTop: 3 }}>
      Loading client location…
    </span>
  )}
  {fieldErrors.CampLocation && (
    <span style={{ fontSize: 11, color: C.danger, display: "block", marginTop: 2 }}>{fieldErrors.CampLocation}</span>
  )}
</Field> */}
{/* <Field label="Camp Location" required>
  {clientLocations.length > 0 ? (
    <Select
      value={camp.CampLocation}
      onChange={e => setCamp(p => ({ ...p, CampLocation: e.target.value }))}
      style={fieldErrors.CampLocation ? { borderColor: C.danger } : {}}
    >
      <option value="">— Select Client Location —</option>
      {clientLocations.map(l => (
        <option key={l.AccountID} value={l.ClientLocation}>
          {l.ClientLocation} ({l.AccountName})
        </option>
      ))}
    </Select>
  ) : (
    <Input
      name="CampLocation"
      value={camp.CampLocation}
      onChange={handleInput}
      placeholder="e.g. Dubai Investment Park"
      style={fieldErrors.CampLocation ? { borderColor: C.danger } : {}}
    />
  )}
  {loadingLocations && (
    <span style={{ fontSize: 11, color: C.muted, display: "block", marginTop: 3 }}>
      Loading client location…
    </span>
  )}
  {fieldErrors.CampLocation && (
    <span style={{ fontSize: 11, color: C.danger, display: "block", marginTop: 2 }}>{fieldErrors.CampLocation}</span>
  )}
</Field>  */}

<Field label="Camp Location" required>
  <Input
    name="CampLocation"
    value={camp.CampLocation}
    onChange={handleInput}
    placeholder="e.g. Dubai Investment Park"
    style={fieldErrors.CampLocation ? { borderColor: C.danger } : {}}
  />
  {fieldErrors.CampLocation && (
    <span style={{ fontSize: 11, color: C.danger, display: "block", marginTop: 2 }}>{fieldErrors.CampLocation}</span>
  )}
</Field>
                    <Field label="Address">
                      <TextArea name="Address" value={camp.Address} onChange={handleInput}
                        placeholder="Full street address of the camp" rows={2} />
                    </Field>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
                      <Field label="Latitude">
                        <Input name="Latitude" value={camp.Latitude} onChange={handleInput} placeholder="e.g. 25.276987" />
                      </Field>
                      <Field label="Longitude">
                        <Input name="Longitude" value={camp.Longitude} onChange={handleInput} placeholder="e.g. 55.296249" />
                      </Field>
                      <Field label="Camp Manager Name">
                        <Input name="CampManagerName" value={camp.CampManagerName} onChange={handleInput} placeholder="Manager / incharge name" />
                      </Field>
                      <Field label="Manager Contact No">
                        <Input name="CampManagerContactNo" value={camp.CampManagerContactNo} onChange={handleInput}
                          placeholder="Mobile number"
                          style={fieldErrors.CampManagerContactNo ? { borderColor: C.danger } : {}} />
                        {fieldErrors.CampManagerContactNo && (
                          <span style={{ fontSize: 11, color: C.danger, display: "block", marginTop: 2 }}>{fieldErrors.CampManagerContactNo}</span>
                        )}
                      </Field>
                      <Field label="Alternate Contact No">
                        <Input name="AlternateContactNo" value={camp.AlternateContactNo} onChange={handleInput} placeholder="Optional" />
                      </Field>
                    </div>
                  </SectionCard>
                </div>
              </div>
            )}

            {/* ── TAB: Rooms & Beds ── */}
            {activeTab === "rooms" && (
              <div>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${C.border}`
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Rooms & Bed Spaces</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                      Add rooms, then add individual beds within each room.
                    </div>
                  </div>
                  <button type="button" onClick={addRoom} style={{
                    display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px",
                    fontSize: 12, fontWeight: 700, color: C.primary, background: C.primary10,
                    border: `1px solid ${C.primary20}`, borderRadius: 7, cursor: "pointer", whiteSpace: "nowrap"
                  }}>
                    <FaPlus size={10} /> Add Room
                  </button>
                </div>

                {rooms.length === 0 ? (
                  <div style={{
                    border: `1.5px dashed ${C.border}`, borderRadius: 10, padding: "32px 16px",
                    textAlign: "center", color: C.muted, fontSize: 13
                  }}>
                    <FaDoorOpen size={26} style={{ display: "block", margin: "0 auto 8px", opacity: 0.25 }} />
                    No rooms added yet — click "Add Room" to get started
                  </div>
                ) : rooms.map((room, idx) => (
                  <RoomCard key={idx} room={room} index={idx}
                    onChange={updateRoom} onRemove={removeRoom} canRemove={rooms.length >= 1} />
                ))}
              </div>
            )}

            {/* ── TAB: Facilities ── */}
            {activeTab === "facilities" && (
              <div>
                <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Camp Facilities</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                    Toggle the amenities available at this camp.
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                  {FACILITIES.map(f => {
                    const on = !!facilities[f.key];
                    return (
                      <button key={f.key} type="button" onClick={() => toggleFacility(f.key)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "12px 14px", borderRadius: 9, cursor: "pointer",
                          border: `1.5px solid ${on ? C.primary : C.border}`,
                          background: on ? C.primary10 : C.surface,
                          transition: "all 0.15s", textAlign: "left",
                        }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          background: on ? C.primary : C.bg,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <f.icon size={14} color={on ? "#fff" : C.muted} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: on ? C.primary : C.text, flex: 1 }}>
                          {f.label}
                        </span>
                        {on && <FaCheck size={12} color={C.primary} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── TAB: Documents ── */}
            {activeTab === "documents" && (
              <div style={{ maxWidth: "100%", padding: "4px 0" }}>
                <p style={{ fontSize: 15, fontWeight: 500, color: C.text, margin: "0 0 3px" }}>Documents</p>
                <p style={{ fontSize: 12, color: C.muted, margin: "0 0 16px" }}>
                  Attach licences and approvals for this camp. Each can have its own expiry date.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {DOC_TYPES.map(d => (
                    <div key={d.key}>
                      <AttachmentPanel
                        docType={d.key}
                        label={d.label}
                        icon={d.icon}
                        data={attachments[d.key]}
                        onChangeNew={handleNewFiles}
                        onRemoveExisting={handleRemoveExisting}
                      />
                      <div style={{ marginTop: 8 }}>
                        <Field label={`${d.label} Expiry Date`}>
                          <Input type="date" value={docExpiry[d.key]}
                            onChange={e => setDocExpiry(p => ({ ...p, [d.key]: e.target.value }))} />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px dashed ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Other Documents</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                        Add any additional documents with a custom title.
                      </div>
                    </div>
                    <button type="button" onClick={addOtherDoc} style={{
                      display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px",
                      fontSize: 12, fontWeight: 700, color: C.primary, background: C.primary10,
                      border: `1px solid ${C.primary20}`, borderRadius: 7, cursor: "pointer"
                    }}>
                      <FaPlus size={10} /> Add Document
                    </button>
                  </div>

                  {otherDocuments.length === 0 ? (
                    <div style={{
                      border: `1.5px dashed ${C.border}`, borderRadius: 9, padding: "20px 14px",
                      textAlign: "center", color: C.muted, fontSize: 12
                    }}>
                      No other documents added
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      {otherDocuments.map(doc => (
                        <div key={doc.id} style={{
                          border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, background: C.surface
                        }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 10 }}>
                            <div style={{ flex: 1 }}>
                              <Field label="Document Title" required>
                                <Input
                                  value={doc.title}
                                  onChange={e => updateOtherDocTitle(doc.id, e.target.value)}
                                  placeholder="e.g. Fire Safety Certificate"
                                />
                              </Field>
                            </div>
                            <button type="button" onClick={() => removeOtherDoc(doc.id)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: C.danger, marginBottom: 14 }}>
                              <FaTrashAlt size={12} />
                            </button>
                          </div>

                          <AttachmentPanel
                            docType={doc.id}
                            label={doc.title || "Untitled Document"}
                            icon={FaPaperclip}
                            data={{ existing: doc.existing, newFiles: doc.newFiles }}
                            onChangeNew={(_, files) => handleOtherDocNewFiles(doc.id, files)}
                            onRemoveExisting={(_, filePath) => removeOtherDocExisting(doc.id, filePath)}
                          />

                          <div style={{ marginTop: 8 }}>
                            <Field label="Expiry Date">
                              <Input type="date" value={doc.expiryDate}
                                onChange={e => updateOtherDocExpiry(doc.id, e.target.value)} />
                            </Field>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

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
              <ActionBtn icon={FaEraser} label="Clear" onClick={handleClear} />
              <ActionBtn icon={FaSave} label="Submit" loadingLabel="Saving…" loading={loadingSubmit}
                disabled={isSubmitDisabled || loadingSubmit || !canAdd} onClick={handleSubmit} variant="solid" />
              <ActionBtn icon={FaEdit} label="Update" loadingLabel="Updating…" loading={loadingUpdate}
                disabled={isUpdateDisabled || loadingUpdate || !canEdit} onClick={handleUpdate} />
              <ActionBtn icon={FaTrashAlt} label="Delete" loadingLabel="Deleting…" loading={loadingDelete}
                disabled={isDeleteDisabled || loadingDelete || !canDelete} onClick={handleDelete} />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {activeTab !== "basic" && (
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
              {activeTab !== "documents" && (
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
      )}
    </div>
  );
}

export default Camp;