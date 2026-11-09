

// import React, { useState, useEffect, useMemo } from "react";
// import Select from "react-select";
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";
// import api from "../../apiService";

// const LedgerAll = () => {
//   const today = new Date().toISOString().split("T")[0];

//   const [fromDate, setFromDate] = useState(today);
//   const [toDate, setToDate] = useState(today);
//   const [AccountCode, setAccountCode] = useState([]);
//   const [party, setParty] = useState(null);
//   const [ledgerData, setLedgerData] = useState([]);

//   useEffect(() => {
//     fetchHeads();
//   }, []);

//   const fetchHeads = async () => {
//     try {
//       const res = await api.get("/api/Achead");
//       setAccountCode(res.data || []);
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   const options = AccountCode.map((row) => ({
//     value: row.HSlNo,
//     label: row.HName
//   }));

//   // ===========================
//   // ✅ GENERATE LEDGER
//   // ===========================
//   const generateLedger = async () => {
//     if (!party) {
//       alert("Select Party");
//       return;
//     }

//     try {
//       const CompanyID = sessionStorage.getItem("CompanyID");

//       const res = await api.get("/api/WebLedgerNew", {
//         params: {
//           FromDate: fromDate,
//           ToDate: toDate,
//           AccountCode: party.value,
//           CompanyID
//         }
//       });

//       const data = res.data || {};
//       let ledger = data.ledger || [];

//       let openingBalance = 0;

//       // ===========================
//       // ✅ ADD OPENING BALANCE
//       // ===========================
//       if (data.opening) {
//         openingBalance = data.opening.balance || 0;

//         ledger = [
//           {
//             slno: 0,
//             date: fromDate,
//             type: "Opening Balance",
//             transNo: "",
//             debit: data.opening.debit || 0,
//             credit: data.opening.credit || 0,
//             balance: openingBalance,
//             narration: ""
//           },
//           ...ledger
//         ];
//       }

//       // ===========================
//       // ✅ RE-CALCULATE RUNNING BALANCE
//       // ===========================
//       let running = openingBalance;

//       const finalLedger = ledger.map((row, i) => {
//         if (i === 0 && row.type === "Opening Balance") {
//           return row;
//         }

//         running += Number(row.debit || 0) - Number(row.credit || 0);

//         return {
//           ...row,
//           slno: i,
//           balance: Number(running.toFixed(2))
//         };
//       });

//       setLedgerData(finalLedger);

//     } catch (err) {
//       console.log(err);
//       alert("Ledger Load Error");
//     }
//   };

//   // ===========================
//   // ✅ TOTALS
//   // ===========================
//   const totalDebit = useMemo(
//     () => ledgerData.reduce((sum, r) => sum + Number(r.debit || 0), 0),
//     [ledgerData]
//   );

//   const totalCredit = useMemo(
//     () => ledgerData.reduce((sum, r) => sum + Number(r.credit || 0), 0),
//     [ledgerData]
//   );

//   const finalBalance = totalDebit - totalCredit;

//   const balanceText =
//     finalBalance >= 0
//       ? `${Math.abs(finalBalance).toFixed(2)} Dr`
//       : `${Math.abs(finalBalance).toFixed(2)} Cr`;

//   // ===========================
//   // ✅ EXPORT EXCEL
//   // ===========================
//   const exportToExcel = () => {
//     if (ledgerData.length === 0) {
//       alert("No data to export");
//       return;
//     }

//     const formattedData = ledgerData.map((row, i) => ({
//       SL: row.slno || i + 1,
//       Date: row.date
//         ? new Date(row.date).toLocaleDateString("en-GB")
//         : "",
//       Type: row.type,
//       Transaction: row.transNo,
//       Debit: Number(row.debit || 0).toFixed(2),
//       Credit: Number(row.credit || 0).toFixed(2),
//       Balance: `${Math.abs(row.balance || 0).toFixed(2)} ${
//         (row.balance || 0) >= 0 ? "Dr" : "Cr"
//       }`,
//       Narration: row.narration
//     }));

//     formattedData.push({
//       SL: "",
//       Date: "",
//       Type: "TOTAL",
//       Transaction: "",
//       Debit: totalDebit.toFixed(2),
//       Credit: totalCredit.toFixed(2),
//       Balance: balanceText,
//       Narration: ""
//     });

//     const worksheet = XLSX.utils.json_to_sheet(formattedData);

//     worksheet["!cols"] = [
//       { wch: 5 },
//       { wch: 12 },
//       { wch: 20 },
//       { wch: 15 },
//       { wch: 12 },
//       { wch: 12 },
//       { wch: 15 },
//       { wch: 30 }
//     ];

//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger");

//     const excelBuffer = XLSX.write(workbook, {
//       bookType: "xlsx",
//       type: "array"
//     });

//     const file = new Blob([excelBuffer], {
//       type:
//         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"
//     });

//     saveAs(file, `Ledger_${fromDate}_to_${toDate}.xlsx`);
//   };

//   // ===========================
//   // UI
//   // ===========================
//   return (
//     <div className="container-fluid">
//       <h3 className="mt-3">Ledger Report</h3>

//       <div className="row mt-3">
//         <div className="col-md-2">
//           <label>From</label>
//           <input
//             type="date"
//             className="form-control"
//             value={fromDate}
//             onChange={(e) => setFromDate(e.target.value)}
//           />
//         </div>

//         <div className="col-md-2">
//           <label>To</label>
//           <input
//             type="date"
//             className="form-control"
//             value={toDate}
//             onChange={(e) => setToDate(e.target.value)}
//           />
//         </div>

//         <div className="col-md-4">
//           <label>Party</label>
//           <Select
//             options={options}
//             value={party}
//             onChange={(selected) => setParty(selected)}
//             placeholder="Select Party"
//             isClearable
//           />
//         </div>

//         <div className="col-md-2 d-flex align-items-end">
//           <button className="btn btn-primary w-100" onClick={generateLedger}>
//             Generate
//           </button>
//         </div>

//         <div className="col-md-2 d-flex align-items-end">
//           <button className="btn btn-success w-100" onClick={exportToExcel}>
//             Export Excel
//           </button>
//         </div>
//       </div>

//       <div className="table-responsive mt-4">
//         <table className="table table-bordered">
//           <thead className="table-light">
//             <tr>
//               <th>SL</th>
//               <th>Date</th>
//               <th>Type</th>
//               <th>Transaction</th>
//               <th>Debit</th>
//               <th>Credit</th>
//               <th>Balance</th>
//               <th>Narration</th>
//             </tr>
//           </thead>

//           <tbody>
//             {ledgerData.length > 0 ? (
//               ledgerData.map((row, i) => (
//                 <tr key={i}>
//                   <td>{row.slno || i + 1}</td>
//                   <td>
//                     {row.date
//                       ? new Date(row.date).toLocaleDateString("en-GB")
//                       : ""}
//                   </td>
//                   <td>{row.type}</td>
//                   <td>{row.transNo}</td>
//                   <td>{Number(row.debit || 0).toFixed(2)}</td>
//                   <td>{Number(row.credit || 0).toFixed(2)}</td>
//                   <td>
//                     {Math.abs(row.balance || 0).toFixed(2)}{" "}
//                     {(row.balance || 0) >= 0 ? "Dr" : "Cr"}
//                   </td>
//                   <td>{row.narration}</td>
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td colSpan="8" className="text-center">
//                   No Data
//                 </td>
//               </tr>
//             )}
//           </tbody>

//           {ledgerData.length > 0 && (
//             <tfoot>
//               <tr>
//                 <td colSpan="4"><b>Total</b></td>
//                 <td><b>{totalDebit.toFixed(2)}</b></td>
//                 <td><b>{totalCredit.toFixed(2)}</b></td>
//                 <td><b>{balanceText}</b></td>
//                 <td></td>
//               </tr>
//             </tfoot>
//           )}
//         </table>
//       </div>
//     </div>
//   );
// };

// export default LedgerAll;
import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import api from "../../apiService";
import { usePermission } from '../../../src/context/permissionContex';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LedgerAll = () => {
  // ── Permissions ──
  const { getPermission, refreshPermissions } = usePermission();
  const permission = getPermission('LEDGER');
  const canView   = !!permission?.CanView;
  const canExport = !!permission?.CanExport;

  useEffect(() => {
    refreshPermissions();
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [AccountCode, setAccountCode] = useState([]);
  const [party, setParty] = useState(null);
  const [ledgerData, setLedgerData] = useState([]);

  useEffect(() => {
    if (!canView) return;
    fetchHeads();
  }, [canView]);

  const fetchHeads = async () => {
    try {
      const res = await api.get("/api/Achead");
      if (Array.isArray(res.data)) {
        setAccountCode(res.data);
      } else if (res.data && Array.isArray(res.data.data)) {
        setAccountCode(res.data.data);
      } else {
        setAccountCode([]);
      }
    } catch (err) {
      console.log(err);
      setAccountCode([]);
      toast.error("Failed to load account list");
    }
  };

  const safeAccountCode = Array.isArray(AccountCode) ? AccountCode : [];

  const options = safeAccountCode.map((row) => ({
    value: row.HSlNo,
    label: row.HName
  }));

  // ===========================
  // ✅ GENERATE LEDGER
  // ===========================
  const generateLedger = async () => {
    if (!canView) return; // ── Permission guard ──

    if (!party) {
      alert("Select Party");
      return;
    }

    try {
      const CompanyID = sessionStorage.getItem("CompanyID");

      const res = await api.get("/api/WebLedgerNew", {
        params: {
          FromDate: fromDate,
          ToDate: toDate,
          AccountCode: party.value,
          CompanyID
        }
      });

      const data = res.data || {};
      let ledger = Array.isArray(data.ledger) ? data.ledger : [];

      let openingBalance = 0;

      // ===========================
      // ✅ ADD OPENING BALANCE
      // ===========================
      if (data.opening) {
        openingBalance = data.opening.balance || 0;

        ledger = [
          {
            slno: 0,
            date: fromDate,
            type: "Opening Balance",
            transNo: "",
            debit: data.opening.debit || 0,
            credit: data.opening.credit || 0,
            balance: openingBalance,
            narration: ""
          },
          ...ledger
        ];
      }

      // ===========================
      // ✅ RE-CALCULATE RUNNING BALANCE
      // ===========================
      let running = openingBalance;

      const finalLedger = ledger.map((row, i) => {
        if (i === 0 && row.type === "Opening Balance") {
          return row;
        }

        running += Number(row.debit || 0) - Number(row.credit || 0);

        return {
          ...row,
          slno: i,
          balance: Number(running.toFixed(2))
        };
      });

      setLedgerData(finalLedger);

    } catch (err) {
      console.log(err);
      alert("Ledger Load Error");
      toast.error("Ledger Load Error");
    }
  };

  // ===========================
  // ✅ TOTALS
  // ===========================
  const totalDebit = useMemo(
    () => ledgerData.reduce((sum, r) => sum + Number(r.debit || 0), 0),
    [ledgerData]
  );

  const totalCredit = useMemo(
    () => ledgerData.reduce((sum, r) => sum + Number(r.credit || 0), 0),
    [ledgerData]
  );

  const finalBalance = totalDebit - totalCredit;

  const balanceText =
    finalBalance >= 0
      ? `${Math.abs(finalBalance).toFixed(2)} Dr`
      : `${Math.abs(finalBalance).toFixed(2)} Cr`;

  // ===========================
  // ✅ EXPORT EXCEL
  // ===========================
  const exportToExcel = () => {
    if (!canExport) { toast.error("You do not have permission to export reports."); return; }

    if (ledgerData.length === 0) {
      alert("No data to export");
      return;
    }

    const formattedData = ledgerData.map((row, i) => ({
      SL: row.slno || i + 1,
      Date: row.date
        ? new Date(row.date).toLocaleDateString("en-GB")
        : "",
      Type: row.type,
      Transaction: row.transNo,
      Debit: Number(row.debit || 0).toFixed(2),
      Credit: Number(row.credit || 0).toFixed(2),
      Balance: `${Math.abs(row.balance || 0).toFixed(2)} ${
        (row.balance || 0) >= 0 ? "Dr" : "Cr"
      }`,
      Narration: row.narration
    }));

    formattedData.push({
      SL: "",
      Date: "",
      Type: "TOTAL",
      Transaction: "",
      Debit: totalDebit.toFixed(2),
      Credit: totalCredit.toFixed(2),
      Balance: balanceText,
      Narration: ""
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 12 },
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 30 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array"
    });

    const file = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"
    });

    saveAs(file, `Ledger_${fromDate}_to_${toDate}.xlsx`);
    toast.success("Exported to Excel");
  };

  // ===========================
  // ✅ ACCESS-DENIED VIEW
  // ===========================
  if (!canView) {
    return (
      <div className="container-fluid">
        <ToastContainer position="top-center" autoClose={3000} />
        <div className="alert alert-danger mt-3">You do not have permission to view Ledger Report.</div>
      </div>
    );
  }

  // ===========================
  // UI
  // ===========================
  return (
    <div className="container-fluid">
      <ToastContainer position="top-center" autoClose={3000} />

      <h3 className="mt-3">Ledger Report</h3>

      <div className="row mt-3">
        <div className="col-md-2">
          <label>From</label>
          <input
            type="date"
            className="form-control"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div className="col-md-2">
          <label>To</label>
          <input
            type="date"
            className="form-control"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <div className="col-md-4">
          <label>Party</label>
          <Select
            options={options}
            value={party}
            onChange={(selected) => setParty(selected)}
            placeholder="Select Party"
            isClearable
          />
        </div>

        <div className="col-md-2 d-flex align-items-end">
          <button className="btn btn-primary w-100" onClick={generateLedger}>
            Generate
          </button>
        </div>

        {canExport && (
          <div className="col-md-2 d-flex align-items-end">
            <button className="btn btn-success w-100" onClick={exportToExcel}>
              Export Excel
            </button>
          </div>
        )}
      </div>

      <div className="table-responsive mt-4">
        <table className="table table-bordered">
          <thead className="table-light">
            <tr>
              <th>SL</th>
              <th>Date</th>
              <th>Type</th>
              <th>Transaction</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Balance</th>
              <th>Narration</th>
            </tr>
          </thead>

          <tbody>
            {ledgerData.length > 0 ? (
              ledgerData.map((row, i) => (
                <tr key={i}>
                  <td>{row.slno || i + 1}</td>
                  <td>
                    {row.date
                      ? new Date(row.date).toLocaleDateString("en-GB")
                      : ""}
                  </td>
                  <td>{row.type}</td>
                  <td>{row.transNo}</td>
                  <td>{Number(row.debit || 0).toFixed(2)}</td>
                  <td>{Number(row.credit || 0).toFixed(2)}</td>
                  <td>
                    {Math.abs(row.balance || 0).toFixed(2)}{" "}
                    {(row.balance || 0) >= 0 ? "Dr" : "Cr"}
                  </td>
                  <td>{row.narration}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center">
                  No Data
                </td>
              </tr>
            )}
          </tbody>

          {ledgerData.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan="4"><b>Total</b></td>
                <td><b>{totalDebit.toFixed(2)}</b></td>
                <td><b>{totalCredit.toFixed(2)}</b></td>
                <td><b>{balanceText}</b></td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default LedgerAll;