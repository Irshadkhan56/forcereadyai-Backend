import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization reference is required'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: same category name can exist across different orgs,
// but cannot be duplicated within the same org.
categorySchema.index({ name: 1, organization: 1 }, { unique: true });

const Category = mongoose.model('Category', categorySchema);

export default Category;
