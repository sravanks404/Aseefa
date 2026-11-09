import React, { useState, useEffect, useRef } from "react";
import api from '../../apiService';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function ItemCreation() {
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
   const [Item, setItem] = useState({
      ItemID: 0,
      ItemName: "",
      CompanyID: "",
      CreatedBy: "",
      CreatedDate: "",
      ModifiedBy: "",
      ModifiedDate: "",
      IsDeleted: 0,
      TaxID: "",
      Tax: "",
      itmsize: "",
      itmcolr: "",
      Sales_Price: "",
      MRP: "",
      WholeSalePrice: "",
      BPprice: "",
      SP: "",
      BatchId: "",
      BatchName: "",
      ItemDescription: "",
      ItemCategoryID: "",
      ItemType: "",
      DeletedBy: "",
      DeletedDateAndTime: "",
   });

   const [itemData, setItemData] = useState([]);
   const [searchQuery, setSearchQuery] = useState("");

   const [categories, setCategories] = useState([
      
      { id: 1, name: 'Default' },
      { id: 2, name: 'Medical Disposables' },
      { id: 3, name: 'Orthopedics Support' },
      { id: 4, name: 'Rehabilitation Products' },
      { id: 5, name: 'Oxygen Cylinders' },
      { id: 6, name: 'First Aid Products' },
      { id: 7, name: 'Surgical Equipments' },
      { id: 8, name: 'Medicine' },
      { id: 9, name: 'Medical Devices' },


   ]);


   const fetchData = async () => {
      try {
         const CompanyID = sessionStorage.getItem("CompanyID");
         if (!CompanyID) {
            console.error("CompanyID not found in sessionStorage");
            return;
         }

         const response = await api.get("/api/GetItem", {
            params: { CompanyID },
         });

         // Filter out duplicates by ItemID
         const rawData = response.data;
         const uniqueItemsMap = new Map();
         rawData.forEach((item) => {
            const id = item.ItemID || 0;
            if (!uniqueItemsMap.has(id)) {
               uniqueItemsMap.set(id, {
                  ItemID: id,
                  ItemName: item.ItemName || "",
                  CompanyID: item.CompanyID || "",
                  ItemDescription: item.ItemDescription || "",
                  ItemCategoryID: String(item.ItemCategoryID),
                  ItemType: item.ItemType || "",
                  itmsize: item.itmsize || "",
                  itmcolr: item.itmcolr || "",
                  TaxID: item.TaxID || "",
                  Tax: item.Tax || "",
                  IsDeleted: item.IsDeleted || 0,
                  CreatedBy: item.CreatedBy || "",
                  CreatedDate: item.CreatedDate || "",
                  ModifiedBy: item.ModifiedBy || "",
                  ModifiedDate: item.ModifiedDate || "",
                  DeletedBy: item.DeletedBy || "",
                  DeletedDateAndTime: item.DeletedDateAndTime || "",
                  Sales_Price: item.Sales_Price || "",
                  MRP: item.MRP || "",
                  WholeSalePrice: item.WholeSalePrice || "",
                  BPprice: item.BPprice || "",
                  SP: item.SP || "",
                  BatchId: item.BatchId || "",
                  BatchName: item.BatchName || "",
               });
            }
         });

         setItemData([...uniqueItemsMap.values()]);
         setIsSubmitDisabled(false);
         setIsUpdateDisabled(true);
         setIsDeleteDisabled(true);
      } catch (error) {
         console.error("Error fetching item data:", error);
      }
   };



   useEffect(() => {
      fetchData();
   }, []);

   const handleInputChange = (e) => {
      const { name, value } = e.target;
      setItem((prevItem) => ({
         ...prevItem,
         [name]: value,
      }));
      setError("");
   };

   // useEffect(() => {
   //   const itemId = 2888; // Replace dynamically as needed

   //   const fetchImages = async () => {
   //     try {
   //       const response = await api.get("/api/getitemimages", {
   //         params: { ItemID: itemId },
   //       });

   //       if (response.data.success) {
   //         setImages(response.data.images);
   //       } else {
   //         console.error("Error fetching images:", response.data.message);
   //       }
   //     } catch (err) {
   //       console.error("Fetch error:", err);
   //     }
   //   };

   //   fetchImages();
   // }, []);


   function dataURLtoFile(dataUrl, filename) {
      const arr = dataUrl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'; // fallback
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);

      while (n--) {
         u8arr[n] = bstr.charCodeAt(n);
      }

      return new File([u8arr], filename, { type: mime });
   }

   const handleSubmit = async (e) => {
      e.preventDefault();

      const CompanyID = parseInt(sessionStorage.getItem('CompanyID'), 10);
      const CreatedBy = parseInt(sessionStorage.getItem('UserId'), 10);

      if (isNaN(CompanyID) || isNaN(CreatedBy)) {
         toast.error("Invalid CompanyID or CreatedBy");
         return;
      }

      const newItem = {
         ...Item,
         CompanyID,
         CreatedBy,
         CreatedDate: new Date().toISOString(),
         IsDeleted: 0,
      };

      try {
         setLoadingSubmit(true);

         const formData = new FormData();

         // Append item fields
         for (const key in newItem) {
            if (newItem[key] !== undefined && newItem[key] !== null) {
               formData.append(key, newItem[key]);
            }
         }

         // Debug: log newItem content

         // Append images
         images.forEach((imgObj, index) => {
            if (imgObj?.file) {
               formData.append("images", imgObj.file);
               formData.append("RECNOs", imgObj.RECNO || 0);
            } else {
            }
         });


         // Debug: show FormData contents (for text entries only)
         for (let [key, value] of formData.entries()) {
            if (value instanceof File) {
            } else {
            }
         }

         const response = await api.post("/api/insertupdateitem", formData, {
            headers: { "Content-Type": "multipart/form-data" },
         });

         setMessage(response.data.message || "Item submitted!");
         toast.success("Item submitted successfully!");

         setItem({ /* reset item fields */ });
         setImages([null, null, null, null, null]);
         handleClear();

      } catch (error) {
         console.error("Submit error:", error);
        toast.error("Failed to submit item");
      } finally {
         setLoadingSubmit(false);
      }
   };

   const handleUpdate = async () => {
      const CompanyID = parseInt(sessionStorage.getItem('CompanyID'), 10);
      const ModifiedBy = parseInt(sessionStorage.getItem('UserId'), 10);

      if (isNaN(CompanyID) || isNaN(ModifiedBy)) {
         toast.error("Invalid CompanyID or ModifiedBy");
         return;
      }

      if (!Item.ItemID || Item.ItemID === 0) {
        toast.error("Invalid ItemID for update");
         return;
      }

      const updatedItem = {
         ...Item,
         CompanyID,
         ModifiedBy,
         ModifiedDate: new Date().toISOString(),
         IsDeleted: 0,
      };

      try {
         setLoadingSubmit(true);

         const formData = new FormData();

         // Append item fields
         Object.keys(updatedItem).forEach((key) => {
            formData.append(key, updatedItem[key]);
         });

         // Append image files and RECNOs
         images.forEach((img, index) => {
            if (img?.file instanceof File) {
               formData.append("images", img.file); // backend expects field name `images`
               formData.append("RECNOs", img.RECNO ?? 0);
            }
         });

         const response = await api.post("/api/insertupdateitem", formData, {
            headers: {
               "Content-Type": "multipart/form-data",
            },
         });

         setMessage(response.data.message || "Item updated successfully!");
         toast.success("Item updated successfully!");

         // Reset form
         setItem({
            ItemID: 0,
            ItemName: "",
            CompanyID: "",
            CreatedBy: "",
            CreatedDate: "",
            ModifiedBy: "",
            ModifiedDate: "",
            IsDeleted: 0,
            TaxID: "",
            Tax: "",
            itmsize: "",
            itmcolr: "",
            Sales_Price: "",
            MRP: "",
            WholeSalePrice: "",
            BPprice: "",
            SP: "",
            BatchId: "",
            BatchName: "",
            ItemDescription: "",
            ItemCategoryID: "",
            ItemType: "",
            DeletedBy: "",
            DeletedDateAndTime: "",
         });
         setImages([null, null, null, null]);
         handleClear();

      } catch (error) {
         console.error("Update error:", error);
        toast.error("Failed to update item");
      } finally {
         setLoadingSubmit(false);
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
            const response = await api.post("/api/deleteitem", {
               ItemID: parseInt(Item.ItemID),
               DeletedBy: Empid ? parseInt(Empid, 10) : 0,
               DeletedDate: new Date().toISOString(),
            });

            setMessage(response.data.message);
           toast.success("Item deleted successfully!");

            setItem({
               ItemID: 0,
               ItemName: "",
               CompanyID: "",
               CreatedBy: "",
               CreatedDate: "",
               ModifiedBy: "",
               ModifiedDate: "",
               IsDeleted: 0,
               TaxID: "",
               Tax: "",
               itmsize: "",
               itmcolr: "",
               Sales_Price: "",
               MRP: "",
               WholeSalePrice: "",
               BPprice: "",
               SP: "",
               BatchId: "",
               BatchName: "",
               ItemDescription: "",
               ItemCategoryID: "",
               ItemType: "",
               DeletedBy: "",
               DeletedDateAndTime: "",
            });

            await fetchData();
            handleClear();
         } catch (error) {
            console.error("Error from server:", error);
            setError(error.response?.data?.error || "An error occurred while deleting");
            toast.error("Failed to delete data!");
         }
      
   };


   const handleClear = () => {
      setMessage("");
      setError("");
      setItem({
         ItemID: 0,
         ItemName: "",
         CompanyID: "",
         CreatedBy: "",
         CreatedDate: "",
         ModifiedBy: "",
         ModifiedDate: "",
         IsDeleted: 0,
         TaxID: "",
         Tax: "",
         itmsize: "",
         itmcolr: "",
         Sales_Price: "",
         MRP: "",
         WholeSalePrice: "",
         BPprice: "",
         SP: "",
         BatchId: "",
         BatchName: "",
         ItemDescription: "",
         ItemCategoryID: "",
         ItemType: "",
         DeletedBy: "",
         DeletedDateAndTime: "",
      });
      fetchData();
      setImages([null, null, null, null]);

   };

   const handleRowClick = async (item) => {
      setItem({ ...item });
      setIsSubmitDisabled(true);
      setIsUpdateDisabled(false);
      setIsDeleteDisabled(false);
      setError("");
      window.scrollTo({ top: 0, behavior: "smooth" });

      try {
         const response = await api.get("/api/getitemimages", {
            params: { ItemID: item.ItemID },
         });

         if (response.data.success) {
            const imageObjects = response.data.images.map((img) => ({
               file: dataURLtoFile(img.imageBase64, `image_${img.RECNO}.jpg`),
               RECNO: img.RECNO,
            }));

            // Fill empty slots if less than 5
            while (imageObjects.length < 4) {
               imageObjects.push({ file: null, RECNO: 0 });
            }

            setImages(imageObjects);
         }
      } catch (err) {
         console.error("Error loading images:", err);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
   };


   const handleSearchChange = (e) => {
      setSearchQuery(e.target.value.trim());
   };

   const filteredItemData = itemData
      .filter((item) => {
         const query = searchQuery.toLowerCase();
         return item.ItemName?.toLowerCase().includes(query);
      })
      .sort((a, b) => {
         const query = searchQuery.toLowerCase();
         const aName = a.ItemName?.toLowerCase() || "";
         const bName = b.ItemName?.toLowerCase() || "";

         const aStarts = aName.startsWith(query);
         const bStarts = bName.startsWith(query);

         if (aStarts && !bStarts) return -1;
         if (!aStarts && bStarts) return 1;
         return aName.localeCompare(bName);
      });


   const [images, setImages] = useState([null, null, null, null]);
   const handleImageChange = (e, index) => {
      const file = e.target.files[0];
      if (file) {
         const newImages = [...images];
         const existingRECNO = newImages[index]?.RECNO || 0; // preserve existing RECNO
         newImages[index] = { file, RECNO: existingRECNO };
         setImages(newImages);
      }
   };

   return (
      <div className="page-wrapper">
         <div className="container-fluid">
              <ToastContainer position="top-center" autoClose={3000} />
            <div className="page-header d-print-none mt-2">
               <div className="row g-2 align-items-center">
                  <div className="col">
                     <h2 className="page-title"> Item Creation</h2>
                  </div>
               </div>
            </div>
            <div className="page-body">
               <div className="container-fluid">
                  <div className="row row-cards">
                     <div className="col-12">
                        <div className="card">
                           <div className="card-body">
<form onSubmit={handleSubmit}>
  <div className="container-fluid">
    {/* Form Fields in Two Columns */}
    <div className="row g-3">
      {/* Item Category */}
      <div className="col-md-6 d-flex align-items-center">
        <label className="form-label mb-0 text-end me-2" style={{ minWidth: '120px' }}>
          Item Category:
        </label>
        <select
          className="form-select flex-grow-1"
          name="ItemCategoryID"
          value={Item.ItemCategoryID}
          onChange={handleInputChange}
          required
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={String(cat.id)}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Item Name */}
      <div className="col-md-6 d-flex align-items-center">
        <label className="form-label mb-0 text-end me-2" style={{ minWidth: '120px' }}>
          Item Name:
        </label>
        <input
          type="text"
          className="form-control flex-grow-1"
          name="ItemName"
          value={Item.ItemName}
          onChange={handleInputChange}
          placeholder="Enter Item Name"
          style={{ height: '30px' }}
          required
        />
      </div>

      {/* Description */}
      <div className="col-md-6 d-flex align-items-start">
        <label className="form-label mb-0 text-end pt-2 me-2" style={{ minWidth: '120px' }}>
          Description:
        </label>
        <textarea
          className="form-control flex-grow-1"
          name="ItemDescription"
          value={Item.ItemDescription}
          onChange={handleInputChange}
          rows={3}
          placeholder="Enter Item Description"
          required
        />
      </div>

      {/* Colour */}
      <div className="col-md-6 d-flex align-items-center">
        <label className="form-label mb-0 text-end me-2" style={{ minWidth: '120px' }}>
          Colour:
        </label>
        <input
          type="text"
          className="form-control flex-grow-1"
          name="itmcolr"
          value={Item.itmcolr}
          onChange={handleInputChange}
          placeholder="Enter Colour"
          style={{ height: '30px' }}
        />
      </div>

      {/* Size */}
      <div className="col-md-6 d-flex align-items-center">
        <label className="form-label mb-0 text-end me-2" style={{ minWidth: '120px' }}>
          Size:
        </label>
        <input
          type="text"
          className="form-control flex-grow-1"
          name="itmsize"
          value={Item.itmsize}
          onChange={handleInputChange}
          placeholder="Enter Size L*B*H"
          style={{ height: '30px' }}
        />
      </div>

      {/* MRP */}
      <div className="col-md-6 d-flex align-items-center">
        <label className="form-label mb-0 text-end me-2" style={{ minWidth: '120px' }}>
          MRP:
        </label>
        <input
          type="text"
          className="form-control flex-grow-1"
          name="MRP"
          value={Item.MRP}
          onChange={handleInputChange}
          placeholder="Enter MRP"
          style={{ height: '30px' }}
          required
        />
      </div>

      {/* CCP */}
      <div className="col-md-6 d-flex align-items-center">
        <label className="form-label mb-0 text-end me-2" style={{ minWidth: '120px' }}>
          CCP:
        </label>
        <input
          type="text"
          className="form-control flex-grow-1"
          name="Sales_Price"
          value={Item.Sales_Price}
          onChange={handleInputChange}
          placeholder="Enter CCP"
          style={{ height: '30px' }}
          required
        />
      </div>

      {/* Optional Fields - Uncomment if needed */}
      {/*
      <div className="col-md-6 d-flex align-items-center">
        <label className="form-label mb-0 text-end me-2" style={{ minWidth: '120px' }}>
          DP:
        </label>
        <input
          type="text"
          className="form-control flex-grow-1"
          name="BPprice"
          value={Item.BPprice}
          onChange={handleInputChange}
          placeholder="Enter DP"
          style={{ height: '28px' }}
          required
        />
      </div>

      <div className="col-md-6 d-flex align-items-center">
        <label className="form-label mb-0 text-end me-2" style={{ minWidth: '120px' }}>
          SP:
        </label>
        <input
          type="text"
          className="form-control flex-grow-1"
          name="SP"
          value={Item.SP}
          onChange={handleInputChange}
          placeholder="Enter SP"
          style={{ height: '28px' }}
          required
        />
      </div>
      */}
    </div>

    {/* Image Upload */}
    <div className="mt-4">
      <label className="form-label fw-bold">Upload Images</label>
      <div className="row g-3">
        {images.map((img, index) => (
          <div key={index} className="col-6 col-sm-4 col-md-3">
            <div className="border rounded p-2 text-center bg-light position-relative" style={{ height: '150px' }}>
              {img?.file || img?.imageBase64 ? (
                <img
                  src={img?.file ? URL.createObjectURL(img.file) : img.imageBase64}
                  alt={`preview-${index}`}
                  className="img-fluid h-100 object-fit-cover"
                />
              ) : (
                <div className="text-muted small d-flex align-items-center justify-content-center h-100">
                  No image selected
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e, index)}
                className="form-control position-absolute top-0 start-0 w-100 h-100 opacity-0"
                style={{ cursor: 'pointer' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Buttons */}
    <div className="d-flex justify-content-center gap-3 mt-4">
      <button type="submit" className="btn " disabled={isSubmitDisabled || loadingSubmit}>
        {loadingSubmit ? 'Submitting...' : 'Submit'}
      </button>
      <button type="button" className="btn " disabled={isUpdateDisabled || loadingUpdate} onClick={handleUpdate}>
        {loadingUpdate ? 'Updating...' : 'Update'}
      </button>
      <button type="button" className="btn " disabled={isDeleteDisabled || loadingDelete} onClick={handleDelete}>
        {loadingDelete ? 'Deleting...' : 'Delete'}
      </button>
      <button type="button" className="btn " onClick={handleClear}>
        Clear
      </button>
    </div>

    {/* Messages */}
    {/* {error && <div className="alert alert-danger mt-3 text-center">{error}</div>}
    {message && <div className="alert alert-success mt-3 text-center">{message}</div>} */}
  </div>
</form>


                           </div>
                        </div>
                     </div>
                     <div className="col-12">
                        <div className="card">
                           <div className="card-header">
                              <h3 className="card-title">Item List</h3>
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
                                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
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
                                       <th>Item Name</th>
                                       <th>Description</th>
                                       <th>Tax</th>
                                       <th>MRP</th>
                                       <th>Item Category</th>
                                    </tr>
                                 </thead>
                                 <tbody>
                                    {filteredItemData.map((item) => (
                                       <tr key={item.ItemID} onClick={() => handleRowClick(item)}>
                                          <td>{item.ItemName}</td>
                                          <td>{item.ItemDescription}</td>
                                          <td>{item.Tax}</td>
                                          <td>{item.MRP}</td>
                                          <td>
                                             {
                                                categories.find(category => category.id === Number(item.ItemCategoryID))?.name || 'Unknown'
                                             }
                                          </td>


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
export default ItemCreation;