import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import CreditorsReport from '../../../pages/Reports/Finance & Accounts/CreditorsReport'

const CreditorsReportpage = () => {
    return (
      <div className='page'>
      <Navbar />
      <Sidebar />
          <div className="page-wrapper">
              <CreditorsReport/>
          </div>
      </div>
    )
  }
export default CreditorsReportpage