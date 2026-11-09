// import  { useEffect, useMemo, useState } from "react";
// import api from "../../apiService";

// const RECORD_TYPES = ["Occupancy", "Vacancy"];
// const INSPECTION_STATUSES = ["Pending", "Scheduled", "Completed", "Failed", "Not Required"];
// const KEY_HANDOVER_STATUSES = ["Not Handed Over", "Handed Over", "Returned", "Pending"];

// const INITIAL_FORM = {
//     id: null, // OccupancyID — null on create
//     recordId: "", // PropertyMaster.RecordID
//     recordType: "Occupancy",
//     tenantName: "",
//     checkInDate: "",
//     checkOutDate: "",
//     inspectionStatus: "",
//     keyHandoverStatus: "",
//     accessCardDetails: "",
//     notes: "",
// };

// // ── session helpers ──
// const getCompanyID = () => Number(sessionStorage.getItem("CompanyID")) || 0;
// const getUserID = () => Number(sessionStorage.getItem("UserId")) || 0;

// // NOTE: adjust the right-hand-side field names if your getPropertyInformation
// // response uses different casing than assumed here.
// const mapApiProperty = (p) => ({
//     id: p.PropertyID ?? p.propertyId ?? p.id,
//     propertyId: p.PropertyID ?? p.propertyId ?? p.id,
//     propertyName: p.PropertyName ?? p.propertyName ?? "",
//     propertyCode: p.PropertyCode ?? p.propertyCode ?? "",
// });

// const mapApiPropertyMaster = (p) => ({
//     recordId: p.RecordID ?? p.recordID ?? p.recordId ?? p.id,
//     flatNo: p.FlatNo ?? p.flatNo ?? "",
//     flatType: p.FlatType ?? p.flatType ?? "",
// });

// // WebGetPropertyOccupancy recordset -> form shape. Column names mirror the
// // @Param names used in insertUpdatePropertyOccupancy.
// const mapApiOccupancy = (r) => ({
//     id: r.OccupancyID,
//     recordId: r.RecordID ?? r.recordID ?? r.recordId ?? "",
//     recordType: r.RecordType || "Occupancy",
//     tenantName: r.TenantName ?? "",
//     checkInDate: (r.CheckInDate ?? "").toString().slice(0, 10),
//     checkOutDate: (r.CheckOutDate ?? "").toString().slice(0, 10),
//     inspectionStatus: r.InspectionStatus ?? "",
//     keyHandoverStatus: r.KeyHandoverStatus ?? "",
//     accessCardDetails: r.AccessCardDetails ?? "",
//     notes: r.Notes ?? "",
// });

// // form shape -> insertUpdatePropertyOccupancy request body
// const mapFormToApiPayload = (form, { companyId, propertyId, userId }) => ({
//     OccupancyID: form.id || 0,
//     PropertyID: propertyId,
//     RecordID: Number(form.recordId),
//     CompanyID: companyId,
//     RecordType: form.recordType,
//     TenantName: form.recordType === "Occupancy" ? form.tenantName : "",
//     CheckInDate: form.checkInDate || null,
//     CheckOutDate: form.checkOutDate || null,
//     InspectionStatus: form.inspectionStatus,
//     KeyHandoverStatus: form.keyHandoverStatus,
//     AccessCardDetails: form.accessCardDetails,
//     Notes: form.notes,
//     CreatedBy: form.id ? undefined : userId,
//     ModifiedBy: userId,
//     Action: form.id ? "UPDATE" : "INSERT",
// });

// const dayDiff = (start, end) => {
//     if (!start) return "";
//     const s = new Date(start);
//     const e = end ? new Date(end) : new Date();
//     const days = Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
//     if (days < 30) return `${days} day${days === 1 ? "" : "s"}`;
//     if (days < 365) return `${Math.round(days / 30)} mo`;
//     return `${(days / 365).toFixed(1)} yr`;
// };

// const inspectionTagClass = (status) => {
//     switch (status) {
//         case "Completed": return "occ-tag-green";
//         case "Scheduled": return "occ-tag-blue";
//         case "Pending": return "occ-tag-amber";
//         case "Failed": return "occ-tag-red";
//         default: return "occ-tag-muted";
//     }
// };

// const handoverTagClass = (status) => {
//     switch (status) {
//         case "Handed Over": return "occ-tag-green";
//         case "Returned": return "occ-tag-blue";
//         case "Pending": return "occ-tag-amber";
//         case "Not Handed Over": return "occ-tag-muted";
//         default: return "occ-tag-muted";
//     }
// };

// const Occupancy = () => {
//     // ── Real property list ──
//     const [properties, setProperties] = useState([]);
//     const [propertiesLoading, setPropertiesLoading] = useState(false);
//     const [selectedPropertyId, setSelectedPropertyId] = useState(null);
//     const [propertyMasters, setPropertyMasters] = useState([]);
//     const [mastersLoading, setMastersLoading] = useState(false);
//     const selectedProperty = properties.find((p) => String(p.id) === String(selectedPropertyId)) || null;
//     const onSelectProperty = (propertyId) => setSelectedPropertyId(propertyId);

//     const [loading, setLoading] = useState(false);
//     const [errorMessage, setErrorMessage] = useState("");

//     // ── List state ──
//     const [records, setRecords] = useState([]);
//     const [showForm, setShowForm] = useState(false);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [isFilterOpen, setIsFilterOpen] = useState(false);
//     const [filterType, setFilterType] = useState("");
//     const [filterInspection, setFilterInspection] = useState("");
//     const [filterHandover, setFilterHandover] = useState("");

//     // ── Form state ──
//     const [form, setForm] = useState(INITIAL_FORM);
//     const [saving, setSaving] = useState(false);
//     const [deleting, setDeleting] = useState(false);

//     const isEditing = form.id !== null;

//     const currentTenant = useMemo(
//         () => records.find((r) => r.recordType === "Occupancy" && !r.checkOutDate),
//         [records]
//     );

//     const sortedRecords = useMemo(
//         () => [...records].sort((a, b) => new Date(b.checkInDate || 0) - new Date(a.checkInDate || 0)),
//         [records]
//     );

//     const filteredRecords = useMemo(() => {
//         const term = searchTerm.trim().toLowerCase();
//         return sortedRecords.filter((r) => {
//             if (filterType && r.recordType !== filterType) return false;
//             if (filterInspection && r.inspectionStatus !== filterInspection) return false;
//             if (filterHandover && r.keyHandoverStatus !== filterHandover) return false;
//             if (!term) return true;
//             return [r.tenantName, r.recordType, r.accessCardDetails]
//                 .filter(Boolean)
//                 .some((v) => v.toLowerCase().includes(term));
//         });
//     }, [sortedRecords, searchTerm, filterType, filterInspection, filterHandover]);

//     const activeFilterCount = [filterType, filterInspection, filterHandover].filter(Boolean).length;


//     const loadProperties = async () => {
//         const companyID = getCompanyID();
//         if (!companyID) {
//             setErrorMessage("CompanyID not found. Please login again.");
//             return;
//         }
//         setPropertiesLoading(true);
//         try {
//             const response = await api.get("/api/getPropertyInfo", {
//                 params: { CompanyID: companyID },
//             });
//             const data = response.data;
//             if (data?.success) {
//                 const list = Array.isArray(data.data) ? data.data.map(mapApiProperty) : [];
//                 setProperties(list);
//             } else {
//                 setProperties([]);
//                 setErrorMessage(data?.message || "Failed to load properties.");
//             }
//         } catch (error) {
//             console.error("Load property error:", error);
//             setErrorMessage(error?.response?.data?.message || "Failed to load properties.");
//         } finally {
//             setPropertiesLoading(false);
//         }
//     };

//     const loadPropertyMasters = async (propertyId) => {
//         const companyID = getCompanyID();
//         if (!companyID || !propertyId) {
//             setPropertyMasters([]);
//             return;
//         }

//         setMastersLoading(true);
//         try {
//             const response = await api.get("/api/getPropertyMaster", {
//                 params: { CompanyID: companyID, PropertyID: propertyId },
//             });
//             const data = response.data;
//             if (data?.success) {
//                 setPropertyMasters(Array.isArray(data.data) ? data.data.map(mapApiPropertyMaster) : []);
//             } else {
//                 setPropertyMasters([]);
//                 setErrorMessage(data?.message || "Failed to load property master.");
//             }
//         } catch (error) {
//             console.error("Load PropertyMaster error:", error);
//             setPropertyMasters([]);
//             setErrorMessage(error?.response?.data?.message || "Failed to load property master.");
//         } finally {
//             setMastersLoading(false);
//         }
//     };

//     useEffect(() => {
//         loadProperties();
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, []);

 
//     const loadOccupancy = async (propertyId) => {
//         const companyID = getCompanyID();
//         if (!companyID || !propertyId) return;

//         setLoading(true);
//         setErrorMessage("");
//         try {
//             const response = await api.get("/api/getPropertyOccupancy", {
//                 params: { PropertyID: propertyId, CompanyID: companyID },
//             });
//             const data = response.data;
//             if (data?.success) {
//                 const list = Array.isArray(data.data) ? data.data.map(mapApiOccupancy) : [];
//                 setRecords(list);
//             } else {
//                 setErrorMessage(data?.message || "Failed to load occupancy records.");
//             }
//         } catch (error) {
//             console.error("Load occupancy error:", error);
//             setErrorMessage(error?.response?.data?.message || "Failed to load occupancy records.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         setShowForm(false);
//         setForm(INITIAL_FORM);
//         setPropertyMasters([]);
//         setErrorMessage("");
//         if (selectedProperty?.id) {
//             loadPropertyMasters(selectedProperty.id);
//             loadOccupancy(selectedProperty.id);
//         } else {
//             setRecords([]);
//         }
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [selectedProperty?.id]);

