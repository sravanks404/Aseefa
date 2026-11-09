import React, { useState, useEffect } from 'react';
import api from '../../apiService';

function RatePurchaseManagement() {
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

    const [rate, setRate] = useState({
        Id: 0,
        FromRate: '',
        ToRate: '',
        Discount: '',
        CreatedBy: '',
        CreatedDate: '',
        ModifiedBy: '',
        ModifiedDate: '',
        CompanyID: ''
    });

    const [rateData, setRateData] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const CompanyID = sessionStorage.getItem("CompanyID");
            if (!CompanyID) {
                setError("CompanyID not found in sessionStorage");
                return;
            }
            const response = await api.get("/api/WebGetRateWiseDiscount", { params: { CompanyID } });
            setRateData(response.data);
        } catch (err) {
            console.error("Fetch error:", err); // Add this line
            // setError('Failed to fetch rate data');
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (item) => {
        setRate({
            Id: item.Id,
            FromRate: item.FromRate,
            ToRate: item.ToRate,
            Discount: item.Discount

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

            const CompanyID = sessionStorage.getItem("CompanyID");
            const CreatedBy = sessionStorage.getItem("UserId");

            if (!CompanyID) {
                setError("CompanyID not found in sessionStorage");
                return;
            }

            const newRate = {
                Id: 0,
                FromRate: rate.FromRate,
                ToRate: rate.ToRate,
                Discount: rate.Discount,
                CreatedBy: CreatedBy,
                CompanyID: parseInt(CompanyID)
            };

            const response = await api.post('api/WebInsertUpdateTotalRateWisePurchase', newRate);

            if (response.data.success) {
                setMessage(response.data.message);
                fetchData();
                resetForm();
            } else {
                setError(response.data.error || 'Operation failed');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Request failed');
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

            const ModifiedBy = sessionStorage.getItem("UserId");
            const CompanyID = sessionStorage.getItem("CompanyID");

            const updatedRate = {
                ...rate,
                Id: rate.Id,
                ModifiedBy,
                ModifiedDate: new Date().toISOString(),
                CompanyID // <-- REQUIRED
            };
            const response = await api.post('/api/WebInsertUpdateTotalRateWisePurchase', updatedRate);


            if (response.data.success) {
                setMessage(response.data.message);
                fetchData();
            } else {
                setError(response.data.error || 'Update failed');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Update request failed');
            console.error(err);
        } finally {
            setLoadingUpdate(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this rate?")) return;

        try {
            setLoadingDelete(true);
            setMessage('');
            setError('');

            const DeletedBy = sessionStorage.getItem("UserId");
            const CompanyID = sessionStorage.getItem("CompanyID");

            if (!CompanyID) {
                setError("CompanyID not found in sessionStorage");
                return;
            }

            const response = await api.post('/api/WebDeleteTotalRateWisePurchase', {
                Id: rate.Id,
                DeletedBy,
                CompanyID
            });

            if (response.data.success) {
                setMessage('Rate deleted successfully');
                fetchData();
                resetForm();
            } else {
                setError(response.data.error || 'Delete failed');
            }
        } catch (err) {
            setError(err.response?.data?.error);
            console.error(err);
        } finally {
            setLoadingDelete(false);
        }
    };

    const resetForm = () => {
        setRate({
            Id: 0,
            FromRate: '',
            ToRate: '',
            Discount: '',
            CreatedBy: '',
            CreatedDate: '',
            ModifiedBy: '',
            ModifiedDate: '',
            CompanyID: ''
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
        setRate(prev => ({ ...prev, [name]: value }));
    };

    const filteredRateData = rateData.filter(item =>
        item.FromRate.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ToRate.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Discount.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-wrapper">
            <div className="container-xl">
                <div className="page-header d-print-none mt-2">
                    <div className="row g-2 align-items-center">
                        <div className="col">
                            <h2 className="page-title">Rate Discount percentage</h2>
                        </div>
                    </div>
                </div>

                <div className="page-body mt-1">
                    <div className="container-xl">
                        {message && <div style={{ color: 'green', fontWeight: 'bold' }}>{message}</div>}
                        {error && <div style={{ color: 'red' }}>{error}</div>}

                        <div className="card mt-3">
                            <div className="card-body">
                                <form onSubmit={rate.Id === 0 ? handleSubmit : handleUpdate}>
                                    <div className="row">
                                        <div className="col-md-4">
                                            <label htmlFor="FromRate" className="form-label">From Rate</label>
                                            <input
                                                type="number"
                                                id="FromRate"
                                                name="FromRate"
                                                className="form-control"
                                                value={rate.FromRate}
                                                onChange={handleInputChange}
                                                required
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <label htmlFor="ToRate" className="form-label">To Rate</label>
                                            <input
                                                type="number"
                                                id="ToRate"
                                                name="ToRate"
                                                className="form-control"
                                                value={rate.ToRate}
                                                onChange={handleInputChange}
                                                required
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <label htmlFor="Discount" className="form-label">Discount </label>
                                            <input
                                                type="number"
                                                id="Discount"
                                                name="Discount"
                                                className="form-control"
                                                value={rate.Discount}
                                                onChange={handleInputChange}
                                                required
                                                min="0"
                                                max="100"
                                                step="0.01"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-footer mt-4">
                                        <div className="d-flex justify-content-center gap-3 flex-wrap">
                                            <button
                                                type="submit"
                                                className="btn "
                                                disabled={isSubmitDisabled || loadingSubmit}
                                            >
                                                {loadingSubmit ? 'Submitting...' : 'Submit'}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn "
                                                disabled={isUpdateDisabled || loadingUpdate}
                                                onClick={handleUpdate}
                                            >
                                                {loadingUpdate ? 'Updating...' : 'Update'}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn "
                                                disabled={isDeleteDisabled || loadingDelete}
                                                onClick={handleDelete}
                                            >
                                                {loadingDelete ? 'Deleting...' : 'Delete'}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn "
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
                                <h3 className="card-title mb-0">Rate List</h3>
                                <div className="col-md-3">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search rates..."
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
                                                    <th style={{ width: '33%' }}>From Rate</th>
                                                    <th style={{ width: '33%' }}>To Rate</th>
                                                    <th style={{ width: '33%' }}>Discount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredRateData.length > 0 ? (
                                                    filteredRateData.map(item => (
                                                        <tr
                                                            key={item.Id}
                                                            onClick={() => handleRowClick(item)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <td>{item.FromRate}</td>
                                                            <td>{item.ToRate}</td>
                                                            <td>{item.Discount}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="3" className="text-center">
                                                            {rateData.length === 0 ?
                                                                "No rates available" :
                                                                "No matching rates found"}
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

export default RatePurchaseManagement;