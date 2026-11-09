//import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import TabSeries from '../../../pages/Operations/MasterPages/TabSeries'

const TabSeriespage = () => {
  return (
    <div className='page'>
   <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <TabSeries/>
        </div>
    </div>
  )
}

export default TabSeriespage