const Course = require('../models/Course');
const User = require('../models/User');

const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key-here';

const sampleCourses = [
  {
    _id: '1',
    title: 'Complete Web Development Bootcamp',
    description: 'Learn HTML, CSS, JavaScript, React, Node.js, and MongoDB from scratch',
    detailedDescription: 'This comprehensive web development course covers everything you need to become a full-stack developer. Starting with the basics of HTML and CSS, you\'ll progress through JavaScript, React, Node.js, and MongoDB. Build real-world projects and deploy them to the cloud.',
    instructor: 'John Smith',
    duration: '40 hours',
    price: [
      {
        id: '1month',
        duration: '1 Month',
        price: 300,
        originalPrice: 400,
        savings: 25,
        popular: false,
        description: 'Try it out',
        monthlyRate: '₹300/month'
      },
      {
        id: '6months',
        duration: '6 Months',
        price: 1500,
        originalPrice: 1800,
        savings: 17,
        popular: true,
        description: 'Most popular',
        monthlyRate: '₹250/month'
      },
      {
        id: '1year',
        duration: '1 Year',
        price: 3000,
        originalPrice: 3600,
        savings: 17,
        popular: false,
        description: 'Best value',
        monthlyRate: '₹250/month'
      }
    ],
    isPremium: true,
    category: 'programming',
    level: 'beginner',
    rating: 4.8,
    students: 15420,
    thumbnailUrl: 'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    previewVideo: 'https://www.youtube.com/embed/UB1O30fR-EE',
    modules: [
      {
        title: 'HTML & CSS Fundamentals',
        lessons: [
          {
            title: 'Introduction to HTML',
            duration: '15 min',
            isPreview: true,
            videoUrl: 'https://www.youtube.com/embed/UB1O30fR-EE'
          },
          {
            title: 'CSS Styling Basics',
            duration: '20 min',
            isPreview: false,
            videoUrl: 'https://www.youtube.com/embed/yfoY53QXEnI'
          },
          {
            title: 'Responsive Design',
            duration: '25 min',
            isPreview: false,
            videoUrl: 'https://www.youtube.com/embed/srvUrASNdxs'
          }
        ]
      },
      {
        title: 'JavaScript Essentials',
        lessons: [
          {
            title: 'Variables and Functions',
            duration: '30 min',
            isPreview: true,
            videoUrl: 'https://www.youtube.com/embed/W6NZfCO5SIk'
          },
          {
            title: 'DOM Manipulation',
            duration: '35 min',
            isPreview: false,
            videoUrl: 'https://www.youtube.com/embed/0ik6X4DJKCc'
          },
          {
            title: 'Async Programming',
            duration: '40 min',
            isPreview: false,
            videoUrl: 'https://www.youtube.com/embed/PoRJizFvM7s'
          }
        ]
      }
    ]
  },
  {
    _id: '2',
    title: 'Python for Beginners',
    description: 'Master Python programming from basics to advanced concepts',
    detailedDescription: 'Start your programming journey with Python, one of the most popular and versatile programming languages. This course covers Python basics, data structures, object-oriented programming, and practical applications.',
    instructor: 'Sarah Johnson',
    duration: '30 hours',
    price: 0,
    isPremium: false,
    category: 'programming',
    level: 'beginner',
    rating: 4.6,
    students: 8750,
    thumbnailUrl: 'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    previewVideo: 'https://www.youtube.com/embed/rfscVS0vtbw',
    modules: [
      {
        title: 'Python Basics',
        lessons: [
          {
            title: 'Getting Started with Python',
            duration: '20 min',
            isPreview: true,
            videoUrl: 'https://www.youtube.com/embed/rfscVS0vtbw'
          },
          {
            title: 'Variables and Data Types',
            duration: '25 min',
            isPreview: true,
            videoUrl: 'https://www.youtube.com/embed/cKxRvEZd3Mw'
          },
          {
            title: 'Control Structures',
            duration: '30 min',
            isPreview: true,
            videoUrl: 'https://www.youtube.com/embed/DZwmZ8Usvnk'
          }
        ]
      }
    ]
  },
  {
    _id: '3',
    title: 'Data Science with Python',
    description: 'Learn data analysis, visualization, and machine learning with Python',
    detailedDescription: 'Dive into the world of data science using Python. Learn pandas for data manipulation, matplotlib for visualization, and scikit-learn for machine learning. Work with real datasets and build predictive models.',
    instructor: 'Dr. Michael Chen',
    duration: '45 hours',
    price: [
      {
        id: '1month',
        duration: '1 Month',
        price: 400,
        originalPrice: 500,
        savings: 20,
        popular: false,
        description: 'Try it out',
        monthlyRate: '₹400/month'
      },
      {
        id: '6months',
        duration: '6 Months',
        price: 2000,
        originalPrice: 3500,
        savings: 43,
        popular: true,
        description: 'Most popular',
        monthlyRate: '₹2000/month'
      },
      {
        id: '1year',
        duration: '1 Year',
        price: 6000,
        originalPrice: 7000,
        savings: 15,
        popular: false,
        description: 'Best value',
        monthlyRate: '₹6000/month'
      }
    ],
    isPremium: true,
    category: 'data-science',
    level: 'intermediate',
    rating: 4.9,
    students: 5240,
    thumbnailUrl: 'https://images.pexels.com/photos/3861972/pexels-photo-3861972.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    previewVideo: 'https://www.youtube.com/embed/ua-CiDNNj30',
    modules: [
      {
        title: 'Data Analysis Fundamentals',
        lessons: [
          {
            title: 'Introduction to Pandas',
            duration: '25 min',
            isPreview: true,
            videoUrl: 'https://www.youtube.com/embed/vmEHCJofslg'
          },
          {
            title: 'Data Cleaning',
            duration: '35 min',
            isPreview: false,
            videoUrl: 'https://www.youtube.com/embed/iYie42M1ZyU'
          },
          {
            title: 'Statistical Analysis',
            duration: '40 min',
            isPreview: false,
            videoUrl: 'https://www.youtube.com/embed/xxpc-HPKN28'
          }
        ]
      }
    ]
  },
  {
    _id: '4',
    title: 'UI/UX Design Principles',
    description: 'Create beautiful and user-friendly interfaces',
    detailedDescription: 'Master the art of user interface and user experience design. Learn design principles, color theory, typography, and how to create wireframes and prototypes using industry-standard tools.',
    instructor: 'Emily Rodriguez',
    duration: '25 hours',
    price: 0,
    isPremium: false,
    category: 'design',
    level: 'beginner',
    rating: 4.7,
    students: 12340,
    thumbnailUrl: 'https://images.pexels.com/photos/3862632/pexels-photo-3862632.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    previewVideo: 'https://www.youtube.com/embed/2TR5I1cE1Yg',
    modules: [
      {
        title: 'Design Fundamentals',
        lessons: [
          {
            title: 'Principles of Good Design',
            duration: '18 min',
            isPreview: true,
            videoUrl: 'https://www.youtube.com/embed/2TR5I1cE1Yg'
          },
          {
            title: 'Color Theory',
            duration: '22 min',
            isPreview: true,
            videoUrl: 'https://www.youtube.com/embed/Qj1FK8n7WgY'
          },
          {
            title: 'Typography Basics',
            duration: '20 min',
            isPreview: true,
            videoUrl: 'https://www.youtube.com/embed/QrNi9FmdlxY'
          }
        ]
      }
    ]
  }
];

