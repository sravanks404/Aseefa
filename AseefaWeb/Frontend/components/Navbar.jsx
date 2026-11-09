import  { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import api from "../pages/apiService";
import moment from "moment";
import suitAppLogo from "../src/assets/newlogo.jpeg"; // ✅ Update the path to your new logo
import { Link } from "react-router-dom"; // ✅ Add this import if not already present


const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [financial, setFinancial] = useState(null);
  const [error, setError] = useState(null);


  const bufferToBase64 = (bufferObj) => {
    if (!bufferObj?.data) return null;
    const binary = new Uint8Array(bufferObj.data).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ""
    );
    return btoa(binary);
  };

  // ⏱️ Load cached data first (fast render)
  useEffect(() => {
    const UserId = sessionStorage.getItem("UserId");
    const CompanyID = sessionStorage.getItem("CompanyID");

    const safeParse = (k) => { try { const v = sessionStorage.getItem(k); return (v && v !== "undefined") ? JSON.parse(v) : null; } catch { return null; } };
    const userData = safeParse("userResponse");
    const companyData = safeParse("companyResponse");
    const financialData = safeParse("financialResponse");

    setUser(userData);
    setCompany(companyData);
    setFinancial(financialData);

    // 🔁 Fetch only fresh images (and store them)
    const fetchImages = async () => {
      try {
        const [userRes, companyRes] = await Promise.all([
          api.get(`/api/getUserbyid?UserId=${UserId}`),
          api.get(`/api/getcompanynav?CompanyID=${CompanyID}`)
        ]);

        const freshUser = userRes.data[0];
        const freshCompany = companyRes.data[0];

        const freshUserImage = bufferToBase64(freshUser?.IMAGE);
        const freshCompanyLogo = bufferToBase64(freshCompany?.CompanyLogo);

        if (freshUserImage) {
          setUser((prev) => ({ ...prev, IMAGE: freshUserImage }));
        }
        if (freshCompanyLogo) {
          setCompany((prev) => ({ ...prev, CompanyLogo: freshCompanyLogo }));
        }

        // Optional: cache user and company details if not already cached
        if (!userData && freshUser) {
          sessionStorage.setItem("userResponse", JSON.stringify(freshUser));
          setUser(freshUser);
        }
        if (!companyData && freshCompany) {
          sessionStorage.setItem("companyResponse", JSON.stringify(freshCompany));
          setCompany(freshCompany);
        }

        // Load financial only if not already present
        if (!financialData) {
          const finRes = await api.get(`/api/getfinancialbyid?CompanyID=${CompanyID}`);
          const finData = finRes.data[0] || null;
          if (finData) {
            setFinancial(finData);
            sessionStorage.setItem("financialResponse", JSON.stringify(finData));
          }
        }

      } catch (err) {
        setError("Failed to fetch images.");
      }
    };

    fetchImages();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await api.post("/api/logout", {}, {
        headers: { "Content-Type": "application/json" },
      });

      if (res.data.success) {
        sessionStorage.clear();
        navigate("/");
      } else {
        console.error("Logout failed");
      }
    } catch (err) {
      console.error("Error during logout:", err);
    }
  };

  if (error) return <p>{error}</p>;

  return (
    <header className="navbar navbar-expand-md d-none d-lg-flex d-print-none bg-white">
      <div className="container-fluid d-flex align-items-center justify-content-between">

        {/* 🔽 Left: Company Info */}
        <div className="d-flex align-items-center lh-1 text-dark">
          <span
            className="avatar avatar-sm"
            style={{
              width: "40px",
              height: "40px",
              backgroundSize: "cover",
              backgroundImage: company?.CompanyLogo
                ? `url(data:image/jpeg;base64,${company.CompanyLogo})`
                : "none",
            }}
          />
          <div className="ps-2 text-start">
            <div className="fw-bold fs-4">{company?.CompanyName || "Unknown Company"}</div>
            <div className="mt-1 small text-secondary">
              {financial?.StartDate && financial?.EndDate ? (
                `From ${moment(financial.StartDate).format("DD-MM-YYYY")} To ${moment(financial.EndDate).format("DD-MM-YYYY")}`
              ) : (
                "No Financial Year Data"
              )}
            </div>
          </div>

        </div>

        {/* 🔽 Center: SuitApp Logo */}
        <div className="position-absolute start-50 translate-middle-x">
          <Link to="/">
            <img
              src={suitAppLogo}
              alt="SuitApp Logo"
              style={{ height: "100px", width: "auto", objectFit: "contain", cursor: "pointer" }}
            />
          </Link>
        </div>



        {/* 🔽 Right: User Info Dropdown */}
        <div className="nav-item dropdown">
          <a
            href="#"
            className="nav-link d-flex lh-1 text-reset p-0"
            data-bs-toggle="dropdown"
            aria-label="Open Emp menu"
          >
            <span
              className="avatar avatar-sm"
              style={{
                width: "40px",
                height: "40px",
                backgroundSize: "cover",
                backgroundImage: user?.IMAGE
                  ? `url(data:image/png;base64,${user.IMAGE})`
                  : "none",
              }}
            />
            <div className="d-none d-xl-block ps-2 text-dark text-start">
              <div>{user?.Name || "Unknown User"}</div>
              <div className="mt-1 small text-secondary">
                {user?.RoleName || "No Role Assigned"}
              </div>
            </div>
          </a>
          <div className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
            <a href="/dashEmp" className="dropdown-item">Profile</a>
            <a href="#" className="dropdown-item">Settings</a>
            <a href="#" className="dropdown-item" onClick={handleLogout}>Logout</a>
          </div>
        </div>

      </div>
    </header>
  );
};

export default Navbar;
