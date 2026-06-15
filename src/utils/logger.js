/**
 * Clean logging utility for standardizing console logs.
 */
const logger = {
  info: (message) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
  },
  warn: (message) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
  },
  error: (message, error) => {
    if (error && error.stack) {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error.stack);
    } else {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
    }
  }
};

export default logger;
