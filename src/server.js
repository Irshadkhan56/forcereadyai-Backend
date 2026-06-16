import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";
import logger from "./utils/logger.js";

// Handle Uncaught Exceptions
process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception! Shutting down server...`, err);
  process.exit(1);
});

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;
const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  process.env.CORS_ORIGIN ||
  "Frontend URL not configured";

let server;
// Don't start a separate listener in Vercel serverless environment
if (!process.env.VERCEL) {
  server = app.listen(PORT, () => {
    logger.info(
      `Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`,
    );
    console.log(`Frontend URL: ${FRONTEND_URL}`);
  });
} else {
  logger.info(`Server initialized in Vercel serverless mode.`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
}

// Handle Unhandled Rejections
process.on("unhandledRejection", (err) => {
  logger.error(`Unhandled Rejection! Shutting down server gracefully...`, err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle Sigterm
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down server gracefully...");
  if (server) {
    server.close(() => {
      logger.info("Process terminated.");
    });
  } else {
    logger.info("Process terminated.");
  }
});

console.log("");

export default app;
