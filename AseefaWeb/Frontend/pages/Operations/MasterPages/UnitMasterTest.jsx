import React, { useEffect, useState } from 'react';
import api from '../../apiService';
import Navbar from '../../../components/Navbar';
import Sidebar from '../../../components/Sidebar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
  FaSearch, FaPlus, FaSave, FaEdit, FaTrashAlt,
  FaEraser, FaArrowLeft, FaRuler
} from 'react-icons/fa';

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

function UnitMasterTest() {

    const [loading, setLoading] = useState(false);
    const [unitData, setUnitData] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingDelete,setLoadingDelete]= useState(false);
    


  const [loadingUpdate,    setLoadingUpdate]    = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);
  const [isDeleteDisabled, setIsDeleteDisabled] = useState(true);

    const [unit, setUnit] = useState({
        UnitID: 0,
        UnitName: ''
    });

    const [loadingSubmit, setLoadingSubmit] = useState(false);

    

    useEffect(() => {
        const CompanyId = sessionStorage.getItem('CompanyID');
        fetchData(CompanyId);
    }, []);

    // FETCH DATA
    const fetchData = async (companyId) => {

        try {

            setLoading(true);

            const finalCompanyId =
                companyId || sessionStorage.getItem('CompanyID');

            const response = await api.get('/api/getunitmastertest', {
                params: { CompanyId: finalCompanyId }
            });

            setUnitData(response.data?.data || []);

        } catch (error) {

            toast.error('Failed to fetch unit data');

        } finally {

            setLoading(false);

        }
    };

    const resetForm = () => {
    setUnit({ UnitID: 0, UnitName: '' });
    setIsSubmitDisabled(false);
    setIsUpdateDisabled(true);
    setIsDeleteDisabled(true);
    
  };

    const handleCreateNew = () => {

        resetForm();

        setShowForm(true);

    };
