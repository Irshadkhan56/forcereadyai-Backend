import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
      index: true, // Performance optimization: index on user lookup
    },
    interviewReadiness: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    physicalReadiness: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    medicalReadiness: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    overallReadiness: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Progress = mongoose.model('Progress', progressSchema);

export default Progress;
