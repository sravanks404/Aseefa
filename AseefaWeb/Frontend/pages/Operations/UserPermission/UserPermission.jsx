
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../apiService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PERMISSION_FIELDS = [
  "CanView",
  "CanAdd",
  "CanEdit",
  "CanDelete",
  "CanPrint",
  "CanExport",
  "CanApprove",
];
const PERMISSION_LABELS = {
  CanView: "View",
  CanAdd: "Add",
  CanEdit: "Edit",
  CanDelete: "Delete",
  CanPrint: "Print",
  CanExport: "Export",
  CanApprove: "Approve",
};

const emptyPermissions = () => ({
  CanView: false,
  CanAdd: false,
  CanEdit: false,
  CanDelete: false,
  CanPrint: false,
  CanExport: false,
  CanApprove: false,
});

const buildMenuGroups = (list) => {
  const groupedMap = new Map();
  list.forEach((item) => {
    if (!groupedMap.has(item.MenuID)) {
      groupedMap.set(item.MenuID, {
        MenuID: item.MenuID,
        MenuName: item.MenuName,
        MenuOrder: item.MenuOrder ?? 0,
        forms: [],
      });
    }
    groupedMap.get(item.MenuID).forms.push({
      FormID: item.FormID,
      FormName: item.FormName,
      FormCode: item.FormCode,
      SubMenuOrder: item.SubMenuOrder ?? 0,
      ...emptyPermissions(),
    });
  });
  return Array.from(groupedMap.values())
    .sort((a, b) => a.MenuOrder - b.MenuOrder)
    .map((menu) => ({
      ...menu,
      forms: menu.forms.sort((a, b) => a.SubMenuOrder - b.SubMenuOrder),
    }));
};

const hasAnyPermission = (form) =>
  PERMISSION_FIELDS.some((field) => !!form[field]);

// Builds the "Name (HAV/UserId)" label used in the picker — applied to every
// user the same way, regardless of their IsHavenWorker status.
const formatUserOptionLabel = (u) => {
  if (!u) return "";
  const id = u.UserId ?? u.UserID ?? u.userId;
  const name = u.Name ?? u.UserName ?? u.name ?? "Unknown";
  return `${name} (HAV/${id})`;
};

// Two-letter initials for the avatar bubble in the picker
const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const second = parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] || "";
  return (first + second).toUpperCase();
};

