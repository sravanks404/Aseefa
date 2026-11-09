import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import CategoryMaster from '../../../pages/Operations/MasterPages/CategoryMaster'

const CategoryMasterpage = () => {
  return (
    <div className='page'>
        <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <CategoryMaster/>
        </div>
    </div>
  )
}

export default CategoryMasterpage