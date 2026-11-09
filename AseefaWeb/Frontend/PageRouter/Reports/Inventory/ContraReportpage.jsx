import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import ContraReport from '../../../pages/Reports/Inventory/ContraReport'

const ContraReportpage = () => {
    return (
      <div className='page'>
           <Navbar />
      <Sidebar />
          <div className="page-wrapper">
              <ContraReport/>
          </div>
      </div>
    )
  }
export default ContraReportpage