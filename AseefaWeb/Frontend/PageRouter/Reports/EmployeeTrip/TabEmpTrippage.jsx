import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import TabEmpTrip from '../../../pages/Reports/EmployeeTrip/TabEmpTrip'

const TabEmpTrippage = () => {
    return (
      <div className='page'>
      <Navbar />
      <Sidebar />
          <div className="page-wrapper">
              <TabEmpTrip/>
          </div>
      </div>
    )
  }
export default TabEmpTrippage