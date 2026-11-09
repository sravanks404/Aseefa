// import React, { useState, useEffect } from "react";
// import api from '../../apiService';
// import { FaSearch, FaFileExcel, FaPrint } from "react-icons/fa";
// import { jsPDF } from "jspdf";
// import * as XLSX from "xlsx";

// const CreditorsReport = () => {
//   const getCurrentDate = () => new Date().toISOString().split("T")[0];

//   const [fromDate, setFromDate] = useState(getCurrentDate());
//   const [toDate, setToDate] = useState(getCurrentDate());
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [reportData, setReportData] = useState([]);
//   const [selectedSalesman, setSelectedSalesman] = useState("All");
//   const [selectedRoute, setSelectedRoute] = useState("All");
//   const [searchTerm, setSearchTerm] = useState("");


//   const formatAmount = (amount) => {
//     return amount.toLocaleString("en-IN", {
//       style: "currency",
//       currency: "INR",
//       minimumFractionDigits: 2,
//     });
//   };

//   const fetchCreditorsReport = async () => {
//     setIsLoading(true);
//     setError("");

//     try {
//       const params = new URLSearchParams({
//         FromDate: fromDate,
//         ToDate: toDate,
//       });

//       const response = await api.get(`/api/CreditorsReport?${params.toString()}`);

//       if (response.status === 200) {
//         setReportData(response.data || []);
//       } else {
//         setError("Unexpected response from server.");
//       }
//     } catch (err) {
//       console.error("Error fetching Creditors report:", err);
//       setError("An error occurred while fetching the report.");
//     } finally {
//       setIsLoading(false);
//     }
//   };




//   const uniqueSalesmen = ["All", ...new Set(reportData.map((item) => item.UserName).filter(Boolean))];
//   const uniqueRoutes = ["All", ...new Set(reportData.map((item) => item.RootName).filter(Boolean))];

//   const filteredData = reportData.filter(item => {
//     const salesmanMatch = selectedSalesman === "All" || item.UserName === selectedSalesman;
//     const routeMatch = selectedRoute === "All" || item.RootName === selectedRoute;
//     const customerMatch = item.AccountName?.toLowerCase().includes(searchTerm.toLowerCase());
//     return salesmanMatch && routeMatch && customerMatch;
//   });


//   const handleExportToExcel = () => {
//     if (filteredData.length === 0) return;

//     const sheetTitle = ["Creditors Report"];
//     const dateRange = [`From: ${fromDate} To: ${toDate}`];

//     const headers = [
//       "SI.No",
//       "Customer Name",
//       "Address",
//       "Opening",
//       "Debit",
//       "Credit",
//       "Outstanding",
//       "Salesman",
//       "Route",
//     ];

//     const dataRows = filteredData.map((item, idx) => ([
//       idx + 1,
//       item.AccountName,
//       `${item.Address}, ${item.City}`,
//       item.Opening,
//       item.Debit,
//       item.Credit,
//       item.Outstanding,
//       item.UserName,
//       item.RootName,
//     ]));

//     const totalOpening = filteredData.reduce((sum, item) => sum + item.Opening, 0);
//     const totalDebit = filteredData.reduce((sum, item) => sum + item.Debit, 0);
//     const totalCredit = filteredData.reduce((sum, item) => sum + item.Credit, 0);
//     const totalOutstanding = filteredData.reduce((sum, item) => sum + item.Outstanding, 0);

//     const totalRow = [
//       "", "Total", "",
//       totalOpening,
//       totalDebit,
//       totalCredit,
//       totalOutstanding,
//       "", ""
//     ];

//     const worksheetData = [
//       sheetTitle,
//       dateRange,
//       [],
//       headers,
//       ...dataRows,
//       totalRow,
//     ];

//     const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Creditors Report");

//     XLSX.writeFile(workbook, `Creditors_Report_${fromDate}_to_${toDate}.xlsx`);
//   };


//   const handleExportToPDF = () => {
//     const doc = new jsPDF("landscape");
//     const title = `Creditors Report`;
//     const dateRange = `From: ${fromDate} To: ${toDate}`;

//     // Prepare table data
//     const tableColumn = [
//       "SI. No",
//       "Customer Name",
//       "Address",
//       "Opening",
//       "Debit",
//       "Credit",
//       "Outstanding",
//       "Salesman",
//       "Route",
//     ];

//     const tableRows = filteredData.map((item, idx) => [
//       idx + 1,
//       item.AccountName,
//       `${item.Address}, ${item.City}`,
//       item.Opening.toFixed(2),
//       item.Debit.toFixed(2),
//       item.Credit.toFixed(2),
//       item.Outstanding.toFixed(2),
//       item.UserName,
//       item.RootName,
//     ]);

