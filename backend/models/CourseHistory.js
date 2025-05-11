const mongoose = require('mongoose');

const courseHistorySchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  viewedAt: {
    type: Date,
    default: Date.now
  },
  assignments: [
    {
      assignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true
      },
      attemptedAt: {
        type: Date,
        default: Date.now
      },
      answers: [
        {
          questionId: String,
          selectedOption: String
        }
      ],
      score: Number
    }
  ],
  materialsDownloaded: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material'
    }
  ]
});

module.exports = mongoose.model('CourseHistory', courseHistorySchema); 