// controllers/emailController.js
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const EmailTracking = require('../models/mailtrack');

// Corrected: Use createTransport instead of createTransporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your preferred email service
    auth: {
        user: "cvenu88@gmail.com", // Your email address
        pass: "vsat dzqm vgxp wqmi"  // Your app password
    }
});

// Utility function to generate unique tracking ID
const generateTrackingId = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Utility function to create email HTML template
const createEmailTemplate = (trackableLink, customMessage, subject) => {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0;">
                
                <div style="background-color: #007bff; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">${subject}</h1>
                </div>
                
                <div style="padding: 30px 20px;">
                    <h2 style="color: #333; margin-bottom: 20px;">Hello!</h2>
                    
                    <p style="color: #666; line-height: 1.6; margin-bottom: 25px; font-size: 16px;">
                        ${customMessage || 'We hope this message finds you well. Please click the button below to continue.'}
                    </p>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${trackableLink}" 
                           style="background-color: #007bff; 
                                     color: white; 
                                     padding: 15px 30px; 
                                     text-decoration: none; 
                                     border-radius: 5px; 
                                     display: inline-block;
                                     font-weight: bold;
                                     font-size: 16px;
                                     transition: background-color 0.3s;">
                                 Click Here to Continue
                        </a>
                    </div>
                    
                    <p style="color: #888; font-size: 14px; line-height: 1.5;">
                        If the button above doesn't work, you can copy and paste this link into your browser:
                        <br>
                        <a href="${trackableLink}" style="color: #007bff; word-break: break-all;">
                            ${trackableLink}
                        </a>
                    </p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
                    <p style="color: #6c757d; font-size: 12px; margin: 0; line-height: 1.4;">
                        This is an automated message. Please do not reply to this email.
                        <br>
                        If you have any questions, please contact our support team.
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;
};

