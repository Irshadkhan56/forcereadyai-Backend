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
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required'],
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
    exercises: [exerciseTemplateSchema],
  },
  {
    timestamps: true,
  }
);

// Compound unique index so each target within a department has only one physical plan
physicalPlanSchema.index({ departmentId: 1, subCategory: 1, position: 1 }, { unique: true });

const PhysicalPlan = mongoose.model('PhysicalPlan', physicalPlanSchema);

export default PhysicalPlan;
