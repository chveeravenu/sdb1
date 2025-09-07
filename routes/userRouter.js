const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

const JWT_SECRET = 'your-secret-key-here';

// ===== Profile & stats =====
router.get('/profile', authMiddleware, userController.getUserProfile);
router.put('/profile', authMiddleware, userController.updateUserProfile);
router.get('/stats', authMiddleware, userController.getUserStats);

// ===== Enroll / progress =====
router.get('/enrolled-courses', authMiddleware, userController.getEnrolledCourses);
router.post('/courseup', userController.courseu);
router.post('/coursechec', userController.enrollcheck);
router.post('/updateprogress', userController.updateProgress);
router.post('/updateaccess', userController.updateAccess);
router.post('/getprogress', userController.getCourseProgress);
router.post('/activate-free-trial', userController.activateFreeTrial);
// NEW: Routes for premium extension
router.post('/offer-premium-extension', userController.offerPremiumExtension);
router.post('/claim-premium-extension', userController.claimPremiumExtension);

// Enroll in a course via /enroll/:courseId
router.post('/enroll/:courseId', authMiddleware, async (req, res) => {
    const { courseId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isAlreadyEnrolled = user.enrolledCourses.some(c => c.courseId.toString() === courseId);
        if (isAlreadyEnrolled) return res.status(400).json({ message: 'User is already enrolled in this course' });

        user.enrolledCourses.push({
            courseId,
            enrolledAt: new Date(),
            progress: 0,
            lastAccessed: new Date(),
            completedLessons: [],
            totalWatchTime: 0
        });

        await user.save();
        res.status(200).json({ message: 'Course enrolled successfully', enrolledCourses: user.enrolledCourses });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// ===== Login history =====
router.post('/update-login-history', authMiddleware, userController.updateLoginHistory);

// ===== Learning time & website usage =====
router.post('/update-learning-time', authMiddleware, userController.updateLearningTime);
router.post('/update-website-usage', authMiddleware, userController.updateWebsiteUsage);
router.get('/usage-stats', authMiddleware, userController.getUsageStats);

router.post('/claim-time-limited-discount', userController.claimTimeLimitedDiscount);

module.exports = router;