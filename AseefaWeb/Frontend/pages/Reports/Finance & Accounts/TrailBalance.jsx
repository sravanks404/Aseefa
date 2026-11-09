// import React, { useState, useEffect } from "react";
// import api from "../../apiService";
// import DataTable from "react-data-table-component";
// import { FaSearch, FaFileExcel, FaFilter } from "react-icons/fa";
// import * as XLSX from "xlsx";
// import Select from 'react-select';

// const TrailBalance = () => {
//   const getCurrentDate = () => new Date().toISOString().split("T")[0];
//   const getPastDate = (days) => {
//     const date = new Date();
//     date.setDate(date.getDate() - days);
//     return date.toISOString().split("T")[0];
//   };

//   const [toDate, setToDate] = useState(getCurrentDate());
//   const [fromDate, setFromDate] = useState(getPastDate(180));
//   const [result, setResult] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [TypeFilter, setTypeFilter] = useState("");
//   const [distinctType, setDistinctType] = useState([]);
//   const [summary, setSummary] = useState({ LedgerCount: 0, totalDebit: 0, totalCredit: 0 });
//   const [searchQuery, setSearchQuery] = useState("");
//   const [allResults, setAllResults] = useState([]);
//   const [expandedGroups, setExpandedGroups] = useState({});


//   const [progress, setProgress] = useState(0);

//   useEffect(() => {
//     setProgress(0); // Reset progress to 0 whenever dependencies change

//     const duration = 40000; // 1 minute in milliseconds
//     const intervalTime = 1000; // 1 second
//     const increment = 100 / (duration / intervalTime);

//     const interval = setInterval(() => {
//       setProgress(prev => {
//         const next = prev + increment;
//         if (next >= 100) {
//           clearInterval(interval);
//           return 100;
//         }
//         return next;
//       });
//     }, intervalTime);

//     return () => clearInterval(interval); // Cleanup on unmount or dependency change
//   }, [fromDate, toDate]);




//   const formatAmount = (val) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(val || 0);

//   const fetchLedgerAll = async () => {
//     setIsLoading(true);
//     setError("");
//     setProgress(0); // Reset progress when fetch starts

//     try {
//       const CompanyID = sessionStorage.getItem("CompanyID");
//       const response = await api.get("/api/TrailBalance", {
//         params: { CompanyID, FromDate: fromDate, ToDate: toDate }
//       });

//       const data = response?.data || [];
//       setAllResults(data);

//       const uniqueType = [...new Set(data.map(order => order.Type))];
//       setDistinctType(uniqueType);

//       updateFilteredResults(data, TypeFilter);
//     } catch (err) {
//       console.error("Error fetching ledger data:", err);
//       setError("Failed to fetch ledger data. Please try again.");
//       setResult([]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const updateFilteredResults = (data, filter) => {
//     let filteredResults = filter ? data.filter(order => order.Type === filter) : data;

//     const LedgerCount = new Set(filteredResults.map(order => order.AcHead)).size;
//     const totalDebit = filteredResults.reduce((sum, order) => sum + parseFloat(order.Debit || 0), 0);
//     const totalCredit = filteredResults.reduce((sum, order) => sum + parseFloat(order.Credit || 0), 0);

//     setSummary({ LedgerCount, totalDebit, totalCredit });
//     setResult(filteredResults);
//   };

//   useEffect(() => {
//     fetchLedgerAll();
//   }, []);

//   useEffect(() => {
//     updateFilteredResults(allResults, TypeFilter);
//   }, [TypeFilter, allResults]);

//   const handleClear = () => {
//     setFromDate(getPastDate(30));
//     setToDate(getCurrentDate());
//     setTypeFilter("");
//     setError("");
//     setSearchQuery("");
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     fetchLedgerAll();
//   };

//   const exportLedgerExcel = () => {
//     if (!filteredResults.length) {
//       alert("No data to export.");
//       return;
//     }

//     const companyInfo = JSON.parse(sessionStorage.getItem("companyResponse")) || {};
//     const { CompanyName = "", District = "", GSTinNo = "" } = companyInfo;

//     const totalDebit = filteredResults.reduce((sum, row) => sum + (row.Debit || 0), 0);
//     const totalCredit = filteredResults.reduce((sum, row) => sum + (row.Credit || 0), 0);
//     const totalOpening = filteredResults.reduce((sum, row) => sum + (row.OpeningBalance || 0), 0);
//     const totalClosing = filteredResults.reduce(
//       (sum, row) => sum + ((row.Debit || 0) - (row.Credit || 0)),
//       0
//     );
//     const dataForExcel = filteredResults.map((row, index) => ({
//       "SL.No": index + 1,
//       "Head": row.Type || "N/A",
//       "Ledger": row.Name || "N/A",
//       "Opening Balance": typeof row.OpeningBalance === 'number' ? parseFloat(row.OpeningBalance.toFixed(2)) : 0.00,
//       "Debit": typeof row.Debit === 'number' ? parseFloat(row.Debit.toFixed(2)) : 0.00,
//       "Credit": typeof row.Credit === 'number' ? parseFloat(row.Credit.toFixed(2)) : 0.00,
//       "Closing Balance": typeof row.ClosingBalance === 'number' ? parseFloat(row.ClosingBalance.toFixed(2)) : 0.00,
//     }));

