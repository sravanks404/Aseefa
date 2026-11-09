import React, { useState, useEffect } from 'react';
import api from '../../apiService';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function UserInfo() {
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
  const [previewImage, setPreviewImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  const [user, setUser] = useState({
    UserId: 0,
    Name: '',
    Sex: '',
    Address: '',
    Place: '',
    District: '',
    Mobile: '',
    Email: '',
    UserName: '',
    Password: '',
    ConformPassword: '',
    image: null,
    CompanyID: ''
  });

  const [userData, setUserData] = useState([]);

useEffect(() => {
  fetchData();
}, []);

const fetchData = async () => {
  try {
    setLoading(true);
    const CompanyID = sessionStorage.getItem("CompanyID");
    if (!CompanyID) {
      toast.error("CompanyID not found in sessionStorage");
      return;
    }

    const response = await api.get("/api/GetUsermaster", {
      params: { CompanyID },
    });

    // ✅ Safe buffer-to-base64 conversion (avoids spread operator on large arrays)
    const bufferToBase64 = (buffer) => {
      if (!buffer || !buffer.data) return null;
      const binary = buffer.data.map((byte) => String.fromCharCode(byte)).join("");
      return btoa(binary);
    };

    // Attach image property using safe base64 conversion
    const processedUsers = response.data.map((user) => ({
      ...user,
      image: bufferToBase64(user.IMAGE),
      IMAGE: undefined, // Remove raw buffer to avoid accidental re-use
    }));

    setUserData(processedUsers);
  } catch (err) {
    console.error("Fetch error:", err);
    toast.error("Failed to fetch user data");
  } finally {
    setLoading(false);
  }
};


  // Update handleRowClick to handle Buffer images
  const handleRowClick = (item) => {
    const imageBuffer = item.IMAGE;

    if (imageBuffer && imageBuffer.type === "Buffer" && Array.isArray(imageBuffer.data)) {
      const uint8Array = new Uint8Array(imageBuffer.data);
      const blob = new Blob([uint8Array], { type: 'image/jpeg' });

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result; // full data URL (with prefix)

        setUser({
          ...item,
          Address: item.Address1,
          Place: item.Address2,
          District: item.Address3,
          image: base64data, // ✅ store full base64 string
        });

        setCurrentImage(base64data); // ✅ preview directly
      };
      reader.readAsDataURL(blob);
    } else if (item.image && typeof item.image === 'string') {
      const base64WithPrefix = item.image.includes('base64,')
        ? item.image
        : `data:image/jpeg;base64,${item.image}`;

      setUser({
        ...item,
        Address: item.Address1,
        Place: item.Address2,
        District: item.Address3,
        image: base64WithPrefix, // ✅ always keep full base64
      });

      setCurrentImage(base64WithPrefix);
    } else {
      setUser({
        ...item,
        Address: item.Address1,
        Place: item.Address2,
        District: item.Address3,
        image: null
      });
      setCurrentImage(null);
    }

    setPreviewImage(null);
    setIsSubmitDisabled(true);
    setIsUpdateDisabled(false);
    setIsDeleteDisabled(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateFields() || {};
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([name, msg]) => {
        toast.dismiss(name);
        toast.warning(msg, { toastId: name });
      });
      return; // 🚫 Don't submit unless fully valid
    }

    try {
      setLoadingSubmit(true);
      setMessage('');
      //  toast.error('');

      const CompanyID = sessionStorage.getItem("CompanyID");
      const CreatedBy = sessionStorage.getItem("UserId");

      const newUser = {
        ...user,
        CreatedBy,
        CreatedDate: new Date().toISOString(),
        CompanyID: parseInt(CompanyID)
      };

      const response = await api.post('/api/InsertUpdateUser', newUser);

      if (response.data.success) {
        toast.success('User created successfully');
        fetchData();
        resetForm();
      } else {
        const failMsg = response.data.message || 'Operation failed';
        toast.error(failMsg);
        // toast.error(failMsg);
      }

      handleClear();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Request failed';
      //  toast.error(errMsg);
      //  toast.error(errMsg);
      console.error(err);
    } finally {
      setLoadingSubmit(false);
    }
  };



  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoadingUpdate(true);
    setMessage('');
    // toast.error('');

    try {
      const ModifiedBy = sessionStorage.getItem("UserId");

      const updatedUser = {
        ...user,
        ModifiedBy,
        ModifiedDate: new Date().toISOString()
      };

      // ✅ Do NOT strip base64 prefix
      if (!updatedUser.image || typeof updatedUser.image !== 'string') {
        delete updatedUser.image; // or keep as-is if backend retains old
      }

      // Validation
      if (!updatedUser.Name || !updatedUser.UserName) {
        toast.error('Name and Username are required');
        setLoadingUpdate(false);
        return;
      }

      const response = await api.post('/api/InsertUpdateUser', updatedUser);

      if (response.data.success) {
        toast.success('User updated successfully');
        fetchData();
        resetForm(); // optional
      } else {
        toast.error(response.data.message || 'Update failed');
      }
      handleClear();
    } catch (err) {
      error(err.response?.data?.message || 'Update request failed');
      console.error('Update error:', err);
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

  // Frontend: handleDelete function
  const handleDelete = async () => {

    if (!user.UserId) {
      toast.error("No user selected");
      return;
    }
    const confirm = await confirmDeleteToast(); // 🍞 wait for toast confirmation
    if (!confirm) return;

    try {
      setLoadingDelete(true);
      setMessage('');
      toast.dismiss(); // Clear any previous toasts

      const response = await api.post('/api/Deleteusers', {
        UserId: user.UserId,
        deletedBy: parseInt(sessionStorage.getItem("UserId"), 10)
      });

      if (response.data.success) {
        toast.success("User deleted successfully");
        fetchData();
        handleClear(); // Clear after successful deletion
      } else {
        toast.error(response.data.message || "Delete failed");
      }
    } catch (err) {
      error(err.response?.data?.message || "Delete error");
      console.error(err);
    } finally {
      setLoadingDelete(false);
    }
  };


  const resetForm = () => {
    setUser({
      UserId: 0,
      Name: '',
      Sex: '',
      Address: '',
      Place: '',
      District: '',
      Mobile: '',
      Email: '',
      UserName: '',
      Password: '',
      ConformPassword: '',
      image: null,
      CompanyID: ''
    });
    setIsSubmitDisabled(false);
    setIsUpdateDisabled(true);
    setIsDeleteDisabled(true);
    setPreviewImage(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result); // For preview only
      setUser(prev => ({ ...prev, image: reader.result })); // For submission
    };
    reader.readAsDataURL(file);
  };

  const filteredUsers = userData.filter(item =>
    item.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.Email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.Mobile.includes(searchTerm)
  );
  const handleClear = () => {
    resetForm();
    setCurrentImage(null);  // Clear current image preview
    setMessage('');
    fetchData();
    toast.dismiss();        // Clear all toasts (success, warning, error, etc.)
    setFieldErrors(false);
  };


  const validateFields = () => {
    const errors = {};

    if (!user.Name?.trim()) errors.Name = "Full Name is required";
    if (!user.Email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.Email)) errors.Email = "Valid Email is required";
    // if (!user.Mobile?.trim() || !/^\d{10}$/.test(user.Mobile)) errors.Mobile = "Valid 10-digit Mobile is required";
    if (user.UserId === 0 && !user.Password?.trim()) errors.Password = "Password is required";
    if (user.UserId === 0 && user.Password !== user.ConformPassword) errors.ConformPassword = "Passwords do not match";
    if (!user.Sex?.toString()) errors.Sex = "Gender is required";
    if (!user.UserName?.trim()) errors.UserName = "Username is required";

    return errors;
  };



  const validateField = (fieldName, value) => {
    let error = '';

    switch (fieldName) {
      case 'Name':
        if (!value.trim()) error = "Full Name is required";
        break;
      case 'Email':
        if (!value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Valid Email is required";
        break;
      // case 'Mobile':
      //   if (!value.trim() || !/^\d{10}$/.test(value)) error = "Valid 10-digit Mobile is required";
      //   break;
      case 'UserName':
        if (!value.trim()) error = "Username is required";
        break;
      case 'Password':
        if (user.UserId === 0 && !value.trim()) error = "Password is required";
        break;
      case 'ConformPassword':
        if (user.UserId === 0 && value !== user.Password) error = "Passwords do not match";
        break;
      case 'Sex':
        if (value === '') error = "Gender is required";
        break;
      default:
        break;
    }

    setFieldErrors(prev => ({ ...prev, [fieldName]: error }));

    if (error) {
      toast.dismiss(fieldName); // Avoid duplicate toasts
      toast.warning(error, { toastId: fieldName });
    }
  };
  return (
    <div className="page-wrapper">
      {/* Header remains similar */}
      <div className="page-body mt-1">
        <div className="container-xl">
          <ToastContainer position="top-center" autoClose={3000} />
          <div className="col">
            <h2 className="page-title">User Creation</h2>
          </div>
          <div className="card mt-3">

            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="container">
                  <div className="row">

                    {/* Left side: form fields with inline label-input, 2 fields per row */}
                    <div className="col-lg-8">
                      <div className="row g-3">

                        {/* Full Name */}
                        <div className="col-md-6">
                          <div className="row align-items-center g-0">
                            <label className="col-sm-4 col-form-label g-0" >
                              Full Name
                            </label>
                            <div className="col-sm-8">
                              <input
                                type="text"
                                className={`form-control ${fieldErrors.Name ? 'is-invalid' : ''}`}
                                style={{ height: '28px' }}
                                name="Name"
                                value={user.Name}
                                onChange={handleInputChange}
                                required
                                onBlur={(e) => validateField(e.target.name, e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Gender */}
                        <div className="col-md-6">
                          <div className="row align-items-center g-0">
                            <label className="col-sm-4 col-form-label g-0">
                              Gender
                            </label>
                            <div className="col-sm-8">
                              <select
                                className={`form-select ${fieldErrors.Sex ? 'is-invalid' : ''}`}
                                style={{ height: '34px', paddingTop: '2px', paddingBottom: '2px', lineHeight: '1.2' }}
                                name="Sex"
                                value={user.Sex === null || user.Sex === undefined ? "" : String(user.Sex)}
                                onChange={handleInputChange}
                                required
                                onBlur={(e) => validateField(e.target.name, e.target.value)}
                              >
                                <option value="">Select</option>
                                <option value="0">Male</option>
                                <option value="1">Female</option>
                                <option value="2">Other</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Email */}
                        <div className="col-md-6">
                          <div className="row align-items-center g-0">
                            <label className="col-sm-4 col-form-label g-0" >
                              Email
                            </label>
                            <div className="col-sm-8">
                              <input
                                type="email"
                                className={`form-control ${fieldErrors.Email ? 'is-invalid' : ''}`}
                                style={{ height: '28px' }}
                                name="Email"
                                value={user.Email}
                                onChange={handleInputChange}
                                required
                                onBlur={(e) => validateField(e.target.name, e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Address */}
                        <div className="col-md-6">
                          <div className="row align-items-center g-0">
                            <label className="col-sm-4 col-form-label g-0" >
                              Address
                            </label>
                            <div className="col-sm-8">
                              <input
                                type="text"
                                className="form-control"
                                style={{ height: '28px' }}
                                name="Address"
                                value={user.Address}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>

                        {/* District */}
                        <div className="col-md-6">
                          <div className="row align-items-center g-0">
                            <label className="col-sm-4 col-form-label g-0" >
                              District
                            </label>
                            <div className="col-sm-8">
                              <input
                                type="text"
                                className="form-control"
                                style={{ height: '28px' }}
                                name="District"
                                value={user.District}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Mobile */}
                        <div className="col-md-6">
                          <div className="row align-items-center g-0">
                            <label className="col-sm-4 col-form-label g-0" >
                              Mobile
                            </label>
                            <div className="col-sm-8">
                              <input
                                type="tel"
                                className={`form-control ${fieldErrors.Mobile ? 'is-invalid' : ''}`}
                                style={{ height: '28px' }}
                                name="Mobile"
                                value={user.Mobile}
                                onChange={handleInputChange}
                                required
                                onBlur={(e) => validateField(e.target.name, e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Password */}
                        <div className="col-md-6">
                          <div className="row align-items-center g-0">
                            <label className="col-sm-4 col-form-label g-0" >
                              Password
                            </label>
                            <div className="col-sm-8">
                              <input
                                type="password"
                                className={`form-control ${fieldErrors.Password ? 'is-invalid' : ''}`}
                                style={{ height: '28px' }}
                                name="Password"
                                value={user.Password}
                                onChange={handleInputChange}
                                required={user.UserId === 0}
                                onBlur={(e) => validateField(e.target.name, e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="col-md-6">
                          <div className="row align-items-center g-0">
                            <label className="col-sm-4 col-form-label g-0" >
                              Confirm Password
                            </label>
                            <div className="col-sm-8">
                              <input
                                type="password"
                                className={`form-control ${fieldErrors.ConformPassword ? 'is-invalid' : ''}`}
                                style={{ height: '28px' }}
                                name="ConformPassword"
                                value={user.ConformPassword}
                                onChange={handleInputChange}
                                required={user.UserId === 0}
                                onBlur={(e) => validateField(e.target.name, e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Place */}
                        <div className="col-md-6">
                          <div className="row align-items-center g-0">
                            <label className="col-sm-4 col-form-label g-0" >
                              Place
                            </label>
                            <div className="col-sm-8">
                              <input
                                type="text"
                                className="form-control"
                                style={{ height: '28px' }}
                                name="Place"
                                value={user.Place}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Username */}
                        <div className="col-md-6">
                          <div className="row align-items-center g-0">
                            <label className="col-sm-4 col-form-label g-0" >
                              Username
                            </label>
                            <div className="col-sm-8">
                              <input
                                type="text"
                                className={`form-control ${fieldErrors.UserName ? 'is-invalid' : ''}`}
                                style={{ height: '28px' }}
                                name="UserName"
                                value={user.UserName}
                                onChange={handleInputChange}
                                required
                                onBlur={(e) => validateField(e.target.name, e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Right side: Profile Card */}
                    <div className="col-lg-4">
                      <div className="card p-2">
                        <h5 className="card-title">Profile Image</h5>
                        <input
                          type="file"
                          className="form-control"
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                        {(previewImage || currentImage) && (
                          <div className="mt-3 text-center">
                            <img
                              src={previewImage || currentImage}
                              alt="Profile"
                              style={{
                                width: '80px',
                                maxHeight: '100px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Buttons */}
                  <div className="text-center mt-4">
                    <button
                      type="submit"
                      className="btn btn me-2"
                      disabled={isSubmitDisabled || loadingSubmit}
                    >
                      {loadingSubmit ? 'Submitting...' : 'Submit'}
                    </button>
                    <button
                      type="button"
                      className="btn btn me-2"
                      disabled={isUpdateDisabled || loadingUpdate}
                      onClick={handleUpdate}
                    >
                      {loadingUpdate ? 'Updating...' : 'Update'}
                    </button>
                    <button
                      type="button"
                      className="btn btn me-2"
                      disabled={isDeleteDisabled || loadingDelete}
                      onClick={handleDelete}
                    >
                      {loadingDelete ? 'Deleting...' : 'Delete'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={handleClear}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </form>






            </div>
          </div>

          <div className="card mt-3">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="card-title m-0">User List</h3>
              <input
                type="text"
                className="form-control  "
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ maxWidth: '250px' }}
              />
            </div>

            <div className="card-body">
              {/* Update table columns to show user data */}
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>Username</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.UserId} onClick={() => handleRowClick(user)}>
                      <td>{user.Name}</td>
                      <td>{user.Email}</td>
                      <td>{user.Mobile}</td>
                      <td>{user.UserName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserInfo;