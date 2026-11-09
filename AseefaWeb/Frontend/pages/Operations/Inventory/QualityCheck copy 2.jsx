import React, { useEffect, useState, useRef } from "react";
import api from "../../apiService";
import Select from "react-select";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logo from "../../../src/assets/morelogo.jpg";

function QualityCheck() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const pdfRef = useRef();
  const [jobDetails, setJobDetails] = useState({
    jobCard: [],
    production: [],
    productiondetails: []
  });
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");

  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [qcCheckedUsers, setQcCheckedUsers] = useState([]);
  const [qcVerifiedUsers, setQcVerifiedUsers] = useState([]);

  const [qcData, setQcData] = useState({});

const [Locations, setLocation] = useState([]);

  const handleQcChange = (proAlloId, field, value) => {
    setQcData(prev => {
      const jobQc = prev[proAlloId] || {
        QcCheckedUserIds: [],
        QcVerifiedUserId: null,
        TableCleaning: false,
        Tray: false,
        HydrogenPeroxide: false,
        ClothHygienin: false,
        Vesselclean: false,
        SaltVisibility: false,
        Narration: "",
      };

      if (field === "QcChecked") {
        return {
          ...prev,
          [proAlloId]: { ...jobQc, QcCheckedUserIds: value ? value.map(v => v.value) : [] }
        };
      } else if (field === "QcVerified") {
        return {
          ...prev,
          [proAlloId]: { ...jobQc, QcVerifiedUserId: value ? value.value : null }
        };
      } else {
        return {
          ...prev,
          [proAlloId]: { ...jobQc, [field]: value }
        };
      }
    });
  };

 const generatePDF = () => {
    if (!selectedJob || jobDetails.jobCard.length === 0) {
      alert("Please select a job card first");
      return;
    }

    try {
      // Create or get the template element
      let qcElement = document.getElementById("qcTemplate");
      if (!qcElement) {
        qcElement = document.createElement("div");
        qcElement.id = "qcTemplate";
        qcElement.style.display = "none";
        document.body.appendChild(qcElement);
      }

      const storedCompanyData = sessionStorage.getItem("companyResponse");
      const companyData = storedCompanyData ? JSON.parse(storedCompanyData) : null;

      // Generate the QC content
      qcElement.innerHTML = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 15px; width: 100%; font-size: 10px; color: #333; box-sizing: border-box; background: #ffffff;">
          <!-- Header with Company Info, Logo, and Quality Check -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e0e0e0;">
            <!-- Company Info (Left) -->
            <div style="flex: 1; text-align: left;">
              <h1 style="margin: 0; font-size: 16px; font-weight: 700; color: #2c3e50;">${companyData?.CompanyName || 'Company Name'}</h1>
              <p style="margin: 4px 0 0; font-size: 10px; color: #666;">
                ${companyData?.Address || ''} ${companyData?.MobileNO ? `| ${companyData.MobileNO}` : ''}
                ${companyData?.GSTinNo ? `| GST: ${companyData.GSTinNo}` : ''}
              </p>
            </div>

            <!-- Company Logo (Center) -->
            <div style="flex: 1; text-align: center;">
              <img src="${logo}" 
                   alt="Company Logo" 
                   style="max-width: 120px; height: auto; display: block; margin: 0 auto;" />
            </div>
            
            <!-- Quality Check Info (Right) -->
            <div style="flex: 1; text-align: right;">
              <div style="text-align: right; align-self: center;">
                <h2 style="margin: 0; font-size: 14px; font-weight: 700; color: #2c3e50;">QUALITY CHECK REPORT</h2>
                <p style="margin: 2px 0 0; font-size: 8px; color: #666;">
                  ${new Date().toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          ${jobDetails.jobCard.map((jc, idx) => {
            const qc = qcData[jc.ProAlloId] || {};
            
            // Get user names
            const checkedNames = qcCheckedUsers
              .filter(u => (qc.QcCheckedUserIds || []).includes(u.value))
              .map(u => u.label)
              .join(", ") || "-";

            const verifiedName = 
              qcVerifiedUsers.find(u => u.value === qc.QcVerifiedUserId)?.label || "-";

            return `
              <!-- Job ${idx + 1} -->
              <div style="margin-bottom: ${idx < jobDetails.jobCard.length - 1 ? '20px' : '0'}; padding-bottom: ${idx < jobDetails.jobCard.length - 1 ? '15px' : '0'}; border-bottom: ${idx < jobDetails.jobCard.length - 1 ? '1px dashed #ccc' : 'none'};">
                <!-- Job Header -->
                <div style="background-color: #3498db; color: white; padding: 8px; border-radius: 4px; margin-bottom: 10px;">
                  <h3 style="margin: 0; font-size: 12px; font-weight: 700;">
                    Job #${idx + 1} • ${jc.ItemTypeName} (${jc.CardItemName})
                  </h3>
                </div>

                <!-- Key Info Grid -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px;">
                  <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 6px; background: #f8f9fa; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <p style="margin: 0 0 3px; font-size: 9px; color: #666; font-weight: 600;">JOB CARD ID</p>
                    <p style="margin: 0; font-size: 9px; font-weight: 600; color: #3498db;">${jc.JobCardId || "N/A"}</p>
                  </div>
                  <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 6px; background: #f8f9fa; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <p style="margin: 0 0 3px; font-size: 9px; color: #666; font-weight: 600;">BATCH #</p>
                    <p style="margin: 0; font-size: 9px; font-weight: 600; color: #2ecc71;">${jc.BatchNumber || "-"}</p>
                  </div>
                  <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 6px; background: #f8f9fa; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <p style="margin: 0 0 3px; font-size: 9px; color: #666; font-weight: 600;">QUANTITY</p>
                    <p style="margin: 0; font-size: 9px; font-weight: 600; color: #e74c3c;">${jc.Qty || "0"}</p>
                  </div>
                </div>

                <!-- Job Details -->
                <div style="margin-bottom: 10px; border: 1px solid #e0e0e0; border-radius: 4px; padding: 8px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                  <h4 style="margin: 0 0 6px; font-size: 10px; font-weight: 700; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 3px;">JOB DETAILS</h4>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 9px;">
                    <div>
                      <p style="margin: 0 0 3px;"><strong>Start Date:</strong> ${formatDateTime(jc.StartingDate) || "N/A"}</p>
                      <p style="margin: 0 0 3px;"><strong>End Date:</strong> ${formatDateTime(jc.EndingDate) || "N/A"}</p>
                      <p style="margin: 0 0 3px;"><strong>Duration:</strong> ${jc.Duration || "0"} hr</p>
                    </div>
                    <div>
                      <p style="margin: 0 0 3px;"><strong>ISO Batch:</strong> ${jc.ISOBatchNumber || "N/A"}</p>
                      <p style="margin: 0 0 3px;"><strong>Barcode:</strong> ${jc.BarcodeNumber || "N/A"}</p>
                      <p style="margin: 0 0 3px;"><strong>Department:</strong> ${jc.DepartmentName || "N/A"}</p>
                    </div>
                  </div>
                  <div style="margin-top: 6px; font-size: 9px;">
                    <p style="margin: 0 0 3px;"><strong>Allocated User:</strong> ${jc.AllocUserName || "N/A"}</p>
                    <p style="margin: 0;"><strong>Job Card Users:</strong> ${jc.UserNames || "N/A"}</p>
                  </div>
                </div>

                <!-- QC Personnel -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                  <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 8px; background: #f8f9fa; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                    <h4 style="margin: 0 0 6px; font-size: 10px; font-weight: 700; color: #2c3e50;">QC CHECKED BY</h4>
                    <p style="margin: 0; font-size: 9px;">${checkedNames}</p>
                  </div>
                  <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 8px; background: #f8f9fa; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                    <h4 style="margin: 0 0 6px; font-size: 10px; font-weight: 700; color: #2c3e50;">QC VERIFIED BY</h4>
                    <p style="margin: 0; font-size: 9px;">${verifiedName}</p>
                  </div>
                </div>

                <!-- QC Checks -->
                <div style="margin-bottom: 10px;">
                  <h4 style="margin: 0 0 6px; font-size: 10px; font-weight: 700; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 3px;">QUALITY CHECKS</h4>
                  <table style="width:100%; border-collapse: collapse; font-size: 9px; border: 1px solid #e0e0e0; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                    <thead>
                      <tr style="background-color: #f8f9fa;">
                        <th style="padding: 5px; border: 1px solid #e0e0e0; text-align: left; font-weight: 600;">Check Point</th>
                        <th style="padding: 5px; border: 1px solid #e0e0e0; text-align: center; font-weight: 600;">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style="padding: 5px; border: 1px solid #e0e0e0;">Table Cleaning</td>
                        <td style="padding: 5px; border: 1px solid #e0e0e0; text-align: center; color: ${qc.TableCleaning ? '#27ae60' : '#e74c3c'};">${qc.TableCleaning ? "✔ PASS" : "✘ FAIL"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px; border: 1px solid #e0e0e0;">Tray</td>
                        <td style="padding: 5px; border: 1px solid #e0e0e0; text-align: center; color: ${qc.Tray ? '#27ae60' : '#e74c3c'};">${qc.Tray ? "✔ PASS" : "✘ FAIL"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px; border: 1px solid #e0e0e0;">Hydrogen Peroxide</td>
                        <td style="padding: 5px; border: 1px solid #e0e0e0; text-align: center; color: ${qc.HydrogenPeroxide ? '#27ae60' : '#e74c3c'};">${qc.HydrogenPeroxide ? "✔ PASS" : "✘ FAIL"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px; border: 1px solid #e0e0e0;">Cloth Hygienin</td>
                        <td style="padding: 5px; border: 1px solid #e0e0e0; text-align: center; color: ${qc.ClothHygienin ? '#27ae60' : '#e74c3c'};">${qc.ClothHygienin ? "✔ PASS" : "✘ FAIL"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px; border: 1px solid #e0e0e0;">Vessel Clean</td>
                        <td style="padding: 5px; border: 1px solid #e0e0e0; text-align: center; color: ${qc.Vesselclean ? '#27ae60' : '#e74c3c'};">${qc.Vesselclean ? "✔ PASS" : "✘ FAIL"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px; border: 1px solid #e0e0e0;">Salt Visibility</td>
                        <td style="padding: 5px; border: 1px solid #e0e0e0; text-align: center; color: ${qc.SaltVisibility ? '#27ae60' : '#e74c3c'};">${qc.SaltVisibility ? "✔ PASS" : "✘ FAIL"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Narration -->
                <div style="margin-bottom: 10px; border: 1px solid #e0e0e0; border-radius: 4px; padding: 8px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                  <h4 style="margin: 0 0 6px; font-size: 10px; font-weight: 700; color: #2c3e50;">NARRATION</h4>
                  <p style="margin: 0; font-size: 9px; line-height: 1.4;">${qc.Narration || "No remarks provided"}</p>
                </div>

                <!-- Signatures -->
                <div style="display: flex; justify-content: space-between; margin-top: 15px; font-size: 9px; padding-top: 10px; border-top: 1px solid #eee;">
                  <div style="text-align: center; width: 30%;">
                    <div style="height: 30px; border-bottom: 1px solid #000; margin: 0 auto 5px; width: 80%;"></div>
                    <p style="margin: 0; font-weight: 600;">QC Checked By</p>
                  </div>
                  <div style="text-align: center; width: 30%;">
                    <div style="height: 30px; border-bottom: 1px solid #000; margin: 0 auto 5px; width: 80%;"></div>
                    <p style="margin: 0; font-weight: 600;">QC Verified By</p>
                  </div>
                  <div style="text-align: center; width: 30%;">
                    <div style="height: 30px; border-bottom: 1px solid #000; margin: 0 auto 5px; width: 80%;"></div>
                    <p style="margin: 0; font-weight: 600;">Production Manager</p>
                  </div>
                </div>
              </div>
            `;
          }).join('')}

          <!-- Footer -->
          <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee; font-size: 8px; color: #999; text-align: center;">
            Generated by Quality Check System on ${new Date().toLocaleString()}
          </div>
        </div>
      `;

      // Generate PDF
      qcElement.style.display = "block";
      qcElement.style.position = "absolute";
      qcElement.style.left = "-9999px";
      qcElement.style.width = "210mm";
      qcElement.style.boxSizing = "border-box";

      html2canvas(qcElement, {
        scale: 2,
        logging: false,
        useCORS: true,
        width: 794,
        windowWidth: 794
      }).then((canvas) => {
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4"
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
        
        // Add page breaks for multiple jobs
        if (jobDetails.jobCard.length > 1) {
          for (let i = 1; i < jobDetails.jobCard.length; i++) {
            pdf.addPage();
            // You could add additional content to subsequent pages if needed
          }
        }
        
        pdf.save(`QualityCheck_${selectedJob}_${new Date().toISOString().split('T')[0]}.pdf`);
        qcElement.style.display = "none";
      }).catch(error => {
        console.error("PDF generation error:", error);
        alert("Failed to generate PDF");
      });

    } catch (error) {
      console.error("Error in generatePDF:", error);
      alert("Failed to generate quality check PDF");
    }
  };


  const clearQc = () => {
    setQcData({});
  };

  const saveQcDetails = async (proAlloId, jobCardId, PID) => {
    const CompanyID = sessionStorage.getItem("CompanyID");
    const UserId = sessionStorage.getItem("UserId");
    try {
      const data = qcData[proAlloId];
      const payload = {
        JobCardId: jobCardId,
        ProductionId: proAlloId,
        QcChecked: data?.QcCheckedUserIds || [],
        QcVerified: data?.QcVerifiedUserId || null,
        TableCleaning: data?.TableCleaning || false,
        Tray: data?.Tray || false,
        HydrogenPeroxide: data?.HydrogenPeroxide || false,
        ClothHygienin: data?.ClothHygienin || false,
        Vesselclean: data?.Vesselclean || false,
        SaltVisibility: data?.SaltVisibility || false,
        Narration: data?.Narration || "",
        CompanyID,
        CreatedBy: UserId,
      };

      await api.post("/api/insertqualitycheck", payload);
      alert("QC details saved successfully ✅");
      clearQc();
    } catch (error) {
      console.error("Error saving QC details", error);
      alert("❌ Failed to save QC details");
    }
  };

  const departments = [...new Set(jobs.map(job => job.DepartmentName))];

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

      const options = res.data.map(u => ({
        value: u.UserId,
        label: u.Name
      }));

      setQcCheckedUsers(options);
      setQcVerifiedUsers(options);
    } catch (err) {
      setUsersError("Failed to load users");
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchQcDetails = async (jobCardId, proAlloId = null) => {
    try {
      const companyId = sessionStorage.getItem("CompanyID");
      const res = await api.get("/api/WebgetQcDetails", {
        params: {
          CompanyID: companyId,
          JobCardId: jobCardId,
          ProAlloId: proAlloId
        },
      });

      const qcRows = res.data || [];
      const mapped = {};
      qcRows.forEach(row => {
        mapped[row.ProductionId] = {
          QcCheckedUserIds: row.QcChecked ? row.QcChecked.split(",").map(Number) : [],
          QcVerifiedUserId: row.QcVerified ? Number(row.QcVerified) : null,
          TableCleaning: Number(row.TableCleaning) === 1,
          Tray: Number(row.Tray) === 1,
          HydrogenPeroxide: Number(row.HydrogenPeroxide) === 1,
          ClothHygienin: Number(row.ClothHygienin) === 1,
          Vesselclean: Number(row.Vesselclean) === 1,
          SaltVisibility: Number(row.SaltVisibility) === 1,
          Narration: row.Narration || "",
        };
      });
      setQcData(mapped);
    } catch (err) {
      console.error("Failed to fetch QC details", err);
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
    setSelectedJob(jobCardId);
    setDetailsLoading(true);
    try {
      const [res] = await Promise.all([
        api.get("/api/ProductionJobQcDetails", { params: { JobCardId: jobCardId } }),
        fetchQcDetails(jobCardId)
      ]);

      setJobDetails(res.data || { jobCard: [], production: [], productiondetails: [] });
    } catch (err) {
      console.error(err);
      setDetailsError("Failed to fetch job details");
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchUsers();
  }, []);


  const fetchlocation = async () => {
    try {
      setLoading(true);
     

      const res = await api.get("/api/Getlocation");

      setLocation(res.data || []);
    } catch (err) {
      setError("Failed to fetch location");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };



  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB");
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString();
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
                <div>
                  <button
                    onClick={generatePDF}
                    className="btn btn-success btn-sm me-2"
                  >
                    📄 PDF
                  </button>
                  <button
                    onClick={() => {
                      setSelectedJob(null);
                      setJobDetails({ jobCard: [], production: [], productiondetails: [] });
                    }}
                    className="btn btn-outline-secondary btn-sm"
                  >
                    × Clear
                  </button>
                </div>
              )}
            </div>

            {/* PDF Content Ref */}
            <div ref={pdfRef} className="p-4">
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
                        {/* Job Header */}
                        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                          <h5 className="mb-0 d-flex align-items-center">
                            <span>{`#${idx + 1} • ${jc.ItemTypeName}`}</span>
                            <span className="badge bg-light text-dark ms-2">{jc.CardItemName}</span>
                          </h5>
                          <span className="badge bg-light text-dark">Qty: {jc.Qty}</span>
                        </div>

                        <div className="card-body">
                          {/* Meta */}
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

                          {/* Status */}
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

                          {/* QC Section */}
                          {prod.length > 0 && (
                            <div className="mt-3">
                              <h6 className="text-secondary border-bottom pb-1">🔹 QC Checks</h6>
                              <div className="row">
                                <div className="col-md-4">
                                  {/* QC Checked */}
                                  <div className="mb-2">
                                    <label>Qc Checked</label>
                                    <Select
                                      options={qcCheckedUsers}
                                      isLoading={usersLoading}
                                      value={qcCheckedUsers.filter(u => (qcData[jc.ProAlloId]?.QcCheckedUserIds || []).includes(u.value))}
                                      onChange={(val) => handleQcChange(jc.ProAlloId, "QcChecked", val)}
                                      placeholder="Select QC Checked users..."
                                      isMulti
                                      closeMenuOnSelect={false}
                                    />
                                  </div>

                                  {/* QC Verified */}
                                  <div className="mb-2">
                                    <label>Qc Verified</label>
                                    <Select
                                      options={qcVerifiedUsers}
                                      isLoading={usersLoading}
                                      value={qcVerifiedUsers.find(u => u.value === qcData[jc.ProAlloId]?.QcVerifiedUserId) || null}
                                      onChange={(val) => handleQcChange(jc.ProAlloId, "QcVerified", val)}
                                      placeholder="Select QC Verified user..."
                                      isClearable
                                    />
                                  </div>
                                </div>

                                {/* QC Switches */}
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
                                        checked={Number(qcData[jc.ProAlloId]?.[field]) === 1}
                                        onChange={(e) =>
                                          handleQcChange(jc.ProAlloId, field, e.target.checked)
                                        }
                                      />
                                      <label className="form-check-label">{field}</label>
                                    </div>
                                  ))}
                                </div>

                                {/* Narration + Buttons */}
                                <div className="col-md-4">
                                  <div className="mb-2">
                                    <label>Narration</label>
                                    <textarea
                                      className="form-control"
                                      rows="3"
                                      value={qcData[jc.ProAlloId]?.Narration || ""}
                                      onChange={(e) => handleQcChange(jc.ProAlloId, "Narration", e.target.value)}
                                      placeholder="Enter remarks..."
                                    />
                                  </div>
                                  <div className="d-flex gap-2 mt-2">
                                    <button
                                      className="btn btn-primary"
                                      onClick={() => saveQcDetails(jc.ProAlloId, jc.JobCardId, prod[0]?.PID)}
                                    >
                                      💾 Save
                                    </button>
                                    <button className="btn btn-secondary" onClick={() => clearQc()}>❌ Clear</button>
                                  </div>
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
    </div>
  );
}

export default QualityCheck;