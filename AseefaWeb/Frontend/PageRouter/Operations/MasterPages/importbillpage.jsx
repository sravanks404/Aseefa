import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import ImportBillExcel from '../../../pages/Operations/MasterPages/ImportBillExcel'

const importexcelpage = () => {
  return (
    <div className='page'>
       <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <ImportBillExcel/>
        </div>
    </div>
  )
}

export default importexcelpage