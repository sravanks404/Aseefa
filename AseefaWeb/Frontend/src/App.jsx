//App.jsx
import { Route, Routes } from "react-router";

import Landingpage from "../pages/Login/Landingpage";
import Login from "../pages/Login/Login";
import Loginprotectroute from "../components/Loginprotectroute";
import Protectorroute from "../components/Protectorroute";
import Versionlog from "../pages/Login/Versionlog";

import Dashuserpage from "../PageRouter/Login/Dashuserpage";   
import Resetpasswordpage from "../PageRouter/Login/Resetpasswordpage";
import Versionlogpage from "../PageRouter/Login/Versionlogpage";

import EmpMessagepage from "../PageRouter/Login/Dashboardout/EmpMessagepage";
import Liveusermappage from "../PageRouter/Login/Dashboardout/Liveusermappage";
import TaskManagerpage from "../PageRouter/Login/Dashboardout/TaskManagerpage";

// Operations  

import CompanyInfopage from "../PageRouter/Operations/MasterControl/CompanyInfopage";
import Userinfopage from "../PageRouter/Operations/MasterControl/Userinfopage";
import TabUserMasterpage from "../PageRouter/Operations/MasterControl/TabUserMasterpage";
import BranchMasterpage from "../PageRouter/Operations/MasterControl/BranchMasterpage";
import PropertyManagement from "../PageRouter/Operations/PropertyManagement/PropertyManagement_Page";


import Accountpage from "../PageRouter/Operations/MasterPages/Accountpage";
import TabImportpage from "../PageRouter/Operations/MasterPages/TabImportpage";
import TabSeriespage from "../PageRouter/Operations/MasterPages/TabSeriespage";
import TabBeatMasterpage from "../PageRouter/Operations/MasterPages/TabBeatMasterpage";
import BeatAllocatepage from "../PageRouter/Operations/MasterPages/BeatAllocatepage";
import ItemCreationpage from "../PageRouter/Operations/MasterPages/ItemCreationpage";
import ItemRateDiscountpage from "../PageRouter/Operations/MasterPages/ItemRateDiscountpage";
import Supplierpage from "../PageRouter/Operations/MasterPages/Supplierpage"; 
import AttendanceDashboardpage from "../PageRouter/Operations/MasterPages/AttendanceDashboardpage"; 
import TaskManagementpage from "../PageRouter/Operations/MasterPages/TaskManagementpage"; 
import Customerpage from "../PageRouter/Operations/MasterPages/Customerpage"; 
import RootMasterpage from "../PageRouter/Operations/MasterPages/RootMasterpage";   
import VehicleMasterpage from "../PageRouter/Operations/MasterPages/VehicleMasterpage";
import VehicleTypeMasterpage from "../PageRouter/Operations/MasterPages/VehicleTypeMasterpage";
import VehicleExpenseTypeMasterpage from "../PageRouter/Operations/MasterPages/VehicleExpenseTypeMasterpage";
import UnitMasterpage from "../PageRouter/Operations/MasterPages/UnitMasterpage";
import TaxMasterpage from "../PageRouter/Operations/MasterPages/TaxMasterpage";
import BatchMasterpage from "../PageRouter/Operations/MasterPages/BatchMasterpage";
import CategoryMasterpage from "../PageRouter/Operations/MasterPages/CategoryMasterpage";
import EmployeeAllocationpage from "../PageRouter/Operations/MasterPages/EmployeeAllocationpage";
import InvoiceMasterpage from "../PageRouter/Operations/MasterPages/InvoiceMasterpage";
   
import Recieptpage from "../PageRouter/Operations/Transactions/Recieptpage";
import JobCardPage from "../PageRouter/Operations/MasterPages/JobCardPage";
import LeadEnquriypage from "../PageRouter/Operations/MasterPages/LeadEnquriypage";
import Ingredientpage from "../PageRouter/Operations/Inventory/ingredientpage";
import QualityCheckpage from "../PageRouter/Operations/Inventory/QualityCheckpage";
import ProductionCrudpage from "../PageRouter/Operations/Inventory/ProductionCrudpage";
import Byproductspage from "../PageRouter/Operations/Inventory/Byproductspage";
import Importbillpage from "../PageRouter/Operations/MasterPages/importbillpage";

 
//Reports

import JournalReportpage from "../PageRouter/Reports/Accounts Transactions/JournalReportpage";
import PaymentReportpage from "../PageRouter/Reports/Accounts Transactions/PaymentReportpage";
import TabEmpTrippage from "../PageRouter/Reports/EmployeeTrip/TabEmpTrippage";
import EmpViewpage from "../PageRouter/Reports/EmployeeTrip/EmpViewpage";
import BankReportpage from "../PageRouter/Reports/Accounts Transactions/BankReportpage";
import AllPartyLedgerpage from "../PageRouter/Reports/Finance & Accounts/AllPartyLedgerpage";
import CreditorsReportpage from "../PageRouter/Reports/Finance & Accounts/CreditorsReportpage";
import CustomerLedgerpage from "../PageRouter/Reports/Finance & Accounts/CustomerLedgerpage";
import DebitorsReportpage from "../PageRouter/Reports/Finance & Accounts/DebitorsReportpage";
import LedgerAllpage from "../PageRouter/Reports/Finance & Accounts/LedgerAllpage";
import LedgerTranspage from "../PageRouter/Reports/Finance & Accounts/LedgerTranspage";
import PandLReportpage from "../PageRouter/Reports/Finance & Accounts/PandLReportpage";
import ProfitReportpage from "../PageRouter/Reports/Finance & Accounts/ProfitReportpage";
import TrailBalancepage from "../PageRouter/Reports/Finance & Accounts/TrailBalancepage";

