import React from "react";
import { Navigate, Outlet } from "react-router";

const Loginprotectroute = () => {

  const UserId = sessionStorage.getItem("UserId");
  const CompanyID = sessionStorage.getItem("CompanyID");

  // Check if token, UserId, and CompanyID exist in sessionStorage
  if (UserId && CompanyID) {
    return <Navigate to="/dashboard" />;
  }

  return <Outlet />;
};

export default Loginprotectroute;
