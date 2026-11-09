import React, { useState, useEffect } from 'react';
import api from '../../apiService';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaUserCog, FaSearch, FaUser, FaBuilding, FaRoad,
  FaCalendarDay, FaPhone, FaMapMarkerAlt, FaSave,
  FaEraser, FaUsers, FaEdit, FaArrowLeft, FaTimesCircle
} from "react-icons/fa";

const primaryColor = 'rgb(45, 75, 169)';

const outlineBtn = {
  borderRadius: '5px', fontWeight: '500',
  background: 'transparent', border: `2px solid ${primaryColor}`,
  color: primaryColor, padding: '10px 20px', fontSize: '14px', minWidth: '120px'
};

function UserDetails() {
  const [loading, setLoading] = useState(false);
  const [duplicateError, setDuplicateError] = useState('');
  const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [branches, setBranches] = useState([]);
  const [Zone, setZone] = useState([]);
  const [UserRole, setUserRole] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedMdUsers, setSelectedMdUsers] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showMdDropdown, setShowMdDropdown] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [employee, setEmployee] = useState({
    UserId: 0, Name: '', Kmallowance: '', Dayallowance: '',
    CompanyID: '', BranchId: '', UserRoleId: '', ZoneId: '',
  });

  const [employeeData, setEmployeeData] = useState([]);

  useEffect(() => {
    // fetchData();
    fetchBranches();
    fetchUserRole();
    fetchZone();
    // fetchAllUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.md-custom-dropdown')) setShowMdDropdown(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const CompanyID = sessionStorage.getItem("CompanyID");
      if (!CompanyID) { toast.error("CompanyID not found"); return; }
      const response = await api.get("/api/GetUser", { params: { CompanyID } });
      setEmployeeData(response.data);
    } catch { toast.error('Failed to fetch employee data'); }
    finally { setLoading(false); }
  };

  const fetchBranches = async () => {
    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      if (!CompanyID) return;
      const response = await api.get("/api/getbranch", { params: { CompanyID } });
      setBranches(response.data);
    } catch { toast.error('Failed to fetch branches'); }
  };

  const fetchUserRole = async () => {
    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      if (!CompanyID) return;
      const response = await api.get("/api/GetUserRole", { params: { CompanyID } });
      setUserRole(response.data);
    } catch { toast.error('Failed to fetch UserRole'); }
  };

  const fetchZone = async () => {
    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      if (!CompanyID) return;
      const response = await api.get("/api/getZone", { params: { CompanyID } });
      setZone(response.data);
    } catch { toast.error('Failed to fetch Zone'); }
  };

  const fetchAllUsers = async () => {
    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      if (!CompanyID) return;
      const response = await api.get("/api/GetUser", { params: { CompanyID } });
      setAllUsers(response.data);
    } catch { toast.error('Failed to fetch users for MD assignment'); }
  };

  const handleRowClick = (item) => {
    setEmployee({
      UserId: item.UserId, Name: item.Name,
      Kmallowance: item.Kmallowance || '', Dayallowance: item.Dayallowance || '',
      CompanyID: item.CompanyID, BranchId: item.BranchId || '',
      UserRoleId: item.UserRoleId || '', ZoneId: item.ZoneId || '',
    });
    setSelectedMdUsers(
      item.AllocatedUser
        ? item.AllocatedUser.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id))
        : []
    );
    setIsUpdateDisabled(false);
    setShowMdDropdown(false);
    setShowForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateAllFields()) return;
    const CompanyID = sessionStorage.getItem("CompanyID");
    const updatedEmployee = {
      CompanyID: parseInt(CompanyID, 10),
      UserId: employee.UserId,
      Kmallowance: employee.Kmallowance,
      Dayallowance: employee.Dayallowance,
      BranchId: employee.BranchId,
      UserRoleId: employee.UserRoleId,
      ZoneId: employee.ZoneId,
      AllocatedUser: Number(employee.UserRoleId) === 3 ? selectedMdUsers.join(',') : ''
    };
    try {
      setLoadingUpdate(true);
      const response = await api.post('api/updateUserDetails', updatedEmployee);
      if (response.data.success) {
        toast.success('User allowance updated successfully!');
        fetchData(); fetchAllUsers(); setSelectedMdUsers([]);
        setShowForm(false); handleClear();
      } else {
        toast.error(response.data.message || 'Update failed.');
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Update request failed.'); }
    finally { setLoadingUpdate(false); }
  };

  const handleClear = () => {
    setEmployee({ UserId: 0, Name: '', Kmallowance: '', Dayallowance: '', CompanyID: '', BranchId: '', UserRoleId: '', ZoneId: '' });
    setSelectedMdUsers([]);
    setShowMdDropdown(false);
    setIsUpdateDisabled(true);
    setSearchTerm('');
    setFieldErrors({});
    toast.dismiss();
  };

  const handleBackToList = () => { setShowForm(false); handleClear(); };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEmployee(prev => ({ ...prev, [name]: value }));
    if (name === "UserRoleId" && parseInt(value, 10) !== 3) {
      setSelectedMdUsers([]); setShowMdDropdown(false);
    }
  };

  const handleMdUserSelect = (userId) => {
    const id = parseInt(userId, 10);
    if (id && !selectedMdUsers.includes(id)) setSelectedMdUsers(prev => [...prev, id]);
    setShowMdDropdown(false);
  };

  const removeMdUser = (userIdToRemove) => {
    setSelectedMdUsers(prev => prev.filter(id => id !== userIdToRemove));
  };

  const validateForm = (name, value) => {
    let error = '';
    switch (name) {
      case 'BranchId': if (!value) error = 'Branch is required'; break;
      case 'ZoneId': if (!value) error = 'Zone is required'; break;
      case 'UserRoleId': if (!value) error = 'User role is required'; break;
      case 'Kmallowance': if (value !== '' && isNaN(value)) error = 'Km Allowance must be a number'; break;
      case 'Dayallowance': if (value !== '' && isNaN(value)) error = 'Day Allowance must be a number'; break;
      default: break;
    }
    if (error) { toast.dismiss(name); toast.warning(error, { toastId: name }); }
    else toast.dismiss(name);
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateAllFields = () => {
    const errors = {};
    if (!employee.BranchId) errors.BranchId = "Branch is required";
    if (!employee.ZoneId) errors.ZoneId = "Zone is required";
    if (!employee.UserRoleId) errors.UserRoleId = "User role is required";
    if (employee.Kmallowance !== '' && isNaN(employee.Kmallowance)) errors.Kmallowance = "Km Allowance must be a number";
    if (employee.Dayallowance !== '' && isNaN(employee.Dayallowance)) errors.Dayallowance = "Day Allowance must be a number";
    setFieldErrors(errors);
    Object.entries(errors).forEach(([field, message]) => toast.error(message, { toastId: field }));
    return Object.keys(errors).length === 0;
  };

  const availableMdUsers = allUsers.filter(user =>
    user.UserRoleId !== 3 && !selectedMdUsers.includes(user.UserId)
  );

  const filteredEmployeeData = employeeData.filter((item) =>
    (item.Name || '').toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div className="page-wrapper" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="page-body mt-1">
        <div className="container-fluid px-4">
          <ToastContainer position="top-center" autoClose={3000} />

          {duplicateError && (
            <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
              {duplicateError}
              <button type="button" className="btn-close" onClick={() => setDuplicateError('')}></button>
            </div>
          )}

          {!showForm ? (
            /* ══════════════ LIST VIEW ══════════════ */
            <>
              {/* Header card */}
              <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <div className="card-body p-4">
                  <h2 className="mb-3" style={{ fontWeight: '600', color: '#2d3748', fontSize: '28px' }}>
                    <FaUserCog className="me-2" style={{ color: primaryColor }} />
                    User Details
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
                          placeholder="Search by name..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={{ backgroundColor: '#fff', borderColor: '#e2e8f0', height: '45px', fontSize: '14px' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employee list card */}
              <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <div className="card-body p-0">
                  {loading ? (
                    <div className="text-center p-5">
                      <div className="spinner-border" role="status" style={{ color: primaryColor }}>
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-3 text-muted">Loading employees...</p>
                    </div>
                  ) : (
                    <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                      <table className="table table-hover mb-0">
                        <thead className="bg-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                          <tr>
                            <th className="py-3 px-4" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>Name</th>
                            <th className="py-3" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>Branch</th>
                            <th className="py-3" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>Km Allowance</th>
                            <th className="py-3" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>Day Allowance</th>
                            <th className="py-3" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>Mobile</th>
                            <th className="py-3" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>Zone</th>
                            <th className="py-3" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>User Role</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEmployeeData.length > 0 ? filteredEmployeeData.map(emp => (
                            <tr
                              key={emp.UserId}
                              onClick={() => handleRowClick(emp)}
                              style={{
                                cursor: 'pointer', transition: 'all 0.2s',
                                borderLeft: employee.UserId === emp.UserId ? `4px solid ${primaryColor}` : '4px solid transparent'
                              }}
                              className="align-middle"
                            >
                              <td className="py-3 px-4">
                                <div className="d-flex align-items-center">
                                  <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3"
                                    style={{ width: '36px', height: '36px' }}>
                                    <FaUser style={{ color: primaryColor, fontSize: '15px' }} />
                                  </div>
                                  <span className="fw-medium">{emp.Name}</span>
                                </div>
                              </td>
                              <td className="py-3" style={{ color: '#4a5568' }}>
                                <FaBuilding className="me-2" style={{ color: '#4299e1', fontSize: '13px' }} />
                                {branches.find(b => b.BranchId === emp.BranchId)?.BranchName || 'N/A'}
                              </td>
                              <td className="py-3" style={{ color: '#4a5568' }}>
                                <FaRoad className="me-2" style={{ color: '#48bb78', fontSize: '13px' }} />
                                {emp.Kmallowance || 0}
                              </td>
                              <td className="py-3" style={{ color: '#4a5568' }}>
                                <FaCalendarDay className="me-2" style={{ color: '#ed8936', fontSize: '13px' }} />
                                {emp.Dayallowance || 0}
                              </td>
                              <td className="py-3" style={{ color: '#4a5568' }}>
                                <FaPhone className="me-2" style={{ color: '#f56565', fontSize: '13px' }} />
                                {emp.Mobile || 'N/A'}
                              </td>
                              <td className="py-3" style={{ fontSize: '13px', fontWeight: '500' }}>
                                  {Zone.find(z => z.ZoneId === emp.ZoneId)?.ZoneName || 'N/A'}
                               
                              </td>
                              <td className="py-3" style={{ fontSize: '13px', fontWeight: '500' }}>
                                  {UserRole.find(r => r.RoleID === emp.UserRoleId)?.RoleName || 'N/A'}
                                
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan="7" className="text-center p-5">
                                <FaUsers className="mb-3" style={{ fontSize: '48px', color: '#cbd5e0' }} />
                                <p className="text-muted">
                                  {employeeData.length === 0 ? "No employees found" : "No matching employees found"}
                                </p>
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
            /* ══════════════ FORM VIEW ══════════════ */
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              {/* Form header */}
              <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-0"
                style={{ borderBottom: '1px solid #e2e8f0' }}>
                <h4 className="m-0" style={{ color: '#2d3748', fontWeight: '600', fontSize: '18px' }}>
                  <FaUserCog className="me-2" style={{ color: primaryColor }} />
                  Employee Allowance Configuration
                </h4>
                <button
                  className="btn d-flex align-items-center gap-2"
                  onClick={handleBackToList}
                  style={{ borderRadius: '5px', padding: '8px 16px', fontSize: '14px', background: 'transparent', border: `2px solid ${primaryColor}`, color: primaryColor }}
                >
                  <FaArrowLeft /> Back to List
                </button>
              </div>

              <div className="card-body p-4">
                <form onSubmit={handleUpdate}>
                  <div className="row g-4">

                    {/* Left card: Basic Info */}
                    <div className="col-md-6">
                      <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '10px' }}>
                        <div className="card-header bg-white"
                          style={{ borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: primaryColor }}>
                          <FaUser className="me-2" />Employee Information
                        </div>
                        <div className="card-body p-3">

                          {/* Name (readonly) */}
                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">Employee Name</label>
                            <div className="input-group">
                              <span className="input-group-text text-white" style={{ backgroundColor: primaryColor }}>
                                <FaUser />
                              </span>
                              <input
                                type="text"
                                className="form-control"
                                value={employee.Name}
                                readOnly
                                style={{ backgroundColor: '#f8fafc', fontWeight: '500' }}
                              />
                            </div>
                          </div>

                          {/* Branch */}
                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">Branch <span className="text-danger">*</span></label>
                            <select
                              name="BranchId"
                              className={`form-select ${fieldErrors['BranchId'] ? 'is-invalid' : ''}`}
                              value={employee.BranchId}
                              onBlur={(e) => validateForm(e.target.name, e.target.value)}
                              onChange={handleInputChange}
                            >
                              <option value="">Select Branch</option>
                              {branches.map(branch => (
                                <option key={branch.BranchId} value={branch.BranchId}>{branch.BranchName}</option>
                              ))}
                            </select>
                            {fieldErrors['BranchId'] && <div className="invalid-feedback">{fieldErrors['BranchId']}</div>}
                          </div>

                          {/* Zone */}
                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">Zone <span className="text-danger">*</span></label>
                            <select
                              name="ZoneId"
                              className={`form-select ${fieldErrors['ZoneId'] ? 'is-invalid' : ''}`}
                              value={employee.ZoneId}
                              onBlur={(e) => validateForm(e.target.name, e.target.value)}
                              onChange={handleInputChange}
                            >
                              <option value="">Select Zone</option>
                              {Zone.map(z => (
                                <option key={z.ZoneId} value={z.ZoneId}>{z.ZoneName}</option>
                              ))}
                            </select>
                            {fieldErrors['ZoneId'] && <div className="invalid-feedback">{fieldErrors['ZoneId']}</div>}
                          </div>

                          {/* User Role */}
                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">User Role <span className="text-danger">*</span></label>
                            <select
                              name="UserRoleId"
                              className={`form-select ${fieldErrors['UserRoleId'] ? 'is-invalid' : ''}`}
                              value={employee.UserRoleId}
                              onBlur={(e) => validateForm(e.target.name, e.target.value)}
                              onChange={handleInputChange}
                            >
                              <option value="">Select User Role</option>
                              {UserRole.map(role => (
                                <option key={role.RoleID} value={role.RoleID}>{role.RoleName}</option>
                              ))}
                            </select>
                            {fieldErrors['UserRoleId'] && <div className="invalid-feedback">{fieldErrors['UserRoleId']}</div>}
                          </div>

                        </div>
                      </div>
                    </div>

                    {/* Right card: Allowances */}
                    <div className="col-md-6">
                      <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '10px' }}>
                        <div className="card-header bg-white"
                          style={{ borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: primaryColor }}>
                          <FaRoad className="me-2" />Allowance Details
                        </div>
                        <div className="card-body p-3">

                          {/* Km Allowance */}
                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">Km Allowance</label>
                            <div className="input-group">
                              <span className="input-group-text text-white" style={{ backgroundColor: primaryColor }}>
                                <FaRoad />
                              </span>
                              <input
                                type="text"
                                name="Kmallowance"
                                className={`form-control ${fieldErrors['Kmallowance'] ? 'is-invalid' : ''}`}
                                onBlur={(e) => validateForm(e.target.name, e.target.value)}
                                value={employee.Kmallowance}
                                onChange={handleInputChange}
                                placeholder="Enter km allowance"
                              />
                              {fieldErrors['Kmallowance'] && <div className="invalid-feedback">{fieldErrors['Kmallowance']}</div>}
                            </div>
                          </div>

                          {/* Day Allowance */}
                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">Day Allowance</label>
                            <div className="input-group">
                              <span className="input-group-text text-white" style={{ backgroundColor: primaryColor }}>
                                <FaCalendarDay />
                              </span>
                              <input
                                type="text"
                                name="Dayallowance"
                                className={`form-control ${fieldErrors['Dayallowance'] ? 'is-invalid' : ''}`}
                                onBlur={(e) => validateForm(e.target.name, e.target.value)}
                                value={employee.Dayallowance}
                                onChange={handleInputChange}
                                placeholder="Enter day allowance"
                              />
                              {fieldErrors['Dayallowance'] && <div className="invalid-feedback">{fieldErrors['Dayallowance']}</div>}
                            </div>
                          </div>

                          {/* Users under MD */}
                          {Number(employee.UserRoleId) === 3 && (
                            <div className="mb-3">
                              <label className="form-label fw-medium mb-2">
                                <FaUsers className="me-1" />Users under MD
                              </label>
                              <div className="md-custom-dropdown" style={{ position: 'relative' }}>
                                {/* Chip box */}
                                <div
                                  className="form-control d-flex flex-wrap align-items-center gap-2"
                                  style={{
                                    minHeight: '44px', padding: '6px 10px',
                                    cursor: 'pointer', borderColor: '#dee2e6', backgroundColor: 'white'
                                  }}
                                  onClick={(e) => { e.stopPropagation(); setShowMdDropdown(!showMdDropdown); }}
                                >
                                  {selectedMdUsers.length === 0 && (
                                    <span className="text-muted" style={{ fontSize: '14px' }}>
                                      <FaUsers className="me-2" />Select users to assign...
                                    </span>
                                  )}
                                  {selectedMdUsers.map(userId => {
                                    const user = allUsers.find(u => u.UserId === userId);
                                    return user ? (
                                      <span
                                        key={userId}
                                        className="d-inline-flex align-items-center"
                                        style={{
                                          border: `1.5px solid ${primaryColor}`,
                                          borderRadius: '20px', padding: '3px 10px',
                                          backgroundColor: 'rgba(45,75,169,0.07)', fontSize: '13px'
                                        }}
                                      >
                                        <FaUser className="me-1" style={{ color: primaryColor, fontSize: '11px' }} />
                                        <span style={{ color: '#2d3748', fontWeight: '500' }}>{user.Name}</span>
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); removeMdUser(userId); }}
                                          style={{
                                            border: 'none', background: 'transparent',
                                            color: primaryColor, fontSize: '16px',
                                            marginLeft: '6px', cursor: 'pointer',
                                            lineHeight: 1, fontWeight: 'bold', padding: 0
                                          }}
                                        >×</button>
                                      </span>
                                    ) : null;
                                  })}
                                </div>

                                {/* Dropdown */}
                                {showMdDropdown && (
                                  <div
                                    className="bg-white shadow-sm"
                                    style={{
                                      position: 'absolute', top: '100%', left: 0, width: '100%',
                                      maxHeight: '220px', overflowY: 'auto', zIndex: 1000,
                                      marginTop: '4px', borderRadius: '8px',
                                      border: '1px solid #e2e8f0'
                                    }}
                                  >
                                    {availableMdUsers.length === 0 ? (
                                      <div className="text-center p-4 text-muted" style={{ fontSize: '14px' }}>
                                        <FaUsers className="mb-2" style={{ fontSize: '24px', color: '#cbd5e0' }} />
                                        <p className="mb-0">No users available</p>
                                      </div>
                                    ) : availableMdUsers.map(user => (
                                      <div
                                        key={user.UserId}
                                        className="d-flex align-items-center px-3 py-2"
                                        style={{ cursor: 'pointer', borderBottom: '1px solid #f0f4f8', transition: 'background 0.15s' }}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(45,75,169,0.05)'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                        onClick={(e) => { e.stopPropagation(); handleMdUserSelect(user.UserId); }}
                                      >
                                        <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3"
                                          style={{ width: '32px', height: '32px', flexShrink: 0 }}>
                                          <FaUser style={{ color: primaryColor, fontSize: '13px' }} />
                                        </div>
                                        <div>
                                          <div className="fw-medium" style={{ fontSize: '14px' }}>{user.Name}</div>
                                          <small className="text-muted">
                                            {branches.find(b => b.BranchId === user.BranchId)?.BranchName || 'No branch'}
                                          </small>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="row mt-4">
                    <div className="col-12">
                      <div className="d-flex justify-content-center flex-wrap gap-3">

                        <button
                          type="submit"
                          className="btn px-4 d-flex align-items-center gap-2"
                          style={outlineBtn}
                          disabled={isUpdateDisabled || loadingUpdate}
                        >
                          {loadingUpdate
                            ? <><span className="spinner-border spinner-border-sm" /> Updating...</>
                            : <><FaSave /> Update</>}
                        </button>

                        <button
                          type="button"
                          className="btn px-4 d-flex align-items-center gap-2"
                          style={outlineBtn}
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

export default UserDetails;