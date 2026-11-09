import React, { useState, useEffect } from "react";
import api from "../../apiService";
import { FaSearch } from "react-icons/fa";

const StockTransfer = () => {
  const getCurrentDate = () => new Date().toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(getCurrentDate());
  const [vehicleData, setVehicleData] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVanId, setSelectedVanId] = useState("");
  const [result, setResult] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editableValues, setEditableValues] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ show: false, type: "", message: "" });

  useEffect(() => {
    const storedDate = sessionStorage.getItem("SelectedDate");
    const storedVehicle = sessionStorage.getItem("VID");

    if (storedDate && storedVehicle) {
      const formattedDate = new Date(storedDate).toISOString().split("T")[0];
      setFromDate(formattedDate);
      setSelectedVanId(storedVehicle);
      fetchStockReport(formattedDate, storedVehicle);
    }
    fetchBranches();
    fetchVehicleData();
  }, []);

  const handleEditChange = (itemID, value) => {
    setEditableValues(prev => {
      const newValues = { ...prev };
      newValues[itemID] = value === "" || value === null ? "" : Number(value);
      return newValues;
    });
  };

const handleBulkInsert = async () => {
  if (!window.confirm(`Are you sure you want to transfer stock for the date ${fromDate}?`)) return;

  try {
    if (result.length === 0) {
      setAlertMsg({ show: true, type: "warning", message: "No items to update" });
      return;
    }

    setIsUpdating(true);

    const companyID = sessionStorage.getItem("CompanyID");
    const userID = sessionStorage.getItem("UserID");

    // ✅ Use all rows in result, not filteredResults
    const mergedItems = result.map(item => {
      const itemIDKey = String(item.ItemID);
      const transferQty = editableValues[itemIDKey] !== undefined ? Number(editableValues[itemIDKey]) : 0;
      const totalStock = (item.NetStock || 0) + transferQty;

      return {
        Date: fromDate,
        VanId: parseInt(selectedVanId),
        ItemId: item.ItemID,
        Stock: totalStock,
        VTStock: transferQty,
        Returnqty: 0,
        UserId: item.UserID
      };
    });

    const response = await api.post("/api/BulkInsertVanLoadingTVP", {
      items: mergedItems,
      companyID: parseInt(companyID),
      userID: parseInt(userID)
    });

    if (response.data.Status === "Success") {
      setAlertMsg({
        show: true,
        type: "success",
        message: `${response.data.RowsInserted || mergedItems.length} items transferred successfully for ${fromDate}`
      });
      fetchStockReport(fromDate, selectedVanId);
    } else {
      setAlertMsg({ show: true, type: "danger", message: response.data.Message || "Unknown error" });
    }

    setTimeout(() => setAlertMsg(prev => ({ ...prev, show: false })), 3000);
  } catch (error) {
    console.error("Error in bulk insert:", error);
    setAlertMsg({ show: true, type: "danger", message: error.response?.data?.Message || error.message });
    setTimeout(() => setAlertMsg(prev => ({ ...prev, show: false })), 3000);
  } finally {
    setIsUpdating(false);
  }
};

  const fetchBranches = async () => {
    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      const response = await api.get(`/api/getbranch`, { params: { CompanyID } });
      setBranches(response.data || []);
    } catch (err) {
      console.error("Error fetching branch data:", err);
      setError("Failed to load branch data.");
    }
  };

  const fetchVehicleData = async () => {
    try {
      const response = await api.get(`/api/GetVehicleMaster`);
      const vehicles = Array.isArray(response.data) ? response.data : [];
      const uniqueVehicles = vehicles.reduce((acc, current) => {
        if (!acc.some(item => item.VID === current.VID)) acc.push(current);
        return acc;
      }, []);
      setVehicleData(uniqueVehicles);
      setFilteredVehicles(uniqueVehicles);
    } catch (err) {
      console.error("Error fetching vehicle data:", err);
      setError("Failed to load vehicle data.");
    }
  };

  const fetchStockReport = async (date, vanId) => {
    setIsLoading(true);
    try {
      const companyID = sessionStorage.getItem("CompanyID");
      if (!companyID || !date || !vanId) {
        setError("Please fill all required fields.");
        setIsLoading(false);
        return;
      }
      const formattedDate = new Date(date).toISOString().split("T")[0];
      const response = await api.get(`/api/getStockTransferItem`, {
        params: { VanId: vanId, Date: formattedDate, companyID },
      });
      const data = response?.data?.data?.[0] || [];
      setResult(data);
      setEditableValues({});
      setError("");
    } catch (err) {
      console.error("Error fetching stock report:", err);
      setError("Failed to load stock report.");
      setResult([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sessionStorage.setItem("SelectedDate", fromDate);
    sessionStorage.setItem("VID", selectedVanId);
    sessionStorage.setItem("BranchID", selectedBranch);
    fetchStockReport(fromDate, selectedVanId);
  };

  const filteredResults = result.filter((item) =>
    item.ItemName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-fluid">
      {/* Form Card */}
      <div className="card shadow-sm">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3 align-items-end">
              <div className="col-md-2">
                <label htmlFor="FromDate" className="fw-bold">Vanloading Date</label>
                <input type="date" id="FromDate" className="form-control"
                  value={fromDate} onChange={(e) => setFromDate(e.target.value)} required />
              </div>

              <div className="col-md-2">
                <label htmlFor="Branch" className="fw-bold">Branch</label>
                <select id="Branch" className="form-control"
                  value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} required>
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.BranchID} value={branch.BranchId}>{branch.BranchName}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <label htmlFor="VanDate" className="fw-bold">Vehicle</label>
                <select id="VanDate" className="form-control"
                  value={selectedVanId} onChange={(e) => setSelectedVanId(e.target.value)}
                  required disabled={!selectedBranch}>
                  <option value="">Select vehicle</option>
                  {filteredVehicles.map(vehicle => (
                    <option key={vehicle.VID} value={vehicle.VID}>{vehicle.VRegNo}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-3 d-flex gap-2 align-items-center">
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? "Generating..." : "Generate"}
                </button>
                <button type="button" className="btn btn-success"
                  onClick={handleBulkInsert} disabled={isUpdating || filteredResults.length === 0}>
                  {isUpdating ? "Updating..." : "Update Stock"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* ✅ Alert Message */}
      {alertMsg.show && (
        <div className={`alert alert-${alertMsg.type} alert-dismissible fade show mt-3`} role="alert">
          {alertMsg.message}
          <button type="button" className="btn-close"
            onClick={() => setAlertMsg({ ...alertMsg, show: false })}></button>
        </div>
      )}

      {/* Table Card */}
      <div className="card mt-3">
        <div className="card-body">
          {isLoading ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <div className="mt-2">Loading stock data...</div>
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : result.length > 0 ? (
            <div className="table-responsive">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="input-group" style={{ maxWidth: "300px" }}>
                  <span className="input-group-text bg-primary text-white"><FaSearch /></span>
                  <input type="text" className="form-control" placeholder="Search by Item Name..."
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="text-muted">Showing {filteredResults.length} of {result.length} items</div>
              </div>

              <div style={{ maxHeight: '500px', overflowY: 'auto', overflowX: 'auto' }}>
                <table className="table table-bordered table-hover">
                  <thead className="table-primary" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th className="text-center">SI.No</th>
                      <th className="text-center">Item ID</th>
                      <th>Item Name</th>
                      <th className="text-end">Net Stock</th>
                      <th className="text-end">Transfer Stock</th>
                      <th className="text-end hidden">UserId</th>
                      <th className="text-end">Total Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((item, index) => {
                      const itemIDKey = String(item.ItemID);
                      const currentValue = editableValues[itemIDKey];
                      const adjustQty = currentValue !== undefined && currentValue !== "" ? Number(currentValue) : 0;
                      const totalStock = (item.NetStock || 0) + adjustQty;

                      return (
                        <tr key={itemIDKey}>
                          <td className="text-center">{index + 1}</td>
                          <td className="text-center">{item.ItemID}</td>
                          <td>{item.ItemName}</td>
                          <td className="text-end">{(item.NetStock || 0).toFixed(2)}</td>
                          <td className="text-end">
                            <input type="number" className="form-control form-control-sm text-end"
                              value={currentValue !== undefined ? currentValue : ""}
                              onChange={(e) => handleEditChange(item.ItemID, e.target.value)}
                              style={{ width: '100px', display: 'inline-block' }} step="0.01" min="0" />
                          </td>
                          <td className="text-end hidden">{item.UserID}</td>
                          <td className="text-end fw-bold">{totalStock.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="table-secondary fw-bold">
                    <tr>
                      <td colSpan="3" className="text-center">Total</td>
                      <td className="text-end">
                        {filteredResults.reduce((sum, item) => sum + (item.NetStock || 0), 0).toFixed(2)}
                      </td>
                      <td className="text-end">
                        {filteredResults.reduce((sum, item) => {
                          const val = editableValues[String(item.ItemID)];
                          return sum + (val !== undefined && val !== "" ? Number(val) : 0);
                        }, 0).toFixed(2)}
                      </td>
                      <td></td>
                      <td className="text-end">
                        {filteredResults.reduce((sum, item) => {
                          const val = editableValues[String(item.ItemID)];
                          const adjustQty = val !== undefined && val !== "" ? Number(val) : 0;
                          return sum + (item.NetStock || 0) + adjustQty;
                        }, 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted py-4">
              <p>No data available. Please select criteria and generate report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockTransfer;