import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import BatchMaster from '../../../pages/Operations/MasterPages/BatchMaster'

const BatchMasterpage = () => {
  return (
    <div className='page'>
        <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <BatchMaster/>
        </div>
    </div>
  )
}

export default BatchMasterpage