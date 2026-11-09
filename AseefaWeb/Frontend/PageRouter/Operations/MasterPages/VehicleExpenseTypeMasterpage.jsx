import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import VehicleExpenseTypeMaster from '../../../pages/Operations/MasterPages/VehicleExpenseTypeMaster'

const VehicleExpenseTypeMasterpage = () => {
  return (
    <div className='page'>
     <Navbar />
        <Sidebar />

        <div className="page-wrapper">
            <VehicleExpenseTypeMaster/> 
        </div>
    </div>
  )
}

export default VehicleExpenseTypeMasterpage 