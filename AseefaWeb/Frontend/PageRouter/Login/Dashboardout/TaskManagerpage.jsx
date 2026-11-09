import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import TaskManager from '../../../pages/Login/Dashboardout/TaskManager'

const TaskManagerpage = () => {
    return (
      <div className='page'>
        <Navbar />
      <Sidebar />
  
          <div className="page-wrapper">
              <TaskManager/>
          </div>
      </div>
    )
  }
export default TaskManagerpage