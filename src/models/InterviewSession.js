import mongoose from 'mongoose';

const questionDetailSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: [true, 'Question ID is required'],
  },
  question: {
    type: String,
    required: [true, 'Question text is required'],
  },
  category: {
    type: String,
    default: '',
  },
  difficulty: {
    type: String,
    default: 'medium',
  },
  candidateAnswer: {
    type: String,
    default: '',
    alias: 'userAnswer', // Alias to userAnswer for client compatibility
  },
  idealAnswer: {
    type: String,
    default: '',
  },
  matchPercentage: {
    type: Number,
    default: null, // null means not yet evaluated
  },
  score: {
    type: Number,
    default: null, // out of 10
  },
  feedback: {
    type: String,
    default: null,
  },
  // Keep legacy feedback fields for front-end compatibility
  strengths: {
    type: String,
    default: null,
  },
  weaknesses: {
    type: String,
    default: null,
  },
  suggestions: {
    type: String,
    default: null,
  },
});

const interviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    // Dual field for absolute backward compatibility during database population and queries
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization reference is required'],
      index: true,
    },
    position: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Position',
      required: [true, 'Position reference is required'],
      index: true,
    },
    questions: [questionDetailSchema],
    isVoice: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['started', 'completed'],
      default: 'started',
      index: true,
    },
    totalScore: {
      type: Number,
      default: 0, // Average score out of 100
    },
    overallPercentage: {
      type: Number,
      default: 0, // Average match percentage out of 100
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compounded index
interviewSessionSchema.index({ userId: 1, status: 1 });
interviewSessionSchema.index({ user: 1, status: 1 });

const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema);

export default InterviewSession;
