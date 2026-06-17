import express from 'express';
import {
  getPhysicalPlan,
  getPhysicalProgress,
  updatePhysicalProgress,
} from '../controllers/physicalController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', getPhysicalPlan);
router.get('/progress', protect, getPhysicalProgress);
router.put('/progress', protect, updatePhysicalProgress);

export default router;
