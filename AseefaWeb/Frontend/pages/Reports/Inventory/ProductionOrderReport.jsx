import React, { useState, useEffect } from "react";
import api from "../../apiService";
import DataTable from "react-data-table-component";
import { FaSearch } from "react-icons/fa";
import Select from "react-select";

const ProductionOrderReport = ({ onTabChange }) => {
  const getCurrentDate = () => new Date().toISOString().split("T")[0];
  const getPreviousDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];
  };

  const [fromDate, setFromDate] = useState(getPreviousDate(30));
  const [toDate, setToDate] = useState(getCurrentDate());
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoot, setSelectedRoot] = useState(null); // 👈 react-select option

  const customStyles = {
    headCells: {
      style: {
        fontSize: "14px",
        fontWeight: "bold",
        backgroundColor: "#f1f3f5",
        borderBottom: "1px solid #dee2e6",
      },
    },
    rows: {
      style: {
        fontSize: "13px",
        borderBottom: "1px solid #e9ecef",
      },
    },
  };

  // Fetch Production Orders
  const fetchProductionOrders = async () => {
    setIsLoading(true);
    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      const response = await api.get("/api/ProductionOrder", {
        params: { CompanyID, FromDate: fromDate, ToDate: toDate },
      });
      setReportData(response.data || []);
    } catch (err) {
      console.error("Error fetching production orders:", err);
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductionOrders();
  }, []);

  // Analyse button handler
  const handleAnalyse = (row) => {
    sessionStorage.setItem("ItemID", row.ItemID);
    sessionStorage.setItem("RequiredQty", row.Qty);
    onTabChange("ProductionAnalysis");
  };

  // DataTable columns
  const columns = [
    {
      name: "Sl No",
      selector: (_, index) => index + 1,
      width: "8%",
    },
    {
      name: "Root Name",
      selector: (row) => row.RootName || "N/A",
      sortable: true,
      wrap: true,
    },
    {
      name: "Item Name",
      selector: (row) => row.ItemName || "N/A",
      sortable: true,
      wrap: true,
    },
    {
      name: "Quantity",
      selector: (row) => row.Qty || 0,
      sortable: true,
      width: "15%",
    },
    {
      name: "Action",
      cell: (row) => (
        <button
          className="btn btn-sm btn-primary"
          onClick={() => handleAnalyse(row)}
        >
          Analyse
        </button>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: "15%",
    },
  ];

  // Build Root options for react-select
  const rootOptions = [
    { value: "", label: "All Roots" },
    ...new Map(
      reportData
        .filter((r) => r.RootId)
        .map((r) => [r.RootId, { value: r.RootId, label: r.RootName }])
    ).values(),
  ];

  // Apply filters
  const filteredData = reportData.filter((row) => {
    const matchesRoot =
      !selectedRoot?.value || row.RootId?.toString() === selectedRoot.value.toString();
    const matchesSearch =
      row.ItemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.Qty?.toString().includes(searchQuery);
    return matchesRoot && matchesSearch;
  });

  return (
    <div className="container-fluid">
      <div className="card shadow-sm mb-3 p-3">
        <h4>Production Orders</h4>
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
          {/* Search */}
          <div className="w-45 w-md-50">
            <div className="input-group">
              <span className="input-group-text bg-primary text-white">
                <FaSearch />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by Item or Quantity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Root Filter with react-select */}
          <div className="d-flex gap-2 align-items-center">
            <div style={{ minWidth: "200px" }}>
              <Select
                classNamePrefix="react-select"
                options={rootOptions}
                value={selectedRoot}
                onChange={(val) => setSelectedRoot(val)}
                placeholder="Filter by Root..."
                isClearable
              />
            </div>

            {/* Date Range */}
            <input
              type="date"
              className="form-control"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <input
              type="date"
              className="form-control"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
            <button
              className="btn btn-outline-primary"
              onClick={fetchProductionOrders}
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow border-0 rounded">
        <DataTable
          columns={columns}
          data={filteredData}
          progressPending={isLoading}
          highlightOnHover
          striped
          pagination
          customStyles={customStyles}
          progressComponent={
            <div className="text-center p-4">
              <div className="spinner-border text-primary"></div>
              <p className="mt-2">Loading Production Orders...</p>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default ProductionOrderReport;
