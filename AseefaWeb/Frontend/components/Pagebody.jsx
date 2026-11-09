import React, { useState, useEffect } from "react";
import api from "../pages/apiService";
import "./pagebody.css";

import MyChart from "../background/MyChart";
import ReceiptChart from "../background/ReceiptChart";
import OrderGraph from "../charts/OrderGraph";
import SaleGraph from "../charts/SaleGraph";
import Emplastloc from "../charts/Emplastloc";
import WorkforceTrendGraph from "../charts/WorkforceTrendGraph";
import CampLocationsMap from "../charts/CampLocationsMap";
import AllocationActivityGraph from "../charts/AllocationActivityGraph";
const Pagebody = () => {
// ── State (replaces salesData, OrderData, outstandData, ReceiptData) ──
const [workerStats, setWorkerStats] = useState(null);       // { TotalActive, OnHire, OffHire, NewThisMonth }
const [expiryStats, setExpiryStats] = useState(null);       // { Expiring30, Expired, Expiring60 }
const [occupancyStats, setOccupancyStats] = useState(null); // { TotalBeds, OccupiedBeds, TotalCamps }
const [projectStats, setProjectStats] = useState(null);     // { ActiveProjects, TotalManpowerPlanned, TotalAllocated }
const [topLoading, setTopLoading] = useState(true);
const [error, setError] = useState(false);

// ── Fetch (replaces ToprowCards) ──
const fetchTopCards = async () => {
  const CompanyID = sessionStorage.getItem("CompanyID");
  setTopLoading(true);
  setError(false);
  try {
    const [workersRes, expiryRes, occupancyRes, projectsRes] = await Promise.all([
      api.get("/api/dashboardWorkers", { params: { CompanyID } }),
      api.get("/api/dashboardExpiry", { params: { CompanyID } }),
      api.get("/api/dashboardOccupancy", { params: { CompanyID } }),
      api.get("/api/dashboardProjects", { params: { CompanyID } }),
    ]);
    setWorkerStats(workersRes.data[0] || {});
    setExpiryStats(expiryRes.data[0] || {});
    setOccupancyStats(occupancyRes.data[0] || {});
    setProjectStats(projectsRes.data[0] || {});
  } catch (err) {
    console.error("Error fetching top cards:", err);
    setError(true);
  } finally {
    setTopLoading(false);
  }
};

useEffect(() => {
  fetchTopCards();
}, []);

// derived values
const totalActive = workerStats?.TotalActive || 0;
const onHire = workerStats?.OnHire || 0;
const offHire = workerStats?.OffHire || 0;

const expiring30 = expiryStats?.Expiring30 || 0;
const expired = expiryStats?.Expired || 0;

const totalBeds = occupancyStats?.TotalBeds || 0;
const occupiedBeds = occupancyStats?.OccupiedBeds || 0;
const occupancyPercent = totalBeds ? Math.min((occupiedBeds / totalBeds) * 100, 100) : 0;

const activeProjects = projectStats?.ActiveProjects || 0;
const manpowerPlanned = projectStats?.TotalManpowerPlanned || 0;
const manpowerAllocated = projectStats?.TotalAllocated || 0;
const manpowerPercent = manpowerPlanned ? Math.min((manpowerAllocated / manpowerPlanned) * 100, 100) : 0;

// ── State (replaces b2cb2bsale, CusItemCount) ──
const [campStats, setCampStats] = useState(null);       // { TotalCamps, TotalRooms }
const [vehicleStats, setVehicleStats] = useState(null); // { TotalVehicles, UnassignedVehicles }
const [supplierStats, setSupplierStats] = useState(null); // { TotalSuppliers, ExpiringLicences }
const [newWorkerStats, setNewWorkerStats] = useState(null); // { NewThisMonth }
const [secondaryLoading, setSecondaryLoading] = useState(true);

// ── Fetch (replaces FetchSalesData's parallel calls for these cards) ──
const fetchSecondaryCards = async () => {
  const CompanyID = sessionStorage.getItem("CompanyID");
  setSecondaryLoading(true);
  try {
    const [campRes, vehicleRes, supplierRes, newWorkerRes] = await Promise.all([
      api.get("/api/dashboardCamps", { params: { CompanyID } }),
      api.get("/api/dashboardVehicles", { params: { CompanyID } }),
      api.get("/api/dashboardSuppliers", { params: { CompanyID } }),
      api.get("/api/dashboardNewWorkers", { params: { CompanyID } }),
    ]);
    setCampStats(campRes.data[0] || {});
    setVehicleStats(vehicleRes.data[0] || {});
    setSupplierStats(supplierRes.data[0] || {});
    setNewWorkerStats(newWorkerRes.data[0] || {});
  } catch (err) {
    console.error("Error fetching secondary cards:", err);
  } finally {
    setSecondaryLoading(false);
  }
};

useEffect(() => {
  fetchSecondaryCards();
}, []);

// derived values
const totalCamps = campStats?.TotalCamps || 0;
const totalRooms = campStats?.TotalRooms || 0;

const totalVehicles = vehicleStats?.TotalVehicles || 0;
const unassignedVehicles = vehicleStats?.UnassignedVehicles || 0;

const totalSuppliers = supplierStats?.TotalSuppliers || 0;
const expiringLicences = supplierStats?.ExpiringLicences || 0;

const newWorkersThisMonth = newWorkerStats?.NewThisMonth || 0;

// ── State (replaces EmpMessage, StockData) ──
const [expiryAlerts, setExpiryAlerts] = useState([]);   // [{ UserId, WorkerName, DocType, ExpiryDate, DaysLeft }]
const [campOccupancy, setCampOccupancy] = useState([]); // [{ CampID, CampName, TotalRooms, TotalBeds, OccupiedBeds }]
const [alertsLoading, setAlertsLoading] = useState(true);
const [occupancyLoading, setOccupancyLoading] = useState(true);

// ── Fetch ──
const normalizeListResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.rows)) return payload.rows;
    return [payload];
  }
  return [];
};

