// import React, { useState, useEffect, useRef } from 'react';
// import api from '../../apiService';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import Form from 'react-bootstrap/Form';
// import {
//   FaSearch, FaPlus, FaSave, FaEdit, FaTrashAlt,
//   FaEraser, FaChevronRight, FaChevronDown,
//   FaLayerGroup, FaTimes, FaCheck
// } from 'react-icons/fa';


// const primaryColor = 'rgb(45, 75, 169)';

// const btnStyle = {
//   minWidth: '120px',
//   borderRadius: '5px',
//   fontWeight: '500',
//   background: 'transparent',
//   border: `2px solid ${primaryColor}`,
//   color: primaryColor,
//   padding: '10px 20px',
//   fontSize: '14px'
// };

// const inputStyle = {
//   borderRadius: '6px',
//   border: '1px solid #ced4da',
//   minHeight: '38px',
//   fontSize: '14px',
// };

// const levelColors = [
//   { bg: 'rgba(45,75,169,0.08)',   border: 'rgba(45,75,169,0.3)',   text: 'rgb(45,75,169)'  },
//   { bg: 'rgba(56,161,105,0.08)',  border: 'rgba(56,161,105,0.3)',  text: 'rgb(38,128,80)'  },
//   { bg: 'rgba(221,107,32,0.08)',  border: 'rgba(221,107,32,0.3)',  text: 'rgb(180,83,9)'   },
//   { bg: 'rgba(159,122,234,0.08)', border: 'rgba(159,122,234,0.3)', text: 'rgb(107,70,193)' },
// ];

// const getLevelColor = (level) => levelColors[level % levelColors.length];
// const getLevelLabel = (level) => {
//   if (level === 0) return 'Group';
//   if (level === 1) return 'Main Group';
//   if (level === 2) return 'Sub Group';
//   return `Level ${level}`;
// };

// const buildTree = (flat, parentId = 0) =>
//   flat
//     .filter((item) => Number(item.GUnder ?? 0) === parentId)
//     .map((item) => ({ ...item, children: buildTree(flat, item.GSlNo) }));

// const buildCombinedTree = (groups, heads) => {
//   const inject = (nodes) =>
//     nodes.map((node) => {
//       const headLeaves = heads
//         .filter((h) => Number(h.GUnder ?? 0) === Number(node.GSlNo))
//         .map((h) => ({
//           GSlNo:   -(Number(h.HSlNo) || 0),
//           GName:    h.HName || h.GName || '',
//           GUnder:   h.GUnder,
//           Type:     h.Type  || '',
//           _isHead:  true,
//           _HSlNo:   Number(h.HSlNo) || 0,
//           _HName:   h.HName || h.GName || '',
//           children: [],
//         }));
//       return {
//         ...node,
//         children: [...inject(node.children || []), ...headLeaves],
//       };
//     });
//   return inject(buildTree(groups));
// };

// const headColor = {
//   bg:     'rgba(56,178,172,0.10)',
//   border: 'rgba(56,178,172,0.40)',
//   dot:    'rgb(49,151,149)',
//   text:   'rgb(44,122,123)',
// };

// function TreeNode({ node, selectedId, selectedHeadHSlNo, onSelect, level = 0 }) {
//   const [open, setOpen] = useState(true);
//   const hasChildren = node.children && node.children.length > 0;
//   const isHeadNode  = node._isHead === true;

//   const isSelected = isHeadNode
//     ? (selectedHeadHSlNo != null && selectedHeadHSlNo === node._HSlNo)
//     : (selectedId === node.GSlNo);

//   const col = getLevelColor(level);

//   return (
//     <div style={{ marginBottom: '3px' }}>
//       <div
//         onClick={() => onSelect(node)}
//         style={{
//           display: 'flex', alignItems: 'center', gap: '6px',
//           paddingLeft: `${level * 20 + 8}px`,
//           paddingTop: '6px', paddingBottom: '6px', paddingRight: '10px',
//           borderRadius: '7px',
//           background: isSelected ? (isHeadNode ? headColor.bg   : col.bg)     : 'transparent',
//           border:     isSelected ? `1px solid ${isHeadNode ? headColor.border : col.border}` : '1px solid transparent',
//           cursor: 'pointer', transition: 'all 0.15s', userSelect: 'none'
//         }}
//       >
//         <span
//           onClick={(e) => { e.stopPropagation(); if (hasChildren) setOpen((o) => !o); }}
//           style={{ width: '14px', flexShrink: 0, color: isHeadNode ? headColor.dot : col.text, fontSize: '10px', cursor: hasChildren ? 'pointer' : 'default' }}
//         >
//           {hasChildren ? (open ? <FaChevronDown /> : <FaChevronRight />) : null}
//         </span>
//         <span style={{
//           width: '7px', height: '7px',
//           borderRadius: isHeadNode ? '2px' : '50%',
//           background: isHeadNode ? headColor.dot : col.text,
//           flexShrink: 0, opacity: 0.8
//         }} />
//         <span style={{
//           flex: 1, fontSize: '13px',
//           fontWeight: isHeadNode ? '400' : (level === 0 ? '600' : level === 1 ? '500' : '400'),
//           color: isSelected
//             ? (isHeadNode ? headColor.text : col.text)
//             : (isHeadNode ? '#4a5568' : '#2d3748'),
//           fontStyle: isHeadNode ? 'italic' : 'normal',
//         }}>
//           {node.GName}
//         </span>
//         {isHeadNode && (
//           <span style={{
//             fontSize: '9px', padding: '1px 5px', borderRadius: '8px',
//             background: 'rgba(56,178,172,0.12)', color: headColor.text,
//             border: `1px solid ${headColor.border}`, flexShrink: 0, fontStyle: 'normal'
//           }}>head</span>
//         )}
//         {hasChildren && !isHeadNode && (
//           <span style={{ fontSize: '11px', color: '#a0aec0', flexShrink: 0 }}>
//             {node.children.length}
//           </span>
//         )}
//       </div>
//       {hasChildren && open && (
//         <div>
//           {node.children.map((child) => (
//             <TreeNode
//               key={child._isHead ? `h-${child._HSlNo}` : `g-${child.GSlNo}`}
//               node={child}
//               selectedId={selectedId}
//               selectedHeadHSlNo={selectedHeadHSlNo}
//               onSelect={onSelect}
//               level={level + 1}
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// function QuickAddPopover({ levelLabel, parentId, groupData, onSaved, onClose }) {
//   const [name, setName]     = useState('');
//   const [type, setType]     = useState('');
//   const [saving, setSaving] = useState(false);
//   const inputRef            = useRef(null);
//   useEffect(() => { inputRef.current?.focus(); }, []);

//   const handleSave = async () => {
//     const trimmed = name.trim();
//     if (!trimmed)     { toast.error('Please enter a group name'); return; }
//     if (!type.trim()) { toast.error('Please enter a type'); return; }
//     const duplicate = groupData.some(
//       (c) => c.GName?.trim().toLowerCase() === trimmed.toLowerCase() &&
//              Number(c.GUnder ?? 0) === Number(parentId ?? 0)
//     );
//     if (duplicate) { toast.error('Group name already exists at this level'); return; }
//     try {
//       setSaving(true);
//       const res = await api.post('/api/insertupdateacgroupmaster', {
//         GSlNo: 0, GName: trimmed, GUnder: parentId ?? 0,
//         UDate: new Date().toISOString(), Type: type.trim(),
//         Userid: parseInt(sessionStorage.getItem('UserId'), 10) || 0,
//       });
//       if (res.data.success) { toast.success(`"${trimmed}" added`); onSaved(); }
//       else toast.error(res.data.message || 'Failed');
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Request failed');
//     } finally { setSaving(false); }
//   };

//   return (
//     <div style={{
//       position: 'absolute', zIndex: 1050, top: 'calc(100% + 4px)', left: 0, right: 0,
//       background: '#fff', borderRadius: '8px', border: `1px solid ${primaryColor}`,
//       boxShadow: '0 6px 20px rgba(45,75,169,0.15)', padding: '10px 12px',
//     }}>
//       <div style={{ fontSize: '11px', fontWeight: '600', color: primaryColor, marginBottom: '6px' }}>
//         Add new {levelLabel}
//       </div>
//       <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
//         <input ref={inputRef} type="text" className="form-control form-control-sm"
//           placeholder={`Enter ${levelLabel} name…`} value={name}
//           onChange={(e) => setName(e.target.value)}
//           onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose(); }}
//           maxLength={200} style={{ fontSize: '13px' }} />
//         <input type="text" className="form-control form-control-sm"
//           placeholder="Enter type…" value={type}
//           onChange={(e) => setType(e.target.value)}
//           onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose(); }}
//           maxLength={20} style={{ fontSize: '13px' }} />
//         <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
//           <button type="button" className="btn btn-sm" onClick={handleSave} disabled={saving}
//             style={{ background: primaryColor, color: '#fff', border: 'none', borderRadius: '5px', padding: '4px 10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
//             {saving ? <span className="spinner-border spinner-border-sm" /> : <><FaCheck /> Save</>}
//           </button>
//           <button type="button" className="btn btn-sm btn-light" onClick={onClose}
//             style={{ borderRadius: '5px', padding: '4px 8px', fontSize: '13px' }}>
//             <FaTimes />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// function ActionButtons({ isSubmitDisabled, loadingSubmit, isUpdateDisabled, loadingUpdate,
//   isDeleteDisabled, loadingDelete, onUpdate, onDelete, onClear }) {
//   return (
//     <div className="d-flex justify-content-center flex-wrap gap-3 mt-3 pb-2">
//       <button type="submit" className="btn px-4 d-flex align-items-center gap-2"
//         style={btnStyle} disabled={isSubmitDisabled || loadingSubmit}>
//         {loadingSubmit ? <><span className="spinner-border spinner-border-sm" /> Creating...</> : <><FaSave /> Submit</>}
//       </button>
//       <button type="button" className="btn px-4 d-flex align-items-center gap-2"
//         style={btnStyle} disabled={isUpdateDisabled || loadingUpdate} onClick={onUpdate}>
//         {loadingUpdate ? <><span className="spinner-border spinner-border-sm" /> Updating...</> : <><FaEdit /> Update</>}
//       </button>
//       <button type="button" className="btn px-4 d-flex align-items-center gap-2"
//         style={btnStyle} disabled={isDeleteDisabled || loadingDelete} onClick={onDelete}>
//         {loadingDelete ? <><span className="spinner-border spinner-border-sm" /> Deleting...</> : <><FaTrashAlt /> Delete</>}
//       </button>
//       <button type="button" className="btn px-4 d-flex align-items-center gap-2"
//         style={btnStyle} onClick={onClear}>
//         <FaEraser /> Clear
//       </button>
//     </div>
//   );
// }

// const AccountMaster = () => {

//   const [loading,          setLoading]         = useState(false);
//   const [loadingSubmit,    setLoadingSubmit]    = useState(false);
//   const [loadingUpdate,    setLoadingUpdate]    = useState(false);
//   const [loadingDelete,    setLoadingDelete]    = useState(false);

//   const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
//   const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);
//   const [isDeleteDisabled, setIsDeleteDisabled] = useState(true);

//   const [isHead,           setIsHead]           = useState(false);
//   const [searchTerm,       setSearchTerm]       = useState('');
//   const [fieldErrors,      setFieldErrors]      = useState({});
//   const [quickAddIndex,    setQuickAddIndex]    = useState(-1);

