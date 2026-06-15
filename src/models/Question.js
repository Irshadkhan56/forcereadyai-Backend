import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization is required'],
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    position: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Position',
      index: true,
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
    // Source tracking
    source: {
      type: String,
      enum: ['manual', 'ai_extracted', 'ai_generated'],
      default: 'manual',
    },
    sourceFile: {
      type: String, // original filename if AI-extracted
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
