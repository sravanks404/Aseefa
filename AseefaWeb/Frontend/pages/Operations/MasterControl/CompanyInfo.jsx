import React, { useState, useEffect } from 'react';
import api from '../../apiService';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { usePermission } from '../../../src/context/permissionContex';
import {
  FaBuilding, FaSearch, FaPlus, FaMapMarkerAlt, FaGlobe,
  FaMap, FaCity, FaMapPin, FaPhone, FaMobileAlt, FaEnvelope, 
  FaSave, FaEdit, FaTrashAlt, FaEraser, FaArrowLeft,
  FaFileInvoice, FaTag, FaImage, FaTimes
} from "react-icons/fa";

const primaryColor = 'rgb(45, 75, 169)';

const outlineBtn = {
  borderRadius: '5px', fontWeight: '500',
  background: 'transparent', border: `2px solid ${primaryColor}`,
  color: primaryColor, padding: '10px 20px', fontSize: '14px', minWidth: '120px'
};

function CompanyInfo() {
  const [loading, setLoading] = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);
  const [isDeleteDisabled, setIsDeleteDisabled] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showForm, setShowForm] = useState(false);

  const [company, setCompany] = useState({
    CompanyId: 0, TinNo: '', CstNo: '', CompanyName: '',
    CompanyCode: '', Address: '', TelephoneNo: '', MobileNo: '',
    Citty: '', state: '', District: '', Pincode: '',
    GSTinNo: '', Email: '', Logo: null
  });

  const [companyData, setCompanyData] = useState([]);
  const { getPermission, refreshPermissions } = usePermission();
  const permission = getPermission("COMPANY_INFO");
  const canView = !!permission?.CanView;
  const canAdd = !!permission?.CanAdd;
  const canEdit = !!permission?.CanEdit;
  const canDelete = !!permission?.CanDelete;

  useEffect(() => {
    refreshPermissions();
  }, []);

  useEffect(() => {
    if (canView) {
      fetchData();
    } else {
      setCompanyData([]);
      setShowForm(false);
    }
  }, [canView]);

  const fetchData = async () => {
    if (!canView) {
      setCompanyData([]);
      return;
    }
    try {
      setLoading(true);
      const response = await api.get("/api/getcompanyinfo");
      setCompanyData(response.data.data);
    } catch (err) {
      toast.error('Failed to fetch company data');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (item) => {
    if (!canView) {
      toast.error("You do not have permission to view company records.");
      return;
    }
    let logoBase64 = null;
    if (item.CompanyLogo) logoBase64 = `data:image/jpeg;base64,${item.CompanyLogo}`;
    setCompany({ ...item, MobileNo: item.MobileNO, CstNo: item.CSTNo, state: item.State, Pincode: item.Pincode, Logo: null });
    setLogoPreview(logoBase64);
    setIsSubmitDisabled(true);
    setIsUpdateDisabled(false);
    setIsDeleteDisabled(false);
    setShowForm(true);
  };

  const isDuplicateCompany = (name, currentId = 0) => {
  return companyData.some(
    (c) =>
      c.CompanyName?.toLowerCase().trim() === name.toLowerCase().trim() &&
      c.CompanyId !== currentId
  );
};

 const handleSubmit = async (e) => {
  e.preventDefault();

  if (!canAdd) {
    toast.error("You do not have permission to create company records.");
    return;
  }

  const requiredFields = ['CompanyName', 'GSTinNo', 'Email', 'Address', 'Citty', 'state', 'District', 'Pincode'];
  let hasErrors = false;
  const errors = {};

  requiredFields.forEach((field) => {
    const error = getValidationError(field, company[field]);
    if (error) {
      errors[field] = error;
      hasErrors = true;
    }
  });

  setFieldErrors(errors);

  if (hasErrors) {
    toast.error("Please fix the highlighted errors before submitting.");
    return;
  }

  // 🔴 Duplicate Company Name Validation
  if (isDuplicateCompany(company.CompanyName)) {
    toast.error("Company name already exists");
    return;
  }

  try {
    setLoadingSubmit(true);

    const formData = new FormData();
    const UserId = parseInt(sessionStorage.getItem("UserId"), 10);

    Object.entries(company).forEach(([key, value]) => {
      if (key !== 'Logo' && value !== null) {
        formData.append(key, value);
      }
    });

    if (company.Logo) {
      formData.append('Logo', company.Logo);
    }

    formData.append('CreatedBy', UserId);

    const response = await api.post('/api/insertcompany', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    if (response.data.success) {
      toast.success("Company inserted successfully.");
      fetchData();
      handleClear();
      setShowForm(false);
    } else {
      toast.error(response.data.error || 'Operation failed');
    }

  } catch (err) {
    toast.error(err.response?.data?.error || 'Request failed');
  } finally {
    setLoadingSubmit(false);
  }
};

const handleUpdate = async (e) => {
  e.preventDefault();

  if (!canEdit) {
    toast.error("You do not have permission to update company records.");
    return;
  }

  // 🔴 Duplicate Company Name Validation
  if (isDuplicateCompany(company.CompanyName, company.CompanyId)) {
    toast.error("Company name already exists");
    return;
  }

  try {
    setLoadingUpdate(true);
    toast.dismiss();

    const formData = new FormData();
    const UserId = sessionStorage.getItem("UserId");

    Object.entries(company).forEach(([key, value]) => {
      if (key !== 'Logo' && value !== null) {
        formData.append(key, value);
      }
    });

    if (company.Logo instanceof File) {
      formData.append('Logo', company.Logo);
    }

    formData.append('ModifiedBy', UserId);

    const response = await api.post('/api/insertcompany', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    if (response.data.success === true) {
      toast.success(response.data.message || "Company updated successfully");
      fetchData();
      handleClear();
      setShowForm(false);
    } else {
      toast.error(response.data.error || "Update failed");
    }

  } catch (err) {
    toast.error(err.response?.data?.error || "Update request failed");
  } finally {
    setLoadingUpdate(false);
  }
};

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCompany(prev => ({ ...prev, Logo: file }));
      setLogoPreview(URL.createObjectURL(file));
    }
  };

 const handleInputChange = (e) => {
  const { name, value } = e.target;
  let updatedValue = value;

  // Mobile → only digits max 10
  if (name === "MobileNo") {
    updatedValue = value.replace(/\D/g, "").slice(0, 10);
  }

    // Telephone → digits only
  if (name === "TelephoneNo") {
    updatedValue = value.replace(/\D/g, "").slice(0, 10);
  }

  // Pincode → digits only max 6
  if (name === "Pincode") {
    updatedValue = value.replace(/\D/g, "").slice(0, 6);
  }

  setCompany(prev => ({ ...prev, [name]: updatedValue }));
};

  const handleClear = () => {
    setCompany({
      CompanyId: 0, TinNo: '', CstNo: '', CompanyName: '', CompanyCode: '',
      Address: '', TelephoneNo: '', MobileNo: '', Citty: '', state: '',
      District: '', Pincode: '', CreatedDate: '', ModifiedBy: '', ModifiedDate: '',
      DeletedBy: '', DeletedDate: '', GSTinNo: '', Email: '', Logo: null
    });
    setLogoPreview(null);
    setIsSubmitDisabled(false);
    setIsUpdateDisabled(true);
    setIsDeleteDisabled(true);
    setFieldErrors({});
    toast.dismiss();
  };

  const handleBackToList = () => { setShowForm(false); handleClear(); fetchData(); };
  const handleCreateNew = () => {
    if (!canAdd) {
      toast.error("You do not have permission to create company records.");
      return;
    }
    handleClear();
    setShowForm(true);
  };

  const confirmDeleteToast = () => {
    return new Promise((resolve) => {
      const toastId = toast.warning(
        ({ closeToast }) => (
          <div>
            <div className="mb-2">Are you sure you want to delete this company?</div>
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

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error("You do not have permission to delete company records.");
      return;
    }
    if (!company.CompanyId) { toast.error("No company selected"); return; }
    const confirm = await confirmDeleteToast();
    if (!confirm) return;
    try {
      setLoadingDelete(true);
      const DeletedBy = parseInt(sessionStorage.getItem("UserId"));
      const response = await api.post('/api/deletecompany', {
        CompanyId: company.CompanyId, DeletedBy, DeletedDate: new Date().toISOString()
      });
      if (response.data.success) {
        toast.success(response.data.message);
        fetchData(); handleClear(); setShowForm(false);
      } else {
        toast.error(response.data.message || "Delete failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete error");
    } finally {
      setLoadingDelete(false);
    }
  };

  const getValidationError = (name, value) => {
    let error = "";
    switch (name) {
      case "CompanyName": if (value?.trim().length < 3) error = "Company Name must be at least 3 characters."; break;
      case "GSTinNo": if (!/^[0-9A-Z]{0,15}$/.test(value)) error = "GSTIN must be alphanumeric and up to 15 characters."; break;
      case "Email": if (value && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) error = "Invalid email address."; break;
      case "Citty": case "state": case "District": if (value && !/^[A-Za-z\s]+$/.test(value)) error = `${name} must contain only letters.`; break;
      case "Pincode": if (!/^[0-9]{6}$/.test(value)) error = "Pincode must be exactly 6 digits."; break;
      case "Address": if (value?.trim().length < 10) error = "Address must be at least 10 characters."; break;
      default: break;
    }
    return error;
  };

  const validateFieldImmediate = (name, value) => {
    const error = getValidationError(name, value);
    if (error) { toast.dismiss(name); toast.error(error, { toastId: name }); }
    else toast.dismiss(name);
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const filteredCompanyData = companyData.filter(item => {
    const s = searchTerm.toLowerCase();
    return (
      (item.CompanyName?.toLowerCase() || '').includes(s) ||
      (item.GSTinNo?.toLowerCase() || '').includes(s) ||
      (item.Email?.toLowerCase() || '').includes(s) ||
      (item.Address?.toLowerCase() || '').includes(s)
    );
  });

  /* ── shared input-group prefix ── */
  const prefix = (Icon) => (
    <span className="input-group-text text-white" style={{ backgroundColor: primaryColor }}>
      <Icon />
    </span>
  );

  if (!canView) {
    return (
      <div className="page-wrapper" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        <div className="page-body mt-1">
          <div className="container-fluid px-4">
            <div className="alert alert-danger mt-4">
              You do not have permission to view Company Info.
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                    Company Management
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
                          placeholder="Search companies..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={{ backgroundColor: '#fff', borderColor: '#e2e8f0', height: '45px', fontSize: '14px' }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn d-flex align-items-center gap-2"
                      onClick={handleCreateNew}
                      disabled={!canAdd}
                      style={{ borderRadius: '5px', padding: '8px 20px', background: primaryColor, border: 'none', color: 'white', height: '45px', whiteSpace: 'nowrap' }}
                    >
                      <FaPlus /> Create New
                    </button>
                  </div>
                </div>
              </div>

              {/* Company list card */}
              <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <div className="card-body p-0">
                  {loading ? (
                    <div className="text-center p-5">
                      <div className="spinner-border" role="status" style={{ color: primaryColor }}>
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-3 text-muted">Loading companies...</p>
                    </div>
                  ) : (
                    <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                      <table className="table table-hover mb-0">
                        <thead className="bg-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                          <tr>
                            <th className="py-3 px-4" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>Company Name</th>
                            <th className="py-3" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>Address</th>
                            <th className="py-3" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>Email</th>
                            <th className="py-3" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>Mobile</th>
                            <th className="py-3" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>GSTIN</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCompanyData.length > 0 ? filteredCompanyData.map(item => (
                            <tr
                              key={item.CompanyId}
                              onClick={() => handleRowClick(item)}
                              style={{
                                cursor: 'pointer', transition: 'all 0.2s',
                                borderLeft: company.CompanyId === item.CompanyId ? `4px solid ${primaryColor}` : '4px solid transparent'
                              }}
                              className="align-middle"
                            >
                              <td className="py-3 px-4">
                                <div className="d-flex align-items-center">
                                  {item.CompanyLogo ? (
                                    <img
                                      src={`data:image/jpeg;base64,${item.CompanyLogo}`}
                                      alt="logo"
                                      className="rounded-circle me-3"
                                      style={{ width: '36px', height: '36px', objectFit: 'contain', border: `1px solid #e2e8f0` }}
                                    />
                                  ) : (
                                    <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3"
                                      style={{ width: '36px', height: '36px' }}>
                                      <FaBuilding style={{ color: primaryColor, fontSize: '15px' }} />
                                    </div>
                                  )}
                                  <span className="fw-medium">{item.CompanyName}</span>
                                </div>
                              </td>
                              <td className="py-3" style={{ color: '#4a5568' }}>
                                <FaMapMarkerAlt className="me-2" style={{ color: '#48bb78', fontSize: '13px' }} />
                                {item.Address || 'N/A'}
                              </td>
                              <td className="py-3" style={{ color: '#4a5568' }}>
                                <FaEnvelope className="me-2" style={{ color: '#4299e1', fontSize: '13px' }} />
                                {item.Email || 'N/A'}
                              </td>
                              <td className="py-3" style={{ color: '#4a5568' }}>
                                <FaMobileAlt className="me-2" style={{ color: '#f56565', fontSize: '13px' }} />
                                {item.MobileNO || 'N/A'}
                              </td>
                              
                                <td className="py-3" style={{ fontSize: '13px', fontWeight: '500' }}>
  {item.GSTinNo || 'N/A'}
</td>
                              
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan="5" className="text-center p-5">
                                <FaBuilding className="mb-3" style={{ fontSize: '48px', color: '#cbd5e0' }} />
                                <p className="text-muted mb-3">
                                  {companyData.length === 0 ? "No company records found." : "No matching companies found."}
                                </p>
                                <button className="btn" onClick={handleCreateNew}
                                  style={{ borderRadius: '5px', padding: '10px 24px', background: primaryColor, border: 'none', color: 'white', fontSize: '14px' }}>
                                  <FaPlus className="me-2" />Create New Company
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
                  {company.CompanyId ? 'Edit Company' : 'New Company'}
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

                    {/* Left card: Company Details */}
                    <div className="col-md-6">
                      <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '10px' }}>
                        <div className="card-header bg-white"
                          style={{ borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: primaryColor }}>
                          <FaBuilding className="me-2" />Company Details
                        </div>
                        <div className="card-body p-3">

                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">Company Name <span className="text-danger">*</span></label>
                            <div className="input-group">
                              {prefix(FaBuilding)}
                              <input type="text" className={`form-control ${fieldErrors['CompanyName'] ? 'is-invalid' : ''}`}
                                name="CompanyName" value={company.CompanyName} onChange={handleInputChange}
                                onBlur={(e) => validateFieldImmediate(e.target.name, e.target.value)}
                                placeholder="Enter company name" required />
                            </div>
                            {fieldErrors['CompanyName'] && <div className="invalid-feedback d-block">{fieldErrors['CompanyName']}</div>}
                          </div>

                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">GSTIN No <span className="text-danger">*</span></label>
                            <div className="input-group">
                              {prefix(FaFileInvoice)}
                              <input
  type="text"
  className={`form-control ${fieldErrors['GSTinNo'] ? 'is-invalid' : ''}`}
  name="GSTinNo"
  value={company.GSTinNo}
  onChange={(e) => {
    const value = e.target.value.toUpperCase(); // force uppercase
    setCompany(prev => ({ ...prev, GSTinNo: value }));
  }}
  onBlur={(e) => validateFieldImmediate(e.target.name, e.target.value)}
  placeholder="Enter 15-digit GSTIN"
  maxLength="15"
  required
/>
                            </div>
                            {fieldErrors['GSTinNo'] && <div className="invalid-feedback d-block">{fieldErrors['GSTinNo']}</div>}
                          </div>

                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <label className="form-label fw-medium mb-2">Mobile No <span className="text-danger">*</span></label>
                              <div className="input-group">
                                {prefix(FaMobileAlt)}
                                <input type="tel" className="form-control" name="MobileNo"
                                  value={company.MobileNo} onChange={handleInputChange}
                                  placeholder="Mobile number" maxLength="10" required />
                              </div>
                            </div>
                            <div className="col-md-6 mb-3">
                              <label className="form-label fw-medium mb-2">Telephone No</label>
                              <div className="input-group">
                                {prefix(FaPhone)}
                                <input type="tel" className="form-control" name="TelephoneNo"
                                  value={company.TelephoneNo} onChange={handleInputChange}
                                  placeholder="Telephone number" />
                              </div>
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">Email <span className="text-danger">*</span></label>
                            <div className="input-group">
                              {prefix(FaEnvelope)}
                              <input type="email" className={`form-control ${fieldErrors['Email'] ? 'is-invalid' : ''}`}
                                name="Email" value={company.Email} onChange={handleInputChange}
                                onBlur={(e) => validateFieldImmediate(e.target.name, e.target.value)}
                                placeholder="Enter email address" required />
                            </div>
                            {fieldErrors['Email'] && <div className="invalid-feedback d-block">{fieldErrors['Email']}</div>}
                          </div>

                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">CST No</label>
                            <div className="input-group">
                              {prefix(FaTag)}
                              <input type="text" className="form-control" name="CstNo"
                                value={company.CstNo} onChange={handleInputChange}
                                placeholder="Enter CST number" />
                            </div>
                          </div>

                         

                        </div>
                      </div>
                    </div>

                    {/* Right card: Location */}
                    <div className="col-md-6">
                      <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '10px' }}>
                        <div className="card-header bg-white"
                          style={{ borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: primaryColor }}>
                          <FaMapMarkerAlt className="me-2" />Location Details
                        </div>
                        <div className="card-body p-3">

                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">Address <span className="text-danger">*</span></label>
                            <textarea
                              className={`form-control ${fieldErrors['Address'] ? 'is-invalid' : ''}`}
                              name="Address" value={company.Address} onChange={handleInputChange}
                              onBlur={(e) => validateFieldImmediate(e.target.name, e.target.value)}
                              rows="3" required placeholder="Enter complete address"
                              style={{ resize: 'none' }} />
                            {fieldErrors['Address'] && <div className="invalid-feedback d-block">{fieldErrors['Address']}</div>}
                          </div>

                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <label className="form-label fw-medium mb-2">City <span className="text-danger">*</span></label>
                              <div className="input-group">
                                {prefix(FaCity)}
                                <input type="text" className={`form-control ${fieldErrors['Citty'] ? 'is-invalid' : ''}`}
                                  name="Citty" value={company.Citty} onChange={handleInputChange}
                                  onBlur={(e) => validateFieldImmediate(e.target.name, e.target.value)}
                                  placeholder="City" required />
                              </div>
                              {fieldErrors['Citty'] && <div className="invalid-feedback d-block">{fieldErrors['Citty']}</div>}
                            </div>
                            <div className="col-md-6 mb-3">
                              <label className="form-label fw-medium mb-2">District <span className="text-danger">*</span></label>
                              <div className="input-group">
                                {prefix(FaMapPin)}
                                <input type="text" className={`form-control ${fieldErrors['District'] ? 'is-invalid' : ''}`}
                                  name="District" value={company.District} onChange={handleInputChange}
                                  onBlur={(e) => validateFieldImmediate(e.target.name, e.target.value)}
                                  placeholder="District" required />
                              </div>
                              {fieldErrors['District'] && <div className="invalid-feedback d-block">{fieldErrors['District']}</div>}
                            </div>
                          </div>

                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <label className="form-label fw-medium mb-2">State <span className="text-danger">*</span></label>
                              <div className="input-group">
                                {prefix(FaMap)}
                                <input type="text" className={`form-control ${fieldErrors['state'] ? 'is-invalid' : ''}`}
                                  name="state" value={company.state} onChange={handleInputChange}
                                  onBlur={(e) => validateFieldImmediate(e.target.name, e.target.value)}
                                  placeholder="State" required />
                              </div>
                              {fieldErrors['state'] && <div className="invalid-feedback d-block">{fieldErrors['state']}</div>}
                            </div>
                            <div className="col-md-6 mb-3">
                              <label className="form-label fw-medium mb-2">Pincode <span className="text-danger">*</span></label>
                              <div className="input-group">
                                {prefix(FaEnvelope)}
                                <input type="text" className={`form-control ${fieldErrors['Pincode'] ? 'is-invalid' : ''}`}
                                  name="Pincode" value={company.Pincode} onChange={handleInputChange}
                                  onBlur={(e) => validateFieldImmediate(e.target.name, e.target.value)}
                                  placeholder="6-digit pincode" maxLength="6" required />
                              </div>
                              {fieldErrors['Pincode'] && <div className="invalid-feedback d-block">{fieldErrors['Pincode']}</div>}
                            </div>
                          </div>

 {/* Logo Upload */}
                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">
                              <FaImage className="me-1" />Company Logo
                            </label>
                            <div className="d-flex align-items-center gap-3">
                              <input type="file" className="form-control" accept="image/*"
                                onChange={handleFileChange} style={{ flex: 1 }} />
                              {logoPreview && (
                                <div className="position-relative" style={{ flexShrink: 0 }}>
                                  <img src={logoPreview} alt="Logo preview"
                                    style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '8px', border: `1px solid #e2e8f0`, padding: '4px', backgroundColor: '#f8fafc' }} />
                                  <button type="button"
                                    onClick={() => { setLogoPreview(null); setCompany(prev => ({ ...prev, Logo: null })); }}
                                    style={{ position: 'absolute', top: '-8px', right: '-8px', width: '20px', height: '20px', borderRadius: '50%', border: 'none', background: '#e53e3e', color: 'white', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                                    <FaTimes />
                                  </button>
                                </div>
                              )}
                            </div>
                            <small className="text-muted mt-1 d-block" style={{ fontSize: '12px' }}>
                              Recommended: Square image, max 2MB
                            </small>
                          </div>

{/* 
                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">TIN No</label>
                            <div className="input-group">
                              {prefix(FaFileInvoice)}
                              <input type="text" className="form-control" name="TinNo"
                                value={company.TinNo} onChange={handleInputChange}
                                placeholder="Enter TIN number" />
                            </div>
                          </div> */}
{/* 
                          <div className="mb-3">
                            <label className="form-label fw-medium mb-2">Company Code</label>
                            <div className="input-group">
                              {prefix(FaTag)}
                              <input type="text" className="form-control" name="CompanyCode"
                                value={company.CompanyCode} onChange={handleInputChange}
                                placeholder="Enter company code" />
                            </div>
                          </div> */}

                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="row mt-4">
                    <div className="col-12">
                      <div className="d-flex justify-content-center flex-wrap gap-3">

                        <button type="submit" className="btn px-4 d-flex align-items-center gap-2"
                          style={outlineBtn} disabled={isSubmitDisabled || loadingSubmit || !canAdd}>
                          {loadingSubmit
                            ? <><span className="spinner-border spinner-border-sm" /> Submitting...</>
                            : <><FaSave /> Submit</>}
                        </button>

                        <button type="button" className="btn px-4 d-flex align-items-center gap-2"
                          style={outlineBtn} disabled={isUpdateDisabled || loadingUpdate || !canEdit} onClick={handleUpdate}>
                          {loadingUpdate
                            ? <><span className="spinner-border spinner-border-sm" /> Updating...</>
                            : <><FaEdit /> Update</>}
                        </button>

                        <button type="button" className="btn px-4 d-flex align-items-center gap-2"
                          style={outlineBtn} disabled={isDeleteDisabled || loadingDelete || !canDelete} onClick={handleDelete}>
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

export default CompanyInfo;