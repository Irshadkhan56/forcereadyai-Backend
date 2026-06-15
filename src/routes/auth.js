import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  registerUser,
  registerAdmin,
  loginUser,
  googleAuth,
  getUserProfile,
  updateUserProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  uploadAvatar,
} from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';
import {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from '../validators/authValidator.js';

// Setup local uploads storage path
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB maximum
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images (.jpg, .jpeg, .png, .webp) are allowed'));
  }
});

const router = express.Router();

// ── Public routes ──────────────────────────────────────────
router.post('/register', upload.single('profileImage'), registerValidator, registerUser);
router.post('/login', loginValidator, loginUser);
router.post('/google', googleAuth);                // Google Sign-In (stub)
router.post('/register-admin', registerAdmin);     // Secret admin creation
router.post('/forgot-password', forgotPasswordValidator, forgotPassword);
router.post('/reset-password-otp', resetPasswordValidator, resetPassword);

// ── Protected routes ───────────────────────────────────────
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateProfileValidator, updateUserProfile);
router.put('/change-password', protect, changePasswordValidator, changePassword);
router.post('/upload-avatar', protect, upload.single('avatar'), uploadAvatar);

export default router;
