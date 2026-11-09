import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import DamageReport from '../../../pages/Reports/Inventory/DamageReport'

const DamageReportpage = () => {
    return (
      <div className='page'>
            <Navbar />
      <Sidebar />
  
          <div className="page-wrapper">
              <DamageReport/>
          </div>
      </div>
    )
  }
export default DamageReportpage

