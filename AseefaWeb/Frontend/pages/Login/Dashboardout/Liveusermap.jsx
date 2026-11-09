import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../../apiService";
import "bootstrap-icons/font/bootstrap-icons.css";

// ✅ Custom Icons
const locationIcon = new Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [40, 40],
});

const intervalIcon = new Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/447/447031.png",
  iconSize: [24, 24],
});

const EmpLivePage = () => {
  const [users, setUsers] = useState([]);
  const [userLocations, setUserLocations] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [zoomLevel, setZoomLevel] = useState(9);
  const [tripData, setTripData] = useState([]);
  const [loading, setLoading] = useState(false);

  const colors = ["#007bff", "#28a745", "#ffc107", "#dc3545", "#17a2b8", "#6610f2"];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get(`/api/LiveLocEmp?Date=${date}`);

        // ✅ Remove duplicate users by storing in a Map (UserId as key)
        const uniqueUsers = Array.from(
          new Map(response.data.map(({ EmpID, Name }) => [EmpID, { EmpID, Name }])).values()
        );

        setUsers(uniqueUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, [date]);

  useEffect(() => {
    if (!selectedUserId) return;
  
    const fetchUserLocations = async () => {
      try {
        setLoading(true); // ⬅️ Show loader
        const companyID = sessionStorage.getItem("CompanyID");
        const response = await api.get(`/api/userlive?CompanyID=${companyID}&Date=${date}&UserID=${selectedUserId}`);
        const validUserLocations = response.data
          .filter((user) => user.Latitude && user.Longitude)
          .map((user) => ({
            ...user,
            Latitude: parseFloat(user.Latitude),
            Longitude: parseFloat(user.Longitude),
          }));
        setUserLocations(validUserLocations);
      } catch (error) {
        console.error("Error fetching user locations:", error);
      } finally {
        setLoading(false); // ⬅️ Hide loader
      }
    };
  
    fetchUserLocations();
  }, [selectedUserId, date]);
  

  useEffect(() => {
    if (!selectedUserId || !date) return;  // Prevent API calls if no user is selected

    const fetchTripMapData = async () => {
      try {
        const companyId = sessionStorage.getItem("CompanyID");
        if (!companyId) {
          console.warn("CompanyID is missing from sessionStorage");
          return;
        }


        const response = await api.get(
          `/api/GetTripMap?CompanyId=${companyId}&UserId=${selectedUserId}&Date=${date}`
        );


        setTripData(response.data || []);
      } catch (err) {
        console.error("Failed to fetch trip map data:", err);
      }
    };

    fetchTripMapData();
  }, [selectedUserId, date]);

  const groupedLocations = useMemo(() => {
    return userLocations.reduce((acc, loc) => {
      if (!acc[loc.UserId]) {
        acc[loc.UserId] = { locations: [], intervalPoints: [] };
      }
      acc[loc.UserId].locations.push(loc);

      if (loc.IsIntervalPoint) {
        acc[loc.UserId].intervalPoints.push(loc);
      }
      return acc;
    }, {});
  }, [userLocations]);

  const filteredLocations = useMemo(() => {
    if (!selectedUserId) return {}; // Return empty object if no user is selected
    return groupedLocations[selectedUserId] ? { [selectedUserId]: groupedLocations[selectedUserId] } : {};
  }, [selectedUserId, groupedLocations]);

  const formatTimeToIST = (utcTime) => {
    const date = new Date(utcTime);
    const adjustedTime = new Date(date.getTime() - (5 * 60 + 30) * 60000);
    return adjustedTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  };



  const customerIcon = new Icon({
    iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png", // Green-style marker, 
    iconSize: [35, 35],

  });


  
  // const FlyToLocation = ({ lat, lng }) => {
  //   const map = useMap();

  //   useEffect(() => {
  //     if (lat && lng) {
  //       map.flyTo([lat, lng], map.getZoom(), { duration: 1.5 }); // Keep the current zoom level
  //     }
  //   }, [lat, lng, map]);

  //   return null;
  // };



  // useEffect(() => {
  //   if (selectedUserId && userLocations.length > 0) {
  //     setSelectedUserData(userLocations[0]); // Set to first valid location
  //   }
  // }, [selectedUserId, userLocations]);


  const ZoomHandler = () => {
    const map = useMap();
    useEffect(() => {
      const onZoom = () => {
        setZoomLevel(map.getZoom());
      };
      map.on("zoomend", onZoom);
      return () => {
        map.off("zoomend", onZoom);
      };
    }, [map]);
    return null;
  };

  return (
    <div className="container-fluid bg-light p-3" style={{ minHeight: "100vh" }}>
      <div className="row">

        {/* Sidebar */}
        <div className="col-md-3">
          <div className="card shadow-sm sticky-top" style={{ maxHeight: "95vh", overflowY: "auto" }}>
            <div className="card-body">

              {/* Filters Section */}
              <h5 className="card-title">Filters</h5>

              {/* Date Filter */}
              <div className="mb-3">
                <label className="form-label">Select Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              {/* User Filter */}
              <label className="form-label">Select User</label>
              <select className="form-select mb-3" value={selectedUserId || ""} onChange={(e) => setSelectedUserId(Number(e.target.value) || null)}>
                <option value="">Select User</option>
                {users.map(({ EmpID, Name }) => (
                  <option key={EmpID} value={EmpID}>{Name}</option>
                ))}
              </select>

              {/* Interval Points Section */}
              <div className="card-title mt-4 d-flex align-items-center">
                <h5 className="me-2">📍 Interval Points</h5>
                <span className="badge bg-">{Object.values(filteredLocations).flatMap(data => data.intervalPoints || []).length} Points</span>
              </div>

              {/* Scrollable Interval Points Section */}
              <div style={{ maxHeight: "60vh", overflowY: "auto", borderRadius: "8px", boxShadow: "inset 0 0 10px rgba(0,0,0,0.1)" }}>
                <div className="row g-2">
                  {Object.values(filteredLocations).flatMap((data) =>
                    data.intervalPoints && data.intervalPoints.length > 0 ? (
                      data.intervalPoints.map((point, idx) => (
                        <div key={idx} className="col-12">
                          <div className="card border-0 shadow-sm p-2">
                            <div className="card-body d-flex align-items-start">

                              {/* Location Icon */}
                              <div className="me-3">
                                <i className="bi bi-geo-alt-fill text-danger fs-4"></i>
                              </div>

                              <div>
                                {/* Location Name */}
                                <h6 className="text-primary mb-1 d-flex align-items-center">
                                  {point.Name || "Unknown"}
                                </h6>

                                {/* Time with Clock Icon */}
                                <p className="text-muted mb-1 d-flex align-items-center">
                                  <i className="bi bi-clock me-1"></i> {formatTimeToIST(point.Date)}
                                </p>

                                {/* Place */}
                                <p className="mb-0">
                                  <i className="bi bi-geo-fill me-1 text-success"></i>
                                  {point.Place || "No location specified"}
                                </p>
                              </div>

                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div key="no-data" className="col-12 text-muted text-center p-2">
                        <i className="bi bi-exclamation-triangle me-2"></i> No interval points available
                      </div>
                    )
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Map */}
        <div className="col-md-9">
          <div className="card shadow-sm">
            <div className="card-body">
              <h3 className="card-title">Live Locations</h3>
              <div style={{ height: "80vh", width: "100%" }}>
              {loading && (
  <div className="position-absolute d-flex justify-content-center align-items-center"
       style={{ height: "80vh", width: "100%", background: "rgba(255,255,255,0.6)", zIndex: 1000 }}>
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
)}

                <MapContainer
                  center={[9.2646, 76.7879]}
                  zoom={6.5} // Lower value for more zoomed-out view
                  style={{ height: "100%", width: "100%" }}
                  
                >
                  <ZoomHandler />

                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />

                  {/* {selectedUserData && selectedUserData.Latitude && selectedUserData.Longitude && (
    <FlyToLocation lat={selectedUserData.Latitude} lng={selectedUserData.Longitude} />
  )} */}

                  {/* {tripData.length > 0 && (
        <Polyline positions={tripData.map((point) => [point.CustLatitude, point.CustLongitude])} color="blue" />
      )} */}

                  {tripData.map((loc) => (
                    loc.EmpLatitude && loc.EmpLongitude && (
                      <Marker key={`emp-${loc.SLNo}`} position={[parseFloat(loc.EmpLatitude), parseFloat(loc.EmpLongitude)]} icon={customerIcon}>
                        <Popup>
                          <b>SLNo:</b> {loc.SLNo}
                          <br />
                          <b>Account Name:</b> {loc.AccountName}
                          <br />
                          <b>Address:</b> {loc.Address}
                        </Popup>
                      </Marker>
                    )
                  ))}

                  {Object.entries(filteredLocations).map(([userId, data], index) => {
                    // Ensure locations exist before proceeding
                    if (!data?.locations || data.locations.length === 0) return null;

                    const polylinePositions = data.locations.map((loc) => [loc.Latitude, loc.Longitude]);
                    const color = colors[index % colors.length];
                    const { locations, intervalPoints = [] } = data;

                    return (
                      <React.Fragment key={userId}>
                        {/* Polyline */}
                        <Polyline positions={polylinePositions} pathOptions={{ color, weight: 4, opacity: 0.8 }} />

                        {/* Start Marker */}
                        <Marker position={[locations[0].Latitude, locations[0].Longitude]} icon={locationIcon}>
                          <Popup>Start: {locations[0].Name}</Popup>
                        </Marker>

                        {/* Interval Points: only show when zoom >= 12 */}
                        {zoomLevel >= 12 &&
                          intervalPoints.map((point, idx) => (
                            <Marker key={idx} position={[point.Latitude, point.Longitude]} icon={intervalIcon}>
                              <Tooltip>{`${point.Place} @ ${formatTimeToIST(point.Date)}`}</Tooltip>
                            </Marker>
                          ))}

                        {/* End Marker */}
                        <Marker position={[locations[locations.length - 1].Latitude, locations[locations.length - 1].Longitude]} icon={locationIcon}>
                          <Popup>End: {locations[locations.length - 1].Name}</Popup>
                        </Marker>
                      </React.Fragment>
                    );
                  })}
                </MapContainer>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

};

export default EmpLivePage;