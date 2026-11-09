import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import TrailBalance from '../../../pages/Reports/Finance & Accounts/TrailBalance'

const TrailBalancepage = () => {
    return (
      <div className='page'>
       <Navbar />
      <Sidebar />
          <div className="page-wrapper">
              <TrailBalance/>
          </div>
      </div>
    )
  }
export default TrailBalancepage