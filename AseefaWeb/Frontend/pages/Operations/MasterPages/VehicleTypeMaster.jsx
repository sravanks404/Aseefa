/*
import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import {
  FaSearch,
  FaPlus,
  FaSave,
  FaEdit,
  FaTrashAlt,
  FaEraser,
  FaArrowLeft,
  FaTruck,
} from "react-icons/fa";

import api from '../../apiService';
import { usePermission } from '../../../src/context/permissionContex';
const primaryColor = "rgb(45, 75, 169)";

function VehicleTypeMaster() {
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const { getPermission, refreshPermissions } = usePermission();
  const permission = getPermission("VEHICLE_TYPE");
  const canView = !!permission?.CanView;
  const canAdd = !!permission?.CanAdd;
  const canEdit = !!permission?.CanEdit;
  const canDelete = !!permission?.CanDelete;

  const [vehicleType, setVehicleType] = useState({
    VehicleTypeID: 0,
    VehicleTypeName: "",
  });

  // ---------------- FETCH VEHICLE TYPES ----------------

  const fetchVehicleTypes = async () => {
    try {
      const companyId = sessionStorage.getItem("CompanyID");

      const res = await api.get("/api/GetVehicleTypeList", {
        params: {
          CompanyID: companyId,
        },
      });

      setVehicleTypes(res.data || []);
    } catch (error) {
      toast.error("Failed to load vehicle types");
    }
  };

  useEffect(() => {
    refreshPermissions();
  }, []);

  useEffect(() => {
    if (!canView) {
      setVehicleTypes([]);
      setShowForm(false);
      return;
    }

    fetchVehicleTypes();
  }, [canView]);

  // ---------------- VALIDATION ----------------

  const validateFields = () => {
    const errors = {};

    if (!vehicleType.VehicleTypeName?.trim()) {
      errors.VehicleTypeName = "Vehicle Type Name is required";
    }

    return errors;
  };

  // ---------------- DUPLICATE CHECK ----------------

  const checkDuplicateVehicleType = (vehicleTypeName, currentVehicleTypeID = 0) => {
    return vehicleTypes.some(
      (v) =>
        v.VehicleTypeName?.trim().toLowerCase() ===
          vehicleTypeName.trim().toLowerCase() &&
        v.VehicleTypeID !== currentVehicleTypeID
    );
  };

  // ---------------- INPUT CHANGE ----------------

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setVehicleType((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ---------------- ROW CLICK ----------------

  const handleRowClick = (selectedVehicleType) => {
    if (!canView) {
      toast.error("You do not have permission to view vehicle types.");
      return;
    }

    setVehicleType({
      VehicleTypeID: selectedVehicleType.VehicleTypeID,
      VehicleTypeName: selectedVehicleType.VehicleTypeName,
    });

    setShowForm(true);
  };

  // ---------------- SUBMIT ----------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canAdd) {
      toast.error("You do not have permission to create vehicle types.");
      return;
    }

    const errors = validateFields();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    if (checkDuplicateVehicleType(vehicleType.VehicleTypeName)) {
      toast.error("Vehicle Type already exists");
      return;
    }

    try {
      setLoadingSubmit(true);

      const payload = {
        VehicleTypeID: 0,
        VehicleTypeName: vehicleType.VehicleTypeName.trim(),
        CompanyID: parseInt(sessionStorage.getItem("CompanyID")),
        CreatedBy: parseInt(sessionStorage.getItem("UserId")),
      };

      const response = await api.post(
        "/api/InsertUpdateVehicleType",
        payload
      );

      if (response.data.success) {
        toast.success("Vehicle Type created successfully");

        fetchVehicleTypes();
        handleClear();
        setShowForm(false);
      } else {
        toast.error(response.data.message || "Save failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setLoadingSubmit(false);
    }
  };

  // ---------------- UPDATE ----------------

  const handleUpdate = async () => {
    if (!canEdit) {
      toast.error("You do not have permission to update vehicle types.");
      return;
    }

    const errors = validateFields();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    if (checkDuplicateVehicleType(vehicleType.VehicleTypeName, vehicleType.VehicleTypeID)) {
      toast.error("Vehicle Type already exists");
      return;
    }

    try {
      setLoadingUpdate(true);

      const payload = {
        VehicleTypeID: vehicleType.VehicleTypeID,
        VehicleTypeName: vehicleType.VehicleTypeName.trim(),
        CompanyID: parseInt(sessionStorage.getItem("CompanyID")),
        ModifiedBy: parseInt(sessionStorage.getItem("UserId")),
      };

      const response = await api.post(
        "/api/InsertUpdateVehicleType",
        payload
      );

      if (response.data.success) {
        toast.success("Vehicle Type updated successfully");

        fetchVehicleTypes();
        handleClear();
        setShowForm(false);
      } else {
        toast.error(response.data.message || "Update failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setLoadingUpdate(false);
    }
  };

  // ---------------- DELETE CONFIRM ----------------

  const confirmDeleteToast = () =>
    new Promise((resolve) => {
      const toastId = toast.warning(
        ({ closeToast }) => (
          <div>
            <div className="mb-2">
              Are you sure you want to delete this vehicle type?
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-danger btn-sm"
                onClick={() => {
                  toast.dismiss(toastId);
                  resolve(true);
                }}
              >
                Yes
              </button>

              <button
                className="btn btn-secondary btn-sm"
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
        }
      );
    });

  // ---------------- DELETE ----------------

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error("You do not have permission to delete vehicle types.");
      return;
    }

    if (!vehicleType.VehicleTypeID) {
      toast.error("No vehicle type selected");
      return;
    }

    const confirm = await confirmDeleteToast();

    if (!confirm) return;

    try {
      setLoadingDelete(true);

      const response = await api.post("/api/DeleteVehicleType", {
        VehicleTypeID: vehicleType.VehicleTypeID,
        DeletedBy: parseInt(sessionStorage.getItem("UserId")),
      });

      if (response.data.success) {
        toast.success("Vehicle Type deleted successfully");

        fetchVehicleTypes();
        handleClear();
        setShowForm(false);
      } else {
        toast.error(response.data.message || "Delete failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setLoadingDelete(false);
    }
  };

  // ---------------- CLEAR ----------------

  const handleClear = () => {
    setVehicleType({
      VehicleTypeID: 0,
      VehicleTypeName: "",
    });

    setFieldErrors({});
  };

  const handleCreateNew = () => {
    if (!canAdd) {
      toast.error("You do not have permission to create vehicle types.");
      return;
    }

    handleClear();
    setShowForm(true);
  };

  const handleBackToList = () => {
    handleClear();
    setShowForm(false);
  };

  // ---------------- FILTER ----------------

  const filteredVehicleTypes = vehicleTypes.filter(
    (item) =>
      item.VehicleTypeName?.toLowerCase().includes(
        searchTerm.toLowerCase()
      ) || item.VehicleTypeID?.toString().includes(searchTerm)
  );

  if (!canView) {
    return (
      <div
        className="page-wrapper"
        style={{
          backgroundColor: "#f8fafc",
          minHeight: "100vh",
        }}
      >
        <ToastContainer position="top-center" autoClose={3000} />

        <div className="page-body mt-1">
          <div className="container-fluid px-4">
            <div className="alert alert-danger mt-4">
              You do not have permission to view Vehicle Type Management.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="page-wrapper"
      style={{
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <ToastContainer position="top-center" autoClose={3000} />

      <div className="page-body mt-1">
        <div className="container-fluid px-4">
          {!showForm ? (
            <>
              {/ * Header * /}

              <div
                className="card border-0 shadow-sm mb-4"
                style={{ borderRadius: "12px" }}
              >
                <div className="card-body p-4">
                  <h2
                    className="mb-3"
                    style={{
                      fontWeight: "600",
                      color: "#2d3748",
                    }}
                  >
                    <FaTruck
                      className="me-2"
                      style={{ color: primaryColor }}
                    />
                    Vehicle Type Management
                  </h2>

                  <div className="d-flex justify-content-between align-items-center">
                    <div style={{ flex: 1, maxWidth: "500px" }}>
                      <div className="input-group">
                        <span
                          className="input-group-text text-white"
                          style={{
                            backgroundColor: primaryColor,
                          }}
                        >
                          <FaSearch />
                        </span>

                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search Vehicle Type..."
                          value={searchTerm}
                          onChange={(e) =>
                            setSearchTerm(e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <button
                      className="btn"
                      style={{
                        background: primaryColor,
                        color: "#fff",
                      }}
                      onClick={handleCreateNew}
                      disabled={!canAdd}
                    >
                      <FaPlus className="me-2" />
                      Create New
                    </button>
                  </div>
                </div>
              </div>

              {/ * Table * /}

              <div
                className="card border-0 shadow-sm"
                style={{ borderRadius: "12px" }}
              >
                <div className="card-body p-0">
                  <table className="table table-hover mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="px-4 py-3">Vehicle Type ID</th>
                        <th className="py-3">Vehicle Type Name</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredVehicleTypes.length > 0 ? (
                        filteredVehicleTypes.map((item) => (
                          <tr
                            key={item.VehicleTypeID}
                            onClick={() =>
                              handleRowClick(item)
                            }
                            style={{
                              cursor: "pointer",
                            }}
                          >
                            <td className="px-4 py-3">
                              {item.VehicleTypeID}
                            </td>
                            <td className="py-3">
                              {item.VehicleTypeName}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="2"
                            className="text-center p-5"
                          >
                            No Vehicle Types Found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div
              className="card border-0 shadow-sm"
              style={{ borderRadius: "12px" }}
            >
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <h4 className="m-0">
                  <FaTruck
                    className="me-2"
                    style={{ color: primaryColor }}
                  />
                  {vehicleType.VehicleTypeID ? "Edit Vehicle Type" : "New Vehicle Type"}
                </h4>

                <button
                  className="btn"
                  onClick={handleBackToList}
                >
                  <FaArrowLeft className="me-2" />
                  Back
                </button>
              </div>

              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6">
                      <label className="form-label">
                        Vehicle Type Name{" "}
                        <span className="text-danger">*</span>
                      </label>

                      <input
                        type="text"
                        className={`form-control ${
                          fieldErrors.VehicleTypeName
                            ? "is-invalid"
                            : ""
                        }`}
                        name="VehicleTypeName"
                        value={vehicleType.VehicleTypeName}
                        onChange={handleInputChange}
                      />

                      {fieldErrors.VehicleTypeName && (
                        <div className="invalid-feedback">
                          {fieldErrors.VehicleTypeName}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 d-flex gap-3">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loadingSubmit || !canAdd}
                    >
                      <FaSave className="me-2" />
                      Submit
                    </button>

                    <button
                      type="button"
                      className="btn btn-warning"
                      onClick={handleUpdate}
                      disabled={!vehicleType.VehicleTypeID || loadingUpdate || !canEdit}
                    >
                      <FaEdit className="me-2" />
                      Update
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleDelete}
                      disabled={!vehicleType.VehicleTypeID || loadingDelete || !canDelete}
                    >
                      <FaTrashAlt className="me-2" />
                      Delete
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleClear}
                    >
                      <FaEraser className="me-2" />
                      Clear
                    </button>
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

export default VehicleTypeMaster;
*/

import React from 'react';
const VehicleTypeMaster = () => null;
export default VehicleTypeMaster;
