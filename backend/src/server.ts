import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth';
import reportRoutes from './routes/reports';
import userRoutes from './routes/users';
import assessmentRoutes from './routes/assessments';
import notificationRoutes from './routes/notifications';
import assumptionRoutes from './routes/assumptions';
import attachmentLetterRoutes from './routes/attachmentLetters';
import locationRoutes from './routes/locations';
import dailyReportRoutes from './routes/dailyReports';
import { initSocket } from './utils/socketService';

dotenv.config();

// Ensure JWT_SECRET is configured
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET environment variable is not defined in production!');
    process.exit(1);
  } else {
    process.env.JWT_SECRET = 'dev_secret_key_ttu_attachment_portal_change_in_prod';
    console.warn('WARNING: JWT_SECRET not set. Using local development fallback secret.');
  }
}

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.io
initSocket(server);

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim());

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., curl, Postman, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Disallow origin cleanly without crashing express
    return callback(null, false);
  },
  credentials: true,
}));
app.use(express.json());

// General API Rate Limiting (200 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/assumptions', assumptionRoutes);
app.use('/api/attachment-letters', attachmentLetterRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/daily-reports', dailyReportRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'TTU Industrial Attachment API is running!' });
});

// Database Connection
async function connectDB() {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
      console.log('Connected to MongoDB');
    } else {
      throw new Error('No MONGODB_URI specified');
    }
  } catch (err) {
    console.warn('Local MongoDB not available, starting in-memory database...');
    process.env.MONGOMS_DOWNLOAD_TIMEOUT = '600000';
    process.env.MONGOMS_LAUNCH_TIMEOUT = '600000';
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'ttu-attachment-portal',
      },
    });
    const memUri = mongoServer.getUri();
    await mongoose.connect(memUri);
    console.log(`Connected to in-memory MongoDB at ${memUri}`);
  }
  
  // Seed database in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    const { seedDB } = await import('./seed');
    await seedDB();
  } else {
    console.log('Production mode detected: skipping automatic database seeding.');
  }
}

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
