import React, { useEffect, useState } from "react";
import api from "../../apiService";

const INITIAL_FORM = {
  id: null, // MaintenanceID — null on create
  lastMaintenanceDate: "",
  nextScheduledMaintenance: "",
  roomId: "",
  roomNo: "",
  typeId: "",
  roomTypeId: "",
  roomType: "",
  amcAvailable: "",
  amcStartDate: "",
  amcEndDate: "",
  amcContractNo: "",
  warrantyAvailable: "",
  warrantyExpiryDate: "",
  warrantyDetails: "",
  contractorName: "",
  contractorPhone: "",
  contractorEmail: "",
  contractorAddress: "",
  serviceProvider: "",
  serviceContact: "",
  maintenanceCost: "",
  costFrequency: "",
  repairHistory: "",
  inspectionReports: "",
};

// ── session helpers ──
const getCompanyID = () => Number(sessionStorage.getItem("CompanyID")) || 0;
const getUserID = () => Number(sessionStorage.getItem("UserId")) || 0;

// NOTE: adjust the right-hand-side field names if your getPropertyInformation
// response uses different casing than assumed here.
const mapApiProperty = (p) => ({
  id: p.PropertyID ?? p.propertyId ?? p.id,
  propertyId: p.PropertyID ?? p.propertyId ?? p.id,
  propertyName: p.PropertyName ?? p.propertyName ?? "",
  propertyCode: p.PropertyCode ?? p.propertyCode ?? "",
});

// GetPropertyMaintenance / GetPropertyMaintenanceByID recordset -> form shape.
// Column names mirror the @Param names used in insertUpdatePropertyMaintenance.
const mapApiMaintenance = (m, masters = []) => {
  const roomTypeId = m.RoomTypeID ?? m.TypeID ?? "";
  const roomId = m.RoomID ?? roomTypeId ?? "";

  const matched = Array.isArray(masters)
    ? masters.find(
      (item) => String(item.RoomID ?? item.RecordID) === String(roomId || roomTypeId)
    )
    : null;

  return {
    id: m.MaintenanceID,
    lastMaintenanceDate: (m.LastMaintenanceDate ?? "").toString().slice(0, 10),
    nextScheduledMaintenance: (m.NextScheduledMaintenance ?? "").toString().slice(0, 10),
    roomId: matched ? (matched.RoomID ?? matched.RecordID) : (m.RoomID ?? roomId ?? ""),
    roomNo: matched ? (matched.RoomNo ?? matched.FlatNo ?? "") : (m.RoomNo ?? ""),
    typeId: matched ? (matched.TypeID ?? matched.RecordID) : (m.TypeID ?? roomTypeId ?? ""),
    roomTypeId: m.RoomTypeID ?? (matched ? (matched.TypeID ?? matched.RecordID) : ""),
    roomType: m.RoomType || (matched ? (matched.RoomType ?? matched.FlatType) : "") || "",
    amcAvailable: m.AMCAvailable ?? "",
    amcStartDate: (m.AMCStartDate ?? "").toString().slice(0, 10),
    amcEndDate: (m.AMCEndDate ?? "").toString().slice(0, 10),
    amcContractNo: m.AMCContractNumber ?? "",
    warrantyAvailable: m.WarrantyAvailable ?? "",
    warrantyExpiryDate: (m.WarrantyExpiryDate ?? "").toString().slice(0, 10),
    warrantyDetails: m.WarrantyDetails ?? "",
    contractorName: m.ContractorName ?? "",
    contractorPhone: m.PhoneNumber ?? "",
    contractorEmail: m.EmailAddress ?? "",
    contractorAddress: m.ContractorAddress ?? "",
    serviceProvider: m.ServiceProvider ?? "",
    serviceContact: m.ServiceContact ?? "",
    maintenanceCost: m.MaintenanceCost ?? "",
    costFrequency: m.MaintenanceCostFrequency ?? "",
    repairHistory: m.RepairHistory ?? "",
    inspectionReports: m.InspectionReports ?? "",
  };
};

// form shape -> insertUpdatePropertyMaintenance request body
const mapFormToApiPayload = (form, { companyId, propertyId, userId }) => ({
  MaintenanceID: form.id || null,
  CompanyID: companyId,
  PropertyID: propertyId,
  LastMaintenanceDate: form.lastMaintenanceDate || null,
  NextScheduledMaintenance: form.nextScheduledMaintenance || null,
  RoomID: form.roomId ? Number(form.roomId) : null,
  RoomNo: form.roomNo || null,
  TypeID: form.typeId ? Number(form.typeId) : (form.roomTypeId ? Number(form.roomTypeId) : null),
  RoomTypeID: form.roomTypeId
    ? Number(form.roomTypeId)
    : form.typeId
      ? Number(form.typeId)
      : form.roomId
        ? Number(form.roomId)
        : null,
  RoomType: form.roomType || null,
  AMCAvailable: form.amcAvailable,
  AMCContractNumber: form.amcContractNo,
  AMCStartDate: form.amcStartDate || null,
  AMCEndDate: form.amcEndDate || null,
  WarrantyAvailable: form.warrantyAvailable,
  WarrantyExpiryDate: form.warrantyExpiryDate || null,
  WarrantyDetails: form.warrantyDetails,
  ContractorName: form.contractorName,
  PhoneNumber: form.contractorPhone,
  EmailAddress: form.contractorEmail,
  ContractorAddress: form.contractorAddress,
  ServiceProvider: form.serviceProvider,
  ServiceContact: form.serviceContact,
  MaintenanceCost: form.maintenanceCost === "" ? null : form.maintenanceCost,
  MaintenanceCostFrequency: form.costFrequency,
  RepairHistory: form.repairHistory,
  InspectionReports: form.inspectionReports,
  UserID: userId,
});

