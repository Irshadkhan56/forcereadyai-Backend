import express from 'express';
import multer from 'multer';
import { protect, adminOnly } from '../middlewares/auth.js';
import {
  getStats,
  getUsers,
  getUserById,
  blockUser,
  unblockUser,
  deleteUser,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  createCategory,
  updateCategory,
  deleteCategory,
  createPosition,
  updatePosition,
  deletePosition,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  uploadBook,
  importQuestionsJson,
} from '../controllers/adminController.js';

const router = express.Router();

// Multer — in-memory storage for book uploads (max 20 MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and TXT files are allowed'), false);
    }
  },
});

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// ── Analytics ──────────────────────────────────────────────
router.get('/stats', getStats);

// ── Users ──────────────────────────────────────────────────
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.patch('/users/block/:id', blockUser);
router.patch('/users/unblock/:id', unblockUser);
router.delete('/users/:id', deleteUser);

// ── Organizations ──────────────────────────────────────────
router.post('/organizations', createOrganization);
router.put('/organizations/:id', updateOrganization);
router.delete('/organizations/:id', deleteOrganization);

// ── Categories ─────────────────────────────────────────────
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// ── Positions ──────────────────────────────────────────────
router.post('/positions', createPosition);
router.put('/positions/:id', updatePosition);
router.delete('/positions/:id', deletePosition);

// ── Question Bank ──────────────────────────────────────────
router.get('/questions', getQuestions);
router.post('/questions', createQuestion);
router.post('/questions/import', importQuestionsJson);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);

// ── Book Upload & AI Extraction ────────────────────────────
router.post('/upload-book', upload.single('file'), uploadBook);

export default router;
