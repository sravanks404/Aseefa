
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
// import MainRouter from '../router/MainRouter'
// import Pageheader from '../../components/Pageheader'
import Pagebody from '../../components/Pagebody'
import Footer from '../../components/Footer'
import { Balance } from '@mui/icons-material'

import 'bootstrap/dist/js/bootstrap.bundle.min'

import '../../src/assets/demo.min.css'
import '../../src/assets/tabler-flags.min.css'
import '../../src/assets/tabler-payments.min.css'
import '../../src/assets/tabler-vendors.min.css'
import '../../src/assets/tabler.min.css'


const Landingpage = () => {
  return (
    
    <div className="page">
              <Navbar/>

        <Sidebar/>


        <div className="page-wrapper"> 
        <Pagebody/>
        <Footer/>
        </div>
    </div>
  )
}

export default Landingpage