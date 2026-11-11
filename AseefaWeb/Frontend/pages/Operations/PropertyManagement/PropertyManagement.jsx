import  { useState } from "react";
import Dashboard from "./Dashboard";
import PropertyInfo from "./PropertyInformation";
import PropertySpecification from "./PropertySpecification";
import Ownership from "./Ownership";
import RentalInfo from "./RentalInformation";
import Documents from "./Documents";
import Amenities from "./Amenities";
import Occupancy from "./Occupancy";
import Utilities from "./Utilities";
import Maintenance from "./Maintenance";
import Financial from "./Financial ";
import PropertyReport from "./PropertyReport";
import PropertyMaster from "./PropertyMaster";

const SEED_PROPERTIES = [
  { id: 1, propertyId: "PRP-0001", propertyName: "Marina Heights - 204", propertyCode: "PRP-0142", buildingName: "Tower A", buildingNumber: "B-12", unitNumber: "204", floorNumber: "2", unitType: "2 BHK", propertyCategory: "Residential", towerWing: "Wing B", blockNumber: "Block 4", communityArea: "Dubai Marina", city: "Dubai", stateEmirate: "Dubai", country: "United Arab Emirates", postalCode: "00000", gpsLocation: "25.0805, 55.1403", googleMapsLink: "" },
  { id: 2, propertyId: "PRP-0002", propertyName: "Palm Residences - 112", propertyCode: "PRP-0198", buildingName: "Tower C", buildingNumber: "C-03", unitNumber: "112", floorNumber: "1", unitType: "1 BHK", propertyCategory: "Residential", towerWing: "Wing A", blockNumber: "Block 1", communityArea: "Palm Jumeirah", city: "Dubai", stateEmirate: "Dubai", country: "United Arab Emirates", postalCode: "00000", gpsLocation: "25.1124, 55.1390", googleMapsLink: "" },
  { id: 3, propertyId: "PRP-0003", propertyName: "Downtown Loft - 908", propertyCode: "PRP-0221", buildingName: "Tower B", buildingNumber: "B-09", unitNumber: "908", floorNumber: "9", unitType: "Studio", propertyCategory: "Residential", towerWing: "Wing B", blockNumber: "Block 2", communityArea: "Downtown Dubai", city: "Dubai", stateEmirate: "Dubai", country: "United Arab Emirates", postalCode: "00000", gpsLocation: "25.1972, 55.2744", googleMapsLink: "" },
  { id: 4, propertyId: "PRP-0004", propertyName: "Garden View - Office 301", propertyCode: "PRP-0305", buildingName: "Tower D", buildingNumber: "D-01", unitNumber: "301", floorNumber: "3", unitType: "Office", propertyCategory: "Commercial", towerWing: "Wing C", blockNumber: "Block 5", communityArea: "Business Bay", city: "Dubai", stateEmirate: "Dubai", country: "United Arab Emirates", postalCode: "00000", gpsLocation: "25.1858, 55.2634", googleMapsLink: "" },
];



const TABS = [
  { id: "dashboard", label: "Dashboard", icon: "bi-speedometer2", Component: Dashboard },
  { id: "property", label: "Property", icon: "bi-building", Component: PropertyInfo },
   { id: "propertyMaster", label: "Property Master", icon: "bi-building", Component: PropertyMaster },
  { id: "specification", label: "Specification", icon: "bi-rulers", Component: PropertySpecification },
  { id: "amenities", label: "Amenities", icon: "bi-stars", Component: Amenities },
  { id: "ownership", label: "Ownership", icon: "bi-person-badge", Component: Ownership },
  { id: "rental", label: "Rental", icon: "bi-cash-stack", Component: RentalInfo },
  { id: "documents", label: "Documents", icon: "bi-folder2-open", Component: Documents },
  { id: "utilities", label: "Expense", icon: "bi-receipt", Component: Utilities },
  { id: "occupancy", label: "Occupancy", icon: "bi-people", Component: Occupancy },
  { id: "maintenance", label: "Maintenance", icon: "bi-tools", Component: Maintenance },
  { id: "financial", label: "Financial", icon: "bi-wallet2", Component: Financial },
  { id: "report", label: "Report", icon: "bi-file-earmark-spreadsheet", Component: PropertyReport },
];

