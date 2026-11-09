import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import PaymentReport from '../../../pages/Reports/Accounts Transactions/PaymentReport'

const PaymentReportpage = () => {
    return (
      <div className='page'>
       <Navbar />
      <Sidebar />
  
          <div className="page-wrapper">
              <PaymentReport/>
          </div>
      </div>
    )
  }
export default PaymentReportpage