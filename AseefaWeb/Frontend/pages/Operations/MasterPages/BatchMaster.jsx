import React, { useState, useEffect } from 'react';
import api from '../../apiService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FaSearch, FaPlus, FaSave, FaEdit, FaTrashAlt,
  FaEraser, FaArrowLeft, FaBoxOpen, FaCalendarAlt
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

function BatchMaster() {

  // ── state ──────────────────────────────────────────────────────────────────
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

  const [batchData,        setBatchData]        = useState([]);
  const [batch,            setBatch]            = useState({
    BatchId: 0, BatchName: '', BatExpiryDate: ''
  });


  // ── fetch on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchData(sessionStorage.getItem('CompanyID'));
  }, []);


  // ── GET /api/getbatch?CompanyId=X ──────────────────────────────────────────
  const fetchData = async (companyId) => {
    try {
      setLoading(true);
      const finalCompanyId = companyId || sessionStorage.getItem('CompanyID');
      const response = await api.get('/api/getbatch', {
        params: { CompanyId: finalCompanyId }
      });
      setBatchData(response.data?.data || []);
    } catch {
      toast.error('Failed to fetch batch data');
    } finally {
      setLoading(false);
    }
  };


  // ── row click → populate form ──────────────────────────────────────────────
  const handleRowClick = (item) => {
    setBatch({
      BatchId:      item.BatchId,
      BatchName:    item.BatchName    || '',
      BatExpiryDate: item.BatExpiryDate
        ? new Date(item.BatExpiryDate).toISOString().split('T')[0]
        : ''
    });
    setIsSubmitDisabled(true);
    setIsUpdateDisabled(false);
    setIsDeleteDisabled(false);
    setFieldErrors({});
    setShowForm(true);
  };


  // ── validation ─────────────────────────────────────────────────────────────
  const validateFields = () => {
    const errors = {};
    if (!batch.BatchName?.trim()) errors.BatchName = 'Batch Name is required';
    return errors;
  };

  const checkDuplicate = (name, currentBatchId = null) =>
    batchData.some((b) => {
      const isSame = b.BatchName?.trim().toLowerCase() === name.trim().toLowerCase();
      return currentBatchId ? isSame && b.BatchId !== currentBatchId : isSame;
    });


  // ── POST /api/insertupdatebatch  (INSERT — BatchId = 0) ───────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateFields();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (checkDuplicate(batch.BatchName)) {
      toast.error('Batch Name already exists');
      return;
    }

    try {
      setLoadingSubmit(true);
      const CompanyId = sessionStorage.getItem('CompanyID');
      const CreatedBy = sessionStorage.getItem('UserId');

      const response = await api.post('/api/insertupdatebatch', {
        BatchId:      0,
        BatchName:    batch.BatchName.trim(),
        BatExpiryDate: batch.BatExpiryDate || null,
        CreatedBy,
        CompanyId
      });

      if (response.data.success) {
        toast.success('Batch created successfully');
        fetchData(CompanyId);
        resetForm();
        setShowForm(false);
      } else {
        toast.error(response.data.message || 'Operation failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally {
      setLoadingSubmit(false);
    }
  };


  // ── POST /api/insertupdatebatch  (UPDATE — BatchId > 0) ───────────────────
  const handleUpdate = async (e) => {
    e.preventDefault();
    const errors = validateFields();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (checkDuplicate(batch.BatchName, batch.BatchId)) {
      toast.error('Batch Name already exists');
      return;
    }

    try {
      setLoadingUpdate(true);
      const CompanyId = sessionStorage.getItem('CompanyID');
      const CreatedBy = sessionStorage.getItem('UserId');

      const response = await api.post('/api/insertupdatebatch', {
        BatchId:      batch.BatchId,
        BatchName:    batch.BatchName.trim(),
        BatExpiryDate: batch.BatExpiryDate || null,
        CreatedBy,
        CompanyId
      });

      if (response.data.success) {
        toast.success('Batch updated successfully');
        fetchData(CompanyId);
        resetForm();
        setShowForm(false);
      } else {
        toast.error(response.data.message || 'Update failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update request failed');
    } finally {
      setLoadingUpdate(false);
    }
  };


  // ── DELETE /api/deletebatch  { BatchId, DeletedBy } ───────────────────────
  const handleDelete = async () => {
    if (!batch.BatchId) { toast.error('No batch selected'); return; }
    const confirmed = await confirmDeleteToast();
    if (!confirmed) return;

    try {
      setLoadingDelete(true);
      const CompanyId = sessionStorage.getItem('CompanyID');
      const DeletedBy = parseInt(sessionStorage.getItem('UserId'), 10);

      const response = await api.post('/api/deletebatch', { BatchId: batch.BatchId, DeletedBy });

      if (response.data.success) {
        toast.success('Batch deleted successfully');
        fetchData(CompanyId);
        resetForm();
        setShowForm(false);
      } else {
        toast.error(response.data.message || 'Delete failed');
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
            <div className="mb-2">Are you sure you want to delete this batch?</div>
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


  // ── helpers ────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setBatch({ BatchId: 0, BatchName: '', BatExpiryDate: '' });
    setIsSubmitDisabled(false);
    setIsUpdateDisabled(true);
    setIsDeleteDisabled(true);
    setFieldErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBatch((prev) => ({ ...prev, [name]: value }));
  };

  const handleClear      = () => { resetForm(); toast.dismiss(); };
  const handleCreateNew  = () => { handleClear(); setShowForm(true); };
  const handleBackToList = () => { setShowForm(false); handleClear(); };

  // ── expiry status helper ───────────────────────────────────────────────────
  const getExpiryStatus = (dateStr) => {
    if (!dateStr) return null;
    const today = new Date();
    const expiry = new Date(dateStr);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0)  return { label: 'Expired',    color: '#e53e3e', bg: '#fff5f5' };
    if (diffDays <= 30) return { label: `${diffDays}d left`, color: '#dd6b20', bg: '#fffaf0' };
    return { label: 'Valid', color: '#38a169', bg: '#f0fff4' };
  };

  const filteredBatches = batchData.filter((item) =>
    item.BatchName?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page-wrapper" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="page-body mt-1">
        <div className="container-fluid px-4">
          <ToastContainer position="top-center" autoClose={3000} />

          {!showForm ? (
            /* ════════════ LIST VIEW ════════════ */
            <>
              {/* Header card */}
              <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <div className="card-body p-4">
                  <h2 className="mb-3" style={{ fontWeight: '600', color: '#2d3748', fontSize: '28px' }}>
                    <FaBoxOpen className="me-2" style={{ color: primaryColor }} />
                    Batch Master
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
                          placeholder="Search batches..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={{ backgroundColor: '#fff', borderColor: '#e2e8f0', height: '45px', fontSize: '14px' }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn d-flex align-items-center gap-2"
                      onClick={handleCreateNew}
                      style={{ borderRadius: '5px', padding: '8px 20px', background: primaryColor, border: 'none', color: 'white', height: '45px', whiteSpace: 'nowrap' }}
                    >
                      <FaPlus /> Create New
                    </button>
                  </div>
                </div>
              </div>

              {/* Table card */}
              <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <div className="card-body p-0">
                  {loading ? (
                    <div className="text-center p-5">
                      <div className="spinner-border" role="status" style={{ color: primaryColor }}>
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-3 text-muted">Loading batches...</p>
                    </div>
                  ) : (
                    <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                      <table className="table table-hover mb-0">
                        <thead className="bg-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                          <tr>
                            <th className="py-3 px-4" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px', width: '70px' }}>Slno</th>
                            <th className="py-3"       style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>Batch Name</th>
                            <th className="py-3"       style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>Expiry Date</th>
                            <th className="py-3"       style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBatches.length > 0 ? (
                            filteredBatches.map((item, index) => {
                              const status = getExpiryStatus(item.BatExpiryDate);
                              return (
                                <tr
                                  key={item.BatchId}
                                  onClick={() => handleRowClick(item)}
                                  style={{
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    borderLeft: batch.BatchId === item.BatchId
                                      ? `4px solid ${primaryColor}`
                                      : '4px solid transparent'
                                  }}
                                  className="align-middle"
                                >
                                  <td className="py-3 px-4" style={{ color: '#718096', fontSize: '14px' }}>
                                    {index + 1}
                                  </td>
                                  <td className="py-3">
                                    <div className="d-flex align-items-center">
                                      <div
                                        className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3"
                                        style={{ width: '36px', height: '36px', flexShrink: 0 }}
                                      >
                                        <FaBoxOpen style={{ color: primaryColor, fontSize: '14px' }} />
                                      </div>
                                      <span className="fw-medium">{item.BatchName}</span>
                                    </div>
                                  </td>
                                  <td className="py-3" style={{ color: '#4a5568', fontSize: '14px' }}>
                                    {item.BatExpiryDate ? (
                                      <span className="d-flex align-items-center gap-2">
                                        <FaCalendarAlt style={{ color: '#718096', fontSize: '13px' }} />
                                        {new Date(item.BatExpiryDate).toLocaleDateString('en-IN', {
                                          day: '2-digit', month: 'short', year: 'numeric'
                                        })}
                                      </span>
                                    ) : (
                                      <span style={{ color: '#a0aec0' }}>—</span>
                                    )}
                                  </td>
                                  <td className="py-3">
                                    {status ? (
                                      <span style={{
                                        fontSize: '12px', fontWeight: '500',
                                        padding: '3px 10px', borderRadius: '20px',
                                        color: status.color, background: status.bg
                                      }}>
                                        {status.label}
                                      </span>
                                    ) : (
                                      <span style={{ color: '#a0aec0', fontSize: '13px' }}>—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan="4" className="text-center p-5">
                                <FaBoxOpen className="mb-3" style={{ fontSize: '48px', color: '#cbd5e0' }} />
                                <p className="text-muted mb-3">No batches found</p>
                                <button
                                  className="btn"
                                  onClick={handleCreateNew}
                                  style={{ borderRadius: '5px', padding: '10px 24px', background: primaryColor, border: 'none', color: 'white', fontSize: '14px' }}
                                >
                                  <FaPlus className="me-2" />Create New Batch
                                </button>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
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
                  <FaBoxOpen className="me-2" style={{ color: primaryColor }} />
                  {batch.BatchId ? 'Edit Batch' : 'New Batch'}
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
                          <FaBoxOpen className="me-2" />Batch Details
                        </div>
                        <div className="card-body p-4">

                          {/* Batch Name */}
                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">
                              Batch Name <span className="text-danger">*</span>
                            </label>
                            <input
                              className={`form-control ${fieldErrors.BatchName ? 'is-invalid' : ''}`}
                              name="BatchName"
                              value={batch.BatchName}
                              onChange={handleInputChange}
                              placeholder="Enter batch name"
                              maxLength={100}
                              autoFocus
                            />
                            {fieldErrors.BatchName && (
                              <div className="invalid-feedback">{fieldErrors.BatchName}</div>
                            )}
                          </div>

                          {/* Expiry Date */}
                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">
                              Expiry Date
                            </label>
                            <input
                              type="date"
                              className="form-control"
                              name="BatExpiryDate"
                              value={batch.BatExpiryDate}
                              onChange={handleInputChange}
                            />
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="row mt-4">
                    <div className="col-12">
                      <div className="d-flex justify-content-center flex-wrap gap-3">

                        <button
                          type="submit"
                          className="btn px-4 d-flex align-items-center gap-2"
                          style={btnStyle}
                          disabled={isSubmitDisabled || loadingSubmit}
                        >
                          {loadingSubmit
                            ? <><span className="spinner-border spinner-border-sm" role="status" /> Creating...</>
                            : <><FaSave /> Submit</>}
                        </button>

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

export default BatchMaster;