// import React, { useEffect, useState } from "react";
// import api from "../../apiService";

// const INITIAL_FORM = {
//   id: null, // MaintenanceID — null on create
//   lastMaintenanceDate: "",
//   nextScheduledMaintenance: "",
//   roomId: "",
//   roomNo: "",
//   typeId: "",
//   roomTypeId: "",
//   roomType: "",
//   amcAvailable: "",
//   amcStartDate: "",
//   amcEndDate: "",
//   amcContractNo: "",
//   warrantyAvailable: "",
//   warrantyExpiryDate: "",
//   warrantyDetails: "",
//   contractorName: "",
//   contractorPhone: "",
//   contractorEmail: "",
//   contractorAddress: "",
//   serviceProvider: "",
//   serviceContact: "",
//   maintenanceCost: "",
//   costFrequency: "",
//   repairHistory: "",
//   inspectionReports: "",
// };

// // ── session helpers ──
// const getCompanyID = () => Number(sessionStorage.getItem("CompanyID")) || 0;
// const getUserID = () => Number(sessionStorage.getItem("UserId")) || 0;

// // NOTE: adjust the right-hand-side field names if your getPropertyInformation
// // response uses different casing than assumed here.
// const mapApiProperty = (p) => ({
//   id: p.PropertyID ?? p.propertyId ?? p.id,
//   propertyId: p.PropertyID ?? p.propertyId ?? p.id,
//   propertyName: p.PropertyName ?? p.propertyName ?? "",
//   propertyCode: p.PropertyCode ?? p.propertyCode ?? "",
// });

// // GetPropertyMaintenance / GetPropertyMaintenanceByID recordset -> form shape.
// // Column names mirror the @Param names used in insertUpdatePropertyMaintenance.
// const mapApiMaintenance = (m, masters = []) => {
//   const roomTypeId = m.RoomTypeID ?? m.TypeID ?? "";
//   const roomId = m.RoomID ?? roomTypeId ?? "";

//   const matched = Array.isArray(masters)
//     ? masters.find(
//       (item) => String(item.RoomID ?? item.RecordID) === String(roomId || roomTypeId)
//     )
//     : null;

//   return {
//     id: m.MaintenanceID,
//     lastMaintenanceDate: (m.LastMaintenanceDate ?? "").toString().slice(0, 10),
//     nextScheduledMaintenance: (m.NextScheduledMaintenance ?? "").toString().slice(0, 10),
//     roomId: matched ? (matched.RoomID ?? matched.RecordID) : (m.RoomID ?? roomId ?? ""),
//     roomNo: matched ? (matched.RoomNo ?? matched.FlatNo ?? "") : (m.RoomNo ?? ""),
//     typeId: matched ? (matched.TypeID ?? matched.RecordID) : (m.TypeID ?? roomTypeId ?? ""),
//     roomTypeId: m.RoomTypeID ?? (matched ? (matched.TypeID ?? matched.RecordID) : ""),
//     roomType: m.RoomType || (matched ? (matched.RoomType ?? matched.FlatType) : "") || "",
//     amcAvailable: m.AMCAvailable ?? "",
//     amcStartDate: (m.AMCStartDate ?? "").toString().slice(0, 10),
//     amcEndDate: (m.AMCEndDate ?? "").toString().slice(0, 10),
//     amcContractNo: m.AMCContractNumber ?? "",
//     warrantyAvailable: m.WarrantyAvailable ?? "",
//     warrantyExpiryDate: (m.WarrantyExpiryDate ?? "").toString().slice(0, 10),
//     warrantyDetails: m.WarrantyDetails ?? "",
//     contractorName: m.ContractorName ?? "",
//     contractorPhone: m.PhoneNumber ?? "",
//     contractorEmail: m.EmailAddress ?? "",
//     contractorAddress: m.ContractorAddress ?? "",
//     serviceProvider: m.ServiceProvider ?? "",
//     serviceContact: m.ServiceContact ?? "",
//     maintenanceCost: m.MaintenanceCost ?? "",
//     costFrequency: m.MaintenanceCostFrequency ?? "",
//     repairHistory: m.RepairHistory ?? "",
//     inspectionReports: m.InspectionReports ?? "",
//   };
// };

// // form shape -> insertUpdatePropertyMaintenance request body
// const mapFormToApiPayload = (form, { companyId, propertyId, userId }) => ({
//   MaintenanceID: form.id || null,
//   CompanyID: companyId,
//   PropertyID: propertyId,
//   LastMaintenanceDate: form.lastMaintenanceDate || null,
//   NextScheduledMaintenance: form.nextScheduledMaintenance || null,
//   RoomID: form.roomId ? Number(form.roomId) : null,
//   RoomNo: form.roomNo || null,
//   TypeID: form.typeId ? Number(form.typeId) : (form.roomTypeId ? Number(form.roomTypeId) : null),
//   RoomTypeID: form.roomTypeId
//     ? Number(form.roomTypeId)
//     : form.typeId
//       ? Number(form.typeId)
//       : form.roomId
//         ? Number(form.roomId)
//         : null,
//   RoomType: form.roomType || null,
//   AMCAvailable: form.amcAvailable,
//   AMCContractNumber: form.amcContractNo,
//   AMCStartDate: form.amcStartDate || null,
//   AMCEndDate: form.amcEndDate || null,
//   WarrantyAvailable: form.warrantyAvailable,
//   WarrantyExpiryDate: form.warrantyExpiryDate || null,
//   WarrantyDetails: form.warrantyDetails,
//   ContractorName: form.contractorName,
//   PhoneNumber: form.contractorPhone,
//   EmailAddress: form.contractorEmail,
//   ContractorAddress: form.contractorAddress,
//   ServiceProvider: form.serviceProvider,
//   ServiceContact: form.serviceContact,
//   MaintenanceCost: form.maintenanceCost === "" ? null : form.maintenanceCost,
//   MaintenanceCostFrequency: form.costFrequency,
//   RepairHistory: form.repairHistory,
//   InspectionReports: form.inspectionReports,
//   UserID: userId,
// });

// const Maintenance = () => {
//   const [form, setForm] = useState(INITIAL_FORM);
//   const [saving, setSaving] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [saved, setSaved] = useState(false);
//   const [showList, setShowList] = useState(true);
//   const [loading, setLoading] = useState(false);
//   const [errorMessage, setErrorMessage] = useState("");
//   const [maintenanceList, setMaintenanceList] = useState([]);

//   // ── Real property list (replaces the old hardcoded/prop-driven list) ──
//   const [properties, setProperties] = useState([]);
//   const [propertiesLoading, setPropertiesLoading] = useState(false);
//   const [selectedPropertyId, setSelectedPropertyId] = useState(null);

//   // ── Room Master records for selected property ──
//   const [propertyMasters, setPropertyMasters] = useState([]);
//   const [mastersLoading, setMastersLoading] = useState(false);

//   const selectedProperty = properties.find((p) => String(p.id) === String(selectedPropertyId)) || null;
//   const onSelectProperty = (propertyId) => setSelectedPropertyId(propertyId);

//   const isEditing = form.id !== null;

//   // ========================================================
//   // LOAD PROPERTIES (real data — GET /api/getPropertyInformation)
//   // ========================================================
//   const loadProperties = async () => {
//     const companyID = getCompanyID();
//     if (!companyID) {
//       setErrorMessage("CompanyID not found. Please login again.");
//       return;
//     }
//     setPropertiesLoading(true);
//     try {
//       const response = await api.get("/api/getPropertyInfo", {
//         params: { CompanyID: companyID },
//       });
//       const data = response.data;
//       if (data?.success) {
//         const list = Array.isArray(data.data) ? data.data.map(mapApiProperty) : [];
//         setProperties(list);
//         if (selectedPropertyId) {
//           loadPropertyMasters(selectedPropertyId);
//         }
//       } else {
//         setProperties([]);
//         setErrorMessage(data?.message || "Failed to load properties.");
//       }
//     } catch (error) {
//       console.error("Load property error:", error);
//       setErrorMessage(error?.response?.data?.message || "Failed to load properties.");
//     } finally {
//       setPropertiesLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadProperties();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // ========================================================
//   // LOAD MAINTENANCE RECORD FOR THE SELECTED PROPERTY
//   // ========================================================
//   const loadMaintenance = async (propertyId, mastersList = propertyMasters) => {
//     const companyID = getCompanyID();
//     if (!companyID || !propertyId) return;

//     setLoading(true);
//     setErrorMessage("");
//     try {
//       const response = await api.get("/api/getPropertyMaintenance", {
//         params: { CompanyID: companyID, PropertyID: propertyId },
//       });
//       const data = response.data;
//       if (data?.success) {
//         const list = Array.isArray(data.data) ? data.data : [];
//         setMaintenanceList(list);
//         if (list.length > 0) {
//           setForm(mapApiMaintenance(list[0], mastersList));
//         } else {
//           setForm(INITIAL_FORM);
//         }
//       } else {
//         setMaintenanceList([]);
//         setErrorMessage(data?.message || "Failed to load maintenance details.");
//       }
//     } catch (error) {
//       console.error("Load maintenance error:", error);
//       setErrorMessage(error?.response?.data?.message || "Failed to load maintenance details.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ========================================================
//   // LOAD ROOM MASTERS (Strictly for the selected Property)
//   // ========================================================
//   const loadPropertyMasters = async (propertyId) => {
//     const companyID = getCompanyID();
//     if (!companyID || !propertyId) {
//       setPropertyMasters([]);
//       return [];
//     }
//     setMastersLoading(true);
//     try {
//       const response = await api.get("/api/getPropertyMaster", {
//         params: { CompanyID: companyID, PropertyID: propertyId },
//       });
//       const list =
//         response.data?.success && Array.isArray(response.data.data)
//           ? response.data.data
//           : [];

//       setPropertyMasters(list);
//       return list;
//     } catch (err) {
//       console.error("Load property masters error:", err);
//       setPropertyMasters([]);
//       return [];
//     } finally {
//       setMastersLoading(false);
//     }
//   };

//   useEffect(() => {
//     setShowList(true);
//     setSaved(false);
//     setErrorMessage("");
//     if (selectedProperty?.id) {
//       (async () => {
//         const masters = await loadPropertyMasters(selectedProperty.id);
//         await loadMaintenance(selectedProperty.id, masters);
//       })();
//     } else {
//       setForm(INITIAL_FORM);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [selectedProperty?.id]);

//   // Synchronize RoomNo, TypeID and RoomID whenever propertyMasters load
//   useEffect(() => {
//     if (form.roomTypeId && (!form.roomNo || !form.roomId) && propertyMasters.length > 0) {
//       const matched = propertyMasters.find(
//         (item) => String(item.RoomID ?? item.RecordID) === String(form.roomTypeId)
//       );
//       if (matched) {
//         setForm((prev) => ({
//           ...prev,
//           roomId: matched.RoomID ?? matched.RecordID,
//           roomNo: matched.RoomNo ?? matched.FlatNo ?? "",
//           typeId: matched.TypeID ?? matched.RecordID,
//           roomType: prev.roomType || matched.RoomType || matched.FlatType || "",
//         }));
//       }
//     }
//   }, [propertyMasters, form.roomTypeId, form.roomNo, form.roomId]);

//   // Retrieve room options strictly belonging to the selected property
//   const roomOptions = React.useMemo(() => {
//     if (!Array.isArray(propertyMasters) || propertyMasters.length === 0 || !selectedProperty?.id) {
//       return [];
//     }

//     const sourceList = propertyMasters.filter(
//       (item) => String(item.PropertyID) === String(selectedProperty.id)
//     );

//     const seenIds = new Set();
//     const options = [];

//     sourceList.forEach((item) => {
//       const roomId = item.RoomID ?? item.RecordID;
//       if (!roomId || seenIds.has(String(roomId))) return;
//       seenIds.add(String(roomId));

//       const roomNo = (item.RoomNo ?? item.FlatNo ?? "").toString().trim();
//       const typeId = item.TypeID ?? item.RecordID ?? roomId;
//       const roomType = (item.RoomType ?? item.FlatType ?? "").toString().trim();

//       let label = roomNo;
//       if (roomNo && roomType) {
//         label = `${roomNo} - ${roomType}`;
//       } else if (!roomNo && roomType) {
//         label = roomType;
//       } else if (!roomNo && !roomType) {
//         label = `Room #${roomId}`;
//       }

//       options.push({
//         roomId,
//         roomNo,
//         typeId,
//         roomType,
//         label,
//       });
//     });

//     return options;
//   }, [propertyMasters, selectedProperty?.id]);

//   const handleRoomChange = (e) => {
//     const selectedVal = e.target.value;
//     if (!selectedVal) {
//       setForm((prev) => ({
//         ...prev,
//         roomId: "",
//         roomNo: "",
//         typeId: "",
//         roomTypeId: "",
//         roomType: "",
//       }));
//       setSaved(false);
//       return;
//     }

//     const found = roomOptions.find(
//       (r) => String(r.roomId) === String(selectedVal) || String(r.roomNo) === String(selectedVal)
//     );

//     if (found) {
//       setForm((prev) => ({
//         ...prev,
//         roomId: found.roomId,
//         roomNo: found.roomNo,
//         typeId: found.typeId,
//         roomTypeId: found.typeId,
//         roomType: found.roomType,
//       }));
//     } else {
//       setForm((prev) => ({
//         ...prev,
//         roomId: "",
//         roomNo: "",
//         typeId: "",
//         roomTypeId: "",
//         roomType: selectedVal,
//       }));
//     }
//     setSaved(false);
//   };

//   const handleChange = (field) => (e) => {
//     setForm((prev) => ({
//       ...prev,
//       [field]: e.target.value,
//     }));

//     setSaved(false);
//   };

//   const handleReset = () => {
//     setForm((prev) => ({ ...INITIAL_FORM, id: prev.id }));
//     setSaved(false);
//   };

//   const openDetails = () => setShowList(false);
//   const backToList = () => setShowList(true);

//   const handleSelectHistoryItem = (item) => {
//     setForm(mapApiMaintenance(item, propertyMasters));
//     setSaved(false);
//     const target = document.querySelector(".mt-page-header") || document.querySelector("form");
//     if (target) {
//       target.scrollIntoView({ behavior: "smooth" });
//     } else {
//       window.scrollTo({ top: 0, behavior: "smooth" });
//     }
//   };

//   const handleAddNew = () => {
//     setForm(INITIAL_FORM);
//     setSaved(false);
//     const target = document.querySelector(".mt-page-header") || document.querySelector("form");
//     if (target) {
//       target.scrollIntoView({ behavior: "smooth" });
//     } else {
//       window.scrollTo({ top: 0, behavior: "smooth" });
//     }
//   };

//   const handleDeleteHistoryItem = async (item) => {
//     if (!item?.MaintenanceID || !selectedProperty?.id) return;
//     if (!window.confirm("Are you sure you want to delete this maintenance record?")) return;

//     const companyID = getCompanyID();
//     const userID = getUserID();

//     setDeleting(true);
//     setErrorMessage("");
//     try {
//       const response = await api.post("/api/deletePropertyMaintenance", {
//           MaintenanceID: item.MaintenanceID,
//           CompanyID: companyID,
//           PropertyID: selectedProperty.id,
//           UserID: userID,
//         },);
//       const data = response.data;
//       if (data?.success) {
//         if (form.id === item.MaintenanceID) {
//           setForm(INITIAL_FORM);
//         }
//         await loadMaintenance(selectedProperty.id);
//         setSaved(false);
//       } else {
//         setErrorMessage(data?.message || "Unable to delete maintenance record.");
//       }
//     } catch (error) {
//       console.error("Error deleting maintenance item:", error);
//       setErrorMessage(error?.response?.data?.message || "Unable to delete maintenance record.");
//     } finally {
//       setDeleting(false);
//     }
//   };

//   const handleSave = async (e) => {
//     e.preventDefault();

//     const companyID = getCompanyID();
//     const userID = getUserID();

//     if (!companyID) {
//       setErrorMessage("CompanyID not found. Please login again.");
//       return;
//     }
//     if (!selectedProperty?.id) {
//       setErrorMessage("Please select a property first.");
//       return;
//     }
//     if (!userID) {
//       setErrorMessage("UserID not found. Please login again.");
//       return;
//     }

//     setSaving(true);
//     setErrorMessage("");
//     try {
//       const payload = mapFormToApiPayload(form, {
//         companyId: companyID,
//         propertyId: selectedProperty.id,
//         userId: userID,
//       });
//       const response = await api.post("/api/insertUpdatePropertyMaintenance", payload);
//       const data = response.data;

//       if (data?.success) {
//         await loadMaintenance(selectedProperty.id);
//         setSaved(true);
//       } else {
//         setErrorMessage(data?.message || "Unable to save maintenance information.");
//       }
//     } catch (error) {
//       console.error("Error saving maintenance:", error);
//       setErrorMessage(error?.response?.data?.message || "Unable to save maintenance information.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleSaveNew = async (e) => {
//     if (e) e.preventDefault();

//     const companyID = getCompanyID();
//     const userID = getUserID();

//     if (!companyID) {
//       setErrorMessage("CompanyID not found. Please login again.");
//       return;
//     }
//     if (!selectedProperty?.id) {
//       setErrorMessage("Please select a property first.");
//       return;
//     }
//     if (!userID) {
//       setErrorMessage("UserID not found. Please login again.");
//       return;
//     }

//     setSaving(true);
//     setErrorMessage("");
//     try {
//       const payload = mapFormToApiPayload({ ...form, id: null }, {
//         companyId: companyID,
//         propertyId: selectedProperty.id,
//         userId: userID,
//       });
//       const response = await api.post("/api/insertUpdatePropertyMaintenance", payload);
//       const data = response.data;

//       if (data?.success) {
//         await loadMaintenance(selectedProperty.id);
//         setSaved(true);
//       } else {
//         setErrorMessage(data?.message || "Unable to save maintenance information.");
//       }
//     } catch (error) {
//       console.error("Error saving maintenance:", error);
//       setErrorMessage(error?.response?.data?.message || "Unable to save maintenance information.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (!isEditing || !selectedProperty?.id) return;

//     const companyID = getCompanyID();
//     const userID = getUserID();

//     setDeleting(true);
//     setErrorMessage("");
//     try {
//       const response = await api.post("/api/deletePropertyMaintenance", {
//           MaintenanceID: form.id,
//           CompanyID: companyID,
//           PropertyID: selectedProperty.id,
//           UserID: userID,
//         },);
//       const data = response.data;

//       if (data?.success) {
//         setForm(INITIAL_FORM);
//         setSaved(false);
//         backToList();
//       } else {
//         setErrorMessage(data?.message || "Unable to delete maintenance information.");
//       }
//     } catch (error) {
//       console.error("Error deleting maintenance:", error);
//       setErrorMessage(error?.response?.data?.message || "Unable to delete maintenance information.");
//     } finally {
//       setDeleting(false);
//     }
//   };

//   return (
//     <div className="maintenance-root">
//       <style>{`
//         :root {
//           --mt-primary: #10299b;
//           --mt-primary-dark: #0b1c6e;
//           --mt-primary-mid: #4a5fc1;
//           --mt-primary-soft: #eef1fb;
//           --mt-primary-tint: #d6ddf5;

//           --mt-ink: #1a1f36;
//           --mt-muted: #6b7290;

//           --mt-green: #1a9e6c;
//           --mt-green-soft: #e6f7f0;

//           --mt-danger: #dc3545;
//           --mt-danger-soft: #fdecec;
//         }

//         .maintenance-root {
//           width: 100%;
//           font-family: "Inter", system-ui, -apple-system,
//             "Segoe UI", sans-serif;
//           color: var(--mt-ink);
//         }

//         .mt-alert{
//           display:flex; align-items:center; gap:10px;
//           background:var(--mt-danger-soft); color:var(--mt-danger);
//           border:1px solid #f5b8b8; border-radius:10px;
//           padding:10px 14px; font-size:.83rem; font-weight:600;
//           margin-bottom:14px;
//         }

//         .mt-loading{
//           text-align:center; padding:32px 16px; color:var(--mt-muted); font-size:.85rem;
//         }

//         .mt-context-card {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           gap: 12px;
//           padding: 14px 16px;
//           margin-bottom: 16px;
//           border: 1px solid var(--mt-primary-tint);
//           border-radius: 14px;
//           background: var(--mt-primary-soft);
//         }

//         .mt-context-title {
//           font-size: 0.78rem;
//           font-weight: 700;
//           color: var(--mt-primary-dark);
//           text-transform: uppercase;
//           letter-spacing: 0.5px;
//         }

//         .mt-context-sub {
//           font-size: 0.84rem;
//           color: var(--mt-muted);
//           margin-top: 3px;
//         }

//         .mt-list-card {
//           background: #fff;
//           border: 1px solid var(--mt-primary-tint);
//           border-radius: 16px;
//           overflow: hidden;
//           box-shadow: 0 4px 18px rgba(16, 41, 155, 0.06);
//         }

//         .mt-property-item {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           gap: 12px;
//           padding: 14px 16px;
//           border-bottom: 1px solid #f0f2fa;
//           cursor: pointer;
//         }

//         .mt-property-item:last-child {
//           border-bottom: none;
//         }

//         .mt-property-name {
//           font-size: 0.84rem;
//           font-weight: 700;
//           color: var(--mt-primary-dark);
//         }

//         .mt-property-code {
//           font-size: 0.74rem;
//           color: var(--mt-muted);
//           margin-top: 3px;
//         }

//         .mt-list-row {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           gap: 12px;
//           padding: 14px 16px;
//           border-bottom: 1px solid #f0f2fa;
//           cursor: pointer;
//         }

//         .mt-list-row:last-child {
//           border-bottom: none;
//         }

//         .mt-list-title {
//           font-size: 0.84rem;
//           font-weight: 700;
//           color: var(--mt-primary-dark);
//         }

//         .mt-list-sub {
//           font-size: 0.74rem;
//           color: var(--mt-muted);
//           margin-top: 3px;
//         }

//         .maintenance-root *,
//         .maintenance-root *::before,
//         .maintenance-root *::after {
//           box-sizing: border-box;
//         }

//         /* PAGE HEADER */

//         .mt-page-header {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           margin-bottom: 28px;
//         }

//         .mt-page-title {
//           margin: 0;
//           color: var(--mt-primary-dark);
//           font-size: 1.25rem;
//           font-weight: 800;
//         }

//         .mt-page-subtitle {
//           margin: 5px 0 0;
//           color: var(--mt-muted);
//           font-size: 0.8rem;
//         }

//         /* SECTION */

//         .mt-section {
//           margin-bottom: 28px;
//         }

//         .mt-section-head {
//           display: flex;
//           align-items: center;
//           gap: 10px;
//           margin-bottom: 16px;
//           padding-bottom: 12px;
//           border-bottom: 1px solid var(--mt-primary-tint);
//         }

//         .mt-section-icon {
//           width: 36px;
//           height: 36px;
//           flex: 0 0 36px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           border-radius: 9px;
//           background: var(--mt-primary-soft);
//           color: var(--mt-primary);
//           font-size: 0.95rem;
//         }

//         .mt-section-title {
//           margin: 0;
//           color: var(--mt-primary-dark);
//           font-size: 0.95rem;
//           font-weight: 700;
//         }

//         .mt-section-sub {
//           margin-top: 2px;
//           color: var(--mt-muted);
//           font-size: 0.76rem;
//         }

//         /* GRID */

//         .mt-grid {
//           display: grid;
//           grid-template-columns:
//             repeat(auto-fill, minmax(230px, 1fr));
//           gap: 16px 18px;
//         }

