import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import ProfitReport from '../../../pages/Reports/Finance & Accounts/ProfitReport'

const ProfitReportpage = () => {
    return (
      <div className='page'>
          <Navbar />
      <Sidebar />
  
          <div className="page-wrapper">
              <ProfitReport/>
          </div>
      </div>
    )
  }
export default ProfitReportpage