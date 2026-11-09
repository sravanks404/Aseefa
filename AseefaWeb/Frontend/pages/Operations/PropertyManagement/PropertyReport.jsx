import React, { useEffect, useMemo, useState } from "react";
import api from "../../apiService";
import moment from "moment";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Chart from "react-apexcharts";

// Arabic mappings to matches sheet headers in the photo
const ARABIC_HEADERS = {
  propertyName: "Property Name",
  flatNo: "Flat No",
  tenantName: "Tenant Name",
  unitType: "Unit Type",
  rentalAmount: "Rental Amount",
  chequeAmount: "Cheque Amount",
  chequeDate: "Cheque Date",
  remarks: "Remarks"
};

const PropertyReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [unitTypeFilter, setUnitTypeFilter] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [reportType, setReportType] = useState("all_reports");

  // Session
  const getCompanyID = () => {
    return Number(sessionStorage.getItem("CompanyID")) || 0;
  };

  const getUserID = () => {
    return Number(sessionStorage.getItem("UserId")) || 0;
  };

  const PropertyList = async () => {
    const companyID = getCompanyID();

    if (!companyID) {
      setError("CompanyID not found. Please login again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/getPropertyReport", {
        params: {
          CompanyID: companyID,
        },
      });

      if (response.data?.success) {
        setData(response.data.data || []);
      } else {
        setError(response.data?.message || "Failed to fetch report data.");
      }
    } catch (err) {
      console.error("Fetch report data error:", err);
      setError(err?.response?.data?.message || "Failed to load report data.");
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
    PropertyList();
  }, []);

  // Calculate dynamic cheques schedule for a property rental
  const calculateCheques = (row) => {
    const cheques = [];
    const numCheques = parseInt(row.NumberOfCheques) || 0;
    const start = row.LeaseStartDate;
    // Fallback to monthly rent * 12 if annual rent is empty
    const totalRent = parseFloat(row.AnnualRent) || (parseFloat(row.MonthlyRent) * 12) || 0;

    if (numCheques <= 0 || !start || totalRent <= 0) {
      return cheques;
    }

    const amt = totalRent / numCheques;
    // Standard spacing: 12 months divided by number of cheques
    const intervalMonths = 12 / numCheques;

    for (let i = 0; i < numCheques; i++) {
      const dateObj = moment(start).add(Math.round(i * intervalMonths), "months");
      cheques.push({
        amount: amt,
        date: dateObj.format("DD.MM.YYYY"),
        remarks: ""
      });
    }
    return cheques;
  };

  // Process data with cheque calculations
  const processedRows = useMemo(() => {
    return data.map((row) => ({
      ...row,
      calculatedCheques: calculateCheques(row),
    }));
  }, [data]);

  // Determine maximum number of cheques across all rows for header columns
  const maxChequesCount = useMemo(() => {
    const counts = processedRows.map((r) => r.calculatedCheques.length);
    const maxVal = Math.max(...counts, 5); // default minimum of 5 columns
    return maxVal;
  }, [processedRows]);

  // Filters
  const filteredRows = useMemo(() => {
    return processedRows.filter((row) => {
      const term = searchTerm.toLowerCase().trim();
      const normalizedTerm = term.replace(/[\s-]/g, ""); // Remove spaces and dashes

      // Match only visible columns to avoid unexpected search results
      const matchesSearch = (() => {
        if (!term) return true;
        
        // If user typed a unit type keyword, query unit type column only to prevent matching building name
        const unitTypeKeywords = ["1bhk", "2bhk", "3bhk", "4bhk", "studio", "commercial", "office", "shop"];
        if (unitTypeKeywords.some(kw => normalizedTerm.includes(kw))) {
          const cleanedUnitType = row.UnitType ? row.UnitType.replace(/[\s-]/g, "").toLowerCase() : "";
          return cleanedUnitType.includes(normalizedTerm);
        }
        
        return [row.PropertyName, row.UnitNumber, row.TenantName, row.UnitType]
          .filter(Boolean)
          .some((val) => {
            const cleanedVal = val.toString().replace(/[\s-]/g, "").toLowerCase();
            return cleanedVal.includes(normalizedTerm);
          });
      })();

      const matchesStatus =
        !statusFilter ||
        (statusFilter === "Occupied" && row.RentalStatus === "Occupied") ||
        (statusFilter === "Vacant" && (!row.RentalStatus || row.RentalStatus === "Vacant"));

      // Clean comparisons for dropdowns to handle casing/spacing/dash mismatches
      const rowFlatType = (row.FlatType || row.UnitType || "").replace(/[\s-]/g, "").toLowerCase();
      const filterType = unitTypeFilter.replace(/[\s-]/g, "").toLowerCase();
      const matchesType = !unitTypeFilter || rowFlatType === filterType;

      const matchesProperty = 
        !propertyFilter || 
        (row.PropertyName ? row.PropertyName.trim().toLowerCase() === propertyFilter.trim().toLowerCase() : false);

      const isMatched = matchesSearch && matchesStatus && matchesType && matchesProperty;
      if (unitTypeFilter) {
        console.log(`[PropertyReport Filter Debug] PropertyName: "${row.PropertyName}", UnitNumber: "${row.UnitNumber}", UnitType: "${row.UnitType}", matchesType: ${matchesType}, finalMatch: ${isMatched}`);
      }
      return isMatched;
    });
  }, [processedRows, searchTerm, statusFilter, unitTypeFilter, propertyFilter]);

  // Unit Types options for select drop-down (trimmed, filtered by Property Name if selected)
  const unitTypeOptions = useMemo(() => {
    let filtered = data;
    if (propertyFilter) {
      filtered = data.filter((r) => r.PropertyName && r.PropertyName.trim().toLowerCase() === propertyFilter.trim().toLowerCase());
    }
    const map = new Map();
    filtered.forEach((item) => {
      const type = (item.UnitType || item.FlatType || "").trim();
      if (type && !map.has(type.toLowerCase())) {
        map.set(type.toLowerCase(), type);
      }
    });
    return Array.from(map.values()).sort();
  }, [data, propertyFilter]);

  // Property Names options for select drop-down (trimmed, filtered by Unit Type if selected)
  const propertyOptions = useMemo(() => {
    let filtered = data;
    if (unitTypeFilter) {
      filtered = data.filter((r) => r.UnitType && r.UnitType.replace(/[\s-]/g, "").toLowerCase() === unitTypeFilter.replace(/[\s-]/g, "").toLowerCase());
    }
    const names = filtered.map((r) => r.PropertyName?.trim()).filter(Boolean);
    return Array.from(new Set(names)).sort();
  }, [data, unitTypeFilter])

  // Formatting helpers
  const formatAmount = (val) => {
    if (val === null || val === undefined || val === "") return "";
    const num = parseFloat(val);
    if (isNaN(num)) return "";
    // Output standard de-DE style formatting matching the photo (e.g. 24.000,00)
    return num.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Dynamic Cheque Column colors to match photo
  const getChequeColorClass = (chequeIndex) => {
    // Cheque 1: green, 2: blue, 3: yellow, 4: pink (repeat cycle)
    const cycle = ["col-chq-green", "col-chq-blue", "col-chq-yellow", "col-chq-pink"];
    return cycle[chequeIndex % cycle.length];
  };

  // Excel column index to label helper (e.g., 0 -> A, 27 -> AB)
  const getColLabel = (index) => {
    let label = "";
    let temp = index;
    while (temp >= 0) {
      label = String.fromCharCode((temp % 26) + 65) + label;
      temp = Math.floor(temp / 26) - 1;
    }
    return label;
  };

  // Individual person/tenant statistics calculator
  const getRowStats = (row) => {
    if (row.TotalAmount !== undefined && row.CashReceived !== undefined) {
      return {
        totalAmount: row.TotalAmount,
        cashReceived: row.CashReceived
      };
    }

    const annualRent = parseFloat(row.AnnualRent) || (parseFloat(row.MonthlyRent) * 12) || 0;
    const securityDeposit = parseFloat(row.SecurityDeposit) || 0;
    const totalAmount = annualRent + securityDeposit;

    // Calculate cash received (cheques in the past + security deposit)
    let cashReceived = securityDeposit;
    const cheques = calculateCheques(row);
    cheques.forEach((chq) => {
      const chequeDate = moment(chq.date, "DD.MM.YYYY");
      if (chequeDate.isSameOrBefore(moment(), "day")) {
        cashReceived += chq.amount;
      }
    });

    return {
      totalAmount,
      cashReceived
    };
  };

  // Totals calculations
  const totals = useMemo(() => {
    let rentalSum = 0;
    let totalSecurityDeposit = 0;
    let totalCashReceived = 0;
    let totalCombinedAmount = 0;
    let totalMaintenanceCost = 0;
    let totalProfitLoss = 0;
    let totalMonthlyRent = 0;
    const chequeSums = Array(maxChequesCount).fill(0);

    filteredRows.forEach((row) => {
      const rent = parseFloat(row.AnnualRent) || (parseFloat(row.MonthlyRent) * 12) || 0;
      rentalSum += rent;

      const secDeposit = parseFloat(row.SecurityDeposit) || 0;
      totalSecurityDeposit += secDeposit;

      const mCost = parseFloat(row.MaintenanceCost) || 0;
      totalMaintenanceCost += mCost;

      const mRent = parseFloat(row.MonthlyRent) || 0;
      totalMonthlyRent += mRent;

      const { totalAmount, cashReceived } = getRowStats(row);
      totalCashReceived += cashReceived;
      totalCombinedAmount += totalAmount;

      totalProfitLoss += (rent + secDeposit - mCost);

      row.calculatedCheques.forEach((chq, idx) => {
        if (idx < maxChequesCount) {
          chequeSums[idx] += chq.amount;
        }
      });
    });

    return {
      rentalSum,
      totalSecurityDeposit,
      totalCashReceived,
      totalCombinedAmount,
      totalMaintenanceCost,
      totalProfitLoss,
      totalMonthlyRent,
      chequeSums,
    };
  }, [filteredRows, maxChequesCount]);

  // Count unique property names
  const uniquePropertiesCount = useMemo(() => {
    return new Set(filteredRows.map((r) => r.PropertyName).filter(Boolean)).size;
  }, [filteredRows]);

  const getColCount = () => {
    if (reportType === "monthly_cash_flow" || reportType === "yearly_cash_flow") return 8;
    if (reportType === "tenant_payment_history") return 9;
    if (reportType === "maintenance_report") return 8;
    if (reportType === "profit_loss_report") return 6;
    return 8;
  };

  const renderHeaders = () => {
    if (reportType === "tenant_payment_history") {
      return (
        <>
          <th className="excel-col-head">Property Name</th>
          <th className="excel-col-head">Flat No</th>
          <th className="excel-col-head">Tenant Name</th>
          <th className="excel-col-head">Lease Start</th>
          <th className="excel-col-head">Lease End</th>
          <th className="excel-col-head">Frequency</th>
          <th className="excel-col-head">Monthly Rent</th>
          <th className="excel-col-head">Annual Rent</th>
          <th className="excel-col-head">Security Deposit</th>
        </>
      );
    }
    if (reportType === "maintenance_report") {
      return (
        <>
          <th className="excel-col-head">Property Name</th>
          <th className="excel-col-head">Flat No</th>
          <th className="excel-col-head">Last Maintenance</th>
          <th className="excel-col-head">Next Scheduled</th>
          <th className="excel-col-head">AMC Status</th>
          <th className="excel-col-head">Contractor Name</th>
          <th className="excel-col-head">Contact Phone</th>
          <th className="excel-col-head">Cost</th>
        </>
      );
    }
    if (reportType === "profit_loss_report") {
      return (
        <>
          <th className="excel-col-head">Property Name</th>
          <th className="excel-col-head">Flat No</th>
          <th className="excel-col-head">Annual Rent (Income)</th>
          <th className="excel-col-head">Security Deposit (Income)</th>
          <th className="excel-col-head">Maintenance Cost (Expense)</th>
          <th className="excel-col-head">Profit / Loss (Net)</th>
        </>
      );
    }
    // Default: monthly or yearly cash flow
    return (
      <>
        <th className="excel-col-head">{ARABIC_HEADERS.propertyName}</th>
        <th className="excel-col-head">{ARABIC_HEADERS.flatNo}</th>
        <th className="excel-col-head">{ARABIC_HEADERS.tenantName}</th>
        <th className="excel-col-head">{ARABIC_HEADERS.unitType}</th>
        <th className="excel-col-head">{ARABIC_HEADERS.rentalAmount}</th>
        <th className="excel-col-head">Security Deposit</th>
        <th className="excel-col-head">Cash Received</th>
        <th className="excel-col-head">Total Amount</th>
      </>
    );
  };

  const renderRowCells = (row, index, totalRent, securityDeposit, totalAmount, cashReceived) => {
    if (reportType === "tenant_payment_history") {
      return (
        <>
          <td className="col-property-name">{row.PropertyName || "—"}</td>
          <td className="col-flat-no">{row.UnitNumber || "—"}</td>
          <td className="col-tenant">{row.TenantName || "—"}</td>
          <td className="col-date-val">{row.LeaseStartDate ? moment(row.LeaseStartDate).format("DD-MM-YYYY") : "—"}</td>
          <td className="col-date-val">{row.LeaseEndDate ? moment(row.LeaseEndDate).format("DD-MM-YYYY") : "—"}</td>
          <td className="col-type">{row.PaymentFrequency || "—"}</td>
          <td className="col-num-val">{formatAmount(row.MonthlyRent)}</td>
          <td className="col-num-val" style={{ fontWeight: "700" }}>{formatAmount(row.AnnualRent)}</td>
          <td className="col-num-val">{formatAmount(row.SecurityDeposit)}</td>
        </>
      );
    }
    if (reportType === "maintenance_report") {
      const maintenanceCost = parseFloat(row.MaintenanceCost) || 0;
      return (
        <>
          <td className="col-property-name">{row.PropertyName || "—"}</td>
          <td className="col-flat-no">{row.UnitNumber || "—"}</td>
          <td className="col-date-val">{row.LastMaintenanceDate ? moment(row.LastMaintenanceDate).format("DD-MM-YYYY") : "—"}</td>
          <td className="col-date-val">{row.NextScheduledMaintenance ? moment(row.NextScheduledMaintenance).format("DD-MM-YYYY") : "—"}</td>
          <td className="col-type">{row.AMCAvailable || "—"}</td>
          <td className="col-tenant">{row.ContractorName || "—"}</td>
          <td className="col-date-val">{row.PhoneNumber || "—"}</td>
          <td className="col-num-val" style={{ color: "#d00000", fontWeight: "700" }}>{formatAmount(maintenanceCost)}</td>
        </>
      );
    }
    if (reportType === "profit_loss_report") {
      const maintenanceCost = parseFloat(row.MaintenanceCost) || 0;
      const profitLoss = totalRent + securityDeposit - maintenanceCost;
      const profitColor = profitLoss >= 0 ? "#276a43" : "#d00000";
      return (
        <>
          <td className="col-property-name">{row.PropertyName || "—"}</td>
          <td className="col-flat-no">{row.UnitNumber || "—"}</td>
          <td className="col-num-val" style={{ color: "#276a43" }}>{formatAmount(totalRent)}</td>
          <td className="col-num-val">{formatAmount(securityDeposit)}</td>
          <td className="col-num-val" style={{ color: "#d00000" }}>{formatAmount(maintenanceCost)}</td>
          <td className="col-total-amount col-num-val" style={{ color: profitColor, fontWeight: "800" }}>
            {formatAmount(profitLoss)}
          </td>
        </>
      );
    }
    // Default
    return (
      <>
        <td className="col-property-name">{row.PropertyName || "—"}</td>
        <td className="col-flat-no">{row.UnitNumber || "—"}</td>
        <td className="col-tenant">{row.TenantName || "—"}</td>
        <td className="col-type">{row.UnitType || "—"}</td>
        <td className="col-rent-amt">{formatAmount(totalRent)}</td>
        <td className="col-sec-deposit col-num-val">{formatAmount(securityDeposit)}</td>
        <td className="col-cash-received col-num-val">{formatAmount(cashReceived)}</td>
        <td className="col-total-amount col-num-val" style={{ fontWeight: "700" }}>{formatAmount(totalAmount)}</td>
      </>
    );
  };

  const renderTotalsCells = () => {
    if (reportType === "tenant_payment_history") {
      return (
        <>
          <td>TOTAL</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td className="col-num-val" style={{ fontWeight: "800" }}>{formatAmount(totals.totalMonthlyRent)}</td>
          <td className="col-num-val" style={{ fontWeight: "800", color: "#d00000" }}>{formatAmount(totals.rentalSum)}</td>
          <td className="col-num-val" style={{ fontWeight: "800" }}>{formatAmount(totals.totalSecurityDeposit)}</td>
        </>
      );
    }
    if (reportType === "maintenance_report") {
      return (
        <>
          <td>TOTAL</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td className="col-num-val" style={{ fontWeight: "800", color: "#d00000" }}>{formatAmount(totals.totalMaintenanceCost)}</td>
        </>
      );
    }
    if (reportType === "profit_loss_report") {
      const profitColor = totals.totalProfitLoss >= 0 ? "#276a43" : "#d00000";
      return (
        <>
          <td>TOTAL</td>
          <td></td>
          <td className="col-num-val" style={{ fontWeight: "800", color: "#276a43" }}>{formatAmount(totals.rentalSum)}</td>
          <td className="col-num-val" style={{ fontWeight: "800" }}>{formatAmount(totals.totalSecurityDeposit)}</td>
          <td className="col-num-val" style={{ fontWeight: "800", color: "#d00000" }}>{formatAmount(totals.totalMaintenanceCost)}</td>
          <td className="col-num-val" style={{ fontWeight: "800", color: profitColor }}>{formatAmount(totals.totalProfitLoss)}</td>
        </>
      );
    }
    // Default
    return (
      <>
        <td>TOTAL</td>
        <td></td>
        <td></td>
        <td></td>
        <td className="total-rent-val">{formatAmount(totals.rentalSum)}</td>
        <td className="col-num-val" style={{ fontWeight: "800" }}>{formatAmount(totals.totalSecurityDeposit)}</td>
        <td className="col-num-val" style={{ fontWeight: "800", color: "#276a43" }}>{formatAmount(totals.totalCashReceived)}</td>
        <td className="col-num-val" style={{ fontWeight: "800", color: "#10299b" }}>{formatAmount(totals.totalCombinedAmount)}</td>
      </>
    );
  };

  // Excel Export
  const handleExcelExport = () => {
    const headers = [
      "Property Name ",
      "Flat No",
      "Tenant Name",
      "Unit Type",
      "Rental Amount",
      "Security Deposit",
      "Cash Received",
      "Total Amount",
    ];

    // for (let i = 1; i <= maxChequesCount; i++) {
    //   headers.push(`Cheque ${i} Amount`, `Cheque ${i} Date`);
    // }

    const rows = filteredRows.map((r) => {
      const totalRent = parseFloat(r.AnnualRent) || (parseFloat(r.MonthlyRent) * 12) || 0;
      const securityDeposit = parseFloat(r.SecurityDeposit) || 0;
      const { totalAmount, cashReceived } = getRowStats(r);

      const rowData = [
        r.PropertyName || "",
        r.UnitNumber || "",
        r.TenantName || "",
        r.UnitType || "",
        totalRent,
        securityDeposit,
        cashReceived,
        totalAmount,
      ];

      // for (let i = 0; i < maxChequesCount; i++) {
      //   const chq = r.calculatedCheques[i];
      //   if (chq) {
      //     rowData.push(chq.amount, chq.date);
      //   } else {
      //     rowData.push("", "");
      //   }
      // }
      return rowData;
    });

    // Add totals row
    const totalRow = [
      "TOTAL", 
      "", 
      "", 
      "",
      totals.rentalSum,
      totals.totalSecurityDeposit,
      totals.totalCashReceived,
      totals.totalCombinedAmount,
    ];
    // for (let i = 0; i < maxChequesCount; i++) {
    //   totalRow.push(totals.chequeSums[i], "");
    // }
    rows.push(totalRow);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payment Tracker");

    XLSX.writeFile(workbook, "Property_Payment_Tracker_Report.xlsx");
  };

  // PDF Export
  const handlePdfExport = () => {
    // Generate Landscape PDF on A2/A3 depending on columns
    const orientation = "landscape";
    const format = maxChequesCount > 4 ? "a2" : "a3"; 
    const doc = new jsPDF({ orientation, format });

    // Document Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(16, 41, 155);
    doc.text("Property Payment Tracker Report", 20, 20);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${moment().format("DD/MM/YYYY HH:mm")} | Filtered Rows: ${filteredRows.length}`, 20, 28);

    const tableHeaders = [
      "Property Name",
      "Flat No",
      "Tenant Name",
      "Unit Type",
      "Rental Amount",
      "Security Deposit",
      "Cash Received",
      "Total Amount",
    ];

    // for (let i = 1; i <= maxChequesCount; i++) {
    //   tableHeaders.push(`Cheque ${i} Amt`, `Cheque ${i} Date`);
    // }

    const tableRows = filteredRows.map((r) => {
      const totalRent = parseFloat(r.AnnualRent) || (parseFloat(r.MonthlyRent) * 12) || 0;
      const securityDeposit = parseFloat(r.SecurityDeposit) || 0;
      const { totalAmount, cashReceived } = getRowStats(r);

      const rowData = [
        r.PropertyName || "—",
        r.UnitNumber || "—",
        r.TenantName || "—",
        r.UnitType || "—",
        formatAmount(totalRent),
        formatAmount(securityDeposit),
        formatAmount(cashReceived),
        formatAmount(totalAmount),
      ];

      // for (let i = 0; i < maxChequesCount; i++) {
      //   const chq = r.calculatedCheques[i];
      //   if (chq) {
      //     rowData.push(formatAmount(chq.amount), chq.date);
      //   } else {
      //     rowData.push("—", "—");
      //   }
      // }
      return rowData;
    });

    // Totals row for PDF
    const totalRow = [
      "TOTAL", 
      "", 
      "", 
      "",
      formatAmount(totals.rentalSum),
      formatAmount(totals.totalSecurityDeposit),
      formatAmount(totals.totalCashReceived),
      formatAmount(totals.totalCombinedAmount),
    ];
    // for (let i = 0; i < maxChequesCount; i++) {
    //   totalRow.push(formatAmount(totals.chequeSums[i]), "—");
    // }
    tableRows.push(totalRow);

    doc.autoTable({
      head: [tableHeaders],
      body: tableRows,
      startY: 35,
      theme: "grid",
      headStyles: {
        fillColor: [16, 41, 155],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        halign: "center",
      },
      bodyStyles: {
        fontSize: 9,
        valign: "middle",
      },
      alternateRowStyles: {
        fillColor: [248, 249, 253],
      },
      columnStyles: {
        4: { fontStyle: "bold", halign: "right", textColor: [220, 0, 0] }, // Rental amount
        5: { halign: "right" }, // Security Deposit
        6: { fontStyle: "bold", halign: "right", textColor: [39, 106, 67] }, // Cash Received
        7: { fontStyle: "bold", halign: "right", textColor: [16, 41, 155] }, // Total Amount
      },
      didParseCell: (data) => {
        // Highlight totals row
        if (data.row.index === tableRows.length - 1) {
          data.cell.styles.fillColor = [240, 244, 255];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    doc.save("Property_Payment_Tracker_Report.pdf");
  };

  const chartOptions = {
    chart: {
      type: "line",
      height: 350,
      toolbar: { show: true },
      background: "transparent",
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: "smooth",
      width: 3
    },
    xaxis: {
      categories: filteredRows.map(r => r.PropertyName || "Unnamed"),
      labels: {
        rotate: -45,
        style: {
          colors: "#1a1f36",
          fontSize: "12px",
          fontWeight: "600"
        }
      }
    },
    yaxis: {
      title: {
        text: "AED",
        style: {
          color: "#1a1f36",
          fontWeight: "700"
        }
      },
      labels: {
        style: {
          colors: "#1a1f36",
          fontWeight: "600"
        }
      }
    },
    fill: {
      opacity: 1
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return "AED " + val.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
      }
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
      labels: {
        colors: "#1a1f36"
      }
    },
    colors: ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6"]
  };

  const chartSeries = [
    {
      name: "Rental Amount",
      data: filteredRows.map(row => parseFloat(row.AnnualRent) || (parseFloat(row.MonthlyRent) * 12) || 0)
    },
    {
      name: "Security Deposit",
      data: filteredRows.map(row => parseFloat(row.SecurityDeposit) || 0)
    },
    {
      name: "Cash Received",
      data: filteredRows.map(row => {
        const { cashReceived } = getRowStats(row);
        return cashReceived;
      })
    },
    {
      name: "Total Amount",
      data: filteredRows.map(row => {
        const { totalAmount } = getRowStats(row);
        return totalAmount;
      })
    }
  ];

  return (
    <div className="rep-container">
      <style>{`
        .rep-container {
          padding: 10px 0;
          font-family: "Inter", system-ui, -apple-system, sans-serif;
        }
        
        /* ---------- KPI Summary widgets ---------- */
        .rep-kpi-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .rep-kpi-card {
          background: #ffffff;
          border: 1px solid #eef1fb;
          border-left: 4px solid var(--pm-primary);
          border-radius: 12px;
          padding: 16px 20px;
          box-shadow: 0 4px 12px rgba(16,41,155,0.03);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .rep-kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(16,41,155,0.06);
        }
        .rep-kpi-label {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #8892b0;
          margin-bottom: 6px;
          letter-spacing: 0.5px;
        }
        .rep-kpi-val {
          font-size: 1.3rem;
          font-weight: 800;
          color: var(--pm-primary-dark);
        }

        /* ---------- Filter panel ---------- */
        .rep-filter-panel {
          background: #f8f9fd;
          border: 1px solid #d6ddf5;
          border-radius: 14px;
          padding: 18px;
          margin-bottom: 20px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 15px;
        }
        .rep-filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1 1 200px;
        }
        .rep-filter-group label {
          font-size: 0.73rem;
          font-weight: 700;
          color: var(--pm-primary-dark);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .rep-input, .rep-select {
          border: 1px solid #c2cdf0;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 1.05rem;
          outline: none;
          background: #ffffff;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .rep-input:focus, .rep-select:focus {
          border-color: var(--pm-primary);
          box-shadow: 0 0 0 3px rgba(16,41,155,0.12);
        }
        .rep-actions {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          margin-top: auto;
          flex-wrap: wrap;
        }
        .rep-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1.5px solid var(--pm-primary);
          background: #ffffff;
          color: var(--pm-primary);
          font-size: 0.95rem;
          font-weight: 700;
          padding: 12px 18px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .rep-btn:hover {
          background: var(--pm-primary-soft);
        }
        .rep-btn-excel {
          background: #1a9e6c;
          border-color: #1a9e6c;
          color: #ffffff;
        }
        .rep-btn-excel:hover {
          background: #157f56;
          border-color: #157f56;
        }
        .rep-btn-pdf {
          background: #dc2626;
          border-color: #dc2626;
          color: #ffffff;
        }
        .rep-btn-pdf:hover {
          background: #b91c1c;
          border-color: #b91c1c;
        }

        /* ---------- Excel-style Table Grid ---------- */
        .rep-grid-wrapper {
          border: 1.5px solid #d0d7e6;
          border-radius: 12px;
          overflow: auto;
          box-shadow: 0 8px 24px rgba(16,41,155,0.04);
          max-height: 62vh;
          position: relative;
          background: #fdfdfd;
        }
        .rep-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
          text-align: left;
          background: #ffffff;
        }

        /* Excel-like coordinates A, B, C... and 1, 2, 3... */
        .excel-coord {
          background: #e2e7f3;
          color: #4a5468;
          font-size: 0.72rem;
          font-weight: 700;
          text-align: center;
          border: 1px solid #c0c9d9;
          user-select: none;
          padding: 4px 8px;
        }
        .excel-row-num {
          background: #eaeef6;
          color: #4a5468;
          font-weight: 700;
          font-size: 0.72rem;
          text-align: center;
          border: 1px solid #c0c9d9;
          width: 35px;
          position: sticky;
          left: 0;
          z-index: 2;
        }
        .excel-col-head {
          background: #eaeef6;
          color: #1a1f36;
          font-weight: 800;
          font-size: 0.76rem;
          border: 1px solid #c0c9d9;
          padding: 8px 12px;
          text-align: center;
          vertical-align: middle;
          white-space: pre-line;
          line-height: 1.2;
        }
        
        .rep-table td {
          border: 1px solid #d0d7e6;
          padding: 10px 14px;
          vertical-align: middle;
          white-space: nowrap;
          color: #2d3748;
        }

        /* Color classes from photo style */
        .col-flat-no {
          background-color: #fce4d6; /* Peach-orange flat no bg */
          font-weight: 700;
          text-align: center;
        }
        .col-tenant {
          background-color: #ffffff;
        }
        .col-type {
          background-color: #f3e8f3; /* Soft purple type bg */
          text-align: center;
        }
        .col-property-name {
          background-color: #ffffff;
          font-weight: 600;
        }
        .col-rent-amt {
          background-color: #ffff00; /* Yellow bg for rent */
          color: #d00000; /* Bold red text */
          font-weight: 800;
          text-align: right;
          font-size: 0.9rem;
        }
        .col-sec-deposit {
          background-color: #f2f2f2;
          text-align: right;
        }
        .col-cash-received {
          background-color: #e2efda; /* Soft green */
          color: #276a43;
          font-weight: 700;
          text-align: right;
        }
        .col-total-amount {
          background-color: #ddebf7; /* Soft blue */
          color: #10299b;
          font-weight: 800;
          text-align: right;
        }
        .col-num-val {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }
        .col-date-val {
          text-align: center;
          font-variant-numeric: tabular-nums;
          color: #4a5568;
        }

        /* Alternate columns backgrounds for cheques */
        .col-chq-green { background-color: #e2efda; }
        .col-chq-blue { background-color: #ddebf7; }
        .col-chq-yellow { background-color: #fff2cc; }
        .col-chq-pink { background-color: #fce4d6; }

        .rep-table tr:hover td {
          filter: brightness(0.97);
        }
        .rep-table tr:hover .col-tenant {
          background-color: #f4f6fc;
        }

        .totals-row {
          position: sticky;
          bottom: 0;
          background: #eaeef6;
          z-index: 3;
        }
        .totals-row td {
          border-top: 2px double #8595b2;
          border-bottom: 2px solid #8595b2;
          font-weight: 800;
          background-color: #eaeef6 !important;
          color: #1a1f36;
        }
        .totals-row .total-rent-val {
          color: #d00000 !important;
          text-align: right;
        }

        .rep-empty {
          text-align: center;
          padding: 60px 20px;
          color: #718096;
        }
        .rep-empty i {
          font-size: 2.2rem;
          color: #cbd5e0;
          display: block;
          margin-bottom: 12px;
        }
        
        /* Floating scrollbars */
        .rep-grid-wrapper::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .rep-grid-wrapper::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 4px;
        }
        .rep-grid-wrapper::-webkit-scrollbar-track {
          background: #f7fafc;
        }
      `}</style>

      {/* KPI Cards section */}
      <div className="rep-kpi-row">
        <div className="rep-kpi-card">
          <div className="rep-kpi-label">Total Properties</div>
          <div className="rep-kpi-val">{uniquePropertiesCount}</div>
        </div>
        <div className="rep-kpi-card" style={{ borderLeftColor: "#10299b" }}>
          <div className="rep-kpi-label">Total Units</div>
          <div className="rep-kpi-val">{filteredRows.length}</div>
        </div>
        <div className="rep-kpi-card" style={{ borderLeftColor: "#1a9e6c" }}>
          <div className="rep-kpi-label">Occupied Units</div>
          <div className="rep-kpi-val">
            {filteredRows.filter((r) => r.RentalStatus === "Occupied").length}
          </div>
        </div>
        <div className="rep-kpi-card" style={{ borderLeftColor: "#e28743" }}>
          <div className="rep-kpi-label">Vacant Units</div>
          <div className="rep-kpi-val">
            {filteredRows.filter((r) => !r.RentalStatus || r.RentalStatus === "Vacant").length}
          </div>
        </div>
        <div className="rep-kpi-card" style={{ borderLeftColor: "#10299b" }}>
          <div className="rep-kpi-label">Total Contract Rent</div>
          <div className="rep-kpi-val" style={{ color: "#10299b" }}>
            AED {formatAmount(totals.rentalSum)}
          </div>
        </div>
        <div className="rep-kpi-card" style={{ borderLeftColor: "#276a43" }}>
          <div className="rep-kpi-label">Total Cash Received</div>
          <div className="rep-kpi-val" style={{ color: "#276a43" }}>
            AED {formatAmount(totals.totalCashReceived)}
          </div>
        </div>
      </div>

      {/* Filters and export panel */}
      <div className="rep-filter-panel">
        <div className="rep-filter-group">
          <label>Search Report</label>
          <input
            type="text"
            className="rep-input"
            placeholder="Search property, flat no, tenant, type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="rep-filter-group" style={{ flex: "0 1 200px" }}>
          <label>Report Type</label>
          <select
            className="rep-select"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="all_reports">All Reports</option>
            <option value="monthly_cash_flow">Monthly Cash Flow</option>
            <option value="yearly_cash_flow">Yearly Cash Flow</option>
            <option value="tenant_payment_history">Tenant Payment History</option>
            <option value="maintenance_report">Maintenance Report</option>
            <option value="profit_loss_report">Profit & Loss Report</option>
          </select>
        </div>

        <div className="rep-filter-group" style={{ flex: "0 1 200px" }}>
          <label>Property Name</label>
          <select
            className="rep-select"
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
          >
            <option value="">All Properties</option>
            {propertyOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="rep-filter-group" style={{ flex: "0 1 180px" }}>
          <label>Status Filter</label>
          <select
            className="rep-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Occupied">Occupied Only</option>
            <option value="Vacant">Vacant Only</option>
          </select>
        </div>

        <div className="rep-filter-group" style={{ flex: "0 1 180px" }}>
          <label>Unit Type</label>
          <select
            className="rep-select"
            value={unitTypeFilter}
            onChange={(e) => setUnitTypeFilter(e.target.value)}
          >
            <option value="">All Unit Types</option>
            {unitTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="rep-actions">
          <button type="button" className="rep-btn rep-btn-excel" onClick={handleExcelExport}>
            <i className="bi bi-file-earmark-excel"></i> Export Excel
          </button>
          <button type="button" className="rep-btn rep-btn-pdf" onClick={handlePdfExport}>
            <i className="bi bi-file-earmark-pdf"></i> Export PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading properties payment tracker report...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn btn-sm btn-outline-danger ms-3" onClick={PropertyList}>
            Retry
          </button>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="rep-empty">
          <i className="bi bi-file-earmark-x"></i>
          <h5>No report details match the criteria</h5>
          <p className="text-muted">Adjust filters or search parameters and try again.</p>
        </div>
      ) : (
        <>
          {/* Graphical Representation Card */}
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "12px", padding: "20px", background: "#ffffff" }}>
            <h5 className="mb-3" style={{ fontWeight: "700", color: "#1a1f36" }}>
              Financial Comparison & Cash Flow Analysis
            </h5>
            <div style={{ minHeight: "350px" }}>
              <Chart
                options={chartOptions}
                series={chartSeries}
                type="line"
                height={350}
              />
            </div>
          </div>

          {/* Excel grid layout */}
          <div className="rep-grid-wrapper">
          <table className="rep-table">
            <thead>
              {/* Excel Column Letters row: A, B, C, D... */}
              <tr>
                <th className="excel-coord"></th>
                {Array.from({ length: getColCount() }).map((_, idx) => (
                  <th key={idx} className="excel-coord">{getColLabel(idx)}</th>
                ))}
              </tr>

              {/* Real Table Headers dynamically updated */}
              <tr>
                <th className="excel-coord">1</th>
                {renderHeaders()}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, index) => {
                const totalRent = parseFloat(row.AnnualRent) || (parseFloat(row.MonthlyRent) * 12) || 0;
                const securityDeposit = parseFloat(row.SecurityDeposit) || 0;
                const { totalAmount, cashReceived } = getRowStats(row);

                return (
                  <tr key={`${row.PropertyID}-${row.RentalID || index}`}>
                    {/* Excel Row Coordinate numbers: 2, 3, 4... */}
                    <td className="excel-row-num">{index + 2}</td>
                    
                    {renderRowCells(row, index, totalRent, securityDeposit, totalAmount, cashReceived)}
                  </tr>
                );
              })}

              {/* Excel totals row */}
              <tr className="totals-row">
                <td className="excel-row-num">{filteredRows.length + 2}</td>
                {renderTotalsCells()}
              </tr>
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
};

export default PropertyReport;