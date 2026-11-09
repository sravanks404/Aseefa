// import React, { useState, useEffect, useMemo } from "react";
// import api from '../../apiService';
// import DataTable from "react-data-table-component";
// import { FaSearch, FaFileExcel, FaPrint, FaFilter } from "react-icons/fa";
// import { jsPDF } from "jspdf";
// import * as XLSX from "xlsx";
// import "jspdf-autotable";
// import Select from 'react-select';

// const CustomerDetailsReport = () => {
//     const [data, setData] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [fromDate, setFromDate] = useState("");
//     const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
//     const [salesmanName, setSalesmanName] = useState("");
//     const [routeName, setRouteName] = useState("");
//     const [salesmenList, setSalesmenList] = useState([]);
//     const [routesList, setRoutesList] = useState([]);
//     const [customerType, setCustomerType] = useState("");
//     const [searchQuery, setSearchQuery] = useState("");
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [currentPage, setCurrentPage] = useState(1);
//     const [rowsPerPage, setRowsPerPage] = useState(50);

//     const customerTypeMap = {
//         0: "Retail",
//         1: "Wholesale",
//         2: "Supermarket",
//         3: "Distributor",
//         4: "Other",
//     };

//     // Fetch data from the API
//     const fetchData = async () => {
//         setLoading(true);
//         const CompanyID = sessionStorage.getItem("CompanyID");

//         try {
//             let url = `/api/GetCustomerDetailReport?CompanyID=${CompanyID}`;

//             if (fromDate && toDate) {
//                 url += `&FromDate=${fromDate}&ToDate=${toDate}`;
//             }

//             const response = await api.get(url);

//             if (response.data && Array.isArray(response.data)) {
//                 setData(response.data);

//                 // Extract unique salesmen
//                 const uniqueSalesmen = [...new Set(response.data.map((item) => item.Salesman))];
//                 setSalesmenList(uniqueSalesmen);

//                 // Extract unique routes
//                 const uniqueRoutes = [...new Set(response.data.map((item) => item.RootName))];
//                 setRoutesList(uniqueRoutes);
//             } else {
//                 setData([]);
//             }
//         } catch (error) {
//             console.error("Error fetching data:", error);
//             setData([]);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchData();
//     }, [fromDate, toDate]);

//     const handleClear = () => {
//         setFromDate("");
//         setToDate(new Date().toISOString().split("T")[0]);
//         setSalesmanName("");
//         setRouteName("");
//         setCustomerType("");
//         setSearchQuery("");
//         setCurrentPage(1);
//         fetchData();
//     };

//     // Filter data based on search and filters
//     // Update the filteredData calculation to this:
//     const filteredData = useMemo(() => {
//         return data.filter((item) => {
//             // If search query is empty, return all items that match other filters
//             if (searchQuery.trim() === "") {
//                 const matchesSalesman = salesmanName ? item.Salesman === salesmanName : true;
//                 const matchesRoute = routeName ? item.RootName === routeName : true;
//                 const matchesCustomerType = customerType ? String(item.CustomerType) === customerType : true;
//                 return matchesSalesman && matchesRoute && matchesCustomerType;
//             }

//             // Convert all searchable fields to lowercase strings for case-insensitive comparison
//             const accountName = item.AccountName?.toString().toLowerCase() || "";
//             const mobile = item.Mob?.toString().toLowerCase() || "";
//             const route = item.RootName?.toString().toLowerCase() || "";
//             const createdDate = item.CreatedDate?.toString().toLowerCase() || "";
//             const lowerSearchQuery = searchQuery.toLowerCase();

//             // Check if any field contains the search query
//             const matchesSearch = accountName.includes(lowerSearchQuery) ||
//                 mobile.includes(lowerSearchQuery) ||
//                 route.includes(lowerSearchQuery) ||
//                 createdDate.includes(lowerSearchQuery);

//             // Apply other filters
//             const matchesSalesman = salesmanName ? item.Salesman === salesmanName : true;
//             const matchesRoute = routeName ? item.RootName === routeName : true;
//             const matchesCustomerType = customerType ? String(item.CustomerType) === customerType : true;

//             return matchesSearch && matchesSalesman && matchesRoute && matchesCustomerType;
//         });
//     }, [data, searchQuery, salesmanName, routeName, customerType]);

//     // Paginated data
//     const paginatedData = useMemo(() => {
//         const start = (currentPage - 1) * rowsPerPage;
//         return filteredData.slice(start, start + rowsPerPage);
//     }, [filteredData, currentPage, rowsPerPage]);

//     // Export to Excel
//     const exportToExcel = () => {
//         if (!filteredData.length) {
//             alert("No data to export.");
//             return;
//         }

//         // Title row
//         const titleRow = [["Customer Details Report"]];

