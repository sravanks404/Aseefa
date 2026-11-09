//import React from 'react'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import Resetpassword from '../../pages/Login/Resetpassword'

const Resetpasswordpage = () => {
  return (
    <div className='page'>
     <Navbar />
      <Sidebar />

        <div className="page-wrapper">
            <Resetpassword/>
        </div>
    </div>
  )
}

export default Resetpasswordpage