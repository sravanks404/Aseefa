import React, { useState, useEffect } from 'react';
import api from '../../apiService';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function RouteMaster() {
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
    const [places, setPlaces] = useState([]); // New state for places
    const [states, setStates] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [taluks, setTaluks] = useState([]);
    const [junctions, setJunctions] = useState([]);
    const [selectedStateId, setSelectedStateId] = useState('');
    const [selectedDistrictId, setSelectedDistrictId] = useState('');
    const [selectedTalukId, setSelectedTalukId] = useState('');

    const [route, setRoute] = useState({
        RootId: 0,
        RootName: '',
        PlaceName: '',
        FromPlace: '',
        State: '',       // New field
        District: '',    // New field
        Taluk: '',       // New field
        Junction: '', 
        JunctionID: '',   // New field
        ToPlace: '',
        CreatedBy: '',
        CreatedDate: '',
        SuitApps_id: ''
    });

    const [routeData, setRouteData] = useState([]);

    useEffect(() => {
        fetchData();
        fetchStates();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const CompanyID = sessionStorage.getItem("CompanyID");
            if (!CompanyID) {
                 toast.error("CompanyID not found in sessionStorage");
                return;
            }
            const response = await api.get("/api/WebGetRouteMaster", { params: { CompanyID } });
            setRouteData(response.data);
        } catch (err) {
            console.error("Fetch error:", err);
            toast.error('Failed to fetch route data');
        } finally {
            setLoading(false);
        }
    };

    const fetchStates = async () => {
        try {
            const CompanyID = sessionStorage.getItem("CompanyID");
            const response = await api.get("/api/GetStates", { params: { CompanyID } });
            setStates(response.data.data);
        } catch (err) {
            console.error("Fetch states error:", err);
            toast.error('Failed to fetch states');
        }
    };

    const fetchDistricts = async (stateId) => {
        try {
            const CompanyID = sessionStorage.getItem("CompanyID");
            const response = await api.get("/api/GetDistricts", { 
                params: { 
                    CompanyID,
                    StateID: stateId 
                }
            });
            setDistricts(response.data.data);
        } catch (err) {
            console.error("Fetch districts error:", err);
             toast.error('Failed to fetch districts');
        }
    };

    const fetchTaluks = async (districtId) => {
        try {
            const CompanyID = sessionStorage.getItem("CompanyID");
            const response = await api.get("/api/GetTaluks", { 
                params: { 
                    CompanyID,
                    DistrictID: districtId 
                }
            });
            setTaluks(response.data.data);
        } catch (err) {
            console.error("Fetch taluks error:", err);
             toast.error('Failed to fetch taluks');
        }
    };

    const fetchJunctions = async (talukId) => {
        try {
            const CompanyID = sessionStorage.getItem("CompanyID");
            const response = await api.get("/api/GetJunctions", { 
                params: { 
                    CompanyID,
                    TalukID: talukId 
                }
            });
            setJunctions(response.data.data);
        } catch (err) {
            console.error("Fetch junctions error:", err);
            toast.error('Failed to fetch junctions');
        }
    };

    
    // const states = places.filter(p => p.LevelId === 1);
    // const districts = places.filter(p => p.LevelId === 2);
    // const taluks = places.filter(p => p.LevelId === 3);
    // const junctions = places.filter(p => p.LevelId === 4);
    const handleStateChange = (e) => {
        const selectedState = states.find(s => s.StateID == e.target.value);
        setSelectedStateId(e.target.value);
        setSelectedDistrictId('');
        setSelectedTalukId('');
        setRoute(prev => ({
            ...prev,
            State: selectedState?.StateName || '',
            District: '',
            Taluk: '',
            Junction: ''
        }));
        fetchDistricts(e.target.value);
    };

    const handleDistrictChange = (e) => {
        const selectedDistrict = districts.find(d => d.DistrictID == e.target.value);
        setSelectedDistrictId(e.target.value);
        setSelectedTalukId('');
        setRoute(prev => ({
            ...prev,
            District: selectedDistrict?.DistrictName || '',
            Taluk: '',
            Junction: ''
        }));
        fetchTaluks(e.target.value);
    };

    const handleTalukChange = (e) => {
        const selectedTaluk = taluks.find(t => t.TalukID == e.target.value);
        setSelectedTalukId(e.target.value);
        setRoute(prev => ({
            ...prev,
            Taluk: selectedTaluk?.TalukName || '',
            Junction: ''
        }));
        fetchJunctions(e.target.value);
    };

    const handleJunctionChange = (e) => {
        const junctionId = parseInt(e.target.value); // Ensure type matches
        const selectedJunction = junctions.find(j => j.JunctionID === junctionId);
      
        setRoute(prev => ({
          ...prev,
          JunctionID: junctionId,
          JunctionName: selectedJunction?.JunctionName || ''
        }));
      };


      // Add this useEffect to load junctions when TalukID is available
useEffect(() => {
    if (selectedTalukId) {
        fetchJunctions(selectedTalukId);
    }
}, [selectedTalukId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setRoute(prev => {
            const updatedRoute = { ...prev, [name]: value };
            // Combine selected values into PlaceName
          //  updatedRoute.PlaceName = `${updatedRoute.State}, ${updatedRoute.District}, ${updatedRoute.Taluk}, ${updatedRoute.Junction}`;
            return updatedRoute;
        });
    };

const handleRowClick = async (item) => {
    try {
        // Clear previous selections and reset dropdowns
        setSelectedStateId('');
        setSelectedDistrictId('');
        setSelectedTalukId('');
        setJunctions([]);

        // Extract first valid ID from arrays (backend issue workaround)
        const stateId = item.StateID?.find(id => id > 0) || '';
        const districtId = item.DistrictID?.find(id => id > 0) || '';
        const talukId = item.TalukID?.find(id => id > 0) || '';
        const junctionId = item.JunctionID?.find(id => id > 0) || '';

        // Load required geographical data
        if (stateId) {
            await fetchDistricts(stateId);
            setSelectedStateId(stateId);
            
            if (districtId) {
                await fetchTaluks(districtId);
                setSelectedDistrictId(districtId);
                
                if (talukId) {
                    await fetchJunctions(talukId);
                    setSelectedTalukId(talukId);
                }
            }
        }

        // Find names from existing state data
        const stateName = states.find(s => s.StateID == stateId)?.StateName || '';
        const districtName = districts.find(d => d.DistrictID == districtId)?.DistrictName || '';
        const talukName = taluks.find(t => t.TalukID == talukId)?.TalukName || '';
        const junctionName = junctions.find(j => j.JunctionID == junctionId)?.JunctionName || '';

        // Update form state
        setRoute({
            ...item,
            PlaceName: item.routeplace,
            State: stateName,
            District: districtName,
            Taluk: talukName,
            Junction: junctionName,
            JunctionID: junctionId
        });

        // Enable controls
        setIsSubmitDisabled(true);
        setIsUpdateDisabled(false);
        setIsDeleteDisabled(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
        console.error('Row click error:', err);
         toast.error('Failed to load route details');
    }
};

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoadingSubmit(true);
            setMessage('');
            setError('');

            const CreatedBy = sessionStorage.getItem("UserId");
            const CreatedDate = new Date().toISOString();

            const newRoute = {
                RootId: 0,
                RootName: route.RootName,
                PlaceName: route.PlaceName,
                FromPlace: route.FromPlace,
                ToPlace: route.ToPlace,
                State: selectedStateId,       // Send State ID
                District: selectedDistrictId, // Send District ID
                Taluk: selectedTalukId,       // Send Taluk ID
                Junction: route.JunctionID,   // Send Junction ID from state
                CreatedBy: CreatedBy,
                CreatedDate: CreatedDate,
                SuitApps_id: ''
              };

            const response = await api.post('/api/InsertupdateRoute', newRoute);

            if (response.data.success) {
               // alert('Route created successfully');
                toast.success('Route created successfully');
                fetchData();
                resetForm();
            } else {
                toast.error(response.data.message || 'Operation failed');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Request failed');
            console.error(err);
        } finally {
            setLoadingSubmit(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            setLoadingUpdate(true);
            setMessage('');
            setError('');
    
            const CreatedBy = sessionStorage.getItem("UserId");
            const CreatedDate = new Date().toISOString();
    
            const updatedRoute = {
                RootId: route.RootId,
                RootName: route.RootName,
                PlaceName: route.PlaceName,
                FromPlace: route.FromPlace,
                ToPlace: route.ToPlace,
                State: selectedStateId,
                District: selectedDistrictId,
                Taluk: selectedTalukId,
                Junction: route.JunctionID,
                CreatedBy: CreatedBy,
                CreatedDate: CreatedDate,
                SuitApps_id: ''
            };
    
            const response = await api.post('/api/InsertupdateRoute', updatedRoute);
    
            if (response.data.success) {
                toast.success('Route updated successfully');
                fetchData();
            } else {
                toast.error(response.data.message || 'Update failed');
            }
        } catch (err) {
           toast.error(err.response?.data?.message || 'Update request failed');
            console.error(err);
        } finally {
            setLoadingUpdate(false);
        }
        handleClear();
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
  type="button"
  className="btn btn-secondary"
  onClick={() => {
    toast.dismiss(toastId);
    resolve(false);
    setIsDeleteDisabled(false);
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

const handleDelete = async () => {
  setIsDeleteDisabled(true); // ⛔ Prevent multiple clicks immediately

  try {
    setLoadingDelete(true);
    setMessage('');
    setError('');

    const confirm = await confirmDeleteToast(); // 🍞 wait for toast confirmation

    if (!confirm) {
      setIsDeleteDisabled(false); // ✅ Re-enable if user cancels
      return;
    }

    const payload = {
      RootId: Number(route.RootId),
      DeletedBy: Number(sessionStorage.getItem("UserId"))
    };

    if (isNaN(payload.RootId) || isNaN(payload.DeletedBy)) {
      throw new Error('Invalid user or route identifier');
    }

    const response = await api.post('/api/WebDeleteRouteMaster', payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data.success) {
      toast.success('Route deleted successfully');
      fetchData();
      resetForm();
      handleClear();
    } else {
      toast.error(response.data.message || 'Deletion failed');
    }
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message || 'Deletion failed';
    toast.error(errorMessage);
    console.error('Delete error:', err);
  } finally {
    setLoadingDelete(false);
    setIsDeleteDisabled(false); // ✅ Always re-enable after action
  }
};


    const resetForm = () => {
        setRoute({
            RootId: 0,
            RootName: '',
            PlaceName: '',
            FromPlace: '',
            ToPlace: '',
            CreatedBy: '',
            CreatedDate: '',
            SuitApps_id: ''
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
        setSelectedStateId('');
        setSelectedDistrictId('');
        setSelectedTalukId('');
        setJunctions([]);
    };

    const filteredRouteData = routeData.filter(item =>
        item.RootName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.routeplace.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.FromPlace.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ToPlace.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-wrapper">
            <div className="container-fluid">
                 <ToastContainer position="top-center" autoClose={3000} />
                <div className="page-header d-print-none mt-2">
                    <div className="row g-2 align-items-center">
                        <div className="col">
                            <h2 className="page-title">Route Master</h2>
                        </div>
                    </div>
                </div>

                <div className="page-body mt-1">
                    <div className="container-fluid">
                        {/* {message && <div style={{ color: 'green', fontWeight: 'bold' }}>{message}</div>}
                        {error && <div style={{ color: 'red' }}>{error}</div>} */}
                        <div className="card mt-3">
                            <div className="card-body">
                              <form onSubmit={route.RootId === 0 ? handleSubmit : handleUpdate}>
  <div className="row g-4">
    {/* LEFT COLUMN */}
  
   

    {/* RIGHT COLUMN */}
    <div className="col-md-6">
      <div className="row gy-3">

        {/* Route Name */}
        <div className="col-12 d-flex align-items-center">
          <label className="me-3 mb-0" style={{ width: '130px' }}>Route Name</label>
          <input
            type="text"
            name="RootName"
            placeholder="Route Name"
            className="form-control"
            value={route.RootName}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Place Name */}
        <div className="col-12 d-flex align-items-center">
          <label className="me-3 mb-0" style={{ width: '130px' }}>Place Name</label>
          <input
            type="text"
            name="PlaceName"
            placeholder="Place Name"
            className="form-control"
            value={route.PlaceName}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* From Place */}
        <div className="col-12 d-flex align-items-center">
          <label className="me-3 mb-0" style={{ width: '130px' }}>From Place</label>
          <input
            type="text"
            name="FromPlace"
            placeholder="From Place"
            className="form-control"
            value={route.FromPlace}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* To Place */}
        <div className="col-12 d-flex align-items-center">
          <label className="me-3 mb-0" style={{ width: '130px' }}>To Place</label>
          <input
            type="text"
            name="ToPlace"
            placeholder="To Place"
            className="form-control"
            value={route.ToPlace}
            onChange={handleInputChange}
            required
          />
        </div>

      </div>
    </div>
  </div>

  {/* Footer Buttons */}
  <div className="form-footer mt-4">
    <div className="d-flex justify-content-center gap-3 flex-wrap">
      <button type="submit" className="btn btn" disabled={isSubmitDisabled || loadingSubmit}>
        {loadingSubmit ? 'Submitting...' : 'Submit'}
      </button>
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
</form>

                            </div>
                        </div>
                        <div className="card mt-3">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h3 className="card-title mb-0">Route List</h3>
                                <div className="col-md-3">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search routes..."
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
                                    <div className="table-responsive" style={{ maxHeight: '100vh', overflowY: 'auto' }}>
                                        <table className="table table-bordered table-hover mb-0">
                                            <thead className="table-light" style={{ position: 'sticky', top: 0 }}>
                                                <tr>
                                                    <th style={{ width: '25%' }}>Route Name</th>
                                                    <th style={{ width: '25%' }}>Place Name</th>
                                                    <th style={{ width: '25%' }}>From Place</th>
                                                    <th style={{ width: '25%' }}>To Place</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredRouteData.length > 0 ? (
                                                    filteredRouteData.map(item => (
                                                        <tr
                                                            key={item.RootId}
                                                            onClick={() => handleRowClick(item)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <td>{item.RootName}</td>
                                                            <td>{item.routeplace}</td>
                                                            <td>{item.FromPlace}</td>
                                                            <td>{item.ToPlace}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="4" className="text-center">
                                                            {routeData.length === 0 ?
                                                                "No routes available" :
                                                                "No matching routes found"}
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

export default RouteMaster;