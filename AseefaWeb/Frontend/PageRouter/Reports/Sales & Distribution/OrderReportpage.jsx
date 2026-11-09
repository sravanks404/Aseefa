import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import OrderReport from '../../../pages/Reports/Sales & Distribution/OrderReport'

const OrderReportpage = () => {
    return (
      <div className='page'>
            <Navbar />
      <Sidebar />
          <div className="page-wrapper">
              <OrderReport/>
          </div>
      </div>
    )
  }
export default OrderReportpage