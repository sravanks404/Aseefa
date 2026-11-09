import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import StockReport from '../../../pages/Reports/Inventory/StockReport'

const StockReportpage = () => {
    return (
      <div className='page'>
         <Navbar />
      <Sidebar />
  
          <div className="page-wrapper">
              <StockReport/>
          </div>
      </div>
    )
  }
export default StockReportpage