//         .mt-grid-3 {
//           display: grid;
//           grid-template-columns: repeat(3, minmax(0, 1fr));
//           gap: 16px 18px;
//         }

//         @media (max-width: 900px) {
//           .mt-grid-3 {
//             grid-template-columns: repeat(2, minmax(0, 1fr));
//           }
//         }

//         @media (max-width: 600px) {
//           .mt-grid-3 {
//             grid-template-columns: 1fr;
//           }
//         }

//         .mt-grid-wide {
//           display: grid;
//           grid-template-columns:
//             repeat(auto-fill, minmax(300px, 1fr));
//           gap: 16px 18px;
//         }

//         .mt-field {
//           min-width: 0;
//         }

//         .mt-field-full {
//           grid-column: 1 / -1;
//         }

//         /* LABEL */

//         .mt-label {
//           display: block;
//           margin-bottom: 6px;
//           color: var(--mt-primary-mid);
//           font-size: 0.72rem;
//           font-weight: 700;
//           text-transform: uppercase;
//           letter-spacing: 0.4px;
//         }

//         /* INPUT */

//         .mt-input,
//         .mt-select,
//         .mt-textarea {
//           width: 100%;
//           border: 1px solid var(--mt-primary-tint);
//           border-radius: 9px;
//           padding: 9px 12px;
//           color: var(--mt-ink);
//           background: #fff;
//           outline: none;
//           font-family: inherit;
//           font-size: 0.84rem;
//           transition:
//             border-color 0.15s ease,
//             box-shadow 0.15s ease;
//         }

//         .mt-input,
//         .mt-select {
//           min-height: 40px;
//         }

//         .mt-textarea {
//           min-height: 95px;
//           resize: vertical;
//           line-height: 1.5;
//         }

//         .mt-input:focus,
//         .mt-select:focus,
//         .mt-textarea:focus {
//           border-color: var(--mt-primary);
//           box-shadow:
//             0 0 0 3px rgba(16, 41, 155, 0.12);
//         }

//         .mt-input::placeholder,
//         .mt-textarea::placeholder {
//           color: #a0a5b8;
//         }

//         /* INFO STRIP */

//         .mt-info-strip {
//           display: flex;
//           align-items: flex-start;
//           gap: 10px;
//           padding: 11px 13px;
//           margin-bottom: 17px;
//           border-radius: 9px;
//           background: var(--mt-primary-soft);
//           color: var(--mt-primary-dark);
//           font-size: 0.75rem;
//           line-height: 1.5;
//         }

//         .mt-info-strip i {
//           margin-top: 1px;
//           color: var(--mt-primary);
//         }

//         /* COST */

//         .mt-cost-group {
//           display: flex;
//           gap: 8px;
//         }

//         .mt-cost-group .mt-input {
//           flex: 1;
//         }

//         .mt-cost-group .mt-select {
//           width: 130px;
//           flex: 0 0 130px;
//         }

//         /* FOOTER */

//         .mt-footer {
//           display: flex;
//           align-items: center;
//           flex-wrap: wrap;
//           gap: 10px;
//           padding-top: 18px;
//           border-top: 1px solid var(--mt-primary-tint);
//         }

//         .mt-btn {
//           min-height: 40px;
//           border: none;
//           border-radius: 10px;
//           padding: 9px 20px;
//           font-size: 0.84rem;
//           font-weight: 700;
//           cursor: pointer;
//           transition: all 0.15s ease;
//         }

//         .mt-btn-primary {
//           background: var(--mt-primary);
//           color: #fff;
//         }

//         .mt-btn-primary:hover:not(:disabled) {
//           background: var(--mt-primary-dark);
//           box-shadow:
//             0 4px 10px rgba(16, 41, 155, 0.25);
//         }

//         .mt-btn-secondary {
//           background: var(--mt-primary-soft);
//           color: var(--mt-primary);
//         }

//         .mt-btn-secondary:hover:not(:disabled) {
//           background: var(--mt-primary-tint);
//         }

//         .mt-btn-danger {
//           background: #fff;
//           color: var(--mt-danger);
//           border: 1.5px solid #f5b8b8;
//         }

//         .mt-btn-danger:hover:not(:disabled) {
//           background: var(--mt-danger-soft);
//         }

//         .mt-btn-success {
//           background: var(--mt-green);
//           color: #fff;
//         }

//         .mt-btn-success:hover:not(:disabled) {
//           background: #148057;
//           box-shadow: 0 4px 10px rgba(26, 158, 108, 0.25);
//         }

//         .mt-btn:disabled {
//           opacity: 0.6;
//           cursor: default;
//         }

//         .mt-saved {
//           display: flex;
//           align-items: center;
//           gap: 6px;
//           padding: 8px 14px;
//           border-radius: 9px;
//           background: var(--mt-green-soft);
//           color: var(--mt-green);
//           font-size: 0.8rem;
//           font-weight: 600;
//         }

//         /* MAINTENANCE HISTORY TABLE */
//         .mt-table-wrap {
//           width: 100%;
//           overflow-x: auto;
//           border: 1px solid var(--mt-primary-tint);
//           border-radius: 14px;
//           background: #fff;
//           box-shadow: 0 2px 10px rgba(16, 41, 155, 0.04);
//         }

//         .mt-table {
//           width: 100%;
//           border-collapse: collapse;
//           font-size: 0.82rem;
//           text-align: left;
//         }

//         .mt-table th {
//           background: var(--mt-primary-soft);
//           color: var(--mt-primary-dark);
//           font-weight: 700;
//           font-size: 0.74rem;
//           text-transform: uppercase;
//           letter-spacing: 0.4px;
//           padding: 12px 14px;
//           border-bottom: 1px solid var(--mt-primary-tint);
//           white-space: nowrap;
//         }

//         .mt-table td {
//           padding: 12px 14px;
//           border-bottom: 1px solid #f0f2fa;
//           color: var(--mt-ink);
//           vertical-align: middle;
//         }

//         .mt-table tr:last-child td {
//           border-bottom: none;
//         }

//         .mt-table tr:hover td {
//           background: #f8faff;
//         }

//         .mt-badge {
//           display: inline-flex;
//           align-items: center;
//           padding: 3px 8px;
//           border-radius: 6px;
//           font-size: 0.72rem;
//           font-weight: 600;
//         }

//         .mt-badge-success {
//           background: var(--mt-green-soft);
//           color: var(--mt-green);
//         }

//         .mt-badge-secondary {
//           background: #f1f3f9;
//           color: var(--mt-muted);
//         }

//         .mt-badge-info {
//           background: var(--mt-primary-soft);
//           color: var(--mt-primary);
//         }

//         .mt-action-btn {
//           display: inline-flex;
//           align-items: center;
//           gap: 5px;
//           padding: 5px 12px;
//           border-radius: 7px;
//           font-size: 0.76rem;
//           font-weight: 600;
//           border: 1px solid var(--mt-primary-tint);
//           background: #fff;
//           color: var(--mt-primary);
//           cursor: pointer;
//           transition: all 0.15s ease;
//         }

//         .mt-action-btn:hover {
//           background: var(--mt-primary-soft);
//           border-color: var(--mt-primary);
//         }

//         .mt-action-btn.active {
//           background: var(--mt-primary);
//           color: #fff;
//           border-color: var(--mt-primary);
//         }

//         .mt-action-btn-danger {
//           border-color: #f5b8b8;
//           color: var(--mt-danger);
//           background: #fff;
//           margin-left: 6px;
//         }

//         .mt-action-btn-danger:hover {
//           background: var(--mt-danger-soft);
//           border-color: var(--mt-danger);
//         }

//         @media (max-width: 768px) {
//           .mt-page-header {
//             align-items: flex-start;
//             flex-direction: column;
//           }

//           .mt-cost-group {
//             flex-direction: column;
//           }

//           .mt-cost-group .mt-select {
//             width: 100%;
//             flex: 1;
//           }
//         }

//         @media (max-width: 480px) {
//           .mt-footer {
//             align-items: stretch;
//             flex-direction: column;
//           }

//           .mt-btn {
//             width: 100%;
//           }
//         }
//       `}</style>

//       {errorMessage && (
//         <div className="mt-alert">
//           <i className="bi bi-exclamation-triangle"></i>
//           {errorMessage}
//         </div>
//       )}

//       <div className="mt-context-card">
//         <div>
//           <div className="mt-context-title">Selected property</div>
//           <div className="mt-context-sub">
//             {selectedProperty
//               ? selectedProperty.propertyName || selectedProperty.propertyCode || "Selected property"
//               : "Choose a property from the list to continue"}
//           </div>
//         </div>

//         {selectedProperty ? (
//           <button
//             type="button"
//             className="mt-btn mt-btn-secondary"
//             onClick={() => onSelectProperty(null)}
//           >
//             Change property
//           </button>
//         ) : null}
//       </div>

//       {!selectedProperty ? (
//         <div className="mt-list-card">
//           {propertiesLoading ? (
//             <div className="mt-loading">Loading properties…</div>
//           ) : properties.length === 0 ? (
//             <div className="mt-loading">No properties found for this company.</div>
//           ) : (
//             properties.map((property) => (
//               <div
//                 key={property.id}
//                 className="mt-property-item"
//                 onClick={() => onSelectProperty(property.id)}
//               >
//                 <div>
//                   <div className="mt-property-name">
//                     {property.propertyName || property.propertyCode}
//                   </div>
//                   <div className="mt-property-code">
//                     {property.propertyCode || property.propertyId}
//                   </div>
//                 </div>
//                 <i className="bi bi-chevron-right" style={{ color: "var(--mt-primary)" }}></i>
//               </div>
//             ))
//           )}
//         </div>
//       ) : loading ? (
//         <div className="mt-list-card">
//           <div className="mt-loading">Loading maintenance details…</div>
//         </div>
//       ) : !showList ? (
//         <form onSubmit={handleSave}>

//           {/* PAGE HEADER */}

//           <div className="mt-page-header">
//             <div>
//               <h2 className="mt-page-title">
//                 Maintenance
//               </h2>

//               <p className="mt-page-subtitle">
//                 Manage maintenance schedules, warranties,
//                 service providers and repair records
//               </p>
//             </div>

//             <button type="button" className="mt-btn mt-btn-secondary" onClick={backToList}>
//               <i className="bi bi-arrow-left me-2"></i>
//               Back
//             </button>
//           </div>

//           {isEditing && (
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 gap: "10px",
//                 padding: "10px 16px",
//                 marginBottom: "20px",
//                 background: "var(--mt-primary-soft)",
//                 border: "1px solid var(--mt-primary-tint)",
//                 borderRadius: "10px",
//                 fontSize: "0.82rem",
//                 color: "var(--mt-primary-dark)",
//                 fontWeight: 600,
//               }}
//             >
//               <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//                 <i className="bi bi-pencil-fill" style={{ color: "var(--mt-primary)" }}></i>
//                 <span>
//                   Currently Editing Maintenance Record #{form.id}
//                   {form.roomNo ? ` (Room ${form.roomNo})` : ""}
//                 </span>
//               </div>
//               <button
//                 type="button"
//                 className="mt-btn mt-btn-secondary"
//                 style={{ padding: "4px 10px", fontSize: "0.75rem" }}
//                 onClick={handleAddNew}
//               >
//                 <i className="bi bi-plus-lg me-1"></i>
//                 Add New Record
//               </button>
//             </div>
//           )}

//           {/* MAINTENANCE INFORMATION */}

//           <div className="mt-section">
//             <div className="mt-section-head">
//               <div className="mt-section-icon">
//                 <i className="bi bi-calendar-check"></i>
//               </div>

//               <div>
//                 <p className="mt-section-title">
//                   Maintenance Information
//                 </p>

//                 <div className="mt-section-sub">
//                   Track previous and upcoming maintenance
//                 </div>
//               </div>
//             </div>

//             <div className="mt-grid mt-grid-3">

