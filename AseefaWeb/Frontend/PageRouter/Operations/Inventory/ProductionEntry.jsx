import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import ProductionEntry from '../../../pages/Operations/Inventory/ProductionEntry'

const ProductionEntrypage = () => {
  return (
    <div className='page'>
        <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <ProductionEntry/>
        </div>
    </div>
  )
}

export default ProductionEntrypage