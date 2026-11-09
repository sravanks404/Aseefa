import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import JournalReport from '../../../pages/Reports/Accounts Transactions/JournalReport'

const JournalReportpage = () => {
    return (
      <div className='page'>
             <Navbar />
      <Sidebar />
  
          <div className="page-wrapper">
              <JournalReport/>
          </div>
      </div>
    )
  }
export default JournalReportpage