//               {/* 1. Last Maintenance Date */}
//               <div className="mt-field">
//                 <label className="mt-label">
//                   Last Maintenance Date
//                 </label>

//                 <input
//                   type="date"
//                   className="mt-input"
//                   value={form.lastMaintenanceDate}
//                   onChange={handleChange(
//                     "lastMaintenanceDate"
//                   )}
//                 />
//               </div>

//               {/* 2. Next Scheduled Maintenance */}
//               <div className="mt-field">
//                 <label className="mt-label">
//                   Next Scheduled Maintenance
//                 </label>

//                 <input
//                   type="date"
//                   className="mt-input"
//                   value={form.nextScheduledMaintenance}
//                   onChange={handleChange(
//                     "nextScheduledMaintenance"
//                   )}
//                 />
//               </div>

//               {/* 3. Room Selection (ROOM No - ID) */}
//               <div className="mt-field">
//                 <label className="mt-label">
//                   ROOM No - ID
//                 </label>

//                 <select
//                   className="mt-select"
//                   value={form.roomId || form.roomTypeId || ""}
//                   onChange={handleRoomChange}
//                   disabled={!selectedProperty?.id || mastersLoading}
//                 >
//                   <option value="">
//                     {mastersLoading
//                       ? "Loading Rooms..."
//                       : !selectedProperty?.id
//                         ? "Select Property First"
//                         : roomOptions.length === 0
//                           ? "No Rooms Found for this Property"
//                           : "Select Room"}
//                   </option>
//                   {roomOptions.map((opt) => (
//                     <option key={opt.roomId} value={opt.roomId}>
//                       {opt.label}
//                     </option>
//                   ))}
//                   {(form.roomId || form.roomTypeId) &&
//                     !roomOptions.some(
//                       (opt) => String(opt.roomId) === String(form.roomId || form.roomTypeId)
//                     ) && (
//                       <option value={form.roomId || form.roomTypeId}>
//                         {form.roomNo
//                           ? `${form.roomNo} - ${form.roomType}`
//                           : form.roomType || `Room #${form.roomId || form.roomTypeId}`}
//                       </option>
//                     )}
//                 </select>

//               </div>

//             </div>
//           </div>

//           {/* AMC */}

//           <div className="mt-section">
//             <div className="mt-section-head">
//               <div className="mt-section-icon">
//                 <i className="bi bi-file-earmark-text"></i>
//               </div>

//               <div>
//                 <p className="mt-section-title">
//                   Annual Maintenance Contract (AMC)
//                 </p>

//                 <div className="mt-section-sub">
//                   Manage AMC agreement and validity details
//                 </div>
//               </div>
//             </div>

//             <div className="mt-grid">

//               <div className="mt-field">
//                 <label className="mt-label">
//                   AMC Available
//                 </label>

//                 <select
//                   className="mt-select"
//                   value={form.amcAvailable}
//                   onChange={handleChange("amcAvailable")}
//                 >
//                   <option value="">Select</option>
//                   <option value="Yes">Yes</option>
//                   <option value="No">No</option>
//                 </select>
//               </div>

//               <div className="mt-field">
//                 <label className="mt-label">
//                   AMC Contract Number
//                 </label>

//                 <input
//                   type="text"
//                   className="mt-input"
//                   value={form.amcContractNo}
//                   onChange={handleChange(
//                     "amcContractNo"
//                   )}
//                   placeholder="e.g. AMC-2026-001"
//                 />
//               </div>

//               <div className="mt-field">
//                 <label className="mt-label">
//                   AMC Start Date
//                 </label>

//                 <input
//                   type="date"
//                   className="mt-input"
//                   value={form.amcStartDate}
//                   onChange={handleChange(
//                     "amcStartDate"
//                   )}
//                 />
//               </div>

//               <div className="mt-field">
//                 <label className="mt-label">
//                   AMC End Date
//                 </label>

//                 <input
//                   type="date"
//                   className="mt-input"
//                   value={form.amcEndDate}
//                   onChange={handleChange(
//                     "amcEndDate"
//                   )}
//                 />
//               </div>

//             </div>
//           </div>

//           {/* WARRANTY */}

//           <div className="mt-section">
//             <div className="mt-section-head">
//               <div className="mt-section-icon">
//                 <i className="bi bi-shield-check"></i>
//               </div>

//               <div>
//                 <p className="mt-section-title">
//                   Warranty Information
//                 </p>

//                 <div className="mt-section-sub">
//                   Record warranty coverage and expiry
//                 </div>
//               </div>
//             </div>

//             <div className="mt-grid">

//               <div className="mt-field">
//                 <label className="mt-label">
//                   Warranty Available
//                 </label>

//                 <select
//                   className="mt-select"
//                   value={form.warrantyAvailable}
//                   onChange={handleChange(
//                     "warrantyAvailable"
//                   )}
//                 >
//                   <option value="">Select</option>
//                   <option value="Yes">Yes</option>
//                   <option value="No">No</option>
//                 </select>
//               </div>

//               <div className="mt-field">
//                 <label className="mt-label">
//                   Warranty Expiry Date
//                 </label>

//                 <input
//                   type="date"
//                   className="mt-input"
//                   value={form.warrantyExpiryDate}
//                   onChange={handleChange(
//                     "warrantyExpiryDate"
//                   )}
//                 />
//               </div>

//               <div className="mt-field mt-field-full">
//                 <label className="mt-label">
//                   Warranty Details
//                 </label>

//                 <textarea
//                   className="mt-textarea"
//                   value={form.warrantyDetails}
//                   onChange={handleChange(
//                     "warrantyDetails"
//                   )}
//                   placeholder="Enter warranty coverage, equipment details or terms..."
//                 />
//               </div>

//             </div>
//           </div>

//           {/* CONTRACTOR */}

//           <div className="mt-section">
//             <div className="mt-section-head">
//               <div className="mt-section-icon">
//                 <i className="bi bi-person-badge"></i>
//               </div>

//               <div>
//                 <p className="mt-section-title">
//                   Contractor Details
//                 </p>

//                 <div className="mt-section-sub">
//                   Contact information for the maintenance contractor
//                 </div>
//               </div>
//             </div>

//             <div className="mt-grid">

//               <div className="mt-field">
//                 <label className="mt-label">
//                   Contractor Name
//                 </label>

//                 <input
//                   type="text"
//                   className="mt-input"
//                   value={form.contractorName}
//                   onChange={handleChange(
//                     "contractorName"
//                   )}
//                   placeholder="Enter contractor name"
//                 />
//               </div>

//               <div className="mt-field">
//                 <label className="mt-label">
//                   Phone Number
//                 </label>

//                 <input
//                   type="tel"
//                   className="mt-input"
//                   value={form.contractorPhone}
//                   onChange={handleChange(
//                     "contractorPhone"
//                   )}
//                   placeholder="Enter phone number"
//                 />
//               </div>

//               <div className="mt-field">
//                 <label className="mt-label">
//                   Email Address
//                 </label>

//                 <input
//                   type="email"
//                   className="mt-input"
//                   value={form.contractorEmail}
//                   onChange={handleChange(
//                     "contractorEmail"
//                   )}
//                   placeholder="contractor@example.com"
//                 />
//               </div>

//               <div className="mt-field">
//                 <label className="mt-label">
//                   Service Provider
//                 </label>

//                 <input
//                   type="text"
//                   className="mt-input"
//                   value={form.serviceProvider}
//                   onChange={handleChange(
//                     "serviceProvider"
//                   )}
//                   placeholder="Company / service provider"
//                 />
//               </div>

//               <div className="mt-field">
//                 <label className="mt-label">
//                   Service Contact
//                 </label>

//                 <input
//                   type="tel"
//                   className="mt-input"
//                   value={form.serviceContact}
//                   onChange={handleChange(
//                     "serviceContact"
//                   )}
//                   placeholder="Service contact number"
//                 />
//               </div>

//               <div className="mt-field mt-field-full">
//                 <label className="mt-label">
//                   Contractor Address
//                 </label>

//                 <textarea
//                   className="mt-textarea"
//                   value={form.contractorAddress}
//                   onChange={handleChange(
//                     "contractorAddress"
//                   )}
//                   placeholder="Enter contractor address..."
//                 />
//               </div>

//             </div>
//           </div>

//           {/* MAINTENANCE COST */}

//           <div className="mt-section">
//             <div className="mt-section-head">
//               <div className="mt-section-icon">
//                 <i className="bi bi-currency-dollar"></i>
//               </div>

//               <div>
//                 <p className="mt-section-title">
//                   Maintenance Cost
//                 </p>

//                 <div className="mt-section-sub">
//                   Record recurring maintenance expenses
//                 </div>
//               </div>
//             </div>

//             <div className="mt-grid">

//               <div className="mt-field">
//                 <label className="mt-label">
//                   Maintenance Cost
//                 </label>

//                 <div className="mt-cost-group">

//                   <input
//                     type="number"
//                     min="0"
//                     step="0.01"
//                     className="mt-input"
//                     value={form.maintenanceCost}
//                     onChange={handleChange(
//                       "maintenanceCost"
//                     )}
//                     placeholder="0.00"
//                   />

//                   <select
//                     className="mt-select"
//                     value={form.costFrequency}
//                     onChange={handleChange(
//                       "costFrequency"
//                     )}
//                   >
//                     <option value="">
//                       Frequency
//                     </option>
//                     <option value="One Time">
//                       One Time
//                     </option>
//                     <option value="Monthly">
//                       Monthly
//                     </option>
//                     <option value="Quarterly">
//                       Quarterly
//                     </option>
//                     <option value="Half Yearly">
//                       Half Yearly
//                     </option>
//                     <option value="Yearly">
//                       Yearly
//                     </option>
//                   </select>

//                 </div>
//               </div>

//             </div>
//           </div>

//           {/* REPAIR HISTORY */}

//           <div className="mt-section">
//             <div className="mt-section-head">
//               <div className="mt-section-icon">
//                 <i className="bi bi-tools"></i>
//               </div>

//               <div>
//                 <p className="mt-section-title">
//                   Repair History
//                 </p>

//                 <div className="mt-section-sub">
//                   Record previous repairs and maintenance work
//                 </div>
//               </div>
//             </div>

//             <div className="mt-grid">

//               <div className="mt-field mt-field-full">
//                 <label className="mt-label">
//                   Repair History
//                 </label>

//                 <textarea
//                   className="mt-textarea"
//                   value={form.repairHistory}
//                   onChange={handleChange(
//                     "repairHistory"
//                   )}
//                   placeholder="Enter repair details, dates, work performed and associated costs..."
//                 />
//               </div>

//             </div>
//           </div>

//           {/* INSPECTION REPORTS */}

//           <div className="mt-section">
//             <div className="mt-section-head">
//               <div className="mt-section-icon">
//                 <i className="bi bi-clipboard2-check"></i>
//               </div>

//               <div>
//                 <p className="mt-section-title">
//                   Inspection Reports
//                 </p>

//                 <div className="mt-section-sub">
//                   Record inspection findings and report references
//                 </div>
//               </div>
//             </div>

//             <div className="mt-info-strip">
//               <i className="bi bi-info-circle-fill"></i>

//               <span>
//                 Add inspection dates, findings, safety observations,
//                 report numbers or other relevant inspection information.
//               </span>
//             </div>

//             <div className="mt-field">
//               <label className="mt-label">
//                 Inspection Reports
//               </label>

//               <textarea
//                 className="mt-textarea"
//                 value={form.inspectionReports}
//                 onChange={handleChange(
//                   "inspectionReports"
//                 )}
//                 placeholder="Enter inspection report details..."
//               />
//             </div>
//           </div>

//           {/* MAINTENANCE HISTORY */}
//           <div className="mt-section">
//             <div className="mt-section-head">
//               <div className="mt-section-icon">
//                 <i className="bi bi-clock-history"></i>
//               </div>

//               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
//                 <div>
//                   <p className="mt-section-title">
//                     Maintenance History
//                   </p>

