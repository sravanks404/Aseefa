import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import LeadEnquiry from '../../../pages/Operations/MasterPages/LeadEnquiry'

const enquirypage = () => {
  return (
    <div className='page'>
     <Navbar />
        <Sidebar />

        <div className="page-wrapper">
            <LeadEnquiry/>
        </div>
    </div>
  )
}

export default enquirypage