import React, { useState, useEffect, useMemo } from "react";
import api from '../../apiService';
import DataTable from "react-data-table-component";
import { FaSearch } from "react-icons/fa";

const OpeningStockReport = () => {
  const [reportData, setReportData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(500);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);

  // Calculate total amount whenever reportData changes
  useEffect(() => {
    const sum = filteredData.reduce((acc, item) => {
      return acc + (parseFloat(item.Totalpurchaserate) || 0);
    }, 0);
    setTotalAmount(sum);
  }, [filteredData]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchOpeningStockReport = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const CompanyID = sessionStorage.getItem("CompanyID");

        if (!CompanyID) {
          setIsLoading(false);
          console.error("CompanyID is missing");
          return;
        }

        const response = await api.get("/api/GetOpeningstockReport", {
          params: { CompanyID },
        });

        setReportData(response.data || []);
        setFilteredData(response.data || []);
      } catch (err) {
        console.error("Error fetching report:", err);
        setError("Failed to fetch report data. Please try again.");
        setReportData([]);
        setFilteredData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOpeningStockReport();
  }, []);

  // Effect to filter data based on search term
  useEffect(() => {
    if (searchQuery) {
      const filtered = reportData.filter(
        (item) =>
          (item.ItemName &&
            item.ItemName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.UnitName &&
            item.UnitName.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(reportData);
    }
  }, [searchQuery, reportData]);

  const columns = [
    {
      name: <span title="Serial Number">SL.No</span>,
      selector: (row, index) => (currentPage - 1) * rowsPerPage + index + 1,
      sortable: false,
      width: "7%",
      minWidth: "50px"
    },
    {
      name: <span title="Opening Number">OpeningNo</span>,
      selector: (row) => row.OpeningNo || 0,
      sortable: true,
      width: "10%",
    },
    {
      name: <span title="Item Name">Item Name</span>,
      selector: (row) => row.ItemName || "N/A",
      sortable: true,
      width: "25%",
    },
    {
      name: <span title="Unit Name">Unit</span>,
      selector: (row) => row.UnitName || "N/A",
      sortable: true,
      width: "7%",
    },
    {
      name: <span title="Quantity">Qty</span>,
      selector: (row) => row.Quantity || 0,
      sortable: true,
      width: "7%",
    },
    {
      name: <span title="Purchase Rate">Purchase<br />Rate</span>,
      selector: (row) => row.purchaserate || "N/A",
      sortable: true,
      width: "12%",
    },
    {
      name: <span title="Sales Rate">Sales Rate</span>,
      selector: (row) => row.Salesrate || 0,
      sortable: true,
      width: "12%",
    },
    {
      name: <span title="Total Rate">Total</span>,
      selector: (row) => row.Totalpurchaserate ? parseFloat(row.Totalpurchaserate).toFixed(2) : "N/A",
      sortable: true,
      width: "20%",
    },
  ];

  // Format number to Indian currency format
  const formatIndianCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num || 0);
  };

  // Custom footer component for pagination
  const CustomFooter = ({ rowsPerPage, rowCount, currentPage, onChangePage, onChangeRowsPerPage }) => {
    const totalPages = Math.ceil(rowCount / rowsPerPage);
    return (
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-3 bg-light">
        <div className="fw-semibold text-dark mb-2 mb-md-0">
          Total Amount: {formatIndianCurrency(totalAmount)}
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          <label className="me-2">Rows per page:</label>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              onChangeRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="form-select form-select-sm w-auto"
          >
            <option value={500}>500</option>
            <option value={1000}>1000</option>
            <option value={10000}>10000</option>
          </select>

          <span className="mx-2">
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>

          <div className="btn-group btn-group-sm" role="group">
            <button
              className="btn btn-outline-secondary"
              onClick={() => onChangePage(1)}
              disabled={currentPage === 1}
            >
              ⏮
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => onChangePage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ◀
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => onChangePage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              ▶
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => onChangePage(totalPages)}
              disabled={currentPage === totalPages}
            >
              ⏭
            </button>
          </div>
        </div>
      </div>
    );
  };

  const customStyles = {
    headCells: {
      style: {
        fontSize: "13px",
        fontWeight: "bold",
      },
    },
    cells: {
      style: {
        fontSize: "13px",
      },
    },
  };

  // Calculate paginated data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  return (
    <div className="container-fluid">
      <div className="card shadow-sm">
        <div className="card-body">
          {/* Reduced heading size to 24px */}
          <h3 className="my-3" style={{ color: 'rgb(1, 9, 14)', fontSize: '15px' }}>
            Opening Stock Report
          </h3>

          {/* Search Input */}
          {/* Search Input - Modified to have icon on left */}
          <div className="mb-3 input-group" style={{ width: "300px" }}>
            <span className="input-group-text bg-primary text-white">
              <FaSearch size={14} />
            </span>
            <input
              type="text"
              placeholder="Search by ItemName/UnitName..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control form-control-sm"
              style={{
                height: "32px",
                fontSize: "13px",
                padding: "0.25rem 0.5rem"
              }}
            />
          </div>

          {error && <div className="alert alert-danger mt-3">{error}</div>}
          {isLoading && <div className="text-center mt-3">Loading...</div>}

          {/* Bigger scrollable area - increased height */}
          <div style={{
            height: "calc(100vh - 200px)",  // Increased from calc(90vh - 250px)
            overflow: "auto",               // Changed from "hidden" to "auto"
            border: "1px solid #dee2e6",    // Added border
            borderRadius: "4px",            // Added border radius
            backgroundColor: "#fff"         // White background
          }}>
            <DataTable
              columns={columns}
              data={paginatedData}
              pagination
              paginationPerPage={rowsPerPage}
              paginationRowsPerPageOptions={[500, 1000, 10000]}
              highlightOnHover
              striped
              fixedHeader
              fixedHeaderScrollHeight="calc(100vh - 300px)" // Increased scroll height
              customStyles={{
                ...customStyles,
                tableWrapper: {
                  style: {
                    maxHeight: "none", // Allow table to expand
                  },
                },
              }}
              paginationComponent={({ rowsPerPage, rowCount, currentPage, onChangePage, onChangeRowsPerPage }) => (
                <CustomFooter
                  rowsPerPage={rowsPerPage}
                  rowCount={filteredData.length}
                  currentPage={currentPage}
                  onChangePage={(page) => {
                    setCurrentPage(page);
                    onChangePage(page);
                  }}
                  onChangeRowsPerPage={(count) => {
                    setRowsPerPage(count);
                    onChangeRowsPerPage(count);
                  }}
                />
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpeningStockReport;