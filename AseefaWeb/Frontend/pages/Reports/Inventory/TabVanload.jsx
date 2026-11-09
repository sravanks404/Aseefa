import { useState, useEffect } from "react";
import VanloadReport from "./VanloadReport";
import VanloadAnalysis from "./VanloadAnalysis";
import VanloadingReportdatewise from "./VanloadDatewise";
import StockTransfer from "./StockTransfer";
const Commonpage = () => {
  const [activeTab, setActiveTab] = useState("VanloadAnalysis");

  useEffect(() => {
    const savedTab = sessionStorage.getItem("ActiveTab");
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, []);

  const handleTabChange = (tabName) => {
    sessionStorage.setItem("ActiveTab", tabName);
    setActiveTab(tabName);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "VanloadReport":
        return <VanloadReport />;
      case "VanloadAnalysis":
        return <VanloadAnalysis onVehicleClick={handleTabChange} />;
      case "VanloadDatewise":
        return <VanloadingReportdatewise />;
         case "StockTransfer":
        return <StockTransfer />;
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
            onClick={() => handleTabChange("VanloadReport")}
            className={activeTab === "VanloadReport" ? "nav-link active" : "nav-link"}
          >
            Vanload Report
          </a>
        </li>
        <li className="nav-item me-3">
          <a
            href="#"
            onClick={() => handleTabChange("VanloadAnalysis")}
            className={activeTab === "VanloadAnalysis" ? "nav-link active" : "nav-link"}
          >
            Vanload Analysis
          </a>
        </li>
        <li className="nav-item">
          <a
            href="#"
            onClick={() => handleTabChange("VanloadDatewise")}
            className={activeTab === "VanloadDatewise" ? "nav-link active" : "nav-link"}
          >
            Vanload Datewise
          </a>
        </li>
        <li className="nav-item">
          <a
            href="#"
           onClick={() => handleTabChange("StockTransfer")}
className={activeTab === "StockTransfer" ? "nav-link active" : "nav-link"}
          >
           Stock Transfer 
          </a>
        </li>
      </ul>

      <div className="tab-content mt-4">{renderActiveTab()}</div>
    </div>
  );
};

export default Commonpage;
