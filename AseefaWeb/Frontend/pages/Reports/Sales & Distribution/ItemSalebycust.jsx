import React, { useState, useEffect, useMemo, useCallback } from "react";
import api from "../../apiService";
import Select from "react-select";
import { FaSearch, FaFileExcel, FaFilePdf, FaFilter } from "react-icons/fa";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";

const ItemSalebycust = () => {
    // Helper functions
    const getCurrentDate = useMemo(() => () => new Date().toISOString().split("T")[0], []);
    const getPreviousDate = useMemo(() => (days) => {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString().split("T")[0];
    }, []);

    // State
    const [fromDate, setFromDate] = useState(getPreviousDate(30));
    const [toDate, setToDate] = useState(getCurrentDate());
    const [options, setOptions] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saleitem, Setsalesitem] = useState([]);
    const [selectedSalesman, setSelectedSalesman] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState(null);

    const companyID = sessionStorage.getItem("CompanyID");

    // Memoized derived data
    const salesmanOptions = useMemo(() =>
        Array.from(new Set(saleitem.map(item => item.SalesmanName)))
            .map(name => ({ value: name, label: name })),
        [saleitem]
    );

    const customerOptions = useMemo(() =>
        Array.from(new Set(saleitem.map(item => item.CustomerName)))
            .map(name => ({ value: name, label: name })),
        [saleitem]
    );

    const routeOptions = useMemo(() =>
        Array.from(new Set(saleitem.map(item => item.RootName)))
            .map(name => ({ value: name, label: name })),
        [saleitem]
    );

    // Fetch items
    const fetchItems = useCallback(async () => {
        if (!companyID) return;

        setLoading(true);
        try {
            const res = await api.get("/api/itembybill", {
                params: { CompanyID: companyID },
            });
            const formattedOptions = res.data.map(item => ({
                value: item.ItemID,
                label: item.ItemName,
            }));
            setOptions(formattedOptions);
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    }, [companyID]);

    // Fetch sales data
    const Fetchitemwisesale = useCallback(async () => {
        if (!companyID || !fromDate || !toDate) return;

        setLoading(true);
        try {
            const res = await api.get("/api/Itemsalebycust", {
                params: {
                    CompanyID: companyID,
                    FromDate: fromDate,
                    ToDate: toDate,
                    ...(selectedItem ? { ItemID: selectedItem.value } : {}),
                },
            });
            Setsalesitem(res.data || []);
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    }, [companyID, fromDate, toDate, selectedItem]);

    // Initial data fetch
    useEffect(() => {
        fetchItems();
        Fetchitemwisesale();
    }, [fetchItems, Fetchitemwisesale]);

    // Columns definition - NO CHANGE (Item Name not shown in table)
    const columns = useMemo(() => [
        {
            name: "Sl No",
            selector: (_, index) => index + 1,
            width: "6%",
            sortable: true,
        },
        {
            name: "Date",
            selector: row => new Date(row.EnteringDate).toLocaleDateString(),
            width: "9%",
            sortable: true,
        },
        {
            name: "Invoice No",
            selector: (row) => {
                const retailBillNo = row.RetailBillNo && row.RetailBillNo !== 0 ? row.RetailBillNo : row.BillNo;
                return `${row.InvSeries || ""}${retailBillNo || "N/A"}`;
            },
            sortable: true,
            width: "14%",
        },
        {
            name: "Customer",
            selector: row => row.CustomerName,
            width: "16%",
            sortable: true,
        },
        
        {
            name: "Amount",
            selector: row => row.Amount.toFixed(2),
            sortable: true,
            right: true,
            width: "8%",
        },
        {
            name: "Type",
            selector: row => {
                if (Array.isArray(row.WholeSaleRetail)) {
                    const uniqueTypes = [...new Set(row.WholeSaleRetail.map(type => type.trim()))];
                    return uniqueTypes.join(', ') || "N/A";
                }
                return typeof row.WholeSaleRetail === "string"
                    ? row.WholeSaleRetail.trim()
                    : "N/A";
            },
            sortable: true,
            width: "11%",
        },
        {
            name: "Pay Mode",
            selector: row => row.BillModeText || "N/A",
            sortable: true,
            width: "9%",
        },
        {
            name: "Qty",
            selector: row => row.Quantity || "N/A",
            sortable: true,
            width: "7%",
        },
        {
            name: "Salesman",
            selector: row => row.SalesmanName || "N/A",
            width: "12%",
        },
        {
            name: "Route",
            selector: row => row.RootName || "N/A",
            sortable: true,
            width: "13%",
        },
    ], []);

    // Filtered data with memoization
    const filteredData = useMemo(() => {
        if (!saleitem.length) return [];

        return saleitem.filter(row => {
            const matchesSearch = searchText
                ? Object.values(row).some(val =>
                    String(val).toLowerCase().includes(searchText.toLowerCase()))
                : true;

            const matchesSalesman = selectedSalesman ? row.SalesmanName === selectedSalesman.value : true;
            const matchesCustomer = selectedCustomer ? row.CustomerName === selectedCustomer.value : true;
            const matchesItem = selectedItem ? row.ItemID === selectedItem.value : true;
            const matchesRoute = selectedRoute ? row.RootName === selectedRoute.value : true;

            return matchesSearch && matchesSalesman && matchesCustomer && matchesItem && matchesRoute;
        });
    }, [saleitem, searchText, selectedSalesman, selectedCustomer, selectedItem, selectedRoute]);

    // Memoized totals
    const { filteredTotal, filteredQnty, filteredNetRate, filteredTaxAmount } = useMemo(() => {
        return filteredData.reduce((acc, row) => {
            acc.filteredTotal += parseFloat(row.Amount) || 0;
            acc.filteredQnty += parseFloat(row.Quantity) || 0;
            acc.filteredNetRate += parseFloat(row.NetRate) || 0;
            acc.filteredTaxAmount += parseFloat(row.TaxAmount) || 0;
            return acc;
        }, {
            filteredTotal: 0,
            filteredQnty: 0,
            filteredNetRate: 0,
            filteredTaxAmount: 0
        });
    }, [filteredData]);

    // Export to Excel - NOW INCLUDES "Item Name" COLUMN (only in Excel)
   // Export to Excel - WITH WIDER "Item Name" COLUMN
const exportToExcel = useCallback(() => {
    const fileName = "Itemwise_Sale_Customer.xlsx";

    const excelData = filteredData.map((row, index) => {
        const retailBillNo = row.RetailBillNo && row.RetailBillNo !== 0 ? row.RetailBillNo : row.BillNo;
        const invoiceNo = `${row.InvSeries || ""}${retailBillNo || "N/A"}`.trim();

        return {
            "Sl No": index + 1,
            "Date": new Date(row.EnteringDate).toLocaleDateString(),
            "Invoice No": invoiceNo,
            "Customer": row.CustomerName,
            "Item Name": row.ItemName || "N/A",  
            "Amount": row.Amount?.toFixed(2) || "0.00",
            "Quantity": row.Quantity || 0,
            "Salesman": row.SalesmanName || "N/A",
            "Route": row.RootName || "N/A",
        };
    });

    const totalAmount = filteredData.reduce((total, row) => total + (row.Amount || 0), 0);
    const totalQty = filteredData.reduce((total, row) => total + (row.Quantity || 0), 0);

    excelData.push({
        "Sl No": "Total",
        "Date": "",
        "Invoice No": "",
        "Customer": "",
        "Item Name": "",
        "Amount": totalAmount.toFixed(2),
        "Quantity": totalQty,
        "Salesman": "",
        "Route": "",
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData, { origin: "A7" });

    // === SET COLUMN WIDTHS (especially wider for Item Name) ===
    worksheet["!cols"] = [
        { wch: 8 },   // Sl No
        { wch: 12 },  // Date
        { wch: 18 },  // Invoice No
        { wch: 25 },  // Customer
        { wch: 35 },  // Item Name ← INCREASED TO 35 (adjust as needed, e.g., 40 for very long names)
        { wch: 12 },  // Amount
        { wch: 10 },  // Quantity
        { wch: 20 },  // Salesman
        { wch: 18 },  // Route
    ];

    const reportTitle = ["Itemwise Sales Customer"];
    const dateRange = [`From: ${new Date(fromDate).toLocaleDateString()} To: ${new Date(toDate).toLocaleDateString()}`];
    const selectedItemRow = [`Item: ${selectedItem?.label || "All"}`];
    const filterSummary = [
        `Salesman: ${selectedSalesman?.label || "All"}, Customer: ${selectedCustomer?.label || "All"}`,
    ];

    XLSX.utils.sheet_add_aoa(worksheet, [reportTitle, dateRange, selectedItemRow, [], filterSummary], { origin: "A1" });

    worksheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } },
        { s: { r: 4, c: 0 }, e: { r: 4, c: 8 } },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(data, fileName);
}, [filteredData, fromDate, toDate, selectedItem, selectedSalesman, selectedCustomer]);

    // Export to PDF - UNCHANGED (no Item Name column)
    const exportPDF = useCallback(() => {
        if (!filteredData.length) {
            alert("No data to export.");
            return;
        }

        const formattedFromDate = fromDate ? new Date(fromDate).toLocaleDateString() : "N/A";
        const formattedToDate = toDate ? new Date(toDate).toLocaleDateString() : "N/A";
        const formattedItem = selectedItem?.label || "All";
        const formattedSalesman = selectedSalesman?.label || "All";
        const formattedCustomer = selectedCustomer?.label || "All";

        const doc = new jsPDF({ orientation: "landscape" });

        doc.setFontSize(18);
        doc.text("Itemwise Sales Customer", 14, 20);

        doc.setFontSize(12);
        doc.text(`From: ${formattedFromDate}`, 14, 30);
        doc.text(`To: ${formattedToDate}`, 80, 30);
        doc.text(`Item: ${formattedItem}`, 14, 38);
        doc.text(`Salesman: ${formattedSalesman}`, 80, 38);
        doc.text(`Customer: ${formattedCustomer}`, 14, 46);

        const tableColumn = [
            "Sl No",
            "Date",
            "Invoice No",
            "Customer",
            "Route",
            "Amount",
            "Quantity",
            "Type",
            "Pay Mode",
            "Salesman"
        ];

        const tableRows = filteredData.map((row, index) => [
            index + 1,
            new Date(row.EnteringDate).toLocaleDateString(),
            `${row.InvSeries || ""}${row.RetailBillNo || row.BillNo || ""}` || "N/A",
            row.CustomerName || "N/A",
            row.RootName || "N/A",
            row.Amount?.toFixed(2) || "0.00",
            row.Quantity || 0,
            Array.isArray(row.WholeSaleRetail)
                ? [...new Set(row.WholeSaleRetail.map(type => type.trim()))].join(', ')
                : (typeof row.WholeSaleRetail === 'string' ? row.WholeSaleRetail.trim() : "N/A"),
            row.BillModeText || "N/A",
            row.SalesmanName || "N/A"
        ]);

        const totalAmount = filteredData.reduce((total, row) => total + (row.Amount || 0), 0);
        const totalQty = filteredData.reduce((total, row) => total + (row.Quantity || 0), 0);

        tableRows.push([
            "",
            "",
            "",
            "Total",
            "",
            totalAmount.toFixed(2),
            totalQty,
            "",
            "",
            ""
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 54,
            theme: "grid",
            styles: {
                fontSize: 9,
                cellPadding: 2,
                overflow: "linebreak",
                valign: "middle"
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: "bold",
                halign: "center"
            },
            columnStyles: {
                0: { cellWidth: 12, halign: "center" },
                1: { cellWidth: 20, halign: "center" },
                2: { cellWidth: 28 },
                3: { cellWidth: 40 },
                4: { cellWidth: 25 },
                5: { cellWidth: 20, halign: "right" },
                6: { cellWidth: 15, halign: "right" },
                7: { cellWidth: 20 },
                8: { cellWidth: 20 },
                9: { cellWidth: 30 }
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

        doc.save(`Itemwise_Sale_Customer_${fromDate}_to_${toDate}.pdf`);
    }, [filteredData, fromDate, toDate, selectedItem, selectedSalesman, selectedCustomer]);

    // Handlers
    const handleClear = useCallback(() => {
        setSelectedItem(null);
        setFromDate(getPreviousDate(30));
        setToDate(getCurrentDate());
        Setsalesitem([]);
        setSelectedCustomer(null);
        setSelectedSalesman(null);
        setSearchText("");
        setSelectedRoute(null);
    }, [getPreviousDate, getCurrentDate]);

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        Fetchitemwisesale();
    }, [Fetchitemwisesale]);

    // Table styles
    const customStyles = useMemo(() => ({
        table: {
            style: {
                width: '100%',
                tableLayout: 'fixed',
            },
        },
        headCells: {
            style: {
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                backgroundColor: '#f8f9fa',
            },
        },
        cells: {
            style: {
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            },
        },
        rows: {
            style: {
                '&:not(:last-of-type)': {
                    borderBottom: '1px solid #e9ecef',
                },
            },
        },
    }), []);

    return (
        <div className="container-fluid" style={{ backgroundColor: "white" }}>
            {/* Search and Filter Controls */}
            <div className="card shadow-sm mb-3 p-3">
                <h4>Itemwise Sales Customer</h4>
                <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
                    <div className="w-100 w-md-50">
                        <div className="input-group">
                            <span className="input-group-text bg-primary text-white">
                                <FaSearch />
                            </span>
                            <div style={{ flexGrow: 1, minWidth: 0 }}>
                                <Select
                                    options={options}
                                    value={selectedItem}
                                    onChange={setSelectedItem}
                                    isLoading={loading}
                                    placeholder="Search by item name..."
                                    classNamePrefix="react-select"
                                    isClearable
                                    menuPortalTarget={document.body}
                                    styles={{
                                        container: base => ({
                                            ...base,
                                            width: '100%',
                                        }),
                                        menuPortal: base => ({ ...base, zIndex: 9999 }),
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="d-flex flex-wrap justify-content-end gap-2 w-100 w-md-auto">
                        <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => setShowFilterModal(true)}
                        >
                            <FaFilter className="me-1" /> Filters
                        </button>

                        <div className="btn-group">
                            <button className="btn btn-" onClick={exportToExcel}>
                                <FaFileExcel className="me-1" /> Excel
                            </button>
                            <button className="btn btn-" onClick={exportPDF}>
                                <FaFilePdf className="me-1" /> PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Modal */}
            {showFilterModal && (
                <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header bg-light">
                                <h5 className="modal-title text-primary">
                                    <FaFilter className="me-2" />
                                    Sales Report Filters
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowFilterModal(false)}
                                ></button>
                            </div>

                            <div className="modal-body">
                                <form onSubmit={handleSubmit}>
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

                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small text-muted">SALESMAN</label>
                                            <Select
                                                options={salesmanOptions}
                                                value={selectedSalesman}
                                                onChange={setSelectedSalesman}
                                                isClearable
                                                placeholder="All Salesmen"
                                                classNamePrefix="react-select"
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small text-muted">CUSTOMER</label>
                                            <Select
                                                options={customerOptions}
                                                value={selectedCustomer}
                                                onChange={setSelectedCustomer}
                                                isClearable
                                                placeholder="All Customers"
                                                classNamePrefix="react-select"
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small text-muted">ROUTE</label>
                                            <Select
                                                options={routeOptions}
                                                value={selectedRoute}
                                                onChange={setSelectedRoute}
                                                isClearable
                                                placeholder="All Routes"
                                                classNamePrefix="react-select"
                                            />
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
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => setShowFilterModal(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                Fetchitemwisesale();
                                                setShowFilterModal(false);
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

            {/* Data Table Section */}
            <div className="card shadow border-0 rounded mb-4" style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ flex: 1, overflowY: "auto" }}>
                    <DataTable
                        columns={columns}
                        data={filteredData}
                        highlightOnHover
                        striped
                        fixedHeader
                        fixedHeaderScrollHeight="calc(100vh - 300px)"
                        persistTableHead
                        dense
                        customStyles={customStyles}
                        progressPending={loading}
                        noDataComponent={<div className="p-4 text-center">No data available</div>}
                        pagination
                        paginationPerPage={50}
                        paginationRowsPerPageOptions={[10, 25, 50, 100]}
                    />
                </div>

                <div className="sticky-bottom bg-light p-3 border-top">
                    <div className="d-flex justify-content-between fw-semibold">
                        <span>Total Amount: ₹ {filteredTotal.toFixed(2)}</span>
                        <span>Total NetRate: ₹ {filteredNetRate.toFixed(2)}</span>
                        <span>Total TaxAmount: ₹ {filteredTaxAmount.toFixed(2)}</span>
                        <span>Total Quantity: {filteredQnty}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ItemSalebycust;