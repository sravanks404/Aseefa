import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import QcMasterpage from '../../../pages/Operations/MasterPages/QcMasterpage'

const QcMaster = () => {
  return (
    <div className='page'>
     <Navbar />
        <Sidebar />

        <div className="page-wrapper">
            <QcMasterpage/>
        </div>
    </div>
  )
}

export default QcMaster