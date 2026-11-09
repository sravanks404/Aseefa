import React, { useState, useEffect } from "react";
import api from "../../apiService";
import Select from "react-select";
import { FaSearch, FaFilePdf } from "react-icons/fa";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import logo from "../../../src/assets/morelogo.jpg"; // ✅ your static logo


const ProductionAnalysis = () => {
  const [ItemID, setItemID] = useState(sessionStorage.getItem("ItemID") || "");
  const [RequiredQty, setRequiredQty] = useState(sessionStorage.getItem("RequiredQty") || "");
  const [items, setItems] = useState([]);
  const [result, setResult] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [companyData, setCompanyData] = useState(null);
  // 🔄 Sync state with sessionStorage changes across tabs
  useEffect(() => {
    const syncStorage = (e) => {
      if (e.key === "ItemID") {
        setItemID(e.newValue || "");
      }
      if (e.key === "RequiredQty") {
        setRequiredQty(e.newValue || "");
      }
    };
    window.addEventListener("storage", syncStorage);
    return () => window.removeEventListener("storage", syncStorage);
  }, []);

  // ✅ Auto-fetch whenever ItemID or RequiredQty changes
  useEffect(() => {
    if (ItemID && RequiredQty) {
      fetchProductionAnalysis();
    }
  }, [ItemID, RequiredQty]);


  // 🔄 Sync state with sessionStorage changes inside same tab (polling)
  useEffect(() => {
    const interval = setInterval(() => {
      if (sessionStorage.getItem("ItemID") !== ItemID) {
        setItemID(sessionStorage.getItem("ItemID") || "");
      }
      if (sessionStorage.getItem("RequiredQty") !== RequiredQty) {
        setRequiredQty(sessionStorage.getItem("RequiredQty") || "");
      }
    }, 500); // check every 0.5s
    return () => clearInterval(interval);
  }, [ItemID, RequiredQty]);

  // ✅ Fetch items for dropdown
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const CompanyID = sessionStorage.getItem("CompanyID");
        const response = await api.get(`/api/GetItem?CompanyID=${CompanyID}`);
        setItems(response.data || []);
      } catch (err) {
        console.error("Error fetching items:", err);
        setError("Failed to load items.");
      }
    };
    fetchItems();
  }, []);

  const itemOptions = items.map((item) => ({
    value: item.ItemID,
    label: item.ItemName,
  }));

  const selectedItemName =
    itemOptions.find((option) => option.value === parseInt(ItemID))?.label || "";

  // ✅ Save ItemID change
  const handleItemChange = (selectedOption) => {
    const value = selectedOption ? selectedOption.value : "";
    setItemID(value);
    sessionStorage.setItem("ItemID", value);
  };

  useEffect(() => {
    // Retrieve from sessionStorage and parse JSON
    const storedCompanyData = sessionStorage.getItem("companyResponse");
    if (storedCompanyData) {
      setCompanyData(JSON.parse(storedCompanyData));
    }
  }, []);

  // ✅ Save RequiredQty change
  const handleQtyChange = (e) => {
    const value = e.target.value;
    setRequiredQty(value);
    sessionStorage.setItem("RequiredQty", value);
  };

  // ✅ Fetch Production Analysis
  const fetchProductionAnalysis = async () => {
    setIsLoading(true);
    setError("");

    try {
      if (!ItemID || !RequiredQty) {
        setError("ItemID and RequiredQty are required.");
        setIsLoading(false);
        return;
      }

      const params = new URLSearchParams({
        ItemID: parseInt(ItemID, 10),
        RequiredQty: parseFloat(RequiredQty),
      });

      const response = await api.get(`/api/ProductionAnalysis?${params.toString()}`);

      if (response.status === 200 && response.data) {
        setResult(response.data);
      } else {
        setError("Unexpected response from server.");
        setResult([]);
      }
    } catch (err) {
      console.error("Error fetching production analysis:", err);
      setError("Failed to fetch production analysis.");
      setResult([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setItemID("");
    setRequiredQty("");
    setError("");
    setResult([]);
    setSearchQuery("");
    sessionStorage.removeItem("ItemID");
    sessionStorage.removeItem("RequiredQty");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchProductionAnalysis();
  };

  // ✅ Group by IID with search filter
  const groupedData = result.reduce((acc, row) => {
    if (
      !row.ItemName?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !row.ItemTypeName?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return acc; // filter
    }

    if (!acc[row.IID]) {
      acc[row.IID] = {
        itemType: row.ItemTypeName,
        rows: [],
      };
    }

    acc[row.IID].rows.push(row);
    return acc;
  }, {});

  // ✅ Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    let y = 15;

    const pageWidth = doc.internal.pageSize.getWidth();

    // --- Company Info (Left Side) ---
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(companyData?.CompanyName || "", 14, y);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${companyData?.Address || ""}, ${companyData?.Citty || ""}, ${companyData?.State || ""}`,
      14,
      y + 6
    );
    doc.text(
      `Mobile: ${companyData?.MobileNO || "-"} | GST: ${companyData?.GSTinNo || "-"}`,
      14,
      y + 12
    );
    doc.text(`Email: ${companyData?.Email || ""}`, 14, y + 18);

    // --- Logo on Right Side ---
    doc.addImage(logo, "JPEG", pageWidth - 55, y - 5, 40, 25);

    // --- Generated Date under Logo ---
    const generatedDate = new Date().toLocaleString();
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text(`Generated: ${generatedDate}`, pageWidth - 55, y + 28);

    // --- Line Separator ---
    y += 35;
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(14, y, pageWidth - 14, y);
    y += 12;

    // --- Report Title (centered) ---
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Production Analysis Report", pageWidth / 2, y, { align: "center" });
    y += 12;

    // --- Selected Item & Required Qty ---
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Item: ${selectedItemName || "-"}`, 14, y);
    y += 6;
    doc.text(`Required Qty: ${RequiredQty || "-"}`, 14, y);
    y += 12;

    // --- Grouped Tables ---
    Object.keys(groupedData).forEach((iid) => {
      const group = groupedData[iid];

      doc.setFontSize(12);
      doc.setTextColor(40, 40, 200);
      doc.text(`${group.itemType}`, 14, y);
      y += 6;

      doc.autoTable({
        startY: y,
        head: [["Item Name", "Required Qty", "Stock", "Shortage", "Excess"]],
        body: group.rows.map((row) => [
          row.ItemName,
          row.RequiredQty,
          row.Stock,
          row.Shortage,
          row.Excess,
        ]),
        styles: { fontSize: 9, halign: "center" },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          halign: "center",
        },
        columnStyles: { 0: { halign: "left" } },
        theme: "striped",
      });

      y = doc.lastAutoTable.finalY + 10;
    });

    doc.save("ProductionAnalysis.pdf");
  };



  return (
    <div className="container-fluid py-3" style={{ backgroundColor: "#f8f9fa" }}>

      {/* Filter Form */}
      <div className="card shadow-sm border-0 rounded-3 mb-4">
        <h2 className="fw-bold text-primary">📊 Production Analysis</h2>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row align-items-end g-3">
              <div className="col-md-4">
                <label htmlFor="ItemID" className="fw-semibold">
                  Item
                </label>
                <Select
                  id="ItemID"
                  name="ItemID"
                  options={itemOptions}
                  value={itemOptions.find((option) => option.value === parseInt(ItemID)) || null}
                  onChange={handleItemChange}
                  placeholder="🔍 Select Item"
                  isSearchable
                  menuPortalTarget={document.body}   // renders menu outside parent
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }) // ensures it's on top
                  }}
                />

              </div>

              <div className="col-md-3">
                <label htmlFor="RequiredQty" className="fw-semibold">
                  Required Qty
                </label>
                <input
                  type="number"
                  id="RequiredQty"
                  className="form-control"
                  value={RequiredQty}
                  onChange={handleQtyChange}
                  placeholder="Enter Qty"
                  required
                />
              </div>

              <div className="col-md-2 d-flex gap-2">
                <button type="submit" className="btn btn-primary w-100">
                  Generate
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary w-100"
                  onClick={handleClear}
                >
                  Clear
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Search & Grouped Display */}
      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-3">
            {/* Left: Search */}
            <div className="col-lg-3">
              <div className="input-group">
                <span className="input-group-text bg-primary text-white">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by Item / Type ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Right: PDF */}
            {Object.keys(groupedData).length > 0 && (
              <button
                className="btn btn d-flex align-items-center gap-2"
                onClick={exportPDF}
              >
                <FaFilePdf /> PDF
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="text-center text-muted py-4">Loading...</div>
          ) : Object.keys(groupedData).length > 0 ? (
            <div className="table-responsive">
              {Object.keys(groupedData)
                .sort((a, b) => a - b)   // 🔽 sort group keys in descending order
                .map((iid) => {
                  const group = groupedData[iid];

                  return (
                    <div key={iid} className="mb-4">
                      {/* ItemType Header */}
                      <div className="fw-bold bg-primary text-white px-3 py-2 rounded-top">
                        {group.itemType}
                      </div>
                      <table
                        className="table table-hover table-striped table-bordered mb-0 align-middle shadow-sm"
                        style={{ tableLayout: "fixed", width: "100%" }}
                      >
                        <thead className="table-light sticky-top">
                          <tr>
                            <th style={{ width: "50%" }}>Item Name</th>
                            <th className="text-center" style={{ width: "15%" }}>
                              Required Qty
                            </th>
                            <th className="text-center" style={{ width: "15%" }}>
                              Stock
                            </th>
                            <th
                              className="text-center text-danger"
                              style={{ width: "15%" }}
                            >
                              Shortage
                            </th>
                            <th
                              className="text-center text-success"
                              style={{ width: "15%" }}
                            >
                              Excess
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.rows.map((row, idx) => (
                            <tr key={idx}>
                              <td>{row.ItemName}</td>
                              <td className="text-center fw-semibold">
                                {row.RequiredQty}
                              </td>
                              <td className="text-center">{row.Stock}</td>
                              <td
                                className={`text-center ${row.Shortage > 0
                                  ? "text-danger fw-bold"
                                  : "text-muted"
                                  }`}
                              >
                                {row.Shortage}
                              </td>
                              <td
                                className={`text-center ${row.Excess > 0
                                  ? "text-success fw-bold"
                                  : "text-muted"
                                  }`}
                              >
                                {row.Excess}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center text-muted py-4">No data available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductionAnalysis;