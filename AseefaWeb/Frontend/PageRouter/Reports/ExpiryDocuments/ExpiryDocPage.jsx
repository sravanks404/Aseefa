import React from 'react'
import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import ExpiryDoc from '../../../pages/Reports/ExpiryDocuments/ExpiryDoc'

const ExpiryDocumentspage = () => {
    return (
      <div className='page'>
      <Navbar />
      <Sidebar />
          <div className="page-wrapper">
              <ExpiryDoc/>
          </div>
      </div>
    )
  }
export default ExpiryDocumentspage