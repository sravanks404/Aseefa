import React, { useState, useEffect, useRef } from "react";
import api from '../../apiService';

function ZoneForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [isUpdateDisabled, setIsUpdateDisabled] = useState(false);
  const [isDeleteDisabled, setIsDeleteDisabled] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const tableRef = useRef(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [Zone, setZone] = useState({
    ZoneId: 0,
    ZoneName: "",
    Area: "",
    Country: "",
    State: "",
    CompanyID: "",
    CreatedBy: "",
  });
  const [ZoneData, setZoneData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      const CompanyID = sessionStorage.getItem("CompanyID"); // Retrieve CompanyID from sessionStorage

      if (!CompanyID) {
        console.error("CompanyID not found in sessionStorage");
        return;
      }

      const response = await api.get("/api/getZone", {
        params: { CompanyID }, // Pass CompanyID as a query parameter
      });

      const data = response.data.map((item) => ({
        ...item,
        ZoneId: item.ZoneId || 0,
        ZoneName: item.ZoneName || "",
        Area: item.Area || "",
        Country: item.Country || "",
        State: item.State || "",
        CreatedBy: item.CreatedBy || "",
      }));

      setZoneData(data);
      setIsSubmitDisabled(false);
      setIsUpdateDisabled(true);
      setIsDeleteDisabled(true);
    } catch (error) {
      console.error("Error fetching Zone data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Set the value first to allow typing
    setZone((prevZone) => ({
      ...prevZone,
      [name]: value,
    }));

    // Clear existing errors
    setError("");

    // Validate ZoneName
    if (name === "ZoneName") {
      const regex = /^[A-Za-z0-9\s]*$/;
      if (!regex.test(value)) {
        setError("Zone Name can only contain letters, numbers, and spaces.");
        return;
      }

      // Check for duplicate Zone names
      if (checkDuplicateZoneName(value)) {
        setError("Zone Name already exists.");
        return;
      }
    }

    // Validate Phoneno and Mobileno (only digits, length 10)
    if (name === "Phoneno" || name === "Mobileno") {
      const phoneRegex = /^\d{0,10}$/; // Allow up to 10 digits
      if (!phoneRegex.test(value)) {
        setError(`${name} must be a valid 10-digit number.`);
        return;
      }
    }

    // Validate Pincode (only digits, length 6)
    if (name === "Pincode") {
      const pincodeRegex = /^\d{0,6}$/; // Allow up to 6 digits
      if (!pincodeRegex.test(value)) {
        setError("Pincode must be a valid 6-digit number.");
        return;
      }
    }
  };

  const checkDuplicateZoneName = (ZoneName, currentZoneId = null) => {
    return ZoneData.some((Zone) => {
        // Convert both to lowercase for case-insensitive comparison
        const isSameName = Zone.ZoneName.toLowerCase() === ZoneName.toLowerCase();

        if (currentZoneId) {
            // During update, exclude the current Zone itself
            return isSameName && Zone.ZoneId !== currentZoneId;
        } else {
            // During create (submit), just check for any match
            return isSameName;
        }
    });
};


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (checkDuplicateZoneName(Zone.ZoneName)) {
      setError("Zone Name already exists. Please choose a different name.");
      return;
  }
    
    // Retrieve and parse as integers
    const CompanyID = parseInt(sessionStorage.getItem('CompanyID'), 10);
    const Empid = parseInt(sessionStorage.getItem('UserId'), 10);


    // Check if they exist
    if (isNaN(CompanyID) || isNaN(Empid)) {
        setError("Missing or invalid CompanyID or Empid. Please log in again.");
        return;
    }

    // Construct the new Zone object
    const newZone = {
        ...Zone,
        IsDeleted: 0,
        CreatedBy: Empid,
        CreatedDate: new Date().toISOString(),
        CompanyID: CompanyID,
    };

    
    try {
        setLoading(true);
        const response = await api.post("/api/insertZone", newZone);
  
        // setMessage(response.data.message);
        // alert("Zone information submitted successfully!");
  
        // Reset the Zone form after submission
        setZone({
            ZoneName: "",
            Area: "",
            Country: "",
            State: "",
            CompanyID: "",
        });
    } catch (error) {
        console.error("Error submitting data:", error);
        setError("Failed to submit Zone information. Please try again.");
    } finally {
        setLoading(false);
        // Call fetchData to refresh the data
        fetchData();
    }
};



const handleUpdate = async (e) => {
  e.preventDefault();



  try {
    setLoadingUpdate(true);

    const CompanyID = sessionStorage.getItem('CompanyID');
    const Empid = sessionStorage.getItem('UserId');

    const updatedZone = {
      ...Zone,
      CompanyID: CompanyID ? parseInt(CompanyID, 10) : 0,
      ModifiedBy: Empid ? parseInt(Empid, 10) : 0, // Use Empid for ModifiedBy
      ModifiedDate: new Date().toISOString(),
    };

    const response = await api.post("/api/updateZone", updatedZone);

    setMessage(response.data.message);
    // alert("Zone updated successfully!");
    setZone({
      ZoneId: 0,
      ZoneName: "",
      Area: "",
      Country: "",
      State: "",
      ModifiedBy: 0,
      ModifiedDate: new Date().toISOString(),
    });

    await fetchData();
  } catch (error) {
    console.error("Error from server:", error);
    setError(
      error.response?.data?.message || "An error occurred while updating"
    );
    // alert("Failed to update data!");
  } finally {
    setLoadingUpdate(false);
  }
};


const handleDelete = async (e) => {
  e.preventDefault();
  const Empid = sessionStorage.getItem("UserId");


  if (window.confirm("Are you sure you want to delete?")) {
      try {
        const response = await api.post("/api/deleteZone", {
          ZoneId: parseInt(Zone.ZoneId),
          DeletedBy: Empid ? parseInt(Empid, 10) : 0,
          DeletedDate: new Date().toISOString(),
      });
      
          setMessage(response.data.message);
          // alert("Zone deleted successfully!");

          setZone({
              ZoneId: 0,
              ZoneName: "",
              Area: "",
              Country: "",
              State: "",
              CompanyID: "",
          });

          await fetchData();
      } catch (error) {
          console.error("Error from server:", error);
          setError(error.response?.data?.error || "An error occurred while deleting");
          // alert("Failed to delete data!");
      }
  }
};



  const handleClear = () => {
    setMessage("");
    setError("");
    setZone({
      ZoneId: 0,
      ZoneName: "",
      Area: "",
      Country: "",
      State: "",
      CreatedBy: "",
    });
    fetchData();
  };

  const handleRowClick = (item) => {
    setZone({
      ...item,
      ZoneId: item.ZoneId,
      ZoneName: item.ZoneName,
      Area: item.Area || "",
      Country: item.Country || "",
      State: item.State || "",
      CreatedBy: "",
      CreatedDate: new Date().toISOString(),
      ModifiedBy: 0,
      ModifiedDate: new Date().toISOString(),
      DeletedBy: 0,
      DeletedDate: new Date().toISOString(),
      IsDeleted: 0,
    });
    setIsSubmitDisabled(true);
    setIsUpdateDisabled(false);
    setIsDeleteDisabled(false);
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" }); // Adjust behavior as needed
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredZoneData = ZoneData.filter((item) =>
    item.ZoneName.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    const aStartsWith = a.ZoneName.toLowerCase().startsWith(
      searchQuery.toLowerCase()
    );
    const bStartsWith = b.ZoneName.toLowerCase().startsWith(
      searchQuery.toLowerCase()
    );

    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    return a.ZoneName.localeCompare(b.ZoneName);
  });


  return (
    <div className="page-wrapper">
      <div className="container-xl">
        <div className="page-header d-print-none mt-2">
          <div className="row g-2 align-items-center">
            <div className="col">
              <h2 className="page-title">Zone Master</h2>
            </div>
          </div>
        </div>
        <div className="page-body">
          <div className="container-xl">
            <div className="row row-cards">
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <form className="Zone-form" onSubmit={handleSubmit}>
                      <div className="row">
                        <div className="col-md-3">
                          <div className="form-group">
                            <label
                              htmlFor="ZoneName"
                              className="form-label required"
                            >
                              Zone Name
                            </label>
                            <input
                              type="text"
                              id="ZoneName"
                              name="ZoneName"
                              className="form-control"
                              value={Zone.ZoneName}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label
                              htmlFor="Area"
                              className="form-label required"
                            >
                              Area
                            </label>
                            <input
                              type="text"
                              id="Area"
                              name="Area"
                              className="form-control"
                              value={Zone.Area}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label
                              htmlFor="Country"
                              className="form-label required"
                            >
                              Country
                            </label>
                            <input
                              type="text"
                              id="Country"
                              name="Country"
                              className="form-control"
                              value={Zone.Country}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label
                              htmlFor="State"
                              className="form-label required"
                            >
                              State
                            </label>
                            <input
                              type="text"
                              id="State"
                              name="State"
                              className="form-control"
                              value={Zone.State}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>
                      </div>
                   
                   
                      <div className="form-footer d-flex justify-content-center">
                        <button
                          type="submit"
                          className="btn  mx-1"
                          disabled={isSubmitDisabled || loadingSubmit}
                        >
                          {loadingSubmit ? "Submitting..." : "Submit"}
                        </button>
                        <button
                          type="button"
                          className="btn  mx-1"
                          disabled={isUpdateDisabled || loadingUpdate}
                          onClick={handleUpdate}
                        >
                          {loadingUpdate ? "Updating..." : "Update"}
                        </button>
                        <button
                          type="button"
                          className="btn  mx-1"
                          disabled={isDeleteDisabled || loadingDelete}
                          onClick={handleDelete}
                        >
                          Delete
                        </button>

                        <button
                          type="button"
                          className="btn  mx-1"
                          onClick={handleClear}
                        >
                          Clear
                        </button>
                      </div>
                      {error && (
                        <div className="alert alert-danger mt-2">{error}</div>
                      )}
                      {message && (
                        <div className="alert alert-success mt-2">
                          {message}
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              </div>
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Zone List</h3>
                    <div className="col-auto ms-auto d-print-none">
                      <div className="d-flex">
                        <div className="me-3">
                          <div className="input-icon">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Search…"
                              value={searchQuery}
                              onChange={handleSearchChange}
                            />
                            <span className="input-icon-addon">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="icon"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                strokeWidth="2"
                                stroke="currentColor"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path
                                  stroke="none"
                                  d="M0 0h24v24H0z"
                                  fill="none"
                                />
                                <circle cx="10" cy="10" r="7" />
                                <line x1="21" y1="21" x2="15" y2="15" />
                              </svg>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div ref={tableRef} className="card-body">
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          {/* <th>ZoneID</th> */}
                          <th>Zone Name</th>
                          <th>Area</th>
                          <th>Country</th>
                          <th>State</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredZoneData.map((item) => (
                          <tr
                            key={item.ZoneId}
                            onClick={() => handleRowClick(item)}
                          >
                            <td>{item.ZoneName}</td>
                            <td>{item.Area}</td>
                            <td>{item.Country}</td>
                            <td>{item.State}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ZoneForm;
