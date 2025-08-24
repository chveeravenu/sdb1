// ticketController.js
const Ticket = require('../models/ticketModel');

// Controller function to create a new ticket
exports.createTicket = async (req, res) => {
    try {
        const { category, subject, email } = req.body;
        
        // Validate required fields
        if (!category || !subject || !email) {
            return res.status(400).json({
                message: 'Missing required fields. Category, subject, and email are required.',
            });
        }

        // Create a new ticket instance using the data from the request body
        const newTicket = new Ticket({
            category,
            subject,
            email
        });

        // Save the new ticket to the database
        await newTicket.save();

        // Send a success response back to the client
        res.status(201).json({ 
            message: 'Ticket created successfully!', 
            ticket: newTicket 
        });

    } catch (error) {
        console.error('Error creating ticket:', error);
        // Send an error response
        res.status(500).json({ 
            message: 'Failed to create ticket. Please try again.',
            error: error.message
        });
    }
};