import React, { useState, useEffect, useMemo } from "react";
import api from '../../apiService';
import DataTable from "react-data-table-component";
import { FaSearch, FaFileExcel, FaFilePdf, FaFilter, FaEye, FaSearchPlus, FaSearchMinus, FaExpand } from "react-icons/fa";
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
  const [selectedRouteName, setSelectedRouteName] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(sessionStorage.getItem("selectedSupplier") || "");
  const [summary, setSummary] = useState({
    PaytoCount: 0,
    Amt: 0,
    totalOrders: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(500);
  const [distinctPayto, setDistinctPayto] = useState([]);
  const [distinctUserNames, setDistinctUserNames] = useState([]);
  const [distinctBranchNames, setDistinctBranchNames] = useState([]);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [selectedBranchName, setSelectedBranchName] = useState("");
  const [expandedRows, setExpandedRows] = useState({});

  // Function to convert buffer to image URL
  const bufferToImageUrl = (buffer) => {
    if (!buffer || !buffer.data) {
      console.error("Invalid buffer data");
      return null;
    }
    try {
      const blob = new Blob([new Uint8Array(buffer.data)], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      console.log("Generated image URL:", url);
      return url;
    } catch (error) {
      console.error("Error converting buffer to image:", error);
      return null;
    }
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      receipt.forEach(row => {
        if (row.imageUrl) {
          URL.revokeObjectURL(row.imageUrl);
        }
      });
    };
  }, [receipt]);

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

      // Process images and add imageUrl to each record with unique ID
      const processedData = data.map((item, index) => ({
        ...item,
        id: index,
        imageUrl: item.Image ? bufferToImageUrl(item.Image) : null
      }));

      setReceipt(processedData);

      // Distinct Payto values
      const uniquePayto = [...new Set(data.map((order) => order.CustomerName))];
      setDistinctPayto(uniquePayto);

      // Distinct UserNames
      const uniqueUserNames = [...new Set(data.map((item) => item.UserName).filter(Boolean))];
      setDistinctUserNames(uniqueUserNames);

      // Distinct BranchNames
      const uniqueBranchNames = [...new Set(data.map((item) => item.BranchName).filter(Boolean))];
      setDistinctBranchNames(uniqueBranchNames);

      // Initial filter if Payto selected
      let filteredResults = processedData;
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

  // useEffect(() => {
  //   fetchReceipt();
  // }, [fromDate, toDate, Payto]);

  const handleClear = () => {
    setFromDate(getCurrentDate());
    setToDate(getCurrentDate());
    setPayto("");
    setType("");
    setError("");
    setSearchQuery("");
    setSelectedSupplier("");
    setApprovalStatus("");
    setSelectedUserName("");
    setSelectedBranchName("");
    setExpandedRows({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchReceipt();
  };

  const filteredResults = useMemo(() => {
    let filteredData = result;

    if (selectedUserName) {
      filteredData = filteredData.filter(row => row.UserName === selectedUserName);
    }

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

    if (approvalStatus) {
  filteredData = filteredData.filter((row) =>
    approvalStatus === "Approved"
      ? row.ApprovalStatus === 1
      : row.ApprovalStatus === 0
  );

}
if (selectedRouteName) {
  filteredData = filteredData.filter(
    (row) => row.RootName === selectedRouteName
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
  }, [result, selectedSupplier, searchQuery, type, approvalStatus, selectedUserName, selectedBranchName]);

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

    const headers = [
      ["Sl No", "Date", "Customer Name", "Amount", "Type", "Cheque Status", "Cheque Available"]
    ];

    const dataForExcel = filteredResults.map((row, index) => {
      const typeValue = Array.isArray(row.Type) && row.Type.length > 0 ? row.Type[0] : "N/A";
      const hasCheque = typeValue === "Bank" && row.Image ? "Yes" : "No";

      return [
        (currentPage - 1) * rowsPerPage + index + 1,
        row.RDate ? new Date(row.RDate).toLocaleDateString() : "N/A",
        row.HName || "N/A",
        row.Amt ?? 0,
        typeValue,
        row.ApprovalStatus === 1 ? "Approved" : "Not Approved",
        hasCheque
      ];
    });

    const totalRow = ["", "", "Total", totalAmount, "", "", ""];

    const ws = XLSX.utils.aoa_to_sheet(filterData);
    XLSX.utils.sheet_add_aoa(ws, headers, { origin: filterData.length + 1 });
    XLSX.utils.sheet_add_aoa(ws, dataForExcel, { origin: filterData.length + 2 });
    XLSX.utils.sheet_add_aoa(ws, [totalRow], { origin: filterData.length + 2 + dataForExcel.length });

    const amountColumnIndex = 3;
    const dataStartRow = filterData.length + 2;
    for (let i = 0; i < dataForExcel.length + 1; i++) {
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

    const tableColumn = ["SL.No", "Date", "Name", "Amount", "Type", "Cheque Status", "Cheque"];
    const tableRows = filteredResults.map((row, index) => {
      let typeValue = Array.isArray(row.Type) ? row.Type.join(", ") : (row.Type || "N/A");
      typeValue = typeValue
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.toLowerCase() !== "p")
        .join(", ");

      const hasCheque = typeValue === "Bank" && row.Image ? "Yes" : "No";

      return [
        index + 1,
        row.RDate ? new Date(row.RDate).toLocaleDateString() : "N/A",
        row.HName || "N/A",
        formatAmount(row.Amt),
        typeValue || "N/A",
        row.ApprovalStatus === 1 ? "Approved" : "Not Approved",
        hasCheque
      ];
    });

    tableRows.push([
      { content: "TOTAL", colSpan: 3, styles: { fontStyle: "bold", halign: "center" } },
      { content: formatAmount(totalAmount), styles: { fontStyle: "bold" } },
      "", "", ""
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: y + 2,
      theme: "grid",
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 25 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25 },
        4: { cellWidth: 35 },
        5: { cellWidth: 25 },
        6: { cellWidth: 15 },
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

  const distinctRouteNames = [...new Set(receipt.map(r => r.RootName).filter(Boolean))];


  const ExpandedComponent = ({ data }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [scale, setScale] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const handleZoomIn = () => {
      setScale(prev => Math.min(prev + 0.1, 3)); // Limit zoom to 3x
    };

    const handleZoomOut = () => {
      setScale(prev => Math.max(prev - 0.1, 0.5)); // Limit zoom out to 0.5x
    };

    const toggleFullscreen = () => {
      setIsFullscreen(!isFullscreen);
    };

    return (
      <div style={{
        padding: "20px",
        textAlign: "center",
        position: "relative",
        backgroundColor: isFullscreen ? "rgba(0,0,0,0.9)" : "transparent",
        zIndex: isFullscreen ? 1000 : "auto",
        width: isFullscreen ? "100vw" : "auto",
        height: isFullscreen ? "100vh" : "auto",
        top: isFullscreen ? 0 : "auto",
        left: isFullscreen ? 0 : "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        {data.imageUrl ? (
          <>
            <div style={{
              position: "relative",
              display: "inline-block",
              margin: "0px 0"
            }}>
              <img
                src={data.imageUrl}
                alt={`Cheque - ${data.ChkNo || "N/A"}`}
                style={{
                  maxWidth: "100%",
                  maxHeight: isFullscreen ? "90vh" : "700px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  display: imageLoaded ? "block" : "none",
                  transform: `scale(${scale})`,
                  transformOrigin: "center center",
                  transition: "transform 0.25s ease",
                  cursor: isFullscreen ? "zoom-out" : "zoom-in"
                }}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(false)}
                onClick={toggleFullscreen}
              />
              {!imageLoaded && (
                <div className="text-muted">Loading cheque image...</div>
              )}
            </div>

            <div className="btn-group" style={{
              position: isFullscreen ? "fixed" : "relative",
              bottom: isFullscreen ? "20px" : "auto",
              zIndex: 1001,
              backgroundColor: isFullscreen ? "rgba(0,0,0,0.7)" : "transparent",
              padding: isFullscreen ? "10px" : "0",
              borderRadius: "5px"
            }}>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={handleZoomIn}
                title="Zoom In"
              >
                <FaSearchPlus />
              </button>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => setScale(1)}
                title="Reset Zoom"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={handleZoomOut}
                title="Zoom Out"
              >
                <FaSearchMinus />
              </button>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                <FaExpand />
              </button>
            </div>
          </>
        ) : (
          <p className="text-muted">No cheque image available</p>
        )}
      </div>
    );
  };

const columns = [
  {
    name: "Sl.No",
    selector: (_, index) => (currentPage - 1) * rowsPerPage + index + 1,
    sortable: false,
    width: "6%",
  },
  {
    name: <span title="Date">Date</span>,
    selector: (row) =>
      row.RDate ? new Date(row.RDate).toLocaleDateString() : "N/A",
    sortable: true,
    width: "10%",
  },
  {
    name: <span title="Name">Name</span>,
    selector: (row) => row.HName || "N/A",
    sortable: true,
    width: "20%",
  },
  {
    name: <span title="Amount">Amount</span>,
    selector: (row) => formatAmount(row.Amt),
    sortable: true,
    width: "10%",
  },
  {
    name: <span title="Type">Type</span>,
    selector: (row) =>
      Array.isArray(row.Type) && row.Type.length > 0 ? row.Type[0] : "N/A",
    sortable: true,
    width: "12%",
  },
  {
    name: <span title="Status">Status</span>,
    selector: (row) =>
      row.ApprovalStatus === 1 ? "Approved" : "Not Approved",
    sortable: true,
    width: "12%",
  },
  {
    name: <span title="Created By">Created By</span>,
    selector: (row) => row.UserName,
    sortable: true,
    width: "15%",
  },
  {
    name: "Cheque",
    cell: (row) => {
      const typeValue = Array.isArray(row.Type) ? row.Type[0] : row.Type;
      if (typeValue === "Bank" && row.imageUrl) {
        return (
          <div className="d-flex justify-content-center">
            <img
              src={row.imageUrl}
              alt="Cheque"
              style={{
                width: "80px",
                height: "50px",
                objectFit: "cover",
                borderRadius: "4px",
                border: "1px solid #ddd",
                cursor: "pointer",
              }}
              title="Click to view cheque"
              onClick={() => window.open(row.imageUrl, "_blank")}
            />
          </div>
        );
      }
      return <span className="text-muted">N/A</span>;
    },
    width: "15%",
    ignoreRowClick: true,
    allowOverflow: true,
  },
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

  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredResults.slice(start, start + rowsPerPage);
  }, [filteredResults, currentPage, rowsPerPage]);

  return (
    <div className="container-fluid">
      <div className="card shadow-sm mb-3 p-3">
        <h4>Receipt Report</h4>
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
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
                <FaFilePdf className="me-1" /> PDF
              </button>
            </div>
          </div>
        </div>
      </div>

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

      <div className="card shadow border-0 rounded mb-4" style={{ height: "calc(100vh - 230px)", display: "flex", flexDirection: "column" }}>
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
              <div
                className="d-flex flex-column align-items-center justify-content-center w-100"
                style={{ height: "300px" }}
              >
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