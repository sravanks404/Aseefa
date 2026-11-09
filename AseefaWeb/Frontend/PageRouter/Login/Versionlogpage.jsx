//import React from 'react'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import Versionlog from '../../pages/Login/Versionlog'

const Versionlogpage = () => {
  return (
    <div className='page'>
       <Navbar />
      <Sidebar />
        <div className="page-wrapper">
            <Versionlog/>
        </div>
    </div>
  )
}

export default Versionlogpage




