//import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import CompanyInfo from '../../../pages/Operations/MasterControl/CompanyInfo'

const CompanyInfopage = () => {
  return (
    <div className='page'>
        <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <CompanyInfo/>
        </div>
    </div>
  )
}

export default CompanyInfopage