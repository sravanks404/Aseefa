import BranchMaster from "./BranchMaster";
import ZoneMaster from "./ZoneMaster";
import Distributors from "./Distributors";

import React, { useState, useEffect } from 'react';


const TabUserMaster = () => {
  const [tabIndex, setTabIndex] = useState(1);

  const handleChange = (index) => {
    setTabIndex(index);
  };

  return (
    <div className="common-page">
      <ul className="nav ms-5 nav-tabs mt-5">
        <li onClick={() => handleChange(1)} className="nav-item me-3">
          <a
            className={tabIndex === 1 ? "nav-link active" : "nav-link"}
            aria-current="page"
            href="#"
          >
        Branch Master
          </a>
        </li>
        <li onClick={() => handleChange(2)} className="nav-item me-3">
          <a
            className={tabIndex === 2 ? "nav-link active" : "nav-link"}
            href="#"
          >
          Zone Master
          </a>
        </li>

         <li onClick={() => handleChange(3)} className="nav-item me-3">
          <a
            className={tabIndex === 3 ? "nav-link active" : "nav-link"}
            href="#"
          >
           Distributor Master
          </a>
        </li>
        
      </ul>

      {tabIndex === 1 && <BranchMaster />}
      {tabIndex === 2 && <ZoneMaster />}
      {tabIndex === 3 && <Distributors />}

  
    </div>
  );
};

export default TabUserMaster;