//     // ── Handlers ──
//     const handleChange = (field) => (e) => {
//         setForm((prev) => ({ ...prev, [field]: e.target.value }));
//     };

//     const openCreate = () => {
//         setForm(INITIAL_FORM);
//         setShowForm(true);
//     };

//     const openEdit = (record) => {
//         setForm(record);
//         setShowForm(true);
//     };

//     const backToList = () => {
//         setShowForm(false);
//         setForm(INITIAL_FORM);
//     };

//     const handleSave = async (e) => {
//         e.preventDefault();

//         const companyID = getCompanyID();
//         const userID = getUserID();

//         if (!companyID) {
//             setErrorMessage("CompanyID not found. Please login again.");
//             return;
//         }
//         if (!selectedProperty?.id) {
//             setErrorMessage("Please select a property first.");
//             return;
//         }
//         if (!form.recordId) {
//             setErrorMessage("Please select a unit / Property Master record.");
//             return;
//         }

//         setSaving(true);
//         setErrorMessage("");
//         try {
//             const payload = mapFormToApiPayload(form, {
//                 companyId: companyID,
//                 propertyId: selectedProperty.id,
//                 userId: userID,
//             });
//             const response = await api.post("/api/insertUpdatePropertyOccupancy", payload);
//             const data = response.data;

//             if (data?.success) {
//                 await loadOccupancy(selectedProperty.id);
//                 backToList();
//             } else {
//                 setErrorMessage(data?.message || "Unable to save occupancy record.");
//             }
//         } catch (error) {
//             console.error("Error saving occupancy record:", error);
//             setErrorMessage(error?.response?.data?.message || "Unable to save occupancy record.");
//         } finally {
//             setSaving(false);
//         }
//     };

//     const handleDelete = async () => {
//         if (!isEditing || !selectedProperty?.id) return;

//         const companyID = getCompanyID();
//         const userID = getUserID();

//         setDeleting(true);
//         setErrorMessage("");
//         try {
//             const response = await api.delete("/api/deletePropertyOccupancy", {
//                 data: {
//                     OccupancyID: form.id,
//                     PropertyID: selectedProperty.id,
//                     CompanyID: companyID,
//                     ModifiedBy: userID,
//                 },
//             });
//             const data = response.data;

//             if (data?.success) {
//                 await loadOccupancy(selectedProperty.id);
//                 backToList();
//             } else {
//                 setErrorMessage(data?.message || "Unable to delete occupancy record.");
//             }
//         } catch (error) {
//             console.error("Error deleting occupancy record:", error);
//             setErrorMessage(error?.response?.data?.message || "Unable to delete occupancy record.");
//         } finally {
//             setDeleting(false);
//         }
//     };

//     return (
//         <div className="occ-root">
//             <style>{`
//         :root{
//           --occ-primary:#10299b;
//           --occ-primary-dark:#0b1c6e;
//           --occ-primary-mid:#4a5fc1;
//           --occ-primary-soft:#eef1fb;
//           --occ-primary-tint:#d6ddf5;
//           --occ-ink:#1a1f36;
//           --occ-muted:#6b7290;
//           --occ-green:#1a9e6c;
//           --occ-green-soft:#e6f7f0;
//           --occ-blue:#0f6fb0;
//           --occ-blue-soft:#e5f3fb;
//           --occ-amber:#c07a00;
//           --occ-amber-soft:#fdf3df;
//           --occ-red:#dc2626;
//           --occ-red-soft:#fdecec;
//           --occ-slate:#475569;
//           --occ-slate-soft:#eef2f6;
//         }
//         .occ-root{
//           font-family:"Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
//           color:var(--occ-ink);
//         }
//         .occ-root *{ box-sizing:border-box; }

//         .occ-alert{
//           display:flex; align-items:center; gap:10px;
//           background:var(--occ-red-soft); color:var(--occ-red);
//           border:1px solid #f5b8b8; border-radius:10px;
//           padding:10px 14px; font-size:.83rem; font-weight:600;
//           margin-bottom:14px;
//         }
//         .occ-loading{ text-align:center; padding:32px 16px; color:var(--occ-muted); font-size:.85rem; }

//         /* ---------- Page header ---------- */
//         .occ-page-header{ margin-bottom:18px; }
//         .occ-page-title{ font-size:1.15rem; font-weight:800; color:var(--occ-primary-dark); margin:0 0 3px; }
//         .occ-page-sub{ font-size:.85rem; color:var(--occ-muted); margin:0; }

//         /* ---------- Property selection ---------- */
//         .occ-context-card{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 16px; margin-bottom:16px; border:1px solid var(--occ-primary-tint); border-radius:14px; background:var(--occ-primary-soft); }
//         .occ-context-title{ font-size:.78rem; font-weight:700; color:var(--occ-primary-dark); text-transform:uppercase; letter-spacing:.5px; }
//         .occ-context-sub{ font-size:.84rem; color:var(--occ-muted); margin-top:3px; }
//         .occ-list-card{
//           background:#fff; border:1px solid var(--occ-primary-tint); border-radius:16px;
//           overflow:hidden; box-shadow:0 4px 18px rgba(16,41,155,.06);
//         }
//         .occ-property-item{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 16px; border-bottom:1px solid #f0f2fa; cursor:pointer; }
//         .occ-property-item:last-child{ border-bottom:none; }
//         .occ-property-name{ font-size:.84rem; font-weight:700; color:var(--occ-primary-dark); }
//         .occ-property-code{ font-size:.74rem; color:var(--occ-muted); margin-top:3px; }

//         /* ---------- Current tenant panel ---------- */
//         .occ-current-card{
//           display:flex; align-items:center; gap:16px; flex-wrap:wrap;
//           background:linear-gradient(135deg, var(--occ-primary) 0%, var(--occ-primary-dark) 100%);
//           color:#fff; border-radius:16px; padding:18px 22px; margin-bottom:18px;
//         }
//         .occ-current-avatar{
//           width:48px; height:48px; border-radius:12px; background:rgba(255,255,255,.15);
//           display:flex; align-items:center; justify-content:center; font-size:1.3rem; flex-shrink:0;
//         }
//         .occ-current-info{ flex:1; min-width:180px; }
//         .occ-current-label{ font-size:.7rem; font-weight:700; text-transform:uppercase; letter-spacing:.5px; opacity:.75; margin-bottom:2px; }
//         .occ-current-name{ font-size:1.05rem; font-weight:800; }
//         .occ-current-since{ font-size:.78rem; opacity:.85; margin-top:1px; }
//         .occ-current-stats{ display:flex; gap:22px; flex-wrap:wrap; }
//         .occ-current-stat-label{ font-size:.68rem; text-transform:uppercase; letter-spacing:.4px; opacity:.75; margin-bottom:3px; }
//         .occ-current-stat-value{ font-size:.85rem; font-weight:700; }
//         .occ-current-empty{
//           display:flex; align-items:center; gap:16px;
//           background:var(--occ-slate-soft); color:var(--occ-slate);
//           border-radius:16px; padding:18px 22px; margin-bottom:18px;
//         }
//         .occ-current-empty i{ font-size:1.5rem; }

//         /* ---------- Toolbar ---------- */
//         .occ-toolbar{ display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin-bottom:16px; }
//         .occ-search-wrap{ position:relative; flex:1; min-width:220px; }
//         .occ-search-wrap i{
//           position:absolute; left:12px; top:50%; transform:translateY(-50%);
//           color:var(--occ-primary-mid); font-size:.85rem;
//         }
//         .occ-search-input{
//           width:100%; border:1px solid var(--occ-primary-tint); border-radius:9px;
//           padding:9px 12px 9px 34px; font-size:.85rem; background:var(--occ-primary-soft);
//           outline:none; transition:border-color .15s ease, background .15s ease;
//         }
//         .occ-search-input:focus{ border-color:var(--occ-primary); background:#fff; }

//         .occ-toolbar-btn{
//           display:flex; align-items:center; gap:7px;
//           border-radius:9px; padding:9px 16px; font-size:.83rem; font-weight:700; white-space:nowrap;
//           border:1.5px solid var(--occ-primary); background:#fff; color:var(--occ-primary);
//           cursor:pointer; transition:all .15s ease; position:relative;
//         }
//         .occ-toolbar-btn:hover{ background:var(--occ-primary-soft); }
//         .occ-toolbar-btn.occ-btn-solid{ background:var(--occ-primary); color:#fff; }
//         .occ-toolbar-btn.occ-btn-solid:hover{ background:var(--occ-primary-dark); }
//         .occ-filter-badge{
//           position:absolute; top:-6px; right:-6px; background:var(--occ-red); color:#fff;
//           width:17px; height:17px; border-radius:50%; font-size:9px; font-weight:700;
//           display:flex; align-items:center; justify-content:center;
//         }

