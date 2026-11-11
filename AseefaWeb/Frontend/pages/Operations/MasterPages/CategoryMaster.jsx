import React, { useState, useEffect, useRef } from 'react';
import api from '../../apiService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FaSearch, FaPlus, FaSave, FaEdit, FaTrashAlt,
  FaEraser, FaArrowLeft, FaChevronRight, FaChevronDown,
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

const levelColors = [
  { bg: 'rgba(45,75,169,0.08)',   border: 'rgba(45,75,169,0.3)',   text: 'rgb(45,75,169)'  },
  { bg: 'rgba(56,161,105,0.08)',  border: 'rgba(56,161,105,0.3)',  text: 'rgb(38,128,80)'  },
  { bg: 'rgba(221,107,32,0.08)',  border: 'rgba(221,107,32,0.3)',  text: 'rgb(180,83,9)'   },
  { bg: 'rgba(159,122,234,0.08)', border: 'rgba(159,122,234,0.3)', text: 'rgb(107,70,193)' },
];

const getLevelColor  = (level) => levelColors[level % levelColors.length];
const getLevelLabel  = (level) => {
  if (level === 0) return 'Category';
  if (level === 1) return 'Main Category';
  if (level === 2) return 'Sub Category';
  return `Level ${level}`;
};

// ── Build recursive tree ──────────────────────────────────────
const buildTree = (flat, parentId = 0) =>
  flat
    .filter((item) => Number(item.CategoryParent ?? 0) === parentId)
    .map((item) => ({ ...item, children: buildTree(flat, item.CategoryID) }));

// ── Tree Node ─────────────────────────────────────────────────
function TreeNode({ node, selectedId, onSelect, level = 0 }) {
  const [open, setOpen]   = useState(true);
  const hasChildren       = node.children && node.children.length > 0;
  const isSelected        = selectedId === node.CategoryID;
  const col               = getLevelColor(level);

  return (
    <div style={{ marginBottom: '3px' }}>
      <div
        onClick={() => { onSelect(node, level); if (hasChildren) setOpen((o) => !o); }}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          paddingLeft: `${level * 20 + 8}px`,
          paddingTop: '7px', paddingBottom: '7px', paddingRight: '10px',
          borderRadius: '7px',
          background: isSelected ? col.bg : 'transparent',
          border: isSelected ? `1px solid ${col.border}` : '1px solid transparent',
          cursor: 'pointer', transition: 'all 0.15s', userSelect: 'none'
        }}
      >
        <span style={{ width: '14px', flexShrink: 0, color: col.text, fontSize: '10px' }}>
          {hasChildren ? (open ? <FaChevronDown /> : <FaChevronRight />) : null}
        </span>
        <span style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: col.text, flexShrink: 0, opacity: 0.7
        }} />
        <span style={{
          flex: 1, fontSize: '13px',
          fontWeight: level === 0 ? '600' : level === 1 ? '500' : '400',
          color: isSelected ? col.text : '#2d3748'
        }}>
          {node.CatgoryName}
        </span>
        <span style={{
          fontSize: '10px', padding: '1px 7px', borderRadius: '10px',
          background: col.bg, color: col.text,
          border: `1px solid ${col.border}`, flexShrink: 0
        }}>
          {getLevelLabel(level)}
        </span>
        {hasChildren && (
          <span style={{ fontSize: '11px', color: '#a0aec0', flexShrink: 0 }}>
            {node.children.length}
          </span>
        )}
      </div>
      {hasChildren && open && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.CategoryID}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Inline Quick-Add Popover ──────────────────────────────────
