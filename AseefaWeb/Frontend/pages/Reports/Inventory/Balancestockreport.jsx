import React, { useState, useEffect, useMemo } from "react";
import api from "../../apiService";
import DataTable from "react-data-table-component";
import { FaSearch, FaFileExcel, FaFilePdf, FaFilter } from "react-icons/fa";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

const BlanceStockReport = () => {
  const [result, setResult] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [ItemName, setItemName] = useState("");
  const [CatgoryName, setCatgoryName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [stockRange, setStockRange] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(500);
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

      if (!companyID) {
        throw new Error("CompanyID not found in session.");
      }

      const response = await api.get("/api/balancestock", {
        params: { companyid: parseInt(companyID) }
      });

      const data = Array.isArray(response?.data) ? response.data : [];
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

    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const formattedItemName = ItemName || "All";
    const formattedCategoryName = CatgoryName || "All";

    // ✅ Map itemType value into readable label
    const formattedItemType =
      itemType === "1" ? "Finished Item" :
        itemType === "0" ? "Semi Item" :
          itemType === "other" ? "Other" : "All";

    const formattedStockRange = stockRange
      ? stockRanges.find(range => range.value === stockRange)?.label || "All"
      : "All";

    // ✅ Filters section at top of Excel
    const filterData = [

      ["", "Date", formattedDate],
      ["", "Item Name", formattedItemName],
      ["", "Category Name", formattedCategoryName],
      ["", "Item Type", formattedItemType],
      ["", "Stock Range", formattedStockRange],
      [],
    ];

    // ✅ Headers
    const headers = [[
      "Sl.No",
      "Item Name",
      "Category Name",
      "Item Type",
      "Opening",
      "Purchase",
      "Production",
      "Ingredients",
      "Billing Return",
      "Purchase Return",
      "Total Stock",
      "Total Sale",
      "GoDown Balance",
      "VT Stock",
      "VT Sale",
      "VT Return",
      "VT Balance"
    ]];

    // ✅ Data rows
    const dataForExcel = filteredResults.map((row, index) => [
      (currentPage - 1) * rowsPerPage + index + 1,
      row.ItemName || "N/A",
      row.CatgoryName || "N/A",
      row.ItemType === 1 ? "Finished Item" : row.ItemType === 0 ? "Semi Item" : "Other",
      row.Opening || 0,
      row.Purchase || 0,
      row.Production || 0,
      row.Ingredient || 0,
      row.BillingReturn || 0,
      row.PurchaseReturn || 0,
      row.TotalStock || 0,
      row.SoldStock || 0,
      row.GoDownStock || 0,
      row.VTStock || 0,
      row.VTSale || 0,
      row.VTStockReturn || 0,
      row.VTBalance || 0,
    ]);

    // ✅ Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(filterData);
    XLSX.utils.sheet_add_aoa(ws, headers, { origin: filterData.length + 1 });
    XLSX.utils.sheet_add_aoa(ws, dataForExcel, { origin: filterData.length + 2 });

    // ✅ Make headers bold
    const headerRow = filterData.length + 1;
    for (let C = 0; C < headers[0].length; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: headerRow, c: C });
      if (!ws[cellRef]) continue;
      if (!ws[cellRef].s) ws[cellRef].s = {};
      ws[cellRef].s.font = { bold: true };
    }

    // ✅ Set column widths
    ws['!cols'] = [
      { wch: 6 },   // Sl.No
      { wch: 25 },  // Item Name
      { wch: 20 },  // Category Name
      { wch: 20 },  // Item Type
      { wch: 15 },  // Opening
      { wch: 15 },  // Purchase
      { wch: 15 },  // Production
      { wch: 15 },  // Ingredients
      { wch: 18 },  // Billing Return
      { wch: 18 },  // Purchase Return
      { wch: 15 },  // Total Stock
      { wch: 15 },  // Total Sale
      { wch: 18 },  // GoDown Balance
      { wch: 15 },  // VT Stock
      { wch: 15 },  // VT Sale
      { wch: 15 },  // VT return
      { wch: 15 },  // VT Balance
    ];


    // ✅ Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "StockReport");

    XLSX.writeFile(wb, `GodownStock_Report_${today.toISOString().split('T')[0]}.xlsx`);
  };


  const exportToPDF = () => {
    if (!filteredResults.length) {
      alert("No data to export.");
      return;
    }

    // ✅ Landscape orientation, A4 size
    const doc = new jsPDF("landscape", "pt", "a4");

    doc.setFontSize(16);
    doc.text("Godown Stock Report", 40, 30);

    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const formattedItemName = ItemName || "All";
    const formattedCategoryName = CatgoryName || "All";
    const formattedItemType =
      itemType === "1"
        ? "Finished Item"
        : itemType === "0"
          ? "Semi Item"
          : itemType === "other"
            ? "Other"
            : "All";

    const formattedStockRange = stockRange
      ? stockRanges.find((range) => range.value === stockRange)?.label || "All"
      : "All";

    // ✅ Filters section
    doc.setFontSize(10);
    let filterY = 50;
    doc.text(`Date: ${formattedDate}`, 40, filterY);
    doc.text(`Item Name: ${formattedItemName}`, 200, filterY);
    doc.text(`Category Name: ${formattedCategoryName}`, 400, filterY);
    filterY += 15;
    doc.text(`Item Type: ${formattedItemType}`, 40, filterY);
    doc.text(`Stock Range: ${formattedStockRange}`, 200, filterY);

    // ✅ Headers (same as Excel)
    const tableColumn = [
      "Sl.No",
      "Item Name",
      "Category Name",
      "Item Type",
      "Opening",
      "Purchase",
      "Production",
      "Ingredients",
      "Billing Return",
      "Purchase Return",
      "Total Stock",
      "Total Sale",
      "GoDown Balance",
      "VT Stock",
      "VT Sale",
      "VT Return",
      "VT Balance",
    ];

    // ✅ Data rows (same as Excel)
    const tableRows = filteredResults.map((row, index) => [
      index + 1,
      row.ItemName || "N/A",
      row.CatgoryName || "N/A",
      row.ItemType === 1
        ? "Finished Item"
        : row.ItemType === 0
          ? "Semi Item"
          : "Other",
      row.Opening || 0,
      row.Purchase || 0,
      row.Production || 0,
      row.Ingredient || 0,
      row.BillingReturn || 0,
      row.PurchaseReturn || 0,
      row.TotalStock || 0,
      row.SoldStock || 0,
      row.GoDownStock || 0,
      row.VTStock || 0,
      row.VTSale || 0,
      row.VTStockReturn || 0,
      row.VTBalance || 0,
    ]);

    // ✅ AutoTable
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: filterY + 20,
      theme: "grid",
      styles: { fontSize: 7 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
      didDrawPage: function (data) {
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(
          `Page ${data.pageCount}`,
          doc.internal.pageSize.getWidth() - 60,
          doc.internal.pageSize.getHeight() - 20
        );
      },
    });

    doc.save(`GodownStock_Report_${today.toISOString().split("T")[0]}.pdf`);
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
    {
      name: "Sl.No",
      selector: (_, index) => (currentPage - 1) * rowsPerPage + index + 1,
      sortable: false,
      width: "80px",
    },
    {
      name: "Item Name",
      selector: row => row.ItemName || "N/A",
      sortable: true,
      width: "200px",
      style: {
        position: "sticky",
        left: 0,
        background: "#fff",
        zIndex: 1,
      },
      // Apply `top` ONLY here for vertical stickiness of header
      headerStyle: {
        position: "sticky",
        top: 0,
        left: 0,
        background: "#f1f3f5",
        zIndex: 2,
      },
    },
    // {
    //   name: "Category Name",
    //   selector: row => row.CatgoryName || "N/A",
    //   sortable: true,
    //   width: "150px",
    // },
    {
      name: "Opening",
      selector: row => row.Opening || 0,
      sortable: true,
      width: "150px",
    },
    {
      name: "Purchase ",
      selector: row => row.Purchase || 0,
      sortable: true,
      width: "150px",
    },
    {
      name: "Production",
      selector: row => row.Production || 0,
      sortable: true,
      width: "160px",
    },

    {
      name: "Ingredients ",
      selector: row => row.Ingredient || 0,
      sortable: true,
      width: "150px",
    },

    {
      name: "Billing Return",
      selector: row => row.BillingReturn || 0,
      sortable: true,
      width: "150px",
    },

    {
      name: "Purchase Return",
      selector: row => row.PurchaseReturn || 0,
      sortable: true,
      width: "160px",
    },

    {
      name: "Total Stock",
      selector: row => row.TotalStock || 0,
      sortable: true,
      width: "150px",
    },
    {
      name: "Total Sale",
      selector: row => row.SoldStock || 0,
      sortable: true,
      width: "150px",
    },
    {
      name: "GoDown Balance",
      selector: row => row.GoDownStock || 0,
      sortable: true,
      width: "150px",
    },

    {
      name: "VT Stock",
      selector: row => row.VTStock || 0,
      sortable: true,
      width: "150px",
    },

    {
      name: "VT Sale",
      selector: row => row.VTSale || 0,
      sortable: true,
      width: "150px",
    },

    {
      name: "VT Return",
      selector: row => row.VTStockReturn || 0,
      sortable: true,
      width: "150px",
    },

    {
      name: "VT Balance",
      selector: row => row.VTBalance || 0,
      sortable: true,
      width: "150px",
    },



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
        <h4> GoDown Stock Report</h4>
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
        <div style={{ flex: 1, overflowX: "auto", overflowY: "auto" }}>
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

export default BlanceStockReport
  ;