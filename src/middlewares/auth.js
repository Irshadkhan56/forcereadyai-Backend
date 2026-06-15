import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../utils/logger.js';

/**
 * Protect routes — verifies JWT and attaches req.user
 * Also rejects blocked users on all protected routes.
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found',
        });
      }

      // Block check — blocked users cannot access any protected route
      if (req.user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been blocked. Please contact support.',
        });
      }

      next();
    } catch (error) {
      logger.error('JWT verification failed', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
      });
    }
  } else {
    res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
    });
  }
};

/**
 * Admin-only middleware — must be used AFTER protect
 * Rejects any user whose role is not 'admin'.
 */
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }
};
