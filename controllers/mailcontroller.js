const nodemailer = require('nodemailer');
const crypto = require('crypto');

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

module.exports = {
  sendOTPEmail,
  testEmailConfig
};