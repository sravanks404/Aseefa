import React, { useEffect, useMemo, useState } from "react";
import api from "../../apiService";

const UTILITY_TYPES = ["Electricity", "Water", "Gas", "Internet", "Maintenance", "Cleaning", "Security", "Other"];
const PAYMENT_STATUSES = ["Paid", "Pending", "Overdue"];

const UTILITY_META = {
    Electricity: { icon: "bi-lightning-charge", color: "#c07a00", soft: "#fdf3df" },
    Water: { icon: "bi-droplet", color: "#0f6fb0", soft: "#e5f3fb" },
    Gas: { icon: "bi-fire", color: "#dc2626", soft: "#fdecec" },
    Internet: { icon: "bi-wifi", color: "#1a9e6c", soft: "#e6f7f0" },
    Maintenance: { icon: "bi-tools", color: "#6366f1", soft: "#eef2ff" },
    Cleaning: { icon: "bi-stars", color: "#06b6d4", soft: "#ecfeff" },
    Security: { icon: "bi-shield-check", color: "#8b5cf6", soft: "#f5f3ff" },
    Other: { icon: "bi-receipt", color: "#64748b", soft: "#f1f5f9" },
};

const INITIAL_FORM = {
    id: null, // UtilityID — null on create
    paymentId: "", // auto-generated, filled by backend on save
    recordId: "", // Flat ID from PropertyMaster
    flatLabel: "", // e.g. "2BHK - Flat 101"
    flatNo: "",
    flatType: "",
    utilityType: "Electricity",
    amount: "",
    dueDate: "",
    paidDate: "",
    status: "Paid",
    referenceNumber: "",
    notes: "",
};

// ── session helpers ──
const getCompanyID = () => Number(sessionStorage.getItem("CompanyID")) || 0;
const getUserID = () => Number(sessionStorage.getItem("UserId")) || 0;

// Mapping API property fields to standard react property object
const mapApiProperty = (p) => ({
    id: p.PropertyID ?? p.propertyId ?? p.id,
    propertyId: p.PropertyID ?? p.propertyId ?? p.id,
    propertyName: p.PropertyName ?? p.propertyName ?? "",
    propertyCode: p.PropertyCode ?? p.propertyCode ?? "",
});

// A row counts as "payment history" if any payment-related column is populated.
const rowHasPaymentInfo = (r) =>
    Boolean(r.PaymentID || r.PaymentAmount || r.PaymentStatus || r.PaymentDueDate || r.PaidDate || r.ReferenceNumber || r.FlatID || r.FlatType || r.AccountNumber || r.ProviderName);

const mapPaymentRow = (r) => {
    const rawFlatId = (r.FlatID ?? r.AccountNumber ?? "").toString().trim();
    const rawFlatType = (r.FlatType ?? "").toString().trim();
    const rawRecordId = (r.RecordID ?? "").toString().trim();
    const rawFlatLabel = (r.ProviderName ?? "").toString().trim();

    let label = rawFlatLabel;
    if (!label && (rawFlatType || rawFlatId)) {
        if (rawFlatType && rawFlatId) {
            label = `${rawFlatType} - Flat ${rawFlatId}`;
        } else {
            label = rawFlatType || rawFlatId;
        }
    }

    return {
        id: r.UtilityID,
        paymentId: r.PaymentID ?? "",
        flatId: rawFlatId,
        flatType: rawFlatType,
        recordId: rawRecordId || rawFlatId,
        flatLabel: label,
        utilityType: r.UtilityType,
        amount: r.PaymentAmount ?? "",
        dueDate: (r.PaymentDueDate ?? "").toString().slice(0, 10),
        paidDate: (r.PaidDate ?? "").toString().slice(0, 10),
        status: r.PaymentStatus ?? "Pending",
        referenceNumber: r.ReferenceNumber ?? "",
        notes: r.Notes ?? "",
    };
};

const statusTagClass = (status) => {
    switch (status) {
        case "Paid": return "util-tag-green";
        case "Pending": return "util-tag-amber";
        case "Overdue": return "util-tag-red";
        default: return "util-tag-muted";
    }
};

