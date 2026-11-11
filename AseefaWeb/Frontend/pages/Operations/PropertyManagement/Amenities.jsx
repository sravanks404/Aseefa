
import React, { useEffect, useMemo, useState } from "react";
import api from "../../apiService";

const AMENITY_SECTIONS = [
    {
        title: "Parking",
        icon: "bi-p-square",
        items: [
            { key: "Parking Space", icon: "bi-car-front", hasDetail: true, detailLabel: "Number of Spaces", detailPlaceholder: "e.g. 2", detailType: "spaces" },
            { key: "Covered Parking", icon: "bi-house-gear", hasDetail: true, detailLabel: "Number of Spaces", detailPlaceholder: "e.g. 1", detailType: "spaces" },
            { key: "Visitor Parking", icon: "bi-signpost-split", hasDetail: true, detailLabel: "Number of Spaces", detailPlaceholder: "e.g. 5", detailType: "spaces" },
        ],
    },
    {
        title: "Recreation & Leisure",
        icon: "bi-emoji-smile",
        items: [
            { key: "Swimming Pool", icon: "bi-water" },
            { key: "Gym", icon: "bi-bicycle" },
            { key: "Children's Play Area", icon: "bi-balloon" },
            { key: "Garden", icon: "bi-tree" },
        ],
    },
    {
        title: "Safety & Security",
        icon: "bi-shield-check",
        items: [
            { key: "Security", icon: "bi-shield-lock" },
            { key: "CCTV", icon: "bi-camera-video" },
            { key: "Fire Safety System", icon: "bi-fire" },
            { key: "Smart Lock", icon: "bi-key" },
        ],
    },
    {
        title: "Building Systems",
        icon: "bi-building-gear",
        items: [
            { key: "Lift", icon: "bi-arrow-down-up" },
            { key: "Central AC", icon: "bi-snow" },
            { key: "Backup Generator", icon: "bi-battery-charging" },
            { key: "Smart Home Features", icon: "bi-cpu" },
        ],
    },
    {
        title: "Accessibility & Lifestyle",
        icon: "bi-heart",
        items: [
            { key: "Wheelchair Accessibility", icon: "bi-universal-access-circle" },
            { key: "Pet Friendly", icon: "bi-emoji-heart-eyes" },
        ],
    },
    {
        title: "Outdoor & Storage",
        icon: "bi-house-door",
        items: [
            { key: "Balcony", icon: "bi-door-open" },
            { key: "Terrace", icon: "bi-sun" },
            { key: "Storage Unit", icon: "bi-box-seam", hasDetail: true, detailLabel: "Size / Notes", detailPlaceholder: "e.g. 6 sqm, basement level", detailType: "notes" },
        ],
    },
];

const ALL_AMENITIES = AMENITY_SECTIONS.flatMap((s) => s.items.map((i) => ({ ...i, section: s.title })));

// ── session helpers ──
const getCompanyID = () => Number(sessionStorage.getItem("CompanyID")) || 0;
const getUserID = () => Number(sessionStorage.getItem("UserId")) || 0;

// getPropertyInformation recordset -> property list shape
const mapApiProperty = (p) => ({
    id: p.PropertyID ?? p.propertyId ?? p.id,
    propertyId: p.PropertyID ?? p.propertyId ?? p.id,
    propertyName: p.PropertyName ?? p.propertyName ?? "",
    propertyCode: p.PropertyCode ?? p.propertyCode ?? "",
});

// Find the AMENITY_SECTIONS item a given API row belongs to (match on AmenityName, then AmenityCategory as a tiebreaker)
const findAmenityDef = (row) => {
    const name = row.AmenityName ?? row.amenityName;
    const category = row.AmenityCategory ?? row.amenityCategory;
    return ALL_AMENITIES.find(
        (a) => a.key === name && (!category || a.section === category)
    ) || ALL_AMENITIES.find((a) => a.key === name);
};

