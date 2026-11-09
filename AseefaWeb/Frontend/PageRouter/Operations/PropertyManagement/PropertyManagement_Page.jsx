import React from 'react'
import Navbar from '../../../components/Navbar'
import Sidebar from '../../../components/Sidebar'
import PropertyManagement from '../../../pages/Operations/PropertyManagement/PropertyManagement'


const PropertyManagement_Page = () => {
    return (
        <div className='page'>
            <Navbar />
            <Sidebar />
            <div className="page-wrapper">
                <PropertyManagement />

            </div>


        </div>
    )
}

export default PropertyManagement_Page