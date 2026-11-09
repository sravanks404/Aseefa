import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import VehicleMaster from '../../../pages/Operations/MasterPages/VehicleMaster'

const VehicleMasterpage = () => {
  return (
    <div className='page'>
     <Navbar />
        <Sidebar />

        <div className="page-wrapper">
            <VehicleMaster/> 
        </div>
    </div>
  )
}

export default VehicleMasterpage 