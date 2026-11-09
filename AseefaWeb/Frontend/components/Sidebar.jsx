import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../pages/apiService";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Navbar.css";
import suitAppLogo from "../src/assets/suitappsblue.svg";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [financial, setFinancial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  useEffect(() => {
    document.body.setAttribute("data-bs-theme", "light");
    document.body.classList.remove("theme-dark");
    localStorage.removeItem("theme");
    localStorage.removeItem("dashTheme");
    const styleTag = document.getElementById("global-dark-override");
    if (styleTag) styleTag.remove();
  }, []);

  // Always show Reports and Operation
  const [showOperation] = useState(true);
  const [showReports] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const UserId = sessionStorage.getItem("UserId");
        const CompanyID = sessionStorage.getItem("CompanyID");

        const safeParse = (k) => { try { const v = sessionStorage.getItem(k); return (v && v !== "undefined") ? JSON.parse(v) : null; } catch { return null; } };
        let userData = safeParse("userResponse");
        let companyData = safeParse("companyResponse");
        let financialData = safeParse("financialResponse");

        if (!userData || !companyData || !financialData) {
          const [userResponse, companyResponse, financialResponse] = await Promise.all([
            api.get(`/api/getUserbyid?UserId=${UserId}`),
            api.get(`/api/getcompanynav?CompanyID=${CompanyID}`),
            api.get(`/api/getfinancialbyid?CompanyID=${CompanyID}`),
          ]);

          userData = (userResponse.data && userResponse.data[0]) || null;
          companyData = (companyResponse.data && companyResponse.data[0]) || null;
          financialData = (financialResponse.data && financialResponse.data[0]) || null;

          sessionStorage.setItem("userResponse", JSON.stringify(userData));
          sessionStorage.setItem("companyResponse", JSON.stringify(companyData));
          sessionStorage.setItem("financialResponse", JSON.stringify(financialData));
        }

        setUser(userData);
        setCompany(companyData);
        setFinancial(financialData);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch data. Please try again.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu when switching to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setIsMobileMenuOpen(false);
      } else {
        setActiveMenu(null);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await api.post("/api/logout", {}, { headers: { "Content-Type": "application/json" } });

      if (response.data.success) {
        sessionStorage.clear();
        navigate("/");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const userRoleId = sessionStorage.getItem("UserRoleId");

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((o) => !o);
  };

  const toggleActiveMenu = (menu) => {
    if (window.innerWidth >= 992) {
      setActiveMenu(activeMenu === menu ? null : menu);
    } else {
      setActiveMenu(activeMenu === menu ? null : menu);
    }
  };

  if (error) return <p>{error}</p>;

  return (
    <>
      <nav className="navbar navbar-expand-lg" style={{
        backgroundColor: "#10299b",
        position: 'relative',
        zIndex: 2,
        paddingBottom: '0'
      }}>
        <div className="container-fluid px-3">
          <div className="d-flex align-items-start w-100 flex-column flex-lg-row">
            {/* Mobile-only header */}
            <div className="d-lg-none w-100 mobile-header">
              {/* Left: Hamburger */}
              <div className="d-flex align-items-center">
                <button
                  className="navbar-toggler"
                  type="button"
                  aria-label="Toggle navigation"
                  aria-expanded={isMobileMenuOpen}
                  onClick={toggleMobileMenu}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 6,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: 24,
                    width: 30,
                    marginRight: 8,
                  }}
                >
                  {[...Array(3)].map((_, i) => (
                    <span
                      key={i}
                      style={{
                        display: "block",
                        height: 2,
                        borderRadius: 1,
                        backgroundColor: "white",
                        width: "100%",
                      }}
                    />
                  ))}
                </button>
              </div>

              {/* Center: Logo */}
              {!isMobileMenuOpen && (
                <div className="text-center flex-grow-1">
                  <Link to="/">
                    <img
                      src={suitAppLogo}
                      alt="SuitApp Logo"
                      style={{
                        height: "42px",
                        width: "auto",
                        objectFit: "contain",
                        cursor: "pointer",
                      }}
                    />
                  </Link>
                </div>
              )}



              {/* Right: User dropdown */}
              {!isMobileMenuOpen && (
                <div className="dropdown">
                  <button
                    className="btn p-0"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    style={{ background: "none", border: "none", color: "white" }}
                  >
                    <i className="bi bi-person-circle fs-5"></i>
                  </button>
                  <div className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                    <a href="/dashEmp" className="dropdown-item">Profile</a>
                    <a href="#" className="dropdown-item">Settings</a>
                    <a href="#" className="dropdown-item" onClick={handleLogout}>Logout</a>
                  </div>
                </div>
              )}
            </div>

            {/* Collapsible menu */}
            <div className={`navbar-collapse justify-content-start ${isMobileMenuOpen ? "show" : "collapse"}`} id="topNavbar">
              <ul className="navbar-nav mb-2 mb-lg-0 align-items-center me-auto">
                {/* Home */}
                <li className="nav-item">
                  <Link className="nav-link text-white fw-bold" to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                    <i className="bi bi-house-door me-1"></i> Home
                  </Link>
                </li>

                <li className="nav-item d-none d-lg-flex align-items-center px-2">
                  <div
                    style={{
                      height: "1.5rem",
                      borderLeft: "2px dotted rgba(255,255,255,0.6)"
                    }}
                  ></div>
                </li>

                {/* Operation - Always visible */}
                {showOperation && (
                  <>
                    <li className="nav-item">
                      <button
                        className={`nav-link btn ${activeMenu === 'master' ? 'active-menu' : ''}`}
                        type="button"
                        onClick={() => toggleActiveMenu('master')}
                        style={{
                          background: activeMenu === 'master' ? 'white' : 'none',
                          border: 'none',
                          color: activeMenu === 'master' ? 'black' : 'white',
                          borderRadius: activeMenu === 'master' ? '20px 20px 0 0' : '20px',
                          padding: '8px 16px',
                          marginBottom: activeMenu === 'master' ? '0' : '0',
                          fontWeight: 'bold',
                          transition: 'all 0.2s ease',
                          boxShadow: activeMenu === 'master' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                          transform: activeMenu === 'master' ? 'translateY(1px)' : 'none',
                          borderBottom: activeMenu === 'master' ? '3px solid #1541c4' : 'none'
                        }}
                      >
                        <i className="bi bi-sliders me-1"></i> Master Control
                      </button>
                    </li>

                    <li className="nav-item d-flex align-items-center px-2">
                      <div className="vr" style={{ height: "1.5rem", borderColor: "rgba(255,255,255,0.6)" }}></div>
                    </li>
                  </>
                )}
                <li className="nav-item d-none d-lg-flex align-items-center px-2">
                  <div
                    style={{
                      height: "1.5rem",
                      borderLeft: "2px dotted rgba(255,255,255,0.6)"
                    }}
                  ></div>
                </li>

                {/* Sales & Distribution
                <li className="nav-item">
                  <button
                    className={`nav-link btn ${activeMenu === 'sales' ? 'active-menu' : ''}`}
                    type="button"
                    onClick={() => toggleActiveMenu('sales')}
                    style={{
                      background: activeMenu === 'sales' ? 'white' : 'none',
                      border: 'none',
                      color: activeMenu === 'sales' ? 'black' : 'white',
                      borderRadius: activeMenu === 'sales' ? '20px 20px 0 0' : '20px',
                      padding: '8px 16px',
                      marginBottom: activeMenu === 'sales' ? '0' : '0',
                      fontWeight: 'bold',
                      transition: 'all 0.2s ease',
                      boxShadow: activeMenu === 'sales' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                      transform: activeMenu === 'sales' ? 'translateY(1px)' : 'none',
                      borderBottom: activeMenu === 'sales' ? '3px solid #2d4ba9' : 'none'
                    }}
                  >
                    <i className="bi bi-cart-check me-1"></i> Sales & Distribution
                  </button>
                </li> */}

                {/* Inventory
                {['1', '3', '4'].includes(userRoleId || "") && (
                  <li className="nav-item">
                    <button
                      className={`nav-link btn ${activeMenu === 'inventory' ? 'active-menu' : ''}`}
                      type="button"
                      onClick={() => toggleActiveMenu('inventory')}
                      style={{
                        background: activeMenu === 'inventory' ? 'white' : 'none',
                        border: 'none',
                        color: activeMenu === 'inventory' ? 'black' : 'white',
                        borderRadius: activeMenu === 'inventory' ? '20px 20px 0 0' : '20px',
                        padding: '8px 16px',
                        marginBottom: activeMenu === 'inventory' ? '0' : '0',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease',
                        boxShadow: activeMenu === 'inventory' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                        transform: activeMenu === 'inventory' ? 'translateY(1px)' : 'none',
                        borderBottom: activeMenu === 'inventory' ? '3px solid #2d4ba9' : 'none'
                      }}
                    >
                      <i className="bi bi-box-seam me-1"></i> Inventory
                    </button>
                  </li>
                )} */}

                {/* Accounts */}
                {
                  <li className="nav-item">
                    <button
                      className={`nav-link btn ${activeMenu === 'accounts' ? 'active-menu' : ''}`}
                      type="button"
                      onClick={() => toggleActiveMenu('accounts')}
                      style={{
                        background: activeMenu === 'accounts' ? 'white' : 'none',
                        border: 'none',
                        color: activeMenu === 'accounts' ? 'black' : 'white',
                        borderRadius: activeMenu === 'accounts' ? '20px 20px 0 0' : '20px',
                        padding: '8px 16px',
                        marginBottom: activeMenu === 'accounts' ? '0' : '0',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease',
                        boxShadow: activeMenu === 'accounts' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                        transform: activeMenu === 'accounts' ? 'translateY(1px)' : 'none',
                        borderBottom: activeMenu === 'accounts' ? '3px solid #2d4ba9' : 'none'
                      }}
                    >
                      <i className="bi bi-cash-stack me-1"></i> Accounts
                    </button>
                  </li>
                }

                {/* Finance */}
                {
                  <li className="nav-item">
                    <button
                      className={`nav-link btn ${activeMenu === 'finance' ? 'active-menu' : ''}`}
                      type="button"
                      onClick={() => toggleActiveMenu('finance')}
                      style={{
                        background: activeMenu === 'finance' ? 'white' : 'none',
                        border: 'none',
                        color: activeMenu === 'finance' ? 'black' : 'white',
                        borderRadius: activeMenu === 'finance' ? '20px 20px 0 0' : '20px',
                        padding: '8px 16px',
                        marginBottom: activeMenu === 'finance' ? '0' : '0',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease',
                        boxShadow: activeMenu === 'finance' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                        transform: activeMenu === 'finance' ? 'translateY(1px)' : 'none',
                        borderBottom: activeMenu === 'finance' ? '3px solid #2d4ba9' : 'none'
                      }}
                    >
                      <i className="bi bi-piggy-bank me-1"></i> Finance
                    </button>
                  </li>
                }

                {/* Masters */}
                {
                  <li className="nav-item">
                    <button
                      className={`nav-link btn ${activeMenu === 'masters' ? 'active-menu' : ''}`}
                      type="button"
                      onClick={() => toggleActiveMenu('masters')}
                      style={{
                        background: activeMenu === 'masters' ? 'white' : 'none',
                        border: 'none',
                        color: activeMenu === 'masters' ? 'black' : 'white',
                        borderRadius: activeMenu === 'masters' ? '20px 20px 0 0' : '20px',
                        padding: '8px 16px',
                        marginBottom: activeMenu === 'masters' ? '0' : '0',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease',
                        boxShadow: activeMenu === 'masters' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                        transform: activeMenu === 'masters' ? 'translateY(1px)' : 'none',
                        borderBottom: activeMenu === 'masters' ? '3px solid #2d4ba9' : 'none'
                      }}
                    >
                      <i className="bi bi-list-ul me-1"></i> Masters
                    </button>
                  </li>
                }

                {/* Production */}
                {/* {['1', '3', '4'].includes(userRoleId || "") && (
                  <li className="nav-item">
                    <button
                      className={`nav-link btn ${activeMenu === 'Production' ? 'active-menu' : ''}`}
                      type="button"
                      onClick={() => toggleActiveMenu('Production')}
                      style={{
                        background: activeMenu === 'Production' ? 'white' : 'none',
                        border: 'none',
                        color: activeMenu === 'Production' ? 'black' : 'white',
                        borderRadius: activeMenu === 'Production' ? '20px 20px 0 0' : '20px',
                        padding: '8px 16px',
                        marginBottom: activeMenu === 'Production' ? '0' : '0',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease',
                        boxShadow: activeMenu === 'Production' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                        transform: activeMenu === 'Production' ? 'translateY(1px)' : 'none',
                        borderBottom: activeMenu === 'Production' ? '3px solid #2d4ba9' : 'none'
                      }}
                    >
                      <i className="bi bi-box-seam me-1"></i> Production
                    </button>
                  </li>
                )} */}

                {/*
                <li className="nav-item">
                  <button
                    className={`nav-link btn ${activeMenu === 'employeeTrip' ? 'active-menu' : ''}`}
                    type="button"
                    onClick={() => {
                      toggleActiveMenu('employeeTrip');
                      setIsMobileMenuOpen(false);
                      setTimeout(() => navigate('/EmpView'), 50);
                    }}
                    style={{
                      background: activeMenu === 'employeeTrip' ? '#ffffff' : 'transparent',
                      border: 'none',
                      color: activeMenu === 'employeeTrip' ? '#2d4ba9' : '#ffffff',
                      borderRadius: activeMenu === 'employeeTrip' ? '20px 20px 0 0' : '20px',
                      padding: '8px 16px',
                      fontWeight: 'bold',
                      transition: 'all 0.2s ease',
                      boxShadow: activeMenu === 'employeeTrip' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                      transform: activeMenu === 'employeeTrip' ? 'translateY(1px)' : 'none',
                      borderBottom: activeMenu === 'employeeTrip' ? '3px solid #2d4ba9' : 'none'
                    }}
                  >
                    <i className="bi bi-person-walking me-1"></i> Employee Trip
                  </button>
                </li>
                */}

                {['1', '3', '4'].includes(userRoleId || "") && (
                  <li className="nav-item">
                    <button
                      className={`nav-link btn ${activeMenu === 'propertyManagement' ? 'active-menu' : ''}`}
                      type="button"
                      onClick={() => {
                        toggleActiveMenu('propertyManagement');
                        setIsMobileMenuOpen(false);

                        setTimeout(() => {
                          navigate('/PropertyManagement');
                        }, 50);
                      }}
                      style={{
                        background: activeMenu === 'propertyManagement' ? '#ffffff' : 'transparent',
                        border: 'none',
                        color: activeMenu === 'propertyManagement' ? '#2d4ba9' : '#ffffff',
                        borderRadius: activeMenu === 'propertyManagement' ? '20px 20px 0 0' : '20px',
                        padding: '8px 16px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease',
                        boxShadow: activeMenu === 'propertyManagement'
                          ? '0 2px 8px rgba(0,0,0,0.15)'
                          : 'none',
                        transform: activeMenu === 'propertyManagement'
                          ? 'translateY(1px)'
                          : 'none',
                        borderBottom: activeMenu === 'propertyManagement'
                          ? '3px solid #2d4ba9'
                          : 'none'
                      }}
                    >
                      <i className="bi bi-building me-1"></i> Property Management
                    </button>
                  </li>
                )}


                {/* User Permission */}
                {['1', '3', '4'].includes(userRoleId || "") && (
                  <li className="nav-item">
                    <button
                      className={`nav-link btn ${activeMenu === 'userPermission' ? 'active-menu' : ''}`}
                      type="button"
                      onClick={() => {
                        toggleActiveMenu('userPermission');
                        setIsMobileMenuOpen(false);

                        setTimeout(() => {
                          navigate('/UserPermission');
                        }, 50);
                      }}
                      style={{
                        background: activeMenu === 'userPermission' ? '#ffffff' : 'transparent',
                        border: 'none',
                        color: activeMenu === 'userPermission' ? '#2d4ba9' : '#ffffff',
                        borderRadius: activeMenu === 'userPermission' ? '20px 20px 0 0' : '20px',
                        padding: '8px 16px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease',
                        boxShadow: activeMenu === 'userPermission' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                        transform: activeMenu === 'userPermission' ? 'translateY(1px)' : 'none',
                        borderBottom: activeMenu === 'userPermission' ? '3px solid #2d4ba9' : 'none'
                      }}
                    >
                      <i className="bi bi-shield-lock me-1"></i> User Permission
                    </button>
                  </li>


                )}
                {/* Document Expiry */}
                {
                  <li className="nav-item">
                    <button
                      className={`nav-link btn ${activeMenu === 'documentExpiry' ? 'active-menu' : ''}`}
                      type="button"
                      onClick={() => {
                        toggleActiveMenu('documentExpiry');
                        setIsMobileMenuOpen(false);

                        setTimeout(() => {
                          navigate('/DocumentExpiry');
                        }, 50);
                      }}
                      style={{
                        background: activeMenu === 'documentExpiry' ? '#ffffff' : 'transparent',
                        border: 'none',
                        color: activeMenu === 'documentExpiry' ? '#2d4ba9' : '#ffffff',
                        borderRadius: activeMenu === 'documentExpiry' ? '20px 20px 0 0' : '20px',
                        padding: '8px 16px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease',
                        boxShadow: activeMenu === 'documentExpiry' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                        transform: activeMenu === 'documentExpiry' ? 'translateY(1px)' : 'none',
                        borderBottom: activeMenu === 'documentExpiry' ? '3px solid #2d4ba9' : 'none'
                      }}
                    >
                      <i className="bi bi-file-earmark-excel me-1"></i> Document Expiry
                    </button>
                  </li>
                }

              </ul>

            </div>
          </div>
        </div>
      </nav>


      {/* Secondary white navbar for desktop - Merged with main navbar */}
      {activeMenu && window.innerWidth >= 992 && (
        <nav className="navbar navbar-expand-lg bg-white shadow-sm" style={{
          padding: '0',
          marginTop: '-8px',
          minHeight: '36px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          position: 'relative',
          zIndex: 1,
          borderTopLeftRadius: '0',
          borderTopRightRadius: '0',
          borderTop: '2px solid #2d4ba9'
        }}>
          <div className="container-fluid px-3">
            <ul className="navbar-nav" style={{ padding: '0' }}>
              {activeMenu === 'master' && (
                <>
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/CompanyInfo"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-building me-1"></i> Company Info
                    </Link>
                  </li>
                  {/* <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/BranchMasterpage"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-building me-1"></i> Branch Master
                    </Link>
                  </li> */}

                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/Userinfo"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-building me-1"></i> Rental Management
                    </Link>
                  </li>
                  {/* <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/VehicleMaster"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-building me-1"></i> Vehicle Master
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/VehicleTypeMaster"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-building me-1"></i> Vehicle Type Master
                    </Link>
                  </li> */}

                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/VehicleExpenseTypeMaster"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-building me-1"></i> Expense Type Master
                    </Link>
                  </li>
                  {/* <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/RootMaster"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null); 
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    > 
                      <i className="bi bi-building me-1"></i> Root Master
                    </Link>
                  </li>  */}

                  {/* <li className="nav-item">
                    <Link 
                      className="nav-link text-dark"
                      to="/BeatAllocate"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    > 
                      <i className="bi bi-building me-1"></i> Beat Allocation
                    </Link>
                  </li>  */}

                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/Supplier"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-building me-1"></i> Supplier
                    </Link>
                  </li>

                  {/*
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/Customer"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{ padding: '4px 16px', fontSize: '0.9rem' }}
                    >
                      <i className="bi bi-building me-1"></i> Client
                    </Link>
                  </li>

                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/Camp"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{ padding: '4px 16px', fontSize: '0.9rem' }}
                    >
                      <i className="bi bi-building me-1"></i>Camp
                    </Link>
                  </li>

                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/ProjectCost"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{ padding: '4px 16px', fontSize: '0.9rem' }}
                    >
                      <i className="bi bi-building me-1"></i>Project Cost
                    </Link>
                  </li>
                  */}

                  {/* <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/AttendanceDashboard"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-building me-1"></i> Attendance Dashboard
                    </Link>
                  </li> */}


                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/TaskManagement"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-building me-1"></i> Task Management
                    </Link>
                  </li>
                </>
              )}

              {activeMenu === 'sales' && (
                <>
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/Tabsale"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-receipt me-1"></i> Sale Report
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/OrderReport"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-bag-check me-1"></i> Order Report
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/ReceiptReport"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-cash-coin me-1"></i> Receipt
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/VanSaleSummary"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-truck me-1"></i> VanSale Summary
                    </Link>
                  </li>


                </>
              )}

              {activeMenu === 'inventory' && (
                <>
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/OpeningStockReport"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-archive me-1"></i> Opening Stock
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/TabPurchase"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-basket me-1"></i> Purchase
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/TabProduction"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-hammer me-1"></i> Production
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/balancestock"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-house-door me-1"></i> GoDown Stock
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/DamageReport"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-exclamation-triangle me-1"></i> Damage Report
                    </Link>
                  </li>

                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/StockValue"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-list-check me-1"></i> Stock Value
                    </Link>
                  </li>




                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/StockReport"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-list-check me-1"></i> Stock Report
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/TabVanload"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-truck me-1"></i> Van Load
                    </Link>
                  </li>

                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/Dailysummarypage"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-truck me-1"></i> Dailysummary
                    </Link>
                  </li>
                </>
              )}

              {activeMenu === 'accounts' && (
                <>
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/PaymentReport"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-credit-card me-1"></i> Payment
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/JournalReport"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-journal-text me-1"></i> Journal
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/Creditnotepage"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-person-up me-1"></i> CreditNote Report
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/DebitnoteReportpage"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-person-up me-1"></i> DebitNote Report
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/OpeningVoucherReportpage"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-person-up me-1"></i> OpeningVoucher Report
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/ContraReportpage"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-person-up me-1"></i> Contra Report
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/BankReport"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-credit-card me-1"></i> Bank
                    </Link>
                  </li>
                </>
              )}

              {activeMenu === 'finance' && (
                <>
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/ProfitReport"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-cash-coin me-1"></i> Profit
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/DebitorsReport"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-person-down me-1"></i> Debitors
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/CreditorsReport"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-person-up me-1"></i> Creditors
                    </Link>
                  </li>

                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/CustomerLedger"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-person-up me-1"></i> Client Ledger
                    </Link>
                  </li>


                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/PandLReport"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-person-up me-1"></i> P&L Report
                    </Link>
                  </li>



                  {/* <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/AllPartyLedger"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-person-up me-1"></i> All PartyLedger
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/LedgerTrans"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-people me-1"></i>  PartyLedger
                    </Link>
                  </li> */}
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/LedgerAll"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-journal me-1"></i> Ledger
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/trailbalance"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-table me-1"></i> Trial Balance
                    </Link>
                  </li>

                </>
              )}

              {activeMenu === 'masters' && (
                <>
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/CustomerDetailsReport"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-person-badge me-1"></i> Client Details
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/UnitMaster"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-person-badge me-1"></i> Project Master
                    </Link>
                  </li>

                  {/* <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/UnitMasterTest"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-person-badge me-1"></i> Unit Master Test
                    </Link>
                  </li> */}

                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/TaxMaster"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-building me-1"></i> Tax Master
                    </Link>
                  </li>
                  {/* <li className="nav-item">   
                    <Link    
                      className="nav-link text-dark"
                      to="/BatchMaster"
                      onClick={() => {
                        setIsMobileMenuOpen(false);   
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    > 
                      <i className="bi bi-building me-1"></i> Batch Master
                    </Link>
                  </li>  */}

                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/AccountMaster"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >

                      <i className="bi bi-building me-1"></i> Ac Group
                    </Link>
                  </li>

                  {/* <li className="nav-item">   
                    <Link    
                      className="nav-link text-dark"
                      to="/CategoryMaster"
                      onClick={() => {
                        setIsMobileMenuOpen(false);   
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    > 
                      <i className="bi bi-building me-1"></i> Category Master
                    </Link>
                  </li>  */}
                  {/* <li className="nav-item">   
                    <Link    
                      className="nav-link text-dark"
                      to="/EmployeeAllocation"
                      onClick={() => {
                        setIsMobileMenuOpen(false);   
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    > 
                      <i className="bi bi-building me-1"></i> Employee Allocation
                    </Link>
                  </li>  */}
                  {/* <li className="nav-item">   
                    <Link    
                      className="nav-link text-dark"
                      to="/InvoiceMaster"
                      onClick={() => {
                        setIsMobileMenuOpen(false);   
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    > 
                      <i className="bi bi-building me-1"></i> Invoice Master
                    </Link>
                  </li>  */}
                  {/* <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/Importbill"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-person-badge me-1"></i> Import Excel Bills
                    </Link>
                  </li> */}

                  {/* <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/QcMasterpage"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-shield-check me-1"></i>QcMaster
                    </Link>
                  </li> */}

                  {/* <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/LeadEnquriypage"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-chat-dots me-1"></i>Enquiry
                    </Link>
                  </li> */}

                </>
              )}


              {activeMenu === 'Production' && (
                <>

                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/TabProduction"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-hammer me-1"></i> Production Report
                    </Link>
                  </li>


                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/ProductionAlloc"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-clipboard-check me-1"></i>JobCard
                    </Link>
                  </li>

                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/ProductionCrud"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-person-badge me-1"></i>Production
                    </Link>
                  </li>

                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/QualityCheck"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-person-badge me-1"></i> Quality Check
                    </Link>
                  </li>

                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/Ingredientpage"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-person-badge me-1"></i> Ingredient Master
                    </Link>
                  </li>

                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/Byproductspage"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-person-badge me-1"></i>Byproducts
                    </Link>
                  </li>

                </>
              )}
            </ul>
          </div>
        </nav>
      )}

      {/* Mobile dropdown menus */}
      {activeMenu && window.innerWidth < 992 && (
        <div className="mobile-dropdown-menu" style={{
          backgroundColor: '#f8f9fa',
          padding: '0.5rem 1rem',
          borderTop: '1px solid #dee2e6'
        }}>
          {activeMenu === 'master' && (
            <ul className="list-unstyled mb-0">
              <li>
                <Link
                  className="dropdown-item"
                  to="/CompanyInfo"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-building me-2"></i> Company Info
                </Link>
              </li>

              <li>
                <Link
                  className="dropdown-item"
                  to="/Userinfo"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-building me-2"></i> User Info
                </Link>
              </li>
              {/* <li>
                <Link
                  className="dropdown-item"
                  to="/BranchMaster"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-building me-2"></i> Branch Master
                </Link>
              </li> */}

              {/* <li>
                <Link
                  className="dropdown-item"
                  to="/VehicleMaster"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-building me-2"></i> Vehicle Master
                </Link>
              </li> */}

              {/* <li>
                <Link
                  className="dropdown-item"
                  to="/RootMaster"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-building me-2"></i> Root Master
                </Link>
              </li> */}



              {/* <li>
                <Link
                  className="dropdown-item"
                  to="/BeatAllocate"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-building me-2"></i> Beat Allocation
                </Link>
              </li> */}

              <li>
                <Link
                  className="dropdown-item"
                  to="/Supplier"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-building me-2"></i> Supplier
                </Link>
              </li>

              {/*
              <li>
                <Link
                  className="dropdown-item"
                  to="/Customer"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-building me-2"></i> Customer
                </Link>
              </li>
              */}

            </ul>



          )}

          {activeMenu === 'sales' && (
            <ul className="list-unstyled mb-0">
              <li>
                <Link
                  className="dropdown-item"
                  to="/Tabsale"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-receipt me-2"></i> Sale Report
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item"
                  to="/OrderReport"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-bag-check me-2"></i> Order Report
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item"
                  to="/ReceiptReport"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-cash-coin me-2"></i> Receipt
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item"
                  to="/VanSaleSummary"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-truck me-2"></i> VanSale Summary
                </Link>
              </li>

            </ul>
          )}

          {activeMenu === 'inventory' && (
            <ul className="list-unstyled mb-0">
              <li>
                <Link
                  className="dropdown-item"
                  to="/ItemWisePurchaseReport"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-archive me-2"></i> Opening Stock
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item"
                  to="/TabPurchase"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-basket me-2"></i> Purchase
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item"
                  to="/Production"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-hammer me-2"></i> Production
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item"
                  to="/balancestock"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-house-door me-2"></i> GoDown Stock
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item"
                  to="/DamageReport"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-exclamation-triangle me-2"></i> Damage Report
                </Link>
              </li>

              <li>
                <Link
                  className="dropdown-item"
                  to="/StockValue"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-list-check me-2"></i> Stock Value
                </Link>
              </li>

              <li>
                <Link
                  className="dropdown-item"
                  to="/StockReport"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-list-check me-2"></i> Stock Report
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item"
                  to="/TabVanload"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-truck me-2"></i> Van Load
                </Link>

              </li>
              <li>
                <Link
                  className="nav-link text-dark"
                  to="/Dailysummarypage"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{
                    padding: '4px 16px',
                    fontSize: '0.9rem'
                  }}
                >
                  <i className="bi bi-truck me-1"></i> Dailysummary
                </Link>
              </li>
            </ul>
          )}

          {activeMenu === 'accounts' && (
            <ul className="list-unstyled mb-0">
              <li>
                <Link
                  className="dropdown-item"
                  to="/PaymentReport"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-credit-card me-2"></i> Payment
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item"
                  to="/JournalReport"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-journal-text me-2"></i> Journal
                </Link>
              </li>
            </ul>
          )}

          {activeMenu === 'finance' && (
            <ul className="list-unstyled mb-0">
              <li>
                <Link
                  className="dropdown-item"
                  to="/ProfitReport"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-cash-coin me-2"></i> Profit
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item"
                  to="/DebitorsReport"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-person-down me-2"></i> Debitors
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item"
                  to="/CreditorsReport"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-person-up me-2"></i> Creditors
                </Link>
              </li>

              <li>
                <Link
                  className="dropdown-item"
                  to="/CustomerLedger"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-person-up me-2"></i> Client Ledger
                </Link>
              </li>

              <li>
                <Link
                  className="dropdown-item"
                  to="/PandLReport"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-person-up me-2"></i> P&L Report
                </Link>
              </li>

              {/* <li>
                <Link
                  className="dropdown-item"
                  to="/AllPartyLedger"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-person-up me-2"></i> All PartyLedger
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item"
                  to="/LedgerTrans"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-people me-2"></i>  Party Ledger
                </Link>
              </li> */}
              <li>
                <Link
                  className="dropdown-item"
                  to="/LedgerAll"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-journal me-2"></i> Ledger
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item"
                  to="/trailbalance"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-table me-2"></i> Trial Balance
                </Link>
              </li>
            </ul>
          )}

          {activeMenu === 'masters' && (
            <ul className="list-unstyled mb-0">
              <li>
                <Link
                  className="dropdown-item"
                  to="/CustomerDetailsReport"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-person-badge me-2"></i> Client Details
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item"
                  to="/UnitMaster"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-person-badge me-2"></i> Project Master
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item"
                  to="/TaxMaster"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-person-badge me-2"></i> Tax Master
                </Link>
              </li>

              <li>
                <Link
                  className="dropdown-item"
                  to="/BatchMaster"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-person-badge me-2"></i> Batch Master
                </Link>
              </li>
              {/* <li>
                <Link
                  className="dropdown-item"
                  to="/CategoryMaster"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-person-badge me-2"></i> Category Master
                </Link>
              </li> */}
              {/* <li>
                <Link
                  className="dropdown-item"
                  to="/InvoiceMaster"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-person-badge me-2"></i> Invoice Master
                </Link>
              </li> */}
              {/* <li>
                <Link
                  className="dropdown-item"
                  to="/EmployeeAllocation"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-person-badge me-2"></i> Employee Allocation
                </Link>
              </li> */}
              <li className="nav-item">
                <Link
                  className="nav-link text-dark"
                  to="/ProductionAlloc"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{
                    padding: '4px 16px',
                    fontSize: '0.9rem'
                  }}
                >
                  <i className="bi bi-clipboard-check me-1"></i>JobCard
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  className="nav-link text-dark"
                  to="/QcMasterpage"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{
                    padding: '4px 16px',
                    fontSize: '0.9rem'
                  }}
                >
                  <i className="bi bi-shield-check me-1"></i>QcMaster
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  className="nav-link text-dark"
                  to="/LeadEnquriypage"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveMenu(null);
                  }}
                  style={{
                    padding: '4px 16px',
                    fontSize: '0.9rem'
                  }}
                >
                  <i className="bi bi-chat-dots me-1"></i>Enquiry
                </Link>
              </li>
            </ul>
          )}

          {/* {activeMenu === 'Production' && (
            <>
               <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/TabProduction"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-hammer me-1"></i> Production Report
                    </Link>
                  </li>


                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/ProductionAlloc"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-clipboard-check me-1"></i>JobCard
                    </Link>
                  </li>

                

                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/ProductionCrud"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-person-badge me-1"></i>Production
                    </Link>
                  </li>

                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/QualityCheck"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-person-badge me-1"></i> Quality Check
                    </Link>
                  </li>

                    <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/Ingredientpage"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-person-badge me-1"></i> Ingredient Master
                    </Link>
                  </li>

                  <li className="nav-item">
                    <Link
                      className="nav-link text-dark"
                      to="/Byproductspage"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveMenu(null);
                      }}
                      style={{
                        padding: '4px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-person-badge me-1"></i>Byproducts
                    </Link>
                  </li>

            </>
          )} */}
        </div>
      )}
    </>
  );
};

export default Sidebar;