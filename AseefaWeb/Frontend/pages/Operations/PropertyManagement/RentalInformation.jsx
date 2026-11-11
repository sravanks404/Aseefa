

// import { useEffect, useMemo, useState } from "react";
// import api from "../../apiService";

// const RENTAL_STATUSES = [
//     "Occupied",
//     "Vacant",
//     "Reserved",
//     "Under Maintenance",
//     "Blocked",
// ];

// const PAYMENT_FREQUENCIES = [
//     "Monthly",
//     "Quarterly",
//     "Half-Yearly",
//     "Yearly",
// ];

// const RENEWAL_OPTIONS = [
//     "Automatic Renewal",
//     "Tenant Option to Renew",
//     "Landlord Option to Renew",
//     "No Renewal",
// ];

// const INITIAL_FORM = {
//     id: null, // RentalID
//     tenantName: "",
//     rentalStatus: "",
//     monthlyRent: "",
//     annualRent: "",
//     securityDeposit: "",
//     numberOfCheques: "",
//     paymentFrequency: "",
//     leaseStartDate: "",
//     leaseEndDate: "",
//     renewalOption: "",
//     rentIncreasePercentage: "",
//     gracePeriod: "",
//     lateFeeRules: "",
// };

// const getCompanyID = () => Number(sessionStorage.getItem("CompanyID")) || 0;
// const getUserID = () => Number(sessionStorage.getItem("UserId")) || 0;

// // ============================================================
// // PROPERTY (top level) -> UI
// // ============================================================

// const mapApiProperty = (p) => ({
//     id: p.PropertyID ?? p.propertyId ?? p.id,
//     label:
//         p.PropertyName ??
//         p.PropertyLabel ??
//         p.propertyLabel ??
//         p.Name ??
//         `Property #${p.PropertyID ?? p.id}`,
// });

// // ============================================================
// // PROPERTY MASTER (unit/flat within a property) -> UI
// // ============================================================

// const mapApiPropertyMaster = (p) => ({
//     recordId: p.RecordID ?? p.recordID ?? p.recordId ?? p.id,

//     propertyId: p.PropertyID ?? p.propertyID ?? p.propertyId ?? null,

//     flatNo: p.FlatNo ?? p.flatNo ?? "",

//     tenantName: p.TenantName ?? p.tenantName ?? "",

//     flatType: p.FlatType ?? p.flatType ?? "",

//     rentalAmount: p.RentalAmount ?? p.rentalAmount ?? "",
// });

// // ============================================================
// // RENTAL API -> FORM
// // ============================================================

// const mapApiRental = (r) => ({
//     id: r.RentalID ?? r.rentalID ?? r.rentalId ?? null,

//     tenantName: r.TenantName ?? r.tenantName ?? "",

//     rentalStatus: r.RentalStatus ?? r.rentalStatus ?? "",

//     monthlyRent: r.MonthlyRent ?? r.monthlyRent ?? "",

//     annualRent: r.AnnualRent ?? r.annualRent ?? "",

//     securityDeposit: r.SecurityDeposit ?? r.securityDeposit ?? "",

//     numberOfCheques: r.NumberOfCheques ?? r.numberOfCheques ?? "",

//     paymentFrequency: r.PaymentFrequency ?? r.paymentFrequency ?? "",

//     leaseStartDate: (r.LeaseStartDate ?? r.leaseStartDate ?? "")
//         .toString()
//         .slice(0, 10),

//     leaseEndDate: (r.LeaseEndDate ?? r.leaseEndDate ?? "")
//         .toString()
//         .slice(0, 10),

//     renewalOption: r.RenewalOption ?? r.renewalOption ?? "",

//     rentIncreasePercentage:
//         r.RentIncreasePercentage ?? r.rentIncreasePercentage ?? "",

//     gracePeriod: r.GracePeriod ?? r.gracePeriod ?? "",

//     lateFeeRules: r.LateFeeRules ?? r.lateFeeRules ?? "",
// });

// // ============================================================
// // FORM -> API
// // ============================================================

// const mapFormToApiPayload = (form, { companyId, recordId, userId }) => ({
//     RentalID: form.id || 0,

//     // PropertyMaster.RecordID
//     RecordID: Number(recordId),

//     CompanyID: Number(companyId),

//     TenantName: form.tenantName || null,

//     RentalStatus: form.rentalStatus || "Vacant",

//     MonthlyRent: form.monthlyRent === "" ? null : Number(form.monthlyRent),

//     AnnualRent: form.annualRent === "" ? null : Number(form.annualRent),

//     SecurityDeposit:
//         form.securityDeposit === "" ? null : Number(form.securityDeposit),

//     NumberOfCheques:
//         form.numberOfCheques === "" ? null : Number(form.numberOfCheques),

//     PaymentFrequency: form.paymentFrequency || null,

//     RentIncreasePercentage:
//         form.rentIncreasePercentage === ""
//             ? null
//             : Number(form.rentIncreasePercentage),

//     LeaseStartDate: form.leaseStartDate || null,

//     LeaseEndDate: form.leaseEndDate || null,

//     RenewalOption: form.renewalOption || null,

//     GracePeriod: form.gracePeriod === "" ? null : Number(form.gracePeriod),

//     LateFeeRules: form.lateFeeRules || null,

//     UserID: Number(userId),
// });

// // ============================================================
// // STATUS CLASS
// // ============================================================

// const statusTagClass = (status) => {
//     switch (status) {
//         case "Occupied":
//             return "ri-tag-occupied";
//         case "Vacant":
//             return "ri-tag-vacant";
//         case "Reserved":
//             return "ri-tag-reserved";
//         case "Under Maintenance":
//             return "ri-tag-maintenance";
//         case "Blocked":
//             return "ri-tag-blocked";
//         default:
//             return "";
//     }
// };

// // ============================================================
// // COMPONENT
// // ============================================================

// const RentalInformation = () => {
//     // ========================================================
//     // PROPERTY (top level)
//     // ========================================================

//     const [properties, setProperties] = useState([]);
//     const [propertiesLoading, setPropertiesLoading] = useState(false);
//     const [selectedPropertyId, setSelectedPropertyId] = useState("");

//     // ========================================================
//     // PROPERTY MASTER (unit/flat within selected property)
//     // ========================================================

//     const [propertyMasters, setPropertyMasters] = useState([]);
//     const [mastersLoading, setMastersLoading] = useState(false);

//     // This is PropertyMaster.RecordID
//     const [selectedRecordID, setSelectedRecordID] = useState("");

//     // ========================================================
//     // RENTAL LIST
//     // ========================================================

//     const [rentals, setRentals] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [showForm, setShowForm] = useState(false);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [isFilterOpen, setIsFilterOpen] = useState(false);
//     const [filterStatus, setFilterStatus] = useState("");
//     const [filterFrequency, setFilterFrequency] = useState("");

//     // ========================================================
//     // FORM
//     // ========================================================

//     const [form, setForm] = useState(INITIAL_FORM);
//     const [saving, setSaving] = useState(false);
//     const [deleting, setDeleting] = useState(false);
//     const [errorMessage, setErrorMessage] = useState("");

//     const isEditing = form.id !== null;

//     const selectedProperty = properties.find(
//         (p) => String(p.id) === String(selectedPropertyId)
//     );

//     const selectedPropertyMaster = propertyMasters.find(
//         (p) => String(p.recordId) === String(selectedRecordID)
//     );

//     // ========================================================
//     // LOAD PROPERTIES (top-level picker)
//     // ========================================================

//     const loadProperties = async () => {
//         const companyID = getCompanyID();

//         if (!companyID) {
//             setErrorMessage("CompanyID not found. Please login again.");
//             return;
//         }

//         setPropertiesLoading(true);
//         setErrorMessage("");

//         try {
//             const response = await api.get("/api/getPropertyInfo", {
//                 params: { CompanyID: companyID },
//             });

//             const data = response.data;

//             if (data?.success) {
//                 const list = Array.isArray(data.data)
//                     ? data.data.map(mapApiProperty)
//                     : [];

//                 setProperties(list);
//             } else {
//                 setProperties([]);
//                 setErrorMessage(data?.message || "Failed to load properties.");
//             }
//         } catch (error) {
//             console.error("Load property error:", error);
//             setProperties([]);
//             setErrorMessage(
//                 error?.response?.data?.message || "Failed to load properties."
//             );
//         } finally {
//             setPropertiesLoading(false);
//         }
//     };

//     // ========================================================
//     // LOAD PROPERTY MASTER (units within selected property)
//     // ========================================================

//     const loadPropertyMasters = async (propertyId) => {
//         const companyID = getCompanyID();

//         if (!companyID || !propertyId) {
//             setPropertyMasters([]);
//             return;
//         }

//         setMastersLoading(true);
//         setErrorMessage("");

//         try {
//             const response = await api.get("/api/getPropertyMaster", {
//                 params: {
//                     CompanyID: companyID,
//                     PropertyID: propertyId,
//                 },
//             });

//             const data = response.data;

//             if (data?.success) {
//                 const list = Array.isArray(data.data)
//                     ? data.data.map(mapApiPropertyMaster)
//                     : [];

//                 setPropertyMasters(list);
//             } else {
//                 setPropertyMasters([]);
//                 setErrorMessage(
//                     data?.message || "Failed to load property master."
//                 );
//             }
//         } catch (error) {
//             console.error("Load PropertyMaster error:", error);
//             setPropertyMasters([]);
//             setErrorMessage(
//                 error?.response?.data?.message ||
//                     "Failed to load property master."
//             );
//         } finally {
//             setMastersLoading(false);
//         }
//     };

//     // ========================================================
//     // LOAD RENTALS BY PROPERTY MASTER RECORDID
//     // ========================================================

//     const loadRentals = async (recordId) => {
//         const companyID = getCompanyID();

//         if (!companyID || !recordId) {
//             setRentals([]);
//             return;
//         }

//         setLoading(true);
//         setErrorMessage("");

//         try {
//             const response = await api.get("/api/getPropertyRental", {
//                 params: {
//                     CompanyID: companyID,

//                     // PropertyMaster.RecordID
//                     RecordID: recordId,
//                 },
//             });

//             const data = response.data;

//             if (data?.success) {
//                 const list = Array.isArray(data.data)
//                     ? data.data.map(mapApiRental)
//                     : [];

//                 setRentals(list);
//             } else {
//                 setRentals([]);
//                 setErrorMessage(data?.message || "Failed to load rentals.");
//             }
//         } catch (error) {
//             console.error("Load rental error:", error);
//             setRentals([]);
//             setErrorMessage(
//                 error?.response?.data?.message || "Failed to load rentals."
//             );
//         } finally {
//             setLoading(false);
//         }
//     };

//     // ========================================================
//     // PAGE LOAD — load properties first
//     // ========================================================

//     useEffect(() => {
//         loadProperties();
//     }, []);

//     // ========================================================
//     // PROPERTY CHANGE — reset unit + reload masters for it
//     // ========================================================

//     useEffect(() => {
//         setSelectedRecordID("");
//         setPropertyMasters([]);
//         setRentals([]);
//         setShowForm(false);
//         setForm(INITIAL_FORM);
//         setSearchTerm("");
//         setFilterStatus("");
//         setFilterFrequency("");

