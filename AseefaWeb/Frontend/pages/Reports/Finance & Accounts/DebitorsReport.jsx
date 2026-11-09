// import React, { useState, useEffect } from "react";
// import api from '../../apiService';
// import { FaSearch, FaFileExcel, FaPrint, FaFilter } from "react-icons/fa";
// import { jsPDF } from "jspdf";
// import * as XLSX from "xlsx";

// const DebitorsReport = () => {
//   const getCurrentDate = () => new Date().toISOString().split("T")[0];
//   const getPreviousDate = (days) => {
//     const date = new Date();
//     date.setDate(date.getDate() - days);
//     return date.toISOString().split("T")[0];
//   };

//   const [fromDate, setFromDate] = useState(getPreviousDate(120));
//   const [toDate, setToDate] = useState(getCurrentDate());
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [reportData, setReportData] = useState([]);
//   const [selectedSalesman, setSelectedSalesman] = useState("All");
//   const [selectedRoute, setSelectedRoute] = useState("All");
//   const [selectedVan, setSelectedVan] = useState("All");

//   const [searchTerm, setSearchTerm] = useState("");
//   const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

//   const formatAmount = (amount) => {
//     return amount.toLocaleString("en-IN", {
//       style: "currency",
//       currency: "INR",
//       minimumFractionDigits: 2,
//     });
//   };

//   const fetchDebitorsReport = async () => {
//     setIsLoading(true);
//     setError("");

//     try {
//       const params = new URLSearchParams({
//         FromDate: fromDate,
//         ToDate: toDate,
//         Salesman: selectedSalesman !== "All" ? selectedSalesman : "",
//         Route: selectedRoute !== "All" ? selectedRoute : "",
//       });

//       const response = await api.get(`/api/DebitorsReport?${params.toString()}`);

//       if (response.status === 200) {
//         setReportData(response.data || []);
//       } else {
//         setError("Unexpected response from server.");
//       }
//     } catch (err) {
//       console.error("Error fetching debitors report:", err);
//       setError("An error occurred while fetching the report.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const uniqueSalesmen = ["All", ...new Set(reportData.map((item) => item.UserName).filter(Boolean))];
//   const uniqueRoutes = ["All", ...new Set(reportData.map((item) => item.RootName).filter(Boolean))];
//   const uniqueVans = ["All", ...new Set(reportData.map((item) => item.VanName).filter(Boolean))];


//   const filteredData = reportData.filter(item => {
//     const salesmanMatch = selectedSalesman === "All" || item.UserName === selectedSalesman;
//     const routeMatch = selectedRoute === "All" || item.RootName === selectedRoute;
//     const vanMatch = selectedVan === "All" || item.VanName === selectedVan;
//     const customerMatch = item.AccountName?.toLowerCase().includes(searchTerm.toLowerCase());
//     return salesmanMatch && routeMatch && vanMatch && customerMatch;
//   });


//   const handleExportToExcel = () => {
//     if (filteredData.length === 0) return;

//     const sheetTitle = ["Debtors Report"];
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
//       "Mobile",
//     ];

//     const dataRows = filteredData.map((item, idx) => ([
//       idx + 1,
//       item.AccountName,
//       `${item.Address}, ${item.City}`,
//       item.BalanceBefore,
//       item.DebitAmount,
//       item.CreditAmount,
//       item.Outstanding,
//       item.UserName,
//       item.RootName,
//       item.Mob,
//     ]));

//     const totalOpening = filteredData.reduce((sum, item) => sum + item.BalanceBefore, 0);
//     const totalDebit = filteredData.reduce((sum, item) => sum + item.DebitAmount, 0);
//     const totalCredit = filteredData.reduce((sum, item) => sum + item.CreditAmount, 0);
//     const totalOutstanding = filteredData.reduce((sum, item) => sum + item.Outstanding, 0);

//     const totalRow = [
//       "", "Total", "",
//       totalOpening,
//       totalDebit,
//       totalCredit,
//       totalOutstanding,
//       "", "", ""
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
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Debtors Report");

//     XLSX.writeFile(workbook, `Debtors_Report_${fromDate}_to_${toDate}.xlsx`);
//   };

