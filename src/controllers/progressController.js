import mongoose from 'mongoose';
import PhysicalPlan from '../models/PhysicalPlan.js';
import MedicalChecklist from '../models/MedicalChecklist.js';
import UserPhysicalProgress from '../models/UserPhysicalProgress.js';
import UserMedicalProgress from '../models/UserMedicalProgress.js';
import { calculateUserReadiness } from '../services/progressService.js';
import Position from '../models/Position.js';
import { generateFullPreparationProfile } from '../services/geminiService.js';

const seedAIProfileForPosition = async (positionId) => {
  try {
    const position = await Position.findById(positionId)
      .populate('organization')
      .populate('category');

    if (!position) return;

    const orgName = position.organization ? position.organization.name : 'Force';
    const catName = position.category ? position.category.name : 'Cadet';
    const posName = position.name;

    // Call Gemini AI to generate training profile
    const profile = await generateFullPreparationProfile(orgName, catName, posName);

    // Create PhysicalPlan if not exists
    const existingPhysical = await PhysicalPlan.findOne({ position: positionId });
    if (!existingPhysical) {
      await PhysicalPlan.create({
        position: positionId,
        exercises: profile.physicalPlan.exercises.map((ex) => ({
          name: ex.name,
          target: ex.target,
        })),
      });
    }

    // Create MedicalChecklist if not exists
    const existingMedical = await MedicalChecklist.findOne({ position: positionId });
    if (!existingMedical) {
      await MedicalChecklist.create({
        position: positionId,
        criteria: profile.medicalChecklist.criteria.map((cr) => ({
          name: cr.name,
          requirement: cr.requirement,
        })),
      });
    }
  } catch (error) {
    console.error(`Error in seedAIProfileForPosition for ID ${positionId}:`, error);
  }
};


/**
 * @desc    Get user physical plan progress (self-initializes if not existing)
 * @route   GET /progress/physical
 * @access  Private
 */
export const getPhysicalPlan = async (req, res, next) => {
  const { positionId } = req.query;

  try {
    if (!positionId) {
      return res.status(400).json({
        success: false,
        message: 'positionId query parameter is required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(positionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid position ID format',
      });
    }

    // 1. Check if user already has any progress tracker
    let progress = await UserPhysicalProgress.findOne({
      user: req.user._id,
    });

    // 2. If it doesn't exist, or if it is for a different position, initialize/reset
    if (!progress || progress.position.toString() !== positionId.toString()) {
      let template = await PhysicalPlan.findOne({ position: positionId });
      if (!template) {
        // AI Fallback Rule: seed missing template dynamically
        await seedAIProfileForPosition(positionId);
        template = await PhysicalPlan.findOne({ position: positionId });
      }
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'No physical preparation plan template found for this position',
        });
      }

      const exerciseData = template.exercises.map((ex) => ({
        name: ex.name,
        target: ex.target,
        currentValue: '',
        completed: false,
      }));

      if (progress) {
        // Overwrite existing progress tracker with the new position requirements
        progress.position = positionId;
        progress.exercises = exerciseData;
        await progress.save();
      } else {
        // Create new tracker
        progress = await UserPhysicalProgress.create({
          user: req.user._id,
          position: positionId,
          exercises: exerciseData,
        });
      }
    }

    // Populate position info
    progress = await UserPhysicalProgress.findById(progress._id).populate('position', 'name');

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user medical checklist progress (self-initializes if not existing)
 * @route   GET /progress/medical
 * @access  Private
 */
export const getMedicalChecklist = async (req, res, next) => {
  const { positionId } = req.query;

  try {
    if (!positionId) {
      return res.status(400).json({
        success: false,
        message: 'positionId query parameter is required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(positionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid position ID format',
      });
    }

    // 1. Check if user already has any progress tracker
    let progress = await UserMedicalProgress.findOne({
      user: req.user._id,
    });

    // 2. If it doesn't exist, or if it is for a different position, initialize/reset
    if (!progress || progress.position.toString() !== positionId.toString()) {
      let template = await MedicalChecklist.findOne({ position: positionId });
      if (!template) {
        // AI Fallback Rule: seed missing template dynamically
        await seedAIProfileForPosition(positionId);
        template = await MedicalChecklist.findOne({ position: positionId });
      }
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'No medical checklist template found for this position',
        });
      }

      const criteriaData = template.criteria.map((cr) => ({
        name: cr.name,
        requirement: cr.requirement,
        status: 'unchecked',
        notes: '',
      }));

      if (progress) {
        // Overwrite existing progress tracker with the new position requirements
        progress.position = positionId;
        progress.criteria = criteriaData;
        await progress.save();
      } else {
        // Create new tracker
        progress = await UserMedicalProgress.create({
          user: req.user._id,
          position: positionId,
          criteria: criteriaData,
        });
      }
    }

    // Populate position info
    progress = await UserMedicalProgress.findById(progress._id).populate('position', 'name');

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a specific exercise progress in the user's physical plan
 * @route   PUT /progress/physical
 * @access  Private
 */
export const updatePhysicalProgress = async (req, res, next) => {
  const { positionId, exerciseId, currentValue, completed } = req.body;

  try {
    if (!positionId || !exerciseId) {
      return res.status(400).json({
        success: false,
        message: 'positionId and exerciseId are required in body',
      });
    }

    const progress = await UserPhysicalProgress.findOne({
      user: req.user._id,
      position: positionId,
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Physical progress tracker not found. Please load the plan first.',
      });
    }

    // Find the subdocument exercise
    const exercise = progress.exercises.id(exerciseId);
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found in the progress plan',
      });
    }

    // Update fields
    exercise.currentValue = currentValue !== undefined ? currentValue : exercise.currentValue;
    exercise.completed = completed !== undefined ? completed : exercise.completed;

    await progress.save();

    res.status(200).json({
      success: true,
      message: 'Physical exercise progress updated successfully',
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a specific medical criteria status in the user's checklist
 * @route   PUT /progress/medical
 * @access  Private
 */
export const updateMedicalProgress = async (req, res, next) => {
  const { positionId, criteriaId, status, notes } = req.body;

  try {
    if (!positionId || !criteriaId) {
      return res.status(400).json({
        success: false,
        message: 'positionId and criteriaId are required in body',
      });
    }

    if (status && !['passed', 'failed', 'unchecked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either passed, failed, or unchecked',
      });
    }

    const progress = await UserMedicalProgress.findOne({
      user: req.user._id,
      position: positionId,
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Medical progress tracker not found. Please load the checklist first.',
      });
    }

    const criteriaItem = progress.criteria.id(criteriaId);
    if (!criteriaItem) {
      return res.status(404).json({
        success: false,
        message: 'Medical criteria not found in checklist',
      });
    }

    // Update fields
    criteriaItem.status = status !== undefined ? status : criteriaItem.status;
    criteriaItem.notes = notes !== undefined ? notes : criteriaItem.notes;

    await progress.save();

    res.status(200).json({
      success: true,
      message: 'Medical criteria status updated successfully',
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user overall readiness metrics (Interview, Physical, Medical, and Overall)
 * @route   GET /progress/readiness
 * @access  Private
 */
export const getUserReadiness = async (req, res, next) => {
  try {
    const readinessData = await calculateUserReadiness(req.user._id);
    res.status(200).json({
      success: true,
      data: readinessData,
    });
  } catch (error) {
    next(error);
  }
};

