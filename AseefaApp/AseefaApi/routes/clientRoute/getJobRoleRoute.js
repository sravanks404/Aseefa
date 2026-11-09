const express = require("express");
const router = express.Router();

const getJobRole = require("../../controller/clientController/getJobRole");

router.get("/getJobRole", getJobRole);

module.exports = router;
