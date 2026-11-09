import React, { useState, useEffect, useRef } from "react";
import api from '../../apiService';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function BranchForm() {
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
  const [Branch, setBranch] = useState({
    BranchId: 0,
    BranchName: "",
    Address: "",
    Country: "",
    State: "",
    District: "",
    City: "",
    Pincode: "",
    Phoneno: "",
    Mobileno: "",
    CompanyID: "",
    CreatedBy: "",
  });
  const [BranchData, setBranchData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      const CompanyID = sessionStorage.getItem("CompanyID"); // Retrieve CompanyID from sessionStorage

      if (!CompanyID) {
        console.error("CompanyID not found in sessionStorage");
        return;
      }

      const response = await api.get("/api/getbranch", {
        params: { CompanyID }, // Pass CompanyID as a query parameter
      });

      const data = response.data.map((item) => ({
        ...item,
        BranchId: item.BranchId || 0,
        BranchName: item.BranchName || "",
        Address: item.Address || "",
        Country: item.Country || "",
        State: item.State || "",
        District: item.District || "",
        City: item.City || "",
        Pincode: item.Pincode || "",
        Phoneno: item.Phoneno || "",
        Mobileno: item.Mobileno || "",
        CreatedBy: item.CreatedBy || "",
      }));

      setBranchData(data);
      setIsSubmitDisabled(false);
      setIsUpdateDisabled(true);
      setIsDeleteDisabled(true);
    } catch (error) {
      console.error("Error fetching Branch data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Set the value first to allow typing
    setBranch((prevBranch) => ({
      ...prevBranch,
      [name]: value,
    }));

    // Clear existing errors
  //  toast.error("");

    // Validate BranchName
    if (name === "BranchName") {
      const regex = /^[A-Za-z0-9\s]*$/;
      if (!regex.test(value)) {
       toast.error("Branch Name can only contain letters, numbers, and spaces.");
        return;
      }

      // Check for duplicate branch names
      if (checkDuplicateBranchName(value)) {
        toast.error("Branch Name already exists.");
        return;
      }
    }

    // Validate Phoneno and Mobileno (only digits, length 10)
    // if (name === "Phoneno" || name === "Mobileno") {
    //   const phoneRegex = /^\d{0,10}$/; // Allow up to 10 digits
    //   if (!phoneRegex.test(value)) {
    //    toast.error(`${name} must be a valid 10-digit number.`);
    //     return;
    //   }
    // }

    // Validate Pincode (only digits, length 6)
    if (name === "Pincode") {
      const pincodeRegex = /^\d{0,6}$/; // Allow up to 6 digits
      if (!pincodeRegex.test(value)) {
       toast.error("Pincode must be a valid 6-digit number.");
        return;
      }
    }
  };

  const checkDuplicateBranchName = (branchName, currentBranchId = null) => {
    return BranchData.some((branch) => {
        // Convert both to lowercase for case-insensitive comparison
        const isSameName = branch.BranchName.toLowerCase() === branchName.toLowerCase();

        if (currentBranchId) {
            // During update, exclude the current branch itself
            return isSameName && branch.BranchId !== currentBranchId;
        } else {
            // During create (submit), just check for any match
            return isSameName;
        }
    });
};


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (checkDuplicateBranchName(Branch.BranchName)) {
      toast.error("Branch Name already exists. Please choose a different name.");
      return;
  }
    
    // Retrieve and parse as integers
    const CompanyID = parseInt(sessionStorage.getItem('CompanyID'), 10);
    const Empid = parseInt(sessionStorage.getItem('UserId'), 10);


    // Check if they exist
    if (isNaN(CompanyID) || isNaN(Empid)) {
       toast.error("Missing or invalid CompanyID or Empid. Please log in again.");
        return;
    }

    // Construct the new branch object
    const newBranch = {
        ...Branch,
        IsDeleted: 0,
        CreatedBy: Empid,
        CreatedDate: new Date().toISOString(),
        CompanyID: CompanyID,
    };

    
    try {
        setLoading(true);
        const response = await api.post("/api/insertbranch", newBranch);
  
        setMessage(response.data.message);
        toast.success("Branch information submitted successfully!");
  
        // Reset the Branch form after submission
        setBranch({
            BranchName: "",
            Address: "",
            Country: "",
            State: "",
            District: "",
            City: "",
            Pincode: "",
            Phoneno: "",
            Mobileno: "",
            CompanyID: "",
        });
    } catch (error) {
        console.error("Error submitting data:", error);
        toast.error("Failed to submit branch information. Please try again.");
    } finally {
        setLoading(false);
        // Call fetchData to refresh the data
        fetchData();
    }
};

const handleUpdate = async (e) => {
  e.preventDefault();

  if (checkDuplicateBranchName(Branch.BranchName, Branch.BranchId)) {
    toast.error("Branch Name already exists. Please choose a different name.");
    return;
}

  try {
    setLoadingUpdate(true);

    const CompanyID = sessionStorage.getItem('CompanyID');
    const Empid = sessionStorage.getItem('UserId');

    const updatedBranch = {
      ...Branch,
      CompanyID: CompanyID ? parseInt(CompanyID, 10) : 0,
      ModifiedBy: Empid ? parseInt(Empid, 10) : 0, // Use Empid for ModifiedBy
      ModifiedDate: new Date().toISOString(),
    };

    const response = await api.post("/api/updatebranch", updatedBranch);

    setMessage(response.data.message);
     toast.success("Branch updated successfully!");
    setBranch({
      BranchId: 0,
      BranchName: "",
      Address: "",
      Country: "",
      State: "",
      District: "",
      City: "",
      Pincode: "",
      Phoneno: "",
      Mobileno: "",
      ModifiedBy: 0,
      ModifiedDate: new Date().toISOString(),
    });

    await fetchData();
  } catch (error) {
    console.error("Error from server:", error);
   toast.error(
      error.response?.data?.message || "An error occurred while updating"
    );
    toast.error("Failed to update data!");
  } finally {
    setLoadingUpdate(false);
  }
};

const confirmDeleteToast = () => {
  return new Promise((resolve) => {
    const toastId = toast.warning(
      ({ closeToast }) => (
        <div>
          <div className="mb-2">Are you sure you want to delete this user?</div>
          <div className="d-flex justify-content-end gap-2">
            <button
              className="btn btn btn-danger"
              onClick={() => {
                toast.dismiss(toastId);
                resolve(true);
              }}
            >
              Yes
            </button>
            <button
              className="btn btn btn-secondary"
              onClick={() => {
                toast.dismiss(toastId);
                resolve(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
        toastId: "confirm-delete",
      }
    );
  });
};


const handleDelete = async (e) => {
  e.preventDefault();
  const Empid = sessionStorage.getItem("UserId");

 const confirm = await confirmDeleteToast(); // 🍞 wait for toast confirmation
  if (!confirm) return;

      try {
        const response = await api.post("/api/deletebranch", {
          BranchId: parseInt(Branch.BranchId),
          DeletedBy: Empid ? parseInt(Empid, 10) : 0,
          DeletedDate: new Date().toISOString(),
      });
      
          setMessage(response.data.message);
          toast.success("Branch deleted successfully!");
        
          setBranch({
              BranchId: 0,
              BranchName: "",
              Address: "",
              Country: "",
              State: "",
              District: "",
              City: "",
              Pincode: "",
              Phoneno: "",
              Mobileno: "",
              CompanyID: "",
          });

          await fetchData();
      } catch (error) {
          console.error("Error from server:", error);
          toast.error(error.response?.data?.error || "An error occurred while deleting");
          toast.error("Failed to delete data!");
      
  }
};



  const handleClear = () => {
    setMessage("");
    setError("");
    setBranch({
      BranchId: 0,
      BranchName: "",
      Address: "",
      Country: "",
      State: "",
      District: "",
      City: "",
      Pincode: "",
      Phoneno: "",
      Mobileno: "",
      CreatedBy: "",
    });
    fetchData();
    toast.dismiss(); 
  };

  const handleRowClick = (item) => {
    setBranch({
      ...item,
      BranchId: item.BranchId,
      BranchName: item.BranchName,
      Address: item.Address || "",
      Country: item.Country || "",
      State: item.State || "",
      District: item.District || "",
      City: item.City || "",
      Pincode: item.Pincode || "",
      Phoneno: item.Phoneno || "",
      Mobileno: item.Mobileno || "",
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

  const filteredBranchData = BranchData.filter((item) =>
    item.BranchName.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    const aStartsWith = a.BranchName.toLowerCase().startsWith(
      searchQuery.toLowerCase()
    );
    const bStartsWith = b.BranchName.toLowerCase().startsWith(
      searchQuery.toLowerCase()
    );

    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    return a.BranchName.localeCompare(b.BranchName);
  });


  return (
    <div className="page-wrapper">
      <div className="container-xl">
         <ToastContainer position="top-center" autoClose={3000} />
        <div className="page-header d-print-none mt-2">
          <div className="row g-2 align-items-center">
            <div className="col">
              <h2 className="page-title">Branch Master</h2>
            </div>
          </div>
        </div>
        <div className="page-body">
          <div className="container-xl">
            <div className="row row-cards">
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
<form className="Branch-form" onSubmit={handleSubmit}>
  <div className="row g-4">
    {/* LEFT COLUMN */}
    <div className="col-md-6">
      <div className="row gy-3">
        {[
          ['Branch Name *', 'BranchName'],
          ['Address *', 'Address'],
          ['Country *', 'Country'],
          ['State *', 'State']
        ].map(([label, name]) => (
          <div className="col-12 d-flex align-items-center" key={name}>
            <label className="me-2 mb-0" style={{ width: '130px' }}>{label}</label>
            <input
              type="text"
              name={name}
              className="form-control"
              style={{ height: '32px' }}
              value={Branch[name]}
              onChange={handleInputChange}
              required
            />
          </div>
        ))}
      </div>
    </div>

    {/* RIGHT COLUMN */}
    <div className="col-md-6">
      <div className="row gy-3">
        {[
          ['City *', 'City'],
          ['District *', 'District'],
          ['Pincode *', 'Pincode'],
          ['Business Phone *', 'Phoneno'],
          ['Mobile Number *', 'Mobileno']
        ].map(([label, name]) => (
          <div className="col-12 d-flex align-items-center" key={name}>
            <label className="me-2 mb-0" style={{ width: '130px' }}>{label}</label>
            <input
              type="text"
              name={name}
              className="form-control"
              style={{ height: '32px' }}
              value={Branch[name]}
              onChange={handleInputChange}
              required
            />
          </div>
        ))}
      </div>
    </div>
  </div>

  {/* Footer Buttons */}
  <div className="form-footer d-flex justify-content-center mt-4 gap-3 flex-wrap">
    <button type="submit" className="btn btn" disabled={isSubmitDisabled || loadingSubmit}>
      {loadingSubmit ? "Submitting..." : "Submit"}
    </button>
    <button type="button" className="btn btn" disabled={isUpdateDisabled || loadingUpdate} onClick={handleUpdate}>
      {loadingUpdate ? "Updating..." : "Update"}
    </button>
    <button type="button" className="btn btn" disabled={isDeleteDisabled || loadingDelete} onClick={handleDelete}>
      {loadingDelete ? "Deleting..." : "Delete"}
    </button>
    <button type="button" className="btn btn" onClick={handleClear}>
      Clear
    </button>
  </div>

  {/* Status Messages */}
  
</form>


                  </div>
                </div>
              </div>
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Branch List</h3>
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
                          {/* <th>BranchID</th> */}
                          <th>Branch Name</th>
                          <th>Address</th>
                          <th>Country</th>
                          <th>Pincode</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBranchData.map((item) => (
                          <tr
                            key={item.BranchId}
                            onClick={() => handleRowClick(item)}
                          >
                            <td>{item.BranchName}</td>
                            <td>{item.Address}</td>
                            <td>{item.Country}</td>
                            <td>{item.Pincode}</td>
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
export default BranchForm;
