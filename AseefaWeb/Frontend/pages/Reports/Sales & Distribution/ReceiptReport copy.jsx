import React, { useState, useEffect, useMemo } from "react";
import api from '../../apiService';
import DataTable from "react-data-table-component";
import { FaSearch, FaFileExcel, FaFilePdf, FaFilter } from "react-icons/fa";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

const Receipt = () => {
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

  const [fromDate, setFromDate] = useState(getPreviousDate(7));
  const [toDate, setToDate] = useState(getCurrentDate());
  const [result, setResult] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [receipt, setReceipt] = useState([]);
  const [Payto, setPayto] = useState("");
  const [type, setType] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [approvalStatus, setApprovalStatus] = useState("");

  const [selectedSupplier, setSelectedSupplier] = useState(sessionStorage.getItem("selectedSupplier") || "");
  const [summary, setSummary] = useState({
    PaytoCount: 0,
    Amt: 0,
    totalOrders: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [distinctPayto, setDistinctPayto] = useState([]);
  const [selectedRouteName, setSelectedRouteName] = useState("");
  const [distinctUserNames, setDistinctUserNames] = useState([]);
  const [distinctBranchNames, setDistinctBranchNames] = useState([]);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [selectedBranchName, setSelectedBranchName] = useState("");


  const fetchReceipt = async () => {
    setIsLoading(true);
    setError("");
    try {
      const companyID = sessionStorage.getItem("CompanyID");
      const activeUserId = sessionStorage.getItem("activeUserId");
      const response = await api.get("/api/GetReceiptDetailes", {
        params: {
          FromDate: fromDate,
          ToDate: toDate,
          CompanyID: companyID,
             activeUserId: activeUserId,
        },
      });

      const data = response?.data || [];
      setReceipt(data);

      // Distinct Payto values
      const uniquePayto = [...new Set(data.map((order) => order.CustomerName))];
      setDistinctPayto(uniquePayto);

      // 🔥 Distinct UserNames
      const uniqueUserNames = [...new Set(data.map((item) => item.UserName).filter(Boolean))];
      setDistinctUserNames(uniqueUserNames);

      // 🔥 Distinct BranchNames
      const uniqueBranchNames = [...new Set(data.map((item) => item.BranchName).filter(Boolean))];
      setDistinctBranchNames(uniqueBranchNames);

      // Initial filter if Payto selected
      let filteredResults = data;
      if (Payto) {
        filteredResults = filteredResults.filter((order) => order.CustomerName === Payto);
      }

      const customerCount = new Set(filteredResults.map((order) => order.UserId)).size;
      const totalAmount = filteredResults.reduce((sum, row) => sum + (row.Amt || 0), 0);
      const totalOrders = filteredResults.length;

      setSummary({ PaytoCount: customerCount, Amt: totalAmount, totalOrders });
      setResult(filteredResults);
    } catch (err) {
      console.error("Error fetching receipt details:", err);
      setError("Failed to fetch receipt details. Please try again.");
      setResult([]);
    } finally {
      setIsLoading(false);
    }
  };

  const distinctRouteNames = [...new Set(receipt.map(r => r.RootName).filter(Boolean))];

  useEffect(() => {
    fetchReceipt();
  }, [fromDate, toDate, Payto]);

  const handleClear = () => {
    setFromDate(getCurrentDate());
    setToDate(getCurrentDate());
    setPayto("");
    setType("");
    setError("");
    setSearchQuery("");
    setSelectedSupplier("");
    setApprovalStatus("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchReceipt();
  };

  const filteredResults = useMemo(() => {
    let filteredData = result;

    // 🔥 Filter by selected UserName
    if (selectedUserName) {
      filteredData = filteredData.filter(row => row.UserName === selectedUserName);
    }

    // 🔥 Filter by selected BranchName
    if (selectedBranchName) {
      filteredData = filteredData.filter(row => row.BranchName === selectedBranchName);
    }


    if (selectedSupplier) {
      filteredData = filteredData.filter((row) => row.HSlNo === parseInt(selectedSupplier));
    }

    if (searchQuery) {
      filteredData = filteredData.filter((row) =>
        row.Payto?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.HName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (type && type !== "All") {
      filteredData = filteredData.filter((row) =>
        Array.isArray(row.Type) ? row.Type.includes(type) : row.Type === type
      );
    }

if (selectedRouteName) {
    filteredData = filteredData.filter(row => row.RootName === selectedRouteName);
  }

    if (approvalStatus) {
      filteredData = filteredData.filter((row) =>
        approvalStatus === "Approved" ? row.ApprovalStatus === 0 : row.ApprovalStatus === 1
      );
    }

    const filteredTotalAmount = filteredData.reduce((sum, row) => sum + (row.Amt || 0), 0);
    const filteredTotalOrders = filteredData.length;

    setSummary((prevSummary) => ({
      ...prevSummary,
      Amt: filteredTotalAmount,
      totalOrders: filteredTotalOrders,
    }));

    return filteredData;
  }, [result, selectedSupplier, searchQuery, type, approvalStatus]);

  const exportToExcel = () => {
    if (!filteredResults.length) {
      alert("No data to export.");
      return;
    }

    const formattedFromDate = fromDate ? new Date(fromDate).toLocaleDateString() : "N/A";
    const formattedToDate = toDate ? new Date(toDate).toLocaleDateString() : "N/A";
    const formattedType = type || "All";

    const formattedChequeStatus =
      approvalStatus === "Approved"
        ? "Approved"
        : approvalStatus === "NotApproved"
          ? "Not Approved"
          : "All";

    const formattedCustomerName = selectedSupplier
      ? receipt.find((r) => r.HSlNo === parseInt(selectedSupplier))?.HName || "All"
      : "All";

    const totalAmount = filteredResults.reduce((sum, row) => sum + (row.Amt || 0), 0);

    const filterData = [
      ["From Date", formattedFromDate],
      ["To Date", formattedToDate],
      ["Type", formattedType],
      ["Cheque Status", formattedChequeStatus],
      ["Customer Name", formattedCustomerName],
      ["Total Amount", totalAmount],
      [],
    ];

    // Table headers
    const headers = [
      ["Sl No", "Date", "Customer Name", "Amount", "Type", "Cheque Status"]
    ];

    // Table data with raw numeric value for Amount
    const dataForExcel = filteredResults.map((row, index) => {
      const typeValue = Array.isArray(row.Type) && row.Type.length > 0 ? row.Type[0] : "N/A";

      return [
        (currentPage - 1) * rowsPerPage + index + 1,
        row.RDate ? new Date(row.RDate).toLocaleDateString() : "N/A",
        row.HName || "N/A",
        row.Amt ?? 0, // keep numeric
        typeValue,
        row.ApprovalStatus === 0 ? "Approved" : "Not Approved",
      ];
    });

    // Add total row
    const totalRow = ["", "", "Total", totalAmount, "", ""];

    // Create worksheet and add all content
    const ws = XLSX.utils.aoa_to_sheet(filterData);
    XLSX.utils.sheet_add_aoa(ws, headers, { origin: filterData.length + 1 });
    XLSX.utils.sheet_add_aoa(ws, dataForExcel, { origin: filterData.length + 2 });
    XLSX.utils.sheet_add_aoa(ws, [totalRow], { origin: filterData.length + 2 + dataForExcel.length });

    // Format "Amount" column (index 3) to 2 decimal places
    const amountColumnIndex = 3;
    const dataStartRow = filterData.length + 2;
    for (let i = 0; i < dataForExcel.length + 1; i++) { // +1 to include total row
      const cellRef = XLSX.utils.encode_cell({ r: dataStartRow + i, c: amountColumnIndex });
      if (ws[cellRef] && typeof ws[cellRef].v === "number") {
        ws[cellRef].z = "0.00";
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ReceiptReport");
    XLSX.writeFile(wb, `Receipt_Report_${fromDate}_to_${toDate}.xlsx`);
  };


  const exportToPDF = () => {
    if (!filteredResults.length) {
      alert("No data to export.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Receipt Report", 14, 10);

    const formattedFromDate = fromDate ? new Date(fromDate).toLocaleDateString() : "N/A";
    const formattedToDate = toDate ? new Date(toDate).toLocaleDateString() : "N/A";
    const formattedType = type || "All";
    const formattedChequeStatus = approvalStatus === "Approved" ? "Approved" : approvalStatus === "NotApproved" ? "Not Approved" : "All";
    const formattedCustomerName = selectedSupplier
      ? receipt.find((r) => r.HSlNo === parseInt(selectedSupplier))?.HName || "All"
      : "All";

    const totalAmount = filteredResults.reduce((sum, row) => sum + (row.Amt || 0), 0);

    // 🔹 Add filter info
    doc.setFontSize(10);
    let y = 18;
    const filterLines = [
      `From Date: ${formattedFromDate}      To Date: ${formattedToDate}`,
      `Type: ${formattedType}      Cheque Status: ${formattedChequeStatus}`,
      `Customer Name: ${formattedCustomerName}      Total Amount: ${formatAmount(totalAmount)}`
    ];
    filterLines.forEach((line) => {
      doc.text(line, 14, y);
      y += 6;
    });

    // 🔹 Table columns (matches UI order)
    const tableColumn = ["SL.No", "Date", "Name", "Amount", "Type", "Cheque Status"];

    // 🔹 Corrected data rows to match column order
    const tableRows = filteredResults.map((row, index) => {
      let typeValue = Array.isArray(row.Type) ? row.Type.join(", ") : (row.Type || "N/A");
      typeValue = typeValue
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.toLowerCase() !== "p")
        .join(", ");

      return [
        index + 1,
        row.RDate ? new Date(row.RDate).toLocaleDateString() : "N/A",
        row.HName || "N/A",                 // ✅ Name
        formatAmount(row.Amt),              // ✅ Amount
        typeValue || "N/A",
        row.ApprovalStatus === 0 ? "Approved" : "Not Approved",
      ];
    });

    // 🔹 Add total row
    tableRows.push([
      { content: "TOTAL", colSpan: 3, styles: { fontStyle: "bold", halign: "center" } },
      { content: formatAmount(totalAmount), styles: { fontStyle: "bold" } },
      "", ""
    ]);

    // 🔹 Render table
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: y + 2,
      theme: "grid",
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 10 },  // SL.No
        1: { cellWidth: 25 },  // Date
        2: { cellWidth: 35 },  // Name
        3: { cellWidth: 25 },  // Amount
        4: { cellWidth: 35 },  // Type
        5: { cellWidth: 30 },  // Cheque Status
      },
      margin: { top: 20 },
    });

    doc.save(`Receipt_Report_${fromDate}_to_${toDate}.pdf`);
  };



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

  const columns = [
    { name: "Sl.No", selector: (_, index) => (currentPage - 1) * rowsPerPage + index + 1, sortable: false, width: "8%" },
    { name: <span title="Date">Date</span>, selector: (row) => (row.RDate ? new Date(row.RDate).toLocaleDateString() : "N/A"), sortable: true, width: "12%" },
    { name: <span title="Name">Name</span>, selector: (row) => row.HName || "N/A", sortable: true, width: "28%" },
    { name: <span title="Amount">Amount</span>, selector: (row) => formatAmount(row.Amt), sortable: true, width: "12%" },
    { name: <span title="Type">Type</span>, selector: (row) => Array.isArray(row.Type) && row.Type.length > 0 ? row.Type[0] : "N/A", sortable: true, width: "16%" },
    { name: <span title="Cheque Status">Status</span>, selector: (row) => row.ApprovalStatus === 0 ? "Approved" : "Not Approved", sortable: true, width: "24%" },
  ];


  const CustomFooter = ({ rowsPerPage, rowCount, currentPage, onChangePage, onChangeRowsPerPage }) => {
    const totalPages = Math.ceil(rowCount / rowsPerPage);

    return (
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-3 bg-light">
        <div className="fw-semibold text-dark mb-2 mb-md-0">
          Total Amount: {summary.Amt ? formatAmount(summary.Amt) : "N/A"}
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          <label className="me-2">Rows per page:</label>
          <select
            value={rowsPerPage}
            onChange={(e) => onChangeRowsPerPage(Number(e.target.value))}
            className="form-select form-select-sm w-auto"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
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

  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredResults.slice(start, start + rowsPerPage);
  }, [filteredResults, currentPage, rowsPerPage]);

  return (
    <div className="container-fluid">
      {/* Header with Search and Export Buttons */}
      <div className="card shadow-sm mb-3 p-3">
        <h4>Receipt Report</h4>
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
                placeholder="Search receipts by name,amount...."
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
                Receipt Report Filters
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

                       <div className="modal-body">
  <form onSubmit={handleSubmit}>
    {/* Date Filters */}
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

    {/* Other Filters */}
    <div className="row g-3">
      <div className="col-md-6">
        <label htmlFor="Customer" className="form-label fw-bold small text-muted">CUSTOMER</label>
        <select
          id="Customer"
          className="form-select"
          value={selectedSupplier}
          onChange={(e) => {
            setSelectedSupplier(e.target.value);
            sessionStorage.setItem("selectedSupplier", e.target.value);
          }}
        >
          <option value="">All Customers</option>
          {Array.from(
            new Map(receipt.map((supplier) => [supplier.HName, supplier])).values()
          ).map((supplier) => (
            <option key={supplier.HSlNo} value={supplier.HSlNo}>
              {supplier.HName || "Unknown Supplier"}
            </option>
          ))}
        </select>
      </div>

      <div className="col-md-6">
        <label htmlFor="Type" className="form-label fw-bold small text-muted">TYPE</label>
        <select
          id="Type"
          className="form-select"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="Cash">Cash</option>
          <option value="Bank">Cheque</option>
          <option value="NEFT">NEFT</option>
          <option value="Online Payment">Online Payment</option>
        </select>
      </div>

      <div className="col-md-6">
        <label htmlFor="RouteName" className="form-label fw-bold small text-muted">ROUTE</label>
        <select
          id="RouteName"
          className="form-select"
          value={selectedRouteName}
          onChange={(e) => setSelectedRouteName(e.target.value)}
        >
          <option value="">All Routes</option>
          {distinctRouteNames.map((route, idx) => (
            <option key={idx} value={route}>{route}</option>
          ))}
        </select>
      </div>

      <div className="col-md-6">
        <label htmlFor="Status" className="form-label fw-bold small text-muted">STATUS</label>
        <select
          id="Status"
          className="form-select"
          value={approvalStatus}
          onChange={(e) => setApprovalStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Approved">Approved</option>
          <option value="NotApproved">Not Approved</option>
        </select>
      </div>

      <div className="col-md-6">
        <label htmlFor="UserName" className="form-label fw-bold small text-muted">USER</label>
        <select
          id="UserName"
          className="form-select"
          value={selectedUserName}
          onChange={(e) => setSelectedUserName(e.target.value)}
        >
          <option value="">All Users</option>
          {distinctUserNames.map((name, idx) => (
            <option key={idx} value={name}>{name}</option>
          ))}
        </select>
      </div>

      <div className="col-md-6">
        <label htmlFor="BranchName" className="form-label fw-bold small text-muted">BRANCH</label>
        <select
          id="BranchName"
          className="form-select"
          value={selectedBranchName}
          onChange={(e) => setSelectedBranchName(e.target.value)}
        >
          <option value="">All Branches</option>
          {distinctBranchNames.map((branch, idx) => (
            <option key={idx} value={branch}>{branch}</option>
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

export default Receipt;