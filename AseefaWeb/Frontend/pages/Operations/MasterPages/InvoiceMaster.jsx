import React, { useState, useEffect } from "react";
import api from "../../apiService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaFileInvoice, FaSearch, FaPlus, FaSave, FaEdit,
  FaTrashAlt, FaEraser, FaArrowLeft, FaChevronDown,
  FaChevronRight, FaTag, FaCalendarAlt, FaLayerGroup
} from "react-icons/fa";

const primaryColor = "rgb(45, 75, 169)";

const outlineBtn = {
  borderRadius: "5px", fontWeight: "500",
  background: "transparent", border: `2px solid ${primaryColor}`,
  color: primaryColor, padding: "10px 20px", fontSize: "14px", minWidth: "120px",
};

const INV_TYPES = ["B2C", "B2B", "RT", "ES"];

const INV_TYPE_LABELS = {
  B2C: "B2C - Business to Customer",
  B2B: "B2B - Business to Business",
  RT:  "RT - Sale Return",
  ES:  "ES - Sale Order",
};

const BLANK_FORM = {
  SID:       0,
  Series:    "",
  FYearID:   "",
  InvType:   "",
  CompanyID: "",
  CBY:       "",
};

function InvoiceSeriesMaster() {
  const [loading,        setLoading]        = useState(false);
  const [showForm,       setShowForm]       = useState(false);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [expandedTypes,  setExpandedTypes]  = useState({});

  const [form,           setForm]           = useState(BLANK_FORM);
  const [seriesData,     setSeriesData]     = useState([]);

  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);
  const [isDeleteDisabled, setIsDeleteDisabled] = useState(true);

  const [loadingSubmit,  setLoadingSubmit]  = useState(false);
  const [loadingUpdate,  setLoadingUpdate]  = useState(false);
  const [loadingDelete,  setLoadingDelete]  = useState(false);

  const getCompanyID  = () => sessionStorage.getItem("CompanyID");
  const getUserId     = () => sessionStorage.getItem("UserId");
  const getBranchId   = () => sessionStorage.getItem("BranchId") || sessionStorage.getItem("Branchid") || sessionStorage.getItem("branchid") || 0;

  // ── Get FYearID from session (financialResponse stored by Navbar) ─────────
  const getFYearID = () => {
    try {
      const financial = JSON.parse(sessionStorage.getItem("financialResponse") || "null");
      return financial?.FYearID || financial?.FyearId || financial?.fyearid || 0;
    } catch {
      return 0;
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ────────────────────────────────────────────────────────────────────────
  // GET /api/getinvoiceseries
  // ────────────────────────────────────────────────────────────────────────
  const fetchAll = async () => {
    try {
      setLoading(true);
      const res  = await api.get("/api/webgetinvoiceseries");
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setSeriesData(data);
    } catch {
      toast.error("Failed to fetch invoice series");
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  // Group series by InvType for tree display
  // ────────────────────────────────────────────────────────────────────────
  const grouped = seriesData
    .filter(r =>
      !searchQuery ||
      r.Series?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.InvType?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .reduce((acc, item) => {
      const type = item.InvType || "OTHER";
      if (!acc[type]) acc[type] = [];
      acc[type].push(item);
      return acc;
    }, {});

  const toggleType = (type) =>
    setExpandedTypes(prev => ({ ...prev, [type]: !prev[type] }));

  // ────────────────────────────────────────────────────────────────────────
  // ROW CLICK
  // ────────────────────────────────────────────────────────────────────────
  const handleRowClick = (item) => {
    setForm({
      SID:       item.SID       || 0,
      Series:    item.Series    || "",
      FYearID:   item.FYearID   || getFYearID(),
      InvType:   item.InvType   || "",
      CompanyID: item.CompanyID || getCompanyID() || "",
      CBY:       item.CBY       || getUserId()    || "",
    });
    setIsSubmitDisabled(true);
    setIsUpdateDisabled(false);
    setIsDeleteDisabled(false);
    setShowForm(true);
  };

  // ────────────────────────────────────────────────────────────────────────
  // CLEAR
  // ────────────────────────────────────────────────────────────────────────
  const handleClear = () => {
    setForm(BLANK_FORM);
    setIsSubmitDisabled(false);
    setIsUpdateDisabled(true);
    setIsDeleteDisabled(true);
    toast.dismiss();
  };

  const handleCreateNew  = () => { handleClear(); setShowForm(true); };
  const handleBackToList = () => { setShowForm(false); handleClear(); };

  // ────────────────────────────────────────────────────────────────────────
  // VALIDATE — FYearID not shown to user, no longer required from input
  // ────────────────────────────────────────────────────────────────────────
  const validate = () => {
    if (!form.Series?.trim()) { toast.error("Series is required.");       return false; }
    if (!form.InvType)        { toast.error("Invoice Type is required."); return false; }
    return true;
  };

  // ────────────────────────────────────────────────────────────────────────
  // POST /api/insertupdateinvoiceseries — SID=0 → INSERT
  // ────────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      SID:       0,
      Series:    form.Series.trim(),
      FYearID:   parseInt(getFYearID()) || 0,   // ✅ auto from session
      CompanyID: parseInt(getCompanyID()) || 0,
      InvType:   form.InvType,
      CBY:       parseInt(getUserId())    || 0,
      Branchid:  parseInt(getBranchId())  || 0,
    };

    try {
      setLoadingSubmit(true);
      await api.post("/api/insertupdateinvoiceseries", payload);
      toast.success("Invoice series added successfully!");
      fetchAll();
      handleClear();
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add invoice series.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  // POST /api/insertupdateinvoiceseries — SID>0 → UPDATE
  // ────────────────────────────────────────────────────────────────────────
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!form.SID || form.SID === 0) {
      toast.error("No record selected. Please click a series from the list.");
      return;
    }

    const payload = {
      SID:       parseInt(form.SID),
      Series:    form.Series.trim(),
      FYearID:   parseInt(form.FYearID || getFYearID()) || 0,  // ✅ from row or session
      CompanyID: parseInt(getCompanyID()) || 0,
      InvType:   form.InvType,
      CBY:       parseInt(getUserId())    || 0,
      Branchid:  parseInt(getBranchId())  || 0,
    };

    try {
      setLoadingUpdate(true);
      await api.post("/api/insertupdateinvoiceseries", payload);
      toast.success("Invoice series updated successfully!");
      fetchAll();
      handleClear();
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update invoice series.");
    } finally {
      setLoadingUpdate(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  // DELETE /api/deleteinvoiceseries/:SID
  // ────────────────────────────────────────────────────────────────────────
  const confirmDeleteToast = () =>
    new Promise((resolve) => {
      const toastId = toast.warning(
        ({ closeToast }) => (
          <div>
            <div className="mb-2">Are you sure you want to delete this series?</div>
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-danger btn-sm"
                onClick={() => { toast.dismiss(toastId); resolve(true); }}>Yes</button>
              <button className="btn btn-secondary btn-sm"
                onClick={() => { toast.dismiss(toastId); resolve(false); }}>Cancel</button>
            </div>
          </div>
        ),
        { position: "top-center", autoClose: false, closeOnClick: false,
          draggable: false, closeButton: false, toastId: "confirm-delete" }
      );
    });

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!form.SID || form.SID === 0) {
      toast.error("No record selected.");
      return;
    }
    const confirmed = await confirmDeleteToast();
    if (!confirmed) return;

    try {
      setLoadingDelete(true);
      await api.delete(`/api/deleteinvoiceseries/${form.SID}`);
      toast.success("Invoice series deleted successfully!");
      fetchAll();
      handleClear();
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete invoice series.");
    } finally {
      setLoadingDelete(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="page-wrapper" style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <div className="page-body mt-1">
        <div className="container-fluid px-4">
          <ToastContainer position="top-center" autoClose={3000} />

          {!showForm ? (
            /* ══════════════ LIST VIEW ══════════════ */
            <>
              {/* Header card */}
              <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "12px", overflow: "hidden" }}>
                <div className="card-body p-4">
                  <h2 className="mb-3" style={{ fontWeight: "600", color: "#2d3748", fontSize: "28px" }}>
                    <FaFileInvoice className="me-2" style={{ color: primaryColor }} />
                    Invoice Series Master
                  </h2>
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div style={{ maxWidth: "700px", flex: 1 }}>
                      <div className="input-group" style={{ height: "45px" }}>
                        <span className="input-group-text text-white" style={{ backgroundColor: primaryColor }}>
                          <FaSearch />
                        </span>
                        <input
                          type="text"
                          className="form-control border-start-0"
                          placeholder="Search series..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          style={{ backgroundColor: "#fff", borderColor: "#e2e8f0", height: "45px", fontSize: "14px" }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn d-flex align-items-center gap-2"
                      onClick={handleCreateNew}
                      style={{ borderRadius: "5px", padding: "8px 20px", background: primaryColor, border: "none", color: "white", height: "45px", whiteSpace: "nowrap" }}
                    >
                      <FaPlus /> Create New
                    </button>
                  </div>
                </div>
              </div>

              {/* Tree list card */}
              <div className="card border-0 shadow-sm" style={{ borderRadius: "12px", overflow: "hidden" }}>
                <div className="card-body p-0">
                  {loading ? (
                    <div className="text-center p-5">
                      <div className="spinner-border" role="status" style={{ color: primaryColor }}>
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-3 text-muted">Loading invoice series...</p>
                    </div>
                  ) : (
                    <div style={{ maxHeight: "600px", overflowY: "auto" }}>
                      <table className="table table-hover mb-0">
                        <thead className="bg-light" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                          <tr>
                            <th className="py-3 px-4" style={{ color: "#4a5568", fontWeight: "600", fontSize: "14px" }}>Invoice Type / Series</th>
                            {/* Financial Year column hidden */}
                            <th className="py-3" style={{ color: "#4a5568", fontWeight: "600", fontSize: "14px" }}>Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(grouped).length > 0 ? (
                            Object.keys(grouped).sort().map(type => (
                              <React.Fragment key={type}>
                                {/* ── InvType group header row ── */}
                                <tr
                                  onClick={() => toggleType(type)}
                                  style={{ cursor: "pointer", backgroundColor: "#eef2ff", borderLeft: `4px solid ${primaryColor}` }}
                                >
                                  <td className="py-3 px-4 fw-semibold" colSpan={3}
                                    style={{ color: primaryColor, fontSize: "14px" }}>
                                    <span className="me-2">
                                      {expandedTypes[type]
                                        ? <FaChevronDown style={{ fontSize: "11px" }} />
                                        : <FaChevronRight style={{ fontSize: "11px" }} />}
                                    </span>
                                    <FaLayerGroup className="me-2" />
                                    {INV_TYPE_LABELS[type] || type}
                                    <span className="badge ms-2 rounded-pill"
                                      style={{ background: primaryColor, fontSize: "11px" }}>
                                      {grouped[type].length}
                                    </span>
                                  </td>
                                </tr>

                                {/* ── Series rows under each type ── */}
                                {expandedTypes[type] && grouped[type].map(item => (
                                  <tr
                                    key={item.SID}
                                    onClick={() => handleRowClick(item)}
                                    style={{
                                      cursor: "pointer",
                                      borderLeft: form.SID === item.SID
                                        ? `4px solid ${primaryColor}`
                                        : "4px solid transparent",
                                    }}
                                    className={`align-middle ${form.SID === item.SID ? "table-active" : ""}`}
                                  >
                                    <td className="py-2 px-4">
                                      <div className="d-flex align-items-center" style={{ paddingLeft: "24px" }}>
                                        <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3"
                                          style={{ width: "32px", height: "32px", minWidth: "32px" }}>
                                          <FaTag style={{ color: primaryColor, fontSize: "13px" }} />
                                        </div>
                                        <span className="fw-medium" style={{ fontSize: "14px" }}>{item.Series}</span>
                                      </div>
                                    </td>
                                    {/* Financial Year cell hidden */}
                                    <td className="py-2">
                                      <span className="badge rounded-pill px-3 py-1"
                                        style={{
                                          background: item.InvType === "B2C" ? "#ebf8ff"
                                            : item.InvType === "B2B" ? "#f0fff4"
                                            : item.InvType === "RT"  ? "#fff5f5"
                                            : "#faf5ff",
                                          color: item.InvType === "B2C" ? "#3182ce"
                                            : item.InvType === "B2B" ? "#38a169"
                                            : item.InvType === "RT"  ? "#e53e3e"
                                            : "#805ad5",
                                          fontSize: "12px", fontWeight: "600",
                                        }}>
                                        {INV_TYPE_LABELS[item.InvType] || item.InvType}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} className="text-center p-5">
                                <FaFileInvoice className="mb-3" style={{ fontSize: "48px", color: "#cbd5e0" }} />
                                <p className="text-muted mb-3">
                                  {seriesData.length === 0 ? "No invoice series found" : "No matching series found"}
                                </p>
                                <button className="btn" onClick={handleCreateNew}
                                  style={{ borderRadius: "5px", padding: "10px 24px", background: primaryColor, border: "none", color: "white", fontSize: "14px" }}>
                                  <FaPlus className="me-2" />Create New Series
                                </button>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* ══════════════ FORM VIEW ══════════════ */
            <div className="card border-0 shadow-sm" style={{ borderRadius: "12px", overflow: "hidden" }}>

              {/* Form header */}
              <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-0"
                style={{ borderBottom: "1px solid #e2e8f0" }}>
                <h4 className="m-0" style={{ color: "#2d3748", fontWeight: "600", fontSize: "18px" }}>
                  <FaFileInvoice className="me-2" style={{ color: primaryColor }} />
                  {form.SID ? "Edit Invoice Series" : "New Invoice Series"}
                </h4>
                <button
                  className="btn d-flex align-items-center gap-2"
                  onClick={handleBackToList}
                  style={{ borderRadius: "5px", padding: "8px 16px", fontSize: "14px", background: "transparent", border: `2px solid ${primaryColor}`, color: primaryColor }}
                >
                  <FaArrowLeft /> Back to List
                </button>
              </div>

              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="row g-4">

                    {/* Left card: Series Info */}
                    <div className="col-md-6">
                      <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: "10px" }}>
                        <div className="card-header bg-white"
                          style={{ borderBottom: "1px solid #e2e8f0", fontWeight: "600", color: primaryColor }}>
                          <FaFileInvoice className="me-2" />Series Information
                        </div>
                        <div className="card-body p-3">

                          {/* Invoice Type */}
                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">
                              Invoice Type <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                              <span className="input-group-text text-white" style={{ backgroundColor: primaryColor }}>
                                <FaLayerGroup />
                              </span>
                              <select
                                className="form-select"
                                value={form.InvType}
                                onChange={e => setForm(prev => ({ ...prev, InvType: e.target.value }))}
                              >
                                <option value="">-- Select Invoice Type --</option>
                                {INV_TYPES.map(t => (
                                  <option key={t} value={t}>{INV_TYPE_LABELS[t] || t}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Series */}
                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">
                              Invoice Series <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                              <span className="input-group-text text-white" style={{ backgroundColor: primaryColor }}>
                                <FaTag />
                              </span>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="e.g. B2C/A/25-26/"
                                value={form.Series}
                                onChange={e => setForm(prev => ({ ...prev, Series: e.target.value }))}
                              />
                            </div>
                          </div>

                          {/* FYearID — hidden, auto from session */}
                          <input type="hidden" value={form.FYearID || getFYearID()} readOnly />

                        </div>
                      </div>
                    </div>

                    {/* Right card: Preview */}
                    <div className="col-md-6">
                      <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: "10px" }}>
                        <div className="card-header bg-white"
                          style={{ borderBottom: "1px solid #e2e8f0", fontWeight: "600", color: primaryColor }}>
                          <FaFileInvoice className="me-2" />Preview
                        </div>
                        <div className="card-body p-3 d-flex align-items-center justify-content-center">
                          <div className="text-center">
                            <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                              style={{ width: "80px", height: "80px", background: `${primaryColor}15` }}>
                              <FaFileInvoice style={{ fontSize: "36px", color: primaryColor }} />
                            </div>
                            {form.InvType && (
                              <span className="badge rounded-pill px-3 py-2 mb-2 d-block"
                                style={{ background: primaryColor, fontSize: "13px" }}>
                                {INV_TYPE_LABELS[form.InvType] || form.InvType}
                              </span>
                            )}
                            <h5 className="fw-bold mb-1" style={{ color: "#2d3748" }}>
                              {form.Series || "—"}
                            </h5>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Action Buttons */}
                  <div className="row mt-4">
                    <div className="col-12">
                      <div className="d-flex justify-content-center flex-wrap gap-3">

                        <button type="submit" className="btn px-4 d-flex align-items-center gap-2"
                          style={outlineBtn} disabled={isSubmitDisabled || loadingSubmit}>
                          {loadingSubmit
                            ? <><span className="spinner-border spinner-border-sm" /> Submitting...</>
                            : <><FaSave /> Submit</>}
                        </button>

                        <button type="button" className="btn px-4 d-flex align-items-center gap-2"
                          style={outlineBtn} disabled={isUpdateDisabled || loadingUpdate} onClick={handleUpdate}>
                          {loadingUpdate
                            ? <><span className="spinner-border spinner-border-sm" /> Updating...</>
                            : <><FaEdit /> Update</>}
                        </button>

                        <button type="button" className="btn px-4 d-flex align-items-center gap-2"
                          style={outlineBtn} disabled={isDeleteDisabled || loadingDelete} onClick={handleDelete}>
                          {loadingDelete
                            ? <><span className="spinner-border spinner-border-sm" /> Deleting...</>
                            : <><FaTrashAlt /> Delete</>}
                        </button>

                        <button type="button" className="btn px-4 d-flex align-items-center gap-2"
                          style={outlineBtn} onClick={handleClear}>
                          <FaEraser /> Clear
                        </button>

                      </div>
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

export default InvoiceSeriesMaster;