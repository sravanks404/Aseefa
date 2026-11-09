import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import Liveusermap from '../../../pages/Login/Dashboardout/Liveusermap'

const Liveusermappage = () => {
    return (
      <div className='page'>
      <Navbar />
      <Sidebar />
          <div className="page-wrapper">
              <Liveusermap/>
          </div>
      </div>
    )
  }
export default Liveusermappage