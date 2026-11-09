const sql = require("mssql");
const path = require("path");
const dbConfig = require("../../config/mssql");

const getPropertyDocs = async (req, res) => {
  try {
    const { CompanyID, PropertyID } = req.query;

    if (!CompanyID || !PropertyID) {
      return res.status(400).json({
        success: false,
        message: "CompanyID and PropertyID are required",
      });
    }

    const pool = await sql.connect(dbConfig);

    const result = await pool
      .request()
      .input("CompanyID", sql.Int, Number(CompanyID))
      .input("PropertyID", sql.Int, Number(PropertyID))
      .execute("GetPropertyDocuments");

    res.json({
      success: true,
      documents: result.recordset,
    });
  } catch (error) {
    console.error("getPropertyDocs:", error);

    res.status(500).json({
      success: false,
      message: "Error loading property documents",
    });
  }
};

const uploadPropertyDoc = async (req, res) => {
  try {
    const {
      CompanyID,
      PropertyID,
      id,
      documentType,
      uploadedBy,
      documentDate,
      expiryDate,
      notes,
    } = req.body;

    if (!CompanyID) {
      return res.status(400).json({
        success: false,
        message: "CompanyID is required",
      });
    }

    if (!PropertyID) {
      return res.status(400).json({
        success: false,
        message: "PropertyID is required",
      });
    }

    if (!documentType) {
      return res.status(400).json({
        success: false,
        message: "Document type is required",
      });
    }

    // New record must have file
    if (!id && !req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a file",
      });
    }

    const pool = await sql.connect(dbConfig);

    let fileName = "";
    let filePath = "";
    let fileSize = null;
    let fileExtension = "";

    if (req.file) {
      fileName = req.file.originalname;

      fileSize = req.file.size;

      fileExtension = path.extname(req.file.originalname);

      filePath = path
        .relative(path.join(__dirname, ".."), req.file.path)
        .replace(/\\/g, "/");
    }

    const result = await pool
      .request()

      .input("DocumentID", sql.Int, id ? Number(id) : null)

      .input("CompanyID", sql.Int, Number(CompanyID))

      .input("PropertyID", sql.Int, Number(PropertyID))

      .input("DocumentType", sql.VarChar(250), documentType)

      .input("FileName", sql.VarChar(500), fileName)

      .input("FilePath", sql.VarChar(1000), filePath)

      .input("FileSize", sql.BigInt, fileSize)

      .input("FileExtension", sql.VarChar(50), fileExtension)

      .input("DocumentDate", sql.Date, documentDate || null)

      .input("ExpiryDate", sql.Date, expiryDate || null)

      .input("UploadedBy", sql.Int, uploadedBy ? Number(uploadedBy) : null)

      .input("Notes", sql.VarChar(sql.MAX), notes || null)

      .input("ModifiedBy", sql.Int, uploadedBy ? Number(uploadedBy) : null)

      .execute("InsertUpdatePropertyDocument");

    res.json({
      success: true,
      message: id
        ? "Document updated successfully"
        : "Document uploaded successfully",
      documents: result.recordset,
    });
  } catch (error) {
    console.error("uploadPropertyDoc:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Error saving document",
    });
  }
};

const deletePropertyDoc = async (req, res) => {
  try {
    const { CompanyID, PropertyID, id, DeletedBy } = req.body;

    if (!CompanyID || !PropertyID || !id) {
      return res.status(400).json({
        success: false,
        message: "CompanyID, PropertyID and DocumentID are required",
      });
    }

    const pool = await sql.connect(dbConfig);

    const result = await pool
      .request()

      .input("DocumentID", sql.Int, Number(id))

      .input("CompanyID", sql.Int, Number(CompanyID))

      .input("PropertyID", sql.Int, Number(PropertyID))

      .input("DeletedBy", sql.Int, DeletedBy ? Number(DeletedBy) : 0)

      .execute("DeletePropertyDocument");

    res.json({
      success: true,
      message: "Document deleted successfully",
      documents: result.recordset,
    });
  } catch (error) {
    console.error("deletePropertyDoc:", error);

    res.status(500).json({
      success: false,
      message: "Error deleting document",
    });
  }
};

module.exports = {
  getPropertyDocs,
  uploadPropertyDoc,
  deletePropertyDoc,
};
