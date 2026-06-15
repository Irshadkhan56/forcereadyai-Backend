import mongoose from 'mongoose';

const positionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Position name is required'],
      trim: true,
      // No global unique — same name can exist across different orgs/categories
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference is required'],
      index: true,
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

// A position name must be unique within a specific org + category combination
positionSchema.index({ name: 1, organization: 1, category: 1 }, { unique: true });

const Position = mongoose.model('Position', positionSchema);

export default Position;
