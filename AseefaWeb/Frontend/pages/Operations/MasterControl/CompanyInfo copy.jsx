import React, { useState, useEffect } from 'react';
import api from '../../apiService';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function CompanyInfo() {
    const [message, setMessage] = useState('');
    const [error, seterror] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
    const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);
    const [isDeleteDisabled, setIsDeleteDisabled] = useState(true);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [logoPreview, setLogoPreview] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});


    const [company, setCompany] = useState({
        CompanyId: 0,
        TinNo: '',
        CstNo: '',
        CompanyName: '',
        CompanyCode: '',
        Address: '',
        TelephoneNo: '',
        MobileNo: '',
        Citty: '',
        state: '',
        District: '',
        GSTinNo: '',
        Email: '',
        Logo: null
    });

    const [companyData, setCompanyData] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get("/api/getcompanyinfo");
            setCompanyData(response.data.data);  // Fix: access actual data array
        } catch (err) {
            console.error("Fetch error:", err);
            toast.error('Failed to fetch company data');
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (item) => {
        let logoBase64 = null;

        if (item.CompanyLogo) {
            // Assume it's a JPEG. You can dynamically detect this from backend if needed.
            logoBase64 = `data:image/jpeg;base64,${item.CompanyLogo}`;
        }

        setCompany({
            ...item,
            MobileNo: item.MobileNO,
            CstNo: item.CSTNo,
            state: item.State,
            Logo: null // Reset file input
        });

        setLogoPreview(logoBase64); // 👈 This updates the image preview
        setIsSubmitDisabled(true);
        setIsUpdateDisabled(false);
        setIsDeleteDisabled(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };


 const handleSubmit = async (e) => {
    e.preventDefault();

    // Step 1: Define required fields
    const requiredFields = [
        'CompanyName', 'GSTinNo', 'Email', 'Address',
        'Citty', 'state', 'District'
    ];

    let hasErrors = false;
    const errors = {};

    // Step 2: Validate each required field
    requiredFields.forEach((field) => {
        const value = company[field];
        const error = getValidationError(field, value); // your validation logic
        if (error) {
            errors[field] = error; // store for red border UI
            hasErrors = true;
        }
    });

    setFieldErrors(errors); // Set state to show red borders

    // Step 3: Stop if validation errors exist
if (hasErrors) {
        toast.error("Please fix the highlighted errors before submitting.");
        return;
    }
    // Step 4: Proceed to submit if no errors
    try {
        const isUpdate = company.CompanyId !== 0;
        setLoadingSubmit(true);
        setMessage('');

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
            setMessage(response.data.message);
            fetchData();
            toast.success("Company inserted successfully.");
            if (!isUpdate) resetForm();
            handleClear();
        } else {
            toast.error(response.data.error || 'Operation failed');
        }
    } catch (err) {
        toast.error(err.response?.data?.error || 'Request failed');
        console.error(err);
    } finally {
        setLoadingSubmit(false);
    }
};




    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            setLoadingSubmit(true);
            toast.dismiss(); // optional, clears existing toasts

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
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });


            if (response.data.success == true) {
                toast.success(response.data.message || "Company updated successfully");
                fetchData();
            } else {
                toast.error(response.data.error || "Update failed");
            }
            handleClear()
        } catch (err) {
            toast.error(err.response?.data?.error || "Update request failed");
            console.error(err);
        } finally {
            setLoadingSubmit(false);
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
        setCompany(prev => ({ ...prev, [name]: value }));
      
    };

    const handleClear = () => {
        setCompany({
            CompanyId: 0,
            TinNo: '',
            CstNo: '',
            CompanyName: '',
            CompanyCode: '',
            Address: '',
            TelephoneNo: '',
            MobileNo: '',
            Citty: '',
            state: '',
            District: '',

            CreatedDate: '',
            ModifiedBy: '',
            ModifiedDate: '',
            DeletedBy: '',
            DeletedDate: '',
            GSTinNo: '',
            Email: '',
            Logo: null
        });
        setLogoPreview(null); // Clear the image preview
        setIsSubmitDisabled(false);
        setIsUpdateDisabled(true);
        setIsDeleteDisabled(true);
        fetchData();
        setFieldErrors(false)
    };



    const resetForm = () => {
        setCompany({
            CompanyId: 0,
            TinNo: '',
            CstNo: '',
            CompanyName: '',
            CompanyCode: '',
            Address: '',
            TelephoneNo: '',
            MobileNo: '',
            Citty: '',
            state: '',
            District: '',
            GSTinNo: '',
            Email: '',
            Logo: null
        });
        setLogoPreview(null);
        setIsSubmitDisabled(false);
        setIsUpdateDisabled(true);
        setIsDeleteDisabled(true);
    };

    const handleDelete = () => {
        if (!company.CompanyId) {
            toast.error("No company selected");
            return;
        }

        // Show custom confirmation toast
        toast.warn(
            ({ closeToast }) => (
                <div>
                    <p>Are you sure you want to delete this company?</p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                        <button
                            className='btn btn'
                            onClick={() => {
                                closeToast();
                                proceedToDelete();
                            }}
                            style={{ background: 'red', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}
                        >
                            Yes
                        </button>
                        <button
                            className='btn btn'
                            onClick={closeToast}
                            style={{ padding: '5px 10px', cursor: 'pointer' }}
                        >
                            No
                        </button>
                    </div>
                </div>
            ),
            { autoClose: false }
        );
    };

    const proceedToDelete = async () => {
        try {
            setLoadingDelete(true);
            setMessage('');
            // toast.info("Deleting company...");

            const DeletedBy = parseInt(sessionStorage.getItem("UserId"));
            const DeletedDate = new Date().toISOString();

            const response = await api.post('/api/deletecompany', {
                CompanyId: company.CompanyId,
                DeletedBy,
                DeletedDate
            });

            if (response.data.success) {
                toast.success(response.data.message);
                fetchData(); // refresh list
                resetForm();
            } else {
                toast.error(response.data.message || "Delete failed");
            }

        } catch (err) {
            toast.error(err.response?.data?.message || "Delete error");
            console.error(err);
        } finally {
            setLoadingDelete(false);
        }
    };

const getValidationError = (name, value) => {
    let error = "";

    switch (name) {
        case "CompanyName":
            if (value.trim().length < 3) error = "Company Name must be at least 3 characters.";
            break;
        case "GSTinNo":
            if (!/^[0-9A-Z]{0,15}$/.test(value)) error = "GSTIN must be alphanumeric and up to 15 characters.";
            break;
        // case "MobileNo":
        //     if (value && !/^\d{0,10}$/.test(value)) error = "Mobile No must be 10 digits.";
        //     break;
        // case "TelephoneNo":
        //     if (value && !/^\d{0,10}$/.test(value)) error = "Telephone No must be 10 digits.";
        //     break;
        case "Email":
            if (value && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) error = "Invalid email address.";
            break;
        case "Citty":
        case "state":
        case "District":
            if (value && !/^[A-Za-z\s]+$/.test(value)) error = `${name} must contain only letters.`;
            break;
        case "Address":
            if (value.trim().length < 10) error = "Address must be at least 10 characters.";
            break;
        default:
            break;
    }

    return error;
};


const validateFieldImmediate = (name, value) => {
  let error = "";

  switch (name) {
    case "CompanyName":
      if (value.trim().length < 3) error = "Company Name must be at least 3 characters.";
      break;
    case "GSTinNo":
      if (!/^[0-9A-Z]{0,15}$/.test(value)) error = "GSTIN must be alphanumeric and up to 15 characters.";
      break;
    // case "MobileNo":
    //   if (value && !/^\d{0,10}$/.test(value)) error = "Mobile No must be 10 digits.";
    //   break;
    // case "TelephoneNo":
    //   if (value && !/^\d{0,10}$/.test(value)) error = "Telephone No must be 10 digits.";
    //   break;
    case "Email":
      if (value && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) error = "Invalid email address.";
      break;
    case "Citty":
    case "state":
    case "District":
      if (value && !/^[A-Za-z\s]+$/.test(value)) error = `${name} must contain only letters.`;
      break;
    case "Address":
      if (value.trim().length < 10) error = "Address must be at least 10 characters.";
      break;
    default:
      break;
  }

  if (error) {
    toast.dismiss(name); // prevent duplicate toasts for same field
    toast.error(error, { toastId: name }); // use toastId to control per-field toasts
  }
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
};


    const filteredCompanyData = companyData.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        return (
            (item.CompanyName?.toLowerCase() || '').includes(searchLower) ||
            (item.CompanyCode?.toLowerCase() || '').includes(searchLower) ||
            (item.GSTinNo?.toLowerCase() || '').includes(searchLower) ||
            (item.Email?.toLowerCase() || '').includes(searchLower) ||
            (item.Address?.toLowerCase() || '').includes(searchLower) ||
            (item.MobileNO?.toLowerCase() || '').includes(searchLower) ||
            (item.TelephoneNo?.toLowerCase() || '').includes(searchLower)
        );
    });

    return (
        <div className="page-wrapper">
            <div className="container-xl">
                <div className="page-header d-print-none mt-2">
                    <div className="row g-2 align-items-center">
                        <div className="col">
                            <h2 className="page-title">Company Management</h2>
                        </div>
                    </div>
                </div>

                <div className="page-body mt-1">
                    <div className="container-xl">
                        <ToastContainer position="top-center" autoClose={3000} />


                        <div className="card mt-3">
                            <div className="card-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="container">
                                        <div className="row g-4">

                                            {/* Left Column - Company Details */}
                                            <div className="col-md-6">
                                                <div className="row gy-3">
                                                    {[
                                                        ['Company Name*', 'CompanyName', 'text', true],
                                                        // ['Company Code *', 'CompanyCode', 'text', true], // Removed
                                                        ['GSTIN No *', 'GSTinNo', 'text', true],
                                                        ['Mobile No *', 'MobileNo', 'tel', true],
                                                        ['Telephone No', 'TelephoneNo', 'tel', false],
                                                        ['Email *', 'Email', 'email', true],
                                                        ['CST No', 'CstNo', 'text', false],
                                                    ].map(([label, name, type, required]) => (
                                                        <div className="col-12 d-flex align-items-center" key={name}>
                                                            <label className="me-2 mb-0" style={{ width: '130px' }}>{label}</label>
                                                            <input
                                                                type={type}
                                                                 className={`form-control ${fieldErrors[name] ? 'is-invalid' : ''}`}
                                                                name={name}
                                                                style={{ height: '32px' }}
                                                                value={company[name]}
                                                                onChange={handleInputChange}
                                                                required={required}
                                                                onBlur={(e) => validateFieldImmediate(e.target.name, e.target.value)}

                                                            />
                                                           
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Right Column - Location and Logo */}
                                            <div className="col-md-6">
                                                <div className="row gy-3">
                                                    <div className="col-12 d-flex">
                                                        <label className="me-2 mb-0" style={{ width: '130px', paddingTop: '6px' }}>Address *</label>
                                                        <textarea
                                                            className={`form-control ${fieldErrors['Address'] ? 'is-invalid' : ''}`}
                                                            name="Address"
                                                            value={company.Address}
                                                            onChange={handleInputChange}
                                                            rows="3"
                                                            required
                                                            style={{ resize: 'none' }}
                                                              onBlur={(e) => validateFieldImmediate(e.target.name, e.target.value)}

                                                        />
                                                    </div>

                                                    {[
                                                        ['City *', 'Citty', true],
                                                        ['State *', 'state', true],
                                                        ['District *', 'District', true],
                                                    ].map(([label, name, required]) => (
                                                        <div className="col-12 d-flex align-items-center" key={name}>
                                                            <label className="me-2 mb-0" style={{ width: '130px' }}>{label}</label>
                                                            <input
                                                                type="text"
                                                                 className={`form-control ${fieldErrors[name] ? 'is-invalid' : ''}`}
                                                                name={name}
                                                                style={{ height: '32px' }}
                                                                value={company[name]}
                                                                onChange={handleInputChange}
                                                                required={required}
                                                                onBlur={(e) => validateFieldImmediate(e.target.name, e.target.value)}

                                                            />
                                                   
                                                        </div>
                                                    ))}

                                                    {/* Company Logo Upload */}
                                                    <div className="col-12 d-flex align-items-center">
                                                        <label className="me-2 mb-0" style={{ width: '130px' }}>Company Logo</label>
                                                        <div className="d-flex align-items-center w-100">
                                                            <input
                                                                type="file"
                                                                className="form-control"
                                                                accept="image/*"
                                                                onChange={handleFileChange}
                                                                style={{ height: '36px' }}
                                                            />
                                                            {logoPreview && (
                                                                <img
                                                                    src={logoPreview}
                                                                    alt="Logo preview"
                                                                    className="img-thumbnail ms-3"
                                                                    style={{ maxWidth: '80px', height: '80px', objectFit: 'contain' }}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Buttons */}
                                            <div className="col-12 mt-4">
                                                <div className="d-flex justify-content-center gap-3 flex-wrap">
                                                    {/* <button type="submit" className="btn btn" disabled={isSubmitDisabled || loadingSubmit}>
                                                        {loadingSubmit ? 'Submitting...' : 'Submit'}
                                                    </button> */}
                                                    <button type="button" className="btn btn" disabled={isUpdateDisabled || loadingUpdate} onClick={handleUpdate}>
                                                        {loadingUpdate ? 'Updating...' : 'Update'}
                                                    </button>
                                                    <button type="button" className="btn btn" disabled={isDeleteDisabled || loadingDelete} onClick={handleDelete}>
                                                        {loadingDelete ? 'Deleting...' : 'Delete'}
                                                    </button>
                                                    <button type="button" className="btn btn" onClick={handleClear}>
                                                        Clear
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>

                            </div>
                        </div>

                        {/* Add company list table here when GET endpoint is available */}
                        <div className="card mt-3">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h3 className="card-title mb-0">Company List</h3>
                                <div className="col-md-3">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search Company..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="card-body p-0">
                                {loading ? (
                                    <div className="text-center py-4">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        <table className="table table-bordered table-hover mb-0">
                                            <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                                <tr>
                                                    <th style={{ width: '20%' }}>Company Name</th>
                                                    {/* <th style={{ width: '20%' }}>Company Code</th> */}
                                                    <th style={{ width: '25%' }}>Address</th>
                                                    <th style={{ width: '20%' }}>GSTin No</th>
                                                    <th style={{ width: '15%' }}>Email</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredCompanyData.length > 0 ? (
                                                    filteredCompanyData.map(item => (
                                                        <tr
                                                            key={item.CompanyId}
                                                            onClick={() => handleRowClick(item)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <td>{item.CompanyName}</td>
                                                            {/* <td>{item.CompanyCode}</td> */}
                                                            <td>{item.Address}</td>
                                                            <td>{item.GSTinNo}</td>
                                                            <td>{item.Email}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="text-center">
                                                            {companyData.length === 0
                                                                ? "No company records found."
                                                                : "No matching companies found."}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CompanyInfo;