//         /* ---------- Table ---------- */
//         .occ-table-card{
//           background:#fff; border:1px solid var(--occ-primary-tint); border-radius:16px;
//           overflow:hidden; box-shadow:0 4px 18px rgba(16,41,155,.06);
//         }
//         .occ-table{ width:100%; border-collapse:collapse; margin:0; }
//         .occ-table thead th{
//           background:var(--occ-primary-soft); color:var(--occ-primary-dark);
//           font-size:.7rem; font-weight:700; text-transform:uppercase; letter-spacing:.5px;
//           padding:12px 16px; text-align:left; border-bottom:2px solid var(--occ-primary-tint); white-space:nowrap;
//         }
//         .occ-table tbody td{ padding:12px 16px; font-size:.84rem; border-bottom:1px solid #f0f2fa; vertical-align:middle; }
//         .occ-table tbody tr{ cursor:pointer; transition:background .15s ease; }
//         .occ-table tbody tr:nth-child(even){ background:#f8f9fd; }
//         .occ-table tbody tr:hover{ background:var(--occ-primary-soft); }
//         .occ-row-name{ font-weight:700; color:var(--occ-ink); }
//         .occ-row-sub{ font-size:.74rem; color:var(--occ-muted); margin-top:1px; }
//         .occ-tag{ display:inline-block; font-size:.72rem; font-weight:700; padding:3px 10px; border-radius:999px; }
//         .occ-tag-type-occupancy{ background:var(--occ-primary-soft); color:var(--occ-primary-mid); }
//         .occ-tag-type-vacancy{ background:var(--occ-slate-soft); color:var(--occ-slate); }
//         .occ-tag-green{ background:var(--occ-green-soft); color:var(--occ-green); }
//         .occ-tag-blue{ background:var(--occ-blue-soft); color:var(--occ-blue); }
//         .occ-tag-amber{ background:var(--occ-amber-soft); color:var(--occ-amber); }
//         .occ-tag-red{ background:var(--occ-red-soft); color:var(--occ-red); }
//         .occ-tag-muted{ background:var(--occ-slate-soft); color:var(--occ-muted); }
//         .occ-empty{ text-align:center; padding:48px 20px; color:var(--occ-muted); }
//         .occ-empty i{ font-size:1.9rem; color:var(--occ-primary-tint); margin-bottom:8px; display:block; }
//         .occ-empty-title{ font-weight:700; color:var(--occ-primary-dark); font-size:.9rem; }

//         /* ---------- Filter modal ---------- */
//         .occ-modal-backdrop{
//           position:fixed; inset:0; z-index:1050; background:rgba(15,20,50,.5);
//           display:flex; align-items:center; justify-content:center; padding:20px;
//         }
//         .occ-modal-card{
//           background:#fff; border-radius:16px; width:100%; max-width:420px;
//           box-shadow:0 20px 50px rgba(16,41,155,.25); overflow:hidden;
//         }
//         .occ-modal-head{
//           display:flex; align-items:center; justify-content:space-between; padding:16px 20px;
//           background:linear-gradient(135deg, var(--occ-primary) 0%, var(--occ-primary-dark) 100%); color:#fff;
//         }
//         .occ-modal-head-title{ font-size:.95rem; font-weight:700; margin:0; }
//         .occ-modal-close{
//           border:none; background:rgba(255,255,255,.15); color:#fff;
//           width:26px; height:26px; border-radius:7px; cursor:pointer;
//         }
//         .occ-modal-body{ padding:18px 20px; display:flex; flex-direction:column; gap:14px; }
//         .occ-modal-footer{ display:flex; justify-content:space-between; gap:10px; padding:14px 20px; border-top:1px solid var(--occ-primary-soft); }

//         /* ---------- Form ---------- */
//         .occ-form-header{ display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; gap:12px; flex-wrap:wrap; }
//         .occ-form-title{ font-size:1.05rem; font-weight:700; color:var(--occ-primary-dark); margin:0; }
//         .occ-back-btn{
//           display:flex; align-items:center; gap:7px;
//           border:1.5px solid var(--occ-primary); background:#fff; color:var(--occ-primary);
//           border-radius:9px; padding:8px 16px; font-size:.83rem; font-weight:700; cursor:pointer; transition:all .15s ease;
//         }
//         .occ-back-btn:hover{ background:var(--occ-primary-soft); }

//         .occ-section{ margin-bottom:26px; }
//         .occ-section-head{
//           display:flex; align-items:center; gap:10px; margin-bottom:16px; padding-bottom:12px;
//           border-bottom:1px solid var(--occ-primary-tint);
//         }
//         .occ-section-icon{
//           width:34px; height:34px; border-radius:9px; background:var(--occ-primary-soft); color:var(--occ-primary);
//           display:flex; align-items:center; justify-content:center; font-size:.95rem; flex-shrink:0;
//         }
//         .occ-section-title{ font-size:.95rem; font-weight:700; color:var(--occ-primary-dark); margin:0; }
//         .occ-section-sub{ font-size:.76rem; color:var(--occ-muted); margin-top:1px; }

//         .occ-grid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(230px, 1fr)); gap:16px 18px; }
//         .occ-field.occ-field-wide{ grid-column:1 / -1; }
//         .occ-field label{
//           display:block; font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.4px;
//           color:var(--occ-primary-mid); margin-bottom:6px;
//         }
//         .occ-input, .occ-select, .occ-textarea{
//           width:100%; border:1px solid var(--occ-primary-tint); border-radius:9px; padding:9px 12px;
//           font-size:.85rem; color:var(--occ-ink); background:#fff; outline:none; font-family:inherit;
//           transition:border-color .15s ease, box-shadow .15s ease;
//         }
//         .occ-textarea{ resize:vertical; min-height:80px; }
//         .occ-input:focus, .occ-select:focus, .occ-textarea:focus{
//           border-color:var(--occ-primary); box-shadow:0 0 0 3px rgba(16,41,155,.12);
//         }
//         .occ-input:disabled{ background:var(--occ-primary-soft); color:var(--occ-muted); cursor:not-allowed; }
//         .occ-hint{ font-size:.7rem; color:var(--occ-muted); margin-top:4px; }

//         .occ-footer{
//           display:flex; align-items:center; gap:10px; padding-top:18px;
//           border-top:1px solid var(--occ-primary-tint); flex-wrap:wrap;
//         }
//         .occ-btn{ border:none; border-radius:10px; padding:10px 20px; font-size:.85rem; font-weight:700; transition:all .15s ease; cursor:pointer; }
//         .occ-btn-primary{ background:var(--occ-primary); color:#fff; }
//         .occ-btn-primary:hover:not(:disabled){ background:var(--occ-primary-dark); box-shadow:0 4px 10px rgba(16,41,155,.25); }
//         .occ-btn-primary:disabled{ opacity:.6; cursor:default; }
//         .occ-btn-ghost{ background:var(--occ-primary-soft); color:var(--occ-primary); }
//         .occ-btn-ghost:hover{ background:var(--occ-primary-tint); }
//         .occ-btn-danger{ background:#fff; color:var(--occ-red); border:1.5px solid #f5b8b8; }
//         .occ-btn-danger:hover:not(:disabled){ background:var(--occ-red-soft); }
//         .occ-btn-danger:disabled{ opacity:.6; cursor:default; }
//       `}</style>

//             {errorMessage && (
//                 <div className="occ-alert">
//                     <i className="bi bi-exclamation-triangle"></i>
//                     {errorMessage}
//                 </div>
//             )}

//             <div className="occ-context-card">
//                 <div>
//                     <div className="occ-context-title">Selected property</div>
//                     <div className="occ-context-sub">{selectedProperty ? `${selectedProperty.propertyName || selectedProperty.propertyCode || "Selected property"}` : "Choose a property from the list to continue"}</div>
//                 </div>
//                 {selectedProperty ? (
//                     <button type="button" className="occ-btn occ-btn-ghost" onClick={() => onSelectProperty(null)}>
//                         Change property
//                     </button>
//                 ) : null}
//             </div>

//             {!selectedProperty ? (
//                 <div className="occ-list-card">
//                     {propertiesLoading ? (
//                         <div className="occ-loading">Loading properties…</div>
//                     ) : properties.length === 0 ? (
//                         <div className="occ-loading">No properties found for this company.</div>
//                     ) : (
//                         properties.map((property) => (
//                             <div key={property.id} className="occ-property-item" onClick={() => onSelectProperty(property.id)}>
//                                 <div>
//                                     <div className="occ-property-name">{property.propertyName || property.propertyCode}</div>
//                                     <div className="occ-property-code">{property.propertyCode || property.propertyId}</div>
//                                 </div>
//                                 <i className="bi bi-chevron-right" style={{ color: "var(--occ-primary)" }}></i>
//                             </div>
//                         ))
//                     )}
//                 </div>
//             ) : loading ? (
//                 <div className="occ-list-card">
//                     <div className="occ-loading">Loading occupancy records…</div>
//                 </div>
//             ) : !showForm ? (
//                 <>
//                     <div className="occ-page-header">
//                         <p className="occ-page-title">Occupancy Management</p>
//                         <p className="occ-page-sub">Track current and past tenants, vacancy periods, and move-in/move-out handover details.</p>
//                     </div>

//                     {/* Current tenant summary */}
//                     {currentTenant ? (
//                         <div className="occ-current-card">
//                             <div className="occ-current-avatar"><i className="bi bi-person-check"></i></div>
//                             <div className="occ-current-info">
//                                 <div className="occ-current-label">Current Tenant</div>
//                                 <div className="occ-current-name">{currentTenant.tenantName}</div>
//                                 <div className="occ-current-since">Since {currentTenant.checkInDate} • {dayDiff(currentTenant.checkInDate)} in residence</div>
//                             </div>
//                             <div className="occ-current-stats">
//                                 <div>
//                                     <div className="occ-current-stat-label">Inspection</div>
//                                     <div className="occ-current-stat-value">{currentTenant.inspectionStatus || "—"}</div>
//                                 </div>
//                                 <div>
//                                     <div className="occ-current-stat-label">Key Handover</div>
//                                     <div className="occ-current-stat-value">{currentTenant.keyHandoverStatus || "—"}</div>
//                                 </div>
//                                 <div>
//                                     <div className="occ-current-stat-label">Access Card</div>
//                                     <div className="occ-current-stat-value">{currentTenant.accessCardDetails || "—"}</div>
//                                 </div>
//                             </div>
//                         </div>
//                     ) : (
//                         <div className="occ-current-empty">
//                             <i className="bi bi-house-x"></i>
//                             <div>
//                                 <div style={{ fontWeight: 700, fontSize: ".9rem" }}>Currently Vacant</div>
//                                 <div style={{ fontSize: ".78rem" }}>No active tenant on record for this property.</div>
//                             </div>
//                         </div>
//                     )}

