import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department ID is required'],
      index: true,
    },
    subCategory: {
      type: String,
      trim: true,
      default: '',
    },
    position: {
      type: String,
      trim: true,
      default: '',
    },
    question: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    idealAnswer: {
      type: String,
      trim: true,
      default: '',
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    tags: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    source: {
      type: String,
      enum: ['manual', 'ai_extracted', 'ai_generated'],
      default: 'manual',
    },
    sourceFile: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Full-text search index
questionSchema.index({ question: 'text', idealAnswer: 'text', tags: 'text' });

const Question = mongoose.model('Question', questionSchema);

export default Question;