//         // Filter section
//         const filterRows = [
//             ["From Date", fromDate || "All"],
//             ["To Date", toDate || "All"],
//             ["Salesman", salesmanName || "All"],
//             ["Route", routeName || "All"],
//             ["Customer Type", customerTypeMap[customerType] || "All"],
//             [], // Spacer
//         ];

//         // Data headers and rows
//         const headers = [
//             "Sl No",
//             "Customer Name",
//             "Address",
//             "City",
//             "Mobile",
//             "Route",
//             "Customer Type",
//             "Salesman",
//             "Created Date",
//         ];

//         const dataRows = filteredData.map((row, index) => [
//             index + 1,
//             row.AccountName || "N/A",
//             row.Address && row.Place ? `${row.Address}, ${row.Place}` : row.Address || row.Place || "N/A",
//             row.city?.trim() !== "" ? row.city : row.City || "N/A",
//             row.Mob || "N/A",
//             row.RootName || "N/A",
//             customerTypeMap[row.CustomerType] || "N/A",
//             row.Salesman?.trim() || "N/A",
//             row.CreatedDate || "N/A",
//         ]);

//         const wsData = [
//             ...titleRow,
//             ...filterRows,
//             headers,
//             ...dataRows,
//         ];

//         const ws = XLSX.utils.aoa_to_sheet(wsData);
//         const titleMerge = XLSX.utils.decode_range(`A1:I1`);
//         ws['!merges'] = [titleMerge];
//         ws["A1"].s = {
//             font: { bold: true, sz: 14 },
//             alignment: { horizontal: "center" },
//         };

//         const columnWidths = headers.map(() => ({ wch: 20 }));
//         ws['!cols'] = columnWidths;

//         const wb = XLSX.utils.book_new();
//         XLSX.utils.book_append_sheet(wb, ws, "CustomerDetailReport");
//         XLSX.writeFile(wb, `CustomerDetailReport_${new Date().toISOString().slice(0, 10)}.xlsx`);
//     };

//     // Export to PDF
//     const exportToPDF = () => {
//         if (!filteredData.length) {
//             alert("No data to export.");
//             return;
//         }

//         const doc = new jsPDF("landscape", "mm", "a4");
//         const pageWidth = doc.internal.pageSize.getWidth();

//         // Title
//         doc.setFontSize(16);
//         doc.text("Customer Details Report", pageWidth / 2, 15, { align: "center" });

//         // Filters
//         const filterLines = [
//             `From Date: ${fromDate || "All"}`,
//             `To Date: ${toDate || "All"}`,
//             `Salesman: ${salesmanName || "All"}`,
//             `Route: ${routeName || "All"}`,
//             `Customer Type: ${customerTypeMap[customerType] || "All"}`,
//         ];

//         doc.setFontSize(11);
//         filterLines.forEach((line, i) => {
//             doc.text(line, 14, 25 + i * 6);
//         });

//         const tableStartY = 25 + filterLines.length * 6 + 5;

//         // Table column headers
//         const tableColumn = [
//             "Sl No",
//             "Customer Name",
//             "Address",
//             "City",
//             "Mobile",
//             "Route",
//             "Customer Type",
//             "Salesman",
//             "Created Date"
//         ];

//         // Table data
//         const tableRows = filteredData.map((row, index) => ([
//             index + 1,
//             row.AccountName || "N/A",
//             row.Address && row.Place ? `${row.Address}, ${row.Place}` : row.Address || row.Place || "N/A",
//             row.city?.trim() !== "" ? row.city : row.City || "N/A",
//             row.Mob || "N/A",
//             row.RootName || "N/A",
//             customerTypeMap[row.CustomerType] || "N/A",
//             row.Salesman?.trim() || "N/A",
//             row.CreatedDate || "N/A"
//         ]));

//         // AutoTable
//         doc.autoTable({
//             head: [tableColumn],
//             body: tableRows,
//             startY: tableStartY,
//             theme: "grid",
//             styles: {
//                 fontSize: 9,
//                 cellPadding: 2,
//                 overflow: "linebreak",
//             },
//             headStyles: {
//                 fillColor: [22, 160, 133],
//                 textColor: 255,
//                 fontSize: 10,
//             },
//             margin: { top: 10 },
//             tableWidth: "auto",
//             didDrawPage: (data) => {
//                 if (data.pageCount === 1) return;
//             }
//         });

//         doc.save(`CustomerDetailReport_${new Date().toISOString().slice(0, 10)}.pdf`);
//     };

