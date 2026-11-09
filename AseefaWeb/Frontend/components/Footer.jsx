import React from 'react';

import { getVersion } from "../pages/apiService"; // Import version function
import { useNavigate } from "react-router-dom"; // For redirection

const Footer = () => {
  const navigate = useNavigate();

  return (
 <footer className="footer footer-transparent d-print-none py-1">
  <div className="container-fluid px-2">
    <div className="row text-center align-items-center flex-row-reverse g-0">
      <div className="col-lg-auto ms-lg-auto">
        <ul className="list-inline list-inline-dots mb-0"></ul>
      </div>
      <div className="col-12 col-lg-auto mt-1 mt-lg-0">
        <ul className="list-inline list-inline-dots mb-0 small">
          <li className="list-inline-item">
            Copyright © {new Date().getFullYear()}{' '}
            <a href="https://microtechsoftwaresolutions.in/" className="link-secondary">
              Microtech Software Solutions
            </a>
            . All rights reserved.
          </li>
          <li className="list-inline-item">
            <a
              href="/versionlog"
              className="link-secondary"
              rel="noopener"
              onClick={(e) => {
                e.preventDefault();
                navigate("/versionlogpage");
              }}
            >
             SuitApps {getVersion()}
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</footer>

  );
};

export default Footer;
