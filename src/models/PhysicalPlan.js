import mongoose from 'mongoose';

const exerciseTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Exercise name is required'],
  },
  target: {
    type: String,
    required: [true, 'Exercise target criteria is required'],
  },
  description: {
    type: String,
    default: '',
  },
});

const physicalPlanSchema = new mongoose.Schema(
  {
    position: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Position',
      required: [true, 'Position reference is required'],
      unique: true,
    },
    exercises: [exerciseTemplateSchema],
  },
  {
    timestamps: true,
  }
);

const PhysicalPlan = mongoose.model('PhysicalPlan', physicalPlanSchema);

export default PhysicalPlan;