//     // Columns configuration for the DataTable
//     const columns = [
//         { name: <span title="Serial Number">Sl.No</span>, selector: (_, index) => index + 1, sortable: true, width: "5%" },
//         { name: <span title="Customer Name">Customer Name</span>, selector: (row) => row.AccountName ?? "N/A", sortable: true, width: "13%" },
//         { name: <span title="Address">Address</span>, selector: (row) => row.Address && row.Place ? `${row.Address}, ${row.Place}` : "N/A", sortable: true, width: "19%" },
//         { name: <span title="City">City</span>, selector: (row) => row.city && row.city.trim() !== "" ? row.city : row.City ?? "N/A", sortable: true, width: "12%" },
//         { name: <span title="Mobile">Mobile</span>, selector: (row) => row.Mob ?? "N/A", sortable: true, width: "10%" },
//         { name: <span title="Route">Route</span>, selector: (row) => row.RootName ?? "N/A", sortable: true, width: "13%" },
//         { name: <span title="Type">Type</span>, selector: (row) => customerTypeMap[row.CustomerType] ?? "N/A", sortable: true, width: "10%" },
//         { name: <span title="Salesman">Salesman</span>, selector: (row) => row.Salesman && row.Salesman.trim() !== "" ? row.Salesman : "N/A", sortable: true, width: "10%" },
//         { name: <span title="Created Date">Created Date</span>, selector: (row) => row.CreatedDate ?? "N/A", sortable: true, width: "10%" },
//     ];

//     const customStyles = {
//         table: {
//             style: {
//                 border: "1px solid #dee2e6",
//                 borderRadius: "8px",
//             },
//         },
//         head: {
//             style: {
//                 backgroundColor: "#f8f9fa",
//             },
//         },
//         headCells: {
//             style: {
//                 fontSize: "13px",
//                 fontWeight: "bold",
//                 padding: "10px",
//                 backgroundColor: "#f1f3f5",
//                 color: "#343a40",
//                 borderBottom: "1px solid #dee2e6",
//             },
//         },
//         rows: {
//             style: {
//                 fontSize: "13px",
//                 minHeight: "48px",
//                 borderBottom: "1px solid #e9ecef",
//             },
//         },
//         cells: {
//             style: {
//                 padding: "10px 12px",
//             },
//         },
//     };

//     // Custom Footer Component
//     const CustomFooter = ({ rowsPerPage, rowCount, currentPage, onChangePage, onChangeRowsPerPage }) => {
//         const totalPages = Math.ceil(rowCount / rowsPerPage);

//         return (
//             <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-3 bg-light">
//                 <div className="fw-semibold text-dark mb-2 mb-md-0">
//                     Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, rowCount)} of {rowCount} entries
//                 </div>

//                 <div className="d-flex flex-wrap align-items-center gap-2">
//                     <label className="me-2">Rows per page:</label>
//                     <select
//                         value={rowsPerPage}
//                         onChange={(e) => {
//                             onChangeRowsPerPage(Number(e.target.value));
//                             setCurrentPage(1); // Reset to first page when changing rows per page
//                         }}
//                         className="form-select form-select-sm w-auto"
//                     >
//                         <option value={250}>250</option>
//                         <option value={500}>500</option>
//                         <option value={1000}>1000</option>
//                     </select>

//                     <span className="mx-2">
//                         Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
//                     </span>

//                     <div className="btn-group btn-group-sm" role="group">
//                         <button
//                             className="btn btn-outline-secondary"
//                             onClick={() => onChangePage(1)}
//                             disabled={currentPage === 1}
//                         >
//                             ⏮
//                         </button>
//                         <button
//                             className="btn btn-outline-secondary"
//                             onClick={() => onChangePage(currentPage - 1)}
//                             disabled={currentPage === 1}
//                         >
//                             ◀
//                         </button>
//                         <button
//                             className="btn btn-outline-secondary"
//                             onClick={() => onChangePage(currentPage + 1)}
//                             disabled={currentPage === totalPages}
//                         >
//                             ▶
//                         </button>
//                         <button
//                             className="btn btn-outline-secondary"
//                             onClick={() => onChangePage(totalPages)}
//                             disabled={currentPage === totalPages}
//                         >
//                             ⏭
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         );
//     };

//     // Options for dropdowns
//     const salesmanOptions = [
//         { value: '', label: 'All Salesmen' },
//         ...salesmenList.map(salesman => ({
//             value: salesman,
//             label: salesman
//         }))
//     ];

//     const routeOptions = [
//         { value: '', label: 'All Routes' },
//         ...routesList.map(route => ({
//             value: route,
//             label: route
//         }))
//     ];

//     const customerTypeOptions = [
//         { value: '', label: 'All Types' },
//         { value: '0', label: 'Retail' },
//         { value: '1', label: 'Wholesale' },
//         { value: '2', label: 'Supermarket' },
//         { value: '3', label: 'Distributor' },
//         { value: '4', label: 'Other' }
//     ];