//         if (selectedPropertyId) {
//             loadPropertyMasters(selectedPropertyId);
//         }
//     }, [selectedPropertyId]);

//     // ========================================================
//     // PROPERTY MASTER (UNIT) CHANGE — reload rentals
//     // ========================================================

//     useEffect(() => {
//         setShowForm(false);
//         setForm(INITIAL_FORM);
//         setSearchTerm("");
//         setFilterStatus("");
//         setFilterFrequency("");

//         if (selectedRecordID) {
//             loadRentals(selectedRecordID);
//         } else {
//             setRentals([]);
//         }
//     }, [selectedRecordID]);

//     // ========================================================
//     // FILTER
//     // ========================================================

//     const filteredRentals = useMemo(() => {
//         const term = searchTerm.trim().toLowerCase();

//         let base = !term
//             ? rentals
//             : rentals.filter((r) =>
//                   [r.tenantName, r.rentalStatus, String(r.id)]
//                       .filter(Boolean)
//                       .some((v) => v.toString().toLowerCase().includes(term))
//               );

//         if (filterStatus) {
//             base = base.filter((r) => r.rentalStatus === filterStatus);
//         }

//         if (filterFrequency) {
//             base = base.filter((r) => r.paymentFrequency === filterFrequency);
//         }

//         return base;
//     }, [rentals, searchTerm, filterStatus, filterFrequency]);

//     const activeFilterCount = [filterStatus, filterFrequency].filter(
//         Boolean
//     ).length;

//     // ========================================================
//     // FORM CHANGE
//     // ========================================================

//     const handleChange = (field) => (e) => {
//         setForm((prev) => ({
//             ...prev,
//             [field]: e.target.value,
//         }));
//     };

//     // ========================================================
//     // CREATE
//     // ========================================================

//     const openCreate = () => {
//         setForm(INITIAL_FORM);
//         setErrorMessage("");
//         setShowForm(true);
//     };

//     // ========================================================
//     // EDIT
//     // ========================================================

//     const openEdit = async (rental) => {
//         setErrorMessage("");
//         setForm(rental);
//         setShowForm(true);

//         try {
//             const response = await api.get("/api/getPropertyRentalByID", {
//                 params: {
//                     RentalID: rental.id,
//                     CompanyID: getCompanyID(),

//                     // PropertyMaster.RecordID
//                     RecordID: selectedRecordID,
//                 },
//             });

//             const data = response.data;

//             if (data?.success && data.data) {
//                 setForm(mapApiRental(data.data));
//             }
//         } catch (error) {
//             console.error("Load rental by id error:", error);
//             // Keep existing row data
//         }
//     };

//     // ========================================================
//     // BACK
//     // ========================================================

//     const backToList = () => {
//         setShowForm(false);
//         setForm(INITIAL_FORM);
//         setErrorMessage("");
//     };

//     // ========================================================
//     // SAVE
//     // ========================================================

//     const handleSave = async (e) => {
//         e.preventDefault();

//         const companyID = getCompanyID();
//         const userID = getUserID();

//         if (!companyID) {
//             setErrorMessage("CompanyID not found. Please login again.");
//             return;
//         }

//         if (!selectedRecordID) {
//             setErrorMessage("Please select a Property Master record first.");
//             return;
//         }

//         if (!userID) {
//             setErrorMessage("UserID not found. Please login again.");
//             return;
//         }

//         setSaving(true);
//         setErrorMessage("");

//         try {
//             const payload = mapFormToApiPayload(form, {
//                 companyId: companyID,
//                 recordId: selectedRecordID,
//                 userId: userID,
//             });

//             console.log("Property Rental Payload:", payload);

//             const response = await api.post(
//                 "/api/insertUpdatePropertyRental",
//                 payload
//             );

//             const data = response.data;

//             if (data?.success) {
//                 await loadRentals(selectedRecordID);
//                 backToList();
//             } else {
//                 setErrorMessage(data?.message || "Failed to save rental.");
//             }
//         } catch (error) {
//             console.error("Save rental error:", error);
//             setErrorMessage(
//                 error?.response?.data?.message || "Failed to save rental."
//             );
//         } finally {
//             setSaving(false);
//         }
//     };

//     // ========================================================
//     // DELETE
//     // ========================================================

//     const handleDelete = async () => {
//         if (!isEditing) return;

//         const companyID = getCompanyID();
//         const userID = getUserID();

//         if (!companyID) {
//             setErrorMessage("CompanyID not found.");
//             return;
//         }

//         if (!selectedRecordID) {
//             setErrorMessage("Property Master record is required.");
//             return;
//         }

//         if (!userID) {
//             setErrorMessage("UserID not found.");
//             return;
//         }

//         setDeleting(true);
//         setErrorMessage("");

//         try {
//             const response = await api.delete("/api/deletePropertyRental", {
//                 data: {
//                     RentalID: form.id,
//                     CompanyID: companyID,

//                     // PropertyMaster.RecordID
//                     RecordID: selectedRecordID,

//                     UserID: userID,
//                 },
//             });

//             const data = response.data;

//             if (data?.success) {
//                 await loadRentals(selectedRecordID);
//                 backToList();
//             } else {
//                 setErrorMessage(data?.message || "Failed to delete rental.");
//             }
//         } catch (error) {
//             console.error("Delete rental error:", error);
//             setErrorMessage(
//                 error?.response?.data?.message || "Failed to delete rental."
//             );
//         } finally {
//             setDeleting(false);
//         }
//     };

//     return (
//         <div className="ri-root">
//             <style>{`
//                 :root{
//                     --ri-primary:#10299b;
//                     --ri-primary-dark:#0b1c6e;
//                     --ri-primary-mid:#4a5fc1;
//                     --ri-primary-soft:#eef1fb;
//                     --ri-primary-tint:#d6ddf5;
//                     --ri-ink:#1a1f36;
//                     --ri-muted:#6b7290;
//                     --ri-green:#1a9e6c;
//                     --ri-green-soft:#e6f7f0;
//                     --ri-amber:#c07a00;
//                     --ri-amber-soft:#fdf3df;
//                     --ri-red:#dc2626;
//                     --ri-red-soft:#fdecec;
//                     --ri-slate:#475569;
//                     --ri-slate-soft:#eef2f6;
//                 }

//                 .ri-root{
//                     font-family:"Inter",system-ui,-apple-system,"Segoe UI",sans-serif;
//                     color:var(--ri-ink);
//                 }

//                 .ri-root *{ box-sizing:border-box; }

//                 .ri-alert{
//                     display:flex; align-items:center; gap:10px;
//                     background:var(--ri-red-soft); color:var(--ri-red);
//                     border:1px solid #f5b8b8; border-radius:10px;
//                     padding:10px 14px; font-size:.83rem; font-weight:600;
//                     margin-bottom:14px;
//                 }

//                 .ri-loading{
//                     text-align:center; padding:40px 20px; color:var(--ri-muted); font-size:.85rem;
//                 }

//                 .ri-property-picker{
//                     display:flex; align-items:flex-start; gap:16px; flex-wrap:wrap;
//                     background:#fff; border:1px solid var(--ri-primary-tint);
//                     border-radius:14px; padding:14px 16px; margin-bottom:18px;
//                     box-shadow:0 4px 18px rgba(16,41,155,.06);
//                 }

//                 .ri-property-picker .ri-field{ flex:1; min-width:260px; margin:0; }

//                 .ri-property-info{
//                     display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;
//                     font-size:.75rem; color:var(--ri-muted);
//                 }

//                 .ri-property-badge{
//                     background:var(--ri-primary-soft); color:var(--ri-primary-dark);
//                     padding:4px 9px; border-radius:6px; font-weight:700;
//                 }

//                 .ri-empty-state{
//                     text-align:center; padding:45px 20px; color:var(--ri-muted);
//                     background:#fff; border:1px solid var(--ri-primary-tint); border-radius:16px;
//                 }
//                 .ri-empty-state i{ font-size:1.9rem; color:var(--ri-primary-tint); margin-bottom:8px; display:block; }
//                 .ri-empty-state .ri-empty-title{ font-weight:700; color:var(--ri-primary-dark); font-size:.9rem; }

//                 .ri-toolbar{ display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin-bottom:16px; }
//                 .ri-search-wrap{ position:relative; flex:1; min-width:220px; }
//                 .ri-search-wrap i{ position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--ri-primary-mid); font-size:.85rem; }
//                 .ri-search-input{
//                     width:100%; border:1px solid var(--ri-primary-tint); border-radius:9px;
//                     padding:9px 12px 9px 34px; font-size:.85rem; background:var(--ri-primary-soft); outline:none;
//                 }
//                 .ri-search-input:focus{ border-color:var(--ri-primary); background:#fff; }

//                 .ri-toolbar-btn{
//                     display:flex; align-items:center; gap:7px; border-radius:9px; padding:9px 16px;
//                     font-size:.83rem; font-weight:700; white-space:nowrap;
//                     border:1.5px solid var(--ri-primary); background:#fff; color:var(--ri-primary);
//                     cursor:pointer; position:relative;
//                 }
//                 .ri-toolbar-btn:hover{ background:var(--ri-primary-soft); }
//                 .ri-toolbar-btn.ri-btn-solid{ background:var(--ri-primary); color:#fff; }
//                 .ri-toolbar-btn.ri-btn-solid:hover{ background:var(--ri-primary-dark); }

//                 .ri-filter-badge{
//                     position:absolute; top:-6px; right:-6px; background:var(--ri-red); color:#fff;
//                     width:17px; height:17px; border-radius:50%; font-size:9px; font-weight:700;
//                     display:flex; align-items:center; justify-content:center;
//                 }

//                 .ri-table-card{
//                     background:#fff; border:1px solid var(--ri-primary-tint); border-radius:16px;
//                     overflow:hidden; box-shadow:0 4px 18px rgba(16,41,155,.06);
//                 }
//                 .ri-table{ width:100%; border-collapse:collapse; margin:0; }
//                 .ri-table thead th{
//                     background:var(--ri-primary-soft); color:var(--ri-primary-dark);
//                     font-size:.7rem; font-weight:700; text-transform:uppercase; letter-spacing:.5px;
//                     padding:12px 16px; text-align:left; border-bottom:2px solid var(--ri-primary-tint); white-space:nowrap;
//                 }
//                 .ri-table tbody td{ padding:12px 16px; font-size:.84rem; border-bottom:1px solid #f0f2fa; vertical-align:middle; }
//                 .ri-table tbody tr{ cursor:pointer; transition:background .15s ease; }
//                 .ri-table tbody tr:nth-child(even){ background:#f8f9fd; }
//                 .ri-table tbody tr:hover{ background:var(--ri-primary-soft); }
//                 .ri-row-name{ font-weight:700; color:var(--ri-ink); }
//                 .ri-row-sub{ font-size:.74rem; color:var(--ri-muted); }

