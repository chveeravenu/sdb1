// feedbackModel.js
const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        validate: {
            validator: function(v) {
                return v >= 1 && v <= 5;
            },
            message: 'Rating must be between 1 and 5'
        }
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: [400, 'Description cannot exceed 1000 characters']
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Please enter a valid email address'
        }
    },
    // status: {
    //     type: String,
    //     enum: ['pending', 'reviewed', 'resolved'],
    //     default: 'pending'
    // }
}, {
    timestamps: true // This will add createdAt and updatedAt fields automatically
});

// Index for better query performance
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ email: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);