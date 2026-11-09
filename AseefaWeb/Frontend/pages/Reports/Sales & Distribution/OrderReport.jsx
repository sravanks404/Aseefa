import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import api from '../../apiService';
import DataTable from "react-data-table-component";
import { FaSearch, FaFileExcel, FaPrint, FaFilter } from "react-icons/fa";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Select from 'react-select';
import logo from "../../../src/assets/morelogo.jpg";
import html2canvas from "html2canvas";


const OrderReport = () => {
  // Date helper functions
  const getCurrentDate = () => new Date().toISOString().split("T")[0];
  const getPreviousDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];
  };

  // Format amount function
  const formatAmount = (amount) => amount?.toFixed(2);

  // State declarations
  const [fromDate, setFromDate] = useState(getPreviousDate(7));
  const [toDate, setToDate] = useState(getCurrentDate());
  const [result, setResult] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState([]);
  const [salesman, setSalesman] = useState("");
  const [customer, setCustomer] = useState("");
  const [branch, setBranch] = useState("");
  const [distinctBranches, setDistinctBranches] = useState([]);
  const [summary, setSummary] = useState({
    customerCount: 0,
    totalAmount: 0,
    totalOrders: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDSID, setSelectedDSID] = useState(null);
  const [distinctSalesmen, setDistinctSalesmen] = useState([]);
  const [distinctCustomers, setDistinctCustomers] = useState([]);
  const [companyData, setCompanyData] = useState(null);
  const [selectedSalesmen, setSelectedSalesmen] = useState([]);
  const [distinctCreatedBy, setDistinctCreatedBy] = useState([]);
  const [createdBy, setCreatedBy] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(500);
  const [orderStatus, setOrderStatus] = useState("");
  const [billMode, setBillMode] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedDsids, setSelectedDsids] = useState([]);

  const [distinctRoots, setDistinctRoots] = useState([]);
  const [selectedRoot, setSelectedRoot] = useState("");



  // Memoized fetch functions
  const fetchDropdownData = useCallback(async () => {
    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      const [usersRes] = await Promise.all([
        api.get(`/api/GetUsers?CompanyID=${CompanyID}`)
      ]);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
      setError("Failed to load dropdown user.");
    }
  }, []);

  // Fetch order report data - FIXED FILTERING

  const fetchOrderReport = useCallback(async (users = []) => {
    setIsLoading(true);
    setError("");
    try {
      const companyID = sessionStorage.getItem("CompanyID");
      const activeUserId = sessionStorage.getItem("activeUserId");

      const statusFilter = orderStatus !== "" ? parseInt(orderStatus) : null;
      const billModeFilter = billMode !== "" ? parseInt(billMode) : null;

      const response = await api.post("/api/getOrderReport", {
        FromDate: fromDate,
        ToDate: toDate,
        CompanyID: companyID,
        OrderStatus: statusFilter,
        BillMode: billModeFilter,
        Branch: branch || null,
        activeUserId: activeUserId,
      });

      const data = response?.data || [];
      const allResults = data.OrderDetails || [];

      // 🆕 Collect all distinct roots from full data (not filtered)
      const uniqueRoots = [...new Set(allResults.map(order => order.RootName).filter(Boolean))];
      setDistinctRoots(uniqueRoots);

      let filteredResults = [...allResults];

      if (customer) {
        filteredResults = filteredResults.filter(order => order.CustomerName === customer);
      }
      if (branch) {
        filteredResults = filteredResults.filter(order => order.BranchName === branch);
      }
      if (statusFilter !== null) {
        filteredResults = filteredResults.filter(order => order.OrderStatus === statusFilter);
      }
      if (billModeFilter !== null) {
        filteredResults = filteredResults.filter(order => order.BillMode === billModeFilter);
      }

      // ✅ Apply RootName filter (but don't affect dropdown list)
      if (selectedRoot) {
        filteredResults = filteredResults.filter(order => order.RootName === selectedRoot);
      }

      // Apply selectedUsers filter only when passed
      const finalResults = users.length > 0
        ? filteredResults.filter(order => users.includes(order.UserName))
        : filteredResults;

      const uniqueCustomers = [...new Set(allResults.map(order => order.CustomerName))];
      const uniqueBranches = [...new Set(allResults.map(order => order.BranchName).filter(Boolean))];

      setDistinctCustomers(uniqueCustomers);
      setDistinctBranches(uniqueBranches);

      const customerCount = new Set(finalResults.map(order => order.CustomerID)).size;
      const totalAmount = finalResults.reduce((sum, order) => sum + (order.Amount || 0), 0);
      const totalOrders = finalResults.length;

      setSummary({ customerCount, totalAmount, totalOrders });
      setResult(finalResults);
      setFilteredResults(finalResults);
    } catch (err) {
      console.error("Error fetching order report:", err);
      setError("Failed to fetch order report. Please try again.");
      setResult([]);
      setFilteredResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, toDate, customer, branch, billMode, orderStatus, selectedRoot]);


  useEffect(() => {
    fetchOrderReport();
  }, [fetchOrderReport]);

  // Initial data fetch
  // useEffect(() => {
  //   fetchDropdownData();
  //   const storedCompanyData = sessionStorage.getItem("companyResponse");
  //   if (storedCompanyData) {
  //     setCompanyData(JSON.parse(storedCompanyData));
  //   }
  // }, []);

  const handleCheckboxChange = (dsid, checked) => {
    setSelectedDsids((prev) =>
      checked ? [...prev, dsid] : prev.filter((id) => id !== dsid)
    );
  };

  // Search functionality
  useEffect(() => {
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = result.filter((row) =>
        (row.CustomerName && row.CustomerName.toLowerCase().includes(lowercasedQuery)) ||
        (row.OrderNo && row.OrderNo.toString().includes(searchQuery)) ||
        (row.Amount && row.Amount.toString().includes(searchQuery)) ||
        (row.Date && new Date(row.Date).toLocaleDateString().includes(searchQuery))
      );
      setFilteredResults(filtered);
    } else {
      setFilteredResults(result);
    }
  }, [searchQuery, result]);

  // Handler for fetching order details
  // Fetch order details with DSID & OrderType
  const fetchOrderDetails = useCallback(async (DSID, OrderType) => {
    try {
      const response = await api.get("/api/Getorderdetails", {
        params: { DSID, OrderType }, // passing both
      });
      setOrderDetails(response?.data || []);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error fetching order details:", err);
    }
  }, []);

  // Event handler to call fetchOrderDetails
  const handleRowClick = useCallback((row) => {
    setSelectedDSID(row.DSID);
    fetchOrderDetails(row.DSID, row.OrderType); // send both
  }, [fetchOrderDetails]);

  const handleClear = useCallback(() => {
    const defaultFromDate = getPreviousDate(7);
    const defaultToDate = getCurrentDate();

    setFromDate(defaultFromDate);
    setToDate(defaultToDate);
    setSelectedRoot(""); // 🆕 clear RootName

    setSalesman("");
    setCustomer("");
    setBranch("");
    setSelectedSalesmen([]);
    setSelectedUsers([]);
    setOrderStatus("");
    setBillMode("");
    setError("");
    setSearchQuery("");

    // Trigger data reload with no user filtering
    fetchOrderReport([]);
  }, [fetchOrderReport]);


  // Export Order Details to PDF

  const exportOrderDetailsToPDF = useCallback(async () => {
    if (!orderDetails?.length) {
      alert("No order details to export.");
      return;
    }

    try {
      const storedCompanyData = sessionStorage.getItem("companyResponse");
      const companyData = storedCompanyData ? JSON.parse(storedCompanyData) : null;

      const formatAmount = (amount) => {
        const num = parseFloat(amount) || 0;
        return `₹${num.toFixed(2)}`;
      };

      const firstOrder = orderDetails[0] || {};
      const orderNumber = `${firstOrder.Bill_Series || ''}${firstOrder.OrderNo || ''}`;
      const totalAmount = orderDetails.reduce((sum, item) => sum + (parseFloat(item.NetAmount) || 0), 0);
      const totalQuantity = orderDetails.reduce((sum, item) => sum + (parseInt(item.Qty) || 0), 0);

      const rowsPerPage = 20;
      const totalPages = Math.ceil(orderDetails.length / rowsPerPage);

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();

        const startIndex = page * rowsPerPage;
        const endIndex = Math.min(startIndex + rowsPerPage, orderDetails.length);
        const pageData = orderDetails.slice(startIndex, endIndex);

        // Temporary container
        const tempContainer = document.createElement("div");
        tempContainer.style.position = "absolute";
        tempContainer.style.left = "-9999px";
        tempContainer.style.width = "794px";
        tempContainer.style.backgroundColor = "#ffffff";
        tempContainer.style.padding = "20px";
        tempContainer.style.boxSizing = "border-box";
        tempContainer.style.fontFamily = "'Segoe UI', Arial, sans-serif";
        document.body.appendChild(tempContainer);

        // HTML layout
        tempContainer.innerHTML = `
        <div id="pdfContent" style="width: 100%; min-height: 100%; background: #ffffff; color: #333;">
          ${page === 0 ? `
          <!-- Header with Company Info -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e0e0e0;">
            <div style="flex: 1;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #2c3e50;">${companyData?.CompanyName || 'Company Name'}</h1>
              <p style="margin: 6px 0 0; font-size: 12px; color: #666; line-height: 1.4;">
                ${companyData?.Address || ''} ${companyData?.MobileNO ? `| Phone: ${companyData.MobileNO}` : ''}
                ${companyData?.GSTinNo ? `| GST: ${companyData.GSTinNo}` : ''}
              </p>
            </div>
            <div style="flex: 1; text-align: right;">
              <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #2c3e50;">ORDER DETAILS REPORT</h2>
              <p style="margin: 4px 0 0; font-size: 11px; color: #666;">Generated: ${new Date().toLocaleString()}</p>
            </div>
          </div>

          <!-- Order Header Info -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
            <div style="border: 1px solid #e0e0e0; border-radius: 6px; padding: 8px; background: #f8f9fa;">
              <p style="margin: 0; font-size: 11px; font-weight: 600; color: #666;">ORDER NUMBER</p>
              <p style="margin: 4px 0 0; font-size: 12px; font-weight: 700; color: #3498db;">${orderNumber || 'N/A'}</p>
            </div>
            <div style="border: 1px solid #e0e0e0; border-radius: 6px; padding: 8px; background: #f8f9fa;">
              <p style="margin: 0; font-size: 11px; font-weight: 600; color: #666;">ORDER DATE</p>
              <p style="margin: 4px 0 0; font-size: 12px; font-weight: 700; color: #2ecc71;">${firstOrder.Date ? new Date(firstOrder.Date).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div style="border: 1px solid #e0e0e0; border-radius: 6px; padding: 8px; background: #f8f9fa;">
              <p style="margin: 0; font-size: 11px; font-weight: 600; color: #666;">ORDER STATUS</p>
              <p style="margin: 4px 0 0; font-size: 12px; font-weight: 700; color: ${firstOrder.OrderStatus === 1 ? '#27ae60' : '#e74c3c'};">${firstOrder.OrderStatus === 1 ? "INVOICED" : "NOT INVOICED"}</p>
            </div>
            <div style="border: 1px solid #e0e0e0; border-radius: 6px; padding: 8px; background: #f8f9fa;">
              <p style="margin: 0; font-size: 11px; font-weight: 600; color: #666;">BILL MODE</p>
              <p style="margin: 4px 0 0; font-size: 12px; font-weight: 700; color: ${firstOrder.BillMode === 1 ? '#e67e22' : '#9b59b6'};">${firstOrder.BillMode === 1 ? "CREDIT" : "CASH"}</p>
            </div>
          </div>

          <!-- Customer & Order Details -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px;">
            <div style="border: 1px solid #e0e0e0; border-radius: 6px; padding: 8px 10px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
              <h4 style="margin: 0 0 6px; font-size: 12px; font-weight: 700; color: #2c3e50; border-bottom: 1px solid #3498db; padding-bottom: 3px;">CUSTOMER DETAILS</h4>
              <div style="font-size: 10px; line-height: 1.3;">
                <p style="margin: 4px 0;"><strong style="color: #666;">Name:</strong> ${firstOrder.CustomerName || 'N/A'}</p>
                <p style="margin: 4px 0;"><strong style="color: #666;">Address:</strong> ${firstOrder.CustomerAddress || 'N/A'}</p>
                <p style="margin: 4px 0;"><strong style="color: #666;">Phone:</strong> ${firstOrder.CustomerPhone || 'N/A'}</p>
              </div>
            </div>
            <div style="border: 1px solid #e0e0e0; border-radius: 6px; padding: 8px 10px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
              <h4 style="margin: 0 0 6px; font-size: 12px; font-weight: 700; color: #2c3e50; border-bottom: 1px solid #3498db; padding-bottom: 3px;">ORDER INFORMATION</h4>
              <div style="font-size: 10px; line-height: 1.3;">
                <p style="margin: 4px 0;"><strong style="color: #666;">Created By:</strong> ${firstOrder.UserName || 'N/A'}</p>
              </div>
            </div>
          </div>
          ` : `
          <!-- Simplified header for other pages -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e0e0e0;">
            <div>
              <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: #2c3e50;">${companyData?.CompanyName || 'Company Name'}</h3>
              <p style="margin: 2px 0 0; font-size: 10px; color: #666;">Order: ${orderNumber} | Page ${page + 1} of ${totalPages}</p>
            </div>
            <div style="text-align: right;"><p style="margin: 0; font-size: 10px; color: #666;">Continued...</p></div>
          </div>`}

          <!-- Items Table -->
          <div style="margin-bottom: 20px;">
            ${page === 0 ? `<h4 style="margin: 0 0 12px; font-size: 16px; font-weight: 700; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px;">ORDER ITEMS</h4>` : ''}
            <table style="width:100%; border-collapse: collapse; font-size: 11px; border: 1px solid #e0e0e0; background: #ffffff;">
              <thead>
                <tr style="background: linear-gradient(135deg, #3498db, #2980b9); color: white;">
                  <th style="border:1px solid #ccc; padding: 10px; text-align:center; width: 5%; font-weight: 700;">#</th>
                  <th style="border:1px solid #ccc; padding: 10px; width: 45%; font-weight: 700;">Item Name</th>
                  <th style="border:1px solid #ccc; padding: 10px; text-align:center; width: 10%; font-weight: 700;">Qty</th>
                  <th style="border:1px solid #ccc; padding: 10px; text-align:right; width: 13%; font-weight: 700;">MRP</th>
                  <th style="border:1px solid #ccc; padding: 10px; text-align:right; width: 12%; font-weight: 700;">Rate</th>
                  <th style="border:1px solid #ccc; padding: 10px; text-align:right; width: 15%; font-weight: 700;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${pageData.map((item, index) => `
                  <tr style="${index % 2 === 0 ? 'background-color: #f8f9fa;' : 'background-color: #ffffff;'}">
                    <td style="border:1px solid #e0e0e0; padding: 8px; text-align:center; font-weight: 600;">${startIndex + index + 1}</td>
                    <td style="border:1px solid #e0e0e0; padding: 8px; font-weight: 500;">${item.ItemName || 'N/A'}</td>
                    <td style="border:1px solid #e0e0e0; padding: 8px; text-align:center; font-weight: 600;">${item.Qty || 0}</td>
                    <td style="border:1px solid #e0e0e0; padding: 8px; text-align:right; font-weight: 600;">${formatAmount(item.MRP)}</td>
                    <td style="border:1px solid #e0e0e0; padding: 8px; text-align:right; font-weight: 600;">${formatAmount(item.Rate)}</td>
                    <td style="border:1px solid #e0e0e0; padding: 8px; text-align:right; font-weight: 700; color: #27ae60;">${formatAmount(item.NetAmount)}</td>
                  </tr>
                `).join('')}
              </tbody>
              ${page === totalPages - 1 ? `
              <tfoot>
                <tr style="background: linear-gradient(135deg, #2c3e50, #34495e); color: white;">
                  <td colspan="5" style="border:1px solid #34495e; padding: 12px; text-align:right; font-weight: 700; font-size: 12px;">TOTAL AMOUNT:</td>
                  <td style="border:1px solid #34495e; padding: 12px; text-align:right; font-weight: 700; font-size: 12px;">${formatAmount(totalAmount)}</td>
                </tr>
              </tfoot>` : ''}
            </table>
          </div>

          ${page === totalPages - 1 ? `
          <!-- Summary + Signatures + Footer -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 25px;">
            <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; background: linear-gradient(135deg, #74b9ff, #0984e3); color: white; text-align: center;">
              <strong style="font-size: 11px; display: block; margin-bottom: 5px;">TOTAL ITEMS</strong>
              <span style="font-size: 16px; font-weight: 700;">${orderDetails.length}</span>
            </div>
            <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; background: linear-gradient(135deg, #55efc4, #00b894); color: white; text-align: center;">
              <strong style="font-size: 11px; display: block; margin-bottom: 5px;">TOTAL QUANTITY</strong>
              <span style="font-size: 16px; font-weight: 700;">${totalQuantity}</span>
            </div>
            <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; background: linear-gradient(135deg, #a29bfe, #6c5ce7); color: white; text-align: center;">
              <strong style="font-size: 11px; display: block; margin-bottom: 5px;">GRAND TOTAL</strong>
              <span style="font-size: 16px; font-weight: 700;">${formatAmount(totalAmount)}</span>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; margin-top: 30px; font-size: 11px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
            <div style="text-align: center; width: 30%;">
              <div style="height: 50px; border-bottom: 2px solid #000; margin-bottom: 8px;"></div>
              <p style="margin: 0; font-weight: 600; color: #666;">Customer Signature</p>
            </div>
            <div style="text-align: center; width: 30%;">
              <div style="height: 50px; border-bottom: 2px solid #000; margin-bottom: 8px;"></div>
              <p style="margin: 0; font-weight: 600; color: #666;">Sales Executive</p>
            </div>
            <div style="text-align: center; width: 30%;">
              <div style="height: 50px; border-bottom: 2px solid #000; margin-bottom: 8px;"></div>
              <p style="margin: 0; font-weight: 600; color: #666;">Authorized Signatory</p>
            </div>
          </div>

          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; font-size: 10px; text-align: center; color: #999; background: #f8f9fa; padding: 10px; border-radius: 6px;">
            Generated on ${new Date().toLocaleString()} | Order: ${orderNumber} | Customer: ${firstOrder.CustomerName || 'N/A'} | Total Items: ${orderDetails.length}
          </div>
          ` : `
          <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #eee; font-size: 9px; text-align: center; color: #999;">
            Page ${page + 1} of ${totalPages} | Order: ${orderNumber} | Continued on next page...
          </div>`}
        </div>
      `;

        // Render page to canvas
        const canvas = await html2canvas(tempContainer, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
        const imgData = canvas.toDataURL("image/png");
        const imgHeight = (canvas.height * pageWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, pageWidth, imgHeight);

        // Clean up temporary DOM
        tempContainer.remove();
      }

      // Export Modal
      const existingModal = document.getElementById("exportModal");
      if (existingModal) existingModal.remove();

      const modal = document.createElement("div");
      modal.id = "exportModal";
      modal.style.position = "fixed";
      modal.style.top = "0";
      modal.style.left = "0";
      modal.style.width = "100%";
      modal.style.height = "100%";
      modal.style.background = "rgba(0,0,0,0.5)";
      modal.style.display = "flex";
      modal.style.alignItems = "center";
      modal.style.justifyContent = "center";
      modal.style.zIndex = "9999";

      modal.innerHTML = `
      <div style="background:white; padding:20px; border-radius:8px; text-align:center;">
        <h4 style="margin-bottom:15px;">Export As?</h4>
        <button id="printBtn" style="margin-right:10px;">Print</button>
        <button id="downloadBtn">Download</button>
      </div>
    `;
      document.body.appendChild(modal);

      document.getElementById("printBtn").onclick = () => {
        modal.remove();
        const blobUrl = URL.createObjectURL(pdf.output("blob"));
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.right = "-9999px";
        iframe.src = blobUrl;
        document.body.appendChild(iframe);
        iframe.onload = () => { iframe.contentWindow.focus(); iframe.contentWindow.print(); };
      };

      document.getElementById("downloadBtn").onclick = () => {
        modal.remove();
        pdf.save(`Order_${orderNumber || "Report"}.pdf`);
      };

    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF");
    }
  }, [orderDetails]);




  const handleSalesmanChange = (user) => {
    setSelectedSalesmen((prev) => {
      const updatedSelection = prev.some(u => u.id === user.id)
        ? prev.filter(u => u.id !== user.id) // Remove if already selected
        : [...prev, { id: user.id, name: user.name }]; // Ensure objects are structured correctly

      return updatedSelection;
    });
  };

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    fetchOrderReport(selectedUsers);
  }, [fetchOrderReport, selectedUsers]);


  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const dropdownMenuRef = useRef(null);

  const userOptions = useMemo(() => {
    const uniqueUserNames = [...new Set(
      result
        .map(order => order.UserName)
        .filter(name => name && name.trim() !== '')
    )];
    return uniqueUserNames.map(name => ({
      value: name,
      label: name
    }));
  }, [result]);

  // const userOptions = useMemo(() => {
  //   return users.map(user => ({
  //     value: user.UserName,
  //     label: user.UserName
  //   }));
  // }, [users]);

  useEffect(() => {
    // Retrieve from sessionStorage and parse JSON
    const storedCompanyData = sessionStorage.getItem("companyResponse");
    if (storedCompanyData) {
      setCompanyData(JSON.parse(storedCompanyData));
    }
  }, []);

  const exportToExcel = useCallback(() => {
    if (!filteredResults.length) {
      alert("No data to export.");
      return;
    }

    // Header with filter information
    const headerData = [
      ["From Date", fromDate, "", "To Date", toDate],
      ["Status", orderStatus || "All", "", "Bill Mode", billMode || "All"],
      ["Customer", customer || "All", "", "Users", selectedUsers.length > 0 ? `${selectedUsers.length} selected` : "All"],
      [],
      ["Order Report"],
      [],
    ];

    // Column headers
    const tableHeaders = [
      ["SL.No", "Order No", "Customer", "Amount", "Date", "User", "Status", "Mode"]
    ];

    // Format the data (use raw number for Amount)
    const formattedData = filteredResults.map((row, index) => [
      index + 1,
      `${row.Bill_Series || ''}${row.OrderNo || ''}`,
      row.CustomerName || "N/A",
      row.Amount ?? 0, // Keep as number
      row.Date ? new Date(row.Date).toLocaleDateString() : "N/A",
      row.UserName || "N/A",
      row.OrderStatus === 1 ? "Invoiced" : "Not Invoiced",
      row.BillMode === 1 ? "Credit" : "Cash"
    ]);

    // Add total row with number in Amount column
    const totalAmount = filteredResults.reduce((sum, order) => sum + (order.Amount || 0), 0);
    formattedData.push([
      "TOTAL", "", "", totalAmount, "", "", "", ""
    ]);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet([...headerData, ...tableHeaders, ...formattedData]);

    // Set column widths
    ws["!cols"] = [
      { wch: 8 },   // SL.No
      { wch: 20 },  // Order No
      { wch: 30 },  // Customer
      { wch: 15 },  // Amount
      { wch: 15 },  // Date
      { wch: 20 },  // User
      { wch: 15 },  // Status
      { wch: 15 }   // Mode
    ];

    // Merge title row
    ws["!merges"] = [{ s: { r: 4, c: 0 }, e: { r: 4, c: 7 } }];

    // Format Amount column (index 3) to show two decimals
    const dataStartRow = headerData.length + 1; // skip headerData and tableHeaders
    for (let i = 0; i < formattedData.length; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: dataStartRow + i, c: 3 }); // Column D (Amount)
      if (ws[cellRef] && typeof ws[cellRef].v === "number") {
        ws[cellRef].z = "0.00";
      }
    }

    // Create workbook and export
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "OrderReport");
    XLSX.writeFile(wb, `OrderReport_${fromDate}_to_${toDate}.xlsx`);
  }, [filteredResults, fromDate, toDate, orderStatus, billMode, customer, selectedUsers]);


  const exportToPDF = useCallback(() => {
    if (!filteredResults.length) {
      alert("No data to export.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Order Report (${fromDate} to ${toDate})`, 14, 10);

    // Add filter information
    doc.setFontSize(10);
    let yPosition = 20;
    doc.text(`From Date: ${fromDate}`, 14, yPosition);
    doc.text(`To Date: ${toDate}`, 80, yPosition);
    yPosition += 7;
    doc.text(`Status: ${orderStatus || "All"}`, 14, yPosition);
    doc.text(`Bill Mode: ${billMode || "All"}`, 80, yPosition);
    yPosition += 7;
    doc.text(`Customer: ${customer || "All"}`, 14, yPosition);
    doc.text(`Users: ${selectedUsers.length > 0 ? `${selectedUsers.length} selected` : "All"}`, 80, yPosition);
    yPosition += 10;

    // Table headers
    const headers = [
      "#",
      "Order No",
      "Customer",
      "Amount",
      "Date",
      "User",
      "Status",
      "Mode"
    ];

    // Format the data
    const data = filteredResults.map((row, index) => [
      index + 1,
      `${row.Bill_Series || ''}${row.OrderNo || ''}`,
      row.CustomerName || "N/A",
      formatAmount(row.Amount),
      row.Date ? new Date(row.Date).toLocaleDateString() : "N/A",
      row.UserName || "N/A",
      row.OrderStatus === 1 ? "Invoiced" : "Not Invoiced",
      row.BillMode === 1 ? "Credit" : "Cash"
    ]);

    // Add total row
    data.push([
      { content: "TOTAL", colSpan: 3, styles: { fontStyle: "bold", halign: "center" } },
      { content: formatAmount(filteredResults.reduce((sum, order) => sum + (order.Amount || 0), 0)), styles: { fontStyle: "bold" } },
      "", "", "", ""
    ]);

    // Create table
    doc.autoTable({
      head: [headers],
      body: data,
      startY: yPosition,
      theme: "grid",
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 8 },   // SL.No
        1: { cellWidth: 20 },  // Order No
        2: { cellWidth: 30 },  // Customer
        3: { cellWidth: 15 },  // Amount
        4: { cellWidth: 15 },  // Date
        5: { cellWidth: 20 },  // User
        6: { cellWidth: 15 },  // Status
        7: { cellWidth: 15 }   // Mode
      },
      margin: { top: 20 },
    });

    doc.save(`OrderReport_${fromDate}_to_${toDate}.pdf`);
  }, [filteredResults, fromDate, toDate, orderStatus, billMode, customer, selectedUsers]);

  // DataTable columns configuration
  const columns = [
    {
      name: "",
      cell: (row) => (
        <input
          type="checkbox"
          checked={selectedDsids.includes(row.DSID)}
          onChange={(e) => handleCheckboxChange(row.DSID, e.target.checked)}
        />
      ),
      width: "2%",
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
    {
      name: "SL.No",
      selector: (_, index) => (currentPage - 1) * rowsPerPage + index + 1,
      sortable: false,
      width: "5%",
    },
    {
      name: "Order No",
      selector: (row) => `${row.Bill_Series}${row.OrderNo}`,
      sortable: true,
      width: "11%",
    },
    {
      name: "Date",
      selector: (row) =>
        row.Date ? new Date(row.Date).toLocaleDateString("en-GB") : "N/A",
      sortable: true,
      width: "7%",
    },
    {
      name: "Customer Name",
      selector: (row) => row.CustomerName || "N/A",
      sortable: true,
      width: "20%",
    },
    {
      name: "Amount",
      selector: (row) => formatAmount(row.Amount),
      sortable: true,
      right: true,
      width: "10%",
    },
    {
      name: "User",
      selector: (row) => row.UserName || "N/A",
      sortable: true,
      width: "8%",
    },
    {
      name: "Status",
      cell: (row) => (
        <span style={{ color: row.OrderStatus === 1 ? "green" : "red" }}>
          {row.OrderStatus === 1 ? "Invoiced" : "Not Invoiced"}
        </span>
      ),
      width: "9%",
    },
    {
      name: "Route",
      selector: (row) => row.RootName || "N/A",
      sortable: true,
      width: "16%",
    },
    {
      name: "Mode",
      cell: (row) => (
        <span style={{ color: row.BillMode === 1 ? "red" : "green" }}>
          {row.BillMode === 1 ? "Credit" : "Cash"}
        </span>
      ),
      width: "10%",
    },
//   {
//   name: "Created At",
//   selector: (row) =>
//     row.CreatedAt
//       ? new Date(row.CreatedAt).toISOString().replace("T", " ").slice(0, 19)
//       : "N/A",
//   sortable: true,
//   width: "12%",
// },


  ];
  // Dropdown options
  const customerOptions = useMemo(() => [
    { value: '', label: 'All Customers' },
    ...distinctCustomers.map(name => ({
      value: name,
      label: name
    }))
  ], [distinctCustomers]);

  const branchOptions = useMemo(() => [
    { value: '', label: 'All Branches' },
    ...distinctBranches.map(branchName => ({
      value: branchName,
      label: branchName
    }))
  ], [distinctBranches]);

  // Custom styles for DataTable
  const customStyles = {
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
      minWidth: '250px'
    }),
    option: (provided) => ({
      ...provided,
      padding: '6px 12px 6px 32px',
      fontSize: '13px',
      whiteSpace: 'nowrap',
      overflow: 'visible',
      textOverflow: 'clip',
      position: 'relative'
    }),
    control: (provided) => ({
      ...provided,
      minHeight: '36px'
    }),
    multiValue: (provided) => ({
      ...provided,
      maxWidth: '100%'
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '120px'
    })
  };

  const conditionalRowStyles = [
    {
      when: (row) => selectedDsids.includes(row.DSID),
      style: {
        backgroundColor: "#d1f7d1", // light green background
        color: "#000",              // text color
        fontWeight: "bold",
      },
    },
  ];

  // Custom footer component for pagination
  const CustomFooter = ({ rowsPerPage, rowCount, currentPage, onChangePage, onChangeRowsPerPage }) => {
    const totalPages = Math.ceil(rowCount / rowsPerPage);
    const liveTotal = filteredResults.reduce((sum, item) => sum + (item.Amount || 0), 0);

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

  // Paginated results
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredResults.slice(start, start + rowsPerPage);
  }, [filteredResults, currentPage, rowsPerPage]);

  return (
    <div className="container-fluid">
      {/* Header Section */}
      <div className="card shadow-sm mb-3 p-3">
        <h4>Order Report</h4>
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
                placeholder="Search orders by customer name, amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex flex-wrap justify-content-end gap-2 w-100 w-md-auto">
            <button
              type="button"
              className="btn btn-outline-primary"
              data-bs-toggle="modal"
              data-bs-target="#filterModal"
            >
              <FaFilter className="me-1" /> Filters
            </button>
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

      {/* Filter Modal */}
      <div
        className="modal fade"
        id="filterModal"
        tabIndex="-1"
        aria-labelledby="filterModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header bg-light">
              <h5 className="modal-title text-primary" id="filterModalLabel">
                <FaFilter className="me-2" />
                Order Report Filters
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                {/* Date Range Row */}
                <div className="row mb-3 g-3">
                  <div className="col-md-6">
                    <label
                      htmlFor="FromDate"
                      className="form-label fw-bold small text-muted"
                    >
                      FROM DATE
                    </label>
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
                    <label
                      htmlFor="ToDate"
                      className="form-label fw-bold small text-muted"
                    >
                      TO DATE
                    </label>
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
                  {/* Left Column */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label
                        htmlFor="OrderStatus"
                        className="form-label fw-bold small text-muted"
                      >
                        STATUS
                      </label>
                      <select
                        id="OrderStatus"
                        className="form-select"
                        value={orderStatus}
                        onChange={(e) => setOrderStatus(e.target.value)}
                      >
                        <option value="">All Status</option>
                        <option value="1">Invoiced</option>
                        <option value="0">Not Invoiced</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label
                        htmlFor="BillMode"
                        className="form-label fw-bold small text-muted"
                      >
                        BILL MODE
                      </label>
                      <select
                        id="BillMode"
                        className="form-select"
                        value={billMode}
                        onChange={(e) => setBillMode(e.target.value)}
                      >
                        <option value="">All Modes</option>
                        <option value="0">Cash</option>
                        <option value="1">Credit</option>
                      </select>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-muted">
                        USERS
                      </label>
                      <Select
                        isMulti
                        options={userOptions}
                        value={userOptions.filter((opt) =>
                          selectedUsers.includes(opt.value)
                        )}
                        onChange={(selectedOptions) =>
                          setSelectedUsers(selectedOptions.map((opt) => opt.value))
                        }
                        placeholder="Select Users..."
                        classNamePrefix="select"
                        styles={{
                          menu: (base) => ({ ...base, zIndex: 9999 }),
                          control: (base) => ({ ...base, minHeight: 36 }),
                        }}
                      />
                    </div>
                    <div className="mb-3">
                      <label
                        htmlFor="RootName"
                        className="form-label fw-bold small text-muted"
                      >
                        Route
                      </label>
                      <select
                        id="RootName"
                        className="form-select"
                        value={selectedRoot}
                        onChange={(e) => setSelectedRoot(e.target.value)}
                      >
                        <option value="">All Route</option>
                        {distinctRoots.map((root, index) => (
                          <option key={index} value={root}>
                            {root}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="modal-footer bg-light">
              <div className="d-flex justify-content-between w-100">
                <button
                  type="button"
                  className="btn btn-link text-danger"
                  onClick={handleClear}
                  disabled={isLoading}
                >
                  Clear All
                </button>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    data-bs-dismiss="modal"
                  >
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
      <div className="card shadow border-0 rounded mb-4" style={{ height: "calc(100vh - 230px)", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <DataTable
            columns={columns}
            data={paginatedResults}
            conditionalRowStyles={conditionalRowStyles}

            progressPending={isLoading}
            highlightOnHover
            striped
            pagination={false}
            onRowClicked={handleRowClick}
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

      {/* Order Details Modal */}
      {isModalOpen && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.5)", overflow: "auto" }}>
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content shadow-lg rounded">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">Order Details</h5>
                <button type="button" className="close btn btn-danger rounded-circle p-2" onClick={handleCloseModal}>
                  <span>&times;</span>
                </button>
              </div>

              <div className="modal-body p-4" id="modal-print-content">
                {orderDetails.length > 0 ? (
                  <div className="container-fluid">
                    {/* Order Header */}
                    <div className="row align-items-center mb-4 border-bottom pb-3">
                      <div className="col-md-6">
                        <h2 className="fw-bold">
                          <small className="text-muted">
                            Order: {orderDetails[0].Bill_Series}{orderDetails[0].OrderNo}
                          </small>
                        </h2>
                        <h5 className="text-muted">
                          Date: {orderDetails[0].Date ? new Date(orderDetails[0].Date).toLocaleDateString() : "N/A"}
                        </h5>
                      </div>
                      <div className="col-md-6 text-end">
                        {companyData ? (
                          <ul className="list-unstyled mb-0">
                            <li><strong>{companyData.CompanyName}</strong></li>
                            <li style={{ fontSize: "12px" }}>{companyData.Address}</li>
                            <li style={{ fontSize: "12px" }}>{companyData.GSTinNo}</li>
                            <li style={{ fontSize: "12px" }}>{companyData.MobileNO}</li>
                          </ul>
                        ) : (
                          <p>Loading company details...</p>
                        )}
                      </div>
                    </div>

                    {/* Customer & Order Details */}
                    <div className="row g-3 d-flex flex-wrap">
                      <div className="col-md-6">
                        <div className="card shadow-sm p-3 h-100 d-flex flex-column">
                          <h5 className="fw-bold">Customer Details</h5>
                          <ul className="list-unstyled flex-grow-1">
                            <li><strong>Name:</strong> {orderDetails[0].CustomerName}</li>
                            <li><strong>Address:</strong> {orderDetails[0].CustomerAddress}</li>
                            <li><strong>Phone:</strong> {orderDetails[0].CustomerPhone}</li>
                          </ul>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="card shadow-sm p-3 h-100 d-flex flex-column">
                          <h5 className="fw-bold">Order Details</h5>
                          <ul className="list-unstyled flex-grow-1">
                            <li><strong>User:</strong> {orderDetails[0].UserName}</li>
                            <li><strong>Status:</strong> {orderDetails[0].OrderStatus === 1 ? "Invoiced" : "Not Invoiced"}</li>
                            <li><strong>Mode:</strong> {orderDetails[0].BillMode === 1 ? "Credit" : "Cash"}</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Items Table */}
                    <div className="card shadow-sm p-3 mt-4">
                      <h5 className="fw-bold">Items Summary</h5>
                      <table className="table table-bordered text-center mt-2" style={{ fontSize: "10px" }}>
                        <thead className="table-light">
                          <tr>
                            <th>No.</th>
                            <th>Item Name</th>
                            <th>Qty</th>
                            <th>MRP</th>
                            <th>Rate</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderDetails.map((item, index) => (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              <td>{item.ItemName}</td>
                              <td>{item.Qty}</td>
                              <td>{formatAmount(item.MRP)}</td>
                              <td>{formatAmount(item.Rate)}</td>
                              <td>{formatAmount(item.NetAmount)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="table-dark text-white">
                          <tr>
                            <th colSpan="5" className="text-end">Total:</th>
                            <th>{formatAmount(orderDetails.reduce((sum, item) => sum + (item.NetAmount || 0), 0))}</th>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p>Loading order details...</p>
                )}
              </div>

              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-success" onClick={exportOrderDetailsToPDF}>
                  Generate
                </button>
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

export default OrderReport;