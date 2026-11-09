const express = require("express");
const cors = require("cors");
const sql = require('mssql');
const dbConfig = require('./config/mssql');

const app = express();
app.use(cors());
app.use(express.json());

// ============================================
// COMPANIES ENDPOINT (Working)
// ============================================
app.get('/api/companies', async (req, res) => {
    const pool = new sql.ConnectionPool(dbConfig);
    try {
        await pool.connect();
        console.log('✓ Database connected');
        console.log('Executing webGetCompanyInfo procedure...');
        
        const result = await pool.request().execute('dbo.webGetCompanyInfo');
        console.log('✓ Company records fetched:', result.recordset.length);
        
        res.status(200).json({ 
            success: true,
            data: result.recordset 
        });
    } catch (error) {
        console.error('✗ Error fetching companies:', error.message);
        res.status(500).json({ 
            success: false,
            error: 'Error fetching companies', 
            details: error.message 
        });
    } finally {
        if (pool) {
            await pool.close();
        }
    }
});

// ============================================
// LOGIN ENDPOINT (Copy from original)
// ============================================
app.post('/api/login', async (req, res) => {
    const pool = new sql.ConnectionPool(dbConfig);
    try {
        await pool.connect();

        const { CompanyID, Username, Password } = req.body;
        console.log(`Login request: CompanyID=${CompanyID}, Username=${Username}`);

        const CompanyIDQuery = 'SELECT CompanyID FROM dbo.CompanyInfo WHERE CompanyID = @CompanyID';
        const CompanyIDResult = await pool.request()
            .input('CompanyID', CompanyID)
            .query(CompanyIDQuery);

        if (CompanyIDResult.recordset.length > 0) {
            const query = 'EXEC AppGetEmployeelogin @CompanyID = @CompanyID, @Username = @Username, @Password = @Password';
            const result = await pool.request()
                .input('CompanyID', CompanyID)
                .input('Username', Username)
                .input('Password', Password)
                .query(query);

            if (result.recordset.length > 0) {
                res.json({
                    success: true,
                    message: 'Login successful',
                    data: result.recordset[0]
                });
            } else {
                res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
        } else {
            res.status(400).json({
                success: false,
                message: 'Company not found'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        if (pool) {
            await pool.close();
        }
    }
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: "API Working"
    });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 1201;
const HOST = process.env.HOST || 'localhost';

console.log(`\n🚀 Starting AseefaApi server...`);
app.listen(PORT, HOST, () => {
    console.log(`\n✓ Server running on http://${HOST}:${PORT}`);
    console.log(`✓ Companies endpoint: GET http://${HOST}:${PORT}/api/companies`);
    console.log(`✓ Login endpoint: POST http://${HOST}:${PORT}/api/login`);
    console.log(`✓ Health check: GET http://${HOST}:${PORT}/api/health\n`);
});

module.exports = app;
