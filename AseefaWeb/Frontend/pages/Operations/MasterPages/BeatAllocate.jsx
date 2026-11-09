import React, { useState, useEffect } from "react";
import api from '../../apiService';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import { 
  FaRoute, FaPlus, FaSave, FaEraser, FaTrashAlt,
  FaMapMarkerAlt, FaUser, FaBullseye, FaEdit
} from "react-icons/fa";

const daysOfWeek = ["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"];

const primaryColor = 'rgb(45, 75, 169)';

const EmployeeRouteSettings = () => {
  const [employeeList, setEmployeeList] = useState([]);
  const [routeList, setRouteList] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [target, setTarget] = useState("");
  const [rows, setRows] = useState([]);
  const [savedRows, setSavedRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const CompanyID = parseInt(sessionStorage.getItem("CompanyID"));
  const userId = sessionStorage.getItem("UserId") || "0";

  useEffect(() => {
    loadDropdowns();
  }, []);

  const loadDropdowns = async () => {
    setIsLoading(true);
    try {
      const empRes = await api.get(`/api/webGetUserByRole?CompanyID=${CompanyID}`);
      setEmployeeList(empRes.data);
      const routeRes = await api.get(`/api/WebGetRootMastername?CompanyID=${CompanyID}`);
      setRouteList(routeRes.data.data || []);
    } catch (err) {
      toast.error("Failed to load dropdown data");
    } finally {
      setIsLoading(false);
    }
  };

  const addRow = () => {
    setRows([...rows, { rootID: "", days: [], ex: false, isNew: true }]);
  };

  const deleteRow = async (index) => {
    const rowToDelete = rows[index];
    const confirmDelete = window.confirm("Are you sure you want to delete this route?");
    if (!confirmDelete) return;

    if (!rowToDelete.rootID) {
      setRows(rows.filter((_, i) => i !== index));
      return;
    }

    try {
      setIsLoading(true);
      await api.post("/api/WebDeleteEmpRoute", {
        EmpID: parseInt(selectedEmployee),
        CompanyID,
        RootID: parseInt(rowToDelete.rootID),
        DeletedBy: parseInt(userId)
      });
      toast.success("Route deleted successfully");
      await fetchExistingRoutesForEmployee(selectedEmployee);
      if (!rowToDelete.isNew) {
        setRows(rows.filter((_, i) => i !== index));
      }
    } catch (err) {
      toast.error("Failed to delete route");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSavedRow = async (row) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this route?");
    if (!confirmDelete) return;
    try {
      setIsLoading(true);
      await api.post("/api/WebDeleteEmpRoute", {
        EmpID: parseInt(selectedEmployee),
        CompanyID: parseInt(CompanyID),
        RootID: parseInt(row.rootID),
        DeletedBy: parseInt(userId)
      });
      toast.success("Route deleted successfully");
      await fetchExistingRoutesForEmployee(selectedEmployee);
    } catch (err) {
      toast.error("Failed to delete route");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    if (updated[index].slno && !updated[index].isNew) updated[index].isModified = true;
    setRows(updated);
  };

  const toggleDay = (index, dayIndex) => {
    const updated = [...rows];
    const day = daysOfWeek[dayIndex];
    const currentDays = updated[index].days;
    updated[index].days = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    if (updated[index].slno && !updated[index].isNew) updated[index].isModified = true;
    setRows(updated);
  };

  const fetchExistingRoutesForEmployee = async (empId) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/api/WebGetEmpRoute?CompanyID=${CompanyID}&EmpID=${empId}`);
      const validRoutes = (res.data.data || []).filter(
        item => item.IsDeleted === 0 || item.IsDeleted === null
      );
      const mappedRows = validRoutes.map(item => {
        const days = [];
        if (item.Mon) days.push("Mon");
        if (item.Tue) days.push("Tue");
        if (item.Wed) days.push("Wed");
        if (item.Thur) days.push("Thur");
        if (item.Friday) days.push("Fri");
        if (item.Sat) days.push("Sat");
        if (item.Sun) days.push("Sun");
        return { slno: item.SlNo, rootID: item.RootID, days, ex: item.Ex === 1, target: item.Target };
      });
      setSavedRows(mappedRows);
      setRows(mappedRows.map(r => ({ slno: r.slno, rootID: r.rootID, days: r.days, ex: r.ex, isNew: false })));
      if (mappedRows.length > 0) setTarget(mappedRows[0].target);
      else setTarget("");
      setIsEditing(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEmployee) fetchExistingRoutesForEmployee(selectedEmployee);
    else setSavedRows([]);
  }, [selectedEmployee]);

  const validateForm = () => {
    if (!selectedEmployee) { toast.warning("Please select a Sales Representative"); return false; }
    if (rows.length === 0) { toast.warning("Please add at least one route"); return false; }
    if (!target || isNaN(target) || parseFloat(target) <= 0) { toast.warning("Please enter a valid target amount"); return false; }
    const rootIds = rows.map(r => r.rootID).filter(Boolean);
    if (new Set(rootIds).size !== rootIds.length) { toast.error("Can't select the same route twice"); return false; }
    for (const row of rows) {
      if (!row.rootID) { toast.warning("Please select a route for all rows"); return false; }
      if (row.days.length === 0) { toast.warning("Please select at least one day for each route"); return false; }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    const payload = rows.map(row => {
      const dayFlags = {};
      daysOfWeek.forEach(day => { dayFlags[day] = row.days.includes(day) ? 1 : 0; });
      const isNew = !row.slno || row.slno === 0;
      return {
        SlNo: row.slno || 0,
        EmpID: parseInt(selectedEmployee),
        RootID: parseInt(row.rootID),
        Target: parseFloat(target),
        Ex: row.ex ? 1 : 0,
        IsDeleted: 0,
        CompanyID,
        CreatedBy: isNew ? parseInt(userId) : null,
        CreatedDate: isNew ? new Date().toISOString() : null,
        ModifiedBy: parseInt(userId),
        ModifiedDate: new Date().toISOString(),
        ...dayFlags
      };
    });
    try {
      setIsLoading(true);
      await api.post("/api/WebInsertUpdateEmpRoute", payload);
      toast.success("Saved successfully");
      await fetchExistingRoutesForEmployee(selectedEmployee);
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setRows([]);
    setSavedRows([]);
    setSelectedEmployee("");
    setTarget("");
    setIsEditing(false);
  };

  const handleEditSavedRow = (row) => {
    setIsEditing(true);
    setRows([{ slno: row.slno, rootID: row.rootID, days: row.days, ex: row.ex, isNew: false }]);
    setTarget(row.target);
  };

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: '6px',
      border: `1px solid ${state.isFocused ? primaryColor : '#dee2e6'}`,
      boxShadow: state.isFocused ? `0 0 0 0.2rem rgba(45, 75, 169, 0.15)` : 'none',
      minHeight: '38px',
      '&:hover': { border: `1px solid ${primaryColor}` }
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? primaryColor : state.isFocused ? 'rgba(45, 75, 169, 0.08)' : 'white',
      color: state.isSelected ? 'white' : '#2d3748',
      cursor: 'pointer'
    }),
    indicatorSeparator: () => ({ display: 'none' })
  };

  return (
    <div className="page-wrapper" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="page-body mt-1">
        <div className="container-fluid px-4">
          <ToastContainer position="top-center" autoClose={3000} />

          {/* Header Card */}
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="card-body p-4">
              <h2 className="mb-3" style={{ fontWeight: '600', color: '#2d3748', fontSize: '28px' }}>
                <FaRoute className="me-2" style={{ color: primaryColor }} />
                Employee Beat Plan
              </h2>
            </div>
          </div>

          {/* Main Form Card */}
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div
              className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center"
              style={{ borderBottom: '1px solid #e2e8f0' }}
            >
              <h4 className="m-0" style={{ color: '#2d3748', fontWeight: '600', fontSize: '18px' }}>
                <FaMapMarkerAlt className="me-2" style={{ color: primaryColor }} />
                Route Configuration
              </h4>
              {isEditing && (
                <span
                  className="badge"
                  style={{
                    backgroundColor: 'rgba(45, 75, 169, 0.1)',
                    color: primaryColor,
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontWeight: '600',
                    fontSize: '13px',
                    border: `1px solid rgba(45, 75, 169, 0.3)`
                  }}
                >
                  <FaEdit className="me-1" /> Editing Mode
                </span>
              )}
            </div>

            <div className="card-body p-4">
              <div className="row g-4 mb-4">
                {/* Left: Basic Info Card */}
                <div className="col-md-6">
                  <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '10px' }}>
                    <div
                      className="card-header bg-white"
                      style={{ borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: primaryColor }}
                    >
                      <FaUser className="me-2" />
                      Sales Representative
                    </div>
                    <div className="card-body p-3">
                      <label className="form-label fw-medium mb-2">Select Employee</label>
                      <Select
  classNamePrefix="select"
  isDisabled={isLoading}
  isLoading={isLoading}
  options={employeeList.map((emp) => ({
    value: emp.UserID,
    label: emp.USERNAME
  }))}
  value={
    employeeList
      .map((emp) => ({
        value: emp.UserID,
        label: emp.USERNAME
      }))
      .find((opt) => opt.value === selectedEmployee) || null
  }
  onChange={(opt) => setSelectedEmployee(opt ? Number(opt.value) : "")}
  placeholder="Search or select representative..."

  /* ✅ Only ONE styles prop */
  styles={{
    ...customSelectStyles,
    menuPortal: (base) => ({ ...base, zIndex: 9999 })
  }}

  menuPortalTarget={document.body}
  menuPosition="fixed"
/>
                    </div>
                  </div>
                </div>

                {/* Right: Target Card */}
                <div className="col-md-6">
                  <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '10px' }}>
                    <div
                      className="card-header bg-white"
                      style={{ borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: primaryColor }}
                    >
                      <FaBullseye className="me-2" />
                      Target Information
                    </div>
                    <div className="card-body p-3">
                      <label className="form-label fw-medium mb-2">Target Amount</label>
                      <div className="input-group">
                        <span
                          className="input-group-text text-white"
                          style={{ backgroundColor: primaryColor }}
                        >
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="form-control"
                          value={target}
                          onChange={(e) => setTarget(e.target.value)}
                          disabled={isLoading}
                          placeholder="0.00"
                          style={{ borderColor: '#dee2e6' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Route Assignments */}
              <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                <div
                  className="card-header bg-white d-flex justify-content-between align-items-center"
                  style={{ borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: primaryColor }}
                >
                  <span>
                    <FaRoute className="me-2" />
                    Route Assignments
                  </span>
                  <button
                    type="button"
                    onClick={addRow}
                    disabled={isLoading || !selectedEmployee}
                    className="btn d-flex align-items-center gap-2"
                    style={{
                      borderRadius: '5px',
                      padding: '6px 16px',
                      background: primaryColor,
                      border: 'none',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    <FaPlus /> Add Route
                  </button>
                </div>

                <div className="card-body p-0">
                  {isLoading ? (
                    <div className="text-center p-5">
                      <div className="spinner-border" role="status" style={{ color: primaryColor }}>
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-3 text-muted">Loading routes...</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="table table-hover mb-0">
                        <thead className="bg-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                          <tr>
                            <th className="py-3 px-4" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px', minWidth: '180px' }}>
                              Route
                            </th>
                            {daysOfWeek.map((day) => (
                              <th key={day} className="text-center py-3" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>
                                {day}
                              </th>
                            ))}
                            <th className="text-center py-3" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>Ex</th>
                            <th className="text-center py-3" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.length === 0 ? (
                            <tr>
                              <td colSpan={11} className="text-center p-5">
                                <FaRoute className="mb-3" style={{ fontSize: '48px', color: '#cbd5e0' }} />
                                <p className="text-muted mb-3">No routes added yet</p>
                                <button
                                  className="btn"
                                  onClick={addRow}
                                  disabled={!selectedEmployee}
                                  style={{
                                    borderRadius: '5px',
                                    padding: '10px 24px',
                                    background: primaryColor,
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '14px'
                                  }}
                                >
                                  <FaPlus className="me-2" />
                                  Add Route
                                </button>
                              </td>
                            </tr>
                          ) : (
                            rows.map((row, idx) => (
                              <tr
                                key={idx}
                                className="align-middle"
                                style={{
                                  borderLeft: row.isModified
                                    ? `4px solid #f6ad55`
                                    : '4px solid transparent',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <td className="px-4">
                                  <select
                                    className="form-select form-select-sm"
                                    value={row.rootID}
                                    disabled={!selectedEmployee || isLoading}
                                    onChange={(e) => handleRowChange(idx, "rootID", Number(e.target.value))}
                                    style={{ borderColor: '#dee2e6', borderRadius: '6px', fontSize: '14px' }}
                                  >
                                    <option value="">Select Route</option>
                                    {routeList.map((r) => (
                                      <option key={r.RootId} value={r.RootId}>{r.RootName}</option>
                                    ))}
                                  </select>
                                </td>
                                {daysOfWeek.map((day, dayIdx) => (
                                  <td key={day} className="text-center align-middle">
                                    <div
                                      onClick={() => !isLoading && toggleDay(idx, dayIdx)}
                                      style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '6px',
                                        border: `2px solid ${row.days.includes(day) ? primaryColor : '#dee2e6'}`,
                                        backgroundColor: row.days.includes(day) ? primaryColor : 'transparent',
                                        cursor: isLoading ? 'not-allowed' : 'pointer',
                                        margin: '0 auto',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.15s'
                                      }}
                                    >
                                      {row.days.includes(day) && (
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                      )}
                                    </div>
                                  </td>
                                ))}
                                <td className="text-center align-middle">
                                  <div
                                    onClick={() => !isLoading && handleRowChange(idx, "ex", !row.ex)}
                                    style={{
                                      width: '28px',
                                      height: '28px',
                                      borderRadius: '6px',
                                      border: `2px solid ${row.ex ? primaryColor : '#dee2e6'}`,
                                      backgroundColor: row.ex ? primaryColor : 'transparent',
                                      cursor: isLoading ? 'not-allowed' : 'pointer',
                                      margin: '0 auto',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.15s'
                                    }}
                                  >
                                    {row.ex && (
                                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    )}
                                  </div>
                                </td>
                                <td className="text-center align-middle">
                                  <button
                                    onClick={() => deleteRow(idx)}
                                    disabled={isLoading}
                                    className="btn btn-sm d-flex align-items-center gap-1 mx-auto"
                                    style={{
                                      borderRadius: '5px',
                                      padding: '5px 12px',
                                      background: 'transparent',
                                      border: '1.5px solid #e53e3e',
                                      color: '#e53e3e',
                                      fontSize: '13px',
                                      fontWeight: '500'
                                    }}
                                  >
                                    <FaTrashAlt style={{ fontSize: '11px' }} /> Delete
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex justify-content-center flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isLoading}
                  className="btn px-4 d-flex align-items-center gap-2"
                  style={{
                    minWidth: '120px',
                    borderRadius: '5px',
                    fontWeight: '500',
                    background: 'transparent',
                    border: `2px solid ${primaryColor}`,
                    color: primaryColor,
                    padding: '10px 20px',
                    fontSize: '14px'
                  }}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" />
                      {isEditing ? "Updating..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <FaSave /> {isEditing ? "Update" : "Save"}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isLoading || (rows.length === 0 && !selectedEmployee && !target)}
                  className="btn px-4 d-flex align-items-center gap-2"
                  style={{
                    minWidth: '120px',
                    borderRadius: '5px',
                    fontWeight: '500',
                    background: 'transparent',
                    border: `2px solid ${primaryColor}`,
                    color: primaryColor,
                    padding: '10px 20px',
                    fontSize: '14px'
                  }}
                >
                  <FaEraser /> Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeRouteSettings;