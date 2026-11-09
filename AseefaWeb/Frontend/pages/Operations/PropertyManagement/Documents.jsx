import PropTypes from "prop-types";
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../apiService";

const SUPPORTED_DOCUMENT_TYPES = [
    { key: "Title Deed", icon: "bi-file-earmark-text", multi: true },
    { key: "Sale Agreement", icon: "bi-file-earmark-ruled", multi: true },
    { key: "Floor Plan", icon: "bi-rulers", multi: true },
    // { key: "Occupancy Certificate", icon: "bi-house-check", multi: false },
    { key: "Lift Safety Certificate", icon: "bi-shield-check", multi: true },
    { key: "Plot Number Documents", icon: "bi-geo-alt", multi: true },
    { key: "Civil Defence (DCD) Approval documents(CCTV Documents)", icon: "bi-camera-video", multi: true },
    { key: "Civil Defence Clearance(Fire safety documents)", icon: "bi-fire", multi: true },
    { key: "Municipality Approval", icon: "bi-bank", multi: true },
    { key: "Building Permit", icon: "bi-file-earmark-check", multi: true },
    { key: "Property Insurance", icon: "bi-shield-check", multi: true },
    { key: "Electricity & Water Bill(FEWA)", icon: "bi-lightning-charge", multi: true },
    { key: "Mortgage Documents", icon: "bi-cash-stack", multi: true },
    { key: "Warranty Documents", icon: "bi-award", multi: true },
    { key: "Property Photos", icon: "bi-image", multi: true },
    // { key: "Videos", icon: "bi-camera-reels", multi: true },
    // { key: "360° Virtual Tour", icon: "bi-arrow-repeat", multi: true },
];

const STATUS_OPTIONS = ["Uploaded", "Missing"];

const getCompanyID = () => Number(sessionStorage.getItem("CompanyID")) || 0;
const getUserID = () => Number(sessionStorage.getItem("UserId") || sessionStorage.getItem("UserID")) || 0;

const mapApiProperty = (property) => ({
    id: property.PropertyID ?? property.PropertyId ?? property.propertyId ?? property.id,
    propertyId: property.PropertyID ?? property.PropertyId ?? property.propertyId ?? property.id,
    propertyName: property.PropertyName ?? property.propertyName ?? property.name ?? "",
    propertyCode: property.PropertyCode ?? property.propertyCode ?? property.code ?? "",
});

const INITIAL_FORM = {
    id: null,
    documentId: "", // auto-generated, filled by backend on save
    documentType: "",
    fileName: "",
    fileSizeLabel: "",
    documentDate: "",
    expiryDate: "",
    uploadedBy: "",
    notes: "",
};

const fileIcon = (fileName = "") => {
    const ext = fileName.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "bi-file-earmark-image";
    if (["mp4", "mov", "avi", "mkv"].includes(ext)) return "bi-file-earmark-play";
    if (ext === "pdf") return "bi-file-earmark-pdf";
    if (["doc", "docx"].includes(ext)) return "bi-file-earmark-word";
    return "bi-file-earmark";
};

const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    } catch {
        return dateStr;
    }
};