const fetchExpiryAlerts = async () => {
  setAlertsLoading(true);
  try {
    const CompanyID = sessionStorage.getItem("CompanyID");
    const res = await api.get("/api/dashboardExpiryAlerts", { params: { CompanyID, Days: 30 } });
    setExpiryAlerts(normalizeListResponse(res.data));
  } catch (err) {
    console.error("Error fetching expiry alerts:", err);
  } finally {
    setAlertsLoading(false);
  }
};

const fetchCampOccupancy = async () => {
  setOccupancyLoading(true);
  try {
    const CompanyID = sessionStorage.getItem("CompanyID");
    const res = await api.get("/api/GetCamp", { params: { CompanyID } });
    setCampOccupancy(normalizeListResponse(res.data?.camps ?? res.data));
  } catch (err) {
    console.error("Error fetching camp occupancy:", err);
  } finally {
    setOccupancyLoading(false);
  }
};

useEffect(() => {
  fetchExpiryAlerts();
  fetchCampOccupancy();
}, []);

// helper for badge color
const expiryColor = (daysLeft) => {
  if (daysLeft < 0) return { bg: "#fee2e2", color: "#991b1b", label: "Expired" };
  if (daysLeft <= 7) return { bg: "#fee2e2", color: "#991b1b", label: `${daysLeft}d left` };
  if (daysLeft <= 30) return { bg: "#fef3c7", color: "#92400e", label: `${daysLeft}d left` };
  return { bg: "#dcfce7", color: "#166534", label: `${daysLeft}d left` };
};

const safeExpiryAlerts = Array.isArray(expiryAlerts) ? expiryAlerts : [];
// ── State (replaces empSalesData) ──
const [recentAllocations, setRecentAllocations] = useState([]);
const [allocationsLoading, setAllocationsLoading] = useState(true);

