import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
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

// Middleware
app.use(cors());
app.use(express.json());

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
