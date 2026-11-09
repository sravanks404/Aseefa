const sql = require("mssql");
const dbConfig = require("../../config/mssql");

const getJobRole = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request().execute("APPGetJobRole");

    res.status(200).json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = getJobRole;
