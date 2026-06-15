import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

/**
 * Standard API rate limiter - 100 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  handler: (req, res, next, options) => {
    logger.warn(`API Rate Limit exceeded by IP: ${req.ip} on route: ${req.originalUrl}`);
    res.status(options.statusCode).send(options.message);
  }
});

/**
 * Auth rate limiter - 10 requests per 15 minutes to prevent brute force
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
  },
  handler: (req, res, next, options) => {
    logger.warn(`Auth Rate Limit exceeded by IP: ${req.ip}`);
    res.status(options.statusCode).send(options.message);
  }
});

/**
 * AI rate limiter - 200 requests per 15 minutes (generous limit for training platform usage)
 */
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'AI request limit reached. Please wait 15 minutes before starting new AI tasks.',
  },
  handler: (req, res, next, options) => {
    logger.warn(`AI Rate Limit exceeded by IP: ${req.ip} on route: ${req.originalUrl}`);
    res.status(options.statusCode).send(options.message);
  }
});