const Maintenance = () => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showList, setShowList] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [maintenanceList, setMaintenanceList] = useState([]);

  // ── Real property list (replaces the old hardcoded/prop-driven list) ──
  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);

  // ── Room Master records for selected property ──
  const [propertyMasters, setPropertyMasters] = useState([]);
  const [mastersLoading, setMastersLoading] = useState(false);

  const selectedProperty = properties.find((p) => String(p.id) === String(selectedPropertyId)) || null;
  const onSelectProperty = (propertyId) => setSelectedPropertyId(propertyId);

  const isEditing = form.id !== null;

  // ========================================================
  // LOAD PROPERTIES (real data — GET /api/getPropertyInformation)
  // ========================================================
  const loadProperties = async () => {
    const companyID = getCompanyID();
    if (!companyID) {
      setErrorMessage("CompanyID not found. Please login again.");
      return;
    }
    setPropertiesLoading(true);
    try {
      const response = await api.get("/api/getPropertyInfo", {
        params: { CompanyID: companyID },
      });
      const data = response.data;
      if (data?.success) {
        const list = Array.isArray(data.data) ? data.data.map(mapApiProperty) : [];
        setProperties(list);
        if (selectedPropertyId) {
          loadPropertyMasters(selectedPropertyId);
        }
      } else {
        setProperties([]);
        setErrorMessage(data?.message || "Failed to load properties.");
      }
    } catch (error) {
      console.error("Load property error:", error);
      setErrorMessage(error?.response?.data?.message || "Failed to load properties.");
    } finally {
      setPropertiesLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========================================================
  // LOAD MAINTENANCE RECORD FOR THE SELECTED PROPERTY
  // ========================================================
  const loadMaintenance = async (propertyId, mastersList = propertyMasters) => {
    const companyID = getCompanyID();
    if (!companyID || !propertyId) return;

    setLoading(true);
    setErrorMessage("");
    try {
      const response = await api.get("/api/getPropertyMaintenance", {
        params: { CompanyID: companyID, PropertyID: propertyId },
      });
      const data = response.data;
      if (data?.success) {
        const list = Array.isArray(data.data) ? data.data : [];
        setMaintenanceList(list);
        if (list.length > 0) {
          setForm(mapApiMaintenance(list[0], mastersList));
        } else {
          setForm(INITIAL_FORM);
        }
      } else {
        setMaintenanceList([]);
        setErrorMessage(data?.message || "Failed to load maintenance details.");
      }
    } catch (error) {
      console.error("Load maintenance error:", error);
      setErrorMessage(error?.response?.data?.message || "Failed to load maintenance details.");
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // LOAD ROOM MASTERS (Strictly for the selected Property)
  // ========================================================
  const loadPropertyMasters = async (propertyId) => {
    const companyID = getCompanyID();
    if (!companyID || !propertyId) {
      setPropertyMasters([]);
      return [];
    }
    setMastersLoading(true);
    try {
      const response = await api.get("/api/getPropertyMaster", {
        params: { CompanyID: companyID, PropertyID: propertyId },
      });
      const list =
        response.data?.success && Array.isArray(response.data.data)
          ? response.data.data
          : [];

      setPropertyMasters(list);
      return list;
    } catch (err) {
      console.error("Load property masters error:", err);
      setPropertyMasters([]);
      return [];
    } finally {
      setMastersLoading(false);
    }
  };

  useEffect(() => {
    setShowList(true);
    setSaved(false);
    setErrorMessage("");
    if (selectedProperty?.id) {
      (async () => {
        const masters = await loadPropertyMasters(selectedProperty.id);
        await loadMaintenance(selectedProperty.id, masters);
      })();
    } else {
      setForm(INITIAL_FORM);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProperty?.id]);

  // Synchronize RoomNo, TypeID and RoomID whenever propertyMasters load
  useEffect(() => {
    if (form.roomTypeId && (!form.roomNo || !form.roomId) && propertyMasters.length > 0) {
      const matched = propertyMasters.find(
        (item) => String(item.RoomID ?? item.RecordID) === String(form.roomTypeId)
      );
      if (matched) {
        setForm((prev) => ({
          ...prev,
          roomId: matched.RoomID ?? matched.RecordID,
          roomNo: matched.RoomNo ?? matched.FlatNo ?? "",
          typeId: matched.TypeID ?? matched.RecordID,
          roomType: prev.roomType || matched.RoomType || matched.FlatType || "",
        }));
      }
    }
  }, [propertyMasters, form.roomTypeId, form.roomNo, form.roomId]);

  // Retrieve room options strictly belonging to the selected property
  const roomOptions = React.useMemo(() => {
    if (!Array.isArray(propertyMasters) || propertyMasters.length === 0 || !selectedProperty?.id) {
      return [];
    }

    const sourceList = propertyMasters.filter(
      (item) => String(item.PropertyID) === String(selectedProperty.id)
    );

    const seenIds = new Set();
    const options = [];

    sourceList.forEach((item) => {
      const roomId = item.RoomID ?? item.RecordID;
      if (!roomId || seenIds.has(String(roomId))) return;
      seenIds.add(String(roomId));

      const roomNo = (item.RoomNo ?? item.FlatNo ?? "").toString().trim();
      const typeId = item.TypeID ?? item.RecordID ?? roomId;
      const roomType = (item.RoomType ?? item.FlatType ?? "").toString().trim();

      let label = roomNo;
      if (roomNo && roomType) {
        label = `${roomNo} - ${roomType}`;
      } else if (!roomNo && roomType) {
        label = roomType;
      } else if (!roomNo && !roomType) {
        label = `Room #${roomId}`;
      }

      options.push({
        roomId,
        roomNo,
        typeId,
        roomType,
        label,
      });
    });

    return options;
  }, [propertyMasters, selectedProperty?.id]);

  const handleRoomChange = (e) => {
    const selectedVal = e.target.value;
    if (!selectedVal) {
      setForm((prev) => ({
        ...prev,
        roomId: "",
        roomNo: "",
        typeId: "",
        roomTypeId: "",
        roomType: "",
      }));
      setSaved(false);
      return;
    }

    const found = roomOptions.find(
      (r) => String(r.roomId) === String(selectedVal) || String(r.roomNo) === String(selectedVal)
    );

    if (found) {
      setForm((prev) => ({
        ...prev,
        roomId: found.roomId,
        roomNo: found.roomNo,
        typeId: found.typeId,
        roomTypeId: found.typeId,
        roomType: found.roomType,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        roomId: "",
        roomNo: "",
        typeId: "",
        roomTypeId: "",
        roomType: selectedVal,
      }));
    }
    setSaved(false);
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));

    setSaved(false);
  };

  const handleReset = () => {
    setForm((prev) => ({ ...INITIAL_FORM, id: prev.id }));
    setSaved(false);
  };

  const openDetails = () => setShowList(false);
  const backToList = () => setShowList(true);

  const handleSelectHistoryItem = (item) => {
    setForm(mapApiMaintenance(item, propertyMasters));
    setSaved(false);
    const target = document.querySelector(".mt-page-header") || document.querySelector("form");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleAddNew = () => {
    setForm(INITIAL_FORM);
    setSaved(false);
    const target = document.querySelector(".mt-page-header") || document.querySelector("form");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDeleteHistoryItem = async (item) => {
    if (!item?.MaintenanceID || !selectedProperty?.id) return;
    if (!window.confirm("Are you sure you want to delete this maintenance record?")) return;

    const companyID = getCompanyID();
    const userID = getUserID();

    setDeleting(true);
    setErrorMessage("");
    try {
      const response = await api.delete("/api/deletePropertyMaintenance", {
        data: {
          MaintenanceID: item.MaintenanceID,
          CompanyID: companyID,
          PropertyID: selectedProperty.id,
          UserID: userID,
        },
      });
      const data = response.data;
      if (data?.success) {
        if (form.id === item.MaintenanceID) {
          setForm(INITIAL_FORM);
        }
        await loadMaintenance(selectedProperty.id);
        setSaved(false);
      } else {
        setErrorMessage(data?.message || "Unable to delete maintenance record.");
      }
    } catch (error) {
      console.error("Error deleting maintenance item:", error);
      setErrorMessage(error?.response?.data?.message || "Unable to delete maintenance record.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const companyID = getCompanyID();
    const userID = getUserID();

    if (!companyID) {
      setErrorMessage("CompanyID not found. Please login again.");
      return;
    }
    if (!selectedProperty?.id) {
      setErrorMessage("Please select a property first.");
      return;
    }
    if (!userID) {
      setErrorMessage("UserID not found. Please login again.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    try {
      const payload = mapFormToApiPayload(form, {
        companyId: companyID,
        propertyId: selectedProperty.id,
        userId: userID,
      });
      const response = await api.post("/api/insertUpdatePropertyMaintenance", payload);
      const data = response.data;

      if (data?.success) {
        await loadMaintenance(selectedProperty.id);
        setSaved(true);
      } else {
        setErrorMessage(data?.message || "Unable to save maintenance information.");
      }
    } catch (error) {
      console.error("Error saving maintenance:", error);
      setErrorMessage(error?.response?.data?.message || "Unable to save maintenance information.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNew = async (e) => {
    if (e) e.preventDefault();

    const companyID = getCompanyID();
    const userID = getUserID();

    if (!companyID) {
      setErrorMessage("CompanyID not found. Please login again.");
      return;
    }
    if (!selectedProperty?.id) {
      setErrorMessage("Please select a property first.");
      return;
    }
    if (!userID) {
      setErrorMessage("UserID not found. Please login again.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    try {
      const payload = mapFormToApiPayload({ ...form, id: null }, {
        companyId: companyID,
        propertyId: selectedProperty.id,
        userId: userID,
      });
      const response = await api.post("/api/insertUpdatePropertyMaintenance", payload);
      const data = response.data;

      if (data?.success) {
        await loadMaintenance(selectedProperty.id);
        setSaved(true);
      } else {
        setErrorMessage(data?.message || "Unable to save maintenance information.");
      }
    } catch (error) {
      console.error("Error saving maintenance:", error);
      setErrorMessage(error?.response?.data?.message || "Unable to save maintenance information.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing || !selectedProperty?.id) return;

    const companyID = getCompanyID();
    const userID = getUserID();

    setDeleting(true);
    setErrorMessage("");
    try {
      const response = await api.delete("/api/deletePropertyMaintenance", {
        data: {
          MaintenanceID: form.id,
          CompanyID: companyID,
          PropertyID: selectedProperty.id,
          UserID: userID,
        },
      });
      const data = response.data;

      if (data?.success) {
        setForm(INITIAL_FORM);
        setSaved(false);
        backToList();
      } else {
        setErrorMessage(data?.message || "Unable to delete maintenance information.");
      }
    } catch (error) {
      console.error("Error deleting maintenance:", error);
      setErrorMessage(error?.response?.data?.message || "Unable to delete maintenance information.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="maintenance-root">
      <style>{`
        :root {
          --mt-primary: #10299b;
          --mt-primary-dark: #0b1c6e;
          --mt-primary-mid: #4a5fc1;
          --mt-primary-soft: #eef1fb;
          --mt-primary-tint: #d6ddf5;

          --mt-ink: #1a1f36;
          --mt-muted: #6b7290;

          --mt-green: #1a9e6c;
          --mt-green-soft: #e6f7f0;

          --mt-danger: #dc3545;
          --mt-danger-soft: #fdecec;
        }

        .maintenance-root {
          width: 100%;
          font-family: "Inter", system-ui, -apple-system,
            "Segoe UI", sans-serif;
          color: var(--mt-ink);
        }

        .mt-alert{
          display:flex; align-items:center; gap:10px;
          background:var(--mt-danger-soft); color:var(--mt-danger);
          border:1px solid #f5b8b8; border-radius:10px;
          padding:10px 14px; font-size:.83rem; font-weight:600;
          margin-bottom:14px;
        }

        .mt-loading{
          text-align:center; padding:32px 16px; color:var(--mt-muted); font-size:.85rem;
        }

        .mt-context-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 16px;
          margin-bottom: 16px;
          border: 1px solid var(--mt-primary-tint);
          border-radius: 14px;
          background: var(--mt-primary-soft);
        }

        .mt-context-title {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--mt-primary-dark);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .mt-context-sub {
          font-size: 0.84rem;
          color: var(--mt-muted);
          margin-top: 3px;
        }

        .mt-list-card {
          background: #fff;
          border: 1px solid var(--mt-primary-tint);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 18px rgba(16, 41, 155, 0.06);
        }

        .mt-property-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 16px;
          border-bottom: 1px solid #f0f2fa;
          cursor: pointer;
        }

        .mt-property-item:last-child {
          border-bottom: none;
        }

        .mt-property-name {
          font-size: 0.84rem;
          font-weight: 700;
          color: var(--mt-primary-dark);
        }

        .mt-property-code {
          font-size: 0.74rem;
          color: var(--mt-muted);
          margin-top: 3px;
        }

        .mt-list-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 16px;
          border-bottom: 1px solid #f0f2fa;
          cursor: pointer;
        }

        .mt-list-row:last-child {
          border-bottom: none;
        }

        .mt-list-title {
          font-size: 0.84rem;
          font-weight: 700;
          color: var(--mt-primary-dark);
        }

        .mt-list-sub {
          font-size: 0.74rem;
          color: var(--mt-muted);
          margin-top: 3px;
        }

        .maintenance-root *,
        .maintenance-root *::before,
        .maintenance-root *::after {
          box-sizing: border-box;
        }

        /* PAGE HEADER */

        .mt-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
        }

        .mt-page-title {
          margin: 0;
          color: var(--mt-primary-dark);
          font-size: 1.25rem;
          font-weight: 800;
        }

        .mt-page-subtitle {
          margin: 5px 0 0;
          color: var(--mt-muted);
          font-size: 0.8rem;
        }

        /* SECTION */

        .mt-section {
          margin-bottom: 28px;
        }

        .mt-section-head {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--mt-primary-tint);
        }

        .mt-section-icon {
          width: 36px;
          height: 36px;
          flex: 0 0 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: var(--mt-primary-soft);
          color: var(--mt-primary);
          font-size: 0.95rem;
        }

        .mt-section-title {
          margin: 0;
          color: var(--mt-primary-dark);
          font-size: 0.95rem;
          font-weight: 700;
        }

        .mt-section-sub {
          margin-top: 2px;
          color: var(--mt-muted);
          font-size: 0.76rem;
        }

        /* GRID */

        .mt-grid {
          display: grid;
          grid-template-columns:
            repeat(auto-fill, minmax(230px, 1fr));
          gap: 16px 18px;
        }

        .mt-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px 18px;
        }

        @media (max-width: 900px) {
          .mt-grid-3 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .mt-grid-3 {
            grid-template-columns: 1fr;
          }
        }

        .mt-grid-wide {
          display: grid;
          grid-template-columns:
            repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px 18px;
        }

        .mt-field {
          min-width: 0;
        }

        .mt-field-full {
          grid-column: 1 / -1;
        }

        /* LABEL */

        .mt-label {
          display: block;
          margin-bottom: 6px;
          color: var(--mt-primary-mid);
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        /* INPUT */

        .mt-input,
        .mt-select,
        .mt-textarea {
          width: 100%;
          border: 1px solid var(--mt-primary-tint);
          border-radius: 9px;
          padding: 9px 12px;
          color: var(--mt-ink);
          background: #fff;
          outline: none;
          font-family: inherit;
          font-size: 0.84rem;
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }

        .mt-input,
        .mt-select {
          min-height: 40px;
        }

        .mt-textarea {
          min-height: 95px;
          resize: vertical;
          line-height: 1.5;
        }

        .mt-input:focus,
        .mt-select:focus,
        .mt-textarea:focus {
          border-color: var(--mt-primary);
          box-shadow:
            0 0 0 3px rgba(16, 41, 155, 0.12);
        }

        .mt-input::placeholder,
        .mt-textarea::placeholder {
          color: #a0a5b8;
        }

        /* INFO STRIP */

        .mt-info-strip {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 11px 13px;
          margin-bottom: 17px;
          border-radius: 9px;
          background: var(--mt-primary-soft);
          color: var(--mt-primary-dark);
          font-size: 0.75rem;
          line-height: 1.5;
        }

        .mt-info-strip i {
          margin-top: 1px;
          color: var(--mt-primary);
        }

        /* COST */

        .mt-cost-group {
          display: flex;
          gap: 8px;
        }

        .mt-cost-group .mt-input {
          flex: 1;
        }

        .mt-cost-group .mt-select {
          width: 130px;
          flex: 0 0 130px;
        }

        /* FOOTER */

        .mt-footer {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          padding-top: 18px;
          border-top: 1px solid var(--mt-primary-tint);
        }

        .mt-btn {
          min-height: 40px;
          border: none;
          border-radius: 10px;
          padding: 9px 20px;
          font-size: 0.84rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .mt-btn-primary {
          background: var(--mt-primary);
          color: #fff;
        }

        .mt-btn-primary:hover:not(:disabled) {
          background: var(--mt-primary-dark);
          box-shadow:
            0 4px 10px rgba(16, 41, 155, 0.25);
        }

        .mt-btn-secondary {
          background: var(--mt-primary-soft);
          color: var(--mt-primary);
        }

        .mt-btn-secondary:hover:not(:disabled) {
          background: var(--mt-primary-tint);
        }

        .mt-btn-danger {
          background: #fff;
          color: var(--mt-danger);
          border: 1.5px solid #f5b8b8;
        }

        .mt-btn-danger:hover:not(:disabled) {
          background: var(--mt-danger-soft);
        }

        .mt-btn-success {
          background: var(--mt-green);
          color: #fff;
        }

        .mt-btn-success:hover:not(:disabled) {
          background: #148057;
          box-shadow: 0 4px 10px rgba(26, 158, 108, 0.25);
        }

        .mt-btn:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .mt-saved {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 9px;
          background: var(--mt-green-soft);
          color: var(--mt-green);
          font-size: 0.8rem;
          font-weight: 600;
        }

        /* MAINTENANCE HISTORY TABLE */
        .mt-table-wrap {
          width: 100%;
          overflow-x: auto;
          border: 1px solid var(--mt-primary-tint);
          border-radius: 14px;
          background: #fff;
          box-shadow: 0 2px 10px rgba(16, 41, 155, 0.04);
        }

        .mt-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.82rem;
          text-align: left;
        }

        .mt-table th {
          background: var(--mt-primary-soft);
          color: var(--mt-primary-dark);
          font-weight: 700;
          font-size: 0.74rem;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          padding: 12px 14px;
          border-bottom: 1px solid var(--mt-primary-tint);
          white-space: nowrap;
        }

        .mt-table td {
          padding: 12px 14px;
          border-bottom: 1px solid #f0f2fa;
          color: var(--mt-ink);
          vertical-align: middle;
        }

        .mt-table tr:last-child td {
          border-bottom: none;
        }

        .mt-table tr:hover td {
          background: #f8faff;
        }

        .mt-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 600;
        }

        .mt-badge-success {
          background: var(--mt-green-soft);
          color: var(--mt-green);
        }

        .mt-badge-secondary {
          background: #f1f3f9;
          color: var(--mt-muted);
        }

        .mt-badge-info {
          background: var(--mt-primary-soft);
          color: var(--mt-primary);
        }

        .mt-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 7px;
          font-size: 0.76rem;
          font-weight: 600;
          border: 1px solid var(--mt-primary-tint);
          background: #fff;
          color: var(--mt-primary);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .mt-action-btn:hover {
          background: var(--mt-primary-soft);
          border-color: var(--mt-primary);
        }

        .mt-action-btn.active {
          background: var(--mt-primary);
          color: #fff;
          border-color: var(--mt-primary);
        }

        .mt-action-btn-danger {
          border-color: #f5b8b8;
          color: var(--mt-danger);
          background: #fff;
          margin-left: 6px;
        }

        .mt-action-btn-danger:hover {
          background: var(--mt-danger-soft);
          border-color: var(--mt-danger);
        }

        @media (max-width: 768px) {
          .mt-page-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .mt-cost-group {
            flex-direction: column;
          }

          .mt-cost-group .mt-select {
            width: 100%;
            flex: 1;
          }
        }

        @media (max-width: 480px) {
          .mt-footer {
            align-items: stretch;
            flex-direction: column;
          }

          .mt-btn {
            width: 100%;
          }
        }
      `}</style>

      {errorMessage && (
        <div className="mt-alert">
          <i className="bi bi-exclamation-triangle"></i>
          {errorMessage}
        </div>
      )}

      <div className="mt-context-card">
        <div>
          <div className="mt-context-title">Selected property</div>
          <div className="mt-context-sub">
            {selectedProperty
              ? selectedProperty.propertyName || selectedProperty.propertyCode || "Selected property"
              : "Choose a property from the list to continue"}
          </div>
        </div>

        {selectedProperty ? (
          <button
            type="button"
            className="mt-btn mt-btn-secondary"
            onClick={() => onSelectProperty(null)}
          >
            Change property
          </button>
        ) : null}
      </div>

      {!selectedProperty ? (
        <div className="mt-list-card">
          {propertiesLoading ? (
            <div className="mt-loading">Loading properties…</div>
          ) : properties.length === 0 ? (
            <div className="mt-loading">No properties found for this company.</div>
          ) : (
            properties.map((property) => (
              <div
                key={property.id}
                className="mt-property-item"
                onClick={() => onSelectProperty(property.id)}
              >
                <div>
                  <div className="mt-property-name">
                    {property.propertyName || property.propertyCode}
                  </div>
                  <div className="mt-property-code">
                    {property.propertyCode || property.propertyId}
                  </div>
                </div>
                <i className="bi bi-chevron-right" style={{ color: "var(--mt-primary)" }}></i>
              </div>
            ))
          )}
        </div>
      ) : loading ? (
        <div className="mt-list-card">
          <div className="mt-loading">Loading maintenance details…</div>
        </div>
      ) : !showList ? (
        <form onSubmit={handleSave}>

          {/* PAGE HEADER */}

          <div className="mt-page-header">
            <div>
              <h2 className="mt-page-title">
                Maintenance
              </h2>

              <p className="mt-page-subtitle">
                Manage maintenance schedules, warranties,
                service providers and repair records
              </p>
            </div>

            <button type="button" className="mt-btn mt-btn-secondary" onClick={backToList}>
              <i className="bi bi-arrow-left me-2"></i>
              Back
            </button>
          </div>

          {isEditing && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                padding: "10px 16px",
                marginBottom: "20px",
                background: "var(--mt-primary-soft)",
                border: "1px solid var(--mt-primary-tint)",
                borderRadius: "10px",
                fontSize: "0.82rem",
                color: "var(--mt-primary-dark)",
                fontWeight: 600,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="bi bi-pencil-fill" style={{ color: "var(--mt-primary)" }}></i>
                <span>
                  Currently Editing Maintenance Record #{form.id}
                  {form.roomNo ? ` (Room ${form.roomNo})` : ""}
                </span>
              </div>
              <button
                type="button"
                className="mt-btn mt-btn-secondary"
                style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                onClick={handleAddNew}
              >
                <i className="bi bi-plus-lg me-1"></i>
                Add New Record
              </button>
            </div>
          )}

          {/* MAINTENANCE INFORMATION */}

          <div className="mt-section">
            <div className="mt-section-head">
              <div className="mt-section-icon">
                <i className="bi bi-calendar-check"></i>
              </div>

              <div>
                <p className="mt-section-title">
                  Maintenance Information
                </p>

                <div className="mt-section-sub">
                  Track previous and upcoming maintenance
                </div>
              </div>
            </div>

            <div className="mt-grid mt-grid-3">

              {/* 1. Last Maintenance Date */}
              <div className="mt-field">
                <label className="mt-label">
                  Last Maintenance Date
                </label>

                <input
                  type="date"
                  className="mt-input"
                  value={form.lastMaintenanceDate}
                  onChange={handleChange(
                    "lastMaintenanceDate"
                  )}
                />
              </div>

              {/* 2. Next Scheduled Maintenance */}
              <div className="mt-field">
                <label className="mt-label">
                  Next Scheduled Maintenance
                </label>

                <input
                  type="date"
                  className="mt-input"
                  value={form.nextScheduledMaintenance}
                  onChange={handleChange(
                    "nextScheduledMaintenance"
                  )}
                />
              </div>

              {/* 3. Room Selection (ROOM No - ID) */}
              <div className="mt-field">
                <label className="mt-label">
                  ROOM No - ID
                </label>

                <select
                  className="mt-select"
                  value={form.roomId || form.roomTypeId || ""}
                  onChange={handleRoomChange}
                  disabled={!selectedProperty?.id || mastersLoading}
                >
                  <option value="">
                    {mastersLoading
                      ? "Loading Rooms..."
                      : !selectedProperty?.id
                        ? "Select Property First"
                        : roomOptions.length === 0
                          ? "No Rooms Found for this Property"
                          : "Select Room"}
                  </option>
                  {roomOptions.map((opt) => (
                    <option key={opt.roomId} value={opt.roomId}>
                      {opt.label}
                    </option>
                  ))}
                  {(form.roomId || form.roomTypeId) &&
                    !roomOptions.some(
                      (opt) => String(opt.roomId) === String(form.roomId || form.roomTypeId)
                    ) && (
                      <option value={form.roomId || form.roomTypeId}>
                        {form.roomNo
                          ? `${form.roomNo} - ${form.roomType}`
                          : form.roomType || `Room #${form.roomId || form.roomTypeId}`}
                      </option>
                    )}
                </select>

              </div>

            </div>
          </div>

          {/* AMC */}

          <div className="mt-section">
            <div className="mt-section-head">
              <div className="mt-section-icon">
                <i className="bi bi-file-earmark-text"></i>
              </div>

              <div>
                <p className="mt-section-title">
                  Annual Maintenance Contract (AMC)
                </p>

                <div className="mt-section-sub">
                  Manage AMC agreement and validity details
                </div>
              </div>
            </div>

            <div className="mt-grid">

              <div className="mt-field">
                <label className="mt-label">
                  AMC Available
                </label>

                <select
                  className="mt-select"
                  value={form.amcAvailable}
                  onChange={handleChange("amcAvailable")}
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="mt-field">
                <label className="mt-label">
                  AMC Contract Number
                </label>

                <input
                  type="text"
                  className="mt-input"
                  value={form.amcContractNo}
                  onChange={handleChange(
                    "amcContractNo"
                  )}
                  placeholder="e.g. AMC-2026-001"
                />
              </div>

              <div className="mt-field">
                <label className="mt-label">
                  AMC Start Date
                </label>

                <input
                  type="date"
                  className="mt-input"
                  value={form.amcStartDate}
                  onChange={handleChange(
                    "amcStartDate"
                  )}
                />
              </div>

              <div className="mt-field">
                <label className="mt-label">
                  AMC End Date
                </label>

                <input
                  type="date"
                  className="mt-input"
                  value={form.amcEndDate}
                  onChange={handleChange(
                    "amcEndDate"
                  )}
                />
              </div>

            </div>
          </div>

          {/* WARRANTY */}

          <div className="mt-section">
            <div className="mt-section-head">
              <div className="mt-section-icon">
                <i className="bi bi-shield-check"></i>
              </div>

              <div>
                <p className="mt-section-title">
                  Warranty Information
                </p>

                <div className="mt-section-sub">
                  Record warranty coverage and expiry
                </div>
              </div>
            </div>

            <div className="mt-grid">

              <div className="mt-field">
                <label className="mt-label">
                  Warranty Available
                </label>

                <select
                  className="mt-select"
                  value={form.warrantyAvailable}
                  onChange={handleChange(
                    "warrantyAvailable"
                  )}
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="mt-field">
                <label className="mt-label">
                  Warranty Expiry Date
                </label>

                <input
                  type="date"
                  className="mt-input"
                  value={form.warrantyExpiryDate}
                  onChange={handleChange(
                    "warrantyExpiryDate"
                  )}
                />
              </div>

              <div className="mt-field mt-field-full">
                <label className="mt-label">
                  Warranty Details
                </label>

                <textarea
                  className="mt-textarea"
                  value={form.warrantyDetails}
                  onChange={handleChange(
                    "warrantyDetails"
                  )}
                  placeholder="Enter warranty coverage, equipment details or terms..."
                />
              </div>

            </div>
          </div>

          {/* CONTRACTOR */}

          <div className="mt-section">
            <div className="mt-section-head">
              <div className="mt-section-icon">
                <i className="bi bi-person-badge"></i>
              </div>

              <div>
                <p className="mt-section-title">
                  Contractor Details
                </p>

                <div className="mt-section-sub">
                  Contact information for the maintenance contractor
                </div>
              </div>
            </div>

            <div className="mt-grid">

              <div className="mt-field">
                <label className="mt-label">
                  Contractor Name
                </label>

                <input
                  type="text"
                  className="mt-input"
                  value={form.contractorName}
                  onChange={handleChange(
                    "contractorName"
                  )}
                  placeholder="Enter contractor name"
                />
              </div>

              <div className="mt-field">
                <label className="mt-label">
                  Phone Number
                </label>

                <input
                  type="tel"
                  className="mt-input"
                  value={form.contractorPhone}
                  onChange={handleChange(
                    "contractorPhone"
                  )}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="mt-field">
                <label className="mt-label">
                  Email Address
                </label>

                <input
                  type="email"
                  className="mt-input"
                  value={form.contractorEmail}
                  onChange={handleChange(
                    "contractorEmail"
                  )}
                  placeholder="contractor@example.com"
                />
              </div>

              <div className="mt-field">
                <label className="mt-label">
                  Service Provider
                </label>

                <input
                  type="text"
                  className="mt-input"
                  value={form.serviceProvider}
                  onChange={handleChange(
                    "serviceProvider"
                  )}
                  placeholder="Company / service provider"
                />
              </div>

              <div className="mt-field">
                <label className="mt-label">
                  Service Contact
                </label>

                <input
                  type="tel"
                  className="mt-input"
                  value={form.serviceContact}
                  onChange={handleChange(
                    "serviceContact"
                  )}
                  placeholder="Service contact number"
                />
              </div>

              <div className="mt-field mt-field-full">
                <label className="mt-label">
                  Contractor Address
                </label>

                <textarea
                  className="mt-textarea"
                  value={form.contractorAddress}
                  onChange={handleChange(
                    "contractorAddress"
                  )}
                  placeholder="Enter contractor address..."
                />
              </div>

            </div>
          </div>

          {/* MAINTENANCE COST */}

          <div className="mt-section">
            <div className="mt-section-head">
              <div className="mt-section-icon">
                <i className="bi bi-currency-dollar"></i>
              </div>

              <div>
                <p className="mt-section-title">
                  Maintenance Cost
                </p>

                <div className="mt-section-sub">
                  Record recurring maintenance expenses
                </div>
              </div>
            </div>

            <div className="mt-grid">

              <div className="mt-field">
                <label className="mt-label">
                  Maintenance Cost
                </label>

                <div className="mt-cost-group">

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-input"
                    value={form.maintenanceCost}
                    onChange={handleChange(
                      "maintenanceCost"
                    )}
                    placeholder="0.00"
                  />

                  <select
                    className="mt-select"
                    value={form.costFrequency}
                    onChange={handleChange(
                      "costFrequency"
                    )}
                  >
                    <option value="">
                      Frequency
                    </option>
                    <option value="One Time">
                      One Time
                    </option>
                    <option value="Monthly">
                      Monthly
                    </option>
                    <option value="Quarterly">
                      Quarterly
                    </option>
                    <option value="Half Yearly">
                      Half Yearly
                    </option>
                    <option value="Yearly">
                      Yearly
                    </option>
                  </select>

                </div>
              </div>

            </div>
          </div>

          {/* REPAIR HISTORY */}

          <div className="mt-section">
            <div className="mt-section-head">
              <div className="mt-section-icon">
                <i className="bi bi-tools"></i>
              </div>

              <div>
                <p className="mt-section-title">
                  Repair History
                </p>

                <div className="mt-section-sub">
                  Record previous repairs and maintenance work
                </div>
              </div>
            </div>

            <div className="mt-grid">

              <div className="mt-field mt-field-full">
                <label className="mt-label">
                  Repair History
                </label>

                <textarea
                  className="mt-textarea"
                  value={form.repairHistory}
                  onChange={handleChange(
                    "repairHistory"
                  )}
                  placeholder="Enter repair details, dates, work performed and associated costs..."
                />
              </div>

            </div>
          </div>

          {/* INSPECTION REPORTS */}

          <div className="mt-section">
            <div className="mt-section-head">
              <div className="mt-section-icon">
                <i className="bi bi-clipboard2-check"></i>
              </div>

              <div>
                <p className="mt-section-title">
                  Inspection Reports
                </p>

                <div className="mt-section-sub">
                  Record inspection findings and report references
                </div>
              </div>
            </div>

            <div className="mt-info-strip">
              <i className="bi bi-info-circle-fill"></i>

              <span>
                Add inspection dates, findings, safety observations,
                report numbers or other relevant inspection information.
              </span>
            </div>

            <div className="mt-field">
              <label className="mt-label">
                Inspection Reports
              </label>

              <textarea
                className="mt-textarea"
                value={form.inspectionReports}
                onChange={handleChange(
                  "inspectionReports"
                )}
                placeholder="Enter inspection report details..."
              />
            </div>
          </div>

          {/* MAINTENANCE HISTORY */}
          <div className="mt-section">
            <div className="mt-section-head">
              <div className="mt-section-icon">
                <i className="bi bi-clock-history"></i>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <div>
                  <p className="mt-section-title">
                    Maintenance History
                  </p>

                  <div className="mt-section-sub">
                    Historical records of all maintenance performed for this property
                  </div>
                </div>

                {isEditing && (
                  <button
                    type="button"
                    className="mt-btn mt-btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                    onClick={handleAddNew}
                  >
                    <i className="bi bi-plus-lg me-1"></i>
                    New Maintenance Record
                  </button>
                )}
              </div>
            </div>

            {maintenanceList.length === 0 ? (
              <div
                className="mt-loading"
                style={{
                  padding: "24px 16px",
                  background: "#fff",
                  borderRadius: "12px",
                  border: "1px dashed var(--mt-primary-tint)",
                }}
              >
                <i
                  className="bi bi-calendar-x"
                  style={{ fontSize: "1.5rem", display: "block", marginBottom: "8px", opacity: 0.5 }}
                ></i>
                No previous maintenance records found for this property.
              </div>
            ) : (
              <div className="mt-table-wrap">
                <table className="mt-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Last Maintenance</th>
                      <th>Next Scheduled</th>
                      <th>Room / Unit</th>
                      <th>AMC</th>
                      <th>Warranty</th>
                      <th>Contractor / Provider</th>
                      <th>Cost</th>
                      <th style={{ textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceList.map((item, idx) => {
                      const matchedRoom = propertyMasters.find(
                        (m) => String(m.RoomID ?? m.RecordID) === String(item.RoomTypeID)
                      );
                      const roomLabel = matchedRoom
                        ? `${matchedRoom.RoomNo || matchedRoom.FlatNo || ""} ${matchedRoom.RoomType || matchedRoom.FlatType
                            ? `(${matchedRoom.RoomType || matchedRoom.FlatType})`
                            : ""
                          }`.trim()
                        : item.RoomType || "—";

                      const isCurrent = form.id === item.MaintenanceID;

                      return (
                        <tr
                          key={item.MaintenanceID || idx}
                          style={{
                            background: isCurrent ? "var(--mt-primary-soft)" : "transparent",
                            fontWeight: isCurrent ? "600" : "normal",
                          }}
                        >
                          <td>{idx + 1}</td>
                          <td>
                            {item.LastMaintenanceDate
                              ? item.LastMaintenanceDate.toString().slice(0, 10)
                              : "—"}
                          </td>
                          <td>
                            {item.NextScheduledMaintenance
                              ? item.NextScheduledMaintenance.toString().slice(0, 10)
                              : "—"}
                          </td>
                          <td>{roomLabel || "—"}</td>
                          <td>
                            {item.AMCAvailable === "Yes" ? (
                              <span className="mt-badge mt-badge-success">
                                {item.AMCContractNumber ? `AMC: ${item.AMCContractNumber}` : "AMC Active"}
                              </span>
                            ) : (
                              <span className="mt-badge mt-badge-secondary">No</span>
                            )}
                          </td>
                          <td>
                            {item.WarrantyAvailable === "Yes" ? (
                              <span className="mt-badge mt-badge-success">Warranty</span>
                            ) : (
                              <span className="mt-badge mt-badge-secondary">No</span>
                            )}
                          </td>
                          <td>{item.ContractorName || item.ServiceProvider || "—"}</td>
                          <td>
                            {item.MaintenanceCost
                              ? `${Number(item.MaintenanceCost).toLocaleString()} ${item.MaintenanceCostFrequency ? `(${item.MaintenanceCostFrequency})` : ""
                              }`
                              : "—"}
                          </td>
                          <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                            <button
                              type="button"
                              className={`mt-action-btn ${isCurrent ? "active" : ""}`}
                              onClick={() => handleSelectHistoryItem(item)}
                              title="Edit this maintenance record"
                            >
                              <i className="bi bi-pencil-square"></i>
                              {isCurrent ? "Editing" : "Edit"}
                            </button>
                            <button
                              type="button"
                              className="mt-action-btn mt-action-btn-danger"
                              onClick={() => handleDeleteHistoryItem(item)}
                              disabled={deleting}
                              title="Delete this maintenance record"
                            >
                              <i className="bi bi-trash3"></i>
                              Delete
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

          {/* FOOTER */}

          <div className="mt-footer">

            {isEditing ? (
              <>
                <button
                  type="submit"
                  className="mt-btn mt-btn-primary"
                  disabled={saving}
                >
                  <i
                    className={`bi ${saving
                        ? "bi-hourglass-split"
                        : "bi-check2-circle"
                      } me-2`}
                  ></i>
                  {saving ? "Updating..." : "Update Maintenance"}
                </button>

                <button
                  type="button"
                  className="mt-btn mt-btn-success"
                  onClick={handleSaveNew}
                  disabled={saving}
                  title="Save as a new maintenance record"
                >
                  <i
                    className={`bi ${saving
                        ? "bi-hourglass-split"
                        : "bi-plus-circle"
                      } me-2`}
                  ></i>
                  {saving ? "Saving..." : "Save Maintenance"}
                </button>
              </>
            ) : (
              <button
                type="submit"
                className="mt-btn mt-btn-primary"
                disabled={saving}
              >
                <i
                  className={`bi ${saving
                      ? "bi-hourglass-split"
                      : "bi-check2-circle"
                    } me-2`}
                ></i>
                {saving ? "Saving..." : "Save Maintenance"}
              </button>
            )}

            <button
              type="button"
              className="mt-btn mt-btn-secondary"
              onClick={handleReset}
              disabled={saving}
            >
              <i className="bi bi-arrow-counterclockwise me-2"></i>
              Reset
            </button>

            {isEditing && (
              <button
                type="button"
                className="mt-btn mt-btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                <i className={`bi ${deleting ? "bi-hourglass-split" : "bi-trash3"} me-2`}></i>
                {deleting ? "Deleting..." : "Delete"}
              </button>
            )}

            {saved && (
              <span className="mt-saved">
                <i className="bi bi-check-circle-fill"></i>
                Maintenance saved successfully
              </span>
            )}

          </div>

        </form>
      ) : (
        <>
          <div className="mt-list-card">
            <div className="mt-list-row" onClick={openDetails}>
              <div>
                <div className="mt-list-title">Maintenance Profile</div>
                <div className="mt-list-sub">
                  {isEditing
                    ? "View or update maintenance schedules, warranties and service details."
                    : "No maintenance record yet — add one for this property."}
                </div>
              </div>
              <i className="bi bi-chevron-right" style={{ color: "var(--mt-primary)" }}></i>
            </div>
          </div>

          <div className="mt-footer" style={{ marginTop: 16 }}>
            <button type="button" className="mt-btn mt-btn-primary" onClick={openDetails}>
              <i className={`bi ${isEditing ? "bi-pencil" : "bi-plus-lg"} me-2`}></i>
              {isEditing ? "Open maintenance profile" : "Add maintenance profile"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Maintenance;
