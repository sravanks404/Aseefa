import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import TabProduction from '../../../pages/Reports/Inventory/TabProduction'

const TabProductionpage = () => {
    return (
      <div className='page'>
         <Navbar />
      <Sidebar />
  
          <div className="page-wrapper">
              <TabProduction/>
          </div>
      </div>
    )
  }
export default TabProductionpage