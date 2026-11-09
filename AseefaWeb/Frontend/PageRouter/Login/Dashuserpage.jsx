//import React from 'react'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import Dashuser from '../../pages/Login/Dashuser'

const Dashuserpage = () => {
  return (
    <div className='page'>
     <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <Dashuser/>
        </div>
    </div>
  )
}

export default Dashuserpage