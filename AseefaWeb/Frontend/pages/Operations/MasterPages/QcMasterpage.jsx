import React, { useState, useEffect } from "react";
import api from "../../apiService";
import Select from "react-select";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function QcMaster() {
  const [qc, setQc] = useState({
    Qcid: 0,
    Itemtype: "",
    Itemid: "",
    QcName: "",
    Fromvalue: "",
    Value: "",
    CompanyID: "",
    CreatedBy: "",
    ModifiedBy: "",
    CreatedDate: "",
    ModifiedDate: "",
    IsDeleted: 0
  });

  const [itemTypes, setItemTypes] = useState([]);
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qcData, setQcData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Load dropdown data
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [typesRes, itemsRes] = await Promise.all([
          api.get("/api/GetitemType"),
          api.get("/api/GetitemName")
        ]);
        setItemTypes(typesRes.data);
        setItems(itemsRes.data);
        setAllItems(itemsRes.data);
      } catch (err) {
        toast.error("Failed to load dropdowns");
      }
    };
    fetchDropdowns();
    fetchQcList();
  }, []);

  // Fetch existing QC records
  const fetchQcList = async () => {
    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      const res = await api.get("/api/GetQcMaster", { params: { CompanyID } });
      setQcData(res.data);
    } catch (err) {
      toast.error("Failed to fetch QC Master");
    }
  };

  // Handle item type change
  const handleItemTypeChange = (selected) => {
    setQc((prev) => ({
      ...prev,
      Itemtype: selected ? selected.value : "",
      Itemid: ""
    }));
    if (selected) {
      const filtered = allItems.filter((i) => i.ItemType === selected.value);
      setItems(filtered);
    } else {
      setItems(allItems);
    }
  };

  // Handle Save (Insert/Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const UserId = sessionStorage.getItem("UserId");
      const CompanyID = sessionStorage.getItem("CompanyID");

      const payload = {
        ...qc,
        CompanyID: parseInt(CompanyID, 10),
        CreatedBy: isEditMode ? qc.CreatedBy : parseInt(UserId, 10),
        ModifiedBy: isEditMode ? parseInt(UserId, 10) : null,
        CreatedDate: isEditMode ? qc.CreatedDate : new Date().toISOString(),
        ModifiedDate: isEditMode ? new Date().toISOString() : null
      };

      const res = await api.post("/api/InsertUpdateQcMaster", payload);

      toast.success(res.data.message || "Saved successfully!");
      fetchQcList();
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  // Delete QC
  const handleDelete = async () => {
    if (!qc.Qcid || qc.Qcid === 0) {
      toast.warning("No QC selected for delete");
      return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete this QC?");
    if (!confirmDelete) return;

    try {
      const UserId = sessionStorage.getItem("UserId");
      await api.post("/api/DeleteQcmaster", {
        Qcid: qc.Qcid,
        DeletedBy: parseInt(UserId, 10),
        DeletedDate: new Date().toISOString(),
      });
      toast.success("QC deleted successfully!");
      fetchQcList();
      resetForm();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  // Reset form
  const resetForm = () => {
    setQc({
      Qcid: 0,
      Itemtype: "",
      Itemid: "",
      QcName: "",
      Fromvalue: "",
      Value: "",
      CompanyID: "",
      CreatedBy: "",
      ModifiedBy: "",
      CreatedDate: "",
      ModifiedDate: "",
      IsDeleted: 0
    });
    setIsEditMode(false);
  };

  // Edit row
  const handleRowClick = (row) => {
    setQc(row);
    setIsEditMode(true);
  };

  const filteredQcData = qcData.filter((row) => {
    const search = searchTerm.toLowerCase().trim();
    const itemTypeName = itemTypes.find((t) => t.TypeID === row.Itemtype)?.ItemTypeName || "";
    const itemName = allItems.find((i) => i.ItemID === row.Itemid)?.ItemName || "";

    return (
      row.QcName?.toLowerCase().includes(search) ||
      itemTypeName.toLowerCase().includes(search) ||
      itemName.toLowerCase().includes(search) ||
      row.Value?.toString().toLowerCase().includes(search)
    );
  });

  return (
    <div className="container-fluid">
      <ToastContainer position="top-center" autoClose={3000} />
      <form onSubmit={handleSubmit} className="card p-3 mb-3">
        <h3 className="mt-0">QC Master</h3>
        <div className="row g-3">
          <div className="col-md-3">
            <label>Item Type</label>
            <Select
              options={itemTypes.map((t) => ({ value: t.TypeID, label: t.ItemTypeName }))}
              value={itemTypes.find((t) => t.TypeID === qc.Itemtype) ? { value: qc.Itemtype, label: itemTypes.find((t) => t.TypeID === qc.Itemtype)?.ItemTypeName } : null}
              onChange={handleItemTypeChange}
              placeholder="Select Item Type"
              isClearable
              required
            />
          </div>

          <div className="col-md-3">
            <label>Item</label>
            <Select
              options={items.map((i) => ({ value: i.ItemID, label: i.ItemName }))}
              value={items.find((i) => i.ItemID === qc.Itemid) ? { value: qc.Itemid, label: items.find((i) => i.ItemID === qc.Itemid)?.ItemName } : null}
              onChange={(sel) => setQc((prev) => ({ ...prev, Itemid: sel ? sel.value : "" }))}
              placeholder="Select Item"
              isClearable
              required
            />
          </div>

          <div className="col-md-3">
            <label>QC Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="Qcname"
              value={qc.QcName}
              onChange={(e) => setQc((prev) => ({ ...prev, QcName: e.target.value }))}
              required
            />
          </div>

          <div className="col-md-3">
            <label>Range Value</label>
            <input
              type="text"
              step="any"
              placeholder="range"
              className="form-control"
              value={qc.Value}
              onChange={(e) => setQc((prev) => ({ ...prev, Value: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="mt-3 d-flex justify-content-center gap-3">
          <button type="submit" className="btn btn-" disabled={loading}>
            {loading ? "Saving..." : isEditMode ? "Update" : "Save"}
          </button>
          {isEditMode && (
            <button
              type="button"
              className="btn btn-"
              onClick={handleDelete}
            >
              Delete
            </button>
          )}
          <button type="button" className="btn btn-" onClick={resetForm}>
            Cancel
          </button>
        </div>
      </form>

      {/* QC Data Table */}
      <div className="card p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">QC List</h5>
          <input
            type="text"
            className="form-control w-25"
            placeholder="Search QC ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <table className="table table-bordered table-hover">
          <thead>
            <tr>
              <th>QC Name</th>
              <th>Item Type</th>
              <th>Item</th>
              <th>Range Value</th>
            </tr>
          </thead>
          <tbody>
            {filteredQcData.length > 0 ? (
              filteredQcData.map((row) => (
                <tr
                  key={row.Qcid}
                  onClick={() => handleRowClick(row)}
                  style={{ cursor: "pointer" }}
                  className={qc.Qcid === row.Qcid ? "table-active" : ""}
                >
                  <td>{row.QcName}</td>
                  <td>{itemTypes.find((t) => t.TypeID === row.Itemtype)?.ItemTypeName}</td>
                  <td>{allItems.find((i) => i.ItemID === row.Itemid)?.ItemName}</td>
                  <td>{row.Value}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">No records found</td>
              </tr>
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
}

export default QcMaster;
