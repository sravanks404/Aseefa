import React, { useState, useEffect } from "react";
import api from "../../apiService";
import { FaSearch, FaFileExcel, FaPrint } from "react-icons/fa";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';


const VanloadingReportdatewise = () => {
  const getCurrentDate = () => new Date().toISOString().split("T")[0];

  // ✅ State Variables
  const [fromDate, setFromDate] = useState();
  const [toDate, setToDate] = useState(getCurrentDate)
  const [VehicleData, setVehicleData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVanId, setSelectedVanId] = useState("");
  const [result, setResult] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState([]);
  const [selectedItemDetails, setSelectedItemDetails] = useState({}); // { itemId: [data...] }
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);

  // ✅ Automatically fetch stored date and vehicle on component mount
  useEffect(() => {
    const storedDate = sessionStorage.getItem("SelectedDate");
    const storedVehicle = sessionStorage.getItem("VID");

    if (storedDate && storedVehicle) {

      // ✅ Convert date format from `2025-03-12T00:00:00.000Z` to `YYYY-MM-DD`
      //const formattedDate = new Date(storedDate).toISOString().split("T")[0];

      setFromDate();
      setSelectedVanId(storedVehicle);
      fetchStockReport(getCurrentDate, storedVehicle);
    } else {
      fetchVehicleData();
    }
  }, []);

  // ✅ Fetch Stock Report
  const fetchStockReport = async (fromDate, toDate, vanId) => {
    setIsLoading(true);

    try {
      const CompanyID = sessionStorage.getItem("CompanyID");

      if (!CompanyID || !fromDate || !toDate || !vanId) {
        console.error("Missing required parameters");
        setError("Please fill all required fields.");
        setIsLoading(false);
        return;
      }

      const formattedFromDate = new Date(fromDate).toISOString().split("T")[0];
      const formattedToDate = new Date(toDate).toISOString().split("T")[0];

      const response = await api.get(`/api/getVanstockByDate`, {
        params: {
          VanId: vanId,
          Date: formattedFromDate,
          ToDate: formattedToDate,
          CompanyID,
        }
      });

      const data = response?.data || [];

      setResult(data);
      setError("");
    } catch (err) {
      console.error("Error fetching stock report:", err);
      setError("Failed to load stock report.");
      setResult([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      const response = await api.get(`/api/getbranch`, {
        params: { CompanyID }
      });
      setBranches(response.data || []);
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  };


  // ✅ Fetch Vehicle Data
  const fetchVehicleData = async () => {
    try {
      const response = await api.get(`/api/GetVehicleMaster`);
      const uniqueVehicles = response.data?.reduce((acc, current) => {
        if (!acc.find((item) => item.VID === current.VID)) {
          acc.push(current);
        }
        return acc;
      }, []);

      setVehicleData(uniqueVehicles || []);
    } catch (err) {
      console.error("Error fetching vehicle data:", err);
      setError("Failed to load vehicle data.");
    }
  };


  const fetchVTStockByDate = async (ItemID) => {
    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      if (!CompanyID) return;

      const formattedFromDate = new Date(fromDate).toISOString().split("T")[0];
      const formattedToDate = new Date(toDate).toISOString().split("T")[0];
      const response = await api.get("/api/get-vtstock", {
        params: {
          vanId: selectedVanId,
          ItemID,
          fromDate: formattedFromDate,
          toDate: formattedToDate,
        },
      });
      return response.data || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  };



  useEffect(() => {
    fetchVehicleData();
    fetchBranches();
  }, []);


  // const filteredVehicles = selectedBranch
  // ? VehicleData.filter(vehicle => vehicle.BranchId === selectedBranch)
  // : [];


  // ✅ Handle Form Submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // ✅ Store selected values in session storage
    sessionStorage.setItem("SelectedDate", fromDate);
    sessionStorage.setItem("VID", selectedVanId);  // Store VID

    fetchStockReport(fromDate, toDate, selectedVanId); // ✅ CORRECT

  };

  const handleClear = () => {
    sessionStorage.removeItem("SelectedDate");
    sessionStorage.removeItem("VID");

    setFromDate("");
    setToDate(getCurrentDate)
    setSelectedVanId("");
    setResult([]);
  };

  const filteredData = result.filter(item =>
    item.ItemName?.toLowerCase().includes(searchTerm.toLowerCase())
  );


 const exportToExcel = () => {
  if (result.length === 0) {
    console.warn("No data to export.");
    return;
  }

  const vehicle = VehicleData.find((v) => v.VID == selectedVanId);
  const vehicleName = vehicle ? vehicle.VRegNo : "N/A";
  const salesmanName = result[0]?.UserName || "N/A";

  // Header Information
  const header = [
    ["Vanloading Stock Report"],
    [`From Date: ${fromDate}`],
    [`To Date: ${toDate}`],
    [`Salesman: ${salesmanName}`],
    [`Vehicle: ${vehicleName}`],
    [],
    [
      "S.No",
      "Item Name",
      "Van OS",
      "BpPrice",
      "BpPriceQty",
      "Return Qty",
      "Good Stock",
      "Damaged Qty",
      "Replaced Qty",
      "Sale",
      "Free Qty",
      "Net Stock",
      "Vt Stock"
    ],
  ];

  // Table data
  const tableData = result.map((item, index) => [
    index + 1,
    item.ItemName,
    item.Stock?.toFixed(2),
    item.BPprice?.toFixed(2),
    item.BPValue?.toFixed(2),
    item.RetQty?.toFixed(2),
    item.GoodStock?.toFixed(2),
    item.DmgedQty?.toFixed(2),
    item.ReplacedQty?.toFixed(2),
    item.SoldQty?.toFixed(2),
    item.FreeSoldQty?.toFixed(2),
    item.NetStock?.toFixed(2),
    item.VtStock?.toFixed(2),
  ]);

  // Totals row
  const totalRow = [
    "Total",
    "",
    result.reduce((acc, item) => acc + (item.Stock || 0), 0).toFixed(2),
    result.reduce((acc, item) => acc + (item.BPprice || 0), 0).toFixed(2),
    result.reduce((acc, item) => acc + (item.BPValue || 0), 0).toFixed(2),
    result.reduce((acc, item) => acc + (item.RetQty || 0), 0).toFixed(2),
    result.reduce((acc, item) => acc + (item.GoodStock || 0), 0).toFixed(2),
    result.reduce((acc, item) => acc + (item.DmgedQty || 0), 0).toFixed(2),
    result.reduce((acc, item) => acc + (item.ReplacedQty || 0), 0).toFixed(2),
    result.reduce((acc, item) => acc + (item.SoldQty || 0), 0).toFixed(2),
    result.reduce((acc, item) => acc + (item.FreeSoldQty || 0), 0).toFixed(2),
    result.reduce((acc, item) => acc + (item.NetStock || 0), 0).toFixed(2),
    result.reduce((acc, item) => acc + (item.VtStock || 0), 0).toFixed(2),
  ];

  tableData.push(totalRow);

  const worksheet = XLSX.utils.aoa_to_sheet([...header, ...tableData]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Vanloading Report");

  XLSX.writeFile(workbook, `Vanloading_Report_${fromDate}.xlsx`);
};

  // ✅ Export to PDF
const exportToPDF = () => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

    const vehicle = VehicleData.find((v) => v.VID == selectedVanId);
    const vehicleName = vehicle ? vehicle.VRegNo : "N/A";
    const salesmanName = result[0]?.UserName || "N/A";

  // Header
  doc.setFontSize(14);
  doc.text("Vanloading Stock Report", 14, 10);
  doc.setFontSize(10);
  doc.text(`From Date: ${fromDate}`, 14, 16);
  doc.text(`To Date: ${toDate}`, 14, 21);
  doc.text(`Salesman: ${salesmanName}`, 14, 26);
  doc.text(`Vehicle: ${vehicleName}`, 14, 31);

  const tableColumn = [
    "S.No",
    "Item Name",
    "Van OS",
    "BpPrice",
    "BpPriceQty",
    "Return Qty",
    "Good Stock",
    "Damaged Qty",
    "Replaced Qty",
    "Sale",
    "Free Qty",
    "Net Stock",
    "Vt Stock"
  ];

  const tableRows = result.map((item, index) => [
    index + 1,
    item.ItemName,
    item.Stock?.toFixed(2),
    item.BPprice?.toFixed(2),
    item.BPValue?.toFixed(2),
    item.RetQty?.toFixed(2),
    item.GoodStock?.toFixed(2),
    item.DmgedQty?.toFixed(2),
    item.ReplacedQty?.toFixed(2),
    item.SoldQty?.toFixed(2),
    item.FreeSoldQty?.toFixed(2),
    item.NetStock?.toFixed(2),
    item.VtStock?.toFixed(2),
  ]);

  // Totals row
  const totalRow = [
    "Total",
    "",
    result.reduce((acc, item) => acc + (item.Stock || 0), 0).toFixed(2),
    result.reduce((acc, item) => acc + (item.BPprice || 0), 0).toFixed(2),
    result.reduce((acc, item) => acc + (item.BPValue || 0), 0).toFixed(2),
    result.reduce((acc, item) => acc + (item.RetQty || 0), 0).toFixed(2),
    result.reduce((acc, item) => acc + (item.GoodStock || 0), 0).toFixed(2),
    result.reduce((acc, item) => acc + (item.DmgedQty || 0), 0).toFixed(2),
    result.reduce((acc, item) => acc + (item.ReplacedQty || 0), 0).toFixed(2),
    result.reduce((acc, item) => acc + (item.SoldQty || 0), 0).toFixed(2),
    result.reduce((acc, item) => acc + (item.FreeSoldQty || 0), 0).toFixed(2),
    result.reduce((acc, item) => acc + (item.NetStock || 0), 0).toFixed(2),
    result.reduce((acc, item) => acc + (item.VtStock || 0), 0).toFixed(2),
  ];

    tableRows.push(totalRow);

  // Generate PDF Table
  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 38,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [14, 83, 151],
      textColor: 255,
    },
    didDrawCell: (data) => {
      if (data.row.index === tableRows.length - 1) {
        doc.setFont("helvetica", "bold");
      }
    },
  });

  doc.save(`Vanloading_Report_${fromDate}.pdf`);
};



  const handleRowClick = async (ItemID) => {
    if (expandedRows.includes(ItemID)) {
      // Collapse
      setExpandedRows(expandedRows.filter((id) => id !== ItemID));
    } else {
      // Expand and fetch
      if (!selectedItemDetails[ItemID]) {
        const data = await fetchVTStockByDate(ItemID);
        setSelectedItemDetails((prev) => ({ ...prev, [ItemID]: data }));
      }
      setExpandedRows([...expandedRows, ItemID]);
    }
  };


  return (
    <div className="container-fluid">
      <div className="card shadow-sm">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3 align-items-end">
              <h5 className="page-title text-primary">Vanloading Stock Report</h5>

              {/* Vanloading Date */}
              <div className="col-md-2">
                <label htmlFor="FromDate" className="fw-bold">Vanloading From Date</label>
                <input
                  type="date"
                  id="FromDate"
                  className="form-control"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-2">
                <label htmlFor="ToDate" className="fw-bold">Vanloading To Date</label>
                <input
                  type="date"
                  id="ToDate"
                  className="form-control"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  required
                />
              </div>

              {/* Branch Dropdown */}
              <div className="col-md-2">
                <label htmlFor="Branch" className="fw-bold">Branch</label>
                <select
                  id="Branch"
                  className="form-control"
                  value={selectedBranch || ""}
                  onChange={(e) => setSelectedBranch(Number(e.target.value))}
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.BranchID} value={branch.BranchId}>
                      {branch.BranchName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle Dropdown */}
              {/* Vehicle Dropdown */}
              <div className="col-md-2">
                <label htmlFor="VanDate" className="fw-bold">Vehicle</label>
                <select
                  id="VanDate"
                  className="form-control"
                  value={selectedVanId}
                  onChange={(e) => setSelectedVanId(e.target.value)}
                  required
                  disabled={!selectedBranch} // prevent selecting vehicle until branch is selected
                >
                  <option value="">Select vehicle</option>
                  {VehicleData.map((vehicle) => (
                    <option key={vehicle.VID} value={vehicle.VID}>
                      {vehicle.VRegNo}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 d-flex gap-2 align-items-center">
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? "Generating..." : "Generate"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleClear} disabled={isLoading}>
                  Clear
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Stock Report Table */}
      <div className="card mt-3">
        <div className="card-body">
          <h5 className="text-primary">Vanloading Stock Report</h5>

          {/* Loading Indicator */}
          {isLoading ? (
            <div className="text-center" role="status">
              <span className="navbar-brand navbar-brand-autodark">SuitApps</span>
              <div className="text-secondary mb-2" style={{ fontSize: "14px" }}>Preparing Report...</div>
              <div className="progress" style={{ height: "6px", width: "100px", margin: "0 auto" }}>
                <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: "100%" }}></div>
              </div>
            </div>
          ) : result.length > 0 ? (
            <div className="table-responsive">
              {/* ✅ Salesman, Vehicle Info & Export Buttons in One Line */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h4 className="fw-bold mb-0">Salesman: {result[0]?.UserName || "N/A"}</h4>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {/* Search Bar */}
                  <div className="input-group" style={{ maxWidth: "300px" }}>
                    <span className="input-group-text bg-primary text-white">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by Item Name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  {/* Export Buttons */}
                  <button className="btn btn-outline" onClick={exportToExcel}>
                    <FaFileExcel /> Excel
                  </button>
                  <button className="btn btn-outline" onClick={exportToPDF}>
                    <FaPrint /> PDF
                  </button>
                </div>
              </div>

        {/* ✅ Data Table */}
          <div style={{ 
          maxHeight: '500px',
          overflowY: 'auto',
          overflowX: 'auto',
          position: 'relative'
        }}>
          <table className="table table-bordered" style={{ 
            width: '100%',
            minWidth: '1000px' // Ensures table doesn't collapse on small screens
          }}>
            <thead className="table-primary" style={{ 
              position: 'sticky', 
              top: 0, 
              zIndex: 2,
              backgroundColor: '#f8f9fa'
            }}>
              <tr>
                <th style={{ Width: '16%' }}>S.No</th>
                <th style={{ Width: '16%'}}>Item Name</th>
                <th style={{ Width: '16%' }}>Van OS</th>
                <th style={{ Width: '16%' }}>BpPrice</th>
                <th style={{ Width: '16%' }}>BpPriceQty</th>
                <th style={{ Width: '16%' }}>Return Qty</th>
                <th style={{ Width: '16%' }}>Good Stock</th>
                <th style={{ Width: '16%' }}>Damaged Qty</th>
                <th style={{ Width: '16%' }}>Replaced Qty</th>
                <th style={{ Width: '16%' }}>Sale</th>
                <th style={{ Width: '16%' }}>Free Qty</th>
                <th style={{ Width: '16%' }}>Net Stock</th>
                <th style={{ Width: '16%' }}>Vt Stock</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <React.Fragment key={item.ItemID}>
                    <tr
                      style={{ lineHeight: "1.2", padding: "4px", cursor: "pointer" }}
                      onClick={() => handleRowClick(item.ItemID)}
                    >
                      <td>{index + 1}</td>
                      <td>{item.ItemName}</td>
                      <td>{item.Stock?.toFixed(2) || "-"}</td>
                      <td>{item.BPprice?.toFixed(2) || "-"}</td>
                      <td>{item.BPValue?.toFixed(2) || "-"}</td>
                      <td>{item.RetQty?.toFixed(2) || "-"}</td>
                      <td>{item.GoodStock?.toFixed(2) || "-"}</td>
                      <td>{item.DmgedQty?.toFixed(2) || "-"}</td>
                      <td>{item.ReplacedQty?.toFixed(2) || "-"}</td>
                      <td>{item.SoldQty?.toFixed(2) || "-"}</td>
                      <td>{item.FreeSoldQty?.toFixed(2) || "-"}</td>
                      <td>{item.NetStock?.toFixed(2) || "-"}</td>
                      <td>{item.VtStock?.toFixed(2) || "-"}</td>
                    </tr>

                          {expandedRows.includes(item.ItemID) && (
                            <tr>
                              <td colSpan="11">
                                <div style={{ padding: "10px", backgroundColor: "#f9f9f9" }}>
                                  <h6>VTStock Details by Date</h6>
                                  {selectedItemDetails[item.ItemID]?.length > 0 ? (
                                    <table className="table table-sm table-bordered">
                                      <thead>
                                        <tr>
                                          <th>Date</th>
                                          <th>VTStock</th>
                                          <th>Stock</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {selectedItemDetails[item.ItemID].map((d, i) => (
                                          <tr key={i}>
                                            <td>{d.Date?.split("T")[0]}</td>
                                            <td>{d.VTStock}</td>
                                            <td>{d.Stock}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  ) : (
                                    <div>No VTStock data available for this item.</div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="11" className="text-center text-muted py-3">
                          No matching data found
                        </td>
                      </tr>
                    )}
                  </tbody>

            {filteredData.length > 0 && (
  <tfoot style={{ position: 'sticky', bottom: 0, backgroundColor: "#0e5397ff", zIndex: 1 }}>
    <tr className="fw-bold text-white" style={{ lineHeight: '1.2', padding: '4px' }}>
      <td colSpan="2" className="text-center">Total</td>
      <td>{filteredData.reduce((acc, item) => acc + (item.Stock || 0), 0).toFixed(2)}</td>
      <td>{filteredData.reduce((acc, item) => acc + (item.BPprice || 0), 0).toFixed(2)}</td>
      <td>{filteredData.reduce((acc, item) => acc + (item.BPValue || 0), 0).toFixed(2)}</td>
      <td>{filteredData.reduce((acc, item) => acc + (item.RetQty || 0), 0).toFixed(2)}</td>
      <td>{filteredData.reduce((acc, item) => acc + (item.GoodStock || 0), 0).toFixed(2)}</td>
      <td>{filteredData.reduce((acc, item) => acc + (item.DmgedQty || 0), 0).toFixed(2)}</td>
      <td>{filteredData.reduce((acc, item) => acc + (item.ReplacedQty || 0), 0).toFixed(2)}</td>
      <td>{filteredData.reduce((acc, item) => acc + (item.SoldQty || 0), 0).toFixed(2)}</td>
      <td>{filteredData.reduce((acc, item) => acc + (item.FreeSoldQty || 0), 0).toFixed(2)}</td>
      <td>{filteredData.reduce((acc, item) => acc + (item.NetStock || 0), 0).toFixed(2)}</td>
      <td>{filteredData.reduce((acc, item) => acc + (item.VtStock || 0), 0).toFixed(2)}</td>
    </tr>
  </tfoot>
)}

          </table>
        </div>
      </div>
    ) : (
      <div className="text-center">No data available</div>
    )}
  </div>
</div>
    </div>
  );
};

export default VanloadingReportdatewise;