//                   <div className="mt-section-sub">
//                     Historical records of all maintenance performed for this property
//                   </div>
//                 </div>

//                 {isEditing && (
//                   <button
//                     type="button"
//                     className="mt-btn mt-btn-secondary"
//                     style={{ padding: "6px 12px", fontSize: "0.78rem" }}
//                     onClick={handleAddNew}
//                   >
//                     <i className="bi bi-plus-lg me-1"></i>
//                     New Maintenance Record
//                   </button>
//                 )}
//               </div>
//             </div>

//             {maintenanceList.length === 0 ? (
//               <div
//                 className="mt-loading"
//                 style={{
//                   padding: "24px 16px",
//                   background: "#fff",
//                   borderRadius: "12px",
//                   border: "1px dashed var(--mt-primary-tint)",
//                 }}
//               >
//                 <i
//                   className="bi bi-calendar-x"
//                   style={{ fontSize: "1.5rem", display: "block", marginBottom: "8px", opacity: 0.5 }}
//                 ></i>
//                 No previous maintenance records found for this property.
//               </div>
//             ) : (
//               <div className="mt-table-wrap">
//                 <table className="mt-table">
//                   <thead>
//                     <tr>
//                       <th>#</th>
//                       <th>Last Maintenance</th>
//                       <th>Next Scheduled</th>
//                       <th>Room / Unit</th>
//                       <th>AMC</th>
//                       <th>Warranty</th>
//                       <th>Contractor / Provider</th>
//                       <th>Cost</th>
//                       <th style={{ textAlign: "center" }}>Action</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {maintenanceList.map((item, idx) => {
//                       const matchedRoom = propertyMasters.find(
//                         (m) => String(m.RoomID ?? m.RecordID) === String(item.RoomTypeID)
//                       );
//                       const roomLabel = matchedRoom
//                         ? `${matchedRoom.RoomNo || matchedRoom.FlatNo || ""} ${matchedRoom.RoomType || matchedRoom.FlatType
//                             ? `(${matchedRoom.RoomType || matchedRoom.FlatType})`
//                             : ""
//                           }`.trim()
//                         : item.RoomType || "—";

//                       const isCurrent = form.id === item.MaintenanceID;

//                       return (
//                         <tr
//                           key={item.MaintenanceID || idx}
//                           style={{
//                             background: isCurrent ? "var(--mt-primary-soft)" : "transparent",
//                             fontWeight: isCurrent ? "600" : "normal",
//                           }}
//                         >
//                           <td>{idx + 1}</td>
//                           <td>
//                             {item.LastMaintenanceDate
//                               ? item.LastMaintenanceDate.toString().slice(0, 10)
//                               : "—"}
//                           </td>
//                           <td>
//                             {item.NextScheduledMaintenance
//                               ? item.NextScheduledMaintenance.toString().slice(0, 10)
//                               : "—"}
//                           </td>
//                           <td>{roomLabel || "—"}</td>
//                           <td>
//                             {item.AMCAvailable === "Yes" ? (
//                               <span className="mt-badge mt-badge-success">
//                                 {item.AMCContractNumber ? `AMC: ${item.AMCContractNumber}` : "AMC Active"}
//                               </span>
//                             ) : (
//                               <span className="mt-badge mt-badge-secondary">No</span>
//                             )}
//                           </td>
//                           <td>
//                             {item.WarrantyAvailable === "Yes" ? (
//                               <span className="mt-badge mt-badge-success">Warranty</span>
//                             ) : (
//                               <span className="mt-badge mt-badge-secondary">No</span>
//                             )}
//                           </td>
//                           <td>{item.ContractorName || item.ServiceProvider || "—"}</td>
//                           <td>
//                             {item.MaintenanceCost
//                               ? `${Number(item.MaintenanceCost).toLocaleString()} ${item.MaintenanceCostFrequency ? `(${item.MaintenanceCostFrequency})` : ""
//                               }`
//                               : "—"}
//                           </td>
//                           <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
//                             <button
//                               type="button"
//                               className={`mt-action-btn ${isCurrent ? "active" : ""}`}
//                               onClick={() => handleSelectHistoryItem(item)}
//                               title="Edit this maintenance record"
//                             >
//                               <i className="bi bi-pencil-square"></i>
//                               {isCurrent ? "Editing" : "Edit"}
//                             </button>
//                             <button
//                               type="button"
//                               className="mt-action-btn mt-action-btn-danger"
//                               onClick={() => handleDeleteHistoryItem(item)}
//                               disabled={deleting}
//                               title="Delete this maintenance record"
//                             >
//                               <i className="bi bi-trash3"></i>
//                               Delete
//                             </button>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </div>

//           {/* FOOTER */}

//           <div className="mt-footer">

//             {isEditing ? (
//               <>
//                 <button
//                   type="submit"
//                   className="mt-btn mt-btn-primary"
//                   disabled={saving}
//                 >
//                   <i
//                     className={`bi ${saving
//                         ? "bi-hourglass-split"
//                         : "bi-check2-circle"
//                       } me-2`}
//                   ></i>
//                   {saving ? "Updating..." : "Update Maintenance"}
//                 </button>

//                 <button
//                   type="button"
//                   className="mt-btn mt-btn-success"
//                   onClick={handleSaveNew}
//                   disabled={saving}
//                   title="Save as a new maintenance record"
//                 >
//                   <i
//                     className={`bi ${saving
//                         ? "bi-hourglass-split"
//                         : "bi-plus-circle"
//                       } me-2`}
//                   ></i>
//                   {saving ? "Saving..." : "Save Maintenance"}
//                 </button>
//               </>
//             ) : (
//               <button
//                 type="submit"
//                 className="mt-btn mt-btn-primary"
//                 disabled={saving}
//               >
//                 <i
//                   className={`bi ${saving
//                       ? "bi-hourglass-split"
//                       : "bi-check2-circle"
//                     } me-2`}
//                 ></i>
//                 {saving ? "Saving..." : "Save Maintenance"}
//               </button>
//             )}

//             <button
//               type="button"
//               className="mt-btn mt-btn-secondary"
//               onClick={handleReset}
//               disabled={saving}
//             >
//               <i className="bi bi-arrow-counterclockwise me-2"></i>
//               Reset
//             </button>

//             {isEditing && (
//               <button
//                 type="button"
//                 className="mt-btn mt-btn-danger"
//                 onClick={handleDelete}
//                 disabled={deleting}
//               >
//                 <i className={`bi ${deleting ? "bi-hourglass-split" : "bi-trash3"} me-2`}></i>
//                 {deleting ? "Deleting..." : "Delete"}
//               </button>
//             )}

//             {saved && (
//               <span className="mt-saved">
//                 <i className="bi bi-check-circle-fill"></i>
//                 Maintenance saved successfully
//               </span>
//             )}

//           </div>

//         </form>
//       ) : (
//         <>
//           <div className="mt-list-card">
//             <div className="mt-list-row" onClick={openDetails}>
//               <div>
//                 <div className="mt-list-title">Maintenance Profile</div>
//                 <div className="mt-list-sub">
//                   {isEditing
//                     ? "View or update maintenance schedules, warranties and service details."
//                     : "No maintenance record yet — add one for this property."}
//                 </div>
//               </div>
//               <i className="bi bi-chevron-right" style={{ color: "var(--mt-primary)" }}></i>
//             </div>
//           </div>

//           <div className="mt-footer" style={{ marginTop: 16 }}>
//             <button type="button" className="mt-btn mt-btn-primary" onClick={openDetails}>
//               <i className={`bi ${isEditing ? "bi-pencil" : "bi-plus-lg"} me-2`}></i>
//               {isEditing ? "Open maintenance profile" : "Add maintenance profile"}
//             </button>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default Maintenance;

import React, { useEffect, useMemo, useState } from "react";
import api from "../../apiService";

const AMC_OPTIONS = ["Yes", "No"];
const WARRANTY_OPTIONS = ["Yes", "No"];
const COST_FREQUENCIES = ["One Time", "Monthly", "Quarterly", "Half Yearly", "Yearly"];

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

const mapApiProperty = (p) => ({
  id: p.PropertyID ?? p.propertyId ?? p.id,
  propertyId: p.PropertyID ?? p.propertyId ?? p.id,
  propertyName: p.PropertyName ?? p.propertyName ?? "",
  propertyCode: p.PropertyCode ?? p.propertyCode ?? "",
});

const d10 = (v) => (v ?? "").toString().slice(0, 10);

// Build a readable room label from a master row
const buildRoomLabel = (roomNo, roomType, roomId) => {
  const no = (roomNo ?? "").toString().trim();
  const type = (roomType ?? "").toString().trim();
  if (no && type) return `${no} - ${type}`;
  if (no) return no;
  if (type) return type;
  return roomId ? `Room #${roomId}` : "";
};