// Shows an input + Save/Cancel beneath the dropdown when "+" is clicked
function QuickAddPopover({ levelLabel, parentId, categoryData, onSaved, onClose }) {
  const [name, setName]       = useState('');
  const [saving, setSaving]   = useState(false);
  const inputRef              = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) { toast.error('Please enter a category name'); return; }

    // duplicate check within the same parent
    const duplicate = categoryData.some(
      (c) =>
        c.CatgoryName?.trim().toLowerCase() === trimmed.toLowerCase() &&
        Number(c.CategoryParent ?? 0) === Number(parentId ?? 0)
    );
    if (duplicate) { toast.error('Category name already exists at this level'); return; }

    try {
      setSaving(true);
      const res = await api.post('/api/insertupdateitemcategory', {
        CategoryID:     0,
        CatgoryName:    trimmed,
        CategoryParent: parentId ?? null,
        CreatedBy:      sessionStorage.getItem('UserId'),
        CompanyId:      sessionStorage.getItem('CompanyID'),
      });
      if (res.data.success) {
        toast.success(`"${trimmed}" added to ${levelLabel}`);
        onSaved();          // refresh + close
      } else {
        toast.error(res.data.message || 'Failed to add category');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter')  handleSave();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      style={{
        position: 'absolute', zIndex: 1050, top: 'calc(100% + 4px)', left: 0, right: 0,
        background: '#fff', borderRadius: '8px',
        border: `1px solid ${primaryColor}`,
        boxShadow: '0 6px 20px rgba(45,75,169,0.15)',
        padding: '10px 12px',
        animation: 'fadeSlideDown 0.15s ease'
      }}
    >
      <style>{`@keyframes fadeSlideDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ fontSize: '11px', fontWeight: '600', color: primaryColor, marginBottom: '6px' }}>
        Add new {levelLabel}
      </div>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <input
          ref={inputRef}
          type="text"
          className="form-control form-control-sm"
          placeholder={`Enter ${levelLabel} name…`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={200}
          style={{ flex: 1, fontSize: '13px' }}
        />
        <button
          type="button"
          className="btn btn-sm"
          onClick={handleSave}
          disabled={saving}
          title="Save"
          style={{
            background: primaryColor, color: '#fff', border: 'none',
            borderRadius: '5px', padding: '4px 10px', fontSize: '13px',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}
        >
          {saving
            ? <span className="spinner-border spinner-border-sm" />
            : <><FaCheck /> Save</>}
        </button>
        <button
          type="button"
          className="btn btn-sm btn-light"
          onClick={onClose}
          title="Cancel"
          style={{ borderRadius: '5px', padding: '4px 8px', fontSize: '13px' }}
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
function CategoryMaster() {

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

  const [categoryData,     setCategoryData]     = useState([]);
  const [treeData,         setTreeData]         = useState([]);
  const [selectedTreeId,   setSelectedTreeId]   = useState(null);
  const [parentPath,       setParentPath]       = useState([]);

  // which dropdown index has the quick-add popover open (-1 = none)
  const [quickAddIndex,    setQuickAddIndex]    = useState(-1);

  const [category, setCategory] = useState({
    CategoryID:     0,
    CatgoryName:    '',
    CategoryParent: null
  });

  // ── fetch ─────────────────────────────────────────────────
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const CompanyId = sessionStorage.getItem('CompanyID');
      const res = await api.get('/api/getitemcategory', { params: { CompanyId } });
      const flat = res.data?.data || [];
      setCategoryData(flat);
      setTreeData(buildTree(flat));
    } catch {
      toast.error('Failed to fetch category data');
    } finally {
      setLoading(false);
    }
  };

  const getChildren    = (parentId) =>
    categoryData.filter((c) => Number(c.CategoryParent ?? 0) === Number(parentId));

  const rootCategories = categoryData.filter(
    (c) => !c.CategoryParent || Number(c.CategoryParent) === 0
  );

  // ── build ancestor path of a node EXCLUDING the node itself ──
  const buildAncestorPath = (node) => {
    const path = [];
    let current = node.CategoryParent
      ? categoryData.find((c) => c.CategoryID === Number(node.CategoryParent))
      : null;
    while (current) {
      path.unshift(current.CategoryID);
      current = current.CategoryParent
        ? categoryData.find((c) => c.CategoryID === Number(current.CategoryParent))
        : null;
    }
    return path;
  };

  // ── tree node click ───────────────────────────────────────
  const handleTreeSelect = (node, level) => {
    setSelectedTreeId(node.CategoryID);
    const path       = buildAncestorPath(node);
    setParentPath(path);
    const actualParent = node.CategoryParent ? Number(node.CategoryParent) : null;
    setCategory({
      CategoryID:     node.CategoryID,
      CatgoryName:    node.CatgoryName || '',
      CategoryParent: actualParent
    });
    setIsSubmitDisabled(true);
    setIsUpdateDisabled(false);
    setIsDeleteDisabled(false);
    setFieldErrors({});
    setShowForm(true);
    setQuickAddIndex(-1);
  };

  // ── cascading dropdown change ─────────────────────────────
  const handleDropdownChange = (depth, value) => {
    const val     = value ? parseInt(value) : null;
    // Slice off everything beyond this depth, then append the new selection.
    // This automatically clears any deeper levels when the user changes a parent.
    const newPath = [...parentPath.slice(0, depth), ...(val ? [val] : [])];
    setParentPath(newPath);
    const parentId = newPath.length > 0 ? newPath[newPath.length - 1] : null;
    setCategory((prev) => ({ ...prev, CategoryParent: parentId }));
    setQuickAddIndex(-1);
  };

  // ── quick-add: after save refresh data, keep path intact ──
  const handleQuickAddSaved = async (depth) => {
    setQuickAddIndex(-1);
    // Re-fetch so the new category appears in the dropdown immediately
    try {
      setLoading(true);
      const CompanyId = sessionStorage.getItem('CompanyID');
      const res       = await api.get('/api/getitemcategory', { params: { CompanyId } });
      const flat      = res.data?.data || [];
      setCategoryData(flat);
      setTreeData(buildTree(flat));
    } catch {
      toast.error('Failed to refresh category data');
    } finally {
      setLoading(false);
    }
  };

  // ── validation ────────────────────────────────────────────
  const validateFields = () => {
    const errors = {};
    if (!category.CatgoryName?.trim()) errors.CatgoryName = 'Category Name is required';
    return errors;
  };

  const checkDuplicate = (name, currentId = null) =>
    categoryData.some((c) => {
      const isSame = c.CatgoryName?.trim().toLowerCase() === name.trim().toLowerCase();
      return currentId ? isSame && c.CategoryID !== currentId : isSame;
    });

  // ── build payload ─────────────────────────────────────────
  const buildPayload = (overrides = {}) => ({
    CatgoryName:    category.CatgoryName.trim(),
    CategoryParent: category.CategoryParent ?? null,
    CreatedBy:      sessionStorage.getItem('UserId'),
    CompanyId:      sessionStorage.getItem('CompanyID'),
    ...overrides
  });

  // ── INSERT ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateFields();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (checkDuplicate(category.CatgoryName)) { toast.error('Category Name already exists'); return; }
    try {
      setLoadingSubmit(true);
      const res = await api.post('/api/insertupdateitemcategory', buildPayload({ CategoryID: 0 }));
      if (res.data.success) {
        toast.success('Category created successfully');
        fetchData(); resetForm(); setShowForm(false);
      } else { toast.error(res.data.message || 'Operation failed'); }
    } catch (err) { toast.error(err.response?.data?.message || 'Request failed');
    } finally { setLoadingSubmit(false); }
  };

  // ── UPDATE ────────────────────────────────────────────────
  const handleUpdate = async (e) => {
    e.preventDefault();
    const errors = validateFields();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (checkDuplicate(category.CatgoryName, category.CategoryID)) { toast.error('Category Name already exists'); return; }
    try {
      setLoadingUpdate(true);
      const res = await api.post('/api/insertupdateitemcategory', buildPayload({ CategoryID: category.CategoryID }));
      if (res.data.success) {
        toast.success('Category updated successfully');
        fetchData(); resetForm(); setShowForm(false);
      } else { toast.error(res.data.message || 'Update failed'); }
    } catch (err) { toast.error(err.response?.data?.message || 'Update request failed');
    } finally { setLoadingUpdate(false); }
  };

  // ── DELETE ────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!category.CategoryID) { toast.error('No category selected'); return; }
    const hasChildren = categoryData.some(
      (c) => Number(c.CategoryParent ?? 0) === category.CategoryID
    );
    if (hasChildren) {
      toast.error('Cannot delete — this category has sub-categories. Delete children first.');
      return;
    }
    const confirmed = await confirmDeleteToast();
    if (!confirmed) return;
    try {
      setLoadingDelete(true);
      const res = await api.post('/api/deleteitemcategory', {
          CategoryID: category.CategoryID,
          Group:      0,
          DeletedBy:  parseInt(sessionStorage.getItem('UserId'), 10),
          CompanyId:  sessionStorage.getItem('CompanyID')
        });
      if (res.data.success) {
        toast.success('Category deleted successfully');
        fetchData(); resetForm(); setShowForm(false);
      } else { toast.error(res.data.message || 'Delete failed'); }
    } catch (err) { toast.error(err.response?.data?.message || 'Delete error');
    } finally { setLoadingDelete(false); }
  };

  const confirmDeleteToast = () =>
    new Promise((resolve) => {
      const toastId = toast.warning(
        () => (
          <div>
            <div className="mb-2">Are you sure you want to delete this category?</div>
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

  // ── reset ─────────────────────────────────────────────────
  const resetForm = () => {
    setCategory({ CategoryID: 0, CatgoryName: '', CategoryParent: null });
    setParentPath([]);
    setSelectedTreeId(null);
    setIsSubmitDisabled(false);
    setIsUpdateDisabled(true);
    setIsDeleteDisabled(true);
    setFieldErrors({});
    setQuickAddIndex(-1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCategory((prev) => ({ ...prev, [name]: value || null }));
  };

  const handleClear      = () => { resetForm(); toast.dismiss(); };
  const handleCreateNew  = () => { handleClear(); setShowForm(true); };
  const handleBackToList = () => { setShowForm(false); handleClear(); };

  const filterTree = (nodes, term) => {
    if (!term.trim()) return nodes;
    return nodes.reduce((acc, node) => {
      const filteredChildren = filterTree(node.children || [], term);
      const matches = node.CatgoryName?.toLowerCase().includes(term.toLowerCase());
      if (matches || filteredChildren.length > 0) acc.push({ ...node, children: filteredChildren });
      return acc;
    }, []);
  };

  const filteredTree = filterTree(treeData, searchTerm);

  // ── dynamic cascading dropdowns ───────────────────────────
  // Only show the next dropdown level if the currently selected item
  // actually has children in categoryData. This prevents empty "Level N"
  // dropdowns from appearing when the selected node is a leaf.
  const dropdownLevels = (() => {
    const levels = [
      { label: 'Category', items: rootCategories, depth: 0, parentId: null }
    ];
    for (let idx = 0; idx < parentPath.length; idx++) {
      const pid      = parentPath[idx];
      const children = getChildren(pid);
      // Always show the level for items already in parentPath (user selected them),
      // but only append the NEXT empty level if this selection has children.
      levels.push({
        label:    getLevelLabel(idx + 1),
        items:    children,
        depth:    idx + 1,
        parentId: pid
      });
      // If the selected value at this depth has NO children, stop here —
      // no point showing an empty next-level dropdown.
      const selectedAtThisDepth = parentPath[idx + 1];
      if (!selectedAtThisDepth) {
        // Nothing selected yet at next depth; only continue if pid has children
        if (children.length === 0) break;
        // pid has children but nothing selected yet → show one more empty dropdown
        break;
      }
      // Something IS selected at next depth → loop continues to build that level
    }
    return levels;
  })();

  // ── render ────────────────────────────────────────────────
  return (
    <div className="page-wrapper" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="page-body mt-1">
        <div className="container-fluid px-4">
          <ToastContainer position="top-center" autoClose={3000} />

          {!showForm ? (
            <>
              {/* ── header card ── */}
              <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <div className="card-body p-4">
                  <h2 className="mb-3" style={{ fontWeight: '600', color: '#2d3748', fontSize: '28px' }}>
                    <FaLayerGroup className="me-2" style={{ color: primaryColor }} />
                    Category Master
                  </h2>
                  <div className="d-flex gap-3 mb-3 flex-wrap">
                    {['Category', 'Main Category', 'Sub Category', 'Deep Level'].map((label, i) => (
                      <span key={i} style={{
                        fontSize: '11px', padding: '2px 10px', borderRadius: '10px',
                        background: getLevelColor(i).bg, color: getLevelColor(i).text,
                        border: `1px solid ${getLevelColor(i).border}`
                      }}>
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div style={{ maxWidth: '700px', flex: 1 }}>
                      <div className="input-group" style={{ height: '45px' }}>
                        <span className="input-group-text text-white" style={{ backgroundColor: primaryColor }}>
                          <FaSearch />
                        </span>
                        <input
                          type="text"
                          className="form-control border-start-0"
                          placeholder="Search categories..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={{ backgroundColor: '#fff', borderColor: '#e2e8f0', height: '45px', fontSize: '14px' }}
                        />
                      </div>
                    </div>
                    <button type="button" className="btn d-flex align-items-center gap-2"
                      onClick={handleCreateNew}
                      style={{ borderRadius: '5px', padding: '8px 20px', background: primaryColor, border: 'none', color: 'white', height: '45px', whiteSpace: 'nowrap' }}>
                      <FaPlus /> Create New
                    </button>
                  </div>
                </div>
              </div>

              {/* ── tree card ── */}
              <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <div className="card-body p-0">
                  {loading ? (
                    <div className="text-center p-5">
                      <div className="spinner-border" role="status" style={{ color: primaryColor }} />
                      <p className="mt-3 text-muted">Loading categories...</p>
                    </div>
                  ) : (
                    <div style={{ maxHeight: '600px', overflowY: 'auto', padding: '12px 16px' }}>
                      <div style={{
                        padding: '6px 0 10px', borderBottom: '1px solid #e2e8f0',
                        fontWeight: '600', fontSize: '13px', color: '#4a5568', marginBottom: '10px'
                      }}>
                        Category Structure
                      </div>
                      {filteredTree.length > 0 ? (
                        filteredTree.map((node) => (
                          <TreeNode
                            key={node.CategoryID}
                            node={node}
                            selectedId={selectedTreeId}
                            onSelect={handleTreeSelect}
                            level={0}
                          />
                        ))
                      ) : (
                        <div className="text-center p-5">
                          <FaLayerGroup className="mb-3" style={{ fontSize: '48px', color: '#cbd5e0' }} />
                          <p className="text-muted mb-3">No categories found</p>
                          <button className="btn" onClick={handleCreateNew}
                            style={{ borderRadius: '5px', padding: '10px 24px', background: primaryColor, border: 'none', color: 'white', fontSize: '14px' }}>
                            <FaPlus className="me-2" />Create New Category
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* ── FORM ── */
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-0"
                style={{ borderBottom: '1px solid #e2e8f0' }}>
                <h4 className="m-0" style={{ color: '#2d3748', fontWeight: '600', fontSize: '18px' }}>
                  <FaLayerGroup className="me-2" style={{ color: primaryColor }} />
                  {category.CategoryID ? 'Edit Category' : 'New Category'}
                </h4>
                <button className="btn d-flex align-items-center gap-2" onClick={handleBackToList}
                  style={{ borderRadius: '5px', padding: '8px 16px', fontSize: '14px', background: 'transparent', border: `2px solid ${primaryColor}`, color: primaryColor }}>
                  <FaArrowLeft /> Back to List
                </button>
              </div>

              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="row justify-content-center">
                    <div className="col-md-8">
                      <div className="card border-0 shadow-sm" style={{ borderRadius: '10px' }}>
                        <div className="card-header bg-white"
                          style={{ borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: primaryColor }}>
                          <FaLayerGroup className="me-2" />Category Details
                        </div>
                        <div className="card-body p-4">
                          <div className="row">

                            {/* Category Name */}
                            <div className="col-md-12 mb-3">
                              <label className="form-label fw-medium mb-2">
                                Category Name <span className="text-danger">*</span>
                              </label>
                              <input
                                className={`form-control ${fieldErrors.CatgoryName ? 'is-invalid' : ''}`}
                                name="CatgoryName"
                                value={category.CatgoryName || ''}
                                onChange={handleInputChange}
                                placeholder="Enter category name"
                                maxLength={200}
                                autoFocus
                              />
                              {fieldErrors.CatgoryName && (
                                <div className="invalid-feedback">{fieldErrors.CatgoryName}</div>
                              )}
                            </div>

                            {/* ── Dynamic cascading dropdowns with + button ── */}
                            {dropdownLevels.map((lvl, idx) => (
                              <div className="col-md-4 mb-3" key={idx}>
                                <label className="form-label fw-medium mb-2 d-flex align-items-center justify-content-between">
                                  <span>
                                    <span style={{
                                      display: 'inline-block', width: '10px', height: '10px',
                                      borderRadius: '50%', background: getLevelColor(idx).text,
                                      marginRight: '6px'
                                    }} />
                                    {lvl.label}
                                  </span>

                                  {/* ── + button ── */}
                                  <button
                                    type="button"
                                    title={`Add new ${lvl.label}`}
                                    onClick={() => setQuickAddIndex(quickAddIndex === idx ? -1 : idx)}
                                    style={{
                                      width: '22px', height: '22px',
                                      borderRadius: '50%',
                                      border: `1.5px solid ${getLevelColor(idx).text}`,
                                      background: quickAddIndex === idx
                                        ? getLevelColor(idx).text
                                        : getLevelColor(idx).bg,
                                      color: quickAddIndex === idx ? '#fff' : getLevelColor(idx).text,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      cursor: 'pointer', padding: 0,
                                      fontSize: '11px', transition: 'all 0.15s',
                                      flexShrink: 0
                                    }}
                                  >
                                    {quickAddIndex === idx ? <FaTimes /> : <FaPlus />}
                                  </button>
                                </label>

                                {/* wrapper for dropdown + popover */}
                                <div style={{ position: 'relative' }}>
                                  <select
                                    className="form-select"
                                    value={parentPath[idx] || ''}
                                    onChange={(e) => handleDropdownChange(idx, e.target.value)}
                                    disabled={idx > 0 && !parentPath[idx - 1]}
                                  >
                                    <option value="">
                                      {idx === 0 ? '— Root (no parent) —' : `— Select ${lvl.label} —`}
                                    </option>
                                    {lvl.items.map((c) => (
                                      <option key={c.CategoryID} value={c.CategoryID}>
                                        {c.CatgoryName}
                                      </option>
                                    ))}
                                  </select>

                                  {/* Quick-add popover */}
                                  {quickAddIndex === idx && (
                                    <QuickAddPopover
                                      levelLabel={lvl.label}
                                      parentId={lvl.parentId}
                                      categoryData={categoryData}
                                      onSaved={() => handleQuickAddSaved(idx)}
                                      onClose={() => setQuickAddIndex(-1)}
                                    />
                                  )}
                                </div>
                              </div>
                            ))}

                            {/* Will be created/updated under indicator */}
                            <div className="col-12 mb-2">
                              <div style={{
                                padding: '8px 14px', borderRadius: '8px',
                                background: 'rgba(45,75,169,0.06)',
                                border: '1px solid rgba(45,75,169,0.2)',
                                fontSize: '13px', color: '#4a5568'
                              }}>
                                <strong style={{ color: primaryColor }}>
                                  {category.CategoryID ? 'Will be updated under: ' : 'Will be created under: '}
                                </strong>
                                {category.CategoryParent === null
                                  ? 'Root level (no parent)'
                                  : (() => {
                                      const p = categoryData.find((c) => c.CategoryID === category.CategoryParent);
                                      return p ? p.CatgoryName : 'Root level';
                                    })()
                                }
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="row mt-4">
                    <div className="col-12">
                      <div className="d-flex justify-content-center flex-wrap gap-3">

                        <button type="submit" className="btn px-4 d-flex align-items-center gap-2"
                          style={btnStyle} disabled={isSubmitDisabled || loadingSubmit}>
                          {loadingSubmit
                            ? <><span className="spinner-border spinner-border-sm" /> Creating...</>
                            : <><FaSave /> Submit</>}
                        </button>

                        <button type="button" className="btn px-4 d-flex align-items-center gap-2"
                          style={btnStyle} disabled={isUpdateDisabled || loadingUpdate}
                          onClick={handleUpdate}>
                          {loadingUpdate
                            ? <><span className="spinner-border spinner-border-sm" /> Updating...</>
                            : <><FaEdit /> Update</>}
                        </button>

                        <button type="button" className="btn px-4 d-flex align-items-center gap-2"
                          style={btnStyle} disabled={isDeleteDisabled || loadingDelete}
                          onClick={handleDelete}>
                          {loadingDelete
                            ? <><span className="spinner-border spinner-border-sm" /> Deleting...</>
                            : <><FaTrashAlt /> Delete</>}
                        </button>

                        <button type="button" className="btn px-4 d-flex align-items-center gap-2"
                          style={btnStyle} onClick={handleClear}>
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

export default CategoryMaster;