import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import TabPurchase from '../../../pages/Reports/Inventory/TabPurchase'

const TabPurchasepage = () => {
    return (
      <div className='page'>
         <Navbar />
      <Sidebar />
  
          <div className="page-wrapper">
              <TabPurchase/>
          </div>
      </div>
    )
  }
export default TabPurchasepage