const handleRowClick = (item) => {
    setUnit({ UnitID: item.UnitID, UnitName: item.UnitName || '' });
    setIsSubmitDisabled(true);
    setIsUpdateDisabled(false);
    setIsDeleteDisabled(false);
    setShowForm(true);
  };

    // INPUT CHANGE
    const handleInputChange = (e) => {

        const { name, value } = e.target;

        setUnit((prev) => ({
            ...prev,
            [name]: value
        }));

    };

    const handleUpdate = async (e) => {
    e.preventDefault();

   

    if (checkDuplicate(unit.UnitName, unit.UnitID)) {
      toast.error('Unit Name already exists');
      return;
    }

    try {
      setLoadingUpdate(true);

      const CompanyId = sessionStorage.getItem('CompanyID');
      const CreatedBy = sessionStorage.getItem('UserId');

      const response = await api.post('/api/insertupdateunit', {
        UnitID:   unit.UnitID,
        UnitName: unit.UnitName.trim(),
        CreatedBy,
        CompanyId
      });

      if (response.data.success) {
        toast.success('Unit updated successfully');
        fetchData(CompanyId);
        resetForm();
        setShowForm(false);
      } else {
        toast.error(response.data.message || 'Update failed');
      }

    } catch (err) {
      toast.error(err.response?.data?.message || 'Update request failed');
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    

    if (checkDuplicate(unit.UnitName)) {
      toast.error('Unit Name already exists');
      return;
    }

    try {
      setLoadingSubmit(true);

      const CompanyId = sessionStorage.getItem('CompanyID');
      const CreatedBy = sessionStorage.getItem('UserId');

      const response = await api.post('/api/insertupdateunit', {
        UnitID:   0,
        UnitName: unit.UnitName.trim(),
        CreatedBy,
        CompanyId
      });

      if (response.data.success) {
        toast.success('Unit created successfully');
        fetchData(CompanyId);
        resetForm();
        setShowForm(false);
      } else {
        toast.error(response.data.message || 'Operation failed');
      }

    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally {
      setLoadingSubmit(false);
    }
  };

    const handleDelete = async () => {
    if (!unit.UnitID) { toast.error('No unit selected'); return; }
    const confirmed = await confirmDeleteToast();
    if (!confirmed) return;

    try {
      setLoadingDelete(true);

      const CompanyId = sessionStorage.getItem('CompanyID');
      const DeletedBy = parseInt(sessionStorage.getItem('UserId'), 10);

      // axios DELETE with a body → pass under `data` key
      const response = await api.post('/api/deleteunittest', { UnitID: unit.UnitID, DeletedBy });

      if (response.data.success) {
        toast.success('Unit deleted successfully');
        fetchData(CompanyId);
        resetForm();
        setShowForm(false);
      } else {
        toast.error(response.data.message || 'Delete failed');
      }

    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete error');
    } finally {
      setLoadingDelete(false);
    }
  };

  const confirmDeleteToast = () =>
    new Promise((resolve) => {
      const toastId = toast.warning(
        () => (
          <div>
            <div className="mb-2">Are you sure you want to delete this unit?</div>
            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-danger btn-sm"
                onClick={() => { toast.dismiss(toastId); resolve(true); }}
              >Yes</button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => { toast.dismiss(toastId); resolve(false); }}
              >Cancel</button>
            </div>
          </div>
        ),
        { position: 'top-center', autoClose: false, closeOnClick: false, draggable: false, closeButton: false }
      );
    });
    const filteredUnits = unitData.filter((item) =>
        item.UnitName?.toLowerCase().includes(searchTerm.toLowerCase())
    );


    const checkDuplicate = (name, currentUnitID = null) =>
  unitData.some((u) => {
    const isSame =
      u.UnitName?.trim().toLowerCase() ===
      name.trim().toLowerCase();

    return currentUnitID
      ? isSame && u.UnitID !== currentUnitID
      : isSame;
  });

    const handleBackToList = () => { setShowForm(false); handleClear(); };
    const handleClear      = () => { resetForm(); toast.dismiss(); };
    

    return (

        <div className="page">

            <ToastContainer />

            <Navbar />
            <Sidebar />

            

                <div
                    className="page-wrapper"
  style={{
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    marginLeft: 0,
    left: 0,
    width: '100%'
  }}
                >

                    <div className="page-body mt-1">

                        <div className="container-fluid px-2">

                            {/* LIST PAGE */}
                            {!showForm ? (

                                <>

                                    <div className="card mb-3" style={{ borderRadius: '12px', overflow: 'hidden' }}>

                                        <div className="card-body">
                                            <h2 className="mb-3" style={{ fontWeight: '600', color: '#2d3748', fontSize: '28px' }}>
                                                <FaRuler className="me-2" style={{ color: primaryColor }} />

                                                Unit Master Test
                                            </h2>
                                            <br />

                                            <div className="d-flex justify-content-between align-items-center gap-3">


                                                {/* SEARCH */}
                                                <div
                                                    style={{
                                                        maxWidth: '500px',
                                                        flex: 1
                                                    }}
                                                >

                                                    <div
                                                        className="input-group "
                                                        style={{ height: '45px', width: '700px' }}
                                                    >

                                                        <span
                                                            className="input-group-text text-white"
                                                            style={{
                                                                backgroundColor: primaryColor
                                                            }}
                                                        >
                                                            <FaSearch />
                                                        </span>

                                                        <input
                                                            type="text"
                                                            className="form-control border-start-0"
                                                            placeholder="Search units..."
                                                            value={searchTerm}
                                                            onChange={(e) =>
                                                                setSearchTerm(e.target.value)
                                                            }
                                                        />

                                                    </div>

                                                </div>

                                                {/* BUTTON */}
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={handleCreateNew}
                                                >

                                                    <FaPlus className="me-2" />
                                                    Create New

                                                </button>

                                            </div>

                                        </div>

                                    </div>

                                    {/* TABLE */}
                                    <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>

                                        <div className="card-body p-0">

                                            {loading ? (

                                                <div className="text-center p-5">

                                                    <div
                                                        className="spinner-border"
                                                        role="status"
                                                    >
                                                        <span className="visually-hidden">
                                                            Loading...
                                                        </span>
                                                    </div>

                                                </div>

                                            ) : (

                                                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                                                      <table className="table table-hover mb-0">
                                                                        <thead className="bg-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                                                          <tr>
                                                                            <th className="py-3 px-4" style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px', width: '80px' }}>Slno</th>
                                                                            <th className="py-3"       style={{ color: '#4a5568', fontWeight: '600', fontSize: '14px' }}>Unit Name</th>
                                                                          </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                          {filteredUnits.length > 0 ? (
                                                                            filteredUnits.map((item, index) => (
                                                
                                                                              <tr
                                                                                key={item.UnitID}
                                                                                onClick={() => handleRowClick(item)}
                                                                                style={{
                                                                                  cursor: 'pointer',
                                                                                  transition: 'all 0.2s',
                                                                                  borderLeft: unit.UnitID === item.UnitID
                                                                                    ? `4px solid ${primaryColor}`
                                                                                    : '4px solid transparent'
                                                                                }}
                                                                                className="align-middle"
                                                                              >
                                                                                <td className="py-3 px-4" style={{ color: '#718096', fontSize: '14px' }}>
                                                                                  {index + 1}
                                                                                </td>
                                                                                <td className="py-3">
                                                                                  <div className="d-flex align-items-center">
                                                                                    <div
                                                                                      className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3"
                                                                                      style={{ width: '36px', height: '36px', flexShrink: 0 }}
                                                                                    >
                                                                                      <FaRuler style={{ color: primaryColor, fontSize: '14px' }} />
                                                                                    </div>
                                                                                    <span className="fw-medium">{item.UnitName}</span>
                                                                                  </div>
                                                                                </td>
                                                                              </tr>
                                                                            ))
                                                                          ) : (
                                                                            <tr>
                                                                              <td colSpan="2" className="text-center p-5">
                                                                                <FaRuler className="mb-3" style={{ fontSize: '48px', color: '#cbd5e0' }} />
                                                                                <p className="text-muted mb-3">No units found</p>
                                                                                <button
                                                                                  className="btn"
                                                                                  onClick={handleCreateNew}
                                                                                  style={{ borderRadius: '5px', padding: '10px 24px', background: primaryColor, border: 'none', color: 'white', fontSize: '14px' }}
                                                                                >
                                                                                  <FaPlus className="me-2" />Create New Unit
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

                                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                                
                                              
                                              <div
                                                className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-0"
                                                style={{ borderBottom: '1px solid #e2e8f0' }}
                                              >
                                                <h4 className="m-0" style={{ color: '#2d3748', fontWeight: '600', fontSize: '18px' }}>
                                                  <FaRuler className="me-2" style={{ color: primaryColor }} />
                                                  {unit.UnitID ? 'Edit Unit test' : 'New Unit'}
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
                                                  <div className="row justify-content-center">
                                                    <div className="col-md-6">
                                                      <div className="card border-0 shadow-sm" style={{ borderRadius: '10px' }}>
                                                        <div
                                                          className="card-header bg-white"
                                                          style={{ borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: primaryColor }}
                                                        >
                                                          <FaRuler className="me-2" />Unit Details
                                                        </div>
                                                        <div className="card-body p-4">
                                                          <div className="mb-3">
                                                            <label className="form-label fw-medium mb-2">
                                                              Unit Name <span className="text-danger">*</span>
                                                            </label>
                                                            <input
                                                              className={`form-control`}
                                                              name="UnitName"
                                                              value={unit.UnitName}
                                                              onChange={handleInputChange}
                                                              placeholder="e.g. Kg, Litre, Pcs"
                                                              maxLength={50}
                                                              autoFocus
                                                            />
                                                            
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                
                                                  {/* Action buttons */}
                                                  <div className="row mt-4">
                                                    <div className="col-12">
                                                      <div className="d-flex justify-content-center flex-wrap gap-3">
                                
                                                        <button
                                                          type="submit"
                                                          className="btn px-4 d-flex align-items-center gap-2"
                                                          style={btnStyle}
                                                          disabled={isSubmitDisabled || loadingSubmit}
                                                        >
                                                          {loadingSubmit
                                                            ? <><span className="spinner-border spinner-border-sm" role="status" /> Creating...</>
                                                            : <><FaSave /> Submit</>}
                                                        </button>
                                
                                                        <button
                                                          type="button"
                                                          className="btn px-4 d-flex align-items-center gap-2"
                                                          style={btnStyle}
                                                          disabled={isUpdateDisabled || loadingUpdate}
                                                          onClick={handleUpdate}
                                                        >
                                                          {loadingUpdate
                                                            ? <><span className="spinner-border spinner-border-sm" role="status" /> Updating...</>
                                                            : <><FaEdit /> Update</>}
                                                        </button>
                                
                                                        <button
                                                          type="button"
                                                          className="btn px-4 d-flex align-items-center gap-2"
                                                          style={btnStyle}
                                                          disabled={isDeleteDisabled || loadingDelete}
                                                          onClick={handleDelete}
                                                        >
                                                          {loadingDelete
                                                            ? <><span className="spinner-border spinner-border-sm" role="status" /> Deleting...</>
                                                            : <><FaTrashAlt /> Delete</>}
                                                        </button>
                                
                                                        <button
                                                          type="button"
                                                          className="btn px-4 d-flex align-items-center gap-2"
                                                          style={btnStyle}
                                                          onClick={handleClear}
                                                        >
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

            

        </div>
    );
}

export default UnitMasterTest;