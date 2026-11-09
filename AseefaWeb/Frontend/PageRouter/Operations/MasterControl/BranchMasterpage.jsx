import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import BranchMaster from '../../../pages/Operations/MasterControl/BranchMaster'

const BranchMasterpage = () => {
  return (
    <div className='page'>
        <Navbar />
      <Sidebar />    

        <div className="page-wrapper">
            <BranchMaster/>
        </div>
    </div>
  )
}

export default BranchMasterpage