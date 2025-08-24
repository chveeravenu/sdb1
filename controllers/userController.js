// controllers/userController.js
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
      console.log(email,courseId)
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

      const enrolledCourse = user.enrolledCourses.find(c => c.courseId.toString() === courseId);
      if (enrolledCourse) {
        return res.status(200).json({
          success: true,
          message: 'User is enrolled in this course',
          isEnrolled: true,
          progress: enrolledCourse.progress || 0,
          enrolledAt: enrolledCourse.enrolledAt,
          lastAccessed: enrolledCourse.lastAccessed,
          completedLessons: enrolledCourse.completedLessons || [],
          totalWatchTime: enrolledCourse.totalWatchTime || 0
        });
      } else {
        return res.status(200).json({ success: true, message: 'User is not enrolled in this course', isEnrolled: false, progress: 0 });
      }
    } catch (error) {
      console.error('Error checking course enrollment:', error);
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message, isEnrolled: false, progress: 0 });
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
        user.totalLearningTime = (user.totalLearningTime || 0) + watchTime; // keep global learning minutes updated
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

  // ===== NEW: Learning time (per minute possible) =====
  updateLearningTime: async (req, res) => {
    try {
      const user = await userController._getUserFromToken(req);
      const { minutesSpent } = req.body; // integer minutes (send 1 each minute)
      const minutes = Number(minutesSpent);

      if (!minutes || minutes <= 0) {
        return res.status(400).json({ message: 'minutesSpent must be a positive number' });
      }

      // Update total learning minutes
      user.totalLearningTime = (user.totalLearningTime || 0) + minutes;

      // Update daily bucket "YYYY-MM-DD"
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

  // ===== NEW: Overall website usage =====
  updateWebsiteUsage: async (req, res) => {
    try {
      const user = await userController._getUserFromToken(req);
      const { minutesSpent } = req.body; // integer minutes
      const minutes = Number(minutesSpent);

      if (!minutes || minutes <= 0) {
        return res.status(400).json({ message: 'minutesSpent must be a positive number' });
      }

      // Update global total
      user.totalWebsiteUsage = (user.totalWebsiteUsage || 0) + minutes;

      // Update today's bucket
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

  // ===== NEW: Combined usage stats =====
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