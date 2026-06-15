import Progress from '../models/Progress.js';
import InterviewSession from '../models/InterviewSession.js';
import UserPhysicalProgress from '../models/UserPhysicalProgress.js';
import UserMedicalProgress from '../models/UserMedicalProgress.js';
import logger from '../utils/logger.js';

/**
 * Calculates and saves readiness metrics for a specific user
 * @param {string} userId 
 * @returns {Promise<Object>}
 */
export const calculateUserReadiness = async (userId) => {
  try {
    // 1. Calculate Interview Readiness
    // Find completed sessions and compute average score
    const completedSessions = await InterviewSession.find({
      user: userId,
      status: 'completed',
    });

    let interviewReadiness = 0;
    if (completedSessions.length > 0) {
      const sum = completedSessions.reduce((acc, sess) => acc + sess.totalScore, 0);
      interviewReadiness = Math.round(sum / completedSessions.length);
    }

    // 2. Calculate Physical Readiness
    // Find physical progress document
    const physicalProgressDoc = await UserPhysicalProgress.findOne({ user: userId });
    let physicalReadiness = 0;
    let totalExercises = 0;
    let completedExercises = 0;

    if (physicalProgressDoc && physicalProgressDoc.exercises.length > 0) {
      totalExercises = physicalProgressDoc.exercises.length;
      completedExercises = physicalProgressDoc.exercises.filter((ex) => ex.completed).length;
      physicalReadiness = Math.round((completedExercises / totalExercises) * 100);
    }

    // 3. Calculate Medical Readiness
    // Find medical progress document
    const medicalProgressDoc = await UserMedicalProgress.findOne({ user: userId });
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
    // Formula: 40% Interview, 40% Physical, 20% Medical
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
