//import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import BeatAllocate from '../../../pages/Operations/MasterPages/BeatAllocate'

const BeatAllocatepage = () => {
  return (
    <div className='page'>
       <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <BeatAllocate/>
        </div>
    </div>
  )
}

export default BeatAllocatepage