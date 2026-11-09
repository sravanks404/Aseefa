// Full modified code for ExportSales with updated filters and columns

import React, { useState, useEffect, useMemo } from "react";
import api from '../../apiService';
import DataTable from "react-data-table-component";
import Select from "react-select";
import { FaSearch, FaFileExcel, FaFilePdf, FaFilter } from "react-icons/fa";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import "jspdf-autotable";

const ExportSales = () => {
  const getCurrentDate = () => new Date().toISOString().split("T")[0];
  const getPreviousDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];
  };

  const [fromDate, setFromDate] = useState(getPreviousDate(7));
  const [toDate, setToDate] = useState(getCurrentDate());
  const [reportData, setReportData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [salesPerson, setSalesPerson] = useState("");
  const [route, setRoute] = useState("");
  const [type, setType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [salesPersonOptions, setSalesPersonOptions] = useState([]);
  const [routeOptions, setRouteOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);

  useEffect(() => {
    fetchReport();
  }, [fromDate, toDate]);

  const fetchReport = async () => {
    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      const response = await api.get("/api/ExportSales", {
        params: {
          CompanyID,
          FromDate: fromDate,
          ToDate: toDate,
        },
      });
      const data = response.data || [];
      setReportData(data);
      applyFilters(data);

      setSalesPersonOptions(
        Array.from(new Set(data.map(d => d.SalesPerson))).map(p => ({ label: p, value: p }))
      );
      setRouteOptions(
        Array.from(new Set(data.map(d => d.Route))).map(r => ({ label: r, value: r }))
      );
      setTypeOptions(
        Array.from(new Set(data.map(d => d.Type))).map(t => ({ label: t, value: t }))
      );
    } catch (err) {
      console.error("Error fetching report:", err);
      setReportData([]);
    }
  };

  const applyFilters = (data = reportData) => {
    let result = data;
    if (salesPerson) result = result.filter(d => d.SalesPerson === salesPerson);
    if (route) result = result.filter(d => d.Route === route);
    if (type) result = result.filter(d => d.Type === type);
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.HSNCode?.toLowerCase().includes(search) ||
        d.ItemName?.toLowerCase().includes(search)
      );
    }
    setFilteredData(result);
  };

  useEffect(() => {
    applyFilters();
  }, [searchQuery, salesPerson, route, type]);

  const exportToExcel = () => {
    const header = [
      ["Voucher Date", "Bill No", "Voucher Type", "Sales Account", "Customer Name", "Customer Address", "GSTIN",
        "Item Name", "Qty", "Rate", "Unit", "Discount", "GST %", "CGST Led", "CGST Amt", "SGST Led", "SGST Amt",
        "IGST Led", "IGST Amt", "Cess Led", "Cess Amt", "KFC Led", "KFC %", "Led-1", "Led 1 Amt", "Led 2", "Led2 Amt",
        "Gross Amount", "Total Amount", "CGST Registration type", "hsn code", "Mode OF Payment", "Buyer Name", "State",
        "Sales Person", "Bill Discount", "Round Off", "Rate(Excl SalesRate)"]
    ];

    const rows = filteredData.map(d => [
      d.VoucherDate, d.BillNo, d.VoucherType, d.SalesAccount, d.CustomerName, d.CustomerAddress, d.GSTIN,
      d.ItemName, d.Qty, d.Rate, d.Unit, d.Discount, d.GST, d.CGSTLed, d.CGSTAmount, d.SGSTLed, d.SGSTAmount,
      d.IGSTLed, d.IGSTamount, d.CessLed, d.cess, d.KFCLed, d.KFC, d.Led1, d.Led1Amt, d.Led2, d.Led2Amt,
      d.GrossAmount, d.TotalAmount, d.CGSTRegistrationtype, d.HSNCode, d.SalesMode, d.BuyerName, d.State,
      d.SalesPerson, d.BillDiscount, d.RoundOFf, d.Route, d.Type
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([...header, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Export Sales");
    XLSX.writeFile(workbook, `ExportSales_${fromDate}_to_${toDate}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF("landscape");
    const tableColumn = [
      "Voucher Date", "Bill No", "Voucher Type", "Sales Account", "Customer Name", "Customer Address", "GSTIN",
      "Item Name", "Qty", "Rate", "Unit", "Discount", "GST %", "CGST", "CGST Amt", "SGST", "SGST Amt",
      "IGST", "IGST Amt", "Cess", "Cess Amt", "KFC", "KFC Amt", "Labour", "Labour Amt", "Led2", "Led2 Amt",
      "Gross Amt", "Total Amt", "GST Reg", "HSN", "Sales Mode", "Buyer", "State", "Sales Person",
      "Bill Disc", "Round Off", "Route", "Type"
    ];

    const tableRows = filteredData.map(d => [
      d.VoucherDate, d.BillNo, d.VoucherType, d.SalesAccount, d.CustomerName, d.CustomerAddress, d.GSTIN,
      d.ItemName, d.Qty, d.Rate, d.Unit, d.Discount, d.GST, d.CGSTLed, d.CGSTAmount, d.SGSTLed, d.SGSTAmount,
      d.IGSTLed, d.IGSTamount, d.CessLed, d.cess, d.KFCLed, d.KFC, d.Led1, d.Led1Amt, d.Led2, d.Led2Amt,
      d.GrossAmount, d.TotalAmount, d.CGSTRegistrationtype, d.HSNCode, d.SalesMode, d.BuyerName, d.State,
      d.SalesPerson, d.BillDiscount, d.RoundOFf, d.Route, d.Type
    ]);

    doc.autoTable({ head: [tableColumn], body: tableRows, styles: { fontSize: 6 }, startY: 20 });
    doc.save(`ExportSales_${fromDate}_to_${toDate}.pdf`);
  };

  const columns = useMemo(() => [
    { name: "Date", selector: d => d.VoucherDate, sortable: true },
    { name: "Bill No", selector: d => d.BillNo },
    { name: "Customer", selector: d => d.CustomerName },
    { name: "Item", selector: d => d.ItemName },
    { name: "Qty", selector: d => d.Qty, right: true },
    { name: "Rate", selector: d => d.Rate, right: true },
    { name: "Total", selector: d => d.TotalAmount, right: true },
  ], []);

  return (
    <div className="container-fluid">
      <div className="card p-3 mb-3">
        <div className="d-flex flex-wrap justify-content-between gap-2">
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />

          <Select options={salesPersonOptions} onChange={o => setSalesPerson(o?.value || "")} placeholder="Sales Person" isClearable />
          <Select options={routeOptions} onChange={o => setRoute(o?.value || "")} placeholder="Route" isClearable />
          <Select options={typeOptions} onChange={o => setType(o?.value || "")} placeholder="Type" isClearable />

          <input placeholder="Search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          <button className="btn btn-success" onClick={exportToExcel}><FaFileExcel /> Excel</button>
          <button className="btn btn-danger" onClick={exportToPDF}><FaFilePdf /> PDF</button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        pagination
        highlightOnHover
        striped
        dense
      />
    </div>
  );
};

export default ExportSales;
