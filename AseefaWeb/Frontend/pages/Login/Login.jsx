import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../apiService";
import loginhead from "../../src/assets/suitapps_logo_hq.png";
import backgroundImage from "../../src/assets/SUITAPPS.png";

import { getVersion } from "../apiService"; // Import version function


const Login = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginImage1, setloginImage1] = useState(loginhead);
  const [bgImage1, setbgImage1] = useState(backgroundImage);
  const navigate = useNavigate();

  const toggleShowPassword = () => setShowPassword(!showPassword);

  useEffect(() => {
    fetchCompanies();
    loadImagesFromLocalStorage();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await api.get("/api/companies");
      const data = response.data;

      if (data && Array.isArray(data.data)) {
        setCompanies(data.data);
        if (data.data.length > 0) {
          setSelectedCompany(data.data[0].CompanyId);
        }
      } else {
        throw new Error("Invalid data format received from the server.");
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      setErrorMessage("Failed to load company data.");
    }
  };

  const setImagesToLocalStorage = (loginImg1, bgImg1) => {
    if (loginImg1) localStorage.setItem("loginImage1", loginImg1);
    if (bgImg1) localStorage.setItem("bgImage1", bgImg1);
  };


  const loadImagesFromLocalStorage = () => {
    const storedloginImage1 = localStorage.getItem("loginImage1") || loginhead;
    const storedbgImage1 = localStorage.getItem("bgImage1") || backgroundImage;

    setloginImage1(storedloginImage1);
    setbgImage1(storedbgImage1);
  };

  useEffect(() => {
    // Example: save default images on first load (optional)
    if (!localStorage.getItem("loginImage1")) {
      setImagesToLocalStorage(loginhead, backgroundImage);
    }

    loadImagesFromLocalStorage();
  }, []);



  const handleCompanyChange = (e) => setSelectedCompany(e.target.value);


  // Fetch user IP address using external API
  const getUserIP = async () => {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      return data.ip || "Unknown";
    } catch (err) {
      console.error("Failed to get IP address:", err);
      return "Unknown";
    }
  };

  // Simple random session ID generator
  const generateSessionID = () => {
    return 'sess_' + Math.random().toString(36).substr(2, 9);
  };


  const getPlaceNameFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      );
      const data = await response.json();
      return data.display_name || `${latitude},${longitude}`;
    } catch (error) {
      console.warn("Reverse geocoding failed:", error);
      return `${latitude},${longitude}`; // fallback
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const username = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!username || !password) {
      setErrorMessage("Username and Password are required.");
      return;
    }   

    try {
      const response = await api.post(
        "/api/login",
        {
          CompanyID: selectedCompany,
          Username: username,
          Password: password,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = response.data;
      console.log("Login response data:", data);
      if (data.success) {

        sessionStorage.setItem("UserId", data.UserId);
        sessionStorage.setItem("CompanyID", data.CompanyID);
        sessionStorage.setItem("UserRoleId", data.UserRoleId);
        sessionStorage.setItem("AllocatedUser", data.AllocatedUser);
        sessionStorage.setItem("BranchId", data.BranchId);
        sessionStorage.setItem("ZoneId", data.ZoneId);

        const userRoleId = parseInt(data.UserRoleId);
let activeUserId = [];
const params = { CompanyID: data.CompanyID };

try {

  // Admin → All Users
  if (userRoleId === 1) {
    const res = await api.get("/api/activeUserId", { params });
    activeUserId = res.data.map((item) => item.UserId);
  }

  // Self Roles
  else if ([2, 8, 13, 14].includes(userRoleId)) {
    activeUserId = [data.UserId];
  }

  // Zone Roles
  else if ([3, 5, 10, 11, 12].includes(userRoleId)) {
    params.ZoneId = data.ZoneId;
    const res = await api.get("/api/activeUserId", { params });
    activeUserId = res.data.map((item) => item.UserId);
  }

  // Branch Roles
  else if ([4, 6, 7, 9].includes(userRoleId)) {
    params.BranchId = data.BranchId;
    const res = await api.get("/api/activeUserId", { params });
    activeUserId = res.data.map((item) => item.UserId);
  }

} catch (err) {
  console.error("Error fetching activeUserId:", err);
  activeUserId = [];
}
        

        // Convert array to comma-separated string and store in sessionStorage
        const activeUserIdString = activeUserId.join(",");
        sessionStorage.setItem("activeUserId", activeUserIdString);

        navigate("/dashboard");



        // --- Insert login log with geolocation ---
        try {
          const ip = await getUserIP();
          const sessionId = generateSessionID();

          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const geo = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };

              const placeName = await getPlaceNameFromCoordinates(geo.latitude, geo.longitude);

              await api.post("/api/insertLoginLog", {
                EmployeeCode: data.UserId,
                UserRoleId: userRoleId,
                EmployeeName: data.Name || "Unknown",
                LoginUserName: username,
                IPAddress: ip,
                LoginStatus: true,
                UserAgent: navigator.userAgent,
                LoginMethod: "Password",
                SessionID: sessionId,
                GeoLocation: geo,
                GeoPlace: placeName, // 👈 Now passing place name
              });

            },
            async (error) => {
              console.warn("Geolocation not available or denied:", error);
              await api.post("/api/insertLoginLog", {
                EmployeeCode: data.UserId,
                UserRoleId: userRoleId,
                EmployeeName: data.Name || "Unknown",
                LoginUserName: username,
                IPAddress: ip,
                LoginStatus: true,
                UserAgent: navigator.userAgent,
                LoginMethod: "Password",
                SessionID: sessionId,
                GeoLocation: null,
                GeoPlace: null,
              });

            },
            { timeout: 5000 }
          );

        } catch (logError) {
          console.error("Login log insertion failed:", logError);
        }
      } else {
        setErrorMessage(data.error || "Invalid company or password.");
      }
    } catch (error) {
      console.error("Login error:", error);
      const message =
        error.response && error.response.status === 401
          ? "Invalid credentials for Username or Password."
          : "An unexpected error occurred.";
      setErrorMessage(message);
    }
  };




  const renderCompanyOptions = () =>
    companies.map((company) => (
      <option key={company.CompanyId} value={company.CompanyId}>
        {company.CompanyName}
      </option>
    ));

  return (
    <section
      className="vh-100 w-100"
      style={{
        backgroundImage: `url(${bgImage1})`,
        backgroundSize: "cover",
        backgroundPosition:" center",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="container h-100">
        <div className="row d-flex justify-content-center align-items-center h-100">
          <div className="col-md-6 col-lg-5">
            <div
              className="card shadow-lg"
              style={{
                borderRadius: "1rem",
                backgroundColor: "rgba(120, 164, 203, 0.2)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div className="card-body p-5 text-black relative">
                <form onSubmit={handleSubmit}>
                  {/* Logo */}
                  <div className="mb-3 text-center">
                    <img
                      src={loginhead}
                      alt="Login"
                      className="img-fluid"
                      style={{
                        maxWidth: "100%",
                        objectFit: "contain",
                        height: "150px",
                      }}
                    />
                  </div>

                  {/* Username */}
                  <div className="form-outline mb-3">
                    <label htmlFor="loginEmail" className="form-label">
                      Username
                    </label>
                    <input
                      type="text"
                      id="loginEmail"
                      placeholder="Enter your username"
                      className="form-control"
                      style={{ borderRadius: "1rem" }}
                    />
                  </div>

                  {/* Password with show/hide toggle */}
                  <div className="form-outline mb-3">
                    <label htmlFor="loginPassword" className="form-label">
                      Password
                    </label>
                    <div className="input-group">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="loginPassword"
                        placeholder="Enter your password"
                        className="form-control"
                        style={{ borderRadius: "1rem 0 0 1rem" }}
                      />
                      <button
                        type="button"
                        className="btn"
                        style={{
                          borderRadius: "0 1rem 1rem 0",
                          backgroundColor: "white",
                          border: "none",
                        }}
                        onClick={toggleShowPassword}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  {/* Company dropdown */}
                  <div className="form-outline mb-3">
                    <label htmlFor="companyDropdown" className="form-label">
                      Select Company
                    </label>
                    <select
                      id="companyDropdown"
                      className="form-control"
                      value={selectedCompany}
                      onChange={handleCompanyChange}
                      style={{ borderRadius: "1rem" }}
                    >
                      <option value="">Select Company</option>
                      {renderCompanyOptions()}
                    </select>
                  </div>

                  {/* Submit button */}
                  <div className="d-flex justify-content-center mt-3">
                    <button type="submit" className="btn btn-dark btn-md">
                      Login
                    </button>
                  </div>

                  {/* Error message */}
                  {errorMessage && (
                    <p className="text-danger mt-3 text-center">{errorMessage}</p>
                  )}
                </form>

                {/* Version info fixed to bottom right of the screen */}
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
                  <p
                    className="text-gray-500 text-xs cursor-pointer hover:text-gray-700 transition-colors duration-200 text-center"
                    onClick={() => navigate("/Versionlog")}
                  >
                    {getVersion()}
                  </p>
                </div>


              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
