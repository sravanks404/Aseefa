import React, { useState, useEffect } from 'react';
import api from '../../apiService';
import Select from "react-select";
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function PlaceMaster() {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
    const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);
    const [isDeleteDisabled, setIsDeleteDisabled] = useState(true);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [enableState, setEnableState] = useState(false);
    const [enableDistrict, setEnableDistrict] = useState(false);
    const [enableTaluk, setEnableTaluk] = useState(false);
    const [enableJunction, setEnableJunction] = useState(false);
    const [enableLevel, setEnableLevel] = useState(false);
    const [showStateModal, setShowStateModal] = useState(false);
    const [newStateName, setNewStateName] = useState('');
    const [showDistrictModal, setShowDistrictModal] = useState(false);
    const [showTalukModal, setShowTalukModal] = useState(false);
    const [showJunctionModal, setShowJunctionModal] = useState(false);
    const [newDistrictName, setNewDistrictName] = useState('');
    const [newTalukName, setNewTalukName] = useState('');
    const [newJunctionName, setNewJunctionName] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [editedPlaceName, setEditedPlaceName] = useState('');
    const [route, setRoute] = useState({
        PlID: 0,
        PlaceName: '',
        StateID: 0,
        DistrictID: 0,
        TalukID: 0,
        JunctionID: 0,
        LevelId: 0,
        CompanyID: 0,
        CreatedBy: 0
    });

    const [routeData, setRouteData] = useState([]);
    const [states, setStates] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [taluks, setTaluks] = useState([]);
    const [junctions, setJunctions] = useState([]);
    const [levels, setLevels] = useState([]);


    useEffect(() => {
        // Enable/disable logic based on field values
        setEnableState(route.PlaceName.trim() !== '');
        setEnableDistrict(route.StateID > 0);
        setEnableTaluk(route.DistrictID > 0);
        setEnableJunction(route.TalukID > 0);
        setEnableLevel(route.JunctionID > 0);
    }, [route]);

    useEffect(() => {
        fetchData();
        fetchDropdownData();
    }, []);


    const fetchData = async () => {
        try {
            setLoading(true);
            const CompanyID = sessionStorage.getItem("CompanyID");
            if (!CompanyID) {
               toast.error("CompanyID not found in sessionStorage");
                return;
            }
            // Update this API call to match your backend
            const response = await api.get("/api/WebGetPlaceMaster", { params: { CompanyID } });
            setRouteData(response.data);
        } catch (err) {
            console.error("Fetch error:", err);
            toast.error('Failed to fetch place data');
        } finally {
            setLoading(false);
        }
    };
    
    // Add useEffect hooks for dependent data
    useEffect(() => {
        if (route.StateID > 0) {
            const fetchDistricts = async () => {
                const CompanyID = sessionStorage.getItem("CompanyID");
                const districtsResponse = await api.get("/api/GetDistricts", {
                    params: { CompanyID, StateID: route.StateID }
                });
                setDistricts(districtsResponse.data.data);
            };
            fetchDistricts();
        }
    }, [route.StateID]);

    useEffect(() => {
        if (route.DistrictID > 0) {
            const fetchTaluks = async () => {
                const CompanyID = sessionStorage.getItem("CompanyID");
                const taluksResponse = await api.get("/api/GetTaluks", {
                    params: { CompanyID, DistrictID: route.DistrictID }
                });
                setTaluks(taluksResponse.data.data);
            };
            fetchTaluks();
        }
    }, [route.DistrictID]);

    useEffect(() => {
        if (route.TalukID > 0) {
            const fetchJunctions = async () => {
                const CompanyID = sessionStorage.getItem("CompanyID");
                const junctionsResponse = await api.get("/api/GetJunctions", {
                    params: { CompanyID, TalukID: route.TalukID }
                });
                setJunctions(junctionsResponse.data.data);
            };
            fetchJunctions();
        }
    }, [route.TalukID]);


    // const handleSubmit = async (e) => {
    //     e.preventDefault();
    //     try {
    //         setLoadingSubmit(true);
    //         setMessage('');
    //         setError('');

    //         const CreatedBy = sessionStorage.getItem("UserId");
    //         const CompanyID = sessionStorage.getItem("CompanyID");

    //         const newPlace = {
    //             PlID: 0, // 0 indicates new record
    //             PlaceName: route.PlaceName,
    //             StateID: route.StateID,
    //             DistrictID: route.DistrictID,
    //             TalukID: route.TalukID,
    //             JunctionID: route.JunctionID,
    //             LevelId: route.LevelId,
    //             CompanyID: CompanyID,
    //             CreatedBy: CreatedBy,
    //             ModifiedBy: null
    //         };

    //         const response = await api.post('/InsertupdatePlace', newPlace);

    //         if (response.data) {
    //             const newPlID = response.data.PlID;
    //             alert('Place created successfully');
    //             setMessage('Place created successfully');
    //             fetchData();
    //             resetForm();
    //         } else {
    //             setError('Operation failed');
    //         }
    //     } catch (err) {
    //         setError(err.response?.data?.error || 'Request failed');
    //         console.error(err);
    //     } finally {
    //         setLoadingSubmit(false);
    //     }
    // };

    // const handleUpdate = async (e) => {
    //     e.preventDefault();
    //     try {
    //         setLoadingUpdate(true);
    //         setMessage('');
    //         setError('');

    //         const ModifiedBy = sessionStorage.getItem("UserId");
    //         const CompanyID = sessionStorage.getItem("CompanyID");

    //         const updatedPlace = {
    //             PlID: route.PlID,
    //             PlaceName: route.PlaceName,
    //             StateID: route.StateID,
    //             DistrictID: route.DistrictID,
    //             TalukID: route.TalukID,
    //             JunctionID: route.JunctionID,
    //             LevelId: route.LevelId,
    //             CompanyID: CompanyID,
    //             CreatedBy: route.CreatedBy,
    //             ModifiedBy: ModifiedBy
    //         };

    //         const response = await api.post('/InsertupdatePlace', updatedPlace);

    //         if (response.data) {
    //             setMessage('Place updated successfully');
    //             fetchData();
    //         } else {
    //             setError('Update failed');
    //         }
    //     } catch (err) {
    //         setError(err.response?.data?.error || 'Update request failed');
    //         console.error(err);
    //     } finally {
    //         setLoadingUpdate(false);
    //     }
    // };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this place?")) return;

        try {
            setLoadingDelete(true);
            setMessage('');
            setError('');
            const DeletedBy = sessionStorage.getItem("UserId");

            // Update this API call to match your delete endpoint
            const response = await api.delete('/api/WebDeletePlaceMaster', {
                params: {
                    PlID: route.PlID,
                    DeletedBy: DeletedBy
                }
            });

            if (response.data.success) {
                toast.success('Place deleted successfully.')
                setMessage(response.data.message || 'Place deleted successfully.');
                fetchData();
                resetForm();
            } else {
                setError(response.data.message || 'Delete failed.');
            }
        } catch (err) {
            console.error('Delete error:', err);
            setError(err.response?.data?.message || 'Server error during delete.');
        } finally {
            setLoadingDelete(false);
        }
    };

    const handleNewStateClick = () => {
        setShowStateModal(true);
        setNewStateName('');
    };

    const handleNewDistrictClick = () => {
        setShowDistrictModal(true);
        setNewDistrictName('');
    };

    const handleNewTalukClick = () => {
        setShowTalukModal(true);
        setNewTalukName('');
    };

    const handleNewJunctionClick = () => {
        setShowJunctionModal(true);
        setNewJunctionName('');
    };
    const handleSaveNewState = async () => {
        try {
            const CompanyID = sessionStorage.getItem("CompanyID");
            const CreatedBy = sessionStorage.getItem("UserId");

            const response = await api.post('/api/InsertupdatePlace', {
                PlID: 0,
                PlaceName: newStateName.trim(),
                StateID: 0,
                DistrictID: 0,
                TalukID: 0,
                JunctionID: 0,
                LevelId: 1,  // Correct level for states
                CompanyID,
                CreatedBy
            });

            if (response.data) {
                // Refresh states dropdown
                const statesResponse = await api.get('/api/GetStates', { params: { CompanyID } });
                setStates(statesResponse.data.data);

                // Update form with new state
                setRoute(prev => ({
                    ...prev,
                    StateID: response.data.PlID, // New state ID from response
                    LevelId: 1 // Maintain correct level
                }));

                setShowStateModal(false);
               toast.success('State created successfully!');
            }
        } catch (err) {
            console.error('Error creating state:', err);
            toast.error('Failed to create state: ' + (err.response?.data?.error || 'Server error'));
        }
    };

    const handleSaveNewDistrict = async () => {
        try {
            const CompanyID = sessionStorage.getItem("CompanyID");
            const CreatedBy = sessionStorage.getItem("UserId");
            const StateID = route.StateID;

            const response = await api.post('/api/InsertupdatePlace', {
                PlID: 0,
                PlaceName: newDistrictName.trim(),
                StateID: StateID,
                DistrictID: 0,
                TalukID: 0,
                JunctionID: 0,
                LevelId: 2,  // District level
                CompanyID,
                CreatedBy
            });

            if (response.data) {
                const districtsResponse = await api.get('/api/GetDistricts', {
                    params: { CompanyID, StateID }
                });
                setDistricts(districtsResponse.data.data);
                setRoute(prev => ({
                    ...prev,
                    DistrictID: response.data.PlID,
                    LevelId: 2
                }));
                setShowDistrictModal(false);
                toast.success('District created successfully!');
            }
        } catch (err) {
            toast.error('Failed to create district: ' + (err.response?.data?.error || 'Server error'));
        }
    };

    const handleSaveNewTaluk = async () => {
        try {
            const CompanyID = sessionStorage.getItem("CompanyID");
            const CreatedBy = sessionStorage.getItem("UserId");
            const DistrictID = route.DistrictID;

            const response = await api.post('/api/InsertupdatePlace', {
                PlID: 0,
                PlaceName: newTalukName.trim(),
                StateID: route.StateID,
                DistrictID: DistrictID,
                TalukID: 0,
                JunctionID: 0,
                LevelId: 3,  // Taluk level
                CompanyID,
                CreatedBy
            });

            if (response.data) {
                const taluksResponse = await api.get('/api/GetTaluks', {
                    params: { CompanyID, DistrictID }
                });
                setTaluks(taluksResponse.data.data);
                setRoute(prev => ({
                    ...prev,
                    TalukID: response.data.PlID,
                    LevelId: 3
                }));
                setShowTalukModal(false);
                toast.success('Taluk created successfully!');
            }
        } catch (err) {
            toast.error('Failed to create taluk: ' + (err.response?.data?.error || 'Server error'));
        }
    };

    const handleSaveNewJunction = async () => {
        try {
            const CompanyID = sessionStorage.getItem("CompanyID");
            const CreatedBy = sessionStorage.getItem("UserId");
            const TalukID = route.TalukID;

            const response = await api.post('/api/InsertupdatePlace', {
                PlID: 0,
                PlaceName: newJunctionName.trim(),
                StateID: route.StateID,
                DistrictID: route.DistrictID,
                TalukID: TalukID,
                JunctionID: 0,
                LevelId: 4,  // Junction level
                CompanyID,
                CreatedBy
            });

            if (response.data) {
                const junctionsResponse = await api.get('/api/GetJunctions', {
                    params: { CompanyID, TalukID }
                });
                setJunctions(junctionsResponse.data.data);
                setRoute(prev => ({
                    ...prev,
                    JunctionID: response.data.PlID,
                    LevelId: 4
                }));
                setShowJunctionModal(false);
                toast.success('Junction created successfully!');
            }
        } catch (err) {
            toast.error('Failed to create junction: ' + (err.response?.data?.error || 'Server error'));
        }
    };
    // Uncomment and implement dropdown data fetching
    const fetchDropdownData = async () => {
        try {
            const CompanyID = sessionStorage.getItem("CompanyID");

            // States
            const statesResponse = await api.get("/api/GetStates", { params: { CompanyID } });
            setStates(statesResponse.data.data);

            // Districts
            if (route.StateID > 0) {
                const districtsResponse = await api.get("/api/GetDistricts", {
                    params: { CompanyID, StateID: route.StateID }
                });
                setDistricts(districtsResponse.data.data);
            }

            // Taluks
            if (route.DistrictID > 0) {
                const taluksResponse = await api.get("/api/GetTaluks", {
                    params: { CompanyID, DistrictID: route.DistrictID }
                });
                setTaluks(taluksResponse.data.data);
            }

            // Junctions
            if (route.TalukID > 0) {
                const junctionsResponse = await api.get("/api/GetJunctions", {
                    params: { CompanyID, TalukID: route.TalukID }
                });
                setJunctions(junctionsResponse.data.data);
            }

        } catch (err) {
            console.error("Fetch dropdown error:", err);
        }
    };
    const handlePlaceClick = (place) => {
        setSelectedPlace(place);
        setEditedPlaceName(place.PlaceName);
        setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setSelectedPlace(null);
        setEditedPlaceName('');
    };

    const handleSavePlaceChanges = async () => {
        try {
            const ModifiedBy = sessionStorage.getItem("UserId");
            const response = await api.post('/api/InsertupdatePlace', {
                PlID: selectedPlace.PlID,
                PlaceName: editedPlaceName.trim(),
                StateID: selectedPlace.StateID || null,
                DistrictID: selectedPlace.DistrictID || null,
                TalukID: selectedPlace.TalukID || null,
                JunctionID: selectedPlace.JunctionID || null,
                LevelId: selectedPlace.LevelId || null,
                CompanyID: selectedPlace.CompanyID || null,
                CreatedBy: selectedPlace.CreatedBy || null,
                ModifiedBy: ModifiedBy
            });
    
            if (response.data) {
                fetchData(); // Refresh the list
                handleCloseEditModal();
               toast.success('Place updated successfully');
            }
        } catch (err) {
           toast.error('Error updating place: ' + (err.response?.data?.error || 'Server error'));
        }
    };
    
    
    const stateOptions = [
        { value: "new", label: "+ Create New State" },
        ...states?.map(state => ({ value: state.StateID, label: state.StateName })) || []
    ];

    const districtOptions = [
        { value: "new", label: "+ Create New District" },
        ...districts.map(d => ({ value: d.DistrictID, label: d.DistrictName }))
    ];

    const talukOptions = [
        { value: "new", label: "+ Create New Taluk" },
        ...taluks.map(t => ({ value: t.TalukID, label: t.TalukName }))
    ];

    const junctionOptions = [
        { value: "new", label: "+ Create New Junction" },
        ...junctions.map(j => ({ value: j.JunctionID, label: j.JunctionName }))
    ];


    const handleDone = () => {
        // Clear the form
        handleClear();
    
        // Refresh the place list
        fetchData();
         toast.success("place created successfully")
    };
    const resetForm = () => {
        setRoute({
            PlID: 0,
            PlaceName: '',
            StateID: 0,
            DistrictID: 0,
            TalukID: 0,
            JunctionID: 0,
            LevelId: 0,
            CompanyID: 0,
            CreatedBy: 0
        });
        setIsSubmitDisabled(false);
        setIsUpdateDisabled(true);
        setIsDeleteDisabled(true);
    };
    const handleClear = () => {
        resetForm();
        setSearchTerm('');
        setMessage('');
        setError('');
    };