//                 .ri-tag{ display:inline-block; font-size:.72rem; font-weight:700; padding:3px 10px; border-radius:999px; background:var(--ri-primary-soft); color:var(--ri-primary-mid); }
//                 .ri-tag-occupied{ background:var(--ri-green-soft); color:var(--ri-green); }
//                 .ri-tag-vacant{ background:var(--ri-slate-soft); color:var(--ri-slate); }
//                 .ri-tag-reserved{ background:var(--ri-amber-soft); color:var(--ri-amber); }
//                 .ri-tag-maintenance{ background:#fdecec; color:#b45309; }
//                 .ri-tag-blocked{ background:var(--ri-red-soft); color:var(--ri-red); }

//                 .ri-empty{ text-align:center; padding:48px 20px; color:var(--ri-muted); }
//                 .ri-empty i{ font-size:1.9rem; color:var(--ri-primary-tint); margin-bottom:8px; display:block; }
//                 .ri-empty-title{ font-weight:700; color:var(--ri-primary-dark); font-size:.9rem; }

//                 .ri-modal-backdrop{ position:fixed; inset:0; z-index:1050; background:rgba(15,20,50,.5); display:flex; align-items:center; justify-content:center; padding:20px; }
//                 .ri-modal-card{ background:#fff; border-radius:16px; width:100%; max-width:420px; box-shadow:0 20px 50px rgba(16,41,155,.25); overflow:hidden; }
//                 .ri-modal-head{ display:flex; align-items:center; justify-content:space-between; padding:16px 20px; background:linear-gradient(135deg, var(--ri-primary) 0%, var(--ri-primary-dark) 100%); color:#fff; }
//                 .ri-modal-head-title{ font-size:.95rem; font-weight:700; margin:0; }
//                 .ri-modal-close{ border:none; background:rgba(255,255,255,.15); color:#fff; width:26px; height:26px; border-radius:7px; cursor:pointer; }
//                 .ri-modal-body{ padding:18px 20px; display:flex; flex-direction:column; gap:14px; }
//                 .ri-modal-footer{ display:flex; justify-content:space-between; gap:10px; padding:14px 20px; border-top:1px solid var(--ri-primary-soft); }

//                 .ri-form-header{ display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; gap:12px; flex-wrap:wrap; }
//                 .ri-form-title{ font-size:1.05rem; font-weight:700; color:var(--ri-primary-dark); margin:0; }
//                 .ri-form-subtitle{ font-size:.78rem; color:var(--ri-muted); margin-top:2px; }
//                 .ri-back-btn{
//                     display:flex; align-items:center; gap:7px; border:1.5px solid var(--ri-primary);
//                     background:#fff; color:var(--ri-primary); border-radius:9px; padding:8px 16px;
//                     font-size:.83rem; font-weight:700; cursor:pointer;
//                 }
//                 .ri-back-btn:hover{ background:var(--ri-primary-soft); }

//                 .ri-section{ margin-bottom:26px; }
//                 .ri-section-head{ display:flex; align-items:center; gap:10px; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid var(--ri-primary-tint); }
//                 .ri-section-icon{ width:34px; height:34px; border-radius:9px; background:var(--ri-primary-soft); color:var(--ri-primary); display:flex; align-items:center; justify-content:center; font-size:.95rem; flex-shrink:0; }
//                 .ri-section-title{ font-size:.95rem; font-weight:700; color:var(--ri-primary-dark); margin:0; }
//                 .ri-section-sub{ font-size:.76rem; color:var(--ri-muted); margin-top:1px; }

//                 .ri-grid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(230px,1fr)); gap:16px 18px; }
//                 .ri-field.ri-field-wide{ grid-column:1 / -1; }
//                 .ri-field label{ display:block; font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.4px; color:var(--ri-primary-mid); margin-bottom:6px; }

//                 .ri-input, .ri-select, .ri-textarea{
//                     width:100%; border:1px solid var(--ri-primary-tint); border-radius:9px; padding:12px 16px;
//                     font-size:1.05rem; color:var(--ri-ink); background:#fff; outline:none;
//                     transition:border-color .15s ease, box-shadow .15s ease; font-family:inherit;
//                 }
//                 .ri-textarea{ resize:vertical; min-height:140px; }
//                 .ri-input:focus, .ri-select:focus, .ri-textarea:focus{ border-color:var(--ri-primary); box-shadow:0 0 0 3px rgba(16,41,155,.12); }
//                 .ri-input:disabled, .ri-select:disabled{ background:var(--ri-primary-soft); color:var(--ri-muted); cursor:not-allowed; }

//                 .ri-input-prefix-wrap{ position:relative; }
//                 .ri-input-prefix-wrap span{ position:absolute; left:16px; top:50%; transform:translateY(-50%); font-size:.9rem; color:var(--ri-muted); font-weight:700; }
//                 .ri-input-prefix-wrap input{ padding-left:48px; }

//                 .ri-footer{ display:flex; align-items:center; gap:10px; padding-top:18px; border-top:1px solid var(--ri-primary-tint); flex-wrap:wrap; }
//                 .ri-btn{ border:none; border-radius:10px; padding:10px 20px; font-size:.85rem; font-weight:700; transition:all .15s ease; cursor:pointer; }
//                 .ri-btn-primary{ background:var(--ri-primary); color:#fff; }
//                 .ri-btn-primary:hover:not(:disabled){ background:var(--ri-primary-dark); box-shadow:0 4px 10px rgba(16,41,155,.25); }
//                 .ri-btn-primary:disabled{ opacity:.6; cursor:default; }
//                 .ri-btn-ghost{ background:var(--ri-primary-soft); color:var(--ri-primary); }
//                 .ri-btn-ghost:hover{ background:var(--ri-primary-tint); }
//                 .ri-btn-danger{ background:#fff; color:var(--ri-red); border:1.5px solid #f5b8b8; }
//                 .ri-btn-danger:hover:not(:disabled){ background:var(--ri-red-soft); }
//                 .ri-btn-danger:disabled{ opacity:.6; cursor:default; }
//             `}</style>

//             {/* ==================================================
//                 ERROR
//             ================================================== */}

//             {errorMessage && (
//                 <div className="ri-alert">
//                     <i className="bi bi-exclamation-triangle"></i>
//                     {errorMessage}
//                 </div>
//             )}

//             {/* ==================================================
//                 PROPERTY -> PROPERTY MASTER (UNIT) PICKER
//             ================================================== */}

//             <div className="ri-property-picker">
//                 <div className="ri-field">
//                     <label>Property</label>
//                     <select
//                         className="ri-select"
//                         value={selectedPropertyId}
//                         onChange={(e) => setSelectedPropertyId(e.target.value)}
//                         disabled={propertiesLoading}
//                     >
//                         <option value="">
//                             {propertiesLoading ? "Loading properties…" : "Select a property"}
//                         </option>
//                         {properties.map((p) => (
//                             <option key={p.id} value={p.id}>{p.label}</option>
//                         ))}
//                     </select>
//                 </div>

//                 {selectedPropertyId && (
//                     <div className="ri-field">
//                         <label>Unit / Property Master</label>
//                         <select
//                             className="ri-select"
//                             value={selectedRecordID}
//                             onChange={(e) => setSelectedRecordID(e.target.value)}
//                             disabled={mastersLoading}
//                         >
//                             <option value="">
//                                 {mastersLoading ? "Loading units…" : "Select a unit"}
//                             </option>
//                             {propertyMasters.map((p) => (
//                                 <option key={p.recordId} value={p.recordId}>
//                                     {p.flatNo || `Record #${p.recordId}`}
//                                     {p.flatType ? ` - ${p.flatType}` : ""}
//                                     {p.tenantName ? ` - ${p.tenantName}` : ""}
//                                 </option>
//                             ))}
//                         </select>

//                         {selectedPropertyMaster && (
//                             <div className="ri-property-info">
//                                 <span className="ri-property-badge">
//                                     Record ID: {selectedPropertyMaster.recordId}
//                                 </span>
//                                 {selectedPropertyMaster.flatNo && (
//                                     <span className="ri-property-badge">
//                                         Flat: {selectedPropertyMaster.flatNo}
//                                     </span>
//                                 )}
//                                 {selectedPropertyMaster.flatType && (
//                                     <span className="ri-property-badge">
//                                         Type: {selectedPropertyMaster.flatType}
//                                     </span>
//                                 )}
//                             </div>
//                         )}
//                     </div>
//                 )}
//             </div>

//             {/* ==================================================
//                 EMPTY STATES / MAIN CONTENT
//             ================================================== */}

//             {!selectedPropertyId ? (
//                 <div className="ri-empty-state">
//                     <i className="bi bi-building"></i>
//                     <div className="ri-empty-title">Select a property to continue</div>
//                     <div>Choose a property, then a unit, to view its rentals.</div>
//                 </div>
//             ) : !selectedRecordID ? (
//                 <div className="ri-empty-state">
//                     <i className="bi bi-door-open"></i>
//                     <div className="ri-empty-title">Select a unit / Property Master record</div>
//                     <div>Rental records are tied to PropertyMaster.RecordID.</div>
//                 </div>
//             ) : !showForm ? (
//                 <>
//                     {/* TOOLBAR */}
//                     <div className="ri-toolbar">
//                         <div className="ri-search-wrap">
//                             <i className="bi bi-search"></i>
//                             <input
//                                 type="text"
//                                 className="ri-search-input"
//                                 placeholder="Search tenant, status, rental ID…"
//                                 value={searchTerm}
//                                 onChange={(e) => setSearchTerm(e.target.value)}
//                             />
//                         </div>

//                         <button
//                             type="button"
//                             className="ri-toolbar-btn"
//                             onClick={() => setIsFilterOpen(true)}
//                         >
//                             <i className="bi bi-funnel"></i>
//                             Filters
//                             {activeFilterCount > 0 && (
//                                 <span className="ri-filter-badge">{activeFilterCount}</span>
//                             )}
//                         </button>

//                         <button
//                             type="button"
//                             className="ri-toolbar-btn ri-btn-solid"
//                             onClick={openCreate}
//                         >
//                             <i className="bi bi-plus-lg"></i>
//                             Create New
//                         </button>
//                     </div>

//                     {/* TABLE */}
//                     <div className="ri-table-card">
//                         {loading ? (
//                             <div className="ri-loading">Loading rentals…</div>
//                         ) : (
//                             <div className="table-responsive" style={{ maxHeight: "60vh" }}>
//                                 <table className="ri-table">
//                                     <thead>
//                                         <tr>
//                                             <th>Rental #</th>
//                                             <th>Tenant</th>
//                                             <th>Status</th>
//                                             <th>Monthly Rent</th>
//                                             <th>Payment Frequency</th>
//                                             <th>Lease Period</th>
//                                         </tr>
//                                     </thead>
//                                     <tbody>
//                                         {filteredRentals.length === 0 && (
//                                             <tr>
//                                                 <td colSpan={6}>
//                                                     <div className="ri-empty">
//                                                         <i className="bi bi-key"></i>
//                                                         <div className="ri-empty-title">No rentals found</div>
//                                                         <div>
//                                                             Try adjusting your search or create a new rental record.
//                                                         </div>
//                                                     </div>
//                                                 </td>
//                                             </tr>
//                                         )}

//                                         {filteredRentals.map((r) => (
//                                             <tr key={r.id} onClick={() => openEdit(r)}>
//                                                 <td className="ri-row-sub">
//                                                     RNT-{String(r.id).padStart(4, "0")}
//                                                 </td>
//                                                 <td>
//                                                     <div className="ri-row-name">{r.tenantName || "—"}</div>
//                                                 </td>
//                                                 <td>
//                                                     <span className={`ri-tag ${statusTagClass(r.rentalStatus)}`}>
//                                                         {r.rentalStatus || "—"}
//                                                     </span>
//                                                 </td>
//                                                 <td>{r.monthlyRent ? `AED ${r.monthlyRent}` : "—"}</td>
//                                                 <td>{r.paymentFrequency || "—"}</td>
//                                                 <td>
//                                                     {r.leaseStartDate || r.leaseEndDate
//                                                         ? `${r.leaseStartDate || "—"} → ${r.leaseEndDate || "—"}`
//                                                         : "—"}
//                                                 </td>
//                                             </tr>
//                                         ))}
//                                     </tbody>
//                                 </table>
//                             </div>
//                         )}
//                     </div>

//                     {/* FILTER MODAL */}
//                     {isFilterOpen && (
//                         <div className="ri-modal-backdrop" onClick={() => setIsFilterOpen(false)}>
//                             <div className="ri-modal-card" onClick={(e) => e.stopPropagation()}>
//                                 <div className="ri-modal-head">
//                                     <p className="ri-modal-head-title">Filter Rentals</p>
//                                     <button className="ri-modal-close" onClick={() => setIsFilterOpen(false)}>
//                                         <i className="bi bi-x-lg"></i>
//                                     </button>
//                                 </div>
//                                 <div className="ri-modal-body">
//                                     <div className="ri-field">
//                                         <label>Rental Status</label>
//                                         <select
//                                             className="ri-select"
//                                             value={filterStatus}
//                                             onChange={(e) => setFilterStatus(e.target.value)}
//                                         >
//                                             <option value="">All statuses</option>
//                                             {RENTAL_STATUSES.map((s) => (
//                                                 <option key={s} value={s}>{s}</option>
//                                             ))}
//                                         </select>
//                                     </div>
//                                     <div className="ri-field">
//                                         <label>Payment Frequency</label>
//                                         <select
//                                             className="ri-select"
//                                             value={filterFrequency}
//                                             onChange={(e) => setFilterFrequency(e.target.value)}
//                                         >
//                                             <option value="">All frequencies</option>
//                                             {PAYMENT_FREQUENCIES.map((f) => (
//                                                 <option key={f} value={f}>{f}</option>
//                                             ))}
//                                         </select>
//                                     </div>
//                                 </div>
//                                 <div className="ri-modal-footer">
//                                     <button
//                                         type="button"
//                                         className="ri-btn ri-btn-ghost"
//                                         onClick={() => {
//                                             setFilterStatus("");
//                                             setFilterFrequency("");
//                                         }}
//                                     >
//                                         Clear All
//                                     </button>
//                                     <button
//                                         type="button"
//                                         className="ri-btn ri-btn-primary"
//                                         onClick={() => setIsFilterOpen(false)}
//                                     >
//                                         Apply Filters
//                                     </button>
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                 </>
//             ) : (
//                 <>
//                     {/* FORM HEADER */}
//                     <div className="ri-form-header">
//                         <div>
//                             <p className="ri-form-title">
//                                 {isEditing ? "Edit Rental" : "New Rental"}
//                             </p>
//                             <div className="ri-form-subtitle">
//                                 {selectedProperty ? selectedProperty.label : `Property #${selectedPropertyId}`}
//                                 {" · "}
//                                 {selectedPropertyMaster
//                                     ? selectedPropertyMaster.flatNo ||
//                                       `Record #${selectedPropertyMaster.recordId}`
//                                     : `#${selectedRecordID}`}
//                             </div>
//                         </div>
//                         <button type="button" className="ri-back-btn" onClick={backToList}>
//                             <i className="bi bi-arrow-left"></i>
//                             Back to List
//                         </button>
//                     </div>

//                     <form onSubmit={handleSave}>
//                         {/* RENTAL OVERVIEW */}
//                         <div className="ri-section">
//                             <div className="ri-section-head">
//                                 <div className="ri-section-icon">
//                                     <i className="bi bi-key"></i>
//                                 </div>
//                                 <div>
//                                     <p className="ri-section-title">Rental Overview</p>
//                                     <div className="ri-section-sub">
//                                         Current status and tenant for this rental
//                                     </div>
//                                 </div>
//                             </div>

//                             <div className="ri-grid">
//                                 <div className="ri-field">
//                                     <label>Tenant Name</label>
//                                     <input
//                                         type="text"
//                                         className="ri-input"
//                                         value={form.tenantName}
//                                         onChange={handleChange("tenantName")}
//                                         placeholder="e.g. Ahmed Al Farsi"
//                                     />
//                                 </div>

//                                 <div className="ri-field">
//                                     <label>Rental Status</label>
//                                     <select
//                                         className="ri-select"
//                                         value={form.rentalStatus}
//                                         onChange={handleChange("rentalStatus")}
//                                     >
//                                         <option value="">Select status</option>
//                                         {RENTAL_STATUSES.map((s) => (
//                                             <option key={s} value={s}>{s}</option>
//                                         ))}
//                                     </select>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* RENT & PAYMENT */}
//                         <div className="ri-section">
//                             <div className="ri-section-head">
//                                 <div className="ri-section-icon">
//                                     <i className="bi bi-cash-coin"></i>
//                                 </div>
//                                 <div>
//                                     <p className="ri-section-title">Rent & Payment Terms</p>
//                                     <div className="ri-section-sub">
//                                         Rent amounts, deposit and payment collection
//                                     </div>
//                                 </div>
//                             </div>

//                             <div className="ri-grid">
//                                 <div className="ri-field">
//                                     <label>Monthly Rent</label>
//                                     <div className="ri-input-prefix-wrap">
//                                         <span>AED</span>
//                                         <input
//                                             type="number"
//                                             className="ri-input"
//                                             value={form.monthlyRent}
//                                             onChange={handleChange("monthlyRent")}
//                                             placeholder="e.g. 8500"
//                                         />
//                                     </div>
//                                 </div>

//                                 <div className="ri-field">
//                                     <label>Annual Rent</label>
//                                     <div className="ri-input-prefix-wrap">
//                                         <span>AED</span>
//                                         <input
//                                             type="number"
//                                             className="ri-input"
//                                             value={form.annualRent}
//                                             onChange={handleChange("annualRent")}
//                                             placeholder="e.g. 102000"
//                                         />
//                                     </div>
//                                 </div>

//                                 <div className="ri-field">
//                                     <label>Security Deposit</label>
//                                     <div className="ri-input-prefix-wrap">
//                                         <span>AED</span>
//                                         <input
//                                             type="number"
//                                             className="ri-input"
//                                             value={form.securityDeposit}
//                                             onChange={handleChange("securityDeposit")}
//                                             placeholder="e.g. 8500"
//                                         />
//                                     </div>
//                                 </div>

//                                 <div className="ri-field">
//                                     <label>Number of Cheques</label>
//                                     <input
//                                         type="number"
//                                         className="ri-input"
//                                         value={form.numberOfCheques}
//                                         onChange={handleChange("numberOfCheques")}
//                                         placeholder="e.g. 4"
//                                     />
//                                 </div>

//                                 <div className="ri-field">
//                                     <label>Payment Frequency</label>
//                                     <select
//                                         className="ri-select"
//                                         value={form.paymentFrequency}
//                                         onChange={handleChange("paymentFrequency")}
//                                     >
//                                         <option value="">Select frequency</option>
//                                         {PAYMENT_FREQUENCIES.map((f) => (
//                                             <option key={f} value={f}>{f}</option>
//                                         ))}
//                                     </select>
//                                 </div>

//                                 <div className="ri-field">
//                                     <label>Rent Increase Percentage</label>
//                                     <div className="ri-input-prefix-wrap">
//                                         <span>%</span>
//                                         <input
//                                             type="number"
//                                             className="ri-input"
//                                             value={form.rentIncreasePercentage}
//                                             onChange={handleChange("rentIncreasePercentage")}
//                                             placeholder="e.g. 5"
//                                         />
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* LEASE */}
//                         <div className="ri-section">
//                             <div className="ri-section-head">
//                                 <div className="ri-section-icon">
//                                     <i className="bi bi-calendar3"></i>
//                                 </div>
//                                 <div>
//                                     <p className="ri-section-title">Lease Term & Renewal</p>
//                                     <div className="ri-section-sub">
//                                         Contract duration and renewal terms
//                                     </div>
//                                 </div>
//                             </div>

//                             <div className="ri-grid">
//                                 <div className="ri-field">
//                                     <label>Lease Start Date</label>
//                                     <input
//                                         type="date"
//                                         className="ri-input"
//                                         value={form.leaseStartDate}
//                                         onChange={handleChange("leaseStartDate")}
//                                     />
//                                 </div>

//                                 <div className="ri-field">
//                                     <label>Lease End Date</label>
//                                     <input
//                                         type="date"
//                                         className="ri-input"
//                                         value={form.leaseEndDate}
//                                         onChange={handleChange("leaseEndDate")}
//                                     />
//                                 </div>

//                                 <div className="ri-field">
//                                     <label>Renewal Option</label>
//                                     <select
//                                         className="ri-select"
//                                         value={form.renewalOption}
//                                         onChange={handleChange("renewalOption")}
//                                     >
//                                         <option value="">Select renewal option</option>
//                                         {RENEWAL_OPTIONS.map((o) => (
//                                             <option key={o} value={o}>{o}</option>
//                                         ))}
//                                     </select>
//                                 </div>

//                                 <div className="ri-field">
//                                     <label>Grace Period (days)</label>
//                                     <input
//                                         type="number"
//                                         min="0"
//                                         className="ri-input"
//                                         value={form.gracePeriod}
//                                         onChange={handleChange("gracePeriod")}
//                                         placeholder="e.g. 5"
//                                     />
//                                 </div>
//                             </div>
//                         </div>

//                         {/* LATE PAYMENT */}
//                         <div className="ri-section">
//                             <div className="ri-section-head">
//                                 <div className="ri-section-icon">
//                                     <i className="bi bi-exclamation-octagon"></i>
//                                 </div>
//                                 <div>
//                                     <p className="ri-section-title">Late Payment Rules</p>
//                                     <div className="ri-section-sub">
//                                         How late fees are calculated and applied
//                                     </div>
//                                 </div>
//                             </div>

//                             <div className="ri-grid">
//                                 <div className="ri-field ri-field-wide">
//                                     <label>Late Fee Rules</label>
//                                     <textarea
//                                         className="ri-textarea"
//                                         value={form.lateFeeRules}
//                                         onChange={handleChange("lateFeeRules")}
//                                         placeholder="e.g. AED 200 flat fee after grace period, plus 1% per week thereafter."
//                                     />
//                                 </div>
//                             </div>
//                         </div>

