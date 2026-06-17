import mongoose from 'mongoose';

const criteriaTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Criteria name is required'],
  },
  requirement: {
    type: String,
    required: [true, 'Criteria requirement description is required'],
  },
  description: {
    type: String,
    default: '',
  },
});

const medicalChecklistSchema = new mongoose.Schema(
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
    criteria: [criteriaTemplateSchema],
  },
  {
    timestamps: true,
  }
);

// Compound unique index so each target within a department has only one checklist
medicalChecklistSchema.index({ departmentId: 1, subCategory: 1, position: 1 }, { unique: true });

const MedicalChecklist = mongoose.model('MedicalChecklist', medicalChecklistSchema);

export default MedicalChecklist;