// API row -> form/list shape (masters used to fill RoomNo / RoomType if missing)
const mapApiMaintenance = (m, masters = []) => {
  const roomTypeId = m.RoomTypeID ?? m.TypeID ?? "";
  const roomId = m.RoomID ?? roomTypeId ?? "";

  const matched = Array.isArray(masters)
    ? masters.find((item) => String(item.RoomID ?? item.RecordID) === String(roomId || roomTypeId))
    : null;

  const roomNo = m.RoomNo || (matched ? (matched.RoomNo ?? matched.FlatNo ?? "") : "") || "";
  const roomType = m.RoomType || (matched ? (matched.RoomType ?? matched.FlatType ?? "") : "") || "";

  return {
    id: m.MaintenanceID,
    lastMaintenanceDate: d10(m.LastMaintenanceDate),
    nextScheduledMaintenance: d10(m.NextScheduledMaintenance),
    roomId: matched ? (matched.RoomID ?? matched.RecordID) : roomId,
    roomNo,
    typeId: matched ? (matched.TypeID ?? matched.RecordID) : (m.TypeID ?? roomTypeId ?? ""),
    roomTypeId: m.RoomTypeID ?? (matched ? (matched.TypeID ?? matched.RecordID) : ""),
    roomType,
    roomLabel: buildRoomLabel(roomNo, roomType, roomId),
    amcAvailable: m.AMCAvailable ?? "",
    amcStartDate: d10(m.AMCStartDate),
    amcEndDate: d10(m.AMCEndDate),
    amcContractNo: m.AMCContractNumber ?? "",
    warrantyAvailable: m.WarrantyAvailable ?? "",
    warrantyExpiryDate: d10(m.WarrantyExpiryDate),
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
  TypeID: form.typeId ? Number(form.typeId) : form.roomTypeId ? Number(form.roomTypeId) : null,
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

const formatCost = (cost, freq) => {
  if (cost === "" || cost === null || cost === undefined) return "—";
  const n = Number(cost);
  const amount = Number.isNaN(n)
    ? cost
    : n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `AED ${amount}${freq ? ` (${freq})` : ""}`;
};

// Next-maintenance status tag: Overdue / Due soon (<=7 days) / Scheduled
const getScheduleStatus = (dateStr) => {
  if (!dateStr) return { label: "Not scheduled", cls: "mt-tag-muted" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / 86400000);
  if (diff < 0) return { label: "Overdue", cls: "mt-tag-red" };
  if (diff <= 7) return { label: "Due soon", cls: "mt-tag-amber" };
  return { label: "Scheduled", cls: "mt-tag-green" };
};

const Maintenance = () => {
  // ── Properties ──
  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const selectedProperty = properties.find((p) => String(p.id) === String(selectedPropertyId)) || null;
  const onSelectProperty = (propertyId) => setSelectedPropertyId(propertyId);

  // ── Room masters (rooms / flats of the property) ──
  const [propertyMasters, setPropertyMasters] = useState([]);
  const [mastersLoading, setMastersLoading] = useState(false);

  // ── Records ──
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ── List UI ──
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterRoom, setFilterRoom] = useState("");
  const [filterAmc, setFilterAmc] = useState("");
  const [filterWarranty, setFilterWarranty] = useState("");

  // ── Form ──
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEditing = form.id !== null;

  // ========================================================
  // LOAD PROPERTIES
  // ========================================================
  const loadProperties = async () => {
    const companyID = getCompanyID();
    if (!companyID) {
      setErrorMessage("CompanyID not found. Please login again.");
      return;
    }
    setPropertiesLoading(true);
    try {
      const response = await api.get("/api/getPropertyInfo", { params: { CompanyID: companyID } });
      const data = response.data;
      if (data?.success) {
        setProperties(Array.isArray(data.data) ? data.data.map(mapApiProperty) : []);
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
  // LOAD ROOM MASTERS
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
      const list = response.data?.success && Array.isArray(response.data.data) ? response.data.data : [];
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

  // ========================================================
  // LOAD MAINTENANCE RECORDS (all rooms of the property)
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
        setRecords(list.map((row) => mapApiMaintenance(row, mastersList)));
      } else {
        setRecords([]);
        setErrorMessage(data?.message || "Failed to load maintenance details.");
      }
    } catch (error) {
      console.error("Load maintenance error:", error);
      setErrorMessage(error?.response?.data?.message || "Failed to load maintenance details.");
    } finally {
      setLoading(false);
    }
  };

  // When property changes: reset UI, load rooms first, then records
  useEffect(() => {
    setShowForm(false);
    setForm(INITIAL_FORM);
    setErrorMessage("");
    setSearchTerm("");
    setFilterRoom("");
    setFilterAmc("");
    setFilterWarranty("");
    if (selectedProperty?.id) {
      (async () => {
        const masters = await loadPropertyMasters(selectedProperty.id);
        await loadMaintenance(selectedProperty.id, masters);
      })();
    } else {
      setRecords([]);
      setPropertyMasters([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProperty?.id]);

  // ========================================================
  // ROOM OPTIONS (for the form dropdown + filter)
  // ========================================================
  const roomOptions = useMemo(() => {
    if (!Array.isArray(propertyMasters) || propertyMasters.length === 0 || !selectedProperty?.id) return [];

    const seen = new Set();
    const options = [];

    propertyMasters
      .filter((item) => String(item.PropertyID) === String(selectedProperty.id))
      .forEach((item) => {
        const roomId = item.RoomID ?? item.RecordID;
        if (!roomId || seen.has(String(roomId))) return;
        seen.add(String(roomId));

        const roomNo = (item.RoomNo ?? item.FlatNo ?? "").toString().trim();
        const typeId = item.TypeID ?? item.RecordID ?? roomId;
        const roomType = (item.RoomType ?? item.FlatType ?? "").toString().trim();

        options.push({ roomId, roomNo, typeId, roomType, label: buildRoomLabel(roomNo, roomType, roomId) });
      });

    return options;
  }, [propertyMasters, selectedProperty?.id]);

  // ========================================================
  // LIST: filtering + KPIs
  // ========================================================
  const sortedRecords = useMemo(
    () =>
      [...records].sort(
        (a, b) =>
          new Date(b.nextScheduledMaintenance || b.lastMaintenanceDate || 0) -
          new Date(a.nextScheduledMaintenance || a.lastMaintenanceDate || 0)
      ),
    [records]
  );

  const filteredRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return sortedRecords.filter((r) => {
      if (filterRoom && String(r.roomId) !== String(filterRoom)) return false;
      if (filterAmc && r.amcAvailable !== filterAmc) return false;
      if (filterWarranty && r.warrantyAvailable !== filterWarranty) return false;
      if (!term) return true;
      return [r.roomLabel, r.roomNo, r.roomType, r.contractorName, r.serviceProvider, r.amcContractNo]
        .filter(Boolean)
        .some((v) => v.toString().toLowerCase().includes(term));
    });
  }, [sortedRecords, searchTerm, filterRoom, filterAmc, filterWarranty]);

  const activeFilterCount = [filterRoom, filterAmc, filterWarranty].filter(Boolean).length;

  const stats = useMemo(() => {
    let overdue = 0;
    let dueSoon = 0;
    let totalCost = 0;
    records.forEach((r) => {
      const s = getScheduleStatus(r.nextScheduledMaintenance).label;
      if (s === "Overdue") overdue++;
      if (s === "Due soon") dueSoon++;
      totalCost += parseFloat(r.maintenanceCost) || 0;
    });
    return { total: records.length, overdue, dueSoon, totalCost };
  }, [records]);

  // ========================================================
  // HANDLERS
  // ========================================================
  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleRoomChange = (e) => {
    const selectedVal = e.target.value;
    if (!selectedVal) {
      setForm((prev) => ({ ...prev, roomId: "", roomNo: "", typeId: "", roomTypeId: "", roomType: "" }));
      return;
    }
    const found = roomOptions.find((r) => String(r.roomId) === String(selectedVal));
    if (found) {
      setForm((prev) => ({
        ...prev,
        roomId: found.roomId,
        roomNo: found.roomNo,
        typeId: found.typeId,
        roomTypeId: found.typeId,
        roomType: found.roomType,
      }));
    }
  };

  const openCreate = () => {
    setForm(INITIAL_FORM);
    setErrorMessage("");
    setShowForm(true);
  };

  const openEdit = (record) => {
    setForm({ ...INITIAL_FORM, ...record });
    setErrorMessage("");
    setShowForm(true);
  };

  const backToList = () => {
    setShowForm(false);
    setForm(INITIAL_FORM);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const companyID = getCompanyID();
    const userID = getUserID();

    if (!companyID) return setErrorMessage("CompanyID not found. Please login again.");
    if (!selectedProperty?.id) return setErrorMessage("Please select a property first.");
    if (!userID) return setErrorMessage("UserID not found. Please login again.");
    if (!form.roomId && !form.roomTypeId) return setErrorMessage("Please select a room / flat.");

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
        backToList();
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
    if (!window.confirm("Are you sure you want to delete this maintenance record?")) return;

    const companyID = getCompanyID();
    const userID = getUserID();

    setDeleting(true);
    setErrorMessage("");
    try {
      const response = await api.post("/api/deletePropertyMaintenance", {
        MaintenanceID: form.id,
        CompanyID: companyID,
        PropertyID: selectedProperty.id,
        UserID: userID,
      });
      const data = response.data;

      if (data?.success) {
        await loadMaintenance(selectedProperty.id);
        backToList();
      } else {
        setErrorMessage(data?.message || "Unable to delete maintenance record.");
      }
    } catch (error) {
      console.error("Error deleting maintenance:", error);
      setErrorMessage(error?.response?.data?.message || "Unable to delete maintenance record.");
    } finally {
      setDeleting(false);
    }
  };

  // ========================================================
  // RENDER
  // ========================================================
  const currentRoomValue = form.roomId || form.roomTypeId || "";
  const currentRoomMissing =
    currentRoomValue && !roomOptions.some((o) => String(o.roomId) === String(currentRoomValue));

  return (
    <div className="mt-root">
      <style>{`
        :root{
          --mt-primary:#10299b;
          --mt-primary-dark:#0b1c6e;
          --mt-primary-mid:#4a5fc1;
          --mt-primary-soft:#eef1fb;
          --mt-primary-tint:#d6ddf5;
          --mt-ink:#1a1f36;
          --mt-muted:#6b7290;
          --mt-green:#1a9e6c;
          --mt-green-soft:#e6f7f0;
          --mt-amber:#c07a00;
          --mt-amber-soft:#fdf3df;
          --mt-red:#dc2626;
          --mt-red-soft:#fdecec;
          --mt-slate-soft:#eef2f6;
        }
        .mt-root{ font-family:"Inter", system-ui, -apple-system, "Segoe UI", sans-serif; color:var(--mt-ink); width:100%; }
        .mt-root *{ box-sizing:border-box; }

        .mt-alert{
          display:flex; align-items:center; gap:10px; background:var(--mt-red-soft); color:var(--mt-red);
          border:1px solid #f5b8b8; border-radius:10px; padding:10px 14px; font-size:.83rem; font-weight:600; margin-bottom:14px;
        }
        .mt-loading{ text-align:center; padding:32px 16px; color:var(--mt-muted); font-size:.85rem; }

        /* context + property list */
        .mt-context-card{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 16px; margin-bottom:16px; border:1px solid var(--mt-primary-tint); border-radius:14px; background:var(--mt-primary-soft); }
        .mt-context-title{ font-size:.78rem; font-weight:700; color:var(--mt-primary-dark); text-transform:uppercase; letter-spacing:.5px; }
        .mt-context-sub{ font-size:.84rem; color:var(--mt-muted); margin-top:3px; }
        .mt-list-card{ background:#fff; border:1px solid var(--mt-primary-tint); border-radius:16px; overflow:hidden; box-shadow:0 4px 18px rgba(16,41,155,.06); }
        .mt-property-item{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 16px; border-bottom:1px solid #f0f2fa; cursor:pointer; }
        .mt-property-item:last-child{ border-bottom:none; }
        .mt-property-item:hover{ background:var(--mt-primary-soft); }
        .mt-property-name{ font-size:.84rem; font-weight:700; color:var(--mt-primary-dark); }
        .mt-property-code{ font-size:.74rem; color:var(--mt-muted); margin-top:3px; }

        /* page header + KPIs */
        .mt-page-header{ margin-bottom:20px; }
        .mt-page-title{ font-size:1.15rem; font-weight:800; color:var(--mt-primary-dark); margin:0 0 3px; }
        .mt-page-sub{ font-size:.85rem; color:var(--mt-muted); margin:0; }
        .mt-kpi-row{ display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin-bottom:24px; }
        .mt-kpi-card{ background:#fff; border:1px solid var(--mt-primary-tint); border-left:4px solid var(--mt-primary); border-radius:12px; padding:16px 20px; box-shadow:0 4px 12px rgba(16,41,155,.03); }
        .mt-kpi-label{ font-size:.72rem; font-weight:700; text-transform:uppercase; color:var(--mt-muted); margin-bottom:6px; letter-spacing:.5px; }
        .mt-kpi-val{ font-size:1.3rem; font-weight:800; color:var(--mt-primary-dark); }

        /* sections */
        .mt-section{ margin-bottom:26px; }
        .mt-section-head{ display:flex; align-items:center; gap:10px; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid var(--mt-primary-tint); }
        .mt-section-icon{ width:34px; height:34px; border-radius:9px; background:var(--mt-primary-soft); color:var(--mt-primary); display:flex; align-items:center; justify-content:center; font-size:.95rem; flex-shrink:0; }
        .mt-section-title{ font-size:.95rem; font-weight:700; color:var(--mt-primary-dark); margin:0; }
        .mt-section-sub{ font-size:.76rem; color:var(--mt-muted); margin-top:1px; }

        /* form fields */
        .mt-grid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(230px, 1fr)); gap:16px 18px; }
        .mt-field{ min-width:0; }
        .mt-field.mt-field-wide{ grid-column:1 / -1; }
        .mt-field label{ display:block; font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.4px; color:var(--mt-primary-mid); margin-bottom:6px; }
        .mt-input, .mt-select, .mt-textarea{
          width:100%; border:1px solid var(--mt-primary-tint); border-radius:9px; padding:9px 12px; font-size:.85rem;
          color:var(--mt-ink); background:#fff; outline:none; font-family:inherit; transition:border-color .15s ease, box-shadow .15s ease;
        }
        .mt-input, .mt-select{ min-height:40px; }
        .mt-textarea{ resize:vertical; min-height:90px; line-height:1.5; }
        .mt-input:focus, .mt-select:focus, .mt-textarea:focus{ border-color:var(--mt-primary); box-shadow:0 0 0 3px rgba(16,41,155,.12); }
        .mt-input:disabled, .mt-select:disabled{ background:var(--mt-primary-soft); color:var(--mt-muted); cursor:not-allowed; }
        .mt-hint{ font-size:.7rem; color:var(--mt-muted); margin-top:4px; }
        .mt-input-prefix-wrap{ position:relative; }
        .mt-input-prefix-wrap span{ position:absolute; left:12px; top:50%; transform:translateY(-50%); font-size:.8rem; color:var(--mt-muted); font-weight:700; }
        .mt-input-prefix-wrap input{ padding-left:42px; }
        .mt-cost-group{ display:flex; gap:8px; }
        .mt-cost-group .mt-input-prefix-wrap{ flex:1; }
        .mt-cost-group .mt-select{ width:140px; flex:0 0 140px; }

        /* toolbar */
        .mt-toolbar{ display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin-bottom:16px; }
        .mt-search-wrap{ position:relative; flex:1; min-width:220px; }
        .mt-search-wrap i{ position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--mt-primary-mid); font-size:.85rem; }
        .mt-search-input{ width:100%; border:1px solid var(--mt-primary-tint); border-radius:9px; padding:9px 12px 9px 34px; font-size:.85rem; background:var(--mt-primary-soft); outline:none; transition:border-color .15s ease, background .15s ease; }
        .mt-search-input:focus{ border-color:var(--mt-primary); background:#fff; }
        .mt-toolbar-btn{ display:flex; align-items:center; gap:7px; border-radius:9px; padding:9px 16px; font-size:.83rem; font-weight:700; white-space:nowrap; border:1.5px solid var(--mt-primary); background:#fff; color:var(--mt-primary); cursor:pointer; transition:all .15s ease; position:relative; }
        .mt-toolbar-btn:hover{ background:var(--mt-primary-soft); }
        .mt-toolbar-btn.mt-btn-solid{ background:var(--mt-primary); color:#fff; }
        .mt-toolbar-btn.mt-btn-solid:hover{ background:var(--mt-primary-dark); }
        .mt-filter-badge{ position:absolute; top:-6px; right:-6px; background:var(--mt-red); color:#fff; width:17px; height:17px; border-radius:50%; font-size:9px; font-weight:700; display:flex; align-items:center; justify-content:center; }

        /* table */
        .mt-table-card{ background:#fff; border:1px solid var(--mt-primary-tint); border-radius:16px; overflow:hidden; box-shadow:0 4px 18px rgba(16,41,155,.06); }
        .mt-table-scroll{ overflow:auto; max-height:60vh; }
        .mt-table{ width:100%; border-collapse:collapse; margin:0; }
        .mt-table thead th{ background:var(--mt-primary-soft); color:var(--mt-primary-dark); font-size:.7rem; font-weight:700; text-transform:uppercase; letter-spacing:.5px; padding:12px 16px; text-align:left; border-bottom:2px solid var(--mt-primary-tint); white-space:nowrap; position:sticky; top:0; }
        .mt-table tbody td{ padding:12px 16px; font-size:.84rem; border-bottom:1px solid #f0f2fa; vertical-align:middle; }
        .mt-table tbody tr{ cursor:pointer; transition:background .15s ease; }
        .mt-table tbody tr:nth-child(even){ background:#f8f9fd; }
        .mt-table tbody tr:hover{ background:var(--mt-primary-soft); }
        .mt-row-name{ font-weight:700; color:var(--mt-ink); }
        .mt-row-sub{ font-size:.74rem; color:var(--mt-muted); margin-top:1px; }
        .mt-tag{ display:inline-block; font-size:.72rem; font-weight:700; padding:3px 10px; border-radius:999px; white-space:nowrap; }
        .mt-tag-green{ background:var(--mt-green-soft); color:var(--mt-green); }
        .mt-tag-amber{ background:var(--mt-amber-soft); color:var(--mt-amber); }
        .mt-tag-red{ background:var(--mt-red-soft); color:var(--mt-red); }
        .mt-tag-muted{ background:var(--mt-slate-soft); color:var(--mt-muted); }
        .mt-empty{ text-align:center; padding:48px 20px; color:var(--mt-muted); }
        .mt-empty i{ font-size:1.9rem; color:var(--mt-primary-tint); margin-bottom:8px; display:block; }
        .mt-empty-title{ font-weight:700; color:var(--mt-primary-dark); font-size:.9rem; }

        /* filter modal */
        .mt-modal-backdrop{ position:fixed; inset:0; z-index:1050; background:rgba(15,20,50,.5); display:flex; align-items:center; justify-content:center; padding:20px; }
        .mt-modal-card{ background:#fff; border-radius:16px; width:100%; max-width:420px; box-shadow:0 20px 50px rgba(16,41,155,.25); overflow:hidden; }
        .mt-modal-head{ display:flex; align-items:center; justify-content:space-between; padding:16px 20px; background:linear-gradient(135deg, var(--mt-primary) 0%, var(--mt-primary-dark) 100%); color:#fff; }
        .mt-modal-head-title{ font-size:.95rem; font-weight:700; margin:0; }
        .mt-modal-close{ border:none; background:rgba(255,255,255,.15); color:#fff; width:26px; height:26px; border-radius:7px; cursor:pointer; }
        .mt-modal-body{ padding:18px 20px; display:flex; flex-direction:column; gap:14px; }
        .mt-modal-footer{ display:flex; justify-content:space-between; gap:10px; padding:14px 20px; border-top:1px solid var(--mt-primary-soft); }

        /* form page */
        .mt-form-header{ display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; gap:12px; flex-wrap:wrap; }
        .mt-form-title{ font-size:1.05rem; font-weight:700; color:var(--mt-primary-dark); margin:0; }
        .mt-back-btn{ display:flex; align-items:center; gap:7px; border:1.5px solid var(--mt-primary); background:#fff; color:var(--mt-primary); border-radius:9px; padding:8px 16px; font-size:.83rem; font-weight:700; cursor:pointer; transition:all .15s ease; }
        .mt-back-btn:hover{ background:var(--mt-primary-soft); }
        .mt-info-strip{ display:flex; align-items:flex-start; gap:10px; padding:11px 13px; margin-bottom:17px; border-radius:9px; background:var(--mt-primary-soft); color:var(--mt-primary-dark); font-size:.75rem; line-height:1.5; }
        .mt-info-strip i{ margin-top:1px; color:var(--mt-primary); }

        .mt-footer{ display:flex; align-items:center; gap:10px; padding-top:18px; border-top:1px solid var(--mt-primary-tint); flex-wrap:wrap; }
        .mt-btn{ border:none; border-radius:10px; padding:10px 20px; font-size:.85rem; font-weight:700; transition:all .15s ease; cursor:pointer; }
        .mt-btn-primary{ background:var(--mt-primary); color:#fff; }
        .mt-btn-primary:hover:not(:disabled){ background:var(--mt-primary-dark); box-shadow:0 4px 10px rgba(16,41,155,.25); }
        .mt-btn-ghost{ background:var(--mt-primary-soft); color:var(--mt-primary); }
        .mt-btn-ghost:hover:not(:disabled){ background:var(--mt-primary-tint); }
        .mt-btn-danger{ background:#fff; color:var(--mt-red); border:1.5px solid #f5b8b8; }
        .mt-btn-danger:hover:not(:disabled){ background:var(--mt-red-soft); }
        .mt-btn:disabled{ opacity:.6; cursor:default; }

        @media (max-width:600px){
          .mt-cost-group{ flex-direction:column; }
          .mt-cost-group .mt-select{ width:100%; flex:1; }
          .mt-footer .mt-btn{ width:100%; }
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
          <button type="button" className="mt-btn mt-btn-ghost" onClick={() => onSelectProperty(null)}>
            Change property
          </button>
        ) : null}
      </div>

      {!selectedProperty ? (
        /* ───────────── 1. PROPERTY LIST ───────────── */
        <div className="mt-list-card">
          {propertiesLoading ? (
            <div className="mt-loading">Loading properties…</div>
          ) : properties.length === 0 ? (
            <div className="mt-loading">No properties found for this company.</div>
          ) : (
            properties.map((property) => (
              <div key={property.id} className="mt-property-item" onClick={() => onSelectProperty(property.id)}>
                <div>
                  <div className="mt-property-name">{property.propertyName || property.propertyCode}</div>
                  <div className="mt-property-code">{property.propertyCode || property.propertyId}</div>
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
      ) : !showForm ? (
        /* ───────────── 2. ROOM-WISE MAINTENANCE LIST ───────────── */
        <>
          <div className="mt-page-header">
            <p className="mt-page-title">Maintenance</p>
            <p className="mt-page-sub">
              Track maintenance schedules, contracts and costs room by room for this property.
            </p>
          </div>

          <div className="mt-kpi-row">
            <div className="mt-kpi-card">
              <div className="mt-kpi-label">Maintenance Records</div>
              <div className="mt-kpi-val">{stats.total}</div>
            </div>
            <div className="mt-kpi-card" style={{ borderLeftColor: "var(--mt-amber)" }}>
              <div className="mt-kpi-label">Due Within 7 Days</div>
              <div className="mt-kpi-val" style={{ color: "var(--mt-amber)" }}>{stats.dueSoon}</div>
            </div>
            <div className="mt-kpi-card" style={{ borderLeftColor: "var(--mt-red)" }}>
              <div className="mt-kpi-label">Overdue</div>
              <div className="mt-kpi-val" style={{ color: "var(--mt-red)" }}>{stats.overdue}</div>
            </div>
            <div className="mt-kpi-card" style={{ borderLeftColor: "var(--mt-green)" }}>
              <div className="mt-kpi-label">Total Maintenance Cost</div>
              <div className="mt-kpi-val" style={{ color: "var(--mt-green)" }}>
                AED {stats.totalCost.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="mt-section">
            <div className="mt-section-head">
              <div className="mt-section-icon"><i className="bi bi-tools"></i></div>
              <div>
                <p className="mt-section-title">Room / Flat Maintenance</p>
                <div className="mt-section-sub">Select a record to update it, or add a new one</div>
              </div>
            </div>

            <div className="mt-toolbar">
              <div className="mt-search-wrap">
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  className="mt-search-input"
                  placeholder="Search room, contractor, provider, AMC number…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button type="button" className="mt-toolbar-btn" onClick={() => setIsFilterOpen(true)}>
                <i className="bi bi-funnel"></i> Filters
                {activeFilterCount > 0 && <span className="mt-filter-badge">{activeFilterCount}</span>}
              </button>
              <button type="button" className="mt-toolbar-btn mt-btn-solid" onClick={openCreate}>
                <i className="bi bi-plus-lg"></i> Add Maintenance
              </button>
            </div>

            <div className="mt-table-card">
              <div className="mt-table-scroll">
                <table className="mt-table">
                  <thead>
                    <tr>
                      <th>Room / Flat</th>
                      <th>Last Maintenance</th>
                      <th>Next Scheduled</th>
                      <th>Status</th>
                      <th>AMC</th>
                      <th>Warranty</th>
                      <th>Contractor / Provider</th>
                      <th>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length === 0 && (
                      <tr>
                        <td colSpan={8}>
                          <div className="mt-empty">
                            <i className="bi bi-calendar-x"></i>
                            <div className="mt-empty-title">No maintenance records found</div>
                            <div>Try adjusting your search or filters, or add a new record.</div>
                          </div>
                        </td>
                      </tr>
                    )}
                    {filteredRecords.map((r) => {
                      const status = getScheduleStatus(r.nextScheduledMaintenance);
                      return (
                        <tr key={r.id} onClick={() => openEdit(r)}>
                          <td>
                            <div className="mt-row-name">
                              {r.roomLabel ? (
                                <>
                                  <i className="bi bi-door-open me-1" style={{ color: "var(--mt-primary-mid)" }}></i>
                                  {r.roomLabel}
                                </>
                              ) : (
                                <span style={{ color: "var(--mt-muted)" }}>—</span>
                              )}
                            </div>
                            <div className="mt-row-sub">Record #{r.id}</div>
                          </td>
                          <td>{r.lastMaintenanceDate || "—"}</td>
                          <td>{r.nextScheduledMaintenance || "—"}</td>
                          <td><span className={`mt-tag ${status.cls}`}>{status.label}</span></td>
                          <td>
                            {r.amcAvailable === "Yes" ? (
                              <span className="mt-tag mt-tag-green">
                                {r.amcContractNo ? `AMC: ${r.amcContractNo}` : "AMC Active"}
                              </span>
                            ) : (
                              <span className="mt-tag mt-tag-muted">No</span>
                            )}
                          </td>
                          <td>
                            {r.warrantyAvailable === "Yes" ? (
                              <span className="mt-tag mt-tag-green">Warranty</span>
                            ) : (
                              <span className="mt-tag mt-tag-muted">No</span>
                            )}
                          </td>
                          <td>{r.contractorName || r.serviceProvider || "—"}</td>
                          <td>{formatCost(r.maintenanceCost, r.costFrequency)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Filter modal */}
          {isFilterOpen && (
            <div className="mt-modal-backdrop" onClick={() => setIsFilterOpen(false)}>
              <div className="mt-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="mt-modal-head">
                  <p className="mt-modal-head-title">Filter Maintenance</p>
                  <button type="button" className="mt-modal-close" onClick={() => setIsFilterOpen(false)}>
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
                <div className="mt-modal-body">
                  <div className="mt-field">
                    <label>Room / Flat</label>
                    <select className="mt-select" value={filterRoom} onChange={(e) => setFilterRoom(e.target.value)}>
                      <option value="">All rooms</option>
                      {roomOptions.map((o) => (
                        <option key={o.roomId} value={o.roomId}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-field">
                    <label>AMC</label>
                    <select className="mt-select" value={filterAmc} onChange={(e) => setFilterAmc(e.target.value)}>
                      <option value="">All</option>
                      {AMC_OPTIONS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-field">
                    <label>Warranty</label>
                    <select className="mt-select" value={filterWarranty} onChange={(e) => setFilterWarranty(e.target.value)}>
                      <option value="">All</option>
                      {WARRANTY_OPTIONS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-modal-footer">
                  <button
                    type="button"
                    className="mt-btn mt-btn-ghost"
                    onClick={() => { setFilterRoom(""); setFilterAmc(""); setFilterWarranty(""); }}
                  >
                    Clear All
                  </button>
                  <button type="button" className="mt-btn mt-btn-primary" onClick={() => setIsFilterOpen(false)}>
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* ───────────── 3. ADD / EDIT FORM ───────────── */
        <>
          <div className="mt-form-header">
            <p className="mt-form-title">{isEditing ? "Edit Maintenance" : "Add Maintenance"}</p>
            <button type="button" className="mt-back-btn" onClick={backToList}>
              <i className="bi bi-arrow-left"></i> Back to Maintenance
            </button>
          </div>

          <form onSubmit={handleSave}>
            {/* Room + schedule */}
            <div className="mt-section">
              <div className="mt-section-head">
                <div className="mt-section-icon"><i className="bi bi-calendar-check"></i></div>
                <div>
                  <p className="mt-section-title">Maintenance Information</p>
                  <div className="mt-section-sub">Choose the room / flat and track previous and upcoming maintenance</div>
                </div>
              </div>

              <div className="mt-grid">
                <div className="mt-field">
                  <label>Selected Property</label>
                  <input
                    type="text"
                    className="mt-input"
                    value={selectedProperty.propertyName || selectedProperty.propertyCode || "Selected Property"}
                    disabled
                  />
                </div>

                <div className="mt-field">
                  <label>Room / Flat</label>
                  <select
                    className="mt-select"
                    value={currentRoomValue}
                    onChange={handleRoomChange}
                    disabled={mastersLoading}
                  >
                    <option value="">
                      {mastersLoading
                        ? "Loading rooms…"
                        : roomOptions.length === 0
                          ? "No rooms found for this property"
                          : "Select Room"}
                    </option>
                    {roomOptions.map((opt) => (
                      <option key={opt.roomId} value={opt.roomId}>{opt.label}</option>
                    ))}
                    {currentRoomMissing && (
                      <option value={currentRoomValue}>
                        {form.roomLabel || buildRoomLabel(form.roomNo, form.roomType, currentRoomValue)}
                      </option>
                    )}
                  </select>
                </div>

                <div className="mt-field">
                  <label>Last Maintenance Date</label>
                  <input type="date" className="mt-input" value={form.lastMaintenanceDate} onChange={handleChange("lastMaintenanceDate")} />
                </div>

                <div className="mt-field">
                  <label>Next Scheduled Maintenance</label>
                  <input type="date" className="mt-input" value={form.nextScheduledMaintenance} onChange={handleChange("nextScheduledMaintenance")} />
                </div>
              </div>
            </div>

            {/* AMC */}
            <div className="mt-section">
              <div className="mt-section-head">
                <div className="mt-section-icon"><i className="bi bi-file-earmark-text"></i></div>
                <div>
                  <p className="mt-section-title">Annual Maintenance Contract (AMC)</p>
                  <div className="mt-section-sub">Manage AMC agreement and validity details</div>
                </div>
              </div>

              <div className="mt-grid">
                <div className="mt-field">
                  <label>AMC Available</label>
                  <select className="mt-select" value={form.amcAvailable} onChange={handleChange("amcAvailable")}>
                    <option value="">Select</option>
                    {AMC_OPTIONS.map((o) => (<option key={o} value={o}>{o}</option>))}
                  </select>
                </div>
                <div className="mt-field">
                  <label>AMC Contract Number</label>
                  <input type="text" className="mt-input" value={form.amcContractNo} onChange={handleChange("amcContractNo")} placeholder="e.g. AMC-2026-001" />
                </div>
                <div className="mt-field">
                  <label>AMC Start Date</label>
                  <input type="date" className="mt-input" value={form.amcStartDate} onChange={handleChange("amcStartDate")} />
                </div>
                <div className="mt-field">
                  <label>AMC End Date</label>
                  <input type="date" className="mt-input" value={form.amcEndDate} onChange={handleChange("amcEndDate")} />
                </div>
              </div>
            </div>

            {/* Warranty */}
            <div className="mt-section">
              <div className="mt-section-head">
                <div className="mt-section-icon"><i className="bi bi-shield-check"></i></div>
                <div>
                  <p className="mt-section-title">Warranty Information</p>
                  <div className="mt-section-sub">Record warranty coverage and expiry</div>
                </div>
              </div>

              <div className="mt-grid">
                <div className="mt-field">
                  <label>Warranty Available</label>
                  <select className="mt-select" value={form.warrantyAvailable} onChange={handleChange("warrantyAvailable")}>
                    <option value="">Select</option>
                    {WARRANTY_OPTIONS.map((o) => (<option key={o} value={o}>{o}</option>))}
                  </select>
                </div>
                <div className="mt-field">
                  <label>Warranty Expiry Date</label>
                  <input type="date" className="mt-input" value={form.warrantyExpiryDate} onChange={handleChange("warrantyExpiryDate")} />
                </div>
                <div className="mt-field mt-field-wide">
                  <label>Warranty Details</label>
                  <textarea className="mt-textarea" value={form.warrantyDetails} onChange={handleChange("warrantyDetails")} placeholder="Enter warranty coverage, equipment details or terms..." />
                </div>
              </div>
            </div>

            {/* Contractor */}
            <div className="mt-section">
              <div className="mt-section-head">
                <div className="mt-section-icon"><i className="bi bi-person-badge"></i></div>
                <div>
                  <p className="mt-section-title">Contractor Details</p>
                  <div className="mt-section-sub">Contact information for the maintenance contractor</div>
                </div>
              </div>

              <div className="mt-grid">
                <div className="mt-field">
                  <label>Contractor Name</label>
                  <input type="text" className="mt-input" value={form.contractorName} onChange={handleChange("contractorName")} placeholder="Enter contractor name" />
                </div>
                <div className="mt-field">
                  <label>Phone Number</label>
                  <input type="tel" className="mt-input" value={form.contractorPhone} onChange={handleChange("contractorPhone")} placeholder="Enter phone number" />
                </div>
                <div className="mt-field">
                  <label>Email Address</label>
                  <input type="email" className="mt-input" value={form.contractorEmail} onChange={handleChange("contractorEmail")} placeholder="contractor@example.com" />
                </div>
                <div className="mt-field">
                  <label>Service Provider</label>
                  <input type="text" className="mt-input" value={form.serviceProvider} onChange={handleChange("serviceProvider")} placeholder="Company / service provider" />
                </div>
                <div className="mt-field">
                  <label>Service Contact</label>
                  <input type="tel" className="mt-input" value={form.serviceContact} onChange={handleChange("serviceContact")} placeholder="Service contact number" />
                </div>
                <div className="mt-field mt-field-wide">
                  <label>Contractor Address</label>
                  <textarea className="mt-textarea" value={form.contractorAddress} onChange={handleChange("contractorAddress")} placeholder="Enter contractor address..." />
                </div>
              </div>
            </div>

            {/* Cost */}
            <div className="mt-section">
              <div className="mt-section-head">
                <div className="mt-section-icon"><i className="bi bi-cash-coin"></i></div>
                <div>
                  <p className="mt-section-title">Maintenance Cost</p>
                  <div className="mt-section-sub">Record recurring maintenance expenses</div>
                </div>
              </div>

              <div className="mt-grid">
                <div className="mt-field">
                  <label>Maintenance Cost</label>
                  <div className="mt-cost-group">
                    <div className="mt-input-prefix-wrap">
                      <span>AED</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="mt-input"
                        value={form.maintenanceCost}
                        onChange={handleChange("maintenanceCost")}
                        placeholder="0.00"
                      />
                    </div>
                    <select className="mt-select" value={form.costFrequency} onChange={handleChange("costFrequency")}>
                      <option value="">Frequency</option>
                      {COST_FREQUENCIES.map((f) => (<option key={f} value={f}>{f}</option>))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Repair history */}
            <div className="mt-section">
              <div className="mt-section-head">
                <div className="mt-section-icon"><i className="bi bi-wrench-adjustable"></i></div>
                <div>
                  <p className="mt-section-title">Repair History</p>
                  <div className="mt-section-sub">Record previous repairs and maintenance work</div>
                </div>
              </div>
              <div className="mt-field">
                <textarea className="mt-textarea" value={form.repairHistory} onChange={handleChange("repairHistory")} placeholder="Enter repair details, dates, work performed and associated costs..." />
              </div>
            </div>

            {/* Inspection reports */}
            <div className="mt-section">
              <div className="mt-section-head">
                <div className="mt-section-icon"><i className="bi bi-clipboard2-check"></i></div>
                <div>
                  <p className="mt-section-title">Inspection Reports</p>
                  <div className="mt-section-sub">Record inspection findings and report references</div>
                </div>
              </div>
              <div className="mt-info-strip">
                <i className="bi bi-info-circle-fill"></i>
                <span>
                  Add inspection dates, findings, safety observations, report numbers or other relevant inspection information.
                </span>
              </div>
              <div className="mt-field">
                <textarea className="mt-textarea" value={form.inspectionReports} onChange={handleChange("inspectionReports")} placeholder="Enter inspection report details..." />
              </div>
            </div>

            <div className="mt-footer">
              <button type="submit" className="mt-btn mt-btn-primary" disabled={saving || deleting}>
                <i className={`bi ${saving ? "bi-hourglass-split" : "bi-check2-circle"} me-2`}></i>
                {saving ? "Saving…" : isEditing ? "Update Maintenance" : "Save Maintenance"}
              </button>
              {isEditing && (
                <button type="button" className="mt-btn mt-btn-danger" onClick={handleDelete} disabled={deleting || saving}>
                  <i className={`bi ${deleting ? "bi-hourglass-split" : "bi-trash3"} me-2`}></i>
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              )}
              <button type="button" className="mt-btn mt-btn-ghost" onClick={backToList} disabled={saving || deleting}>
                Cancel
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default Maintenance;
