const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  detailedDescription: {
    type: String,
    required: true
  },
  instructor: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    required: true,
    enum: ['programming', 'design', 'business', 'marketing', 'data-science', 'other']
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  thumbnail: {
    type: String,
    default: ''
  },
  videoUrl: {
    type: String,
    default: ''
  },
  modules: [{
    title: {
      type: String,
      required: true
    },
    lessons: [{
      title: {
        type: String,
        required: true
      },
      duration: {
        type: String,
        required: true
      },
      videoUrl: {
        type: String,
        default: ''
      },
      isPreview: {
        type: Boolean,
        default: false
      },
      content: {
        type: String,
        default: ''
      }
    }]
  }],
  rating: {
    type: Number,
    default: 4.5,
    min: 0,
    max: 5
  },
  students: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String
  }],
  requirements: [{
    type: String
  }],
  learningOutcomes: [{
    type: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);