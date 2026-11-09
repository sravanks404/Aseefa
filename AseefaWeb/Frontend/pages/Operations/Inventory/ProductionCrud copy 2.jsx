import React, { useEffect, useState } from "react";
import api from "../../apiService";
import Select from "react-select";   // ✅ Import react-select

function ProductionCrud() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  // 👇 store full response
  const [jobDetails, setJobDetails] = useState({
    jobCard: {},
    production: [],
    productiondetails: []
  });
  const [prod, setProd] = useState([]);           // output
  const [prodDetails, setProdDetails] = useState([]); // input

  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchOptions, setBatchOptions] = useState([]);
  const [currentRowIndex, setCurrentRowIndex] = useState(null);
  // instead of only index, track job and row
  const [selectedDetail, setSelectedDetail] = useState(null);


  // --- NEW STATE FOR SAVE/DELETE ---

  // Get unique departments
  const departments = [...new Set(jobs.map(job => job.DepartmentName))];

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch =
      job.AllocNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.JobCardId.toString().includes(searchTerm);
    const matchesDepartment =
      filterDepartment === "all" || job.DepartmentName === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  // Fetch Users
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const companyId = sessionStorage.getItem("CompanyID");
      if (!companyId) {
        setUsersError("Company ID not found in session");
        return;
      }

      const res = await api.get("/api/GetUser", { params: { CompanyID: companyId } });
      const options = res.data.map(u => ({
        value: u.UserID,
        label: u.Name
      }));
      setUsers(options);
    } catch (err) {
      setUsersError("Failed to load users");
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch Jobs
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const companyId = sessionStorage.getItem("CompanyID");

      if (!companyId) {
        setError("Company ID not found in session");
        setLoading(false);
        return;
      }

      const res = await api.get("/api/ProductionJobQc", {
        params: { CompanyID: companyId },
      });

      setJobs(res.data || []);
    } catch (err) {
      setError("Failed to fetch jobs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Job Details
const fetchJobDetails = async (jobCardId) => {
  try {
    setDetailsLoading(true);
    setSelectedJob(jobCardId);

    const res = await api.get("/api/ProductionJobIngredients", {
      params: { JobCardId: jobCardId },
    });

    const details = res.data || { jobCard: [], production: [], productiondetails: [] };
    setJobDetails(details);

    // 👇 sync local editable states
    setProd(details.production || []);
    setProdDetails(details.productiondetails || []);

    setDetailsError(null);
  } catch (err) {
    setDetailsError("Failed to fetch job details");
    console.error(err);
  } finally {
    setDetailsLoading(false);
  }
};

  useEffect(() => {
    fetchJobs();
    fetchUsers();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB");
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  // --- ACTION HANDLERS ---
  const handleSaveProduction = async (jc) => {
    try {
      setSaving(true);
      setActionError(null);

      // prepare body
      const payload = {
        PID: prod[0]?.PID || 0,    // take from existing if available
        ProductionNo: prod[0]?.ProductionNo || 0,
        JobCardId: jc.JobCardId,
        PDate: new Date().toISOString(),
        Qty: prod[0]?.JBProductQTY || 0,
        CompanyID: parseInt(sessionStorage.getItem("CompanyID")),
        CreatedBy: parseInt(sessionStorage.getItem("UserID")),
        CreatedDate: new Date().toISOString(),
        ModifiedBy: null,
        ModifiedDate: null,
        ProductID : prod[0]?.JCItemId,
        IsDeleted: 0,
        FYearID: new Date().getFullYear(),
        BatchID: prodDetails[0]?.BatchId || null,
        status: 1,
        TotalLC: prodDetails.reduce((sum, d) => sum + (Number(d.TLC) || 0), 0),
        ExtaCost: prod[0]?.ExtraCost || 0,
        WasteQty: prod[0]?.WasteQty || 0,
        TotalQty: (prod[0]?.JBProductQTY || 0) + (prod[0]?.WasteQty || 0),
        Type: 2,
        LabourCost: prod[0]?.LabourCost || 0,
        TotalProductionCost:
          prodDetails.reduce((sum, d) => sum + (Number(d.TLC) || 0), 0) +
          (Number(prod[0]?.ExtraCost) || 0) +
          (Number(prod[0]?.LabourCost) || 0),
        SuitAppsId: null,
        Items: prodDetails.map((d) => ({
          ItemID: d.INGREItemID,
          RequiredQuantity: d.JBINGREQTY,
          BatchId: d.BatchId || null,
          Unit: d.IngreunitId,
          TLC: d.TLC || 0,
          AvlQty: d.Available || 0,
          UsedQty: d.UsedQty || 0,
          BatchName: d.BatchName || null,
          CreatedBY : 1,
        })),
      };

      await api.post("/api/InsertUpdateProduction", payload);

      alert("✅ Production saved successfully!");
      fetchJobDetails(jc.JobCardId);
    } catch (err) {
      console.error("Save failed", err);
      setActionError("Failed to save production");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduction = async (jc) => {
    try {
      setDeleting(true);
      setActionError(null);

      await api.delete(`/api/DeleteProduction/${jc.JobCardId}`); // 👈 adjust endpoint
      alert("🗑️ Production deleted!");
      fetchJobDetails(jc.JobCardId);
    } catch (err) {
      setActionError("Failed to delete production");
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleClearProduction = (jc) => {
    setJobDetails(prev => ({
      ...prev,
      production: prev.production.filter(p => p.ItemID !== jc.ItemId),
      productiondetails: prev.productiondetails.filter(
        pd => !prev.production.some(p => p.PID === pd.PID && p.ItemID === jc.ItemId)
      )
    }));
  };



  return (
    <div className="container-fluid py-3 bg-light min-vh-100">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-white rounded shadow-sm">
        <h2 className="h3 mb-0 text-primary">Production</h2>
        <div className="d-flex gap-2 align-items-center">
          <div className="position-relative">
            <span className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted">🔍</span>
            <input
              type="text"
              className="form-control form-control ps-4"
              placeholder="Search by Job ID or AllocNo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "250px" }}
            />
          </div>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="form-select form-select"
            style={{ width: "auto" }}
          >
            <option value="all">All Departments</option>
            {departments.map((dept, index) => (
              <option key={index} value={dept}>{dept}</option>
            ))}
          </select>
          <button onClick={fetchJobs} className="btn btn btn-primary">↻ Refresh</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="row g-3">
        {/* Jobs Panel */}
        <div className="col-md-2">
          <div className="card h-100 shadow">
            <div className="card-header d-flex justify-content-between align-items-center py-2">
              <h3 className="h3 mb-0">Production Jobs</h3>
              <span className="badge bg-primary">{filteredJobs.length} jobs</span>
            </div>
            <div className="card-body p-2" style={{ overflowY: "auto", maxHeight: "70vh" }}>
              {loading && (
                <div className="d-flex flex-column align-items-center justify-content-center py-5 text-muted">
                  <div className="spinner-border spinner-border-sm text-primary mb-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mb-0">Loading jobs...</p>
                </div>
              )}

              {error && (
                <div className="text-center py-5 text-danger">
                  <p>{error}</p>
                  <button onClick={fetchJobs} className="btn btn-sm btn-danger mt-2">Try Again</button>
                </div>
              )}

              {!loading && !error && filteredJobs.length === 0 && (
                <div className="text-center py-5 text-muted">
                  <p>No jobs found</p>
                  {(searchTerm || filterDepartment !== "all") && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setFilterDepartment("all");
                      }}
                      className="btn btn-sm btn-secondary mt-2"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}

              {filteredJobs.map((job) => (
                <div
                  key={job.JobCardId}
                  onClick={() => fetchJobDetails(job.JobCardId)}
                  className={`card mb-2 cursor-pointer ${selectedJob === job.JobCardId ? "border-primary bg-light" : ""}`}
                  style={{ transition: "all 0.2s" }}
                >
                  <div className="card-body py-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold text-dark">{job.AllocNo}</span>
                      <span className={`badge bg-${job.Status === 1 ? "success" : "danger"} rounded-pill`}></span>
                    </div>
                    <div className="mt-1">
                      <p className="mb-1 text-muted small">{job.DepartmentName}</p>
                      <p className="mb-0 text-muted small">📅 {formatDate(job.AllocDate)}</p>
                    </div>
                    <div className="text-end mt-1">
                      <small className="text-primary fw-medium">View Details →</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Details Panel */}
        <div className="col-md-10">
          <div className="card h-100 shadow">
            <div className="card-header d-flex justify-content-between align-items-center py-2">
              <h3 className="h3 mb-0">Job Details</h3>
              {selectedJob && (
                <button
                  onClick={() => {
                    setSelectedJob(null);
                    setJobDetails({ jobCard: [], production: [], productiondetails: [] });
                  }}
                  className="btn btn-outline-secondary btn-sm"
                >
                  × Clear
                </button>
              )}
            </div>

            <div className="card-body" style={{ overflowY: "auto", maxHeight: "70vh" }}>
              {!selectedJob ? (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                  <div className="fs-1 mb-2">📋</div>
                  <p>Select a job to view details</p>
                </div>
              ) : detailsLoading ? (
                <div className="d-flex flex-column align-items-center justify-content-center py-5 text-muted">
                  <div className="spinner-border spinner-border-sm text-primary mb-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mb-0">Loading details...</p>
                </div>
              ) : detailsError ? (
                <div className="text-center py-5 text-danger">
                  <p>{detailsError}</p>
                  <button onClick={() => fetchJobDetails(selectedJob)} className="btn btn-sm btn-danger mt-2">
                    Try Again
                  </button>
                </div>
              ) : jobDetails.jobCard.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <p>No details found for this job</p>
                </div>
              ) : (
                jobDetails.jobCard.map((jc, idx) => {
                  const prod = (jobDetails.production || []).filter(
                    (p) => p.JCItemId === jc.JCItemId
                  );

                  const prodDetails = (jobDetails.productiondetails || []).filter(
                    (pd) => pd.JCItemId === jc.JCItemId
                  );


                  return (
                    <div key={jc.ProAlloId} className="mb-4 border rounded shadow-sm bg-white">
                      {/* ✅ Job Header */}
                      <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 d-flex align-items-center">
                          <span>{`#${idx + 1} • ${jc.ItemTypeName}`}</span>
                          <span className="badge bg-light text-dark ms-2">{jc.CardItemName}</span>
                        </h5>
                        <span className="badge bg-light text-dark">Qty: {jc.Qty}</span>
                      </div>

                      <div className="card-body">
                        {/* ✅ Job Meta Info */}
                        <div className="row mb-3">
                          <div className="col-md-4"><strong>Job Start :</strong> {formatDateTime(jc.StartingDate)}</div>
                          <div className="col-md-4"><strong>Job End:</strong> {formatDateTime(jc.EndingDate)}</div>
                          <div className="col-md-4"><strong>Duration:</strong> {jc.Duration} hr</div>
                        </div>

                        <div className="row mb-3">
                          <div className="col-md-4"><strong>ISO Batch #:</strong> {jc.ISOBatchNumber}</div>
                          <div className="col-md-4"><strong>Batch #:</strong> {jc.BatchName}</div>
                          <div className="col-md-4"><strong>Barcode #:</strong> {jc.BarcodeNumber}</div>
                        </div>

                        <div className="row mb-3">
                          <div className="col-md-6"><strong>Allocated User:</strong> {jc.AllocUserName}</div>
                          <div className="col-md-6"><strong>Job card User :</strong> {jc.UserNames}</div>
                        </div>

                        <div className="row">
                          <div className="col-md-12">
                            <strong>Status:</strong>{" "}
                            {prod.length === 0 ? (
                              <span className="badge bg-secondary">Not Produced</span>
                            ) : (
                              <span className="badge bg-success">In Production</span>
                            )}
                          </div>
                        </div>

                        {/* ✅ Production Details Check */}
                        {/* ✅ Production Details Check */}
                        {prodDetails.length === 0 ? (
                          <div className="alert alert-warning py-2">🚫 No Ingredients Created</div>
                        ) : (
                          <>
                            {/* Input Table */}
                            <div className="row">
                              <div className="col-md-12 mb-3">
                                <h6 className="text-secondary border-bottom pb-1">🔹 Input (Production Details)</h6>
                                <table className="table table-sm table-bordered">
                                  <thead className="table-light">
                                    <tr>
                                      <th>Ingredient</th>
                                      <th>Req Qty</th>
                                      <th>Select</th>
                                      <th>Batch</th>
                                      <th>Available</th>
                                      <th>Used Qty</th>
                                      <th>Unit</th>
                                      <th>LC</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {prodDetails.map((pd, index) => (
                                      <tr key={pd.IDID}>
                                        <td>{pd.INGREITEM}</td>
                                        <td>{pd.JBINGREQTY}</td>
                                        <td>
                                          <button
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={async () => {
                                              try {
                                                const companyId = sessionStorage.getItem("CompanyID");
                                                const itemId = pd.INGREItemID;

                                                // store job + row id
                                                setSelectedDetail({ jcId: jc.JCItemId, detailId: pd.IDID });

                                                const res = await api.get("/api/ProductionIngreLC", {
                                                  params: { CompanyID: companyId, ItemId: itemId },
                                                });

                                                setBatchOptions(res.data);
                                                setShowBatchModal(true);
                                              } catch (error) {
                                                console.error("Error fetching batches:", error);
                                              }
                                            }}
                                          >
                                            Select
                                          </button>
                                        </td>
                                        <td>{pd.BatchName || "-"}</td>
                                        <td>{pd.Available || 0}</td>
                                      <td>
  <input
    type="number"
    value={pd.UsedQty ?? pd.Available ?? ""}   // ✅ Prefill with Available if UsedQty is null
    onChange={(e) => {
      const newVal = e.target.value === "" ? null : parseFloat(e.target.value);
      setProdDetails((prev) =>
        prev.map((d, i) =>
          i === index ? { ...d, UsedQty: newVal } : d
        )
      );
    }}
  />
</td>
                                        <td>{pd.INGREUNIT}</td>
                                        <td>{pd.TLC || 0}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Output Table */}
                              <div className="col-md-4 mb-3">
                                <h6 className="text-secondary border-bottom pb-1">🔹 Output (Production)</h6>
                                <table className="table table-sm table-bordered">
                                  <thead className="table-light">
                                    <tr>
                                      <th>Product</th>
                                      <th>Qty</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {prod.map((p, index) => (
                                      <tr key={p.IID}>
                                        <td>{p.ProductItem}</td>
                                        <td>
                                          <input
                                            type="number"
                                            value={p.JBProductQTY ?? ""}
                                            onChange={(e) => {
                                              const newVal = e.target.value === "" ? null : parseFloat(e.target.value);
                                              setProd((prev) =>
                                                prev.map((d, i) => (i === index ? { ...d, JBProductQTY: newVal } : d))
                                              );
                                            }}
                                          />
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Cost Table */}
                              <div className="col-md-8 mb-3">
                                <h6 className="text-secondary border-bottom pb-1 ">
                                  🔹 Production Cost & Qty Details
                                </h6>
                                <div className="table-responsive">
                                  <table className="table table-sm table-bordered">
                                    <thead className="table-light">
                                      <tr>
                                        <th>Waste Qty</th>
                                        <th>Extra Cost</th>
                                        <th>Labour Cost</th>
                                        <th>Production Cost</th>
                                        <th>Total Production Cost</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {prod.map((p, index) => {
                                        // ✅ Production cost = sum of TLC from all ingredients
                                        const productionCost = prodDetails.reduce(
                                          (sum, d) => sum + (Number(d.TLC) || 0),
                                          0
                                        );

                                        // ✅ Total cost = production cost + extra + labour
                                        const totalCost =
                                          productionCost +
                                          (Number(p.ExtraCost) || 0) +
                                          (Number(p.LabourCost) || 0);

                                        return (
                                          <tr key={`cost-${p.PID}`}>
                                            <td>
                                              <input
                                                type="number"
                                                value={p.WasteQty ?? ""}
                                                onChange={(e) =>
                                                  setProd((prev) =>
                                                    prev.map((d, i) =>
                                                      i === index ? { ...d, WasteQty: parseFloat(e.target.value) } : d
                                                    )
                                                  )
                                                }
                                              />
                                            </td>
                                            <td>
                                              <input
                                                type="number"
                                                value={p.ExtraCost ?? ""}
                                                onChange={(e) =>
                                                  setProd((prev) =>
                                                    prev.map((d, i) =>
                                                      i === index ? { ...d, ExtraCost: parseFloat(e.target.value) } : d
                                                    )
                                                  )
                                                }
                                              />
                                            </td>
                                            <td>
                                              <input
                                                type="number"
                                                value={p.LabourCost ?? ""}
                                                onChange={(e) =>
                                                  setProd((prev) =>
                                                    prev.map((d, i) =>
                                                      i === index ? { ...d, LabourCost: parseFloat(e.target.value) } : d
                                                    )
                                                  )
                                                }
                                              />
                                            </td>
                                            <td>
                                              <input
                                                type="number"
                                                className="form-control form-control-sm bg-light"
                                                style={{ width: "20px", minWidth: "70px" }}
                                                value={productionCost}
                                                readOnly
                                              />
                                            </td>
                                            <td>
                                              <input
                                                type="number"
                                                className="form-control form-control-sm bg-light"
                                                style={{ width: "20px", minWidth: "70px" }}
                                                value={totalCost}
                                                readOnly
                                              />
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>

                            {/* ✅ Action Buttons */}
                            <div className="d-flex justify-content-center gap-2 mt-3">
                              <button
                                className="btn btn-primary btn-sm"
                                disabled={saving}
                                onClick={() => handleSaveProduction(jc, prod, prodDetails)}
                              >
                                {saving ? "Saving..." : "💾 Save"}
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                disabled={deleting}
                                onClick={() => handleDeleteProduction(jc)}
                              >
                                {deleting ? "Deleting..." : "🗑️ Delete"}
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleClearProduction(jc)}
                              >
                                🔄 Clear
                              </button>
                            </div>

                            {actionError && <div className="text-danger mt-2">{actionError}</div>}
                          </>
                        )}

                      </div>
                    </div>

                  );
                })
              )}
            </div>
          </div>
        </div>
        {showBatchModal && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Select Batch</h5>
                  <button type="button" className="btn-close" onClick={() => setShowBatchModal(false)}></button>
                </div>
                <div className="modal-body">
                  <table className="table table-sm table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th>Batch Id</th>
                        <th>Batch Name</th>
                        <th>Balance Stock</th>
                        <th>Ingredient LC</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchOptions.map((b) => (
                        <tr key={b.BatchId}>
                          <td>{b.BatchId}</td>
                          <td>{b.BatchName}</td>
                          <td>{b.BalanceStock}</td>
                          <td>{b.IngredientLc}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => {
                                if (!selectedDetail) return;

                                setJobDetails((prev) => {
                                  const updated = { ...prev };
                                  updated.productiondetails = updated.productiondetails.map((d) =>
                                    d.JCItemId === selectedDetail.jcId && d.IDID === selectedDetail.detailId
                                      ? {
                                        ...d,
                                        BatchId: b.BatchId,
                                        BatchName: b.BatchName,
                                        Available: b.BalanceStock,
                                        TLC: b.IngredientLc
                                      }
                                      : d
                                  );
                                  return updated;
                                });

                                setShowBatchModal(false);
                                setSelectedDetail(null);
                              }}
                            >
                              Select
                            </button>


                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>


  );
}

export default ProductionCrud;
