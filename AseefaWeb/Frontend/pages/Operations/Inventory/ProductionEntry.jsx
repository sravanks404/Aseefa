import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";  // ✅ Import navigate
import jsPDF from "jspdf";
import "jspdf-autotable";
import api from "../../apiService";
import html2canvas from "html2canvas";
import logo from "../../../src/assets/morelogo.jpg"; // Adjust path as needed

function ProductionEntry() {
  const navigate = useNavigate();  // ✅ Initialize navigate

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
const [toastMessage, setToastMessage] = useState("");
const [showToast, setShowToast] = useState(false);

  // 👇 store full respons
  const [jobDetails, setJobDetails] = useState({
    jobCard: [],
    production: [],
    productiondetails: [],
  });
  const [prod, setProd] = useState([]); // output
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
  const [selectedDetail, setSelectedDetail] = useState(null);

  // Get unique departments
  const departments = [...new Set(jobs.map((job) => job.DepartmentName))];

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.AllocNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.JobCardId.toString().includes(searchTerm);
    const matchesDepartment =
      filterDepartment === "all" || job.DepartmentName === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  // ✅ Fetch Job Details
  const fetchJobDetails = async () => {
    try {
      setDetailsLoading(true);

      const jobCardId = sessionStorage.getItem("JobCardId");
      const JCItemId = sessionStorage.getItem("JCItemId");
      const PID = sessionStorage.getItem("PID"); // 👈 Check if PID exists

      setSelectedJob(jobCardId);

      let details;

      if (PID) {
        // 👇 Fetch using PID
        const res = await api.get("/api/ProductionEntryDetails", {
          params: { PID: PID, JobCardId: jobCardId },
        });

        details =
          res.data || { jobCard: [], production: [], productiondetails: [] };
      } else {
        // 👇 Default fetch by JobCard + JCItem
        const res = await api.get("/api/ProductionJobIngredients", {
          params: { JobCardId: jobCardId, JCItemId },
        });

        details =
          res.data || { jobCard: [], production: [], productiondetails: [] };
      }

      // ✅ Update local states
      setJobDetails(details);
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
    fetchJobDetails();
  }, []);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString();
  };

  // --- ACTION HANDLERS ---
 const handleSaveProduction = async (jc) => {
  try {
    // 🔎 Validation before save
    for (const d of prodDetails) {
      const requiredQty = d.UsedQty || d.JBINGREQTY || 0;
      const availableQty = d.Available || 0;
      const batchName = d.BatchName || "N/A";

      if (!d.BatchId) {
        setToastMessage(`🚫 Please select a batch for ${d.INGREITEM}`);
        setShowToast(true);
        return; // ❌ Stop saving
      }

      if (requiredQty > availableQty) {
        setToastMessage(
          `🚫 Not enough stock in batch ${batchName} for ${d.INGREITEM}.
Required: ${requiredQty}, Available: ${availableQty}`
        );
        setShowToast(true);
        return; // ❌ Stop saving
      }
    }
setSaving(true);
setActionError(null);


      const payload = {
        PID: prod[0]?.PID || 0,
        ProductionNo: prod[0]?.ProductionNo || 0,
        JobCardId: jc.JobCardId,
        PDate: 0,
        Qty: prod[0]?.JBProductQTY || 0,
        CompanyID: parseInt(sessionStorage.getItem("CompanyID")),
        CreatedBy: parseInt(sessionStorage.getItem("UserID")),
        CreatedDate: new Date().toISOString(),
        ModifiedBy: null,
        ModifiedDate: null,
        ProductID: prod[0]?.JCItemId,
        IsDeleted: 0,
        FYearID: new Date().getFullYear(),
        //  BatchID: prodDetails[0]?.BatchId || null,   // ❌ REMOVE THIS
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
          BatchId: d.BatchId || null,   // ✅ Correctly assigned per item
          Unit: d.IngreunitId,
          TLC: d.TLC || 0,
          AvlQty: d.Available || 0,
          UsedQty: d.UsedQty || 0,
          BatchName: d.BatchName || null,
          CreatedBY: 1,
        })),
      };

      await api.post("/api/InsertUpdateProduction", payload);

      alert("✅ Production saved successfully!");
      fetchJobDetails();

      // ✅ Navigate after success
      navigate("/ProductionCrud"); // 🔹 Replace with your route
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

      const pid = prod[0]?.PID; // get the PID from production array
      if (!pid) {
        alert("No Production found to delete");
        return;
      }

      await api.post("/api/webDeleteProduction", { PID: pid });
      alert("🗑️ Production deleted!");
      navigate("/ProductionCrud");
      fetchJobDetails();
    } catch (err) {
      setActionError("Failed to delete production");
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  // Replace the generateProductionPDF function with this new implementation
  const generateProductionPDF = (jc, prod, prodDetails) => {
    try {
      // Create or get the template element
      let productionElement = document.getElementById("productionTemplate");
      if (!productionElement) {
        productionElement = document.createElement("div");
        productionElement.id = "productionTemplate";
        productionElement.style.display = "none";
        document.body.appendChild(productionElement);
      }

      const storedCompanyData = sessionStorage.getItem("companyResponse");
      const companyData = storedCompanyData ? JSON.parse(storedCompanyData) : null;

      // Calculate totals
      const totalQty = prod.reduce((sum, p) => sum + (Number(p.JBProductQTY) || 0), 0);
      const totalWaste = prod.reduce((sum, p) => sum + (Number(p.WasteQty) || 0), 0);
      const productionCost = prodDetails.reduce((sum, d) => sum + (Number(d.TLC) || 0), 0);
      const totalCost = prod.reduce(
        (sum, p) =>
          sum +
          productionCost +
          (Number(p.ExtraCost) || 0) +
          (Number(p.LabourCost) || 0),
        0
      );

      // Generate the production content
      productionElement.innerHTML = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 15px; width: 100%; font-size: 10px; color: #333; box-sizing: border-box; background: #ffffff;">
          <!-- Header with Company Info, Logo, and Production -->
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
            
            <!-- Production Info (Right) -->
            <div style="flex: 1; text-align: right;">
              <div style="text-align: right; align-self: center;">
                <h2 style="margin: 0; font-size: 14px; font-weight: 700; color: #2c3e50;">PRODUCTION REPORT</h2>
                <p style="margin: 2px 0 0; font-size: 8px; color: #666;">
                  ${formatDateTime(new Date()) || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <!-- Key Info Grid -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px;">
            <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 8px; background: #f8f9fa; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <p style="margin: 0 0 4px; font-size: 11px; color: #666; font-weight: 600;">JOB CARD ID</p>
              <p style="margin: 0; font-size: 10px; font-weight: 600; color: #3498db;">${jc.JobCardId || "N/A"}</p>
            </div>
            <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 8px; background: #f8f9fa; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <p style="margin: 0 0 4px; font-size: 11px; color: #666; font-weight: 600;">PRODUCT</p>
              <p style="margin: 0; font-size: 10px; font-weight: 600; color: #2ecc71;">${jc.CardItemName || "N/A"}</p>
            </div>
            <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 8px; background: #f8f9fa; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <p style="margin: 0 0 4px; font-size: 11px; color: #666; font-weight: 600;">ITEM TYPE</p>
              <p style="margin: 0; font-size: 10px; font-weight: 600; color: #e74c3c;">${jc.ItemTypeName || "N/A"}</p>
            </div>
          </div>

          <!-- Job Details -->
          <div style="margin-bottom: 15px; border: 1px solid #e0e0e0; border-radius: 5px; padding: 10px; background: #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <h3 style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 4px;">JOB DETAILS</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 10px;">
              <div>
                <p style="margin: 0 0 4px;"><strong>Start Date:</strong> ${formatDateTime(jc.StartingDate) || "N/A"}</p>
                <p style="margin: 0 0 4px;"><strong>End Date:</strong> ${formatDateTime(jc.EndingDate) || "N/A"}</p>
                <p style="margin: 0 0 4px;"><strong>Duration:</strong> ${jc.Duration || "0"} hr</p>
              </div>
              <div>
                <p style="margin: 0 0 4px;"><strong>ISO Batch:</strong> ${jc.ISOBatchNumber || "N/A"}</p>
                <p style="margin: 0 0 4px;"><strong>Batch:</strong> ${jc.BatchName || "N/A"}</p>
                <p style="margin: 0 0 4px;"><strong>Barcode:</strong> ${jc.BarcodeNumber || "N/A"}</p>
              </div>
            </div>
            <div style="margin-top: 8px; font-size: 10px;">
              <p style="margin: 0 0 4px;"><strong>Allocated User:</strong> ${jc.AllocUserName || "N/A"}</p>
              <p style="margin: 0;"><strong>Job Card User:</strong> ${jc.UserNames || "N/A"}</p>
            </div>
          </div>

          <!-- Ingredients Table -->
          <div style="margin-bottom: 15px;">
            <h3 style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 4px;">INGREDIENTS (INPUT)</h3>
            <table style="width:100%; border-collapse: collapse; font-size: 9px; border: 1px solid #e0e0e0; background: #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 6px; border: 1px solid #e0e0e0; text-align: left; font-weight: 600;">Ingredient</th>
                  <th style="padding: 6px; border: 1px solid #e0e0e0; text-align: right; font-weight: 600;">Req Qty</th>
                  <th style="padding: 6px; border: 1px solid #e0e0e0; text-align: left; font-weight: 600;">Batch</th>
                  <th style="padding: 6px; border: 1px solid #e0e0e0; text-align: right; font-weight: 600;">Used Qty</th>
                  <th style="padding: 6px; border: 1px solid #e0e0e0; text-align: right; font-weight: 600;">Available</th>
                  <th style="padding: 6px; border: 1px solid #e0e0e0; text-align: left; font-weight: 600;">Unit</th>
                  <th style="padding: 6px; border: 1px solid #e0e0e0; text-align: right; font-weight: 600;">LC</th>
                </tr>
              </thead>
              <tbody>
                ${prodDetails.map(pd => `
                  <tr>
                    <td style="padding: 6px; border: 1px solid #e0e0e0;">${pd.INGREITEM || "N/A"}</td>
                    <td style="padding: 6px; border: 1px solid #e0e0e0; text-align: right;">${pd.JBINGREQTY || "0"}</td>
                    <td style="padding: 6px; border: 1px solid #e0e0e0;">${pd.BatchName || "-"}</td>
                    <td style="padding: 6px; border: 1px solid #e0e0e0; text-align: right;">${pd.UsedQty || "0"}</td>
                    <td style="padding: 6px; border: 1px solid #e0e0e0; text-align: right;">${pd.Available || "0"}</td>
                    <td style="padding: 6px; border: 1px solid #e0e0e0;">${pd.INGREUNIT || "N/A"}</td>
                    <td style="padding: 6px; border: 1px solid #e0e0e0; text-align: right;">${pd.TLC || "0"}</td>
                  </tr>
                `).join('')}
                <tr style="background-color: #f8f9fa; font-weight: 600;">
                  <td style="padding: 6px; border: 1px solid #e0e0e0;" colspan="6">Total Ingredient Cost</td>
                  <td style="padding: 6px; border: 1px solid #e0e0e0; text-align: right;">${productionCost.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Output and Cost Details -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <!-- Output Table -->
            <div>
              <h3 style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 4px;">OUTPUT</h3>
              <table style="width:100%; border-collapse: collapse; font-size: 9px; border: 1px solid #e0e0e0; background: #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <thead>
                  <tr style="background-color: #f8f9fa;">
                    <th style="padding: 6px; border: 1px solid #e0e0e0; text-align: left; font-weight: 600;">Product</th>
                    <th style="padding: 6px; border: 1px solid #e0e0e0; text-align: right; font-weight: 600;">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  ${prod.map(p => `
                    <tr>
                      <td style="padding: 6px; border: 1px solid #e0e0e0;">${p.ProductItem || "N/A"}</td>
                      <td style="padding: 6px; border: 1px solid #e0e0e0; text-align: right;">${p.JBProductQTY || "0"}</td>
                    </tr>
                  `).join('')}
                  <tr style="background-color: #f8f9fa; font-weight: 600;">
                    <td style="padding: 6px; border: 1px solid #e0e0e0;">Total Output</td>
                    <td style="padding: 6px; border: 1px solid #e0e0e0; text-align: right;">${totalQty}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Cost Details -->
            <div>
              <h3 style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 4px;">COST DETAILS</h3>
              <table style="width:100%; border-collapse: collapse; font-size: 9px; border: 1px solid #e0e0e0; background: #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <thead>
                  <tr style="background-color: #f8f9fa;">
                    <th style="padding: 6px; border: 1px solid #e0e0e0; text-align: left; font-weight: 600;">Cost Type</th>
                    <th style="padding: 6px; border: 1px solid #e0e0e0; text-align: right; font-weight: 600;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding: 6px; border: 1px solid #e0e0e0;">Ingredient Cost</td>
                    <td style="padding: 6px; border: 1px solid #e0e0e0; text-align: right;">${productionCost.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px; border: 1px solid #e0e0e0;">Extra Cost</td>
                    <td style="padding: 6px; border: 1px solid #e0e0e0; text-align: right;">${prod[0]?.ExtraCost || "0"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px; border: 1px solid #e0e0e0;">Labour Cost</td>
                    <td style="padding: 6px; border: 1px solid #e0e0e0; text-align: right;">${prod[0]?.LabourCost || "0"}</td>
                  </tr>
                  <tr style="background-color: #f8f9fa; font-weight: 600;">
                    <td style="padding: 6px; border: 1px solid #e0e0e0;">Total Cost</td>
                    <td style="padding: 6px; border: 1px solid #e0e0e0; text-align: right;">${totalCost.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Summary Section -->
          <div style="margin-bottom: 15px; border: 1px solid #e0e0e0; border-radius: 5px; padding: 10px; background: #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <h3 style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 4px;">SUMMARY</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 10px;">
              <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 8px; background: #f8f9fa; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <p style="margin: 0 0 4px; font-size: 11px; color: #666; font-weight: 600;">TOTAL OUTPUT QTY</p>
                <p style="margin: 0; font-size: 10px; font-weight: 600; color: #3498db;">${totalQty}</p>
              </div>
              <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 8px; background: #f8f9fa; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <p style="margin: 0 0 4px; font-size: 11px; color: #666; font-weight: 600;">TOTAL WASTE</p>
                <p style="margin: 0; font-size: 10px; font-weight: 600; color: #e74c3c;">${totalWaste}</p>
              </div>
              <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 8px; background: #f8f9fa; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <p style="margin: 0 0 4px; font-size: 11px; color: #666; font-weight: 600;">TOTAL COST</p>
                <p style="margin: 0; font-size: 10px; font-weight: 600; color: #27ae60;">${totalCost.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <!-- Signatures -->
          <div style="display: flex; justify-content: space-between; margin-top: 20px; font-size: 10px; padding-top: 10px; border-top: 1px solid #eee;">
            <div style="text-align: center; width: 30%;">
              <div style="height: 40px; border-bottom: 1px solid #000; margin: 0 auto 6px; width: 80%;"></div>
              <p style="margin: 0; font-weight: 600;">Production Supervisor</p>
            </div>
            <div style="text-align: center; width: 30%;">
              <div style="height: 40px; border-bottom: 1px solid #000; margin: 0 auto 6px; width: 80%;"></div>
              <p style="margin: 0; font-weight: 600;">Quality Control</p>
            </div>
            <div style="text-align: center; width: 30%;">
              <div style="height: 40px; border-bottom: 1px solid #000; margin: 0 auto 6px; width: 80%;"></div>
              <p style="margin: 0; font-weight: 600;">Store Incharge</p>
            </div>
          </div>

          <!-- Footer -->
          <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee; font-size: 8px; color: #999; text-align: center;">
            Generated by Production System on ${new Date().toLocaleString()}
          </div>
        </div>
      `;

      // Generate PDF
      productionElement.style.display = "block";
      productionElement.style.position = "absolute";
      productionElement.style.left = "-9999px";
      productionElement.style.width = "210mm";
      productionElement.style.boxSizing = "border-box";

      html2canvas(productionElement, {
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
        pdf.save(`Production_${jc.JobCardId}_${new Date().toISOString().split('T')[0]}.pdf`);
        productionElement.style.display = "none";
      }).catch(error => {
        console.error("PDF generation error:", error);
        alert("Failed to generate PDF");
      });

    } catch (error) {
      console.error("Error in generateProductionPDF:", error);
      alert("Failed to generate production PDF");
    }
  };

  const handleClearProduction = (jc) => {
    setJobDetails((prev) => ({
      ...prev,
      production: prev.production.filter((p) => p.ItemID !== jc.ItemId),
      productiondetails: prev.productiondetails.filter(
        (pd) =>
          !prev.production.some(
            (p) => p.PID === pd.PID && p.ItemID === jc.ItemId
          )
      ),
    }));
  };

  return (
    <div className="container-fluid py-3 bg-light min-vh-100">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-white rounded shadow-sm">
        <h2 className="h3 mb-0 text-primary">Production</h2>
      </div>

      <div className="row g-3">
        {jobDetails.jobCard && jobDetails.jobCard.length > 0 ? (
          jobDetails.jobCard.map((jc, idx) => (
            <div
              key={jc.ProAlloId}
              className="mb-4 border rounded shadow-sm bg-white"
            >
              {/* ✅ Job Header */}
              <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0 d-flex align-items-center">
                  <span>{`#${idx + 1} • ${jc.ItemTypeName}`}</span>
                  <span className="badge bg-light text-dark ms-2">
                    {jc.CardItemName}
                  </span>
                </h5>
                <span className="badge bg-light text-dark">Qty: {jc.Qty}</span>
              </div>

              <div className="card-body">
                {/* ✅ Job Meta Info */}
                <div className="row mb-3">
                  <div className="col-md-4">
                    <strong>Job Start :</strong> {formatDateTime(jc.StartingDate)}
                  </div>
                  <div className="col-md-4">
                    <strong>Job End:</strong> {formatDateTime(jc.EndingDate)}
                  </div>
                  <div className="col-md-4">
                    <strong>Duration:</strong> {jc.Duration} hr
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-4">
                    <strong>ISO Batch #:</strong> {jc.ISOBatchNumber}
                  </div>
                  <div className="col-md-4">
                    <strong>Batch #:</strong> {jc.BatchName}
                  </div>
                  <div className="col-md-4">
                    <strong>Barcode #:</strong> {jc.BarcodeNumber}
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Allocated User:</strong> {jc.AllocUserName}
                  </div>
                  <div className="col-md-6">
                    <strong>Job card User :</strong> {jc.UserNames}
                  </div>
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

                {/* ✅ Production Details */}
                {prodDetails.length === 0 ? (
                  <div className="alert alert-warning py-2">
                    🚫 No Ingredients Created
                  </div>
                ) : (
                  <>
                    {/* Input Table */}
                    <div className="row">
                      <div className="col-md-12 mb-3">
                        <h6 className="text-secondary border-bottom pb-1">
                          🔹 Input (Production Details)
                        </h6>
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

                                        // store which row is being updated
                                        setSelectedDetail({
                                          jcId: jc.JCItemId,
                                          detailId: pd.IDID,
                                          rowIndex: index,   // 👈 save row index here
                                        });

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
                                    value={
                                      pd.UsedQty ?? pd.Available ?? ""
                                    }
                                    onChange={(e) => {
                                      const newVal =
                                        e.target.value === ""
                                          ? null
                                          : parseFloat(e.target.value);
                                      setProdDetails((prev) =>
                                        prev.map((d, i) =>
                                          i === index
                                            ? { ...d, UsedQty: newVal }
                                            : d
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
                        <h6 className="text-secondary border-bottom pb-1">
                          🔹 Output (Production)
                        </h6>
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
                                      const newVal =
                                        e.target.value === ""
                                          ? null
                                          : parseFloat(e.target.value);
                                      setProd((prev) =>
                                        prev.map((d, i) =>
                                          i === index
                                            ? { ...d, JBProductQTY: newVal }
                                            : d
                                        )
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
                                const productionCost = prodDetails.reduce(
                                  (sum, d) => sum + (Number(d.TLC) || 0),
                                  0
                                );
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
                                              i === index
                                                ? {
                                                  ...d,
                                                  WasteQty:
                                                    parseFloat(
                                                      e.target.value
                                                    ),
                                                }
                                                : d
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
                                              i === index
                                                ? {
                                                  ...d,
                                                  ExtraCost:
                                                    parseFloat(
                                                      e.target.value
                                                    ),
                                                }
                                                : d
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
                                              i === index
                                                ? {
                                                  ...d,
                                                  LabourCost:
                                                    parseFloat(
                                                      e.target.value
                                                    ),
                                                }
                                                : d
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
                        onClick={() => handleSaveProduction(jc)}
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

                      <button
                        className="btn btn-outline-dark btn-sm"
                        onClick={() => generateProductionPDF(jc, prod, prodDetails)}
                      >
                        📄 Download PDF
                      </button>
                    </div>

                    {actionError && (
                      <div className="text-danger mt-2">{actionError}</div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="alert alert-info">No Job Cards Found</div>
        )}
      </div>

      {showBatchModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Select Batch</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowBatchModal(false)}
                ></button>
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

                              const currentDetail = prodDetails.find(d => d.IDID === selectedDetail.detailId);
                              const requiredQty = currentDetail ? currentDetail.JBINGREQTY : 0;



                              // ✅ Update jobDetails
                              setJobDetails((prev) => ({
                                ...prev,
                                productiondetails: prev.productiondetails.map((d) =>
                                  d.IDID === selectedDetail.detailId
                                    ? { ...d, BatchId: b.BatchId, BatchName: b.BatchName, Available: b.BalanceStock, TLC: b.IngredientLc }
                                    : d
                                ),
                              }));

                              // ✅ Update prodDetails
                              setProdDetails((prev) =>
                                prev.map((d, i) =>
                                  i === selectedDetail.rowIndex
                                    ? { ...d, BatchId: b.BatchId, BatchName: b.BatchName, Available: b.BalanceStock, TLC: b.IngredientLc, UsedQty: d.JBINGREQTY }
                                    : d
                                )
                              );

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

{/* 🔔 Toast Notification */}
<div
  className="toast-container position-fixed bottom-0 end-0 p-3"
  style={{ zIndex: 9999 }}
>
  <div
    className={`toast align-items-center text-white bg-danger border-0 ${showToast ? "show" : "hide"}`}
    role="alert"
  >
    <div className="d-flex">
      <div className="toast-body">{toastMessage}</div>
      <button
        type="button"
        className="btn-close btn-close-white me-2 m-auto"
        onClick={() => setShowToast(false)}
      ></button>
    </div>
  </div>
</div>

    </div >


  );
}

export default ProductionEntry;
