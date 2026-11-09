import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import UnitMaster from '../../../pages/Operations/MasterPages/UnitMaster'

const UnitMasterpage = () => {
  return (
    <div className='page'>
        <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <UnitMaster/>
        </div>
    </div>
  )
}

export default UnitMasterpage   