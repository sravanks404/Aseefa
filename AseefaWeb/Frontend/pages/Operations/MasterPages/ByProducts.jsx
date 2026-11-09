import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaPlus, FaTrash, FaSave, FaEdit, FaTimes, FaBox, FaBoxOpen, FaList, FaCalculator, FaSearch, FaCopy, FaEye, FaFileExcel, FaPrint } from "react-icons/fa";
import api from '../../apiService';
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

function Byproducts() {
  const [itemTypes, setItemTypes] = useState([]);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [byproducts, setByproducts] = useState([]);
  const [byproductItems, setByproductItems] = useState([]);
  const [existingByproducts, setExistingByproducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('create');
  const [editingBPID, setEditingBPID] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedByproduct, setSelectedByproduct] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [itemToMake, setItemToMake] = useState({
    itemType: "",
    itemId: "",
    quantity: 1,
    parentBPID: null,
  });

  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    const CompanyID = sessionStorage.getItem("CompanyID");

    const fetchData = async () => {
      setLoading(true);
      try {
        const [itemTypesData, itemsData, byproductsData] = await Promise.all([
          api.get("/api/GetitemType"),
          api.get("/api/GetitemName"),
          api.get("/api/Webgetbyproduct", { params: { CompanyID } }), // Updated endpoint
        ]);

        setItemTypes(itemTypesData.data || []);
        setItems(itemsData.data || []);
        setExistingByproducts(byproductsData.data || []); // Updated state
      } catch (err) {
        toast.error("Failed to load initial data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredExistingByproducts = existingByproducts.filter(bp => {
    const search = searchTerm.toLowerCase();
    return (
      (bp.ItemName && bp.ItemName.toLowerCase().includes(search)) ||
      (bp.ItemTypeName && bp.ItemTypeName.toLowerCase().includes(search)) ||
      (bp.UnitName && bp.UnitName.toLowerCase().includes(search)) ||
      (bp.ParentItemName && bp.ParentItemName.toLowerCase().includes(search))
    );
  });

  const itemTypeOptions = itemTypes.map((type) => ({
    value: type.TypeID,
    label: type.ItemTypeName,
  }));

  const itemOptions = filteredItems.map((item) => ({
    value: item.ItemID,
    label: item.ItemName,
    unitId: item.UnitID,
    unitName: item.UnitName,
  }));



  const allItemOptions = items.map((item) => ({
    value: item.ItemID,
    label: item.ItemName,
    unitCost: item.UnitCost || 0,
    unitId: item.UnitID,
    unitName: item.UnitName,
  }));

  const handleItemTypeChange = (selectedOption) => {
    const typeId = selectedOption ? selectedOption.value : "";
    setItemToMake((prev) => ({ ...prev, itemType: typeId, itemId: "" }));

    if (typeId) {
      const filtered = items.filter((item) => item.ItemType == typeId);
      setFilteredItems(filtered);
    } else {
      setFilteredItems([]);
    }
  };

  const handleItemChange = (selectedOption) => {
    if (selectedOption) {
      const itemId = selectedOption.value;
      const unitId = selectedOption.unitId;
      const unitName = selectedOption.unitName;

      setItemToMake((prev) => ({
        ...prev,
        itemId,
        unitId,
        unitName
      }));
    } else {
      setItemToMake((prev) => ({ ...prev, itemId: "", unitId: null, unitName: "" }));
    }
  };

  const handleMakeQuantityChange = (e) => {
    setItemToMake((prev) => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }));
  };

  const handleByproductSelectChange = (index, selectedOption) => {
    if (!selectedOption) return;

    const updated = [...byproducts];
    updated[index] = {
      ...updated[index],
      ItemID: selectedOption.value,
      itemName: selectedOption.label,
      UnitID: selectedOption.unitId,
      UnitName: selectedOption.unitName,
      UnitCost: parseFloat(selectedOption.unitCost) || 0,
      Qty: (updated[index].Qty || 0),
      TotalCost: (updated[index].Qty || 0) * (parseFloat(selectedOption.unitCost) || 0),
    };
    setByproducts(updated);
  };

  const handleQuantityChange = (index, value) => {
    const updated = [...byproducts];
    updated[index].Qty = parseFloat(value) || 0;
    updated[index].TotalCost = updated[index].Qty * (parseFloat(updated[index].UnitCost) || 0);
    setByproducts(updated);
  };

  const removeByproduct = (id) => {
    setByproducts((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleItemSelection = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };


  const totalCost = byproducts.reduce((sum, item) => sum + (item.TotalCost || 0), 0);

  const saveByproducts = async () => {
    if (!itemToMake.itemId) {
      toast.warning("Please select an item to make");
      return;
    }
    if (byproducts.length === 0) {
      toast.warning("Please add at least one byproduct");
      return;
    }

    setLoading(true);
    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      const UserId = sessionStorage.getItem("UserId");
      const FYearID = sessionStorage.getItem("FYearID") || 1;

      // ADD THE VALIDATION HERE - before creating the payload
      const validDetails = byproducts.map((bp) => {
        // Ensure UnitID is a single value, not an array
        const unitId = Array.isArray(bp.UnitID) ? bp.UnitID[0] || bp.UnitID[1] || 0 : bp.UnitID;

        return {
          ProductID: bp.ItemID,
          Qty: bp.Qty,
          UnitID: unitId,
          Unit: unitId,        // Changed from UnitID to Unit
          Cost: bp.TotalCost,
        };
      });

      const payload = {
        BPID: editingBPID || 0, // Changed from IID to BPID
        ItemID: parseInt(itemToMake.itemId, 10),
        ItemType: parseInt(itemToMake.itemType, 10),
        Qty: parseFloat(itemToMake.quantity) || 1,

        CompanyID: parseInt(CompanyID, 10),
        CreatedBy: parseInt(UserId, 10),
        FYearID: parseInt(FYearID, 10),
        Details: validDetails, // Use the validated details here
      };
      await api.post("/api/WebInsertUpdateByproducts", payload); // Updated endpoint
      toast.success(editingBPID ? "Byproducts updated successfully!" : "Byproducts saved successfully!");
      const byproductsData = await api.get("/api/Webgetbyproduct", { params: { CompanyID } }); // Updated endpoint
      setExistingByproducts(byproductsData.data || []);
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save byproducts");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setByproducts([]);
    setSelectedItems([]);
    setItemToMake({
      itemType: "",
      itemId: "",
      quantity: 1,

    });
    setEditingBPID(null); // Changed from editingIID to editingBPID
    setIsModalOpen(false);
    setIsViewMode(false);
    setSelectedByproduct(null); // Changed from selectedIngredient to selectedByproduct
  };

  const addEmptyRow = () => {
    setByproducts([
      ...byproducts,
      {
        id: Date.now(),
        ItemID: null,
        itemName: "",
        UnitID: null,
        UnitName: "",
        Qty: 0,

        TotalCost: 0,
      },
    ]);
  };

  const loadByproductForEdit = async (bp) => {
    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      const detailsResponse = await api.get("/api/Webgetbyproductdetails", { // Updated endpoint
        params: { CompanyID, BPID: bp.BPID } // Updated parameter
      });

      const byproductDetails = detailsResponse.data?.details || [];
      const master = detailsResponse.data?.master || bp;

      setItemToMake({
        itemType: master.ItemType,
        itemId: master.ItemID,
        quantity: master.Qty,
        unitId: master.UnitID,
        unitName: master.UnitName,
      });

      // Update filteredItems to ensure the select works properly
      if (master.ItemType) {
        const filtered = items.filter((item) => item.ItemType == master.ItemType);
        setFilteredItems(filtered);
      }

      setByproducts(byproductDetails.map(detail => ({
        id: Date.now() + Math.random(),
        ItemID: detail.ProductID,
        itemName: detail.ItemName,
        UnitID: detail.UnitID,
        UnitName: detail.UnitName,   // ✅ now this will come from SQL
        Qty: detail.DetailQty,
        TotalCost: detail.Cost || (detail.Qty * (detail.UnitCost || detail.Cost || 0)),
      })));


      setEditingBPID(master.BPID); // Changed from IID to BPID
      setActiveTab('create');
      setIsModalOpen(true);
      setIsViewMode(false);
      setSelectedByproduct(null); // Changed from selectedIngredient to selectedByproduct

    } catch (err) {
      console.error(err);
      toast.error("Failed to load byproduct details");
    }
  };

  const exportToExcel = () => {
    if (!existingByproducts.length) {
      toast.warning("No data to export");
      return;
    }

    const wb = XLSX.utils.book_new();
    const wsData = [
      ["Byproducts Report"], // Updated title
      ["Generated on", new Date().toLocaleString()],
      [],
      ["Item Name", "Item Type", "Quantity", "Unit",] // Updated header
    ];

    existingByproducts.forEach(item => {
      wsData.push([
        item.ItemName,
        item.ItemTypeName,
        item.Qty,
        item.UnitName || "N/A",

      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Byproducts"); // Updated sheet name
    XLSX.writeFile(wb, `Byproducts_${new Date().toISOString().split("T")[0]}.xlsx`); // Updated filename
  };

  const exportToPDF = () => {
    if (!existingByproducts.length) {
      toast.warning("No data to export");
      return;
    }

    const doc = new jsPDF({ orientation: "portrait" });
    doc.setFontSize(16);
    doc.text("Byproducts Report", 14, 15); // Updated title
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 25);

    const columns = [
      { title: "Item Name", dataKey: "itemName" },
      { title: "Item Type", dataKey: "itemType" },
      { title: "Quantity", dataKey: "quantity" },
      { title: "Unit", dataKey: "unit" },

    ];

    const rows = existingByproducts.map(item => ({
      itemName: item.ItemName,
      itemType: item.ItemTypeName,
      quantity: item.Qty,
      unit: item.UnitName || "N/A",

    }));

    doc.autoTable({
      columns,
      body: rows,
      startY: 35,
      theme: "grid",
      styles: { fontSize: 8 }
    });

    doc.save(`Byproducts_${new Date().toISOString().split("T")[0]}.pdf`); // Updated filename
  };

  const handleCreateNew = () => {
    resetForm();
    setEditingBPID(null); // Changed from editingIID to editingBPID
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleRowClick = (bp) => {
    loadByproductForEdit(bp);
  };

  const handleDelete = async (BPID) => { // Changed parameter from IID to BPID
    if (!BPID) {
      toast.warning("No Byproduct selected to delete");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this Byproduct?")) {
      return;
    }

    try {
      setLoading(true);
      const CompanyID = sessionStorage.getItem("CompanyID");
      const Empid = parseInt(sessionStorage.getItem('UserId'), 10);
      // Call delete API (adjust endpoint if needed)
      await api.post("/api/webDeleteByproduct", { // Updated endpoint
        BPID: BPID, // Changed from IID to BPID
        DeletedBy: parseInt(Empid, 10),
        
      });

      toast.success("Byproduct deleted successfully!");

      // Refresh table
      const byproductsData = await api.get("/api/Webgetbyproduct", { params: { CompanyID } }); // Updated endpoint
      setExistingByproducts(byproductsData.data || []);

      // Reset form if the deleted one was being edited
      if (editingBPID === BPID) { // Changed from editingIID to editingBPID
        resetForm();
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete Byproduct");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container-fluid">
        <div className="page-body mt-0">
          <div className="container-fluid">
            <ToastContainer position="top-center" autoClose={3000} />

            {/* Search and Action Buttons */}
            <div className="card shadow-sm mb-3 p-3">
              <h3>Byproducts Management</h3> {/* Updated title */}
              <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
                <div className="d-flex align-items-center w-100">
                  <FaSearch className="me-2" />
                  <div className="col-6">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search byproducts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="d-flex gap-2 mt-2 mt-md-0">
                  <button className="btn btn-outline-primary" onClick={handleCreateNew}>
                    <FaPlus className="me-1" /> New Byproduct
                  </button>
                  <button className="btn btn-outline-success" onClick={exportToExcel}>
                    <FaFileExcel className="me-1" /> Excel
                  </button>
                  <button className="btn btn-outline-danger" onClick={exportToPDF}>
                    <FaPrint className="me-1" /> PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Existing Byproducts Table */}
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Item Name</th>
                        <th>Item Type</th>
                        <th>Quantity</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExistingByproducts.map((bp, index) => (
                        <tr key={bp.BPID}>
                          <td>{index + 1}</td>
                          <td>{bp.ItemName}</td>
                          <td>{bp.ItemTypeName}</td>
                          <td>{bp.Qty}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleRowClick(bp)}
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(bp.BPID)} // Changed from IID to BPID
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
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

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary ">
                <h5 className="modal-title">
                  {editingBPID ? "Edit Byproduct" : "Create New Byproduct"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(false);
                  }}
                ></button>
              </div>

              <div className="modal-body">
                {/* Item Information Card */}
                <div className="card mb-4">

                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Item Type</label>
                        <Select
                          options={itemTypeOptions}
                          value={itemTypeOptions.find(option => option.value == itemToMake.itemType) || null}
                          onChange={handleItemTypeChange}
                          isDisabled={isViewMode}
                          placeholder="Select Item Type"
                          className="react-select-container"
                          classNamePrefix="react-select"
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Item to Make</label>
                        <Select
                          options={itemOptions}
                          value={itemOptions.find(option => option.value == itemToMake.itemId) || null}
                          onChange={handleItemChange}
                          isDisabled={isViewMode}
                          placeholder="Select Item"
                          className="react-select-container"
                          classNamePrefix="react-select"
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label">Quantity to Make</label>
                        <input
                          type="number"
                          className="form-control"
                          value={itemToMake.quantity}
                          onChange={handleMakeQuantityChange}
                          disabled={isViewMode}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="col-md-6 d-flex align-items-end">
                        {itemToMake.unit && (
                          <div className="w-100">
                            <label className="form-label">Unit</label>
                            <div className="form-control bg-light">{itemToMake.unit}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Byproducts Card */}
                <div className="card">
                  <div className="card-header bg-light d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">Byproducts</h6>
                    <div className="d-flex gap-2">

                      <button
                        className="btn btn-sm btn-primary"
                        onClick={addEmptyRow}
                        disabled={isViewMode}
                      >
                        <FaPlus className="me-1" /> Add Row
                      </button>
                    </div>
                  </div>

                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: "40px" }}>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedItems(byproducts.map(item => item.id));
                                    } else {
                                      setSelectedItems([]);
                                    }
                                  }}
                                  checked={selectedItems.length === byproducts.length && byproducts.length > 0}
                                  disabled={isViewMode || byproducts.length === 0}
                                />
                              </div>
                            </th>
                            <th>Item</th>
                            <th style={{ width: "120px" }}>Quantity</th>
                            {/* <th style={{ width: "100px" }}>Unit</th> */}
                            <th style={{ width: "140px" }}>Total Cost</th>
                            {!isViewMode && <th style={{ width: "80px" }}>Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {byproducts.length > 0 ? (
                            byproducts.map((item, index) => (
                              <tr key={item.id} className={selectedItems.includes(item.id) ? "table-active" : ""}>
                                <td>
                                  <div className="form-check">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      checked={selectedItems.includes(item.id)}
                                      onChange={() => toggleItemSelection(item.id)}
                                      disabled={isViewMode}
                                    />
                                  </div>
                                </td>
                                <td>
                                  <Select
                                    options={allItemOptions}
                                    value={allItemOptions.find(option => option.value == item.ItemID) || null}
                                    onChange={(selected) => handleByproductSelectChange(index, selected)}
                                    isDisabled={isViewMode}
                                    isClearable
                                    placeholder="Select Item"
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                    menuPortalTarget={document.body}   // ✅ render menu at body level
                                    styles={{
                                      control: (base) => ({
                                        ...base,
                                        minHeight: '30px',
                                        fontSize: '14px',
                                      }),
                                      menuPortal: (base) => ({ ...base, zIndex: 9999 }), // ✅ ensure dropdown stays on top
                                    }}
                                  />

                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    value={item.Qty}
                                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                                    disabled={isViewMode}
                                    min="0"
                                    step="0.01"
                                  />
                                </td>
                                {/* <td>
                            <span>{item.UnitName || "-"}</span>
                          </td> */}
                                <td>
                                  <div className="input-group input-group-sm">
                                    <span className="input-group-text">₹ </span>
                                    <input
                                      type="number"
                                      className="form-control"
                                      value={item.TotalCost}
                                      onChange={(e) => {
                                        const updated = [...byproducts];
                                        updated[index].TotalCost = parseFloat(e.target.value) || 0;
                                        setByproducts(updated);
                                      }}
                                      step="0.01"
                                      min="0"
                                      disabled={isViewMode}
                                    />
                                  </div>
                                </td>
                                {!isViewMode && (
                                  <td>
                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => removeByproduct(item.id)}
                                      title="Delete item"
                                    >
                                      <FaTrash />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={isViewMode ? "5" : "6"} className="text-center py-4 text-muted">
                                No byproducts added yet
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot className="table-group-divider">
                          <tr>
                            <td colSpan={isViewMode ? "3" : "2"} className="text-end fw-bold">Total:</td>
                            <td className="fw-bold">₹ {totalCost.toFixed(2)}</td>
                            {!isViewMode && <td></td>}
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">


                {!isViewMode && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={saveByproducts}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-1" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave className="me-1" />
                        {editingBPID ? "Update" : "Save"}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Byproducts;