//   const [groupData,        setGroupData]        = useState([]);
//   const [treeData,         setTreeData]         = useState([]);
//   const [selectedTreeId,   setSelectedTreeId]   = useState(null);
//   const [selectedHeadHSlNo, setSelectedHeadHSlNo] = useState(null);
//   const [parentPath,       setParentPath]       = useState([]);

//   const [selectedGroup,    setSelectedGroup]    = useState({ id: null, name: '' });
//   const [headData,         setHeadData]         = useState([]);
//   const [allHeadData,      setAllHeadData]      = useState([]);

//   const [group, setGroup] = useState({
//     GSlNo: 0, HSlNo: 0, GName: '', GUnder: 0, Type: '',
//   });

//   // ── Refs: written SYNCHRONOUSLY alongside every setState so handlers always
//   //    read the value that was just set, never a stale closure. ────────────────
//   const groupRef             = useRef(group);
//   const selectedGroupRef     = useRef(selectedGroup);
//   const isHeadRef            = useRef(isHead);          // FIX: kept in sync synchronously
//   const selectedHeadHSlNoRef = useRef(selectedHeadHSlNo);

//   // Helper: set group state AND ref together atomically
//   const setGroupSync = (val) => {
//     const next = typeof val === 'function' ? val(groupRef.current) : val;
//     groupRef.current = next;
//     setGroup(next);
//   };

//   // Helper: set selectedGroup state AND ref together atomically
//   const setSelectedGroupSync = (val) => {
//     const next = typeof val === 'function' ? val(selectedGroupRef.current) : val;
//     selectedGroupRef.current = next;
//     setSelectedGroup(next);
//   };

//   // Helper: set selectedHeadHSlNo state AND ref together atomically
//   const setSelectedHeadHSlNoSync = (val) => {
//     selectedHeadHSlNoRef.current = val;
//     setSelectedHeadHSlNo(val);
//   };

//   // ── FIX: setIsHeadSync — updates the isHead ref SYNCHRONOUSLY (not via useEffect)
//   //    AND resets all form/selection state so switching modes never leaves stale
//   //    HSlNo/GSlNo values behind with Update/Delete buttons still enabled.
//   // ─────────────────────────────────────────────────────────────────────────────
//   const setIsHeadSync = (newIsHead) => {
//     isHeadRef.current = newIsHead;
//     setIsHead(newIsHead);
//     // Reset everything when mode changes — this is what prevents the stale-state bugs
//     setGroupSync({ GSlNo: 0, HSlNo: 0, GName: '', GUnder: 0, Type: '' });
//     setSelectedGroupSync({ id: null, name: '' });
//     setSelectedHeadHSlNoSync(null);
//     setSelectedTreeId(null);
//     setParentPath([]);
//     setHeadData([]);
//     setIsSubmitDisabled(false);
//     setIsUpdateDisabled(true);
//     setIsDeleteDisabled(true);
//     setFieldErrors({});
//     setQuickAddIndex(-1);
//   };
//   // ─────────────────────────────────────────────────────────────────────────────

//   // NOTE: The old `useEffect(() => { isHeadRef.current = isHead; }, [isHead])` is
//   // intentionally REMOVED. isHeadRef is now kept in sync by setIsHeadSync above.

//   useEffect(() => { fetchData(); }, []);

//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       const CompanyId = sessionStorage.getItem('CompanyID');

//       const groupRes = await api.get('/api/getaccountmaster', { params: { CompanyId } });
//       const flat     = groupRes.data?.data || [];
//       setGroupData(flat);

//       let heads = [];
//       try {
//         const headRes = await api.get('/api/getaccountheaddata', { params: { CompanyId } });
//         heads = headRes.data?.data || [];
//       } catch (e) {
//         console.warn('Could not fetch heads for tree:', e.message);
//       }
//       setAllHeadData(heads);
//       setTreeData(buildCombinedTree(flat, heads));
//     } catch {
//       toast.error('Failed to fetch account data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const refreshData = async () => {
//     const CompanyId = sessionStorage.getItem('CompanyID');

//     const groupRes = await api.get('/api/getaccountmaster', { params: { CompanyId } });
//     const flat     = groupRes.data?.data || [];
//     setGroupData(flat);

//     let heads = [];
//     try {
//       const headRes = await api.get('/api/getaccountheaddata', { params: { CompanyId } });
//       heads = headRes.data?.data || [];
//     } catch (e) {
//       console.warn('Could not refresh heads:', e.message);
//     }
//     setAllHeadData(heads);
//     setTreeData(buildCombinedTree(flat, heads));
//   };

//   const fetchHeadData = async (groupId) => {
//     if (!groupId) { setHeadData([]); return; }
//     try {
//       const res = await api.get('/api/getAccountHeadnew', { params: { groupid: groupId } });
//       if (res.data.success) setHeadData(res.data.data || []);
//       else { toast.error(res.data.message || 'Failed to fetch heads'); setHeadData([]); }
//     } catch {
//       toast.error('Failed to fetch head data');
//       setHeadData([]);
//     }
//   };

//   const getChildren = (parentId) =>
//     groupData.filter((c) => Number(c.GUnder ?? 0) === Number(parentId));

//   const rootGroups = groupData.filter((c) => !c.GUnder || Number(c.GUnder) === 0);

//   const buildAncestorPath = (node) => {
//     const path = [];
//     let current = node.GUnder ? groupData.find((c) => c.GSlNo === Number(node.GUnder)) : null;
//     while (current) {
//       path.unshift(current.GSlNo);
//       current = current.GUnder ? groupData.find((c) => c.GSlNo === Number(current.GUnder)) : null;
//     }
//     return path;
//   };

//   // ── selectHead — single function used by BOTH tree click and table row click
//   const selectHead = (hSlNo, hName, gUnder, type, parentGroupId, parentGroupName) => {
//     const newGroup = {
//       GSlNo:  0,
//       HSlNo:  Number(hSlNo) || 0,
//       GName:  hName || '',
//       GUnder: Number(gUnder) || 0,
//       Type:   type || '',
//     };
//     setGroupSync(newGroup);
//     setSelectedGroupSync({ id: parentGroupId, name: parentGroupName });
//     setSelectedHeadHSlNoSync(Number(hSlNo) || null);
//     setSelectedTreeId(-(Number(hSlNo)));
//     setIsSubmitDisabled(true);
//     setIsUpdateDisabled(false);
//     setIsDeleteDisabled(false);
//     setFieldErrors({});
//   };

//   const handleTreeSelect = (node) => {
//     if (isHeadRef.current) {
//       // ── HEAD MODE ──────────────────────────────────────────────────────────
//       if (node._isHead) {
//         const parentGUnder = Number(node.GUnder) || 0;
//         const parentGroup  = groupData.find((c) => Number(c.GSlNo) === parentGUnder);
//         selectHead(
//           node._HSlNo,
//           node._HName || '',
//           parentGUnder,
//           node.Type || '',
//           parentGUnder,
//           parentGroup?.GName || ''
//         );
//       } else {
//         // Clicked a GROUP node while in Head mode — set group context only, no edit
//         setSelectedGroupSync({ id: node.GSlNo, name: node.GName });
//         fetchHeadData(node.GSlNo);
//         setGroupSync({ GSlNo: 0, HSlNo: 0, GName: '', GUnder: node.GSlNo, Type: '' });
//         setSelectedHeadHSlNoSync(null);
//         setSelectedTreeId(node.GSlNo);
//         setIsSubmitDisabled(false);
//         setIsUpdateDisabled(true);
//         setIsDeleteDisabled(true);
//         setFieldErrors({});
//       }
//     } else {
//       // ── GROUP MODE ─────────────────────────────────────────────────────────
//       // FIX: In Group mode, clicking a head node does nothing.
//       // This prevents accidentally filling the group form with head data,
//       // which was causing bogus submissions and confusing button states.
//       if (node._isHead) return;

//       setSelectedHeadHSlNoSync(null);
//       const path = buildAncestorPath(node);
//       setParentPath(path);
//       setGroupSync({
//         GSlNo:  node.GSlNo,
//         HSlNo:  0,
//         GName:  node.GName  || '',
//         GUnder: node.GUnder ? Number(node.GUnder) : 0,
//         Type:   node.Type   || '',
//       });
//       setSelectedTreeId(node.GSlNo);
//       setIsSubmitDisabled(true);
//       setIsUpdateDisabled(false);
//       setIsDeleteDisabled(false);
//       setFieldErrors({});
//       setQuickAddIndex(-1);
//     }
//   };

//   const handleDropdownChange = (depth, value) => {
//     const val     = value ? parseInt(value) : null;
//     const newPath = [...parentPath.slice(0, depth), ...(val ? [val] : [])];
//     setParentPath(newPath);
//     const parentId = newPath.length > 0 ? newPath[newPath.length - 1] : 0;
//     setGroupSync((prev) => ({ ...prev, GUnder: parentId || 0 }));
//     setQuickAddIndex(-1);
//   };

//   const handleQuickAddSaved = async () => {
//     setQuickAddIndex(-1);
//     try {
//       setLoading(true);
//       await refreshData();
//     } catch {
//       toast.error('Failed to refresh group data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const validateFields = () => {
//     const currentGroup         = groupRef.current;
//     const currentSelectedGroup = selectedGroupRef.current;
//     const currentIsHead        = isHeadRef.current;

//     const errors = {};
//     if (currentIsHead) {
//       if (!currentSelectedGroup.id)         errors.AccountGroup = 'Please select an Account Group from the tree';
//       if (!currentGroup.GName?.trim())      errors.GName        = 'Head name is required';
//       if (!currentGroup.Type?.trim())       errors.Type         = 'Type is required';
//     } else {
//       if (!currentGroup.GName?.trim())      errors.GName = 'Group Name is required';
//       if (!currentGroup.Type?.trim())       errors.Type  = 'Type is required';
//     }
//     return errors;
//   };

//   const checkDuplicate = (name, currentId = null) =>
//     groupData.some((c) => {
//       const isSame = c.GName?.trim().toLowerCase() === name.trim().toLowerCase();
//       return currentId ? isSame && c.GSlNo !== currentId : isSame;
//     });

//   const buildGroupPayload = (overrides = {}) => {
//     const g = groupRef.current;
//     return {
//       GName:  g.GName?.trim() || '',
//       GUnder: g.GUnder ?? 0,
//       UDate:  new Date().toISOString(),
//       Type:   g.Type?.trim()  || '',
//       Userid: parseInt(sessionStorage.getItem('UserId'), 10) || 0,
//       ...overrides
//     };
//   };

//   const buildHeadPayload = (overrides = {}) => {
//     const g  = groupRef.current;
//     const sg = selectedGroupRef.current;
//     return {
//       HName:  g.GName?.trim()       || '',
//       GUnder: sg.id ?? g.GUnder ?? 0,
//       UDate:  new Date().toISOString(),
//       Type:   g.Type?.trim()        || '',
//       Userid: parseInt(sessionStorage.getItem('UserId'), 10) || 0,
//       ...overrides
//     };
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const errors = validateFields();
//     setFieldErrors(errors);
//     if (Object.keys(errors).length > 0) return;

//     const currentGroup         = groupRef.current;
//     const currentSelectedGroup = selectedGroupRef.current;
//     const currentIsHead        = isHeadRef.current;

//     try {
//       setLoadingSubmit(true);

