import { useState, useEffect } from "react";
import SaleReport from "./SaleReport";
import ItemwiseSaleReport from "./ItemwiseSaleReport";
import ItemSalebycust from "./ItemSalebycust";
import AllHsnReport from "./AllHsnReport";
import HSNcodebySaleReport from "./HSNcodebySaleReport";
import HsnReturnReport from "./HsnReturnReport";
import ExportSales from "./ExportSales";
import BillingReturnreport from "../Inventory/BillingReturnreport";
import ItemBillReturnReport from "../Inventory/ItemBillReturnReport";

const Commonsalepage = () => {
  const [ActiveSaleTab, setActiveSaleTab] = useState("SaleReport");
  const userRoleId = sessionStorage.getItem("UserRoleId") || "";
  const allowedRoles = ["1", "3", "4"];

  useEffect(() => {
    const savedTab = sessionStorage.getItem("ActiveSaleTab");
    if (savedTab) {
      setActiveSaleTab(savedTab);
    }
  }, []);

  const handleTabChange = (tabName) => {
    sessionStorage.setItem("ActiveSaleTab", tabName);
    setActiveSaleTab(tabName);
  };

  const renderActiveSaleTab = () => {
    switch (ActiveSaleTab) {
      case "SaleReport":
        return <SaleReport />;
      case "ItemwiseSaleReport":
        return allowedRoles.includes(userRoleId) ? <ItemwiseSaleReport /> : null;
      case "Itemsalecust":
        return allowedRoles.includes(userRoleId) ? <ItemSalebycust /> : null;
      case "HSNreport":
        return allowedRoles.includes(userRoleId) ? <AllHsnReport /> : null;
      case "HSNcodebySaleReport":
        return allowedRoles.includes(userRoleId) ? <HSNcodebySaleReport /> : null;
      case "HsnReturnReport":
        return allowedRoles.includes(userRoleId) ? <HsnReturnReport /> : null;
      case "ExportSales":
        return allowedRoles.includes(userRoleId) ? <ExportSales /> : null;
      case "BillingReturnreport":
        return allowedRoles.includes(userRoleId) ?<BillingReturnreport />: null;
        case "ItemBillReturnReport":
       return allowedRoles.includes(userRoleId) ? <ItemBillReturnReport />:null;
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
      >
        <li className="nav-item me-3">
          <a
            href="#"
            onClick={() => handleTabChange("SaleReport")}
            className={ActiveSaleTab === "SaleReport" ? "nav-link active" : "nav-link"}
          >
            Sale Report
          </a>
        </li>

        {allowedRoles.includes(userRoleId) && (
          <>
            <li className="nav-item me-3">
              <a
                href="#"
                onClick={() => handleTabChange("ItemwiseSaleReport")}
                className={ActiveSaleTab === "ItemwiseSaleReport" ? "nav-link active" : "nav-link"}
              >
                Itemwise Sale Analysis
              </a>
            </li>

            <li className="nav-item me-3">
              <a
                href="#"
                onClick={() => handleTabChange("Itemsalecust")}
                className={ActiveSaleTab === "Itemsalecust" ? "nav-link active" : "nav-link"}
              >
                Item Sale Customer
              </a>
            </li>

            <li className="nav-item me-3">
              <a
                href="#"
                onClick={() => handleTabChange("HSNreport")}
                className={ActiveSaleTab === "HSNreport" ? "nav-link active" : "nav-link"}
              >
                Sale Tax Report
              </a>
            </li>

            <li className="nav-item me-3">
              <a
                href="#"
                onClick={() => handleTabChange("HSNcodebySaleReport")}
                className={ActiveSaleTab === "HSNcodebySaleReport" ? "nav-link active" : "nav-link"}
              >
                HSNcode by sale
              </a>
            </li>

            <li className="nav-item me-3">
              <a
                href="#"
                onClick={() => handleTabChange("HsnReturnReport")}
                className={ActiveSaleTab === "HsnReturnReport" ? "nav-link active" : "nav-link"}
              >
                HSNcode by Return sale
              </a>
            </li>

            <li className="nav-item me-3">
              <a
                href="#"
                onClick={() => handleTabChange("ExportSales")}
                className={ActiveSaleTab === "ExportSales" ? "nav-link active" : "nav-link"}
              >
                Export Sales
              </a>
            </li>

         <li className="nav-item">
          <a
            href="#"
            onClick={() => handleTabChange("BillingReturnreport")}
            className={ActiveSaleTab === "BillingReturnreport" ? "nav-link active" : "nav-link"}
          >
           Sale Return Report           </a>
        </li>
        <li className="nav-item">
          <a
            href="#"
            onClick={() => handleTabChange("ItemBillReturnReport")}
            className={ActiveSaleTab === "ItemBillReturnReport" ? "nav-link active" : "nav-link"}
          >
           Item sale Return Report           </a>
        </li>
          </>
        )}
      </ul>

      <div className="tab-content mt-4">{renderActiveSaleTab()}</div>
    </div>
  );
};

export default Commonsalepage;
