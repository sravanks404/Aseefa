import React, { useState, useEffect, useRef } from "react";
import api from "../../apiService";
import DataTable from "react-data-table-component";
import numberToWords from "number-to-words"; // Ensure this library is installed
import { FaSearch, FaFileExcel, FaPrint } from "react-icons/fa";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

const DamageReport = () => {
  const getCurrentDate = () => new Date().toISOString().split("T")[0];
  const getPreviousDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];  // Format to yyyy-mm-dd
  };
  // Format amount function
  const formatAmount = (amount) => {
    return amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    });
  };
  const [fromDate, setFromDate] = useState(getPreviousDate(7));
  const [toDate, setToDate] = useState(getCurrentDate());
  const [result, setResult] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [salesman, setSalesman] = useState("");
  const [customer, setCustomer] = useState("");
  const [summary, setSummary] = useState({
    customerCount: 0,
    totalAmount: 0,
    totalOrders: 0, // Add totalOrders to the summary
  });
  const [searchQuery, setSearchQuery] = useState(""); // State for search input
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef(null);
  const [distinctSalesmen, setDistinctSalesmen] = useState([]);
  const [distinctCustomers, setDistinctCustomers] = useState([]);
  const [selectedSalesmen, setSelectedSalesmen] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 70;

  const fetchDamageReport = async () => {
    setIsLoading(true);
    setError("");
    try {

      const response = await api.get("/api/DamageReport", {
        params: { FromDate: fromDate, ToDate: toDate }
      });

      const data = response?.data || [];

      // ✅ Fix: Ensure `filteredResults` gets the correct data
      let filteredResults = Array.isArray(data) ? data : [];

      // Extract distinct names
      const uniqueSalesmen = [...new Set(filteredResults.map(order => order.SalesmanName))];
      const uniqueCustomers = [...new Set(filteredResults.map(order => order.CustomerName))];

      setDistinctSalesmen(uniqueSalesmen);
      setDistinctCustomers(uniqueCustomers);

      // Apply filters
      if (selectedSalesmen.length > 0) {
        filteredResults = filteredResults.filter(order => selectedSalesmen.includes(order.SalesmanName));
      }
      if (customer) {
        filteredResults = filteredResults.filter(order => order.CustomerName === customer);
      }

      // Calculate summary
      const customerCount = new Set(filteredResults.map(order => order.CustID)).size;
      const totalAmount = filteredResults.reduce((sum, order) => sum + (order.Qty || 0), 0);
      const totalOrders = filteredResults.length;

      setSummary({ customerCount, totalAmount, totalOrders });
      setResult(filteredResults);
    } catch (err) {
      console.error("Error fetching damage report:", err.response?.data || err.message);
      setError("Failed to fetch damage report. Please try again.");
      setResult([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDamageReport();
  }, [fromDate, toDate, salesman, customer]);


  const handleClear = () => {
    setFromDate(getPreviousDate(7));
    setToDate(getCurrentDate());
    setSalesman(""); // Clear Salesman filter
    setCustomer(""); // Clear Customer filter
    setError("");
    setSearchQuery(""); // Clear search query
    setSelectedSalesmen("")
  };

  // Handle checkbox selection
  const handleSalesmanChange = (e) => {
    const { value, checked } = e.target;
    setSelectedSalesmen((prev) =>
      checked ? [...prev, value] : prev.filter((name) => name !== value)
    );
  };

  const handleClickOutside = (event) => {
    if (inputRef.current && !inputRef.current.contains(event.target)) {
      setShowInput(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchDamageReport();
  };
  /** ✅ Export to Excel */
  const exportToExcel = () => {
    const filteredResults = result.filter((row) => {
      return (
        row.ItemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.Date?.includes(searchQuery) ||
        row.CustomerName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

    if (!filteredResults.length) {
      alert("No data to export.");
      return;
    }

    // Format filters
    const filterData = [
      ["From Date", fromDate || "N/A"],
      ["To Date", toDate || "N/A"],
      ["Salesman", selectedSalesmen.length > 0 ? selectedSalesmen.join(", ") : "All"],
      ["Customer", customer || "All"],
      [], // Empty row for spacing
    ];

    // Table headers
    const headers = [["SL.No", "Date", "Customer", "Item Name", "Good Stock", "Damage Product", "Expired", "Replacement", "Salesman"]];

    // Data rows
    const dataRows = filteredResults.map((row, index) => ([
      index + 1,
      row.Date || "N/A",
      row.CustomerName || "N/A",
      row.ItemName || "N/A",
      (row.GoodStock || 0).toFixed(2),
      (row.DamageProduct || 0).toFixed(2),
      (row.Expired || 0).toFixed(2),
      (row.Replacement || 0).toFixed(2),
      row.SalesmanName || "N/A"
    ]));

    // Total row
    const totalRow = [
      "TOTAL", "", "", "",
      filteredResults.reduce((sum, r) => sum + (r.GoodStock || 0), 0).toFixed(2),
      filteredResults.reduce((sum, r) => sum + (r.DamageProduct || 0), 0).toFixed(2),
      filteredResults.reduce((sum, r) => sum + (r.Expired || 0), 0).toFixed(2),
      filteredResults.reduce((sum, r) => sum + (r.Replacement || 0), 0).toFixed(2),
      ""
    ];

    // Combine all sections
    const allData = [...filterData, ...headers, ...dataRows, totalRow];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(allData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DamageReport");

    // Save file
    XLSX.writeFile(wb, `DamageReport_${fromDate}_to_${toDate}.xlsx`);
  };

  /** ✅ Export to PDF */
  const exportToPDF = () => {
    const filteredResults = result.filter((row) => {
      return (
        row.ItemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.Date?.includes(searchQuery) ||
        row.CustomerName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

    if (!filteredResults.length) {
      alert("No data to export.");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(14);
    doc.text("Damage Report", pageWidth / 2, 10, { align: "center" });

    // Filters
    doc.setFontSize(10);
    let y = 16;
    doc.text(`From Date: ${fromDate || "N/A"}`, 14, y);
    doc.text(`To Date: ${toDate || "N/A"}`, 80, y);
    y += 6;
    doc.text(`Salesman: ${selectedSalesmen.length > 0 ? selectedSalesmen.join(", ") : "All"}`, 14, y);
    doc.text(`Customer: ${customer || "All"}`, 80, y);

    y += 8;

    // Table Rows
    const tableRows = filteredResults.map((row, index) => [
      index + 1,
      row.Date || "N/A",
      row.CustomerName || "N/A",
      row.ItemName || "N/A",
      (row.GoodStock || 0).toFixed(2),
      (row.DamageProduct || 0).toFixed(2),
      (row.Expired || 0).toFixed(2),
      (row.Replacement || 0).toFixed(2),
      row.SalesmanName || "N/A",
    ]);

    // Total Row
    tableRows.push([
      { content: "TOTAL", colSpan: 4, styles: { fontStyle: "bold", halign: "center" } },
      { content: filteredResults.reduce((sum, r) => sum + (r.GoodStock || 0), 0).toFixed(2), styles: { fontStyle: "bold" } },
      { content: filteredResults.reduce((sum, r) => sum + (r.DamageProduct || 0), 0).toFixed(2), styles: { fontStyle: "bold" } },
      { content: filteredResults.reduce((sum, r) => sum + (r.Expired || 0), 0).toFixed(2), styles: { fontStyle: "bold" } },
      { content: filteredResults.reduce((sum, r) => sum + (r.Replacement || 0), 0).toFixed(2), styles: { fontStyle: "bold" } },
      ""
    ]);

    // AutoTable
    doc.autoTable({
      head: [["SL.No", "Date", "Customer", "Item Name", "Good Stock", "Damage Product", "Expired", "Replacement", "Salesman"]],
      body: tableRows,
      startY: y,
      theme: "grid",
      headStyles: { fillColor: [52, 58, 64] },
      // columnStyles: {
      //   0: { cellWidth: 10 },
      //   1: { cellWidth: 20 },
      //   2: { cellWidth: 35 },
      //   3: { cellWidth: 35 },
      //   4: { cellWidth: 20 },
      //   5: { cellWidth: 20 },
      //   6: { cellWidth: 20 },
      //   7: { cellWidth: 25 },
      //   8: { cellWidth: 30 },
      // },
      margin: { top: 20 },
    });

    doc.save(`DamageReport_${fromDate}_to_${toDate}.pdf`);
  };

  const filteredResults = result.filter((row) =>
    row.ItemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.Date?.includes(searchQuery)
  );

  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  const totalPages = Math.ceil(filteredResults.length / rowsPerPage);

  return (
    <div className="container-fluid">
      <div className="card shadow-sm">
        <div className="card-body">
          <form>
            <div className="row g-3 align-items-end">
              <h4 className="page-title text-primary">Damage Report</h4>
              <div className="col-md-2">
                <label htmlFor="FromDate" className="fw-bold">From Date</label>
                <input type="date" id="FromDate" className="form-control"
                  value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div className="col-md-2">
                <label htmlFor="ToDate" className="fw-bold">To Date</label>
                <input type="date" id="ToDate" className="form-control"
                  value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>

              <div className="col-md-2">
                <label className="fw-bold">Salesman</label>
                <div className="dropdown">
                  <button className="btn btn-light border dropdown-toggle w-100 text-start" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    {selectedSalesmen.length > 0 ? selectedSalesmen.join(", ") : "Select Salesman"}
                  </button>
                  <ul className="dropdown-menu p-2" style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {distinctSalesmen.map((name) => (
                      <li key={name} className="dropdown-item">
                        <div className="form-check">
                          <input type="checkbox" id={`salesman-${name}`} value={name} className="form-check-input" checked={selectedSalesmen.includes(name)} onChange={handleSalesmanChange} />
                          <label htmlFor={`salesman-${name}`} className="form-check-label ms-2">{name}</label>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="col-md-3">
                <label htmlFor="Customer" className="fw-bold">Customer</label>
                <select id="Customer" className="form-control" value={customer} onChange={(e) => setCustomer(e.target.value)}>
                  <option value="">All</option>
                  {distinctCustomers.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 d-flex gap-2 align-items-center">
                <button type="button" className="btn btn-primary" onClick={fetchDamageReport}>Generate</button>
                <button type="button" className="btn btn-secondary" onClick={handleClear}>Clear</button>
              </div>
            </div>
          </form>
        </div>
      </div>
      <div className="card p-4">
        {/* Header Section with Search and Export Buttons */}
        <div className="row g-2 align-items-center mb-3">

          {/* Search Input */}
          <div className="col-12 col-md d-flex align-items-center" style={{ gap: "10px" }}>
            <label htmlFor="Search" className="fw-bold m-0">Search:</label>
            <input
              type="text"
              id="Search"
              className="form-control"
              placeholder="Search by Item/Date"
              style={{ maxWidth: "300px" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Export Buttons */}
          <div className="col-12 col-md-auto d-flex flex-wrap align-items-center justify-content-md-end" style={{ gap: "10px" }}>
            <button
              className="btn btn-outline-success d-flex align-items-center"
              onClick={exportToExcel}
              style={{ padding: "8px 15px" }}
            >
              <FaFileExcel style={{ marginRight: "5px" }} /> Excel
            </button>

            <button
              className="btn btn-outline-danger d-flex align-items-center"
              onClick={exportToPDF}
              style={{ padding: "8px 15px" }}
            >
              <FaPrint style={{ marginRight: "5px" }} /> PDF
            </button>
          </div>

        </div>


        {/* Table Container */}
        <div className="card shadow-sm border-0 rounded-3">
          <div className="table-container" style={{ maxHeight: "500px", overflowY: "auto", position: "relative" }}>
            <table className="table  table-hover table-bordered" style={{ width: "100%", borderCollapse: "collapse" }}>

              {/* Table Header */}
              <thead className="bg-dark text-white" style={{ position: "sticky", top: "0", zIndex: "2" }}>
                <tr>
                  <th style={{ width: "5%" }} className="text-center">SL.No</th>
                  <th style={{ width: "10%" }}>Date</th>
                  <th style={{ width: "20%" }}>Customer</th>
                  <th style={{ width: "20%" }}>Item Name</th>
                  <th style={{ width: "10%" }} className="text-">GoodStock</th>
                  <th style={{ width: "10%" }} className="text-">DamageProduct</th>
                  <th style={{ width: "10%" }} className="text-">Expired</th>
                  <th style={{ width: "10%" }} className="text-">Replacement</th>
                  <th style={{ width: "10%" }}>Salesman</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="9" className="text-center">Loading...</td></tr>
                ) : (
                  paginatedResults.map((row, index) => (
                    <tr key={index} className="align-middle" style={{ transition: "0.3s" }}>
                      <td className="text-center fw-bold">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                      <td>{row.Date}</td>
                      <td>{row.CustomerName}</td>
                      <td>{row.ItemName}</td>
                      <td className="text- fw-bold">{(row.GoodStock || 0).toFixed(2)}</td>
                      <td className="text- fw-bold">{(row.DamageProduct || 0).toFixed(2)}</td>
                      <td className="text- fw-bold">{(row.Expired || 0).toFixed(2)}</td>
                      <td className="text- fw-bold">{(row.Replacement || 0).toFixed(2)}</td>
                      <td>{row.SalesmanName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* ✅ Sticky Grand Total Row */}
            {!isLoading && filteredResults.length > 0 && (
              <div style={{
                position: "sticky",
                bottom: "0",
                zIndex: "3",
                background: "#f8f9fa",
                borderTop: "1px solid #ccc",
                boxShadow: "0 -2px 4px rgba(0,0,0,0.1)",
              }}>
                <table className="table table-bordered m-0" style={{ tableLayout: "fixed", width: "100%" }}>
                  <tfoot>
                    <tr className="fw-bold bg-light">
                      <td style={{ width: "18%" }} className="text-center  text-black">Grand Total </td>
                      <td style={{ width: "10%" }}></td>
                      <td style={{ width: "20%" }}></td>
                      <td style={{ width: "20%" }}></td>
                      <td style={{ width: "14%" }} className="text-">
                        {filteredResults.reduce((acc, row) => acc + (row.GoodStock || 0), 0).toFixed(2)}
                      </td>
                      <td style={{ width: "13%" }} className="text-">
                        {filteredResults.reduce((acc, row) => acc + (row.DamageProduct || 0), 0).toFixed(2)}
                      </td>
                      <td style={{ width: "12%" }} className="text-">
                        {filteredResults.reduce((acc, row) => acc + (row.Expired || 0), 0).toFixed(2)}
                      </td>
                      <td style={{ width: "14%" }} className="text-">
                        {filteredResults.reduce((acc, row) => acc + (row.Replacement || 0), 0).toFixed(2)}
                      </td>
                      <td style={{ width: "8%" }}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Pagination Section */}
        <div className="d-flex justify-content-end align-items-center mt-4">
          <button
            className="btn btn-outline-secondary me-2"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>

          <span className="mx-3">Page {currentPage} of {totalPages}</span>

          <button
            className="btn btn-outline-secondary"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>

      </div>

    </div>
  );
};

export default DamageReport;