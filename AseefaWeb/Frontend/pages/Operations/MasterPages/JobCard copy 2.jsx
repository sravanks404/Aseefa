import React, { useState, useEffect } from 'react';
import api from '../../apiService';
import Select from 'react-select';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaSearch, FaFileExcel, FaPrint, FaPlus,FaTimes } from "react-icons/fa";
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

    // Fetch all data on component mount
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const CompanyID = sessionStorage.getItem("CompanyID");
                const [prodData, itemTypesData, itemsData, usersData, deptData] = await Promise.all([
                    api.get("/api/webgetproductionalloc", { params: { CompanyID } }),
                    api.get("/api/GetitemType"),
                    api.get("/api/GetitemName"),
                    api.get('api/GetUsers', { params: { CompanyID } }),
                    api.get('/api/GetUserRole', { params: { CompanyID } })
                ]);
                setProductionData(prodData.data);
                setItemTypes(itemTypesData.data);
                setAllItems(itemsData.data);
                setItems(itemsData.data);
                setUsers(usersData.data);
                setdept(deptData.data);
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

    // Format date for input fields
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        return dateString.split('T')[0];
    };

    // Handle item type change
    const handleItemTypeChange = (selected) => {
        setProductionAlloc(prev => ({
            ...prev,
            ItemType: selected ? selected.value : '',
            Itemid: '' // Reset item when type changes
        }));

        if (selected) {
            const filtered = allItems.filter(item => item.ItemType === selected.value);
            setItems(filtered);
        } else {
            setItems(allItems);
        }
    };

    // Generate select options
    const itemTypeOptions = itemTypes.map(type => ({
        value: type.TypeID,
        label: type.ItemTypeName
    }));

    const itemOptions = items.map(item => ({
        value: item.ItemID,
        label: item.ItemName
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
        StartingDate: row.StartingDate,
        EndingDate: row.EndingDate,
        Duration: row.Duration,
        AllocUserid: row.AllocUserid,
        Status: row.status,
        Narration: row.Narration,
        UserId: Array.isArray(row.UserId) ? row.UserId.join(",") : row.UserId
      }))
    };

    await api.post('/api/InsertUpdateProductionAlloc', payload);
    toast.success("Job Card saved successfully!");
    setIsModalOpen(false);
  } catch (err) {
    console.error(err);
    toast.error("Failed to save Job Card");
  }
};

    // Fetch data
    const fetchData = async () => {
        try {
            const CompanyID = sessionStorage.getItem("CompanyID");
            const [prodResponse, itemsResponse] = await Promise.all([
                api.get("/api/webgetproductionalloc", { params: { CompanyID } }),
                api.get("/api/GetitemName")
            ]);
            setProductionData(prodResponse.data);
            setAllItems(itemsResponse.data);
            setItems(itemsResponse.data);
        } catch (err) {
            toast.error('Failed to fetch data');
            console.error(err);
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
            CompanyID: '',
            CreatedBy: '',
            ModifiedBy: '',
            CreatedDate: '',
            ModifiedDate: '',
            IsDeleted: 0
        });
    };

    // Handle row click for editing
    const handleRowClick = (item) => {
        // Convert UserId to array if it's a string
        const userIdArray = typeof item.UserId === 'string'
            ? item.UserId.split(',').map(id => parseInt(id, 10))
            : [item.UserId];

        // Get the item ID (handle both string and array cases)
        const itemId = Array.isArray(item.Itemid)
            ? item.Itemid[0] // Take first item if array
            : item.Itemid;

        // Find the corresponding item option
        const selectedItemOption = itemOptions.find(option => option.value == itemId);

        setProductionAlloc({
            ...item,
            ProAlloId: item.ProAlloId,
            UserId: userIdArray,
            Itemid: itemId, // Store as single value
            ProAllocNo: item.ProAllocNo || item.AllocNo,
            ProductionDate: item.AllocDate || item.ProductionDate,
            status: item.status ? item.status.toString() : '1'
        });

        // This ensures the Select component shows the right value
        if (selectedItemOption) {
            setProductionAlloc(prev => ({
                ...prev,
                Itemid: selectedItemOption.value
            }));
        }

        setIsEditMode(true);
        setIsModalOpen(true);
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
  setProductionAllocRows([...productionAllocRows, {
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
        if (!filteredProductionData.length) {
            toast.warning("No data to export");
            return;
        }

        const wb = XLSX.utils.book_new();
        const wsData = [
            ["Production Allocation Report"],
            ["Generated on", new Date().toLocaleString()],
            [],
            ["Item Type", "Item", "Quantity", "Start Date", "End Date", "User(s)", "Narration", "Status"]
        ];

        filteredProductionData.forEach(item => {
            wsData.push([
                itemTypes.find(type => type.TypeID == item.ItemType)?.ItemTypeName || 'N/A',
                items.find(i => i.ItemID == item.Itemid)?.ItemName || 'N/A',
                item.Qty,
                item.StartingDate ? formatDate(item.StartingDate) : 'N/A',
                item.EndingDate ? formatDate(item.EndingDate) : 'N/A',
                typeof item.UserId === 'string'
                    ? item.UserId.split(',').map(id => {
                        const user = users.find(u => u.UserID == id);
                        return user ? user.USERNAME : 'N/A';
                    }).join(', ')
                    : (users.find(u => u.UserID == item.UserId)?.USERNAME || 'N/A'),
                item.Narration || 'N/A',
                statusOptions.find(s => s.value === item.status)?.label || 'N/A'
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "ProductionAllocation");
        XLSX.writeFile(wb, `ProductionAllocation_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Export to PDF
    const exportToPDF = () => {
        if (!filteredProductionData.length) {
            toast.warning("No data to export");
            return;
        }

        const doc = new jsPDF({ orientation: "landscape" });
        doc.setFontSize(16);
        doc.text("Production Allocation Report", 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 25);

        const columns = [
            { title: "Item Type", dataKey: "itemType" },
            { title: "Item", dataKey: "item" },
            { title: "Qty", dataKey: "qty" },
            { title: "Start Date", dataKey: "startDate" },
            { title: "End Date", dataKey: "endDate" },
            { title: "User(s)", dataKey: "user" },
            { title: "Narration", dataKey: "narration" },
            { title: "Status", dataKey: "status" }
        ];

        const rows = filteredProductionData.map(item => ({
            itemType: itemTypes.find(type => type.TypeID == item.ItemType)?.ItemTypeName || 'N/A',
            item: items.find(i => i.ItemID == item.Itemid)?.ItemName || 'N/A',
            qty: item.Qty,
            startDate: item.StartingDate ? formatDate(item.StartingDate) : 'N/A',
            endDate: item.EndingDate ? formatDate(item.EndingDate) : 'N/A',
            user: typeof item.UserId === 'string'
                ? item.UserId.split(',').map(id => {
                    const user = users.find(u => u.UserID == id);
                    return user ? user.USERNAME : 'N/A';
                }).join(', ')
                : (users.find(u => u.UserID == item.UserId)?.USERNAME || 'N/A'),
            narration: item.Narration || 'N/A',
            status: statusOptions.find(s => s.value === item.status)?.label || 'N/A'
        }));

        doc.autoTable({
            columns: columns,
            body: rows,
            startY: 35,
            theme: "grid",
            styles: { fontSize: 8 }
        });

        doc.save(`ProductionAllocation_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Filter users by department
    const filteredUserOptions = selectedDept
        ? userOptions.filter(user => user.RoleID === selectedDept)
        : userOptions;


    const generateJobCardPDF = (rowData) => {
        const storedCompanyData = sessionStorage.getItem("companyResponse");
        const companyData = storedCompanyData ? JSON.parse(storedCompanyData) : null;

        // Get all data first for cleaner template
        const itemType = itemTypes.find(type => type.TypeID == rowData.ItemType)?.ItemTypeName || 'N/A';
        const itemName = items.find(i => i.ItemID == rowData.Itemid)?.ItemName || 'N/A';
        const department = dept.find(d => d.RoleID == rowData.Department)?.RoleName || "N/A";
        const allocatedTo = users.find(u => u.UserID == rowData.AllocUserid)?.USERNAME || "N/A";
        const status = statusOptions.find(s => s.value === String(rowData.status))?.label || 'N/A';

        const assignedUsers = rowData.USERNAME;
        const jobCardElement = document.getElementById("jobCardTemplate");
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
            ${formatDate(rowData.ProductionDate || rowData.AllocDate) || "N/A"}
          </p>
        </div>
        </div>
      </div>

      <!-- Key Info Grid -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px;">
        <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 8px; background: #f8f9fa; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <p style="margin: 0 0 4px; font-size: 11px; color: #666; font-weight: 600;">JOB NO</p>
          <p style="margin: 0; font-size: 10px; font-weight: 600; color: #3498db;">${rowData.ProAllocNo || rowData.AllocNo || "N/A"}</p>
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

      <!-- Main Content Sections -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
        <!-- Left Column -->
        <div>
          <!-- Item Card -->
          <div style="border: 1px solid #e0e0e0; border-radius: 5px; padding: 10px; margin-bottom: 12px; background: #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <h3 style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 4px;">ITEM DETAILS</h3>
            <table style="width:100%; border-collapse: collapse; font-size: 10px;">
              <tr>
                <td style="padding: 4px 0; width: 30%; font-weight: 600;">Type:</td>
                <td style="padding: 4px 0;">${itemType}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: 600;">Name:</td>
                <td style="padding: 4px 0;">${itemName}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: 600;">Qty:</td>
                <td style="padding: 4px 0;">${rowData.Qty || '0'}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: 600;">Duration:</td>
                <td style="padding: 4px 0;">${rowData.Duration || '0'} hrs</td>
              </tr>
            </table>
          </div>

          <!-- Timeline Card -->
          <div style="border: 1px solid #e0e0e0; border-radius: 5px; padding: 10px; background: #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <h3 style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 4px;">TIMELINE</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
              <tr>
                <td style="padding: 4px 0; width: 30%; font-weight: 600;">Start:</td>
                <td style="padding: 4px 0;">${formatDate(rowData.StartingDate) || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: 600;">End:</td>
                <td style="padding: 4px 0;">${formatDate(rowData.EndingDate) || "N/A"}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Right Column -->
        <div>
          <!-- Personnel Card -->
          <div style="border: 1px solid #e0e0e0; border-radius: 5px; padding: 10px; margin-bottom: 12px; background: #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <h3 style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 4px;">PERSONNEL</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
              <tr>
                <td style="padding: 4px 0; width: 40%; font-weight: 600;">Allocated To:</td>
                <td style="padding: 4px 0;">${allocatedTo}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: 600;">Assigned Team:</td>
                <td style="padding: 4px 0;">${assignedUsers}</td>
              </tr>
            </table>
          </div>

          <!-- Description Card -->
          <div style="border: 1px solid #e0e0e0; border-radius: 5px; padding: 10px; background: #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.05); min-height: 120px;">
            <h3 style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 4px;">JOB DESCRIPTION</h3>
            <div style="font-size: 10px; line-height: 1.5; color: #555;">
              ${rowData.Narration || "No description provided"}
            </div>
          </div>
        </div>
      </div>

      <!-- Time Log Table -->
      <div style="margin-bottom: 15px;">
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

      <!-- Signatures -->
      <div style="display: flex; justify-content: space-between; margin-top: 20px; font-size: 10px; padding-top: 10px; border-top: 1px solid #eee;">
        <div style="text-align: center; width: 30%;">
          <div style="height: 40px; border-bottom: 1px solid #000; margin: 0 auto 6px; width: 80%;"></div>
          <p style="margin: 0; font-weight: 600;">Supervisor</p>
        </div>
        <div style="text-align: center; width: 30%;">
          <div style="height: 40px; border-bottom: 1px solid #000; margin: 0 auto 6px; width: 80%;"></div>
          <p style="margin: 0; font-weight: 600;">Employee</p>
        </div>
        <div style="text-align: center; width: 30%;">
          <div style="height: 40px; border-bottom: 1px solid #000; margin: 0 auto 6px; width: 80%;"></div>
          <p style="margin: 0; font-weight: 600;">Client</p>
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
            pdf.save(`JobCard_${rowData.ProAllocNo || rowData.AllocNo || "JobCard"}.pdf`);
            jobCardElement.style.display = "none";
        });
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
                                <table className="table table-bordered table-hover">
                                    <thead>
                                        <tr>
                                            <th>PNo</th>
                                            <th>Item Type</th>
                                            <th>Item</th>
                                            <th>Quantity</th>
                                            <th>Allocated Date</th>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                            <th>Allocated Employee</th>
                                            <th>User(s)</th>
                                            <th>Narration</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="11" className="text-center">
                                                    <div className="spinner-border text-primary" role="status">
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : filteredProductionData.length === 0 ? (
                                            <tr>
                                                <td colSpan="11" className="text-center">No records found</td>
                                            </tr>
                                        ) : (
                                            filteredProductionData.map(item => (
                                                <tr
                                                    key={item.ProAlloId}
                                                    onClick={() => handleRowClick(item)}
                                                    style={{ cursor: 'pointer' }}
                                                    className={isModalOpen && productionAlloc.ProAlloId === item.ProAlloId ? 'table-active' : ''}
                                                >
                                                    <td>{item.AllocNo}</td>
                                                    <td>{itemTypes.find(type => type.TypeID == item.ItemType)?.ItemTypeName || 'N/A'}</td>
                                                    <td>{items.find(i => i.ItemID == item.Itemid)?.ItemName || 'N/A'}</td>
                                                    <td>{item.Qty}</td>
                                                    <td>{formatDate(item.AllocDate)}</td>
                                                    <td>{formatDate(item.StartingDate)}</td>
                                                    <td>{formatDate(item.EndingDate)}</td>

                                                    {/* Allocated Employee */}
                                                    <td>{users.find(u => u.UserID == item.AllocUserid)?.USERNAME || 'N/A'}</td>

                                                    {/* Assigned Users */}
                                                    <td>
                                                        {typeof item.UserId === 'string'
                                                            ? item.UserId.split(',').map(id => {
                                                                const user = users.find(u => u.UserID == id);
                                                                return user ? user.USERNAME : 'N/A';
                                                            }).join(', ')
                                                            : (users.find(u => u.UserID == item.UserId)?.USERNAME || 'N/A')}
                                                    </td>

                                                    <td>{item.Narration || 'N/A'}</td>
                                                    <td>
                                                        {statusOptions.find(s => s.value === String(item.status))?.label || 'N/A'}
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
                
                <div className="items-container" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                  {productionAllocRows.map((row, idx) => {
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
                              <label className="form-label small fw-semibold text-muted">Start Date</label>
                              <input 
                                type="date" 
                                className="form-control" 
                                value={row.StartingDate} 
                                onChange={(e) => updateRow(idx, { StartingDate: e.target.value })} 
                              />
                            </div>
                            
                            <div className="col-md-3">
                              <label className="form-label small fw-semibold text-muted">End Date</label>
                              <input 
                                type="date" 
                                className="form-control" 
                                value={row.EndingDate} 
                                onChange={(e) => updateRow(idx, { EndingDate: e.target.value })} 
                              />
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
                            
                            <div className="col-md-6">
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
          <div>
            <button type="button" className="btn btn-outline-secondary me-2" onClick={() => setIsModalOpen(false)}>
              <FaTimes className="me-1 rotate-45" /> Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSaveAll} disabled={loading}>
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

        </div>
    );
}

export default ProductionAlloc;