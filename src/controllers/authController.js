import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendResetPasswordEmail } from '../services/emailService.js';
import logger from '../utils/logger.js';

// Helper — generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'forceready_secret_fallback_key_2026', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });


// Helper — safe user object (never expose password)
const safeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isBlocked: user.isBlocked,
  authProvider: user.authProvider,
  profileImage: user.profileImage,
  age: user.age,
  education: user.education,
});

/**
 * @desc    Register a new candidate
 * @route   POST /auth/register
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  const { name, email, password, age, education } = req.body;
  try {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }

    let profileImageUrl = '';
    if (req.file) {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      profileImageUrl = `${protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    const user = await User.create({
      name,
      email,
      password,
      age: age ? Number(age) : undefined,
      education,
      role: 'candidate',
      authProvider: 'local',
      profileImage: profileImageUrl,
    });

    res.status(201).json({
      success: true,
      data: safeUser(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register a new admin via secret key (one-time setup endpoint)
 * @route   POST /auth/register-admin
 * @access  Secret (requires ADMIN_REGISTRATION_SECRET header)
 */
export const registerAdmin = async (req, res, next) => {
  const secretKey = req.headers['x-admin-secret'];
  const { name, email, password } = req.body;

  try {
    // Verify the secret key matches the environment variable
    if (!secretKey || secretKey !== process.env.ADMIN_REGISTRATION_SECRET) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or missing admin registration secret',
      });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'admin',
      authProvider: 'local',
    });

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: safeUser(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user (candidate or admin)
 * @route   POST /auth/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Reject Google accounts trying to use password login
    if (user.authProvider === 'google') {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google Sign-In. Please login with Google.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Reject blocked users
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact support.',
      });
    }

    res.status(200).json({
      success: true,
      data: safeUser(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Google Sign-In — upsert user from Google ID token
 * @route   POST /auth/google
 * @access  Public
 *
 * NOTE: Full Google token verification requires the google-auth-library
 * package and a GOOGLE_CLIENT_ID env variable. This is a STUB implementation
 * that accepts { name, email, profileImage } directly from the frontend.
 * Replace the stub with real token verification when credentials are ready.
 */
export const googleAuth = async (req, res, next) => {
  const { name, email, profileImage } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ success: false, message: 'Google authentication data is incomplete' });
    }

    // Upsert: find existing or create new Google user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        profileImage: profileImage || '',
        role: 'candidate',
        authProvider: 'google',
      });
    } else if (user.authProvider === 'local') {
      // Existing local account — merge Google info
      user.authProvider = 'google';
      user.profileImage = profileImage || user.profileImage;
      await user.save();
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact support.',
      });
    }

    res.status(200).json({
      success: true,
      data: safeUser(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user profile
 * @route   GET /auth/profile
 * @access  Private
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const user = req.user;
    if (user) {
      res.status(200).json({ success: true, data: safeUser(user) });
    } else {
      res.status(404).json({ success: false, message: 'User profile not found' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /auth/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = req.body.name || user.name;
      user.age = req.body.age !== undefined ? req.body.age : user.age;
      user.education = req.body.education || user.education;
      user.profileImage = req.body.profileImage || user.profileImage;
      const updatedUser = await user.save();
      res.status(200).json({ success: true, data: safeUser(updatedUser) });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change password
 * @route   PUT /auth/change-password
 * @access  Private
 */
export const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (user) {
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Incorrect current password' });
      }
      user.password = newPassword;
      await user.save();
      res.status(200).json({ success: true, message: 'Password updated successfully' });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Request a secure password reset link
 * @route   POST /auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'This email is not registered. Please register first.',
      });
    }

    if (user.authProvider === 'google') {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google Sign-In. Password reset is disabled.',
      });
    }

    // Generate a 6-digit numerical OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in user document
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins

    await user.save({ validateBeforeSave: false });

    // Send reset email
    try {
      const { sendOTPEmail } = await import('../services/emailService.js');
      await sendOTPEmail(user.email, otp);
    } catch (err) {
      logger.error(`Failed to send reset password OTP email to ${user.email}:`, err);

      // In development mode, fallback to logging the OTP to console and returning success
      if (process.env.NODE_ENV === 'development') {
        logger.info(`[Dev Fallback] Password Reset OTP generated for ${user.email}: ${otp}`);
        
        return res.status(200).json({
          success: true,
          message: `Development Mode: Email sending failed. The OTP is: ${otp} (also logged in terminal).`,
        });
      }

      user.resetPasswordOTP = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Email could not be sent. Please try again later.' });
    }

    res.status(200).json({
      success: true,
      message: 'An OTP verification code has been sent to your email address.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password using token
 * @route   POST /auth/reset-password/:token
 * @access  Public
 */
/**
 * @desc    Reset password using OTP verification code
 * @route   POST /auth/reset-password-otp
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
  const { email, otp, password } = req.body;
  try {
    if (!email || !otp || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email, OTP code, and new password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordOTP: otp.trim(),
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP verification code' });
    }

    if (user.authProvider === 'google') {
      return res.status(400).json({ success: false, message: 'This account uses Google Sign-In. Password reset is disabled.' });
    }

    user.password = password;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload candidate avatar picture
 * @route   POST /auth/upload-avatar
 * @access  Private (Candidate only / protect middleware)
 */
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const fileUrl = `${protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.profileImage = fileUrl;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      profileImage: fileUrl,
      data: safeUser(user)
    });
  } catch (error) {
    next(error);
  }
};