//                     {/* Toolbar */}
//                     <div className="occ-toolbar">
//                         <div className="occ-search-wrap">
//                             <i className="bi bi-search"></i>
//                             <input
//                                 type="text"
//                                 className="occ-search-input"
//                                 placeholder="Search tenant, access card…"
//                                 value={searchTerm}
//                                 onChange={(e) => setSearchTerm(e.target.value)}
//                             />
//                         </div>
//                         <button type="button" className="occ-toolbar-btn" onClick={() => setIsFilterOpen(true)}>
//                             <i className="bi bi-funnel"></i> Filters
//                             {activeFilterCount > 0 && <span className="occ-filter-badge">{activeFilterCount}</span>}
//                         </button>
//                         <button type="button" className="occ-toolbar-btn occ-btn-solid" onClick={openCreate}>
//                             <i className="bi bi-plus-lg"></i> Add Record
//                         </button>
//                     </div>

//                     {/* Table */}
//                     <div className="occ-table-card">
//                         <div className="table-responsive" style={{ maxHeight: "60vh" }}>
//                             <table className="occ-table">
//                                 <thead>
//                                     <tr>
//                                         <th>Type</th>
//                                         <th>Tenant</th>
//                                         <th>Check-in</th>
//                                         <th>Check-out</th>
//                                         <th>Duration</th>
//                                         <th>Inspection</th>
//                                         <th>Key Handover</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {filteredRecords.length === 0 && (
//                                         <tr>
//                                             <td colSpan={7}>
//                                                 <div className="occ-empty">
//                                                     <i className="bi bi-clock-history"></i>
//                                                     <div className="occ-empty-title">No occupancy records found</div>
//                                                     <div>Try adjusting your search or filters, or add a new record.</div>
//                                                 </div>
//                                             </td>
//                                         </tr>
//                                     )}
//                                     {filteredRecords.map((r) => (
//                                         <tr key={r.id} onClick={() => openEdit(r)}>
//                                             <td>
//                                                 <span className={`occ-tag ${r.recordType === "Occupancy" ? "occ-tag-type-occupancy" : "occ-tag-type-vacancy"}`}>
//                                                     {r.recordType}
//                                                 </span>
//                                             </td>
//                                             <td>
//                                                 <div className="occ-row-name">{r.tenantName || "Vacant"}</div>
//                                                 {!r.checkOutDate && r.recordType === "Occupancy" && <div className="occ-row-sub">Currently residing</div>}
//                                             </td>
//                                             <td>{r.checkInDate || "—"}</td>
//                                             <td>{r.checkOutDate || "—"}</td>
//                                             <td>{dayDiff(r.checkInDate, r.checkOutDate) || "—"}</td>
//                                             <td><span className={`occ-tag ${inspectionTagClass(r.inspectionStatus)}`}>{r.inspectionStatus || "—"}</span></td>
//                                             <td><span className={`occ-tag ${handoverTagClass(r.keyHandoverStatus)}`}>{r.keyHandoverStatus || "—"}</span></td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         </div>
//                     </div>

//                     {/* Filter modal */}
//                     {isFilterOpen && (
//                         <div className="occ-modal-backdrop" onClick={() => setIsFilterOpen(false)}>
//                             <div className="occ-modal-card" onClick={(e) => e.stopPropagation()}>
//                                 <div className="occ-modal-head">
//                                     <p className="occ-modal-head-title">Filter Occupancy Records</p>
//                                     <button className="occ-modal-close" onClick={() => setIsFilterOpen(false)}>
//                                         <i className="bi bi-x-lg"></i>
//                                     </button>
//                                 </div>
//                                 <div className="occ-modal-body">
//                                     <div className="occ-field">
//                                         <label>Record Type</label>
//                                         <select className="occ-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
//                                             <option value="">All types</option>
//                                             {RECORD_TYPES.map((t) => (
//                                                 <option key={t} value={t}>{t}</option>
//                                             ))}
//                                         </select>
//                                     </div>
//                                     <div className="occ-field">
//                                         <label>Inspection Status</label>
//                                         <select className="occ-select" value={filterInspection} onChange={(e) => setFilterInspection(e.target.value)}>
//                                             <option value="">All statuses</option>
//                                             {INSPECTION_STATUSES.map((s) => (
//                                                 <option key={s} value={s}>{s}</option>
//                                             ))}
//                                         </select>
//                                     </div>
//                                     <div className="occ-field">
//                                         <label>Key Handover Status</label>
//                                         <select className="occ-select" value={filterHandover} onChange={(e) => setFilterHandover(e.target.value)}>
//                                             <option value="">All statuses</option>
//                                             {KEY_HANDOVER_STATUSES.map((s) => (
//                                                 <option key={s} value={s}>{s}</option>
//                                             ))}
//                                         </select>
//                                     </div>
//                                 </div>
//                                 <div className="occ-modal-footer">
//                                     <button
//                                         type="button"
//                                         className="occ-btn occ-btn-ghost"
//                                         onClick={() => { setFilterType(""); setFilterInspection(""); setFilterHandover(""); }}
//                                     >
//                                         Clear All
//                                     </button>
//                                     <button type="button" className="occ-btn occ-btn-primary" onClick={() => setIsFilterOpen(false)}>
//                                         Apply Filters
//                                     </button>
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                 </>
//             ) : (
//                 <>
//                     {/* Form header */}
//                     <div className="occ-form-header">
//                         <p className="occ-form-title">{isEditing ? "Edit Occupancy Record" : "Add Occupancy Record"}</p>
//                         <button type="button" className="occ-back-btn" onClick={backToList}>
//                             <i className="bi bi-arrow-left"></i> Back to Occupancy
//                         </button>
//                     </div>

//                     <form onSubmit={handleSave}>
//                         <div className="occ-section">
//                             <div className="occ-section-head">
//                                 <div className="occ-section-icon"><i className="bi bi-person-lines-fill"></i></div>
//                                 <div>
//                                     <p className="occ-section-title">Tenancy Details</p>
//                                     <div className="occ-section-sub">Who occupied the unit (or the vacancy period) and for how long</div>
//                                 </div>
//                             </div>

//                             <div className="occ-grid">
//                                 <div className="occ-field">
//                                     <label>Unit / Property Master</label>
//                                     <select
//                                         className="occ-select"
//                                         value={form.recordId}
//                                         onChange={handleChange("recordId")}
//                                         disabled={mastersLoading}
//                                     >
//                                         <option value="">
//                                             {mastersLoading ? "Loading units..." : "Select unit"}
//                                         </option>
//                                         {propertyMasters.map((master) => (
//                                             <option key={master.recordId} value={master.recordId}>
//                                                 {master.flatNo || `Record #${master.recordId}`}
//                                                 {master.flatType ? ` - ${master.flatType}` : ""}
//                                             </option>
//                                         ))}
//                                     </select>
//                                     <div className="occ-hint">Occupancy is saved against PropertyMaster.RecordID.</div>
//                                 </div>

//                                 <div className="occ-field">
//                                     <label>Record Type</label>
//                                     <select className="occ-select" value={form.recordType} onChange={handleChange("recordType")}>
//                                         {RECORD_TYPES.map((t) => (
//                                             <option key={t} value={t}>{t}</option>
//                                         ))}
//                                     </select>
//                                 </div>

//                                 {form.recordType === "Occupancy" && (
//                                     <div className="occ-field">
//                                         <label>Tenant Name</label>
//                                         <input type="text" className="occ-input" value={form.tenantName} onChange={handleChange("tenantName")} placeholder="e.g. Ahmed Al Farsi" />
//                                     </div>
//                                 )}

//                                 <div className="occ-field">
//                                     <label>Check-in Date</label>
//                                     <input type="date" className="occ-input" value={form.checkInDate} onChange={handleChange("checkInDate")} />
//                                 </div>

//                                 <div className="occ-field">
//                                     <label>Check-out Date</label>
//                                     <input type="date" className="occ-input" value={form.checkOutDate} onChange={handleChange("checkOutDate")} />
//                                     <div className="occ-hint">Leave blank if still ongoing</div>
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="occ-section">
//                             <div className="occ-section-head">
//                                 <div className="occ-section-icon"><i className="bi bi-clipboard-check"></i></div>
//                                 <div>
//                                     <p className="occ-section-title">Inspection & Key Handover</p>
//                                     <div className="occ-section-sub">Move-in / move-out inspection outcome and access handover</div>
//                                 </div>
//                             </div>

//                             <div className="occ-grid">
//                                 <div className="occ-field">
//                                     <label>Inspection Status</label>
//                                     <select className="occ-select" value={form.inspectionStatus} onChange={handleChange("inspectionStatus")}>
//                                         <option value="">Select status</option>
//                                         {INSPECTION_STATUSES.map((s) => (
//                                             <option key={s} value={s}>{s}</option>
//                                         ))}
//                                     </select>
//                                 </div>

