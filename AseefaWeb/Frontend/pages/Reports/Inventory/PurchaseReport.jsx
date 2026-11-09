import React, { useState, useEffect, useMemo, useRef } from "react";
import api from '../../apiService';
import DataTable from "react-data-table-component";
import { FaSearch, FaFileExcel, FaFilePdf, FaFilter } from "react-icons/fa";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import "jspdf-autotable";

const PurchaseReport = () => {
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
  const [searchQuery, setSearchQuery] = useState("");
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({
    supplierCount: 0,
    totalAmount: 0,
    totalPurchases: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(500);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [distinctSuppliers, setDistinctSuppliers] = useState([]);
  const [PurchaseDetails, setPurchaseDetails] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companyData, setCompanyData] = useState(null);

  // Fetch purchase report data
  const fetchPurchaseReport = async () => {
    setIsLoading(true);
    setError("");

    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      const financialResponse = JSON.parse(sessionStorage.getItem("financialResponse"));
      const FYearID = financialResponse?.FYearID;

      const response = await api.get("/api/GetAllPurchaseReport", {
        params: { CompanyID, FromDate: fromDate, ToDate: toDate, FYearID },
      });

      const { data } = processGroupedData(response.data || []);
      setReportData(data);

      // Get distinct suppliers for filter dropdown
      const uniqueSuppliers = [...new Set(data.map(item => item.AccountName))];
      setDistinctSuppliers(uniqueSuppliers);

      // Calculate summary
      const supplierCount = new Set(data.map(item => item.AccountName)).size;
      const totalAmount = data.reduce((sum, item) => sum + (item.Amount || 0), 0);
      const totalPurchases = data.length;

      setSummary({ supplierCount, totalAmount, totalPurchases });
    } catch (err) {
      setError("Failed to fetch purchase report. Please try again.");
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Process grouped data
  const processGroupedData = (data) => {
    const uniqueEntries = new Map();
    let grandTotal = { Amount: 0, AmountIncOfTax: 0 };

    data.forEach((row) => {
      const key = `${row.PurchaseNo}-${row.PurchaseDate}-${row.AccountName}`;

      if (!uniqueEntries.has(key)) {
        uniqueEntries.set(key, {
          ...row,
          TaxAmount: row.TaxAmount || 0,
          AmountIncOfTax: row.AmountIncOfTax || 0,
        });
      } else {
        const existingRow = uniqueEntries.get(key);
        existingRow.TaxAmount += row.TaxAmount || 0;
        existingRow.AmountIncOfTax += row.AmountIncOfTax || 0;
      }
    });

    const sortedData = Array.from(uniqueEntries.values()).sort((a, b) =>
      new Date(a.PurchaseDate) - new Date(b.PurchaseDate)
    );

    sortedData.forEach((row) => {
      grandTotal.Amount += row.Amount || 0;
      grandTotal.AmountIncOfTax += row.AmountIncOfTax || 0;
    });

    return { data: sortedData, grandTotal };
  };


  const fetchPurhaseDetails = async (PurchaseID) => {
    const CompanyID = sessionStorage.getItem("CompanyID");

    try {
      const response = await api.get("/api/GetPurchasedetails", {
        params: {
          PurchaseID: Number(PurchaseID), // ← Ensure it's a number
          CompanyID: Number(CompanyID),
        },
      });

      setPurchaseDetails(response?.data || []);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error fetching purchase details:", err);
    }
  };


  // Filter results based on search query and filters
  const filteredResults = useMemo(() => {
    let filteredData = reportData;

    if (selectedSupplier) {
      filteredData = filteredData.filter(row => row.AccountName === selectedSupplier);
    }

    if (searchQuery) {
      filteredData = filteredData.filter((row) =>
        row.AccountName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.PurchaseNo?.toString().includes(searchQuery) ||
        row.Amount?.toString().includes(searchQuery) ||
        row.PurchaseDate?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Update summary with filtered data
    const filteredTotalAmount = filteredData.reduce((sum, row) => sum + (row.Amount || 0), 0);
    const filteredTotalPurchases = filteredData.length;
    const filteredSupplierCount = new Set(filteredData.map(item => item.AccountName)).size;

    setSummary({
      supplierCount: filteredSupplierCount,
      totalAmount: filteredTotalAmount,
      totalPurchases: filteredTotalPurchases,
    });

    return filteredData;
  }, [reportData, selectedSupplier, searchQuery]);

  const handleClear = () => {
    setFromDate(getPreviousDate(7));
    setToDate(getCurrentDate());
    setSelectedSupplier("");
    setError("");
    setSearchQuery("");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchPurchaseReport();
    setIsModalOpen(false);
  };

  const billDiscount = PurchaseDetails[0]?.DiscountRs || 0;
  const totalitemAmount = PurchaseDetails.reduce((sum, item) => sum + item.Amount, 0);

  // Export functions
  const exportToExcel = () => {
    if (!filteredResults.length) {
      alert("No data to export.");
      return;
    }

    const formattedFromDate = fromDate ? new Date(fromDate).toLocaleDateString() : "N/A";
    const formattedToDate = toDate ? new Date(toDate).toLocaleDateString() : "N/A";
    const formattedSupplier = selectedSupplier || "All";

    const totalAmount = filteredResults.reduce((sum, row) => sum + (row.Amount || 0), 0);
    const totalAmountIncTax = filteredResults.reduce((sum, row) => sum + (row.AmountIncOfTax || 0), 0);

    const filterData = [
      ["From Date", formattedFromDate],
      ["To Date", formattedToDate],
      ["Supplier", formattedSupplier],
      ["Total Amount", totalAmount],
      ["Total Amount (Incl. Tax)", totalAmountIncTax],
      [],
    ];

    const headers = [
      ["Sl No", "Date", "Supplier Name", "GST No", "Invoice No", "Amount", "Amount (Incl. Tax)"]
    ];

    const dataForExcel = filteredResults.map((row, index) => [
      (currentPage - 1) * rowsPerPage + index + 1,
      row.PurchaseDate ? new Date(row.PurchaseDate).toLocaleDateString() : "N/A",
      row.AccountName || "N/A",
      row.GSTinNo || "N/A",
      row.SupplierInvoiceNo || "N/A",
      row.Amount ?? 0, // KEEP as number
      row.AmountIncOfTax ?? 0, // KEEP as number
    ]);

    // Add total row
    dataForExcel.push([
      "TOTAL", "", "", "", "",
      totalAmount,
      totalAmountIncTax
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...filterData, ...headers, ...dataForExcel]);

    // Apply number format to Amount columns (F and G)
    const startRow = filterData.length + headers.length; // First data row index (0-based)
    for (let i = 0; i < dataForExcel.length; i++) {
      const rowIndex = startRow + i;

      const amountCell = XLSX.utils.encode_cell({ r: rowIndex, c: 5 }); // Column F
      const amountTaxCell = XLSX.utils.encode_cell({ r: rowIndex, c: 6 }); // Column G

      if (ws[amountCell]) ws[amountCell].z = "0.00";
      if (ws[amountTaxCell]) ws[amountTaxCell].z = "0.00";
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PurchaseReport");

    XLSX.writeFile(wb, `PurchaseReport_${fromDate}_to_${toDate}.xlsx`);
  };


  const exportToPDF = () => {
    if (!filteredResults.length) {
      alert("No data to export.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Purchase Report", 14, 10);

    const formattedFromDate = fromDate ? new Date(fromDate).toLocaleDateString() : "N/A";
    const formattedToDate = toDate ? new Date(toDate).toLocaleDateString() : "N/A";
    const formattedSupplier = selectedSupplier || "All";

    const totalAmount = filteredResults.reduce((sum, row) => sum + (row.Amount || 0), 0);
    const totalAmountIncTax = filteredResults.reduce((sum, row) => sum + (row.AmountIncOfTax || 0), 0);

    // Add filter info
    doc.setFontSize(10);
    let y = 18;
    const filterLines = [
      `From Date: ${formattedFromDate}      To Date: ${formattedToDate}`,
      `Supplier: ${formattedSupplier}`,
      `Total Amount: ${formatAmount(totalAmount)}      Total Amount (Incl. Tax): ${formatAmount(totalAmountIncTax)}`
    ];
    filterLines.forEach((line) => {
      doc.text(line, 14, y);
      y += 6;
    });

    // Table columns
    const tableColumn = ["Sl No", "Date", "Supplier Name", "GST No", "Invoice No", "Amount", "Amount (Incl. Tax)"];

    // Data rows
    const tableRows = filteredResults.map((row, index) => [
      index + 1,
      row.PurchaseDate ? new Date(row.PurchaseDate).toLocaleDateString() : "N/A",
      row.AccountName || "N/A",
      row.GSTinNo || "N/A",
      row.SupplierInvoiceNo || "N/A",
      row.Amount ? row.Amount.toFixed(2) : "0.00",
      row.AmountIncOfTax ? row.AmountIncOfTax.toFixed(2) : "0.00",
    ]);

    // Add total row
    tableRows.push([
      { content: "TOTAL", colSpan: 4, styles: { fontStyle: "bold", halign: "center" } },
      "",
      { content: totalAmount.toFixed(2), styles: { fontStyle: "bold" } },
      { content: totalAmountIncTax.toFixed(2), styles: { fontStyle: "bold" } }
    ]);

    // Render table
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: y + 2,
      theme: "grid",
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 10 },  // Sl No
        1: { cellWidth: 25 },  // Date
        2: { cellWidth: 35 },  // Supplier Name
        3: { cellWidth: 25 },  // GST No
        4: { cellWidth: 25 },  // Invoice No
        5: { cellWidth: 20 },  // Amount
        6: { cellWidth: 25 },  // Amount (Incl. Tax)
      },
      margin: { top: 20 },
    });

    doc.save(`PurchaseReport_${fromDate}_to_${toDate}.pdf`);
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
        cursor: "pointer",
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
      width: "6%"
    },
    {
      name: <span title="purchaseNo">Purchase No</span>,
      selector: (row) => row.PurchaseNo,
      sortable: true,
      width: "10%"
    },
    {
      name: <span title="Date">Date</span>,
      selector: (row) => (row.PurchaseDate ? new Date(row.PurchaseDate).toLocaleDateString() : "N/A"),
      sortable: true,
      width: "10%"
    },
    {
      name: <span title="Supplier Name">Supplier Name</span>,
      selector: (row) => row.AccountName || "N/A",
      sortable: true,
      width: "22%"
    },
    {
      name: <span title="GST No">GST No</span>,
      selector: (row) => row.GSTinNo || "N/A",
      sortable: true,
      width: "12%"
    },
    {
      name: <span title="Invoice No">Invoice No</span>,
      selector: (row) => row.SupplierInvoiceNo || "N/A",
      sortable: true,
      width: "12%"
    },
    {
      name: <span title="Amount">Amount</span>,
      selector: (row) => formatAmount(row.Amount),
      sortable: true,
      width: "14%",
      right: true
    },
    {
      name: <span title="Amount (Incl. Tax)">Amount (Incl. Tax)</span>,
      selector: (row) => formatAmount(row.AmountIncOfTax),
      sortable: true,
      width: "14%",
      right: true
    },
  ];

  useEffect(() => {
    // Retrieve from sessionStorage and parse JSON
    const storedCompanyData = sessionStorage.getItem("companyResponse");
    if (storedCompanyData) {
      setCompanyData(JSON.parse(storedCompanyData));
    }
  }, []);
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
  }, [fromDate, toDate]);

  return (
    <div className="container-fluid">
      {/* Header with Search and Export Buttons */}
      <div className="card shadow-sm mb-3 p-3">
        <h4>Purchase Report</h4>
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
                placeholder="Search purchases by supplier, invoice, amount..."
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
                Purchase Report Filters
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
                {/* Supplier Filter */}
                <div className="row g-3">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label htmlFor="Supplier" className="form-label fw-bold small text-muted">SUPPLIER</label>
                      <select
                        id="Supplier"
                        className="form-select"
                        value={selectedSupplier}
                        onChange={(e) => setSelectedSupplier(e.target.value)}
                      >
                        <option value="">All Suppliers</option>
                        {distinctSuppliers.map((supplier, index) => (
                          <option key={index} value={supplier}>
                            {supplier || "Unknown Supplier"}
                          </option>
                        ))}
                      </select>
                    </div>
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
            onRowClicked={(row) => fetchPurhaseDetails(row.PurchaseID)}
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

      {isModalOpen && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.5)", overflow: "auto" }}>
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content shadow-lg rounded">

              {/* Modal Header */}
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">Purchase Details</h5>
                <button type="button" className="close btn btn-danger rounded-circle p-2" onClick={handleCloseModal}>
                  <span>&times;</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4" id="modal-print-content">
                <div className="container-fluid">

                  {/* Invoice Header */}
                  <div className="row align-items-center mb-4 border-bottom pb-3">
                    <div className="col-md-6">
                      {[...new Map(PurchaseDetails.map(order =>
                        [`${order.PurchaseNo}`, order]
                      )).values()].map((customer, index) => (
                        <div key={index}>
                          <h2 className="fw-bold">
                            <small className="text-muted">
                              Purchase No. {customer.PurchaseNo}
                            </small>
                          </h2>
                          <h5 className="text-muted">
                            Date: {customer.PurchaseDate ? new Date(customer.PurchaseDate).toLocaleDateString() : "N/A"}
                          </h5>


                        </div>
                      ))}
                    </div>

                    <div className="col-md-6 text-end">
                      {/* <img className="logo" src="src/assets/logo_kairali.png" alt="Company Logo" style={{ maxWidth: "80px" }} /> */}
                      {companyData ? (
                        <ul className="list-unstyled mb-0">
                          <li><strong>{companyData.CompanyName}</strong></li>
                          <li style={{ fontSize: "12px" }}>{companyData.Address}</li>
                          {/* <li style={{ fontSize: "12px" }}>{companyData.District}, {companyData.State}</li> */}
                          <li style={{ fontSize: "12px" }}>{companyData.GSTinNo}</li>
                          {/* <li style={{ fontSize: "12px" }}>{companyData.Email}</li> */}
                          <li style={{ fontSize: "12px" }}>{companyData.MobileNO}</li>

                        </ul>
                      ) : (
                        <p>Loading company details...</p>
                      )}
                    </div>
                  </div>

                  {/* Company & User Details */}
                  <div className="row g-3 d-flex flex-wrap">
                    {[...new Map(PurchaseDetails.map(customer =>
                      [`${customer.CustomerName}-${customer.
                        CumAddress}-${customer.CumContact}`, customer])).values()].map((customer, index) => (
                          <div key={index} className="col-md-6">

                            <h5 className="fw-bold">Supplier Details</h5>
                            <ul className="list-unstyled  flex-grow-1">
                              <li><strong>Name:</strong> {customer.CustomerName}</li>

                            </ul>
                          </div>

                        ))}

                    {/* {[...new Map(Billdetails.map(customer =>
                      [`${customer.CustomerName}-${customer.CumAddress}-${customer.CumContact}`, customer]
                    )).values()].map((customer, index) => (
                      <div key={index} className="col-md-6">
                        <div className="card shadow-sm p-3 h-100 d-flex flex-column">
                          <h5 className="fw-bold">Bill Details</h5>
                          <ul className="list-unstyled flex-grow-1">
                            <li><strong>Salesman:</strong> {customer.SalesmanName}</li>
                            <li><strong>BilledBy:</strong> {customer.CreatedByName}</li>
                            <li><strong>Mode:</strong> {customer.BillModeText}</li>
                            <li><strong>Type:</strong> {customer.WholeSaleRetail}</li>
                          </ul>
                        </div>
                      </div>
                    ))} */}
                  </div>

                  {/* Items Table */}
                  <div className="card shadow-sm p-3 mt-4">
                    <h5 className="fw-bold">Items Summary</h5>
                    <div className="table-responsive">
                      <div className="table-responsive" style={{ maxHeight: "300px", overflowY: "auto" }}>
                        <table className="table table-bordered text-center mb-0" style={{ fontSize: "10px", minWidth: "auto" }}>
                          <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "#f8f9fa" }}>
                            <tr>
                              <th>No.</th>
                              <th>ItmName</th>
                              <th>MRP</th>
                              <th>Qty</th>
                              <th>Price</th>
                              <th>Tax%</th>
                              <th>TaxAmnt</th>
                              <th>Rate</th>
                              <th>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {PurchaseDetails.length > 0 ? (
                              PurchaseDetails.map((item, index) => (
                                <tr key={index}>
                                  <td>{index + 1}</td>
                                  <td>{item.ItemName}</td>
                                  <td>{formatAmount(item.MRP)}</td>
                                  <td>{item.Quantity}</td>
                                  <td>{item.UnitPrice}</td>
                                  <td>{formatAmount(item.TaxPercentage)}</td>
                                  <td>{formatAmount(item.TaxAmount)}</td>
                                  <td>{formatAmount(item.NetRate)}</td>
                                  <td>{formatAmount(item.Amount)}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="9" className="text-center">No details available</td>
                              </tr>
                            )}
                          </tbody>
                          <tfoot>
                            <tr className="table-dark text-white">
                              <th colSpan="6" className="text-end">Total:</th>
                              <th>{formatAmount(PurchaseDetails.reduce((sum, item) => sum + item.TaxAmount, 0))}</th>
                              <th>{formatAmount(PurchaseDetails.reduce((sum, item) => sum + item.NetRate, 0))}</th>
                              <th>{formatAmount(totalitemAmount)}</th>
                            </tr>

                            {billDiscount > 0 && (
                              <>
                                <tr className="table-light text-dark">
                                  <th colSpan="8" className="text-end">Discount:</th>
                                  <th>{formatAmount(billDiscount)}</th>
                                </tr>
                                <tr className="table-light text-dark fw-bold">
                                  <th colSpan="8" className="text-end">Total Bill Amount:</th>
                                  <th>{formatAmount(totalitemAmount - billDiscount)}</th>
                                </tr>
                              </>
                            )}
                          </tfoot>
                        </table>
                      </div>

                    </div>

                  </div>

                  {/* Notes Section */}
                  {/* <div className="row g-3 mt-4">
                    <div className="col-md-4">
                      <div className="card shadow-sm p-3">
                        <h5 className="fw-bold">Notes</h5>
                        <p>Payment is requested within 15 days of receiving this invoice.</p>
                      </div>
                    </div>
                  
                    {PurchaseDetails.length > 0 && PurchaseDetails[0].Narration && (
                      <div className="col-md-4">
                        <div className="card shadow-sm p-3">
                          <h5 className="fw-bold">Narration</h5>
                          <p>{PurchaseDetails[0].Narration}</p>
                        </div>
                      </div>
                    )}

                  </div> */}

                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer bg-light">
                {/* <button type="button" className="btn btn-primary" onClick={handlePrintpop}>
                      Print
                    </button> */}
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

export default PurchaseReport;