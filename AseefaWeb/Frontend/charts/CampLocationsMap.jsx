import React, { useState, useEffect } from "react";
import api from "../pages/apiService";

const CampLocationsMap = () => {
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCamps = async () => {
      try {
        const CompanyID = sessionStorage.getItem("CompanyID");
        const res = await api.get("/api/GetCamp", { params: { CompanyID } });
        setCamps((res.data.camps || []).filter(c => c.Latitude && c.Longitude));
      } catch (err) {
        console.error("Error fetching camp locations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCamps();
  }, []);

  if (loading) return <div className="text-center text-secondary py-5">Loading map...</div>;
  if (!camps.length) return <div className="text-center text-secondary py-5">No camp locations available</div>;

  // Simple embed using Google Maps with multiple markers via iframe is limited to one point,
  // so for true multi-marker maps swap this for your existing map library (e.g. react-leaflet, @react-google-maps/api).
  // Placeholder: list view fallback shown below; replace with your map component if available.
  return (
    <div style={{ maxHeight: 220, overflowY: "auto" }}>
      <table className="table table-sm table-vcenter mb-0">
        <thead>
          <tr><th>Camp</th><th>Location</th><th>Occupancy</th></tr>
        </thead>
        <tbody>
          {camps.map(c => (
            <tr key={c.CampID}>
              <td>{c.CampName}</td>
              <td className="text-secondary">{c.CampLocation || "—"}</td>
              <td className="text-secondary">
                {c.TotalCapacity ? `${c.TotalCapacity} beds` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CampLocationsMap;