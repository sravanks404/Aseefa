// import { useEffect, useMemo, useState } from "react";
// import api from "../../apiService";

// // Suggestions only — Flat Type is a free-typed field, not a fixed dropdown.
// const FLAT_TYPE_SUGGESTIONS = [
//   "Studio",
//   "1 BHK",
//   "2 BHK",
//   "3 BHK",
//   "4 BHK",
//   "Penthouse",
//   "Other",
// ];

// // Cheques are added/removed dynamically — this is just the starting count.
// const emptyCheques = () => [
//   {
//     amount: "",
//     date: "",
//   },
// ];

// const DEFAULTS = {
//   RecordID: 0,

//   flatNo: "",
//   tenantName: "",
//   flatType: "",
//   rentalAmount: "",

//   cheques: emptyCheques(),

//   cashReceived: "",
//   remarks: "",
// };

// // ============================================================
// // API PROPERTY -> PICKER OPTION
// // Mirrors the shape used in PropertyOwnership's property picker.
// // ============================================================
// const mapApiProperty = (p) => ({
//   id: p.PropertyID ?? p.propertyId ?? p.id,
//   label:
//     p.PropertyName ??
//     p.PropertyLabel ??
//     p.propertyLabel ??
//     p.Name ??
//     `Property #${p.PropertyID ?? p.id}`,
// });

// // ============================================================
// // READ CHEQUES FROM API RECORD
// // Supports a dynamic "Cheques" array (preferred) and falls
// // back to legacy flattened Cheque1Amount..Cheque1Date style
// // fields, in case older records were saved that way.
// // ============================================================
// const extractCheques = (item, chequesArray) => {
//   // Preferred: explicit cheques array returned alongside the
//   // record (as in /getPropertyMasterByID -> { data, cheques }).
//   if (Array.isArray(chequesArray) && chequesArray.length > 0) {
//     return [...chequesArray]
//       .sort((a, b) => (Number(a.SequenceNo) || 0) - (Number(b.SequenceNo) || 0))
//       .map((c) => ({
//         amount: c.ChequeAmount ?? c.Amount ?? c.amount ?? "",
//         date: c.ChequeDate
//           ? String(c.ChequeDate).slice(0, 10)
//           : c.Date
//             ? String(c.Date).slice(0, 10)
//             : c.date || "",
//       }));
//   }

//   if (!item) {
//     return emptyCheques();
//   }

//   if (Array.isArray(item.Cheques) && item.Cheques.length > 0) {
//     return item.Cheques.map((c) => ({
//       amount: c.Amount ?? c.amount ?? "",
//       date: c.Date ? String(c.Date).slice(0, 10) : c.date || "",
//     }));
//   }

//   const legacy = [];

//   let n = 1;

//   while (
//     item[`Cheque${n}Amount`] !== undefined ||
//     item[`Cheque${n}Date`] !== undefined
//   ) {
//     legacy.push({
//       amount: item[`Cheque${n}Amount`] ?? "",
//       date: item[`Cheque${n}Date`]
//         ? String(item[`Cheque${n}Date`]).slice(0, 10)
//         : "",
//     });

//     n += 1;
//   }

//   return legacy.length > 0 ? legacy : emptyCheques();
// };

// // ============================================================
// // CONVERT API RECORD -> LIST ROW SHAPE
// // ============================================================
// const mapApiRecord = (item) => {
//   const recordID = Number(item.RecordID) || 0;

//   const totalCheque = extractCheques(item).reduce(
//     (sum, c) => sum + (Number(c.amount) || 0),
//     0,
//   );

//   const cashReceived = Number(item.CashReceived) || 0;
//   const rentalAmount = Number(item.RentalAmount) || 0;

//   const totalPaid =
//     item.TotalPaid !== undefined && item.TotalPaid !== null
//       ? Number(item.TotalPaid)
//       : totalCheque + cashReceived;

//   const balanceDue =
//     item.BalanceDue !== undefined && item.BalanceDue !== null
//       ? Number(item.BalanceDue)
//       : rentalAmount - totalPaid;

//   return {
//     RecordID: recordID,

//     FlatNo: item.FlatNo || "",
//     TenantName: item.TenantName || "",
//     FlatType: item.FlatType || "",

//     RentalAmount: rentalAmount,
//     TotalCheque: totalCheque,
//     TotalPaid: totalPaid,
//     BalanceDue: balanceDue,
//   };
// };

// const money = (value) => {
//   const n = Number(value) || 0;

//   return n.toLocaleString(undefined, {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });
// };

// const PropertyMaster = () => {
//   // --------------------------------------------------------
//   // PROPERTY SELECTION
//   // Records are always scoped to one property, same pattern
//   // as PropertyOwnership.
//   // --------------------------------------------------------
//   const [properties, setProperties] = useState([]);
//   const [propertiesLoading, setPropertiesLoading] = useState(false);
//   const [selectedPropertyId, setSelectedPropertyId] = useState("");

//   // --------------------------------------------------------
//   // LIST
//   // --------------------------------------------------------
//   const [records, setRecords] = useState([]);
//   const [loadingRecords, setLoadingRecords] = useState(false);

//   const [searchTerm, setSearchTerm] = useState("");

//   // --------------------------------------------------------
//   // FORM
//   // --------------------------------------------------------
//   const [form, setForm] = useState({
//     ...DEFAULTS,
//     cheques: emptyCheques(),
//   });

//   const [loadingRecord, setLoadingRecord] = useState(false);

//   const [showForm, setShowForm] = useState(false);

//   const [saving, setSaving] = useState(false);
//   const [deleting, setDeleting] = useState(false);

//   const [errorMessage, setErrorMessage] = useState("");
//   const [successMessage, setSuccessMessage] = useState("");

//   const selectedProperty = properties.find(
//     (p) => String(p.id) === String(selectedPropertyId),
//   );


//   const getCompanyID = () => {
//     return Number(sessionStorage.getItem("CompanyID")) || 0;
//   };

//   const getUserID = () => {
//     return (
//       Number(sessionStorage.getItem("UserId")) ||
//       Number(sessionStorage.getItem("UserID")) ||
//       0
//     );
//   };

  

//   const loadProperties = async () => {
//     const companyID = getCompanyID();

//     if (!companyID) {
//       setErrorMessage("CompanyID not found. Please login again.");

//       return;
//     }

//     setPropertiesLoading(true);

//     try {
//       const response = await api.get("/api/getPropertyInfo", {
//         params: {
//           CompanyID: companyID,
//         },
//       });

//       const data = response.data;

//       if (data?.success) {
//         const list = Array.isArray(data.data)
//           ? data.data.map(mapApiProperty)
//           : [];

//         setProperties(list);
//       } else {
//         setProperties([]);

//         setErrorMessage(data?.message || "Failed to load properties.");
//       }
//     } catch (error) {
//       console.error("Load property error:", error);

//       setProperties([]);

//       setErrorMessage(
//         error?.response?.data?.message || "Failed to load properties.",
//       );
//     } finally {
//       setPropertiesLoading(false);
//     }
//   };


//   const loadRecords = async (propertyId) => {
//     const companyID = getCompanyID();

//     if (!companyID || !propertyId) {
//       return;
//     }

//     setLoadingRecords(true);
//     setErrorMessage("");

//     try {
//       const response = await api.get("/api/getPropertyMaster", {
//         params: {
//           CompanyID: companyID,
//           PropertyID: propertyId,
//         },
//       });

//       const data = response.data;

//       if (data?.success) {
//         const list = Array.isArray(data.data)
//           ? data.data.map(mapApiRecord)
//           : [];

//         setRecords(list);
//       } else {
//         setRecords([]);

//         setErrorMessage(data?.message || "Failed to load records.");
//       }
//     } catch (error) {
//       console.error("Load property master error:", error);

