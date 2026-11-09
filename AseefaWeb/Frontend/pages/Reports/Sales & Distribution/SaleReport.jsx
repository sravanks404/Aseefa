import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import api from '../../apiService';
import DataTable from "react-data-table-component";
import numberToWords from "number-to-words";
import { FaSearch, FaFileExcel, FaPrint, FaFilter } from "react-icons/fa";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import Select from 'react-select';

const SaleReport = () => {
  const getCurrentDate = () => new Date().toISOString().split("T")[0];
  const getPreviousDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];
  };

const formatAmount = (amount) => {
  const value = parseFloat(amount) || 0;
  return value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  });
};

  const [fromDate, setFromDate]               = useState(getPreviousDate(7));
  const [toDate, setToDate]                   = useState(getCurrentDate());
  const [type, setType]                       = useState("All");
  const [result, setResult]                   = useState([]);
  const [isLoading, setIsLoading]             = useState(false);
  const [error, setError]                     = useState("");
  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [Billdetails, setBillDetails]         = useState([]);
  const [salesman, setSalesman]               = useState("");
  const [customer, setCustomer]               = useState("");
  const [branch, setBranch]                   = useState("");
  const [distinctRoots, setDistinctRoots]     = useState([]);
  const [root, setRoot]                       = useState("");
  const [distinctBranches, setDistinctBranches] = useState([]);
  const [summary, setSummary]                 = useState({ customerCount: 0, totalAmount: 0, totalOrders: 0 });
  const [searchQuery, setSearchQuery]         = useState("");
  const inputRef                              = useRef(null);
  const [selectedDSID, setSelectedDSID]       = useState(null);
  const [distinctSalesmen, setDistinctSalesmen]   = useState([]);
  const [distinctCustomers, setDistinctCustomers] = useState([]);
  const [companyData, setCompanyData]         = useState(null);
  const [bankData, setBankData]               = useState(null);
  const [selectedSalesmen, setSelectedSalesmen]   = useState([]);
  const [distinctCreatedBy, setDistinctCreatedBy] = useState([]);
  const [createdBy, setCreatedBy]             = useState("");
  const [currentPage, setCurrentPage]         = useState(1);
  const [rowsPerPage, setRowsPerPage]         = useState(500);

  const [qrImageData, setQrImageData] = useState(null);
  const [qrLoading,   setQrLoading]   = useState(false);
  const [qrError,     setQrError]     = useState('');
  const qrLibLoaded                   = useRef(false);

  const loadQRLib = () => new Promise((resolve, reject) => {
    if (window.QRCode) { resolve(); return; }
    if (qrLibLoaded.current) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    s.onload  = () => { qrLibLoaded.current = true; resolve(); };
    s.onerror = () => reject(new Error('Failed to load QR library'));
    document.head.appendChild(s);
  });

  const sanitizeUpiId = (raw) => {
    if (!raw || typeof raw !== 'string') return null;
    let cleaned = raw.replace(/\s+/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
    const parts = cleaned.split('@');
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
    const upiRegex = /^[a-zA-Z0-9._\-+]+@[a-zA-Z0-9._\-]+$/;
    if (!upiRegex.test(cleaned)) return null;
    return cleaned.toLowerCase();
  };

  const buildUPIString = (upiId) => {
    const cleanUpi = sanitizeUpiId(upiId);
    if (!cleanUpi) return null;
    return `upi://pay?pa=${cleanUpi}&cu=INR`;
  };

  const generateInlineQR = useCallback(async (upiId) => {
    const cleanUpi = sanitizeUpiId(upiId);
    if (!cleanUpi) {
      setQrImageData(null);
      setQrError(
        upiId?.trim()
          ? `Invalid UPI ID: "${upiId.trim()}". Expected format: name@bank (e.g. merchant@ybl)`
          : ''
      );
      setQrLoading(false);
      return;
    }

    setQrLoading(true);
    setQrError('');
    setQrImageData(null);

    try {
      await loadQRLib();

      const upiString = buildUPIString(cleanUpi);
      if (!upiString) {
        setQrError('Failed to build UPI string. Check UPI ID format.');
        setQrLoading(false);
        return;
      }

      const tmp = document.createElement('div');
      tmp.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
      document.body.appendChild(tmp);

      // eslint-disable-next-line no-new
      new window.QRCode(tmp, {
        text:         upiString,
        width:        160,
        height:       160,
        colorDark:    '#000000',
        colorLight:   '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.H,
      });

      setTimeout(() => {
        const canvas = tmp.querySelector('canvas');
        if (canvas) {
          setQrImageData(canvas.toDataURL('image/png'));
        } else {
          const img = tmp.querySelector('img');
          setQrImageData(img ? img.src : null);
          if (!img) setQrError('Could not render QR code.');
        }
        document.body.removeChild(tmp);
        setQrLoading(false);
      }, 250);

    } catch (err) {
      setQrError('QR generation failed: ' + err.message);
      setQrLoading(false);
    }
  }, []);

  const clearQR = useCallback(() => {
    setQrImageData(null);
    setQrError('');
    setQrLoading(false);
  }, []);

  useEffect(() => {
    const rawUpi =
      bankData?.UPIid  ||
      bankData?.UpiId  ||
      bankData?.upiId  ||
      bankData?.upiid  ||
      bankData?.UPIID  ||
      bankData?.Upiid  ||
      null;

    const cleanUpi = sanitizeUpiId(rawUpi);

    if (cleanUpi) {
      generateInlineQR(cleanUpi);
    } else {
      clearQR();
      if (rawUpi) {
        console.warn(`[SaleReport] UPI ID from bank API is invalid: "${rawUpi}". Expected format: name@bank`);
      }
    }
  }, [bankData, companyData, generateInlineQR, clearQR]);

  let filteredResults = result.filter((row) => {
    const q = searchQuery.toLowerCase();
    return (
      row.CustomerName?.toLowerCase().includes(q) ||
      row.RetailBillNo?.toString().includes(searchQuery) ||
      row.WholesaleNo?.toString().includes(searchQuery) ||
      row.BillAmount?.toString().includes(searchQuery) ||
      row.BillDate?.toLowerCase().includes(q) ||
      row.InvSeries?.toLowerCase().includes(q) ||
      row.SaleType?.toLowerCase().includes(q) ||
      row.BillModeText?.toLowerCase().includes(q) ||
      row.Salesman?.toLowerCase().includes(q) ||
      row.CreatedBy?.toLowerCase().includes(q)
    );
  });

  if (createdBy) {
    filteredResults = filteredResults.filter(o => o.CreatedById === parseInt(createdBy));
  }

  const fetchSaleReport = async () => {
    setIsLoading(true);
    setError("");
    try {
      const companyID         = sessionStorage.getItem("CompanyID");
      const financialResponse = JSON.parse(sessionStorage.getItem("financialResponse"));
      const FYearID           = financialResponse?.FYearID;
      const activeUserId      = sessionStorage.getItem("activeUserId");

      const response = await api.post("/api/getSaleReport", {
        FromDate: fromDate, ToDate: toDate, Type: type,
        companyID, FYearID,
        CustomerID: customer || null,
        Branch: branch || null,
        activeUserId,
      });

      const data = response?.data || [];
      let fr = data.billDetails || [];

      const uniqueSalesmen   = [...new Map(fr.filter(o => o.SalesmanId).map(o => [o.SalesmanId, { id: o.SalesmanId, name: o.Salesman || `User ${o.SalesmanId}` }])).values()];
      const uniqueRoots      = [...new Set(fr.map(o => o.RootName).filter(Boolean))];
      const uniqueCustomers  = [...new Set(fr.map(o => o.CustomerName).filter(Boolean))];
      const uniqueCreatedBy  = [...new Map(fr.filter(o => o.CreatedById).map(o => [o.CreatedById, { id: o.CreatedById, name: o.CreatedBy || `User ${o.CreatedById}` }])).values()];
      const uniqueBranches   = [...new Set(fr.map(o => o.BranchName).filter(Boolean))];

      setDistinctSalesmen(uniqueSalesmen);
      setDistinctCustomers(uniqueCustomers);
      setDistinctCreatedBy(uniqueCreatedBy);
      setDistinctBranches(uniqueBranches);
      setDistinctRoots(uniqueRoots);

      if (selectedSalesmen.length > 0) fr = fr.filter(o => selectedSalesmen.some(s => s.id === o.SalesmanId));
      if (customer) fr = fr.filter(o => o.CustomerName === customer);
      if (branch)   fr = fr.filter(o => o.BranchName === branch);
      if (root)     fr = fr.filter(o => o.RootName === root);

      const isDefault = fromDate === getPreviousDate(7) && toDate === getCurrentDate() && type === "All" && !customer && !branch && selectedSalesmen.length === 0;
      fr = fr.slice().sort((a, b) => isDefault
        ? new Date(b.BillDate) - new Date(a.BillDate)
        : new Date(a.BillDate) - new Date(b.BillDate));

      setSummary({
        customerCount: new Set(fr.map(o => o.CustomerID)).size,
        totalAmount:   fr.reduce((s, o) => s + (o.BillAmount || 0), 0),
        totalOrders:   fr.length,
      });
      setResult(fr);
    } catch (err) {
      console.error("Error fetching sale report:", err);
      setError("Failed to fetch sale report. Please try again.");
      setResult([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const stored = sessionStorage.getItem("companyResponse");
    if (stored) setCompanyData(JSON.parse(stored));
  }, []);

  useEffect(() => { fetchSaleReport(); }, [selectedSalesmen]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchSaleReport(); }, [fromDate, toDate, type, salesman, createdBy, customer, branch]);

  const fetchBillDetails = async (BillID) => {
    const CompanyID = sessionStorage.getItem("CompanyID");
    try {
      const response = await api.get("/api/webGetBillDetailed", { params: { BillID, CompanyID } });
      const details  = response?.data?.data || [];
      setBillDetails(details);

      const branchId = details[0]?.BranchId || null;

      try {
        const bankResponse = await api.get("/api/GetBank", { params: { CompanyId: CompanyID, BranchId: branchId } });
        const fetchedBank  = bankResponse?.data?.[0] || null;

        if (fetchedBank) {
          console.log("Bank data keys:", Object.keys(fetchedBank));
          console.log("Bank data:", fetchedBank);
        }

        setBankData(fetchedBank);
      } catch (e) {
        console.error("Bank fetch error:", e);
        setBankData(null);
        clearQR();
      }

      setIsModalOpen(true);
    } catch (err) {
      console.error("Error fetching bill details:", err);
    }
  };

  const handleRowClick = (BillID) => {
    setSelectedDSID(BillID);
    clearQR();
    fetchBillDetails(BillID);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setBankData(null);
    clearQR();
  };

  const getUpiId = (bd) => {
    const raw =
      bd?.UPIid || bd?.UpiId || bd?.upiId || bd?.upiid || bd?.UPIID || bd?.Upiid || null;
    return sanitizeUpiId(raw);
  };

  const exportToExcel = () => {
    if (!filteredResults?.length) { alert("No data to export."); return; }
    const totalAmount = filteredResults.reduce((s, o) => s + (o.BillAmount || 0), 0);
    const wb = XLSX.utils.book_new();
    const filterData = [
      ["Sale Report"],
      ["From Date",   fromDate ? new Date(fromDate).toLocaleDateString() : "N/A"],
      ["To Date",     toDate   ? new Date(toDate).toLocaleDateString()   : "N/A"],
      ["Type",        type || "All"],
      ["Salesman",    selectedSalesmen.length > 0 ? selectedSalesmen.map(s => s.name).join(", ") : "All"],
      ["Created By",  createdBy ? distinctCreatedBy.find(u => u.id === parseInt(createdBy))?.name || "All" : "All"],
      ["Customer",    customer || "All"],
      ["Branch",      branch   || "All"],
      [],
      ["Total Amount", formatAmount(totalAmount)],
      [],
    ];
    const headers  = [["Sl No", "Bill No", "Customer", "Amount", "Date", "Type", "Mode", "Salesman", "Route"]];
    const dataRows = filteredResults.map((row, i) => {
      const billNo = `${row.InvSeries || ''}${row.RetailBillNo || row.WholesaleNo || row.BillNo || ''}` || "N/A";
      return [i + 1, billNo, row.CustomerName || "N/A", row.BillAmount || 0,
        row.BillDate ? new Date(row.BillDate).toLocaleDateString() : "N/A",
        row.SaleType || "N/A", row.BillModeText || "N/A", row.Salesman || "N/A", row.RootName || "N/A"];
    });
    dataRows.push(["TOTAL", "", "", totalAmount, "", "", "", "", ""]);
    const ws = XLSX.utils.aoa_to_sheet([...filterData, ...headers, ...dataRows]);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, { s: { r: 9, c: 0 }, e: { r: 9, c: 1 } }];
    ws["!cols"]   = [{ wch: 5 }, { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws, "SaleReport");
    XLSX.writeFile(wb, `SaleReport_${fromDate}_to_${toDate}.xlsx`);
  };

  const exportToPDF = () => {
    if (!filteredResults.length) { alert("No data to export."); return; }
    const totalAmount = filteredResults.reduce((s, o) => s + (o.BillAmount || 0), 0);
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16); doc.text("Sale Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`From: ${fromDate ? new Date(fromDate).toLocaleDateString() : "N/A"}`, 14, 25);
    doc.text(`To: ${toDate ? new Date(toDate).toLocaleDateString() : "N/A"}`, 60, 25);
    doc.text(`Type: ${type || "All"}`, 106, 25);
    doc.text(`Salesman: ${selectedSalesmen.length > 0 ? selectedSalesmen.map(s => s.name).join(", ") : "All"}`, 14, 32);
    doc.text(`Customer: ${customer || "All"}`, 106, 32);
    doc.text(`Branch: ${branch || "All"}`, 152, 32);

    const tableRows = filteredResults.map((row, i) => {
      const billNo = `${row.InvSeries || ''}${row.RetailBillNo || row.WholesaleNo || row.BillNo || ''}` || "N/A";
      return [i + 1, billNo, row.CustomerName || "N/A",
        { content: row.BillAmount?.toFixed(2) || "0.00", styles: { halign: 'right' } },
        row.BillDate ? new Date(row.BillDate).toLocaleDateString() : "N/A",
        row.SaleType || "N/A", row.BillModeText || "N/A", row.Salesman || "N/A", row.RootName || "N/A"];
    });
    tableRows.push([
      { content: "TOTAL", colSpan: 3, styles: { fontStyle: "bold", halign: "center" } },
      { content: totalAmount.toFixed(2), styles: { fontStyle: "bold", halign: "right" } },
      "", "", "", "", "", ""
    ]);
    doc.autoTable({
      head: [["Sl No", "Bill No", "Customer", "Amount", "Date", "Type", "Mode", "Salesman", "Route"]],
      body: tableRows, startY: 40, theme: "grid",
      styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak", valign: "middle" },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold", halign: "center" },
      columnStyles: {
        0: { cellWidth: 8,  halign: "center" }, 1: { cellWidth: 20, halign: "center" },
        2: { cellWidth: 40 },                   3: { cellWidth: 15, halign: "right" },
        4: { cellWidth: 15, halign: "center" }, 5: { cellWidth: 12, halign: "center" },
        6: { cellWidth: 12, halign: "center" }, 7: { cellWidth: 25 }, 8: { cellWidth: 20 },
      },
      margin: { top: 40 },
      didDrawPage: (data) => {
        doc.setFontSize(10); doc.setTextColor(150);
        doc.text(`Page ${data.pageNumber}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, { align: "right" });
      },
    });
    doc.save(`SaleReport_${fromDate}_to_${toDate}.pdf`);
  };

  const exportBillDetailsToPDF = useCallback(async () => {
    if (!Billdetails?.length) { alert("No bill details to export."); return; }
    try {
      const storedCompany = sessionStorage.getItem("companyResponse");
      const companyLocal  = storedCompany ? JSON.parse(storedCompany) : null;
      const fmt           = (v) => `₹${(parseFloat(v) || 0).toFixed(2)}`;

      const firstBill    = Billdetails[0] || {};

      // FIX: Safe bill number calculation — avoids showing just InvSeries when bill numbers are 0
      const billNumber = `${firstBill.InvSeries || ''}${
        firstBill.RetailBillNo && firstBill.RetailBillNo !== 0
          ? firstBill.RetailBillNo
          : firstBill.BillNo && firstBill.BillNo !== 0
            ? firstBill.BillNo
            : ''
      }`;

      const totalitemAmt = Billdetails.reduce((s, i) => s + (parseFloat(i.Amount)    || 0), 0);
      const billDiscount = firstBill.DiscountRs || 0;
      const grandTotal   = totalitemAmt - billDiscount;
      const totalQty     = Billdetails.reduce((s, i) => s + (parseInt(i.Quantity)    || 0), 0);
      const totalTaxAmt  = Billdetails.reduce((s, i) => s + (parseFloat(i.TaxAmount) || 0), 0);
      const totalNetRate = Billdetails.reduce((s, i) => s + (parseFloat(i.NetRate)   || 0), 0);
      // CHANGED: totals for new columns
      const totalRateAfterDiscount   = Billdetails.reduce((s, i) => s + (parseFloat(i.RateAfterDiscount)   || 0), 0);
      const totalAmountAfterDiscount = Billdetails.reduce((s, i) => s + (parseFloat(i.AmountAfterDiscount) || 0), 0);

      const rowsPerPagePDF = 15;
      const totalPages     = Math.ceil(Billdetails.length / rowsPerPagePDF);

      const rawUpi  = bankData?.UPIid || bankData?.UpiId || bankData?.upiId || bankData?.upiid || bankData?.UPIID || bankData?.Upiid || null;
      const upiId   = sanitizeUpiId(rawUpi);
      let qrBase64  = qrImageData;

      if (!qrBase64 && upiId) {
        try {
          await loadQRLib();
          const upiString = buildUPIString(upiId);
          if (upiString) {
            qrBase64 = await new Promise((resolve) => {
              const tmp = document.createElement('div');
              tmp.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
              document.body.appendChild(tmp);
              // eslint-disable-next-line no-new
              new window.QRCode(tmp, {
                text: upiString, width: 160, height: 160,
                colorDark: '#000000', colorLight: '#ffffff',
                correctLevel: window.QRCode.CorrectLevel.H,
              });
              setTimeout(() => {
                const canvas = tmp.querySelector('canvas');
                resolve(canvas ? canvas.toDataURL('image/png') : null);
                document.body.removeChild(tmp);
              }, 250);
            });
          }
        } catch (e) { console.warn("QR fallback failed:", e); qrBase64 = null; }
      }

      const pdf       = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();
        const startIndex = page * rowsPerPagePDF;
        const endIndex   = Math.min(startIndex + rowsPerPagePDF, Billdetails.length);
        const pageData   = Billdetails.slice(startIndex, endIndex);

        const tmpDiv = document.createElement("div");
        tmpDiv.style.cssText = "position:absolute;left:-9999px;width:794px;background:#fff;padding:20px;box-sizing:border-box;font-family:'Segoe UI',Arial,sans-serif;";
        document.body.appendChild(tmpDiv);

        tmpDiv.innerHTML = `<div style="width:100%;background:#fff;color:#333;">${page === 0 ? `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:15px;border-bottom:2px solid #e0e0e0;">
            <div style="flex:1;">
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#2c3e50;">${companyLocal?.CompanyName || 'Company Name'}</h1>
              <p style="margin:6px 0 0;font-size:12px;color:#666;line-height:1.4;">
                ${companyLocal?.Address || ''}
                ${companyLocal?.MobileNO ? `| Phone: ${companyLocal.MobileNO}` : ''}
                ${companyLocal?.GSTinNo  ? `| GST: ${companyLocal.GSTinNo}`    : ''}
              </p>
            </div>
            <div style="flex:1;text-align:right;">
              <h2 style="margin:0;font-size:18px;font-weight:700;color:#2c3e50;">BILL DETAILS REPORT</h2>
              <p style="margin:4px 0 0;font-size:11px;color:#666;">Generated: ${new Date().toLocaleString()}</p>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;">
            <div style="border:1px solid #e0e0e0;border-radius:6px;padding:8px;background:#f8f9fa;">
              <p style="margin:0;font-size:11px;font-weight:600;color:#666;">BILL NUMBER</p>
              <p style="margin:4px 0 0;font-size:12px;font-weight:700;color:#3498db;">${billNumber || 'N/A'}</p>
            </div>
            <div style="border:1px solid #e0e0e0;border-radius:6px;padding:8px;background:#f8f9fa;">
              <p style="margin:0;font-size:11px;font-weight:600;color:#666;">BILL DATE</p>
              <p style="margin:4px 0 0;font-size:12px;font-weight:700;color:#2ecc71;">${firstBill.BillDate ? new Date(firstBill.BillDate).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div style="border:1px solid #e0e0e0;border-radius:6px;padding:8px;background:#f8f9fa;">
              <p style="margin:0;font-size:11px;font-weight:600;color:#666;">BILL MODE</p>
              <p style="margin:4px 0 0;font-size:12px;font-weight:700;color:${firstBill.BillMode === 1 ? '#e67e22' : '#9b59b6'};">${firstBill.BillModeText || 'N/A'}</p>
            </div>
            <div style="border:1px solid #e0e0e0;border-radius:6px;padding:8px;background:#f8f9fa;">
              <p style="margin:0;font-size:11px;font-weight:600;color:#666;">TYPE</p>
              <p style="margin:4px 0 0;font-size:12px;font-weight:700;color:#27ae60;">${firstBill.WholeSaleRetail || 'N/A'}</p>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:15px;">
            <div style="border:1px solid #e0e0e0;border-radius:6px;padding:8px 10px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
              <h4 style="margin:0 0 6px;font-size:12px;font-weight:700;color:#2c3e50;border-bottom:1px solid #3498db;padding-bottom:3px;">CUSTOMER DETAILS</h4>
              <div style="font-size:10px;line-height:1.3;">
                <p style="margin:4px 0;"><strong style="color:#666;">Name:</strong>    ${firstBill.CustomerName || 'N/A'}</p>
                <p style="margin:4px 0;"><strong style="color:#666;">Address:</strong> ${firstBill.CumAddress   || 'N/A'}</p>
                <p style="margin:4px 0;"><strong style="color:#666;">Phone:</strong>   ${firstBill.CumContact   || 'N/A'}</p>
              </div>
            </div>
            <div style="border:1px solid #e0e0e0;border-radius:6px;padding:8px 10px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
              <h4 style="margin:0 0 6px;font-size:12px;font-weight:700;color:#2c3e50;border-bottom:1px solid #3498db;padding-bottom:3px;">BILL INFORMATION</h4>
              <div style="font-size:10px;line-height:1.3;">
                <p style="margin:4px 0;"><strong style="color:#666;">Created By:</strong> ${firstBill.CreatedByName || 'N/A'}</p>
                <p style="margin:4px 0;"><strong style="color:#666;">Salesman:</strong>   ${firstBill.SalesmanName  || 'N/A'}</p>
              </div>
            </div>
          </div>
          ` : `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;padding-bottom:10px;border-bottom:1px solid #e0e0e0;">
            <div>
              <h3 style="margin:0;font-size:16px;font-weight:700;color:#2c3e50;">${companyLocal?.CompanyName || 'Company Name'}</h3>
              <p style="margin:2px 0 0;font-size:10px;color:#666;">Bill: ${billNumber} | Page ${page + 1} of ${totalPages}</p>
            </div>
            <p style="margin:0;font-size:10px;color:#666;">Continued...</p>
          </div>`}

          <div style="margin-bottom:20px;">
            ${page === 0 ? `<h4 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#2c3e50;border-bottom:2px solid #3498db;padding-bottom:5px;">BILL ITEMS</h4>` : ''}
            <table style="width:100%;border-collapse:collapse;font-size:9px;border:1px solid #e0e0e0;background:#fff;">
              <thead>
                <tr style="background:linear-gradient(135deg,#3498db,#2980b9);color:white;">
                  <th style="border:1px solid #ccc;padding:6px;text-align:center;width:4%;">#</th>
                  <th style="border:1px solid #ccc;padding:6px;text-align:center;width:7%;">HSN Code</th>
                  <th style="border:1px solid #ccc;padding:6px;width:20%;">Item Name</th>
                  <th style="border:1px solid #ccc;padding:6px;text-align:center;width:5%;">Qty</th>
                  <th style="border:1px solid #ccc;padding:6px;text-align:right;width:6%;">MRP</th>
                  <th style="border:1px solid #ccc;padding:6px;text-align:right;width:6%;">Price</th>
                  <th style="border:1px solid #ccc;padding:6px;text-align:right;width:6%;">Dis%</th>
                  <th style="border:1px solid #ccc;padding:6px;text-align:right;width:7%;">Rate</th>
                  <th style="border:1px solid #ccc;padding:6px;text-align:right;width:8%;">Amount</th>
                  <th style="border:1px solid #ccc;padding:6px;text-align:right;width:6%;">Tax%</th>
                  <th style="border:1px solid #ccc;padding:6px;text-align:right;width:7%;">Tax Amt</th>
                  <th style="border:1px solid #ccc;padding:6px;text-align:right;width:8%;">Net Amt</th>
                </tr>
              </thead>
              <tbody>
                ${pageData.map((item, idx) => `
                  <tr style="${idx % 2 === 0 ? 'background:#f8f9fa;' : 'background:#fff;'}">
                    <td style="border:1px solid #e0e0e0;padding:6px;text-align:center;">${startIndex + idx + 1}</td>
                    <td style="border:1px solid #e0e0e0;padding:6px;text-align:center;">${item.HSNCode || 'N/A'}</td>
                    <td style="border:1px solid #e0e0e0;padding:6px;">${item.ItemName || 'N/A'}</td>
                    <td style="border:1px solid #e0e0e0;padding:6px;text-align:center;">${item.Quantity || 0}</td>
                    <td style="border:1px solid #e0e0e0;padding:6px;text-align:right;">${fmt(item.MRP)}</td>
                    <td style="border:1px solid #e0e0e0;padding:6px;text-align:right;">${fmt(item.Price)}</td>
                    <td style="border:1px solid #e0e0e0;padding:6px;text-align:right;">${(parseFloat(item.DiscountPer) || 0).toFixed(2)}%</td>
                    <td style="border:1px solid #e0e0e0;padding:6px;text-align:right;">${fmt(item.RateAfterDiscount)}</td>
                    <td style="border:1px solid #e0e0e0;padding:6px;text-align:right;">${fmt(item.AmountAfterDiscount)}</td>
                    <td style="border:1px solid #e0e0e0;padding:6px;text-align:right;">${fmt(item.TaxPercentage)}</td>
                    <td style="border:1px solid #e0e0e0;padding:6px;text-align:right;">${fmt(item.TaxAmount)}</td>
                    <td style="border:1px solid #e0e0e0;padding:6px;text-align:right;font-weight:700;color:#27ae60;">${fmt(item.Amount)}</td>
                  </tr>
                `).join('')}
              </tbody>
              ${page === totalPages - 1 ? `
              <tfoot>
                <tr style="background:linear-gradient(135deg,#2c3e50,#34495e);color:white;">
                  <td colspan="7" style="border:1px solid #34495e;padding:8px;text-align:right;font-weight:700;">TOTALS:</td>
                  <td style="border:1px solid #34495e;padding:8px;text-align:right;font-weight:700;">${fmt(totalRateAfterDiscount)}</td>
                  <td style="border:1px solid #34495e;padding:8px;text-align:right;font-weight:700;">${fmt(totalAmountAfterDiscount)}</td>
                  <td style="border:1px solid #34495e;padding:8px;text-align:right;font-weight:700;"></td>
                  <td style="border:1px solid #34495e;padding:8px;text-align:right;font-weight:700;">${fmt(totalTaxAmt)}</td>
                  <td style="border:1px solid #34495e;padding:8px;text-align:right;font-weight:700;">${fmt(totalitemAmt)}</td>
                </tr>
                ${billDiscount > 0 ? `
                <tr style="background:linear-gradient(135deg,#f39c12,#e67e22);color:white;">
                  <td colspan="11" style="padding:8px;text-align:right;font-weight:700;">DISCOUNT:</td>
                  <td style="padding:8px;text-align:right;font-weight:700;">${fmt(billDiscount)}</td>
                </tr>` : ''}
                <tr style="background:linear-gradient(135deg,#27ae60,#2ecc71);color:white;">
                  <td colspan="11" style="padding:8px;text-align:right;font-weight:700;">GRAND TOTAL:</td>
                  <td style="padding:8px;text-align:right;font-weight:700;">${fmt(grandTotal)}</td>
                </tr>
              </tfoot>` : ''}
            </table>
          </div>

          ${page === totalPages - 1 ? `
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:25px;">
            <div style="border-radius:8px;padding:12px;background:linear-gradient(135deg,#74b9ff,#0984e3);color:white;text-align:center;">
              <strong style="font-size:11px;display:block;margin-bottom:5px;">TOTAL ITEMS</strong>
              <span style="font-size:16px;font-weight:700;">${Billdetails.length}</span>
            </div>
            <div style="border-radius:8px;padding:12px;background:linear-gradient(135deg,#55efc4,#00b894);color:white;text-align:center;">
              <strong style="font-size:11px;display:block;margin-bottom:5px;">TOTAL QUANTITY</strong>
              <span style="font-size:16px;font-weight:700;">${totalQty}</span>
            </div>
            <div style="border-radius:8px;padding:12px;background:linear-gradient(135deg,#a29bfe,#6c5ce7);color:white;text-align:center;">
              <strong style="font-size:11px;display:block;margin-bottom:5px;">GRAND TOTAL</strong>
              <span style="font-size:16px;font-weight:700;">${fmt(grandTotal)}</span>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;margin-top:30px;padding-top:20px;border-top:2px solid #e0e0e0;">
            <div style="text-align:center;width:30%;"><div style="height:50px;border-bottom:2px solid #000;margin-bottom:8px;"></div><p style="margin:0;font-size:11px;font-weight:600;color:#666;">Customer Signature</p></div>
            <div style="text-align:center;width:30%;"><div style="height:50px;border-bottom:2px solid #000;margin-bottom:8px;"></div><p style="margin:0;font-size:11px;font-weight:600;color:#666;">Sales Executive</p></div>
            <div style="text-align:center;width:30%;"><div style="height:50px;border-bottom:2px solid #000;margin-bottom:8px;"></div><p style="margin:0;font-size:11px;font-weight:600;color:#666;">Authorized Signatory</p></div>
          </div>

          ${bankData ? `
          <div style="margin-top:15px;padding:15px;border:1px solid #e0e0e0;border-radius:8px;background:#f8f9fa;display:flex;justify-content:flex-start;align-items:flex-start;gap:20px;">
            ${qrBase64 ? `
            <div style="text-align:center;flex-shrink:0;">
              <div style="background:#fff;padding:8px;border-radius:8px;border:1px solid #dee2e6;box-shadow:0 2px 10px rgba(0,0,0,0.08);">
                <img src="${qrBase64}" width="130" height="130" style="display:block;" alt="UPI QR"/>
              </div>
              <div style="font-size:8px;color:#666;margin-top:5px;font-weight:600;">Scan to Pay</div>
              <div style="font-size:7px;color:#999;margin-top:2px;">${upiId}</div>
            </div>` : ''}
            <div style="flex:1;">
              <h5 style="margin:0 0 10px;font-size:12px;font-weight:700;color:#2c3e50;border-bottom:1px solid #3498db;padding-bottom:5px;">BANK DETAILS</h5>
              <div style="font-size:10px;line-height:1.8;">
                <p style="margin:4px 0;"><strong style="color:#666;">Bank Name:</strong>  ${bankData.BankName || 'N/A'}</p>
                <p style="margin:4px 0;"><strong style="color:#666;">Branch:</strong>     ${bankData.Branch   || 'N/A'}</p>
                <p style="margin:4px 0;"><strong style="color:#666;">Account No:</strong> ${bankData.AccNo    || 'N/A'}</p>
                ${bankData.IFSC ? `<p style="margin:4px 0;"><strong style="color:#666;">IFSC:</strong> ${bankData.IFSC}</p>` : ''}
                ${upiId ? `<p style="margin:4px 0;"><strong style="color:#666;">UPI ID:</strong> ${upiId}</p>` : ''}
              </div>
            </div>
          </div>` : ''}

          <div style="margin-top:10px;font-size:10px;text-align:center;color:#999;background:#f8f9fa;padding:10px;border-radius:6px;">
            Generated on ${new Date().toLocaleString()} | Bill: ${billNumber} | Customer: ${firstBill.CustomerName || 'N/A'} | Total Items: ${Billdetails.length}
          </div>
          ` : `
          <div style="margin-top:20px;padding-top:10px;border-top:1px solid #eee;font-size:9px;text-align:center;color:#999;">
            Page ${page + 1} of ${totalPages} | Bill: ${billNumber} | Continued on next page...
          </div>`}

        </div>`;

        const canvas  = await html2canvas(tmpDiv, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
        const imgData = canvas.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", 0, 0, pageWidth, (canvas.height * pageWidth) / canvas.width);
        tmpDiv.remove();
      }

      const existing = document.getElementById("exportModal");
      if (existing) existing.remove();
      const modal = document.createElement("div");
      modal.id = "exportModal";
      modal.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;";
      modal.innerHTML = `<div style="background:white;padding:20px;border-radius:8px;text-align:center;"><h4 style="margin-bottom:15px;">Export As?</h4><button id="printBtn" style="margin-right:10px;padding:6px 18px;">Print</button><button id="downloadBtn" style="padding:6px 18px;">Download</button></div>`;
      document.body.appendChild(modal);
      document.getElementById("printBtn").onclick = () => {
        modal.remove();
        const blobUrl = URL.createObjectURL(pdf.output("blob"));
        const iframe  = document.createElement("iframe");
        iframe.style.cssText = "position:fixed;right:-9999px;";
        iframe.src = blobUrl;
        document.body.appendChild(iframe);
        iframe.onload = () => { iframe.contentWindow.focus(); iframe.contentWindow.print(); };
      };
      document.getElementById("downloadBtn").onclick = () => {
        modal.remove();
        pdf.save(`Bill_${billNumber || "Report"}.pdf`);
      };

    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF");
    }
  }, [Billdetails, bankData, qrImageData, companyData]);

  const handleClear = () => {
    setFromDate(getPreviousDate(7)); setToDate(getCurrentDate()); setType("All");
    setSalesman(""); setCustomer(""); setError(""); setCreatedBy("");
    setBranch(""); setSearchQuery(""); setSelectedSalesmen([]);
  };

  const handleSubmit = (e) => { e.preventDefault(); fetchSaleReport(); };

  const customerOptions  = [{ value: '', label: 'All Customers' }, ...distinctCustomers.map(n => ({ value: n, label: n }))];
  const branchOptions    = [{ value: '', label: 'All Branches'  }, ...distinctBranches.map(b  => ({ value: b, label: b }))];
  const createdByOptions = [{ value: '', label: 'All Users'     }, ...distinctCreatedBy.map(({ id, name }) => ({ value: id, label: name }))];

  const handleClickOutside = (e) => { if (inputRef.current && !inputRef.current.contains(e.target)) {} };
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const billDiscount    = Billdetails[0]?.DiscountRs || 0;
  const totalitemAmount = Billdetails.reduce((s, i) => s + (i.Amount || 0), 0);

  const customStyles = {
    table:     { style: { border: "1px solid #dee2e6", borderRadius: "8px" } },
    headCells: { style: { fontSize: "13px", fontWeight: "bold", padding: "10px", backgroundColor: "#f1f3f5", color: "#343a40", borderBottom: "1px solid #dee2e6" } },
    rows:      { style: { fontSize: "13px", minHeight: "48px", borderBottom: "1px solid #e9ecef" } },
    cells:     { style: { padding: "10px 12px" } },
  };

  const conditionalRowStyles = [
    { when: row => row.Status === 2,      style: { backgroundColor: '#ffe5e5' } },
    { when: row => row.IsDuplicate === 1, style: { backgroundColor: '#f0e9cb' } },
  ];

  const columns = [
    { name: "SL.No",      selector: (_, i) => i + 1,                                                                          sortable: false, width: "6%"  },
    { name: "Bill No",    selector: row => `${row.InvSeries || ''}${row.RetailBillNo || ''}${row.WholesaleNo || ''}`,          sortable: true,  width: "16%" },
    { name: "Bill Date",  selector: row => row.BillDate ? new Date(row.BillDate).toLocaleDateString() : "N/A",                sortable: true,  width: "10%" },
    { name: "Customer",   selector: row => row.CustomerName || "N/A",                                                         sortable: true,  width: "18%" },
    { name: "Amount",     selector: row => row.BillAmount ? parseFloat(row.BillAmount).toFixed(2) : "0.00",                   sortable: true,  width: "10%" },
    { name: "Type",       selector: row => row.RetailBillNo?.toString().endsWith("00") ? "Wholesale" : row.SaleType || "N/A", sortable: true,  width: "10%" },
    { name: "Pay Mode",   selector: row => row.BillModeText || "N/A",                                                         sortable: true,  width: "9%"  },
    { name: "Salesman",   selector: row => row.Salesman || "N/A",                                                             sortable: true,  width: "12%" },
    { name: "Created By", selector: row => row.CreatedBy || "N/A",                                                            sortable: true,  width: "11%" },
  ];

  const CustomFooter = ({ rowsPerPage, rowCount, currentPage, onChangePage, onChangeRowsPerPage }) => {
    const totalPages = Math.ceil(rowCount / rowsPerPage);
    const liveTotal  = filteredResults.reduce((s, i) => s + (i.BillAmount || 0), 0);
    return (
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-3 bg-light">
        <div className="fw-semibold text-dark mb-2 mb-md-0">Total Amount: {formatAmount(liveTotal)}</div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <label className="me-2">Rows per page:</label>
          <select value={rowsPerPage} onChange={e => onChangeRowsPerPage(Number(e.target.value))} className="form-select form-select-sm w-auto">
            <option value={500}>500</option>
            <option value={1000}>1000</option>
            <option value={10000}>10000</option>
          </select>
          <span className="mx-2">Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
          <div className="btn-group btn-group-sm">
            <button className="btn btn-outline-secondary" onClick={() => onChangePage(1)}               disabled={currentPage === 1}>⏮</button>
            <button className="btn btn-outline-secondary" onClick={() => onChangePage(currentPage - 1)} disabled={currentPage === 1}>◀</button>
            <button className="btn btn-outline-secondary" onClick={() => onChangePage(currentPage + 1)} disabled={currentPage === totalPages}>▶</button>
            <button className="btn btn-outline-secondary" onClick={() => onChangePage(totalPages)}      disabled={currentPage === totalPages}>⏭</button>
          </div>
        </div>
      </div>
    );
  };

  const paginatedResults = useMemo(
    () => filteredResults.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage),
    [filteredResults, currentPage, rowsPerPage]
  );

  return (
    <div className="container-fluid">

      <div className="card shadow-sm mb-3 p-3">
        <h4>Sale Report</h4>
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
          <div className="w-100 w-md-50">
            <div className="input-group">
              <span className="input-group-text bg-primary text-white"><FaSearch /></span>
              <input type="text" className="form-control" placeholder="Search bills by customer, number, amount..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div className="d-flex flex-wrap justify-content-end gap-2 w-100 w-md-auto">
            <button type="button" className="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#filterModal">
              <FaFilter className="me-1" /> Filters
            </button>
            <div className="btn-group">
              <button className="btn btn-outline" onClick={exportToExcel}><FaFileExcel className="me-1" /> Excel</button>
              <button className="btn btn-outline" onClick={exportToPDF}><FaPrint className="me-1" /> PDF</button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="filterModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header bg-light">
              <h5 className="modal-title text-primary"><FaFilter className="me-2" />Sales Report Filters</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="row mb-3 g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-muted">FROM DATE</label>
                    <input type="date" className="form-control" value={fromDate} onChange={e => setFromDate(e.target.value)} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-muted">TO DATE</label>
                    <input type="date" className="form-control" value={toDate} onChange={e => setToDate(e.target.value)} required />
                  </div>
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-muted">SALE TYPE</label>
                      <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
                        <option value="All">All Types</option>
                        <option value="Retail">Retail</option>
                        <option value="WholeSale">Wholesale</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-muted">SALES REP</label>
                      <div className="dropdown">
                        <button className="btn btn-outline-secondary dropdown-toggle w-100 text-start" type="button" data-bs-toggle="dropdown" disabled={isLoading}>
                          {isLoading ? "Loading..." : selectedSalesmen.length > 0 ? `${selectedSalesmen.length} selected` : "All Salesmen"}
                        </button>
                        <ul className="dropdown-menu w-100 p-2" style={{ maxHeight: "250px", overflowY: "auto" }}>
                          {isLoading ? <li className="dropdown-item text-muted">Loading...</li> : distinctSalesmen.length > 0 ? (
                            <>
                              <li className="dropdown-item px-2 py-1">
                                <div className="form-check m-0">
                                  <input type="checkbox" id="selectAll" className="form-check-input"
                                    checked={selectedSalesmen.length === distinctSalesmen.length}
                                    onChange={e => setSelectedSalesmen(e.target.checked ? distinctSalesmen : [])} />
                                  <label htmlFor="selectAll" className="form-check-label ms-2">Select All</label>
                                </div>
                              </li>
                              {distinctSalesmen.map(s => {
                                const checked = selectedSalesmen.some(sel => sel.id === s.id);
                                return (
                                  <li key={s.id} className="dropdown-item px-2 py-1">
                                    <div className="form-check m-0">
                                      <input type="checkbox" id={`sm-${s.id}`} className="form-check-input" checked={checked}
                                        onChange={() => setSelectedSalesmen(prev => checked ? prev.filter(sel => sel.id !== s.id) : [...prev, s])} />
                                      <label htmlFor={`sm-${s.id}`} className="form-check-label ms-2">{s.name}</label>
                                    </div>
                                  </li>
                                );
                              })}
                            </>
                          ) : <li className="dropdown-item text-muted">No salesmen available</li>}
                        </ul>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-muted">ROUTE</label>
                      <Select value={root ? { value: root, label: root } : null} onChange={s => setRoot(s ? s.value : "")}
                        options={[{ value: "", label: "All Routes" }, ...distinctRoots.map(r => ({ value: r, label: r }))]}
                        isClearable placeholder="Select Route" className="basic-single" classNamePrefix="select" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-muted">CREATED BY</label>
                      <Select value={createdByOptions.find(o => o.value === createdBy)} onChange={s => setCreatedBy(s ? s.value : '')}
                        options={createdByOptions} isClearable placeholder="Select User" className="basic-single" classNamePrefix="select" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-muted">CUSTOMER</label>
                      <Select value={customerOptions.find(o => o.value === customer)} onChange={s => setCustomer(s?.value || '')}
                        options={customerOptions} className="basic-single" classNamePrefix="select" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-muted">BRANCH</label>
                      <Select value={branchOptions.find(o => o.value === branch)} onChange={s => setBranch(s ? s.value : '')}
                        options={branchOptions} isClearable placeholder="Select Branch" className="basic-single" classNamePrefix="select" />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer bg-light">
              <div className="d-flex justify-content-between w-100">
                <button type="button" className="btn btn-link text-danger" onClick={handleClear} disabled={isLoading}>Clear All</button>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                  <button type="submit" className="btn btn-primary" data-bs-dismiss="modal" onClick={handleSubmit}>Apply Filters</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow border-0 rounded mb-4" style={{ height: "calc(100vh - 230px)", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <DataTable
            columns={columns}
            progressPending={isLoading}
            highlightOnHover
            striped
            pagination={false}
            data={paginatedResults}
            onRowClicked={row => handleRowClick(row.BillID)}
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
        <div className="border-top bg-light shadow-sm" style={{ position: "sticky", bottom: 0, zIndex: 1000 }}>
          <CustomFooter
            rowsPerPage={rowsPerPage}
            rowCount={filteredResults.length}
            currentPage={currentPage}
            onChangePage={p => setCurrentPage(p)}
            onChangeRowsPerPage={c => { setRowsPerPage(c); setCurrentPage(1); }}
          />
        </div>
      </div>

      {isModalOpen && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.5)", overflow: "auto" }}>
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content shadow-lg rounded">

              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">Bill Details</h5>
                <button type="button" className="close btn btn-danger rounded-circle p-2" onClick={handleCloseModal}>
                  <span>&times;</span>
                </button>
              </div>

              <div className="modal-body p-4" id="modal-print-content">
                <div className="container-fluid">

                  <div className="row align-items-center mb-4 border-bottom pb-3">
                    <div className="col-md-6">
                      {[...new Map(Billdetails.map(o => [`${o.InvSeries}${
                        o.RetailBillNo && o.RetailBillNo !== 0 ? o.RetailBillNo : o.BillNo && o.BillNo !== 0 ? o.BillNo : ''
                      }`, o])).values()].map((item, i) => (
                        <div key={i}>
                          <h2 className="fw-bold">
                            <small className="text-muted">{`${item.InvSeries || ''}${
                              item.RetailBillNo && item.RetailBillNo !== 0
                                ? item.RetailBillNo
                                : item.BillNo && item.BillNo !== 0
                                  ? item.BillNo
                                  : ''
                            }`}</small>
                          </h2>
                        </div>
                      ))}
                    </div>
                    <div className="col-md-6 text-end">
                      {companyData ? (
                        <ul className="list-unstyled mb-0">
                          <li><strong>{companyData.CompanyName}</strong></li>
                          <li style={{ fontSize: "12px" }}>{companyData.Address}</li>
                          <li style={{ fontSize: "12px" }}>{companyData.GSTinNo}</li>
                          <li style={{ fontSize: "12px" }}>{companyData.MobileNO}</li>
                        </ul>
                      ) : <p>Loading company details...</p>}
                    </div>
                  </div>

                  <div className="row g-3 d-flex flex-wrap">
                    {[...new Map(Billdetails.map(c => [`${c.CustomerName}-${c.CumAddress}-${c.CumContact}`, c])).values()].map((c, i) => (
                      <div key={i} className="col-md-6">
                        <div className="card shadow-sm p-3 h-100">
                          <h5 className="fw-bold">Customer Details</h5>
                          <ul className="list-unstyled">
                            <li><strong>Name:</strong>    {c.CustomerName}</li>
                            <li><strong>Address:</strong> {c.CumAddress}</li>
                            <li><strong>Phone:</strong>   {c.CumContact}</li>
                          </ul>
                        </div>
                      </div>
                    ))}
                    {[...new Map(Billdetails.map(c => [`${c.CustomerName}-${c.CumAddress}-${c.CumContact}`, c])).values()].map((c, i) => (
                      <div key={i} className="col-md-6">
                        <div className="card shadow-sm p-3 h-100">
                          <h5 className="fw-bold">Bill Details</h5>
                          <ul className="list-unstyled">
                            <li><strong>Salesman:</strong>  {c.SalesmanName}</li>
                            <li><strong>BilledBy:</strong>  {c.CreatedByName}</li>
                            <li><strong>Mode:</strong>      {c.BillModeText}</li>
                            <li><strong>Type:</strong>      {c.WholeSaleRetail}</li>
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="card shadow-sm p-3 mt-4">
                    <h5 className="fw-bold">Items Summary</h5>
                    <div style={{ maxHeight: "400px", overflowY: "auto", position: "relative" }}>
                      <table className="table table-bordered text-center mb-0" style={{ fontSize: "10px" }}>
                        <thead className="table-light sticky-top" style={{ top: 0, zIndex: 1 }}>
                          <tr>
                            <th>No.</th>
                            <th>HSN Code</th>
                            <th>Item Name</th>
                            <th>MRP</th>
                            <th>Qty</th>
                            <th>Price</th>
                            {/* CHANGED: replaced Discount col with Dis% */}
                            <th>Dis%</th>
                            {/* CHANGED: Rate now shows RateAfterDiscount */}
                            <th>Rate</th>
                            {/* CHANGED: Amount now shows AmountAfterDiscount */}
                            <th>Amount</th>
                            <th>Tax%</th>
                            <th>Tax Amt</th>
                            <th>Net Amt</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Billdetails.length > 0 ? Billdetails.map((item, i) => (
                            <tr key={i}>
                              <td>{i + 1}</td>
                              <td>{item.HSNCode || "N/A"}</td>
                              <td>{item.ItemName}</td>
                              <td>{formatAmount(item.MRP)}</td>
                              <td>{item.Quantity}</td>
                              {/* Price = base rate without GST, directly from SP */}
                              <td>{formatAmount(item.Price)}</td>
                              {/* CHANGED: Dis% from DiscountPer */}
                              <td>{(parseFloat(item.DiscountPer) || 0).toFixed(2)}%</td>
                              {/* CHANGED: Rate = RateAfterDiscount */}
                              <td>{formatAmount(item.RateAfterDiscount)}</td>
                              {/* CHANGED: Amount = AmountAfterDiscount */}
                              <td>{formatAmount(item.AmountAfterDiscount)}</td>
                              <td>{formatAmount(item.TaxPercentage)}</td>
                              <td>{formatAmount(item.TaxAmount)}</td>
                              {/* Net Amt = final Amount including tax */}
                              <td>{formatAmount(item.Amount)}</td>
                            </tr>
                          )) : (
                            <tr><td colSpan="12" className="text-center">No details available</td></tr>
                          )}
                        </tbody>
                        <tfoot className="bg-dark text-white sticky-bottom" style={{ bottom: 0, zIndex: 1 }}>
                          <tr>
                            <th colSpan="7" className="text-end">Total:</th>
                            {/* CHANGED: totals for RateAfterDiscount and AmountAfterDiscount */}
                            <th>{formatAmount(Billdetails.reduce((s, i) => s + (parseFloat(i.RateAfterDiscount) || 0), 0))}</th>
                            <th>{formatAmount(Billdetails.reduce((s, i) => s + (parseFloat(i.AmountAfterDiscount) || 0), 0))}</th>
                            <th></th>
                            <th>{formatAmount(Billdetails.reduce((s, i) => s + (i.TaxAmount || 0), 0))}</th>
                            <th>{formatAmount(totalitemAmount)}</th>
                          </tr>
                          {billDiscount > 0 && (
                            <>
                              <tr className="text-dark bg-light">
                                <th colSpan="11" className="text-end">Discount:</th>
                                <th>{formatAmount(billDiscount)}</th>
                              </tr>
                              <tr className="fw-bold bg-warning text-dark">
                                <th colSpan="11" className="text-end">Total Bill Amount:</th>
                                <th>{formatAmount(totalitemAmount - billDiscount)}</th>
                              </tr>
                            </>
                          )}
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  <div className="row g-3 mt-2">
                    <div className="col-md-4">
                      <div className="card shadow-sm p-3 h-100 d-flex flex-column">
                        <h5 className="fw-bold">Notes</h5>
                        <p className="flex-grow-1 mb-0">Payment is requested within 15 days of receiving this invoice.</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-success" onClick={exportBillDetailsToPDF}>
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

export default SaleReport;