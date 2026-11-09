import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import OpeningVoucherReport from '../../../pages/Reports/Inventory/OpeningVoucherReport'

const OpeningVoucherReportpage = () => {
    return (
      <div className='page'>
           <Navbar />
      <Sidebar />
          <div className="page-wrapper">
              <OpeningVoucherReport/>
          </div>
      </div>
    )
  }
export default OpeningVoucherReportpage