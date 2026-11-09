//import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import Camp from '../../../pages/Operations/MasterPages/Camp'

const Camppage = () => {
  return (
    <div className='page'>
       <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <Camp/>
        </div> 
    </div>
  ) 
}
  
export default Camppage