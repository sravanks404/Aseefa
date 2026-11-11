import  { useEffect, useMemo, useState } from "react";
import api from "../../apiService";

const INITIAL_FORM = {
    id: null, // OwnershipID — null on create
    ownerName: "",
    coOwnerDetails: "",
    ownershipPercentage: "",
    purchaseDate: "",
    purchasePrice: "",
    currentMarketValue: "",
    mortgageDetails: "",
    loanAmount: "",
    loanProvider: "",
    emiDetails: "",
    insuranceCompany: "",
    insurancePolicyNumber: "",
    insuranceExpiryDate: "",
    propertyTaxDetails: "",
};

// ── session helpers ──
const getCompanyID = () => Number(sessionStorage.getItem("CompanyID")) || 0;
const getUserID = () => Number(sessionStorage.getItem("UserId")) || 0;

// ── API <-> UI mappers ──
// NOTE: adjust the right-hand-side field names if your getPropertyInformation
// response uses different casing than assumed here.
const mapApiProperty = (p) => ({
    id: p.PropertyID ?? p.propertyId ?? p.id,
    label: p.PropertyName ?? p.PropertyLabel ?? p.propertyLabel ?? p.Name ?? `Property #${p.PropertyID ?? p.id}`,
});

// GetPropertyOwnership / GetPropertyOwnershipByID recordset -> form shape.
// Column names mirror the @Param names used in insertUpdatePropertyOwnership.
const mapApiOwnership = (o) => ({
    id: o.OwnershipID,
    ownerName: o.OwnerName ?? "",
    coOwnerDetails: o.CoOwnerDetails ?? "",
    ownershipPercentage: o.OwnershipPercentage ?? "",
    purchaseDate: (o.PurchaseDate ?? "").toString().slice(0, 10),
    purchasePrice: o.PurchasePrice ?? "",
    currentMarketValue: o.CurrentMarketValue ?? "",
    mortgageDetails: o.MortgageDetails ?? "",
    loanAmount: o.LoanAmount ?? "",
    loanProvider: o.LoanProvider ?? "",
    emiDetails: o.EMIDetails ?? "",
    insuranceCompany: o.InsuranceCompany ?? "",
    insurancePolicyNumber: o.InsurancePolicyNumber ?? "",
    insuranceExpiryDate: (o.InsuranceExpiryDate ?? "").toString().slice(0, 10),
    propertyTaxDetails: o.PropertyTaxDetails ?? "",
});

// form shape -> insertUpdatePropertyOwnership request body
const mapFormToApiPayload = (form, { companyId, propertyId, userId }) => ({
    OwnershipID: form.id || null,
    CompanyID: companyId,
    PropertyID: propertyId,
    OwnerName: form.ownerName,
    CoOwnerDetails: form.coOwnerDetails,
    OwnershipPercentage: form.ownershipPercentage === "" ? null : form.ownershipPercentage,
    PurchaseDate: form.purchaseDate || null,
    PurchasePrice: form.purchasePrice === "" ? null : form.purchasePrice,
    CurrentMarketValue: form.currentMarketValue === "" ? null : form.currentMarketValue,
    MortgageDetails: form.mortgageDetails,
    LoanAmount: form.loanAmount === "" ? null : form.loanAmount,
    LoanProvider: form.loanProvider,
    EMIDetails: form.emiDetails,
    InsuranceCompany: form.insuranceCompany,
    InsurancePolicyNumber: form.insurancePolicyNumber,
    InsuranceExpiryDate: form.insuranceExpiryDate || null,
    PropertyTaxDetails: form.propertyTaxDetails,
    UserID: userId,
});

