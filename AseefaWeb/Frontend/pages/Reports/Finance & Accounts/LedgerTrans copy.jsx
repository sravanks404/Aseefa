import React, { useState, useEffect, useMemo } from "react";
import api from '../../apiService';
import DataTable from "react-data-table-component";
import numberToWords from "number-to-words"; // Ensure this library is installed

import Select from 'react-select';
import { FaSearch, FaFileExcel, FaPrint } from "react-icons/fa";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";


const LedgerTrans = () => {

  const getPreviousDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];  // Format to yyyy-mm-dd
  };

  const getCurrentDate = () => new Date().toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState(getPreviousDate(7));
  const [toDate, setToDate] = useState(getCurrentDate());
  const [AccountCode, setAccountCode] = useState([]); // ✅ not undefined
  const [selectedDate, setSelectedDate] = useState();
  const [result, setResult] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [customer, setCustomer] = useState("");
  const [gNameFilter, setGNameFilter] = useState("");
  const [distinctGName, setDistinctGName] = useState([]);
  const [summary, setSummary] = useState({ LedgerCount: 0, totalDebit: 0, totalCredit: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [allResults, setAllResults] = useState([]); // Store all fetched data
  const [typeFilter, setTypeFilter] = useState("");


  const fetchLedgerTrans = async () => {
    setIsLoading(true);
    setError("");

    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      const response = await api.get("/api/LedgerTrans", {
        params: {
          FromDate: fromDate,
          ToDate: toDate,
          AccountCode: gNameFilter || 0,
          CompanyID
        }
      });

      const data = response?.data || {};
      const nestedDetails = data.details || [];

      // ✅ Flatten nested array
      const flatDetails = nestedDetails.flat();

      setAllResults(flatDetails); // Now this is a clean flat array
    } catch (err) {
      console.error("Error fetching ledger data:", err);
      setError("Failed to fetch ledger data. Please try again.");
      setResult([]);
    } finally {
      setIsLoading(false);
    }
  };


  const fetchHname = async () => {
    try {
      const response = await api.get("/api/Achead", {

      });
      const data = response?.data || [];

      setAccountCode(data);

    } catch (err) {
      console.error("Error fetching ledger data:", err);
      setError("Failed to fetch ledger data. Please try again.");
      setResult([]);
    } finally {
      setIsLoading(false);
    }

  }

  const options = AccountCode.map((name) => ({
    value: name.HSlNo,
    label: name.HName
  }));
  // Fetch data once on mount
  useEffect(() => {
    fetchHname();
  }, []);

  const handleClear = () => {
    setGNameFilter(null); // ✅ this will now clear the field
    setError("");
    setSearchQuery("");
    setAllResults([]);
    setFromDate(getPreviousDate(7));
    setToDate(getCurrentDate());
    setTypeFilter("");
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    if (!gNameFilter) {
      setAllResults([]);
      setError("Please select a Group Name.");
      return;
    }
    fetchLedgerTrans();
  };

  useEffect(() => {
    if (gNameFilter) {
      setError("");
      fetchLedgerTrans();
    } else {
      setAllResults([]);
      setError("Please select a Group Name.");
    }
  }, [gNameFilter, fromDate, toDate]);



  /** ✅ Export to Excel */
  const exportToExcel = () => {
    if (!allResults.length) {
      alert("No data to export.");
      return;
    }

    const totalDebit = allResults.reduce((sum, row) => sum + (row.Debit || 0), 0);
    const totalCredit = allResults.reduce((sum, row) => sum + (row.Credit || 0), 0);
    const totalBalance = allResults.reduce((sum, row) => sum + (row.Balance || 0), 0);

    // 1️⃣ Header Rows
    const headerRows = [
      ["Ledger Report"],
      [`Ledger Name: ${gNameFilter || "N/A"}`],
      [`From: ${fromDate || "N/A"}    To: ${toDate || "N/A"}    Type: ${typeFilter || "All"}`],
      [],
      ["SL.No", "Date", "Type", "Transaction No", "Debit", "Credit", "Balance", "Account Head", "Other Narration"]
    ];

    // 2️⃣ Data Rows (Keep numeric for Excel)
    const dataRows = allResults.map((row, index) => [
      index + 1,
      row.Date ? new Date(row.Date).toLocaleDateString() : "N/A",
      row.Type || "",
      row.TransactionNo || "",
      row.Debit ?? 0,
      row.Credit ?? 0,
      row.Balance ?? 0,
      row.AccountHead || "",
      row.OtherNarration || ""
    ]);

    // 3️⃣ Total Row (raw numbers, not formatted strings)
    dataRows.push([
      "TOTAL", "", "", "",
      totalDebit,
      totalCredit,
      totalBalance,
      "", ""
    ]);

    const worksheetData = [...headerRows, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // 4️⃣ Merge "Ledger Report" title row across columns
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } } // A1 to I1
    ];

    // 5️⃣ Format amount columns (Debit, Credit, Balance → columns 4,5,6 i.e. index 4–6)
    const startRow = headerRows.length; // Where data rows begin
    for (let i = 0; i < dataRows.length; i++) {
      for (let col of [4, 5, 6]) {
        const cellRef = XLSX.utils.encode_cell({ r: startRow + i, c: col });
        if (ws[cellRef] && typeof ws[cellRef].v === "number") {
          ws[cellRef].z = "0.00";
        }
      }
    }

    // 6️⃣ Optional: Column widths for better readability
    ws["!cols"] = [
      { wch: 8 },  // SL.No
      { wch: 12 }, // Date
      { wch: 12 }, // Type
      { wch: 18 }, // Transaction No
      { wch: 12 }, // Debit
      { wch: 12 }, // Credit
      { wch: 12 }, // Balance
      { wch: 20 }, // Account Head
      { wch: 40 }  // Other Narration
    ];

    // 7️⃣ Create and export
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LedgerTrans");
    XLSX.writeFile(wb, "LedgerTrans.xlsx");
  };





  /** ✅ Export to PDF */
  const exportToPDF = () => {
    const ledgerData = allResults;

    if (!ledgerData.length) {
      alert("No data to export.");
      return;
    }

    const totalDebit = ledgerData.reduce((sum, row) => sum + (row.Debit || 0), 0);
    const totalCredit = ledgerData.reduce((sum, row) => sum + (row.Credit || 0), 0);
    const totalBalance = ledgerData.reduce((sum, row) => sum + (row.Balance || 0), 0);
    const doc = new jsPDF();
    doc.text("Ledger Report", 14, 10);

    const tableRows = ledgerData.map((row, index) => [
      index + 1,
      row.Date ? new Date(row.Date).toLocaleDateString('en-GB') : "N/A",
      row.Type || "",
      row.TransactionNo || "",
      (row.Debit ?? 0).toFixed(2),
      (row.Credit ?? 0).toFixed(2),
      (row.Balance ?? 0).toFixed(2),
      row.AccountHead || "",
      row.OtherNarration || ""
    ]);

    // Add total row
    tableRows.push([
      { content: "TOTAL", colSpan: 4, styles: { halign: "center", fontStyle: "bold" } },
      { content: totalDebit.toFixed(2), styles: { fontStyle: "bold" } },
      { content: totalCredit.toFixed(2), styles: { fontStyle: "bold" } },
      { content: totalBalance.toFixed(2), styles: { fontStyle: "bold" } }, // Balance
      { content: "", styles: { fontStyle: "bold" } }, // Account Head
      { content: "", styles: { fontStyle: "bold" } }  // Narration
    ]);

    doc.autoTable({
      head: [["SL.No", "Date", "Type", "Transaction No", "Debit", "Credit", "Balance", "Account Head", "Other Narration"]],
      body: tableRows,
      startY: 20,
      theme: "grid",
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 20 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
        7: { cellWidth: 30 },
        8: { cellWidth: 40 }
      },
      margin: { top: 20 },
    });

    doc.save("LedgerTrans.pdf");
  };



  // Filter results based on search query

  const totalDebit = () => {
    return allResults
      .filter(row => row.Type !== "Total") // ❌ skip "Total" row
      .reduce((sum, row) => sum + (parseFloat(row.Debit) || 0), 0)
      .toFixed(2);
  };

  const totalCredit = () => {
    return allResults
      .filter(row => row.Type !== "Total") // ❌ skip "Total" row
      .reduce((sum, row) => sum + (parseFloat(row.Credit) || 0), 0)
      .toFixed(2);
  };

  const totalBalance = () => {
    const debit = allResults
      .filter(row => row.Type !== "Total")
      .reduce((sum, row) => sum + (parseFloat(row.Debit) || 0), 0);

    const credit = allResults
      .filter(row => row.Type !== "Total")
      .reduce((sum, row) => sum + (parseFloat(row.Credit) || 0), 0);

    return (debit - credit).toFixed(2);
  };


  const paginationOptions = {
    rowsPerPageText: 'Rows per page:',
    rangeSeparatorText: 'of',
    selectAllRowsItem: false,
    rowsPerPageOptions: [50, 100, 250],
  };

  const uniqueTypes = useMemo(() => {
    const types = allResults.map(row => row.Type).filter(Boolean); // filter out null/undefined
    return [...new Set(types)];
  }, [allResults]);


  const filteredResults = allResults.filter(row => {
    const matchesSearch =
      row.AccountHead?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.Type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.Date?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter ? row.Type === typeFilter : true;

    return matchesSearch && matchesType;
  });

  const totalFilteredDebit = () =>
    filteredResults.reduce((sum, r) => sum + (r.Debit ?? 0), 0).toFixed(2);


  return (

    <div className="container-fluid" style={{ backgroundColor: "white" }}>
      <div className="page-header d-print-none mt-0">
        <h2 className="page-title">Trans Ledger Report </h2>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-2">
                <label htmlFor="FromDate">From Date</label>
                <input
                  type="date"
                  id="FromDate"
                  className="form-control"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-2">
                <label htmlFor="ToDate">To Date</label>
                <input
                  type="date"
                  id="ToDate"
                  className="form-control"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="GName">Ledger Head</label>
                <Select
                  options={options}
                  isLoading={isLoading}
                  placeholder="Select Group"
                  onChange={(selected) => setGNameFilter(selected?.value)}
                  value={options.find((opt) => opt.value === gNameFilter) || null}
                  isClearable
                  className="react-select-container"
                  classNamePrefix="react-select"
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    menu: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                />
              </div>
              <div className="col-md-2">
                <label htmlFor="Type">Type</label>
                <select
                  id="Type"
                  className="form-control"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">All Types</option>
                  {uniqueTypes.map((type, index) => (
                    <option key={index} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear button in same row */}
              <div className="col-md-1 d-flex align-items-end">
                <button
                  type="button"
                  className="btn btn-secondary w-100"
                  onClick={handleClear}
                >
                  Clear
                </button>
              </div>
            </div>
          </form>

        </div>
      </div>

      <div className="card mt-4">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-3">
            {/* Search Bar */}
            <div className="col-lg-3">
              <div className="input-group">
                <span className="input-group-text bg-primary text-white">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by AccountHead / Type / Date ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Export and Print Buttons */}
            <div className="d-flex gap-2">
              <button className="btn btn" onClick={exportToExcel}>
                <FaFileExcel />
                <span className="d-none d-md-inline ms-1">Excel</span>
              </button>
              <button className="btn btn" onClick={exportToPDF}>
                <FaPrint />
                <span className="d-none d-md-inline ms-1">Print</span>
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="d-flex flex-column align-items-center justify-content-center vh-50">
              <div className="text-center">
                <div className="mb-3">
                  <a href="." className="navbar-brand navbar-brand-autodark">SuitApps</a>
                </div>
                <div className="text-secondary mb-3">Preparing Report</div>
                <div className="progress progress-sm">
                  <div className="progress-bar progress-bar-indeterminate"></div>
                </div>
              </div>
            </div>
          ) : (

            <div className="container-fluid px-2">
              <div className="card">
                <div className="card-body p-2">
                  <div
                    className="table-responsive"
                    style={{
                      maxHeight: "60vh", // Responsive vertical scroll height
                      overflowY: "auto",
                    }}
                  >
                    <table className="table table-striped table-hover table-bordered mb-0">
                      <thead className="thead-dark sticky-top bg-white" style={{ top: 0, zIndex: 1 }}>
                        <tr>
                          <th style={{ width: "7%" }}>SL.No</th>
                          <th style={{ width: "10%" }}>Date</th>
                          <th style={{ width: "10%" }}>Type</th>
                          <th style={{ width: "15%" }}>Transaction No</th>
                          <th style={{ width: "10%" }}>Debit</th>
                          <th style={{ width: "10%" }}>Credit</th>
                          <th style={{ width: "10%" }}>Balance</th>
                          <th style={{ width: "10%" }}>Account Head</th>
                          <th style={{ width: "10%" }}>Narration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredResults.length > 0 ? (
                          filteredResults.map((row, index) => (
                            <tr key={index} onClick={() => handleRowClick(row.BillID)} style={{ cursor: "pointer" }}>
                              <td>{index + 1}</td>
                              <td>{new Date(row.Date).toLocaleDateString('en-GB')}</td>
                              <td>{row.Type}</td>
                              <td>{row.TransactionNo}</td>
                              <td>{(row.Debit ?? 0).toFixed(2)}</td>
                              <td>{(row.Credit ?? 0).toFixed(2)}</td>
                              <td>{(row.Balance ?? 0).toFixed(2)}</td>
                              <td>{row.AccountHead}</td>
                              <td>{row.OtherNarration}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="9" className="text-center text-muted">No data available</td>
                          </tr>
                        )}
                      </tbody>

                      {allResults.length > 0 && (
                        <tfoot className="bg-light sticky-bottom">
                          <tr>
                            <td colSpan="4"><strong>Totals</strong></td>
                            <td><strong>{totalDebit()}</strong></td>
                            <td><strong>{totalCredit()}</strong></td>
                            <td><strong>{totalBalance()}</strong></td>
                            <td colSpan="2"></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

  );
};

export default LedgerTrans;