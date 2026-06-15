import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

// Middleware imports
import notFound from './middlewares/notFound.js';
import errorHandler from './middlewares/errorHandler.js';
import logger from './utils/logger.js';

// Route imports
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import organizationRoutes from './routes/organization.js';
import categoryRoutes from './routes/category.js';
import positionRoutes from './routes/position.js';
import interviewRoutes from './routes/interview.js';
import progressRoutes from './routes/progress.js';
import adminRoutes from './routes/admin.js';

const app = express();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: corsOrigin === '*' ? '*' : corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-secret']
}));


// Request Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logger
const morganStream = {
  write: (message) => logger.info(message.trim()),
};

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev', { stream: morganStream }));
} else {
  app.use(morgan('combined', { stream: morganStream }));
}

// API Routes
app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
// Serves uploaded files; uses /tmp in Vercel serverless environment
const uploadDir = process.env.VERCEL 
  ? '/tmp' 
  : path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadDir));

app.use('/organizations', organizationRoutes);
app.use('/categories', categoryRoutes);
app.use('/positions', positionRoutes);
app.use('/interviews', interviewRoutes);
app.use('/progress', progressRoutes);
app.use('/admin', adminRoutes);

// Fallback Route / Root Welcome Message
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to ForceReady AI Backend API',
    version: '1.0.0',
    documentation: '/health for API status'
  });
});

// 404 handler
app.use(notFound);

// Global Error handler
app.use(errorHandler);

export default app;
