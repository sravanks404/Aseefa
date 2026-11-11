
import  { useEffect, useMemo, useState } from "react";
import api from "../../apiService";

const UNIT_TYPES = [
    "Residential",
    "Commercial",
    "Both",
];

const PROPERTY_CATEGORIES = [
    "Residential",
    "Commercial",
];

const INITIAL_FORM = {
    id: null,

    propertyId: "",
    propertyName: "",
    propertyCode: "",

    buildingName: "",
    buildingNumber: "",
    unitNumber: "",
    floorNumber: "",

    unitType: "",
    propertyCategory: "",

    towerWing: "",
    blockNumber: "",
    communityArea: "",

    city: "",
    stateEmirate: "",
    country: "",
    postalCode: "",

    gpsLocation: "",
    googleMapsLink: "",
};



const mapApiProperty = (item) => {

    const propertyID = Number(item.PropertyID) || 0;

    return {
        id: propertyID,

     
        propertyId: propertyID
            ? `PRP-${String(propertyID).padStart(4, "0")}`
            : "",

        propertyName: item.PropertyName || "",
        propertyCode: item.PropertyCode || "",

        buildingName: item.BuildingName || "",
        buildingNumber: item.BuildingNumber || "",
        unitNumber: item.UnitNumber || "",
        floorNumber: item.FloorNumber || "",

        unitType: item.UnitType || "",
        propertyCategory: item.PropertyCategory || "",

        towerWing: item.TowerWing || "",
        blockNumber: item.BlockNumber || "",
        communityArea: item.CommunityArea || "",

        city: item.City || "",
        stateEmirate: item.StateEmirate || "",
        country: item.Country || "",
        postalCode: item.PostalCode || "",

        gpsLocation: item.GPSLocation || "",
        googleMapsLink: item.GoogleMapsLink || "",
    };
};


const fullLabel = (property) =>
    property.propertyName ||
    property.propertyCode ||
    property.propertyId ||
    `Property #${property.id}`;


// ============================================================
// COMPONENT
// ============================================================
const PropertyInformation = () => {

    const [showForm, setShowForm] = useState(false);

    const [properties, setProperties] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [filterUnitType, setFilterUnitType] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterCity, setFilterCity] = useState("");

    const [form, setForm] = useState({
        ...INITIAL_FORM,
    });

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [loading, setLoading] = useState(false);

    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const isEditing = form.id !== null;


    // ========================================================
    // SESSION
    // ========================================================
    const getCompanyID = () => {
        return Number(sessionStorage.getItem("CompanyID")) || 0;
    };

    const getUserID = () => {
        return Number(sessionStorage.getItem("UserId")) || 0;
    };


    const loadProperties = async () => {

        const companyID = getCompanyID();

        if (!companyID) {
            setErrorMessage(
                "CompanyID not found. Please login again."
            );
            return;
        }

        setLoading(true);
        setErrorMessage("");

        try {

            const response = await api.get(
                "/api/getPropertyInfo",
                {
                    params: {
                        CompanyID: companyID,
                    },
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

            setErrorMessage(
                error?.response?.data?.message ||
                "Failed to load properties."
            );

        } finally {

            setLoading(false);
        }
    };


 
    useEffect(() => {
        loadProperties();
    }, []);



    const cityOptions = useMemo(
        () =>
            Array.from(
                new Set(
                    properties
                        .map(
                            (property) =>
                                property.city
                        )
                        .filter(Boolean)
                )
            ).sort(),
        [properties]
    );


    const filteredProperties = useMemo(() => {

        const term =
            searchTerm
                .trim()
                .toLowerCase();

        let base = !term
            ? properties
            : properties.filter(
                  (property) =>
                      [
                          property.propertyName,
                          property.propertyCode,
                          property.propertyId,
                          property.buildingName,
                          property.communityArea,
                          property.city,
                      ]
                          .filter(Boolean)
                          .some((value) =>
                              String(value)
                                  .toLowerCase()
                                  .includes(term)
                          )
              );


        if (filterUnitType) {
            base = base.filter(
                (property) =>
                    property.unitType ===
                    filterUnitType
            );
        }


        if (filterCategory) {
            base = base.filter(
                (property) =>
                    property.propertyCategory ===
                    filterCategory
            );
        }


        if (filterCity) {
            base = base.filter(
                (property) =>
                    property.city === filterCity
            );
        }


        return base;

    }, [
        properties,
        searchTerm,
        filterUnitType,
        filterCategory,
        filterCity,
    ]);


    const handleChange = (field) => (event) => {

        setForm((prev) => ({
            ...prev,
            [field]: event.target.value,
        }));

        setErrorMessage("");
        setSuccessMessage("");
    };


 
    const openCreate = () => {

        setErrorMessage("");
        setSuccessMessage("");

        setForm({
            ...INITIAL_FORM,
        });

        setShowForm(true);
    };



    const openEdit = async (property) => {

        setErrorMessage("");
        setSuccessMessage("");

        const companyID = getCompanyID();

        if (!companyID) {
            setErrorMessage(
                "CompanyID not found. Please login again."
            );
            return;
        }

        try {

            setLoading(true);

            const response = await api.get(
                "/api/getPropertyInfoByID",
                {
                    params: {
                        PropertyID: property.id,
                        CompanyID: companyID,
                    },
                }
            );

            const data = response.data;

            if (!data?.success || !data?.data) {

                setErrorMessage(
                    data?.message ||
                    "Property not found."
                );

                return;
            }

            setForm(
                mapApiProperty(data.data)
            );

            setShowForm(true);

        } catch (error) {

            console.error(
                "Open property error:",
                error
            );

            setErrorMessage(
                error?.response?.data?.message ||
                "Failed to open property."
            );

        } finally {

            setLoading(false);
        }
    };



    const backToList = () => {

        if (saving || deleting) {
            return;
        }

        setShowForm(false);

        setForm({
            ...INITIAL_FORM,
        });

        setErrorMessage("");
        setSuccessMessage("");
    };


    const handleSave = async (event) => {

        event.preventDefault();



        if (saving || deleting) {
            return;
        }


        const companyID = getCompanyID();
        const userID = getUserID();


    
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
        if (
            !form.propertyName ||
            !form.propertyName.trim()
        ) {

            setErrorMessage(
                "Property Name is required."
            );

            return;
        }


        setSaving(true);
        setErrorMessage("");
        setSuccessMessage("");


        try {

    
            const payload = {

                PropertyID:
                    Number(form.id) || 0,

                PropertyCode:
                    form.propertyCode?.trim() || null,

                PropertyName:
                    form.propertyName.trim(),

                BuildingName:
                    form.buildingName?.trim() || null,

                BuildingNumber:
                    form.buildingNumber?.trim() || null,

                UnitNumber:
                    form.unitNumber?.trim() || null,

                FloorNumber:
                    form.floorNumber?.trim() || null,

                UnitType:
                    form.unitType || null,

                PropertyCategory: null,

                TowerWing:
                    form.towerWing?.trim() || null,

                BlockNumber:
                    form.blockNumber?.trim() || null,

                CommunityArea:
                    form.communityArea?.trim() || null,

                City:
                    form.city?.trim() || null,

                StateEmirate:
                    form.stateEmirate?.trim() || null,

                Country:
                    form.country?.trim() || null,

                PostalCode:
                    form.postalCode?.trim() || null,

                GPSLocation:
                    form.gpsLocation?.trim() || null,

                GoogleMapsLink:
                    form.googleMapsLink?.trim() || null,


                CompanyID: companyID,
                UserID: userID,
            };


            console.log(
                "Saving Property:",
                payload
            );


            const response = await api.post(
                "/api/insertUpdateProperty",
                payload
            );


            const data = response.data;

            if (!data?.success) {

                setErrorMessage(
                    data?.message ||
                    "Property could not be saved."
                );

                return;
            }


            setSuccessMessage(
                data?.message ||
                (
                    isEditing
                        ? "Property updated successfully."
                        : "Property inserted successfully."
                )
            );


            await loadProperties();


    
            setShowForm(false);

            setForm({
                ...INITIAL_FORM,
            });


        } catch (error) {

            console.error(
                "Save property error:",
                error
            );


            const backendMessage =
                error?.response?.data?.message;


            setErrorMessage(
                backendMessage ||
                "Failed to save property."
            );

        } finally {

            setSaving(false);
        }
    };


    const handleDelete = async () => {

        if (!isEditing) {
            return;
        }


        if (saving || deleting) {
            return;
        }


        const companyID = getCompanyID();
        const userID = getUserID();


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


        if (!form.id) {

            setErrorMessage(
                "PropertyID not found."
            );

            return;
        }


        const confirmed = window.confirm(
            "Are you sure you want to delete this property?"
        );


        if (!confirmed) {
            return;
        }


        setDeleting(true);
        setErrorMessage("");
        setSuccessMessage("");


        try {

            const response = await api.post("/api/deletePropertyInfo", {
                        PropertyID: Number(form.id),

                  
                        CompanyID: companyID,

                     
                        UserID: userID,
                    },);


            const data = response.data;


            if (!data?.success) {

                setErrorMessage(
                    data?.message ||
                    "Property could not be deleted."
                );

                return;
            }


            setSuccessMessage(
                data?.message ||
                "Property deleted successfully."
            );


        
            await loadProperties();
            setShowForm(false);

            setForm({
                ...INITIAL_FORM,
            });


        } catch (error) {

            console.error(
                "Delete property error:",
                error
            );


            setErrorMessage(
                error?.response?.data?.message ||
                "Failed to delete property."
            );

        } finally {

            setDeleting(false);
        }
    };



    const clearFilters = () => {

        setSearchTerm("");
        setFilterUnitType("");
        setFilterCategory("");
        setFilterCity("");
    };


   
    const activeFilterCount = [
        filterUnitType,
        filterCategory,
        filterCity,
    ].filter(Boolean).length;


    // ========================================================
    // UI
    // ========================================================
    return (
        <div className="pi-root">

            <style>{`

                :root{
                    --pi-primary:#10299b;
                    --pi-primary-dark:#0b1c6e;
                    --pi-primary-mid:#4a5fc1;
                    --pi-primary-soft:#eef1fb;
                    --pi-primary-tint:#d6ddf5;
                    --pi-ink:#1a1f36;
                    --pi-muted:#6b7290;
                    --pi-green:#1a9e6c;
                    --pi-green-soft:#e6f7f0;
                    --pi-red:#dc2626;
                    --pi-red-soft:#fdecec;
                    --pi-warning:#b7791f;
                    --pi-warning-soft:#fff7df;
                }

                .pi-root{
                    font-family:
                        "Inter",
                        system-ui,
                        -apple-system,
                        "Segoe UI",
                        sans-serif;

                    color:var(--pi-ink);
                }

                .pi-root *{
                    box-sizing:border-box;
                }

                .pi-toolbar{
                    display:flex;
                    flex-wrap:wrap;
                    align-items:center;
                    gap:10px;
                    margin-bottom:16px;
                }

                .pi-search-wrap{
                    position:relative;
                    flex:1;
                    min-width:240px;
                }

                .pi-search-wrap i{
                    position:absolute;
                    left:12px;
                    top:50%;
                    transform:translateY(-50%);
                    color:var(--pi-primary-mid);
                    font-size:.85rem;
                }

                .pi-search-input{
                    width:100%;
                    border:1px solid var(--pi-primary-tint);
                    border-radius:9px;
                    padding:9px 12px 9px 34px;
                    font-size:.85rem;
                    background:var(--pi-primary-soft);
                    outline:none;
                    transition:
                        border-color .15s ease,
                        background .15s ease;
                }

                .pi-search-input:focus{
                    border-color:var(--pi-primary);
                    background:#fff;
                }

                .pi-toolbar-btn{
                    display:flex;
                    align-items:center;
                    gap:7px;
                    border-radius:9px;
                    padding:9px 16px;
                    font-size:.83rem;
                    font-weight:700;
                    white-space:nowrap;
                    border:1.5px solid var(--pi-primary);
                    background:#fff;
                    color:var(--pi-primary);
                    cursor:pointer;
                    transition:all .15s ease;
                }

                .pi-toolbar-btn:hover{
                    background:var(--pi-primary-soft);
                }

                .pi-toolbar-btn.pi-btn-solid{
                    background:var(--pi-primary);
                    color:#fff;
                }

                .pi-toolbar-btn.pi-btn-solid:hover{
                    background:var(--pi-primary-dark);
                }

                .pi-toolbar-btn:disabled{
                    opacity:.6;
                    cursor:not-allowed;
                }

                .pi-toolbar-select{
                    border:1px solid var(--pi-primary-tint);
                    border-radius:9px;
                    padding:9px 12px;
                    font-size:.84rem;
                    background:#fff;
                    color:var(--pi-ink);
                    min-width:140px;
                }

                .pi-table-card{
                    background:#fff;
                    border:1px solid var(--pi-primary-tint);
                    border-radius:16px;
                    overflow:hidden;
                    box-shadow:
                        0 4px 18px rgba(16,41,155,.06);
                }

                .pi-table{
                    width:100%;
                    border-collapse:collapse;
                }

                .pi-table thead th{
                    background:var(--pi-primary-soft);
                    color:var(--pi-primary-dark);
                    font-size:.7rem;
                    font-weight:700;
                    text-transform:uppercase;
                    letter-spacing:.5px;
                    padding:12px 16px;
                    text-align:left;
                    border-bottom:2px solid var(--pi-primary-tint);
                    white-space:nowrap;
                }

                .pi-table tbody td{
                    padding:12px 16px;
                    border-bottom:1px solid #f0f2fa;
                    font-size:.84rem;
                }

                .pi-table tbody tr:last-child td{
                    border-bottom:none;
                }

                .pi-table tbody tr:hover{
                    background:#fafbff;
                }

                .pi-row-sub{
                    color:var(--pi-muted);
                    font-size:.74rem;
                    margin-top:3px;
                }

                .pi-action-btn{
                    border:none;
                    border-radius:8px;
                    padding:7px 10px;
                    font-size:.78rem;
                    font-weight:700;
                    cursor:pointer;
                    background:var(--pi-primary-soft);
                    color:var(--pi-primary);
                }

                .pi-action-btn:hover{
                    background:var(--pi-primary-tint);
                }

                .pi-empty{
                    padding:30px 20px !important;
                    text-align:center;
                    color:var(--pi-muted);
                }

                .pi-loading{
                    padding:30px;
                    text-align:center;
                    color:var(--pi-primary);
                    font-weight:600;
                }

                .pi-section{
                    margin-bottom:26px;
                }

                .pi-section-head{
                    display:flex;
                    align-items:center;
                    gap:10px;
                    margin-bottom:16px;
                    padding-bottom:12px;
                    border-bottom:1px solid var(--pi-primary-tint);
                }

                .pi-section-icon{
                    width:34px;
                    height:34px;
                    border-radius:9px;
                    background:var(--pi-primary-soft);
                    color:var(--pi-primary);
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-size:.95rem;
                    flex-shrink:0;
                }

                .pi-section-title{
                    font-size:.95rem;
                    font-weight:700;
                    color:var(--pi-primary-dark);
                    margin:0;
                }

                .pi-section-sub{
                    font-size:.76rem;
                    color:var(--pi-muted);
                    margin-top:1px;
                }

                .pi-grid{
                    display:grid;
                    grid-template-columns:
                        repeat(
                            auto-fill,
                            minmax(230px, 1fr)
                        );
                    gap:16px 18px;
                }

                .pi-field label{
                    display:block;
                    font-size:.72rem;
                    font-weight:700;
                    text-transform:uppercase;
                    letter-spacing:.4px;
                    color:var(--pi-primary-mid);
                    margin-bottom:6px;
                }

                .pi-input,
                .pi-select{
                    width:100%;
                    border:1px solid var(--pi-primary-tint);
                    border-radius:9px;
                    padding:9px 12px;
                    font-size:.85rem;
                    color:var(--pi-ink);
                    background:#fff;
                    outline:none;
                    transition:
                        border-color .15s ease,
                        box-shadow .15s ease;
                }

                .pi-input:focus,
                .pi-select:focus{
                    border-color:var(--pi-primary);
                    box-shadow:
                        0 0 0 3px rgba(16,41,155,.12);
                }

                .pi-input:disabled{
                    background:#f5f6fa;
                    cursor:not-allowed;
                }

                .pi-hint{
                    font-size:.7rem;
                    color:var(--pi-muted);
                    margin-top:4px;
                }

                .pi-footer{
                    display:flex;
                    align-items:center;
                    gap:10px;
                    padding-top:18px;
                    border-top:1px solid var(--pi-primary-tint);
                    flex-wrap:wrap;
                }

                .pi-btn{
                    border:none;
                    border-radius:10px;
                    padding:10px 20px;
                    font-size:.85rem;
                    font-weight:700;
                    transition:all .15s ease;
                    cursor:pointer;
                }

                .pi-btn-primary{
                    background:var(--pi-primary);
                    color:#fff;
                }

                .pi-btn-primary:hover:not(:disabled){
                    background:var(--pi-primary-dark);
                    box-shadow:
                        0 4px 10px rgba(16,41,155,.25);
                }

                .pi-btn-primary:disabled{
                    opacity:.6;
                    cursor:not-allowed;
                }

                .pi-btn-ghost{
                    background:var(--pi-primary-soft);
                    color:var(--pi-primary);
                }

                .pi-btn-ghost:hover:not(:disabled){
                    background:var(--pi-primary-tint);
                }

                .pi-btn-danger{
                    background:var(--pi-red-soft);
                    color:var(--pi-red);
                }

                .pi-btn-danger:hover:not(:disabled){
                    background:#ffe5e7;
                }

                .pi-btn-danger:disabled,
                .pi-btn-ghost:disabled{
                    opacity:.6;
                    cursor:not-allowed;
                }

                .pi-message{
                    border-radius:9px;
                    padding:10px 14px;
                    margin-bottom:15px;
                    font-size:.82rem;
                    font-weight:600;
                }

                .pi-error{
                    color:#991b1b;
                    background:var(--pi-red-soft);
                    border:1px solid #f5c2c7;
                }

                .pi-success{
                    color:#166534;
                    background:var(--pi-green-soft);
                    border:1px solid #b8e7d2;
                }

                .pi-info{
                    color:#7a5a00;
                    background:var(--pi-warning-soft);
                    border:1px solid #f3df9b;
                }

                @media (max-width:768px){

                    .pi-toolbar{
                        flex-direction:column;
                        align-items:stretch;
                    }

                    .pi-toolbar-select{
                        min-width:100%;
                    }

                    .pi-grid{
                        grid-template-columns:1fr;
                    }

                    .pi-table-card{
                        overflow-x:auto;
                    }

                    .pi-table{
                        min-width:800px;
                    }
                }

            `}</style>


            {/* =====================================================
                GLOBAL ERROR / SUCCESS MESSAGE
            ====================================================== */}

            {errorMessage && (
                <div className="pi-message pi-error">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {errorMessage}
                </div>
            )}

            {successMessage && (
                <div className="pi-message pi-success">
                    <i className="bi bi-check-circle me-2"></i>
                    {successMessage}
                </div>
            )}


            {/* =====================================================
                LIST
            ====================================================== */}

            {!showForm ? (
                <>

                    <div className="pi-toolbar">

                        {/* SEARCH */}
                        <div className="pi-search-wrap">

                            <i className="bi bi-search"></i>

                            <input
                                className="pi-search-input"
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(
                                        event.target.value
                                    )
                                }
                                placeholder="Search by property, code, area or city"
                            />

                        </div>


                        {/* UNIT TYPE */}
                        <select
                            className="pi-toolbar-select"
                            value={filterUnitType}
                            onChange={(event) =>
                                setFilterUnitType(
                                    event.target.value
                                )
                            }
                        >

                            <option value="">
                                All unit types
                            </option>

                            {UNIT_TYPES.map((type) => (
                                <option
                                    key={type}
                                    value={type}
                                >
                                    {type}
                                </option>
                            ))}

                        </select>


                        {/* CATEGORY */}
                        <select
                            className="pi-toolbar-select"
                            value={filterCategory}
                            onChange={(event) =>
                                setFilterCategory(
                                    event.target.value
                                )
                            }
                        >

                            <option value="">
                                All categories
                            </option>

                            {PROPERTY_CATEGORIES.map(
                                (category) => (
                                    <option
                                        key={category}
                                        value={category}
                                    >
                                        {category}
                                    </option>
                                )
                            )}

                        </select>


                        {/* CITY */}
                        <select
                            className="pi-toolbar-select"
                            value={filterCity}
                            onChange={(event) =>
                                setFilterCity(
                                    event.target.value
                                )
                            }
                        >

                            <option value="">
                                All cities
                            </option>

                            {cityOptions.map((city) => (
                                <option
                                    key={city}
                                    value={city}
                                >
                                    {city}
                                </option>
                            ))}

                        </select>


                        {/* CLEAR */}
                        {activeFilterCount > 0 && (
                            <button
                                type="button"
                                className="pi-toolbar-btn"
                                onClick={clearFilters}
                            >
                                <i className="bi bi-x-circle"></i>
                                Clear
                            </button>
                        )}


                        {/* ADD */}
                        <button
                            type="button"
                            className="pi-toolbar-btn pi-btn-solid"
                            onClick={openCreate}
                            disabled={loading}
                        >

                            <i className="bi bi-plus-lg"></i>

                            Add Property

                        </button>

                    </div>


                    {/* =================================================
                        TABLE
                    ================================================== */}

                    <div className="pi-table-card">

                        {loading ? (

                            <div className="pi-loading">

                                <i className="bi bi-hourglass-split me-2"></i>

                                Loading properties...

                            </div>

                        ) : (

                            <table className="pi-table">

                                <thead>

                                    <tr>

                                        <th>
                                            Property
                                        </th>

                                        <th>
                                            Code
                                        </th>

                                        <th>
                                            Location
                                        </th>

                                        <th>
                                            Type
                                        </th>

                                        <th>
                                            Action
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {filteredProperties.length === 0 ? (

                                        <tr>

                                            <td
                                                colSpan="5"
                                                className="pi-empty"
                                            >
                                                No matching properties found.
                                            </td>

                                        </tr>

                                    ) : (

                                        filteredProperties.map(
                                            (property) => (

                                                <tr
                                                    key={
                                                        property.id
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

                                                        <div className="pi-row-sub">

                                                            {
                                                                property.buildingName ||
                                                                "—"
                                                            }

                                                            {" · "}

                                                            {
                                                                property.unitNumber ||
                                                                "—"
                                                            }

                                                        </div>

                                                    </td>


                                                    <td>

                                                        {
                                                            property.propertyCode ||
                                                            "—"
                                                        }

                                                    </td>


                                                    <td>

                                                        <div>

                                                            {
                                                                property.communityArea ||
                                                                "—"
                                                            }

                                                        </div>

                                                        <div className="pi-row-sub">

                                                            {
                                                                property.city ||
                                                                "—"
                                                            }

                                                        </div>

                                                    </td>


                                                    <td>

                                                        {
                                                            property.unitType ||
                                                            property.propertyCategory ||
                                                            "—"
                                                        }

                                                    </td>


                                                    <td>

                                                        <button
                                                            type="button"
                                                            className="pi-action-btn"
                                                            onClick={() =>
                                                                openEdit(
                                                                    property
                                                                )
                                                            }
                                                            disabled={loading}
                                                        >

                                                            <i className="bi bi-pencil-square me-1"></i>

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

                

            <form onSubmit={handleSave}>



                    <div className="pi-section">

                        <div className="pi-section-head">

                            <div className="pi-section-icon">

                                <i className="bi bi-building"></i>

                            </div>

                            <div>

                                <p className="pi-section-title">

                                    {isEditing
                                        ? "Edit Property"
                                        : "Add New Property"}

                                </p>

                                <div className="pi-section-sub">

                                    {isEditing
                                        ? "Update the selected property."
                                        : "Enter the property information."}

                                </div>

                            </div>

                        </div>


                        <div className="pi-grid">


                            {/* PROPERTY NAME */}

                            <div className="pi-field">

                                <label>
                                    Property Name *
                                </label>

                                <input
                                    type="text"
                                    className="pi-input"
                                    value={
                                        form.propertyName
                                    }
                                    onChange={handleChange(
                                        "propertyName"
                                    )}
                                    placeholder="e.g. Marina Heights"
                                    required
                                    disabled={
                                        saving ||
                                        deleting
                                    }
                                />

                            </div>


                            {/* PROPERTY CODE */}

                            <div className="pi-field">

                                <label>
                                    Property Code
                                </label>

                                <input
                                    type="text"
                                    className="pi-input"
                                    value={
                                        form.propertyCode
                                    }
                                    onChange={handleChange(
                                        "propertyCode"
                                    )}
                                    placeholder="e.g. PRP-0142"
                                    disabled={
                                        saving ||
                                        deleting
                                    }
                                />

                            </div>


                            {/* BUILDING NAME */}

                            <div className="pi-field">

                                <label>
                                    Building Name
                                </label>

                                <input
                                    type="text"
                                    className="pi-input"
                                    value={
                                        form.buildingName
                                    }
                                    onChange={handleChange(
                                        "buildingName"
                                    )}
                                    placeholder="e.g. Tower A"
                                    disabled={
                                        saving ||
                                        deleting
                                    }
                                />

                            </div>


                            {/* BUILDING NUMBER */}

                            <div className="pi-field">

                                <label>
                                    Building Number
                                </label>

                                <input
                                    type="text"
                                    className="pi-input"
                                    value={
                                        form.buildingNumber
                                    }
                                    onChange={handleChange(
                                        "buildingNumber"
                                    )}
                                    placeholder="e.g. B-12"
                                    disabled={
                                        saving ||
                                        deleting
                                    }
                                />

                            </div>


                            {/* UNIT NUMBER */}

                            <div className="pi-field">

                                <label>
                                    Apartment / Unit Number
                                </label>

                                <input
                                    type="text"
                                    className="pi-input"
                                    value={
                                        form.unitNumber
                                    }
                                    onChange={handleChange(
                                        "unitNumber"
                                    )}
                                    placeholder="e.g. 204"
                                    disabled={
                                        saving ||
                                        deleting
                                    }
                                />

                            </div>


                            {/* FLOOR */}

                            <div className="pi-field">

                                <label>
                                    Floor Number
                                </label>

                                <input
                                    type="text"
                                    className="pi-input"
                                    value={
                                        form.floorNumber
                                    }
                                    onChange={handleChange(
                                        "floorNumber"
                                    )}
                                    placeholder="e.g. 2"
                                    disabled={
                                        saving ||
                                        deleting
                                    }
                                />

                            </div>


                            {/* UNIT TYPE */}

                            <div className="pi-field">

                                <label>
                                    Unit Type
                                </label>

                                <select
                                    className="pi-select"
                                    value={
                                        form.unitType
                                    }
                                    onChange={handleChange(
                                        "unitType"
                                    )}
                                    disabled={
                                        saving ||
                                        deleting
                                    }
                                >

                                    <option value="">
                                        Select unit type
                                    </option>

                                    {UNIT_TYPES.map(
                                        (type) => (
                                            <option
                                                key={type}
                                                value={type}
                                            >
                                                {type}
                                            </option>
                                        )
                                    )}

                                </select>

                            </div>


                            {/* TOWER */}

                            <div className="pi-field">

                                <label>
                                    Tower / Wing
                                </label>

                                <input
                                    type="text"
                                    className="pi-input"
                                    value={
                                        form.towerWing
                                    }
                                    onChange={handleChange(
                                        "towerWing"
                                    )}
                                    placeholder="e.g. Wing B"
                                    disabled={
                                        saving ||
                                        deleting
                                    }
                                />

                            </div>


                            {/* BLOCK */}

                            <div className="pi-field">

                                <label>
                                    Block Number
                                </label>

                                <input
                                    type="text"
                                    className="pi-input"
                                    value={
                                        form.blockNumber
                                    }
                                    onChange={handleChange(
                                        "blockNumber"
                                    )}
                                    placeholder="e.g. Block 4"
                                    disabled={
                                        saving ||
                                        deleting
                                    }
                                />

                            </div>


                            {/* COMMUNITY */}

                            <div className="pi-field">

                                <label>
                                    Community / Area
                                </label>

                                <input
                                    type="text"
                                    className="pi-input"
                                    value={
                                        form.communityArea
                                    }
                                    onChange={handleChange(
                                        "communityArea"
                                    )}
                                    placeholder="e.g. Dubai Marina"
                                    disabled={
                                        saving ||
                                        deleting
                                    }
                                />

                            </div>

                        </div>

                    </div>


              

                    <div className="pi-section">

                        <div className="pi-section-head">

                            <div className="pi-section-icon">

                                <i className="bi bi-geo-alt"></i>

                            </div>

                            <div>

                                <p className="pi-section-title">
                                    Address & Location
                                </p>

                                <div className="pi-section-sub">

                                    Where this property is physically located

                                </div>

                            </div>

                        </div>


                        <div className="pi-grid">


                            {/* CITY */}

                            <div className="pi-field">

                                <label>
                                    City
                                </label>

                                <input
                                    type="text"
                                    className="pi-input"
                                    value={
                                        form.city
                                    }
                                    onChange={handleChange(
                                        "city"
                                    )}
                                    placeholder="e.g. Dubai"
                                    disabled={
                                        saving ||
                                        deleting
                                    }
                                />

                            </div>


                            {/* STATE */}

                            <div className="pi-field">

                                <label>
                                    State / Emirate
                                </label>

                                <input
                                    type="text"
                                    className="pi-input"
                                    value={
                                        form.stateEmirate
                                    }
                                    onChange={handleChange(
                                        "stateEmirate"
                                    )}
                                    placeholder="e.g. Dubai"
                                    disabled={
                                        saving ||
                                        deleting
                                    }
                                />

                            </div>


                            {/* COUNTRY */}

                            <div className="pi-field">

                                <label>
                                    Country
                                </label>

                                <input
                                    type="text"
                                    className="pi-input"
                                    value={
                                        form.country
                                    }
                                    onChange={handleChange(
                                        "country"
                                    )}
                                    placeholder="e.g. United Arab Emirates"
                                    disabled={
                                        saving ||
                                        deleting
                                    }
                                />

                            </div>


                            {/* POSTAL */}

                            <div className="pi-field">

                                <label>
                                    Postal Code
                                </label>

                                <input
                                    type="text"
                                    className="pi-input"
                                    value={
                                        form.postalCode
                                    }
                                    onChange={handleChange(
                                        "postalCode"
                                    )}
                                    placeholder="e.g. 00000"
                                    disabled={
                                        saving ||
                                        deleting
                                    }
                                />

                            </div>


                            {/* GPS */}

                            <div className="pi-field">

                                <label>
                                    GPS Location
                                </label>

                                <input
                                    type="text"
                                    className="pi-input"
                                    value={
                                        form.gpsLocation
                                    }
                                    onChange={handleChange(
                                        "gpsLocation"
                                    )}
                                    placeholder="e.g. 25.0805, 55.1403"
                                    disabled={
                                        saving ||
                                        deleting
                                    }
                                />

                            </div>


                            {/* GOOGLE MAP */}

                            <div className="pi-field">

                                <label>
                                    Google Maps Link
                                </label>

                                <input
                                    type="url"
                                    className="pi-input"
                                    value={
                                        form.googleMapsLink
                                    }
                                    onChange={handleChange(
                                        "googleMapsLink"
                                    )}
                                    placeholder="https://maps.google.com/..."
                                    disabled={
                                        saving ||
                                        deleting
                                    }
                                />

                            </div>

                        </div>

                    </div>


                    <div className="pi-footer">


                        {/* SAVE / UPDATE */}

                        <button
                            type="submit"
                            className="pi-btn pi-btn-primary"
                            disabled={
                                saving ||
                                deleting
                            }
                        >

                            <i
                                className={`bi ${
                                    saving
                                        ? "bi-hourglass-split"
                                        : "bi-check2-circle"
                                } me-2`}
                            ></i>

                            {saving
                                ? "Saving..."
                                : isEditing
                                ? "Update Property"
                                : "Save Property"}

                        </button>


                        {/* BACK */}

                        <button
                            type="button"
                            className="pi-btn pi-btn-ghost"
                            onClick={
                                backToList
                            }
                            disabled={
                                saving ||
                                deleting
                            }
                        >

                            <i className="bi bi-arrow-left me-2"></i>

                            Back to List

                        </button>


                        {/* DELETE */}

                        {isEditing && (

                            <button
                                type="button"
                                className="pi-btn pi-btn-danger"
                                onClick={
                                    handleDelete
                                }
                                disabled={
                                    deleting ||
                                    saving
                                }
                            >

                                <i
                                    className={`bi ${
                                        deleting
                                            ? "bi-hourglass-split"
                                            : "bi-trash"
                                    } me-2`}
                                ></i>

                                {deleting
                                    ? "Deleting..."
                                    : "Delete"}

                            </button>

                        )}

                    </div>

                </form>
            )}

        </div>
    );
};

export default PropertyInformation;