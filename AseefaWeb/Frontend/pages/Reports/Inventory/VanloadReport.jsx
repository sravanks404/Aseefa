import React, { useState, useEffect } from "react";
import api from "../../apiService";
import { FaSearch, FaFileExcel, FaPrint } from "react-icons/fa";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

const VanloadingReport = () => {
  const getCurrentDate = () => new Date().toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(getCurrentDate());
  const [vehicleData, setVehicleData] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVanId, setSelectedVanId] = useState("");
  const [result, setResult] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const storedDate = sessionStorage.getItem("SelectedDate");
    const storedVehicle = sessionStorage.getItem("VID");

    if (storedDate && storedVehicle) {
      const formattedDate = new Date(storedDate).toISOString().split("T")[0];
      setFromDate(formattedDate);
      setSelectedVanId(storedVehicle);
      fetchStockReport(formattedDate, storedVehicle);
    } else {
      fetchVehicleData();
      fetchBranches();
    }
    fetchBranches()
    fetchVehicleData()
  }, []);

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
      const response = await api.get(`/api/getVanstock`, {
        params: { VanId: vanId, Date: formattedDate, companyID },
      });
      const data = response?.data?.data?.[0] || [];
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

  const handleSubmit = (e) => {
    e.preventDefault();
    sessionStorage.setItem("SelectedDate", fromDate);
    sessionStorage.setItem("VID", selectedVanId);
    sessionStorage.setItem("BranchID", selectedBranch);
    fetchStockReport(fromDate, selectedVanId, selectedBranch);
  };

  const handleClear = () => {
    sessionStorage.removeItem("SelectedDate");
    sessionStorage.removeItem("VID");
    setFromDate(getCurrentDate());
    setSelectedVanId("");
    setSelectedBranch("");
    setResult([]);
  };

  const filteredResults = result.filter((item) =>
    item.ItemName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

const exportToExcel = () => {
  if (result.length === 0) return;

  const dataToExport = searchTerm ? filteredResults : result;

  const vehicle = vehicleData.find((v) => v.VID == selectedVanId);
  const vehicleName = vehicle ? vehicle.VRegNo : "N/A";
  const salesmanName = (dataToExport[0]?.UserName || result[0]?.UserName) || "N/A";

  const header = [
    ["Vanloading Stock Report"],
    [`From Date: ${fromDate}`],
    [`Salesman: ${salesmanName}`],
    [`Vehicle: ${vehicleName}`],
    [],
    [
      "S.No", "Item Name", "MRP", "BP Price", "BP Value", "Van OS", "Return Qty",
      "Good Stock", "Damaged Qty", "Replaced Qty", "Sale", "Free Qty", "Net Stock", "Vt Stock"
    ]
  ];

  const tableData = dataToExport.map((item, index) => ([
    index + 1,
    item.ItemName,
    item.MRP,
    item.BPprice,
    item.BPValue,
    item.Stock,
    item.RetQty,
    item.GoodStock,
    item.DmgedQty,
    item.ReplacedQty,
    item.SoldQty,
    item.FreeSoldQty,
    item.NetStock,
    item.VtStock,
  ]));

  const totalRow = [
    "Total", "", "",
    dataToExport.reduce((acc, item) => acc + (item.BPprice || 0), 0).toFixed(2),
    dataToExport.reduce((acc, item) => acc + (item.BPValue || 0), 0).toFixed(2),
    dataToExport.reduce((acc, item) => acc + (item.Stock || 0), 0).toFixed(2),
    dataToExport.reduce((acc, item) => acc + (item.RetQty || 0), 0).toFixed(2),
    dataToExport.reduce((acc, item) => acc + (item.GoodStock || 0), 0).toFixed(2),
    dataToExport.reduce((acc, item) => acc + (item.DmgedQty || 0), 0).toFixed(2),
    dataToExport.reduce((acc, item) => acc + (item.ReplacedQty || 0), 0).toFixed(2),
    dataToExport.reduce((acc, item) => acc + (item.SoldQty || 0), 0).toFixed(2),
    dataToExport.reduce((acc, item) => acc + (item.FreeSoldQty || 0), 0).toFixed(2),
    dataToExport.reduce((acc, item) => acc + (item.NetStock || 0), 0).toFixed(2),
    dataToExport.reduce((acc, item) => acc + (item.VtStock || 0), 0).toFixed(2),
  ];

  tableData.push(totalRow);

  const worksheet = XLSX.utils.aoa_to_sheet([...header, ...tableData]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Vanloading Report");

  XLSX.writeFile(workbook, `Vanloading_Report_${fromDate}.xlsx`);
};


const exportToPDF = () => {
  if (result.length === 0) return;

  const dataToExport = searchTerm ? filteredResults : result;

  const doc = new jsPDF({ orientation: "landscape" });
  const vehicle = vehicleData.find((v) => v.VID == selectedVanId);
  const vehicleName = vehicle ? vehicle.VRegNo : "N/A";
  const salesmanName = (dataToExport[0]?.UserName || result[0]?.UserName) || "N/A";

  doc.setFontSize(14);
  doc.text("Vanloading Stock Report", 14, 10);
  doc.setFontSize(10);
  doc.text(`From Date: ${fromDate}`, 14, 20);
  doc.text(`Salesman: ${salesmanName}`, 14, 26);
  doc.text(`Vehicle: ${vehicleName}`, 14, 32);

  const tableColumn = [
    "S.No", "Item Name", "MRP", "BP Price", "BP Value", "Van OS", "Return Qty",
    "Good Stock", "Damaged Qty", "Replaced Qty", "Sale", "Free Qty", "Net Stock", "Vt Stock"
  ];

  const tableRows = dataToExport.map((item, index) => ([
    index + 1,
    item.ItemName,
    item.MRP?.toFixed(2),
    item.BPprice?.toFixed(2),
    item.BPValue?.toFixed(2),
    item.Stock?.toFixed(2),
    item.RetQty?.toFixed(2),
    item.GoodStock?.toFixed(2),
    item.DmgedQty?.toFixed(2),
    item.ReplacedQty?.toFixed(2),
    item.SoldQty?.toFixed(2),
    item.FreeSoldQty?.toFixed(2),
    item.NetStock?.toFixed(2),
    item.VtStock?.toFixed(2),
  ]));

  const totalRow = [
    "Total", "", "",
    dataToExport.reduce((acc, item) => acc + (item.BPprice || 0), 0).toFixed(2),
    dataToExport.reduce((acc, item) => acc + (item.BPValue || 0), 0).toFixed(2),
    dataToExport.reduce((acc, item) => acc + (item.Stock || 0), 0).toFixed(2),
    dataToExport.reduce((acc, item) => acc + (item.RetQty || 0), 0).toFixed(2),
    dataToExport.reduce((acc, item) => acc + (item.GoodStock || 0), 0).toFixed(2),
    dataToExport.reduce((acc, item) => acc + (item.DmgedQty || 0), 0).toFixed(2),
    dataToExport.reduce((acc, item) => acc + (item.ReplacedQty || 0), 0).toFixed(2),
    dataToExport.reduce((acc, item) => acc + (item.SoldQty || 0), 0).toFixed(2),
    dataToExport.reduce((acc, item) => acc + (item.FreeSoldQty || 0), 0).toFixed(2),
    dataToExport.reduce((acc, item) => acc + (item.NetStock || 0), 0).toFixed(2),
    dataToExport.reduce((acc, item) => acc + (item.VtStock || 0), 0).toFixed(2),
  ];

  tableRows.push(totalRow);

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [14, 83, 151], textColor: 255, halign: "center" },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 40 },
      2: { cellWidth: 15, halign: "right" },
      3: { cellWidth: 15, halign: "right" },
      4: { cellWidth: 20, halign: "right" },
      5: { cellWidth: 15, halign: "right" },
      6: { cellWidth: 15, halign: "right" },
      7: { cellWidth: 15, halign: "right" },
      8: { cellWidth: 15, halign: "right" },
      9: { cellWidth: 15, halign: "right" },
      10: { cellWidth: 15, halign: "right" },
      11: { cellWidth: 15, halign: "right" },
      12: { cellWidth: 15, halign: "right" },
      13: { cellWidth: 15, halign: "right" },
    },
    theme: "grid",
    margin: { left: 10, right: 10 },
    didDrawPage: (data) => {
      // Optional: repeat header on every page
      doc.setFontSize(8);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 250, 10);
    },
  });

  doc.save(`Vanloading_Report_${fromDate}.pdf`);
};


  return (
    <div className="container-fluid">
      <div className="card shadow-sm">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3 align-items-end">
              <div className="col-md-2">
                <label htmlFor="FromDate" className="fw-bold">Vanloading Date</label>
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
                <label htmlFor="Branch" className="fw-bold">Branch</label>
                <select
                  id="Branch"
                  className="form-control"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(Number(e.target.value))}
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch.BranchID} value={branch.BranchId}>
                      {branch.BranchName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <label htmlFor="VanDate" className="fw-bold">Vehicle</label>
                <select
                  id="VanDate"
                  className="form-control"
                  value={selectedVanId}
                  onChange={(e) => setSelectedVanId(e.target.value)}
                  required
                  disabled={!selectedBranch}
                >
                  <option value="">Select vehicle</option>
                  {filteredVehicles.map((vehicle) => (
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

      <div className="card mt-3">
        <div className="card-body">
          {isLoading ? (
            <div className="text-center" role="status">
              <span className="navbar-brand navbar-brand-autodark">SuitApps</span>
              <div className="text-secondary mb-2">Preparing Report...</div>
              <div className="progress" style={{ height: "6px", width: "100px", margin: "0 auto" }}>
                <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: "100%" }}></div>
              </div>
            </div>
          ) : result.length > 0 ? (
            <div className="table-responsive">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h4 className="fw-bold mb-0">Salesman: {result[0]?.UserName || "N/A"}</h4>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3 flex-nowrap" style={{ flexWrap: 'nowrap' }}>
                  <div className="input-group me-2" style={{ maxWidth: "300px", flexShrink: 1 }}>
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

                  <div className="d-flex gap-2">
                    <button className="btn btn-outline-success" onClick={exportToExcel}>
                      <FaFileExcel className="me-1" />
                    </button>
                    <button className="btn btn-outline-danger" onClick={exportToPDF}>
                      <FaPrint className="me-1" />
                    </button>
                  </div>
                </div>
              </div>

              <div style={{
                maxHeight: '500px',
                overflowY: 'auto',
                overflowX: 'auto',
                position: 'relative'
              }}>
<table
  className="table table-bordered"
  style={{
    width: '100%',
    minWidth: '1000px', // Ensures table doesn't collapse on small screens
  }}
>
  <thead
    className="table-primary"
    style={{
      position: 'sticky',
      top: 0,
      zIndex: 2,
      backgroundColor: '#f8f9fa',
    }}
  >
    <tr>
      <th style={{ width: '6%' }}>SI.No</th>
      <th style={{ width: '16%' }}>Item Name</th>
      <th style={{ width: '8%' }}>Mrp</th>
      <th style={{ width: '8%' }}>BpPrice</th>
      <th style={{ width: '8%' }}>BpPriceqty</th>
      <th style={{ width: '8%' }}>Van OS</th>
      <th style={{ width: '8%' }}>Return Qty</th>
      <th style={{ width: '8%' }}>Good Stock</th>
      <th style={{ width: '9%' }}>Damaged Qty</th>
      <th style={{ width: '9%' }}>Replaced Qty</th>
      <th style={{ width: '8%' }}>Sale</th>
      <th style={{ width: '8%' }}>Free Qty</th>
      <th style={{ width: '8%' }}>Net Stock</th>
      <th style={{ width: '8%' }}>Vt Stock</th>
    </tr>
  </thead>

  <tbody>
    {filteredResults.length > 0 ? (
      filteredResults.map((item, index) => (
        <tr key={index}>
          <td>{index + 1}</td>
          <td>{item.ItemName}</td>
          <td>₹{item.MRP?.toLocaleString('en-IN') || '-'}</td>
          <td>₹{item.BPprice?.toLocaleString('en-IN') || '-'}</td>
          <td>₹{item.BPValue?.toLocaleString('en-IN') || '-'}</td>
          <td>{item.Stock?.toFixed(2) || '-'}</td>
          <td>{item.RetQty?.toFixed(2) || '-'}</td>
          <td>{item.GoodStock?.toFixed(2) || '-'}</td>
          <td>{item.DmgedQty?.toFixed(2) || '-'}</td>
          <td>{item.ReplacedQty?.toFixed(2) || '-'}</td>
          <td>{item.SoldQty?.toFixed(2) || '-'}</td>
          <td>{item.FreeSoldQty?.toFixed(2) || '-'}</td>
          <td>{item.NetStock?.toFixed(2) || '-'}</td>
          <td>{item.VtStock?.toFixed(2) || '-'}</td>
        </tr>
      ))
    ) : (
      <tr>
        <td colSpan="14" className="text-center">
          No matching data found
        </td>
      </tr>
    )}
  </tbody>

  {filteredResults.length > 0 && (
    <tfoot
      style={{
        position: 'sticky',
        bottom: 0,
        backgroundColor: '#0e5397ff',
        color: 'white',
        zIndex: 1,
      }}
    >
      <tr className="fw-bold text-white text-center">
        <td colSpan="2">Total</td>
        <td>-</td>
        <td>
          ₹
          {filteredResults
            .reduce((acc, item) => acc + (item.BPprice || 0), 0)
            .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </td>
        <td>
          ₹
          {filteredResults
            .reduce((acc, item) => acc + (item.BPValue || 0), 0)
            .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </td>
        <td>
          {filteredResults
            .reduce((acc, item) => acc + (item.Stock || 0), 0)
            .toFixed(2)}
        </td>
        <td>
          {filteredResults
            .reduce((acc, item) => acc + (item.RetQty || 0), 0)
            .toFixed(2)}
        </td>
        <td>
          {filteredResults
            .reduce((acc, item) => acc + (item.GoodStock || 0), 0)
            .toFixed(2)}
        </td>
        <td>
          {filteredResults
            .reduce((acc, item) => acc + (item.DmgedQty || 0), 0)
            .toFixed(2)}
        </td>
        <td>
          {filteredResults
            .reduce((acc, item) => acc + (item.ReplacedQty || 0), 0)
            .toFixed(2)}
        </td>
        <td>
          {filteredResults
            .reduce((acc, item) => acc + (item.SoldQty || 0), 0)
            .toFixed(2)}
        </td>
        <td>
          {filteredResults
            .reduce((acc, item) => acc + (item.FreeSoldQty || 0), 0)
            .toFixed(2)}
        </td>
        <td>
          {filteredResults
            .reduce((acc, item) => acc + (item.NetStock || 0), 0)
            .toFixed(2)}
        </td>
        <td>
          {filteredResults
            .reduce((acc, item) => acc + (item.VtStock || 0), 0)
            .toFixed(2)}
        </td>
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

export default VanloadingReport;