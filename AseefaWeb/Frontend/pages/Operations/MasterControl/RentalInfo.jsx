import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../apiService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Plus, Trash2, Save, RotateCcw, Check, ExternalLink,
  CreditCard, Banknote, FileCheck, Calendar, Paperclip,
  AlertCircle, ShieldCheck, Edit3, X
} from 'lucide-react';
import XLSX from 'xlsx-js-style';
import JSZip from 'jszip';
import {
  FaSearch, FaPlus, FaUser, FaSave, FaEdit,
  FaTrashAlt, FaEraser, FaArrowLeft, FaCamera,
  FaFileAlt, FaTimesCircle, FaFileExcel, FaHome, FaMoneyBillWave,
  FaCheckCircle, FaExclamationTriangle,
} from 'react-icons/fa';

const primaryColor = 'rgb(45, 75, 169)';
const PAYMENT_MODES = ['Cash', 'Online Transaction', 'Cheque'];
const parsePaymentModes = (value) => {
  const modes = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  return [...new Set(modes
    .filter((mode) => typeof mode === 'string')
    .map((mode) => mode.trim())
    .filter((mode) => PAYMENT_MODES.includes(mode)))];
};

const fullName = (i) =>
  [i.Name, i.MName, i.LName].filter(Boolean).join(' ').trim() || 'Unknown Tenant';

const firstPositiveAmount = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue;
    const amount = Number(value);
    if (Number.isFinite(amount) && amount > 0) return amount;
  }
  const zeroAmount = values.find(
    (value) => value !== null && value !== undefined && value !== '' && Number(value) === 0
  );
  return zeroAmount ?? '';
};

const toDateInputValue = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val.substring(0, 10);
  const d = new Date(val);
  return isNaN(d.getTime()) ? '' : d.toISOString().substring(0, 10);
};

const formatEIDInput = (value) => {
  const digits = value.replace(/\D/g, '').substring(0, 15);
  let out = '';
  if (digits.length > 0) out += digits.substring(0, 3);
  if (digits.length > 3) out += '-' + digits.substring(3, 7);
  if (digits.length > 7) out += '-' + digits.substring(7, 14);
  if (digits.length > 14) out += '-' + digits.substring(14, 15);
  return out;
};
const isValidEID = (v) => /^784-\d{4}-\d{7}-\d$/.test(v || '');

