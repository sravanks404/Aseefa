  import React, { useState, useEffect, useRef } from "react";
  import api from "../../apiService";
  import { ToastContainer, toast } from "react-toastify";
  import "react-toastify/dist/ReactToastify.css";
  import { usePermission } from "../../../src/context/permissionContex";

  import {
    FaUsers, FaSearch, FaPlus, FaUser, FaPhone, FaEnvelope,
    FaMapMarkerAlt, FaEdit, FaTrashAlt, FaEraser, FaSave,
    FaArrowLeft, FaRoute, FaPaperclip, FaTimes, FaUpload,
    FaUserTie, FaFileAlt, FaIdCard, FaFilePdf, FaFileImage,
    FaFileWord, FaChevronDown, FaProjectDiagram
  } from "react-icons/fa";

  // ─── Design tokens ────────────────────────────────────────────────

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

  const DESIGNATIONS = [
    "Other"
  ];

  const DOC_TYPES = [
    { key: "tradeLicence", label: "Trade Licence", icon: FaIdCard },
    { key: "vatCertificate", label: "VAT Certificate", icon: FaFileAlt },
    { key: "contract", label: "Contract / Agreement", icon: FaFilePdf },
  ];

  const emptyContact = () => ({
    name: "", designation: "", mobile: "", email: "", isPrimary: false
  });

  const emptyCustomer = () => ({
    AccountID: 0, AcHeadId: 0, Name: "", Address: "", ShipTo: "",
    City: "", Country: "", Pincode: "", District: "", State: "", Sponsor: "", sponsors: [],
    TinNo: "", CSTNo: "", GSTinNo: "", VATNo: "", TradeLicenceNo: "",
    TradeLicenceExpiry: "", CreditDays: 0, KM: 0,
    DiscountPercentage: "", CreditLimit: 0, CreditAmount: 0,
    Billcount: 0, RateType: "", RootId: 0,
    RoutePosition: 0, SaleBlock: "No", SponsorID: 0, IsSupplier: 0,
    AdharNo: "", Phone: "", countryIso2: "", IsActive: 1,
    LedgerID: "", LedgerName: "",   // ← ADD THIS LINE
  });

  const emptyProject = () => ({
    UnitID: 0,
    ProjectName: "",
    ProjectCode: "",
    ClientID: "",
    Location: "",
    StartDate: "",
    EndDate: "",
    TotalManpower: "", 
    VehicleIds: [],
    CampIds: [],SalesRepId: "", 
  }); 

  // ─── Utility helpers ───────────────────────────────────────────────
  function fileIcon(name = "") {
    const ext = (name || "").split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return FaFileImage;
    if (ext === "pdf") return FaFilePdf;
    if (["doc", "docx"].includes(ext)) return FaFileWord;
    return FaFileAlt;
  }

  function toDateInputValue(val) {
    if (!val) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  }

  // ─── Base input style ──────────────────────────────────────────────
  const inputStyle = {
    width: "100%", padding: "8px 11px", fontSize: 13, color: C.text,
    border: `1.5px solid ${C.border}`, borderRadius: 7, outline: "none",
    background: C.surface, transition: "border-color 0.15s", boxSizing: "border-box",
  };

  // ─── Sub-components ────────────────────────────────────────────────
  function SectionCard({ icon: Icon, title, children }) {
    return (
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 10, overflow: "hidden", marginBottom: 16
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 16px", borderBottom: `1px solid ${C.border}`,
          background: C.primary10
        }}>
          <Icon size={13} color={C.primary} />
          <span style={{
            fontSize: 12, fontWeight: 700, color: C.primary,
            letterSpacing: "0.05em", textTransform: "uppercase"
          }}>{title}</span>
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

  function AttachmentPanel({ docType, label, icon: Icon, data, onChangeNew, onRemoveExisting, hideHeader }) {
    const inputRef = useRef();
    const [isDragging, setIsDragging] = useState(false);
    const { existing = [], newFiles = [] } = data;

    const handleFiles = (e) => {
      const chosen = Array.from(e.target.files);
      onChangeNew(docType, [...newFiles, ...chosen]);
      e.target.value = "";
    };
    const removeNew = (idx) => onChangeNew(docType, newFiles.filter((_, i) => i !== idx));

    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = Array.from(e.dataTransfer.files || []);
      if (dropped.length) onChangeNew(docType, [...newFiles, ...dropped]);
    };

    return (
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        style={{
          marginBottom: hideHeader ? 0 : 14,
          ...(isDragging ? { background: C.primary10, borderRadius: 8, outline: `2px dashed ${C.primary}`, outlineOffset: 2 } : {})
        }}
      >
        {/* ...unchanged header blocks... */}
        <input ref={inputRef} type="file" multiple style={{ display: "none" }} onChange={handleFiles} />
        {/* ...unchanged existing/newFiles lists... */}
        {existing.length === 0 && newFiles.length === 0 && (
          <div onClick={() => inputRef.current.click()} style={{
            border: `1.5px dashed ${isDragging ? C.primary : C.border}`, borderRadius: 7, padding: "12px",
            textAlign: "center", cursor: "pointer", color: isDragging ? C.primary : C.muted, fontSize: 12
          }}>
            <FaPaperclip size={16} style={{ display: "block", margin: "0 auto 4px", opacity: isDragging ? 0.7 : 0.35 }} />
            {isDragging ? "Drop files to attach" : "Click to attach files"}
          </div>
        )}
      </div>
    );
  }

  // ─── Contact Row ───────────────────────────────────────────────────
  function ContactRow({ contact, index, onChange, onRemove, canRemove, designations, onAddDesignation, onEditDesignation }) {
    const update = (field, val) => onChange(index, { ...contact, [field]: val });

    return (
      <div style={{
        background: C.bg, border: `1.5px solid ${C.border}`,
        borderRadius: 9, padding: "12px 12px 6px", marginBottom: 8, position: "relative"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: C.muted, fontWeight: 600 }}>
            <input type="radio" name="primaryContact" checked={contact.isPrimary}
              onChange={() => onChange(index, { ...contact, isPrimary: true })}
              style={{ accentColor: C.primary }} />
            Primary Contact
          </label>
          {canRemove && (
            <button type="button" onClick={() => onRemove(index)}
              style={{ background: "none", border: "none", cursor: "pointer", color: C.danger, padding: 2 }}>
              <FaTimes size={12} />
            </button>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
          <Field label="Name">
            <Input value={contact.name} onChange={e => update("name", e.target.value)} placeholder="Full name" />
          </Field>
        <Field label="Designation">
    <div style={{ display: "flex", gap: 6 }}>
      <Select
        value={contact.designation}
        onChange={e => update("designation", e.target.value)}
        style={{ flex: 1 }}
      >
        <option value="">— Select —</option>
        {(designations || []).map(d => (
          <option key={d.DesignationId} value={d.DesignationName}>
            {d.DesignationName}
          </option>
        ))}
      </Select>

      <button
        type="button"
        onClick={onAddDesignation}
        title="Add new designation"
        style={{
          padding: "0 10px", background: C.primary10, border: `1.5px solid ${C.primary20}`,
          borderRadius: 7, color: C.primary, cursor: "pointer", flexShrink: 0,
          display: "flex", alignItems: "center"
        }}
      >
        <FaPlus size={10} />
      </button>

      <button
        type="button"
        onClick={() => {
          const current = (designations || []).find(d => d.DesignationName === contact.designation);
          current ? onEditDesignation(current) : toast.warning("Select a designation to edit");
        }}
        title="Edit selected designation"
        style={{
          padding: "0 10px", background: C.primary10, border: `1.5px solid ${C.primary20}`,
          borderRadius: 7, color: C.primary, cursor: "pointer", flexShrink: 0,
          display: "flex", alignItems: "center"
        }}
      >
        <FaEdit size={10} />
      </button>
    </div>
  </Field>
          <Field label="Mobile">
            <Input value={contact.mobile}
              onChange={e => update("mobile", e.target.value.replace(/\D/g, ""))}
  placeholder="Mobile number" />
          </Field>
          <Field label="Email">
            <Input type="email" value={contact.email}
              onChange={e => update("email", e.target.value)} placeholder="Email address" />
          </Field>
        </div>
      </div>
    );
  }


  function ProjectDocUploader({ documents, onChange, onRemoveExisting }) {
  const inputRef = useRef();
    const [pendingTitle, setPendingTitle] = useState("");
    const [isDragging, setIsDragging] = useState(false);

    const existing = documents.existing || [];
    const newFiles = documents.newFiles || [];

    const addFiles = (fileList) => {
      const files = Array.from(fileList);
      const added = files.map(f => ({
        id: Date.now() + Math.random(),
        file: f,
        title: pendingTitle.trim() || f.name.replace(/\.[^.]+$/, ""),
      }));
      onChange({ ...documents, newFiles: [...newFiles, ...added] });
      setPendingTitle("");
    };

    const handleFiles = (e) => { addFiles(e.target.files); e.target.value = ""; };

    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
    };

    const removeNew = (id) =>
      onChange({ ...documents, newFiles: newFiles.filter(d => d.id !== id) });

    const updateNewTitle = (id, title) =>
      onChange({ ...documents, newFiles: newFiles.map(d => d.id === id ? { ...d, title } : d) });

    return (
      <div style={{ gridColumn: "1 / -1", marginTop: 4 }}
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}>

        {/* Section header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 18px",
          borderTop: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
          background: C.primary10,
          margin: "0 -18px 16px",
        }}>
          <FaPaperclip size={12} color={C.primary} />
          <span style={{
            fontSize: 11, fontWeight: 700, color: C.primary,
            letterSpacing: "0.05em", textTransform: "uppercase"
          }}>
            Project Documents
          </span>
          {(existing.length + newFiles.length) > 0 && (
            <span style={{
              marginLeft: "auto", background: C.primary, color: "#fff",
              borderRadius: 999, padding: "1px 8px", fontSize: 10, fontWeight: 700
            }}>
              {existing.length + newFiles.length}
            </span>
          )}
        </div>

        {/* Title input + attach button */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <Field label="Document Title">
              <Input
                value={pendingTitle}
                onChange={e => setPendingTitle(e.target.value)}
                placeholder="e.g. Site Plan, Contract…"
                onKeyDown={e => e.key === "Enter" && inputRef.current.click()}
              />
            </Field>
          </div>
          <button type="button" onClick={() => inputRef.current.click()} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 16px", marginBottom: 12, fontSize: 12, fontWeight: 600,
            color: "#fff", background: C.primary,
            border: "none", borderRadius: 7, cursor: "pointer", whiteSpace: "nowrap"
          }}>
            <FaUpload size={11} /> Attach File
          </button>
          <input ref={inputRef} type="file" multiple style={{ display: "none" }} onChange={handleFiles} />
        </div>

        {/* ── Existing docs saved in DB ── */}
        {existing.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Saved Documents
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {existing.map((doc, i) => {
                const FIcon = fileIcon(doc.originalName || doc.path || "");
                return (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "auto 1fr auto",
                    alignItems: "center", gap: 10, padding: "8px 12px",
                    background: C.primary10, border: `1.5px solid ${C.primary20}`,
                    borderRadius: 8,
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 7,
                      background: C.surface, border: `1px solid ${C.primary20}`,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                    }}>
                      <FIcon size={14} color={C.primary} />
                    </div>

                    {/* Title + download link */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 1 }}>
                        {doc.title || "Untitled"}
                      </div>
                      <a
                        href={`${BASE_URL}/api/projectfile?path=${encodeURIComponent(doc.path)}`}
                        target="_blank"
                        rel="noreferrer"
                      style={{
                        fontSize: 11, color: C.primary, textDecoration: "none",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        display: "block"
                      }} 
                    >
                      {doc.originalName || doc.path?.split("/").pop()}
                    </a>
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => onRemoveExisting(doc.path)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: C.danger, padding: 4 }}
                      title="Remove document"
                    >
                      <FaTimes size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── New (pending) files ── */}
        {newFiles.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.warn, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Pending Upload
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {newFiles.map((doc) => {
                const FIcon = fileIcon(doc.file.name);
                return (
                  <div key={doc.id} style={{
                    display: "grid", gridTemplateColumns: "auto 1fr auto",
                    alignItems: "center", gap: 10, padding: "8px 12px",
                    background: "#FFF7E6", border: `1.5px solid ${C.warn}`,
                    borderRadius: 8,
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 7,
                      background: C.surface, border: `1px solid ${C.warn}`,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                    }}>
                      <FIcon size={14} color={C.warn} />
                    </div>

                    {/* Editable title + filename */}
                    <div style={{ minWidth: 0 }}>
                      <input
                        value={doc.title}
                        onChange={e => updateNewTitle(doc.id, e.target.value)}
                        style={{
                          width: "100%", border: "none", outline: "none",
                          fontSize: 13, fontWeight: 600, color: C.text,
                          background: "transparent", padding: 0,
                        }}
                        placeholder="Enter title…"
                      />
                      <div style={{
                        fontSize: 11, color: C.muted, marginTop: 1,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                      }}>
                        {doc.file.name}
                        <span style={{ color: C.warn, marginLeft: 4 }}>(pending upload)</span>
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeNew(doc.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: C.danger, padding: 4 }}
                      title="Remove"
                    >
                      <FaTimes size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {existing.length === 0 && newFiles.length === 0 && (
    <div onClick={() => inputRef.current.click()} style={{
      border: `1.5px dashed ${isDragging ? C.primary : C.border}`, borderRadius: 8,
      padding: "20px 12px", textAlign: "center",
      cursor: "pointer", color: isDragging ? C.primary : C.muted, fontSize: 12,
      background: isDragging ? C.primary10 : "transparent",
    }}>
      <FaPaperclip size={20} style={{ display: "block", margin: "0 auto 6px", opacity: isDragging ? 0.7 : 0.3 }} />
      {isDragging ? "Drop to attach files" : "No documents yet — enter a title above and click Attach File"}
    </div>
  )}
      </div>
    );
  }
  function MultiSelect({ options, selected, onChange, placeholder }) {
    const [open, setOpen] = useState(false);
    const ref = useRef();

    useEffect(() => {
      const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

    const toggle = (val) => {
      onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
    };

    const selectedLabels = options
      .filter(o => selected.includes(o.value))
      .map(o => o.label);

    return (
      <div ref={ref} style={{ position: "relative" }}>
        <div
          onClick={() => setOpen(o => !o)}
          style={{
            ...inputStyle,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: "pointer", minHeight: 36, flexWrap: "wrap", gap: 4,
            paddingRight: 28,
          }}
        >
          {selectedLabels.length === 0 ? (
            <span style={{ color: C.muted, fontSize: 13 }}>{placeholder}</span>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, flex: 1 }}>
              {selectedLabels.map((label, i) => (
                <span key={i} style={{
                  background: C.primary10, color: C.primary,
                  border: `1px solid ${C.primary20}`,
                  borderRadius: 4, padding: "1px 7px", fontSize: 11, fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  {label}
                  <FaTimes
                    size={8}
                    style={{ cursor: "pointer" }}
                    onClick={e => { e.stopPropagation(); toggle(options.find(o => o.label === label)?.value); }}
                  />
                </span>
              ))}
            </div>
          )}
          <FaChevronDown
            size={10}
            color={C.muted}
            style={{
              position: "absolute", right: 10, top: "50%",
              transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
              transition: "transform 0.2s", pointerEvents: "none",
            }}
          />
        </div>

        {open && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
            background: C.surface, border: `1.5px solid ${C.primary}`,
            borderRadius: 7, boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            zIndex: 999, maxHeight: 200, overflowY: "auto",
          }}>
            {options.length === 0 ? (
              <div style={{ padding: "10px 14px", fontSize: 12, color: C.muted }}>No options</div>
            ) : options.map(o => {
              const checked = selected.includes(o.value);
              return (
                <div
                  key={o.value}
                  onClick={() => toggle(o.value)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 14px", cursor: "pointer", fontSize: 13,
                    color: checked ? C.primary : C.text,
                    background: checked ? C.primary10 : "transparent",
                    borderBottom: `1px solid ${C.border}`,
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => { if (!checked) e.currentTarget.style.background = C.bg; }}
                  onMouseLeave={e => { if (!checked) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{
                    width: 15, height: 15, borderRadius: 3, flexShrink: 0,
                    border: `2px solid ${checked ? C.primary : C.border}`,
                    background: checked ? C.primary : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {checked && <span style={{ color: "#fff", fontSize: 9, fontWeight: 700 }}>✓</span>}
                  </div>
                  {o.label}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
  function LedgerNode({ item, ledgerList, level, expandedLedger, setExpandedLedger, onSelect }) {
    const children = ledgerList.filter(x => Number(x.GUnder) === Number(item.GSlNo));
    const hasChildren = children.length > 0;
    const isExpanded = expandedLedger[item.GSlNo];

    return (
      <div>
        <div
          style={{
            padding: "10px",
            paddingLeft: `${15 + level * 20}px`,
            cursor: "pointer",
            background: level === 0 ? C.bg : C.surface,
            fontWeight: hasChildren ? 600 : 400,
            fontSize: 13,
            borderBottom: `1px solid ${C.border}`,
          }}
          onClick={() => {
            if (hasChildren) {
              setExpandedLedger(prev => ({ ...prev, [item.GSlNo]: !prev[item.GSlNo] }));
            } else {
              onSelect(item.GSlNo, item.GName);
            }
          }}
        >
          {hasChildren ? (isExpanded ? "▼ " : "▶ ") : "• "}
          {item.GName}
        </div>

        {hasChildren && isExpanded && children.map(child => (
          <LedgerNode
            key={child.GSlNo}
            item={child}
            ledgerList={ledgerList}
            level={level + 1}
            expandedLedger={expandedLedger}
            setExpandedLedger={setExpandedLedger}
            onSelect={onSelect}
          />
        ))}
      </div>
    );
  }
  // ─── Projects Tab ──────────────────────────────────────────────────
  function ProjectsTab({ clientId }) {
    const [projectList, setProjectList] = useState([]);
    const [project, setProject] = useState(emptyProject());
    const [searchTerm, setSearchTerm] = useState("");
    const [loadingList, setLoadingList] = useState(false);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
    const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);
    const [isDeleteDisabled, setIsDeleteDisabled] = useState(true);
    const [showProjectForm, setShowProjectForm] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [campList, setCampList] = useState([]);
    const [vehicleList, setVehicleList] = useState([]);
  const [showCampModal, setShowCampModal] = useState(false);
  const [newCampName, setNewCampName] = useState("");
  const [savingCamp, setSavingCamp] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    VehicleNumber: "",
    VRegNo: "",
    VehicleName: "",
    VehicleType: "",
    VehicleMake: "",
    Capacity: "",
    FuelType: "",
    Mileage: "",
    LedgerID: "",
    LedgerName: "",
  });

  const resetNewVehicle = () => setNewVehicle({
    VehicleNumber: "", VRegNo: "", VehicleName: "",
    VehicleType: "", VehicleMake: "", Capacity: "", FuelType: "", Mileage: "",
    LedgerID: "", LedgerName: "",
  });
  const [savingVehicle, setSavingVehicle] = useState(false);

  const [ledgerList, setLedgerList] = useState([]);
  const [showLedgerMenu, setShowLedgerMenu] = useState(false);
  const [expandedLedger, setExpandedLedger] = useState({});
  const [salesRepList, setSalesRepList] = useState([]);

  const VEHICLE_TYPES = ["Truck", "Car", "Van", "Bus", "Motorcycle", "Trailer", "Other"];
  const FUEL_TYPES = ["Diesel", "Petrol", "CNG", "Electric"];

  const updateNewVehicle = (field, val) => setNewVehicle(p => ({ ...p, [field]: val }));



    // projectDocs holds both saved (existing) and pending (newFiles)
    const [projectDocs, setProjectDocs] = useState({ existing: [], newFiles: [] });

  useEffect(() => {
    fetchProjects(); fetchCamps(); fetchVehicles(); fetchLedgers(); fetchSalesReps();
  }, []);

  const fetchSalesReps = async () => {
    try {
      const CompanyId = sessionStorage.getItem("CompanyID");
      const res = await api.get("/api/getSalesReps", { params: { CompanyId } });
      if (res.data.success) setSalesRepList(res.data.data || []);
    } catch { /* silent */ }
  };

  const fetchLedgers = async () => {
    try {
      const res = await api.get("/api/getLedgers");
      if (res.data.success) setLedgerList(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch ledgers:", err);
    }
  };
  const handleSaveCamp = async () => {
    if (!newCampName.trim()) { toast.warning("Enter a camp name"); return; }
    try {
      setSavingCamp(true);
      const res = await api.post("/api/InsertUpdateCamp", {
        CampID: 0,
        CampName: newCampName.trim(),
        CreatedBy: sessionStorage.getItem("UserId"),
      });
      if (res.data.success) {
        toast.success("Camp added");
        const newCamp = { CampID: res.data.CampID, CampName: newCampName.trim() };
        setCampList(prev => [...prev, newCamp]);
        // Auto-select the newly created camp
        setProject(p => ({ ...p, CampIds: [...(p.CampIds || []), res.data.CampID] }));
        setNewCampName("");
        setShowCampModal(false);
      } else {
        toast.error("Failed to add camp");
      }
    } catch { toast.error("Failed to add camp"); }
    finally { setSavingCamp(false); }
  };
  const handleSaveVehicle = async () => {
    if (!newVehicle.VehicleNumber.trim()) { toast.warning("Vehicle Number is required"); return; }
    if (!newVehicle.VRegNo.trim()) { toast.warning("Registration Number is required"); return; }

    try {
      setSavingVehicle(true);
      const CompID = sessionStorage.getItem("CompanyID");
      const res = await api.post("/api/InsertUpdateVehicleMaster", {
        VID: 0,
        VRegNo: newVehicle.VRegNo.trim(),
        VehicleNumber: newVehicle.VehicleNumber.trim(),
        VehicleName: (newVehicle.VehicleName || newVehicle.VehicleNumber).trim(),
        VehicleType: newVehicle.VehicleType || null,
        VehicleMake: newVehicle.VehicleMake?.trim() || null,
        Capacity: newVehicle.Capacity ? parseFloat(newVehicle.Capacity) : null,
        FuelType: newVehicle.FuelType || null,
        Mileage: newVehicle.Mileage ? parseFloat(newVehicle.Mileage) : null,
        LedgerID: newVehicle.LedgerID || 0,
        LedgerName: newVehicle.LedgerName || null,
        CompID,
        UserId: sessionStorage.getItem("UserId"),
      });
      if (res.data.success) {
        toast.success("Vehicle added");
        await fetchVehicles();
        resetNewVehicle();
        setShowVehicleModal(false);
      } else {
        toast.error(res.data.message || "Failed to add vehicle");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add vehicle");
    } finally {
      setSavingVehicle(false);
    }
  };
    // ── Fetch helpers ──────────────────────────────────────────────
    const fetchVehicles = async () => {
      try {
        const CompID = sessionStorage.getItem("CompanyID");
        const res = await api.get("/api/GetVehiclesNew", { params: { CompID } });
        if (res.data.success) setVehicleList(res.data.vehicles || []);
      } catch { /* silent */ }
    };

    const fetchCamps = async () => {
      try {
        const res = await api.get("/api/GetCamp");
        if (res.data.success) setCampList(res.data.camps || []);
      } catch { /* silent */ }
    };

    const fetchProjects = async () => {
      try {
        setLoadingList(true);
        const CompanyId = sessionStorage.getItem("CompanyID");
          const UserID = sessionStorage.getItem("UserId"); 
        const res = await api.get("/api/getprojectsbyclient", {
          params: { ClientID: clientId, CompanyId ,UserID}
        });
        if (res.data.success) {
          setProjectList(res.data.projects || []);
        } else {
          toast.error("Failed to fetch projects");
        }
      } catch {
        toast.error("Failed to fetch projects");
      } finally {
        setLoadingList(false);
      }
    };

    // ── Validation ─────────────────────────────────────────────────
    const validate = () => {
      const errors = {};
      if (!project.ProjectName?.trim()) errors.ProjectName = "Project name is required";
      if (!project.ProjectCode?.trim()) errors.ProjectCode = "Project code is required";
      setFieldErrors(errors);
      return Object.keys(errors).length === 0;
    };

    // ── Reset ──────────────────────────────────────────────────────
    const resetProject = () => {
      setProject({ ...emptyProject(), ClientID: clientId });
      setProjectDocs({ existing: [], newFiles: [] });
      setIsSubmitDisabled(false);
      setIsUpdateDisabled(true);
      setIsDeleteDisabled(true);
      setFieldErrors({});
    };

    // ── Row click — parse existing docs from DB JSON ───────────────
    const handleRowClick = (item) => {
      setProject({
        UnitID: item.UnitID,
        ProjectName: item.UnitName || "",
        ProjectCode: item.UnitCode || "",
        ClientID: clientId,
        Location: item.Location || "",
        StartDate: toDateInputValue(item.StartDate),
        EndDate: toDateInputValue(item.endDate),
        VID: item.VehicleId || 0,
        CampID: item.CampId || 0,
        IsActive: item.IsActive ?? 1,
        TotalManpower: item.TotalManpower || "",   
        VehicleIds: item.VehicleIds
          ? item.VehicleIds.split(",").map(Number)
          : [],

        CampIds: item.CampIds
          ? item.CampIds.split(",").map(Number)
          : [],
          SalesRepId: item.SalesRepId || "",
      });

      // Parse Documents JSON stored in Unit table
      let existingDocs = [];
      try {
        existingDocs = item.Documents ? JSON.parse(item.Documents) : [];
      } catch {
        existingDocs = [];
      }
      setProjectDocs({ existing: existingDocs, newFiles: [] });

      setIsSubmitDisabled(true);
      setIsUpdateDisabled(false);
      setIsDeleteDisabled(false);
      setFieldErrors({});
      setShowProjectForm(true);
    };


    // ── Input handler ──────────────────────────────────────────────
    const handleProjectInput = (e) => {
      const { name, value } = e.target;
      setProject(p => ({ ...p, [name]: value }));
    };

    // ── Payload builder ────────────────────────────────────────────
    const buildProjectPayload = (isUpdate) => ({
      UnitID: isUpdate ? project.UnitID : 0,
      UnitName: project.ProjectName,
      UnitCode: project.ProjectCode,
      StartDate: project.StartDate || null,
      EndDate: project.EndDate || null,
      Location: project.Location || "",
      VehicleIds: (project.VehicleIds || []).join(","),
      CampIds: (project.CampIds || []).join(","),
      ClientID: clientId,
      CompanyId: sessionStorage.getItem("CompanyID"),
      CreatedBy: sessionStorage.getItem("UserId"),
      TotalManpower: project.TotalManpower || 0, 
      SalesRepId: project.SalesRepId ? parseInt(project.SalesRepId) : null,
    });

    // ── Upload pending docs after insert / update ──────────────────
    const uploadPendingProjectDocs = async (unitId) => {
      if (!projectDocs.newFiles.length) return;

      const formData = new FormData();
      formData.append("UnitID", unitId);
      formData.append("titles", JSON.stringify(projectDocs.newFiles.map(d => d.title)));
      projectDocs.newFiles.forEach(d => formData.append("files", d.file));

      try {
        const res = await api.post("/api/uploadProjectDocs", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data.success) {
          // Replace state with full merged list returned from server
          setProjectDocs({ existing: res.data.documents, newFiles: [] });
        } else {
          toast.error("Document upload failed");
        }
      } catch {
        toast.error("Document upload failed");
      }
    };

    // ── Remove existing doc (call API then update state) ───────────
    const handleRemoveExistingDoc = async (filePath) => {
      if (!project.UnitID) return;
      try {
        const res = await api.post("/api/deleteProjectDoc", {
          UnitID: project.UnitID,
          filePath,
        });
        if (res.data.success) {
          setProjectDocs(prev => ({ ...prev, existing: res.data.documents }));
          toast.success("Document removed");
        } else {
          toast.error("Failed to remove document");
        }
      } catch {
        toast.error("Failed to remove document");
      }
    };

    // ── Submit (Insert) ────────────────────────────────────────────
    const handleSubmit = async () => {
      if (!validate()) return;
      try {
        setLoadingSubmit(true);
        const res = await api.post("/api/Newinsertupdateunit", buildProjectPayload(false));
        if (res.data.success) {
          const newUnitId = res.data.UnitID;
          await uploadPendingProjectDocs(newUnitId);
          toast.success("Project added");
          fetchProjects();
          resetProject();
          setShowProjectForm(false);
        } else {
          toast.error(res.data.message || "Insert failed");
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Insert failed");
      } finally {
        setLoadingSubmit(false);
      }
    };

    // ── Update ─────────────────────────────────────────────────────
    const handleUpdate = async () => {
      if (!project.UnitID) { toast.warning("Select a project to update"); return; }
      if (!validate()) return;
      try {
        setLoadingUpdate(true);
        const res = await api.post("/api/Newinsertupdateunit", buildProjectPayload(true));
        if (res.data.success) {
          await uploadPendingProjectDocs(project.UnitID);
          toast.success("Project updated");
          fetchProjects();
        } else {
          toast.error(res.data.message || "Update failed");
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Update failed");
      } finally {
        setLoadingUpdate(false);
      }
    };

    // ── Delete ─────────────────────────────────────────────────────
    const handleDelete = async () => {
      if (!project.UnitID) { toast.error("No project selected"); return; }
      const confirmed = await new Promise(resolve => {
        const id = toast.warning(
          () => (
            <div>
              <div style={{ marginBottom: 10, fontWeight: 600 }}>Delete this project?</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn btn-danger btn-sm"
                  onClick={() => { toast.dismiss(id); resolve(true); }}>Delete</button>
                <button className="btn btn-secondary btn-sm"
                  onClick={() => { toast.dismiss(id); resolve(false); }}>Cancel</button>
              </div>
            </div>
          ),
          { position: "top-center", autoClose: false, closeOnClick: false, draggable: false, closeButton: false }
        );
      });
      if (!confirmed) return;
      try {
        setLoadingDelete(true);
        const DeletedBy = parseInt(sessionStorage.getItem("UserId"), 10);
        const res = await api.post("/api/deleteunit", { UnitID: project.UnitID, DeletedBy });
        if (res.data.success) {
          toast.success("Project deleted");
          fetchProjects();
          resetProject();
          setShowProjectForm(false);
        } else {
          toast.error(res.data.message || "Delete failed");
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Delete error");
      } finally {
        setLoadingDelete(false);
      }
    };

    // ── Filter ─────────────────────────────────────────────────────
    const filtered = projectList.filter(p =>
      p.UnitName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.UnitCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.Location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ══ LIST VIEW ══════════════════════════════════════════════════
    if (!showProjectForm) return (
      <div>
        {/* Search + New button */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 14, gap: 10, flexWrap: "wrap"
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, flex: 1,
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: "7px 12px"
          }}>
            <FaSearch size={12} color={C.muted} />
            <input type="text" placeholder="Search projects…" value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                flex: 1, border: "none", outline: "none",
                fontSize: 13, color: C.text, background: "transparent"
              }} />
          </div>
          <button type="button" onClick={() => { resetProject(); setShowProjectForm(true); }} style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px",
            background: C.primary, color: "#fff", border: "none",
            borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer"
          }}>
            <FaPlus size={10} /> New Project
          </button>
        </div>

        {/* Project list table */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, overflow: "hidden"
        }}>
          {loadingList ? (
            <div style={{ textAlign: "center", padding: 50, color: C.muted }}>
              <div style={{
                width: 28, height: 28, border: `3px solid ${C.primary}`,
                borderTopColor: "transparent", borderRadius: "50%",
                margin: "0 auto 10px", animation: "spin 0.7s linear infinite"
              }} />
              Loading projects…
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.primary10 }}>
                  {["#", "Project Name", "Code", "Location", "Vehicle", "Camp", "Docs"].map(h => (
                    <th key={h} style={{
                      padding: "10px 14px", textAlign: "left", fontSize: 11,
                      fontWeight: 700, color: C.primary,
                      letterSpacing: "0.05em", textTransform: "uppercase"
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? filtered.map((item, idx) => {
                  let docCount = 0;
                  try { docCount = item.Documents ? JSON.parse(item.Documents).length : 0; } catch { docCount = 0; }
                  return (
                    <tr key={item.UnitID} onClick={() => handleRowClick(item)}
                      style={{
                        cursor: "pointer", borderTop: `1px solid ${C.border}`,
                        background: project.UnitID === item.UnitID
                          ? C.primary10 : idx % 2 === 0 ? "#fff" : "#FAFBFD"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = C.primary10}
                      onMouseLeave={e => e.currentTarget.style.background =
                        project.UnitID === item.UnitID
                          ? C.primary10 : idx % 2 === 0 ? "#fff" : "#FAFBFD"
                      }>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: C.muted, width: 40 }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: "50%",
                            background: C.primary,
                            display: "flex", alignItems: "center", justifyContent: "center"
                          }}>
                            <FaProjectDiagram size={12} color="#fff" />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                              {item.UnitName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: C.muted }}>
                        {item.UnitCode || "—"}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: C.muted }}>
                        {item.Location || "—"}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: C.muted }}>
                        {item.VehicleNumber || "—"}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: C.muted }}>
                        {item.CampName || "—"}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {docCount > 0 ? (
                          <span style={{
                            background: C.primary10, color: C.primary,
                            border: `1px solid ${C.primary20}`,
                            borderRadius: 999, padding: "2px 8px",
                            fontSize: 11, fontWeight: 700
                          }}>
                            {docCount} file{docCount !== 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: C.border }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={7} style={{ padding: 50, textAlign: "center", color: C.muted }}>
                      <FaProjectDiagram size={34} style={{
                        display: "block", margin: "0 auto 10px", opacity: 0.2
                      }} />
                      No projects found
                      <br />
                      <button type="button"
                        onClick={() => { resetProject(); setShowProjectForm(true); }}
                        style={{
                          marginTop: 12, padding: "7px 16px", background: C.primary,
                          color: "#fff", border: "none", borderRadius: 7,
                          fontSize: 13, fontWeight: 600, cursor: "pointer"
                        }}>
                        <FaPlus style={{ marginRight: 5 }} /> New Project
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );

    // ══ FORM VIEW ══════════════════════════════════════════════════
    return (
      <div>
        {/* Form header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${C.border}`
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, background: C.primary, borderRadius: 9,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <FaProjectDiagram size={14} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                {project.UnitID ? "Edit Project" : "New Project"}
                {project.ProjectName && (
                  <span style={{ color: C.muted, fontWeight: 400, marginLeft: 6 }}>
                    — {project.ProjectName}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                Fill in the project details below
              </div>
            </div>
          </div>
          <button type="button"
            onClick={() => { setShowProjectForm(false); resetProject(); }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 14px", fontSize: 12, fontWeight: 600,
              color: C.primary, background: C.surface,
              border: `1.5px solid ${C.primary}`, borderRadius: 7, cursor: "pointer"
            }}>
            <FaArrowLeft size={10} /> Back to List
          </button>
        </div>

        {/* Form body */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 12, overflow: "hidden", marginBottom: 16
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 18px", borderBottom: `1px solid ${C.border}`,
            background: C.primary10
          }}>
            <FaProjectDiagram size={12} color={C.primary} />
            <span style={{
              fontSize: 11, fontWeight: 700, color: C.primary,
              letterSpacing: "0.05em", textTransform: "uppercase"
            }}>
              Project Details
            </span>
          </div>

          <div style={{ padding: "18px 18px 8px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>

              <Field label="Project Name" required>
                <Input name="ProjectName" value={project.ProjectName}
                  onChange={handleProjectInput} placeholder="Enter project name"
                  style={fieldErrors.ProjectName ? { borderColor: C.danger } : {}} />
                {fieldErrors.ProjectName && (
                  <span style={{ fontSize: 11, color: C.danger, display: "block", marginTop: 2 }}>
                    {fieldErrors.ProjectName}
                  </span>
                )}
              </Field>

              <Field label="Project Code" required>
                <Input name="ProjectCode" value={project.ProjectCode}
                  onChange={handleProjectInput} placeholder="Enter project code"
                  style={fieldErrors.ProjectCode ? { borderColor: C.danger } : {}} />
                {fieldErrors.ProjectCode && (
                  <span style={{ fontSize: 11, color: C.danger, display: "block", marginTop: 2 }}>
                    {fieldErrors.ProjectCode}
                  </span>
                )}
              </Field>

              <Field label="Start Date">
                <Input type="date" name="StartDate" value={project.StartDate}
                  onChange={handleProjectInput} />
              </Field>

              <Field label="End Date">
                <Input type="date" name="EndDate" value={project.EndDate}
                  onChange={handleProjectInput} />
              </Field>

              <Field label="Location">
                <Input name="Location" value={project.Location}
                  onChange={handleProjectInput} placeholder="Site / city location" />
              </Field>
              <Field label="Total Manpower">
    <Input
      name="TotalManpower"
      type="number"
      min="0"
      value={project.TotalManpower}
      onChange={handleProjectInput}
      placeholder="Number of workers"
    />
  </Field>
  <Field label="Sales Representative">
    <Select
      name="SalesRepId"
      value={project.SalesRepId}
      onChange={handleProjectInput}
    >
      <option value="">— Select Sales Rep —</option>
      {salesRepList.map(r => (
        <option key={r.UserId} value={r.UserId}>{r.UserName}</option>
      ))}
    </Select>
  </Field>

              <Field label="Transportation">
    <div style={{ display: "flex", gap: 6 }}>
      <div style={{ flex: 1 }}>
        <MultiSelect
          options={vehicleList.map(v => ({ value: v.VID, label: v.VehicleNumber }))}
          selected={project.VehicleIds || []}
          onChange={vals => setProject(p => ({ ...p, VehicleIds: vals }))}
          placeholder="— Select Vehicles —"
        />
      </div>
      <button
        type="button"
        onClick={() => setShowVehicleModal(true)}
        title="Add new vehicle"
        style={{
          padding: "0 11px", background: C.primary10,
          border: `1.5px solid ${C.primary20}`,
          borderRadius: 7, color: C.primary, cursor: "pointer",
          flexShrink: 0, display: "flex", alignItems: "center",
        }}
      >
        <FaPlus size={10} />
      </button>
    </div>
  </Field>

              <Field label="Camp Name">
    <div style={{ display: "flex", gap: 6 }}>
      <div style={{ flex: 1 }}>
        <MultiSelect
          options={campList.map(c => ({ value: c.CampID, label: c.CampName }))}
          selected={project.CampIds || []}
          onChange={vals => setProject(p => ({ ...p, CampIds: vals }))}
          placeholder="— Select Camps —"
        />
      </div>
      <button
        type="button"
        onClick={() => setShowCampModal(true)}
        title="Add new camp"
        style={{
          padding: "0 11px", background: C.primary10,
          border: `1.5px solid ${C.primary20}`,
          borderRadius: 7, color: C.primary, cursor: "pointer",
          flexShrink: 0, display: "flex", alignItems: "center",
        }}
      >
        <FaPlus size={10} />
      </button>
    </div>
  </Field>

              {/* ── Project Documents — spans full width ── */}
              <ProjectDocUploader
                documents={projectDocs}
                onChange={setProjectDocs}
                onRemoveExisting={handleRemoveExistingDoc}
              />

            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
          padding: "14px 0", borderTop: `1px solid ${C.border}`
        }}>
          <ActionBtn icon={FaSave} label="Submit" loadingLabel="Saving…"
            loading={loadingSubmit} disabled={isSubmitDisabled || loadingSubmit}
            onClick={handleSubmit} variant="solid" />
          <ActionBtn icon={FaEdit} label="Update" loadingLabel="Updating…"
            loading={loadingUpdate} disabled={isUpdateDisabled || loadingUpdate}
            onClick={handleUpdate} />
          <ActionBtn icon={FaTrashAlt} label="Delete" loadingLabel="Deleting…"
            loading={loadingDelete} disabled={isDeleteDisabled || loadingDelete}
            onClick={handleDelete} />
          <ActionBtn icon={FaEraser} label="Clear" onClick={resetProject} />
        </div>
        {showCampModal && (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        background: C.surface, borderRadius: 12, padding: 24,
        width: 360, boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        border: `1px solid ${C.border}`
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 30, height: 30, background: C.primary, borderRadius: 7,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <FaMapMarkerAlt size={13} color="#fff" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>New Camp</span>
          </div>
          <button type="button"
            onClick={() => { setShowCampModal(false); setNewCampName(""); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}>
            <FaTimes size={14} />
          </button>
        </div>

        {/* Input */}
        <Field label="Camp Name" required>
          <Input
            value={newCampName}
            onChange={e => setNewCampName(e.target.value)}
            placeholder="e.g. Camp Alpha, Site B…"
            onKeyDown={e => e.key === "Enter" && handleSaveCamp()}
            autoFocus
          />
        </Field>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
          <button type="button"
            onClick={() => { setShowCampModal(false); setNewCampName(""); }}
            style={{
              padding: "8px 16px", fontSize: 13, fontWeight: 600, borderRadius: 7,
              border: `1.5px solid ${C.border}`, background: "none", color: C.muted, cursor: "pointer"
            }}>
            Cancel
          </button>
          <button type="button" onClick={handleSaveCamp} disabled={savingCamp}
            style={{
              padding: "8px 18px", fontSize: 13, fontWeight: 600, borderRadius: 7,
              background: C.primary, color: "#fff", border: "none",
              cursor: savingCamp ? "not-allowed" : "pointer", opacity: savingCamp ? 0.7 : 1,
              display: "flex", alignItems: "center", gap: 6
            }}>
            {savingCamp ? (
              <><span style={{
                width: 11, height: 11, border: "2px solid #fff",
                borderTopColor: "transparent", borderRadius: "50%",
                display: "inline-block", animation: "spin 0.7s linear infinite"
              }} /> Saving…</>
            ) : <><FaSave size={11} /> Save</>}
          </button>
        </div>
      </div>
    </div>
  )}


  {showVehicleModal && (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        background: C.surface, borderRadius: 12, padding: 24,
        width: 460, maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        border: `1px solid ${C.border}`
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 30, height: 30, background: C.primary, borderRadius: 7,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <FaRoute size={13} color="#fff" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>New Vehicle</span>
          </div>
          <button type="button"
            onClick={() => { setShowVehicleModal(false); resetNewVehicle(); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}>
            <FaTimes size={14} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
        <Field label="Account Group">
    <div style={{ position: "relative" }}>
      <div
        onClick={() => setShowLedgerMenu(o => !o)}
        style={{
          ...inputStyle, display: "flex", alignItems: "center",
          justifyContent: "space-between", cursor: "pointer",
        }}
      >
        <span style={{ color: newVehicle.LedgerName ? C.text : C.muted }}>
          {newVehicle.LedgerName || "Select Ledger"}
        </span>
        <FaChevronDown size={10} color={C.muted}
          style={{ transform: `rotate(${showLedgerMenu ? 180 : 0}deg)`, transition: "transform 0.2s" }} />
      </div>

      {showLedgerMenu && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: C.surface, border: `1.5px solid ${C.primary}`,
          borderRadius: 7, boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
          zIndex: 9999, maxHeight: 260, overflowY: "auto",
        }}>
          {ledgerList.filter(item => Number(item.GUnder) === 0).map(item => (
            <LedgerNode
              key={item.GSlNo}
              item={item}
              ledgerList={ledgerList}
              level={0}
              expandedLedger={expandedLedger}
              setExpandedLedger={setExpandedLedger}
              onSelect={(id, name) => {
                updateNewVehicle("LedgerID", id);
                updateNewVehicle("LedgerName", name);
                setShowLedgerMenu(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  </Field>
    <Field label="Vehicle Number" required>
      <Input
        value={newVehicle.VehicleNumber}
        onChange={e => updateNewVehicle("VehicleNumber", e.target.value)}
        placeholder="e.g. KL-07-AB-1234"
        autoFocus
      />
    </Field>

    <Field label="Registration Number" required>
      <Input
        value={newVehicle.VRegNo}
        onChange={e => updateNewVehicle("VRegNo", e.target.value)}
        placeholder="Enter registration number"
      />
    </Field>

    <Field label="Vehicle Name">
      <Input
        value={newVehicle.VehicleName}
        onChange={e => updateNewVehicle("VehicleName", e.target.value)}
        placeholder="Optional — defaults to vehicle number"
      />
    </Field>

    <Field label="Vehicle Make">
      <Input
        value={newVehicle.VehicleMake}
        onChange={e => updateNewVehicle("VehicleMake", e.target.value)}
        placeholder="e.g. Tata, Ashok Leyland"
      />
    </Field>

    <Field label="Vehicle Type">
      <Select
        value={newVehicle.VehicleType}
        onChange={e => updateNewVehicle("VehicleType", e.target.value)}
      >
        <option value="">— Select —</option>
        {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </Select>
    </Field>

    <Field label="Fuel Type">
      <Select
        value={newVehicle.FuelType}
        onChange={e => updateNewVehicle("FuelType", e.target.value)}
      >
        <option value="">— Select —</option>
        {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
      </Select>
    </Field>

    <Field label="Capacity (Tons)">
      <Input
        type="number"
        step="0.01"
        value={newVehicle.Capacity}
        onChange={e => updateNewVehicle("Capacity", e.target.value)}
        placeholder="Enter capacity"
      />
    </Field>

    <Field label="Mileage (km/l)">
      <Input
        type="number"
        step="0.01"
        value={newVehicle.Mileage}
        onChange={e => updateNewVehicle("Mileage", e.target.value)}
        placeholder="Enter mileage"
      />
    </Field>
  </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
          <button type="button"
            onClick={() => { setShowVehicleModal(false); resetNewVehicle(); }}
            style={{
              padding: "8px 16px", fontSize: 13, fontWeight: 600, borderRadius: 7,
              border: `1.5px solid ${C.border}`, background: "none", color: C.muted, cursor: "pointer"
            }}>
            Cancel
          </button>
          <button type="button" onClick={handleSaveVehicle} disabled={savingVehicle}
            style={{
              padding: "8px 18px", fontSize: 13, fontWeight: 600, borderRadius: 7,
              background: C.primary, color: "#fff", border: "none",
              cursor: savingVehicle ? "not-allowed" : "pointer", opacity: savingVehicle ? 0.7 : 1,
              display: "flex", alignItems: "center", gap: 6
            }}>
            {savingVehicle ? (
              <><span style={{
                width: 11, height: 11, border: "2px solid #fff",
                borderTopColor: "transparent", borderRadius: "50%",
                display: "inline-block", animation: "spin 0.7s linear infinite"
              }} /> Saving…</>
            ) : <><FaSave size={11} /> Save</>}
          </button>
        </div>
      </div>
    </div>
  )}
      </div>
    );
  }


  function Customer() {
    const [customer, setCustomer] = useState(emptyCustomer());
    const [contacts, setContacts] = useState([{ ...emptyContact(), isPrimary: true }]);
    const [mobiles, setMobiles] = useState([""]);
    const [attachments, setAttachments] = useState({
      tradeLicence: { existing: [], newFiles: [] },
      vatCertificate: { existing: [], newFiles: [] },
      contract: { existing: [], newFiles: [] },
    });

    const [customerList, setCustomerList] = useState([]);
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
    const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);
    const [isDeleteDisabled, setIsDeleteDisabled] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rateTypes, setRateTypes] = useState([]);
    const [rootAreas, setRootAreas] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [sponsorList, setSponsorList] = useState([]);
    const [activeTab, setActiveTab] = useState("basic");
    const [savedAccountID, setSavedAccountID] = useState(0);
    const [countryList, setCountryList] = useState([]);
    const [stateList, setStateList] = useState([]);
    const [loadingStates, setLoadingStates] = useState(false);
    const [showDesignationModal, setShowDesignationModal] = useState(false);
  const [newDesignationName, setNewDesignationName] = useState("");
  const { getPermission, refreshPermissions } = usePermission();
  const permission = getPermission("CLIENT");
  const canView = !!permission?.CanView;
  const canAdd = !!permission?.CanAdd;
  const canEdit = !!permission?.CanEdit;
  const canDelete = !!permission?.CanDelete;
  const [savingDesignation, setSavingDesignation] = useState(false);
  const [designationList, setDesignationList] = useState(
    DESIGNATIONS.map(d => ({ DesignationId: 0, DesignationName: d }))
  );
  const [editingDesignationId, setEditingDesignationId] = useState(0);
  const [dragOverDocType, setDragOverDocType] = useState(null);


    const API_KEY = '00dd47d2e22c4448871f7a6695224488df68502d3c8e17845bbcb815c81fc42d'
    const CSC_HEADERS = { "X-CSCAPI-KEY": API_KEY };
    useEffect(() => {
      fetch("https://api.countrystatecity.in/v1/countries", { headers: CSC_HEADERS })
        .then(r => r.json())
        .then(data => setCountryList(data.sort((a, b) => a.name.localeCompare(b.name))))
        .catch(() => toast.error("Failed to load countries"));
    }, []);

  useEffect(() => {
    refreshPermissions();
  }, []);

  useEffect(() => {
    if (!canView) {
      setCustomerList([]);
      setShowForm(false);
      return;
    }
    fetchCustomers(); fetchRateTypes(); fetchRootAreas(); fetchSponsors(); fetchDesignations(); 
  }, [canView]);

    useEffect(() => {
      const style = document.createElement("style");
      style.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
      return () => document.head.removeChild(style);
    }, []);
  const fetchDesignations = async () => {
    try {
      const res = await api.get("/api/getDesignations");
      if (res.data.success) setDesignationList(res.data.designations); // keep full objects
    } catch { }
  };

  const handleSaveDesignation = async () => {
    if (!newDesignationName.trim()) { toast.warning("Enter a designation name"); return; }
    try {
      setSavingDesignation(true);
      const res = await api.post("/api/insertUpdateDesignation", {
        DesignationId: editingDesignationId,
        DesignationName: newDesignationName.trim(),
      });
      if (res.data.success) {
        toast.success(editingDesignationId ? "Designation updated" : "Designation added");
        setDesignationList(prev =>
          editingDesignationId
            ? prev.map(d => d.DesignationId === editingDesignationId
                ? { ...d, DesignationName: newDesignationName.trim() } : d)
            : [...prev, { DesignationId: res.data.DesignationId, DesignationName: newDesignationName.trim() }]
        );
        setNewDesignationName("");
        setEditingDesignationId(0);
        setShowDesignationModal(false);
      } else {
        toast.error("Failed to save designation");
      }
    } catch { toast.error("Failed to save designation"); }
    finally { setSavingDesignation(false); }
  };
  const openAddDesignation = () => { setEditingDesignationId(0); setNewDesignationName(""); setShowDesignationModal(true); };
  const openEditDesignation = (d) => { setEditingDesignationId(d.DesignationId); setNewDesignationName(d.DesignationName); setShowDesignationModal(true); };
    const handleCountryChange = async (e) => {
      const selected = countryList.find(c => c.name === e.target.value);
      setCustomer(p => ({ ...p, Country: selected?.name || "", State: "", countryIso2: selected?.iso2 || "" }));
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

    // const fetchCustomers = async () => {
    //   try {
    //     setLoading(true);
    //     const id = sessionStorage.getItem("CompanyID");
    //     const res = await api.get(`/api/GetCustomers/${id}`);
    //     if (res.data.success) setCustomerList(res.data.customers || []);
    //     else toast.error("Failed to load clients");
    //   } catch { toast.error("Error fetching clients"); }
    //   finally { setLoading(false); }
    // };
    const fetchCustomers = async () => {
  try {
    setLoading(true);

    const CompanyID = sessionStorage.getItem("CompanyID");
    const UserID = sessionStorage.getItem("UserId"); // Logged-in User ID

    const res = await api.get(`/api/GetCustomers/${CompanyID}`, {
      params: {
        UserID,
      },
    });

    if (res.data.success) {
      setCustomerList(res.data.customers || []);
    } else {
      toast.error("Failed to load clients");
    }
  } catch (err) {
    console.error("Error fetching clients:", err);
    toast.error("Error fetching clients");
  } finally {
    setLoading(false);
  }
};

    const fileRefs = {
      tradeLicence: useRef(),
      vatCertificate: useRef(),
      contract: useRef(),
    };
    const fetchRateTypes = async () => {
      try {
        const res = await api.get("/api/getratetype");
        if (res.data.success) setRateTypes(res.data.data);
      } catch { }
    };

    const fetchRootAreas = async () => {
      try {
        const CompanyID = sessionStorage.getItem("CompanyID");
        const res = await api.get("/api/WebGetRootMastername", { params: { CompanyID } });
        if (res.data.success) setRootAreas(res.data.data);
      } catch { }
    };

    const fetchSponsors = async () => {
      try {
        const id = sessionStorage.getItem("CompanyID");
        const res = await api.get(`/api/GetSupplierList/${id}`);
        setSponsorList(res.data.suppliers || []);
      } catch { toast.error("Failed to load sponsors"); }
    };

    const fetchAccountContacts = async (accountId) => {
      try {
        const res = await api.get(`/api/GetAccountDetails/${accountId}`);
        if (res.data.success && res.data.contacts?.length > 0) {
          setContacts(res.data.contacts.map((c, i) => ({
            name: c.ContactPerson || "", mobile: c.ContactNumber || "",
            designation: c.Designation || "", email: c.Email || "", isPrimary: i === 0,
          })));
        } else {
          setContacts([{ ...emptyContact(), isPrimary: true }]);
        }
      } catch { setContacts([{ ...emptyContact(), isPrimary: true }]); }
    };

  const fetchAccountDocs = async (accountId) => {
    try {
      const res = await api.get(`/api/getCustomerDocs/${accountId}`);
      if (res.data.success) {
        const toObjects = (paths) =>
          (paths || []).map(p => ({
            path: p,
            name: p.split("/").pop(),
          }));
        setAttachments({
          tradeLicence:   { existing: toObjects(res.data.tradeLicence),   newFiles: [] },
          vatCertificate: { existing: toObjects(res.data.vatCertificate), newFiles: [] },
          contract:       { existing: toObjects(res.data.contract),       newFiles: [] },
        });
      }
    } catch { }
  };

    const isDuplicateCustomer = (name, currentId = 0) =>
      customerList.some(c =>
        c.AccountName?.toLowerCase().trim() === name.toLowerCase().trim() && c.AccountID !== currentId
      );

    const handleInput = (e) => {
      let { name, value } = e.target;
      if (name === "Pincode") value = value.replace(/\D/g, "").slice(0, 6);
      if (name === "State") value = value.replace(/[^A-Za-z\s]/g, "");
      setCustomer(p => ({ ...p, [name]: value }));
    };

    const handleNewFiles = (docType, files) =>
      setAttachments(p => ({ ...p, [docType]: { ...p[docType], newFiles: files } }));

  const handleRemoveExisting = async (docType, filePath) => {
    if (!customer.AccountID) return;
    try {
      await api.post("/api/deleteCustomerDoc", {
        accountId: customer.AccountID,
        docType,
        filePath,
      });
      setAttachments(p => ({
        ...p,
        [docType]: {
          ...p[docType],
          existing: p[docType].existing.filter(x => x.path !== filePath), // ← was x !== filePath
        },
      }));
      toast.success("File removed");
    } catch {
      toast.error("Failed to remove file");
    }
  };

    const handleContactChange = (idx, updated) => {
      setContacts(prev => {
        if (updated.isPrimary) {
          return prev.map((c, i) => ({ ...c, isPrimary: i === idx, ...(i === idx ? updated : {}) }));
        }
        return prev.map((c, i) => i === idx ? updated : c);
      });
    };

    const addContact = () => setContacts(p => [...p, emptyContact()]);
    const removeContact = (idx) => setContacts(p => p.filter((_, i) => i !== idx));

    const handleRowClick = async (item) => {
      if (!canView) {
        toast.error("You do not have permission to view clients.");
        return;
      }

      const accountId = item.AccountID;
      setCustomer({
        AccountID: accountId, AcHeadId: item.AcHeadNo || item.AcHeadId || 0,
        Name: item.AccountName || "", Address: item.Address || "", ShipTo: item.ShipTo || "",
        City: item.city || "", Country: item.country || "", Phone: item.Phone || "",
        Pincode: item.Pincode || "", District: item.District || "", State: item.State || "", Sponsor: item.Sponsor || "",
        sponsors: item.Sponsor ? item.Sponsor.split(",").map(s => s.trim()).filter(Boolean) : [],
        TinNo: item.TinNo || "", CSTNo: item.CSTNo || "", GSTinNo: item.GSTinNo || "",
        VATNo: item.vatNo || "", TradeLicenceNo: item.TradeLicenceNo || "",
        TradeLicenceExpiry: toDateInputValue(item.TradeLicenceExpiry),
        CreditDays: item.CreditDays || 0, KM: item.KM || 0,
        DiscountPercentage: item.DiscountPercentage || "",
        CreditLimit: item.CreditLimit || 0, CreditAmount: item.CreditAmount || 0,
        Billcount: item.Billcount || 0, RateType: item.RateType || "",
        SaleBlock: item.SaleBlock || "No", RootId: item.RootId || 0,
        RoutePosition: item.RoutePosition || 0, IsSupplier: item.IsSupplier || 0,
        SponsorID: item.SponsorID || 0, AdharNo: item.LegalName || "",IsActive: item.Status ?? 1, 
  LedgerID: item.LedgerID || "", LedgerName: item.LedgerName || "",
      });
      const found = countryList.find(c => c.name === item.country);
      if (found?.iso2) {
        setLoadingStates(true);
        fetch(`https://api.countrystatecity.in/v1/countries/${found.iso2}/states`, { headers: CSC_HEADERS })
          .then(r => r.json())
          .then(data => setStateList(data.sort((a, b) => a.name.localeCompare(b.name))))
          .finally(() => setLoadingStates(false));
        setCustomer(p => ({ ...p, countryIso2: found.iso2 }));
      }
      setSavedAccountID(accountId);
      setIsSubmitDisabled(true); setIsUpdateDisabled(false); setIsDeleteDisabled(false);
      setShowForm(true); setActiveTab("basic");
      await fetchAccountContacts(accountId);
      await fetchAccountDocs(accountId);
    };

    const validate = (isUpdate = false) => {
      if (!customer.Name?.trim()) { toast.warning("Client name is required"); return false; }
      if (isDuplicateCustomer(customer.Name, isUpdate ? customer.AccountID : 0)) {
        toast.warning("Client name already exists"); return false;
      }
      
      if (customer.Pincode && !/^\d{6}$/.test(customer.Pincode)) {
        toast.warning("Pincode must be exactly 6 digits"); return false;
      }
      return true;
    };

    const buildPayload = (isUpdate = false) => {
      const primary = contacts.find(c => c.isPrimary) || contacts[0] || {};
      const Companyid = sessionStorage.getItem("CompanyID");
      const CreatedBy = sessionStorage.getItem("UserId");
      return {
        AcHeadId: isUpdate ? customer.AcHeadId : 0,
        AccountID: isUpdate ? customer.AccountID : 0,
        AccountName: customer.Name, LegalName: customer.AdharNo || "",
        Address: customer.Address, ShipTo: customer.ShipTo,
        city: customer.City, Place: customer.City, District: customer.District, Sponsor: (customer.sponsors || []).filter(Boolean).join(", "),
        sponsors: (customer.sponsors || []).filter(Boolean),
        State: customer.State, Pincode: customer.Pincode, country: customer.Country,
        mob: primary.mobile || mobiles[0] || "", Mobiles: mobiles.filter(Boolean),
        Phone: customer.Phone, email: primary.email || "",
        TinNo: customer.TinNo, CSTNo: customer.CSTNo, GSTinNo: customer.GSTinNo,
        VATNo: customer.VATNo, TradeLicenceNo: customer.TradeLicenceNo,
        TradeLicenceExpiry: customer.TradeLicenceExpiry || null,
        ContactPerson: primary.name || "", Contacts: contacts,
        CreditDays: customer.CreditDays, KM: customer.KM,
        DiscountPercentage: customer.DiscountPercentage,
        CreditLimit: customer.CreditLimit, CreditAmount: customer.CreditAmount,
        Billcount: parseInt(customer.Billcount) || 0, RateType: customer.RateType,
        SaleBlock: customer.SaleBlock, RootId: customer.RootId,
        RoutePosition: customer.RoutePosition, IsSupplier: customer.IsSupplier,
        SponsorID: parseInt(customer.SponsorID, 10) || 0, Companyid, CreatedBy,
        Status: customer.IsActive ?? 1,LedgerID: customer.LedgerID ? parseInt(customer.LedgerID) : null,
  LedgerName: customer.LedgerName || "",
      };
    };

  const uploadPendingDocs = async (accountId) => {
    for (const docType of Object.keys(attachments)) {
      const { newFiles } = attachments[docType];
      if (!newFiles.length) continue;
      const formData = new FormData();
      formData.append("accountId", accountId);
      formData.append("docType", docType);
      newFiles.forEach(f => formData.append("files", f));
      try {
        const res = await api.post("/api/uploadCustomerDocs", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data.success) {
          // res.data.files is string[] — convert to objects
          const existingObjects = (res.data.files || []).map(p => ({
            path: p,
            name: p.split("/").pop(),
          }));
          setAttachments(p => ({
            ...p,
            [docType]: { existing: existingObjects, newFiles: [] },
          }));
        }
      } catch {
        toast.error(`Failed to upload ${docType} files`);
      }
    }
  };

    const handleSubmit = async () => {
      if (!validate()) return;
      try {
        setLoadingSubmit(true);
        const res = await api.post("/api/CreateupdateCustomer", buildPayload(false));
        if (res.data.success) {
          toast.success("Client added successfully");
          const newAccountId = res.data.AccountID;
          await uploadPendingDocs(newAccountId);
          fetchCustomers();
          setCustomer(prev => ({ ...prev, AccountID: newAccountId, AcHeadId: res.data.AcHeadId }));
          setSavedAccountID(newAccountId);
          setIsSubmitDisabled(true); setIsUpdateDisabled(false); setIsDeleteDisabled(false);
        } else toast.error(res.data.message || "Insert failed");
      } catch (err) { toast.error(err.response?.data?.message || "Insert failed"); }
      finally { setLoadingSubmit(false); }
    };

    const handleUpdate = async () => {
      if (!canEdit) {
        toast.error("You do not have permission to update clients.");
        return;
      }
      if (!customer.AccountID) { toast.warning("Please select a client to update"); return; }
      if (!validate(true)) return;
      try {
        setLoadingUpdate(true);
        const res = await api.post("/api/CreateupdateCustomer", buildPayload(true));
        if (res.data.success) {
          toast.success("Client updated successfully");
          await uploadPendingDocs(customer.AccountID);
          fetchCustomers(); setSavedAccountID(customer.AccountID);
        } else toast.error(res.data.message || "Update failed");
      } catch (err) { toast.error(err.response?.data?.message || "Update failed"); }
      finally { setLoadingUpdate(false); }
    };

    const handleDelete = async () => {
      if (!canDelete) {
        toast.error("You do not have permission to delete clients.");
        return;
      }
      const ok = await confirmDeleteToast();
      if (!ok) return;
      try {
        setLoadingDelete(true);
        await api.post("/api/customerDeleteAccountHead", {
          HSlNo: customer.AcHeadId, userid: sessionStorage.getItem("UserId"),
        });
        toast.success("Client deleted"); fetchCustomers(); handleClear(); setShowForm(false);
      } catch (err) { toast.error(err.response?.data?.message || "Delete failed"); }
      finally { setLoadingDelete(false); }
    };

    const confirmDeleteToast = () => new Promise(resolve => {
      const id = toast.warning(
        () => (
          <div>
            <div style={{ marginBottom: 10, fontWeight: 600 }}>Delete this client?</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn btn-danger btn-sm" onClick={() => { toast.dismiss(id); resolve(true); }}>Delete</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { toast.dismiss(id); resolve(false); }}>Cancel</button>
            </div>
          </div>
        ),
        { position: "top-center", autoClose: false, closeOnClick: false, draggable: false, closeButton: false }
      );
    });

    const handleClear = () => {
      setCustomer(emptyCustomer());
      setContacts([{ ...emptyContact(), isPrimary: true }]);
      setMobiles([""]);
      setAttachments({
        tradeLicence: { existing: [], newFiles: [] },
        vatCertificate: { existing: [], newFiles: [] },
        contract: { existing: [], newFiles: [] }
      });
      setIsSubmitDisabled(false); setIsUpdateDisabled(true); setIsDeleteDisabled(true);
      setSavedAccountID(0); toast.dismiss();
    };

    const handleCreateNew = () => {
      if (!canAdd) {
        toast.error("You do not have permission to create clients.");
        return;
      }
      handleClear(); setShowForm(true); setActiveTab("basic");
    };
    const handleBackToList = () => { setShowForm(false); handleClear(); };

    const filteredCustomers = customerList.filter(s =>
      s.AccountName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.Mob?.includes(searchTerm) ||
      s.Email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalAttachments = Object.values(attachments).reduce(
      (s, a) => s + a.existing.length + a.newFiles.length, 0
    );
    const projectsEnabled = savedAccountID > 0;

    const TABS = [
      { key: "basic", label: "Basic Info", icon: FaUser },
      { key: "contact", label: "Contacts", icon: FaPhone, badge: contacts.length },
      { key: "documents", label: "Documents", icon: FaPaperclip, badge: totalAttachments || undefined },
      { key: "projects", label: "Projects", icon: FaProjectDiagram, disabled: !projectsEnabled },
    ];

    if (!canView) {
      return (
        <div style={{ background: C.bg, minHeight: "100vh", width: "100%" }}>
          <ToastContainer position="top-center" autoClose={3000} />
          <div style={{ padding: 24 }}>
            <div className="alert alert-danger">You do not have permission to view Client Management.</div>
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
                  <FaUsers size={16} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Clients</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{customerList.length} total clients</div>
                </div>
              </div>
              <button type="button" onClick={handleCreateNew} disabled={!canAdd} style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px",
                background: C.primary, color: "#fff", border: "none", borderRadius: 8,
                fontSize: 13, fontWeight: 600, cursor: "pointer"
              }}>
                <FaPlus size={11} /> New Client
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
                <input type="text" placeholder="Search by name, mobile or email…"
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
                    Loading clients…
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
    <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
      <tr style={{ background: C.primary10 }}>
        {["Client", "Mobile", "Email", "City", "VAT No", "Status"].map(h => (
          <th key={h} style={{
            padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700,
            color: C.primary, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap"
          }}>{h}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {filteredCustomers.length > 0 ? filteredCustomers.map((s, idx) => (
        <tr key={s.AccountID} onClick={() => handleRowClick(s)}
          style={{
            cursor: "pointer", borderTop: `1px solid ${C.border}`,
            background: customer.AccountID === s.AccountID ? C.primary10 : idx % 2 === 0 ? "#fff" : "#FAFBFD",
            transition: "background 0.1s"
          }}
          onMouseEnter={e => e.currentTarget.style.background = C.primary10}
          onMouseLeave={e => e.currentTarget.style.background = customer.AccountID === s.AccountID ? C.primary10 : idx % 2 === 0 ? "#fff" : "#FAFBFD"}>
          <td style={{ padding: "10px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", background: C.primary,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                <FaUser size={13} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{s.AccountName}</div>
                {s.District && <div style={{ fontSize: 11, color: C.muted }}>{s.District}</div>}
              </div>
            </div>
          </td>
          <td style={{ padding: "10px 16px", fontSize: 13, color: C.text }}>{s.Phone || "—"}</td>
          <td style={{ padding: "10px 16px", fontSize: 13, color: C.muted }}>{s.Email || "—"}</td>
          <td style={{ padding: "10px 16px", fontSize: 13, color: C.text }}>{s.city || "—"}</td>
          <td style={{ padding: "10px 16px", fontSize: 13, color: C.text }}>{s.vatNo || s.GSTinNo || "—"}</td>

          {/* ── Status cell ── */}
          <td style={{ padding: "10px 16px" }}>
            <span style={{
              display: "inline-block", width: 8, height: 8, borderRadius: "50%",
              background: s.Status === 0 ? C.danger : C.success,
              marginRight: 6, verticalAlign: "middle"
            }} />
            <span style={{ fontSize: 12, color: s.Status === 0 ? C.danger : C.success, fontWeight: 600 }}>
              {s.Status === 0 ? "Inactive" : "Active"}
            </span>
          </td>

        </tr>
      )) : (
        <tr>
          <td colSpan={6} style={{ padding: 60, textAlign: "center", color: C.muted }}>
            <FaUsers size={38} style={{ display: "block", margin: "0 auto 10px", opacity: 0.25 }} />
            No clients found
            <br />
            <button onClick={handleCreateNew} style={{
              marginTop: 12, padding: "8px 18px", background: C.primary,
              color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer"
            }}>
              <FaPlus style={{ marginRight: 5 }} />Create New Client
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
                  <FaUsers size={15} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                    {customer.AccountID ? "Edit Client" : "New Client"}
                    {customer.Name && <span style={{ color: C.muted, fontWeight: 400, marginLeft: 6 }}>— {customer.Name}</span>}
                  </div>
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
                const isDisabled = !!t.disabled;
                return (
                  <button key={t.key} type="button"
                    onClick={() => !isDisabled && setActiveTab(t.key)}
                    title={isDisabled ? "Save the client first to manage projects" : undefined}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "12px 20px", fontSize: 13,
                      fontWeight: active ? 700 : 500,
                      color: isDisabled ? C.border : active ? C.primary : C.muted,
                      background: "transparent", border: "none",
                      borderBottom: active ? `2.5px solid ${C.primary}` : "2.5px solid transparent",
                      cursor: isDisabled ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap", transition: "all 0.15s", opacity: isDisabled ? 0.4 : 1,
                    }}>
                    <t.icon size={12} />
                    {t.label}
                    {t.badge > 0 && (
                      <span style={{
                        background: active ? C.primary : C.muted, color: "#fff",
                        borderRadius: 999, padding: "1px 6px", fontSize: 10, fontWeight: 700
                      }}>{t.badge}</span>
                    )}
                    {isDisabled && <span style={{ fontSize: 10, color: C.muted }}>(save first)</span>}
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
                    <SectionCard icon={FaUser} title="Client Identity">
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
                        <Field label="Client Name" required>
                          <Input name="Name" value={customer.Name} onChange={handleInput} placeholder="Enter client name" />
                        </Field>
                        <Field label="Legal / Trade Name">
                          <Input name="AdharNo" value={customer.AdharNo || ""} onChange={handleInput} placeholder="Legal name" />
                        </Field>


                        <Field label="VAT No">
                          <Input name="VATNo" value={customer.VATNo || ""} onChange={handleInput} placeholder="VAT number" />
                        </Field>


                        <Field label="Status">
    <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4 }}>
      <button
        type="button"
        onClick={() => setCustomer(p => ({ ...p, IsActive: p.IsActive ? 0 : 1 }))}
        style={{
          width: 44, height: 24, borderRadius: 999, border: "none",
          background: customer.IsActive ? C.primary  : C.border,
          position: "relative", cursor: "pointer",
          transition: "background 0.2s", flexShrink: 0,
        }}
      >
        <span style={{
          position: "absolute", top: 3, width: 18, height: 18,
          borderRadius: "50%", background: "#fff",
          left: customer.IsActive ? 23 : 3,
          transition: "left 0.2s",
        }} />
      </button>
      <span style={{
        fontSize: 13, fontWeight: 600,
        color: customer.IsActive ? C.primary  : C.muted,
      }}>
        {customer.IsActive ? "Active" : "Inactive"}
      </span>
    </div>
  </Field>
                        <Field label="Sponsor">
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {(customer.sponsors || []).map((sp, i) => (
                              <div key={i} style={{ display: "flex", gap: 6 }}>
                                <Input
                                  value={sp}
                                  onChange={e => {
                                    const updated = [...(customer.sponsors || [])];
                                    updated[i] = e.target.value;
                                    setCustomer(p => ({ ...p, sponsors: updated }));
                                  }}
                                  placeholder={`Sponsor ${i + 1}`}
                                />
                                <button type="button"
                                  onClick={() => setCustomer(p => ({ ...p, sponsors: p.sponsors.filter((_, si) => si !== i) }))}
                                  style={{ padding: "0 10px", background: "none", border: `1.5px solid ${C.danger}`, borderRadius: 7, color: C.danger, cursor: "pointer", flexShrink: 0 }}>
                                  <FaTimes size={11} />
                                </button>
                              </div>
                            ))}
                            <button type="button"
                              onClick={() => setCustomer(p => ({ ...p, sponsors: [...(p.sponsors || []), ""] }))}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 5,
                                padding: "6px 12px", fontSize: 12, fontWeight: 600,
                                color: C.primary, background: C.primary10,
                                border: `1px dashed ${C.primary}`, borderRadius: 7, cursor: "pointer"
                              }}>
                              <FaPlus size={9} /> Add Sponsor
                            </button>
                          </div>
                        </Field>
                      </div>
                    </SectionCard>

                    <SectionCard icon={FaIdCard} title="Trade Licence">
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
                        <Field label="Licence No">
                          <Input name="TradeLicenceNo" value={customer.TradeLicenceNo || ""} onChange={handleInput} placeholder="Trade licence no" />
                        </Field>
                        <Field label="Expiry Date">
                          <Input type="date" name="TradeLicenceExpiry" value={customer.TradeLicenceExpiry} onChange={handleInput} />
                        </Field>
                      </div>
                    </SectionCard>
                  </div>

                  <div>
                    <SectionCard icon={FaMapMarkerAlt} title="Address & Contact">
                      <Field label="Street Address">
                        <TextArea name="Address" value={customer.Address} onChange={handleInput} placeholder="Building, street, area…" rows={2} />
                      </Field>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
                        <Field label="City / Place">
                          <Input name="City" value={customer.City} onChange={handleInput} placeholder="City" />
                        </Field>
                        {/* <Field label="District">
                          <Input name="District" value={customer.District || ""} onChange={handleInput} placeholder="District" />
                        </Field> */}
                        {/* Country */}
                        <Field label="Country">
                          <Select name="Country" value={customer.Country} onChange={handleCountryChange}>
                            <option value="">— Select Country —</option>
                            {countryList.map(c => (
                              <option key={c.iso2} value={c.name}>{c.name}</option>
                            ))}
                          </Select>
                        </Field>

                        {/* State */}
                        <Field label="State">
                          <Select
                            name="State"
                            value={customer.State}
                            onChange={handleInput}
                            disabled={!customer.countryIso2 || loadingStates}
                          >
                            <option value="">
                              {loadingStates ? "Loading…" : "— Select State —"}
                            </option>
                            {stateList.map(s => (
                              <option key={s.iso2} value={s.name}>{s.name}</option>
                            ))}
                          </Select>
                        </Field>
                        <Field label="Mobile Number">
                          <Input name="Phone" value={customer.Phone} onChange={handleInput} placeholder="Mobile number" />
                        </Field>
                        {/* <Field label="Pincode">
                          <Input name="Pincode" value={customer.Pincode || ""} onChange={handleInput} placeholder="6-digit pincode" />
                        </Field> */}
                      </div>
                    </SectionCard>
                  </div>
                </div>
              )}

              {/* ── TAB: Contacts ── */}
              {activeTab === "contact" && (
                <div>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${C.border}`
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Contact Persons</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                        Mark one contact as primary — their details will appear on documents.
                      </div>
                    </div>
                    <button type="button" onClick={addContact} style={{
                      display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px",
                      fontSize: 12, fontWeight: 700, color: C.primary, background: C.primary10,
                      border: `1px solid ${C.primary20}`, borderRadius: 7, cursor: "pointer", whiteSpace: "nowrap"
                    }}>
                      <FaPlus size={10} /> Add Contact
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: 12 }}>
                    {contacts.map((c, i) => (
                      <ContactRow key={i} contact={c} index={i}
    onChange={handleContactChange} onRemove={removeContact} canRemove={contacts.length > 1}
    designations={designationList}
    onAddDesignation={openAddDesignation}
    onEditDesignation={openEditDesignation}
  />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "documents" && (
                <div style={{ maxWidth: "100%", padding: "4px 0" }}>
                  <p style={{ fontSize: 15, fontWeight: 500, color: C.text, margin: "0 0 3px" }}>Documents</p>
                  <p style={{ fontSize: 12, color: C.muted, margin: "0 0 16px" }}>Attach supporting files for this client.</p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    {DOC_TYPES.map(d => {
                      const existing = attachments[d.key].existing || [];
                      const newFiles = attachments[d.key].newFiles || [];
                      const allFiles = [
    ...existing.map(f => ({
      name: f.name,
      url: `${BASE_URL}/uploads${f.path.replace('/uploads', '')}`,
      isExisting: true,
      path: f.path,
    })),
    ...newFiles.map((f, ni) => ({
      name: f.name,
      url: URL.createObjectURL(f),
      isExisting: false,
      newIndex: ni,
      file: f,
    })),
  ];
                        const isDragOver = dragOverDocType === d.key;

    const handleCardDrop = (e) => {
      e.preventDefault();
      setDragOverDocType(null);
      const dropped = Array.from(e.dataTransfer.files || []);
      if (dropped.length) handleNewFiles(d.key, [...newFiles, ...dropped]);
    };

                      return (
                        <div key={d.key}
        onDragOver={e => { e.preventDefault(); setDragOverDocType(d.key); }}
        onDragLeave={() => setDragOverDocType(prev => (prev === d.key ? null : prev))}
        onDrop={handleCardDrop}
        style={{
          background: C.surface,
          border: `0.5px solid ${isDragOver ? C.primary : C.border}`,
          borderRadius: 10, overflow: "hidden",
          outline: isDragOver ? `2px dashed ${C.primary}` : "none",
          outlineOffset: 2,
          transition: "outline 0.1s, border-color 0.1s",
        }}>

                          {/* Header */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: C.bg }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <d.icon size={13} color={C.primary} />
                              <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{d.label}</span>
                              {allFiles.length > 0 && (
                                <span style={{ fontSize: 11, background: C.primary10, color: C.primary, border: `0.5px solid ${C.primary20}`, borderRadius: 99, padding: "2px 8px", fontWeight: 500 }}>
                                  {allFiles.length}
                                </span>
                              )}
                            </div>
                            <label style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, padding: "4px 11px", borderRadius: 6, cursor: "pointer", background: C.primary, color: "#fff", fontWeight: 500 }}>
                              Attach
                              <input type="file" multiple style={{ display: "none" }}
                                onChange={e => handleNewFiles(d.key, [...newFiles, ...Array.from(e.target.files)])} />
                            </label>
                          </div>

                          {/* Empty state */}
                          {allFiles.length === 0 && (
          <div style={{ padding: "24px 14px", textAlign: "center", color: isDragOver ? C.primary : C.muted, fontSize: 12 }}>
            <FaPaperclip style={{ fontSize: 20, opacity: isDragOver ? 0.7 : 0.2, display: "block", margin: "0 auto 6px" }} />
            {isDragOver ? "Drop to attach" : "No files attached"}
          </div>
        )}

                          {/* File rows */}
                          {allFiles.map((f, i) => {
                            const ext = f.name.split(".").pop().toLowerCase();
                            const isPdf = ext === "pdf";
                            const isImg = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);
                            const iconColor = isPdf ? "#185FA5" : isImg ? "#854F0B" : "#3B6D11";
                            const iconBg = isPdf ? "#E6F1FB" : isImg ? "#FAEEDA" : "#EAF3DE";
                            const cleanName = f.name.replace(/^\d{13}_/, "");

                            return (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderTop: `0.5px solid ${C.border}` }}>
                                <div style={{ width: 26, height: 26, borderRadius: 5, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <FaFilePdf size={12} color={iconColor} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 12, fontWeight: 500, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cleanName}</div>
                                  <div style={{ fontSize: 10, color: C.muted }}>{f.isExisting ? "Saved" : "Pending"}</div>
                                </div>

                                {(() => {
                                  const fileExt = f.name.split(".").pop().toLowerCase();
                                  const canPreview = ["pdf", "jpg", "jpeg", "png", "webp", "gif"].includes(fileExt);
                                  const fileUrl = f.isExisting
                                    ? f.url
                                    : URL.createObjectURL(f.file || new Blob());
                                  return canPreview ? (
                                    <a href={fileUrl} target="_blank" rel="noreferrer"
                                      style={{
                                        fontSize: 11, padding: "2px 8px", borderRadius: 5,
                                        border: `0.5px solid ${C.border}`, color: C.primary,
                                        textDecoration: "none", whiteSpace: "nowrap",
                                        fontWeight: 500
                                      }}>
                                      View
                                    </a>
                                  ) : (
                                    <a href={fileUrl} download={cleanName}
                                      style={{
                                        fontSize: 11, padding: "2px 8px", borderRadius: 5,
                                        border: `0.5px solid ${C.border}`, color: C.muted,
                                        textDecoration: "none", whiteSpace: "nowrap"
                                      }}>
                                      Download
                                    </a>
                                  );
                                })()}

                                <button type="button"
                                  onClick={() => f.isExisting
                                    ? handleRemoveExisting(d.key, f.path)
                                    : handleNewFiles(d.key, newFiles.filter((_, ni) => ni !== f.newIndex))
                                  }
                                  style={{ padding: "2px 6px", borderRadius: 5, border: `0.5px solid ${C.border}`, background: "transparent", color: C.danger, cursor: "pointer" }}>
                                  <FaTrashAlt size={10} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* ── TAB: Projects ── */}
              {activeTab === "projects" && projectsEnabled && (
                <ProjectsTab clientId={savedAccountID} />
              )}
            </div>

            {activeTab !== "projects" && (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 24px", borderTop: `1px solid ${C.border}`,
      background: C.surface, flexShrink: 0, gap: 10, flexWrap: "wrap"
    }}>

      {/* Left — always visible utility buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        <ActionBtn icon={FaEraser} label="Clear" onClick={handleClear} />
        {activeTab === "documents" && (
          <>
            <ActionBtn icon={FaSave} label="Submit" loadingLabel="Saving…" loading={loadingSubmit}
              disabled={isSubmitDisabled || loadingSubmit || !canAdd} onClick={handleSubmit} variant="solid" />
            <ActionBtn icon={FaEdit} label="Update" loadingLabel="Updating…" loading={loadingUpdate}
              disabled={isUpdateDisabled || loadingUpdate || !canEdit} onClick={handleUpdate} />
            <ActionBtn icon={FaTrashAlt} label="Delete" loadingLabel="Deleting…" loading={loadingDelete}
              disabled={isDeleteDisabled || loadingDelete || !canDelete} onClick={handleDelete} />
          </>
        )}
      </div>

      {/* Right — Next / Previous navigation */}
      <div style={{ display: "flex", gap: 8 }}>
        {activeTab !== "basic" && (
          <button type="button"
            onClick={() => {
              const order = ["basic", "contact", "documents"];
              const idx = order.indexOf(activeTab);
              if (idx > 0) setActiveTab(order[idx - 1]);
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
              const order = ["basic", "contact", "documents"];
              const idx = order.indexOf(activeTab);
              if (idx < order.length - 1) setActiveTab(order[idx + 1]);
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
  )}
          </div>
        )}

        {showDesignationModal && (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        background: C.surface, borderRadius: 12, padding: 24,
        width: 360, boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        border: `1px solid ${C.border}`
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 30, height: 30, background: C.primary, borderRadius: 7,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <FaUserTie size={13} color="#fff" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>New Designation</span>
          </div>
          <button type="button" onClick={() => { setShowDesignationModal(false); setNewDesignationName(""); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}>
            <FaTimes size={14} />
          </button>
        </div>

        {/* Input */}
        <Field label="Designation Name" required>
          <Input
            value={newDesignationName}
            onChange={e => setNewDesignationName(e.target.value)}
            placeholder="e.g. Project Manager"
            onKeyDown={e => e.key === "Enter" && handleSaveDesignation()}
            autoFocus
          />
        </Field>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
          <button type="button"
            onClick={() => { setShowDesignationModal(false); setNewDesignationName(""); }}
            style={{
              padding: "8px 16px", fontSize: 13, fontWeight: 600, borderRadius: 7,
              border: `1.5px solid ${C.border}`, background: "none", color: C.muted, cursor: "pointer"
            }}>
            Cancel
          </button>
          <button type="button" onClick={handleSaveDesignation} disabled={savingDesignation}
            style={{
              padding: "8px 18px", fontSize: 13, fontWeight: 600, borderRadius: 7,
              background: C.primary, color: "#fff", border: "none",
              cursor: savingDesignation ? "not-allowed" : "pointer", opacity: savingDesignation ? 0.7 : 1,
              display: "flex", alignItems: "center", gap: 6
            }}>
            {savingDesignation ? (
              <><span style={{
                width: 11, height: 11, border: "2px solid #fff",
                borderTopColor: "transparent", borderRadius: "50%",
                display: "inline-block", animation: "spin 0.7s linear infinite"
              }} /> Saving…</>
            ) : <><FaSave size={11} /> Save</>}
          </button>
        </div>
      </div>
    </div>
  )}


      </div>




    );
  }

  export default Customer;