//       setRecords([]);

//       setErrorMessage(
//         error?.response?.data?.message || "Failed to load records.",
//       );
//     } finally {
//       setLoadingRecords(false);
//     }
//   };


//   useEffect(() => {
//     loadProperties();
//   }, []);

  
//   useEffect(() => {
//     setShowForm(false);

//     setForm({
//       ...DEFAULTS,
//       cheques: emptyCheques(),
//     });

//     setSearchTerm("");

//     if (selectedPropertyId) {
//       loadRecords(selectedPropertyId);
//     } else {
//       setRecords([]);
//     }
//   }, [selectedPropertyId]);

  

//   const filteredRecords = useMemo(() => {
//     const term = searchTerm.trim().toLowerCase();

//     if (!term) {
//       return records;
//     }

//     return records.filter((record) =>
//       [record.FlatNo, record.TenantName, record.FlatType]
//         .filter(Boolean)
//         .some((value) => String(value).toLowerCase().includes(term)),
//     );
//   }, [records, searchTerm]);



//   const mapRecordToForm = (data, chequesArray) => {
//     if (!data) {
//       return {
//         ...DEFAULTS,
//         cheques: emptyCheques(),
//       };
//     }

//     const cheques = extractCheques(data, chequesArray);

//     return {
//       RecordID: Number(data.RecordID || 0),

//       flatNo: data.FlatNo || "",

//       tenantName: data.TenantName || "",

//       flatType: data.FlatType || "",

//       rentalAmount: data.RentalAmount ?? "",

//       cheques,

//       cashReceived: data.CashReceived ?? "",

//       remarks: data.Remarks || "",
//     };
//   };



//   const loadRecord = async (recordId) => {
//     const companyID = getCompanyID();

//     if (!companyID || !recordId || !selectedPropertyId) {
//       return;
//     }

//     setLoadingRecord(true);
//     setSuccessMessage("");
//     setErrorMessage("");

//     try {
//       const response = await api.get("/api/getPropertyMasterByID", {
//         params: {
//           RecordID: recordId,
//           CompanyID: companyID,
//           PropertyID: selectedPropertyId,
//         },
//       });

//       const data = response.data;

//       if (!data?.success) {
//         throw new Error(data?.message || "Failed to load record");
//       }

//       const mapped = mapRecordToForm(data.data, data.cheques);

//       setForm(mapped);
//     } catch (error) {
//       console.error("Record loading error:", error);

//       setErrorMessage(
//         error?.response?.data?.message ||
//           error.message ||
//           "Failed to load record",
//       );
//     } finally {
//       setLoadingRecord(false);
//     }
//   };



//   const openCreate = () => {
//     setForm({
//       ...DEFAULTS,
//       cheques: emptyCheques(),
//     });

//     setSuccessMessage("");
//     setErrorMessage("");
//     setShowForm(true);
//   };

//   const openEdit = async (record) => {
//     setSuccessMessage("");
//     setErrorMessage("");
//     setShowForm(true);

//     await loadRecord(record.RecordID);
//   };

//   const backToList = () => {
//     setShowForm(false);
//     setSuccessMessage("");
//     setErrorMessage("");
//   };

 

//   const handleChange = (field) => (e) => {
//     const value = e.target.value;

//     setForm((prev) => ({
//       ...prev,
//       [field]: value,
//     }));

//     setSuccessMessage("");
//     setErrorMessage("");
//   };

//   const handleChequeChange = (index, field) => (e) => {
//     const value = e.target.value;

//     setForm((prev) => {
//       const cheques = [...prev.cheques];

//       cheques[index] = {
//         ...cheques[index],
//         [field]: value,
//       };

//       return {
//         ...prev,
//         cheques,
//       };
//     });

//     setSuccessMessage("");
//     setErrorMessage("");
//   };

//   const handleAddCheque = () => {
//     setForm((prev) => ({
//       ...prev,
//       cheques: [...prev.cheques, { amount: "", date: "" }],
//     }));
//   };

//   const handleRemoveCheque = (index) => {
//     setForm((prev) => {
//       if (prev.cheques.length <= 1) {
//         return prev;
//       }

//       return {
//         ...prev,
//         cheques: prev.cheques.filter((_, i) => i !== index),
//       };
//     });
//   };


//   const totalChequeAmount = useMemo(() => {
//     return form.cheques.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
//   }, [form.cheques]);

//   const totalPaid = useMemo(() => {
//     return totalChequeAmount + (Number(form.cashReceived) || 0);
//   }, [totalChequeAmount, form.cashReceived]);

//   const balanceDue = useMemo(() => {
//     return (Number(form.rentalAmount) || 0) - totalPaid;
//   }, [form.rentalAmount, totalPaid]);

// const handleSave = async (e) => {
//     e.preventDefault();

//     if (saving) {
//       return;
//     }

//     const companyID = getCompanyID();
//     const userID = getUserID();

//     if (!companyID) {
//       setErrorMessage("CompanyID not found. Please login again.");

//       return;
//     }

//     if (!selectedPropertyId) {
//       setErrorMessage("Please select a property first.");

//       return;
//     }

//     if (!userID) {
//       setErrorMessage("UserID not found. Please login again.");

//       return;
//     }

//     if (!form.flatNo.trim()) {
//       setErrorMessage("Please enter the Flat No.");

//       return;
//     }

//     if (!form.tenantName.trim()) {
//       setErrorMessage("Please enter the Tenant Name.");

//       return;
//     }

//     setSaving(true);
//     setSuccessMessage("");
//     setErrorMessage("");

//     try {
//       const payload = {
       
//         RecordID: Number(form.RecordID || 0),

//         PropertyID: Number(selectedPropertyId),

//         FlatNo: form.flatNo || null,

//         TenantName: form.tenantName || null,

//         FlatType: form.flatType || null,

//         RentalAmount:
//           form.rentalAmount === "" ? null : Number(form.rentalAmount),

//         CashReceived:
//           form.cashReceived === "" ? null : Number(form.cashReceived),

//         TotalChequeAmount: totalChequeAmount,
//         TotalPaid: totalPaid,
//         BalanceDue: balanceDue,

//         Remarks: form.remarks || null,

//         CompanyID: companyID,
//         UserID: userID,
//       };

//       // Dynamic list — send as an array so any number of
//       // cheques can be added, not just a fixed set.
//       payload.Cheques = form.cheques.map((c) => ({
//         Amount: c.amount === "" ? null : Number(c.amount),
//         Date: c.date || null,
//       }));

//       const response = await api.post(
//         "/api/insertUpdatePropertyMaster",
//         payload,
//       );

//       const data = response.data;

//       if (!data?.success) {
//         throw new Error(data?.message || "Failed to save record");
//       }

//       const savedRecordId = Number(
//         data.RecordID || data.data?.RecordID || form.RecordID || 0,
//       );

//       setForm((prev) => ({
//         ...prev,
//         RecordID: savedRecordId,
//       }));

//       setSuccessMessage(
//         data?.message ||
//           (form.RecordID
//             ? "Record updated successfully."
//             : "Record saved successfully."),
//       );

//       setShowForm(false);

//       await loadRecords(selectedPropertyId);
//     } catch (error) {
//       console.error("Save record error:", error);

//       setErrorMessage(
//         error?.response?.data?.message ||
//           error.message ||
//           "Failed to save record",
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   // =========================================================
//   // DELETE
//   // =========================================================

//   const handleDelete = async (record) => {
//     if (deleting || saving) {
//       return;
//     }

//     const companyID = getCompanyID();
//     const userID = getUserID();

//     const recordId = Number(record?.RecordID) || 0;

//     if (!recordId) {
//       return;
//     }

