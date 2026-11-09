import React, { useState } from "react";
import api from "../../apiService";
import { FaSearch, FaFileExcel, FaPrint, FaChevronDown, FaChevronRight, FaCodepen } from "react-icons/fa";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const AllPartyLedger = () => {
  const getCurrentDate = () => new Date().toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(getCurrentDate());
  const [toDate, setToDate] = useState(getCurrentDate());
  const [accountGroup, setAccountGroup] = useState("14"); // default Customer
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [reportData, setReportData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState({});


  const groupData = (data) => {
    // Sort globally by AccountCode, Date, OrderNo
    const sortedData = [...data].sort((a, b) => {
      if (a.AccountCode !== b.AccountCode) return a.AccountCode - b.AccountCode;

      const dateA = new Date(a.Date).getTime();
      const dateB = new Date(b.Date).getTime();

      if (dateA !== dateB) return dateA - dateB;
      return a.OrderNo - b.OrderNo;
    });

    const grouped = {};

    sortedData.forEach((item) => {
      if (!grouped[item.AccountCode]) {
        grouped[item.AccountCode] = {
          AccountCode: item.AccountCode,
          AccountName: item.AccountName,
          transactions: [],
          Debit: 0,
          Credit: 0,
          Balance: 0,
        };
      }

      grouped[item.AccountCode].transactions.push(item);
      grouped[item.AccountCode].Debit += item.Debit;
      grouped[item.AccountCode].Credit += item.Credit;
    });

    Object.values(grouped).forEach((acc) => {
      acc.Balance = acc.Debit - acc.Credit;

      // ✅ Fix child sorting by Date + OrderNo
      acc.transactions.sort((a, b) => {
        const dateA = new Date(a.Date).getTime();
        const dateB = new Date(b.Date).getTime();

        if (dateA !== dateB) return dateA - dateB;
        return a.OrderNo - b.OrderNo;
      });

      // ✅ Child balances calculated in sorted order
      let prevBalance = 0;
      acc.transactions = acc.transactions.map((txn) => {
        const childBalance = prevBalance + txn.Debit - txn.Credit;
        prevBalance = childBalance;
        return { ...txn, Balance: childBalance };
      });
    });

    return Object.values(grouped);
  };




  const fetchAllPartyLedger = async () => {
    setIsLoading(true);
    setError("");

    try {
      const CompanyID = sessionStorage.getItem("CompanyID");

      const params = new URLSearchParams({
        FromDate: fromDate,
        ToDate: toDate,
        CompanyID: CompanyID,
        AccountGroup: accountGroup
      });

      const response = await api.get(`/api/allpartyledger?${params.toString()}`);

      if (response.status === 200 && response.data.success) {
        const grouped = groupData(response.data.data[0] || []);
        setReportData(grouped);
      } else {
        setError("Unexpected response from server.");
      }
    } catch (err) {
      console.error("Error fetching AllPartyLedger report:", err);
      setError("An error occurred while fetching the report.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    const today = getCurrentDate();
    setFromDate(today);
    setToDate(today);
    setAccountGroup("14");
    setReportData([]);
    setError("");
    setSearchTerm("");
  };

  const formatAmount = (amount) =>
    amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    });

  // Filter by search
  const filteredData = reportData.filter((item) =>
    item.AccountName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle expand/collapse
  const toggleExpand = (code) => {
    setExpandedRows((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  // Helper to format YYYY-MM-DD -> DD-MM-YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };


  // Export Excel
  // Export Excel - Each AccountCode in separate sheet
  const handleExportToExcel = () => {
    if (filteredData.length === 0) return;

    try {
      const workbook = XLSX.utils.book_new();

      const companyResponse = JSON.parse(sessionStorage.getItem("companyResponse")) || {};
      const { CompanyName = "", Address = "" } = companyResponse;

      filteredData.forEach((item) => {
        const headers = [
          "SI.No",
          "Date",
          "Type",
          "Transaction No",
          "Debit",
          "Credit",
          "Balance",
        ];

        const dataRows = item.transactions.map((txn, idx) => [
          idx + 1,
          new Date(txn.Date).toLocaleDateString(),
          txn.Type,
          txn.TransactionNo,
          txn.Debit,
          txn.Credit,
          txn.Balance,
        ]);

        // ---- Header rows ----
        const excelHeader = [
          [CompanyName],
          [Address.replace(/\r?\n|\r/g, " ")],
          [`Account: ${item.AccountName}`],
          [`From: ${formatDate(fromDate)}  To: ${formatDate(toDate)}`],
          [], // blank row
          headers,
        ];

        const sheetData = [...excelHeader, ...dataRows];
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

        // ----- Merge first 4 header rows across all 7 columns -----
        worksheet["!merges"] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // CompanyName row
          { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Address row
          { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }, // Account row
          { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } }, // Date range row
        ];

        // ----- Apply basic styles -----
        const centerBold = {
          alignment: { horizontal: "center" },
          font: { bold: true, sz: 14 },
        };
        const centerNormal = {
          alignment: { horizontal: "center" },
          font: { bold: false, sz: 11 },
        };

        worksheet["A1"].s = centerBold;   // CompanyName
        worksheet["A2"].s = centerNormal; // Address
        worksheet["A3"].s = centerBold;   // Account
        worksheet["A4"].s = centerNormal; // Date range

        // Column widths
        worksheet["!cols"] = [
          { wch: 6 },
          { wch: 12 },
          { wch: 15 },
          { wch: 20 },
          { wch: 15 },
          { wch: 15 },
          { wch: 18 },
        ];

        // Sheet name
        let safeSheetName = item.AccountName.replace(/[\\/?*[\]:]/g, "");
        if (safeSheetName.length === 0) safeSheetName = "Sheet";
        if (safeSheetName.length > 31) safeSheetName = safeSheetName.substring(0, 31);

        XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
      });

      XLSX.writeFile(workbook, `AllPartyLedger_${fromDate}_to_${toDate}.xlsx`);
    } catch (err) {
      console.error("Excel export failed:", err);
    }
  };



  // Export PDF - Each AccountCode in separate page
  const handleExportToPDF = () => {
    const companyResponse = JSON.parse(sessionStorage.getItem("companyResponse")) || {};
    const { CompanyName = "", Address = "" } = companyResponse;

    const doc = new jsPDF("portrait");

    filteredData.forEach((item, idx) => {
      if (idx !== 0) doc.addPage(); // new page for each account except the first

      // --- HEADER (only on first page of each account) ---
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(CompanyName, doc.internal.pageSize.getWidth() / 2, 15, { align: "center" });

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const singleLineAddress = Address.replace(/\r?\n|\r/g, " ");
      doc.text(singleLineAddress, doc.internal.pageSize.getWidth() / 2, 22, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Account: ${item.AccountName}`, doc.internal.pageSize.getWidth() / 2, 30, { align: "center" });

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(
        `From: ${formatDate(fromDate)}  To: ${formatDate(toDate)}`,
        doc.internal.pageSize.getWidth() / 2,
        38,
        { align: "center" }
      );

      // --- TABLE ---
      const tableColumn = ["SI.No", "Date", "Type", "Transaction No", "Debit", "Credit", "Balance"];
      const tableRows = item.transactions.map((txn, tIdx) => [
        tIdx + 1,
        new Date(txn.Date).toLocaleDateString(),
        txn.Type,
        txn.TransactionNo,
        txn.Debit.toFixed(2),
        txn.Credit.toFixed(2),
        txn.Balance.toFixed(2),
      ]);

      doc.autoTable({
        startY: 48, // leave space for header
        head: [tableColumn],
        body: tableRows,
        theme: "striped",
        styles: { fontSize: 9 },
        didDrawPage: (data) => {
          // --- PAGE FOOTER: Page Number ---
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(9);
          doc.setFont("helvetica", "italic");
          doc.text(
            `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`,
            doc.internal.pageSize.getWidth() - 30,
            doc.internal.pageSize.getHeight() - 10
          );
        },
      });
    });

    doc.save(`AllPartyLedger_${fromDate}_to_${toDate}.pdf`);
  };


  return (
    <div className="container-fluid" style={{ backgroundColor: "white" }}>
      <div className="page-header d-print-none mt-0">
        <h2 className="page-title">AllPartyLedger Report</h2>
      </div>

      <div className="card">
        <div className="card-body">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchAllPartyLedger();
            }}
          >
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
              <div className="col-md-2">
                <label htmlFor="AccountGroup">Account Group</label>
                <select
                  id="AccountGroup"
                  className="form-control"
                  value={accountGroup}
                  onChange={(e) => setAccountGroup(e.target.value)}
                >
                  <option value="14">Customer</option>
                  <option value="27">Supplier</option>
                </select>
              </div>



              <div className="col-md-3 d-flex align-items-end">
                <button type="submit" className="btn btn-primary w-100 me-2">
                  Generate
                </button>
                <button type="button" className="btn btn-secondary w-100" onClick={handleClear}>
                  Clear
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="card-body">
        {error && <div className="text-danger mb-3">{error}</div>}

        <div className="d-flex justify-content-between mb-3">
          <div className="col-lg-3">
            <div className="input-group">
              <span className="input-group-text bg-primary text-white">
                <FaSearch />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by Account Name ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <button className="btn btn" onClick={handleExportToExcel}>
              <FaFileExcel className="me-2" /> Excel
            </button>
            <button className="btn btn" onClick={handleExportToPDF}>
              <FaPrint className="me-2" /> PDF
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <div style={{ maxHeight: "500px", overflowY: "auto" }}>
            {isLoading ? (
              <div className="text-center p-5">Loading report...</div>
            ) : (
              <table className="table table-bordered mb-0">
                <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                  <tr>
                    <th></th>
                    <th>Account Name</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length > 0 ? (
                    filteredData.map((item) => (
                      <React.Fragment key={item.AccountCode}>
                        {/* Parent Row */}
                        <tr style={{ backgroundColor: "#cdd2df" }}>
                          <td
                            style={{ cursor: "pointer" }}
                            onClick={() => toggleExpand(item.AccountCode)}
                          >
                            {expandedRows[item.AccountCode] ? <FaChevronDown /> : <FaChevronRight />}
                          </td>
                          <td>{item.AccountName}</td>
                          <td>{formatAmount(item.Debit)}</td>
                          <td>{formatAmount(item.Credit)}</td>
                          <td>{formatAmount(item.Balance)}</td>
                        </tr>

                        {/* Child Rows */}
                        {expandedRows[item.AccountCode] &&
                          item.transactions.map((txn, tIdx) => (
                            <tr key={tIdx} style={{ backgroundColor: "#c9e1f7ff" }}>
                              <td></td>
                              <td colSpan="1">
                                {new Date(txn.Date).toLocaleDateString()} - {txn.Type} - {txn.TransactionNo}
                              </td>
                              <td>{formatAmount(txn.Debit)}</td>
                              <td>{formatAmount(txn.Credit)}</td>
                              <td>{formatAmount(txn.Balance)}</td>
                            </tr>
                          ))}
                      </React.Fragment>

                    ))
                  ) : (
                    <tr>
                      <td colSpan="5">No data available. Please generate report.</td>
                    </tr>
                  )}
                </tbody>
              </table>

            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllPartyLedger;
