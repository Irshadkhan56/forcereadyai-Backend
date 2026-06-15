import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Organization description is required'],
      trim: true,
    },
    logo: {
      type: String,
      required: [true, 'Organization logo path or URL is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Organization = mongoose.model('Organization', organizationSchema);

export default Organization;
