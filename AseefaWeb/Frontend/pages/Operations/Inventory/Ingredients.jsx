import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaPlus, FaTrash, FaSave, FaEdit, FaTimes, FaBox, FaBoxOpen, FaList, FaCalculator, FaSearch, FaCopy, FaEye, FaFileExcel, FaPrint } from "react-icons/fa";
import api from '../../apiService';
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

function Ingredients() {
  const [itemTypes, setItemTypes] = useState([]);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [ingredientItems, setIngredientItems] = useState([]);
  const [existingIngredients, setExistingIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('create');
  const [editingIID, setEditingIID] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [itemToMake, setItemToMake] = useState({
    itemType: "",
    itemId: "",
    quantity: 1,
    parentIID: null,
  });

  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    const CompanyID = sessionStorage.getItem("CompanyID");

    const fetchData = async () => {
      setLoading(true);
      try {
        const [itemTypesData, itemsData, ingredientsData] = await Promise.all([
          api.get("/api/GetitemType"),
          api.get("/api/GetitemName"),
          api.get("/api/GetIngredient", { params: { CompanyID } }),
        ]);

        setItemTypes(itemTypesData.data || []);
        setItems(itemsData.data || []);
        setExistingIngredients(ingredientsData.data || []);
      } catch (err) {
        toast.error("Failed to load initial data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredExistingIngredients = existingIngredients.filter(ing => {
    const search = searchTerm.toLowerCase();
    return (
      (ing.ItemName && ing.ItemName.toLowerCase().includes(search)) ||
      (ing.ItemTypeName && ing.ItemTypeName.toLowerCase().includes(search)) ||
      (ing.UnitName && ing.UnitName.toLowerCase().includes(search)) ||
      (ing.ParentItemName && ing.ParentItemName.toLowerCase().includes(search))
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

const parentIngredientOptions = existingIngredients.map((ing) => ({
  value: ing.IID,
  label: `${ing.ItemName || 'Unknown'} (${ing.Qty || 0} ${ing.UnitName || 'units'})`,
}));
  // Add this check to see if you're getting any parent options
console.log('Parent options:', parentIngredientOptions);
console.log('Existing ingredients:', existingIngredients);

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

  const handleParentIngredientChange = (selectedOption) => {
    const parentIID = selectedOption ? selectedOption.value : null;
    setItemToMake((prev) => ({ ...prev, parentIID }));
    if (parentIID) {
      loadParentIngredients(parentIID);
    }
  };

  const loadParentIngredients = async (parentIID) => {
    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      const detailsResponse = await api.get("/api/GetIngredientDetails", {
        params: { CompanyID, IID: parentIID }
      });

      const ingredientDetails = Array.isArray(detailsResponse.data)
        ? detailsResponse.data
        : detailsResponse.data?.data || [];

      // ✅ Merge new ingredients with existing ones instead of replacing
      setIngredients((prev) => [
        ...prev,
        ...ingredientDetails.map(detail => ({
          id: Date.now() + Math.random(),
          ItemID: detail.ProductID,
          itemName: detail.ItemName,
          UnitID: detail.UnitID,
          UnitName: detail.UnitName,
          Qty: detail.Qty,
          UnitCost: detail.UnitCost || detail.Cost || 0,
          TotalCost: detail.TotalCost || (detail.Qty * (detail.UnitCost || detail.Cost || 0)),
        }))
      ]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load parent ingredients");
    }
  };

  const handleMakeQuantityChange = (e) => {
    setItemToMake((prev) => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }));
  };

  const handleIngredientSelectChange = (index, selectedOption) => {
    if (!selectedOption) return;

    const updated = [...ingredients];
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
    setIngredients(updated);
  };

  const handleQuantityChange = (index, value) => {
    const updated = [...ingredients];
    updated[index].Qty = parseFloat(value) || 0;
    updated[index].TotalCost = updated[index].Qty * (parseFloat(updated[index].UnitCost) || 0);
    setIngredients(updated);
  };

  const removeIngredient = (id) => {
    setIngredients((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleItemSelection = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const removeSelectedItems = () => {
    if (selectedItems.length === 0) {
      toast.warning("Please select items to remove");
      return;
    }
    setIngredients((prev) => prev.filter((item) => !selectedItems.includes(item.id)));
    setSelectedItems([]);
  };

  const totalCost = ingredients.reduce((sum, item) => sum + item.TotalCost, 0);

  const saveIngredients = async () => {
    if (!itemToMake.itemId) {
      toast.warning("Please select an item to make");
      return;
    }
    if (ingredients.length === 0) {
      toast.warning("Please add at least one ingredient");
      return;
    }

    setLoading(true);
    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      const UserId = sessionStorage.getItem("UserId");
      const FYearID = sessionStorage.getItem("FYearID") || 1;

      // ADD THE VALIDATION HERE - before creating the payload
      const validDetails = ingredients.map((ing) => {
        // Ensure UnitID is a single value, not an array
        const unitId = Array.isArray(ing.UnitID) ? ing.UnitID[0] || ing.UnitID[1] || 0 : ing.UnitID;
        
        return {
          ProductID: ing.ItemID,
          Qty: ing.Qty,
          UnitID: unitId,
          Unit: unitId,        // Changed from UnitID to Unit
          Cost: ing.TotalCost, 
        };
      });

      const payload = {
        IID: editingIID || 0,
        ItemID: parseInt(itemToMake.itemId, 10),
        ItemType: parseInt(itemToMake.itemType, 10),
        Qty: parseFloat(itemToMake.quantity) || 1,
        ParentIID: itemToMake.parentIID,
        CompanyID: parseInt(CompanyID, 10),
        CreatedBy: parseInt(UserId, 10),
        FYearID: parseInt(FYearID, 10),
        Details: validDetails,// Use the validated details here
      };

      await api.post("/api/WebinsertupdateIngredients", payload);
      toast.success(editingIID ? "Ingredients updated successfully!" : "Ingredients saved successfully!");

      const ingredientsData = await api.get("/api/GetIngredient", { params: { CompanyID } });
      setExistingIngredients(ingredientsData.data || []);
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save ingredients");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIngredients([]);
    setSelectedItems([]);
    setItemToMake({
      itemType: "",
      itemId: "",
      quantity: 1,
      parentIID: null,
    });
    setEditingIID(null);
    setIsModalOpen(false);
    setIsViewMode(false);
    setSelectedIngredient(null);
  };

  const addEmptyRow = () => {
    setIngredients([
      ...ingredients,
      {
        id: Date.now(),
        ItemID: null,
        itemName: "",
        UnitID: null,
        UnitName: "",
        Qty: 0,
        UnitCost: 0,
        TotalCost: 0,
      },
    ]);
  };

  const loadIngredientForEdit = async (ing) => {
    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      const detailsResponse = await api.get("/api/GetIngredientDetails", {
        params: { CompanyID, IID: ing.IID }
      });

      const ingredientDetails = detailsResponse.data?.details || [];
      const master = detailsResponse.data?.master || ing;

      setItemToMake({
        itemType: master.ItemType,
        itemId: master.ItemID,
        quantity: master.Qty,
        parentIID: master.ParentIID,
        unitId: master.UnitID,
        unitName: master.UnitName,
      });

      // Update filteredItems to ensure the select works properly
      if (master.ItemType) {
        const filtered = items.filter((item) => item.ItemType == master.ItemType);
        setFilteredItems(filtered);
      }

      setIngredients(ingredientDetails.map(detail => ({
        id: Date.now() + Math.random(),
        ItemID: detail.ProductID,
        itemName: detail.ItemName,
        UnitID: detail.UnitID,
        UnitName: detail.UnitName,
        Qty: detail.Qty,
        UnitCost: detail.UnitCost,
        TotalCost: detail.TotalCost || (detail.Qty * (detail.UnitCost || detail.Cost || 0)),
      })));

      setEditingIID(master.IID);
      setActiveTab('create');
      setIsModalOpen(true);
      setIsViewMode(false);
      setSelectedIngredient(null);
    
    } catch (err) {
      console.error(err);
      toast.error("Failed to load ingredient details");
    }
  };

  const exportToExcel = () => {
    if (!existingIngredients.length) {
      toast.warning("No data to export");
      return;
    }

    const wb = XLSX.utils.book_new();
    const wsData = [
      ["Ingredients Report"],
      ["Generated on", new Date().toLocaleString()],
      [],
      ["Item Name", "Item Type", "Quantity", "Unit", "Parent Ingredient"]
    ];

    existingIngredients.forEach(item => {
      wsData.push([
        item.ItemName,
        item.ItemTypeName,
        item.Qty,
        item.UnitName || "N/A",
        item.ParentItemName || "N/A"
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Ingredients");
    XLSX.writeFile(wb, `Ingredients_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const exportToPDF = () => {
    if (!existingIngredients.length) {
      toast.warning("No data to export");
      return;
    }

    const doc = new jsPDF({ orientation: "portrait" });
    doc.setFontSize(16);
    doc.text("Ingredients Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 25);

    const columns = [
      { title: "Item Name", dataKey: "itemName" },
      { title: "Item Type", dataKey: "itemType" },
      { title: "Quantity", dataKey: "quantity" },
      { title: "Unit", dataKey: "unit" },
      { title: "Parent", dataKey: "parent" }
    ];

    const rows = existingIngredients.map(item => ({
      itemName: item.ItemName,
      itemType: item.ItemTypeName,
      quantity: item.Qty,
      unit: item.UnitName || "N/A",
      parent: item.ParentItemName || "N/A"
    }));

    doc.autoTable({
      columns,
      body: rows,
      startY: 35,
      theme: "grid",
      styles: { fontSize: 8 }
    });

    doc.save(`Ingredients_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const handleCreateNew = () => {
    resetForm();
    setEditingIID(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleRowClick = (ing) => {
    loadIngredientForEdit(ing);
  };

  const handleDelete = async (IID) => {
    if (!IID) {
      toast.warning("No Ingredient selected to delete");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this Ingredient?")) {
      return;
    }

    try {
      setLoading(true);
      const CompanyID = sessionStorage.getItem("CompanyID");

      // Call delete API (adjust endpoint if needed)
      await api.post("/api/webDeleteIngredient", {
        IID: IID,
        CompanyID: parseInt(CompanyID, 10),
      });

      toast.success("Ingredient deleted successfully!");

      // Refresh table
      const ingredientsData = await api.get("/api/GetIngredient", { params: { CompanyID } });
      setExistingIngredients(ingredientsData.data || []);

      // Reset form if the deleted one was being edited
      if (editingIID === IID) {
        resetForm();
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete Ingredient");
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
              <h3>Ingredients Management</h3>
              <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
                {/* Search */}
                <div className="w-100 w-md-50">
                  <div className="input-group">
                    <span className="input-group-text bg-primary text-white">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search Ingredients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-flex flex-wrap justify-content-end gap-2 w-100 w-md-auto">
                  {/* Create Button */}
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleCreateNew}
                  >
                    <FaPlus className="me-1" /> Create
                  </button>

                  {/* Export Buttons */}
                  <div className="btn-group">
                    <button className="btn btn-outline" onClick={exportToExcel}>
                      <FaFileExcel className="me-1" /> Excel
                    </button>
                    <button className="btn btn-outline" onClick={exportToPDF}>
                      <FaPrint className="me-1" /> PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="card shadow border-0 rounded">
              <div className="card-body">
                {/* Responsive wrapper */}
                <div className="table-responsive">
                  <table className="table table-bordered table-hover">
                    <thead className="table-light">
                      <tr>
                        <th scope="col">Item Name</th>
                        <th scope="col">Item Type</th>
                        <th scope="col">Quantity</th>
                        <th scope="col">Unit</th>
                        <th scope="col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="5" className="text-center">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredExistingIngredients.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center">No ingredients found</td>
                        </tr>
                      ) : (
                        filteredExistingIngredients.map((ing) => (
                          <tr
                            key={ing.IID}
                            style={{ cursor: "pointer" }}
                            className={
                              selectedIngredient?.IID === ing.IID
                                ? "table-active"
                                : ""
                            }
                          >
                            <td onClick={() => handleRowClick(ing)}>{ing.ItemName}</td>
                            <td onClick={() => handleRowClick(ing)}>{ing.ItemTypeName}</td>
                            <td onClick={() => handleRowClick(ing)}>{ing.Qty}</td>
                            <td onClick={() => handleRowClick(ing)}>{ing.UnitName || 'units'}</td>
                            <td>
                              <div className="d-flex">
                               
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDelete(ing.IID)}
                                  title="Delete"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
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
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable" role="document">
            <div className="modal-content shadow-lg rounded-3 overflow-hidden">

              {/* Modal Header */}
              <div className="modal-header bg-gradient-primary text-white py-2">
                <div className="d-flex align-items-center">
                  <div className="bg-white bg-opacity-20 p-2 rounded-circle me-3">
                    <FaBoxOpen className="text-white"/>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0">
                      {editingIID ? 'Edit Ingredients' : isViewMode ? 'View Ingredients' : 'Create New Ingredients'}
                    </h5>
                    <div className="text-sm opacity-85 mt-1">
                      {selectedIngredient && `Item: ${selectedIngredient.ItemName}`}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Close"
                ></button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-2">
                <div className="row">
                  {/* Left Column - Form */}
                  <div className="col-12">
                    {/* Item to Make Section */}
                    <div className="card mb-4 border-0 shadow-sm">
                      <div className="card-header bg-light py-2">
                        <h3 className="mb-0 d-flex align-items-center">
                          <FaBoxOpen className="me-2 text-primary" /> Item to Make
                          {editingIID && <span className="badge bg-warning ms-2">Editing</span>}
                        </h3>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label fw-semibold">Item Type</label>
                            <Select
                              options={itemTypeOptions}
                              value={itemTypeOptions.find(o => o.value == itemToMake.itemType) || null}
                              onChange={handleItemTypeChange}
                              isClearable
                              placeholder="Select item type..."
                              isDisabled={isViewMode}
                            />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label fw-semibold">Item to Make</label>
                            <Select
                              options={itemOptions}
                              value={itemOptions.find(o => o.value == itemToMake.itemId) || null}
                              onChange={handleItemChange}
                              isClearable
                              isDisabled={!itemToMake.itemType || isViewMode}
                              placeholder={itemToMake.itemType ? "Select item..." : "Select type first"}
                              menuPortalTarget={document.body}
                              styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                            />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label fw-semibold">Quantity to Make</label>
                            <input
                              type="number"
                              className="form-control"
                              value={itemToMake.quantity}
                              onChange={handleMakeQuantityChange}
                              disabled={!itemToMake.itemId || isViewMode}
                              placeholder="0"
                              min="0"
                              step="0.01"
                            />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label fw-semibold">Parent Ingredient (Optional)</label>
                            <Select
                              options={parentIngredientOptions}
                              value={parentIngredientOptions.find(o => o.value == itemToMake.parentIID) || null}
                              onChange={handleParentIngredientChange}
                              isClearable
                              placeholder="Select parent ingredient..."
                              isDisabled={isViewMode}
                              menuPortalTarget={document.body}
                              styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ingredients Table Section */}
                    <div className="card border-0 shadow-sm">
                      <div className="card-header bg-light py-3 d-flex justify-content-between align-items-center">
                        <h3 className="mb-0 d-flex align-items-center">
                          <FaList className="me-2 text-primary" /> Ingredients List
                        </h3>

                        {!isViewMode && (
                          <div>
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm d-flex align-items-center me-2"
                              onClick={addEmptyRow}
                            >
                              <FaPlus className="me-1" /> Add Row
                            </button>
                            {selectedItems.length > 0 && (
                              <button
                                type="button"
                                className="btn btn-danger btn-sm d-flex align-items-center"
                                onClick={removeSelectedItems}
                              >
                                <FaTrash className="me-1" /> Remove ({selectedItems.length})
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="card-body p-0">
                        <div className="table-responsive">
                          <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                              <tr>
                                {!isViewMode && (
                                  <th width="30px" className="ps-4 text-center">
                                    <div className="form-check">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedItems(ingredients.map(item => item.id));
                                          } else {
                                            setSelectedItems([]);
                                          }
                                        }}
                                        checked={selectedItems.length === ingredients.length && ingredients.length > 0}
                                      />
                                    </div>
                                  </th>
                                )}
                                <th>Ingredient</th>
                                <th width="140px">Quantity</th>
                                <th width="140px">Unit</th>
                                <th width="140px">Total Cost</th>
                                {!isViewMode && <th width="100px" className="text-center">Actions</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {ingredients.length === 0 ? (
                                <tr>
                                  <td colSpan={isViewMode ? "5" : "6"} className="text-center py-5 text-muted">
                                    <FaList className="me-2" />
                                    No ingredients added yet. {!isViewMode && "Click Add Row to get started."}
                                  </td>
                                </tr>
                              ) : (
                                ingredients.map((item, index) => (
                                  <tr key={item.id} className={selectedItems.includes(item.id) ? 'table-active' : ''}>
                                    {!isViewMode && (
                                      <td className="ps-4 text-center">
                                        <div className="form-check">
                                          <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={selectedItems.includes(item.id)}
                                            onChange={() => toggleItemSelection(item.id)}
                                          />
                                        </div>
                                      </td>
                                    )}

                                    <td style={{ minWidth: "220px" }}>
                                      {isViewMode ? (
                                        <span>{item.itemName}</span>
                                      ) : (
                                        <Select
                                          options={allItemOptions}
                                          value={allItemOptions.find(o => o.value == item.ItemID) || null}
                                          onChange={(selected) => handleIngredientSelectChange(index, selected)}
                                          isClearable
                                          placeholder="Select ingredient..."
                                          menuPortalTarget={document.body}
                                          styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                        />
                                      )}
                                    </td>

                                    <td>
                                      {isViewMode ? (
                                        <span>{item.Qty}</span>
                                      ) : (
                                        <input
                                          type="number"
                                          className="form-control form-control-sm"
                                          value={item.Qty}
                                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                                          min="0"
                                          step="0.01"
                                        />
                                      )}
                                    </td>
                                    
                                    <td>
                                      <span>{item.UnitName || "-"}</span>
                                    </td>

                                    <td>
                                      {isViewMode ? (
                                        <span>₹ {item.TotalCost.toFixed(2)}</span>
                                      ) : (
                                        <input
                                          type="number"
                                          className="form-control form-control-sm"
                                          value={item.TotalCost}
                                          onChange={(e) => {
                                            const updated = [...ingredients];
                                            updated[index].TotalCost = parseFloat(e.target.value) || 0;
                                            setIngredients(updated);
                                          }}
                                          step="0.01"
                                          min="0"
                                        />
                                      )}
                                    </td>

                                    {!isViewMode && (
                                      <td className="text-center">
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-outline-danger"
                                          onClick={() => removeIngredient(item.id)}
                                          title="Remove"
                                        >
                                          <FaTimes />
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Total Cost and Save Button */}
                    <div className="row mt-4">
                      <div className="col-md-6">
                        <div className="card bg-light border-0 p-3">
                          <h5 className="mb-0 d-flex justify-content-between">
                            <span className="text-primary">Total Cost: ₹ {totalCost.toFixed(2)}</span>
                            
                          </h5>
                        </div>
                      </div>
                      
                      {!isViewMode && (
                        <div className="col-md-6 text-end">
                          
                          <div className="d-flex justify-content-end">
  <button
    type="button"
    className="btn btn-primary px-4 py-2 d-flex align-items-center"
    onClick={saveIngredients}
    disabled={loading || ingredients.length === 0 || !itemToMake.itemId}
  >
    {loading ? (
      <>
        <span
          className="spinner-border spinner-border-sm me-2"
          role="status"
        ></span>
        {editingIID ? "Updating..." : "Saving..."}
      </>
    ) : (
      <>
        <FaSave className="me-2" />{" "}
        {editingIID ? "Update Ingredients" : "Save Ingredients"}
      </>
    )}
  </button>
</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .card {
          border-radius: 0.5rem;
        }
        .bg-gradient-primary {
          background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);
        }
        .table th {
          border-top: none;
          font-weight: 600;
          color: #6c757d;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.5px;
        }
        .form-check-input:checked {
          background-color: #4e73df;
          border-color: #4e73df;
        }
        .btn {
          border-radius: 0.375rem;
          font-weight: 500;
        }
        .sticky-top {
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .nav-tabs .nav-link {
          border: none;
          border-bottom: 3px solid transparent;
          color: #6c757d;
        }
        .nav-tabs .nav-link.active {
          border-bottom-color: #4e73df;
          color: #4e73df;
          font-weight: 600;
        }
        .modal-xl {
          max-width: 1200px;
        }
      `}</style>
    </div>
  );
}

export default Ingredients;