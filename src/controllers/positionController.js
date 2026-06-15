import mongoose from 'mongoose';
import Position from '../models/Position.js';
import Category from '../models/Category.js';
import Organization from '../models/Organization.js';
import PhysicalPlan from '../models/PhysicalPlan.js';
import MedicalChecklist from '../models/MedicalChecklist.js';
import { generateFullPreparationProfile } from '../services/geminiService.js';

/**
 * @desc    Get all positions (admin/debug)
 * @route   GET /positions
 * @access  Public
 */
export const getPositions = async (req, res, next) => {
  try {
    const positions = await Position.find({})
      .populate('category', 'name description')
      .populate('organization', 'name logo')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: positions.length,
      data: positions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get positions filtered by category (and optionally org)
 * @route   GET /positions/category/:categoryId
 * @access  Public
 *
 * Since categories are now org-specific, filtering by categoryId is
 * sufficient to return only that org's positions. An optional ?orgId
 * query param adds a second safety filter.
 */
export const getPositionsByCategory = async (req, res, next) => {
  const { categoryId } = req.params;
  const { orgId } = req.query; // optional extra safety filter

  try {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format',
      });
    }

    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Build query — always filter by category, optionally also by org
    const query = { category: categoryId };
    if (orgId && mongoose.Types.ObjectId.isValid(orgId)) {
      query.organization = orgId;
    }

    const positions = await Position.find(query)
      .populate('category', 'name description')
      .populate('organization', 'name logo')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: positions.length,
      data: positions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a custom position dynamically using AI profile generation
 * @route   POST /positions/custom
 * @access  Private
 */
export const createCustomPosition = async (req, res, next) => {
  const { organizationId, categoryId, positionName } = req.body;

  try {
    if (!organizationId || !categoryId || !positionName) {
      return res.status(400).json({
        success: false,
        message: 'organizationId, categoryId, and positionName are required',
      });
    }

    // 1. Validate organization
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // 2. Validate category — must belong to the given organization
    const category = await Category.findOne({
      _id: categoryId,
      organization: organizationId,
    });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or does not belong to the selected organization',
      });
    }

    const trimmedName = positionName.trim();

    // 3. Check if position already exists under this org + category
    let position = await Position.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
      organization: organizationId,
      category: categoryId,
    });

    if (position) {
      return res.status(200).json({
        success: true,
        message: 'Position already exists',
        data: position,
      });
    }

    // 4. Generate full training profile via Gemini AI (or mock fallback)
    const profile = await generateFullPreparationProfile(
      organization.name,
      category.name,
      trimmedName
    );

    // 5. Create new Position document
    position = await Position.create({
      name: trimmedName,
      category: categoryId,
      organization: organizationId,
      description: `AI-generated tactical training preparation profile for ${trimmedName} at ${organization.name}.`,
    });

    // 6. Create corresponding PhysicalPlan template
    await PhysicalPlan.create({
      position: position._id,
      exercises: profile.physicalPlan.exercises.map((ex) => ({
        name: ex.name,
        target: ex.target,
      })),
    });

    // 7. Create corresponding MedicalChecklist template
    await MedicalChecklist.create({
      position: position._id,
      criteria: profile.medicalChecklist.criteria.map((cr) => ({
        name: cr.name,
        requirement: cr.requirement,
      })),
    });

    res.status(201).json({
      success: true,
      message: 'Custom position and AI preparation profile generated successfully',
      data: position,
    });
  } catch (error) {
    next(error);
  }
};
