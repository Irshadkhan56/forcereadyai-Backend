import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';
import logger from './utils/logger.js';

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception! Shutting down server...`, err);
  process.exit(1);
});


// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle Unhandled Rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection! Shutting down server gracefully...`, err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle Sigterm
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down server gracefully...');
  server.close(() => {
    logger.info('Process terminated.');
  });
});
