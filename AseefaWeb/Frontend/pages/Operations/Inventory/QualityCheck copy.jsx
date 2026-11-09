import React, { useEffect, useState } from "react";
import api from "../../apiService";
import Select from "react-select";   // ✅ Import react-select



function QualityCheck() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  // 👇 store full response
  const [jobDetails, setJobDetails] = useState({
    jobCard: [],
    production: [],
    productiondetails: []
  });
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");

  // ✅ Users state (for QC select)
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);

  const [qcData, setQcData] = useState({
    QcChecked: [],
    QcVerified: null,
    TableCleaning: false,
    Tray: false,
    HydrogenPeroxide: false,
    ClothHygienin: false,
    Vesselclean: false,
    SaltVisibility: false,
    Narration: "",
  });

const handleQcChange = (field, value, isMulti = false) => {
  if (isMulti) {
    // Store only IDs
    setQcData(prev => ({
      ...prev,
      [field]: value || [],
    }));
  } else if (typeof value === "boolean") {
    setQcData(prev => ({ ...prev, [field]: value }));
  } else if (typeof value === "string") {
    setQcData(prev => ({ ...prev, [field]: value }));
  } else {
    const selectedId = value ? value.value : null;
    setQcData(prev => ({
      ...prev,
      [field]: value,
      [`${field}Id`]: selectedId,
    }));
  }
};



  // ✅ Clear QC form
  const clearQc = () => {
    setQcData({
      QcChecked: [],
      QcVerified: "",
      TableCleaning: false,
      Tray: false,
      HydrogenPeroxide: false,
      ClothHygienin: false,
      Vesselclean: false,
      SaltVisibility: false,
      Narration: "",
    });
  };


  // ✅ Save QC data to backend
  const saveQcDetails = async () => {
    try {
      const payload = {
        ProAlloId: selectedJob?.ProAlloId,
        JobId: selectedJob?.JobId,
        ...qcData,
        QcChecked: qcData.QcChecked.map((u) => u.value),
      };


      await api.post("/api/insertqualitycheck", payload);
      alert("QC details saved successfully ✅");
    } catch (error) {
      console.error("Error saving QC details", error);
      alert("❌ Failed to save QC details");
    }
  };




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


  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const companyId = sessionStorage.getItem("CompanyID");
      if (!companyId) {
        setUsersError("Company ID not found in session");
        return;
      }

      const res = await api.get("/api/GetUser", { params: { CompanyID: companyId } });
      // Map users into react-select format
      const options = res.data.map(u => ({
        value: u.UserID,  // or whatever column is primary
        label: u.Name     // assuming `Name` exists in resultset
      }));
      setUsers(options);
    } catch (err) {
      setUsersError("Failed to load users");
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

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

  const fetchJobDetails = async (jobCardId) => {
    try {
      setDetailsLoading(true);
      setSelectedJob(jobCardId);
      const res = await api.get("/api/ProductionJobQcDetails", {
        params: { JobCardId: jobCardId },
      });
      setJobDetails(res.data || { jobCard: [], production: [], productiondetails: [] });
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
    fetchUsers();   // ✅ also load users
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB");
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString(); // shows date + time in local format
  };


  return (
    <div className="container-fluid py-3 bg-light min-vh-100">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-white rounded shadow-sm">
        <h2 className="h3 mb-0 text-primary">Quality Check</h2>
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
                  const prod = jobDetails.production.filter(p => p.ItemID === jc.ItemId);
                  const prodDetails = jobDetails.productiondetails.filter(pd =>
                    prod.some(p => p.PID === pd.PID)
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
                          <div className="col-md-4"><strong>Batch #:</strong> {jc.BatchNumber}</div>
                          <div className="col-md-4"><strong>Barcode #:</strong> {jc.BarcodeNumber}</div>
                        </div>

                        <div className="row mb-3">
                          <div className="col-md-6"><strong>Allocated User:</strong> {jc.AllocUserName}</div>
                          <div className="col-md-6"><strong>Job card User :</strong> {jc.UserNames}</div>
                        </div>

                        {/* ✅ Status Badge */}
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

                        {/* ✅ Production Sections */}
                        {prod.length === 0 ? (
                          <div className="alert alert-warning py-2">🚫 No production done</div>
                        ) : (
                          <>
                            <div className="row">
                              {/* Input */}
                              <div className="col-md-6 mb-3">
                                <h6 className="text-secondary border-bottom pb-1">🔹 Input (Production Details)</h6>
                                <table className="table table-sm table-bordered">
                                  <thead className="table-light">
                                    <tr>
                                      <th>Ingredient</th>
                                      <th>Req Qty</th>
                                      <th>Used Qty</th>
                                      <th>Unit</th>
                                      <th>Landing Cost</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {prodDetails.map(pd => (
                                      <tr key={pd.PDID}>
                                        <td>{pd.ingredientname}</td>
                                        <td>{pd.RequiredQuantity}</td>
                                        <td>{pd.UsedQty}</td>
                                        <td>{pd.UnitName}</td>
                                        <td>{pd.TLC}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Output */}
                              <div className="col-md-6 mb-3">
                                <h6 className="text-secondary border-bottom pb-1">🔹 Output (Production)</h6>
                                <table className="table table-sm table-bordered">
                                  <thead className="table-light">
                                    <tr>
                                      <th>Product</th>
                                      <th>Qty</th>
                                      <th>Status</th>
                                      <th>Production Cost</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {prod.map(p => (
                                      <tr key={p.PID}>
                                        <td>{p.PRODUCTNAME}</td>
                                        <td>{p.ProductionQty}</td>
                                        <td>
                                          <span
                                            className={`badge ${p.ProductionStatus === 1 ? "bg-success" : "bg-warning text-dark"
                                              }`}
                                          >
                                            {p.ProductionStatus === 1 ? "Done" : "Pending"}
                                          </span>
                                        </td>
                                        <td>{p.TotalProductionCost}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* ✅ QC Section only if production exists */}
                            <div className="mt-3">
                              <h6 className="text-secondary border-bottom pb-1">🔹 QC Checks</h6>
                              <div className="row">
                                <div className="col-md-4">
                                  {/* ✅ QC Checked (Multiple Select) */}
                                  <div className="mb-2">
                                    <label>Qc Checked</label>
<Select
  options={users}
  isMulti
  isLoading={usersLoading}
  value={users.filter(o => qcData.QcChecked.includes(o.value))}  // build selected options
  onChange={(selectedOptions) =>
    setQcData(prev => ({
      ...prev,
      QcChecked: selectedOptions ? selectedOptions.map(o => o.value) : [] // store only IDs
    }))
  }
  placeholder="Select users..."
  className="react-select-container"
  classNamePrefix="react-select"
  closeMenuOnSelect={false}
/>





                                  </div>

                                  {/* ✅ QC Verified (Single Select) */}
                                  <div className="mb-2">
                                    <label>Qc Verified</label>
                                    <Select
                                      options={users}
                                      isLoading={usersLoading}
                                      value={qcData.QcVerified || null} // show selected user in dropdown
                                      onChange={(opt) => handleQcChange("QcVerified", opt)}
                                      placeholder="Select user..."
                                      isClearable
                                    />

                                  </div>
                                </div>

                                {/* ✅ QC Switches */}
                                <div className="col-md-4">
                                  {[
                                    "TableCleaning",
                                    "Tray",
                                    "HydrogenPeroxide",
                                    "ClothHygienin",
                                    "Vesselclean",
                                    "SaltVisibility",
                                  ].map((field) => (
                                    <div className="form-check form-switch mb-1" key={field}>
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={qcData[field]}
                                        onChange={(e) => handleQcChange(field, e.target.checked)}
                                      />
                                      <label className="form-check-label">{field}</label>
                                    </div>
                                  ))}
                                </div>

                                {/* ✅ Narration + Buttons */}
                                <div className="col-md-4">
                                  <div className="mb-2">
                                    <label>Narration</label>
                                    <textarea
                                      className="form-control"
                                      rows="3"
                                      value={qcData.Narration || ""}
                                      onChange={(e) => handleQcChange("Narration", e.target.value)}
                                      placeholder="Enter remarks..."
                                    />
                                  </div>

                                  {/* ✅ Action Buttons under Remarks */}
                                  <div className="d-flex gap-2 mt-2">
                                    <button
                                      className="btn btn"
                                      onClick={saveQcDetails}
                                    >
                                      💾 Save
                                    </button>
                                    <button
                                      className="btn btn"
                                      onClick={clearQc}
                                    >
                                      ❌ Clear
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>


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
      </div>
    </div>
  );
}

export default QualityCheck;
