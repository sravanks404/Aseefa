import React, { useState, useEffect } from 'react';
import api from '../../apiService';
import { usePermission } from '../../../src/context/permissionContex';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FaSearch, FaPlus, FaSave, FaEdit, FaTrashAlt,
  FaEraser, FaArrowLeft, FaTasks, FaCalendarAlt,
  FaFlag, FaUserCheck, FaEye, FaUserTie,
  FaChevronDown, FaCheckCircle, FaHashtag, FaPercentage,
  FaClipboardList, FaFire, FaLayerGroup
} from 'react-icons/fa';

const primaryColor = '#3652DE';
const primaryDark  = '#2A3FB8';
const primaryTint  = '#EEF1FE';

const PRIORITY_OPTIONS = [
  { value: 'High',   label: 'High',   color: '#E5484D', tint: '#FDEDEE' },
  { value: 'Medium', label: 'Medium', color: '#F5A524', tint: '#FFF7E8' },
  { value: 'Low',    label: 'Low',    color: '#2FB344', tint: '#EAFBED' }
];

const METRIC_OPTIONS = [
  { value: 'Binary',     label: 'Completed / Not completed', icon: FaCheckCircle },
  { value: 'Points',     label: 'Points',                    icon: FaHashtag },
  { value: 'Percentage', label: 'Percentage',                icon: FaPercentage }
];

const getPriorityMeta = (priority) =>
  PRIORITY_OPTIONS.find((p) => p.value === priority) ||
  { value: '', label: 'No priority', color: '#94A3B8', tint: '#F1F5F9' };

const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