export default function UserPermission() {
  const [userId, setUserId] = useState("");
  const [users, setUsers] = useState([]);
  const [menus, setMenus] = useState([]);
  const [selectedMenuId, setSelectedMenuId] = useState("");

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMenus, setLoadingMenus] = useState(true);
  const [loadingUserPermissions, setLoadingUserPermissions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  // Null = we haven't checked yet for the current user. True/false once we
  // know whether this user already has saved permissions, so the Save
  // button (and the same insert/upsert API) can say "Add" vs "Update".
  const [isExistingAssignment, setIsExistingAssignment] = useState(null);
  const savingRef = useRef(false);

  // --- User picker: search box + Haven filter state ---
  const [userSearch, setUserSearch] = useState("");
  const [havenFilter, setHavenFilter] = useState("all"); // 'all' | 'haven' | 'nohaven'
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);

  const getCompanyID = () => sessionStorage.getItem("CompanyID");
  const getCreatedBy = () =>
    sessionStorage.getItem("UserId") || sessionStorage.getItem("UserID");

  useEffect(() => {
    loadUsers();
    loadMenus();
  }, []);

  // Close the user picker dropdown when clicking outside it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(e.target)
      ) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadUsers = async () => {
    const companyId = getCompanyID();
    if (!companyId) {
      toast.error("Company ID not found in session");
      setLoadingUsers(false);
      return;
    }
    try {
      setLoadingUsers(true);
      const res = await api.get(`/api/getUserForPermission?CompanyID=${companyId}`);
      setUsers(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load users:", err);
      setUsers([]);
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadMenus = async () => {
    try {
      setLoadingMenus(true);

      const res = await api.get("/api/getMenus");

      const grouped = buildMenuGroups(res.data?.data || []);
      setMenus(grouped);

      if (grouped.length > 0) {
        setSelectedMenuId(String(grouped[0].MenuID));
      }
    } catch (err) {
      console.error("Failed to load menus:", err);
      setMenus([]);
      toast.error("Failed to load menus");
    } finally {
      setLoadingMenus(false);
    }
  };

  // Pulls back whatever permissions this user already has (if any) and
  // stamps them onto every module's sub menus, so switching between
  // modules always reflects the right state for this user — not just the
  // module currently on screen.
  const loadUserPermissions = async (uid) => {
    if (!uid) return;
    try {
      setLoadingUserPermissions(true);
      const res = await api.get(`/api/getUserPermission?UserID=${uid}`);
      if (!res.data?.success) {
        throw new Error(res.data?.message || "Unable to load permissions");
      }
      const existing = res.data.data || [];
      const permByFormId = new Map(
        existing.map((item) => [String(item.FormID), item])
      );
      setMenus((prev) =>
        prev.map((menu) => ({
          ...menu,
          forms: menu.forms.map((form) => {
            const saved = permByFormId.get(String(form.FormID));
            return {
              ...form,
              CanView: !!saved?.CanView,
              CanAdd: !!saved?.CanAdd,
              CanEdit: !!saved?.CanEdit,
              CanDelete: !!saved?.CanDelete,
              CanPrint: !!saved?.CanPrint,
              CanExport: !!saved?.CanExport,
              CanApprove: !!saved?.CanApprove,
            };
          }),
        }))
      );
      setIsExistingAssignment(existing.length > 0);
    } catch (err) {
      console.error("Failed to load user permissions:", err);
      // Don't block the user from assigning permissions just because the
      // lookup failed — fall back to a blank "Add" state.
      setIsExistingAssignment(false);
      toast.error("Could not load this user's existing permissions");
    } finally {
      setLoadingUserPermissions(false);
    }
  };

  const handleUserChange = (newUserId) => {
    setUserId(newUserId);
    setFieldErrors((prev) => ({ ...prev, userId: "" }));
    setIsExistingAssignment(null);
    // Clear whatever was ticked for the previous user immediately, so the
    // table doesn't show stale checkboxes while the new user's permissions
    // are still loading from the API.
    setMenus((prev) =>
      prev.map((menu) => ({
        ...menu,
        forms: menu.forms.map((form) => ({
          ...form,
          ...emptyPermissions(),
        })),
      }))
    );
    if (newUserId) {
      loadUserPermissions(newUserId);
    }
  };

  const handleMasterMenuChange = (menuId) => {
    setSelectedMenuId(menuId);
    setFieldErrors((prev) => ({ ...prev, subMenus: "" }));
  };

  const selectedMenu = useMemo(
    () => menus.find((menu) => String(menu.MenuID) === String(selectedMenuId)),
    [menus, selectedMenuId]
  );

  // Only the sub menus of the currently selected module are shown — but
  // because permission flags live on `menus` (not on a display-only list),
  // whatever was ticked for other modules is preserved untouched underneath.
  const tableRows = selectedMenu?.forms ?? [];

  const assignedCountByMenuId = useMemo(() => {
    const counts = new Map();
    menus.forEach((menu) => {
      counts.set(
        String(menu.MenuID),
        menu.forms.filter(hasAnyPermission).length
      );
    });
    return counts;
  }, [menus]);

  const totalAssignedCount = useMemo(
    () => Array.from(assignedCountByMenuId.values()).reduce((a, b) => a + b, 0),
    [assignedCountByMenuId]
  );

  // Applies the Haven filter + search box together, for the picker's option list.
  // The search matches on name, raw user id, and the full "Name (HAV/123)" /
  // "Name (123)" label, so typing the id, "HAV", "HAV/123", or a partial name
  // or id all work — regardless of whether this particular user has the HAV
  // prefix or not.
  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    return (users || []).filter((u) => {
      if (havenFilter === "haven" && !u.IsHavenWorker) return false;
      if (havenFilter === "nohaven" && u.IsHavenWorker) return false;
      if (!term) return true;

      const id = u.UserId ?? u.UserID ?? u.userId;
      const name = (u.Name ?? u.UserName ?? u.name ?? "").toLowerCase();
      const idStr = id != null ? String(id).toLowerCase() : "";
      const label = formatUserOptionLabel(u).toLowerCase();

      return (
        name.includes(term) ||
        idStr.includes(term) ||
        label.includes(term)
      );
    });
  }, [users, havenFilter, userSearch]);

  const handlePermission = (menuId, formId, field) => {
    setFieldErrors((prev) => ({ ...prev, permissions: "" }));
    setMenus((prev) =>
      prev.map((menu) => {
        if (String(menu.MenuID) !== String(menuId)) return menu;
        return {
          ...menu,
          forms: menu.forms.map((form) => {
            if (String(form.FormID) !== String(formId)) return form;
            return { ...form, [field]: !form[field] };
          }),
        };
      })
    );
  };

  // Ticks (or unticks, if already all ticked) every permission checkbox in
  // one row at once.
  const handleSelectAllForRow = (menuId, formId) => {
    setFieldErrors((prev) => ({ ...prev, permissions: "" }));
    setMenus((prev) =>
      prev.map((menu) => {
        if (String(menu.MenuID) !== String(menuId)) return menu;
        return {
          ...menu,
          forms: menu.forms.map((form) => {
            if (String(form.FormID) !== String(formId)) return form;
            const allChecked = PERMISSION_FIELDS.every((field) => form[field]);
            const updated = { ...form };
            PERMISSION_FIELDS.forEach((field) => {
              updated[field] = !allChecked;
            });
            return updated;
          }),
        };
      })
    );
  };

  // Ticks (or unticks) every permission, for every sub menu, in the whole
  // module currently on screen — a one-click "grant everything in this
  // module" action.
  const handleSelectAllForMenu = (menuId) => {
    setFieldErrors((prev) => ({ ...prev, permissions: "" }));
    setMenus((prev) =>
      prev.map((menu) => {
        if (String(menu.MenuID) !== String(menuId)) return menu;
        const allChecked = menu.forms.every((form) =>
          PERMISSION_FIELDS.every((field) => form[field])
        );
        return {
          ...menu,
          forms: menu.forms.map((form) => {
            const updated = { ...form };
            PERMISSION_FIELDS.forEach((field) => {
              updated[field] = !allChecked;
            });
            return updated;
          }),
        };
      })
    );
  };

  const clearRow = (menuId, formId) => {
    setMenus((prev) =>
      prev.map((menu) => {
        if (String(menu.MenuID) !== String(menuId)) return menu;
        return {
          ...menu,
          forms: menu.forms.map((form) =>
            String(form.FormID) === String(formId)
              ? { ...form, ...emptyPermissions() }
              : form
          ),
        };
      })
    );
  };

  // Payload is built from every module, not just the one on screen, so
  // permissions assigned in a module the user isn't currently viewing are
  // still included when saving.
  const buildPermissionPayload = () => {
    const rows = [];
    menus.forEach((menu) => {
      menu.forms.forEach((form) => {
        if (!hasAnyPermission(form)) return;
        rows.push({
          FormID: form.FormID,
          CanView: !!form.CanView,
          CanAdd: !!form.CanAdd,
          CanEdit: !!form.CanEdit,
          CanDelete: !!form.CanDelete,
          CanPrint: !!form.CanPrint,
          CanExport: !!form.CanExport,
          CanApprove: !!form.CanApprove,
        });
      });
    });
    return rows;
  };

  const validateForm = () => {
    const errors = {};
    if (!userId) {
      errors.userId = "Please select a user";
    }
    const permissions = buildPermissionPayload();
    if (permissions.length === 0) {
      errors.permissions = "Please assign at least one permission in at least one module";
    }
    const createdBy = getCreatedBy();
    if (!createdBy) {
      errors.session = "Logged-in user not found in session";
    }
    return errors;
  };

  const savePermission = async () => {
    if (savingRef.current || saving) return;
    const errors = validateForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstError = errors.userId || errors.permissions || errors.session;
      toast.warning(firstError);
      return;
    }
    const permissions = buildPermissionPayload();
    const uniqueFormIds = new Set(permissions.map((item) => String(item.FormID)));
    if (uniqueFormIds.size !== permissions.length) {
      toast.error("Duplicate sub menu permissions detected. Please refresh and try again.");
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      // Same endpoint handles both the first-time assignment and later
      // edits — the API upserts by UserID + FormID.
      const res = await api.post("/api/saveUserPermission", {
        UserID: Number(userId),
        CreatedBy: Number(getCreatedBy()),
        Permissions: permissions,
      });
      toast.success(
        res.data?.message ||
        (isExistingAssignment ? "Permissions updated successfully" : "Permissions saved successfully")
      );
      setFieldErrors({});
      setIsExistingAssignment(true);
      // Refresh from the database so the UI always reflects what was
      // actually persisted, rather than just trusting local state.
      await loadUserPermissions(userId);
    } catch (err) {
      console.error("Failed to save permissions:", err);
      toast.error(
        err.response?.data?.message ||
        "Failed to save permissions. Please try again."
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const loading = loadingUsers || loadingMenus;

  const selectedUser = useMemo(
    () =>
      users.find(
        (u) => String(u.UserId ?? u.UserID ?? u.userId) === String(userId)
      ),
    [users, userId]
  );

  const selectedUserLabel = selectedUser
    ? selectedUser.Name ?? selectedUser.UserName ?? selectedUser.name
    : "";

  const saveButtonLabel = saving
    ? "Saving..."
    : isExistingAssignment === null
      ? "Checking..."
      : isExistingAssignment
        ? "Update Permission"
        : "Add Permission";

  return (

    <div className="page-wrapper">
      <style>{`
        .menu-tab {
          position: relative;
        }
        .menu-tab::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: 4px;
          width: 0%;
          height: 2px;
          background-color: #1E88C7;
          border-radius: 2px;
          transition: width 0.25s ease, left 0.25s ease;
        }
        .menu-tab:hover::after {
          width: 60%;
          left: 20%;
        }
        .menu-tab.active::after {
          width: 0%;
        }
        .user-select-trigger {
          border-radius: 10px;
          border: 1.5px solid #E1E9F0;
          padding: 0.55rem 0.9rem;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          background-color: #fff;
        }
        .user-select-trigger:hover {
          border-color: #B9DAF0;
        }
        .user-select-trigger.is-open {
          border-color: #1E88C7;
          box-shadow: 0 0 0 3px rgba(30,136,199,0.12);
        }
        .user-select-trigger .chevron-icon {
          transition: transform 0.15s ease;
          color: #8CA3B8;
        }
        .user-select-trigger.is-open .chevron-icon {
          transform: rotate(180deg);
        }
        .user-picker-panel {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 1000;
          margin-top: 6px;
          max-height: 380px;
          display: flex;
          flex-direction: column;
          border-radius: 14px;
          border: 1px solid #EAF0F5;
          box-shadow: 0 12px 32px rgba(20, 50, 80, 0.14);
          overflow: hidden;
          animation: pickerFadeIn 0.14s ease;
        }
        @keyframes pickerFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .user-picker-search-wrap {
          position: relative;
        }
        .user-picker-search-wrap .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #A8B9C8;
          pointer-events: none;
        }
        .user-picker-search-input {
          padding-left: 32px !important;
          padding-right: 28px !important;
          border-radius: 8px !important;
          background-color: #F6F9FB;
          border: 1.5px solid transparent !important;
        }
        .user-picker-search-input:focus {
          background-color: #fff;
          border-color: #1E88C7 !important;
          box-shadow: none !important;
        }
        .user-picker-search-clear {
          position: absolute;
          right: 6px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: #A8B9C8;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          line-height: 1;
          font-size: 0.9rem;
        }
        .user-picker-search-clear:hover {
          background-color: #E7EEF3;
          color: #5C7488;
        }
        .haven-segmented {
          display: inline-flex;
          background-color: #F0F4F7;
          border-radius: 8px;
          padding: 3px;
          gap: 2px;
        }
        .haven-segmented button {
          border: none;
          background: transparent;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 6px;
          color: #7C93A5;
          transition: background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
        }
        .haven-segmented button.active {
          background-color: #ffffff;
          color: #1E88C7;
          box-shadow: 0 1px 3px rgba(20,50,80,0.15);
        }
        .haven-segmented button:not(.active):hover {
          color: #4B6478;
        }
        .user-picker-list {
          overflow-y: auto;
          padding: 6px;
        }
        .user-picker-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          text-align: left;
          background: transparent;
          border: none;
          padding: 8px 10px;
          font-size: 0.88rem;
          border-radius: 9px;
          transition: background-color 0.12s ease;
        }
        .user-picker-item:hover {
          background-color: #F1F7FB;
        }
        .user-picker-item.active {
          background-color: #E7F3FC;
        }
        .user-picker-avatar {
          flex: 0 0 auto;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 700;
          background-color: #DCEEFA;
          color: #1E88C7;
        }
        .user-picker-item.active .user-picker-avatar {
          background-color: #1E88C7;
          color: #fff;
        }
        .user-picker-item-name {
          font-weight: 600;
          color: #29414F;
          line-height: 1.2;
        }
        .user-picker-item.active .user-picker-item-name {
          color: #1E88C7;
        }
        .user-picker-item-id {
          font-size: 0.74rem;
          color: #93A6B5;
          line-height: 1.2;
        }
        .user-picker-empty {
          padding: 28px 16px;
          text-align: center;
          color: #9CB0BF;
          font-size: 0.85rem;
        }
      `}</style>
      <div className="container-xl">
        <div className="page-header d-print-none mt-2">
          <div className="row g-2 align-items-center">
            <div className="col">
              <h2 className="page-title">User Permission</h2>
              <div className="text-muted mt-1">
                Choose a user, then assign access module by module.
              </div>
            </div>
          </div>
        </div>
        <div className="page-body mt-1">
          <div className="container-xl">
            <ToastContainer position="top-center" autoClose={3000} />
            <div className="card mt-3">
              <div className="card-body">
                <div className="row g-3 align-items-end mb-3">
                  <div
                    className="col-md-5"
                    ref={userDropdownRef}
                    style={{ position: "relative" }}
                  >
                    <label className="form-label fw-semibold mb-1">Select User</label>
                    <div
                      className={`user-select-trigger d-flex justify-content-between align-items-center ${isUserDropdownOpen ? "is-open" : ""
                        } ${fieldErrors.userId ? "is-invalid" : ""}`}
                      style={{
                        cursor: loadingUsers || saving ? "not-allowed" : "pointer",
                      }}
                      onClick={() => {
                        if (!loadingUsers && !saving) {
                          setIsUserDropdownOpen((v) => !v);
                        }
                      }}
                    >
                      <span className={userId ? "" : "text-muted"}>
                        {userId
                          ? formatUserOptionLabel(selectedUser)
                          : "-- Select User --"}
                      </span>
                      <svg
                        className="chevron-icon ms-2"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                    {fieldErrors.userId && (
                      <div className="invalid-feedback d-block">{fieldErrors.userId}</div>
                    )}

                    {isUserDropdownOpen && (
                      <div className="bg-white user-picker-panel">
                        <div className="p-2 border-bottom">
                          <div className="user-picker-search-wrap mb-2">
                            <svg
                              className="search-icon"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="11" cy="11" r="7" />
                              <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                              type="text"
                              className="form-control form-control-sm user-picker-search-input"
                              placeholder="Search by name or ID..."
                              value={userSearch}
                              autoFocus
                              onChange={(e) => setUserSearch(e.target.value)}
                            />
                            {userSearch && (
                              <button
                                type="button"
                                className="user-picker-search-clear"
                                onClick={() => setUserSearch("")}
                                aria-label="Clear search"
                              >
                                &times;
                              </button>
                            )}
                          </div>
                          <div className="haven-segmented w-100">
                            {[
                              { key: "all", label: "All" },
                              { key: "haven", label: "Haven" },
                              { key: "nohaven", label: "No Haven" },
                            ].map((opt) => (
                              <button
                                key={opt.key}
                                type="button"
                                className={`flex-fill ${havenFilter === opt.key ? "active" : ""}`}
                                onClick={() => setHavenFilter(opt.key)}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="user-picker-list">
                          {filteredUsers.length === 0 ? (
                            <div className="user-picker-empty">No users match your search.</div>
                          ) : (
                            filteredUsers.map((u) => {
                              const id = u.UserId ?? u.UserID ?? u.userId;
                              const name = u.Name ?? u.UserName ?? u.name ?? "Unknown";
                              const isActive = String(id) === String(userId);
                              return (
                                <button
                                  type="button"
                                  key={id}
                                  className={`user-picker-item ${isActive ? "active" : ""}`}
                                  onClick={() => {
                                    handleUserChange(String(id));
                                    setIsUserDropdownOpen(false);
                                    setUserSearch("");
                                  }}
                                >
                                  <span className="user-picker-avatar">{getInitials(name)}</span>
                                  <span className="d-flex flex-column">
                                    <span className="user-picker-item-name">{name}</span>
                                    <span className="user-picker-item-id">HAV/{id}</span>
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="col-md-7">
                    {userId && (
                      <div
                        className={`alert py-2 mb-0 ${loadingUserPermissions
                          ? "alert-secondary"
                          : isExistingAssignment
                            ? "alert-info"
                            : "alert-light border"
                          }`}
                      >
                        {loadingUserPermissions ? (
                          <>Checking existing permissions for {selectedUserLabel}…</>
                        ) : isExistingAssignment ? (
                          <>
                            <strong>{selectedUserLabel}</strong> already has saved
                            permissions loaded below — changes will update them.
                          </>
                        ) : (
                          <>
                            <strong>{selectedUserLabel}</strong> has no permissions yet —
                            tick what they should have access to, then save.
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {fieldErrors.permissions && (
                  <div className="alert alert-warning py-2">{fieldErrors.permissions}</div>
                )}
                {loading ? (
                  <div className="text-center p-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">Loading user and menu data...</p>
                  </div>
                ) : menus.length === 0 ? (
                  <div className="alert alert-info mb-0">No modules are configured.</div>
                ) : (
                  <div>
                    <div
                      className="d-flex flex-wrap mb-3"
                      style={{
                        backgroundColor: "#EEF6FC",
                        border: "1px solid #D6EAF8",
                        borderRadius: "10px",
                        padding: "6px",
                        gap: "4px",
                      }}
                    >
                      {menus.map((menu) => {
                        const isActive = String(menu.MenuID) === String(selectedMenuId);
                        const count = assignedCountByMenuId.get(String(menu.MenuID)) || 0;
                        return (
                          <button
                            type="button"
                            key={menu.MenuID}
                            className={`d-flex align-items-center gap-2 menu-tab ${isActive ? "active" : ""}`}
                            style={{
                              flex: "1 1 auto",
                              justifyContent: "center",
                              border: "none",
                              borderRadius: "8px",
                              backgroundColor: isActive ? "#ffffff" : "transparent",
                              color: isActive ? "#1E88C7" : "#7FA8C9",
                              fontWeight: isActive ? 600 : 500,
                              padding: "0.5rem 1rem",
                              boxShadow: isActive ? "0 1px 4px rgba(30,136,199,0.18)" : "none",
                              transition: "background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease",
                            }}
                            onClick={() => handleMasterMenuChange(String(menu.MenuID))}
                          >
                            <span>{menu.MenuName}</span>
                            {count > 0 && (
                              <span
                                className="badge rounded-pill"
                                style={{
                                  backgroundColor: isActive ? "#1E88C7" : "#D6EAF8",
                                  color: isActive ? "#ffffff" : "#2E7DAF",
                                }}
                              >
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {/* Permissions for the selected module only */}
                    <div className="card mb-0">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h3 className="card-title mb-0">
                          {selectedMenu?.MenuName || "Select a module"}
                        </h3>
                        {tableRows.length > 0 && (
                          <div className="form-check form-switch mb-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              id="selectAllModule"
                              checked={tableRows.every(
                                (form) =>
                                  hasAnyPermission(form) &&
                                  PERMISSION_FIELDS.every((f) => form[f])
                              )}
                              onChange={() => handleSelectAllForMenu(selectedMenu.MenuID)}
                            />
                            <label className="form-check-label" htmlFor="selectAllModule">
                              Grant all in this module
                            </label>
                          </div>
                        )}
                      </div>
                      {tableRows.length === 0 ? (
                        <div className="card-body">
                          <div className="alert alert-info mb-0">
                            This module has no sub menus.
                          </div>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-vcenter card-table table-bordered mb-0">
                            <thead>
                              <tr>
                                <th>Sub Menu</th>
                                {PERMISSION_FIELDS.map((field) => (
                                  <th key={field} className="text-center">
                                    {PERMISSION_LABELS[field]}
                                  </th>
                                ))}
                                <th className="text-center" style={{ width: 80 }}>
                                  All
                                </th>
                                <th className="text-center" style={{ width: 80 }}>
                                  Clear
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {tableRows.map((form) => {
                                const allChecked = PERMISSION_FIELDS.every(
                                  (field) => form[field]
                                );
                                return (
                                  <tr key={form.FormID}>
                                    <td>{form.FormName}</td>
                                    {PERMISSION_FIELDS.map((field) => (
                                      <td key={field} className="text-center">
                                        <input
                                          type="checkbox"
                                          aria-label={field}
                                          className="form-check-input"
                                          checked={form[field]}
                                          onChange={() =>
                                            handlePermission(
                                              selectedMenu.MenuID,
                                              form.FormID,
                                              field
                                            )
                                          }
                                        />
                                      </td>
                                    ))}
                                    <td className="text-center">
                                      <input
                                        type="checkbox"
                                        aria-label="Select all permissions for this row"
                                        className="form-check-input"
                                        title="Tick/untick all permissions for this row"
                                        checked={allChecked}
                                        onChange={() =>
                                          handleSelectAllForRow(
                                            selectedMenu.MenuID,
                                            form.FormID
                                          )
                                        }
                                      />
                                    </td>
                                    <td className="text-center">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary"
                                        title="Clear all permissions for this row"
                                        disabled={!hasAnyPermission(form)}
                                        onClick={() =>
                                          clearRow(selectedMenu.MenuID, form.FormID)
                                        }
                                      >
                                        &times;
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted">
                    {totalAssignedCount > 0 &&
                      `${totalAssignedCount} sub menu${totalAssignedCount === 1 ? "" : "s"
                      } assigned across all modules`}
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={savePermission}
                    disabled={!userId || saving || loading || loadingUserPermissions ||
                      menus.length === 0}
                  >
                    {saveButtonLabel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}