import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import TabSalereport from '../../../pages/Reports/Sales & Distribution/TabSalereport'

const Tabsalepage = () => {
    return (
      <div className='page'>
          <Navbar />
      <Sidebar />
  
          <div className="page-wrapper">
              <TabSalereport/>
          </div>
      </div>
    )
  }
export default Tabsalepage