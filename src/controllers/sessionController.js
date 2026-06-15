import mongoose from 'mongoose';
import InterviewSession from '../models/InterviewSession.js';
import Organization from '../models/Organization.js';
import Category from '../models/Category.js';
import Position from '../models/Position.js';
import Question from '../models/Question.js';
import { evaluateCandidateAnswerAgainstIdeal } from '../services/geminiService.js';
import { getMockQuestions } from '../services/geminiService.js';

/**
 * @desc    Start a new interview session
 * @route   POST /interviews/sessions
 * @access  Private
 */
export const startSession = async (req, res, next) => {
  const { organizationId, categoryId, positionId, count = 20, isVoice = false } = req.body;

  try {
    // 1. Fetch organization
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // 2. Fetch category
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // 3. Fetch position
    const position = await Position.findById(positionId);
    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Position not found',
      });
    }

    // 4. Fetch questions from database
    let dbQuestions = await Question.find({
      organization: organizationId,
      category: categoryId,
      position: positionId,
    });

    // Self-healing check: seed defaults if database is empty of questions for this rank
    if (dbQuestions.length === 0) {
      if (process.env.DISABLE_AI_FALLBACK === 'true') {
        return res.status(400).json({
          success: false,
          message: `No questions found for ${position.name} in the database. Please seed or add custom questions first.`,
        });
      }

      const mockList = getMockQuestions(organization.name, category.name, position.name, 20);
      const seedItems = mockList.map((mq) => ({
        organization: organizationId,
        category: categoryId,
        position: positionId,
        question: mq.question,
        idealAnswer: `An exemplary response would demonstrate thorough preparation, confidence, role compatibility, and high moral integrity suited for a ${position.name} role.`,
        difficulty: mq.difficulty ? mq.difficulty.toLowerCase() : 'medium',
        tags: [category.name.toLowerCase(), position.name.toLowerCase()],
        source: 'ai_generated',
      }));
      await Question.insertMany(seedItems);

      // Re-fetch seeded questions
      dbQuestions = await Question.find({
        organization: organizationId,
        category: categoryId,
        position: positionId,
      });
    }

    // 5. Select randomized subset based on count parameter
    const limit = parseInt(count) || 20;
    const shuffled = dbQuestions.sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, limit);

    // 6. Create session doc
    const session = await InterviewSession.create({
      userId: req.user._id,
      user: req.user._id, // Dual support
      organization: organizationId,
      position: positionId,
      isVoice: !!isVoice,
      questions: selectedQuestions.map((q) => ({
        questionId: q._id,
        question: q.question,
        category: category.name,
        difficulty: q.difficulty,
        idealAnswer: q.idealAnswer || '',
      })),
      status: 'started',
      totalScore: 0,
      overallPercentage: 0,
    });

    // Populate organization and position details
    const populatedSession = await InterviewSession.findById(session._id)
      .populate('organization', 'name logo')
      .populate('position', 'name');

    res.status(201).json({
      success: true,
      data: populatedSession,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit answer to a question in active session and run AI comparison
 * @route   POST /interviews/sessions/:sessionId/answer
 * @access  Private
 */
export const saveAnswer = async (req, res, next) => {
  const { sessionId } = req.params;
  const { questionIndex, answer } = req.body;

  try {
    // 1. Find session and populate org/position names
    const session = await InterviewSession.findById(sessionId)
      .populate('organization', 'name')
      .populate('position', 'name');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found',
      });
    }

    // 2. Access control
    const sessionUserId = session.userId ? session.userId.toString() : '';
    const sessionUser = session.user ? session.user.toString() : '';
    const currentUserId = req.user._id.toString();

    if (sessionUserId !== currentUserId && sessionUser !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit answers for this session',
      });
    }

    // 3. Status check
    if (session.status !== 'started') {
      return res.status(400).json({
        success: false,
        message: 'This session has already been completed',
      });
    }

    // 4. Index check
    const qIndex = parseInt(questionIndex);
    if (qIndex < 0 || qIndex >= session.questions.length) {
      return res.status(400).json({
        success: false,
        message: `Invalid question index. Value must be between 0 and ${session.questions.length - 1}`,
      });
    }

    const targetQuestion = session.questions[qIndex];

    // 5. Evaluate answer via Gemini comparison service
    const evaluation = await evaluateCandidateAnswerAgainstIdeal(
      targetQuestion.question,
      answer,
      targetQuestion.idealAnswer || 'Demonstrate thorough preparation and high professionalism.'
    );

    // 6. Save evaluation details
    targetQuestion.candidateAnswer = answer;
    targetQuestion.userAnswer = answer; // Alias
    targetQuestion.score = evaluation.score; // out of 10
    targetQuestion.matchPercentage = evaluation.matchPercentage; // out of 100
    targetQuestion.feedback = `Match score: ${evaluation.matchPercentage}%. Strengths: ${evaluation.strengths.join(' ')}`;
    
    // Front-end compatibility mappings
    targetQuestion.strengths = evaluation.strengths.join('\n');
    targetQuestion.weaknesses = evaluation.weaknesses.join('\n');
    targetQuestion.suggestions = evaluation.suggestions.join('\n');

    // 7. Calculate average score & overall percentage
    const evaluatedQuestions = session.questions.filter((q) => q.score !== null);
    
    const scoreSum = evaluatedQuestions.reduce((acc, q) => acc + q.score, 0);
    const avgScore = evaluatedQuestions.length > 0 ? (scoreSum / evaluatedQuestions.length) : 0;
    session.totalScore = Math.round(avgScore * 10); // scale out of 100 for compatibility

    const pctSum = evaluatedQuestions.reduce((acc, q) => acc + q.matchPercentage, 0);
    session.overallPercentage = evaluatedQuestions.length > 0 ? Math.round(pctSum / evaluatedQuestions.length) : 0;

    // 8. Completion check
    const allAnswered = session.questions.every((q) => q.score !== null);
    if (allAnswered) {
      session.status = 'completed';
      session.completedAt = new Date();
    }

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Answer saved and evaluated successfully',
      evaluation: {
        questionIndex: qIndex,
        question: targetQuestion.question,
        userAnswer: answer,
        score: targetQuestion.totalScore || Math.round(evaluation.score * 10), // scale out of 100 for progress view
        matchPercentage: evaluation.matchPercentage,
        strengths: targetQuestion.strengths,
        weaknesses: targetQuestion.weaknesses,
        suggestions: targetQuestion.suggestions,
        feedback: targetQuestion.feedback,
      },
      sessionStatus: session.status,
      totalScore: session.totalScore,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get session details
 * @route   GET /interviews/sessions/:sessionId
 * @access  Private
 */
