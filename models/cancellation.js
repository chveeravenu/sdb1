const mongoose = require('mongoose');

const cancellationSchema = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        ref: 'User' // Links to the User model, assuming it exists
    },
    courseId: {
        type: String,
        required: true,
        // ref: 'Course' // You can add a reference here if you have a Course model
    },
    cancellationReason: {
        type: String,
        required: true,
        trim: true,
        maxLength: 500
    },
    cancellationDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient lookups
cancellationSchema.index({ userEmail: 1, courseId: 1 }, { unique: true });

let Cancellation;
try {
    Cancellation = mongoose.model('Cancellation');
} catch (error) {
    Cancellation = mongoose.model('Cancellation', cancellationSchema);
}

module.exports = Cancellation;