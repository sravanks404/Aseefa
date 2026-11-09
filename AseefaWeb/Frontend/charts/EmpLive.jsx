import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import api from "../pages/apiService";

const EmpLive = () => {
  const [userLocations, setUserLocations] = useState([]);
  const colors = ["red", "blue", "green", "purple", "orange", "yellow"]; // Color options for different users

  useEffect(() => {
    const fetchUserLocations = async () => {
      try {
        const companyID = sessionStorage.getItem("CompanyID");
        const response = await api.get(`/api/userlive?CompanyID=${companyID}`);
        const validUserLocations = response.data.filter(
          (user) => user.Latitude && user.Longitude
        );
        setUserLocations(validUserLocations);
      } catch (error) {
        console.error("Error fetching user locations:", error);
      }
    };

    // Call the API immediately on mount
    fetchUserLocations();

    // Set interval to call the API every 10 seconds (10000 milliseconds)
    const interval = setInterval(fetchUserLocations, 10000);

    // Clear the interval when the component unmounts to prevent memory leaks
    return () => clearInterval(interval);
  }, []);

  // Group locations by UserId and identify the last location
  const groupedLocations = userLocations.reduce((acc, loc) => {
    if (!acc[loc.UserId]) {
      acc[loc.UserId] = { locations: [], lastLocation: null };
    }
    acc[loc.UserId].locations.push(loc);

    // Update last location based on the highest EmpLocID
    if (
      !acc[loc.UserId].lastLocation ||
      loc.EmpLocID > acc[loc.UserId].lastLocation.EmpLocID
    ) {
      acc[loc.UserId].lastLocation = loc;
    }

    return acc;
  }, {});

  // Function to subtract 5 hours and 30 minutes from UTC and convert to IST
  const formatTimeToIST = (utcTime) => {
    const date = new Date(utcTime); // Parse the UTC time into a Date object
    const adjustedTime = new Date(date.getTime() - (5 * 60 + 30) * 60000); // Subtract 5 hours and 30 minutes
    const options = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true, // Ensure 12-hour format
    };
    return adjustedTime.toLocaleTimeString("en-IN", options); // Return adjusted time
  };

  return (
    <MapContainer
      center={[9.2646, 76.7879]} // Pathanamthitta's latitude and longitude
      zoom={8}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Render lines and markers */}
      {Object.entries(groupedLocations).map(([userId, data], index) => {
        const polylinePositions = data.locations.map((loc) => [
          parseFloat(loc.Latitude),
          parseFloat(loc.Longitude),
        ]);
        const color = colors[index % colors.length]; // Assign a unique color for each user
        const { lastLocation } = data;

        return (
          <React.Fragment key={userId}>
            {/* Polyline for each user */}
            <Polyline
              positions={polylinePositions}
              pathOptions={{ color }}
              eventHandlers={{
                click: () => {
                  alert(`User: ${lastLocation.Name}`); // Show popup with user name on click
                },
              }}
            />

            {/* Marker for the last location */}
            {lastLocation && (
              <Marker
                position={[
                  parseFloat(lastLocation.Latitude),
                  parseFloat(lastLocation.Longitude),
                ]}
              >
                <Popup>
                  <b>{lastLocation.Name}</b>
                  <br />
                  <b>Time:</b> {formatTimeToIST(lastLocation.Date)}
                  <br />
                  <b>Place:</b> {lastLocation.Place}
                </Popup>
              </Marker>
            )}
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
};

export default EmpLive;
