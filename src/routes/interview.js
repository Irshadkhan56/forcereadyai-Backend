import express from 'express';
import {
  getInterviewQuestions,
  submitAnswerDirect,
  getInterviewResult,
} from '../controllers/interviewController.js';
import {
  startSession,
  saveAnswer,
  getSession,
  getHistory,
  deleteSession,
} from '../controllers/sessionController.js';
import { protect } from '../middlewares/auth.js';
import { aiLimiter } from '../middlewares/rateLimiter.js';
import { startSessionValidator, saveAnswerValidator } from '../validators/sessionValidator.js';

const router = express.Router();

// ── Pure Database-Driven Endpoints ─────────────────────────

// GET load questions from database
router.get('/questions', protect, getInterviewQuestions);

// POST submit answer and compare against stored ideal answer
router.post('/submit-answer', protect, aiLimiter, submitAnswerDirect);

// GET retrieve final score/percentage for a session
router.get('/result', protect, getInterviewResult);

// ── Session Flow Endpoints (Updated) ───────────────────────

// GET user session history
router.get('/history', protect, getHistory);

// POST start session
router.post('/sessions', protect, aiLimiter, startSessionValidator, startSession);

// GET retrieve session details
router.get('/sessions/:sessionId', protect, getSession);

// POST submit answer inside session and perform ideal evaluation
router.post('/sessions/:sessionId/answer', protect, aiLimiter, saveAnswerValidator, saveAnswer);

// DELETE session
router.delete('/sessions/:sessionId', protect, deleteSession);

export default router;
