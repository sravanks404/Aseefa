const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const CompanyID  = req.body.CompanyID;
        const PropertyID = req.body.PropertyID;
        const RentID     = req.body.RentID;

        if (!CompanyID || !PropertyID || !RentID) {
            return cb(new Error("CompanyID, PropertyID and RentID are required"));
        }

        const folder = path.join(
            __dirname,
            "../uploads/RentalTransactions",
            `Company_${CompanyID}`,
            `Property_${PropertyID}`,
            `Rent_${RentID}`
        );

        fs.mkdirSync(folder, { recursive: true });
        cb(null, folder);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`);
    }
});

module.exports = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });