import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import ProductionCrud from '../../../pages/Operations/Inventory/ProductionCrud'

const ProductionCrudpage = () => {
  return (
    <div className='page'>
        <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <ProductionCrud/>
        </div>
    </div>
  )
}

export default ProductionCrudpage