const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  questions: [{
    text: String,
    category: {
      type: String,
      enum: ['HR', 'Tech'],
      default: 'HR'
    },
    order: Number
  }],
  transcript: [{
    questionId: Number,
    answer: String,
    startTime: Number,
    endTime: Number
  }],
  llmFeedback: {
    fluencyScore: {
      type: Number,
      min: 0,
      max: 10
    },
    clarityScore: {
      type: Number,
      min: 0,
      max: 10
    },
    depthScore: {
      type: Number,
      min: 0,
      max: 10
    },
    feedback: String,
    tips: [String]
  },
  cvAnalysis: {
    eyeContactScore: {
      type: Number,
      min: 0,
      max: 100
    },
    postureScore: {
      type: Number,
      min: 0,
      max: 100
    },
    engagementPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    bodyLanguageFlags: [String]
  },
  finalScore: {
    type: Number,
    min: 0,
    max: 100
  }
});

// Add index for efficient querying
interviewSchema.index({ userId: 1, timestamp: -1 });

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = Interview; 