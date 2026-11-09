import React from "react";

const changelogData = [

  {
    version: "5.8.11",
    date: "August 11, 2025",
    changes: [
      
       "Sales Export",


    ],
  },

  {
    version: "5.8.06",
    date: "August 06, 2025",
    changes: [
      "Dynamic Dashboard for admin & Sales ",
      "Redesigned Sidebar ",
      "Mac id For Android ",
      "Customerwise Sale ",
      "Hsn Return Report ",
      "Van Sale Summary ",
      "Godown Stock ",
      "Balance Stock ",
      "Enhanced Trail Balance",
       "Multi Db Connection",


    ],
  },

  {
    version: "5.4.30",
    date: "April 25, 2025",
    changes: [
      "sale item analysis report ",
      "sale item by customer report",
      "sale item tax base report",
      "sale HSNcode base report",
      "item rate discount",
      "redesign work on pages",
    ],
  },

  {
    version: "5.4.25",
    date: "April 25, 2025",
    changes: [
      "redesign work on pages",
      "sale itemwise reports",
      "debitors report",
      "creditors report",
      "trail balance",
      "vanload report",
      "vanload analysis ",
      "vanload datewise report"

    ],
  },

  {
    version: "5.4.4",
    date: "April 4, 2025",
    changes: [
      "Branch Sale",
      "Emmployee Location",
      "Damage Report",
      "Customer List",

    ],
  },

  {
    version: "5.3.10",
    date: "March 10, 2025",
    changes: [
      "Sale, order- Details Popup",
      "Stock Report",
      " CustomerLedger"

    ],
  },

  {
    version: "5.2.02",
    date: "February 02, 2025",
    changes: [
      "Sale, order, Profit - Report",
      "Employee Odometer, trip details, Map",
      "Employee Order, sale, receipt, Trip Report",
      "Combined Trip Report excel"

    ],
  },
  {
    version: "5.1.20",
    date: "January 20, 2025",
    changes: [
      "Graph- order, sale",
      "Location - last Emp Live",
      "User Message, Task"
    ],
  },


  {
    version: "5.1.1",
    date: "January 01, 2025",
    changes: [
      "Dashboard",
      "7,30,90 Days - Sales,Order,Receipt,Outstanding",
      "7,30,90 Days - B2C, B2B,Sales Activity, Most Visited Customer, Product Traffic",
      "Daily-Total Visit, Not Visited, New Customer",
      "Total- Customer, Route, Item, Category"
    ],
  },



];

const Changelog = () => {
  return (
    <div className="page-body">
      <div className="container-xl">
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-9">
            <div className="card card-lg">
              <div className="card-body markdown">
                <h1>Changelog</h1>
                {changelogData.map((log, index) => (
                  <div className="mb-4" key={index}>
                    <h2 className="mb-2">
                      <span>{log.version}</span> –
                      <small> {log.date}</small>
                    </h2>
                    {log.description && <p className="strong">{log.description}</p>}
                    <ul>
                      {log.changes.map((change, i) => (
                        <li key={i}>{change}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Changelog;