// ── Fetch ──
const fetchRecentAllocations = async () => {
  setAllocationsLoading(true);
  try {
    const CompanyID = sessionStorage.getItem("CompanyID");
    const res = await api.get("/api/dashboardRecentAllocations", { params: { CompanyID, Limit: 10 } });
    // expected shape: [{ WorkerName, ProjectName, Status, ModifiedDate }]
    setRecentAllocations(normalizeListResponse(res.data));
  } catch (err) {
    console.error("Error fetching recent allocations:", err);
  } finally {
    setAllocationsLoading(false);
  }
};

useEffect(() => {
  fetchRecentAllocations();
}, []);
// ── State (replaces TopCustData) ──
const [topProjects, setTopProjects] = useState([]);
const [topProjectsLoading, setTopProjectsLoading] = useState(true);

// ── Fetch ──
const fetchTopProjects = async () => {
  setTopProjectsLoading(true);
  try {
    const CompanyID = sessionStorage.getItem("CompanyID");
    const res = await api.get("/api/dashboardTopProjects", { params: { CompanyID, Limit: 10 } });
    // expected shape: [{ ProjectName, ClientName, ManpowerCount, Status }]
    setTopProjects(normalizeListResponse(res.data));
  } catch (err) {
    console.error("Error fetching top projects:", err);
  } finally {
    setTopProjectsLoading(false);
  }
};

useEffect(() => {
  fetchTopProjects();
}, []);
// ── State (replaces prodsaleData) ──
const [rentLossData, setRentLossData] = useState([]);
const [rentLossLoading, setRentLossLoading] = useState(true);

// ── Fetch ──
const fetchRentLoss = async () => {
  setRentLossLoading(true);
  try {
    const CompanyID = sessionStorage.getItem("CompanyID");
    const res = await api.get("/api/dashboardRentLoss", { params: { CompanyID } });
    // expected shape: [{ CampName, TotalRent, RentLoss, OccupancyPercent }]
    setRentLossData(normalizeListResponse(res.data));
  } catch (err) {
    console.error("Error fetching rent loss data:", err);
  } finally {
    setRentLossLoading(false);
  }
};

useEffect(() => {
  fetchRentLoss();
}, []);

// ── State (replaces TaskDash) ──
const [complianceTasks, setComplianceTasks] = useState([]);
const [complianceLoading, setComplianceLoading] = useState(true);

// ── Fetch ──
const fetchComplianceTasks = async () => {
  setComplianceLoading(true);
  try {
    const CompanyID = sessionStorage.getItem("CompanyID");
    const res = await api.get("/api/dashboardComplianceTasks", { params: { CompanyID, Days: 7 } });
    // expected shape: [{ WorkerName, DocType, ExpiryDate, DaysLeft, Priority }]
    setComplianceTasks(normalizeListResponse(res.data));
  } catch (err) {
    console.error("Error fetching compliance tasks:", err);
  } finally {
    setComplianceLoading(false);
  }
};

useEffect(() => {
  fetchComplianceTasks();
}, []);

// ── State (replaces salesReportData) ──
const [workerRoster, setWorkerRoster] = useState([]);
const [rosterLoading, setRosterLoading] = useState(true);
const [rosterEntriesPerPage, setRosterEntriesPerPage] = useState(5);
const [rosterCurrentPage, setRosterCurrentPage] = useState(1);

// ── Fetch (replaces fetchSaleReport) ──
const fetchWorkerRoster = async () => {
  setRosterLoading(true);
  try {
    const CompanyID = sessionStorage.getItem("CompanyID");
    const res = await api.get("/api/GetUsermaster", { params: { CompanyID } });
    setWorkerRoster(normalizeListResponse(res.data));
  } catch (err) {
    console.error("Error fetching worker roster:", err);
  } finally {
    setRosterLoading(false);
  }
};

useEffect(() => {
  fetchWorkerRoster();
}, []);

