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
  FaUserTag,
} from "react-icons/fa";

import api from '../../apiService';
import { usePermission } from '../../../src/context/permissionContex';
const primaryColor = "rgb(45, 75, 169)";

function Roles() {
  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const { getPermission, refreshPermissions } = usePermission();
  const permission = getPermission("TRADES");
  const canView = !!permission?.CanView;
  const canAdd = !!permission?.CanAdd;
  const canEdit = !!permission?.CanEdit;
  const canDelete = !!permission?.CanDelete;

  const [role, setRole] = useState({
    RoleID: 0,
    RoleName: "",
  });

  // ---------------- FETCH ROLES ----------------

  const fetchRoles = async () => {
    try {
      const companyId = sessionStorage.getItem("CompanyID");

      const res = await api.get("/api/GetRoleList", {
        params: {
          CompanyID: companyId,
        },
      });

      setRoles(res.data || []); 
    } catch (error) {
      toast.error("Failed to load roles");
    }
  };

  useEffect(() => {
    refreshPermissions();
  }, []);

  useEffect(() => {
    if (!canView) {
      setRoles([]);
      setShowForm(false);
      return;
    }
    fetchRoles();
  }, [canView]);

  // ---------------- VALIDATION ----------------

  const validateFields = () => {
    const errors = {};

    if (!role.RoleName?.trim()) {
      errors.RoleName = "Role Name is required";
    }

    return errors;
  };

  // ---------------- DUPLICATE CHECK ----------------

  const checkDuplicateRole = (roleName, currentRoleID = 0) => {
    return roles.some(
      (r) =>
        r.RoleName?.trim().toLowerCase() ===
          roleName.trim().toLowerCase() &&
        r.RoleID !== currentRoleID
    );
  };

  // ---------------- INPUT CHANGE ----------------

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setRole((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ---------------- ROW CLICK ----------------

  const handleRowClick = (selectedRole) => {
    if (!canView) {
      toast.error("You do not have permission to view trades.");
      return;
    }
    setRole({
      RoleID: selectedRole.RoleID,
      RoleName: selectedRole.RoleName,
    });

    setShowForm(true);
  };

  // ---------------- SUBMIT ----------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canAdd) {
      toast.error("You do not have permission to create trades.");
      return;
    }

    const errors = validateFields();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    if (checkDuplicateRole(role.RoleName)) {
      toast.error("Trade already exists");
      return;
    }

    try {
      setLoadingSubmit(true);

      const payload = {
        RoleID: 0,
        RoleName: role.RoleName.trim(),
        CompanyID: parseInt(sessionStorage.getItem("CompanyID")),
        CreatedBy: parseInt(sessionStorage.getItem("UserId")),
      };

      const response = await api.post(
        "/api/InsertUpdateRole",
        payload
      );

      if (response.data.success) {
        toast.success("Trade created successfully");

        fetchRoles();
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
      toast.error("You do not have permission to update trades.");
      return;
    }

    const errors = validateFields();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    if (checkDuplicateRole(role.RoleName, role.RoleID)) {
      toast.error("Trade already exists");
      return;
    }

    try {
      setLoadingUpdate(true);

      const payload = {
        RoleID: role.RoleID,
        RoleName: role.RoleName.trim(),
        CompanyID: parseInt(sessionStorage.getItem("CompanyID")),
        ModifiedBy: parseInt(sessionStorage.getItem("UserId")),
      };

      const response = await api.post(
        "/api/InsertUpdateRole",
        payload
      );

      if (response.data.success) {
        toast.success("Trade updated successfully");

        fetchRoles();
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
              Are you sure you want to delete this trade?
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
      toast.error("You do not have permission to delete trades.");
      return;
    }

    if (!role.RoleID) {
      toast.error("No role selected");
      return;
    }

    const confirm = await confirmDeleteToast();

    if (!confirm) return;

    try {
      setLoadingDelete(true);

      const response = await api.post("/api/DeleteRole", {
        RoleID: role.RoleID,
        DeletedBy: parseInt(sessionStorage.getItem("UserId")),
      });

      if (response.data.success) {
        toast.success("Trade deleted successfully");

        fetchRoles();
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
    setRole({
      RoleID: 0,
      RoleName: "",
    });

    setFieldErrors({});
  };

  const handleCreateNew = () => {
    if (!canAdd) {
      toast.error("You do not have permission to create trades.");
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

  const filteredRoles = roles.filter(
    (item) =>
      item.RoleName?.toLowerCase().includes(
        searchTerm.toLowerCase()
      ) || item.RoleID?.toString().includes(searchTerm)
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
              You do not have permission to view Trades.
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
              {/* Header */}

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
                    <FaUserTag
                      className="me-2"
                      style={{ color: primaryColor }}
                    />
                    Trade Management
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
                          placeholder="Search Trade..."
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
                        opacity: canAdd ? 1 : 0.6,
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

              {/* Table */}

              <div
                className="card border-0 shadow-sm"
                style={{ borderRadius: "12px" }}
              >
                <div className="card-body p-0">
                  <table className="table table-hover mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="px-4 py-3">Trade ID</th>
                        <th className="py-3">Trade Name</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredRoles.length > 0 ? (
                        filteredRoles.map((item) => (
                          <tr
                            key={item.RoleID}
                            onClick={() =>
                              handleRowClick(item)
                            }
                            style={{
                              cursor: "pointer",
                            }}
                          >
                            <td className="px-4 py-3">
                              {item.RoleID}
                            </td>
                            <td className="py-3">
                              {item.RoleName}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="2"
                            className="text-center p-5"
                          >
                            No Trades Found
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
                  <FaUserTag
                    className="me-2"
                    style={{ color: primaryColor }}
                  />
                  {role.RoleID ? "Edit Trade" : "New Trade"}
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
                        Trade Name{" "}
                        <span className="text-danger">*</span>
                      </label>

                      <input
                        type="text"
                        className={`form-control ${
                          fieldErrors.RoleName
                            ? "is-invalid"
                            : ""
                        }`}
                        name="RoleName"
                        value={role.RoleName}
                        onChange={handleInputChange}
                      />

                      {fieldErrors.RoleName && (
                        <div className="invalid-feedback">
                          {fieldErrors.RoleName}
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
                      disabled={!role.RoleID || loadingUpdate || !canEdit}
                    >
                      <FaEdit className="me-2" />
                      Update
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleDelete}
                      disabled={!role.RoleID || loadingDelete || !canDelete}
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

export default Roles;