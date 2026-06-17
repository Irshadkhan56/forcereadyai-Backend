import express from 'express';
import { getUserReadiness } from '../controllers/progressController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.get('/readiness', protect, getUserReadiness);

export default router;
