import React, { useState, useEffect, useMemo } from "react";
import api from "../../apiService";
import Select from "react-select";
import { FaSearch, FaFileExcel, FaFilePdf, FaFilter } from "react-icons/fa";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";

const ItemwiseSaleReport = () => {
    const getCurrentDate = () => new Date().toISOString().split("T")[0];
    const getPreviousDate = (days) => {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString().split("T")[0];
    };
    const [fromDate, setFromDate] = useState(getPreviousDate(7));
    const [toDate, setToDate] = useState(getCurrentDate());
    const [options, setOptions] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saleitem, Setsalesitem] = useState();
    const [selectedSalesman, setSelectedSalesman] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(500); // This is correct
    const companyID = sessionStorage.getItem("CompanyID");
    const [employeeList, setEmployeeList] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            try {
                const res = await api.get("/api/itembybill", {
                    params: { CompanyID: companyID },
                });
                const data = res.data;

                const formattedOptions = data.map((item) => ({
                    value: item.ItemID,
                    label: item.ItemName,
                }));

                setOptions(formattedOptions);
            } catch (error) {
                console.error("Fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        if (companyID) {
            fetchItems();

        }
    }, [companyID]);

    const Fetchitemwisesale = async () => {
        const itemId = selectedItem?.value ? Number(selectedItem.value) : null;
        const userId = selectedEmployee || null;
        console.log("Sending params:", {
            CompanyID: companyID,
            ItemID: itemId,
            FromDate: fromDate,
            ToDate: toDate,
            UserId: userId,
        });

        if (!companyID || !fromDate || !toDate) {
            console.error("CompanyID, FromDate, and ToDate are required.");
            return;
        }

        setLoading(true);
        try {
            const res = await api.get("/api/ItemwiseSale", {
                params: {
                    CompanyID: companyID,
                    ItemID: itemId,
                    FromDate: fromDate,
                    ToDate: toDate,
                    UserId: userId,
                },
            });

            const data = res.data[0]; // summary
            Setsalesitem(data);
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (companyID) {
            Fetchitemwisesale();
        }
    }, [companyID, fromDate, toDate]);

    const columns = [
        {
            name: "Sl No",
            selector: (_, index) => (currentPage - 1) * rowsPerPage + index + 1,

            width: "70px", // Fixed width for serial number
            compact: true,
        },
        {
            name: "Item Name",
            selector: row => row.ItemName,
            sortable: true,
            wrap: true, // Allow text wrapping
            minWidth: "200px", // Minimum width for item name
            grow: 1, // Allow this column to grow
        },
        {
            name: "Amount",
            selector: row => row.TotalAmount ? Math.round(row.TotalAmount).toFixed(2) : "0.00",
            sortable: true,
            right: true,
            width: "100px", // Fixed width for amount
        },
        {
            name: "Quantity",
            selector: row => row.TotalQuantity ?? "N/A",
            sortable: true,
            right: true,
            width: "100px", // Fixed width for quantity
        },
    ];


    const Fetchsalesman = async () => {
        if (!companyID) {
            console.error("CompanyID is required.");
            return;
        }

        setLoading(true);
        try {
            const res = await api.get("/api/GetUsersalesman", {
                params: { CompanyID: companyID },
            });

            const data = res.data || []; // Directly use res.data if it's already an array
            setEmployeeList(data);
        } catch (error) {
            console.error("Fetch error:", error);
            setEmployeeList([]); // Set to empty array to prevent future map errors
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        Fetchsalesman();
    }, []);


    const totalAmount = (saleitem || []).reduce((sum, row) => sum + (parseFloat(row.Amount) || 0), 0);

    const salesmanOptions = Array.from(
        new Set((saleitem || []).map(item => item.SalesmanName))
    ).map(name => ({ value: name, label: name }));

    const customerOptions = Array.from(
        new Set((saleitem || []).map(item => item.CustomerName))
    ).map(name => ({ value: name, label: name }));

    const filteredData = (saleitem || []).filter(row => {
        const matchesSearch = searchText === "" ||
            Object.values(row).some(val =>
                String(val).toLowerCase().includes(searchText.toLowerCase())
            );

        const matchesSalesman = selectedSalesman ? row.SalesmanName === selectedSalesman.value : true;
        const matchesCustomer = selectedCustomer ? row.CustomerName === selectedCustomer.value : true;

        return matchesSearch && matchesSalesman && matchesCustomer;
    });

    const filteredTotal = filteredData.reduce((sum, row) => sum + (parseFloat(row.TotalAmount) || 0), 0);
    const filteredQnty = filteredData.reduce((sum, row) => sum + (parseFloat(row.TotalQuantity) || 0), 0);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredData.slice(start, start + rowsPerPage);
    }, [filteredData, currentPage, rowsPerPage]);

    const customStyles = {
        table: {
            style: {
                tableLayout: 'fixed', // Use fixed table layout
            },
        },
        headRow: {
            style: {
                minHeight: '35px',
                padding: '0',
                backgroundColor: '#f8f9fa',
            },
        },
        headCells: {
            style: {
                padding: '8px 4px',
                fontSize: '13px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            },
        },
        cells: {
            style: {
                padding: '8px 4px',
                fontSize: '13px',
                whiteSpace: 'normal', // Allow text wrapping
                wordBreak: 'break-word', // Break long words
            },
        },
        rows: {
            style: {
                minHeight: '35px',
                '&:not(:last-of-type)': {
                    borderBottom: '1px solid #dee2e6',
                },
            },
        },
    };

    const exportToExcel = () => {
        const fileName = "Itemwise_Sale_Report.xlsx";

        if (!filteredData.length) {
            alert("No data to export.");
            return;
        }

        // Resolve salesman name
        const salesmanName =
            selectedEmployee &&
            employeeList.find((emp) => emp.UserID === selectedEmployee)?.USERNAME;

        // Prepare export data
        const excelData = filteredData.map((row, index) => ({
            "Sl No": index + 1,
            "Item Name": row.ItemName || "N/A",
            "Amount": row.TotalAmount ?? 0,
            "Quantity": row.TotalQuantity ?? 0,
        }));

        // Add totals row
        const totalAmount = filteredData.reduce((total, row) => total + (row.TotalAmount || 0), 0);
        const totalQty = filteredData.reduce((total, row) => total + (row.TotalQuantity || 0), 0);
        excelData.push({
            "Sl No": "Total",
            "Item Name": "",
            "Amount": totalAmount,
            "Quantity": totalQty,
        });

        // Create worksheet (data starts at row 7)
        const worksheet = XLSX.utils.json_to_sheet(excelData, { origin: "A7" });

        // Header rows
        const reportTitle = ["Itemwise Sales Report"];
        const dateRange = [
            `From: ${new Date(fromDate).toLocaleDateString()} To: ${new Date(toDate).toLocaleDateString()}`
        ];
        const salesmanInfo = [`Salesman: ${salesmanName || "All"}`];

        XLSX.utils.sheet_add_aoa(worksheet, [reportTitle, dateRange, salesmanInfo, []], {
            origin: "A1"
        });

        // Merge header cells for A:D
        worksheet["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Title
            { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // Date range
            { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }, // Salesman
        ];

        // Format Amount column (C) to 2 decimal places
        const amountColIndex = 2;
        for (let i = 0; i < excelData.length + 1; i++) {
            const cellRef = XLSX.utils.encode_cell({ r: i + 6, c: amountColIndex }); // +6 for row offset
            if (worksheet[cellRef] && typeof worksheet[cellRef].v === "number") {
                worksheet[cellRef].z = "0.00";
            }
        }

        // Build and export
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const data = new Blob([excelBuffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        saveAs(data, fileName);
    };




    const exportPDF = () => {
        if (!filteredData.length) {
            alert("No data to export.");
            return;
        }

        const doc = new jsPDF({ orientation: "landscape" });

        // Format date range
        const formattedFromDate = fromDate ? new Date(fromDate).toLocaleDateString() : "N/A";
        const formattedToDate = toDate ? new Date(toDate).toLocaleDateString() : "N/A";

        // Get salesman name
        const salesmanName =
            selectedEmployee &&
            employeeList.find((emp) => emp.UserID === selectedEmployee)?.USERNAME;

        // Title
        doc.setFontSize(16);
        doc.text("Itemwise Sales Analysis", 14, 15);

        // Filters
        doc.setFontSize(10);
        doc.text(`From: ${formattedFromDate}`, 14, 25);
        doc.text(`To: ${formattedToDate}`, 80, 25);

        if (salesmanName) {
            doc.text(`Salesman: ${salesmanName}`, 150, 25); // adjust X as needed
        }

        // Table headers
        const tableColumn = ["Sl No", "Item Name", "Amount", "Quantity"];

        // Table rows
        const tableRows = filteredData.map((row, index) => [
            index + 1,
            row.ItemName || "N/A",
            { content: row.TotalAmount?.toFixed(2) || "0.00", styles: { halign: "right" } },
            { content: row.TotalQuantity?.toString() || "0", styles: { halign: "right" } },
        ]);

        // Totals
        const totalAmount = filteredData.reduce((sum, row) => sum + (row.TotalAmount || 0), 0);
        const totalQty = filteredData.reduce((sum, row) => sum + (row.TotalQuantity || 0), 0);

        // Add totals row
        tableRows.push([
            "",
            { content: "Total", styles: { fontStyle: "bold", halign: "center" } },
            { content: totalAmount.toFixed(2), styles: { fontStyle: "bold", halign: "right" } },
            { content: totalQty.toString(), styles: { fontStyle: "bold", halign: "right" } },
        ]);

        // Render table
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 32,
            theme: "grid",
            styles: {
                fontSize: 10,
                cellPadding: 3,
                valign: "middle",
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: "bold",
                halign: "center",
            },
            columnStyles: {
                0: { cellWidth: 15, halign: "center" }, // Sl No
                1: { cellWidth: 90 }, // Item Name
                2: { cellWidth: 30, halign: "right" }, // Amount
                3: { cellWidth: 25, halign: "right" }, // Quantity
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
            },
        });

        doc.save(`Itemwise_Sale_Analysis_${fromDate}_to_${toDate}.pdf`);
    };


    const handleClear = () => {
        const defaultFromDate = getPreviousDate(7);
        const defaultToDate = getCurrentDate();

        setSelectedItem(null);
        setFromDate(defaultFromDate);
        setToDate(defaultToDate);
        setSelectedEmployee(null);         // 🔄 Corrected: use `null` instead of empty string for consistency
        setSelectedSalesman(null);
        setSelectedCustomer(null);
        setSearchText("");
        setCurrentPage(1);
        Setsalesitem([]);

        // Refetch with cleared filters
        Fetchitemwisesale();
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        Fetchitemwisesale();
        setCurrentPage(1);
        setShowFilterModal(false);
    };

    const CustomFooter = ({ rowsPerPage, rowCount, currentPage, onChangePage, onChangeRowsPerPage }) => {
        const totalPages = Math.ceil(rowCount / rowsPerPage);
        return (
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-3 bg-light">
                <div className="fw-semibold text-dark mb-2 mb-md-0">
                    Total Quantity: {filteredQnty}  | Total Amount: ₹ {filteredTotal.toFixed(2)}
                </div>

                <div className="d-flex flex-wrap align-items-center gap-2">
                    <label className="me-2">Rows per page:</label>
                    <select
                        value={rowsPerPage}
                        onChange={(e) => {
                            onChangeRowsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
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

    return (
        <div className="container-fluid" style={{ backgroundColor: "white" }}>
            <div className="page-header d-print-none mt-0">
                <h2 className="page-title">Itemwise Sale Analysis</h2>
            </div>

            {/* Search and Filter Card */}
            <div className="card shadow-sm mb-3 p-3">
                <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
                    {/* Search Input */}
                    <div className="w-100" style={{ maxWidth: "300px" }}>
                        <div className="input-group">
                            <span className="input-group-text bg-primary text-white">
                                <FaSearch />
                            </span>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex flex-wrap justify-content-end gap-2">
                        <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => setShowFilterModal(true)}
                        >
                            <FaFilter className="me-1" /> Filters
                        </button>
                        <button className="btn btn-outline" onClick={exportToExcel}>
                            <FaFileExcel className="me-1" /> Excel
                        </button>
                        <button className="btn btn-outline" onClick={exportPDF}>
                            <FaFilePdf className="me-1" /> PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Modal */}
            {showFilterModal && (
                <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Filter Options</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowFilterModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label">From Date</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">To Date</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Item Name</label>
                                        <Select
                                            options={options}
                                            value={selectedItem}
                                            onChange={setSelectedItem}
                                            isLoading={loading}
                                            placeholder="Select item"
                                            classNamePrefix="react-select"
                                            menuPortalTarget={document.body}
                                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Salesman</label>
                                        <Select
                                            className="basic-single"
                                            classNamePrefix="select"
                                            options={employeeList.map((emp) => ({
                                                value: emp.UserID,
                                                label: emp.USERNAME,
                                            }))}
                                            value={
                                                selectedEmployee
                                                    ? {
                                                        value: selectedEmployee,
                                                        label:
                                                            employeeList.find((emp) => emp.UserID === selectedEmployee)?.USERNAME || "",
                                                    }
                                                    : null
                                            }
                                            onChange={(selectedOption) => setSelectedEmployee(selectedOption?.value || "")}
                                            placeholder="Select Salesman"
                                        />
                                    </div>

                                </form>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleClear}
                                >
                                    Clear All
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => {
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
            )}

            {/* Data Table Section */}
            <div className="card p-3">
                <div className="card-body p-0">
                    <DataTable
                        columns={columns}
                        data={paginatedData}
                        highlightOnHover
                        striped
                        fixedHeader
                        fixedHeaderScrollHeight="55vh"
                        persistTableHead
                        customStyles={customStyles}
                        noDataComponent={<div className="p-3 text-center">No data available</div>}
                        pagination
                        paginationServer
                        paginationTotalRows={filteredData.length}
                        paginationPerPage={rowsPerPage}
                        paginationRowsPerPageOptions={[500, 1000, 10000]}
                        onChangePage={(page) => setCurrentPage(page)}
                        onChangeRowsPerPage={(count) => {
                            setRowsPerPage(count);
                            setCurrentPage(1);
                        }}
                        paginationComponent={({
                            rowsPerPage,
                            rowCount,
                            currentPage,
                            onChangePage,
                            onChangeRowsPerPage
                        }) => (
                            <CustomFooter
                                rowsPerPage={rowsPerPage}
                                rowCount={rowCount}
                                currentPage={currentPage}
                                onChangePage={onChangePage}
                                onChangeRowsPerPage={onChangeRowsPerPage}
                            />
                        )}
                    />

                </div>
            </div>
        </div>
    );
};


export default ItemwiseSaleReport;