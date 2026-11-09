

const sql = require('mssql');
const dbConfig = require('../../config/mssql');

const insertSupplier = async (req, res) => {
    try {
        const {
            CompanyName,
            UserId,
            CompanyId,
            CustomerSuitAppsId,
            Email,
            Phone,
            ProjectLocation,
            Latitude,
            Longitude,
            Remark,
            Image,
            ContactPersons
        } = req.body;

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('CompanyName', sql.NVarChar(200), CompanyName)
            .input('UserId', sql.Int, UserId)
            .input('CompanyId', sql.Int, CompanyId)
            .input(
                'CustomerSuitAppsId',
                sql.BigInt,
                CustomerSuitAppsId ?? null
            )
            .input('Email', sql.NVarChar(200), Email ?? null)
            .input('Phone', sql.NVarChar(50), Phone ?? null)
            .input(
                'ProjectLocation',
                sql.NVarChar(200),
                ProjectLocation ?? null
            )
            .input(
                'Latitude',
                sql.Decimal(18, 8),
                Latitude ?? null
            )
            .input(
                'Longitude',
                sql.Decimal(18, 8),
                Longitude ?? null
            )
            .input(
                'Remark',
                sql.NVarChar(sql.MAX),
                Remark ?? null
            )
            .input(
                'Image',
                sql.VarBinary(sql.MAX),
                Image
                    ? Buffer.from(
                        Image.replace(
                            /^data:image\/\w+;base64,/,
                            ''
                        ),
                        'base64'
                    )
                    : null
            )
            .input(
                'ContactPersons',
                sql.NVarChar(sql.MAX),
                Array.isArray(ContactPersons)
                    ? JSON.stringify(ContactPersons)
                    : null
            )
            .execute('APPInsertSupplier');

        return res.status(200).json({
            success: true,
            data: result.recordset[0]
        });

    } catch (error) {
        console.error('Insert Supplier Error:', error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    insertSupplier
};