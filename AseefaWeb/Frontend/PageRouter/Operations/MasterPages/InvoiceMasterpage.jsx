import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import InvoiceMaster from '../../../pages/Operations/MasterPages/InvoiceMaster'

const InvoiceMasterpage = () => {
  return (
    <div className='page'>
        <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <InvoiceMaster/>
        </div>
    </div>
  )
}

export default InvoiceMasterpage