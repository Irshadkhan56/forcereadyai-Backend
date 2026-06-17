import Progress from '../models/Progress.js';
import InterviewSession from '../models/InterviewSession.js';
import UserPhysicalProgress from '../models/UserPhysicalProgress.js';
import UserMedicalProgress from '../models/UserMedicalProgress.js';
import logger from '../utils/logger.js';

/**
 * Calculates and saves readiness metrics for a specific user filtered by track
 * @param {string} userId 
 * @param {string} departmentId
 * @param {string} subCategory
 * @param {string} position
 * @returns {Promise<Object>}
 */
export const calculateUserReadiness = async (userId, departmentId, subCategory = '', position = '') => {
  try {
    // 1. Calculate Interview Readiness
    const interviewQuery = { user: userId, status: 'completed' };
    if (departmentId) interviewQuery.departmentId = departmentId;
    if (subCategory !== undefined) interviewQuery.subCategory = subCategory;
    if (position !== undefined) interviewQuery.position = position;

    const completedSessions = await InterviewSession.find(interviewQuery);

    let interviewReadiness = 0;
    if (completedSessions.length > 0) {
      const sum = completedSessions.reduce((acc, sess) => acc + sess.totalScore, 0);
      interviewReadiness = Math.round(sum / completedSessions.length);
    }

    // 2. Calculate Physical Readiness
    const physicalQuery = { user: userId };
    if (departmentId) physicalQuery.departmentId = departmentId;
    if (subCategory !== undefined) physicalQuery.subCategory = subCategory;
    if (position !== undefined) physicalQuery.position = position;

    const physicalProgressDoc = await UserPhysicalProgress.findOne(physicalQuery);
    let physicalReadiness = 0;
    let totalExercises = 0;
    let completedExercises = 0;

    if (physicalProgressDoc && physicalProgressDoc.exercises.length > 0) {
      totalExercises = physicalProgressDoc.exercises.length;
      completedExercises = physicalProgressDoc.exercises.filter((ex) => ex.completed).length;
      physicalReadiness = Math.round((completedExercises / totalExercises) * 100);
    }

    // 3. Calculate Medical Readiness
    const medicalQuery = { user: userId };
    if (departmentId) medicalQuery.departmentId = departmentId;
    if (subCategory !== undefined) medicalQuery.subCategory = subCategory;
    if (position !== undefined) medicalQuery.position = position;

    const medicalProgressDoc = await UserMedicalProgress.findOne(medicalQuery);
    let medicalReadiness = 0;
    let totalCriteria = 0;
    let passedCriteria = 0;
    let failedCriteria = 0;

    if (medicalProgressDoc && medicalProgressDoc.criteria.length > 0) {
      totalCriteria = medicalProgressDoc.criteria.length;
      passedCriteria = medicalProgressDoc.criteria.filter((cr) => cr.status === 'passed').length;
      failedCriteria = medicalProgressDoc.criteria.filter((cr) => cr.status === 'failed').length;
      medicalReadiness = Math.round((passedCriteria / totalCriteria) * 100);
    }

    // 4. Calculate Overall Readiness
    const overallReadiness = Math.round(
      interviewReadiness * 0.4 + physicalReadiness * 0.4 + medicalReadiness * 0.2
    );

    // 5. Update or Create Progress document in DB
    const updatedProgress = await Progress.findOneAndUpdate(
      { user: userId },
      {
        interviewReadiness,
        physicalReadiness,
        medicalReadiness,
        overallReadiness,
      },
      { new: true, upsert: true }
    );

    logger.info(`Readiness metrics calculated for User: ${userId} - Overall: ${overallReadiness}%`);

    return {
      progress: updatedProgress,
      details: {
        interviews: {
          totalCompleted: completedSessions.length,
          averageScore: interviewReadiness,
        },
        physical: {
          totalExercises,
          completedExercises,
          pendingExercises: totalExercises - completedExercises,
        },
        medical: {
          totalCriteria,
          passedCriteria,
          failedCriteria,
          uncheckedCriteria: totalCriteria - (passedCriteria + failedCriteria),
        },
      },
    };
  } catch (error) {
    logger.error(`Error calculating user readiness for user ${userId}`, error);
    throw new Error(`Readiness calculation failed: ${error.message}`);
  }
};
