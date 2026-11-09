
import { useEffect, useMemo, useState } from "react";
import api from "../../apiService";

const AREA_UNITS = ["sq.ft.", "sq.m."];

const KITCHEN_TYPES = ["Open", "Closed"];

const FURNISHING_STATUS = [
    "Fully Furnished",
    "Semi Furnished",
    "Unfurnished"
];

const AC_TYPES = [
    "Central AC",
    "Split AC",
    "Window AC",
    "Ducted AC",
    "None"
];

const YES_NO = ["Yes", "No"];


const DEFAULTS = {
    SpecificationID: 0,
    RecordID: 0,

    totalArea: "",
    areaUnit: "sq.ft.",

    carpetArea: "",
    builtUpArea: "",

    bedrooms: "",
    bathrooms: "",
    balconyCount: "",

    maidRoom: "",
    storeRoom: "",
    laundryRoom: "",

    kitchenType: "",
    furnishingStatus: "",
    acType: "",

    internetAvailability: "",

    electricityMeterNo: "",
    waterMeterNo: "",
    gasConnectionNo: ""
};



const mapApiProperty = (item) => {

    const propertyID = Number(item.PropertyID) || 0;

    return {
        PropertyID: propertyID,

        PropertyName: item.PropertyName || "",
        PropertyCode: item.PropertyCode || "",

        BuildingName: item.BuildingName || "",
        UnitNumber: item.UnitNumber || "",

        City: item.City || "",
        CommunityArea: item.CommunityArea || ""
    };
};


const fullLabel = (property) =>
    property.PropertyName ||
    property.PropertyCode ||
    `Property #${property.PropertyID}`;


const PropertySpecification = () => {

    // --------------------------------------------------------
    // PROPERTY LIST
    // --------------------------------------------------------
    const [properties, setProperties] = useState([]);

    const [loadingProperties, setLoadingProperties] =
        useState(false);

    const [searchTerm, setSearchTerm] = useState("");


    // --------------------------------------------------------
    // PROPERTY MASTER / FLATS
    // --------------------------------------------------------
    const [propertyMasters, setPropertyMasters] =
        useState([]);

    const [loadingPropertyMasters, setLoadingPropertyMasters] =
        useState(false);

    const [selectedRecordID, setSelectedRecordID] =
        useState(0);


    // --------------------------------------------------------
    // SELECTED PROPERTY / SPECIFICATION
    // --------------------------------------------------------
    const [selectedProperty, setSelectedProperty] =
        useState(null);

    const [form, setForm] = useState({
        ...DEFAULTS
    });

    const [loadingSpecification, setLoadingSpecification] =
        useState(false);

    const [showForm, setShowForm] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [deleting, setDeleting] =
        useState(false);

    const [hasSpecification, setHasSpecification] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState("");

    const [successMessage, setSuccessMessage] =
        useState("");


    // =========================================================
    // SESSION
    // =========================================================

    const getCompanyID = () => {

        return Number(
            sessionStorage.getItem("CompanyID")
        ) || 0;
    };


    const getUserID = () => {

        return (
            Number(
                sessionStorage.getItem("UserId")
            ) ||
            Number(
                sessionStorage.getItem("UserID")
            ) ||
            0
        );
    };


    // =========================================================
    // LOAD PROPERTY LIST
    // =========================================================

    const loadProperties = async () => {

        const companyID = getCompanyID();

        if (!companyID) {

            setErrorMessage(
                "CompanyID not found. Please login again."
            );

            return;
        }

        setLoadingProperties(true);
        setErrorMessage("");

        try {

            const response = await api.get(
                "/api/getPropertyInfo",
                {
                    params: {
                        CompanyID: companyID
                    }
                }
            );

            const data = response.data;

            if (data?.success) {

                const list = Array.isArray(data.data)
                    ? data.data.map(mapApiProperty)
                    : [];

                setProperties(list);

            } else {

                setProperties([]);

                setErrorMessage(
                    data?.message ||
                    "Failed to load properties."
                );
            }

        } catch (error) {

            console.error(
                "Load property error:",
                error
            );

            setProperties([]);

            setErrorMessage(
                error?.response?.data?.message ||
                "Failed to load properties."
            );

        } finally {

            setLoadingProperties(false);
        }
    };


    // =========================================================
    // LOAD PROPERTY MASTER / FLATS
    // =========================================================

    const loadPropertyMasters = async (propertyId) => {

        const companyID = getCompanyID();

        if (!companyID || !propertyId) {

            setPropertyMasters([]);

            return;
        }

        setLoadingPropertyMasters(true);
        setErrorMessage("");

        try {

            const response = await api.get(
                "/api/getPropertyMaster",
                {
                    params: {
                        CompanyID: companyID,
                        PropertyID: propertyId
                    }
                }
            );

            const data = response.data;

            if (data?.success) {

                const list = Array.isArray(data.data)
                    ? data.data
                    : [];

                setPropertyMasters(list);

            } else {

                setPropertyMasters([]);

                setErrorMessage(
                    data?.message ||
                    "Failed to load flats."
                );
            }

        } catch (error) {

            console.error(
                "Load property master error:",
                error
            );

            setPropertyMasters([]);

            setErrorMessage(
                error?.response?.data?.message ||
                "Failed to load flats."
            );

        } finally {

            setLoadingPropertyMasters(false);
        }
    };


    // =========================================================
    // LOAD ON PAGE OPEN
    // =========================================================

    useEffect(() => {

        loadProperties();

    }, []);


    // =========================================================
    // FILTER
    // =========================================================

    const filteredProperties = useMemo(() => {

        const term =
            searchTerm.trim().toLowerCase();

        if (!term) {

            return properties;
        }

        return properties.filter((property) =>

            [
                property.PropertyName,
                property.PropertyCode,
                property.BuildingName,
                property.CommunityArea,
                property.City
            ]
                .filter(Boolean)
                .some((value) =>
                    String(value)
                        .toLowerCase()
                        .includes(term)
                )
        );

    }, [properties, searchTerm]);


    // =========================================================
    // MAP API DATA TO FORM
    // =========================================================

    const mapSpecificationToForm = (data) => {

        if (!data) {

            return {
                ...DEFAULTS
            };
        }


        return {

            SpecificationID:
                Number(
                    data.SpecificationID || 0
                ),

            RecordID:
                Number(
                    data.RecordID || 0
                ),

            totalArea:
                data.TotalArea ?? "",

            areaUnit:
                data.AreaUnit || "sq.ft.",

            carpetArea:
                data.CarpetArea ?? "",

            builtUpArea:
                data.BuiltUpArea ?? "",

            bedrooms:
                data.Bedrooms ?? "",

            bathrooms:
                data.Bathrooms ?? "",

            balconyCount:
                data.BalconyCount ?? "",

            maidRoom:
                data.MaidRoom || "",

            storeRoom:
                data.StoreRoom || "",

            laundryRoom:
                data.LaundryRoom || "",

            kitchenType:
                data.KitchenType || "",

            furnishingStatus:
                data.FurnishingStatus || "",

            acType:
                data.ACType || "",

            internetAvailability:
                data.InternetAvailability || "",

            electricityMeterNo:
                data.ElectricityMeterNo || "",

            waterMeterNo:
                data.WaterMeterNo || "",

            gasConnectionNo:
                data.GasConnectionNo || ""
        };
    };


    // =========================================================
    // GET SPECIFICATION BY PROPERTY + PROPERTY MASTER RECORD
    // =========================================================

    const loadSpecification = async (
        propertyId,
        recordID
    ) => {

        const companyID = getCompanyID();

        if (
            !companyID ||
            !propertyId ||
            !recordID
        ) {

            setForm({
                ...DEFAULTS,
                RecordID: recordID || 0
            });

            setHasSpecification(false);

            return;
        }

        setLoadingSpecification(true);
        setSuccessMessage("");
        setErrorMessage("");

        try {

            const response = await api.get(
                "/api/getPropertySpecificationByID",
                {
                    params: {
                        PropertyID: propertyId,
                        RecordID: recordID,
                        CompanyID: companyID
                    }
                }
            );

            const data = response.data;

            if (!data?.success) {

                throw new Error(
                    data?.message ||
                    "Failed to load specification"
                );
            }


            if (!data.data) {

                setForm({
                    ...DEFAULTS,
                    RecordID: recordID
                });

                setHasSpecification(false);

                return;
            }


            const mapped =
                mapSpecificationToForm(
                    data.data
                );

            setForm(mapped);

            setHasSpecification(
                Number(
                    mapped.SpecificationID
                ) > 0
            );

        } catch (error) {

            console.error(
                "Specification loading error:",
                error
            );

            setForm({
                ...DEFAULTS,
                RecordID: recordID
            });

            setHasSpecification(false);

        } finally {

            setLoadingSpecification(false);
        }
    };


    // =========================================================
    // OPEN PROPERTY
    // =========================================================

    const handleOpenProperty = async (property) => {

        setSelectedProperty(property);

        setShowForm(false);

        setSuccessMessage("");
        setErrorMessage("");

        setSelectedRecordID(0);

        setPropertyMasters([]);

        setForm({
            ...DEFAULTS
        });

        setHasSpecification(false);

        await loadPropertyMasters(
            property.PropertyID
        );
    };


    // =========================================================
    // CHANGE PROPERTY
    // =========================================================

    const handleChangeProperty = () => {

        setSelectedProperty(null);

        setSelectedRecordID(0);

        setPropertyMasters([]);

        setForm({
            ...DEFAULTS
        });

        setHasSpecification(false);

        setShowForm(false);

        setSuccessMessage("");
        setErrorMessage("");
    };


    // =========================================================
    // SELECT FLAT
    // =========================================================

    const handleSelectFlat = async (e) => {

        const recordID =
            Number(e.target.value) || 0;

        setSelectedRecordID(recordID);

        setShowForm(false);

        setSuccessMessage("");
        setErrorMessage("");

        setHasSpecification(false);

        if (!recordID) {

            setForm({
                ...DEFAULTS
            });

            return;
        }

        setForm({
            ...DEFAULTS,
            RecordID: recordID
        });

        await loadSpecification(
            selectedProperty?.PropertyID,
            recordID
        );
    };


    // =========================================================
    // GET SELECTED FLAT
    // =========================================================

    const selectedFlat = useMemo(() => {

        return propertyMasters.find(
            (item) =>
                Number(item.RecordID) ===
                Number(selectedRecordID)
        );

    }, [
        propertyMasters,
        selectedRecordID
    ]);


    // =========================================================
    // HANDLE INPUT
    // =========================================================

    const handleChange = (field) => (e) => {

        const value = e.target.value;

        setForm((prev) => ({

            ...prev,

            [field]: value

        }));

        setSuccessMessage("");
        setErrorMessage("");
    };


    // =========================================================
    // CREATE
    // =========================================================

    const openCreate = () => {

        if (!selectedRecordID) {

            setErrorMessage(
                "Please select a flat first."
            );

            return;
        }

        setForm({

            ...DEFAULTS,

            RecordID:
                selectedRecordID

        });

        setHasSpecification(false);

        setSuccessMessage("");
        setErrorMessage("");

        setShowForm(true);
    };


    // =========================================================
    // EDIT EXISTING
    // =========================================================

    const openEdit = async () => {

        if (!selectedRecordID) {

            setErrorMessage(
                "Please select a flat first."
            );

            return;
        }

        setSuccessMessage("");
        setErrorMessage("");

        await loadSpecification(
            selectedProperty?.PropertyID,
            selectedRecordID
        );

        setShowForm(true);
    };


    // =========================================================
    // BACK TO SUMMARY
    // =========================================================

    const backToSummary = () => {

        setShowForm(false);

        setSuccessMessage("");
        setErrorMessage("");
    };


    // =========================================================
    // SAVE
    // =========================================================

    const handleSave = async (e) => {

        e.preventDefault();

        if (saving) {
            return;
        }

        const companyID = getCompanyID();
        const userID = getUserID();

        const propertyId =
            Number(
                selectedProperty?.PropertyID
            ) || 0;

        const recordID =
            Number(selectedRecordID) || 0;


        if (!companyID) {

            setErrorMessage(
                "CompanyID not found. Please login again."
            );

            return;
        }


        if (!userID) {

            setErrorMessage(
                "UserID not found. Please login again."
            );

            return;
        }


        if (!propertyId) {

            setErrorMessage(
                "Please select a property."
            );

            return;
        }


        if (!recordID) {

            setErrorMessage(
                "Please select a flat."
            );

            return;
        }


        setSaving(true);
        setSuccessMessage("");
        setErrorMessage("");


        try {

            const payload = {

                SpecificationID:
                    Number(
                        form.SpecificationID || 0
                    ),

                PropertyID:
                    propertyId,

                RecordID:
                    recordID,

                TotalArea:
                    form.totalArea === ""
                        ? null
                        : Number(
                            form.totalArea
                        ),

                AreaUnit:
                    form.areaUnit || null,

                CarpetArea:
                    form.carpetArea === ""
                        ? null
                        : Number(
                            form.carpetArea
                        ),

                BuiltUpArea:
                    form.builtUpArea === ""
                        ? null
                        : Number(
                            form.builtUpArea
                        ),

                Bedrooms:
                    form.bedrooms === ""
                        ? null
                        : Number(
                            form.bedrooms
                        ),

                Bathrooms:
                    form.bathrooms === ""
                        ? null
                        : Number(
                            form.bathrooms
                        ),

                BalconyCount:
                    form.balconyCount === ""
                        ? null
                        : Number(
                            form.balconyCount
                        ),

                MaidRoom:
                    form.maidRoom || null,

                StoreRoom:
                    form.storeRoom || null,

                LaundryRoom:
                    form.laundryRoom || null,

                KitchenType:
                    form.kitchenType || null,

                FurnishingStatus:
                    form.furnishingStatus || null,

                ACType:
                    form.acType || null,

                InternetAvailability:
                    form.internetAvailability || null,

                ElectricityMeterNo:
                    form.electricityMeterNo || null,

                WaterMeterNo:
                    form.waterMeterNo || null,

                GasConnectionNo:
                    form.gasConnectionNo || null,

                CompanyID:
                    companyID,

                UserID:
                    userID
            };


            const response = await api.post(
                "/api/insertUpdatePropertySpecification",
                payload
            );


            const data = response.data;


            if (!data?.success) {

                throw new Error(
                    data?.message ||
                    "Failed to save specification"
                );
            }


            const savedSpecificationId =
                Number(
                    data.SpecificationID ||
                    data.data?.SpecificationID ||
                    form.SpecificationID ||
                    0
                );


            setForm((prev) => ({

                ...prev,

                SpecificationID:
                    savedSpecificationId,

                RecordID:
                    recordID

            }));


            setHasSpecification(true);


            await loadSpecification(
                propertyId,
                recordID
            );


            setSuccessMessage(
                data?.message ||
                "Specification saved successfully."
            );


            setShowForm(false);

        } catch (error) {

            console.error(
                "Save specification error:",
                error
            );

            setErrorMessage(
                error?.response?.data?.message ||
                error.message ||
                "Failed to save specification"
            );

        } finally {

            setSaving(false);
        }
    };


    // =========================================================
    // DELETE
    // =========================================================

    const handleDelete = async () => {

        if (deleting || saving) {
            return;
        }

        const companyID = getCompanyID();
        const userID = getUserID();

        const propertyId =
            Number(
                selectedProperty?.PropertyID
            ) || 0;

        const specificationId =
            Number(
                form.SpecificationID || 0
            );


        if (!specificationId) {
            return;
        }


        if (!companyID || !userID) {

            setErrorMessage(
                "Session expired. Please login again."
            );

            return;
        }


        if (!propertyId) {

            setErrorMessage(
                "Property not selected."
            );

            return;
        }


        if (!selectedRecordID) {

            setErrorMessage(
                "Flat not selected."
            );

            return;
        }


        const confirmed =
            window.confirm(
                "Are you sure you want to delete this specification?"
            );


        if (!confirmed) {
            return;
        }


        setDeleting(true);
        setSuccessMessage("");
        setErrorMessage("");


        try {

            const response = await api.delete(
                "/api/deletePropertySpecification",
                {
                    data: {

                        SpecificationID:
                            specificationId,

                        PropertyID:
                            propertyId,

                        CompanyID:
                            companyID,

                        UserID:
                            userID
                    }
                }
            );


            const data = response.data;


            if (!data?.success) {

                throw new Error(
                    data?.message ||
                    "Failed to delete specification"
                );
            }


            setForm({
                ...DEFAULTS,
                RecordID:
                    selectedRecordID
            });


            setHasSpecification(false);

            setShowForm(false);


            setSuccessMessage(
                data?.message ||
                "Specification deleted successfully."
            );

        } catch (error) {

            console.error(
                "Delete specification error:",
                error
            );

            setErrorMessage(
                error?.response?.data?.message ||
                error.message ||
                "Failed to delete specification"
            );

        } finally {

            setDeleting(false);
        }
    };


    // =========================================================
    // RESET
    // =========================================================

    const handleReset = () => {

        if (hasSpecification) {

            loadSpecification(
                selectedProperty?.PropertyID,
                selectedRecordID
            );

        } else {

            setForm({

                ...DEFAULTS,

                RecordID:
                    selectedRecordID

            });
        }

        setSuccessMessage("");
        setErrorMessage("");
    };


    // =========================================================
    // RENDER
    // =========================================================

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

                .ps-root{
                    font-family:"Inter",system-ui,-apple-system,
                    "Segoe UI",sans-serif;
                    color:var(--ps-ink);
                }

                .ps-root *{
                    box-sizing:border-box;
                }

                .ps-toolbar{
                    display:flex;
                    flex-wrap:wrap;
                    align-items:center;
                    gap:10px;
                    margin-bottom:16px;
                }

                .ps-search-wrap{
                    position:relative;
                    flex:1;
                    min-width:240px;
                }

                .ps-search-wrap i{
                    position:absolute;
                    left:12px;
                    top:50%;
                    transform:translateY(-50%);
                    color:var(--ps-primary-mid);
                    font-size:.85rem;
                }

                .ps-search-input{
                    width:100%;
                    border:1px solid var(--ps-primary-tint);
                    border-radius:9px;
                    padding:9px 12px 9px 34px;
                    font-size:.85rem;
                    background:var(--ps-primary-soft);
                    outline:none;
                    transition:
                        border-color .15s ease,
                        background .15s ease;
                }

                .ps-search-input:focus{
                    border-color:var(--ps-primary);
                    background:#fff;
                }

                .ps-table-card{
                    background:#fff;
                    border:1px solid var(--ps-primary-tint);
                    border-radius:16px;
                    overflow:hidden;
                    box-shadow:
                        0 4px 18px rgba(16,41,155,.06);
                }

                .ps-table{
                    width:100%;
                    border-collapse:collapse;
                }

                .ps-table thead th{
                    background:var(--ps-primary-soft);
                    color:var(--ps-primary-dark);
                    font-size:.7rem;
                    font-weight:700;
                    text-transform:uppercase;
                    letter-spacing:.5px;
                    padding:12px 16px;
                    text-align:left;
                    border-bottom:2px solid var(--ps-primary-tint);
                    white-space:nowrap;
                }

                .ps-table tbody td{
                    padding:12px 16px;
                    border-bottom:1px solid #f0f2fa;
                    font-size:.84rem;
                }

                .ps-table tbody tr:last-child td{
                    border-bottom:none;
                }

                .ps-table tbody tr:hover{
                    background:#fafbff;
                }

                .ps-row-sub{
                    color:var(--ps-muted);
                    font-size:.74rem;
                    margin-top:3px;
                }

                .ps-action-btn{
                    border:none;
                    border-radius:8px;
                    padding:7px 10px;
                    font-size:.78rem;
                    font-weight:700;
                    cursor:pointer;
                    background:var(--ps-primary-soft);
                    color:var(--ps-primary);
                }

                .ps-action-btn:hover{
                    background:var(--ps-primary-tint);
                }

                .ps-section{
                    margin-bottom:26px;
                }

                .ps-section-head{
                    display:flex;
                    align-items:center;
                    gap:10px;
                    margin-bottom:16px;
                    padding-bottom:12px;
                    border-bottom:1px solid
                    var(--ps-primary-tint);
                }

                .ps-section-icon{
                    width:34px;
                    height:34px;
                    border-radius:9px;
                    background:var(--ps-primary-soft);
                    color:var(--ps-primary);
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-size:.95rem;
                    flex-shrink:0;
                }

                .ps-section-title{
                    font-size:.95rem;
                    font-weight:700;
                    color:var(--ps-primary-dark);
                    margin:0;
                }

                .ps-section-sub{
                    font-size:.76rem;
                    color:var(--ps-muted);
                    margin-top:1px;
                }

                .ps-grid{
                    display:grid;
                    grid-template-columns:
                        repeat(auto-fill,minmax(230px,1fr));
                    gap:16px 18px;
                }

                .ps-field label{
                    display:block;
                    font-size:.72rem;
                    font-weight:700;
                    text-transform:uppercase;
                    letter-spacing:.4px;
                    color:var(--ps-primary-mid);
                    margin-bottom:6px;
                }

                .ps-input,
                .ps-select{
                    width:100%;
                    border:1px solid
                        var(--ps-primary-tint);
                    border-radius:9px;
                    padding:9px 12px;
                    font-size:.85rem;
                    color:var(--ps-ink);
                    background:#fff;
                    outline:none;
                    transition:
                        border-color .15s ease,
                        box-shadow .15s ease;
                }

                .ps-input:focus,
                .ps-select:focus{
                    border-color:
                        var(--ps-primary);

                    box-shadow:
                        0 0 0 3px
                        rgba(16,41,155,.12);
                }

                .ps-area-group{
                    display:flex;
                    gap:8px;
                }

                .ps-area-group .ps-input{
                    flex:1;
                }

                .ps-area-group .ps-select{
                    width:100px;
                    flex:0 0 auto;
                }

                .ps-footer{
                    display:flex;
                    align-items:center;
                    flex-wrap:wrap;
                    gap:10px;
                    padding-top:18px;
                    border-top:1px solid
                        var(--ps-primary-tint);
                }

                .ps-btn{
                    border:none;
                    border-radius:10px;
                    padding:10px 20px;
                    font-size:.85rem;
                    font-weight:700;
                    transition:all .15s ease;
                    cursor:pointer;
                }

                .ps-btn:disabled{
                    opacity:.6;
                    cursor:not-allowed;
                }

                .ps-btn-primary{
                    background:var(--ps-primary);
                    color:#fff;
                }

                .ps-btn-primary:hover:not(:disabled){
                    background:var(--ps-primary-dark);
                    box-shadow:
                        0 4px 10px
                        rgba(16,41,155,.25);
                }

                .ps-btn-ghost{
                    background:var(--ps-primary-soft);
                    color:var(--ps-primary);
                }

                .ps-btn-ghost:hover:not(:disabled){
                    background:var(--ps-primary-tint);
                }

                .ps-btn-danger{
                    background:var(--ps-danger-soft);
                    color:var(--ps-danger);
                }

                .ps-btn-danger:hover:not(:disabled){
                    background:#f8d7d7;
                }

                .ps-list-card{
                    background:#fff;
                    border:1px solid
                        var(--ps-primary-tint);
                    border-radius:16px;
                    overflow:hidden;
                    box-shadow:
                        0 4px 18px
                        rgba(16,41,155,.06);
                }

                .ps-context-card{
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:12px;
                    padding:14px 16px;
                    margin-bottom:16px;
                    border:1px solid
                        var(--ps-primary-tint);
                    border-radius:14px;
                    background:var(--ps-primary-soft);
                }

                .ps-context-title{
                    font-size:.78rem;
                    font-weight:700;
                    color:var(--ps-primary-dark);
                    text-transform:uppercase;
                    letter-spacing:.5px;
                }

                .ps-context-sub{
                    font-size:.84rem;
                    color:var(--ps-muted);
                    margin-top:3px;
                }

                .ps-property-item{
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:12px;
                    padding:14px 16px;
                    border-bottom:1px solid #f0f2fa;
                    cursor:pointer;
                }

                .ps-property-item:hover{
                    background:var(--ps-primary-soft);
                }

                .ps-property-item:last-child{
                    border-bottom:none;
                }

                .ps-property-name{
                    font-size:.84rem;
                    font-weight:700;
                    color:var(--ps-primary-dark);
                }

                .ps-property-code{
                    font-size:.74rem;
                    color:var(--ps-muted);
                    margin-top:3px;
                }

                .ps-status{
                    font-size:.72rem;
                    font-weight:700;
                    padding:5px 9px;
                    border-radius:8px;
                }

                .ps-status-saved{
                    color:var(--ps-green);
                    background:var(--ps-green-soft);
                }

                .ps-status-new{
                    color:var(--ps-muted);
                    background:#f3f4f8;
                }

                .ps-empty{
                    padding:28px;
                    text-align:center;
                    color:var(--ps-muted);
                    font-size:.85rem;
                }

                .ps-loading{
                    padding:28px;
                    text-align:center;
                    color:var(--ps-primary);
                    font-weight:600;
                    font-size:.85rem;
                }

                .ps-message{
                    border-radius:9px;
                    padding:10px 14px;
                    margin-bottom:15px;
                    font-size:.82rem;
                    font-weight:600;
                }

                .ps-error{
                    color:#991b1b;
                    background:var(--ps-danger-soft);
                    border:1px solid #f5c2c7;
                }

                .ps-success{
                    color:#166534;
                    background:var(--ps-green-soft);
                    border:1px solid #b8e7d2;
                }

                .ps-saved-msg{
                    display:flex;
                    align-items:center;
                    gap:6px;
                    font-size:.8rem;
                    font-weight:600;
                    color:var(--ps-green);
                    background:var(--ps-green-soft);
                    padding:8px 14px;
                    border-radius:9px;
                }

                @media (max-width:768px){

                    .ps-toolbar{
                        flex-direction:column;
                        align-items:stretch;
                    }

                    .ps-table-card{
                        overflow-x:auto;
                    }

                    .ps-table{
                        min-width:700px;
                    }

                    .ps-context-card{
                        flex-direction:column;
                        align-items:stretch;
                    }
                }

            `}</style>


            {/* =====================================================
                GLOBAL ERROR / SUCCESS MESSAGE
            ====================================================== */}

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


            {!selectedProperty ? (

                /* =================================================
                   PROPERTY LIST
                ================================================= */

                <>

                    <div className="ps-toolbar">

                        <div className="ps-search-wrap">

                            <i className="bi bi-search" />

                            <input
                                className="ps-search-input"
                                value={searchTerm}
                                onChange={(e) =>
                                    setSearchTerm(
                                        e.target.value
                                    )
                                }
                                placeholder="Search by property, code, building or city"
                            />

                        </div>

                    </div>


                    <div className="ps-table-card">

                        {loadingProperties ? (

                            <div className="ps-loading">

                                <i className="bi bi-hourglass-split me-2" />

                                Loading properties...

                            </div>

                        ) : (

                            <table className="ps-table">

                                <thead>

                                    <tr>

                                        <th>Property</th>

                                        <th>Code</th>

                                        <th>City</th>

                                        <th>Action</th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {filteredProperties.length === 0 ? (

                                        <tr>

                                            <td
                                                colSpan="4"
                                                className="ps-empty"
                                            >
                                                No matching properties found.
                                            </td>

                                        </tr>

                                    ) : (

                                        filteredProperties.map(
                                            (property) => (

                                                <tr
                                                    key={
                                                        property.PropertyID
                                                    }
                                                >

                                                    <td>

                                                        <div>
                                                            {
                                                                fullLabel(
                                                                    property
                                                                )
                                                            }
                                                        </div>

                                                        <div className="ps-row-sub">

                                                            {
                                                                property.BuildingName ||
                                                                "—"
                                                            }

                                                            {" · "}

                                                            {
                                                                property.UnitNumber ||
                                                                "—"
                                                            }

                                                        </div>

                                                    </td>


                                                    <td>
                                                        {
                                                            property.PropertyCode ||
                                                            "—"
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            property.City ||
                                                            "—"
                                                        }
                                                    </td>


                                                    <td>

                                                        <button
                                                            type="button"
                                                            className="ps-action-btn"
                                                            onClick={() =>
                                                                handleOpenProperty(
                                                                    property
                                                                )
                                                            }
                                                        >

                                                            <i className="bi bi-box-arrow-in-right me-1" />

                                                            Open

                                                        </button>

                                                    </td>

                                                </tr>

                                            )
                                        )

                                    )}

                                </tbody>

                            </table>

                        )}

                    </div>

                </>

            ) : (

                /* =================================================
                   SELECTED PROPERTY
                ================================================= */

                <>

                    {/* =================================================
                        SELECTED PROPERTY
                    ================================================= */}

                    <div className="ps-context-card">

                        <div>

                            <div className="ps-context-title">
                                Selected Property
                            </div>

                            <div className="ps-context-sub">
                                {
                                    fullLabel(
                                        selectedProperty
                                    )
                                }
                            </div>

                        </div>


                        <button
                            type="button"
                            className="ps-btn ps-btn-ghost"
                            onClick={
                                handleChangeProperty
                            }
                            disabled={
                                saving ||
                                deleting
                            }
                        >

                            Change Property

                        </button>

                    </div>


                    {/* =================================================
                        PROPERTY MASTER / FLAT
                    ================================================= */}

                    <div className="ps-context-card">

                        <div
                            style={{
                                flex: 1
                            }}
                        >

                            <div className="ps-context-title">
                                Select Flat
                            </div>

                            <div className="ps-context-sub">

                                Select an existing
                                Property Master record

                            </div>

                        </div>


                        <div
                            style={{
                                minWidth: "280px",
                                flex: 1
                            }}
                        >

                            <select
                                className="ps-select"
                                value={
                                    selectedRecordID
                                }
                                onChange={
                                    handleSelectFlat
                                }
                                disabled={
                                    loadingPropertyMasters ||
                                    saving ||
                                    deleting
                                }
                            >

                                <option value={0}>

                                    {
                                        loadingPropertyMasters
                                            ? "Loading flats..."
                                            : "Select Flat No"
                                    }

                                </option>


                                {propertyMasters.map(
                                    (flat) => (

                                        <option
                                            key={
                                                flat.RecordID
                                            }
                                            value={
                                                flat.RecordID
                                            }
                                        >

                                            {
                                                flat.FlatNo ||
                                                "—"
                                            }

                                            {" · "}

                                            {
                                                flat.FlatType ||
                                                "—"
                                            }

                                            {" · "}

                                            {
                                                flat.TenantName ||
                                                "No Tenant"
                                            }

                                        </option>

                                    )
                                )}

                            </select>

                        </div>

                    </div>


                    {/* =================================================
                        SELECTED FLAT DETAILS
                    ================================================= */}

                    {selectedFlat && (

                        <div className="ps-context-card">

                            <div>

                                <div className="ps-context-title">
                                    Selected Flat
                                </div>

                                <div className="ps-context-sub">

                                    <strong>
                                        Flat:
                                    </strong>{" "}
                                    {
                                        selectedFlat.FlatNo ||
                                        "—"
                                    }

                                    {" · "}

                                    <strong>
                                        Type:
                                    </strong>{" "}
                                    {
                                        selectedFlat.FlatType ||
                                        "—"
                                    }

                                    {" · "}

                                    <strong>
                                        Tenant:
                                    </strong>{" "}
                                    {
                                        selectedFlat.TenantName ||
                                        "—"
                                    }

                                </div>

                            </div>

                        </div>
                    )}


                    {!selectedRecordID ? (

                        <div className="ps-list-card">

                            <div className="ps-empty">

                                Please select a Flat No to manage
                                its specification.

                            </div>

                        </div>

                    ) : !showForm ? (

                        /* =================================================
                           SPECIFICATION SUMMARY
                        ================================================= */

                        <>

                            <div className="ps-list-card">

                                <div
                                    className="ps-property-item"
                                    onClick={
                                        hasSpecification
                                            ? openEdit
                                            : openCreate
                                    }
                                >

                                    <div>

                                        <div className="ps-property-name">

                                            Property Specification

                                        </div>


                                        <div className="ps-property-code">

                                            {loadingSpecification

                                                ? "Loading specification..."

                                                : hasSpecification

                                                    ? `Specification saved for ${selectedFlat?.FlatNo || "this flat"}`

                                                    : "No specification saved yet"

                                            }

                                        </div>

                                    </div>


                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px"
                                        }}
                                    >

                                        {!loadingSpecification && (

                                            <span
                                                className={
                                                    `ps-status ${
                                                        hasSpecification
                                                            ? "ps-status-saved"
                                                            : "ps-status-new"
                                                    }`
                                                }
                                            >

                                                {
                                                    hasSpecification
                                                        ? "Saved"
                                                        : "New"
                                                }

                                            </span>

                                        )}


                                        <i
                                            className="bi bi-chevron-right"
                                            style={{
                                                color:
                                                    "var(--ps-primary)"
                                            }}
                                        />

                                    </div>

                                </div>

                            </div>


                            {!loadingSpecification && (

                                <div
                                    className="ps-footer"
                                    style={{
                                        marginTop: 16
                                    }}
                                >

                                    <button
                                        type="button"
                                        className="ps-btn ps-btn-primary"
                                        onClick={
                                            hasSpecification
                                                ? openEdit
                                                : openCreate
                                        }
                                    >

                                        <i
                                            className={
                                                `bi ${
                                                    hasSpecification
                                                        ? "bi-pencil"
                                                        : "bi-plus-lg"
                                                } me-2`
                                            }
                                        />

                                        {
                                            hasSpecification
                                                ? "Update Specification"
                                                : "Add Specification"
                                        }

                                    </button>


                                    {hasSpecification && (

                                        <button
                                            type="button"
                                            className="ps-btn ps-btn-danger"
                                            onClick={
                                                handleDelete
                                            }
                                            disabled={
                                                saving ||
                                                deleting
                                            }
                                        >

                                            <i
                                                className={
                                                    `bi ${
                                                        deleting
                                                            ? "bi-hourglass-split"
                                                            : "bi-trash"
                                                    } me-2`
                                                }
                                            />

                                            {
                                                deleting
                                                    ? "Deleting..."
                                                    : "Delete Specification"
                                            }

                                        </button>

                                    )}

                                </div>

                            )}

                        </>

                    ) : (

                        /* =================================================
                           SPECIFICATION FORM
                        ================================================= */

                        <form onSubmit={handleSave}>


                            {/* =========================================
                                AREA DETAILS
                            ========================================= */}

                            <div className="ps-section">

                                <div className="ps-section-head">

                                    <div className="ps-section-icon">

                                        <i className="bi bi-rulers" />

                                    </div>


                                    <div>

                                        <p className="ps-section-title">
                                            Area Details
                                        </p>

                                        <div className="ps-section-sub">
                                            Measurements for this unit
                                        </div>

                                    </div>

                                </div>


                                <div className="ps-grid">


                                    <div className="ps-field">

                                        <label>
                                            Total Area
                                        </label>


                                        <div className="ps-area-group">

                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="ps-input"
                                                value={
                                                    form.totalArea
                                                }
                                                onChange={
                                                    handleChange(
                                                        "totalArea"
                                                    )
                                                }
                                                placeholder="e.g. 1250"
                                                disabled={
                                                    saving ||
                                                    deleting
                                                }
                                            />


                                            <select
                                                className="ps-select"
                                                value={
                                                    form.areaUnit
                                                }
                                                onChange={
                                                    handleChange(
                                                        "areaUnit"
                                                    )
                                                }
                                                disabled={
                                                    saving ||
                                                    deleting
                                                }
                                            >

                                                {AREA_UNITS.map(
                                                    (u) => (

                                                        <option
                                                            key={u}
                                                            value={u}
                                                        >
                                                            {u}
                                                        </option>

                                                    )
                                                )}

                                            </select>

                                        </div>

                                    </div>


                                    <div className="ps-field">

                                        <label>
                                            Carpet Area
                                        </label>

                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="ps-input"
                                            value={
                                                form.carpetArea
                                            }
                                            onChange={
                                                handleChange(
                                                    "carpetArea"
                                                )
                                            }
                                            placeholder="e.g. 1020"
                                            disabled={
                                                saving ||
                                                deleting
                                            }
                                        />

                                    </div>


                                    <div className="ps-field">

                                        <label>
                                            Built-up Area
                                        </label>

                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="ps-input"
                                            value={
                                                form.builtUpArea
                                            }
                                            onChange={
                                                handleChange(
                                                    "builtUpArea"
                                                )
                                            }
                                            placeholder="e.g. 1180"
                                            disabled={
                                                saving ||
                                                deleting
                                            }
                                        />

                                    </div>

                                </div>

                            </div>


                            {/* =========================================
                                ROOM CONFIGURATION
                            ========================================= */}

                            <div className="ps-section">

                                <div className="ps-section-head">

                                    <div className="ps-section-icon">

                                        <i className="bi bi-door-closed" />

                                    </div>


                                    <div>

                                        <p className="ps-section-title">
                                            Room Configuration
                                        </p>

                                        <div className="ps-section-sub">
                                            Layout and additional rooms
                                        </div>

                                    </div>

                                </div>


                                <div className="ps-grid">


                                    <div className="ps-field">

                                        <label>
                                            Number of Bedrooms
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            className="ps-input"
                                            value={
                                                form.bedrooms
                                            }
                                            onChange={
                                                handleChange(
                                                    "bedrooms"
                                                )
                                            }
                                            placeholder="e.g. 2"
                                            disabled={
                                                saving ||
                                                deleting
                                            }
                                        />

                                    </div>


                                    <div className="ps-field">

                                        <label>
                                            Number of Bathrooms
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            className="ps-input"
                                            value={
                                                form.bathrooms
                                            }
                                            onChange={
                                                handleChange(
                                                    "bathrooms"
                                                )
                                            }
                                            placeholder="e.g. 2"
                                            disabled={
                                                saving ||
                                                deleting
                                            }
                                        />

                                    </div>


                                    <div className="ps-field">

                                        <label>
                                            Balcony Count
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            className="ps-input"
                                            value={
                                                form.balconyCount
                                            }
                                            onChange={
                                                handleChange(
                                                    "balconyCount"
                                                )
                                            }
                                            placeholder="e.g. 1"
                                            disabled={
                                                saving ||
                                                deleting
                                            }
                                        />

                                    </div>


                                    <div className="ps-field">

                                        <label>
                                            Maid Room
                                        </label>

                                        <select
                                            className="ps-select"
                                            value={
                                                form.maidRoom
                                            }
                                            onChange={
                                                handleChange(
                                                    "maidRoom"
                                                )
                                            }
                                            disabled={
                                                saving ||
                                                deleting
                                            }
                                        >

                                            <option value="">
                                                Select
                                            </option>

                                            {YES_NO.map(
                                                (v) => (

                                                    <option
                                                        key={v}
                                                        value={v}
                                                    >
                                                        {v}
                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>


                                    <div className="ps-field">

                                        <label>
                                            Store Room
                                        </label>

                                        <select
                                            className="ps-select"
                                            value={
                                                form.storeRoom
                                            }
                                            onChange={
                                                handleChange(
                                                    "storeRoom"
                                                )
                                            }
                                            disabled={
                                                saving ||
                                                deleting
                                            }
                                        >

                                            <option value="">
                                                Select
                                            </option>

                                            {YES_NO.map(
                                                (v) => (

                                                    <option
                                                        key={v}
                                                        value={v}
                                                    >
                                                        {v}
                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>


                                    <div className="ps-field">

                                        <label>
                                            Laundry Room
                                        </label>

                                        <select
                                            className="ps-select"
                                            value={
                                                form.laundryRoom
                                            }
                                            onChange={
                                                handleChange(
                                                    "laundryRoom"
                                                )
                                            }
                                            disabled={
                                                saving ||
                                                deleting
                                            }
                                        >

                                            <option value="">
                                                Select
                                            </option>

                                            {YES_NO.map(
                                                (v) => (

                                                    <option
                                                        key={v}
                                                        value={v}
                                                    >
                                                        {v}
                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>


                                    <div className="ps-field">

                                        <label>
                                            Kitchen Type
                                        </label>

                                        <select
                                            className="ps-select"
                                            value={
                                                form.kitchenType
                                            }
                                            onChange={
                                                handleChange(
                                                    "kitchenType"
                                                )
                                            }
                                            disabled={
                                                saving ||
                                                deleting
                                            }
                                        >

                                            <option value="">
                                                Select kitchen type
                                            </option>

                                            {KITCHEN_TYPES.map(
                                                (v) => (

                                                    <option
                                                        key={v}
                                                        value={v}
                                                    >
                                                        {v}
                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>

                                </div>

                            </div>


                            {/* =========================================
                                AMENITIES
                            ========================================= */}

                            <div className="ps-section">

                                <div className="ps-section-head">

                                    <div className="ps-section-icon">

                                        <i className="bi bi-house-check" />

                                    </div>


                                    <div>

                                        <p className="ps-section-title">
                                            Amenities & Facilities
                                        </p>

                                        <div className="ps-section-sub">
                                            Furnishing, air conditioning
                                            and connectivity
                                        </div>

                                    </div>

                                </div>


                                <div className="ps-grid">


                                    <div className="ps-field">

                                        <label>
                                            Furnishing Status
                                        </label>

                                        <select
                                            className="ps-select"
                                            value={
                                                form.furnishingStatus
                                            }
                                            onChange={
                                                handleChange(
                                                    "furnishingStatus"
                                                )
                                            }
                                            disabled={
                                                saving ||
                                                deleting
                                            }
                                        >

                                            <option value="">
                                                Select furnishing
                                            </option>

                                            {FURNISHING_STATUS.map(
                                                (v) => (

                                                    <option
                                                        key={v}
                                                        value={v}
                                                    >
                                                        {v}
                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>


                                    <div className="ps-field">

                                        <label>
                                            AC Type
                                        </label>

                                        <select
                                            className="ps-select"
                                            value={
                                                form.acType
                                            }
                                            onChange={
                                                handleChange(
                                                    "acType"
                                                )
                                            }
                                            disabled={
                                                saving ||
                                                deleting
                                            }
                                        >

                                            <option value="">
                                                Select AC type
                                            </option>

                                            {AC_TYPES.map(
                                                (v) => (

                                                    <option
                                                        key={v}
                                                        value={v}
                                                    >
                                                        {v}
                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>


                                    <div className="ps-field">

                                        <label>
                                            Internet Availability
                                        </label>

                                        <select
                                            className="ps-select"
                                            value={
                                                form.internetAvailability
                                            }
                                            onChange={
                                                handleChange(
                                                    "internetAvailability"
                                                )
                                            }
                                            disabled={
                                                saving ||
                                                deleting
                                            }
                                        >

                                            <option value="">
                                                Select
                                            </option>

                                            {YES_NO.map(
                                                (v) => (

                                                    <option
                                                        key={v}
                                                        value={v}
                                                    >
                                                        {v}
                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>

                                </div>

                            </div>


                            {/* =========================================
                                METERS
                            ========================================= */}

                            <div className="ps-section">

                                <div className="ps-section-head">

                                    <div className="ps-section-icon">

                                        <i className="bi bi-speedometer2" />

                                    </div>


                                    <div>

                                        <p className="ps-section-title">
                                            Meter Details
                                        </p>

                                        <div className="ps-section-sub">
                                            Utility meter and connection numbers
                                        </div>

                                    </div>

                                </div>


                                <div className="ps-grid">


                                    <div className="ps-field">

                                        <label>
                                            Electricity Meter No
                                        </label>

                                        <input
                                            type="text"
                                            className="ps-input"
                                            value={
                                                form.electricityMeterNo
                                            }
                                            onChange={
                                                handleChange(
                                                    "electricityMeterNo"
                                                )
                                            }
                                            placeholder="Electricity meter number"
                                            disabled={
                                                saving ||
                                                deleting
                                            }
                                        />

                                    </div>


                                    <div className="ps-field">

                                        <label>
                                            Water Meter No
                                        </label>

                                        <input
                                            type="text"
                                            className="ps-input"
                                            value={
                                                form.waterMeterNo
                                            }
                                            onChange={
                                                handleChange(
                                                    "waterMeterNo"
                                                )
                                            }
                                            placeholder="Water meter number"
                                            disabled={
                                                saving ||
                                                deleting
                                            }
                                        />

                                    </div>


                                    <div className="ps-field">

                                        <label>
                                            Gas Connection No
                                        </label>

                                        <input
                                            type="text"
                                            className="ps-input"
                                            value={
                                                form.gasConnectionNo
                                            }
                                            onChange={
                                                handleChange(
                                                    "gasConnectionNo"
                                                )
                                            }
                                            placeholder="Gas connection number"
                                            disabled={
                                                saving ||
                                                deleting
                                            }
                                        />

                                    </div>

                                </div>

                            </div>


                            {/* =========================================
                                FOOTER
                            ========================================= */}

                            <div className="ps-footer">

                                <button
                                    type="submit"
                                    className="ps-btn ps-btn-primary"
                                    disabled={
                                        saving ||
                                        deleting ||
                                        loadingSpecification
                                    }
                                >

                                    <i
                                        className={
                                            `bi ${
                                                saving
                                                    ? "bi-hourglass-split"
                                                    : "bi-check2-circle"
                                            } me-2`
                                        }
                                    />

                                    {
                                        saving
                                            ? "Saving..."
                                            : hasSpecification
                                                ? "Update Specification"
                                                : "Save Specification"
                                    }

                                </button>


                                <button
                                    type="button"
                                    className="ps-btn ps-btn-ghost"
                                    onClick={
                                        handleReset
                                    }
                                    disabled={
                                        saving ||
                                        deleting
                                    }
                                >

                                    Reset

                                </button>


                                {hasSpecification && (

                                    <button
                                        type="button"
                                        className="ps-btn ps-btn-danger"
                                        onClick={
                                            handleDelete
                                        }
                                        disabled={
                                            saving ||
                                            deleting
                                        }
                                    >

                                        <i
                                            className={
                                                `bi ${
                                                    deleting
                                                        ? "bi-hourglass-split"
                                                        : "bi-trash"
                                                } me-2`
                                            }
                                        />

                                        {
                                            deleting
                                                ? "Deleting..."
                                                : "Delete"
                                        }

                                    </button>

                                )}


                                <button
                                    type="button"
                                    className="ps-btn ps-btn-ghost"
                                    onClick={
                                        backToSummary
                                    }
                                    disabled={
                                        saving ||
                                        deleting
                                    }
                                >

                                    <i className="bi bi-arrow-left me-2" />

                                    Back

                                </button>

                            </div>

                        </form>

                    )}

                </>

            )}

        </div>
    );
};


export default PropertySpecification;