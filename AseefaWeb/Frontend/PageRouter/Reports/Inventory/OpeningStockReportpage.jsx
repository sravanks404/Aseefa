import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import OpeningStockReport from '../../../pages/Reports/Inventory/OpeningStockReport'

const OpeningStockReportpage = () => {
    return (
      <div className='page'>
         <Navbar />
      <Sidebar />
  
          <div className="page-wrapper">
              <OpeningStockReport/>
          </div>
      </div>
    )
  }
export default OpeningStockReportpage