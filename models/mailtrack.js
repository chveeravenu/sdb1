// models/emailTracking.js
const mongoose = require('mongoose');

const emailTrackingSchema = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    emailType: {
        type: String,
        required: true,
        enum: ['cancellation_confirmation', 'course_reminder', 'welcome', 'promotion', 'newsletter', 'other'],
        default: 'other'
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    trackingId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    originalLink: {
        type: String,
        required: true,
        trim: true
    },
    linkClicked: {
        type: String,
        enum: ['yes', 'no'],
        default: 'no'
    },
    clickedAt: {
        type: Date,
        default: null
    },
    emailSentAt: {
        type: Date,
        default: Date.now
    },
    userAgent: {
        type: String,
        default: null
    },
    ipAddress: {
        type: String,
        default: null
    },
    clickCount: {
        type: Number,
        default: 0
    },
    // Additional metadata for different email types
    courseId: {
        type: String,
        default: null // For course-related emails
    },
    cancellationId: {
        type: String,
        default: null // For cancellation-related emails
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Indexes for better query performance
emailTrackingSchema.index({ userEmail: 1, emailType: 1 });
emailTrackingSchema.index({ linkClicked: 1 });
emailTrackingSchema.index({ emailSentAt: 1 });
emailTrackingSchema.index({ trackingId: 1 }, { unique: true });

// Virtual for checking if email was clicked
emailTrackingSchema.virtual('wasClicked').get(function() {
    return this.linkClicked === 'yes';
});

// Method to mark as clicked
emailTrackingSchema.methods.markAsClicked = function(userAgent, ipAddress) {
    this.linkClicked = 'yes';
    this.clickCount += 1;
    this.userAgent = userAgent;
    this.ipAddress = ipAddress;
    
    // Set clickedAt only on first click
    if (!this.clickedAt) {
        this.clickedAt = new Date();
    }
    
    return this.save();
};

module.exports = mongoose.model('EmailTracking', emailTrackingSchema);