import React, { useState, useEffect, useMemo } from "react";
import api from '../../apiService';
import DataTable from "react-data-table-component";
import { FaSearch, FaFileExcel, FaFilePdf, FaFilter } from "react-icons/fa";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import "jspdf-autotable";

const ItemPurchaseReturnReport = () => {
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
    totalQuantity: 0,
    totalAmtExcluOfTax: 0,
    totalTaxAmount: 0,
    totalTotalAmt: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(500);
  const [selectedItemName, setSelectedItemName] = useState("");
  const [selectedMode, setSelectedMode] = useState("");
  const [selectedSalesman, setSelectedSalesman] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [distinctItemNames, setDistinctItemNames] = useState([]);
  const [distinctModes, setDistinctModes] = useState([]);
  const [distinctSalesmen, setDistinctSalesmen] = useState([]);
  const [distinctSuppliers, setDistinctSuppliers] = useState([]);
  const [companyData, setCompanyData] = useState(null);

  // Fetch Item Purchase Return report data
  const fetchItemPurchaseReturnReport = async () => {
    setIsLoading(true);
    setError("");

    try {
      const CompanyID = sessionStorage.getItem("CompanyID");

      const response = await api.get("/api/GetItemPurchaseReturn", {
        params: { CompanyID, FromDate: fromDate, ToDate: toDate },
      });

      const data = response.data || [];
      setReportData(data);

      // Get distinct item names for filter dropdown
      const uniqueItemNames = [...new Set(data.map(item => item.ItemName))];
      setDistinctItemNames(uniqueItemNames);

      // Get distinct modes for filter dropdown
      const uniqueModes = [...new Set(data.map(item => item.Mode))];
      setDistinctModes(uniqueModes);

      // Get distinct salesmen for filter dropdown
      const uniqueSalesmen = [...new Set(data.map(item => item.Salesman))];
      setDistinctSalesmen(uniqueSalesmen);

      // Get distinct suppliers for filter dropdown
      const uniqueSuppliers = [...new Set(data.map(item => item.Supplier))];
      setDistinctSuppliers(uniqueSuppliers);

      // Calculate summary
      const totalQuantity = data.reduce((sum, item) => sum + (item.Quantity || 0), 0);
      const totalAmtExcluOfTax = data.reduce((sum, item) => sum + (item.AmtExcluOfTax || 0), 0);
      const totalTaxAmount = data.reduce((sum, item) => sum + (item.TaxAmount || 0), 0);
      const totalTotalAmt = data.reduce((sum, item) => sum + (item.TotalAmt || 0), 0);

      setSummary({ totalQuantity, totalAmtExcluOfTax, totalTaxAmount, totalTotalAmt });
    } catch (err) {
      setError("Failed to fetch Item Purchase Return report. Please try again.");
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter results based on search query and filters
  const filteredResults = useMemo(() => {
    let filteredData = reportData;

    if (selectedItemName) {
      filteredData = filteredData.filter(row => row.ItemName === selectedItemName);
    }

    if (selectedMode) {
      filteredData = filteredData.filter(row => row.Mode === selectedMode);
    }

    if (selectedSalesman) {
      filteredData = filteredData.filter(row => row.Salesman === selectedSalesman);
    }

    if (selectedSupplier) {
      filteredData = filteredData.filter(row => row.Supplier === selectedSupplier);
    }

    if (searchQuery) {
      filteredData = filteredData.filter((row) =>
        row.PurchaseReturnNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.PurReturnDate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.ItemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.Quantity?.toString().includes(searchQuery) ||
        row.NetRate?.toString().includes(searchQuery) ||
        row.AmtExcluOfTax?.toString().includes(searchQuery) ||
        row.TaxAmount?.toString().includes(searchQuery) ||
        row.TotalAmt?.toString().includes(searchQuery) ||
        row.Supplier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.Mode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.Salesman?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Update summary with filtered data
    const filteredTotalQuantity = filteredData.reduce((sum, row) => sum + (row.Quantity || 0), 0);
    const filteredTotalAmtExcluOfTax = filteredData.reduce((sum, row) => sum + (row.AmtExcluOfTax || 0), 0);
    const filteredTotalTaxAmount = filteredData.reduce((sum, row) => sum + (row.TaxAmount || 0), 0);
    const filteredTotalTotalAmt = filteredData.reduce((sum, row) => sum + (row.TotalAmt || 0), 0);

    setSummary({
      totalQuantity: filteredTotalQuantity,
      totalAmtExcluOfTax: filteredTotalAmtExcluOfTax,
      totalTaxAmount: filteredTotalTaxAmount,
      totalTotalAmt: filteredTotalTotalAmt,
    });

    return filteredData;
  }, [reportData, selectedItemName, selectedMode, selectedSalesman, selectedSupplier, searchQuery]);

  const handleClear = () => {
    setFromDate(getPreviousDate(7));
    setToDate(getCurrentDate());
    setSelectedItemName("");
    setSelectedMode("");
    setSelectedSalesman("");
    setSelectedSupplier("");
    setError("");
    setSearchQuery("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchItemPurchaseReturnReport();
  };

  // Export functions
  const exportToExcel = () => {
    if (!filteredResults.length) {
      alert("No data to export.");
      return;
    }

    const formattedFromDate = fromDate ? new Date(fromDate).toLocaleDateString() : "N/A";
    const formattedToDate = toDate ? new Date(toDate).toLocaleDateString() : "N/A";
    const formattedItemName = selectedItemName || "All";
    const formattedMode = selectedMode || "All";
    const formattedSalesman = selectedSalesman || "All";
    const formattedSupplier = selectedSupplier || "All";

    const totalQuantity = filteredResults.reduce((sum, row) => sum + (row.Quantity || 0), 0);
    const totalAmtExcluOfTax = filteredResults.reduce((sum, row) => sum + (row.AmtExcluOfTax || 0), 0);
    const totalTaxAmount = filteredResults.reduce((sum, row) => sum + (row.TaxAmount || 0), 0);
    const totalTotalAmt = filteredResults.reduce((sum, row) => sum + (row.TotalAmt || 0), 0);

    const filterData = [
      ["From Date", formattedFromDate],
      ["To Date", formattedToDate],
      ["Item Name", formattedItemName],
      ["Mode", formattedMode],
      ["Salesman", formattedSalesman],
      ["Supplier", formattedSupplier],
      ["Total Quantity", totalQuantity],
      ["Total Amt Exclu Of Tax", totalAmtExcluOfTax],
      ["Total Tax Amount", totalTaxAmount],
      ["Total Amount", totalTotalAmt],
      [],
    ];

    const headers = [
      ["Sl No", "Purchase Return No", "Return Date", "Item Name", "Quantity", "Net Rate", "Amt Exclu Of Tax", "Tax Amount", "Total Amt", "Supplier", "Mode", "Salesman"]
    ];

    const dataForExcel = filteredResults.map((row, index) => [
      index + 1,
      row.PurchaseReturnNo || "N/A",
      row.PurReturnDate ? new Date(row.PurReturnDate).toLocaleDateString() : "N/A",
      row.ItemName || "N/A",
      row.Quantity ?? 0,
      row.NetRate ?? 0,
      row.AmtExcluOfTax ?? 0,
      row.TaxAmount ?? 0,
      row.TotalAmt ?? 0,
      row.Supplier || "N/A",
      row.Mode || "N/A",
      row.Salesman || "N/A",
    ]);

    // Add total row
    dataForExcel.push([
      "TOTAL", "", "", "", totalQuantity, "", totalAmtExcluOfTax, totalTaxAmount, totalTotalAmt, "", "", ""
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...filterData, ...headers, ...dataForExcel]);

    // Apply number format to numeric columns
    const startRow = filterData.length + headers.length;
    const numericCols = [4, 5, 6, 7, 8]; // Quantity, Net Rate, Amt Exclu Of Tax, Tax Amount, Total Amt (0-based indices)
    for (let i = 0; i < dataForExcel.length; i++) {
      const rowIndex = startRow + i;
      numericCols.forEach(col => {
        const cell = XLSX.utils.encode_cell({ r: rowIndex, c: col });
        if (ws[cell]) ws[cell].z = "0.00";
      });
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ItemPurchaseReturnReport");

    XLSX.writeFile(wb, `ItemPurchaseReturnReport_${fromDate}_to_${toDate}.xlsx`);
  };

  const exportToPDF = () => {
    if (!filteredResults.length) {
      alert("No data to export.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Item Purchase Return Report", 14, 10);

    const formattedFromDate = fromDate ? new Date(fromDate).toLocaleDateString() : "N/A";
    const formattedToDate = toDate ? new Date(toDate).toLocaleDateString() : "N/A";
    const formattedItemName = selectedItemName || "All";
    const formattedMode = selectedMode || "All";
    const formattedSalesman = selectedSalesman || "All";
    const formattedSupplier = selectedSupplier || "All";

    const totalQuantity = filteredResults.reduce((sum, row) => sum + (row.Quantity || 0), 0);
    const totalAmtExcluOfTax = filteredResults.reduce((sum, row) => sum + (row.AmtExcluOfTax || 0), 0);
    const totalTaxAmount = filteredResults.reduce((sum, row) => sum + (row.TaxAmount || 0), 0);
    const totalTotalAmt = filteredResults.reduce((sum, row) => sum + (row.TotalAmt || 0), 0);

    // Add filter info
    doc.setFontSize(10);
    let y = 18;
    const filterLines = [
      `From Date: ${formattedFromDate}      To Date: ${formattedToDate}`,
      `Item Name: ${formattedItemName}`,
      `Mode: ${formattedMode}`,
      `Salesman: ${formattedSalesman}`,
      `Supplier: ${formattedSupplier}`,
      `Total Quantity: ${totalQuantity}`,
      `Total Amt Exclu Of Tax: ${formatAmount(totalAmtExcluOfTax)}`,
      `Total Tax Amount: ${formatAmount(totalTaxAmount)}`,
      `Total Amount: ${formatAmount(totalTotalAmt)}`
    ];
    filterLines.forEach((line) => {
      doc.text(line, 14, y);
      y += 6;
    });

    // Table columns
    const tableColumn = ["Sl No", "Purchase Return No", "Return Date", "Item Name", "Quantity", "Net Rate", "Amt Exclu Of Tax", "Tax Amount", "Total Amt", "Supplier", "Mode", "Salesman"];

    // Data rows
    const tableRows = filteredResults.map((row, index) => [
      index + 1,
      row.PurchaseReturnNo || "N/A",
      row.PurReturnDate ? new Date(row.PurReturnDate).toLocaleDateString() : "N/A",
      row.ItemName || "N/A",
      row.Quantity ? row.Quantity.toFixed(2) : "0.00",
      row.NetRate ? row.NetRate.toFixed(2) : "0.00",
      row.AmtExcluOfTax ? row.AmtExcluOfTax.toFixed(2) : "0.00",
      row.TaxAmount ? row.TaxAmount.toFixed(2) : "0.00",
      row.TotalAmt ? row.TotalAmt.toFixed(2) : "0.00",
      row.Supplier || "N/A",
      row.Mode || "N/A",
      row.Salesman || "N/A",
    ]);

    // Add total row
    tableRows.push([
      { content: "TOTAL", colSpan: 4, styles: { fontStyle: "bold" } },
      totalQuantity.toFixed(2),
      "",
      totalAmtExcluOfTax.toFixed(2),
      totalTaxAmount.toFixed(2),
      totalTotalAmt.toFixed(2),
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
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 8 },   // Sl No
        1: { cellWidth: 20 },  // Purchase Return No
        2: { cellWidth: 18 },  // Return Date
        3: { cellWidth: 25 },  // Item Name
        4: { cellWidth: 12 },  // Quantity
        5: { cellWidth: 12 },  // Net Rate
        6: { cellWidth: 20 },  // Amt Exclu Of Tax
        7: { cellWidth: 15 },  // Tax Amount
        8: { cellWidth: 15 },  // Total Amt
        9: { cellWidth: 20 },  // Supplier
        10: { cellWidth: 15 }, // Mode
        11: { cellWidth: 18 }, // Salesman
      },
      margin: { top: 20 },
    });

    doc.save(`ItemPurchaseReturnReport_${fromDate}_to_${toDate}.pdf`);
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
      name: <span title="Return Date">Return Date</span>,
      selector: (row) => (row.PurReturnDate ? new Date(row.PurReturnDate).toLocaleDateString() : "N/A"),
      sortable: true,
      width: "8%"
    },
    {
      name: <span title="Item Name">Item Name</span>,
      selector: (row) => row.ItemName || "N/A",
      sortable: true,
      width: "15%"
    },
    {
      name: <span title="Quantity">Quantity</span>,
      selector: (row) => formatAmount(row.Quantity),
      sortable: true,
      width: "8%"
    },
    {
      name: <span title="Net Rate">Net Rate</span>,
      selector: (row) => formatAmount(row.NetRate),
      sortable: true,
      width: "8%"
    },
    {
      name: <span title="Amt Exclu Of Tax">Total Net Rate</span>,
      selector: (row) => formatAmount(row.AmtExcluOfTax),
      sortable: true,
      width: "10%"
    },
    {
      name: <span title="Tax Amount">Tax Amount</span>,
      selector: (row) => formatAmount(row.TaxAmount),
      sortable: true,
      width: "9%"
    },
    {
      name: <span title="Total Amt">Total Amt</span>,
      selector: (row) => formatAmount(row.TotalAmt),
      sortable: true,
      width: "9%"
    },
    {
      name: <span title="Supplier">Supplier</span>,
      selector: (row) => row.Supplier || "N/A",
      sortable: true,
      width: "12%"
    },
    {
      name: <span title="Mode">Mode</span>,
      selector: (row) => row.Mode || "N/A",
      sortable: true,
      width: "8%"
    },
    {
      name: <span title="Salesman">Salesman</span>,
      selector: (row) => row.Salesman || "N/A",
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
  <div className="d-md-none mb-2"></div>
  <div className="fw-semibold text-dark mb-2 mb-md-0 text-center flex-grow-1">
    <span className="me-5 d-inline-block">Total Quantity: {summary.totalQuantity ? formatAmount(summary.totalQuantity) : "N/A"}</span>
    <span className="me-5 d-inline-block">Total Net Rate: {summary.totalAmtExcluOfTax ? formatAmount(summary.totalAmtExcluOfTax) : "N/A"}</span>
    <span className="me-5 d-inline-block">Total Tax Amount: {summary.totalTaxAmount ? formatAmount(summary.totalTaxAmount) : "N/A"}</span>
    <span className="d-inline-block">Total Amount: {summary.totalTotalAmt ? formatAmount(summary.totalTotalAmt) : "N/A"}</span>
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
    fetchItemPurchaseReturnReport();
  }, [fromDate, toDate]);

  return (
    <div className="container-fluid">
      {/* Header with Search and Export Buttons */}
      <div className="card shadow-sm mb-3 p-3">
        <h4>Item Purchase Return Report</h4>
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
                placeholder="Search by purchase return no, item name, supplier, mode, salesman..."
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

     <div className="modal fade" id="filterModal" tabIndex="-1" aria-labelledby="filterModalLabel" aria-hidden="true">
  <div className="modal-dialog modal-lg modal-dialog-scrollable">
    <div className="modal-content">
      <div className="modal-header bg-light">
        <h5 className="modal-title text-primary" id="filterModalLabel">
          <FaFilter className="me-2" />
          Item Purchase Return Report Filters
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
          {/* Item Name and Mode Filter Row */}
          <div className="row g-3">
            <div className="col-md-6">
              <div className="mb-3">
                <label htmlFor="ItemName" className="form-label fw-bold small text-muted">ITEM NAME</label>
                <select
                  id="ItemName"
                  className="form-select"
                  value={selectedItemName}
                  onChange={(e) => setSelectedItemName(e.target.value)}
                >
                  <option value="">All Items</option>
                  {distinctItemNames.map((itemName, index) => (
                    <option key={index} value={itemName}>
                      {itemName || "Unknown Item"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label htmlFor="Mode" className="form-label fw-bold small text-muted">MODE</label>
                <select
                  id="Mode"
                  className="form-select"
                  value={selectedMode}
                  onChange={(e) => setSelectedMode(e.target.value)}
                >
                  <option value="">All Modes</option>
                  {distinctModes.map((mode, index) => (
                    <option key={index} value={mode}>
                      {mode || "Unknown Mode"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {/* Salesman and Supplier Filter Row */}
          <div className="row g-3">
            <div className="col-md-6">
              <div className="mb-3">
                <label htmlFor="Salesman" className="form-label fw-bold small text-muted">SALESMAN</label>
                <select
                  id="Salesman"
                  className="form-select"
                  value={selectedSalesman}
                  onChange={(e) => setSelectedSalesman(e.target.value)}
                >
                  <option value="">All Salesmen</option>
                  {distinctSalesmen.map((salesman, index) => (
                    <option key={index} value={salesman}>
                      {salesman || "Unknown Salesman"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-md-6">
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

export default ItemPurchaseReturnReport;