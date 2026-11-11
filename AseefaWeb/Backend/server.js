const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();


// --------------------------------------------Import Route-------------------------------------------------

//Login
const LoginRoute = require('./routes/Login/Login');
const NavbarRoute = require('./routes/Login/Navbar');   
const Counts = require('./routes/Login/DashBoard/Counts');
const Graph = require('./routes/Login/DashBoard/Graph');
const LastDaysDash = require('./routes/Login/DashBoard/LastDaysDash');
const Location = require('./routes/Login/DashBoard/Location');
const OneDayDash = require('./routes/Login/DashBoard/OneDayDash');
// const TaskManager = require('./routes/Login/DashOut/TaskManager');
// const webEmpMessage = require('./routes/Login/DashOut/webEmpMessage');


//Operations
const CompanyInfo = require('./routes/Operations/MasterControl/CompanyInfo');
const UserInfo = require('./routes/Operations/MasterControl/UserInfo');
const BranchMaster = require('./routes/Operations/MasterControl/BranchMaster');
const ZoneMaster = require('./routes/Operations/MasterControl/ZoneMaster');
const macid = require('./routes/Operations/MasterControl/macid');
const userPermission = require('./routes/Operations/UserPermission/userPermission')

const Account = require('./routes/Operations/MasterPages/Account');
const EmpRouteallocation = require('./routes/Operations/MasterPages/EmpRouteallocation');
const InvoiceSeries = require('./routes/Operations/MasterPages/InvoiceSeries');
const ItemCreation = require('./routes/Operations/MasterPages/ItemCreation');
const RouteMaster = require('./routes/Operations/MasterPages/RouteMaster');
const SeriesAllocation = require('./routes/Operations/MasterPages/SeriesAllocation');

const propertyManagement  = require('./routes/Operations/PropertyManagement/propertyInformation')

const JobCard = require('./routes/Operations/MasterPages/JobCard');
// const Receipt = require('./routes/Operations/Transacations/Receipt');
const Enquiry = require('./routes/Operations/MasterPages/Enquiry');    
const UnitMaster=require('./routes/Operations/MasterPages/UnitMaster');
// const UnitMasterTest=require('./routes/Operations/MasterPages/UnitMasterTest');
// const TaxMaster=require('./routes/Operations/MasterPages/TaxMaster');
// const BatchMaster=require('./routes/Operations/MasterPages/BatchMaster');
// const CategoryMaster=require('./routes/Operations/MasterPages/CategoryMaster');
// accountmaster
// const AccountMasterTest = require('./routes/Operations/MasterPages/accountMasterTest')
//  const InvoiceMaster=require('./routes/Operations/MasterPages/InvoiceMaster');

const employeeallocation=require('./routes/Operations/MasterPages/employeeallocation');
const Production = require('./routes/Operations/Inventory/Production');
const Dispatch = require('./routes/Operations/Inventory/Dispatch');
const vehicleMasterpage = require('./routes/Operations/MasterPages/vehicleMaster'); 
const RootMasterpage = require('./routes/Operations/MasterPages/RootMaster');
const BeatAllocatepage = require('./routes/Operations/MasterPages/BeatAllocate');
// const Supplierpage = require('./routes/Operations/MasterPages/Supplier');
// const AttendanceDashboardpage = require('./routes/Operations/MasterPages/AttendanceDashboard');
const Customerpage = require('./routes/Operations/MasterPages/Customer');    
const Camppage = require('./routes/Operations/MasterPages/Camp');
const ProjectCostpage = require('./routes/Operations/MasterPages/ProjectCost');


//Reports

