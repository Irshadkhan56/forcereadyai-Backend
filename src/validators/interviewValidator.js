import { body } from 'express-validator';
import { validate } from './authValidator.js';

export const generateQuestionsValidator = [
  body('departmentId')
    .notEmpty()
    .withMessage('Department ID is required')
    .isMongoId()
    .withMessage('Invalid Department ID format'),

  body('subCategory')
    .optional()
    .isString(),

  body('position')
    .optional()
    .isString(),

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

  body('departmentId')
    .notEmpty()
    .withMessage('Department ID is required')
    .isMongoId()
    .withMessage('Invalid Department ID format'),

  body('subCategory')
    .optional()
    .isString(),

  body('position')
    .optional()
    .isString(),

  validate,
];
