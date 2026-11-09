//import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import Reciept from '../../../pages/Operations/MasterPages/Reciept'

const Recieptpage = () => {
  return (
    <div className='page'>
     <Navbar />
        <Sidebar />

        <div className="page-wrapper">
            <Reciept/>
        </div>
    </div>
  )
}

export default Recieptpage