//     dataForExcel.push({
//       "SL.No": "",
//       "Head": "",
//       "Ledger": "TOTAL",
//       "Opening Balance": parseFloat(totalOpening.toFixed(2)),
//       "Debit": parseFloat(totalDebit.toFixed(2)),
//       "Credit": parseFloat(totalCredit.toFixed(2)),
//       "Closing Balance": parseFloat(totalClosing.toFixed(2)),
//     });

//     // Build metadata rows
//     const metaInfo = [
//       [(CompanyName || "Company Name").toUpperCase()],
//       [`${District.toUpperCase()}`],
//       [`From Date: ${fromDate}   To Date: ${toDate}`],
//       [], // Spacer before table
//     ];

//     const ws = XLSX.utils.json_to_sheet(dataForExcel, { origin: 'A5' }); // Start data from A5

//     // Insert metaInfo before data rows
//     XLSX.utils.sheet_add_aoa(ws, metaInfo, { origin: 'A1' });

//     // Merges for headers
//     ws['!merges'] = [
//       { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Company Name
//       { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // District
//       { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }, // From/To Date
//     ];

//     ws['!cols'] = [
//       { wch: 8 },   // SL.No
//       { wch: 15 },  // Head
//       { wch: 25 },  // Ledger
//       { wch: 18 },  // Opening Balance
//       { wch: 12 },  // Debit
//       { wch: 12 },  // Credit
//       { wch: 18 },  // Closing Balance
//     ];

//     // Alignment
//     const range = XLSX.utils.decode_range(ws['!ref']);
//     for (let R = 4; R <= range.e.r; ++R) { // Data starts at row 5 (0-indexed = 4)
//       for (let C = 0; C <= 6; ++C) {
//         const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
//         const cell = ws[cellRef];
//         if (cell) {
//           cell.s = {
//             ...cell.s,
//             alignment: { horizontal: C <= 2 ? "left" : "right" }
//           };
//         }
//       }
//     }

//     // Bold styling for total row
//     const totalRowIndex = dataForExcel.length + 4;
//     ['C', 'D', 'E', 'F', 'G'].forEach((col) => {
//       const cell = ws[`${col}${totalRowIndex}`];
//       if (cell) cell.s = { ...cell.s, font: { bold: true } };
//     });

//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Trail_Balance");
//     XLSX.writeFile(wb, `Trail_Balance_Ledger${fromDate}_to_${toDate}.xlsx`);
//   };

//   const exportGroupExcel = () => {
//     if (!filteredResults.length) {
//       alert("No data to export.");
//       return;
//     }

//     const companyInfo = JSON.parse(sessionStorage.getItem("companyResponse")) || {};
//     const { CompanyName = "", District = "", GSTinNo = "" } = companyInfo;

//     const grouped = groupBy(filteredResults, "Type");

//     const dataForExcel = Object.entries(grouped).map(([type, group], index) => ({
//       "SL.No": index + 1,
//       "Group": type || "N/A",
//       "Opening Balance": parseFloat((group.totalOpening || 0).toFixed(2)),
//       "Debit": parseFloat((group.totalDebit || 0).toFixed(2)),
//       "Credit": parseFloat((group.totalCredit || 0).toFixed(2)),
//       "Closing Balance": parseFloat((group.totalClosing || 0).toFixed(2)),
//     }));

//     // Grand Totals
//     const totalOpening = dataForExcel.reduce((sum, row) => sum + row["Opening Balance"], 0);
//     const totalDebit = dataForExcel.reduce((sum, row) => sum + row["Debit"], 0);
//     const totalCredit = dataForExcel.reduce((sum, row) => sum + row["Credit"], 0);
//     const totalClosing = filteredResults.reduce(
//       (sum, row) => sum + ((row.Debit || 0) - (row.Credit || 0)),
//       0
//     );
//     dataForExcel.push({
//       "SL.No": "",
//       "Group": "TOTAL",
//       "Opening Balance": parseFloat(totalOpening.toFixed(2)),
//       "Debit": parseFloat(totalDebit.toFixed(2)),
//       "Credit": parseFloat(totalCredit.toFixed(2)),
//       "Closing Balance": parseFloat(totalClosing.toFixed(2)),
//     });

//     const metaInfo = [
//       [(CompanyName || "Company Name").toUpperCase()],
//       [`${District.toUpperCase()}`],
//       [`From Date: ${fromDate}   To Date: ${toDate}`],
//       [],
//     ];

//     const ws = XLSX.utils.json_to_sheet(dataForExcel, { origin: 'A5' });
//     XLSX.utils.sheet_add_aoa(ws, metaInfo, { origin: 'A1' });

//     ws['!merges'] = [
//       { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
//       { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
//       { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
//     ];

