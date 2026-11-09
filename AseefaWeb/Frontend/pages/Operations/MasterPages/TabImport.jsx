import React, { useState } from "react";

import ImportCustomer from "./ImportCustomer";
import ImportSupplier from "./ImportSupplier";
import ImportItem from "./ImportItem";

const TabImport = () => {
  const [activeTab, setActiveTab] = useState(1); // 1: Customer, 2: Supplier, 3: Item

  return (
    <div className="common-page">
      <ul className="nav ms-5 nav-tabs mt-5">
        <li onClick={() => setActiveTab(1)} className="nav-item me-3">
          <a className={`nav-link ${activeTab === 1 ? "active" : ""}`} href="#">
            Customer
          </a>
        </li>
        <li onClick={() => setActiveTab(2)} className="nav-item me-3">
          <a className={`nav-link ${activeTab === 2 ? "active" : ""}`} href="#">
            Supplier
          </a>
        </li>
        <li onClick={() => setActiveTab(3)} className="nav-item">
          <a className={`nav-link ${activeTab === 3 ? "active" : ""}`} href="#">
            Item
          </a>
        </li>
      </ul>

      {activeTab === 1 && <ImportCustomer />}
      {activeTab === 2 && <ImportSupplier />}
      {activeTab === 3 && <ImportItem />}
    </div>
  );
};

export default TabImport;
