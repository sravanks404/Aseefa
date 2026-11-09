import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import ReceiptReport from '../../../pages/Reports/Sales & Distribution/ReceiptReport'

const ReceiptReportpage = () => {
    return (
      <div className='page'>
            <Navbar />
      <Sidebar />
  
          <div className="page-wrapper">
              <ReceiptReport/>
          </div>
      </div>
    )
  }
export default ReceiptReportpage