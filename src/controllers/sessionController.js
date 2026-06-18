import mongoose from 'mongoose';
import InterviewSession from '../models/InterviewSession.js';
import Department from '../models/Department.js';
import Question from '../models/Question.js';
import { evaluateCandidateAnswerAgainstIdeal, getMockQuestions } from '../services/geminiService.js';

/**
 * @desc    Start a new interview session
 * @route   POST /interviews/sessions
 * @access  Private
 */
export const startSession = async (req, res, next) => {
  const { departmentId, subCategory = '', position = '', count = 20, isVoice = false } = req.body;

  try {
    // 1. Fetch Department
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    // 2. Fetch questions from database
    let dbQuestions = await Question.find({
      departmentId,
      subCategory: subCategory || '',
      position: position || '',
    });

    // Self-healing check: seed defaults if database is empty of questions for this department/track
    if (dbQuestions.length === 0) {
      if (process.env.DISABLE_AI_FALLBACK === 'true') {
        return res.status(400).json({
          success: false,
          message: `No questions found for this track in the database. Please seed or add custom questions first.`,
        });
      }

      // Generate simulated/mock questions
      const mockList = getMockQuestions(department.name, subCategory, position, 20);
      const seedItems = mockList.map((mq) => ({
        departmentId,
        subCategory: subCategory || '',
        position: position || '',
        question: mq.question,
        idealAnswer: `An exemplary response would demonstrate thorough preparation, confidence, role compatibility, and high moral integrity suited for a ${position || department.name} role.`,
        difficulty: mq.difficulty ? mq.difficulty.toLowerCase() : 'medium',
        tags: [department.name.toLowerCase()],
        source: 'ai_generated',
      }));
      await Question.insertMany(seedItems);

      // Re-fetch seeded questions
      dbQuestions = await Question.find({
        departmentId,
        subCategory: subCategory || '',
        position: position || '',
      });
    }

    // 3. Select randomized subset based on count parameter
    const limit = parseInt(count) || 20;
    const shuffled = dbQuestions.sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, limit);

    // 4. Create session doc
    const session = await InterviewSession.create({
      userId: req.user._id,
      user: req.user._id, // Dual support
      departmentId,
      subCategory: subCategory || '',
      position: position || '',
      isVoice: !!isVoice,
      questions: selectedQuestions.map((q) => ({
        questionId: q._id,
        question: q.question,
        category: q.subCategory || 'General',
        difficulty: q.difficulty,
        idealAnswer: q.idealAnswer || '',
      })),
      status: 'started',
      totalScore: 0,
      overallPercentage: 0,
    });

    // Populate department details
    const populatedSession = await InterviewSession.findById(session._id)
      .populate('departmentId', 'name logo slug');

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
    // 1. Find session and populate department name
    const session = await InterviewSession.findById(sessionId)
      .populate('departmentId', 'name slug');

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
      .populate('departmentId', 'name logo slug');

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
      .populate('departmentId', 'name logo slug')
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
