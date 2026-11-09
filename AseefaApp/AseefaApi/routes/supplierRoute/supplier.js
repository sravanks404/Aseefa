const express = require('express');
const router = express.Router();
const { insertSupplier } = require('../../controller/supplier/supplier');

router.post('/insertSupplier', insertSupplier);
router.get('/insertSupplier', (req, res) => {
    res.json({
        message: 'GET route reached'
    });
});

module.exports = router;