//       if (currentIsHead) {
//         const res = await api.post('/api/insertUpdateAccountHead', buildHeadPayload({ HSlNo: 0 }));
//         if (res.data.success) {
//           toast.success('Head created successfully');
//           await refreshData();
//           await fetchHeadData(currentSelectedGroup.id);
//           setGroupSync({ GSlNo: 0, HSlNo: 0, GName: '', GUnder: currentSelectedGroup.id, Type: '' });
//           setSelectedHeadHSlNoSync(null);
//           setIsSubmitDisabled(false);
//           setIsUpdateDisabled(true);
//           setIsDeleteDisabled(true);
//           setFieldErrors({});
//         } else { toast.error(res.data.message || 'Operation failed'); }

//       } else {
//         if (checkDuplicate(currentGroup.GName)) { toast.error('Name already exists'); return; }
//         const res = await api.post('/api/insertupdateacgroupmaster', buildGroupPayload({ GSlNo: 0 }));
//         if (res.data.success) {
//           toast.success('Group created successfully');
//           await refreshData();
//           resetFormFields();
//           setFieldErrors({});
//         } else { toast.error(res.data.message || 'Operation failed'); }
//       }
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Request failed');
//     } finally { setLoadingSubmit(false); }
//   };

//   const handleHeadselect=(head)=>{
//     setGroupSync((prev)=>({
//       ...prev,
//       HSlNo:head.HSlNo,
//       GName: head.HeadName
//     }))
//     selectedHeadHSlNoRef.current = head.HSlNo
//   }

//   const handleUpdate = async (e) => {
//     if (e?.preventDefault) e.preventDefault();
//     const errors = validateFields();
//     setFieldErrors(errors);
//     if (Object.keys(errors).length > 0) return;

//     const currentGroup         = groupRef.current;
//     const currentSelectedGroup = selectedGroupRef.current;
//     const currentIsHead        = isHeadRef.current;

//     try {
//       setLoadingUpdate(true);

//       if (currentIsHead) {
//         const hSlNo = currentGroup.HSlNo || selectedHeadHSlNoRef.current || 0;
//         if (!hSlNo || hSlNo === 0) {
//           toast.error('No head selected for update. Please select a head from the list.');
//           return;
//         }
//         const res = await api.post('/api/insertUpdateAccountHead', buildHeadPayload({ HSlNo: hSlNo }));
//         if (res.data.success) {
//           toast.success('Head updated successfully');
//           await refreshData();
//           await fetchHeadData(currentSelectedGroup.id);
//           setGroupSync({ GSlNo: 0, HSlNo: 0, GName: '', GUnder: currentSelectedGroup.id, Type: '' });
//           setSelectedHeadHSlNoSync(null);
//           setIsSubmitDisabled(false);
//           setIsUpdateDisabled(true);
//           setIsDeleteDisabled(true);
//           setFieldErrors({});
//         } else { toast.error(res.data.message || 'Update failed'); }

//       } else {
//         if (checkDuplicate(currentGroup.GName, currentGroup.GSlNo)) { toast.error('Name already exists'); return; }
//         const res = await api.post('/api/insertupdateacgroupmaster', buildGroupPayload({ GSlNo: currentGroup.GSlNo }));
//         if (res.data.success) {
//           toast.success('Group updated successfully');
//           await refreshData();
//           setGroupSync({ GSlNo: 0, HSlNo: 0, GName: '', GUnder: 0, Type: '' });
//           setParentPath([]);
//           setSelectedTreeId(null);
//           setSelectedHeadHSlNoSync(null);
//           setIsSubmitDisabled(false);
//           setIsUpdateDisabled(true);
//           setIsDeleteDisabled(true);
//           setFieldErrors({});
//           setQuickAddIndex(-1);
//         } else { toast.error(res.data.message || 'Update failed'); }
//       }
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Update request failed');
//     } finally { setLoadingUpdate(false); }
//   };

//   const handleDelete = async () => {
//     const currentGroup         = groupRef.current;
//     const currentSelectedGroup = selectedGroupRef.current;
//     const currentIsHead        = isHeadRef.current;

//     const hSlNo = currentIsHead
//       ? (currentGroup.HSlNo || selectedHeadHSlNoRef.current || 0)
//       : 0;

//     if (currentIsHead && (!hSlNo || hSlNo === 0)) {
//       toast.error('No head selected. Please select a head from the list.'); return;
//     }
//     if (!currentIsHead && (!currentGroup.GSlNo || currentGroup.GSlNo === 0)) {
//       toast.error('No group selected'); return;
//     }

//     if (!currentIsHead) {
//       const hasChildren = groupData.some((c) => Number(c.GUnder ?? 0) === currentGroup.GSlNo);
//       if (hasChildren) { toast.error('Cannot delete — this group has sub-items. Remove children first.'); return; }
//     }

//     const confirmed = await confirmDeleteToast();
//     if (!confirmed) return;

//     try {
//       setLoadingDelete(true);

//       if (currentIsHead) {
//         const res = await api.delete('/api/deleteAccountHead', {
//           data: {
//             HSlNo:  hSlNo,
//             HName:  currentGroup.GName?.trim() || '',
//             Userid: parseInt(sessionStorage.getItem('UserId'), 10) || 0
//           }
//         });
//         if (res.data.success) {
//           toast.success('Head deleted successfully');
//           await refreshData();
//           await fetchHeadData(currentSelectedGroup.id);
//           setGroupSync({ GSlNo: 0, HSlNo: 0, GName: '', GUnder: currentSelectedGroup.id, Type: '' });
//           setSelectedHeadHSlNoSync(null);
//           setIsSubmitDisabled(false);
//           setIsUpdateDisabled(true);
//           setIsDeleteDisabled(true);
//           setFieldErrors({});
//         } else { toast.error(res.data.message || 'Delete failed'); }

//       } else {
//         const res = await api.delete('/api/deleteitemAccount', {
//           data: { GSlNo: currentGroup.GSlNo, GName: currentGroup.GName?.trim() || '' }
//         });
//         if (res.data.success) {
//           toast.success('Deleted successfully');
//           await refreshData();
//           resetFormFields();
//           setSelectedTreeId(null);
//           setFieldErrors({});
//         } else { toast.error(res.data.message || 'Delete failed'); }
//       }
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Delete error');
//     } finally { setLoadingDelete(false); }
//   };

//   const confirmDeleteToast = () =>
//     new Promise((resolve) => {
//       const toastId = toast.warning(
//         () => (
//           <div>
//             <div className="mb-2">Are you sure you want to delete this record?</div>
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

//   const resetFormFields = () => {
//     setGroupSync({ GSlNo: 0, HSlNo: 0, GName: '', GUnder: 0, Type: '' });
//     setSelectedHeadHSlNoSync(null);
//     setIsSubmitDisabled(false);
//     setIsUpdateDisabled(true);
//     setIsDeleteDisabled(true);
//     setFieldErrors({});
//     setQuickAddIndex(-1);
//   };

//   const handleClear = () => {
//     toast.dismiss();
//     setGroupSync((prev) => ({ ...prev, GName: '', Type: '' }));
//     setFieldErrors({});
//     setQuickAddIndex(-1);
//   };

//   const handleCreateNew = () => {
//     toast.dismiss();
//     setGroupSync({ GSlNo: 0, HSlNo: 0, GName: '', GUnder: 0, Type: '' });
//     setSelectedGroupSync({ id: null, name: '' });
//     setHeadData([]);
//     setSelectedTreeId(null);
//     setSelectedHeadHSlNoSync(null);
//     setParentPath([]);
//     setIsSubmitDisabled(false);
//     setIsUpdateDisabled(true);
//     setIsDeleteDisabled(true);
//     setFieldErrors({});
//     setQuickAddIndex(-1);
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setGroupSync((prev) => ({ ...prev, [name]: value }));
//   };

//   const filterTree = (nodes, term) => {
//     if (!term.trim()) return nodes;
//     return nodes.reduce((acc, node) => {
//       const filteredChildren = filterTree(node.children || [], term);
//       const matches = node.GName?.toLowerCase().includes(term.toLowerCase());
//       if (matches || filteredChildren.length > 0) acc.push({ ...node, children: filteredChildren });
//       return acc;
//     }, []);
//   };

//   const filteredTree = filterTree(treeData, searchTerm);

//   const dropdownLevels = (() => {
//     const levels = [{ label: 'Group', items: rootGroups, depth: 0, parentId: 0 }];
//     for (let idx = 0; idx < parentPath.length; idx++) {
//       const pid      = parentPath[idx];
//       const children = getChildren(pid);
//       levels.push({ label: getLevelLabel(idx + 1), items: children, depth: idx + 1, parentId: pid });
//       if (!parentPath[idx + 1] || children.length === 0) break;
//     }
//     return levels;
//   })();

//   const isEditing = isHead ? group.HSlNo > 0 : group.GSlNo > 0;

//   return (
//     <div className="page-wrapper" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
//       <div className="page-body mt-1">
//         <div className="container-fluid px-4">
//           <ToastContainer position="top-center" autoClose={3000} />

//           <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
//             <div className="card-body p-4">
//               <h2 className="mb-3" style={{ fontWeight: '600', color: '#2d3748', fontSize: '28px' }}>
//                 <FaLayerGroup className="me-2" style={{ color: primaryColor }} />
//                 Account Group Master
//               </h2>
//               <div className="d-flex gap-3 mb-3 flex-wrap">
//                 {['Group', 'Main Group', 'Sub Group', 'Deep Level'].map((label, i) => (
//                   <span key={i} style={{
//                     fontSize: '11px', padding: '2px 10px', borderRadius: '10px',
//                     background: getLevelColor(i).bg, color: getLevelColor(i).text,
//                     border: `1px solid ${getLevelColor(i).border}`
//                   }}>{label}</span>
//                 ))}
//               </div>
//               <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
//                 <div style={{ maxWidth: '700px', flex: 1 }}>
//                   <div className="input-group" style={{ height: '45px' }}>
//                     <span className="input-group-text text-white" style={{ backgroundColor: primaryColor }}>
//                       <FaSearch />
//                     </span>
//                     <input type="text" className="form-control border-start-0"
//                       placeholder="Search groups..." value={searchTerm}
//                       onChange={(e) => setSearchTerm(e.target.value)}
//                       style={{ backgroundColor: '#fff', borderColor: '#e2e8f0', height: '45px', fontSize: '14px' }} />
//                   </div>
//                 </div>
//                 <button type="button" className="btn d-flex align-items-center gap-2"
//                   onClick={handleCreateNew}
//                   style={{ borderRadius: '5px', padding: '8px 20px', background: primaryColor, border: 'none', color: 'white', height: '45px', whiteSpace: 'nowrap' }}>
//                   <FaPlus /> Create New
//                 </button>
//               </div>
//             </div>
//           </div>

//           <div className="row g-3">

//             <div className="col-lg-6">
//               <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', overflow: 'hidden' }}>
//                 <div className="card-body p-0">
//                   {loading ? (
//                     <div className="text-center p-5">
//                       <div className="spinner-border" role="status" style={{ color: primaryColor }} />
//                       <p className="mt-3 text-muted">Loading groups...</p>
//                     </div>
//                   ) : (
//                     <div style={{ maxHeight: '600px', overflowY: 'auto', padding: '12px 16px' }}>
//                       <div style={{
//                         padding: '6px 0 10px', borderBottom: '1px solid #e2e8f0',
//                         fontWeight: '600', fontSize: '13px', color: '#4a5568', marginBottom: '10px'
//                       }}>
//                         Group Structure
//                       </div>
//                       {filteredTree.length > 0 ? (
//                         filteredTree.map((node) => (
//                           <TreeNode
//                             key={node._isHead ? `h-${node._HSlNo}` : `g-${node.GSlNo}`}
//                             node={node}
//                             selectedId={selectedTreeId}
//                             selectedHeadHSlNo={selectedHeadHSlNo}
//                             onSelect={handleTreeSelect}
//                             level={0}
//                           />
//                         ))
//                       ) : (
//                         <div className="text-center p-5">
//                           <FaLayerGroup className="mb-3" style={{ fontSize: '48px', color: '#cbd5e0' }} />
//                           <p className="text-muted mb-3">No groups found</p>
//                           <button className="btn" onClick={handleCreateNew}
//                             style={{ borderRadius: '5px', padding: '10px 24px', background: primaryColor, border: 'none', color: 'white', fontSize: '14px' }}>
//                             <FaPlus className="me-2" />Create New Group
//                           </button>
//                         </div>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>

//             <div className="col-lg-6">
//               <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', overflow: 'hidden' }}>

//                 <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-0"
//                   style={{ borderBottom: '1px solid #e2e8f0' }}>
//                   <h4 className="m-0" style={{ color: '#2d3748', fontWeight: '600', fontSize: '18px' }}>
//                     <FaLayerGroup className="me-2" style={{ color: primaryColor }} />
//                     {isHead
//                       ? (isEditing ? 'Edit Account Head'  : 'New Account Head')
//                       : (isEditing ? 'Edit Account Group' : 'New Account Group')
//                     }
//                   </h4>
//                   {/* FIX: Use setIsHeadSync so the ref is updated synchronously
//                       and the form resets cleanly — prevents stale-state update/delete bugs */}
//                   <div className="d-flex align-items-center gap-2">
//                     <span className="fw-medium" style={{ color: !isHead ? primaryColor : '#a0aec0', cursor: 'pointer' }}
//                       onClick={() => setIsHeadSync(false)}>Group</span>
//                     <Form.Check type="switch" id="custom-switch" checked={isHead}
//                       onChange={(e) => setIsHeadSync(e.target.checked)} />
//                     <span className="fw-medium" style={{ color: isHead ? primaryColor : '#a0aec0', cursor: 'pointer' }}
//                       onClick={() => setIsHeadSync(true)}>Head</span>
//                   </div>
//                 </div>

//                 <div className="card-body" style={{ maxHeight: '650px', overflowY: 'auto', padding: '16px' }}>
//                   <form onSubmit={handleSubmit}>

//                     {!isHead && (
//                       <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: '10px' }}>
//                         <div className="card-header bg-white"
//                           style={{ borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: primaryColor }}>
//                           <FaLayerGroup className="me-2" />Group Details
//                         </div>
//                         <div className="card-body p-4">
//                           <div className="row">

//                             <div className="col-md-8 mb-3">
//                               <label className="form-label fw-medium mb-2">
//                                 Group Name <span className="text-danger">*</span>
//                               </label>
//                               <input
//                                 className={`form-control ${fieldErrors.GName ? 'is-invalid' : ''}`}
//                                 name="GName" value={group.GName || ''} onChange={handleInputChange}
//                                 placeholder="Enter group name" maxLength={200} autoFocus />
//                               {fieldErrors.GName && <div className="invalid-feedback">{fieldErrors.GName}</div>}
//                             </div>

//                             <div className="col-md-4 mb-3">
//                               <label className="form-label fw-medium mb-2">
//                                 Type <span className="text-danger">*</span>
//                               </label>
//                               <input
//                                 className={`form-control ${fieldErrors.Type ? 'is-invalid' : ''}`}
//                                 name="Type" value={group.Type || ''} onChange={handleInputChange}
//                                 placeholder="Enter type" maxLength={20} />
//                               {fieldErrors.Type && <div className="invalid-feedback">{fieldErrors.Type}</div>}
//                             </div>

//                             {dropdownLevels.map((lvl, idx) => (
//                               <div className="col-md-12 mb-3" key={idx}>
//                                 <label className="form-label fw-medium mb-2 d-flex align-items-center justify-content-between">
//                                   <span>
//                                     <span style={{
//                                       display: 'inline-block', width: '10px', height: '10px',
//                                       borderRadius: '50%', background: getLevelColor(idx).text, marginRight: '6px'
//                                     }} />
//                                     {parentPath[idx - 1]
//                                       ? dropdownLevels[idx - 1]?.items.find((c) => c.GSlNo === parentPath[idx - 1])?.GName
//                                       : lvl.label}
//                                   </span>
//                                   <button type="button"
//                                     onClick={() => setQuickAddIndex(quickAddIndex === idx ? -1 : idx)}
//                                     style={{
//                                       width: '22px', height: '22px', borderRadius: '50%',
//                                       border: `1.5px solid ${getLevelColor(idx).text}`,
//                                       background: quickAddIndex === idx ? getLevelColor(idx).text : getLevelColor(idx).bg,
//                                       color: quickAddIndex === idx ? '#fff' : getLevelColor(idx).text,
//                                       display: 'flex', alignItems: 'center', justifyContent: 'center',
//                                       cursor: 'pointer', padding: 0, fontSize: '11px',
//                                       transition: 'all 0.15s', flexShrink: 0
//                                     }}>
//                                     {quickAddIndex === idx ? <FaTimes /> : <FaPlus />}
//                                   </button>
//                                 </label>
//                                 <div style={{ position: 'relative' }}>
//                                   <select className="form-select" value={parentPath[idx] || ''}
//                                     onChange={(e) => handleDropdownChange(idx, e.target.value)}
//                                     disabled={idx > 0 && !parentPath[idx - 1]}>
//                                     <option value="">{idx === 0 ? '— Root (no parent) —' : `— Select ${lvl.label} —`}</option>
//                                     {lvl.items.map((c) => (
//                                       <option key={c.GSlNo} value={c.GSlNo}>{c.GName}</option>
//                                     ))}
//                                   </select>
//                                   {quickAddIndex === idx && (
//                                     <QuickAddPopover levelLabel={lvl.label} parentId={lvl.parentId}
//                                       groupData={groupData} onSaved={() => handleQuickAddSaved(idx)}
//                                       onClose={() => setQuickAddIndex(-1)} />
//                                   )}
//                                 </div>
//                               </div>
//                             ))}

//                             <div className="col-12 mb-2">
//                               <div style={{
//                                 padding: '8px 14px', borderRadius: '8px',
//                                 background: 'rgba(45,75,169,0.06)', border: '1px solid rgba(45,75,169,0.2)',
//                                 fontSize: '13px', color: '#4a5568'
//                               }}>
//                                 <strong style={{ color: primaryColor }}>
//                                   {isEditing ? 'Will be updated under: ' : 'Will be created under: '}
//                                 </strong>
//                                 {!group.GUnder || group.GUnder === 0
//                                   ? 'Root level (no parent)'
//                                   : (() => { const p = groupData.find((c) => c.GSlNo === group.GUnder); return p ? p.GName : 'Root level'; })()
//                                 }
//                               </div>
//                             </div>

//                             {isEditing && (
//                               <div className="col-12 mb-2">
//                                 <div style={{
//                                   padding: '8px 14px', borderRadius: '8px',
//                                   background: 'rgba(221,107,32,0.06)', border: '1px solid rgba(221,107,32,0.3)',
//                                   fontSize: '12px', color: 'rgb(180,83,9)'
//                                 }}>
//                                   ℹ️ <strong>Note:</strong> Updating will change the <strong>Group Name</strong>.
//                                 </div>
//                               </div>
//                             )}

//                           </div>
//                         </div>
//                       </div>
//                     )}

//                     {isHead && (
//                       <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: '10px' }}>
//                         <div className="card-header bg-white"
//                           style={{ borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: primaryColor }}>
//                           <FaLayerGroup className="me-2" />Head Details
//                         </div>
//                         <div className="card-body p-4">
//                           <div className="row align-items-start">

//                             <div className="col-md-4 mb-3">
//                               <label className="form-label fw-medium mb-2">
//                                 Account Group <span className="text-danger">*</span>
//                               </label>
//                               <input type="text" className="form-control"
//                                 value={selectedGroup.name || ''}
//                                 readOnly
//                                 placeholder="Select a group from the tree"
//                                 style={{
//                                   ...inputStyle,
//                                   background: selectedGroup.name ? 'rgba(45,75,169,0.04)' : '#f8f9fa',
//                                   color: selectedGroup.name ? 'rgb(45,75,169)' : '#a0aec0',
//                                   fontWeight: selectedGroup.name ? '500' : '400',
//                                   cursor: 'default',
//                                   border: selectedGroup.name ? '1px solid rgba(45,75,169,0.4)' : '1px solid #ced4da'
//                                 }}
//                               />
//                               {fieldErrors.AccountGroup && (
//                                 <div style={{ fontSize: '12px', color: '#dc3545', marginTop: '4px' }}>
//                                   {fieldErrors.AccountGroup}
//                                 </div>
//                               )}
//                               {!selectedGroup.name && (
//                                 <div style={{ fontSize: '11px', color: '#a0aec0', marginTop: '4px' }}>
//                                   ← Click any group in the tree
//                                 </div>
//                               )}
//                             </div>

//                             <div className="col-md-4 mb-3">
//                               <label className="form-label fw-medium mb-2">
//                                 Head <span className="text-danger">*</span>
//                               </label>
//                               <input
//                                 className={`form-control ${fieldErrors.GName ? 'is-invalid' : ''}`}
//                                 name="GName" value={group.GName || ''} onChange={handleInputChange}
//                                 placeholder="Enter head name" maxLength={200} style={inputStyle} />
//                               {fieldErrors.GName && <div className="invalid-feedback">{fieldErrors.GName}</div>}
//                             </div>

//                             <div className="col-md-4 mb-3">
//                               <label className="form-label fw-medium mb-2">
//                                 Type <span className="text-danger">*</span>
//                               </label>
//                               <input
//                                 className={`form-control ${fieldErrors.Type ? 'is-invalid' : ''}`}
//                                 name="Type" value={group.Type || ''}
//                                 onChange={handleInputChange} placeholder="Enter type" maxLength={20} style={inputStyle} />
//                               {fieldErrors.Type && <div className="invalid-feedback">{fieldErrors.Type}</div>}
//                             </div>

//                           </div>
//                         </div>
//                       </div>
//                     )}

//                     <ActionButtons
//                       isSubmitDisabled={isSubmitDisabled} loadingSubmit={loadingSubmit}
//                       isUpdateDisabled={isUpdateDisabled} loadingUpdate={loadingUpdate}
//                       isDeleteDisabled={isDeleteDisabled} loadingDelete={loadingDelete}
//                       onUpdate={handleUpdate} onDelete={handleDelete} onClear={handleClear}
//                     />
//                   </form>

//                   {isHead && selectedGroup.id && (
//                     <div className="card border-0 shadow-sm mt-3" style={{ borderRadius: '10px' }}>
//                       <div className="card-header bg-white"
//                         style={{ borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: primaryColor, fontSize: '14px' }}>
//                         Heads under <span className="ms-1" style={{ fontStyle: 'italic' }}>{selectedGroup.name}</span>
//                       </div>
//                       <div className="card-body p-0">
//                         <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
//                           <table className="table table-bordered table-hover mb-0">
//                             <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
//                               <tr>
//                                 <th style={{ fontSize: '13px' }}>#</th>
//                                 <th style={{ fontSize: '13px' }}>Head Name</th>
//                                 <th style={{ fontSize: '13px' }}>Type</th>
//                               </tr>
//                             </thead>
//                             <tbody>
//                               {headData.length > 0 ? (
//                                 headData.map((item, index) => (
//                                   <tr
//                                     key={item.HSlNo ?? index}
//                                     style={{
//                                       cursor: 'pointer',
//                                       background: selectedHeadHSlNo === Number(item.HSlNo)
//                                         ? 'rgba(45,75,169,0.08)'
//                                         : 'transparent'
//                                     }}
//                                     onClick={() => {
//                                       selectHead(
//                                         item.HSlNo,
//                                         item.HName || '',
//                                         Number(item.GUnder) || 0,
//                                         item.Type || '',
//                                         selectedGroupRef.current.id,
//                                         selectedGroupRef.current.name
//                                       );
//                                     }}
//                                   >
//                                     <td style={{ fontSize: '13px' }}>{index + 1}</td>
//                                     <td style={{ fontSize: '13px' }}>{item.HName}</td>
//                                     <td style={{ fontSize: '13px' }}>{item.Type}</td>
//                                   </tr>
//                                 ))
//                               ) : (
//                                 <tr>
//                                   <td colSpan="3" className="text-center py-4 text-muted" style={{ fontSize: '13px' }}>
//                                     No heads found under this group
//                                   </td>
//                                 </tr>
//                               )}
//                             </tbody>
//                           </table>
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                 </div>
//               </div>
//             </div>

//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AccountMaster;
import React, { useState, useEffect, useRef } from 'react';
import api from '../../apiService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Form from 'react-bootstrap/Form';
import { usePermission } from '../../../src/context/permissionContex';
import {
  FaSearch, FaPlus, FaSave, FaEdit, FaTrashAlt,
  FaEraser, FaChevronRight, FaChevronDown,
  FaLayerGroup, FaTimes, FaCheck
} from 'react-icons/fa';


const primaryColor = 'rgb(45, 75, 169)';

const btnStyle = {
  minWidth: '120px',
  borderRadius: '5px',
  fontWeight: '500',
  background: 'transparent',
  border: `2px solid ${primaryColor}`,
  color: primaryColor,
  padding: '10px 20px',
  fontSize: '14px'
};

const inputStyle = {
  borderRadius: '6px',
  border: '1px solid #ced4da',
  minHeight: '38px',
  fontSize: '14px',
};

const levelColors = [
  { bg: 'rgba(45,75,169,0.08)',   border: 'rgba(45,75,169,0.3)',   text: 'rgb(45,75,169)'  },
  { bg: 'rgba(56,161,105,0.08)',  border: 'rgba(56,161,105,0.3)',  text: 'rgb(38,128,80)'  },
  { bg: 'rgba(221,107,32,0.08)',  border: 'rgba(221,107,32,0.3)',  text: 'rgb(180,83,9)'   },
  { bg: 'rgba(159,122,234,0.08)', border: 'rgba(159,122,234,0.3)', text: 'rgb(107,70,193)' },
];

const getLevelColor = (level) => levelColors[level % levelColors.length];
const getLevelLabel = (level) => {
  if (level === 0) return 'Group';
  if (level === 1) return 'Main Group';
  if (level === 2) return 'Sub Group';
  return `Level ${level}`;
};

const buildTree = (flat, parentId = 0) =>
  flat
    .filter((item) => Number(item.GUnder ?? 0) === parentId)
    .map((item) => ({ ...item, children: buildTree(flat, item.GSlNo) }));

const buildCombinedTree = (groups, heads) => {
  const inject = (nodes) =>
    nodes.map((node) => {
      const headLeaves = heads
        .filter((h) => Number(h.GUnder ?? 0) === Number(node.GSlNo))
        .map((h) => ({
          GSlNo:   -(Number(h.HSlNo) || 0),
          GName:    h.HName || h.GName || '',
          GUnder:   h.GUnder,
          Type:     h.Type  || '',
          _isHead:  true,
          _HSlNo:   Number(h.HSlNo) || 0,
          _HName:   h.HName || h.GName || '',
          children: [],
        }));
      return {
        ...node,
        children: [...inject(node.children || []), ...headLeaves],
      };
    });
  return inject(buildTree(groups));
};

const headColor = {
  bg:     'rgba(56,178,172,0.10)',
  border: 'rgba(56,178,172,0.40)',
  dot:    'rgb(49,151,149)',
  text:   'rgb(44,122,123)',
};

