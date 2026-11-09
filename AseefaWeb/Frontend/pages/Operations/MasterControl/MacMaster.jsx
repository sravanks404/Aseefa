import React, { useState, useEffect } from 'react';
import api from '../../apiService';
import Select from 'react-select';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaWifi, FaSearch, FaPlus, FaUser, FaNetworkWired,
  FaComment, FaSave, FaEdit, FaTrashAlt, FaEraser,
  FaArrowLeft, FaBluetooth, FaToggleOn, FaToggleOff
} from "react-icons/fa";

const primaryColor = 'rgb(45, 75, 169)';

const outlineBtn = {
  borderRadius: '5px', fontWeight: '500',
  background: 'transparent', border: `2px solid ${primaryColor}`,
  color: primaryColor, padding: '10px 20px', fontSize: '14px', minWidth: '120px'
};

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderRadius: '6px',
    border: `1px solid ${state.isFocused ? primaryColor : '#dee2e6'}`,
    boxShadow: state.isFocused ? `0 0 0 0.2rem rgba(45,75,169,0.15)` : 'none',
    minHeight: '38px',
    '&:hover': { border: `1px solid ${primaryColor}` }
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? primaryColor : state.isFocused ? 'rgba(45,75,169,0.08)' : 'white',
    color: state.isSelected ? 'white' : '#2d3748',
    cursor: 'pointer'
  }),
  indicatorSeparator: () => ({ display: 'none' })
};

