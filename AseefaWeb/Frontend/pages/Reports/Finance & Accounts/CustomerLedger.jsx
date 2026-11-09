
import React, { useState, useEffect } from "react";
import api from '../../apiService';
import Select from "react-select";
import { toWords } from "number-to-words";

import DataTable from "react-data-table-component";
import { FaSearch, FaFileExcel, FaPrint } from "react-icons/fa";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { usePermission } from '../../../src/context/permissionContex';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const CustomerLedger = () => {
  // ── Permissions ──
  const { getPermission, refreshPermissions } = usePermission();
  const permission = getPermission('CLIENT_LEDGER');
  const canView   = !!permission?.CanView;
  const canExport = !!permission?.CanExport;

  useEffect(() => {
    refreshPermissions();
  }, []);

  const getCurrentDate = () => new Date().toISOString().split("T")[0];

  const formatAmount = (amount) => {
    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    });
  };

  const [fromDate, setFromDate] = useState(getCurrentDate());
  const [toDate, setToDate] = useState(getCurrentDate());
  const [type, setType] = useState("All");
  const [result, setResult] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [CustomerID, setCustomerID] = useState("");
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState([]);

  const [Description, setDescription] = useState("");
  const [distinctDescription, setDistinctDescription] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");


  useEffect(() => {
    if (!canView) return;
    const fetchDropdownData = async () => {
      try {
        const CompanyID = sessionStorage.getItem("CompanyID");
        const response = await api.get(`/api/GetCustomers?CompanyID=${CompanyID}`);
        setCustomers(response.data || []);
      } catch (err) {
        console.error("Error fetching dropdown data:", err);
        setError("Failed to load dropdown data.");
        toast.error("Failed to load customer list");
      }
    };

    fetchDropdownData();
  }, [canView]);

  const customerOptions = customers.map((customer) => ({
    value: customer.CustomerID,
    label: customer.CustomerName,
  }));

  const handleCustomerChange = (selectedOption) => {
    setCustomerID(selectedOption ? selectedOption.value : "");
  };


  const fetchCustomerLedger = async () => {
    if (!canView) return; // ── Permission guard ──
    setIsLoading(true);
    setError("");

    try {
      const financialResponse = JSON.parse(sessionStorage.getItem("financialResponse"));
      const FYearID = financialResponse?.FYearID;

      if (!FYearID) {
        setError("Financial Year ID is missing.");
        setIsLoading(false);
        return;
      }

      if (!CustomerID || !fromDate || !toDate) {
        setError("CustomerID, FromDate, and ToDate are required.");
        setIsLoading(false);
        return;
      }

      const params = new URLSearchParams({
        CustomerID: parseInt(CustomerID, 10),
        FYearID: parseInt(FYearID, 10),
        FromDate: fromDate,
        ToDate: toDate,
      });

      const response = await api.get(`/api/LedgerCustomer?${params.toString()}`);

      if (response.status === 200 && response.data) {
        const { summary = [], Details = [] } = response.data;

        const uniqueDescription = [...new Set(Details.map(order => order.Description))];
        setDistinctDescription(uniqueDescription);

        let filteredDetails = Details;

        if (Description) {
          filteredDetails = Details.filter(order => order.Description === Description);
        }

        setSummary(summary);
        setResult(filteredDetails);
      } else {
        setError("Unexpected response from server.");
        toast.error("Unexpected response from server.");
        setSummary([]);
        setResult([]);
      }
    } catch (err) {
      console.error("Error fetching ledger details:", err);

      let msg = "An unexpected error occurred.";
      if (err.response) {
        msg = `Error: ${err.response.data?.message || "Failed to fetch ledger details."}`;
      } else if (err.request) {
        msg = "No response from the server. Please check your connection.";
      }
      setError(msg);
      toast.error(msg);

      setSummary([]);
      setResult([]);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    if (!canView) {
      setResult([]);
      setSummary([]);
      return;
    }
    fetchCustomerLedger();
  }, [fromDate, toDate, CustomerID, Description, canView]);

  const handleClear = () => {
    setFromDate(getCurrentDate());
    setToDate(getCurrentDate());
    setType("All");
    setDescription("");
    setError("");
    setCustomerID("");
    setSearchQuery("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchCustomerLedger();
  };

  const exportToExcel = () => {
    if (!canExport) { toast.error("You do not have permission to export reports."); return; }
    if (!filteredResults.length) {
      toast.error("No data to export.");
      return;
    }

    const totalAmount = filteredResults.reduce((sum, order) => sum + (order.Amount || 0), 0);

    const dataForExcel = filteredResults.map((row, index) => {
      const billNo = row.BillNo?.toString() || "";
      const isWholesale = billNo.endsWith("00");

      return {
        "SL. No": index + 1,
        "Bill No": `${row.InvSeries || ''} ${isWholesale ? 'Wholesale' : billNo}` || "N/A",
        "Date": row.Date ? new Date(row.Date).toLocaleDateString("en-GB") : "N/A",
        "Description": row.Description || "N/A",
        "Bill Mode": `${row.Mode || "N/A"}${row.Mode === "Credit" ? ` - ${row.BillMode || "N/A"}` : ""}`,
        "Amount": row.Amount,
        "Amount in Words": numberToWords(row.Amount),
        "Customer": row.CustomerName || "N/A",
        "Type": isWholesale ? "Wholesale" : row.SaleType || "N/A",
        "Mode": row.Mode,
        "Salesman": row.SalesmanName,
        "Route": row.RootName,
      };
    });

    dataForExcel.push({
      "SL. No": "TOTAL",
      "Bill No": "",
      "Customer": "",
      "Amount": totalAmount,
      "Date": "",
      "Type": "",
      "Mode": "",
      "Salesman": "",
      "Route": "",
    });

    const ws = XLSX.utils.json_to_sheet(dataForExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CustomerLedger");

    ws["!merges"] = [{ s: { r: dataForExcel.length, c: 0 }, e: { r: dataForExcel.length, c: 2 } }];

    XLSX.writeFile(wb, "CustomerLedger.xlsx");
    toast.success("Exported to Excel");
  };

  const exportToPDF = () => {
    if (!canExport) { toast.error("You do not have permission to export reports."); return; }
    if (!filteredResults.length) {
      toast.error("No data to export.");
      return;
    }

    const totalAmount = filteredResults.reduce((sum, order) => sum + (order.Amount || 0), 0);
    const doc = new jsPDF();
    doc.text("Customer Ledger Report", 14, 10);

    const tableRows = filteredResults.map((row, index) => {
      const billNo = row.BillNo?.toString() || "";
      const isWholesale = billNo.endsWith("00");

      return [
        index + 1,
        `${row.InvSeries || ''} ${isWholesale ? 'Wholesale' : billNo}`,
        row.CustomerName || "N/A",
        row.Amount,
        row.Date ? new Date(row.Date).toLocaleDateString("en-GB") : "N/A",
        isWholesale ? "Wholesale" : row.SaleType || "N/A",
        row.Mode,
        row.SalesmanName,
        row.RootName,
      ];
    });

    tableRows.push([
      { content: "TOTAL", colSpan: 3, styles: { fontStyle: "bold", halign: "center" } },
      { content: totalAmount, styles: { fontStyle: "bold" } },
      "", "", "", "", "", ""
    ]);

    doc.autoTable({
      head: [["SL No", "Bill No", "Customer", "Amount", "Date", "Type", "Mode", "Salesman", "Route"]],
      body: tableRows,
      startY: 20,
      theme: "grid",
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 20 },
        2: { cellWidth: 40 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 15 },
        6: { cellWidth: 15 },
        7: { cellWidth: 20 },
        8: { cellWidth: 20 },
      },
      margin: { top: 20 },
    });

    doc.save("CustomerLedger.pdf");
    toast.success("Exported to PDF");
  };

  const filteredResults = result.filter((row) => {
    return (
      (
        (row.Amount?.toString().includes(searchQuery)) ||
        (row.Date?.toLowerCase().includes(searchQuery.toLowerCase()))
      ));
  });


  const numberToWords = (num) => {
    if (!num) return "Zero";
    return toWords(num).replace(/\b\w/g, (char) => char.toUpperCase());
  };


  const columns = [
    {
      name: "SL. No",
      selector: (_, index) => index + 1,
      sortable: false,
      width: "6%",
      center: true,
      cell: (_, index) => <b style={{ color: "#333", fontSize: "14px" }}>{index + 1}</b>,
    },
    {
      name: "Bill No",
      selector: (row) => row.BillNo || "N/A",
      sortable: true,
      width: "10%",
      cell: (row) => (
        <span style={{ fontWeight: "", fontSize: "14px" }}>
          {row.BillNo || "N/A"}
        </span>
      ),
    },
    {
      name: "Date",
      selector: (row) => (row.Date ? new Date(row.Date).toLocaleDateString("en-GB") : "N/A"),
      sortable: true,
      width: "14%",
      cell: (row) => (
        <span style={{ color: "#6c757d", fontSize: "13px" }}>
          {row.Date ? new Date(row.Date).toLocaleDateString("en-GB") : "N/A"}
        </span>
      ),
    },
    {
      name: "Description",
      selector: (row) => row.Description || "N/A",
      sortable: true,
      width: "12%",
      cell: (row) => (
        <span style={{ fontStyle: "italic", color: "#555", fontSize: "13px" }}>
          {row.Description || "N/A"}
        </span>
      ),
    },
    {
      name: "Bill Mode",
      selector: (row) =>
        `${row.Mode || "N/A"}${row.Mode === "Credit" ? ` - ${row.BillMode || "N/A"}` : ""}`,
      sortable: true,
      width: "18%",
      cell: (row) => (
        <span style={{ fontWeight: "bold", fontSize: "14px" }}>
          {row.Mode || "N/A"}
          {row.Mode === "Credit" && (
            <>
              {" - "}
              <span style={{ fontWeight: "bold", color: "#17a2b8" }}>
                {row.BillMode || "N/A"}
              </span>
            </>
          )}
        </span>
      ),
    },
    {
      name: "Amount",
      selector: (row) => row.Amount,
      sortable: true,
      width: "15%",
      center: true,
      cell: (row) => (
        <span
          style={{
            color: row.Mode === "Debit" ? "#dc3545" : "#28a745",
            fontWeight: "bold",
            fontSize: "14px",
            padding: "4px 8px",
            borderRadius: "4px",
            backgroundColor: row.Mode === "Debit" ? "#fdecea" : "#e6f4ea",
          }}
        >
          ₹{row.Amount}
        </span>
      ),
    },
    {
      name: "Amount in Words",
      selector: (row) => numberToWords(row.Amount),
      sortable: false,
      width: "25%",
      cell: (row) => (
        <span style={{ color: "#555", fontSize: "13px", fontStyle: "italic" }}>
          {numberToWords(row.Amount)}
        </span>
      ),
    },
  ];


  const paginationOptions = {
    rowsPerPageText: 'Rows per page:',
    rangeSeparatorText: 'of',
    selectAllRowsItem: false,
    rowsPerPageOptions: [500, 1000, 10000],
  };

  // ── Access-denied view, same pattern as other reports ──
  if (!canView) {
    return (
      <div className="container-fluid" style={{ backgroundColor: "white" }}>
        <ToastContainer position="top-center" autoClose={3000} />
        <div className="alert alert-danger mt-3">You do not have permission to view Customer Ledger.</div>
      </div>
    );
  }

  return (

    <div className="container-fluid" style={{ backgroundColor: "white" }}>
      <ToastContainer position="top-center" autoClose={3000} />

      <div className="page-header d-print-none mt-0">
        <h2 className="page-title">Customer Ledger</h2>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row align-items-end">

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

              <div className="col-md-3">
                <label htmlFor="CustomerID">Customer</label>
                <Select
                  id="CustomerID"
                  name="CustomerID"
                  options={customerOptions}
                  value={customerOptions.find(option => option.value === CustomerID) || null}
                  onChange={handleCustomerChange}
                  placeholder="Select Customer"
                  isSearchable
                />
              </div>

              <div className="col-md-2">
                <label htmlFor="Description">Description</label>
                <select
                  id="Description"
                  className="form-control"
                  value={Description}
                  onChange={(e) => setDescription(e.target.value)}
                >
                  <option value="">All</option>
                  {distinctDescription.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-1">
                <button type="submit" className="btn btn-primary w-100">Generate</button>
              </div>

              <div className="col-md-1">
                <button type="button" className="btn btn-secondary w-100" onClick={handleClear}>Clear</button>
              </div>

            </div>
          </form>
        </div>

      </div>

      <div className="card-body">
        <div style={{ overflowX: "auto" }}>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>AcTrans Amount</th>
                <th>Bill Amount</th>
                <th>Receipt Amount</th>
                <th>Returned Bill Amount</th>
                <th>Outstanding</th>
                <th>Debit Amount</th>
                <th>Credit Amount</th>
                <th>Balance Before</th>
              </tr>
            </thead>
            <tbody>
              {summary && summary.length > 0 ? (
                <tr>
                  <td>{summary[0]?.AcTransAmount ? formatAmount(summary[0].AcTransAmount) : "N/A"}</td>
                  <td>{summary[0]?.BillAmount ? formatAmount(summary[0].BillAmount) : "N/A"}</td>
                  <td>{summary[0]?.ReceiptAmount ? formatAmount(summary[0].ReceiptAmount) : "N/A"}</td>
                  <td>{summary[0]?.ReturnedBillAmount ? formatAmount(summary[0].ReturnedBillAmount) : "N/A"}</td>
                  <td>{summary[0]?.Outstanding ? formatAmount(summary[0].Outstanding) : "N/A"}</td>
                  <td>{summary[0]?.DebitAmount ? formatAmount(summary[0].DebitAmount) : "N/A"}</td>
                  <td>{summary[0]?.CreditAmount ? formatAmount(summary[0].CreditAmount) : "N/A"}</td>
                  <td>{summary[0]?.BalanceBefore ? formatAmount(summary[0].BalanceBefore) : "N/A"}</td>
                </tr>

              ) : (
                <tr>
                  <td colSpan="8">No Summary  available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>



      <div className="card mt-4">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h2 className="mb-0">Customer Ledger Details</h2>

            <div className="d-flex align-items-center gap-2">
              {/* Export Buttons — only shown if user can export */}
              {canExport && (
                <div>
                  <button className="btn btn" onClick={exportToExcel}>
                    <FaFileExcel className="me-2" />
                    Excel
                  </button>
                  <button className="btn btn" onClick={exportToPDF}>
                    <FaPrint className="me-2" />
                    PDF
                  </button>
                </div>
              )}

              <div className="col-lg-3">
                <div className="input-group">
                  <span className="input-group-text bg-primary text-white">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by Amount / Date ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

 {isLoading ? (
            <div className="d-flex flex-column align-items-center justify-content-center vh-50">
              <div className="text-center">
                <div className="mb-3">
                <a href="." className="navbar-brand navbar-brand-autodark">
                  SuitApps
                </a>
              </div>
                <div className="text-secondary mb-3">
                  Preparing Report
                </div>
                <div className="progress progress-sm">
                  <div className="progress-bar progress-bar-indeterminate"></div>
                </div>
              </div>
            </div>
          ) : result.length > 0 ? (
            <DataTable
              columns={columns}
              data={filteredResults}
              progressPending={isLoading}
              highlightOnHover
              striped
              pagination
              paginationPerPage={500}
              paginationRowsPerPageOptions={[500, 1000, 10000]}
              paginationComponentOptions={paginationOptions}
            />
          ) : (
            <div className="text-center text-muted">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerLedger;