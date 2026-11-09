import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import AttendanceDashboard from '../../../pages/Operations/MasterPages/AttendanceDashboard'


function AttendanceDashboardpage() {
  return (
    <div className='page'>
           <Navbar />
          <Sidebar />
    
            <div className="page-wrapper">
                <AttendanceDashboard/>
            </div> 
        </div> 
  )
}

export default AttendanceDashboardpage
