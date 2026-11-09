import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../apiService";
import DataTable from "react-data-table-component";
import { FaSearch, FaFileExcel, FaPrint, FaFilter } from "react-icons/fa";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

const ProductionReport = () => {
  // Date helper functions
  const getCurrentDate = () => new Date().toISOString().split("T")[0];
  const getPreviousDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];
  };

  // Format amount function
  const formatAmount = (amount) => amount?.toFixed(2);

  // State declarations
  const [fromDate, setFromDate] = useState(getPreviousDate(7));
  const [toDate, setToDate] = useState(getCurrentDate());
  const [result, setResult] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productionDetails, setProductionDetails] = useState([]);
  const [companyData, setCompanyData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(500);
  const [searchQuery, setSearchQuery] = useState("");

  // Summary state
  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalOrderAmt: 0,
  });

  // Fetch production report data
  const fetchProductionReport = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const companyID = sessionStorage.getItem("CompanyID");
      const response = await api.post("/api/getproductReport", {
        CompanyID: companyID,
        FromDate: fromDate,
        ToDate: toDate
      });

      // Adjust for object-based response
      const orderDetails = response?.data?.OrderDetails || [];
      const summaryData = response?.data?.Summary?.[0] || {};

      setResult(orderDetails);
      setFilteredResults(orderDetails);
      setSummary({
        totalOrders: summaryData.TotalOrders || 0,
        totalOrderAmt: summaryData.TotalOrderAmt || 0,
      });
    } catch (err) {
      console.error("Error fetching production report:", err);
      setError("Failed to fetch production report. Please try again.");
      setResult([]);
      setFilteredResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    // Retrieve from sessionStorage and parse JSON
    const storedCompanyData = sessionStorage.getItem("companyResponse");
    if (storedCompanyData) {
      setCompanyData(JSON.parse(storedCompanyData));
    }
  }, []);

  useEffect(() => {
    fetchProductionReport();
  }, [fetchProductionReport]);

  // Search functionality
  useEffect(() => {
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = result.filter((row) =>
        (row.ProductionNo && row.ProductionNo.toString().toLowerCase().includes(lowercasedQuery)) ||
        (row.TotalLC && row.TotalLC.toString().toLowerCase().includes(lowercasedQuery)) ||
        (row.PDate && new Date(row.PDate).toLocaleDateString().toLowerCase().includes(lowercasedQuery)) ||
        (row.ItemName && row.ItemName.toLowerCase().includes(lowercasedQuery))
      );
      setFilteredResults(filtered);
    } else {
      setFilteredResults(result);
    }
  }, [searchQuery, result]);


  // Handler for fetching production details
  const fetchProductionDetails = useCallback(async (PID) => {
    try {
      const response = await api.get("/api/GetProductiondetails", {
        params: { PID },
      });
      setProductionDetails(response?.data || []);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error fetching production details:", err);
    }
  }, []);

  // Event handlers
  const handleRowClick = useCallback((row) => {
    fetchProductionDetails(row.PID);
  }, [fetchProductionDetails]);

  const handleClear = useCallback(() => {
    setFromDate(getPreviousDate(7));
    setToDate(getCurrentDate());
    setError("");
    setSearchQuery("");
    fetchProductionReport();
  }, [fetchProductionReport]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    fetchProductionReport();
  }, [fetchProductionReport]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Export to Excel
  const exportToExcel = useCallback(() => {
    if (!filteredResults.length) {
      alert("No data to export.");
      return;
    }

    const headerData = [
      ["From Date", fromDate, "", "To Date", toDate],
      ["Total Orders", summary.totalOrders, "", "Total LC Amount", formatAmount(summary.totalOrderAmt)],
      [],
      ["Production Report"],
      []
    ];

    const tableHeaders = [
      ["SL.No", "Production No", "Date", "Product Name", "Batch", "Quantity", "Total LC", "Total Cost"]
    ];

    const formattedData = filteredResults.map((row, index) => [
      index + 1,
      row.ProductionNo || "N/A",
      row.PDate ? new Date(row.PDate).toLocaleDateString("en-GB") : "N/A",
      row.ItemName || "N/A",
      row.BatchName || "N/A",
      row.Qty ?? 0,
      row.TotalLC ?? 0,
      row.TotalProductionCost ?? 0
    ]);

    // Calculate totals
    const totalQty = filteredResults.reduce((sum, row) => sum + (row.Qty || 0), 0);
    const totalLC = filteredResults.reduce((sum, row) => sum + (row.TotalLC || 0), 0);
    const totalCost = filteredResults.reduce((sum, row) => sum + (row.TotalProductionCost || 0), 0);

    formattedData.push([
      "TOTAL", "", "", "", "", totalQty, totalLC, totalCost
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...headerData, ...tableHeaders, ...formattedData]);

    ws["!cols"] = [
      { wch: 8 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
      { wch: 12 }, { wch: 15 }, { wch: 15 }
    ];

    ws["!merges"] = [
      { s: { r: 3, c: 0 }, e: { r: 3, c: 7 } }, // Title row
      { s: { r: formattedData.length + 4, c: 0 }, e: { r: formattedData.length + 4, c: 4 } } // TOTAL row
    ];

    const dataStartRow = headerData.length + tableHeaders.length;
    [6, 7].forEach(col => {
      for (let i = 0; i < formattedData.length; i++) {
        const cellRef = XLSX.utils.encode_cell({ r: dataStartRow + i, c: col });
        if (ws[cellRef] && typeof ws[cellRef].v === "number") {
          ws[cellRef].z = "0.00";
        }
      }
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ProductionReport");
    XLSX.writeFile(wb, `ProductionReport_${fromDate}_to_${toDate}.xlsx`);
  }, [filteredResults, fromDate, toDate, summary]);


  // Export to PDF
  const exportToPDF = useCallback(() => {
    if (!filteredResults.length) {
      alert("No data to export.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Production Report (${fromDate} to ${toDate})`, 14, 10);

    doc.setFontSize(10);
    let y = 20;
    doc.text(`From Date: ${fromDate}`, 14, y);
    doc.text(`To Date: ${toDate}`, 80, y);
    y += 7;
    doc.text(`Total Orders: ${summary.totalOrders}`, 14, y);
    doc.text(`Total LC Amount: ${formatAmount(summary.totalOrderAmt)}`, 80, y);
    y += 10;

    const headers = [
      { title: "#", dataKey: "index" },
      { title: "Production No", dataKey: "productionNo" },
      { title: "Date", dataKey: "date" },
      { title: "Product Name", dataKey: "productName" },
      { title: "Batch", dataKey: "batch" },
      { title: "Quantity", dataKey: "qty" },
      { title: "Total LC", dataKey: "totalLC" },
      { title: "Total Cost", dataKey: "totalCost" }
    ];

    const data = filteredResults.map((row, index) => ({
      index: index + 1,
      productionNo: row.ProductionNo || "N/A",
      date: row.PDate ? new Date(row.PDate).toLocaleDateString("en-GB") : "N/A",
      productName: row.ItemName || "N/A",
      batch: row.BatchName || "N/A",
      qty: row.Qty ?? 0,
      totalLC: formatAmount(row.TotalLC),
      totalCost: formatAmount(row.TotalProductionCost)
    }));

    const totalQty = filteredResults.reduce((sum, row) => sum + (row.Qty || 0), 0);
    const totalLC = filteredResults.reduce((sum, row) => sum + (row.TotalLC || 0), 0);
    const totalCost = filteredResults.reduce((sum, row) => sum + (row.TotalProductionCost || 0), 0);

    data.push({
      index: { content: "TOTAL", colSpan: 5, styles: { fontStyle: "bold", halign: "center" } },
      qty: totalQty,
      totalLC: formatAmount(totalLC),
      totalCost: formatAmount(totalCost)
    });

    doc.autoTable({
      head: [headers.map(h => h.title)],
      body: data.map(item => headers.map(h => item[h.dataKey])),
      startY: y,
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 8 },   // SL.No
        1: { cellWidth: 20 },  // Production No
        2: { cellWidth: 15 },  // Date
        3: { cellWidth: 25 },  // Product Name
        4: { cellWidth: 15 },  // Batch
        5: { cellWidth: 12 },  // Quantity
        6: { cellWidth: 15 },  // Total LC
        7: { cellWidth: 15 }   // Total Cost
      }
    });

    doc.save(`ProductionReport_${fromDate}_to_${toDate}.pdf`);
  }, [filteredResults, fromDate, toDate, summary]);


  // DataTable columns configuration
  const columns = [
    // { name: <span style={{ fontWeight: "bold" }}>SL.No</span>, selector: (_, index) => (currentPage - 1) * rowsPerPage + index + 1, sortable: false, width: "7%" },
    { name: <span style={{ fontWeight: "bold" }}>Production No</span>, selector: row => row.ProductionNo || "N/A", sortable: true, width: "13%" },
    { name: <span style={{ fontWeight: "bold" }}>Date</span>, selector: row => row.PDate ? new Date(row.PDate).toLocaleDateString("en-GB") : "N/A", sortable: true, width: "12%" },
    { name: <span style={{ fontWeight: "bold" }}>Product Name</span>, selector: row => row.ItemName || "N/A", sortable: true, width: "23%" },
    { name: <span style={{ fontWeight: "bold" }}>Batch</span>, selector: row => row.BatchName || "N/A", sortable: true, width: "10%" },
    { name: <span style={{ fontWeight: "bold" }}>Quantity</span>, selector: row => row.Qty || "N/A", sortable: true, right: true, width: "5%" },
    { name: <span style={{ fontWeight: "bold" }}>Total LC</span>, selector: row => formatAmount(row.TotalLC), sortable: true, right: true, width: "10%" },
    { name: <span style={{ fontWeight: "bold" }}>LabourCost</span>, selector: row => row.LabourCost, sortable: true, right: true, width: "10%" },
    { name: <span style={{ fontWeight: "bold" }}>Total Cost</span>, selector: row => formatAmount(row.TotalProductionCost), sortable: true, right: true, width: "14%" },
  ];


  // Custom styles for DataTable
  const customStyles = {
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
      minWidth: '250px'
    }),
    option: (provided) => ({
      ...provided,
      padding: '6px 12px 6px 32px',
      fontSize: '13px',
      whiteSpace: 'nowrap',
      overflow: 'visible',
      textOverflow: 'clip',
      position: 'relative'
    }),
    control: (provided) => ({
      ...provided,
      minHeight: '36px'
    })
  };
  const totalRequiredQty = productionDetails.reduce((sum, item) => sum + (parseFloat(item.RequiredQuantity) || 0), 0);
  const totalTLC = productionDetails.reduce((sum, item) => sum + (parseFloat(item.TLC) || 0), 0);
  const totalAvlQty = productionDetails.reduce((sum, item) => sum + (parseFloat(item.AvlQty) || 0), 0);
  const totalUsedQty = productionDetails.reduce((sum, item) => sum + (parseFloat(item.UsedQty) || 0), 0);


  // Custom footer component for pagination
  const CustomFooter = ({ rowsPerPage, rowCount, currentPage, onChangePage, onChangeRowsPerPage }) => {
    const totalPages = Math.ceil(rowCount / rowsPerPage);
    const liveTotal = filteredResults.reduce((sum, item) => sum + (item.TotalLC || 0), 0);

    return (
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-3 bg-light">
        <div className="fw-semibold text-dark mb-2 mb-md-0">
          Total LC: {formatAmount(liveTotal)}
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          <label className="me-2">Rows per page:</label>
          <select
            value={rowsPerPage}
            onChange={(e) => onChangeRowsPerPage(Number(e.target.value))}
            className="form-select form-select-sm w-auto"
          >
            <option value={500}>500</option>
            <option value={1000}>1000</option>
            <option value={10000}>10000</option>
          </select>

          <span className="mx-2">
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>

          <div className="btn-group btn-group-sm" role="group">
            <button className="btn btn-outline-secondary" onClick={() => onChangePage(1)} disabled={currentPage === 1}>⏮</button>
            <button className="btn btn-outline-secondary" onClick={() => onChangePage(currentPage - 1)} disabled={currentPage === 1}>◀</button>
            <button className="btn btn-outline-secondary" onClick={() => onChangePage(currentPage + 1)} disabled={currentPage === totalPages}>▶</button>
            <button className="btn btn-outline-secondary" onClick={() => onChangePage(totalPages)} disabled={currentPage === totalPages}>⏭</button>
          </div>
        </div>
      </div>
    );
  };

  // Paginated results
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredResults.slice(start, start + rowsPerPage);
  }, [filteredResults, currentPage, rowsPerPage]);

  return (
    <div className="container-fluid">
      {/* Header Section */}
      <div className="card shadow-sm mb-3 p-3">
        <h4>Production Report</h4>
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
          {/* Search Input */}
          <div className="w-100 w-md-50">
            <div className="input-group">
              <span className="input-group-text bg-primary text-white">
                <FaSearch />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by production no, LC amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex flex-wrap justify-content-end gap-2 w-100 w-md-auto">
            <button
              type="button"
              className="btn btn-outline-primary"
              data-bs-toggle="modal"
              data-bs-target="#filterModal"
            >
              <FaFilter className="me-1" /> Filters
            </button>
            <div className="btn-group">
              <button className="btn btn-outline" onClick={exportToExcel}>
                <FaFileExcel className="me-1" /> Excel
              </button>
              <button className="btn btn-outline" onClick={exportToPDF}>
                <FaPrint className="me-1" /> PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      <div className="modal fade" id="filterModal" tabIndex="-1" aria-labelledby="filterModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header bg-light">
              <h5 className="modal-title text-primary" id="filterModalLabel">
                <FaFilter className="me-2" />
                Production Report Filters
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                {/* Date Range Row */}
                <div className="row mb-3 g-3">
                  <div className="col-md-6">
                    <label htmlFor="FromDate" className="form-label fw-bold small text-muted">
                      FROM DATE
                    </label>
                    <input
                      type="date"
                      id="FromDate"
                      className="form-control"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="ToDate" className="form-label fw-bold small text-muted">
                      TO DATE
                    </label>
                    <input
                      type="date"
                      id="ToDate"
                      className="form-control"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="modal-footer bg-light">
              <div className="d-flex justify-content-between w-100">
                <button type="button" className="btn btn-link text-danger" onClick={handleClear} disabled={isLoading}>
                  Clear All
                </button>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    data-bs-dismiss="modal"
                    onClick={handleSubmit}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table Section */}
      <div className="card shadow border-0 rounded mb-4" style={{ height: "calc(100vh - 230px)", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "hidden" }}>
          <div style={{ width: "100%" }}>
            <DataTable
              columns={columns}
              data={paginatedResults}
              progressPending={isLoading}
              highlightOnHover
              striped
              pagination={false}
              onRowClicked={handleRowClick}
              fixedHeader
              fixedHeaderScrollHeight="calc(100vh - 270px)" // Set an actual height
              customStyles={customStyles}
              style={{ width: "100%" }}
            />
          </div>

        </div>

        {/* Fixed Footer */}
        <div className="border-top bg-light shadow-sm" style={{ position: "sticky", bottom: 0, zIndex: 1000 }}>
          <CustomFooter
            rowsPerPage={rowsPerPage}
            rowCount={filteredResults.length}
            currentPage={currentPage}
            onChangePage={(page) => setCurrentPage(page)}
            onChangeRowsPerPage={(count) => {
              setRowsPerPage(count);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Production Details Modal */}
      {isModalOpen && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.5)", overflow: "auto" }}>
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content shadow-lg rounded">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">Production Details</h5>
                <button type="button" className="close btn btn-danger rounded-circle p-2" onClick={handleCloseModal}>
                  <span>&times;</span>
                </button>
              </div>

              <div className="modal-body p-4" id="modal-print-content">
                {productionDetails.length > 0 ? (
                  <div className="container-fluid">
                    {/* Production Header */}
                    <div className="row align-items-center mb-4 border-bottom pb-3">
                      <div className="col-md-6">
                        <h2 className="fw-bold">
                          <small className="text-muted">
                            Production No: {productionDetails[0].ProductionNo}
                          </small>
                        </h2>
                        <h5 className="text-muted">
                          Date: {productionDetails[0].PDate ? new Date(productionDetails[0].PDate).toLocaleDateString() : "N/A"}
                        </h5>
                      </div>
                      <div className="col-md-6 text-end">
                        {companyData ? (
                          <ul className="list-unstyled mb-0">
                            <li><strong>{companyData.CompanyName}</strong></li>
                            <li style={{ fontSize: "12px" }}>{companyData.Address}</li>
                            <li style={{ fontSize: "12px" }}>{companyData.GSTinNo}</li>
                            <li style={{ fontSize: "12px" }}>{companyData.MobileNO}</li>
                          </ul>
                        ) : (
                          <p>Loading company details...</p>
                        )}
                      </div>
                    </div>

                    {/* Items Table */}
                    <div className="card shadow-sm p-3 mt-4">
                      <h5 className="fw-bold">Items Summary</h5>
                      <div style={{
                        maxHeight: "300px",
                        overflowY: "auto",
                        overflowX: "auto", // Add horizontal scrolling
                        position: "relative" // Needed for sticky headers
                      }}>
                        <table
                          className="table table-bordered text-center mt-2"
                          style={{
                            fontSize: "10px",
                            width: "100%",
                            tableLayout: "fixed",
                            minWidth: "auto" // Ensure table doesn't collapse too much
                          }}
                        >

                          <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "#f8f9fa" }}>
                            <tr>
                              <th style={{ position: "sticky", top: 0, backgroundColor: "#f8f9fa" }}>No.</th>
                              <th style={{ position: "sticky", top: 0, backgroundColor: "#f8f9fa" }}>Item Name</th>
                              <th style={{ position: "sticky", top: 0, backgroundColor: "#f8f9fa" }}>Batch </th>
                              <th style={{ position: "sticky", top: 0, backgroundColor: "#f8f9fa" }}>Unit</th>

                              <th style={{ position: "sticky", top: 0, backgroundColor: "#f8f9fa" }}>Avl Qty</th>
                              <th style={{ position: "sticky", top: 0, backgroundColor: "#f8f9fa" }}>Used Qty</th>
                              <th style={{ position: "sticky", top: 0, backgroundColor: "#f8f9fa" }}>Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productionDetails.map((item, index) => (
                              <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{item.ItemName}</td>
                                <td>{item.BatchName}</td>
                                <td>{item.UnitName}</td>
                                <td>{item.AvlQty}</td>
                                <td>{item.UsedQty}</td>
                                <td>{formatAmount(item.TLC)}</td>
                              </tr>
                            ))}
                            <tr className="fw-bold bg-light">
                              <td colSpan="2" className="text-end">Total:</td>
                              <td></td>
                              <td></td>

                              <td>{totalAvlQty.toFixed(2)}</td>
                              <td>{totalUsedQty.toFixed(2)}</td>
                              <td>{formatAmount(totalTLC)}</td>
                            </tr>
                          </tbody>

                        </table>
                      </div>

                    </div>
                  </div>
                ) : (
                  <p>Loading production details...</p>
                )}
              </div>

              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionReport