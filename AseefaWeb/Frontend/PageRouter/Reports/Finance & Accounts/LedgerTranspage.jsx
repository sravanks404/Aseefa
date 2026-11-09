import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import LedgerTrans from '../../../pages/Reports/Finance & Accounts/LedgerTrans'

const LedgerTranspage = () => {
    return (
      <div className='page'>
         <Navbar />
      <Sidebar />
  
          <div className="page-wrapper">
              <LedgerTrans/>
          </div>
      </div>
    )
  }
export default LedgerTranspage