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
    position: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Position',
      required: [true, 'Position reference is required'],
      unique: true,
    },
    criteria: [criteriaTemplateSchema],
  },
  {
    timestamps: true,
  }
);

const MedicalChecklist = mongoose.model('MedicalChecklist', medicalChecklistSchema);

export default MedicalChecklist;
