// routes/emailRoutes.js
const express = require('express');
const router = express.Router();
const {
    sendTrackableEmail,
    trackLinkClick,
    getEmailStats,
    getTrackingDetails,
    getUserEmails
} = require('../controllers/mailtrackcont');

// ===== EMAIL SENDING ROUTES =====

/**
 * @route   POST /api/email/send-trackable
 * @desc    Send a trackable email with click tracking
 * @access  Public/Private (add auth middleware as needed)
 * @body    {
 *   userEmail: string (required),
 *   subject: string (required), 
 *   originalLink: string (required),
 *   emailType: string (optional - 'cancellation_confirmation', 'course_reminder', etc.),
 *   courseId: string (optional),
 *   cancellationId: string (optional),
 *   customMessage: string (optional),
 *   metadata: object (optional)
 * }
 */
router.post('/send-trackable', sendTrackableEmail);

// ===== LINK TRACKING ROUTES =====

/**
 * @route   GET /api/email/track-link/:trackingId
 * @desc    Track email link click and redirect to original URL
 * @access  Public
 * @params  trackingId: string (required)
 * @note    This endpoint redirects users, so it returns HTML on error
 */
router.get('/track-link/:trackingId', trackLinkClick);

// ===== ANALYTICS & REPORTING ROUTES =====

/**
 * @route   GET /api/email/stats
 * @desc    Get email tracking statistics with optional filters
 * @access  Private (add auth middleware)
 * @query   {
 *   userEmail?: string,
 *   emailType?: string,
 *   startDate?: string (ISO date),
 *   endDate?: string (ISO date)
 * }
 */
router.get('/stats', getEmailStats);

/**
 * @route   GET /api/email/tracking/:trackingId
 * @desc    Get detailed tracking information for a specific email
 * @access  Private (add auth middleware)
 * @params  trackingId: string (required)
 */
router.get('/tracking/:trackingId', getTrackingDetails);

/**
 * @route   GET /api/email/user/:userEmail
 * @desc    Get all emails sent to a specific user
 * @access  Private (add auth middleware)
 * @params  userEmail: string (required)
 */
router.get('/user/:userEmail', getUserEmails);

// ===== BULK OPERATIONS ROUTES (Optional) =====

/**
 * @route   GET /api/email/unclicked
 * @desc    Get all emails that haven't been clicked
 * @access  Private (add auth middleware)
 */
router.get('/unclicked', async (req, res) => {
    try {
        const { limit = 50, page = 1 } = req.query;
        const skip = (page - 1) * limit;
        
        const EmailTracking = require('../models/emailTracking');
        
        const unclickedEmails = await EmailTracking.find({ 
            linkClicked: 'no' 
        })
        .sort({ emailSentAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);

        const totalCount = await EmailTracking.countDocuments({ 
            linkClicked: 'no' 
        });

        res.status(200).json({
            success: true,
            data: {
                emails: unclickedEmails,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalCount / limit),
                    totalEmails: totalCount,
                    hasNext: skip + unclickedEmails.length < totalCount,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Error getting unclicked emails:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get unclicked emails.'
        });
    }
});

/**
 * @route   DELETE /api/email/tracking/:trackingId
 * @desc    Delete a specific email tracking record
 * @access  Private (add auth middleware)
 * @params  trackingId: string (required)
 */
router.delete('/tracking/:trackingId', async (req, res) => {
    try {
        const { trackingId } = req.params;
        
        const EmailTracking = require('../models/emailTracking');
        
        const deletedEmail = await EmailTracking.findOneAndDelete({ trackingId });
        
        if (!deletedEmail) {
            return res.status(404).json({
                success: false,
                message: 'Email tracking record not found.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Email tracking record deleted successfully.',
            data: {
                deletedEmail: {
                    trackingId: deletedEmail.trackingId,
                    userEmail: deletedEmail.userEmail,
                    subject: deletedEmail.subject
                }
            }
        });
    } catch (error) {
        console.error('Error deleting email tracking record:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete email tracking record.'
        });
    }
});

// ===== EMAIL TYPE STATISTICS ROUTE =====

/**
 * @route   GET /api/email/stats/by-type
 * @desc    Get email statistics grouped by email type
 * @access  Private (add auth middleware)
 */
router.get('/stats/by-type', async (req, res) => {
    try {
        const EmailTracking = require('../models/emailTracking');
        
        const stats = await EmailTracking.aggregate([
            {
                $group: {
                    _id: '$emailType',
                    totalEmails: { $sum: 1 },
                    clickedEmails: {
                        $sum: { $cond: [{ $eq: ['$linkClicked', 'yes'] }, 1, 0] }
                    },
                    totalClicks: { $sum: '$clickCount' },
                    averageClicksPerEmail: { $avg: '$clickCount' }
                }
            },
            {
                $addFields: {
                    clickRate: {
                        $multiply: [
                            { $divide: ['$clickedEmails', '$totalEmails'] },
                            100
                        ]
                    }
                }
            },
            {
                $sort: { totalEmails: -1 }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                statisticsByType: stats,
                totalTypes: stats.length
            }
        });
    } catch (error) {
        console.error('Error getting stats by type:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get statistics by email type.'
        });
    }
});

// ===== MIDDLEWARE EXAMPLES =====

// Example authentication middleware (uncomment and modify as needed)
/*
const authenticate = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }
    
    try {
        // Verify token logic here
        // const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Invalid token.'
        });
    }
};

// Apply authentication to protected routes
router.get('/stats', authenticate, getEmailStats);
router.get('/tracking/:trackingId', authenticate, getTrackingDetails);
router.get('/user/:userEmail', authenticate, getUserEmails);
*/

// Rate limiting middleware example
/*
const rateLimit = require('express-rate-limit');

const emailSendLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 email requests per windowMs
    message: {
        success: false,
        message: 'Too many email requests, please try again later.'
    }
});

router.post('/send-trackable', emailSendLimiter, sendTrackableEmail);
*/

module.exports = router;