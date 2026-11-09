//Protectorroute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router";

const Protectorroute = () => {
  const UserId = sessionStorage.getItem("UserId");
  const CompanyID = sessionStorage.getItem("CompanyID");

  // Check if both UserId and CompanyID are present in sessionStorage
  if (!UserId || !CompanyID) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
};

export default Protectorroute;
