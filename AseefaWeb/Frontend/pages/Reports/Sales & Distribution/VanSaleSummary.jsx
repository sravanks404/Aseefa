import React, { useState, useEffect, useCallback } from "react";
import Select from "react-select";
import api from '../../apiService';
import * as XLSX from "xlsx";
import { FaSearch, FaFileExcel, FaPrint } from "react-icons/fa";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const VanSaleSummary = () => {
  const getCurrentDate = () => new Date().toISOString().split("T")[0];
  const getPreviousDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];
  };

  const CompanyID = parseInt(sessionStorage.getItem("CompanyID"), 10);

  const [fromDate, setFromDate] = useState(getPreviousDate(7));
  const [toDate, setToDate] = useState(getCurrentDate());
  const [branchID, setBranchID] = useState(null);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserID, setSelectedUserID] = useState(null);
  const [summaryData, setSummaryData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const dualTileConfig = [
    { countKey: "CountB2B", amountKey: "SumB2BSale", label: "B2B", color: "bg-info" },
    { countKey: "CountB2C", amountKey: "SumB2CSale", label: "B2C", color: "bg-info" },
    { countKey: "CountCashBill", amountKey: "CashBill", label: "Cash Bill", color: "bg-info" },
    { countKey: "CountCreditBill", amountKey: "CreditBill", label: "Credit Bill", color: "bg-info" },
    { countKey: "CountCashReceipt", amountKey: "CashReceipt", label: "Cash Receipt", color: "bg-success" },
    { countKey: "CountBankReceipt", amountKey: "BankReceipt", label: "Bank Receipt", color: "bg-success" },
    { countKey: "TotalReceiptCount", amountKey: "TotalReceiptAmount", label: "Total Receipt", color: "bg-primary" },
    { countKey: "TotalBillCount", amountKey: "TotalBillAmount", label: "Total Bill", color: "bg-primary" },
  ];

  const singleTileConfig = [
    {
      isGroup: true,
      keys: [
        { key: "TaxAmt", label: "Tax Amount", color: "bg-primary" },
        { key: "NetAmt", label: "Net Amount", color: "bg-primary" },
      ],
    },
    { key: "ExpenseAmt", label: "Expense Amount", color: "bg-danger" },
    { key: "CashInHand", label: "Cash In Hand", color: "bg-success" },
  ];


  const fetchBranches = useCallback(async () => {
    try {
      const response = await api.get(`/api/getbranch?CompanyID=${CompanyID}`);
      setBranches(response.data || []);
    } catch (err) {
      console.error("Error fetching branches:", err);
      setBranches([]);
    }
  }, [CompanyID]);

  const fetchDropdownData = useCallback(async () => {
    try {
      const usersRes = await api.get(`/api/GetUsers?CompanyID=${CompanyID}`);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
      setError("Failed to load dropdown user.");
    }
  }, [CompanyID]);

  const fetchVanSaleSummary = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const activeUserId = sessionStorage.getItem("activeUserId");

      const params = {
        CompanyID,
        FromDate: fromDate,
        ToDate: toDate,
        activeUserId, // shorthand for activeUserId: activeUserId
      };

      if (selectedUserID?.value) {
        params.UserID = selectedUserID.value;
      }

      if (branchID?.value) {
        params.BranchID = branchID.value;
      }

      const response = await api.get("/api/vanSaleSummary", { params });
      setSummaryData(response.data[0] || {});
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load summary data.");
      setSummaryData({});
    } finally {
      setIsLoading(false);
    }
  }, [CompanyID, fromDate, toDate, selectedUserID, branchID]);


  useEffect(() => {
    fetchBranches();
    fetchDropdownData();
    fetchVanSaleSummary();
  }, [fetchBranches, fetchDropdownData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchVanSaleSummary();
  };

  const handleClear = () => {
    setFromDate(getPreviousDate(7));
    setToDate(getCurrentDate());
    setSelectedUserID(null);
    setBranchID(null);
    setSummaryData({});
    setError("");
  };

  const exportToExcel = () => {
    const metaData = [
      ["From Date", fromDate],
      ["To Date", toDate],
      ["User", selectedUserID?.label || "All Users"],
      ["Branch", branchID?.label || "All Branches"],
    ];

    const summaryRows = Object.entries(summaryData || {}).map(([key, value]) => [key, value ?? 0]);

    const data = [
      ["Metric", "Value"],
      ...summaryRows
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([...metaData, [], ...data]); // `[]` adds a blank row between meta and summary
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "VanSale Summary");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `VanSale_Summary_${fromDate}_to_${toDate}.xlsx`);
  };


  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("VanSale Summary Report", 14, 15);

    const filterData = [
      ["From Date", fromDate],
      ["To Date", toDate],
      ["User", selectedUserID?.label || "All Users"],
      ["Branch", branchID?.label || "All Branches"]
    ];

    autoTable(doc, {
      startY: 25,
      head: [["Filter", "Value"]],
      body: filterData,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185] }
    });

    const summaryBody = [
      ["B2B", summaryData.CountB2B ?? 0, summaryData.SumB2BSale ?? 0],
      ["B2C", summaryData.CountB2C ?? 0, summaryData.SumB2CSale ?? 0],
      ["Cash Bill", summaryData.CountCashBill ?? 0, summaryData.CashBill ?? 0],
      ["Credit Bill", summaryData.CountCreditBill ?? 0, summaryData.CreditBill ?? 0],
      ["Total Bill", summaryData.TotalBillCount ?? 0, summaryData.TotalBillAmount ?? 0],
      ["Cash Receipt", summaryData.CountCashReceipt ?? 0, summaryData.CashReceipt ?? 0],
      ["Bank Receipt", summaryData.CountBankReceipt ?? 0, summaryData.BankReceipt ?? 0],
      ["Total Receipt", summaryData.TotalReceiptCount ?? 0, summaryData.TotalReceiptAmount ?? 0],
      ["Expense Amount", "-", summaryData.ExpenseAmt ?? 0],
      ["Cash In Hand", "-", summaryData.CashInHand ?? 0]
    ];

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Label", "Count", "Amount"]],
      body: summaryBody,
      theme: "striped",
      headStyles: { fillColor: [52, 152, 219] },
    });

    doc.save(`VanSale_Summary_${fromDate}_to_${toDate}.pdf`);
  };

  const userOptions = [
    { value: null, label: "All Users" },
    ...users.map((u) => ({
      value: u.UserID,
      label: u.USERNAME,
    })),
  ];

  const branchOptions = [
    { value: null, label: "All Branches" },
    ...branches.map((b) => ({
      value: b.BranchId,
      label: b.BranchName,
    })),
  ];

  const formatValue = (val) =>
    typeof val === "number"
      ? val.toLocaleString("en-IN", { maximumFractionDigits: 2 })
      : "0";

  return (
    <div className="container mt-4">
      <div className="bg-white p-4 rounded shadow-sm">
        <h4 className="text-primary mb-3">VanSale Summary</h4>

        <form className="row g-3 mb-3" onSubmit={handleSubmit}>
          <div className="col-md-2">
            <label className="form-label">From Date</label>
            <input
              type="date"
              className="form-control"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              required
            />
          </div>

          <div className="col-md-2">
            <label className="form-label">To Date</label>
            <input
              type="date"
              className="form-control"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              required
            />
          </div>

          <div className="col-md-3">
            <label className="form-label">Branch</label>
            <Select
              options={branchOptions}
              value={branchOptions.find((opt) => opt.value === branchID?.value) || branchOptions[0]}
              onChange={(selected) => setBranchID(selected?.value ? selected : null)}
              isClearable
              placeholder="All Branches"
            />
          </div>

          <div className="col-md-3">
            <label className="form-label">User</label>
            <Select
              options={userOptions}
              value={userOptions.find((opt) => opt.value === selectedUserID?.value) || userOptions[0]}
              onChange={(selected) => setSelectedUserID(selected?.value ? selected : null)}
              isClearable
              placeholder="All Users"
            />
          </div>



          <div className="col-md-2 d-flex align-items-end justify-content-end gap-1">
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? "Loading..." : "Generate"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleClear}>
              Clear
            </button>

          </div>
        </form>

        {error && <div className="alert alert-danger">{error}</div>}

        {/* Summary Tiles */}
        <div className="card p-3 mt-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="text-secondary mb-0">Summary Report</h5>

            <div className="btn-group">
              <div className="d-flex gap-2">
                <button className="btn btn-" onClick={exportToExcel}>
                  <FaFileExcel /> Excel
                </button>
                <button className="btn btn-" onClick={exportToPDF}>
                  <FaPrint /> PDF
                </button>
              </div>
            </div>
          </div>

          <div className="row g-3">
            {dualTileConfig.map(({ countKey, amountKey, label, color }) => {
              const countVal = summaryData?.[countKey] ?? 0;
              const amountVal = summaryData?.[amountKey] ?? 0;
              return (
                <div key={label} className="col-6 col-md-4 col-lg-3">
                  <div className={`card h-100 text-white border-0 shadow-sm ${color}`}>
                    <div className="card-body text-center">
                      <h6 className="mb-1">{label}</h6>
                      <div className="d-flex justify-content-between">
                        <small>Count</small>
                        <small>Amount</small>
                      </div>
                      <div className="d-flex justify-content-between fw-bold">
                        <span>{formatValue(countVal)}</span>
                        <span>{formatValue(amountVal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="w-100 mt-2 border-top pt-3" />

            {singleTileConfig.map((item, index) => {
              if (item.isGroup) {
                return (
                  <div key={`group-${index}`} className="col-12 col-md-4 mb-3">
                    <div className="card h-100 text-white border-0 shadow-sm">
                      <div className="row g-0">
                        {item.keys.map(({ key, label, color }) => (
                          <div key={key} className={`col-6 ${color}`}>
                            <div className="card-body text-center p-3">
                              <h6 className="mb-1">{label}</h6>
                              <p className="fw-bold fs-5 mb-0">{formatValue(summaryData?.[key] ?? 0)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              } else {
                const { key, label, color } = item;
                return (
                  <div key={key} className="col-12 col-md-4 mb-3">
                    <div className={`card h-100 text-white border-0 shadow-sm ${color}`}>
                      <div className="card-body text-center">
                        <h6 className="mb-1">{label}</h6>
                        <p className="fw-bold fs-4 mb-0">{formatValue(summaryData?.[key] ?? 0)}</p>
                      </div>
                    </div>
                  </div>
                );
              }
            })}

          </div>
        </div>
      </div>
    </div>
  );
};

export default VanSaleSummary;
