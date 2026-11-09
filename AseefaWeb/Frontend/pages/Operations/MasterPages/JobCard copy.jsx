import React, { useState, useEffect } from 'react';
import api from '../../apiService';
import Select from 'react-select';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function ProductionAlloc() {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [duplicateError, setDuplicateError] = useState('');
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
    const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);
    const [isDeleteDisabled, setIsDeleteDisabled] = useState(true);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [itemTypes, setItemTypes] = useState([]);
    const [items, setItems] = useState([]);
    const [users, setUsers] = useState([]);
    const [fieldErrors, setFieldErrors] = useState({});
    const [allItems, setAllItems] = useState([]);


    const [productionAlloc, setProductionAlloc] = useState({
        ProAlloId: 0,
        ItemType: '',
        Itemid: '',
        Qty: '',
        StartingDate: '',
        EndingDate: '',
        Narration: '',
        UserId: '',
        CompanyID: '',
        CreatedBy: '',
        ModifiedBy: '',
        CreatedDate: '',
        ModifiedDate: '',
        IsDeleted: 0
    });

    const [productionData, setProductionData] = useState([]);

    useEffect(() => {
        fetchData();
        fetchItemTypes();
        fetchItems();
        fetchUsers();
    }, []);

    const fetchData = async () => {
        try {
            const CompanyID = sessionStorage.getItem("CompanyID");
            if (!CompanyID) {
                toast.error("CompanyID not found in sessionStorage");
                return;
            }
            const response = await api.get("/api/webgetproductionalloc", { params: { CompanyID } });
            setProductionData(response.data);
        } catch (err) {
            toast.error('Failed to fetch production allocation data');
            console.error(err);
        }
    };

    const fetchItemTypes = async () => {
        try {
            const CompanyID = sessionStorage.getItem("CompanyID");
            if (!CompanyID) return;
            const response = await api.get("/api/GetitemType");
            setItemTypes(response.data);
        } catch (err) {
            toast.error('Failed to fetch item types');
            console.error(err);
        }
    };

    const fetchItems = async () => {
        try {
            const CompanyID = sessionStorage.getItem("CompanyID");
            if (!CompanyID) return;
            const response = await api.get("/api/GetitemName");
            setAllItems(response.data); // store all items
            setItems(response.data);    // default full list
            console.log("setAllItems:", allItems)
        } catch (err) {
            toast.error('Failed to fetch items');
            console.error(err);
        }
    };

    const fetchUsers = async () => {
        try {
            const CompanyID = sessionStorage.getItem("CompanyID");
            if (!CompanyID) return;

            const response = await api.get('api/GetUsers', { params: { CompanyID } });

            if (response && response.data) {
                setUsers(response.data);
            } else {
                toast.error('No users found');
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
            toast.error('Failed to fetch users');
        }
    };


    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        return dateString.split('T')[0];
    };
    const handleRowClick = (item) => {
        setProductionAlloc({
            ProAlloId: item.ProAlloId,
            ItemType: item.ItemType,
            Itemid: item.Itemid,
            Qty: item.Qty,
            StartingDate: item.StartingDate,
            EndingDate: item.EndingDate,
            Narration: item.Narration,
            UserId: item.UserId,
            CompanyID: item.CompanyID,
            CreatedBy: item.CreatedBy,
            ModifiedBy: item.ModifiedBy,
            CreatedDate: item.CreatedDate,
            ModifiedDate: item.ModifiedDate,
            IsDeleted: item.IsDeleted
        });

        setIsSubmitDisabled(true);
        setIsUpdateDisabled(false);
        setIsDeleteDisabled(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleItemTypeChange = (selected) => {
        // Update the productionAlloc state with selected type ID
        setProductionAlloc(prev => ({
            ...prev,
            ItemType: selected ? selected.value : ''
        }));

        // Filter items based on selected ItemType
        if (selected) {
            const filtered = allItems.filter(item => item.ItemType === selected.value);
            setItems(filtered);
        } else {
            setItems(allItems);
        }

        // Also clear selected Item if the current one doesn't belong to this type
        setProductionAlloc(prev => ({
            ...prev,
            Itemid: '' // clear item selection
        }));
    };



    const itemTypeOptions = itemTypes.map(type => ({
        value: type.TypeID,
        label: type.ItemTypeName
    }));

    const itemOptions = items.map(item => ({
        value: item.ItemID,
        label: item.ItemName
    }));


    const userOptions = users.map(user => ({
        value: user.UserID,
        label: user.USERNAME
    }));
    // console.log("userOptions:", userOptions)
    // Handle select changes
    const handleSelectChange = (selectedOption, fieldName) => {
        setProductionAlloc(prev => ({
            ...prev,
            [fieldName]: selectedOption ? selectedOption.value : ''
        }));
    };



    // Get current selected values for React Select
    const getSelectedValue = (fieldName) => {
        const value = productionAlloc[fieldName];
        if (fieldName === 'ItemType') {
            return itemTypeOptions.find(option => option.value === value) || null;
        }
        if (fieldName === 'Itemid') {
            return itemOptions.find(option => option.value === value) || null;
        }
        if (fieldName === 'UserId') {
            return userOptions.find(option => option.value === value) || null;
        }
        return null;
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateAllFields()) {
            return;
        }

        try {
            setLoading(true);
            const CompanyID = sessionStorage.getItem("CompanyID");
            const UserId = sessionStorage.getItem("UserId");

            const allocData = {
                ...productionAlloc,
                CompanyID: parseInt(CompanyID, 10),
                CreatedBy: parseInt(UserId, 10),
                CreatedDate: new Date().toISOString()
            };

            const response = await api.post('api/InsertUpdateProductionAlloc', allocData);
            if (response.data.message) {
                toast.success(response.data.message);
                fetchData();
                resetForm();
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Submission failed');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();

        if (!validateAllFields()) {
            return;
        }

        try {
            setLoadingUpdate(true);
            const UserId = sessionStorage.getItem("UserId");

            const allocData = {
                ...productionAlloc,
                ModifiedBy: parseInt(UserId, 10),
                ModifiedDate: new Date().toISOString()
            };

            const response = await api.post('api/InsertUpdateProductionAlloc', allocData);
            if (response.data.message) {
                toast.success(response.data.message);
                fetchData();
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Update failed');
        } finally {
            setLoadingUpdate(false);
        }
    };

    const resetForm = () => {
        setProductionAlloc({
            ProAlloId: 0,
            ItemType: '',
            Itemid: '',
            Qty: '',
            StartingDate: '',
            EndingDate: '',
            Narration: '',
            UserId: '',
            CompanyID: '',
            CreatedBy: '',
            ModifiedBy: '',
            CreatedDate: '',
            ModifiedDate: '',
            IsDeleted: 0
        });
        setIsSubmitDisabled(false);
        setIsUpdateDisabled(true);
        setIsDeleteDisabled(true);
        setMessage('');
        setError('');
    };

    const handleClear = () => {
        resetForm();
        setSearchTerm('');
        fetchData();
        toast.dismiss();
        setFieldErrors({});
    };

    const confirmDeleteToast = () => {
        return new Promise((resolve) => {
            const toastId = toast.warning(
                ({ closeToast }) => (
                    <div>
                        <div className="mb-2">Are you sure you want to delete this Productionallocation?</div>
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
        const Empid = parseInt(sessionStorage.getItem("UserId"), 10);

        const confirm = await confirmDeleteToast(); // 🍞 wait for toast confirmation
        if (!confirm) return;
        try {
            const response = await api.post("/api/webdeleteproalloc", {
                ProAlloId: productionAlloc.ProAlloId,
                DeletedBy: Empid,
                DeletedDate: new Date().toISOString(),
            });

            setMessage(response.data.message);
            toast.success("ProductionAllocation deleted successfully!");



            await fetchData();
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Delete failed.");
            //alert("Delete failed!");
        }

    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProductionAlloc(prev => ({ ...prev, [name]: value }));
    };

    const validateAllFields = () => {
        // Implement your validation logic here
        return true;
    };

    const filteredProductionData = productionData.filter((item) =>
        (item.Narration || '').toLowerCase().includes(searchTerm.toLowerCase().trim())
    );

    return (
        <div className="page-wrapper">
            <div className="container-fluid">
                <div className="page-header d-print-none mt-2">
                    <div className="row g-2 align-items-center">
                        <div className="col">
                            <h2 className="page-title">Production Allocation</h2>
                        </div>
                    </div>
                </div>

                <div className="page-body mt-1">
                    <div className="container-fluid">
                        <ToastContainer position="top-center" autoClose={3000} />
                        {duplicateError && <div style={{ color: 'red' }}>{duplicateError}</div>}

                        <div className="card mt-3">
                            <div className="card-body">
                                <form onSubmit={productionAlloc.ProAlloId === 0 ? handleSubmit : handleUpdate}>
                                    <div className="row gx-3 gy-3">
                                        {/* Item Type */}
                                        <div className="col-md-4 d-flex align-items-center">
                                            <label className="me-2 mb-0" >Item Type</label>

                                            <Select
                                                name="ItemType"
                                                className={`flex-grow-1 ${fieldErrors['ItemType'] ? 'is-invalid' : ''}`}
                                                options={itemTypeOptions}
                                                value={getSelectedValue('ItemType')}
                                                onChange={handleItemTypeChange}
                                                placeholder="Select Item Type"
                                                isClearable
                                                styles={{
                                                    control: (base) => ({
                                                        ...base,
                                                        minHeight: '34px',
                                                        height: '34px',
                                                    }),
                                                    dropdownIndicator: (base) => ({
                                                        ...base,
                                                        padding: '4px',
                                                    }),
                                                    clearIndicator: (base) => ({
                                                        ...base,
                                                        padding: '4px',
                                                    }),
                                                }}
                                            />


                                        </div>

                                        {/* Item */}
                                        <div className="col-md-4 d-flex align-items-center">
                                            <label className="me-2 mb-0" >Item</label>
                                            <Select
                                                name="Itemid"
                                                className={`flex-grow-1 ${fieldErrors['Itemid'] ? 'is-invalid' : ''}`}
                                                options={itemOptions}
                                                value={getSelectedValue('Itemid')}
                                                onChange={(selected) => handleSelectChange(selected, 'Itemid')}
                                                placeholder="Select Item"
                                                isClearable
                                                styles={{
                                                    control: (base) => ({
                                                        ...base,
                                                        minHeight: '34px',
                                                        height: '34px',
                                                    }),
                                                    dropdownIndicator: (base) => ({
                                                        ...base,
                                                        padding: '4px',
                                                    }),
                                                    clearIndicator: (base) => ({
                                                        ...base,
                                                        padding: '4px',
                                                    }),
                                                }}
                                            />

                                        </div>



                                        {/* Starting Date */}
                                        <div className="col-md-2 d-flex align-items-center">
                                            <label className="me-2 mb-0" style={{ width: '120px' }}>Start Date</label>
                                            <input
                                                type="date"
                                                style={{ height: '34px' }}
                                                name="StartingDate"
                                                className={`form-control ${fieldErrors['StartingDate'] ? 'is-invalid' : ''}`}
                                                value={formatDateForInput(productionAlloc.StartingDate)}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div className="col-md-2 d-flex align-items-center">
                                            <label className="me-2 mb-0" style={{ width: '120px' }}>End Date</label>
                                            <input
                                                type="date"
                                                style={{ height: '34px' }}
                                                name="EndingDate"
                                                className={`form-control ${fieldErrors['EndingDate'] ? 'is-invalid' : ''}`}
                                                value={formatDateForInput(productionAlloc.EndingDate)}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                                                                {/* Quantity */}
                                        <div className="col-md-4 d-flex align-items-center">
                                            <label className="me-2 mb-0" style={{ width: '120px' }}>Quantity</label>
                                            <input
                                                type="number"
                                                style={{ height: '34px' }}
                                                name="Qty"
                                                className={`form-control ${fieldErrors['Qty'] ? 'is-invalid' : ''}`}
                                                value={productionAlloc.Qty}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        {/* User */}
                                        <div className="col-md-4 d-flex align-items-center">
                                            <label className="me-2 mb-0" >User</label>
                                            <Select
                                                name="UserId"
                                                className={`flex-grow-1 ${fieldErrors['UserId'] ? 'is-invalid' : ''}`}
                                                options={userOptions}
                                                value={getSelectedValue('UserId')}
                                                onChange={(selected) => handleSelectChange(selected, 'UserId')}
                                                placeholder="Select User"
                                                isClearable
                                                styles={{
                                                    control: (base) => ({
                                                        ...base,
                                                        minHeight: '34px',
                                                        height: '34px',
                                                    }),
                                                    dropdownIndicator: (base) => ({
                                                        ...base,
                                                        padding: '4px',
                                                    }),
                                                    clearIndicator: (base) => ({
                                                        ...base,
                                                        padding: '4px',
                                                    }),
                                                }}
                                            />


                                        </div>

                                        {/* Narration */}
                                        <div className="col-md-12 d-flex align-items-center">
                                            <label className="me-2 mb-0" style={{ width: '120px' }}>Narration</label>
                                            <textarea
                                                style={{ height: '60px' }}
                                                name="Narration"
                                                className={`form-control ${fieldErrors['Narration'] ? 'is-invalid' : ''}`}
                                                value={productionAlloc.Narration}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    {/* Form Buttons */}
                                    <div className="form-footer mt-4 d-flex justify-content-center gap-2">
                                        <button
                                            type="submit"
                                            className="btn "
                                            disabled={productionAlloc.ProAlloId === 0 ? isSubmitDisabled || loading : isUpdateDisabled || loadingUpdate}
                                        >
                                            {loading ? 'Submitting...' : loadingUpdate ? 'Updating...' : productionAlloc.ProAlloId === 0 ? 'Submit' : 'Update'}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn "
                                            onClick={handleDelete}
                                        >
                                            Delete
                                        </button>
                                        <button
                                            type="button"
                                            className="btn "
                                            onClick={handleClear}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </form>
                            </div>

                        </div>

                        <div className="card mt-3">
                            <div className="card-header">
                                <h3 className="card-title">Production Allocation List</h3>
                                <div className="col-md-3 ms-auto">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search by Narration..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="card-body">
                                <table className="table table-bordered">
                                    <thead>
                                        <tr>
                                            <th>Item Type</th>
                                            <th>Item</th>
                                            <th>Quantity</th>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                            <th>User</th>
                                            <th>Narration</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredProductionData.map(item => (
                                            <tr key={item.ProAlloId} onClick={() => handleRowClick(item)} style={{ cursor: 'pointer' }}>
                                                <td>{itemTypes.find(type => type.TypeID == item.ItemType)?.ItemTypeName || 'N/A'}</td>
                                                <td>{items.find(i => i.ItemID == item.Itemid)?.ItemName || 'N/A'}</td>
                                                <td>{item.Qty}</td>
                                                <td>{item.StartingDate ? formatDate(item.StartingDate) : 'N/A'}</td>
                                                <td>{item.EndingDate ? formatDate(item.EndingDate) : 'N/A'}</td>
                                                <td>{users.find(u => u.UserID == item.UserId)?.USERNAME || 'N/A'}</td>
                                                <td>{item.Narration || 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredProductionData.length === 0 && <div className="alert alert-warning">No records found</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductionAlloc;