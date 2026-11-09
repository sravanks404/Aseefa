//import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import CompanyInfo from '../../../pages/Operations/MasterControl/TabUser'
import RentalInfo from '../../../pages/Operations/MasterControl/RentalInfo'

const Userinfopage = () => {
  return (
    <div className='page'>
       <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            {/* <CompanyInfo/> */}
            <RentalInfo/>
        </div>
    </div>
  )
}

export default Userinfopage