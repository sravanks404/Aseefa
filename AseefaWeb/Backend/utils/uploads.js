const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        const CompanyID = req.body.CompanyID;
        const PropertyID = req.body.PropertyID;

        // Match frontend field name
        const DocumentType = req.body.documentType;

        if (!CompanyID || !PropertyID || !DocumentType) {
            return cb(
                new Error("CompanyID, PropertyID and documentType are required")
            );
        }

        const folder = path.join(
            __dirname,
            "../propertyuploads/PropertyDocuments",
            `Company_${CompanyID}`,
            `Property_${PropertyID}`,
            DocumentType
        );

        fs.mkdirSync(folder, { recursive: true });

        cb(null, folder);
    },

    filename: function (req, file, cb) {

        const ext = path.extname(file.originalname);

        const fileName =
            `${Date.now()}_${Math.random()
                .toString(36)
                .substring(2, 8)}${ext}`;

        cb(null, fileName);
    }
});

const upload = multer({
    storage,

    limits: {
        fileSize: 25 * 1024 * 1024
    }
});

module.exports = upload;