//     // Totals Row
//     const totalOpening = filteredData.reduce((sum, item) => sum + item.Opening, 0).toFixed(2);
//     const totalDebit = filteredData.reduce((sum, item) => sum + item.Debit, 0).toFixed(2);
//     const totalCredit = filteredData.reduce((sum, item) => sum + item.Credit, 0).toFixed(2);
//     const totalOutstanding = filteredData.reduce((sum, item) => sum + item.Outstanding, 0).toFixed(2);

//     const totalRow = [
//       "",
//       "Total",
//       "",
//       totalOpening,
//       totalDebit,
//       totalCredit,
//       totalOutstanding,
//       "",
//       "",
//     ];

//     tableRows.push(totalRow);

//     doc.setFontSize(14);
//     doc.text(title, 14, 15);
//     doc.setFontSize(11);
//     doc.text(dateRange, 14, 22);

//     doc.autoTable({
//       startY: 26,
//       head: [tableColumn],
//       body: tableRows,
//       theme: "striped",
//       styles: { fontSize: 9 },
//     });

//     doc.save(`Creditors_Report_${fromDate}_to_${toDate}.pdf`);
//   };


//   useEffect(() => {
//     fetchCreditorsReport();
//   }, [fromDate, toDate]);

//   const handleClear = () => {
//     const today = getCurrentDate();
//     setFromDate(today);
//     setToDate(today);
//     setReportData([]); // Optional
//     setError("");
//     setSelectedSalesman("All");
//     setSelectedRoute("All");

//     // Wait a tick to ensure state updates before fetching
//     setTimeout(() => {
//       fetchCreditorsReport();
//     }, 0);
//   };



//   return (
//     <div className="container-fluid" style={{ backgroundColor: "white" }}>
//       <div className="page-header d-print-none mt-0">
//         <h2 className="page-title">Creditors Report</h2>
//       </div>

//       <div className="card">
//         <div className="card-body">
//           <form
//             onSubmit={(e) => {
//               e.preventDefault();
//               fetchCreditorsReport();
//             }}
//           >
//             <div className="row">
//               <div className="col-md-2">
//                 <label htmlFor="FromDate">From Date</label>
//                 <input
//                   type="date"
//                   id="FromDate"
//                   className="form-control"
//                   value={fromDate}
//                   onChange={(e) => setFromDate(e.target.value)}
//                   required
//                 />
//               </div>
//               <div className="col-md-2">
//                 <label htmlFor="ToDate">To Date</label>
//                 <input
//                   type="date"
//                   id="ToDate"
//                   className="form-control"
//                   value={toDate}
//                   onChange={(e) => setToDate(e.target.value)}
//                   required
//                 />
//               </div>

//               <div className="col-md-2">
//                 <label> Salesman</label>
//                 <select
//                   className="form-control"
//                   value={selectedSalesman}
//                   onChange={(e) => setSelectedSalesman(e.target.value)}
//                 >
//                   {uniqueSalesmen.map((salesman, idx) => (
//                     <option key={idx} value={salesman}>{salesman}</option>
//                   ))}
//                 </select>
//               </div>

//               <div className="col-md-2">
//                 <label> Route</label>
//                 <select
//                   className="form-control"
//                   value={selectedRoute}
//                   onChange={(e) => setSelectedRoute(e.target.value)}
//                 >
//                   {uniqueRoutes.map((route, idx) => (
//                     <option key={idx} value={route}>{route}</option>
//                   ))}
//                 </select>
//               </div>

//               <div className="col-md-2 d-flex align-items-end">
//                 <button type="submit" className="btn btn-primary w-100 me-2">
//                   Generate
//                 </button>
//                 <button type="button" className="btn btn-secondary w-100" onClick={handleClear}>
//                   Clear
//                 </button>
//               </div>
//             </div>

//           </form>
//         </div>
//       </div>

//       <div className="card-body">
//         <h4 className="mb-4">Creditors Summary Report</h4>
//         {error && <div className="text-danger mb-3">{error}</div>}

//         <div className="d-flex justify-content-between mb-3">
//           {/* Search Input */}

//           <div className="col-lg-3">
//             <div className="input-group">
//               <span className="input-group-text bg-primary text-white">
//                 <FaSearch />
//               </span>
//               <input
//                 type="text"
//                 className="form-control"
//                 placeholder="Search by Customer Name ..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//             </div>
//           </div>

//           {/* Export Button */}
//           <div>
//             <button className="btn btn" onClick={handleExportToExcel}>
//               <FaFileExcel className="me-2" />
//               Excel
//             </button>
//             <button className="btn btn" onClick={handleExportToPDF}>
//               <FaPrint className="me-2" />
//               PDF
//             </button>
//           </div>
//         </div>



//         <div style={{ overflowX: "auto" }}>
//           <div style={{ maxHeight: "500px", overflowY: "auto", position: "relative" }}>
//             {isLoading ? (
//               <div className="d-flex flex-column align-items-center justify-content-center w-100" style={{ height: "300px" }}>
//                 <div className="text-center">
//                   <div className="navbar-brand navbar-brand-autodark">SuitApps</div>
//                   <div className="text-secondary mb-3">Preparing Report</div>
//                   <div className="progress progress-sm">
//                     <div className="progress-bar progress-bar-indeterminate"></div>
//                   </div>
//                 </div>
//               </div>
//             ) : (
//               <table className="table table-bordered table-striped mb-0">
//                 <thead style={{ position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 2 }}>
//                   <tr>
//                     <th>SI. No</th>
//                     <th>Customer Name</th>
//                     <th>Address</th>
//                     <th>Opening</th>
//                     <th>Debit</th>
//                     <th>Credit</th>
//                     <th>Outstanding</th>
//                     <th>Salesman</th>
//                     <th>Route</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {filteredData.length > 0 ? (
//                     <>
//                       {filteredData.map((item, idx) => (
//                         <tr key={idx}>
//                           <td>{idx + 1}</td>
//                           <td>{item.AccountName}</td>
//                           <td>{item.Address}, {item.City}</td>
//                           <td>{formatAmount(item.Opening)}</td>
//                           <td>{formatAmount(item.Debit)}</td>
//                           <td>{formatAmount(item.Credit)}</td>
//                           <td>{formatAmount(item.Outstanding)}</td>
//                           <td>{item.UserName}</td>
//                           <td>{item.RootName}</td>
//                         </tr>
//                       ))}

//                       {/* Sticky Totals Row */}
//                       <tr style={{
//                         fontWeight: "bold",
//                         backgroundColor: "#f0f0f0",
//                         position: "sticky",
//                         bottom: 0,
//                         zIndex: 1
//                       }}>
//                         <td></td>
//                         <td colSpan="2" className="text-end">Total</td>
//                         <td>{formatAmount(filteredData.reduce((sum, item) => sum + item.Opening, 0))}</td>
//                         <td>{formatAmount(filteredData.reduce((sum, item) => sum + item.Debit, 0))}</td>
//                         <td>{formatAmount(filteredData.reduce((sum, item) => sum + item.Credit, 0))}</td>
//                         <td>{formatAmount(filteredData.reduce((sum, item) => sum + item.Outstanding, 0))}</td>
//                         <td colSpan="2"></td>
//                       </tr>
//                     </>
//                   ) : (
//                     <tr>
//                       <td colSpan="9">No data available for the selected date range.</td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             )}

//           </div>

//         </div>


//       </div>
//     </div>
//   );
// };

