import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import VanSaleSummary from '../../../pages/Reports/Sales & Distribution/VanSaleSummary'

const VanSaleSummarypage = () => {
    return (
      <div className='page'>
       <Navbar />
      <Sidebar />
  
          <div className="page-wrapper">
              <VanSaleSummary/>
          </div>
      </div>
    )
  }
export default VanSaleSummarypage