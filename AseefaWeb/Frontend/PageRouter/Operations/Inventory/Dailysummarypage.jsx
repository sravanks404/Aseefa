import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import DailySummary from '../../../pages/Reports/Inventory/DailysummaryReport'
const DailySummarypage = () => {
  return (
    <div className='page'>
        <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <DailySummary/>
        </div>
    </div>
  )
}

export default DailySummarypage