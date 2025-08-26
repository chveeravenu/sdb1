const express = require('express');
const User = require('../models/User');
const feedback = require('../models/feedbackModel');
const Ticket = require('../models/ticketModel');
const Cancellation = require('../models/cancellation'); // Assuming the cancellation model file is named cancellationModel.js
const { getAllCourses } = require('./courseController');

const sampleCourses = [
  {
    _id: '1',
    title: 'Complete Web Development Bootcamp',
    description: 'Learn HTML, CSS, JavaScript, React, Node.js, and MongoDB from scratch',
    instructor: 'John Smith',
    duration: '40 hours',
    price: 89,
    isPremium: true,
    category: 'programming',
    level: 'beginner',
    rating: 4.8,
    students: 15420
  },
  {
    _id: '2',
    title: 'Python for Beginners',
    description: 'Master Python programming from basics to advanced concepts',
    instructor: 'Sarah Johnson',
    duration: '30 hours',
    price: 0,
    isPremium: false,
    category: 'programming',
    level: 'beginner',
    rating: 4.6,
    students: 8750
  },
  {
    _id: '3',
    title: 'Data Science with Python',
    description: 'Learn data analysis, visualization, and machine learning with Python',
    instructor: 'Dr. Michael Chen',
    duration: '45 hours',
    price: 129,
    isPremium: true,
    category: 'data-science',
    level: 'intermediate',
    rating: 4.9,
    students: 5240
  },
  {
    _id: '4',
    title: 'UI/UX Design Principles',
    description: 'Create beautiful and user-friendly interfaces',
    instructor: 'Emily Rodriguez',
    duration: '25 hours',
    price: 0,
    isPremium: false,
    category: 'design',
    level: 'beginner',
    rating: 4.7,
    students: 12340
  }
];


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


const getUserData = async (req, res) => {
  try {
    const requestData = req.body;

    // Check if request data is null/empty - return all users data
    if (!requestData || Object.keys(requestData).length === 0 || requestData === null) {
      // Get all users from database
      const allUsers = await User.find({}).lean();

      if (!allUsers || allUsers.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No users found in database'
        });
      }

      // Process each user's data
      const processedUsers = allUsers.map(user => {
        // Get enrolled course details
        const enrolledCoursesDetails = (user.enrolledCourses || []).map(enrollment => {
          const courseInfo = sampleCourses.find(course => course._id === enrollment.courseId);
          return {
            courseId: enrollment.courseId,
            courseName: courseInfo ? courseInfo.title : 'Course Not Found',
            progress: enrollment.progress || 0,
            enrolledAt: enrollment.enrolledAt,
            instructor: courseInfo ? courseInfo.instructor : 'Unknown',
            category: courseInfo ? courseInfo.category : 'Unknown'
          };
        });

        // Get completed course details
        const completedCoursesDetails = (user.completedCourses || []).map(completion => {
          const courseInfo = sampleCourses.find(course => course._id === completion.courseId);
          return {
            courseId: completion.courseId,
            courseName: courseInfo ? courseInfo.title : 'Course Not Found',
            completedAt: completion.completedAt,
            finalScore: completion.finalScore || 0,
            certificateIssued: completion.certificateIssued || false,
            instructor: courseInfo ? courseInfo.instructor : 'Unknown'
          };
        });

        return {
          userId: user._id,
          name: user.name,
          email: user.email,
          subscriptionPlan: user.subscriptionPlan || 'basic',
          totalEnrolledCourses: user.enrolledCourses ? user.enrolledCourses.length : 0,
          enrolledCourses: enrolledCoursesDetails,
          totalCompletedCourses: user.completedCourses ? user.completedCourses.length : 0,
          completedCourses: completedCoursesDetails,
          learningStats: {
            totalLearningTime: user.totalLearningTime || 0,
            currentStreak: user.learningStreak?.current || 0,
            longestStreak: user.learningStreak?.longest || 0,
            completionRate: (user.completedCourses?.length > 0 && user.enrolledCourses?.length > 0) 
              ? Math.round((user.completedCourses.length / user.enrolledCourses.length) * 100) 
              : 0
          }
        };
      });

      return res.status(200).json({
        success: true,
        message: 'All users data retrieved successfully',
        totalUsers: processedUsers.length,
        users: processedUsers
      });
    }

    // If request data is not null, handle specific user queries here
    // You can add specific user filtering logic based on the request data
    const { userId, email } = requestData;

    let query = {};
    if (userId) query._id = userId;
    if (email) query.email = email;

    const user = await User.findOne(query).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

      // Process single user data (same logic as above)
      const enrolledCoursesDetails = (user.enrolledCourses || []).map(enrollment => {
        const courseInfo = sampleCourses.find(course => course._id === enrollment.courseId);
        return {
          courseId: enrollment.courseId,
          courseName: courseInfo ? courseInfo.title : 'Course Not Found',
          progress: enrollment.progress || 0,
          enrolledAt: enrollment.enrolledAt,
          instructor: courseInfo ? courseInfo.instructor : 'Unknown',
          category: courseInfo ? courseInfo.category : 'Unknown'
        };
      });

      const completedCoursesDetails = (user.completedCourses || []).map(completion => {
        const courseInfo = sampleCourses.find(course => course._id === completion.courseId);
        return {
          courseId: completion.courseId,
          courseName: courseInfo ? courseInfo.title : 'Course Not Found',
          completedAt: completion.completedAt,
          finalScore: completion.finalScore || 0,
          certificateIssued: completion.certificateIssued || false,
          instructor: courseInfo ? courseInfo.instructor : 'Unknown'
        };
      });

    const userData = {
      userId: user._id,
      name: user.name || 'Unknown',
      email: user.email || 'No email',
      subscriptionPlan: user.subscriptionPlan || 'basic',
      totalEnrolledCourses: user.enrolledCourses ? user.enrolledCourses.length : 0,
      enrolledCourses: enrolledCoursesDetails,
      totalCompletedCourses: user.completedCourses ? user.completedCourses.length : 0,
      completedCourses: completedCoursesDetails,
      learningStats: {
        totalLearningTime: user.totalLearningTime || 0,
        currentStreak: user.learningStreak?.current || 0,
        longestStreak: user.learningStreak?.longest || 0,
        completionRate: (user.completedCourses?.length > 0 && user.enrolledCourses?.length > 0) 
          ? Math.round((user.completedCourses.length / user.enrolledCourses.length) * 100) 
          : 0
      }
    };

    return res.status(200).json({
      success: true,
      message: 'User data retrieved successfully',
      user: userData
    });

  } catch (error) {
    console.error('Get user data error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching user data',
      error: error.message
    });
  }
};



module.exports = {
    serv,
    servSimple,
    getUserData
};