import React, { useState, useEffect, useRef } from "react";
import api from '../../apiService';
import $ from "jquery";
import "bootstrap-datepicker/dist/css/bootstrap-datepicker.min.css";
import "bootstrap-datepicker";

const ItemAnalysis = () => {
    const [month, setMonth] = useState(null);
    const [result, setResult] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const monthPickerRef = useRef(null);

    // ✅ Fetch user data on month change
    useEffect(() => {
        fetchUserData();
    }, [month]);

    const fetchUserData = async () => {
        const CompanyId = sessionStorage.getItem("CompanyID");
        if (!CompanyId) {
            console.error("No CompanyID found in sessionStorage");
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.get(`/api/GetItemAnalysis`, {
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

    // ✅ Month Picker Initialization
    useEffect(() => {
        const $input = $(monthPickerRef.current);

        const today = new Date();
        const formatted = `${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;
        $input.val(formatted);

        $input.datepicker({
            format: "mm/yyyy",
            startView: "months",
            minViewMode: "months",
            autoclose: true,
        }).on("changeDate", function (e) {
            const selectedMonth = e.date.getMonth() + 1;
            setMonth(selectedMonth);
        });

        // Set initial month in state
        setMonth(today.getMonth() + 1);

        return () => {
            $input.datepicker("destroy");
        };
    }, []);

    // ✅ Data transformer function
    const transformData = (data) => {
        const transformedData = {};
        const allDates = new Set();

        data.forEach(entry => {
            const date = new Date(entry.Date);
            const dateKey = date.getDate(); // Only day (1-31)
            allDates.add(dateKey);

            Object.keys(entry).forEach(key => {
                if (key === "Date" || key === "Type") return;

                const itemName = key;
                const type = entry.Type || "Unknown";

                if (!transformedData[itemName]) {
                    transformedData[itemName] = {
                        typeCount: {},
                        values: {}
                    };
                }

                transformedData[itemName].typeCount[type] = (transformedData[itemName].typeCount[type] || 0) + (parseInt(entry[key]) || 0);
                transformedData[itemName].values[dateKey] = entry[key];
            });
        });

        const sortedDates = Array.from(allDates).sort((a, b) => a - b);
        return { transformedData, sortedDates };
    };
    const { transformedData, sortedDates } = transformData(result);
    return (
        <div className="card mt-3">
            <div className="card-body">
                <h4>SaleOrder Analysis</h4>
                <div>
                    <label>Select Month</label>
                    <input
                        ref={monthPickerRef}
                        className="form-control"
                        style={{ width: "200px" }}
                    />
                </div>

                <table className="table table-bordered text-center">
                    <thead>
                        <tr className="table-secondary">
                            <th>ITEM</th>
                            <th>TYPE</th>
                            {sortedDates.map((date, idx) => (
                                <th key={idx}>{date}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(transformedData).map(([itemName, itemData], index) => {
                            const itemType = Object.keys(itemData.typeCount)[0] || "Unknown";

                            return (
                                <tr key={index}>
                                    <td>{itemName}</td>
                                    <td>{itemType}</td>
                                    {sortedDates.map((dateKey, idx) => (
                                        <td key={idx} style={{ backgroundColor: "#fdebc8" }}>
                                            {itemData.values[dateKey] ?? "-"}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

            </div>
        </div>
    );
};


export default ItemAnalysis;