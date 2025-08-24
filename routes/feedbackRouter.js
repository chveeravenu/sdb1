// feedbackRouter.js
const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

// POST /feedback - Create new feedback or update existing (no authentication required)
router.post('/', feedbackController.createFeedback);

// GET /feedback/:email - Get existing feedback for a user (optional)
router.get('/:email', feedbackController.getFeedbackByEmail);

module.exports = router;