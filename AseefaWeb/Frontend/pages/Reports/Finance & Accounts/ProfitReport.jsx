// import React, { useState, useEffect, useMemo } from "react";
// import api from "../../apiService";
// import DataTable from "react-data-table-component";
// import * as XLSX from "xlsx";
// import jsPDF from "jspdf";
// import { FaSearch, FaFilePdf, FaFileExcel, FaFilter, FaInfoCircle } from "react-icons/fa";
// import "jspdf-autotable";
// import Select from "react-select";

// const ProfitReport = () => {
//   const getCurrentDate = () => new Date().toISOString().split("T")[0];
//   const getPreviousDate = (days) => {
//     const date = new Date();
//     date.setDate(date.getDate() - days);
//     return date.toISOString().split("T")[0];  // Format to yyyy-mm-dd
//   };

//   const [fromDate, setFromDate] = useState(getPreviousDate(7));
//   const [toDate, setToDate] = useState(getCurrentDate());
//   const [type, setType] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [reportData, setReportData] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [customerName, setCustomerName] = useState("");
//   const [itemName, setItemName] = useState("");
//   const [dateRangePreset, setDateRangePreset] = useState('custom');
//   const [salesmanName, setSalesmanName] = useState("");
//   const [reportType, setReportType] = useState("");
//   const [showSubtotalsOnly, setShowSubtotalsOnly] = useState(true);
//   const [grandTotal, setGrandTotal] = useState({
//     SalesPrice: 0,
//     SalesQty: 0,
//     SalesValue: 0,
//     CostOfGoods: 0,
//     Profit: 0,
//     ProfitPer: 0,
//   });
//   const [selectedInvoice, setSelectedInvoice] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);


//   const getMonthStartDate = () => {
//     const date = new Date();
//     return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
//   };

//   const getMonthEndDate = () => {
//     const date = new Date();
//     return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
//   };


//   const fetchProfitReport = async () => {
//     setIsLoading(true);
//     setError("");

//     try {
//       const CompanyID = sessionStorage.getItem("CompanyID");
//       if (!CompanyID) {
//         setError("CompanyID is required.");
//         setIsLoading(false);
//         return;
//       }

//       const response = await api.get("/api/ProfitReport", {
//         params: {
//           CompanyID,
//           FromDate: fromDate,
//           ToDate: toDate,
//           Wholesale: type,
//           Type: reportType || 'production'
//         },
//       });

//       // Safely handle the response data
//       let responseData = response.data;

//       // If data is not an array, handle different cases
//       if (!Array.isArray(responseData)) {
//         if (responseData && responseData.data) {
//           // Case: Response has data property (common with wrapped responses)
//           responseData = responseData.data;
//         } else {
//           // Case: Unexpected response format
//           console.warn("Unexpected response format:", responseData);
//           responseData = [];
//         }
//       }

//       const { data, grandTotal } = processGroupedData(responseData);
//       setReportData(data);
//       setGrandTotal(grandTotal);
//     } catch (err) {
//       console.error("Error fetching profit report:", err);
//       setError("Failed to fetch profit report. Please try again.");
//       setReportData([]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const processGroupedData = (data = []) => {
//     // Ensure data is always an array
//     if (!Array.isArray(data)) {
//       console.warn("processGroupedData received non-array data:", data);
//       return {
//         data: [], grandTotal: {
//           SalesPrice: 0,
//           SalesQty: 0,
//           SalesValue: 0,
//           CostOfGoods: 0,
//           Profit: 0,
//           ProfitPer: 0,
//         }
//       };
//     }

//     const groups = data.reduce((acc, row) => {
//       const key = row.Invoiceno || "N/A";
//       if (!acc[key]) acc[key] = [];
//       acc[key].push(row);
//       return acc;
//     }, {});

//     let grandTotal = {
//       SalesPrice: 0,
//       SalesQty: 0,
//       SalesValue: 0,
//       CostOfGoods: 0,
//       Profit: 0,
//       ProfitPer: 0,
//     };

//     const flattened = [];
//     Object.keys(groups).forEach((invoiceNo) => {
//       const rows = groups[invoiceNo];
//       flattened.push(...rows);

//       const subtotal = rows.reduce(
//         (totals, row) => ({
//           SalesPrice: totals.SalesPrice + (row.SalesPrice || 0),
//           SalesQty: totals.SalesQty + (row.SalesQty || 0),
//           SalesValue: totals.SalesValue + (row.SalesValue || 0),
//           CostOfGoods: totals.CostOfGoods + (row.CostOfGoods || 0),
//           Profit: totals.Profit + (row.Profit || 0),
//           ProfitPer: totals.ProfitPer + (row.ProfitPer || 0),
//         }),
//         { SalesPrice: 0, SalesQty: 0, SalesValue: 0, CostOfGoods: 0, Profit: 0, ProfitPer: 0 }
//       );

//       const subtotalRow = {
//         Invoiceno: invoiceNo,
//         billdate: rows[0]?.BillDate || rows[0]?.billdate || "",
//         CustomerName: rows[0]?.CustomerName || "Subtotal",
//         Name: rows[0]?.Name || "", // ✅ Add this line
//         ItemName: "",
//         SalesPrice: subtotal.SalesPrice,
//         SalesQty: subtotal.SalesQty,
//         SalesValue: subtotal.SalesValue,
//         CostOfGoods: subtotal.CostOfGoods,
//         Profit: subtotal.Profit,
//         ProfitPer: subtotal.ProfitPer,
//         isSubtotal: true,
//       };

//       flattened.push(subtotalRow);
//       grandTotal.SalesPrice += subtotal.SalesPrice;
//       grandTotal.SalesQty += subtotal.SalesQty;
//       grandTotal.SalesValue += subtotal.SalesValue;
//       grandTotal.CostOfGoods += subtotal.CostOfGoods;
//       grandTotal.Profit += subtotal.Profit;
//       grandTotal.ProfitPer += subtotal.ProfitPer;
//     });

//     return { data: flattened, grandTotal };
//   };


//   useEffect(() => {
//     fetchProfitReport();
//   }, [fromDate, toDate, type, reportType, dateRangePreset]); // Add dateRangePreset to dependencies


