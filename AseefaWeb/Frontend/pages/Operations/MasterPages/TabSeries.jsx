import React, { useState } from "react";

import SeriesAllocation from "./SeriesAllocation";
import InvoiceSeries from "./InvoiceSeries";
// import ImportItem from "./ImportItem";

const TabSeries = () => {
  const [activeTab, setActiveTab] = useState(1); // 1: Customer, 2: Supplier, 3: Item

  return (
    <div className="common-page">
      <ul className="nav ms-5 nav-tabs mt-5">
        <li onClick={() => setActiveTab(1)} className="nav-item me-3">
          <a className={`nav-link ${activeTab === 1 ? "active" : ""}`} href="#">
            Series Allocation
          </a>
        </li>
        <li onClick={() => setActiveTab(2)} className="nav-item me-3">
          <a className={`nav-link ${activeTab === 2 ? "active" : ""}`} href="#">
            Invoice Series
          </a>
        </li>
        {/* <li onClick={() => setActiveTab(3)} className="nav-item">
          <a className={`nav-link ${activeTab === 3 ? "active" : ""}`} href="#">
            Item
          </a>
        </li> */}
      </ul>

      {activeTab === 1 && <SeriesAllocation />}
      {activeTab === 2 && <InvoiceSeries />}
      {/* {activeTab === 3 && <ImportItem />} */}
    </div>
  );
};

export default TabSeries;