// Send trackable email
const sendTrackableEmail = async (req, res) => {
    console.log('=== SENDING TRACKABLE EMAIL ===');
    
    try {
        const { 
            userEmail, 
            subject, 
            originalLink, 
            emailType = 'other',
            courseId = null,
            cancellationId = null,
            customMessage = '',
            metadata = {}
        } = req.body;

        console.log('Email request data:', {
            userEmail,
            subject,
            originalLink,
            emailType
        });

        // Validation
        if (!userEmail || !subject || !originalLink) {
            return res.status(400).json({
                success: false,
                message: 'userEmail, subject, and originalLink are required.',
                received: {
                    userEmail: !!userEmail,
                    subject: !!subject,
                    originalLink: !!originalLink
                }
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format.'
            });
        }

        // Generate unique tracking ID
        const trackingId = generateTrackingId();
        console.log('Generated tracking ID:', trackingId);

        // Create trackable link
        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        const trackableLink = `${baseUrl}/api/email/track-link/${trackingId}`;

        // Create email tracking record
        const emailTracking = new EmailTracking({
            userEmail: userEmail.toLowerCase(),
            emailType,
            subject,
            trackingId,
            originalLink,
            courseId,
            cancellationId,
            metadata
        });

        const savedTracking = await emailTracking.save();
        console.log('Email tracking record saved:', savedTracking._id);

        // Create email content using template
        const emailContent = createEmailTemplate(trackableLink, customMessage, subject);

        // Email options
        const mailOptions = {
            from: {
                name: process.env.EMAIL_FROM_NAME || 'Learning Platform',
                address: process.env.EMAIL_USER
            },
            to: userEmail,
            subject: subject,
            html: emailContent,
            // Add tracking pixel (optional)
            headers: {
                'X-Tracking-ID': trackingId
            }
        };

        console.log('Sending email...');
        const emailResult = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', emailResult.messageId);

        res.status(200).json({
            success: true,
            message: 'Trackable email sent successfully.',
            data: {
                trackingId: trackingId,
                trackableLink: trackableLink,
                emailId: savedTracking._id,
                messageId: emailResult.messageId,
                recipient: userEmail
            }
        });

    } catch (error) {
        console.error('=== EMAIL SENDING ERROR ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        res.status(500).json({
            success: false,
            message: 'Failed to send email.',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Handle link click tracking
const trackLinkClick = async (req, res) => {
    console.log('=== TRACKING LINK CLICK ===');
    
    try {
        const { trackingId } = req.params;
        
        console.log('Tracking ID:', trackingId);
        console.log('User Agent:', req.get('User-Agent'));
        console.log('IP Address:', req.ip);

        if (!trackingId) {
            return res.status(400).json({
                success: false,
                message: 'Tracking ID is required.'
            });
        }

        // Find the email tracking record
        const emailTracking = await EmailTracking.findOne({ trackingId });

        if (!emailTracking) {
            console.log('Tracking link not found for ID:', trackingId);
            return res.status(404).send(`
                <html>
                    <head><title>Link Not Found</title></head>
                    <body>
                        <h2>Link Not Found</h2>
                        <p>The tracking link you clicked is invalid or has expired.</p>
                    </body>
                </html>
            `);
        }

        console.log('Found email tracking record:', {
            userEmail: emailTracking.userEmail,
            emailType: emailTracking.emailType,
            currentClickCount: emailTracking.clickCount
        });

        // Update using the schema method
        await emailTracking.markAsClicked(
            req.get('User-Agent'),
            req.ip || req.connection.remoteAddress
        );

        console.log('Link click tracked successfully');
        console.log('Redirecting to:', emailTracking.originalLink);

        // Redirect to original link
        res.redirect(emailTracking.originalLink);

    } catch (error) {
        console.error('=== LINK TRACKING ERROR ===');
        console.error('Error:', error.message);
        
        res.status(500).send(`
            <html>
                <head><title>Error</title></head>
                <body>
                    <h2>Oops! Something went wrong</h2>
                    <p>We encountered an error while processing your request. Please try again later.</p>
                </body>
            </html>
        `);
    }
};

// Get email tracking statistics
const getEmailStats = async (req, res) => {
    try {
        const { userEmail, emailType, startDate, endDate } = req.query;

        // Build query filters
        let query = {};
        if (userEmail) query.userEmail = userEmail.toLowerCase();
        if (emailType) query.emailType = emailType;
        if (startDate && endDate) {
            query.emailSentAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        console.log('Stats query:', query);

        // Get email statistics
        const [allEmails, clickedEmails] = await Promise.all([
            EmailTracking.find(query),
            EmailTracking.find({ ...query, linkClicked: 'yes' })
        ]);

        // Calculate statistics
        const stats = {
            totalEmailsSent: allEmails.length,
            totalClicks: clickedEmails.length,
            uniqueClickRate: allEmails.length > 0 ? 
                ((clickedEmails.length / allEmails.length) * 100).toFixed(2) : 0,
            totalClickCount: allEmails.reduce((sum, email) => sum + email.clickCount, 0),
            averageClicksPerEmail: allEmails.length > 0 ? 
                (allEmails.reduce((sum, email) => sum + email.clickCount, 0) / allEmails.length).toFixed(2) : 0,
            emailsByType: {},
            clicksByType: {},
            clickRateByType: {}
        };

        // Group statistics by email type
        allEmails.forEach(email => {
            const type = email.emailType;
            stats.emailsByType[type] = (stats.emailsByType[type] || 0) + 1;
        });

        clickedEmails.forEach(email => {
            const type = email.emailType;
            stats.clicksByType[type] = (stats.clicksByType[type] || 0) + 1;
        });

        // Calculate click rate by type
        Object.keys(stats.emailsByType).forEach(type => {
            const sent = stats.emailsByType[type];
            const clicked = stats.clicksByType[type] || 0;
            stats.clickRateByType[type] = ((clicked / sent) * 100).toFixed(2);
        });

        res.status(200).json({
            success: true,
            data: {
                statistics: stats,
                recentEmails: allEmails
                    .sort((a, b) => new Date(b.emailSentAt) - new Date(a.emailSentAt))
                    .slice(0, 10),
                query: query
            }
        });

    } catch (error) {
        console.error('Error getting email stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get email statistics.',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get tracking details for specific email
const getTrackingDetails = async (req, res) => {
    try {
        const { trackingId } = req.params;

        if (!trackingId) {
            return res.status(400).json({
                success: false,
                message: 'Tracking ID is required.'
            });
        }

        const emailTracking = await EmailTracking.findOne({ trackingId });

        if (!emailTracking) {
            return res.status(404).json({
                success: false,
                message: 'Tracking record not found.'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                trackingDetails: emailTracking,
                wasClicked: emailTracking.wasClicked,
                daysSinceCreated: Math.floor(
                    (new Date() - emailTracking.emailSentAt) / (1000 * 60 * 60 * 24)
                )
            }
        });

    } catch (error) {
        console.error('Error getting tracking details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get tracking details.',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get all emails for a specific user
const getUserEmails = async (req, res) => {
    try {
        const { userEmail } = req.params;
        
        if (!userEmail) {
            return res.status(400).json({
                success: false,
                message: 'User email is required.'
            });
        }

        const emails = await EmailTracking.find({ 
            userEmail: userEmail.toLowerCase() 
        }).sort({ emailSentAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                userEmail: userEmail,
                totalEmails: emails.length,
                emails: emails
            }
        });

    } catch (error) {
        console.error('Error getting user emails:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user emails.',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = {
    sendTrackableEmail,
    trackLinkClick,
    getEmailStats,
    getTrackingDetails,
    getUserEmails
};