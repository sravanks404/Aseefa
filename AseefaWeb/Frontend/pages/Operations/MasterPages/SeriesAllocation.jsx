import React, { useState, useEffect, useRef } from "react";
import api from '../../apiService';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Allocation() {
   const [message, setMessage] = useState("");
   const [error, setError] = useState("");
   const [loading, setLoading] = useState(false);
   const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
   const [isUpdateDisabled, setIsUpdateDisabled] = useState(false);
   const [isDeleteDisabled, setIsDeleteDisabled] = useState(false);
   const [loadingSubmit, setLoadingSubmit] = useState(false);
   const [loadingUpdate, setLoadingUpdate] = useState(false);
   const tableRef = useRef(null);
   const [loadingDelete, setLoadingDelete] = useState(false);

   const [vehicles, setVehicles] = useState([]);
   const [users, setUsers] = useState([]);
   const today = new Date().toISOString().split('T')[0];

   const [Allocation, setAllocation] = useState({
      AlocId: 0,
      B2CSeries: "",
      B2BSeries: "",
      VanID: "",
      UserId: "",
      Date: today,      // ← sets current date on load
      IsDeleted: 0,
   });

   const [AllocationData, setAllocationData] = useState([]);
   const [searchQuery, setSearchQuery] = useState("");

   useEffect(() => {
      // Fetch Financial Years

      // Fetch Vehicles
      api.get('api/GetVehicle')
         .then(response => {
            setVehicles(response.data);
         })
         .catch(error => {
            console.error('Error fetching vehicles:', error);
         });

      // Fetch Users with CompanyID from sessionStorage
      const CompanyID = sessionStorage.getItem("CompanyID");
      if (CompanyID) {
         api.get('api/GetUsers', { params: { CompanyID } })
            .then(response => {
               setUsers(response.data);
            })
            .catch(error => {
               console.error('Error fetching users:', error);
            });
      }
   }, []);

   const fetchData = async () => {
      try {
         const CompanyID = sessionStorage.getItem("CompanyID");
         if (!CompanyID) {
            toast.error("CompanyID not found in sessionStorage");
            return;
         }

         const response = await api.get("/api/getAllocation", {
            params: { CompanyID },
         });

         const data = response.data.map((item) => ({
            ...item,
            AlocId: item.AlocId || 0,
            B2CSeries: item.B2CSeries || "",
            B2BSeries: item.B2BSeries || "",
            VanID: item.VanID || "",
            UserId: item.UserId || "",
            Date: item.Date || "",
            IsDeleted: item.IsDeleted || 0,
         }));

         setAllocationData(data);
         setIsSubmitDisabled(false);
         setIsUpdateDisabled(true);
         setIsDeleteDisabled(true);
      } catch (error) {
          toast.error("Error fetching Allocation data:", error);
      }
   };


   useEffect(() => {
      fetchData();
   }, []);

   const handleInputChange = (e) => {
      const { name, value } = e.target;
      let updatedValue = value;

      if (name === "B2BSeries") {
         // Ensure prefix B2B/ and clean any existing B2B/
         updatedValue = value.startsWith("B2B/") ? value : `B2B/${value.replace(/^B2B\/?/, '')}`;
      } else if (name === "B2CSeries") {
         // Ensure prefix B2C/ and clean any existing B2C/
         updatedValue = value.startsWith("B2C/") ? value : `B2C/${value.replace(/^B2C\/?/, '')}`;
      }

      setAllocation(prev => ({
         ...prev,
         [name]: updatedValue
      }));
   };





   const handleSubmit = async (e) => {
      e.preventDefault();

      const CompanyID = parseInt(sessionStorage.getItem('CompanyID'), 10);
      const Empid = parseInt(sessionStorage.getItem('UserId'), 10);

      if (isNaN(CompanyID) || isNaN(Empid)) {
          toast.error("Missing CompanyID or Empid.");
         return;
      }

      const newAllocation = {
         ...Allocation,
         IsDeleted: 0,
         CreatedBy: Empid,
         CompanyID,
      };

      try {
         setLoading(true);

         const response = await api.post("/api/insertUpdateAllocation", newAllocation);

         setMessage(response.data.message);
         toast.success(response.data.message || "Allocation submitted successfully!");

         setAllocation({
            AlocId: 0,
            B2CSeries: "",
            B2BSeries: "",
            VanID: "",
            UserId: "",
            Date: today,
            IsDeleted: 0,
         });
      } catch (error) {
         console.error("Submit error:", error);
         toast.error("Failed to submit Allocation.");
      } finally {
         setLoading(false);
         fetchData();
      }
   };



   const handleUpdate = async (e) => {
      e.preventDefault();

      const CompanyID = parseInt(sessionStorage.getItem('CompanyID'), 10);
      const Empid = parseInt(sessionStorage.getItem('UserId'), 10);

      if (isNaN(CompanyID) || isNaN(Empid)) {
         toast.error("Missing CompanyID or Empid.");
         return;
      }

      const updatedAllocation = {
         ...Allocation,
         CompanyID,
         ModifiedBy: Empid,
         ModifiedDate: new Date().toISOString(),
      };

      try {
         setLoadingUpdate(true);

         const response = await api.post("/api/insertUpdateAllocation", updatedAllocation);

         setMessage(response.data.message);
         toast.success(response.data.message || "Allocation updated successfully!");

         setAllocation({
            AlocId: 0,
            B2CSeries: "",
            B2BSeries: "",
            VanID: "",
            UserId: "",
            Date: today,
            IsDeleted: 0,
         });

         await fetchData();
      } catch (error) {
         console.error("Update error:", error);
         toast.error("Update failed.");
         //alert("Update failed!");
      } finally {
         setLoadingUpdate(false);
      }
   };

const confirmDeleteToast = () => {
  return new Promise((resolve) => {
    const toastId = toast.warning(
      ({ closeToast }) => (
        <div>
          <div className="mb-2">Are you sure you want to delete this seriesallocation?</div>
          <div className="d-flex justify-content-end gap-2">
            <button
              className="btn btn btn-danger"
              onClick={() => {
                toast.dismiss(toastId);
                resolve(true);
              }}
            >
              Yes
            </button>
            <button
              className="btn btn btn-secondary"
              onClick={() => {
                toast.dismiss(toastId);
                resolve(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
        toastId: "confirm-delete",
      }
    );
  });
};

   const handleDelete = async (e) => {
      e.preventDefault();
      const Empid = parseInt(sessionStorage.getItem("UserId"), 10);

 const confirm = await confirmDeleteToast(); // 🍞 wait for toast confirmation
  if (!confirm) return;
         try {
            const response = await api.post("/api/deleteAllocation", {
               AlocId: Allocation.AlocId,
               DeletedBy: Empid,
               DeletedDate: new Date().toISOString(),
            });

            setMessage(response.data.message);
            toast.success("Allocation deleted successfully!");

            setAllocation({
               AlocId: 0,
               B2CSeries: "",
               B2BSeries: "",
               VanID: "",
               UserId: "",
               Date: "",
               IsDeleted: 0,
            });

            await fetchData();
         } catch (error) {
            console.error("Delete error:", error);
            toast.error("Delete failed.");
            //alert("Delete failed!");
         }
   
   };



   const handleClear = () => {
      setMessage("");
      setError("");
      setAllocation({
         AlocId: 0,
         B2CSeries: "",
         B2BSeries: "",
         VanID: "",
         UserId: "",
         Date: today,
         IsDeleted: 0,
      });
      fetchData();
   };

const handleRowClick = (item) => {

   const formattedDate = new Date(item.datealoctn).toISOString().split('T')[0];

   setAllocation({
      ...item,
      Date: formattedDate,
      IsDeleted: 0,
   });

   setIsSubmitDisabled(true);
   setIsUpdateDisabled(false);
   setIsDeleteDisabled(false);
   setError("");

   window.scrollTo({ top: 0, behavior: "smooth" });
};


   const handleSearchChange = (e) => {
      setSearchQuery(e.target.value);
   };

   const filteredAllocationData = AllocationData.filter((item) =>
      item.B2CSeries.toLowerCase().includes(searchQuery.toLowerCase())
   ).sort((a, b) => {
      const aStartsWith = a.B2CSeries.toLowerCase().startsWith(searchQuery.toLowerCase());
      const bStartsWith = b.B2CSeries.toLowerCase().startsWith(searchQuery.toLowerCase());

      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      return a.B2CSeries.localeCompare(b.B2CSeries);
   });


   return (
      <div className="page-wrapper">
         <div className="container-fluid">
             <ToastContainer position="top-center" autoClose={3000} />
            <div className="page-header d-print-none mt-2">
               <div className="row g-2 align-items-center">
                  <div className="col">
                     <h2 className="page-title">Allocation Master</h2>
                  </div>
               </div>
            </div>
            <div className="page-body">
               <div className="container-fluid">
                  <div className="row row-cards">
                     <div className="col-12">
                        <div className="card">
                           <div className="card-body">
                              <form className="Allocation-form" onSubmit={handleSubmit}>
                                 <div className="row g-4">
                                    <div className="row gy-3">

                                       <div className="col-4 d-flex align-items-center">
                                          <label className="me-2 mb-0" style={{ width: '140px' }}>Date:</label>
                                          <input
                                             type="date"
                                             name="Date"
                                             className="form-control"
                                             style={{ height: '38px' }}
                                             value={Allocation.Date}
                                             onChange={handleInputChange}
                                             required
                                          />
                                       </div>






                                       {/* Vehicle Dropdown */}
                                       <div className="col-4 d-flex align-items-center">
                                          <label className="me-2 mb-0" style={{ width: '140px' }}>Vehicle:</label>
                                          <select
                                             name="VanID"
                                             className="form-control"
                                             style={{ height: '35px', textAlignLast: 'center' }}
                                             value={Number(Allocation.VanID)} // Ensure it's a number
                                             onChange={handleInputChange}
                                             required
                                          >
                                             <option value="">Select Vehicle</option>
                                             {vehicles.map(v => (
                                                <option key={v.VID} value={v.VID}>
                                                   {v.VRegNo}
                                                </option>
                                             ))}
                                          </select>


                                       </div>

                                       {/* User Dropdown */}
                                       <div className="col-4 d-flex align-items-center">
                                          <label className="me-2 mb-0" style={{ width: '140px' }}>User:</label>
                                          <select
                                             name="UserId"
                                             className="form-control"
                                             style={{ height: '35px' }}
                                             value={Allocation.UserId}
                                             onChange={handleInputChange}
                                             required
                                          >
                                             <option value="">Select User</option>
                                             {users.map(user => (
                                                <option key={user.UserID} value={user.UserID}>
                                                   {user.USERNAME}
                                                </option>
                                             ))}
                                          </select>
                                       </div>


                                       {/* B2B Series */}
                                       <div className="col-4 d-flex align-items-center">
                                          <label className="me-2 mb-0" style={{ width: '140px' }}>B2B Series:</label>
                                          <input
                                             type="text"
                                             name="B2BSeries"
                                             className="form-control"
                                             style={{ height: '38px' }}
                                             value={Allocation.B2BSeries}
                                             onChange={handleInputChange}
                                             placeholder="Enter B2B Series"
                                             required
                                          />
                                       </div>

                                       {/* B2C Series */}
                                       <div className="col-4 d-flex align-items-center">
                                          <label className="me-2 mb-0" style={{ width: '140px' }}>B2C Series:</label>
                                          <input
                                             type="text"
                                             name="B2CSeries"
                                             className="form-control"
                                             style={{ height: '38px' }}
                                             value={Allocation.B2CSeries}
                                             onChange={handleInputChange}
                                             placeholder="Enter B2C Series"
                                             required
                                          />
                                       </div>


                                    </div>
                                 </div>

                                 {/* Footer Buttons */}
                                 <div className="form-footer d-flex justify-content-center mt-4 gap-3 flex-wrap">
                                    <button type="submit" className="btn btn" disabled={isSubmitDisabled || loadingSubmit}>
                                       {loadingSubmit ? "Submitting..." : "Submit"}
                                    </button>
                                    <button type="button" className="btn btn" disabled={isUpdateDisabled || loadingUpdate} onClick={handleUpdate}>
                                       {loadingUpdate ? "Updating..." : "Update"}
                                    </button>
                                    <button type="button" className="btn btn" disabled={isDeleteDisabled || loadingDelete} onClick={handleDelete}>
                                       {loadingDelete ? "Deleting..." : "Delete"}
                                    </button>
                                    <button type="button" className="btn btn" onClick={handleClear}>
                                       Clear
                                    </button>
                                 </div>

                                 {/* Status Messages */}
                                 {/* {error && <div className="alert alert-danger mt-3">{error}</div>}
                                 {message && <div className="alert alert-success mt-3">{message}</div>} */}
                              </form>
                           </div>
                        </div>
                     </div>


                     <div className="col-12">
                        <div className="card">
                           <div className="card-header">
                              <h3 className="card-title">Allocation List</h3>
                              <div className="col-auto ms-auto d-print-none">
                                 <div className="d-flex">
                                    <div className="me-3">
                                       <div className="input-icon">
                                          <input
                                             type="text"
                                             className="form-control"
                                             placeholder="Search…"
                                             value={searchQuery}
                                             onChange={handleSearchChange}
                                          />
                                          <span className="input-icon-addon">
                                             <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="icon"
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                strokeWidth="2"
                                                stroke="currentColor"
                                                fill="none"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                             >
                                                <path
                                                   stroke="none"
                                                   d="M0 0h24v24H0z"
                                                   fill="none"
                                                />
                                                <circle cx="10" cy="10" r="7" />
                                                <line x1="21" y1="21" x2="15" y2="15" />
                                             </svg>
                                          </span>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                           <div ref={tableRef} className="card-body">
                              <table className="table table-bordered">
                                 <thead>
                                    <tr>
                                       <th>User</th>
                                       <th>Vehicle</th>
                                       <th>B2B Series</th>
                                       <th>B2C Series </th>
                                    </tr>
                                 </thead>
                                 <tbody>
                                    {filteredAllocationData.map((item) => (
                                       <tr
                                          key={item.AlocId}
                                          onClick={() => handleRowClick(item)}
                                       >
                                          <td>{users.find(users => users.UserID === item.UserId)?.USERNAME || 'N/A'}</td>
                                          <td>{vehicles.find(vehicles => vehicles.VID === item.VanID)?.VRegNo || 'N/A'}</td>
                                          <td>{item.B2BSeries}</td>
                                          <td>{item.B2CSeries}</td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
export default Allocation;