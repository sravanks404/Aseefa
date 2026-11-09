import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import ProductionReport from '../../../pages/Reports/Inventory/ProductionReport'

const ProfitReportpage = () => {
    return (
      <div className='page'>
     <Navbar />
      <Sidebar />
  
          <div className="page-wrapper">
              <ProductionReport/>
          </div>
      </div>
    )
  }
export default ProfitReportpage