//     return (
//         <div className="container-fluid" style={{ backgroundColor: "white" }}>
//             {/* Search and Filter Header */}
//             <div className="card shadow-sm mb-3 p-3">
//                 <h4>Customer Details Report</h4>
//                 <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
//                     {/* Search */}
//                     <div className="w-100 w-md-50">
//                         <div className="input-group">
//                             <span className="input-group-text bg-primary text-white">
//                                 <FaSearch />
//                             </span>
//                             <input
//                                 type="text"
//                                 className="form-control"
//                                 placeholder="Search by CustomerName,Salesman,City"
//                                 value={searchQuery}
//                                 onChange={(e) => setSearchQuery(e.target.value)}
//                             />
//                         </div>
//                     </div>

//                     {/* Action Buttons */}
//                     <div className="d-flex flex-wrap justify-content-end gap-2 w-100 w-md-auto">
//                         {/* Filter Button */}
//                         <button
//                             type="button"
//                             className="btn btn-outline-primary"
//                             onClick={() => setIsModalOpen(true)}
//                         >
//                             <FaFilter className="me-1" /> Filters
//                         </button>

//                         {/* Export Buttons */}
//                         <div className="btn-group">
//                             <button className="btn btn-outline" onClick={exportToExcel}>
//                                 <FaFileExcel className="me-1" /> Excel
//                             </button>
//                             <button className="btn btn-outline" onClick={exportToPDF}>
//                                 <FaPrint className="me-1" /> PDF
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* Filter Modal */}
//             {isModalOpen && (
//                 <div className="modal fade show d-block" tabIndex={-1} style={{ background: "rgba(0,0,0,0.5)" }}>
//                     <div className="modal-dialog modal-lg">
//                         <div className="modal-content">
//                             <div className="modal-header bg-light">
//                                 <h5 className="modal-title text-primary">
//                                     <FaFilter className="me-2" />
//                                     Customer Filters
//                                 </h5>
//                                 <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)}></button>
//                             </div>

//                             <div className="modal-body">
//                                 <div className="row mb-3 g-3">
//                                     <div className="col-md-6">
//                                         <label className="form-label fw-bold small text-muted">FROM DATE</label>
//                                         <input
//                                             type="date"
//                                             className="form-control"
//                                             value={fromDate}
//                                             onChange={(e) => setFromDate(e.target.value)}
//                                         />
//                                     </div>
//                                     <div className="col-md-6">
//                                         <label className="form-label fw-bold small text-muted">TO DATE</label>
//                                         <input
//                                             type="date"
//                                             className="form-control"
//                                             value={toDate}
//                                             onChange={(e) => setToDate(e.target.value)}
//                                         />
//                                     </div>
//                                 </div>

//                                 <div className="row g-3">
//                                     <div className="col-md-6">
//                                         <div className="mb-3">
//                                             <label className="form-label fw-bold small text-muted">SALESMAN</label>
//                                             <Select
//                                                 value={salesmanOptions.find(option => option.value === salesmanName)}
//                                                 onChange={(selected) => setSalesmanName(selected ? selected.value : '')}
//                                                 options={salesmanOptions}
//                                                 isClearable
//                                                 placeholder="Select Salesman"
//                                             />
//                                         </div>
//                                     </div>

//                                     <div className="col-md-6">
//                                         <div className="mb-3">
//                                             <label className="form-label fw-bold small text-muted">ROUTE</label>
//                                             <Select
//                                                 value={routeOptions.find(option => option.value === routeName)}
//                                                 onChange={(selected) => setRouteName(selected ? selected.value : '')}
//                                                 options={routeOptions}
//                                                 isClearable
//                                                 placeholder="Select Route"
//                                             />
//                                         </div>
//                                     </div>

//                                     <div className="col-md-6">
//                                         <div className="mb-3">
//                                             <label className="form-label fw-bold small text-muted">CUSTOMER TYPE</label>
//                                             <Select
//                                                 value={customerTypeOptions.find(option => option.value === customerType)}
//                                                 onChange={(selected) => setCustomerType(selected ? selected.value : '')}
//                                                 options={customerTypeOptions}
//                                                 isClearable
//                                                 placeholder="Select Type"
//                                             />
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>

