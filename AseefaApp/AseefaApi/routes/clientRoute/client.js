const express = require("express");
const router = express.Router();
const {
  insertClient,
  getClientDetails,
  insertRequirement,
  getTodayClientSupplierCount,
  getChartData,
  getCustomersByCompanyid,
} = require("../../controller/clientController/client");

router.post("/insertClient", insertClient);
router.get("/insertClient", (req, res) => {
  res.json({
    message: "GET route reached",
  });
});

router.get("/getClientDetails", getClientDetails);

router.post("/insertRequirement", insertRequirement);
router.get("/accountCount", getTodayClientSupplierCount);
router.get("/chartData", getChartData);
router.get("/getCustomersByCompanyid", getCustomersByCompanyid);

module.exports = router;
