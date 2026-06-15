import mongoose from 'mongoose';

/**
 * @desc    Get API & DB Health status
 * @route   GET /health
 * @access  Public
 */
export const getHealth = (req, res, next) => {
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbState = mongoose.connection.readyState;

  const healthData = {
    success: true,
    timestamp: new Date(),
    uptime: process.uptime(),
    status: 'healthy',
    database: {
      status: dbStates[dbState] || 'unknown',
      readyState: dbState,
    },
    env: process.env.NODE_ENV,
  };

  // If database is not connected, return 503 Service Unavailable
  if (dbState !== 1) {
    return res.status(503).json({
      ...healthData,
      status: 'degraded',
    });
  }

  res.status(200).json(healthData);
};
