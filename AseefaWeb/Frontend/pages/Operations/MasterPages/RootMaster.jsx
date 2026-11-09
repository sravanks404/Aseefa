import React, { useState, useEffect, useRef } from "react";
import api from '../../apiService';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaSearch, FaPlus, FaSave, FaEdit, FaTrashAlt,
  FaEraser, FaArrowLeft, FaRoute, FaMapMarkerAlt,
  FaPlayCircle, FaFlagCheckered, FaSitemap
} from "react-icons/fa";

const primaryColor = 'rgb(45, 75, 169)';

const btnStyle = {
  minWidth: '120px',
  borderRadius: '5px',
  fontWeight: '500',
  background: 'transparent',
  border: `2px solid ${primaryColor}`,
  color: primaryColor,
  padding: '10px 20px',
  fontSize: '14px'
};

function RootMasterForm() {
  const [loading, setLoading] = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);
  const [isDeleteDisabled, setIsDeleteDisabled] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [Root, setRoot] = useState({
    RootId: 0,
    RootName: "",
    PlaceName: "",
    FromPlace: "",
    ToPlace: "",
    CompanyID: "",
    CreatedBy: "",
  });

  const [RootData, setRootData] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const CompanyID = sessionStorage.getItem("CompanyID");
      if (!CompanyID) return;
      const response = await api.get(`/api/WebGetRootMaster?CompanyID=${CompanyID}`);
      const data = response.data.data.map((item) => ({
        ...item,
        RootId: item.RootId || 0,
        RootName: item.RootName || "",
        PlaceName: item.PlaceName || "",
        FromPlace: item.FromPlace || "",
        ToPlace: item.ToPlace || "",
      }));
      setRootData(data);
    } catch {
      toast.error("Failed to load Root data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "RootName") {
      if (!/^[A-Za-z0-9\s]*$/.test(value)) {
        toast.error("Root Name can only contain letters, numbers, and spaces.");
        return;
      }
      if (checkDuplicateRootName(value)) {
        toast.error("Root Name already exists.");
        return;
      }
    }
    setRoot((prev) => ({ ...prev, [name]: value }));
  };

  const checkDuplicateRootName = (rootName, currentRootId = null) => {
    return RootData.some((root) => {
      const isSameName = root.RootName.toLowerCase() === rootName.toLowerCase();
      return currentRootId ? isSameName && root.RootId !== currentRootId : isSameName;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (checkDuplicateRootName(Root.RootName)) {
      toast.error("Root Name already exists.");
      return;
    }
    const CompanyID = parseInt(sessionStorage.getItem('CompanyID'), 10);
    const UserId = parseInt(sessionStorage.getItem('UserId'), 10);
    if (isNaN(CompanyID) || isNaN(UserId)) {
      toast.error("Missing CompanyID or UserId. Please log in again.");
      return;
    }
    try {
      setLoadingSubmit(true);
      await api.post("/api/WebInsertUpdateRootMaster", {
        RootId: 0, RootName: Root.RootName, PlaceName: Root.PlaceName,
        FromPlace: Root.FromPlace, ToPlace: Root.ToPlace, CompanyID, UserId,
      });
      toast.success("Root created successfully!");
      fetchData();
      handleClear();
      setShowForm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create Root.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (checkDuplicateRootName(Root.RootName, Root.RootId)) {
      toast.error("Root Name already exists.");
      return;
    }
    const CompanyID = parseInt(sessionStorage.getItem('CompanyID'), 10);
    const UserId = parseInt(sessionStorage.getItem('UserId'), 10);
    try {
      setLoadingUpdate(true);
      await api.post("/api/WebInsertUpdateRootMaster", {
        RootId: Root.RootId, RootName: Root.RootName, PlaceName: Root.PlaceName,
        FromPlace: Root.FromPlace, ToPlace: Root.ToPlace, CompanyID, UserId,
      });
      toast.success("Root updated successfully!");
      fetchData();
      handleClear();
      setShowForm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update Root.");
    } finally {
      setLoadingUpdate(false);
    }
  };

  const confirmDeleteToast = () => {
    return new Promise((resolve) => {
      const toastId = toast.warning(
        ({ closeToast }) => (
          <div>
            <div className="mb-2">Are you sure you want to delete this Root?</div>
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-danger btn-sm" onClick={() => { toast.dismiss(toastId); resolve(true); }}>Yes</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { toast.dismiss(toastId); resolve(false); }}>Cancel</button>
            </div>
          </div>
        ),
        { position: "top-center", autoClose: false, closeOnClick: false, draggable: false, closeButton: false }
      );
    });
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    const confirm = await confirmDeleteToast();
    if (!confirm) return;
    const CompanyID = parseInt(sessionStorage.getItem('CompanyID'), 10);
    const DeletedBy = parseInt(sessionStorage.getItem('UserId'), 10);
    try {
      setLoadingDelete(true);
      await api.post("/api/WebDeleteRootMaster", { RootId: Root.RootId, CompanyID, DeletedBy });
      toast.success("Root deleted successfully!");
      fetchData();
      handleClear();
      setShowForm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete Root.");
    } finally {
      setLoadingDelete(false);
    }
  };

  const handleClear = () => {
    setRoot({ RootId: 0, RootName: "", PlaceName: "", FromPlace: "", ToPlace: "", CompanyID: "" });
    setIsSubmitDisabled(false);
    setIsUpdateDisabled(true);
    setIsDeleteDisabled(true);
    toast.dismiss();
  };

  const handleRowClick = (item) => {
    setRoot({
      RootId: item.RootId,
      RootName: item.RootName || "",
      PlaceName: item.PlaceName || "",
      FromPlace: item.FromPlace || "",
      ToPlace: item.ToPlace || "",
    });
    setIsSubmitDisabled(true);
    setIsUpdateDisabled(false);
    setIsDeleteDisabled(false);
    setShowForm(true);
  };

  const handleCreateNew = () => { handleClear(); setShowForm(true); };
  const handleBackToList = () => { setShowForm(false); handleClear(); };

  const filteredRootData = RootData.filter((item) =>
    item.RootName.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    const aS = a.RootName.toLowerCase().startsWith(searchQuery.toLowerCase());
    const bS = b.RootName.toLowerCase().startsWith(searchQuery.toLowerCase());
    if (aS && !bS) return -1;
    if (!aS && bS) return 1;
    return a.RootName.localeCompare(b.RootName);
  });

  return (
    <div className="page-wrapper" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="page-body mt-1">
        <div className="container-fluid px-4">
          <ToastContainer position="top-center" autoClose={3000} />

          {!showForm ? (
            /* ── LIST VIEW ── */
            <>
              {/* Header Card */}
              <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <div className="card-body p-4">
                  <h2 className="mb-3" style={{ fontWeight: '600', color: '#2d3748', fontSize: '28px' }}>
                    <FaRoute className="me-2" style={{ color: primaryColor }} />
                    Root Master
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
                          placeholder="Search roots..."
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

              {/* List Card */}
              <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <div className="card-body p-0">
                  {loading ? (
                    <div className="text-center p-5">
                      <div className="spinner-border" role="status" style={{ color: primaryColor }}><span className="visually-hidden">Loading...</span></div>
                      <p className="mt-3 text-muted">Loading roots...</p>
                    </div>
                  ) : (
                    <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                      <table className="table table-hover mb-0">
                        <thead className="bg-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                          <tr>
                            <th className="py-3 px-4" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>Root Name</th>
                            <th className="py-3" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>Place Name</th>
                            <th className="py-3" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>From Place</th>
                            <th className="py-3" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>To Place</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRootData.length > 0 ? (
                            filteredRootData.map((item) => (
                              <tr
                                key={item.RootId}
                                onClick={() => handleRowClick(item)}
                                style={{
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  borderLeft: Root.RootId === item.RootId ? `4px solid ${primaryColor}` : '4px solid transparent'
                                }}
                                className="align-middle"
                              >
                                <td className="py-3 px-4">
                                  <div className="d-flex align-items-center">
                                    <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3" style={{ width: '36px', height: '36px' }}>
                                      <FaSitemap style={{ color: primaryColor, fontSize: '16px' }} />
                                    </div>
                                    <span className="fw-medium">{item.RootName}</span>
                                  </div>
                                </td>
                                <td className="py-3" style={{ color: '#4a5568' }}>
                                  <FaMapMarkerAlt className="me-2" style={{ color: '#4299e1', fontSize: '14px' }} />
                                  {item.PlaceName}
                                </td>
                                <td className="py-3" style={{ color: '#4a5568' }}>
                                  <FaPlayCircle className="me-2" style={{ color: '#48bb78', fontSize: '14px' }} />
                                  {item.FromPlace}
                                </td>
                                <td className="py-3" style={{ color: '#4a5568' }}>
                                  <FaFlagCheckered className="me-2" style={{ color: '#ed8936', fontSize: '14px' }} />
                                  {item.ToPlace}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="text-center p-5">
                                <FaRoute className="mb-3" style={{ fontSize: '48px', color: '#cbd5e0' }} />
                                <p className="text-muted mb-3">No roots found</p>
                                <button
                                  className="btn"
                                  onClick={handleCreateNew}
                                  style={{ borderRadius: '5px', padding: '10px 24px', background: primaryColor, border: 'none', color: 'white', fontSize: '14px' }}
                                >
                                  <FaPlus className="me-2" />Create New Root
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
            /* ── FORM VIEW ── */
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              {/* Form Header */}
              <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-0" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <h4 className="m-0" style={{ color: '#2d3748', fontWeight: '600', fontSize: '18px' }}>
                  <FaRoute className="me-2" style={{ color: primaryColor }} />
                  {Root.RootId ? 'Edit Root' : 'New Root'}
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

                    {/* Root Info Card */}
                    <div className="col-md-6">
                      <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '10px' }}>
                        <div className="card-header bg-white" style={{ borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: primaryColor }}>
                          <FaSitemap className="me-2" />Root Information
                        </div>
                        <div className="card-body p-3">
                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">Root Name <span className="text-danger">*</span></label>
                            <input
                              type="text"
                              name="RootName"
                              className="form-control"
                              value={Root.RootName}
                              onChange={handleInputChange}
                              placeholder="Enter root name"
                              required
                            />
                          </div>
                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">Place Name <span className="text-danger">*</span></label>
                            <input
                              type="text"
                              name="PlaceName"
                              className="form-control"
                              value={Root.PlaceName}
                              onChange={handleInputChange}
                              placeholder="Enter place name"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Route Details Card */}
                    <div className="col-md-6">
                      <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '10px' }}>
                        <div className="card-header bg-white" style={{ borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: primaryColor }}>
                          <FaRoute className="me-2" />Route Details
                        </div>
                        <div className="card-body p-3">
                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">From Place <span className="text-danger">*</span></label>
                            <input
                              type="text"
                              name="FromPlace"
                              className="form-control"
                              value={Root.FromPlace}
                              onChange={handleInputChange}
                              placeholder="Enter starting point"
                              required
                            />
                          </div>
                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">To Place <span className="text-danger">*</span></label>
                            <input
                              type="text"
                              name="ToPlace"
                              className="form-control"
                              value={Root.ToPlace}
                              onChange={handleInputChange}
                              placeholder="Enter destination"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="row mt-4">
                    <div className="col-12">
                      <div className="d-flex justify-content-center flex-wrap gap-3">
                        <button type="submit" className="btn px-4 d-flex align-items-center gap-2" style={btnStyle} disabled={isSubmitDisabled || loadingSubmit}>
                          {loadingSubmit ? <><span className="spinner-border spinner-border-sm" role="status" />Creating...</> : <><FaSave /> Submit</>}
                        </button>
                        <button type="button" className="btn px-4 d-flex align-items-center gap-2" style={btnStyle} disabled={isUpdateDisabled || loadingUpdate} onClick={handleUpdate}>
                          {loadingUpdate ? <><span className="spinner-border spinner-border-sm" role="status" />Updating...</> : <><FaEdit /> Update</>}
                        </button>
                        <button type="button" className="btn px-4 d-flex align-items-center gap-2" style={btnStyle} disabled={isDeleteDisabled || loadingDelete} onClick={handleDelete}>
                          {loadingDelete ? <><span className="spinner-border spinner-border-sm" role="status" />Deleting...</> : <><FaTrashAlt /> Delete</>}
                        </button>
                        <button type="button" className="btn px-4 d-flex align-items-center gap-2" style={btnStyle} onClick={handleClear}>
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

export default RootMasterForm;