//   const handleDateRangePreset = (preset) => {
//     setDateRangePreset(preset);
//     switch (preset) {
//       case 'thisMonth':
//         setFromDate(getMonthStartDate());
//         setToDate(getMonthEndDate());
//         break;
//       case 'lastMonth':
//         const lastMonth = new Date();
//         lastMonth.setMonth(lastMonth.getMonth() - 1);
//         setFromDate(new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1).toISOString().split('T')[0]);
//         setToDate(new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).toISOString().split('T')[0]);
//         break;
//       case 'last7days':
//         setFromDate(getPreviousDate(7));
//         setToDate(getCurrentDate());
//         break;
//       case 'last30days':
//         setFromDate(getPreviousDate(30));
//         setToDate(getCurrentDate());
//         break;
//       default:
//         // Custom range - do nothing, let user pick dates
//         break;
//     }
//   };

//   const handleClear = () => {
//     setCustomerName("");
//     setItemName("");
//     setSalesmanName("");
//     setType(""); // Optional: reset Type to ""
//     setShowSubtotalsOnly(true);
//     setError("");
//     setReportType("");
//     fetchProfitReport(); // ✅ Re-fetch using existing fromDate/toDate
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     fetchProfitReport();
//   };

//   const exportToExcel = () => {
//     if (filteredData.length === 0) {
//       alert("No data to export.");
//       return;
//     }

//     const ws = XLSX.utils.json_to_sheet(filteredData);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "ProfitReport");
//     XLSX.writeFile(wb, "ProfitReport.xlsx");
//   };

//   const exportToPDF = () => {
//     if (filteredData.length === 0) {
//       alert("No data to export.");
//       return;
//     }

//     const doc = new jsPDF();
//     doc.text("Profit Report", 14, 10);

//     const tableColumn = [
//       "Invoice No",
//       "Date",
//       "Customer",
//       "Item Name",
//       "Sales Price",
//       "Quantity",
//       "Sales Value",
//       "Cost Of Goods",
//       "Profit",
//       "Profit %",
//     ];

//     const tableRows = filteredData.map((row) => [
//       row.Invoiceno || "N/A",
//       row.billdate ? new Date(row.billdate).toLocaleDateString() : "",
//       row.CustomerName || "N/A",
//       row.ItemName || "N/A",
//       row.SalesPrice.toFixed(2),
//       row.SalesQty,
//       row.SalesValue.toFixed(2),
//       row.CostOfGoods.toFixed(2),
//       row.Profit.toFixed(2),
//       `${row.ProfitPer.toFixed(2)}%`,
//     ]);

//     doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 });
//     doc.save("ProfitReport.pdf");
//   };

//   const columns = [
//     {
//       name: "Invoice No",
//       selector: (row) => row.Invoiceno || "N/A",
//       sortable: true,
//       cell: row => (
//         <div className="d-flex align-items-center">
//           {row.Invoiceno || "N/A"}
//           {row.isSubtotal && (
//             <button
//               className="btn btn-sm btn-link ms-2 p-0"
//               onClick={(e) => {
//                 e.stopPropagation();
//                 setSelectedInvoice(row.Invoiceno);
//                 setIsModalOpen(true);
//               }}
//               title="View Items"
//             >
//               <FaInfoCircle />
//             </button>
//           )}
//         </div>
//       ),
//     },
//     {
//       name: "Date",
//       selector: (row) => row.billdate ? new Date(row.billdate).toLocaleDateString() : "",
//       sortable: true,
//     },
//     {
//       name: "Customer",
//       selector: (row) => row.CustomerName || "N/A",
//       sortable: true,
//     },
//     {
//       name: "Sales Value",
//       selector: (row) => row.SalesValue.toFixed(2),
//       sortable: true,
//       right: true,
//     },
//     {
//       name: "Salesman",
//       selector: row => row.Salesman || "N/A",
//       sortable: true
//     },
//     {
//       name: "Cost Of Goods",
//       selector: (row) => row.CostOfGoods.toFixed(2),
//       sortable: true,
//       right: true,
//     },
//     {
//       name: "Profit",
//       selector: (row) => row.Profit.toFixed(2),
//       sortable: true,
//       right: true,
//     },
//     {
//       name: "Profit %",
//       selector: (row) => row.ProfitPer.toFixed(2) + "%",
//       sortable: true,
//       right: true,
//     },
//   ];


//   const filteredData = useMemo(() => {
//     const filteredItems = reportData.filter(row => !row.isSubtotal).filter(row =>
//       (!itemName || row.ItemName?.toLowerCase().includes(itemName.toLowerCase())) &&
//       (!customerName || row.CustomerName?.toLowerCase().includes(customerName.toLowerCase())) &&
//       (!salesmanName || row.Name?.toLowerCase().includes(salesmanName.toLowerCase())) &&
//       (!searchTerm || row.Invoiceno?.toLowerCase().includes(searchTerm.toLowerCase()))
//     );

//     const grouped = {};
//     for (const row of filteredItems) {
//       if (!grouped[row.Invoiceno]) grouped[row.Invoiceno] = [];
//       grouped[row.Invoiceno].push(row);
//     }

//     let flattened = [];
//     for (const [invoice, rows] of Object.entries(grouped)) {
//       if (!showSubtotalsOnly) {
//         flattened.push(...rows);
//       }

//       const subtotal = rows.reduce(
//         (acc, row) => {
//           acc.SalesPrice += row.SalesPrice || 0;
//           acc.SalesQty += row.SalesQty || 0;
//           acc.SalesValue += row.SalesValue || 0;
//           acc.CostOfGoods += row.CostOfGoods || 0;
//           acc.Profit += row.Profit || 0;
//           return acc;
//         },
//         { SalesPrice: 0, SalesQty: 0, SalesValue: 0, CostOfGoods: 0, Profit: 0 }
//       );

//       // ✅ Debug each group's first row date

//       flattened.push({
//         Invoiceno: invoice,
//         billdate: rows[0]?.BillDate ?? rows[0]?.billdate ?? "",
//         CustomerName: rows[0].CustomerName,
//         Name: rows[0].Name,
//         SalesPrice: subtotal.SalesPrice,
//         SalesQty: subtotal.SalesQty,
//         SalesValue: subtotal.SalesValue,
//         CostOfGoods: subtotal.CostOfGoods,
//         Profit: subtotal.Profit,
//         ProfitPer: subtotal.SalesValue ? (subtotal.Profit / subtotal.SalesValue) * 100 : 0,
//         isSubtotal: true,
//       });
//     }

