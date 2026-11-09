import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import CreditNoteReport from '../../../pages/Reports/Inventory/CreditNoteReport'

const CreditNoteReportpage = () => {
    return (
      <div className='page'>
           <Navbar />
      <Sidebar />
          <div className="page-wrapper">
              <CreditNoteReport/>
          </div>
      </div>
    )
  }
export default CreditNoteReportpage