function TreeNode({ node, selectedId, selectedHeadHSlNo, onSelect, level = 0 }) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isHeadNode  = node._isHead === true;

  const isSelected = isHeadNode
    ? (selectedHeadHSlNo != null && selectedHeadHSlNo === node._HSlNo)
    : (selectedId === node.GSlNo);

  const col = getLevelColor(level);

  return (
    <div style={{ marginBottom: '3px' }}>
      <div
        onClick={() => onSelect(node)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          paddingLeft: `${level * 20 + 8}px`,
          paddingTop: '6px', paddingBottom: '6px', paddingRight: '10px',
          borderRadius: '7px',
          background: isSelected ? (isHeadNode ? headColor.bg   : col.bg)     : 'transparent',
          border:     isSelected ? `1px solid ${isHeadNode ? headColor.border : col.border}` : '1px solid transparent',
          cursor: 'pointer', transition: 'all 0.15s', userSelect: 'none'
        }}
      >
        <span
          onClick={(e) => { e.stopPropagation(); if (hasChildren) setOpen((o) => !o); }}
          style={{ width: '14px', flexShrink: 0, color: isHeadNode ? headColor.dot : col.text, fontSize: '10px', cursor: hasChildren ? 'pointer' : 'default' }}
        >
          {hasChildren ? (open ? <FaChevronDown /> : <FaChevronRight />) : null}
        </span>
        <span style={{
          width: '7px', height: '7px',
          borderRadius: isHeadNode ? '2px' : '50%',
          background: isHeadNode ? headColor.dot : col.text,
          flexShrink: 0, opacity: 0.8
        }} />
        <span style={{
          flex: 1, fontSize: '13px',
          fontWeight: isHeadNode ? '400' : (level === 0 ? '600' : level === 1 ? '500' : '400'),
          color: isSelected
            ? (isHeadNode ? headColor.text : col.text)
            : (isHeadNode ? '#4a5568' : '#2d3748'),
          fontStyle: isHeadNode ? 'italic' : 'normal',
        }}>
          {node.GName}
        </span>
        {isHeadNode && (
          <span style={{
            fontSize: '9px', padding: '1px 5px', borderRadius: '8px',
            background: 'rgba(56,178,172,0.12)', color: headColor.text,
            border: `1px solid ${headColor.border}`, flexShrink: 0, fontStyle: 'normal'
          }}>head</span>
        )}
        {hasChildren && !isHeadNode && (
          <span style={{ fontSize: '11px', color: '#a0aec0', flexShrink: 0 }}>
            {node.children.length}
          </span>
        )}
      </div>
      {hasChildren && open && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child._isHead ? `h-${child._HSlNo}` : `g-${child.GSlNo}`}
              node={child}
              selectedId={selectedId}
              selectedHeadHSlNo={selectedHeadHSlNo}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QuickAddPopover({ levelLabel, parentId, groupData, onSaved, onClose }) {
  const [name, setName]     = useState('');
  const [type, setType]     = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef            = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed)     { toast.error('Please enter a group name'); return; }
    if (!type.trim()) { toast.error('Please enter a type'); return; }
    const duplicate = groupData.some(
      (c) => c.GName?.trim().toLowerCase() === trimmed.toLowerCase() &&
             Number(c.GUnder ?? 0) === Number(parentId ?? 0)
    );
    if (duplicate) { toast.error('Group name already exists at this level'); return; }
    try {
      setSaving(true);
      const res = await api.post('/api/insertupdateacgroupmaster', {
        GSlNo: 0, GName: trimmed, GUnder: parentId ?? 0,
        UDate: new Date().toISOString(), Type: type.trim(),
        Userid: parseInt(sessionStorage.getItem('UserId'), 10) || 0,
      });
      if (res.data.success) { toast.success(`"${trimmed}" added`); onSaved(); }
      else toast.error(res.data.message || 'Failed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally { setSaving(false); }
  };

  return (
    <div style={{
      position: 'absolute', zIndex: 1050, top: 'calc(100% + 4px)', left: 0, right: 0,
      background: '#fff', borderRadius: '8px', border: `1px solid ${primaryColor}`,
      boxShadow: '0 6px 20px rgba(45,75,169,0.15)', padding: '10px 12px',
    }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: primaryColor, marginBottom: '6px' }}>
        Add new {levelLabel}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <input ref={inputRef} type="text" className="form-control form-control-sm"
          placeholder={`Enter ${levelLabel} name…`} value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose(); }}
          maxLength={200} style={{ fontSize: '13px' }} />
        <input type="text" className="form-control form-control-sm"
          placeholder="Enter type…" value={type}
          onChange={(e) => setType(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose(); }}
          maxLength={20} style={{ fontSize: '13px' }} />
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-sm" onClick={handleSave} disabled={saving}
            style={{ background: primaryColor, color: '#fff', border: 'none', borderRadius: '5px', padding: '4px 10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {saving ? <span className="spinner-border spinner-border-sm" /> : <><FaCheck /> Save</>}
          </button>
          <button type="button" className="btn btn-sm btn-light" onClick={onClose}
            style={{ borderRadius: '5px', padding: '4px 8px', fontSize: '13px' }}>
            <FaTimes />
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionButtons({ isSubmitDisabled, loadingSubmit, isUpdateDisabled, loadingUpdate,
  isDeleteDisabled, loadingDelete, onUpdate, onDelete, onClear, canAdd, canEdit, canDelete }) {
  return (
    <div className="d-flex justify-content-center flex-wrap gap-3 mt-3 pb-2">
      {canAdd && (
        <button type="submit" className="btn px-4 d-flex align-items-center gap-2"
          style={btnStyle} disabled={isSubmitDisabled || loadingSubmit}>
          {loadingSubmit ? <><span className="spinner-border spinner-border-sm" /> Creating...</> : <><FaSave /> Submit</>}
        </button>
      )}
      {canEdit && (
        <button type="button" className="btn px-4 d-flex align-items-center gap-2"
          style={btnStyle} disabled={isUpdateDisabled || loadingUpdate} onClick={onUpdate}>
          {loadingUpdate ? <><span className="spinner-border spinner-border-sm" /> Updating...</> : <><FaEdit /> Update</>}
        </button>
      )}
      {canDelete && (
        <button type="button" className="btn px-4 d-flex align-items-center gap-2"
          style={btnStyle} disabled={isDeleteDisabled || loadingDelete} onClick={onDelete}>
          {loadingDelete ? <><span className="spinner-border spinner-border-sm" /> Deleting...</> : <><FaTrashAlt /> Delete</>}
        </button>
      )}
      <button type="button" className="btn px-4 d-flex align-items-center gap-2"
        style={btnStyle} onClick={onClear}>
        <FaEraser /> Clear
      </button>
    </div>
  );
}

const AccountMaster = () => {

  // ── Permissions ──
  const { getPermission, refreshPermissions } = usePermission();
  const permission = getPermission('AC_GROUP');
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

  const [isHead,           setIsHead]           = useState(false);
  const [searchTerm,       setSearchTerm]       = useState('');
  const [fieldErrors,      setFieldErrors]      = useState({});
  const [quickAddIndex,    setQuickAddIndex]    = useState(-1);

  const [groupData,        setGroupData]        = useState([]);
  const [treeData,         setTreeData]         = useState([]);
  const [selectedTreeId,   setSelectedTreeId]   = useState(null);
  const [selectedHeadHSlNo, setSelectedHeadHSlNo] = useState(null);
  const [parentPath,       setParentPath]       = useState([]);

  const [selectedGroup,    setSelectedGroup]    = useState({ id: null, name: '' });
  const [headData,         setHeadData]         = useState([]);
  const [allHeadData,      setAllHeadData]      = useState([]);

  const [group, setGroup] = useState({
    GSlNo: 0, HSlNo: 0, GName: '', GUnder: 0, Type: '',
  });

  // ── Refs: written SYNCHRONOUSLY alongside every setState so handlers always
  //    read the value that was just set, never a stale closure. ────────────────
  const groupRef             = useRef(group);
  const selectedGroupRef     = useRef(selectedGroup);
  const isHeadRef            = useRef(isHead);          // FIX: kept in sync synchronously
  const selectedHeadHSlNoRef = useRef(selectedHeadHSlNo);

  // Helper: set group state AND ref together atomically
  const setGroupSync = (val) => {
    const next = typeof val === 'function' ? val(groupRef.current) : val;
    groupRef.current = next;
    setGroup(next);
  };

  // Helper: set selectedGroup state AND ref together atomically
  const setSelectedGroupSync = (val) => {
    const next = typeof val === 'function' ? val(selectedGroupRef.current) : val;
    selectedGroupRef.current = next;
    setSelectedGroup(next);
  };

  // Helper: set selectedHeadHSlNo state AND ref together atomically
  const setSelectedHeadHSlNoSync = (val) => {
    selectedHeadHSlNoRef.current = val;
    setSelectedHeadHSlNo(val);
  };

  // ── FIX: setIsHeadSync — updates the isHead ref SYNCHRONOUSLY (not via useEffect)
  //    AND resets all form/selection state so switching modes never leaves stale
  //    HSlNo/GSlNo values behind with Update/Delete buttons still enabled.
  // ─────────────────────────────────────────────────────────────────────────────
  const setIsHeadSync = (newIsHead) => {
    isHeadRef.current = newIsHead;
    setIsHead(newIsHead);
    // Reset everything when mode changes — this is what prevents the stale-state bugs
    setGroupSync({ GSlNo: 0, HSlNo: 0, GName: '', GUnder: 0, Type: '' });
    setSelectedGroupSync({ id: null, name: '' });
    setSelectedHeadHSlNoSync(null);
    setSelectedTreeId(null);
    setParentPath([]);
    setHeadData([]);
    setIsSubmitDisabled(false);
    setIsUpdateDisabled(true);
    setIsDeleteDisabled(true);
    setFieldErrors({});
    setQuickAddIndex(-1);
  };
  // ─────────────────────────────────────────────────────────────────────────────

  // NOTE: The old `useEffect(() => { isHeadRef.current = isHead; }, [isHead])` is
  // intentionally REMOVED. isHeadRef is now kept in sync by setIsHeadSync above.

  useEffect(() => {
    if (!canView) {
      setGroupData([]);
      setTreeData([]);
      return;
    }
    fetchData();
  }, [canView]);

  const fetchData = async () => {
    if (!canView) return; // ── Permission guard ──
    try {
      setLoading(true);
      const CompanyId = sessionStorage.getItem('CompanyID');

      const groupRes = await api.get('/api/getaccountmaster', { params: { CompanyId } });
      const flat     = groupRes.data?.data || [];
      setGroupData(flat);

      let heads = [];
      try {
        const headRes = await api.get('/api/getaccountheaddata', { params: { CompanyId } });
        heads = headRes.data?.data || [];
      } catch (e) {
        console.warn('Could not fetch heads for tree:', e.message);
      }
      setAllHeadData(heads);
      setTreeData(buildCombinedTree(flat, heads));
    } catch {
      toast.error('Failed to fetch account data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    if (!canView) return; // ── Permission guard ──
    const CompanyId = sessionStorage.getItem('CompanyID');

    const groupRes = await api.get('/api/getaccountmaster', { params: { CompanyId } });
    const flat     = groupRes.data?.data || [];
    setGroupData(flat);

    let heads = [];
    try {
      const headRes = await api.get('/api/getaccountheaddata', { params: { CompanyId } });
      heads = headRes.data?.data || [];
    } catch (e) {
      console.warn('Could not refresh heads:', e.message);
    }
    setAllHeadData(heads);
    setTreeData(buildCombinedTree(flat, heads));
  };

  const fetchHeadData = async (groupId) => {
    if (!groupId) { setHeadData([]); return; }
    try {
      const res = await api.get('/api/getAccountHeadnew', { params: { groupid: groupId } });
      if (res.data.success) setHeadData(res.data.data || []);
      else { toast.error(res.data.message || 'Failed to fetch heads'); setHeadData([]); }
    } catch {
      toast.error('Failed to fetch head data');
      setHeadData([]);
    }
  };

  const getChildren = (parentId) =>
    groupData.filter((c) => Number(c.GUnder ?? 0) === Number(parentId));

  const rootGroups = groupData.filter((c) => !c.GUnder || Number(c.GUnder) === 0);

  const buildAncestorPath = (node) => {
    const path = [];
    let current = node.GUnder ? groupData.find((c) => c.GSlNo === Number(node.GUnder)) : null;
    while (current) {
      path.unshift(current.GSlNo);
      current = current.GUnder ? groupData.find((c) => c.GSlNo === Number(current.GUnder)) : null;
    }
    return path;
  };

  // ── selectHead — single function used by BOTH tree click and table row click
  const selectHead = (hSlNo, hName, gUnder, type, parentGroupId, parentGroupName) => {
    const newGroup = {
      GSlNo:  0,
      HSlNo:  Number(hSlNo) || 0,
      GName:  hName || '',
      GUnder: Number(gUnder) || 0,
      Type:   type || '',
    };
    setGroupSync(newGroup);
    setSelectedGroupSync({ id: parentGroupId, name: parentGroupName });
    setSelectedHeadHSlNoSync(Number(hSlNo) || null);
    setSelectedTreeId(-(Number(hSlNo)));
    setIsSubmitDisabled(true);
    setIsUpdateDisabled(false);
    setIsDeleteDisabled(false);
    setFieldErrors({});
  };

  const handleTreeSelect = (node) => {
    if (isHeadRef.current) {
      // ── HEAD MODE ──────────────────────────────────────────────────────────
      if (node._isHead) {
        const parentGUnder = Number(node.GUnder) || 0;
        const parentGroup  = groupData.find((c) => Number(c.GSlNo) === parentGUnder);
        selectHead(
          node._HSlNo,
          node._HName || '',
          parentGUnder,
          node.Type || '',
          parentGUnder,
          parentGroup?.GName || ''
        );
      } else {
        // Clicked a GROUP node while in Head mode — set group context only, no edit
        setSelectedGroupSync({ id: node.GSlNo, name: node.GName });
        fetchHeadData(node.GSlNo);
        setGroupSync({ GSlNo: 0, HSlNo: 0, GName: '', GUnder: node.GSlNo, Type: '' });
        setSelectedHeadHSlNoSync(null);
        setSelectedTreeId(node.GSlNo);
        setIsSubmitDisabled(false);
        setIsUpdateDisabled(true);
        setIsDeleteDisabled(true);
        setFieldErrors({});
      }
    } else {
      // ── GROUP MODE ─────────────────────────────────────────────────────────
      // FIX: In Group mode, clicking a head node does nothing.
      // This prevents accidentally filling the group form with head data,
      // which was causing bogus submissions and confusing button states.
      if (node._isHead) return;

      setSelectedHeadHSlNoSync(null);
      const path = buildAncestorPath(node);
      setParentPath(path);
      setGroupSync({
        GSlNo:  node.GSlNo,
        HSlNo:  0,
        GName:  node.GName  || '',
        GUnder: node.GUnder ? Number(node.GUnder) : 0,
        Type:   node.Type   || '',
      });
      setSelectedTreeId(node.GSlNo);
      setIsSubmitDisabled(true);
      setIsUpdateDisabled(false);
      setIsDeleteDisabled(false);
      setFieldErrors({});
      setQuickAddIndex(-1);
    }
  };

  const handleDropdownChange = (depth, value) => {
    const val     = value ? parseInt(value) : null;
    const newPath = [...parentPath.slice(0, depth), ...(val ? [val] : [])];
    setParentPath(newPath);
    const parentId = newPath.length > 0 ? newPath[newPath.length - 1] : 0;
    setGroupSync((prev) => ({ ...prev, GUnder: parentId || 0 }));
    setQuickAddIndex(-1);
  };

  const handleQuickAddSaved = async () => {
    setQuickAddIndex(-1);
    try {
      setLoading(true);
      await refreshData();
    } catch {
      toast.error('Failed to refresh group data');
    } finally {
      setLoading(false);
    }
  };

  const validateFields = () => {
    const currentGroup         = groupRef.current;
    const currentSelectedGroup = selectedGroupRef.current;
    const currentIsHead        = isHeadRef.current;

    const errors = {};
    if (currentIsHead) {
      if (!currentSelectedGroup.id)         errors.AccountGroup = 'Please select an Account Group from the tree';
      if (!currentGroup.GName?.trim())      errors.GName        = 'Head name is required';
      if (!currentGroup.Type?.trim())       errors.Type         = 'Type is required';
    } else {
      if (!currentGroup.GName?.trim())      errors.GName = 'Group Name is required';
      if (!currentGroup.Type?.trim())       errors.Type  = 'Type is required';
    }
    return errors;
  };

  const checkDuplicate = (name, currentId = null) =>
    groupData.some((c) => {
      const isSame = c.GName?.trim().toLowerCase() === name.trim().toLowerCase();
      return currentId ? isSame && c.GSlNo !== currentId : isSame;
    });

  const buildGroupPayload = (overrides = {}) => {
    const g = groupRef.current;
    return {
      GName:  g.GName?.trim() || '',
      GUnder: g.GUnder ?? 0,
      UDate:  new Date().toISOString(),
      Type:   g.Type?.trim()  || '',
      Userid: parseInt(sessionStorage.getItem('UserId'), 10) || 0,
      ...overrides
    };
  };

  const buildHeadPayload = (overrides = {}) => {
    const g  = groupRef.current;
    const sg = selectedGroupRef.current;
    return {
      HName:  g.GName?.trim()       || '',
      GUnder: sg.id ?? g.GUnder ?? 0,
      UDate:  new Date().toISOString(),
      Type:   g.Type?.trim()        || '',
      Userid: parseInt(sessionStorage.getItem('UserId'), 10) || 0,
      ...overrides
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canAdd) { toast.error('You do not have permission to add.'); return; } // ── Permission guard ──
    const errors = validateFields();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const currentGroup         = groupRef.current;
    const currentSelectedGroup = selectedGroupRef.current;
    const currentIsHead        = isHeadRef.current;

    try {
      setLoadingSubmit(true);

      if (currentIsHead) {
        const res = await api.post('/api/insertUpdateAccountHead', buildHeadPayload({ HSlNo: 0 }));
        if (res.data.success) {
          toast.success('Head created successfully');
          await refreshData();
          await fetchHeadData(currentSelectedGroup.id);
          setGroupSync({ GSlNo: 0, HSlNo: 0, GName: '', GUnder: currentSelectedGroup.id, Type: '' });
          setSelectedHeadHSlNoSync(null);
          setIsSubmitDisabled(false);
          setIsUpdateDisabled(true);
          setIsDeleteDisabled(true);
          setFieldErrors({});
        } else { toast.error(res.data.message || 'Operation failed'); }

      } else {
        if (checkDuplicate(currentGroup.GName)) { toast.error('Name already exists'); return; }
        const res = await api.post('/api/insertupdateacgroupmaster', buildGroupPayload({ GSlNo: 0 }));
        if (res.data.success) {
          toast.success('Group created successfully');
          await refreshData();
          resetFormFields();
          setFieldErrors({});
        } else { toast.error(res.data.message || 'Operation failed'); }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally { setLoadingSubmit(false); }
  };

  const handleHeadselect=(head)=>{
    setGroupSync((prev)=>({
      ...prev,
      HSlNo:head.HSlNo,
      GName: head.HeadName
    }))
    selectedHeadHSlNoRef.current = head.HSlNo
  }

  const handleUpdate = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!canEdit) { toast.error('You do not have permission to edit.'); return; } // ── Permission guard ──
    const errors = validateFields();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const currentGroup         = groupRef.current;
    const currentSelectedGroup = selectedGroupRef.current;
    const currentIsHead        = isHeadRef.current;

    try {
      setLoadingUpdate(true);

      if (currentIsHead) {
        const hSlNo = currentGroup.HSlNo || selectedHeadHSlNoRef.current || 0;
        if (!hSlNo || hSlNo === 0) {
          toast.error('No head selected for update. Please select a head from the list.');
          return;
        }
        const res = await api.post('/api/insertUpdateAccountHead', buildHeadPayload({ HSlNo: hSlNo }));
        if (res.data.success) {
          toast.success('Head updated successfully');
          await refreshData();
          await fetchHeadData(currentSelectedGroup.id);
          setGroupSync({ GSlNo: 0, HSlNo: 0, GName: '', GUnder: currentSelectedGroup.id, Type: '' });
          setSelectedHeadHSlNoSync(null);
          setIsSubmitDisabled(false);
          setIsUpdateDisabled(true);
          setIsDeleteDisabled(true);
          setFieldErrors({});
        } else { toast.error(res.data.message || 'Update failed'); }

      } else {
        if (checkDuplicate(currentGroup.GName, currentGroup.GSlNo)) { toast.error('Name already exists'); return; }
        const res = await api.post('/api/insertupdateacgroupmaster', buildGroupPayload({ GSlNo: currentGroup.GSlNo }));
        if (res.data.success) {
          toast.success('Group updated successfully');
          await refreshData();
          setGroupSync({ GSlNo: 0, HSlNo: 0, GName: '', GUnder: 0, Type: '' });
          setParentPath([]);
          setSelectedTreeId(null);
          setSelectedHeadHSlNoSync(null);
          setIsSubmitDisabled(false);
          setIsUpdateDisabled(true);
          setIsDeleteDisabled(true);
          setFieldErrors({});
          setQuickAddIndex(-1);
        } else { toast.error(res.data.message || 'Update failed'); }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update request failed');
    } finally { setLoadingUpdate(false); }
  };

  const handleDelete = async () => {
    if (!canDelete) { toast.error('You do not have permission to delete.'); return; } // ── Permission guard ──
    const currentGroup         = groupRef.current;
    const currentSelectedGroup = selectedGroupRef.current;
    const currentIsHead        = isHeadRef.current;

    const hSlNo = currentIsHead
      ? (currentGroup.HSlNo || selectedHeadHSlNoRef.current || 0)
      : 0;

    if (currentIsHead && (!hSlNo || hSlNo === 0)) {
      toast.error('No head selected. Please select a head from the list.'); return;
    }
    if (!currentIsHead && (!currentGroup.GSlNo || currentGroup.GSlNo === 0)) {
      toast.error('No group selected'); return;
    }

    if (!currentIsHead) {
      const hasChildren = groupData.some((c) => Number(c.GUnder ?? 0) === currentGroup.GSlNo);
      if (hasChildren) { toast.error('Cannot delete — this group has sub-items. Remove children first.'); return; }
    }

    const confirmed = await confirmDeleteToast();
    if (!confirmed) return;

    try {
      setLoadingDelete(true);

      if (currentIsHead) {
        const res = await api.delete('/api/deleteAccountHead', {
          data: {
            HSlNo:  hSlNo,
            HName:  currentGroup.GName?.trim() || '',
            Userid: parseInt(sessionStorage.getItem('UserId'), 10) || 0
          }
        });
        if (res.data.success) {
          toast.success('Head deleted successfully');
          await refreshData();
          await fetchHeadData(currentSelectedGroup.id);
          setGroupSync({ GSlNo: 0, HSlNo: 0, GName: '', GUnder: currentSelectedGroup.id, Type: '' });
          setSelectedHeadHSlNoSync(null);
          setIsSubmitDisabled(false);
          setIsUpdateDisabled(true);
          setIsDeleteDisabled(true);
          setFieldErrors({});
        } else { toast.error(res.data.message || 'Delete failed'); }

      } else {
        const res = await api.delete('/api/deleteitemAccount', {
          data: { GSlNo: currentGroup.GSlNo, GName: currentGroup.GName?.trim() || '' }
        });
        if (res.data.success) {
          toast.success('Deleted successfully');
          await refreshData();
          resetFormFields();
          setSelectedTreeId(null);
          setFieldErrors({});
        } else { toast.error(res.data.message || 'Delete failed'); }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete error');
    } finally { setLoadingDelete(false); }
  };

  const confirmDeleteToast = () =>
    new Promise((resolve) => {
      const toastId = toast.warning(
        () => (
          <div>
            <div className="mb-2">Are you sure you want to delete this record?</div>
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

  const resetFormFields = () => {
    setGroupSync({ GSlNo: 0, HSlNo: 0, GName: '', GUnder: 0, Type: '' });
    setSelectedHeadHSlNoSync(null);
    setIsSubmitDisabled(false);
    setIsUpdateDisabled(true);
    setIsDeleteDisabled(true);
    setFieldErrors({});
    setQuickAddIndex(-1);
  };

  const handleClear = () => {
    toast.dismiss();
    setGroupSync((prev) => ({ ...prev, GName: '', Type: '' }));
    setFieldErrors({});
    setQuickAddIndex(-1);
  };

  const handleCreateNew = () => {
    toast.dismiss();
    setGroupSync({ GSlNo: 0, HSlNo: 0, GName: '', GUnder: 0, Type: '' });
    setSelectedGroupSync({ id: null, name: '' });
    setHeadData([]);
    setSelectedTreeId(null);
    setSelectedHeadHSlNoSync(null);
    setParentPath([]);
    setIsSubmitDisabled(false);
    setIsUpdateDisabled(true);
    setIsDeleteDisabled(true);
    setFieldErrors({});
    setQuickAddIndex(-1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setGroupSync((prev) => ({ ...prev, [name]: value }));
  };

  const filterTree = (nodes, term) => {
    if (!term.trim()) return nodes;
    return nodes.reduce((acc, node) => {
      const filteredChildren = filterTree(node.children || [], term);
      const matches = node.GName?.toLowerCase().includes(term.toLowerCase());
      if (matches || filteredChildren.length > 0) acc.push({ ...node, children: filteredChildren });
      return acc;
    }, []);
  };

  const filteredTree = filterTree(treeData, searchTerm);

  const dropdownLevels = (() => {
    const levels = [{ label: 'Group', items: rootGroups, depth: 0, parentId: 0 }];
    for (let idx = 0; idx < parentPath.length; idx++) {
      const pid      = parentPath[idx];
      const children = getChildren(pid);
      levels.push({ label: getLevelLabel(idx + 1), items: children, depth: idx + 1, parentId: pid });
      if (!parentPath[idx + 1] || children.length === 0) break;
    }
    return levels;
  })();

  const isEditing = isHead ? group.HSlNo > 0 : group.GSlNo > 0;

  // ── ACCESS-DENIED VIEW ──
  if (!canView) {
    return (
      <div className="page-wrapper" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        <div className="page-body mt-1">
          <div className="container-fluid px-4">
            <ToastContainer position="top-center" autoClose={3000} />
            <div className="alert alert-danger mt-3">
              You do not have permission to view Account Group Master.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="page-body mt-1">
        <div className="container-fluid px-4">
          <ToastContainer position="top-center" autoClose={3000} />

          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="card-body p-4">
              <h2 className="mb-3" style={{ fontWeight: '600', color: '#2d3748', fontSize: '28px' }}>
                <FaLayerGroup className="me-2" style={{ color: primaryColor }} />
                Account Group Master
              </h2>
              <div className="d-flex gap-3 mb-3 flex-wrap">
                {['Group', 'Main Group', 'Sub Group', 'Deep Level'].map((label, i) => (
                  <span key={i} style={{
                    fontSize: '11px', padding: '2px 10px', borderRadius: '10px',
                    background: getLevelColor(i).bg, color: getLevelColor(i).text,
                    border: `1px solid ${getLevelColor(i).border}`
                  }}>{label}</span>
                ))}
              </div>
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div style={{ maxWidth: '700px', flex: 1 }}>
                  <div className="input-group" style={{ height: '45px' }}>
                    <span className="input-group-text text-white" style={{ backgroundColor: primaryColor }}>
                      <FaSearch />
                    </span>
                    <input type="text" className="form-control border-start-0"
                      placeholder="Search groups..." value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ backgroundColor: '#fff', borderColor: '#e2e8f0', height: '45px', fontSize: '14px' }} />
                  </div>
                </div>
                {canAdd && (
                  <button type="button" className="btn d-flex align-items-center gap-2"
                    onClick={handleCreateNew}
                    style={{ borderRadius: '5px', padding: '8px 20px', background: primaryColor, border: 'none', color: 'white', height: '45px', whiteSpace: 'nowrap' }}>
                    <FaPlus /> Create New
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="row g-3">

            <div className="col-lg-6">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <div className="card-body p-0">
                  {loading ? (
                    <div className="text-center p-5">
                      <div className="spinner-border" role="status" style={{ color: primaryColor }} />
                      <p className="mt-3 text-muted">Loading groups...</p>
                    </div>
                  ) : (
                    <div style={{ maxHeight: '600px', overflowY: 'auto', padding: '12px 16px' }}>
                      <div style={{
                        padding: '6px 0 10px', borderBottom: '1px solid #e2e8f0',
                        fontWeight: '600', fontSize: '13px', color: '#4a5568', marginBottom: '10px'
                      }}>
                        Group Structure
                      </div>
                      {filteredTree.length > 0 ? (
                        filteredTree.map((node) => (
                          <TreeNode
                            key={node._isHead ? `h-${node._HSlNo}` : `g-${node.GSlNo}`}
                            node={node}
                            selectedId={selectedTreeId}
                            selectedHeadHSlNo={selectedHeadHSlNo}
                            onSelect={handleTreeSelect}
                            level={0}
                          />
                        ))
                      ) : (
                        <div className="text-center p-5">
                          <FaLayerGroup className="mb-3" style={{ fontSize: '48px', color: '#cbd5e0' }} />
                          <p className="text-muted mb-3">No groups found</p>
                          {canAdd && (
                            <button className="btn" onClick={handleCreateNew}
                              style={{ borderRadius: '5px', padding: '10px 24px', background: primaryColor, border: 'none', color: 'white', fontSize: '14px' }}>
                              <FaPlus className="me-2" />Create New Group
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', overflow: 'hidden' }}>

                <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-0"
                  style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <h4 className="m-0" style={{ color: '#2d3748', fontWeight: '600', fontSize: '18px' }}>
                    <FaLayerGroup className="me-2" style={{ color: primaryColor }} />
                    {isHead
                      ? (isEditing ? 'Edit Account Head'  : 'New Account Head')
                      : (isEditing ? 'Edit Account Group' : 'New Account Group')
                    }
                  </h4>
                  {/* FIX: Use setIsHeadSync so the ref is updated synchronously
                      and the form resets cleanly — prevents stale-state update/delete bugs */}
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-medium" style={{ color: !isHead ? primaryColor : '#a0aec0', cursor: 'pointer' }}
                      onClick={() => setIsHeadSync(false)}>Group</span>
                    <Form.Check type="switch" id="custom-switch" checked={isHead}
                      onChange={(e) => setIsHeadSync(e.target.checked)} />
                    <span className="fw-medium" style={{ color: isHead ? primaryColor : '#a0aec0', cursor: 'pointer' }}
                      onClick={() => setIsHeadSync(true)}>Head</span>
                  </div>
                </div>

                <div className="card-body" style={{ maxHeight: '650px', overflowY: 'auto', padding: '16px' }}>
                  <form onSubmit={handleSubmit}>

                    {!isHead && (
                      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: '10px' }}>
                        <div className="card-header bg-white"
                          style={{ borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: primaryColor }}>
                          <FaLayerGroup className="me-2" />Group Details
                        </div>
                        <div className="card-body p-4">
                          <div className="row">

                            <div className="col-md-8 mb-3">
                              <label className="form-label fw-medium mb-2">
                                Group Name <span className="text-danger">*</span>
                              </label>
                              <input
                                className={`form-control ${fieldErrors.GName ? 'is-invalid' : ''}`}
                                name="GName" value={group.GName || ''} onChange={handleInputChange}
                                placeholder="Enter group name" maxLength={200} autoFocus />
                              {fieldErrors.GName && <div className="invalid-feedback">{fieldErrors.GName}</div>}
                            </div>

                            <div className="col-md-4 mb-3">
                              <label className="form-label fw-medium mb-2">
                                Type <span className="text-danger">*</span>
                              </label>
                              <input
                                className={`form-control ${fieldErrors.Type ? 'is-invalid' : ''}`}
                                name="Type" value={group.Type || ''} onChange={handleInputChange}
                                placeholder="Enter type" maxLength={20} />
                              {fieldErrors.Type && <div className="invalid-feedback">{fieldErrors.Type}</div>}
                            </div>

                            {dropdownLevels.map((lvl, idx) => (
                              <div className="col-md-12 mb-3" key={idx}>
                                <label className="form-label fw-medium mb-2 d-flex align-items-center justify-content-between">
                                  <span>
                                    <span style={{
                                      display: 'inline-block', width: '10px', height: '10px',
                                      borderRadius: '50%', background: getLevelColor(idx).text, marginRight: '6px'
                                    }} />
                                    {parentPath[idx - 1]
                                      ? dropdownLevels[idx - 1]?.items.find((c) => c.GSlNo === parentPath[idx - 1])?.GName
                                      : lvl.label}
                                  </span>
                                  {canAdd && (
                                    <button type="button"
                                      onClick={() => setQuickAddIndex(quickAddIndex === idx ? -1 : idx)}
                                      style={{
                                        width: '22px', height: '22px', borderRadius: '50%',
                                        border: `1.5px solid ${getLevelColor(idx).text}`,
                                        background: quickAddIndex === idx ? getLevelColor(idx).text : getLevelColor(idx).bg,
                                        color: quickAddIndex === idx ? '#fff' : getLevelColor(idx).text,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', padding: 0, fontSize: '11px',
                                        transition: 'all 0.15s', flexShrink: 0
                                      }}>
                                      {quickAddIndex === idx ? <FaTimes /> : <FaPlus />}
                                    </button>
                                  )}
                                </label>
                                <div style={{ position: 'relative' }}>
                                  <select className="form-select" value={parentPath[idx] || ''}
                                    onChange={(e) => handleDropdownChange(idx, e.target.value)}
                                    disabled={idx > 0 && !parentPath[idx - 1]}>
                                    <option value="">{idx === 0 ? '— Root (no parent) —' : `— Select ${lvl.label} —`}</option>
                                    {lvl.items.map((c) => (
                                      <option key={c.GSlNo} value={c.GSlNo}>{c.GName}</option>
                                    ))}
                                  </select>
                                  {canAdd && quickAddIndex === idx && (
                                    <QuickAddPopover levelLabel={lvl.label} parentId={lvl.parentId}
                                      groupData={groupData} onSaved={() => handleQuickAddSaved(idx)}
                                      onClose={() => setQuickAddIndex(-1)} />
                                  )}
                                </div>
                              </div>
                            ))}

                            <div className="col-12 mb-2">
                              <div style={{
                                padding: '8px 14px', borderRadius: '8px',
                                background: 'rgba(45,75,169,0.06)', border: '1px solid rgba(45,75,169,0.2)',
                                fontSize: '13px', color: '#4a5568'
                              }}>
                                <strong style={{ color: primaryColor }}>
                                  {isEditing ? 'Will be updated under: ' : 'Will be created under: '}
                                </strong>
                                {!group.GUnder || group.GUnder === 0
                                  ? 'Root level (no parent)'
                                  : (() => { const p = groupData.find((c) => c.GSlNo === group.GUnder); return p ? p.GName : 'Root level'; })()
                                }
                              </div>
                            </div>

                            {isEditing && (
                              <div className="col-12 mb-2">
                                <div style={{
                                  padding: '8px 14px', borderRadius: '8px',
                                  background: 'rgba(221,107,32,0.06)', border: '1px solid rgba(221,107,32,0.3)',
                                  fontSize: '12px', color: 'rgb(180,83,9)'
                                }}>
                                  ℹ️ <strong>Note:</strong> Updating will change the <strong>Group Name</strong>.
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                      </div>
                    )}

                    {isHead && (
                      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: '10px' }}>
                        <div className="card-header bg-white"
                          style={{ borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: primaryColor }}>
                          <FaLayerGroup className="me-2" />Head Details
                        </div>
                        <div className="card-body p-4">
                          <div className="row align-items-start">

                            <div className="col-md-4 mb-3">
                              <label className="form-label fw-medium mb-2">
                                Account Group <span className="text-danger">*</span>
                              </label>
                              <input type="text" className="form-control"
                                value={selectedGroup.name || ''}
                                readOnly
                                placeholder="Select a group from the tree"
                                style={{
                                  ...inputStyle,
                                  background: selectedGroup.name ? 'rgba(45,75,169,0.04)' : '#f8f9fa',
                                  color: selectedGroup.name ? 'rgb(45,75,169)' : '#a0aec0',
                                  fontWeight: selectedGroup.name ? '500' : '400',
                                  cursor: 'default',
                                  border: selectedGroup.name ? '1px solid rgba(45,75,169,0.4)' : '1px solid #ced4da'
                                }}
                              />
                              {fieldErrors.AccountGroup && (
                                <div style={{ fontSize: '12px', color: '#dc3545', marginTop: '4px' }}>
                                  {fieldErrors.AccountGroup}
                                </div>
                              )}
                              {!selectedGroup.name && (
                                <div style={{ fontSize: '11px', color: '#a0aec0', marginTop: '4px' }}>
                                  ← Click any group in the tree
                                </div>
                              )}
                            </div>

                            <div className="col-md-4 mb-3">
                              <label className="form-label fw-medium mb-2">
                                Head <span className="text-danger">*</span>
                              </label>
                              <input
                                className={`form-control ${fieldErrors.GName ? 'is-invalid' : ''}`}
                                name="GName" value={group.GName || ''} onChange={handleInputChange}
                                placeholder="Enter head name" maxLength={200} style={inputStyle} />
                              {fieldErrors.GName && <div className="invalid-feedback">{fieldErrors.GName}</div>}
                            </div>

                            <div className="col-md-4 mb-3">
                              <label className="form-label fw-medium mb-2">
                                Type <span className="text-danger">*</span>
                              </label>
                              <input
                                className={`form-control ${fieldErrors.Type ? 'is-invalid' : ''}`}
                                name="Type" value={group.Type || ''}
                                onChange={handleInputChange} placeholder="Enter type" maxLength={20} style={inputStyle} />
                              {fieldErrors.Type && <div className="invalid-feedback">{fieldErrors.Type}</div>}
                            </div>

                          </div>
                        </div>
                      </div>
                    )}

                    <ActionButtons
                      isSubmitDisabled={isSubmitDisabled} loadingSubmit={loadingSubmit}
                      isUpdateDisabled={isUpdateDisabled} loadingUpdate={loadingUpdate}
                      isDeleteDisabled={isDeleteDisabled} loadingDelete={loadingDelete}
                      onUpdate={handleUpdate} onDelete={handleDelete} onClear={handleClear}
                      canAdd={canAdd} canEdit={canEdit} canDelete={canDelete}
                    />
                  </form>

                  {isHead && selectedGroup.id && (
                    <div className="card border-0 shadow-sm mt-3" style={{ borderRadius: '10px' }}>
                      <div className="card-header bg-white"
                        style={{ borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: primaryColor, fontSize: '14px' }}>
                        Heads under <span className="ms-1" style={{ fontStyle: 'italic' }}>{selectedGroup.name}</span>
                      </div>
                      <div className="card-body p-0">
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          <table className="table table-bordered table-hover mb-0">
                            <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
                              <tr>
                                <th style={{ fontSize: '13px' }}>#</th>
                                <th style={{ fontSize: '13px' }}>Head Name</th>
                                <th style={{ fontSize: '13px' }}>Type</th>
                              </tr>
                            </thead>
                            <tbody>
                              {headData.length > 0 ? (
                                headData.map((item, index) => (
                                  <tr
                                    key={item.HSlNo ?? index}
                                    style={{
                                      cursor: 'pointer',
                                      background: selectedHeadHSlNo === Number(item.HSlNo)
                                        ? 'rgba(45,75,169,0.08)'
                                        : 'transparent'
                                    }}
                                    onClick={() => {
                                      selectHead(
                                        item.HSlNo,
                                        item.HName || '',
                                        Number(item.GUnder) || 0,
                                        item.Type || '',
                                        selectedGroupRef.current.id,
                                        selectedGroupRef.current.name
                                      );
                                    }}
                                  >
                                    <td style={{ fontSize: '13px' }}>{index + 1}</td>
                                    <td style={{ fontSize: '13px' }}>{item.HName}</td>
                                    <td style={{ fontSize: '13px' }}>{item.Type}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="3" className="text-center py-4 text-muted" style={{ fontSize: '13px' }}>
                                    No heads found under this group
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountMaster;
