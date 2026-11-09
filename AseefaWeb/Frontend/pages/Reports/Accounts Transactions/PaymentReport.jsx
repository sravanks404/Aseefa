
import React, { useState, useEffect, useMemo } from "react";
import api from "../../apiService";
import DataTable from "react-data-table-component";
import { FaSearch, FaFileExcel, FaFilePdf, FaFilter } from "react-icons/fa";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { usePermission } from "../../../src/context/permissionContex"; // adjust path to match your project

const FORM_CODE = "PAYMENT";

const Payment = () => {
    const { getPermission, refreshPermissions } = usePermission();
    const permission = getPermission(FORM_CODE);
    const [permissionsLoading, setPermissionsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const loadPermissions = async () => {
            await refreshPermissions();
            if (isMounted) setPermissionsLoading(false);
        };
        loadPermissions();
        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getCurrentDate = () => new Date().toISOString().split("T")[0];
    const getPreviousDate = (days) => {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString().split("T")[0];
    };

    const formatAmount = (amount) => {
        return parseFloat(amount || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const [fromDate, setFromDate] = useState(getPreviousDate(7));
    const [toDate, setToDate] = useState(getCurrentDate());
    const [payment, setPayment] = useState([]);
    const [result, setResult] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [type, setType] = useState("");
    const [approvalStatus, setApprovalStatus] = useState("");
    const [selectedSupplier, setSelectedSupplier] = useState(sessionStorage.getItem("selectedSupplier") || "");
    const [summary, setSummary] = useState({ Amt: 0, totalOrders: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(500);

    const fetchPayment = async () => {
        if (permissionsLoading || !permission.CanView) return;
        setIsLoading(true);
        setError("");
        try {
            const companyID = sessionStorage.getItem("CompanyID");
            if (!companyID) throw new Error("CompanyId is missing from sessionStorage");

            const response = await api.get("/api/GetPaymentReport", {
                params: { CompanyId: companyID, fromDate, ToDate: toDate }
            });

            let data = response?.data || [];
            setPayment(data);
            setResult(data);
        } catch (err) {
            console.error("Error fetching payment details:", err);
            setError(err.message || "Failed to fetch payment details.");
            setResult([]);
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        fetchPayment();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fromDate, toDate, selectedSupplier, permissionsLoading]);

    const handleClear = () => {
        setFromDate(getPreviousDate(7));
        setToDate(getCurrentDate());
        setType("");
        setApprovalStatus("");
        setError("");
        setSearchQuery("");
        setSelectedSupplier("");
        sessionStorage.removeItem("selectedSupplier");
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        fetchPayment();
    };

    const filteredResults = useMemo(() => {
        let filteredData = result;

        if (selectedSupplier) {
            filteredData = filteredData.filter(row => row.HSlNo === parseInt(selectedSupplier));
        }

        if (searchQuery) {
            filteredData = filteredData.filter(row =>
                row.Narration?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                row.HName?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (type && type !== "All") {
            filteredData = filteredData.filter(row => {
                let typeValue = Array.isArray(row.Type) ? row.Type.join(", ") : row.Type;
                return typeValue.includes(type);
            });
        }

        if (approvalStatus) {
            filteredData = filteredData.filter(row =>
                approvalStatus === "Approved" ? row.ApprovalStatus === 0 : row.ApprovalStatus === 1
            );
        }

        const filteredTotalAmount = filteredData.reduce((sum, row) => sum + (row.Amt || 0), 0);
        const filteredTotalOrders = filteredData.length;

        setSummary({ Amt: filteredTotalAmount, totalOrders: filteredTotalOrders });

        return filteredData;
    }, [result, selectedSupplier, searchQuery, type, approvalStatus]);

    const exportToExcel = () => {
        if (!permission.CanExport) {
            alert("You do not have permission to export this report.");
            return;
        }
        if (!filteredResults.length) {
            alert("No data to export.");
            return;
        }

        const formattedFromDate = fromDate ? new Date(fromDate).toLocaleDateString() : "N/A";
        const formattedToDate = toDate ? new Date(toDate).toLocaleDateString() : "N/A";
        const formattedType = type || "All";
        const formattedCustomerName = selectedSupplier
            ? payment.find((r) => r.HSlNo === parseInt(selectedSupplier))?.HName || "All"
            : "All";

        const totalAmount = filteredResults.reduce((sum, row) => sum + (row.Amt || 0), 0);

        const filterData = [
            ["From Date", formattedFromDate],
            ["To Date", formattedToDate],
            ["Type", formattedType],
            ["Customer Name", formattedCustomerName],
            ["Total Amount", totalAmount],
            [],
        ];

        const headers = [["Sl No", "Date", "Amount", "Ledger", "PaidTo", "Type", "Narration"]];

        const dataForExcel = filteredResults.map((row, index) => [
            (currentPage - 1) * rowsPerPage + index + 1,
            row.PDate ? new Date(row.PDate).toLocaleDateString() : "N/A",
            row.Amt ?? 0,
            row.HName || "N/A",
            row.Paidto || "N/A",
            cleanPaymentType(row.Type),
            row.Narration || "N/A",
        ]);

        const ws = XLSX.utils.aoa_to_sheet(filterData);
        XLSX.utils.sheet_add_aoa(ws, headers, { origin: filterData.length + 1 });
        XLSX.utils.sheet_add_aoa(ws, dataForExcel, { origin: filterData.length + 2 });

        const totalRowIndex = filterData.length + 2 + dataForExcel.length;
        const totalRow = ["", "", totalAmount, "Total", "", "", ""];

        XLSX.utils.sheet_add_aoa(ws, [totalRow], { origin: totalRowIndex });

        // Format "Amount" column (index 2) to 2 decimal places
        for (let i = 0; i <= dataForExcel.length; i++) {
            const dataRowIndex = filterData.length + 2 + i;
            const cellRef = XLSX.utils.encode_cell({ r: dataRowIndex, c: 2 });
            if (ws[cellRef] && typeof ws[cellRef].v === "number") {
                ws[cellRef].z = "0.00";
            }
        }

        // Format total cell explicitly
        const totalCellRef = XLSX.utils.encode_cell({ r: totalRowIndex, c: 2 });
        if (ws[totalCellRef] && typeof ws[totalCellRef].v === "number") {
            ws[totalCellRef].z = "0.00";
        }

        // ✅ Auto-size important columns to prevent ##### issue
        ws['!cols'] = [
            { wch: 8 },   // Sl No
            { wch: 12 },  // Date
            { wch: 15 },  // Amount
            { wch: 20 },  // Ledger
            { wch: 20 },  // PaidTo
            { wch: 15 },  // Type
            { wch: 40 },  // Narration
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "PaymentReport");
        XLSX.writeFile(wb, `Payment_Report_${fromDate}_to_${toDate}.xlsx`);
    };



    const exportToPDF = () => {
        if (!permission.CanExport && !permission.CanPrint) {
            alert("You do not have permission to export this report.");
            return;
        }
        if (!filteredResults.length) {
            alert("No data to export.");
            return;
        }

        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Payment Report", 14, 10);

        const formattedFromDate = fromDate ? new Date(fromDate).toLocaleDateString() : "N/A";
        const formattedToDate = toDate ? new Date(toDate).toLocaleDateString() : "N/A";
        const formattedType = type || "All";
        const formattedCustomerName = selectedSupplier
            ? payment.find((r) => r.HSlNo === parseInt(selectedSupplier))?.HName || "All"
            : "All";

        const totalAmount = filteredResults.reduce((sum, row) => sum + (row.Amt || 0), 0);

        // Add filter info
        doc.setFontSize(10);
        let y = 18;
        const filterLines = [
            `From Date: ${formattedFromDate}      To Date: ${formattedToDate}`,
            `Type: ${formattedType}      Customer Name: ${formattedCustomerName}`,
            `Total Amount: ${formatAmount(totalAmount)}`
        ];
        filterLines.forEach((line) => {
            doc.text(line, 14, y);
            y += 6;
        });

        // Table columns
        const tableColumn = ["SL.No", "Date", "Amount", "Ledger", "Paid To", "Type", "Narration"];

        // Data rows
        const tableRows = filteredResults.map((row, index) => {
            return [
                index + 1,
                row.PDate ? new Date(row.PDate).toLocaleDateString() : "N/A",
                formatAmount(row.Amt),
                row.HName || "N/A",
                row.Paidto || "N/A",
                cleanPaymentType(row.Type),
                row.Narration || "N/A",
            ];
        });

        // Add total row
        tableRows.push([
            { content: "TOTAL", colSpan: 3, styles: { fontStyle: "bold", halign: "center" } },
            { content: formatAmount(totalAmount), styles: { fontStyle: "bold" } },
            "", "", ""
        ]);

        // Render table
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: y + 2,
            theme: "grid",
            styles: { fontSize: 10 },
            columnStyles: {
                0: { cellWidth: 10 },  // SL.No
                1: { cellWidth: 20 },  // Date
                2: { cellWidth: 20 },  // Amount
                3: { cellWidth: 30 },  // Ledger
                4: { cellWidth: 30 },  // Paid To
                5: { cellWidth: 25 },  // Type
                6: { cellWidth: 40 },  // Narration
            },
            margin: { top: 20 },
        });

        doc.save(`Payment_Report_${fromDate}_to_${toDate}.pdf`);
    };

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

    // Add this helper function near the top of your component
    const cleanPaymentType = (typeValue) => {
        if (!typeValue) return "N/A";

        // Convert array to string if needed
        if (Array.isArray(typeValue)) {
            typeValue = typeValue.join(", ");
        }

        // Take only the part before the first comma
        const cleanType = typeValue.split(",")[0].trim();

        // Map common abbreviations to full names if needed
        const typeMap = {
            'C': 'Cash',
            'B': 'Bank',
            'O': 'Online Payment',
            'N': 'NEFT'
        };

        // Return mapped value or the clean type
        return typeMap[cleanType] || cleanType || "N/A";
    };

    const columns = [
        { name: "Sl.No", selector: (_, index) => (currentPage - 1) * rowsPerPage + index + 1, sortable: false, width: "6%" },
        { name: "Date", selector: (row) => (row.PDate ? new Date(row.PDate).toLocaleDateString() : "N/A"), sortable: true, width: "12%" },
        { name: "Amount", selector: (row) => formatAmount(row.Amt), sortable: true, width: "12%" },
        { name: "Ledger", selector: (row) => row.HName || "N/A", sortable: true, width: "17%" },
        { name: "Paid To", selector: (row) => row.Paidto || "N/A", sortable: true, width: "15%" },
        {
            name: "Type",
            selector: (row) => cleanPaymentType(row.Type),
            cell: (row) => <span>{cleanPaymentType(row.Type)}</span>,
            sortable: true,
            width: "14%"
        },
        { name: "Narration", selector: (row) => row.Narration || "N/A", sortable: true, width: "24%" },
    ];


    const CustomFooter = ({ rowsPerPage, rowCount, currentPage, onChangePage, onChangeRowsPerPage }) => {
        const totalPages = Math.ceil(rowCount / rowsPerPage);

        return (
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-3 bg-light">
                <div className="fw-semibold text-dark mb-2 mb-md-0">
                    Total Amount: {summary.Amt ? formatAmount(summary.Amt) : "N/A"}
                </div>

                <div className="d-flex flex-wrap align-items-center gap-2">
                    <label className="me-2">Rows per page:</label>
                    <select
                        value={rowsPerPage}
                        onChange={(e) => onChangeRowsPerPage(Number(e.target.value))}
                        className="form-select form-select-sm w-auto"
                    >
                        <option value={500}>500</option>
                        <option value={1000}>1000</option>
                        <option value={10000}>10000</option>
                    </select>

                    <span className="mx-2">
                        Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                    </span>

                    <div className="btn-group btn-group-sm" role="group">
                        <button className="btn btn-outline-secondary" onClick={() => onChangePage(1)} disabled={currentPage === 1}>⏮</button>
                        <button className="btn btn-outline-secondary" onClick={() => onChangePage(currentPage - 1)} disabled={currentPage === 1}>◀</button>
                        <button className="btn btn-outline-secondary" onClick={() => onChangePage(currentPage + 1)} disabled={currentPage === totalPages}>▶</button>
                        <button className="btn btn-outline-secondary" onClick={() => onChangePage(totalPages)} disabled={currentPage === totalPages}>⏭</button>
                    </div>
                </div>
            </div>
        );
    };

    const paginatedResults = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredResults.slice(start, start + rowsPerPage);
    }, [filteredResults, currentPage, rowsPerPage]);

    // Wait for the permission refresh to complete before deciding what to show
    if (permissionsLoading) {
        return (
            <div className="container-fluid d-flex align-items-center justify-content-center" style={{ height: "60vh" }}>
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <div className="text-muted">Checking permissions...</div>
                </div>
            </div>
        );
    }

    // Block the whole page if the user has no view permission for PAYMENT
    if (!permission.CanView) {
        return (
            <div className="container-fluid d-flex align-items-center justify-content-center" style={{ height: "60vh" }}>
                <div className="text-center">
                    <h5 className="text-danger">Access Denied</h5>
                    <p className="text-muted">You do not have permission to view the Payment Report.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            {/* Header with Search and Export Buttons */}
            <div className="card shadow-sm mb-3 p-3">
                <h4>Payment Report</h4>
                <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
                    {/* Search Input */}
                    <div className="w-100 w-md-50">
                        <div className="input-group">
                            <span className="input-group-text bg-primary text-white">
                                <FaSearch />
                            </span>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search payments by narration, ledger..."
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
                            data-bs-toggle="modal"
                            data-bs-target="#filterModal"
                        >
                            <FaFilter className="me-1" /> Filters
                        </button>

                        {/* Export Buttons - only visible if user has export permission */}
                        {permission.CanExport && (
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
                <div className="modal-dialog modal-lg modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header bg-light">
                            <h5 className="modal-title text-primary" id="filterModalLabel">
                                <FaFilter className="me-2" />
                                Payment Report Filters
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
                                </div>

                                {/* Main Filters */}
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        {/* Customer */}
                                        <div className="mb-3">
                                            <label htmlFor="Customer" className="form-label fw-bold small text-muted">CUSTOMER</label>
                                            <select
                                                id="Customer"
                                                className="form-select"
                                                value={selectedSupplier}
                                                onChange={(e) => {
                                                    setSelectedSupplier(e.target.value);
                                                    sessionStorage.setItem("selectedSupplier", e.target.value);
                                                }}
                                            >
                                                <option value="">All Customers</option>
                                                {Array.from(
                                                    new Map(payment.map((supplier) => [supplier.HName, supplier]))
                                                        .values()
                                                ).map((supplier) => (
                                                    <option key={supplier.HSlNo} value={supplier.HSlNo}>
                                                        {supplier.HName || "Unknown Supplier"}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Type */}
                                        <div className="mb-3">
                                            <label htmlFor="Type" className="form-label fw-bold small text-muted">TYPE</label>
                                            <select
                                                id="Type"
                                                className="form-select"
                                                value={type}
                                                onChange={(e) => setType(e.target.value)}
                                            >
                                                <option value="">All Types</option>
                                                <option value="Cash">Cash</option>
                                                <option value="Bank">Bank</option>
                                                <option value="NEFT">NEFT</option>
                                                <option value="Online Payment">Online Payment</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Approval status filter - only relevant if user can approve payments */}
                                    {permission.CanApprove && (
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="Status" className="form-label fw-bold small text-muted">APPROVAL STATUS</label>
                                                <select
                                                    id="Status"
                                                    className="form-select"
                                                    value={approvalStatus}
                                                    onChange={(e) => setApprovalStatus(e.target.value)}
                                                >
                                                    <option value="">All Status</option>
                                                    <option value="Approved">Approved</option>
                                                    <option value="NotApproved">Not Approved</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
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

            {/* Data Table Section */}
            <div className="card shadow border-0 rounded mb-4" style={{ height: "calc(100vh - 230px)", display: "flex", flexDirection: "column" }}>
                {/* Scrollable Table */}
                <div style={{ flex: 1, overflowY: "auto" }}>
                    <DataTable
                        columns={columns}
                        data={paginatedResults}
                        progressPending={isLoading}
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

                {/* Fixed Footer */}
                <div className="border-top bg-light shadow-sm" style={{ position: "sticky", bottom: 0, zIndex: 1000 }}>
                    <CustomFooter
                        rowsPerPage={rowsPerPage}
                        rowCount={filteredResults.length}
                        currentPage={currentPage}
                        onChangePage={(page) => setCurrentPage(page)}
                        onChangeRowsPerPage={(count) => {
                            setRowsPerPage(count);
                            setCurrentPage(1);
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Payment;