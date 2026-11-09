// import React, { useState, useEffect, useMemo } from "react";
// import api from '../../apiService';
// import DataTable from "react-data-table-component";
// import { FaQrcode } from "react-icons/fa";
// import Select from 'react-select';

// const BankReport = () => {
//   const getCurrentDate = () => new Date().toISOString().split("T")[0];
//   const getPreviousDate = (days) => {
//     const date = new Date();
//     date.setDate(date.getDate() - days);
//     return date.toISOString().split("T")[0];
//   };

//   const [fromDate, setFromDate] = useState(getPreviousDate(30));
//   const [toDate, setToDate] = useState(getCurrentDate());
//   const [isLoading, setIsLoading] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [error, setError] = useState(null);
//   const [reportData, setReportData] = useState([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState(500);
//   const [selectedDebit, setSelectedDebit] = useState(null);
//   const [selectedCredit, setSelectedCredit] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedRow, setSelectedRow] = useState(null);
//   const [branchOptions, setBranchOptions] = useState([]);
//   const [selectedBranch, setSelectedBranch] = useState(null);
//   const [rawBranchData, setRawBranchData] = useState([]);
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [companyOptions, setCompanyOptions] = useState([]);
//   const [selectedCompany, setSelectedCompany] = useState(null);
//   const [isSuperAdmin, setIsSuperAdmin] = useState(false);
//   const [activeQRSlno, setActiveQRSlno] = useState(null);
//   const [isBankListOpen, setIsBankListOpen] = useState(true);
//   const [originalAccNo, setOriginalAccNo] = useState('');  // for confirmation

//   const [formData, setFormData] = useState({
//     Slno: 0, HeadNo: null, BankName: '', GUnder: 9,
//     Place: '', Branch: '', PhoneNo1: '', AccNo: '',
//     BDate: getCurrentDate(), UserId: null, Isdeleted: 0,
//     Companyid: null, Branchid: null, UPIid: '', IFSC: '',
//     Status: 0,
//     AccountName: ''   // ADDED
//   });

//   const sanitizeUpiId = (raw) => {
//     if (!raw || typeof raw !== 'string') return null;
//     let cleaned = raw.replace(/\s+/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
//     const parts = cleaned.split('@');
//     if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
//     const upiRegex = /^[a-zA-Z0-9._\-+]+@[a-zA-Z0-9._\-]+$/;
//     if (!upiRegex.test(cleaned)) return null;
//     return cleaned.toLowerCase();
//   };

//   const buildUPIString = (upiId) => {
//     const cleanUpi = sanitizeUpiId(upiId);
//     if (!cleanUpi) return null;
//     return `upi://pay?pa=${cleanUpi}&cu=INR`;
//   };

//   const buildQRImageUrl = (upiId, size = 150) => {
//     const upiString = buildUPIString(upiId);
//     if (!upiString) return null;
//     return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&ecc=H&data=${encodeURIComponent(upiString)}`;
//   };

//   const resolveHeadNo = (row) => {
//     const fields = ['HeadNo','headNo','HEADNO','Headno','headno','Head_No','head_no','HEAD_NO','HSlNo','hslno','HSLNO','HSlno','Hslno','AcHeadNo','acheadno'];
//     for (const f of fields) { if (row[f] !== undefined && row[f] !== null) return row[f]; }
//     return null;
//   };

//   const resolveSlno = (row) => {
//     const fields = ['Slno','SlNo','slno','SLNO','SLNo','ID','Id','id','BankId','bankId','BANKID'];
//     for (const f of fields) { if (row[f] !== undefined && row[f] !== null) return row[f]; }
//     return 0;
//   };

//   const resolveAccountName = (row) => {
//     const fields = ['AccountName','accountName','account_name','ACCOUNTNAME','AccName','accName','AccHolderName','accountHolderName','HolderName','holderName'];
//     for (const f of fields) { if (row[f] !== undefined && row[f] !== null && row[f] !== '') return row[f]; }
//     return null;
//   };

//   const customStyles = {
//     table:     { style: { borderRadius: '0', border: 'none', width: '100%', tableLayout: 'fixed' } },
//     head:      { style: { backgroundColor: '#f8f9fa', minHeight: '40px' } },
//     headCells: { style: { fontSize: '12px', fontWeight: '700', padding: '8px 14px', backgroundColor: '#f1f3f5', color: '#495057', borderBottom: '2px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.04em' } },
//     rows:      { style: { fontSize: '13px', minHeight: '42px', borderBottom: '1px solid #e9ecef', cursor: 'pointer', '&:hover': { backgroundColor: '#f0f4f8 !important' }, '&:last-of-type': { borderBottom: 'none' } } },
//     cells:     { style: { padding: '8px 14px' } },
//   };

//   const fetchBankData = async (companyId, branchId = null, silent = false) => {
//     if (!companyId) return;
//     if (!silent) setIsLoading(true);
//     setError(null);
//     try {
//       const params = { CompanyId: companyId, ShowAll: 1 };
//       if (branchId) params.BranchId = branchId;
//       const response = await api.get('/api/GetBank', { params });
//       const data = response.data || [];
//       console.log('[GetBank] Sample row keys:', data[0] ? Object.keys(data[0]) : 'no data');
//       console.log('[GetBank] AccountName fields:', data[0] ? Object.entries(data[0]).filter(([k]) => k.toLowerCase().includes('account') || k.toLowerCase().includes('name') || k.toLowerCase().includes('holder')) : 'no data');
//       console.log('[GetBank] Status values:', data.map(r => ({ BankName: r.BankName, Status: r.Status ?? r.status ?? 'MISSING' })));
//       setReportData(data);
//     } catch (err) {
//       setError(err.response?.data?.error || err.message || 'Failed to load bank data');
//       if (!silent) setReportData([]);
//     } finally {
//       if (!silent) setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     const interval = setInterval(() => {
//       if (formData.Companyid) {
//         fetchBankData(formData.Companyid, selectedBranch ? selectedBranch.value : null, true);
//       }
//     }, 5000);
//     return () => clearInterval(interval);
//   }, [formData.Companyid, formData.Branchid]);

//   useEffect(() => {
//     const companyIdVariations = ["CompanyID","Companyid","companyId","companyID","company_id","Company_Id","COMPANYID","COMPANY_ID"];
//     let foundCompanyId = null;
//     companyIdVariations.forEach(k => { const v = sessionStorage.getItem(k); if (v) foundCompanyId = v; });
//     const companyIdInt = foundCompanyId ? parseInt(foundCompanyId, 10) : null;
//     const isSA = companyIdInt === 1;
//     setIsSuperAdmin(isSA);

//     const userIdVariations = ["UserID","Userid","userId","userID","user_id","User_Id","USERID","USER_ID","UserId","currentUserId","CurrentUserId"];
//     let foundUserId = null;
//     userIdVariations.forEach(k => { const v = sessionStorage.getItem(k); if (v) foundUserId = v; });
//     const userIdInt = foundUserId ? parseInt(foundUserId, 10) : null;

//     if (isSA) {
//       fetchCompanies();
//       setFormData(prev => ({ ...prev, UserId: userIdInt }));
//     } else if (companyIdInt) {
//       setFormData(prev => ({ ...prev, Companyid: companyIdInt, UserId: userIdInt }));
//       fetchBranches(companyIdInt, true);
//     }
//   }, []);

//   const fetchBranches = async (companyId, autoFetchData = false) => {
//     try {
//       const response = await api.get(`/api/getbranch?CompanyID=${companyId}`);
//       setRawBranchData(response.data);
//       if (response.data?.length > 0) {
//         const firstBranch = response.data[0];
//         const possibleIdFields = ['id','ID','Id','branchId','BranchId','branchID','BranchID','branch_id','Branch_id','BID','Bid','branchid','Branchid'];
//         let idField = possibleIdFields.find(f => firstBranch[f] !== undefined) || 'index';
//         const options = response.data.map((branch, index) => {
//           const idValue = idField === 'index' ? index + 1 : branch[idField];
//           const label = branch.BranchName || branch.branchName || branch.Branch || branch.branch || branch.name || branch.Name || `Branch ${idValue}`;
//           return { value: parseInt(idValue, 10), label, original: branch };
//         });
//         setBranchOptions(options);
//         if (options.length === 1) {
//           const branchId = parseInt(options[0].value, 10);
//           setSelectedBranch(options[0]);
//           setFormData(prev => ({ ...prev, Branchid: branchId }));
//           if (autoFetchData) fetchBankData(companyId, branchId);
//         } else if (autoFetchData) {
//           fetchBankData(companyId);
//         }
//       } else {
//         setBranchOptions([]);
//         if (autoFetchData) fetchBankData(companyId);
//       }
//     } catch (err) {
//       setError('Failed to load branches');
//     }
//   };

//   const fetchCompanies = async () => {
//     try {
//       const response = await api.get('/api/getcompanies');
//       if (response.data?.length > 0) {
//         const firstCompany = response.data[0];
//         const possibleIdFields = ['id','ID','Id','companyId','CompanyId','companyID','CompanyID','company_id','Company_id','CID','Cid'];
//         let idField = possibleIdFields.find(f => firstCompany[f] !== undefined) || 'index';
//         const options = response.data.map((company, index) => {
//           const idValue = idField === 'index' ? index + 1 : company[idField];
//           const label = company.CompanyName || company.companyName || company.Company || company.name || company.Name || `Company ${idValue}`;
//           return { value: parseInt(idValue, 10), label, original: company };
//         });
//         setCompanyOptions(options);
//       } else {
//         setCompanyOptions([]);
//       }
//     } catch (err) {
//       setError('Failed to load companies');
//     }
//   };

//   const handleBranchChange = (opt) => {
//     setSelectedBranch(opt);
//     if (opt) {
//       const branchId = parseInt(opt.value, 10);
//       setFormData(prev => ({ ...prev, Branchid: branchId }));
//       if (formData.Companyid) fetchBankData(formData.Companyid, branchId);
//     } else {
//       setFormData(prev => ({ ...prev, Branchid: null }));
//       if (formData.Companyid) fetchBankData(formData.Companyid);
//     }
//   };

