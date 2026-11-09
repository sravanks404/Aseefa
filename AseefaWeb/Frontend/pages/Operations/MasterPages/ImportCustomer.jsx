import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import api from '../../apiService';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function ImportCustomer() {
  const [excelData, setExcelData] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [defaultRoute, setDefaultRoute] = useState("");
  const [defaultRateType, setDefaultRateType] = useState("");
  const [defaultCustomerType, setDefaultCustomerType] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const fileInputRef = useRef(null);

  const isSubmitDisabled = excelData.length === 0 || loadingSubmit;

  const requiredColumns = [
    "Customer",
    "Address",
    "Place",
    "District",
    "State",
    "PinNo",
    "GSTinNo",
    "Phone",
    "Mobile",
    "Email",
  ];

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await api.get("api/GetRouteName");
        setRoutes(response.data);
      } catch (err) {
        console.error("Failed to fetch routes:", err);
      }
    };
    fetchRoutes();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);
      setExcelData(data);
      setMessage("");
      setError("");
    };
    reader.readAsBinaryString(file);
  };

  const generateSuitAppsId = () => {
    const now = new Date();
    const pad = (n, w = 2) => n.toString().padStart(w, "0");
    const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${pad(now.getMilliseconds(), 3)}`;
    const { FYearID } = JSON.parse(sessionStorage.getItem("financialResponse"));
    return `WEB-${datePart}-${timePart}-${FYearID}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!defaultRoute || !defaultRateType || !defaultCustomerType) {
      const errMsg = "Please select Route, Rate Type, and Customer Type.";
       toast.error(errMsg);
      //alert(errMsg);
      return;
    }

    const CompanyID = parseInt(sessionStorage.getItem("CompanyID"), 10);
    const CreatedBy = parseInt(sessionStorage.getItem("UserId"), 10);
    const now = new Date().toISOString();

    setLoadingSubmit(true);
    setError("");
    setMessage("");

    try {
      for (const [index, row] of excelData.entries()) {
        // Validate required fields
        if (!row.Customer ) {
          const errMsg = `Row ${index + 1} is missing required fields: Customer, Address, Place, or Mobile.`;
           toast.error(errMsg);
          //alert(errMsg);
          setLoadingSubmit(false);
          return;
        }

        const payload = {
          AccountID: 0,
          AccountParent: 14,
          SuitAppsId: generateSuitAppsId(),
          Type: "",
          CompanyID,
          CreatedBy,
          CreatedDate: now,
          IsDeleted: 0,
          CreatedDateAndTime: now,
          AccountName: row.Customer,
          Address: row.Address,
          Email: row.Email || "",
          Phone: row.Phone || "",
          Mob: row.Mobile,
          city: row.city || "",
          country: row.country || "",
          PinNo: row.PinNo || "",
          GSTinNo: row.GSTinNo || "",
          Place: row.Place,
          RootId: defaultRoute,
          RateType: defaultRateType,
          CustomerType: defaultCustomerType,
        };

        await api.post("/api/insertaccountexcel", payload);
      }

      const successMsg = "Accounts imported successfully!";
      toast.success(successMsg);
      //alert(successMsg);
      handleClear();
    } catch (err) {
      console.error("Import error:", err);
      const failMsg = "Failed to import accounts.";
      toast.error(failMsg);
      //alert(failMsg);
    } finally {
      setLoadingSubmit(false);
    }
  };


  const handleClear = () => {
    setExcelData([]);
    setDefaultRoute("");
    setDefaultRateType("");
    setDefaultCustomerType("");
    setError("");
    setMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="page-wrapper">
      <div className="container-fluid"></div>
<ToastContainer position="top-center" autoClose={3000} />
      <div className="page-body">
        <div className="container-fluid">
          <div className="row row-cards">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <form className="Account-form" onSubmit={handleSubmit}>
                    <div className="row g-4">
                      <div className="container mt-4">
                        <h2>Import Customers via Excel</h2>

                        <div className="row mb-4">

                          {/* File Upload */}
                          <div className="col-md-3">
                            <label className="form-label">Upload Excel File:</label>
                            <input
                              type="file"
                              accept=".xlsx, .xls"
                              onChange={handleFileUpload}
                              className="form-control"
                              ref={fileInputRef}
                            />
                          </div>

                          {/* Route Dropdown */}
                          <div className="col-md-3">
                            <label className="form-label">Route:</label>
                            <select
                              className="form-select"
                              value={defaultRoute}
                              onChange={(e) => setDefaultRoute(e.target.value)}
                              required
                            >
                              <option value="">Select Route</option>
                              {routes.map((r) => (
                                <option key={r.RouteID} value={r.RouteID}>
                                  {r.RouteName}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Rate Type Dropdown */}
                          <div className="col-md-3">
                            <label className="form-label">Rate Type:</label>
                            <select
                              className="form-select"
                              value={defaultRateType}
                              onChange={(e) => setDefaultRateType(e.target.value)}
                              required
                            >
                              <option value="">Select Rate Type</option>
                              <option value="CCP">CCP</option>
                              <option value="SP">SP</option>
                              <option value="DP">DP</option>
                              <option value="MRP">MRP</option>
                            </select>
                          </div>

                          {/* Customer Type Dropdown */}
                          <div className="col-md-3">
                            <label className="form-label">Customer Type:</label>
                            <select
                              className="form-select"
                              value={defaultCustomerType}
                              onChange={(e) => setDefaultCustomerType(e.target.value)}
                              required
                            >
                              <option value="">Select Customer Type</option>
                              <option value="0">Retail</option>
                              <option value="1">Wholesale</option>
                              <option value="2">Supermarket</option>
                              <option value="3">Distributor</option>
                              <option value="4">Other</option>
                            </select>
                          </div>
                        </div>

                        {/* Data Preview */}
                        <div className="mt-4">
                          <h4>Preview Data</h4>
                          <div className="table-responsive">
                            <table className="table table-bordered">
                              <thead>
                                <tr>
                                  {requiredColumns.map((key) => (
                                    <th key={key}>{key}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {excelData.map((row, idx) => (
                                  <tr key={idx}>
                                    {requiredColumns.map((key) => (
                                      <td key={key}>{row[key] || ""}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="form-footer d-flex justify-content-center mt-4 gap-3 flex-wrap">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitDisabled}
                      >
                        {loadingSubmit ? "Submitting..." : "Submit"}
                      </button>

                      <button type="button" className="btn btn-secondary" onClick={handleClear}>
                        Clear
                      </button>
                    </div>

                    {/* Status Messages */}
                    {/* {error && <div className="alert alert-danger mt-3">{error}</div>}
                    {message && <div className="alert alert-success mt-3">{message}</div>} */}
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImportCustomer;