//                             <div className="modal-footer bg-light">
//                                 <div className="d-flex justify-content-between w-100">
//                                     <button type="button" className="btn btn-link text-danger" onClick={handleClear}>
//                                         Clear All
//                                     </button>
//                                     <div className="d-flex gap-2">
//                                         <button type="button" className="btn btn-outline-secondary" onClick={() => setIsModalOpen(false)}>
//                                             Cancel
//                                         </button>
//                                         <button
//                                             type="button"
//                                             className="btn btn-primary"
//                                             onClick={() => {
//                                                 fetchData();
//                                                 setIsModalOpen(false);
//                                                 setCurrentPage(1); // Reset to first page when applying filters
//                                             }}
//                                         >
//                                             Apply Filters
//                                         </button>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {/* DataTable */}
//             <div className="card shadow border-0 rounded mb-4" style={{ height: "calc(100vh - 230px)", display: "flex", flexDirection: "column" }}>
//                 {/* Scrollable Table */}
//                 <div style={{ flex: 1, overflowY: "auto" }}>
//                     <DataTable
//                         columns={columns}
//                         data={paginatedData}
//                         progressPending={loading}
//                         highlightOnHover
//                         striped
//                         pagination={false}
//                         fixedHeader
//                         fixedHeaderScrollHeight="100%"
//                         customStyles={customStyles}
//                         progressComponent={
//                             <div className="d-flex flex-column align-items-center justify-content-center w-100" style={{ height: "300px" }}>
//                                 <div className="text-center">
//                                     <div className="navbar-brand navbar-brand-autodark">SuitApps</div>
//                                     <div className="text-secondary mb-3">Preparing Report</div>
//                                     <div className="progress progress-sm">
//                                         <div className="progress-bar progress-bar-indeterminate"></div>
//                                     </div>
//                                 </div>
//                             </div>
//                         }
//                     />
//                 </div>