const bytesToLabel = (bytes) => {
    if (!bytes && bytes !== 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const mapApiDocument = (document) => ({
    ...document,
    id: document.DocumentID ?? document.documentId ?? document.id,
    documentId: document.DocumentID ?? document.documentId ?? document.id ?? "",
    documentType: document.DocumentType ?? document.documentType ?? "",
    fileName: document.FileName ?? document.fileName ?? "",
    fileSizeLabel: document.FileSizeLabel ?? document.fileSizeLabel ?? bytesToLabel(document.FileSize),
    documentDate: document.DocumentDate ?? document.documentDate ?? "",
    expiryDate: document.ExpiryDate ?? document.expiryDate ?? "",
    uploadedBy: document.UploadedBy ?? document.uploadedBy ?? "",
    notes: document.Notes ?? document.notes ?? "",
    path: document.FilePath ?? document.filePath ?? document.Path ?? document.path ?? "",
});

const Documents = ({ onSelectProperty }) => {
    // ── List state ──
    const [documents, setDocuments] = useState([]);
    const [properties, setProperties] = useState([]);
    const [propertiesLoading, setPropertiesLoading] = useState(false);
    const [selectedPropertyId, setSelectedPropertyId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState("");
    const [filterType, setFilterType] = useState("");

    // ── Form state ──
    const [form, setForm] = useState(INITIAL_FORM);
    const [selectedFile, setSelectedFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lockType, setLockType] = useState(false);
    const fileInputRef = useRef(null);

    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const isEditing = form.id !== null;

    const selectedProperty = properties.find(
        (property) => String(property.id) === String(selectedPropertyId)
    ) || null;

    const handlePropertySelect = (propertyId) => {
        setSelectedPropertyId(propertyId);
        onSelectProperty?.(propertyId);
    };

    const loadProperties = async () => {
        const companyID = getCompanyID();
        if (!companyID) {
            setErrorMessage("CompanyID not found. Please login again.");
            return;
        }

        setPropertiesLoading(true);
        try {
            const response = await api.get("/api/getPropertyInfo", {
                params: { CompanyID: companyID },
            });
            const data = response.data;
            if (data?.success) {
                const propertyRows = data.data || data.recordset || data.properties || [];
                setProperties(Array.isArray(propertyRows) ? propertyRows.map(mapApiProperty) : []);
            } else {
                setProperties([]);
                setErrorMessage(data?.message || "Failed to load properties.");
            }
        } catch (error) {
            console.error("Load property error:", error);
            setProperties([]);
            setErrorMessage(
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Failed to load properties."
            );
        } finally {
            setPropertiesLoading(false);
        }
    };

    useEffect(() => {
        loadProperties();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Load documents from backend ──
    useEffect(() => {
        const fetchDocs = async () => {
            const propertyId = selectedPropertyId;
            const companyID = getCompanyID();
            if (!companyID || !propertyId) {
                setDocuments([]);
                return;
            }
            setLoading(true);
            setErrorMessage("");
            try {
                const response = await api.get("/api/getPropertyDocs", {
                    params: { CompanyID: companyID, PropertyID: propertyId }
                });
                if (response.data?.success) {
                    setDocuments((response.data.documents || []).map(mapApiDocument));
                } else {
                    setErrorMessage(response.data?.message || "Failed to load documents.");
                }
            } catch (err) {
                console.error("fetchDocs error:", err);
                setErrorMessage("Server error loading documents.");
            } finally {
                setLoading(false);
            }
        };
        fetchDocs();
        setSuccessMessage("");
        setSelectedFile(null);
    }, [selectedPropertyId]);

    const docsByType = useMemo(() => {
        const map = {};
        documents.forEach((d) => {
            if (!map[d.documentType]) map[d.documentType] = [];
            map[d.documentType].push(d);
        });
        return map;
    }, [documents]);

    const coverageCount = useMemo(
        () => SUPPORTED_DOCUMENT_TYPES.filter((t) => (docsByType[t.key] || []).length > 0).length,
        [docsByType]
    );
    const coveragePct = Math.round((coverageCount / SUPPORTED_DOCUMENT_TYPES.length) * 100);

    const visibleTypes = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return SUPPORTED_DOCUMENT_TYPES.filter((t) => {
            const docs = docsByType[t.key] || [];
            const uploaded = docs.length > 0;

            if (filterStatus === "Uploaded" && !uploaded) return false;
            if (filterStatus === "Missing" && uploaded) return false;
            if (filterType && t.key !== filterType) return false;

            if (!term) return true;
            const matchesType = t.key.toLowerCase().includes(term);
            const matchesFile = docs.some((d) => d.fileName.toLowerCase().includes(term));
            return matchesType || matchesFile;
        });
    }, [searchTerm, filterStatus, filterType, docsByType]);

    const activeFilterCount = [filterStatus, filterType].filter(Boolean).length;

    // ── Handlers ──
    const handleChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        setForm((prev) => ({ ...prev, fileName: file.name, fileSizeLabel: bytesToLabel(file.size) }));
    };

    const openCreate = (presetType = "") => {
        // Single-file categories route straight to the existing record instead of duplicating it.
        const existing = presetType && (docsByType[presetType] || [])[0];
        if (existing && !SUPPORTED_DOCUMENT_TYPES.find((t) => t.key === presetType)?.multi) {
            openEdit(existing, true);
            return;
        }
        setForm({ ...INITIAL_FORM, documentType: presetType });
        setLockType(Boolean(presetType));
        setSelectedFile(null);
        setShowForm(true);
    };

    const openEdit = (doc, locked = true) => {
        setForm(mapApiDocument(doc));
        setLockType(locked);
        setSelectedFile(null);
        setShowForm(true);
    };

    const backToList = () => {
        setShowForm(false);
        setForm(INITIAL_FORM);
        setSelectedFile(null);
        setLockType(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSave = async (e) => {
        e.preventDefault();

        const propertyId = selectedProperty?.id || selectedProperty?.PropertyID;
        const companyID = getCompanyID();
        const userID = getUserID();
        if (!companyID || !propertyId) {
            alert("No property selected");
            return;
        }

        setSaving(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const formData = new FormData();
            formData.append("CompanyID", companyID);
            formData.append("PropertyID", propertyId);
            if (isEditing) {
                formData.append("id", form.id);
            }
            formData.append("documentType", form.documentType || "");
            formData.append("uploadedBy", userID || "");
            formData.append("documentDate", form.documentDate || new Date().toISOString().slice(0, 10));
            formData.append("expiryDate", form.expiryDate || "");
            formData.append("notes", form.notes || "");

            if (selectedFile) {
                formData.append("file", selectedFile);
            }

            const res = await api.post("/api/uploadPropertyDoc", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (res.data?.success) {
                setDocuments((res.data.documents || []).map(mapApiDocument));
                setSuccessMessage("Document saved successfully!");
                backToList();
                setTimeout(() => setSuccessMessage(""), 3000);
            } else {
                setErrorMessage(res.data?.message || "Failed to save document.");
            }
        } catch (err) {
            console.error("handleSave error:", err);
            setErrorMessage("Server error saving document.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!isEditing) return;

        const propertyId = selectedProperty?.id || selectedProperty?.PropertyID;
        const companyID = getCompanyID();
        if (!companyID || !propertyId) {
            alert("No property selected");
            return;
        }

        if (!window.confirm("Are you sure you want to delete this document?")) {
            return;
        }

        setDeleting(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const res = await api.post("/api/deletePropertyDoc", {
                CompanyID: companyID,
                PropertyID: propertyId,
                id: form.id,
                DeletedBy: getUserID(),
            });

            if (res.data?.success) {
                setDocuments((res.data.documents || []).map(mapApiDocument));
                setSuccessMessage("Document deleted successfully!");
                backToList();
                setTimeout(() => setSuccessMessage(""), 3000);
            } else {
                setErrorMessage(res.data?.message || "Failed to delete document.");
            }
        } catch (err) {
            console.error("handleDelete error:", err);
            setErrorMessage("Server error deleting document.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="doc-root">
            <style>{`
        :root{
          --doc-primary:#10299b;
          --doc-primary-dark:#0b1c6e;
          --doc-primary-mid:#4a5fc1;
          --doc-primary-soft:#eef1fb;
          --doc-primary-tint:#d6ddf5;
          --doc-ink:#1a1f36;
          --doc-muted:#6b7290;
          --doc-green:#1a9e6c;
          --doc-green-soft:#e6f7f0;
          --doc-amber:#c07a00;
          --doc-amber-soft:#fdf3df;
          --doc-red:#dc2626;
          --doc-red-soft:#fdecec;
        }
        .doc-root{
          font-family:"Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
          color:var(--doc-ink);
        }
        .doc-root *{ box-sizing:border-box; }

        /* ---------- Alerts ---------- */
        .doc-alert{
          display:flex; align-items:center; gap:8px;
          padding:10px 16px; margin-bottom:16px; border-radius:9px;
          font-size:.82rem; font-weight:700;
        }
        .doc-alert-success{ background:var(--doc-green-soft); color:var(--doc-green); border:1px solid var(--doc-primary-tint); }
        .doc-alert-error{ background:var(--doc-red-soft); color:var(--doc-red); border:1px solid var(--doc-primary-tint); }

        /* ---------- Page header ---------- */
        .doc-page-header{ margin-bottom:18px; }
        .doc-page-title{ font-size:1.15rem; font-weight:800; color:var(--doc-primary-dark); margin:0 0 3px; }
        .doc-page-sub{ font-size:.85rem; color:var(--doc-muted); margin:0; }

        /* ---------- Property picker (dropdown) ---------- */
        .doc-property-select-wrap{ display:flex; flex-direction:column; gap:4px; min-width:260px; }
        .doc-property-select-label{
          display:flex; align-items:center; gap:6px;
          font-size:.72rem; font-weight:700; color:var(--doc-primary-mid);
          text-transform:uppercase; letter-spacing:.5px;
        }

        /* ---------- Empty state (no property selected) ---------- */
        .doc-no-property{
          border:1px solid var(--doc-primary-tint); border-radius:14px;
          padding:48px 20px; text-align:center; background:#fff;
        }
        .doc-no-property i{ font-size:1.9rem; color:var(--doc-primary-tint); display:block; margin-bottom:10px; }
        .doc-no-property h3{ font-size:1rem; font-weight:800; color:var(--doc-primary-dark); margin:0 0 4px; }
        .doc-no-property p{ color:var(--doc-muted); font-size:.82rem; max-width:360px; margin:0 auto; }

        /* ---------- Coverage bar ---------- */
        .doc-coverage{
          display:flex; align-items:center; gap:14px;
          background:#fff; border:1px solid var(--doc-primary-tint); border-radius:14px;
          padding:14px 18px; margin-bottom:18px;
        }
        .doc-coverage-track{
          flex:1; height:9px; border-radius:999px; background:var(--doc-primary-soft); overflow:hidden;
        }
        .doc-coverage-fill{
          height:100%; border-radius:999px;
          background:linear-gradient(90deg, var(--doc-primary-mid), var(--doc-primary));
          transition:width .3s ease;
        }
        .doc-coverage-label{ font-size:.8rem; font-weight:700; color:var(--doc-primary-dark); white-space:nowrap; }
        .doc-coverage-sub{ font-size:.72rem; color:var(--doc-muted); white-space:nowrap; }

        /* ---------- Toolbar ---------- */
        .doc-toolbar{
          display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin-bottom:16px;
        }
        .doc-search-wrap{ position:relative; flex:1; min-width:220px; }
        .doc-search-wrap i{
          position:absolute; left:12px; top:50%; transform:translateY(-50%);
          color:var(--doc-primary-mid); font-size:.85rem;
        }
        .doc-search-input{
          width:100%; border:1px solid var(--doc-primary-tint); border-radius:9px;
          padding:9px 12px 9px 34px; font-size:.85rem; background:var(--doc-primary-soft);
          outline:none; transition:border-color .15s ease, background .15s ease;
        }
        .doc-search-input:focus{ border-color:var(--doc-primary); background:#fff; }

        .doc-toolbar-btn{
          display:flex; align-items:center; gap:7px;
          border-radius:9px; padding:9px 16px; font-size:.83rem; font-weight:700; white-space:nowrap;
          border:1.5px solid var(--doc-primary); background:#fff; color:var(--doc-primary);
          cursor:pointer; transition:all .15s ease; position:relative;
        }
        .doc-toolbar-btn:hover{ background:var(--doc-primary-soft); }
        .doc-toolbar-btn.doc-btn-solid{ background:var(--doc-primary); color:#fff; }
        .doc-toolbar-btn.doc-btn-solid:hover{ background:var(--doc-primary-dark); }
        .doc-filter-badge{
          position:absolute; top:-6px; right:-6px; background:var(--doc-red); color:#fff;
          width:17px; height:17px; border-radius:50%; font-size:9px; font-weight:700;
          display:flex; align-items:center; justify-content:center;
        }

        /* ---------- Document grid ---------- */
        .doc-grid{
          display:grid;
          grid-template-columns:repeat(auto-fill, minmax(290px, 1fr));
          gap:16px;
        }
        .doc-card{
          background:#fff; border:1px solid var(--doc-primary-tint); border-radius:14px;
          padding:16px; box-shadow:0 4px 14px rgba(16,41,155,.05);
          display:flex; flex-direction:column; gap:12px;
        }
        .doc-card-head{ display:flex; align-items:flex-start; gap:10px; }
        .doc-card-icon{
          width:36px; height:36px; border-radius:10px; flex-shrink:0;
          background:var(--doc-primary-soft); color:var(--doc-primary);
          display:flex; align-items:center; justify-content:center; font-size:1rem;
        }
        .doc-card-title{ font-size:.88rem; font-weight:700; color:var(--doc-ink); margin:0; }
        .doc-card-meta{ font-size:.7rem; color:var(--doc-muted); margin-top:1px; }
        .doc-status-badge{
          margin-left:auto; font-size:.68rem; font-weight:700; padding:3px 9px; border-radius:999px; white-space:nowrap;
        }
        .doc-status-uploaded{ background:var(--doc-green-soft); color:var(--doc-green); }
        .doc-status-missing{ background:var(--doc-amber-soft); color:var(--doc-amber); }

        .doc-file-row{
          display:flex; align-items:center; gap:9px;
          border:1px solid var(--doc-primary-tint); border-radius:9px;
          padding:8px 10px; background:var(--doc-primary-soft);
          cursor:pointer; transition:background .15s ease;
        }
        .doc-file-row:hover{ background:var(--doc-primary-tint); }
        .doc-file-row i.doc-file-type-icon{ color:var(--doc-primary-mid); font-size:.95rem; flex-shrink:0; }
        .doc-file-name{ font-size:.78rem; font-weight:600; color:var(--doc-ink); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .doc-file-sub{ font-size:.68rem; color:var(--doc-muted); }
        .doc-file-meta-row{ display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-top:3px; }
        .doc-file-date-chip{
          font-size:.66rem; font-weight:700; background:var(--doc-amber-soft); color:var(--doc-amber);
          padding:2px 7px; border-radius:6px; white-space:nowrap;
        }
        .doc-file-action-btn{
          border:none; background:var(--doc-primary-soft); color:var(--doc-primary);
          width:26px; height:26px; border-radius:7px; flex-shrink:0;
          display:flex; align-items:center; justify-content:center; cursor:pointer;
          transition:background .15s ease; margin-left:auto;
        }
        .doc-file-action-btn:hover{ background:var(--doc-primary-tint); }

        .doc-empty-state{
          border:1.5px dashed var(--doc-primary-tint); border-radius:10px;
          padding:16px 10px; text-align:center; color:var(--doc-muted); font-size:.78rem;
        }
        .doc-empty-state i{ font-size:1.3rem; color:var(--doc-primary-tint); display:block; margin-bottom:6px; }

        .doc-card-action{
          display:flex; align-items:center; justify-content:center; gap:6px;
          border:1.5px dashed var(--doc-primary-tint); border-radius:9px;
          padding:8px; font-size:.78rem; font-weight:700; color:var(--doc-primary);
          background:transparent; cursor:pointer; transition:all .15s ease;
        }
        .doc-card-action:hover{ background:var(--doc-primary-soft); border-color:var(--doc-primary); }

        .doc-empty-results{
          grid-column:1 / -1; text-align:center; padding:48px 20px; color:var(--doc-muted);
        }
        .doc-empty-results i{ font-size:1.9rem; color:var(--doc-primary-tint); margin-bottom:8px; display:block; }
        .doc-empty-results-title{ font-weight:700; color:var(--doc-primary-dark); font-size:.9rem; }

        .doc-loading{ text-align:center; padding:48px 20px; color:var(--doc-muted); font-size:.85rem; }

        /* ---------- Filter modal ---------- */
        .doc-modal-backdrop{
          position:fixed; inset:0; z-index:1050; background:rgba(15,20,50,.5);
          display:flex; align-items:center; justify-content:center; padding:20px;
        }
        .doc-modal-card{
          background:#fff; border-radius:16px; width:100%; max-width:420px;
          box-shadow:0 20px 50px rgba(16,41,155,.25); overflow:hidden;
        }
        .doc-modal-head{
          display:flex; align-items:center; justify-content:space-between; padding:16px 20px;
          background:linear-gradient(135deg, var(--doc-primary) 0%, var(--doc-primary-dark) 100%); color:#fff;
        }
        .doc-modal-head-title{ font-size:.95rem; font-weight:700; margin:0; }
        .doc-modal-close{
          border:none; background:rgba(255,255,255,.15); color:#fff;
          width:26px; height:26px; border-radius:7px; cursor:pointer;
        }
        .doc-modal-body{ padding:18px 20px; display:flex; flex-direction:column; gap:14px; }
        .doc-modal-footer{
          display:flex; justify-content:space-between; gap:10px; padding:14px 20px;
          border-top:1px solid var(--doc-primary-soft);
        }

        /* ---------- Form ---------- */
        .doc-form-header{
          display:flex; align-items:center; justify-content:space-between;
          margin-bottom:20px; gap:12px; flex-wrap:wrap;
        }
        .doc-form-title{ font-size:1.05rem; font-weight:700; color:var(--doc-primary-dark); margin:0; }
        .doc-back-btn{
          display:flex; align-items:center; gap:7px;
          border:1.5px solid var(--doc-primary); background:#fff; color:var(--doc-primary);
          border-radius:9px; padding:8px 16px; font-size:.83rem; font-weight:700; cursor:pointer;
          transition:all .15s ease;
        }
        .doc-back-btn:hover{ background:var(--doc-primary-soft); }

        .doc-section{ margin-bottom:26px; }
        .doc-section-head{
          display:flex; align-items:center; gap:10px; margin-bottom:16px; padding-bottom:12px;
          border-bottom:1px solid var(--doc-primary-tint);
        }
        .doc-section-icon{
          width:34px; height:34px; border-radius:9px; background:var(--doc-primary-soft); color:var(--doc-primary);
          display:flex; align-items:center; justify-content:center; font-size:.95rem; flex-shrink:0;
        }
        .doc-section-title{ font-size:.95rem; font-weight:700; color:var(--doc-primary-dark); margin:0; }
        .doc-section-sub{ font-size:.76rem; color:var(--doc-muted); margin-top:1px; }

        .doc-form-grid{
          display:grid; grid-template-columns:repeat(auto-fill, minmax(230px, 1fr)); gap:16px 18px;
        }
        .doc-field.doc-field-wide{ grid-column:1 / -1; }
        .doc-field label{
          display:block; font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.4px;
          color:var(--doc-primary-mid); margin-bottom:6px;
        }
        .doc-input, .doc-select, .doc-textarea{
          width:100%; border:1px solid var(--doc-primary-tint); border-radius:9px; padding:9px 12px;
          font-size:.85rem; color:var(--doc-ink); background:#fff; outline:none; font-family:inherit;
          transition:border-color .15s ease, box-shadow .15s ease;
        }
        .doc-textarea{ resize:vertical; min-height:80px; }
        .doc-input:focus, .doc-select:focus, .doc-textarea:focus{
          border-color:var(--doc-primary); box-shadow:0 0 0 3px rgba(16,41,155,.12);
        }
        .doc-input:disabled, .doc-select:disabled{ background:var(--doc-primary-soft); color:var(--doc-muted); cursor:not-allowed; }
        .doc-hint{ font-size:.7rem; color:var(--doc-muted); margin-top:4px; }

        .doc-upload-box{
          border:1.5px dashed var(--doc-primary-tint); border-radius:11px; padding:18px;
          display:flex; align-items:center; gap:12px; cursor:pointer; transition:all .15s ease;
        }
        .doc-upload-box:hover{ border-color:var(--doc-primary); background:var(--doc-primary-soft); }
        .doc-upload-box i{ font-size:1.4rem; color:var(--doc-primary); }
        .doc-upload-box .doc-upload-title{ font-size:.83rem; font-weight:700; color:var(--doc-ink); }
        .doc-upload-box .doc-upload-sub{ font-size:.72rem; color:var(--doc-muted); }
        .doc-view-current-link{
          display:inline-flex; align-items:center; gap:6px; margin-top:10px;
          font-size:.8rem; font-weight:700; text-decoration:none;
          background:var(--doc-primary-soft); color:var(--doc-primary);
          padding:6px 12px; border-radius:9px;
        }
        .doc-view-current-link:hover{ background:var(--doc-primary-tint); }

        .doc-footer{
          display:flex; align-items:center; gap:10px; padding-top:18px;
          border-top:1px solid var(--doc-primary-tint); flex-wrap:wrap;
        }
        .doc-btn{ border:none; border-radius:10px; padding:10px 20px; font-size:.85rem; font-weight:700; transition:all .15s ease; cursor:pointer; }
        .doc-btn-primary{ background:var(--doc-primary); color:#fff; }
        .doc-btn-primary:hover:not(:disabled){ background:var(--doc-primary-dark); box-shadow:0 4px 10px rgba(16,41,155,.25); }
        .doc-btn-primary:disabled{ opacity:.6; cursor:default; }
        .doc-btn-ghost{ background:var(--doc-primary-soft); color:var(--doc-primary); }
        .doc-btn-ghost:hover{ background:var(--doc-primary-tint); }
        .doc-btn-danger{ background:#fff; color:var(--doc-red); border:1.5px solid #f5b8b8; }
        .doc-btn-danger:hover:not(:disabled){ background:var(--doc-red-soft); }
        .doc-btn-danger:disabled{ opacity:.6; cursor:default; }
      `}</style>

            {successMessage && (
                <div className="doc-alert doc-alert-success">
                    <i className="bi bi-check-circle-fill"></i> {successMessage}
                </div>
            )}
            {errorMessage && (
                <div className="doc-alert doc-alert-error">
                    <i className="bi bi-exclamation-triangle-fill"></i> {errorMessage}
                </div>
            )}

            {!showForm ? (
                <>
                    <div className="doc-page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", flexWrap: "wrap" }}>
                        <div>
                            <p className="doc-page-title">Property Documents</p>
                            <p className="doc-page-sub">Upload and manage documents.</p>
                        </div>

                        <div className="doc-property-select-wrap">
                            <div className="doc-property-select-label">
                                <i className="bi bi-building-gear"></i> Select a Property
                            </div>
                            <select
                                className="doc-select"
                                value={selectedProperty?.id || ""}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    handlePropertySelect(val ? Number(val) : null);
                                }}
                                disabled={propertiesLoading}
                            >
                                <option value="">
                                    {propertiesLoading ? "Loading properties..." : "-- Choose a property --"}
                                </option>
                                {properties.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.propertyName || p.propertyCode || "Property #" + p.id}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {!selectedProperty ? (
                        <div className="doc-no-property">
                            <i className="bi bi-building-up"></i>
                            <h3>No Property Selected</h3>
                            <p>Select a property from the dropdown above to view, upload, and manage its official documents.</p>
                        </div>
                    ) : (
                        <>
                            {loading ? (
                                <div className="doc-loading">Loading property documents…</div>
                            ) : (
                                <>
                                    {/* Coverage summary */}
                                    <div className="doc-coverage">
                                        <div className="doc-coverage-label">{coverageCount} / {SUPPORTED_DOCUMENT_TYPES.length} uploaded</div>
                                        <div className="doc-coverage-track">
                                            <div className="doc-coverage-fill" style={{ width: `${coveragePct}%` }}></div>
                                        </div>
                                        <div className="doc-coverage-sub">{coveragePct}% complete</div>
                                    </div>

                                    {/* Toolbar */}
                                    <div className="doc-toolbar">
                                        <div className="doc-search-wrap">
                                            <i className="bi bi-search"></i>
                                            <input
                                                type="text"
                                                className="doc-search-input"
                                                placeholder="Search document type or file name…"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <button type="button" className="doc-toolbar-btn" onClick={() => setIsFilterOpen(true)}>
                                            <i className="bi bi-funnel"></i> Filters
                                            {activeFilterCount > 0 && <span className="doc-filter-badge">{activeFilterCount}</span>}
                                        </button>
                                        <button type="button" className="doc-toolbar-btn doc-btn-solid" onClick={() => openCreate("")}>
                                            <i className="bi bi-cloud-upload"></i> Upload Document
                                        </button>
                                    </div>

                                    {/* Document category grid */}
                                    <div className="doc-grid">
                                        {visibleTypes.length === 0 && (
                                            <div className="doc-empty-results">
                                                <i className="bi bi-folder2-open"></i>
                                                <div className="doc-empty-results-title">No document categories match</div>
                                                <div>Try adjusting your search or filters.</div>
                                            </div>
                                        )}
                                        {visibleTypes.map((t) => {
                                            const docs = docsByType[t.key] || [];
                                            const uploaded = docs.length > 0;
                                            return (
                                                <div className="doc-card" key={t.key}>
                                                    <div className="doc-card-head">
                                                        <div className="doc-card-icon"><i className={`bi ${t.icon}`}></i></div>
                                                        <div>
                                                            <p className="doc-card-title">{t.key}</p>
                                                            <div className="doc-card-meta">{t.multi ? "Multiple files supported" : "Single file"}</div>
                                                        </div>
                                                        <span className={`doc-status-badge ${uploaded ? "doc-status-uploaded" : "doc-status-missing"}`}>
                                                            {uploaded ? "Uploaded" : "Missing"}
                                                        </span>
                                                    </div>

                                                    {uploaded ? (
                                                        docs.map((d) => (
                                                            <div className="doc-file-row" key={d.id} onClick={() => openEdit(d)}>
                                                                <i className={`bi ${fileIcon(d.fileName)} doc-file-type-icon`}></i>
                                                                <div style={{ overflow: "hidden", flex: 1 }}>
                                                                    <div className="doc-file-name">{d.fileName}</div>
                                                                    <div className="doc-file-meta-row">
                                                                        <span className="doc-file-sub">Size: {d.fileSizeLabel}</span>
                                                                        {d.documentDate && (
                                                                            <span className="doc-file-date-chip">Uploaded: {formatDate(d.documentDate)}</span>
                                                                        )}
                                                                        {d.uploadedBy && (
                                                                            <span className="doc-file-sub">by {d.uploadedBy}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {d.path && (
                                                                    <button
                                                                        type="button"
                                                                        className="doc-file-action-btn"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            window.open(`${api.defaults.baseURL || "http://localhost:1201"}/${d.path}`, "_blank");
                                                                        }}
                                                                        title="View File"
                                                                    >
                                                                        <i className="bi bi-eye"></i>
                                                                    </button>
                                                                )}
                                                                <i className="bi bi-chevron-right" style={{ color: "var(--doc-muted)", fontSize: ".75rem", marginLeft: "6px" }}></i>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="doc-empty-state">
                                                            <i className="bi bi-file-earmark-x"></i>
                                                            No file uploaded yet
                                                        </div>
                                                    )}

                                                    {(t.multi || !uploaded) && (
                                                        <button type="button" className="doc-card-action" onClick={() => openCreate(t.key)}>
                                                            <i className="bi bi-plus-lg"></i> {uploaded ? "Add Another File" : "Upload"}
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* Filter modal */}
                    {isFilterOpen && (
                        <div className="doc-modal-backdrop" onClick={() => setIsFilterOpen(false)}>
                            <div className="doc-modal-card" onClick={(e) => e.stopPropagation()}>
                                <div className="doc-modal-head">
                                    <p className="doc-modal-head-title">Filter Documents</p>
                                    <button className="doc-modal-close" onClick={() => setIsFilterOpen(false)}>
                                        <i className="bi bi-x-lg"></i>
                                    </button>
                                </div>
                                <div className="doc-modal-body">
                                    <div className="doc-field">
                                        <label>Status</label>
                                        <select className="doc-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                            <option value="">All statuses</option>
                                            {STATUS_OPTIONS.map((s) => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="doc-field">
                                        <label>Document Type</label>
                                        <select className="doc-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                            <option value="">All types</option>
                                            {SUPPORTED_DOCUMENT_TYPES.map((t) => (
                                                <option key={t.key} value={t.key}>{t.key}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="doc-modal-footer">
                                    <button
                                        type="button"
                                        className="doc-btn doc-btn-ghost"
                                        onClick={() => { setFilterStatus(""); setFilterType(""); }}
                                    >
                                        Clear All
                                    </button>
                                    <button type="button" className="doc-btn doc-btn-primary" onClick={() => setIsFilterOpen(false)}>
                                        Apply Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <>
                    {/* Form header */}
                    <div className="doc-form-header">
                        <p className="doc-form-title">{isEditing ? "Edit Document" : "Upload Document"}</p>
                        <button type="button" className="doc-back-btn" onClick={backToList}>
                            <i className="bi bi-arrow-left"></i> Back to Documents
                        </button>
                    </div>

                    <form onSubmit={handleSave}>
                        <div className="doc-section">
                            <div className="doc-section-head">
                                <div className="doc-section-icon"><i className="bi bi-folder2"></i></div>
                                <div>
                                    <p className="doc-section-title">Document Details</p>
                                    <div className="doc-section-sub">Choose the category and attach the file</div>
                                </div>
                            </div>

                            <div className="doc-form-grid">
                                <div className="doc-field">
                                    <label>Document ID</label>
                                    <input type="text" className="doc-input" value={form.documentId} disabled placeholder="Auto-generated" />
                                    <div className="doc-hint">Assigned automatically on save</div>
                                </div>

                                <div className="doc-field">
                                    <label>Document Type</label>
                                    <select className="doc-select" value={form.documentType} onChange={handleChange("documentType")} disabled={lockType}>
                                        <option value="">Select document type</option>
                                        {SUPPORTED_DOCUMENT_TYPES.map((t) => (
                                            <option key={t.key} value={t.key}>{t.key}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="doc-field">
                                    <label>Uploaded By</label>
                                    <input type="text" className="doc-input" value={form.uploadedBy} onChange={handleChange("uploadedBy")} placeholder="e.g. Ahmed Al Farsi" />
                                </div>

                                <div className="doc-field">
                                    <label>Document Date</label>
                                    <input type="date" className="doc-input" value={form.documentDate} onChange={handleChange("documentDate")} />
                                </div>

                                <div className="doc-field doc-field-wide">
                                    <label>File</label>
                                    <div className="doc-upload-box" onClick={() => fileInputRef.current?.click()}>
                                        <i className={`bi ${form.fileName ? fileIcon(form.fileName) : "bi-cloud-arrow-up"}`}></i>
                                        <div>
                                            <div className="doc-upload-title">{form.fileName || "Click to choose a file"}</div>
                                            <div className="doc-upload-sub">{form.fileSizeLabel || "PDF, image, or video up to 25 MB"}</div>
                                        </div>
                                    </div>
                                    <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileSelect} />
                                    {form.path && (
                                        <a
                                            href={`${api.defaults.baseURL || "http://localhost:1201"}/${form.path}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="doc-view-current-link"
                                        >
                                            <i className="bi bi-eye"></i> View Current File
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="doc-section">
                            <div className="doc-section-head">
                                <div className="doc-section-icon"><i className="bi bi-info-circle"></i></div>
                                <div>
                                    <p className="doc-section-title">Additional Details</p>
                                    <div className="doc-section-sub">Optional expiry tracking and notes for this document</div>
                                </div>
                            </div>

                            <div className="doc-form-grid">
                                <div className="doc-field">
                                    <label>Expiry Date</label>
                                    <input type="date" className="doc-input" value={form.expiryDate} onChange={handleChange("expiryDate")} />
                                    <div className="doc-hint">Applies to insurance, permits, and other renewable documents</div>
                                </div>

                                <div className="doc-field doc-field-wide">
                                    <label>Notes</label>
                                    <textarea className="doc-textarea" value={form.notes} onChange={handleChange("notes")} placeholder="e.g. Original title deed issued by Dubai Land Department." />
                                </div>
                            </div>
                        </div>

                        <div className="doc-footer">
                            <button type="submit" className="doc-btn doc-btn-primary" disabled={saving}>
                                <i className={`bi ${saving ? "bi-hourglass-split" : "bi-check2-circle"} me-2`}></i>
                                {saving ? "Saving…" : isEditing ? "Update Document" : "Save Document"}
                            </button>
                            {isEditing && (
                                <button type="button" className="doc-btn doc-btn-danger" onClick={handleDelete} disabled={deleting}>
                                    <i className={`bi ${deleting ? "bi-hourglass-split" : "bi-trash3"} me-2`}></i>
                                    {deleting ? "Deleting…" : "Delete"}
                                </button>
                            )}
                            <button type="button" className="doc-btn doc-btn-ghost" onClick={backToList} disabled={saving || deleting}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
};

export default Documents;

Documents.propTypes = {
    onSelectProperty: PropTypes.func,
};