//     ws['!cols'] = [
//       { wch: 8 },   // SL.No
//       { wch: 20 },  // Group
//       { wch: 18 },  // Opening Balance
//       { wch: 12 },  // Debit
//       { wch: 12 },  // Credit
//       { wch: 18 },  // Closing Balance
//     ];

//     const totalRowIndex = dataForExcel.length + 4;
//     ['B', 'C', 'D', 'E', 'F'].forEach((col) => {
//       const cell = ws[`${col}${totalRowIndex}`];
//       if (cell) cell.s = { ...cell.s, font: { bold: true } };
//     });

//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Group_Summary");
//     XLSX.writeFile(wb, `Trail_Balance_Group_${fromDate}_to_${toDate}.xlsx`);
//   };


//   const filteredResults = result.filter((row) => {
//     return (
//       (row.Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         (row.RetailBillNo?.toString().includes(searchQuery)) ||
//         (row.Debit?.toString().includes(searchQuery)) ||
//         (row.Credit?.toString().includes(searchQuery))
//       ));
//   });

//   const groupBy = (data, key) => {
//     return data.reduce((result, item) => {
//       if (!result[item[key]]) {
//         result[item[key]] = { items: [], totalDebit: 0, totalCredit: 0 };
//       }
//       result[item[key]].items.push(item);
//       result[item[key]].totalOpening = (result[item[key]].totalOpening || 0) + parseFloat(item.OpeningBalance || 0);
//       result[item[key]].totalClosing = (result[item[key]].totalClosing || 0) + parseFloat(item.ClosingBalance || 0);
//       result[item[key]].totalDebit += parseFloat(item.Debit || 0);
//       result[item[key]].totalCredit += parseFloat(item.Credit || 0);
//       return result;
//     }, {});
//   };

//   const groupedData = groupBy(filteredResults, "Type");

//   const toggleGroup = (groupName) => {
//     setExpandedGroups((prev) => ({
//       ...prev,
//       [groupName]: !prev[groupName],
//     }));
//   };

//   return (
//     <div className="container-fluid" style={{ backgroundColor: "white" }}>
//       {/* Header with Search and Export Buttons */}
//       <div className="card shadow-sm mb-3 p-3">
//         <h4 className="text-primary">Trail Balance</h4>
//         <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
//           {/* Search Input with Group Filter */}
//           <div className="w-100 w-md-50">
//             <div className="input-group" style={{ border: "1px solid #dee2e6", borderRadius: "4px" }}>
//               <span className="input-group-text" style={{ backgroundColor: '#0056A6', border: 'none', borderTopLeftRadius: '4px', borderBottomLeftRadius: '4px' }}>
//                 <FaSearch className="text-white" />
//               </span>
//               <input
//                 type="text"
//                 className="form-control border-0"
//                 placeholder="Search by Ledger, Debit,Credit"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 style={{ boxShadow: "none" }}
//               />
//               <div className="border-start" style={{ width: "180px" }}>
//                 <Select
//                   options={distinctType.map(type => ({
//                     value: type,
//                     label: type
//                   }))}
//                   value={TypeFilter ? {
//                     value: TypeFilter,
//                     label: TypeFilter
//                   } : null}
//                   onChange={(selectedOption) => {
//                     setTypeFilter(selectedOption?.value || "");
//                   }}
//                   placeholder="Group Name"
//                   isClearable
//                   isSearchable
//                   className="border-0"
//                   styles={{
//                     control: (base) => ({
//                       ...base,
//                       minHeight: '38px',
//                       border: 'none',
//                       boxShadow: 'none',
//                       backgroundColor: 'transparent',
//                       '&:hover': {
//                         borderColor: 'transparent'
//                       }
//                     }),
//                     valueContainer: (base) => ({
//                       ...base,
//                       padding: '0 8px'
//                     }),
//                     indicatorsContainer: (base) => ({
//                       ...base,
//                       paddingRight: '0'
//                     }),
//                     indicatorSeparator: () => ({ display: 'none' }),
//                     dropdownIndicator: (base) => ({
//                       ...base,
//                       padding: '0 4px',
//                       color: '#6c757d',
//                       '&:hover': {
//                         color: '#495057'
//                       }
//                     }),
//                     menu: (base) => ({
//                       ...base,
//                       zIndex: 9999,
//                       width: 'auto',
//                       minWidth: '100%'
//                     }),
//                     placeholder: (base) => ({
//                       ...base,
//                       color: '#6c757d',
//                       fontSize: '0.875rem',
//                       margin: 0
//                     }),
//                     singleValue: (base) => ({
//                       ...base,
//                       margin: 0
//                     })
//                   }}
//                   components={{
//                     DropdownIndicator: () => (
//                       <div className="pe-3">
//                         <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
//                           <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
//                         </svg>
//                       </div>
//                     )
//                   }}
//                   noOptionsMessage={() => "No groups found"}
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Action Buttons */}
//           <div className="d-flex flex-wrap justify-content-end gap-2 w-100 w-md-auto">
//             {/* Filter Button */}
//             <button
//               type="button"
//               className="btn btn-outline-primary"
//               data-bs-toggle="modal"
//               data-bs-target="#filterModal"
//             >
//               <FaFilter className="me-1" /> Filters
//             </button>