export const getSession = async (req, res, next) => {
  const { sessionId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format',
      });
    }

    const session = await InterviewSession.findById(sessionId)
      .populate('organization', 'name logo')
      .populate('position', 'name');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found',
      });
    }

    // Access control
    const sessionUserId = session.userId ? session.userId.toString() : '';
    const sessionUser = session.user ? session.user.toString() : '';
    const currentUserId = req.user._id.toString();

    if (sessionUserId !== currentUserId && sessionUser !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this session',
      });
    }

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user interview session history
 * @route   GET /interviews/history
 * @access  Private
 */
export const getHistory = async (req, res, next) => {
  try {
    const sessions = await InterviewSession.find({
      $or: [{ userId: req.user._id }, { user: req.user._id }],
    })
      .populate('organization', 'name logo')
      .populate('position', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an interview session
 * @route   DELETE /interviews/sessions/:sessionId
 * @access  Private
 */
export const deleteSession = async (req, res, next) => {
  const { sessionId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format',
      });
    }

    const session = await InterviewSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found',
      });
    }

    // Access control
    const sessionUserId = session.userId ? session.userId.toString() : '';
    const sessionUser = session.user ? session.user.toString() : '';
    const currentUserId = req.user._id.toString();

    if (sessionUserId !== currentUserId && sessionUser !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this session',
      });
    }

    await InterviewSession.findByIdAndDelete(sessionId);

    res.status(200).json({
      success: true,
      message: 'Interview session deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
