import React, { useState, useCallback } from 'react';
import api from '../../apiService';
import * as XLSX from 'xlsx';
import moment from 'moment';
import {
  FaUpload,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';

/**
 * IMPORT PTA SALE BILLS
 * ---------------------
 * ✔ Excel Naration support
 * ✔ Safer validation
 * ✔ Correct date formatting
 * ✔ Displays inserted count & failed customers
 */

const ImportExcelBill = () => {
  const [excelFile, setExcelFile] = useState(null);
  const [excelData, setExcelData] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [result, setResult] = useState(null);

  /* ================= REQUIRED EXCEL COLUMNS ================= */
  const excelColumns = [
    'RetailBillNo',
    'BILL DATE',
    'CUSTOMER NAME',
    'INV AMT',
    'Naration'
  ];

  /* ================= FILE UPLOAD ================= */
  const handleFileUpload = useCallback((e) => {
    setError('');
    setSuccess('');
    setResult(null);

    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const workbook = XLSX.read(evt.target.result, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (!raw.length) {
          setError('Excel sheet is empty');
          return;
        }

        const headers = raw[0];

        // 🔴 Validate columns
        const missing = excelColumns.filter(c => !headers.includes(c));
        if (missing.length) {
          setError(`Missing columns: ${missing.join(', ')}`);
          return;
        }

        const rows = raw.slice(1)
          .map(r => ({
            RetailBillNo: parseInt(r[headers.indexOf('RetailBillNo')]) || 0,
            BillDate: r[headers.indexOf('BILL DATE')],
            CustomerName: String(r[headers.indexOf('CUSTOMER NAME')] || '').trim(),
            BillAmount: parseFloat(r[headers.indexOf('INV AMT')]) || 0,
            Naration: String(r[headers.indexOf('Naration')] || '').trim()
          }))
          .filter(r =>
            r.RetailBillNo &&
            r.CustomerName &&
            r.BillAmount > 0
          );

        if (!rows.length) {
          setError('No valid rows found');
          return;
        }

        setExcelFile(file);
        setExcelData(rows);
        setPreviewData(rows.slice(0, 5));
        setSuccess(`Loaded ${rows.length} records successfully`);
      } catch (err) {
        console.error(err);
        setError('Failed to read Excel file');
      }
    };

    reader.readAsArrayBuffer(file);
  }, []);

  /* ================= DATE FORMAT ================= */
  const formatDate = (val) => {
    if (!val) return '';
    const m = moment(
      val,
      ['DD.MM.YYYY', 'DD/MM/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY'],
      true
    );
    return m.isValid() ? m.format('YYYY-MM-DD') : '';
  };

  /* ================= IMPORT ================= */
  const handleImport = async () => {
    if (!excelData.length) {
      setError('No data to import');
      return;
    }

    const payload = excelData
      .map(r => ({
        CustomerName: r.CustomerName,
        RetailBillNo: r.RetailBillNo,
        BillDate: formatDate(r.BillDate),
        BillAmount: r.BillAmount,
        Naration: r.Naration
      }))
      .filter(r =>
        r.RetailBillNo &&
        r.CustomerName &&
        r.BillAmount > 0 &&
        r.BillDate
      );

    if (!payload.length) {
      setError('No valid rows with proper date');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/api/ImportExcelBill', {
        JsonData: payload
      });

      const inserted = res.data.summary || [];
      const failed = res.data.failed || [];

      setResult({ inserted, failed });

      if (failed.length) {
        setError(
          `Some bills failed: ${failed.map(f => f.CustomerName).join(', ')}`
        );
      } else {
        setSuccess(
          `Imported successfully (${inserted[0]?.InsertedCount || 0} bills)`
        );
      }

      // Reset
      setExcelFile(null);
      setExcelData([]);
      setPreviewData([]);
      document.getElementById('excel-file').value = '';
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      const line = err.response?.data?.lineNumber;
      const number = err.response?.data?.number;

      setError(
        `Import failed${line ? ` at line ${line}` : ''}${number ? ` (Error ${number})` : ''}: ${msg}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="container mt-4">
      <h3 className="mb-3">Import PTA Sale Bills</h3>

      <input
        type="file"
        id="excel-file"
        className="form-control mb-3"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileUpload}
        disabled={isLoading}
      />

      {previewData.length > 0 && (
        <table className="table table-bordered table-sm mb-3">
          <thead className="table-light">
            <tr>
              {excelColumns.map(c => <th key={c}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {previewData.map((r, i) => (
              <tr key={i}>
                <td>{r.RetailBillNo}</td>
                <td>{r.BillDate}</td>
                <td>{r.CustomerName}</td>
                <td>{r.BillAmount}</td>
                <td>{r.Naration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {error && (
        <div className="alert alert-danger">
          <FaExclamationTriangle className="me-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <FaCheckCircle className="me-2" />
          {success}
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={handleImport}
        disabled={isLoading || !excelData.length}
      >
        {isLoading ? (
          <>
            <FaSpinner className="fa-spin me-2" />
            Importing…
          </>
        ) : (
          'Import Bills'
        )}
      </button>

      {result?.failed?.length > 0 && (
        <div className="mt-3">
          <h5>Failed Customers</h5>
          <table className="table table-bordered table-sm">
            <thead className="table-light">
              <tr>
                <th>Customer Name</th>
                <th>Retail Bill No</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {result.failed.map((f, i) => (
                <tr key={i}>
                  <td>{f.CustomerName}</td>
                  <td>{f.RetailBillNo}</td>
                  <td>{f.ErrorReason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ImportExcelBill;
