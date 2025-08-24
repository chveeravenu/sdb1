const express = require('express');
const User = require('../models/User');
const feedback = require('../models/feedbackModel');
const Ticket = require('../models/ticketModel');
const Cancellation = require('../models/cancellation'); // Assuming the cancellation model file is named cancellationModel.js

const serv = async(req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const userEmail = email.toLowerCase();

        // Get tickets count
        const ticketCount = await Ticket.countDocuments({ email: userEmail });

        // Get feedbacks
        const feedbacks = await feedback.find({ email: userEmail });
        const feedbackStats = {
            totalFeedbacks: feedbacks.length,
            averageRating: feedbacks.length > 0 ?
                (feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length).toFixed(2) : 0,
            feedbacks: feedbacks.map(fb => ({
                rating: fb.rating,
                description: fb.description,
                createdAt: fb.createdAt
            }))
        };

        // Get cancellation reasons
        const cancellationReasons = await Cancellation.find({ userEmail: userEmail });

        // Get today's date boundaries
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const result = await User.aggregate([
            { $match: { email: userEmail } },
            {
                $project: {
                    name: 1,
                    email: 1,
                    subscriptionPlan: 1,
                    websiteUsageTime: { $ifNull: ["$websiteUsageTime", 0] }, // Assume websiteUsageTime is a field
                    presentTimestamp: new Date(),
                    loginHistory: { $ifNull: ["$loginHistory", []] },
                    presentDayLoginCount: {
                        $sum: {
                            $map: {
                                input: { $ifNull: ["$loginHistory", []] },
                                as: "login",
                                in: {
                                    $cond: {
                                        if: {
                                            $and: [
                                                { $ne: ["$$login.date", null] },
                                                { $gte: ["$$login.date", startOfDay] },
                                                { $lt: ["$$login.date", endOfDay] }
                                            ]
                                        },
                                        then: { $ifNull: ["$$login.count", 1] },
                                        else: 0
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    loginHistoryGrouped: {
                        $arrayToObject: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: "$loginHistory",
                                        as: "login",
                                        cond: { $ne: ["$$login.date", null] }
                                    }
                                },
                                as: "login",
                                in: {
                                    k: {
                                        $dateToString: {
                                            format: "%Y-%m-%d",
                                            date: "$$login.date"
                                        }
                                    },
                                    v: { $ifNull: ["$$login.count", 1] }
                                }
                            }
                        }
                    }
                }
            }
        ]);

        if (!result || result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                ...result[0],
                ticketCount: ticketCount,
                feedbackStats: feedbackStats,
                cancellationReasons: cancellationReasons
            }
        });

    } catch (error) {
        console.error('Error in serv function:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

const servSimple = async(req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const userEmail = email.toLowerCase();

        // Find user by email
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Get tickets count
        const ticketCount = await Ticket.countDocuments({ email: userEmail });

        // Get feedbacks
        const feedbacks = await feedback.find({ email: userEmail });
        const feedbackStats = {
            totalFeedbacks: feedbacks.length,
            averageRating: feedbacks.length > 0 ?
                (feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length).toFixed(2) : 0,
            feedbacks: feedbacks.map(fb => ({
                rating: fb.rating,
                description: fb.description,
                createdAt: fb.createdAt
            }))
        };

        // Get cancellation reasons
        const cancellationReasons = await Cancellation.find({ userEmail: userEmail });

        // Get today's date boundaries
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        // Initialize loginHistory as empty array if it doesn't exist
        const loginHistory = user.loginHistory || [];

        let presentDayLoginCount = 0;
        const loginHistoryGrouped = {};

        loginHistory.forEach(entry => {
            if (entry.date) {
                const entryDate = new Date(entry.date);
                const dateStr = entryDate.toISOString().split('T')[0];
                const count = entry.count || 1;

                loginHistoryGrouped[dateStr] = count;

                if (entryDate >= startOfDay && entryDate < endOfDay) {
                    presentDayLoginCount += count;
                }
            }
        });

        // Prepare response data
        const responseData = {
            success: true,
            data: {
                name: user.name,
                email: user.email,
                subscriptionPlan: user.subscriptionPlan,
                websiteUsageTime: user.websiteUsageTime || 0, // Assuming this field exists on the User model
                presentDayLoginCount: presentDayLoginCount,
                loginHistoryGrouped: loginHistoryGrouped,
                ticketCount: ticketCount,
                feedbackStats: feedbackStats,
                cancellationReasons: cancellationReasons,
                presentTimestamp: new Date()
            }
        };

        return res.status(200).json(responseData);

    } catch (error) {
        console.error('Error in servSimple function:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

module.exports = {
    serv,
    servSimple
};