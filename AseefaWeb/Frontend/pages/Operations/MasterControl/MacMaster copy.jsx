import React, { useState, useEffect } from 'react';
import api from '../../apiService';
import Select from 'react-select';

function MacManagement() {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
    const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [macAddresses, setMacAddresses] = useState([]);

const [macData, setMacData] = useState({
  Id: 0, // used for update
  Bluetooth: '',
  UserId: 0,
  Active: 1,
  CompanyID: '',
  Remark: '',
  CreatedBy: 0,
  ModifiedBy: 0
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
            setError('Failed to fetch users');
            console.error(err);
        }
    };

    const fetchMac = async () => {
        try {
            const CompanyID = sessionStorage.getItem("CompanyID");
            if (!CompanyID) {
                setError("CompanyID not found in sessionStorage");
                return;
            }

            setLoading(true);
            const response = await api.get("/api/GetMac", { params: { CompanyID } });

            if (!response.data || !Array.isArray(response.data.data)) {
                throw new Error("No data received from API");
            }

            const formattedData = response.data.data.map((item, index) => ({
                Id: item.Id , // UI-only
                Bluetooth: item.Bluetooth || '',
                UserId: item.UserID || 0,
                Active: item.Active ? 1 : 0,
                Remark: item.Remark || '',
                Name: item.USERNAME || 'N/A',
                CompanyID: CompanyID
            }));

            setMacAddresses(formattedData);
            console.log("setMacAddresses:",formattedData)
            setError('');
        } catch (err) {
            setError(`Failed to fetch MAC addresses: ${err.message}`);
            console.error('Fetch error:', err);
            setMacAddresses([]);
        } finally {
            setLoading(false);
        }
    };
const handleRowClick = (item) => {
  setMacData({
    Id: item.Id, // This is critical for update
    Bluetooth: item.Bluetooth || '',
    UserId: item.UserId || 0,
    Active: item.Active ? 1 : 0,
    CompanyID: item.CompanyID || sessionStorage.getItem("CompanyID"),
    Remark: item.Remark || '',
    CreatedBy: 0,
    ModifiedBy: 0
  });

  setIsSubmitDisabled(true);
  setIsUpdateDisabled(false);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleInsert = async (e) => {
  e.preventDefault();
  const CompanyID = sessionStorage.getItem("CompanyID");
  const userId = sessionStorage.getItem("UserId");

  const data = {
    Id: 0,
    Bluetooth: macData.Bluetooth,
    UserId: macData.UserId,
    Active: macData.Active,
    Remark: macData.Remark,
    CompanyID: parseInt(CompanyID, 10),
    CreatedBy: parseInt(userId, 10),
    IsDeleted: 0

  };

  try {
    setLoading(true);
    const response = await api.post('/api/insertUpdateMAC', data);
    if (response.data.success) {
      setMessage("MAC address added successfully");
      fetchMac("");
      resetForm();
    } else {
      setError("Insert failed");
    }
  } catch (err) {
    setError(err.response?.data?.error || "Insert error");
  } finally {
    setLoading(false);
  }
};

const handleUpdate = async (e) => {
  e.preventDefault();
  const CompanyID = sessionStorage.getItem("CompanyID");
  const userId = sessionStorage.getItem("UserId");

  if (!macData.Id) {
    setError("Please select a MAC to update");
    return;
  }

  const data = {
    Id: macData.Id,
    Bluetooth: macData.Bluetooth,
    UserId: macData.UserId,
    Active: macData.Active,
    Remark: macData.Remark,
    CompanyID: parseInt(CompanyID, 10),
    ModifiedBy: parseInt(userId, 10),
    CreatedBy: parseInt(userId, 10),
    IsDeleted: 0
  };

  try {
    setLoading(true);
    const response = await api.post('/api/insertUpdateMAC', data);
    if (response.data.success) {
      setMessage("MAC address updated successfully");
      fetchMac();
      resetForm();
    } else {
      setError("Update failed");
    }
  } catch (err) {
    setError(err.response?.data?.error || "Update error");
  } finally {
    setLoading(false);
  }
};

const handleDelete = async () => {
    const userId = sessionStorage.getItem("UserId");

    if (!macData.Id) {
        setError("Please select a MAC to delete.");
        return;
    }

    try {
        setLoading(true);
        const response = await api.post('/api/deleteMAC', {
            Id: macData.Id,
            DeletedBy: parseInt(userId, 10)
        });

        if (response.data.success) {
            setMessage('MAC address deleted successfully');
            fetchMac();
            resetForm();
        } else {
            setError(response.data.message || 'Delete failed');
        }
    } catch (err) {
        setError(err.response?.data?.message || 'Delete request failed');
        console.error('API error:', err);
    } finally {
        setLoading(false);
    }
};

 const resetForm = () => {
        setMacData({
            Id: 0,
            Bluetooth: '',
            UserId: 0,
            Active: 0,
            CompanyID: '',
            Remark: '',
            CreatedBy: 0,
            ModifiedBy: 0
        });
        setIsUpdateDisabled(true);
        setIsSubmitDisabled(false);
        setMessage('');
        setError('');
    };

    const handleClear = () => {
        resetForm();
        setSearchTerm('');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setMacData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setMacData(prev => ({ ...prev, [name]: checked ? 1 : 0 }));
    };

    const filteredMacAddresses = macAddresses.filter((item) => {
        const searchTermLower = searchTerm.toLowerCase().trim();
        return (item.Bluetooth || '').toLowerCase().includes(searchTermLower)
            || (item.Name || '').toLowerCase().includes(searchTermLower);
    });

    return (
        <div className="page-wrapper">
            <div className="container-xl">
                <div className="page-header d-print-none mt-2">
                    <h2 className="page-title">MAC Master</h2>
                </div>

                <div className="page-body mt-1">
                    <div className="container-xl">
                        {message && <div className="alert alert-success">{message}</div>}
                        {error && <div className="alert alert-danger">{error}</div>}

                        <div className="card mt-3">
                            <div className="card-body">
                                <form >
                                    <div className="row">
                                        <div className="col-md-4">
                                            <label className="form-label">User</label>
                                            <Select
                                                name="UserId"
                                                value={users.find(u => u.UserId === macData.UserId) ? {
                                                    value: macData.UserId,
                                                    label: users.find(u => u.UserId === macData.UserId)?.Name || 'Unknown'
                                                } : null}
                                                onChange={(selected) => {
                                                    setMacData(prev => ({
                                                        ...prev,
                                                        UserId: selected?.value || 0
                                                    }));
                                                }}
                                                options={users.map(u => ({
                                                    value: u.UserId,
                                                    label: u.Name
                                                }))}
                                                placeholder="Select User"
                                                isClearable
                                                required
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">MAC Address</label>
                                            <input
                                                type="text"
                                                name="Bluetooth"
                                                className="form-control"
                                                value={macData.Bluetooth}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label">Remark</label>
                                            <input
                                                type="text"
                                                name="Remark"
                                                className="form-control"
                                                value={macData.Remark}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label">Active</label>
                                            <div className="form-check form-switch mt-2">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    name="Active"
                                                    checked={!!macData.Active}
                                                    onChange={handleCheckboxChange}
                                                />
                                            </div>
                                        </div>
                                    </div>

<div className="form-footer mt-4 d-flex justify-content-center gap-2 flex-wrap">
  <button
    className="btn btn-"
    onClick={handleInsert}
    disabled={loading || macData.Id !== 0}
  >
    {loading ? 'Processing...' : 'Submit'}
  </button>

  <button
    className="btn btn-"
    onClick={handleUpdate}
    disabled={loading || macData.Id === 0}
  >
    {loading ? 'Processing...' : 'Update'}
  </button>

  <button
    className="btn btn-"
    onClick={handleDelete}
    disabled={loading || macData.Id === 0}
  >
    Delete
  </button>

  <button
    className="btn btn-"
    onClick={handleClear}
    disabled={loading}
  >
    Clear
  </button>
</div>



                                </form>
                            </div>
                        </div>

                        <div className="card mt-3">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h3 className="card-title">MAC Address List</h3>
                                <input
                                    type="text"
                                    className="form-control w-25"
                                    placeholder="Search by MAC or User..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table table-bordered table-hover">
                                        <thead className="table-light">
                                            <tr>
                                                <th>MAC Address</th>
                                                <th>User</th>
                                                <th>Status</th>
                                                <th>Remark</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredMacAddresses.map(mac => (
                                                <tr key={mac.RowId} onClick={() => handleRowClick(mac)} style={{ cursor: 'pointer' }}>
                                                    <td>{mac.Bluetooth}</td>
                                                    <td>{mac.Name}</td>
                                                    <td>
                                                        <span className={`badge ${mac.Active ? 'bg-success' : 'bg-secondary'}`}>
                                                            {mac.Active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td>{mac.Remark || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {filteredMacAddresses.length === 0 && (
                                    <div className="alert alert-warning">No MAC addresses found</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MacManagement;