// feedbackController.js
const Feedback = require('../models/feedbackModel');

exports.createFeedback = async (req, res) => {
    try {
        const { rating, description, email } = req.body;

        // Validate required fields
        if (!rating || !description || !email) {
            return res.status(400).json({
                message: 'Missing required fields. Rating, description, and email are required.',
            });
        }

        // Validate rating range
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                message: 'Rating must be between 1 and 5.',
            });
        }

        // Check if feedback already exists for this email
        const existingFeedback = await Feedback.findOne({ email: email.toLowerCase() });

        let feedback;
        let message;
        let statusCode;

        if (existingFeedback) {
            // Update existing feedback (override)
            existingFeedback.rating = rating;
            existingFeedback.description = description;
            existingFeedback.status = 'pending'; // Reset status to pending when updated
            
            feedback = await existingFeedback.save();
            message = 'Feedback updated successfully!';
            statusCode = 200; // OK for update
            
            console.log(`Feedback updated for email: ${email}`);
        } else {
            // Create new feedback
            feedback = new Feedback({
                rating,
                description,
                email: email.toLowerCase()
            });
            
            await feedback.save();
            message = 'Feedback submitted successfully!';
            statusCode = 201; // Created for new feedback
            
            console.log(`New feedback created for email: ${email}`);
        }

        res.status(statusCode).json({
            message: message,
            feedback: feedback,
            isUpdate: !!existingFeedback // Boolean flag to indicate if it was an update
        });

    } catch (error) {
        console.error('Error submitting feedback:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                message: 'Validation failed',
                errors: validationErrors,
            });
        }

        res.status(500).json({
            message: 'Failed to submit feedback. Please try again.',
            error: error.message,
        });
    }
};

// Get existing feedback by email (optional feature)
exports.getFeedbackByEmail = async (req, res) => {
    try {
        const { email } = req.params;
        
        if (!email) {
            return res.status(400).json({
                message: 'Email parameter is required.',
            });
        }

        const feedback = await Feedback.findOne({ email: email.toLowerCase() });
        
        if (!feedback) {
            return res.status(404).json({
                message: 'No feedback found for this email.',
                feedback: null
            });
        }

        res.status(200).json({
            message: 'Feedback retrieved successfully!',
            feedback: feedback
        });

    } catch (error) {
        console.error('Error retrieving feedback:', error);
        res.status(500).json({
            message: 'Failed to retrieve feedback. Please try again.',
            error: error.message,
        });
    }
};