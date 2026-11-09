import { useState, useEffect } from "react";
import PurchaseReport from "./PurchaseReport";
import SupplierWiseReport from "./SupplierWiseReport";
import ItemWisePurchase from "./ItemWisePurchase";
import PurchaseReturnReport from "./PurchaseReturnReport";


import CreditNoteReport from "./CreditNoteReport";
import DebitnoteReport from "./DebitnoteReport";
import OpeningVoucherReport from "./OpeningVoucherReport";
import ContraReport from "./ContraReport";
import ItemPurchaseReturnReport from "./ItemPurchaseReturnReport";
import ItemBillReturnReport from "./ItemBillReturnReport";
const Commonpage = () => {
  const [ActivePurchaseTab, setActivePurchaseTab] = useState("PurchaseReport");

  useEffect(() => {
    const savedTab = sessionStorage.getItem("ActivePurchaseTab");
    if (savedTab) {
      setActivePurchaseTab(savedTab);
    }
  }, []);

  const handleTabChange = (tabName) => {
    sessionStorage.setItem("ActivePurchaseTab", tabName);
    setActivePurchaseTab(tabName);
  };

  const renderActivePurchaseTab = () => {
    switch (ActivePurchaseTab) {
      case "PurchaseReport":
        return <PurchaseReport />;
      case "SupplierWiseReport":
        return <SupplierWiseReport onVehicleClick={handleTabChange} />;
      case "ItemWisePurchase":
        return <ItemWisePurchase />;
         case "PurchaseReturnReport":
        return <PurchaseReturnReport />;
      // case "BillingReturnreport":
      //   return <BillingReturnreport />;
        // case "CreditNoteReport":
        // return <CreditNoteReport />;
        // case "DebitnoteReport":
        // return <DebitnoteReport />;
        // case "OpeningVoucherReport":
        // return <OpeningVoucherReport />;
        // case "ContraReport":
        // return <ContraReport />;
        case "ItemPurchaseReturnReport":
        return <ItemPurchaseReturnReport />;
        // case "ItemBillReturnReport":
        // return <ItemBillReturnReport />;
      default:
        return null;
    }
  };

  return (
    <div className="common-page" style={{ backgroundColor: "white", padding: "20px" }}>
      <ul
        className="nav ms-5 nav-tabs flex-nowrap"
        style={{
          overflowX: "auto",
          whiteSpace: "nowrap",
          display: "flex",
          flexWrap: "nowrap",
          WebkitOverflowScrolling: "touch"
        }}
      >        <li className="nav-item me-3">
          <a
            href="#"
            onClick={() => handleTabChange("PurchaseReport")}
            className={ActivePurchaseTab === "PurchaseReport" ? "nav-link active" : "nav-link"}
          >
            Purchase Report
          </a>
        </li>
        <li className="nav-item me-3">
          <a
            href="#"
            onClick={() => handleTabChange("SupplierWiseReport")}
            className={ActivePurchaseTab === "SupplierWiseReport" ? "nav-link active" : "nav-link"}
          >
            SupplierWise Report
          </a>
        </li>
        <li className="nav-item">
          <a
            href="#"
            onClick={() => handleTabChange("ItemWisePurchase")}
            className={ActivePurchaseTab === "ItemWisePurchase" ? "nav-link active" : "nav-link"}
          >
            ItemWise Purchase
          </a>
        </li>

         <li className="nav-item">
          <a
            href="#"
            onClick={() => handleTabChange("PurchaseReturnReport")}
            className={ActivePurchaseTab === "PurchaseReturnReport" ? "nav-link active" : "nav-link"}
          >
           PurchaseReturn Report
          </a>
        </li>
      
        {/* <li className="nav-item">
          <a
            href="#"
            onClick={() => handleTabChange("CreditNoteReport")}
            className={ActivePurchaseTab === "CreditNoteReport" ? "nav-link active" : "nav-link"}
          >
           Credit Note Report           </a>
        </li> */}
         {/* <li className="nav-item">
          <a
            href="#"
            onClick={() => handleTabChange("DebitnoteReport")}
            className={ActivePurchaseTab === "DebitnoteReport" ? "nav-link active" : "nav-link"}
          >
           Debit Note Report           </a>
        </li> */}
        {/* <li className="nav-item">
          <a
            href="#"
            onClick={() => handleTabChange("OpeningVoucherReport")}
            className={ActivePurchaseTab === "OpeningVoucherReport" ? "nav-link active" : "nav-link"}
          >
           Opening Voucher Report           </a>
        </li> */}
        {/* <li className="nav-item">
          <a
            href="#"
            onClick={() => handleTabChange("ContraReport")}
            className={ActivePurchaseTab === "ContraReport" ? "nav-link active" : "nav-link"}
          >
           Contra Report           </a>
        </li> */}
        <li className="nav-item">
          <a
            href="#"
            onClick={() => handleTabChange("ItemPurchaseReturnReport")}
            className={ActivePurchaseTab === "ItemPurchaseReturnReport" ? "nav-link active" : "nav-link"}
          >
           Item Purchase Return Report           </a>
        </li>
        {/* <li className="nav-item">
          <a
            href="#"
            onClick={() => handleTabChange("ItemBillReturnReport")}
            className={ActivePurchaseTab === "ItemBillReturnReport" ? "nav-link active" : "nav-link"}
          >
           Item Bill Return Report           </a>
        </li> */}
      </ul>

      <div className="tab-content mt-4">{renderActivePurchaseTab()}</div>
    </div>
  );
};


export default Commonpage;
