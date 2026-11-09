import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import api from '../../apiService';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function ImportCustomer() {
  const [excelData, setExcelData] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [selectedCategoryID, setSelectedCategoryID] = useState("");
  const fileInputRef = useRef(null);

  const isSubmitDisabled = excelData.length === 0 || loadingSubmit;

  const [categories] = useState([
    { id: 1, name: 'Default' },
      { id: 2, name: 'Medical Disposables' },
      { id: 3, name: 'Orthopedics Support' },
      { id: 4, name: 'Rehabilitation Products' },
      { id: 5, name: 'Oxygen Cylinders' },
      { id: 6, name: 'First Aid Products' },
      { id: 7, name: 'Surgical Equipments' },
      { id: 8, name: 'Medicine' },
      { id: 9, name: 'Medical Devices' },
  ]);

  const requiredColumns = [
    "ItemName",
    "ItemDescription",
    "MRP",
    "itemcolour",
    "itemsize",
    "SalePrice"
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("No data found in Excel file.");
        }
        setExcelData(data);
        setMessage("");
        setError("");
      } catch (err) {
        console.error("Error reading Excel file:", err);
        toast.error("Invalid Excel file. Please try again.");
        setExcelData([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  const CompanyID = parseInt(sessionStorage.getItem("CompanyID"), 10);
  const CreatedBy = parseInt(sessionStorage.getItem("UserId"), 10);
  const now = new Date().toISOString();

  setLoadingSubmit(true);
  setError("");
  setMessage("");

  let newExcelData = [...excelData];

  try {
    for (let i = 0; i < newExcelData.length; i++) {
      const row = newExcelData[i];

      if (!row.ItemName) {
        const errMsg = `Row ${i + 1} is missing required fields.`;
        toast.error(errMsg);
        setLoadingSubmit(false);
        return;
      }

      const formData = new FormData();
      formData.append("ItemID", 0);
      formData.append("ItemName", row.ItemName);
      formData.append("CompanyID", CompanyID);
      formData.append("CreatedBy", CreatedBy);
      formData.append("CreatedDate", now);
      formData.append("ModifiedBy", "");
      formData.append("ModifiedDate", "");
      formData.append("IsDeleted", 0);
      formData.append("TaxID", 3);
      formData.append("Tax", 5);
      formData.append("Sales_Price", row.SalePrice || 0);
      formData.append("MRP", row.MRP);
      formData.append("WholeSalePrice", row.WholeSalePrice || 0);
      formData.append("BPprice", row.BPprice || 0);
      formData.append("itmsize", row.itemsize || "");
      formData.append("itmcolr", row.itemcolour || "");
      formData.append("SP", row.SP || 0);
      formData.append("BatchId", 10);
      formData.append("BatchName", "May-2025");
      formData.append("ItemDescription", row.ItemDescription);
      formData.append("ItemCategoryID", selectedCategoryID);
      formData.append("ItemType", "1");
      formData.append("DeletedBy", "");
      formData.append("DeletedDateAndTime", "");

      await api.post("api/insertupdateitem", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Remove successfully inserted row
      newExcelData.splice(i, 1);
      i--; // Adjust index due to splice
      setExcelData([...newExcelData]); // Update state after removing
    }

    toast.success("Items imported successfully!");
    handleClear(); // Optional: call handleClear() if you want to reset category and file
  } catch (err) {
    console.error("Import error:", err);
    toast.error("Failed to import items.");
  } finally {
    setLoadingSubmit(false);
  }
};


  const handleClear = () => {
    setExcelData([]);
    setSelectedCategoryID("");
    setError("");
    setMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
                        <h2>Import Items via Excel</h2>

                        <div className="row mb-3">
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

                          <div className="col-md-3">
                            <label className="form-label">Item Category:</label>
                            <select
                              className="form-select"
                              value={selectedCategoryID}
                              onChange={(e) => setSelectedCategoryID(e.target.value)}
                              required
                            >
                              <option value="">Select Category</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={String(cat.id)}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          </div>

                        </div>

                        {/* Data Preview */}


                        <div className="mt-4">
                          <h4>Preview Data</h4>
                          <div
                            className="table-responsive"
                            style={{ maxHeight: "300px", overflowY: "auto" }}
                          >
                            <table className="table table-bordered">
                              <thead>
                                <tr>
                                  {requiredColumns.map((key) => (
                                    <th key={key}>{key}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {excelData.length > 0 ? (
                                  excelData.map((row, idx) => (
                                    <tr key={idx}>
                                      {requiredColumns.map((key) => (
                                        <td key={key}>{row[key] || ""}</td>
                                      ))}
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={requiredColumns.length} className="text-center">
                                      No data to display
                                    </td>
                                  </tr>
                                )}
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
