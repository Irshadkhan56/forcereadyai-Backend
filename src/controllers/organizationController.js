import mongoose from 'mongoose';
import Organization from '../models/Organization.js';

/**
 * @desc    Get all organizations
 * @route   GET /organizations
 * @access  Public
 */
export const getOrganizations = async (req, res, next) => {
  try {
    const organizations = await Organization.find({}).sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: organizations.length,
      data: organizations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get organization by ID
 * @route   GET /organizations/:id
 * @access  Public
 */
export const getOrganizationById = async (req, res, next) => {
  const { id } = req.params;

  try {
    // Validate Mongo ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid organization ID format',
      });
    }

    const organization = await Organization.findById(id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    res.status(200).json({
      success: true,
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};
