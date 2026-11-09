//import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import Customer from '../../../pages/Operations/MasterPages/Customer'

const Customerpage = () => {
  return (
    <div className='page'>
       <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <Customer/>
        </div> 
    </div>
  ) 
}
  
export default Customerpage