import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import EmployeeAllocation from '../../../pages/Operations/MasterPages/EmployeeAllocation'

const EmployeeAllocationpage = () => {
  return (
    <div className='page'>
        <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <EmployeeAllocation/>
        </div>
    </div>
  )
}

export default EmployeeAllocationpage