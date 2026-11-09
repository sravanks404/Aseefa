import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import { FaSearch } from "react-icons/fa"; // Import search icon
import api from '../../apiService';

const Customeruser = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const CompanyID = sessionStorage.getItem("CompanyID");
        const response = await api.get(`/api/EmpView?CompanyID=${CompanyID}`);
        setUsers(response.data || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRowClick = (row) => {
    sessionStorage.setItem("UserID", row.EMPID);
    sessionStorage.setItem("UserName", row.Name)
    sessionStorage.setItem("RoleName", row.RoleName)

    navigate(`/TabEmpTrip`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not Updated"; // Handle null or undefined

    const date = new Date(dateString); // Convert to Date object

    // Subtract 5 hours 30 minutes
    date.setTime(date.getTime() - (5 * 60 * 60 * 1000) - (30 * 60 * 1000));

    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };
  const columns = [
    {
      name: "Sl.No",
      selector: (row) => row.SLNo,
      sortable: true,
      width: "80px",
      style: { fontWeight: "bold" },
    },
    {
      name: "Name",
      selector: (row) => row.Name,
      sortable: true,
      wrap: true,
    },
    {
      name: "Role",
      selector: (row) => row.RoleName,
      sortable: true,
    },
    {
      name: "Starting Date",
      selector: (row) => formatDate(row.StartingDate),
      sortable: true,

    },

    {
      name: "Ending Date",
      selector: (row) => formatDate(row.EndingDate),
      sortable: true,
    },
    {
      name: "Mobile",
      selector: (row) => row.Mobile || "N/A",
    },

    {
      name: "Status",
      selector: (row) => {
        if (row.StartingDate && !row.EndingDate) {
          return "In Progress"; // Ending date is null
        } else if (row.StartingDate && row.EndingDate) {
          return "Complete"; // Both dates exist
        } else {
          return "N/A"; // No valid dates
        }
      },
      sortable: true,
    }
  ];

  const filteredUsers = users.filter((user) =>
    user.Name.toLowerCase().includes(filterText.toLowerCase())
  );

  return (

    <div className="container-fluid mt-4 bg-white p-4 shadow rounded">
      <h2 className="mb-4 text-center text-primary">Employee Details</h2>

      {/* Search Bar with Icon */}
      <div class="col-lg-3">
        <div className="input-group mb-3">
          <span className="input-group-text bg-primary text-white">
            <FaSearch />
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Search by Name..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />

        </div>
      </div>
      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        progressPending={loading}
        pagination
        paginationPerPage={10} // Default rows per page
        paginationRowsPerPageOptions={[10, 25, 50, 100]} // Custom pagination options
        highlightOnHover
        pointerOnHover
        responsive
        striped
        onRowClicked={handleRowClick}
      />

    </div>
  );
};


export default Customeruser;