const EmpTrip = require('./routes/Reports/EmpTrip/EmpTrip');
const EmpTrip2 = require('./routes/Reports/EmpTrip/EmpTrip2');
const expiryDoc = require('./routes/Reports/ExpiryDoc/ExpiryDoc')
const Itemdiscount = require('./routes/Reports/Reports/Itemdiscount');
// const Ledger = require('./routes/Reports/Reports/Ledger');
const Purchase = require('./routes/Reports/Reports/Purchase');
const SaleReport = require('./routes/Reports/Reports/SaleReport');
const vanload = require('./routes/Reports/Reports/vanload');
const AccountReports = require('./routes/Reports/Reports/AccountReports');
const SendAttendanceEmailRoute = require('./routes/Operations/MasterPages/SendAttendanceEmail');
const SubmitProjectEstimationRoute = require('./routes/Operations/MasterPages/SubmitProjectEstimation ');
// const TaskManagement = require('./routes/Operations/MasterPages/TaskManagement');
const propertyreport = require('./routes/Reports/Reports/propertyreport');
 

//----------------------------------------------------- Middleware-----------------------------------------------
const app = express();


app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'microtech',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Serve static files from the React app--- FOR HOST------------------------------------------------------

app.use(express.static(path.join(__dirname, 'build')));

// Serve uploaded files (suppliers, customers, projects)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/propertyuploads', express.static(path.join(__dirname, 'propertyuploads')));

// Error handling middleware FOR LOCALHOST------------------------------------------------------------------

// app.use((err, req, res, next) => {
//   console.error('Error:', err.message);
//   console.error('Stack:', err.stack);
//   res.status(500).send('Something broke!');
// });

//-----------------------------------------------------------Route----------------------------------------------

//Login
app.use('/api', LoginRoute);
app.use('/api', NavbarRoute);

app.use('/api', Counts);
app.use('/api', Graph);
app.use('/api', LastDaysDash);
app.use('/api', Location);
app.use('/api', OneDayDash);
// app.use('/api', TaskManager);
// app.use('/api', webEmpMessage);

//Operations

app.use('/api', CompanyInfo);
app.use('/api', UserInfo);
app.use('/api', BranchMaster);
app.use('/api', ZoneMaster);
app.use('/api', macid);
app.use('/api', userPermission);
app.use('/api', propertyManagement);


app.use('/api', Account);
app.use('/api', EmpRouteallocation);
app.use('/api', InvoiceSeries)
app.use('/api', ItemCreation);
// app.use('/api', Receipt);
app.use('/api', RouteMaster);
app.use('/api', SeriesAllocation);
app.use('/api', JobCard);
app.use('/api', Enquiry);
app.use('/api', Production);
app.use('/api',UnitMaster);
// app.use('/api',UnitMasterTest);
// app.use('/api',TaxMaster);
// app.use('/api',BatchMaster);
// app.use('/api',CategoryMaster);

// account master
// app.use('/api',AccountMasterTest);
// app.use('/api',InvoiceMaster);
app.use('/api',employeeallocation);
app.use('/api', Dispatch);
app.use('/api', vehicleMasterpage);
app.use('/api', RootMasterpage);
app.use('/api', BeatAllocatepage);
// app.use('/api',Supplierpage);
// app.use('/api', AttendanceDashboardpage);
app.use('/api',Customerpage);
app.use('/api',Camppage);
app.use('/api',ProjectCostpage);



//Reports

app.use('/api', EmpTrip);
app.use('/api', EmpTrip2);
app.use('/api',expiryDoc)
app.use('/api', Itemdiscount);
// app.use('/api', Ledger);
app.use('/api', Purchase);
app.use('/api', SaleReport);
app.use('/api', vanload);  
app.use('/api', AccountReports);
app.use('/api', SendAttendanceEmailRoute);
app.use('/api', SubmitProjectEstimationRoute);
// app.use('/api', TaskManagement);
app.use('/api',propertyreport);

// Handle all other routes by serving index.html For HOST ----------------------------------------------------

app.get('*', (req, res) => {
    // Go up from Backend (..), into Frontend, then into dist
res.sendFile(path.join(__dirname, '..', 'Frontend', 'dist', 'index.html'));   
});

// ---------------------------------------------------Start the server-------------------------------------------- 
const PORT = process.env.PORT || 1201;
const HOST = process.env.HOST || 'localhost';
// const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => console.log(`Server running on http://${HOST}:${PORT}`));

module.exports = app;