//import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import ItemCreation from '../../../pages/Operations/MasterPages/ItemCreation'

const ItemCreationpage = () => {
  return (
    <div className='page'>
      <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <ItemCreation/>
        </div>
    </div>
  )
}

export default ItemCreationpage