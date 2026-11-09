import React, { useState, useEffect } from "react";
import api from "../../apiService";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

const PandLReport = () => {
  const getCurrentDate = () => new Date().toISOString().split("T")[0];
  const getPastDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];
  };

  const [toDate, setToDate] = useState(getCurrentDate());
  const [fromDate, setFromDate] = useState(getPastDate(30));
  const [allResults, setAllResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedGroups, setExpandedGroups] = useState({});
  const [searchText, setSearchText] = useState("");


  const fetchPandL = async () => {
    setIsLoading(true);
    setError("");
    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      const response = await api.get("/api/getplreport", {
        params: { CompanyID, FromDate: fromDate, ToDate: toDate },
      });

      const data = Array.isArray(response?.data?.data)
        ? response.data.data.flat()
        : [];
      setAllResults(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch P&L data. Please try again.");
      setAllResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPandL();
  }, []);

  const filteredResults = allResults.filter((i) =>
    i?.AccountName?.toLowerCase().includes(searchText.toLowerCase())
  );

  const groupByType = (data) =>
    data.reduce((groups, item) => {
      if (!groups[item.Type]) groups[item.Type] = [];
      groups[item.Type].push(item);
      return groups;
    }, {});



  const incomeData = filteredResults.filter((i) => i.Category === "INCOME");
  const expenseData = filteredResults.filter((i) => i.Category === "EXPENSE");


  const groupedIncome = groupByType(incomeData);
  const groupedExpense = groupByType(expenseData);

  const totalIncome = incomeData.reduce((sum, i) => sum + Number(i.Amount || 0), 0);
  const totalExpense = expenseData.reduce((sum, i) => sum + Number(i.Amount || 0), 0);

  const toggleGroup = (side, type) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [`${side}-${type}`]: !prev[`${side}-${type}`],
    }));
  };

  /** ================== EXPORT TO EXCEL ================== **/
  const exportToExcel = () => {
    const exportData = [];
    exportData.push({
      Expense: "PROFIT & LOSS STATEMENT",
      ExpenseAmount: "",
      Income: "",
      IncomeAmount: ""
    });
    exportData.push({});

    const convertToSideFormat = (grouped) => {
      let rows = [];
      Object.entries(grouped).forEach(([type, items]) => {
        rows.push({ Expense: type, ExpenseAmount: "", Income: "", IncomeAmount: "" });

        items.forEach(i => {
          rows.push({
            Expense: i.Category === "EXPENSE" ? i.AccountName : "",
            ExpenseAmount: i.Category === "EXPENSE" ? Number(i.Amount || 0) : "",
            Income: i.Category === "INCOME" ? i.AccountName : "",
            IncomeAmount: i.Category === "INCOME" ? Number(i.Amount || 0) : ""
          });
        });
        rows.push({});
      });
      return rows;
    };

    let finalRows = [];
    const expenseRows = convertToSideFormat(groupedExpense);
    const incomeRows = convertToSideFormat(groupedIncome);
    const maxLen = Math.max(expenseRows.length, incomeRows.length);

    for (let i = 0; i < maxLen; i++) {
      finalRows.push({
        Expense: expenseRows[i]?.Expense || "",
        ExpenseAmount: expenseRows[i]?.ExpenseAmount || "",
        Income: incomeRows[i]?.Income || "",
        IncomeAmount: incomeRows[i]?.IncomeAmount || "",
      });
    }

    exportData.push(...finalRows);
    exportData.push({});
    exportData.push({
      Expense: "Total Expense",
      ExpenseAmount: totalExpense,
      Income: "Total Income",
      IncomeAmount: totalIncome
    });

    exportData.push({
      Expense: "",
      ExpenseAmount: "",
      Income:
        totalIncome > totalExpense ? "Net Profit" :
          totalExpense > totalIncome ? "Net Loss" : "Break Even",
      IncomeAmount: Math.abs(totalIncome - totalExpense)
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 40 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Profit & Loss");
    XLSX.writeFile(wb, `ProfitLoss_${fromDate}_to_${toDate}.xlsx`);
  };


  /** ================== EXPORT TO PDF ================== **/
  const exportToPDF = () => {
    const companyData = JSON.parse(sessionStorage.getItem("companyResponse") || "{}");
    const companyName = companyData.CompanyName || "Company Name";
    const address = companyData.Address || "";

    const doc = new jsPDF("p", "mm", "a4");
    doc.setFont("courier", "normal");

    doc.setFontSize(14);
    doc.text(companyName, 105, 15, { align: "center" });

    doc.setFontSize(10);
    const addressLines = doc.splitTextToSize(address, 160);
    let currentY = 21;
    addressLines.forEach(line => { doc.text(line, 105, currentY, { align: "center" }); currentY += 5; });

    doc.setFontSize(12);
    doc.text("Profit & Loss Statement", 105, currentY + 4, { align: "center" });

    doc.setFontSize(10);
    doc.text(`From: ${fromDate} To: ${toDate}`, 105, currentY + 10, { align: "center" });
    let finalY = currentY + 17;

    const formatAmount = num => `Rs. ${Number(num || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

    const addTable = (title, grouped) => {
      doc.setFontSize(12);
      doc.text(title, 14, finalY);
      finalY += 4;

      Object.entries(grouped).forEach(([type, items]) => {
        const typeTotal = items.reduce((sum, i) => sum + Number(i.Amount || 0), 0);

        const rows = items.map(i => [i.AccountName || "", formatAmount(i.Amount)]);
        rows.push(["", ""]);
        rows.push([{ content: `Total ${type}`, styles: { fillColor: [240, 240, 200], fontStyle: "bold" } },
        { content: formatAmount(typeTotal), styles: { fillColor: [240, 240, 200], fontStyle: "bold", halign: "right" } }]);

        doc.autoTable({
          startY: finalY,
          head: [[{ content: type, styles: { halign: "left" } }, { content: "Amount", styles: { halign: "right" } }]],
          body: rows,
          theme: "striped",
          styles: { fontSize: 9, font: "courier" },
          headStyles: { fillColor: [220, 220, 220], textColor: 20 },
          columnStyles: { 0: { halign: "left" }, 1: { halign: "right" } }
        });

        finalY = doc.lastAutoTable.finalY + 5;
      });
    };

    addTable("INCOME", groupedIncome);
    addTable("EXPENSE", groupedExpense);

    finalY += 5;
    doc.setFontSize(12);
    doc.text("Summary", 14, finalY);
    finalY += 4;

    const summaryRows = [
      [{ content: "Total Income", styles: { fillColor: [230, 255, 230] } }, { content: formatAmount(totalIncome), styles: { fillColor: [230, 255, 230], halign: "right" } }],
      [{ content: "Total Expense", styles: { fillColor: [255, 230, 230] } }, { content: formatAmount(totalExpense), styles: { fillColor: [255, 230, 230], halign: "right" } }],
      [{
        content: totalIncome > totalExpense ? "Net Profit" :
          totalExpense > totalIncome ? "Net Loss" : "Break Even",
        styles: {
          fillColor: totalIncome > totalExpense ? [210, 255, 210] :
            totalExpense > totalIncome ? [255, 210, 210] :
              [230, 230, 230],
          fontStyle: "bold"
        }
      },
      {
        content: formatAmount(Math.abs(totalIncome - totalExpense)),
        styles: {
          fillColor: totalIncome > totalExpense ? [210, 255, 210] :
            totalExpense > totalIncome ? [255, 210, 210] :
              [230, 230, 230],
          halign: "right",
          fontStyle: "bold"
        }
      }
      ]
    ];

    doc.autoTable({
      startY: finalY,
      body: summaryRows,
      theme: "grid",
      styles: { fontSize: 10, font: "courier" },
      head: [["", "Amount"]],
      headStyles: { fillColor: [240, 240, 240] },
      columnStyles: { 0: { halign: "left" }, 1: { halign: "right" } }
    });

    doc.save(`ProfitLoss_${fromDate}_to_${toDate}.pdf`);
  };





  /* ==========================================================
       SHOW LOADER BEFORE DATA WHEN FETCHING
     ========================================================== */
  if (isLoading) {
    return (
      <div className="container-fluid py-3 bg-light">

        {/* Header stays visible */}
        <div className="card shadow-sm mb-4 border-0">
          <div className="card-header bg-white border-0 d-flex flex-column flex-md-row justify-content-between align-items-md-center">
            <h5 className="text-primary mb-2 mb-md-0">
              <i className="bi bi-graph-up me-2"></i>Profit & Loss Statement
            </h5>

            <div className="d-flex flex-wrap align-items-center gap-3">
              <div>
                <label className="form-label small text-muted mb-1">From Date</label>
                <input type="date" className="form-control" value={fromDate} disabled />
              </div>

              <div>
                <label className="form-label small text-muted mb-1">To Date</label>
                <input type="date" className="form-control" value={toDate} disabled />
              </div>

              <div className="d-flex flex-wrap gap-2 mt-3">
                <button className="btn btn-primary" disabled>
                  <i className="bi bi-arrow-repeat me-2"></i>Generating...
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ⬇ Loader appears below header ⬇ */}
        <div className="d-flex flex-column align-items-center justify-content-center w-100"
          style={{ height: "300px" }}>
          <div className="text-center">
            <div className="navbar-brand navbar-brand-autodark">SuitApps</div>
            <div className="text-secondary mb-3">Preparing Report</div>
            <div className="progress progress-sm">
              <div className="progress-bar progress-bar-indeterminate"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  /* ==========================================================
       MAIN UI (Shows only when NOT loading)
     ========================================================== */
  return (
    <div className="container-fluid py-3 bg-light">
      {/* ================= HEADER ================= */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-header bg-white border-0 d-flex flex-column flex-md-row justify-content-between align-items-md-center">

          <h5 className="text-primary mb-2 mb-md-0">
            <i className="bi bi-graph-up me-2"></i>Profit & Loss Statement
          </h5>

          <div className="d-flex flex-wrap align-items-center gap-3">

            {/* 🔍 SEARCH BOX ADDED HERE */}
            <div>
              <label className="form-label small text-muted mb-1">Search</label>
              <input
                type="text"
                placeholder="Search Account Name"
                className="form-control"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label small text-muted mb-1">From Date</label>
              <input
                type="date"
                className="form-control"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label small text-muted mb-1">To Date</label>
              <input
                type="date"
                className="form-control"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <div className="d-flex flex-wrap gap-2 mt-3">
              <button className="btn btn-primary" onClick={fetchPandL}>
                <i className="bi bi-arrow-repeat me-2"></i>Generate
              </button>

              <button className="btn btn- text-black" onClick={exportToExcel}>
                <i className="bi bi-file-earmark-excel me-2"></i>Excel
              </button>

              <button className="btn btn- text-black" onClick={exportToPDF}>
                <i className="bi bi-file-earmark-pdf me-2"></i>PDF
              </button>
            </div>

          </div>
        </div>
      </div>


      {/* ================= SUMMARY + STATUS (INLINE) ================= */}
      <div className="d-flex flex-column flex-md-row gap-3 mb-4">

        {/* Total Expenses */}
        <div className="card border-danger border-2 flex-fill">
          <div className="card-body">
            <h6 className="card-title text-danger">
              <i className="bi bi-arrow-down-circle me-2"></i>Total Expenses
            </h6>
            <h3 className="text-danger">₹{totalExpense.toLocaleString()}</h3>
          </div>
        </div>

        {/* Total Income */}
        <div className="card border-success border-2 flex-fill">
          <div className="card-body">
            <h6 className="card-title text-success">
              <i className="bi bi-arrow-up-circle me-2"></i>Total Income
            </h6>
            <h3 className="text-success">₹{totalIncome.toLocaleString()}</h3>
          </div>
        </div>

        {/* Net Status */}
        <div
          className={`alert flex-fill d-flex align-items-center justify-content-center m-0 
      ${totalIncome > totalExpense ? "alert-success" :
              totalExpense > totalIncome ? "alert-danger" : "alert-info"}`}
        >
          <strong>
            {totalIncome > totalExpense
              ? `Net Profit: ₹${(totalIncome - totalExpense).toLocaleString()}`
              : totalExpense > totalIncome
                ? `Net Loss: ₹${(totalExpense - totalIncome).toLocaleString()}`
                : "Break Even: No Profit or Loss"}
          </strong>
        </div>
      </div>


      {/* ================= DATA TABLES ================= */}
      <div className="row">

        {/* EXPENSE TABLE */}
        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white border-0">
              <h6 className="text-danger mb-0">
                <i className="bi bi-arrow-down-circle me-2"></i>Expenses Breakdown
              </h6>
            </div>

            <div className="card-body px-0 py-2">
              <table className="table table-sm table-borderless align-middle">
                <tbody>
                  {Object.entries(groupedExpense).map(([type, items], idx) => (
                    <React.Fragment key={`exp-${idx}`}>
                      <tr className="hover-highlight" style={{ cursor: "pointer" }}
                        onClick={() => toggleGroup("exp", type)}>
                        <td className="ps-3 fw-medium">
                          <span className="me-2">
                            {expandedGroups[`exp-${type}`] ? "▼" : "▶"}
                          </span>{type}
                        </td>
                        <td className="text-end pe-3 fw-medium">
                          ₹{items.reduce((s, i) => s + Number(i.Amount || 0), 0).toLocaleString()}
                        </td>
                      </tr>

                      {expandedGroups[`exp-${type}`] && items.map((item, i) => (
                        <tr key={`exp-item-${idx}-${i}`} className="small text-muted">
                          <td className="ps-5">
                            <i className="bi bi-arrow-right-short me-1"></i>{item.AccountName}
                          </td>
                          <td className="text-end pe-3">
                            ₹{Number(item.Amount || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* INCOME TABLE */}
        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white border-0">
              <h6 className="text-success mb-0">
                <i className="bi bi-arrow-up-circle me-2"></i>Income Breakdown
              </h6>
            </div>

            <div className="card-body px-0 py-2">
              <table className="table table-sm table-borderless align-middle">
                <tbody>
                  {Object.entries(groupedIncome).map(([type, items], idx) => (
                    <React.Fragment key={`inc-${idx}`}>
                      <tr className="hover-highlight" style={{ cursor: "pointer" }}
                        onClick={() => toggleGroup("inc", type)}>
                        <td className="ps-3 fw-medium">
                          <span className="me-2">
                            {expandedGroups[`inc-${type}`] ? "▼" : "▶"}
                          </span>{type}
                        </td>
                        <td className="text-end pe-3 fw-medium">
                          ₹{items.reduce((s, i) => s + Number(i.Amount || 0), 0).toLocaleString()}
                        </td>
                      </tr>

                      {expandedGroups[`inc-${type}`] && items.map((item, i) => (
                        <tr key={`inc-item-${idx}-${i}`} className="small text-muted">
                          <td className="ps-5">
                            <i className="bi bi-arrow-right-short me-1"></i>{item.AccountName}
                          </td>
                          <td className="text-end pe-3">
                            ₹{Number(item.Amount || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PandLReport;
