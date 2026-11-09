//import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import ItemRateDiscount from '../../../pages/Operations/MasterPages/ItemRateDiscount'

const ItemRateDiscountpage = () => {
  return (
    <div className='page'>
   <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <ItemRateDiscount/>
        </div>
    </div>
  )
}

export default ItemRateDiscountpage