//     flattened.sort((a, b) => {
//       if (a.isSubtotal && b.isSubtotal) {
//         return b.Profit - a.Profit;
//       }
//       return 0;
//     });

//     // ✅ Log final result

//     return flattened;
//   }, [reportData, itemName, customerName, salesmanName, searchTerm, showSubtotalsOnly]);

//   const filteredTotal = useMemo(() => {
//     const subtotalRows = filteredData.filter(row => row.isSubtotal);

//     const totals = subtotalRows.reduce(
//       (acc, row) => {
//         acc.SalesValue += row.SalesValue || 0;
//         acc.CostOfGoods += row.CostOfGoods || 0;
//         acc.Profit += row.Profit || 0;
//         return acc;
//       },
//       { SalesValue: 0, CostOfGoods: 0, Profit: 0 }
//     );

//     return {
//       ...totals,
//       ProfitPer: totals.SalesValue ? (totals.Profit / totals.SalesValue) * 100 : 0
//     };
//   }, [filteredData]);




//   const getInvoiceItems = (invoiceNo) => {
//     return reportData.filter(
//       (row) => row.Invoiceno === invoiceNo && !row.isSubtotal
//     );
//   };


//   const uniqueCustomers = useMemo(() => {
//     const set = new Set(reportData.map(row => row.CustomerName).filter(Boolean));
//     return Array.from(set).map(name => ({ label: name, value: name }));
//   }, [reportData]);

//   const uniqueItems = useMemo(() => {
//     const set = new Set(reportData.map(row => row.ItemName).filter(Boolean));
//     return Array.from(set).map(name => ({ label: name, value: name }));
//   }, [reportData]);

//   const uniqueSalesmen = useMemo(() => {
//     const set = new Set(reportData.map(row => row.Name).filter(Boolean));
//     return Array.from(set).map(name => ({ label: name, value: name }));
//   }, [reportData]);


//   return (
//     <div className="container-fluid">
//       {/* Search and Action Buttons */}
//       <div className="card shadow-sm mb-3 p-3">
//         <h4>Profit Report</h4>
//         <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
//           {/* Search */}
//           <div className="w-100 w-md-50">
//             <div className="input-group">
//               <span className="input-group-text bg-primary text-white">
//                 <FaSearch />
//               </span>
//               <input
//                 type="text"
//                 className="form-control"
//                 placeholder="Search by invoice number..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
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

//             {/* Export Buttons */}
//             <div className="btn-group">
//               <button className="btn btn-outline" onClick={exportToExcel}>
//                 <FaFileExcel className="me-1" /> Excel
//               </button>
//               <button className="btn btn-outline" onClick={exportToPDF}>
//                 <FaFilePdf className="me-1" /> PDF
//               </button>
//             </div>

//             {/* <button
//               className="btn btn-info"
//               onClick={() => setShowSubtotalsOnly(!showSubtotalsOnly)}
//             >
//               {showSubtotalsOnly ? "Show Itemwise" : "Show Billwise"}
//             </button> */}
//           </div>
//         </div>
//       </div>

//       {/* Filter Modal */}
//       <div className="modal fade" id="filterModal" tabIndex="-1" aria-labelledby="filterModalLabel" aria-hidden="true">
//         <div className="modal-dialog modal-lg">
//           <div className="modal-content">
//             <div className="modal-header bg-light">
//               <h5 className="modal-title text-primary" id="filterModalLabel">
//                 <FaFilter className="me-2" />
//                 Profit Report Filters
//               </h5>
//               <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
//             </div>

//             <div className="modal-body">
//               <form onSubmit={handleSubmit}>
//                 {/* Inside your filter modal */}
//                 <div className="row mb-3 g-3">
//                   <div className="col-md-12">
//                     <label className="form-label fw-bold small text-muted">QUICK DATE RANGES</label>
//                     <div className="btn-group w-100">
//                       <button
//                         type="button"
//                         className={`btn btn-sm ${dateRangePreset === 'last7days' ? 'btn-primary' : 'btn-outline-primary'}`}
//                         onClick={() => handleDateRangePreset('last7days')}
//                       >
//                         Last 7 Days
//                       </button>
//                       <button
//                         type="button"
//                         className={`btn btn-sm ${dateRangePreset === 'last30days' ? 'btn-primary' : 'btn-outline-primary'}`}
//                         onClick={() => handleDateRangePreset('last30days')}
//                       >
//                         Last 30 Days
//                       </button>
//                       <button
//                         type="button"
//                         className={`btn btn-sm ${dateRangePreset === 'thisMonth' ? 'btn-primary' : 'btn-outline-primary'}`}
//                         onClick={() => handleDateRangePreset('thisMonth')}
//                       >
//                         This Month
//                       </button>
//                       <button
//                         type="button"
//                         className={`btn btn-sm ${dateRangePreset === 'lastMonth' ? 'btn-primary' : 'btn-outline-primary'}`}
//                         onClick={() => handleDateRangePreset('lastMonth')}
//                       >
//                         Last Month
//                       </button>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="row mb-3 g-3">
//                   <div className="col-md-6">
//                     <label htmlFor="FromDate" className="form-label fw-bold small text-muted">FROM DATE</label>
//                     <input
//                       type="date"
//                       id="FromDate"
//                       className="form-control"
//                       value={fromDate}
//                       onChange={(e) => {
//                         setFromDate(e.target.value);
//                         setDateRangePreset('custom');
//                       }}
//                     />
//                   </div>
//                   <div className="col-md-6">
//                     <label htmlFor="ToDate" className="form-label fw-bold small text-muted">TO DATE</label>
//                     <input
//                       type="date"
//                       id="ToDate"
//                       className="form-control"
//                       value={toDate}
//                       onChange={(e) => {
//                         setToDate(e.target.value);
//                         setDateRangePreset('custom');
//                       }}
//                     />
//                   </div>
//                 </div>

