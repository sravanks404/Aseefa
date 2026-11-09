//import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import TabImport from '../../../pages/Operations/MasterPages/TabImport'

const TabImportpage = () => {
  return (
    <div className='page'>
       <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <TabImport/>
        </div>
    </div>
  )
}

export default TabImportpage