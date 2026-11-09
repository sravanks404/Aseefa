import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import EmpMessage from '../../../pages/Login/Dashboardout/EmpMessage'

const EmpMessagepage = () => {
  return (
    <div className='page'>
      <Navbar />
      <Sidebar />

      <div className="page-wrapper">
        <EmpMessage />
      </div>
    </div>
  )
}
export default EmpMessagepage