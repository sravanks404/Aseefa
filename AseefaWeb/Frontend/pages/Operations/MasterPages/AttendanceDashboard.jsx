/*
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FaFileExcel as FaExportExcel, FaFilePdf as FaExportPdf } from 'react-icons/fa';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import api from '../../apiService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    FaSearch, FaUser, FaSave, FaUndo, FaCalendarAlt, FaBuilding, FaBriefcase,
    FaSync, FaInfoCircle, FaExclamationTriangle, FaLock, FaUsers,
    FaUpload, FaFilePdf, FaFileWord, FaFileExcel, FaTrash, FaTimes, FaDownload, FaFolderOpen, FaSpinner, FaFile,FaEnvelope 
} from 'react-icons/fa';

import companyLogoUrl from '../../../src/assets/Havens_Logo.png';
import companySealUrl from '../../../src/assets/haven_logo_navy_transparent.png';
import { usePermission } from '../../../src/context/permissionContex';

// ── Normalizes document URLs coming from the backend ──
// Handles a stale hardcoded localhost URL, a relative path, or an
// already-correct absolute URL (left untouched).
const BASE_URL = api.defaults.baseURL || "";

const resolveDocUrl = (url) => url;

const COMPANY_NAME = 'HAVEN TECHNICAL SERVICES';

// ── Brand letterhead colors, matched to the HTS logo artwork ──
const BRAND_BLUE_HEX = '003E90';     // "HAVEN"
const BRAND_ORANGE_HEX = 'F29400';   // "TECHNICAL SERVICES" / divider rule
const BRAND_BLUE_RGB = [0, 62, 144];
const BRAND_ORANGE_RGB = [242, 148, 0];

const primaryColor = 'rgb(45, 75, 169)';

const fullName = (item) =>
    [item.Name, item.MName, item.LName].filter(Boolean).join(' ').trim() || 'Unknown Worker';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];

const daysInMonth = (year, month) => new Date(year, month, 0).getDate();
const isSunday = (year, month, day) => new Date(year, month - 1, day).getDay() === 0;


const parseCellInput = (raw) => {
    if (raw === null || raw === undefined) return null;
    const v = String(raw).trim().toUpperCase();
    if (v === '') return null;
    if (v === 'A' || v === 'ABSENT') return 'A';
    if (v === 'H' || v === 'HOLIDAY' || v === 'HOL') return 'H';
    if (v === 'S' || v === 'SUNDAY') return 'S';
    if (v === 'I' || v === 'INDUCTION' || v === 'IND') return 'I';
    if (v === 'OFF' || v === 'O' || v === 'OFFHIRED' || v === 'OFFHIRE') return 'Offhired';
    const num = parseFloat(v);
    if (!isNaN(num) && /^-?\d+(\.\d+)?$/.test(v)) {
        if (num < 0) return 0;
        if (num > 24) return 24;
        return num;
    }
    return undefined;
};

const cellDisplay = (v) => {
    if (v === null || v === undefined) return '';
    if (v === 'Offhired') return 'OFF';
    return String(v);
};
// Returns an actual Number for hour values, a short text code otherwise.
// (cellDisplay always stringifies — fine for on-screen grid, bad for Excel.)
const cellExcelValue = (v) => {
    if (v === null || v === undefined) return '';
    if (v === 'Offhired') return 'OFF';
    if (typeof v === 'number') return v;   // keep as number, not string
    return String(v);                      // A / H / S / I stay text
};

const cellStyleFor = (v) => {
    if (v === null || v === undefined) return { bg: 'transparent', fg: '#cbd5e0' };
    if (v === 'A') return { bg: '#fff5f5', fg: '#e53e3e' };
    if (v === 'H') return { bg: '#f5f0ff', fg: '#805ad5' };
    if (v === 'S') return { bg: '#fff8ec', fg: '#dd8b1f' };
    if (v === 'I') return { bg: '#e6f7ff', fg: '#0b7285' };
    if (v === 'Offhired') return { bg: '#f1f2f4', fg: '#718096' };
    return { bg: '#f0fff4', fg: '#276749' };
};
const MAX_FILE_MB = 15;
const ACCEPTED_EXT = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.webp'];

const extOf = (name = '') => {
    const m = name.match(/\.[^.]+$/);
    return m ? m[0].toLowerCase() : '';
};

const kindOfDoc = (doc) => {
    if (doc.FileType) return doc.FileType;
    const ext = extOf(doc.FileName);
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) return 'image';
    if (ext === '.pdf') return 'pdf';
    if (['.doc', '.docx', '.xls', '.xlsx'].includes(ext)) return 'doc';
    return 'other';
};

const docIcon = (doc) => {
    const kind = kindOfDoc(doc);
    const ext = extOf(doc.FileName);
    if (kind === 'image') return null;
    if (kind === 'pdf') return <FaFilePdf style={{ color: '#e53e3e' }} />;
    if (ext === '.xls' || ext === '.xlsx') return <FaFileExcel style={{ color: '#276749' }} />;
    if (ext === '.doc' || ext === '.docx') return <FaFileWord style={{ color: '#2b6cb0' }} />;
    return <FaFile style={{ color: '#718096' }} />;
};

function AttendanceDashboard() {
    const { getPermission, refreshPermissions } = usePermission();
    const permission = getPermission('ATTENDANCE_DASHBOARD');
    const canView = !!permission?.CanView;
    const canAdd = !!permission?.CanAdd;
    const canEdit = !!permission?.CanEdit;
    const canDelete = !!permission?.CanDelete;
    const canApprove = !!permission?.CanApprove;

    useEffect(() => {
        refreshPermissions();
    }, []);

    // ── Filters ──
    const [clientList, setClientList] = useState([]);
    const [projectsByClient, setProjectsByClient] = useState({});
    const [clientID, setClientID] = useState('');
    const [projectID, setProjectID] = useState('');
    const [monthValue, setMonthValue] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const [tradeFilter, setTradeFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    // ── Filter mode: Client (default) or Supplier ──
    const [filterMode, setFilterMode] = useState('client'); // 'client' | 'supplier'
    const [supplierList, setSupplierList] = useState([]);   // independent supplier list, fetched on mount
    const [selectedSupplierID, setSelectedSupplierID] = useState('');
    const [selectedSupplierProjectID, setSelectedSupplierProjectID] = useState('');
    const [loadingSupplierProjects, setLoadingSupplierProjects] = useState(false);
    const [projectsBySupplier, setProjectsBySupplier] = useState({});
    const [idDisplayMode, setIdDisplayMode] = useState('haven'); 

    const [categoryList, setCategoryList] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [selectedCategoryID, setSelectedCategoryID] = useState('');
    const [selectedCategoryProjectID, setSelectedCategoryProjectID] = useState('');
    const [loadingCategoryProjects, setLoadingCategoryProjects] = useState(false);
    const [projectsByCategory, setProjectsByCategory] = useState({});

    const [loadingClients, setLoadingClients] = useState(false);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [saving, setSaving] = useState(false);

    // ── Data ──
    const [workers, setWorkers] = useState([]);
    const [edits, setEdits] = useState({}); // key `${UserId}_${day}` -> new value

    // ── Cell editing ──
    const [activeCell, setActiveCell] = useState(null); // { userId, day }
    const [draft, setDraft] = useState('');
    const [supplierFilter, setSupplierFilter] = useState('All');
    const [copyingPrevMonth, setCopyingPrevMonth] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [previewDoc, setPreviewDoc] = useState(null);
    const docFileInputRef = useRef(null);
    const [exportingExcel, setExportingExcel] = useState(false);
    const [exportingPdf, setExportingPdf] = useState(false);
    const [allProjectsList, setAllProjectsList] = useState([]);
const [loadingAllProjects, setLoadingAllProjects] = useState(false);
const userRole = sessionStorage.getItem('RoleName'); // or however you store it
const [signOffActionLoading, setSignOffActionLoading] = useState(false);
const [approvalChain, setApprovalChain] = useState([]);
const [loadingChain, setLoadingChain] = useState(false);
const [actioningStepId, setActioningStepId] = useState(null);
const [employeeList, setEmployeeList] = useState([]); // needed to resolve names, like TaskManagement does
const [taskApproverList, setTaskApproverList] = useState([]);
const [projectSuppliersList, setProjectSuppliersList] = useState([]);
const [loadingProjectSuppliers, setLoadingProjectSuppliers] = useState(false);

const fetchTaskApprovers = async () => {
    try {
        const CompanyId = sessionStorage.getItem('CompanyID');
        const res = await api.get(`/api/GetTaskApprovers/${CompanyId}`);
        if (res.data.success) setTaskApproverList(res.data.approvers || []);
    } catch {
        // non-fatal
    }
};

const currentUserId = Number(sessionStorage.getItem('UserId'));

const employeeName = (id) =>
    employeeList.find(e => Number(e.EmployeeID) === Number(id))?.EmployeeName || `User #${id}`;

const fetchEmployees = async () => {
    try {
        const CompanyId = sessionStorage.getItem('CompanyID');
        const res = await api.get(`/api/GetEmployees/${CompanyId}`);
        if (res.data.success) setEmployeeList(res.data.employees || []);
    } catch {
        // non-fatal, names just fall back to "User #id"
    }
};

const fetchApprovalChain = async () => {
    setLoadingChain(true);
    try {
        const CompanyID = sessionStorage.getItem('CompanyID');
        const params = { CompanyID, Month: month, Year: year };
        if (filterMode === 'client') { params.ClientID = clientID; params.ProjectID = projectID || null; }
        else if (filterMode === 'supplier') { params.SupplierID = selectedSupplierID || null; params.ProjectID = selectedSupplierProjectID || null; }
        else { params.CategoryID = selectedCategoryID; params.ProjectID = selectedCategoryProjectID || null; }

        const res = await api.get('/api/GetAttendanceApprovalChain', { params });
        setApprovalChain(res.data.chain || []);
    } catch {
        setApprovalChain([]);
    } finally {
        setLoadingChain(false);
    }
};

const actionStep = async (chainID, action) => {
    setActioningStepId(chainID);
    try {
        const res = await api.post('/api/ActionAttendanceApproval', {
            ChainID: chainID, UserID: currentUserId, Action: action,
        });
        if (res.data.success) {
            toast.success(action === 'Approved' ? 'Approved.' : 'Rejected.');
            await fetchApprovalChain();
        } else {
            toast.error(res.data.message || 'Action failed.');
        }
    } catch (err) {
        toast.error(err.response?.data?.message || 'Action failed.');
    } finally {
        setActioningStepId(null);
    }
};

const getLoggedInUserName = () => {
    try {
        const raw = sessionStorage.getItem('userResponse');
        if (raw) {
            const user = JSON.parse(raw);
            if (user?.Name) return user.Name;
        }
    } catch {
        // fall through to other fallbacks
    }
    return sessionStorage.getItem('Name')
        || sessionStorage.getItem('UserName')
        || sessionStorage.getItem('UserId')
        || '';
};

    const suppliers = useMemo(() => {
        const set = new Set();
        workers.forEach(w => {
            if (w.SupplierName) set.add(w.SupplierName);
        });
        return ['All', ...Array.from(set).sort()];
    }, [workers]);
    const inputRef = useRef(null);

    const [year, month] = useMemo(() => monthValue.split('-').map(Number), [monthValue]);
    const dayCount = useMemo(() => daysInMonth(year, month), [year, month]);
    const days = useMemo(() => Array.from({ length: dayCount }, (_, i) => i + 1), [dayCount]);
    const dateForDay = useCallback(
        (d) => `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        [year, month]
    );
    const [signOff, setSignOff] = useState(null);
    const isCurrentUserApprover = taskApproverList.some(
    e => Number(e.EmployeeID) === currentUserId
);

const fetchSignOff = async () => {
    try {
        const CompanyID = sessionStorage.getItem('CompanyID');
        const params = { CompanyID, Month: month, Year: year };
        if (filterMode === 'client') { params.ClientID = clientID; params.ProjectID = projectID || null; }
        else if (filterMode === 'supplier') { params.SupplierID = selectedSupplierID || null; params.ProjectID = selectedSupplierProjectID || null; }
        else { params.CategoryID = selectedCategoryID; params.ProjectID = selectedCategoryProjectID || null; }
        const res = await api.get('/api/GetAttendanceSignOff', { params });
        setSignOff(res.data.signOff);
    } catch { setSignOff(null); }
};

    const dirtyCount = Object.keys(edits).length;

    const dirtyBreakdown = useMemo(() => {
        let inserts = 0, updates = 0;
        Object.keys(edits).forEach((key) => {
            const [userId, day] = key.split('_');
            const w = workers.find(x => String(x.UserId) === userId);
            const original = w?.Days ? (w.Days[day] ?? w.Days[Number(day)] ?? null) : null;
            if (original === null || original === undefined) inserts += 1;
            else updates += 1;
        });
        return { inserts, updates };
    }, [edits, workers]);
    useEffect(() => {
        const handler = (e) => {
            if (dirtyCount > 0) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [dirtyCount]);

    useEffect(() => {
        if (!canView) return;
        fetchClients(); fetchSuppliers(); fetchCategories(); fetchEmployees(); fetchTaskApprovers();
    }, [canView]);

    const fetchCategories = async () => {
        setLoadingCategories(true);
        try {
            const res = await api.get('/api/GetEmployeeCategoryList');
            setCategoryList(res.data || []);
        } catch {
            toast.error('Failed to load employee categories');
        } finally {
            setLoadingCategories(false);
        }
    };
    const fetchProjectsByCategory = async (categoryID) => {
        if (!categoryID || projectsByCategory[categoryID]) return;
        setLoadingCategoryProjects(true);
        try {
            const res = await api.get('/api/GetProjectsByCategory', { params: { CategoryID: categoryID } });
            setProjectsByCategory(prev => ({ ...prev, [categoryID]: res.data.projects || [] }));
        } catch {
            toast.error('Failed to load projects for this category');
        } finally {
            setLoadingCategoryProjects(false);
        }
    };

    const fetchClients = async () => {
        setLoadingClients(true);
        try {
            const CompanyID = sessionStorage.getItem('CompanyID');
            const res = await api.get(`/api/GetCustomers/${CompanyID}`);
            setClientList(res.data.customers || []);
        } catch {
            toast.error('Failed to load clients');
        } finally {
            setLoadingClients(false);
        }
    };

    const fetchSuppliers = async () => {
        setLoadingSuppliers(true);
        try {
            const CompanyID = sessionStorage.getItem('CompanyID');
            const res = await api.get(`/api/GetSuppliers/${CompanyID}`);
            setSupplierList(res.data.suppliers || []);
        } catch {
            toast.error('Failed to load suppliers');
        } finally {
            setLoadingSuppliers(false);
        }
    };

    const fetchProjects = async (cid) => {
        if (!cid || projectsByClient[cid]) return;
        setLoadingProjects(true);
        try {
            const CompanyId = sessionStorage.getItem('CompanyID');
            const res = await api.get('/api/getprojectsbyclient', { params: { ClientID: cid, CompanyId } });
            setProjectsByClient(prev => ({ ...prev, [cid]: res.data.projects || [] }));
        } catch {
            toast.error('Failed to load projects');
        } finally {
            setLoadingProjects(false);
        }
    };
    const fetchAllProjects = async () => {
    setLoadingAllProjects(true);
    try {
        const CompanyID = sessionStorage.getItem('CompanyID');
        const res = await api.get('/api/GetAllProjects', { params: { CompanyID } });
        setAllProjectsList(res.data.projects || []);
    } catch {
        toast.error('Failed to load projects');
    } finally {
        setLoadingAllProjects(false);
    }
};
    const fetchProjectsBySupplier = async (supplierID) => {
    if (!supplierID) return [];
    if (projectsBySupplier[supplierID]) return projectsBySupplier[supplierID];
    setLoadingSupplierProjects(true);
    try {
        const res = await api.get('/api/GetProjectsBySupplier', { params: { SupplierID: supplierID } });
        const projects = res.data.projects || [];
        setProjectsBySupplier(prev => ({ ...prev, [supplierID]: projects }));
        return projects;
    } catch {
        toast.error('Failed to load projects for this supplier');
        return [];
    } finally {
        setLoadingSupplierProjects(false);
    }
};
const fetchSuppliersByProject = async (projectID) => {
    if (!projectID) return [];
    setLoadingProjectSuppliers(true);
    try {
        const res = await api.get('/api/GetSuppliersByProject', { params: { ProjectID: projectID } });
        return res.data.suppliers || [];
    } catch {
        toast.error('Failed to load suppliers for this project');
        return [];
    } finally {
        setLoadingProjectSuppliers(false);
    }
};

    const confirmIfDirty = (msg) => {
        if (dirtyCount === 0) return true;
        return window.confirm(`${msg}\n\nYou have ${dirtyCount} unsaved change${dirtyCount > 1 ? 's' : ''} that will be lost.`);
    };

const handleFilterModeChange = (mode) => {
    if (mode === filterMode) return;
    if (!confirmIfDirty('Switch filter mode?')) return;
    setFilterMode(mode);
    setClientID('');
    setProjectID('');
    setSelectedSupplierID('');
    setSelectedSupplierProjectID('');
    setSelectedCategoryID('');
    setSelectedCategoryProjectID('');
    setWorkers([]);
    setEdits({});
    setIdDisplayMode('haven'); // ← add this
    if (mode === 'supplier' && allProjectsList.length === 0) {
        fetchAllProjects();
    }
};

  const handleSupplierSelectChange = async (e) => {
    const val = e.target.value;
    if (!confirmIfDirty('Switch supplier?')) return;
    setSelectedSupplierID(val);

    if (val) {
        const supplierProjects = await fetchProjectsBySupplier(val);
        setSelectedSupplierProjectID(prevProjectID => {
            if (!prevProjectID) return prevProjectID;
            const stillValid = supplierProjects.some(p => String(p.UnitID) === String(prevProjectID));
            if (!stillValid) {
                toast.info('The previously selected project isn\'t part of this supplier — cleared.');
                return '';
            }
            return prevProjectID;
        });
    }
};

    const handleCategorySelectChange = (e) => {
        const val = e.target.value;
        if (!confirmIfDirty('Switch category?')) return;
        setSelectedCategoryID(val);
        setSelectedCategoryProjectID('');
        if (val) fetchProjectsByCategory(val);
    };

    const handleCategoryProjectChange = (e) => {
        if (!confirmIfDirty('Switch project?')) return;
        setSelectedCategoryProjectID(e.target.value);
    };
    const handleClientChange = (e) => {
        const val = e.target.value;
        if (!confirmIfDirty('Switch client?')) return;
        setClientID(val);
        setProjectID('');
        setWorkers([]);
        setEdits({});
        if (val) fetchProjects(val);
    };

    const handleProjectChange = (e) => {
        if (!confirmIfDirty('Switch project?')) return;
        setProjectID(e.target.value);
    };

    const handleSupplierProjectChange = async (e) => {
    const val = e.target.value;
    if (!confirmIfDirty('Switch project?')) return;
    setSelectedSupplierProjectID(val);

    if (val) {
        const projSuppliers = await fetchSuppliersByProject(val);
        setProjectSuppliersList(projSuppliers);

        // If the currently-selected supplier isn't part of this project, clear it
        setSelectedSupplierID(prevSupplierID => {
            if (!prevSupplierID) return prevSupplierID;
            const stillValid = projSuppliers.some(s => String(s.AccountID) === String(prevSupplierID));
            if (!stillValid) {
                toast.info('The previously selected supplier isn\'t part of this project — cleared.');
                return '';
            }
            return prevSupplierID;
        });
    } else {
        setProjectSuppliersList([]); // "All Projects" selected → fall back to full supplier list
    }
};

    const handleMonthChange = (e) => {
        if (!confirmIfDirty('Switch month?')) return;
        setMonthValue(e.target.value);
    };

  useEffect(() => {
    if (!canView) {
        setWorkers([]);
        setEdits({});
        setActiveCell(null);
        return;
    }
    if (filterMode === 'client') {
        if (!clientID) { setWorkers([]); return; }
    } else if (filterMode === 'supplier') {
        // Either a Project or a Supplier (or both) is enough to fetch now
        if (!selectedSupplierID && !selectedSupplierProjectID) { setWorkers([]); return; }
    } else {
        if (!selectedCategoryID) { setWorkers([]); return; }
    }
    fetchAttendance();
    fetchSignOff();
}, [canView, filterMode, clientID, projectID, selectedSupplierID, selectedSupplierProjectID, selectedCategoryID, selectedCategoryProjectID, monthValue]);


    const fetchAttendance = async () => {
    setLoadingData(true);
    setEdits({});
    setActiveCell(null);
    try {
        const CompanyID = sessionStorage.getItem('CompanyID');
        const params = { CompanyID, Month: month, Year: year };
        if (filterMode === 'client') {
            params.ClientID = clientID;
            params.ProjectID = projectID || null;
        } else if (filterMode === 'supplier') {
            params.SupplierID = selectedSupplierID || null;
            params.ProjectID = selectedSupplierProjectID || null;
        } else {
            params.CategoryID = selectedCategoryID;
            params.ProjectID = selectedCategoryProjectID || null;
        }
        const res = await api.get('/api/GetAttendanceAbstract', { params });
        const loadedWorkers = res.data.workers || [];
        console.log('sample worker:', loadedWorkers[0]); // ← add this temporarily
        setWorkers(loadedWorkers);
    } catch {
        toast.error('Failed to load attendance data');
        setWorkers([]);
    } finally {
        setLoadingData(false);
    }
};

    useEffect(() => {
        if (workers.length > 0) autoMarkSundays();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workers]);

    // ── Trades derived from the loaded roster ──
    const trades = useMemo(() => {
        const set = new Set(workers.map(w =>
            filterMode === 'client' ? (w.ClientTrade || w.RoleName) : w.RoleName
        ).filter(Boolean));
        return ['All', ...Array.from(set).sort()];
    }, [workers, filterMode]);

const isBadgeMode = filterMode === 'supplier' && idDisplayMode === 'badge';

const filteredWorkers = useMemo(() => {
    let list = workers;
    if (tradeFilter !== 'All') {
        list = list.filter(w =>
            (filterMode === 'client' ? (w.ClientTrade || w.RoleName) : w.RoleName) === tradeFilter
        );
    }
    if (filterMode === 'client' && supplierFilter !== 'All') {
        list = list.filter(w => (w.SupplierName || '') === supplierFilter);
    }
    if (searchTerm.trim()) {
        const t = searchTerm.trim().toLowerCase();
        list = list.filter(w =>
            fullName(w).toLowerCase().includes(t) || String(w.UserId).includes(t)
        );
    }

    if (filterMode === 'supplier' && idDisplayMode === 'badge') {
        list = [...list].sort((a, b) => {
            const aB = (a.BadgeNo ?? '').toString().trim();
            const bB = (b.BadgeNo ?? '').toString().trim();
            const aNum = parseFloat(aB), bNum = parseFloat(bB);
            const aIsNum = aB !== '' && !isNaN(aNum);
            const bIsNum = bB !== '' && !isNaN(bNum);
            if (aIsNum && bIsNum) return aNum - bNum;
            if (aIsNum && !bIsNum) return -1;   // numeric badges first
            if (!aIsNum && bIsNum) return 1;
            if (!aB && bB) return 1;             // blanks last
            if (aB && !bB) return -1;
            return aB.localeCompare(bB);
        });
    }

    return list;
}, [workers, tradeFilter, supplierFilter, searchTerm, filterMode, idDisplayMode]);

    // ── Cell value: edited value takes priority over the loaded value ──
    const cellValue = useCallback((w, day) => {
        const key = `${w.UserId}_${day}`;
        if (Object.prototype.hasOwnProperty.call(edits, key)) return edits[key];
        return w.Days ? (w.Days[day] ?? w.Days[String(day)] ?? null) : null;
    }, [edits]);

    // A day is locked if it falls outside the worker's allocation window, or if
    // the worker was already marked Offhired on an earlier day this month.
    const isDayLocked = useCallback((w, day) => {
        const iso = dateForDay(day);
        if (w.StartDate && iso < w.StartDate) return 'before-join';
        if (w.EndDate && iso > w.EndDate) return 'after-end';
        for (let d = 1; d < day; d++) {
            if (cellValue(w, d) === 'Offhired') return 'offhired';
        }
        return false;
    }, [cellValue, dateForDay]);

    const workerTotal = useCallback((w) => {
        let total = 0;
        for (const d of days) {
            const v = cellValue(w, d);
            if (typeof v === 'number') total += v;
        }
        return total;
    }, [days, cellValue]);

    const workerSalary = useCallback((w) => {
        return workerTotal(w) * (Number(w.WorkerRate) || 0);
    }, [workerTotal]);

    const grandTotals = useMemo(() => {
    const totalHours = filteredWorkers.reduce((sum, w) => sum + workerTotal(w), 0);
    const totalAmount = filteredWorkers.reduce((sum, w) => sum + workerSalary(w), 0);
    return { totalHours, totalAmount };
}, [filteredWorkers, workerTotal, workerSalary]);

// ── Per-day totals across all currently visible workers, for the Grand Total row ──
const dayTotals = useMemo(() => {
    const map = {};
    days.forEach(d => {
        map[d] = filteredWorkers.reduce((sum, w) => {
            const v = cellValue(w, d);
            return sum + (typeof v === 'number' ? v : 0);
        }, 0);
    });
    return map;
}, [days, filteredWorkers, cellValue]);


    const stats = useMemo(() => {
        let totalHours = 0, absences = 0, holidays = 0, sundays = 0, inductions = 0, offhired = 0;
        filteredWorkers.forEach(w => {
    days.forEach(d => {
        const v = cellValue(w, d);
        if (isSunday(year, month, d)) sundays += 1;
        if (typeof v === 'number') totalHours += v;
        else if (v === 'A') absences += 1;
        else if (v === 'H') holidays += 1;
        else if (v === 'I') inductions += 1;
        else if (v === 'Offhired') offhired += 1;
    });
});
        return { totalWorkers: filteredWorkers.length, totalHours, absences, holidays, sundays, inductions, offhired };
    }, [filteredWorkers, days, cellValue]);

    // ── Editing ──
    const startEdit = (w, day) => {
        if (!canEdit) {
            toast.error('You do not have permission to edit attendance.');
            return;
        }
        const locked = isDayLocked(w, day);
        if (locked) {
            const msg = locked === 'before-join'
                ? 'This date is before the worker joined this allocation.'
                : locked === 'after-end'
                    ? 'This date is after the worker\'s allocation end date.'
                    : 'Worker was marked Offhired on an earlier date — no entries allowed after that.';
            toast.info(msg);
            return;
        }
        setActiveCell({ userId: w.UserId, day });
        setDraft(cellDisplay(cellValue(w, day)));
    };

    useEffect(() => {
        if (activeCell && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [activeCell]);

    // Finds the worker at rowOffset from the current one, in the visible/filtered list
    const moveToCell = (currentUserId, day, rowOffset, dayOffset) => {
        const idx = filteredWorkers.findIndex(x => x.UserId === currentUserId);
        const targetRow = filteredWorkers[idx + rowOffset];
        const targetDay = day + dayOffset;
        if (!targetRow || targetDay < 1 || targetDay > dayCount) return;
        if (isDayLocked(targetRow, targetDay)) return; // skip locked cells silently
        startEdit(targetRow, targetDay);
    };

    const commitEdit = (w, day, move) => {
        if (!canEdit) {
            toast.error('You do not have permission to edit attendance.');
            return;
        }
        const parsed = parseCellInput(draft);
        if (parsed === undefined) {
            toast.error('Enter hours (0–24), A for Absent, H for Holiday, or OFF for Offhired.');
            return;
        }
        const key = `${w.UserId}_${day}`;
        const original = w.Days ? (w.Days[day] ?? w.Days[String(day)] ?? null) : null;
        setEdits(prev => {
            const next = { ...prev };
            if (parsed === original) delete next[key];
            else next[key] = parsed;
            return next;
        });
        setActiveCell(null);
        if (move) {
            setTimeout(() => moveToCell(w.UserId, day, move.rowOffset, move.dayOffset), 0);
        }
    };

    const cancelEdit = () => setActiveCell(null);
    const autoMarkSundays = useCallback(() => {
        if (workers.length === 0) return;
        let marked = 0;

        setEdits(prev => {
            const next = { ...prev };
            workers.forEach(w => {
                days.forEach(day => {
                    if (!isSunday(year, month, day)) return;
                    if (isDayLocked(w, day)) return;

                    const key = `${w.UserId}_${day}`;
                    const existing = w.Days ? (w.Days[day] ?? w.Days[String(day)] ?? null) : null;
                    const queued = Object.prototype.hasOwnProperty.call(next, key) ? next[key] : undefined;
                    const effective = queued !== undefined ? queued : existing;

                    if (effective !== null && effective !== undefined) return;

                    next[key] = 0; // numeric, not '0' — keeps it a Number in Excel/PDF exports and in totals
                    marked += 1;
                });
            });
            return next;
        });

        if (marked > 0) {
            toast.info(`Auto-marked ${marked} Sunday${marked > 1 ? 's' : ''}. Review and Save.`);
        }
    }, [workers, days, year, month, isDayLocked]);

    const handleMarkDayHoliday = (day) => {
        if (!canEdit) {
            toast.error('You do not have permission to edit attendance.');
            return;
        }
        const eligible = filteredWorkers.filter(w => !isDayLocked(w, day));
        if (eligible.length === 0) {
            toast.info('No eligible workers for this day (all are locked).');
            return;
        }
        if (!window.confirm(`Mark ${eligible.length} worker(s) as Holiday for day ${day}?`)) return;

        setEdits(prev => {
            const next = { ...prev };
            eligible.forEach(w => {
                const key = `${w.UserId}_${day}`;
                const original = w.Days ? (w.Days[day] ?? w.Days[String(day)] ?? null) : null;
                if (original === 'H') delete next[key]; // no actual change, keep it clean
                else next[key] = 'H';
            });
            return next;
        });
        toast.success(`Marked ${eligible.length} worker(s) as Holiday for day ${day}`);
    };

    const handleDiscard = () => {
        if (!canEdit) {
            toast.error('You do not have permission to edit attendance.');
            return;
        }
        if (dirtyCount === 0) return;
        if (window.confirm(`Discard ${dirtyCount} unsaved change${dirtyCount > 1 ? 's' : ''}?`)) {
            setEdits({});
            toast.info('Unsaved changes discarded');
        }
    };
    const selectedClientName = clientList.find(c => String(c.AccountID) === String(clientID))?.AccountName;
    const selectedSupplierName = supplierList.find(s => String(s.AccountID) === String(selectedSupplierID))?.AccountName;
    const selectedCategoryName = categoryList.find(c => String(c.CategoryID) === String(selectedCategoryID))?.CategoryName;
    // ── Header meta shared by both exports ──
    const scopeLabel = filterMode === 'client'
        ? (selectedClientName || '')
        : filterMode === 'supplier'
            ? (selectedSupplierName || '')
            : (selectedCategoryName || '');

    const scopeFieldLabel = filterMode === 'client' ? 'Client Name'
        : filterMode === 'supplier' ? 'Supplier Name'
            : 'CATEGORY';

    const buildExportAOA = () => {
    const empIdLabel = isBadgeMode ? 'Badge No.' : 'Emp ID';
    const headerRow = [empIdLabel, 'Name', 'Trade', ...days, 'Total', ...(showRateColumns ? ['Rate', 'Amount'] : [])];
    const dataRows = filteredWorkers.map(w => {
        const row = [
            isBadgeMode ? (w.BadgeNo || '') : `HAV/${w.UserId}`,
            fullName(w),
            filterMode === 'client' ? (w.ClientTrade || w.RoleName || '') : (w.RoleName || ''),
        ];
        days.forEach(d => row.push(cellDisplay(cellValue(w, d)) || ''));
        row.push(workerTotal(w));
        if (showRateColumns) {
            row.push(Number(w.WorkerRate || 0));
            row.push(Number(workerSalary(w).toFixed(2)));
        }
        return row;
    });
    return [headerRow, ...dataRows];
};
    const buildEmailHtml = () => {
    const rows = [
        ['Scope', `${scopeFieldLabel}: ${scopeLabel || '—'}`],
        ['Period', `${MONTH_NAMES[month - 1]} ${year}`],
        ['Workers', String(filteredWorkers.length)],
        ['Total Hours', grandTotals.totalHours.toLocaleString()],
    ];
    if (showRateColumns) {
        rows.push(['Total Amount', grandTotals.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })]);
    }
    if (filterMode === 'supplier' && selectedSupplierProjectCode) {
        rows.push(['Project Code', selectedSupplierProjectCode]);
    }

    const rowsHtml = rows.map(([label, val]) => `
        <tr>
            <td style="padding:8px 14px;font-size:13px;color:#718096;font-weight:600;border-bottom:1px solid #edf0f4;">${label}</td>
            <td style="padding:8px 14px;font-size:13px;color:#2d3748;font-weight:700;border-bottom:1px solid #edf0f4;text-align:right;">${val}</td>
        </tr>`).join('');

    return `
<div style="font-family:Arial,Helvetica,sans-serif;background:#f4f6fb;padding:32px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(15,23,42,0.08);">
    <tr>
      <td style="background:#2d4ba9;padding:22px 28px;">
        <span style="color:#ffffff;font-size:17px;font-weight:700;letter-spacing:0.3px;">HAVEN TECHNICAL SERVICES</span>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 28px 6px 28px;">
        <h2 style="margin:0 0 6px 0;font-size:19px;color:#1d2433;">Attendance Sheet — ${MONTH_NAMES[month - 1]} ${year}</h2>
        <p style="margin:0;font-size:13.5px;color:#718096;line-height:1.5;">
          Please find attached the attendance sheet for <strong>${scopeLabel || 'the selected scope'}</strong>, covering ${MONTH_NAMES[month - 1]} ${year}. A summary is provided below.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #edf0f4;border-radius:8px;overflow:hidden;">
          ${rowsHtml}
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:4px 28px 24px 28px;">
        <p style="margin:0;font-size:12.5px;color:#a0aec0;line-height:1.5;">
          This is an automated notification from the SuitApps Haven HRMS. Please review the attached file for full day-by-day details. If anything looks incorrect, contact your account coordinator.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#f7f8fa;padding:16px 28px;border-top:1px solid #edf0f4;">
        <span style="font-size:11.5px;color:#a0aec0;">© ${year} Haven Technical Services · Generated automatically</span>
      </td>
    </tr>
  </table>
</div>`.trim();
};

const exportFileName = () => {
        const mm = MONTH_NAMES[month - 1];

        if (filterMode === 'client') {
            // Timesheet_(ProjectName)_(ProjectCode)_Month_Year
            // Falls back to the client name if no specific project is selected
            // (i.e. viewing the whole client), since there's no project name/code yet.
            const projectPart = selectedClientProjectName
                ? `${selectedClientProjectName}`
                : selectedClientName
                    ? `${selectedClientName}`
                    : '';
            const codePart = selectedClientProjectCode ? `${selectedClientProjectCode}` : '';
            return ['Timesheet', projectPart, codePart, mm, year]
                .filter(Boolean)
                .join('_')
                .replace(/\s+/g, '_');
        }

        if (filterMode === 'supplier') {
            // Timesheet_SupplierName_ProjectCode_Month_Year
            const supplierPart = selectedSupplierName || 'Supplier';
            const codePart = selectedSupplierProjectCode || '';
            return ['Timesheet', supplierPart, codePart, mm, year]
                .filter(Boolean)
                .join('_')
                .replace(/\s+/g, '_');
        }

        // Category mode — unchanged
        const scope = selectedCategoryName || 'Category';
        return `Attendance_${scope}_${mm}_${year}`.replace(/\s+/g, '_');
    };

    // Converts a data URL ("data:image/png;base64,....") into the raw base64 string
    // jsPDF/exceljs expect for addImage/addImage.
    const b64FromDataUrl = (dataUrl) => (dataUrl || '').split(',')[1] || '';

    
const getImageDimensions = (dataUrl) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = reject;
    img.src = dataUrl;
});
    const loadImageAsBase64 = async (url) => {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result); // "data:image/jpeg;base64,...."
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
};
const [sendingEmail, setSendingEmail] = useState(false);

const handleSendAttendanceEmail = async () => {
    if (filteredWorkers.length === 0) { toast.info('No data to send.'); return; }
    setSendingEmail(true);
    try {
        const wb = await buildAttendanceWorkbook();
        const buffer = await wb.xlsx.writeBuffer();

        const fileBase64 = arrayBufferToBase64(buffer);

        const res = await api.post('/api/SendAttendanceEmail', {
            fileName: `${exportFileName()}.xlsx`,
            fileBase64,
            subject: `Attendance Sheet — ${scopeLabel || ''} — ${MONTH_NAMES[month - 1]} ${year}`,
            message: `Please find attached the attendance sheet for ${scopeLabel || 'the selected scope'}, ${MONTH_NAMES[month - 1]} ${year}.`,
            html: buildEmailHtml(),   // ← the only addition needed
        });

        if (res.data.success) {
            toast.success('Attendance sheet emailed successfully.');
        } else {
            toast.error(res.data.message || 'Failed to send email.');
        }
    } catch (err) {
        console.error(err);
        toast.error('Failed to send attendance email.');
    } finally {
        setSendingEmail(false);
    }
};

const buildAttendanceWorkbook = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const sealDataUrl = await loadImageAsBase64(companySealUrl);
    const logoDataUrl = await loadImageAsBase64(companyLogoUrl);
    const logoDims = await getImageDimensions(logoDataUrl);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`${MONTH_NAMES[month - 1]} ${year}`.slice(0, 31));

    const dayCols = days.length;
    const rateCols = showRateColumns ? 2 : 0;
    const totalCols = 3 + dayCols + 1 + rateCols; 
    const lastColLetter = ws.getColumn(totalCols).letter;

    ws.getColumn(1).width = 11;   // Emp ID
ws.getColumn(2).width = 24;   // Name
ws.getColumn(3).width = 14;   // Trade
for (let c = 0; c < dayCols; c++) ws.getColumn(4 + c).width = 4.2;   // was 5 + c
ws.getColumn(4 + dayCols).width = 9;                                 // Total, was 5 + dayCols
if (showRateColumns) {
    ws.getColumn(5 + dayCols).width = 10;   // was 6 + dayCols
    ws.getColumn(6 + dayCols).width = 12;   // was 7 + dayCols
}

    const colWidthPx = (w) => Math.round((w || 8.43) * 7 + 5);
    const sheetWidthPx = Array.from({ length: totalCols }, (_, i) => colWidthPx(ws.getColumn(i + 1).width))
        .reduce((a, b) => a + b, 0);

    const pxToAnchor = (targetPx) => {
        let acc = 0;
        for (let c = 1; c <= totalCols; c++) {
            const w = colWidthPx(ws.getColumn(c).width);
            if (acc + w >= targetPx) return (c - 1) + (targetPx - acc) / w;
            acc += w;
        }
        return totalCols - 1;
    };

// ── Row 1: Logo — actual Havens_Logo.png, centered (the sheet's ONLY header image) ──
    ws.mergeCells(`A1:${lastColLetter}1`);
    const LOGO_H = 34;
    const LOGO_W = Math.round((logoDims.w / logoDims.h) * LOGO_H);
    ws.getRow(1).height = LOGO_H;
    const logoImgId = wb.addImage({ base64: logoDataUrl, extension: 'png' });
    ws.addImage(logoImgId, {
        tl: { col: pxToAnchor(sheetWidthPx / 2 - LOGO_W / 2), row: 0 + 0.05 },
        ext: { width: LOGO_W, height: LOGO_H },
    });

    // ── Row 2: Brand name — text, centered (no image) ──
    ws.mergeCells(`A2:${lastColLetter}2`);
    const letterheadCell = ws.getCell('A2');
    letterheadCell.value = {
        richText: [
            { font: { name: 'Arial', size: 14, bold: true, color: { argb: `FF${BRAND_BLUE_HEX}` } }, text: 'HAVEN ' },
            { font: { name: 'Arial', size: 14, bold: true, color: { argb: `FF${BRAND_ORANGE_HEX}` } }, text: 'TECHNICAL SERVICES' },
        ],
    };
    letterheadCell.alignment = { vertical: 'middle', horizontal: 'center' };
    letterheadCell.border = { bottom: { style: 'medium', color: { argb: `FF${BRAND_ORANGE_HEX}` } } };
    ws.getRow(2).height = 22;

    // ── Row 3: Title ──
ws.mergeCells(`A3:${lastColLetter}3`);
const titleCell = ws.getCell('A3');
titleCell.value = `TIMESHEET - ${MONTH_NAMES[month - 1].toUpperCase()} ${year}`;
titleCell.font = { name: 'Arial', size: 13, bold: true };
titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
ws.getRow(3).height = 22;
    // ══════════════════════════════════════════════════════════════
    // ── Row 4: Scope / Client Name — FULL WIDTH, properly centered ──
    // ── Project Name / Project Code — own row(s), right-aligned ──
    // (matches how the PDF centers the scope label across the full page)
    // ══════════════════════════════════════════════════════════════
   ws.mergeCells(`A4:${lastColLetter}4`);
const scopeCell = ws.getCell('A4');
scopeCell.value = `${scopeFieldLabel}: ${scopeLabel || '—'}`;
scopeCell.font = { name: 'Arial', size: 11, bold: true };
scopeCell.alignment = { vertical: 'middle', horizontal: 'center' };
ws.getRow(4).height = 18;
    const projectNameLabel = filterMode === 'client' && selectedClientProjectName
        ? `Project Name: ${selectedClientProjectName}`
        : null;

    const projectCodeLabel = filterMode === 'supplier' && selectedSupplierProjectCode
        ? `Project Code: ${selectedSupplierProjectCode}`
        : filterMode === 'client' && selectedClientProjectCode
            ? `Project Code: ${selectedClientProjectCode}`
            : null;

    const estimateTextWidthPx = (text) => Math.ceil(text.length * 5.6) + 8; // Arial ~10pt heuristic

    let nextRow = 5;
    [projectNameLabel, projectCodeLabel].filter(Boolean).forEach((label) => {
        ws.mergeCells(`A${nextRow}:${lastColLetter}${nextRow}`);
        const cell = ws.getCell(`A${nextRow}`);
        cell.value = label;
        cell.font = { name: 'Arial', size: 10.5, bold: true, color: { argb: 'FF2D4BA9' } };
        cell.alignment = { vertical: 'middle', horizontal: 'right', wrapText: true };

        const estimatedLines = Math.max(1, Math.ceil(estimateTextWidthPx(label) / Math.max(sheetWidthPx, 1)));
        ws.getRow(nextRow).height = Math.max(16, estimatedLines * 15);

        nextRow += 1;
    });

    const spacerRowIdx = nextRow;
    ws.mergeCells(`A${spacerRowIdx}:${lastColLetter}${spacerRowIdx}`);
    ws.getRow(spacerRowIdx).height = 6;

    const LEGEND_ITEMS = [
        { label: 'Hours Worked', argb: 'FF38A169' },
        { label: 'A = Absent',   argb: 'FFE53E3E' },
        { label: 'H = Holiday',  argb: 'FF805AD5' },
        { label: 'S = Sunday',   argb: 'FFDD8B1F' },
        ...(filterMode !== 'client' ? [{ label: 'I = Induction', argb: 'FF0B7285' }] : []),
        { label: 'OFF = Offhired', argb: 'FF718096' },
    ];

   const headerRowIdx = spacerRowIdx + 1;
    const headerRow = ws.getRow(headerRowIdx);
    const projectColLabel = filterMode === 'client' ? 'Project Name' : 'Project Code';
    const empIdLabel = isBadgeMode ? 'Badge No.' : 'Emp ID';
const headers = [empIdLabel, 'Name', 'Trade', ...days, 'Total', ...(showRateColumns ? ['Rate', 'Amount'] : [])];
    headerRow.values = headers;
    headerRow.eachCell(cell => {
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D2433' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { bottom: { style: 'thin' } };
    });
    days.forEach((d, dayIdx) => {
        if (isSunday(year, month, d)) {
            const cell = headerRow.getCell(5 + dayIdx);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDD8B1F' } };
        }
    });

    const cellFillFor = (v) => {
        if (v === 'A') return { bg: 'FFFFF5F5', fg: 'FFE53E3E' };
        if (v === 'H') return { bg: 'FFF5F0FF', fg: 'FF805AD5' };
        if (v === 'S') return { bg: 'FFFFF8EC', fg: 'FFDD8B1F' };
        if (v === 'I') return { bg: 'FFE6F7FF', fg: 'FF0B7285' };
        if (v === 'Offhired') return { bg: 'FFF1F2F4', fg: 'FF718096' };
        if (typeof v === 'number') return { bg: 'FFF0FFF4', fg: 'FF276749' };
        return null;
    };
    const SUNDAY_TINT = 'FFFDF0E0';

    const totalColIdx = 5 + dayCols;
    const rateColIdx = totalColIdx + 1;
    const amountColIdx = totalColIdx + 2;

    filteredWorkers.forEach((w, i) => {
        const rowIdx = headerRowIdx + 1 + i;
        const rowVals = [
    isBadgeMode ? (w.BadgeNo || '') : `HAV/${w.UserId}`,
    fullName(w),
    filterMode === 'client' ? (w.ClientTrade || w.RoleName || '') : (w.RoleName || ''),
    ...days.map(d => cellExcelValue(cellValue(w, d))),
    workerTotal(w),
];
        if (showRateColumns) {
            rowVals.push(Number(w.WorkerRate || 0));
            rowVals.push(Number(workerSalary(w).toFixed(2)));
        }
        const row = ws.getRow(rowIdx);
        row.values = rowVals;
        row.eachCell(cell => { cell.font = { name: 'Arial', size: 9.5 }; cell.alignment = { horizontal: 'center' }; });
        row.getCell(2).alignment = { horizontal: 'left' };

        row.getCell(totalColIdx).font = { name: 'Arial', size: 10.5, bold: true, color: { argb: 'FF2D4BA9' } };
        row.getCell(totalColIdx).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF0FF' } };
        if (showRateColumns) {
            row.getCell(rateColIdx).font = { name: 'Arial', size: 10.5, bold: true };
            row.getCell(amountColIdx).font = { name: 'Arial', size: 10.5, bold: true, color: { argb: 'FF276749' } };
            row.getCell(amountColIdx).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF7EF' } };
        }

        days.forEach((d, dayIdx) => {
            const colIdx = 5 + dayIdx;
            const cell = row.getCell(colIdx);
            if (isSunday(year, month, d)) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SUNDAY_TINT } };
            }
            const val = cellValue(w, d);
            const colors = cellFillFor(val);
            if (colors) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.bg } };
                cell.font = { name: 'Arial', size: 9.5, color: { argb: colors.fg }, bold: true };
            }
        });
    });

    // ── Grand Total row ──
    const totalRowIdx = headerRowIdx + 1 + filteredWorkers.length;
    const totalRow = ws.getRow(totalRowIdx);
    const totalRowVals = [
    'Grand Total', '', '',
    ...days.map(d => dayTotals[d] || 0),
    grandTotals.totalHours,
];
    if (showRateColumns) {
        totalRowVals.push('');
        totalRowVals.push(Number(grandTotals.totalAmount.toFixed(2)));
    }
    totalRow.values = totalRowVals;
    ws.mergeCells(`A${totalRowIdx}:C${totalRowIdx}`); 
    totalRow.eachCell(cell => {
        cell.font = { name: 'Arial', size: 10, bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF1F7' } };
        cell.border = { top: { style: 'medium', color: { argb: 'FF2D4BA9' } } };
    });
    ws.getCell(`A${totalRowIdx}`).alignment = { horizontal: 'left' };
    totalRow.getCell(totalColIdx).font = { name: 'Arial', size: 15, bold: true, color: { argb: 'FF2D4BA9' } };
    if (showRateColumns) {
        totalRow.getCell(amountColIdx).font = { name: 'Arial', size: 15, bold: true, color: { argb: 'FF276749' } };
    }
    const legendRowIdx = totalRowIdx + 2;
    ws.getRow(legendRowIdx).height = 20;

    const legendSpan = Math.min(12, totalCols); // cap the merge so it can't spread past the left third
    ws.mergeCells(`A${legendRowIdx}:${ws.getColumn(legendSpan).letter}${legendRowIdx}`);
    const legendCell = ws.getCell(`A${legendRowIdx}`);

    const legendRichText = [];
    LEGEND_ITEMS.forEach((item, i) => {
        legendRichText.push({
            font: { name: 'Arial', size: 9.5, bold: true, color: { argb: item.argb } },
            text: '■ ',
        });
        legendRichText.push({
            font: { name: 'Arial', size: 9, color: { argb: 'FF4A5568' } },
            text: item.label + (i < LEGEND_ITEMS.length - 1 ? '    ' : ''),
        });
    });
    legendCell.value = { richText: legendRichText };
    legendCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };

    const thirdCols = Math.max(1, Math.floor(totalCols / 3));
    const leftEndLetter = ws.getColumn(thirdCols).letter;
    const midStartCol = thirdCols + 1;
    const midEndCol = thirdCols * 2;
    const midStartLetter = ws.getColumn(midStartCol).letter;
    const midEndLetter = ws.getColumn(midEndCol).letter;
    const rightStartLetterFooter = ws.getColumn(midEndCol + 1).letter;

    const footerStartRow = legendRowIdx + 3;

   const preparedByLabel = signOff?.PreparedByName ? `Prepared By: ${signOff.PreparedByName}` : 'Prepared By: ____________________';
const verifiedByLabel = signOff?.VerifiedByName ? `Verified By: ${signOff.VerifiedByName}` : 'Verified By: ____________________';
const approvedByLabel = signOff?.ApprovedByName ? `Approved By: ${signOff.ApprovedByName}` : 'Approved By: ____________________';
    ws.mergeCells(`A${footerStartRow}:${leftEndLetter}${footerStartRow}`);
    ws.getCell(`A${footerStartRow}`).value = preparedByLabel;
    ws.getCell(`A${footerStartRow}`).font = { name: 'Arial', size: 10, bold: true };

    ws.mergeCells(`${midStartLetter}${footerStartRow}:${midEndLetter}${footerStartRow}`);
    ws.getCell(`${midStartLetter}${footerStartRow}`).value = verifiedByLabel;
    ws.getCell(`${midStartLetter}${footerStartRow}`).font = { name: 'Arial', size: 10, bold: true };
    ws.getCell(`${midStartLetter}${footerStartRow}`).alignment = { horizontal: 'center' };

    ws.mergeCells(`${rightStartLetterFooter}${footerStartRow}:${lastColLetter}${footerStartRow}`);
    ws.getCell(`${rightStartLetterFooter}${footerStartRow}`).value = approvedByLabel;
    ws.getCell(`${rightStartLetterFooter}${footerStartRow}`).font = { name: 'Arial', size: 10, bold: true };
    ws.getCell(`${rightStartLetterFooter}${footerStartRow}`).alignment = { horizontal: 'right' };

    
    const pxAtColStart = (colIndex) => {
        let acc = 0;
        for (let c = 1; c < colIndex; c++) acc += colWidthPx(ws.getColumn(c).width);
        return acc;
    };
   const verifiedLabelText = verifiedByLabel;
    const approvedLabelText = approvedByLabel;

    const midBlockStartPx = pxAtColStart(midStartCol);
    const midBlockEndPx = pxAtColStart(midEndCol + 1);
    const midBlockCenterPx = midBlockStartPx + (midBlockEndPx - midBlockStartPx) / 2;
    const verifiedLeftEdgePx = midBlockCenterPx - estimateTextWidthPx(verifiedLabelText) / 2;
    const verifiedSigCol = Math.max(midStartCol, Math.floor(pxToAnchor(verifiedLeftEdgePx)) + 1);
    const verifiedSigLetter = ws.getColumn(verifiedSigCol).letter;

    const rightBlockEndPx = pxAtColStart(totalCols + 1);
    const approvedLeftEdgePx = rightBlockEndPx - estimateTextWidthPx(approvedLabelText);
    const approvedSigCol = Math.max(midEndCol + 1, Math.floor(pxToAnchor(approvedLeftEdgePx)) + 1);
    const approvedSigLetter = ws.getColumn(approvedSigCol).letter;
    const sealRow = footerStartRow + 2;

    ws.mergeCells(`A${sealRow}:${leftEndLetter}${sealRow + 3}`);
    ws.getCell(`A${sealRow}`).value = 'Signature:';
    ws.getCell(`A${sealRow}`).font = { name: 'Arial', size: 10 };

    ws.mergeCells(`${verifiedSigLetter}${sealRow}:${midEndLetter}${sealRow + 3}`);
    ws.getCell(`${verifiedSigLetter}${sealRow}`).value = 'Signature:';
    ws.getCell(`${verifiedSigLetter}${sealRow}`).font = { name: 'Arial', size: 10 };
    ws.getCell(`${verifiedSigLetter}${sealRow}`).alignment = { horizontal: 'left' };

    ws.mergeCells(`${approvedSigLetter}${sealRow}:${lastColLetter}${sealRow + 3}`);
    ws.getCell(`${approvedSigLetter}${sealRow}`).value = 'Signature:';
    ws.getCell(`${approvedSigLetter}${sealRow}`).font = { name: 'Arial', size: 10 };
    ws.getCell(`${approvedSigLetter}${sealRow}`).alignment = { horizontal: 'left' };
    const leftEndPx = Array.from({ length: thirdCols }, (_, i) => colWidthPx(ws.getColumn(i + 1).width)).reduce((a, b) => a + b, 0);
    const sealAnchorPx = leftEndPx;
    const SEAL_SIZE = 65;
    const sealImgId = wb.addImage({ base64: sealDataUrl, extension: 'png' });
    ws.addImage(sealImgId, {
        tl: { col: pxToAnchor(sealAnchorPx - SEAL_SIZE / 2), row: sealRow - 1 + 0.1 },
        ext: { width: SEAL_SIZE, height: SEAL_SIZE },
    });

    // ── Contact footer — text-based, mirrors the HTS letterhead footer artwork ──
    const contactRowStart = sealRow + 5;

    ws.mergeCells(`A${contactRowStart}:${lastColLetter}${contactRowStart}`);
    const contactSiteCell = ws.getCell(`A${contactRowStart}`);
    contactSiteCell.value = 'www.haventechserve.com';
    contactSiteCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: `FF${BRAND_BLUE_HEX}` } };
    contactSiteCell.alignment = { vertical: 'middle', horizontal: 'left' };
    contactSiteCell.border = { bottom: { style: 'thin', color: { argb: `FF${BRAND_ORANGE_HEX}` } } };
    ws.getRow(contactRowStart).height = 16;

    ws.mergeCells(`A${contactRowStart + 1}:${lastColLetter}${contactRowStart + 1}`);
    const contactAddressCell = ws.getCell(`A${contactRowStart + 1}`);
    contactAddressCell.value = 'Office No 101, 1st floor, Sajaya 2 Building, Opposite Emirates Driving Institute, Al Qusais, Dubai, U.A.E.';
    contactAddressCell.font = { name: 'Arial', size: 8.5, color: { argb: `FF${BRAND_BLUE_HEX}` } };
    contactAddressCell.alignment = { vertical: 'middle', horizontal: 'left' };
    ws.getRow(contactRowStart + 1).height = 14;

    ws.mergeCells(`A${contactRowStart + 2}:${lastColLetter}${contactRowStart + 2}`);
    const contactEmailCell = ws.getCell(`A${contactRowStart + 2}`);
    contactEmailCell.value = 'admin@haventechserve.com';
    contactEmailCell.font = { name: 'Arial', size: 8.5, color: { argb: `FF${BRAND_BLUE_HEX}` } };
    contactEmailCell.alignment = { vertical: 'middle', horizontal: 'left' };
    ws.getRow(contactRowStart + 2).height = 14;

    
    const lastContentRow = contactRowStart + 2
    let totalContentHeightPt = 0;
    for (let r = 1; r <= lastContentRow; r++) {
        totalContentHeightPt += ws.getRow(r).height || 15; // 15pt = ExcelJS's default row height
    }
    const PAGE_MARGIN_IN = { left: 0.2, right: 0.2, top: 0.15, bottom: 0.15 };
    const contentWidthIn = sheetWidthPx / 96;       // px → in, same 96dpi basis as pxToAnchor
    const contentHeightIn = totalContentHeightPt / 72; // pt → in

    ws.pageSetup = {
        orientation: 'landscape',
        paperWidth: `${(contentWidthIn + PAGE_MARGIN_IN.left + PAGE_MARGIN_IN.right).toFixed(2)}in`,
        paperHeight: `${(contentHeightIn + PAGE_MARGIN_IN.top + PAGE_MARGIN_IN.bottom).toFixed(2)}in`,
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 1,
        horizontalCentered: true,
        verticalCentered: false,
        margins: {
            left: PAGE_MARGIN_IN.left, right: PAGE_MARGIN_IN.right,
            top: PAGE_MARGIN_IN.top, bottom: PAGE_MARGIN_IN.bottom,
            header: 0, footer: 0,
        },
    };
    ws.views = [{ state: 'frozen', xSplit: 4, ySplit: headerRowIdx }];

    return wb;
};

const handleExportExcel = async () => {
    if (filteredWorkers.length === 0) { toast.info('No data to export.'); return; }
    setExportingExcel(true);
    try {
        const wb = await buildAttendanceWorkbook();
        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportFileName()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success('Excel file downloaded.');
    } catch (err) {
        console.error(err);
        toast.error('Failed to export Excel file.');
    } finally {
        setExportingExcel(false);
    }
};
const handleExportPdf = async () => {
    if (filteredWorkers.length === 0) { toast.info('No data to export.'); return; }
    setExportingPdf(true);
    try {
        const sealDataUrl = await loadImageAsBase64(companySealUrl);
        const logoDataUrl = await loadImageAsBase64(companyLogoUrl);
        const logoDims = await getImageDimensions(logoDataUrl);
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a3' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        const BANNER_MARGIN = 50;
        const bannerWidth = pageWidth - BANNER_MARGIN * 2;

        const LEGEND_ITEMS = [
            { label: 'Hours Worked', color: [56, 161, 105] },
            { label: 'A = Absent',   color: [229, 62, 62] },
            { label: 'H = Holiday',  color: [128, 90, 213] },
            { label: 'S = Sunday',   color: [221, 139, 31] },
            ...(filterMode !== 'client' ? [{ label: 'I = Induction', color: [11, 114, 133] }] : []),
            { label: 'OFF = Offhired', color: [113, 128, 150] },
        ];
        // ── Legend now drawn from the left margin, stacked if needed, and guaranteed visible ──
        const drawLegend = (startX, y) => {
            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            const chip = 7, gap = 18, textGap = 5;
            let x = startX;
            LEGEND_ITEMS.forEach((item) => {
                doc.setFillColor(item.color[0], item.color[1], item.color[2]);
                doc.setDrawColor(item.color[0], item.color[1], item.color[2]);
                doc.roundedRect(x, y - chip, chip, chip, 1.2, 1.2, 'FD');
                doc.setTextColor(40, 40, 40);
                doc.text(item.label, x + chip + textGap, y);
                const w = chip + textGap + doc.getTextWidth(item.label);
                x += w + gap;
            });
            doc.setTextColor(0, 0, 0);
        };

const drawPageHeader = () => {
    // ── Logo — actual Havens_Logo.png, centered (this is the header's ONLY image) ──
    const LOGO_H = 34;
    const LOGO_W = (logoDims.w / logoDims.h) * LOGO_H;
    const logoY = 6;
    doc.addImage(logoDataUrl, 'PNG', pageWidth / 2 - LOGO_W / 2, logoY, LOGO_W, LOGO_H);

    // ── Brand name — text, centered under the logo (no image) ──
    const brandY = logoY + LOGO_H + 14;
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    const havenText = 'HAVEN ';
    const techText = 'TECHNICAL SERVICES';
    let brandX = pageWidth / 2 - (doc.getTextWidth(havenText) + doc.getTextWidth(techText)) / 2;
    doc.setTextColor(BRAND_BLUE_RGB[0], BRAND_BLUE_RGB[1], BRAND_BLUE_RGB[2]);
    doc.text(havenText, brandX, brandY, { align: 'left' });
    brandX += doc.getTextWidth(havenText);
    doc.setTextColor(BRAND_ORANGE_RGB[0], BRAND_ORANGE_RGB[1], BRAND_ORANGE_RGB[2]);
    doc.text(techText, brandX, brandY, { align: 'left' });
    doc.setTextColor(0, 0, 0);

    const titleY = brandY + 20;
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`TIMESHEET - ${MONTH_NAMES[month - 1].toUpperCase()} ${year}`, pageWidth / 2, titleY, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`${scopeFieldLabel}: ${scopeLabel || '—'}`, pageWidth / 2, titleY + 16, { align: 'center' });
    const headerRightLabel = filterMode === 'supplier' && selectedSupplierProjectCode
        ? [`Project Code: ${selectedSupplierProjectCode}`]
        : filterMode === 'client' && selectedClientProjectName
            ? [
                `Project Name: ${selectedClientProjectName}`,
                ...(selectedClientProjectCode ? [`Project Code: ${selectedClientProjectCode}`] : []),
              ]
            : null;

    let headerExtra = 0;
    if (headerRightLabel) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(45, 75, 169);
        doc.text(headerRightLabel, pageWidth - BANNER_MARGIN, titleY + 16, {
            align: 'right',
            lineHeightFactor: 1.3,
        });
        if (headerRightLabel.length > 1) headerExtra = 12;
    }

    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');

    return titleY + 20 + headerExtra;
};

        // ── Contact footer — text-based, pinned to the bottom of every page ──
        const drawPageFooterContact = () => {
            const footerContactY = pageHeight - 40;
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(BRAND_BLUE_RGB[0], BRAND_BLUE_RGB[1], BRAND_BLUE_RGB[2]);
            doc.text('www.haventechserve.com', BANNER_MARGIN, footerContactY, { align: 'left' });
            const siteWidth = doc.getTextWidth('www.haventechserve.com');
            doc.setDrawColor(BRAND_ORANGE_RGB[0], BRAND_ORANGE_RGB[1], BRAND_ORANGE_RGB[2]);
            doc.setLineWidth(1);
            doc.line(BANNER_MARGIN, footerContactY + 3, BANNER_MARGIN + siteWidth, footerContactY + 3);
            doc.setLineWidth(0.2);

            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(BRAND_BLUE_RGB[0], BRAND_BLUE_RGB[1], BRAND_BLUE_RGB[2]);
            doc.text('Office No 101, 1st floor, Sajaya 2 Building, Opposite Emirates Driving Institute, Al Qusais, Dubai, U.A.E.', BANNER_MARGIN, footerContactY + 14, { align: 'left' });
            doc.text('admin@haventechserve.com', BANNER_MARGIN, footerContactY + 26, { align: 'left' });
            doc.setTextColor(0, 0, 0);
        };

        const tableStartY = drawPageHeader();

        const projectColLabel = filterMode === 'client' ? 'Project Name' : 'Project Code';
        const empIdLabel = isBadgeMode ? 'Badge No.' : 'Emp ID';
const head = [[empIdLabel, 'Name', 'Trade', ...days.map(String), 'Total', ...(showRateColumns ? ['Rate', 'Amount'] : [])]];
const body = filteredWorkers.map(w => [
    isBadgeMode ? (w.BadgeNo || '') : `HAV/${w.UserId}`, fullName(w),
    filterMode === 'client' ? (w.ClientTrade || w.RoleName || '') : (w.RoleName || ''),
    ...days.map(d => cellDisplay(cellValue(w, d)) || '·'),
    workerTotal(w),
    ...(showRateColumns ? [Number(w.WorkerRate || 0).toFixed(2), workerSalary(w).toFixed(2)] : []),
]);

const grandTotalRow = [
    'Grand Total', '', '',
    ...days.map(d => dayTotals[d] || ''),
    grandTotals.totalHours,
    ...(showRateColumns ? ['', grandTotals.totalAmount.toFixed(2)] : []),
];

const dayColStart = 3; 
const totalColIdx = 4 + days.length;   
const rateColIdx = totalColIdx + 1;
const amountColIdx = totalColIdx + 2;

        const cellColorFor = (v) => {
            if (v === 'A') return { fill: [255, 245, 245], text: [229, 62, 62] };
            if (v === 'H') return { fill: [245, 240, 255], text: [128, 90, 213] };
            if (v === 'S') return { fill: [255, 248, 236], text: [221, 139, 31] };
            if (v === 'I') return { fill: [230, 247, 255], text: [11, 114, 133] };
            if (v === 'Offhired') return { fill: [241, 242, 244], text: [113, 128, 150] };
            if (typeof v === 'number') return { fill: [240, 255, 244], text: [39, 103, 73] };
            return null;
        };
        const SUNDAY_TINT = [253, 240, 224];
        const SUNDAY_HEADER_COLOR = [221, 139, 31];

        // ── Bold Total / Rate / Amount columns ──
        const columnStyles = {
    1: { halign: 'left', cellWidth: 90 },
    [totalColIdx]: { fontStyle: 'bold', fontSize: 8, textColor: [45, 75, 169] },
};
if (showRateColumns) {
    columnStyles[rateColIdx] = { fontStyle: 'bold', fontSize: 7.5 };
    columnStyles[amountColIdx] = { fontStyle: 'bold', fontSize: 8, textColor: [39, 103, 73] };
}

        autoTable(doc, {
            head, body, foot: [grandTotalRow], startY: tableStartY,
            margin: { left: BANNER_MARGIN, right: BANNER_MARGIN, top: tableStartY, bottom: 60 },
            styles: { fontSize: 6, cellPadding: 2, halign: 'center' },
            headStyles: { fillColor: [45, 75, 169] },
            footStyles: { fillColor: [238, 241, 247], textColor: [45, 75, 169], fontStyle: 'bold' },
            columnStyles,
            didParseCell: (data) => {
                const colIdx = data.column.index;
                const dayIdx = colIdx - dayColStart;
                const isDayCol = dayIdx >= 0 && dayIdx < days.length;
                const day = isDayCol ? days[dayIdx] : null;

                if (isDayCol && data.section === 'head' && isSunday(year, month, day)) {
                    data.cell.styles.fillColor = SUNDAY_HEADER_COLOR;
                    data.cell.styles.textColor = [255, 255, 255];
                }

                if (isDayCol && data.section === 'body') {
                    const w = filteredWorkers[data.row.index];
                    const val = w ? cellValue(w, day) : null;
                    const colors = cellColorFor(val);
                    if (colors) {
                        data.cell.styles.fillColor = colors.fill;
                        data.cell.styles.textColor = colors.text;
                        data.cell.styles.fontStyle = 'bold';
                    } else if (isSunday(year, month, day)) {
                        data.cell.styles.fillColor = SUNDAY_TINT;
                    }
                }

                // ── Extra-bold, bigger Grand Total value cells ──
                if (data.section === 'foot' && (colIdx === totalColIdx || colIdx === amountColIdx)) {
    data.cell.styles.fontStyle = 'bold';
    data.cell.styles.fontSize = 11;
    data.cell.styles.textColor = colIdx === amountColIdx ? [39, 103, 73] : [45, 75, 169];
}
            },
            didDrawPage: (data) => {
    if (data.pageNumber > 1) drawPageHeader();
    drawPageFooterContact();
},
        });

        // ── Legend, left-aligned below Grand Total ──
        const legendY = doc.lastAutoTable.finalY + 20;
        drawLegend(BANNER_MARGIN, legendY);

        // ── Footer: Prepared (left) / Verified + Seal (center) / Approved (right) ──
        const leftX = BANNER_MARGIN;
        const centerX = pageWidth / 2;
        const rightX = pageWidth - BANNER_MARGIN;
        const finalY = legendY + 24;
        const footerLimitY = doc.internal.pageSize.getHeight() - 60;
        const footerY = Math.min(finalY, footerLimitY);

doc.setFontSize(10);
doc.setFont(undefined, 'bold');

const preparedLabel = signOff?.PreparedByName
    ? `Prepared By: ${signOff.PreparedByName}`
    : 'Prepared By: ____________________';
const verifiedLabel = signOff?.VerifiedByName
    ? `Verified By: ${signOff.VerifiedByName}`
    : 'Verified By: ____________________';
const approvedLabel = signOff?.ApprovedByName
    ? `Approved By: ${signOff.ApprovedByName}`
    : 'Approved By: ____________________';

doc.text(preparedLabel, leftX, footerY, { align: 'left' });
doc.text(verifiedLabel, centerX, footerY, { align: 'center' });
doc.text(approvedLabel, rightX, footerY, { align: 'right' });


const preparedLeftX = leftX; // already left-aligned, no change needed
const verifiedLeftX = centerX - doc.getTextWidth(verifiedLabel) / 2;
const approvedLeftX = rightX - doc.getTextWidth(approvedLabel);

// ── Seal placed between Prepared and Verified ──
const sealX = (leftX + centerX) / 2;
const SEAL_SIZE = 50;

// ── Bigger gap before signature line ──
const signatureY = footerY + 45; // was +30
doc.setFont(undefined, 'normal');
doc.text('Signature:', preparedLeftX, signatureY, { align: 'left' });
doc.text('Signature:', verifiedLeftX, signatureY, { align: 'left' });
doc.text('Signature:', approvedLeftX, signatureY, { align: 'left' });

        doc.addImage(sealDataUrl, 'PNG', sealX - SEAL_SIZE / 2, footerY + 6, SEAL_SIZE, SEAL_SIZE);

        doc.save(`${exportFileName()}.pdf`);
        toast.success('PDF file downloaded.');
    } catch (err) {
        console.error(err);
        toast.error('Failed to export PDF file.');
    } finally {
        setExportingPdf(false);
    }
};
    const handleSaveChanges = async () => {
        if (!canEdit) {
            toast.error('You do not have permission to save attendance changes.');
            return;
        }
        if (dirtyCount === 0) return;
        setSaving(true);
        try {
            const CompanyID = sessionStorage.getItem('CompanyID');
            const ModifiedBy = sessionStorage.getItem('UserId');
            const entries = Object.entries(edits).map(([key, value]) => {
                const [userIdStr, dayStr] = key.split('_');
                const userId = Number(userIdStr);
                const day = Number(dayStr);
                const w = workers.find(x => Number(x.UserId) === userId);
                const original = w?.Days ? (w.Days[day] ?? w.Days[String(day)] ?? null) : null;
                const action = (original === null || original === undefined) ? 'INSERT' : 'UPDATE';
                return {
                    UserId: userId, Day: day, Date: dateForDay(day), Value: value, Action: action,
                    ClientId: w?.ClientId ?? null, ProjectId: w?.ProjectId ?? null,
                };
            });
            const res = await api.post('/api/SaveAttendance', {
                CompanyID,
                ClientID: filterMode === 'client' ? clientID : null,
                ProjectID: filterMode === 'client' ? (projectID || null)
                    : filterMode === 'category' ? (selectedCategoryProjectID || null)
                        : null,
                SupplierID: filterMode === 'supplier' ? selectedSupplierID : null,
                CategoryID: filterMode === 'category' ? selectedCategoryID : null,
                Month: month,
                Year: year,
                ModifiedBy,
                Entries: entries,
            });
            if (res.data.success) {
                toast.success(`Saved ${entries.length} update${entries.length > 1 ? 's' : ''}`);
                await fetchAttendance();
            } else {
                toast.error(res.data.message || 'Failed to save changes');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const callSignOff = async (endpoint) => {
    if (!canApprove) {
        toast.error('You do not have permission to sign off attendance.');
        return;
    }
    setSignOffActionLoading(true);
    try {
        const CompanyID = sessionStorage.getItem('CompanyID');
        const UserId = sessionStorage.getItem('UserId');
        const body = { CompanyID, Month: month, Year: year, UserId };
        if (filterMode === 'client') { body.ClientID = clientID; body.ProjectID = projectID || null; }
        else if (filterMode === 'supplier') { body.SupplierID = selectedSupplierID || null; body.ProjectID = selectedSupplierProjectID || null; }
        else { body.CategoryID = selectedCategoryID; body.ProjectID = selectedCategoryProjectID || null; }

        const res = await api.post(endpoint, body);
        if (res.data.success) {
            toast.success('Recorded.');
            await fetchSignOff();
        } else {
            toast.error(res.data.message || 'Failed to record.');
        }
    } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to record sign-off.');
    } finally {
        setSignOffActionLoading(false);
    }
};


    const projectOptions = projectsByClient[clientID] || [];
    const selectedSupplierProjectCode = useMemo(() => {
    if (filterMode !== 'supplier' || !selectedSupplierProjectID) return null;
    // Pull the code from the loaded worker rows (same source the table column uses),
    // since the project dropdown list doesn't reliably carry a code field.
    const workerWithCode = workers.find(w => w.ProjectCode);
    if (workerWithCode) return workerWithCode.ProjectCode;

    // Fallback: try the project list in case codes are added there later
    const list = selectedSupplierID
        ? (projectsBySupplier[selectedSupplierID] || [])
        : allProjectsList;
    const proj = list.find(p => String(p.UnitID) === String(selectedSupplierProjectID));
    return proj ? (proj.UnitCode || proj.ProjectCode) : null;
}, [filterMode, selectedSupplierProjectID, selectedSupplierID, projectsBySupplier, allProjectsList, workers]);

const selectedClientProjectCode = useMemo(() => {
    if (filterMode !== 'client' || !projectID) return null;
    // Prefer the loaded worker rows — same source the table column uses —
    // since the project dropdown list doesn't carry a code field.
    const workerWithCode = workers.find(w => w.ProjectCode);
    if (workerWithCode) return workerWithCode.ProjectCode;
    // Fallback: try the project list in case a code field gets added there later
    const proj = projectOptions.find(p => String(p.UnitID) === String(projectID));
    return proj ? (proj.UnitCode || proj.ProjectCode || null) : null;
}, [filterMode, projectID, projectOptions, workers]);

const selectedClientProjectName = useMemo(() => {
    if (filterMode !== 'client' || !projectID) return null;
    const proj = projectOptions.find(p => String(p.UnitID) === String(projectID));
    if (proj) return proj.UnitName;
    // fallback: pull from loaded worker rows
    const workerWithName = workers.find(w => w.ProjectName);
    return workerWithName ? workerWithName.ProjectName : null;
}, [filterMode, projectID, projectOptions, workers]);

    const hasSelection = filterMode === 'client' ? !!clientID
    : filterMode === 'supplier' ? (!!selectedSupplierID || !!selectedSupplierProjectID)
        : !!selectedCategoryID;
    const fetchDocuments = useCallback(async () => {
    if (!hasSelection) { setDocuments([]); return; }
    setLoadingDocs(true);
    try {
        const CompanyID = sessionStorage.getItem('CompanyID');
        const params = { CompanyID, Month: month, Year: year };
        if (filterMode === 'client') {
            params.ClientID = clientID;
            params.ProjectID = projectID || null;
        } else if (filterMode === 'supplier') {
            params.SupplierID = selectedSupplierID || null;
            params.ProjectID = selectedSupplierProjectID || null;
        } else {
            params.CategoryID = selectedCategoryID;
            params.ProjectID = selectedCategoryProjectID || null;
        }

        const res = await api.get('/api/GetAttendanceDocuments', { params });
        setDocuments(res.data.documents || []);
    } catch {
        toast.error('Failed to load documents for this month.');
        setDocuments([]);
    } finally {
        setLoadingDocs(false);
    }
}, [hasSelection, filterMode, clientID, projectID, selectedSupplierID, selectedSupplierProjectID, selectedCategoryID, selectedCategoryProjectID, month, year]);

    useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

    const validateDocFile = (file) => {
        const ext = extOf(file.name);
        if (!ACCEPTED_EXT.includes(ext)) {
            toast.error(`${file.name}: unsupported file type. Allowed: ${ACCEPTED_EXT.join(', ')}`);
            return false;
        }
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
            toast.error(`${file.name}: exceeds the ${MAX_FILE_MB}MB limit.`);
            return false;
        }
        return true;
    };

    const uploadDocFiles = async (fileList) => {
        const files = Array.from(fileList).filter(validateDocFile);
        if (files.length === 0) return;

        setUploadingDoc(true);
        let succeeded = 0;
        try {
            const CompanyID = sessionStorage.getItem('CompanyID');
            const UploadedBy = sessionStorage.getItem('UserId');

            for (const file of files) {
                const form = new FormData();
                form.append('file', file);
                form.append('CompanyID', CompanyID);
                form.append('Month', month);
                form.append('Year', year);
                // inside uploadDocFiles, replace the if/else block:
                if (filterMode === 'client') form.append('ClientID', clientID);
                else if (filterMode === 'supplier') form.append('SupplierID', selectedSupplierID);
                else form.append('CategoryID', selectedCategoryID);
                form.append('UploadedBy', UploadedBy);

                try {
                    await api.post('/api/UploadAttendanceDocument', form, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    succeeded += 1;
                } catch {
                    toast.error(`Failed to upload ${file.name}.`);
                }
            }
            if (succeeded > 0) {
                toast.success(`Uploaded ${succeeded} document${succeeded > 1 ? 's' : ''} for ${MONTH_NAMES[month - 1]} ${year}.`);
                await fetchDocuments();
            }
        } finally {
            setUploadingDoc(false);
            if (docFileInputRef.current) docFileInputRef.current.value = '';
        }
    };

    const handleDocFileInput = (e) => {
        if (e.target.files?.length) uploadDocFiles(e.target.files);
    };

    const handleDocDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.length) uploadDocFiles(e.dataTransfer.files);
    };

    const handleDeleteDoc = async (doc) => {
        if (!window.confirm(`Delete "${doc.FileName}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/api/DeleteAttendanceDocument/${doc.DocumentId}`);
            setDocuments(prev => prev.filter(d => d.DocumentId !== doc.DocumentId));
            if (previewDoc?.DocumentId === doc.DocumentId) setPreviewDoc(null);
            toast.success('Document deleted.');
        } catch {
            toast.error('Failed to delete document.');
        }
    };

    const prevMonthYear = useMemo(() => {
        const m = month === 1 ? 12 : month - 1;
        const y = month === 1 ? year - 1 : year;
        return { prevMonth: m, prevYear: y };
    }, [month, year]);



    const handleCopyPreviousMonth = async () => {
        if (!hasSelection) return;

        const { prevMonth, prevYear } = prevMonthYear;
        const label = `${MONTH_NAMES[prevMonth - 1]} ${prevYear}`;

        if (!window.confirm(
            `Copy attendance from ${label} into any blank days this month?\n\n` +
            `This will only fill days that don't already have a saved value — ` +
            `it will never overwrite existing entries or unsaved edits.`
        )) return;

        setCopyingPrevMonth(true);
        try {
            const CompanyID = sessionStorage.getItem('CompanyID');
            const params = { CompanyID, Month: prevMonth, Year: prevYear };
            if (filterMode === 'client') {
                params.ClientID = clientID;
                params.ProjectID = projectID || null;
            } else if (filterMode === 'supplier') {
    params.SupplierID = selectedSupplierID || null;
    params.ProjectID = selectedSupplierProjectID || null;
} else {
                params.CategoryID = selectedCategoryID;
                params.ProjectID = selectedCategoryProjectID || null;
            }

            const res = await api.get('/api/GetAttendanceAbstract', { params });
            const prevWorkers = res.data.workers || [];
            const prevByUser = Object.fromEntries(prevWorkers.map(w => [w.UserId, w.Days || {}]));

            let filled = 0;
            let skippedNoSource = 0;

            setEdits(prevEdits => {
                const next = { ...prevEdits };

                workers.forEach(w => {
                    const prevDays = prevByUser[w.UserId];
                    if (!prevDays) { skippedNoSource += 1; return; }

                    let offhiredHit = false; // local tracker for this worker, this pass

                    for (const day of days) {
                        if (offhiredHit) break;

                        const key = `${w.UserId}_${day}`;
                        const queuedVal = Object.prototype.hasOwnProperty.call(next, key) ? next[key] : undefined;
                        const existing = w.Days ? (w.Days[day] ?? w.Days[String(day)] ?? null) : null;
                        const effectiveVal = queuedVal !== undefined ? queuedVal : existing;

                        if (effectiveVal === 'Offhired') { offhiredHit = true; continue; }
                        if (queuedVal !== undefined) continue; // pending unsaved edit — don't touch

                        const iso = dateForDay(day);
                        if (w.StartDate && iso < w.StartDate) continue; // before-join
                        if (w.EndDate && iso > w.EndDate) continue;      // after-end

                        if (existing !== null && existing !== undefined) continue; // only fill blanks

                        const srcVal = prevDays[day] ?? prevDays[String(day)];
                        if (srcVal === undefined || srcVal === null) continue;

                        next[key] = srcVal;
                        filled += 1;
                        if (srcVal === 'Offhired') offhiredHit = true;
                    }
                });

                return next;
            });

            if (filled === 0) {
                toast.info(`No blank days could be filled from ${label} (either everything's already filled, or no matching data was found).`);
            } else {
                toast.success(`Filled ${filled} day${filled > 1 ? 's' : ''} from ${label}. Review the highlighted cells, then Save.`);
            }
            if (skippedNoSource > 0) {
                toast.info(`${skippedNoSource} worker(s) had no attendance record in ${label} (e.g. new joiners) — left unchanged.`);
            }
        } catch {
            toast.error(`Failed to load ${label}'s attendance for copying.`);
        } finally {
            setCopyingPrevMonth(false);
        }
    };


    const showRateColumns = filterMode === 'supplier' || filterMode === 'category';
    const extraColCount = 4 + dayCount + (showRateColumns ? 2 : 0); // was 5 + ...
    const statCard = (label, value, color) => (
        <div className="col-6 col-md" key={label}>
            <div className="p-3 h-100" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#a0aec0', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color, marginTop: '4px' }}>{value}</div>
            </div>
        </div>
    );

    if (!canView) {
        return (
            <div className="page-wrapper" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: 24 }}>
                <div className="alert alert-danger">You do not have permission to view Attendance Dashboard.</div>
            </div>
        );
    }

    return (
        <div className="page-wrapper" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            <div className="page-body mt-1">
                <div className="container-fluid px-4">
                    <ToastContainer position="top-center" autoClose={3000} />

                    {/ * ── Header ── * /}
                    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '0px', overflow: 'hidden' }}>
                        <div className="card-body p-4">
                            <h2 className="mb-3" style={{ fontWeight: '600', color: '#2d3748', fontSize: '28px' }}>
                                <FaCalendarAlt className="me-2" style={{ color: primaryColor }} />
                                Attendance Dashboard
                            </h2>

                            {/ * ── Filter bar ── * /}
                            <div className="row g-3 align-items-end">
                                <div className="col-md-3">
                                    <label className="form-label fw-medium mb-2">Filter By</label>
                                    <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: `1.5px solid ${primaryColor}`, height: '42px' }}>
                                        <button type="button" onClick={() => handleFilterModeChange('client')}
                                            style={{
                                                flex: 1, fontSize: '12px', fontWeight: '600', border: 'none', cursor: 'pointer',
                                                background: filterMode === 'client' ? primaryColor : '#fff',
                                                color: filterMode === 'client' ? '#fff' : primaryColor
                                            }}>
                                            Client
                                        </button>
                                        <button type="button" onClick={() => handleFilterModeChange('supplier')}
                                            style={{
                                                flex: 1, fontSize: '12px', fontWeight: '600', border: 'none', cursor: 'pointer',
                                                background: filterMode === 'supplier' ? primaryColor : '#fff',
                                                color: filterMode === 'supplier' ? '#fff' : primaryColor
                                            }}>
                                            Supplier
                                        </button>
                                        <button type="button" onClick={() => handleFilterModeChange('category')}
                                            style={{
                                                flex: 1, fontSize: '12px', fontWeight: '600', border: 'none', cursor: 'pointer',
                                                background: filterMode === 'category' ? primaryColor : '#fff',
                                                color: filterMode === 'category' ? '#fff' : primaryColor
                                            }}>
                                            Category
                                        </button>
                                    </div>
                                </div>

                                {filterMode === 'client' ? (
                                    <>
                                        <div className="col-md-3">
                                            <label className="form-label fw-medium mb-2">Client <span className="text-danger">*</span></label>
                                            <select
                                                className="form-select"
                                                value={clientID}
                                                onChange={handleClientChange}
                                                disabled={loadingClients}
                                                style={{ height: '42px' }}
                                            >
                                                <option value="">{loadingClients ? 'Loading clients...' : '— Select Client —'}</option>
                                                {clientList.map(c => (
                                                    <option key={c.AccountID} value={c.AccountID}>{c.AccountName}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-md-3">
                                            <label className="form-label fw-medium mb-2">
                                                Project <span className="badge ms-1" style={{ background: '#e2e8f0', color: '#718096', fontSize: '10px' }}>Optional</span>
                                            </label>
                                            <select
                                                className="form-select"
                                                value={projectID}
                                                onChange={handleProjectChange}
                                                disabled={!clientID || loadingProjects}
                                                style={{ height: '42px', background: !clientID ? '#f7f7f7' : '#fff' }}
                                            >
                                                <option value="">
                                                    {!clientID ? '— Select a client first —' : loadingProjects ? 'Loading projects...' : 'All Projects (entire client)'}
                                                </option>
                                                {projectOptions.map(p => (
                                                    <option key={p.UnitID} value={p.UnitID}>{p.UnitName}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                ) : filterMode === 'supplier' ? (
    <>
        <div className="col-md-3">
            <label className="form-label fw-medium mb-2">
                Project <span className="badge ms-1" style={{ background: '#e2e8f0', color: '#718096', fontSize: '10px' }}>Optional</span>
            </label>
            <select
                className="form-select"
                value={selectedSupplierProjectID}
                onChange={handleSupplierProjectChange}
                disabled={loadingAllProjects || loadingSupplierProjects}
                style={{ height: '42px' }}
            >
                <option value="">
                    {selectedSupplierID
                        ? (loadingSupplierProjects ? 'Loading projects...' : 'All Projects (entire supplier)')
                        : (loadingAllProjects ? 'Loading projects...' : 'All Projects')}
                </option>
                {(selectedSupplierID ? (projectsBySupplier[selectedSupplierID] || []) : allProjectsList).map(p => (
                    <option key={p.UnitID} value={p.UnitID}>{p.UnitName}</option>
                ))}
            </select>
        </div>

        <div className="col-md-4">
    <label className="form-label fw-medium mb-2">
        Supplier <span className="badge ms-1" style={{ background: '#e2e8f0', color: '#718096', fontSize: '10px' }}>Optional</span>
    </label>
    <select
        className="form-select"
        value={selectedSupplierID}
        onChange={handleSupplierSelectChange}
        disabled={loadingSuppliers || loadingProjectSuppliers}
        style={{ height: '42px' }}
    >
        <option value="">
            {loadingProjectSuppliers
                ? 'Loading suppliers for this project...'
                : loadingSuppliers
                    ? 'Loading suppliers...'
                    : '— Select Supplier —'}
        </option>
        {(selectedSupplierProjectID ? projectSuppliersList : supplierList).map(s => (
            <option key={s.AccountID} value={s.AccountID}>{s.AccountName}</option>
        ))}
    </select>
</div>
         <div className="col-md-2">
            <label className="form-label fw-medium mb-2">List By</label>
            <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: `1.5px solid ${primaryColor}`, height: '42px' }}>
                <button type="button" onClick={() => setIdDisplayMode('haven')}
                    style={{
                        flex: 1, fontSize: '12px', fontWeight: '600', border: 'none', cursor: 'pointer',
                        background: idDisplayMode === 'haven' ? primaryColor : '#fff',
                        color: idDisplayMode === 'haven' ? '#fff' : primaryColor
                    }}>
                    Haven ID
                </button>
                <button type="button" onClick={() => setIdDisplayMode('badge')}
                    style={{
                        flex: 1, fontSize: '12px', fontWeight: '600', border: 'none', cursor: 'pointer',
                        background: idDisplayMode === 'badge' ? primaryColor : '#fff',
                        color: idDisplayMode === 'badge' ? '#fff' : primaryColor
                    }}>
                    Badge No.
                </button>
            </div>
        </div>
    </>
                                ) : (<>
                                    <div className="col-md-4">
                                        <label className="form-label fw-medium mb-2">Category <span className="text-danger">*</span></label>
                                        <select
                                            className="form-select"
                                            value={selectedCategoryID}
                                            onChange={handleCategorySelectChange}
                                            disabled={loadingCategories}
                                            style={{ height: '42px' }}
                                        >
                                            <option value="">{loadingCategories ? 'Loading categories...' : '— Select Category —'}</option>
                                            {categoryList.map(c => (
                                                <option key={c.CategoryID} value={c.CategoryID}>{c.CategoryName}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-md-3">
                                        <label className="form-label fw-medium mb-2">
                                            Project <span className="badge ms-1" style={{ background: '#e2e8f0', color: '#718096', fontSize: '10px' }}>Optional</span>
                                        </label>
                                        <select
                                            className="form-select"
                                            value={selectedCategoryProjectID}
                                            onChange={handleCategoryProjectChange}
                                            disabled={!selectedCategoryID || loadingCategoryProjects}
                                            style={{ height: '42px', background: !selectedCategoryID ? '#f7f7f7' : '#fff' }}
                                        >
                                            <option value="">
                                                {!selectedCategoryID ? '— Select a category first —' : loadingCategoryProjects ? 'Loading projects...' : 'All Projects (entire category)'}
                                            </option>
                                            {(projectsByCategory[selectedCategoryID] || []).map(p => (
                                                <option key={p.UnitID} value={p.UnitID}>{p.UnitName}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>)}

                                <div className="col-md-2">
                                    <label className="form-label fw-medium mb-2">Month</label>
                                    <input
                                        type="month"
                                        className="form-control"
                                        value={monthValue}
                                        onChange={handleMonthChange}
                                        style={{ height: '42px' }}
                                    />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label fw-medium mb-2">Trade</label>
                                    <select
                                        className="form-select"
                                        value={tradeFilter}
                                        onChange={(e) => setTradeFilter(e.target.value)}
                                        disabled={workers.length === 0}
                                        style={{ height: '42px' }}
                                    >
                                        {trades.map(t => <option key={t} value={t}>{t === 'All' ? 'All Trades' : t}</option>)}
                                    </select>
                                </div>

                                {filterMode === 'client' && (
                                    <div className="col-md-2">
                                        <label className="form-label fw-medium mb-2">Supplier</label>
                                        <select
                                            className="form-select"
                                            value={supplierFilter}
                                            onChange={(e) => setSupplierFilter(e.target.value)}
                                            disabled={workers.length === 0}
                                            style={{ height: '42px' }}
                                        >
                                            <option value="All">All Suppliers</option>
                                            {suppliers.filter(s => s !== 'All').map(name => (
                                                <option key={name} value={name}>{name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="col-md-2">
                                    <label className="form-label fw-medium mb-2">Search</label>
                                    <div className="input-group" style={{ height: '42px' }}>
                                        <span className="input-group-text text-white" style={{ backgroundColor: primaryColor }}>
                                            <FaSearch />
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Name or ID"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            disabled={workers.length === 0}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/ * ── Empty state: nothing selected yet ── * /}
                    {!hasSelection && (
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '0px' }}>
                            <div className="card-body text-center py-5">
                                <FaBuilding className="mb-3" style={{ fontSize: '48px', color: '#cbd5e0' }} />
                                <p className="text-muted mb-0">
                                    {filterMode === 'client'
                                        ? `Select a client above to view the attendance sheet for ${MONTH_NAMES[month - 1]} ${year}.`
                                        : filterMode === 'supplier'
                                            ? `Select a supplier above to view the attendance sheet for ${MONTH_NAMES[month - 1]} ${year}.`
                                            : `Select a category above to view the attendance sheet for ${MONTH_NAMES[month - 1]} ${year}.`}
                                </p>
                            </div>
                        </div>
                    )}

                    {/ * ── Loading state ── * /}
                    {hasSelection && loadingData && (
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '0px' }}>
                            <div className="card-body text-center py-5">
                                <div className="spinner-border" role="status" style={{ color: primaryColor }} />
                                <p className="mt-3 text-muted">
                                    Loading attendance for {filterMode === 'client' ? selectedClientName : filterMode === 'supplier' ? selectedSupplierName : selectedCategoryName}...
                                </p>
                            </div>
                        </div>
                    )}

                    {/ * ── Main content ── * /}
                    {hasSelection && !loadingData && (
                        <>
                            {/ * Stat cards * /}
                            <div className="row g-3 mb-3">
                                {statCard('Workers', stats.totalWorkers, primaryColor)}
                                {statCard('Total Hours', stats.totalHours.toLocaleString(), '#276749')}
                                {statCard('Absences', stats.absences, '#e53e3e')}
                                {statCard('Holidays', stats.holidays, '#805ad5')}
                                {statCard('Offhired Marks', stats.offhired, '#718096')}
                                {statCard('Sundays', stats.sundays, '#dd8b1f')}
                                {filterMode !== 'client' && statCard('Inductions', stats.inductions, '#0b7285')}

                            </div>

                            {/ * Documents panel * /}
                            <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                                <div className="card-body p-3">
                                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                                        <h6 className="mb-0" style={{ fontWeight: 700, color: '#2d3748' }}>
                                            <FaFolderOpen className="me-2" style={{ color: primaryColor }} />
                                            Documents — {MONTH_NAMES[month - 1]} {year}
                                            {documents.length > 0 && (
                                                <span style={{
                                                    marginLeft: 8, background: '#e2e8f0', color: '#4a5568',
                                                    fontSize: '11px', fontWeight: 700, borderRadius: '10px', padding: '2px 8px',
                                                }}>
                                                    {documents.length}
                                                </span>
                                            )}
                                        </h6>
                                        <button
                                            type="button"
                                            onClick={() => docFileInputRef.current?.click()}
                                            disabled={uploadingDoc}
                                            style={{
                                                background: primaryColor, color: '#fff', border: 'none',
                                                borderRadius: '6px', padding: '7px 14px', fontSize: '12.5px', fontWeight: 600,
                                                cursor: uploadingDoc ? 'not-allowed' : 'pointer', opacity: uploadingDoc ? 0.7 : 1,
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                            }}
                                        >
                                            {uploadingDoc
                                                ? <><FaSpinner className="fa-spin" /> Uploading...</>
                                                : <><FaUpload style={{ fontSize: '11px' }} /> Upload Document</>}
                                        </button>
                                        <input
                                            ref={docFileInputRef}
                                            type="file"
                                            multiple
                                            accept={ACCEPTED_EXT.join(',')}
                                            onChange={handleDocFileInput}
                                            style={{ display: 'none' }}
                                        />
                                    </div>

                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                        onDragLeave={() => setDragOver(false)}
                                        onDrop={handleDocDrop}
                                        onClick={() => docFileInputRef.current?.click()}
                                        style={{
                                            border: `1.5px dashed ${dragOver ? primaryColor : '#cbd5e0'}`,
                                            borderRadius: '8px', padding: '14px', textAlign: 'center',
                                            background: dragOver ? `${primaryColor}08` : '#fafbfc',
                                            cursor: 'pointer', marginBottom: documents.length > 0 || loadingDocs ? '14px' : 0,
                                        }}
                                    >
                                        <span style={{ fontSize: '12px', color: '#a0aec0' }}>
                                            Drag & drop files here, or click to browse — PDF, Word, Excel, or images, up to {MAX_FILE_MB}MB each
                                        </span>
                                    </div>

                                    {loadingDocs && (
                                        <div className="text-center py-3">
                                            <div className="spinner-border spinner-border-sm" style={{ color: primaryColor }} />
                                            <span className="ms-2 text-muted" style={{ fontSize: '13px' }}>Loading documents...</span>
                                        </div>
                                    )}

                                    {!loadingDocs && documents.length === 0 && (
                                        <p className="text-muted text-center mb-0" style={{ fontSize: '12.5px' }}>
                                            No documents uploaded for {MONTH_NAMES[month - 1]} {year} yet.
                                        </p>
                                    )}

                                    {!loadingDocs && documents.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                            {documents.map(doc => {
                                                const kind = kindOfDoc(doc);
                                                return (
                                                    <div key={doc.DocumentId} style={{
                                                        width: 96, border: '1px solid #e2e8f0', borderRadius: '8px',
                                                        overflow: 'hidden', background: '#fff', position: 'relative',
                                                    }}>
                                                        <div
                                                            onClick={() => setPreviewDoc(doc)}
                                                            title={doc.FileName}
                                                            style={{
                                                                height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                background: kind === 'image' ? '#f7f8fa' : '#f1f5f9',
                                                                cursor: 'pointer', fontSize: '26px',
                                                            }}
                                                        >
                                                            {kind === 'image'
    ? <img src={resolveDocUrl(doc.Url)} alt={doc.FileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    : docIcon(doc)}
                                                        </div>
                                                        <div style={{ padding: '5px 6px' }}>
                                                            <div style={{
                                                                fontSize: '10.5px', fontWeight: 600, color: '#4a5568',
                                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                            }} title={doc.FileName}>
                                                                {doc.FileName}
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteDoc(doc)}
                                                            title="Delete"
                                                            style={{
                                                                position: 'absolute', top: 4, right: 4,
                                                                width: 18, height: 18, borderRadius: '50%', border: 'none',
                                                                background: 'rgba(0,0,0,0.55)', color: '#fff',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                cursor: 'pointer', fontSize: '9px', lineHeight: 1,
                                                            }}
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/ * Preview modal * /}
                            {previewDoc && (
                                <div
                                    onClick={() => setPreviewDoc(null)}
                                    style={{
                                        position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        zIndex: 1050, padding: '24px',
                                    }}
                                >
                                    <div onClick={(e) => e.stopPropagation()} style={{
                                        background: '#fff', borderRadius: '10px', overflow: 'hidden',
                                        width: '100%', maxWidth: 720, maxHeight: '85vh',
                                        display: 'flex', flexDirection: 'column',
                                    }}>
                                        <div style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '10px 14px', borderBottom: '1px solid #edf0f4',
                                        }}>
                                            <span style={{ fontWeight: 600, fontSize: '13.5px', color: '#2d3748' }}>
                                                {previewDoc.FileName}
                                            </span>
                                            <div className="d-flex align-items-center gap-2">
                                                <a href={resolveDocUrl(previewDoc.Url)} download={previewDoc.FileName} title="Download" style={{ color: '#718096', fontSize: '14px' }}>
    <FaDownload />
</a>
                                                <button type="button" onClick={() => setPreviewDoc(null)}
                                                    style={{ background: 'none', border: 'none', color: '#718096', fontSize: '16px', cursor: 'pointer' }}>
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ flex: 1, overflow: 'auto', background: '#f7f8fa' }}>
                                            {kindOfDoc(previewDoc) === 'image' && (
    <img src={resolveDocUrl(previewDoc.Url)} alt={previewDoc.FileName} style={{ width: '100%', height: 'auto', display: 'block' }} />
)}
                                           {kindOfDoc(previewDoc) === 'pdf' && (
    <iframe src={resolveDocUrl(previewDoc.Url)} title={previewDoc.FileName} style={{ width: '100%', height: '75vh', border: 'none' }} />
)}
                                            {kindOfDoc(previewDoc) !== 'image' && kindOfDoc(previewDoc) !== 'pdf' && (
                                                <div className="text-center py-5">
                                                    <div style={{ fontSize: '40px', marginBottom: 12 }}>{docIcon(previewDoc)}</div>
                                                    <p className="text-muted mb-3" style={{ fontSize: '13px' }}>Preview isn't available for this file type.</p>
                                                    <a href={resolveDocUrl(previewDoc.Url)} download={previewDoc.FileName} style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: primaryColor, color: '#fff', borderRadius: 6,
    padding: '8px 16px', fontSize: '13px', fontWeight: 600, textDecoration: 'none',
}}>
    <FaDownload style={{ fontSize: 11 }} /> Download to view
</a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/ * Toolbar: legend + save/discard * /}
                            <div className="d-flex justify-content-end align-items-center flex-wrap gap-2 mb-2">
    <div className="d-flex align-items-center gap-2">
        {dirtyCount > 0 && (
            <span style={{
                background: '#fef3c7', color: '#92400e', fontSize: '12px', fontWeight: '700',
                borderRadius: '20px', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px'
            }}>
                <FaExclamationTriangle style={{ fontSize: '11px' }} />
                {dirtyBreakdown.inserts > 0 && `${dirtyBreakdown.inserts} new`}
                {dirtyBreakdown.inserts > 0 && dirtyBreakdown.updates > 0 && ' · '}
                {dirtyBreakdown.updates > 0 && `${dirtyBreakdown.updates} updated`}
            </span>
        )}
        <button type="button" onClick={handleExportExcel} disabled={filteredWorkers.length === 0 || exportingExcel} title="Export to Excel"
            style={{
                background: 'none', border: '1.5px solid #9ae6b4', color: '#276749',
                borderRadius: '6px', padding: '8px 10px', cursor: (filteredWorkers.length === 0 || exportingExcel) ? 'not-allowed' : 'pointer',
                opacity: (filteredWorkers.length === 0 || exportingExcel) ? 0.5 : 1,
                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600,
            }}>
            {exportingExcel ? <FaSpinner className="fa-spin" style={{ fontSize: '12px' }} /> : <FaExportExcel style={{ fontSize: '12px' }} />} Excel
        </button>
        <button type="button" onClick={handleExportPdf} disabled={filteredWorkers.length === 0 || exportingPdf} title="Export to PDF"
            style={{
                background: 'none', border: '1.5px solid #feb2b2', color: '#c53030',
                borderRadius: '6px', padding: '8px 10px', cursor: (filteredWorkers.length === 0 || exportingPdf) ? 'not-allowed' : 'pointer',
                opacity: (filteredWorkers.length === 0 || exportingPdf) ? 0.5 : 1,
                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600,
            }}>
            {exportingPdf ? <FaSpinner className="fa-spin" style={{ fontSize: '12px' }} /> : <FaExportPdf style={{ fontSize: '12px' }} />} PDF
        </button>
        <button type="button" onClick={handleSendAttendanceEmail} disabled={filteredWorkers.length === 0 || sendingEmail} title="Email this attendance sheet"
            style={{
                background: 'none', border: '1.5px solid #90cdf4', color: '#2b6cb0',
                borderRadius: '6px', padding: '8px 10px',
                cursor: (filteredWorkers.length === 0 || sendingEmail) ? 'not-allowed' : 'pointer',
                opacity: (filteredWorkers.length === 0 || sendingEmail) ? 0.5 : 1,
                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600,
            }}>
            {sendingEmail ? <FaSpinner className="fa-spin" style={{ fontSize: '12px' }} /> : <FaEnvelope style={{ fontSize: '12px' }} />} Email
        </button>
        <button type="button" onClick={fetchAttendance} title="Refresh"
            style={{
                background: 'none', border: '1.5px solid #e2e8f0', color: '#718096',
                borderRadius: '6px', padding: '8px 10px', cursor: 'pointer',
                display: 'flex', alignItems: 'center'
            }}>
            <FaSync style={{ fontSize: '12px' }} />
        </button>
        <button type="button" onClick={handleDiscard} disabled={dirtyCount === 0}
            style={{
                background: 'none', border: '1.5px solid #feb2b2', color: '#e53e3e',
                borderRadius: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: '600',
                cursor: dirtyCount === 0 ? 'not-allowed' : 'pointer', opacity: dirtyCount === 0 ? 0.5 : 1,
                display: 'flex', alignItems: 'center', gap: '6px'
            }}>
            <FaUndo style={{ fontSize: '11px' }} /> Discard
        </button>
        <button type="button" onClick={handleCopyPreviousMonth} disabled={copyingPrevMonth || workers.length === 0}
            title={`Copy blank days from ${MONTH_NAMES[prevMonthYear.prevMonth - 1]} ${prevMonthYear.prevYear}`}
            style={{
                background: 'none', border: '1.5px solid #90cdf4', color: '#2b6cb0',
                borderRadius: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: '600',
                cursor: (copyingPrevMonth || workers.length === 0) ? 'not-allowed' : 'pointer',
                opacity: workers.length === 0 ? 0.5 : 1,
                display: 'flex', alignItems: 'center', gap: '6px'
            }}>
            {copyingPrevMonth
                ? <><span className="spinner-border spinner-border-sm" style={{ width: '11px', height: '11px', borderWidth: '2px' }} /> Copying...</>
                : <><FaCalendarAlt style={{ fontSize: '11px' }} /> Copy {MONTH_NAMES[prevMonthYear.prevMonth - 1].slice(0, 3)}</>}
        </button>
        <button type="button" onClick={handleSaveChanges} disabled={dirtyCount === 0 || saving}
            style={{
                background: dirtyCount === 0 ? '#e2e8f0' : primaryColor,
                color: dirtyCount === 0 ? '#a0aec0' : '#fff', border: 'none',
                borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: '600',
                cursor: dirtyCount === 0 || saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px'
            }}>
            {saving
                ? <><span className="spinner-border spinner-border-sm" style={{ width: '11px', height: '11px', borderWidth: '2px' }} /> Saving...</>
                : <><FaSave style={{ fontSize: '11px' }} /> Save Changes</>}
        </button>
    </div>
</div>
{filterMode === 'supplier' && selectedSupplierProjectCode && (
    <div className="d-flex justify-content-end mb-2">
        <span style={{
            background: '#eef1f7', color: primaryColor, fontSize: '12.5px', fontWeight: 700,
            borderRadius: '6px', padding: '6px 12px', border: `1px solid ${primaryColor}30`,
        }}>
            Project Code: {selectedSupplierProjectCode}
        </span>
    </div>
)}

{/ * Sign-off: Prepared → Verified → Approved, each stage gated on the one before it * /}
<div className="card border-0 shadow-sm mb-3" style={{ borderRadius: '10px', overflow: 'hidden' }}>
    <div className="card-body p-3">
        <h6 className="mb-3" style={{ fontWeight: 700, color: '#2d3748' }}>
            Sign-off — {MONTH_NAMES[month - 1]} {year}
        </h6>
        <div className="d-flex flex-wrap gap-3">
            {[
                {
                    key: 'Prepared',
                    label: 'Prepared',
                    endpoint: '/api/MarkAttendancePrepared',
                    doneBy: signOff?.PreparedByName,
                    doneAt: signOff?.PreparedAt,
                    enabled: true, // first stage, always available
                    color: '#2b6cb0',
                },
                {
                    key: 'Verified',
                    label: 'Verified',
                    endpoint: '/api/MarkAttendanceVerified',
                    doneBy: signOff?.VerifiedByName,
                    doneAt: signOff?.VerifiedAt,
                    enabled: !!signOff?.PreparedBy,
                    disabledReason: 'Mark Prepared first',
                    color: '#805ad5',
                },
                {
                    key: 'Approved',
                    label: 'Approved',
                    endpoint: '/api/MarkAttendanceApproved',
                    doneBy: signOff?.ApprovedByName,
                    doneAt: signOff?.ApprovedAt,
                    enabled: !!signOff?.VerifiedBy,
                    disabledReason: 'Mark Verified first',
                    color: '#276749',
                },
            ].map((stage) => {
                const isDone = !!stage.doneBy;
                const canClick = stage.enabled && !isDone && !signOffActionLoading && isCurrentUserApprover;
                return (
                    <div
                        key={stage.key}
                        style={{
                            flex: '1 1 220px', minWidth: 200,
                            border: `1.5px solid ${isDone ? '#9ae6b4' : '#e2e8f0'}`,
                            borderRadius: '8px', padding: '12px 14px',
                            background: isDone ? '#f0fff4' : '#fff',
                        }}
                    >
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span style={{ fontWeight: 700, fontSize: '13px', color: stage.color }}>
                                {stage.label}
                            </span>
                            {isDone && (
                                <span style={{
                                    background: '#c6f6d5', color: '#276749', fontSize: '10px',
                                    fontWeight: 700, borderRadius: '20px', padding: '2px 8px',
                                }}>
                                    Done
                                </span>
                            )}
                        </div>

                        {isDone ? (
                            <div style={{ fontSize: '12px', color: '#4a5568' }}>
                                By <strong>{stage.doneBy}</strong>
                                {stage.doneAt && (
                                    <div style={{ fontSize: '11px', color: '#a0aec0', marginTop: '2px' }}>
                                        {new Date(stage.doneAt).toLocaleString(undefined, {
                                            day: '2-digit', month: 'short', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit',
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => callSignOff(stage.endpoint)}
                                disabled={!canClick}
                                title={!isCurrentUserApprover ? 'Only designated Task Management approvers can mark this.' : !stage.enabled ? stage.disabledReason : ''}
                                style={{
                                    width: '100%', border: `1.5px solid ${stage.color}`,
                                    background: 'none', color: stage.color,
                                    borderRadius: '6px', padding: '7px 10px', fontSize: '12.5px', fontWeight: 600,
                                    cursor: canClick ? 'pointer' : 'not-allowed',
                                    opacity: stage.enabled ? 1 : 0.45,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                }}
                            >
                                {signOffActionLoading
                                    ? <span className="spinner-border spinner-border-sm" style={{ width: 11, height: 11, borderWidth: 2 }} />
                                    : `Mark ${stage.label}`}
                            </button>
                        )}
                        {!isDone && (!stage.enabled || !isCurrentUserApprover) && (
    <div style={{ fontSize: '10.5px', color: '#a0aec0', marginTop: '5px' }}>
        {!isCurrentUserApprover ? 'You are not a designated approver.' : stage.disabledReason}
    </div>
)}
                    </div>
                );
            })}
        </div>
    </div>
</div>





                            {/ * Attendance grid * /}
                            <div className="card border-0 shadow-sm" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12.5px', minWidth: 1000 }}>
                                       <thead>
    <tr style={{ background: '#1d2433' }}>
        <Th sticky style={{ left: 0, minWidth: 90 }}>
            <FaLock style={{ fontSize: '9px', marginRight: 4, opacity: 0.6 }} />
            {isBadgeMode ? 'Badge No.' : 'Emp ID'}
        </Th>
        <Th sticky style={{ left: 90, minWidth: 190 }}>Name</Th>
        <Th style={{ minWidth: 120 }}>Trade</Th>
        

        {days.map(d => (
            <Th key={d} style={{ minWidth: 34, textAlign: 'center', padding: '6px 2px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <span style={{
                        color: isSunday(year, month, d) ? '#f6ad55' : undefined,
                        fontWeight: isSunday(year, month, d) ? 800 : 700,
                    }}>
                        {d}
                    </span>
                    {isSunday(year, month, d) && (
                        <span style={{ fontSize: '8px', fontWeight: 700, color: '#f6ad55' }}>S</span>
                    )}
                    <button
                        type="button"
                        title={`Mark all as Holiday for day ${d}`}
                        onClick={() => handleMarkDayHoliday(d)}
                        style={{ background: 'none', border: 'none', color: '#805ad5', cursor: 'pointer', padding: 0, fontSize: '9px', lineHeight: 1, opacity: 0.7 }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                        onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
                    >
                        <FaCalendarAlt />
                    </button>
                </div>
            </Th>
        ))}

        <Th style={{ minWidth: 70, textAlign: 'center' }}>Total</Th>
        {showRateColumns && (
            <>
                <Th style={{ minWidth: 70, textAlign: 'center' }}>Rate</Th>
                <Th style={{ minWidth: 90, textAlign: 'center' }}>Amount</Th>
            </>
        )}
    </tr>
</thead>
                                        <tbody>
                                            {filteredWorkers.length === 0 && (
                                                <tr>
                                                    <td colSpan={extraColCount} className="text-center p-5">
                                                        <FaUsers className="mb-2" style={{ fontSize: '32px', color: '#cbd5e0' }} />
                                                        <p className="text-muted mb-0">No workers match the current filters.</p>
                                                    </td>
                                                </tr>
                                            )}
                                            {filteredWorkers.map((w, rowIdx) => (
                                                <tr key={w.UserId} style={{ background: rowIdx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                                                    <Td sticky style={{ left: 0, color: '#718096', whiteSpace: 'nowrap' }}>
    {isBadgeMode ? (w.BadgeNo || '—') : `HAV/${w.UserId}`}
</Td>
                                                    <Td sticky style={{ left: 90, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                        {fullName(w)}
                                                        {w.ProjectName && (
                                                            <div style={{ fontSize: '10px', fontWeight: 400, color: '#a0aec0' }}>{w.ProjectName}</div>
                                                        )}
                                                    </Td>
                                                    <Td style={{ whiteSpace: 'nowrap' }}>
                                                        {w.RoleName
                                                            ? <span style={{
                                                                background: `${primaryColor}12`, color: primaryColor,
                                                                fontSize: '11px', fontWeight: '600', borderRadius: '6px', padding: '2px 8px'
                                                            }}>{w.RoleName}</span>
                                                            : <span style={{ color: '#cbd5e0' }}>—</span>}
                                                    </Td>
                                                   
                                                    {days.map(day => {
                                                        const isActive = activeCell && activeCell.userId === w.UserId && activeCell.day === day;
                                                        const locked = isDayLocked(w, day);
                                                        const value = cellValue(w, day);
                                                        const style = cellStyleFor(value);
                                                        const key = `${w.UserId}_${day}`;
                                                        const wasEdited = Object.prototype.hasOwnProperty.call(edits, key);

                                                        return (
                                                            <td
                                                                key={day}
                                                                onClick={() => !isActive && startEdit(w, day)}
                                                                title={locked === 'before-join' ? 'Before allocation start date'
                                                                    : locked === 'after-end' ? 'After allocation end date'
                                                                        : locked === 'offhired' ? 'Offhired earlier this month' : ''}
                                                                style={{
                                                                    textAlign: 'center', padding: '4px 2px',
                                                                    borderBottom: '1px solid #edf0f4',
                                                                    cursor: locked ? 'not-allowed' : 'pointer',
                                                                    background: locked ? '#f7f8fa' : 'transparent',
                                                                }}
                                                            >
                                                                {isActive ? (
                                                                    <input
                                                                        ref={inputRef}
                                                                        value={draft}
                                                                        onChange={(e) => setDraft(e.target.value)}
                                                                        onBlur={() => commitEdit(w, day, false)}
                                                                        onKeyDown={(e) => {
                                                                            const el = e.currentTarget;
                                                                            if (e.key === 'Enter') { e.preventDefault(); commitEdit(w, day, { rowOffset: 0, dayOffset: 1 }); }
                                                                            else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
                                                                            else if (e.key === 'Tab') { e.preventDefault(); commitEdit(w, day, { rowOffset: 0, dayOffset: 1 }); }
                                                                            else if (e.key === 'ArrowRight' && el.selectionStart === el.value.length) {
                                                                                e.preventDefault(); commitEdit(w, day, { rowOffset: 0, dayOffset: 1 });
                                                                            }
                                                                            else if (e.key === 'ArrowLeft' && el.selectionStart === 0) {
                                                                                e.preventDefault(); commitEdit(w, day, { rowOffset: 0, dayOffset: -1 });
                                                                            }
                                                                            else if (e.key === 'ArrowDown') { e.preventDefault(); commitEdit(w, day, { rowOffset: 1, dayOffset: 0 }); }
                                                                            else if (e.key === 'ArrowUp') { e.preventDefault(); commitEdit(w, day, { rowOffset: -1, dayOffset: 0 }); }
                                                                        }}
                                                                        style={{
                                                                            width: 30, height: 24, textAlign: 'center', fontSize: '11.5px',
                                                                            border: `1.5px solid ${primaryColor}`, borderRadius: 4, outline: 'none'
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <span
                                                                        style={{
                                                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                                            width: 24, height: 22, borderRadius: 5,
                                                                            background: style.bg, color: style.fg,
                                                                            fontWeight: 600, fontSize: '10.5px',
                                                                            border: wasEdited ? '1.5px solid #f6ad55' : 'none',
                                                                            opacity: locked ? 0.5 : 1, position: 'relative'
                                                                        }}
                                                                    >
                                                                        {locked ? <FaLock style={{ fontSize: '8px' }} /> : cellDisplay(value) || '·'}
                                                                    </span>
                                                                )}
                                                            </td>
                                                        );
                                                    })}

                                                    <Td style={{ textAlign: 'center', fontWeight: 800, color: primaryColor }}>
                                                        {workerTotal(w)}
                                                    </Td>
                                                    {showRateColumns && (
                                                        <>
                                                            <Td style={{ textAlign: 'center', color: '#718096' }}>
                                                                {Number(w.WorkerRate || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </Td>
                                                            <Td style={{ textAlign: 'center', fontWeight: 800, color: '#276749' }}>
                                                                {workerSalary(w).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </Td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                        {filteredWorkers.length > 0 && (
                                            <tfoot>
                                                <tr style={{ background: '#eef1f7', borderTop: `2px solid ${primaryColor}` }}>
                                                    <td colSpan={3}  style={{
                                                        padding: '10px 8px', fontWeight: 800, fontSize: '13px',
                                                        color: '#2d3748', position: 'sticky', left: 0, background: '#eef1f7',
                                                    }}>
                                                        Grand Total
                                                    </td>
                                                    {days.map(d => (
    <td key={d} style={{
        padding: '10px 2px', textAlign: 'center',
        fontWeight: 700, fontSize: '11px', color: primaryColor,
    }}>
        {dayTotals[d] || ''}
    </td>
))}
                                                    <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 800, color: primaryColor }}>
                                                        {grandTotals.totalHours}
                                                    </td>
                                                    {showRateColumns && (
                                                        <>
                                                            <td style={{ padding: '10px 8px' }} />
                                                            <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 800, color: '#276749' }}>
                                                                {grandTotals.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            </tfoot>
                                        )}

                                    </table>
                                </div>
                            </div>

                            <div className="d-flex align-items-center gap-3 flex-wrap mt-3" style={{ fontSize: '12px', color: '#718096' }}>
    <LegendDot bg="#f0fff4" fg="#276749" label="Hours worked" />
    <LegendDot bg="#fff5f5" fg="#e53e3e" label="Absent (A)" />
    <LegendDot bg="#f5f0ff" fg="#805ad5" label="Holiday (H)" />
    <LegendDot bg="#f1f2f4" fg="#718096" label="Offhired" />
    <LegendDot bg="#fff8ec" fg="#dd8b1f" label="Sunday (S)" />
    {filterMode !== 'client' && <LegendDot bg="#e6f7ff" fg="#0b7285" label="Induction (I)" />}
    <span className="d-flex align-items-center gap-1">
        <FaLock style={{ fontSize: '10px' }} /> Locked (outside allocation)
    </span>
</div>

<div className="d-flex align-items-center gap-2 mt-2" style={{ fontSize: '11.5px', color: '#a0aec0' }}>
    <FaInfoCircle />
    Emp ID, Name, Trade, and Supplier are read-only worker records. Click a day cell to edit it — enter hours (0–24),
    <strong> A</strong> for Absent, <strong>H</strong> for Holiday, <strong>S</strong> for Sunday, <strong>I</strong> for Induction, or <strong>OFF</strong> for Offhired.
    A blank day that gets a value is saved as a new record; a day with an existing value is updated.
    Press Enter to save and move to the next day, Escape to cancel.
    Use the small calendar icon in a day's header to mark that day as Holiday for every visible worker at once.
</div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Small presentational helpers ──
function LegendDot({ bg, fg, label }) {
    return (
        <span className="d-flex align-items-center gap-1">
            <span style={{
                width: 14, height: 14, borderRadius: 4, background: bg,
                border: `1px solid ${fg}30`, display: 'inline-block'
            }} />
            {label}
        </span>
    );
}

function Th({ children, sticky, style }) {
    return (
        <th style={{
            position: sticky ? 'sticky' : 'static',
            left: sticky ? style?.left ?? 0 : undefined,
            zIndex: sticky ? 3 : 2,
            background: '#1d2433', color: '#f5f6f8',
            padding: '10px 8px', fontSize: '11px', fontWeight: 700,
            whiteSpace: 'nowrap', ...style,
        }}>
            {children}
        </th>
    );
}

function Td({ children, sticky, style }) {
    return (
        <td style={{
            position: sticky ? 'sticky' : 'static',
            left: sticky ? style?.left ?? 0 : undefined,
            zIndex: sticky ? 1 : 0,
            background: sticky ? (style?.background || 'inherit') : undefined,
            padding: '8px 8px', borderBottom: '1px solid #edf0f4', fontSize: '12.5px',
            ...style,
        }}>
            {children}
        </td>
    );
}

export default AttendanceDashboard;
*/

import React from 'react';
const AttendanceDashboard = () => null;
export default AttendanceDashboard;
