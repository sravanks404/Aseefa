const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

// --------------------------------------------Import Route-------------------------------------------------

//Login
const LoginRoute = require("./routes/Login/Login");
const NavbarRoute = require("./routes/Login/Navbar");
const Counts = require("./routes/Login/DashBoard/Counts");
const Graph = require("./routes/Login/DashBoard/Graph");
const LastDaysDash = require("./routes/Login/DashBoard/LastDaysDash");
const Location = require("./routes/Login/DashBoard/Location");
const OneDayDash = require("./routes/Login/DashBoard/OneDayDash");
const TaskManager = require("./routes/Login/DashOut/TaskManager");
const webEmpMessage = require("./routes/Login/DashOut/webEmpMessage");
const SaleSummary = require("./routes/Login/DashBoard/SaleSummary");
//Customer
const CustomerRoute = require("./routes/Login/Customer");
const getCustomerDetails = require("./routes/Login/Customer");
const getRouteName = require("./routes/Login/Customer");
const insertClient = require("./routes/clientRoute/client");
const getClientDetails = require("./routes/clientRoute/client");
const getJobRole = require("./routes/clientRoute/getJobRoleRoute");

//supplier
const insertSupplier = require("./routes/supplierRoute/supplier");

//Operations
const CompanyInfo = require("./routes/Operations/MasterControl/CompanyInfo");
const UserInfo = require("./routes/Operations/MasterControl/UserInfo");
const BranchMaster = require("./routes/Operations/MasterControl/BranchMaster");
const ZoneMaster = require("./routes/Operations/MasterControl/ZoneMaster");
const macid = require("./routes/Operations/MasterControl/macid");

const Account = require("./routes/Operations/MasterPages/Account");
const EmpRouteallocation = require("./routes/Operations/MasterPages/EmpRouteallocation");
const InvoiceSeries = require("./routes/Operations/MasterPages/InvoiceSeries");
const ItemCreation = require("./routes/Operations/MasterPages/ItemCreation");
const RouteMaster = require("./routes/Operations/MasterPages/RouteMaster");
const SeriesAllocation = require("./routes/Operations/MasterPages/SeriesAllocation");

const JobCard = require("./routes/Operations/MasterPages/JobCard");
const Receipt = require("./routes/Operations/Transacations/Receipt");
const Enquiry = require("./routes/Operations/MasterPages/Enquiry");
const vehicleMasterpage = require("./routes/Operations/MasterPages/vehiclemaster");
const Production = require("./routes/Operations/Inventory/Production");
const Dispatch = require("./routes/Operations/Inventory/Dispatch");

//Reports

const EmpTrip = require("./routes/Reports/EmpTrip/EmpTrip");
const EmpTrip2 = require("./routes/Reports/EmpTrip/EmpTrip2");
const unitMaster = require('./routes/Operations/MasterControl/unitMaster')
const Itemdiscount = require("./routes/Reports/Reports/Itemdiscount");
const Ledger = require("./routes/Reports/Reports/Ledger");
const Purchase = require("./routes/Reports/Reports/Purchase");
const SaleReport = require("./routes/Reports/Reports/SaleReport");
const vanload = require("./routes/Reports/Reports/vanload");
const AccountReports = require("./routes/Reports/Reports/AccountReports");
const property = require("./routes/Operations/PropertyManagement/propertyInformation");

//----------------------------------------------------- Middleware-----------------------------------------------
const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "microtech",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  }),
);

// Serve static files from the React app--- FOR HOST------------------------------------------------------

app.use(express.static(path.join(__dirname, "build")));

// Error handling middleware FOR LOCALHOST------------------------------------------------------------------

// app.use((err, req, res, next) => {
//   console.error('Error:', err.message);
//   console.error('Stack:', err.stack);
//   res.status(500).send('Something broke!');
// });

//-----------------------------------------------------------Route----------------------------------------------

//Login
app.use("/api", LoginRoute);
app.use("/api", NavbarRoute);

app.use("/api", Counts);
app.use("/api", Graph);
app.use("/api", LastDaysDash);
app.use("/api", Location);
app.use("/api", OneDayDash);
app.use("/api", TaskManager);
app.use("/api", webEmpMessage);
app.use("/api", SaleSummary);

//Customer
app.use("/api", CustomerRoute);
app.use("/api", getRouteName);
app.use("/api", getCustomerDetails);
app.use("/api", insertClient);
app.use("/api", getClientDetails);
app.use("/api", getJobRole);
//supplier
app.use("/api", insertSupplier);

//Operations

app.use("/api", CompanyInfo);
app.use("/api", UserInfo);
app.use("/api", BranchMaster);
app.use("/api", ZoneMaster);
app.use("/api", macid);

app.use("/api", property);

app.use("/api", Account);
app.use("/api", EmpRouteallocation);
app.use("/api", InvoiceSeries);
app.use("/api", ItemCreation);
app.use("/api", Receipt);
app.use("/api", RouteMaster);
app.use("/api", SeriesAllocation);
app.use("/api", vehicleMasterpage);
app.use("/api", JobCard);
app.use("/api", Enquiry);
app.use("/api", Production);

app.use("/api", Dispatch);

//Reports
app.use('/api',unitMaster);
app.use("/api", EmpTrip);
app.use("/api", EmpTrip2);

app.use("/api", Itemdiscount);
app.use("/api", Ledger);
app.use("/api", Purchase);
app.use("/api", SaleReport);
app.use("/api", vanload);
app.use("/api", AccountReports);

// Handle all other routes by serving index.html For HOST ----------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API Working",
  });
});
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "build", "index.html"));
// });

// ---------------------------------------------------Start the server--------------------------------------------
const PORT = process.env.PORT || 1201;
const HOST = process.env.HOST || "localhost";
app.listen(PORT, HOST, () =>
  console.log(`Server running on http://${HOST}:${PORT}`),
);

module.exports = app;
