import React, { useState, useEffect, useMemo, useRef } from "react";
import api from '../../apiService';
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { FaFileExcel, FaFilePdf, FaSearch, FaFilter } from "react-icons/fa";
import "jspdf-autotable";
import Select from 'react-select';

const LocalItemWisePurchase = () => {
    const getCurrentDate = () => new Date().toISOString().split("T")[0];
    const getPreviousDate = (days) => {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString().split("T")[0];
    };

    const [items, setItems] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [selectedItem, setSelectedItem] = useState(sessionStorage.getItem("selectedItem") || "");
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

    // Fetch items on component mount
    useEffect(() => {
        const fetchItems = async () => {
            const CompanyID = sessionStorage.getItem("CompanyID");
            try {
                const response = await api.get(`/api/webGetPurchaseItem?CompanyID=${CompanyID}`);
                setItems(response.data || []);
            } catch (error) {
                console.error("API Error:", error.message);
            }
        };
        fetchItems();
    }, []);

    // Fetch purchases when item or dates change
    useEffect(() => {
        if (selectedItem) {
            fetchPurchases();
        }
    }, [selectedItem, fromDate, toDate]);

    // Fetch purchases based on selected item and date range
    const fetchPurchases = async () => {
        if (!selectedItem) {
            console.warn("No item selected!");
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
                `/api/GetItemWisePurchase?from=${fromDate}&to=${toDate}&CompanyID=${CompanyID}&ItemId=${encodeURIComponent(selectedItem)}&FYearID=${FYearID}`
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
        setSelectedItem("");
        setSearchQuery("");
        sessionStorage.removeItem("selectedItem");
        sessionStorage.removeItem("fromDate");
        sessionStorage.removeItem("toDate");
    };

    // Export to Excel
    const exportToExcel = () => {
        try {
            if (!filteredPurchases.length) {
                alert("No data to export.");
                return;
            }

            const item = items.find(i => i.ItemID === selectedItem);
            const itemName = item?.ItemName || "All";

            const headerInfo = [
                ["Item", itemName],
                ["From Date", formatDate(fromDate)],
                ["To Date", formatDate(toDate)],
                []
            ];

            const headers = [
                "Sl No", "Purchase Date", "Purchase No", "Invoice Date", "Invoice No",
                "Item Name", "Unit", "Qty", "Free Qty", "Price",
                "Tax Name", "Tax %", "Tax Amount", "Item Amount"
            ];

            const excelData = filteredPurchases.map((row, index) => [
                index + 1,
                formatDate(row.PurchaseDate),
                row.PurchaseNo || "-",
                formatDate(row.InvoiceDate),
                row.SupplierInvoiceNo || "-",
                row.ItemName || "-",
                row.UnitName || "-",
                row.Quantity || 0,
                row.FreeQty || 0,
                row.UnitPrice || 0,
                row.TaxName || "-",
                row.TaxPercentage || 0,
                row.TaxAmount || 0,
                row.Amount || 0
            ]);

            // Add total row
            excelData.push([
                "TOTAL", "", "", "", "", "", "", "", "", "", "", "",
                formatAmount(filteredPurchases.reduce((sum, row) => sum + (row.TaxAmount || 0), 0)),
                formatAmount(filteredPurchases.reduce((sum, row) => sum + (row.Amount || 0), 0))
            ]);

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet([...headerInfo, headers, ...excelData]);
            XLSX.utils.book_append_sheet(wb, ws, "ItemPurchaseReport");
            XLSX.writeFile(wb, `ItemPurchaseReport_${fromDate}_to_${toDate}.xlsx`);
        } catch (error) {
            console.error("Excel export error:", error);
            alert("Failed to export to Excel. Please check console for details.");
        }
    };


    // Export to PDF
    const exportToPDF = () => {
        if (!filteredPurchases.length) {
            alert("No data to export.");
            return;
        }

        const item = items.find(i => i.ItemID === selectedItem);
        const itemName = item?.ItemName || "All";
        const totalTaxAmt = filteredPurchases.reduce((sum, row) => sum + (row.TaxAmount || 0), 0);
        const totalItemAmt = filteredPurchases.reduce((sum, row) => sum + (row.Amount || 0), 0);


        const doc = new jsPDF({ orientation: "landscape" });

        // Title
        doc.setFontSize(16);
        doc.text("Item Purchase Report", 14, 15);

        // Filters
        doc.setFontSize(10);
        doc.text(`Item: ${itemName}`, 14, 25);
        doc.text(`From Date: ${formatDate(fromDate)}`, 80, 25);
        doc.text(`To Date: ${formatDate(toDate)}`, 150, 25);

        // Table headers
        const tableColumn = [
            "Sl No", "Purchase Date", "Purchase No", "Invoice Date", "Invoice No",
            "Item Name", "Unit", "Qty", "Free Qty", "Price",
            "Tax Name", "Tax %", "Tax Amount", "Item Amount"
        ];

        // Table rows
        const tableRows = filteredPurchases.map((row, index) => [
            index + 1,
            formatDate(row.PurchaseDate),
            row.PurchaseNo || "-",
            formatDate(row.InvoiceDate),
            row.SupplierInvoiceNo || "-",
            row.ItemName || "-",
            row.UnitName || "-",
            row.Quantity || 0,
            row.FreeQty || 0,
            row.UnitPrice || 0,
            row.TaxName || "-",
            row.TaxPercentage || 0,
            row.TaxAmount ? formatAmount(row.TaxAmount) : "0.00",
            row.Amount ? formatAmount(row.Amount) : "0.00"
        ]);

        // Total row
        tableRows.push([
            { content: "TOTAL", colSpan: 12, styles: { fontStyle: "bold", halign: "right" } },
            { content: formatAmount(totalTaxAmt), styles: { fontStyle: "bold", halign: "right" } }, // Tax Amount
            { content: formatAmount(totalItemAmt), styles: { fontStyle: "bold", halign: "right" } }, // Item Amount
        ]);



        // AutoTable
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            theme: "grid",
            styles: {
                fontSize: 8,
                cellPadding: 2,
                overflow: "hidden",
                valign: "middle"
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
                0: { cellWidth: 10, halign: "center" }, // Sl No
                1: { cellWidth: 20, halign: "center" },
                2: { cellWidth: 15 },
                3: { cellWidth: 20, halign: "center" },
                4: { cellWidth: 20 },
                5: { cellWidth: 30 },
                6: { cellWidth: 10 },
                7: { cellWidth: 12 },
                8: { cellWidth: 12 },
                9: { cellWidth: 15, halign: "right" },
                10: { cellWidth: 18 },
                11: { cellWidth: 12 },
                12: { cellWidth: 20, halign: "right" },
                13: { cellWidth: 20, halign: "right" },
                14: { cellWidth: 25, halign: "right" },
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

        doc.save(`ItemPurchaseReport_${fromDate}_to_${toDate}.pdf`);
    };

    const columns = [
        { name: <span title="Serial Number">Sl.No</span>, selector: (_, index) => (currentPage - 1) * rowsPerPage + index + 1, sortable: true, width: "5.81%" },
        { name: <span title="Purchase Date">Purch.Date</span>, selector: (row) => formatDate(row.PurchaseDate), sortable: true, width: "9.3%" },
        { name: <span title="Purchase Number">Purch.No</span>, selector: (row) => row.PurchaseNo || 0, sortable: true, width: "6.98%" },
        { name: <span title="Invoice Date">Inv.Date</span>, selector: (row) => formatDate(row.InvoiceDate), sortable: true, width: "9.3%" },
        { name: <span title="Invoice Number">InvNo</span>, selector: (row) => row.SupplierInvoiceNo || 0, sortable: true, width: "8.14%" },
        { name: <span title="Item Name">ItmName</span>, selector: (row) => row.ItemName || 0, sortable: true, width: "10.47%" },
        { name: <span title="Unit">Unit</span>, selector: (row) => row.UnitName || 0, sortable: true, width: "5.81%" },
        { name: <span title="Quantity">Qty</span>, selector: (row) => row.Quantity || 0, sortable: true, width: "5.81%" },
        { name: <span title="Free Quantity">FreeQty</span>, selector: (row) => row.FreeQty || 0, sortable: true, width: "5.81%" },
        { name: <span title="Unit Price">Price</span>, selector: (row) => row.UnitPrice || 0, sortable: true, width: "6.98%" },
        { name: <span title="Tax Name">TxNme</span>, selector: (row) => row.TaxName || 0, sortable: true, width: "5.81%" },
        { name: <span title="Tax Percentage">Tx%</span>, selector: (row) => row.TaxPercentage || 0, sortable: true, width: "4.65%" },
        { name: <span title="Tax Amount">TxAmt</span>, selector: (row) => row.TaxAmount ? formatAmount(row.TaxAmount) : "0.00", sortable: true, width: "6.98%", right: true },
        { name: <span title="Item Amount">ItmAmt</span>, selector: (row) => row.Amount ? formatAmount(row.Amount) : "0.00", sortable: true, width: "8.14%", right: true },
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
                <h4>Item Purchase Report</h4>
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
                                placeholder="Search purchases by Item Name, Invoice No..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                ref={inputRef}
                                style={{ boxShadow: "none" }}
                            />
                            <div className="border-start" style={{ width: "180px" }}>
                                <Select
                                    options={items
                                        .filter(item => item.ItemID && item.ItemName)
                                        .map(item => ({
                                            value: item.ItemID,
                                            label: item.ItemName
                                        }))
                                    }
                                    value={selectedItem ? {
                                        value: selectedItem,
                                        label: items.find(i => i.ItemID === selectedItem)?.ItemName || 'Item'
                                    } : null}
                                    onChange={(selectedOption) => {
                                        setSelectedItem(selectedOption?.value || "");
                                        sessionStorage.setItem("selectedItem", selectedOption?.value || "");
                                    }}
                                    placeholder="Item"
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
                                    noOptionsMessage={() => "No items found"}
                                    loadingMessage={() => "Loading items..."}
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
                                Item Purchase Filters
                            </h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>

                        <div className="modal-body">
                            <form>
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

export default LocalItemWisePurchase;