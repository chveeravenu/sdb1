// models/User.js

const mongoose = require('mongoose');

const DailyLearningSchema = new mongoose.Schema({
  date: { type: String, required: true },
  minutes: { type: Number, default: 0 }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true, minlength: 6 },

  enrolledCourses: [{
    courseId: { type: String, required: true },
    enrolledAt: { type: Date, default: Date.now },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    lastAccessed: { type: Date, default: Date.now },
    completedLessons: [{ type: String, default: [] }],
    totalWatchTime: { type: Number, default: 0 }
  }],
  completedCourses: [{
    courseId: { type: String, required: true },
    completedAt: { type: Date, default: Date.now },
    finalScore: { type: Number, min: 0, max: 100 },
    certificateIssued: { type: Boolean, default: false }
  }],

  subscriptionPlan: { type: String, enum: ['basic', 'premium', 'pro'], default: 'basic' },
  subscriptionExpiry: { type: Date },

  totalLearningTime: { type: Number, default: 0 },
  dailyLearningTime: [DailyLearningSchema],

  totalWebsiteUsage: { type: Number, default: 0 },
  websiteUsageTime: [{
    date: { type: Date, required: true },
    duration: { type: Number, default: 0 }
  }],

  loginHistory: [{
    date: { type: Date, required: true },
    count: { type: Number, default: 0 }
  }],

  learningStreak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: Date.now }
  },
  achievements: [{
    type: { type: String, enum: ['first_course', 'course_completed', 'week_streak', 'month_streak', 'fast_learner', 'consistent_learner'] },
    earnedAt: { type: Date, default: Date.now },
    courseId: String
  }],

  freeTrialStatus: {
    type: String,
    enum: ['none', 'offered', 'active'],
    default: 'none'
  },
  freeTrialExpiry: {
    type: Date,
    default: null
  },
  premiumExtensionStatus: {
    type: String,
    enum: ['none', 'offered', 'claimed'],
    default: 'none'
  },
  premiumExtensionClaimedAt: {
    type: Date,
    default: null
  },
  // NEW: Fields for time-limited discount
  discountOfferStatus: {
    type: String,
    enum: ['none', 'offered', 'claimed'],
    default: 'none'
  },
  discountOfferExpiry: {
    type: Date,
    default: null
  }
}, { timestamps: true });

userSchema.index({ 'enrolledCourses.courseId': 1 });
userSchema.index({ 'completedCourses.courseId': 1 });

userSchema.virtual('completionRate').get(function () {
  if (this.enrolledCourses.length === 0) return 0;
  return Math.round((this.completedCourses.length / this.enrolledCourses.length) * 100);
});
userSchema.methods.getAverageProgress = function () {
  if (this.enrolledCourses.length === 0) return 0;
  const totalProgress = this.enrolledCourses.reduce((sum, c) => sum + (c.progress || 0), 0);
  return Math.round(totalProgress / this.enrolledCourses.length);
};

module.exports = mongoose.model('User', userSchema);