//import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import TabUserMaster from '../../../pages/Operations/MasterControl/TabUserMaster'

const TabUserMasterpage = () => {
  return (
    <div className='page'>
         <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <TabUserMaster/>
        </div>
    </div> 
  )
}

export default TabUserMasterpage