//                 {/* Fixed Footer with Pagination */}
//                 <div className="border-top bg-light shadow-sm" style={{ position: "sticky", bottom: 0, zIndex: 1000 }}>
//                     <CustomFooter
//                         rowsPerPage={rowsPerPage}
//                         rowCount={filteredData.length}
//                         currentPage={currentPage}
//                         onChangePage={(page) => setCurrentPage(page)}
//                         onChangeRowsPerPage={(count) => setRowsPerPage(count)}
//                     />
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default CustomerDetailsReport;
import React, { useState, useEffect, useMemo } from "react";
import api from '../../apiService';
import DataTable from "react-data-table-component";
import { FaSearch, FaFileExcel, FaPrint, FaFilter } from "react-icons/fa";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import "jspdf-autotable";
import Select from 'react-select';
import { usePermission } from '../../../src/context/permissionContex';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CustomerDetailsReport = () => {
    // ── Permissions ──
    const { getPermission, refreshPermissions } = usePermission();
    const permission = getPermission('CLIENT_DETAILS');
    const canView   = !!permission?.CanView;
    const canExport = !!permission?.CanExport;

    useEffect(() => {
        refreshPermissions();
    }, []);

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
    const [salesmanName, setSalesmanName] = useState("");
    const [routeName, setRouteName] = useState("");
    const [salesmenList, setSalesmenList] = useState([]);
    const [routesList, setRoutesList] = useState([]);
    const [customerType, setCustomerType] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(50);

    const customerTypeMap = {
        0: "Retail",
        1: "Wholesale",
        2: "Supermarket",
        3: "Distributor",
        4: "Other",
    };

    // Fetch data from the API
    const fetchData = async () => {
        if (!canView) return; // ── Permission guard ──

        setLoading(true);
        const CompanyID = sessionStorage.getItem("CompanyID");

        try {
            let url = `/api/GetCustomerDetailReport?CompanyID=${CompanyID}`;

            if (fromDate && toDate) {
                url += `&FromDate=${fromDate}&ToDate=${toDate}`;
            }

            const response = await api.get(url);

            if (response.data && Array.isArray(response.data)) {
                setData(response.data);

                // Extract unique salesmen
                const uniqueSalesmen = [...new Set(response.data.map((item) => item.Salesman))];
                setSalesmenList(uniqueSalesmen);

                // Extract unique routes
                const uniqueRoutes = [...new Set(response.data.map((item) => item.RootName))];
                setRoutesList(uniqueRoutes);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to fetch customer details.");
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!canView) {
            setData([]);
            return;
        }
        fetchData();
    }, [fromDate, toDate, canView]);

    const handleClear = () => {
        setFromDate("");
        setToDate(new Date().toISOString().split("T")[0]);
        setSalesmanName("");
        setRouteName("");
        setCustomerType("");
        setSearchQuery("");
        setCurrentPage(1);
        fetchData();
    };

    // Filter data based on search and filters
    // Update the filteredData calculation to this:
    const filteredData = useMemo(() => {
        return data.filter((item) => {
            // If search query is empty, return all items that match other filters
            if (searchQuery.trim() === "") {
                const matchesSalesman = salesmanName ? item.Salesman === salesmanName : true;
                const matchesRoute = routeName ? item.RootName === routeName : true;
                const matchesCustomerType = customerType ? String(item.CustomerType) === customerType : true;
                return matchesSalesman && matchesRoute && matchesCustomerType;
            }

            // Convert all searchable fields to lowercase strings for case-insensitive comparison
            const accountName = item.AccountName?.toString().toLowerCase() || "";
            const mobile = item.Mob?.toString().toLowerCase() || "";
            const route = item.RootName?.toString().toLowerCase() || "";
            const createdDate = item.CreatedDate?.toString().toLowerCase() || "";
            const lowerSearchQuery = searchQuery.toLowerCase();

            // Check if any field contains the search query
            const matchesSearch = accountName.includes(lowerSearchQuery) ||
                mobile.includes(lowerSearchQuery) ||
                route.includes(lowerSearchQuery) ||
                createdDate.includes(lowerSearchQuery);

            // Apply other filters
            const matchesSalesman = salesmanName ? item.Salesman === salesmanName : true;
            const matchesRoute = routeName ? item.RootName === routeName : true;
            const matchesCustomerType = customerType ? String(item.CustomerType) === customerType : true;

            return matchesSearch && matchesSalesman && matchesRoute && matchesCustomerType;
        });
    }, [data, searchQuery, salesmanName, routeName, customerType]);

    // Paginated data
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredData.slice(start, start + rowsPerPage);
    }, [filteredData, currentPage, rowsPerPage]);

    // Export to Excel
    const exportToExcel = () => {
        if (!canExport) { toast.error("You do not have permission to export reports."); return; }

        if (!filteredData.length) {
            alert("No data to export.");
            return;
        }

        // Title row
        const titleRow = [["Customer Details Report"]];

        // Filter section
        const filterRows = [
            ["From Date", fromDate || "All"],
            ["To Date", toDate || "All"],
            ["Salesman", salesmanName || "All"],
            ["Route", routeName || "All"],
            ["Customer Type", customerTypeMap[customerType] || "All"],
            [], // Spacer
        ];

        // Data headers and rows
        const headers = [
            "Sl No",
            "Customer Name",
            "Address",
            "City",
            "Mobile",
            "Route",
            "Customer Type",
            "Salesman",
            "Created Date",
        ];

        const dataRows = filteredData.map((row, index) => [
            index + 1,
            row.AccountName || "N/A",
            row.Address && row.Place ? `${row.Address}, ${row.Place}` : row.Address || row.Place || "N/A",
            row.city?.trim() !== "" ? row.city : row.City || "N/A",
            row.Mob || "N/A",
            row.RootName || "N/A",
            customerTypeMap[row.CustomerType] || "N/A",
            row.Salesman?.trim() || "N/A",
            row.CreatedDate || "N/A",
        ]);

        const wsData = [
            ...titleRow,
            ...filterRows,
            headers,
            ...dataRows,
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const titleMerge = XLSX.utils.decode_range(`A1:I1`);
        ws['!merges'] = [titleMerge];
        ws["A1"].s = {
            font: { bold: true, sz: 14 },
            alignment: { horizontal: "center" },
        };

        const columnWidths = headers.map(() => ({ wch: 20 }));
        ws['!cols'] = columnWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "CustomerDetailReport");
        XLSX.writeFile(wb, `CustomerDetailReport_${new Date().toISOString().slice(0, 10)}.xlsx`);
        toast.success("Exported to Excel");
    };

    // Export to PDF
    const exportToPDF = () => {
        if (!canExport) { toast.error("You do not have permission to export reports."); return; }

        if (!filteredData.length) {
            alert("No data to export.");
            return;
        }

        const doc = new jsPDF("landscape", "mm", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();

        // Title
        doc.setFontSize(16);
        doc.text("Customer Details Report", pageWidth / 2, 15, { align: "center" });

        // Filters
        const filterLines = [
            `From Date: ${fromDate || "All"}`,
            `To Date: ${toDate || "All"}`,
            `Salesman: ${salesmanName || "All"}`,
            `Route: ${routeName || "All"}`,
            `Customer Type: ${customerTypeMap[customerType] || "All"}`,
        ];

        doc.setFontSize(11);
        filterLines.forEach((line, i) => {
            doc.text(line, 14, 25 + i * 6);
        });

        const tableStartY = 25 + filterLines.length * 6 + 5;

        // Table column headers
        const tableColumn = [
            "Sl No",
            "Customer Name",
            "Address",
            "City",
            "Mobile",
            "Route",
            "Customer Type",
            "Salesman",
            "Created Date"
        ];

        // Table data
        const tableRows = filteredData.map((row, index) => ([
            index + 1,
            row.AccountName || "N/A",
            row.Address && row.Place ? `${row.Address}, ${row.Place}` : row.Address || row.Place || "N/A",
            row.city?.trim() !== "" ? row.city : row.City || "N/A",
            row.Mob || "N/A",
            row.RootName || "N/A",
            customerTypeMap[row.CustomerType] || "N/A",
            row.Salesman?.trim() || "N/A",
            row.CreatedDate || "N/A"
        ]));

        // AutoTable
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: tableStartY,
            theme: "grid",
            styles: {
                fontSize: 9,
                cellPadding: 2,
                overflow: "linebreak",
            },
            headStyles: {
                fillColor: [22, 160, 133],
                textColor: 255,
                fontSize: 10,
            },
            margin: { top: 10 },
            tableWidth: "auto",
            didDrawPage: (data) => {
                if (data.pageCount === 1) return;
            }
        });

        doc.save(`CustomerDetailReport_${new Date().toISOString().slice(0, 10)}.pdf`);
        toast.success("Exported to PDF");
    };

    // Columns configuration for the DataTable
    const columns = [
        { name: <span title="Serial Number">Sl.No</span>, selector: (_, index) => index + 1, sortable: true, width: "5%" },
        { name: <span title="Customer Name">Customer Name</span>, selector: (row) => row.AccountName ?? "N/A", sortable: true, width: "13%" },
        { name: <span title="Address">Address</span>, selector: (row) => row.Address && row.Place ? `${row.Address}, ${row.Place}` : "N/A", sortable: true, width: "19%" },
        { name: <span title="City">City</span>, selector: (row) => row.city && row.city.trim() !== "" ? row.city : row.City ?? "N/A", sortable: true, width: "12%" },
        { name: <span title="Mobile">Mobile</span>, selector: (row) => row.Mob ?? "N/A", sortable: true, width: "10%" },
        { name: <span title="Route">Route</span>, selector: (row) => row.RootName ?? "N/A", sortable: true, width: "13%" },
        { name: <span title="Type">Type</span>, selector: (row) => customerTypeMap[row.CustomerType] ?? "N/A", sortable: true, width: "10%" },
        { name: <span title="Salesman">Salesman</span>, selector: (row) => row.Salesman && row.Salesman.trim() !== "" ? row.Salesman : "N/A", sortable: true, width: "10%" },
        { name: <span title="Created Date">Created Date</span>, selector: (row) => row.CreatedDate ?? "N/A", sortable: true, width: "10%" },
    ];

    const customStyles = {
        table: {
            style: {
                border: "1px solid #dee2e6",
                borderRadius: "8px",
            },
        },
        head: {
            style: {
                backgroundColor: "#f8f9fa",
            },
        },
        headCells: {
            style: {
                fontSize: "13px",
                fontWeight: "bold",
                padding: "10px",
                backgroundColor: "#f1f3f5",
                color: "#343a40",
                borderBottom: "1px solid #dee2e6",
            },
        },
        rows: {
            style: {
                fontSize: "13px",
                minHeight: "48px",
                borderBottom: "1px solid #e9ecef",
            },
        },
        cells: {
            style: {
                padding: "10px 12px",
            },
        },
    };

    // Custom Footer Component
    const CustomFooter = ({ rowsPerPage, rowCount, currentPage, onChangePage, onChangeRowsPerPage }) => {
        const totalPages = Math.ceil(rowCount / rowsPerPage);

        return (
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-3 bg-light">
                <div className="fw-semibold text-dark mb-2 mb-md-0">
                    Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, rowCount)} of {rowCount} entries
                </div>

                <div className="d-flex flex-wrap align-items-center gap-2">
                    <label className="me-2">Rows per page:</label>
                    <select
                        value={rowsPerPage}
                        onChange={(e) => {
                            onChangeRowsPerPage(Number(e.target.value));
                            setCurrentPage(1); // Reset to first page when changing rows per page
                        }}
                        className="form-select form-select-sm w-auto"
                    >
                        <option value={250}>250</option>
                        <option value={500}>500</option>
                        <option value={1000}>1000</option>
                    </select>

                    <span className="mx-2">
                        Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                    </span>

                    <div className="btn-group btn-group-sm" role="group">
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => onChangePage(1)}
                            disabled={currentPage === 1}
                        >
                            ⏮
                        </button>
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => onChangePage(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            ◀
                        </button>
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => onChangePage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            ▶
                        </button>
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => onChangePage(totalPages)}
                            disabled={currentPage === totalPages}
                        >
                            ⏭
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Options for dropdowns
    const salesmanOptions = [
        { value: '', label: 'All Salesmen' },
        ...salesmenList.map(salesman => ({
            value: salesman,
            label: salesman
        }))
    ];

    const routeOptions = [
        { value: '', label: 'All Routes' },
        ...routesList.map(route => ({
            value: route,
            label: route
        }))
    ];

    const customerTypeOptions = [
        { value: '', label: 'All Types' },
        { value: '0', label: 'Retail' },
        { value: '1', label: 'Wholesale' },
        { value: '2', label: 'Supermarket' },
        { value: '3', label: 'Distributor' },
        { value: '4', label: 'Other' }
    ];

    // ── Access-denied view ──
    if (!canView) {
        return (
            <div className="container-fluid" style={{ backgroundColor: "white" }}>
                <ToastContainer position="top-center" autoClose={3000} />
                <div className="alert alert-danger mt-3">You do not have permission to view Customer Details Report.</div>
            </div>
        );
    }

    return (
        <div className="container-fluid" style={{ backgroundColor: "white" }}>
            <ToastContainer position="top-center" autoClose={3000} />

            {/* Search and Filter Header */}
            <div className="card shadow-sm mb-3 p-3">
                <h4>Customer Details Report</h4>
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
                                placeholder="Search by CustomerName,Salesman,City"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex flex-wrap justify-content-end gap-2 w-100 w-md-auto">
                        {/* Filter Button */}
                        <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <FaFilter className="me-1" /> Filters
                        </button>

                        {/* Export Buttons */}
                        {canExport && (
                            <div className="btn-group">
                                <button className="btn btn-outline" onClick={exportToExcel}>
                                    <FaFileExcel className="me-1" /> Excel
                                </button>
                                <button className="btn btn-outline" onClick={exportToPDF}>
                                    <FaPrint className="me-1" /> PDF
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Filter Modal */}
            {isModalOpen && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ background: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header bg-light">
                                <h5 className="modal-title text-primary">
                                    <FaFilter className="me-2" />
                                    Customer Filters
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)}></button>
                            </div>

                            <div className="modal-body">
                                <div className="row mb-3 g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold small text-muted">FROM DATE</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold small text-muted">TO DATE</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label fw-bold small text-muted">SALESMAN</label>
                                            <Select
                                                value={salesmanOptions.find(option => option.value === salesmanName)}
                                                onChange={(selected) => setSalesmanName(selected ? selected.value : '')}
                                                options={salesmanOptions}
                                                isClearable
                                                placeholder="Select Salesman"
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label fw-bold small text-muted">ROUTE</label>
                                            <Select
                                                value={routeOptions.find(option => option.value === routeName)}
                                                onChange={(selected) => setRouteName(selected ? selected.value : '')}
                                                options={routeOptions}
                                                isClearable
                                                placeholder="Select Route"
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label fw-bold small text-muted">CUSTOMER TYPE</label>
                                            <Select
                                                value={customerTypeOptions.find(option => option.value === customerType)}
                                                onChange={(selected) => setCustomerType(selected ? selected.value : '')}
                                                options={customerTypeOptions}
                                                isClearable
                                                placeholder="Select Type"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer bg-light">
                                <div className="d-flex justify-content-between w-100">
                                    <button type="button" className="btn btn-link text-danger" onClick={handleClear}>
                                        Clear All
                                    </button>
                                    <div className="d-flex gap-2">
                                        <button type="button" className="btn btn-outline-secondary" onClick={() => setIsModalOpen(false)}>
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={() => {
                                                fetchData();
                                                setIsModalOpen(false);
                                                setCurrentPage(1); // Reset to first page when applying filters
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

            {/* DataTable */}
            <div className="card shadow border-0 rounded mb-4" style={{ height: "calc(100vh - 230px)", display: "flex", flexDirection: "column" }}>
                {/* Scrollable Table */}
                <div style={{ flex: 1, overflowY: "auto" }}>
                    <DataTable
                        columns={columns}
                        data={paginatedData}
                        progressPending={loading}
                        highlightOnHover
                        striped
                        pagination={false}
                        fixedHeader
                        fixedHeaderScrollHeight="100%"
                        customStyles={customStyles}
                        progressComponent={
                            <div className="d-flex flex-column align-items-center justify-content-center w-100" style={{ height: "300px" }}>
                                <div className="text-center">
                                    <div className="navbar-brand navbar-brand-autodark">SuitApps</div>
                                    <div className="text-secondary mb-3">Preparing Report</div>
                                    <div className="progress progress-sm">
                                        <div className="progress-bar progress-bar-indeterminate"></div>
                                    </div>
                                </div>
                            </div>
                        }
                    />
                </div>

                {/* Fixed Footer with Pagination */}
                <div className="border-top bg-light shadow-sm" style={{ position: "sticky", bottom: 0, zIndex: 1000 }}>
                    <CustomFooter
                        rowsPerPage={rowsPerPage}
                        rowCount={filteredData.length}
                        currentPage={currentPage}
                        onChangePage={(page) => setCurrentPage(page)}
                        onChangeRowsPerPage={(count) => setRowsPerPage(count)}
                    />
                </div>
            </div>
        </div>
    );
};

export default CustomerDetailsReport;