const PropertyManagement = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [properties, setProperties] = useState(SEED_PROPERTIES);
  const [selectedPropertyId, setSelectedPropertyId] = useState(SEED_PROPERTIES[0]?.id || null);
  const [visited, setVisited] = useState({ dashboard: true });

  const selectedProperty = properties.find((property) => (property.id === selectedPropertyId || property.PropertyID === selectedPropertyId)) || properties[0] || null;

  const openTab = (id) => {
    setActiveTab(id);
    setVisited((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
  };

  return (
    <div className="pm-root container-fluid py-4">
      <style>{`
        :root{
          --pm-primary:#10299b;
          --pm-primary-dark:#0b1c6e;
          --pm-primary-mid:#4a5fc1;
          --pm-primary-soft:#eef1fb;
          --pm-primary-tint:#d6ddf5;
        }
        .pm-root{
          font-family:"Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
          color:#1a1f36;
        }
        .pm-root *{ box-sizing:border-box; }

        /* ---------- Header ---------- */
        .pm-header{
          display:flex;
          align-items:center;
          gap:16px;
          padding:20px 24px;
          background:linear-gradient(135deg, var(--pm-primary) 0%, var(--pm-primary-dark) 100%);
          border-radius:16px;
          color:#fff;
          margin-bottom:20px;
          box-shadow:0 8px 24px rgba(16,41,155,.18);
        }
        .pm-header-icon{
          width:48px;
          height:48px;
          border-radius:12px;
          background:rgba(255,255,255,.14);
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:1.3rem;
          flex-shrink:0;
        }
        .pm-header-title{
          font-size:1.15rem;
          font-weight:700;
          margin:0;
          letter-spacing:.2px;
        }
        .pm-header-sub{
          font-size:.82rem;
          color:rgba(255,255,255,.75);
          margin-top:2px;
        }

        /* ---------- Tabs (single row, ExpiryDoc style) ---------- */
        .pm-tabs-wrap{
          background:#fff;
          border:1px solid var(--pm-primary-tint);
          border-radius:14px;
          padding:6px;
          margin-bottom:20px;
          box-shadow:0 2px 8px rgba(16,41,155,.04);
        }
        .pm-tabs{
          display:flex;
          flex-wrap:nowrap;
          align-items:center;
          gap:4px;
          overflow-x:auto;
          scrollbar-width:thin;
        }
        .pm-tabs::-webkit-scrollbar{ height:5px; }
        .pm-tabs::-webkit-scrollbar-thumb{ background:var(--pm-primary-tint); border-radius:10px; }

        .pm-tab-btn{
          flex:0 0 auto;
          display:flex;
          align-items:center;
          gap:7px;
          border:none;
          background:transparent;
          color:var(--pm-primary-mid);
          padding:9px 16px;
          border-radius:9px;
          font-size:.83rem;
          font-weight:600;
          white-space:nowrap;
          transition:all .2s ease;
        }
        .pm-tab-btn i{ font-size:.9rem; }
        .pm-tab-btn:hover{
          color:var(--pm-primary);
          background:var(--pm-primary-soft);
        }
        .pm-tab-btn.active{
          background:var(--pm-primary);
          color:#fff;
          box-shadow:0 4px 10px rgba(16,41,155,.25);
        }

        /* ---------- Body ---------- */
        .pm-body-card{
          background:#fff;
          border:1px solid var(--pm-primary-tint);
          border-radius:16px;
          min-height:520px;
          padding:26px;
          box-shadow:0 4px 18px rgba(16,41,155,.06);
        }

        @media (max-width:767px){
          .pm-header-title{ font-size:1rem; }
        }
      `}</style>



      {/* Tabs - single row */}
      <div className="pm-tabs-wrap">
        <div className="pm-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`pm-tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => openTab(tab.id)}
            >
              <i className={`bi ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content — every visited tab stays mounted (hidden via CSS)
                so its API only fires once, on first visit. */}
      <div className="pm-body-card">
        {TABS.map(({ id, Component }) =>
          visited[id] ? (
            <div key={id} style={{ display: activeTab === id ? "block" : "none" }}>
              <Component
                properties={properties}
                selectedProperty={selectedProperty}
                onSelectProperty={setSelectedPropertyId}
                onPropertiesChange={setProperties}
                openTab={openTab}
              />
            </div>
          ) : null
        )}
      </div>
    </div>
  );
};

export default PropertyManagement;