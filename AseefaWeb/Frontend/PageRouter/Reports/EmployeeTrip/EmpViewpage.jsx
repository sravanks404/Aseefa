import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import EmpView from '../../../pages/Reports/EmployeeTrip/EmpView'


const EmpViewpage = () => {
    return (
      <div className='page'>
      <Navbar />
      <Sidebar />
  
          <div className="page-wrapper">
              <EmpView/>
          </div>
      </div>
    )
  }
export default EmpViewpage