import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";   // ✅ For navigation
import api from "../../apiService";

function ProductionCrud() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  const [jobDetails, setJobDetails] = useState({
    jobCard: [],
    production: [],
    productiondetails: []
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  const navigate = useNavigate();

  // Departments list
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

  // Fetch jobs
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const companyId = sessionStorage.getItem("CompanyID");
      if (!companyId) {
        setError("Company ID not found in session");
        return;
      }
      const res = await api.get("/api/ProductionJobQc", {
        params: { CompanyID: companyId },
      });
      setJobs(res.data || []);
      setError(null);
    } catch (err) {
      setError("Failed to fetch jobs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch job details
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
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB");
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString();
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
              className="form-control ps-4"
              placeholder="Search by Job ID or AllocNo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "250px" }}
            />
          </div>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="form-select"
          >
            <option value="all">All Departments</option>
            {departments.map((dept, index) => (
              <option key={index} value={dept}>{dept}</option>
            ))}
          </select>
          <button onClick={fetchJobs} className="btn btn-primary">↻ Refresh</button>
        </div>
      </div>

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
                <div className="d-flex flex-column align-items-center py-5 text-muted">
                  <div className="spinner-border spinner-border-sm text-primary mb-2"></div>
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
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterDepartment("all");
                    }}
                    className="btn btn-sm btn-secondary mt-2"
                  >
                    Clear Filters
                  </button>
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
                    <p className="mb-1 text-muted small">{job.DepartmentName}</p>
                    <p className="mb-0 text-muted small">📅 {formatDate(job.AllocDate)}</p>
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
                <div className="d-flex flex-column align-items-center h-100 text-muted">
                  <div className="fs-1 mb-2">📋</div>
                  <p>Select a job to view details</p>
                </div>
              ) : detailsLoading ? (
                <div className="d-flex flex-column align-items-center py-5 text-muted">
                  <div className="spinner-border spinner-border-sm text-primary mb-2"></div>
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
                    (p) => p.ItemID === jc.ItemId && p.JobCardId === jc.JobCardId
                  );

                  const prodDetails = (jobDetails.productiondetails || []).filter(
                    (pd) => pd.PID && prod.some((p) => p.PID === pd.PID)
                  );

                  return (
                    <div key={jc.ProAlloId} className="mb-4 border rounded shadow-sm bg-white">
                      <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">
                          #{idx + 1} • {jc.ItemTypeName}
                          <span className="badge bg-light text-dark ms-2">{jc.CardItemName}</span>
                        </h5>
                        <span className="badge bg-light text-dark">Qty: {jc.Qty}</span>
                      </div>

                      <div className="card-body">
                        {/* Meta Info */}
                        <div className="row mb-3">
                          <div className="col-md-4"><strong>Job Start:</strong> {formatDateTime(jc.StartingDate)}</div>
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
                          <div className="col-md-6"><strong>Job Card User:</strong> {jc.UserNames}</div>
                        </div>

                        <div>
                          <strong>Status:</strong>{" "}
                          {prod.length === 0 ? (
                            <span className="badge bg-secondary">Not Produced</span>
                          ) : (
                            <span className="badge bg-success">In Production</span>
                          )}
                        </div>

                        {/* Ingredients */}
                        {prod.length > 0 && prod.some((p) => p.ItemID === jc.ItemId) ? (
                          <div className="mt-3">
                            <h6 className="fw-bold">Production</h6>
                            <div className="row g-3">
                              {prod
                                .filter((p) => p.ItemID === jc.ItemId) // ✅ ensure match here
                                .map((p, i) => (
                                  <div key={i} className="col-md-4">
                                    <div className="card border shadow-sm p-2">
                                      <p className="mb-1"><strong>Production No:</strong> {p.ProductionNo}</p>
                                      <p className="mb-1"><strong>Qty:</strong> {p.ProductionQty}</p>
                                      <p className="mb-1"><strong>Date:</strong> {formatDateTime(p.PDate)}</p>

                                      <div className="text-end mt-2">
                                        <button
                                          className="btn btn-sm btn-success"
                                          onClick={() => {
                                            // ✅ Store IDs before navigating
                                            sessionStorage.setItem("JobCardId", jc.JobCardId);
                                            sessionStorage.setItem("JCItemId", jc.ItemId);
                                            sessionStorage.setItem("PID", p.PID);

                                            navigate("/ProductionEntry");
                                          }}
                                        >
                                          Go to Production Entry →
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3">
                            <h6 className="fw-bold">Production</h6>
                            <div className="card border shadow-sm p-3">
                              <p className="mb-2 text-muted">🚫 Production not done</p>
                              <div className="text-end">
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => {
                                    // ✅ Store IDs before navigating
                                    sessionStorage.setItem("JobCardId", jc.JobCardId);
                                    sessionStorage.setItem("JCItemId", jc.ItemId);
                                    sessionStorage.removeItem("PID"); // since no production yet

                                    navigate("/ProductionEntry");
                                  }}
                                >
                                  Start Production →
                                </button>
                              </div>
                            </div>
                          </div>
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

export default ProductionCrud;