//   const handleExportToPDF = () => {
//     if (filteredData.length === 0) {
//       alert("No data to export.");
//       return;
//     }

//     const totalOpening = filteredData.reduce((sum, item) => sum + item.BalanceBefore, 0).toFixed(2);
//     const totalDebit = filteredData.reduce((sum, item) => sum + item.DebitAmount, 0).toFixed(2);
//     const totalCredit = filteredData.reduce((sum, item) => sum + item.CreditAmount, 0).toFixed(2);
//     const totalOutstanding = filteredData.reduce((sum, item) => sum + item.Outstanding, 0).toFixed(2);

//     const doc = new jsPDF({ orientation: "landscape" });

//     doc.setFontSize(16);
//     doc.text("Debtors Report", 14, 15);

//     doc.setFontSize(10);
//     doc.text(`From: ${fromDate}`, 14, 22);
//     doc.text(`To: ${toDate}`, 80, 22);

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
//       "Mobile",
//     ];

//     const tableRows = filteredData.map((item, idx) => [
//       idx + 1,
//       item.AccountName,
//       `${item.Address}, ${item.City}`,
//       item.BalanceBefore.toFixed(2),
//       item.DebitAmount.toFixed(2),
//       item.CreditAmount.toFixed(2),
//       item.Outstanding.toFixed(2),
//       item.UserName,
//       item.RootName,
//       item.Mob,
//     ]);

//     // Add total row like Sale Report style
//     tableRows.push([
//       { content: "TOTAL", colSpan: 3, styles: { fontStyle: "bold", halign: "center" } },
//       { content: totalOpening, styles: { fontStyle: "bold", halign: "right" } },
//       { content: totalDebit, styles: { fontStyle: "bold", halign: "right" } },
//       { content: totalCredit, styles: { fontStyle: "bold", halign: "right" } },
//       { content: totalOutstanding, styles: { fontStyle: "bold", halign: "right" } },
//       "", "", ""
//     ]);

//     doc.autoTable({
//       startY: 28,
//       head: [tableColumn],
//       body: tableRows,
//       theme: "grid",
//       styles: {
//         fontSize: 8,
//         cellPadding: 2,
//         overflow: "hidden",
//         valign: "middle",
//         lineWidth: 0.1,
//         lineColor: [200, 200, 200]
//       },
//       headStyles: {
//         fillColor: [41, 128, 185],
//         textColor: 255,
//         fontStyle: "bold",
//         halign: "center"
//       },
//       bodyStyles: {
//         textColor: [50, 50, 50]
//       },
//       alternateRowStyles: {
//         fillColor: [245, 245, 245]
//       },
//       columnStyles: {
//         0: { cellWidth: 10, halign: "center" },
//         1: { cellWidth: 30 },
//         2: { cellWidth: 40 },
//         3: { cellWidth: 20, halign: "right" },
//         4: { cellWidth: 20, halign: "right" },
//         5: { cellWidth: 20, halign: "right" },
//         6: { cellWidth: 20, halign: "right" },
//         7: { cellWidth: 20 },
//         8: { cellWidth: 20 }
//       },
//       didParseCell: function (data) {
//         const isTotalRow = data.row.raw?.[0]?.content === "TOTAL";
//         if (isTotalRow) {
//           data.cell.styles.fillColor = [240, 240, 240]; // Light gray
//           data.cell.styles.textColor = [0, 0, 0];
//           data.cell.styles.fontStyle = "bold";
//           if ([3, 4, 5, 6].includes(data.column.index)) {
//             data.cell.styles.halign = "right";
//           } else {
//             data.cell.styles.halign = "center";
//           }
//         }
//       },
//       didDrawPage: function (data) {
//         doc.setFontSize(10);
//         doc.setTextColor(150);
//         doc.text(
//           `Page ${data.pageNumber}`,
//           doc.internal.pageSize.width - 20,
//           doc.internal.pageSize.height - 10,
//           { align: "right" }
//         );
//       }
//     });

//     doc.save(`Debtors_Report_${fromDate}_to_${toDate}.pdf`);
//   };

//   useEffect(() => {
//     fetchDebitorsReport();
//   }, [selectedSalesman, selectedRoute, selectedVan]);


