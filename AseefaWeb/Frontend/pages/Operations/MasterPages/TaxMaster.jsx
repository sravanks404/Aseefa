// import React, { useState, useEffect } from 'react';
// import api from '../../apiService';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import {
//   FaSearch, FaPlus, FaSave, FaEdit, FaTrashAlt,
//   FaEraser, FaArrowLeft, FaChevronRight, FaChevronDown,
//   FaTag
// } from 'react-icons/fa';

// const primaryColor = 'rgb(45, 75, 169)';

// const btnStyle = {
//   minWidth: '110px',
//   borderRadius: '5px',
//   fontWeight: '500',
//   background: 'transparent',
//   border: `2px solid ${primaryColor}`,
//   color: primaryColor,
//   padding: '8px 16px',
//   fontSize: '14px'
// };

// // ── Build tree from flat array ─────────────────────────────────────────────
// const buildTree = (flatList) => {
//   const parents = flatList.filter(
//     (t) => t.TaxParent === null || t.TaxParent === 0 || t.TaxParent === undefined
//   );
//   return parents.map((p) => ({
//     ...p,
//     children: flatList.filter((c) => c.TaxParent === p.TaxID)
//   }));
// };

// // ── Pill Tag Tree Node (Design 1) ──────────────────────────────────────────
// function TreeNode({ node, selectedId, onSelect }) {
//   const [open, setOpen] = useState(true);
//   const children = node.children || [];
//   const isSelected = selectedId === node.TaxID;

//   return (
//     <div style={{ marginBottom: '10px' }}>

//       {/* ── Parent row ── */}
//       <div
//         onClick={() => { onSelect(node); setOpen((o) => !o); }}
//         style={{
//           display: 'flex',
//           alignItems: 'center',
//           gap: '8px',
//           padding: '7px 12px',
//           borderRadius: '8px',
//           background: isSelected ? 'rgba(45,75,169,0.1)' : '#f7f8fc',
//           border: isSelected ? `1px solid rgba(45,75,169,0.25)` : '1px solid transparent',
//           cursor: 'pointer',
//           transition: 'all 0.15s',
//           userSelect: 'none'
//         }}
//       >
//         <span style={{ color: primaryColor, fontSize: '11px', width: '12px', flexShrink: 0 }}>
//           {open ? <FaChevronDown /> : <FaChevronRight />}
//         </span>
//         <FaTag style={{ color: primaryColor, fontSize: '12px', flexShrink: 0 }} />
//         <span style={{
//           fontWeight: '600', fontSize: '14px',
//           color: isSelected ? primaryColor : '#2d3748', flex: 1
//         }}>
//           {node.TaxName}
//         </span>
//         <span style={{
//           fontSize: '11px', background: 'rgba(45,75,169,0.12)',
//           color: primaryColor, padding: '2px 9px',
//           borderRadius: '20px', fontWeight: '500', flexShrink: 0
//         }}>
//           {children.length} {children.length === 1 ? 'rate' : 'rates'}
//         </span>
//       </div>

//       {/* ── Child pills ── */}
//       {open && children.length > 0 && (
//         <div style={{
//           display: 'flex', flexWrap: 'wrap',
//           gap: '6px', marginTop: '8px', marginLeft: '32px'
//         }}>
//           {children.map((child) => {
//             const isChildSelected = selectedId === child.TaxID;
//             return (
//               <span
//                 key={child.TaxID}
//                 onClick={(e) => { e.stopPropagation(); onSelect(child); }}
//                 style={{
//                   fontSize: '12px', padding: '4px 14px', borderRadius: '20px',
//                   border: isChildSelected ? `1.5px solid ${primaryColor}` : '1px solid #e2e8f0',
//                   color: isChildSelected ? primaryColor : '#4a5568',
//                   background: isChildSelected ? 'rgba(45,75,169,0.08)' : '#fff',
//                   cursor: 'pointer',
//                   fontWeight: isChildSelected ? '600' : '400',
//                   transition: 'all 0.15s', userSelect: 'none'
//                 }}
//               >
//                 {child.TaxName}%
//               </span>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }

// // ── Main Component ─────────────────────────────────────────────────────────
// function TaxMaster() {

//   const [loading,          setLoading]         = useState(false);
//   const [loadingSubmit,    setLoadingSubmit]    = useState(false);
//   const [loadingUpdate,    setLoadingUpdate]    = useState(false);
//   const [loadingDelete,    setLoadingDelete]    = useState(false);

//   const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
//   const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);
//   const [isDeleteDisabled, setIsDeleteDisabled] = useState(true);

//   const [showForm,         setShowForm]         = useState(false);
//   const [searchTerm,       setSearchTerm]       = useState('');
//   const [fieldErrors,      setFieldErrors]      = useState({});

//   const [taxData,          setTaxData]          = useState([]);   // flat list from API
//   const [treeData,         setTreeData]         = useState([]);   // built tree

//   // mode: 'taxtype' = entering a parent, 'tax' = entering a child
//   const [mode,             setMode]             = useState('taxtype');

//   const [tax, setTax] = useState({
//     TaxID:    0,
//     TaxName:  '',
//     TaxParent: null,
//     TaxType:  ''
//   });

//   const [selectedTreeId, setSelectedTreeId] = useState(null);


//   // ── fetch ────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     const CompanyId = sessionStorage.getItem('CompanyID');
//     fetchData(CompanyId);
//   }, []);

//   const fetchData = async (companyId) => {
//     try {
//       setLoading(true);
//       const finalId = companyId || sessionStorage.getItem('CompanyID');
//       const res = await api.get('/api/gettax', { params: { CompanyId: finalId } });
//       const flat = res.data?.data || [];
//       setTaxData(flat);
//       setTreeData(buildTree(flat));
//     } catch {
//       toast.error('Failed to fetch tax data');
//     } finally {
//       setLoading(false);
//     }
//   };


