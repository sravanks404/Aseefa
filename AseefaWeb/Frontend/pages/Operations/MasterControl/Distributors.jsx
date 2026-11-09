import { useEffect, useState } from "react";
import api from '../../apiService';
import Select from "react-select";


export default function UserDistributorTable() {
    const [users, setUsers] = useState([]);
    const [distributors, setDistributors] = useState([]);
    const [assignments, setAssignments] = useState({});
    const [selectedUser, setSelectedUser] = useState(null);
    const [rows, setRows] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const CompanyID = sessionStorage.getItem("CompanyID");
            if (!CompanyID) {
                console.error("CompanyID not found in session storage");
                return;
            }

            const [usersResponse, distributorsResponse, assignmentsResponse] = await Promise.all([
                api.get("/api/GetUser", { params: { CompanyID } }),
                api.get("/api/getdistributor", { params: { CompanyID } }),
                api.get("/api/GetEmployeeDistributors", { params: { CompanyID } })
            ]);

            setUsers(usersResponse.data || []);
            setDistributors(distributorsResponse.data || []);

            const existingAssignments = {};
            assignmentsResponse.data?.forEach(({ EmpDistID, EmployeeID, DistributorID }) => {
                existingAssignments[`${EmployeeID}-${DistributorID}`] = {
                    checked: true,
                    EmpDistID,
                    IsDeleted: 0,
                };
            });
            setAssignments(existingAssignments);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    const handleUserChange = (e) => {
        const userId = e.target.value;
        setSelectedUser(userId);

        const userAssignments = Object.entries(assignments)
            .filter(([key, val]) => key.startsWith(`${userId}-`) && val.IsDeleted === 0)
            .map(([key, { EmpDistID, IsDeleted }]) => {
                const [, distributorId] = key.split("-");
                return {
                    id: `${userId}-${distributorId}`,
                    distributorId,
                    EmpDistID: EmpDistID || 0,
                    IsDeleted: IsDeleted || 0
                };
            });

        setRows(userAssignments.length > 0 ? userAssignments : [{ id: Date.now(), distributorId: "", IsDeleted: 0 }]);
    };

    const handleAddRow = () => {
        setRows((prev) => [...prev, { id: Date.now(), distributorId: "", IsDeleted: 0 }]);
    };

    const handleDeleteRow = (rowId) => {
        setRows((prev) =>
            prev.map(row =>
                row.id === rowId
                    ? row.EmpDistID
                        ? { ...row, IsDeleted: 1 } // mark deleted
                        : null // remove if not saved yet
                    : row
            ).filter(Boolean)
        );
    };

    const handleDistributorChange = (rowId, value) => {
        setRows((prev) =>
            prev.map((row) =>
                row.id === rowId ? { ...row, distributorId: value } : row
            )
        );
    };

    const getSelectedDistributorIds = () =>
        rows
            .filter(row => row.IsDeleted !== 1)
            .map(row => String(row.distributorId))
            .filter(id => id);

    const handleSave = async () => {
        const CompanyID = sessionStorage.getItem("CompanyID");
        const currentUserID = sessionStorage.getItem("UserId");
        const now = new Date().toISOString();

        if (!CompanyID || !currentUserID || !selectedUser) {
            console.error("Missing required data for saving");
            return;
        }

        const assignmentData = rows
            .filter(row => row.distributorId || row.EmpDistID) // include deleted saved ones
            .map(row => ({
                EmpDistID: row.EmpDistID || 0,
                EmployeeID: Number(selectedUser),
                DistributorID: Number(row.distributorId),
                CompanyID: Number(CompanyID),
                CreatedBy: Number(currentUserID),
                CreatedDate: now,
                ModifiedBy: Number(currentUserID),
                ModifiedDate: now,
                IsDeleted: row.IsDeleted || 0
            }));

        try {
            await api.post("/api/saveEmployeeDistributor", {
                companyID: Number(CompanyID),
                data: assignmentData
            });
            alert("Assignments saved successfully!");
            await fetchData();
            // Refresh selected user after save
            setSelectedUser(null);
            setRows([]);
        } catch (error) {
            console.error("Error saving assignments:", error);
            alert("Failed to save assignments.");
        }
    };

    return (
        <div className="container-fluid">
            <div className="card shadow-sm">
                <div className="card-body">
                    <h4 className="page-title text-primary">User-Distributor</h4>

                    <div className="row mb-4">
                        <div className="col-md-2">
                            <label className="text-sm font-medium text-gray-700">Select User:</label>
                            <select
                                className="form-control mt-1"
                                value={selectedUser || ""}
                                onChange={handleUserChange}
                            >
                                <option value="" disabled>Select a user</option>
                                {users.map(user => (
                                    <option key={user.UserId} value={user.UserId}>
                                        {user.Name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-10">
                            {selectedUser && (
                                <div className="overflow-auto">
                                    <table className="table table-bordered table-striped">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="text-sm">SL No.</th>
                                                <th className="text-sm">Distributor</th>
                                                <th className="text-sm text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows
                                                .filter(row => row.IsDeleted !== 1)
                                                .map((row, index) => (
                                                    <tr key={row.id}>
                                                        <td className="text-sm">{index + 1}</td>
                                                        <td>
                                                        <Select
    className="basic-single"
    classNamePrefix="select"
    menuPortalTarget={document.body}
    styles={{
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    }}
    value={
        distributors
            .filter((d) => String(d.CustomerID) === String(row.distributorId))
            .map((d) => ({ value: d.CustomerID, label: d.CustomerName }))[0] || null
    }
    onChange={(selectedOption) =>
        handleDistributorChange(row.id, selectedOption?.value || "")
    }
    options={distributors
        .filter((dist) =>
            !getSelectedDistributorIds().includes(String(dist.CustomerID)) ||
            String(dist.CustomerID) === String(row.distributorId)
        )
        .map((dist) => ({
            value: dist.CustomerID,
            label: dist.CustomerName
        }))
    }
    placeholder="Select distributor"
/>



                                                        </td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-danger btn-sm me-2"
                                                                onClick={() => handleDeleteRow(row.id)}
                                                            >
                                                                Delete
                                                            </button>
                                                            {index === rows.length - 1 && (
                                                                <button
                                                                    className="btn btn-success btn-sm"
                                                                    onClick={handleAddRow}
                                                                >
                                                                    Add
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>


                    {selectedUser && (
                        <div className="row">
                            <div className="col-md-10 offset-md-2 text-end">
                                <button
                                    onClick={handleSave}
                                    className="btn btn-primary px-4"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
