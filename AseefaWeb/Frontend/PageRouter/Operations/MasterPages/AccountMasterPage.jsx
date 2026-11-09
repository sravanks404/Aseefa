import React from 'react'
import Navbar from "../../../components/Navbar"
import Sidebar from "../../../components/Sidebar"
import AccountMaster from '../../../pages/Operations/MasterPages/AccountMaster'
const AccountMasterPage = () => {
  return (
    <div className="page">
       <Navbar/>    
       <Sidebar/>
        <div className="page-wrapper">
            <AccountMaster/>
        </div>
    </div>
  )
}

export default AccountMasterPage