//   // ── tree node click ───────────────────────────────────────────────────────
//   const handleTreeSelect = (node) => {
//     setSelectedTreeId(node.TaxID);
//     const isParent = !node.TaxParent || node.TaxParent === 0;

//     setMode(isParent ? 'taxtype' : 'tax');

//     setTax({
//       TaxID:    node.TaxID,
//       TaxName:  node.TaxName  || '',
//       TaxParent: node.TaxParent || null,
//       TaxType:  node.TaxType  || ''
//     });

//     setIsSubmitDisabled(true);
//     setIsUpdateDisabled(false);
//     setIsDeleteDisabled(false);
//     setFieldErrors({});
//     setShowForm(true);
//   };


//   // ── validation ────────────────────────────────────────────────────────────
//   const validateFields = () => {
//     const errors = {};
//     if (!tax.TaxName?.trim()) errors.TaxName = 'Tax Name is required';
//     if (mode === 'tax' && !tax.TaxParent) errors.TaxParent = 'Group (Tax Type) is required';
//     return errors;
//   };

//   const checkDuplicate = (name, currentId = null) =>
//     taxData.some((t) => {
//       const isSame = t.TaxName?.trim().toLowerCase() === name.trim().toLowerCase();
//       return currentId ? isSame && t.TaxID !== currentId : isSame;
//     });


//   // ── POST /api/insertupdatetax  (INSERT) ──────────────────────────────────
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const errors = validateFields();
//     setFieldErrors(errors);
//     if (Object.keys(errors).length > 0) return;

//     if (checkDuplicate(tax.TaxName)) {
//       toast.error('Tax Name already exists');
//       return;
//     }

//     try {
//       setLoadingSubmit(true);
//       const Companyid = sessionStorage.getItem('CompanyID');
//       const CreatedBy = sessionStorage.getItem('UserId');

//       const res = await api.post('/api/insertupdatetax', {
//         TaxID:     0,
//         TaxName:   tax.TaxName.trim(),
//         TaxParent: mode === 'tax' ? parseInt(tax.TaxParent) : null,
//         TaxType:   null,
//         CreatedBy,
//         Companyid
//       });

//       if (res.data.success) {
//         toast.success('Tax created successfully');
//         fetchData(Companyid);
//         resetForm();
//         setShowForm(false);
//       } else {
//         toast.error(res.data.message || 'Operation failed');
//       }
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Request failed');
//     } finally {
//       setLoadingSubmit(false);
//     }
//   };


//   // ── POST /api/insertupdatetax  (UPDATE) ──────────────────────────────────
//   const handleUpdate = async (e) => {
//     e.preventDefault();
//     const errors = validateFields();
//     setFieldErrors(errors);
//     if (Object.keys(errors).length > 0) return;

//     if (checkDuplicate(tax.TaxName, tax.TaxID)) {
//       toast.error('Tax Name already exists');
//       return;
//     }

//     try {
//       setLoadingUpdate(true);
//       const Companyid = sessionStorage.getItem('CompanyID');
//       const CreatedBy = sessionStorage.getItem('UserId');

//       const res = await api.post('/api/insertupdatetax', {
//         TaxID:     tax.TaxID,
//         TaxName:   tax.TaxName.trim(),
//         TaxParent: mode === 'tax' ? parseInt(tax.TaxParent) : null,
//         TaxType:   null,
//         CreatedBy,
//         Companyid
//       });

//       if (res.data.success) {
//         toast.success('Tax updated successfully');
//         fetchData(Companyid);
//         resetForm();
//         setShowForm(false);
//       } else {
//         toast.error(res.data.message || 'Update failed');
//       }
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Update request failed');
//     } finally {
//       setLoadingUpdate(false);
//     }
//   };


//   // ── DELETE /api/deletetax ─────────────────────────────────────────────────
//   const handleDelete = async () => {
//     if (!tax.TaxID) { toast.error('No tax selected'); return; }
//     const confirmed = await confirmDeleteToast();
//     if (!confirmed) return;

//     try {
//       setLoadingDelete(true);
//       const Companyid = sessionStorage.getItem('CompanyID');
//       const DeletedBy = parseInt(sessionStorage.getItem('UserId'), 10);

//       const res = await api.delete('/api/deletetax', {
//         data: { TaxID: tax.TaxID, DeletedBy }
//       });

//       if (res.data.success) {
//         toast.success('Tax deleted successfully');
//         fetchData(Companyid);
//         resetForm();
//         setShowForm(false);
//       } else {
//         toast.error(res.data.message || 'Delete failed');
//       }
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Delete error');
//     } finally {
//       setLoadingDelete(false);
//     }
//   };

//   const confirmDeleteToast = () =>
//     new Promise((resolve) => {
//       const toastId = toast.warning(
//         () => (
//           <div>
//             <div className="mb-2">Are you sure you want to delete this tax entry?</div>
//             <div className="d-flex justify-content-end gap-2">
//               <button className="btn btn-danger btn-sm"
//                 onClick={() => { toast.dismiss(toastId); resolve(true); }}>Yes</button>
//               <button className="btn btn-secondary btn-sm"
//                 onClick={() => { toast.dismiss(toastId); resolve(false); }}>Cancel</button>
//             </div>
//           </div>
//         ),
//         { position: 'top-center', autoClose: false, closeOnClick: false, draggable: false, closeButton: false }
//       );
//     });


