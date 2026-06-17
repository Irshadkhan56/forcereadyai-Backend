import mongoose from 'mongoose';
import PhysicalPlan from '../models/PhysicalPlan.js';
import UserPhysicalProgress from '../models/UserPhysicalProgress.js';

/**
 * @desc    Get physical plan template
 * @route   GET /physical-tests
 * @access  Public
 */
export const getPhysicalPlan = async (req, res, next) => {
  const { departmentId, subCategory = '', position = '' } = req.query;

  try {
    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: 'departmentId query parameter is required',
      });
    }

    const template = await PhysicalPlan.findOne({ departmentId, subCategory, position });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'No physical plan template found for this department/track',
      });
    }

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user physical progress (self-initializes if not existing)
 * @route   GET /physical-tests/progress
 * @access  Private
 */
export const getPhysicalProgress = async (req, res, next) => {
  const { departmentId, subCategory = '', position = '' } = req.query;

  try {
    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: 'departmentId query parameter is required',
      });
    }

    let progress = await UserPhysicalProgress.findOne({
      user: req.user._id,
    });

    const isDifferent = !progress ||
      progress.departmentId.toString() !== departmentId.toString() ||
      progress.subCategory !== subCategory ||
      progress.position !== position;

    if (isDifferent) {
      const template = await PhysicalPlan.findOne({ departmentId, subCategory, position });
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'No physical plan template found for this department/track',
        });
      }

      const exerciseData = template.exercises.map((ex) => ({
        name: ex.name,
        target: ex.target,
        currentValue: '',
        completed: false,
      }));

      if (progress) {
        progress.departmentId = departmentId;
        progress.subCategory = subCategory;
        progress.position = position;
        progress.exercises = exerciseData;
        await progress.save();
      } else {
        progress = await UserPhysicalProgress.create({
          user: req.user._id,
          departmentId,
          subCategory,
          position,
          exercises: exerciseData,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update specific exercise progress in user physical plan
 * @route   PUT /physical-tests/progress
 * @access  Private
 */
export const updatePhysicalProgress = async (req, res, next) => {
  const { departmentId, exerciseId, currentValue, completed } = req.body;

  try {
    if (!departmentId || !exerciseId) {
      return res.status(400).json({
        success: false,
        message: 'departmentId and exerciseId are required in body',
      });
    }

    const progress = await UserPhysicalProgress.findOne({
      user: req.user._id,
      departmentId,
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Physical progress tracker not found. Please load progress first.',
      });
    }

    const exercise = progress.exercises.id(exerciseId);
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found in the progress plan',
      });
    }

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
