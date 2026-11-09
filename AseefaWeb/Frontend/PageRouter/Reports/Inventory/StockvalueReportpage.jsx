import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import StockValueReport from '../../../pages/Reports/Inventory/StockValueReport'

const StockValueReportpage = () => {
    return (
      <div className='page'>
         <Navbar />
      <Sidebar />
  
          <div className="page-wrapper">
              <StockValueReport/>
          </div>
      </div>
    )
  }
export default StockValueReportpage