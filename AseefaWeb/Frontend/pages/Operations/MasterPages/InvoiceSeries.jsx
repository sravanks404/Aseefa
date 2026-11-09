import React, { useState, useEffect, useRef } from "react";
import api from '../../apiService';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function InvoiceSeries() {
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
   const [financialYears, setFinancialYears] = useState([]);

   const [InvoiceSeries, setInvoiceSeries] = useState({
      SID: 0,
      Series: "",
      InvType: "",
      FYearID: "",
      CompanyID: "",
      CreatedBy: "",
      IsDeleted: ""
   });
   const [InvoiceSeriesData, setInvoiceSeriesData] = useState([]);
   const [searchQuery, setSearchQuery] = useState("");

   useEffect(() => {
      // Fetch Financial Year list
      api.get('api//GetFinancialYear')
         .then(response => {
            setFinancialYears(response.data);
         })
         .catch(error => {
            console.error('Error fetching financial years:', error);
         });
   }, []);

   const fetchData = async () => {
      try {
         const CompanyID = sessionStorage.getItem("CompanyID"); // Retrieve CompanyID from sessionStorage

         if (!CompanyID) {
            console.error("CompanyID not found in sessionStorage");
            return;
         }

         const response = await api.get("/api/getInvoiceSeries", {
            params: { CompanyID }, // Pass CompanyID as a query parameter
         });

         const data = response.data.map((item) => ({
            ...item,
            SID: item.SID || 0,
            Series: item.Series || "",
            InvType: item.InvType || "",
            Country: item.Country || "",
            State: item.State || "",
            District: item.District || "",
            City: item.City || "",
            Pincode: item.Pincode || "",
            Phoneno: item.Phoneno || "",
            Mobileno: item.Mobileno || "",
            CreatedBy: item.CreatedBy || "",
         }));

         setInvoiceSeriesData(data);
         setIsSubmitDisabled(false);
         setIsUpdateDisabled(true);
         setIsDeleteDisabled(true);
      } catch (error) {
         console.error("Error fetching InvoiceSeries data:", error);
      }
   };

   useEffect(() => {
      fetchData();
   }, []);

   const handleInputChange = (e) => {
      const { name, value } = e.target;

      setInvoiceSeries(prev => {
         const newState = { ...prev };

         if (name === 'InvType') {
            newState.InvType = value;
            // Update Series only if it already has a /
            const parts = prev.Series.split('/');
            const suffix = parts.length > 1 ? parts.slice(1).join('/') : parts[0];
            newState.Series = `${value}/${suffix}`;
         } else if (name === 'Series') {
            // Allow full user input (including slashes), don't override
            newState.Series = value;
         } else {
            newState[name] = value;
         }

         return newState;
      });
   };


   const checkDuplicateSeries = (Series, currentSID = null) => {
      return InvoiceSeriesData.some((InvoiceSeries) => {
         // Convert both to lowercase for case-insensitive comparison
         const isSameName = InvoiceSeries.Series.toLowerCase() === Series.toLowerCase();

         if (currentSID) {
            // During update, exclude the current InvoiceSeries itself
            return isSameName && InvoiceSeries.SID !== currentSID;
         } else {
            // During create (submit), just check for any match
            return isSameName;
         }
      });
   };


   const handleSubmit = async (e) => {
      e.preventDefault();

      if (checkDuplicateSeries(InvoiceSeries.Series)) {
          toast.error("InvoiceSeries Name already exists. Please choose a different name.");
         return;
      }

      // Retrieve and parse as integers
      const CompanyID = parseInt(sessionStorage.getItem('CompanyID'), 10);
      const Empid = parseInt(sessionStorage.getItem('UserId'), 10);


      // Check if they exist
      if (isNaN(CompanyID) || isNaN(Empid)) {
         toast.error("Missing or invalid CompanyID or Empid. Please log in again.");
         return;
      }

      // Construct the new InvoiceSeries object
      const newInvoiceSeries = {
         ...InvoiceSeries,
         IsDeleted: 0,
         CreatedBy: Empid,
         CreatedDate: new Date().toISOString(),
         CompanyID: CompanyID,
      };


      try {
         setLoading(true);
         const response = await api.post("/api/insertInvoiceSeries", newInvoiceSeries);

         setMessage(response.data.message);
         toast.success("InvoiceSeries information submitted successfully!");

         // Reset the InvoiceSeries form after submission
         setInvoiceSeries({
            Series: "",
            InvType: "",
            Country: "",
            State: "",
            District: "",
            City: "",
            Pincode: "",
            Phoneno: "",
            Mobileno: "",
            CompanyID: "",
         });
      } catch (error) {
         console.error("Error submitting data:", error);
         toast.error("Failed to submit InvoiceSeries information. Please try again.");
      } finally {
         setLoading(false);
         // Call fetchData to refresh the data
         fetchData();
      }
   };

   const handleUpdate = async (e) => {
      e.preventDefault();

      if (checkDuplicateSeries(InvoiceSeries.Series, InvoiceSeries.SID)) {
        toast.error("InvoiceSeries Name already exists. Please choose a different name.");
         return;
      }

      try {
         setLoadingUpdate(true);

         const CompanyID = sessionStorage.getItem('CompanyID');
         const Empid = sessionStorage.getItem('UserId');

         const updatedInvoiceSeries = {
            ...InvoiceSeries,
            CompanyID: CompanyID ? parseInt(CompanyID, 10) : 0,
            ModifiedBy: Empid ? parseInt(Empid, 10) : 0, // Use Empid for ModifiedBy
            ModifiedDate: new Date().toISOString(),
         };

         const response = await api.post("/api/updateInvoiceSeries", updatedInvoiceSeries);

         setMessage(response.data.message);
        toast.success("InvoiceSeries updated successfully!");
         setInvoiceSeries({
            SID: 0,
            Series: "",
            InvType: "",
            Country: "",
            State: "",
            District: "",
            City: "",
            Pincode: "",
            Phoneno: "",
            Mobileno: "",
            ModifiedBy: 0,
            ModifiedDate: new Date().toISOString(),
         });

         await fetchData();
      } catch (error) {
         console.error("Error from server:", error);
         toast.success(
            error.response?.data?.message || "An error occurred while updating"
         );
        // alert("Failed to update data!");
      } finally {
         setLoadingUpdate(false);
      }
   };

const confirmDeleteToast = () => {
  return new Promise((resolve) => {
    const toastId = toast.warning(
      ({ closeToast }) => (
        <div>
          <div className="mb-2">Are you sure you want to delete this user?</div>
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
      const Empid = sessionStorage.getItem("UserId");

 const confirm = await confirmDeleteToast(); // 🍞 wait for toast confirmation
  if (!confirm) return;
         try {
            const response = await api.post("/api/deleteInvoiceSeries", {
               SID: parseInt(InvoiceSeries.SID),
               DeletedBy: Empid ? parseInt(Empid, 10) : 0,
               DeletedDate: new Date().toISOString(),
            });

            //setMessage(response.data.message);
            toast.success("InvoiceSeries deleted successfully!");

            setInvoiceSeries({
               SID: 0,
               Series: "",
               InvType: "",
               Country: "",
               State: "",
               District: "",
               City: "",
               Pincode: "",
               Phoneno: "",
               Mobileno: "",
               CompanyID: "",
            });

            await fetchData();
         } catch (error) {
            console.error("Error from server:", error);
            setError(error.response?.data?.error || "An error occurred while deleting");
            toast.error("Failed to delete data!");
         }
  
   };



   const handleClear = () => {
      setMessage("");
      setError("");
      setInvoiceSeries({
         SID: 0,
         Series: "",
         InvType: "",
         Country: "",
         State: "",
         District: "",
         City: "",
         Pincode: "",
         Phoneno: "",
         Mobileno: "",
         CreatedBy: "",
      });
      fetchData();
   };

   const handleRowClick = (item) => {
      setInvoiceSeries({
         ...item,
         SID: item.SID,
         Series: item.Series,
         InvType: item.InvType || "",
         Country: item.Country || "",
         State: item.State || "",
         District: item.District || "",
         City: item.City || "",
         Pincode: item.Pincode || "",
         Phoneno: item.Phoneno || "",
         Mobileno: item.Mobileno || "",
         CreatedBy: "",
         CreatedDate: new Date().toISOString(),
         ModifiedBy: 0,
         ModifiedDate: new Date().toISOString(),
         DeletedBy: 0,
         DeletedDate: new Date().toISOString(),
         IsDeleted: 0,
      });
      setIsSubmitDisabled(true);
      setIsUpdateDisabled(false);
      setIsDeleteDisabled(false);
      setError("");

      window.scrollTo({ top: 0, behavior: "smooth" }); // Adjust behavior as needed
   };

   const handleSearchChange = (e) => {
      setSearchQuery(e.target.value);
   };

   const filteredInvoiceSeriesData = InvoiceSeriesData.filter((item) =>
      item.Series.toLowerCase().includes(searchQuery.toLowerCase())
   ).sort((a, b) => {
      const aStartsWith = a.Series.toLowerCase().startsWith(
         searchQuery.toLowerCase()
      );
      const bStartsWith = b.Series.toLowerCase().startsWith(
         searchQuery.toLowerCase()
      );

      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      return a.Series.localeCompare(b.Series);
   });


   return (
      <div className="page-wrapper">
         <div className="container-fluid">
              <ToastContainer position="top-center" autoClose={3000} />
            <div className="page-header d-print-none mt-2">
               <div className="row g-2 align-items-center">
                  <div className="col">
                     <h2 className="page-title">InvoiceSeries Master</h2>
                  </div>
               </div>
            </div>
            <div className="page-body">
               <div className="container-fluid">
                  <div className="row row-cards">
                     <div className="col-12">
                        <div className="card">
                           <div className="card-body">
                              <form className="InvoiceSeries-form" onSubmit={handleSubmit}>
                                 <div className="row g-4">
                                    <div className="row gy-3">

                                       {/* InvType Dropdown */}
                                       <div className="col-3 d-flex align-items-center">
                                          <label className="me-2 mb-0" style={{ width: '140px' }}>InvType:</label>
                                          <select name="InvType" className="form-control" style={{ height: '38px' }} value={InvoiceSeries.InvType} onChange={handleInputChange} required>
                                             <option value="">Select InvType</option>
                                             <option value="B2B">B2B Series</option>
                                             <option value="B2C">B2C Series</option>
                                          </select>
                                       </div>

                                       {/* Series Input with Prefix */}
                                       <div className="col-5 d-flex align-items-center">
                                          <label className="me-2 mb-0" style={{ width: '140px' }}>Series Name:</label>
                                          <input
                                             type="text"
                                             name="Series"
                                             className="form-control"
                                             style={{ height: '38px' }}
                                             value={InvoiceSeries.Series}
                                             onChange={handleInputChange}
                                             placeholder="Enter Series Name"
                                             required
                                          />
                                       </div>

                                       {/* Financial Year Dropdown */}
                                       <div className="col-4 d-flex align-items-center">
                                          <label className="me-2 mb-0" style={{ width: '140px' }}>Financial Year:</label>
                                          <select
                                             name="FYearID"
                                             className="form-control"
                                             style={{ height: '38px' }}
                                             value={InvoiceSeries.FYearID}
                                             onChange={handleInputChange}
                                             required
                                          >
                                             <option value="">Select Financial Year</option>
                                             {financialYears.map(fy => (
                                                <option key={fy.FYearID} value={fy.FYearID}>
                                                   {fy.FYear}
                                                </option>
                                             ))}
                                          </select>
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
                              <h3 className="card-title">Invoice Series List</h3>
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
                                       <th>InvType</th>
                                       <th>Invoice Series </th>
                                       <th>Financial Year</th>
                                    </tr>
                                 </thead>
                                 <tbody>
                                    {filteredInvoiceSeriesData.map((item) => (
                                       <tr
                                          key={item.SID}
                                          onClick={() => handleRowClick(item)}
                                       >
                                          <td>{item.InvType}</td>
                                          <td>{item.Series}</td>
                                          <td>{financialYears.find(financialYears => financialYears.FYearID === item.FYearID)?.FYear || 'N/A'}</td>


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
export default InvoiceSeries;