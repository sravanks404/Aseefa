import React, { useState, useEffect, useRef } from "react";
import api from '../../apiService';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function AccountForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);
  const [isDeleteDisabled, setIsDeleteDisabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [routes, setRoutes] = useState([]);
  const tableRef = useRef(null);
  const [accountType, setAccountType] = useState("Customer");

  const [account, setAccount] = useState({
    AccountID: 0,
    AccountName: "",
    AccountParent: "",
    SuitAppsId: "",
    Type: "",
    CompanyID: "",
    CreatedBy: "",
    CreatedDate: "",
    CreatedDateAndTime: "",
    ModifiedBy: "",
    ModifiedDate: "",
    ModifiedDateAndTime: "",
    IsDeleted: 0,
    Address: "",
    Email: "",
    Phone: "",
    Mob: "",
    city: "",
    country: "",
    RootId: "",
    RateType: "",
    PinNo: "",
    GSTinNo: "",
    Place: "",
    CustomerType: ""
  });

  const [accountData, setAccountData] = useState([]);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await api.get("api/GetRouteName");
        setRoutes(response.data);
      } catch (error) {
        console.error("Failed to fetch routes:", error);
      }
    };
    fetchRoutes();
  }, []);

  const fetchData = async () => {
    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      if (!CompanyID) return;
      const response = await api.get("/api/getAccount", { params: { CompanyID } });
      setAccountData(response.data);
      setIsSubmitDisabled(false);
      setIsUpdateDisabled(true);
      setIsDeleteDisabled(true);
    } catch (error) {
      console.error("Error fetching Account data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    let validationError = "";

    // Field-specific validation
    switch (name) {
      case "AccountName":
        if (!/^[A-Za-z0-9\s]*$/.test(value)) {
          validationError = "Account Name can only contain letters, numbers, and spaces.";
        } else if (checkDuplicateAccountName(value, account.AccountID)) {
          validationError = "Account Name already exists.";
        }
        break;

      case "Phone":
      case "Mob":
        if (!/^\d{0,10}$/.test(value)) {
          validationError = `${name} must be a valid 10-digit number.`;
        }
        break;

      case "PinNo":
        if (!/^\d{0,6}$/.test(value)) {
          validationError = "Pincode must be a valid 6-digit number.";
        }
        break;

      case "CustomerType":
        formattedValue = value.toString(); // Always store as string
        break;
    }

    if (validationError) {
       toast.error(validationError);
      return;
    }

    setAccount((prev) => ({ ...prev, [name]: formattedValue }));
    setError("");
  };


  const checkDuplicateAccountName = (name, currentId = null) => {
    return accountData.some(
      (acc) => acc.AccountName.toLowerCase() === name.toLowerCase() && acc.AccountID !== currentId
    );
  };

  const generateSuitAppsId = () => {
    const now = new Date();
    const pad = (n, w = 2) => n.toString().padStart(w, "0");
    const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${pad(now.getMilliseconds(), 3)}`;
    const { FYearID } = JSON.parse(sessionStorage.getItem("financialResponse"));
    return `WEB-${datePart}-${timePart}-${FYearID}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (checkDuplicateAccountName(account.AccountName)) {
       toast.error("Account Name already exists. Please choose a different name.");
      return;
    }

    const CompanyID = parseInt(sessionStorage.getItem("CompanyID"), 10);
    const CreatedBy = parseInt(sessionStorage.getItem("UserId"), 10);
    if (!CompanyID || !CreatedBy) {
      toast.error("Missing CompanyID or UserId.");
      return;
    }

    const now = new Date().toISOString();
    const newAccount = {
      ...account,
      AccountID: 0,
      SuitAppsId: generateSuitAppsId(),
      CompanyID,
      CreatedBy,
      CreatedDate: now,
      CreatedDateAndTime: now,
      IsDeleted: 0
    };

    try {
      setLoadingSubmit(true);
      await api.post("/api/insertaccount", newAccount);
       toast.success("Account submitted successfully");
      handleClear();
    } catch (err) {
      console.error("Submit error:", err);
       toast.error("Failed to submit account.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    const CompanyID = parseInt(sessionStorage.getItem("CompanyID"), 10);
    const ModifiedBy = parseInt(sessionStorage.getItem("UserId"), 10);
    const now = new Date().toISOString();

    try {
      setLoadingUpdate(true);

      const updatedAccount = {
        ...account,
        CompanyID,
        ModifiedBy,
        ModifiedDate: now,
        ModifiedDateAndTime: now,
        IsDeleted: account.IsDeleted || 0,
        CreatedBy: account.CreatedBy || null,
        CreatedDate: account.CreatedDate || null,
        Address: account.Address || "",
        Email: account.Email || "",
        Mob: account.Mob || "",
        city: account.city || "",
        country: account.country || "",
        Phone: account.Phone || "",
        RootId: account.RootId || null,
        RateType: account.RateType || "",
        PinNo: account.PinNo || "",
        GSTinNo: account.GSTinNo || "",
        Place: account.Place || "",
        CustomerType: account.CustomerType || "0", // Replace with your system’s actual default/allowed value
        Type: ""
      };

      await api.post("/api/updateaccount", updatedAccount);
       toast.success("Account updated successfully");
      handleClear();
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Failed to update account.");
    } finally {
      setLoadingUpdate(false);
    }
  };

const confirmDeleteToast = () => {
  return new Promise((resolve) => {
    const toastId = toast.warning(
      ({ closeToast }) => (
        <div>
          <div className="mb-2">Are you sure you want to delete this Account?</div>
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
    const DeletedBy = parseInt(sessionStorage.getItem("UserId"), 10);
    if (!DeletedBy || !account.AccountCode) return;

 const confirm = await confirmDeleteToast(); // 🍞 wait for toast confirmation
  if (!confirm) return;
    try {
      setLoadingDelete(true);
      await api.post("/api/deleteAccount", {
        AccountCode: account.AccountCode,
        DeletedBy,
        DeletedDate: new Date().toISOString()
      });
       toast.success("Account deleted successfully");
      handleClear();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete account.");
    } finally {
      setLoadingDelete(false);
    }
  };

  const handleClear = () => {
    setMessage("");
    setError("");
    setAccount({
      AccountID: 0,
      AccountName: "",
      AccountParent: "",
      SuitAppsId: "",
      Type: "",
      CompanyID: "",
      CreatedBy: "",
      CreatedDate: "",
      CreatedDateAndTime: "",
      ModifiedBy: "",
      ModifiedDate: "",
      ModifiedDateAndTime: "",
      IsDeleted: 0,
      Address: "",
      Email: "",
      Phone: "",
      Mob: "",
      city: "",
      country: "",
      RootId: "",
      RateType: "",
      PinNo: "",
      GSTinNo: "",
      Place: "",
      CustomerType: ""
    });
    setIsSubmitDisabled(false);
    setIsUpdateDisabled(true);
    setIsDeleteDisabled(true);
    fetchData();
  };

  const handleRowClick = (item) => {
    setAccount({
      ...item,
      AccountParent: String(item.AccountParent), // Ensure string comparison works
      ModifiedDate: new Date().toISOString(),
      ModifiedDateAndTime: new Date().toISOString(),
      CustomerType: String(item.CustomerType),

    });
    setIsSubmitDisabled(true);
    setIsUpdateDisabled(false);
    setIsDeleteDisabled(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const filteredAccountData = accountData
    .filter(item => {
      const isMatchingParent = accountType === 'Customer' ? item.AccountParent === 14 : item.AccountParent === 27;
      return isMatchingParent && item.AccountName.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      const query = searchQuery.toLowerCase();
      const aName = a.AccountName.toLowerCase();
      const bName = b.AccountName.toLowerCase();
      return (aName.startsWith(query) ? -1 : bName.startsWith(query) ? 1 : aName.localeCompare(bName));
    });


  return (
    <div className="page-wrapper">
      <div className="container-xl">
         <ToastContainer position="top-center" autoClose={3000} />
        <div className="page-header d-print-none mt-2">
          <div className="row g-2 align-items-center">
            <div className="col">
              <h2 className="page-title">Account Creation</h2>
            </div>
          </div>
        </div>
        <div className="page-body">
          <div className="container-xl">
            <div className="row row-cards">
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <form className="Account-form" onSubmit={handleSubmit}>
                      <div className="row g-4">
                        {/* FIRST COLUMN */}
                        <div className="col-md-4">
                          <div className="row gy-3">
                            {/* Type */}
                            <div className="col-12 d-flex align-items-center">
                              <label className="me-2 mb-0" style={{ width: '140px' }}>Account Type</label>
                              <select name="AccountParent" className="form-control" style={{ height: '38px' }} value={account.AccountParent} onChange={handleInputChange} required>
                                <option value="">Select Account Type</option>
                                <option value="14">Customer</option>
                                <option value="27">Supplier</option>
                              </select>

                            </div>

                            {/* Account Name */}
                            <div className="col-12 d-flex align-items-center">
                              <label className="me-2 mb-0" style={{ width: '140px' }}>Account Name</label>
                              <input type="text" name="AccountName" className="form-control" style={{ height: '32px' }} value={account.AccountName} onChange={handleInputChange} required />
                            </div>

                            {/* Address */}
                            <div className="col-12 d-flex align-items-center">
                              <label className="me-2 mb-0" style={{ width: '140px' }}>Address</label>
                              <input type="text" name="Address" className="form-control" style={{ height: '32px' }} value={account.Address} onChange={handleInputChange} required />
                            </div>

                            {/* Place */}
                            <div className="col-12 d-flex align-items-center">
                              <label className="me-2 mb-0" style={{ width: '140px' }}>Place</label>
                              <input type="text" name="Place" className="form-control" style={{ height: '32px' }} value={account.Place} onChange={handleInputChange} required />
                            </div>

                            {/* PIN No */}
                            <div className="col-12 d-flex align-items-center">
                              <label className="me-2 mb-0" style={{ width: '140px' }}>PIN No</label>
                              <input type="text" name="PinNo" className="form-control" style={{ height: '32px' }} value={account.PinNo} onChange={handleInputChange} required />
                            </div>
                          </div>
                        </div>

                        {/* SECOND COLUMN */}
                        <div className="col-md-4">
                          <div className="row gy-3">
                            {/* City */}
                            <div className="col-12 d-flex align-items-center">
                              <label className="me-2 mb-0" style={{ width: '140px' }}>District</label>
                              <input type="text" name="city" className="form-control" style={{ height: '32px' }} value={account.city} onChange={handleInputChange} required />
                            </div>

                            {/* Country */}
                            <div className="col-12 d-flex align-items-center">
                              <label className="me-2 mb-0" style={{ width: '140px' }}>Country</label>
                              <input type="text" name="country" className="form-control" style={{ height: '32px' }} value={account.country} onChange={handleInputChange} required />
                            </div>

                            {/* Phone */}
                            <div className="col-12 d-flex align-items-center">
                              <label className="me-2 mb-0" style={{ width: '140px' }}>Phone</label>
                              <input type="text" name="Phone" className="form-control" style={{ height: '32px' }} value={account.Phone} onChange={handleInputChange} required />
                            </div>

                            {/* Mobile Number */}
                            <div className="col-12 d-flex align-items-center">
                              <label className="me-2 mb-0" style={{ width: '140px' }}>Mobile Number</label>
                              <input type="text" name="Mob" className="form-control" style={{ height: '32px' }} value={account.Mob} onChange={handleInputChange} required />
                            </div>

                            {/* Email */}
                            <div className="col-12 d-flex align-items-center">
                              <label className="me-2 mb-0" style={{ width: '140px' }}>Email</label>
                              <input type="email" name="Email" className="form-control" style={{ height: '32px' }} value={account.Email} onChange={handleInputChange} required />
                            </div>
                          </div>
                        </div>

                        {/* THIRD COLUMN */}
                        <div className="col-md-4">
                          <div className="row gy-3">
                            {/* GSTIN No */}
                            <div className="col-12 d-flex align-items-center">
                              <label className="me-2 mb-0" style={{ width: '140px' }}>GSTIN No</label>
                              <input type="text" name="GSTinNo" className="form-control" style={{ height: '32px' }} value={account.GSTinNo} onChange={handleInputChange} required />
                            </div>

                            {account.AccountParent === '14' && (
                              <>
                                {/* Root ID */}
                                <div className="col-12 d-flex align-items-center">
                                  <label className="me-2 mb-0" style={{ width: '140px' }}>Route</label>
                                  <select
                                    name="RootId"
                                    className="form-control"
                                    style={{ height: '38px' }}
                                    value={account.RootId}
                                    onChange={handleInputChange}
                                    required
                                  >
                                    <option value="">Select Route</option>
                                    {routes.map((route) => (
                                      <option key={route.RouteID} value={route.RouteID}>
                                        {route.RouteName}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Rate Type */}
                                <div className="col-12 d-flex align-items-center">
                                  <label className="me-2 mb-0" style={{ width: '140px' }}>Rate Type</label>
                                  <select name="RateType" className="form-control" style={{ height: '38px' }} value={account.RateType} onChange={handleInputChange} required>
                                    <option value="">Select Rate Type</option>
                                    <option value="CCP">CCP</option>
                                    <option value="SP">SP</option>
                                    <option value="DP">DP</option>
                                    <option value="MRP">MRP</option>
                                  </select>
                                </div>

                                {/* Customer Type */}
                                <div className="col-12 d-flex align-items-center">
                                  <label className="me-2 mb-0" style={{ width: '140px' }}>Customer Type</label>
                                  <select name="CustomerType" className="form-control" style={{ height: '38px' }} value={account.CustomerType} onChange={handleInputChange} required>
                                    <option value="">Select Customer Type </option>
                                    <option value="0">Retail</option>
                                    <option value="1">Wholesale</option>
                                    <option value="2">Supermarket</option>
                                    <option value="3">Distributor</option>
                                    <option value="4">Other</option>
                                  </select>
                                </div>
                              </>
                            )}

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
                      {/* {error && <div className="alert alert-danger mt-3">{error}</div>}
                      {message && <div className="alert alert-success mt-3">{message}</div>} */}
                    </form>
                  </div>
                </div>
              </div>



              <div className="col-12">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <h3 className="card-title mb-0">Account List</h3>
                      <div className="ms-4 d-flex align-items-center">
                        <div className="form-check me-2">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="accountType"
                            id="customerRadio"
                            value="Customer"
                            checked={accountType === 'Customer'}
                            onChange={(e) => setAccountType(e.target.value)}
                          />
                          <label className="form-check-label" htmlFor="customerRadio">
                            Customer
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="accountType"
                            id="supplierRadio"
                            value="Supplier"
                            checked={accountType === 'Supplier'}
                            onChange={(e) => setAccountType(e.target.value)}
                          />
                          <label className="form-check-label" htmlFor="supplierRadio">
                            Supplier
                          </label>
                        </div>
                      </div>
                    </div>
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
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
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
                          {/* <th>AccountID</th> */}
                          <th>Account Name</th>
                          <th>Address</th>
                          <th>Mob</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAccountData.map((item, index) => (
                          <tr
                            key={item.AccountId ? `id-${item.AccountId}` : `index-${index}`}
                            onClick={() => handleRowClick(item)}
                          >
                            <td>{item.AccountName}</td>
                            <td>{item.Address}</td>
                            <td>{item.Mob}</td>
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
export default AccountForm;