//                 <div className="row mb-3">
//                   <div className="col-md-6">
//                     <label htmlFor="Type" className="form-label fw-bold small text-muted">TYPE</label>
//                     <select
//                       id="Type"
//                       className="form-select"
//                       value={type}
//                       onChange={(e) => setType(e.target.value)}
//                     >
//                       <option value="" disabled>Select Type</option>
//                       <option value="">All</option>
//                       <option value="Retail">Retail</option>
//                       <option value="WholeSale">WholeSale</option>
//                     </select>
//                   </div>
//                   <div className="col-md-6">
//                     <label htmlFor="ReportType" className="form-label fw-bold small text-muted">REPORT TYPE</label>
//                     <select
//                       id="ReportType"
//                       className="form-select"
//                       value={reportType}
//                       onChange={(e) => setReportType(e.target.value)}
//                     >
//                       <option value="">All</option>
//                       <option value="Purchase">Purchase</option>
//                       <option value="Production">Production</option>
//                     </select>
//                   </div>
//                   <div className="col-md-6">
//                     <label className="form-label fw-bold small text-muted">CUSTOMER</label>
//                     <Select
//                       options={uniqueCustomers}
//                       value={customerName ? { label: customerName, value: customerName } : null}
//                       onChange={(selected) => setCustomerName(selected ? selected.value : "")}
//                       isClearable
//                       placeholder="Select customer..."
//                     />
//                   </div>
//                   <div className="col-md-6">
//                     <label className="form-label fw-bold small text-muted">ITEM NAME</label>
//                     <Select
//                       options={uniqueItems}
//                       value={itemName ? { label: itemName, value: itemName } : null}
//                       onChange={(selected) => setItemName(selected ? selected.value : "")}
//                       isClearable
//                       placeholder="Select item..."
//                     />
//                   </div>
//                   <div className="col-md-6">
//                     <label className="form-label fw-bold small text-muted">SALESMAN</label>
//                     <Select
//                       options={uniqueSalesmen}
//                       value={salesmanName ? { label: salesmanName, value: salesmanName } : null}
//                       onChange={(selected) => setSalesmanName(selected ? selected.value : "")}
//                       isClearable
//                       placeholder="Select salesman..."
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
//                     type="submit"
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

//       {/* Data Table */}
//       <div
//         className="card shadow border-0 rounded mb-4 d-flex flex-column"
//         style={{ height: "calc(100vh - 230px)" }}
//       >
//         {/* Table Scrollable Area */}
//         <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
//           <div className="table-responsive" style={{ maxHeight: "100%", overflowY: "auto" }}>
//             <table className="table table-bordered table-hover mb-0" style={{ fontSize: "12px" }}>

//               <thead
//                 className="table-light sticky-top"
//                 style={{ top: 0, zIndex: 2, backgroundColor: "#8db7e0ff" }}
//               >
//                 <tr>
//                   <th>Invoice No</th>
//                   <th>Date</th>
//                   <th>Customer</th>
//                   <th>Salesman</th>
//                   <th>Sales Value</th>
//                   <th>Cost Of Goods</th>
//                   <th>Profit</th>
//                   <th>Profit %</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {filteredData.map((row, idx) => (

//                   <tr
//                     key={idx}
//                     className={row.isSubtotal ? "table- fw-bold" : ""}
//                     style={{ cursor: row.isSubtotal ? "pointer" : "default" }}
//                     onClick={() => {
//                       if (row.isSubtotal) {
//                         setSelectedInvoice(row.Invoiceno);
//                         setIsModalOpen(true);
//                       }
//                     }}
//                   >
//                     <td className="text-start">{row.Invoiceno || "N/A"}</td>
//                     <td className="text-start">
//                       {row.billdate ? new Date(row.billdate).toLocaleDateString() : ""}
//                     </td>
//                     <td className="text-start">{row.CustomerName || "N/A"}</td>
//                     <td className="text-start">{row.Name || "N/A"}</td>
//                     <td className="text-end">{row.SalesValue.toFixed(2)}</td>
//                     <td className="text-end">{row.CostOfGoods.toFixed(2)}</td>
//                     <td className="text-end">{row.Profit.toFixed(2)}</td>
//                     <td className="text-end">{(row.ProfitPer ?? 0).toFixed(2)}%</td>
//                   </tr>

//                 ))}
//               </tbody>
//               <tfoot
//                 className="sticky-bottom text-white"
//                 style={{ backgroundColor: "#0e5397ff", bottom: 0, zIndex: 2 }}
//               >
//                 <tr className="fw-bold">
//                   <td colSpan="4" className="text-center">Grand Total</td>
//                   <td className="text-end">{filteredTotal.SalesValue.toFixed(2)}</td>
//                   <td className="text-end">{filteredTotal.CostOfGoods.toFixed(2)}</td>
//                   <td className="text-end">{filteredTotal.Profit.toFixed(2)}</td>
//                   <td className="text-end">{filteredTotal.ProfitPer.toFixed(2)}%</td>
//                 </tr>
//               </tfoot>
//             </table>
//           </div>
//         </div>
//       </div>

//       {/* Itemwise Details Modal */}
//       {isModalOpen && selectedInvoice && (
//         <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.5)" }}>
//           <div className="modal-dialog modal-lg" role="document">
//             <div className="modal-content shadow-lg rounded">
//               <div className="modal-header bg-primary text-white">
//                 <h5 className="modal-title">Itemwise Details - Invoice #{selectedInvoice}</h5>
//                 <button
//                   type="button"
//                   className="close btn btn-danger rounded-circle p-2"
//                   onClick={() => setIsModalOpen(false)}
//                 >
//                   <span>&times;</span>
//                 </button>
//               </div>