//             {/* Export Button */}
//             <button className="btn btn-outline" onClick={exportLedgerExcel}>
//               <FaFileExcel className="me-1" /> Ledger
//             </button>

//             <button className="btn btn-outline" onClick={exportGroupExcel}>
//               <FaFileExcel className="me-1" /> Group
//             </button>

//           </div>
//         </div>
//       </div>

//       {/* Filter Modal */}
//       <div className="modal fade" id="filterModal" tabIndex="-1" aria-labelledby="filterModalLabel" aria-hidden="true">
//         <div className="modal-dialog">
//           <div className="modal-content">
//             <div className="modal-header bg-light">
//               <h5 className="modal-title text-primary" id="filterModalLabel">
//                 <FaFilter className="me-2" />
//                 Trail Balance Filters
//               </h5>
//               <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
//             </div>

//             <div className="modal-body">
//               <form onSubmit={handleSubmit}>
//                 {/* Date Range Row */}
//                 <div className="row mb-3 g-3">
//                   <div className="col-md-6">
//                     <label htmlFor="FromDate" className="form-label fw-bold small text-muted">FROM DATE</label>
//                     <input
//                       type="date"
//                       id="FromDate"
//                       className="form-control"
//                       value={fromDate}
//                       onChange={(e) => setFromDate(e.target.value)}
//                     />
//                   </div>
//                   <div className="col-md-6">
//                     <label htmlFor="ToDate" className="form-label fw-bold small text-muted">TO DATE</label>
//                     <input
//                       type="date"
//                       id="ToDate"
//                       className="form-control"
//                       value={toDate}
//                       onChange={(e) => setToDate(e.target.value)}
//                     />
//                   </div>
//                 </div>


//               </form>
//             </div>

//             <div className="modal-footer bg-light">
//               <div className="d-flex justify-content-between w-100">
//                 <button type="button" className="btn btn-link text-danger" onClick={handleClear} disabled={isLoading}>
//                   Clear All
//                 </button>
//                 <div className="d-flex gap-2">
//                   <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">
//                     Cancel
//                   </button>
//                   <button
//                     type="button"
//                     className="btn btn-primary"
//                     data-bs-dismiss="modal"
//                     onClick={handleSubmit}
//                   >
//                     Apply Filters
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Data Table Section */}
//       <div className="card mt-4">
//         <div className="card-body">
//           {isLoading ? (
//             <div className="d-flex flex-column align-items-center justify-content-center vh-50">
//               <div className="text-center">
//                 <div className="mb-3">
//                   <a href="." className="navbar-brand navbar-brand-autodark">
//                     SuitApps
//                   </a>
//                 </div>
//                 <div className="text-secondary mb-3">Preparing Report</div>

//                 {/* Indeterminate Progress */}
//                 <div className="progress progress-sm mb-2">
//                   <div className="progress-bar progress-bar-indeterminate"></div>
//                 </div>

//                 {/* Green Determinate Progress */}
//                 <div className="progress progress-sm" style={{ height: "8px" }}>
//                   <div
//                     className="progress-bar bg-success"
//                     role="progressbar"
//                     style={{ width: `${progress}%` }}
//                     aria-valuenow={progress}
//                     aria-valuemin="0"
//                     aria-valuemax="100"
//                   />
//                 </div>
//                 <small className="text-muted mt-1">{Math.floor(progress)}%</small>
//               </div>
//             </div>
//           ) : filteredResults.length > 0 ? (
//             <div className="table-responsive">
//               <table className="table table-bordered">
//                 <thead>
//                   <tr>
//                     <th>Ledger</th>
//                     <th>Opening Balance</th>
//                     <th>Debit</th>
//                     <th>Credit</th>
//                     <th>Closing Balance</th>
//                   </tr>
//                 </thead>

//                 <tbody>
//                   {Object.entries(groupedData).map(([groupName, group]) => (
//                     <>
//                       {/* Group Header Row */}
//                       <tr key={groupName} onClick={() => toggleGroup(groupName)} style={{ cursor: "pointer", backgroundColor: "#f8f9fa" }}>
//                         <td><strong>{groupName}</strong></td>
//                         <td><strong>{group.totalOpening?.toFixed(2) ?? "0.00"}</strong></td>
//                         <td><strong>{group.totalDebit.toFixed(2)}</strong></td>
//                         <td><strong>{group.totalCredit.toFixed(2)}</strong></td>
//                         <td><strong>{group.totalClosing?.toFixed(2) ?? "0.00"}</strong></td>
//                       </tr>

//                       {/* Grouped Details (Expandable) */}
//                       {expandedGroups[groupName] &&
//                         group.items.map((row, index) => (
//                           <tr key={`${groupName}-${index}`}>
//                             <td>{row.Name}</td>
//                             <td>{parseFloat(row.OpeningBalance || 0).toFixed(2)}</td>
//                             <td>{parseFloat(row.Debit || 0).toFixed(2)}</td>
//                             <td>{parseFloat(row.Credit || 0).toFixed(2)}</td>
//                             <td>{parseFloat(row.ClosingBalance || 0).toFixed(2)}</td>
//                           </tr>
//                         ))
//                       }
//                     </>
//                   ))}

