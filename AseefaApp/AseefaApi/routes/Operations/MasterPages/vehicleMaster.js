const express = require('express');
const sql = require('mssql');
const router = express.Router();
const dbConfig = require('../../../config/mssql');



/* ===========================
   INSERT / UPDATE VEHICLE
=========================== */
router.post('/InsertUpdateVehicleMaster', async (req, res) => {
    const {
        VID = 0,
        VRegNo,
        CompID,
        BranchID,
        VehicleNumber,
        VehicleType,
        VehicleMake,
        RegStartDate,
        RegEndDate,
        InsuranceStartDate,
        InsuranceEndDate,
        PollutionStartDate,
        PollutionEndDate,
        Fitness,
        Warehouse,
        ChassisNumber,
        VehicleMakeYear,
        ShiftType,
        VehicleCost,
        HeightMeter,
        PCHMeterReading,
        IsActive,
        Capacity,
        SpareLCoaVal,
        VehicleDescription,
        InsuranceCompany,
        AreaSqft,
        PurchaseDate,
        ContactNumber,
        FuelType,
        Mileage,
        FuelTankCapacity,
        UserId
    } = req.body;

    try {
        const poolConn = await sql.connect(dbConfig);
        const request = poolConn.request();

        request.input('VID', sql.Int, VID);
        request.input('VRegNo', sql.VarChar(50), VRegNo);
        request.input('CompID', sql.Int, CompID);
        request.input('BranchID', sql.Int, BranchID);
        request.input('VehicleNumber', sql.VarChar(50), VehicleNumber);
        request.input('VehicleType', sql.VarChar(50), VehicleType);
        request.input('VehicleMake', sql.VarChar(100), VehicleMake);
        request.input('RegStartDate', sql.Date, RegStartDate);
        request.input('RegEndDate', sql.Date, RegEndDate);
        request.input('InsuranceStartDate', sql.Date, InsuranceStartDate);
        request.input('InsuranceEndDate', sql.Date, InsuranceEndDate);
        request.input('PollutionStartDate', sql.Date, PollutionStartDate);
        request.input('PollutionEndDate', sql.Date, PollutionEndDate);
        request.input('Fitness', sql.VarChar(50), Fitness);
        request.input('Warehouse', sql.VarChar(100), Warehouse);
        request.input('ChassisNumber', sql.VarChar(100), ChassisNumber);
        request.input('VehicleMakeYear', sql.Int, VehicleMakeYear);
        request.input('ShiftType', sql.VarChar(50), ShiftType);
        request.input('VehicleCost', sql.Decimal(18, 2), VehicleCost);
        request.input('HeightMeter', sql.Decimal(10, 2), HeightMeter);
        request.input('PCHMeterReading', sql.Decimal(18, 2), PCHMeterReading);
        request.input('IsActive', sql.Bit, IsActive);
        request.input('Capacity', sql.Decimal(10, 2), Capacity);
        request.input('SpareLCoaVal', sql.Decimal(18, 2), SpareLCoaVal);
        request.input('VehicleDescription', sql.VarChar(500), VehicleDescription);
        request.input('InsuranceCompany', sql.VarChar(200), InsuranceCompany);
        request.input('AreaSqft', sql.Decimal(10, 2), AreaSqft);
        request.input('PurchaseDate', sql.Date, PurchaseDate);
        request.input('ContactNumber', sql.VarChar(20), ContactNumber);
        request.input('FuelType', sql.VarChar(20), FuelType);
        request.input('Mileage', sql.Decimal(6, 2), Mileage);
        request.input('FuelTankCapacity', sql.Decimal(6, 2), FuelTankCapacity);

        request.input('UserId', sql.Int, UserId);

        await request.execute('webinsertupdatevehiclemaster');

        res.status(VID === 0 ? 201 : 200).json({
            success: true,
            message: VID === 0
                ? 'Vehicle created successfully'
                : 'Vehicle updated successfully'
        });

    } catch (error) {
        console.error('VehicleMaster error:', error);
        res.status(500).json({
            success: false,
            message: 'Database operation failed',
            error: error.message
        });
    }
});

/* ===========================
   GET VEHICLE MASTER
=========================== */
router.get('/WebGetVehicleMaster', async (req, res) => {
    try {
        const poolConn = await sql.connect(dbConfig);

        const result = await poolConn.request()
            .execute('WebGetVehicleMastercreation');

        res.status(200).json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error('Get VehicleMaster error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vehicle master data',
            error: error.message
        });
    }
});


/* ===========================
   SOFT DELETE VEHICLE
=========================== */
router.post('/WebDeleteVehicleMaster', async (req, res) => {
    const { VID, DeletedBy } = req.body;

    // 🔍 Validation
    if (!VID || isNaN(VID)) {
        return res.status(400).json({
            success: false,
            message: 'Valid VID is required'
        });
    }

    if (!DeletedBy || isNaN(DeletedBy)) {
        return res.status(400).json({
            success: false,
            message: 'Valid DeletedBy is required'
        });
    }

    try {
        const poolConn = await sql.connect(dbConfig);

        const result = await poolConn.request()
            .input('VID', sql.Int, VID)
            .input('DeletedBy', sql.Int, DeletedBy)
            .execute('WebDeleteVehicleMaster');

        // Stored procedure success response
        const response = result.recordset?.[0];

        if (!response) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        return res.status(200).json({
            success: response.Success === 1,
            message: response.Message
        });

    } catch (error) {
        console.error('WebDeleteVehicleMaster API Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});



module.exports = router;