//   // ── helpers ───────────────────────────────────────────────────────────────
//   const resetForm = () => {
//     setTax({ TaxID: 0, TaxName: '', TaxParent: null, TaxType: '' });
//     setMode('taxtype');
//     setSelectedTreeId(null);
//     setIsSubmitDisabled(false);
//     setIsUpdateDisabled(true);
//     setIsDeleteDisabled(true);
//     setFieldErrors({});
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setTax((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleModeChange = (newMode) => {
//     setMode(newMode);
//     setTax({ TaxID: 0, TaxName: '', TaxParent: null, TaxType: '' });
//     setIsSubmitDisabled(false);
//     setIsUpdateDisabled(true);
//     setIsDeleteDisabled(true);
//     setFieldErrors({});
//   };

//   const handleClear      = () => { resetForm(); toast.dismiss(); };
//   const handleCreateNew  = () => { handleClear(); setShowForm(true); };
//   const handleBackToList = () => { setShowForm(false); handleClear(); };

//   // parent options for "Group" dropdown (only Tax Type nodes)
//   const parentOptions = taxData.filter(
//     (t) => !t.TaxParent || t.TaxParent === 0
//   );

//   // filtered tree search
//   const filteredTree = searchTerm.trim()
//     ? treeData.filter(
//         (node) =>
//           node.TaxName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           node.children?.some((c) =>
//             c.TaxName?.toLowerCase().includes(searchTerm.toLowerCase())
//           )
//       )
//     : treeData;


//   // ── render ────────────────────────────────────────────────────────────────
//   return (
//     <div className="page-wrapper" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
//       <div className="page-body mt-1">
//         <div className="container-fluid px-4">
//           <ToastContainer position="top-center" autoClose={3000} />

//           {!showForm ? (
//             /* ════════════ LIST VIEW (tree) ════════════ */
//             <>
//               {/* Header card */}
//               <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
//                 <div className="card-body p-4">
//                   <h2 className="mb-3" style={{ fontWeight: '600', color: '#2d3748', fontSize: '28px' }}>
//                     <FaTag className="me-2" style={{ color: primaryColor }} />
//                     Tax Master
//                   </h2>
//                   <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
//                     <div style={{ maxWidth: '700px', flex: 1 }}>
//                       <div className="input-group" style={{ height: '45px' }}>
//                         <span className="input-group-text text-white" style={{ backgroundColor: primaryColor }}>
//                           <FaSearch />
//                         </span>
//                         <input
//                           type="text"
//                           className="form-control border-start-0"
//                           placeholder="Search tax..."
//                           value={searchTerm}
//                           onChange={(e) => setSearchTerm(e.target.value)}
//                           style={{ backgroundColor: '#fff', borderColor: '#e2e8f0', height: '45px', fontSize: '14px' }}
//                         />
//                       </div>
//                     </div>
//                     <button
//                       type="button"
//                       className="btn d-flex align-items-center gap-2"
//                       onClick={handleCreateNew}
//                       style={{ borderRadius: '5px', padding: '8px 20px', background: primaryColor, border: 'none', color: 'white', height: '45px', whiteSpace: 'nowrap' }}
//                     >
//                       <FaPlus /> Create New
//                     </button>
//                   </div>
//                 </div>
//               </div>

//               {/* Tree card */}
//               <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
//                 <div className="card-body p-0">
//                   {loading ? (
//                     <div className="text-center p-5">
//                       <div className="spinner-border" role="status" style={{ color: primaryColor }}>
//                         <span className="visually-hidden">Loading...</span>
//                       </div>
//                       <p className="mt-3 text-muted">Loading tax data...</p>
//                     </div>
//                   ) : (
//                     <div style={{ maxHeight: '600px', overflowY: 'auto', padding: '12px 8px' }}>
//                       {/* Tree header */}
//                       <div style={{
//                         padding: '8px 16px',
//                         background: '#f7fafc',
//                         borderBottom: '1px solid #e2e8f0',
//                         fontWeight: '600',
//                         fontSize: '13px',
//                         color: '#4a5568',
//                         marginBottom: '4px'
//                       }}>
//                         Tax Structure
//                       </div>

//                       {filteredTree.length > 0 ? (
//                         filteredTree.map((node) => (
//                           <TreeNode
//                             key={node.TaxID}
//                             node={node}
//                             selectedId={selectedTreeId}
//                             onSelect={handleTreeSelect}
//                             level={0}
//                           />
//                         ))
//                       ) : (
//                         <div className="text-center p-5">
//                           <FaTag className="mb-3" style={{ fontSize: '48px', color: '#cbd5e0' }} />
//                           <p className="text-muted mb-3">No tax entries found</p>
//                           <button
//                             className="btn"
//                             onClick={handleCreateNew}
//                             style={{ borderRadius: '5px', padding: '10px 24px', background: primaryColor, border: 'none', color: 'white', fontSize: '14px' }}
//                           >
//                             <FaPlus className="me-2" />Create New Tax
//                           </button>
//                         </div>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </>
//           ) : (
//             /* ════════════ FORM VIEW ════════════ */
//             <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>

//               {/* Form header */}
//               <div
//                 className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-0"
//                 style={{ borderBottom: '1px solid #e2e8f0' }}
//               >
//                 <h4 className="m-0" style={{ color: '#2d3748', fontWeight: '600', fontSize: '18px' }}>
//                   <FaTag className="me-2" style={{ color: primaryColor }} />
//                   {tax.TaxID ? 'Edit Tax' : 'New Tax'}
//                 </h4>
//                 <button
//                   className="btn d-flex align-items-center gap-2"
//                   onClick={handleBackToList}
//                   style={{ borderRadius: '5px', padding: '8px 16px', fontSize: '14px', background: 'transparent', border: `2px solid ${primaryColor}`, color: primaryColor }}
//                 >
//                   <FaArrowLeft /> Back to List
//                 </button>
//               </div>

//               {/* Form body */}
//               <div className="card-body p-4">
//                 <form onSubmit={handleSubmit}>
//                   <div className="row justify-content-center">
//                     <div className="col-md-6">
//                       <div className="card border-0 shadow-sm" style={{ borderRadius: '10px' }}>
//                         <div
//                           className="card-header bg-white"
//                           style={{ borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: primaryColor }}
//                         >
//                           <FaTag className="me-2" />Tax Details
//                         </div>
//                         <div className="card-body p-4">

//                           {/* ── Radio: Tax Type / Tax ── */}
//                           <div className="mb-4">
//                             <div
//                               className="d-flex align-items-center gap-4 p-3"
//                               style={{ border: `1px solid #e2e8f0`, borderRadius: '8px', background: '#f7fafc' }}
//                             >
//                               <div className="form-check mb-0">
//                                 <input
//                                   className="form-check-input"
//                                   type="radio"
//                                   name="mode"
//                                   id="modeTaxType"
//                                   checked={mode === 'taxtype'}
//                                   onChange={() => handleModeChange('taxtype')}
//                                   style={{ accentColor: primaryColor }}
//                                 />
//                                 <label
//                                   className="form-check-label fw-medium"
//                                   htmlFor="modeTaxType"
//                                   style={{ color: mode === 'taxtype' ? primaryColor : '#4a5568', cursor: 'pointer' }}
//                                 >
//                                   Tax Type
//                                 </label>
//                               </div>
//                               <div className="form-check mb-0">
//                                 <input
//                                   className="form-check-input"
//                                   type="radio"
//                                   name="mode"
//                                   id="modeTax"
//                                   checked={mode === 'tax'}
//                                   onChange={() => handleModeChange('tax')}
//                                   style={{ accentColor: primaryColor }}
//                                 />
//                                 <label
//                                   className="form-check-label fw-medium"
//                                   htmlFor="modeTax"
//                                   style={{ color: mode === 'tax' ? primaryColor : '#4a5568', cursor: 'pointer' }}
//                                 >
//                                   Tax
//                                 </label>
//                               </div>
//                             </div>
//                           </div>

//                           {/* ── Tax Type mode: show Tax Type Name ── */}
//                           {mode === 'taxtype' && (
//                             <div className="mb-3">
//                               <label className="form-label fw-medium mb-2">
//                                 Tax Type Name <span className="text-danger">*</span>
//                               </label>
//                               <input
//                                 className={`form-control ${fieldErrors.TaxName ? 'is-invalid' : ''}`}
//                                 name="TaxName"
//                                 value={tax.TaxName}
//                                 onChange={handleInputChange}
//                                 placeholder="e.g. GST, VAT, IGST"
//                                 maxLength={100}
//                                 autoFocus
//                               />
//                               {fieldErrors.TaxName && (
//                                 <div className="invalid-feedback">{fieldErrors.TaxName}</div>
//                               )}
//                             </div>
//                           )}

//                           {/* ── Tax mode: show Group + Tax % ── */}
//                           {mode === 'tax' && (
//                             <>
//                               <div className="mb-3">
//                                 <label className="form-label fw-medium mb-2">
//                                   Group <span className="text-danger">*</span>
//                                 </label>
//                                 <select
//                                   className={`form-select ${fieldErrors.TaxParent ? 'is-invalid' : ''}`}
//                                   name="TaxParent"
//                                   value={tax.TaxParent || ''}
//                                   onChange={handleInputChange}
//                                 >
//                                   <option value="">← Please select Tax Type</option>
//                                   {parentOptions.map((p) => (
//                                     <option key={p.TaxID} value={p.TaxID}>{p.TaxName}</option>
//                                   ))}
//                                 </select>
//                                 {fieldErrors.TaxParent && (
//                                   <div className="invalid-feedback">{fieldErrors.TaxParent}</div>
//                                 )}
//                               </div>

//                               <div className="mb-3">
//                                 <label className="form-label fw-medium mb-2">
//                                   Tax (%) <span className="text-danger">*</span>
//                                 </label>
//                                 <input
//                                   className={`form-control ${fieldErrors.TaxName ? 'is-invalid' : ''}`}
//                                   name="TaxName"
//                                   value={tax.TaxName}
//                                   onChange={handleInputChange}
//                                 //   placeholder="e.g. 5, 12, 18, 28"
//                                   maxLength={20}
//                                   autoFocus
//                                 />
//                                 {fieldErrors.TaxName && (
//                                   <div className="invalid-feedback">{fieldErrors.TaxName}</div>
//                                 )}
//                               </div>
//                             </>
//                           )}

//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   {/* ── Action Buttons ── */}
//                   <div className="row mt-4">
//                     <div className="col-12">
//                       <div className="d-flex justify-content-center flex-wrap gap-3">

//                         <button
//                           type="submit"
//                           className="btn px-4 d-flex align-items-center gap-2"
//                           style={btnStyle}
//                           disabled={isSubmitDisabled || loadingSubmit}
//                         >
//                           {loadingSubmit
//                             ? <><span className="spinner-border spinner-border-sm" role="status" /> Creating...</>
//                             : <><FaSave /> Save</>}
//                         </button>

//                         <button
//                           type="button"
//                           className="btn px-4 d-flex align-items-center gap-2"
//                           style={btnStyle}
//                           disabled={isUpdateDisabled || loadingUpdate}
//                           onClick={handleUpdate}
//                         >
//                           {loadingUpdate
//                             ? <><span className="spinner-border spinner-border-sm" role="status" /> Updating...</>
//                             : <><FaEdit /> Update</>}
//                         </button>

//                         <button
//                           type="button"
//                           className="btn px-4 d-flex align-items-center gap-2"
//                           style={btnStyle}
//                           disabled={isDeleteDisabled || loadingDelete}
//                           onClick={handleDelete}
//                         >
//                           {loadingDelete
//                             ? <><span className="spinner-border spinner-border-sm" role="status" /> Deleting...</>
//                             : <><FaTrashAlt /> Delete</>}
//                         </button>

//                         <button
//                           type="button"
//                           className="btn px-4 d-flex align-items-center gap-2"
//                           style={btnStyle}
//                           onClick={handleClear}
//                         >
//                           <FaEraser /> Clear
//                         </button>

//                       </div>
//                     </div>
//                   </div>
//                 </form>
//               </div>
//             </div>
//           )}

//         </div>
//       </div>
//     </div>
//   );
// }

// export default TaxMaster;
import React, { useState, useEffect } from 'react';
import api from '../../apiService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { usePermission } from '../../../src/context/permissionContex';
import {
  FaSearch, FaPlus, FaSave, FaEdit, FaTrashAlt,
  FaEraser, FaArrowLeft, FaChevronRight, FaChevronDown,
  FaTag
} from 'react-icons/fa';

const primaryColor = 'rgb(45, 75, 169)';

const btnStyle = {
  minWidth: '110px',
  borderRadius: '5px',
  fontWeight: '500',
  background: 'transparent',
  border: `2px solid ${primaryColor}`,
  color: primaryColor,
  padding: '8px 16px',
  fontSize: '14px'
};

// ── Build tree from flat array ─────────────────────────────────────────────
const buildTree = (flatList) => {
  const parents = flatList.filter(
    (t) => t.TaxParent === null || t.TaxParent === 0 || t.TaxParent === undefined
  );
  return parents.map((p) => ({
    ...p,
    children: flatList.filter((c) => c.TaxParent === p.TaxID)
  }));
};

// ── Pill Tag Tree Node (Design 1) ──────────────────────────────────────────
function TreeNode({ node, selectedId, onSelect }) {
  const [open, setOpen] = useState(true);
  const children = node.children || [];
  const isSelected = selectedId === node.TaxID;

  return (
    <div style={{ marginBottom: '10px' }}>

      {/* ── Parent row ── */}
      <div
        onClick={() => { onSelect(node); setOpen((o) => !o); }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '7px 12px',
          borderRadius: '8px',
          background: isSelected ? 'rgba(45,75,169,0.1)' : '#f7f8fc',
          border: isSelected ? `1px solid rgba(45,75,169,0.25)` : '1px solid transparent',
          cursor: 'pointer',
          transition: 'all 0.15s',
          userSelect: 'none'
        }}
      >
        <span style={{ color: primaryColor, fontSize: '11px', width: '12px', flexShrink: 0 }}>
          {open ? <FaChevronDown /> : <FaChevronRight />}
        </span>
        <FaTag style={{ color: primaryColor, fontSize: '12px', flexShrink: 0 }} />
        <span style={{
          fontWeight: '600', fontSize: '14px',
          color: isSelected ? primaryColor : '#2d3748', flex: 1
        }}>
          {node.TaxName}
        </span>
        <span style={{
          fontSize: '11px', background: 'rgba(45,75,169,0.12)',
          color: primaryColor, padding: '2px 9px',
          borderRadius: '20px', fontWeight: '500', flexShrink: 0
        }}>
          {children.length} {children.length === 1 ? 'rate' : 'rates'}
        </span>
      </div>

      {/* ── Child pills ── */}
      {open && children.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap',
          gap: '6px', marginTop: '8px', marginLeft: '32px'
        }}>
          {children.map((child) => {
            const isChildSelected = selectedId === child.TaxID;
            return (
              <span
                key={child.TaxID}
                onClick={(e) => { e.stopPropagation(); onSelect(child); }}
                style={{
                  fontSize: '12px', padding: '4px 14px', borderRadius: '20px',
                  border: isChildSelected ? `1.5px solid ${primaryColor}` : '1px solid #e2e8f0',
                  color: isChildSelected ? primaryColor : '#4a5568',
                  background: isChildSelected ? 'rgba(45,75,169,0.08)' : '#fff',
                  cursor: 'pointer',
                  fontWeight: isChildSelected ? '600' : '400',
                  transition: 'all 0.15s', userSelect: 'none'
                }}
              >
                {child.TaxName}%
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
function TaxMaster() {

  // ── Permissions ──
  const { getPermission, refreshPermissions } = usePermission();
  const permission = getPermission('TAX_MASTER');
  const canView   = !!permission?.CanView;
  const canAdd    = !!permission?.CanAdd;
  const canEdit   = !!permission?.CanEdit;
  const canDelete = !!permission?.CanDelete;

  useEffect(() => {
    refreshPermissions();
  }, []);

  const [loading,          setLoading]         = useState(false);
  const [loadingSubmit,    setLoadingSubmit]    = useState(false);
  const [loadingUpdate,    setLoadingUpdate]    = useState(false);
  const [loadingDelete,    setLoadingDelete]    = useState(false);

  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);
  const [isDeleteDisabled, setIsDeleteDisabled] = useState(true);

  const [showForm,         setShowForm]         = useState(false);
  const [searchTerm,       setSearchTerm]       = useState('');
  const [fieldErrors,      setFieldErrors]      = useState({});

  const [taxData,          setTaxData]          = useState([]);   // flat list from API
  const [treeData,         setTreeData]         = useState([]);   // built tree

  // mode: 'taxtype' = entering a parent, 'tax' = entering a child
  const [mode,             setMode]             = useState('taxtype');

  const [tax, setTax] = useState({
    TaxID:    0,
    TaxName:  '',
    TaxParent: null,
    TaxType:  ''
  });

  const [selectedTreeId, setSelectedTreeId] = useState(null);


  // ── fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canView) return;
    const CompanyId = sessionStorage.getItem('CompanyID');
    fetchData(CompanyId);
  }, [canView]);

  const fetchData = async (companyId) => {
    if (!canView) return; // ── Permission guard ──
    try {
      setLoading(true);
      const finalId = companyId || sessionStorage.getItem('CompanyID');
      const res = await api.get('/api/gettax', { params: { CompanyId: finalId } });
      const flat = res.data?.data || [];
      setTaxData(flat);
      setTreeData(buildTree(flat));
    } catch {
      toast.error('Failed to fetch tax data');
    } finally {
      setLoading(false);
    }
  };


  // ── tree node click ───────────────────────────────────────────────────────
  const handleTreeSelect = (node) => {
    setSelectedTreeId(node.TaxID);
    const isParent = !node.TaxParent || node.TaxParent === 0;

    setMode(isParent ? 'taxtype' : 'tax');

    setTax({
      TaxID:    node.TaxID,
      TaxName:  node.TaxName  || '',
      TaxParent: node.TaxParent || null,
      TaxType:  node.TaxType  || ''
    });

    setIsSubmitDisabled(true);
    setIsUpdateDisabled(!canEdit);
    setIsDeleteDisabled(!canDelete);
    setFieldErrors({});
    setShowForm(true);
  };


  // ── validation ────────────────────────────────────────────────────────────
  const validateFields = () => {
    const errors = {};
    if (!tax.TaxName?.trim()) errors.TaxName = 'Tax Name is required';
    if (mode === 'tax' && !tax.TaxParent) errors.TaxParent = 'Group (Tax Type) is required';
    return errors;
  };

  const checkDuplicate = (name, currentId = null) =>
    taxData.some((t) => {
      const isSame = t.TaxName?.trim().toLowerCase() === name.trim().toLowerCase();
      return currentId ? isSame && t.TaxID !== currentId : isSame;
    });


  // ── POST /api/insertupdatetax  (INSERT) ──────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canAdd) { toast.error('You do not have permission to add a tax entry.'); return; }

    const errors = validateFields();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (checkDuplicate(tax.TaxName)) {
      toast.error('Tax Name already exists');
      return;
    }

    try {
      setLoadingSubmit(true);
      const Companyid = sessionStorage.getItem('CompanyID');
      const CreatedBy = sessionStorage.getItem('UserId');

      const res = await api.post('/api/insertupdatetax', {
        TaxID:     0,
        TaxName:   tax.TaxName.trim(),
        TaxParent: mode === 'tax' ? parseInt(tax.TaxParent) : null,
        TaxType:   null,
        CreatedBy,
        Companyid
      });

      if (res.data.success) {
        toast.success('Tax created successfully');
        fetchData(Companyid);
        resetForm();
        setShowForm(false);
      } else {
        toast.error(res.data.message || 'Operation failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally {
      setLoadingSubmit(false);
    }
  };


  // ── POST /api/insertupdatetax  (UPDATE) ──────────────────────────────────
  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!canEdit) { toast.error('You do not have permission to edit a tax entry.'); return; }

    const errors = validateFields();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (checkDuplicate(tax.TaxName, tax.TaxID)) {
      toast.error('Tax Name already exists');
      return;
    }

    try {
      setLoadingUpdate(true);
      const Companyid = sessionStorage.getItem('CompanyID');
      const CreatedBy = sessionStorage.getItem('UserId');

      const res = await api.post('/api/insertupdatetax', {
        TaxID:     tax.TaxID,
        TaxName:   tax.TaxName.trim(),
        TaxParent: mode === 'tax' ? parseInt(tax.TaxParent) : null,
        TaxType:   null,
        CreatedBy,
        Companyid
      });

      if (res.data.success) {
        toast.success('Tax updated successfully');
        fetchData(Companyid);
        resetForm();
        setShowForm(false);
      } else {
        toast.error(res.data.message || 'Update failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update request failed');
    } finally {
      setLoadingUpdate(false);
    }
  };


  // ── DELETE /api/deletetax ─────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!canDelete) { toast.error('You do not have permission to delete a tax entry.'); return; }
    if (!tax.TaxID) { toast.error('No tax selected'); return; }
    const confirmed = await confirmDeleteToast();
    if (!confirmed) return;

    try {
      setLoadingDelete(true);
      const Companyid = sessionStorage.getItem('CompanyID');
      const DeletedBy = parseInt(sessionStorage.getItem('UserId'), 10);

      const res = await api.delete('/api/deletetax', {
        data: { TaxID: tax.TaxID, DeletedBy }
      });

      if (res.data.success) {
        toast.success('Tax deleted successfully');
        fetchData(Companyid);
        resetForm();
        setShowForm(false);
      } else {
        toast.error(res.data.message || 'Delete failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete error');
    } finally {
      setLoadingDelete(false);
    }
  };

  const confirmDeleteToast = () =>
    new Promise((resolve) => {
      const toastId = toast.warning(
        () => (
          <div>
            <div className="mb-2">Are you sure you want to delete this tax entry?</div>
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-danger btn-sm"
                onClick={() => { toast.dismiss(toastId); resolve(true); }}>Yes</button>
              <button className="btn btn-secondary btn-sm"
                onClick={() => { toast.dismiss(toastId); resolve(false); }}>Cancel</button>
            </div>
          </div>
        ),
        { position: 'top-center', autoClose: false, closeOnClick: false, draggable: false, closeButton: false }
      );
    });


  // ── helpers ───────────────────────────────────────────────────────────────
  const resetForm = () => {
    setTax({ TaxID: 0, TaxName: '', TaxParent: null, TaxType: '' });
    setMode('taxtype');
    setSelectedTreeId(null);
    setIsSubmitDisabled(!canAdd);
    setIsUpdateDisabled(true);
    setIsDeleteDisabled(true);
    setFieldErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTax((prev) => ({ ...prev, [name]: value }));
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setTax({ TaxID: 0, TaxName: '', TaxParent: null, TaxType: '' });
    setIsSubmitDisabled(!canAdd);
    setIsUpdateDisabled(true);
    setIsDeleteDisabled(true);
    setFieldErrors({});
  };

  const handleClear      = () => { resetForm(); toast.dismiss(); };
  const handleCreateNew  = () => {
    if (!canAdd) { toast.error('You do not have permission to add a tax entry.'); return; }
    handleClear();
    setShowForm(true);
  };
  const handleBackToList = () => { setShowForm(false); handleClear(); };

  // parent options for "Group" dropdown (only Tax Type nodes)
  const parentOptions = taxData.filter(
    (t) => !t.TaxParent || t.TaxParent === 0
  );

  // filtered tree search
  const filteredTree = searchTerm.trim()
    ? treeData.filter(
        (node) =>
          node.TaxName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          node.children?.some((c) =>
            c.TaxName?.toLowerCase().includes(searchTerm.toLowerCase())
          )
      )
    : treeData;

  // ── access-denied view ──
  if (!canView) {
    return (
      <div className="page-wrapper" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        <div className="page-body mt-1">
          <div className="container-fluid px-4">
            <ToastContainer position="top-center" autoClose={3000} />
            <div className="alert alert-danger mt-3">You do not have permission to view Tax Master.</div>
          </div>
        </div>
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="page-wrapper" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="page-body mt-1">
        <div className="container-fluid px-4">
          <ToastContainer position="top-center" autoClose={3000} />

          {!showForm ? (
            /* ════════════ LIST VIEW (tree) ════════════ */
            <>
              {/* Header card */}
              <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <div className="card-body p-4">
                  <h2 className="mb-3" style={{ fontWeight: '600', color: '#2d3748', fontSize: '28px' }}>
                    <FaTag className="me-2" style={{ color: primaryColor }} />
                    Tax Master
                  </h2>
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div style={{ maxWidth: '700px', flex: 1 }}>
                      <div className="input-group" style={{ height: '45px' }}>
                        <span className="input-group-text text-white" style={{ backgroundColor: primaryColor }}>
                          <FaSearch />
                        </span>
                        <input
                          type="text"
                          className="form-control border-start-0"
                          placeholder="Search tax..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={{ backgroundColor: '#fff', borderColor: '#e2e8f0', height: '45px', fontSize: '14px' }}
                        />
                      </div>
                    </div>
                    {canAdd && (
                      <button
                        type="button"
                        className="btn d-flex align-items-center gap-2"
                        onClick={handleCreateNew}
                        style={{ borderRadius: '5px', padding: '8px 20px', background: primaryColor, border: 'none', color: 'white', height: '45px', whiteSpace: 'nowrap' }}
                      >
                        <FaPlus /> Create New
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tree card */}
              <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <div className="card-body p-0">
                  {loading ? (
                    <div className="text-center p-5">
                      <div className="spinner-border" role="status" style={{ color: primaryColor }}>
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-3 text-muted">Loading tax data...</p>
                    </div>
                  ) : (
                    <div style={{ maxHeight: '600px', overflowY: 'auto', padding: '12px 8px' }}>
                      {/* Tree header */}
                      <div style={{
                        padding: '8px 16px',
                        background: '#f7fafc',
                        borderBottom: '1px solid #e2e8f0',
                        fontWeight: '600',
                        fontSize: '13px',
                        color: '#4a5568',
                        marginBottom: '4px'
                      }}>
                        Tax Structure
                      </div>

                      {filteredTree.length > 0 ? (
                        filteredTree.map((node) => (
                          <TreeNode
                            key={node.TaxID}
                            node={node}
                            selectedId={selectedTreeId}
                            onSelect={handleTreeSelect}
                            level={0}
                          />
                        ))
                      ) : (
                        <div className="text-center p-5">
                          <FaTag className="mb-3" style={{ fontSize: '48px', color: '#cbd5e0' }} />
                          <p className="text-muted mb-3">No tax entries found</p>
                          {canAdd && (
                            <button
                              className="btn"
                              onClick={handleCreateNew}
                              style={{ borderRadius: '5px', padding: '10px 24px', background: primaryColor, border: 'none', color: 'white', fontSize: '14px' }}
                            >
                              <FaPlus className="me-2" />Create New Tax
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* ════════════ FORM VIEW ════════════ */
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>

              {/* Form header */}
              <div
                className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-0"
                style={{ borderBottom: '1px solid #e2e8f0' }}
              >
                <h4 className="m-0" style={{ color: '#2d3748', fontWeight: '600', fontSize: '18px' }}>
                  <FaTag className="me-2" style={{ color: primaryColor }} />
                  {tax.TaxID ? 'Edit Tax' : 'New Tax'}
                </h4>
                <button
                  className="btn d-flex align-items-center gap-2"
                  onClick={handleBackToList}
                  style={{ borderRadius: '5px', padding: '8px 16px', fontSize: '14px', background: 'transparent', border: `2px solid ${primaryColor}`, color: primaryColor }}
                >
                  <FaArrowLeft /> Back to List
                </button>
              </div>

              {/* Form body */}
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="row justify-content-center">
                    <div className="col-md-6">
                      <div className="card border-0 shadow-sm" style={{ borderRadius: '10px' }}>
                        <div
                          className="card-header bg-white"
                          style={{ borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: primaryColor }}
                        >
                          <FaTag className="me-2" />Tax Details
                        </div>
                        <div className="card-body p-4">

                          {/* ── Radio: Tax Type / Tax ── */}
                          <div className="mb-4">
                            <div
                              className="d-flex align-items-center gap-4 p-3"
                              style={{ border: `1px solid #e2e8f0`, borderRadius: '8px', background: '#f7fafc' }}
                            >
                              <div className="form-check mb-0">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name="mode"
                                  id="modeTaxType"
                                  checked={mode === 'taxtype'}
                                  onChange={() => handleModeChange('taxtype')}
                                  style={{ accentColor: primaryColor }}
                                />
                                <label
                                  className="form-check-label fw-medium"
                                  htmlFor="modeTaxType"
                                  style={{ color: mode === 'taxtype' ? primaryColor : '#4a5568', cursor: 'pointer' }}
                                >
                                  Tax Type
                                </label>
                              </div>
                              <div className="form-check mb-0">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name="mode"
                                  id="modeTax"
                                  checked={mode === 'tax'}
                                  onChange={() => handleModeChange('tax')}
                                  style={{ accentColor: primaryColor }}
                                />
                                <label
                                  className="form-check-label fw-medium"
                                  htmlFor="modeTax"
                                  style={{ color: mode === 'tax' ? primaryColor : '#4a5568', cursor: 'pointer' }}
                                >
                                  Tax
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* ── Tax Type mode: show Tax Type Name ── */}
                          {mode === 'taxtype' && (
                            <div className="mb-3">
                              <label className="form-label fw-medium mb-2">
                                Tax Type Name <span className="text-danger">*</span>
                              </label>
                              <input
                                className={`form-control ${fieldErrors.TaxName ? 'is-invalid' : ''}`}
                                name="TaxName"
                                value={tax.TaxName}
                                onChange={handleInputChange}
                                placeholder="e.g. GST, VAT, IGST"
                                maxLength={100}
                                autoFocus
                              />
                              {fieldErrors.TaxName && (
                                <div className="invalid-feedback">{fieldErrors.TaxName}</div>
                              )}
                            </div>
                          )}

                          {/* ── Tax mode: show Group + Tax % ── */}
                          {mode === 'tax' && (
                            <>
                              <div className="mb-3">
                                <label className="form-label fw-medium mb-2">
                                  Group <span className="text-danger">*</span>
                                </label>
                                <select
                                  className={`form-select ${fieldErrors.TaxParent ? 'is-invalid' : ''}`}
                                  name="TaxParent"
                                  value={tax.TaxParent || ''}
                                  onChange={handleInputChange}
                                >
                                  <option value="">← Please select Tax Type</option>
                                  {parentOptions.map((p) => (
                                    <option key={p.TaxID} value={p.TaxID}>{p.TaxName}</option>
                                  ))}
                                </select>
                                {fieldErrors.TaxParent && (
                                  <div className="invalid-feedback">{fieldErrors.TaxParent}</div>
                                )}
                              </div>

                              <div className="mb-3">
                                <label className="form-label fw-medium mb-2">
                                  Tax (%) <span className="text-danger">*</span>
                                </label>
                                <input
                                  className={`form-control ${fieldErrors.TaxName ? 'is-invalid' : ''}`}
                                  name="TaxName"
                                  value={tax.TaxName}
                                  onChange={handleInputChange}
                                //   placeholder="e.g. 5, 12, 18, 28"
                                  maxLength={20}
                                  autoFocus
                                />
                                {fieldErrors.TaxName && (
                                  <div className="invalid-feedback">{fieldErrors.TaxName}</div>
                                )}
                              </div>
                            </>
                          )}

                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Action Buttons ── */}
                  <div className="row mt-4">
                    <div className="col-12">
                      <div className="d-flex justify-content-center flex-wrap gap-3">

                        {canAdd && (
                          <button
                            type="submit"
                            className="btn px-4 d-flex align-items-center gap-2"
                            style={btnStyle}
                            disabled={isSubmitDisabled || loadingSubmit}
                          >
                            {loadingSubmit
                              ? <><span className="spinner-border spinner-border-sm" role="status" /> Creating...</>
                              : <><FaSave /> Save</>}
                          </button>
                        )}

                        {canEdit && (
                          <button
                            type="button"
                            className="btn px-4 d-flex align-items-center gap-2"
                            style={btnStyle}
                            disabled={isUpdateDisabled || loadingUpdate}
                            onClick={handleUpdate}
                          >
                            {loadingUpdate
                              ? <><span className="spinner-border spinner-border-sm" role="status" /> Updating...</>
                              : <><FaEdit /> Update</>}
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            className="btn px-4 d-flex align-items-center gap-2"
                            style={btnStyle}
                            disabled={isDeleteDisabled || loadingDelete}
                            onClick={handleDelete}
                          >
                            {loadingDelete
                              ? <><span className="spinner-border spinner-border-sm" role="status" /> Deleting...</>
                              : <><FaTrashAlt /> Delete</>}
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn px-4 d-flex align-items-center gap-2"
                          style={btnStyle}
                          onClick={handleClear}
                        >
                          <FaEraser /> Clear
                        </button>

                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default TaxMaster;