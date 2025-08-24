// Example ticketModel.js
const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Please enter a valid email address'
        }
    }
}, {
    timestamps: true // This will add createdAt and updatedAt fields automatically
});

module.exports = mongoose.model('Ticket', ticketSchema);