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
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  uploadBook,
  importQuestionsJson,
  getMedicalTemplate,
  saveMedicalTemplate,
  getPhysicalTemplate,
  savePhysicalTemplate,
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

// ── Departments ────────────────────────────────────────────
router.post('/departments', createDepartment);
router.put('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);

// ── Question Bank ──────────────────────────────────────────
router.get('/questions', getQuestions);
router.post('/questions', createQuestion);
router.post('/questions/import', importQuestionsJson);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);

// ── Book Upload & AI Extraction ────────────────────────────
router.post('/upload-book', upload.single('file'), uploadBook);

// ── Medical & Physical Template Management ──────────────────
router.get('/medical-tests/template', getMedicalTemplate);
router.put('/medical-tests/template', saveMedicalTemplate);
router.get('/physical-tests/template', getPhysicalTemplate);
router.put('/physical-tests/template', savePhysicalTemplate);

export default router;
