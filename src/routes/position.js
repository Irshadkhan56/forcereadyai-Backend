import express from 'express';
import {
  getPositions,
  getPositionsByCategory,
  createCustomPosition,
} from '../controllers/positionController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// GET all positions (admin/debug)
router.get('/', getPositions);

// GET positions by category (cascading: category is already org-specific)
// Optional: ?orgId=<id> for extra safety filter
router.get('/category/:categoryId', getPositionsByCategory);

// POST create a custom AI-generated position (authenticated)
router.post('/custom', protect, createCustomPosition);

export default router;
