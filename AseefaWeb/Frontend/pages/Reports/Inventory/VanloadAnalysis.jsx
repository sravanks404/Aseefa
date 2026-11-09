import React, { useState, useEffect, useRef } from "react";
import api from '../../apiService';
import $ from "jquery";
import "bootstrap-datepicker/dist/css/bootstrap-datepicker.min.css";
import "bootstrap-datepicker";

const VanloadAnalysis = () => {
    const getCurrentMonth = () => new Date().getMonth() + 1;

    const [month, setMonth] = useState(getCurrentMonth());
    const [result, setResult] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const monthPickerRef = useRef(null);

    const fetchUserData = async () => {
        const CompanyId = sessionStorage.getItem("CompanyID");
        if (!CompanyId) {
            console.error("No CompanyID found in sessionStorage");
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.get(`/api/GetVanLoadingAnalysis`, {
                params: { Month: month, CompanyId },
            });

            const data = response.data?.data[0] || [];
            setResult(data);
        } catch (err) {
            console.error("Error fetching User Data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [month]);

    useEffect(() => {
        const $input = $(monthPickerRef.current);
        const today = new Date();
        const formatted = `${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;
        $input.val(formatted);

        $input.datepicker({
            format: "mm/yyyy",
            startView: "months",
            minViewMode: "months",
            autoclose: true
        }).on("changeDate", function (e) {
            const selectedMonth = e.date.getMonth() + 1;
            setMonth(selectedMonth);
        });

        setMonth(today.getMonth() + 1);

        return () => {
            $input.datepicker("destroy");
        };
    }, []);

    const vehicleKeys = result.length > 0
        ? Object.keys(result[0]).filter((key) => key !== "Date")
        : [];

    const handleVehicleClick = (date, vehicleKey) => {
        const [vRegNo, vid] = vehicleKey.split("_");
        sessionStorage.setItem("SelectedDate", date);
        sessionStorage.setItem("SelectedVehicle", vRegNo);
        sessionStorage.setItem("VID", vid);
        sessionStorage.setItem("ActiveTab", "VanloadReport");
        window.location.reload();
    };

    const getVRegNo = (vehicleKey) => vehicleKey.split("_")[0];

    return (
        <div className="card mt-3">
            <div className="card-body">
                <h3 className="text-primary">Stock Report Details</h3>

                <div className="col-md-3 mb-3">
                    <label htmlFor="monthPicker" className="fw-bold">Select Month</label>
                    <input
                        type="text"
                        id="monthPicker"
                        className="form-control"
                        placeholder="Select month"
                        ref={monthPickerRef}
                    />
                </div>

                {isLoading ? (
                    <div className="text-center" role="status">
                        <span className="navbar-brand navbar-brand-autodark">SuitApps</span>
                        <div className="text-secondary mb-2" style={{ fontSize: "14px" }}>Preparing Report...</div>
                        <div className="progress" style={{ height: "6px", width: "100px", margin: "0 auto" }}>
                            <div
                                className="progress-bar progress-bar-striped progress-bar-animated"
                                style={{
                                    width: "100%",
                                    backgroundColor: "#0e5397ff"
                                }}
                            ></div>
                        </div>
                    </div>
                ) : result.length > 0 ? (
                    <div className="table-responsive">
                        <table className="table table-bordered">
                            <thead style={{ backgroundColor: "#0e5397ff", color: "#fff" }}>
                                <tr>
                                    <th style={{ fontSize: "12px", padding: "6px" }}>S.No</th>
                                    <th style={{ fontSize: "12px", padding: "6px" }}>Date</th>
                                    {vehicleKeys.map((key, index) => (
                                        <th key={index} style={{ fontSize: "12px", padding: "6px" }}>
                                            {getVRegNo(key)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {result.map((item, index) => (
                                    <tr key={index} style={{ fontSize: "12px", height: "35px" }}>
                                        <td>{index + 1}</td>
                                        <td style={{ backgroundColor: "#DCDCDC" }}>
                                            {new Date(item.Date).toLocaleDateString("en-US", {
                                                weekday: "long",
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric"
                                            })}
                                        </td>
                                        {vehicleKeys.map((key) => (
                                            <td
                                                key={key}
                                                style={{
                                                    backgroundColor: item[key] ? "#d6e6f5" : "#f0f4f8",
                                                    color: item[key] ? "#0e5397ff" : "#888",
                                                    padding: "4px",
                                                    fontSize: "12px",
                                                    lineHeight: "1.2",
                                                    cursor: "pointer"
                                                }}
                                                onClick={() => handleVehicleClick(item.Date, key)}
                                            >
                                                {item[key] || "-"}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center">No data available</div>
                )}
            </div>
        </div>
    );
};

export default VanloadAnalysis;
