const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../../config/mssql');
const { ConnectionPool } = require('mssql');

router.post('/insertLoginLog', async (req, res) => {
    let {
        EmployeeCode,
        UserRoleId,
        EmployeeName,
        LoginUserName,

        IPAddress,
        LoginStatus,     // true or false
        UserAgent,       // browser/device info
        SessionID,       // optional session ID
        GeoLocation,
        GeoPlace    // optional { latitude, longitude } object or string
    } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();

        // Ensure dates are JS Date objects if sent as string
        const parseDateTime = (val) => {
            if (!val) return null;
            const parsed = new Date(val);
            return isNaN(parsed.getTime()) ? null : parsed;
        };


        // Format geolocation as string if it's an object
        if (typeof GeoLocation === 'object' && GeoLocation !== null) {
            GeoLocation = `${GeoLocation.latitude},${GeoLocation.longitude}`;
        }

        // Required inputs
        request
            .output('ID', sql.Int)
            .input('EmployeeCode', sql.Int, EmployeeCode)
            .input('UserRoleId', sql.Int, UserRoleId)
            .input('EmployeeName', sql.VarChar(50), EmployeeName)
            .input('LoginUserName', sql.VarChar(50), LoginUserName)
            .input('IPAddress', sql.VarChar(50), IPAddress)
            .input('LoginStatus', sql.Bit, LoginStatus ?? true)
            .input('UserAgent', sql.VarChar(255), UserAgent || req.headers['user-agent'] || 'Unknown')
            .input('SessionID', sql.VarChar(100), SessionID || null)
            .input('GeoLocation', sql.VarChar(100), GeoLocation || null)
            .input('GeoPlace', sql.VarChar('MAX'), GeoPlace || null)


        const result = await request.execute('[webInsertLoginLog]');

        res.status(200).json({
            message: 'Login log inserted successfully',
            insertedId: result.output.ID
        });
    } catch (error) {
        console.error('Error inserting login log:', error);
        res.status(500).json({ error: 'Failed to insert login log', details: error.message });
    }
});

router.get('/companies', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query('EXEC dbo.GetCompanyInfo');
        res.json({ data: result.recordset });
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ error: 'Error fetching companies' });
    }
    // Don't close the connection here
});

router.post('/login', async (req, res) => {
    try {
        const pool = new ConnectionPool(dbConfig);
        await pool.connect();

        const { CompanyID, Username, Password } = req.body;

        console.log(`Received login request for CompanyID: ${CompanyID}, Username: ${Username}`);

        const CompanyIDQuery = 'SELECT CompanyID FROM dbo.CompanyInfo WHERE CompanyID = @CompanyID';
        const CompanyIDResult = await pool.request()
            .input('CompanyID', CompanyID)
            .query(CompanyIDQuery);

        if (CompanyIDResult.recordset.length > 0) {
            // console.log(`Found CompanyID: ${CompanyID}`);

            const query = 'EXEC webGetEmployeelogin @CompanyID = @CompanyID, @Username = @Username, @Password = @Password';
            const result = await pool.request()
                .input('CompanyID', CompanyID)
                .input('Username', Username)
                .input('Password', Password)
                .query(query);

            if (result.recordset.length > 0) {
                const user = result.recordset[0];
                const {
                    UserId,
                    UserRoleId,
                    BranchId,
                    ZoneId,
                    Name,
                    AllocatedUser
                } = user;

                console.log(`Login successful for user: ${Username} with UserId: ${UserId}`);

                req.session.user = Username;
                req.session.CompanyID = CompanyID;
                req.session.UserId = UserId;

                res.json({
                    success: true,
                    Username,
                    CompanyID,
                    UserId,
                    UserRoleId,
                    BranchId,
                    ZoneId,
                    Name,
                    AllocatedUser
                });
            } else {
                console.log(`Invalid credentials for user: ${Username}`);
                res.status(401).json({ error: 'Invalid credentials' });
            }
        } else {
            console.log(`Invalid company ID: ${CompanyID}`);
            res.status(400).json({ error: 'Invalid company ID' });
        }

        await pool.close();
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/activeUserId', async (req, res) => {
    const { CompanyID, BranchId, ZoneId } = req.query;

    if (!CompanyID) {
        return res.status(400).send('CompanyID is required');
    }
    try {

        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('CompanyID', sql.Int, CompanyID)
            .input('BranchId', sql.Int, BranchId)
            .input('ZoneId', sql.Int, ZoneId)
            .execute('webGetactiveUserId');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error', err);
        res.status(500).send('Something went wrong');
    }
});

router.post('/logout', (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.json({ success: true });
        });
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/getFYearID', async (req, res) => {
    const { companyId } = req.query; // Get CompanyID from query parameters

    if (!companyId) {
        return res.status(400).send('CompanyID is required');
    }
    try {

        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('CompanyID', sql.Int, companyId)
            .execute('webGetFYearID');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error', err);
        res.status(500).send('Something went wrong');
    }
});

// router.post('/resetpassword', async (req, res) => {
//     const { UserId, CurrentPassword, NewPassword } = req.body;


//     try {
//         // Connect to the database
//         await sql.connect(dbConfig);

//         // Create a new SQL request
//         const request = new sql.Request();

//         // Execute the stored procedure
//         const result = await request
//             .input('UserId', sql.Int, UserId)
//             .input('CurrentPassword', sql.VarChar(50), CurrentPassword)
//             .input('NewPassword', sql.VarChar(50), NewPassword)
//             .input('ModifiedBy', sql.Int, UserId)
//             .execute('ResetPassword');

//         // Send the result as a response
//         res.status(200).json(result.recordset[0]);
//     } catch (err) {
//         console.error('SQL error', err);
//         res.status(500).send('An error occurred while resetting the password.');
//     }
// });



module.exports = router;
