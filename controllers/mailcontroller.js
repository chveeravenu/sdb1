const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');
const User = require('../models/User');

// ================= SENDGRID CONFIG =================
const SENDGRID_API_KEY = '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';
const FROM_EMAIL = 'cvenu88@gmail.com';

sgMail.setApiKey(SENDGRID_API_KEY);
// ==================================================

// Generate 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// ================= SEND OTP EMAIL =================
const sendOTPEmail = async (req, res) => {
  try {
    const { email, courseTitle } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const otp = generateOTP();

    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Email Verification</title>
</head>
<body style="font-family: Arial, sans-serif; background:#f6f9fc; padding:20px;">
  <div style="max-width:600px; margin:auto; background:#fff; border-radius:10px; padding:30px;">
    <h2 style="color:#3b82f6;">🎓 Course Enrollment Verification</h2>
    <p>You're almost ready to start learning!</p>

    ${courseTitle ? `<p><strong>Course:</strong> ${courseTitle}</p>` : ''}

    <div style="font-size:32px; font-weight:bold; margin:20px 0; color:#3b82f6;">
      ${otp}
    </div>

    <p>This OTP is valid for <strong>10 minutes</strong>.</p>
    <p>If you didn't request this, ignore this email.</p>
  </div>
</body>
</html>
`;

    await sgMail.send({
      to: email,
      from: {
        name: 'Your Learning Platform',
        email: FROM_EMAIL
      },
      subject: 'Course Enrollment Verification - OTP Code',
      html: htmlTemplate,
      text: `Your OTP is ${otp}. Valid for 10 minutes.`
    });

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      otp // ❌ REMOVE IN REAL PRODUCTION
    });

  } catch (error) {
    console.error('Error sending OTP email:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
};

// ================= TEST SENDGRID =================
const testEmailConfig = async (req, res) => {
  try {
    await sgMail.send({
      to: FROM_EMAIL,
      from: FROM_EMAIL,
      subject: 'SendGrid Test Email',
      text: 'SendGrid configuration is working!'
    });

    res.status(200).json({
      success: true,
      message: 'SendGrid configuration is valid'
    });
  } catch (error) {
    console.error('SendGrid test failed:', error);
    res.status(500).json({
      success: false,
      message: 'SendGrid configuration failed',
      error: error.message
    });
  }
};

// ================= REJOIN EMAIL =================
const retmailsend = async (req, res) => {
  try {
    const { email, rejoinLink } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const firstName = user.name ? user.name.split(' ')[0] : 'Learner';
    const finalLink = rejoinLink || 'https://learnhub.com/rejoin';

    const htmlTemplate = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;">
  <div style="max-width:600px;margin:auto;background:#fff;padding:30px;border-radius:8px;">
    <h2>Hi ${firstName},</h2>
    <p>Your success story awaits at <strong>LearnHub</strong> 🚀</p>

    <ul>
      <li>🎯 Industry-ready skills</li>
      <li>📺 HD learning experience</li>
      <li>🧑‍🏫 Expert mentoring</li>
      <li>🏆 Recognized certificates</li>
    </ul>

    <a href="${finalLink}" 
       style="display:inline-block;margin-top:20px;padding:14px 30px;
              background:#667eea;color:white;border-radius:30px;
              text-decoration:none;font-weight:bold;">
      👉 Rejoin LearnHub
    </a>

    <p style="margin-top:30px;">Team LearnHub</p>
  </div>
</body>
</html>
`;

    await sgMail.send({
      to: email,
      from: {
        name: 'LearnHub Team',
        email: FROM_EMAIL
      },
      subject: `${firstName}, Your Success Story Awaits at LearnHub! 🚀`,
      html: htmlTemplate,
      text: `Rejoin LearnHub here: ${finalLink}`
    });

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Rejoin email error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
};

// ================= EXPORT =================
module.exports = {
  sendOTPEmail,
  testEmailConfig,
  retmailsend
};
