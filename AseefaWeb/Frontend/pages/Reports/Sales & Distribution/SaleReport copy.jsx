import React, { useState, useEffect, useRef, useMemo } from "react";
import api from '../../apiService';
import DataTable from "react-data-table-component";
import numberToWords from "number-to-words"; // Ensure this library is installed
import { FaSearch, FaFileExcel, FaPrint, FaFilter } from "react-icons/fa";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import Select from 'react-select';
const SaleReport = () => {
  const getCurrentDate = () => new Date().toISOString().split("T")[0];
  const getPreviousDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];  // Format to yyyy-mm-dd
  };
  // Format amount function
  const formatAmount = (amount) => {
    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR", // Change to your desired currency
      minimumFractionDigits: 2,
    });
  };
  const [fromDate, setFromDate] = useState(getPreviousDate(7));
  const [toDate, setToDate] = useState(getCurrentDate());
  const [type, setType] = useState("All");
  const [result, setResult] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [Billdetails, setBillDetails] = useState([]);
  const [salesman, setSalesman] = useState("");
  const [customer, setCustomer] = useState("");
  const [branch, setBranch] = useState("");
  const [distinctRoots, setDistinctRoots] = useState([]);
  const [root, setRoot] = useState("");
  const [distinctBranches, setDistinctBranches] = useState([]);
  const [summary, setSummary] = useState({
    customerCount: 0,
    totalAmount: 0,
    totalOrders: 0, // Add totalOrders to the summary
  });
  const [searchQuery, setSearchQuery] = useState(""); // State for search input
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef(null);
  const [selectedDSID, setSelectedDSID] = useState(null);
  const [distinctSalesmen, setDistinctSalesmen] = useState([]);
  const [distinctCustomers, setDistinctCustomers] = useState([]);
  const [companyData, setCompanyData] = useState(null);
  const [selectedSalesmen, setSelectedSalesmen] = useState([]);
  const [distinctCreatedBy, setDistinctCreatedBy] = useState([]);
  const [createdBy, setCreatedBy] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(500);

  let filteredResults = result.filter((row) => {
    const lowerCaseSearchQuery = searchQuery.toLowerCase();

    return (
      (row.CustomerName?.toLowerCase().includes(lowerCaseSearchQuery)) ||
      (row.RetailBillNo?.toString().includes(searchQuery)) ||
      (row.WholesaleNo?.toString().includes(searchQuery)) ||
      (row.BillAmount?.toString().includes(searchQuery)) ||
      (row.BillDate?.toLowerCase().includes(lowerCaseSearchQuery)) ||
      (row.InvSeries?.toLowerCase().includes(lowerCaseSearchQuery)) ||
      (row.SaleType?.toLowerCase().includes(lowerCaseSearchQuery)) ||
      (row.BillModeText?.toLowerCase().includes(lowerCaseSearchQuery)) ||
      (row.Salesman?.toLowerCase().includes(lowerCaseSearchQuery)) ||
      (row.CreatedBy?.toLowerCase().includes(lowerCaseSearchQuery))
    );
  });

  if (createdBy) {
    filteredResults = filteredResults.filter(order =>
      order.CreatedById === parseInt(createdBy)
    );
  }
  const updatedResults = createdBy
    ? filteredResults.filter(order => order.CreatedById === parseInt(createdBy))
    : filteredResults;

  const fetchSaleReport = async () => {
    setIsLoading(true);
    setError("");

    try {
      const companyID = sessionStorage.getItem("CompanyID");
      const financialResponse = JSON.parse(sessionStorage.getItem("financialResponse"));
      const FYearID = financialResponse?.FYearID;
      const activeUserId = sessionStorage.getItem("activeUserId");


      const response = await api.post("/api/getSaleReport", {
        FromDate: fromDate,
        ToDate: toDate,
        Type: type,
        companyID,
        FYearID,
        CustomerID: customer || null,
        Branch: branch || null,
        activeUserId: activeUserId,
      });

      const data = response?.data || [];
      let filteredResults = data.billDetails || [];

      // Extract distinct names
      // Extract unique salesmen
      const uniqueSalesmen = [
        ...new Map(
          filteredResults
            .filter(order => order.SalesmanId) // Ensure valid Salesman ID
            .map(order => [order.SalesmanId, { id: order.SalesmanId, name: order.Salesman || `User ${order.SalesmanId}` }])
        ).values()
      ];


      const uniqueRoots = [...new Set(filteredResults.map(order => order.RootName).filter(Boolean))];
      setDistinctRoots(uniqueRoots);

      // Extract unique customers
      const uniqueCustomers = [...new Set(filteredResults.map(order => order.CustomerName).filter(Boolean))];

      // Extract unique CreatedBy users
      const uniqueCreatedBy = [
        ...new Map(
          filteredResults
            .filter(order => order.CreatedById) // Ensure CreatedById is valid
            .map(order => [
              order.CreatedById,
              { id: order.CreatedById, name: order.CreatedBy || `User ${order.CreatedById}` }
            ])
        ).values()
      ];


      const uniqueBranches = [...new Set(filteredResults.map(order => order.BranchName).filter(Boolean))];

      // Set distinct values to state
      setDistinctSalesmen(uniqueSalesmen);
      setDistinctCustomers(uniqueCustomers);
      setDistinctCreatedBy(uniqueCreatedBy);


      {
        (distinctBranches || []).map((BranchName) => (
          <option key={BranchName} value={BranchName}>{BranchName}</option>
        ))
      }

      // Set distinct values to state
      setDistinctSalesmen(uniqueSalesmen);
      setDistinctCustomers(uniqueCustomers);
      setDistinctCreatedBy(uniqueCreatedBy);
      setDistinctBranches(uniqueBranches);


      // Apply filters
      if (selectedSalesmen.length > 0) {
        filteredResults = filteredResults.filter(order =>
          selectedSalesmen.some(salesman => salesman.id === order.SalesmanId)
        );
      }

      if (customer) {
        filteredResults = filteredResults.filter(order => order.CustomerName === customer);
      }
      if (branch) {
        filteredResults = filteredResults.filter(order => order.BranchName === branch);
      }

      if (root) {
        filteredResults = filteredResults.filter(order => order.RootName === root);
      }


      const isDefaultFilters =
        fromDate === getPreviousDate(7) &&
        toDate === getCurrentDate() &&
        type === "All" &&
        !customer &&
        !branch &&
        selectedSalesmen.length === 0;

      // Sort results
      filteredResults = filteredResults.slice().sort((a, b) => {
        const dateA = new Date(a.BillDate);
        const dateB = new Date(b.BillDate);
        return isDefaultFilters ? dateB - dateA : dateA - dateB;
      });

      // Calculate summary
      const customerCount = new Set(filteredResults.map(order => order.CustomerID)).size;
      const totalAmount = filteredResults.reduce((sum, order) => sum + (order.BillAmount || 0), 0);
      const totalOrders = filteredResults.length;

      setSummary({ customerCount, totalAmount, totalOrders });
      setResult(filteredResults);
    } catch (err) {
      console.error("Error fetching sale report:", err);
      setError("Failed to fetch sale report. Please try again.");
      setResult([]);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    // Retrieve from sessionStorage and parse JSON
    const storedCompanyData = sessionStorage.getItem("companyResponse");
    if (storedCompanyData) {
      setCompanyData(JSON.parse(storedCompanyData));
    }
  }, []);
  useEffect(() => {
    fetchSaleReport();
  }, [selectedSalesmen]);

  useEffect(() => {
    fetchSaleReport();
  }, [fromDate, toDate, type, salesman, createdBy, customer, branch]);

  useEffect(() => {
    fetch("API_URL_HERE")
      .then((res) => res.json())
      .then((data) => setDistinctBranches(data.branches || [])) // Ensure it's an array
      .catch((error) => console.error("Error fetching branches:", error));
  }, []);

  const handleClear = () => {
    setFromDate(getPreviousDate(7));
    setToDate(getCurrentDate());
    setType("All");
    setSalesman(""); // Clear Salesman filter
    setCustomer(""); // Clear Customer filter
    setError("");
    setCreatedBy("");
    setBranch("");
    setSearchQuery(""); // Clear search query
    setSelectedSalesmen([]); // Clear as empty array, not string
  };

  // Handle checkbox selection
  const handleSalesmanChange = (salesman) => {
    setSelectedSalesmen((prev) => {
      const updatedSelection = prev.some(s => s.id === salesman.id)
        ? prev.filter(s => s.id !== salesman.id) // Remove if already selected
        : [...prev, { id: salesman.id, name: salesman.name }]; // Ensure objects are structured correctly

      return updatedSelection;
    });
  };

  const customerOptions = [
    { value: '', label: 'All Customers' },
    ...distinctCustomers.map(name => ({
      value: name,
      label: name
    }))
  ];

  const branchOptions = [
    { value: '', label: 'All Branches' },
    ...distinctBranches.map(branchName => ({
      value: branchName,
      label: branchName
    }))
  ];

  const createdByOptions = [
    { value: '', label: 'All Users' },
    ...distinctCreatedBy.map(({ id, name }) => ({
      value: id,
      label: name
    }))
  ];
  const handleClickOutside = (event) => {
    if (inputRef.current && !inputRef.current.contains(event.target)) {
      setShowInput(false);
    }
  };
  if (createdBy) {
    filteredResults = filteredResults.filter(order =>
      order.CreatedById === parseInt(createdBy)
    );
  }

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchSaleReport();
    setIsModalOpen(false);
  };

  /** ✅ Export to Excel */
  const exportToExcel = () => {
    if (!filteredResults || filteredResults.length === 0) {
      alert("No data to export.");
      return;
    }

    // Format selected filter values
    const formattedFromDate = fromDate ? new Date(fromDate).toLocaleDateString() : "N/A";
    const formattedToDate = toDate ? new Date(toDate).toLocaleDateString() : "N/A";
    const formattedType = type || "All";
    const formattedSalesman = selectedSalesmen.length > 0
      ? selectedSalesmen.map(s => s.name).join(", ")
      : "All";
    const formattedCreatedBy = createdBy
      ? distinctCreatedBy.find(user => user.id === parseInt(createdBy))?.name || "All"
      : "All";
    const formattedCustomer = customer || "All";
    const formattedBranch = branch || "All";

    // Calculate total amount
    const totalAmount = filteredResults.reduce((sum, order) => sum + (order.BillAmount || 0), 0);

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create worksheet with filter metadata
    const filterData = [
      ["Sale Report"],
      ["From Date", formattedFromDate],
      ["To Date", formattedToDate],
      ["Type", formattedType],
      ["Salesman", formattedSalesman],
      ["Created By", formattedCreatedBy],
      ["Customer", formattedCustomer],
      ["Branch", formattedBranch],
      [], // Empty row for spacing
      ["Total Amount", formatAmount(totalAmount)],
      [], // Empty row for spacing
    ];

    // Column Headers for Data
    const headers = [["Sl No", "Bill No", "Customer", "Amount", "Date", "Type", "Mode", "Salesman", "Route"]];

    // Map filtered results with proper bill number formatting
    const dataForExcel = filteredResults.map((row, index) => {
      // Format bill number: InvSeries + RetailBillNo/WholesaleNo
      let billNo = "";
      if (row.InvSeries) billNo += row.InvSeries;
      if (row.RetailBillNo) billNo += row.RetailBillNo;
      else if (row.WholesaleNo) billNo += row.WholesaleNo;
      else if (row.BillNo) billNo += row.BillNo;
      if (!billNo) billNo = "N/A";

      return [
        index + 1,
        billNo,
        row.CustomerName || "N/A",
        row.BillAmount || 0,
        row.BillDate ? new Date(row.BillDate).toLocaleDateString() : "N/A",
        row.SaleType || "N/A",
        row.BillModeText || "N/A",
        row.Salesman || "N/A",
        row.RootName || "N/A",
      ];
    });

    // Add total row at the bottom
    dataForExcel.push([
      "TOTAL", "", "", totalAmount, "", "", "", "", ""
    ]);

    // Combine all data
    const allData = [...filterData, ...headers, ...dataForExcel];
    const ws = XLSX.utils.aoa_to_sheet(allData);

    // Apply styling through merges
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Merge title row
      { s: { r: 9, c: 0 }, e: { r: 9, c: 1 } }, // Merge "Total Amount" label
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "SaleReport");

    // Auto-size columns
    const wscols = [
      { wch: 5 },  // Sl No
      { wch: 15 }, // Bill No
      { wch: 30 }, // Customer
      { wch: 12 }, // Amount
      { wch: 12 }, // Date
      { wch: 10 }, // Type
      { wch: 10 }, // Mode
      { wch: 20 }, // Salesman
      { wch: 15 }, // Route
    ];
    ws["!cols"] = wscols;

    // Save the file
    XLSX.writeFile(wb, `SaleReport_${fromDate}_to_${toDate}.xlsx`);
  };
  /** ✅ Export to PDF */
  const exportToPDF = () => {
    if (!filteredResults.length) {
      alert("No data to export.");
      return;
    }

    const totalAmount = filteredResults.reduce((sum, order) => sum + (order.BillAmount || 0), 0);

    // Format filter values
    const formattedFromDate = fromDate ? new Date(fromDate).toLocaleDateString() : "N/A";
    const formattedToDate = toDate ? new Date(toDate).toLocaleDateString() : "N/A";
    const formattedType = type || "All";
    const formattedSalesman = selectedSalesmen.length > 0
      ? selectedSalesmen.map(s => s.name).join(", ")
      : "All";
    const formattedCreatedBy = createdBy
      ? distinctCreatedBy.find(user => user.id === parseInt(createdBy))?.name || "All"
      : "All";
    const formattedCustomer = customer || "All";
    const formattedBranch = branch || "All";

    // Create PDF document
    const doc = new jsPDF({ orientation: "landscape" });

    // Title
    doc.setFontSize(16);
    doc.text("Sale Report", 14, 15);

    // Filters - removed the Total Amount line from here
    doc.setFontSize(10);
    doc.text(`From: ${formattedFromDate}`, 14, 25);
    doc.text(`To: ${formattedToDate}`, 60, 25);
    doc.text(`Type: ${formattedType}`, 106, 25);
    doc.text(`Salesman: ${formattedSalesman}`, 14, 32);
    doc.text(`Created By: ${formattedCreatedBy}`, 60, 32);
    doc.text(`Customer: ${formattedCustomer}`, 106, 32);
    doc.text(`Branch: ${formattedBranch}`, 152, 32);

    // Table columns
    const tableColumn = ["Sl No", "Bill No", "Customer", "Amount", "Date", "Type", "Mode", "Salesman", "Route"];

    // Table rows with proper bill number formatting
    const tableRows = filteredResults.map((row, index) => {
      // Format bill number: InvSeries + RetailBillNo/WholesaleNo
      let billNo = "";
      if (row.InvSeries) billNo += row.InvSeries;
      if (row.RetailBillNo) billNo += row.RetailBillNo;
      else if (row.WholesaleNo) billNo += row.WholesaleNo;
      else if (row.BillNo) billNo += row.BillNo;
      if (!billNo) billNo = "N/A";

      return [
        index + 1,
        billNo,
        row.CustomerName || "N/A",
        { content: row.BillAmount?.toFixed(2) || "0.00", styles: { halign: 'right' } },
        row.BillDate ? new Date(row.BillDate).toLocaleDateString() : "N/A",
        row.SaleType || "N/A",
        row.BillModeText || "N/A",
        row.Salesman || "N/A",
        row.RootName || "N/A",
      ];
    });

    // Add total row (keeping this in the table)
    tableRows.push([
      { content: "TOTAL", colSpan: 3, styles: { fontStyle: "bold", halign: "center" } },
      { content: totalAmount.toFixed(2), styles: { fontStyle: "bold", halign: "right" } },
      "", "", "", "", "", ""
    ]);

    // Add table to PDF
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: "grid",
      styles: {
        fontSize: 8,
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
        0: { cellWidth: 8, halign: "center" },   // Sl No
        1: { cellWidth: 20, halign: "center" },  // Bill No
        2: { cellWidth: 40 },                    // Customer
        3: { cellWidth: 15, halign: "right" },   // Amount
        4: { cellWidth: 15, halign: "center" },  // Date
        5: { cellWidth: 12, halign: "center" },  // Type
        6: { cellWidth: 12, halign: "center" },  // Mode
        7: { cellWidth: 25 },                    // Salesman
        8: { cellWidth: 20 }                     // Route
      },
      margin: { top: 40 },
      didDrawPage: function (data) {
        // Footer with page number
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

    // Save the PDF
    doc.save(`SaleReport_${fromDate}_to_${toDate}.pdf`);
  };

  const conditionalRowStyles = [
    {
      when: row => row.Status === 2,
      style: {
        backgroundColor: '#ffe5e5', // light red background
        color: '',                  // red text
        // fontWeight: 'bold',
      },
    },
    {
      when: row => row.IsDuplicate === 1,
      style: {
        backgroundColor: '#f0e9cb', // light green background
        color: '',                  // green text
        // fontWeight: 'bold',
      },
    },
  ];




  // Filter results based on search query
  const totalAmount = summary.totalAmount ? formatAmount(summary.totalAmount) : "N/A";
  const columns = [
    { name: "SL.No", selector: (_, index) => index + 1, sortable: false, width: "6%" },
    { name: "Bill No", selector: row => `${row.InvSeries || ''}${row.RetailBillNo || ''}${row.WholesaleNo || ''}`, sortable: true, width: "16%" },
    { name: "Bill Date", selector: row => row.BillDate ? new Date(row.BillDate).toLocaleDateString() : "N/A", sortable: true, width: "10%" },
    { name: "Customer", selector: row => row.CustomerName || "N/A", sortable: true, width: "18%" },
    { name: "Amount", selector: row => row.BillAmount ? parseFloat(row.BillAmount).toFixed(2) : "0.00", sortable: true, width: "10%" },
    {
      name: "Type", selector: row => {
        const billNo = row.RetailBillNo?.toString() || "";
        const isWholesale = billNo.endsWith("00");
        return isWholesale ? "Wholesale" : row.SaleType || "N/A";
      }, sortable: true, width: "10%"
    },
    { name: "Pay Mode", selector: row => row.BillModeText || "N/A", sortable: true, width: "9%" },
    { name: "Salesman", selector: row => row.Salesman || "N/A", sortable: true, width: "12%" },
    { name: "Created By", selector: row => row.CreatedBy || "N/A", sortable: true, width: "11%" },
  ];


  // Append a total row at the bottom of the table
  const paginationOptions = {
    rowsPerPageText: 'Rows per page:',
    rangeSeparatorText: 'of',
    selectAllRowsItem: false,
    rowsPerPageOptions: [500, 1000, 10000],
  };
  const fetchBillDetails = async (BillID) => {
    const CompanyID = sessionStorage.getItem("CompanyID");
    try {
      const response = await api.get("/api/GetBilldetails", {
        params: { BillID, CompanyID }, // Pass DSID as a query parameter
      });
      setBillDetails(response?.data || []);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error fetching order details:", err);
    }
  };

  const billDiscount = Billdetails[0]?.DiscountRs || 0;
  const totalitemAmount = Billdetails.reduce((sum, item) => sum + item.Amount, 0);

  const handleRowClick = (BillID) => {
    setSelectedDSID(BillID);
    fetchBillDetails(BillID);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  const handlePrintpop = () => {
    const printContent = document.getElementById("modal-print-content");

    if (!printContent) {
      console.error("Print content not found!");
      return;
    }

    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Invoice</title>
          <link rel="stylesheet" href="styles.css">
          <style>
            @media print {
              body { 
                font-family: Arial, sans-serif; 
                margin: 10px; 
                padding: 0; 
                -webkit-print-color-adjust: exact; 
                font-size: 12px; /* Reduced text size */
              }
  
              .header { 
                text-align: center; 
                margin-bottom: 10px; 
              }
  
              .logo { 
                display: block !important; 
                max-width: 100px; /* Reduced size for better fit */
                height: auto; 
                margin: 0 auto 8px; 
              }
  
              .invoice-container {
                border: 1px solid #ddd;
                padding: 10px;
                border-radius: 5px;
                box-shadow: 0px 1px 5px rgba(0, 0, 0, 0.1);
                background-color: #fff;
              }
  
              .row { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 8px; 
              }
  
              .col { 
                flex: 1; 
                padding: 4px; 
              }
  
              table { 
                width: 100%; 
                border-collapse: collapse; 
                font-size: 12px; /* Reduced table text size */
              }
  
              th, td { 
                border: 1px solid #000; 
                padding: 4px; 
                text-align: center; 
              }
  
              th { 
                background-color: #f8f8f8; 
                font-weight: bold; 
              }
  
              .total-row {
                background-color: #e0ffe0;
                font-weight: bold;
              }
  
              ul, ol { 
                list-style: none; /* Removed dots */
                padding: 0;
                margin: 0;
              }
  
              .footer { 
                text-align: center; 
                margin-top: 10px; 
                font-size: 10px; 
                color: #555;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
           
          </div>
  
          <div class="invoice">
            <div id="modal-print-content">${printContent.innerHTML}</div>
          </div>
  
          <div class="footer">
            Thank you for your business!
          </div>
  
          <script>
          window.onload = function() { 
            window.print(); 
            setTimeout(() => { window.close(); }, 100); // Close the print window after printing
          };
        </script>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
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

  const customPagination = {
    rowsPerPageText: "Rows per page:",
    rangeSeparatorText: "of",
    selectAllRowsItem: true,
    selectAllRowsItemText: "All",
  };

  const CustomFooter = ({ rowsPerPage, rowCount, currentPage, onChangePage, onChangeRowsPerPage }) => {
    const totalPages = Math.ceil(rowCount / rowsPerPage);
    const liveTotal = filteredResults.reduce((sum, item) => sum + (item.BillAmount || 0), 0); // <-- recalculate here
    return (
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-3 bg-light">
        <div className="fw-semibold text-dark mb-2 mb-md-0">

          Total Amount: {formatAmount(liveTotal)}
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

  const buttonStyle = (disabled) => ({
    padding: "4px 12px",
    margin: "0 5px",
    border: "none",
    borderRadius: "4px",
    background: disabled ? "#ccc" : "#007bff",
    color: "#fff",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background 0.3s"
  });

  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredResults.slice(start, start + rowsPerPage);
  }, [filteredResults, currentPage, rowsPerPage]);

  return (
    <div className="container-fluid">
      {/* Trigger Button */}
      {/* <button type="button" className="btn btn-primary mb-3" data-bs-toggle="modal" data-bs-target="#filterModal">
    Open Filters
  </button> */}

      {/* Modal */}
      {/* 🔍 Search + Filters + Exports - Compact Header */}
      <div className="card shadow-sm mb-3 p-3">  <h4>Sale Report</h4>
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
                placeholder="Search bills by customer, number, amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons Group */}
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
                <FaPrint className="me-1" /> PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Modal - Improved Layout */}
      <div className="modal fade" id="filterModal" tabIndex="-1" aria-labelledby="filterModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header bg-light">
              <h5 className="modal-title text-primary" id="filterModalLabel">
                <FaFilter className="me-2" />
                Sales Report Filters
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

                {/* Main Filters - 2 columns */}
                <div className="row g-3">
                  {/* First Column */}
                  <div className="col-md-6">
                    {/* Type */}
                    <div className="mb-3">
                      <label htmlFor="Type" className="form-label fw-bold small text-muted">SALE TYPE</label>
                      <select id="Type" className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="All">All Types</option>
                        <option value="Retail">Retail</option>
                        <option value="WholeSale">Wholesale</option>
                      </select>
                    </div>

                    {/* Salesman */}
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-muted">SALES REP</label>
                      <div className="dropdown">
                        <button
                          className="btn btn-outline-secondary dropdown-toggle w-100 text-start d-flex justify-content-between align-items-center"
                          type="button"
                          id="salesmanDropdown"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                          disabled={isLoading}
                        >
                          <span>
                            {isLoading
                              ? "Loading..."
                              : selectedSalesmen.length > 0
                                ? `${selectedSalesmen.length} selected`
                                : "All Salesmen"}
                          </span>
                        </button>
                        <ul
                          className="dropdown-menu w-100 p-2"
                          style={{ maxHeight: "250px", overflowY: "auto", padding: 0 }}
                        >
                          {isLoading ? (
                            <li className="dropdown-item text-muted px-3 py-2">Loading...</li>
                          ) : distinctSalesmen.length > 0 ? (
                            <>
                              {/* Select All */}
                              <li className="dropdown-item px-2 py-1" style={{ margin: 0 }}>
                                <div className="form-check m-0">
                                  <input
                                    type="checkbox"
                                    id="selectAllSalesmen"
                                    className="form-check-input"
                                    checked={selectedSalesmen.length === distinctSalesmen.length}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedSalesmen(distinctSalesmen);
                                      } else {
                                        setSelectedSalesmen([]);
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor="selectAllSalesmen"
                                    className="form-check-label ms-2"
                                  >
                                    Select All
                                  </label>
                                </div>
                              </li>

                              {/* Salesmen */}
                              {distinctSalesmen.map((salesman) => {
                                const isChecked = selectedSalesmen.some(
                                  (s) => s.id === salesman.id
                                );

                                return (
                                  <li
                                    key={salesman.id}
                                    className="dropdown-item px-2 py-1"
                                    style={{ margin: 0 }}
                                  >
                                    <div className="form-check m-0">
                                      <input
                                        type="checkbox"
                                        id={`salesman-${salesman.id}`}
                                        className="form-check-input"
                                        checked={isChecked}
                                        onChange={() => {
                                          if (isChecked) {
                                            setSelectedSalesmen((prev) =>
                                              prev.filter((s) => s.id !== salesman.id)
                                            );
                                          } else {
                                            setSelectedSalesmen((prev) => [...prev, salesman]);
                                          }
                                        }}
                                      />
                                      <label
                                        htmlFor={`salesman-${salesman.id}`}
                                        className="form-check-label ms-2"
                                      >
                                        {salesman.name}
                                      </label>
                                    </div>
                                  </li>
                                );
                              })}
                            </>
                          ) : (
                            <li className="dropdown-item text-muted px-3 py-2">
                              No salesmen available
                            </li>
                          )}
                        </ul>


                      </div>
                    </div>

                    {/* Root Name */}
                    <div className="mb-3">
                      <label htmlFor="Root" className="form-label fw-bold small text-muted">ROUTE</label>
                      <Select
                        id="Root"
                        value={root ? { value: root, label: root } : null}
                        onChange={(selected) => setRoot(selected ? selected.value : "")}
                        options={[
                          { value: "", label: "All Routes" },
                          ...distinctRoots.map(r => ({ value: r, label: r }))
                        ]}
                        isClearable
                        placeholder="Select Route"
                        className="basic-single"
                        classNamePrefix="select"
                      />
                    </div>

                  </div>
                  {/* Second Column */}
                  <div className="col-md-6">
                    {/* Created By */}
                    <div className="mb-3">
                      <label htmlFor="CreatedBy" className="form-label fw-bold small text-muted">CREATED BY</label>
                      <Select
                        id="CreatedBy"
                        value={createdByOptions.find(option => option.value === createdBy)}
                        onChange={(selected) => setCreatedBy(selected ? selected.value : '')}
                        options={createdByOptions}
                        isClearable
                        placeholder="Select User"
                        className="basic-single"
                        classNamePrefix="select"
                      />
                    </div>

                    {/* Customer */}
                    <div className="mb-3">
                      <label htmlFor="Customer" className="form-label fw-bold small text-muted">CUSTOMER</label>
                      <Select
                        id="Customer"
                        value={customerOptions.find(option => option.value === customer)}
                        onChange={(selected) => setCustomer(selected.value)}
                        options={customerOptions}
                        className="basic-single"
                        classNamePrefix="select"
                      />
                    </div>

                    {/* Branch */}
                    <div className="mb-3">
                      <label htmlFor="Branch" className="form-label fw-bold small text-muted">BRANCH</label>
                      <Select
                        id="Branch"
                        value={branchOptions.find(option => option.value === branch)}
                        onChange={(selected) => setBranch(selected ? selected.value : '')}
                        options={branchOptions}
                        isClearable
                        placeholder="Select Branch"
                        className="basic-single"
                        classNamePrefix="select"
                      />
                    </div>
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

      {/* 📊 Data Table Section */}
      <div className="card shadow border-0 rounded mb-4" style={{ height: "calc(100vh - 230px)", display: "flex", flexDirection: "column" }}>
        {/* Scrollable Table */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <DataTable
            columns={columns}
            // data={filteredResults}
            progressPending={isLoading}
            highlightOnHover
            striped
            pagination={false}
            data={paginatedResults}
            onRowClicked={(row) => handleRowClick(row.BillID)}
            conditionalRowStyles={conditionalRowStyles}
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
              setCurrentPage(1); // Reset to first page
            }}
          />
        </div>
      </div>


      {isModalOpen && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.5)", overflow: "auto" }}>
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content shadow-lg rounded">

              {/* Modal Header */}
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">Bill Details</h5>
                <button type="button" className="close btn btn-danger rounded-circle p-2" onClick={handleCloseModal}>
                  <span>&times;</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4" id="modal-print-content">
                <div className="container-fluid">

                  {/* Invoice Header */}
                  <div className="row align-items-center mb-4 border-bottom pb-3">
                    <div className="col-md-6">
                      {[...new Map(Billdetails.map(order =>
                        [`${order.InvSeries}${order.RetailBillNo !== 0 ? order.RetailBillNo : order.BillNo}`, order]
                      )).values()].map((customer, index) => (
                        <div key={index}>
                          <h2 className="fw-bold">
                            <small className="text-muted">
                              {`${customer.InvSeries}${customer.RetailBillNo !== 0 ? customer.RetailBillNo : customer.BillNo}`}
                            </small>
                          </h2>
                          <h5 className="text-muted">
                            Date: {customer.BillDate ? new Date(customer.BillDate).toLocaleDateString() : "N/A"}
                          </h5>
                        </div>
                      ))}
                    </div>

                    <div className="col-md-6 text-end">
                      {/* <img className="logo" src="src/assets/logo_kairali.png" alt="Company Logo" style={{ maxWidth: "80px" }} /> */}
                      {companyData ? (
                        <ul className="list-unstyled mb-0">
                          <li><strong>{companyData.CompanyName}</strong></li>
                          <li style={{ fontSize: "12px" }}>{companyData.Address}</li>
                          {/* <li style={{ fontSize: "12px" }}>{companyData.District}, {companyData.State}</li> */}
                          <li style={{ fontSize: "12px" }}>{companyData.GSTinNo}</li>
                          {/* <li style={{ fontSize: "12px" }}>{companyData.Email}</li> */}
                          <li style={{ fontSize: "12px" }}>{companyData.MobileNO}</li>

                        </ul>
                      ) : (
                        <p>Loading company details...</p>
                      )}
                    </div>
                  </div>

                  {/* Company & User Details */}
                  <div className="row g-3 d-flex flex-wrap">
                    {[...new Map(Billdetails.map(customer =>
                      [`${customer.CustomerName}-${customer.
                        CumAddress}-${customer.CumContact}`, customer])).values()].map((customer, index) => (
                          <div key={index} className="col-md-6">
                            <div className="card shadow-sm p-3 h-100 d-flex flex-column">
                              <h5 className="fw-bold">Customer Details</h5>
                              <ul className="list-unstyled  flex-grow-1">
                                <li><strong>Name:</strong> {customer.CustomerName}</li>
                                <li><strong>Address:</strong> {customer.CumAddress}</li>
                                <li><strong>Phone:</strong> {customer.CumContact}</li>
                              </ul>
                            </div>
                          </div>
                        ))}

                    {[...new Map(Billdetails.map(customer =>
                      [`${customer.CustomerName}-${customer.CumAddress}-${customer.CumContact}`, customer]
                    )).values()].map((customer, index) => (
                      <div key={index} className="col-md-6">
                        <div className="card shadow-sm p-3 h-100 d-flex flex-column">
                          <h5 className="fw-bold">Bill Details</h5>
                          <ul className="list-unstyled flex-grow-1">
                            <li><strong>Salesman:</strong> {customer.SalesmanName}</li>
                            <li><strong>BilledBy:</strong> {customer.CreatedByName}</li>
                            <li><strong>Mode:</strong> {customer.BillModeText}</li>
                            <li><strong>Type:</strong> {customer.WholeSaleRetail}</li>
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Items Table */}
                  <div className="card shadow-sm p-3 mt-4">
                    <h5 className="fw-bold">Items Summary</h5>
                    <div style={{ maxHeight: "400px", overflowY: "auto", position: "relative" }}>
                      <table className="table table-bordered text-center mb-0" style={{ fontSize: "10px", minWidth: "AUTO" }}>
                        <thead className="table-light sticky-top" style={{ top: 0, zIndex: 1 }}>
                          <tr>
                            <th>No.</th>
                            <th>ItmName</th>
                            <th>MRP</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Tax%</th>
                            <th>TaxAmnt</th>
                            <th>Rate</th>
                            <th>Amount</th>
                          </tr>
                        </thead>

                        <tbody>
                          {Billdetails.length > 0 ? (
                            Billdetails.map((item, index) => (
                              <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{item.ItemName}</td>
                                <td>{formatAmount(item.MRP)}</td>
                                <td>{item.Quantity}</td>
                                <td>{item.UnitPrice}</td>
                                <td>{formatAmount(item.TaxPercentage)}</td>
                                <td>{formatAmount(item.TaxAmount)}</td>
                                <td>{formatAmount(item.NetRate)}</td>
                                <td>{formatAmount(item.Amount)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="9" className="text-center">No details available</td>
                            </tr>
                          )}
                        </tbody>

                        <tfoot className="bg-dark text-white sticky-bottom" style={{ bottom: 0, zIndex: 1 }}>
                          <tr>
                            <th colSpan="6" className="text-end">Total:</th>
                            <th>{formatAmount(Billdetails.reduce((sum, item) => sum + item.TaxAmount, 0))}</th>
                            <th>{formatAmount(Billdetails.reduce((sum, item) => sum + item.NetRate, 0))}</th>
                            <th>{formatAmount(totalitemAmount)}</th>
                          </tr>

                          {billDiscount > 0 && (
                            <>
                              <tr className="text-dark bg-light">
                                <th colSpan="8" className="text-end">Discount:</th>
                                <th>{formatAmount(billDiscount)}</th>
                              </tr>
                              <tr className="fw-bold bg-warning text-dark">
                                <th colSpan="8" className="text-end">Total Bill Amount:</th>
                                <th>{formatAmount(totalitemAmount - billDiscount)}</th>
                              </tr>
                            </>
                          )}
                        </tfoot>
                      </table>
                    </div>

                  </div>

                  {/* Notes Section */}
                  <div className="row g-3 mt-4">
                    <div className="col-md-4">
                      <div className="card shadow-sm p-3">
                        <h5 className="fw-bold">Notes</h5>
                        <p>Payment is requested within 15 days of receiving this invoice.</p>
                      </div>
                    </div>
                    {/* Check if Billdetails exists and has at least one item with a Narration */}
                    {Billdetails.length > 0 && Billdetails[0].Narration && (
                      <div className="col-md-4">
                        <div className="card shadow-sm p-3">
                          <h5 className="fw-bold">Narration</h5>
                          <p>{Billdetails[0].Narration}</p>
                        </div>
                      </div>
                    )}

                  </div>

                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer bg-light">
                {/* <button type="button" className="btn btn-primary" onClick={handlePrintpop}>
                      Print
                    </button> */}
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
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

export default SaleReport;