import { calculateUserReadiness } from '../services/progressService.js';

/**
 * @desc    Get user overall readiness metrics (Interview, Physical, Medical, and Overall)
 * @route   GET /progress/readiness
 * @access  Private
 */
export const getUserReadiness = async (req, res, next) => {
  const { departmentId, subCategory = '', position = '' } = req.query;

  try {
    const readinessData = await calculateUserReadiness(req.user._id, departmentId, subCategory, position);
    res.status(200).json({
      success: true,
      data: readinessData,
    });
  } catch (error) {
    next(error);
  }
};
