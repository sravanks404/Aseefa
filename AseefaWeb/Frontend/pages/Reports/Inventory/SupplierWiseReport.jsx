import { useState, useEffect, useRef, useMemo } from "react";
import DataTable from "react-data-table-component";
import api from '../../apiService';
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { FaFileExcel, FaFilePdf, FaSearch, FaFilter } from "react-icons/fa";
import "jspdf-autotable";
import ReactSelect from 'react-select';
import Select from 'react-select';

const SupplierPurchase = () => {
    const getCurrentDate = () => new Date().toISOString().split("T")[0];
    const getPreviousDate = (days) => {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString().split("T")[0];
    };

    const getFirstDayOfMonth = () => {
        const date = new Date();
        date.setDate(1);
        return date.toISOString().split("T")[0];
    };

    const [suppliers, setSuppliers] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState(sessionStorage.getItem("selectedSupplier") || "");
    const [fromDate, setFromDate] = useState(getPreviousDate(7));
    const [toDate, setToDate] = useState(getCurrentDate());
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(500);
    const inputRef = useRef(null);

    // Format currency
    const formatAmount = (amount) => {
        return parseFloat(amount || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Fetch suppliers on component mount
    useEffect(() => {
        const fetchSuppliers = async () => {
            const CompanyID = sessionStorage.getItem("CompanyID");
            try {
                const response = await api.get(`/api/webGetSupplier?CompanyID=${CompanyID}`);
                const validSuppliers = (response.data || []).filter(
                    supplier => supplier.AccountID && supplier.AccountName
                );
                setSuppliers(validSuppliers);
            } catch (error) {
                console.error("API Error:", error.message);
            }
        };
        fetchSuppliers();
    }, []);

    // Fetch purchases when supplier or dates change
    useEffect(() => {
        if (selectedSupplier) {
            fetchPurchases();
        }
    }, [selectedSupplier, fromDate, toDate]);

    // Fetch purchases based on selected supplier and date range
    const fetchPurchases = async () => {
        if (!selectedSupplier) {
            console.warn("No supplier selected!");
            setPurchases([]);
            return;
        }

        const CompanyID = sessionStorage.getItem("CompanyID") || "-";
        const financialResponse = sessionStorage.getItem("financialResponse");
        let FYearID = null;

        if (financialResponse) {
            try {
                const parsedResponse = JSON.parse(financialResponse);
                FYearID = parsedResponse?.FYearID || "-";
            } catch (error) {
                console.error("Error parsing financialResponse:", error);
            }
        }

        if (!FYearID) {
            console.error("FYearID is missing!");
            return;
        }

        setLoading(true);
        try {
            const response = await api.get(
                `/api/GetSupplierWiseReport?from=${fromDate}&to=${toDate}&CompanyID=${CompanyID}&SupplierId=${selectedSupplier}&FYearID=${FYearID}`
            );
            setPurchases(response.data || []);
        } catch (error) {
            console.error("Error fetching purchases:", error);
            setPurchases([]);
        } finally {
            setLoading(false);
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        return dateString ? new Date(dateString).toLocaleDateString() : "-";
    };

    // Filter purchases based on search query
    const filteredPurchases = useMemo(() => {
        if (!searchQuery) return purchases;

        return purchases.filter((row) =>
            Object.values(row).some(
                (value) =>
                    value &&
                    value.toString().toLowerCase().includes(searchQuery.toLowerCase())
            ));
    }, [purchases, searchQuery]);

    // Calculate total amount
    const totalAmount = useMemo(() => {
        return filteredPurchases.reduce((sum, row) => sum + (row.Amount || 0), 0);
    }, [filteredPurchases]);

    // Handle clear
    const handleClear = () => {
        setFromDate(getPreviousDate(7));
        setToDate(getCurrentDate());
        setPurchases([]);
        setSelectedSupplier("");
        setSearchQuery("");
        sessionStorage.removeItem("selectedSupplier");
        sessionStorage.removeItem("fromDate");
        sessionStorage.removeItem("toDate");
    };

    // Export to Excel
    const exportToExcel = () => {
        if (!filteredPurchases.length) {
            alert("No data to export.");
            return;
        }

        const supplier = suppliers.find(s => s.AccountID === selectedSupplier);
        const supplierName = supplier?.AccountName || "All";

        // Calculate totals
        // const totalAmount = filteredPurchases.reduce((sum, row) => sum + (row.TotalInvoceAmount || 0), 0);
        const totalItemAmount = filteredPurchases.reduce((sum, row) => sum + (row.Amount || 0), 0);
        const totalTaxAmount = filteredPurchases.reduce((sum, row) => sum + (row.TaxAmount || 0), 0);

        // Filter Metadata Info
        const filterData = [
            ["Supplier", supplierName],
            ["From Date", formatDate(fromDate)],
            ["To Date", formatDate(toDate)],
            ["Total Amount", formatAmount(totalAmount)],
            [] // Spacer
        ];

        // Column headers
        const headers = [["Sl No", "Date", "Purchase No", "Invoice Date", "Invoice No",
            "Item Name", "Unit", "Qty", "Price", "Tax Name",
            "Tax %", "Item Amount", "Tax Amount", "Total Amount",
            "Delivery Rate", "Discount Rate", "Freight Less Rate", "Round Off"]];

        // Data rows
        const dataForExcel = filteredPurchases.map((row, index) => [
            index + 1,
            formatDate(row.PurchaseDate),
            row.PurchaseNo || "-",
            formatDate(row.InvoiceDate),
            row.SupplierInvoiceNo || "-",
            row.ItemName || "-",
            row.UnitName || "-",
            row.Quantity || 0,
            row.UnitPrice || 0,
            row.TaxName || "-",
            row.TaxPercentage || 0,
            row.Amount || 0,
            row.TaxAmount || 0,
            row.TotalInvoceAmount || 0,
            row.DeliveryRate || 0,
            row.DiscountRate || 0,
            row.FrightLessRate || 0,
            row.Roundoff || 0,
        ]);

        // Add total row at the bottom with bold styling
        dataForExcel.push([
            "TOTAL", "", "", "", "", "", "", "", "", "", "",
            totalItemAmount, totalTaxAmount, totalAmount,
            "", "", "", ""
        ]);

        // Add a row specifically for Total Amount in a more prominent way
        dataForExcel.push([
            "", "", "", "", "", "", "", "", "", "", "", "", "", "",
            "Total Amount:", "", formatAmount(totalAmount), "", "", "", ""
        ]);

        // Create worksheet and add everything
        const ws = XLSX.utils.aoa_to_sheet(filterData);
        XLSX.utils.sheet_add_aoa(ws, headers, { origin: filterData.length + 1 });
        XLSX.utils.sheet_add_aoa(ws, dataForExcel, { origin: filterData.length + 2 });

        // Optional: Set column widths
        ws["!cols"] = headers[0].map(() => ({ wch: 15 }));

        // Optional: Apply bold font style to the total row (last row in the data)
        const totalRowIdx = filterData.length + 2 + dataForExcel.length - 2; // Index of the total row (last row before total amount)
        const totalAmountRowIdx = filterData.length + 2 + dataForExcel.length - 1; // Index of the total amount row
        for (let col = 0; col < headers[0].length; col++) {
            const totalCell = ws[XLSX.utils.encode_cell({ r: totalRowIdx, c: col })];
            if (totalCell) {
                totalCell.s = { font: { bold: true } };
            }

            const totalAmountCell = ws[XLSX.utils.encode_cell({ r: totalAmountRowIdx, c: col })];
            if (totalAmountCell) {
                totalAmountCell.s = { font: { bold: true } };
            }
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "SupplierPurchases");
        XLSX.writeFile(wb, `SupplierPurchases_${fromDate}_to_${toDate}.xlsx`);
    };






    // Export to PDF
    const exportToPDF = () => {
        if (!filteredPurchases.length) {
            alert("No data to export.");
            return;
        }

        const doc = new jsPDF("landscape", "mm", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();

        // Safely get supplier name
        const supplier = suppliers.find(s => s.AccountID === selectedSupplier);
        const supplierName = supplier?.AccountName || "All";

        // Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Supplier Purchase Report", pageWidth / 2, 15, { align: "center" });

        // Filters
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Supplier: ${supplierName}`, 14, 22);
        doc.text(`From Date: ${formatDate(fromDate)}   To Date: ${formatDate(toDate)}`, 14, 28);
        doc.text(`Total Amount: ${formatAmount(totalAmount)}`, 14, 34);

        const headers = [
            "Sl No", "Date", "Purchase No", "Invoice Date", "Invoice No", "Item Name", "Unit",
            "Qty", "Price", "Tax Name", "Tax %", "Item Amount", "Tax Amount",
            "Total Amount", "Delivery Rate", "Discount Rate", "Freight Less Rate", "Round Off"
        ];

        const rows = filteredPurchases.map((row, index) => [
            index + 1,
            formatDate(row.PurchaseDate),
            row.PurchaseNo || "-",
            formatDate(row.InvoiceDate),
            row.SupplierInvoiceNo || "-",
            row.ItemName || "-",
            row.UnitName || "-",
            row.Quantity || 0,
            row.UnitPrice || 0,
            row.TaxName || "-",
            row.TaxPercentage || 0,
            row.Amount || 0,
            row.TaxAmount || 0,
            row.TotalInvoceAmount || 0,
            row.DeliveryRate || 0,
            row.DiscountRate || 0,
            row.FrightLessRate || 0,
            row.Roundoff || 0,
        ]);

        // Add total row
        rows.push([
            { content: "TOTAL", colSpan: 10, styles: { fontStyle: "bold", halign: "center" } },
            "", "", "", "", "", "", "",
            { content: filteredPurchases.reduce((sum, row) => sum + (row.Amount || 0), 0).toFixed(2), styles: { fontStyle: "bold" } },
            { content: filteredPurchases.reduce((sum, row) => sum + (row.TaxAmount || 0), 0).toFixed(2), styles: { fontStyle: "bold" } },
            { content: filteredPurchases.reduce((sum, row) => sum + (row.TotalInvoceAmount || 0), 0).toFixed(2), styles: { fontStyle: "bold" } },
            "", "", "", ""
        ]);

        doc.autoTable({
            startY: 40,
            head: [headers],
            body: rows,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [22, 160, 133], textColor: 255, halign: "center" },
            theme: "grid",
            margin: { top: 30 },
            pageBreak: "auto",
        });

        doc.save(`SupplierPurchases_${fromDate}_to_${toDate}.pdf`);
    };

    const columns = [
        { name: <span title="Serial Number">Sl.No</span>, selector: (_, index) => (currentPage - 1) * rowsPerPage + index + 1, sortable: true, width: "70px", right: false },
        { name: <span title="Date">Date</span>, selector: (row) => formatDate(row.PurchaseDate), sortable: true, width: "84px", right: false },
        { name: <span title="Purchase Number">Pur.No</span>, selector: (row) => row.PurchaseNo || 0, sortable: true, width: "72px", right: true },
        { name: <span title="Invoice Number">InvNo</span>, selector: (row) => row.SupplierInvoiceNo || 0, sortable: true, width: "72px", right: true },
        { name: <span title="Item Name">ItmName</span>, selector: (row) => row.ItemName || "", sortable: true, width: "300px", right: false },
        { name: <span title="Unit">Unit</span>, selector: (row) => row.UnitName || "", sortable: true, width: "60px", right: false },
        { name: <span title="Quantity">Qty</span>, selector: (row) => row.Quantity || 0, sortable: true, width: "60px", right: true },
        { name: <span title="Unit Price">Price</span>, selector: (row) => row.UnitPrice || 0, sortable: true, width: "100px", right: true },
        { name: <span title="Tax Name">TxNme</span>, selector: (row) => row.TaxName || "", sortable: true, width: "60px", right: false },
        { name: <span title="Tax Percentage">Tx%</span>, selector: (row) => row.TaxPercentage || 0, sortable: true, width: "48px", right: true },
        { name: <span title="Item Amount">ItmAmt</span>, selector: (row) => row.Amount ? formatAmount(row.Amount) : "0.00", sortable: true, width: "108px", right: true },
        { name: <span title="Tax Amount">TxAmt</span>, selector: (row) => row.TaxAmount ? formatAmount(row.TaxAmount) : "0.00", sortable: true, width: "84px", right: true },
        { name: <span title="Delivery Rate">DlryRt</span>, selector: (row) => row.DeliveryRate || 0, sortable: true, width: "60px", right: true },
        { name: <span title="Discount Rate">DisRt</span>, selector: (row) => row.DiscountRate || 0, sortable: true, width: "72px", right: true },
        { name: <span title="Freight Less Rate">FRTLRt</span>, selector: (row) => row.FrightLessRate || 0, sortable: true, width: "60px", right: true },
        { name: <span title="Round Off">R.Off</span>, selector: (row) => row.Roundoff || 0, sortable: true, width: "72px", right: true }
    ];


    // Table styles
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
                whiteSpace: "normal",
            },
        },
    };

    // Custom footer component
    const CustomFooter = ({ rowsPerPage, rowCount, currentPage, onChangePage, onChangeRowsPerPage }) => {
        const totalPages = Math.ceil(rowCount / rowsPerPage);

        return (
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-3 bg-light">
                <div className="fw-semibold text-dark mb-2 mb-md-0">
                    Total Amount: {totalAmount ? formatAmount(totalAmount) : "N/A"}
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
                        <option value={1000}>1000</option>
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

    // Paginated results
    const paginatedResults = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredPurchases.slice(start, start + rowsPerPage);
    }, [filteredPurchases, currentPage, rowsPerPage]);

    return (
        <div className="container-fluid">
            {/* Header with Search and Export Buttons */}
            <div className="card shadow-sm mb-3 p-3">
                <h4>Supplier Purchase Report</h4>
                <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
                    {/* Search Input */}
                    <div className="w-100 w-md-50">
                        <div className="input-group" style={{ border: "1px solid #dee2e6", borderRadius: "4px" }}>
                            <span className="input-group-text" style={{ backgroundColor: '#0056A6', border: 'none', borderTopLeftRadius: '4px', borderBottomLeftRadius: '4px' }}>
                                <FaSearch className="text-white" />
                            </span>

                            <input
                                type="text"
                                className="form-control border-0"
                                placeholder="Search purchases by Item Name,amount"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                ref={inputRef}
                                style={{ boxShadow: "none" }}
                            />
                            <div className="border-start" style={{ width: "180px" }}>
                                <Select
                                    options={suppliers
                                        .filter(supplier => supplier.AccountID && supplier.AccountName)
                                        .map(supplier => ({
                                            value: supplier.AccountID,
                                            label: supplier.AccountName
                                        }))
                                    }
                                    value={selectedSupplier ? {
                                        value: selectedSupplier,
                                        label: suppliers.find(s => s.AccountID === selectedSupplier)?.AccountName || 'Supplier'
                                    } : null}
                                    onChange={(selectedOption) => {
                                        setSelectedSupplier(selectedOption?.value || "");
                                        sessionStorage.setItem("selectedSupplier", selectedOption?.value || "");
                                    }}
                                    placeholder="Supplier"
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
                                    noOptionsMessage={() => "No suppliers found"}
                                    loadingMessage={() => "Loading suppliers..."}
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
                        <div className="btn-group">
                            <button className="btn btn-outline" onClick={exportToExcel}>
                                <FaFileExcel className="me-1" /> Excel
                            </button>
                            <button className="btn btn-outline" onClick={exportToPDF}>
                                <FaFilePdf className="me-1" /> PDF
                            </button>
                        </div>
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
                                Supplier Purchase Filters
                            </h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>

                        <div className="modal-body">
                            <form>
                                {/* Supplier Selection */}
                                {/* <div className="col-md-12">
                                    <label htmlFor="Supplier" className="form-label fw-bold small text-muted">SUPPLIER</label>
                                    <ReactSelect
                                        id="Supplier"
                                        options={suppliers
                                            .filter(supplier => supplier.AccountID && supplier.AccountName)
                                            .map(supplier => ({
                                                value: supplier.AccountID,
                                                label: supplier.AccountName
                                            }))
                                        }
                                        value={selectedSupplier ? {
                                            value: selectedSupplier,
                                            label: suppliers.find(s => s.AccountID === selectedSupplier)?.AccountName || 'Select Supplier'
                                        } : null}
                                        onChange={(selectedOption) => {
                                            setSelectedSupplier(selectedOption?.value || "");
                                            sessionStorage.setItem("selectedSupplier", selectedOption?.value || "");
                                        }}
                                        placeholder="Search and select supplier..."
                                        isClearable
                                        isSearchable
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                minHeight: '38px',
                                                borderColor: '#dee2e6',
                                                '&:hover': {
                                                    borderColor: '#adb5bd'
                                                }
                                            }),
                                            menu: (base) => ({
                                                ...base,
                                                zIndex: 9999
                                            })
                                        }}
                                        components={{
                                            DropdownIndicator: () => (
                                                <div className="pe-2">
                                                    <FaSearch />
                                                </div>
                                            ),
                                            ClearIndicator: () => null
                                        }}
                                        noOptionsMessage={() => "No suppliers found"}
                                        loadingMessage={() => "Loading suppliers..."}
                                    />
                                </div> */}

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
                                <button type="button" className="btn btn-link text-danger" onClick={handleClear} disabled={loading}>
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
                                        onClick={fetchPurchases}
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

                {/* Fixed Footer */}
                <div className="border-top bg-light shadow-sm" style={{ position: "sticky", bottom: 0, zIndex: 1000 }}>
                    <CustomFooter
                        rowsPerPage={rowsPerPage}
                        rowCount={filteredPurchases.length}
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

export default SupplierPurchase;