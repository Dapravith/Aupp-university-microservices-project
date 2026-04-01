const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true
    },
    studentUserId: {
      type: String,
      required: true
    },
    assignmentId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['submitted', 'reviewed'],
      default: 'submitted'
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    feedback: {
      type: String,
      default: null
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Submission', submissionSchema);
