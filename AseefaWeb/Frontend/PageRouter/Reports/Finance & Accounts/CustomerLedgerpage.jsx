import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import CustomerLedger from '../../../pages/Reports/Finance & Accounts/CustomerLedger'

const CustomerLedgerpage = () => {
    return (
      <div className='page'>
   <Navbar />
      <Sidebar />
  
          <div className="page-wrapper">
              <CustomerLedger/>
          </div>
      </div>
    )
  }
export default CustomerLedgerpage