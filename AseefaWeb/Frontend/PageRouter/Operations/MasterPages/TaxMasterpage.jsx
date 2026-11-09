import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import TaxMaster from '../../../pages/Operations/MasterPages/TaxMaster'

const TaxMasterpage = () => {
  return (
    <div className='page'>
        <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <TaxMaster/>
        </div>
    </div>
  )
}

export default TaxMasterpage