//     if (!companyID || !userID || !selectedPropertyId) {
//       setErrorMessage("Session expired. Please login again.");

//       return;
//     }

//     const confirmed = window.confirm(
//       "Are you sure you want to delete this record?",
//     );

//     if (!confirmed) {
//       return;
//     }

//     setDeleting(true);
//     setSuccessMessage("");
//     setErrorMessage("");

//     try {
//       const response = await api.delete("/api/deletePropertyMaster", {
//         data: {
//           RecordID: recordId,
//           PropertyID: Number(selectedPropertyId),
//           CompanyID: companyID,
//           UserID: userID,
//         },
//       });

//       const data = response.data;

//       if (!data?.success) {
//         throw new Error(data?.message || "Failed to delete record");
//       }

//       setSuccessMessage(data?.message || "Record deleted successfully.");

//       await loadRecords(selectedPropertyId);
//     } catch (error) {
//       console.error("Delete record error:", error);

//       setErrorMessage(
//         error?.response?.data?.message ||
//           error.message ||
//           "Failed to delete record",
//       );
//     } finally {
//       setDeleting(false);
//     }
//   };

//   // =========================================================
//   // RESET
//   // =========================================================

//   const handleReset = () => {
//     if (form.RecordID) {
//       loadRecord(form.RecordID);
//     } else {
//       setForm({
//         ...DEFAULTS,
//         cheques: emptyCheques(),
//       });
//     }

//     setSuccessMessage("");
//     setErrorMessage("");
//   };

//   // =========================================================
//   // RENDER
//   // =========================================================

//   return (
//     <div className="ps-root">
//       <style>{`

//                 :root{
//                     --ps-primary:#10299b;
//                     --ps-primary-dark:#0b1c6e;
//                     --ps-primary-mid:#4a5fc1;
//                     --ps-primary-soft:#eef1fb;
//                     --ps-primary-tint:#d6ddf5;
//                     --ps-ink:#1a1f36;
//                     --ps-muted:#6b7290;
//                     --ps-green:#1a9e6c;
//                     --ps-green-soft:#e6f7f0;
//                     --ps-danger:#c62828;
//                     --ps-danger-soft:#fdecec;
//                 }

//                 .ps-root{
//                     font-family:"Inter",system-ui,-apple-system,
//                     "Segoe UI",sans-serif;
//                     color:var(--ps-ink);
//                 }

//                 .ps-root *{
//                     box-sizing:border-box;
//                 }

//                 .ps-property-picker{
//                     display:flex;
//                     align-items:flex-end;
//                     gap:12px;
//                     flex-wrap:wrap;
//                     background:#fff;
//                     border:1px solid var(--ps-primary-tint);
//                     border-radius:14px;
//                     padding:14px 16px;
//                     margin-bottom:18px;
//                     box-shadow:
//                         0 4px 18px rgba(16,41,155,.06);
//                 }

//                 .ps-property-picker .ps-field{
//                     flex:1;
//                     min-width:240px;
//                     margin:0;
//                 }

//                 .ps-empty-state{
//                     text-align:center;
//                     padding:48px 20px;
//                     color:var(--ps-muted);
//                     background:#fff;
//                     border:1px solid var(--ps-primary-tint);
//                     border-radius:16px;
//                 }

//                 .ps-empty-state i{
//                     font-size:1.9rem;
//                     color:var(--ps-primary-tint);
//                     margin-bottom:8px;
//                     display:block;
//                 }

//                 .ps-empty-state .ps-empty-title{
//                     font-weight:700;
//                     color:var(--ps-primary-dark);
//                     font-size:.9rem;
//                 }

//                 .ps-toolbar{
//                     display:flex;
//                     flex-wrap:wrap;
//                     align-items:center;
//                     gap:10px;
//                     margin-bottom:16px;
//                 }

//                 .ps-search-wrap{
//                     position:relative;
//                     flex:1;
//                     min-width:240px;
//                 }

//                 .ps-search-wrap i{
//                     position:absolute;
//                     left:12px;
//                     top:50%;
//                     transform:translateY(-50%);
//                     color:var(--ps-primary-mid);
//                     font-size:.85rem;
//                 }

//                 .ps-search-input{
//                     width:100%;
//                     border:1px solid var(--ps-primary-tint);
//                     border-radius:9px;
//                     padding:9px 12px 9px 34px;
//                     font-size:.85rem;
//                     background:var(--ps-primary-soft);
//                     outline:none;
//                     transition:
//                         border-color .15s ease,
//                         background .15s ease;
//                 }

//                 .ps-search-input:focus{
//                     border-color:var(--ps-primary);
//                     background:#fff;
//                 }

//                 .ps-table-card{
//                     background:#fff;
//                     border:1px solid var(--ps-primary-tint);
//                     border-radius:16px;
//                     overflow:hidden;
//                     box-shadow:
//                         0 4px 18px rgba(16,41,155,.06);
//                 }

//                 .ps-table{
//                     width:100%;
//                     border-collapse:collapse;
//                 }

//                 .ps-table thead th{
//                     background:var(--ps-primary-soft);
//                     color:var(--ps-primary-dark);
//                     font-size:.7rem;
//                     font-weight:700;
//                     text-transform:uppercase;
//                     letter-spacing:.5px;
//                     padding:12px 16px;
//                     text-align:left;
//                     border-bottom:2px solid var(--ps-primary-tint);
//                     white-space:nowrap;
//                 }

//                 .ps-table tbody td{
//                     padding:12px 16px;
//                     border-bottom:1px solid #f0f2fa;
//                     font-size:.84rem;
//                     white-space:nowrap;
//                 }

//                 .ps-table tbody tr:last-child td{
//                     border-bottom:none;
//                 }

//                 .ps-table tbody tr:hover{
//                     background:#fafbff;
//                 }

//                 .ps-row-sub{
//                     color:var(--ps-muted);
//                     font-size:.74rem;
//                     margin-top:3px;
//                 }

//                 .ps-action-btn{
//                     border:none;
//                     border-radius:8px;
//                     padding:7px 10px;
//                     font-size:.78rem;
//                     font-weight:700;
//                     cursor:pointer;
//                     background:var(--ps-primary-soft);
//                     color:var(--ps-primary);
//                     margin-right:6px;
//                 }

//                 .ps-action-btn:hover{
//                     background:var(--ps-primary-tint);
//                 }

//                 .ps-action-btn-danger{
//                     background:var(--ps-danger-soft);
//                     color:var(--ps-danger);
//                 }

//                 .ps-action-btn-danger:hover{
//                     background:#f8d7d7;
//                 }

//                 .ps-section{
//                     margin-bottom:26px;
//                 }

//                 .ps-section-head{
//                     display:flex;
//                     align-items:center;
//                     gap:10px;
//                     margin-bottom:16px;
//                     padding-bottom:12px;
//                     border-bottom:1px solid
//                     var(--ps-primary-tint);
//                 }

//                 .ps-section-icon{
//                     width:34px;
//                     height:34px;
//                     border-radius:9px;
//                     background:var(--ps-primary-soft);
//                     color:var(--ps-primary);
//                     display:flex;
//                     align-items:center;
//                     justify-content:center;
//                     font-size:.95rem;
//                     flex-shrink:0;
//                 }

//                 .ps-section-title{
//                     font-size:.95rem;
//                     font-weight:700;
//                     color:var(--ps-primary-dark);
//                     margin:0;
//                 }

//                 .ps-section-sub{
//                     font-size:.76rem;
//                     color:var(--ps-muted);
//                     margin-top:1px;
//                 }

//                 .ps-grid{
//                     display:grid;
//                     grid-template-columns:
//                         repeat(auto-fill,minmax(230px,1fr));
//                     gap:16px 18px;
//                 }

