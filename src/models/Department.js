import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Department description is required'],
      trim: true,
    },
    logo: {
      type: String,
      required: [true, 'Department logo path or URL is required'],
      trim: true,
    },
    banner: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    hasSubCategories: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate URL-friendly slug
departmentSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // remove non-word chars
      .replace(/[\s_]+/g, '-')  // replace spaces/underscores with hyphens
      .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
  }
  next();
});

const Department = mongoose.model('Department', departmentSchema);

export default Department;
