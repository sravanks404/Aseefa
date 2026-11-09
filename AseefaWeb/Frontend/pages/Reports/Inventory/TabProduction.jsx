import { useState, useEffect } from "react";
import ProductionReport from "./ProductionReport";
import ProductionAnalysis from "./ProductionAnalysis";
import ProductionOrderReport from "./ProductionOrderReport";

const ProductionCommonpage = () => {
  const [ActiveProductionTab, setActiveProductionTab] = useState("ProductionReport");

  useEffect(() => {
    const savedTab = sessionStorage.getItem("ActiveProductionTab");
    if (savedTab) {
      setActiveProductionTab(savedTab);
    }
  }, []);

  const handleTabChange = (tabName) => {
    sessionStorage.setItem("ActiveProductionTab", tabName);
    setActiveProductionTab(tabName);
  };

  const renderActiveProductionTab = () => {
    switch (ActiveProductionTab) {
      case "ProductionReport":
        return <ProductionReport />;

      case "ProductionOrderReport":
        return <ProductionOrderReport onTabChange={handleTabChange} />; // ✅ renamed prop

      case "ProductionAnalysis":
        return <ProductionAnalysis onTabChange={handleTabChange} />; // ✅ renamed prop

      default:
        return null;
    }
  };

  return (
    <div
      className="common-page"
      style={{ backgroundColor: "white", padding: "20px" }}
    >
      <ul
        className="nav ms-5 nav-tabs flex-nowrap"
        style={{
          overflowX: "auto",
          whiteSpace: "nowrap",
          display: "flex",
          flexWrap: "nowrap",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <li className="nav-item me-3">
          <a
            href="#"
            onClick={() => handleTabChange("ProductionReport")}
            className={
              ActiveProductionTab === "ProductionReport"
                ? "nav-link active"
                : "nav-link"
            }
          >
            Production Report
          </a>
        </li>

        <li className="nav-item me-3">
          <a
            href="#"
            onClick={() => handleTabChange("ProductionOrderReport")}
            className={
              ActiveProductionTab === "ProductionOrderReport"
                ? "nav-link active"
                : "nav-link"
            }
          >
            Production Order
          </a>
        </li>

        <li className="nav-item me-3">
          <a
            href="#"
            onClick={() => handleTabChange("ProductionAnalysis")}
            className={
              ActiveProductionTab === "ProductionAnalysis"
                ? "nav-link active"
                : "nav-link"
            }
          >
            Production Analysis
          </a>
        </li>
      </ul>

      <div className="tab-content mt-4">{renderActiveProductionTab()}</div>
    </div>
  );
};

export default ProductionCommonpage;