const courseController = {

  
getAllCourses: async (req, res) => {
    try {
      const allCourses = sampleCourses; // In a real app, this would be from DB

      const token = req.headers.authorization?.split(' ')[1];
      let isDiscountActive = false;

      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          const user = await User.findById(decoded.userId);
          if (user && user.discountOfferStatus === 'offered' && user.discountOfferExpiry && user.discountOfferExpiry > new Date()) {
            isDiscountActive = true;
          }
        } catch (authError) {
          console.log('Token is invalid, cannot apply discount logic:', authError.message);
        }
      }

      const coursesWithDiscount = allCourses.map(course => {
        if (isDiscountActive && course.isPremium) {
          const discountedPrice = course.price * 0.5;
          return { ...course, discountedPrice };
        }
        return course;
      });

      res.json({
        message: 'Courses fetched successfully',
        courses: coursesWithDiscount,
        isDiscountActive
      });
    } catch (error) {
      console.error('Get courses error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // MODIFIED: Apply 50% discount to a specific course
  getCourseById: async (req, res) => {
    try {
      const { id } = req.params;
      let course = sampleCourses.find(c => c._id === id);

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      const token = req.headers.authorization?.split(' ')[1];
      let isDiscountActive = false;

      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          const user = await User.findById(decoded.userId);
          if (user && user.discountOfferStatus === 'offered' && user.discountOfferExpiry && user.discountOfferExpiry > new Date()) {
            isDiscountActive = true;
            if (course.isPremium) {
              const discountedPrice = course.price * 0.5;
              course = { ...course, discountedPrice };
            }
          }
        } catch (authError) {
          console.log('Token is invalid, cannot apply discount logic:', authError.message);
        }
      }

      res.json({
        message: 'Course fetched successfully',
        course,
        isDiscountActive
      });
    } catch (error) {
      console.error('Get course error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getCoursesByCategory: async (req, res) => {
    try {
      const { category } = req.params;
      const courses = sampleCourses.filter(c => c.category === category);

      res.json({
        message: 'Courses fetched successfully',
        courses
      });
    } catch (error) {
      console.error('Get courses by category error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  searchCourses: async (req, res) => {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({ message: 'Search query is required' });
      }

      const courses = sampleCourses.filter(course =>
        course.title.toLowerCase().includes(q.toLowerCase()) ||
        course.description.toLowerCase().includes(q.toLowerCase())
      );

      res.json({
        message: 'Search completed successfully',
        courses
      });
    } catch (error) {
      console.error('Search courses error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  enrollInCourse: async (req, res) => {
    try {
      // This function would require a user database and authentication middleware
      // to properly handle enrollment. This is a placeholder for demonstration.
      const { id } = req.params;
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }

      // Assume token is valid for this mock. In a real app, you'd decode and verify.
      res.json({
        message: 'Successfully enrolled in course (mock response)',
        enrollment: {
          courseId: id,
          enrolledAt: new Date(),
          progress: 0
        }
      });
    } catch (error) {
      console.error('Enroll in course error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = courseController;