import mongoose from 'mongoose';
import MedicalChecklist from '../models/MedicalChecklist.js';
import UserMedicalProgress from '../models/UserMedicalProgress.js';

/**
 * @desc    Get medical checklist template
 * @route   GET /medical-tests
 * @access  Public
 */
export const getMedicalChecklist = async (req, res, next) => {
  const { departmentId, subCategory = '', position = '' } = req.query;

  try {
    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: 'departmentId query parameter is required',
      });
    }

    const template = await MedicalChecklist.findOne({ departmentId, subCategory, position });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'No medical checklist template found for this department/track',
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
 * @desc    Get user medical progress (self-initializes if not existing)
 * @route   GET /medical-tests/progress
 * @access  Private
 */
export const getMedicalProgress = async (req, res, next) => {
  const { departmentId, subCategory = '', position = '' } = req.query;

  try {
    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: 'departmentId query parameter is required',
      });
    }

    let progress = await UserMedicalProgress.findOne({
      user: req.user._id,
    });

    const isDifferent = !progress ||
      progress.departmentId.toString() !== departmentId.toString() ||
      progress.subCategory !== subCategory ||
      progress.position !== position;

    if (isDifferent) {
      const template = await MedicalChecklist.findOne({ departmentId, subCategory, position });
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'No medical checklist template found for this department/track',
        });
      }

      const criteriaData = template.criteria.map((cr) => ({
        name: cr.name,
        requirement: cr.requirement,
        status: 'unchecked',
        notes: '',
      }));

      if (progress) {
        progress.departmentId = departmentId;
        progress.subCategory = subCategory;
        progress.position = position;
        progress.criteria = criteriaData;
        await progress.save();
      } else {
        progress = await UserMedicalProgress.create({
          user: req.user._id,
          departmentId,
          subCategory,
          position,
          criteria: criteriaData,
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
 * @desc    Update specific criteria status in user medical progress
 * @route   PUT /medical-tests/progress
 * @access  Private
 */
export const updateMedicalProgress = async (req, res, next) => {
  const { departmentId, criteriaId, status, notes } = req.body;

  try {
    if (!departmentId || !criteriaId) {
      return res.status(400).json({
        success: false,
        message: 'departmentId and criteriaId are required in body',
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
      departmentId,
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Medical progress tracker not found. Please load progress first.',
      });
    }

    const criteriaItem = progress.criteria.id(criteriaId);
    if (!criteriaItem) {
      return res.status(404).json({
        success: false,
        message: 'Medical criteria not found in checklist',
      });
    }

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
