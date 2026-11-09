//import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import Supplier from '../../../pages/Operations/MasterPages/Supplier'

const Supplierpage = () => {
  return (
    <div className='page'>
       <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <Supplier/>
        </div> 
    </div>   
  ) 
}

export default Supplierpage