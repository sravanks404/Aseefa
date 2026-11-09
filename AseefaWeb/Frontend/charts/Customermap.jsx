import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import api from "../pages/apiService";

const KeralaMap = () => {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    // Fetch data from the API
    const fetchCustomers = async () => {
      try {
        const companyID = sessionStorage.getItem("CompanyID");
        
        // Fetch data from the API using CompanyID
        const response = await api.get(`/api/routeCustomerloc?CompanyID=${companyID}`);
        // Filter customers with valid latitude and longitude
        const validCustomers = response.data.filter(
          (customer) => customer.Latitude && customer.Longitude
        );
        setCustomers(validCustomers);
      } catch (error) {
        console.error("Error fetching customer locations:", error);
      }
    };

    fetchCustomers();
  }, []);

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
      {customers.map((customer) => (
        <Marker
          key={customer.AccountID}
          position={[parseFloat(customer.Latitude), parseFloat(customer.Longitude)]}
        >
       <Popup>
  <b>{customer.AccountName}</b>
  <br />
  <b>Route: {customer.RootName}</b>
</Popup>

        </Marker>
      ))}
    </MapContainer>
  );
};

export default KeralaMap;
