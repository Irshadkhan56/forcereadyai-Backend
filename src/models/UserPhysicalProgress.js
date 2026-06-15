import mongoose from 'mongoose';

const userExerciseProgressSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  target: {
    type: String,
    required: true,
  },
  currentValue: {
    type: String,
    default: '',
  },
  completed: {
    type: Boolean,
    default: false,
  },
});

const userPhysicalProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true, // One physical progress tracker per user
    },
    position: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Position',
      required: [true, 'Position reference is required'],
    },
    exercises: [userExerciseProgressSchema],
  },
  {
    timestamps: true,
  }
);

const UserPhysicalProgress = mongoose.model('UserPhysicalProgress', userPhysicalProgressSchema);

export default UserPhysicalProgress;
