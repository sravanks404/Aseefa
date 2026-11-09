import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import LedgerAll from '../../../pages/Reports/Finance & Accounts/LedgerAll'

const LedgerAllpage = () => {
    return (
      <div className='page'>
            <Navbar />
      <Sidebar />
          <div className="page-wrapper">
              <LedgerAll/>
          </div>
      </div>
    )
  }
export default LedgerAllpage