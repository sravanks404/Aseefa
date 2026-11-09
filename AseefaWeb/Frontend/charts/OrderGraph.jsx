import React, { useEffect, useRef, useState } from 'react';
import ApexCharts from 'apexcharts';
import api from "../pages/apiService";

const ChartComponent = () => {
  const chartRef = useRef(null);
  const [chartData, setChartData] = useState({ labels: [], series: [] });

 useEffect(() => {
    const fetchData = async () => {
      try {
        const companyID = sessionStorage.getItem("CompanyID");
        const activeUserId = sessionStorage.getItem("activeUserId");

        const response = await api.post("/api/OrderGraph", {  // Changed get to post
          CompanyID: companyID,                               // Body payload instead of params
          activeUserId: activeUserId,
        });

        const rawData = response.data;

        // Find unique item names dynamically
        const itemNames = [...new Set(rawData.map((item) => item.ItemName))];

        // Process data to aggregate by date and item
        const processedData = rawData.reduce((acc, item) => {
          const date = item.Date.split('T')[0];
          if (!acc[date]) {
            acc[date] = {};
            itemNames.forEach((name) => {
              acc[date][name] = 0;
            });
          }
          acc[date][item.ItemName] += item.Qty;
          return acc;
        }, {});

        // Generate labels and series
        const labels = Object.keys(processedData).sort();
        const series = itemNames.map((name) => ({
          name,
          data: labels.map((date) => processedData[date][name]),
        }));

        setChartData({ labels, series });
      } catch (error) {
        console.error('Error fetching data:', error);
        setChartData({ labels: [], series: [] });
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const chartOptions = {
      chart: {
        type: 'bar',
        fontFamily: 'inherit',
        height: 240,
        parentHeightOffset: 0,
        toolbar: { show: false },
        animations: { enabled: false },
        stacked: true,
        noData: {
          text: 'No data available',
          align: 'center',
          verticalAlign: 'middle',
          style: {
            fontSize: '14px',
            color: '#888',
          },
        },
      },
      plotOptions: {
        bar: {
          columnWidth: '50%',
        },
      },
      dataLabels: { enabled: false },
      fill: { opacity: 1 },
      series: chartData.series,
      tooltip: { theme: 'dark' },
      grid: {
        padding: { top: -20, right: 0, left: -4, bottom: -4 },
        strokeDashArray: 4,
        xaxis: { lines: { show: true } },
      },
      xaxis: {
        labels: { padding: 0 },
        tooltip: { enabled: false },
        axisBorder: { show: false },
        type: 'datetime',
        categories: chartData.labels,
      },
      yaxis: {
        labels: { padding: 4 },
      },
      colors: ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0'],
      legend: { show: false },
    };

    const chart = new ApexCharts(chartRef.current, chartOptions);
    chart.render();

    return () => {
      chart.destroy();
    };
  }, [chartData]);

  return <div ref={chartRef} />;
};

export default React.memo(ChartComponent);
