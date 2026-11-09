import { useState, useEffect } from "react";
import api from "../../apiService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ── Static helpers ────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split("T")[0];

const BLANK_FORM = {
  AlocId:           0,
  EmployeeId:       "",
  salesRep:         "",
  VehicleId:        "",
  VehicleNo:        "",
  B2CSeries:        "",
  B2BSeries:        "",
  SaleReturnSeries: "",
  date:             todayStr(),
};

function EmployeeAllocation() {

  const [allData,     setAllData]     = useState([]);
  const [vehicles,    setVehicles]    = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [employees,   setEmployees]   = useState([]);

  const [b2cOptions,          setB2cOptions]          = useState([]);
  const [b2bOptions,          setB2bOptions]          = useState([]);
  const [returnSeriesOptions, setReturnSeriesOptions] = useState([]);

  const [form,        setForm]        = useState(BLANK_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  const [isSaveEnabled,   setIsSaveEnabled]   = useState(true);
  const [isUpdateEnabled, setIsUpdateEnabled] = useState(false);
  const [isDeleteEnabled, setIsDeleteEnabled] = useState(false);

  const [loadingSave,   setLoadingSave]   = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [confirm,    setConfirm]    = useState(null);

  const getCompanyID = () => sessionStorage.getItem("CompanyID");

  useEffect(() => {
    fetchAll();
    fetchEmployees();
    fetchAllocationSeries();
    fetchVehicles();
  }, []);

  // Refetch series whenever the window gets focus (e.g. user comes back from Invoice Series page)
  useEffect(() => {
    const handleFocus = () => fetchAllocationSeries();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // ────────────────────────────────────────────────────────────────────────
  // GET /api/GetUser
  // ────────────────────────────────────────────────────────────────────────
  const fetchEmployees = async () => {
    try {
      const res = await api.get("/api/GetUser", {
        params: { CompanyID: getCompanyID() },
      });
      setEmployees(res.data);
    } catch {
      toast.error("Failed to fetch employees");
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  // GET /api/getVehicles — all vehicles for dropdown
  // SP: WebGetVehicles
  // ────────────────────────────────────────────────────────────────────────
  const fetchVehicles = async () => {
    try {
      const res  = await api.get("/api/getVehicles");
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setVehicles(data);
    } catch {
      toast.error("Failed to fetch vehicles");
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  // GET /api/getinvoiceseries — B2C, B2B, SaleReturn dropdowns
  // FIXED: reads from InvoiceSeries table so newly created series appear immediately
  // ────────────────────────────────────────────────────────────────────────
const fetchAllocationSeries = async () => {
  try {
    const res  = await api.get("/api/webgetinvoiceseries");
    const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);

    const b2c = [
      ...new Set(
        data.filter(r => r.InvType === "B2C" && r.Series != null && r.Series !== "")
            .map(r => r.Series)
      ),
    ].sort();
    setB2cOptions(b2c);

    const b2b = [
      ...new Set(
        data.filter(r => r.InvType === "B2B" && r.Series != null && r.Series !== "")
            .map(r => r.Series)
      ),
    ].sort();
    setB2bOptions(b2b);

    const ret = [
      ...new Set(
        data.filter(r => r.InvType === "RT" && r.Series != null && r.Series !== "") // ✅ "RT" not "SaleReturn"
            .map(r => r.Series)
      ),
    ].sort();
    setReturnSeriesOptions(ret);

  } catch {
    toast.error("Failed to fetch invoice series");
  }
};
  // ────────────────────────────────────────────────────────────────────────
  // GET /api/getVehicleAllocation
  // SP: WebGetVehicleAllocations
  // Returns only active records (Status=1) — filtered by SP
  // ────────────────────────────────────────────────────────────────────────
  const fetchAll = async () => {
    try {
      const res     = await api.get("/api/getVehicleAllocation");
      const records = Array.isArray(res.data)
        ? res.data
        : (res.data?.data ?? []);

      setAllData(records);
      setAllocations(records);

    } catch {
      toast.error("Failed to fetch data");
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  // ROW CLICK
  // ────────────────────────────────────────────────────────────────────────
  const handleRowClick = (item) => {
    console.log("ROW DATA →", item);

    const alocId    = parseInt(item.AlocId ?? 0);
    const vehicleId = item.VID != null ? String(item.VID) : "";

    if (!alocId || alocId === 0) {
      toast.warning("This row has no AlocId — cannot edit.");
      return;
    }

    setB2cOptions(prev =>
      item.B2CSeries && !prev.includes(item.B2CSeries)
        ? [...prev, item.B2CSeries].sort() : prev
    );
    setB2bOptions(prev =>
      item.B2BSeries && !prev.includes(item.B2BSeries)
        ? [...prev, item.B2BSeries].sort() : prev
    );
    setReturnSeriesOptions(prev =>
      item.SaleReturnSeries && !prev.includes(item.SaleReturnSeries)
        ? [...prev, item.SaleReturnSeries].sort() : prev
    );

    setForm({
      AlocId:           alocId,
      EmployeeId:       String(item.UserId   ?? ""),
      salesRep:         item.UserName         ?? "",
      VehicleId:        vehicleId,
      VehicleNo:        item.VRegNo           ?? "",
      B2CSeries:        item.B2CSeries        ?? "",
      B2BSeries:        item.B2BSeries        ?? "",
      SaleReturnSeries: item.SaleReturnSeries ?? "",
      date:             item.datealoctn
                          ? new Date(item.datealoctn).toISOString().split("T")[0]
                          : todayStr(),
    });

    setIsSaveEnabled(false);
    setIsUpdateEnabled(true);
    setIsDeleteEnabled(true);
    setFieldErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Clear ─────────────────────────────────────────────────────────────────
  const allocationClear = () => {
    setForm(BLANK_FORM);
    setIsSaveEnabled(true);
    setIsUpdateEnabled(false);
    setIsDeleteEnabled(false);
    setFieldErrors({});
    setSearchTerm("");
    toast.dismiss();
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validateField = (name, value) => {
    let error = "";
    if (name === "VehicleId" && !value) error = "Please select vehicle.";
    if (error) toast.warning(error, { toastId: name });
    else       toast.dismiss(name);
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateAll = () => {
    const errors = {};
    if (!form.EmployeeId) errors.EmployeeId = "Please select an employee.";
    if (!form.VehicleId)  errors.VehicleId  = "Please select vehicle.";
    setFieldErrors(errors);
    Object.entries(errors).forEach(([field, msg]) =>
      toast.error(msg, { toastId: field })
    );
    return Object.keys(errors).length === 0;
  };

  // ── setField with auto-fills ──────────────────────────────────────────────
  const setField = (name, value) => {
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === "VehicleId") {
        const veh = vehicles.find(v => String(v.VID) === String(value));
        updated.VehicleNo = veh?.VRegNo ?? "";
      }
      return updated;
    });
  };

  // ────────────────────────────────────────────────────────────────────────
  // POST /api/insertupdateallocation
  // AlocId = 0  → INSERT
  // AlocId > 0  → UPDATE
  // Status "1" = active (backend logic: 1=active, 0=deleted)
  // ────────────────────────────────────────────────────────────────────────
  const callInsertUpdateSP = async (alocId) => {
    const userId = parseInt(form.EmployeeId || 0);

    if (!userId || userId === 0) {
      throw new Error("Employee not selected. Please select an employee.");
    }

    const payload = {
      AlocId:           parseInt(alocId || 0),
      UserId:           userId,
      VanID:            parseInt(form.VehicleId || 0),
      datealoctn:       form.date,
      B2CSeries:        form.B2CSeries        || "",
      B2BSeries:        form.B2BSeries        || "",
      SaleReturnSeries: form.SaleReturnSeries || "",
      Status:           "0",   // 1 = active
    };

    console.log("POST /api/insertupdateallocation →", payload);
  const res = await api.post("/api/insertupdateallocation", payload);

if (!res.data.success) {
  throw new Error(res.data.message || "Operation failed");
}

// ✅ SAFE ACCESS
const newId = res.data.data?.AlocId;
console.log("Saved AlocId:", newId);

    console.log("Response ←", res.data);
    return res.data;
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!validateAll()) return;
    setConfirm({
      msg: "Do you want to save this allocation details?",
      onYes: async () => {
        try {
          setLoadingSave(true);
          await callInsertUpdateSP(0);
          toast.success("Allotted Successfully");
          await fetchAll();
          allocationClear();
        } catch (err) {
          toast.error(err.response?.data?.message || err.message || "Save failed.");
          console.error("Save error:", err);
        } finally {
          setLoadingSave(false);
        }
      },
    });
  };

  // ── Update ────────────────────────────────────────────────────────────────
  const handleUpdate = () => {
    if (!validateAll()) return;

    if (!form.AlocId || form.AlocId === 0) {
      toast.error("Cannot update — AlocId not found. Please click the row again.");
      return;
    }

    setConfirm({
      msg: "Do you want to update this allocation details?",
      onYes: async () => {
        try {
          setLoadingUpdate(true);
          await callInsertUpdateSP(form.AlocId);
          toast.success("Updated Successfully");
          await fetchAll();
          allocationClear();
        } catch (err) {
          toast.error(err.response?.data?.message || err.message || "Update failed.");
          console.error("Update error:", err);
        } finally {
          setLoadingUpdate(false);
        }
      },
    });
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = () => {
    if (!form.AlocId || form.AlocId === 0) {
      toast.error("Cannot delete — AlocId not found. Please click the row again.");
      return;
    }

    setConfirm({
      msg: "Do you want to delete this allocation details?",
      onYes: async () => {
        try {
          setLoadingDelete(true);

          const payload = { AlocId: parseInt(form.AlocId) };
          console.log("POST /api/deleteAllocation →", payload);
          const res = await api.post("/api/deleteAllocation", payload);

          if (!res.data.success) {
            toast.error(res.data.message || "Delete failed.");
            return;
          }

          toast.success("Deleted Successfully");
          await fetchAll();
          allocationClear();
        } catch (err) {
          toast.error(err.response?.data?.message || err.message || "Delete failed.");
          console.error("Delete error:", err);
        } finally {
          setLoadingDelete(false);
        }
      },
    });
  };

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = allocations.filter(a =>
    (a.UserName || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase().trim())
  );

  // ────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="page-wrapper">
      <div className="container-xl">

        <div className="page-header d-print-none mt-2">
          <div className="row g-2 align-items-center">
            <div className="col">
              <h2 className="page-title">Employee Allocation</h2>
            </div>
          </div>
        </div>

        <div className="page-body mt-1">
          <div className="container-xl">
            <ToastContainer position="top-center" autoClose={3000} />

            {/* ── Form card ── */}
            <div className="card mt-3">
              <div className="card-header">
                <h3 className="card-title">
                  {form.AlocId > 0 ? "Edit Allocation" : "New Allocation"}
                </h3>
                {form.AlocId > 0 && (
                  <span className="badge bg-blue ms-2" style={{ fontSize: "11px" }}>
                    Editing AlocId #{form.AlocId}
                  </span>
                )}
              </div>

              <div className="card-body">
                <div className="row g-3">

                  {/* Date */}
                  <div className="col-md-4">
                    <label className="form-label fw-semibold mb-1">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.date}
                      onChange={e => setField("date", e.target.value)}
                    />
                  </div>

                  {/* Employee */}
                  <div className="col-md-4">
                    <label className="form-label fw-semibold mb-1">Employee</label>
                    <select
                      className={`form-select ${fieldErrors.EmployeeId ? "is-invalid" : ""}`}
                      value={form.EmployeeId}
                      onChange={e => {
                        const emp = employees.find(em => String(em.UserId) === String(e.target.value));
                        setForm(prev => ({
                          ...prev,
                          EmployeeId: e.target.value,
                          salesRep:   emp?.Name ?? "",
                        }));
                      }}
                    >
                      <option value="">-- Select Employee --</option>
                      {employees.map(emp => (
                        <option key={emp.UserId} value={emp.UserId}>
                          {emp.Name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.EmployeeId && (
                      <div className="invalid-feedback">{fieldErrors.EmployeeId}</div>
                    )}
                  </div>

                  {/* Vehicle */}
                  <div className="col-md-4">
                    <label className="form-label fw-semibold mb-1">Vehicle No</label>
                    <select
                      className={`form-select ${fieldErrors.VehicleId ? "is-invalid" : ""}`}
                      value={form.VehicleId}
                      onChange={e => setField("VehicleId", e.target.value)}
                      onBlur={e => validateField("VehicleId", e.target.value)}
                    >
                      <option value="">-- Select Vehicle --</option>
                      {vehicles.map(v => (
                        <option key={v.VID} value={v.VID}>
                          {v.VRegNo}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.VehicleId && (
                      <div className="invalid-feedback">{fieldErrors.VehicleId}</div>
                    )}
                  </div>

                  {/* B2C Series */}
                  <div className="col-md-4">
                    <label className="form-label fw-semibold mb-1">B2C Series</label>
                    <select
                      className="form-select"
                      value={form.B2CSeries}
                      onChange={e => setForm(prev => ({ ...prev, B2CSeries: e.target.value }))}
                    >
                      <option value="">-- Select B2C Series --</option>
                      {b2cOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* B2B Series */}
                  <div className="col-md-4">
                    <label className="form-label fw-semibold mb-1">B2B Series</label>
                    <select
                      className="form-select"
                      value={form.B2BSeries}
                      onChange={e => setForm(prev => ({ ...prev, B2BSeries: e.target.value }))}
                    >
                      <option value="">-- Select B2B Series --</option>
                      {b2bOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Return Series */}
                  <div className="col-md-4">
                    <label className="form-label fw-semibold mb-1">Return Series</label>
                    <select
                      className="form-select"
                      value={form.SaleReturnSeries}
                      onChange={e => setForm(prev => ({ ...prev, SaleReturnSeries: e.target.value }))}
                    >
                      <option value="">-- Select Return Series --</option>
                      {returnSeriesOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* Buttons */}
                <div className="mt-4 d-flex gap-2 flex-wrap">
                  <button
                    type="button" className="btn btn-primary"
                    onClick={handleSave} disabled={!isSaveEnabled || loadingSave}
                    style={{ minWidth: "90px" }}
                  >
                    {loadingSave
                      ? <><span className="spinner-border spinner-border-sm me-1" />Saving...</>
                      : "Save"}
                  </button>

                  <button
                    type="button" className="btn btn-warning"
                    onClick={handleUpdate} disabled={!isUpdateEnabled || loadingUpdate}
                    style={{ minWidth: "90px" }}
                  >
                    {loadingUpdate
                      ? <><span className="spinner-border spinner-border-sm me-1" />Updating...</>
                      : "Update"}
                  </button>

                  <button
                    type="button" className="btn btn-danger"
                    onClick={handleDelete} disabled={!isDeleteEnabled || loadingDelete}
                    style={{ minWidth: "90px" }}
                  >
                    {loadingDelete
                      ? <><span className="spinner-border spinner-border-sm me-1" />Deleting...</>
                      : "Delete"}
                  </button>

                  <button
                    type="button" className="btn btn-secondary"
                    onClick={allocationClear}
                    style={{ minWidth: "90px" }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* ── Allocation list ── */}
            <div className="card mt-3">
              <div className="card-header">
                <h3 className="card-title">Allocation List</h3>
                <div className="col-md-3 ms-auto">
                  <input
                    type="text" className="form-control"
                    placeholder="Search by employee name..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="card-body p-0" style={{ maxHeight: "400px", overflowY: "auto" }}>
                <table className="table table-bordered table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Sl No</th>
                      <th>Date</th>
                      <th>Employee</th>
                      <th>Vehicle</th>
                      <th>B2C Series</th>
                      <th>B2B Series</th>
                      <th>Return Series</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length > 0 ? (
                      filtered.map((item, idx) => (
                        <tr
                          key={`${item.AlocId}-${idx}`}
                          onClick={() => handleRowClick(item)} 
                          style={{ cursor: "pointer" }}
                          className={form.AlocId === item.AlocId ? "table-active" : ""}
                        >
                          <td>{idx + 1}</td>
                          <td>
                            {item.datealoctn
                              ? new Date(item.datealoctn).toLocaleDateString()
                              : "—"}
                          </td>
                          <td>{item.UserName}</td>
                          <td>{item.VRegNo}</td>
                          <td>{item.B2CSeries}</td>
                          <td>{item.B2BSeries}</td>
                          <td>{item.SaleReturnSeries}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7">
                          <div className="alert alert-warning mb-0">
                            No allocation records found.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Confirm dialog ── */}
      {confirm && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setConfirm(null)}
        >
          <div
            style={{
              background: "#fff", borderRadius: "12px",
              padding: "28px 32px", maxWidth: "380px", width: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <h5 style={{ marginBottom: "12px" }}>Confirm</h5>
            <p style={{ color: "#555", fontSize: "14px", lineHeight: 1.6 }}>
              {confirm.msg}
            </p>
            <div style={{
              display: "flex", gap: "10px",
              justifyContent: "flex-end", marginTop: "20px",
            }}>
              <button className="btn btn-secondary" onClick={() => setConfirm(null)}>No</button>
              <button className="btn btn-primary"
                onClick={() => { confirm.onYes(); setConfirm(null); }}>
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeAllocation;