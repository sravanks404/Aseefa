import Sidebar from '../../../components/Sidebar'
import Navbar from '../../../components/Navbar'
import UserPermission from '../../../pages/Operations/UserPermission/UserPermission'
const UserPermissionpage = () => {
  return (
    <div className='page'>
      <Navbar />
      <Sidebar />
      <div className="page-wrapper">
        <UserPermission />
      </div>
    </div>
  )
}
export default UserPermissionpage 