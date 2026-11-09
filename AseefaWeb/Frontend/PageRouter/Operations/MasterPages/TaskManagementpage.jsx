import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import TaskManagement from '../../../pages/Operations/MasterPages/TaskManagement'

function TaskManagementpage() {
  return (
    <div className='page'>
           <Navbar />
          <Sidebar />
    
            <div className="page-wrapper">
                <TaskManagement/>
            </div> 
        </div>
  )
}

export default TaskManagementpage
