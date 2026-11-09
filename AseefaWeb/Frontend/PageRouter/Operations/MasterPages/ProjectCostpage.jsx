//import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import ProjectCost from '../../../pages/Operations/MasterPages/ProjectCost'

const ProjectCostpage = () => {
  return (
    <div className='page'>
       <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <ProjectCost/>
        </div> 
    </div>
  ) 
}
  
export default ProjectCostpage