// ── Pagination (replaces totalEntries/totalPages/visibleEntries logic) ──
const rosterTotalEntries = workerRoster.length;
const rosterTotalPages = Math.ceil(rosterTotalEntries / rosterEntriesPerPage);
const rosterVisibleEntries = workerRoster.slice(
  (rosterCurrentPage - 1) * rosterEntriesPerPage,
  rosterCurrentPage * rosterEntriesPerPage
);

const handleRosterPageChange = (page) => {
  if (page > 0 && page <= rosterTotalPages) setRosterCurrentPage(page);
};

const handleRosterEntriesPerPageChange = (e) => {
  setRosterEntriesPerPage(Number(e.target.value));
  setRosterCurrentPage(1);
};

const fullWorkerName = (item) =>
  [item.Name, item.MName, item.LName].filter(Boolean).join(" ").trim() || "Unknown";
  return (
    <div className="page-body">
      {/* Page body */}
      <div className="container-fluid">
        {/* ── TOP ROW: 4 cards ── */}
<div className="row row-deck row-cards">

  {/* Card 1 — Active Workers */}
  <div className="col-sm-6 col-lg-3">
    <div className="card">
      <div className="card-body">
        <div className="d-flex align-items-center">
          <div className="subheader">Active Workers</div>
        </div>
        <div className="h1 mb-1">
          {topLoading ? "..." : totalActive}
        </div>
        <div className="h5 mb-3 text-secondary">
          {topLoading ? "..." : `On Hire: ${onHire}  ·  Off Hire: ${offHire}`}
        </div>
        <div className="progress progress-sm">
          <div
            className="progress-bar bg-info"
            style={{ width: `${totalActive ? (onHire / totalActive) * 100 : 0}%` }}
            role="progressbar"
          />
        </div>
      </div>
    </div>
  </div>

  {/* Card 2 — Expiring Documents */}
  <div className="col-sm-6 col-lg-3">
    <div className="card">
      <div className="card-body">
        <div className="d-flex align-items-center">
          <div className="subheader">Document Expiry</div>
        </div>
        <div className="h1 mb-1" style={{ color: expiring30 > 0 ? '#e53e3e' : 'inherit' }}>
          {topLoading ? "..." : expiring30}
        </div>
        <div className="h5 mb-3 text-secondary">
          {topLoading ? "..." : `Next 30 days  ·  Expired: ${expired}`}
        </div>
        <div className="progress progress-sm">
          <div
            className="progress-bar bg-danger"
            style={{ width: `${expiring30 ? Math.min((expiring30 / (totalActive || 1)) * 100, 100) : 0}%` }}
            role="progressbar"
          />
        </div>
      </div>
    </div>
  </div>

  {/* Card 3 — Bed Occupancy */}
  <div className="col-sm-6 col-lg-3">
    <div className="card">
      <div className="card-body">
        <div className="d-flex align-items-center">
          <div className="subheader">Bed Occupancy</div>
        </div>
        <div className="h1 mb-1">
          {topLoading ? "..." : `${occupancyPercent.toFixed(0)}%`}
        </div>
        <div className="h5 mb-3 text-secondary">
          {topLoading ? "..." : `${occupiedBeds} / ${totalBeds} beds occupied`}
        </div>
        <div className="progress progress-sm">
          <div
            className="progress-bar bg-warning"
            style={{ width: `${occupancyPercent}%` }}
            role="progressbar"
          />
        </div>
      </div>
    </div>
  </div>

  {/* Card 4 — Active Projects */}
  <div className="col-sm-6 col-lg-3">
    <div className="card">
      <div className="card-body">
        <div className="d-flex align-items-center">
          <div className="subheader">Active Projects</div>
        </div>
        <div className="h1 mb-1">
          {topLoading ? "..." : activeProjects}
        </div>
        <div className="h5 mb-3 text-secondary">
          {topLoading ? "..." : `Manpower: ${manpowerAllocated} / ${manpowerPlanned}`}
        </div>
        <div className="progress progress-sm">
          <div
            className="progress-bar bg-success"
            style={{ width: `${manpowerPercent}%` }}
            role="progressbar"
          />
        </div>
      </div>
    </div>
  </div>
  {/* ── SECONDARY ROW: 4 small cards ── */}
<div className="col-12">
  <div className="row row-cards">

    {/* Card 1 — Camps & Rooms */}
    <div className="col-sm-6 col-lg-3">
      <div className="card card-sm">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-auto">
              <span className="bg-purple text-white avatar">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width={24} height={24}
                  viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" fill="none"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
                  <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
                  <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
                </svg>
              </span>
            </div>
            <div className="col">
              <div className="font-weight-medium">
                {secondaryLoading ? "Loading..." : `${totalCamps} Camps`}
              </div>
              <div className="text-secondary">
                {secondaryLoading ? "" : `${totalRooms} Rooms`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Card 2 — Vehicles */}
    <div className="col-sm-6 col-lg-3">
      <div className="card card-sm">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-auto">
              <span className="bg-blue text-white avatar">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width={24} height={24}
                  viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" fill="none"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M5 17h-2v-6l2 -5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6m-6 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0m12 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                  <path d="M12 6v5" />
                  <path d="M5 9l9 0" />
                </svg>
              </span>
            </div>
            <div className="col">
              <div className="font-weight-medium">
                {secondaryLoading ? "Loading..." : `${totalVehicles} Vehicles`}
              </div>
              <div className="text-secondary">
                {secondaryLoading ? "" : `${unassignedVehicles} Unassigned`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Card 3 — Suppliers */}
    <div className="col-sm-6 col-lg-3">
      <div className="card card-sm">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-auto">
              <span className="bg-red text-white avatar">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width={24} height={24}
                  viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" fill="none"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M3 21l18 0" />
                  <path d="M9 8l1 0" />
                  <path d="M9 12l1 0" />
                  <path d="M9 16l1 0" />
                  <path d="M14 8l1 0" />
                  <path d="M14 12l1 0" />
                  <path d="M14 16l1 0" />
                  <path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16" />
                </svg>
              </span>
            </div>
            <div className="col">
              <div className="font-weight-medium">
                {secondaryLoading ? "Loading..." : `${totalSuppliers} Suppliers`}
              </div>
              <div className="text-secondary" style={{ color: expiringLicences > 0 ? '#e53e3e' : undefined }}>
                {secondaryLoading ? "" : `${expiringLicences} Licences Expiring`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Card 4 — New Workers This Month */}
    <div className="col-sm-6 col-lg-3">
      <div className="card card-sm">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-auto">
              <span className="bg-green text-white avatar">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width={24} height={24}
                  viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" fill="none"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
                  <path d="M6 21v-2a4 4 0 0 1 4 -4h2.5" />
                  <path d="M19 16v6" />
                  <path d="M22 19l-3 3l-3 -3" />
                </svg>
              </span>
            </div>
            <div className="col">
              <div className="font-weight-medium">
                {secondaryLoading ? "Loading..." : `${newWorkersThisMonth} New Workers`}
              </div>
              <div className="text-secondary">This Month</div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</div>

<div className="col-lg-6">
  <div className="card">
    <div className="card-body">
      <h3 className="card-title">Workforce Trend</h3>
      <WorkforceTrendGraph />
    </div>
  </div>
</div>

<div className="col-lg-6">
  <div className="card">
    <div className="card-body">
      <div className="d-flex justify-content-between align-items-center">
        <h3 className="card-title">Camp Locations</h3>
        <button
          className="btn btn-outline-primary btn-sm"
          onClick={() => { window.location.href = "/CampManagement"; }}
        >
          Manage
        </button>
      </div>
      <CampLocationsMap />
    </div>
  </div>
</div>

<div className="col-lg-6">
  <div className="row row-cards">

    {/* ── Document Expiry Alerts (replaces User Message) ── */}
    <div className="col-12">
      <div className="card" style={{ height: "15rem" }}>
        <div className="card-header">
          <h3 className="card-title">Document Expiry Alerts</h3>
          <button
            className="btn btn-outline-primary btn-sm ms-auto"
            onClick={() => { window.location.href = "/UserInfo"; }}
            style={{ float: "right" }}
          >
            View All
          </button>
        </div>
        <div className="card-body card-body-scrollable card-body-scrollable-shadow">
          <div className="divide-y">
            {safeExpiryAlerts.length > 0 ? (
              safeExpiryAlerts.map((alert, idx) => {
                const badge = expiryColor(alert.DaysLeft);
                return (
                  <div key={idx}>
                    <div className="row align-items-center">
                      <div className="col-auto">
                        <span className="avatar">
                          {alert.WorkerName ? alert.WorkerName.charAt(0).toUpperCase() : "U"}
                        </span>
                      </div>
                      <div className="col">
                        <div className="text-truncate">
                          <strong>{alert.WorkerName || "Unknown"}</strong>{" "}
                          — {alert.DocType}
                        </div>
                        <div className="text-secondary">
                          Expires: {alert.ExpiryDate ? new Date(alert.ExpiryDate).toLocaleDateString("en-GB") : "—"}
                        </div>
                      </div>
                      <div className="col-auto align-self-center">
                        <span style={{
                          fontSize: 11, fontWeight: 600, borderRadius: 99,
                          padding: "2px 8px", background: badge.bg, color: badge.color
                        }}>
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-secondary mt-3">
                {alertsLoading ? "Loading..." : "No documents expiring soon."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* ── Camp Occupancy (replaces Stock Storage) ── */}
    <div className="col-12">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Camp Occupancy</h3>
        </div>
        <div className="card-table table-responsive scrollable-div">
          <table className="table table-vcenter">
            <thead>
              <tr>
                <th></th>
                <th>Camp Name</th>
                <th>Rooms</th>
                <th>Occupied</th>
                <th>% Full</th>
              </tr>
            </thead>
            <tbody>
              {campOccupancy && campOccupancy.length > 0 ? (
                campOccupancy.map((camp, index) => {
                  const total = camp.TotalCapacity || 0;
                  const occupied = camp.OccupiedBeds || 0;
                  const pct = total ? Math.round((occupied / total) * 100) : 0;
                  return (
                    <tr key={camp.CampID}>
                      <td>{index + 1}</td>
                      <td className="td-truncate">
                        <div className="text-truncate">{camp.CampName}</div>
                      </td>
                      <td className="text-nowrap text-secondary">{camp.TotalRooms || 0}</td>
                      <td className="text-nowrap text-secondary">{occupied}/{total}</td>
                      <td className="text-nowrap">
                        <span style={{
                          color: pct >= 90 ? "#991b1b" : pct >= 60 ? "#92400e" : "#166534",
                          fontWeight: 600
                        }}>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-secondary">
                    {occupancyLoading ? "Loading..." : "No camp data available"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </div>
</div>

<div className="col-lg-6">
  <div className="card">
    <div className="card-header border-0">
      <div className="card-title">Allocation Activity</div>
    </div>
    <div className="position-relative">
      <AllocationActivityGraph />
    </div>
    <div className="card-table table-responsive scrollable-div">
      <table className="table table-vcenter">
        <thead>
          <tr>
            <th></th>
            <th>Worker</th>
            <th>Project</th>
            <th>Status</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {recentAllocations && recentAllocations.length > 0 ? (
            recentAllocations.map((row, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td className="td-truncate">
                  <div className="text-truncate">{row.WorkerName || "—"}</div>
                </td>
                <td className="text-nowrap text-secondary">{row.ProjectName || "—"}</td>
                <td className="text-nowrap">
                  <span style={{
                    fontSize: 11, fontWeight: 600, borderRadius: 99,
                    padding: "2px 8px",
                    background: row.Status === "onhire" ? "#dcfce7" : row.Status === "offhire" ? "#fee2e2" : "#f1f5f9",
                    color: row.Status === "onhire" ? "#166534" : row.Status === "offhire" ? "#991b1b" : "#64748b"
                  }}>
                    {row.Status === "onhire" ? "On Hire" : row.Status === "offhire" ? "Off Hire" : "—"}
                  </span>
                </td>
                <td className="text-nowrap text-secondary">
                  {row.ModifiedDate ? new Date(row.ModifiedDate).toLocaleDateString("en-GB") : "—"}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center text-secondary">
                {allocationsLoading ? "Loading..." : "No recent allocation activity"}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
</div>

<div className="col-md-12 col-lg-8">
  <div className="card">
    <div className="card-header">
      <h3 className="card-title">Top Projects by Headcount</h3>
    </div>
    <div className="card-table table-responsive scrollable-div">
      <table className="table table-vcenter">
        <thead>
          <tr>
            <th></th>
            <th>Project Name</th>
            <th>Client</th>
            <th>Manpower</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {topProjects && topProjects.length > 0 ? (
            topProjects.map((proj, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td className="td-truncate">
                  <div className="text-truncate">{proj.ProjectName}</div>
                </td>
                <td className="text-nowrap text-secondary">{proj.ClientName || "—"}</td>
                <td className="text-nowrap text-secondary">{proj.ManpowerCount || 0}</td>
                <td className="text-nowrap">
                  <span style={{
                    fontSize: 11, fontWeight: 600, borderRadius: 99,
                    padding: "2px 8px",
                    background: proj.Status === "Active" ? "#dcfce7" : "#f1f5f9",
                    color: proj.Status === "Active" ? "#166534" : "#64748b"
                  }}>
                    {proj.Status || "—"}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center text-secondary">
                {topProjectsLoading ? "Loading..." : "No project data available"}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
</div>

<div className="col-md-6 col-lg-4">
  <div className="card">
    <div className="card-header">
      <h3 className="card-title">Rent Loss by Camp</h3>
    </div>
    <div className="table scrollable-div">
      <table className="table card-table table-vcenter">
        <thead>
          <tr>
            <th>Camp</th>
            <th>Total Rent</th>
            <th>Loss</th>
          </tr>
        </thead>
        <tbody>
          {rentLossData && rentLossData.length > 0 ? (
            rentLossData.map((camp, index) => (
              <tr key={index}>
                <td className="td-truncate">
                  <div className="text-truncate">{camp.CampName}</div>
                </td>
                <td className="text-nowrap text-secondary">
                  ₹{(camp.TotalRent || 0).toLocaleString("en-IN")}
                </td>
                <td className="text-nowrap">
                  <span style={{
                    color: camp.RentLoss > 0 ? "#991b1b" : "#166534",
                    fontWeight: 600
                  }}>
                    ₹{(camp.RentLoss || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="text-center text-secondary">
                {rentLossLoading ? "Loading..." : "No rent data available"}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
</div>
<div className="col-md-12 col-lg-8">
  <div className="card">
    <div className="card-header">
      <h3 className="card-title">Compliance Tasks — Action Needed</h3>
      <button
        className="btn btn-outline-primary btn-sm ms-auto"
        onClick={() => { window.location.href = "/UserInfo"; }}
        style={{ float: "right" }}
      >
        View All
      </button>
    </div>

    <div className="table scrollable-div">
      <table className="table card-table table-vcenter">
        <thead>
          <tr>
            <th>#</th>
            <th>Worker</th>
            <th>Document</th>
            <th>Expiry Date</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>
          {complianceTasks && complianceTasks.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center text-secondary">
                {complianceLoading ? "Loading..." : "No urgent compliance items"}
              </td>
            </tr>
          ) : (
            complianceTasks.map((task, index) => {
              const isUrgent = task.DaysLeft < 0 || task.DaysLeft <= 7;
              return (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{task.WorkerName}</td>
                  <td>{task.DocType}</td>
                  <td>
                    {task.ExpiryDate
                      ? new Date(task.ExpiryDate).toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </td>
                  <td>
                    <span style={{ color: isUrgent ? "#991b1b" : "#92400e", fontWeight: 600 }}>
                      {task.DaysLeft < 0 ? "Expired" : isUrgent ? "Urgent" : "Upcoming"}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </div>
</div>
<div className="col-12">
  <div className="card">
    <div className="card-header">
      <h3 className="card-title">Worker Roster</h3>
    </div>
    <div className="card-body border-bottom py-3">
      <div className="d-flex">
        <div>
          Show{" "}
          <select
            value={rosterEntriesPerPage}
            onChange={handleRosterEntriesPerPageChange}
            className="form-select form-select-sm"
            style={{ width: "auto", display: "inline-block" }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
          </select>{" "}
          entries
        </div>
      </div>
    </div>
    <div className="table-responsive">
      <table className="table card-table table-vcenter text-nowrap datatable">
        <thead>
          <tr>
            <th>HAVEN ID</th>
            <th>Name</th>
            <th>Trade</th>
            <th>Supplier</th>
            <th>Project</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rosterLoading ? (
            <tr>
              <td colSpan="6" className="text-center text-secondary">Loading...</td>
            </tr>
          ) : rosterVisibleEntries.length > 0 ? (
            rosterVisibleEntries.map((w, index) => {
              const statusLabel = w.AllocationStatus || w.ProjectAllocationStatus;
              const isOnHire = statusLabel === "onhire" || statusLabel === 1 || statusLabel === "1";
              const isOffHire = statusLabel === "offhire" || statusLabel === 0 || statusLabel === "0";
              return (
                <tr key={w.UserId || index}>
                  <td>HAV/{w.UserId}</td>
                  <td>{fullWorkerName(w)}</td>
                  <td>{w.RoleName || "—"}</td>
                  <td>{w.SupplierName || w.AccountName || "—"}</td>
                  <td>{w.ProjectName || "—"}</td>
                  <td>
                    {isOnHire ? (
                      <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 99, padding: "2px 8px", background: "#dcfce7", color: "#166534" }}>
                        On Hire
                      </span>
                    ) : isOffHire ? (
                      <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 99, padding: "2px 8px", background: "#fee2e2", color: "#991b1b" }}>
                        Off Hire
                      </span>
                    ) : (
                      <span className="text-secondary">—</span>
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="6" className="text-center text-secondary">No workers found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    <div className="card-footer d-flex align-items-center">
      <p className="m-0 text-secondary">
        Showing <span>{(rosterCurrentPage - 1) * rosterEntriesPerPage + 1}</span>{" "}
        to <span>{Math.min(rosterCurrentPage * rosterEntriesPerPage, rosterTotalEntries)}</span>{" "}
        of <span>{rosterTotalEntries}</span> entries
      </p>
      <ul className="pagination m-0 ms-auto">
        <li className={`page-item ${rosterCurrentPage === 1 ? "disabled" : ""}`}>
          <button className="page-link" onClick={() => handleRosterPageChange(rosterCurrentPage - 1)} disabled={rosterCurrentPage === 1}>
            Prev
          </button>
        </li>
        {Array.from({ length: Math.min(5, rosterTotalPages) }, (_, i) => {
          const startPage = Math.max(1, rosterCurrentPage - 2);
          const pageNumber = startPage + i;
          if (pageNumber > rosterTotalPages) return null;
          return (
            <li key={pageNumber} className={`page-item ${rosterCurrentPage === pageNumber ? "active" : ""}`}>
              <button className="page-link" onClick={() => handleRosterPageChange(pageNumber)}>
                {pageNumber}
              </button>
            </li>
          );
        })}
        <li className={`page-item ${rosterCurrentPage === rosterTotalPages ? "disabled" : ""}`}>
          <button className="page-link" onClick={() => handleRosterPageChange(rosterCurrentPage + 1)} disabled={rosterCurrentPage === rosterTotalPages}>
            Next
          </button>
        </li>
      </ul>
    </div>
  </div>
</div>

</div>

      </div>
    </div>
  );
}; 

export default Pagebody;
