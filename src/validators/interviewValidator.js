import { body } from 'express-validator';
import { validate } from './authValidator.js';

export const generateQuestionsValidator = [
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
    .isInt({ min: 1, max: 10 })
    .withMessage('Count must be an integer between 1 and 10'),

  validate,
];

export const evaluateResponseValidator = [
  body('question')
    .trim()
    .notEmpty()
    .withMessage('Question text is required'),

  body('answer')
    .trim()
    .notEmpty()
    .withMessage('Answer text is required'),

  body('organizationId')
    .notEmpty()
    .withMessage('Organization ID is required')
    .isMongoId()
    .withMessage('Invalid Organization ID format'),

  body('positionId')
    .notEmpty()
    .withMessage('Position ID is required')
    .isMongoId()
    .withMessage('Invalid Position ID format'),

  validate,
];