//                   {/* Grand Total Row */}
//                   <tr style={{ backgroundColor: "#e9ecef", fontWeight: "bold" }}>
//                     <td>Grand Total</td>
//                     <td>{Object.values(groupedData).reduce((sum, group) => sum + (group.totalOpening || 0), 0).toFixed(2)}</td>
//                     <td>{Object.values(groupedData).reduce((sum, group) => sum + group.totalDebit, 0).toFixed(2)}</td>
//                     <td>{Object.values(groupedData).reduce((sum, group) => sum + group.totalCredit, 0).toFixed(2)}</td>
//                     <td>{
//                       Object.values(groupedData).reduce((sum, group) =>
//                         sum + ((group.totalDebit || 0) - (group.totalCredit || 0)), 0
//                       ).toFixed(2)
//                     }</td>
//                     {/* <td>{
//                       Object.values(groupedData).reduce((sum, group) =>
//                         sum + ((group.totalOpening || 0) + (group.totalDebit || 0) - (group.totalCredit || 0)), 0
//                       ).toFixed(2)
//                     }</td> */}
//                   </tr>
//                 </tbody>
//               </table>
//             </div>
//           ) : (
//             <div className="text-center text-muted">
//               No data available
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TrailBalance;
import React, { useState, useEffect } from "react";
import api from "../../apiService";
import DataTable from "react-data-table-component";
import { FaSearch, FaFileExcel, FaFilter } from "react-icons/fa";
import * as XLSX from "xlsx";
import Select from 'react-select';
import { usePermission } from '../../../src/context/permissionContex';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TrailBalance = () => {
  // ── Permissions ──
  const { getPermission, refreshPermissions } = usePermission();
  const permission = getPermission('TRIAL_BALANCE');
  const canView   = !!permission?.CanView;
  const canExport = !!permission?.CanExport;

  useEffect(() => {
    refreshPermissions();
  }, []);

  const getCurrentDate = () => new Date().toISOString().split("T")[0];
  const getPastDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];
  };

  const [toDate, setToDate] = useState(getCurrentDate());
  const [fromDate, setFromDate] = useState(getPastDate(180));
  const [result, setResult] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [TypeFilter, setTypeFilter] = useState("");
  const [distinctType, setDistinctType] = useState([]);
  const [summary, setSummary] = useState({ LedgerCount: 0, totalDebit: 0, totalCredit: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [allResults, setAllResults] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});


  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0); // Reset progress to 0 whenever dependencies change

    const duration = 40000; // 1 minute in milliseconds
    const intervalTime = 1000; // 1 second
    const increment = 100 / (duration / intervalTime);

    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(interval); // Cleanup on unmount or dependency change
  }, [fromDate, toDate]);




  const formatAmount = (val) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(val || 0);

  const fetchLedgerAll = async () => {
    if (!canView) return; // ── Permission guard ──

    setIsLoading(true);
    setError("");
    setProgress(0); // Reset progress when fetch starts

    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      const response = await api.get("/api/TrailBalance", {
        params: { CompanyID, FromDate: fromDate, ToDate: toDate }
      });

      const rawData = response?.data;
      const data = Array.isArray(rawData)
        ? rawData
        : (rawData && Array.isArray(rawData.data))
        ? rawData.data
        : [];
      setAllResults(data);

      const uniqueType = [...new Set(data.map(order => order?.Type).filter(Boolean))];
      setDistinctType(uniqueType);

      updateFilteredResults(data, TypeFilter);
    } catch (err) {
      console.error("Error fetching ledger data:", err);
      setError("Failed to fetch ledger data. Please try again.");
      toast.error("Failed to fetch ledger data.");
      setAllResults([]);
      setResult([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFilteredResults = (data, filter) => {
    const safeData = Array.isArray(data) ? data : [];
    let filteredResults = filter ? safeData.filter(order => order?.Type === filter) : safeData;

    const LedgerCount = new Set(filteredResults.map(order => order?.AcHead).filter(Boolean)).size;
    const totalDebit = filteredResults.reduce((sum, order) => sum + parseFloat(order?.Debit || 0), 0);
    const totalCredit = filteredResults.reduce((sum, order) => sum + parseFloat(order?.Credit || 0), 0);

    setSummary({ LedgerCount, totalDebit, totalCredit });
    setResult(filteredResults);
  };

  useEffect(() => {
    if (!canView) {
      setAllResults([]);
      setResult([]);
      return;
    }
    fetchLedgerAll();
  }, [canView]);

  useEffect(() => {
    updateFilteredResults(allResults, TypeFilter);
  }, [TypeFilter, allResults]);

  const handleClear = () => {
    setFromDate(getPastDate(30));
    setToDate(getCurrentDate());
    setTypeFilter("");
    setError("");
    setSearchQuery("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchLedgerAll();
  };

  const exportLedgerExcel = () => {
    if (!canExport) { toast.error("You do not have permission to export reports."); return; }

    if (!filteredResults.length) {
      alert("No data to export.");
      return;
    }

    const companyInfo = JSON.parse(sessionStorage.getItem("companyResponse")) || {};
    const { CompanyName = "", District = "", GSTinNo = "" } = companyInfo;

    const totalDebit = filteredResults.reduce((sum, row) => sum + (row.Debit || 0), 0);
    const totalCredit = filteredResults.reduce((sum, row) => sum + (row.Credit || 0), 0);
    const totalOpening = filteredResults.reduce((sum, row) => sum + (row.OpeningBalance || 0), 0);
    const totalClosing = filteredResults.reduce(
      (sum, row) => sum + ((row.Debit || 0) - (row.Credit || 0)),
      0
    );
    const dataForExcel = filteredResults.map((row, index) => ({
      "SL.No": index + 1,
      "Head": row.Type || "N/A",
      "Ledger": row.Name || "N/A",
      "Opening Balance": typeof row.OpeningBalance === 'number' ? parseFloat(row.OpeningBalance.toFixed(2)) : 0.00,
      "Debit": typeof row.Debit === 'number' ? parseFloat(row.Debit.toFixed(2)) : 0.00,
      "Credit": typeof row.Credit === 'number' ? parseFloat(row.Credit.toFixed(2)) : 0.00,
      "Closing Balance": typeof row.ClosingBalance === 'number' ? parseFloat(row.ClosingBalance.toFixed(2)) : 0.00,
    }));

    dataForExcel.push({
      "SL.No": "",
      "Head": "",
      "Ledger": "TOTAL",
      "Opening Balance": parseFloat(totalOpening.toFixed(2)),
      "Debit": parseFloat(totalDebit.toFixed(2)),
      "Credit": parseFloat(totalCredit.toFixed(2)),
      "Closing Balance": parseFloat(totalClosing.toFixed(2)),
    });

    // Build metadata rows
    const metaInfo = [
      [(CompanyName || "Company Name").toUpperCase()],
      [`${District.toUpperCase()}`],
      [`From Date: ${fromDate}   To Date: ${toDate}`],
      [], // Spacer before table
    ];

    const ws = XLSX.utils.json_to_sheet(dataForExcel, { origin: 'A5' }); // Start data from A5

    // Insert metaInfo before data rows
    XLSX.utils.sheet_add_aoa(ws, metaInfo, { origin: 'A1' });

    // Merges for headers
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Company Name
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // District
      { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }, // From/To Date
    ];

    ws['!cols'] = [
      { wch: 8 },   // SL.No
      { wch: 15 },  // Head
      { wch: 25 },  // Ledger
      { wch: 18 },  // Opening Balance
      { wch: 12 },  // Debit
      { wch: 12 },  // Credit
      { wch: 18 },  // Closing Balance
    ];

    // Alignment
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = 4; R <= range.e.r; ++R) { // Data starts at row 5 (0-indexed = 4)
      for (let C = 0; C <= 6; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[cellRef];
        if (cell) {
          cell.s = {
            ...cell.s,
            alignment: { horizontal: C <= 2 ? "left" : "right" }
          };
        }
      }
    }

    // Bold styling for total row
    const totalRowIndex = dataForExcel.length + 4;
    ['C', 'D', 'E', 'F', 'G'].forEach((col) => {
      const cell = ws[`${col}${totalRowIndex}`];
      if (cell) cell.s = { ...cell.s, font: { bold: true } };
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trail_Balance");
    XLSX.writeFile(wb, `Trail_Balance_Ledger${fromDate}_to_${toDate}.xlsx`);
    toast.success("Exported to Excel");
  };

  const exportGroupExcel = () => {
    if (!canExport) { toast.error("You do not have permission to export reports."); return; }

    if (!filteredResults.length) {
      alert("No data to export.");
      return;
    }

    const companyInfo = JSON.parse(sessionStorage.getItem("companyResponse")) || {};
    const { CompanyName = "", District = "", GSTinNo = "" } = companyInfo;

    const grouped = groupBy(filteredResults, "Type");

    const dataForExcel = Object.entries(grouped).map(([type, group], index) => ({
      "SL.No": index + 1,
      "Group": type || "N/A",
      "Opening Balance": parseFloat((group.totalOpening || 0).toFixed(2)),
      "Debit": parseFloat((group.totalDebit || 0).toFixed(2)),
      "Credit": parseFloat((group.totalCredit || 0).toFixed(2)),
      "Closing Balance": parseFloat((group.totalClosing || 0).toFixed(2)),
    }));

    // Grand Totals
    const totalOpening = dataForExcel.reduce((sum, row) => sum + row["Opening Balance"], 0);
    const totalDebit = dataForExcel.reduce((sum, row) => sum + row["Debit"], 0);
    const totalCredit = dataForExcel.reduce((sum, row) => sum + row["Credit"], 0);
    const totalClosing = filteredResults.reduce(
      (sum, row) => sum + ((row.Debit || 0) - (row.Credit || 0)),
      0
    );
    dataForExcel.push({
      "SL.No": "",
      "Group": "TOTAL",
      "Opening Balance": parseFloat(totalOpening.toFixed(2)),
      "Debit": parseFloat(totalDebit.toFixed(2)),
      "Credit": parseFloat(totalCredit.toFixed(2)),
      "Closing Balance": parseFloat(totalClosing.toFixed(2)),
    });

    const metaInfo = [
      [(CompanyName || "Company Name").toUpperCase()],
      [`${District.toUpperCase()}`],
      [`From Date: ${fromDate}   To Date: ${toDate}`],
      [],
    ];

    const ws = XLSX.utils.json_to_sheet(dataForExcel, { origin: 'A5' });
    XLSX.utils.sheet_add_aoa(ws, metaInfo, { origin: 'A1' });

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
    ];

    ws['!cols'] = [
      { wch: 8 },   // SL.No
      { wch: 20 },  // Group
      { wch: 18 },  // Opening Balance
      { wch: 12 },  // Debit
      { wch: 12 },  // Credit
      { wch: 18 },  // Closing Balance
    ];

    const totalRowIndex = dataForExcel.length + 4;
    ['B', 'C', 'D', 'E', 'F'].forEach((col) => {
      const cell = ws[`${col}${totalRowIndex}`];
      if (cell) cell.s = { ...cell.s, font: { bold: true } };
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Group_Summary");
    XLSX.writeFile(wb, `Trail_Balance_Group_${fromDate}_to_${toDate}.xlsx`);
    toast.success("Exported to Excel");
  };


  const safeResult = Array.isArray(result) ? result : [];

  const filteredResults = safeResult.filter((row) => {
    return (
      (row.Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (row.RetailBillNo?.toString().includes(searchQuery)) ||
        (row.Debit?.toString().includes(searchQuery)) ||
        (row.Credit?.toString().includes(searchQuery))
      ));
  });

  const groupBy = (data, key) => {
    return data.reduce((result, item) => {
      if (!result[item[key]]) {
        result[item[key]] = { items: [], totalDebit: 0, totalCredit: 0 };
      }
      result[item[key]].items.push(item);
      result[item[key]].totalOpening = (result[item[key]].totalOpening || 0) + parseFloat(item.OpeningBalance || 0);
      result[item[key]].totalClosing = (result[item[key]].totalClosing || 0) + parseFloat(item.ClosingBalance || 0);
      result[item[key]].totalDebit += parseFloat(item.Debit || 0);
      result[item[key]].totalCredit += parseFloat(item.Credit || 0);
      return result;
    }, {});
  };

  const groupedData = groupBy(filteredResults, "Type");

  const toggleGroup = (groupName) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  // ── Access-denied view ──
  if (!canView) {
    return (
      <div className="container-fluid" style={{ backgroundColor: "white" }}>
        <ToastContainer position="top-center" autoClose={3000} />
        <div className="alert alert-danger mt-3">You do not have permission to view Trial Balance.</div>
      </div>
    );
  }

  return (
    <div className="container-fluid" style={{ backgroundColor: "white" }}>
      <ToastContainer position="top-center" autoClose={3000} />

      {/* Header with Search and Export Buttons */}
      <div className="card shadow-sm mb-3 p-3">
        <h4 className="text-primary">Trail Balance</h4>
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
          {/* Search Input with Group Filter */}
          <div className="w-100 w-md-50">
            <div className="input-group" style={{ border: "1px solid #dee2e6", borderRadius: "4px" }}>
              <span className="input-group-text" style={{ backgroundColor: '#0056A6', border: 'none', borderTopLeftRadius: '4px', borderBottomLeftRadius: '4px' }}>
                <FaSearch className="text-white" />
              </span>
              <input
                type="text"
                className="form-control border-0"
                placeholder="Search by Ledger, Debit,Credit"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ boxShadow: "none" }}
              />
              <div className="border-start" style={{ width: "180px" }}>
                <Select
                  options={distinctType.map(type => ({
                    value: type,
                    label: type
                  }))}
                  value={TypeFilter ? {
                    value: TypeFilter,
                    label: TypeFilter
                  } : null}
                  onChange={(selectedOption) => {
                    setTypeFilter(selectedOption?.value || "");
                  }}
                  placeholder="Group Name"
                  isClearable
                  isSearchable
                  className="border-0"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '38px',
                      border: 'none',
                      boxShadow: 'none',
                      backgroundColor: 'transparent',
                      '&:hover': {
                        borderColor: 'transparent'
                      }
                    }),
                    valueContainer: (base) => ({
                      ...base,
                      padding: '0 8px'
                    }),
                    indicatorsContainer: (base) => ({
                      ...base,
                      paddingRight: '0'
                    }),
                    indicatorSeparator: () => ({ display: 'none' }),
                    dropdownIndicator: (base) => ({
                      ...base,
                      padding: '0 4px',
                      color: '#6c757d',
                      '&:hover': {
                        color: '#495057'
                      }
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 9999,
                      width: 'auto',
                      minWidth: '100%'
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: '#6c757d',
                      fontSize: '0.875rem',
                      margin: 0
                    }),
                    singleValue: (base) => ({
                      ...base,
                      margin: 0
                    })
                  }}
                  components={{
                    DropdownIndicator: () => (
                      <div className="pe-3">
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )
                  }}
                  noOptionsMessage={() => "No groups found"}
                />
              </div>
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
            {canExport && (
              <>
                <button className="btn btn-outline" onClick={exportLedgerExcel}>
                  <FaFileExcel className="me-1" /> Ledger
                </button>

                <button className="btn btn-outline" onClick={exportGroupExcel}>
                  <FaFileExcel className="me-1" /> Group
                </button>
              </>
            )}

          </div>
        </div>
      </div>

      {/* Filter Modal */}
      <div className="modal fade" id="filterModal" tabIndex="-1" aria-labelledby="filterModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header bg-light">
              <h5 className="modal-title text-primary" id="filterModalLabel">
                <FaFilter className="me-2" />
                Trail Balance Filters
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                {/* Date Range Row */}
                <div className="row mb-3 g-3">
                  <div className="col-md-6">
                    <label htmlFor="FromDate" className="form-label fw-bold small text-muted">FROM DATE</label>
                    <input
                      type="date"
                      id="FromDate"
                      className="form-control"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
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
                    />
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
                    type="button"
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
      <div className="card mt-4">
        <div className="card-body">
          {isLoading ? (
            <div className="d-flex flex-column align-items-center justify-content-center vh-50">
              <div className="text-center">
                <div className="mb-3">
                  <a href="." className="navbar-brand navbar-brand-autodark">
                    SuitApps
                  </a>
                </div>
                <div className="text-secondary mb-3">Preparing Report</div>

                {/* Indeterminate Progress */}
                <div className="progress progress-sm mb-2">
                  <div className="progress-bar progress-bar-indeterminate"></div>
                </div>

                {/* Green Determinate Progress */}
                <div className="progress progress-sm" style={{ height: "8px" }}>
                  <div
                    className="progress-bar bg-success"
                    role="progressbar"
                    style={{ width: `${progress}%` }}
                    aria-valuenow={progress}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  />
                </div>
                <small className="text-muted mt-1">{Math.floor(progress)}%</small>
              </div>
            </div>
          ) : filteredResults.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Ledger</th>
                    <th>Opening Balance</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Closing Balance</th>
                  </tr>
                </thead>

                <tbody>
                  {Object.entries(groupedData).map(([groupName, group]) => (
                    <>
                      {/* Group Header Row */}
                      <tr key={groupName} onClick={() => toggleGroup(groupName)} style={{ cursor: "pointer", backgroundColor: "#f8f9fa" }}>
                        <td><strong>{groupName}</strong></td>
                        <td><strong>{group.totalOpening?.toFixed(2) ?? "0.00"}</strong></td>
                        <td><strong>{group.totalDebit.toFixed(2)}</strong></td>
                        <td><strong>{group.totalCredit.toFixed(2)}</strong></td>
                        <td><strong>{group.totalClosing?.toFixed(2) ?? "0.00"}</strong></td>
                      </tr>

                      {/* Grouped Details (Expandable) */}
                      {expandedGroups[groupName] &&
                        group.items.map((row, index) => (
                          <tr key={`${groupName}-${index}`}>
                            <td>{row.Name}</td>
                            <td>{parseFloat(row.OpeningBalance || 0).toFixed(2)}</td>
                            <td>{parseFloat(row.Debit || 0).toFixed(2)}</td>
                            <td>{parseFloat(row.Credit || 0).toFixed(2)}</td>
                            <td>{parseFloat(row.ClosingBalance || 0).toFixed(2)}</td>
                          </tr>
                        ))
                      }
                    </>
                  ))}

                  {/* Grand Total Row */}
                  <tr style={{ backgroundColor: "#e9ecef", fontWeight: "bold" }}>
                    <td>Grand Total</td>
                    <td>{Object.values(groupedData).reduce((sum, group) => sum + (group.totalOpening || 0), 0).toFixed(2)}</td>
                    <td>{Object.values(groupedData).reduce((sum, group) => sum + group.totalDebit, 0).toFixed(2)}</td>
                    <td>{Object.values(groupedData).reduce((sum, group) => sum + group.totalCredit, 0).toFixed(2)}</td>
                    <td>{
                      Object.values(groupedData).reduce((sum, group) =>
                        sum + ((group.totalDebit || 0) - (group.totalCredit || 0)), 0
                      ).toFixed(2)
                    }</td>
                    {/* <td>{
                      Object.values(groupedData).reduce((sum, group) =>
                        sum + ((group.totalOpening || 0) + (group.totalDebit || 0) - (group.totalCredit || 0)), 0
                      ).toFixed(2)
                    }</td> */}
                  </tr>
                </tbody>
              </table>
            </div>
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

export default TrailBalance;