import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import PandLReport from '../../../pages/Reports/Finance & Accounts/PandLReport'

const PandLReportpage = () => {
    return (
      <div className='page'>
      <Navbar />
      <Sidebar />
  
          <div className="page-wrapper">
              <PandLReport/>
          </div>
      </div>
    )
  }
export default PandLReportpage