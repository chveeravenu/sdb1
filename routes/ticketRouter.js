// ticketRouter.js
const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

// Define the POST route for creating a new ticket
// The path is relative to the base path defined in server.js (/api/tickets)
router.post('/', ticketController.createTicket);

module.exports = router;
