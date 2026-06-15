import { body, param } from 'express-validator';
import { validate } from './authValidator.js';

export const startSessionValidator = [
  body('organizationId')
    .notEmpty()
    .withMessage('Organization ID is required')
    .isMongoId()
    .withMessage('Invalid Organization ID format'),

  body('categoryId')
    .notEmpty()
    .withMessage('Category ID is required')
    .isMongoId()
    .withMessage('Invalid Category ID format'),

  body('positionId')
    .notEmpty()
    .withMessage('Position ID is required')
    .isMongoId()
    .withMessage('Invalid Position ID format'),

  body('count')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Count must be between 1 and 50'),

  validate,
];

export const saveAnswerValidator = [
  param('sessionId')
    .isMongoId()
    .withMessage('Invalid Session ID format'),

  body('questionIndex')
    .notEmpty()
    .withMessage('Question index is required')
    .isInt({ min: 0 })
    .withMessage('Question index must be a non-negative integer'),

  body('answer')
    .trim()
    .notEmpty()
    .withMessage('Answer text is required'),

  validate,
];