const PropertyOwnership = () => {
    // ── Property selection (ownership records are always scoped to one property) ──
    const [properties, setProperties] = useState([]);
    const [propertiesLoading, setPropertiesLoading] = useState(false);
    const [selectedPropertyId, setSelectedPropertyId] = useState("");

    // ── Ownership list state ──
    const [ownerships, setOwnerships] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // ── Form state ──
    const [form, setForm] = useState(INITIAL_FORM);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const isEditing = form.id !== null;
    const selectedProperty = properties.find((p) => String(p.id) === String(selectedPropertyId));

    // ========================================================
    // LOAD PROPERTIES (drives the property picker)
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

 
    const loadOwnerships = async (propertyId) => {
        const companyID = getCompanyID();
        if (!companyID || !propertyId) return;

        setLoading(true);
        setErrorMessage("");
        try {
            const response = await api.get("/api/getPropertyOwnership", {
                params: { CompanyID: companyID, PropertyID: propertyId },
            });
            const data = response.data;
            if (data?.success) {
                const list = Array.isArray(data.data) ? data.data.map(mapApiOwnership) : [];
                setOwnerships(list);
            } else {
                setOwnerships([]);
                setErrorMessage(data?.message || "Failed to load ownership details.");
            }
        } catch (error) {
            console.error("Load ownership error:", error);
            setErrorMessage(error?.response?.data?.message || "Failed to load ownership details.");
        } finally {
            setLoading(false);
        }
    };

    // ========================================================
    // LOAD PROPERTIES ON PAGE OPEN
    // ========================================================
    useEffect(() => {
        loadProperties();
    }, []);

    // Reload ownership records whenever the selected property changes
    useEffect(() => {
        setShowForm(false);
        setForm(INITIAL_FORM);
        setSearchTerm("");
        if (selectedPropertyId) {
            loadOwnerships(selectedPropertyId);
        } else {
            setOwnerships([]);
        }
    }, [selectedPropertyId]);

    const filteredOwnerships = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return ownerships;
        return ownerships.filter((o) =>
            [o.ownerName, o.loanProvider, o.insuranceCompany, String(o.id)]
                .filter(Boolean)
                .some((v) => v.toString().toLowerCase().includes(term))
        );
    }, [ownerships, searchTerm]);

    // ── Handlers ──
    const handleChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const openCreate = () => {
        setForm(INITIAL_FORM);
        setErrorMessage("");
        setShowForm(true);
    };

    const openEdit = async (ownership) => {
        setErrorMessage("");
        setForm(ownership);
        setShowForm(true);

        // Refresh this single record from the server for the latest data
        try {
            const response = await api.get("/api/getPropertyOwnershipByID", {
                params: {
                    OwnershipID: ownership.id,
                    CompanyID: getCompanyID(),
                    PropertyID: selectedPropertyId,
                },
            });
            const data = response.data;
            const record = Array.isArray(data?.data) ? data.data[0] : data?.data;
            if (data?.success && record) {
                setForm(mapApiOwnership(record));
            }
        } catch (error) {
            console.error("Load ownership by id error:", error);
            // non-fatal — keep showing the row data already in hand
        }
    };

    const backToList = () => {
        setShowForm(false);
        setForm(INITIAL_FORM);
        setErrorMessage("");
    };

    const handleSave = async (e) => {
        e.preventDefault();

        const companyID = getCompanyID();
        const userID = getUserID();

        if (!companyID) {
            setErrorMessage("CompanyID not found. Please login again.");
            return;
        }
        if (!selectedPropertyId) {
            setErrorMessage("Please select a property first.");
            return;
        }
        if (!userID) {
            setErrorMessage("UserID not found. Please login again.");
            return;
        }

        setSaving(true);
        setErrorMessage("");
        try {
            const payload = mapFormToApiPayload(form, {
                companyId: companyID,
                propertyId: selectedPropertyId,
                userId: userID,
            });
            const response = await api.post("/api/insertUpdatePropertyOwnership", payload);
            const data = response.data;

            if (data?.success) {
                await loadOwnerships(selectedPropertyId);
                backToList();
            } else {
                setErrorMessage(data?.message || "Failed to save ownership details.");
            }
        } catch (error) {
            console.error("Save ownership error:", error);
            setErrorMessage(error?.response?.data?.message || "Failed to save ownership details.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!isEditing) return;

        const companyID = getCompanyID();
        const userID = getUserID();

        setDeleting(true);
        setErrorMessage("");
        try {
            const response = await api.post("/api/deletePropertyOwnership", {
                    OwnershipID: form.id,
                    CompanyID: companyID,
                    PropertyID: selectedPropertyId,
                    UserID: userID,
                },);
            const data = response.data;

            if (data?.success) {
                await loadOwnerships(selectedPropertyId);
                backToList();
            } else {
                setErrorMessage(data?.message || "Failed to delete ownership record.");
            }
        } catch (error) {
            console.error("Delete ownership error:", error);
            setErrorMessage(error?.response?.data?.message || "Failed to delete ownership record.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="po-root">
            <style>{`
        :root{
          --po-primary:#10299b;
          --po-primary-dark:#0b1c6e;
          --po-primary-mid:#4a5fc1;
          --po-primary-soft:#eef1fb;
          --po-primary-tint:#d6ddf5;
          --po-ink:#1a1f36;
          --po-muted:#6b7290;
          --po-green:#1a9e6c;
          --po-green-soft:#e6f7f0;
          --po-red:#dc2626;
          --po-red-soft:#fdecec;
        }
        .po-root{
          font-family:"Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
          color:var(--po-ink);
        }
        .po-root *{ box-sizing:border-box; }

        .po-alert{
          display:flex; align-items:center; gap:10px;
          background:var(--po-red-soft); color:var(--po-red);
          border:1px solid #f5b8b8; border-radius:10px;
          padding:10px 14px; font-size:.83rem; font-weight:600;
          margin-bottom:14px;
        }

        .po-loading{
          text-align:center; padding:40px 20px; color:var(--po-muted); font-size:.85rem;
        }

        /* ---------- Property picker ---------- */
        .po-property-picker{
          display:flex; align-items:flex-end; gap:12px; flex-wrap:wrap;
          background:#fff; border:1px solid var(--po-primary-tint);
          border-radius:14px; padding:14px 16px; margin-bottom:18px;
          box-shadow:0 4px 18px rgba(16,41,155,.06);
        }
        .po-property-picker .po-field{ flex:1; min-width:240px; margin:0; }

        .po-empty-state{
          text-align:center; padding:48px 20px; color:var(--po-muted);
          background:#fff; border:1px solid var(--po-primary-tint); border-radius:16px;
        }
        .po-empty-state i{ font-size:1.9rem; color:var(--po-primary-tint); margin-bottom:8px; display:block; }
        .po-empty-state .po-empty-title{ font-weight:700; color:var(--po-primary-dark); font-size:.9rem; }

        /* ---------- List toolbar ---------- */
        .po-toolbar{
          display:flex;
          flex-wrap:wrap;
          align-items:center;
          gap:10px;
          margin-bottom:16px;
        }
        .po-search-wrap{
          position:relative;
          flex:1;
          min-width:220px;
        }
        .po-search-wrap i{
          position:absolute;
          left:12px; top:50%;
          transform:translateY(-50%);
          color:var(--po-primary-mid);
          font-size:.85rem;
        }
        .po-search-input{
          width:100%;
          border:1px solid var(--po-primary-tint);
          border-radius:9px;
          padding:9px 12px 9px 34px;
          font-size:.85rem;
          background:var(--po-primary-soft);
          outline:none;
          transition:border-color .15s ease, background .15s ease;
        }
        .po-search-input:focus{ border-color:var(--po-primary); background:#fff; }

        .po-toolbar-btn{
          display:flex; align-items:center; gap:7px;
          border-radius:9px;
          padding:9px 16px;
          font-size:.83rem;
          font-weight:700;
          white-space:nowrap;
          border:1.5px solid var(--po-primary);
          background:#fff;
          color:var(--po-primary);
          cursor:pointer;
          transition:all .15s ease;
        }
        .po-toolbar-btn:hover{ background:var(--po-primary-soft); }
        .po-toolbar-btn.po-btn-solid{ background:var(--po-primary); color:#fff; }
        .po-toolbar-btn.po-btn-solid:hover{ background:var(--po-primary-dark); }
        .po-toolbar-btn:disabled{ opacity:.5; cursor:default; }

        /* ---------- Table ---------- */
        .po-table-card{
          background:#fff;
          border:1px solid var(--po-primary-tint);
          border-radius:16px;
          overflow:hidden;
          box-shadow:0 4px 18px rgba(16,41,155,.06);
        }
        .po-table{ width:100%; border-collapse:collapse; margin:0; }
        .po-table thead th{
          background:var(--po-primary-soft);
          color:var(--po-primary-dark);
          font-size:.7rem;
          font-weight:700;
          text-transform:uppercase;
          letter-spacing:.5px;
          padding:12px 16px;
          text-align:left;
          border-bottom:2px solid var(--po-primary-tint);
          white-space:nowrap;
        }
        .po-table tbody td{
          padding:12px 16px;
          font-size:.84rem;
          border-bottom:1px solid #f0f2fa;
          vertical-align:middle;
        }
        .po-table tbody tr{ cursor:pointer; transition:background .15s ease; }
        .po-table tbody tr:nth-child(even){ background:#f8f9fd; }
        .po-table tbody tr:hover{ background:var(--po-primary-soft); }
        .po-row-name{ font-weight:700; color:var(--po-ink); }
        .po-row-sub{ font-size:.74rem; color:var(--po-muted); margin-top:1px; }
        .po-tag{
          display:inline-block;
          font-size:.72rem; font-weight:700;
          padding:3px 10px; border-radius:999px;
          background:var(--po-primary-soft); color:var(--po-primary-mid);
        }
        .po-empty{
          text-align:center; padding:48px 20px; color:var(--po-muted);
        }
        .po-empty i{ font-size:1.9rem; color:var(--po-primary-tint); margin-bottom:8px; display:block; }
        .po-empty-title{ font-weight:700; color:var(--po-primary-dark); font-size:.9rem; }

        /* ---------- Form ---------- */
        .po-form-header{
          display:flex; align-items:center; justify-content:space-between;
          margin-bottom:20px; gap:12px; flex-wrap:wrap;
        }
        .po-form-title{ font-size:1.05rem; font-weight:700; color:var(--po-primary-dark); margin:0; }
        .po-form-subtitle{ font-size:.78rem; color:var(--po-muted); margin-top:2px; }
        .po-back-btn{
          display:flex; align-items:center; gap:7px;
          border:1.5px solid var(--po-primary); background:#fff; color:var(--po-primary);
          border-radius:9px; padding:8px 16px; font-size:.83rem; font-weight:700; cursor:pointer;
          transition:all .15s ease;
        }
        .po-back-btn:hover{ background:var(--po-primary-soft); }

        .po-section{ margin-bottom:26px; }
        .po-section-head{
          display:flex;
          align-items:center;
          gap:10px;
          margin-bottom:16px;
          padding-bottom:12px;
          border-bottom:1px solid var(--po-primary-tint);
        }
        .po-section-icon{
          width:34px; height:34px;
          border-radius:9px;
          background:var(--po-primary-soft);
          color:var(--po-primary);
          display:flex; align-items:center; justify-content:center;
          font-size:.95rem;
          flex-shrink:0;
        }
        .po-section-title{
          font-size:.95rem;
          font-weight:700;
          color:var(--po-primary-dark);
          margin:0;
        }
        .po-section-sub{
          font-size:.76rem;
          color:var(--po-muted);
          margin-top:1px;
        }

        .po-grid{
          display:grid;
          grid-template-columns:repeat(auto-fill, minmax(230px, 1fr));
          gap:16px 18px;
        }
        .po-field.po-field-wide{ grid-column:1 / -1; }
        .po-field label{
          display:block;
          font-size:.72rem;
          font-weight:700;
          text-transform:uppercase;
          letter-spacing:.4px;
          color:var(--po-primary-mid);
          margin-bottom:6px;
        }
        .po-input, .po-select, .po-textarea{
          width:100%;
          border:1px solid var(--po-primary-tint);
          border-radius:9px;
          padding:9px 12px;
          font-size:.85rem;
          color:var(--po-ink);
          background:#fff;
          outline:none;
          transition:border-color .15s ease, box-shadow .15s ease;
          font-family:inherit;
        }
        .po-textarea{ resize:vertical; min-height:70px; }
        .po-input:focus, .po-select:focus, .po-textarea:focus{
          border-color:var(--po-primary);
          box-shadow:0 0 0 3px rgba(16,41,155,.12);
        }
        .po-input:disabled{
          background:var(--po-primary-soft);
          color:var(--po-muted);
          cursor:not-allowed;
        }
        .po-input-prefix-wrap{ position:relative; }
        .po-input-prefix-wrap span{
          position:absolute; left:12px; top:50%; transform:translateY(-50%);
          font-size:.8rem; color:var(--po-muted); font-weight:700;
        }
        .po-input-prefix-wrap input{ padding-left:34px; }

        .po-footer{
          display:flex;
          align-items:center;
          gap:10px;
          padding-top:18px;
          border-top:1px solid var(--po-primary-tint);
          flex-wrap:wrap;
        }
        .po-btn{
          border:none;
          border-radius:10px;
          padding:10px 20px;
          font-size:.85rem;
          font-weight:700;
          transition:all .15s ease;
          cursor:pointer;
        }
        .po-btn-primary{ background:var(--po-primary); color:#fff; }
        .po-btn-primary:hover:not(:disabled){ background:var(--po-primary-dark); box-shadow:0 4px 10px rgba(16,41,155,.25); }
        .po-btn-primary:disabled{ opacity:.6; cursor:default; }
        .po-btn-ghost{ background:var(--po-primary-soft); color:var(--po-primary); }
        .po-btn-ghost:hover{ background:var(--po-primary-tint); }
        .po-btn-danger{ background:#fff; color:var(--po-red); border:1.5px solid #f5b8b8; }
        .po-btn-danger:hover:not(:disabled){ background:var(--po-red-soft); }
        .po-btn-danger:disabled{ opacity:.6; cursor:default; }
      `}</style>

            {errorMessage && (
                <div className="po-alert">
                    <i className="bi bi-exclamation-triangle"></i>
                    {errorMessage}
                </div>
            )}

            {/* Property picker — ownership records are always scoped to one property */}
            <div className="po-property-picker">
                <div className="po-field">
                    <label>Property</label>
                    <select
                        className="po-select"
                        value={selectedPropertyId}
                        onChange={(e) => setSelectedPropertyId(e.target.value)}
                        disabled={propertiesLoading}
                    >
                        <option value="">
                            {propertiesLoading ? "Loading properties…" : "Select a property"}
                        </option>
                        {properties.map((p) => (
                            <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {!selectedPropertyId ? (
                <div className="po-empty-state">
                    <i className="bi bi-person-vcard"></i>
                    <div className="po-empty-title">Select a property to view its ownership details</div>
                    <div>Ownership records are tied to a specific property.</div>
                </div>
            ) : !showForm ? (
                <>
                    {/* Toolbar: search + create */}
                    <div className="po-toolbar">
                        <div className="po-search-wrap">
                            <i className="bi bi-search"></i>
                            <input
                                type="text"
                                className="po-search-input"
                                placeholder="Search owner, lender, insurer…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button type="button" className="po-toolbar-btn po-btn-solid" onClick={openCreate}>
                            <i className="bi bi-plus-lg"></i> Add Owner
                        </button>
                    </div>

                    {/* Table */}
                    <div className="po-table-card">
                        {loading ? (
                            <div className="po-loading">Loading ownership details…</div>
                        ) : (
                            <div className="table-responsive" style={{ maxHeight: "60vh" }}>
                                <table className="po-table">
                                    <thead>
                                        <tr>
                                            <th>Owner</th>
                                            <th>Ownership %</th>
                                            <th>Purchase Price</th>
                                            <th>Market Value</th>
                                            <th>Loan Provider</th>
                                            <th>Insurance Expiry</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOwnerships.length === 0 && (
                                            <tr>
                                                <td colSpan={6}>
                                                    <div className="po-empty">
                                                        <i className="bi bi-person-vcard"></i>
                                                        <div className="po-empty-title">No ownership records found</div>
                                                        <div>Add an owner to get started, or adjust your search.</div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        {filteredOwnerships.map((o) => (
                                            <tr key={o.id} onClick={() => openEdit(o)}>
                                                <td>
                                                    <div className="po-row-name">{o.ownerName || "—"}</div>
                                                    {o.coOwnerDetails && <div className="po-row-sub">Co-owners: {o.coOwnerDetails}</div>}
                                                </td>
                                                <td>{o.ownershipPercentage !== "" ? `${o.ownershipPercentage}%` : "—"}</td>
                                                <td>{o.purchasePrice ? `AED ${o.purchasePrice}` : "—"}</td>
                                                <td>{o.currentMarketValue ? `AED ${o.currentMarketValue}` : "—"}</td>
                                                <td>{o.loanProvider || "—"}</td>
                                                <td>{o.insuranceExpiryDate || "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* Form header */}
                    <div className="po-form-header">
                        <div>
                            <p className="po-form-title">{isEditing ? "Edit Ownership" : "New Ownership Record"}</p>
                            <div className="po-form-subtitle">
                                Property: {selectedProperty ? selectedProperty.label : `#${selectedPropertyId}`}
                            </div>
                        </div>
                        <button type="button" className="po-back-btn" onClick={backToList}>
                            <i className="bi bi-arrow-left"></i> Back to List
                        </button>
                    </div>

                    <form onSubmit={handleSave}>
                        <div className="po-section">
                            <div className="po-section-head">
                                <div className="po-section-icon">
                                    <i className="bi bi-person-badge"></i>
                                </div>
                                <div>
                                    <p className="po-section-title">Owner Details</p>
                                    <div className="po-section-sub">Who owns this property and their share</div>
                                </div>
                            </div>

                            <div className="po-grid">
                                <div className="po-field">
                                    <label>Owner Name</label>
                                    <input type="text" className="po-input" value={form.ownerName} onChange={handleChange("ownerName")} placeholder="e.g. Ahmed Al Farsi" />
                                </div>

                                <div className="po-field">
                                    <label>Ownership Percentage</label>
                                    <div className="po-input-prefix-wrap">
                                        <span>%</span>
                                        <input type="number" min="0" max="100" step="0.01" className="po-input" value={form.ownershipPercentage} onChange={handleChange("ownershipPercentage")} placeholder="e.g. 100" />
                                    </div>
                                </div>

                                <div className="po-field po-field-wide">
                                    <label>Co-Owner Details</label>
                                    <textarea className="po-textarea" value={form.coOwnerDetails} onChange={handleChange("coOwnerDetails")} placeholder="Names, shares, or contact details of any co-owners" />
                                </div>
                            </div>
                        </div>

                        <div className="po-section">
                            <div className="po-section-head">
                                <div className="po-section-icon">
                                    <i className="bi bi-cash-coin"></i>
                                </div>
                                <div>
                                    <p className="po-section-title">Purchase & Market Value</p>
                                    <div className="po-section-sub">Acquisition cost and current estimated value</div>
                                </div>
                            </div>

                            <div className="po-grid">
                                <div className="po-field">
                                    <label>Purchase Date</label>
                                    <input type="date" className="po-input" value={form.purchaseDate} onChange={handleChange("purchaseDate")} />
                                </div>

                                <div className="po-field">
                                    <label>Purchase Price</label>
                                    <div className="po-input-prefix-wrap">
                                        <span>AED</span>
                                        <input type="number" className="po-input" value={form.purchasePrice} onChange={handleChange("purchasePrice")} placeholder="e.g. 1200000" />
                                    </div>
                                </div>

                                <div className="po-field">
                                    <label>Current Market Value</label>
                                    <div className="po-input-prefix-wrap">
                                        <span>AED</span>
                                        <input type="number" className="po-input" value={form.currentMarketValue} onChange={handleChange("currentMarketValue")} placeholder="e.g. 1450000" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="po-section">
                            <div className="po-section-head">
                                <div className="po-section-icon">
                                    <i className="bi bi-bank"></i>
                                </div>
                                <div>
                                    <p className="po-section-title">Mortgage & Loan</p>
                                    <div className="po-section-sub">Financing details, if this property is mortgaged</div>
                                </div>
                            </div>

                            <div className="po-grid">
                                <div className="po-field">
                                    <label>Loan Amount</label>
                                    <div className="po-input-prefix-wrap">
                                        <span>AED</span>
                                        <input type="number" className="po-input" value={form.loanAmount} onChange={handleChange("loanAmount")} placeholder="e.g. 800000" />
                                    </div>
                                </div>

                                <div className="po-field">
                                    <label>Loan Provider</label>
                                    <input type="text" className="po-input" value={form.loanProvider} onChange={handleChange("loanProvider")} placeholder="e.g. Emirates NBD" />
                                </div>

                                <div className="po-field po-field-wide">
                                    <label>Mortgage Details</label>
                                    <textarea className="po-textarea" value={form.mortgageDetails} onChange={handleChange("mortgageDetails")} placeholder="Mortgage type, term, interest rate, etc." />
                                </div>

                                <div className="po-field po-field-wide">
                                    <label>EMI Details</label>
                                    <textarea className="po-textarea" value={form.emiDetails} onChange={handleChange("emiDetails")} placeholder="Monthly EMI amount, due date, remaining installments, etc." />
                                </div>
                            </div>
                        </div>

                        <div className="po-section">
                            <div className="po-section-head">
                                <div className="po-section-icon">
                                    <i className="bi bi-shield-check"></i>
                                </div>
                                <div>
                                    <p className="po-section-title">Insurance</p>
                                    <div className="po-section-sub">Property insurance coverage on file</div>
                                </div>
                            </div>

                            <div className="po-grid">
                                <div className="po-field">
                                    <label>Insurance Company</label>
                                    <input type="text" className="po-input" value={form.insuranceCompany} onChange={handleChange("insuranceCompany")} placeholder="e.g. AXA Gulf" />
                                </div>

                                <div className="po-field">
                                    <label>Insurance Policy Number</label>
                                    <input type="text" className="po-input" value={form.insurancePolicyNumber} onChange={handleChange("insurancePolicyNumber")} placeholder="e.g. POL-88213" />
                                </div>

                                <div className="po-field">
                                    <label>Insurance Expiry Date</label>
                                    <input type="date" className="po-input" value={form.insuranceExpiryDate} onChange={handleChange("insuranceExpiryDate")} />
                                </div>
                            </div>
                        </div>

                        <div className="po-section">
                            <div className="po-section-head">
                                <div className="po-section-icon">
                                    <i className="bi bi-receipt"></i>
                                </div>
                                <div>
                                    <p className="po-section-title">Property Tax</p>
                                    <div className="po-section-sub">Tax registration or payment details for this property</div>
                                </div>
                            </div>

                            <div className="po-grid">
                                <div className="po-field po-field-wide">
                                    <label>Property Tax Details</label>
                                    <textarea className="po-textarea" value={form.propertyTaxDetails} onChange={handleChange("propertyTaxDetails")} placeholder="Tax authority, reference number, last payment, etc." />
                                </div>
                            </div>
                        </div>

                        <div className="po-footer">
                            <button type="submit" className="po-btn po-btn-primary" disabled={saving}>
                                <i className={`bi ${saving ? "bi-hourglass-split" : "bi-check2-circle"} me-2`}></i>
                                {saving ? "Saving…" : isEditing ? "Update Ownership" : "Save Ownership"}
                            </button>
                            {isEditing && (
                                <button type="button" className="po-btn po-btn-danger" onClick={handleDelete} disabled={deleting}>
                                    <i className={`bi ${deleting ? "bi-hourglass-split" : "bi-trash3"} me-2`}></i>
                                    {deleting ? "Deleting…" : "Delete"}
                                </button>
                            )}
                            <button type="button" className="po-btn po-btn-ghost" onClick={backToList} disabled={saving || deleting}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
};

export default PropertyOwnership;