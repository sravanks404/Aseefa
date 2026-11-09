import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import ByProducts from '../../../pages/Operations/MasterPages/ByProducts'

const ByProductspage = () => {
  return (
    <div className='page'>
        <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <ByProducts/>
        </div>
    </div>
  )
}

export default ByProductspage