const express = require('express');
const router = express.Router();
const mailr= require('../controllers/mailcontroller');

// POST /mailer - Send OTP email
router.post('/', mailr.sendOTPEmail);

// GET /mailer/test - Test email configuration
router.get('/test',mailr.testEmailConfig);

module.exports = router;