//                         {/* FOOTER */}
//                         <div className="ri-footer">
//                             <button type="submit" className="ri-btn ri-btn-primary" disabled={saving}>
//                                 <i
//                                     className={`bi ${saving ? "bi-hourglass-split" : "bi-check2-circle"} me-2`}
//                                 ></i>
//                                 {saving ? "Saving…" : isEditing ? "Update Rental" : "Save Rental"}
//                             </button>

//                             {isEditing && (
//                                 <button
//                                     type="button"
//                                     className="ri-btn ri-btn-danger"
//                                     onClick={handleDelete}
//                                     disabled={deleting}
//                                 >
//                                     <i
//                                         className={`bi ${deleting ? "bi-hourglass-split" : "bi-trash3"} me-2`}
//                                     ></i>
//                                     {deleting ? "Deleting…" : "Delete"}
//                                 </button>
//                             )}

//                             <button
//                                 type="button"
//                                 className="ri-btn ri-btn-ghost"
//                                 onClick={backToList}
//                                 disabled={saving || deleting}
//                             >
//                                 Cancel
//                             </button>
//                         </div>
//                     </form>
//                 </>
//             )}
//         </div>
//     );
// };

// export default RentalInformation;
import { useEffect, useMemo, useState } from "react";
import api from "../../apiService";

const RENTAL_STATUSES = [
    "Occupied",
    "Vacant",
    "Reserved",
    "Under Maintenance",
    "Blocked",
];

const PAYMENT_FREQUENCIES = [
    "Monthly",
    "Quarterly",
    "Half-Yearly",
    "Yearly",
];

const RENEWAL_OPTIONS = [
    "Automatic Renewal",
    "Tenant Option to Renew",
    "Landlord Option to Renew",
    "No Renewal",
];

const INITIAL_FORM = {
    id: null, // RentalID
    recordId: "", // PropertyMaster.RecordID (unit) — chosen inside the form
    tenantUserId: "",
    tenantName: "",
    rentalStatus: "",
    monthlyRent: "",
    annualRent: "",
    securityDeposit: "",
    numberOfCheques: "",
    paymentFrequency: "",
    leaseStartDate: "",
    leaseEndDate: "",
    renewalOption: "",
    rentIncreasePercentage: "",
    gracePeriod: "",
    lateFeeRules: "",
};

const getCompanyID = () => Number(sessionStorage.getItem("CompanyID")) || 0;
const getUserID = () => Number(sessionStorage.getItem("UserId")) || 0;

// ============================================================
// PROPERTY (top level) -> UI
// ============================================================

const mapApiProperty = (p) => ({
    id: p.PropertyID ?? p.propertyId ?? p.id,
    label:
        p.PropertyName ??
        p.PropertyLabel ??
        p.propertyLabel ??
        p.Name ??
        `Property #${p.PropertyID ?? p.id}`,
});

// ============================================================
// PROPERTY MASTER (unit/flat within a property) -> UI
// ============================================================

const mapApiPropertyMaster = (p) => ({
    recordId: p.RecordID ?? p.recordID ?? p.recordId ?? p.id,

    propertyId: p.PropertyID ?? p.propertyID ?? p.propertyId ?? null,

    flatNo: p.FlatNo ?? p.flatNo ?? "",

    tenantName: p.TenantName ?? p.tenantName ?? "",

    flatType: p.FlatType ?? p.flatType ?? "",

    rentalAmount: p.RentalAmount ?? p.rentalAmount ?? "",
});

// ============================================================
// RENTAL API -> FORM
// ============================================================

const mapApiRental = (r) => ({
    id: r.RentalID ?? r.rentalID ?? r.rentalId ?? null,

    recordId: r.RecordID ?? r.recordID ?? r.recordId ?? "",

    tenantName: r.TenantName ?? r.tenantName ?? "",

    rentalStatus: r.RentalStatus ?? r.rentalStatus ?? "",

    monthlyRent: r.MonthlyRent ?? r.monthlyRent ?? "",

    annualRent: r.AnnualRent ?? r.annualRent ?? "",

    securityDeposit: r.SecurityDeposit ?? r.securityDeposit ?? "",

    numberOfCheques: r.NumberOfCheques ?? r.numberOfCheques ?? "",

    paymentFrequency: r.PaymentFrequency ?? r.paymentFrequency ?? "",

    leaseStartDate: (r.LeaseStartDate ?? r.leaseStartDate ?? "")
        .toString()
        .slice(0, 10),

    leaseEndDate: (r.LeaseEndDate ?? r.leaseEndDate ?? "")
        .toString()
        .slice(0, 10),

    renewalOption: r.RenewalOption ?? r.renewalOption ?? "",

    rentIncreasePercentage:
        r.RentIncreasePercentage ?? r.rentIncreasePercentage ?? "",

    gracePeriod: r.GracePeriod ?? r.gracePeriod ?? "",

    lateFeeRules: r.LateFeeRules ?? r.lateFeeRules ?? "",
});

// ============================================================
// FORM -> API
// ============================================================

const mapFormToApiPayload = (form, { companyId, propertyId, userId }) => ({
    RentalID: form.id || 0,

    // PropertyMaster.RecordID — the unit chosen inside the form
    RecordID: Number(form.recordId),

    CompanyID: Number(companyId),

    // Top-level Property.PropertyID (required by backend validation)
    PropertyID: Number(propertyId),

    TenantName: form.tenantName || null,
    TenantUserID: form.tenantUserId ? Number(form.tenantUserId) : null,

    RentalStatus: form.rentalStatus || "Vacant",

    MonthlyRent: form.monthlyRent === "" ? null : Number(form.monthlyRent),

    AnnualRent: form.annualRent === "" ? null : Number(form.annualRent),

    SecurityDeposit:
        form.securityDeposit === "" ? null : Number(form.securityDeposit),

    NumberOfCheques:
        form.numberOfCheques === "" ? null : Number(form.numberOfCheques),

    PaymentFrequency: form.paymentFrequency || null,

    RentIncreasePercentage:
        form.rentIncreasePercentage === ""
            ? null
            : Number(form.rentIncreasePercentage),

    LeaseStartDate: form.leaseStartDate || null,

    LeaseEndDate: form.leaseEndDate || null,

    RenewalOption: form.renewalOption || null,

    GracePeriod: form.gracePeriod === "" ? null : Number(form.gracePeriod),

    LateFeeRules: form.lateFeeRules || null,

    UserID: Number(userId),
});

// ============================================================
// STATUS CLASS
// ============================================================

const statusTagClass = (status) => {
    switch (status) {
        case "Occupied":
            return "ri-tag-occupied";
        case "Vacant":
            return "ri-tag-vacant";
        case "Reserved":
            return "ri-tag-reserved";
        case "Under Maintenance":
            return "ri-tag-maintenance";
        case "Blocked":
            return "ri-tag-blocked";
        default:
            return "";
    }
};

// ============================================================
// COMPONENT
// ============================================================

