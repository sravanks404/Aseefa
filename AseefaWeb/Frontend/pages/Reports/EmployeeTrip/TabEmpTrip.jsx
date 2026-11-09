import { useState, useEffect, useMemo } from "react";
import DataTable from "react-data-table-component";
import { FaCalendarAlt } from "react-icons/fa";
import api from "../../apiService";
import { Tab, Tabs } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";


import { FaSearch, FaFilePdf, FaFileExcel, FaPrint } from "react-icons/fa";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";




const EmpTrip = () => {
  const [username, setUsername] = useState("");
  const [RoleName, setRoleName] = useState("");
  const [Odometer, setOdometer] = useState(null);
  const [Tripline, setTripline] = useState([]);
  const [TripCount, setTripCount] = useState({});
  const [tripData, setTripData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companyData, setCompanyData] = useState(null);

  const [TripOrder, setTripOrder] = useState([]);
  const [TripSale, setTripSale] = useState([]);
  const [TripReceipt, setTripReceipt] = useState([]);
  const [TripReport, setTripReport] = useState([]);
  const [AllEmpTripReport, setAllEmpTripReport] = useState([]);
  const [orderDetails, setOrderDetails] = useState([]);
  const [Billdetails, setBillDetails] = useState([]);

  const [activeTab, setActiveTab] = useState("TripInfo");
  const [filterText, setFilterText] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedFromDate, setselectedFromDate] = useState(new Date());


  const handlereportChange = (date) => {
    setselectedFromDate(date);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };


  useEffect(() => {
    setUsername(sessionStorage.getItem("UserName") || "");
    setRoleName(sessionStorage.getItem("RoleName") || "");

    const fetchData = async () => {
      try {
        const userId = sessionStorage.getItem("UserID");
        const companyId = sessionStorage.getItem("CompanyID");
        const formattedDate = selectedDate ? new Date(selectedDate).toISOString().split("T")[0] : null;
        const formattedFromDate = selectedFromDate?.toISOString().split("T")[0]; // Ensure `selectedFromDate` is formatted correctly

        if (!userId || !companyId) {
          console.warn("UserID or CompanyID is missing");
          return;
        }

        const queryParams = new URLSearchParams({
          UserId: userId,
          CompanyId: companyId,
          Date: formattedDate,
        }).toString();


        // Fetch odometer data
        const OdometerResponse = await api.get(`/api/Getodometer?${queryParams}`);
        setOdometer(OdometerResponse.data[0] || null);

        // Fetch trip count data
        const tripCountResponse = await api.get(`/api/TripCount?UserID=${userId}&Date=${formattedDate}`);
        setTripCount(tripCountResponse.data.length > 0 ? tripCountResponse.data[0] : {});

        // Fetch user trip details
        const userTripResponse = await api.get(`/api/Usertripdetails?FromDate=${formattedDate}&Date=${formattedFromDate}&EmpID=${userId}&CompanyID=${companyId}`);
        setTripline(userTripResponse.data || []);

        // Fetch trip order data
        const userTriporderResponse = await api.get(`/api/webGetUsertriporder?${queryParams}`);
        setTripOrder(userTriporderResponse.data || []);


        // Fetch trip sale data
        const userTripsaleResponse = await api.get(`/api/webGetUsertripsale?${queryParams}`);
        setTripSale(userTripsaleResponse.data || []);

        // Fetch trip receipt data
        const userTripreceiptResponse = await api.get(`/api/webGetTripreceipt?${queryParams}`);
        setTripReceipt(userTripreceiptResponse.data || []);

        // Fetch trip report data
        const TripReportResponse = await api.get(
          `/api/TripReport?FromDate=${formattedDate}&ToDate=${formattedFromDate}&EmpID=${userId}`
        );
        setTripReport(TripReportResponse.data || []);


        const AllEmpTripReportResponse = await api.get(
          `/api/AllEmpTripReport?FromDate=${formattedDate}&ToDate=${formattedFromDate}`
        );
        setAllEmpTripReport(AllEmpTripReportResponse.data || []);

      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate, selectedFromDate]);


  // Function to fetch order details
  const fetchOrderDetails = async (DSID) => {
    try {
      const response = await api.get("/api/Getorderdetails", {
        params: { DSID }, // Pass DSID as a query parameter
      });

      setOrderDetails(response?.data || []);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch order details:", err);
    }
  };

  // Function to fetch bill details
  const fetchBillDetails = async (BillID) => {
    const CompanyID = sessionStorage.getItem("CompanyID");
    try {
      const response = await api.get("/api/GetBilldetails", {
        params: { BillID, CompanyID }, // Pass DSID as a query parameter
      });
      setBillDetails(response?.data || []);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error fetching order details:", err);
    }
  };


  // Function to handle row click in Orders table
  const handleOrderRowClick = (DSID) => {
    fetchOrderDetails(DSID);
  };

  // Function to handle row click in Bills table
  const handleBillRowClick = (BillID) => {
    fetchBillDetails(BillID);
  };



  useEffect(() => {
    const fetchTripMapData = async () => {
      try {
        const userId = sessionStorage.getItem("UserID");
        const companyId = sessionStorage.getItem("CompanyID");
        const formattedDate = selectedDate.toISOString().split("T")[0];

        if (!userId || !companyId) {
          console.warn("UserID or CompanyID is missing");
          return;
        }

        const response = await api.get(
          `/api/GetTripMap?CompanyId=${companyId}&UserId=${userId}&Date=${formattedDate}`
        );
        setTripData(response.data || []);
      } catch (err) {
        console.error("Failed to fetch trip map data:", err);
      }
    };

    fetchTripMapData();
  }, [selectedDate]);

  // Memoized position data
  const empPositions = useMemo(
    () =>
      tripData
        .map((loc) =>
          loc.EmpLatitude && loc.EmpLongitude
            ? [parseFloat(loc.EmpLatitude), parseFloat(loc.EmpLongitude)]
            : null
        )
        .filter(Boolean),
    [tripData]
  );

  const custPositions = useMemo(
    () =>
      tripData
        .map((loc) =>
          loc.CustLatitude && loc.CustLongitude
            ? [parseFloat(loc.CustLatitude), parseFloat(loc.CustLongitude)]
            : null
        )
        .filter(Boolean),
    [tripData]
  );

  // Ensure map resizes properly
  const MapResizer = () => {
    const map = useMap();
    useEffect(() => {
      setTimeout(() => {
        map.invalidateSize();
      }, 500);
    }, [map]);
    return null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);

    // Subtract 5 hours and 30 minutes
    date.setHours(date.getHours() - 5);
    date.setMinutes(date.getMinutes() - 30);

    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  };





  const handleCustomPrint = (data, title, columns, selectedDate) => {
    const userName = sessionStorage.getItem("UserName") || "Unknown User";
    const roleName = sessionStorage.getItem("RoleName") || "Unknown Role";
    const formattedDate = selectedDate ? new Date(selectedDate).toLocaleDateString("en-CA") : "N/A";

    const newWindow = window.open("", "_blank");
    if (!newWindow) return;

    let printContent = `
    <html>
      <head>
        <title>${title}</title>
      </head>
      <body>
        <div style="text-align: center; margin-bottom: 10px;">
          <h2>${title}</h2>
          <p><strong>User:</strong> ${userName}</p>
          <p><strong>Role:</strong> ${roleName}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
        </div>
        <table border="1" style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr>
              ${columns.map(col => `<th>${col.name}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `<tr>${columns.map(col => `<td>${col.selector(row) || ""}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      </body>
    </html>`;

    newWindow.document.write(printContent);
    newWindow.document.close();
    newWindow.print();
  };

  const handleCustomExportExcel = (data, title, columns, selectedDate) => {
    const userName = sessionStorage.getItem("UserName") || "Unknown User";
    const roleName = sessionStorage.getItem("RoleName") || "Unknown Role";
    const formattedDate = selectedDate ? new Date(selectedDate).toLocaleDateString("en-CA") : "N/A";

    const headerInfo = [
      ["User:", userName],
      ["Role:", roleName],
      ["Date:", formattedDate],
      [],
      [title],
      [],
    ];

    const tableHeaders = [columns.map(col => col.name)];
    const tableData = data.map(row => columns.map(col => col.selector(row) || ""));

    const worksheetData = [...headerInfo, ...tableHeaders, ...tableData];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, title);

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const excelData = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(excelData, `${title}.xlsx`);
  };

  const handleCustomExportPDF = (data, title, columns, selectedDate) => {
    const userName = sessionStorage.getItem("UserName") || "Unknown User";
    const roleName = sessionStorage.getItem("RoleName") || "Unknown Role";
    const formattedDate = selectedDate ? new Date(selectedDate).toLocaleDateString("en-CA") : "N/A";

    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text(title, 14, 10);
    doc.text(`User: ${userName}`, 14, 20);
    doc.text(`Role: ${roleName}`, 14, 30);
    doc.text(`Date: ${formattedDate}`, 14, 40);

    const tableHeaders = columns.map(col => col.name);
    const tableRows = data.map(row => columns.map(col => col.selector(row) || ""));

    autoTable(doc, {
      head: [tableHeaders],
      body: tableRows,
      startY: 50,
      styles: { fontSize: 8 },
      theme: "grid"
    });

    doc.save(`${title}.pdf`);
  };

  const tripline = [
    {
      name: "Sl.No",
      selector: (row) => row.SLNo,
      sortable: true,
      width: "80px",
      style: { fontWeight: "bold" },
    },

    {
      name: "Customer Name",
      selector: (row) => row.AccountName,
      sortable: true,
    },

    {
      name: "Address",
      selector: (row) => (row.Address),
      sortable: true,
    },
    {
      name: " Date",
      selector: (row) => formatDate(row.Date),
      sortable: true,

    },

    {
      name: "Status",
      selector: (row) => {
        if ((row.CustomerStatus === 1 || row.CustomerStatus === 0) && row.LocationStatus === 5) {
          return "Order Placed";
        } else if (row.CustomerStatus === 1) {
          return "Take Order";
        } else if (row.CustomerStatus === 2) {
          return "No Order";
        } else if ((row.CustomerStatus === 3 || row.CustomerStatus === 4)) {
          return "Shop Closed";
        } else if (row.LocationStatus === 3) {
          return "New Customer ";
        } else {
          return "N/A"; // Default case if Status is undefined or has another value
        }
      },
      sortable: true,
    }


  ];

  const orders = [
    {
      name: "SL.No",
      selector: (row) => row.SLNo,
      sortable: true,
      width: "8%",
      style: { fontWeight: "bold", textAlign: 'center' },
    },
    {
      name: "ORDER NO",
      selector: (row) => `${row.Bill_Series || ''}${row.OrderNo || ''}`,
      sortable: true,
      style: { textAlign: 'center' },
      width: "17%",
    },
    {
      name: "CUSTOMER NAME",
      selector: (row) => `${row.AccountName || ''}, ${row.Address || ''}`,
      sortable: true,
      style: {
        textAlign: 'left',
      },
      width: '30%',

    },
    {
      name: "BILL AMOUNT",
      selector: (row) => row.Amount,
      sortable: true,
      style: {
        textAlign: 'right',
      },
      width: '15%',

    },
    {
      name: "STATUS",
      selector: (row) => (row.OrderStatus === 1 ? "Invoiced" : "Not Invoiced"),
      sortable: true,
      style: {
        textAlign: 'left',
      },
      width: '18%',

    },
    {
      name: "MODE",
      selector: (row) => row.BillMode,
      sortable: true,
      cell: (row) => {
        return row.BillMode === 1 ? "Credit" : "Cash";
      },
      style: {
        textAlign: 'left',
      },
      width: '12%',

    }
  ];

  const sales = [
    {
      name: "SL.No",
      selector: (row) => row.SLNo,
      sortable: true,
      style: { fontWeight: "bold", textAlign: 'center' },
      width: "8%",
    },

    {
      name: "BILLNO",
      selector: (row) => `${row.InvSeries || ''}${row.BillNo || ''}${row.RetailBillNo || ''}`,
      sortable: true,
      style: { textAlign: 'center' },
      width: "22%",
    },

    {
      name: "CUSTOMER NAME",
      selector: (row) => `${row.CustomerName || ''}, ${row.CumPlace || ''}`,
      style: { textAlign: 'center' },
      width: "30%",
    },

    {
      name: "AMOUNT",
      selector: (row) => row.BillAmount,
      style: { textAlign: 'center' },
      width: "13%",
    },

    {
      name: "BILL MODE",
      selector: (row) => row.BillModeText,
      sortable: true,
      style: {
        textAlign: 'right',
      },
      width: '15%',

    },
    {
      name: "Sale Mode",
      selector: (row) => row.WholeSaleRetail,
      sortable: true,
      style: {
        textAlign: 'left',
      },
      width: '12%',

    },


  ];

  const receipt = [
    {
      name: "SL.No",
      selector: (row) => row.SLNo,
      sortable: true,
      style: { fontWeight: "bold", textAlign: 'center' },
      width: "9%",
    },
    {
      name: "R.NO",
      selector: (row) => row.Slno,
      sortable: true,
      style: { fontWeight: "bold", textAlign: 'center' },
      width: "9%",
    },

    {
      name: "CUSTOMER NAME",
      selector: (row) => `${row.CustomerName || ''},${row.Place || ''}`,
      sortable: true,
      style: {
        textAlign: 'left',
      },
      width: '24%',

    },
    {
      name: "AMOUNT",
      selector: (row) => row.Amt,
      style: { textAlign: 'center' },
      width: "10%",
    },

    {
      name: "TYPE",
      selector: (row) => row.Type,
      sortable: true,
      style: {
        textAlign: 'right',
      },
      width: '14%',

    },

    {
      name: "STATUS",
      selector: (row) => row.ApprovalStatus === 1 ? "Approved" : "Not Approved",
      sortable: true,
      style: { textAlign: 'right' },
      width: '10%',
    },


    {
      name: "REMARK",
      selector: (row) => row.Remark,
      sortable: true,
      style: {
        textAlign: 'left',
      },
      width: '24%',

    },
  ];
  const Report = [
    {
      name: "Sl.No",
      selector: (row) => row.SlNo,
      sortable: true,
      width: "8%", // 10% of the table width
      style: { fontWeight: "bold" },
    },
    {
      name: "Starting Date",
      selector: (row) =>
        row.StartingDate ? row.StartingDate.split("T")[0] : "",
      sortable: true,
      style: { textAlign: "center" },
      width: "16%", // 20% of the table width
    },
    {
      name: "EndingDate",
      selector: (row) =>
        row.EndingDate ? row.EndingDate.split("T")[0] : "N/A",
      sortable: true,
      style: { textAlign: "left" },
      width: "16%",
    },
    {
      name: "StartingKm",
      selector: (row) => (row.StartingKm !== null && row.StartingKm !== undefined ? row.StartingKm : "N/A"),
      sortable: true,
      style: { textAlign: "center" },
      width: "10%",
    },
    {
      name: "EndingKm",
      selector: (row) => (row.EndingKm !== null && row.EndingKm !== undefined ? row.EndingKm : "N/A"),
      style: { textAlign: "center" },
      width: "10%",
    },
    {
      name: "TotalKm",
      selector: (row) => (row.TotalKm !== null && row.TotalKm !== undefined ? row.TotalKm : "N/A"),
      style: { textAlign: "center" },
      width: "10%",
    },

    {
      name: "KM Allowance",
      selector: (row) => `₹ ${row.KMPrice ?? 0}`,
      style: { textAlign: "center" },
      width: "10%", // 20% of the table width
    },

    {
      name: "Day allowance",
      selector: (row) => `₹ ${row.Dayallowance ?? 0}`,
      style: { textAlign: "center" },
      width: "10%", // 20% of the table width
    },

    {
      name: "Total Allowance",
      selector: (row) => `₹ ${row.TotalAllowance ?? 0}`,
      style: { textAlign: "center" },
      width: "10%", // 20% of the table width
    },
  ];

  const filterTextLower = filterText ? filterText.toLowerCase() : "";

  const filteredTriporder = TripOrder.filter((user) =>
    (user.AccountName ? user.AccountName.toLowerCase() : "").includes(filterTextLower)
  );

  const filteredTripsale = TripSale.filter((user) =>
    (user.CustomerName ? user.CustomerName.toLowerCase() : "").includes(filterTextLower)
  );

  const filteredTripreceipt = TripReceipt.filter((user) =>
    (user.CustomerName ? user.CustomerName.toLowerCase() : "").includes(filterTextLower)
  );

  const filteredTripreport = TripReport.filter((user) =>
    (user.CustomerName ? user.CustomerName.toLowerCase() : "").includes(filterTextLower)
  );

  const filteredTripline = Tripline.filter((user) =>
    (user.AccountName ? user.AccountName.toLowerCase() : "").includes(filterTextLower)
  );

  const totalKm = filteredTripreport.reduce((sum, row) => sum + (row.TotalKm ?? 0), 0);
  const totalKMPrice = filteredTripreport.reduce((sum, row) => sum + (row.KMPrice ?? 0), 0);
  const totalDayAllowance = filteredTripreport.reduce((sum, row) => sum + (row.Dayallowance ?? 0), 0);
  const totalAllowance = filteredTripreport.reduce((sum, row) => sum + (row.TotalAllowance ?? 0), 0);


  const reportWithTotals = [
    ...filteredTripreport,
    {
      SlNo: 'Total',
      StartingDate: '',
      EndingDate: '',
      StartingKm: '',
      EndingKm: '',
      TotalKm: totalKm,
      KMPrice: totalKMPrice,
      Dayallowance: totalDayAllowance,
      TotalAllowance: totalAllowance,
    }
  ];


  const handleExportExcel = (data) => {
    if (!data || data.length === 0) {
      console.warn("No data to export");
      return;
    }

    const workbook = XLSX.utils.book_new();

    // Group data by EMP_NAME
    const empGroups = data.reduce((acc, row) => {
      const { EMP_NAME } = row;
      if (!acc[EMP_NAME]) acc[EMP_NAME] = [];
      acc[EMP_NAME].push({
        ...row,
        StartingDate: row.StartingDate ? row.StartingDate.split("T")[0] : "", // Extracting only the date
        EndingDate: row.EndingDate ? row.EndingDate.split("T")[0] : "", // Extracting only the date
      });
      return acc;
    }, {});

    // Create a separate sheet for each EMP_NAME
    Object.entries(empGroups).forEach(([EMP_NAME, rows]) => {
      // Calculate totals
      const totalKm = rows.reduce((sum, row) => sum + (row.TotalKm || 0), 0);
      const totalKMPrice = rows.reduce((sum, row) => sum + (row.KMPrice || 0), 0);
      const totalDayAllowance = rows.reduce((sum, row) => sum + (row.Dayallowance || 0), 0);
      const totalTotalAllowance = rows.reduce((sum, row) => sum + (row.TotalAllowance || 0), 0);

      // Add totals as last row
      rows.push({
        EMP_NAME: "TOTAL", // Label
        TotalKm: totalKm,
        KMPrice: totalKMPrice,
        Dayallowance: totalDayAllowance,
        TotalAllowance: totalTotalAllowance,
      });

      // Convert JSON to worksheet
      const worksheet = XLSX.utils.json_to_sheet(rows);

      XLSX.utils.book_append_sheet(workbook, worksheet, `USER-${EMP_NAME}`);
    });

    // Generate Excel file and trigger download
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const excelData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(excelData, `All_Emp_Trip_Report.xlsx`);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };


  useEffect(() => {
    // Retrieve from sessionStorage and parse JSON
    const storedCompanyData = sessionStorage.getItem("companyResponse");
    if (storedCompanyData) {
      setCompanyData(JSON.parse(storedCompanyData));
    }
  }, []);


  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,  // Ensures two decimal places
      maximumFractionDigits: 2,  // Ensures two decimal places
    }).format(amount);
  };

  return (
    <div className="container mt-4 bg-white p-4 shadow rounded">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-bold">{username} - {RoleName}</h2>

        <div className="d-flex gap-3">
          {/* This is now the left side (selectedDate) */}
          <div
            className="date-picker-container position-relative d-flex align-items-center"
            style={{ zIndex: 1050 }}
          >
            <DatePicker
              id="date-picker-from"
              selected={selectedDate}
              onChange={handleDateChange}
              dateFormat="yyyy/MM/dd"
              className="form-control pe-5"
            />
            <FaCalendarAlt
              className="position-absolute top-50 end-0 translate-middle-y me-2 text-secondary"
              style={{ pointerEvents: "none" }}
            />
          </div>

          {(activeTab === 'TripReport' || activeTab === 'Tripline') && (
            <div
              className="date-picker-container position-relative d-flex align-items-center"
              style={{ zIndex: 1050 }}
            >
              <DatePicker
                id="date-picker-to"
                selected={selectedFromDate}
                onChange={handlereportChange}
                dateFormat="yyyy/MM/dd"
                className="form-control pe-5"
              />
              <FaCalendarAlt
                className="position-absolute top-50 end-0 translate-middle-y me-2 text-secondary"
                style={{ pointerEvents: "none" }}
              />
            </div>
          )}
        </div>

      </div>
      <Tabs
        activeKey={activeTab}
        onSelect={(tab) => setActiveTab(tab)}
        className="mb-4"
      >
        <Tab eventKey="TripInfo" title="Trip Info">

          <div className="page-body bg-white">
            {/* Page body */}
            <div className="container-xl">
              <div className="row row-deck row-cards">
                <div className="container-fluid py-5">
                  <div className="container">

                    <div className="row justify-content-center">
                      <div className="col-lg-12">
                        <div className="card shadow-lg p-4 border-0 rounded-4 bg-light">


                          <div className="col-12">
                            <div className="row row-cards">
                              <div className="col-sm-6 col-lg-3">
                                <div className="card card-sm">
                                  <div className="card-body">
                                    <div className="row align-items-center">
                                      <div className="col-auto">
                                        <span className="bg-purple text-white avatar">
                                          {/* Download SVG icon from http://tabler-icons.io/i/handshake */}
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="icon"
                                            width={24}
                                            height={24}
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                            stroke="currentColor"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                            <path d="M10 14l-2 2a3 3 0 0 1 -4.5 -4.5l2 -2" />
                                            <path d="M14 10l2 -2a3 3 0 0 1 4.5 4.5l-2 2" />
                                            <path d="M8 12l4 4l6 -6" />
                                            <path d="M3 21h7" />
                                            <path d="M14 21h7" />
                                            <path d="M6.5 17.5l-1.5 3.5" />
                                            <path d="M17.5 17.5l1.5 3.5" />
                                          </svg>
                                        </span>
                                      </div>
                                      <div className="col">
                                        <div className="font-weight-medium">
                                          Total Visit: {TripCount?.["Total Visit"] || 0}

                                        </div>
                                        <div className="text-secondary">
                                          {/* Place Order: {TripCount?.["Place Order"] || 0} */}

                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="col-sm-6 col-lg-3">
                                <div className="card card-sm">
                                  <div className="card-body">
                                    <div className="row align-items-center">
                                      <div className="col-auto">
                                        <span className="bg-blue text-white avatar">
                                          {/* Download SVG icon from http://tabler-icons.io/i/store */}
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="icon"
                                            width={24}
                                            height={24}
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                            stroke="currentColor"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                            <path d="M5 11h14l-1.5 9h-11z" />
                                            <path d="M5 11v-7h14v7" />
                                            <path d="M3 11h18" />
                                            <path d="M7 15v2m4 -2v2m4 -2v2" />
                                          </svg>
                                        </span>
                                      </div>
                                      <div className="col">
                                        <div className="font-weight-medium">
                                          Place Order: {TripCount?.["Place Order"] || 0}

                                        </div>
                                        <div className="text-secondary">
                                          {/* Amount: {TripCount?.SumB2CSale || 0} */}

                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="col-sm-6 col-lg-3">
                                <div className="card card-sm">
                                  <div className="card-body">
                                    <div className="row align-items-center">
                                      <div class="col-auto">
                                        <span class="bg-red text-white avatar">
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            class="icon"
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            stroke-width="2"
                                            stroke="currentColor"
                                            fill="none"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                          >
                                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                            <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
                                            <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
                                          </svg>
                                        </span>
                                      </div>
                                      <div className="col">
                                        <div className="font-weight-medium">
                                          New Customers: {TripCount?.["New Customers"] || 0}

                                        </div>
                                        <div className="text-secondary">
                                          {/* {loading
                                      ? "Loading..."
                                      : `Total Route: ${CusItemCount?.TotalRoute || 0}`} */}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="col-sm-6 col-lg-3">
                                <div className="card card-sm">
                                  <div className="card-body">
                                    <div className="row align-items-center">
                                      <div class="col-auto">
                                        <span className="bg-yellow text-white avatar">
                                          {/* Download SVG icon from http://tabler-icons.io/i/shopping-cart */}
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="icon"
                                            width={24}
                                            height={24}
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                            stroke="currentColor"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                            <path d="M6 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                                            <path d="M17 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                                            <path d="M17 17h-11v-14h-2" />
                                            <path d="M6 5l14 1l-1 7h-13" />
                                          </svg>
                                        </span>
                                      </div>
                                      <div className="col">
                                        <div className="font-weight-medium">
                                          No Orders: {TripCount?.["Total Visit"] - TripCount?.["Place Order"] || 0}
                                        </div>
                                        <div className="text-secondary">
                                          {/* {loading
                                      ? "Loading..."
                                      : `Total Category: ${CusItemCount?.TotalCategory || 0
                                      }`} */}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <h2 className="text-center text-primary fw-bold mb-4">
                            Odometer Readings
                          </h2>

                          <div className="row g-4">
                            {/* Starting Kilometer Card */}
                            <div className="col-md-6 d-flex">
                              <div className="card border-0 shadow-sm rounded-4 w-100 h-100">
                                <div className="card-body text-center">
                                  <h5 className="fw-bold text-dark mb-2">
                                    Starting Kilometer
                                  </h5>
                                  <p className="mb-1 fs-5">
                                    <b>{Odometer?.StartingKm || "Unknown"} Km</b>
                                  </p>
                                  <p className="text-muted mb-1">
                                    📅 Date:{" "}

                                    {Odometer?.StartingDate
                                      ? new Date(new Date(Odometer.StartingDate).getTime() - (5 * 60 + 30) * 60000)
                                        .toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                        .replace(/\//g, '.')
                                      : "Unknown"}

                                  </p>
                                  <p className="text-muted">
                                    ⏰ Time:{" "}
                                    {Odometer?.StartingDate
                                      ? new Date(
                                        new Date(Odometer.StartingDate).getTime() -
                                        (5 * 60 + 30) * 60 * 1000
                                      ).toLocaleTimeString()
                                      : "Unknown"}
                                  </p>
                                </div>
                                <div
                                  className="d-flex justify-content-center align-items-center"
                                  style={{ height: "300px", width: "100%" }}
                                >
                                  {Odometer?.StartingPic ? (
                                    <img
                                      src={`data:image/jpeg;base64,${Odometer.StartingPic}`}
                                      className="img-fluid rounded-4 shadow-lg border"
                                      alt="Ending Pic"
                                      style={{
                                        height: "300px",
                                        width: "70%",
                                        objectFit: "fill",
                                        borderRadius: "12px",
                                        transition: "all 0.4s ease-in-out",
                                      }}
                                      onMouseOver={(e) => {
                                        e.currentTarget.style.transform = "scale(1.08)";
                                        e.currentTarget.style.filter = "brightness(1.2)";
                                      }}
                                      onMouseOut={(e) => {
                                        e.currentTarget.style.transform = "scale(1)";
                                        e.currentTarget.style.filter = "brightness(1)";
                                      }}
                                    />
                                  ) : (
                                    <h3 className="text-muted text-center">Waiting for Upload...</h3>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Ending Kilometer Card */}
                            <div className="col-md-6 d-flex">
                              <div className="card border-0 shadow-sm rounded-4 w-100 h-100">
                                <div className="card-body text-center">
                                  <h5 className="fw-bold text-dark mb-2">Ending Kilometer</h5>
                                  <p className="mb-1 fs-5">
                                    <b>{Odometer?.EndingKm || "Unknown"} Km</b>
                                  </p>
                                  {Odometer?.EndingPic && (
                                    <>
                                      <p className="text-muted mb-1">
                                        📅 Date:{" "}
                                        {Odometer?.EndingDate
                                          ? new Date(new Date(Odometer.EndingDate).getTime() - (5 * 60 + 30) * 60000)
                                            .toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                            .replace(/\//g, '.')
                                          : "Unknown"}
                                      </p>
                                      <p className="text-muted">
                                        ⏰ Time:{" "}
                                        {Odometer?.EndingDate
                                          ? new Date(new Date(Odometer.EndingDate).getTime() - (5 * 60 + 30) * 60 * 1000).toLocaleTimeString()
                                          : "Unknown"}
                                      </p>
                                    </>
                                  )}
                                  <p className="fw-bold fs-5 text-primary">
                                    Total Kilometers:{" "}
                                    <b>
                                      {Odometer?.EndingKm && Odometer?.StartingKm
                                        ? `${Odometer.EndingKm - Odometer.StartingKm} Km`
                                        : "Unknown"}
                                    </b>
                                  </p>
                                </div>
                                <div className="d-flex justify-content-center align-items-center" style={{ height: "300px", width: "100%" }}>
                                  {Odometer?.EndingPic ? (
                                    <img
                                      src={`data:image/jpeg;base64,${Odometer.EndingPic}`}
                                      className="img-fluid rounded-4 shadow-lg border"
                                      alt="Ending Pic"
                                      style={{ height: "300px", width: "70%", objectFit: "fill", borderRadius: "12px", transition: "all 0.4s ease-in-out" }}
                                      onMouseOver={(e) => {
                                        e.currentTarget.style.transform = "scale(1.08)";
                                        e.currentTarget.style.filter = "brightness(1.2)";
                                      }}
                                      onMouseOut={(e) => {
                                        e.currentTarget.style.transform = "scale(1)";
                                        e.currentTarget.style.filter = "brightness(1)";
                                      }}
                                    />
                                  ) : (
                                    <h3 className="text-muted text-center">Waiting for Upload...</h3>
                                  )}
                                </div>
                              </div>
                            </div>

                          </div>
                          {/* Row Ends Here */}
                        </div>
                      </div>{" "}
                      {/* Col Ends Here */}
                    </div>{" "}
                    {/* Row Ends Here */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Tab>

        <Tab eventKey="Tripline" title={`Tripline - ${filteredTripline.length > 0 ? filteredTripline[0].SLNo || 0 : 0}`}>

          <div className="container mt-4">
            <h2 className="mb-4 text-center text-primary">Trip Details</h2>

            {/* Search Bar with Icon */}
            <div class="col-lg-3">
              <div className="input-group mb-3">
                <span className="input-group-text bg-primary text-white">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by CustomerName..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />

              </div>
            </div>
            {/* Export and Print Buttons */}
            <div className="d-flex gap-2">
              <div className="ms-auto d-flex gap-2">
                <button className="btn btn-" onClick={() => handleCustomExportPDF(filteredTripline, 'Tripline Report', tripline, selectedDate)}>
                  <FaFilePdf />
                  <span className="d-none d-md-inline"> PDF</span>
                </button>
                <button className="btn btn-" onClick={() => handleCustomExportExcel(filteredTripline, 'Tripline Report', tripline, selectedDate)}>
                  <FaFileExcel />
                  <span className="d-none d-md-inline"> Excel</span>
                </button>
                <button className="btn btn-" onClick={() => handleCustomPrint(filteredTripline, 'Tripline Report', tripline, selectedDate)}>
                  <FaPrint />
                  <span className="d-none d-md-inline"> Print</span>
                </button>
              </div>
            </div>
            {/* Data Table */}
            <DataTable
              columns={tripline}
              data={filteredTripline}
              progressPending={loading}
              pagination
              paginationPerPage={500} // Default rows per page
              paginationRowsPerPageOptions={[500, 1000, 5000]} // Custom pagination options
              highlightOnHover
              pointerOnHover
              responsive
              striped

            />
          </div>
        </Tab>

        <Tab eventKey="Tripmap" title="Trip Map">
          <div className="page-wrapper bg-white">
            <div className="container">
              <div className="row">


                <div className="col-12 col-md-12" style={{ height: "80vh" }}>
                  <div className="card h-100">
                    <div className="card-body p-0">
                      <div className="w-100 h-100 position-relative">
                        {tripData.length > 0 ? (
                          <MapContainer
                            key={selectedDate}
                            center={[10.0, 76.5]}
                            zoom={6.5}
                            style={{ height: "100%", width: "100%" }}
                          >
                            <TileLayer
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />

                            {/* Employee Route (Green Dashed Line) */}
                            <Polyline positions={empPositions} pathOptions={{ color: "green", dashArray: "4" }} />

                            {/* Customer Route (Blue Dashed Line) */}
                            {/* <Polyline positions={custPositions} pathOptions={{ color: "blue", dashArray: "4" }} /> */}

                            {/* Employee Markers */}
                            {tripData.map((loc) => (
                              loc.EmpLatitude && loc.EmpLongitude && (
                                <Marker key={`emp-${loc.SLNo}`} position={[parseFloat(loc.EmpLatitude), parseFloat(loc.EmpLongitude)]}>
                                  <Popup>
                                    <b>SLNo:</b> {loc.SLNo}
                                    <br />
                                    <b>Account Name:</b> {loc.AccountName}
                                    <br />
                                    <b>Address:</b> {loc.Address}
                                  </Popup>
                                </Marker>
                              )
                            ))}

                            {/* Customer Markers */}
                            {/* {tripData.map((loc) => (
                              loc.CustLatitude && loc.CustLongitude && (
                                <Marker key={`cust-${loc.SLNo}`} position={[parseFloat(loc.CustLatitude), parseFloat(loc.CustLongitude)]}>
                                  <Popup>
                                    <b>SLNo:</b> {loc.SLNo}
                                    <br />
                                    <b>Account Name:</b> {loc.AccountName}
                                    <br />
                                    <b>Address:</b> {loc.Address}
                                  </Popup>
                                </Marker>
                              )
                            ))} */}

                            {/* Ensure proper resizing */}
                            <MapResizer />
                          </MapContainer>
                        ) : (
                          <p className="text-center mt-3">Loading map...</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </Tab>

        <Tab eventKey="TripOrder" title={`Order - ${filteredTriporder.length > 0 ? filteredTriporder[filteredTriporder.length - 1].SLNo || 0 : 0}`}>

          <div className="container mt-4">
            <h2 className="mb-4 text-center text-primary">Trip Order Details</h2>

            {/* Search Bar with Icon */}
            <div class="col-lg-3">
              <div className="input-group mb-3">
                <span className="input-group-text bg-primary text-white">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by CustomerName..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />

              </div>
            </div>
            {/* Export and Print Buttons */}
            <div className="d-flex gap-2">
              <div className="ms-auto d-flex gap-2">
                <button className="btn btn-" onClick={() => handleCustomExportPDF(filteredTriporder, 'Trip Order Report', orders, selectedDate)}>
                  <FaFilePdf />
                  <span className="d-none d-md-inline"> PDF</span>
                </button>
                <button className="btn btn-" onClick={() => handleCustomExportExcel(filteredTriporder, 'Trip Order Report', orders, selectedDate)}>
                  <FaFileExcel />
                  <span className="d-none d-md-inline"> Excel</span>
                </button>
                <button className="btn btn-" onClick={() => handleCustomPrint(filteredTriporder, 'Trip Order Report', orders, selectedDate)}>
                  <FaPrint />
                  <span className="d-none d-md-inline"> Print</span>
                </button>
              </div>
            </div>

            {/* Data Table */}
            <DataTable
              columns={orders}
              data={filteredTriporder}
              progressPending={loading}
              pagination
              paginationPerPage={500} // Default rows per page
              paginationRowsPerPageOptions={[500, 1000, 5000]} // Custom pagination options
              highlightOnHover
              onRowClicked={(row) => handleOrderRowClick(row.DSID)}
              pointerOnHover
              responsive
              striped

            />
          </div>

          {isModalOpen && (
            <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.5)" }}>
              <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content shadow-lg rounded">

                  {/* Modal Header */}
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title fw-bold">Order Details</h5>
                    <button type="button" className="close btn btn-danger rounded-circle p-2" onClick={handleCloseModal}>
                      <span>&times;</span>
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="modal-body p-4" id="modal-print-content">
                    <div className="container-fluid">

                      {/* Invoice Header */}
                      <div className="row align-items-center mb-4 border-bottom pb-3">
                        <div className="col-md-6">
                          {[...new Map(orderDetails.map(order =>
                            [`${order.Bill_Series}-${order.OrderNo}`, order] // Create a unique key for each order
                          )).values()].map((customer, index) => (
                            <div key={index}>
                              <h2 className="fw-bold">
                                Order <small className="text-muted">{customer.Bill_Series}{customer.OrderNo}</small>
                              </h2>
                              <h5 className="text-muted">Date:  {customer.Date ? new Date(customer.Date).toLocaleDateString() : "N/A"}</h5>
                            </div>
                          ))}
                        </div>

                        <div className="col-md-6 text-end">
                          {/* <img className="logo" src="src/assets/logo_kairali.png" alt="Company Logo" style={{ maxWidth: "80px" }} /> */}
                          {companyData ? (
                            <ul className="list-unstyled mb-0">
                              <li><strong>{companyData.CompanyName}</strong></li>
                              <li style={{ fontSize: "12px" }}>{companyData.Address}</li>
                              {/* <li style={{ fontSize: "12px" }}>{companyData.District}, {companyData.State}</li> */}
                              <li style={{ fontSize: "12px" }}>{companyData.GSTinNo}</li>
                              {/* <li style={{ fontSize: "12px" }}>{companyData.Email}</li> */}
                              <li style={{ fontSize: "12px" }}>{companyData.MobileNO}</li>

                            </ul>
                          ) : (
                            <p>Loading company details...</p>
                          )}
                        </div>
                      </div>

                      {/* Company & User Details */}
                      <div className="row g-3 d-flex flex-wrap">
                        {[...new Map(orderDetails.map(customer =>
                          [`${customer.CustomerName}-${customer.Address}-${customer.Mob}`, customer]
                        )).values()].map((customer, index) => (
                          <div key={index} className="col-md-6">
                            <div className="card shadow-sm p-3 h-100 d-flex flex-column">
                              <h5 className="fw-bold">Customer Details</h5>
                              <ul className="list-unstyled  flex-grow-1">
                                <li><strong>Name:</strong> {customer.CustomerName}</li>
                                <li><strong>Address:</strong> {customer.Address}</li>
                                <li><strong>Phone:</strong> {customer.Mob}</li>
                              </ul>
                            </div>
                          </div>
                        ))}

                        {[...new Map(orderDetails.map(customer =>
                          [`${customer.CustomerName}-${customer.Address}-${customer.Mob}`, customer]
                        )).values()].map((customer, index) => (
                          <div key={index} className="col-md-6">
                            <div className="card shadow-sm p-3 h-100 d-flex flex-column">
                              <h5 className="fw-bold">saler Details</h5>
                              <ul className="list-unstyled flex-grow-1">
                                <li><strong>User:</strong> {customer.UserName}</li>
                                <li><strong>Order Status:</strong> {customer.OrderStatus === 1 ? "Invoiced" : "Not Invoiced"}</li>
                                <li><strong>Mode:</strong> {customer.BillMode === 1 ? "Credit" : "Cash"}</li>
                                <li><strong>Bill Date:</strong> {new Date(customer.Date).toLocaleDateString()}</li>
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Items Table */}
                      <div className="card shadow-sm p-3 mt-4">
                        <h5 className="fw-bold">Items Summary</h5>
                        <div className="table-responsive mt-2">
                          <table className="table table-bordered text-center" style={{ fontSize: "10px", minWidth: "600px" }}>
                            <thead className="table-light">
                              <tr>
                                <th>Sl No</th>
                                <th>Item Name</th>
                                <th>Qty</th>
                                <th>MRP</th>
                                <th>Rate</th>
                                <th>Total Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orderDetails.length > 0 ? (
                                orderDetails.map((item, index) => (
                                  <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{item.ItemName}</td>
                                    <td>{item.Qty}</td>
                                    <td>{formatAmount(item.MRP)}</td>
                                    <td>{formatAmount(item.Rate)}</td>
                                    <td>{formatAmount(item.NetAmount)}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="6" className="text-center">No details available</td>
                                </tr>
                              )}
                            </tbody>
                            <tfoot className="table-dark text-white">
                              <tr>
                                <th colSpan="3" className="text-end">Total:</th>
                                <th>{formatAmount(orderDetails.reduce((sum, item) => sum + item.MRP, 0))}</th>
                                <th>{formatAmount(orderDetails.reduce((sum, item) => sum + item.Rate, 0))}</th>
                                <th>{formatAmount(orderDetails.reduce((sum, item) => sum + item.NetAmount, 0))}</th>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                      </div>

                      {/* Notes Section */}
                      <div className="row g-3 mt-4">
                        <div className="col-md-4">
                          <div className="card shadow-sm p-3">
                            <h5 className="fw-bold">Notes</h5>
                            <p>Payment is requested within 15 days of receiving this invoice.</p>
                          </div>
                        </div>
                        {orderDetails.length > 0 && orderDetails[0].Narration && (
                          <div className="col-md-4">
                            <div className="card shadow-sm p-3">
                              <h5 className="fw-bold">Narration</h5>
                              <p>{orderDetails[0].Narration}</p>
                            </div>
                          </div>
                        )}

                      </div>

                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="modal-footer bg-light">
                    {/* <button type="button" className="btn btn-primary" onClick>
                              Print
                            </button> */}
                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}



        </Tab>

        <Tab eventKey="TripSales" title={`Sale - ${filteredTripsale.length > 0 ? filteredTripsale[filteredTripsale.length - 1].SLNo || 0 : 0}`}>

          <div className="container mt-4">
            <h2 className="mb-4 text-center text-primary">Trip Sales Details</h2>

            {/* Search Bar with Icon */}
            <div class="col-lg-3">
              <div className="input-group mb-3">
                <span className="input-group-text bg-primary text-white">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by CustomerName..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />

              </div>
            </div>

            {/* Export and Print Buttons */}
            <div className="d-flex gap-2">
              <div className="ms-auto d-flex gap-2">
                <button className="btn btn-" onClick={() => handleCustomExportPDF(filteredTripsale, 'Trip Sale Report', sales, selectedDate)}>
                  <FaFilePdf />
                  <span className="d-none d-md-inline"> PDF</span>
                </button>
                <button className="btn btn-" onClick={() => handleCustomExportExcel(filteredTripsale, 'Trip Sale Report', sales, selectedDate)}>
                  <FaFileExcel />
                  <span className="d-none d-md-inline"> Excel</span>
                </button>
                <button className="btn btn-" onClick={() => handleCustomPrint(filteredTripsale, 'Trip Sale Report', sales, selectedDate)}>
                  <FaPrint />
                  <span className="d-none d-md-inline"> Print</span>
                </button>
              </div>
            </div>


            {/* Data Table */}
            <DataTable
              columns={sales}
              data={filteredTripsale}
              progressPending={loading}
              pagination
              paginationPerPage={500} // Default rows per page
              paginationRowsPerPageOptions={[500, 1000, 5000]} // Custom pagination options
              highlightOnHover
              pointerOnHover
              onRowClicked={(row) => handleBillRowClick(row.BillID)}
              responsive
              striped

            />
          </div>

          {isModalOpen && (
            <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.5)" }}>
              <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content shadow-lg rounded">

                  {/* Modal Header */}
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title fw-bold">Bill Details</h5>
                    <button type="button" className="close btn btn-danger rounded-circle p-2" onClick={handleCloseModal}>
                      <span>&times;</span>
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="modal-body p-4" id="modal-print-content">
                    <div className="container-fluid">

                      {/* Invoice Header */}
                      <div className="row align-items-center mb-4 border-bottom pb-3">
                        <div className="col-md-6">
                          {[...new Map(Billdetails.map(order =>
                            [`${order.InvSeries}-${order.RetailBillNo}-${order.WholesaleNo}`, order] // Create a unique key for each order
                          )).values()].map((customer, index) => (
                            <div key={index}>
                              <h2 className="fw-bold">
                                <small className="text-muted">{customer.InvSeries}{customer.OrderNo}</small>
                              </h2>
                              <h5 className="text-muted">Date: {customer.BillDate ? new Date(customer.BillDate).toLocaleDateString() : "N/A"}</h5>
                            </div>
                          ))}
                        </div>

                        <div className="col-md-6 text-end">
                          {/* <img className="logo" src="src/assets/logo_kairali.png" alt="Company Logo" style={{ maxWidth: "80px" }} /> */}
                          {companyData ? (
                            <ul className="list-unstyled mb-0">
                              <li><strong>{companyData.CompanyName}</strong></li>
                              <li style={{ fontSize: "12px" }}>{companyData.Address}</li>
                              {/* <li style={{ fontSize: "12px" }}>{companyData.District}, {companyData.State}</li> */}
                              <li style={{ fontSize: "12px" }}>{companyData.GSTinNo}</li>
                              {/* <li style={{ fontSize: "12px" }}>{companyData.Email}</li> */}
                              <li style={{ fontSize: "12px" }}>{companyData.MobileNO}</li>

                            </ul>
                          ) : (
                            <p>Loading company details...</p>
                          )}
                        </div>
                      </div>

                      {/* Company & User Details */}
                      <div className="row g-3 d-flex flex-wrap">
                        {[...new Map(Billdetails.map(customer =>
                          [`${customer.CustomerName}-${customer.
                            CumAddress}-${customer.CumContact}`, customer])).values()].map((customer, index) => (
                              <div key={index} className="col-md-6">
                                <div className="card shadow-sm p-3 h-100 d-flex flex-column">
                                  <h5 className="fw-bold">Customer Details</h5>
                                  <ul className="list-unstyled  flex-grow-1">
                                    <li><strong>Name:</strong> {customer.CustomerName}</li>
                                    <li><strong>Address:</strong> {customer.CumAddress}</li>
                                    <li><strong>Phone:</strong> {customer.CumContact}</li>
                                  </ul>
                                </div>
                              </div>
                            ))}

                        {[...new Map(Billdetails.map(customer =>
                          [`${customer.CustomerName}-${customer.CumAddress}-${customer.CumContact}`, customer]
                        )).values()].map((customer, index) => (
                          <div key={index} className="col-md-6">
                            <div className="card shadow-sm p-3 h-100 d-flex flex-column">
                              <h5 className="fw-bold">Bill Details</h5>
                              <ul className="list-unstyled flex-grow-1">
                                <li><strong>Salesman:</strong> {customer.SalesmanName}</li>
                                <li><strong>BilledBy:</strong> {customer.CreatedByName}</li>
                                <li><strong>Mode:</strong> {customer.BillModeText}</li>
                                <li><strong>Type:</strong> {customer.WholeSaleRetail}</li>
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Items Table */}
                      <div className="card shadow-sm p-3 mt-4">
                        <h5 className="fw-bold">Items Summary</h5>
                        <div className="table-responsive mt-2">
                          <table className="table table-bordered text-center" style={{ fontSize: "10px", minWidth: "800px" }}>
                            <thead className="table-light">
                              <tr>
                                <th>No.</th>
                                <th>ItmName</th>
                                <th>MRP</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Tax%</th>
                                <th>TaxAmnt</th>
                                <th>Rate</th>
                                <th>Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Billdetails.length > 0 ? (
                                Billdetails.map((item, index) => (
                                  <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{item.ItemName}</td>
                                    <td>{formatAmount(item.MRP)}</td>
                                    <td>{item.Quantity}</td>
                                    <td>{item.UnitPrice}</td>
                                    <td>{formatAmount(item.TaxPercentage)}</td>
                                    <td>{formatAmount(item.TaxAmount)}</td>
                                    <td>{formatAmount(item.NetRate)}</td>
                                    <td>{formatAmount(item.Amount)}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="9" className="text-center">No details available</td>
                                </tr>
                              )}
                            </tbody>
                            <tfoot className="table-dark text-white">
                              <tr>
                                <th colSpan="6" className="text-end">Total:</th>
                                <th>{formatAmount(Billdetails.reduce((sum, item) => sum + item.TaxAmount, 0))}</th>
                                <th>{formatAmount(Billdetails.reduce((sum, item) => sum + item.NetRate, 0))}</th>
                                <th>{formatAmount(Billdetails.reduce((sum, item) => sum + item.Amount, 0))}</th>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                      </div>

                      {/* Notes Section */}
                      <div className="row g-3 mt-4">
                        <div className="col-md-4">
                          <div className="card shadow-sm p-3">
                            <h5 className="fw-bold">Notes</h5>
                            <p>Payment is requested within 15 days of receiving this invoice.</p>
                          </div>
                        </div>
                        {/* Check if Billdetails exists and has at least one item with a Narration */}
                        {Billdetails.length > 0 && Billdetails[0].Narration && (
                          <div className="col-md-4">
                            <div className="card shadow-sm p-3">
                              <h5 className="fw-bold">Narration</h5>
                              <p>{Billdetails[0].Narration}</p>
                            </div>
                          </div>
                        )}

                      </div>

                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="modal-footer bg-light">
                    {/* <button type="button" className="btn btn-primary" onClick={handlePrintpop}>
                      Print
                    </button> */}
                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}
        </Tab>

        <Tab eventKey="TripReceipt" title={`Receipt - ${filteredTripreceipt.length > 0 ? filteredTripreceipt[filteredTripreceipt.length - 1].SLNo || 0 : 0}`}>

          <div className="container mt-4">
            <h2 className="mb-4 text-center text-primary">Receipt Details</h2>

            {/* Search Bar and Export Buttons in Same Row */}
            <div className="d-flex align-items-center justify-content-between mb-3">
              {/* Search Bar */}
              <div className="col-lg-3">
                <div className="input-group">
                  <span className="input-group-text bg-primary text-white">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by Customer Name..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                  />
                </div>
              </div>

              {/* Export and Print Buttons */}
              <div className="d-flex gap-2">
                <div className="ms-auto d-flex gap-2">
                  <button className="btn btn-" onClick={() => handleCustomExportPDF(filteredTripreceipt, 'Trip Receipt Report', receipt, selectedDate)}>
                    <FaFilePdf />
                    <span className="d-none d-md-inline"> PDF</span>
                  </button>
                  <button className="btn btn-" onClick={() => handleCustomExportExcel(filteredTripreceipt, 'Trip Receipt Report', receipt, selectedDate)}>
                    <FaFileExcel />
                    <span className="d-none d-md-inline"> Excel</span>
                  </button>
                  <button className="btn btn-" onClick={() => handleCustomPrint(filteredTripreceipt, 'Trip Sale Receipt', receipt, selectedDate)}>
                    <FaPrint />
                    <span className="d-none d-md-inline"> Print</span>
                  </button>
                </div>
              </div>

            </div>
            {/* Data Table */}
            <DataTable
              columns={receipt}
              data={filteredTripreceipt}
              progressPending={loading}
              pagination
              paginationPerPage={500} // Default rows per page
              paginationRowsPerPageOptions={[500, 1000, 5000]} // Custom pagination options
              highlightOnHover
              pointerOnHover
              responsive
              striped

            />
          </div>
        </Tab>

        <Tab eventKey="TripReport"
          title={`Trip Report -${filteredTripreport.length > 0 ? filteredTripreport[filteredTripreport.length - 1].SlNo || 0 : 0}`}>

          <div className="container mt-4">
            <h2 className="mb-4 text-center text-primary">Trip Report</h2>

            {/* Search Bar and Export Buttons in Same Row */}
            <div className="d-flex align-items-center justify-content-between mb-3">
              {/* Search Bar */}
              <div className="col-lg-3">
                {/* <div className="input-group">
                  <span className="input-group-text bg-primary text-white">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by Kilometer..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                  />
                </div> */}
              </div>

              {/* Export and Print Buttons */}
              <div className="d-flex gap-2">
                <div className="ms-auto d-flex gap-2">

                  <button className="btn btn-" onClick={() => handleExportExcel(AllEmpTripReport)}>
                    <FaFileExcel />
                    <span className="d-none d-md-inline"> All in One</span>
                  </button>

                  <button className="btn btn-" onClick={() => handleCustomExportPDF(reportWithTotals, 'Trip Report', Report, selectedDate)}>
                    <FaFilePdf />
                    <span className="d-none d-md-inline"> PDF</span>
                  </button>
                  <button className="btn btn-" onClick={() => handleCustomExportExcel(reportWithTotals, 'Trip Report', Report, selectedDate)}>
                    <FaFileExcel />
                    <span className="d-none d-md-inline"> Excel</span>
                  </button>
                  <button className="btn btn-" onClick={() => handleCustomPrint(reportWithTotals, 'Trip Receipt', Report, selectedDate)}>
                    <FaPrint />
                    <span className="d-none d-md-inline"> Print</span>
                  </button>


                </div>
              </div>

            </div>

            {/* Data Table */}
            <DataTable
              columns={Report}
              data={reportWithTotals}
              progressPending={loading}
              pagination
              paginationPerPage={500}
              paginationRowsPerPageOptions={[500, 1000, 5000]}
              highlightOnHover
              pointerOnHover
              responsive
              striped
            />

          </div>

        </Tab>

      </Tabs>
    </div>
  );
};

export default EmpTrip;