// export default CreditorsReport;
import React, { useState, useEffect } from "react";
import api from '../../apiService';
import { FaSearch, FaFileExcel, FaPrint } from "react-icons/fa";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { usePermission } from '../../../src/context/permissionContex';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CreditorsReport = () => {
  // ── Permissions ──
  const { getPermission, refreshPermissions } = usePermission();
  const permission = getPermission('CREDITORS');
  const canView   = !!permission?.CanView;
  const canExport = !!permission?.CanExport;

  useEffect(() => {
    refreshPermissions();
  }, []);

  const getCurrentDate = () => new Date().toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(getCurrentDate());
  const [toDate, setToDate] = useState(getCurrentDate());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [reportData, setReportData] = useState([]);
  const [selectedSalesman, setSelectedSalesman] = useState("All");
  const [selectedRoute, setSelectedRoute] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");


  const formatAmount = (amount) => {
    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    });
  };

  const fetchCreditorsReport = async () => {
    if (!canView) return; // ── Permission guard ──
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        FromDate: fromDate,
        ToDate: toDate,
      });

      const response = await api.get(`/api/CreditorsReport?${params.toString()}`);

      if (response.status === 200 && Array.isArray(response.data)) {
        setReportData(response.data);
      } else if (response.status === 200 && Array.isArray(response.data?.data)) {
        setReportData(response.data.data);
      } else {
        setReportData([]);
        setError("Unexpected response from server.");
        toast.error("Unexpected response from server.");
      }
    } catch (err) {
      console.error("Error fetching Creditors report:", err);
      setReportData([]);
      setError("An error occurred while fetching the report.");
      toast.error("Failed to fetch creditors report");
    } finally {
      setIsLoading(false);
    }
  };




  const safeReportData = Array.isArray(reportData) ? reportData : [];

  const uniqueSalesmen = ["All", ...new Set(safeReportData.map((item) => item.UserName).filter(Boolean))];
  const uniqueRoutes = ["All", ...new Set(safeReportData.map((item) => item.RootName).filter(Boolean))];

  const filteredData = safeReportData.filter(item => {
    const salesmanMatch = selectedSalesman === "All" || item.UserName === selectedSalesman;
    const routeMatch = selectedRoute === "All" || item.RootName === selectedRoute;
    const customerMatch = item.AccountName?.toLowerCase().includes(searchTerm.toLowerCase());
    return salesmanMatch && routeMatch && customerMatch;
  });


  const handleExportToExcel = () => {
    if (!canExport) { toast.error("You do not have permission to export reports."); return; }
    if (filteredData.length === 0) { toast.error("No data to export."); return; }

    const sheetTitle = ["Creditors Report"];
    const dateRange = [`From: ${fromDate} To: ${toDate}`];

    const headers = [
      "SI.No",
      "Customer Name",
      "Address",
      "Opening",
      "Debit",
      "Credit",
      "Outstanding",
      "Salesman",
      "Route",
    ];

    const dataRows = filteredData.map((item, idx) => ([
      idx + 1,
      item.AccountName,
      `${item.Address}, ${item.City}`,
      item.Opening,
      item.Debit,
      item.Credit,
      item.Outstanding,
      item.UserName,
      item.RootName,
    ]));

    const totalOpening = filteredData.reduce((sum, item) => sum + item.Opening, 0);
    const totalDebit = filteredData.reduce((sum, item) => sum + item.Debit, 0);
    const totalCredit = filteredData.reduce((sum, item) => sum + item.Credit, 0);
    const totalOutstanding = filteredData.reduce((sum, item) => sum + item.Outstanding, 0);

    const totalRow = [
      "", "Total", "",
      totalOpening,
      totalDebit,
      totalCredit,
      totalOutstanding,
      "", ""
    ];

    const worksheetData = [
      sheetTitle,
      dateRange,
      [],
      headers,
      ...dataRows,
      totalRow,
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Creditors Report");

    XLSX.writeFile(workbook, `Creditors_Report_${fromDate}_to_${toDate}.xlsx`);
    toast.success("Exported to Excel");
  };


  const handleExportToPDF = () => {
    if (!canExport) { toast.error("You do not have permission to export reports."); return; }
    if (filteredData.length === 0) { toast.error("No data to export."); return; }

    const doc = new jsPDF("landscape");
    const title = `Creditors Report`;
    const dateRange = `From: ${fromDate} To: ${toDate}`;

    const tableColumn = [
      "SI. No",
      "Customer Name",
      "Address",
      "Opening",
      "Debit",
      "Credit",
      "Outstanding",
      "Salesman",
      "Route",
    ];

    const tableRows = filteredData.map((item, idx) => [
      idx + 1,
      item.AccountName,
      `${item.Address}, ${item.City}`,
      item.Opening.toFixed(2),
      item.Debit.toFixed(2),
      item.Credit.toFixed(2),
      item.Outstanding.toFixed(2),
      item.UserName,
      item.RootName,
    ]);

    const totalOpening = filteredData.reduce((sum, item) => sum + item.Opening, 0).toFixed(2);
    const totalDebit = filteredData.reduce((sum, item) => sum + item.Debit, 0).toFixed(2);
    const totalCredit = filteredData.reduce((sum, item) => sum + item.Credit, 0).toFixed(2);
    const totalOutstanding = filteredData.reduce((sum, item) => sum + item.Outstanding, 0).toFixed(2);

    const totalRow = [
      "",
      "Total",
      "",
      totalOpening,
      totalDebit,
      totalCredit,
      totalOutstanding,
      "",
      "",
    ];

    tableRows.push(totalRow);

    doc.setFontSize(14);
    doc.text(title, 14, 15);
    doc.setFontSize(11);
    doc.text(dateRange, 14, 22);

    doc.autoTable({
      startY: 26,
      head: [tableColumn],
      body: tableRows,
      theme: "striped",
      styles: { fontSize: 9 },
    });

    doc.save(`Creditors_Report_${fromDate}_to_${toDate}.pdf`);
    toast.success("Exported to PDF");
  };


  // ── fetch only when user has view permission ──
  useEffect(() => {
    if (!canView) {
      setReportData([]);
      return;
    }
    fetchCreditorsReport();
  }, [fromDate, toDate, canView]);

  const handleClear = () => {
    const today = getCurrentDate();
    setFromDate(today);
    setToDate(today);
    setReportData([]);
    setError("");
    setSelectedSalesman("All");
    setSelectedRoute("All");

    setTimeout(() => {
      fetchCreditorsReport();
    }, 0);
  };

  // ── Access-denied view, same pattern as other reports ──
  if (!canView) {
    return (
      <div className="container-fluid" style={{ backgroundColor: "white" }}>
        <ToastContainer position="top-center" autoClose={3000} />
        <div className="alert alert-danger mt-3">You do not have permission to view the Creditors Report.</div>
      </div>
    );
  }

  return (
    <div className="container-fluid" style={{ backgroundColor: "white" }}>
      <ToastContainer position="top-center" autoClose={3000} />

      <div className="page-header d-print-none mt-0">
        <h2 className="page-title">Creditors Report</h2>
      </div>

      <div className="card">
        <div className="card-body">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchCreditorsReport();
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
                <label> Salesman</label>
                <select
                  className="form-control"
                  value={selectedSalesman}
                  onChange={(e) => setSelectedSalesman(e.target.value)}
                >
                  {uniqueSalesmen.map((salesman, idx) => (
                    <option key={idx} value={salesman}>{salesman}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <label> Route</label>
                <select
                  className="form-control"
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(e.target.value)}
                >
                  {uniqueRoutes.map((route, idx) => (
                    <option key={idx} value={route}>{route}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-2 d-flex align-items-end">
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
        <h4 className="mb-4">Creditors Summary Report</h4>
        {error && <div className="text-danger mb-3">{error}</div>}

        <div className="d-flex justify-content-between mb-3">
          {/* Search Input */}

          <div className="col-lg-3">
            <div className="input-group">
              <span className="input-group-text bg-primary text-white">
                <FaSearch />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by Customer Name ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Export Button — only shown if user can export */}
          {canExport && (
            <div>
              <button className="btn btn" onClick={handleExportToExcel}>
                <FaFileExcel className="me-2" />
                Excel
              </button>
              <button className="btn btn" onClick={handleExportToPDF}>
                <FaPrint className="me-2" />
                PDF
              </button>
            </div>
          )}
        </div>



        <div style={{ overflowX: "auto" }}>
          <div style={{ maxHeight: "500px", overflowY: "auto", position: "relative" }}>
            {isLoading ? (
              <div className="d-flex flex-column align-items-center justify-content-center w-100" style={{ height: "300px" }}>
                <div className="text-center">
                  <div className="navbar-brand navbar-brand-autodark">SuitApps</div>
                  <div className="text-secondary mb-3">Preparing Report</div>
                  <div className="progress progress-sm">
                    <div className="progress-bar progress-bar-indeterminate"></div>
                  </div>
                </div>
              </div>
            ) : (
              <table className="table table-bordered table-striped mb-0">
                <thead style={{ position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 2 }}>
                  <tr>
                    <th>SI. No</th>
                    <th>Customer Name</th>
                    <th>Address</th>
                    <th>Opening</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Outstanding</th>
                    <th>Salesman</th>
                    <th>Route</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length > 0 ? (
                    <>
                      {filteredData.map((item, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>{item.AccountName}</td>
                          <td>{item.Address}, {item.City}</td>
                          <td>{formatAmount(item.Opening)}</td>
                          <td>{formatAmount(item.Debit)}</td>
                          <td>{formatAmount(item.Credit)}</td>
                          <td>{formatAmount(item.Outstanding)}</td>
                          <td>{item.UserName}</td>
                          <td>{item.RootName}</td>
                        </tr>
                      ))}

                      {/* Sticky Totals Row */}
                      <tr style={{
                        fontWeight: "bold",
                        backgroundColor: "#f0f0f0",
                        position: "sticky",
                        bottom: 0,
                        zIndex: 1
                      }}>
                        <td></td>
                        <td colSpan="2" className="text-end">Total</td>
                        <td>{formatAmount(filteredData.reduce((sum, item) => sum + item.Opening, 0))}</td>
                        <td>{formatAmount(filteredData.reduce((sum, item) => sum + item.Debit, 0))}</td>
                        <td>{formatAmount(filteredData.reduce((sum, item) => sum + item.Credit, 0))}</td>
                        <td>{formatAmount(filteredData.reduce((sum, item) => sum + item.Outstanding, 0))}</td>
                        <td colSpan="2"></td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan="9">No data available for the selected date range.</td>
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

export default CreditorsReport;
