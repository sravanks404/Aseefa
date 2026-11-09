import React, { useState, useEffect, useRef } from "react";
import api from '../../apiService';
import DataTable from "react-data-table-component";
import { FaQrcode, FaCopy, FaTimes } from "react-icons/fa";
import Select from 'react-select';

const BankReport = () => {
  const getCurrentDate = () => new Date().toISOString().split("T")[0];
  const getPreviousDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];
  };


  const [fromDate, setFromDate] = useState(getPreviousDate(30));
  const [toDate, setToDate] = useState(getCurrentDate());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(500);
  const [selectedDebit, setSelectedDebit] = useState(null);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [branchOptions, setBranchOptions] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [rawBranchData, setRawBranchData] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // ── Inline QR state ────────────────────────────────────────────────────────
  const [qrImageData, setQrImageData] = useState(null);   // base64 PNG — shown inline
  const [qrUpiString, setQrUpiString] = useState('');
  const [qrLoading,   setQrLoading]   = useState(false);
  const [qrError,     setQrError]     = useState('');
  const [copyToast,   setCopyToast]   = useState(false);
  const qrLibLoaded = useRef(false);

  // Form state
  const [formData, setFormData] = useState({
    Slno: 0, HeadNo: null, BankName: '', GUnder: 9,
    Place: '', Branch: '', PhoneNo1: '', AccNo: '',
    BDate: getCurrentDate(), UserId: null, Isdeleted: 0,
    Companyid: null, Branchid: null, UPIid: ''
  });

  // Custom styles for DataTable
  const customStyles = {
    table:     { style: { border: "1px solid #dee2e6", borderRadius: "8px" } },
    head:      { style: { backgroundColor: "#f8f9fa", minHeight: '42px' } },
    headCells: { style: { fontSize: "13px", fontWeight: "bold", padding: "8px 12px", backgroundColor: "#f1f3f5", color: "#343a40", borderBottom: "1px solid #dee2e6" } },
    rows:      { style: { fontSize: "13px", minHeight: "42px", borderBottom: "1px solid #e9ecef", '&:last-of-type': { borderBottom: 'none' } } },
    cells:     { style: { padding: "8px 12px" } },
  };

  // ── Load qrcode.js from CDN (once) ────────────────────────────────────────
  const loadQRLib = () => new Promise((resolve, reject) => {
    if (window.QRCode) { resolve(); return; }
    if (qrLibLoaded.current) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    s.onload  = () => { qrLibLoaded.current = true; resolve(); };
    s.onerror = () => reject(new Error('Failed to load QR library'));
    document.head.appendChild(s);
  });

  // ── Build UPI payment URI ──────────────────────────────────────────────────
  const buildUPIString = (upiId, bankName) => {
    const p = new URLSearchParams();
    p.set('pa', upiId.trim());
    if (bankName?.trim()) p.set('pn', bankName.trim());
    p.set('cu', 'INR');
    return 'upi://pay?' + p.toString();
  };

  // ── Generate QR and store as base64 (inline, no modal) ────────────────────
  const generateInlineQR = async (upiId, bankName) => {
    if (!upiId?.trim()) {
      setQrImageData(null);
      setQrError('');
      setQrUpiString('');
      return;
    }

    setQrLoading(true);
    setQrError('');
    setQrImageData(null);

    try {
      await loadQRLib();

      const upiString = buildUPIString(upiId, bankName || '');
      setQrUpiString(upiString);

      // Render into a hidden div, extract canvas as PNG
      const tmp = document.createElement('div');
      tmp.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
      document.body.appendChild(tmp);

      // eslint-disable-next-line no-new
      new window.QRCode(tmp, {
        text: upiString,
        width: 160,
        height: 160,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.H
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
  };

  // Clear inline QR when UPI id is cleared / form is reset
  const clearQR = () => {
    setQrImageData(null);
    setQrUpiString('');
    setQrError('');
    setQrLoading(false);
  };

 



  // ── Session / mount ────────────────────────────────────────────────────────
  useEffect(() => {
    const userIdKeys = ["UserID","Userid","userId","userID","user_id","User_Id","USERID","USER_ID","UserId","currentUserId","CurrentUserId"];
    let foundUserId = null;
    userIdKeys.forEach(k => { const v = sessionStorage.getItem(k); if (v) foundUserId = v; });
    const userIdInt = foundUserId ? parseInt(foundUserId, 10) : null;

    const companyKeys = ["CompanyID","Companyid","companyId","companyID","company_id","Company_Id","COMPANYID","COMPANY_ID"];
    let foundCo = null;
    companyKeys.forEach(k => { const v = sessionStorage.getItem(k); if (v) foundCo = v; });
    const companyIdInt = foundCo ? parseInt(foundCo, 10) : null;

    // Check if Companyid is 1 (SuperAdmin)
    const isSA = companyIdInt === 1;
    setIsSuperAdmin(isSA);

    fetchCompanies();
    setFormData(prev => ({ ...prev, UserId: userIdInt }));

    if (!isSA && companyIdInt) {
      setFormData(prev => ({ ...prev, Companyid: companyIdInt, UserId: userIdInt }));
    }
  }, []);

  // Auto-select company for regular users after options load
  useEffect(() => {
    if (!isSuperAdmin && companyOptions.length > 0 && formData.Companyid) {
      const match = companyOptions.find(c => c.value === formData.Companyid);
      if (match && !selectedCompany) {
        setSelectedCompany(match);
        fetchBranches(formData.Companyid);
      }
    }
  }, [companyOptions, formData.Companyid, isSuperAdmin]);

  const fetchCompanies = async () => {
    setLoadingCompanies(true); setError(null);
    try {
      const res = await api.get('/api/companies');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const opts = data.map(c => ({ value: parseInt(c.CompanyId, 10), label: c.CompanyName, original: c }));
      setCompanyOptions(opts);
      if (opts.length === 1) {
        setSelectedCompany(opts[0]);
        setFormData(prev => ({ ...prev, Companyid: opts[0].value }));
        fetchBranches(opts[0].value);
      }
    } catch (err) {
      setError('Failed to load companies: ' + (err.response?.data?.message || err.message));
    } finally { setLoadingCompanies(false); }
  };

  const fetchBranches = async (companyId) => {
    setLoadingBranches(true); setError(null);
    try {
      const res = await api.get(`/api/getbranch?CompanyID=${companyId}`);
      setRawBranchData(res.data);
      if (res.data?.length > 0) {
        const first = res.data[0];
        const idFields = ['id','ID','Id','branchId','BranchId','branchID','BranchID','branch_id','Branch_id','BID','Bid','branchid','Branchid'];
        const idField = idFields.find(f => first[f] !== undefined) || 'index';
        const opts = res.data.map((b, i) => ({
          value: parseInt(idField === 'index' ? i + 1 : b[idField], 10),
          label: b.BranchName || b.branchName || b.Branch || b.branch || b.name || b.Name || `Branch ${i+1}`,
          original: b
        }));
        setBranchOptions(opts);
        if (opts.length === 1) {
          setSelectedBranch(opts[0]);
          setFormData(prev => ({ ...prev, Branchid: opts[0].value }));
        }
      } else { setBranchOptions([]); }
    } catch { setError('Failed to load branches'); }
    finally { setLoadingBranches(false); }
  };

  const handleCompanyChange = (opt) => {
    setSelectedCompany(opt);
    setSelectedBranch(null); setBranchOptions([]);
    if (opt) {
      const id = parseInt(opt.value, 10);
      setFormData(prev => ({ ...prev, Companyid: id, Branchid: null }));
      fetchBranches(id);
    } else {
      setFormData(prev => ({ ...prev, Companyid: null, Branchid: null }));
    }
  };

  const handleBranchChange = (opt) => {
    setSelectedBranch(opt);
    setFormData(prev => ({ ...prev, Branchid: opt ? parseInt(opt.value, 10) : null }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear QR if UPI ID is cleared
    if (name === 'UPIid' && !value.trim()) clearQR();
  };

  const resetFormFields = () => {
    setFormData(prev => ({
      Slno: 0, HeadNo: null, BankName: '', GUnder: 9,
      Place: '', Branch: '', PhoneNo1: '', AccNo: '',
      BDate: getCurrentDate(), UserId: prev.UserId, Isdeleted: 0,
      Companyid: prev.Companyid, Branchid: prev.Branchid, UPIid: ''
    }));
    setIsEditMode(false);
    clearQR();
  };

  const handleSubmit = async () => {
    if (!formData.BankName?.trim())                                                   { alert('⚠️ Bank Name is required.'); return; }
    if (formData.AccNo?.trim() && !/^[0-9]{9,18}$/.test(formData.AccNo.trim()))      { alert('⚠️ Account Number must be 9–18 digits.'); return; }
    if (formData.PhoneNo1?.trim() && !/^[0-9]{10}$/.test(formData.PhoneNo1.trim()))  { alert('⚠️ Phone Number must be exactly 10 digits.'); return; }
    if (!formData.Companyid)                                                          { alert('⚠️ Company selection is required.'); return; }
    if (!formData.Branchid)                                                           { alert('⚠️ Branch selection is required.'); return; }

    setIsSubmitting(true);
    try {
      const acRes = await api.post('/api/InsertUpdateAcHead', {
        HSlNo: 0, HName: formData.BankName, GUnder: 9,
        UserId: formData.UserId ? parseInt(formData.UserId, 10) : null,
        UDate: new Date().toISOString(), Type: 'Bank', OCash: 0,
        Place: formData.Place || null, SuitAppsId: null
      });
      if (!acRes.data?.success) throw new Error(acRes.data?.message || 'AcHead insert failed');

      const bankRes = await api.post('/api/InsertUpdateBank', {
        Slno: 0, HeadNo: parseInt(acRes.data.HSlNo, 10),
        BankName: formData.BankName, GUnder:9,
        Place: formData.Place || null, Branch: formData.Branch || null,
        PhoneNo1: formData.PhoneNo1 || null, AccNo: formData.AccNo || null,
        BDate: formData.BDate || null,
        UserId: formData.UserId ? parseInt(formData.UserId, 10) : null,
        Isdeleted: 0, Companyid: parseInt(formData.Companyid, 10),
        Branchid: parseInt(formData.Branchid, 10), UPIid: formData.UPIid || null
      });
      if (!bankRes.data?.success) throw new Error(bankRes.data?.message || 'Bank insert failed');

      alert('✅ Bank account created successfully!');
      setReportData(prev => [{
        Slno: bankRes.data.Slno || 0, HeadNo: acRes.data.HSlNo,
        BankName: formData.BankName, Branch: formData.Branch,
        Place: formData.Place, AccNo: formData.AccNo,
        PhoneNo1: formData.PhoneNo1, UPIid: formData.UPIid,
        ADate: formData.BDate, Companyid: formData.Companyid, Branchid: formData.Branchid,
        ...(bankRes.data.data || {})
      }, ...prev]);
      resetFormFields();
    } catch (err) {
      alert('❌ Failed to create bank account.\n' + (err.response?.data?.message || err.message));
    } finally { setIsSubmitting(false); }
  };

  const handleUpdate = async () => {
    if (!formData.Slno || formData.Slno === 0)                                        { alert('⚠️ No record selected. Click a table row first.'); return; }
    if (!formData.BankName?.trim())                                                   { alert('⚠️ Bank Name is required.'); return; }
    if (formData.AccNo?.trim() && !/^[0-9]{9,18}$/.test(formData.AccNo.trim()))      { alert('⚠️ Account Number must be 9–18 digits.'); return; }
    if (formData.PhoneNo1?.trim() && !/^[0-9]{10}$/.test(formData.PhoneNo1.trim()))  { alert('⚠️ Phone Number must be exactly 10 digits.'); return; }
    if (!formData.Companyid)                                                          { alert('⚠️ Company selection is required.'); return; }
    if (!formData.Branchid)                                                           { alert('⚠️ Branch selection is required.'); return; }

    setIsSubmitting(true);
    try {
      const payload = {
        Slno: parseInt(formData.Slno, 10),
        HeadNo: formData.HeadNo ? parseInt(formData.HeadNo, 10) : null,
        BankName: formData.BankName, GUnder: 9,
        Place: formData.Place || null, Branch: formData.Branch || null,
        PhoneNo1: formData.PhoneNo1 || null, AccNo: formData.AccNo || null,
        BDate: formData.BDate || null,
        UserId: formData.UserId ? parseInt(formData.UserId, 10) : null,
        Isdeleted: parseInt(formData.Isdeleted, 10) || 0,
        Companyid: parseInt(formData.Companyid, 10),
        Branchid: parseInt(formData.Branchid, 10),
        UPIid: formData.UPIid || null
      };
      const res = await api.post('/api/InsertUpdateBank', payload);
      if (!res.data?.success) throw new Error(res.data?.message || 'Update failed');
      alert('✅ Bank record updated successfully!');
      setReportData(prev => prev.map(item =>
        item.Slno === formData.Slno ? { ...item, ...payload, ADate: formData.BDate } : item
      ));
      resetFormFields();
    } catch (err) {
      alert('❌ Failed to update bank record.\n' + (err.response?.data?.message || err.message));
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!formData.Slno || formData.Slno === 0) { alert('⚠️ No record selected. Click a table row first.'); return; }
    if (!window.confirm(`Delete "${formData.BankName}"? This cannot be undone.`)) return;
    setIsSubmitting(true);
    try {
      const res = await api.post('/api/DeleteBank', { Slno: parseInt(formData.Slno, 10) });
      if (!res.data?.success) throw new Error(res.data?.message || 'Delete failed');
      alert('✅ Bank record deleted successfully!');
      setReportData(prev => prev.filter(item => item.Slno !== formData.Slno));
      resetFormFields();
    } catch (err) {
      alert('❌ Failed to delete bank record.\n' + (err.response?.data?.message || err.message));
    } finally { setIsSubmitting(false); }
  };

  const handleClear = () => {
    const uid = formData.UserId;
    setFromDate(getPreviousDate(30)); setToDate(getCurrentDate());
    setSelectedDebit(null); setSelectedCredit(null);
    setSearchQuery(""); setSelectedBranch(null);
    setIsEditMode(false); setSelectedCompany(null); setBranchOptions([]);
    setFormData({ Slno:0, HeadNo:null, BankName:'', GUnder:9, Place:'', Branch:'',
      PhoneNo1:'', AccNo:'', BDate:getCurrentDate(), UserId:uid,
      Isdeleted:0, Companyid:null, Branchid:null, UPIid:'' });
    clearQR();
  };

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns = [
    { name:"Sl No",     selector:(_,i)=>i+1+(currentPage-1)*rowsPerPage, sortable:false, width:"6%" },
    { name:"Bank Name", selector:r=>r.BankName||"N/A", sortable:true, width:"16%" },
    { name:"Branch",    selector:r=>r.Branch  ||"N/A", sortable:true, width:"13%" },
    { name:"Place",     selector:r=>r.Place   ||"N/A", sortable:true, width:"12%" },
    { name:"A/C Number",selector:r=>r.AccNo   ||"N/A", sortable:true, width:"17%" },
    { name:"Phone No",  selector:r=>r.PhoneNo1||"N/A", sortable:true, width:"12%" },
    { name:"Date",      selector:r=>r.ADate?new Date(r.ADate).toLocaleDateString():"N/A", sortable:true, width:"11%", right:true },
    {
      name:"UPI QR",
      width:"10%",
      center:true,
      cell:(row) => (
        <button
          title={row.UPIid ? `Generate QR for ${row.UPIid}` : 'No UPI ID set'}
          onClick={(e) => {
            e.stopPropagation();
            if (!row.UPIid) { alert('⚠️ No UPI ID set for this record. Please add a UPI ID first.'); return; }
            // Load row into form and generate inline QR
            setFormData(prev => ({
              ...prev, Slno: row.Slno||0, BankName: row.BankName||'',
              Branch: row.Branch||'', Place: row.Place||'',
              PhoneNo1: row.PhoneNo1||'', AccNo: row.AccNo||'',
              UPIid: row.UPIid||'',
              BDate: row.ADate ? new Date(row.ADate).toISOString().split('T')[0] : getCurrentDate(),
              Companyid: row.Companyid||prev.Companyid, Branchid: row.Branchid||prev.Branchid,
              HeadNo: row.HeadNo||null, Isdeleted: row.Isdeleted||0,
            }));
            setIsEditMode(true);
            generateInlineQR(row.UPIid, row.BankName);
            // Scroll to form
            document.getElementById('bankForm')?.scrollIntoView({ behavior:'smooth', block:'start' });
          }}
          style={{
            background: row.UPIid ? 'linear-gradient(135deg,#007bff,#0056b3)' : '#e9ecef',
            border:'none', borderRadius:'6px',
            color: row.UPIid ? '#fff' : '#adb5bd',
            padding:'5px 10px',
            cursor: row.UPIid ? 'pointer' : 'not-allowed',
            display:'inline-flex', alignItems:'center', gap:'5px',
            fontSize:'12px', fontWeight:'500',
            boxShadow: row.UPIid ? '0 2px 6px rgba(0,123,255,0.3)' : 'none',
            opacity: row.UPIid ? 1 : 0.5,
          }}
        >
          <FaQrcode size={12} /> QR
        </button>
      ),
    },
  ];

  const filteredData = reportData.filter(row => {
    const s = searchQuery.toLowerCase();
    return !searchQuery ||
      (row.BankName && row.BankName.toLowerCase().includes(s)) ||
      (row.Branch   && row.Branch.toLowerCase().includes(s))   ||
      (row.Place    && row.Place.toLowerCase().includes(s))    ||
      (row.AccNo    && row.AccNo.toLowerCase().includes(s))    ||
      (row.PhoneNo1 && row.PhoneNo1.toLowerCase().includes(s));
  });

  const CustomFooter = ({ rowCount }) => (
    <div className="d-flex justify-content-between align-items-center">
      <div className="fw-semibold text-dark" style={{ fontSize:'14px' }}>Total Records: {rowCount}</div>
    </div>
  );

  // ── Shared input style ────────────────────────────────────────────────────
  const inputStyle = { width:'100%', padding:'6px 10px', border:'1px solid #ddd', fontSize:'14px', borderRadius:'4px', backgroundColor:'#fff' };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="container-fluid p-4" style={{ backgroundColor:'#fff', minHeight:'100vh' }}>

      {/* ── Company & Branch dropdowns ── */}
      <div style={{ backgroundColor:'#fff', border:'2px solid #7a92ab', padding:'15px', marginBottom:'15px', borderRadius:'4px' }}>
        <div className="row">
          {/* Only show Company dropdown when Companyid is 1 */}
          {isSuperAdmin && (
            <div className="col-md-7">
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:'15px', fontWeight:'bold', display:'block', marginBottom:'5px' }}>
                    Select Company <span style={{ color:'red' }}>*</span>
                  </label>
                  <Select
                    options={companyOptions} value={selectedCompany} onChange={handleCompanyChange}
                    placeholder={loadingCompanies ? "Loading companies..." : "Select a company..."}
                    isClearable isSearchable isLoading={loadingCompanies} isDisabled={loadingCompanies}
                    noOptionsMessage={() => loadingCompanies ? "Loading..." : "No companies found"}
                    styles={{ control: b => ({ ...b, borderColor:'#3d4f5f', backgroundColor:'#fff', minHeight:'38px' }) }}
                  />
                </div>
                <button onClick={fetchCompanies} disabled={loadingCompanies}
                  style={{ marginTop:'24px', padding:'6px 12px', backgroundColor: loadingCompanies?'#ccc':'#007bff',
                    color:'white', border:'none', borderRadius:'4px', cursor: loadingCompanies?'not-allowed':'pointer', opacity: loadingCompanies?0.6:1 }}>
                  {loadingCompanies ? 'Loading...' : 'Refresh'}
                </button>
              </div>
              {!loadingCompanies && companyOptions.length === 0 && (
                <small style={{ color:'#856404', display:'block', marginTop:'5px' }}>⚠️ No companies available. Click Refresh to try again.</small>
              )}
            </div>
          )}
          <div className={isSuperAdmin ? "col-md-3" : "col-md-7"}>
            <label style={{ fontSize:'13px', fontWeight:'bold', display:'block', marginBottom:'5px' }}>
              Select Branch <span style={{ color:'red' }}>*</span>
            </label>
            <Select
              options={branchOptions} value={selectedBranch} onChange={handleBranchChange}
              placeholder={loadingBranches ? "Loading branches..." : !selectedCompany ? "Select a company first" : "Select a branch..."}
              isClearable isSearchable isLoading={loadingBranches}
              isDisabled={!selectedCompany || loadingBranches}
              noOptionsMessage={() => !selectedCompany ? "Select a company first" : "No branches found"}
              styles={{ control: b => ({ ...b, borderColor:'#3d4f5f', backgroundColor:'#fff', minHeight:'38px' }) }}
            />
            {!selectedCompany && <small style={{ color:'#856404', display:'block', marginTop:'5px' }}>⚠️ Please select a company first</small>}
          </div>
        </div>
      </div>

      {/* ── Bank Information Form ── */}
      <div id="bankForm" style={{ backgroundColor:'#ffffff', border:'1px solid #ddd', padding:'30px', marginBottom:'15px', borderRadius:'4px' }}>
        <div className="row g-3">

          {/* Bank Name */}
          <div className="col-md-6">
            <div className="row align-items-center">
              <div className="col-md-4"><label style={{ fontSize:'14px', fontWeight:'500' }}>Bank Name <span style={{ color:'red' }}>*</span></label></div>
              <div className="col-md-8">
                <input type="text" name="BankName" value={formData.BankName} onChange={handleInputChange} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Branch Name */}
          <div className="col-md-6">
            <div className="row align-items-center">
              <div className="col-md-4"><label style={{ fontSize:'14px', fontWeight:'500' }}>Branch Name</label></div>
              <div className="col-md-8">
                <input type="text" name="Branch" value={formData.Branch} onChange={handleInputChange} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Place */}
          <div className="col-md-6">
            <div className="row align-items-center">
              <div className="col-md-4"><label style={{ fontSize:'14px', fontWeight:'500' }}>Place</label></div>
              <div className="col-md-8">
                <input type="text" name="Place" value={formData.Place} onChange={handleInputChange} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* A/C Number */}
          <div className="col-md-6">
            <div className="row align-items-center">
              <div className="col-md-4"><label style={{ fontSize:'14px', fontWeight:'500' }}>A/C Number</label></div>
              <div className="col-md-8">
                <input type="text" name="AccNo" value={formData.AccNo} maxLength={18}
                  onChange={e => { if (e.target.value===''||/^[0-9]+$/.test(e.target.value)) handleInputChange(e); }}
                  style={inputStyle} />
                <small style={{ color:'#6c757d', fontSize:'11px', display:'block', marginTop:'2px' }}>Numbers only (9-18 digits)</small>
              </div>
            </div>
          </div>

          {/* Phone No */}
          <div className="col-md-6">
            <div className="row align-items-center">
              <div className="col-md-4"><label style={{ fontSize:'14px', fontWeight:'500' }}>Phone No</label></div>
              <div className="col-md-8">
                <input type="text" name="PhoneNo1" value={formData.PhoneNo1} maxLength={10}
                  onChange={e => { if (e.target.value===''||/^[0-9]+$/.test(e.target.value)) handleInputChange(e); }}
                  style={inputStyle} />
                <small style={{ color:'#6c757d', fontSize:'11px', display:'block', marginTop:'2px' }}>Numbers only (exactly 10 digits)</small>
              </div>
            </div>
          </div>

          {/* ── UPI ID + inline QR ───────────────────────────────────────────── */}
          <div className="col-md-6">
            <div className="row align-items-start">
              <div className="col-md-4" style={{ paddingTop:'7px' }}>
                <label style={{ fontSize:'14px', fontWeight:'500' }}>UPI ID</label>
              </div>
              <div className="col-md-8">

                {/* Input row */}
                <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                  <input
                    type="text" name="UPIid" value={formData.UPIid}
                    onChange={handleInputChange}
                    placeholder="example@upi"
                    style={{ ...inputStyle, flex:1 }}
                  />
                  {/* QR generate button */}
                  <button
                    type="button"
                    title={formData.UPIid ? 'Generate QR Code' : 'Enter a UPI ID first'}
                    onClick={() => {
                      if (!formData.UPIid?.trim()) { alert('⚠️ Please enter a UPI ID first.'); return; }
                      generateInlineQR(formData.UPIid, formData.BankName);
                    }}
                    style={{
                      padding:'6px 12px', flexShrink:0,
                      background: formData.UPIid ? 'linear-gradient(135deg,#007bff,#0056b3)' : '#e9ecef',
                      border:'none', borderRadius:'4px',
                      color: formData.UPIid ? '#fff' : '#adb5bd',
                      cursor: formData.UPIid ? 'pointer' : 'default',
                      display:'inline-flex', alignItems:'center', gap:'5px',
                      fontSize:'12px', fontWeight:'600',
                      boxShadow: formData.UPIid ? '0 2px 6px rgba(0,123,255,0.3)' : 'none',
                      transition:'all 0.2s', whiteSpace:'nowrap'
                    }}
                  >
                    <FaQrcode size={13} />
                    <span>QR</span>
                  </button>
                </div>

                <small style={{ color:'#6c757d', fontSize:'11px', display:'block', marginTop:'2px' }}>
                  Enter UPI ID · Click <strong>QR</strong> to generate QR code
                </small>

                {/* ── Inline QR display area ── */}
                {(qrLoading || qrImageData || qrError) && (
                  <div style={{
                    marginTop:'12px',
                    background:'#f8f9fa',
                    border:'1px solid #dee2e6',
                    borderRadius:'10px',
                    padding:'14px',
                    display:'flex',
                    flexDirection:'column',
                    alignItems:'center',
                    gap:'10px',
                    position:'relative'
                  }}>
                    {/* Close / clear QR */}
                    <button
                      onClick={clearQR}
                      title="Clear QR"
                      style={{
                        position:'absolute', top:'8px', right:'8px',
                        background:'#dee2e6', border:'none', borderRadius:'50%',
                        width:'22px', height:'22px', cursor:'pointer',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        padding:0, color:'#495057', fontSize:'12px'
                      }}
                    >
                      <FaTimes size={10} />
                    </button>

                    {/* Spinner */}
                    {qrLoading && (
                      <div style={{ textAlign:'center', padding:'16px 0' }}>
                        <div style={{
                          width:'36px', height:'36px', margin:'0 auto 8px',
                          border:'3px solid #dee2e6', borderTop:'3px solid #007bff',
                          borderRadius:'50%', animation:'qrspin 0.7s linear infinite'
                        }} />
                        <style>{`@keyframes qrspin { to { transform:rotate(360deg) } }`}</style>
                        <div style={{ fontSize:'12px', color:'#6c757d' }}>Generating QR code…</div>
                      </div>
                    )}

                    {/* Error */}
                    {qrError && !qrLoading && (
                      <div style={{ fontSize:'12px', color:'#dc3545', textAlign:'center' }}>⚠️ {qrError}</div>
                    )}

                    {/* QR Image */}
                    {qrImageData && !qrLoading && (
                      <>
                        {/* QR with white border */}
                        <div style={{
                          background:'#fff', padding:'10px', borderRadius:'8px',
                          border:'1px solid #dee2e6',
                          boxShadow:'0 2px 10px rgba(0,0,0,0.08)'
                        }}>
                          <img
                            src={qrImageData}
                            alt="UPI QR Code"
                            style={{ width:'160px', height:'160px', display:'block' }}
                          />
                        </div>

                        {/* UPI ID below QR */}
                        <div style={{ fontSize:'12px', color:'#0056b3', fontWeight:'600', textAlign:'center', wordBreak:'break-all' }}>
                          {formData.UPIid}
                        </div>

                        {/* Scan hint */}
                        <div style={{ fontSize:'11px', color:'#6c757d', textAlign:'center' }}>
                          📱 Scan with GPay · PhonePe · Paytm · BHIM
                        </div>

                        {/* Action buttons */}
                        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', justifyContent:'center' }}>
                        
                            
                         
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Copy toast */}
                {copyToast && (
                  <div style={{
                    position:'fixed', bottom:'28px', left:'50%',
                    transform:'translateX(-50%)',
                    background:'#28a745', color:'#fff',
                    padding:'9px 24px', borderRadius:'50px',
                    fontSize:'13px', fontWeight:'500',
                    boxShadow:'0 4px 16px rgba(40,167,69,0.4)',
                    zIndex:9999, pointerEvents:'none'
                  }}>
                    ✓ UPI string copied!
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="col-12">
            <div className="d-flex justify-content-center gap-3 mt-3">
              <button onClick={handleSubmit}
                disabled={isSubmitting||isEditMode||!formData.BankName||!formData.Branchid}
                style={{ padding:'8px 40px', fontSize:'14px', fontWeight:'500', minWidth:'120px', borderRadius:'4px', border:'1px solid #ddd', color:'#fff',
                  backgroundColor:(isSubmitting||isEditMode||!formData.BankName||!formData.Branchid)?'#ccc':'#28a745',
                  cursor:(isSubmitting||isEditMode||!formData.BankName||!formData.Branchid)?'not-allowed':'pointer',
                  opacity:(isSubmitting||isEditMode||!formData.BankName||!formData.Branchid)?0.6:1 }}>
                {isSubmitting?'Submitting...':'Submit'}
              </button>
              <button onClick={handleUpdate}
                disabled={isSubmitting||!isEditMode||!formData.BankName||!formData.Branchid}
                style={{ padding:'8px 40px', fontSize:'14px', fontWeight:'500', minWidth:'120px', borderRadius:'4px', border:'1px solid #ddd', color:'#fff',
                  backgroundColor:(isSubmitting||!isEditMode||!formData.BankName||!formData.Branchid)?'#ccc':'#007bff',
                  cursor:(isSubmitting||!isEditMode||!formData.BankName||!formData.Branchid)?'not-allowed':'pointer',
                  opacity:(isSubmitting||!isEditMode||!formData.BankName||!formData.Branchid)?0.6:1 }}>
                {isSubmitting?'Updating...':'Update'}
              </button>
              <button onClick={handleDelete}
                disabled={isSubmitting||!isEditMode}
                style={{ padding:'8px 40px', fontSize:'14px', fontWeight:'500', minWidth:'120px', borderRadius:'4px', border:'1px solid #ddd', color:'#fff',
                  backgroundColor:(isSubmitting||!isEditMode)?'#ccc':'#dc3545',
                  cursor:(isSubmitting||!isEditMode)?'not-allowed':'pointer',
                  opacity:(isSubmitting||!isEditMode)?0.6:1 }}>
                {isSubmitting?'Deleting...':'Delete'}
              </button>
              <button onClick={handleClear} disabled={isSubmitting}
                style={{ padding:'8px 40px', fontSize:'14px', fontWeight:'500', minWidth:'120px', borderRadius:'4px',
                  border:'1px solid #ddd', color:'#000', backgroundColor:'#fff',
                  cursor:isSubmitting?'not-allowed':'pointer' }}>
                Clear
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── Data Table ── */}
      <div style={{
        backgroundColor:'white', border:'2px solid #7a92ab', borderRadius:'4px',
        height:'calc(100vh - 400px)', maxHeight:'calc(100vh - 400px)',
        display:'flex', flexDirection:'column', overflow:'hidden'
      }}>
        <div style={{ flex:'1 1 auto', overflow:'auto', minHeight:0 }}>
          <DataTable
            columns={columns}
            data={filteredData}
            progressPending={isLoading}
            highlightOnHover striped
            pagination={false}
            customStyles={customStyles}
            dense
            onRowClicked={row => {
              setFormData({
                Slno: row.Slno||0, HeadNo: row.HeadNo||null,
                BankName: row.BankName||'', GUnder:9,
                Place: row.Place||'', Branch: row.Branch||'',
                PhoneNo1: row.PhoneNo1||'', AccNo: row.AccNo||'',
                BDate: row.ADate ? new Date(row.ADate).toISOString().split('T')[0] : getCurrentDate(),
                UserId: formData.UserId, Isdeleted: row.Isdeleted||0,
                Companyid: row.Companyid||formData.Companyid,
                Branchid: row.Branchid||formData.Branchid,
                UPIid: row.UPIid||''
              });
              setIsEditMode(true);
              setSelectedRow(row);
              setIsModalOpen(true);
              // Auto-generate QR if the row has a UPI ID
              if (row.UPIid) {
                generateInlineQR(row.UPIid, row.BankName);
              } else {
                clearQR();
              }
            }}
            noDataComponent={
              <div style={{ padding:'24px', textAlign:'center' }}>
                {error ? `Error: ${error}` : 'No records to display. Submit a new bank record to see it here.'}
              </div>
            }
          />
        </div>
        <div className="border-top bg-light" style={{ flexShrink:0, padding:'12px 20px', borderTop:'2px solid #7a92ab' }}>
          <CustomFooter rowCount={filteredData.length} />
        </div>
      </div>

      {/* ── Row Details Modal ── */}
      {isModalOpen && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog"
          style={{ background:"rgba(0,0,0,0.5)", overflow:"auto", zIndex:1050 }}>
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content shadow-lg rounded">
              <div className="modal-header" style={{ backgroundColor:'#8eadcc', color:'#000', borderBottom:'1px solid #5a7593' }}>
                <h5 className="modal-title fw-bold">Bank Details</h5>
                <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)} />
              </div>
              <div className="modal-body p-4" style={{ backgroundColor:'#c5d7e8' }}>
                {selectedRow && (
                  <div className="container-fluid">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="card shadow-sm p-3" style={{ backgroundColor:'#fff', border:'1px solid #7a92ab' }}>
                          <h5 className="fw-bold" style={{ fontSize:'15px' }}>Bank Information</h5>
                          <ul className="list-unstyled" style={{ fontSize:'13px' }}>
                            <li><strong>Bank Name:</strong> {selectedRow.BankName||"N/A"}</li>
                            <li><strong>Branch:</strong>    {selectedRow.Branch  ||"N/A"}</li>
                            <li><strong>Place:</strong>     {selectedRow.Place   ||"N/A"}</li>
                          </ul>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="card shadow-sm p-3" style={{ backgroundColor:'#fff', border:'1px solid #7a92ab' }}>
                          <h5 className="fw-bold" style={{ fontSize:'15px' }}>Contact Details</h5>
                          <ul className="list-unstyled" style={{ fontSize:'13px' }}>
                            <li><strong>A/C Number:</strong> {selectedRow.AccNo   ||"N/A"}</li>
                            <li><strong>Phone No:</strong>   {selectedRow.PhoneNo1||"N/A"}</li>
                            <li><strong>UPI ID:</strong>     {selectedRow.UPIid   ||"N/A"}</li>
                            <li><strong>Date:</strong>       {selectedRow.ADate ? new Date(selectedRow.ADate).toLocaleDateString() : "N/A"}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ backgroundColor:'#c5d7e8' }}>
                <button type="button" onClick={() => setIsModalOpen(false)}
                  style={{ padding:'5px 35px', fontSize:'14px', fontWeight:'500', backgroundColor:'#007bff', border:'1px solid #0056b3', color:'#fff', borderRadius:'4px', cursor:'pointer', marginRight:'10px' }}>
                  Edit
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)}
                  style={{ padding:'5px 35px', fontSize:'14px', fontWeight:'500', backgroundColor:'#8eadcc', border:'1px solid #5a7593', color:'#000', borderRadius:'4px', cursor:'pointer' }}>
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

export default BankReport;