const money = (value) => {
  const n = Number(value) || 0;
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

function useDebounce(value, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

// ─── Row ────────────────────────────────────────────────────────────
const RentalRow = React.memo(function RentalRow({ item, isSelected, onRowClick, primaryColor }) {
  const statusLabel = item.RentalStatus || item.Status || item.AllocationStatus || '';
  const isOccupied = statusLabel === 'Occupied' || statusLabel === 'Active' || statusLabel === 'onhire' || statusLabel === 1 || statusLabel === '1';
  const isVacated = statusLabel === 'Vacated' || statusLabel === 'Completed' || statusLabel === 'Terminated';
  const isVacant = statusLabel === 'Vacant';
  const isExpired = statusLabel === 'offhire' || statusLabel === 0 || statusLabel === '0' || statusLabel === 'Expired';

  return (
    <tr onClick={() => onRowClick(item)}
      style={{ cursor: 'pointer', borderLeft: isSelected ? `4px solid ${primaryColor}` : '4px solid transparent' }}
      className="align-middle">
      <td className="py-3 px-4" style={{ fontSize: 13, fontWeight: 500, color: '#4a5568' }}>
        {item.FlatNo || '—'}
      </td>
      <td className="py-3 px-4" style={{ fontSize: 13, color: '#4a5568' }}>
        {item.FlatType ? (
          <span style={{
            background: '#ebf8ff', color: '#2b6cb0', fontSize: 12, fontWeight: 600,
            borderRadius: 4, padding: '2px 8px'
          }}>{item.FlatType}</span>
        ) : '—'}
      </td>
      <td className="py-3 px-4">
        <div style={{ fontWeight: 600, fontSize: 13, color: '#2d3748' }}>{fullName(item)}</div>
        <div style={{ fontSize: 11, color: '#a0aec0' }}>{item.Email || ''}</div>
      </td>
      <td className="py-3 px-4" style={{ fontSize: 13, color: '#4a5568' }}>
        {item.PropertyName || item.BranchName || '—'}
      </td>
      <td className="py-3 px-4" style={{ fontSize: 13, color: '#4a5568', fontWeight: 600 }}>
        {money(item.RentalAmount ?? item.WorkerRate)}
      </td>
      <td className="py-3 px-4">
        {isOccupied ? (
          <span style={{ background: '#c6f6d5', color: '#276749', fontSize: 11, fontWeight: 700,
            borderRadius: 20, padding: '3px 10px' }}>{statusLabel === 'Active' ? 'Active' : 'Occupied'}</span>
        ) : isVacated ? (
          <span style={{ background: '#e2e8f0', color: '#334155', fontSize: 11, fontWeight: 700,
            borderRadius: 20, padding: '3px 10px' }}>{statusLabel}</span>
        ) : isVacant ? (
          <span style={{ background: '#feebc8', color: '#c05621', fontSize: 11, fontWeight: 700,
            borderRadius: 20, padding: '3px 10px' }}>Vacant</span>
        ) : isExpired ? (
          <span style={{ background: '#fed7d7', color: '#9b2c2c', fontSize: 11, fontWeight: 700,
            borderRadius: 20, padding: '3px 10px' }}>Expired</span>
        ) : <span style={{ color: '#a0aec0', fontSize: 12 }}>—</span>}
      </td>
    </tr>
  );
});

// ─── Main ──────────────────────────────────────────────────────────
function RentalInfo() {
  const [loading, setLoading] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProperty, setFilterProperty] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('tenant');

  const [userData, setUserData] = useState([]);
  const [roleList, setRoleList] = useState([]);
  const [companyList, setCompanyList] = useState([]);
  const [propertyList, setPropertyList] = useState([]);
  const [recordList, setRecordList] = useState([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [tradeForm, setTradeForm] = useState({ RoleID: 0, RoleName: '' });
  const [editingTradeID, setEditingTradeID] = useState(null);
  const [savingTrade, setSavingTrade] = useState(false);
  const [tradeError, setTradeError] = useState('');

  // ── Unified Transaction State ────────────────────────────────
  const [chequeList, setChequeList] = useState([]);
  const [chequesLoading, setChequesLoading] = useState(false);
  const [savingCheque, setSavingCheque] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  
  const [transactions, setTransactions] = useState([
    { id: Date.now(), type: 'Cheque', amount: '', date: '', file: null, path: null }
  ]);

  const getNextSequenceForType = (type, currentTransactions, existingList, currentRowId, isExisting) => {
    const rawType = (type || 'Cheque').trim();
    const canonicalType = rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();
    const typeKey = canonicalType.toLowerCase();

    // If this row is an existing saved transaction and its type hasn't changed, keep its original sequence/label
    if (isExisting) {
      const match = (existingList || []).find(c => c.TransactionID === currentRowId);
      if (match && ((match.TransactionType || '').trim().toLowerCase()) === typeKey) {
        return {
          sequence: match.Sequence || 1,
          label: match.Label || (canonicalType + " " + (match.Sequence || 1)),
          canonicalType,
        };
      }
    }

    // 1. Existing saved transactions for this type (excluding this row if it was already saved)
    const existingForType = (existingList || []).filter(
      c => c.TransactionID !== currentRowId && ((c.TransactionType || '').trim().toLowerCase()) === typeKey
    );

    const baseSeq = existingForType.reduce((max, c) => {
      const s = Number(c.Sequence) || 0;
      return s > max ? s : max;
    }, existingForType.length);

    // 2. Count new rows before/at this row with the same type
    let newIndex = 0;
    for (const t of (currentTransactions || [])) {
      const tTypeKey = ((t.type || 'Cheque').trim().toLowerCase());
      if (tTypeKey === typeKey) {
        newIndex++;
        if (t.id === currentRowId) break;
      }
    }

    const sequence = baseSeq + (newIndex > 0 ? newIndex : 1);
    return {
      sequence,
      label: canonicalType + " " + sequence,
      canonicalType,
    };
  };

  const handleSelectTransaction = (c) => {
    if (!c || !c.TransactionID) return;

    setSelectedTransactionId(c.TransactionID);

    let formattedDate = '';
    if (c.TransactionDate) {
      formattedDate = String(c.TransactionDate).slice(0, 10);
    }

    setTransactions([
      {
        id: c.TransactionID,
        TransactionID: c.TransactionID,
        type: c.TransactionType || 'Cheque',
        amount: c.Amount != null ? String(c.Amount) : '',
        date: formattedDate,
        file: null, // do not assign file path directly to file input
        path: c.Path || null, // preserve existing file path
        sequence: c.Sequence,
        label: c.Label || (canonicalTypeFormat(c.TransactionType) + " " + (c.Sequence || 1)),
      }
    ]);
  };

  const canonicalTypeFormat = (t) => {
    const raw = (t || 'Cheque').trim();
    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  };

  const getTypeFieldWidth = (type) => {
    const norm = (type || '').trim().toLowerCase();
    if (norm === 'cash') return '76px';
    if (norm === 'cheque') return '88px';
    if (norm === 'tenancy') return '98px';
    return `${Math.max(76, (type || '').length * 8 + 42)}px`;
  };

  const getAmountFieldWidth = (val) => {
    const str = (val !== null && val !== undefined && val !== '') ? String(val).trim() : '';
    const len = str.length > 0 ? str.length : 4;
    return `${Math.max(88, 88 + Math.max(0, len - 4) * 8)}px`;
  };

  const handleClearTransactionSelection = () => {
    setSelectedTransactionId(null);
    setTransactions([
      { id: Date.now(), type: 'Cheque', amount: '', date: '', file: null, path: null }
    ]);
  };

  const addTransactionRow = () => {
    setTransactions(prev => [
      ...prev, 
      { id: Date.now(), type: 'Cheque', amount: '', date: '', file: null, path: null }
    ]);
  };

  const removeTransactionRow = (id) => {
    if (selectedTransactionId) {
      handleClearTransactionSelection();
      return;
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const updateTransactionRow = (id, field, value) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const canView = true;
  const canAdd = true;
  const canEdit = true;
  const canDelete = true;
  const canExport = true;

  const [user, setUser] = useState({
    UserId: 0,
    PropertyID: '',
    RecordID: '',
    FlatNo: '',
    FlatType: '',
    RentalAmount: '',
    Name: '', MName: '', LName: '', Sex: '',
    Mobile: '', Email: '',
    image: null, CompanyID: '', BranchID: '', UserRoleId: '',
    BadgeNo: '', EIDNo: '', EIDExpiryDate: '', PaymentMode: [],
    RentalStatus: 'Occupied',
    LeaseStartDate: '',
    LeaseEndDate: '',
    RentalID: 0,
  });
  const [flatAvailability, setFlatAvailability] = useState(null);

  const isEditing = user.UserId !== 0;
  const debouncedSearch = useDebounce(searchTerm, 200);

  const TABS = [
    { key: 'tenant',  label: 'Tenant Info', icon: <FaUser /> },
    { key: 'cheques', label: 'Cheques',     icon: <FaMoneyBillWave /> },
  ];

  useEffect(() => {
    const CompanyID = sessionStorage.getItem('CompanyID');
    if (CompanyID === '1') {
      setIsSuperAdmin(true);
      fetchCompanies();
    }
    fetchRoles(CompanyID);
    fetchProperties(CompanyID);
    fetchRentals(CompanyID);
    // eslint-disable-next-line
  }, []);

  const fetchCompanies = async () => {
    try { const r = await api.get('/api/Webgetcompanywisename'); setCompanyList(r.data || []); }
    catch { toast.error('Failed to load companies'); }
  };

  const fetchRoles = async (cid) => {
    try {
      const r = await api.get('/api/GetRoleList', { params: { CompanyID: cid } });
      const roles = r.data || [];
      setRoleList(roles);
      const renter = roles.find((role) => (role.RoleName || '').trim().toLowerCase() === 'renter');
      if (renter) {
        setUser((prev) => ({
          ...prev,
          UserRoleId: prev.UserRoleId || renter.RoleID,
        }));
      }
    }
    catch { toast.error('Failed to load roles'); }
  };

  const fetchProperties = useCallback(async (cid) => {
    if (!cid) return;
    try {
      const r = await api.get('/api/getPropertyInfo', { params: { CompanyID: cid } });
      setPropertyList(r.data?.data || []);
    } catch { toast.error('Failed to load properties'); }
  }, []);

  const fetchRentals = async (cid) => {
    try {
      setLoading(true);
      const CompanyID = cid || sessionStorage.getItem('CompanyID');
      const [uRes, pRes] = await Promise.all([
        api.get('/api/GetUsermaster', { params: { CompanyID } }),
        api.get('/api/getPropertyInfo', { params: { CompanyID } })
      ]);
      const rows = Array.isArray(uRes.data) ? uRes.data : (uRes.data?.data || []);
      const properties = pRes.data?.data || [];
      setPropertyList(properties);

      const propMap = new Map();
      properties.forEach((p) => propMap.set(Number(p.PropertyID), p.PropertyName));

      const [masters, rentals] = await Promise.all([
        Promise.all(properties.map((p) =>
          api.get('/api/getPropertyMaster', { params: { CompanyID, PropertyID: p.PropertyID } })
            .then((r) => ({ propId: p.PropertyID, list: r.data?.data || [] }))
            .catch(() => ({ propId: p.PropertyID, list: [] }))
        )),
        Promise.all(properties.map((p) =>
          api.get('/api/getPropertyRental', { params: { CompanyID, PropertyID: p.PropertyID } })
            .then((r) => ({ propId: p.PropertyID, list: r.data?.data || [] }))
            .catch(() => ({ propId: p.PropertyID, list: [] }))
        ))
      ]);

      const recordMap = new Map();
      masters.forEach((m) => {
        (m.list || []).forEach((item) => {
          recordMap.set(`${m.propId}_${item.RecordID}`, item);
        });
      });

      const rentalByIDMap = new Map();
      const latestRentalByRecordMap = new Map();
      rentals.forEach((r) => {
        (r.list || []).forEach((item) => {
          if (item.RentalID) rentalByIDMap.set(Number(item.RentalID), item);
          const key = `${r.propId}_${item.RecordID}`;
          if (!latestRentalByRecordMap.has(key)) {
            latestRentalByRecordMap.set(key, item);
          }
        });
      });

      const enriched = rows.map((u) => {
        const propId = Number(u.PropertyID);
        const recId = Number(u.RecordID);
        const master = recordMap.get(`${propId}_${recId}`) || {};
        const rental = (u.RentalID && rentalByIDMap.get(Number(u.RentalID)))
          || latestRentalByRecordMap.get(`${propId}_${recId}`)
          || {};

        const effectiveStatus = rental.RentalStatus || u.Status || u.AllocationStatus || (master.IsActive ? 'Active' : '') || '';

        return {
          ...u,
          PropertyName: propMap.get(propId) || u.PropertyName || u.BranchName || '',
          FlatNo: u.FlatNo || master.FlatNo || '',
          FlatType: u.FlatType || master.FlatType || '',
          // Only trust the lease link stored on this tenant. The rental found
          // by unit could belong to a different tenant and must not be excluded.
          RentalID: u.RentalID || 0,
          RentalAmount: firstPositiveAmount(
            u.RentalAmount,
            rental.MonthlyRent,
            master.RentalAmount,
            u.WorkerRate,
            rental.AnnualRent,
          ),
          MonthlyRent: rental.MonthlyRent ?? null,
          AnnualRent: rental.AnnualRent ?? null,
          RentalStatus: rental.RentalStatus || effectiveStatus,
          Status: effectiveStatus,
          LeaseStartDate: rental.LeaseStartDate || null,
          LeaseEndDate: rental.LeaseEndDate || null,
        };
      });

      setUserData(enriched);
    } catch (err) {
      console.error('Failed to fetch rentals:', err);
      toast.error('Failed to fetch rentals');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecordsByProperty = useCallback(async (propertyID) => {
    if (!propertyID) { setRecordList([]); return; }
    try {
      setLoadingRecords(true);
      const CompanyID = sessionStorage.getItem('CompanyID');
      const r = await api.get('/api/getPropertyMaster', {
        params: { CompanyID, PropertyID: propertyID },
      });
      setRecordList(r.data?.success ? (r.data.data || []) : (r.data?.data || []));
    } catch {
      toast.error('Failed to load records');
      setRecordList([]);
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  const fetchCheques = useCallback(async (rentID) => {
    if (!rentID) { setChequeList([]); return; }
    try {
      setChequesLoading(true);
      const CompanyID = sessionStorage.getItem('CompanyID');
      const r = await api.get('/api/getRentalTransactions', {
        params: { RentID: rentID, CompanyID, PropertyID: user.PropertyID },
      });
      setChequeList(r.data?.transactions || []);
    } catch {
      toast.error('Failed to load transactions');
      setChequeList([]);
    } finally {
      setChequesLoading(false);
    }
  }, [user.PropertyID]);

  useEffect(() => {
    if (showForm && user.UserId) {
      fetchCheques(user.UserId);
    } else {
      setChequeList([]);
    }
  }, [showForm, user.UserId, fetchCheques]);

  useEffect(() => {
    if (showForm && user.PropertyID) {
      fetchRecordsByProperty(user.PropertyID);
    } else {
      setRecordList([]);
    }
  }, [showForm, user.PropertyID, fetchRecordsByProperty]);

  useEffect(() => {
    if (!user.RecordID) return;
    const rec = recordList.find((x) => String(x.RecordID) === String(user.RecordID));
    if (!rec) return;
    setUser((p) => ({
      ...p,
      FlatNo: rec.FlatNo || p.FlatNo,
      FlatType: rec.FlatType || p.FlatType,
      RentalAmount: firstPositiveAmount(
        p.RentalAmount,
        rec.RentalAmount,
        p.MonthlyRent,
        p.WorkerRate,
      ),
    }));
  }, [user.RecordID, recordList]);

  useEffect(() => {
    if (!showForm || !user.PropertyID || !user.RecordID) return undefined;
    let active = true;
    const loadUnitRentalAmount = async () => {
      try {
        const CompanyID = isSuperAdmin
          ? user.CompanyID
          : sessionStorage.getItem('CompanyID');
        if (!CompanyID) return;
        const response = await api.get('/api/getPropertyRental', {
          params: {
            CompanyID,
            PropertyID: user.PropertyID,
            RecordID: user.RecordID,
          },
        });
        if (!active) return;
        const contracts = response.data?.data || response.data?.recordset || [];
        const contract = contracts.find(
          (item) => String(item.RecordID) === String(user.RecordID),
        );
        if (!contract) return;
        const contractAmount = firstPositiveAmount(
          contract.MonthlyRent,
          contract.AnnualRent,
        );
        if (contractAmount === '') return;
        setUser((current) => ({
          ...current,
          MonthlyRent: contract.MonthlyRent ?? '',
          RentalAmount: firstPositiveAmount(
            current.RentalAmount,
            contract.MonthlyRent,
            contract.AnnualRent,
          ),
        }));
      } catch (error) {
        console.error('Failed to load unit rental amount:', error);
      }
    };
    loadUnitRentalAmount();
    return () => {
      active = false;
    };
  }, [showForm, user.PropertyID, user.RecordID, user.CompanyID, isSuperAdmin]);

  const handleRowClick = useCallback(async (item) => {
    if (!canView) return toast.error('No permission to view.');

    let imageData = null;
    const raw = item.IMAGE ?? item.image;
    if (raw && typeof raw === 'object' && raw.type === 'Buffer') {
      const bytes = new Uint8Array(raw.data);
      let bin = '';
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      imageData = `data:image/jpeg;base64,${btoa(bin)}`;
    } else if (typeof raw === 'string' && raw.length) {
      imageData = raw.includes('base64,') ? raw : `data:image/jpeg;base64,${raw}`;
    }

    setCurrentImage(imageData);
    setUser({
      UserId: item.UserId || 0,
      PropertyID: item.PropertyID ? String(item.PropertyID) : '',
      RecordID: item.RecordID ? String(item.RecordID) : '',
      FlatNo: item.FlatNo || '',
      FlatType: item.FlatType || '',
      RentalAmount: firstPositiveAmount(
        item.RentalAmount,
        item.MonthlyRent,
        item.WorkerRate,
        item.AnnualRent,
      ),
      MonthlyRent: item.MonthlyRent ?? '',
      Name: item.Name || '', MName: item.MName || '', LName: item.LName || '',
      Sex: item.Sex != null ? item.Sex.toString() : '',
      Mobile: item.Mobile || '', Email: item.Email || '',
      image: imageData,
      CompanyID: item.CompanyID || '',
      BranchID: item.BranchId || item.BranchID || '',
      UserRoleId: item.UserRoleId || (roleList.find((r) => (r.RoleName || '').trim().toLowerCase() === 'renter')?.RoleID || 46),
      BadgeNo: item.BadgeNo || '',
      EIDNo: item.EIDNo || '',
      EIDExpiryDate: toDateInputValue(item.EIDExpiryDate),
      PaymentMode: parsePaymentModes(item.PaymentMode ?? item.paymentMode),
      RentalStatus: item.RentalStatus || item.Status || 'Occupied',
      LeaseStartDate: toDateInputValue(item.LeaseStartDate),
      LeaseEndDate: toDateInputValue(item.LeaseEndDate),
      RentalID: item.RentalID || 0,
    });
    setPreviewImage(null);
    setShowForm(true);
    setActiveTab('tenant');
  }, [canView]);

  const validateFields = () => {
    const err = {};
    if (!user.PropertyID) err.PropertyID = 'Property is required';
    if (!user.RecordID) err.RecordID = 'Flat / Record is required';
    if (!user.Name?.trim()) err.Name = 'First Name is required';
    if (!user.Mobile?.trim()) err.Mobile = 'Mobile is required';
    if (String(user.RentalStatus || '').trim().toLowerCase() === 'occupied' && !user.LeaseStartDate) {
      err.LeaseStartDate = 'Lease start date is required for an occupied rental';
    }
    if (user.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.Email)) err.Email = 'Valid Email required';
    if (user.EIDNo?.trim() && !isValidEID(user.EIDNo)) {
      err.EIDNo = 'EID format 784-XXXX-XXXXXXX-X';
    }
    if (isSuperAdmin && !user.CompanyID) err.CompanyID = 'Company is required';
    return err;
  };

  const buildPayload = (base) => {
    const renter = roleList.find((r) => (r.RoleName || '').trim().toLowerCase() === 'renter');
    const finalRoleId = user.UserRoleId || (renter ? renter.RoleID : 46);

    return {
      ...base,
      UserId: user.UserId || 0,
      UserID: Number(sessionStorage.getItem('UserId')) || 0,
      PropertyID: user.PropertyID ? parseInt(user.PropertyID) : null,
      RecordID: user.RecordID ? parseInt(user.RecordID) : null,
      FlatNo: user.FlatNo?.trim() || null,
      FlatType: user.FlatType?.trim() || null,
      RentalAmount: user.RentalAmount !== '' && user.RentalAmount != null
        ? parseFloat(user.RentalAmount) : null,
      Name: user.Name?.trim(),
      MName: user.MName?.trim() || null,
      LName: user.LName?.trim() || null,
      Sex: user.Sex !== '' ? parseInt(user.Sex) : null,
      EIDNo: user.EIDNo?.trim() || null,
      EIDExpiryDate: user.EIDExpiryDate || null,
      Email: user.Email?.trim() || null,
      Mobile: user.Mobile?.trim() || null,
      UserRoleId: finalRoleId ? parseInt(finalRoleId) : 46,
      BadgeNo: user.BadgeNo?.trim() || null,
      PaymentMode: user.PaymentMode.length > 0 ? user.PaymentMode.join(',') : null,
      image: user.image || null,
      RentalStatus: user.RentalStatus || 'Occupied',
      LeaseStartDate: user.LeaseStartDate || null,
      LeaseEndDate: user.LeaseEndDate || null,
      RentalID: user.RentalID || 0,
    };
  };

  const requestFlatAvailability = async () => {
    const finalCompanyID = isSuperAdmin ? user.CompanyID : sessionStorage.getItem('CompanyID');
    if (!finalCompanyID || !user.PropertyID || !user.RecordID) {
      throw new Error('Company, property, and unit are required to verify availability.');
    }

    const response = await api.get('/api/checkFlatAvailability', {
      params: {
        CompanyID: finalCompanyID,
        PropertyID: user.PropertyID,
        RecordID: user.RecordID,
        RentalID: user.RentalID || undefined,
        UserId: user.UserId || undefined,
        LeaseStartDate: user.LeaseStartDate || undefined,
        LeaseEndDate: user.LeaseEndDate || undefined,
      },
    });
    const availability = response.data;
    if (availability?.success !== true || typeof availability.available !== 'boolean') {
      throw new Error(availability?.message || 'The unit availability check returned an invalid response.');
    }
    if (/not found/i.test(availability.message || '')) {
      throw new Error('The selected unit could not be found. Refresh the unit list and try again.');
    }
    return availability;
  };

  const ensureFlatAvailable = async () => {
    setFlatAvailability({ checking: true });
    try {
      const availability = await requestFlatAvailability();
      setFlatAvailability(availability);
      if (!availability.available || availability.isOccupied) {
        return availability.message || 'This unit is not available for the selected dates.';
      }
      return '';
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Availability could not be verified.';
      setFlatAvailability({ failed: true, message });
      return `Unable to verify unit availability. Save blocked. ${message}`;
    }
  };

    // ── Create ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canAdd) return toast.error('No permission to create.');
    const err = validateFields();
    setFieldErrors(err);
    if (Object.keys(err).length) return toast.error('Please fill all mandatory fields');

    try {
      setLoadingSubmit(true);
      const availabilityError = await ensureFlatAvailable();
      if (availabilityError) return toast.error(availabilityError);
      const finalCompanyID = isSuperAdmin ? user.CompanyID : sessionStorage.getItem('CompanyID');
      if (!finalCompanyID) return toast.error('Company is required');
      const payload = buildPayload({
        CompanyID: parseInt(finalCompanyID),
        BranchID: user.BranchID ? parseInt(user.BranchID) : null,
        CreatedBy: sessionStorage.getItem('UserId'),
        CreatedDate: new Date().toISOString(),
      });
      const res = await api.post('/api/InsertUpdateUser', payload);
      if (res.data?.success) {
        toast.success(`Tenant and lease saved${res.data.RentalID ? ` (Rental #${res.data.RentalID})` : ''}`);
        fetchRentals(finalCompanyID);
        resetForm();
        setShowForm(false);
      } else toast.error(res.data?.message || 'Operation failed');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Request failed');
    } finally {
      setLoadingSubmit(false);
    }
  };

  // ── Update ────────────────────────────────────────────────────
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!canEdit) return toast.error('No permission to update.');
    const err = validateFields();
    setFieldErrors(err);
    if (Object.keys(err).length) return toast.error('Please fill all mandatory fields');
    try {
      setLoadingUpdate(true);
      const availabilityError = await ensureFlatAvailable();
      if (availabilityError) return toast.error(availabilityError);
      const finalCompanyID = isSuperAdmin ? user.CompanyID : sessionStorage.getItem('CompanyID');
      const payload = buildPayload({
        CompanyID: parseInt(finalCompanyID),
        BranchID: user.BranchID ? parseInt(user.BranchID) : null,
        ModifiedBy: sessionStorage.getItem('UserId'),
        ModifiedDate: new Date().toISOString(),
      });
      if (!payload.image || typeof payload.image !== 'string') delete payload.image;
      const res = await api.post('/api/InsertUpdateUser', payload);
      if (res.data?.success) {
        toast.success(`Tenant and lease updated${res.data.RentalID ? ` (Rental #${res.data.RentalID})` : ''}`);
        fetchRentals(finalCompanyID);
        resetForm();
        setShowForm(false);
      } else toast.error(res.data?.message || 'Update failed');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed');
    } finally {
      setLoadingUpdate(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!canDelete) return toast.error('No permission to delete.');
    if (!user.UserId) return toast.error('No record selected');
    if (!window.confirm('Delete this rental record?')) return;
    try {
      setLoadingDelete(true);
      const res = await api.post('/api/Deleteusers', {
        UserId: user.UserId,
        deletedBy: parseInt(sessionStorage.getItem('UserId'), 10),
      });
      if (res.data?.success) {
        toast.success('Rental deleted');
        fetchRentals(user.CompanyID || sessionStorage.getItem('CompanyID'));
        resetForm();
        setShowForm(false);
      } else toast.error(res.data?.message || 'Delete failed');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    } finally {
      setLoadingDelete(false);
    }
  };

  // ── Transaction Handlers ─────────────────────────────────────
  const handleSaveTransactions = async () => {
    if (!user.UserId) return toast.error('Save the rental first');
    if (!user.PropertyID) return toast.error('Property is required');

    const validRows = transactions.filter(t => Number(t.amount) > 0);
    if (validRows.length === 0) return toast.error('Add at least one transaction with an amount');

    try {
      setSavingCheque(true);
      const CompanyID = sessionStorage.getItem('CompanyID');
      const UserID = sessionStorage.getItem('UserId');

      const fd = new FormData();
      fd.append("CompanyID", CompanyID);
      fd.append("PropertyID", user.PropertyID);
      fd.append("RentID", user.UserId);
      fd.append("UserID", UserID);
      fd.append("TransactionsJson", JSON.stringify(
        validRows.map((t) => {
          const isExisting = !!(t.TransactionID && Number(t.TransactionID) > 0);
          const seqInfo = getNextSequenceForType(t.type, validRows, chequeList, t.id, isExisting);
          return {
            RowId: String(t.id),
            TransactionID: t.TransactionID || 0,
            TransactionType: seqInfo.canonicalType,
            Sequence: seqInfo.sequence,
            Label: seqInfo.label,
            Amount: parseFloat(t.amount) || 0,
            TransactionDate: t.date || null,
            ExistingPath: t.path || null,
          };
        })
      ));
      
      validRows.forEach(t => {
        if (t.file instanceof File) fd.append(`file_${t.id}`, t.file);
      });

      const res = await api.post('/api/saveRentalTransactions', fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        toast.success(selectedTransactionId ? 'Transaction updated successfully' : 'Transactions saved successfully');
        handleClearTransactionSelection();
        await fetchCheques(user.UserId);
      } else {
        toast.error(res.data?.message || 'Failed to save');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save transactions');
    } finally {
      setSavingCheque(false);
    }
  };

  const handleDeleteTransaction = async (c) => {
    if (!window.confirm(`Delete transaction ${c.Label || ''}?`)) return;
    try {
      const res = await api.post('/api/deleteRentalTransaction', {
        TransactionID: c.TransactionID,
        UserID: sessionStorage.getItem('UserId'),
      });
      if (res.data?.success) {
        toast.success('Transaction deleted');
        if (selectedTransactionId === c.TransactionID) {
          handleClearTransactionSelection();
        }
        await fetchCheques(user.UserId);
      } else {
        toast.error(res.data?.message || 'Failed to delete');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete');
    }
  };

  // ── Trade management ──────────────────────────────────────────
  const handleSaveTrade = async () => {
    const name = tradeForm.RoleName?.trim();
    if (!name) { setTradeError('Trade name is required'); return; }
    setTradeError('');
    try {
      setSavingTrade(true);
      const payload = {
        RoleID: tradeForm.RoleID || 0,
        RoleName: name,
        CreatedBy: tradeForm.RoleID ? null : sessionStorage.getItem('UserId'),
        ModifiedBy: tradeForm.RoleID ? sessionStorage.getItem('UserId') : null,
      };
      const res = await api.post('/api/InsertUpdateRole', payload);
      if (res.data.success) {
        toast.success(tradeForm.RoleID ? 'Trade updated' : 'Trade created');
        setTradeForm({ RoleID: 0, RoleName: '' });
        setEditingTradeID(null);
        await fetchRoles(sessionStorage.getItem('CompanyID'));
      } else toast.error(res.data.message || 'Failed to save trade');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save trade');
    } finally {
      setSavingTrade(false);
    }
  };

  const handleEditTrade = (role) => {
    setTradeForm({ RoleID: role.RoleID, RoleName: role.RoleName || '' });
    setEditingTradeID(role.RoleID);
    setTradeError('');
  };
  const handleCancelEditTrade = () => {
    setTradeForm({ RoleID: 0, RoleName: '' });
    setEditingTradeID(null);
    setTradeError('');
  };
  const handleDeleteTrade = async (role) => {
    if (!window.confirm(`Delete trade "${role.RoleName}"?`)) return;
    try {
      const res = await api.post('/api/DeleteRole', {
        RoleID: role.RoleID,
        DeletedBy: parseInt(sessionStorage.getItem('UserId'), 10),
      });
      if (res.data.success) {
        toast.success('Trade deleted');
        await fetchRoles(sessionStorage.getItem('CompanyID'));
      } else toast.error(res.data.message || 'Failed to delete trade');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete trade');
    }
  };


  // ── Dynamic flat availability check ────────────────────────────
  useEffect(() => {
    if (!showForm || activeTab !== 'tenant') return;
    if (!user.PropertyID || (!user.RecordID && !user.FlatNo?.trim())) {
      setFlatAvailability(null);
      return;
    }

    let isMounted = true;
    const finalCompanyID = isSuperAdmin ? user.CompanyID : sessionStorage.getItem('CompanyID');
    if (!finalCompanyID) {
      setFlatAvailability({ failed: true, message: 'Company is required to verify unit availability.' });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setFlatAvailability({ checking: true });
        const res = await api.get('/api/checkFlatAvailability', {
          params: {
            CompanyID: finalCompanyID,
            PropertyID: user.PropertyID,
            RecordID: user.RecordID || undefined,
            FlatNo: user.FlatNo?.trim() || undefined,
            RentalID: user.RentalID || undefined,
            UserId: user.UserId || undefined,
            LeaseStartDate: user.LeaseStartDate || undefined,
            LeaseEndDate: user.LeaseEndDate || undefined,
          }
        });
        if (isMounted && res.data) {
          setFlatAvailability(res.data);
        } else if (isMounted) {
          setFlatAvailability({ failed: true, message: 'The unit availability check returned no result.' });
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error checking flat availability:', err);
          setFlatAvailability({ failed: true, message: err.response?.data?.message || err.message || 'Unable to verify unit availability.' });
        }
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [showForm, activeTab, user.PropertyID, user.RecordID, user.FlatNo, user.LeaseStartDate, user.LeaseEndDate, user.UserId, user.RentalID, isSuperAdmin, user.CompanyID]);

  // ── Reset ─────────────────────────────────────────────────────
  const resetForm = () => {
    const renter = roleList.find((r) => (r.RoleName || '').trim().toLowerCase() === 'renter');
    setUser({
      UserId: 0,
      PropertyID: '', RecordID: '',
      FlatNo: '', FlatType: '', RentalAmount: '',
      Name: '', MName: '', LName: '', Sex: '',
      Mobile: '', Email: '',
      image: null, CompanyID: '', BranchID: '',
      UserRoleId: renter ? renter.RoleID : 46,
      BadgeNo: '', EIDNo: '', EIDExpiryDate: '', PaymentMode: [],
      RentalStatus: 'Occupied',
      LeaseStartDate: '',
      LeaseEndDate: '',
      RentalID: 0,
    });
    setFlatAvailability(null);
    setRecordList([]);
    setPreviewImage(null);
    setFieldErrors({});
    setTradeForm({ RoleID: 0, RoleName: '' });
    setEditingTradeID(null);
    setTradeError('');
    setTransactions([{ id: Date.now(), type: 'Cheque', amount: '', date: '', file: null, path: null }]);
    setChequeList([]);
    setSelectedTransactionId(null);
  };

  const handleCreateNew = () => {
    if (!canAdd) return toast.error('No permission to create.');
    resetForm();
    setShowForm(true);
    setActiveTab('tenant');
  };
  const handleCreateTrade = () => {
    if (!canAdd) return toast.error('No permission to create.');
    resetForm();
    setShowForm(true);
    setActiveTab('trades');
  };
  const handleBackToList = () => { setShowForm(false); resetForm(); };
  const handleClear = () => resetForm();

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === 'Mobile' && !/^\d*$/.test(value)) return;
    setUser((p) => ({ ...p, [name]: value }));
  }, []);
  const handleEIDChange = useCallback(
    (e) => setUser((p) => ({ ...p, EIDNo: formatEIDInput(e.target.value) })),
    []
  );
  const handlePaymentModeChange = (mode) => {
    setUser((prev) => {
      const selectedModes = parsePaymentModes(prev.PaymentMode);
      if (mode === 'Both') {
        const hasBothModes = selectedModes.includes('Cash') && selectedModes.includes('Cheque');
        return {
          ...prev,
          PaymentMode: hasBothModes
            ? selectedModes.filter((selected) => selected !== 'Cash' && selected !== 'Cheque')
            : [...new Set([...selectedModes, 'Cash', 'Cheque'])],
        };
      }

      return {
        ...prev,
        PaymentMode: selectedModes.includes(mode)
          ? selectedModes.filter((selected) => selected !== mode)
          : [...selectedModes, mode],
      };
    });
  };
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 300 * 1024) return toast.error('Image must be under 300 KB');
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
      setUser((p) => ({ ...p, image: reader.result }));
    };
    reader.readAsDataURL(f);
  };

  // ── Filter + Export ───────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    const term = debouncedSearch.toLowerCase().trim();
    let base = !term ? userData : userData.filter((i) =>
      i.Name?.toLowerCase().includes(term) ||
      i.Email?.toLowerCase().includes(term) ||
      i.Mobile?.includes(debouncedSearch) ||
      i.FlatNo?.toLowerCase().includes(term) ||
      i.FlatType?.toLowerCase().includes(term) ||
      i.PropertyName?.toLowerCase().includes(term)
    );
    if (filterProperty) base = base.filter((i) => String(i.PropertyID) === String(filterProperty));
    if (filterStatus) base = base.filter((i) => {
      const s = i.RentalStatus || i.Status || i.AllocationStatus || '';
      const isOcc = s === 'onhire' || s === 1 || s === '1' || s === 'Active' || s === 'Occupied' || (!s && i.Name);
      const isVacated = s === 'Vacated' || s === 'Completed' || s === 'Terminated';
      const isVac = s === 'Vacant';
      const isExp = s === 'offhire' || s === 0 || s === '0' || s === 'Expired';
      if (filterStatus === 'active') return isOcc;
      if (filterStatus === 'vacated') return isVacated;
      if (filterStatus === 'vacant') return isVac;
      if (filterStatus === 'expired') return isExp;
      return true;
    });
    return [...base].sort((a, b) => Number(b.UserId) - Number(a.UserId));
  }, [userData, debouncedSearch, filterStatus, filterProperty]);

  const handleExportExcel = useCallback(async () => {
    if (!canExport) return toast.error('No permission to export.');
    if (!filteredUsers.length) return toast.info('No data to export.');

    try {
      const columns = [
        { header: 'Tenant', minWidth: 28, align: 'left', wrap: true },
        { header: 'Flat No', minWidth: 14, align: 'center', wrap: false },
        { header: 'Flat Type', minWidth: 16, align: 'center', wrap: false },
        { header: 'Property', minWidth: 28, align: 'left', wrap: true },
        { header: 'Email', minWidth: 30, align: 'left', wrap: false },
        { header: 'Mobile', minWidth: 18, align: 'center', wrap: false },
        { header: 'Rent Amount', minWidth: 18, align: 'right', wrap: false },
        { header: 'Status', minWidth: 16, align: 'center', wrap: false },
      ];

      const headers = columns.map((c) => c.header);
      const rows = filteredUsers.map((u) => {
        const rentNum = Number(u.RentalAmount ?? u.WorkerRate) || 0;
        const statusStr = (u.RentalStatus === 'Vacated' || u.Status === 'Vacated')
          ? 'Vacated'
          : (u.RentalStatus === 'Completed' || u.Status === 'Completed')
          ? 'Completed'
          : (u.AllocationStatus === 'onhire' || u.Status === 'Active' || u.Status === 'Occupied' || u.RentalStatus === 'Occupied')
          ? (u.RentalStatus === 'Occupied' || u.Status === 'Occupied' ? 'Occupied' : 'Active')
          : (u.Status === 'Vacant' || u.RentalStatus === 'Vacant') ? 'Vacant'
          : (u.AllocationStatus === 'offhire' || u.Status === 'Expired') ? 'Expired'
          : (u.RentalStatus || u.Status || '—');

        return [
          fullName(u),
          u.FlatNo || '',
          u.FlatType || '',
          u.PropertyName || u.BranchName || '',
          u.Email || '',
          u.Mobile ? String(u.Mobile) : '',
          rentNum,
          statusStr,
        ];
      });

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

      // Calculate auto-fit column widths with specified minimum widths
      ws['!cols'] = columns.map((col, colIdx) => {
        let maxLen = col.minWidth;
        for (const r of [headers, ...rows]) {
          const val = r[colIdx];
          let len = 0;
          if (colIdx === 6 && typeof val === 'number') {
            len = val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).length;
          } else {
            len = val != null ? String(val).length : 0;
          }
          if (len + 3 > maxLen) {
            maxLen = len + 3;
          }
        }
        return { wch: maxLen };
      });

      // Row heights: Header 30pt, data rows 22pt
      ws['!rows'] = [
        { hpt: 30 },
        ...rows.map(() => ({ hpt: 22 })),
      ];

      // Header styling: Dark blue background (#1F3864), bold white font, centered, bordered
      const headerStyle = {
        font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1F3864' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: '475569' } },
          bottom: { style: 'medium', color: { rgb: '0F172A' } },
          left: { style: 'thin', color: { rgb: '475569' } },
          right: { style: 'thin', color: { rgb: '475569' } },
        },
      };

      const thinBorder = {
        top: { style: 'thin', color: { rgb: 'E2E8F0' } },
        bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
        left: { style: 'thin', color: { rgb: 'E2E8F0' } },
        right: { style: 'thin', color: { rgb: 'E2E8F0' } },
      };

      // Apply header styling
      for (let c = 0; c < columns.length; c++) {
        const cellRef = `${XLSX.utils.encode_col(c)}1`;
        if (ws[cellRef]) ws[cellRef].s = headerStyle;
      }

      // Apply data row styling
      for (let r = 0; r < rows.length; r++) {
        const rowNum = r + 2;
        const isAlt = r % 2 === 1;
        const defaultBg = isAlt ? 'F8FAFC' : 'FFFFFF';

        for (let c = 0; c < columns.length; c++) {
          const cellRef = `${XLSX.utils.encode_col(c)}${rowNum}`;
          if (!ws[cellRef]) continue;

          const colDef = columns[c];
          const cellStyle = {
            font: { name: 'Calibri', sz: 10, color: { rgb: '1E293B' } },
            fill: { fgColor: { rgb: defaultBg } },
            alignment: {
              horizontal: colDef.align,
              vertical: 'center',
              wrapText: colDef.wrap,
            },
            border: thinBorder,
          };

          if (colDef.header === 'Mobile') {
            ws[cellRef].t = 's'; // Store as text to preserve leading zeros
          } else if (colDef.header === 'Rent Amount') {
            ws[cellRef].t = 'n';
            ws[cellRef].z = '#,##0.00';
          } else if (colDef.header === 'Status') {
            const val = String(ws[cellRef].v || '').toLowerCase();
            if (val === 'occupied' || val === 'active') {
              cellStyle.font = { name: 'Calibri', sz: 10, bold: true, color: { rgb: '166534' } };
              cellStyle.fill = { fgColor: { rgb: isAlt ? 'F0FDF4' : 'DCFCE7' } };
            } else if (val === 'vacant') {
              cellStyle.font = { name: 'Calibri', sz: 10, bold: true, color: { rgb: '9A3412' } };
              cellStyle.fill = { fgColor: { rgb: isAlt ? 'FFFBEB' : 'FEF3C7' } };
            } else if (val === 'expired') {
              cellStyle.font = { name: 'Calibri', sz: 10, bold: true, color: { rgb: '991B1B' } };
              cellStyle.fill = { fgColor: { rgb: isAlt ? 'FEF2F2' : 'FEE2E2' } };
            }
          }

          ws[cellRef].s = cellStyle;
        }
      }

      // AutoFilter across all columns
      ws['!autofilter'] = { ref: `A1:${XLSX.utils.encode_col(columns.length - 1)}${rows.length + 1}` };

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rental Management');

      const fileName = `Rental_Management_${new Date().toISOString().slice(0, 10)}.xlsx`;

      // Freeze header row (Row 1) via JSZip
      try {
        const arrayBuf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const zip = await JSZip.loadAsync(arrayBuf);
        const sheetPath = 'xl/worksheets/sheet1.xml';
        let sheetXml = await zip.file(sheetPath).async('text');

        const freezePaneXml = '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>';
        if (sheetXml.includes('<sheetViews>')) {
          sheetXml = sheetXml.replace(/<sheetViews[\s\S]*?<\/sheetViews>/, freezePaneXml);
        } else {
          sheetXml = sheetXml.replace('<sheetData>', `${freezePaneXml}<sheetData>`);
        }
        zip.file(sheetPath, sheetXml);

        const finalBuf = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(finalBuf);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        // Fallback to standard XLSX writeFile if JSZip encounters any issue
        XLSX.writeFile(wb, fileName);
      }

      toast.success(`Exported ${rows.length} records`);
    } catch (err) {
      console.error('Failed to export Excel:', err);
      toast.error('Failed to export Excel');
    }
  }, [filteredUsers, canExport]);

  // ── UI helpers ────────────────────────────────────────────────
  const btnStyle = {
    minWidth: 120, borderRadius: 5, fontWeight: 500,
    background: 'transparent', border: `2px solid ${primaryColor}`,
    color: primaryColor, padding: '10px 20px', fontSize: 14,
  };
  const tabStyle = (key) => ({
    padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    color: activeTab === key ? primaryColor : '#718096',
    background: 'none', border: 'none',
    borderBottom: activeTab === key ? `3px solid ${primaryColor}` : '3px solid transparent',
    display: 'flex', alignItems: 'center', gap: 6,
    whiteSpace: 'nowrap', transition: 'all 0.2s',
  });

  if (!canView) {
    return (
      <div className="page-wrapper" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        <div className="container-fluid px-4 mt-4">
          <div className="alert alert-danger">You do not have permission to view Rentals.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="page-body mt-1">
        <div className="container-fluid px-4">
          <ToastContainer position="top-center" autoClose={3000} />

          {/* ═════ LIST ═════ */}
          {!showForm ? (
            <>
              <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 0 }}>
                <div className="card-body p-4">
                  <h2 className="mb-3" style={{ fontWeight: 600, color: '#2d3748', fontSize: 28 }}>
                    <FaHome className="me-2" style={{ color: primaryColor }} />
                    Rental Management
                  </h2>
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div style={{ maxWidth: 500, flex: 1 }}>
                      <div className="input-group" style={{ height: 45 }}>
                        <span className="input-group-text text-white" style={{ backgroundColor: primaryColor }}>
                          <FaSearch />
                        </span>
                        <input type="text" className="form-control border-start-0"
                          placeholder="Search tenants, email, mobile, flat..."
                          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                          style={{ height: 45, fontSize: 14 }} />
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <select value={filterProperty} onChange={(e) => setFilterProperty(e.target.value)}
                        style={{
                          height: 45, borderRadius: 0, border: `2px solid ${primaryColor}`,
                          padding: '0 12px', fontSize: 13, fontWeight: 600,
                          color: primaryColor, background: '#fff', minWidth: 180,
                        }}>
                        <option value="">All Properties</option>
                        {propertyList.map((p) => (
                          <option key={p.PropertyID} value={p.PropertyID}>{p.PropertyName}</option>
                        ))}
                      </select>

                      <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                        style={{
                          height: 45, borderRadius: 0, border: `2px solid ${primaryColor}`,
                          padding: '0 12px', fontSize: 13, fontWeight: 600,
                          color: primaryColor, background: '#fff', minWidth: 160,
                        }}>
                        <option value="">All Statuses</option>
                        <option value="active">Occupied / Active</option>
                        <option value="vacated">Vacated / Completed</option>
                        <option value="vacant">Vacant</option>
                        <option value="expired">Expired</option>
                      </select>

                      <button type="button" className="btn d-flex align-items-center gap-2"
                        onClick={handleExportExcel}
                        disabled={!filteredUsers.length || !canExport}
                        style={{
                          borderRadius: 0, padding: '8px 20px', height: 45,
                          background: 'transparent', border: '2px solid #276749', color: '#276749',
                          opacity: !filteredUsers.length || !canExport ? 0.5 : 1,
                        }}>
                        <FaFileExcel /> Export Excel
                      </button>

                      <button type="button" className="btn d-flex align-items-center gap-2"
                        onClick={handleCreateNew} disabled={!canAdd}
                        style={{
                          borderRadius: 0, padding: '8px 20px', height: 45,
                          background: primaryColor, border: 'none', color: '#fff',
                          opacity: canAdd ? 1 : 0.6,
                        }}>
                        <FaPlus /> Create Rental
                      </button>

                      <button type="button" className="btn d-flex align-items-center gap-2"
                        onClick={handleCreateTrade} disabled={!canAdd}
                        style={{
                          borderRadius: 0, padding: '8px 20px', height: 45,
                          background: '#fff', border: `2px solid ${primaryColor}`, color: primaryColor,
                          opacity: canAdd ? 1 : 0.6,
                        }}>
                        <FaFileAlt /> Create Trade
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm" style={{ borderRadius: 0 }}>
                <div className="card-body p-0">
                  {loading ? (
                    <div className="text-center p-5">
                      <div className="spinner-border" style={{ color: primaryColor }} />
                      <p className="mt-3 text-muted">Loading rentals...</p>
                    </div>
                  ) : (
                    <table className="table table-hover mb-0">
                      <thead className="bg-light">
                        <tr>
                          {['FLAT NO', 'FLAT TYPE', 'Tenant', 'Property', 'Rent Amount', 'Status'].map((h) => (
                            <th key={h} className="py-3 px-4"
                              style={{ color: '#4a5568', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length ? filteredUsers.map((u) => (
                          <RentalRow key={u.UserId} item={u}
                            isSelected={user.UserId === u.UserId}
                            onRowClick={handleRowClick}
                            primaryColor={primaryColor} />
                        )) : (
                          <tr>
                            <td colSpan={6} className="text-center p-5">
                              <FaHome style={{ fontSize: 48, color: '#cbd5e0' }} />
                              <p className="text-muted mt-3 mb-3">No rental records found</p>
                              <button className="btn" onClick={handleCreateNew}
                                style={{ background: primaryColor, color: '#fff', border: 'none' }}>
                                <FaPlus className="me-2" /> Create Rental
                              </button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          ) : (            /* ═════ FORM ═════ */
            <div className="card border-0 shadow-sm" style={{ borderRadius: 0 }}>
              <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-0"
                style={{ borderBottom: '1px solid #e2e8f0' }}>
                <h4 className="m-0" style={{ color: '#2d3748', fontWeight: 600, fontSize: 18 }}>
                  <FaHome className="me-2" style={{ color: primaryColor }} />
                  {user.UserId ? 'Edit Rental' : 'New Rental'}
                </h4>
                <button className="btn d-flex align-items-center gap-2" onClick={handleBackToList}
                  style={{ ...btnStyle, padding: '8px 16px', fontSize: 14 }}>
                  <FaArrowLeft /> Back to List
                </button>
              </div>

              <div style={{ borderBottom: '1px solid #e2e8f0', paddingLeft: 16, overflowX: 'auto' }}>
                <div className="d-flex">
                  {TABS.map((t) => (
                    <button key={t.key} type="button" style={tabStyle(t.key)} onClick={() => setActiveTab(t.key)}>
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card-body p-4">
                <form onSubmit={(e) => e.preventDefault()}>
                  {/* ── Tenant Info ── */}
                  {activeTab === 'tenant' && (
                    <div className="row g-3">

                      {isSuperAdmin && (
                        <div className="col-md-6">
                          <label className="form-label fw-medium mb-2">Company <span className="text-danger">*</span></label>
                          <select className={`form-select ${fieldErrors.CompanyID ? 'is-invalid' : ''}`}
                            name="CompanyID" value={user.CompanyID || ''}
                            onChange={(e) => {
                              handleInputChange(e);
                              fetchProperties(e.target.value);
                              fetchRentals(e.target.value);
                              fetchRoles(e.target.value);
                            }}>
                            <option value="">Select Company</option>
                            {companyList.map((c) => (
                              <option key={c.CompanyId} value={c.CompanyId}>{c.CompanyName}</option>
                            ))}
                          </select>
                          {fieldErrors.CompanyID && <div className="invalid-feedback">{fieldErrors.CompanyID}</div>}
                        </div>
                      )}

                      <div className="col-md-6">
                        <label className="form-label fw-medium mb-2">
                          Property <span className="text-danger">*</span>
                        </label>
                        <select
                          className={`form-select ${fieldErrors.PropertyID ? 'is-invalid' : ''}`}
                          value={user.PropertyID}
                          onChange={(e) => {
                            setUser((p) => ({
                              ...p,
                              PropertyID: e.target.value,
                              RecordID: '',
                              FlatNo: '',
                              FlatType: '',
                              RentalAmount: '',
                              MonthlyRent: '',
                            }));
                          }}>
                          <option value="">Select Property</option>
                          {propertyList.map((p) => (
                            <option key={p.PropertyID} value={p.PropertyID}>{p.PropertyName}</option>
                          ))}
                        </select>
                        {fieldErrors.PropertyID && <div className="invalid-feedback">{fieldErrors.PropertyID}</div>}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-medium mb-2">
                          Flat / Record <span className="text-danger">*</span>
                          {loadingRecords && <span className="ms-2 small text-muted">(loading…)</span>}
                        </label>
                        <select
                          className={`form-select ${fieldErrors.RecordID ? 'is-invalid' : ''}`}
                          value={user.RecordID}
                          onChange={(e) => {
                            const record = recordList.find(
                              (item) => String(item.RecordID) === e.target.value,
                            );
                            setUser((p) => ({
                              ...p,
                              RecordID: e.target.value,
                              FlatNo: record?.FlatNo || '',
                              FlatType: record?.FlatType || '',
                              RentalAmount: firstPositiveAmount(record?.RentalAmount),
                              MonthlyRent: '',
                            }));
                          }}
                          disabled={!user.PropertyID || loadingRecords}>
                          <option value="">
                            {!user.PropertyID
                              ? 'Select property first'
                              : recordList.length === 0
                                ? 'No records available'
                                : '— Select flat / record —'}
                          </option>
                          {recordList.map((r) => (
                            <option key={r.RecordID} value={r.RecordID}>
                              {r.FlatNo} {r.FlatType ? `· ${r.FlatType}` : ''}
                            </option>
                          ))}
                        </select>
                        {fieldErrors.RecordID && <div className="invalid-feedback">{fieldErrors.RecordID}</div>}
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">Flat No</label>
                        <input className="form-control" name="FlatNo" value={user.FlatNo}
                          onChange={handleInputChange} placeholder="Auto-filled from record" />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">Flat Type</label>
                        <input className="form-control" name="FlatType" value={user.FlatType}
                          onChange={handleInputChange} placeholder="e.g. 2 BHK" />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">Rent Amount</label>
                        <input type="number" step="0.01" className="form-control"
                          name="RentalAmount" value={user.RentalAmount} onChange={handleInputChange} />
                      </div>

                      {/* ── Dynamic Flat Availability Banner ── */}
                      {flatAvailability && (
                        <div className="col-12 mt-1 mb-2">
                          {flatAvailability.checking ? (
                            <div className="text-muted small d-flex align-items-center gap-2 py-1">
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                              Checking flat availability...
                            </div>
                          ) : flatAvailability.isOccupied ? (
                            <div
                              className="d-flex align-items-start gap-2 py-2 px-3"
                              style={{
                                fontSize: 13,
                                borderRadius: 8,
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#991b1b',
                              }}
                            >
                              <FaExclamationTriangle className="text-danger flex-shrink-0 mt-0.5" style={{ fontSize: 15 }} />
                              <div>
                                <strong> This flat is currently occupied. Please select another available flat or complete the previous rental first.</strong>
                                {flatAvailability.currentTenant && (
                                  <div className="small mt-0.5" style={{ color: '#b91c1c' }}>
                                    Current Occupant: <strong>{flatAvailability.currentTenant}</strong>
                                    {flatAvailability.leaseEndDate ? ` · Lease ends: ${new Date(flatAvailability.leaseEndDate).toLocaleDateString()}` : ''}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : flatAvailability.available ? (
                            <div
                              className="d-flex align-items-center gap-2 py-2 px-3"
                              style={{
                                fontSize: 13,
                                borderRadius: 8,
                                backgroundColor: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                color: '#166534',
                              }}
                            >
                              <FaCheckCircle className="text-success flex-shrink-0" style={{ fontSize: 15 }} />
                              <div>
                                <strong>This flat is available for rental.</strong>
                                {flatAvailability.previousTenant && (
                                  <span className="small ms-2" style={{ color: '#15803d' }}>
                                    (Previous tenant: {flatAvailability.previousTenant} · {flatAvailability.previousStatus || 'Vacated'})
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}

                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">Rental Status</label>
                        <select
                          className="form-select"
                          name="RentalStatus"
                          value={user.RentalStatus || 'Occupied'}
                          onChange={handleInputChange}
                        >
                          <option value="Occupied">Occupied</option>
                          <option value="Vacated">Vacated</option>
                          <option value="Completed">Completed</option>
                          <option value="Active">Active</option>
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">Lease Start Date</label>
                        <input
                          type="date"
                          className={`form-control ${fieldErrors.LeaseStartDate ? 'is-invalid' : ''}`}
                          name="LeaseStartDate"
                          value={user.LeaseStartDate || ''}
                          onChange={handleInputChange}
                          required={String(user.RentalStatus || '').trim().toLowerCase() === 'occupied'}
                        />
                        {fieldErrors.LeaseStartDate && <div className="invalid-feedback">{fieldErrors.LeaseStartDate}</div>}
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">Lease End Date</label>
                        <input
                          type="date"
                          className="form-control"
                          name="LeaseEndDate"
                          value={user.LeaseEndDate || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-medium mb-2">Payment Mode</label>
                        <div className="d-flex flex-wrap gap-3">
                          {PAYMENT_MODES.map((mode) => (
                            <div className="form-check" key={mode}>
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`rental-payment-mode-${mode}`}
                                checked={user.PaymentMode.includes(mode)}
                                onChange={() => handlePaymentModeChange(mode)}
                              />
                              <label className="form-check-label" htmlFor={`rental-payment-mode-${mode}`}>
                                {mode}
                              </label>
                            </div>
                          ))}
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="rental-payment-mode-both"
                              checked={user.PaymentMode.includes('Cash') && user.PaymentMode.includes('Cheque')}
                              onChange={() => handlePaymentModeChange('Both')}
                            />
                            <label className="form-check-label" htmlFor="rental-payment-mode-both">
                              Both (Cash + Cheque)
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">First Name <span className="text-danger">*</span></label>
                        <input className={`form-control ${fieldErrors.Name ? 'is-invalid' : ''}`}
                          name="Name" value={user.Name} onChange={handleInputChange} />
                        {fieldErrors.Name && <div className="invalid-feedback">{fieldErrors.Name}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">Middle Name</label>
                        <input className="form-control" name="MName" value={user.MName} onChange={handleInputChange} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">Last Name</label>
                        <input className="form-control" name="LName" value={user.LName} onChange={handleInputChange} />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">
                          EID Number <span className="text-muted small">(Optional)</span>
                        </label>
                        <input className={`form-control ${fieldErrors.EIDNo ? 'is-invalid' : ''}`}
                          name="EIDNo" value={user.EIDNo} onChange={handleEIDChange}
                          placeholder="784-XXXX-XXXXXXX-X" maxLength={18} />
                        {fieldErrors.EIDNo && <div className="invalid-feedback">{fieldErrors.EIDNo}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">EID Expiry</label>
                        <input type="date" className="form-control" name="EIDExpiryDate"
                          value={user.EIDExpiryDate} onChange={handleInputChange} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">Email</label>
                        <input type="email" className={`form-control ${fieldErrors.Email ? 'is-invalid' : ''}`}
                          name="Email" value={user.Email} onChange={handleInputChange} />
                        {fieldErrors.Email && <div className="invalid-feedback">{fieldErrors.Email}</div>}
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">Mobile <span className="text-danger">*</span></label>
                        <input className={`form-control ${fieldErrors.Mobile ? 'is-invalid' : ''}`}
                          name="Mobile" value={user.Mobile} onChange={handleInputChange} />
                        {fieldErrors.Mobile && <div className="invalid-feedback">{fieldErrors.Mobile}</div>}
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">Gender</label>
                        <select className="form-select" name="Sex" value={user.Sex || ''} onChange={handleInputChange}>
                          <option value="">Select Gender</option>
                          <option value="0">Male</option>
                          <option value="1">Female</option>
                          <option value="2">Others</option>
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">Lease / Contract No.</label>
                        <input className="form-control" name="BadgeNo" value={user.BadgeNo} onChange={handleInputChange} />
                      </div>

                      <div className="col-12">
                        <hr style={{ borderColor: '#e2e8f0' }} />
                        <div className="fw-semibold mb-3 d-flex align-items-center gap-2"
                          style={{ color: primaryColor, fontSize: 14 }}>
                          <FaCamera /> Tenant Photo
                          <span className="badge ms-1" style={{ background: '#e2e8f0', color: '#718096', fontSize: 10 }}>
                            Optional
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-4 flex-wrap">
                          <div className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                            style={{ width: 100, height: 100, border: `3px solid ${primaryColor}`, overflow: 'hidden' }}>
                            {(previewImage || currentImage)
                              ? <img src={previewImage || currentImage} alt=""
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <FaUser style={{ fontSize: 40, color: '#a0aec0' }} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 220 }}>
                            <input type="file" className="form-control mb-2" accept="image/*" onChange={handleFileChange} />
                            <small className="text-muted">Max 300KB · JPG/PNG/WEBP</small>
                            {(previewImage || currentImage) && (
                              <button type="button" className="btn btn-sm mt-2 d-flex align-items-center gap-1"
                                style={{ color: '#e53e3e', background: 'none', border: '1px solid #e53e3e' }}
                                onClick={() => {
                                  setPreviewImage(null); setCurrentImage(null);
                                  setUser((p) => ({ ...p, image: null }));
                                }}>
                                <FaTimesCircle /> Remove Photo
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Cheques (Modern Financial ERP Redesign) ── */}
                  {activeTab === 'cheques' && (
                    <div className="cheque-management-page">
                      <style>{`
                        .cheque-card {
                          background: #ffffff;
                          border: 1px solid #e2e8f0;
                          border-radius: 12px;
                          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
                          padding: 20px;
                          margin-bottom: 20px;
                        }
                        .cheque-header-title {
                          font-size: 15px;
                          font-weight: 700;
                          color: #0f172a;
                          margin: 0;
                          display: flex;
                          align-items: center;
                          gap: 8px;
                        }
                        .cheque-input-label {
                          font-size: 11px;
                          font-weight: 700;
                          text-transform: uppercase;
                          letter-spacing: 0.5px;
                          color: #64748b;
                          margin-bottom: 6px;
                          display: block;
                        }
                        .cheque-form-control {
                          height: 38px;
                          border-radius: 6px;
                          border: 1px solid #cbd5e1;
                          font-size: 13px;
                          color: #1e293b;
                          padding: 6px 12px;
                          transition: all 0.15s ease-in-out;
                        }
                        .cheque-form-control:focus {
                          border-color: #2563eb;
                          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
                          outline: none;
                        }
                        .cheque-select-type {
                          padding-left: 10px;
                          padding-right: 24px;
                          background-position: right 8px center;
                          transition: width 0.15s ease-in-out;
                        }
                        .cheque-amount-group {
                          min-width: 88px;
                          transition: width 0.15s ease-in-out;
                        }
                        .cheque-amount-group input[type="number"]::-webkit-inner-spin-button,
                        .cheque-amount-group input[type="number"]::-webkit-outer-spin-button {
                          -webkit-appearance: none;
                          margin: 0;
                        }
                        .cheque-amount-group input[type="number"] {
                          -moz-appearance: textfield;
                        }
                        .cheque-row-item {
                          background: #f8fafc;
                          border: 1px solid #e2e8f0;
                          border-radius: 8px;
                          padding: 14px;
                          margin-bottom: 10px;
                          transition: background 0.15s ease;
                        }
                        .cheque-row-item:hover {
                          background: #f1f5f9;
                        }
                        .cheque-tx-item {
                          display: flex;
                          align-items: center;
                          justify-content: space-between;
                          background: #ffffff;
                          border: 1px solid #e2e8f0;
                          border-radius: 8px;
                          padding: 12px 16px;
                          margin-bottom: 8px;
                          transition: all 0.15s ease;
                        }
                        .cheque-tx-item:hover {
                          border-color: #cbd5e1;
                          background: #f8fafc;
                          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                        }
                        .cheque-btn-add {
                          background: #eff6ff;
                          border: 1.5px solid #2563eb;
                          color: #1e40af;
                          border-radius: 6px;
                          padding: 6px 14px;
                          font-size: 12px;
                          font-weight: 600;
                          display: inline-flex;
                          align-items: center;
                          gap: 6px;
                          transition: all 0.15s ease;
                          cursor: pointer;
                        }
                        .cheque-btn-add:hover:not(:disabled) {
                          background: #dbeafe;
                          color: #1d4ed8;
                        }
                        .cheque-btn-save {
                          background: #1e40af;
                          color: #ffffff;
                          border: none;
                          border-radius: 6px;
                          padding: 9px 24px;
                          font-size: 13px;
                          font-weight: 600;
                          display: inline-flex;
                          align-items: center;
                          gap: 8px;
                          box-shadow: 0 1px 2px rgba(30,64,175,0.2);
                          transition: all 0.15s ease;
                          cursor: pointer;
                        }
                        .cheque-btn-save:hover:not(:disabled) {
                          background: #1d4ed8;
                          box-shadow: 0 2px 4px rgba(30,64,175,0.3);
                        }
                        .cheque-btn-del-row {
                          background: #fef2f2;
                          border: 1px solid #fecaca;
                          color: #dc2626;
                          border-radius: 6px;
                          height: 38px;
                          font-size: 12px;
                          font-weight: 600;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          gap: 6px;
                          width: 100%;
                          transition: all 0.15s ease;
                          cursor: pointer;
                        }
                        .cheque-btn-del-row:hover:not(:disabled) {
                          background: #fee2e2;
                          color: #b91c1c;
                        }
                        .cheque-scroll-area::-webkit-scrollbar {
                          width: 6px;
                        }
                        .cheque-scroll-area::-webkit-scrollbar-track {
                          background: #f1f5f9;
                          border-radius: 4px;
                        }
                        .cheque-scroll-area::-webkit-scrollbar-thumb {
                          background: #cbd5e1;
                          border-radius: 4px;
                        }
                        .cheque-scroll-area::-webkit-scrollbar-thumb:hover {
                          background: #94a3b8;
                        }
                      `}</style>

                      {/* Header Notification Banner */}
                      <div className="d-flex align-items-center justify-content-between p-3 mb-3"
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderLeft: '4px solid #2563eb',
                          borderRadius: '8px'
                        }}>
                        <div className="d-flex align-items-center gap-2">
                          <CreditCard size={18} style={{ color: '#2563eb' }} />
                          <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>
                            Post-Dated Cheques, Cash Receipts & Tenancy Payment Transactions
                          </span>
                        </div>
                        {!isEditing && (
                          <span className="badge d-inline-flex align-items-center gap-1"
                            style={{ background: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6 }}>
                            <AlertCircle size={12} /> Save rental tenant info first to register transactions
                          </span>
                        )}
                      </div>

                      {/* ── Section 1: Add / Edit Transactions ── */}
                      <div className="cheque-card">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="cheque-header-title">
                            <span style={{
                              width: 28, height: 28, borderRadius: 6,
                              background: selectedTransactionId ? '#fef3c7' : '#eff6ff',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              color: selectedTransactionId ? '#d97706' : '#2563eb'
                            }}>
                              {selectedTransactionId ? <Edit3 size={16} /> : <Plus size={16} />}
                            </span>
                            {selectedTransactionId ? (
                              <div className="d-inline-flex align-items-center gap-2">
                                <span>Edit Transaction</span>
                                <span className="badge" style={{
                                  background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe',
                                  fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4
                                }}>
                                  {transactions[0]?.label || 'Selected'}
                                </span>
                              </div>
                            ) : (
                              'Add New Transactions'
                            )}
                          </h6>
                          {selectedTransactionId ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                              onClick={handleClearTransactionSelection}
                              title="Clear selection and create new transaction"
                              style={{ fontSize: 12, fontWeight: 600, borderRadius: 6 }}
                            >
                              <Plus size={14} /> New Transaction
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="cheque-btn-add"
                              onClick={addTransactionRow}
                              disabled={!isEditing}
                              title="Add another transaction row"
                            >
                              <Plus size={14} /> Add Row
                            </button>
                          )}
                        </div>

                        {/* Transaction Rows */}
                        <div className="mb-3">
                          {transactions.map((t, index) => {
                            const isExisting = !!(t.TransactionID && Number(t.TransactionID) > 0);
                            const seqInfo = getNextSequenceForType(t.type, transactions, chequeList, t.id, isExisting);
                            const existingFileName = t.path ? (t.path.split('/').pop().split('\\').pop()) : '';

                            return (
                            <div
                              key={t.id}
                              className="cheque-row-item"
                              style={selectedTransactionId ? {
                                background: '#f8fafc',
                                borderLeft: '4px solid #2563eb'
                              } : {}}
                            >
                              <div className="row g-2 align-items-end">
                                {/* 1. Type (width auto-adjusted snugly to selected text) */}
                                <div className="col-lg-auto col-md-auto col-sm-6 col-12">
                                  <label className="cheque-input-label">Type</label>
                                  <select
                                    className="form-select cheque-form-control cheque-select-type"
                                    value={t.type}
                                    onChange={(e) => updateTransactionRow(t.id, 'type', e.target.value)}
                                    disabled={!isEditing}
                                    style={{
                                      width: getTypeFieldWidth(t.type),
                                      minWidth: '72px'
                                    }}
                                  >
                                    <option value="Cheque">Cheque</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Tenancy">Tenancy</option>
                                  </select>
                                </div>

                                {/* 2. Amount (width auto-adjusted snugly to text length) */}
                                <div className="col-lg-auto col-md-auto col-sm-6 col-12">
                                  <label className="cheque-input-label">
                                    Amount <span className="text-danger">*</span>
                                  </label>
                                  <div
                                    className="input-group cheque-amount-group"
                                    style={{
                                      width: getAmountFieldWidth(t.amount),
                                      minWidth: '88px'
                                    }}
                                  >
                                    <span className="input-group-text" style={{
                                      height: 38, fontSize: 11, fontWeight: 700,
                                      background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1',
                                      padding: '0 7px'
                                    }}>AED</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      className="form-control cheque-form-control"
                                      placeholder="0.00"
                                      value={t.amount}
                                      onChange={(e) => updateTransactionRow(t.id, 'amount', e.target.value)}
                                      disabled={!isEditing}
                                      style={{ fontWeight: 600, paddingLeft: 7, paddingRight: 7 }}
                                    />
                                  </div>
                                </div>

                                {/* 3. Date */}
                                <div className="col-lg-2 col-md-3 col-sm-6 col-12">
                                  <label className="cheque-input-label">Date</label>
                                  <input
                                    type="date"
                                    className="form-control cheque-form-control"
                                    value={t.date}
                                    onChange={(e) => updateTransactionRow(t.id, 'date', e.target.value)}
                                    disabled={!isEditing}
                                  />
                                </div>

                                {/* 4. Attachment */}
                                <div className="col-lg-4 col-md-8 col-sm-8 col-12">
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <label className="cheque-input-label mb-0">Attachment</label>
                                    {!t.file && t.path && (
                                      <div className="d-inline-flex align-items-center gap-2">
                                        <span style={{ fontSize: 11, color: '#64748b', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={existingFileName}>
                                          {existingFileName}
                                        </span>
                                        <a
                                          href={`${api.defaults.baseURL}/${t.path.replace(/^\/+/, '')}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          style={{ fontSize: 11, color: '#2563eb', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                                        >
                                          <ExternalLink size={11} /> View File
                                        </a>
                                      </div>
                                    )}

                                  </div>
                                  <input
                                    type="file"
                                    className="form-control cheque-form-control"
                                    accept="image/*,.pdf"
                                    onChange={(e) => updateTransactionRow(t.id, 'file', e.target.files[0] || null)}
                                    disabled={!isEditing}
                                    style={{ fontSize: 12 }}
                                  />
                                  {!t.file && t.path && (
                                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                                      File attached. Choose a new file to replace.
                                    </div>
                                  )}
                                </div>

                                {/* 5. Action */}
                                <div className="col-lg-2 col-md-4 col-sm-4 col-12 text-end">
                                  {selectedTransactionId ? (
                                    <button
                                      type="button"
                                      className="cheque-btn-del-row"
                                      onClick={handleClearTransactionSelection}
                                      title="Cancel editing and clear form"
                                      style={{ background: '#f8fafc', borderColor: '#cbd5e1', color: '#64748b' }}
                                    >
                                      <X size={14} /> Clear
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="cheque-btn-del-row"
                                      onClick={() => removeTransactionRow(t.id)}
                                      disabled={transactions.length === 1 || !isEditing}
                                      title="Remove this row"
                                    >
                                      <Trash2 size={14} /> Remove
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                            );
                          })}
                        </div>

                        {/* Save / Update Button Row */}
                        <div className="d-flex justify-content-end align-items-center gap-2 pt-2">
                          {selectedTransactionId && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={handleClearTransactionSelection}
                              style={{ height: 38, fontWeight: 600, fontSize: 13, borderRadius: 6, padding: '6px 16px' }}
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="button"
                            className="cheque-btn-save"
                            disabled={savingCheque || !isEditing}
                            onClick={handleSaveTransactions}
                            style={{ opacity: savingCheque || !isEditing ? 0.6 : 1 }}
                          >
                            {savingCheque ? (
                              <>
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                                {selectedTransactionId ? 'Updating Transaction...' : 'Saving Transactions...'}
                              </>
                            ) : selectedTransactionId ? (
                              <>
                                <Check size={16} /> Update Transaction
                              </>
                            ) : (
                              <>
                                <Save size={16} /> Save All Transactions
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* ── Section 2: Existing Transactions ── */}
                      <div className="cheque-card">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="cheque-header-title">
                            <span style={{
                              width: 28, height: 28, borderRadius: 6, background: '#eff6ff',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb'
                            }}>
                              <Banknote size={16} />
                            </span>
                            Existing Transactions
                          </h6>
                          <div className="d-flex align-items-center gap-2">
                            <span style={{ fontSize: 11, color: '#64748b' }}>
                              Click any card to edit
                            </span>
                            <span style={{
                              background: '#eff6ff',
                              color: '#1e40af',
                              border: '1px solid #bfdbfe',
                              borderRadius: '12px',
                              padding: '3px 12px',
                              fontSize: 12,
                              fontWeight: 700
                            }}>
                              {chequeList.length} {chequeList.length === 1 ? 'Record' : 'Records'}
                            </span>
                          </div>
                        </div>

                        {chequesLoading ? (
                          <div className="text-center py-5 text-muted">
                            <span className="spinner-border spinner-border-sm me-2 text-primary" /> Loading transactions...
                          </div>
                        ) : !isEditing ? (
                          <div className="text-center py-4" style={{ background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
                            <AlertCircle size={28} className="text-muted mb-2" />
                            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                              Save the rental tenant record first to view existing transactions.
                            </div>
                          </div>
                        ) : chequeList.length === 0 ? (
                          <div className="text-center py-4" style={{ background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
                            <CreditCard size={28} className="text-muted mb-2" />
                            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                              No transactions recorded yet. Add the first one above.
                            </div>
                          </div>
                        ) : (
                          <div className="cheque-scroll-area" style={{ maxHeight: 340, overflowY: 'auto', paddingRight: 4 }}>
                            {chequeList.map((c, idx) => {
                              const isSelected = selectedTransactionId === c.TransactionID;
                              const txType = (c.TransactionType || 'Cheque').toLowerCase();
                              const isCheque = txType.includes('cheque');
                              const isCash = txType.includes('cash');

                              return (
                                <div
                                  key={c.TransactionID || idx}
                                  className={`cheque-tx-item ${isSelected ? 'selected' : ''}`}
                                  onClick={() => handleSelectTransaction(c)}
                                  title="Click to load transaction details into the form"
                                  style={{
                                    cursor: 'pointer',
                                    background: isSelected ? '#eff6ff' : '#ffffff',
                                    borderColor: isSelected ? '#2563eb' : '#e2e8f0',
                                    borderWidth: isSelected ? '2px' : '1px',
                                    boxShadow: isSelected ? '0 4px 12px rgba(37,99,235,0.14)' : undefined,
                                  }}
                                >
                                  {/* Left: Icon & Details */}
                                  <div className="d-flex align-items-center gap-3" style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{
                                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                                      background: isSelected ? '#2563eb' : isCheque ? '#eff6ff' : isCash ? '#dcfce7' : '#eef2ff',
                                      color: isSelected ? '#ffffff' : isCheque ? '#2563eb' : isCash ? '#16a34a' : '#4f46e5',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      transition: 'all 0.15s ease'
                                    }}>
                                      {isCheque ? <CreditCard size={18} /> : isCash ? <Banknote size={18} /> : <FileCheck size={18} />}
                                    </div>

                                    <div style={{ minWidth: 0 }}>
                                      <div className="d-flex align-items-center gap-2 flex-wrap">
                                        <span
                                          style={{
                                            fontSize: 12,
                                            fontWeight: 700,
                                            padding: '2px 8px',
                                            borderRadius: 6,
                                            background: isSelected ? '#dbeafe' : isCheque ? '#eff6ff' : isCash ? '#f0fdf4' : '#eef2ff',
                                            color: isSelected ? '#1e40af' : isCheque ? '#1d4ed8' : isCash ? '#15803d' : '#4338ca',
                                            border: `1px solid ${isSelected ? '#93c5fd' : isCheque ? '#bfdbfe' : isCash ? '#bbf7d0' : '#c7d2fe'}`
                                          }}
                                        >
                                          {c.Label || `${c.TransactionType || 'Transaction'} ${c.Sequence || (idx + 1)}`}
                                        </span>
                                        <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                                          AED {money(c.Amount)}
                                        </span>
                                        {isSelected && (
                                          <span className="badge" style={{
                                            background: '#2563eb', color: '#ffffff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 3
                                          }}>
                                            <Check size={11} /> Selected
                                          </span>
                                        )}
                                      </div>

                                      <div className="d-flex align-items-center gap-3 mt-1 flex-wrap" style={{ fontSize: 12, color: '#64748b' }}>
                                        <span className="d-inline-flex align-items-center gap-1">
                                          <Calendar size={12} />
                                          {c.TransactionDate ? String(c.TransactionDate).slice(0, 10) : 'No date'}
                                        </span>

                                        {c.Path && (
                                          <a
                                            href={`${api.defaults.baseURL}/${c.Path.replace(/^\/+/, '')}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                              color: '#2563eb', fontWeight: 600, textDecoration: 'none',
                                              display: 'inline-flex', alignItems: 'center', gap: 3
                                            }}
                                          >
                                            <ExternalLink size={12} /> View File
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right: Delete Action */}
                                  <div className="ms-3 flex-shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTransaction(c);
                                      }}
                                      style={{
                                        background: '#fef2f2',
                                        border: '1px solid #fecaca',
                                        color: '#dc2626',
                                        borderRadius: 6,
                                        padding: '5px 12px',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                      }}
                                      title="Delete transaction"
                                    >
                                      <Trash2 size={13} /> Delete
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Trades ── */}
                  {activeTab === 'trades' && (
                    <div className="row g-3">
                      <div className="col-12">
                        <div className="alert d-flex align-items-center gap-2 mb-3"
                          style={{ background: '#f0f4ff', border: `1px solid ${primaryColor}20`,
                            borderRadius: 8, color: '#2d3748', fontSize: 13 }}>
                          <FaFileAlt style={{ color: primaryColor }} />
                          Add, edit, or remove trades. Changes appear immediately in the Trade dropdown.
                        </div>
                      </div>

                      <div className="col-md-5">
                        <div className="p-3" style={{ background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                          <div className="fw-semibold mb-3" style={{ color: primaryColor, fontSize: 14 }}>
                            {editingTradeID ? 'Edit Trade' : 'Add New Trade'}
                          </div>
                          <label className="form-label fw-medium mb-2">
                            Trade Name <span className="text-danger">*</span>
                          </label>
                          <input className={`form-control ${tradeError ? 'is-invalid' : ''}`}
                            value={tradeForm.RoleName}
                            onChange={(e) => setTradeForm((p) => ({ ...p, RoleName: e.target.value }))}
                            placeholder="e.g. Electrician, Plumber"
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveTrade(); } }} />
                          {tradeError && <div className="invalid-feedback">{tradeError}</div>}

                          <div className="d-flex gap-2 mt-3">
                            <button type="button" className="btn d-flex align-items-center gap-2"
                              disabled={savingTrade} onClick={handleSaveTrade}
                              style={{
                                background: primaryColor, color: '#fff', border: 'none',
                                borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600,
                                opacity: savingTrade ? 0.6 : 1,
                              }}>
                              {savingTrade
                                ? <><span className="spinner-border spinner-border-sm" /> Saving...</>
                                : <><FaSave /> {editingTradeID ? 'Update' : 'Add'}</>}
                            </button>
                            {editingTradeID && (
                              <button type="button" className="btn d-flex align-items-center gap-2"
                                onClick={handleCancelEditTrade}
                                style={{
                                  background: 'transparent', color: '#718096',
                                  border: '2px solid #e2e8f0', borderRadius: 6,
                                  padding: '8px 16px', fontSize: 13, fontWeight: 600,
                                }}>
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="col-md-7">
                        <div className="p-3" style={{ background: '#f8fafc', borderRadius: 10,
                          border: '1px solid #e2e8f0', minHeight: 220 }}>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <div className="fw-semibold" style={{ color: primaryColor, fontSize: 14 }}>Existing Trades</div>
                            <span style={{
                              background: `${primaryColor}15`, color: primaryColor,
                              fontSize: 11, fontWeight: 700, borderRadius: 10, padding: '2px 10px',
                            }}>
                              {roleList.length}
                            </span>
                          </div>
                          {roleList.length === 0 ? (
                            <div className="text-center text-muted" style={{ fontSize: 13, padding: '30px 0' }}>
                              No trades yet. Add the first one →
                            </div>
                          ) : (
                            <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {roleList.map((r) => {
                                const isBeingEdited = editingTradeID === r.RoleID;
                                return (
                                  <div key={r.RoleID}
                                    style={{
                                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                      background: isBeingEdited ? `${primaryColor}10` : '#fff',
                                      border: `1.5px solid ${isBeingEdited ? primaryColor : '#e2e8f0'}`,
                                      borderRadius: 8, padding: '10px 14px',
                                    }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: 13, fontWeight: 600, color: '#2d3748' }}>{r.RoleName}</div>
                                      <div style={{ fontSize: 10, color: '#a0aec0' }}>ID: {r.RoleID}</div>
                                    </div>
                                    <div className="d-flex gap-2">
                                      <button type="button" onClick={() => handleEditTrade(r)}
                                        style={{
                                          background: '#ebf8ff', border: '1px solid #bee3f8',
                                          color: '#2b6cb0', borderRadius: 6, padding: '5px 10px',
                                          fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                        }}>
                                        <FaEdit />
                                      </button>
                                      <button type="button" onClick={() => handleDeleteTrade(r)}
                                        style={{
                                          background: '#fff5f5', border: '1px solid #feb2b2',
                                          color: '#e53e3e', borderRadius: 6, padding: '5px 10px',
                                          fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                        }}>
                                        <FaTrashAlt />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Footer Action Buttons ── */}
                  <div className="pt-4 mt-3" style={{ borderTop: '1px solid #e2e8f0' }}>
                    <div className="d-flex justify-content-end align-items-center flex-wrap gap-2">
                      {isEditing && (
                        <button
                          type="button"
                          className="btn d-inline-flex align-items-center gap-2"
                          disabled={loadingDelete || !canDelete}
                          onClick={handleDelete}
                          style={{
                            height: 38,
                            borderRadius: 6,
                            padding: '0 18px',
                            fontSize: 13,
                            fontWeight: 600,
                            background: '#fef2f2',
                            border: '1.5px solid #fca5a5',
                            color: '#dc2626',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {loadingDelete ? (
                            <>
                              <span className="spinner-border spinner-border-sm" /> Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 size={14} /> Delete
                            </>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn d-inline-flex align-items-center gap-2"
                        onClick={handleClear}
                        style={{
                          height: 38,
                          borderRadius: 6,
                          padding: '0 18px',
                          fontSize: 13,
                          fontWeight: 600,
                          background: '#ffffff',
                          border: '1.5px solid #cbd5e1',
                          color: '#475569',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <RotateCcw size={14} /> Clear
                      </button>

                      {isEditing ? (
                        <button
                          type="button"
                          className="btn d-inline-flex align-items-center gap-2"
                          disabled={loadingUpdate || !canEdit}
                          onClick={handleUpdate}
                          style={{
                            height: 38,
                            borderRadius: 6,
                            padding: '0 22px',
                            fontSize: 13,
                            fontWeight: 600,
                            background: '#1e40af',
                            border: '1.5px solid #1e40af',
                            color: '#ffffff',
                            boxShadow: '0 1px 2px rgba(30,64,175,0.2)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {loadingUpdate ? (
                            <>
                              <span className="spinner-border spinner-border-sm" /> Updating...
                            </>
                          ) : (
                            <>
                              <Save size={14} /> Update
                            </>
                          )}
                        </button>
                      ) : activeTab !== 'trades' ? (
                        <button
                          type="button"
                          className="btn d-inline-flex align-items-center gap-2"
                          disabled={loadingSubmit || !canAdd}
                          onClick={handleSubmit}
                          style={{
                            height: 38,
                            borderRadius: 6,
                            padding: '0 24px',
                            fontSize: 13,
                            fontWeight: 600,
                            background: '#1e40af',
                            border: '1.5px solid #1e40af',
                            color: '#ffffff',
                            boxShadow: '0 1px 2px rgba(30,64,175,0.2)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {loadingSubmit ? (
                            <>
                              <span className="spinner-border spinner-border-sm" /> Creating...
                            </>
                          ) : (
                            <>
                              <Check size={16} /> Submit
                            </>
                          )}
                        </button>
                      ) : null}
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

export default RentalInfo;