const Utilities = () => {
    // ── Real property list ──
    const [properties, setProperties] = useState([]);
    const [propertiesLoading, setPropertiesLoading] = useState(false);
    const [selectedPropertyId, setSelectedPropertyId] = useState(null);
    const selectedProperty = properties.find((p) => String(p.id) === String(selectedPropertyId)) || null;
    const onSelectProperty = (propertyId) => setSelectedPropertyId(propertyId);

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // ── Payment history state ──
    const [payments, setPayments] = useState([]);
    const [flats, setFlats] = useState([]);
    const [flatsLoading, setFlatsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [showList, setShowList] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterType, setFilterType] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    // ── Payment form state ──
    const [form, setForm] = useState(INITIAL_FORM);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const isEditing = form.id !== null;

    // Calculate dynamically computed KPIs for the page header summary
    const stats = useMemo(() => {
        let totalPaid = 0;
        let pendingCount = 0;
        let overdueCount = 0;

        payments.forEach((p) => {
            const amountVal = parseFloat(p.amount) || 0;
            if (p.status === "Paid") {
                totalPaid += amountVal;
            } else if (p.status === "Pending") {
                pendingCount++;
            } else if (p.status === "Overdue") {
                overdueCount++;
            }
        });

        return { totalPaid, pendingCount, overdueCount };
    }, [payments]);

    const sortedPayments = useMemo(
        () => [...payments].sort((a, b) => new Date(b.dueDate || 0) - new Date(a.dueDate || 0)),
        [payments]
    );

    const filteredPayments = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return sortedPayments.filter((p) => {
            if (filterType && p.utilityType !== filterType) return false;
            if (filterStatus && p.status !== filterStatus) return false;
            if (!term) return true;
            return [p.paymentId, p.utilityType, p.referenceNumber, p.flatLabel].filter(Boolean).some((v) => v.toLowerCase().includes(term));
        });
    }, [sortedPayments, searchTerm, filterType, filterStatus]);

    const activeFilterCount = [filterType, filterStatus].filter(Boolean).length;

    // ========================================================
    // LOAD PROPERTIES (GET /api/getPropertyInformation)
    // ========================================================
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
                const list = Array.isArray(data.data) ? data.data.map(mapApiProperty) : [];
                setProperties(list);
            } else {
                setProperties([]);
                setErrorMessage(data?.message || "Failed to load properties.");
            }
        } catch (error) {
            console.error("Load property error:", error);
            setErrorMessage(error?.response?.data?.message || "Failed to load properties.");
        } finally {
            setPropertiesLoading(false);
        }
    };

    useEffect(() => {
        loadProperties();
    }, []);

    // ========================================================
    // LOAD UTILITIES FOR THE SELECTED PROPERTY
    // ========================================================
    const loadUtilities = async (propertyId) => {
        const companyID = getCompanyID();
        if (!companyID || !propertyId) return;

        setLoading(true);
        setErrorMessage("");
        try {
            const response = await api.get("/api/getPropertyUtilities", {
                params: { PropertyID: propertyId, CompanyID: companyID },
            });
            const data = response.data;
            if (data?.success) {
                const rows = Array.isArray(data.data) ? data.data : [];
                const nextPayments = [];

                rows.forEach((row) => {
                    if (rowHasPaymentInfo(row)) {
                        nextPayments.push(mapPaymentRow(row));
                    }
                });

                setPayments(nextPayments);
            } else {
                setErrorMessage(data?.message || "Failed to load utility details.");
            }
        } catch (error) {
            console.error("Load utilities error:", error);
            setErrorMessage(error?.response?.data?.message || "Failed to load utility details.");
        } finally {
            setLoading(false);
        }
    };

    // ========================================================
    // LOAD FLATS FOR THE SELECTED PROPERTY
    // ========================================================
    const loadFlats = async (propertyId) => {
        const companyID = getCompanyID();
        if (!companyID || !propertyId) {
            setFlats([]);
            return [];
        }
        setFlatsLoading(true);
        try {
            const response = await api.get("/api/getPropertyMaster", {
                params: { CompanyID: companyID, PropertyID: propertyId },
            });
            const list = response.data?.success && Array.isArray(response.data.data) ? response.data.data : [];
            const formatted = list.map((item) => {
                const recordId = item.RecordID ?? item.RoomID;
                const flatNo = (item.FlatNo ?? item.RoomNo ?? "").toString().trim();
                const flatType = (item.FlatType ?? item.RoomType ?? "").toString().trim();
                let label = "";
                if (flatType && flatNo) {
                    label = `${flatType} - Flat ${flatNo}`;
                } else if (flatType) {
                    label = flatType;
                } else if (flatNo) {
                    label = `Flat ${flatNo}`;
                } else {
                    label = `Flat #${recordId}`;
                }
                return {
                    recordId: String(recordId),
                    flatNo,
                    flatType,
                    label,
                };
            });
            setFlats(formatted);
            return formatted;
        } catch (error) {
            console.error("Load flats error:", error);
            setFlats([]);
            return [];
        } finally {
            setFlatsLoading(false);
        }
    };

    useEffect(() => {
        setShowForm(false);
        setShowList(true);
        setForm(INITIAL_FORM);
        setErrorMessage("");
        if (selectedProperty?.id) {
            loadUtilities(selectedProperty.id);
            loadFlats(selectedProperty.id);
        } else {
            setPayments([]);
            setFlats([]);
        }
    }, [selectedProperty?.id]);

    // Keep flatLabel and details synchronized if recordId or flatNo is set
    useEffect(() => {
        if ((form.recordId || form.flatNo) && !form.flatLabel && flats.length > 0) {
            const matched = flats.find((f) =>
                (form.recordId && String(f.recordId) === String(form.recordId)) ||
                (form.flatNo && String(f.flatNo).trim() === String(form.flatNo).trim())
            );
            if (matched) {
                setForm((prev) => ({
                    ...prev,
                    recordId: matched.recordId,
                    flatNo: matched.flatNo,
                    flatType: matched.flatType,
                    flatLabel: matched.label,
                }));
            }
        }
    }, [flats, form.recordId, form.flatNo, form.flatLabel]);

    // ── Handlers: payment history ──
    const handleChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const handleFlatChange = (e) => {
        const selectedId = e.target.value;
        const matched = flats.find((f) => String(f.recordId) === String(selectedId));
        if (matched) {
            setForm((prev) => ({
                ...prev,
                recordId: matched.recordId,
                flatNo: matched.flatNo,
                flatType: matched.flatType,
                flatLabel: matched.label,
            }));
        } else {
            setForm((prev) => ({
                ...prev,
                recordId: "",
                flatNo: "",
                flatType: "",
                flatLabel: "",
            }));
        }
    };

    const openCreate = () => {
        setForm(INITIAL_FORM);
        setShowForm(true);
        setShowList(false);
    };

    const openEdit = (payment) => {
        const matchedFlat = flats.find((f) =>
            (payment.recordId && String(f.recordId) === String(payment.recordId)) ||
            (payment.flatId && (String(f.recordId) === String(payment.flatId) || String(f.flatNo).trim() === String(payment.flatId).trim()))
        ) || (payment.flatLabel ? flats.find((f) => f.label === payment.flatLabel) : null);

        setForm({
            ...INITIAL_FORM,
            ...payment,
            recordId: matchedFlat ? matchedFlat.recordId : (payment.recordId || payment.flatId || ""),
            flatLabel: matchedFlat ? matchedFlat.label : (payment.flatLabel || ""),
            flatNo: matchedFlat ? matchedFlat.flatNo : (payment.flatId || ""),
            flatType: matchedFlat ? matchedFlat.flatType : (payment.flatType || ""),
        });
        setShowForm(true);
        setShowList(false);
    };

    const backToList = () => {
        setShowForm(false);
        setShowList(true);
        setForm(INITIAL_FORM);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        const companyID = getCompanyID();
        const userID = getUserID();

        if (!companyID) {
            setErrorMessage("CompanyID not found. Please login again.");
            return;
        }
        if (!selectedProperty?.id) {
            setErrorMessage("Property ID is unavailable. Please select a property first.");
            return;
        }

        setSaving(true);
        setErrorMessage("");
        try {
            const payload = {
                UtilityID: form.id || 0,
                PropertyID: selectedProperty.id,
                CompanyID: companyID,
                UtilityType: form.utilityType,
                FlatID: form.flatNo || (form.recordId ? String(form.recordId) : null),
                FlatType: form.flatType || null,
                RecordID: form.recordId ? String(form.recordId) : null,
                ProviderName: null,
                AccountNumber: null,
                MonthlyCost: null,
                DueDateText: null,
                PaymentID: form.paymentId || null,
                PaymentAmount: form.amount === "" ? null : form.amount,
                PaymentDueDate: form.dueDate || null,
                PaidDate: form.paidDate || null,
                PaymentStatus: form.status,
                ReferenceNumber: form.referenceNumber,
                Notes: form.notes,
                CreatedBy: form.id ? undefined : userID,
                ModifiedBy: userID,
                Action: form.id ? "UPDATE" : "INSERT",
            };

            const response = await api.post("/api/insertUpdatePropertyUtilities", payload);
            const data = response.data;

            if (data?.success) {
                await loadUtilities(selectedProperty.id);
                backToList();
            } else {
                setErrorMessage(data?.message || "Unable to save utility payment.");
            }
        } catch (error) {
            console.error("Error saving utility payment:", error);
            setErrorMessage(error?.response?.data?.message || "Unable to save utility payment.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!isEditing || !selectedProperty?.id) return;

        const companyID = getCompanyID();
        const userID = getUserID();

        setDeleting(true);
        setErrorMessage("");
        try {
            const response = await api.post("/api/deletePropertyUtility", {
                    UtilityID: form.id,
                    PropertyID: selectedProperty.id,
                    CompanyID: companyID,
                    ModifiedBy: userID,
                },);
            const data = response.data;

            if (data?.success) {
                await loadUtilities(selectedProperty.id);
                backToList();
            } else {
                setErrorMessage(data?.message || "Unable to delete utility payment.");
            }
        } catch (error) {
            console.error("Error deleting utility payment:", error);
            setErrorMessage(error?.response?.data?.message || "Unable to delete utility payment.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="util-root">
            <style>{`
        :root{
          --util-primary:#10299b;
          --util-primary-dark:#0b1c6e;
          --util-primary-mid:#4a5fc1;
          --util-primary-soft:#eef1fb;
          --util-primary-tint:#d6ddf5;
          --util-ink:#1a1f36;
          --util-muted:#6b7290;
          --util-green:#1a9e6c;
          --util-green-soft:#e6f7f0;
          --util-amber:#c07a00;
          --util-amber-soft:#fdf3df;
          --util-red:#dc2626;
          --util-red-soft:#fdecec;
          --util-slate:#475569;
          --util-slate-soft:#eef2f6;
        }
        .util-root{
          font-family:"Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
          color:var(--util-ink);
        }
        .util-root *{ box-sizing:border-box; }

        .util-alert{
          display:flex; align-items:center; gap:10px;
          background:var(--util-red-soft); color:var(--util-red);
          border:1px solid #f5b8b8; border-radius:10px;
          padding:10px 14px; font-size:.83rem; font-weight:600;
          margin-bottom:14px;
        }
        .util-loading{ text-align:center; padding:32px 16px; color:var(--util-muted); font-size:.85rem; }

        /* ---------- Page header ---------- */
        .util-page-header{ margin-bottom:20px; }
        .util-page-title{ font-size:1.15rem; font-weight:800; color:var(--util-primary-dark); margin:0 0 3px; }
        .util-page-sub{ font-size:.85rem; color:var(--util-muted); margin:0; }

        /* ---------- KPI Summary cards ---------- */
        .util-kpi-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .util-kpi-card {
          background: #ffffff;
          border: 1px solid var(--util-primary-tint);
          border-left: 4px solid var(--util-primary);
          border-radius: 12px;
          padding: 16px 20px;
          box-shadow: 0 4px 12px rgba(16,41,155,0.03);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .util-kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(16,41,155,0.06);
        }
        .util-kpi-label {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--util-muted);
          margin-bottom: 6px;
          letter-spacing: 0.5px;
        }
        .util-kpi-val {
          font-size: 1.3rem;
          font-weight: 800;
          color: var(--util-primary-dark);
        }

        /* ---------- Sections (shared) ---------- */
        .util-section{ margin-bottom:26px; }
        .util-section-head{
          display:flex; align-items:center; gap:10px; margin-bottom:16px; padding-bottom:12px;
          border-bottom:1px solid var(--util-primary-tint);
        }
        .util-section-icon{
          width:34px; height:34px; border-radius:9px; background:var(--util-primary-soft); color:var(--util-primary);
          display:flex; align-items:center; justify-content:center; font-size:.95rem; flex-shrink:0;
        }
        .util-section-title{ font-size:.95rem; font-weight:700; color:var(--util-primary-dark); margin:0; }
        .util-section-sub{ font-size:.76rem; color:var(--util-muted); margin-top:1px; }

        .util-grid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(230px, 1fr)); gap:16px 18px; }
        .util-field.util-field-wide{ grid-column:1 / -1; }
        .util-field label{
          display:block; font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.4px;
          color:var(--util-primary-mid); margin-bottom:6px;
        }
        .util-input, .util-select, .util-textarea{
          width:100%; border:1px solid var(--util-primary-tint); border-radius:9px; padding:9px 12px;
          font-size:.85rem; color:var(--util-ink); background:#fff; outline:none; font-family:inherit;
          transition:border-color .15s ease, box-shadow .15s ease;
        }
        .util-textarea{ resize:vertical; min-height:80px; }
        .util-input:focus, .util-select:focus, .util-textarea:focus{
          border-color:var(--util-primary); box-shadow:0 0 0 3px rgba(16,41,155,.12);
        }
        .util-input:disabled{ background:var(--util-primary-soft); color:var(--util-muted); cursor:not-allowed; }
        .util-hint{ font-size:.7rem; color:var(--util-muted); margin-top:4px; }
        .util-input-prefix-wrap{ position:relative; }
        .util-input-prefix-wrap span{
          position:absolute; left:12px; top:50%; transform:translateY(-50%);
          font-size:.8rem; color:var(--util-muted); font-weight:700;
        }
        .util-input-prefix-wrap input{ padding-left:34px; }

        /* ---------- Toolbar ---------- */
        .util-toolbar{ display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin-bottom:16px; }
        .util-search-wrap{ position:relative; flex:1; min-width:220px; }
        .util-search-wrap i{
          position:absolute; left:12px; top:50%; transform:translateY(-50%);
          color:var(--util-primary-mid); font-size:.85rem;
        }
        .util-search-input{
          width:100%; border:1px solid var(--util-primary-tint); border-radius:9px;
          padding:9px 12px 9px 34px; font-size:.85rem; background:var(--util-primary-soft);
          outline:none; transition:border-color .15s ease, background .15s ease;
        }
        .util-search-input:focus{ border-color:var(--util-primary); background:#fff; }

        .util-toolbar-btn{
          display:flex; align-items:center; gap:7px;
          border-radius:9px; padding:9px 16px; font-size:.83rem; font-weight:700; white-space:nowrap;
          border:1.5px solid var(--util-primary); background:#fff; color:var(--util-primary);
          cursor:pointer; transition:all .15s ease; position:relative;
        }
        .util-toolbar-btn:hover{ background:var(--util-primary-soft); }
        .util-toolbar-btn.util-btn-solid{ background:var(--util-primary); color:#fff; }
        .util-toolbar-btn.util-btn-solid:hover{ background:var(--util-primary-dark); }
        .util-toolbar-btn:disabled{ opacity:.6; cursor:default; }
        .util-filter-badge{
          position:absolute; top:-6px; right:-6px; background:var(--util-red); color:#fff;
          width:17px; height:17px; border-radius:50%; font-size:9px; font-weight:700;
          display:flex; align-items:center; justify-content:center;
        }

        /* ---------- Table ---------- */
        .util-table-card{
          background:#fff; border:1px solid var(--util-primary-tint); border-radius:16px;
          overflow:hidden; box-shadow:0 4px 18px rgba(16,41,155,.06);
        }
        .util-table{ width:100%; border-collapse:collapse; margin:0; }
        .util-table thead th{
          background:var(--util-primary-soft); color:var(--util-primary-dark);
          font-size:.7rem; font-weight:700; text-transform:uppercase; letter-spacing:.5px;
          padding:12px 16px; text-align:left; border-bottom:2px solid var(--util-primary-tint); white-space:nowrap;
        }
        .util-table tbody td{ padding:12px 16px; font-size:.84rem; border-bottom:1px solid #f0f2fa; vertical-align:middle; }
        .util-table tbody tr{ cursor:pointer; transition:background .15s ease; }
        .util-table tbody tr:nth-child(even){ background:#f8f9fd; }
        .util-table tbody tr:hover{ background:var(--util-primary-soft); }
        .util-row-name{ font-weight:700; color:var(--util-ink); }
        .util-row-sub{ font-size:.74rem; color:var(--util-muted); margin-top:1px; }
        .util-tag{ display:inline-block; font-size:.72rem; font-weight:700; padding:3px 10px; border-radius:999px; }
        .util-tag-green{ background:var(--util-green-soft); color:var(--util-green); }
        .util-tag-amber{ background:var(--util-amber-soft); color:var(--util-amber); }
        .util-tag-red{ background:var(--util-red-soft); color:var(--util-red); }
        .util-tag-muted{ background:var(--util-slate-soft); color:var(--util-muted); }
        .util-empty{ text-align:center; padding:48px 20px; color:var(--util-muted); }
        .util-empty i{ font-size:1.9rem; color:var(--util-primary-tint); margin-bottom:8px; display:block; }
        .util-empty-title{ font-weight:700; color:var(--util-primary-dark); font-size:.9rem; }

        /* ---------- Filter modal ---------- */
        .util-modal-backdrop{
          position:fixed; inset:0; z-index:1050; background:rgba(15,20,50,.5);
          display:flex; align-items:center; justify-content:center; padding:20px;
        }
        .util-modal-card{
          background:#fff; border-radius:16px; width:100%; max-width:420px;
          box-shadow:0 20px 50px rgba(16,41,155,.25); overflow:hidden;
        }
        .util-modal-head{
          display:flex; align-items:center; justify-content:space-between; padding:16px 20px;
          background:linear-gradient(135deg, var(--util-primary) 0%, var(--util-primary-dark) 100%); color:#fff;
        }
        .util-modal-head-title{ font-size:.95rem; font-weight:700; margin:0; }
        .util-modal-close{
          border:none; background:rgba(255,255,255,.15); color:#fff;
          width:26px; height:26px; border-radius:7px; cursor:pointer;
        }
        .util-modal-body{ padding:18px 20px; display:flex; flex-direction:column; gap:14px; }
        .util-modal-footer{ display:flex; justify-content:space-between; gap:10px; padding:14px 20px; border-top:1px solid var(--util-primary-soft); }

        /* ---------- Form (payment history) ---------- */
        .util-form-header{ display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; gap:12px; flex-wrap:wrap; }
        .util-form-title{ font-size:1.05rem; font-weight:700; color:var(--util-primary-dark); margin:0; }
        .util-back-btn{
          display:flex; align-items:center; gap:7px;
          border:1.5px solid var(--util-primary); background:#fff; color:var(--util-primary);
          border-radius:9px; padding:8px 16px; font-size:.83rem; font-weight:700; cursor:pointer; transition:all .15s ease;
        }
        .util-back-btn:hover{ background:var(--util-primary-soft); }

        .util-footer{
          display:flex; align-items:center; gap:10px; padding-top:18px;
          border-top:1px solid var(--util-primary-tint); flex-wrap:wrap;
        }
        .util-btn{ border:none; border-radius:10px; padding:10px 20px; font-size:.85rem; font-weight:700; transition:all .15s ease; cursor:pointer; }
        .util-btn-primary{ background:var(--util-primary); color:#fff; }
        .util-btn-primary:hover:not(:disabled){ background:var(--util-primary-dark); box-shadow:0 4px 10px rgba(16,41,155,.25); }
        .util-btn-primary:disabled{ opacity:.6; cursor:default; }
        .util-btn-ghost{ background:var(--util-primary-soft); color:var(--util-primary); }
        .util-btn-ghost:hover{ background:var(--util-primary-tint); }
        .util-btn-danger{ background:#fff; color:var(--util-red); border:1.5px solid #f5b8b8; }
        .util-btn-danger:hover:not(:disabled){ background:var(--util-red-soft); }
        .util-btn-danger:disabled{ opacity:.6; cursor:default; }
        .util-saved-note{ font-size:.76rem; color:var(--util-green); font-weight:600; display:flex; align-items:center; gap:5px; }
        .util-context-card{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 16px; margin-bottom:16px; border:1px solid var(--util-primary-tint); border-radius:14px; background:var(--util-primary-soft); }
        .util-context-title{ font-size:.78rem; font-weight:700; color:var(--util-primary-dark); text-transform:uppercase; letter-spacing:.5px; }
        .util-context-sub{ font-size:.84rem; color:var(--util-muted); margin-top:3px; }
        .util-property-item{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 16px; border-bottom:1px solid #f0f2fa; cursor:pointer; }
        .util-property-item:last-child{ border-bottom:none; }
        .util-property-name{ font-size:.84rem; font-weight:700; color:var(--util-primary-dark); }
        .util-property-code{ font-size:.74rem; color:var(--util-muted); margin-top:3px; }
        .util-list-card{
          background:#fff; border:1px solid var(--util-primary-tint); border-radius:16px;
          overflow:hidden; box-shadow:0 4px 18px rgba(16,41,155,.06);
        }
      `}</style>

            {errorMessage && (
                <div className="util-alert">
                    <i className="bi bi-exclamation-triangle"></i>
                    {errorMessage}
                </div>
            )}

            <div className="util-context-card">
                <div>
                    <div className="util-context-title">Selected property</div>
                    <div className="util-context-sub">{selectedProperty ? `${selectedProperty.propertyName || selectedProperty.propertyCode || "Selected property"}` : "Choose a property from the list to continue"}</div>
                </div>
                {selectedProperty ? (
                    <button type="button" className="util-btn util-btn-ghost" onClick={() => onSelectProperty(null)}>
                        Change property
                    </button>
                ) : null}
            </div>

            {!selectedProperty ? (
                <div className="util-section">
                    <div className="util-list-card">
                        {propertiesLoading ? (
                            <div className="util-loading">Loading properties…</div>
                        ) : properties.length === 0 ? (
                            <div className="util-loading">No properties found for this company.</div>
                        ) : (
                            properties.map((property) => (
                                <div key={property.id} className="util-property-item" onClick={() => onSelectProperty(property.id)}>
                                    <div>
                                        <div className="util-property-name">{property.propertyName || property.propertyCode}</div>
                                        <div className="util-property-code">{property.propertyCode || property.propertyId}</div>
                                    </div>
                                    <i className="bi bi-chevron-right" style={{ color: "var(--util-primary)" }}></i>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : loading ? (
                <div className="util-list-card">
                    <div className="util-loading">Loading expense details…</div>
                </div>
            ) : !showForm && showList ? (
                <>
                    <div className="util-page-header">
                        <p className="util-page-title">Expense Management</p>
                        <p className="util-page-sub">Track payments, status, and history of expenses for this property.</p>
                    </div>

                    {/* KPI Cards */}
                    <div className="util-kpi-row">
                        <div className="util-kpi-card" style={{ borderLeftColor: "var(--util-green)" }}>
                            <div className="util-kpi-label">Total Paid</div>
                            <div className="util-kpi-val" style={{ color: "var(--util-green)" }}>
                                AED {stats.totalPaid.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div className="util-kpi-card" style={{ borderLeftColor: "var(--util-amber)" }}>
                            <div className="util-kpi-label">Pending Payments</div>
                            <div className="util-kpi-val" style={{ color: "var(--util-amber)" }}>{stats.pendingCount}</div>
                        </div>
                        <div className="util-kpi-card" style={{ borderLeftColor: "var(--util-red)" }}>
                            <div className="util-kpi-label">Overdue Payments</div>
                            <div className="util-kpi-val" style={{ color: "var(--util-red)" }}>{stats.overdueCount}</div>
                        </div>
                    </div>

                    {/* Payment History */}
                    <div className="util-section">
                        <div className="util-section-head">
                            <div className="util-section-icon"><i className="bi bi-receipt"></i></div>
                            <div>
                                <p className="util-section-title">Expense Payment History</p>
                                <div className="util-section-sub">Record of past and upcoming expense payments</div>
                            </div>
                        </div>

                        <div className="util-toolbar">
                            <div className="util-search-wrap">
                                <i className="bi bi-search"></i>
                                <input
                                    type="text"
                                    className="util-search-input"
                                    placeholder="Search payment ID, flat, reference number…"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button type="button" className="util-toolbar-btn" onClick={() => setIsFilterOpen(true)}>
                                <i className="bi bi-funnel"></i> Filters
                                {activeFilterCount > 0 && <span className="util-filter-badge">{activeFilterCount}</span>}
                            </button>
                            <button type="button" className="util-toolbar-btn util-btn-solid" onClick={openCreate}>
                                <i className="bi bi-plus-lg"></i> Add Payment
                            </button>
                        </div>

                        <div className="util-table-card">
                            <div className="table-responsive" style={{ maxHeight: "60vh" }}>
                                <table className="util-table">
                                    <thead>
                                        <tr>
                                            <th>Payment ID</th>
                                            <th>Flat Type / Flat No</th>
                                            <th>Utility Type</th>
                                            <th>Amount</th>
                                            <th>Due Date</th>
                                            <th>Paid Date</th>
                                            <th>Status</th>
                                            <th>Reference</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPayments.length === 0 && (
                                            <tr>
                                                <td colSpan={8}>
                                                    <div className="util-empty">
                                                        <i className="bi bi-receipt-cutoff"></i>
                                                        <div className="util-empty-title">No payments found</div>
                                                        <div>Try adjusting your search or filters, or add a new payment.</div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        {filteredPayments.map((p) => (
                                            <tr key={p.id} onClick={() => openEdit(p)}>
                                                <td className="util-row-sub">{p.paymentId || "—"}</td>
                                                <td>
                                                    <div className="util-row-name">
                                                        {p.flatLabel ? (
                                                            <>
                                                                <i className="bi bi-door-open me-1" style={{ color: "var(--util-primary-mid)" }}></i>
                                                                {p.flatLabel}
                                                            </>
                                                        ) : (
                                                            <span style={{ color: "var(--util-muted)" }}>—</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="util-row-name">
                                                        <i className={`bi ${UTILITY_META[p.utilityType]?.icon || "bi-receipt"} me-1`} style={{ color: UTILITY_META[p.utilityType]?.color || "#10299b" }}></i>
                                                        {" "}{p.utilityType}
                                                    </div>
                                                </td>
                                                <td>{p.amount ? `AED ${parseFloat(p.amount).toLocaleString("de-DE", { minimumFractionDigits: 2 })}` : "—"}</td>
                                                <td>{p.dueDate || "—"}</td>
                                                <td>{p.paidDate || "—"}</td>
                                                <td><span className={`util-tag ${statusTagClass(p.status)}`}>{p.status}</span></td>
                                                <td className="util-row-sub">{p.referenceNumber || "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Filter modal */}
                    {isFilterOpen && (
                        <div className="util-modal-backdrop" onClick={() => setIsFilterOpen(false)}>
                            <div className="util-modal-card" onClick={(e) => e.stopPropagation()}>
                                <div className="util-modal-head">
                                    <p className="util-modal-head-title">Filter Payments</p>
                                    <button className="util-modal-close" onClick={() => setIsFilterOpen(false)}>
                                        <i className="bi bi-x-lg"></i>
                                    </button>
                                </div>
                                <div className="util-modal-body">
                                    <div className="util-field">
                                        <label>Utility Type</label>
                                        <select className="util-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                            <option value="">All utilities</option>
                                            {UTILITY_TYPES.map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="util-field">
                                        <label>Payment Status</label>
                                        <select className="util-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                            <option value="">All statuses</option>
                                            {PAYMENT_STATUSES.map((s) => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="util-modal-footer">
                                    <button
                                        type="button"
                                        className="util-btn util-btn-ghost"
                                        onClick={() => { setFilterType(""); setFilterStatus(""); }}
                                    >
                                        Clear All
                                    </button>
                                    <button type="button" className="util-btn util-btn-primary" onClick={() => setIsFilterOpen(false)}>
                                        Apply Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <>
                    {/* Payment form header */}
                    <div className="util-form-header">
                        <p className="util-form-title">{isEditing ? "Edit Utility Payment" : "Add Utility Payment"}</p>
                        <button type="button" className="util-back-btn" onClick={backToList}>
                            <i className="bi bi-arrow-left"></i> Back to Expenses
                        </button>
                    </div>

                    <form onSubmit={handleSave}>
                        {/* Section: Property Details */}
                        <div className="util-section">
                            <div className="util-section-head">
                                <div className="util-section-icon"><i className="bi bi-building"></i></div>
                                <div>
                                    <p className="util-section-title">Property Details</p>
                                    <div className="util-section-sub">Property information and flat assignment</div>
                                </div>
                            </div>

                            <div className="util-grid">
                                <div className="util-field">
                                    <label>Selected Property</label>
                                    <input
                                        type="text"
                                        className="util-input"
                                        value={selectedProperty ? (selectedProperty.propertyName || selectedProperty.propertyCode || "Selected Property") : ""}
                                        disabled
                                    />
                                </div>

                                <div className="util-field">
                                    <label>Flat Type / Flat No</label>
                                    <select
                                        className="util-select"
                                        value={form.recordId || ""}
                                        onChange={handleFlatChange}
                                        disabled={flatsLoading}
                                    >
                                        <option value="">{flatsLoading ? "Loading flats…" : "Select Flat"}</option>
                                        {flats.map((flat) => (
                                            <option key={flat.recordId} value={flat.recordId}>
                                                {flat.label}
                                            </option>
                                        ))}
                                    </select>
                                    {flats.length === 0 && !flatsLoading && (
                                        <div className="util-hint">No flats recorded for this property</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section: Payment Details */}
                        <div className="util-section">
                            <div className="util-section-head">
                                <div className="util-section-icon"><i className="bi bi-receipt"></i></div>
                                <div>
                                    <p className="util-section-title">Payment Details</p>
                                    <div className="util-section-sub">Which utility this payment covers, the amount, and its status</div>
                                </div>
                            </div>

                            <div className="util-grid">
                                <div className="util-field">
                                    <label>Payment ID</label>
                                    <input type="text" className="util-input" value={form.paymentId} disabled placeholder="Auto-generated" />
                                    <div className="util-hint">Assigned automatically on save</div>
                                </div>

                                <div className="util-field">
                                    <label>Utility Type</label>
                                    <select className="util-select" value={form.utilityType} onChange={handleChange("utilityType")}>
                                        {UTILITY_TYPES.map((t) => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="util-field">
                                    <label>Amount</label>
                                    <div className="util-input-prefix-wrap">
                                        <span>AED</span>
                                        <input type="number" className="util-input" value={form.amount} onChange={handleChange("amount")} placeholder="e.g. 420" />
                                    </div>
                                </div>

                                <div className="util-field">
                                    <label>Status</label>
                                    <select className="util-select" value={form.status} onChange={handleChange("status")}>
                                        {PAYMENT_STATUSES.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="util-field">
                                    <label>Due Date</label>
                                    <input type="date" className="util-input" value={form.dueDate} onChange={handleChange("dueDate")} />
                                </div>

                                <div className="util-field">
                                    <label>Paid Date</label>
                                    <input type="date" className="util-input" value={form.paidDate} onChange={handleChange("paidDate")} />
                                    <div className="util-hint">Leave blank if not yet paid</div>
                                </div>

                                <div className="util-field">
                                    <label>Reference Number</label>
                                    <input type="text" className="util-input" value={form.referenceNumber} onChange={handleChange("referenceNumber")} placeholder="e.g. DEWA-7729104" />
                                </div>

                                <div className="util-field util-field-wide">
                                    <label>Notes</label>
                                    <textarea className="util-textarea" value={form.notes} onChange={handleChange("notes")} placeholder="e.g. Billed jointly with electricity." />
                                </div>
                            </div>
                        </div>

                        <div className="util-footer">
                            <button type="submit" className="util-btn util-btn-primary" disabled={saving}>
                                <i className={`bi ${saving ? "bi-hourglass-split" : "bi-check2-circle"} me-2`}></i>
                                {saving ? "Saving…" : isEditing ? "Update Payment" : "Save Payment"}
                            </button>
                            {isEditing && (
                                <button type="button" className="util-btn util-btn-danger" onClick={handleDelete} disabled={deleting}>
                                    <i className={`bi ${deleting ? "bi-hourglass-split" : "bi-trash3"} me-2`}></i>
                                    {deleting ? "Deleting…" : "Delete"}
                                </button>
                            )}
                            <button type="button" className="util-btn util-btn-ghost" onClick={backToList} disabled={saving || deleting}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
};

export default Utilities;