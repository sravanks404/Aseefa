import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import DebitorsReport from '../../../pages/Reports/Finance & Accounts/DebitorsReport'

const DebitorsReportpage = () => {
    return (
      <div className='page'>
        <Navbar />
      <Sidebar />
          <div className="page-wrapper">
              <DebitorsReport/>
          </div>
      </div>
    )
  }
export default DebitorsReportpage