import React, { useState, useEffect } from 'react';
import api from '../../apiService';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function LeadEnquiry() {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
    const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);
    const [isDeleteDisabled, setIsDeleteDisabled] = useState(true);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [enquiry, setEnquiry] = useState({
        EnqID: 0,
        Customer: '',
        EnqDate: new Date().toISOString().split('T')[0],
        EnqType: '',
        Address: '',
        Mob: '',
        Narration: '',
        Status: 0,
        CompanyID: '',
        CreatedBy: '',
        CreatedDate: '',
        ModifiedBy: '',
        ModifiedDate: '',
        DeletedBy: '',
        DeletedDate: '',
        IsDeleted: 0,
    });

    const [enquiryData, setEnquiryData] = useState([]);
    const [BranchData, setBranchData] = useState([]);

    useEffect(() => {
        fetchData();
        fetchBranchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const CompID = sessionStorage.getItem("CompanyID");

            if (!CompID) {
                setError("CompanyID not found in sessionStorage");
                return;
            }

            // This would need to be updated to your actual API endpoint for fetching enquiries
            const response = await api.get("/api/GetEnquiries", {
                params: {
                    CompID,
                }
            });

            setEnquiryData(response.data);
        } catch (err) {
            console.error("Fetch error:", err);
            setError('Failed to fetch enquiry data');
        } finally {
            setLoading(false);
        }
    };

    const fetchBranchData = async () => {
        try {
            setLoading(true);
            const CompID = sessionStorage.getItem("CompanyID");

            if (!CompID) {
                setError("CompanyID not found in sessionStorage");
                return;
            }

            const response = await api.get("/api/getbranch", {
                params: {
                    CompanyID: CompID,
                },
            });

            setBranchData(response.data);
        } catch (err) {
            console.error("Fetch error:", err);
            setError("Failed to fetch branch data");
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (item) => {
        setEnquiry({
            EnqID: item.EnqID,
            Customer: item.Customer,
            EnqDate: item.EnqDate ? new Date(item.EnqDate).toISOString().split('T')[0] : '',
            EnqType: item.EnqType,
            Address: item.Address || '',
            Mob: item.Mob || '',
            Narration: item.Narration || '',
            Status: item.Status || 0,
            CompanyID: item.CompanyID,
            CreatedBy: item.CreatedBy || '',
            CreatedDate: item.CreatedDate || '',
            ModifiedBy: item.ModifiedBy || '',
            ModifiedDate: item.ModifiedDate || '',
            DeletedBy: item.DeletedBy || '',
            DeletedDate: item.DeletedDate || '',
            IsDeleted: item.IsDeleted || 0,
        });

        setIsSubmitDisabled(true);
        setIsUpdateDisabled(false);
        setIsDeleteDisabled(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoadingSubmit(true);
            setMessage('');
            setError('');

            const CompID = sessionStorage.getItem("CompanyID");
            const UserID = sessionStorage.getItem("UserID");
            
            if (!CompID) {
                setError("CompanyID not found in sessionStorage");
                return;
            }

            if (!UserID) {
                setError("UserID not found in sessionStorage");
                return;
            }

            const newEnquiry = {
                EnqID: 0,  // 0 indicates new record
                Customer: parseInt(enquiry.Customer) || 0,
                EnqDate: enquiry.EnqDate,
                EnqType: parseInt(enquiry.EnqType) || 0,
                Address: enquiry.Address,
                Mob: enquiry.Mob,
                Narration: enquiry.Narration,
                Status: parseInt(enquiry.Status) || 0,
                CompanyID: parseInt(CompID),
                CreatedBy: parseInt(UserID),
                CreatedDate: new Date().toISOString(),
                IsDeleted: 0,
            };

            const response = await api.post('/InsertUpdateEnquiry', newEnquiry);
            if (response.data.message) {
                toast.success("Enquiry created successfully");
                setMessage(response.data.message || 'Enquiry created successfully');
                fetchData();
                resetForm();
            } else {
                toast.error(response.data.error || 'Operation failed');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Request failed');
            console.error(err);
        } finally {
            setLoadingSubmit(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            setLoadingUpdate(true);
            setMessage('');
            setError('');

            const CompID = sessionStorage.getItem("CompanyID");
            const UserID = sessionStorage.getItem("UserID");
            
            if (!CompID) {
                setError("CompanyID not found in sessionStorage");
                return;
            }

            if (!UserID) {
                setError("UserID not found in sessionStorage");
                return;
            }

            const updatedEnquiry = {
                EnqID: enquiry.EnqID,
                Customer: parseInt(enquiry.Customer) || 0,
                EnqDate: enquiry.EnqDate,
                EnqType: parseInt(enquiry.EnqType) || 0,
                Address: enquiry.Address,
                Mob: enquiry.Mob,
                Narration: enquiry.Narration,
                Status: parseInt(enquiry.Status) || 0,
                CompanyID: parseInt(CompID),
                ModifiedBy: parseInt(UserID),
                ModifiedDate: new Date().toISOString(),
                IsDeleted: 0,
            };

            const response = await api.post('/InsertUpdateEnquiry', updatedEnquiry);

            if (response.data.message) {
                setMessage(response.data.message || 'Enquiry updated successfully');
                toast.success("Enquiry updated successfully");
                fetchData();
                resetForm();
            } else {
                toast.error(response.data.error || 'Update failed');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Update request failed');
            console.error(err);
        } finally {
            setLoadingUpdate(false);
        }
    };

    const confirmDeleteToast = () => {
        return new Promise((resolve) => {
            const toastId = toast.warning(
                ({ closeToast }) => (
                    <div>
                        <div className="mb-2">Are you sure you want to delete this Enquiry?</div>
                        <div className="d-flex justify-content-end gap-2">
                            <button
                                className="btn btn btn-danger"
                                onClick={() => {
                                    toast.dismiss(toastId);
                                    resolve(true);
                                }}
                            >
                                Yes
                            </button>
                            <button
                                className="btn btn btn-secondary"
                                onClick={() => {
                                    toast.dismiss(toastId);
                                    resolve(false);
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ),
                {
                    position: "top-center",
                    autoClose: false,
                    closeOnClick: false,
                    draggable: false,
                    closeButton: false,
                    toastId: "confirm-delete",
                }
            );
        });
    };

    const handleDelete = async () => {
        try {
            setLoadingDelete(true);
            setMessage('');
            setError('');

            const CompID = sessionStorage.getItem("CompanyID");
            const UserID = sessionStorage.getItem("UserID");
            
            if (!CompID) {
                toast.error("CompanyID not found in sessionStorage");
                return;
            }

            if (!UserID) {
                toast.error("UserID not found in sessionStorage");
                return;
            }

            const confirm = await confirmDeleteToast();
            if (!confirm) return;

            const deleteEnquiry = {
                EnqID: enquiry.EnqID,
                Customer: parseInt(enquiry.Customer) || 0,
                EnqDate: enquiry.EnqDate,
                EnqType: parseInt(enquiry.EnqType) || 0,
                Address: enquiry.Address,
                Mob: enquiry.Mob,
                Narration: enquiry.Narration,
                Status: parseInt(enquiry.Status) || 0,
                CompanyID: parseInt(CompID),
                DeletedBy: parseInt(UserID),
                DeletedDate: new Date().toISOString(),
                IsDeleted: 1,
            };

            const response = await api.post('/InsertUpdateEnquiry', deleteEnquiry);

            if (response.data.message) {
                toast.success('Enquiry deleted successfully')
                setMessage('Enquiry deleted successfully');
                fetchData();
                resetForm();
            } else {
                toast.error(response.data.error || 'Delete failed');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Delete request failed');
            console.error(err);
        } finally {
            setLoadingDelete(false);
        }
    };

    const resetForm = () => {
        setEnquiry({
            EnqID: 0,
            Customer: '',
            EnqDate: new Date().toISOString().split('T')[0],
            EnqType: '',
            Address: '',
            Mob: '',
            Narration: '',
            Status: 0,
            CompanyID: '',
            CreatedBy: '',
            CreatedDate: '',
            ModifiedBy: '',
            ModifiedDate: '',
            DeletedBy: '',
            DeletedDate: '',
            IsDeleted: 0,
        });
        setIsSubmitDisabled(false);
        setIsUpdateDisabled(true);
        setIsDeleteDisabled(true);
    };

    const handleClear = () => {
        resetForm();
        setSearchTerm('');
        setMessage('');
        setError('');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEnquiry((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const filteredEnquiryData = enquiryData.filter(item =>
        (item.CustomerName || item.CustomerID || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.Mob || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-wrapper">
            <div className="container-fluid">
                <ToastContainer position="top-center" autoClose={3000} />
                <div className="page-header d-print-none mt-2">
                    <div className="row g-2 align-items-center">
                        <div className="col">
                            <h2 className="page-title">Enquiry Master</h2>
                        </div>
                    </div>
                </div>

                <div className="page-body mt-1">
                    <div className="container-fluid">
                        <div className="card mt-3">
                            <div className="card-body">
                                <form onSubmit={enquiry.EnqID === 0 ? handleSubmit : handleUpdate}>
                                    <div className="row">
                                        <div className="col-md-4">
                                            <label htmlFor="Customer" className="form-label">Customer</label>
                                            <input
                                                type="text"
                                                id="Customer"
                                                name="Customer"
                                                className="form-control"
                                                value={enquiry.Customer}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="Enter customer ID or name"
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label htmlFor="EnqDate" className="form-label">Enquiry Date</label>
                                            <input
                                                type="date"
                                                id="EnqDate"
                                                name="EnqDate"
                                                className="form-control"
                                                value={enquiry.EnqDate}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label htmlFor="EnqType" className="form-label">Enquiry Type</label>
                                            <select
                                                id="EnqType"
                                                name="EnqType"
                                                className="form-control"
                                                value={enquiry.EnqType}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="">Select Type</option>
                                                <option value="1">General</option>
                                                <option value="2">Specific</option>
                                                {/* Add more options as needed */}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="row mt-3">
                                        <div className="col-md-6">
                                            <label htmlFor="Address" className="form-label">Address</label>
                                            <textarea
                                                id="Address"
                                                name="Address"
                                                className="form-control"
                                                value={enquiry.Address}
                                                onChange={handleInputChange}
                                                placeholder="Enter address"
                                                rows="2"
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label htmlFor="Mob" className="form-label">Mobile</label>
                                            <input
                                                type="text"
                                                id="Mob"
                                                name="Mob"
                                                className="form-control"
                                                value={enquiry.Mob}
                                                onChange={handleInputChange}
                                                placeholder="Enter mobile number"
                                            />
                                        </div>
                                    </div>

                                    <div className="row mt-3">
                                        <div className="col-12">
                                            <label htmlFor="Narration" className="form-label">Narration</label>
                                            <textarea
                                                id="Narration"
                                                name="Narration"
                                                className="form-control"
                                                value={enquiry.Narration}
                                                onChange={handleInputChange}
                                                placeholder="Enter narration"
                                                rows="3"
                                            />
                                        </div>
                                    </div>

                                    <div className="row mt-3">
                                        <div className="col-md-6">
                                            <label htmlFor="Status" className="form-label">Status</label>
                                            <select
                                                id="Status"
                                                name="Status"
                                                className="form-control"
                                                value={enquiry.Status}
                                                onChange={handleInputChange}
                                            >
                                                <option value="0">Pending</option>
                                                <option value="1">In Progress</option>
                                                <option value="2">Completed</option>
                                                <option value="3">Cancelled</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-footer mt-4">
                                        <div className="d-flex justify-content-center gap-3 flex-wrap">
                                            <button
                                                type="submit"
                                                className="btn btn-primary"
                                                disabled={isSubmitDisabled || loadingSubmit}
                                            >
                                                {loadingSubmit ? 'Submitting...' : 'Submit'}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-warning"
                                                disabled={isUpdateDisabled || loadingUpdate}
                                                onClick={handleUpdate}
                                            >
                                                {loadingUpdate ? 'Updating...' : 'Update'}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-danger"
                                                disabled={isDeleteDisabled || loadingDelete}
                                                onClick={handleDelete}
                                            >
                                                {loadingDelete ? 'Deleting...' : 'Delete'}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={handleClear}
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div className="card mt-3">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h3 className="card-title mb-0">Enquiry List</h3>
                                <div className="col-md-3">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search enquiries..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="card-body p-0">
                                {loading ? (
                                    <div className="text-center py-4">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        <table className="table table-bordered table-hover mb-0">
                                            <thead className="table-light" style={{ position: 'sticky', top: 0 }}>
                                                <tr>
                                                    <th>Customer</th>
                                                    <th>Date</th>
                                                    <th>Type</th>
                                                    <th>Mobile</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredEnquiryData.length > 0 ? (
                                                    filteredEnquiryData.map(item => (
                                                        <tr
                                                            key={item.EnqID}
                                                            onClick={() => handleRowClick(item)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <td>{item.CustomerName || item.CustomerID}</td>
                                                            <td>{item.EnqDate ? new Date(item.EnqDate).toLocaleDateString() : ''}</td>
                                                            <td>{item.EnqTypeName || item.EnqType}</td>
                                                            <td>{item.Mob}</td>
                                                            <td>
                                                                {item.Status === 0 ? 'Pending' : 
                                                                 item.Status === 1 ? 'In Progress' : 
                                                                 item.Status === 2 ? 'Completed' : 'Cancelled'}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="text-center">
                                                            {enquiryData.length === 0
                                                                ? "No enquiries available"
                                                                : "No matching enquiries found"}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LeadEnquiry;