const Amenities = () => {
    // ── property selection (loaded from API, same as Maintenance) ──
    const [properties, setProperties] = useState([]);
    const [propertiesLoading, setPropertiesLoading] = useState(false);
    const [selectedPropertyId, setSelectedPropertyId] = useState(null);
    const selectedProperty = properties.find((p) => String(p.id) === String(selectedPropertyId)) || null;
    const onSelectProperty = (propertyId) => setSelectedPropertyId(propertyId);

    // ── amenity state, keyed by amenity "key" (name) ──
    const [enabled, setEnabled] = useState({});
    const [details, setDetails] = useState({});
    const [amenityIds, setAmenityIds] = useState({}); // key -> AmenityID (existing rows only)

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");

    const [showList, setShowList] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterSection, setFilterSection] = useState("");
    const [filterSelected, setFilterSelected] = useState("");

    // ── "get by id" detail preview (fetched fresh from server) ──
    const [detailPreview, setDetailPreview] = useState(null); // { key, row, loading }

    const selectedCount = useMemo(
        () => ALL_AMENITIES.filter((a) => enabled[a.key]).length,
        [enabled]
    );
    const totalCount = ALL_AMENITIES.length;
    const selectedPct = totalCount ? Math.round((selectedCount / totalCount) * 100) : 0;
    const activeFilterCount = [filterSection, filterSelected].filter(Boolean).length;

    // ========================================================
    // LOAD PROPERTIES — GET /api/getPropertyInformation
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
    // LOAD AMENITIES FOR SELECTED PROPERTY — GET /api/getPropertyAmenities
    // ========================================================
    const loadAmenities = async (propertyId) => {
        const companyID = getCompanyID();
        if (!companyID || !propertyId) return;

        setLoading(true);
        setErrorMessage("");
        try {
            const response = await api.get("/api/getPropertyAmenities", {
                params: { PropertyID: propertyId, CompanyID: companyID },
            });
            const data = response.data;
            if (data?.success) {
                const rows = Array.isArray(data.data) ? data.data : [];
                const newEnabled = {};
                const newDetails = {};
                const newIds = {};

                rows.forEach((row) => {
                    const def = findAmenityDef(row);
                    if (!def) return; // amenity row doesn't match a known key — skip
                    const isAvailable = row.IsAvailable === true || row.IsAvailable === 1;
                    newEnabled[def.key] = isAvailable;
                    if (row.AmenityID) newIds[def.key] = row.AmenityID;
                    if (def.hasDetail) {
                        newDetails[def.key] =
                            def.detailType === "spaces"
                                ? (row.NumberOfSpaces ?? "").toString()
                                : row.SizeOrNotes ?? "";
                    }
                });

                setEnabled(newEnabled);
                setDetails(newDetails);
                setAmenityIds(newIds);
            } else {
                setErrorMessage(data?.message || "Failed to load amenities.");
            }
        } catch (error) {
            console.error("Load amenities error:", error);
            setErrorMessage(error?.response?.data?.message || "Failed to load amenities.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setShowList(true);
        setSavedAt(null);
        setErrorMessage("");
        setDetailPreview(null);
        if (selectedProperty?.id) {
            loadAmenities(selectedProperty.id);
        } else {
            setEnabled({});
            setDetails({});
            setAmenityIds({});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProperty?.id]);

    // ========================================================
    // GET SINGLE AMENITY BY ID — GET /api/getPropertyAmenitiesByID
    // ========================================================
    const viewAmenityDetail = async (item) => {
        const amenityId = amenityIds[item.key];
        if (!amenityId || !selectedProperty?.id) return;
        const companyID = getCompanyID();

        setDetailPreview({ key: item.key, row: null, loading: true });
        try {
            const response = await api.get("/api/getPropertyAmenitiesByID", {
                params: {
                    AmenityID: amenityId,
                    PropertyID: selectedProperty.id,
                    CompanyID: companyID,
                },
            });
            const data = response.data;
            if (data?.success) {
                const row = Array.isArray(data.data) ? data.data[0] : data.data;
                setDetailPreview({ key: item.key, row, loading: false });
            } else {
                setDetailPreview({ key: item.key, row: null, loading: false, error: data?.message });
            }
        } catch (error) {
            console.error("Get amenity by ID error:", error);
            setDetailPreview({
                key: item.key,
                row: null,
                loading: false,
                error: error?.response?.data?.message || "Failed to load amenity detail.",
            });
        }
    };

    const toggleAmenity = (key) => {
        setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
        setSavedAt(null);
    };

    const updateDetail = (key) => (e) => {
        setDetails((prev) => ({ ...prev, [key]: e.target.value }));
        setSavedAt(null);
    };

    const selectAll = () => {
        const all = {};
        ALL_AMENITIES.forEach((a) => { all[a.key] = true; });
        setEnabled(all);
        setSavedAt(null);
    };

    const clearAll = () => {
        setEnabled({});
        setSavedAt(null);
    };

    const visibleSections = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return AMENITY_SECTIONS.map((section) => {
            if (filterSection && section.title !== filterSection) return { ...section, items: [] };
            const items = section.items.filter((item) => {
                if (term && !item.key.toLowerCase().includes(term)) return false;
                const isOn = Boolean(enabled[item.key]);
                if (filterSelected === "Selected" && !isOn) return false;
                if (filterSelected === "Not Selected" && isOn) return false;
                return true;
            });
            return { ...section, items };
        }).filter((section) => section.items.length > 0);
    }, [searchTerm, filterSection, filterSelected, enabled]);

    // ========================================================
    // SAVE — upsert enabled amenities, delete disabled ones that existed
    // POST /api/insertUpdatePropertyAmenities, DELETE /api/deletePropertyAmenities
    // ========================================================
    const handleSave = async () => {
        if (!selectedProperty?.id) {
            setErrorMessage("Please select a property first.");
            return;
        }
        const companyID = getCompanyID();
        const userID = getUserID();
        if (!companyID) {
            setErrorMessage("CompanyID not found. Please login again.");
            return;
        }

        setSaving(true);
        setErrorMessage("");
        try {
            const newAmenityIds = { ...amenityIds };

            // 1) Delete amenities that were previously saved but are now turned off
            const toDelete = Object.keys(amenityIds).filter(
                (key) => amenityIds[key] && !enabled[key]
            );
            for (const key of toDelete) {
                await api.post("/api/deletePropertyAmenities", {
                        AmenityID: amenityIds[key],
                        PropertyID: selectedProperty.id,
                        CompanyID: companyID,
                        UserID: userID,
                    },);
                delete newAmenityIds[key];
            }

            // 2) Insert/update every enabled amenity
            const toUpsert = ALL_AMENITIES.filter((item) => enabled[item.key]);
            for (const item of toUpsert) {
                const payload = {
                    AmenityID: amenityIds[item.key] || null,
                    PropertyID: selectedProperty.id,
                    CompanyID: companyID,
                    AmenityCategory: item.section,
                    AmenityName: item.key,
                    IsAvailable: true,
                    NumberOfSpaces:
                        item.hasDetail && item.detailType === "spaces"
                            ? (details[item.key] ? parseInt(details[item.key], 10) : null)
                            : null,
                    SizeOrNotes:
                        item.hasDetail && item.detailType === "notes"
                            ? (details[item.key] || null)
                            : null,
                    UserID: userID,
                };

                const response = await api.post("/api/insertUpdatePropertyAmenities", payload);
                const data = response.data;
                if (!data?.success) {
                    throw new Error(data?.message || `Unable to save "${item.key}"`);
                }
                const savedRow = Array.isArray(data.data) ? data.data[0] : data.data;
                if (savedRow?.AmenityID) {
                    newAmenityIds[item.key] = savedRow.AmenityID;
                }
            }

            setAmenityIds(newAmenityIds);
            setSavedAt(new Date());
            // refresh from server so state reflects canonical DB values
            await loadAmenities(selectedProperty.id);
        } catch (error) {
            console.error("Save amenities error:", error);
            setErrorMessage(error?.response?.data?.message || error.message || "Unable to save amenities.");
        } finally {
            setSaving(false);
        }
    };

    const openDetails = () => setShowList(false);
    const backToList = () => setShowList(true);

    return (
        <div className="am-root">
            <style>{`
        :root{
          --am-primary:#10299b;
          --am-primary-dark:#0b1c6e;
          --am-primary-mid:#4a5fc1;
          --am-primary-soft:#eef1fb;
          --am-primary-tint:#d6ddf5;
          --am-ink:#1a1f36;
          --am-muted:#6b7290;
          --am-green:#1a9e6c;
          --am-green-soft:#e6f7f0;
          --am-red:#dc2626;
          --am-red-soft:#fdecec;
        }
        .am-root{
          font-family:"Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
          color:var(--am-ink);
        }
        .am-root *{ box-sizing:border-box; }

        .am-alert{
          display:flex; align-items:center; gap:10px;
          background:var(--am-red-soft); color:var(--am-red);
          border:1px solid #f5b8b8; border-radius:10px;
          padding:10px 14px; font-size:.83rem; font-weight:600;
          margin-bottom:14px;
        }
        .am-loading{ text-align:center; padding:32px 16px; color:var(--am-muted); font-size:.85rem; }

        /* ---------- Page header ---------- */
        .am-page-header{ display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
        .am-page-title{ font-size:1.15rem; font-weight:800; color:var(--am-primary-dark); margin:0 0 3px; }
        .am-page-sub{ font-size:.85rem; color:var(--am-muted); margin:0; }

        /* ---------- Coverage bar ---------- */
        .am-coverage{
          display:flex; align-items:center; gap:14px;
          background:#fff; border:1px solid var(--am-primary-tint); border-radius:14px;
          padding:14px 18px; margin-bottom:18px;
        }
        .am-coverage-track{ flex:1; height:9px; border-radius:999px; background:var(--am-primary-soft); overflow:hidden; }
        .am-coverage-fill{
          height:100%; border-radius:999px;
          background:linear-gradient(90deg, var(--am-primary-mid), var(--am-primary));
          transition:width .3s ease;
        }
        .am-coverage-label{ font-size:.8rem; font-weight:700; color:var(--am-primary-dark); white-space:nowrap; }
        .am-coverage-sub{ font-size:.72rem; color:var(--am-muted); white-space:nowrap; }

        /* ---------- Toolbar ---------- */
        .am-toolbar{ display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin-bottom:18px; }
        .am-search-wrap{ position:relative; flex:1; min-width:220px; }
        .am-search-wrap i{
          position:absolute; left:12px; top:50%; transform:translateY(-50%);
          color:var(--am-primary-mid); font-size:.85rem;
        }
        .am-search-input{
          width:100%; border:1px solid var(--am-primary-tint); border-radius:9px;
          padding:9px 12px 9px 34px; font-size:.85rem; background:var(--am-primary-soft);
          outline:none; transition:border-color .15s ease, background .15s ease;
        }
        .am-search-input:focus{ border-color:var(--am-primary); background:#fff; }

        .am-toolbar-btn{
          display:flex; align-items:center; gap:7px;
          border-radius:9px; padding:9px 16px; font-size:.83rem; font-weight:700; white-space:nowrap;
          border:1.5px solid var(--am-primary); background:#fff; color:var(--am-primary);
          cursor:pointer; transition:all .15s ease; position:relative;
        }
        .am-toolbar-btn:hover{ background:var(--am-primary-soft); }
        .am-toolbar-btn.am-btn-solid{ background:var(--am-primary); color:#fff; }
        .am-toolbar-btn.am-btn-solid:hover{ background:var(--am-primary-dark); }
        .am-filter-badge{
          position:absolute; top:-6px; right:-6px; background:var(--am-red); color:#fff;
          width:17px; height:17px; border-radius:50%; font-size:9px; font-weight:700;
          display:flex; align-items:center; justify-content:center;
        }

        /* ---------- Sections ---------- */
        .am-section{ margin-bottom:26px; }
        .am-section-head{
          display:flex; align-items:center; gap:10px; margin-bottom:16px; padding-bottom:12px;
          border-bottom:1px solid var(--am-primary-tint);
        }
        .am-section-icon{
          width:34px; height:34px; border-radius:9px; background:var(--am-primary-soft); color:var(--am-primary);
          display:flex; align-items:center; justify-content:center; font-size:.95rem; flex-shrink:0;
        }
        .am-section-title{ font-size:.95rem; font-weight:700; color:var(--am-primary-dark); margin:0; }
        .am-section-sub{ font-size:.76rem; color:var(--am-muted); margin-top:1px; }

        .am-grid{
          display:grid;
          grid-template-columns:repeat(auto-fill, minmax(230px, 1fr));
          gap:14px;
        }

        /* ---------- Amenity card ---------- */
        .am-context-card{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 16px; margin-bottom:16px; border:1px solid var(--am-primary-tint); border-radius:14px; background:var(--am-primary-soft); }
        .am-context-title{ font-size:.78rem; font-weight:700; color:var(--am-primary-dark); text-transform:uppercase; letter-spacing:.5px; }
        .am-context-sub{ font-size:.84rem; color:var(--am-muted); margin-top:3px; }
        .am-property-item{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 16px; border-bottom:1px solid #f0f2fa; cursor:pointer; }
        .am-property-item:last-child{ border-bottom:none; }
        .am-property-name{ font-size:.84rem; font-weight:700; color:var(--am-primary-dark); }
        .am-property-code{ font-size:.74rem; color:var(--am-muted); margin-top:3px; }
        .am-card{
          border:1px solid var(--am-primary-tint); border-radius:12px; padding:13px 14px;
          display:flex; flex-direction:column; gap:10px; transition:border-color .15s ease, background .15s ease;
          background:#fff;
        }
        .am-card.am-card-on{ border-color:var(--am-primary); background:var(--am-primary-soft); }
        .am-card-top{ display:flex; align-items:center; gap:10px; }
        .am-card-icon{
          width:32px; height:32px; border-radius:9px; flex-shrink:0;
          background:#fff; color:var(--am-primary); border:1px solid var(--am-primary-tint);
          display:flex; align-items:center; justify-content:center; font-size:.9rem;
        }
        .am-card.am-card-on .am-card-icon{ background:var(--am-primary); color:#fff; border-color:var(--am-primary); }
        .am-card-label{ font-size:.83rem; font-weight:700; color:var(--am-ink); flex:1; }
        .am-card-info-btn{
          border:none; background:transparent; color:var(--am-primary-mid); cursor:pointer;
          font-size:.85rem; padding:2px; flex-shrink:0;
        }
        .am-card-info-btn:hover{ color:var(--am-primary); }

        /* Toggle switch */
        .am-switch{ position:relative; width:38px; height:22px; flex-shrink:0; }
        .am-switch input{ opacity:0; width:0; height:0; position:absolute; }
        .am-switch-track{
          position:absolute; inset:0; background:var(--am-primary-tint); border-radius:999px;
          cursor:pointer; transition:background .15s ease;
        }
        .am-switch-track::before{
          content:""; position:absolute; width:16px; height:16px; left:3px; top:3px;
          background:#fff; border-radius:50%; transition:transform .15s ease; box-shadow:0 1px 3px rgba(0,0,0,.2);
        }
        .am-switch input:checked + .am-switch-track{ background:var(--am-primary); }
        .am-switch input:checked + .am-switch-track::before{ transform:translateX(16px); }

        .am-card-detail label{
          display:block; font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.4px;
          color:var(--am-primary-mid); margin-bottom:5px;
        }
        .am-card-detail input{
          width:100%; border:1px solid var(--am-primary-tint); border-radius:8px; padding:7px 10px;
          font-size:.8rem; color:var(--am-ink); background:#fff; outline:none;
          transition:border-color .15s ease, box-shadow .15s ease;
        }
        .am-card-detail input:focus{ border-color:var(--am-primary); box-shadow:0 0 0 3px rgba(16,41,155,.12); }

        .am-empty-results{ text-align:center; padding:48px 20px; color:var(--am-muted); }
        .am-list-card{ background:#fff; border:1px solid var(--am-primary-tint); border-radius:16px; overflow:hidden; box-shadow:0 4px 18px rgba(16,41,155,.06); }
        .am-list-row{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 16px; border-bottom:1px solid #f0f2fa; cursor:pointer; }
        .am-list-row:last-child{ border-bottom:none; }
        .am-list-title{ font-size:.84rem; font-weight:700; color:var(--am-primary-dark); }
        .am-list-sub{ font-size:.74rem; color:var(--am-muted); margin-top:3px; }
        .am-empty-results i{ font-size:1.9rem; color:var(--am-primary-tint); margin-bottom:8px; display:block; }
        .am-empty-results-title{ font-weight:700; color:var(--am-primary-dark); font-size:.9rem; }

        /* ---------- Filter modal ---------- */
        .am-modal-backdrop{
          position:fixed; inset:0; z-index:1050; background:rgba(15,20,50,.5);
          display:flex; align-items:center; justify-content:center; padding:20px;
        }
        .am-modal-card{
          background:#fff; border-radius:16px; width:100%; max-width:420px;
          box-shadow:0 20px 50px rgba(16,41,155,.25); overflow:hidden;
        }
        .am-modal-head{
          display:flex; align-items:center; justify-content:space-between; padding:16px 20px;
          background:linear-gradient(135deg, var(--am-primary) 0%, var(--am-primary-dark) 100%); color:#fff;
        }
        .am-modal-head-title{ font-size:.95rem; font-weight:700; margin:0; }
        .am-modal-close{
          border:none; background:rgba(255,255,255,.15); color:#fff;
          width:26px; height:26px; border-radius:7px; cursor:pointer;
        }
        .am-modal-body{ padding:18px 20px; display:flex; flex-direction:column; gap:14px; }
        .am-modal-footer{ display:flex; justify-content:space-between; gap:10px; padding:14px 20px; border-top:1px solid var(--am-primary-soft); }
        .am-field label{
          display:block; font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.4px;
          color:var(--am-primary-mid); margin-bottom:6px;
        }
        .am-select{
          width:100%; border:1px solid var(--am-primary-tint); border-radius:9px; padding:9px 12px;
          font-size:.85rem; color:var(--am-ink); background:#fff; outline:none;
          transition:border-color .15s ease, box-shadow .15s ease;
        }
        .am-select:focus{ border-color:var(--am-primary); box-shadow:0 0 0 3px rgba(16,41,155,.12); }
        .am-detail-row{ display:flex; justify-content:space-between; font-size:.8rem; padding:4px 0; }
        .am-detail-row span:first-child{ color:var(--am-muted); }
        .am-detail-row span:last-child{ font-weight:600; color:var(--am-ink); }

        /* ---------- Footer ---------- */
        .am-footer{
          display:flex; align-items:center; gap:10px; padding-top:18px;
          border-top:1px solid var(--am-primary-tint); flex-wrap:wrap;
        }
        .am-btn{ border:none; border-radius:10px; padding:10px 20px; font-size:.85rem; font-weight:700; transition:all .15s ease; cursor:pointer; }
        .am-btn-primary{ background:var(--am-primary); color:#fff; }
        .am-btn-primary:hover:not(:disabled){ background:var(--am-primary-dark); box-shadow:0 4px 10px rgba(16,41,155,.25); }
        .am-btn-primary:disabled{ opacity:.6; cursor:default; }
        .am-btn-ghost{ background:var(--am-primary-soft); color:var(--am-primary); }
        .am-btn-ghost:hover{ background:var(--am-primary-tint); }
        .am-saved-note{ font-size:.76rem; color:var(--am-green); font-weight:600; display:flex; align-items:center; gap:5px; }
      `}</style>

            {errorMessage && (
                <div className="am-alert">
                    <i className="bi bi-exclamation-triangle"></i>
                    {errorMessage}
                </div>
            )}

            <div className="am-context-card">
                <div>
                    <div className="am-context-title">Selected property</div>
                    <div className="am-context-sub">
                        {selectedProperty
                            ? selectedProperty.propertyName || selectedProperty.propertyCode || "Selected property"
                            : "Choose a property from the list to continue"}
                    </div>
                </div>
                {selectedProperty ? (
                    <button type="button" className="am-toolbar-btn am-btn-solid" onClick={() => onSelectProperty(null)}>
                        Change property
                    </button>
                ) : null}
            </div>

            {!selectedProperty ? (
                <div className="am-section">
                    <div className="am-list-card">
                        {propertiesLoading ? (
                            <div className="am-loading">Loading properties…</div>
                        ) : properties.length === 0 ? (
                            <div className="am-loading">No properties found for this company.</div>
                        ) : (
                            properties.map((property) => (
                                <div key={property.id} className="am-property-item" onClick={() => onSelectProperty(property.id)}>
                                    <div>
                                        <div className="am-property-name">{property.propertyName || property.propertyCode}</div>
                                        <div className="am-property-code">{property.propertyCode || property.propertyId}</div>
                                    </div>
                                    <i className="bi bi-chevron-right" style={{ color: "var(--am-primary)" }}></i>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : loading ? (
                <div className="am-list-card">
                    <div className="am-loading">Loading amenities…</div>
                </div>
            ) : !showList ? (
                <>
                    <div className="am-page-header">
                        <div>
                            <p className="am-page-title">Amenities</p>
                            <p className="am-page-sub">Select the amenities available at this property.</p>
                        </div>
                        <button type="button" className="am-toolbar-btn" onClick={backToList}>
                            <i className="bi bi-arrow-left"></i> Back
                        </button>
                    </div>

                    <div className="am-coverage">
                        <div className="am-coverage-label">{selectedCount} / {totalCount} selected</div>
                        <div className="am-coverage-track">
                            <div className="am-coverage-fill" style={{ width: `${selectedPct}%` }}></div>
                        </div>
                        <div className="am-coverage-sub">{selectedPct}% complete</div>
                    </div>

                    {/* Toolbar */}
                    <div className="am-toolbar">
                        <div className="am-search-wrap">
                            <i className="bi bi-search"></i>
                            <input
                                type="text"
                                className="am-search-input"
                                placeholder="Search amenities…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button type="button" className="am-toolbar-btn" onClick={() => setIsFilterOpen(true)}>
                            <i className="bi bi-funnel"></i> Filters
                            {activeFilterCount > 0 && <span className="am-filter-badge">{activeFilterCount}</span>}
                        </button>
                        <button type="button" className="am-toolbar-btn" onClick={selectAll}>
                            <i className="bi bi-check2-all"></i> Select All
                        </button>
                        <button type="button" className="am-toolbar-btn" onClick={clearAll}>
                            <i className="bi bi-x-lg"></i> Clear All
                        </button>
                    </div>

                    {/* Amenity sections */}
                    {visibleSections.length === 0 && (
                        <div className="am-empty-results">
                            <i className="bi bi-search"></i>
                            <div className="am-empty-results-title">No amenities match</div>
                            <div>Try adjusting your search or filters.</div>
                        </div>
                    )}

                    {visibleSections.map((section) => (
                        <div className="am-section" key={section.title}>
                            <div className="am-section-head">
                                <div className="am-section-icon"><i className={`bi ${section.icon}`}></i></div>
                                <div>
                                    <p className="am-section-title">{section.title}</p>
                                    <div className="am-section-sub">{section.items.filter((i) => enabled[i.key]).length} of {section.items.length} selected</div>
                                </div>
                            </div>

                            <div className="am-grid">
                                {section.items.map((item) => {
                                    const isOn = Boolean(enabled[item.key]);
                                    const hasSavedId = Boolean(amenityIds[item.key]);
                                    return (
                                        <div className={`am-card ${isOn ? "am-card-on" : ""}`} key={item.key}>
                                            <div className="am-card-top">
                                                <div className="am-card-icon"><i className={`bi ${item.icon}`}></i></div>
                                                <div className="am-card-label">{item.key}</div>
                                                {hasSavedId && (
                                                    <button
                                                        type="button"
                                                        className="am-card-info-btn"
                                                        title="View saved details"
                                                        onClick={() => viewAmenityDetail(item)}
                                                    >
                                                        <i className="bi bi-info-circle"></i>
                                                    </button>
                                                )}
                                                <label className="am-switch">
                                                    <input type="checkbox" checked={isOn} onChange={() => toggleAmenity(item.key)} />
                                                    <span className="am-switch-track"></span>
                                                </label>
                                            </div>
                                            {isOn && item.hasDetail && (
                                                <div className="am-card-detail">
                                                    <label>{item.detailLabel}</label>
                                                    <input
                                                        type="text"
                                                        value={details[item.key] || ""}
                                                        onChange={updateDetail(item.key)}
                                                        placeholder={item.detailPlaceholder}
                                                    />
                                                </div>
                                            )}
                                            {detailPreview?.key === item.key && (
                                                <div className="am-card-detail">
                                                    {detailPreview.loading ? (
                                                        <div className="am-detail-row"><span>Loading…</span></div>
                                                    ) : detailPreview.error ? (
                                                        <div className="am-detail-row"><span style={{ color: "var(--am-red)" }}>{detailPreview.error}</span></div>
                                                    ) : detailPreview.row ? (
                                                        <>
                                                            <div className="am-detail-row"><span>Amenity ID</span><span>{detailPreview.row.AmenityID}</span></div>
                                                            <div className="am-detail-row"><span>Available</span><span>{(detailPreview.row.IsAvailable === true || detailPreview.row.IsAvailable === 1) ? "Yes" : "No"}</span></div>
                                                            {item.detailType === "spaces" && (
                                                                <div className="am-detail-row"><span>Spaces</span><span>{detailPreview.row.NumberOfSpaces ?? "—"}</span></div>
                                                            )}
                                                            {item.detailType === "notes" && (
                                                                <div className="am-detail-row"><span>Notes</span><span>{detailPreview.row.SizeOrNotes || "—"}</span></div>
                                                            )}
                                                        </>
                                                    ) : null}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Filter modal */}
                    {isFilterOpen && (
                        <div className="am-modal-backdrop" onClick={() => setIsFilterOpen(false)}>
                            <div className="am-modal-card" onClick={(e) => e.stopPropagation()}>
                                <div className="am-modal-head">
                                    <p className="am-modal-head-title">Filter Amenities</p>
                                    <button className="am-modal-close" onClick={() => setIsFilterOpen(false)}>
                                        <i className="bi bi-x-lg"></i>
                                    </button>
                                </div>
                                <div className="am-modal-body">
                                    <div className="am-field">
                                        <label>Section</label>
                                        <select className="am-select" value={filterSection} onChange={(e) => setFilterSection(e.target.value)}>
                                            <option value="">All sections</option>
                                            {AMENITY_SECTIONS.map((s) => (
                                                <option key={s.title} value={s.title}>{s.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="am-field">
                                        <label>Selection Status</label>
                                        <select className="am-select" value={filterSelected} onChange={(e) => setFilterSelected(e.target.value)}>
                                            <option value="">All amenities</option>
                                            <option value="Selected">Selected</option>
                                            <option value="Not Selected">Not Selected</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="am-modal-footer">
                                    <button
                                        type="button"
                                        className="am-btn am-btn-ghost"
                                        onClick={() => { setFilterSection(""); setFilterSelected(""); }}
                                    >
                                        Clear All
                                    </button>
                                    <button type="button" className="am-btn am-btn-primary" onClick={() => setIsFilterOpen(false)}>
                                        Apply Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="am-footer">
                        <button type="button" className="am-btn am-btn-primary" onClick={handleSave} disabled={saving}>
                            <i className={`bi ${saving ? "bi-hourglass-split" : "bi-check2-circle"} me-2`}></i>
                            {saving ? "Saving…" : "Save Amenities"}
                        </button>
                        <button type="button" className="am-btn am-btn-ghost" onClick={backToList} disabled={saving}>
                            <i className="bi bi-arrow-left me-2"></i>
                            Back
                        </button>
                        {savedAt && !saving && (
                            <span className="am-saved-note">
                                <i className="bi bi-check-circle-fill"></i> Saved at {savedAt.toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                </>
            ) : (
                <div className="am-list-card">
                    <div className="am-list-row" onClick={openDetails}>
                        <div>
                            <div className="am-list-title">Amenity Profile</div>
                            <div className="am-list-sub">
                                {selectedCount > 0
                                    ? `${selectedCount} of ${totalCount} amenities selected`
                                    : "Open the amenity setup for this property"}
                            </div>
                        </div>
                        <i className="bi bi-chevron-right" style={{ color: "var(--am-primary)" }}></i>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Amenities;