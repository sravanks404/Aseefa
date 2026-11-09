import React, { useState, useEffect } from "react";
import api from "../pages/apiService";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

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

const AllocationActivityGraph = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const CompanyID = sessionStorage.getItem("CompanyID");
        const res = await api.get("/api/dashboardAllocationActivity", { params: { CompanyID } });
        // expected shape: [{ Day: 'Mon', NewAllocations: 5, Reallocations: 2 }, ...]
        setData(normalizeListResponse(res.data));
      } catch (err) {
        console.error("Error fetching allocation activity:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-center text-secondary py-4">Loading...</div>;
  if (!data.length) return <div className="text-center text-secondary py-4">No activity data</div>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="Day" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="NewAllocations" fill="#2D4BA9" name="New Allocations" />
        <Bar dataKey="Reallocations" fill="#F59E0B" name="Reallocations" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default AllocationActivityGraph;