const confirmDeleteToast = () => {
  return new Promise((resolve) => {
    const toastId = toast.warning(
      ({ closeToast }) => (
        <div>
          <div className="mb-2">Are you sure you want to delete this Place?</div>
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

    const handleDeletePlace = async () => { 
        if (!selectedPlace?.PlID) return;
        
         const confirm = await confirmDeleteToast(); // 🍞 wait for toast confirmation
  if (!confirm) return;
        setLoadingDelete(true);
        try {
            const response = await api.post('/api/deletePlace', {
                PlID: selectedPlace.PlID,
                DeletedBy: sessionStorage.getItem("UserId")
            });
    
            if (response.data.message) {
                toast.success('Place deleted successfully');
                fetchData();
                handleCloseEditModal();
            }
        } catch (error) {
             toast.error('Error deleting place: ' + (error.response?.data?.error || 'Server error'));
        } finally {
            setLoadingDelete(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setRoute(prev => ({ ...prev, [name]: value }));
    };

    const filteredRouteData = routeData.filter(item =>
        item.PlaceName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
<div className="page-wrapper">
  <div className="container-fluid">
    <div className="page-header d-print-none mt-2">
      <div className="row g-2 align-items-center">
        <div className="col">
          <h2 className="page-title">Place Master</h2>
        </div>
      </div>
    </div>

    <div className="page-body mt-1">
      <div className="container-fluid">
         <ToastContainer position="top-center" autoClose={3000} />
        <div className="card p-3">
          <div className="row g-3">
            {/* Form Card */}
            <div className="col-md-6">
              <div className="card h-100 d-flex flex-column">
                <div className="card-header">
                  <h3 className="card-title">Add Place</h3>
                </div>
                <div className="card-body flex-grow-1">
                  <form >
                    {/* Form fields */}
                    {/* State */}
                    <div className="mb-3">
                      <label htmlFor="StateID" className="form-label">State</label>
                      <Select
                        id="StateID"
                        name="StateID"
                        options={stateOptions}
                        isDisabled={route.PlID !== 0}
                        value={stateOptions.find(opt => String(opt.value) === String(route.StateID))}
                        onChange={(selected) => {
                          if (selected.value === "new") handleNewStateClick();
                          else handleInputChange({ target: { name: "StateID", value: selected.value } });
                        }}
                        placeholder="Select State"
                      />
                    </div>

                    {/* District */}
                    <div className="mb-3">
                      <label htmlFor="DistrictID" className="form-label">District</label>
                      <Select
                        id="DistrictID"
                        name="DistrictID"
                        options={districtOptions}
                        isDisabled={!enableDistrict || route.PlID !== 0}
                        value={districtOptions.find(opt => String(opt.value) === String(route.DistrictID))}
                        onChange={(selected) => {
                          if (selected.value === "new") handleNewDistrictClick();
                          else handleInputChange({ target: { name: "DistrictID", value: selected.value } });
                        }}
                        placeholder="Select District"
                      />
                    </div>

                    {/* Taluk */}
                    <div className="mb-3">
                      <label htmlFor="TalukID" className="form-label">Taluk</label>
                      <Select
                        id="TalukID"
                        name="TalukID"
                        options={talukOptions}
                        isDisabled={!enableTaluk || route.PlID !== 0}
                        value={talukOptions.find(opt => String(opt.value) === String(route.TalukID))}
                        onChange={(selected) => {
                          if (selected.value === "new") handleNewTalukClick();
                          else handleInputChange({ target: { name: "TalukID", value: selected.value } });
                        }}
                        placeholder="Select Taluk"
                      />
                    </div>

                    {/* Junction */}
                    <div className="mb-3">
                      <label htmlFor="JunctionID" className="form-label">Junction</label>
                      <Select
                        id="JunctionID"
                        name="JunctionID"
                        options={junctionOptions}
                        isDisabled={!enableJunction}
                        value={junctionOptions.find(opt => String(opt.value) === String(route.JunctionID))}
                        onChange={(selected) => {
                          if (selected.value === "new") handleNewJunctionClick();
                          else handleInputChange({ target: { name: "JunctionID", value: selected.value } });
                        }}
                        placeholder="Select Junction"
                      />
                    </div>

                    <div className="form-footer mt-4">
                      <div className="d-flex justify-content-center gap-3 flex-wrap">

                      <button
                type="button"
                className="btn btn-primary"
                onClick={handleDone}
                disabled={!route.JunctionID} // Disable the button if Junction is not selected
            >
                Done
            </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={handleClear}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* List Card */}
            <div className="col-md-6">
    <div className="card h-100 d-flex flex-column">
        <div className="card-header d-flex justify-content-between align-items-center">
            <h3 className="card-title">Places List</h3>
            <input
                type="text"
                className="form-control w-auto ms-auto"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="card-body flex-grow-1" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <div className="list-group">
                {filteredRouteData.map(place => {
                    // Constructing the place name based on the LevelId
                    let fullPlaceName = place.PlaceName;
                    
                    // Check LevelId and add parent place names
                    if (place.LevelId === 2) {
                        // State + PlaceName (District level)
                        fullPlaceName = `${place.StateName ? place.StateName + ', ' : ''}${place.PlaceName}`;
                    } else if (place.LevelId === 3) {
                        // State + District + PlaceName (Taluk level)
                        fullPlaceName = `${place.StateName ? place.StateName + ', ' : ''}${place.DistrictName ? place.DistrictName + ', ' : ''}${place.PlaceName}`;
                    } else if (place.LevelId === 4) {
                        // State + District + Taluk + PlaceName (Junction level)
                        fullPlaceName = `${place.StateName ? place.StateName + ', ' : ''}${place.DistrictName ? place.DistrictName + ', ' : ''}${place.TalukName ? place.TalukName + ', ' : ''}${place.PlaceName}`;
                    }

                    return (
                        <button
                            key={place.PlID}
                            type="button"
                            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                            onClick={() => handlePlaceClick(place)}
                        >
                            {fullPlaceName}
                            <span className="badge rounded-pill">
                                {['State', 'District', 'Taluk', 'Junction'][place.LevelId - 1]}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    </div>
</div>


          </div> {/* end row */}

</div>
            
               

                        </div>
                        {showStateModal && (
                            <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                <div className="modal-dialog">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">Create New State</h5>
                                        </div>
                                        <div className="modal-body">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Enter State Name"
                                                value={newStateName}
                                                onChange={(e) => setNewStateName(e.target.value)}
                                            />
                                        </div>
                                        <div className="modal-footer">
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => setShowStateModal(false)}
                                            >
                                                Close
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                onClick={handleSaveNewState}
                                                disabled={!newStateName.trim()}
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showDistrictModal && (
                            <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                <div className="modal-dialog">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">Create New District</h5>
                                        </div>
                                        <div className="modal-body">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Enter District Name"
                                                value={newDistrictName}
                                                onChange={(e) => setNewDistrictName(e.target.value)}
                                            />
                                        </div>
                                        <div className="modal-footer">
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => setShowDistrictModal(false)}
                                            >
                                                Close
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                onClick={handleSaveNewDistrict}
                                                disabled={!newDistrictName.trim()}
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showTalukModal && (
                            <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                <div className="modal-dialog">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">Create New Taluk</h5>
                                        </div>
                                        <div className="modal-body">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Enter District Name"
                                                value={newTalukName}
                                                onChange={(e) => setNewTalukName(e.target.value)}
                                            />
                                        </div>
                                        <div className="modal-footer">
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => setShowTalukModal(false)}
                                            >
                                                Close
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                onClick={handleSaveNewTaluk}
                                                disabled={!newTalukName.trim()}
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showJunctionModal && (
                            <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                <div className="modal-dialog">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">Create New Junction</h5>
                                        </div>
                                        <div className="modal-body">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Enter District Name"
                                                value={newJunctionName}
                                                onChange={(e) => setNewJunctionName(e.target.value)}
                                            />
                                        </div>
                                        <div className="modal-footer">
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => setShowJunctionModal(false)}
                                            >
                                                Close
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                onClick={handleSaveNewJunction}
                                                disabled={!newJunctionName.trim()}
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

<Modal show={showEditModal} onHide={handleCloseEditModal}>
    <Modal.Header closeButton>
        <Modal.Title>Edit Place</Modal.Title>
    </Modal.Header>
    <Modal.Body>
        <div className="form-group">
            <label>Place Name</label>
            <input
                type="text"
                className="form-control"
                value={editedPlaceName}
                onChange={(e) => setEditedPlaceName(e.target.value)}
            />
        </div>
    </Modal.Body>
    <Modal.Footer>
        <Button variant="secondary" onClick={handleCloseEditModal}>
            Cancel
        </Button>

        {/* Delete Button */}
        <Button
            variant="danger"
            onClick={handleDeletePlace}
            disabled={loadingDelete || !selectedPlace?.PlID} // Disable if loading or no place selected
        >
            {loadingDelete ? 'Deleting...' : 'Delete'}
        </Button>

        <Button
            variant="primary"
            onClick={handleSavePlaceChanges}
            disabled={!editedPlaceName.trim() || loadingUpdate}
        >
            {loadingUpdate ? 'Saving...' : 'Save Changes'}
        </Button>
    </Modal.Footer>
</Modal>





                    </div>
                </div>
            </div>
            );
}
            export default PlaceMaster;