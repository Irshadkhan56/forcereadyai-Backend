import mongoose from 'mongoose';
import Department from '../models/Department.js';

/**
 * @desc    Get all active departments
 * @route   GET /departments
 * @access  Public
 */
export const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get department by ID or Slug
 * @route   GET /departments/:idOrSlug
 * @access  Public
 */
export const getDepartmentByIdOrSlug = async (req, res, next) => {
  const { idOrSlug } = req.params;

  try {
    let department;

    // Check if valid ObjectId, search by ID. Otherwise, search by slug.
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      department = await Department.findById(idOrSlug);
    } else {
      department = await Department.findOne({ slug: idOrSlug });
    }

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    res.status(200).json({
      success: true,
      data: department,
    });
  } catch (error) {
    next(error);
  }
};