//   const handleCompanyChange = (opt) => {
//     setSelectedCompany(opt);
//     if (opt) {
//       const companyId = parseInt(opt.value, 10);
//       setFormData(prev => ({ ...prev, Companyid: companyId, Branchid: null }));
//       setSelectedBranch(null);
//       setBranchOptions([]);
//       fetchBranches(companyId);
//       fetchBankData(companyId);
//     } else {
//       setFormData(prev => ({ ...prev, Companyid: null, Branchid: null }));
//       setSelectedBranch(null);
//       setBranchOptions([]);
//       setReportData([]);
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const resetForm = () => {
//     const { Companyid: cid, Branchid: bid, UserId: uid } = formData;
//     setFormData({
//       Slno: 0, HeadNo: null, BankName: '', GUnder: 9,
//       Place: '', Branch: '', PhoneNo1: '', AccNo: '',
//       BDate: getCurrentDate(), UserId: uid, Isdeleted: 0,
//       Companyid: cid, Branchid: bid, UPIid: '', IFSC: '',
//       Status: 0,
//       AccountName: ''   // ADDED
//     });
//     setIsEditMode(false);
//     setActiveQRSlno(null);
//     setOriginalAccNo('');
//   };

//   const handleSubmit = async () => {
//     if (!formData.BankName?.trim())                                                  { alert('⚠️ Bank Name is required.'); return; }
//     if (formData.AccNo?.trim() && !/^[a-zA-Z0-9]{9,18}$/.test(formData.AccNo.trim())) { alert('⚠️ Account Number must be 9-18 alphanumeric characters.'); return; }
//     if (formData.PhoneNo1?.trim() && !/^[0-9]{10}$/.test(formData.PhoneNo1.trim())) { alert('⚠️ Phone Number must be exactly 10 digits.'); return; }
//     if (!formData.Companyid)                                                         { alert('⚠️ Company is required.'); return; }
//     if (!formData.Branchid)                                                          { alert('⚠️ Branch is required.'); return; }

//     const accNoDisplay = formData.AccNo?.trim() || 'Not provided';
//     const confirmMsg = `Please confirm the account details:\n\nBank Name   : ${formData.BankName}\nAccount No  : ${accNoDisplay}\nAccount Name: ${formData.AccountName || 'N/A'}\nBranch      : ${formData.Branch || 'N/A'}\nIFSC        : ${formData.IFSC || 'N/A'}\n\nProceed to submit?`;
//     if (!window.confirm(confirmMsg)) return;

//     setIsSubmitting(true);
//     try {
//       const acRes = await api.post('/api/InsertUpdateAcHead', {
//         HSlNo: 0, HName: formData.BankName, GUnder: 9,
//         UserId: formData.UserId ? parseInt(formData.UserId, 10) : null,
//         UDate: new Date().toISOString(), Type: 'Bank', OCash: 0,
//         Place: formData.Place || null, SuitAppsId: null
//       });
//       if (!acRes.data?.success) throw new Error(acRes.data?.message || 'AcHead insert failed');

//       const bankRes = await api.post('/api/InsertUpdateBank', {
//         Slno: 0, HeadNo: parseInt(acRes.data.HSlNo, 10),
//         BankName: formData.BankName, GUnder: '9',
//         Place: formData.Place || null, Branch: formData.Branch || null,
//         PhoneNo1: formData.PhoneNo1 || null, AccNo: formData.AccNo || null,
//         BDate: formData.BDate || null,
//         UserId: formData.UserId ? parseInt(formData.UserId, 10) : null,
//         Isdeleted: 0, Companyid: parseInt(formData.Companyid, 10),
//         Branchid: parseInt(formData.Branchid, 10),
//         UPIid: formData.UPIid || null, IFSC: formData.IFSC || null,
//         Status: 0,
//         AccountName: formData.AccountName || null,   // ADDED
//       });
//       if (!bankRes.data?.success) throw new Error(bankRes.data?.message || 'Bank insert failed');

//       alert('✅ Bank account created successfully!');
//       fetchBankData(formData.Companyid, selectedBranch ? selectedBranch.value : null);
//       resetForm();
//       setIsBankListOpen(true);
//     } catch (err) {
//       alert('❌ Failed to create bank account.\n' + (err.response?.data?.message || err.message));
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleUpdate = async () => {
//     if (!formData.Slno || formData.Slno === 0)                                       { alert('⚠️ No record selected.'); return; }
//     if (!formData.BankName?.trim())                                                  { alert('⚠️ Bank Name is required.'); return; }
//     if (formData.AccNo?.trim() && !/^[a-zA-Z0-9]{9,18}$/.test(formData.AccNo.trim())) { alert('⚠️ Account Number must be 9-18 alphanumeric characters.'); return; }
//     if (formData.PhoneNo1?.trim() && !/^[0-9]{10}$/.test(formData.PhoneNo1.trim())) { alert('⚠️ Phone Number must be exactly 10 digits.'); return; }
//     if (!formData.Companyid)                                                         { alert('⚠️ Company is required.'); return; }
//     if (!formData.Branchid)                                                          { alert('⚠️ Branch is required.'); return; }

//     const accNoDisplay = formData.AccNo?.trim() || 'Not provided';
//     const confirmMsg = `Please confirm the updated account details:\n\nBank Name   : ${formData.BankName}\nAccount No  : ${accNoDisplay}\nAccount Name: ${formData.AccountName || 'N/A'}\nBranch      : ${formData.Branch || 'N/A'}\nIFSC        : ${formData.IFSC || 'N/A'}\n\nProceed to update?`;
//     if (!window.confirm(confirmMsg)) return;

//     const newStatus   = (formData.Status === 1 || formData.Status === true) ? 1 : 0;
//     const updatedSlno = parseInt(formData.Slno, 10);

//     setIsSubmitting(true);
//     try {
//       const res = await api.post('/api/InsertUpdateBank', {
//         Slno:      updatedSlno,
//         HeadNo:    formData.HeadNo !== null && formData.HeadNo !== undefined ? parseInt(formData.HeadNo, 10) : null,
//         BankName:  formData.BankName,
//         GUnder:    '9',
//         Place:     formData.Place    || null,
//         Branch:    formData.Branch   || null,
//         PhoneNo1:  formData.PhoneNo1 || null,
//         AccNo:     formData.AccNo    || null,
//         BDate:     formData.BDate    || null,
//         UserId:    formData.UserId ? parseInt(formData.UserId, 10) : null,
//         Isdeleted: parseInt(formData.Isdeleted, 10) || 0,
//         Companyid: parseInt(formData.Companyid, 10),
//         Branchid:  parseInt(formData.Branchid,  10),
//         UPIid:     formData.UPIid || null,
//         IFSC:      formData.IFSC  || null,
//         Status:    newStatus,
//         AccountName: formData.AccountName || null,   // ADDED
//       });

//       if (!res.data?.success) throw new Error(res.data?.message || 'Update failed');

//       alert('✅ Bank record updated successfully!');

//       setReportData(prev => prev.map(r => {
//         const rSlno = resolveSlno(r);
//         if (rSlno === updatedSlno) return { ...r, Status: newStatus };
//         return { ...r, Status: 0 };
//       }));

//       fetchBankData(formData.Companyid, selectedBranch ? selectedBranch.value : null);
//       resetForm();
//       setIsBankListOpen(true);

//     } catch (err) {
//       alert('❌ Failed to update bank record.\n' + (err.response?.data?.message || err.message));
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleDelete = async (headNo) => {
//     const resolvedHeadNo = (headNo !== null && headNo !== undefined && headNo !== 0)
//       ? headNo : formData.HeadNo;
//     if (!resolvedHeadNo) { alert("⚠️ Invalid HeadNo. Please select a valid row."); return; }
//     if (!window.confirm("Are you sure you want to delete this bank record?")) return;

//     setIsSubmitting(true);
//     try {
//       const res = await api.post("/api/DeleteBank", { HSlNo: Number(resolvedHeadNo) });
//       const message = res.data?.Message || res.data?.message || "Deleted successfully";
//       alert(`✅ ${message}`);
//       if (formData.Companyid) {
//         fetchBankData(formData.Companyid, selectedBranch ? selectedBranch.value : null);
//       }
//       resetForm();
//       setIsEditMode(false);
//       setIsBankListOpen(true);
//     } catch (err) {
//       console.error("Delete error:", err);
//       alert("❌ Delete failed: " + (err.response?.data?.Message || err.message));
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleClear = () => {
//     const { UserId: uid, Companyid: cid, Branchid: bid } = formData;
//     setSearchQuery("");
//     setIsEditMode(false);
//     setActiveQRSlno(null);
//     setOriginalAccNo('');
//     setFormData({
//       Slno: 0, HeadNo: null, BankName: '', GUnder: 9,
//       Place: '', Branch: '', PhoneNo1: '', AccNo: '',
//       BDate: getCurrentDate(), UserId: uid, Isdeleted: 0,
//       Companyid: cid, Branchid: bid, UPIid: '', IFSC: '',
//       Status: 0,
//       AccountName: ''   // ADDED
//     });
//   };

//   const filteredData = useMemo(() => {
//     if (!reportData || !Array.isArray(reportData)) return [];
//     if (!searchQuery) return reportData;
//     const s = searchQuery.toLowerCase();
//     return reportData.filter((row) =>
//       (row.BankName    && row.BankName.toLowerCase().includes(s))    ||
//       (row.Branch      && row.Branch.toLowerCase().includes(s))      ||
//       (row.Place       && row.Place.toLowerCase().includes(s))       ||
//       (row.AccNo       && row.AccNo.toLowerCase().includes(s))       ||
//       (row.PhoneNo1    && row.PhoneNo1.toLowerCase().includes(s))    ||
//       (row.IFSC        && row.IFSC.toLowerCase().includes(s))        ||
//       (resolveAccountName(row) && resolveAccountName(row).toLowerCase().includes(s)) ||  // ADDED
//       (row.UPIid       && row.UPIid.toLowerCase().includes(s))
//     );
//   }, [reportData, searchQuery]);

//   // ── Raw status from DB row ──
//   const getStatus = (r) => {
//     const val = r.Status ?? r.status ?? r.STATUS ?? r.PrintStatus ?? r.printStatus ?? 0;
//     return parseInt(val, 10);
//   };

//   // ── Single approved Slno: editing+checked wins, else highest Slno among Status=1 ──
//   const printApprovedSlno = useMemo(() => {
//     if (isEditMode && (formData.Status === 1 || formData.Status === true)) {
//       return parseInt(formData.Slno, 10);
//     }
//     const approved = reportData.filter(r => getStatus(r) === 1);
//     if (approved.length === 0) return null;
//     return approved.reduce((maxSlno, r) => {
//       const s = resolveSlno(r);
//       return s > maxSlno ? s : maxSlno;
//     }, -1);
//   }, [reportData, isEditMode, formData.Status, formData.Slno]);

//   // ── Only the printApprovedSlno row shows ✓ Yes ──
//   const getEffectiveStatus = (r) => {
//     return resolveSlno(r) === printApprovedSlno ? 1 : 0;
//   };

//   // ── Check if any OTHER record already has Status=1 ──
//   const otherBankAlreadyApproved = useMemo(() => {
//     return reportData.some(r => {
//       const rSlno = resolveSlno(r);
//       return getStatus(r) === 1 && rSlno !== parseInt(formData.Slno, 10);
//     });
//   }, [reportData, formData.Slno]);

//   const columns = [
//     { name: "Sl No",      selector: (_, i) => i + 1 + (currentPage - 1) * rowsPerPage, sortable: false, width: "5%"  },
//     { name: "Acc. Name",  selector: r => resolveAccountName(r) || "N/A", sortable: true, width: "12%" },  // ADDED
//     { name: "Bank Name",  selector: r => r.BankName    || "N/A", sortable: true, width: "13%" },
//     { name: "Branch",     selector: r => r.Branch      || "N/A", sortable: true, width: "10%" },
//     { name: "Place",      selector: r => r.Place       || "N/A", sortable: true, width: "8%"  },
//     { name: "A/C Number", selector: r => r.AccNo       || "N/A", sortable: true, width: "12%" },
//     { name: "Phone No",   selector: r => r.PhoneNo1    || "N/A", sortable: true, width: "9%"  },
//     { name: "IFSC Code",  selector: r => r.IFSC        || "N/A", sortable: true, width: "9%"  },
//     {
//       name: "Print",
//       sortable: false,
//       width: "6%",
//       cell: (row) => getEffectiveStatus(row) === 1
//         ? <span style={{ fontSize: '11px', fontWeight: '600', backgroundColor: '#d4edda', color: '#155724', padding: '2px 7px', borderRadius: '10px', whiteSpace: 'nowrap' }}>✓ Yes</span>
//         : <span style={{ fontSize: '11px', fontWeight: '600', backgroundColor: '#f8f9fa', color: '#6c757d', padding: '2px 7px', borderRadius: '10px', whiteSpace: 'nowrap' }}>No</span>,
//     },
//     {
//       name: "UPI ID",
//       sortable: true,
//       width: "16%",
//       cell: (row) => {
//         const cleanUpi = sanitizeUpiId(row.UPIid);
//         const qrUrl    = cleanUpi ? buildQRImageUrl(cleanUpi, 140) : null;
//         const isActive = activeQRSlno === row.Slno;
//         return row.UPIid ? (
//           <div style={{ padding: '4px 0', width: '100%' }}>
//             <div
//               onClick={(e) => {
//                 e.stopPropagation();
//                 if (!cleanUpi) { alert(`⚠️ Invalid UPI ID format: "${row.UPIid}"\nExpected format: name@bank`); return; }
//                 setActiveQRSlno(prev => prev === row.Slno ? null : row.Slno);
//               }}
//               style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
//               title={cleanUpi ? 'Click to toggle QR code' : 'Invalid UPI ID format'}
//             >
//               <FaQrcode size={13} style={{ color: isActive ? '#0056b3' : (cleanUpi ? '#007bff' : '#adb5bd'), flexShrink: 0 }} />
//               <span style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: cleanUpi ? '#000' : '#dc3545' }}>
//                 {row.UPIid}
//               </span>
//               {!cleanUpi && <span style={{ fontSize: '10px', color: '#dc3545', flexShrink: 0 }}>⚠️</span>}
//             </div>
//             {isActive && cleanUpi && qrUrl && (
//               <div style={{ marginTop: '8px', padding: '10px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px', textAlign: 'center' }}>
//                 <img src={qrUrl} alt={`QR for ${cleanUpi}`} width={140} height={140}
//                   style={{ display: 'block', margin: '0 auto', border: '1px solid #dee2e6', borderRadius: '4px', backgroundColor: '#fff', padding: '4px' }}
//                   onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'block'; }}
//                 />
//                 <div style={{ display: 'none', color: '#dc3545', fontSize: '11px', marginTop: 4 }}>⚠️ QR load failed</div>
//                 <div style={{ fontSize: '11px', color: '#0056b3', fontWeight: 600, marginTop: '6px' }}>{cleanUpi}</div>
//                 <div style={{ fontSize: '10px', color: '#6c757d', marginTop: '2px' }}>📱 GPay · PhonePe · Paytm · BHIM</div>
//               </div>
//             )}
//           </div>
//         ) : <span style={{ color: '#aaa', fontSize: '12px' }}>N/A</span>;
//       },
//     },
//   ];

//   const card = {
//     backgroundColor: '#fff', border: '1px solid #d8dde4',
//     borderRadius: '6px', padding: '12px 18px',
//     marginBottom: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
//   };
//   const inp = {
//     width: '100%', padding: '5px 10px', border: '1px solid #ccc',
//     borderRadius: '4px', fontSize: '13px', backgroundColor: '#fff',
//     outline: 'none', color: '#333',
//   };
//   const lbl = {
//     fontSize: '13px', fontWeight: '500', color: '#444',
//     marginBottom: '4px', display: 'block',
//   };

//   const isSubmitDisabled = isSubmitting || isEditMode  || !formData.BankName || !formData.Branchid;
//   const isUpdateDisabled = isSubmitting || !isEditMode || !formData.BankName || !formData.Branchid;
//   const isDeleteDisabled = isSubmitting || !isEditMode;

//   const actionBtn = (disabled) => ({
//     padding: '6px 26px', fontSize: '13px', fontWeight: '500',
//     borderRadius: '4px', border: '1px solid #bbb',
//     backgroundColor: disabled ? '#f0f0f0' : '#fff',
//     color: disabled ? '#aaa' : '#333',
//     cursor: disabled ? 'not-allowed' : 'pointer',
//     transition: 'background 0.15s',
//   });

//   return (
//     <div style={{ backgroundColor: '#eef2f7', minHeight: '100vh', padding: '18px 22px', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>

//       <h5 style={{ fontSize: '18px', fontWeight: '700', color: '#1a2533', margin: '0 0 10px 2px' }}>
//         Bank Info
//       </h5>

//       {/* ── Select Company & Branch ── */}
//       <div style={card}>
//         <div className="row g-3">
//           {isSuperAdmin && (
//             <div className="col-md-3">
//               <label style={lbl}>Select Company <span style={{ color: 'red' }}>*</span></label>
//               <Select options={companyOptions} value={selectedCompany} onChange={handleCompanyChange}
//                 placeholder="Select a company..." isClearable isSearchable
//                 styles={{ control: b => ({ ...b, borderColor: '#ccc', minHeight: '32px', fontSize: '13px' }) }} />
//             </div>
//           )}
//           <div className="col-md-3">
//             <label style={lbl}>Select Branch <span style={{ color: 'red' }}>*</span></label>
//             <Select options={branchOptions} value={selectedBranch} onChange={handleBranchChange}
//               placeholder="Select a branch..." isClearable isSearchable
//               isDisabled={isSuperAdmin && !selectedCompany}
//               styles={{ control: b => ({ ...b, borderColor: '#ccc', minHeight: '32px', fontSize: '13px' }) }} />
//           </div>
//         </div>
//       </div>

//       {/* ── Bank Form ── */}
//       <div style={card}>
//         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 28px' }}>

//           {/* ADDED: Account Name field */}
//           <div>
//             <label style={lbl}>Account Name</label>
//             <input type="text" name="AccountName" value={formData.AccountName} onChange={handleInputChange} style={inp} placeholder="e.g. John Doe / Business Name" />
//           </div>

//           <div>
//             <label style={lbl}>Bank Name <span style={{ color: 'red' }}>*</span></label>
//             <input type="text" name="BankName" value={formData.BankName} onChange={handleInputChange} style={inp} />
//           </div>
//           <div>
//             <label style={lbl}>Branch Name</label>
//             <input type="text" name="Branch" value={formData.Branch} onChange={handleInputChange} style={inp} />
//           </div>

//           <div>
//             <label style={lbl}>Place</label>
//             <input type="text" name="Place" value={formData.Place} onChange={handleInputChange} style={inp} />
//           </div>
//           <div>
//             <label style={lbl}>A/C Number</label>
//             <input type="text" name="AccNo" value={formData.AccNo} maxLength={18}
//               onChange={e => {
//                 const val = e.target.value;
//                 if (val !== '' && !/^[a-zA-Z0-9]+$/.test(val)) return;
//                 if (isEditMode && originalAccNo && val !== originalAccNo) {
//                   if (!window.confirm(`⚠️ Are you sure you want to change the A/C Number from "${originalAccNo}" to "${val}"?`)) {
//                     setFormData(prev => ({ ...prev, AccNo: originalAccNo }));
//                     return;
//                   }
//                   setOriginalAccNo(val);
//                 }
//                 handleInputChange(e);
//               }}
//               style={inp} />
//             <small style={{ color: '#888', fontSize: '11px', marginTop: '2px', display: 'block' }}>Alphanumeric only (9-18 characters)</small>
//           </div>

//           <div>
//             <label style={lbl}>Phone No</label>
//             <input type="text" name="PhoneNo1" value={formData.PhoneNo1} maxLength={10}
//               onChange={e => { if (e.target.value === '' || /^[0-9]+$/.test(e.target.value)) handleInputChange(e); }}
//               style={inp} />
//             <small style={{ color: '#888', fontSize: '11px', marginTop: '2px', display: 'block' }}>Numbers only (exactly 10 digits)</small>
//           </div>

//           <div>
//             <label style={lbl}>IFSC Code</label>
//             <input type="text" name="IFSC" value={formData.IFSC} maxLength={11} placeholder="e.g. SBIN0001234"
//               onChange={e => setFormData(prev => ({ ...prev, IFSC: e.target.value.toUpperCase() }))}
//               style={inp} />
//             <small style={{ color: '#888', fontSize: '11px', marginTop: '2px', display: 'block' }}>11-character alphanumeric code</small>

//             {/* ── Print checkbox: only shown when a row is selected (edit mode) ── */}
//             {isEditMode && (
//               <div style={{ marginTop: '8px' }}>
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
//                   <input
//                     type="checkbox"
//                     id="printStatusCheck"
//                     checked={formData.Status === 1 || formData.Status === true}
//                     onChange={e => {
//                       const newStatus = e.target.checked ? 1 : 0;
//                       if (newStatus === 1) {
//                         setReportData(prev => prev.map(r => {
//                           const rSlno = resolveSlno(r);
//                           return rSlno !== formData.Slno ? { ...r, Status: 0 } : r;
//                         }));
//                       }
//                       setFormData(prev => ({ ...prev, Status: newStatus }));
//                     }}
//                   />
//                   <label htmlFor="printStatusCheck"
//                     style={{ fontSize: '13px', fontWeight: '500', color: '#444', cursor: 'pointer', marginBottom: 0 }}>
//                     Print
//                   </label>
//                   <small style={{ color: formData.Status === 1 || formData.Status === true ? '#28a745' : '#6c757d', fontSize: '11px' }}>
//                     {formData.Status === 1 || formData.Status === true ? '(Selected for print)' : '(Not selected for print)'}
//                   </small>
//                 </div>

//                 {(formData.Status === 1 || formData.Status === true) && (
//                   <small style={{ color: '#856404', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', display: 'block', marginTop: '5px' }}>
//                     ⚠️ Selecting this will remove print approval from all other banks.
//                   </small>
//                 )}

//                 {otherBankAlreadyApproved && !(formData.Status === 1 || formData.Status === true) && (
//                   <small style={{ color: '#0c5460', backgroundColor: '#d1ecf1', border: '1px solid #bee5eb', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', display: 'block', marginTop: '5px' }}>
//                     ℹ️ Only one bank can be approved for print at a time. Selecting this will deselect the currently approved bank.
//                   </small>
//                 )}
//               </div>
//             )}
//           </div>

//           <div>
//             <label style={lbl}>UPI ID</label>
//             <input type="text" name="UPIid" value={formData.UPIid} onChange={handleInputChange}
//               placeholder="e.g. merchant@okaxis" style={inp} />
//             {formData.UPIid ? (
//               sanitizeUpiId(formData.UPIid)
//                 ? <small style={{ color: '#28a745', fontSize: '11px', display: 'block', marginTop: '2px' }}>✓ Valid UPI ID</small>
//                 : <small style={{ color: '#dc3545', fontSize: '11px', display: 'block', marginTop: '2px' }}>⚠️ Invalid format — expected name@bank</small>
//             ) : (
//               <small style={{ color: '#888', fontSize: '11px', display: 'block', marginTop: '2px' }}>
//                 Enter UPI ID · Click QR icon in table to preview
//               </small>
//             )}
//           </div>

//         </div>

//         {/* ── Buttons ── */}
//         <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
//           <button onClick={handleSubmit}                        disabled={isSubmitDisabled} style={actionBtn(isSubmitDisabled)}>{isSubmitting ? 'Submitting...' : 'Submit'}</button>
//           <button onClick={handleUpdate}                        disabled={isUpdateDisabled} style={actionBtn(isUpdateDisabled)}>{isSubmitting ? 'Updating...'  : 'Update'}</button>
//           <button onClick={() => handleDelete(formData.HeadNo)} disabled={isDeleteDisabled} style={actionBtn(isDeleteDisabled)}>{isSubmitting ? 'Deleting...'  : 'Delete'}</button>
//           <button onClick={handleClear}                         disabled={isSubmitting}     style={{ ...actionBtn(false), fontWeight: '600' }}>Clear</button>
//         </div>
//       </div>

//       {/* ── Bank List Collapsible ── */}
//       <div style={{ border: '1px solid #d8dde4', borderRadius: '6px', backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

//         <div
//           onClick={() => setIsBankListOpen(prev => !prev)}
//           style={{
//             display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//             padding: '11px 18px',
//             backgroundColor: isBankListOpen ? '#fff' : '#f8f9fa',
//             borderBottom: isBankListOpen ? '1px solid #e0e4ea' : 'none',
//             cursor: 'pointer', userSelect: 'none', transition: 'background 0.15s',
//           }}
//         >
//           <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
//             <span style={{ fontSize: '14px', fontWeight: '700', color: '#2c3e50' }}>Bank List</span>
//             {reportData.length > 0 && (
//               <span style={{ fontSize: '11px', fontWeight: '600', backgroundColor: '#e8f0fe', color: '#1a56db', padding: '2px 8px', borderRadius: '10px' }}>
//                 {filteredData.length}{searchQuery && filteredData.length !== reportData.length ? ` / ${reportData.length}` : ''} records
//               </span>
//             )}
//           </div>

//           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
//             {isBankListOpen && (
//               <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
//                 <svg style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }}
//                   width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
//                   <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
//                 </svg>
//                 <input type="text" placeholder="Search Bank..." value={searchQuery}
//                   onChange={e => setSearchQuery(e.target.value)}
//                   style={{ padding: '5px 28px 5px 28px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', width: '200px', outline: 'none', backgroundColor: '#fff', color: '#333' }}
//                 />
//                 {searchQuery && (
//                   <button onClick={() => setSearchQuery("")} style={{ position: 'absolute', right: '7px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '13px', padding: 0, lineHeight: 1 }}>✕</button>
//                 )}
//               </div>
//             )}
//             <svg style={{ transition: 'transform 0.25s', transform: isBankListOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: '#666', flexShrink: 0 }}
//               width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
//               <polyline points="6 9 12 15 18 9"/>
//             </svg>
//           </div>
//         </div>

//         {isBankListOpen && (
//           <div style={{ maxHeight: 'calc(100vh - 480px)', minHeight: '160px', overflow: 'auto' }}>
//             <DataTable
//               columns={columns}
//               data={filteredData}
//               progressPending={isLoading}
//               progressComponent={<div style={{ padding: '28px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Loading bank data...</div>}
//               highlightOnHover
//               striped
//               pagination={false}
//               customStyles={customStyles}
//               dense
//               onRowClicked={(row) => {
//                 const resolvedHeadNo = resolveHeadNo(row);
//                 const resolvedSlno   = resolveSlno(row);
//                 console.log('[BankReport] Row clicked — HeadNo:', resolvedHeadNo, '| Slno:', resolvedSlno, '| Keys:', Object.keys(row));
//                 setFormData({
//                   Slno: resolvedSlno, HeadNo: resolvedHeadNo,
//                   BankName: row.BankName || '', GUnder: 9,
//                   Place: row.Place || '', Branch: row.Branch || '',
//                   PhoneNo1: row.PhoneNo1 || '', AccNo: row.AccNo || '',
//                   BDate: row.ADate ? new Date(row.ADate).toISOString().split('T')[0] : getCurrentDate(),
//                   UserId: formData.UserId, Isdeleted: row.Isdeleted || 0,
//                   Companyid: row.Companyid || formData.Companyid,
//                   Branchid: row.Branchid || formData.Branchid,
//                   UPIid: row.UPIid || '', IFSC: row.IFSC || '',
//                   Status: getEffectiveStatus(row),
//                   AccountName: resolveAccountName(row) || ''   // ADDED
//                 });
//                 setIsEditMode(true);
//                 setOriginalAccNo(row.AccNo || '');
//                 setSelectedRow(row);
//                 setActiveQRSlno(null);
//                 setIsModalOpen(true);
//               }}
//               noDataComponent={
//                 <div style={{ padding: '32px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>
//                   {error ? `⚠️ ${error}` : 'No records to display.'}
//                 </div>
//               }
//             />
//           </div>
//         )}
//       </div>

//     </div>
//   );
// };

// export default BankReport;
import React, { useState, useEffect, useMemo } from "react";
import api from '../../apiService';
import DataTable from "react-data-table-component";
import { FaQrcode } from "react-icons/fa";
import Select from 'react-select';
import { usePermission } from '../../../src/context/permissionContex'; // match TaskManagement's path
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BankReport = () => {
  // ── Permissions (same style as TaskManagement) ──
  const { getPermission, refreshPermissions } = usePermission();
  const permission = getPermission('BANK');
  const canView   = !!permission?.CanView;
  const canAdd    = !!permission?.CanAdd;
  const canEdit   = !!permission?.CanEdit;
  const canDelete = !!permission?.CanDelete;
  const canPrint  = !!permission?.CanPrint;

  useEffect(() => {
    refreshPermissions();
  }, []);

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [branchOptions, setBranchOptions] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [rawBranchData, setRawBranchData] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [activeQRSlno, setActiveQRSlno] = useState(null);
  const [isBankListOpen, setIsBankListOpen] = useState(true);
  const [originalAccNo, setOriginalAccNo] = useState('');

  const emptyForm = {
    Slno: 0, HeadNo: null, BankName: '', GUnder: 9,
    Place: '', Branch: '', PhoneNo1: '', AccNo: '',
    BDate: getCurrentDate(), UserId: null, Isdeleted: 0,
    Companyid: null, Branchid: null, UPIid: '', IFSC: '',
    Status: 0, AccountName: ''
  };
  const [formData, setFormData] = useState(emptyForm);

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

  const buildQRImageUrl = (upiId, size = 150) => {
    const upiString = buildUPIString(upiId);
    if (!upiString) return null;
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&ecc=H&data=${encodeURIComponent(upiString)}`;
  };

  const resolveHeadNo = (row) => {
    const fields = ['HeadNo','headNo','HEADNO','Headno','headno','Head_No','head_no','HEAD_NO','HSlNo','hslno','HSLNO','HSlno','Hslno','AcHeadNo','acheadno'];
    for (const f of fields) { if (row[f] !== undefined && row[f] !== null) return row[f]; }
    return null;
  };

  const resolveSlno = (row) => {
    const fields = ['Slno','SlNo','slno','SLNO','SLNo','ID','Id','id','BankId','bankId','BANKID'];
    for (const f of fields) { if (row[f] !== undefined && row[f] !== null) return row[f]; }
    return 0;
  };

  const resolveAccountName = (row) => {
    const fields = ['AccountName','accountName','account_name','ACCOUNTNAME','AccName','accName','AccHolderName','accountHolderName','HolderName','holderName'];
    for (const f of fields) { if (row[f] !== undefined && row[f] !== null && row[f] !== '') return row[f]; }
    return null;
  };

  const customStyles = {
    table:     { style: { borderRadius: '0', border: 'none', width: '100%', tableLayout: 'fixed' } },
    head:      { style: { backgroundColor: '#f8f9fa', minHeight: '40px' } },
    headCells: { style: { fontSize: '12px', fontWeight: '700', padding: '8px 14px', backgroundColor: '#f1f3f5', color: '#495057', borderBottom: '2px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.04em' } },
    rows:      { style: { fontSize: '13px', minHeight: '42px', borderBottom: '1px solid #e9ecef', cursor: 'pointer', '&:hover': { backgroundColor: '#f0f4f8 !important' }, '&:last-of-type': { borderBottom: 'none' } } },
    cells:     { style: { padding: '8px 14px' } },
  };

  const fetchBankData = async (companyId, branchId = null, silent = false) => {
    if (!companyId) return;
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const params = { CompanyId: companyId, ShowAll: 1 };
      if (branchId) params.BranchId = branchId;
      const response = await api.get('/api/GetBank', { params });
      setReportData(response.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load bank data');
      toast.error('Failed to fetch bank data');
      if (!silent) setReportData([]);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // ── fetch only when user has view permission (same pattern as TaskManagement) ──
  useEffect(() => {
    if (!canView) {
      setReportData([]);
      return;
    }
    const companyIdVariations = ["CompanyID","Companyid","companyId","companyID","company_id","Company_Id","COMPANYID","COMPANY_ID"];
    let foundCompanyId = null;
    companyIdVariations.forEach(k => { const v = sessionStorage.getItem(k); if (v) foundCompanyId = v; });
    const companyIdInt = foundCompanyId ? parseInt(foundCompanyId, 10) : null;
    const isSA = companyIdInt === 1;
    setIsSuperAdmin(isSA);

    const userIdVariations = ["UserID","Userid","userId","userID","user_id","User_Id","USERID","USER_ID","UserId","currentUserId","CurrentUserId"];
    let foundUserId = null;
    userIdVariations.forEach(k => { const v = sessionStorage.getItem(k); if (v) foundUserId = v; });
    const userIdInt = foundUserId ? parseInt(foundUserId, 10) : null;

    if (isSA) {
      fetchCompanies();
      setFormData(prev => ({ ...prev, UserId: userIdInt }));
    } else if (companyIdInt) {
      setFormData(prev => ({ ...prev, Companyid: companyIdInt, UserId: userIdInt }));
      fetchBranches(companyIdInt, true);
    }
  }, [canView]);

  useEffect(() => {
    if (!canView) return;
    const interval = setInterval(() => {
      if (formData.Companyid) {
        fetchBankData(formData.Companyid, selectedBranch ? selectedBranch.value : null, true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [formData.Companyid, formData.Branchid, canView]);

  const fetchBranches = async (companyId, autoFetchData = false) => {
    try {
      const response = await api.get(`/api/getbranch?CompanyID=${companyId}`);
      setRawBranchData(response.data);
      if (response.data?.length > 0) {
        const firstBranch = response.data[0];
        const possibleIdFields = ['id','ID','Id','branchId','BranchId','branchID','BranchID','branch_id','Branch_id','BID','Bid','branchid','Branchid'];
        let idField = possibleIdFields.find(f => firstBranch[f] !== undefined) || 'index';
        const options = response.data.map((branch, index) => {
          const idValue = idField === 'index' ? index + 1 : branch[idField];
          const label = branch.BranchName || branch.branchName || branch.Branch || branch.branch || branch.name || branch.Name || `Branch ${idValue}`;
          return { value: parseInt(idValue, 10), label, original: branch };
        });
        setBranchOptions(options);
        if (options.length === 1) {
          const branchId = parseInt(options[0].value, 10);
          setSelectedBranch(options[0]);
          setFormData(prev => ({ ...prev, Branchid: branchId }));
          if (autoFetchData) fetchBankData(companyId, branchId);
        } else if (autoFetchData) {
          fetchBankData(companyId);
        }
      } else {
        setBranchOptions([]);
        if (autoFetchData) fetchBankData(companyId);
      }
    } catch (err) {
      setError('Failed to load branches');
      toast.error('Failed to load branches');
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/api/getcompanies');
      if (response.data?.length > 0) {
        const firstCompany = response.data[0];
        const possibleIdFields = ['id','ID','Id','companyId','CompanyId','companyID','CompanyID','company_id','Company_id','CID','Cid'];
        let idField = possibleIdFields.find(f => firstCompany[f] !== undefined) || 'index';
        const options = response.data.map((company, index) => {
          const idValue = idField === 'index' ? index + 1 : company[idField];
          const label = company.CompanyName || company.companyName || company.Company || company.name || company.Name || `Company ${idValue}`;
          return { value: parseInt(idValue, 10), label, original: company };
        });
        setCompanyOptions(options);
      } else {
        setCompanyOptions([]);
      }
    } catch (err) {
      setError('Failed to load companies');
      toast.error('Failed to load companies');
    }
  };

  const handleBranchChange = (opt) => {
    setSelectedBranch(opt);
    if (opt) {
      const branchId = parseInt(opt.value, 10);
      setFormData(prev => ({ ...prev, Branchid: branchId }));
      if (formData.Companyid) fetchBankData(formData.Companyid, branchId);
    } else {
      setFormData(prev => ({ ...prev, Branchid: null }));
      if (formData.Companyid) fetchBankData(formData.Companyid);
    }
  };

  const handleCompanyChange = (opt) => {
    setSelectedCompany(opt);
    if (opt) {
      const companyId = parseInt(opt.value, 10);
      setFormData(prev => ({ ...prev, Companyid: companyId, Branchid: null }));
      setSelectedBranch(null);
      setBranchOptions([]);
      fetchBranches(companyId);
      fetchBankData(companyId);
    } else {
      setFormData(prev => ({ ...prev, Companyid: null, Branchid: null }));
      setSelectedBranch(null);
      setBranchOptions([]);
      setReportData([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    const { Companyid: cid, Branchid: bid, UserId: uid } = formData;
    setFormData({ ...emptyForm, Companyid: cid, Branchid: bid, UserId: uid });
    setIsEditMode(false);
    setActiveQRSlno(null);
    setOriginalAccNo('');
  };

  // ── Toast-based confirm, mirroring TaskManagement's confirmDeleteToast ──
  const confirmActionToast = (message) =>
    new Promise((resolve) => {
      const toastId = toast.warning(
        () => (
          <div>
            <div className="mb-2">{message}</div>
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-danger btn-sm" onClick={() => { toast.dismiss(toastId); resolve(true); }}>Yes</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { toast.dismiss(toastId); resolve(false); }}>Cancel</button>
            </div>
          </div>
        ),
        { position: 'top-center', autoClose: false, closeOnClick: false, draggable: false, closeButton: false }
      );
    });

  const handleSubmit = async () => {
    if (!canAdd) { toast.error('You do not have permission to create bank records.'); return; }

    if (!formData.BankName?.trim())                                                  { toast.error('Bank Name is required.'); return; }
    if (formData.AccNo?.trim() && !/^[a-zA-Z0-9]{9,18}$/.test(formData.AccNo.trim())) { toast.error('Account Number must be 9-18 alphanumeric characters.'); return; }
    if (formData.PhoneNo1?.trim() && !/^[0-9]{10}$/.test(formData.PhoneNo1.trim())) { toast.error('Phone Number must be exactly 10 digits.'); return; }
    if (!formData.Companyid)                                                         { toast.error('Company is required.'); return; }
    if (!formData.Branchid)                                                          { toast.error('Branch is required.'); return; }

    const accNoDisplay = formData.AccNo?.trim() || 'Not provided';
    const confirmed = await confirmActionToast(
      `Confirm: ${formData.BankName} · A/C ${accNoDisplay} · ${formData.AccountName || 'N/A'}. Proceed to submit?`
    );
    if (!confirmed) return;

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
        BankName: formData.BankName, GUnder: '9',
        Place: formData.Place || null, Branch: formData.Branch || null,
        PhoneNo1: formData.PhoneNo1 || null, AccNo: formData.AccNo || null,
        BDate: formData.BDate || null,
        UserId: formData.UserId ? parseInt(formData.UserId, 10) : null,
        Isdeleted: 0, Companyid: parseInt(formData.Companyid, 10),
        Branchid: parseInt(formData.Branchid, 10),
        UPIid: formData.UPIid || null, IFSC: formData.IFSC || null,
        Status: 0, AccountName: formData.AccountName || null,
      });
      if (!bankRes.data?.success) throw new Error(bankRes.data?.message || 'Bank insert failed');

      toast.success('Bank account created successfully!');
      fetchBankData(formData.Companyid, selectedBranch ? selectedBranch.value : null);
      resetForm();
      setIsBankListOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create bank account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!canEdit) { toast.error('You do not have permission to update bank records.'); return; }

    if (!formData.Slno || formData.Slno === 0)                                       { toast.error('No record selected.'); return; }
    if (!formData.BankName?.trim())                                                  { toast.error('Bank Name is required.'); return; }
    if (formData.AccNo?.trim() && !/^[a-zA-Z0-9]{9,18}$/.test(formData.AccNo.trim())) { toast.error('Account Number must be 9-18 alphanumeric characters.'); return; }
    if (formData.PhoneNo1?.trim() && !/^[0-9]{10}$/.test(formData.PhoneNo1.trim())) { toast.error('Phone Number must be exactly 10 digits.'); return; }
    if (!formData.Companyid)                                                         { toast.error('Company is required.'); return; }
    if (!formData.Branchid)                                                          { toast.error('Branch is required.'); return; }

    if ((formData.Status === 1 || formData.Status === true) && !canPrint) {
      toast.error('You do not have permission to change print approval status.');
      return;
    }

    const accNoDisplay = formData.AccNo?.trim() || 'Not provided';
    const confirmed = await confirmActionToast(
      `Confirm update: ${formData.BankName} · A/C ${accNoDisplay} · ${formData.AccountName || 'N/A'}. Proceed?`
    );
    if (!confirmed) return;

    const newStatus   = (formData.Status === 1 || formData.Status === true) ? 1 : 0;
    const updatedSlno = parseInt(formData.Slno, 10);

    setIsSubmitting(true);
    try {
      const res = await api.post('/api/InsertUpdateBank', {
        Slno:      updatedSlno,
        HeadNo:    formData.HeadNo !== null && formData.HeadNo !== undefined ? parseInt(formData.HeadNo, 10) : null,
        BankName:  formData.BankName,
        GUnder:    '9',
        Place:     formData.Place    || null,
        Branch:    formData.Branch   || null,
        PhoneNo1:  formData.PhoneNo1 || null,
        AccNo:     formData.AccNo    || null,
        BDate:     formData.BDate    || null,
        UserId:    formData.UserId ? parseInt(formData.UserId, 10) : null,
        Isdeleted: parseInt(formData.Isdeleted, 10) || 0,
        Companyid: parseInt(formData.Companyid, 10),
        Branchid:  parseInt(formData.Branchid,  10),
        UPIid:     formData.UPIid || null,
        IFSC:      formData.IFSC  || null,
        Status:    newStatus,
        AccountName: formData.AccountName || null,
      });

      if (!res.data?.success) throw new Error(res.data?.message || 'Update failed');

      toast.success('Bank record updated successfully!');

      setReportData(prev => prev.map(r => {
        const rSlno = resolveSlno(r);
        if (rSlno === updatedSlno) return { ...r, Status: newStatus };
        return { ...r, Status: 0 };
      }));

      fetchBankData(formData.Companyid, selectedBranch ? selectedBranch.value : null);
      resetForm();
      setIsBankListOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update bank record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (headNo) => {
    if (!canDelete) { toast.error('You do not have permission to delete bank records.'); return; }

    const resolvedHeadNo = (headNo !== null && headNo !== undefined && headNo !== 0)
      ? headNo : formData.HeadNo;
    if (!resolvedHeadNo) { toast.error('Invalid HeadNo. Please select a valid row.'); return; }

    const confirmed = await confirmActionToast('Are you sure you want to delete this bank record?');
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const res = await api.post("/api/DeleteBank", { HSlNo: Number(resolvedHeadNo) });
      const message = res.data?.Message || res.data?.message || "Deleted successfully";
      toast.success(message);
      if (formData.Companyid) {
        fetchBankData(formData.Companyid, selectedBranch ? selectedBranch.value : null);
      }
      resetForm();
      setIsEditMode(false);
      setIsBankListOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.Message || err.message || 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    const { UserId: uid, Companyid: cid, Branchid: bid } = formData;
    setSearchQuery("");
    setIsEditMode(false);
    setActiveQRSlno(null);
    setOriginalAccNo('');
    setFormData({ ...emptyForm, Companyid: cid, Branchid: bid, UserId: uid });
    toast.dismiss();
  };

  const handleCreateNew = () => {
    if (!canAdd) { toast.error('You do not have permission to create bank records.'); return; }
    handleClear();
  };

  const filteredData = useMemo(() => {
    if (!reportData || !Array.isArray(reportData)) return [];
    if (!searchQuery) return reportData;
    const s = searchQuery.toLowerCase();
    return reportData.filter((row) =>
      (row.BankName    && row.BankName.toLowerCase().includes(s))    ||
      (row.Branch      && row.Branch.toLowerCase().includes(s))      ||
      (row.Place       && row.Place.toLowerCase().includes(s))       ||
      (row.AccNo       && row.AccNo.toLowerCase().includes(s))       ||
      (row.PhoneNo1    && row.PhoneNo1.toLowerCase().includes(s))    ||
      (row.IFSC        && row.IFSC.toLowerCase().includes(s))        ||
      (resolveAccountName(row) && resolveAccountName(row).toLowerCase().includes(s)) ||
      (row.UPIid       && row.UPIid.toLowerCase().includes(s))
    );
  }, [reportData, searchQuery]);

  const getStatus = (r) => {
    const val = r.Status ?? r.status ?? r.STATUS ?? r.PrintStatus ?? r.printStatus ?? 0;
    return parseInt(val, 10);
  };

  const printApprovedSlno = useMemo(() => {
    if (isEditMode && (formData.Status === 1 || formData.Status === true)) {
      return parseInt(formData.Slno, 10);
    }
    const approved = reportData.filter(r => getStatus(r) === 1);
    if (approved.length === 0) return null;
    return approved.reduce((maxSlno, r) => {
      const s = resolveSlno(r);
      return s > maxSlno ? s : maxSlno;
    }, -1);
  }, [reportData, isEditMode, formData.Status, formData.Slno]);

  const getEffectiveStatus = (r) => resolveSlno(r) === printApprovedSlno ? 1 : 0;

  const otherBankAlreadyApproved = useMemo(() => {
    return reportData.some(r => {
      const rSlno = resolveSlno(r);
      return getStatus(r) === 1 && rSlno !== parseInt(formData.Slno, 10);
    });
  }, [reportData, formData.Slno]);

  const columns = [
    { name: "Sl No",      selector: (_, i) => i + 1 + (currentPage - 1) * rowsPerPage, sortable: false, width: "5%"  },
    { name: "Acc. Name",  selector: r => resolveAccountName(r) || "N/A", sortable: true, width: "12%" },
    { name: "Bank Name",  selector: r => r.BankName    || "N/A", sortable: true, width: "13%" },
    { name: "Branch",     selector: r => r.Branch      || "N/A", sortable: true, width: "10%" },
    { name: "Place",      selector: r => r.Place       || "N/A", sortable: true, width: "8%"  },
    { name: "A/C Number", selector: r => r.AccNo       || "N/A", sortable: true, width: "12%" },
    { name: "Phone No",   selector: r => r.PhoneNo1    || "N/A", sortable: true, width: "9%"  },
    { name: "IFSC Code",  selector: r => r.IFSC        || "N/A", sortable: true, width: "9%"  },
    {
      name: "Print", sortable: false, width: "6%",
      cell: (row) => getEffectiveStatus(row) === 1
        ? <span style={{ fontSize: '11px', fontWeight: '600', backgroundColor: '#d4edda', color: '#155724', padding: '2px 7px', borderRadius: '10px', whiteSpace: 'nowrap' }}>✓ Yes</span>
        : <span style={{ fontSize: '11px', fontWeight: '600', backgroundColor: '#f8f9fa', color: '#6c757d', padding: '2px 7px', borderRadius: '10px', whiteSpace: 'nowrap' }}>No</span>,
    },
    {
      name: "UPI ID", sortable: true, width: "16%",
      cell: (row) => {
        const cleanUpi = sanitizeUpiId(row.UPIid);
        const qrUrl    = cleanUpi ? buildQRImageUrl(cleanUpi, 140) : null;
        const isActive = activeQRSlno === row.Slno;
        return row.UPIid ? (
          <div style={{ padding: '4px 0', width: '100%' }}>
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (!cleanUpi) { toast.error(`Invalid UPI ID format: "${row.UPIid}" (expected name@bank)`); return; }
                setActiveQRSlno(prev => prev === row.Slno ? null : row.Slno);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              title={cleanUpi ? 'Click to toggle QR code' : 'Invalid UPI ID format'}
            >
              <FaQrcode size={13} style={{ color: isActive ? '#0056b3' : (cleanUpi ? '#007bff' : '#adb5bd'), flexShrink: 0 }} />
              <span style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: cleanUpi ? '#000' : '#dc3545' }}>
                {row.UPIid}
              </span>
              {!cleanUpi && <span style={{ fontSize: '10px', color: '#dc3545', flexShrink: 0 }}>⚠️</span>}
            </div>
            {isActive && cleanUpi && qrUrl && (
              <div style={{ marginTop: '8px', padding: '10px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px', textAlign: 'center' }}>
                <img src={qrUrl} alt={`QR for ${cleanUpi}`} width={140} height={140}
                  style={{ display: 'block', margin: '0 auto', border: '1px solid #dee2e6', borderRadius: '4px', backgroundColor: '#fff', padding: '4px' }}
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'block'; }}
                />
                <div style={{ display: 'none', color: '#dc3545', fontSize: '11px', marginTop: 4 }}>⚠️ QR load failed</div>
                <div style={{ fontSize: '11px', color: '#0056b3', fontWeight: 600, marginTop: '6px' }}>{cleanUpi}</div>
                <div style={{ fontSize: '10px', color: '#6c757d', marginTop: '2px' }}>📱 GPay · PhonePe · Paytm · BHIM</div>
              </div>
            )}
          </div>
        ) : <span style={{ color: '#aaa', fontSize: '12px' }}>N/A</span>;
      },
    },
  ];

  const card = { backgroundColor: '#fff', border: '1px solid #d8dde4', borderRadius: '6px', padding: '12px 18px', marginBottom: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' };
  const inp  = { width: '100%', padding: '5px 10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', backgroundColor: '#fff', outline: 'none', color: '#333' };
  const lbl  = { fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '4px', display: 'block' };

  const isSubmitDisabled = isSubmitting || isEditMode  || !formData.BankName || !formData.Branchid || !canAdd;
  const isUpdateDisabled = isSubmitting || !isEditMode || !formData.BankName || !formData.Branchid || !canEdit;
  const isDeleteDisabled = isSubmitting || !isEditMode || !canDelete;

  const actionBtn = (disabled) => ({
    padding: '6px 26px', fontSize: '13px', fontWeight: '500',
    borderRadius: '4px', border: '1px solid #bbb',
    backgroundColor: disabled ? '#f0f0f0' : '#fff',
    color: disabled ? '#aaa' : '#333',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background 0.15s',
  });

  // ── Access-denied view, same pattern as TaskManagement ──
  if (!canView) {
    return (
      <div style={{ backgroundColor: '#eef2f7', minHeight: '100vh', padding: '18px 22px' }}>
        <ToastContainer position="top-center" autoClose={3000} />
        <div className="alert alert-danger">You do not have permission to view Bank Info.</div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#eef2f7', minHeight: '100vh', padding: '18px 22px', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      <ToastContainer position="top-center" autoClose={3000} />

      <h5 style={{ fontSize: '18px', fontWeight: '700', color: '#1a2533', margin: '0 0 10px 2px' }}>
        Bank Info
      </h5>

      {/* ── Select Company & Branch ── */}
      <div style={card}>
        <div className="row g-3">
          {isSuperAdmin && (
            <div className="col-md-3">
              <label style={lbl}>Select Company <span style={{ color: 'red' }}>*</span></label>
              <Select options={companyOptions} value={selectedCompany} onChange={handleCompanyChange}
                placeholder="Select a company..." isClearable isSearchable
                styles={{ control: b => ({ ...b, borderColor: '#ccc', minHeight: '32px', fontSize: '13px' }) }} />
            </div>
          )}
          <div className="col-md-3">
            <label style={lbl}>Select Branch <span style={{ color: 'red' }}>*</span></label>
            <Select options={branchOptions} value={selectedBranch} onChange={handleBranchChange}
              placeholder="Select a branch..." isClearable isSearchable
              isDisabled={isSuperAdmin && !selectedCompany}
              styles={{ control: b => ({ ...b, borderColor: '#ccc', minHeight: '32px', fontSize: '13px' }) }} />
          </div>
        </div>
      </div>

      {/* ── Bank Form (only if user can add or edit) ── */}
      {(canAdd || canEdit) && (
        <div style={card}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 28px' }}>

            <div>
              <label style={lbl}>Account Name</label>
              <input type="text" name="AccountName" value={formData.AccountName} onChange={handleInputChange} style={inp}
                placeholder="e.g. John Doe / Business Name" disabled={isEditMode ? !canEdit : !canAdd} />
            </div>

            <div>
              <label style={lbl}>Bank Name <span style={{ color: 'red' }}>*</span></label>
              <input type="text" name="BankName" value={formData.BankName} onChange={handleInputChange} style={inp} disabled={isEditMode ? !canEdit : !canAdd} />
            </div>
            <div>
              <label style={lbl}>Branch Name</label>
              <input type="text" name="Branch" value={formData.Branch} onChange={handleInputChange} style={inp} disabled={isEditMode ? !canEdit : !canAdd} />
            </div>

            <div>
              <label style={lbl}>Place</label>
              <input type="text" name="Place" value={formData.Place} onChange={handleInputChange} style={inp} disabled={isEditMode ? !canEdit : !canAdd} />
            </div>
            <div>
              <label style={lbl}>A/C Number</label>
              <input type="text" name="AccNo" value={formData.AccNo} maxLength={18}
                disabled={isEditMode ? !canEdit : !canAdd}
                onChange={e => {
                  const val = e.target.value;
                  if (val !== '' && !/^[a-zA-Z0-9]+$/.test(val)) return;
                  if (isEditMode && originalAccNo && val !== originalAccNo) {
                    if (!window.confirm(`Change A/C Number from "${originalAccNo}" to "${val}"?`)) {
                      setFormData(prev => ({ ...prev, AccNo: originalAccNo }));
                      return;
                    }
                    setOriginalAccNo(val);
                  }
                  handleInputChange(e);
                }}
                style={inp} />
              <small style={{ color: '#888', fontSize: '11px', marginTop: '2px', display: 'block' }}>Alphanumeric only (9-18 characters)</small>
            </div>

            <div>
              <label style={lbl}>Phone No</label>
              <input type="text" name="PhoneNo1" value={formData.PhoneNo1} maxLength={10}
                disabled={isEditMode ? !canEdit : !canAdd}
                onChange={e => { if (e.target.value === '' || /^[0-9]+$/.test(e.target.value)) handleInputChange(e); }}
                style={inp} />
              <small style={{ color: '#888', fontSize: '11px', marginTop: '2px', display: 'block' }}>Numbers only (exactly 10 digits)</small>
            </div>

            <div>
              <label style={lbl}>IFSC Code</label>
              <input type="text" name="IFSC" value={formData.IFSC} maxLength={11} placeholder="e.g. SBIN0001234"
                disabled={isEditMode ? !canEdit : !canAdd}
                onChange={e => setFormData(prev => ({ ...prev, IFSC: e.target.value.toUpperCase() }))}
                style={inp} />
              <small style={{ color: '#888', fontSize: '11px', marginTop: '2px', display: 'block' }}>11-character alphanumeric code</small>

              {isEditMode && canPrint && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <input
                      type="checkbox"
                      id="printStatusCheck"
                      checked={formData.Status === 1 || formData.Status === true}
                      onChange={e => {
                        const newStatus = e.target.checked ? 1 : 0;
                        if (newStatus === 1) {
                          setReportData(prev => prev.map(r => {
                            const rSlno = resolveSlno(r);
                            return rSlno !== formData.Slno ? { ...r, Status: 0 } : r;
                          }));
                        }
                        setFormData(prev => ({ ...prev, Status: newStatus }));
                      }}
                    />
                    <label htmlFor="printStatusCheck" style={{ fontSize: '13px', fontWeight: '500', color: '#444', cursor: 'pointer', marginBottom: 0 }}>Print</label>
                    <small style={{ color: formData.Status === 1 || formData.Status === true ? '#28a745' : '#6c757d', fontSize: '11px' }}>
                      {formData.Status === 1 || formData.Status === true ? '(Selected for print)' : '(Not selected for print)'}
                    </small>
                  </div>

                  {(formData.Status === 1 || formData.Status === true) && (
                    <small style={{ color: '#856404', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', display: 'block', marginTop: '5px' }}>
                      ⚠️ Selecting this will remove print approval from all other banks.
                    </small>
                  )}

                  {otherBankAlreadyApproved && !(formData.Status === 1 || formData.Status === true) && (
                    <small style={{ color: '#0c5460', backgroundColor: '#d1ecf1', border: '1px solid #bee5eb', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', display: 'block', marginTop: '5px' }}>
                      ℹ️ Only one bank can be approved for print at a time. Selecting this will deselect the currently approved bank.
                    </small>
                  )}
                </div>
              )}

              {isEditMode && !canPrint && (
                <small style={{ color: '#888', fontSize: '11px', marginTop: '8px', display: 'block' }}>
                  ℹ️ You don't have permission to change print approval status.
                </small>
              )}
            </div>

            <div>
              <label style={lbl}>UPI ID</label>
              <input type="text" name="UPIid" value={formData.UPIid} onChange={handleInputChange}
                placeholder="e.g. merchant@okaxis" style={inp} disabled={isEditMode ? !canEdit : !canAdd} />
              {formData.UPIid ? (
                sanitizeUpiId(formData.UPIid)
                  ? <small style={{ color: '#28a745', fontSize: '11px', display: 'block', marginTop: '2px' }}>✓ Valid UPI ID</small>
                  : <small style={{ color: '#dc3545', fontSize: '11px', display: 'block', marginTop: '2px' }}>⚠️ Invalid format — expected name@bank</small>
              ) : (
                <small style={{ color: '#888', fontSize: '11px', display: 'block', marginTop: '2px' }}>Enter UPI ID · Click QR icon in table to preview</small>
              )}
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
            {canAdd    && <button onClick={handleSubmit} disabled={isSubmitDisabled} style={actionBtn(isSubmitDisabled)}>{isSubmitting ? 'Submitting...' : 'Submit'}</button>}
            {canEdit   && <button onClick={handleUpdate} disabled={isUpdateDisabled} style={actionBtn(isUpdateDisabled)}>{isSubmitting ? 'Updating...'  : 'Update'}</button>}
            {canDelete && <button onClick={() => handleDelete(formData.HeadNo)} disabled={isDeleteDisabled} style={actionBtn(isDeleteDisabled)}>{isSubmitting ? 'Deleting...'  : 'Delete'}</button>}
            <button onClick={handleClear} disabled={isSubmitting} style={{ ...actionBtn(false), fontWeight: '600' }}>Clear</button>
          </div>
        </div>
      )}

      {/* ── Bank List Collapsible ── */}
      <div style={{ border: '1px solid #d8dde4', borderRadius: '6px', backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div
          onClick={() => setIsBankListOpen(prev => !prev)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '11px 18px',
            backgroundColor: isBankListOpen ? '#fff' : '#f8f9fa',
            borderBottom: isBankListOpen ? '1px solid #e0e4ea' : 'none',
            cursor: 'pointer', userSelect: 'none', transition: 'background 0.15s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#2c3e50' }}>Bank List</span>
            {reportData.length > 0 && (
              <span style={{ fontSize: '11px', fontWeight: '600', backgroundColor: '#e8f0fe', color: '#1a56db', padding: '2px 8px', borderRadius: '10px' }}>
                {filteredData.length}{searchQuery && filteredData.length !== reportData.length ? ` / ${reportData.length}` : ''} records
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isBankListOpen && (
              <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                <svg style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }}
                  width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="text" placeholder="Search Bank..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ padding: '5px 28px 5px 28px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', width: '200px', outline: 'none', backgroundColor: '#fff', color: '#333' }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} style={{ position: 'absolute', right: '7px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '13px', padding: 0, lineHeight: 1 }}>✕</button>
                )}
              </div>
            )}
            <svg style={{ transition: 'transform 0.25s', transform: isBankListOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: '#666', flexShrink: 0 }}
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        {isBankListOpen && (
          <div style={{ maxHeight: 'calc(100vh - 480px)', minHeight: '160px', overflow: 'auto' }}>
            <DataTable
              columns={columns}
              data={filteredData}
              progressPending={isLoading}
              progressComponent={<div style={{ padding: '28px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Loading bank data...</div>}
              highlightOnHover
              striped
              pagination={false}
              customStyles={customStyles}
              dense
              onRowClicked={(row) => {
                const resolvedHeadNo = resolveHeadNo(row);
                const resolvedSlno   = resolveSlno(row);
                setFormData({
                  Slno: resolvedSlno, HeadNo: resolvedHeadNo,
                  BankName: row.BankName || '', GUnder: 9,
                  Place: row.Place || '', Branch: row.Branch || '',
                  PhoneNo1: row.PhoneNo1 || '', AccNo: row.AccNo || '',
                  BDate: row.ADate ? new Date(row.ADate).toISOString().split('T')[0] : getCurrentDate(),
                  UserId: formData.UserId, Isdeleted: row.Isdeleted || 0,
                  Companyid: row.Companyid || formData.Companyid,
                  Branchid: row.Branchid || formData.Branchid,
                  UPIid: row.UPIid || '', IFSC: row.IFSC || '',
                  Status: getEffectiveStatus(row),
                  AccountName: resolveAccountName(row) || ''
                });
                setIsEditMode(true);
                setOriginalAccNo(row.AccNo || '');
                setSelectedRow(row);
                setActiveQRSlno(null);
                setIsModalOpen(true);
              }}
              noDataComponent={
                <div style={{ padding: '32px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>
                  {error ? `⚠️ ${error}` : 'No records to display.'}
                </div>
              }
            />
          </div>
        )}
      </div>

    </div>
  );
};

export default BankReport;