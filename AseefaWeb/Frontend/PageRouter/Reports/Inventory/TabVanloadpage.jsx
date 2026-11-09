import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import TabVanload from '../../../pages/Reports/Inventory/TabVanload'

const TabVanloadpage = () => {
    return (
      <div className='page'>
          <Navbar />
             <Sidebar />
  
          <div className="page-wrapper">
              <TabVanload/>
          </div>
      </div>
    )
  }
export default TabVanloadpage