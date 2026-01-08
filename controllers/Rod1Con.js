const express = require('express');
const Rod1 = require('../models/Rod1'); // Your subscription model


const Rodabc = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        
        const { courseId, email, subscriptionPlan } = req.body;

        // Validate required fields
        if (!courseId || !email || !subscriptionPlan) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: courseId, email, subscriptionPlan'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Check if subscription already exists for this user and course
        const existingSubscription = await Rod1.findOne({
            email: email.toLowerCase().trim(),
            courseId: courseId
        });

        if (existingSubscription) {
            return res.status(409).json({
                success: false,
                message: 'Subscription already exists for this course and user',
                existingSubscription: existingSubscription
            });
        }

        // Create new subscription
        const newSubscription = new Rod1({
            courseId,
            email: email.toLowerCase().trim(),
            subscriptionPlan,
            status: 'active'
        });

        // Save to database
        const savedSubscription = await newSubscription.save();

        console.log('Subscription saved successfully:', savedSubscription._id);

        // Send success response
        res.status(201).json({
            success: true,
            message: 'Subscription created successfully',
            subscription: savedSubscription,
            subscriptionId: savedSubscription._id
        });

    } catch (error) {
        console.error('Error in Rodabc controller:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: Object.keys(error.errors).map(key => ({
                    field: key,
                    message: error.errors[key].message
                }))
            });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Subscription already exists'
            });
        }

        // Generic server error
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};

module.exports = {
    Rodabc
};
