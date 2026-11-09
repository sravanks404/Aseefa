import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import RatePurchaseReport from '../../../pages/Reports/Inventory/RatePurchaseReport'

const RateDiscReportpage = () => {
    return (
      <div className='page'>
         <Navbar />
      <Sidebar />
  
          <div className="page-wrapper">
              <RatePurchaseReport/>
          </div>
      </div>
    )
  }
export default RateDiscReportpage