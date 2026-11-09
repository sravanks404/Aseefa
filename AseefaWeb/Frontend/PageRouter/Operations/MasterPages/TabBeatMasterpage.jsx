//import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import TabBeatMaster from '../../../pages/Operations/MasterPages/TabBeatMaster'

const TabBeatMasterpage = () => {
  return (
    <div className='page'>
      <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <TabBeatMaster/>
        </div>
    </div>
  )
}

export default TabBeatMasterpage