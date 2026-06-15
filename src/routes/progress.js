import express from 'express';
import {
  getPhysicalPlan,
  getMedicalChecklist,
  updatePhysicalProgress,
  updateMedicalProgress,
  getUserReadiness,
} from '../controllers/progressController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// GET plan / checklist / readiness
router.get('/readiness', protect, getUserReadiness);
router.get('/physical', protect, getPhysicalPlan);
router.get('/medical', protect, getMedicalChecklist);

// PUT update progress
router.put('/physical', protect, updatePhysicalProgress);
router.put('/medical', protect, updateMedicalProgress);

export default router;

