import React, { useState, useEffect, useMemo, useRef } from "react";
import api from '../../apiService';
import DataTable from "react-data-table-component";
import Select from "react-select";
import { FaSearch, FaFileExcel, FaFilePdf, FaFilter } from "react-icons/fa";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import "jspdf-autotable";

const Hsnreport = () => {
  const getCurrentDate = () => new Date().toISOString().split("T")[0];
  const getPreviousDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];
  };

  const formatAmount = (amount) => {
    return parseFloat(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // State variables
  const [fromDate, setFromDate] = useState(getPreviousDate(7));
  const [toDate, setToDate] = useState(getCurrentDate());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [reportData, setReportData] = useState([]);

  const [typeOptions, setTypeOptions] = useState([]);

  const [summary, setSummary] = useState({
    supplierCount: 0,
    totalAmount: 0,
    totalPurchases: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(500);


  // Fetch purchase report data
  const fetchPurchaseReport = async () => {
    setIsLoading(true);
    setError("");

    try {
      const CompanyID = sessionStorage.getItem("CompanyID");

      const response = await api.get("/api/HSNcode", {
        params: {
          CompanyID,
          FromDate: fromDate,
          ToDate: toDate,
          Type: selectedType || null,
        },
      });


      // Process and set data
      const groupedResult = response.data || [];

      setReportData(groupedResult);

      // Get unique suppliers


      //setSummary({ supplierCount, totalAmount, totalPurchases });
    } catch (err) {
      setError("Failed to fetch purchase report. Please try again.");
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter results based on search query and filters

  const filteredResults = useMemo(() => {
    let filteredData = reportData;

    // Apply filters
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      filteredData = filteredData.filter(row =>
        row.HSNCode?.toLowerCase().includes(lower) ||
        row.Unit?.toLowerCase().includes(lower)
      );
    }

    if (selectedType) {
      filteredData = filteredData.filter(row => row.WholeSaleRetail === selectedType);
    }

    // For footer summary (Calculate total of TotalAmount)
    const totalBillAmount = filteredData.reduce((sum, row) => sum + (row.TotalAmount || 0), 0);

    // Update footer summary
    setSummary({
      totalAmount: totalBillAmount,
      supplierCount: 0,
      totalPurchases: filteredData.length,
    });

    return filteredData;
  }, [reportData, searchQuery, selectedType]);
  ;

  useEffect(() => {

    const types = Array.from(new Set(reportData.map(row => row.WholeSaleRetail || "Unknown"))).sort();

    setTypeOptions(types);
  }, [reportData]);

  const handleClear = () => {
    setFromDate(getPreviousDate(7)); // Set fromDate to 7 days ago
    setToDate(getCurrentDate()); // Set toDate to today
    setSearchQuery(""); // Clear search query
    setSelectedType(""); // Reset selected type
    setError(""); // Clear error message
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    fetchPurchaseReport();
  };

  // Export functions

  const exportToExcel = () => {
    if (!filteredResults.length) {
      alert("No data to export.");
      return;
    }

    const formattedFromDate = new Date(fromDate).toLocaleDateString('en-GB'); // dd/mm/yyyy
    const formattedToDate = new Date(toDate).toLocaleDateString('en-GB');

    const headerInfo = [
      ["HSN Sales Report"],
      [`From: ${formattedFromDate}   To: ${formattedToDate}`],
      [`Type: ${selectedType || "All"}`],
      [], // Empty row for spacing
    ];

    const headers = [
      ["Sl.No", "HSN Code", "Unit", "Quantity", "Tax %", "Taxable Value", "Total Amount"]
    ];

    const data = filteredResults.map((row, index) => [
      index + 1,
      row.HSNCode || "N/A",
      row.Unit || "N/A",
      parseFloat(row.Quantity || 0),
      row.TaxPer !== undefined ? parseFloat(row.TaxPer).toFixed(2) + "%" : "0.00%",
      parseFloat(row.TaxableValue || 0),
      parseFloat(row.TotalAmount || 0),
    ]);

    // Totals
    const totalQty = filteredResults.reduce((sum, row) => sum + (parseFloat(row.Quantity) || 0), 0);
    const totalTaxable = filteredResults.reduce((sum, row) => sum + (parseFloat(row.TaxableValue) || 0), 0);
    const totalAmount = filteredResults.reduce((sum, row) => sum + (parseFloat(row.TotalAmount) || 0), 0);

    const totalRow = [
      "TOTAL", "", "", totalQty, "", totalTaxable, totalAmount
    ];

    // Create worksheet
    const worksheetData = [...headerInfo, ...headers, ...data, totalRow];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // ✅ Set column widths to prevent ##### display
    ws['!cols'] = [
      { wch: 10 },  // Sl.No
      { wch: 15 },  // HSN Code
      { wch: 10 },  // Unit
      { wch: 12 },  // Quantity
      { wch: 10 },  // Tax %
      { wch: 18 },  // Taxable Value
      { wch: 18 },  // Total Amount
    ];

    // ✅ Format numeric cells properly
    const headerOffset = headerInfo.length + 1;
    const totalRowIndex = headerOffset + data.length;
    const range = XLSX.utils.decode_range(ws['!ref']);

    for (let R = headerOffset; R <= totalRowIndex; R++) {
      // Quantity (col 3), Taxable Value (col 5), Total Amount (col 6)
      [3, 5, 6].forEach(C => {
        const cellAddress = { c: C, r: R };
        const cellRef = XLSX.utils.encode_cell(cellAddress);
        const cell = ws[cellRef];
        if (cell && typeof cell.v === 'number') {
          cell.t = 'n';
          cell.z = '0.00'; // Two decimal places
        }
      });
    }

    // Create workbook and export
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "HSN Report");
    XLSX.writeFile(wb, `HSN_Report_${fromDate}_to_${toDate}.xlsx`);
  };


  const exportToPDF = () => {
    if (!filteredResults.length) {
      alert("No data to export.");
      return;
    }

    const doc = new jsPDF("landscape", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    // Format the dates
    const formattedFromDate = new Date(fromDate).toLocaleDateString('en-GB'); // dd/mm/yyyy
    const formattedToDate = new Date(toDate).toLocaleDateString('en-GB');

    doc.setFontSize(16);
    doc.text("HSN Sales Report", 14, 14);

    // Add the date range under the title
    doc.setFontSize(12);
    doc.text(`Date Range: ${formattedFromDate} to ${formattedToDate}`, 14, 22);

    let y = 30;
    const headerInfo = [
      ["HSN Sales Report"],
      [`From: ${formattedFromDate}   To: ${formattedToDate}`],
      [`Type: ${selectedType || "All"}`],
      [], // Empty row for spacing
    ];

    const tableColumn = [
      "Sl.No", "HSN Code", "Unit", "Quantity", "Tax %", "Taxable Value", "Total Amount"
    ];

    const tableRows = filteredResults.map((row, index) => [
      index + 1,
      row.HSNCode || "N/A",
      row.Unit || "N/A",
      +(row.Quantity || 0).toFixed(2),
      row.TaxPer !== undefined ? `${parseFloat(row.TaxPer).toFixed(2)}%` : "0.00%",
      +(row.TaxableValue || 0).toFixed(2),
      +(row.TotalAmount || 0).toFixed(2),
    ]);

    const totalQuantity = filteredResults.reduce((sum, row) => sum + (parseFloat(row.Quantity) || 0), 0);
    const totalTaxable = filteredResults.reduce((sum, row) => sum + (parseFloat(row.TaxableValue) || 0), 0);
    const totalAmount = filteredResults.reduce((sum, row) => sum + (parseFloat(row.TotalAmount) || 0), 0);

    const totalRow = [
      "TOTAL", "", "", totalQuantity.toFixed(2), "", totalTaxable.toFixed(2), totalAmount.toFixed(2)
    ];

    tableRows.push(totalRow);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: y,
      styles: { fontSize: 10, cellPadding: 2 },
      theme: "grid",
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20 },
        3: { cellWidth: 30, halign: "right" },
        4: { cellWidth: 25, halign: "right" },
        5: { cellWidth: 40, halign: "right" },
        6: { cellWidth: 40, halign: "right" },
      },
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`, pageWidth - 30, 10);
      },
    });

    // Save the PDF with the date range in the filename
    doc.save(`HSN_Sales_Report_${formattedFromDate}_to_${formattedToDate}.pdf`);
  };


  // Table styles
  const customStyles = {
    table: {
      style: {
        border: "1px solid #dee2e6",
        borderRadius: "8px",
      },
    },
    head: {
      style: {
        backgroundColor: "#f8f9fa",
      },
    },
    headCells: {
      style: {
        fontSize: "13px",
        fontWeight: "bold",
        padding: "10px",
        backgroundColor: "#f1f3f5",
        color: "#343a40",
        borderBottom: "1px solid #dee2e6",
      },
    },
    rows: {
      style: {
        fontSize: "13px",
        minHeight: "48px",
        borderBottom: "1px solid #e9ecef",
      },
    },
    cells: {
      style: {
        padding: "10px 12px",
      },
    },
  };

  // Table columns
  const columns = [
    {
      name: "Sl.No",
      selector: (_, index) => (currentPage - 1) * rowsPerPage + index + 1,
      sortable: false,
      center: true,
    },
    {
      name: "HSN Code",
      selector: (row) => row.HSNCode || "N/A",
      sortable: true,
      center: true,
    },
    {
      name: "Unit",
      selector: (row) => row.Unit || "N/A",
      sortable: true,
      center: true,
    },
    {
      name: "Quantity",
      selector: (row) => parseFloat(row.Quantity || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      sortable: true,
      right: true,
    },
    {
      name: "Tax %",
      selector: (row) => row.TaxPer !== undefined ? `${parseFloat(row.TaxPer).toFixed(2)}%` : "0.00%",
      sortable: true,
      right: true,
    },
    {
      name: "Taxable Value",
      selector: (row) => parseFloat(row.TaxableValue || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      sortable: true,
      right: true,
    },
    {
      name: "Total Amount",
      selector: (row) => parseFloat(row.TotalAmount || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      sortable: true,
      right: true,
    },
  ];

  // Custom footer component
  const CustomFooter = ({ rowsPerPage, rowCount, currentPage, onChangePage, onChangeRowsPerPage }) => {
    const totalPages = Math.ceil(rowCount / rowsPerPage);

    return (
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-3 bg-light">
        <div className="fw-semibold text-dark mb-2 mb-md-0">
          Total Amount: {summary.totalAmount ? formatAmount(summary.totalAmount) : "N/A"}
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

  // Auto-fetch data on mount
  useEffect(() => {
    fetchPurchaseReport();
  }, [fromDate, toDate, selectedType]);

  return (
    <div className="container-fluid">
      {/* Header with Search and Export Buttons */}
      <div className="card shadow-sm mb-3 p-3">
        <h4>HSNCode sale Report</h4>
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
                placeholder="Search HSNCode ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex flex-wrap justify-content-end gap-2 w-100 w-md-auto">
            {/* Filter Button */}
            <button
              type="button"
              className="btn btn-outline-primary"
              data-bs-toggle="modal"
              data-bs-target="#filterModal"
            >
              <FaFilter className="me-1" /> Filters
            </button>

            {/* Export Buttons */}
            <div className="btn-group">
              <button className="btn btn-outline" onClick={exportToExcel}>
                <FaFileExcel className="me-1" /> Excel
              </button>
              <button className="btn btn-outline" onClick={exportToPDF}>
                <FaFilePdf className="me-1" /> PDF
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
                SaleHSN Report Filters
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                {/* Date Range Row */}
                <div className="row mb-3 g-3">
                  <div className="col-md-6">
                    <label htmlFor="FromDate" className="form-label fw-bold small text-muted">FROM DATE</label>
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
                    <label htmlFor="ToDate" className="form-label fw-bold small text-muted">TO DATE</label>
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
                {/* Customer / Item / Type Filters */}
                <div className="row mb-3 g-3">

                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-muted">Type</label>
                    <Select
                      options={[
                        { label: "All", value: "" },
                        { label: "Retail", value: "Retail" },
                        { label: "WholeSale", value: "WholeSale" }
                      ]}
                      value={
                        selectedType
                          ? { label: selectedType === "" ? "All" : selectedType, value: selectedType }
                          : null
                      }
                      onChange={(option) => setSelectedType(option ? option.value : "")}
                      isClearable
                      placeholder="All Types"
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
                    type="submit"
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
        {/* Scrollable Table */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <DataTable
            columns={columns}
            data={paginatedResults}
            progressPending={isLoading}
            highlightOnHover
            striped
            pagination={false}
            fixedHeader
            fixedHeaderScrollHeight="100%"
            customStyles={customStyles}
            progressComponent={
              <div className="d-flex flex-column align-items-center justify-content-center w-100" style={{ height: "300px" }}>
                <div className="text-center">
                  <div className="navbar-brand navbar-brand-autodark">SuitApps</div>
                  <div className="text-secondary mb-3">Preparing Report</div>
                  <div className="progress progress-sm">
                    <div className="progress-bar progress-bar-indeterminate"></div>
                  </div>
                </div>
              </div>
            }
          />
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
    </div>
  );
};

export default Hsnreport;