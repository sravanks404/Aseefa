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
  FaMoneyBillWave,
  FaChevronDown,
} from "react-icons/fa";

import api from '../../apiService';
import { usePermission } from '../../../src/context/permissionContex';
const primaryColor = "rgb(45, 75, 169)";


function AcGroupNode({
  item,
  acGroupList,
  level,
  expandedGroup,
  setExpandedGroup,
  onSelect,
}) {
  const children = acGroupList.filter(
    (x) => Number(x.GUnder) === Number(item.GSlNo)
  );
  const hasChildren = children.length > 0;
  const isExpanded = expandedGroup[item.GSlNo];

  return (
    <div>
      <div
        className="dd-row border-bottom"
        style={{
          padding: "10px 14px",
          paddingLeft: `${15 + level * 20}px`,
          cursor: "pointer",
          background: level === 0 ? "#f8fafc" : "#fff",
          fontWeight: hasChildren ? 700 : 500,
          fontSize: "13px",
        }}
        onClick={() => {
          if (hasChildren) {
            setExpandedGroup((prev) => ({
              ...prev,
              [item.GSlNo]: !prev[item.GSlNo],
            }));
          } else {
            onSelect(item);
          }
        }}
      >
        {hasChildren ? (isExpanded ? "▼ " : "▶ ") : "• "}
        {item.GName}
      </div>

      {hasChildren &&
        isExpanded &&
        children.map((child) => (
          <AcGroupNode
            key={child.GSlNo}
            item={child}
            acGroupList={acGroupList}
            level={level + 1}
            expandedGroup={expandedGroup}
            setExpandedGroup={setExpandedGroup}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}

function VehicleExpenseTypeMaster() {
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [acGroupList, setAcGroupList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [showAcGroupMenu, setShowAcGroupMenu] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState({});
  const { getPermission, refreshPermissions } = usePermission();
  const permission = getPermission("EXPENSE_TYPE");
  const canView = !!permission?.CanView;
  const canAdd = !!permission?.CanAdd;
  const canEdit = !!permission?.CanEdit;
  const canDelete = !!permission?.CanDelete;

  const [expenseType, setExpenseType] = useState({
    ExpenseTypeID: 0,
    ExpenseName: "",
    ACGroupID: "",
    ACGroupName: "",
  });

  // ---------------- FETCH EXPENSE TYPES + AC GROUPS ----------------

  const fetchExpenseTypes = async () => {
    try {
      setLoading(true);
      const companyId = sessionStorage.getItem("CompanyID");

      const res = await api.get("/api/GetExpenseTypeList", {
        params: { CompanyID: companyId },
      });

      setExpenseTypes(res.data || []);
    } catch (error) {
      toast.error("Failed to load expense types");
    } finally {
      setLoading(false);
    }
  };

 const fetchAcGroups = async () => {
  try {
    const res = await api.get("/api/getLedgers");
    if (res.data.success) setAcGroupList(res.data.data || []);
  } catch (error) {
    toast.error("Failed to load AC Groups");
  }
};

  useEffect(() => {
    refreshPermissions();
  }, []);

  useEffect(() => {
    if (!canView) {
      setExpenseTypes([]);
      setShowForm(false);
      return;
    }

    fetchExpenseTypes();
    fetchAcGroups();
  }, [canView]);

  // ---------------- VALIDATION ----------------

  const validateFields = () => {
    const errors = {};

    if (!expenseType.ExpenseName?.trim()) {
      errors.ExpenseName = "Expense Name is required";
    }

    if (!expenseType.ACGroupID) {
      errors.ACGroupID = "AC Group is required";
    }

    return errors;
  };

  // ---------------- DUPLICATE CHECK ----------------

  const checkDuplicateExpenseType = (expenseName, currentExpenseTypeID = 0) => {
    return expenseTypes.some(
      (e) =>
        e.ExpenseName?.trim().toLowerCase() ===
          expenseName.trim().toLowerCase() &&
        e.ExpenseTypeID !== currentExpenseTypeID
    );
  };

  // ---------------- INPUT CHANGE ----------------

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setExpenseType((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAcGroupSelect = (item) => {
    setExpenseType((prev) => ({
      ...prev,
      ACGroupID: item.GSlNo,
      ACGroupName: item.GName,
    }));
    setShowAcGroupMenu(false);
  };

  // ---------------- ROW CLICK ----------------

  const handleRowClick = (selected) => {
    if (!canView) {
      toast.error("You do not have permission to view expense types.");
      return;
    }

    setExpenseType({
      ExpenseTypeID: selected.ExpenseTypeID,
      ExpenseName: selected.ExpenseName,
      ACGroupID: selected.ACGroupID,
      ACGroupName: selected.ACGroupName,
    });

    setShowForm(true);
  };

  // ---------------- SUBMIT ----------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canAdd) {
      toast.error("You do not have permission to create expense types.");
      return;
    }

    const errors = validateFields();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    if (checkDuplicateExpenseType(expenseType.ExpenseName)) {
      toast.error("Expense Type already exists");
      return;
    }

    try {
      setLoadingSubmit(true);

      const payload = {
        ExpenseTypeID: 0,
        ExpenseName: expenseType.ExpenseName.trim(),
        ACGroupID: parseInt(expenseType.ACGroupID),
        CompanyID: parseInt(sessionStorage.getItem("CompanyID")),
        CreatedBy: parseInt(sessionStorage.getItem("UserId")),
      };

      const response = await api.post(
        "/api/InsertUpdateExpenseType",
        payload
      );

      if (response.data.success) {
        toast.success("Expense Type created successfully");

        fetchExpenseTypes();
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
      toast.error("You do not have permission to update expense types.");
      return;
    }

    const errors = validateFields();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    if (
      checkDuplicateExpenseType(
        expenseType.ExpenseName,
        expenseType.ExpenseTypeID
      )
    ) {
      toast.error("Expense Type already exists");
      return;
    }

    try {
      setLoadingUpdate(true);

      const payload = {
        ExpenseTypeID: expenseType.ExpenseTypeID,
        ExpenseName: expenseType.ExpenseName.trim(),
        ACGroupID: parseInt(expenseType.ACGroupID),
        CompanyID: parseInt(sessionStorage.getItem("CompanyID")),
        ModifiedBy: parseInt(sessionStorage.getItem("UserId")),
      };

      const response = await api.post(
        "/api/InsertUpdateExpenseType",
        payload
      );

      if (response.data.success) {
        toast.success("Expense Type updated successfully");

        fetchExpenseTypes();
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
              Are you sure you want to delete this expense type?
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
      toast.error("You do not have permission to delete expense types.");
      return;
    }

    if (!expenseType.ExpenseTypeID) {
      toast.error("No expense type selected");
      return;
    }

    const confirm = await confirmDeleteToast();

    if (!confirm) return;

    try {
      setLoadingDelete(true);

      const response = await api.post("/api/DeleteExpenseType", {
        ExpenseTypeID: expenseType.ExpenseTypeID,
        DeletedBy: parseInt(sessionStorage.getItem("UserId")),
      });

      if (response.data.success) {
        toast.success("Expense Type deleted successfully");

        fetchExpenseTypes();
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
    setExpenseType({
      ExpenseTypeID: 0,
      ExpenseName: "",
      ACGroupID: "",
      ACGroupName: "",
    });

    setFieldErrors({});
    setShowAcGroupMenu(false);
  };

  const handleCreateNew = () => {
    if (!canAdd) {
      toast.error("You do not have permission to create expense types.");
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

  const filteredExpenseTypes = expenseTypes.filter(
    (item) =>
      item.ExpenseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ACGroupName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ExpenseTypeID?.toString().includes(searchTerm)
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
              You do not have permission to view Expense Type Management.
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
                    <FaMoneyBillWave
                      className="me-2"
                      style={{ color: primaryColor }}
                    />
                    Expense Type Management
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
                          placeholder="Search Expense Type..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
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

              {/* Table */}

              <div
                className="card border-0 shadow-sm"
                style={{ borderRadius: "12px" }}
              >
                <div className="card-body p-0">
                  {loading ? (
                    <div className="text-center p-5">
                      <div
                        className="spinner-border"
                        role="status"
                        style={{ color: primaryColor }}
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-3 text-muted">
                        Loading expense types...
                      </p>
                    </div>
                  ) : (
                    <table className="table table-hover mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th className="px-4 py-3">Expense Type ID</th>
                          <th className="py-3">Expense Name</th>
                          <th className="py-3">AC Group</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredExpenseTypes.length > 0 ? (
                          filteredExpenseTypes.map((item) => (
                            <tr
                              key={item.ExpenseTypeID}
                              onClick={() => handleRowClick(item)}
                              style={{
                                cursor: "pointer",
                              }}
                            >
                              <td className="px-4 py-3">
                                {item.ExpenseTypeID}
                              </td>
                              <td className="py-3">{item.ExpenseName}</td>
                              <td className="py-3">{item.ACGroupName}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" className="text-center p-5">
                              No Expense Types Found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
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
                  <FaMoneyBillWave
                    className="me-2"
                    style={{ color: primaryColor }}
                  />
                  {expenseType.ExpenseTypeID
                    ? "Edit Expense Type"
                    : "New Expense Type"}
                </h4>

                <button className="btn" onClick={handleBackToList}>
                  <FaArrowLeft className="me-2" />
                  Back
                </button>
              </div>

              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">
                        Expense Name <span className="text-danger">*</span>
                      </label>

                      <input
                        type="text"
                        className={`form-control ${
                          fieldErrors.ExpenseName ? "is-invalid" : ""
                        }`}
                        name="ExpenseName"
                        value={expenseType.ExpenseName}
                        onChange={handleInputChange}
                        placeholder="e.g. Fuel, Toll Charges"
                      />

                      {fieldErrors.ExpenseName && (
                        <div className="invalid-feedback">
                          {fieldErrors.ExpenseName}
                        </div>
                      )}
                    </div>

                    <div className="col-md-6 position-relative">
                      <label className="form-label">
                        AC Group <span className="text-danger">*</span>
                      </label>

                      <div
                        className={`form-control d-flex justify-content-between align-items-center ${
                          fieldErrors.ACGroupID ? "is-invalid" : ""
                        }`}
                        style={{
                          cursor: "pointer",
                          color: expenseType.ACGroupName ? "#212529" : "#98A2B3",
                        }}
                        onClick={() => setShowAcGroupMenu(!showAcGroupMenu)}
                      >
                        <span>
                          {expenseType.ACGroupName || "Select AC Group"}
                        </span>
                        <FaChevronDown size={11} />
                      </div>

                      {fieldErrors.ACGroupID && (
                        <div className="invalid-feedback d-block">
                          {fieldErrors.ACGroupID}
                        </div>
                      )}

                      {showAcGroupMenu && (
                        <div
                          className="position-absolute w-100 bg-white mt-1"
                          style={{
                            zIndex: 1000,
                            maxHeight: "350px",
                            overflowY: "auto",
                            border: "1px solid #E6E9F1",
                            borderRadius: "10px",
                            boxShadow: "0 8px 24px rgba(16,24,40,0.10)",
                          }}
                        >
                          {acGroupList
                            .filter((item) => Number(item.GUnder) === 0)
                            .map((item) => (
                              <AcGroupNode
                                key={item.GSlNo}
                                item={item}
                                acGroupList={acGroupList}
                                level={0}
                                expandedGroup={expandedGroup}
                                setExpandedGroup={setExpandedGroup}
                                onSelect={handleAcGroupSelect}
                              />
                            ))}
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
                      disabled={!expenseType.ExpenseTypeID || loadingUpdate || !canEdit}
                    >
                      <FaEdit className="me-2" />
                      Update
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleDelete}
                      disabled={!expenseType.ExpenseTypeID || loadingDelete || !canDelete}
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

export default VehicleExpenseTypeMaster;