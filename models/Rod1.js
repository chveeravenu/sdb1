const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  courseId: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  subscriptionPlan: {
    id: {
      type: String,
      required: true
    },
    duration: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    originalPrice: {
      type: Number
    },
    savings: {
      type: Number
    },
    popular: {
      type: Boolean,
      default: false
    },
    description: {
      type: String
    },
    monthlyRate: {
      type: String
    }
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired'],
    default: 'active'
  }
}, { timestamps: true });

// Index for better query performance
subscriptionSchema.index({ email: 1, courseId: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);