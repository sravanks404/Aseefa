import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import Balancestockreport from '../../../pages/Reports/Inventory/Balancestockreport'

const Balancestockreportpage = () => {
    return (
      <div className='page'>
           <Navbar />
      <Sidebar />
          <div className="page-wrapper">
              <Balancestockreport/>
          </div>
      </div>
    )
  }
export default Balancestockreportpage