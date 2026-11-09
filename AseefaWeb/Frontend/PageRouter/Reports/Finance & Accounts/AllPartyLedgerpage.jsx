import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import AllPartyLedger from '../../../pages/Reports/Finance & Accounts/AllPartyLedger'

const AllPartyLedgerpage = () => {
    return (
      <div className='page'>
      <Navbar />
      <Sidebar />
          <div className="page-wrapper">
              <AllPartyLedger/>
          </div>
      </div>
    )
  }
export default AllPartyLedgerpage