//                                 <div className="occ-field">
//                                     <label>Key Handover Status</label>
//                                     <select className="occ-select" value={form.keyHandoverStatus} onChange={handleChange("keyHandoverStatus")}>
//                                         <option value="">Select status</option>
//                                         {KEY_HANDOVER_STATUSES.map((s) => (
//                                             <option key={s} value={s}>{s}</option>
//                                         ))}
//                                     </select>
//                                 </div>

//                                 <div className="occ-field occ-field-wide">
//                                     <label>Access Card Details</label>
//                                     <input type="text" className="occ-input" value={form.accessCardDetails} onChange={handleChange("accessCardDetails")} placeholder="e.g. Card #A-4471, 2 fobs issued" />
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="occ-section">
//                             <div className="occ-section-head">
//                                 <div className="occ-section-icon"><i className="bi bi-journal-text"></i></div>
//                                 <div>
//                                     <p className="occ-section-title">Notes</p>
//                                     <div className="occ-section-sub">Any additional context for this record</div>
//                                 </div>
//                             </div>

//                             <div className="occ-grid">
//                                 <div className="occ-field occ-field-wide">
//                                     <textarea className="occ-textarea" value={form.notes} onChange={handleChange("notes")} placeholder="e.g. Move-in inspection passed with no defects noted." />
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="occ-footer">
//                             <button type="submit" className="occ-btn occ-btn-primary" disabled={saving}>
//                                 <i className={`bi ${saving ? "bi-hourglass-split" : "bi-check2-circle"} me-2`}></i>
//                                 {saving ? "Saving…" : isEditing ? "Update Record" : "Save Record"}
//                             </button>
//                             {isEditing && (
//                                 <button type="button" className="occ-btn occ-btn-danger" onClick={handleDelete} disabled={deleting}>
//                                     <i className={`bi ${deleting ? "bi-hourglass-split" : "bi-trash3"} me-2`}></i>
//                                     {deleting ? "Deleting…" : "Delete"}
//                                 </button>
//                             )}
//                             <button type="button" className="occ-btn occ-btn-ghost" onClick={backToList} disabled={saving || deleting}>
//                                 Cancel
//                             </button>
//                         </div>
//                     </form>
//                 </>
//             )}
//         </div>
//     );
// };

// export default Occupancy;
import { useEffect, useMemo, useState } from "react";
import api from "../../apiService";

const RECORD_TYPES = ["Occupancy", "Vacancy"];
const INSPECTION_STATUSES = ["Pending", "Scheduled", "Completed", "Failed", "Not Required"];
const KEY_HANDOVER_STATUSES = ["Not Handed Over", "Handed Over", "Returned", "Pending"];

const INITIAL_FORM = {
  id: null,               // OccupancyID — null on create
  recordId: "",           // PropertyMaster.RecordID
  tenantUserId: "",       // UserTable.UserId — from Rental
  recordType: "Occupancy",
  tenantName: "",
  checkInDate: "",
  checkOutDate: "",
  inspectionStatus: "",
  keyHandoverStatus: "",
  accessCardDetails: "",
  notes: "",
};

// ── session helpers ──
const getCompanyID = () => Number(sessionStorage.getItem("CompanyID")) || 0;
const getUserID = () => Number(
  sessionStorage.getItem("UserId") || sessionStorage.getItem("UserID")
) || 0;

const mapApiProperty = (p) => ({
  id: p.PropertyID ?? p.propertyId ?? p.id,
  propertyId: p.PropertyID ?? p.propertyId ?? p.id,
  propertyName: p.PropertyName ?? p.propertyName ?? "",
  propertyCode: p.PropertyCode ?? p.propertyCode ?? "",
});

const mapApiPropertyMaster = (p) => ({
  recordId: p.RecordID ?? p.recordID ?? p.recordId ?? p.id,
  flatNo: p.FlatNo ?? p.flatNo ?? "",
  flatType: p.FlatType ?? p.flatType ?? "",
});

// Row from /api/GetUsermaster
const mapApiRentalUser = (u) => ({
  userId: u.UserId ?? u.userId,
  name: [u.Name, u.MName, u.LName].filter(Boolean).join(" ").trim(),
  mobile: u.Mobile || "",
  eidNo: u.EIDNo || "",
  propertyId: u.PropertyID ?? u.propertyId ?? "",
  recordId: u.RecordID ?? u.recordID ?? u.recordId ?? "",
  tradeName: u.RoleName || "",
});

const mapApiOccupancy = (r) => ({
  id: r.OccupancyID,
  recordId: r.RecordID ?? r.recordID ?? r.recordId ?? "",
  tenantUserId: r.UserID ?? r.UserId ?? r.TenantUserId ?? r.tenantUserId ?? "",
  recordType: r.RecordType || "Occupancy",
  tenantName: r.TenantName ?? "",
  checkInDate: (r.CheckInDate ?? "").toString().slice(0, 10),
  checkOutDate: (r.CheckOutDate ?? "").toString().slice(0, 10),
  inspectionStatus: r.InspectionStatus ?? "",
  keyHandoverStatus: r.KeyHandoverStatus ?? "",
  accessCardDetails: r.AccessCardDetails ?? "",
  notes: r.Notes ?? "",
});

const mapFormToApiPayload = (form, { companyId, propertyId, userId }) => ({
  OccupancyID: form.id || 0,
  PropertyID: propertyId,
  RecordID: Number(form.recordId),
  CompanyID: companyId,
  UserID: form.tenantUserId ? Number(form.tenantUserId) : null,
  RecordType: form.recordType,
  TenantName: form.recordType === "Occupancy" ? form.tenantName : "",
  CheckInDate: form.checkInDate || null,
  CheckOutDate: form.checkOutDate || null,
  InspectionStatus: form.inspectionStatus,
  KeyHandoverStatus: form.keyHandoverStatus,
  AccessCardDetails: form.accessCardDetails,
  Notes: form.notes,
  CreatedBy: form.id ? undefined : userId,
  ModifiedBy: userId,
  Action: form.id ? "UPDATE" : "INSERT",
});

const dayDiff = (start, end) => {
  if (!start) return "";
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  const days = Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
  if (days < 30) return `${days} day${days === 1 ? "" : "s"}`;
  if (days < 365) return `${Math.round(days / 30)} mo`;
  return `${(days / 365).toFixed(1)} yr`;
};

const inspectionTagClass = (status) => {
  switch (status) {
    case "Completed": return "occ-tag-green";
    case "Scheduled": return "occ-tag-blue";
    case "Pending": return "occ-tag-amber";
    case "Failed": return "occ-tag-red";
    default: return "occ-tag-muted";
  }
};

const handoverTagClass = (status) => {
  switch (status) {
    case "Handed Over": return "occ-tag-green";
    case "Returned": return "occ-tag-blue";
    case "Pending": return "occ-tag-amber";
    case "Not Handed Over": return "occ-tag-muted";
    default: return "occ-tag-muted";
  }
};