function MacManagement() {
  const [loading, setLoading] = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [macAddresses, setMacAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [macData, setMacData] = useState({
    Id: 0, Bluetooth: '', UserId: 0, Active: 1,
    CompanyID: '', Remark: '', CreatedBy: 0, ModifiedBy: 0
  });

  useEffect(() => {
    fetchUsers();
    fetchMac();
  }, []);

  const fetchUsers = async () => {
    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      if (!CompanyID) return;
      const response = await api.get("/api/GetUser", { params: { CompanyID } });
      setUsers(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMac = async () => {
    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      if (!CompanyID) return;
      setLoading(true);
      const response = await api.get("/api/GetMac", { params: { CompanyID } });
      if (!response.data || !Array.isArray(response.data.data)) throw new Error("No data received");
      const formattedData = response.data.data.map((item) => ({
        Id: item.Id, Bluetooth: item.Bluetooth || '',
        UserId: item.UserID || 0, Active: item.Active ? 1 : 0,
        Remark: item.Remark || '', Name: item.USERNAME || 'N/A', CompanyID
      }));
      setMacAddresses(formattedData);
    } catch (err) {
      toast.error(`Failed to fetch MAC addresses: ${err.message}`);
      setMacAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (item) => {
    setMacData({
      Id: item.Id, Bluetooth: item.Bluetooth || '',
      UserId: item.UserId || 0, Active: item.Active ? 1 : 0,
      CompanyID: item.CompanyID || sessionStorage.getItem("CompanyID"),
      Remark: item.Remark || '', CreatedBy: 0, ModifiedBy: 0
    });
    setIsSubmitDisabled(true);
    setIsUpdateDisabled(false);
    setShowForm(true);
  };

  const handleInsert = async (e) => {
    e.preventDefault();
    const CompanyID = sessionStorage.getItem("CompanyID");
    const userId = sessionStorage.getItem("UserId");
    const data = {
      Id: 0, Bluetooth: macData.Bluetooth, UserId: macData.UserId,
      Active: macData.Active, Remark: macData.Remark,
      CompanyID: parseInt(CompanyID, 10), CreatedBy: parseInt(userId, 10), IsDeleted: 0
    };
    try {
      setLoading(true);
      const response = await api.post('/api/insertUpdateMAC', data);
      if (response.data.success) {
        toast.success("MAC address added successfully");
        fetchMac(); resetForm(); setShowForm(false);
      } else {
        toast.error("Insert failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Insert error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!macData.Id) { toast.error("Please select a MAC to update"); return; }
    const CompanyID = sessionStorage.getItem("CompanyID");
    const userId = sessionStorage.getItem("UserId");
    const data = {
      Id: macData.Id, Bluetooth: macData.Bluetooth, UserId: macData.UserId,
      Active: macData.Active, Remark: macData.Remark,
      CompanyID: parseInt(CompanyID, 10), ModifiedBy: parseInt(userId, 10),
      CreatedBy: parseInt(userId, 10), IsDeleted: 0
    };
    try {
      setLoading(true);
      const response = await api.post('/api/insertUpdateMAC', data);
      if (response.data.success) {
        toast.success("MAC address updated successfully");
        fetchMac(); resetForm(); setShowForm(false);
      } else {
        toast.error("Update failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Update error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!macData.Id) { toast.error("Please select a MAC to delete."); return; }
    const confirm = await confirmDeleteToast();
    if (!confirm) return;
    const userId = sessionStorage.getItem("UserId");
    try {
      setLoading(true);
      const response = await api.post('/api/deleteMAC', { Id: macData.Id, DeletedBy: parseInt(userId, 10) });
      if (response.data.success) {
        toast.success('MAC address deleted successfully');
        fetchMac(); resetForm(); setShowForm(false);
      } else {
        toast.error(response.data.message || 'Delete failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete request failed');
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteToast = () => {
    return new Promise((resolve) => {
      const toastId = toast.warning(
        ({ closeToast }) => (
          <div>
            <div className="mb-2">Are you sure you want to delete this MAC address?</div>
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-danger btn-sm" onClick={() => { toast.dismiss(toastId); resolve(true); }}>Yes</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { toast.dismiss(toastId); resolve(false); }}>Cancel</button>
            </div>
          </div>
        ),
        { position: "top-center", autoClose: false, closeOnClick: false, draggable: false, closeButton: false, toastId: "confirm-delete" }
      );
    });
  };

  const resetForm = () => {
    setMacData({ Id: 0, Bluetooth: '', UserId: 0, Active: 0, CompanyID: '', Remark: '', CreatedBy: 0, ModifiedBy: 0 });
    setIsUpdateDisabled(true);
    setIsSubmitDisabled(false);
  };

  const handleClear = () => { resetForm(); setSearchTerm(''); toast.dismiss(); };
  const handleCreateNew = () => { resetForm(); setShowForm(true); };
  const handleBackToList = () => { setShowForm(false); handleClear(); };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMacData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setMacData(prev => ({ ...prev, [name]: checked ? 1 : 0 }));
  };

  const filteredMacAddresses = macAddresses.filter((item) => {
    const s = searchTerm.toLowerCase().trim();
    return (item.Bluetooth || '').toLowerCase().includes(s) || (item.Name || '').toLowerCase().includes(s);
  });

  const prefix = (Icon) => (
    <span className="input-group-text text-white" style={{ backgroundColor: primaryColor }}>
      <Icon />
    </span>
  );

  return (
    <div className="page-wrapper" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="page-body mt-1">
        <div className="container-fluid px-4">
          <ToastContainer position="top-center" autoClose={3000} />

          {!showForm ? (
            /* ══════════════ LIST VIEW ══════════════ */
            <>
              {/* Header card */}
              <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <div className="card-body p-4">
                  <h2 className="mb-3" style={{ fontWeight: '600', color: '#2d3748', fontSize: '28px' }}>
                    <FaWifi className="me-2" style={{ color: primaryColor }} />
                    MAC Master
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
                          placeholder="Search by MAC address or user..."
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

              {/* MAC list card */}
              <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <div className="card-body p-0">
                  {loading ? (
                    <div className="text-center p-5">
                      <div className="spinner-border" role="status" style={{ color: primaryColor }}>
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-3 text-muted">Loading MAC addresses...</p>
                    </div>
                  ) : (
                    <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                      <table className="table table-hover mb-0">
                        <thead className="bg-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                          <tr>
                            <th className="py-3 px-4" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>MAC Address</th>
                            <th className="py-3" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>User</th>
                            <th className="py-3" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>Status</th>
                            <th className="py-3" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>Remark</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMacAddresses.length > 0 ? filteredMacAddresses.map(mac => (
                            <tr
                              key={mac.Id}
                              onClick={() => handleRowClick(mac)}
                              style={{
                                cursor: 'pointer', transition: 'all 0.2s',
                                borderLeft: macData.Id === mac.Id ? `4px solid ${primaryColor}` : '4px solid transparent'
                              }}
                              className="align-middle"
                            >
                              <td className="py-3 px-4">
                                <div className="d-flex align-items-center">
                                  <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3"
                                    style={{ width: '36px', height: '36px' }}>
                                    <FaBluetooth style={{ color: primaryColor, fontSize: '15px' }} />
                                  </div>
                                  <span className="fw-medium font-monospace" style={{ fontSize: '14px' }}>{mac.Bluetooth}</span>
                                </div>
                              </td>
                              <td className="py-3" style={{ color: '#4a5568' }}>
                                <FaUser className="me-2" style={{ color: '#4299e1', fontSize: '13px' }} />
                                {mac.Name}
                              </td>
                              <td className="py-3">
                                <span className="badge" style={{
                                  backgroundColor: mac.Active ? '#48bb78' : '#a0aec0',
                                  padding: '6px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: '500'
                                }}>
                                  {mac.Active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="py-3" style={{ color: '#4a5568' }}>
                                <FaComment className="me-2" style={{ color: '#ed8936', fontSize: '13px' }} />
                                {mac.Remark || '—'}
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan="4" className="text-center p-5">
                                <FaWifi className="mb-3" style={{ fontSize: '48px', color: '#cbd5e0' }} />
                                <p className="text-muted mb-3">
                                  {macAddresses.length === 0 ? "No MAC addresses found" : "No matching MAC addresses found"}
                                </p>
                                <button className="btn" onClick={handleCreateNew}
                                  style={{ borderRadius: '5px', padding: '10px 24px', background: primaryColor, border: 'none', color: 'white', fontSize: '14px' }}>
                                  <FaPlus className="me-2" />Add MAC Address
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
            /* ══════════════ FORM VIEW ══════════════ */
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              {/* Form header */}
              <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-0"
                style={{ borderBottom: '1px solid #e2e8f0' }}>
                <h4 className="m-0" style={{ color: '#2d3748', fontWeight: '600', fontSize: '18px' }}>
                  <FaBluetooth className="me-2" style={{ color: primaryColor }} />
                  {macData.Id ? 'Edit MAC Address' : 'New MAC Address'}
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
                <form>
                  <div className="row g-4">

                    {/* Left card: MAC Configuration */}
                    <div className="col-md-6">
                      <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '10px' }}>
                        <div className="card-header bg-white"
                          style={{ borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: primaryColor }}>
                          <FaNetworkWired className="me-2" />MAC Configuration
                        </div>
                        <div className="card-body p-3">

                          {/* User */}
                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">User <span className="text-danger">*</span></label>
                            <Select
                              name="UserId"
                              value={users.find(u => u.UserId === macData.UserId)
                                ? { value: macData.UserId, label: users.find(u => u.UserId === macData.UserId)?.Name || 'Unknown' }
                                : null}
                              onChange={(selected) => setMacData(prev => ({ ...prev, UserId: selected?.value || 0 }))}
                              options={users.map(u => ({ value: u.UserId, label: u.Name }))}
                              placeholder="Select User"
                              isClearable
                              required
                              styles={customSelectStyles}
                            />
                          </div>

                          {/* MAC Address */}
                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">MAC Address <span className="text-danger">*</span></label>
                            <div className="input-group">
                              {prefix(FaNetworkWired)}
                              <input
                                type="text"
                                name="Bluetooth"
                                className="form-control"
                                value={macData.Bluetooth}
                                onChange={handleInputChange}
                                placeholder="e.g. 00:1A:2B:3C:4D:5E"
                                required
                                style={{ fontFamily: 'monospace', letterSpacing: '0.5px' }}
                              />
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>

                    {/* Right card: Additional Info */}
                    <div className="col-md-6">
                      <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '10px' }}>
                        <div className="card-header bg-white"
                          style={{ borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: primaryColor }}>
                          <FaComment className="me-2" />Additional Details
                        </div>
                        <div className="card-body p-3">

                          {/* Remark */}
                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">Remark</label>
                            <div className="input-group">
                              {prefix(FaComment)}
                              <input
                                type="text"
                                name="Remark"
                                className="form-control"
                                value={macData.Remark}
                                onChange={handleInputChange}
                                placeholder="Add a remark"
                              />
                            </div>
                          </div>

                          {/* Active toggle */}
                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2 d-block">Active Status</label>
                            <div
                              className="d-flex align-items-center gap-3 p-3"
                              style={{ borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}
                            >
                              <div className="form-check form-switch mb-0">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  name="Active"
                                  id="activeToggle"
                                  checked={!!macData.Active}
                                  onChange={handleCheckboxChange}
                                  style={{ width: '48px', height: '24px', cursor: 'pointer' }}
                                />
                              </div>
                              <label htmlFor="activeToggle" style={{ cursor: 'pointer', margin: 0 }}>
                                <span className="badge" style={{
                                  backgroundColor: macData.Active ? '#48bb78' : '#a0aec0',
                                  padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '500'
                                }}>
                                  {macData.Active ? 'Active' : 'Inactive'}
                                </span>
                              </label>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="row mt-4">
                    <div className="col-12">
                      <div className="d-flex justify-content-center flex-wrap gap-3">

                        <button className="btn px-4 d-flex align-items-center gap-2"
                          style={{ ...outlineBtn, opacity: (loading || macData.Id !== 0) ? 0.5 : 1 }}
                          onClick={handleInsert} disabled={loading || macData.Id !== 0}>
                          {loading
                            ? <><span className="spinner-border spinner-border-sm" /> Processing...</>
                            : <><FaSave /> Submit</>}
                        </button>

                        <button className="btn px-4 d-flex align-items-center gap-2"
                          style={{ ...outlineBtn, opacity: (loading || macData.Id === 0) ? 0.5 : 1 }}
                          onClick={handleUpdate} disabled={loading || macData.Id === 0}>
                          {loading
                            ? <><span className="spinner-border spinner-border-sm" /> Processing...</>
                            : <><FaEdit /> Update</>}
                        </button>

                        <button className="btn px-4 d-flex align-items-center gap-2"
                          style={{ ...outlineBtn, opacity: (loading || macData.Id === 0) ? 0.5 : 1 }}
                          onClick={handleDelete} disabled={loading || macData.Id === 0}>
                          {loading
                            ? <><span className="spinner-border spinner-border-sm" /> Processing...</>
                            : <><FaTrashAlt /> Delete</>}
                        </button>

                        <button className="btn px-4 d-flex align-items-center gap-2"
                          style={outlineBtn} onClick={handleClear} disabled={loading}>
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

export default MacManagement;