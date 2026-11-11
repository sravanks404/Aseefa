import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from '../../apiService';
import ReceiptReport from "../../Reports/Sales & Distribution/ReceiptReport";


function RecieptForm() {
  const [showReport, setShowReport] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [isUpdateDisabled, setIsUpdateDisabled] = useState(false);
  const [isDeleteDisabled, setIsDeleteDisabled] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const tableRef = useRef(null);
  const [Accountid, setAccountid] = useState([]);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [Reciept, setReciept] = useState({
    ReId: 0,
    ReNo: "",
    RDate: new Date().toISOString().slice(0, 10), // Reset to today's date
    PLID: "",
    AccGroupid: "",
    Debit: "",
    Credit: "",
    Narration: "",
    CompanyID: "",
    FormName: "",
    ChkDate: "",
    FYearID: "",
    CreatedBy: "",
    CreatedDate: "",
    ModifiedBy: "",
    ModifiedDate: "",
    IsDeleted: "",
    PartyID: "",
    ChkNo: "",
    Bank: "",
    BankLocation: "",
    Branch: "",
    Type: "5",
  });
  const [RecieptData, setRecieptData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredLedgerList, setFilteredLedgerList] = useState([]);
  const [ledgerList, setLedgerList] = useState([]);

  const fetchReNo = async () => {
    try {
      const CompanyID = localStorage.getItem("CompanyID"); // Get CompanyID from localStorage

      if (!CompanyID) {
        console.error("CompanyID is missing");
        return;
      }

      const response = await api.get("/api/GetReceiptNo", {
        params: { CompanyID },
      });

      if (response.data.length > 0) {
        const receiptNumber = response.data[0].ReNo; // Assuming ReNo is returned in the response
        setReciept((prevReciept) => ({
          ...prevReciept,
          ReNo: receiptNumber, // Set the ReNo in the state
        }));
      } else {
        console.error("No receipt number returned from the API.");
      }
    } catch (error) {
      console.error("Error fetching ReNo:", error);
    }
  };

  // Call fetchReNo on component load
  useEffect(() => {
    fetchReNo();
  }, []); // Empty dependency array to run only once on component load

  const fetchData = async () => {
    try {
      const CompanyID = localStorage.getItem("CompanyID");

      if (!CompanyID) {
        console.error("CompanyID not found in localStorage");
        return;
      }

      const response = await api.get("/api/getreciept", {
        params: { CompanyID },
      });

      const data = response.data.map((item) => ({
        ...item,
        ChkNo: item.ChkNo || "",
        ReId: item.ReId || 0,
        ReNo: item.ReNo || "",
        Rdate: item.Rdate || "",
        PLID: item.PLID || "",
        AccGroupid: item.AccGroupid || "",
        Debit: item.Debit || "",
        Credit: item.Credit || "",
        Narration: item.Narration || "",
        CompanyID: item.CompanyID || "",
        FormName: item.FormName || "",
        Type: item.Type || 5,
        FYearID: item.FYearID || "",
        CreatedBy: item.CreatedBy || "",
        CreatedDate: item.CreatedDate || "",
        ModifiedBy: item.ModifiedBy || "",
        ModifiedDate: item.ModifiedDate || "",
        IsDeleted: item.IsDeleted || "",
        PartyID: item.PartyID || "",
      }));
      setRecieptData(data);
      setIsSubmitDisabled(false);
      setIsUpdateDisabled(true);
      setIsDeleteDisabled(true);
    } catch (error) {
      console.error("Error fetching Reciept data:", error);
    }
  };

  const navigate = useNavigate();

  useEffect(() => {
    const fetchLedgerData = async () => {
      try {
        const CompanyID = localStorage.getItem("CompanyID");

        const response = await api.get("/api/getledger", {
          params: { CompanyID },
        });

        setLedgerList(response.data); // Set the fetched ledger data
      } catch (error) {
        console.error("Error fetching ledger data", error);
      }
    };
    fetchLedgerData(); // Corrected here
    fetchData();
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (Reciept.AccGroupid) {
      const filtered = ledgerList.filter(
        (ledger) => ledger.AccGroupid === parseInt(Reciept.AccGroupid, 10)
      );
      setFilteredLedgerList(filtered);
    }
  }, [Reciept.AccGroupid, ledgerList]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const selectedAccount = Accountid.find(
      (account) => account.GName === value
    );
    // Set the value first to allow typing
    setReciept((prevReciept) => ({
      ...prevReciept,
      [name]: value,
      GSlNo: selectedAccount ? selectedAccount.GSlNo : "",
    }));

    // Clear existing errors
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Retrieve CompanyID, Empid, and FYearID from localStorage
    const CompanyID = parseInt(localStorage.getItem("CompanyID"), 10);
    const Empid = parseInt(localStorage.getItem("Empid"), 10);
    const financialResponse = JSON.parse(
      localStorage.getItem("financialResponse")
    );
    const FYearID = financialResponse
      ? parseInt(financialResponse.FYearID, 10)
      : null;

    // Check if CompanyID, Empid, or FYearID is missing or invalid
    if (isNaN(CompanyID) || isNaN(Empid) || isNaN(FYearID)) {
      setError(
        "Missing or invalid CompanyID, Empid, or FYearID. Please log in again."
      );
      return;
    }

    // Validate required fields
    if (!Reciept.PLID) {
      setError("Please select a ledger name.");
      return;
    }

    if (!Reciept.RecipientPLID) {
      setError("Please select a recipient name.");
      return;
    }

    // Construct the first receipt with actual data
    const firstReciept = {
      ...Reciept,
      FormName: 5, // Ensure FormName is always 5 (number, not string)
      IsDeleted: 0,
      CreatedBy: Empid,
      CreatedDate: new Date().toISOString(),
      CompanyID,
      FYearID,
      AccountGroupId: Reciept.AccGroupid, // Set AccountGroupId to the selected Type (GSlNo)
      PartyID: Reciept.RecipientPLID,
      Type: "5",
    };


    try {
      setLoading(true);

      // Submit the first receipt
      const firstResponse = await api.post(
        "/api/insertupdatereciept",
        firstReciept
      );
      // Submit the first receipt

      setMessage(firstResponse.data.message);

      // Clear the form after successful submission
      setReciept({
        ReId: 0,
        ReNo: "",
        Rdate: "",
        Debit: "",
        Credit: "",
        PLID: "",
        RecipientPLID: "",
        CompanyID: "",
        CreatedBy: "",
        Narration: "",
        FYearID: 0,
        AccGroupid: "",
        ChkDate: "",
        PartyID: "",
        Type: "5",
      });
      handleClear();
      // Refresh data after submission
      fetchData();
    } catch (error) {
      console.error("Error submitting data:", error);
      setError("Failed to submit data.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    // Retrieve CompanyID, Empid, and FYearID from localStorage
    const CompanyID = parseInt(localStorage.getItem("CompanyID"), 10);
    const Empid = parseInt(localStorage.getItem("Empid"), 10);
    const financialResponse = JSON.parse(
      localStorage.getItem("financialResponse")
    );
    const FYearID = financialResponse
      ? parseInt(financialResponse.FYearID, 10)
      : null;

    // Check if CompanyID, Empid, or FYearID is missing or invalid
    if (isNaN(CompanyID) || isNaN(Empid) || isNaN(FYearID)) {
      setError(
        "Missing or invalid CompanyID, Empid, or FYearID. Please log in again."
      );
      return;
    }

    // Validate required fields
    if (!Reciept.PLID) {
      setError("Please select a ledger name.");
      return;
    }

    if (!Reciept.RecipientPLID) {
      setError("Please select a recipient name.");
      return;
    }

    // Construct the receipt with actual data
    const updatedReciept = {
      ReId: Reciept.ReId, // ReId must be 0 for a new entry
      ReNo: Reciept.ReNo, // Ensure ReNo is present
      Rdate: Reciept.Rdate || new Date().toISOString(),
      PLID: Reciept.PLID,
      AccGroupid: Reciept.AccGroupid || null,
      PartyID: Reciept.RecipientPLID || null,
      Debit: Reciept.Debit ? parseFloat(Reciept.Debit) : null,
      Narration: Reciept.Narration || "",
      CompanyID,
      Bank: Reciept.Bank || null,
      ChkNo: Reciept.ChkNo || null,
      ChkDate: Reciept.ChkDate || null,
      Remark: Reciept.Remark || "",
      Branch: Reciept.Branch || null,
      FormName: 5, // Ensure FormName is always 5
      Type: "5", // Ensure Type is "5"
      FYearID,
      CreatedBy: Empid,
      CreatedDate: Reciept.CreatedDate || new Date().toISOString(),
      ModifiedBy: Empid,
      ModifiedDate: new Date().toISOString(),
      IsDeleted: 0, // Set IsDeleted to 0
    };

    try {
      setLoading(true);

      // Send the updated receipt data to the API
      const response = await api.put("/api/updateReceipt", updatedReciept);

      // Handle successful response
      setMessage(response.data.message);

      // Clear the form after successful submission
      setReciept({
        ReId: "",
        ReNo: "",
        Rdate: "",
        Debit: "",
        Credit: "",
        PLID: "",
        RecipientPLID: "",
        CompanyID: "",
        CreatedBy: "",
        Narration: "",
        FYearID: 0,
        AccGroupid: "",
        ChkDate: "",
        PartyID: "",
        Type: "5",
      });
      handleClear();
      fetchData();
    } catch (error) {
      console.error("Error submitting data:", error);
      setError("Failed to submit data.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessage("");
    setError("");

    // Reset all fields to their default values
    setReciept({
      ReId: 0,
      ReNo: "",
      RDate: new Date().toISOString().slice(0, 10), // Reset to today's date
      Debit: "",
      Credit: "",
      PLID: "", // Reset LedgerName selection
      RecipientPLID: "", // Reset Recipient Name selection
      CompanyID: "",
      CreatedBy: "",
      Narration: "",
      AccGroupid: "",
      FYearID: 0,
      Bank: "",
      ChkDate: "",
      Remark: "",
      Branch: "",
      FormName: 5, // Keep FormName as hardcoded if needed

      ChkNo: "",
      BankLocation: "",
      DiscountingCharges: "",
      CollectionCharges: "",
      PostalCharges: "",
    });
    fetchData();
    fetchReNo();
  };

  const handleDelete = async (e) => {
    e.preventDefault();

    const Empid = localStorage.getItem("Empid"); // Get the employee ID from local storage
    setMessage(""); // Clear any existing message

    // Ensure ReNo is available for deletion
    if (!Reciept.ReNo) {
      setError("ReNo is required to delete."); // Set an error message if ReNo is missing
      return;
    }

    // Confirm deletion action with the user
    if (
      window.confirm(
        "Are you sure you want to delete all receipts with ReNo: " +
          Reciept.ReNo +
          "?"
      )
    ) {
      try {

        const response = await api.post("/api/deleteReciept", {
            // Prepare the data object to match the API expectation
            ReNo: parseInt(Reciept.ReNo, 10), // Ensure ReNo is an integer
            DeletedBy: Empid ? parseInt(Empid, 10) : 0, // Ensure DeletedBy is an integer
          },);


        // Check if the response indicates success
        if (response.status === 200) {
          alert(
            "All receipts with ReNo " + Reciept.ReNo + " deleted successfully!"
          ); // Notify user of successful deletion

          // Reset receipt state after successful deletion
          setReciept({
            ReNo: 0,
            RecieptName: "",
            CompanyID: "",
          });

          // Fetch updated data to refresh the table after deletion
          fetchData(); // Refresh the data
        } else {
          alert("Failed to delete the receipts. " + response.data); // Notify user of failure
        }

        // Clear existing error message if any
        setError("");
      } catch (error) {
        console.error("Error from server:", error); // Log any errors
        alert(
          "All receipts with ReNo " + Reciept.ReNo + " deleted successfully!"
        ); // Notify user of successful deletion
      }
    }
  };

  const handleRowClick = (item) => {
    // Find the account with the matching GSlNo from the clicked row
    const selectedAccount = Accountid.find(
      (account) => account.GSlNo === item.GSlNo
    );
    const accGroupId = item.AccGroupid ? item.AccGroupid.toString() : "";
    // Find the ledger that corresponds to the PartyID in the clicked item
    const selectedLedger = ledgerList.find(
      (ledger) => ledger.PartyID === item.PartyID
    );

    // Set the selected account's details in the receipt state
    setReciept({
      ...item,
      ReId: item.ReId,
      LedgerName: selectedLedger ? selectedLedger.LedgerName : item.LedgerName,
      PLID: item.PLID, // Set PLID from the reciept table
      PartyID: item.PartyID,

      RecipientPLID: item.PartyID, // Set the RecipientPLID based on selected ledger
      AccGroupid: accGroupId || "",
      GSlNo: selectedAccount ? selectedAccount.GSlNo : "",
      CreatedBy: "",
      CreatedDate: new Date().toISOString(),
      ModifiedBy: 0,
      ModifiedDate: new Date().toISOString(),
      DeletedBy: 0,
      DeletedDate: new Date().toISOString(),
      IsDeleted: 0,
      ChekNo: item.ChekNo,
    });

    // Disable submit button when row is clicked
    setIsSubmitDisabled(true);
    setIsUpdateDisabled(false);
    setIsDeleteDisabled(false);
    setError("");

    // Smooth scroll to the top of the page
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredData = RecieptData.filter((item) =>
    (item.ReId ? item.ReId.toString().toLowerCase() : "").includes(
      searchQuery.toLowerCase()
    )
  );
  const fetchAccounts = async () => {
    try {
      // Fetch CompanyID from localStorage
      const CompanyID = localStorage.getItem("CompanyID");

      // Check if CompanyID exists in localStorage
      if (!CompanyID) {
        console.error("CompanyID not found in localStorage");
        return;
      }

      // Fetch the accounts data
      const AccountsResponse = await api.get("/api/getAccGroup", {
        params: { CompanyID },
      });

      // Filter accounts with GSlNo of 5 and 6
      const filteredAccounts = AccountsResponse.data.filter(
        (account) => account.GSlNo === 5 || account.GSlNo === 6
      );

      // Log and set the filtered account data
      setAccountid(filteredAccounts); // Assuming setAccountid is your State updater function
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container-xl">
        <div className="page-header d-print-none mt-2">
          <div className="row g-2 align-items-center">
            <div className="col">
              <h2 className="page-title">Receipt Master</h2>
            </div>
          </div>
        </div>

        <div className="page-body">
          <div className="container-xl">
            <div className="row row-cards">
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <form className="Reciept-form" onSubmit={handleSubmit}>
                      <div className="row">
                        <div className="col-md-1">
                          <div className="form-group">
                            <label htmlFor="ReNo" className="form-label">
                              Receipt No:
                            </label>
                            <input
                              type="text"
                              id="ReNo"
                              name="ReNo"
                              className="form-control"
                              value={Reciept.ReNo || ""} // Add fallback in case the state is undefined initially
                            />
                          </div>
                        </div>

                        <div className="col-md-2">
                          <div className="form-group">
                            <label htmlFor="RDate" className="form-label">
                              Receipt Date:
                            </label>
                            <input
                              type="date"
                              id="RDate"
                              name="RDate"
                              className="form-control"
                              value={Reciept.RDate}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>

                        <div className="col-md-2">
                          <div className="form-group">
                            <label htmlFor="AccGroupid" className="form-label">
                              Receipt Mode:
                            </label>
                            <select
                              id="AccGroupid"
                              name="AccGroupid"
                              className="form-control"
                              value={Reciept.AccGroupid} // Ensure this matches the state
                              onChange={(e) => {
                                handleInputChange(e); // This will update the Reciept.Type
                                // Optionally handle any other logic when changing type
                              }}
                            >
                              <option value="">Select Account</option>
                              {Accountid.map((account) => (
                                <option
                                  key={account.GSlNo}
                                  value={account.GSlNo}
                                >
                                  {account.GName}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="col-md-2">
                          <div className="form-group">
                            <label htmlFor="LedgerName" className="form-label">
                              Receipt Type:
                            </label>
                            <select
                              id="LedgerName"
                              name="LedgerName"
                              className="form-control"
                              value={Reciept.PLID}
                              onChange={(e) =>
                                setReciept({
                                  ...Reciept,
                                  PLID: e.target.value, // Update PLID when Ledger is selected
                                })
                              }
                              required
                            >
                              <option value="">Select Ledger</option>
                              {filteredLedgerList.map((ledger) => (
                                <option key={ledger.PLID} value={ledger.PLID}>
                                  {ledger.LedgerName}{" "}
                                  {/* Display Ledger Name */}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Recipient Name Selection */}
                        <div className="col-md-2">
                          <div className="form-group">
                            <label
                              htmlFor="RecipientName"
                              className="form-label"
                            >
                              Ledger Type :
                            </label>
                            <select
                              id="RecipientName"
                              name="RecipientName"
                              className="form-control"
                              value={Reciept.RecipientPLID}
                              onChange={(e) =>
                                setReciept({
                                  ...Reciept,
                                  RecipientPLID: e.target.value, // Update RecipientPLID when selected
                                  PartyID: e.target.value, // Also map PartyID to the selected value
                                })
                              }
                              required
                            >
                              <option value="">Select Recipient</option>
                              {ledgerList.map((ledger) => (
                                <option key={ledger.PLID} value={ledger.PLID}>
                                  {ledger.LedgerName}{" "}
                                  {/* Display Recipient Name */}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="col-md-1">
                          <div className="form-group">
                            <label htmlFor="Debit" className="form-label">
                              Debit:
                            </label>
                            <input
                              type="number"
                              id="Debit"
                              name="Debit"
                              className="form-control"
                              value={Reciept.Debit}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>

                        <div className="col-md-2">
                          <div className="form-group">
                            <label htmlFor="Narration" className="form-label">
                              Narration:
                            </label>
                            <input
                              type="text"
                              id="Narration"
                              name="Narration"
                              className="form-control"
                              value={Reciept.Narration}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        {Reciept.AccGroupid === "5" && ( // Adjust to string '5' if GSlNo is stored as a string
                          <>
                            <div className="row">
                              <div className="col-md-2">
                                <div className="form-group">
                                  <label htmlFor="ChkNo" className="form-label">
                                    Cheque/DD No:
                                  </label>
                                  <input
                                    type="text"
                                    id="ChkNo"
                                    name="ChkNo"
                                    className="form-control"
                                    value={Reciept.ChkNo}
                                    onChange={handleInputChange}
                                  />
                                </div>
                              </div>

                              <div className="col-md-2">
                                <div className="form-group">
                                  <label htmlFor="Bank" className="form-label">
                                    Bank:
                                  </label>
                                  <input
                                    type="text"
                                    id="Bank"
                                    name="Bank"
                                    className="form-control"
                                    value={Reciept.Bank}
                                    onChange={handleInputChange}
                                  />
                                </div>
                              </div>

                              <div className="col-md-2">
                                <div className="form-group">
                                  <label
                                    htmlFor="Branch"
                                    className="form-label"
                                  >
                                    Branch:
                                  </label>
                                  <input
                                    type="text"
                                    id="Branch"
                                    name="Branch"
                                    className="form-control"
                                    value={Reciept.Branch}
                                    onChange={handleInputChange}
                                  />
                                </div>
                              </div>

                              <div className="col-md-3">
                                <div className="form-group">
                                  <label
                                    htmlFor="Branch"
                                    className="form-label"
                                  >
                                    Remark:
                                  </label>
                                  <input
                                    type="text"
                                    id="Branch"
                                    name="Branch"
                                    className="form-control"
                                    value={Reciept.Branch}
                                    onChange={handleInputChange}
                                  />
                                </div>
                              </div>

                              <div className="col-md-2">
                                <div className="form-group">
                                  <label
                                    htmlFor="ChkDate"
                                    className="form-label"
                                  >
                                    Cheque Date:
                                  </label>
                                  <input
                                    type="date"
                                    id="ChkDate"
                                    name="ChkDate"
                                    className="form-control"
                                    value={Reciept.ChkDate}
                                    onChange={handleInputChange}
                                  />
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                        <div className="col-md-3">
                          <div className="form-group">
                            <input
                              type="hidden"
                              id="FormName"
                              name="FormName"
                              className="form-control"
                              value={5} // Hardcoded value
                              readOnly // Prevent user input
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group">
                          <input
                            type="hidden"
                            id="Credit"
                            name="Credit"
                            className="form-control"
                            value={Reciept.Credit}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      <div className="form-footer d-flex justify-content-center">
                        <button
                          type="submit"
                          className="btn  mx-1"
                          disabled={isSubmitDisabled || loadingSubmit}
                        >
                          {loadingSubmit ? "Submitting..." : "Submit"}
                        </button>
                        <button
                          type="button"
                          className="btn  mx-1"
                          disabled={isUpdateDisabled || loadingUpdate}
                          onClick={handleUpdate}
                        >
                          {loadingUpdate ? "Updating..." : "Update"}
                        </button>

                        <button
                          type="button"
                          className="btn  mx-1"
                          disabled={isDeleteDisabled || loadingDelete}
                          onClick={handleDelete}
                        >
                          Delete
                        </button>
                        
                        {showReport ? (
                          <ReceiptReport
                            receipt={Reciept}
                            onBack={() => setShowReport(false)}
                          />
                        ) : (
                          <button
                            type="button"
                            className="btn mx-1"
                            onClick={() => setShowReport(true)}
                          >
                            Print
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn  mx-1"
                          onClick={handleClear}
                        >
                          Clear
                        </button>
                      </div>
                      {error && (
                        <div className="alert alert-danger mt-2">{error}</div>
                      )}
                      {message && (
                        <div className="alert alert-success mt-2">
                          {message}
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              </div>
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Reciept List</h3>
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
                          <th>Receipt No</th>
                          <th>Receipt Type</th>
                          <th>Ledger</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.map((item) => (
                          <tr
                            key={item.ReId}
                            onClick={() => handleRowClick(item)}
                          >
                            <td>{item.ReNo}</td>
                            <td>{item.PLedgerName}</td>
                            <td>{item.PartyLedgerName}</td>
                            <td>{item.Debit}</td>
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
export default RecieptForm;