const Occupancy = () => {
  // ── Real property list ──
  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [propertyMasters, setPropertyMasters] = useState([]);
  const [mastersLoading, setMastersLoading] = useState(false);
  const selectedProperty = properties.find((p) => String(p.id) === String(selectedPropertyId)) || null;
  const onSelectProperty = (propertyId) => setSelectedPropertyId(propertyId);

  // ── Rental tenants (from UserTable) ──
  const [rentalTenants, setRentalTenants] = useState([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ── List state ──
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterInspection, setFilterInspection] = useState("");
  const [filterHandover, setFilterHandover] = useState("");

  // ── Form state ──
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEditing = form.id !== null;

  const currentTenant = useMemo(
    () => records.find((r) => r.recordType === "Occupancy" && !r.checkOutDate),
    [records]
  );

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => new Date(b.checkInDate || 0) - new Date(a.checkInDate || 0)),
    [records]
  );

  const filteredRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return sortedRecords.filter((r) => {
      if (filterType && r.recordType !== filterType) return false;
      if (filterInspection && r.inspectionStatus !== filterInspection) return false;
      if (filterHandover && r.keyHandoverStatus !== filterHandover) return false;
      if (!term) return true;
      return [r.tenantName, r.recordType, r.accessCardDetails]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [sortedRecords, searchTerm, filterType, filterInspection, filterHandover]);

  const activeFilterCount = [filterType, filterInspection, filterHandover].filter(Boolean).length;

  // ── Tenants available for the current form selection ──
  const availableTenants = useMemo(() => {
    if (!selectedProperty?.id) return [];
    return rentalTenants.filter((t) => {
      const propMatch = String(t.propertyId) === String(selectedProperty.id);
      const recMatch = !form.recordId || String(t.recordId) === String(form.recordId);
      return propMatch && recMatch;
    });
  }, [rentalTenants, selectedProperty?.id, form.recordId]);

  // ── Loaders ──
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

  const loadPropertyMasters = async (propertyId) => {
    const companyID = getCompanyID();
    if (!companyID || !propertyId) {
      setPropertyMasters([]);
      return;
    }
    setMastersLoading(true);
    try {
      const response = await api.get("/api/getPropertyMaster", {
        params: { CompanyID: companyID, PropertyID: propertyId },
      });
      const data = response.data;
      if (data?.success) {
        setPropertyMasters(Array.isArray(data.data) ? data.data.map(mapApiPropertyMaster) : []);
      } else {
        setPropertyMasters([]);
        setErrorMessage(data?.message || "Failed to load property master.");
      }
    } catch (error) {
      console.error("Load PropertyMaster error:", error);
      setPropertyMasters([]);
      setErrorMessage(error?.response?.data?.message || "Failed to load property master.");
    } finally {
      setMastersLoading(false);
    }
  };

  // Load rental tenants once — filter client-side per property/record
  const loadRentalTenants = async () => {
    const companyID = getCompanyID();
    if (!companyID) return;
    setTenantsLoading(true);
    try {
      const response = await api.get("/api/GetUsermaster", {
        params: { CompanyID: companyID },
      });
      const raw = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setRentalTenants(raw.map(mapApiRentalUser));
    } catch (error) {
      console.error("Load rental tenants error:", error);
      setRentalTenants([]);
    } finally {
      setTenantsLoading(false);
    }
  };

  const loadOccupancy = async (propertyId) => {
    const companyID = getCompanyID();
    if (!companyID || !propertyId) return;

    setLoading(true);
    setErrorMessage("");
    try {
      const response = await api.get("/api/getPropertyOccupancy", {
        params: { PropertyID: propertyId, CompanyID: companyID },
      });
      const data = response.data;
      if (data?.success) {
        const list = Array.isArray(data.data) ? data.data.map(mapApiOccupancy) : [];
        setRecords(list);
      } else {
        setErrorMessage(data?.message || "Failed to load occupancy records.");
      }
    } catch (error) {
      console.error("Load occupancy error:", error);
      setErrorMessage(error?.response?.data?.message || "Failed to load occupancy records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
    loadRentalTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setShowForm(false);
    setForm(INITIAL_FORM);
    setPropertyMasters([]);
    setErrorMessage("");
    if (selectedProperty?.id) {
      loadPropertyMasters(selectedProperty.id);
      loadOccupancy(selectedProperty.id);
    } else {
      setRecords([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProperty?.id]);

  // ── Handlers ──
  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleTenantSelect = (e) => {
    const uid = e.target.value;
    const found = availableTenants.find((t) => String(t.userId) === String(uid));
    setForm((prev) => ({
      ...prev,
      tenantUserId: uid,
      tenantName: found ? found.name : "",
    }));
  };

  const openCreate = () => {
    setForm(INITIAL_FORM);
    setShowForm(true);
  };

  const openEdit = (record) => {
    setForm(record);
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

    if (!companyID) {
      setErrorMessage("CompanyID not found. Please login again.");
      return;
    }
    if (!selectedProperty?.id) {
      setErrorMessage("Please select a property first.");
      return;
    }
    if (!form.recordId) {
      setErrorMessage("Please select a unit / Property Master record.");
      return;
    }
    if (form.recordType === "Occupancy" && !form.tenantUserId) {
      setErrorMessage("Please select a tenant from the rental list.");
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
      const response = await api.post("/api/insertUpdatePropertyOccupancy", payload);
      const data = response.data;

      if (data?.success) {
        await loadOccupancy(selectedProperty.id);
        backToList();
      } else {
        setErrorMessage(data?.message || "Unable to save occupancy record.");
      }
    } catch (error) {
      console.error("Error saving occupancy record:", error);
      setErrorMessage(error?.response?.data?.message || "Unable to save occupancy record.");
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
      const response = await api.delete("/api/deletePropertyOccupancy", {
        data: {
          OccupancyID: form.id,
          PropertyID: selectedProperty.id,
          CompanyID: companyID,
          ModifiedBy: userID,
        },
      });
      const data = response.data;

      if (data?.success) {
        await loadOccupancy(selectedProperty.id);
        backToList();
      } else {
        setErrorMessage(data?.message || "Unable to delete occupancy record.");
      }
    } catch (error) {
      console.error("Error deleting occupancy record:", error);
      setErrorMessage(error?.response?.data?.message || "Unable to delete occupancy record.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="occ-root">
      <style>{`
        :root{
          --occ-primary:#10299b;
          --occ-primary-dark:#0b1c6e;
          --occ-primary-mid:#4a5fc1;
          --occ-primary-soft:#eef1fb;
          --occ-primary-tint:#d6ddf5;
          --occ-ink:#1a1f36;
          --occ-muted:#6b7290;
          --occ-green:#1a9e6c;
          --occ-green-soft:#e6f7f0;
          --occ-blue:#0f6fb0;
          --occ-blue-soft:#e5f3fb;
          --occ-amber:#c07a00;
          --occ-amber-soft:#fdf3df;
          --occ-red:#dc2626;
          --occ-red-soft:#fdecec;
          --occ-slate:#475569;
          --occ-slate-soft:#eef2f6;
        }
        .occ-root{ font-family:"Inter", system-ui, -apple-system, "Segoe UI", sans-serif; color:var(--occ-ink); }
        .occ-root *{ box-sizing:border-box; }

        .occ-alert{
          display:flex; align-items:center; gap:10px;
          background:var(--occ-red-soft); color:var(--occ-red);
          border:1px solid #f5b8b8; border-radius:10px;
          padding:10px 14px; font-size:.83rem; font-weight:600;
          margin-bottom:14px;
        }
        .occ-loading{ text-align:center; padding:32px 16px; color:var(--occ-muted); font-size:.85rem; }

        .occ-page-header{ margin-bottom:18px; }
        .occ-page-title{ font-size:1.15rem; font-weight:800; color:var(--occ-primary-dark); margin:0 0 3px; }
        .occ-page-sub{ font-size:.85rem; color:var(--occ-muted); margin:0; }

        .occ-context-card{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 16px; margin-bottom:16px; border:1px solid var(--occ-primary-tint); border-radius:14px; background:var(--occ-primary-soft); }
        .occ-context-title{ font-size:.78rem; font-weight:700; color:var(--occ-primary-dark); text-transform:uppercase; letter-spacing:.5px; }
        .occ-context-sub{ font-size:.84rem; color:var(--occ-muted); margin-top:3px; }
        .occ-list-card{
          background:#fff; border:1px solid var(--occ-primary-tint); border-radius:16px;
          overflow:hidden; box-shadow:0 4px 18px rgba(16,41,155,.06);
        }
        .occ-property-item{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 16px; border-bottom:1px solid #f0f2fa; cursor:pointer; }
        .occ-property-item:last-child{ border-bottom:none; }
        .occ-property-name{ font-size:.84rem; font-weight:700; color:var(--occ-primary-dark); }
        .occ-property-code{ font-size:.74rem; color:var(--occ-muted); margin-top:3px; }

        .occ-current-card{
          display:flex; align-items:center; gap:16px; flex-wrap:wrap;
          background:linear-gradient(135deg, var(--occ-primary) 0%, var(--occ-primary-dark) 100%);
          color:#fff; border-radius:16px; padding:18px 22px; margin-bottom:18px;
        }
        .occ-current-avatar{
          width:48px; height:48px; border-radius:12px; background:rgba(255,255,255,.15);
          display:flex; align-items:center; justify-content:center; font-size:1.3rem; flex-shrink:0;
        }
        .occ-current-info{ flex:1; min-width:180px; }
        .occ-current-label{ font-size:.7rem; font-weight:700; text-transform:uppercase; letter-spacing:.5px; opacity:.75; margin-bottom:2px; }
        .occ-current-name{ font-size:1.05rem; font-weight:800; }
        .occ-current-since{ font-size:.78rem; opacity:.85; margin-top:1px; }
        .occ-current-stats{ display:flex; gap:22px; flex-wrap:wrap; }
        .occ-current-stat-label{ font-size:.68rem; text-transform:uppercase; letter-spacing:.4px; opacity:.75; margin-bottom:3px; }
        .occ-current-stat-value{ font-size:.85rem; font-weight:700; }
        .occ-current-empty{
          display:flex; align-items:center; gap:16px;
          background:var(--occ-slate-soft); color:var(--occ-slate);
          border-radius:16px; padding:18px 22px; margin-bottom:18px;
        }
        .occ-current-empty i{ font-size:1.5rem; }

        .occ-toolbar{ display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin-bottom:16px; }
        .occ-search-wrap{ position:relative; flex:1; min-width:220px; }
        .occ-search-wrap i{
          position:absolute; left:12px; top:50%; transform:translateY(-50%);
          color:var(--occ-primary-mid); font-size:.85rem;
        }
        .occ-search-input{
          width:100%; border:1px solid var(--occ-primary-tint); border-radius:9px;
          padding:9px 12px 9px 34px; font-size:.85rem; background:var(--occ-primary-soft);
          outline:none; transition:border-color .15s ease, background .15s ease;
        }
        .occ-search-input:focus{ border-color:var(--occ-primary); background:#fff; }

        .occ-toolbar-btn{
          display:flex; align-items:center; gap:7px;
          border-radius:9px; padding:9px 16px; font-size:.83rem; font-weight:700; white-space:nowrap;
          border:1.5px solid var(--occ-primary); background:#fff; color:var(--occ-primary);
          cursor:pointer; transition:all .15s ease; position:relative;
        }
        .occ-toolbar-btn:hover{ background:var(--occ-primary-soft); }
        .occ-toolbar-btn.occ-btn-solid{ background:var(--occ-primary); color:#fff; }
        .occ-toolbar-btn.occ-btn-solid:hover{ background:var(--occ-primary-dark); }
        .occ-filter-badge{
          position:absolute; top:-6px; right:-6px; background:var(--occ-red); color:#fff;
          width:17px; height:17px; border-radius:50%; font-size:9px; font-weight:700;
          display:flex; align-items:center; justify-content:center;
        }

        .occ-table-card{
          background:#fff; border:1px solid var(--occ-primary-tint); border-radius:16px;
          overflow:hidden; box-shadow:0 4px 18px rgba(16,41,155,.06);
        }
        .occ-table{ width:100%; border-collapse:collapse; margin:0; }
        .occ-table thead th{
          background:var(--occ-primary-soft); color:var(--occ-primary-dark);
          font-size:.7rem; font-weight:700; text-transform:uppercase; letter-spacing:.5px;
          padding:12px 16px; text-align:left; border-bottom:2px solid var(--occ-primary-tint); white-space:nowrap;
        }
        .occ-table tbody td{ padding:12px 16px; font-size:.84rem; border-bottom:1px solid #f0f2fa; vertical-align:middle; }
        .occ-table tbody tr{ cursor:pointer; transition:background .15s ease; }
        .occ-table tbody tr:nth-child(even){ background:#f8f9fd; }
        .occ-table tbody tr:hover{ background:var(--occ-primary-soft); }
        .occ-row-name{ font-weight:700; color:var(--occ-ink); }
        .occ-row-sub{ font-size:.74rem; color:var(--occ-muted); margin-top:1px; }
        .occ-tag{ display:inline-block; font-size:.72rem; font-weight:700; padding:3px 10px; border-radius:999px; }
        .occ-tag-type-occupancy{ background:var(--occ-primary-soft); color:var(--occ-primary-mid); }
        .occ-tag-type-vacancy{ background:var(--occ-slate-soft); color:var(--occ-slate); }
        .occ-tag-green{ background:var(--occ-green-soft); color:var(--occ-green); }
        .occ-tag-blue{ background:var(--occ-blue-soft); color:var(--occ-blue); }
        .occ-tag-amber{ background:var(--occ-amber-soft); color:var(--occ-amber); }
        .occ-tag-red{ background:var(--occ-red-soft); color:var(--occ-red); }
        .occ-tag-muted{ background:var(--occ-slate-soft); color:var(--occ-muted); }
        .occ-empty{ text-align:center; padding:48px 20px; color:var(--occ-muted); }
        .occ-empty i{ font-size:1.9rem; color:var(--occ-primary-tint); margin-bottom:8px; display:block; }
        .occ-empty-title{ font-weight:700; color:var(--occ-primary-dark); font-size:.9rem; }

        .occ-modal-backdrop{
          position:fixed; inset:0; z-index:1050; background:rgba(15,20,50,.5);
          display:flex; align-items:center; justify-content:center; padding:20px;
        }
        .occ-modal-card{
          background:#fff; border-radius:16px; width:100%; max-width:420px;
          box-shadow:0 20px 50px rgba(16,41,155,.25); overflow:hidden;
        }
        .occ-modal-head{
          display:flex; align-items:center; justify-content:space-between; padding:16px 20px;
          background:linear-gradient(135deg, var(--occ-primary) 0%, var(--occ-primary-dark) 100%); color:#fff;
        }
        .occ-modal-head-title{ font-size:.95rem; font-weight:700; margin:0; }
        .occ-modal-close{
          border:none; background:rgba(255,255,255,.15); color:#fff;
          width:26px; height:26px; border-radius:7px; cursor:pointer;
        }
        .occ-modal-body{ padding:18px 20px; display:flex; flex-direction:column; gap:14px; }
        .occ-modal-footer{ display:flex; justify-content:space-between; gap:10px; padding:14px 20px; border-top:1px solid var(--occ-primary-soft); }

        .occ-form-header{ display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; gap:12px; flex-wrap:wrap; }
        .occ-form-title{ font-size:1.05rem; font-weight:700; color:var(--occ-primary-dark); margin:0; }
        .occ-back-btn{
          display:flex; align-items:center; gap:7px;
          border:1.5px solid var(--occ-primary); background:#fff; color:var(--occ-primary);
          border-radius:9px; padding:8px 16px; font-size:.83rem; font-weight:700; cursor:pointer; transition:all .15s ease;
        }
        .occ-back-btn:hover{ background:var(--occ-primary-soft); }

        .occ-section{ margin-bottom:26px; }
        .occ-section-head{
          display:flex; align-items:center; gap:10px; margin-bottom:16px; padding-bottom:12px;
          border-bottom:1px solid var(--occ-primary-tint);
        }
        .occ-section-icon{
          width:34px; height:34px; border-radius:9px; background:var(--occ-primary-soft); color:var(--occ-primary);
          display:flex; align-items:center; justify-content:center; font-size:.95rem; flex-shrink:0;
        }
        .occ-section-title{ font-size:.95rem; font-weight:700; color:var(--occ-primary-dark); margin:0; }
        .occ-section-sub{ font-size:.76rem; color:var(--occ-muted); margin-top:1px; }

        .occ-grid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(230px, 1fr)); gap:16px 18px; }
        .occ-field.occ-field-wide{ grid-column:1 / -1; }
        .occ-field label{
          display:block; font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.4px;
          color:var(--occ-primary-mid); margin-bottom:6px;
        }
        .occ-input, .occ-select, .occ-textarea{
          width:100%; border:1px solid var(--occ-primary-tint); border-radius:9px; padding:9px 12px;
          font-size:.85rem; color:var(--occ-ink); background:#fff; outline:none; font-family:inherit;
          transition:border-color .15s ease, box-shadow .15s ease;
        }
        .occ-textarea{ resize:vertical; min-height:80px; }
        .occ-input:focus, .occ-select:focus, .occ-textarea:focus{
          border-color:var(--occ-primary); box-shadow:0 0 0 3px rgba(16,41,155,.12);
        }
        .occ-input:disabled, .occ-select:disabled{ background:var(--occ-primary-soft); color:var(--occ-muted); cursor:not-allowed; }
        .occ-hint{ font-size:.7rem; color:var(--occ-muted); margin-top:4px; }

        .occ-footer{
          display:flex; align-items:center; gap:10px; padding-top:18px;
          border-top:1px solid var(--occ-primary-tint); flex-wrap:wrap;
        }
        .occ-btn{ border:none; border-radius:10px; padding:10px 20px; font-size:.85rem; font-weight:700; transition:all .15s ease; cursor:pointer; }
        .occ-btn-primary{ background:var(--occ-primary); color:#fff; }
        .occ-btn-primary:hover:not(:disabled){ background:var(--occ-primary-dark); box-shadow:0 4px 10px rgba(16,41,155,.25); }
        .occ-btn-primary:disabled{ opacity:.6; cursor:default; }
        .occ-btn-ghost{ background:var(--occ-primary-soft); color:var(--occ-primary); }
        .occ-btn-ghost:hover{ background:var(--occ-primary-tint); }
        .occ-btn-danger{ background:#fff; color:var(--occ-red); border:1.5px solid #f5b8b8; }
        .occ-btn-danger:hover:not(:disabled){ background:var(--occ-red-soft); }
        .occ-btn-danger:disabled{ opacity:.6; cursor:default; }
      `}</style>

      {errorMessage && (
        <div className="occ-alert">
          <i className="bi bi-exclamation-triangle"></i>
          {errorMessage}
        </div>
      )}

      <div className="occ-context-card">
        <div>
          <div className="occ-context-title">Selected property</div>
          <div className="occ-context-sub">
            {selectedProperty
              ? `${selectedProperty.propertyName || selectedProperty.propertyCode || "Selected property"}`
              : "Choose a property from the list to continue"}
          </div>
        </div>
        {selectedProperty ? (
          <button type="button" className="occ-btn occ-btn-ghost" onClick={() => onSelectProperty(null)}>
            Change property
          </button>
        ) : null}
      </div>

      {!selectedProperty ? (
        <div className="occ-list-card">
          {propertiesLoading ? (
            <div className="occ-loading">Loading properties…</div>
          ) : properties.length === 0 ? (
            <div className="occ-loading">No properties found for this company.</div>
          ) : (
            properties.map((property) => (
              <div
                key={property.id}
                className="occ-property-item"
                onClick={() => onSelectProperty(property.id)}
              >
                <div>
                  <div className="occ-property-name">
                    {property.propertyName || property.propertyCode}
                  </div>
                  <div className="occ-property-code">
                    {property.propertyCode || property.propertyId}
                  </div>
                </div>
                <i className="bi bi-chevron-right" style={{ color: "var(--occ-primary)" }}></i>
              </div>
            ))
          )}
        </div>
      ) : loading ? (
        <div className="occ-list-card">
          <div className="occ-loading">Loading occupancy records…</div>
        </div>
      ) : !showForm ? (
        <>
          <div className="occ-page-header">
            <p className="occ-page-title">Occupancy Management</p>
            <p className="occ-page-sub">
              Track current and past tenants, vacancy periods, and move-in/move-out handover details.
            </p>
          </div>

          {currentTenant ? (
            <div className="occ-current-card">
              <div className="occ-current-avatar">
                <i className="bi bi-person-check"></i>
              </div>
              <div className="occ-current-info">
                <div className="occ-current-label">Current Tenant</div>
                <div className="occ-current-name">{currentTenant.tenantName}</div>
                <div className="occ-current-since">
                  Since {currentTenant.checkInDate} • {dayDiff(currentTenant.checkInDate)} in residence
                </div>
              </div>
              <div className="occ-current-stats">
                <div>
                  <div className="occ-current-stat-label">Inspection</div>
                  <div className="occ-current-stat-value">
                    {currentTenant.inspectionStatus || "—"}
                  </div>
                </div>
                <div>
                  <div className="occ-current-stat-label">Key Handover</div>
                  <div className="occ-current-stat-value">
                    {currentTenant.keyHandoverStatus || "—"}
                  </div>
                </div>
                <div>
                  <div className="occ-current-stat-label">Access Card</div>
                  <div className="occ-current-stat-value">
                    {currentTenant.accessCardDetails || "—"}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="occ-current-empty">
              <i className="bi bi-house-x"></i>
              <div>
                <div style={{ fontWeight: 700, fontSize: ".9rem" }}>Currently Vacant</div>
                <div style={{ fontSize: ".78rem" }}>
                  No active tenant on record for this property.
                </div>
              </div>
            </div>
          )}

          <div className="occ-toolbar">
            <div className="occ-search-wrap">
              <i className="bi bi-search"></i>
              <input
                type="text"
                className="occ-search-input"
                placeholder="Search tenant, access card…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button type="button" className="occ-toolbar-btn" onClick={() => setIsFilterOpen(true)}>
              <i className="bi bi-funnel"></i> Filters
              {activeFilterCount > 0 && (
                <span className="occ-filter-badge">{activeFilterCount}</span>
              )}
            </button>
            <button type="button" className="occ-toolbar-btn occ-btn-solid" onClick={openCreate}>
              <i className="bi bi-plus-lg"></i> Add Record
            </button>
          </div>

          <div className="occ-table-card">
            <div className="table-responsive" style={{ maxHeight: "60vh" }}>
              <table className="occ-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Tenant</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Duration</th>
                    <th>Inspection</th>
                    <th>Key Handover</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={7}>
                        <div className="occ-empty">
                          <i className="bi bi-clock-history"></i>
                          <div className="occ-empty-title">No occupancy records found</div>
                          <div>Try adjusting your search or filters, or add a new record.</div>
                        </div>
                      </td>
                    </tr>
                  )}
                  {filteredRecords.map((r) => (
                    <tr key={r.id} onClick={() => openEdit(r)}>
                      <td>
                        <span
                          className={`occ-tag ${
                            r.recordType === "Occupancy"
                              ? "occ-tag-type-occupancy"
                              : "occ-tag-type-vacancy"
                          }`}
                        >
                          {r.recordType}
                        </span>
                      </td>
                      <td>
                        <div className="occ-row-name">{r.tenantName || "Vacant"}</div>
                        {!r.checkOutDate && r.recordType === "Occupancy" && (
                          <div className="occ-row-sub">Currently residing</div>
                        )}
                      </td>
                      <td>{r.checkInDate || "—"}</td>
                      <td>{r.checkOutDate || "—"}</td>
                      <td>{dayDiff(r.checkInDate, r.checkOutDate) || "—"}</td>
                      <td>
                        <span className={`occ-tag ${inspectionTagClass(r.inspectionStatus)}`}>
                          {r.inspectionStatus || "—"}
                        </span>
                      </td>
                      <td>
                        <span className={`occ-tag ${handoverTagClass(r.keyHandoverStatus)}`}>
                          {r.keyHandoverStatus || "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {isFilterOpen && (
            <div className="occ-modal-backdrop" onClick={() => setIsFilterOpen(false)}>
              <div className="occ-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="occ-modal-head">
                  <p className="occ-modal-head-title">Filter Occupancy Records</p>
                  <button className="occ-modal-close" onClick={() => setIsFilterOpen(false)}>
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
                <div className="occ-modal-body">
                  <div className="occ-field">
                    <label>Record Type</label>
                    <select
                      className="occ-select"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="">All types</option>
                      {RECORD_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="occ-field">
                    <label>Inspection Status</label>
                    <select
                      className="occ-select"
                      value={filterInspection}
                      onChange={(e) => setFilterInspection(e.target.value)}
                    >
                      <option value="">All statuses</option>
                      {INSPECTION_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="occ-field">
                    <label>Key Handover Status</label>
                    <select
                      className="occ-select"
                      value={filterHandover}
                      onChange={(e) => setFilterHandover(e.target.value)}
                    >
                      <option value="">All statuses</option>
                      {KEY_HANDOVER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="occ-modal-footer">
                  <button
                    type="button"
                    className="occ-btn occ-btn-ghost"
                    onClick={() => {
                      setFilterType("");
                      setFilterInspection("");
                      setFilterHandover("");
                    }}
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    className="occ-btn occ-btn-primary"
                    onClick={() => setIsFilterOpen(false)}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="occ-form-header">
            <p className="occ-form-title">
              {isEditing ? "Edit Occupancy Record" : "Add Occupancy Record"}
            </p>
            <button type="button" className="occ-back-btn" onClick={backToList}>
              <i className="bi bi-arrow-left"></i> Back to Occupancy
            </button>
          </div>

          <form onSubmit={handleSave}>
            <div className="occ-section">
              <div className="occ-section-head">
                <div className="occ-section-icon">
                  <i className="bi bi-person-lines-fill"></i>
                </div>
                <div>
                  <p className="occ-section-title">Tenancy Details</p>
                  <div className="occ-section-sub">
                    Who occupied the unit (or the vacancy period) and for how long
                  </div>
                </div>
              </div>

              <div className="occ-grid">
                <div className="occ-field">
                  <label>Unit / Property Master</label>
                  <select
                    className="occ-select"
                    value={form.recordId}
                    onChange={handleChange("recordId")}
                    disabled={mastersLoading}
                  >
                    <option value="">
                      {mastersLoading ? "Loading units..." : "Select unit"}
                    </option>
                    {propertyMasters.map((master) => (
                      <option key={master.recordId} value={master.recordId}>
                        {master.flatNo || `Record #${master.recordId}`}
                        {master.flatType ? ` - ${master.flatType}` : ""}
                      </option>
                    ))}
                  </select>
                  <div className="occ-hint">
                    Occupancy is saved against PropertyMaster.RecordID.
                  </div>
                </div>

                <div className="occ-field">
                  <label>Record Type</label>
                  <select
                    className="occ-select"
                    value={form.recordType}
                    onChange={handleChange("recordType")}
                  >
                    {RECORD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {form.recordType === "Occupancy" && (
                  <div className="occ-field">
                    <label>Tenant</label>
                    <select
                      className="occ-select"
                      value={form.tenantUserId || ""}
                      onChange={handleTenantSelect}
                      disabled={!form.recordId || tenantsLoading}
                    >
                      <option value="">
                        {!form.recordId
                          ? "Select unit first"
                          : tenantsLoading
                            ? "Loading tenants…"
                            : availableTenants.length === 0
                              ? "No rentals for this unit — create one in Rental first"
                              : "Select tenant"}
                      </option>
                      {availableTenants.map((t) => (
                        <option key={t.userId} value={t.userId}>
                          {t.name}
                          {t.mobile ? ` · ${t.mobile}` : ""}
                          {t.eidNo ? ` · ${t.eidNo}` : ""}
                        </option>
                      ))}
                    </select>
                    <div className="occ-hint">
                      Only tenants created under Rental for this property + unit are shown.
                    </div>
                  </div>
                )}

                <div className="occ-field">
                  <label>Check-in Date</label>
                  <input
                    type="date"
                    className="occ-input"
                    value={form.checkInDate}
                    onChange={handleChange("checkInDate")}
                  />
                </div>

                <div className="occ-field">
                  <label>Check-out Date</label>
                  <input
                    type="date"
                    className="occ-input"
                    value={form.checkOutDate}
                    onChange={handleChange("checkOutDate")}
                  />
                  <div className="occ-hint">Leave blank if still ongoing</div>
                </div>
              </div>
            </div>

            <div className="occ-section">
              <div className="occ-section-head">
                <div className="occ-section-icon">
                  <i className="bi bi-clipboard-check"></i>
                </div>
                <div>
                  <p className="occ-section-title">Inspection & Key Handover</p>
                  <div className="occ-section-sub">
                    Move-in / move-out inspection outcome and access handover
                  </div>
                </div>
              </div>

              <div className="occ-grid">
                <div className="occ-field">
                  <label>Inspection Status</label>
                  <select
                    className="occ-select"
                    value={form.inspectionStatus}
                    onChange={handleChange("inspectionStatus")}
                  >
                    <option value="">Select status</option>
                    {INSPECTION_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="occ-field">
                  <label>Key Handover Status</label>
                  <select
                    className="occ-select"
                    value={form.keyHandoverStatus}
                    onChange={handleChange("keyHandoverStatus")}
                  >
                    <option value="">Select status</option>
                    {KEY_HANDOVER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="occ-field occ-field-wide">
                  <label>Access Card Details</label>
                  <input
                    type="text"
                    className="occ-input"
                    value={form.accessCardDetails}
                    onChange={handleChange("accessCardDetails")}
                    placeholder="e.g. Card #A-4471, 2 fobs issued"
                  />
                </div>
              </div>
            </div>

            <div className="occ-section">
              <div className="occ-section-head">
                <div className="occ-section-icon">
                  <i className="bi bi-journal-text"></i>
                </div>
                <div>
                  <p className="occ-section-title">Notes</p>
                  <div className="occ-section-sub">
                    Any additional context for this record
                  </div>
                </div>
              </div>

              <div className="occ-grid">
                <div className="occ-field occ-field-wide">
                  <textarea
                    className="occ-textarea"
                    value={form.notes}
                    onChange={handleChange("notes")}
                    placeholder="e.g. Move-in inspection passed with no defects noted."
                  />
                </div>
              </div>
            </div>

            <div className="occ-footer">
              <button type="submit" className="occ-btn occ-btn-primary" disabled={saving}>
                <i className={`bi ${saving ? "bi-hourglass-split" : "bi-check2-circle"} me-2`}></i>
                {saving ? "Saving…" : isEditing ? "Update Record" : "Save Record"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  className="occ-btn occ-btn-danger"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <i className={`bi ${deleting ? "bi-hourglass-split" : "bi-trash3"} me-2`}></i>
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              )}
              <button
                type="button"
                className="occ-btn occ-btn-ghost"
                onClick={backToList}
                disabled={saving || deleting}
              >
                Cancel
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default Occupancy;