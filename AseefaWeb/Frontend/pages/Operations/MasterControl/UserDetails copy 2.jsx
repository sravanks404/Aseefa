import React, { useState, useEffect } from 'react';
import api from '../../apiService';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function UserDetails() {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [duplicateError, setDuplicateError] = useState('');
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
    const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);
    const [isDeleteDisabled, setIsDeleteDisabled] = useState(true);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [branches, setBranches] = useState([]);
    const [Zone, setZone] = useState([]);
    const [UserRole, setUserRole] = useState([]);
    const [allUsers, setAllUsers] = useState([]); // For MD dropdown
    const [selectedMdUsers, setSelectedMdUsers] = useState([]); // Users working under this MD
    const [fieldErrors, setFieldErrors] = useState({});
    const [showMdDropdown, setShowMdDropdown] = useState(false); // For custom dropdown visibility

    const [employee, setEmployee] = useState({
        UserId: 0,
        Name: '',
        Kmallowance: '',
        Dayallowance: '',
        CompanyID: '',
        BranchId: '',
        UserRoleId: '',
        ZoneId: '',
    });

    const [employeeData, setEmployeeData] = useState([]);

    useEffect(() => {
        fetchData();
        fetchBranches();
        fetchUserRole();
        fetchZone();
        fetchAllUsers();
    }, []);

    // Close MD dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.md-custom-dropdown')) {
                setShowMdDropdown(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchData = async () => {
        try {
            const CompanyID = sessionStorage.getItem("CompanyID");
            if (!CompanyID) {
                toast.error("CompanyID not found in sessionStorage");
                return;
            }
            const response = await api.get("/api/GetUser", { params: { CompanyID } });
            setEmployeeData(response.data);
        } catch (err) {
            toast.error('Failed to fetch employee data');
            console.error(err);
        }
    };

    const fetchBranches = async () => {
        try {
            const CompanyID = sessionStorage.getItem("CompanyID");
            if (!CompanyID) return;
            const response = await api.get("/api/getbranch", { params: { CompanyID } });
            setBranches(response.data);
        } catch (err) {
            toast.error('Failed to fetch branches');
            console.error(err);
        }
    };

    const fetchUserRole = async () => {
        try {
            const CompanyID = sessionStorage.getItem("CompanyID");
            if (!CompanyID) return;
            const response = await api.get("/api/GetUserRole", { params: { CompanyID } });
            setUserRole(response.data);
        } catch (err) {
            toast.error('Failed to fetch UserRole');
            console.error(err);
        }
    };

    const fetchZone = async () => {
        try {
            const CompanyID = sessionStorage.getItem("CompanyID");
            if (!CompanyID) return;
            const response = await api.get("/api/getZone", { params: { CompanyID } });
            setZone(response.data);
        } catch (err) {
            toast.error('Failed to fetch Zone');
            console.error(err);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const CompanyID = sessionStorage.getItem("CompanyID");
            if (!CompanyID) return;
            const response = await api.get("/api/GetUser", { params: { CompanyID } });
            setAllUsers(response.data);
        } catch (err) {
            toast.error('Failed to fetch users for MD assignment');
            console.error(err);
        }
    };

 const handleRowClick = (item) => {
    setEmployee({
        UserId: item.UserId,
        Name: item.Name,
        Kmallowance: item.Kmallowance || '',
        Dayallowance: item.Dayallowance || '',
        CompanyID: item.CompanyID,
        BranchId: item.BranchId || '',
        UserRoleId: item.UserRoleId || '',
        ZoneId: item.ZoneId || '',
    });

    // ✅ LOAD existing Allocated Users
    setSelectedMdUsers(
        item.AllocatedUser
            ? item.AllocatedUser
                  .split(',')
                  .map(id => parseInt(id, 10))
                  .filter(id => !isNaN(id))
            : []
    );

    setIsSubmitDisabled(true);
    setIsUpdateDisabled(false);
    setIsDeleteDisabled(true);
    setShowMdDropdown(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
};


    const handleUpdate = async (e) => {
        e.preventDefault();

        if (!validateAllFields()) {
            return;
        }

        const CompanyID = sessionStorage.getItem("CompanyID");

       const updatedEmployee = {
    CompanyID: parseInt(CompanyID, 10),
    UserId: employee.UserId,
    Kmallowance: employee.Kmallowance,
    Dayallowance: employee.Dayallowance,
    BranchId: employee.BranchId,
    UserRoleId: employee.UserRoleId,
    ZoneId: employee.ZoneId,
    AllocatedUser:
        Number(employee.UserRoleId) === 3
            ? selectedMdUsers.join(',')   // 👈 convert array → string
            : ''
};


        try {
            setLoadingUpdate(true);
            setMessage('');
            setError('');
            const response = await api.post('api/updateUserDetails', updatedEmployee);
            if (response.data.success) {
                toast.success('User allowance updated successfully!');
                fetchData();
                fetchAllUsers();
                setSelectedMdUsers([]);
            } else {
                toast.error(response.data.message || 'Update failed.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update request failed.');
        } finally {
            setLoadingUpdate(false);
        }
    };

    const resetForm = () => {
        setEmployee({
            UserId: 0,
            Name: '',
            Kmallowance: '',
            Dayallowance: '',
            CompanyID: '',
            BranchId: '',
            UserRoleId: '',
            ZoneId: '',
        });
        setSelectedMdUsers([]);
        setShowMdDropdown(false);
        setIsUpdateDisabled(true);
        setMessage('');
        setError('');
    };

    const handleClear = () => {
        resetForm();
        setSearchTerm('');
        fetchData();
        toast.dismiss();
        setFieldErrors({});
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setEmployee(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === "UserRoleId" && parseInt(value, 10) !== 3) {
            setSelectedMdUsers([]);
            setShowMdDropdown(false);
        }
    };

    const handleMdUserSelect = (userId) => {
        const id = parseInt(userId, 10);
        if (id && !selectedMdUsers.includes(id)) {
            setSelectedMdUsers(prev => [...prev, id]);
        }
        setShowMdDropdown(false);
    };

    const removeMdUser = (userIdToRemove) => {
        setSelectedMdUsers(prev => prev.filter(id => id !== userIdToRemove));
    };

    const filteredEmployeeData = employeeData.filter((item) =>
        (item.Name || '').toLowerCase().includes(searchTerm.toLowerCase().trim())
    );

    const validateForm = (name, value) => {
        let error = '';

        switch (name) {
            case 'BranchId':
                if (!value) error = 'Branch is required';
                break;
            case 'ZoneId':
                if (!value) error = 'Zone is required';
                break;
            case 'UserRoleId':
                if (!value) error = 'User role is required';
                break;
            case 'Kmallowance':
                if (value !== '' && isNaN(value)) error = 'Km Allowance must be a number';
                break;
            case 'Dayallowance':
                if (value !== '' && isNaN(value)) error = 'Day Allowance must be a number';
                break;
            default:
                break;
        }

        if (error) {
            toast.dismiss(name);
            toast.warning(error, { toastId: name });
        } else {
            toast.dismiss(name);
        }

        setFieldErrors((prev) => ({ ...prev, [name]: error }));
    };

    const validateAllFields = () => {
        const errors = {};

        if (!employee.BranchId) errors.BranchId = "Branch is required";
        if (!employee.ZoneId) errors.ZoneId = "Zone is required";
        if (!employee.UserRoleId) errors.UserRoleId = "User role is required";
        if (employee.Kmallowance !== '' && isNaN(employee.Kmallowance)) {
            errors.Kmallowance = "Km Allowance must be a number";
        }
        if (employee.Dayallowance !== '' && isNaN(employee.Dayallowance)) {
            errors.Dayallowance = "Day Allowance must be a number";
        }

        setFieldErrors(errors);

        Object.entries(errors).forEach(([field, message]) => {
            toast.error(message, { toastId: field });
        });

        return Object.keys(errors).length === 0;
    };

    const availableMdUsers = allUsers.filter(user =>
        user.UserRoleId !== 3 &&
        !selectedMdUsers.includes(user.UserId)
    );

    return (
        <div className="page-wrapper">
            <div className="container-xl">
                <div className="page-header d-print-none mt-2">
                    <div className="row g-2 align-items-center">
                        <div className="col">
                            <h2 className="page-title">User Details</h2>
                        </div>
                    </div>
                </div>

                <div className="page-body mt-1">
                    <div className="container-xl">
                        <ToastContainer position="top-center" autoClose={3000} />
                        {duplicateError && <div style={{ color: 'red' }}>{duplicateError}</div>}

                        <div className="card mt-3">
                            <div className="card-body">
                                <form onSubmit={handleUpdate}>
                                    <div className="row gx-3 gy-3">
                                        {/* Name */}
                                        <div className="col-md-4 d-flex align-items-center">
                                            <label htmlFor="Name" className="me-2 mb-0" style={{ width: '120px' }}>Name</label>
                                            <input
                                                type="text"
                                                id="Name"
                                                name="Name"
                                                style={{ height: '30px' }}
                                                className="form-control"
                                                value={employee.Name}
                                                readOnly
                                            />
                                        </div>

                                        {/* Branch */}
                                        <div className="col-md-4 d-flex align-items-center">
                                            <label className="me-2 mb-0" style={{ width: '120px' }}>Branch</label>
                                            <select
                                                style={{ height: '34px', paddingTop: '2px', paddingBottom: '2px', lineHeight: '1.2' }}
                                                name="BranchId"
                                                className={`form-control ${fieldErrors['BranchId'] ? 'is-invalid' : ''}`}
                                                value={employee.BranchId}
                                                onBlur={(e) => validateForm(e.target.name, e.target.value)}
                                                onChange={handleInputChange}
                                            >
                                                <option value="">Select Branch</option>
                                                {branches.map(branch => (
                                                    <option key={branch.BranchId} value={branch.BranchId}>{branch.BranchName}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Zone */}
                                        <div className="col-md-4 d-flex align-items-center">
                                            <label className="me-2 mb-0" style={{ width: '120px' }}>Zone</label>
                                            <select
                                                style={{ height: '34px', paddingTop: '2px', paddingBottom: '2px', lineHeight: '1.2' }}
                                                name="ZoneId"
                                                className={`form-control ${fieldErrors['ZoneId'] ? 'is-invalid' : ''}`}
                                                value={employee.ZoneId}
                                                onBlur={(e) => validateForm(e.target.name, e.target.value)}
                                                onChange={handleInputChange}
                                            >
                                                <option value="">Select Zone</option>
                                                {Zone.map(z => (
                                                    <option key={z.ZoneId} value={z.ZoneId}>{z.ZoneName}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* User Role */}
                                        <div className="col-md-4 d-flex align-items-center">
                                            <label className="me-2 mb-0" style={{ width: '120px' }}>User Role</label>
                                            <select
                                                style={{ height: '34px', paddingTop: '2px', paddingBottom: '2px', lineHeight: '1.2' }}
                                                name="UserRoleId"
                                                className={`form-control ${fieldErrors['UserRoleId'] ? 'is-invalid' : ''}`}
                                                value={employee.UserRoleId}
                                                onBlur={(e) => validateForm(e.target.name, e.target.value)}
                                                onChange={handleInputChange}
                                            >
                                                <option value="">Select UserRole</option>
                                                {UserRole.map(role => (
                                                    <option key={role.RoleID} value={role.RoleID}>{role.RoleName}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* CUSTOM MULTI-SELECT: Users under MD */}
                                        {Number(employee.UserRoleId) === 3 && (
                                            <div className="col-md-6 d-flex align-items-start">
                                                <label className="me-2 mt-1" style={{ width: '120px' }}>Users under MD</label>

                                                <div className="md-custom-dropdown" style={{ flex: 1, position: 'relative' }}>
                                                    {/* Clickable Box with Chips */}
                                                    <div
                                                        className="form-control d-flex flex-wrap align-items-center gap-2"
                                                        style={{
                                                            minHeight: '38px',
                                                            padding: '6px 12px',
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowMdDropdown(!showMdDropdown);
                                                        }}
                                                    >
                                                        {selectedMdUsers.length === 0 && (
                                                            <span className="text-muted">Select users...</span>
                                                        )}

                                                        {selectedMdUsers.map(userId => {
                                                            const user = allUsers.find(u => u.UserId === userId);
                                                            return user ? (
                                                               <span
  key={userId}
  className="d-flex align-items-center"
  style={{
    border: '1px solid #0d6efd',   // blue border (change color if needed)
    borderRadius: '12px',
    padding: '4px 8px',
    backgroundColor: 'transparent'
  }}
>
  <span style={{ color: '#000', fontSize: '13px' }}>
    {user.Name}
  </span>

  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      removeMdUser(userId);
    }}
    style={{
      border: 'none',
      background: 'transparent',
      color: '#0d6efd',   // cross color
      fontSize: '14px',
      marginLeft: '6px',
      cursor: 'pointer',
      lineHeight: 1
    }}
  >
    ×
  </button>
</span>

                                                            ) : null;
                                                        })}
                                                    </div>

                                                    {/* Dropdown List */}
                                                    {showMdDropdown && (
                                                        <div
                                                            className="border rounded shadow-sm bg-white"
                                                            style={{
                                                                position: 'absolute',
                                                                top: '100%',
                                                                left: 0,
                                                                width: '100%',
                                                                maxHeight: '200px',
                                                                overflowY: 'auto',
                                                                zIndex: 1000
                                                            }}
                                                        >
                                                            {availableMdUsers.length === 0 ? (
                                                                <div className="p-3 text-center text-muted">
                                                                    No users available
                                                                </div>
                                                            ) : (
                                                                availableMdUsers.map(user => (
                                                                    <div
                                                                        key={user.UserId}
                                                                        className="px-3 py-2"
                                                                        style={{ cursor: 'pointer' }}
                                                                        onMouseOver={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                                                        onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleMdUserSelect(user.UserId);
                                                                        }}
                                                                    >
                                                                        {user.Name}
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Km Allowance */}
                                        <div className="col-md-4 d-flex align-items-center">
                                            <label htmlFor="Kmallowance" className="me-2 mb-0" style={{ width: '120px' }}>Km Allowance</label>
                                            <input
                                                type="text"
                                                id="Kmallowance"
                                                style={{ height: '30px' }}
                                                name="Kmallowance"
                                                className={`form-control ${fieldErrors['Kmallowance'] ? 'is-invalid' : ''}`}
                                                onBlur={(e) => validateForm(e.target.name, e.target.value)}
                                                value={employee.Kmallowance}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        {/* Day Allowance */}
                                        <div className="col-md-4 d-flex align-items-center">
                                            <label htmlFor="Dayallowance" className="me-2 mb-0" style={{ width: '120px' }}>Day Allowance</label>
                                            <input
                                                type="text"
                                                id="Dayallowance"
                                                style={{ height: '30px' }}
                                                name="Dayallowance"
                                                className={`form-control ${fieldErrors['Dayallowance'] ? 'is-invalid' : ''}`}
                                                onBlur={(e) => validateForm(e.target.name, e.target.value)}
                                                value={employee.Dayallowance}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    {/* Buttons */}
                                    <div className="form-footer mt-4">
                                        <button type="submit" className="btn btn-primary mx-1" disabled={isUpdateDisabled || loadingUpdate}>
                                            {loadingUpdate ? 'Updating...' : 'Update'}
                                        </button>
                                        <button type="button" className="btn btn-secondary mx-1" onClick={handleClear}>
                                            Clear
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Employee List Table */}
                        <div className="card mt-3">
                            <div className="card-header">
                                <h3 className="card-title">Employee List</h3>
                                <div className="col-md-3 ms-auto">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search by Name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="card-body">
                                <table className="table table-bordered table-hover">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Branch Name</th>
                                            <th>Km Allowance</th>
                                            <th>Day Allowance</th>
                                            <th>Mobile</th>
                                            <th>Address1</th>
                                            <th>Zone</th>
                                            <th>User Role</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEmployeeData.map(emp => (
                                            <tr key={emp.UserId} onClick={() => handleRowClick(emp)} style={{ cursor: 'pointer' }}>
                                                <td>{emp.Name}</td>
                                                <td>{branches.find(branch => branch.BranchId === emp.BranchId)?.BranchName || 'N/A'}</td>
                                                <td>{emp.Kmallowance || 0}</td>
                                                <td>{emp.Dayallowance || 0}</td>
                                                <td>{emp.Mobile}</td>
                                                <td>{emp.Address1}</td>
                                                <td>{Zone.find(z => z.ZoneId === emp.ZoneId)?.ZoneName || 'N/A'}</td>
                                                <td>{UserRole.find(r => r.RoleID === emp.UserRoleId)?.RoleName || 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredEmployeeData.length === 0 && <div className="alert alert-warning">No employees found</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserDetails;