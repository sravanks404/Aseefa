import React, { useMemo, useState } from "react";

const TAX_STATUSES = ["Exempt", "Taxable - VAT", "Taxable - Income Tax", "Under Review"];

const INITIAL_FORM = {
    id: null,
    financialId: "", // auto-generated, filled by backend on save
    propertyId: "",
    propertyName: "",
    purchaseCost: "",
    purchaseDate: "",
    renovationCost: "",
    interiorCost: "",
    currentValuation: "",
    valuationDate: "",
    expectedRentalIncome: "",
    rentalFrequency: "Annual",
    annualROI: "",
    depreciation: "",
    propertyExpenses: "",
    netProfit: "",
    taxStatus: "",
    taxId: "",
    taxNotes: "",
};

// ─── Mock seed data — replace with a GET call to your financials endpoint ───
const SEED_RECORDS = [
    {
        id: 1, financialId: "FIN-0001", propertyId: "PRP-0001", propertyName: "Marina Heights - 204",
        purchaseCost: 1850000, purchaseDate: "2021-03-14", renovationCost: 65000, interiorCost: 42000,
        currentValuation: 2350000, valuationDate: "2026-06-01", expectedRentalIncome: 145000, rentalFrequency: "Annual",
        annualROI: 7.8, depreciation: 32000, propertyExpenses: 28000, netProfit: 85000,
        taxStatus: "Taxable - VAT", taxId: "TRN-100234567800003", taxNotes: "VAT applies on service charges only.",
    },
    {
        id: 2, financialId: "FIN-0002", propertyId: "PRP-0002", propertyName: "Palm Residences - 112",
        purchaseCost: 1250000, purchaseDate: "2022-08-02", renovationCost: 18000, interiorCost: 21000,
        currentValuation: 1520000, valuationDate: "2026-05-15", expectedRentalIncome: 98000, rentalFrequency: "Annual",
        annualROI: 6.9, depreciation: 19500, propertyExpenses: 15000, netProfit: 63500,
        taxStatus: "Exempt", taxId: "", taxNotes: "Residential exemption applied.",
    },
    {
        id: 3, financialId: "FIN-0003", propertyId: "PRP-0004", propertyName: "Garden View - Office 301",
        purchaseCost: 980000, purchaseDate: "2020-11-20", renovationCost: 54000, interiorCost: 61000,
        currentValuation: 1180000, valuationDate: "2026-04-10", expectedRentalIncome: 132000, rentalFrequency: "Annual",
        annualROI: 9.2, depreciation: 24000, propertyExpenses: 21000, netProfit: 87000,
        taxStatus: "Taxable - Income Tax", taxId: "TRN-100987654300001", taxNotes: "Commercial unit, quarterly filing.",
    },
];

const fullLabel = (r) => r.propertyName || r.propertyId || `Record #${r.id}`;

const currency = (n) => {
    if (n === "" || n === null || n === undefined || isNaN(n)) return "—";
    return new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(n);
};

const roiTagClass = (roi) => {
    const v = parseFloat(roi);
    if (isNaN(v)) return "";
    if (v >= 8) return "fi-tag-good";
    if (v >= 5) return "fi-tag-mid";
    return "fi-tag-low";
};

const FinancialInformation = () => {
    // ── List state ──
    const [records, setRecords] = useState(SEED_RECORDS);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterTaxStatus, setFilterTaxStatus] = useState("");
    const [filterROIMin, setFilterROIMin] = useState("");

    // ── Form state ──
    const [form, setForm] = useState(INITIAL_FORM);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const isEditing = form.id !== null;

    const filteredRecords = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        let base = !term
            ? records
            : records.filter((r) =>
                [r.propertyName, r.propertyId, r.financialId, r.taxId]
                    .filter(Boolean)
                    .some((v) => v.toLowerCase().includes(term))
            );
        if (filterTaxStatus) base = base.filter((r) => r.taxStatus === filterTaxStatus);
        if (filterROIMin) base = base.filter((r) => parseFloat(r.annualROI || 0) >= parseFloat(filterROIMin));
        return base;
    }, [records, searchTerm, filterTaxStatus, filterROIMin]);

    const activeFilterCount = [filterTaxStatus, filterROIMin].filter(Boolean).length;

    // ── Derived KPIs for the form (auto-calculated, editable) ──
    const computedNetProfit = useMemo(() => {
        const income = parseFloat(form.expectedRentalIncome) || 0;
        const expenses = parseFloat(form.propertyExpenses) || 0;
        const dep = parseFloat(form.depreciation) || 0;
        return income - expenses - dep;
    }, [form.expectedRentalIncome, form.propertyExpenses, form.depreciation]);

    const computedROI = useMemo(() => {
        const cost = parseFloat(form.purchaseCost) || 0;
        if (!cost) return null;
        return ((computedNetProfit / cost) * 100).toFixed(1);
    }, [computedNetProfit, form.purchaseCost]);

    // ── Handlers ──
    const handleChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const applyComputed = () => {
        setForm((prev) => ({
            ...prev,
            netProfit: computedNetProfit ? String(computedNetProfit) : prev.netProfit,
            annualROI: computedROI ?? prev.annualROI,
        }));
    };

    const openCreate = () => {
        setForm(INITIAL_FORM);
        setShowForm(true);
    };

    const openEdit = (record) => {
        setForm(record);
        setShowForm(true);
    };

    const backToList = () => {
        setShowForm(false);
        setForm(INITIAL_FORM);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // TODO: wire to real endpoint, e.g.
            // const CompanyID = sessionStorage.getItem("CompanyID");
            // const res = await api.post("/api/InsertUpdatePropertyFinancials", { ...form, CompanyID });
            await new Promise((res) => setTimeout(res, 400));

            if (isEditing) {
                setRecords((prev) => prev.map((r) => (r.id === form.id ? { ...form } : r)));
            } else {
                const newRecord = {
                    ...form,
                    id: Date.now(),
                    financialId: form.financialId || `FIN-${String(records.length + 1).padStart(4, "0")}`,
                };
                setRecords((prev) => [newRecord, ...prev]);
            }
            backToList();
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!isEditing) return;
        setDeleting(true);
        try {
            // TODO: wire to real endpoint, e.g.
            // await api.post("/api/DeletePropertyFinancials", { FinancialId: form.id });
            await new Promise((res) => setTimeout(res, 400));
            setRecords((prev) => prev.filter((r) => r.id !== form.id));
            backToList();
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="fi-root">
            <style>{`
        :root{
          --fi-primary:#10299b;
          --fi-primary-dark:#0b1c6e;
          --fi-primary-mid:#4a5fc1;
          --fi-primary-soft:#eef1fb;
          --fi-primary-tint:#d6ddf5;
          --fi-ink:#1a1f36;
          --fi-muted:#6b7290;
          --fi-green:#1a9e6c;
          --fi-green-soft:#e6f7f0;
          --fi-amber:#c07a00;
          --fi-amber-soft:#fdf3df;
          --fi-red:#dc2626;
          --fi-red-soft:#fdecec;
        }
        .fi-root{
          font-family:"Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
          color:var(--fi-ink);
        }
        .fi-root *{ box-sizing:border-box; }

        /* ---------- List toolbar ---------- */
        .fi-toolbar{
          display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin-bottom:16px;
        }
        .fi-search-wrap{ position:relative; flex:1; min-width:220px; }
        .fi-search-wrap i{
          position:absolute; left:12px; top:50%; transform:translateY(-50%);
          color:var(--fi-primary-mid); font-size:.85rem;
        }
        .fi-search-input{
          width:100%; border:1px solid var(--fi-primary-tint); border-radius:9px;
          padding:9px 12px 9px 34px; font-size:.85rem; background:var(--fi-primary-soft);
          outline:none; transition:border-color .15s ease, background .15s ease;
        }
        .fi-search-input:focus{ border-color:var(--fi-primary); background:#fff; }

        .fi-toolbar-btn{
          display:flex; align-items:center; gap:7px; border-radius:9px; padding:9px 16px;
          font-size:.83rem; font-weight:700; white-space:nowrap; border:1.5px solid var(--fi-primary);
          background:#fff; color:var(--fi-primary); cursor:pointer; transition:all .15s ease; position:relative;
        }
        .fi-toolbar-btn:hover{ background:var(--fi-primary-soft); }
        .fi-toolbar-btn.fi-btn-solid{ background:var(--fi-primary); color:#fff; }
        .fi-toolbar-btn.fi-btn-solid:hover{ background:var(--fi-primary-dark); }
        .fi-filter-badge{
          position:absolute; top:-6px; right:-6px; background:var(--fi-red); color:#fff;
          width:17px; height:17px; border-radius:50%; font-size:9px; font-weight:700;
          display:flex; align-items:center; justify-content:center;
        }

        /* ---------- Table ---------- */
        .fi-table-card{
          background:#fff; border:1px solid var(--fi-primary-tint); border-radius:16px;
          overflow:hidden; box-shadow:0 4px 18px rgba(16,41,155,.06);
        }
        .fi-table{ width:100%; border-collapse:collapse; margin:0; }
        .fi-table thead th{
          background:var(--fi-primary-soft); color:var(--fi-primary-dark); font-size:.7rem;
          font-weight:700; text-transform:uppercase; letter-spacing:.5px; padding:12px 16px;
          text-align:left; border-bottom:2px solid var(--fi-primary-tint); white-space:nowrap;
        }
        .fi-table tbody td{
          padding:12px 16px; font-size:.84rem; border-bottom:1px solid #f0f2fa; vertical-align:middle;
        }
        .fi-table tbody tr{ cursor:pointer; transition:background .15s ease; }
        .fi-table tbody tr:nth-child(even){ background:#f8f9fd; }
        .fi-table tbody tr:hover{ background:var(--fi-primary-soft); }
        .fi-row-name{ font-weight:700; color:var(--fi-ink); }
        .fi-row-sub{ font-size:.74rem; color:var(--fi-muted); margin-top:1px; }
        .fi-num{ font-variant-numeric:tabular-nums; }
        .fi-tag{
          display:inline-block; font-size:.72rem; font-weight:700; padding:3px 10px; border-radius:999px;
          background:var(--fi-primary-soft); color:var(--fi-primary-mid);
        }
        .fi-tag-good{ background:var(--fi-green-soft); color:var(--fi-green); }
        .fi-tag-mid{ background:var(--fi-amber-soft); color:var(--fi-amber); }
        .fi-tag-low{ background:var(--fi-red-soft); color:var(--fi-red); }
        .fi-empty{ text-align:center; padding:48px 20px; color:var(--fi-muted); }
        .fi-empty i{ font-size:1.9rem; color:var(--fi-primary-tint); margin-bottom:8px; display:block; }
        .fi-empty-title{ font-weight:700; color:var(--fi-primary-dark); font-size:.9rem; }

        /* ---------- Filter modal ---------- */
        .fi-modal-backdrop{
          position:fixed; inset:0; z-index:1050; background:rgba(15,20,50,.5);
          display:flex; align-items:center; justify-content:center; padding:20px;
        }
        .fi-modal-card{
          background:#fff; border-radius:16px; width:100%; max-width:420px;
          box-shadow:0 20px 50px rgba(16,41,155,.25); overflow:hidden;
        }
        .fi-modal-head{
          display:flex; align-items:center; justify-content:space-between; padding:16px 20px;
          background:linear-gradient(135deg, var(--fi-primary) 0%, var(--fi-primary-dark) 100%); color:#fff;
        }
        .fi-modal-head-title{ font-size:.95rem; font-weight:700; margin:0; }
        .fi-modal-close{
          border:none; background:rgba(255,255,255,.15); color:#fff; width:26px; height:26px;
          border-radius:7px; cursor:pointer;
        }
        .fi-modal-body{ padding:18px 20px; display:flex; flex-direction:column; gap:14px; }
        .fi-modal-footer{
          display:flex; justify-content:space-between; gap:10px; padding:14px 20px;
          border-top:1px solid var(--fi-primary-soft);
        }

        /* ---------- Form ---------- */
        .fi-form-header{
          display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;
          gap:12px; flex-wrap:wrap;
        }
        .fi-form-title{ font-size:1.05rem; font-weight:700; color:var(--fi-primary-dark); margin:0; }
        .fi-back-btn{
          display:flex; align-items:center; gap:7px; border:1.5px solid var(--fi-primary); background:#fff;
          color:var(--fi-primary); border-radius:9px; padding:8px 16px; font-size:.83rem; font-weight:700;
          cursor:pointer; transition:all .15s ease;
        }
        .fi-back-btn:hover{ background:var(--fi-primary-soft); }

        /* ---------- KPI summary strip ---------- */
        .fi-kpi-strip{
          display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:12px; margin-bottom:24px;
        }
        .fi-kpi-card{
          background:var(--fi-primary-soft); border:1px solid var(--fi-primary-tint); border-radius:12px;
          padding:14px 16px;
        }
        .fi-kpi-label{
          font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.4px;
          color:var(--fi-primary-mid); margin-bottom:4px;
        }
        .fi-kpi-value{ font-size:1.15rem; font-weight:700; color:var(--fi-primary-dark); }
        .fi-kpi-card.fi-kpi-accent{ background:var(--fi-green-soft); border-color:#bfe9d6; }
        .fi-kpi-card.fi-kpi-accent .fi-kpi-value{ color:var(--fi-green); }
        .fi-kpi-card.fi-kpi-accent .fi-kpi-label{ color:#178a5f; }

        .fi-section{ margin-bottom:26px; }
        .fi-section-head{
          display:flex; align-items:center; gap:10px; margin-bottom:16px; padding-bottom:12px;
          border-bottom:1px solid var(--fi-primary-tint);
        }
        .fi-section-icon{
          width:34px; height:34px; border-radius:9px; background:var(--fi-primary-soft); color:var(--fi-primary);
          display:flex; align-items:center; justify-content:center; font-size:.95rem; flex-shrink:0;
        }
        .fi-section-title{ font-size:.95rem; font-weight:700; color:var(--fi-primary-dark); margin:0; }
        .fi-section-sub{ font-size:.76rem; color:var(--fi-muted); margin-top:1px; }
        .fi-section-action{
          margin-left:auto; display:flex; align-items:center; gap:6px; border:1.5px solid var(--fi-primary);
          background:#fff; color:var(--fi-primary); border-radius:8px; padding:6px 12px; font-size:.76rem;
          font-weight:700; cursor:pointer; white-space:nowrap; transition:all .15s ease;
        }
        .fi-section-action:hover{ background:var(--fi-primary-soft); }

        .fi-grid{
          display:grid; grid-template-columns:repeat(auto-fill, minmax(230px, 1fr)); gap:16px 18px;
        }
        .fi-field label{
          display:block; font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.4px;
          color:var(--fi-primary-mid); margin-bottom:6px;
        }
        .fi-field-wide{ grid-column:1 / -1; }
        .fi-input-wrap{ position:relative; }
        .fi-input-prefix{
          position:absolute; left:12px; top:50%; transform:translateY(-50%);
          font-size:.8rem; color:var(--fi-muted); font-weight:600; pointer-events:none;
        }
        .fi-input-suffix{
          position:absolute; right:12px; top:50%; transform:translateY(-50%);
          font-size:.8rem; color:var(--fi-muted); font-weight:600; pointer-events:none;
        }
        .fi-input.fi-has-prefix{ padding-left:38px; }
        .fi-input.fi-has-suffix{ padding-right:34px; }
        .fi-input, .fi-select, textarea.fi-input{
          width:100%; border:1px solid var(--fi-primary-tint); border-radius:9px; padding:9px 12px;
          font-size:.85rem; color:var(--fi-ink); background:#fff; outline:none;
          transition:border-color .15s ease, box-shadow .15s ease; font-family:inherit;
        }
        .fi-input:focus, .fi-select:focus{
          border-color:var(--fi-primary); box-shadow:0 0 0 3px rgba(16,41,155,.12);
        }
        .fi-input:disabled{ background:var(--fi-primary-soft); color:var(--fi-muted); cursor:not-allowed; }
        .fi-hint{ font-size:.7rem; color:var(--fi-muted); margin-top:4px; }

        .fi-footer{
          display:flex; align-items:center; gap:10px; padding-top:18px; border-top:1px solid var(--fi-primary-tint);
          flex-wrap:wrap;
        }
        .fi-btn{ border:none; border-radius:10px; padding:10px 20px; font-size:.85rem; font-weight:700; transition:all .15s ease; cursor:pointer; }
        .fi-btn-primary{ background:var(--fi-primary); color:#fff; }
        .fi-btn-primary:hover:not(:disabled){ background:var(--fi-primary-dark); box-shadow:0 4px 10px rgba(16,41,155,.25); }
        .fi-btn-primary:disabled{ opacity:.6; cursor:default; }
        .fi-btn-ghost{ background:var(--fi-primary-soft); color:var(--fi-primary); }
        .fi-btn-ghost:hover{ background:var(--fi-primary-tint); }
        .fi-btn-danger{ background:#fff; color:var(--fi-red); border:1.5px solid #f5b8b8; }
        .fi-btn-danger:hover:not(:disabled){ background:var(--fi-red-soft); }
        .fi-btn-danger:disabled{ opacity:.6; cursor:default; }
      `}</style>

            {!showForm ? (
                <>
                    {/* Toolbar: search + filter + create */}
                    <div className="fi-toolbar">
                        <div className="fi-search-wrap">
                            <i className="bi bi-search"></i>
                            <input
                                type="text"
                                className="fi-search-input"
                                placeholder="Search property, financial ID, tax ID…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button type="button" className="fi-toolbar-btn" onClick={() => setIsFilterOpen(true)}>
                            <i className="bi bi-funnel"></i> Filters
                            {activeFilterCount > 0 && <span className="fi-filter-badge">{activeFilterCount}</span>}
                        </button>
                        <button type="button" className="fi-toolbar-btn fi-btn-solid" onClick={openCreate}>
                            <i className="bi bi-plus-lg"></i> Add Financial Record
                        </button>
                    </div>

                    {/* Table */}
                    <div className="fi-table-card">
                        <div className="table-responsive" style={{ maxHeight: "60vh" }}>
                            <table className="fi-table">
                                <thead>
                                    <tr>
                                        <th>Financial ID</th>
                                        <th>Property</th>
                                        <th>Purchase Cost</th>
                                        <th>Current Valuation</th>
                                        <th>Annual ROI</th>
                                        <th>Net Profit</th>
                                        <th>Tax Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecords.length === 0 && (
                                        <tr>
                                            <td colSpan={7}>
                                                <div className="fi-empty">
                                                    <i className="bi bi-cash-coin"></i>
                                                    <div className="fi-empty-title">No financial records found</div>
                                                    <div>Try adjusting your search or filters, or add a new record.</div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {filteredRecords.map((r) => (
                                        <tr key={r.id} onClick={() => openEdit(r)}>
                                            <td className="fi-row-sub">{r.financialId}</td>
                                            <td>
                                                <div className="fi-row-name">{fullLabel(r)}</div>
                                                <div className="fi-row-sub">{r.propertyId}</div>
                                            </td>
                                            <td className="fi-num">{currency(r.purchaseCost)}</td>
                                            <td className="fi-num">{currency(r.currentValuation)}</td>
                                            <td>
                                                <span className={`fi-tag ${roiTagClass(r.annualROI)}`}>
                                                    {r.annualROI !== "" && r.annualROI !== null ? `${r.annualROI}%` : "—"}
                                                </span>
                                            </td>
                                            <td className="fi-num">{currency(r.netProfit)}</td>
                                            <td>
                                                <span className="fi-tag">{r.taxStatus || "—"}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Filter modal */}
                    {isFilterOpen && (
                        <div className="fi-modal-backdrop" onClick={() => setIsFilterOpen(false)}>
                            <div className="fi-modal-card" onClick={(e) => e.stopPropagation()}>
                                <div className="fi-modal-head">
                                    <p className="fi-modal-head-title">Filter Financial Records</p>
                                    <button className="fi-modal-close" onClick={() => setIsFilterOpen(false)}>
                                        <i className="bi bi-x-lg"></i>
                                    </button>
                                </div>
                                <div className="fi-modal-body">
                                    <div className="fi-field">
                                        <label>Tax Status</label>
                                        <select className="fi-select" value={filterTaxStatus} onChange={(e) => setFilterTaxStatus(e.target.value)}>
                                            <option value="">All statuses</option>
                                            {TAX_STATUSES.map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="fi-field">
                                        <label>Minimum Annual ROI (%)</label>
                                        <input
                                            type="number"
                                            className="fi-input"
                                            value={filterROIMin}
                                            onChange={(e) => setFilterROIMin(e.target.value)}
                                            placeholder="e.g. 5"
                                        />
                                    </div>
                                </div>
                                <div className="fi-modal-footer">
                                    <button
                                        type="button"
                                        className="fi-btn fi-btn-ghost"
                                        onClick={() => { setFilterTaxStatus(""); setFilterROIMin(""); }}
                                    >
                                        Clear All
                                    </button>
                                    <button type="button" className="fi-btn fi-btn-primary" onClick={() => setIsFilterOpen(false)}>
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
                    <div className="fi-form-header">
                        <p className="fi-form-title">{isEditing ? "Edit Financial Record" : "New Financial Record"}</p>
                        <button type="button" className="fi-back-btn" onClick={backToList}>
                            <i className="bi bi-arrow-left"></i> Back to List
                        </button>
                    </div>

                    {/* KPI summary strip */}
                    <div className="fi-kpi-strip">
                        <div className="fi-kpi-card">
                            <div className="fi-kpi-label">Current Valuation</div>
                            <div className="fi-kpi-value">{currency(form.currentValuation)}</div>
                        </div>
                        <div className="fi-kpi-card">
                            <div className="fi-kpi-label">Total Invested</div>
                            <div className="fi-kpi-value">
                                {currency((parseFloat(form.purchaseCost) || 0) + (parseFloat(form.renovationCost) || 0) + (parseFloat(form.interiorCost) || 0))}
                            </div>
                        </div>
                        <div className="fi-kpi-card fi-kpi-accent">
                            <div className="fi-kpi-label">Net Profit (est.)</div>
                            <div className="fi-kpi-value">{currency(computedNetProfit)}</div>
                        </div>
                        <div className="fi-kpi-card fi-kpi-accent">
                            <div className="fi-kpi-label">Annual ROI (est.)</div>
                            <div className="fi-kpi-value">{computedROI !== null ? `${computedROI}%` : "—"}</div>
                        </div>
                    </div>

                    <form onSubmit={handleSave}>
                        <div className="fi-section">
                            <div className="fi-section-head">
                                <div className="fi-section-icon">
                                    <i className="bi bi-link-45deg"></i>
                                </div>
                                <div>
                                    <p className="fi-section-title">Linked Property</p>
                                    <div className="fi-section-sub">Which property this financial record belongs to</div>
                                </div>
                            </div>

                            <div className="fi-grid">
                                <div className="fi-field">
                                    <label>Financial ID</label>
                                    <input type="text" className="fi-input" value={form.financialId} disabled placeholder="Auto-generated" />
                                    <div className="fi-hint">Assigned automatically on save</div>
                                </div>

                                <div className="fi-field">
                                    <label>Property ID</label>
                                    <input type="text" className="fi-input" value={form.propertyId} onChange={handleChange("propertyId")} placeholder="e.g. PRP-0001" />
                                </div>

                                <div className="fi-field fi-field-wide">
                                    <label>Property Name</label>
                                    <input type="text" className="fi-input" value={form.propertyName} onChange={handleChange("propertyName")} placeholder="e.g. Marina Heights - 204" />
                                </div>
                            </div>
                        </div>

                        <div className="fi-section">
                            <div className="fi-section-head">
                                <div className="fi-section-icon">
                                    <i className="bi bi-cash-stack"></i>
                                </div>
                                <div>
                                    <p className="fi-section-title">Acquisition & Valuation</p>
                                    <div className="fi-section-sub">What the property cost, and what it's worth today</div>
                                </div>
                            </div>

                            <div className="fi-grid">
                                <div className="fi-field">
                                    <label>Purchase Cost</label>
                                    <div className="fi-input-wrap">
                                        <span className="fi-input-prefix">AED</span>
                                        <input type="number" className="fi-input fi-has-prefix" value={form.purchaseCost} onChange={handleChange("purchaseCost")} placeholder="0" />
                                    </div>
                                </div>

                                <div className="fi-field">
                                    <label>Purchase Date</label>
                                    <input type="date" className="fi-input" value={form.purchaseDate} onChange={handleChange("purchaseDate")} />
                                </div>

                                <div className="fi-field">
                                    <label>Renovation Cost</label>
                                    <div className="fi-input-wrap">
                                        <span className="fi-input-prefix">AED</span>
                                        <input type="number" className="fi-input fi-has-prefix" value={form.renovationCost} onChange={handleChange("renovationCost")} placeholder="0" />
                                    </div>
                                </div>

                                <div className="fi-field">
                                    <label>Interior Cost</label>
                                    <div className="fi-input-wrap">
                                        <span className="fi-input-prefix">AED</span>
                                        <input type="number" className="fi-input fi-has-prefix" value={form.interiorCost} onChange={handleChange("interiorCost")} placeholder="0" />
                                    </div>
                                </div>

                                <div className="fi-field">
                                    <label>Current Valuation</label>
                                    <div className="fi-input-wrap">
                                        <span className="fi-input-prefix">AED</span>
                                        <input type="number" className="fi-input fi-has-prefix" value={form.currentValuation} onChange={handleChange("currentValuation")} placeholder="0" />
                                    </div>
                                </div>

                                <div className="fi-field">
                                    <label>Valuation Date</label>
                                    <input type="date" className="fi-input" value={form.valuationDate} onChange={handleChange("valuationDate")} />
                                </div>
                            </div>
                        </div>

                        <div className="fi-section">
                            <div className="fi-section-head">
                                <div className="fi-section-icon">
                                    <i className="bi bi-graph-up-arrow"></i>
                                </div>
                                <div>
                                    <p className="fi-section-title">Income & Returns</p>
                                    <div className="fi-section-sub">Rental performance, expenses, and profitability</div>
                                </div>
                                <button type="button" className="fi-section-action" onClick={applyComputed}>
                                    <i className="bi bi-magic"></i> Auto-calculate
                                </button>
                            </div>

                            <div className="fi-grid">
                                <div className="fi-field">
                                    <label>Expected Rental Income</label>
                                    <div className="fi-input-wrap">
                                        <span className="fi-input-prefix">AED</span>
                                        <input type="number" className="fi-input fi-has-prefix" value={form.expectedRentalIncome} onChange={handleChange("expectedRentalIncome")} placeholder="0" />
                                    </div>
                                </div>

                                <div className="fi-field">
                                    <label>Rental Frequency</label>
                                    <select className="fi-select" value={form.rentalFrequency} onChange={handleChange("rentalFrequency")}>
                                        <option value="Annual">Annual</option>
                                        <option value="Monthly">Monthly</option>
                                    </select>
                                </div>

                                <div className="fi-field">
                                    <label>Annual ROI</label>
                                    <div className="fi-input-wrap">
                                        <input type="number" step="0.1" className="fi-input fi-has-suffix" value={form.annualROI} onChange={handleChange("annualROI")} placeholder="0.0" />
                                        <span className="fi-input-suffix">%</span>
                                    </div>
                                    <div className="fi-hint">Suggested: {computedROI !== null ? `${computedROI}%` : "—"}</div>
                                </div>

                                <div className="fi-field">
                                    <label>Depreciation</label>
                                    <div className="fi-input-wrap">
                                        <span className="fi-input-prefix">AED</span>
                                        <input type="number" className="fi-input fi-has-prefix" value={form.depreciation} onChange={handleChange("depreciation")} placeholder="0" />
                                    </div>
                                </div>

                                <div className="fi-field">
                                    <label>Property Expenses</label>
                                    <div className="fi-input-wrap">
                                        <span className="fi-input-prefix">AED</span>
                                        <input type="number" className="fi-input fi-has-prefix" value={form.propertyExpenses} onChange={handleChange("propertyExpenses")} placeholder="0" />
                                    </div>
                                    <div className="fi-hint">Service charges, maintenance, insurance, management fees</div>
                                </div>

                                <div className="fi-field">
                                    <label>Net Profit</label>
                                    <div className="fi-input-wrap">
                                        <span className="fi-input-prefix">AED</span>
                                        <input type="number" className="fi-input fi-has-prefix" value={form.netProfit} onChange={handleChange("netProfit")} placeholder="0" />
                                    </div>
                                    <div className="fi-hint">Suggested: {currency(computedNetProfit)}</div>
                                </div>
                            </div>
                        </div>

                        <div className="fi-section">
                            <div className="fi-section-head">
                                <div className="fi-section-icon">
                                    <i className="bi bi-receipt"></i>
                                </div>
                                <div>
                                    <p className="fi-section-title">Tax Information</p>
                                    <div className="fi-section-sub">Applicable tax status and reference details</div>
                                </div>
                            </div>

                            <div className="fi-grid">
                                <div className="fi-field">
                                    <label>Tax Status</label>
                                    <select className="fi-select" value={form.taxStatus} onChange={handleChange("taxStatus")}>
                                        <option value="">Select tax status</option>
                                        {TAX_STATUSES.map((t) => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="fi-field">
                                    <label>Tax Registration No.</label>
                                    <input type="text" className="fi-input" value={form.taxId} onChange={handleChange("taxId")} placeholder="e.g. TRN-100234567800003" />
                                </div>

                                <div className="fi-field fi-field-wide">
                                    <label>Tax Notes</label>
                                    <textarea className="fi-input" rows={3} value={form.taxNotes} onChange={handleChange("taxNotes")} placeholder="Any additional tax context, exemptions, or filing notes…" />
                                </div>
                            </div>
                        </div>

                        <div className="fi-footer">
                            <button type="submit" className="fi-btn fi-btn-primary" disabled={saving}>
                                <i className={`bi ${saving ? "bi-hourglass-split" : "bi-check2-circle"} me-2`}></i>
                                {saving ? "Saving…" : isEditing ? "Update Record" : "Save Record"}
                            </button>
                            {isEditing && (
                                <button type="button" className="fi-btn fi-btn-danger" onClick={handleDelete} disabled={deleting}>
                                    <i className={`bi ${deleting ? "bi-hourglass-split" : "bi-trash3"} me-2`}></i>
                                    {deleting ? "Deleting…" : "Delete"}
                                </button>
                            )}
                            <button type="button" className="fi-btn fi-btn-ghost" onClick={backToList} disabled={saving || deleting}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
};

export default FinancialInformation;