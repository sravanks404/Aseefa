import UserInfo from "./UserInfo";
import UserDetails from "./UserDetails";
import MacMaster from "./MacMaster";
import Roles from "./Roles";
import EmployeeCategory from "./EmployeeCategory"
import React, { useState, useEffect } from 'react';


const TabUser = () => {
  const [tabIndex, setTabIndex] = useState(1);

  const handleChange = (index) => {
    setTabIndex(index);
  };
 
  return (
    <div className="common-page">
<ul
        className="nav ms-5 nav-tabs flex-nowrap"
        style={{
          overflowX: "auto",
          whiteSpace: "nowrap",
          display: "flex",
          flexWrap: "nowrap",
          WebkitOverflowScrolling: "touch"
        }}
      >        <li onClick={() => handleChange(1)} className="nav-item me-3">
          <a
            className={tabIndex === 1 ? "nav-link active" : "nav-link"}
            aria-current="page"
            href="#"
          >
           Workers
          </a>
        </li>
        {/* <li onClick={() => handleChange(2)} className="nav-item me-3">
          <a
            className={tabIndex === 2 ? "nav-link active" : "nav-link"}
            href="#"
          >
           User Details 
          </a>
        </li> */}
{/* 
        <li onClick={() => handleChange(3)} className="nav-item me-3">
          <a
            className={tabIndex === 3 ? "nav-link active" : "nav-link"}
            href="#"
          >
           Mac Master
          </a>
        </li> */}
        <li onClick={() => handleChange(4)} className="nav-item me-3">
          <a
            className={tabIndex === 4 ? "nav-link active" : "nav-link"}
            href="#"
          >
           Trades
          </a>
        </li>
        <li onClick={() => handleChange(5)} className="nav-item me-3">
          <a
            className={tabIndex === 4 ? "nav-link active" : "nav-link"}
            href="#"
          >
           Employment Category
          </a>
        </li>
      </ul>

      {tabIndex === 1 && <UserInfo />}   
      {tabIndex === 2 && <UserDetails />}
      {tabIndex === 3 && <MacMaster />}
      {tabIndex === 4 && <Roles />}
      {tabIndex === 5 && <EmployeeCategory />}           

  
    </div>
  );
};

export default TabUser;