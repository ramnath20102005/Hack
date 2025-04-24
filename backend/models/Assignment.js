const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  options: [{
    text: {
      type: String,
      required: [true, 'Option text is required'],
      trim: true
    },
    isCorrect: {
      type: Boolean,
      default: false
    }
  }],
  points: {
    type: Number,
    default: 1,
    min: [1, 'Points must be at least 1']
  }
});

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Instructor is required']
  },
  questions: {
    type: [questionSchema],
    required: [true, 'At least one question is required'],
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: 'At least one question is required'
    }
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
    validate: {
      validator: function(v) {
        return v > Date.now();
      },
      message: 'Due date must be in the future'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate total points before saving
assignmentSchema.pre('save', function(next) {
  try {
    this.totalPoints = this.questions.reduce((total, question) => total + question.points, 0);
    next();
  } catch (err) {
    next(err);
  }
});

// Add index for better query performance
assignmentSchema.index({ course: 1, instructor: 1 });
assignmentSchema.index({ dueDate: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment; 