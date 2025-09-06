const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/User');

// Configure nodemailer transporter - FIXED: createTransport (not createTransporter)
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use other services like 'outlook', 'yahoo', etc.
  auth: {
    user: "cvenu88@gmail.com", // Your email address
    pass: "vsat dzqm vgxp wqmi"  // Your email password or app-specific password
  }
});

// Generate 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Send OTP email
const sendOTPEmail = async (req, res) => {
  try {
    const { email, courseTitle } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Email template
    const mailOptions = {
      from: {
        name: 'Your Learning Platform',
        address: "cvenu88@gmail.com" // Use the actual email instead of process.env.EMAIL_USER
      },
      to: email,
      subject: 'Course Enrollment Verification - OTP Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f6f9fc;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: white;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #3b82f6, #8b5cf6);
              padding: 30px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 30px;
              text-align: center;
            }
            .otp-code {
              background-color: #f8fafc;
              border: 2px dashed #3b82f6;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              font-size: 32px;
              font-weight: bold;
              color: #3b82f6;
              letter-spacing: 4px;
            }
            .info {
              background-color: #eff6ff;
              border-left: 4px solid #3b82f6;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              background-color: #f8fafc;
              padding: 20px;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
            }
            .course-info {
              background-color: #f0f9ff;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 Course Enrollment Verification</h1>
            </div>
            <div class="content">
              <h2 style="color: #1f2937; margin-bottom: 10px;">Verify Your Email Address</h2>
              <p style="color: #6b7280; font-size: 16px;">
                You're almost ready to start learning! Please use the verification code below to complete your enrollment.
              </p>
              
              ${courseTitle ? `
                <div class="course-info">
                  <h3 style="color: #3b82f6; margin: 0 0 5px 0;">Course:</h3>
                  <p style="color: #1f2937; margin: 0; font-weight: 500;">${courseTitle}</p>
                </div>
              ` : ''}
              
              <div class="otp-code">
                ${otp}
              </div>
              
              <div class="info">
                <p style="margin: 0; color: #374151;">
                  <strong>Important:</strong> This verification code will expire in <strong>10 minutes</strong>. 
                  If you didn't request this, please ignore this email.
                </p>
              </div>
              
              <p style="color: #6b7280; margin-top: 30px;">
                Having trouble? Reply to this email or contact our support team.
              </p>
            </div>
            <div class="footer">
              <p style="margin: 0;">
                This email was sent by Your Learning Platform<br>
                © ${new Date().getFullYear()} All rights reserved
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      // Plain text version for email clients that don't support HTML
      text: `
        Course Enrollment Verification
        
        Your verification code is: ${otp}
        
        ${courseTitle ? `Course: ${courseTitle}` : ''}
        
        This code will expire in 10 minutes.
        
        If you didn't request this verification, please ignore this email.
        
        Thank you,
        Your Learning Platform Team
      `
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));

    // Return success response with OTP (in production, you might want to store OTP in database instead)
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      otp: otp, // Remove this in production for security
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Test email configuration
const testEmailConfig = async (req, res) => {
  try {
    await transporter.verify();
    res.status(200).json({
      success: true,
      message: 'Email configuration is valid'
    });
  } catch (error) {
    console.error('Email configuration error:', error);
    res.status(500).json({
      success: false,
      message: 'Email configuration failed',
      error: error.message
    });
  }
};

const retmailsend = async (req, res) => {
    try {
        const { email, rejoinLink } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const userEmail = email.toLowerCase();

        // Find user by email to get their name
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Extract first name from full name
        const firstName = user.name ? user.name.split(' ')[0] : 'Learner';
        
        // Default rejoin link if not provided
        const defaultRejoinLink = rejoinLink || 'https://learnhub.com/rejoin';

        // HTML email template
        const htmlTemplate = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Rejoin LearnHub - Your Future Awaits!</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">LearnHub</h1>
                    <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Your Gateway to Success</p>
                </div>

                <!-- Main Content -->
                <div style="padding: 40px 30px;">
                    <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Hi ${firstName},</h2>
                    
                    <p style="color: #666; line-height: 1.6; margin-bottom: 20px; font-size: 16px;">
                        At <strong>LearnHub</strong>, we don't just teach — we prepare you for success. Our mission is to help you build industry-required skills that open doors to high-paying jobs and rewarding careers. Whether you're preparing for placements, interviews, or upskilling for your next big opportunity, LearnHub has everything you need.
                    </p>

                    <h3 style="color: #333; margin: 30px 0 20px 0; font-size: 20px;">Here's why thousands of learners choose us:</h3>
                    
                    <div style="background-color: #f8f9ff; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                        <div style="margin-bottom: 15px;">
                            <span style="font-size: 20px; margin-right: 10px;">🎯</span>
                            <strong style="color: #333;">Master in-demand skills</strong> designed by industry experts.
                        </div>
                        <div style="margin-bottom: 15px;">
                            <span style="font-size: 20px; margin-right: 10px;">📺</span>
                            <strong style="color: #333;">HD & 4K video quality</strong> for an engaging learning experience.
                        </div>
                        <div style="margin-bottom: 15px;">
                            <span style="font-size: 20px; margin-right: 10px;">🧑‍🏫</span>
                            <strong style="color: #333;">1-on-1 mentoring & live workshops</strong> to guide your journey.
                        </div>
                        <div style="margin-bottom: 15px;">
                            <span style="font-size: 20px; margin-right: 10px;">🏆</span>
                            <strong style="color: #333;">Industry-recognized certificates</strong> that boost your profile.
                        </div>
                        <div>
                            <span style="font-size: 20px; margin-right: 10px;">🚀</span>
                            <strong style="color: #333;">Career guidance & job placement assistance</strong> to help you land your dream role.
                        </div>
                    </div>

                    <h3 style="color: #333; margin: 30px 0 20px 0; font-size: 20px;">✨ With LearnHub, you'll:</h3>
                    
                    <ul style="color: #666; line-height: 1.8; padding-left: 20px; margin-bottom: 30px;">
                        <li>Stay ahead by learning the skills employers want today.</li>
                        <li>Build confidence with practical, job-ready knowledge.</li>
                        <li>Access a wide range of technical and personal development courses.</li>
                        <li>Join a supportive community that grows with you.</li>
                    </ul>

                    <div style="background: linear-gradient(135deg, #ff7b7b 0%, #ff9a56 100%); padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                        <p style="color: white; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">
                            Don't wait! Rejoin LearnHub now and get exclusive perks like a free premium month or special discounts — your future career starts here.
                        </p>
                    </div>

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${defaultRejoinLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: transform 0.2s;">
                            👉 Rejoin LearnHub Today
                        </a>
                    </div>

                    <p style="color: #666; line-height: 1.6; margin-top: 30px; font-size: 16px;">
                        Stay motivated,<br>
                        <strong style="color: #333;">Team LearnHub</strong>
                    </p>
                </div>

                <!-- Footer -->
                <div style="background-color: #f8f9ff; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #999; font-size: 14px; margin: 0;">
                        This email was sent to ${userEmail}. If you don't want to receive these emails, you can unsubscribe.
                    </p>
                    <p style="color: #999; font-size: 14px; margin: 10px 0 0 0;">
                        © 2025 LearnHub. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>`;

        // Plain text version
        const textTemplate = `
Hi ${firstName},

At LearnHub, we don't just teach — we prepare you for success. Our mission is to help you build industry-required skills that open doors to high-paying jobs and rewarding careers. Whether you're preparing for placements, interviews, or upskilling for your next big opportunity, LearnHub has everything you need.

Here's why thousands of learners choose us:
🎯 Master in-demand skills designed by industry experts.
📺 HD & 4K video quality for an engaging learning experience.
🧑‍🏫 1-on-1 mentoring & live workshops to guide your journey.
🏆 Industry-recognized certificates that boost your profile.
🚀 Career guidance & job placement assistance to help you land your dream role.

✨ With LearnHub, you'll:
- Stay ahead by learning the skills employers want today.
- Build confidence with practical, job-ready knowledge.
- Access a wide range of technical and personal development courses.
- Join a supportive community that grows with you.

Don't wait! Rejoin LearnHub now and get exclusive perks like a free premium month or special discounts — your future career starts here.

Rejoin LearnHub: ${defaultRejoinLink}

Stay motivated,
Team LearnHub
        `;

        // Email options
        const mailOptions = {
            from: `"LearnHub Team" <cvenu88@gmail.com>`,
            to: userEmail,
            subject: `${firstName}, Your Success Story Awaits at LearnHub! 🚀`,
            text: textTemplate,
            html: htmlTemplate
        };

        // Send email using the existing transporter
        const info = await transporter.sendMail(mailOptions);

        return res.status(200).json({
            success: true,
            message: "Email sent successfully",
            data: {
                recipient: userEmail,
                firstName: firstName,
                messageId: info.messageId,
                rejoinLink: defaultRejoinLink,
                sentAt: new Date()
            }
        });

    } catch (error) {
        console.error('Error in retmailsend function:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to send email",
            error: error.message
        });
    }
};

module.exports = {
  sendOTPEmail,
  testEmailConfig,
  retmailsend
};