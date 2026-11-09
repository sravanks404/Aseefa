import React, { useState, useEffect, useMemo } from "react";
import api from '../../apiService';
import DataTable from "react-data-table-component";
import Select from "react-select";
import { FaSearch, FaFileExcel, FaFilePdf, FaFilter } from "react-icons/fa";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import "jspdf-autotable";

const ExportSales = () => {
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
  const [filteredData, setFilteredData] = useState([]);

  const [salesPerson, setSalesPerson] = useState("");
  const [route, setRoute] = useState("");
  const [type, setType] = useState("");

  const [salesPersonOptions, setSalesPersonOptions] = useState([]);
  const [routeOptions, setRouteOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(500);

  useEffect(() => {
    fetchReport();
  }, [fromDate, toDate]);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      const response = await api.get("/api/ExportSales", {
        params: {
          CompanyID,
          FromDate: fromDate,
          ToDate: toDate,
        },
      });
      const data = response.data || [];
      setReportData(data);
      setFilteredData(data);

      setSalesPersonOptions(
        Array.from(new Set(data.map(d => d.SalesPerson))).map(p => ({ label: p, value: p }))
      );
      setRouteOptions(
        Array.from(new Set(data.map(d => d.Route))).map(r => ({ label: r, value: r }))
      );
      setTypeOptions(
        Array.from(new Set(data.map(d => d.Type))).map(t => ({ label: t, value: t }))
      );
    } catch (err) {
      console.error("Error fetching report:", err);
      setReportData([]);
      setFilteredData([]);
      setError("Failed to fetch data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = (data = reportData || []) => {
    let result = [...data]; // clone the array to avoid mutating the original

    if (salesPerson) {
      result = result.filter(d => d.SalesPerson === salesPerson);
    }

    if (route) {
      result = result.filter(d => d.Route === route);
    }

    if (type) {
      result = result.filter(d => d.Type === type);
    }

    if (searchQuery && searchQuery.trim() !== "") {
      const search = searchQuery.toLowerCase();
      result = result.filter(d =>
      (d.HSNCode?.toString().toLowerCase().includes(search) ||
        d.ItemName?.toString().toLowerCase().includes(search) ||
        d.BillNo?.toString().toLowerCase().includes(search) ||
        d.CustomerName?.toString().toLowerCase().includes(search))
      );

    }

    setFilteredData(result);
    setCurrentPage(1); // Reset pagination
  };

  useEffect(() => {
    applyFilters(reportData);
  }, [reportData, fromDate, toDate, salesPerson, route, type, searchQuery]);
  // include searchQuery to re-filter on search


  const handleClear = () => {
    setFromDate(getPreviousDate(7));
    setToDate(getCurrentDate());
    setSearchQuery("");
    setSalesPerson("");
    setRoute("");
    setType("");
    setError("");
    fetchReport();
  };

  const exportToExcel = () => {
    if (!filteredData.length) {
      alert("No data to export.");
      return;
    }

    const formattedFromDate = new Date(fromDate).toLocaleDateString('en-GB');
    const formattedToDate = new Date(toDate).toLocaleDateString('en-GB');

    const headerInfo = [
      ["Export Sales Report"],
      [`From: ${formattedFromDate}   To: ${formattedToDate}`],
      [`Sales Person: ${salesPerson || "All"} | Route: ${route || "All"} | Type: ${type || "All"}`],
      [], // Empty row for spacing
    ];

    const headers = ["Voucher Date", "BillNo", "Voucher Type", "Sales Account", "Customer Name", "Customer Address", "GSTIN",
      "Item Name", "Qty", "Rate", "Unit", "Discount", "GST %", "CGST Led", "CGST Amount", "SGST Led", "SGST Amount",
      "IGST Led", "IGST Amount", "Cess Led", "Cess %", "KFC Led", "KFC %", "Led-1", "Led 1 Amt", "Led 2", "Led2 Amt",
      "Gross Amount", "Total Amount", "CGST Registration type", "hsn code", "Mode OF Payment", "Buyer Name", "State",
      "Sales Person", "Bill Discount", "Round Off", "Rate(Excl SalesRate)"]

    const rows = filteredData.map(d => [
      d.VoucherDate, d.BillNo, d.VoucherType, d.SalesAccount, d.CustomerName,
      d.CustomerAddress, d.GSTIN, d.ItemName, d.Qty, d.Rate, d.Unit, d.Discount,
      d.GST, d.CGSTLed, d.CGSTAmount, d.SGSTLed, d.SGSTAmount, d.IGSTLed,
      d.IGSTamount, d.CessLed, d.cess, d.KFCLed, d.KFC, d.Led1, d.Led1Amt,
      d.Led2, d.Led2Amt, d.GrossAmount, d.TotalAmount, d.CGSTRegistrationtype,
      d.HSNCode, d.SalesMode, d.BuyerName, d.State, d.SalesPerson, d.BillDiscount,
      d.RoundOFf, d.GrossAmount
    ]);

    // Create worksheet
    const worksheetData = [...headerInfo, headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    const colWidths = [
      { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 25 },
      { wch: 30 }, { wch: 20 }, { wch: 25 }, { wch: 8 }, { wch: 10 },
      { wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 15 }, { wch: 12 },
      { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 15 },
      { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 12 },
      { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
    ];
    ws['!cols'] = colWidths;

    // Create workbook and export
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ExportSales");
    XLSX.writeFile(wb, `ExportSales_${fromDate}_to_${toDate}.xlsx`);
  };



  // Table columns matching Excel export
  const columns = [
    {
      name: " Date",
      selector: row =>
        row.VoucherDate || "N/A",
      sortable: true,
      width: "120px"
    },

    {
      name: "Bill No",
      selector: row => row.BillNo || "N/A",
      sortable: true,
      width: "150px"
    },

    {
      name: "Customer Name",
      selector: row => row.CustomerName || "N/A",
      sortable: true,
      width: "180px"
    },
    {
      name: "Customer Address",
      selector: row => row.CustomerAddress || "N/A",
      sortable: true,
      width: "200px"
    },

    {
      name: "Item Name",
      selector: row => row.ItemName || "N/A",
      sortable: true,
      width: "180px"
    },
    {
      name: "Qty",
      selector: row => row.Qty ? parseFloat(row.Qty).toFixed(2) : "0.00",
      sortable: true,
      right: true,
      width: "80px"
    },
    {
      name: "Rate",
      selector: row => row.Rate ? parseFloat(row.Rate).toFixed(2) : "0.00",
      sortable: true,
      right: true,
      width: "80px"
    },


    {
      name: "Gross Amount",
      selector: row => row.GrossAmount ? parseFloat(row.GrossAmount).toFixed(2) : "0.00",
      sortable: true,
      right: true,
      width: "100px"
    },
    {
      name: "Total Amount",
      selector: row => row.TotalAmount ? parseFloat(row.TotalAmount).toFixed(2) : "0.00",
      sortable: true,
      right: true,
      width: "100px"
    },
    {
      name: "Sales Person",
      selector: row => row.SalesPerson || "N/A",
      sortable: true,
      width: "120px"
    },
    {
      name: "CGST Amt",
      selector: row => row.CGSTAmount ? parseFloat(row.CGSTAmount).toFixed(2) : "0.00",
      sortable: true,
      right: true,
      width: "80px"
    },
    {
      name: "SGST Amt",
      selector: row => row.SGSTAmount ? parseFloat(row.SGSTAmount).toFixed(2) : "0.00",
      sortable: true,
      right: true,
      width: "80px"
    },
    {
      name: "Unit",
      selector: row => row.Unit || "N/A",
      sortable: true,
      width: "80px"
    },
    {
      name: "Discount",
      selector: row => row.Discount ? parseFloat(row.Discount).toFixed(2) : "0.00",
      sortable: true,
      right: true,
      width: "80px"
    },
    {
      name: "GST %",
      selector: row => row.GST ? parseFloat(row.GST).toFixed(2) : "0.00",
      sortable: true,
      right: true,
      width: "80px"
    },

    {
      name: "IGST Amt",
      selector: row => row.IGSTamount ? parseFloat(row.IGSTamount).toFixed(2) : "0.00",
      sortable: true,
      right: true,
      width: "80px"
    },

    {
      name: "HSN Code",
      selector: row => row.HSNCode || "N/A",
      sortable: true,
      width: "80px"
    },
    {
      name: "Rate",
      selector: row => row.HSNCode || "N/A",
      sortable: true,
      width: "80px"
    },

    {
      name: "GSTIN",
      selector: row => row.GSTIN || "N/A",
      sortable: true,
      width: "120px"
    },
    {
      name: " Type",
      selector: row => row.VoucherType || "N/A",
      sortable: true,
      width: "120px"
    },
    {
      name: "Sales Account",
      selector: row => row.SalesAccount || "N/A",
      sortable: true,
      width: "150px"
    },
  ];

  // Custom footer component
  const CustomFooter = ({
    rowsPerPage,
    rowCount,
    currentPage,
    onChangePage,
    onChangeRowsPerPage,
    filteredData = []
  }) => {
    const totalPages = Math.ceil(rowCount / rowsPerPage);

    const totalAmount = Array.isArray(filteredData)
      ? filteredData.reduce((sum, row) => sum + (parseFloat(row.TotalAmount) || 0), 0)
      : 0;


    return (
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-3 bg-light">
        <div className="fw-semibold text-dark mb-2 mb-md-0">
          Total Amount: {formatAmount(totalAmount)}
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
    const data = Array.isArray(filteredData) ? filteredData : [];
    return data.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);


  return (
    <div className="container-fluid">
      {/* Header with Search and Export Buttons */}
      <div className="card shadow-sm mb-3 p-3">
        <h4>Export Sales Report</h4>
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
                placeholder="Search by Bill No, Customer, Item or HSN..."
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
                Export Sales Filters
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
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

              <div className="row mb-3 g-3">
                <div className="col-md-4">
                  <label className="form-label fw-bold small text-muted">Sales Person</label>
                  <Select
                    options={salesPersonOptions}
                    onChange={o => setSalesPerson(o?.value || "")}
                    placeholder="All Sales Persons"
                    isClearable
                    menuPortalTarget={document.body} // 👈 Key part
                    styles={{
                      menuPortal: base => ({ ...base, zIndex: 9999 }), // 👈 ensures it appears on top
                    }}
                  />

                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold small text-muted">Route</label>
                  <Select
                    options={routeOptions}
                    onChange={o => setRoute(o?.value || "")}
                    placeholder="All Routes"
                    isClearable
                    menuPortalTarget={document.body} // 👈 Key part
                    styles={{
                      menuPortal: base => ({ ...base, zIndex: 9999 }), // 👈 ensures it appears on top
                    }}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold small text-muted">Type</label>
                  <Select
                    options={typeOptions}
                    onChange={o => setType(o?.value || "")}
                    placeholder="All Types"
                    isClearable
                    menuPortalTarget={document.body} // 👈 Key part
                    styles={{
                      menuPortal: base => ({ ...base, zIndex: 9999 }), // 👈 ensures it appears on top
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer bg-light">
              <div className="d-flex justify-content-between w-100">
                <button type="button" className="btn btn-link text-danger" onClick={handleClear}>
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
                    onClick={applyFilters}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger mb-3">
          {error}
        </div>
      )}

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
            fixedHeaderScrollHeight="calc(100vh - 280px)"
            customStyles={{
              headCells: {
                style: {
                  backgroundColor: '#f8f9fa',
                  fontWeight: 'bold',
                  fontSize: '13px',
                },
              },
              cells: {
                style: {
                  fontSize: '13px',
                },
              },
            }}
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
            filteredData={filteredData} // ← pass this prop
          />

        </div>
      </div>
    </div>
  );
};

export default ExportSales;