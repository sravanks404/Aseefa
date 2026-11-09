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
  FaTags,
} from "react-icons/fa";

import api from "../../apiService";
import { usePermission } from "../../../src/context/permissionContex";

const primaryColor = "rgb(45, 75, 169)";

const SALARY_BASIS_OPTIONS = [
  { value: "", label: "-- Select Salary Basis --" },
  { value: "Hourly", label: "Hourly" },
  { value: "Fixed", label: "Fixed" },
  { value: "Overtime", label: "Overtime" },
];

function EmployeeCategory() {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const { getPermission, refreshPermissions } = usePermission();
  const permission = getPermission("EMP_CATEGORY");
  const canView = !!permission?.CanView;
  const canAdd = !!permission?.CanAdd;
  const canEdit = !!permission?.CanEdit;
  const canDelete = !!permission?.CanDelete;

  const [category, setCategory] = useState({
    CategoryID: 0,
    CategoryName: "",
    SalaryBasis: "",
  });

  // ---------------- FETCH CATEGORIES ----------------

  const fetchCategories = async () => {
    try {
      const companyId = sessionStorage.getItem("CompanyID");

      const res = await api.get("/api/GetEmployeeCategoryList", {
        params: {
          CompanyID: companyId,
        },
      });

      setCategories(res.data || []);
    } catch (error) {
      toast.error("Failed to load employee categories");
    }
  };

  useEffect(() => {
    refreshPermissions();
  }, []);

  useEffect(() => {
    if (!canView) {
      setCategories([]);
      setShowForm(false);
      return;
    }
    fetchCategories();
  }, [canView]);

  // ---------------- VALIDATION ----------------

  const validateFields = () => {
    const errors = {};

    if (!category.CategoryName?.trim()) {
      errors.CategoryName = "Category Name is required";
    }

    if (!category.SalaryBasis) {
      errors.SalaryBasis = "Salary Basis is required";
    }

    return errors;
  };

  // ---------------- DUPLICATE CHECK ----------------

  const checkDuplicate = (name, currentID = 0) => {
    return categories.some(
      (c) =>
        c.CategoryName?.trim().toLowerCase() === name.trim().toLowerCase() &&
        c.CategoryID !== currentID
    );
  };

  // ---------------- INPUT CHANGE ----------------

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setCategory((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // ---------------- ROW CLICK ----------------

  const handleRowClick = (selected) => {
    if (!canView) {
      toast.error("You do not have permission to view employee categories.");
      return;
    }
    setCategory({
      CategoryID: selected.CategoryID,
      CategoryName: selected.CategoryName,
      SalaryBasis: selected.SalaryBasis,
    });

    setShowForm(true);
  };

  // ---------------- SUBMIT ----------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canAdd) {
      toast.error("You do not have permission to create employee categories.");
      return;
    }

    const errors = validateFields();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    if (checkDuplicate(category.CategoryName)) {
      toast.error("Employee category already exists");
      return;
    }

    try {
      setLoadingSubmit(true);

      const payload = {
        CategoryID: 0,
        CategoryName: category.CategoryName.trim(),
        SalaryBasis: category.SalaryBasis,
        CompanyID: parseInt(sessionStorage.getItem("CompanyID")),
        CreatedBy: parseInt(sessionStorage.getItem("UserId")),
      };

      const response = await api.post("/api/InsertUpdateEmployeeCategory", payload);

      if (response.data.success) {
        toast.success("Employee category created successfully");
        fetchCategories();
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
      toast.error("You do not have permission to update employee categories.");
      return;
    }

    const errors = validateFields();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    if (checkDuplicate(category.CategoryName, category.CategoryID)) {
      toast.error("Employee category already exists");
      return;
    }

    try {
      setLoadingUpdate(true);

      const payload = {
        CategoryID: category.CategoryID,
        CategoryName: category.CategoryName.trim(),
        SalaryBasis: category.SalaryBasis,
        CompanyID: parseInt(sessionStorage.getItem("CompanyID")),
        ModifiedBy: parseInt(sessionStorage.getItem("UserId")),
      };

      const response = await api.post("/api/InsertUpdateEmployeeCategory", payload);

      if (response.data.success) {
        toast.success("Employee category updated successfully");
        fetchCategories();
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
              Are you sure you want to delete this employee category?
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
      toast.error("You do not have permission to delete employee categories.");
      return;
    }

    if (!category.CategoryID) {
      toast.error("No category selected");
      return;
    }

    const confirm = await confirmDeleteToast();

    if (!confirm) return;

    try {
      setLoadingDelete(true);

      const response = await api.post("/api/DeleteEmployeeCategory", {
        CategoryID: category.CategoryID,
        DeletedBy: parseInt(sessionStorage.getItem("UserId")),
      });

      if (response.data.success) {
        toast.success("Employee category deleted successfully");
        fetchCategories();
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
    setCategory({
      CategoryID: 0,
      CategoryName: "",
      SalaryBasis: "",
    });

    setFieldErrors({});
  };

  const handleCreateNew = () => {
    if (!canAdd) {
      toast.error("You do not have permission to create employee categories.");
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

  const filteredCategories = categories.filter(
    (item) =>
      item.CategoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.CategoryID?.toString().includes(searchTerm) ||
      item.SalaryBasis?.toLowerCase().includes(searchTerm.toLowerCase())
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
              You do not have permission to view Employee Categories.
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
                    style={{ fontWeight: "600", color: "#2d3748" }}
                  >
                    <FaTags className="me-2" style={{ color: primaryColor }} />
                    Employee Category Management
                  </h2>

                  <div className="d-flex justify-content-between align-items-center">
                    <div style={{ flex: 1, maxWidth: "500px" }}>
                      <div className="input-group">
                        <span
                          className="input-group-text text-white"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <FaSearch />
                        </span>

                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search by name, salary basis..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>

                    <button
                      className="btn"
                      style={{ background: primaryColor, color: "#fff", opacity: canAdd ? 1 : 0.6 }}
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
                        <th className="px-4 py-3">Category ID</th>
                        <th className="py-3">Category Name</th>
                        <th className="py-3">Salary Basis</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((item) => (
                          <tr
                            key={item.CategoryID}
                            onClick={() => handleRowClick(item)}
                            style={{ cursor: "pointer" }}
                          >
                            <td className="px-4 py-3">{item.CategoryID}</td>
                            <td className="py-3">{item.CategoryName}</td>
                            <td className="py-3">
                              <span
                                className="badge"
                                style={{
                                  backgroundColor:
                                    item.SalaryBasis === "Hourly"
                                      ? "#e8f4fd"
                                      : item.SalaryBasis === "Fixed"
                                      ? "#e8f8ee"
                                      : "#fff3e0",
                                  color:
                                    item.SalaryBasis === "Hourly"
                                      ? "#1a73e8"
                                      : item.SalaryBasis === "Fixed"
                                      ? "#2e7d32"
                                      : "#e65100",
                                  fontWeight: "500",
                                  fontSize: "0.82rem",
                                  padding: "5px 10px",
                                  borderRadius: "20px",
                                }}
                              >
                                {item.SalaryBasis}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center p-5">
                            No Employee Categories Found
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
                  <FaTags className="me-2" style={{ color: primaryColor }} />
                  {category.CategoryID
                    ? "Edit Employee Category"
                    : "New Employee Category"}
                </h4>

                <button className="btn" onClick={handleBackToList}>
                  <FaArrowLeft className="me-2" />
                  Back
                </button>
              </div>

              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="row g-4">
                    {/* Category Name */}
                    <div className="col-md-6">
                      <label className="form-label">
                        Category Name <span className="text-danger">*</span>
                      </label>

                      <input
                        type="text"
                        className={`form-control ${
                          fieldErrors.CategoryName ? "is-invalid" : ""
                        }`}
                        name="CategoryName"
                        value={category.CategoryName}
                        onChange={handleInputChange}
                        placeholder="Enter category name"
                      />

                      {fieldErrors.CategoryName && (
                        <div className="invalid-feedback">
                          {fieldErrors.CategoryName}
                        </div>
                      )}
                    </div>

                    {/* Salary Basis */}
                    <div className="col-md-6">
                      <label className="form-label">
                        Salary Basis <span className="text-danger">*</span>
                      </label>

                      <select
                        className={`form-select ${
                          fieldErrors.SalaryBasis ? "is-invalid" : ""
                        }`}
                        name="SalaryBasis"
                        value={category.SalaryBasis}
                        onChange={handleInputChange}
                      >
                        {SALARY_BASIS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>

                      {fieldErrors.SalaryBasis && (
                        <div className="invalid-feedback">
                          {fieldErrors.SalaryBasis}
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
                      {loadingSubmit ? "Saving..." : "Submit"}
                    </button>

                    <button
                      type="button"
                      className="btn btn-warning"
                      onClick={handleUpdate}
                      disabled={!category.CategoryID || loadingUpdate || !canEdit}
                    >
                      <FaEdit className="me-2" />
                      {loadingUpdate ? "Updating..." : "Update"}
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleDelete}
                      disabled={!category.CategoryID || loadingDelete || !canDelete}
                    >
                      <FaTrashAlt className="me-2" />
                      {loadingDelete ? "Deleting..." : "Delete"}
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

export default EmployeeCategory;