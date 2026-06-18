import { body, validationResult } from 'express-validator';
import dns from 'dns';

// Validation error formatting middleware
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

export const registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
    
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .custom(async (email) => {
      const domain = email.split('@')[1];
      if (!domain) return false;
      
      // Permit local/developer domains for testing purposes
      if (['example.com', 'test.com', 'localhost'].includes(domain.toLowerCase())) {
        return true;
      }
      
      return new Promise((resolve, reject) => {
        dns.resolveMx(domain, (err, addresses) => {
          if (err || !addresses || addresses.length === 0) {
            reject(new Error('This email address domain does not exist. Please check for typos (e.g. @gmail.com).'));
          } else {
            resolve(true);
          }
        });
      });
    }),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
    
  body('age')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Age must be a positive integer'),
    
  body('education')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Education level is required if provided'),
    
  validate,
];

export const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
    
  validate,
];

export const updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty if provided')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
    
  body('age')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Age must be a positive integer'),
    
  body('education')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Education level cannot be empty if provided'),
    
  validate,
];

export const changePasswordValidator = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
    
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
    
  validate,
];

export const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  validate,
];

export const resetPasswordValidator = [
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  validate,
];