//   const handleClear = () => {
//     const today = getCurrentDate();
//     const previousDate = getPreviousDate(120); // 120 days before today
//     setFromDate(previousDate);
//     setToDate(today);
//     setSelectedSalesman("All");
//     setSelectedRoute("All");
//     setSearchTerm("");
//     fetchDebitorsReport();
//     setSelectedVan("All");

//   };

//   const toggleFilterModal = () => {
//     setIsFilterModalOpen(!isFilterModalOpen);
//   };

//   return (
//     <div className="container-fluid" style={{ backgroundColor: "white" }}>
//       <div className="page-header d-print-none mt-0">
//         <h2 className="page-title">Debitors Report</h2>
//       </div>

//       {/* Search + Filters + Exports - Compact Header */}
//       <div className="card shadow-sm mb-3 p-3">
//         <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
//           {/* Search - Full width on mobile, then fixed */}
//           <div className="w-100 w-md-50">
//             <div className="input-group">
//               <span className="input-group-text bg-primary text-white">
//                 <FaSearch />
//               </span>
//               <input
//                 type="text"
//                 className="form-control"
//                 placeholder="Search by customer name..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//             </div>
//           </div>


//           {/* Action Buttons Group */}
//           <div className="d-flex flex-wrap justify-content-end gap-2 w-100 w-md-auto">
//             {/* Filter Button */}
//             <button
//               type="button"
//               className="btn btn-outline-primary"
//               onClick={toggleFilterModal}
//             >
//               <FaFilter className="me-1" /> Filters
//             </button>

//             {/* Export Buttons */}
//             <div className="btn-group">
//               <button className="btn btn-outline" onClick={handleExportToExcel}>
//                 <FaFileExcel className="me-1" /> Excel
//               </button>
//               <button className="btn btn-outline" onClick={handleExportToPDF}>
//                 <FaPrint className="me-1" /> PDF
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Filter Modal */}
//       {isFilterModalOpen && (
//         <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.5)" }}>
//           <div className="modal-dialog modal-lg" role="document">
//             <div className="modal-content">
//               <div className="modal-header bg-light">
//                 <h5 className="modal-title text-primary">
//                   <FaFilter className="me-2" />
//                   Debitors Report Filters
//                 </h5>
//                 <button type="button" className="btn-close" onClick={toggleFilterModal} aria-label="Close"></button>
//               </div>
//               <div className="modal-body">
//                 <form onSubmit={(e) => {
//                   e.preventDefault();
//                   fetchDebitorsReport();
//                   toggleFilterModal();
//                 }}>
//                   <div className="row g-3">
//                     {/* Date Range */}
//                     <div className="col-md-6">
//                       <label htmlFor="FromDate" className="form-label fw-bold small text-muted">FROM DATE</label>
//                       <input
//                         type="date"
//                         id="FromDate"
//                         className="form-control"
//                         value={fromDate}
//                         onChange={(e) => setFromDate(e.target.value)}
//                         required
//                       />
//                     </div>
//                     <div className="col-md-6">
//                       <label htmlFor="ToDate" className="form-label fw-bold small text-muted">TO DATE</label>
//                       <input
//                         type="date"
//                         id="ToDate"
//                         className="form-control"
//                         value={toDate}
//                         onChange={(e) => setToDate(e.target.value)}
//                         required
//                       />
//                     </div>

//                     {/* Salesman Dropdown */}
//                     <div className="col-md-6">
//                       <label className="form-label fw-bold small text-muted">SALESMAN</label>
//                       <select
//                         className="form-select"
//                         value={selectedSalesman}
//                         onChange={(e) => setSelectedSalesman(e.target.value)}
//                       >
//                         {uniqueSalesmen.map((salesman, idx) => (
//                           <option key={idx} value={salesman}>{salesman}</option>
//                         ))}
//                       </select>
//                     </div>

//                     {/* Route Dropdown */}
//                     <div className="col-md-6">
//                       <label className="form-label fw-bold small text-muted">ROUTE</label>
//                       <select
//                         className="form-select"
//                         value={selectedRoute}
//                         onChange={(e) => setSelectedRoute(e.target.value)}
//                       >
//                         {uniqueRoutes.map((route, idx) => (
//                           <option key={idx} value={route}>{route}</option>
//                         ))}
//                       </select>
//                     </div>

