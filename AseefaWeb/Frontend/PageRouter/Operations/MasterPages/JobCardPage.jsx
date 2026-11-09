//import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import JobCard from '../../../pages/Operations/MasterPages/JobCard'

const productionallocpage = () => {
  return (
    <div className='page'>
        <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <JobCard/>
        </div>
    </div>
  )
}

export default productionallocpage