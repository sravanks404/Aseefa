import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import DebitnoteReport from '../../../pages/Reports/Inventory/DebitnoteReport'

const DebitnoteReportpage = () => {
    return (
      <div className='page'>
           <Navbar />
      <Sidebar />
          <div className="page-wrapper">
              <DebitnoteReport/>
          </div>
      </div>
    )
  }
export default DebitnoteReportpage