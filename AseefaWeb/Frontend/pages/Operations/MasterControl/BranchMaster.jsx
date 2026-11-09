import React, { useState, useEffect, useRef } from "react";
import api from '../../apiService';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaBuilding, FaSearch, FaPlus, FaMapMarkerAlt, FaGlobe,
  FaMap, FaCity, FaMapPin, FaPhone, FaMobileAlt,
  FaSave, FaEdit, FaTrashAlt, FaEraser, FaArrowLeft, FaEnvelope
} from "react-icons/fa";

const primaryColor = 'rgb(45, 75, 169)';   

const outlineBtn = {
  borderRadius: '5px', fontWeight: '500',
  background: 'transparent', border: `2px solid ${primaryColor}`,
  color: primaryColor, padding: '10px 20px', fontSize: '14px', minWidth: '120px'
};

function BranchForm() {
  const [loading, setLoading] = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);
  const [isDeleteDisabled, setIsDeleteDisabled] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [Branch, setBranch] = useState({
    BranchId: 0, BranchName: "", Address: "", Country: "",
    State: "", District: "", City: "", Pincode: "",
    Phoneno: "", Mobileno: "", CompanyID: "", CreatedBy: "",
  });

  const [BranchData, setBranchData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const CompanyID = sessionStorage.getItem("CompanyID");
      if (!CompanyID) { console.error("CompanyID not found"); return; }
      const response = await api.get("/api/getbranch", { params: { CompanyID } });
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

const handleInputChange = (e) => {
  const { name, value } = e.target;
  let updatedValue = value;

  // Branch Name validation (letters + numbers + space)
  if (name === "BranchName") {
    const regex = /^[A-Za-z0-9\s]*$/;
    if (!regex.test(value)) {
      toast.error("Branch Name can only contain letters, numbers, and spaces.");
      return;
    }

    // duplicate warning only (do not block typing)
    if (checkDuplicateBranchName(value, Branch.BranchId)) {
      toast.dismiss("duplicate-branch");
      toast.error("Branch Name already exists.", { toastId: "duplicate-branch" });
    } else {
      toast.dismiss("duplicate-branch");
    }
  }

  // District / State / Country → alphabets only
  if (name === "District" || name === "State" || name === "Country") {
    updatedValue = value.replace(/[^A-Za-z\s]/g, "");
  }

  // Pincode → digits only (6)
  if (name === "Pincode") {
    updatedValue = value.replace(/\D/g, "").slice(0, 6);
  }

  // Phone → digits only (10)
  if (name === "Phoneno") {
    updatedValue = value.replace(/\D/g, "").slice(0, 10);
  }

  // Mobile → digits only (10)
  if (name === "Mobileno") {
    updatedValue = value.replace(/\D/g, "").slice(0, 10);
  }

  setBranch((prev) => ({
    ...prev,
    [name]: updatedValue
  }));
};

  const checkDuplicateBranchName = (branchName, currentBranchId = null) => {
    return BranchData.some((branch) => {
      const isSameName = branch.BranchName.toLowerCase() === branchName.toLowerCase();
      return currentBranchId ? isSameName && branch.BranchId !== currentBranchId : isSameName;
    });
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  const branchName = Branch.BranchName?.trim();

  // Empty validation
  if (!branchName) {
    toast.error("Branch Name is required.");
    return;
  }

  // Duplicate check
 const checkDuplicateBranchName = (branchName, currentBranchId = null) => {
  return BranchData.some((branch) => {
    const isSameName =
      branch.BranchName?.trim().toLowerCase() ===
      branchName.trim().toLowerCase();

    return currentBranchId
      ? isSameName && branch.BranchId !== currentBranchId
      : isSameName;
  });
};
  const CompanyID = parseInt(sessionStorage.getItem("CompanyID"), 10);
  const Empid = parseInt(sessionStorage.getItem("UserId"), 10);

  if (isNaN(CompanyID) || isNaN(Empid)) {
    toast.error("Missing or invalid CompanyID or UserId.");
    return;
  }

  const newBranch = {
    ...Branch,
    BranchName: branchName,
    CompanyID,
    CreatedBy: Empid,
    CreatedDate: new Date().toISOString(),
    IsDeleted: 0,
  };

  try {
    setLoadingSubmit(true);

    await api.post("/api/insertbranch", newBranch);

    toast.success("Branch information submitted successfully!");

    fetchData();
    handleClear();
    setShowForm(false);

  } catch (error) {
    console.error("Insert Branch Error:", error);

    toast.error(
      error.response?.data?.message ||
      "Failed to submit branch information. Please try again."
    );

  } finally {
    setLoadingSubmit(false);
  }
};

 const handleUpdate = async (e) => {
  e.preventDefault();

  const branchName = Branch.BranchName?.trim();

  // Empty validation
  if (!branchName) {
    toast.error("Branch Name is required.");
    return;
  }

  // Duplicate check (ignore same branch id)
  if (checkDuplicateBranchName(branchName, Branch.BranchId)) {
    toast.error("Branch Name already exists.");
    return;
  }

  const CompanyID = parseInt(sessionStorage.getItem("CompanyID"), 10);
  const Empid = parseInt(sessionStorage.getItem("UserId"), 10);

  if (isNaN(CompanyID) || isNaN(Empid)) {
    toast.error("Missing or invalid CompanyID or UserId.");
    return;
  }

  const updatedBranch = {
    ...Branch,
    BranchName: branchName,
    CompanyID,
    ModifiedBy: Empid,
    ModifiedDate: new Date().toISOString(),
  };

  try {
    setLoadingUpdate(true);

    await api.post("/api/updatebranch", updatedBranch);

    toast.success("Branch updated successfully!");

    fetchData();
    handleClear();
    setShowForm(false);

  } catch (error) {
    console.error("Update Branch Error:", error);

    toast.error(
      error.response?.data?.message ||
      "An error occurred while updating"
    );

  } finally {
    setLoadingUpdate(false);
  }
};

  const confirmDeleteToast = () => {
    return new Promise((resolve) => {
      const toastId = toast.warning(
        ({ closeToast }) => (
          <div>
            <div className="mb-2">Are you sure you want to delete this branch?</div>
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-danger btn-sm" onClick={() => { toast.dismiss(toastId); resolve(true); }}>Yes</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { toast.dismiss(toastId); resolve(false); }}>Cancel</button>
            </div>
          </div>
        ),
        { position: "top-center", autoClose: false, closeOnClick: false, draggable: false, closeButton: false, toastId: "confirm-delete" }
      );
    });
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    const Empid = sessionStorage.getItem("UserId");
    const confirm = await confirmDeleteToast();
    if (!confirm) return;
    try {
      setLoadingDelete(true);
      await api.post("/api/deletebranch", {
        BranchId: parseInt(Branch.BranchId),
        DeletedBy: Empid ? parseInt(Empid, 10) : 0,
        DeletedDate: new Date().toISOString(),
      });
      toast.success("Branch deleted successfully!");
      fetchData(); handleClear(); setShowForm(false);
    } catch (error) {
      toast.error(error.response?.data?.error || "An error occurred while deleting");
    } finally { setLoadingDelete(false); }
  };

  const handleClear = () => {
    setBranch({ BranchId: 0, BranchName: "", Address: "", Country: "", State: "", District: "", City: "", Pincode: "", Phoneno: "", Mobileno: "", CreatedBy: "" });
    setIsSubmitDisabled(false);
    setIsUpdateDisabled(true);
    setIsDeleteDisabled(true);
    toast.dismiss();
  };

  const handleRowClick = (item) => {
    setBranch({
      ...item, BranchId: item.BranchId, BranchName: item.BranchName,
      Address: item.Address || "", Country: item.Country || "",
      State: item.State || "", District: item.District || "",
      City: item.City || "", Pincode: item.Pincode || "",
      Phoneno: item.Phoneno || "", Mobileno: item.Mobileno || "",
      CreatedBy: "", CreatedDate: new Date().toISOString(),
      ModifiedBy: 0, ModifiedDate: new Date().toISOString(),
      DeletedBy: 0, DeletedDate: new Date().toISOString(), IsDeleted: 0,
    });
    setIsSubmitDisabled(true);
    setIsUpdateDisabled(false);
    setIsDeleteDisabled(false);
    setShowForm(true);
  };

  const handleCreateNew = () => { handleClear(); setShowForm(true); };
  const handleBackToList = () => { setShowForm(false); handleClear(); };

  const filteredBranchData = BranchData.filter((item) =>
    item.BranchName.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    const aS = a.BranchName.toLowerCase().startsWith(searchQuery.toLowerCase());
    const bS = b.BranchName.toLowerCase().startsWith(searchQuery.toLowerCase());
    if (aS && !bS) return -1;
    if (!aS && bS) return 1;
    return a.BranchName.localeCompare(b.BranchName);
  });

  return (
    <div className="page-wrapper" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="page-body mt-1">
        <div className="container-fluid px-4">
          <ToastContainer position="top-center" autoClose={3000} />

          {!showForm ? (
            /* ══════════════ LIST VIEW ══════════════ */
            <>
              {/* Header card */}
              <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <div className="card-body p-4">
                  <h2 className="mb-3" style={{ fontWeight: '600', color: '#2d3748', fontSize: '28px' }}>
                    <FaBuilding className="me-2" style={{ color: primaryColor }} />
                    Branch Master
                  </h2>
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div style={{ maxWidth: '700px', flex: 1 }}>
                      <div className="input-group" style={{ height: '45px' }}>
                        <span className="input-group-text text-white" style={{ backgroundColor: primaryColor }}>
                          <FaSearch />
                        </span>
                        <input
                          type="text"
                          className="form-control border-start-0"
                          placeholder="Search branches..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          style={{ backgroundColor: '#fff', borderColor: '#e2e8f0', height: '45px', fontSize: '14px' }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn d-flex align-items-center gap-2"
                      onClick={handleCreateNew}
                      style={{ borderRadius: '5px', padding: '8px 20px', background: primaryColor, border: 'none', color: 'white', height: '45px', whiteSpace: 'nowrap' }}
                    >
                      <FaPlus /> Create New
                    </button>
                  </div>
                </div>
              </div>

              {/* Branch list card */}
              <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <div className="card-body p-0">
                  {loading ? (
                    <div className="text-center p-5">
                      <div className="spinner-border" role="status" style={{ color: primaryColor }}>
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-3 text-muted">Loading branches...</p>
                    </div>
                  ) : (
                    <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                      <table className="table table-hover mb-0">
                        <thead className="bg-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                          <tr>
                            <th className="py-3 px-4" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>Branch Name</th>
                            <th className="py-3" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>Address</th>
                            <th className="py-3" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>City</th>
                            <th className="py-3" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>Country</th>
                            <th className="py-3" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>Pincode</th>
                            <th className="py-3" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>Mobile</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBranchData.length > 0 ? filteredBranchData.map((item) => (
                            <tr
                              key={item.BranchId}
                              onClick={() => handleRowClick(item)}
                              style={{
                                cursor: 'pointer', transition: 'all 0.2s',
                                borderLeft: Branch.BranchId === item.BranchId ? `4px solid ${primaryColor}` : '4px solid transparent'
                              }}
                              className="align-middle"
                            >
                              <td className="py-3 px-4">
                                <div className="d-flex align-items-center">
                                  <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3"
                                    style={{ width: '36px', height: '36px' }}>
                                    <FaBuilding style={{ color: primaryColor, fontSize: '15px' }} />
                                  </div>
                                  <span className="fw-medium">{item.BranchName}</span>
                                </div>
                              </td>
                              <td className="py-3" style={{ color: '#4a5568' }}>
                                <FaMapMarkerAlt className="me-2" style={{ color: '#48bb78', fontSize: '13px' }} />
                                {item.Address || 'N/A'}
                              </td>
                              <td className="py-3" style={{ color: '#4a5568' }}>
                                <FaCity className="me-2" style={{ color: '#f56565', fontSize: '13px' }} />
                                {item.City || 'N/A'}
                              </td>
                              <td className="py-3" style={{ color: '#4a5568' }}>
                                <FaGlobe className="me-2" style={{ color: '#4299e1', fontSize: '13px' }} />
                                {item.Country || 'N/A'}
                              </td>
                             <td className="py-3" style={{ fontSize: '13px', fontWeight: '500' }}>
  {item.Pincode || 'N/A'}
</td>
                              <td className="py-4" style={{ color: '#4a5568' }}>
                                <FaMobileAlt className="me-2" style={{ color: '#ed8936', fontSize: '13px' }} />
                                {item.Mobileno || 'N/A'}
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan="6" className="text-center p-5">
                                <FaBuilding className="mb-3" style={{ fontSize: '48px', color: '#cbd5e0' }} />
                                <p className="text-muted mb-3">
                                  {BranchData.length === 0 ? "No branches found" : "No matching branches found"}
                                </p>
                                <button className="btn" onClick={handleCreateNew}
                                  style={{ borderRadius: '5px', padding: '10px 24px', background: primaryColor, border: 'none', color: 'white', fontSize: '14px' }}>
                                  <FaPlus className="me-2" />Create New Branch
                                </button>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* ══════════════ FORM VIEW ══════════════ */
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              {/* Form header */}
              <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-0"
                style={{ borderBottom: '1px solid #e2e8f0' }}>
                <h4 className="m-0" style={{ color: '#2d3748', fontWeight: '600', fontSize: '18px' }}>
                  <FaBuilding className="me-2" style={{ color: primaryColor }} />
                  {Branch.BranchId ? 'Edit Branch' : 'New Branch'}
                </h4>
                <button
                  className="btn d-flex align-items-center gap-2"
                  onClick={handleBackToList}
                  style={{ borderRadius: '5px', padding: '8px 16px', fontSize: '14px', background: 'transparent', border: `2px solid ${primaryColor}`, color: primaryColor }}
                >
                  <FaArrowLeft /> Back to List
                </button>
              </div>

              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="row g-4">

                    {/* Left card: Basic Info */}
                    <div className="col-md-6">
                      <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '10px' }}>
                        <div className="card-header bg-white"
                          style={{ borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: primaryColor }}>
                          <FaBuilding className="me-2" />Branch Information
                        </div>
                        <div className="card-body p-3">

                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">Branch Name <span className="text-danger">*</span></label>
                            <div className="input-group">
                              <span className="input-group-text text-white" style={{ backgroundColor: primaryColor }}>
                                <FaBuilding />
                              </span>
                              <input type="text" name="BranchName" className="form-control"
                                value={Branch.BranchName} onChange={handleInputChange}
                                placeholder="Enter branch name" required />
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">Address <span className="text-danger">*</span></label>
                            <div className="input-group">
                              <span className="input-group-text text-white" style={{ backgroundColor: primaryColor }}>
                                <FaMapMarkerAlt />
                              </span>
                              <input type="text" name="Address" className="form-control"
                                value={Branch.Address} onChange={handleInputChange}
                                placeholder="Enter address" required />
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">Country <span className="text-danger">*</span></label>
                            <div className="input-group">
                              <span className="input-group-text text-white" style={{ backgroundColor: primaryColor }}>
                                <FaGlobe />
                              </span>
                              <input type="text" name="Country" className="form-control"
                                value={Branch.Country} onChange={handleInputChange}
                                placeholder="Enter country" required />
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">State <span className="text-danger">*</span></label>
                            <div className="input-group">
                              <span className="input-group-text text-white" style={{ backgroundColor: primaryColor }}>
                                <FaMap />
                              </span>
                              <input type="text" name="State" className="form-control"
                                value={Branch.State} onChange={handleInputChange}
                                placeholder="Enter state" required />
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>

                    {/* Right card: Contact & Location */}
                    <div className="col-md-6">
                      <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '10px' }}>
                        <div className="card-header bg-white"
                          style={{ borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: primaryColor }}>
                          <FaPhone className="me-2" />Contact & Location
                        </div>
                        <div className="card-body p-3">

                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <label className="form-label fw-medium mb-2">City <span className="text-danger">*</span></label>
                              <div className="input-group">
                                <span className="input-group-text text-white" style={{ backgroundColor: primaryColor }}>
                                  <FaCity />
                                </span>
                                <input type="text" name="City" className="form-control"
                                  value={Branch.City} onChange={handleInputChange}
                                  placeholder="City" required />
                              </div>
                            </div>
                            <div className="col-md-6 mb-3">
                              <label className="form-label fw-medium mb-2">District <span className="text-danger">*</span></label>
                              <div className="input-group">
                                <span className="input-group-text text-white" style={{ backgroundColor: primaryColor }}>
                                  <FaMapPin />
                                </span>
                                <input type="text" name="District" className="form-control"
                                  value={Branch.District} onChange={handleInputChange}
                                  placeholder="District" required />
                              </div>
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">Pincode <span className="text-danger">*</span></label>
                            <div className="input-group">
                              <span className="input-group-text text-white" style={{ backgroundColor: primaryColor }}>
                                <FaEnvelope />
                              </span>
                              <input type="text" name="Pincode" className="form-control"
                                value={Branch.Pincode} onChange={handleInputChange}
                                placeholder="6-digit pincode" maxLength="6" required />
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">Business Phone <span className="text-danger">*</span></label>
                            <div className="input-group">
                              <span className="input-group-text text-white" style={{ backgroundColor: primaryColor }}>
                                <FaPhone />
                              </span>
                              <input type="text" name="Phoneno" className="form-control"
                                value={Branch.Phoneno} onChange={handleInputChange}
                                placeholder="10-digit phone number" maxLength="10" required />
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">Mobile Number <span className="text-danger">*</span></label>
                            <div className="input-group">
                              <span className="input-group-text text-white" style={{ backgroundColor: primaryColor }}>
                                <FaMobileAlt />
                              </span>
                              <input type="text" name="Mobileno" className="form-control"
                                value={Branch.Mobileno} onChange={handleInputChange}
                                placeholder="10-digit mobile number" maxLength="10" required />
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="row mt-4">
                    <div className="col-12">
                      <div className="d-flex justify-content-center flex-wrap gap-3">

                        <button type="submit" className="btn px-4 d-flex align-items-center gap-2"
                          style={outlineBtn} disabled={isSubmitDisabled || loadingSubmit}>
                          {loadingSubmit
                            ? <><span className="spinner-border spinner-border-sm" /> Submitting...</>
                            : <><FaSave /> Submit</>}
                        </button>

                        <button type="button" className="btn px-4 d-flex align-items-center gap-2"
                          style={outlineBtn} disabled={isUpdateDisabled || loadingUpdate} onClick={handleUpdate}>
                          {loadingUpdate
                            ? <><span className="spinner-border spinner-border-sm" /> Updating...</>
                            : <><FaEdit /> Update</>}
                        </button>

                        <button type="button" className="btn px-4 d-flex align-items-center gap-2"
                          style={outlineBtn} disabled={isDeleteDisabled || loadingDelete} onClick={handleDelete}>
                          {loadingDelete
                            ? <><span className="spinner-border spinner-border-sm" /> Deleting...</>
                            : <><FaTrashAlt /> Delete</>}
                        </button>

                        <button type="button" className="btn px-4 d-flex align-items-center gap-2"
                          style={outlineBtn} onClick={handleClear}>
                          <FaEraser /> Clear
                        </button>

                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BranchForm;