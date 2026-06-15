import mongoose from 'mongoose';

const userCriteriaProgressSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  requirement: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['passed', 'failed', 'unchecked'],
    default: 'unchecked',
  },
  notes: {
    type: String,
    default: '',
  },
});

const userMedicalProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true, // One medical progress tracker per user
    },
    position: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Position',
      required: [true, 'Position reference is required'],
    },
    criteria: [userCriteriaProgressSchema],
  },
  {
    timestamps: true,
  }
);

const UserMedicalProgress = mongoose.model('UserMedicalProgress', userMedicalProgressSchema);

export default UserMedicalProgress;
