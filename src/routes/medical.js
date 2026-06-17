import express from 'express';
import {
  getMedicalChecklist,
  getMedicalProgress,
  updateMedicalProgress,
} from '../controllers/medicalController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', getMedicalChecklist);
router.get('/progress', protect, getMedicalProgress);
router.put('/progress', protect, updateMedicalProgress);

export default router;
