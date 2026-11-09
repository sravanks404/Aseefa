import React, { useState, useEffect, useMemo, useRef } from "react";
import api from '../../apiService';
import DataTable from "react-data-table-component";
import { FaSearch, FaFileExcel, FaFilePdf, FaFilter } from "react-icons/fa";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import "jspdf-autotable";

const BillingReturnReport = () => {
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
    customerCount: 0,
    totalAmount: 0,
    totalReturns: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(500);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [distinctCustomers, setDistinctCustomers] = useState([]);
  const [returnDetails, setReturnDetails] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companyData, setCompanyData] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  // Fetch billing return report data
  const fetchBillingReturnReport = async () => {
    setIsLoading(true);
    setError("");

    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      const financialResponse = JSON.parse(sessionStorage.getItem("financialResponse"));
      const FYearID = financialResponse?.FYearID;

      const response = await api.get("/api/GetBillingReturn", {
        params: { CompanyID, FromDate: fromDate, ToDate: toDate, FYearID },
      });

      const data = response.data || [];
      setReportData(data);

      // Get distinct customers for filter dropdown
      const uniqueCustomers = [...new Set(data.map(item => item.CustomerName))];
      setDistinctCustomers(uniqueCustomers);

      // Calculate summary
      const customerCount = new Set(data.map(item => item.CustomerName)).size;
      const totalAmount = data.reduce((sum, item) => sum + (item.BillAmount || 0), 0);
      const totalReturns = data.length;

      setSummary({ customerCount, totalAmount, totalReturns });
    } catch (err) {
      setError("Failed to fetch billing return report. Please try again.");
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBillingReturnDetails = async (ReturnNo) => {
    const CompanyID = sessionStorage.getItem("CompanyID");
    const financialResponse = JSON.parse(sessionStorage.getItem("financialResponse"));
    const FYearID = financialResponse?.FYearID;

    try {
      const response = await api.get("/api/GetBillingReturn", {
        params: {
          ReturnNo: ReturnNo,
          CompanyID: Number(CompanyID),
          FYearID,
        },
      });

      setReturnDetails(response?.data || []);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error fetching billing return details:", err);
    }
  };

  // Filter results based on search query and filters
  const filteredResults = useMemo(() => {
    let filteredData = reportData;

    if (selectedCustomer) {
      filteredData = filteredData.filter(row => row.CustomerName === selectedCustomer);
    }

    if (searchQuery) {
      filteredData = filteredData.filter((row) =>
        row.CustomerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.retailno?.toString().includes(searchQuery) ||
        row.BillNo?.toString().includes(searchQuery) ||
        row.BillAmount?.toString().includes(searchQuery) ||
        row.BillDate?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Update summary with filtered data
    const filteredTotalAmount = filteredData.reduce((sum, row) => sum + (row.BillAmount || 0), 0);
    const filteredTotalReturns = filteredData.length;
    const filteredCustomerCount = new Set(filteredData.map(item => item.CustomerName)).size;

    setSummary({
      customerCount: filteredCustomerCount,
      totalAmount: filteredTotalAmount,
      totalReturns: filteredTotalReturns,
    });

    return filteredData;
  }, [reportData, selectedCustomer, searchQuery]);

  const handleClear = () => {
    setFromDate(getPreviousDate(7));
    setToDate(getCurrentDate());
    setSelectedCustomer("");
    setError("");
    setSearchQuery("");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchBillingReturnReport();
    setIsModalOpen(false);
  };

  const billDiscount = returnDetails[0]?.DiscountRs || 0;
  const totalitemAmount = returnDetails.reduce((sum, item) => sum + item.Amount, 0);

  // Function to compute bill series
  const getBillSeries = (row) => {
    const series = row.InvSeries || "";
    const returnNo = row.retailno || "";
    if (!returnNo) return series || "N/A";
    const lastSlash = series.lastIndexOf('/');
    let prefix = series;
    if (lastSlash !== -1) {
      prefix = series.substring(0, lastSlash + 1);
    } else {
      prefix += '/';
    }
    return prefix + returnNo;
  };

  // Export functions
  const exportToExcel = () => {
    if (!filteredResults.length) {
      alert("No data to export.");
      return;
    }

    const formattedFromDate = fromDate ? new Date(fromDate).toLocaleDateString() : "N/A";
    const formattedToDate = toDate ? new Date(toDate).toLocaleDateString() : "N/A";
    const formattedCustomer = selectedCustomer || "All";

    const totalAmount = filteredResults.reduce((sum, row) => sum + (row.BillAmount || 0), 0);

    const filterData = [
      ["From Date", formattedFromDate],
      ["To Date", formattedToDate],
      ["Customer", formattedCustomer],
      ["Total Amount", totalAmount],
      [],
    ];

    const headers = [
      ["Sl No", "Date", "Customer Name", "Series", "Amount"]
    ];

    const dataForExcel = filteredResults.map((row, index) => [
      (currentPage - 1) * rowsPerPage + index + 1,
      row.BillDate ? new Date(row.BillDate).toLocaleDateString() : "N/A",
      row.CustomerName || "N/A",
      getBillSeries(row),
      row.BillAmount ?? 0,
    ]);

    // Add total row
    dataForExcel.push([
      "TOTAL", "", "", "",
      totalAmount
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...filterData, ...headers, ...dataForExcel]);

    // Apply number format to Amount column (E)
    const startRow = filterData.length + headers.length;
    for (let i = 0; i < dataForExcel.length; i++) {
      const rowIndex = startRow + i;
      const amountCell = XLSX.utils.encode_cell({ r: rowIndex, c: 4 });
      if (ws[amountCell]) ws[amountCell].z = "0.00";
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BillingReturnReport");

    XLSX.writeFile(wb, `BillingReturnReport_${fromDate}_to_${toDate}.xlsx`);
  };

  const exportToPDF = () => {
    if (!filteredResults.length) {
      alert("No data to export.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Billing Return Report", 14, 10);

    const formattedFromDate = fromDate ? new Date(fromDate).toLocaleDateString() : "N/A";
    const formattedToDate = toDate ? new Date(toDate).toLocaleDateString() : "N/A";
    const formattedCustomer = selectedCustomer || "All";

    const totalAmount = filteredResults.reduce((sum, row) => sum + (row.BillAmount || 0), 0);

    // Add filter info
    doc.setFontSize(10);
    let y = 18;
    const filterLines = [
      `From Date: ${formattedFromDate}      To Date: ${formattedToDate}`,
      `Customer: ${formattedCustomer}`,
      `Total Amount: ${formatAmount(totalAmount)}`
    ];
    filterLines.forEach((line) => {
      doc.text(line, 14, y);
      y += 6;
    });

    // Table columns
    const tableColumn = ["Sl No", "Date", "Customer Name", "Series", "Amount"];

    // Data rows
    const tableRows = filteredResults.map((row, index) => [
      index + 1,
      row.BillDate ? new Date(row.BillDate).toLocaleDateString() : "N/A",
      row.CustomerName || "N/A",
      getBillSeries(row),
      row.BillAmount ? row.BillAmount.toFixed(2) : "0.00",
    ]);

    // Add total row
    tableRows.push([
      { content: "TOTAL", colSpan: 4, styles: { fontStyle: "bold", halign: "center" } },
      { content: totalAmount.toFixed(2), styles: { fontStyle: "bold" } }
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
        2: { cellWidth: 50 },  // Customer Name
        3: { cellWidth: 20 },  // Series
        4: { cellWidth: 35 },  // Amount
      },
      margin: { top: 20 },
    });

    doc.save(`BillingReturnReport_${fromDate}_to_${toDate}.pdf`);
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
      name: <span title="Date">BillDate</span>,
      selector: (row) => (row.BillDate ? new Date(row.BillDate).toLocaleDateString() : "N/A"),
      sortable: true,
      width: "10%"
    },
     {
      name: <span title="Series"> Bill Series</span>,
      selector: (row) => getBillSeries(row),
      sortable: true,
      width: "20%"
    },
    {
      name: <span title="Customer Name">Customer Name</span>,
      selector: (row) => row.CustomerName || "N/A",
      sortable: true,
      width: "40%"
    },
    {
      name: <span title="Amount">Bill Amount</span>,
      selector: (row) => formatAmount(row.BillAmount),
      sortable: true,
      width: "22%",
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
    fetchBillingReturnReport();
  }, [fromDate, toDate]);

  return (
    <div className="container-fluid">
      {/* Header with Search and Export Buttons */}
      <div className="card shadow-sm mb-3 p-3">
        <h4>Billing Return Report</h4>
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
                placeholder="Search returns by customer, return no, amount..."
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
                Billing Return Report Filters
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
                {/* Customer Filter */}
                <div className="row g-3">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label htmlFor="Customer" className="form-label fw-bold small text-muted">CUSTOMER</label>
                      <select
                        id="Customer"
                        className="form-select"
                        value={selectedCustomer}
                        onChange={(e) => setSelectedCustomer(e.target.value)}
                      >
                        <option value="">All Customers</option>
                        {distinctCustomers.map((customer, index) => (
                          <option key={index} value={customer}>
                            {customer || "Unknown Customer"}
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
            onRowClicked={(row) => {
              setSelectedRow(row);
              fetchBillingReturnDetails(row.retailno);
            }}
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
                <h5 className="modal-title fw-bold">Billing Return Details</h5>
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
                      <h2 className="fw-bold">
                        <small className="text-muted">Return No. {selectedRow?.retailno}</small>
                      </h2>
                      <h5 className="text-muted">
                        Date: {selectedRow?.BillDate ? new Date(selectedRow.BillDate).toLocaleDateString() : "N/A"}
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

                  {/* Company & User Details */}
                  <div className="row g-3 d-flex flex-wrap">
                    <div className="col-md-6">
                      <h5 className="fw-bold">Customer Details</h5>
                      <ul className="list-unstyled flex-grow-1">
                        <li><strong>Name:</strong> {selectedRow?.CustomerName || "N/A"}</li>
                      </ul>
                    </div>
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
                              <th>ItemName</th>
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
                            {returnDetails.length > 0 ? (
                              returnDetails.map((item, index) => (
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
                              <th>{formatAmount(returnDetails.reduce((sum, item) => sum + item.TaxAmount, 0))}</th>
                              <th>{formatAmount(returnDetails.reduce((sum, item) => sum + item.NetRate, 0))}</th>
                              <th>{formatAmount(totalitemAmount)}</th>
                            </tr>

                            {billDiscount > 0 && (
                              <>
                                <tr className="table-light text-dark">
                                  <th colSpan="8" className="text-end">Discount:</th>
                                  <th>{formatAmount(billDiscount)}</th>
                                </tr>
                                <tr className="table-light text-dark fw-bold">
                                  <th colSpan="8" className="text-end">Total Return Amount:</th>
                                  <th>{formatAmount(totalitemAmount - billDiscount)}</th>
                                </tr>
                              </>
                            )}
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Modal Footer */}
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

export default BillingReturnReport;