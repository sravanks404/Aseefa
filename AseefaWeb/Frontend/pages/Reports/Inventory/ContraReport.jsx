 
import React, { useState, useEffect, useMemo } from "react";
import api from '../../apiService';
import DataTable from "react-data-table-component";
import { FaSearch, FaFileExcel, FaFilePdf, FaFilter } from "react-icons/fa";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import "jspdf-autotable";
import { usePermission } from "../../../src/context/permissionContex"; // adjust path to match your project

const FORM_CODE = "CONTRA";

const ContraReport = () => {
  const { getPermission, refreshPermissions } = usePermission();
  const permission = getPermission(FORM_CODE);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadPermissions = async () => {
      await refreshPermissions();
      if (isMounted) setPermissionsLoading(false);
    };
    loadPermissions();
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    entityCount: 0,
    totalAmount: 0,
    totalNotes: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(500);
  const [selectedFrom, setSelectedFrom] = useState("");
  const [selectedFYear, setSelectedFYear] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [distinctFroms, setDistinctFroms] = useState([]);
  const [distinctFYears, setDistinctFYears] = useState([]);
  const [distinctUsers, setDistinctUsers] = useState([]);
  const [companyData, setCompanyData] = useState(null);

  // Fetch Contra report data
  const fetchContraReport = async () => {
    if (permissionsLoading || !permission.CanView) return;
    setIsLoading(true);
    setError("");

    try {
      const CompanyID = sessionStorage.getItem("CompanyID");

      const response = await api.get("/api/GetContraReport", {
        params: { CompanyID, FromDate: fromDate, ToDate: toDate },
      });

      const data = response.data || [];
      setReportData(data);

      // Get distinct froms for filter dropdown
      const uniqueFroms = [...new Set(data.map(item => item.FHName))];
      setDistinctFroms(uniqueFroms);

      // Get distinct FYears for filter dropdown
      const uniqueFYears = [...new Set(data.map(item => item.FYear))];
      setDistinctFYears(uniqueFYears);

      // Get distinct Users for filter dropdown
      const uniqueUsers = [...new Set(data.map(item => item.Name))];
      setDistinctUsers(uniqueUsers);

      // Calculate summary
      const entityCount = new Set(data.map(item => item.FHName)).size;
      const totalAmount = data.reduce((sum, item) => sum + (item.Amt || 0), 0);
      const totalNotes = data.length;

      setSummary({ entityCount, totalAmount, totalNotes });
    } catch (err) {
      setError("Failed to fetch Contra report. Please try again.");
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter results based on search query and filters
  const filteredResults = useMemo(() => {
    let filteredData = reportData;

    if (selectedFrom) {
      filteredData = filteredData.filter(row => row.FHName === selectedFrom);
    }

    if (selectedFYear) {
      filteredData = filteredData.filter(row => row.FYear === selectedFYear);
    }

    if (selectedUser) {
      filteredData = filteredData.filter(row => row.Name === selectedUser);
    }

    if (searchQuery) {
      filteredData = filteredData.filter((row) =>
        row.FHName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.THName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.BillNo?.toString().includes(searchQuery) ||
        row.Amt?.toString().includes(searchQuery) ||
        row.ADate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.Narration?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.FYear?.toString().includes(searchQuery) ||
        row.FMode?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Update summary with filtered data
    const filteredTotalAmount = filteredData.reduce((sum, row) => sum + (row.Amt || 0), 0);
    const filteredTotalNotes = filteredData.length;
    const filteredEntityCount = new Set(filteredData.map(item => item.FHName)).size;

    setSummary({
      entityCount: filteredEntityCount,
      totalAmount: filteredTotalAmount,
      totalNotes: filteredTotalNotes,
    });

    return filteredData;
  }, [reportData, selectedFrom, selectedFYear, selectedUser, searchQuery]);

  const handleClear = () => {
    setFromDate(getPreviousDate(7));
    setToDate(getCurrentDate());
    setSelectedFrom("");
    setSelectedFYear("");
    setSelectedUser("");
    setError("");
    setSearchQuery("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchContraReport();
  };

  // Export functions
  const exportToExcel = () => {
    if (!permission.CanExport) {
      alert("You do not have permission to export this report.");
      return;
    }
    if (!filteredResults.length) {
      alert("No data to export.");
      return;
    }

    const formattedFromDate = fromDate ? new Date(fromDate).toLocaleDateString() : "N/A";
    const formattedToDate = toDate ? new Date(toDate).toLocaleDateString() : "N/A";
    const formattedFrom = selectedFrom || "All";
    const formattedFYear = selectedFYear || "All";
    const formattedUser = selectedUser || "All";

    const totalAmount = filteredResults.reduce((sum, row) => sum + (row.Amt || 0), 0);

    const filterData = [
      ["From Date", formattedFromDate],
      ["To Date", formattedToDate],
      ["From", formattedFrom],
      ["FYear", formattedFYear],
      ["User", formattedUser],
      ["Total Amount", totalAmount],
      [],
    ];

    const headers = [
      ["Sl No", "Voucher Date", "Bill No", "From Head", "To Head", "Amount", "User", "Narration", "FYear"]
    ];

    const dataForExcel = filteredResults.map((row, index) => [
      index + 1,
      row.ADate ? new Date(row.ADate).toLocaleDateString() : "N/A",
      row.BillNo || "N/A",
      row.FHName || "N/A",
      row.THName || "N/A",
      row.Amt ?? 0,
      row.Name || "N/A",
      row.Narration || "N/A",
      row.FYear || "N/A",

    ]);

    // Add total row
    dataForExcel.push([
      "TOTAL", "", "", "", "", totalAmount, "", "", "", ""
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...filterData, ...headers, ...dataForExcel]);

    // Apply number format to Amount column (F, index 5)
    const startRow = filterData.length + headers.length;
    for (let i = 0; i < dataForExcel.length; i++) {
      const rowIndex = startRow + i;
      const amountCell = XLSX.utils.encode_cell({ r: rowIndex, c: 5 });
      if (ws[amountCell]) ws[amountCell].z = "0.00";
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ContraReport");

    XLSX.writeFile(wb, `ContraReport_${fromDate}_to_${toDate}.xlsx`);
  };

  const exportToPDF = () => {
    if (!permission.CanExport && !permission.CanPrint) {
      alert("You do not have permission to export this report.");
      return;
    }
    if (!filteredResults.length) {
      alert("No data to export.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Contra Report", 14, 10);

    const formattedFromDate = fromDate ? new Date(fromDate).toLocaleDateString() : "N/A";
    const formattedToDate = toDate ? new Date(toDate).toLocaleDateString() : "N/A";
    const formattedFrom = selectedFrom || "All";
    const formattedFYear = selectedFYear || "All";
    const formattedUser = selectedUser || "All";

    const totalAmount = filteredResults.reduce((sum, row) => sum + (row.Amt || 0), 0);

    // Add filter info
    doc.setFontSize(10);
    let y = 18;
    const filterLines = [
      `From Date: ${formattedFromDate}      To Date: ${formattedToDate}`,
      `From: ${formattedFrom}`,
      `FYear: ${formattedFYear}`,
      `User: ${formattedUser}`,
      `Total Amount: ${formatAmount(totalAmount)}`
    ];
    filterLines.forEach((line) => {
      doc.text(line, 14, y);
      y += 6;
    });

    // Table columns
    const tableColumn = ["Sl No", "Voucher Date", "Bill No", "From Head", "To Head", "Amount", "User", "Narration", "FYear"];

    // Data rows
    const tableRows = filteredResults.map((row, index) => [
      index + 1,
      row.ADate ? new Date(row.ADate).toLocaleDateString() : "N/A",
      row.BillNo || "N/A",
      row.FHName || "N/A",
      row.THName || "N/A",
      row.Amt ? row.Amt.toFixed(2) : "0.00",
      row.Name || "N/A",
      row.Narration || "N/A",
      row.FYear || "N/A",
      row.FMode || "N/A",
    ]);

    // Add total row
    tableRows.push([
      { content: "TOTAL", colSpan: 5, styles: { fontStyle: "bold" } },
      totalAmount.toFixed(2),
      "",
      "",
      "",
      ""
    ]);

    // Render table
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: y + 2,
      theme: "grid",
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 8 },   // Sl No
        1: { cellWidth: 20 },  // Voucher Date
        2: { cellWidth: 15 },  // Bill No
        3: { cellWidth: 24 },  // From Head
        4: { cellWidth: 22 },  // To Head
        5: { cellWidth: 20 },  // Amount
        6: { cellWidth: 20 },  // User
        7: { cellWidth: 28 },  // Narration
        8: { cellWidth: 15 },  // FYear
        9: { cellWidth: 15 },  // Mode
      },
      margin: { top: 20 },
    });

    doc.save(`ContraReport_${fromDate}_to_${toDate}.pdf`);
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
      width: "5%"
    },
    {
      name: <span title="Voucher Date">Date</span>,
      selector: (row) => (row.ADate ? new Date(row.ADate).toLocaleDateString() : "N/A"),
      sortable: true,
      width: "10%"
    },
    {
      name: <span title="Bill No">Bill No</span>,
      selector: (row) => row.BillNo || "N/A",
      sortable: true,
      width: "8%"
    },
    {
      name: <span title="From Head">Debit </span>,
      selector: (row) => row.FHName || "N/A",
      sortable: true,
      width: "18%"
    },
    {
      name: <span title="To Head">Credit </span>,
      selector: (row) => row.THName || "N/A",
      sortable: true,
      width: "18%"
    },
    {
      name: <span title="Amount">Amount</span>,
      selector: (row) => formatAmount(row.Amt),
      sortable: true,
      width: "13%",

    },

    {
      name: <span title="Narration">Narration</span>,
      selector: (row) => row.Narration || "N/A",
      sortable: true,
      width: "20%"
    },
    {
      name: <span title="FYear">FYear</span>,
      selector: (row) => row.FYear || "N/A",
      sortable: true,
      width: "8%"
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
    fetchContraReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, permissionsLoading]);

  // Wait for the permission refresh to complete before deciding what to show
  if (permissionsLoading) {
    return (
      <div className="container-fluid d-flex align-items-center justify-content-center" style={{ height: "60vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="text-muted">Checking permissions...</div>
        </div>
      </div>
    );
  }

  // Block the whole page if the user has no view permission for CONTRA
  if (!permission.CanView) {
    return (
      <div className="container-fluid d-flex align-items-center justify-content-center" style={{ height: "60vh" }}>
        <div className="text-center">
          <h5 className="text-danger">Access Denied</h5>
          <p className="text-muted">You do not have permission to view the Contra Report.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Header with Search and Export Buttons */}
      <div className="card shadow-sm mb-3 p-3">
        <h4>Contra Report</h4>
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
                placeholder="Search Contra by from head, to head, bill no, amount..."
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

            {/* Export Buttons - only visible if user has export permission */}
            {permission.CanExport && (
              <div className="btn-group">
                <button className="btn btn-outline" onClick={exportToExcel}>
                  <FaFileExcel className="me-1" /> Excel
                </button>
                <button className="btn btn-outline" onClick={exportToPDF}>
                  <FaFilePdf className="me-1" /> PDF
                </button>
              </div>
            )}
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
                Contra Report Filters
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
                 
{/* From & FYEAR Row */}
<div className="row mb-3 g-3">
  <div className="col-md-6">
    <label htmlFor="From" className="form-label fw-bold small text-muted">FROM</label>
    <select
      id="From"
      className="form-select"
      value={selectedFrom}
      onChange={(e) => setSelectedFrom(e.target.value)}
    >
      <option value="">All From</option>
      {distinctFroms.map((fromName, index) => (
        <option key={index} value={fromName}>
          {fromName || "Unknown From"}
        </option>
      ))}
    </select>
  </div>

  <div className="col-md-6">
    <label htmlFor="FYear" className="form-label fw-bold small text-muted">FYEAR</label>
    <select
      id="FYear"
      className="form-select"
      value={selectedFYear}
      onChange={(e) => setSelectedFYear(e.target.value)}
    >
      <option value="">All FYears</option>
      {distinctFYears.map((fyear, index) => (
        <option key={index} value={fyear}>
          {fyear || "Unknown FYear"}
        </option>
      ))}
    </select>
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

export default ContraReport;