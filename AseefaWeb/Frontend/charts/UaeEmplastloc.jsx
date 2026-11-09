import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "../pages/apiService";

// Fix for missing marker icons
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const Emplastloc = () => {
  const [userLocations, setUserLocations] = useState([]);

  useEffect(() => {
    const fetchUserLocations = async () => {
      try {
        const companyID = sessionStorage.getItem("CompanyID");
        const activeUserId = sessionStorage.getItem("activeUserId");

        const response = await api.post(`/api/userlastlive`, {  // Changed to post with body
          CompanyID: companyID,                                   // Removed query string
          activeUserId: activeUserId,
        });

        const validUserLocations = response.data.filter(
          (user) => user.Latitude && user.Longitude
        );
        setUserLocations(validUserLocations);
      } catch (error) {
        console.error("Error fetching user locations:", error);
      }
    };

    fetchUserLocations();
    const interval = setInterval(fetchUserLocations, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeToIST = (utcTime) => {
    const date = new Date(utcTime);
    const adjustedTime = new Date(date.getTime() - (5 * 60 + 30) * 60000);
    const options = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };
    return adjustedTime.toLocaleTimeString("en-IN", options);
  };

  
  return (
    <MapContainer
      center={[9.2646, 76.7879]}
      zoom={7}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {userLocations.map((user) => (
        <Marker
          key={user.EmpLocID}
          position={[parseFloat(user.Latitude), parseFloat(user.Longitude)]}
        >
          <Popup>
            <b>{user.Name}</b>
            <br />
            <b>Date:</b> {new Date(user.Date).toLocaleDateString('en-GB')}
            <br />
            <b>Time:</b> {formatTimeToIST(user.Date)}
            <br />
            <b>Place:</b> {user.Place}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Emplastloc;