function TaskManagement() {
  const { getPermission, refreshPermissions } = usePermission();
  const permission = getPermission('TASK_MANAGEMENT');
  const canView = !!permission?.CanView;
  const canAdd = !!permission?.CanAdd;
  const canEdit = !!permission?.CanEdit;
  const canDelete = !!permission?.CanDelete;

  useEffect(() => {
    refreshPermissions();
  }, []);

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

  const [taskData,         setTaskData]         = useState([]);
  const [employeeList,     setEmployeeList]     = useState([]);

  const [approvalOpen,     setApprovalOpen]     = useState(false);
  const [monitoringOpen,   setMonitoringOpen]   = useState(false);

  const emptyTask = {
    TaskID: 0,
    Title: '',
    StartDateTime: '',
    EndDateTime: '',
    AssignTo: '',
    Priority: '',
    ProgressMetricType: '',
    ProgressMetricValue: '',
    ApprovalMembers: [],
    MonitoringMembers: []
  };

  const [task, setTask] = useState(emptyTask);

  // ── fetch on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canView) {
      setTaskData([]);
      setShowForm(false);
      return;
    }
    const CompanyId = sessionStorage.getItem('CompanyID');
    fetchData(CompanyId);
    fetchEmployees();
  }, [canView]);

  const fetchEmployees = async () => {
    try {
      const CompanyId = sessionStorage.getItem('CompanyID');
      const res = await api.get(`/api/GetEmployees/${CompanyId}`);
      if (res.data.success) setEmployeeList(res.data.employees || []);
    } catch {
      toast.error('Failed to load employees');
    }
  };

  // ── GET /api/gettask?CompanyId=X ───────────────────────────────────────────
  const fetchData = async (companyId) => {
    try {
      setLoading(true);
      const finalCompanyId = companyId || sessionStorage.getItem('CompanyID');

      const response = await api.get('/api/gettask', {
        params: { CompanyId: finalCompanyId }
      });

      setTaskData(response.data);

    } catch {
      toast.error('Failed to fetch task data');
    } finally {
      setLoading(false);
    }
  };

  // ── row click → populate form ──────────────────────────────────────────────
  const handleRowClick = (item) => {
    setTask({
      TaskID: item.TaskID,
      Title: item.Title || '',
      StartDateTime: item.StartDateTime || '',
      EndDateTime: item.EndDateTime || '',
      AssignTo: item.AssignTo || '',
      Priority: item.Priority || '',
      ProgressMetricType: item.ProgressMetricType || '',
      ProgressMetricValue: item.ProgressMetricValue || '',
      ApprovalMembers: item.ApprovalMembers || [],
      MonitoringMembers: item.MonitoringMembers || []
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
    if (!task.Title?.trim())      errors.Title = 'Title is required';
    if (!task.StartDateTime)      errors.StartDateTime = 'Start date & time is required';
    if (!task.EndDateTime)        errors.EndDateTime = 'End date & time is required';
    if (task.StartDateTime && task.EndDateTime && new Date(task.EndDateTime) < new Date(task.StartDateTime)) {
      errors.EndDateTime = 'End must be after the start time';
    }
    if (!task.Priority)           errors.Priority = 'Priority is required';
    if (!task.ProgressMetricType) errors.ProgressMetricType = 'Progress metric is required';
    return errors;
  };

  const checkDuplicate = (title, currentTaskID = null) =>
    taskData.some((t) => {
      const isSame = t.Title?.trim().toLowerCase() === title.trim().toLowerCase();
      return currentTaskID ? isSame && t.TaskID !== currentTaskID : isSame;
    });

  // ── POST /api/insertupdatetask  (INSERT — TaskID = 0) ──────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canAdd) {
      toast.error('You do not have permission to create tasks.');
      return;
    }

    const errors = validateFields();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (checkDuplicate(task.Title)) {
      toast.error('A task with this title already exists');
      return;
    }

    try {
      setLoadingSubmit(true);

      const CompanyId = sessionStorage.getItem('CompanyID');
      const CreatedBy = sessionStorage.getItem('UserId');

      const response = await api.post('/api/insertupdatetask', {
        TaskID: 0,
        Title: task.Title.trim(),
        StartDateTime: task.StartDateTime,
        EndDateTime: task.EndDateTime,
        AssignTo: task.AssignTo || null,
        Priority: task.Priority,
        ProgressMetricType: task.ProgressMetricType,
        ProgressMetricValue: task.ProgressMetricValue,
        ApprovalMembers: task.ApprovalMembers,
        MonitoringMembers: task.MonitoringMembers,
        CreatedBy,
        CompanyId
      });

      if (response.data.success) {
        toast.success('Task created successfully');
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

  // ── POST /api/insertupdatetask  (UPDATE — TaskID > 0) ──────────────────────
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      toast.error('You do not have permission to update tasks.');
      return;
    }

    const errors = validateFields();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (checkDuplicate(task.Title, task.TaskID)) {
      toast.error('A task with this title already exists');
      return;
    }

    try {
      setLoadingUpdate(true);

      const CompanyId = sessionStorage.getItem('CompanyID');
      const CreatedBy = sessionStorage.getItem('UserId');

      const response = await api.post('/api/insertupdatetask', {
        TaskID: task.TaskID,
        Title: task.Title.trim(),
        StartDateTime: task.StartDateTime,
        EndDateTime: task.EndDateTime,
        AssignTo: task.AssignTo || null,
        Priority: task.Priority,
        ProgressMetricType: task.ProgressMetricType,
        ProgressMetricValue: task.ProgressMetricValue,
        ApprovalMembers: task.ApprovalMembers,
        MonitoringMembers: task.MonitoringMembers,
        CreatedBy,
        CompanyId
      });

      if (response.data.success) {
        toast.success('Task updated successfully');
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

  // ── DELETE /api/deletetask  { TaskID, DeletedBy } ──────────────────────────
  const handleDelete = async () => {
    if (!canDelete) {
      toast.error('You do not have permission to delete tasks.');
      return;
    }
    if (!task.TaskID) { toast.error('No task selected'); return; }
    const confirmed = await confirmDeleteToast();
    if (!confirmed) return;

    try {
      setLoadingDelete(true);

      const CompanyId = sessionStorage.getItem('CompanyID');
      const DeletedBy = parseInt(sessionStorage.getItem('UserId'), 10);

      const response = await api.delete('/api/deletetask', {
        data: { TaskID: task.TaskID, DeletedBy }
      });

      if (response.data.success) {
        toast.success('Task deleted successfully');
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
            <div className="mb-2">Are you sure you want to delete this task?</div>
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-danger btn-sm" onClick={() => { toast.dismiss(toastId); resolve(true); }}>Yes</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { toast.dismiss(toastId); resolve(false); }}>Cancel</button>
            </div>
          </div>
        ),
        { position: 'top-center', autoClose: false, closeOnClick: false, draggable: false, closeButton: false }
      );
    });

  // ── helpers ────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setTask(emptyTask);
    setIsSubmitDisabled(false);
    setIsUpdateDisabled(true);
    setIsDeleteDisabled(true);
    setFieldErrors({});
    setApprovalOpen(false);
    setMonitoringOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTask((prev) => ({ ...prev, [name]: value }));
  };

  const toggleMember = (listName, employeeId) => {
    setTask((prev) => {
      const current = prev[listName];
      const exists = current.includes(employeeId);
      return { ...prev, [listName]: exists ? current.filter((id) => id !== employeeId) : [...current, employeeId] };
    });
  };

  const removeMember = (listName, employeeId) => {
    setTask((prev) => ({ ...prev, [listName]: prev[listName].filter((id) => id !== employeeId) }));
  };
  // ── new helpers, near toggleMember/removeMember ──
const moveMember = (listName, index, direction) => {
  setTask((prev) => {
    const list = [...prev[listName]];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= list.length) return prev;
    [list[index], list[newIndex]] = [list[newIndex], list[index]];
    return { ...prev, [listName]: list };
  });
};

  const handleClear      = () => { resetForm(); toast.dismiss(); };
  const handleCreateNew  = () => {
    if (!canAdd) {
      toast.error('You do not have permission to create tasks.');
      return;
    }
    handleClear(); setShowForm(true);
  };
  const handleBackToList = () => { setShowForm(false); handleClear(); };

  const filteredTasks = taskData.filter((item) =>
    item.Title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const employeeName = (id) => employeeList.find((e) => e.EmployeeID === id)?.EmployeeName || '';

  const fmtDateTime = (v) => {
    if (!v) return '—';
    const d = new Date(v);
    if (isNaN(d)) return '—';
    return d.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // ── dashboard stats ──────────────────────────────────────────────────────
  const totalTasks = taskData.length;
  const highPriorityCount = taskData.filter((t) => t.Priority === 'High').length;
  const dueSoonCount = taskData.filter((t) => {
    if (!t.EndDateTime) return false;
    const diffDays = (new Date(t.EndDateTime) - new Date()) / 86400000;
    return diffDays >= 0 && diffDays <= 7;
  }).length;

  // ── avatar stack (list view) ────────────────────────────────────────────
  const AvatarStack = ({ ids, accent }) => {
    if (!ids || ids.length === 0) return <span className="tm-muted-xs">None</span>;
    const shown = ids.slice(0, 3);
    const extra = ids.length - shown.length;
    return (
      <div className="d-flex align-items-center">
        {shown.map((id, i) => (
          <span
            key={id}
            className="tm-avatar-sm"
            style={{ backgroundColor: accent, marginLeft: i === 0 ? 0 : '-8px', zIndex: shown.length - i }}
            title={employeeName(id)}
          >
            {initials(employeeName(id))}
          </span>
        ))}
        {extra > 0 && (
          <span className="tm-avatar-sm tm-avatar-extra" style={{ marginLeft: '-8px' }}>+{extra}</span>
        )}
      </div>
    );
  };

  // ── member multi-select dropdown ────────────────────────────────────────
const renderMemberPicker = (label, IconComp, listName, open, setOpen, accent, tint, ordered = false) => (
  <div className="mb-1">
    <label className="tm-label">
      <IconComp size={12} style={{ color: accent }} />
      {label}
      <span className="tm-optional">optional</span>
    </label>
    <div className="position-relative">
      <button type="button" className="tm-select-btn" onClick={() => setOpen((o) => !o)}>
        <span className={task[listName].length ? 'tm-select-value' : 'tm-select-placeholder'}>
          {task[listName].length > 0
            ? `${task[listName].length} member${task[listName].length > 1 ? 's' : ''} selected`
            : 'Select members'}
        </span>
        <FaChevronDown size={10} className="tm-chevron" />
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div className="tm-dropdown">
            {employeeList.length === 0 && <div className="tm-dropdown-empty">No employees found</div>}
            {employeeList.map((emp) => {
              const checked = task[listName].includes(emp.EmployeeID);
              return (
                <label key={emp.EmployeeID} className="tm-dropdown-row">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleMember(listName, emp.EmployeeID)}
                  />
                  <span className="tm-avatar-sm" style={{ backgroundColor: accent }}>
                    {initials(emp.EmployeeName)}
                  </span>
                  {emp.EmployeeName}
                </label>
              );
            })}
          </div>
        </>
      )}
    </div>

    {ordered && task[listName].length > 0 && (
      <div className="tm-hint mb-1" style={{ marginTop: 6 }}>
        Order below reflects approval sequence — first listed approves first.
      </div>
    )}

    {task[listName].length > 0 && (
      <div className={ordered ? 'd-flex flex-column gap-2 mt-2' : 'd-flex flex-wrap gap-2 mt-2'}>
        {task[listName].map((id, index) => (
          ordered ? (
            <div
              key={id}
              className="d-flex align-items-center gap-2"
              style={{
                background: tint, color: accent, borderRadius: 10,
                padding: '6px 10px', fontSize: 12.5, fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 20, height: 20, borderRadius: '50%', background: accent, color: '#fff',
                  fontSize: 10.5, fontWeight: 800, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0,
                }}
              >
                {index + 1}
              </span>
              <span style={{ flex: 1 }}>{employeeName(id)}</span>
              <button
                type="button"
                onClick={() => moveMember(listName, index, -1)}
                disabled={index === 0}
                title="Move earlier in approval order"
                style={{ background: 'none', border: 'none', color: accent, cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.35 : 1 }}
              >▲</button>
              <button
                type="button"
                onClick={() => moveMember(listName, index, 1)}
                disabled={index === task[listName].length - 1}
                title="Move later in approval order"
                style={{ background: 'none', border: 'none', color: accent, cursor: index === task[listName].length - 1 ? 'not-allowed' : 'pointer', opacity: index === task[listName].length - 1 ? 0.35 : 1 }}
              >▼</button>
              <span onClick={() => removeMember(listName, id)} className="tm-chip-x">×</span>
            </div>
          ) : (
            <span key={id} className="tm-chip" style={{ backgroundColor: tint, color: accent }}>
              {employeeName(id)}
              <span onClick={() => removeMember(listName, id)} className="tm-chip-x">×</span>
            </span>
          )
        ))}
      </div>
    )}
  </div>
);

  const priorityMeta = getPriorityMeta(task.Priority);
  const assignedMeta = employeeList.find((e) => e.EmployeeID === task.AssignTo);

  if (!canView) {
    return (
      <div className="tm-page">
        <div className="tm-wrap">
          <div className="alert alert-danger">You do not have permission to view Task Management.</div>
        </div>
      </div>
    );
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="tm-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Inter:wght@400;500;600;700&display=swap');

        .tm-page { font-family:'Inter',ui-sans-serif,system-ui,sans-serif; background:#F5F6FA; min-height:100vh; color:#2A2E3B; }
        .tm-page h1,.tm-page h2,.tm-page h3,.tm-page h4 { font-family:'Manrope','Inter',sans-serif; }
        .tm-page .tm-wrap { max-width:1180px; margin:0 auto; padding:32px 20px 60px; }

        /* header */
        .tm-title { font-weight:800; font-size:26px; color:#171A24; letter-spacing:-0.02em; margin:0; }
        .tm-subtitle { color:#8A90A2; font-size:13.5px; margin-top:2px; }
        .tm-stat { display:flex; align-items:center; gap:10px; background:#fff; border:1px solid #ECEEF3; border-radius:12px; padding:10px 16px; box-shadow:0 1px 2px rgba(20,20,43,0.03); }
        .tm-stat-icon { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .tm-stat-num { font-family:'Manrope',sans-serif; font-weight:800; font-size:18px; line-height:1; color:#171A24; }
        .tm-stat-label { font-size:11.5px; color:#8A90A2; font-weight:500; margin-top:2px; }

        /* top bar */
        .tm-toolbar { background:#fff; border:1px solid #ECEEF3; border-radius:14px; padding:14px 16px; box-shadow:0 1px 2px rgba(20,20,43,0.03); }
        .tm-search { position:relative; flex:1; max-width:420px; }
        .tm-search input { width:100%; height:42px; border-radius:10px; border:1px solid #E4E6ED; padding:0 14px 0 40px; font-size:13.5px; outline:none; transition:.15s; background:#FAFAFC; }
        .tm-search input:focus { border-color:${primaryColor}; background:#fff; box-shadow:0 0 0 3px ${primaryTint}; }
        .tm-search svg { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#A6ABBB; font-size:13px; }
        .tm-btn-primary { height:42px; border:none; border-radius:10px; padding:0 20px; background:linear-gradient(135deg, ${primaryColor}, ${primaryDark}); color:#fff; font-weight:600; font-size:13.5px; display:inline-flex; align-items:center; gap:8px; box-shadow:0 4px 10px rgba(54,82,222,0.28); transition:.15s; }
        .tm-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 14px rgba(54,82,222,0.35); }
        .tm-btn-ghost { height:42px; border:1.5px solid #E4E6ED; border-radius:10px; padding:0 18px; background:#fff; color:#4B5163; font-weight:600; font-size:13.5px; display:inline-flex; align-items:center; gap:8px; transition:.15s; }
        .tm-btn-ghost:hover { border-color:${primaryColor}; color:${primaryColor}; background:${primaryTint}; }
        .tm-btn-ghost:disabled, .tm-btn-primary:disabled { opacity:.4; cursor:not-allowed; transform:none; box-shadow:none; }

        /* table card */
        .tm-table-card { background:#fff; border:1px solid #ECEEF3; border-radius:14px; overflow:hidden; box-shadow:0 1px 2px rgba(20,20,43,0.03); margin-top:18px; }
        .tm-table { width:100%; border-collapse:collapse; }
        .tm-table thead th { background:#FAFAFC; text-transform:uppercase; letter-spacing:.06em; font-size:10.5px; font-weight:700; color:#9AA0B1; padding:13px 18px; border-bottom:1px solid #ECEEF3; text-align:left; position:sticky; top:0; }
        .tm-table tbody td { padding:14px 18px; font-size:13.5px; color:#3D4257; border-bottom:1px solid #F1F2F6; vertical-align:middle; }
        .tm-row { cursor:pointer; transition:background .12s; }
        .tm-row:hover { background:#FAFBFF; }
        .tm-row.active { background:${primaryTint}; }
        .tm-row-title { font-weight:600; color:#20232E; }
        .tm-row-icon { width:32px; height:32px; border-radius:9px; background:${primaryTint}; display:flex; align-items:center; justify-content:center; color:${primaryColor}; font-size:13px; flex-shrink:0; }
        .tm-muted-xs { color:#B4B8C6; font-size:12.5px; }

        .tm-pill { display:inline-flex; align-items:center; gap:6px; padding:4px 11px; border-radius:99px; font-size:11.5px; font-weight:700; }
        .tm-dot { width:7px; height:7px; border-radius:50%; }

        .tm-avatar-sm { width:26px; height:26px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; color:#fff; font-size:10px; font-weight:700; border:2px solid #fff; flex-shrink:0; }
        .tm-avatar-extra { background:#CBD0DE !important; color:#5A5F70; }

        /* empty state */
        .tm-empty { text-align:center; padding:70px 20px; }
        .tm-empty-icon { width:64px; height:64px; border-radius:16px; background:${primaryTint}; color:${primaryColor}; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; font-size:26px; }

        /* form */
        .tm-form-header { background:#fff; border:1px solid #ECEEF3; border-radius:14px 14px 0 0; padding:18px 24px; display:flex; align-items:center; justify-content:space-between; }
        .tm-section { background:#fff; border:1px solid #ECEEF3; border-radius:14px; padding:22px 24px; margin-bottom:18px; box-shadow:0 1px 2px rgba(20,20,43,0.03); }
        .tm-section-title { display:flex; align-items:center; gap:9px; font-weight:700; font-size:14px; color:#171A24; margin-bottom:18px; padding-bottom:12px; border-bottom:1px solid #F1F2F6; }
        .tm-section-title .tm-sec-icon { width:28px; height:28px; border-radius:8px; background:${primaryTint}; color:${primaryColor}; display:flex; align-items:center; justify-content:center; font-size:12px; }

        .tm-label { display:flex; align-items:center; gap:6px; font-size:12.5px; font-weight:600; color:#5A5F70; margin-bottom:7px; }
        .tm-required { color:#E5484D; }
        .tm-optional { margin-left:auto; font-size:10px; font-weight:600; color:#B4B8C6; background:#F1F2F6; padding:2px 7px; border-radius:99px; }

        .tm-input, .tm-select-btn, select.tm-input { width:100%; height:42px; border-radius:10px; border:1.5px solid #E4E6ED; padding:0 13px; font-size:13.5px; outline:none; transition:.15s; background:#fff; color:#2A2E3B; }
        .tm-input:focus, .tm-select-btn:focus { border-color:${primaryColor}; box-shadow:0 0 0 3px ${primaryTint}; }
        .tm-input.error { border-color:#E5484D; }
        .tm-input.error:focus { box-shadow:0 0 0 3px #FDEDEE; }
        .tm-error-text { color:#E5484D; font-size:11.5px; margin-top:5px; font-weight:500; }
        .tm-hint { color:#A6ABBB; font-size:11.5px; margin-top:6px; }

        .tm-select-btn { display:flex; align-items:center; justify-content:space-between; cursor:pointer; text-align:left; }
        .tm-select-placeholder { color:#A6ABBB; }
        .tm-select-value { color:#2A2E3B; font-weight:500; }
        .tm-chevron { color:#A6ABBB; }

        .tm-dropdown { position:absolute; z-index:20; top:calc(100% + 6px); left:0; right:0; background:#fff; border:1px solid #ECEEF3; border-radius:12px; box-shadow:0 12px 28px rgba(20,20,43,0.14); max-height:230px; overflow-y:auto; padding:6px; }
        .tm-dropdown-empty { padding:14px; color:#A6ABBB; font-size:12.5px; text-align:center; }
        .tm-dropdown-row { display:flex; align-items:center; gap:10px; padding:9px 10px; border-radius:8px; font-size:13px; color:#3D4257; cursor:pointer; font-weight:500; }
        .tm-dropdown-row:hover { background:#FAFBFF; }
        .tm-dropdown-row input { accent-color:${primaryColor}; }

        .tm-chip { display:inline-flex; align-items:center; gap:7px; padding:5px 10px 5px 12px; border-radius:99px; font-size:12px; font-weight:600; }
        .tm-chip-x { cursor:pointer; font-weight:800; opacity:.6; font-size:14px; line-height:1; }
        .tm-chip-x:hover { opacity:1; }

        .tm-priority-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
        .tm-priority-btn { border-radius:10px; padding:11px; display:flex; align-items:center; justify-content:center; gap:8px; font-weight:600; font-size:13px; cursor:pointer; transition:.15s; border:1.5px solid #E4E6ED; background:#fff; color:#5A5F70; }
        .tm-priority-btn:hover { border-color:#C7CBDA; }
        .tm-priority-btn.active { color:#fff; border-color:transparent; }

        .tm-metric-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:14px; }
        .tm-metric-btn { border-radius:10px; padding:14px 8px; display:flex; flex-direction:column; align-items:center; gap:7px; font-weight:600; font-size:11.5px; text-align:center; cursor:pointer; border:1.5px solid #E4E6ED; background:#fff; color:#5A5F70; transition:.15s; line-height:1.25; }
        .tm-metric-btn:hover { border-color:#C7CBDA; }
        .tm-metric-btn.active { background:${primaryColor}; border-color:${primaryColor}; color:#fff; }
        .tm-metric-box { background:#FAFBFF; border:1px solid #F1F2F6; border-radius:10px; padding:14px; }

        /* preview panel */
        .tm-preview { background:linear-gradient(180deg,#20233A 0%, #171A29 100%); border-radius:16px; padding:24px; color:#fff; position:sticky; top:20px; box-shadow:0 16px 32px rgba(20,20,43,0.22); }
        .tm-preview-eyebrow { text-transform:uppercase; letter-spacing:.12em; font-size:10.5px; font-weight:700; color:#8189B8; margin-bottom:10px; }
        .tm-preview-title { font-family:'Manrope',sans-serif; font-weight:800; font-size:19px; line-height:1.3; margin-bottom:16px; word-break:break-word; }
        .tm-preview-title.placeholder { color:#565C82; font-weight:600; font-size:15px; }
        .tm-preview-row { display:flex; align-items:center; gap:10px; padding:10px 0; border-top:1px solid rgba(255,255,255,0.08); font-size:12.5px; }
        .tm-preview-row .lbl { color:#8189B8; width:92px; flex-shrink:0; font-weight:500; }
        .tm-preview-row .val { color:#EDEFFB; font-weight:600; }
        .tm-preview-progress-track { width:100%; height:6px; background:rgba(255,255,255,0.12); border-radius:99px; overflow:hidden; margin-top:6px; }
        .tm-preview-progress-fill { height:100%; background:linear-gradient(90deg,#6E8CFF,#B18CFF); border-radius:99px; }
        .tm-preview-actions { margin-top:20px; display:flex; flex-direction:column; gap:8px; }
        .tm-pbtn { height:42px; border-radius:10px; font-weight:600; font-size:13px; display:flex; align-items:center; justify-content:center; gap:8px; border:none; transition:.15s; width:100%; }
        .tm-pbtn-submit { background:linear-gradient(135deg,#6E8CFF,#3652DE); color:#fff; }
        .tm-pbtn-update { background:rgba(255,255,255,0.1); color:#fff; border:1px solid rgba(255,255,255,0.16); }
        .tm-pbtn-delete { background:rgba(229,72,77,0.15); color:#FF8489; border:1px solid rgba(229,72,77,0.3); }
        .tm-pbtn-clear { background:transparent; color:#8189B8; }
        .tm-pbtn:disabled { opacity:.35; cursor:not-allowed; }

        @media (max-width: 991px) { .tm-preview { position:static; margin-top:18px; } }
      `}</style>

      <div className="tm-wrap">
        <ToastContainer position="top-center" autoClose={3000} />

        {!showForm ? (
          /* ════════════ LIST VIEW ════════════ */
          <>
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
              <div>
                <h1 className="tm-title"><FaTasks className="me-2" style={{ color: primaryColor }} />Task Management</h1>
                <p className="tm-subtitle">Plan, assign and track work across your team</p>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <div className="tm-stat">
                  <span className="tm-stat-icon" style={{ background: primaryTint, color: primaryColor }}><FaLayerGroup size={13} /></span>
                  <div><div className="tm-stat-num">{totalTasks}</div><div className="tm-stat-label">Total tasks</div></div>
                </div>
                <div className="tm-stat">
                  <span className="tm-stat-icon" style={{ background: '#FDEDEE', color: '#E5484D' }}><FaFire size={13} /></span>
                  <div><div className="tm-stat-num">{highPriorityCount}</div><div className="tm-stat-label">High priority</div></div>
                </div>
                <div className="tm-stat">
                  <span className="tm-stat-icon" style={{ background: '#FFF7E8', color: '#F5A524' }}><FaCalendarAlt size={13} /></span>
                  <div><div className="tm-stat-num">{dueSoonCount}</div><div className="tm-stat-label">Due in 7 days</div></div>
                </div>
              </div>
            </div>

            <div className="tm-toolbar d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="tm-search">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Search tasks by title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button type="button" className="tm-btn-primary" onClick={handleCreateNew}>
                <FaPlus size={12} /> Create New Task
              </button>
            </div>

            <div className="tm-table-card">
              {loading ? (
                <div className="text-center p-5">
                  <div className="spinner-border" role="status" style={{ color: primaryColor }}>
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-muted">Loading tasks...</p>
                </div>
              ) : filteredTasks.length > 0 ? (
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  <table className="tm-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>#</th>
                        <th>Task</th>
                        <th>Priority</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Assigned To</th>
                        <th>Approval</th>
                        <th>Monitoring</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map((item, index) => {
                        const p = getPriorityMeta(item.Priority);
                        return (
                          <tr
                            key={item.TaskID}
                            onClick={() => handleRowClick(item)}
                            className={`tm-row ${task.TaskID === item.TaskID ? 'active' : ''}`}
                          >
                            <td className="tm-muted-xs">{index + 1}</td>
                            <td>
                              <div className="d-flex align-items-center gap-3">
                                <span className="tm-row-icon"><FaTasks /></span>
                                <span className="tm-row-title">{item.Title}</span>
                              </div>
                            </td>
                            <td>
                              <span className="tm-pill" style={{ background: p.tint, color: p.color }}>
                                <span className="tm-dot" style={{ background: p.color }} />{p.label}
                              </span>
                            </td>
                            <td>{fmtDateTime(item.StartDateTime)}</td>
                            <td>{fmtDateTime(item.EndDateTime)}</td>
                            <td>
                              {item.AssignTo ? (
                                <div className="d-flex align-items-center gap-2">
                                  <span className="tm-avatar-sm" style={{ backgroundColor: primaryColor }}>{initials(employeeName(item.AssignTo))}</span>
                                  {employeeName(item.AssignTo)}
                                </div>
                              ) : <span className="tm-muted-xs">Unassigned</span>}
                            </td>
                            <td><AvatarStack ids={item.ApprovalMembers} accent="#7C5CFC" /></td>
                            <td><AvatarStack ids={item.MonitoringMembers} accent="#0EA5A4" /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="tm-empty">
                  <div className="tm-empty-icon"><FaClipboardList /></div>
                  <p className="text-muted mb-3">No tasks found</p>
                  <button type="button" className="tm-btn-primary" onClick={handleCreateNew}>
                    <FaPlus size={12} /> Create New Task
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* ════════════ FORM VIEW ════════════ */
          <form onSubmit={handleSubmit}>
            <div className="tm-form-header mb-4">
              <h4 className="m-0" style={{ fontWeight: 700, fontSize: '17px', color: '#171A24' }}>
                {task.TaskID ? 'Edit Task' : 'New Task'}
              </h4>
              <button type="button" className="tm-btn-ghost" onClick={handleBackToList}>
                <FaArrowLeft size={12} /> Back to list
              </button>
            </div>

            <div className="row">
              <div className="col-lg-8">

                {/* Overview */}
                <div className="tm-section">
                  <div className="tm-section-title"><span className="tm-sec-icon"><FaTasks size={12} /></span>Overview</div>

                  <div className="mb-3">
                    <label className="tm-label">Title <span className="tm-required">*</span></label>
                    <input
                      className={`tm-input ${fieldErrors.Title ? 'error' : ''}`}
                      name="Title"
                      value={task.Title}
                      onChange={handleInputChange}
                      placeholder="e.g. Prepare Q3 client proposal"
                      maxLength={200}
                    />
                    {fieldErrors.Title && <div className="tm-error-text">{fieldErrors.Title}</div>}
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="tm-label"><FaCalendarAlt size={11} style={{ color: primaryColor }} />Start Date &amp; Time <span className="tm-required">*</span></label>
                      <input
                        type="datetime-local"
                        className={`tm-input ${fieldErrors.StartDateTime ? 'error' : ''}`}
                        name="StartDateTime"
                        value={task.StartDateTime}
                        onChange={handleInputChange}
                      />
                      {fieldErrors.StartDateTime && <div className="tm-error-text">{fieldErrors.StartDateTime}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="tm-label"><FaCalendarAlt size={11} style={{ color: primaryColor }} />End Date &amp; Time <span className="tm-required">*</span></label>
                      <input
                        type="datetime-local"
                        className={`tm-input ${fieldErrors.EndDateTime ? 'error' : ''}`}
                        name="EndDateTime"
                        value={task.EndDateTime}
                        onChange={handleInputChange}
                      />
                      {fieldErrors.EndDateTime && <div className="tm-error-text">{fieldErrors.EndDateTime}</div>}
                    </div>
                  </div>

                  <div className="mb-1">
                    <label className="tm-label"><FaUserTie size={11} style={{ color: primaryColor }} />Assign To<span className="tm-optional">optional</span></label>
                    <select className="tm-input" name="AssignTo" value={task.AssignTo} onChange={handleInputChange}>
                      <option value="">Unassigned</option>
                      {employeeList.map((emp) => (
                        <option key={emp.EmployeeID} value={emp.EmployeeID}>{emp.EmployeeName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Priority & Progress */}
                <div className="tm-section">
                  <div className="tm-section-title"><span className="tm-sec-icon"><FaFlag size={12} /></span>Priority &amp; progress</div>

                  <div className="mb-4">
                    <label className="tm-label">Priority <span className="tm-required">*</span></label>
                    <div className="tm-priority-grid">
                      {PRIORITY_OPTIONS.map((p) => (
                        <div
                          key={p.value}
                          className={`tm-priority-btn ${task.Priority === p.value ? 'active' : ''}`}
                          style={task.Priority === p.value ? { background: p.color } : {}}
                          onClick={() => setTask((prev) => ({ ...prev, Priority: p.value }))}
                        >
                          <span className="tm-dot" style={{ background: task.Priority === p.value ? '#fff' : p.color }} />
                          {p.label}
                        </div>
                      ))}
                    </div>
                    {fieldErrors.Priority && <div className="tm-error-text">{fieldErrors.Priority}</div>}
                  </div>

                  <div>
                    <label className="tm-label">Progress metric <span className="tm-required">*</span></label>
                    <div className="tm-metric-grid">
                      {METRIC_OPTIONS.map((m) => {
                        const MIcon = m.icon;
                        return (
                          <div
                            key={m.value}
                            className={`tm-metric-btn ${task.ProgressMetricType === m.value ? 'active' : ''}`}
                            onClick={() => setTask((prev) => ({ ...prev, ProgressMetricType: m.value, ProgressMetricValue: '' }))}
                          >
                            <MIcon size={14} />{m.label}
                          </div>
                        );
                      })}
                    </div>
                    {fieldErrors.ProgressMetricType && <div className="tm-error-text mb-2">{fieldErrors.ProgressMetricType}</div>}

                    {task.ProgressMetricType === 'Points' && (
                      <div className="tm-metric-box d-flex align-items-center gap-2">
                        <span className="tm-label mb-0">Target points</span>
                        <input
                          type="number"
                          min={1}
                          className="tm-input"
                          style={{ width: '110px', height: '36px' }}
                          name="ProgressMetricValue"
                          value={task.ProgressMetricValue}
                          onChange={handleInputChange}
                          placeholder="e.g. 10"
                        />
                      </div>
                    )}

                    {task.ProgressMetricType === 'Percentage' && (
                      <div className="tm-metric-box">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="tm-label mb-0">Starting completion</span>
                          <span style={{ color: primaryColor, fontWeight: 700, fontSize: '13px' }}>{task.ProgressMetricValue || 0}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          className="form-range"
                          name="ProgressMetricValue"
                          value={task.ProgressMetricValue || 0}
                          onChange={handleInputChange}
                          style={{ accentColor: primaryColor }}
                        />
                      </div>
                    )}

                    {task.ProgressMetricType === 'Binary' && (
                      <div className="tm-metric-box">
                        <span className="tm-hint mb-0">Task will be tracked simply as Completed or Not completed.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Access */}
                <div className="tm-section mb-0">
                  <div className="tm-section-title"><span className="tm-sec-icon"><FaUserCheck size={12} /></span>Access &amp; oversight</div>
                  <div className="row">
                    <div className="col-md-6">
  {renderMemberPicker('Approval Members', FaUserCheck, 'ApprovalMembers', approvalOpen, setApprovalOpen, '#7C5CFC', '#F3EFFF', true)}
</div>
<div className="col-md-6">
  {renderMemberPicker('Monitoring Members', FaEye, 'MonitoringMembers', monitoringOpen, setMonitoringOpen, '#0EA5A4', '#E6FBFA')}
</div>
                  </div>
                </div>

              </div>

              {/* Live preview + actions */}
              <div className="col-lg-4">
                <div className="tm-preview">
                  <div className="tm-preview-eyebrow">Task preview</div>
                  <div className={`tm-preview-title ${!task.Title ? 'placeholder' : ''}`}>
                    {task.Title || 'Untitled task'}
                  </div>

                  <div className="tm-preview-row">
                    <span className="lbl">Priority</span>
                    <span className="val d-flex align-items-center gap-2">
                      <span className="tm-dot" style={{ background: priorityMeta.color }} />
                      {priorityMeta.label}
                    </span>
                  </div>
                  <div className="tm-preview-row">
                    <span className="lbl">Starts</span>
                    <span className="val">{fmtDateTime(task.StartDateTime)}</span>
                  </div>
                  <div className="tm-preview-row">
                    <span className="lbl">Ends</span>
                    <span className="val">{fmtDateTime(task.EndDateTime)}</span>
                  </div>
                  <div className="tm-preview-row">
                    <span className="lbl">Assignee</span>
                    <span className="val">{assignedMeta ? assignedMeta.EmployeeName : 'Unassigned'}</span>
                  </div>
                  <div className="tm-preview-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <div className="d-flex justify-content-between">
                      <span className="lbl">Progress</span>
                      <span className="val">
                        {task.ProgressMetricType === 'Percentage' && `${task.ProgressMetricValue || 0}%`}
                        {task.ProgressMetricType === 'Points' && `${task.ProgressMetricValue || 0} pts target`}
                        {task.ProgressMetricType === 'Binary' && 'Completed / Not completed'}
                        {!task.ProgressMetricType && '—'}
                      </span>
                    </div>
                    {task.ProgressMetricType === 'Percentage' && (
                      <div className="tm-preview-progress-track">
                        <div className="tm-preview-progress-fill" style={{ width: `${task.ProgressMetricValue || 0}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="tm-preview-row">
                    <span className="lbl">Approvers</span>
                    <span className="val">{task.ApprovalMembers.length || 0}</span>
                  </div>
                  <div className="tm-preview-row">
                    <span className="lbl">Monitors</span>
                    <span className="val">{task.MonitoringMembers.length || 0}</span>
                  </div>

                  <div className="tm-preview-actions">
                    <button type="submit" className="tm-pbtn tm-pbtn-submit" disabled={isSubmitDisabled || loadingSubmit}>
                      {loadingSubmit ? <><span className="spinner-border spinner-border-sm" /> Creating...</> : <><FaSave size={12} /> Submit</>}
                    </button>
                    <button type="button" className="tm-pbtn tm-pbtn-update" disabled={isUpdateDisabled || loadingUpdate} onClick={handleUpdate}>
                      {loadingUpdate ? <><span className="spinner-border spinner-border-sm" /> Updating...</> : <><FaEdit size={12} /> Update</>}
                    </button>
                    <button type="button" className="tm-pbtn tm-pbtn-delete" disabled={isDeleteDisabled || loadingDelete} onClick={handleDelete}>
                      {loadingDelete ? <><span className="spinner-border spinner-border-sm" /> Deleting...</> : <><FaTrashAlt size={12} /> Delete</>}
                    </button>
                    <button type="button" className="tm-pbtn tm-pbtn-clear" onClick={handleClear}>
                      <FaEraser size={12} /> Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default TaskManagement;