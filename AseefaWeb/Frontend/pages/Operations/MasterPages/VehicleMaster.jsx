/*
import React, { useState, useEffect } from 'react';
import api from '../../apiService';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function VehicleMaster() {
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

    const [vehicle, setVehicle] = useState({
        VID: 0,
        VRegNo: '',
        IsDeleted: 0,
        CompID: '',
        BranchId: ''
    });

    const [vehicleData, setVehicleData] = useState([]);
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
                setError("CompanyID  not found in sessionStorage");
                return;
            }

            const response = await api.get("/api/GetVehicle", {
                params: {
                    CompID,

                }
            });

            setVehicleData(response.data);
        } catch (err) {
            console.error("Fetch error:", err);
            setError('Failed to fetch vehicle data');
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

    setVehicle({
        VID: item.VID,
        VRegNo: item.VRegNo,
        IsDeleted: Array.isArray(item.IsDeleted) ? item.IsDeleted[0] : item.IsDeleted,
        CompID: item.CompID,
        BranchId: Array.isArray(item.BranchId) ? item.BranchId[0] : item.BranchId,
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
            if (!CompID) {
                setError("CompanyID not found in sessionStorage");
                return;
            }

            const newVehicle = {
                VID: 0,  // 0 indicates new record
                VRegNo: vehicle.VRegNo,
                IsDeleted: 0,
                CompID: parseInt(CompID),
                BranchId: parseInt(vehicle.BranchId)  // ✅ use from state
            };

            const response = await api.post('/api/insertupdatevehicle', newVehicle);
            if (response.data.success) {
                toast.success("Vehicle created successfully");
                setMessage(response.data.message || 'Vehicle created successfully');
                fetchData();
                resetForm();
            } else {
                toast.error(response.data.message || 'Operation failed');
            }
        } catch (err) {
          toast.error(err.response?.data?.message || 'Request failed');
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
            if (!CompID) {
                setError("CompanyID not found in sessionStorage");
                return;
            }

            const updatedVehicle = {
                VID: vehicle.VID,
                VRegNo: vehicle.VRegNo,
                IsDeleted: 0,
                CompID: parseInt(CompID),
                BranchId: parseInt(vehicle.BranchId)
            };

            const response = await api.post('/api/insertupdatevehicle', updatedVehicle);

            if (response.data.success) {
                setMessage(response.data.message || 'Vehicle updated successfully');
                 toast.success("Vehicle updated successfully");
                fetchData();
                resetForm();
            } else {
                toast.error(response.data.message || 'Update failed');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update request failed');
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
          <div className="mb-2">Are you sure you want to delete this Vehicle?</div>
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
            if (!CompID) {
                toast.error("CompanyID not found in sessionStorage");
                return;
            }

             const confirm = await confirmDeleteToast(); // 🍞 wait for toast confirmation
  if (!confirm) return;
            const deleteVehicle = {
                VID: vehicle.VID,
                VRegNo: vehicle.VRegNo,
                IsDeleted: 1,
                CompID: parseInt(CompID),
                BranchId: parseInt(vehicle.BranchId)
            };

            const response = await api.post('/api/insertupdatevehicle', deleteVehicle);

            if (response.data.success) {
                toast.success('Vehicle deleted successfully')
                setMessage('Vehicle deleted successfully');
                fetchData();
                resetForm();
            } else {
                 toast.error(response.data.message || 'Delete failed');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete request failed');
            console.error(err);
        } finally {
            setLoadingDelete(false);
        }
    };

    const resetForm = () => {
        setVehicle({
            VID: 0,
            VRegNo: '',
            IsDeleted: 0,
            CompID: '',
            BranchId: ''
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
        setVehicle((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const filteredVehicleData = vehicleData.filter(item =>
        item.VRegNo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-wrapper">
            <div className="container-fluid">
                 <ToastContainer position="top-center" autoClose={3000} />
                <div className="page-header d-print-none mt-2">
                    <div className="row g-2 align-items-center">
                        <div className="col">
                            <h2 className="page-title">Vehicle Master</h2>
                        </div>
                    </div>
                </div>

                <div className="page-body mt-1">
                    <div className="container-xl">
                      

                        <div className="card mt-3">
                            <div className="card-body">
                                <form onSubmit={vehicle.VID === 0 ? handleSubmit : handleUpdate}>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <label htmlFor="VRegNo" className="form-label">Vehicle Registration Number</label>
                                            <input
                                                type="text"
                                                id="VRegNo"
                                                name="VRegNo"
                                                className="form-control"
                                                value={vehicle.VRegNo}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="Enter vehicle registration number"
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label" style={{ minWidth: '120px' }}>
                                                Branch
                                            </label>
                                            <select
                                                className="form-select flex-grow-1"
                                                name="BranchId"
                                                value={vehicle.BranchId}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="">Select Branch</option>
                                                {BranchData.map((branch) => (
                                                    <option key={branch.BranchId} value={String(branch.BranchId)}>
                                                        {branch.BranchName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-footer mt-4">
                                        <div className="d-flex justify-content-center gap-3 flex-wrap">
                                            <button
                                                type="submit"
                                                className="btn btn"
                                                disabled={isSubmitDisabled || loadingSubmit}
                                            >
                                                {loadingSubmit ? 'Submitting...' : 'Submit'}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn"
                                                disabled={isUpdateDisabled || loadingUpdate}
                                                onClick={handleUpdate}
                                            >
                                                {loadingUpdate ? 'Updating...' : 'Update'}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn"
                                                disabled={isDeleteDisabled || loadingDelete}
                                                onClick={handleDelete}
                                            >
                                                {loadingDelete ? 'Deleting...' : 'Delete'}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn"
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
                                <h3 className="card-title mb-0">Vehicle List</h3>
                                <div className="col-md-3">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search vehicles..."
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
                                                    <th style={{ width: '50%' }}>Registration Number</th>
                                                    <th style={{ width: '50%' }}>Branch Name</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredVehicleData.length > 0 ? (
                                                    filteredVehicleData.map(item => (
                                                        <tr
                                                            key={item.VID}
                                                            onClick={() => handleRowClick(item)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <td>{item.VRegNo}</td>
                                                            <td>{item.BranchName}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="2" className="text-center">
                                                            {vehicleData.length === 0
                                                                ? "No vehicles available"
                                                                : "No matching vehicles found"}
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

export default VehicleMaster;
*/

import React from 'react';
const VehicleMaster = () => null;
export default VehicleMaster;
