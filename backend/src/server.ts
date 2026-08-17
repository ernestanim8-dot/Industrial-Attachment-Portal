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
import { initSocket } from './utils/socketService';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.io
initSocket(server);

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., curl, Postman, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin '${origin}' not allowed`));
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
  
  // Seed database
  const { seedDB } = await import('./seed');
  await seedDB();
}

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
