import logger from '../utils/logger.js';

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = undefined;

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((el) => ({
      field: el.path,
      message: el.message,
    }));
  }

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Resource not found with id of ${err.value}`;
  }

  // Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    statusCode = 400;
    const key = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered: ${key}. Please use another value.`;
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your token has expired. Please log in again.';
  }

  const errorResponse = {
    success: false,
    message,
    ...(errors && { errors }),
  };

  // Only include stack trace in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  // Log error using centralized logger
  logger.error(
    `Route: ${req.method} ${req.originalUrl} - Status: ${statusCode} - Error: ${err.message}`,
    err
  );

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;