import Balancestockpage from "../PageRouter/Reports/Inventory/Balancestockpage";
import DamageReportpage from "../PageRouter/Reports/Inventory/DamageReportpage";
import OpeningStockReportpage from "../PageRouter/Reports/Inventory/OpeningStockReportpage";
import Productionpage from "../PageRouter/Reports/Inventory/Productionpage";
import Ratediscountpage from "../PageRouter/Reports/Inventory/Ratediscount";
import StockReportpage from "../PageRouter/Reports/Inventory/StockReportpage";
import TabPurchasepage from "../PageRouter/Reports/Inventory/TabPurchasepage";
import TabVanloadpage from "../PageRouter/Reports/Inventory/TabVanloadpage";
import TabProduction from "../PageRouter/Reports/Inventory/TabProduction";


import CustomerDetailsReportpage from "../PageRouter/Reports/Masters/CustomerDetailsReportpage";
import OrderReportpage from "../PageRouter/Reports/Sales & Distribution/OrderReportpage";
import ReceiptReportpage from "../PageRouter/Reports/Sales & Distribution/ReceiptReportpage";
import Tabsalepage from "../PageRouter/Reports/Sales & Distribution/TabsaleReportpage";
import VanSaleSummarypage from "../PageRouter/Reports/Sales & Distribution/VanSaleSummarypage";
import QcPage from "../PageRouter/Operations/MasterPages/QcPage";
import ProductionEntry from "../PageRouter/Operations/Inventory/ProductionEntry";
import Creditnotepage from "../PageRouter/Reports/Inventory/Creditnotepage";
import DebitnoteReportpage from "../PageRouter/Reports/Inventory/DebitnoteReportpage";
import OpeningVoucherReportpage from "../PageRouter/Reports/Inventory/OpeningVoucherReportpage";
import ContraReportpage from "../PageRouter/Reports/Inventory/ContraReportpage";
import StockValueReport from "../PageRouter/Reports/Inventory/StockvalueReportpage";
import Dailysummarypage from "../PageRouter/Operations/Inventory/Dailysummarypage";
import UnitMasterTest from "../pages/Operations/MasterPages/UnitMasterTest";
import AccountMasterPage from "../PageRouter/Operations/MasterPages/AccountMasterPage";
import Camppage from "../PageRouter/Operations/MasterPages/Camppage";
import ProjectCostpage from "../PageRouter/Operations/MasterPages/ProjectCostpage";
import UserPermissionpage from "../PageRouter/Operations/UserPermission/Userpermission";
import ExpiryDocumentspage from "../PageRouter/Reports/ExpiryDocuments/ExpiryDocPage";
const App = () => {
  return (
    <div>
      <Routes>
        <Route element={<Loginprotectroute />}>
          <Route path="/" element={<Login />} />
          <Route path="/Versionlog" element={<Versionlog />} />

        </Route>

        <Route element={<Protectorroute />}>
          <Route path="/dashboard" element={<Landingpage />} />
          <Route path="/dashEmp" element={<Dashuserpage />} />
          <Route path="/Resetpassword" element={<Resetpasswordpage />} />
          <Route path="/versionlogpage" element={<Versionlogpage />} />

          <Route path="/EmpMessage" element={<EmpMessagepage />} />
          <Route path="/Liveusermap" element={<Liveusermappage />} />
          <Route path="/TaskManager" element={<TaskManagerpage />} />

          {/* Operations */}
          <Route path="/CompanyInfo" element={<CompanyInfopage />} />
          <Route path="/Userinfo" element={<Userinfopage />} />
          <Route path="/TabUserMaster" element={<TabUserMasterpage />} />
          <Route path="/PropertyManagement" element={<PropertyManagement/>} />

          <Route path="/Account" element={<Accountpage />} />
          <Route path="/TabImport" element={<TabImportpage />} />
          <Route path="/TabSeries" element={<TabSeriespage />} />
          <Route path="/TabBeatMaster" element={<TabBeatMasterpage />} />
          <Route path="/BeatAllocate" element={<BeatAllocatepage />} />
          <Route path="/ItemCreation" element={<ItemCreationpage />} />
          <Route path="/ItemRateDiscount" element={<ItemRateDiscountpage />} />
          <Route path="/Supplier" element={<Supplierpage />} />
          <Route path="/AttendanceDashboard" element={<AttendanceDashboardpage />} />
          <Route path="/TaskManagement" element={<TaskManagementpage />} />
          <Route path="/Customer" element={<Customerpage />} />
          <Route path="/BranchMasterpage" element={<BranchMasterpage/>} />
          <Route path="/RootMaster" element={<RootMasterpage />} />
          <Route path="/VehicleMaster" element={<VehicleMasterpage />} />
          <Route path="/VehicleTypeMaster" element={<VehicleTypeMasterpage />} />
          <Route path="/VehicleExpenseTypeMaster" element={<VehicleExpenseTypeMasterpage />} />
           <Route path="/UnitMaster" element={<UnitMasterpage />} />
           <Route path="/UnitMasterTest" element={<UnitMasterTest/>} />
           <Route path="/TaxMaster" element={<TaxMasterpage />} />
           <Route path="/BatchMaster" element={<BatchMasterpage/>} />
           <Route path="/CategoryMaster" element={<CategoryMasterpage/>} />
           <Route path="/AccountMaster" element={<AccountMasterPage/>} />
            <Route path="/EmployeeAllocation" element={<EmployeeAllocationpage/>}/>
             <Route path="/InvoiceMaster" element={<InvoiceMasterpage/>} />
          <Route path="/Recieptpage" element={<Recieptpage />} />
          <Route path="/ProductionAlloc" element={<JobCardPage />} />
          <Route path="/LeadEnquriypage" element={<LeadEnquriypage />} />
          <Route path="/QcMasterpage" element={<QcPage />} />
          <Route path="/ingredientpage" element={<Ingredientpage />} />
          <Route path="/QualityCheck" element={<QualityCheckpage />} />
          <Route path="/ProductionCrud" element={<ProductionCrudpage />} />
          <Route path="/Importbill" element={<Importbillpage />} />

          <Route path="/Camp" element={<Camppage />} />
          <Route path="/ProjectCost" element={<ProjectCostpage />} />
          <Route path="/UserPermission" element={<UserPermissionpage />} />

          {/* Reports */}

          <Route path="/JournalReport" element={<JournalReportpage />} />
          <Route path="/PaymentReport" element={<PaymentReportpage />} />
          <Route path="/BankReport" element={<BankReportpage/>}/>
          <Route path="/TabEmpTrip" element={<TabEmpTrippage />} />
          <Route path="/EmpView" element={<EmpViewpage />} />

          <Route path="/AllPartyLedger" element={<AllPartyLedgerpage />} />
          <Route path="/CreditorsReport" element={<CreditorsReportpage />} /> 
          <Route path="/CustomerLedger" element={<CustomerLedgerpage />} />
          <Route path="/DebitorsReport" element={<DebitorsReportpage />} />
          <Route path="/LedgerAll" element={<LedgerAllpage />} />
          <Route path="/LedgerTrans" element={<LedgerTranspage />} />
          <Route path="/PandLReport" element={<PandLReportpage />} />
          <Route path="/ProfitReport" element={<ProfitReportpage />} />
          <Route path="/trailbalance" element={<TrailBalancepage />} />
            <Route path="/DocumentExpiry" element={<ExpiryDocumentspage/>} />
          <Route path="/balancestock" element={<Balancestockpage />} />
          <Route path="/DamageReport" element={<DamageReportpage />} />
          <Route path="/OpeningStockReport" element={<OpeningStockReportpage />} />
          <Route path="/TabProduction" element={<TabProduction />} />
          <Route path="/Ratediscount" element={<Ratediscountpage />} />
          <Route path="/StockReport" element={<StockReportpage />} />
          <Route path="/TabPurchase" element={<TabPurchasepage />} />
          <Route path="/TabVanload" element={<TabVanloadpage />} />
          <Route path="/StockValue" element={<StockValueReport />} />


          <Route path="/CustomerDetailsReport" element={<CustomerDetailsReportpage />} />

          <Route path="/Byproductspage" element={<Byproductspage />} />
          <Route path="/OrderReport" element={<OrderReportpage />} />
          <Route path="/ReceiptReport" element={<ReceiptReportpage />} />
          <Route path="/Tabsale" element={<Tabsalepage />} />
          <Route path="/VanSaleSummary" element={<VanSaleSummarypage />} />

          <Route path="/TaskManager" element={<TaskManagerpage />} />
          <Route path="/EmpMessage" element={<EmpMessagepage />} />
          <Route path="/ProductionEntry" element={<ProductionEntry />} />
          <Route path="/Creditnotepage" element={<Creditnotepage />} />
          <Route path="/DebitnoteReportpage" element={<DebitnoteReportpage />} />
          <Route path="/OpeningVoucherReportpage" element={<OpeningVoucherReportpage/>} />
          <Route path="/ContraReportpage" element={<ContraReportpage/>} />
          <Route path="/Dailysummarypage" element={<Dailysummarypage/>} />
         
        </Route>
      </Routes>
    </div>
  );
};

export default App;
