

import React, { useState, useEffect } from "react";
import api from '../../apiService';
import DataTable from "react-data-table-component";
import { FaSearch, FaFileExcel, FaFilePdf, FaFilter } from "react-icons/fa";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import Select from 'react-select';
import { usePermission } from "../../../src/context/permissionContex"; // adjust path to match your project

const FORM_CODE = "JOURNAL";

const JournalReport = () => {
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



  // State management
  const [fromDate, setFromDate] = useState(getPreviousDate(30));
  const [toDate, setToDate] = useState(getCurrentDate());
  const [Type, setType] = useState("SJ");
  const [Narration, setNarration] = useState("SINGLE JOURNAL");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(500);
  const [selectedDebit, setSelectedDebit] = useState(null);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [distinctDebits, setDistinctDebits] = useState([]);
  const [distinctCredits, setDistinctCredits] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Custom styles for DataTable
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

  // Fetch distinct Debit and Credit options
  useEffect(() => {
    if (reportData.length > 0) {
      const debits = [...new Set(reportData.map(row =>
        Array.isArray(row.HName) && row.HName.length > 0 ? row.HName[0] : row.HName || "N/A"
      ))].filter(Boolean);

      const credits = [...new Set(reportData.map(row =>
        Array.isArray(row.HName) && row.HName.length > 1 ? row.HName[1] : "N/A"
      ))].filter(Boolean);

      setDistinctDebits(debits);
      setDistinctCredits(credits);
    }
  }, [reportData]);

  // Format amount with INR symbol
  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Fetch journal report data
  const fetchJournalReport = async () => {
    if (permissionsLoading || !permission.CanView) return;
    setIsLoading(true);
    setError(null);

    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      const financialResponse = JSON.parse(sessionStorage.getItem("financialResponse"));
      const FYearID = financialResponse?.FYearID;

      const response = await api.get("/api/GetJournalReport", {
        params: { CompanyID, FromDate: fromDate, ToDate: toDate, FYearID, Type, Narration },
      });

      setReportData(response.data || []);
    } catch (err) {
      console.error("Error fetching report:", err);
      setError("Failed to fetch journal report. Please try again.");
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchJournalReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionsLoading]);

  // Clear all filters
  const handleClear = () => {
    setFromDate(getPreviousDate(30));
    setToDate(getCurrentDate());
    setSelectedDebit(null);
    setSelectedCredit(null);
    setSearchQuery("");
    setReportData([]);
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!permission.CanExport) {
      alert("You do not have permission to export this report.");
      return;
    }
    if (!filteredData.length) {
      alert("No data to export.");
      return;
    }

    const formattedFromDate = fromDate ? new Date(fromDate).toLocaleDateString() : "N/A";
    const formattedToDate = toDate ? new Date(toDate).toLocaleDateString() : "N/A";
    const formattedDebit = selectedDebit ? selectedDebit.label : "All";
    const formattedCredit = selectedCredit ? selectedCredit.label : "All";

    const filterData = [
      ["From Date", formattedFromDate],
      ["To Date", formattedToDate],
      ["Selected Debit", formattedDebit],
      ["Selected Credit", formattedCredit],
      [],
    ];

    const ws = XLSX.utils.aoa_to_sheet(filterData);
    const headers = [["Sl No", "Date", "Debit", "Amount", "Narration", "Credit"]];

    const dataForExcel = filteredData.map((row, index) => [
      (currentPage - 1) * rowsPerPage + index + 1,
      row.ADate ? new Date(row.ADate).toLocaleDateString() : "N/A",
      Array.isArray(row.HName) && row.HName.length > 0 ? row.HName[0] : row.HName || "N/A",
      row.Amt || 0,
      row.OtherNarration || "N/A",
      Array.isArray(row.HName) && row.HName.length > 1 ? row.HName[1] : "N/A",
    ]);

    const totalAmount = filteredData.reduce((sum, row) => sum + (row.Amt || 0), 0);
    dataForExcel.push(["TOTAL", "", "", totalAmount, "", ""]);

    XLSX.utils.sheet_add_aoa(ws, headers, { origin: filterData.length + 1 });
    XLSX.utils.sheet_add_aoa(ws, dataForExcel, { origin: filterData.length + 2 });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "JournalReport");
    XLSX.writeFile(wb, `JournalReport_${fromDate}_to_${toDate}.xlsx`);
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!permission.CanExport && !permission.CanPrint) {
      alert("You do not have permission to export this report.");
      return;
    }
    if (!filteredData.length) {
      alert("No data to export.");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("Journal Report", 14, 15);

    // Add filters to PDF
    doc.setFontSize(10);
    doc.text(`From Date: ${fromDate ? new Date(fromDate).toLocaleDateString() : "N/A"}`, 14, 25);
    doc.text(`To Date: ${toDate ? new Date(toDate).toLocaleDateString() : "N/A"}`, 80, 25);
    doc.text(`Selected Debit: ${selectedDebit ? selectedDebit.label : "All"}`, 150, 25);
    doc.text(`Selected Credit: ${selectedCredit ? selectedCredit.label : "All"}`, 14, 32);

    // Prepare table data
    const tableColumn = ["Sl No", "Date", "Debit", "Amount", "Narration", "Credit"];
    const tableRows = filteredData.map((row, index) => [
      index + 1,
      row.ADate ? new Date(row.ADate).toLocaleDateString() : "N/A",
      Array.isArray(row.HName) && row.HName.length > 0 ? row.HName[0] : row.HName || "N/A",
      row.Amt != null ? Number(row.Amt).toFixed(2) : "0.00",
      row.OtherNarration || "N/A",
      Array.isArray(row.HName) && row.HName.length > 1 ? row.HName[1] : "N/A",
    ]);

    // Add total row at the bottom
    const totalAmount = filteredData.reduce((sum, row) => sum + (row.Amt || 0), 0);
    tableRows.push([
      { content: "TOTAL", colSpan: 3, styles: { fontStyle: "bold", halign: "center" } },
      { content: `${totalAmount.toFixed(2)}`, styles: { fontStyle: "bold", halign: "right" } },
      "", ""
    ]);

    // Add table to PDF
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "hidden",
        valign: "middle"
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
        halign: "center"
      },
      bodyStyles: {
        textColor: [50, 50, 50]
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" }, // Sl No
        1: { cellWidth: 20, halign: "center" }, // Date
        2: { cellWidth: 40 },                  // Debit
        3: { cellWidth: 20, halign: "right" },  // Amount
        4: { cellWidth: 50 },                   // Narration
        5: { cellWidth: 40 }                    // Credit
      },
      didDrawPage: function (data) {
        // Footer with page numbers
        doc.setFontSize(10);
        doc.setTextColor(150);
        const pageCount = doc.internal.getNumberOfPages();
        if (pageCount > 1) {
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            doc.internal.pageSize.width - 20,
            doc.internal.pageSize.height - 10,
            { align: "right" }
          );
        }
      }
    });

    // Save the PDF
    doc.save(`JournalReport_${fromDate}_to_${toDate}.pdf`);
  };

  // DataTable columns
  const columns = [
    {
      name: "Sl No",
      selector: (_, index) => index + 1 + (currentPage - 1) * rowsPerPage,
      sortable: false,
      width: "6%",
    },
    {
      name: "Date",
      selector: (row) => row.ADate ? new Date(row.ADate).toLocaleDateString() : "N/A",
      sortable: true,
      width: "10%",
    },
    {
      name: "Debit",
      selector: (row) => Array.isArray(row.HName) && row.HName.length > 0 ? row.HName[0] : row.HName || "N/A",
      sortable: true,
      width: "19%",
    },
    {
      name: "Amount",
      selector: (row) => row.Amt ? parseFloat(row.Amt).toFixed(2) : "0.00",
      sortable: true,
      width: "9%",
    },
    {
      name: "Narration",
      selector: (row) => row.OtherNarration || "N/A",
      sortable: true,
      width: "33%",
    },
    {
      name: "Credit",
      selector: (row) => Array.isArray(row.HName) && row.HName.length > 1 ? row.HName[1] : "N/A",
      sortable: true,
      width: "23%",
    },
  ];

  // Filter data based on selections
  const filteredData = reportData.filter((row) => {
    const searchString = searchQuery.toLowerCase();

    // Debit filter
    const debitMatch = !selectedDebit ||
      (Array.isArray(row.HName) && row.HName[0] === selectedDebit.value) ||
      row.HName === selectedDebit.value;

    // Credit filter
    const creditMatch = !selectedCredit ||
      (Array.isArray(row.HName) && row.HName[1] === selectedCredit.value);

    // Search filter
    const searchMatch =
      (row.OtherNarration && row.OtherNarration.toLowerCase().includes(searchString)) ||
      (row.HName && row.HName.toString().toLowerCase().includes(searchString)) ||
      (row.Amt && row.Amt.toString().includes(searchQuery)) ||
      (row.ADate && new Date(row.ADate).toLocaleDateString().includes(searchQuery));

    return debitMatch && creditMatch && searchMatch;
  });

  // Calculate grand total
  const grandTotal = filteredData.reduce((sum, row) => sum + (row.Amt || 0), 0);

  // Custom footer component
  const CustomFooter = ({ rowsPerPage, rowCount, currentPage, onChangePage, onChangeRowsPerPage }) => {
    const totalPages = Math.ceil(rowCount / rowsPerPage);

    return (
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-3 bg-light">
        <div className="fw-semibold text-dark mb-2 mb-md-0">
          Total Amount: {formatAmount(grandTotal)}
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

  // Prepare select options
  const debitSelectOptions = [
    { value: "", label: "All Debits" },
    ...distinctDebits.map(debit => ({ value: debit, label: debit }))
  ];

  const creditSelectOptions = [
    { value: "", label: "All Credits" },
    ...distinctCredits.map(credit => ({ value: credit, label: credit }))
  ];

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

  // Block the whole page if the user has no view permission for JOURNAL
  if (!permission.CanView) {
    return (
      <div className="container-fluid d-flex align-items-center justify-content-center" style={{ height: "60vh" }}>
        <div className="text-center">
          <h5 className="text-danger">Access Denied</h5>
          <p className="text-muted">You do not have permission to view the Journal Report.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Search + Filters + Exports - Compact Header */}
      <div className="card shadow-sm mb-3 p-3">
        <h4>Journal Report</h4>
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
          {/* Search - Full width on mobile, then fixed */}
          <div className="w-100 w-md-50">
            <div className="input-group">
              <span className="input-group-text bg-primary text-white">
                <FaSearch />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by Debit, Amount, Credit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons Group */}
          <div className="d-flex flex-wrap justify-content-end gap-2 w-100 w-md-auto">
            {/* Filter Button */}
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => setIsFilterModalOpen(true)}
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
      {isFilterModalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-light">
                <h5 className="modal-title text-primary">
                  <FaFilter className="me-2" />
                  Journal Report Filters
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsFilterModalOpen(false)}
                ></button>
              </div>

              <div className="modal-body">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  fetchJournalReport();
                  setIsFilterModalOpen(false);
                }}>
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

                  {/* Debit and Credit Filters */}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label fw-bold small text-muted">DEBIT</label>
                        <Select
                          options={debitSelectOptions}
                          value={selectedDebit}
                          onChange={setSelectedDebit}
                          isClearable
                          placeholder="Select Debit"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label fw-bold small text-muted">CREDIT</label>
                        <Select
                          options={creditSelectOptions}
                          value={selectedCredit}
                          onChange={setSelectedCredit}
                          isClearable
                          placeholder="Select Credit"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer bg-light">
                    <div className="d-flex justify-content-between w-100">
                      <button
                        type="button"
                        className="btn btn-link text-danger"
                        onClick={handleClear}
                      >
                        Clear All
                      </button>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setIsFilterModalOpen(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary"
                        >
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Table Section */}
      <div className="card shadow border-0 rounded mb-4" style={{ height: "calc(100vh - 230px)", display: "flex", flexDirection: "column" }}>
        {/* Scrollable Table */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <DataTable
            columns={columns}
            data={filteredData}
            progressPending={isLoading}
            highlightOnHover
            striped
            pagination={false}
            customStyles={customStyles}
            onRowClicked={(row) => {
              setSelectedRow(row);
              setIsModalOpen(true);
            }}
            fixedHeader
            fixedHeaderScrollHeight="100%"
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
            rowCount={filteredData.length}
            currentPage={currentPage}
            onChangePage={(page) => setCurrentPage(page)}
            onChangeRowsPerPage={(count) => {
              setRowsPerPage(count);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Row Details Modal */}
      {isModalOpen && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.5)", overflow: "auto" }}>
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content shadow-lg rounded">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">Journal Details</h5>
                <button type="button" className="close btn btn-danger rounded-circle p-2" onClick={() => setIsModalOpen(false)}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body p-4">
                {selectedRow && (
                  <div className="container-fluid">
                    <div className="row g-3 d-flex flex-wrap">
                      <div className="col-md-6">
                        <div className="card shadow-sm p-3 h-100 d-flex flex-column">
                          <h5 className="fw-bold">Transaction Details</h5>
                          <ul className="list-unstyled flex-grow-1">
                            <li><strong>Date:</strong> {selectedRow.ADate ? new Date(selectedRow.ADate).toLocaleDateString() : "N/A"}</li>
                            <li><strong>Amount:</strong> {formatAmount(selectedRow.Amt || 0)}</li>
                          </ul>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="card shadow-sm p-3 h-100 d-flex flex-column">
                          <h5 className="fw-bold">Account Details</h5>
                          <ul className="list-unstyled flex-grow-1">
                            <li><strong>Debit:</strong> {Array.isArray(selectedRow.HName) && selectedRow.HName.length > 0 ? selectedRow.HName[0] : selectedRow.HName || "N/A"}</li>
                            <li><strong>Credit:</strong> {Array.isArray(selectedRow.HName) && selectedRow.HName.length > 1 ? selectedRow.HName[1] : "N/A"}</li>
                          </ul>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="card shadow-sm p-3">
                          <h5 className="fw-bold">Narration</h5>
                          <p>{selectedRow.OtherNarration || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
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

export default JournalReport;