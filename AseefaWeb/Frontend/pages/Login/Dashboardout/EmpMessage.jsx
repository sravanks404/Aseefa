import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../apiService";

function WebMaster() {
      const [message, setMessage] = useState('');
      const [error, setError] = useState('');
      const tableRef = useRef(null);
      const [branches, setbranches] = useState([]);
      const [loading, setLoading] = useState(false);
      const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
      const [isUpdateDisabled, setIsUpdateDisabled] = useState(false);
      const [isDeleteDisabled, setIsDeleteDisabled] = useState(false);
      const [loadingSubmit, setLoadingSubmit] = useState(false);
      const [loadingUpdate, setLoadingUpdate] = useState(false);
      const [loadingDelete, setLoadingDelete] = useState(false);
      const [duplicateError, setDuplicateError] = useState('');
      const [users, setUsers] = useState([]);


      const [route, setroute] = useState({
            MID: 0,
            Message: "",
            UserID: "",
            MDate: "",
            Empid: "",
            CompanyID: "",
            CreatedBy: "",
            CreatedDate: "",
            ModifiedBy: "",
            ModifiedDate: "",
            DeletedBy: "",
            DeletedDate: "",
            IsDeleted: "",
      });
      const [routeData, setrouteData] = useState([]);
      const [routeDataget, setrouteDataget] = useState([]);
      const [searchTerm, setSearchTerm] = useState('');

      const [nameError, setNameError] = useState('');


      const fetchempdata = async () => {
            try {
                  const CompanyID = sessionStorage.getItem("CompanyID");

                  if (!CompanyID) {
                        console.error("CompanyID not found in sessionStorage");
                        return;
                  }

                  const response = await api.get("/api/GetUsers", {
                        params: { CompanyID },
                  });

                  const data = response.data.map((item) => ({
                        ...item,
                        employeeid: item.UserID || "",
                        USERNAME: item.USERNAME || "",
                  }));

                  // Set the employee data in the state
                  setrouteData(data);
                  setIsSubmitDisabled(false);
                  setIsUpdateDisabled(true);
                  setIsDeleteDisabled(true);
            } catch (error) {
                  console.error("Error fetching employee data:", error);
            }
      };

      const fetchData = async () => {
            // Get CompanyID and Empid from sessionStorage
            const CompanyID = sessionStorage.getItem('CompanyID');  // Retrieve CompanyID from sessionStorage
            const Empid = sessionStorage.getItem('UserId');          // Retrieve Empid from sessionStorage
      const activeUserId  = sessionStorage.getItem("activeUserId");

            // Check if values are retrieved

            if (!CompanyID || !Empid) {
                  console.error('CompanyID and Empid are required from sessionStorage');
                  return;
            }

            try {
                  // Pass CompanyID and Empid as query parameters in the API request
                  const response = await api.get(`/api/GetWebEmpMessage?CompanyID=${CompanyID}&activeUserId=${activeUserId}`);
                  const data = response.data.map((item) => ({
                        ...item,
                        Message: item.Message || '',
                        UserID: item.UserID || '',
                        MDate: item.MDate || '',
                        CompanyID: item.CompanyID || '',
                        
                  }));

                  setrouteDataget(data);

                  setIsSubmitDisabled(false); // Enable submit button
                  setIsUpdateDisabled(true);  // Disable update button
                  setIsDeleteDisabled(true);  // Disable delete button
            } catch (error) {
                  console.error('Error fetching route data:', error);
            }
      };
      useEffect(() => {
            fetchData();
            fetchBranch();
            fetchempdata();
      }, []);

      const validateForm = () => {
            // Check if all fields are filled
            const { Message } = route;
            if (!Message) {
                  setError('Employee Message Name is  required.');
                  return false;
            }
            setError('');
            return true;
      };

      const fetchBranch = async () => {
            try {
                  // Fetch CompanyID from sessionStorage
                  const CompanyID = sessionStorage.getItem('CompanyID');

                  if (!CompanyID) {
                        console.error('CompanyID is missing in sessionStorage');
                        return;
                  }

                  // Make the GET request with CompanyID as a query parameter
                  const response = await api.get(`/api/GetWebEmpMessage`, {
                        params: { CompanyID: CompanyID }
                  });

                  setbranches(response.data); // Assuming setbranches is a state setter function
            } catch (error) {
                  console.error('Error fetching branch:', error);
            }
      };
      ;

      const handleSubmit = async (e) => {
            e.preventDefault();

            // Validate form before submitting
            if (!validateForm()) return;

            // Get CompanyID and Empid from sessionStorage
            const CompanyID = sessionStorage.getItem('CompanyID');
            const Empid = sessionStorage.getItem('UserId');

            if (!CompanyID || !Empid) {
                  console.error('CompanyID and Empid are required from sessionStorage');
                  return;
            }

            // Prepare data to submit
            const newroute = {
                  MID: 0, // Indicate a new record
                  Message: route.Message,
                  UserID: route.UserID,
                  MDate: route.MDate,
                  CompanyID: CompanyID, // Include CompanyID from sessionStorage
                  CreatedBy: Empid, // Include Empid from sessionStorage
                  CreatedDate: new Date().toISOString()
            };


            try {
                  setLoading(true); // Start loading before the request
                  const response = await api.post('/api/InsertUpdateWebEmpMessage', newroute);

                  // Set the success message before clearing or resetting the state
                  setMessage(response.data.message);
                  // alert('Employee Message information submitted successfully!');

                  // Reset form state
                  setroute({
                        MID: 0,
                        Message: '',
                        UserID: '',
                        MDate: '',
                        CompanyID: ''
                  });

                  handleClear();
                  await fetchData(); // Wait for the data to be fetched before scrolling

                  // Scroll to the table after data is fetched
                  if (tableRef.current) {
                        tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
            } catch (error) {
                  console.error('Error from server:', error.response ? error.response.data : error.message);
                  setError(error.response?.data?.error || 'An error occurred while registering');
                  alert('Failed to submit data!');
            } finally {
                  setLoading(false); // Stop loading after the request
                  setLoadingSubmit(true);
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  setLoadingSubmit(false);
            }
      };

      const handleUpdate = async (e) => {
            e.preventDefault();

            if (!validateForm()) return;

            // Retrieve CompanyID and Empid from sessionStorage
            const CompanyID = Number(sessionStorage.getItem('CompanyID'));
            const Empid = Number(sessionStorage.getItem('UserId'));

            // Check if CompanyID and Empid are valid
            if (isNaN(CompanyID) || isNaN(Empid)) {
                  setError('Invalid CompanyID or Empid');
                  return;
            }

            // Include CompanyID and Empid in the updated route data
            const updatedroute = {
                  ...route,
                  IsDeleted: 0,
                  ModifiedBy: Empid, // Using Empid from sessionStorage
                  ModifiedDate: new Date().toISOString(),
                  CompanyID,        // Add CompanyID
            };

            try {
                  setLoadingUpdate(true);
                  setError(''); // Clear previous error


                  const response = await api.post('/api/InsertUpdateWebEmpMessage', updatedroute);

                  setMessage(response.data.message);
                  // alert('Employee Message updated successfully!');

                  // Clear form state
                  setroute({
                        MID: 0,
                        Message: '',
                        UserID: '',
                        MDate: '',
                        CompanyID: '',
                  });
                  setTimeout(() => {
                        setMessage('');
                  }, 2000);

                  // Fetch updated data
                  await fetchData();

                  // Scroll to the table after data is fetched
                  if (tableRef.current) {
                        tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
            } catch (error) {
                  console.error('Update request error:', error);
                  setError(error.response ? error.response.data.message : error.message);
                  // Delay setting loading to false to let the error message be visible
                  setTimeout(() => {
                        setLoadingUpdate(false);
                  }, 2000);
            } finally {
                  if (!error) {
                        setLoadingUpdate(false);
                  }
            }
      };

      const handleDelete = async (e) => {
            e.preventDefault();
            setMessage('');

            // Retrieve CompanyID and Empid from sessionStorage
            const CompanyID = sessionStorage.getItem('CompanyID');
            const Empid = sessionStorage.getItem('UserId');

            if (!CompanyID || !Empid) {
                  console.error('CompanyID and Empid are required from sessionStorage');
                  return;
            }

            if (window.confirm('Are you sure you want to delete?')) {
                  try {
                        setLoadingDelete(true); // Set loading state before making the request

                        const response = await api.delete('/api/DeleteWebEmpMessage', {
                              data: {
                                    MID: parseInt(route.MID),
                                    CompanyID: parseInt(CompanyID), // Ensure CompanyID is a number
                                    DeletedBy: parseInt(Empid) // Ensure Empid is a number
                              }
                        });

                        setMessage(response.data.message);
                        alert('Employee Message deleted successfully!');
                        setroute({
                              MID: 0,
                              Message: '',
                              UserID: '',
                              MDate: '',
                              CompanyID: '',
                        });

                        // Clear the success message after 2 seconds
                        setTimeout(() => {
                              setMessage('');
                        }, 2000);

                        // Fetch updated route list
                        await fetchData();

                        // Scroll to the table after data is fetched
                        if (tableRef.current) {
                              tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                  } catch (error) {
                        console.error('Error from server:', error);
                        setError(error.response?.data?.message || 'An error occurred while deleting');
                        alert('Failed to delete data!');
                  } finally {
                        setLoadingDelete(false); // Stop loading after the request
                  }
            }
      };

      const handleClear = () => {
            setroute({
                  MID: 0,
                  Message: '',
                  UserID: '',
                  MDate: '',
                  CompanyID: '',
            });
            setSearchTerm(''); // Clear search term if needed
            setError(''); // Clear any existing error
            setMessage(''); // Clear any existing message
            setDuplicateError(''); // Clear duplicate error message
            setIsSubmitDisabled(true); // Disable submit button
            setIsUpdateDisabled(true); // Disable update button
            setIsDeleteDisabled(true); // Disable delete button
            fetchData(); // Fetch fresh data
      };

      const handleRowClick = (item) => {

            setroute({
                  MID: item.MID,
                  Message: item.Message,
                  UserID: item.UserID,
                  MDate: item.MDate ? item.MDate.split('T')[0] : '', // Ensure correct format
                  CompanyID: item.CompanyID,
            });


            setError('');
            setMessage(''); // Clear any success message

            window.scrollTo({ top: 0, behavior: 'smooth' });
            setIsSubmitDisabled(true);
            setIsUpdateDisabled(false);  // Enable update button
            setIsDeleteDisabled(false);  // Enable delete button
      };


      const handleInputChange = (e) => {
            const { name, value } = e.target;
            setroute((prevData) => ({
                  ...prevData,
                  [name]: value || ''
            }));

            if (name === 'RootName') {
                  const isDuplicate = isDuplicateName(value);
                  setDuplicateError(isDuplicate ? 'route name already exists. Please choose a different name.' : '');



            }
      };

      const searchTermLower = (searchTerm || '').toLowerCase(); // Convert search term to lowercase

      const filteredRouteData = routeDataget //  Ensure routeData is referenced
            .filter((item) => {
                  const USERNAME = item.USERNAME ? item.USERNAME.toLowerCase() : '';
                  return USERNAME.includes(searchTermLower);
            })
            .sort((a, b) => {
                  const aRoot = a.USERNAME ? a.USERNAME.toLowerCase() : '';
                  const bRoot = b.USERNAME ? b.USERNAME.toLowerCase() : '';

                  // Prioritize items that start with the search term
                  if (aRoot.startsWith(searchTermLower) && !bRoot.startsWith(searchTermLower)) return -1;
                  if (!aRoot.startsWith(searchTermLower) && bRoot.startsWith(searchTermLower)) return 1;

                  return aRoot.localeCompare(bRoot); // Default alphabetical sorting
            });




      return (
            <div className="page-wrapper">
                  <div className="container-xl">
                        <div className="page-header d-print-none mt-2">
                              <div className="row g-2 align-items-center">
                                    <div className="col">
                                          <h2 className="page-title">Employee Message</h2>
                                    </div>
                              </div>
                        </div>
                        <div className="page-body">
                              <div className="container-xl">
                                    {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
                                    {duplicateError && <div style={{ color: 'red', marginBottom: '10px' }}>{duplicateError}</div>}

                                    <div className="row row-cards">
                                          <div className="col-12">
                                                <div className="card">
                                                      <div className="card-body">
                                                            <form className="route-form" onSubmit={handleSubmit}>
                                                                  <div className="row">
                                                                        {/* Message Input */}
                                                                        <div className="col-md-4">
                                                                              <div className="form-group">
                                                                                    <label htmlFor="Message" className="form-label">Employee Message</label>
                                                                                    <input
                                                                                          type="text"
                                                                                          id="Message"
                                                                                          name="Message"
                                                                                          className="form-control"
                                                                                          value={route.Message}
                                                                                          onChange={handleInputChange}
                                                                                          placeholder="Enter employee message "  // Added placeholder
                                                                                    />
                                                                              </div>
                                                                        </div>


                                                                        {/* Date Input */}
                                                                        <div className="col-md-4">
                                                                              <div className="form-group">
                                                                                    <label htmlFor="MDate" className="form-label">Date</label>
                                                                                    <input
                                                                                          type="date"
                                                                                          id="MDate"
                                                                                          name="MDate"
                                                                                          className="form-control"
                                                                                          value={route.MDate}
                                                                                          onChange={handleInputChange}
                                                                                    />
                                                                              </div>
                                                                        </div>

                                                                        <div className="col-md-4">
                                                                              <div className="form-group">

                                                                                    <label htmlFor="Empid" className="form-label">User</label>
                                                                                    <select
                                                                                          id="UserID"
                                                                                          name="UserID"
                                                                                          className="form-control"
                                                                                          value={route.UserID || ""}  // Ensure the value is set correctly, even if empty
                                                                                          onChange={handleInputChange}
                                                                                    >
                                                                                          <option value="">Select User</option>

                                                                                          {routeData.map((web) => (
                                                                                                <option key={web.employeeid} value={web.employeeid}>
                                                                                                      {web.USERNAME}{/* Display both first and last name */}
                                                                                                </option>
                                                                                          ))}
                                                                                    </select>



                                                                              </div>
                                                                        </div>


                                                                  </div>

                                                                  {/* Buttons */}
                                                                  <div className="form-footer d-flex justify-content-center">
                                                                        <button type="submit" className="btn mx-1" disabled={loadingSubmit || isSubmitDisabled}>
                                                                              {loadingSubmit ? 'Submitting...' : 'Submit'}
                                                                        </button>
                                                                        <button type="button" className="btn mx-1" disabled={isUpdateDisabled || loadingUpdate} onClick={handleUpdate}>
                                                                              {loadingUpdate ? 'Updating...' : 'Update'}
                                                                        </button>
                                                                        <button type="button" className="btn mx-1" disabled={isDeleteDisabled || loadingDelete} onClick={handleDelete}>
                                                                              Delete
                                                                        </button>
                                                                        <button type="button" className="btn mx-1" onClick={handleClear}>
                                                                              Clear
                                                                        </button>
                                                                  </div>

                                                                  {error && <div className="alert alert-danger mt-3">{error}</div>}
                                                                  {message && <div className="alert alert-success mt-3">{message}</div>}
                                                            </form>
                                                      </div>
                                                </div>
                                          </div>

                                          {/* Route Data Table */}
                                          <div className="col-12 mt-3">
                                                <div className="col">
                                                      <div className="row">
                                                            <div className="col-12">
                                                                  <div className="card">
                                                                        <div className="card-header">
                                                                              <div className="col-md-3 ms-auto d-print-none">
                                                                                    <div className="form-group">
                                                                                          <input
                                                                                                type="text"
                                                                                                className="form-control"
                                                                                                placeholder="Search by user..."
                                                                                                value={searchTerm}
                                                                                                onChange={(e) => {
                                                                                                      setSearchTerm(e.target.value);
                                                                                                }}
                                                                                          />

                                                                                    </div>
                                                                              </div>
                                                                        </div>
                                                                        <div ref={tableRef} className="card-body">
                                                                              <table className="table table-bordered">
                                                                                    <thead>
                                                                                          <tr>
                                                                                                <th>Employee Message</th>
                                                                                                <th>Date</th>
                                                                                                <th>User</th>
                                                                                          </tr>
                                                                                    </thead>
                                                                                    <tbody>

                                                                                          {filteredRouteData.map((route) => (

                                                                                                <tr key={route.MID} onClick={() => handleRowClick(route)}>
                                                                                                      <td>{route.Message}</td>
                                                                                                      <td>
                                                                                                            {route.MDate
                                                                                                                  ? new Date(route.MDate).toLocaleDateString('en-GB').replace(/\//g, '-')  // Replaces '/' with '-'
                                                                                                                  : ''
                                                                                                            }
                                                                                                      </td>

                                                                                                      <td>{route.USERNAME}</td>
                                                                                                </tr>
                                                                                          ))}
                                                                                    </tbody>
                                                                              </table>
                                                                              {/* {filteredRouteData.length === 0 && (
                                                            <div className="alert alert-warning">No route found</div>
                                                        )} */}
                                                                        </div>
                                                                  </div>
                                                            </div>
                                                      </div>
                                                </div>
                                          </div>

                                    </div>
                              </div>
                        </div>
                  </div>
            </div>
      );


};

export default WebMaster;