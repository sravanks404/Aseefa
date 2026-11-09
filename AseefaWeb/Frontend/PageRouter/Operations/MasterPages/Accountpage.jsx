//import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import Account from '../../../pages/Operations/MasterPages/Account'

const Accountpage = () => {
  return (
    <div className='page'>
        <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <Account/>
        </div>
    </div>
  )
}

export default Accountpage