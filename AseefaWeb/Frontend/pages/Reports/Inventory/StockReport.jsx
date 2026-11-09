import React, { useState, useEffect, useMemo } from "react";
import api from "../../apiService";
import DataTable from "react-data-table-component";
import { FaSearch, FaFileExcel, FaFilePdf, FaFilter } from "react-icons/fa";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

const StockReport = () => {
  const [result, setResult] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [ItemName, setItemName] = useState("");
  const [CatgoryName, setCatgoryName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [stockRange, setStockRange] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [itemType, setItemType] = useState("");


  const stockRanges = [
    { label: "All", value: "" },
    { label: "0", value: "0" },
    { label: "1 - 500", value: "1-500" },
    { label: "501 - 2000", value: "501-2000" },
    { label: "2001 and above", value: "2001" },
  ];

  const fetchStockReport = async () => {
    setIsLoading(true);
    setError("");
    try {
      const companyID = sessionStorage.getItem("CompanyID");
      const response = await api.get("/api/Closingstock", {
        params: {
          CompanyID: companyID,
          FromDate: fromDate,
          ToDate: toDate
        }
      });

      const data = response?.data || [];
      setResult(data);
    } catch (err) {
      console.error("Error fetching stock report:", err);
      setError("Failed to fetch stock report. Please try again.");
      setResult([]);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchStockReport();
  }, []);

  const handleClear = () => {
    setItemName("");
    setCatgoryName("");
    setStockRange("");
    setSearchQuery("");
    setItemType(""); // add this
    setError("");
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    fetchStockReport();
  };

  const filteredResults = useMemo(() => {
    let filteredData = result;

    if (ItemName) {
      filteredData = filteredData.filter(item => item.ItemName === ItemName);
    }
    if (CatgoryName) {
      filteredData = filteredData.filter(item => item.CatgoryName === CatgoryName);
    }
    if (searchQuery) {
      filteredData = filteredData.filter(item =>
        item.ItemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.TotalStock?.toString().includes(searchQuery)
      )
    }
    if (stockRange) {
      filteredData = filteredData.filter(item => {
        const stock = item.TotalStock;
        switch (stockRange) {
          case "0": return stock === 0;
          case "1-500": return stock >= 1 && stock <= 500;
          case "501-2000": return stock >= 501 && stock <= 2000;
          case "2001": return stock >= 2001;
          default: return true;
        }
      });
    }

    if (itemType !== "") {
      if (itemType === "other") {
        filteredData = filteredData.filter(item => item.ItemType !== 1 && item.ItemType !== 0);
      } else {
        filteredData = filteredData.filter(item => String(item.ItemType) === itemType);
      }
    }



    return filteredData;
  }, [result, ItemName, CatgoryName, searchQuery, stockRange]);

  const exportToExcel = () => {
    if (!filteredResults.length) {
      alert("No data to export.");
      return;
    }

    const formattedItemName = ItemName || "All";
    const formattedCategoryName = CatgoryName || "All";
    const formattedStockRange = stockRange
      ? stockRanges.find(range => range.value === stockRange)?.label || "All"
      : "All";
    const formattedFromDate = fromDate ? new Date(fromDate).toLocaleDateString("en-IN") : "All";
    const formattedToDate = toDate ? new Date(toDate).toLocaleDateString("en-IN") : "All";

    // Filters section
    const filterData = [
      ["", "Item Name", formattedItemName],
      ["", "Category Name", formattedCategoryName],
      ["", "Stock Range", formattedStockRange],
      ["", "From Date", formattedFromDate],
      ["", "To Date", formattedToDate],
      [],
    ];

    // Headers
    const headers = [[
      "Sl No",
      "Item Name",
      "Category Name",
      "Opening Stock",
      "Stock In",
      "Stock Out",
      "Balance Stock"
    ]];

    // Data
    const dataForExcel = filteredResults.map((row, index) => [
      (currentPage - 1) * rowsPerPage + index + 1,
      row.ItemName || "N/A",
      row.CatgoryName || "N/A",
      row.BeforeTotalStock || 0,
      row.AvlTotalStock || 0,
      row.SoldStock || 0,
      row.TotalStock || 0
    ]);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(filterData);
    XLSX.utils.sheet_add_aoa(ws, headers, { origin: filterData.length + 1 });
    XLSX.utils.sheet_add_aoa(ws, dataForExcel, { origin: filterData.length + 2 });

    // 🔹 Set column widths (wch = width in characters)
    ws['!cols'] = [
      { wch: 6 },   // Sl No
      { wch: 25 },  // Item Name
      { wch: 22 },  // Category Name
      { wch: 18 },  // Opening Stock
      { wch: 15 },  // Stock In
      { wch: 15 },  // Stock Out
      { wch: 18 },  // Balance Stock
    ];

    // Create workbook & export
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "StockReport");
    XLSX.writeFile(wb, `Stock_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
  };


  const exportToPDF = () => {
    if (!filteredResults.length) {
      alert("No data to export.");
      return;
    }

    const doc = new jsPDF();

    // 🔹 Title
    doc.setFontSize(16);
    doc.text("Stock Report", 14, 10);

    // 🔹 Filters
    const formattedItemName = ItemName || "All";
    const formattedCategoryName = CatgoryName || "All";
    const formattedStockRange = stockRange
      ? stockRanges.find(range => range.value === stockRange)?.label || "All"
      : "All";
    const formattedFromDate = fromDate ? new Date(fromDate).toLocaleDateString("en-IN") : "All";
    const formattedToDate = toDate ? new Date(toDate).toLocaleDateString("en-IN") : "All";

    doc.setFontSize(10);

    // 👉 Put filters in single row
    const filterText =
      `Item Name: ${formattedItemName}   |   ` +
      `Category Name: ${formattedCategoryName}   |   ` +
      `Stock Range: ${formattedStockRange}   |   ` +
      `From: ${formattedFromDate}   |   ` +
      `To: ${formattedToDate}`;

    let yPos = 20;
    doc.text(filterText, 14, yPos, { maxWidth: 180 }); // wrap if too long
    yPos += 10;

    // 🔹 Table columns (same as Excel)
    const tableColumn = [
      "Sl No",
      "Item Name",
      "Category Name",
      "Opening Stock",
      "Stock In",
      "Stock Out",
      "Balance Stock"
    ];

    // 🔹 Table rows (same as Excel)
    const tableRows = filteredResults.map((row, index) => [
      (currentPage - 1) * rowsPerPage + index + 1,
      row.ItemName || "N/A",
      row.CatgoryName || "N/A",
      row.BeforeTotalStock || 0,
      row.AvlTotalStock || 0,
      row.SoldStock || 0,
      row.TotalStock || 0
    ]);

    // 🔹 Generate Table
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: yPos + 2,
      theme: "grid",
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },  // Sl No
        1: { cellWidth: 40 },                   // Item Name
        2: { cellWidth: 35 },                   // Category Name
        3: { cellWidth: 25, halign: "right" },  // Opening Stock
        4: { cellWidth: 20, halign: "right" },  // Stock In
        5: { cellWidth: 20, halign: "right" },  // Stock Out
        6: { cellWidth: 25, halign: "right" },  // Balance Stock
      },
      didDrawPage: function (data) {
        // 🔹 Footer with page number
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(
          `Page ${data.pageCount}`,
          doc.internal.pageSize.width - 20,
          doc.internal.pageSize.height - 10,
          { align: "right" }
        );
      }
    });

    // 🔹 Save file
    doc.save(`Stock_Report_${new Date().toISOString().split('T')[0]}.pdf`);
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
    { name: "Sl.No", selector: (_, index) => (currentPage - 1) * rowsPerPage + index + 1, sortable: false, width: "7%" },
    { name: "Item Name", selector: row => row.ItemName || "N/A", sortable: true, width: "20%" },
    { name: "Category Name", selector: row => row.CatgoryName || "N/A", sortable: true, width: "18%" },
    { name: " Opening Stock", selector: row => row.BeforeTotalStock || "0", sortable: true, width: "14%" },
    { name: " Stock In", selector: row => row.AvlTotalStock || "0", sortable: true, width: "11%" },
    { name: "Stock Out", selector: row => row.SoldStock || "0", sortable: true, width: "15%" },
    { name: "Balance Stock", selector: row => row.TotalStock || 0, sortable: true, width: "15%" },

  ];

  const CustomFooter = ({ rowsPerPage, rowCount, currentPage, onChangePage, onChangeRowsPerPage }) => {
    const totalPages = Math.ceil(rowCount / rowsPerPage);
    const totalItems = filteredResults.length;

    return (
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-3 bg-light">
        <div className="fw-semibold text-dark mb-2 mb-md-0">
          Total Items: {totalItems}
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

  const distinctItemNames = useMemo(() =>
    [...new Set(result.map(item => item.ItemName))].filter(Boolean),
    [result]
  );

  const distinctCatgoryNames = useMemo(() =>
    [...new Set(result.map(item => item.CatgoryName))].filter(Boolean),
    [result]
  );

  return (
    <div className="container-fluid">
      {/* Header with Search and Export Buttons */}
      <div className="card shadow-sm mb-3 p-3">
        <h4>Stock Report</h4>
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
                placeholder="Search by item name or stock..."
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
                Stock Report Filters
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">

                    {/* From Date */}
                    <div className="mb-3">
                      <label htmlFor="fromDate" className="form-label fw-bold small text-muted">FROM DATE</label>
                      <input
                        type="date"
                        className="form-control"
                        id="fromDate"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                      />
                    </div>



                    {/* Item Name with Search */}
                    <div className="mb-3">
                      <label htmlFor="ItemName" className="form-label fw-bold small text-muted">ITEM NAME</label>
                      <div className="input-group mb-2">
                        <span className="input-group-text">
                          <FaSearch />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search items..."
                          id="itemSearch"
                          onChange={(e) => {
                            const searchTerm = e.target.value.toLowerCase();
                            const select = document.getElementById("ItemName");
                            if (select) {
                              const options = select.options;
                              for (let i = 0; i < options.length; i++) {
                                const option = options[i];
                                option.style.display = option.text.toLowerCase().includes(searchTerm) ? "" : "none";
                              }
                            }
                          }}
                        />
                      </div>
                      <select
                        id="ItemName"
                        className="form-select"
                        value={ItemName}
                        onChange={(e) => setItemName(e.target.value)}
                        size="5"
                        style={{ overflowY: 'auto' }}
                      >
                        <option value="">All Items</option>
                        {distinctItemNames.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Category Name */}
                    <div className="mb-3">
                      <label htmlFor="CatgoryName" className="form-label fw-bold small text-muted">CATEGORY NAME</label>
                      <select
                        id="CatgoryName"
                        className="form-select"
                        value={CatgoryName}
                        onChange={(e) => setCatgoryName(e.target.value)}
                      >
                        <option value="">All Categories</option>
                        {distinctCatgoryNames.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6">

                    {/* To Date */}
                    <div className="mb-3">
                      <label htmlFor="toDate" className="form-label fw-bold small text-muted">TO DATE</label>
                      <input
                        type="date"
                        className="form-control"
                        id="toDate"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                      />
                    </div>
                    {/* Stock Range */}
                    <div className="mb-3">
                      <label htmlFor="stockRange" className="form-label fw-bold small text-muted">STOCK RANGE</label>
                      <select
                        id="stockRange"
                        className="form-select"
                        value={stockRange}
                        onChange={(e) => setStockRange(e.target.value)}
                      >
                        {stockRanges.map((range) => (
                          <option key={range.value} value={range.value}>
                            {range.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="itemType" className="form-label fw-bold small text-muted">ITEM TYPE</label>
                      <select
                        id="itemType"
                        className="form-select"
                        value={itemType}
                        onChange={(e) => setItemType(e.target.value)}
                      >
                        <option value="">All</option>
                        <option value="1">Finished Item</option>
                        <option value="0">Semi Item</option>
                        <option value="other">Other</option>
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
            data={filteredResults}
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

export default StockReport;