import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import QualityCheck from '../../../pages/Operations/Inventory/QualityCheck'

const QualityCheckpage = () => {
  return (
    <div className='page'>
        <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <QualityCheck/>
        </div>
    </div>
  )
}

export default QualityCheckpage