//               <div className="modal-body">
//                 <div className="table-responsive">
//                   <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
//                     <table className="table table-bordered mb-0">
//                       <thead className="table-light sticky-top" style={{ top: 0, zIndex: 1 }}>
//                         <tr>
//                           <th>Item Name</th>
//                           <th>Sales Price</th>
//                           <th>Quantity</th>
//                           <th>Sales Value</th>
//                           <th>Cost Of Goods</th>
//                           <th>Profit</th>
//                           <th>Profit %</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {getInvoiceItems(selectedInvoice).map((item, index) => (
//                           <tr key={index}>
//                             <td>{item.ItemName}</td>
//                             <td className="text-end">{item.SalesPrice.toFixed(2)}</td>
//                             <td className="text-end">{item.SalesQty}</td>
//                             <td className="text-end">{item.SalesValue.toFixed(2)}</td>
//                             <td className="text-end">{item.CostOfGoods.toFixed(2)}</td>
//                             <td className="text-end">{item.Profit.toFixed(2)}</td>
//                             <td className="text-end">{(item.SalesPrice ?? 0).toFixed(2)}</td>

//                           </tr>
//                         ))}
//                       </tbody>
//                       <tfoot className="table-secondary sticky-bottom" style={{ bottom: 0, zIndex: 1 }}>
//                         <tr>
//                           <th>Subtotal</th>
//                           <th className="text-end">
//                             {getInvoiceItems(selectedInvoice)
//                               .reduce((sum, item) => sum + item.SalesPrice, 0)
//                               .toFixed(2)}
//                           </th>
//                           <th className="text-end">
//                             {getInvoiceItems(selectedInvoice)
//                               .reduce((sum, item) => sum + item.SalesQty, 0)}
//                           </th>
//                           <th className="text-end">
//                             {getInvoiceItems(selectedInvoice)
//                               .reduce((sum, item) => sum + item.SalesValue, 0)
//                               .toFixed(2)}
//                           </th>
//                           <th className="text-end">
//                             {getInvoiceItems(selectedInvoice)
//                               .reduce((sum, item) => sum + item.CostOfGoods, 0)
//                               .toFixed(2)}
//                           </th>
//                           <th className="text-end">
//                             {getInvoiceItems(selectedInvoice)
//                               .reduce((sum, item) => sum + item.Profit, 0)
//                               .toFixed(2)}
//                           </th>
//                           <th className="text-end">
//                             {(
//                               (getInvoiceItems(selectedInvoice)
//                                 .reduce((sum, item) => sum + item.Profit, 0) /
//                                 getInvoiceItems(selectedInvoice)
//                                   .reduce((sum, item) => sum + item.SalesValue, 0)) *
//                               100
//                             ).toFixed(2)}%
//                           </th>
//                         </tr>
//                       </tfoot>
//                     </table>
//                   </div>
//                 </div>
//               </div>

//               <div className="modal-footer">
//                 <button
//                   type="button"
//                   className="btn btn-secondary"
//                   onClick={() => setIsModalOpen(false)}
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>

//         </div>
//       )}
//     </div>



//   );
// };

