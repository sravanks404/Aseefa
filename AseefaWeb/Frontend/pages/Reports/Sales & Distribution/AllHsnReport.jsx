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
  const [customerOptions, setCustomerOptions] = useState([]);
  const [itemOptions, setItemOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const [summary, setSummary] = useState({
    supplierCount: 0,
    totalAmount: 0,
    totalPurchases: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(500);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [distinctSuppliers, setDistinctSuppliers] = useState([]);

  // Fetch purchase report data
  const fetchPurchaseReport = async () => {
    setIsLoading(true);
    setError("");

    try {
      const CompanyID = sessionStorage.getItem("CompanyID");

      const response = await api.get("/api/taxamount", {
        params: {
          CompanyID,
          FromDate: fromDate,
          ToDate: toDate,
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
        row.CustomerName?.toLowerCase().includes(lower) ||
        row.ItemName?.toLowerCase().includes(lower) ||
        row.HSNCode?.toLowerCase().includes(lower)
      );
    }

    if (selectedCustomer) {
      filteredData = filteredData.filter(row => row.CustomerName === selectedCustomer);
    }

    if (selectedItem) {
      filteredData = filteredData.filter(row => row.ItemName === selectedItem);
    }

    if (selectedType) {
      filteredData = filteredData.filter(row => row.WholeSaleRetail === selectedType);
    }

    // Grouping: customer + bill key
    const billTotals = {};
    const seenKeys = new Set();

    filteredData.forEach(row => {
      const key = `${row.CustomerName}__${row.InvSeries || ""}${row.RetailBillNo || ""}`;
      if (!billTotals[key]) billTotals[key] = 0;
      billTotals[key] += row.ItemTotAmount || 0;
    });

    // Assign bill total to only first row of each group
    const updatedData = filteredData.map((row, index, arr) => {
      const key = `${row.CustomerName}__${row.InvSeries || ""}${row.RetailBillNo || ""}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        return { ...row, BillAmountCalc: billTotals[key] }; // show once
      } else {
        return { ...row, BillAmountCalc: "" }; // empty on duplicates
      }
    });

    // For footer summary
    const totalBillAmount = Object.values(billTotals).reduce((sum, amt) => sum + amt, 0);
    setSummary({
      totalAmount: totalBillAmount,
      supplierCount: 0,
      totalPurchases: updatedData.length,
    });

    return updatedData;
  }, [reportData, searchQuery, selectedCustomer, selectedItem, selectedType]);




  useEffect(() => {
    const customers = Array.from(new Set(reportData.map(row => row.CustomerName || "Unknown"))).sort();
    const items = Array.from(new Set(reportData.map(row => row.ItemName || "Unknown"))).sort();
    const types = Array.from(new Set(reportData.map(row => row.WholeSaleRetail || "Unknown"))).sort();

    setCustomerOptions(customers);
    setItemOptions(items);
    setTypeOptions(types);
  }, [reportData]);

  const handleClear = () => {
    setFromDate(getPreviousDate(7));
    setToDate(getCurrentDate());
    setSearchQuery("");
    setSelectedCustomer("");
    setSelectedItem("");
    setSelectedType("");
    setError("");
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

    const formattedFromDate = new Date(fromDate).toLocaleDateString();
    const formattedToDate = new Date(toDate).toLocaleDateString();

    const headerInfo = [
      ["Saletax Report"],
      [`From: ${formattedFromDate}   To: ${formattedToDate}`],
      [`Customer: ${selectedCustomer || "All"}`],
      [`Item Name: ${selectedItem || "All"}`],
      [`Type: ${selectedType || "All"}`],
      [], // Empty row for spacing
    ];

    const headers = [
      [
        "Sl.No", "Inv Date", "Inv No", "Customer", "GSTIN", "HSN Code", "Item",
        "Unit", "MRP", "Qty", "Free Qty", "CGST %", "CGST Amt", "SGST %", "SGST Amt",
        "Taxable Value", "Total Tax", "Item Total", "Discount (Rs)", "Round Off", "Bill Amount"
      ]
    ];

    const data = filteredResults.map((row, index) => {
      const retailBillNo = row.RetailBillNo && row.RetailBillNo !== 0 ? row.RetailBillNo : row.BillNo;
      const invoiceNo = `${row.InvSeries || ""} ${retailBillNo || "N/A"}`.trim();
      return [
        index + 1,
        row.BillDate ? new Date(row.BillDate).toLocaleDateString() : "N/A",
        invoiceNo,
        row.CustomerName || "N/A",
        row.GSTinNo || "N/A",
        row.HSNCode || "N/A",
        row.ItemName || "N/A",
        row.UnitName || "N/A",
        row.MRP ?? 0,
        row.Quantity ?? 0,
        row.FreeQty ?? 0,
        row.CGSTRate ?? 0,
        row.CGSTAmount ?? 0,
        row.SGSTRate ?? 0,
        row.SGSTAmount ?? 0,
        row.NetRate ?? 0,
        row.TotalTax ?? 0,
        row.ItemTotAmount ?? 0,
        row.DiscountRs ?? 0,
        row.RoundOff ?? 0,
        typeof row.BillAmountCalc === "number" ? Math.round(row.BillAmountCalc) : ""
      ];
    });

    // Calculate totals
    const totalRow = [
      "TOTAL", "", "", "", "", "", "", "", "",
      filteredResults.reduce((sum, row) => sum + (row.Quantity || 0), 0),
      filteredResults.reduce((sum, row) => sum + (row.FreeQty || 0), 0),
      "",
      filteredResults.reduce((sum, row) => sum + (row.CGSTAmount || 0), 0),
      "",
      filteredResults.reduce((sum, row) => sum + (row.SGSTAmount || 0), 0),
      filteredResults.reduce((sum, row) => sum + (row.NetRate || 0), 0),
      filteredResults.reduce((sum, row) => sum + (row.TotalTax || 0), 0),
      filteredResults.reduce((sum, row) => sum + (row.ItemTotAmount || 0), 0),
      filteredResults.reduce((sum, row) => sum + (row.DiscountRs || 0), 0),
      filteredResults.reduce((sum, row) => sum + (row.RoundOff || 0), 0),
      filteredResults.reduce(
        (sum, row) => typeof row.BillAmountCalc === "number" ? sum + Math.round(row.BillAmountCalc) : sum,
        0
      )
    ];

    const ws = XLSX.utils.aoa_to_sheet([...headerInfo, ...headers, ...data, totalRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Saletax Report");
    XLSX.writeFile(wb, `Saletax_${fromDate}_to_${toDate}.xlsx`);
  };

  const exportToPDF = () => {
    if (!filteredResults.length) {
      alert("No data to export.");
      return;
    }

    const doc = new jsPDF("landscape", "mm", "a3");
    const pageWidth = doc.internal.pageSize.getWidth();

    const formattedFromDate = new Date(fromDate).toLocaleDateString();
    const formattedToDate = new Date(toDate).toLocaleDateString();

    doc.setFontSize(16);
    doc.text("Saletax Report", 14, 14);

    doc.setFontSize(10);
    let y = 22;

    const filterLines = [
      `From: ${formattedFromDate}    To: ${formattedToDate}`,
      `Customer: ${selectedCustomer || "All"}`,
      `Item Name: ${selectedItem || "All"}`,
      `Type: ${selectedType || "All"}`
    ];
    filterLines.forEach((line) => {
      doc.text(line, 14, y);
      y += 6;
    });

    const tableColumn = [
      "Sl.No", "Inv Date", "Inv No", "Customer", "GSTIN", "HSN Code", "Item",
      "Unit", "MRP", "Qty", "Free Qty", "CGST %", "CGST Amt", "SGST %", "SGST Amt",
      "Taxable", "Tax", "Item Total", "Disc", "RoundOff", "Bill Amt"
    ];

    const tableRows = filteredResults.map((row, index) => {
      const retailBillNo = row.RetailBillNo && row.RetailBillNo !== 0 ? row.RetailBillNo : row.BillNo;
      const invoiceNo = `${row.InvSeries || ""} ${retailBillNo || "N/A"}`.trim();
      return [
        index + 1,
        row.BillDate ? new Date(row.BillDate).toLocaleDateString() : "N/A",
        invoiceNo,
        row.CustomerName || "N/A",
        row.GSTinNo || "N/A",
        row.HSNCode || "N/A",
        row.ItemName || "N/A",
        row.UnitName || "N/A",
        row.MRP ?? 0,
        row.Quantity ?? 0,
        row.FreeQty ?? 0,
        row.CGSTRate ?? 0,
        row.CGSTAmount ?? 0,
        row.SGSTRate ?? 0,
        row.SGSTAmount ?? 0,
        row.NetRate ?? 0,
        row.TotalTax ?? 0,
        row.ItemTotAmount ?? 0,
        row.DiscountRs ?? 0,
        row.RoundOff ?? 0,
        typeof row.BillAmountCalc === "number" ? Math.round(row.BillAmountCalc) : ""
      ];
    });

    const totalRow = [
      "TOTAL", "", "", "", "", "", "", "", "",
      tableRows.reduce((sum, r) => sum + r[9], 0).toFixed(2),
      tableRows.reduce((sum, r) => sum + r[10], 0).toFixed(2),
      "",
      tableRows.reduce((sum, r) => sum + r[12], 0).toFixed(2),
      "",
      tableRows.reduce((sum, r) => sum + r[14], 0).toFixed(2),
      tableRows.reduce((sum, r) => sum + r[15], 0).toFixed(2),
      tableRows.reduce((sum, r) => sum + r[16], 0).toFixed(2),
      tableRows.reduce((sum, r) => sum + r[17], 0).toFixed(2),
      tableRows.reduce((sum, r) => sum + r[18], 0).toFixed(2),
      tableRows.reduce((sum, r) => {
        const amt = r[20];
        return typeof amt === "number" ? sum + amt : sum;
      }, 0).toFixed(2),
    ];

    tableRows.push(totalRow);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: y + 2,
      styles: { fontSize: 8, cellPadding: 1 },
      theme: "grid",
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 18 },
        2: { cellWidth: 22 },
        3: { cellWidth: 45 },
        4: { cellWidth: 30 },
        5: { cellWidth: 20 },
        6: { cellWidth: 30 },
        7: { cellWidth: 16 },
        8: { cellWidth: 14 },
        9: { cellWidth: 14 },
        10: { cellWidth: 16 },
        11: { cellWidth: 14 },
        12: { cellWidth: 18 },
        13: { cellWidth: 14 },
        14: { cellWidth: 18 },
        15: { cellWidth: 20 },
        16: { cellWidth: 18 },
        17: { cellWidth: 24 },
        18: { cellWidth: 18 },
        19: { cellWidth: 18 },
        20: { cellWidth: 24 },
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`, pageWidth - 30, 10);
      },
    });

    doc.save(`Saletax_Report_${fromDate}_to_${toDate}.pdf`);
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
      width: "70px",
    },
    {
      name: "InvDate",
      selector: (row) => (row.BillDate ? new Date(row.BillDate).toLocaleDateString() : "N/A"),
      sortable: true,
      width: "100px",
    },
    {
      name: "InvNo",
      selector: (row) => {
        // Check if RetailBillNo is available and not 0, otherwise fallback to BillNo
        const retailBillNo = row.RetailBillNo && row.RetailBillNo !== 0 ? row.RetailBillNo : row.BillNo;
        return `${row.InvSeries || ""}${retailBillNo || "N/A"}`;
      },
      sortable: true,
      width: "200px",
    },

    {
      name: "Customer Name",
      selector: (row) => row.CustomerName || "N/A",
      sortable: true,
      width: "180px",
    },
    {
      name: "GSTIN No",
      selector: (row) => row.GSTinNo || "N/A",
      sortable: true,
      width: "150px",
    },
    {
      name: "HSN Code",
      selector: (row) => row.HSNCode || "N/A",
      sortable: true,
      width: "100px",
      right: true,
    },
    {
      name: "Item Name",
      selector: (row) => row.ItemName || "N/A",
      sortable: true,
      width: "250px",
      right: true,
    },
    {
      name: "Unit",
      selector: (row) => row.UnitName || "N/A",
      sortable: true,
      width: "90px",
      right: true,
    },
    {
      name: "Type",
      selector: (row) => row.WholeSaleRetail || "N/A",
      sortable: true,
      width: "90px",
      right: true,
    },
    {
      name: "MRP",
      selector: (row) => row.MRP ?? "N/A",
      sortable: true,
      width: "80px",
      right: true,
    },
    {
      name: "Qty",
      selector: (row) => row.Quantity ?? "N/A",
      sortable: true,
      width: "70px",
      right: true,
    },
    {
      name: "Free Qty",
      selector: (row) => row.FreeQty ?? "N/A",
      sortable: true,
      width: "80px",
      right: true,
    },
    {
      name: "CGST %",
      selector: (row) => row.CGSTRate ?? "N/A",
      sortable: true,
      width: "80px",
      right: true,
    },
    {
      name: "CGST Amt",
      selector: (row) => row.CGSTAmount ?? "N/A",
      sortable: true,
      width: "90px",
      right: true,
    },
    {
      name: "SGST %",
      selector: (row) => row.SGSTRate ?? "N/A",
      sortable: true,
      width: "80px",
      right: true,
    },
    {
      name: "SGST Amt",
      selector: (row) => row.SGSTAmount ?? "N/A",
      sortable: true,
      width: "90px",
      right: true,
    },
    {
      name: "Taxable Value",
      selector: (row) => row.NetRate ?? "N/A",
      sortable: true,
      width: "120px",
      right: true,
    },
    {
      name: "Total Tax",
      selector: (row) => row.TotalTax ?? "N/A",
      sortable: true,
      width: "100px",
      right: true,
    },
    {
      name: "Item Total",
      selector: (row) => row.ItemTotAmount ?? "N/A",
      sortable: true,
      width: "120px",
      right: true,
    },
    {
      name: "Discount (Rs)",
      selector: (row) => row.DiscountRs ?? "N/A",
      sortable: true,
      width: "110px",
      right: true,
    },
    {
      name: "Round Off",
      selector: (row) => row.RoundOff ?? "N/A",
      sortable: true,
      width: "90px",
      right: true,
    },
    {
      name: "Bill Amount",
      selector: (row) => {
        if (row.BillAmountCalc !== "" && row.BillAmountCalc != null) {
          return Math.round(row.BillAmountCalc);  // ✅ Proper rounding
        } else {
          return "";
        }
      },
      sortable: false,
      width: "120px",
      right: true,
    }

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
  }, [fromDate, toDate]);

  return (
    <div className="container-fluid">
      {/* Header with Search and Export Buttons */}
      <div className="card shadow-sm mb-3 p-3">
        <h4>Sale Tax Report</h4>
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
                placeholder="Search HSN by Customer, invoice, amount..."
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
                SaleTax Report Filters
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
                    <label className="form-label fw-bold small text-muted">Customer</label>
                    <Select
                      options={customerOptions.map(c => ({ label: c, value: c }))}
                      value={selectedCustomer ? { label: selectedCustomer, value: selectedCustomer } : null}
                      onChange={(option) => setSelectedCustomer(option ? option.value : "")}
                      isClearable
                      placeholder="All Customers"
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-muted">Item Name</label>
                    <Select
                      options={itemOptions.map(i => ({ label: i, value: i }))}
                      value={selectedItem ? { label: selectedItem, value: selectedItem } : null}
                      onChange={(option) => setSelectedItem(option ? option.value : "")}
                      isClearable
                      placeholder="All Items"
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-muted">Type</label>
                    <Select
                      options={typeOptions.map(t => ({ label: t, value: t }))}
                      value={selectedType ? { label: selectedType, value: selectedType } : null}
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