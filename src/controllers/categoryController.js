import mongoose from 'mongoose';
import Category from '../models/Category.js';

/**
 * @desc    Get all categories for a specific organization
 * @route   GET /categories/:organizationId
 * @access  Public
 */
export const getCategoriesByOrganization = async (req, res, next) => {
  const { organizationId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid organization ID format',
      });
    }

    const categories = await Category.find({ organization: organizationId })
      .populate('organization', 'name')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all categories (admin/debug use only)
 * @route   GET /categories
 * @access  Public
 */
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({})
      .populate('organization', 'name')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};
