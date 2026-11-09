import React, { useState } from "react";

import RouteMaster from "./RouteMaster";
import VehicleMaster from "./VehicleMaster";
// import PlaceMaster from "./PlaceMaster";

const TabBeatMaster = () => {
  const [activeTab, setActiveTab] = useState(1); // 1: Customer, 2: Supplier, 3: Item

  return (
    <div className="common-page">
      <ul className="nav ms-5 nav-tabs mt-5">
        <li onClick={() => setActiveTab(1)} className="nav-item me-3">
          <a className={`nav-link ${activeTab === 1 ? "active" : ""}`} href="#">
           Route Master
          </a>
        </li>
        <li onClick={() => setActiveTab(2)} className="nav-item me-3">
          <a className={`nav-link ${activeTab === 2 ? "active" : ""}`} href="#">
           Vehicle Master
          </a>
        </li>
        {/* <li onClick={() => setActiveTab(3)} className="nav-item">
          <a className={`nav-link ${activeTab === 3 ? "active" : ""}`} href="#">
            Place Master
          </a>
        </li> */}
      </ul>

      {activeTab === 1 && <RouteMaster />}
      {activeTab === 2 && <VehicleMaster />}
      {/* {activeTab === 3 && <PlaceMaster />} */}
    </div>
  );
};

export default TabBeatMaster;