// export default ProfitReport;
import React, { useState, useEffect, useMemo } from "react";
import api from "../../apiService";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { FaSearch, FaFilePdf, FaFileExcel, FaFilter, FaInfoCircle } from "react-icons/fa";
import "jspdf-autotable";
import Select from "react-select";
import { usePermission } from "../../../src/context/permissionContex";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ProfitReport = () => {
  // ── Permissions ──
  const { getPermission, refreshPermissions } = usePermission();
  const permission = getPermission("PROFIT");
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

  const [fromDate, setFromDate] = useState(getPreviousDate(7));
  const [toDate, setToDate] = useState(getCurrentDate());
  const [type, setType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [reportData, setReportData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [itemName, setItemName] = useState("");
  const [dateRangePreset, setDateRangePreset] = useState('custom');
  const [salesmanName, setSalesmanName] = useState("");
  const [reportType, setReportType] = useState("");
  const [showSubtotalsOnly, setShowSubtotalsOnly] = useState(true);
  const [grandTotal, setGrandTotal] = useState({
    SalesPrice: 0,
    SalesQty: 0,
    SalesValue: 0,
    CostOfGoods: 0,
    Profit: 0,
    ProfitPer: 0,
  });
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);


  const getMonthStartDate = () => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  };

  const getMonthEndDate = () => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
  };


  const fetchProfitReport = async () => {
    if (!canView) return; // ── Permission guard ──
    setIsLoading(true);
    setError("");

    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      if (!CompanyID) {
        setError("CompanyID is required.");
        setIsLoading(false);
        return;
      }

      const response = await api.get("/api/ProfitReport", {
        params: {
          CompanyID,
          FromDate: fromDate,
          ToDate: toDate,
          Wholesale: type,
          Type: reportType || 'production'
        },
      });

      let responseData = response.data;

      if (!Array.isArray(responseData)) {
        if (responseData && responseData.data) {
          responseData = responseData.data;
        } else {
          console.warn("Unexpected response format:", responseData);
          responseData = [];
        }
      }

      const { data, grandTotal } = processGroupedData(responseData);
      setReportData(data);
      setGrandTotal(grandTotal);
    } catch (err) {
      console.error("Error fetching profit report:", err);
      setError("Failed to fetch profit report. Please try again.");
      toast.error("Failed to fetch profit report");
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const processGroupedData = (data = []) => {
    if (!Array.isArray(data)) {
      console.warn("processGroupedData received non-array data:", data);
      return {
        data: [], grandTotal: {
          SalesPrice: 0,
          SalesQty: 0,
          SalesValue: 0,
          CostOfGoods: 0,
          Profit: 0,
          ProfitPer: 0,
        }
      };
    }

    const groups = data.reduce((acc, row) => {
      const key = row.Invoiceno || "N/A";
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {});

    let grandTotal = {
      SalesPrice: 0,
      SalesQty: 0,
      SalesValue: 0,
      CostOfGoods: 0,
      Profit: 0,
      ProfitPer: 0,
    };

    const flattened = [];
    Object.keys(groups).forEach((invoiceNo) => {
      const rows = groups[invoiceNo];
      flattened.push(...rows);

      const subtotal = rows.reduce(
        (totals, row) => ({
          SalesPrice: totals.SalesPrice + (row.SalesPrice || 0),
          SalesQty: totals.SalesQty + (row.SalesQty || 0),
          SalesValue: totals.SalesValue + (row.SalesValue || 0),
          CostOfGoods: totals.CostOfGoods + (row.CostOfGoods || 0),
          Profit: totals.Profit + (row.Profit || 0),
          ProfitPer: totals.ProfitPer + (row.ProfitPer || 0),
        }),
        { SalesPrice: 0, SalesQty: 0, SalesValue: 0, CostOfGoods: 0, Profit: 0, ProfitPer: 0 }
      );

      const subtotalRow = {
        Invoiceno: invoiceNo,
        billdate: rows[0]?.BillDate || rows[0]?.billdate || "",
        CustomerName: rows[0]?.CustomerName || "Subtotal",
        Name: rows[0]?.Name || "",
        ItemName: "",
        SalesPrice: subtotal.SalesPrice,
        SalesQty: subtotal.SalesQty,
        SalesValue: subtotal.SalesValue,
        CostOfGoods: subtotal.CostOfGoods,
        Profit: subtotal.Profit,
        ProfitPer: subtotal.ProfitPer,
        isSubtotal: true,
      };

      flattened.push(subtotalRow);
      grandTotal.SalesPrice += subtotal.SalesPrice;
      grandTotal.SalesQty += subtotal.SalesQty;
      grandTotal.SalesValue += subtotal.SalesValue;
      grandTotal.CostOfGoods += subtotal.CostOfGoods;
      grandTotal.Profit += subtotal.Profit;
      grandTotal.ProfitPer += subtotal.ProfitPer;
    });

    return { data: flattened, grandTotal };
  };


  // ── fetch only when user has view permission ──
  useEffect(() => {
    if (!canView) {
      setReportData([]);
      return;
    }
    fetchProfitReport();
  }, [fromDate, toDate, type, reportType, dateRangePreset, canView]);


  const handleDateRangePreset = (preset) => {
    setDateRangePreset(preset);
    switch (preset) {
      case 'thisMonth':
        setFromDate(getMonthStartDate());
        setToDate(getMonthEndDate());
        break;
      case 'lastMonth':
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        setFromDate(new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1).toISOString().split('T')[0]);
        setToDate(new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).toISOString().split('T')[0]);
        break;
      case 'last7days':
        setFromDate(getPreviousDate(7));
        setToDate(getCurrentDate());
        break;
      case 'last30days':
        setFromDate(getPreviousDate(30));
        setToDate(getCurrentDate());
        break;
      default:
        break;
    }
  };

  const handleClear = () => {
    setCustomerName("");
    setItemName("");
    setSalesmanName("");
    setType("");
    setShowSubtotalsOnly(true);
    setError("");
    setReportType("");
    fetchProfitReport();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchProfitReport();
  };

  const exportToExcel = () => {
    if (!canExport) { toast.error("You do not have permission to export reports."); return; }
    if (filteredData.length === 0) {
      toast.error("No data to export.");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ProfitReport");
    XLSX.writeFile(wb, "ProfitReport.xlsx");
    toast.success("Exported to Excel");
  };

  const exportToPDF = () => {
    if (!canExport) { toast.error("You do not have permission to export reports."); return; }
    if (filteredData.length === 0) {
      toast.error("No data to export.");
      return;
    }

    const doc = new jsPDF();
    doc.text("Profit Report", 14, 10);

    const tableColumn = [
      "Invoice No",
      "Date",
      "Customer",
      "Item Name",
      "Sales Price",
      "Quantity",
      "Sales Value",
      "Cost Of Goods",
      "Profit",
      "Profit %",
    ];

    const tableRows = filteredData.map((row) => [
      row.Invoiceno || "N/A",
      row.billdate ? new Date(row.billdate).toLocaleDateString() : "",
      row.CustomerName || "N/A",
      row.ItemName || "N/A",
      row.SalesPrice.toFixed(2),
      row.SalesQty,
      row.SalesValue.toFixed(2),
      row.CostOfGoods.toFixed(2),
      row.Profit.toFixed(2),
      `${row.ProfitPer.toFixed(2)}%`,
    ]);

    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 });
    doc.save("ProfitReport.pdf");
    toast.success("Exported to PDF");
  };

  const columns = [
    {
      name: "Invoice No",
      selector: (row) => row.Invoiceno || "N/A",
      sortable: true,
      cell: row => (
        <div className="d-flex align-items-center">
          {row.Invoiceno || "N/A"}
          {row.isSubtotal && (
            <button
              className="btn btn-sm btn-link ms-2 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedInvoice(row.Invoiceno);
                setIsModalOpen(true);
              }}
              title="View Items"
            >
              <FaInfoCircle />
            </button>
          )}
        </div>
      ),
    },
    {
      name: "Date",
      selector: (row) => row.billdate ? new Date(row.billdate).toLocaleDateString() : "",
      sortable: true,
    },
    {
      name: "Customer",
      selector: (row) => row.CustomerName || "N/A",
      sortable: true,
    },
    {
      name: "Sales Value",
      selector: (row) => row.SalesValue.toFixed(2),
      sortable: true,
      right: true,
    },
    {
      name: "Salesman",
      selector: row => row.Salesman || "N/A",
      sortable: true
    },
    {
      name: "Cost Of Goods",
      selector: (row) => row.CostOfGoods.toFixed(2),
      sortable: true,
      right: true,
    },
    {
      name: "Profit",
      selector: (row) => row.Profit.toFixed(2),
      sortable: true,
      right: true,
    },
    {
      name: "Profit %",
      selector: (row) => row.ProfitPer.toFixed(2) + "%",
      sortable: true,
      right: true,
    },
  ];


  const filteredData = useMemo(() => {
    const filteredItems = reportData.filter(row => !row.isSubtotal).filter(row =>
      (!itemName || row.ItemName?.toLowerCase().includes(itemName.toLowerCase())) &&
      (!customerName || row.CustomerName?.toLowerCase().includes(customerName.toLowerCase())) &&
      (!salesmanName || row.Name?.toLowerCase().includes(salesmanName.toLowerCase())) &&
      (!searchTerm || row.Invoiceno?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const grouped = {};
    for (const row of filteredItems) {
      if (!grouped[row.Invoiceno]) grouped[row.Invoiceno] = [];
      grouped[row.Invoiceno].push(row);
    }

    let flattened = [];
    for (const [invoice, rows] of Object.entries(grouped)) {
      if (!showSubtotalsOnly) {
        flattened.push(...rows);
      }

      const subtotal = rows.reduce(
        (acc, row) => {
          acc.SalesPrice += row.SalesPrice || 0;
          acc.SalesQty += row.SalesQty || 0;
          acc.SalesValue += row.SalesValue || 0;
          acc.CostOfGoods += row.CostOfGoods || 0;
          acc.Profit += row.Profit || 0;
          return acc;
        },
        { SalesPrice: 0, SalesQty: 0, SalesValue: 0, CostOfGoods: 0, Profit: 0 }
      );

      flattened.push({
        Invoiceno: invoice,
        billdate: rows[0]?.BillDate ?? rows[0]?.billdate ?? "",
        CustomerName: rows[0].CustomerName,
        Name: rows[0].Name,
        SalesPrice: subtotal.SalesPrice,
        SalesQty: subtotal.SalesQty,
        SalesValue: subtotal.SalesValue,
        CostOfGoods: subtotal.CostOfGoods,
        Profit: subtotal.Profit,
        ProfitPer: subtotal.SalesValue ? (subtotal.Profit / subtotal.SalesValue) * 100 : 0,
        isSubtotal: true,
      });
    }

    flattened.sort((a, b) => {
      if (a.isSubtotal && b.isSubtotal) {
        return b.Profit - a.Profit;
      }
      return 0;
    });

    return flattened;
  }, [reportData, itemName, customerName, salesmanName, searchTerm, showSubtotalsOnly]);

  const filteredTotal = useMemo(() => {
    const subtotalRows = filteredData.filter(row => row.isSubtotal);

    const totals = subtotalRows.reduce(
      (acc, row) => {
        acc.SalesValue += row.SalesValue || 0;
        acc.CostOfGoods += row.CostOfGoods || 0;
        acc.Profit += row.Profit || 0;
        return acc;
      },
      { SalesValue: 0, CostOfGoods: 0, Profit: 0 }
    );

    return {
      ...totals,
      ProfitPer: totals.SalesValue ? (totals.Profit / totals.SalesValue) * 100 : 0
    };
  }, [filteredData]);


  const getInvoiceItems = (invoiceNo) => {
    return reportData.filter(
      (row) => row.Invoiceno === invoiceNo && !row.isSubtotal
    );
  };


  const uniqueCustomers = useMemo(() => {
    const set = new Set(reportData.map(row => row.CustomerName).filter(Boolean));
    return Array.from(set).map(name => ({ label: name, value: name }));
  }, [reportData]);

  const uniqueItems = useMemo(() => {
    const set = new Set(reportData.map(row => row.ItemName).filter(Boolean));
    return Array.from(set).map(name => ({ label: name, value: name }));
  }, [reportData]);

  const uniqueSalesmen = useMemo(() => {
    const set = new Set(reportData.map(row => row.Name).filter(Boolean));
    return Array.from(set).map(name => ({ label: name, value: name }));
  }, [reportData]);

  // ── Access-denied view, same pattern as TaskManagement/BankReport ──
  if (!canView) {
    return (
      <div className="container-fluid">
        <ToastContainer position="top-center" autoClose={3000} />
        <div className="alert alert-danger mt-3">You do not have permission to view the Profit Report.</div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <ToastContainer position="top-center" autoClose={3000} />

      {/* Search and Action Buttons */}
      <div className="card shadow-sm mb-3 p-3">
        <h4>Profit Report</h4>
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
          {/* Search */}
          <div className="w-100 w-md-50">
            <div className="input-group">
              <span className="input-group-text bg-primary text-white">
                <FaSearch />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by invoice number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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

            {/* Export Buttons — only shown if user can export */}
            {canExport && (
              <div className="btn-group">
                <button className="btn btn-outline" onClick={exportToExcel}>
                  <FaFileExcel className="me-1" /> Excel
                </button>
                <button className="btn btn-outline" onClick={exportToPDF}>
                  <FaFilePdf className="me-1" /> PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      <div className="modal fade" id="filterModal" tabIndex="-1" aria-labelledby="filterModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header bg-light">
              <h5 className="modal-title text-primary" id="filterModalLabel">
                <FaFilter className="me-2" />
                Profit Report Filters
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="row mb-3 g-3">
                  <div className="col-md-12">
                    <label className="form-label fw-bold small text-muted">QUICK DATE RANGES</label>
                    <div className="btn-group w-100">
                      <button
                        type="button"
                        className={`btn btn-sm ${dateRangePreset === 'last7days' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => handleDateRangePreset('last7days')}
                      >
                        Last 7 Days
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${dateRangePreset === 'last30days' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => handleDateRangePreset('last30days')}
                      >
                        Last 30 Days
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${dateRangePreset === 'thisMonth' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => handleDateRangePreset('thisMonth')}
                      >
                        This Month
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${dateRangePreset === 'lastMonth' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => handleDateRangePreset('lastMonth')}
                      >
                        Last Month
                      </button>
                    </div>
                  </div>
                </div>

                <div className="row mb-3 g-3">
                  <div className="col-md-6">
                    <label htmlFor="FromDate" className="form-label fw-bold small text-muted">FROM DATE</label>
                    <input
                      type="date"
                      id="FromDate"
                      className="form-control"
                      value={fromDate}
                      onChange={(e) => {
                        setFromDate(e.target.value);
                        setDateRangePreset('custom');
                      }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="ToDate" className="form-label fw-bold small text-muted">TO DATE</label>
                    <input
                      type="date"
                      id="ToDate"
                      className="form-control"
                      value={toDate}
                      onChange={(e) => {
                        setToDate(e.target.value);
                        setDateRangePreset('custom');
                      }}
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="Type" className="form-label fw-bold small text-muted">TYPE</label>
                    <select
                      id="Type"
                      className="form-select"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      <option value="" disabled>Select Type</option>
                      <option value="">All</option>
                      <option value="Retail">Retail</option>
                      <option value="WholeSale">WholeSale</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="ReportType" className="form-label fw-bold small text-muted">REPORT TYPE</label>
                    <select
                      id="ReportType"
                      className="form-select"
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="Purchase">Purchase</option>
                      <option value="Production">Production</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-muted">CUSTOMER</label>
                    <Select
                      options={uniqueCustomers}
                      value={customerName ? { label: customerName, value: customerName } : null}
                      onChange={(selected) => setCustomerName(selected ? selected.value : "")}
                      isClearable
                      placeholder="Select customer..."
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-muted">ITEM NAME</label>
                    <Select
                      options={uniqueItems}
                      value={itemName ? { label: itemName, value: itemName } : null}
                      onChange={(selected) => setItemName(selected ? selected.value : "")}
                      isClearable
                      placeholder="Select item..."
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-muted">SALESMAN</label>
                    <Select
                      options={uniqueSalesmen}
                      value={salesmanName ? { label: salesmanName, value: salesmanName } : null}
                      onChange={(selected) => setSalesmanName(selected ? selected.value : "")}
                      isClearable
                      placeholder="Select salesman..."
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
                    type="submit"
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

      {/* Data Table */}
      <div
        className="card shadow border-0 rounded mb-4 d-flex flex-column"
        style={{ height: "calc(100vh - 230px)" }}
      >
        {/* Table Scrollable Area */}
        <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
          <div className="table-responsive" style={{ maxHeight: "100%", overflowY: "auto" }}>
            <table className="table table-bordered table-hover mb-0" style={{ fontSize: "12px" }}>

              <thead
                className="table-light sticky-top"
                style={{ top: 0, zIndex: 2, backgroundColor: "#8db7e0ff" }}
              >
                <tr>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Salesman</th>
                  <th>Sales Value</th>
                  <th>Cost Of Goods</th>
                  <th>Profit</th>
                  <th>Profit %</th>
                </tr>
              </thead>

              <tbody>
                {filteredData.map((row, idx) => (

                  <tr
                    key={idx}
                    className={row.isSubtotal ? "table- fw-bold" : ""}
                    style={{ cursor: row.isSubtotal ? "pointer" : "default" }}
                    onClick={() => {
                      if (row.isSubtotal) {
                        setSelectedInvoice(row.Invoiceno);
                        setIsModalOpen(true);
                      }
                    }}
                  >
                    <td className="text-start">{row.Invoiceno || "N/A"}</td>
                    <td className="text-start">
                      {row.billdate ? new Date(row.billdate).toLocaleDateString() : ""}
                    </td>
                    <td className="text-start">{row.CustomerName || "N/A"}</td>
                    <td className="text-start">{row.Name || "N/A"}</td>
                    <td className="text-end">{row.SalesValue.toFixed(2)}</td>
                    <td className="text-end">{row.CostOfGoods.toFixed(2)}</td>
                    <td className="text-end">{row.Profit.toFixed(2)}</td>
                    <td className="text-end">{(row.ProfitPer ?? 0).toFixed(2)}%</td>
                  </tr>

                ))}
              </tbody>
              <tfoot
                className="sticky-bottom text-white"
                style={{ backgroundColor: "#0e5397ff", bottom: 0, zIndex: 2 }}
              >
                <tr className="fw-bold">
                  <td colSpan="4" className="text-center">Grand Total</td>
                  <td className="text-end">{filteredTotal.SalesValue.toFixed(2)}</td>
                  <td className="text-end">{filteredTotal.CostOfGoods.toFixed(2)}</td>
                  <td className="text-end">{filteredTotal.Profit.toFixed(2)}</td>
                  <td className="text-end">{filteredTotal.ProfitPer.toFixed(2)}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Itemwise Details Modal */}
      {isModalOpen && selectedInvoice && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content shadow-lg rounded">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Itemwise Details - Invoice #{selectedInvoice}</h5>
                <button
                  type="button"
                  className="close btn btn-danger rounded-circle p-2"
                  onClick={() => setIsModalOpen(false)}
                >
                  <span>&times;</span>
                </button>
              </div>

              <div className="modal-body">
                <div className="table-responsive">
                  <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
                    <table className="table table-bordered mb-0">
                      <thead className="table-light sticky-top" style={{ top: 0, zIndex: 1 }}>
                        <tr>
                          <th>Item Name</th>
                          <th>Sales Price</th>
                          <th>Quantity</th>
                          <th>Sales Value</th>
                          <th>Cost Of Goods</th>
                          <th>Profit</th>
                          <th>Profit %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getInvoiceItems(selectedInvoice).map((item, index) => (
                          <tr key={index}>
                            <td>{item.ItemName}</td>
                            <td className="text-end">{item.SalesPrice.toFixed(2)}</td>
                            <td className="text-end">{item.SalesQty}</td>
                            <td className="text-end">{item.SalesValue.toFixed(2)}</td>
                            <td className="text-end">{item.CostOfGoods.toFixed(2)}</td>
                            <td className="text-end">{item.Profit.toFixed(2)}</td>
                            <td className="text-end">{(item.SalesPrice ?? 0).toFixed(2)}</td>

                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="table-secondary sticky-bottom" style={{ bottom: 0, zIndex: 1 }}>
                        <tr>
                          <th>Subtotal</th>
                          <th className="text-end">
                            {getInvoiceItems(selectedInvoice)
                              .reduce((sum, item) => sum + item.SalesPrice, 0)
                              .toFixed(2)}
                          </th>
                          <th className="text-end">
                            {getInvoiceItems(selectedInvoice)
                              .reduce((sum, item) => sum + item.SalesQty, 0)}
                          </th>
                          <th className="text-end">
                            {getInvoiceItems(selectedInvoice)
                              .reduce((sum, item) => sum + item.SalesValue, 0)
                              .toFixed(2)}
                          </th>
                          <th className="text-end">
                            {getInvoiceItems(selectedInvoice)
                              .reduce((sum, item) => sum + item.CostOfGoods, 0)
                              .toFixed(2)}
                          </th>
                          <th className="text-end">
                            {getInvoiceItems(selectedInvoice)
                              .reduce((sum, item) => sum + item.Profit, 0)
                              .toFixed(2)}
                          </th>
                          <th className="text-end">
                            {(
                              (getInvoiceItems(selectedInvoice)
                                .reduce((sum, item) => sum + item.Profit, 0) /
                                getInvoiceItems(selectedInvoice)
                                  .reduce((sum, item) => sum + item.SalesValue, 0)) *
                              100
                            ).toFixed(2)}%
                          </th>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default ProfitReport;