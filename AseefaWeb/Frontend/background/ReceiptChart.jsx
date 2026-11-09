import React, { useEffect, useRef, useState } from 'react';
import ApexCharts from 'apexcharts';
import api from '../pages/apiService';

const ReceiptChart = () => {
  const chartRef = useRef(null);
  const [chartData, setChartData] = useState([]);

useEffect(() => {
    const fetchChartData = async () => {
      try {
        const companyID = sessionStorage.getItem('CompanyID');
        const activeUserId = sessionStorage.getItem('activeUserId');

        if (!companyID) {
          console.error('CompanyID not found in sessionStorage');
          return;
        }

        const response = await api.post('/api/ReceiptChart', {  // Changed get to post
          CompanyID: companyID,                                  // Body payload instead of params
          activeUserId: activeUserId,
        });

        const data = response.data || [];

        const formattedData = data.map(item => ({
          x: new Date(item.RDate).getTime(),
          y: item.TotalReceiptAmount,
        }));

        setChartData(formattedData);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };

    fetchChartData();
  }, []);

  useEffect(() => {
    if (chartData.length === 0) return;

    const chart = new ApexCharts(chartRef.current, {
      chart: {
        type: 'area',
        fontFamily: 'inherit',
        height: 60, // <-- Increased height
        sparkline: { enabled: true },
        animations: { enabled: false },
      },
      dataLabels: { enabled: false },
      fill: {
        opacity: 0.16,
        type: 'solid',
      },
      stroke: {
        width: 2,
        lineCap: 'round',
        curve: 'smooth',
      },
      series: [{
        name: 'Receipts',
        data: chartData,
      }],
      tooltip: {
        theme: 'dark',
        x: {
          format: 'dd MMM yyyy',
        },
        y: {
          formatter: value => `₹${value.toLocaleString()}`,
        },
      },
      grid: {
        strokeDashArray: 4,
      },
      xaxis: {
        type: 'datetime',
        labels: { show: false },
        tooltip: { enabled: false },
        axisBorder: { show: false },
      },
      yaxis: {
        labels: { show: false },
      },
      colors: ['green'], // <-- Changed to green
      legend: { show: false },
    });

    chart.render();

    return () => chart.destroy();
  }, [chartData]);

  return <div id="chart-revenue-bg" ref={chartRef}></div>;
};

export default ReceiptChart;
