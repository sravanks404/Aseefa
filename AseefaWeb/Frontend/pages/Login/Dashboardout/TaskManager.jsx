import { useState, useEffect, useRef } from 'react';
import api from "../../apiService";
import { Modal, Button } from "react-bootstrap";
import { FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

function TaskM() {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
    const [isUpdateDisabled, setIsUpdateDisabled] = useState(false);
    const [isDeleteDisabled, setIsDeleteDisabled] = useState(false);
    const [duplicateError, setDuplicateError] = useState('');
    const [Taskmaster, setTask] = useState({
        TID: 0,
        Taskname: '',
        TDate: '',
        Status: '',
        CreatedBy: '',
        ModifiedBy: '',
    });

    const [routeData, setRouteData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalConfig, setModalConfig] = useState({
        show: false,
        title: "",
        message: "",
        variant: "primary", // Success, Danger, Warning, etc.
        action: "", // 'delete', etc.
    });

    const tableRef = useRef(null); // Define tableRef

    // Handle Input Change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setTask((prevData) => ({
            ...prevData,
            [name]: value || '',
        }));

    };


    const fetchData = async () => {
        const CompanyID = sessionStorage.getItem('CompanyID');
        const Empid = sessionStorage.getItem('UserId');

        if (!CompanyID || !Empid) {
            console.error('CompanyID and Empid are required from sessionStorage');
            return;
        }

        try {
            const response = await api.get(`/api/webGetTask?CompanyID=${CompanyID}`);
            // if (!response.data || !response.data.success || !response.data.data) {
            //     console.warn('No tasks found or invalid response format.');
            //     setRouteData([]);
            //     return;
            // }

            const data = response.data.map((item) => ({
                TID: item.TID || '',
                Taskname: item.Taskname || '',
                TDate: item.Date || '',
                Status: item.Status || '',
                CompanyID: item.CompanyID || '',
            }));

            setRouteData(data);
            setIsSubmitDisabled(false); // Enable submit button
            setIsUpdateDisabled(true);  // Disable update button
            setIsDeleteDisabled(true);  // Disable delete button

            if (tableRef.current) {
                tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } catch (error) {
            setModalConfig({
                show: true,
                title: "Error",
                message: error.response?.data?.error || 'An error occurred while fetching Task',
                variant: "danger",  // Use a 'danger' variant for error messages
                action: '',  // No further action needed after error
            });
            console.error('Error fetching task data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);
    // Submit Function
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const CompanyID = parseInt(sessionStorage.getItem('CompanyID'), 10);
        const Empid = parseInt(sessionStorage.getItem('UserId'), 10);

        if (isNaN(CompanyID) || isNaN(Empid)) {
            alert('Invalid CompanyID or Empid. Please log in again.');
            setLoading(false);
            return;
        }

        const newTask = {
            ...Taskmaster,
            CreatedBy: Empid,
            CreatedDate: new Date(),
            ModifiedBy: Empid,
            ModifiedDate: new Date(),
            DeletedBy: null,
            DeletedDate: null,
            CompanyID: CompanyID,
        };

        try {
            const response = await api.post('/api/webInsertUpdateTask', newTask);
            setMessage(response.data.message);
            //alert("Task information submitted successfully!");
            setModalConfig({
                show: true,
                title: "Submittion Successful",
                message: (
                    <div>
                        {/* <FaCheckCircle style={{ color: 'green' }} size={48} className="mb-3" /> */}
                        Task has been successfully Submitted.
                    </div>
                ),
                variant: "success",
            });
            if (response.data.success) {
                setTask({
                    TID: 0,
                    Taskname: '',
                    TDate: '',
                    Status: '',
                    CompanyID: '',
                });

            }
            await fetchData(); // Refresh Data
            handleClear();
        } catch (error) {
            setModalConfig({
                show: true,
                title: "Error",
                message:
                    error.response?.data?.error || "An error occurred while submitting",
                variant: "danger", // Use a 'danger' variant for error messages
                action: "", // No further action needed after error
            });
            console.error(
                "Error from server:",
                error.response ? error.response.data : error.message
            );
            setError(
                error.response?.data?.error || "An error occurred while registering"
            );
            alert("Failed to submit data!");
            console.error('Error submitting data:', error);
            alert('Failed to submit data!');
        } finally {

            setLoading(false); // Stop loading after the request
            setLoadingSubmit(true);
            await new Promise(resolve => setTimeout(resolve, 2000));
            setLoadingSubmit(false);
        }
    };
    const handleShowModal = (type) => {
        switch (type) {
            case "submit":
                setModalConfig({
                    show: true,
                    title: "Submission Successful",
                    message: (
                        <div>
                            {/* <FaCheckCircle style={{ color: 'green' }} size={48} className="mb-3" /> */}
                            Your data has been successfully submitted.
                        </div>
                    ),
                    variant: "success",
                });
                break;
            case "error":
                setModalConfig({
                    show: true,
                    title: "Submission Failed",
                    message:
                        "An error occurred while submitting your data. Please try again.",
                    variant: "danger",
                });
                break;
            case "update":
                setModalConfig({
                    show: true,
                    title: "Update Successful",
                    message: "Your data has been successfully updated.",
                    variant: "success",
                });
                break;
            case "delete":
                // Ask for confirmation before deletion
                setModalConfig({
                    show: true,
                    title: "Confirm Deletion",
                    message: (
                        <div>
                            {/* <FaExclamationTriangle style={{ color: 'orange' }} size={48} className="mb-3" /> */}
                            Do you really want to delete this item?
                        </div>
                    ),
                    variant: "warning",
                    action: "delete", // Set action to delete
                });
                break;
            default:
                setModalConfig({ show: false });
                break;
        }
    };

    // Fetch Data


    // Update Function
    // Update Function
    const handleUpdate = async (e) => {
        e.preventDefault();

        // Validate the form data
        if (!Taskmaster.Taskname || !Taskmaster.TDate || !Taskmaster.Status) {
            alert('Task is required.');
            return;
        }

        const CompanyID = Number(sessionStorage.getItem('CompanyID'));
        const Empid = Number(sessionStorage.getItem('UserId'));

        if (isNaN(CompanyID) || isNaN(Empid)) {
            alert('Invalid CompanyID or Empid');
            return;
        }

        const updatedTask = {
            ...Taskmaster,
            ModifiedBy: Empid,
            ModifiedDate: new Date().toISOString(),
            CompanyID,
        };

        try {
            setLoadingUpdate(true);  // Set loading state to true while making the request
            setError('');  // Clear any previous error message


            const response = await api.post('/api/webInsertUpdateTask', updatedTask);
            setModalConfig({
                show: true,
                title: "Updation Successful",
                message: (
                    <div>
                        {/* <FaCheckCircle style={{ color: 'green' }} size={48} className="mb-3" /> */}
                        Task has been successfully Updated.
                    </div>
                ),
                variant: "success",
            });
            if (response.data.success) {
                setMessage(response.data.message);

                alert('Employee Message deleted successfully!');



                // Reset task form
                setTask({
                    TID: 0,
                    Taskname: '',
                    TDate: '',
                    Status: '',
                    CompanyID: '',
                });

            }
            // alert('Task updated successfully!');
            fetchData();
            handleClear();
            // else {
            //     alert('Failed to update task!');
        }
        catch (error) {
            console.error('Update request error:', error);
            setError(error.response?.data?.message || 'An error occurred while updating');
            alert('Failed to update task!');
        } finally {
            setLoadingUpdate(false);  // Stop loading after the request
        }
    };

    // Clear Function
    const handleClear = () => {
        setTask({
            TID: 0,
            Taskname: '',
            TDate: '',
            Status: '',
        });
        setSearchTerm(''); // Clear search term if needed
        setMessage('');
        setError('');
        setDuplicateError(''); // Clear duplicate error message
        setIsSubmitDisabled(false); // Disable submit button
        setIsUpdateDisabled(true); // Disable update button
        setIsDeleteDisabled(true); // Disable delete button

    };




    const handleDelete = async (e) => {
        e.preventDefault();


        setMessage("");

        // Retrieve CompanyID and Empid from sessionStorage
        const CompanyID = sessionStorage.getItem("CompanyID");
        const Empid = sessionStorage.getItem("UserId");

        if (!CompanyID || !Empid) {
            console.error("CompanyID and Empid are required from sessionStorage");
            return;
        }


        try {
            setLoadingDelete(true); // Set loading state before making the request

            const response = await api.delete("/api/webDeleteTask", {
                data: {
                    TID: parseInt(Taskmaster.TID),
                    CompanyID: parseInt(CompanyID), // Ensure CompanyID is a number
                    DeletedBy: parseInt(Empid), // Ensure Empid is a number
                },
            });

            // setMessage(response.data.message);
            // alert("location deleted successfully!");

            setModalConfig({
                show: true,
                title: "Delete Successful",
                message: "Your data has been successfully deleted.",
                variant: "success",
            });
            setTask({
                TID: 0,
                Taskname: '',
                TDate: '',
                Status: '',
                CompanyID: '',
            });

            // Clear the success message after 2 seconds
            setTimeout(() => {
                setMessage("");
            }, 2000);

            // Fetch updated location list
            await fetchData();

            // Scroll to the table after data is fetched
            if (tableRef.current) {
                tableRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }
        } catch (error) {

            setModalConfig({
                show: true,
                title: "Error",
                message:
                    error.response?.data?.error || "An error occurred while deleting",
                variant: "danger",
            });

            console.error("Error from server:", error);
            setError(
                error.response?.data?.message || "An error occurred while deleting"
            );
            //alert("Failed to delete data!");
        } finally {
            setLoadingDelete(false); // Stop loading after the request
        }

    };


    const handleRowClick = (item) => {
        const date = item.TDate ? item.TDate.split('T')[0] : ''; // Ensure valid date
        setTask({
            TID: item.TID,
            Taskname: item.Taskname,
            TDate: date,
            Status: item.Status,
            CompanyID: item.CompanyID,
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });

        setIsSubmitDisabled(true);
        setIsUpdateDisabled(false);  // Enable update button
        setIsDeleteDisabled(false);  // Enable delete button
    };
    const handleClose = () =>
        setModalConfig((prev) => ({
            ...prev,
            show: false,
        }));
    const filteredrouteData = routeData
        .filter((item) => {
            const { Taskname = '' } = item;
            const searchTermLower = searchTerm.toLowerCase();
            return Taskname.toLowerCase().includes(searchTermLower);
        })
        .sort((a, b) => {
            const aTasknameLower = a.Taskname.toLowerCase();
            const bTasknameLower = b.Taskname.toLowerCase();
            const searchTermLower = searchTerm.toLowerCase();

            // Check if search term is at the start
            const aStartsWithTerm = aTasknameLower.startsWith(searchTermLower);
            const bStartsWithTerm = bTasknameLower.startsWith(searchTermLower);

            if (aStartsWithTerm && !bStartsWithTerm) {
                return -1; // a should come before b
            }
            if (!aStartsWithTerm && bStartsWithTerm) {
                return 1; // b should come before a
            }
            // If both or neither start with the term, sort alphabetically
            return aTasknameLower.localeCompare(bTasknameLower);
        });

    return (
        <div className="page-wrapper">
            <div className="container-xl">
                <div className="page-header d-print-none mt-2">
                    <div className="row g-2 align-items-center">
                        <div className="col">
                            <h2 className="page-title">Task Master</h2>
                        </div>
                    </div>
                </div>
                <div className="page-body">
                    <div className="container-xl">
                        {duplicateError && <div style={{ color: 'red', marginBottom: '10px' }}>{duplicateError}</div>}
                        <div className="row row-cards">
                            <div className="col-12">
                                <div className="card">
                                    <div className="card-body">
                                        <form className="route-form" onSubmit={handleSubmit}>
                                            <div className="row">
                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="Taskname" className="form-label">
                                                            Task Name
                                                        </label>
                                                        <input
                                                            type="text"
                                                            id="Taskname"
                                                            name="Taskname"
                                                            value={Taskmaster.Taskname}
                                                            onChange={handleInputChange}
                                                            placeholder="Enter the Task"
                                                            className="form-control"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="TDate" className="form-label">
                                                            Task Date
                                                        </label>
                                                        <input
                                                            id="TDate"
                                                            name="TDate"
                                                            type="date"
                                                            value={Taskmaster.TDate}
                                                            onChange={handleInputChange}
                                                            className="form-control"
                                                        />
                                                    </div>
                                                </div>
                                                {/* <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="Taskname" className="form-label">
                                                            Task Name
                                                        </label>
                                                        <input
                                                            type="text"
                                                            id="Taskname"
                                                            name="Taskname"
                                                            value={Taskmaster.Taskname}
                                                            onChange={handleInputChange}
                                                            className="form-control"
                                                        />
                                                    </div>
                                                </div> */}
                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="Status" className="form-label">
                                                            Status
                                                        </label>
                                                        <select
                                                            id="Status"
                                                            name="Status"
                                                            className="form-control"
                                                            value={Taskmaster.Status}
                                                            onChange={handleInputChange}
                                                        >
                                                            <option value="">Select Status</option>
                                                            <option value="1">Active</option>
                                                            <option value="2">Inactive</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="form-footer d-flex justify-content-center">
                                                <button
                                                    type="submit"
                                                    className="btn  mx-1"
                                                    disabled={loadingSubmit || isSubmitDisabled}
                                                >
                                                    {loadingSubmit ? 'Submitting...' : 'Submit'}
                                                </button>
                                                <button type="button"
                                                    className="btn mx-1"
                                                    disabled={isUpdateDisabled || loadingUpdate}
                                                    onClick={handleUpdate}>
                                                    Update

                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn  mx-1"
                                                    disabled={isDeleteDisabled || loadingDelete}
                                                    onClick={handleDelete}
                                                >
                                                    Delete
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn mx-1"
                                                    disabled={false}  // Set to false to always keep the button enabled
                                                    onClick={handleClear}
                                                >
                                                    Clear
                                                </button>

                                            </div>
                                            {error && <div className="alert alert-danger mt-3">{error}</div>}
                                            {message && <div className="alert alert-success mt-3">{message}</div>}
                                        </form>
                                        {/* Modal */}
                                        <Modal
                                            show={modalConfig.show}
                                            onHide={handleClose}
                                            centered
                                        >
                                            <Modal.Header closeButton>
                                                <Modal.Title className={`text-${modalConfig.variant}`}>
                                                    {modalConfig.title}
                                                </Modal.Title>
                                            </Modal.Header>
                                            <Modal.Body className="text-center">
                                                {modalConfig.variant === "warning" && (
                                                    <FaExclamationTriangle
                                                        style={{ color: "orange" }}
                                                        size={48}
                                                        className="mb-3"
                                                    />
                                                )}
                                                {modalConfig.variant === "success" && (
                                                    <FaCheckCircle
                                                        style={{ color: "green" }}
                                                        size={48}
                                                        className="mb-3"
                                                    />
                                                )}
                                                {modalConfig.variant === "danger" && (
                                                    <FaExclamationTriangle
                                                        style={{ color: "red" }}
                                                        size={48}
                                                        className="mb-3"
                                                    />
                                                )}
                                                <p>{modalConfig.message}</p>
                                            </Modal.Body>
                                            <Modal.Footer>
                                                {modalConfig.action === "delete" && (
                                                    <>
                                                        <Button variant="secondary" onClick={handleClose}>
                                                            Cancel
                                                        </Button>
                                                        <Button variant="danger" onClick={handleDelete}>
                                                            Delete
                                                        </Button>
                                                    </>
                                                )}
                                                {modalConfig.action !== "delete" && (
                                                    <Button
                                                        variant={modalConfig.variant}
                                                        onClick={handleClose}
                                                    >
                                                        Close
                                                    </Button>
                                                )}
                                            </Modal.Footer>
                                        </Modal>
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 mt-3">
                                <div className="col">
                                    <div className="row">
                                        <div className="col-12">
                                            <div className="card">
                                                <div className="card-header">
                                                    <h3 className="card-title">Task Data</h3>
                                                    <div className="col-md-3 ms-auto d-print-none">
                                                        <div className="form-group">
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                placeholder="Search..."
                                                                value={searchTerm}
                                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="card-body">
                                                    <table className="table table-bordered">
                                                        <thead>
                                                            <tr>
                                                                <th>TaskName</th>
                                                                <th>Date</th>
                                                                <th>Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {filteredrouteData.map((route) => (
                                                                <tr key={route.TID} onClick={() => handleRowClick(route)}>
                                                                    <td>{route.Taskname}</td>
                                                                    <td>{route.TDate ? new Date(route.TDate).toLocaleDateString('en-GB').replace(/\//g, '-') : ''}</td>

                                                                    <td>{route.Status === 1 ? "Active" : "Inactive"}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
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
}

export default TaskM;