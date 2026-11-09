import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import RootMaster from '../../../pages/Operations/MasterPages/RootMaster'

const RootMasterpage = () => {
  return (
    <div className='page'>
     <Navbar />
        <Sidebar />

        <div className="page-wrapper"> 
            <RootMaster/>
        </div>
    </div>
  )
}

export default RootMasterpage    