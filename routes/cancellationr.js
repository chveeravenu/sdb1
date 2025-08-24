const express = require('express');
const router = express.Router();
const { submitCancellation } = require('../controllers/cancellationController');

// POST /cancellation/submit - Submit a new cancellation request
router.post('/submit', submitCancellation);

module.exports = router;