//                     {/* Van Dropdown */}
//                     <div className="col-md-6">
//                       <label className="form-label fw-bold small text-muted">VAN</label>
//                       <select
//                         className="form-select"
//                         value={selectedVan}
//                         onChange={(e) => setSelectedVan(e.target.value)}
//                       >
//                         {uniqueVans.map((van, idx) => (
//                           <option key={idx} value={van}>{van}</option>
//                         ))}
//                       </select>
//                     </div>

//                   </div>
//                 </form>
//               </div>
//               <div className="modal-footer bg-light">
//                 <div className="d-flex justify-content-between w-100">
//                   <button type="button" className="btn btn-link text-danger" onClick={handleClear}>
//                     Clear All
//                   </button>
//                   <div className="d-flex gap-2">
//                     <button type="button" className="btn btn-outline-secondary" onClick={toggleFilterModal}>
//                       Cancel
//                     </button>
//                     <button
//                       type="button"
//                       className="btn btn-primary"
//                       onClick={() => {
//                         fetchDebitorsReport();
//                         toggleFilterModal();
//                       }}
//                     >
//                       Apply Filters
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Main Content */}
//       <div className="card shadow-sm">
//         <div className="card-body">
//           {error && <div className="alert alert-danger">{error}</div>}

//           {isLoading ? (
//             <div className="d-flex flex-column align-items-center justify-content-center w-100" style={{ height: "300px" }}>
//               <div className="text-center">
//                 <div className="navbar-brand navbar-brand-autodark">SuitApps</div>
//                 <div className="text-secondary mb-3">Preparing Report</div>
//                 <div className="progress progress-sm">
//                   <div className="progress-bar progress-bar-indeterminate"></div>
//                 </div>
//               </div>
//             </div>
//           ) : (
//             <div style={{ overflowX: "auto" }}>
//               <div style={{ maxHeight: "500px", overflowY: "auto", position: "relative" }}>
//                 <table className="table table-bordered table-striped mb-0">
//                   <thead style={{ position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 2 }}>
//                     <tr>
//                       <th>SI. No</th>
//                       <th>Customer Name</th>
//                       <th>Address</th>
//                       <th>Opening</th>
//                       <th>Debit</th>
//                       <th>Credit</th>
//                       <th>Outstanding</th>
//                       <th>Salesman</th>
//                       <th>Route</th>
//                       <th>Mobile</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {filteredData.length > 0 ? (
//                       <>
//                         {filteredData.map((item, idx) => (
//                           <tr key={idx}>
//                             <td>{idx + 1}</td>
//                             <td>{item.AccountName}</td>
//                             <td>{item.Address}, {item.City}</td>
//                             <td>{formatAmount(item.BalanceBefore)}</td>
//                             <td>{formatAmount(item.DebitAmount)}</td>
//                             <td>{formatAmount(item.CreditAmount)}</td>
//                             <td>{formatAmount(item.Outstanding)}</td>
//                             <td>{item.UserName}</td>
//                             <td>{item.RootName}</td>
//                             <td>{item.Mob}</td>

//                           </tr>
//                         ))}

//                         {/* Sticky Totals Row */}
//                         <tr style={{
//                           fontWeight: "bold",
//                           backgroundColor: "#f0f0f0",
//                           position: "sticky",
//                           bottom: 0,
//                           zIndex: 1
//                         }}>
//                           <td></td>
//                           <td colSpan="2" className="text-end">Total</td>
//                           <td>{formatAmount(filteredData.reduce((sum, item) => sum + item.BalanceBefore, 0))}</td>
//                           <td>{formatAmount(filteredData.reduce((sum, item) => sum + item.DebitAmount, 0))}</td>
//                           <td>{formatAmount(filteredData.reduce((sum, item) => sum + item.CreditAmount, 0))}</td>
//                           <td>{formatAmount(filteredData.reduce((sum, item) => sum + item.Outstanding, 0))}</td>
//                           <td colSpan="2"></td>
//                         </tr>
//                       </>
//                     ) : (
//                       <tr>
//                         <td colSpan="9" className="text-center">No data available for the selected filters.</td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DebitorsReport;
import React, { useState, useEffect } from "react";
import api from '../../apiService';
import { FaSearch, FaFileExcel, FaPrint, FaFilter } from "react-icons/fa";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { usePermission } from '../../../src/context/permissionContex';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DebitorsReport = () => {
  // ── Permissions ──
  const { getPermission, refreshPermissions } = usePermission();
  const permission = getPermission('DEBITORS');
  const canView   = !!permission?.CanView;
  const canExport = !!permission?.CanExport;

  useEffect(() => {
    refreshPermissions();
  }, []);

  const getCurrentDate = () => new Date().toISOString().split("T")[0];
  const getPreviousDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];
  };

  const [fromDate, setFromDate] = useState(getPreviousDate(120));
  const [toDate, setToDate] = useState(getCurrentDate());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [reportData, setReportData] = useState([]);
  const [selectedSalesman, setSelectedSalesman] = useState("All");
  const [selectedRoute, setSelectedRoute] = useState("All");
  const [selectedVan, setSelectedVan] = useState("All");

  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const formatAmount = (amount) => {
    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    });
  };

  const fetchDebitorsReport = async () => {
    if (!canView) return; // ── Permission guard ──
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        FromDate: fromDate,
        ToDate: toDate,
        Salesman: selectedSalesman !== "All" ? selectedSalesman : "",
        Route: selectedRoute !== "All" ? selectedRoute : "",
      });

      const response = await api.get(`/api/DebitorsReport?${params.toString()}`);

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
      console.error("Error fetching debitors report:", err);
      setReportData([]);
      setError("An error occurred while fetching the report.");
      toast.error("Failed to fetch debitors report");
    } finally {
      setIsLoading(false);
    }
  };

  const safeReportData = Array.isArray(reportData) ? reportData : [];

  const uniqueSalesmen = ["All", ...new Set(safeReportData.map((item) => item.UserName).filter(Boolean))];
  const uniqueRoutes = ["All", ...new Set(safeReportData.map((item) => item.RootName).filter(Boolean))];
  const uniqueVans = ["All", ...new Set(safeReportData.map((item) => item.VanName).filter(Boolean))];


  const filteredData = safeReportData.filter(item => {
    const salesmanMatch = selectedSalesman === "All" || item.UserName === selectedSalesman;
    const routeMatch = selectedRoute === "All" || item.RootName === selectedRoute;
    const vanMatch = selectedVan === "All" || item.VanName === selectedVan;
    const customerMatch = item.AccountName?.toLowerCase().includes(searchTerm.toLowerCase());
    return salesmanMatch && routeMatch && vanMatch && customerMatch;
  });


  const handleExportToExcel = () => {
    if (!canExport) { toast.error("You do not have permission to export reports."); return; }
    if (filteredData.length === 0) { toast.error("No data to export."); return; }

    const sheetTitle = ["Debtors Report"];
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
      "Mobile",
    ];

    const dataRows = filteredData.map((item, idx) => ([
      idx + 1,
      item.AccountName,
      `${item.Address}, ${item.City}`,
      item.BalanceBefore,
      item.DebitAmount,
      item.CreditAmount,
      item.Outstanding,
      item.UserName,
      item.RootName,
      item.Mob,
    ]));

    const totalOpening = filteredData.reduce((sum, item) => sum + item.BalanceBefore, 0);
    const totalDebit = filteredData.reduce((sum, item) => sum + item.DebitAmount, 0);
    const totalCredit = filteredData.reduce((sum, item) => sum + item.CreditAmount, 0);
    const totalOutstanding = filteredData.reduce((sum, item) => sum + item.Outstanding, 0);

    const totalRow = [
      "", "Total", "",
      totalOpening,
      totalDebit,
      totalCredit,
      totalOutstanding,
      "", "", ""
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Debtors Report");

    XLSX.writeFile(workbook, `Debtors_Report_${fromDate}_to_${toDate}.xlsx`);
    toast.success("Exported to Excel");
  };

  const handleExportToPDF = () => {
    if (!canExport) { toast.error("You do not have permission to export reports."); return; }
    if (filteredData.length === 0) {
      toast.error("No data to export.");
      return;
    }

    const totalOpening = filteredData.reduce((sum, item) => sum + item.BalanceBefore, 0).toFixed(2);
    const totalDebit = filteredData.reduce((sum, item) => sum + item.DebitAmount, 0).toFixed(2);
    const totalCredit = filteredData.reduce((sum, item) => sum + item.CreditAmount, 0).toFixed(2);
    const totalOutstanding = filteredData.reduce((sum, item) => sum + item.Outstanding, 0).toFixed(2);

    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(16);
    doc.text("Debtors Report", 14, 15);

    doc.setFontSize(10);
    doc.text(`From: ${fromDate}`, 14, 22);
    doc.text(`To: ${toDate}`, 80, 22);

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
      "Mobile",
    ];

    const tableRows = filteredData.map((item, idx) => [
      idx + 1,
      item.AccountName,
      `${item.Address}, ${item.City}`,
      item.BalanceBefore.toFixed(2),
      item.DebitAmount.toFixed(2),
      item.CreditAmount.toFixed(2),
      item.Outstanding.toFixed(2),
      item.UserName,
      item.RootName,
      item.Mob,
    ]);

    tableRows.push([
      { content: "TOTAL", colSpan: 3, styles: { fontStyle: "bold", halign: "center" } },
      { content: totalOpening, styles: { fontStyle: "bold", halign: "right" } },
      { content: totalDebit, styles: { fontStyle: "bold", halign: "right" } },
      { content: totalCredit, styles: { fontStyle: "bold", halign: "right" } },
      { content: totalOutstanding, styles: { fontStyle: "bold", halign: "right" } },
      "", "", ""
    ]);

    doc.autoTable({
      startY: 28,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "hidden",
        valign: "middle",
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
        halign: "center"
      },
      bodyStyles: {
        textColor: [50, 50, 50]
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 30 },
        2: { cellWidth: 40 },
        3: { cellWidth: 20, halign: "right" },
        4: { cellWidth: 20, halign: "right" },
        5: { cellWidth: 20, halign: "right" },
        6: { cellWidth: 20, halign: "right" },
        7: { cellWidth: 20 },
        8: { cellWidth: 20 }
      },
      didParseCell: function (data) {
        const isTotalRow = data.row.raw?.[0]?.content === "TOTAL";
        if (isTotalRow) {
          data.cell.styles.fillColor = [240, 240, 240];
          data.cell.styles.textColor = [0, 0, 0];
          data.cell.styles.fontStyle = "bold";
          if ([3, 4, 5, 6].includes(data.column.index)) {
            data.cell.styles.halign = "right";
          } else {
            data.cell.styles.halign = "center";
          }
        }
      },
      didDrawPage: function (data) {
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(
          `Page ${data.pageNumber}`,
          doc.internal.pageSize.width - 20,
          doc.internal.pageSize.height - 10,
          { align: "right" }
        );
      }
    });

    doc.save(`Debtors_Report_${fromDate}_to_${toDate}.pdf`);
    toast.success("Exported to PDF");
  };

  // ── fetch only when user has view permission ──
  useEffect(() => {
    if (!canView) {
      setReportData([]);
      return;
    }
    fetchDebitorsReport();
  }, [selectedSalesman, selectedRoute, selectedVan, canView]);


  const handleClear = () => {
    const today = getCurrentDate();
    const previousDate = getPreviousDate(120);
    setFromDate(previousDate);
    setToDate(today);
    setSelectedSalesman("All");
    setSelectedRoute("All");
    setSearchTerm("");
    fetchDebitorsReport();
    setSelectedVan("All");
  };

  const toggleFilterModal = () => {
    setIsFilterModalOpen(!isFilterModalOpen);
  };

  // ── Access-denied view, same pattern as TaskManagement/BankReport/ProfitReport ──
  if (!canView) {
    return (
      <div className="container-fluid" style={{ backgroundColor: "white" }}>
        <ToastContainer position="top-center" autoClose={3000} />
        <div className="alert alert-danger mt-3">You do not have permission to view the Debitors Report.</div>
      </div>
    );
  }

  return (
    <div className="container-fluid" style={{ backgroundColor: "white" }}>
      <ToastContainer position="top-center" autoClose={3000} />

      <div className="page-header d-print-none mt-0">
        <h2 className="page-title">Debitors Report</h2>
      </div>

      {/* Search + Filters + Exports - Compact Header */}
      <div className="card shadow-sm mb-3 p-3">
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
          {/* Search - Full width on mobile, then fixed */}
          <div className="w-100 w-md-50">
            <div className="input-group">
              <span className="input-group-text bg-primary text-white">
                <FaSearch />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>


          {/* Action Buttons Group */}
          <div className="d-flex flex-wrap justify-content-end gap-2 w-100 w-md-auto">
            {/* Filter Button */}
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={toggleFilterModal}
            >
              <FaFilter className="me-1" /> Filters
            </button>

            {/* Export Buttons — only shown if user can export */}
            {canExport && (
              <div className="btn-group">
                <button className="btn btn-outline" onClick={handleExportToExcel}>
                  <FaFileExcel className="me-1" /> Excel
                </button>
                <button className="btn btn-outline" onClick={handleExportToPDF}>
                  <FaPrint className="me-1" /> PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header bg-light">
                <h5 className="modal-title text-primary">
                  <FaFilter className="me-2" />
                  Debitors Report Filters
                </h5>
                <button type="button" className="btn-close" onClick={toggleFilterModal} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  fetchDebitorsReport();
                  toggleFilterModal();
                }}>
                  <div className="row g-3">
                    {/* Date Range */}
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

                    {/* Salesman Dropdown */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-muted">SALESMAN</label>
                      <select
                        className="form-select"
                        value={selectedSalesman}
                        onChange={(e) => setSelectedSalesman(e.target.value)}
                      >
                        {uniqueSalesmen.map((salesman, idx) => (
                          <option key={idx} value={salesman}>{salesman}</option>
                        ))}
                      </select>
                    </div>

                    {/* Route Dropdown */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-muted">ROUTE</label>
                      <select
                        className="form-select"
                        value={selectedRoute}
                        onChange={(e) => setSelectedRoute(e.target.value)}
                      >
                        {uniqueRoutes.map((route, idx) => (
                          <option key={idx} value={route}>{route}</option>
                        ))}
                      </select>
                    </div>

                    {/* Van Dropdown */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-muted">VAN</label>
                      <select
                        className="form-select"
                        value={selectedVan}
                        onChange={(e) => setSelectedVan(e.target.value)}
                      >
                        {uniqueVans.map((van, idx) => (
                          <option key={idx} value={van}>{van}</option>
                        ))}
                      </select>
                    </div>

                  </div>
                </form>
              </div>
              <div className="modal-footer bg-light">
                <div className="d-flex justify-content-between w-100">
                  <button type="button" className="btn btn-link text-danger" onClick={handleClear}>
                    Clear All
                  </button>
                  <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={toggleFilterModal}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        fetchDebitorsReport();
                        toggleFilterModal();
                      }}
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="card shadow-sm">
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}

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
            <div style={{ overflowX: "auto" }}>
              <div style={{ maxHeight: "500px", overflowY: "auto", position: "relative" }}>
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
                      <th>Mobile</th>
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
                            <td>{formatAmount(item.BalanceBefore)}</td>
                            <td>{formatAmount(item.DebitAmount)}</td>
                            <td>{formatAmount(item.CreditAmount)}</td>
                            <td>{formatAmount(item.Outstanding)}</td>
                            <td>{item.UserName}</td>
                            <td>{item.RootName}</td>
                            <td>{item.Mob}</td>

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
                          <td>{formatAmount(filteredData.reduce((sum, item) => sum + item.BalanceBefore, 0))}</td>
                          <td>{formatAmount(filteredData.reduce((sum, item) => sum + item.DebitAmount, 0))}</td>
                          <td>{formatAmount(filteredData.reduce((sum, item) => sum + item.CreditAmount, 0))}</td>
                          <td>{formatAmount(filteredData.reduce((sum, item) => sum + item.Outstanding, 0))}</td>
                          <td colSpan="2"></td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center">No data available for the selected filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebitorsReport;