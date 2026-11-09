import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import VehicleTypeMaster from '../../../pages/Operations/MasterPages/VehicleTypeMaster'

const VehicleTypeMasterpage = () => {
  return (
    <div className='page'>
     <Navbar />
        <Sidebar />

        <div className="page-wrapper">
            <VehicleTypeMaster/> 
        </div>
    </div>
  )
}

export default VehicleTypeMasterpage 