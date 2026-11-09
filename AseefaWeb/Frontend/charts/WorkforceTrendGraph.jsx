import React, { useState, useEffect } from "react";
import api from "../pages/apiService";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

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

const WorkforceTrendGraph = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrend = async () => {
      try {
        const CompanyID = sessionStorage.getItem("CompanyID");
        const res = await api.get("/api/dashboardWorkforceTrend", { params: { CompanyID } });
        // expected shape: [{ Month: 'Jan', OnHire: 120, OffHire: 15 }, ...]
        setData(normalizeListResponse(res.data));
      } catch (err) {
        console.error("Error fetching workforce trend:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrend();
  }, []);

  if (loading) return <div className="text-center text-secondary py-5">Loading...</div>;
  if (!data.length) return <div className="text-center text-secondary py-5">No data available</div>;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="Month" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="OnHire" stroke="#2D4BA9" strokeWidth={2} name="On Hire" />
        <Line type="monotone" dataKey="OffHire" stroke="#E04055" strokeWidth={2} name="Off Hire" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default WorkforceTrendGraph;