//                 .ps-field label{
//                     display:block;
//                     font-size:.72rem;
//                     font-weight:700;
//                     text-transform:uppercase;
//                     letter-spacing:.4px;
//                     color:var(--ps-primary-mid);
//                     margin-bottom:6px;
//                 }

//                 .ps-input,
//                 .ps-select,
//                 .ps-textarea{
//                     width:100%;
//                     border:1px solid
//                         var(--ps-primary-tint);
//                     border-radius:9px;
//                     padding:9px 12px;
//                     font-size:.85rem;
//                     color:var(--ps-ink);
//                     background:#fff;
//                     outline:none;
//                     transition:
//                         border-color .15s ease,
//                         box-shadow .15s ease;
//                 }

//                 .ps-textarea{
//                     resize:vertical;
//                     min-height:80px;
//                     font-family:inherit;
//                 }

//                 .ps-input:focus,
//                 .ps-select:focus,
//                 .ps-textarea:focus{
//                     border-color:
//                         var(--ps-primary);

//                     box-shadow:
//                         0 0 0 3px
//                         rgba(16,41,155,.12);
//                 }

//                 .ps-cheque-table{
//                     width:100%;
//                     border-collapse:collapse;
//                 }

//                 .ps-cheque-table thead th{
//                     background:var(--ps-primary-soft);
//                     color:var(--ps-primary-dark);
//                     font-size:.68rem;
//                     font-weight:700;
//                     text-transform:uppercase;
//                     letter-spacing:.4px;
//                     padding:9px 10px;
//                     text-align:left;
//                     border-bottom:2px solid var(--ps-primary-tint);
//                 }

//                 .ps-cheque-table tbody td{
//                     padding:8px 10px;
//                     border-bottom:1px solid #f0f2fa;
//                 }

//                 .ps-cheque-table tbody tr:last-child td{
//                     border-bottom:none;
//                 }

//                 .ps-summary-row{
//                     display:flex;
//                     flex-wrap:wrap;
//                     gap:14px;
//                     margin-top:16px;
//                 }

//                 .ps-summary-card{
//                     flex:1;
//                     min-width:170px;
//                     background:var(--ps-primary-soft);
//                     border:1px solid var(--ps-primary-tint);
//                     border-radius:12px;
//                     padding:12px 16px;
//                 }

//                 .ps-summary-card.danger{
//                     background:var(--ps-danger-soft);
//                     border-color:#f5c2c7;
//                 }

//                 .ps-summary-card.success{
//                     background:var(--ps-green-soft);
//                     border-color:#b8e7d2;
//                 }

//                 .ps-summary-label{
//                     font-size:.68rem;
//                     font-weight:700;
//                     text-transform:uppercase;
//                     letter-spacing:.4px;
//                     color:var(--ps-primary-mid);
//                     margin-bottom:4px;
//                 }

//                 .ps-summary-value{
//                     font-size:1.1rem;
//                     font-weight:700;
//                     color:var(--ps-primary-dark);
//                 }

//                 .ps-summary-card.danger .ps-summary-value{
//                     color:var(--ps-danger);
//                 }

//                 .ps-summary-card.success .ps-summary-value{
//                     color:var(--ps-green);
//                 }

//                 .ps-footer{
//                     display:flex;
//                     align-items:center;
//                     flex-wrap:wrap;
//                     gap:10px;
//                     padding-top:18px;
//                     border-top:1px solid
//                         var(--ps-primary-tint);
//                 }

//                 .ps-btn{
//                     border:none;
//                     border-radius:10px;
//                     padding:10px 20px;
//                     font-size:.85rem;
//                     font-weight:700;
//                     transition:all .15s ease;
//                     cursor:pointer;
//                 }

//                 .ps-btn:disabled{
//                     opacity:.6;
//                     cursor:not-allowed;
//                 }

//                 .ps-btn-primary{
//                     background:var(--ps-primary);
//                     color:#fff;
//                 }

//                 .ps-btn-primary:hover:not(:disabled){
//                     background:var(--ps-primary-dark);
//                     box-shadow:
//                         0 4px 10px
//                         rgba(16,41,155,.25);
//                 }

//                 .ps-btn-ghost{
//                     background:var(--ps-primary-soft);
//                     color:var(--ps-primary);
//                 }

//                 .ps-btn-ghost:hover:not(:disabled){
//                     background:var(--ps-primary-tint);
//                 }

//                 .ps-btn-danger{
//                     background:var(--ps-danger-soft);
//                     color:var(--ps-danger);
//                 }

//                 .ps-btn-danger:hover:not(:disabled){
//                     background:#f8d7d7;
//                 }

//                 .ps-empty{
//                     padding:28px;
//                     text-align:center;
//                     color:var(--ps-muted);
//                     font-size:.85rem;
//                 }

//                 .ps-loading{
//                     padding:28px;
//                     text-align:center;
//                     color:var(--ps-primary);
//                     font-weight:600;
//                     font-size:.85rem;
//                 }

//                 .ps-message{
//                     border-radius:9px;
//                     padding:10px 14px;
//                     margin-bottom:15px;
//                     font-size:.82rem;
//                     font-weight:600;
//                 }

//                 .ps-error{
//                     color:#991b1b;
//                     background:var(--ps-danger-soft);
//                     border:1px solid #f5c2c7;
//                 }

//                 .ps-success{
//                     color:#166534;
//                     background:var(--ps-green-soft);
//                     border:1px solid #b8e7d2;
//                 }

//                 .ps-balance-negative{
//                     color:var(--ps-danger);
//                     font-weight:700;
//                 }

//                 .ps-balance-positive{
//                     color:var(--ps-green);
//                     font-weight:700;
//                 }

//                 @media (max-width:768px){

//                     .ps-toolbar{
//                         flex-direction:column;
//                         align-items:stretch;
//                     }

//                     .ps-table-card{
//                         overflow-x:auto;
//                     }

//                     .ps-table{
//                         min-width:900px;
//                     }

//                     .ps-cheque-table{
//                         min-width:640px;
//                         display:block;
//                         overflow-x:auto;
//                     }
//                 }

//             `}</style>

//       {errorMessage && (
//         <div className="ps-message ps-error">
//           <i className="bi bi-exclamation-circle me-2"></i>
//           {errorMessage}
//         </div>
//       )}

//       {successMessage && (
//         <div className="ps-message ps-success">
//           <i className="bi bi-check-circle me-2"></i>
//           {successMessage}
//         </div>
//       )}
//       <div className="ps-property-picker">
//         <div className="ps-field">
//           <label>Property</label>
//           <select
//             className="ps-select"
//             value={selectedPropertyId}
//             onChange={(e) => setSelectedPropertyId(e.target.value)}
//             disabled={propertiesLoading}
//           >
//             <option value="">
//               {propertiesLoading ? "Loading properties…" : "Select a property"}
//             </option>
//             {properties.map((p) => (
//               <option key={p.id} value={p.id}>
//                 {p.label}
//               </option>
//             ))}
//           </select>
//         </div>
//       </div>

//       {!selectedPropertyId ? (
//         <div className="ps-empty-state">
//           <i className="bi bi-houses"></i>
//           <div className="ps-empty-title">
//             Select a property to view its records
//           </div>
//           <div>
//             Flat, tenant and cheque records are tied to a specific property.
//           </div>
//         </div>
//       ) : !showForm ? (
//         /* =================================================
//                    RECORD LIST
//                 ================================================= */

//         <>
//           <div className="ps-toolbar">
//             <div className="ps-search-wrap">
//               <i className="bi bi-search" />

//               <input
//                 className="ps-search-input"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 placeholder="Search by flat no, tenant or flat type"
//               />
//             </div>

//             <button
//               type="button"
//               className="ps-btn ps-btn-primary"
//               onClick={openCreate}
//             >
//               <i className="bi bi-plus-lg me-2" />
//               Add Record
//             </button>
//           </div>

//           <div className="ps-table-card">
//             {loadingRecords ? (
//               <div className="ps-loading">
//                 <i className="bi bi-hourglass-split me-2" />
//                 Loading records...
//               </div>
//             ) : (
//               <table className="ps-table">
//                 <thead>
//                   <tr>
//                     <th>Flat No</th>
//                     <th>Tenant Name</th>
//                     <th>Flat Type</th>
//                     <th>Rental Amount</th>
//                     <th>Total Cheque</th>
//                     <th>Total Paid</th>
//                     <th>Balance Due</th>
//                     <th>Action</th>
//                   </tr>
//                 </thead>

//                 <tbody>
//                   {filteredRecords.length === 0 ? (
//                     <tr>
//                       <td colSpan="8" className="ps-empty">
//                         No matching records found.
//                       </td>
//                     </tr>
//                   ) : (
//                     filteredRecords.map((record) => (
//                       <tr key={record.RecordID}>
//                         <td>{record.FlatNo || "—"}</td>

//                         <td>{record.TenantName || "—"}</td>

//                         <td>{record.FlatType || "—"}</td>

//                         <td>{money(record.RentalAmount)}</td>

//                         <td>{money(record.TotalCheque)}</td>

//                         <td>{money(record.TotalPaid)}</td>

//                         <td
//                           className={
//                             record.BalanceDue > 0
//                               ? "ps-balance-negative"
//                               : "ps-balance-positive"
//                           }
//                         >
//                           {money(record.BalanceDue)}
//                         </td>

//                         <td>
//                           <button
//                             type="button"
//                             className="ps-action-btn"
//                             onClick={() => openEdit(record)}
//                           >
//                             <i className="bi bi-pencil me-1" />
//                             Edit
//                           </button>

//                           <button
//                             type="button"
//                             className="ps-action-btn ps-action-btn-danger"
//                             onClick={() => handleDelete(record)}
//                             disabled={deleting}
//                           >
//                             <i className="bi bi-trash me-1" />
//                             Delete
//                           </button>
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             )}
//           </div>
//         </>
//       ) : (
//         /* =================================================
//                    RECORD FORM
//                 ================================================= */

//         <form onSubmit={handleSave}>
//           <div className="ps-section-sub" style={{ marginBottom: 14 }}>
//             Property:{" "}
//             {selectedProperty
//               ? selectedProperty.label
//               : `#${selectedPropertyId}`}
//           </div>

//           {loadingRecord && (
//             <div className="ps-loading">
//               <i className="bi bi-hourglass-split me-2" />
//               Loading record...
//             </div>
//           )}

//           <div className="ps-section">
//             <div className="ps-section-head">
//               <div className="ps-section-icon">
//                 <i className="bi bi-house-door" />
//               </div>

//               <div>
//                 <p className="ps-section-title">Flat & Tenant Details</p>
//                 <div className="ps-section-sub">Basic occupancy details</div>
//               </div>
//             </div>

//             <div className="ps-grid">
//               {/* <div className="ps-field">
//                                 <label>Flat No</label>
//                                 <input
//                                     type="text"
//                                     className="ps-input"
//                                     value={form.flatNo}
//                                     onChange={handleChange("flatNo")}
//                                     placeholder="e.g. A-101"
//                                     disabled={
//                                         saving ||
//                                         deleting ||
//                                         form.RecordID > 0
//                                     }
//                                     readOnly={form.RecordID > 0}
//                                 />
//                             </div> */}
//               <div className="ps-field">
//                 <label>Flat No</label>
//                 <input
//                   type="text"
//                   className="ps-input"
//                   value={form.flatNo}
//                   onChange={handleChange("flatNo")}
//                   placeholder="e.g. A-101"
//                   disabled={saving || deleting}
//                   readOnly={form.RecordID > 0 && !!form.flatNo}
//                   style={
//                     form.RecordID > 0 && form.flatNo
//                       ? {
//                           backgroundColor: "#e2e8f0",
//                           cursor: "not-allowed",
//                         }
//                       : undefined
//                   }
//                 />
//               </div>

//               <div className="ps-field">
//                 <label>Tenant Name</label>
//                 <input
//                   type="text"
//                   className="ps-input"
//                   value={form.tenantName}
//                   onChange={handleChange("tenantName")}
//                   placeholder="Tenant full name"
//                   disabled={saving || deleting}
//                 />
//               </div>

//               <div className="ps-field">
//                 <label>Flat Type</label>
//                 <input
//                   type="text"
//                   className="ps-input"
//                   list={
//                     form.RecordID > 0 && form.flatType
//                       ? undefined
//                       : "flatTypeSuggestions"
//                   }
//                   value={form.flatType}
//                   onChange={handleChange("flatType")}
//                   placeholder="e.g. 2 BHK"
//                   disabled={saving || deleting}
//                   readOnly={form.RecordID > 0 && !!form.flatType}
//                   style={
//                     form.RecordID > 0 && form.flatType
//                       ? { backgroundColor: "#e2e8f0", cursor: "not-allowed" }
//                       : undefined
//                   }
//                 />
//                 <datalist id="flatTypeSuggestions">
//                   {FLAT_TYPE_SUGGESTIONS.map((v) => (
//                     <option key={v} value={v} />
//                   ))}
//                 </datalist>
//               </div>

//               <div className="ps-field">
//                 <label>Rental Amount</label>
//                 <input
//                   type="number"
//                   step="0.01"
//                   min="0"
//                   className="ps-input"
//                   value={form.rentalAmount}
//                   onChange={handleChange("rentalAmount")}
//                   placeholder="e.g. 45000"
//                   disabled={saving || deleting}
//                 />
//               </div>
//             </div>
//           </div>

//           <div className="ps-section">
//             <div className="ps-section-head">
//               <div className="ps-section-icon">
//                 <i className="bi bi-bank" />
//               </div>

//               <div style={{ flex: 1 }}>
//                 <p className="ps-section-title">Cheque Details</p>
//                 <div className="ps-section-sub">
//                   Add as many post-dated cheques as needed
//                 </div>
//               </div>

//               <button
//                 type="button"
//                 className="ps-action-btn"
//                 onClick={handleAddCheque}
//                 disabled={saving || deleting}
//               >
//                 <i className="bi bi-plus-lg me-1" />
//                 Add Cheque
//               </button>
//             </div>

//             <div className="ps-table-card">
//               <table className="ps-cheque-table">
//                 <thead>
//                   <tr>
//                     <th>#</th>
//                     <th>Cheque Amount</th>
//                     <th>Cheque Date</th>
//                     <th></th>
//                   </tr>
//                 </thead>

//                 <tbody>
//                   {form.cheques.map((cheque, index) => (
//                     <tr key={index}>
//                       <td>{index + 1}</td>

//                       <td>
//                         <input
//                           type="number"
//                           step="0.01"
//                           min="0"
//                           className="ps-input"
//                           value={cheque.amount}
//                           onChange={handleChequeChange(index, "amount")}
//                           placeholder="0.00"
//                           disabled={saving || deleting}
//                         />
//                       </td>

//                       <td>
//                         <input
//                           type="date"
//                           className="ps-input"
//                           value={cheque.date}
//                           onChange={handleChequeChange(index, "date")}
//                           disabled={saving || deleting}
//                         />
//                       </td>

//                       <td>
//                         <button
//                           type="button"
//                           className="ps-action-btn ps-action-btn-danger"
//                           onClick={() => handleRemoveCheque(index)}
//                           disabled={
//                             saving || deleting || form.cheques.length <= 1
//                           }
//                           title="Remove this cheque"
//                         >
//                           <i className="bi bi-x-lg" />
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           <div className="ps-section">
//             <div className="ps-section-head">
//               <div className="ps-section-icon">
//                 <i className="bi bi-cash-stack" />
//               </div>

//               <div>
//                 <p className="ps-section-title">Payment Summary</p>
//                 <div className="ps-section-sub">Cash received and totals</div>
//               </div>
//             </div>

//             <div className="ps-grid">
//               <div className="ps-field">
//                 <label>Cash Received</label>
//                 <input
//                   type="number"
//                   step="0.01"
//                   min="0"
//                   className="ps-input"
//                   value={form.cashReceived}
//                   onChange={handleChange("cashReceived")}
//                   placeholder="e.g. 5000"
//                   disabled={saving || deleting}
//                 />
//               </div>
//             </div>

//             <div className="ps-summary-row">
//               <div className="ps-summary-card">
//                 <div className="ps-summary-label">Total Cheque Amount</div>
//                 <div className="ps-summary-value">
//                   {money(totalChequeAmount)}
//                 </div>
//               </div>

//               <div className="ps-summary-card success">
//                 <div className="ps-summary-label">Total Paid</div>
//                 <div className="ps-summary-value">{money(totalPaid)}</div>
//               </div>

//               <div
//                 className={`ps-summary-card ${
//                   balanceDue > 0 ? "danger" : "success"
//                 }`}
//               >
//                 <div className="ps-summary-label">Balance Due</div>
//                 <div className="ps-summary-value">{money(balanceDue)}</div>
//               </div>
//             </div>
//           </div>

//           <div className="ps-section">
//             <div className="ps-section-head">
//               <div className="ps-section-icon">
//                 <i className="bi bi-chat-left-text" />
//               </div>

//               <div>
//                 <p className="ps-section-title">Remarks</p>
//                 <div className="ps-section-sub">
//                   Any additional notes for this record
//                 </div>
//               </div>
//             </div>

//             <div className="ps-field">
//               <textarea
//                 className="ps-textarea"
//                 value={form.remarks}
//                 onChange={handleChange("remarks")}
//                 placeholder="Optional remarks"
//                 disabled={saving || deleting}
//               />
//             </div>
//           </div>

//           <div className="ps-footer">
//             <button
//               type="submit"
//               className="ps-btn ps-btn-primary"
//               disabled={saving || deleting || loadingRecord}
//             >
//               <i
//                 className={`bi ${
//                   saving ? "bi-hourglass-split" : "bi-check2-circle"
//                 } me-2`}
//               />

//               {saving
//                 ? "Saving..."
//                 : form.RecordID
//                   ? "Update Record"
//                   : "Save Record"}
//             </button>

//             <button
//               type="button"
//               className="ps-btn ps-btn-ghost"
//               onClick={handleReset}
//               disabled={saving || deleting}
//             >
//               Reset
//             </button>

//             {form.RecordID > 0 && (
//               <button
//                 type="button"
//                 className="ps-btn ps-btn-danger"
//                 onClick={() => handleDelete(form)}
//                 disabled={saving || deleting}
//               >
//                 <i
//                   className={`bi ${
//                     deleting ? "bi-hourglass-split" : "bi-trash"
//                   } me-2`}
//                 />

//                 {deleting ? "Deleting..." : "Delete"}
//               </button>
//             )}

//             <button
//               type="button"
//               className="ps-btn ps-btn-ghost"
//               onClick={backToList}
//               disabled={saving || deleting}
//             >
//               <i className="bi bi-arrow-left me-2" />
//               Back
//             </button>
//           </div>
//         </form>
//       )}
//     </div>
//   );
// };

// export default PropertyMaster;
import { useEffect, useMemo, useState } from "react";
import api from "../../apiService";

// Suggestions only — Flat Type is a free-typed field, not a fixed dropdown.
const FLAT_TYPE_SUGGESTIONS = [
  "Studio",
  "1 BHK",
  "2 BHK",
  "3 BHK",
  "4 BHK",
  "Penthouse",
  "Other",
];

const DEFAULTS = {
  RecordID: 0,
  flatNo: "",
  flatType: "",
  remarks: "",
};

// API PROPERTY -> PICKER OPTION
const mapApiProperty = (p) => ({
  id: p.PropertyID ?? p.propertyId ?? p.id,
  label:
    p.PropertyName ??
    p.PropertyLabel ??
    p.propertyLabel ??
    p.Name ??
    `Property #${p.PropertyID ?? p.id}`,
});

// CONVERT API RECORD -> LIST ROW SHAPE
const mapApiRecord = (item) => ({
  RecordID: Number(item.RecordID) || 0,
  FlatNo: item.FlatNo || "",
  FlatType: item.FlatType || "",
  Remarks: item.Remarks || "",
});

