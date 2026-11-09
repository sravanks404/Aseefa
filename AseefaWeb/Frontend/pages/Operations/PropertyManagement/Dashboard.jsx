import React, { useMemo, useState, useEffect } from "react";
import api from "../../apiService";

const getCompanyID = () => 
    Number(sessionStorage.getItem("CompanyID")) || 
    Number(localStorage.getItem("CompanyID")) || 
    Number(sessionStorage.getItem("companyId")) || 
    0;

// ---- Helpers ---------------------------------------------------------------
const formatCurrency = (val) =>
    new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(val);

const formatDate = (val) => {
    const d = new Date(val);
    if (isNaN(d)) return "-";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const Dashboard = ({ openTab, onSelectProperty }) => {
    const [properties, setProperties] = useState([]);
    const [propertyList, setPropertyList] = useState([]);
    const [loading, setLoading] = useState(false);
    const darkMode = false;

    useEffect(() => {
        const fetchProperties = async () => {
            const companyID = getCompanyID();
            if (!companyID) return;
            setLoading(true);
            try {
                // Fetch property report data and property info
                const [reportRes, infoRes] = await Promise.all([
                    api.get("/api/getPropertyReport", { params: { CompanyID: companyID } }),
                    api.get("/api/getPropertyInfo", { params: { CompanyID: companyID } }).catch(() => null)
                ]);
                if (reportRes.data?.success && Array.isArray(reportRes.data.data)) {
                    setProperties(reportRes.data.data);
                }
                if (infoRes?.data?.data && Array.isArray(infoRes.data.data)) {
                    setPropertyList(infoRes.data.data);
                }
            } catch (err) {
                console.error("Dashboard: Error fetching properties:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProperties();
    }, []);

    // Calculate dynamic stats based on properties from DB
    // Count unique valid properties
    const totalProperties = useMemo(() => {
        if (propertyList && propertyList.length > 0) {
            return propertyList.length;
        }
        const unique = new Set(properties.map((p) => p.PropertyID || p.PropertyName).filter(Boolean));
        return unique.size || 0;
    }, [propertyList, properties]);
    
    // Count unique buildings
    const totalBuildings = useMemo(() => {
        const sourceList = (propertyList && propertyList.length > 0) ? propertyList : properties;
        const buildings = new Set(
            sourceList
                .map((p) => p.BuildingName || p.buildingName || p.PropertyName || p.propertyName)
                .filter(Boolean)
        );
        return buildings.size || 0;
    }, [propertyList, properties]);

    // Helper to check if a unit/rental is actively occupied
    const isUnitOccupied = (p) =>
        p.RentalStatus === "Occupied" ||
        (p.RentalStatus !== "Vacant" &&
         p.RentalStatus !== "Reserved" &&
         p.RentalStatus !== "Under Maintenance" &&
         p.RentalStatus !== "Maintenance" &&
         p.RentalStatus !== "Blocked" &&
         Boolean(p.TenantName && p.TenantName.trim() !== "" && p.TenantName.toLowerCase() !== "null"));

    // Active occupancy stats based on DB records (filtering for valid unit/rental records)
    const validUnits = useMemo(() => 
        properties.filter(p => p.RentalID != null)
    , [properties]);

    const occupiedUnits = useMemo(() => 
        validUnits.filter(isUnitOccupied).length
    , [validUnits]);

    const vacantUnits = useMemo(() => 
        validUnits.filter(p => p.RentalStatus === "Vacant" || (!p.RentalStatus && (!p.TenantName || p.TenantName.trim() === "" || p.TenantName.toLowerCase() === "null"))).length
    , [validUnits]);

    const reservedUnits = useMemo(() => 
        validUnits.filter(p => p.RentalStatus === "Reserved").length
    , [validUnits]);

    const maintenanceUnits = useMemo(() => 
        validUnits.filter(p => p.RentalStatus === "Under Maintenance" || p.RentalStatus === "Maintenance").length
    , [validUnits]);

    const totalUnits = validUnits.length;
    const occupancyPct = totalUnits ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : 0;

    // Monthly rental value sums MonthlyRent of all occupied units
    const monthlyRentalValue = useMemo(() => 
        properties
            .filter(isUnitOccupied)
            .reduce((sum, p) => sum + (parseFloat(p.MonthlyRent) || (parseFloat(p.AnnualRent) / 12) || 0), 0)
    , [properties]);

    // Annual rental value sums AnnualRent of all occupied units
    const annualRentalValue = useMemo(() => 
        properties
            .filter(isUnitOccupied)
            .reduce((sum, p) => sum + (parseFloat(p.AnnualRent) || (parseFloat(p.MonthlyRent) * 12) || 0), 0)
    , [properties]);

    const widgets = [
        { key: "totalProperties", label: "Total Properties", value: totalProperties, icon: "bi-buildings", tone: "primary" },
        { key: "totalBuildings", label: "Total Buildings", value: totalBuildings, icon: "bi-building", tone: "primary" },
        { key: "occupiedUnits", label: "Occupied Units", value: occupiedUnits, icon: "bi-house-check-fill", tone: "green" },
        { key: "vacantUnits", label: "Vacant Units", value: vacantUnits, icon: "bi-house-x-fill", tone: "red" },
        { key: "reservedUnits", label: "Reserved Units", value: reservedUnits, icon: "bi-bookmark-star-fill", tone: "amber" },
        { key: "maintenanceUnits", label: "Under Maintenance", value: maintenanceUnits, icon: "bi-tools", tone: "purple" },
        { key: "occupancyPct", label: "Occupancy Percentage", value: `${occupancyPct}%`, icon: "bi-pie-chart-fill", tone: "primary" },
        { key: "monthlyRental", label: "Monthly Rental Value", value: formatCurrency(monthlyRentalValue), icon: "bi-cash-stack", tone: "green" },
        { key: "annualRental", label: "Annual Rental Value", value: formatCurrency(annualRentalValue), icon: "bi-wallet2", tone: "green" },
    ];

    // Generate property wise income dynamically by grouping actual properties by PropertyName
    const PROPERTY_INCOME = useMemo(() => {
        if (properties.length === 0) {
            return [
                { property: "No Properties Found", units: 0, occupancy: 0, income: 0 }
            ];
        }
        const groups = {};
        properties.forEach((p) => {
            const bName = p.PropertyName || p.propertyName || p.BuildingName || p.buildingName || "Other Properties";
            if (!groups[bName]) {
                groups[bName] = { property: bName, totalUnits: 0, occupiedUnits: 0, income: 0 };
            }
            groups[bName].totalUnits += 1;
            
            const isOccupied = isUnitOccupied(p);
            if (isOccupied) {
                groups[bName].occupiedUnits += 1;
                const rent = parseFloat(p.MonthlyRent) || (parseFloat(p.AnnualRent) / 12) || 0;
                groups[bName].income += rent;
            }
        });

        return Object.values(groups).map((item) => {
            const occupancy = item.totalUnits ? Math.round((item.occupiedUnits / item.totalUnits) * 100) : 0;
            return {
                property: item.property,
                units: item.totalUnits,
                occupancy: occupancy,
                income: item.income
            };
        });
    }, [properties]);

    // Dynamic upcoming lease expiries
    const UPCOMING_LEASE_EXPIRIES = useMemo(() => {
        const today = new Date();
        return properties
            .filter((p) => {
                const isOccupied = isUnitOccupied(p);
                return isOccupied && p.LeaseEndDate;
            })
            .map((p) => {
                const endDate = new Date(p.LeaseEndDate);
                const diffTime = endDate.getTime() - today.getTime();
                const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return {
                    unit: `${p.BuildingName || p.PropertyName || "Bld"} - ${p.UnitNumber || "Unit"}`,
                    property: p.PropertyName || "Property",
                    date: p.LeaseEndDate.split("T")[0],
                    tenant: p.TenantName || "Tenant",
                    daysLeft: daysLeft >= 0 ? daysLeft : 0
                };
            })
            .sort((a, b) => a.daysLeft - b.daysLeft)
            .slice(0, 5);
    }, [properties]);

    // Upcoming vacancies based on close expiries (within 90 days)
    const UPCOMING_VACANCIES = useMemo(() => {
        return UPCOMING_LEASE_EXPIRIES.filter(p => p.daysLeft <= 90);
    }, [UPCOMING_LEASE_EXPIRIES]);

    const handleWidgetClick = (key) => {
        if (!openTab) return;
        if (key === "totalProperties" || key === "totalBuildings") {
            openTab("property");
        } else if (key === "occupiedUnits" || key === "vacantUnits" || key === "reservedUnits" || key === "occupancyPct") {
            openTab("occupancy");
        } else if (key === "maintenanceUnits") {
            openTab("maintenance");
        } else if (key === "monthlyRental" || key === "annualRental") {
            openTab("financial");
        }
    };        

    const handlePropertySelectAndNavigate = (id, tabId) => {
        if (id && onSelectProperty) {
            onSelectProperty(id);
        }
        if (openTab) {
            openTab(tabId);
        }
    };

    const handleBuildingClick = (buildingName) => {
        const matched = properties.find(
            (p) => (p.PropertyName || p.BuildingName || "").toLowerCase() === (buildingName || "").toLowerCase()
        );
        if (matched && onSelectProperty) {
            onSelectProperty(matched.id || matched.PropertyID);
        }
        if (openTab) {
            openTab("financial");
        }
    };

    const maxIncome = Math.max(...PROPERTY_INCOME.map((p) => p.income)) || 1;

    return (
        <div className={`dash-root container-fluid py-4 ${darkMode ? "" : "light-mode"}`}>
            <style>{`
        .dash-root{
          --dp-bg: #060814;               /* Ultra deep space black by default */
          --dp-card-bg: rgba(13, 17, 30, 0.7); /* Translucent dark slate */
          --dp-border: rgba(99, 102, 241, 0.15); /* Sleek indigo tinted border */
          --dp-ink: #f8fafc;              /* Crisp white text */
          --dp-muted: #94a3b8;            /* Soft lavender gray */
          --dp-panel-head-bg: rgba(30, 41, 59, 0.5); /* Semi-dark slate header */
          --dp-item-hover: rgba(99, 102, 241, 0.1);
          
          --dp-primary: #3b82f6;          /* Cobalt blue */
          --dp-primary-mid: #60a5fa;
          --dp-primary-soft: rgba(59, 130, 246, 0.15);
          --dp-green: #10b981;            /* Neon green */
          --dp-green-soft: rgba(16, 185, 129, 0.15);
          --dp-red: #f43f5e;              /* Electric rose */
          --dp-red-soft: rgba(244, 63, 94, 0.15);
          --dp-amber: #f59e0b;            /* Amber gold */
          --dp-amber-soft: rgba(245, 158, 11, 0.15);
          --dp-purple: #8b5cf6;           /* Neon violet */
          --dp-purple-soft: rgba(139, 92, 246, 0.15);

          font-family: "Inter", system-ui, sans-serif;
          color: var(--dp-ink);
          background-color: var(--dp-bg);
          min-height: 100vh;
          padding-bottom: 3rem;
          transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }

        .dash-root.light-mode {
          --dp-bg: #f8fafc;               /* Slate-50 */
          --dp-card-bg: #ffffff;
          --dp-border: #e2e8f0;           /* Slate-200 */
          --dp-ink: #0f172a;              /* Slate-900 */
          --dp-muted: #64748b;            /* Slate-500 */
          --dp-panel-head-bg: #f8fafc;
          --dp-item-hover: #f1f5f9;
          
          --dp-primary-soft: #f0f7ff;
          --dp-green-soft: #ecfdf5;
          --dp-red-soft: #fff1f2;
          --dp-amber-soft: #fefbeb;
          --dp-purple-soft: #f5f3ff;
        }
        
        .dash-root *{ box-sizing: border-box; }

        /* ---------- Custom Sleek Scrollbar ---------- */
        .dash-panel-body::-webkit-scrollbar {
          width: 5px;
        }
        .dash-panel-body::-webkit-scrollbar-track {
          background: transparent;
        }
        .dash-panel-body::-webkit-scrollbar-thumb {
          background: var(--dp-border);
          border-radius: 999px;
        }
        .dash-panel-body::-webkit-scrollbar-thumb:hover {
          background: var(--dp-primary-mid);
        }

        /* ---------- Header Top Bar ---------- */
        .dash-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          padding: 18px 24px;
          background: var(--dp-card-bg);
          border: 1px solid var(--dp-border);
          border-radius: 20px;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          transition: all 0.3s ease;
        }
        .dash-title-section h4 {
          font-weight: 800;
          font-size: 28px;
          margin: 0;
          color: #ffffff;
          letter-spacing: -0.5px;
          text-shadow: 0 2px 10px rgba(59, 130, 246, 0.25), 0 0 15px rgba(99, 102, 241, 0.2);
        }
        .dash-root.light-mode .dash-title-section h4 {
          color: #0f172a;
          text-shadow: none;
          background: none;
          -webkit-text-fill-color: initial;
        }
        .dash-title-section p {
          font-size: 0.84rem;
          color: var(--dp-muted);
          margin: 6px 0 0 0;
          transition: color 0.3s ease;
        }
        .theme-toggle-btn {
          background: var(--dp-card-bg);
          border: 1px solid var(--dp-border);
          padding: 10px 18px;
          border-radius: 14px;
          color: var(--dp-ink);
          font-size: 0.83rem;
          font-weight: 750;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .theme-toggle-btn:hover {
          transform: translateY(-2px);
          background: var(--dp-item-hover);
          border-color: var(--dp-primary-mid);
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.25);
        }
        .theme-toggle-btn i {
          font-size: 1.05rem;
        }

        /* ---------- Widget Grid ---------- */
        .dash-widget-grid{
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 18px;
          margin-bottom: 26px;
        }
        .dash-widget{
          background: var(--dp-card-bg);
          border: 1px solid var(--dp-border);
          border-radius: 18px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }
        .dash-widget::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 3px;
          background: transparent;
          transition: background 0.25s ease;
        }
        .dash-widget:hover{
          transform: translateY(-6px) scale(1.02);
          border-color: var(--dp-primary-mid);
        }

        /* Glow effects matching tone */
        .dash-widget.tone-primary:hover{ box-shadow: 0 12px 25px rgba(59, 130, 246, 0.25); }
        .dash-widget.tone-green:hover{ box-shadow: 0 12px 25px rgba(16, 185, 129, 0.25); }
        .dash-widget.tone-red:hover{ box-shadow: 0 12px 25px rgba(244, 63, 94, 0.25); }
        .dash-widget.tone-amber:hover{ box-shadow: 0 12px 25px rgba(245, 158, 11, 0.25); }
        .dash-widget.tone-purple:hover{ box-shadow: 0 12px 25px rgba(139, 92, 246, 0.25); }

        .dash-widget.tone-primary:hover::before { background: linear-gradient(90deg, var(--dp-primary-mid), var(--dp-purple)); }
        .dash-widget.tone-green:hover::before { background: var(--dp-green); }
        .dash-widget.tone-red:hover::before { background: var(--dp-red); }
        .dash-widget.tone-amber:hover::before { background: var(--dp-amber); }
        .dash-widget.tone-purple:hover::before { background: var(--dp-purple); }

        .dash-widget-icon{
          width: 46px; height: 46px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
          transition: transform 0.25s ease;
        }
        .dash-widget:hover .dash-widget-icon {
          transform: scale(1.15) rotate(5deg);
        }

        .dash-widget-icon.tone-primary{ background: linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(139,92,246,0.2) 100%); color: var(--dp-primary-mid); }
        .dash-widget-icon.tone-green{ background: linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.2) 100%); color: var(--dp-green); }
        .dash-widget-icon.tone-red{ background: linear-gradient(135deg, rgba(244,63,94,0.2) 0%, rgba(225,29,72,0.2) 100%); color: var(--dp-red); }
        .dash-widget-icon.tone-amber{ background: linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(217,119,6,0.2) 100%); color: var(--dp-amber); }
        .dash-widget-icon.tone-purple{ background: linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(109,40,217,0.2) 100%); color: var(--dp-purple); }
        
        .dash-widget-value{ font-size: 1.25rem; font-weight: 800; color: var(--dp-ink); line-height: 1.2; letter-spacing: -0.2px; transition: color 0.3s ease; }
        .dash-widget-label{ font-size: .68rem; font-weight: 650; color: var(--dp-muted); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; transition: color 0.3s ease; }

        /* ---------- Panels ---------- */
        .dash-panel{
          background: var(--dp-card-bg);
          border: 1px solid var(--dp-border);
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          height: 100%;
          transition: all 0.3s ease;
        }
        .dash-panel:hover {
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.25);
          border-color: var(--dp-primary-mid);
        }
        .dash-panel-head{
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px 22px;
          border-bottom: 1px solid var(--dp-border);
          background: var(--dp-panel-head-bg);
          transition: background-color 0.3s ease, border-color 0.3s ease;
        }
        .dash-panel-head i{ 
          color: var(--dp-primary-mid); 
          font-size: 1.15rem; 
          background: var(--dp-primary-soft);
          padding: 8px 10px;
          border-radius: 10px;
          transition: background-color 0.3s ease;
        }
        .dash-panel-title{ font-size: .82rem; font-weight: 800; color: var(--dp-ink); margin: 0; letter-spacing: 0.1px; transition: color 0.3s ease; }
        .dash-panel-body{ padding: 8px 0; max-height: 340px; overflow-y: auto; }

        .dash-list-item{
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 22px;
          border-bottom: 1px solid var(--dp-border);
          transition: background-color 0.2s ease, border-color 0.3s ease, padding 0.2s ease;
          cursor: pointer;
        }
        .dash-list-item:hover {
          background-color: var(--dp-item-hover);
          padding-left: 26px; /* Elegant slide shift on hover */
        }
        .dash-list-item:last-child{ border-bottom: none; }
        .dash-list-main{ font-size: .78rem; font-weight: 650; color: var(--dp-ink); transition: color 0.3s ease; }
        .dash-list-sub{ font-size: .68rem; color: var(--dp-muted); margin-top: 3px; transition: color 0.3s ease; }
        
        .dash-pill{
          font-size: .65rem;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 999px;
          white-space: nowrap;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          letter-spacing: 0.2px;
        }
        .dash-pill-urgent{ background: var(--dp-red-soft); color: var(--dp-red); }
        .dash-pill-soon{ background: var(--dp-amber-soft); color: var(--dp-amber); }
        .dash-pill-ok{ background: var(--dp-primary-soft); color: var(--dp-primary-mid); }

        /* ---------- Property-Wise Income ---------- */
        .dash-income-row{
          display: grid;
          grid-template-columns: 180px 1fr 110px;
          align-items: center;
          gap: 18px;
          padding: 16px 22px;
          border-bottom: 1px solid var(--dp-border);
          transition: background-color 0.2s ease, border-color 0.3s ease;
          cursor: pointer;
        }
        .dash-income-row:hover {
          background-color: var(--dp-item-hover);
        }
        .dash-income-row:hover .dash-income-bar-fill {
          filter: brightness(1.2);
          box-shadow: 0 0 10px var(--dp-primary-mid);
        }
        .dash-income-row:last-child{ border-bottom: none; }
        .dash-income-name{ font-size: .86rem; font-weight: 650; color: var(--dp-ink); transition: color 0.3s ease; }
        .dash-income-sub{ font-size: .76rem; color: var(--dp-muted); transition: color 0.3s ease; }
        
        .dash-income-bar-track{
          background: var(--dp-primary-soft);
          border-radius: 999px;
          height: 10px;
          overflow: hidden;
          position: relative;
        }
        .dash-income-bar-fill{
          height: 100%;
          background: linear-gradient(90deg, var(--dp-primary-mid), var(--dp-purple));
          border-radius: 999px;
          box-shadow: 0 0 4px var(--dp-primary-mid);
          transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dash-income-value{ font-size: .86rem; font-weight: 750; color: var(--dp-primary-mid); text-align: right; }

        @media (max-width: 767px){
          .dash-income-row{ grid-template-columns: 1fr; row-gap: 8px; }
          .dash-income-value{ text-align: left; }
        }
      `}</style>

            {/* Top Bar spacing */}
            <div style={{ marginTop: "16px" }} />

            {/* KPI Widgets */}
            <div className="dash-widget-grid">
                {widgets.map((w) => (
                    <div 
                        className={`dash-widget tone-${w.tone}`} 
                        key={w.key}
                        onClick={() => handleWidgetClick(w.key)}
                    >
                        <div className={`dash-widget-icon tone-${w.tone}`}>
                            <i className={`bi ${w.icon}`}></i>
                        </div>
                        <div>
                            <div className="dash-widget-value">{w.value}</div>
                            <div className="dash-widget-label">{w.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Upcoming lists */}
            <div className="row g-3 mb-3">
                <div className="col-12 col-lg-6">
                    <div className="dash-panel">
                        <div className="dash-panel-head">
                            <i className="bi bi-door-open"></i>
                            <p className="dash-panel-title">Upcoming Vacancies</p>
                        </div>
                        <div className="dash-panel-body">
                            {UPCOMING_VACANCIES.map((v, i) => (
                                <div 
                                    className="dash-list-item" 
                                    key={i}
                                    onClick={() => handlePropertySelectAndNavigate(v.rawId, "property")}
                                >
                                    <div>
                                        <div className="dash-list-main">{v.unit}</div>
                                        <div className="dash-list-sub">{v.property} &middot; {v.tenant}</div>
                                    </div>
                                    <span className="dash-pill dash-pill-ok">{formatDate(v.date)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-6">
                    <div className="dash-panel">
                        <div className="dash-panel-head">
                            <i className="bi bi-file-earmark-text"></i>
                            <p className="dash-panel-title">Upcoming Lease Expiries</p>
                        </div>
                        <div className="dash-panel-body">
                            {UPCOMING_LEASE_EXPIRIES.map((v, i) => (
                                <div 
                                    className="dash-list-item" 
                                    key={i}
                                    onClick={() => handlePropertySelectAndNavigate(v.rawId, "property")}
                                >
                                    <div>
                                        <div className="dash-list-main">{v.unit}</div>
                                        <div className="dash-list-sub">{v.property} &middot; {v.tenant}</div>
                                    </div>
                                    <span className={`dash-pill ${v.daysLeft <= 7 ? "dash-pill-urgent" : v.daysLeft <= 15 ? "dash-pill-soon" : "dash-pill-ok"}`}>
                                        {v.daysLeft}d left
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Property-wise income */}
            <div className="dash-panel">
                <div className="dash-panel-head">
                    <i className="bi bi-graph-up-arrow"></i>
                    <p className="dash-panel-title">Property-wise Income</p>
                </div>
                <div className="dash-panel-body" style={{ maxHeight: "none" }}>
                    {PROPERTY_INCOME.map((p, i) => (
                        <div 
                            className="dash-income-row" 
                            key={i}
                            onClick={() => handleBuildingClick(p.property)}
                        >
                            <div>
                                <div className="dash-income-name">{p.property}</div>
                                <div className="dash-income-sub">{p.units} units &middot; {p.occupancy}% occupied</div>
                            </div>
                            <div className="dash-income-bar-track">
                                <div
                                    className="dash-income-bar-fill"
                                    style={{ width: `${(p.income / maxIncome) * 100}%` }}
                                ></div>
                            </div>
                            <div className="dash-income-value">{formatCurrency(p.income)}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
