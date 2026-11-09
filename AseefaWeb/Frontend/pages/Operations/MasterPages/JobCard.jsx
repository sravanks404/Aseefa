import React, { useState, useEffect ,useRef } from 'react';
import api from '../../apiService';
import Select from 'react-select';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaSearch, FaFileExcel, FaPrint, FaPlus, FaTimes, FaTrash, FaCalendarAlt } from "react-icons/fa";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import logo from "../../../src/assets/morelogo.jpg";
import html2canvas from "html2canvas";

function ProductionAlloc() {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemTypes, setItemTypes] = useState([]);
  const [items, setItems] = useState([]);
  const [dept, setdept] = useState([]);
  const [users, setUsers] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [allocNo, setAllocNo] = useState('');
  const [productionData, setProductionData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const today = new Date().toISOString().split("T")[0];
  const [productionHeaders, setProductionHeaders] = useState([]);
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [batches, setBatches] = useState([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
const [newBatch, setNewBatch] = useState({
  BatchName: '',
  BatExpiryDate: ''
});
   const dateInputRefs = useRef([]);

  const [productionAlloc, setProductionAlloc] = useState({
    ProAlloId: 0,
    ItemType: '',
    Itemid: '',
    Qty: '',
    StartingDate: '',
    EndingDate: '',
    Narration: '',
    AllocUserid: '',
    UserId: [],
    ProAllocNo: '',
    ProductionDate: today,
    Department: '',
    Unit: '',
    Duration: '',
    status: '1',
    ISOBatchNumber: '',
    BatchNumber: '',
    BarcodeNumber: '',
    CompanyID: '',
    CreatedBy: '',
    ModifiedBy: '',
    CreatedDate: '',
    ModifiedDate: '',
    IsDeleted: 0
  });


  // New array for multiple job rows
  const [productionAllocRows, setProductionAllocRows] = useState([
    {
      ItemType: '',
      Itemid: '',
      Qty: '',
      Duration: '',
      StartingDate: '',
      EndingDate: '',
      Department: '',
      AllocUserid: '',
      UserId: [],
      Narration: '',
      status: '1'
    }
  ]);

// Add this function to fetch batches
const fetchBatches = async () => {
  try {
    const CompanyID = sessionStorage.getItem("CompanyID");
    const response = await api.get("/api/WebgetBatch", {
      params: { CompanyID }
    });
    setBatches(response.data || []);
  } catch (err) {
    console.error("Error fetching batches:", err);
    toast.error("Failed to load batches");
  }
};

  // Fetch all data on component mount
// Modify your existing useEffect to include batch fetching
useEffect(() => {
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      const [headersData, itemTypesData, itemsData, usersData, deptData, batchesData] = await Promise.all([
        api.get("/api/webgetproductionalloc", { params: { CompanyID } }),
        api.get("/api/GetitemType"),
        api.get("/api/GetitemName"),
        api.get('api/GetUsers', { params: { CompanyID } }),
        api.get('/api/GetUserRole', { params: { CompanyID } }),
        api.get('/api/WebgetBatch', { params: { CompanyID } }) // Add batch fetching
      ]);
      
      setProductionHeaders(headersData.data);
      setItemTypes(itemTypesData.data);
      setAllItems(itemsData.data);
      setItems(itemsData.data);
      setUsers(usersData.data);
      setdept(deptData.data);
      setBatches(batchesData.data || []); // Set batches
      await generatePNo();
    } catch (err) {
      toast.error('Failed to load initial data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  fetchAllData();
}, []);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  // Format date for <input type="date" />
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };


  // Format date+time for <input type="datetime-local" /> (in local time)
  const formatDateTimeForInput = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);

    // Convert to local timezone format (YYYY-MM-DDTHH:MM)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };


  const handleDateChange = (index, field, value) => {
    updateRow(index, { [field]: value });

    // Blur the input to close the calendar
    if (dateInputRefs.current[index] && dateInputRefs.current[index][field]) {
      dateInputRefs.current[index][field].blur();
    }
  };


// Add this function to create a new batch
const handleCreateBatch = async () => {
  try {
    const CompanyID = sessionStorage.getItem("CompanyID");
    const CreatedBy = sessionStorage.getItem("UserId");
    
    const response = await api.post('/api/InsertBatch', {
      BatchName: newBatch.BatchName,
      BatExpiryDate: newBatch.BatExpiryDate,
      CompanyID: parseInt(CompanyID, 10),
      CreatedBy: parseInt(CreatedBy, 10),
      IsDeleted: 0
    });

    if (response.data.BatchId) {
      toast.success("Batch created successfully!");
      setShowBatchModal(false);
      setNewBatch({ BatchName: '', BatExpiryDate: '' });
      await fetchBatches(); // Refresh batches list
    }
  } catch (err) {
    console.error("Error creating batch:", err);
    toast.error("Failed to create batch");
  }
};

  // Function to handle outside clicks for date inputs
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close any open date pickers when clicking outside
      const isDateInput = event.target.type === 'date' || event.target.type === 'datetime-local';
      if (!isDateInput) {
        dateInputRefs.current.forEach(rowRefs => {
          if (rowRefs) {
            Object.values(rowRefs).forEach(ref => {
              if (ref && document.activeElement === ref) {
                ref.blur();
              }
            });
          }
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchData = async () => {
    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      const response = await api.get(`/api/webgetproductionalloc?CompanyID=${CompanyID}`);
      setProductionHeaders(response.data || []);
    } catch (err) {
      console.error("Error fetching data", err);
      toast.error("Failed to load Job Cards");
    }
  };
  // Generate select options
  const itemTypeOptions = itemTypes.map(type => ({
    value: type.TypeID,
    label: type.ItemTypeName
  }));



  const userOptions = users.map(user => ({
    value: user.UserID,
    label: user.USERNAME,
    RoleID: user.UserRoleId
  }));

  const deptOptions = dept.map(dept => ({
    value: dept.RoleID,
    label: dept.RoleName
  }));

  const statusOptions = [
    { value: '1', label: 'Assigned' },
    { value: '2', label: 'Work In Progress' },
    { value: '3', label: 'Work Completed' }
  ];

  // Generate allocation number
  const generatePNo = async () => {
    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      const response = await api.get('api/webProallocNo', { params: { CompanyID } });
      if (response?.data?.data?.[0]?.ProAllocNo) {
        setAllocNo(response.data.data[0].ProAllocNo);
      }
    } catch (err) {
      console.error('Failed to generate allocation number:', err);
    }
  };

  const handleSaveAll = async () => {
    const CompanyID = sessionStorage.getItem("CompanyID");
    const UserId = sessionStorage.getItem("UserId");

    // ✅ helper to normalize datetime-local values
    const normalizeDateTime = (value) => {
      if (!value) return null;
      // Already has seconds (yyyy-mm-ddThh:mm:ss)
      if (value.length === 19) return value;
      // From datetime-local (yyyy-mm-ddThh:mm) → add ":00"
      if (value.length === 16) return value + ":00";
      return value;
    };

    try {
      const payload = {
        JobCardId: isEditMode ? productionAlloc.JobCardId : 0,
        AllocNo: allocNo,
        AllocDate: productionAlloc.ProductionDate,
        Department: productionAlloc.Department,
        Narration: productionAlloc.Narration,
        CompanyID: parseInt(CompanyID, 10),
        CreatedBy: parseInt(UserId, 10),
        CreatedDate: new Date().toISOString(),
        ModifiedBy: isEditMode ? parseInt(UserId, 10) : null,
        ModifiedDate: isEditMode ? new Date().toISOString() : null,
        IsDeleted: 0,
        Items: productionAllocRows.map(row => ({
          ItemType: row.ItemType,
          Itemid: row.Itemid,
          Qty: row.Qty,
          StartingDate: normalizeDateTime(row.StartingDate),
          EndingDate: normalizeDateTime(row.EndingDate),
          Duration: row.Duration,
          AllocUserid: row.AllocUserid,
          Status: row.status,
          Narration: row.Narration,
          ISOBatchNumber: row.ISOBatchNumber,
          BatchNumber: row.BatchNumber,
          BarcodeNumber: row.BarcodeNumber,
          UserId: Array.isArray(row.UserId) ? row.UserId.join(",") : row.UserId
        }))
      };

      await api.post('/api/InsertUpdateProductionAlloc', payload);

      toast.success("Job Card saved successfully!");
      await fetchData();

      resetForm();
      setIsEditMode(false);
      setIsModalOpen(false);
      await generatePNo(); // 🔥 new PNo for next insert

    } catch (err) {
      console.error(err);
      toast.error("Failed to save Job Card");
    }
  };


  // Reset form
  const resetForm = () => {
    setProductionAlloc({
      ProAlloId: 0,
      ItemType: '',
      Itemid: '',
      Qty: '',
      StartingDate: '',
      EndingDate: '',
      Narration: '',
      UserId: [],
      ProAllocNo: '',
      ProductionDate: today,
      Department: '',
      Unit: '',
      Duration: '',
      status: '1',
      ISOBatchNumber: '',
      BatchNumber: '',
      BarcodeNumber: '',
      CompanyID: '',
      CreatedBy: '',
      ModifiedBy: '',
      CreatedDate: '',
      ModifiedDate: '',
      IsDeleted: 0
    });

    setProductionAllocRows([{
      ItemType: '',
      Itemid: '',
      Qty: '',
      Duration: '',
      StartingDate: '',
      EndingDate: '',
      Department: '',
      AllocUserid: '',
      UserId: [],
      Narration: '',
      status: '1',
      ISOBatchNumber: '',
      BatchNumber: '',
      BarcodeNumber: '',
    }]);
  };


  // Handle create new
  const handleCreateNew = async () => {
    await generatePNo();
    resetForm();
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  // Filter production data
  const filteredProductionData = productionData.filter((item) =>
    Object.values(item).some(
      (val) =>
        val &&
        val.toString().toLowerCase().includes(searchTerm.toLowerCase().trim())
    )
  );

  // Add a new empty row
  const addRow = () => {
    const now = new Date();
    const defaultStart = now.toISOString().slice(0, 16);
    const defaultEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16);
    setProductionAllocRows([...productionAllocRows, {
      ItemType: '',
      Itemid: '',
      Qty: '',
      Duration: '',
      StartingDate: defaultStart,
      EndingDate: defaultEnd,
      Department: '',
      AllocUserid: '',
      UserId: [],
      Narration: '',
      status: '1',
      ISOBatchNumber: '',
      BatchNumber: '',
      BarcodeNumber: '',
    }]);
  };

  // Update a specific row
  const updateRow = (index, updated) => {
    const newRows = [...productionAllocRows];
    newRows[index] = { ...newRows[index], ...updated };
    setProductionAllocRows(newRows);
  };

  // Remove a row
  const removeRow = (index) => {
    setProductionAllocRows(productionAllocRows.filter((_, i) => i !== index));
  };


  // Export to Excel
  const exportToExcel = () => {
    if (!productionHeaders.length) {
      toast.warning("No data to export");
      return;
    }

    const wb = XLSX.utils.book_new();
    const wsData = [
      ["Production Allocation Report"],
      ["Generated on", new Date().toLocaleString()],
      [],
      ["PNo", "Item Count", "Allocated Date", "Department", "Narration"]
    ];

    productionHeaders.forEach(item => {
      wsData.push([
        item.AllocNo,
        item.ItemCount,
        item.AllocDate ? formatDate(item.AllocDate) : "N/A",
        item.DepartmentName || "N/A",
        item.Narration || "N/A"
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "ProductionAllocation");
    XLSX.writeFile(wb, `ProductionAllocation_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!productionHeaders.length) {
      toast.warning("No data to export");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("Production Allocation Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 25);

    const columns = [
      { title: "PNo", dataKey: "pno" },
      { title: "Item Count", dataKey: "itemCount" },
      { title: "Allocated Date", dataKey: "allocDate" },
      { title: "Department", dataKey: "department" },
      { title: "Narration", dataKey: "narration" }
    ];

    const rows = productionHeaders.map(item => ({
      pno: item.AllocNo,
      itemCount: item.ItemCount,
      allocDate: item.AllocDate ? formatDate(item.AllocDate) : "N/A",
      department: item.DepartmentName || "N/A",
      narration: item.Narration || "N/A"
    }));

    doc.autoTable({
      columns,
      body: rows,
      startY: 35,
      theme: "grid",
      styles: { fontSize: 8 }
    });

    doc.save(`ProductionAllocation_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const handleRowClick = async (header) => {
    setLoading(true);
    try {
      // Fetch the details for the selected job card
      const detailsResponse = await api.get("/api/webGetProductionAllocDetails", {
        params: { JobCardId: header.JobCardId }
      });
      const details = detailsResponse.data;

      setSelectedJobCard(header);

      // Set the header information in the main form
      setProductionAlloc({
        JobCardId: header.JobCardId,
        ProAllocNo: header.AllocNo,
        ProductionDate: formatDateForInput(header.AllocDate),
        Department: header.Department,
        Narration: header.Narration || '',
        CompanyID: header.CompanyID,
        CreatedBy: header.CreatedBy,
        CreatedDate: header.CreatedDate,
        ModifiedBy: header.ModifiedBy,
        ModifiedDate: header.ModifiedDate,
        IsDeleted: header.IsDeleted
      });

      // Set the allocation number for display
      setAllocNo(header.AllocNo);

      // Set the rows for editing - convert details to row format
      const rows = details.map(detail => {
        // Handle UserId conversion (string to array)
        let userIdArray = [];
        if (typeof detail.UserId === 'string') {
          userIdArray = detail.UserId.split(',')
            .map(id => id.trim())
            .filter(id => id !== '')
            .map(id => parseInt(id, 10));
        } else if (Array.isArray(detail.UserId)) {
          userIdArray = detail.UserId;
        } else if (detail.UserId) {
          userIdArray = [parseInt(detail.UserId, 10)];
        }

        return {
          ProAlloId: detail.ProAlloId,
          ItemType: detail.ItemType,
          Itemid: detail.Itemid,
          Qty: detail.Qty,
          Duration: detail.Duration,
          StartingDate: formatDateForInput(detail.StartingDate),
          EndingDate: formatDateForInput(detail.EndingDate),
          Department: detail.Department,
          AllocUserid: detail.AllocUserid,
          UserId: userIdArray,
          Narration: detail.Narration || '',
          status: detail.Status ? detail.Status.toString() : '1',
          ISOBatchNumber: detail.ISOBatchNumber || '',
          BatchNumber: detail.BatchNumber || '',
          BarcodeNumber: detail.BarcodeNumber || '',
        };
      });

      setProductionAllocRows(rows);

      setIsEditMode(true);
      setIsModalOpen(true);

    } catch (err) {
      console.error('Failed to load job card details:', err);
      toast.error('Failed to load job card details');
    } finally {
      setLoading(false);
    }
  };


  const generateJobCardPDF = () => {
    try {
      // Create or get the template element
      let jobCardElement = document.getElementById("jobCardTemplate");
      if (!jobCardElement) {
        jobCardElement = document.createElement("div");
        jobCardElement.id = "jobCardTemplate";
        jobCardElement.style.display = "none";
        document.body.appendChild(jobCardElement);
      }

      const storedCompanyData = sessionStorage.getItem("companyResponse");
      const companyData = storedCompanyData ? JSON.parse(storedCompanyData) : null;

      // Get department name
      const department = dept.find(d => d.RoleID == productionAlloc.Department)?.RoleName || "N/A";

      // Get status label
      const status = statusOptions.find(s => s.value === productionAlloc.status)?.label || 'N/A';

      // Generate the job card content
      jobCardElement.innerHTML = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 15px; width: 100%; font-size: 10px; color: #333; box-sizing: border-box; background: #ffffff;">
          <!-- Header with Company Info, Logo, and Job Card -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e0e0e0;">
            <!-- Company Info (Left) -->
            <div style="flex: 1; text-align: left;">
              <h1 style="margin: 0; font-size: 16px; font-weight: 700; color: #2c3e50;">${companyData?.CompanyName || 'Company Name'}</h1>
              <p style="margin: 4px 0 0; font-size: 10px; color: #666;">
                ${companyData?.Address || ''} ${companyData?.MobileNO ? `| ${companyData.MobileNO}` : ''}
                ${companyData?.GSTinNo ? `| GST: ${companyData.GSTinNo}` : ''}
              </p>
            </div>

            <!-- Company Logo (Center) -->
            <div style="flex: 1; text-align: center;">
              <img src="${logo}" 
                   alt="Company Logo" 
                   style="max-width: 120px; height: auto; display: block; margin: 0 auto;" />
            </div>
            <!-- Job Card Info (Right) -->
            <div style="flex: 1; text-align: right;">
              <div style="text-align: right; align-self: center;">
              <h2 style="margin: 0; font-size: 14px; font-weight: 700; color: #2c3e50;">JOB CARD</h2>
              <p style="margin: 2px 0 0; font-size: 8px; color: #666;">
                ${formatDate(productionAlloc.ProductionDate) || "N/A"}
              </p>
            </div>
            </div>
          </div>

          <!-- Key Info Grid -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px;">
            <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 8px; background: #f8f9fa; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <p style="margin: 0 0 4px; font-size: 11px; color: #666; font-weight: 600;">JOB NO</p>
              <p style="margin: 0; font-size: 10px; font-weight: 600; color: #3498db;">${productionAlloc.ProAllocNo || allocNo || "N/A"}</p>
            </div>
            <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 8px; background: #f8f9fa; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <p style="margin: 0 0 4px; font-size: 11px; color: #666; font-weight: 600;">DEPARTMENT</p>
              <p style="margin: 0; font-size: 10px; font-weight: 600; color: #2ecc71;">${department}</p>
            </div>
            <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 8px; background: #f8f9fa; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <p style="margin: 0 0 4px; font-size: 11px; color: #666; font-weight: 600;">STATUS</p>
              <p style="margin: 0; font-size: 10px; font-weight: 600; color: ${status === 'Completed' ? '#27ae60' : status === 'In Progress' ? '#f39c12' : '#e74c3c'};">${status}</p>
            </div>
          </div>

          <!-- Job Description -->
          <div style="margin-bottom: 15px; border: 1px solid #e0e0e0; border-radius: 5px; padding: 10px; background: #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <h3 style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 4px;">JOB DESCRIPTION</h3>
            <div style="font-size: 10px; line-height: 1.5; color: #555;">
              ${productionAlloc.Narration || "No description provided"}
            </div>
          </div>

          <!-- Items Table -->
          <div style="margin-bottom: 15px;">
            <h3 style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 4px;">ITEMS & ASSIGNMENTS</h3>
            <table style="width:100%; border-collapse: collapse; font-size: 10px; border: 1px solid #e0e0e0; background: #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 6px; border: 1px solid #e0e0e0; text-align: left; font-weight: 600;">Item Type</th>
                  <th style="padding: 6px; border: 1px solid #e0e0e0; text-align: left; font-weight: 600;">Item</th>
                  <th style="padding: 6px; border: 1px solid #e0e0e0; text-align: left; font-weight: 600;">Qty</th>
                  <th style="padding: 6px; border: 1px solid #e0e0e0; text-align: left; font-weight: 600;">Duration</th>
                  <th style="padding: 6px; border: 1px solid #e0e0e0; text-align: left; font-weight: 600;">Start Date</th>
                  <th style="padding: 6px; border: 1px solid #e0e0e0; text-align: left; font-weight: 600;">End Date</th>
                  <th style="padding: 6px; border: 1px solid #e0e0e0; text-align: left; font-weight: 600;">ISONo</th>
                  <th style="padding: 6px; border: 1px solid #e0e0e0; text-align: left; font-weight: 600;">BatchNo</th>
                  <th style="padding: 6px; border: 1px solid #e0e0e0; text-align: left; font-weight: 600;">BarcodeNo</th>
                  <th style="padding: 6px; border: 1px solid #e0e0e0; text-align: left; font-weight: 600;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${productionAllocRows.map(row => {
        const itemType = itemTypes.find(type => type.TypeID == row.ItemType)?.ItemTypeName || 'N/A';
        const itemName = items.find(i => i.ItemID == row.Itemid)?.ItemName || 'N/A';
        const rowStatus = statusOptions.find(s => s.value === row.status)?.label || 'N/A';

        return `
                    <tr>
                      <td style="padding: 6px; border: 1px solid #e0e0e0;">${itemType}</td>
                      <td style="padding: 6px; border: 1px solid #e0e0e0;">${itemName}</td>
                      <td style="padding: 6px; border: 1px solid #e0e0e0;">${row.Qty || '0'}</td>
                      <td style="padding: 6px; border: 1px solid #e0e0e0;">${row.Duration || '0'} hrs</td>
                      <td style="padding: 6px; border: 1px solid #e0e0e0;">${formatDateTimeForInput(row.StartingDate) || "N/A"}</td>
                      <td style="padding: 6px; border: 1px solid #e0e0e0;">${formatDateTimeForInput(row.EndingDate) || "N/A"}</td>
                      <td style="padding: 6px; border: 1px solid #e0e0e0;">${row.ISOBatchNumber}</td>
                      <td style="padding: 6px; border: 1px solid #e0e0e0;">${row.BatchNumber}</td>
                      <td style="padding: 6px; border: 1px solid #e0e0e0;">${row.BarcodeNumber}</td>
                      <td style="padding: 6px; border: 1px solid #e0e0e0;">${rowStatus}</td>
                    </tr>
                  `;
      }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Personnel Information -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <!-- Assigned Personnel -->
            <div style="border: 1px solid #e0e0e0; border-radius: 5px; padding: 10px; background: #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
              <h3 style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: '2c3e50'; border-bottom: 1px solid #eee; padding-bottom: 4px;">PERSONNEL</h3>
              ${productionAllocRows.map((row, index) => {
        const primaryAssignee = users.find(u => u.UserID == row.AllocUserid)?.USERNAME || "N/A";
        const supportingTeam = row.UserId && row.UserId.length > 0
          ? row.UserId.map(id => {
            const user = users.find(u => u.UserID == id);
            return user ? user.USERNAME : 'N/A';
          }).join(', ')
          : 'None assigned';

        return `
                  <div style="margin-bottom: ${index < productionAllocRows.length - 1 ? '10px' : '0'}; padding-bottom: ${index < productionAllocRows.length - 1 ? '10px' : '0'}; border-bottom: ${index < productionAllocRows.length - 1 ? '1px solid #eee' : 'none'};">
                    <p style="margin: 0 0 4px; font-size: 10px; font-weight: 600;">Item ${index + 1}:</p>
                    <p style="margin: 0 0 4px; font-size: 9px;"><strong>Primary:</strong> ${primaryAssignee}</p>
                    <p style="margin: 0; font-size: 9px;"><strong>Team:</strong> ${supportingTeam}</p>
                  </div>
                `;
      }).join('')}
            </div>

            <!-- Time Log Table -->
            <div>
              <h3 style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 4px;">TIME LOG</h3>
              <table style="width:100%; border-collapse: collapse; font-size: 10px; border: 1px solid #e0e0e0; background: #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <thead>
                  <tr style="background-color: #f8f9fa;">
                    <th style="padding: 6px; border: 1px solid #e0e0e0; text-align: left; font-weight: 600;">Date</th>
                    <th style="padding: 6px; border: 1px solid #e0e0e0; text-align: left; font-weight: 600;">Start</th>
                    <th style="padding: 6px; border: 1px solid #e0e0e0; text-align: left; font-weight: 600;">End</th>
                    <th style="padding: 6px; border: 1px solid #e0e0e0; text-align: left; font-weight: 600;">Hours</th>
                    <th style="padding: 6px; border: 1px solid #e0e0e0; text-align: left; font-weight: 600;">Work Done</th>
                  </tr>
                </thead>
                <tbody>
                  ${[1, 2, 3].map(() => `
                    <tr>
                      <td style="padding: 6px; border: 1px solid #e0e0e0;"></td>
                      <td style="padding: 6px; border: 1px solid #e0e0e0;"></td>
                      <td style="padding: 6px; border: 1px solid #e0e0e0;"></td>
                      <td style="padding: 6px; border: 1px solid #e0e0e0;"></td>
                      <td style="padding: 6px; border: 1px solid #e0e0e0;"></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Signatures -->
          <div style="display: flex; justify-content: space-between; margin-top: 20px; font-size: 10px; padding-top: 10px; border-top: 1px solid #eee;">
            <div style="text-align: center; width: 30%;">
              <div style="height: 40px; border-bottom: 1px solid #000; margin: 0 auto 6px; width: 80%;"></div>
              <p style="margin: 0; font-weight: 600;">Supervisor</p>
            </div>
            <div style="text-align: center; width: 30%;">
              <div style="height: 40px; border-bottom: 1px solid #000; margin: 0 auto 6px; width: 80%;"></div>
              <p style="margin: 0; font-weight: 600;">Production Manager</p>
            </div>
            <div style="text-align: center; width: 30%;">
              <div style="height: 40px; border-bottom: 1px solid #000; margin: 0 auto 6px; width: 80%;"></div>
              <p style="margin: 0; font-weight: 600;">Quality Control</p>
            </div>
          </div>
        </div>
      `;

      // Generate PDF
      jobCardElement.style.display = "block";
      jobCardElement.style.position = "absolute";
      jobCardElement.style.left = "-9999px";
      jobCardElement.style.width = "210mm";
      jobCardElement.style.boxSizing = "border-box";

      html2canvas(jobCardElement, {
        scale: 2,
        logging: false,
        useCORS: true,
        width: 794,
        windowWidth: 794
      }).then((canvas) => {
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4"
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
        pdf.save(`JobCard_${productionAlloc.ProAllocNo || allocNo || "JobCard"}.pdf`);
        jobCardElement.style.display = "none";
      }).catch(error => {
        console.error("PDF generation error:", error);
        toast.error("Failed to generate PDF");
      });

    } catch (error) {
      console.error("Error in generateJobCardPDF:", error);
      toast.error("Failed to generate job card PDF");
    }
  };



  const handleDelete = async () => {
    if (!productionAlloc.JobCardId) {
      toast.warning("No Job Card selected to delete");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this Job Card?")) {
      return;
    }

    try {
      // Call delete API
      await api.post("/api/webdeleteproalloc", {
        JobCardId: productionAlloc.JobCardId
      });

      toast.success("Job Card deleted successfully!");

      // Refresh main table
      await fetchData();

      // Reset form + close modal
      resetForm();
      setIsEditMode(false);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete Job Card");
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container-fluid">
        <div className="page-body mt-0">
          <div className="container-fluid">
            <ToastContainer position="top-center" autoClose={3000} />
            {/* Search and Action Buttons */}
            <div className="card shadow-sm mb-3 p-3"> <h3>Production Allocation</h3>
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
                      placeholder="Search Production ..."
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
                        <th scope="col">PNo</th>
                        <th scope="col">Item Count</th>
                        <th scope="col">Allocated Date</th>
                        <th scope="col">Department</th>
                        <th scope="col">Narration</th>
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
                      ) : productionHeaders.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center">No job cards found</td>
                        </tr>
                      ) : (
                        productionHeaders.map((header) => (
                          <tr
                            key={header.JobCardId}
                            onClick={() => handleRowClick(header)}
                            style={{ cursor: "pointer" }}
                            className={
                              selectedJobCard?.JobCardId === header.JobCardId
                                ? "table-active"
                                : ""
                            }
                          >
                            <td>{header.AllocNo}</td>
                            <td>Job Card ({header.ItemCount} items)</td>
                            <td>{formatDate(header.AllocDate)}</td>
                            <td>{header.DepartmentName || "N/A"}</td>
                            <td>{header.Narration || "No description"}</td>
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
          <div className="modal-dialog modal-xl" role="document">
            <div className="modal-content shadow-lg rounded-3 overflow-hidden">

              {/* Modal Header */}
              <div className="modal-header bg-gradient-primary text-dark py-3">
                <div className="d-flex align-items-center">
                  <div className="bg-primary bg-opacity-20 p-2 rounded-circle me-3">

                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0">
                      {isEditMode ? 'Edit Job Card' : 'Create New Job Card'}
                    </h5>
                    <div className="text-sm opacity-85 mt-1">
                      {allocNo && `Job #${allocNo}`}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-dark"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Close"
                ></button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-0">
                <div className="row g-0">
                  {/* Left Panel - Job Information */}
                  <div className="col-lg-4 bg-light">
                    <div className="p-4">
                      <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
                        <FaSearch className="me-2" /> JOB INFORMATION
                      </h6>

                      <div className="card border-0 shadow-lg mb-3">
                        <div className="card-body">
                          <div className="mb-3">
                            <label className="form-label small fw-semibold text-muted">Job Number</label>
                            <input type="text" className="form-control bg-light fw-bold text-primary border-0" value={allocNo} readOnly />
                          </div>

                          <div className="mb-3">
                            <label className="form-label small fw-semibold text-muted">Date <span className="text-danger">*</span></label>
                            <input
                              type="date"
                              className="form-control"
                              value={formatDateForInput(productionAlloc.ProductionDate)}
                              onChange={(e) => setProductionAlloc(prev => ({ ...prev, ProductionDate: e.target.value }))}
                              required
                            />
                          </div>

                          <div className="mb-3">
                            <label className="form-label small fw-semibold text-muted">Department <span className="text-danger">*</span></label>
                            <Select
                              options={deptOptions}
                              value={deptOptions.find(o => o.value === productionAlloc.Department) || null}
                              onChange={(s) => setProductionAlloc(prev => ({
                                ...prev,
                                Department: s ? s.value : '',
                                // Clear supporting team when department changes
                                UserId: []
                              }))}
                              isClearable
                              className="react-select-container"
                              classNamePrefix="react-select"
                              placeholder="Select department..."
                            />
                          </div>
                        </div>
                      </div>

                      <div className="card border-0 shadow-lg">
                        <div className="card-body">
                          <label className="form-label small fw-semibold text-muted">Job Description</label>
                          <textarea
                            className="form-control"
                            rows="4"
                            value={productionAlloc.Narration || ''}
                            onChange={(e) => setProductionAlloc(prev => ({ ...prev, Narration: e.target.value }))}
                            placeholder="Describe the job requirements, special instructions, or notes..."
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Panel - Items & Assignments */}
                  <div className="col-lg-8">
                    <div className="p-4">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h6 className="fw-bold text-primary mb-0 d-flex align-items-center">
                          <FaFileExcel className="me-2" /> ITEMS & ASSIGNMENTS
                        </h6>
                        <button type="button" className="btn btn-sm btn-primary rounded-pill" onClick={addRow}>
                          <FaPlus className="me-1" /> Add Item
                        </button>
                      </div>

                      <div className="items-container" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                        {productionAllocRows.map((row, idx) => {
                           if (!dateInputRefs.current[idx]) {
                            dateInputRefs.current[idx] = {};}
                          // Filter supporting team based on the department selected in job details
                          const filteredSupportTeamOptions = productionAlloc.Department
                            ? userOptions.filter(user => user.RoleID === parseInt(productionAlloc.Department))
                            : userOptions;

 
                          return (
                            <div key={idx} className="card border-0 shadow-sm mb-3">
                              <div className="card-header bg-primary text-white py-2 d-flex justify-content-between align-items-center">
                                <span className="badge bg-light text-dark">Item #{idx + 1}</span>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-link text-warning p-0"
                                  onClick={() => removeRow(idx)}
                                  disabled={productionAllocRows.length <= 1}
                                  title="Remove item"
                                >
                                  <FaTimes className="rotate-45" />
                                </button>
                              </div>
                              <div className="card-body p-3">
                                <div className="row g-3">
                                  <div className="col-md-6">
                                    <label className="form-label small fw-semibold text-muted">Item Type <span className="text-danger">*</span></label>
                                    <Select
                                      options={itemTypeOptions}
                                      value={itemTypeOptions.find(o => o.value === row.ItemType) || null}
                                      onChange={(s) => updateRow(idx, { ItemType: s ? s.value : '', Itemid: '' })}
                                      isClearable
                                      placeholder="Select item type..."
                                    />
                                  </div>

                                  <div className="col-md-6">
                                    <label className="form-label small fw-semibold text-muted">Item <span className="text-danger">*</span></label>
                                    <Select
                                      options={allItems
                                        .filter(item => item.ItemType === row.ItemType)   // ✅ filter only matching items
                                        .map(item => ({ value: item.ItemID, label: item.ItemName }))
                                      }
                                      value={
                                        allItems.find(item => item.ItemID === row.Itemid)
                                          ? { value: row.Itemid, label: allItems.find(item => item.ItemID === row.Itemid).ItemName }
                                          : null
                                      }
                                      onChange={(s) => updateRow(idx, { Itemid: s ? s.value : '' })}
                                      isClearable
                                      placeholder={row.ItemType ? "Select item..." : "Select item type first"}
                                      isDisabled={!row.ItemType}
                                    />
                                  </div>

                                  <div className="col-md-3">
                                    <label className="form-label small fw-semibold text-muted">Quantity <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                      <input
                                        type="number"
                                        className="form-control"
                                        value={row.Qty}
                                        onChange={(e) => updateRow(idx, { Qty: e.target.value })}
                                        min="1"
                                      />
                                      <span className="input-group-text bg-transparent">Units</span>
                                    </div>
                                  </div>

                                  <div className="col-md-3">
                                    <label className="form-label small fw-semibold text-muted">Duration</label>
                                    <div className="input-group">
                                      <input
                                        type="number"
                                        className="form-control"
                                        value={row.Duration}
                                        onChange={(e) => updateRow(idx, { Duration: e.target.value })}
                                        min="0"
                                        step="0.5"
                                      />
                                      <span className="input-group-text bg-transparent">Hrs</span>
                                    </div>
                                  </div>

                                  <div className="col-md-3">
                                    <label className="form-label small fw-semibold text-muted">Start Date & Time</label>
                                    <div className="position-relative">
                                      <input
                                        type="datetime-local"
                                        className="form-control pe-2"
                                        value={formatDateTimeForInput(row.StartingDate)}
                                        onChange={(e) => handleDateChange(idx, 'StartingDate', e.target.value)}
                                        ref={el => dateInputRefs.current[idx]['StartingDate'] = el}
                                      />
                                     
                                    </div>
                                  </div>

                                  <div className="col-md-3">
                                    <label className="form-label small fw-semibold text-muted">End Date & Time</label>
                                    <div className="position-relative">
                                      <input
                                        type="datetime-local"
                                        className="form-control pe-2"
                                        value={formatDateTimeForInput(row.EndingDate)}
                                        onChange={(e) => handleDateChange(idx, 'EndingDate', e.target.value)}
                                        ref={el => dateInputRefs.current[idx]['EndingDate'] = el}
                                      />
                                     
                                    </div>
                                  </div>

                                  <div className="col-md-6">
                                    <label className="form-label small fw-semibold text-muted">Primary Assignee</label>
                                    <Select
                                      options={userOptions}
                                      value={userOptions.find(o => o.value === row.AllocUserid) || null}
                                      onChange={(s) => updateRow(idx, { AllocUserid: s ? s.value : '' })}
                                      isClearable
                                      className="react-select-container"
                                      classNamePrefix="react-select"
                                      placeholder="Select primary assignee..."
                                    />
                                  </div>

                                  <div className="col-md-6">
                                    <label className="form-label small fw-semibold text-muted">Supporting Team</label>
                                    <Select
                                      options={filteredSupportTeamOptions}
                                      isMulti
                                      value={filteredSupportTeamOptions.filter(o => row.UserId.includes(o.value))}
                                      onChange={(s) => updateRow(idx, { UserId: s ? s.map(v => v.value) : [] })}
                                      className="react-select-container"
                                      classNamePrefix="react-select"
                                      placeholder={productionAlloc.Department ? "Select team members..." : "Select department first"}
                                      isDisabled={!productionAlloc.Department}
                                    />
                                    {!productionAlloc.Department && (
                                      <div className="form-text text-warning">Select a department in job details first</div>
                                    )}
                                    {productionAlloc.Department && (
                                      <div className="form-text text-muted">
                                        Showing {filteredSupportTeamOptions.length} team members from selected department
                                      </div>
                                    )}
                                  </div>



                                  <div className="col-md-3">
                                    <label className="form-label small fw-semibold text-muted">ISOBatchNumber </label>
                                    <div className="input-group">
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={row.ISOBatchNumber}
                                        onChange={(e) => updateRow(idx, { ISOBatchNumber: e.target.value })}
                                      />
                                    </div>
                                  </div>

                                  <div className="col-md-3">
  <label className="form-label small fw-semibold text-muted">Batch Number</label>
  <div className="input-group">
    <select
      className="form-select"
      value={row.BatchNumber}
      onChange={(e) => updateRow(idx, { BatchNumber: e.target.value })}
    >
      <option value="">Select Batch</option>
      {batches.map(batch => (
        <option key={batch.BatchId} value={batch.BatchId}>
          {batch.BatchName} {batch.BatExpiryDate ? `(Exp: ${formatDate(batch.BatExpiryDate)})` : ''}
        </option>
      ))}
    </select>
    <button
      type="button"
      className="btn btn-outline-primary"
      onClick={() => setShowBatchModal(true)}
      title="Create new batch"
    >
      <FaPlus />
    </button>
  </div>
</div>

                                  <div className="col-md-3">
                                    <label className="form-label small fw-semibold text-muted">BarcodeNumber </label>
                                    <div className="input-group">
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={row.BarcodeNumber}
                                        onChange={(e) => updateRow(idx, { BarcodeNumber: e.target.value })}
                                      />
                                    </div>
                                  </div>
                                  <div className="col-md-3">
                                    <label className="form-label small fw-semibold text-muted">Item Status</label>
                                    <Select
                                      options={statusOptions}
                                      value={statusOptions.find(o => o.value === row.status) || null}
                                      onChange={(s) => updateRow(idx, { status: s ? s.value : '1' })}
                                      isClearable
                                      className="react-select-container"
                                      classNamePrefix="react-select"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {productionAllocRows.length === 0 && (
                        <div className="text-center py-5 bg-light rounded-3 border-dashed">
                          <FaFileExcel className="fs-1 text-muted mb-3" />
                          <p className="text-muted">No items added yet. Click "Add Item" to get started.</p>
                          {!productionAlloc.Department && (
                            <p className="text-warning small mt-2">Select a department in job details to filter supporting team</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer bg-light justify-content-between py-3">
                <div>
                  <span className="text-muted small">
                    <FaSearch className="me-1" />
                    Fields marked with <span className="text-danger">*</span> are required
                  </span>
                </div>
                <div className="d-flex align-items-center">
                  {isEditMode && (
                    <>
                      <button
                        type="button"
                        className="btn btn-danger me-2"
                        onClick={handleDelete}
                        disabled={loading}
                      >
                        <FaTrash className="me-1" /> Delete
                      </button>

                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={generateJobCardPDF}
                        disabled={loading || productionAllocRows.length === 0}
                      >
                        <FaPrint className="me-1" /> Generate PDF
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveAll}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaFileExcel className="me-1" /> Save Job Card
                      </>
                    )}
                  </button>
                </div>


              </div>

            </div>
          </div>
        </div>
      )}

    
{showBatchModal && (
  <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.5)" }}>
    <div className="modal-dialog modal-md" role="document">
      <div className="modal-content">
        <div className="modal-header bg-primary text-white">
          <h5 className="modal-title">Create New Batch</h5>
          <button type="button" className="btn-close btn-close-white" onClick={() => setShowBatchModal(false)}></button>
        </div>
        <div className="modal-body">
          <div className="mb-3">
            <label className="form-label">Batch Name</label>
            <input
              type="text"
              className="form-control"
              value={newBatch.BatchName}
              onChange={(e) => setNewBatch({...newBatch, BatchName: e.target.value})}
              placeholder="Enter batch name"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Expiry Date</label>
            <input
              type="date"
              className="form-control"
              value={newBatch.BatExpiryDate}
              onChange={(e) => setNewBatch({...newBatch, BatExpiryDate: e.target.value})}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setShowBatchModal(false)}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleCreateBatch}>
            Create Batch
          </button>
        </div>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

export default ProductionAlloc;