const Cancellation = require('../models/cancellation');
const User = require('../models/User'); // Assuming this model is defined as you provided
const mongoose = require('mongoose');

// This function now handles storing the cancellation request AND updating the user
const submitCancellation = async (req, res) => {
    try {
        const { email, courseId, reason } = req.body;
        console.log(email, courseId, reason)

        // Basic validation
        if (!email || !courseId || !reason) {
            return res.status(400).json({
                success: false,
                message: 'Email, courseId, and reason are required.'
            });
        }

        // Check if a cancellation request already exists
        const existingCancellation = await Cancellation.findOne({
            userEmail: email.toLowerCase(),
            courseId
        });

        if (existingCancellation) {
            return res.status(400).json({
                success: false,
                message: 'A cancellation request for this course already exists.'
            });
        }

        // Find the user to update their enrolledCourses
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }
        
        // Find and remove the course from the enrolledCourses array
        const enrollmentIndex = user.enrolledCourses.findIndex(
            (course) => course.courseId === courseId
        );

        if (enrollmentIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Enrollment not found for this user and course.'
            });
        }

        const removedCourse = user.enrolledCourses.splice(enrollmentIndex, 1);
        await user.save(); // Save the user document with the removed course

        // Create a new cancellation record
        const cancellation = new Cancellation({
            userEmail: email.toLowerCase(),
            courseId,
            cancellationReason: reason.trim()
        });

        await cancellation.save();

        res.status(201).json({
            success: true,
            message: `Your cancellation request for course ${courseId} has been submitted and your enrollment has been removed.`,
            cancellationId: cancellation._id,
            removedCourse: removedCourse[0]
        });

    } catch (error) {
        console.error('Error submitting cancellation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit cancellation request.',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = {
    submitCancellation
};