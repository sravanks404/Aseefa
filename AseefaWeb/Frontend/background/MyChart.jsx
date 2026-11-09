import Chart from 'react-apexcharts';

const MyChart = () => {
  return (
    <Chart
      options={{
        chart: {
          type: "bar",
          fontFamily: 'inherit',
          height: 40.0,
          sparkline: {
            enabled: true,
          },
          animations: {
            enabled: false,
          },
        },
        plotOptions: {
          bar: {
            columnWidth: '50%',
          }
        },
        dataLabels: {
          enabled: false,
        },
        fill: {
          opacity: 1,
        },
        tooltip: {
          enabled: false, // ✅ disables tooltip completely
        },
        grid: {
          strokeDashArray: 4,
        },
        xaxis: {
          labels: {
            show: false, // Optional: Hide x-axis labels if it's a sparkline
          },
          tooltip: {
            enabled: false,
          },
          axisBorder: {
            show: false,
          },
          type: 'datetime',
        },
        yaxis: {
          labels: {
            show: false, // Optional: Hide y-axis labels if it's a sparkline
          },
        },
        labels: [
          '2020-06-20', '2020-06-21', '2020-06-22', '2020-06-23', '2020-06-24', '2020-06-25', '2020-06-26', '2020-06-27', '2020-06-28', '2020-06-29', '2020-06-30', '2020-07-01', '2020-07-02', '2020-07-03', '2020-07-04', '2020-07-05', '2020-07-06', '2020-07-07', '2020-07-08', '2020-07-09', '2020-07-10', '2020-07-11', '2020-07-12', '2020-07-13', '2020-07-14', '2020-07-15', '2020-07-16', '2020-07-17', '2020-07-18', '2020-07-19'
        ],
        legend: {
          show: false,
        },
      }}
      series={[
        {
          name: "Profits",
          data: [37, 35, 44, 28, 36, 24, 65, 31, 37, 39, 62, 51, 35, 41, 35, 27, 93, 53, 61, 27, 54, 43, 19, 46, 39, 62, 51, 35, 41, 67]
        }
      ]}
      type="bar"
      height={40.0}
    />
  );
};

export default MyChart;
