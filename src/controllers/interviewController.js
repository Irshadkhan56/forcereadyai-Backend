import Question from '../models/Question.js';
import InterviewSession from '../models/InterviewSession.js';
import { evaluateCandidateAnswerAgainstIdeal } from '../services/geminiService.js';

/**
 * @desc    Load questions from the MongoDB database
 * @route   GET /interviews/questions
 * @access  Private
 */
export const getInterviewQuestions = async (req, res, next) => {
  const { departmentId, subCategory, position, count = 20 } = req.query;

  try {
    const query = {};
    if (departmentId) query.departmentId = departmentId;
    if (subCategory) query.subCategory = subCategory;
    if (position) query.position = position;

    const questions = await Question.find(query).limit(parseInt(count));

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Compare candidate answer against stored ideal answer
 * @route   POST /interviews/submit-answer
 * @access  Private
 */
export const submitAnswerDirect = async (req, res, next) => {
  const { questionId, candidateAnswer } = req.body;

  try {
    if (!questionId || !candidateAnswer) {
      return res.status(400).json({
        success: false,
        message: 'questionId and candidateAnswer are required',
      });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    const evaluation = await evaluateCandidateAnswerAgainstIdeal(
      question.question,
      candidateAnswer,
      question.idealAnswer || 'Demonstrate thorough preparation and professional capacity.'
    );

    res.status(200).json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Return final score of an interview session
 * @route   GET /interviews/result
 * @access  Private
 */
export const getInterviewResult = async (req, res, next) => {
  const { sessionId } = req.query;

  try {
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId query parameter is required',
      });
    }

    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        score: session.totalScore,
        overallPercentage: session.overallPercentage,
        status: session.status,
        completedAt: session.completedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
