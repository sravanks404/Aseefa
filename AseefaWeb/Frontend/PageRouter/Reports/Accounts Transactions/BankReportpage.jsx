import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import BankReport from '../../../pages/Reports/Accounts Transactions/BankReport'

const BankReportpage = () => {
    return (
      <div className='page'>
       <Navbar />
      <Sidebar />
  
          <div className="page-wrapper">
              <BankReport/>
          </div>
      </div>
    )
  }
export default BankReportpage