const RentalInformation = () => {
    // ========================================================
    // PROPERTY (top level)
    // ========================================================

    const [properties, setProperties] = useState([]);
    const [propertiesLoading, setPropertiesLoading] = useState(false);
    const [selectedPropertyId, setSelectedPropertyId] = useState("");

    // ========================================================
    // PROPERTY MASTER (units within selected property)
    // Loaded once a property is chosen so the Create/Edit form
    // can offer a unit picker.
    // ========================================================

    const [propertyMasters, setPropertyMasters] = useState([]);
    const [mastersLoading, setMastersLoading] = useState(false);
    const [tenantUsers, setTenantUsers] = useState([]);
    const [tenantsLoading, setTenantsLoading] = useState(false);

    // ========================================================
    // RENTAL LIST (all rentals for the selected property)
    // ========================================================

    const [rentals, setRentals] = useState([]);
    const occupiedRecordIds = useMemo(() => new Set(
        rentals
            .filter((rental) => String(rental.rentalStatus).toLowerCase() === "occupied")
            .map((rental) => String(rental.recordId))
    ), [rentals]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState("");
    const [filterFrequency, setFilterFrequency] = useState("");

    // ========================================================
    // FORM
    // ========================================================

    const [form, setForm] = useState(INITIAL_FORM);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const isEditing = form.id !== null;

    const selectedProperty = properties.find(
        (p) => String(p.id) === String(selectedPropertyId)
    );

    // The unit currently chosen inside the form
    const selectedFormMaster = propertyMasters.find(
        (p) => String(p.recordId) === String(form.recordId)
    );
    const getUnitLabel = (recordId) => {
        const unit = propertyMasters.find(
            (item) => String(item.recordId) === String(recordId)
        );
        return unit
            ? [unit.flatNo || `Record #${unit.recordId}`, unit.flatType].filter(Boolean).join(" - ")
            : `Record #${recordId}`;
    };

    // ========================================================
    // LOAD PROPERTIES (top-level picker)
    // ========================================================

    const loadProperties = async () => {
        const companyID = getCompanyID();

        if (!companyID) {
            setErrorMessage("CompanyID not found. Please login again.");
            return;
        }

        setPropertiesLoading(true);
        setErrorMessage("");

        try {
            const response = await api.get("/api/getPropertyInfo", {
                params: { CompanyID: companyID },
            });

            const data = response.data;

            if (data?.success) {
                const list = Array.isArray(data.data)
                    ? data.data.map(mapApiProperty)
                    : [];

                setProperties(list);
            } else {
                setProperties([]);
                setErrorMessage(data?.message || "Failed to load properties.");
            }
        } catch (error) {
            console.error("Load property error:", error);
            setProperties([]);
            setErrorMessage(
                error?.response?.data?.message || "Failed to load properties."
            );
        } finally {
            setPropertiesLoading(false);
        }
    };

    // ========================================================
    // LOAD PROPERTY MASTER (units within selected property)
    // Used to populate the unit picker inside the form.
    // ========================================================

    const loadPropertyMasters = async (propertyId) => {
        const companyID = getCompanyID();

        if (!companyID || !propertyId) {
            setPropertyMasters([]);
            return;
        }

        setMastersLoading(true);

        try {
            const response = await api.get("/api/getPropertyMaster", {
                params: {
                    CompanyID: companyID,
                    PropertyID: propertyId,
                },
            });

            const data = response.data;

            if (data?.success) {
                const list = Array.isArray(data.data)
                    ? data.data.map(mapApiPropertyMaster)
                    : [];

                setPropertyMasters(list);
            } else {
                setPropertyMasters([]);
            }
        } catch (error) {
            console.error("Load PropertyMaster error:", error);
            setPropertyMasters([]);
        } finally {
            setMastersLoading(false);
        }
    };

    // ========================================================
    // LOAD RENTALS FOR THE SELECTED PROPERTY (all units)
    // ========================================================

    const loadRentals = async (propertyId) => {
        const companyID = getCompanyID();

        if (!companyID || !propertyId) {
            setRentals([]);
            return;
        }

        setLoading(true);
        setErrorMessage("");

        try {
            const response = await api.get("/api/getPropertyRental", {
                params: {
                    CompanyID: companyID,

                    // Top-level Property.PropertyID
                    PropertyID: propertyId,
                },
            });

            const data = response.data;

            if (data?.success) {
                const list = Array.isArray(data.data)
                    ? data.data.map(mapApiRental)
                    : [];

                setRentals(list);
            } else {
                setRentals([]);
                setErrorMessage(data?.message || "Failed to load rentals.");
            }
        } catch (error) {
            console.error("Load rental error:", error);
            setRentals([]);
            setErrorMessage(
                error?.response?.data?.message || "Failed to load rentals."
            );
        } finally {
            setLoading(false);
        }
    };

    // ========================================================
    // PAGE LOAD — load properties first
    // ========================================================

    useEffect(() => {
        loadProperties();
    }, []);

    // ========================================================
    // PROPERTY CHANGE — reload masters (for the form) + rentals (for the list)
    // ========================================================

    useEffect(() => {
        setRentals([]);
        setPropertyMasters([]);
        setTenantUsers([]);
        setShowForm(false);
        setForm(INITIAL_FORM);
        setSearchTerm("");
        setFilterStatus("");
        setFilterFrequency("");

        if (selectedPropertyId) {
            loadPropertyMasters(selectedPropertyId);
            loadRentals(selectedPropertyId);
        }
    }, [selectedPropertyId]);

    // ========================================================
    // FILTER
    // ========================================================

    const filteredRentals = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        let base = !term
            ? rentals
            : rentals.filter((r) =>
                  [r.tenantName, r.rentalStatus, String(r.id)]
                      .filter(Boolean)
                      .some((v) => v.toString().toLowerCase().includes(term))
              );

        if (filterStatus) {
            base = base.filter((r) => r.rentalStatus === filterStatus);
        }

        if (filterFrequency) {
            base = base.filter((r) => r.paymentFrequency === filterFrequency);
        }

        return base;
    }, [rentals, searchTerm, filterStatus, filterFrequency]);

    const activeFilterCount = [filterStatus, filterFrequency].filter(
        Boolean
    ).length;

    // ========================================================
    // FORM CHANGE
    // ========================================================

    const handleChange = (field) => (e) => {
        const value = e.target.value;
        setForm((prev) => field === "rentalStatus" && value !== "Occupied"
            ? { ...prev, rentalStatus: value, tenantUserId: "", tenantName: "" }
            : { ...prev, [field]: value });
    };

    // Unit picker inside the form — also syncs Tenant Name from the unit
    const handleUnitChange = (e) => {
        const recordId = e.target.value;

        setForm((prev) => ({
            ...prev,
            recordId,
            tenantUserId: "",
            tenantName: "",
        }));
        setTenantUsers([]);
        if (recordId) loadTenantUsers(recordId);
    };

    const loadTenantUsers = async (recordId, rentalId = form.id) => {
        const companyID = getCompanyID();
        if (!companyID || !selectedPropertyId || !recordId) {
            setTenantUsers([]);
            return [];
        }

        setTenantsLoading(true);
        try {
            const response = await api.get("/api/getPropertyRentalTenants", {
                params: {
                    CompanyID: companyID,
                    PropertyID: selectedPropertyId,
                    RecordID: recordId,
                    RentalID: rentalId || null,
                },
            });
            if (!response.data?.success) {
                throw new Error(response.data?.message || "Tenant list request failed.");
            }
            const users = Array.isArray(response.data.data) ? response.data.data : [];
            setTenantUsers(users);
            return users;
        } catch (error) {
            console.error("Load rental tenants error:", error);
            setTenantUsers([]);
            setErrorMessage(error?.response?.data?.message || "Failed to load tenants for this flat.");
            return [];
        } finally {
            setTenantsLoading(false);
        }
    };

    const handleTenantChange = (e) => {
        const tenantUserId = e.target.value;
        const tenant = tenantUsers.find((item) => String(item.UserId) === String(tenantUserId));
        const tenantName = tenant
            ? [tenant.Name, tenant.MName, tenant.LName].filter(Boolean).join(" ").trim()
            : "";
        setForm((prev) => ({ ...prev, tenantUserId, tenantName }));
    };

    // ========================================================
    // CREATE
    // ========================================================

    const openCreate = () => {
        setForm(INITIAL_FORM);
        setErrorMessage("");
        setShowForm(true);
    };

    // ========================================================
    // EDIT
    // ========================================================

    const openEdit = async (rental) => {
        setErrorMessage("");
        setForm(rental);
        setShowForm(true);

        try {
            const response = await api.get("/api/getPropertyRentalByID", {
                params: {
                    RentalID: rental.id,
                    CompanyID: getCompanyID(),
                    PropertyID: selectedPropertyId,
                },
            });

            const data = response.data;

            if (data?.success && data.data) {
                const mapped = mapApiRental(data.data);
                const master = propertyMasters.find(
                    (p) => String(p.recordId) === String(mapped.recordId)
                );
                const linkedTenants = await loadTenantUsers(mapped.recordId, mapped.id);
                const linkedTenant = linkedTenants.find(
                    (tenant) => Number(tenant.RentalID) === Number(mapped.id)
                );

                setForm({
                    ...mapped,
                    tenantUserId: linkedTenant ? String(linkedTenant.UserId) : "",
                    tenantName: linkedTenant
                        ? [linkedTenant.Name, linkedTenant.MName, linkedTenant.LName].filter(Boolean).join(" ").trim()
                        : master?.tenantName || mapped.tenantName,
                });
            }
        } catch (error) {
            console.error("Load rental by id error:", error);
            // Keep existing row data
        }
    };

    // ========================================================
    // BACK
    // ========================================================

    const backToList = () => {
        setShowForm(false);
        setForm(INITIAL_FORM);
        setErrorMessage("");
    };

    // ========================================================
    // SAVE
    // ========================================================

    const handleSave = async (e) => {
        e.preventDefault();

        const companyID = getCompanyID();
        const userID = getUserID();

        if (!companyID) {
            setErrorMessage("CompanyID not found. Please login again.");
            return;
        }

        if (!selectedPropertyId) {
            setErrorMessage("Please select a property first.");
            return;
        }

        if (!form.recordId) {
            setErrorMessage("Please select a unit for this rental.");
            return;
        }

        if (form.rentalStatus === "Occupied" && !form.tenantUserId) {
            setErrorMessage("Select a tenant created for this property and flat before saving an occupied rental.");
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
                propertyId: selectedPropertyId,
                userId: userID,
            });

            console.log("Property Rental Payload:", payload);

            const response = await api.post(
                "/api/insertUpdatePropertyRental",
                payload
            );

            const data = response.data;

            if (data?.success) {
                await loadRentals(selectedPropertyId);
                backToList();
            } else {
                setErrorMessage(data?.message || "Failed to save rental.");
            }
        } catch (error) {
            console.error("Save rental error:", error);
            setErrorMessage(
                error?.response?.data?.message || "Failed to save rental."
            );
        } finally {
            setSaving(false);
        }
    };

    // ========================================================
    // DELETE
    // ========================================================

    const handleDelete = async () => {
        if (!isEditing) return;

        const companyID = getCompanyID();
        const userID = getUserID();

        if (!companyID) {
            setErrorMessage("CompanyID not found.");
            return;
        }

        if (!selectedPropertyId) {
            setErrorMessage("Property is required.");
            return;
        }

        if (!userID) {
            setErrorMessage("UserID not found.");
            return;
        }

        setDeleting(true);
        setErrorMessage("");

        try {
            const response = await api.post("/api/deletePropertyRental", {
                    RentalID: form.id,
                    CompanyID: companyID,
                    PropertyID: selectedPropertyId,
                    UserID: userID,
                },);

            const data = response.data;

            if (data?.success) {
                await loadRentals(selectedPropertyId);
                backToList();
            } else {
                setErrorMessage(data?.message || "Failed to delete rental.");
            }
        } catch (error) {
            console.error("Delete rental error:", error);
            setErrorMessage(
                error?.response?.data?.message || "Failed to delete rental."
            );
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="ri-root">
            <style>{`
                :root{
                    --ri-primary:#10299b;
                    --ri-primary-dark:#0b1c6e;
                    --ri-primary-mid:#4a5fc1;
                    --ri-primary-soft:#eef1fb;
                    --ri-primary-tint:#d6ddf5;
                    --ri-ink:#1a1f36;
                    --ri-muted:#6b7290;
                    --ri-green:#1a9e6c;
                    --ri-green-soft:#e6f7f0;
                    --ri-amber:#c07a00;
                    --ri-amber-soft:#fdf3df;
                    --ri-red:#dc2626;
                    --ri-red-soft:#fdecec;
                    --ri-slate:#475569;
                    --ri-slate-soft:#eef2f6;
                }

                .ri-root{
                    font-family:"Inter",system-ui,-apple-system,"Segoe UI",sans-serif;
                    color:var(--ri-ink);
                }

                .ri-root *{ box-sizing:border-box; }

                .ri-alert{
                    display:flex; align-items:center; gap:10px;
                    background:var(--ri-red-soft); color:var(--ri-red);
                    border:1px solid #f5b8b8; border-radius:10px;
                    padding:10px 14px; font-size:.83rem; font-weight:600;
                    margin-bottom:14px;
                }

                .ri-loading{
                    text-align:center; padding:40px 20px; color:var(--ri-muted); font-size:.85rem;
                }

                .ri-property-picker{
                    display:flex; align-items:flex-start; gap:16px; flex-wrap:wrap;
                    background:#fff; border:1px solid var(--ri-primary-tint);
                    border-radius:14px; padding:14px 16px; margin-bottom:18px;
                    box-shadow:0 4px 18px rgba(16,41,155,.06);
                }

                .ri-property-picker .ri-field{ flex:1; min-width:260px; margin:0; }

                .ri-property-info{
                    display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;
                    font-size:.75rem; color:var(--ri-muted);
                }

                .ri-property-badge{
                    background:var(--ri-primary-soft); color:var(--ri-primary-dark);
                    padding:4px 9px; border-radius:6px; font-weight:700;
                }

                .ri-empty-state{
                    text-align:center; padding:45px 20px; color:var(--ri-muted);
                    background:#fff; border:1px solid var(--ri-primary-tint); border-radius:16px;
                }
                .ri-empty-state i{ font-size:1.9rem; color:var(--ri-primary-tint); margin-bottom:8px; display:block; }
                .ri-empty-state .ri-empty-title{ font-weight:700; color:var(--ri-primary-dark); font-size:.9rem; }

                .ri-toolbar{ display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin-bottom:16px; }
                .ri-search-wrap{ position:relative; flex:1; min-width:220px; }
                .ri-search-wrap i{ position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--ri-primary-mid); font-size:.85rem; }
                .ri-search-input{
                    width:100%; border:1px solid var(--ri-primary-tint); border-radius:9px;
                    padding:9px 12px 9px 34px; font-size:.85rem; background:var(--ri-primary-soft); outline:none;
                }
                .ri-search-input:focus{ border-color:var(--ri-primary); background:#fff; }

                .ri-toolbar-btn{
                    display:flex; align-items:center; gap:7px; border-radius:9px; padding:9px 16px;
                    font-size:.83rem; font-weight:700; white-space:nowrap;
                    border:1.5px solid var(--ri-primary); background:#fff; color:var(--ri-primary);
                    cursor:pointer; position:relative;
                }
                .ri-toolbar-btn:hover{ background:var(--ri-primary-soft); }
                .ri-toolbar-btn.ri-btn-solid{ background:var(--ri-primary); color:#fff; }
                .ri-toolbar-btn.ri-btn-solid:hover{ background:var(--ri-primary-dark); }

                .ri-filter-badge{
                    position:absolute; top:-6px; right:-6px; background:var(--ri-red); color:#fff;
                    width:17px; height:17px; border-radius:50%; font-size:9px; font-weight:700;
                    display:flex; align-items:center; justify-content:center;
                }

                .ri-table-card{
                    background:#fff; border:1px solid var(--ri-primary-tint); border-radius:16px;
                    overflow:hidden; box-shadow:0 4px 18px rgba(16,41,155,.06);
                }
                .ri-table{ width:100%; border-collapse:collapse; margin:0; }
                .ri-table thead th{
                    background:var(--ri-primary-soft); color:var(--ri-primary-dark);
                    font-size:.7rem; font-weight:700; text-transform:uppercase; letter-spacing:.5px;
                    padding:12px 16px; text-align:left; border-bottom:2px solid var(--ri-primary-tint); white-space:nowrap;
                }
                .ri-table tbody td{ padding:12px 16px; font-size:.84rem; border-bottom:1px solid #f0f2fa; vertical-align:middle; }
                .ri-table tbody tr{ cursor:pointer; transition:background .15s ease; }
                .ri-table tbody tr:nth-child(even){ background:#f8f9fd; }
                .ri-table tbody tr:hover{ background:var(--ri-primary-soft); }
                .ri-row-name{ font-weight:700; color:var(--ri-ink); }
                .ri-row-sub{ font-size:.74rem; color:var(--ri-muted); }

                .ri-tag{ display:inline-block; font-size:.72rem; font-weight:700; padding:3px 10px; border-radius:999px; background:var(--ri-primary-soft); color:var(--ri-primary-mid); }
                .ri-tag-occupied{ background:var(--ri-green-soft); color:var(--ri-green); }
                .ri-tag-vacant{ background:var(--ri-slate-soft); color:var(--ri-slate); }
                .ri-tag-reserved{ background:var(--ri-amber-soft); color:var(--ri-amber); }
                .ri-tag-maintenance{ background:#fdecec; color:#b45309; }
                .ri-tag-blocked{ background:var(--ri-red-soft); color:var(--ri-red); }

                .ri-empty{ text-align:center; padding:48px 20px; color:var(--ri-muted); }
                .ri-empty i{ font-size:1.9rem; color:var(--ri-primary-tint); margin-bottom:8px; display:block; }
                .ri-empty-title{ font-weight:700; color:var(--ri-primary-dark); font-size:.9rem; }

                .ri-modal-backdrop{ position:fixed; inset:0; z-index:1050; background:rgba(15,20,50,.5); display:flex; align-items:center; justify-content:center; padding:20px; }
                .ri-modal-card{ background:#fff; border-radius:16px; width:100%; max-width:420px; box-shadow:0 20px 50px rgba(16,41,155,.25); overflow:hidden; }
                .ri-modal-head{ display:flex; align-items:center; justify-content:space-between; padding:16px 20px; background:linear-gradient(135deg, var(--ri-primary) 0%, var(--ri-primary-dark) 100%); color:#fff; }
                .ri-modal-head-title{ font-size:.95rem; font-weight:700; margin:0; }
                .ri-modal-close{ border:none; background:rgba(255,255,255,.15); color:#fff; width:26px; height:26px; border-radius:7px; cursor:pointer; }
                .ri-modal-body{ padding:18px 20px; display:flex; flex-direction:column; gap:14px; }
                .ri-modal-footer{ display:flex; justify-content:space-between; gap:10px; padding:14px 20px; border-top:1px solid var(--ri-primary-soft); }

                .ri-form-header{ display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; gap:12px; flex-wrap:wrap; }
                .ri-form-title{ font-size:1.05rem; font-weight:700; color:var(--ri-primary-dark); margin:0; }
                .ri-form-subtitle{ font-size:.78rem; color:var(--ri-muted); margin-top:2px; }
                .ri-back-btn{
                    display:flex; align-items:center; gap:7px; border:1.5px solid var(--ri-primary);
                    background:#fff; color:var(--ri-primary); border-radius:9px; padding:8px 16px;
                    font-size:.83rem; font-weight:700; cursor:pointer;
                }
                .ri-back-btn:hover{ background:var(--ri-primary-soft); }

                .ri-section{ margin-bottom:26px; }
                .ri-section-head{ display:flex; align-items:center; gap:10px; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid var(--ri-primary-tint); }
                .ri-section-icon{ width:34px; height:34px; border-radius:9px; background:var(--ri-primary-soft); color:var(--ri-primary); display:flex; align-items:center; justify-content:center; font-size:.95rem; flex-shrink:0; }
                .ri-section-title{ font-size:.95rem; font-weight:700; color:var(--ri-primary-dark); margin:0; }
                .ri-section-sub{ font-size:.76rem; color:var(--ri-muted); margin-top:1px; }

                .ri-grid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(230px,1fr)); gap:16px 18px; }
                .ri-field.ri-field-wide{ grid-column:1 / -1; }
                .ri-field label{ display:block; font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.4px; color:var(--ri-primary-mid); margin-bottom:6px; }

                .ri-input, .ri-select, .ri-textarea{
                    width:100%; border:1px solid var(--ri-primary-tint); border-radius:9px; padding:12px 16px;
                    font-size:1.05rem; color:var(--ri-ink); background:#fff; outline:none;
                    transition:border-color .15s ease, box-shadow .15s ease; font-family:inherit;
                }
                .ri-textarea{ resize:vertical; min-height:140px; }
                .ri-input:focus, .ri-select:focus, .ri-textarea:focus{ border-color:var(--ri-primary); box-shadow:0 0 0 3px rgba(16,41,155,.12); }
                .ri-input:disabled, .ri-select:disabled{ background:var(--ri-primary-soft); color:var(--ri-muted); cursor:not-allowed; }

                .ri-input-prefix-wrap{ position:relative; }
                .ri-input-prefix-wrap span{ position:absolute; left:16px; top:50%; transform:translateY(-50%); font-size:.9rem; color:var(--ri-muted); font-weight:700; }
                .ri-input-prefix-wrap input{ padding-left:48px; }

                .ri-footer{ display:flex; align-items:center; gap:10px; padding-top:18px; border-top:1px solid var(--ri-primary-tint); flex-wrap:wrap; }
                .ri-btn{ border:none; border-radius:10px; padding:10px 20px; font-size:.85rem; font-weight:700; transition:all .15s ease; cursor:pointer; }
                .ri-btn-primary{ background:var(--ri-primary); color:#fff; }
                .ri-btn-primary:hover:not(:disabled){ background:var(--ri-primary-dark); box-shadow:0 4px 10px rgba(16,41,155,.25); }
                .ri-btn-primary:disabled{ opacity:.6; cursor:default; }
                .ri-btn-ghost{ background:var(--ri-primary-soft); color:var(--ri-primary); }
                .ri-btn-ghost:hover{ background:var(--ri-primary-tint); }
                .ri-btn-danger{ background:#fff; color:var(--ri-red); border:1.5px solid #f5b8b8; }
                .ri-btn-danger:hover:not(:disabled){ background:var(--ri-red-soft); }
                .ri-btn-danger:disabled{ opacity:.6; cursor:default; }
            `}</style>

            {/* ==================================================
                ERROR
            ================================================== */}

            {errorMessage && (
                <div className="ri-alert">
                    <i className="bi bi-exclamation-triangle"></i>
                    {errorMessage}
                </div>
            )}

            {/* ==================================================
                PROPERTY PICKER (top level only)
            ================================================== */}

            <div className="ri-property-picker">
                <div className="ri-field">
                    <label>Property</label>
                    <select
                        className="ri-select"
                        value={selectedPropertyId}
                        onChange={(e) => setSelectedPropertyId(e.target.value)}
                        disabled={propertiesLoading}
                    >
                        <option value="">
                            {propertiesLoading ? "Loading properties…" : "Select a property"}
                        </option>
                        {properties.map((p) => (
                            <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ==================================================
                EMPTY STATE / MAIN CONTENT
            ================================================== */}

            {!selectedPropertyId ? (
                <div className="ri-empty-state">
                    <i className="bi bi-building"></i>
                    <div className="ri-empty-title">Select a property to continue</div>
                    <div>Choose a property to view all of its rentals.</div>
                </div>
            ) : !showForm ? (
                <>
                    {/* TOOLBAR */}
                    <div className="ri-toolbar">
                        <div className="ri-search-wrap">
                            <i className="bi bi-search"></i>
                            <input
                                type="text"
                                className="ri-search-input"
                                placeholder="Search tenant, status, rental ID…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <button
                            type="button"
                            className="ri-toolbar-btn"
                            onClick={() => setIsFilterOpen(true)}
                        >
                            <i className="bi bi-funnel"></i>
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="ri-filter-badge">{activeFilterCount}</span>
                            )}
                        </button>

                        <button
                            type="button"
                            className="ri-toolbar-btn ri-btn-solid"
                            onClick={openCreate}
                        >
                            <i className="bi bi-plus-lg"></i>
                            Create New
                        </button>
                    </div>

                    {/* TABLE */}
                    <div className="ri-table-card">
                        {loading ? (
                            <div className="ri-loading">Loading rentals…</div>
                        ) : (
                            <div className="table-responsive" style={{ maxHeight: "60vh" }}>
                                <table className="ri-table">
                                    <thead>
                                        <tr>
                                            <th>Sl.No</th>
                                            <th>Flat / Type</th>
                                            <th>Tenant</th>
                                            <th>Status</th>
                                            <th>Monthly Rent</th>
                                            <th>Payment Frequency</th>
                                            <th>Lease Period</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRentals.length === 0 && (
                                            <tr>
                                                <td colSpan={7}>
                                                    <div className="ri-empty">
                                                        <i className="bi bi-key"></i>
                                                        <div className="ri-empty-title">No rentals found</div>
                                                        <div>
                                                            Try adjusting your search or create a new rental record.
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}

                                        {filteredRentals.map((r, index) => (
                                            <tr key={r.id} onClick={() => openEdit(r)}>
                                                <td className="ri-row-sub">
                                                    {index + 1}
                                                </td>
                                                <td>{getUnitLabel(r.recordId)}</td>
                                                <td>
                                                    <div className="ri-row-name">{r.tenantName || "—"}</div>
                                                </td>
                                                <td>
                                                    <span className={`ri-tag ${statusTagClass(r.rentalStatus)}`}>
                                                        {r.rentalStatus || "—"}
                                                    </span>
                                                </td>
                                                <td>{r.monthlyRent ? `AED ${r.monthlyRent}` : "—"}</td>
                                                <td>{r.paymentFrequency || "—"}</td>
                                                <td>
                                                    {r.leaseStartDate || r.leaseEndDate
                                                        ? `${r.leaseStartDate || "—"} → ${r.leaseEndDate || "—"}`
                                                        : "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* FILTER MODAL */}
                    {isFilterOpen && (
                        <div className="ri-modal-backdrop" onClick={() => setIsFilterOpen(false)}>
                            <div className="ri-modal-card" onClick={(e) => e.stopPropagation()}>
                                <div className="ri-modal-head">
                                    <p className="ri-modal-head-title">Filter Rentals</p>
                                    <button className="ri-modal-close" onClick={() => setIsFilterOpen(false)}>
                                        <i className="bi bi-x-lg"></i>
                                    </button>
                                </div>
                                <div className="ri-modal-body">
                                    <div className="ri-field">
                                        <label>Rental Status</label>
                                        <select
                                            className="ri-select"
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                        >
                                            <option value="">All statuses</option>
                                            {RENTAL_STATUSES.map((s) => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="ri-field">
                                        <label>Payment Frequency</label>
                                        <select
                                            className="ri-select"
                                            value={filterFrequency}
                                            onChange={(e) => setFilterFrequency(e.target.value)}
                                        >
                                            <option value="">All frequencies</option>
                                            {PAYMENT_FREQUENCIES.map((f) => (
                                                <option key={f} value={f}>{f}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="ri-modal-footer">
                                    <button
                                        type="button"
                                        className="ri-btn ri-btn-ghost"
                                        onClick={() => {
                                            setFilterStatus("");
                                            setFilterFrequency("");
                                        }}
                                    >
                                        Clear All
                                    </button>
                                    <button
                                        type="button"
                                        className="ri-btn ri-btn-primary"
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
                    {/* FORM HEADER */}
                    <div className="ri-form-header">
                        <div>
                            <p className="ri-form-title">
                                {isEditing ? "Edit Rental" : "New Rental"}
                            </p>
                            <div className="ri-form-subtitle">
                                {selectedProperty ? selectedProperty.label : `Property #${selectedPropertyId}`}
                                {selectedFormMaster && (
                                    <>
                                        {" · "}
                                        {selectedFormMaster.flatNo ||
                                            `Record #${selectedFormMaster.recordId}`}
                                        {selectedFormMaster.flatType
                                            ? ` - ${selectedFormMaster.flatType}`
                                            : ""}
                                    </>
                                )}
                            </div>
                        </div>
                        <button type="button" className="ri-back-btn" onClick={backToList}>
                            <i className="bi bi-arrow-left"></i>
                            Back to List
                        </button>
                    </div>

                    <form onSubmit={handleSave}>
                        {/* RENTAL OVERVIEW */}
                        <div className="ri-section">
                            <div className="ri-section-head">
                                <div className="ri-section-icon">
                                    <i className="bi bi-key"></i>
                                </div>
                                <div>
                                    <p className="ri-section-title">Rental Overview</p>
                                    <div className="ri-section-sub">
                                        Select the unit, and set the current status
                                    </div>
                                </div>
                            </div>

                            <div className="ri-grid">
                                <div className="ri-field">
                                    <label>Unit / Property Master</label>
                                    <select
                                        className="ri-select"
                                        value={form.recordId}
                                        onChange={handleUnitChange}
                                        disabled={mastersLoading}
                                    >
                                        <option value="">
                                            {mastersLoading ? "Loading units…" : "Select a unit"}
                                        </option>
                                        {propertyMasters.map((p) => {
                                            const occupiedByOtherRental =
                                                occupiedRecordIds.has(String(p.recordId)) &&
                                                rentals.some((rental) =>
                                                    String(rental.recordId) === String(p.recordId) &&
                                                    String(rental.rentalStatus).toLowerCase() === "occupied" &&
                                                    Number(rental.id) !== Number(form.id)
                                                );
                                            return (
                                                <option
                                                    key={p.recordId}
                                                    value={p.recordId}
                                                    disabled={occupiedByOtherRental}
                                                >
                                                    {p.flatNo || `Record #${p.recordId}`}
                                                    {p.flatType ? ` - ${p.flatType}` : ""}
                                                    {p.tenantName ? ` - ${p.tenantName}` : ""}
                                                    {occupiedByOtherRental ? " - Occupied" : ""}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                <div className="ri-field">
                                    <label>
                                        Tenant {form.rentalStatus === "Occupied" && <span className="text-danger">*</span>}
                                    </label>
                                    <select
                                        className="ri-select"
                                        value={form.tenantUserId}
                                        onChange={handleTenantChange}
                                        disabled={!form.recordId || tenantsLoading}
                                        required={form.rentalStatus === "Occupied"}
                                    >
                                        <option value="">
                                            {tenantsLoading
                                                ? "Loading tenants…"
                                                : !form.recordId
                                                    ? "Select a flat first"
                                                    : tenantUsers.length
                                                        ? "Select tenant"
                                                        : "No tenants registered for this flat"}
                                        </option>
                                        {tenantUsers.map((tenant) => (
                                            <option key={tenant.UserId} value={tenant.UserId}>
                                                {[tenant.Name, tenant.MName, tenant.LName].filter(Boolean).join(" ")}
                                            </option>
                                        ))}
                                    </select>
                                    {form.recordId && !tenantsLoading && tenantUsers.length === 0 && (
                                        <small className="text-muted">
                                            Create the tenant in Rental Management and assign this property and flat first.
                                        </small>
                                    )}
                                </div>

                                <div className="ri-field">
                                    <label>Rental Status</label>
                                    <select
                                        className="ri-select"
                                        value={form.rentalStatus}
                                        onChange={handleChange("rentalStatus")}
                                    >
                                        <option value="">Select status</option>
                                        {RENTAL_STATUSES.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* RENT & PAYMENT */}
                        <div className="ri-section">
                            <div className="ri-section-head">
                                <div className="ri-section-icon">
                                    <i className="bi bi-cash-coin"></i>
                                </div>
                                <div>
                                    <p className="ri-section-title">Rent & Payment Terms</p>
                                    <div className="ri-section-sub">
                                        Rent amounts, deposit and payment collection
                                    </div>
                                </div>
                            </div>

                            <div className="ri-grid">
                                <div className="ri-field">
                                    <label>Monthly Rent</label>
                                    <div className="ri-input-prefix-wrap">
                                        <span>AED</span>
                                        <input
                                            type="number"
                                            className="ri-input"
                                            value={form.monthlyRent}
                                            onChange={handleChange("monthlyRent")}
                                            placeholder="e.g. 8500"
                                        />
                                    </div>
                                </div>

                                <div className="ri-field">
                                    <label>Annual Rent</label>
                                    <div className="ri-input-prefix-wrap">
                                        <span>AED</span>
                                        <input
                                            type="number"
                                            className="ri-input"
                                            value={form.annualRent}
                                            onChange={handleChange("annualRent")}
                                            placeholder="e.g. 102000"
                                        />
                                    </div>
                                </div>

                                <div className="ri-field">
                                    <label>Security Deposit</label>
                                    <div className="ri-input-prefix-wrap">
                                        <span>AED</span>
                                        <input
                                            type="number"
                                            className="ri-input"
                                            value={form.securityDeposit}
                                            onChange={handleChange("securityDeposit")}
                                            placeholder="e.g. 8500"
                                        />
                                    </div>
                                </div>

                                <div className="ri-field">
                                    <label>Number of Cheques</label>
                                    <input
                                        type="number"
                                        className="ri-input"
                                        value={form.numberOfCheques}
                                        onChange={handleChange("numberOfCheques")}
                                        placeholder="e.g. 4"
                                        disabled={isEditing}
                                    />
                                </div>

                                <div className="ri-field">
                                    <label>Payment Frequency</label>
                                    <select
                                        className="ri-select"
                                        value={form.paymentFrequency}
                                        onChange={handleChange("paymentFrequency")}
                                    >
                                        <option value="">Select frequency</option>
                                        {PAYMENT_FREQUENCIES.map((f) => (
                                            <option key={f} value={f}>{f}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="ri-field">
                                    <label>Rent Increase Percentage</label>
                                    <div className="ri-input-prefix-wrap">
                                        <span>%</span>
                                        <input
                                            type="number"
                                            className="ri-input"
                                            value={form.rentIncreasePercentage}
                                            onChange={handleChange("rentIncreasePercentage")}
                                            placeholder="e.g. 5"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* LEASE */}
                        <div className="ri-section">
                            <div className="ri-section-head">
                                <div className="ri-section-icon">
                                    <i className="bi bi-calendar3"></i>
                                </div>
                                <div>
                                    <p className="ri-section-title">Lease Term & Renewal</p>
                                    <div className="ri-section-sub">
                                        Contract duration and renewal terms
                                    </div>
                                </div>
                            </div>

                            <div className="ri-grid">
                                <div className="ri-field">
                                    <label>Lease Start Date</label>
                                    <input
                                        type="date"
                                        className="ri-input"
                                        value={form.leaseStartDate}
                                        onChange={handleChange("leaseStartDate")}
                                    />
                                </div>

                                <div className="ri-field">
                                    <label>Lease End Date</label>
                                    <input
                                        type="date"
                                        className="ri-input"
                                        value={form.leaseEndDate}
                                        onChange={handleChange("leaseEndDate")}
                                    />
                                </div>

                                <div className="ri-field">
                                    <label>Renewal Option</label>
                                    <select
                                        className="ri-select"
                                        value={form.renewalOption}
                                        onChange={handleChange("renewalOption")}
                                    >
                                        <option value="">Select renewal option</option>
                                        {RENEWAL_OPTIONS.map((o) => (
                                            <option key={o} value={o}>{o}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="ri-field">
                                    <label>Grace Period (days)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="ri-input"
                                        value={form.gracePeriod}
                                        onChange={handleChange("gracePeriod")}
                                        placeholder="e.g. 5"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* LATE PAYMENT */}
                        <div className="ri-section">
                            <div className="ri-section-head">
                                <div className="ri-section-icon">
                                    <i className="bi bi-exclamation-octagon"></i>
                                </div>
                                <div>
                                    <p className="ri-section-title">Late Payment Rules</p>
                                    <div className="ri-section-sub">
                                        How late fees are calculated and applied
                                    </div>
                                </div>
                            </div>

                            <div className="ri-grid">
                                <div className="ri-field ri-field-wide">
                                    <label>Late Fee Rules</label>
                                    <textarea
                                        className="ri-textarea"
                                        value={form.lateFeeRules}
                                        onChange={handleChange("lateFeeRules")}
                                        placeholder="e.g. AED 200 flat fee after grace period, plus 1% per week thereafter."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="ri-footer">
                            <button type="submit" className="ri-btn ri-btn-primary" disabled={saving}>
                                <i
                                    className={`bi ${saving ? "bi-hourglass-split" : "bi-check2-circle"} me-2`}
                                ></i>
                                {saving ? "Saving…" : isEditing ? "Update Rental" : "Save Rental"}
                            </button>

                            {isEditing && (
                                <button
                                    type="button"
                                    className="ri-btn ri-btn-danger"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                >
                                    <i
                                        className={`bi ${deleting ? "bi-hourglass-split" : "bi-trash3"} me-2`}
                                    ></i>
                                    {deleting ? "Deleting…" : "Delete"}
                                </button>
                            )}

                            <button
                                type="button"
                                className="ri-btn ri-btn-ghost"
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

export default RentalInformation;