const PropertyMaster = () => {
  // PROPERTY SELECTION
  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");

  // LIST
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // FORM
  const [form, setForm] = useState({ ...DEFAULTS });
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const selectedProperty = properties.find(
    (p) => String(p.id) === String(selectedPropertyId),
  );

  const getCompanyID = () => Number(sessionStorage.getItem("CompanyID")) || 0;
  const getUserID = () =>
    Number(sessionStorage.getItem("UserId")) ||
    Number(sessionStorage.getItem("UserID")) ||
    0;

  // ── LOAD PROPERTIES ────────────────────────────────────────
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
        error?.response?.data?.message || "Failed to load properties.",
      );
    } finally {
      setPropertiesLoading(false);
    }
  };

  // ── LOAD RECORDS (flats) FOR A PROPERTY ────────────────────
  const loadRecords = async (propertyId) => {
    const companyID = getCompanyID();
    if (!companyID || !propertyId) return;

    setLoadingRecords(true);
    setErrorMessage("");
    try {
      const response = await api.get("/api/getPropertyMaster", {
        params: { CompanyID: companyID, PropertyID: propertyId },
      });
      const data = response.data;
      if (data?.success) {
        const list = Array.isArray(data.data)
          ? data.data.map(mapApiRecord)
          : [];
        setRecords(list);
      } else {
        setRecords([]);
        setErrorMessage(data?.message || "Failed to load records.");
      }
    } catch (error) {
      console.error("Load property master error:", error);
      setRecords([]);
      setErrorMessage(
        error?.response?.data?.message || "Failed to load records.",
      );
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    setShowForm(false);
    setForm({ ...DEFAULTS });
    setSearchTerm("");
    if (selectedPropertyId) loadRecords(selectedPropertyId);
    else setRecords([]);
  }, [selectedPropertyId]);

  // ── FILTER ────────────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return records;
    return records.filter((record) =>
      [record.FlatNo, record.FlatType]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [records, searchTerm]);

  // ── MAP API -> FORM ───────────────────────────────────────
  const mapRecordToForm = (data) => {
    if (!data) return { ...DEFAULTS };
    return {
      RecordID: Number(data.RecordID || 0),
      flatNo: data.FlatNo || "",
      flatType: data.FlatType || "",
      remarks: data.Remarks || "",
    };
  };

  // ── LOAD ONE RECORD ───────────────────────────────────────
  const loadRecord = async (recordId) => {
    const companyID = getCompanyID();
    if (!companyID || !recordId || !selectedPropertyId) return;

    setLoadingRecord(true);
    setSuccessMessage("");
    setErrorMessage("");
    try {
      const response = await api.get("/api/getPropertyMasterByID", {
        params: {
          RecordID: recordId,
          CompanyID: companyID,
          PropertyID: selectedPropertyId,
        },
      });
      const data = response.data;
      if (!data?.success) {
        throw new Error(data?.message || "Failed to load record");
      }
      setForm(mapRecordToForm(data.data));
    } catch (error) {
      console.error("Record loading error:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          error.message ||
          "Failed to load record",
      );
    } finally {
      setLoadingRecord(false);
    }
  };

  // ── OPEN / CLOSE FORM ─────────────────────────────────────
  const openCreate = () => {
    setForm({ ...DEFAULTS });
    setSuccessMessage("");
    setErrorMessage("");
    setShowForm(true);
  };

  const openEdit = async (record) => {
    setSuccessMessage("");
    setErrorMessage("");
    setShowForm(true);
    await loadRecord(record.RecordID);
  };

  const backToList = () => {
    setShowForm(false);
    setSuccessMessage("");
    setErrorMessage("");
  };

  // ── INPUT HANDLER ─────────────────────────────────────────
  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccessMessage("");
    setErrorMessage("");
  };

  // ── SAVE ──────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;

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
    if (!userID) {
      setErrorMessage("UserID not found. Please login again.");
      return;
    }
    if (!form.flatNo.trim()) {
      setErrorMessage("Please enter the Flat No.");
      return;
    }

    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const payload = {
        RecordID: Number(form.RecordID || 0),
        PropertyID: Number(selectedPropertyId),
        FlatNo: form.flatNo || null,
        FlatType: form.flatType || null,
        Remarks: form.remarks || null,
        CompanyID: companyID,
        UserID: userID,
      };

      const response = await api.post(
        "/api/insertUpdatePropertyMaster",
        payload,
      );
      const data = response.data;

      if (!data?.success) {
        throw new Error(data?.message || "Failed to save record");
      }

      const savedRecordId = Number(
        data.RecordID || data.data?.RecordID || form.RecordID || 0,
      );
      setForm((prev) => ({ ...prev, RecordID: savedRecordId }));

      setSuccessMessage(
        data?.message ||
          (form.RecordID
            ? "Record updated successfully."
            : "Record saved successfully."),
      );

      setShowForm(false);
      await loadRecords(selectedPropertyId);
    } catch (error) {
      console.error("Save record error:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          error.message ||
          "Failed to save record",
      );
    } finally {
      setSaving(false);
    }
  };

  // ── DELETE ────────────────────────────────────────────────
  const handleDelete = async (record) => {
    if (deleting || saving) return;

    const companyID = getCompanyID();
    const userID = getUserID();
    const recordId = Number(record?.RecordID) || 0;

    if (!recordId) return;
    if (!companyID || !userID || !selectedPropertyId) {
      setErrorMessage("Session expired. Please login again.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this flat?",
    );
    if (!confirmed) return;

    setDeleting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await api.post("/api/deletePropertyMaster", {
          RecordID: recordId,
          PropertyID: Number(selectedPropertyId),
          CompanyID: companyID,
          UserID: userID,
        },);
      const data = response.data;
      if (!data?.success) {
        throw new Error(data?.message || "Failed to delete record");
      }
      setSuccessMessage(data?.message || "Flat deleted successfully.");
      await loadRecords(selectedPropertyId);
    } catch (error) {
      console.error("Delete record error:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          error.message ||
          "Failed to delete record",
      );
    } finally {
      setDeleting(false);
    }
  };

  // ── RESET ─────────────────────────────────────────────────
  const handleReset = () => {
    if (form.RecordID) loadRecord(form.RecordID);
    else setForm({ ...DEFAULTS });
    setSuccessMessage("");
    setErrorMessage("");
  };

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div className="ps-root">
      <style>{`
        :root{
          --ps-primary:#10299b;
          --ps-primary-dark:#0b1c6e;
          --ps-primary-mid:#4a5fc1;
          --ps-primary-soft:#eef1fb;
          --ps-primary-tint:#d6ddf5;
          --ps-ink:#1a1f36;
          --ps-muted:#6b7290;
          --ps-green:#1a9e6c;
          --ps-green-soft:#e6f7f0;
          --ps-danger:#c62828;
          --ps-danger-soft:#fdecec;
        }
        .ps-root{font-family:"Inter",system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ps-ink);}
        .ps-root *{box-sizing:border-box;}
        .ps-property-picker{display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap;background:#fff;border:1px solid var(--ps-primary-tint);border-radius:14px;padding:14px 16px;margin-bottom:18px;box-shadow:0 4px 18px rgba(16,41,155,.06);}
        .ps-property-picker .ps-field{flex:1;min-width:240px;margin:0;}
        .ps-empty-state{text-align:center;padding:48px 20px;color:var(--ps-muted);background:#fff;border:1px solid var(--ps-primary-tint);border-radius:16px;}
        .ps-empty-state i{font-size:1.9rem;color:var(--ps-primary-tint);margin-bottom:8px;display:block;}
        .ps-empty-state .ps-empty-title{font-weight:700;color:var(--ps-primary-dark);font-size:.9rem;}
        .ps-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-bottom:16px;}
        .ps-search-wrap{position:relative;flex:1;min-width:240px;}
        .ps-search-wrap i{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--ps-primary-mid);font-size:.85rem;}
        .ps-search-input{width:100%;border:1px solid var(--ps-primary-tint);border-radius:9px;padding:9px 12px 9px 34px;font-size:.85rem;background:var(--ps-primary-soft);outline:none;transition:border-color .15s ease,background .15s ease;}
        .ps-search-input:focus{border-color:var(--ps-primary);background:#fff;}
        .ps-table-card{background:#fff;border:1px solid var(--ps-primary-tint);border-radius:16px;overflow:hidden;box-shadow:0 4px 18px rgba(16,41,155,.06);}
        .ps-table{width:100%;border-collapse:collapse;}
        .ps-table thead th{background:var(--ps-primary-soft);color:var(--ps-primary-dark);font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding:12px 16px;text-align:left;border-bottom:2px solid var(--ps-primary-tint);white-space:nowrap;}
        .ps-table tbody td{padding:12px 16px;border-bottom:1px solid #f0f2fa;font-size:.84rem;white-space:nowrap;}
        .ps-table tbody tr:last-child td{border-bottom:none;}
        .ps-table tbody tr:hover{background:#fafbff;}
        .ps-action-btn{border:none;border-radius:8px;padding:7px 10px;font-size:.78rem;font-weight:700;cursor:pointer;background:var(--ps-primary-soft);color:var(--ps-primary);margin-right:6px;}
        .ps-action-btn:hover{background:var(--ps-primary-tint);}
        .ps-action-btn-danger{background:var(--ps-danger-soft);color:var(--ps-danger);}
        .ps-action-btn-danger:hover{background:#f8d7d7;}
        .ps-section{margin-bottom:26px;}
        .ps-section-head{display:flex;align-items:center;gap:10px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--ps-primary-tint);}
        .ps-section-icon{width:34px;height:34px;border-radius:9px;background:var(--ps-primary-soft);color:var(--ps-primary);display:flex;align-items:center;justify-content:center;font-size:.95rem;flex-shrink:0;}
        .ps-section-title{font-size:.95rem;font-weight:700;color:var(--ps-primary-dark);margin:0;}
        .ps-section-sub{font-size:.76rem;color:var(--ps-muted);margin-top:1px;}
        .ps-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px 18px;}
        .ps-field label{display:block;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--ps-primary-mid);margin-bottom:6px;}
        .ps-input,.ps-select,.ps-textarea{width:100%;border:1px solid var(--ps-primary-tint);border-radius:9px;padding:9px 12px;font-size:.85rem;color:var(--ps-ink);background:#fff;outline:none;transition:border-color .15s ease,box-shadow .15s ease;}
        .ps-textarea{resize:vertical;min-height:80px;font-family:inherit;}
        .ps-input:focus,.ps-select:focus,.ps-textarea:focus{border-color:var(--ps-primary);box-shadow:0 0 0 3px rgba(16,41,155,.12);}
        .ps-footer{display:flex;align-items:center;flex-wrap:wrap;gap:10px;padding-top:18px;border-top:1px solid var(--ps-primary-tint);}
        .ps-btn{border:none;border-radius:10px;padding:10px 20px;font-size:.85rem;font-weight:700;transition:all .15s ease;cursor:pointer;}
        .ps-btn:disabled{opacity:.6;cursor:not-allowed;}
        .ps-btn-primary{background:var(--ps-primary);color:#fff;}
        .ps-btn-primary:hover:not(:disabled){background:var(--ps-primary-dark);box-shadow:0 4px 10px rgba(16,41,155,.25);}
        .ps-btn-ghost{background:var(--ps-primary-soft);color:var(--ps-primary);}
        .ps-btn-ghost:hover:not(:disabled){background:var(--ps-primary-tint);}
        .ps-btn-danger{background:var(--ps-danger-soft);color:var(--ps-danger);}
        .ps-btn-danger:hover:not(:disabled){background:#f8d7d7;}
        .ps-empty{padding:28px;text-align:center;color:var(--ps-muted);font-size:.85rem;}
        .ps-loading{padding:28px;text-align:center;color:var(--ps-primary);font-weight:600;font-size:.85rem;}
        .ps-message{border-radius:9px;padding:10px 14px;margin-bottom:15px;font-size:.82rem;font-weight:600;}
        .ps-error{color:#991b1b;background:var(--ps-danger-soft);border:1px solid #f5c2c7;}
        .ps-success{color:#166534;background:var(--ps-green-soft);border:1px solid #b8e7d2;}
        @media (max-width:768px){
          .ps-toolbar{flex-direction:column;align-items:stretch;}
          .ps-table-card{overflow-x:auto;}
          .ps-table{min-width:600px;}
        }
      `}</style>

      {errorMessage && (
        <div className="ps-message ps-error">
          <i className="bi bi-exclamation-circle me-2"></i>
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="ps-message ps-success">
          <i className="bi bi-check-circle me-2"></i>
          {successMessage}
        </div>
      )}

      <div className="ps-property-picker">
        <div className="ps-field">
          <label>Property</label>
          <select
            className="ps-select"
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            disabled={propertiesLoading}
          >
            <option value="">
              {propertiesLoading ? "Loading properties…" : "Select a property"}
            </option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedPropertyId ? (
        <div className="ps-empty-state">
          <i className="bi bi-houses"></i>
          <div className="ps-empty-title">
            Select a property to view its flats
          </div>
          <div>Flat records are tied to a specific property.</div>
        </div>
      ) : !showForm ? (
        <>
          <div className="ps-toolbar">
            <div className="ps-search-wrap">
              <i className="bi bi-search" />
              <input
                className="ps-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by flat no or flat type"
              />
            </div>
            <button
              type="button"
              className="ps-btn ps-btn-primary"
              onClick={openCreate}
            >
              <i className="bi bi-plus-lg me-2" />
              Add Flat
            </button>
          </div>

          <div className="ps-table-card">
            {loadingRecords ? (
              <div className="ps-loading">
                <i className="bi bi-hourglass-split me-2" />
                Loading flats...
              </div>
            ) : (
              <table className="ps-table">
                <thead>
                  <tr>
                    <th>Flat No</th>
                    <th>Flat Type</th>
                    <th>Remarks</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="ps-empty">
                        No flats yet.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => (
                      <tr key={record.RecordID}>
                        <td>{record.FlatNo || "—"}</td>
                        <td>{record.FlatType || "—"}</td>
                        <td>{record.Remarks || "—"}</td>
                        <td>
                          <button
                            type="button"
                            className="ps-action-btn"
                            onClick={() => openEdit(record)}
                          >
                            <i className="bi bi-pencil me-1" />
                            Edit
                          </button>
                          <button
                            type="button"
                            className="ps-action-btn ps-action-btn-danger"
                            onClick={() => handleDelete(record)}
                            disabled={deleting}
                          >
                            <i className="bi bi-trash me-1" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <form onSubmit={handleSave}>
          <div className="ps-section-sub" style={{ marginBottom: 14 }}>
            Property:{" "}
            {selectedProperty
              ? selectedProperty.label
              : `#${selectedPropertyId}`}
          </div>

          {loadingRecord && (
            <div className="ps-loading">
              <i className="bi bi-hourglass-split me-2" />
              Loading flat...
            </div>
          )}

          <div className="ps-section">
            <div className="ps-section-head">
              <div className="ps-section-icon">
                <i className="bi bi-house-door" />
              </div>
              <div>
                <p className="ps-section-title">Flat Details</p>
                <div className="ps-section-sub">
                  Basic flat information
                </div>
              </div>
            </div>

            <div className="ps-grid">
              <div className="ps-field">
                <label>Flat No</label>
                <input
                  type="text"
                  className="ps-input"
                  value={form.flatNo}
                  onChange={handleChange("flatNo")}
                  placeholder="e.g. A-101"
                  disabled={saving || deleting}
                  readOnly={form.RecordID > 0 && !!form.flatNo}
                  style={
                    form.RecordID > 0 && form.flatNo
                      ? { backgroundColor: "#e2e8f0", cursor: "not-allowed" }
                      : undefined
                  }
                />
              </div>

              <div className="ps-field">
                <label>Flat Type</label>
                <input
                  type="text"
                  className="ps-input"
                  list={
                    form.RecordID > 0 && form.flatType
                      ? undefined
                      : "flatTypeSuggestions"
                  }
                  value={form.flatType}
                  onChange={handleChange("flatType")}
                  placeholder="e.g. 2 BHK"
                  disabled={saving || deleting}
                  readOnly={form.RecordID > 0 && !!form.flatType}
                  style={
                    form.RecordID > 0 && form.flatType
                      ? { backgroundColor: "#e2e8f0", cursor: "not-allowed" }
                      : undefined
                  }
                />
                <datalist id="flatTypeSuggestions">
                  {FLAT_TYPE_SUGGESTIONS.map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          <div className="ps-section">
            <div className="ps-section-head">
              <div className="ps-section-icon">
                <i className="bi bi-chat-left-text" />
              </div>
              <div>
                <p className="ps-section-title">Remarks</p>
                <div className="ps-section-sub">
                  Any additional notes for this flat
                </div>
              </div>
            </div>

            <div className="ps-field">
              <textarea
                className="ps-textarea"
                value={form.remarks}
                onChange={handleChange("remarks")}
                placeholder="Optional remarks"
                disabled={saving || deleting}
              />
            </div>
          </div>

          <div className="ps-footer">
            <button
              type="submit"
              className="ps-btn ps-btn-primary"
              disabled={saving || deleting || loadingRecord}
            >
              <i
                className={`bi ${saving ? "bi-hourglass-split" : "bi-check2-circle"} me-2`}
              />
              {saving
                ? "Saving..."
                : form.RecordID
                  ? "Update Flat"
                  : "Save Flat"}
            </button>

            <button
              type="button"
              className="ps-btn ps-btn-ghost"
              onClick={handleReset}
              disabled={saving || deleting}
            >
              Reset
            </button>

            {form.RecordID > 0 && (
              <button
                type="button"
                className="ps-btn ps-btn-danger"
                onClick={() => handleDelete(form)}
                disabled={saving || deleting}
              >
                <i
                  className={`bi ${deleting ? "bi-hourglass-split" : "bi-trash"} me-2`}
                />
                {deleting ? "Deleting..." : "Delete"}
              </button>
            )}

            <button
              type="button"
              className="ps-btn ps-btn-ghost"
              onClick={backToList}
              disabled={saving || deleting}
            >
              <i className="bi bi-arrow-left me-2" />
              Back
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PropertyMaster;
