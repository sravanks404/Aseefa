import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import CustomerDetailsReport from '../../../pages/Reports/Masters/CustomerDetailsReport'

const CustomerDetailsReportpage = () => {
    return (
      <div className='page'>
          <Navbar />
      <Sidebar />
          <div className="page-wrapper">
              <CustomerDetailsReport/>
          </div>
      </div>
    )
  }
export default CustomerDetailsReportpage