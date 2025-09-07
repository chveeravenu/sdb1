const User = require('../models/User');
const Course = require('../models/Course');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key-here';

const userController = {
  // ===== Auth'd helpers (use Authorization: Bearer <token>) =====
  _getUserFromToken: async (req) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('NO_TOKEN');
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) throw new Error('NO_USER');
    return user;
  },

  // ===== Profile =====
  getUserProfile: async (req, res) => {
    try {
      const user = await userController._getUserFromToken(req);
      const safe = user.toObject();
      delete safe.password;
      res.json({ user: safe });
    } catch (error) {
      if (error.message === 'NO_TOKEN') return res.status(401).json({ message: 'No token provided' });
      if (error.message === 'NO_USER') return res.status(404).json({ message: 'User not found' });
      console.error('Get user profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  updateUserProfile: async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'No token provided' });
      const decoded = jwt.verify(token, JWT_SECRET);
      const { name, email } = req.body;

      const user = await User.findByIdAndUpdate(
        decoded.userId,
        { ...(name && { name }), ...(email && { email }) },
        { new: true }
      ).select('-password');

      res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
      console.error('Update user profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // ===== Stats =====
  getUserStats: async (req, res) => {
    try {
      const user = await userController._getUserFromToken(req);
      const stats = {
        enrolledCourses: user.enrolledCourses.length,
        completedCourses: user.completedCourses.length,
        totalLearningTime: `${Math.floor((user.totalLearningTime || 0) / 60)}h ${(user.totalLearningTime || 0) % 60}m`,
        certificates: user.completedCourses.length
      };
      res.json({ stats });
    } catch (error) {
      if (error.message === 'NO_TOKEN') return res.status(401).json({ message: 'No token provided' });
      if (error.message === 'NO_USER') return res.status(404).json({ message: 'User not found' });
      console.error('Get user stats error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getEnrolledCourses: async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'No token provided' });
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId).populate('enrolledCourses.courseId');
      if (!user) return res.status(404).json({ message: 'User not found' });

      const enrolledCourses = user.enrolledCourses
        .map((enrollment) => {
          if (!enrollment.courseId) return null;
          return {
            _id: enrollment.courseId._id,
            title: enrollment.courseId.title,
            instructor: enrollment.courseId.instructor,
            progress: enrollment.progress,
            lastAccessed: enrollment.lastAccessed
          };
        })
        .filter(Boolean);

      res.json({ courses: enrolledCourses });
    } catch (error) {
      console.error('Get enrolled courses error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // ===== Course Enrollment + Progress =====
  courseu: async (req, res) => {
    try {
      const { email, courseId } = req.body;
      if (!email || !courseId) {
        return res.status(400).json({ success: false, message: 'Email and courseId are required' });
      }
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      const isAlreadyEnrolled = user.enrolledCourses.some(c => c.courseId.toString() === courseId);
      if (isAlreadyEnrolled) {
        return res.status(400).json({ success: false, message: 'User is already enrolled in this course' });
      }

      user.enrolledCourses.push({
        courseId,
        enrolledAt: new Date(),
        progress: 0,
        lastAccessed: new Date(),
        completedLessons: [],
        totalWatchTime: 0
      });

      await user.save();
      res.status(200).json({
        success: true,
        message: 'Course enrolled successfully',
        data: { userId: user._id, email: user.email, enrolledCourses: user.enrolledCourses }
      });
    } catch (error) {
      console.error('Error updating enrolled courses:', error);
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  },

  // MODIFIED: Checks for enrollment OR an active free trial
  enrollcheck: async (req, res) => {
    try {
      const { email, courseId } = req.body;
      if (!email || !courseId) {
        return res.status(400).json({ success: false, message: 'Email and courseId are required' });
      }
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found', isEnrolled: false, progress: 0 });
      }

      // Check if the user's free trial is active and not expired
      const isFreeTrialActive = user.freeTrialStatus === 'active' && user.freeTrialExpiry && user.freeTrialExpiry > new Date();

      const enrolledCourse = user.enrolledCourses.find(c => c.courseId.toString() === courseId);
      if (enrolledCourse || isFreeTrialActive) {
        return res.status(200).json({
          success: true,
          message: 'User has access to this course',
          isEnrolled: !!enrolledCourse, // isEnrolled is only true if they paid/enrolled
          isFreeTrialActive, // New flag is always returned
          progress: enrolledCourse ? enrolledCourse.progress : 0,
          completedLessons: enrolledCourse ? enrolledCourse.completedLessons : [],
          freeTrialExpiry: user.freeTrialExpiry
        });
      } else {
        return res.status(200).json({ success: true, message: 'User does not have access to this course', isEnrolled: false, isFreeTrialActive, progress: 0 });
      }
    } catch (error) {
      console.error('Error checking course enrollment:', error);
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message, isEnrolled: false, isFreeTrialActive: false });
    }
  },

  updateProgress: async (req, res) => {
    try {
      const { email, courseId, progress, completedLessons, lastAccessed, watchTime } = req.body;
      if (!email || !courseId) {
        return res.status(400).json({ success: false, message: 'Email and courseId are required' });
      }
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      const idx = user.enrolledCourses.findIndex(c => c.courseId.toString() === courseId);
      if (idx === -1) return res.status(404).json({ success: false, message: 'User is not enrolled in this course' });

      if (progress !== undefined) user.enrolledCourses[idx].progress = Math.min(100, Math.max(0, progress));
      if (completedLessons) user.enrolledCourses[idx].completedLessons = completedLessons;
      if (lastAccessed) user.enrolledCourses[idx].lastAccessed = new Date(lastAccessed);

      if (watchTime) {
        user.enrolledCourses[idx].totalWatchTime = (user.enrolledCourses[idx].totalWatchTime || 0) + watchTime;
        user.totalLearningTime = (user.totalLearningTime || 0) + watchTime;
      }

      if (user.enrolledCourses[idx].progress >= 100) {
        const isAlreadyCompleted = user.completedCourses.some(c => c.courseId.toString() === courseId);
        if (!isAlreadyCompleted) user.completedCourses.push({ courseId, completedAt: new Date() });
      }

      await user.save();
      res.status(200).json({
        success: true,
        message: 'Progress updated successfully',
        data: {
          courseId,
          progress: user.enrolledCourses[idx].progress,
          completedLessons: user.enrolledCourses[idx].completedLessons,
          totalWatchTime: user.enrolledCourses[idx].totalWatchTime,
          isCompleted: user.enrolledCourses[idx].progress >= 100
        }
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  },

  updateAccess: async (req, res) => {
    try {
      const { email, courseId, lastAccessed } = req.body;
      if (!email || !courseId) {
        return res.status(400).json({ success: false, message: 'Email and courseId are required' });
      }
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      const idx = user.enrolledCourses.findIndex(c => c.courseId.toString() === courseId);
      if (idx === -1) return res.status(404).json({ success: false, message: 'User is not enrolled in this course' });

      user.enrolledCourses[idx].lastAccessed = new Date(lastAccessed || Date.now());
      await user.save();
      res.status(200).json({ success: true, message: 'Last accessed time updated successfully' });
    } catch (error) {
      console.error('Error updating last accessed:', error);
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  },

  getCourseProgress: async (req, res) => {
    try {
      const { email, courseId } = req.body;
      if (!email || !courseId) {
        return res.status(400).json({ success: false, message: 'Email and courseId are required' });
      }
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      const enrolledCourse = user.enrolledCourses.find(c => c.courseId.toString() === courseId);
      if (!enrolledCourse) return res.status(404).json({ success: false, message: 'User is not enrolled in this course' });

      res.status(200).json({
        success: true,
        message: 'Course progress retrieved successfully',
        data: {
          courseId,
          progress: enrolledCourse.progress || 0,
          completedLessons: enrolledCourse.completedLessons || [],
          enrolledAt: enrolledCourse.enrolledAt,
          lastAccessed: enrolledCourse.lastAccessed,
          totalWatchTime: enrolledCourse.totalWatchTime || 0,
          isCompleted: enrolledCourse.progress >= 100
        }
      });
    } catch (error) {
      console.error('Error getting course progress:', error);
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  },

  // ===== NEW: Free trial controller functions =====
  offerFreeTrial: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (user.freeTrialStatus !== 'none') {
        return res.status(400).json({ success: false, message: 'Free trial has already been offered or is active for this user.' });
      }

      user.freeTrialStatus = 'offered';
      await user.save();
      res.status(200).json({ success: true, message: 'Free trial successfully offered to the user.' });
    } catch (error) {
      console.error('Error offering free trial:', error);
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  },

  activateFreeTrial: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (user.freeTrialStatus !== 'offered') {
        return res.status(400).json({ success: false, message: 'Free trial is not available to be activated.' });
      }

      user.freeTrialStatus = 'active';
      user.freeTrialExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await user.save();

      res.status(200).json({ success: true, message: 'Free trial activated successfully!' });
    } catch (error) {
      console.error('Error activating free trial:', error);
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  },

  // NEW: Premium Extension controller functions
  offerPremiumExtension: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      // Prevent offering if already offered or claimed
      if (user.premiumExtensionStatus !== 'none') {
        return res.status(400).json({ success: false, message: 'Premium extension already offered or claimed' });
      }

      user.premiumExtensionStatus = 'offered';
      await user.save();
      res.status(200).json({ success: true, message: 'Premium extension successfully offered to the user.' });
    } catch (error) {
      console.error('Error offering premium extension:', error);
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  },

 claimPremiumExtension: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (user.premiumExtensionStatus !== 'offered') {
        return res.status(400).json({ success: false, message: 'No premium extension offer to claim' });
      }

      const oneMonthInMs = 30 * 24 * 60 * 60 * 1000;
      let newExpiryDate = user.subscriptionExpiry || new Date();
      newExpiryDate = new Date(newExpiryDate.getTime() + oneMonthInMs);

      user.premiumExtensionStatus = 'claimed';
      user.premiumExtensionClaimedAt = new Date();
      user.subscriptionExpiry = newExpiryDate;
      await user.save();
      
      res.status(200).json({ success: true, message: 'Premium extension successfully claimed.', newExpiryDate });
    } catch (error) {
      console.error('Error claiming premium extension:', error);
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  },

  // ===== Login history =====
  updateLoginHistory: async (req, res) => {
    try {
      const user = await userController._getUserFromToken(req);
      const today = new Date(); today.setHours(0, 0, 0, 0);

      const todayLogin = user.loginHistory.find(e => new Date(e.date).toDateString() === today.toDateString());
      if (todayLogin) todayLogin.count += 1;
      else user.loginHistory.push({ date: today, count: 1 });

      await user.save();
      res.status(200).json({ message: 'Login history updated' });
    } catch (error) {
      if (error.message === 'NO_TOKEN') return res.status(401).json({ message: 'No token provided' });
      if (error.message === 'NO_USER') return res.status(404).json({ message: 'User not found' });
      console.error('Update login history error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // ===== Learning time & website usage =====
  updateLearningTime: async (req, res) => {
    try {
      const user = await userController._getUserFromToken(req);
      const { minutesSpent } = req.body;
      const minutes = Number(minutesSpent);

      if (!minutes || minutes <= 0) {
        return res.status(400).json({ message: 'minutesSpent must be a positive number' });
      }

      user.totalLearningTime = (user.totalLearningTime || 0) + minutes;

      const todayKey = new Date().toISOString().split('T')[0];
      const day = user.dailyLearningTime.find(d => d.date === todayKey);
      if (day) day.minutes += minutes;
      else user.dailyLearningTime.push({ date: todayKey, minutes });

      await user.save();
      res.json({ message: 'Learning time updated', totalLearningTime: user.totalLearningTime });
    } catch (error) {
      if (error.message === 'NO_TOKEN') return res.status(401).json({ message: 'No token provided' });
      if (error.message === 'NO_USER') return res.status(404).json({ message: 'User not found' });
      res.status(500).json({ message: 'Error updating learning time', error: error.message });
    }
  },

  updateWebsiteUsage: async (req, res) => {
    try {
      const user = await userController._getUserFromToken(req);
      const { minutesSpent } = req.body;
      const minutes = Number(minutesSpent);

      if (!minutes || minutes <= 0) {
        return res.status(400).json({ message: 'minutesSpent must be a positive number' });
      }

      user.totalWebsiteUsage = (user.totalWebsiteUsage || 0) + minutes;

      const today = new Date(); today.setHours(0, 0, 0, 0);
      const bucket = user.websiteUsageTime.find(e => new Date(e.date).toDateString() === today.toDateString());
      if (bucket) bucket.duration += minutes;
      else user.websiteUsageTime.push({ date: today, duration: minutes });

      await user.save();
      res.json({ message: 'Website usage updated', totalWebsiteUsage: user.totalWebsiteUsage });
    } catch (error) {
      if (error.message === 'NO_TOKEN') return res.status(401).json({ message: 'No token provided' });
      if (error.message === 'NO_USER') return res.status(404).json({ message: 'User not found' });
      res.status(500).json({ message: 'Error updating website usage', error: error.message });
    }
  },

 offerTimeLimitedDiscount: async (req, res) => {
    try {
      console.log("aa")
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      if (user.discountOfferStatus !== 'none') {
        return res.status(400).json({ success: false, message: 'Discount offer already active or claimed for this user.' });
      }

      const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
      user.discountOfferStatus = 'offered';
      user.discountOfferExpiry = new Date(Date.now() + twentyFourHoursInMs);
      await user.save();
      
      res.status(200).json({ success: true, message: 'Time-limited discount successfully offered.' });
    } catch (error) {
      console.error('Error offering discount:', error);
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  },
  
  // NEW: Claim time-limited discount
  claimTimeLimitedDiscount: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (user.discountOfferStatus !== 'offered' || user.discountOfferExpiry <= new Date()) {
        return res.status(400).json({ success: false, message: 'Discount offer is not available or has expired.' });
      }
      
      user.discountOfferStatus = 'claimed';
      await user.save();

      res.status(200).json({ success: true, message: 'Discount successfully claimed!' });
    } catch (error) {
      console.error('Error claiming discount:', error);
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  },
  

  getUsageStats: async (req, res) => {
    try {
      const user = await userController._getUserFromToken(req);
      res.json({
        learningTime: user.totalLearningTime || 0,
        totalWebsiteUsage: user.totalWebsiteUsage || 0,
        dailyLearningTime: user.dailyLearningTime || [],
        websiteUsageTime: user.websiteUsageTime || []
      });
    } catch (error) {
      if (error.message === 'NO_TOKEN') return res.status(401).json({ message: 'No token provided' });
      if (error.message === 'NO_USER') return res.status(404).json({ message: 'User not found' });
      res.status(500).json({ message: 'Error fetching usage stats', error: error.message });
    }
  }
};

module.exports = userController;