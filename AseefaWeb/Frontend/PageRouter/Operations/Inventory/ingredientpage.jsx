import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import Ingredients from '../../../pages/Operations/Inventory/Ingredients'

const Ingredientpage = () => {
  return (
    <div className='page'>
        <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <Ingredients/>
        </div>
    </div>
  )
}

export default Ingredientpage