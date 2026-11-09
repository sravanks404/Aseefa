import React, { useEffect, useState } from "react";
import ApexCharts from "apexcharts";
import api from "../pages/apiService";

const SaleGraph = () => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const companyID = sessionStorage.getItem("CompanyID");
        const activeUserId = sessionStorage.getItem("activeUserId");

        if (!companyID) {
          console.error("CompanyID not found in sessionStorage");
          return;
        }

        const response = await api.post("/api/SaleGraph", {  // Changed get to post
          CompanyID: companyID,                               // Body payload instead of params
          activeUserId: activeUserId,
        });

        const data = response.data;

        // Process data for the chart
        const processedData = data.map((item) => ({
          x: new Date(item.BillDate).toLocaleDateString(),
          y: item.TotalBillAmount,
          TotalBills: item.TotalBills,
        }));

        setChartData(processedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (chartData.length > 0) {
      const options = {
        chart: {
          type: "area",
          fontFamily: "inherit",
          height: 192,
          sparkline: {
            enabled: true,
          },
          animations: {
            enabled: false,
          },
        },
        dataLabels: {
          enabled: false,
        },
        fill: {
          opacity: 0.16,
          type: "solid",
        },
        stroke: {
          width: 2,
          lineCap: "round",
          curve: "smooth",
        },
        series: [
          {
            name: "",
            data: chartData.map((item) => ({
              x: item.x,
              y: item.y,
            })),
          },
        ],
        tooltip: {
          theme: "dark",
          x: {
            format: "dd MMM yyyy", // Format date in tooltip
          },
          y: {
            formatter: (value, { dataPointIndex }) => {
              const totalBills = chartData[dataPointIndex]?.TotalBills || 0;
              return `₹${value.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}<br>Bills: ${totalBills}`;
            },
          },
        },
        grid: {
          strokeDashArray: 4,
        },
        xaxis: {
          type: "category",
          labels: {
            padding: 0,
          },
          tooltip: {
            enabled: false,
          },
          axisBorder: {
            show: false,
          },
        },
        yaxis: {
          labels: {
            padding: 4,
          },
        },
        legend: {
          show: false,
        },
      };

      const chartContainer = document.getElementById("chart-development-activity");
      if (chartContainer) {
        const chart = new ApexCharts(chartContainer, options);
        chart.render();

        return () => {
          chart.destroy();
        };
      }
    }
  }, [chartData]);

  return <div id="chart-development-activity"></div>;
};

export default React.memo(SaleGraph);
