import { Server as SocketIOServer } from 'socket.io';
import { Server } from 'http';
import jwt from 'jsonwebtoken';

let io: SocketIOServer;

export const initSocket = (server: Server) => {
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');
  io = new SocketIOServer(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  // Authenticate socket connections using JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      socket.data.userId = decoded.id;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const authenticatedUserId = socket.data.userId;
    console.log(`Authenticated client connected: ${socket.id} (user: ${authenticatedUserId})`);

    // Automatically join the user's private notification channel
    if (authenticatedUserId) {
      socket.join(authenticatedUserId);
      console.log(`User ${authenticatedUserId} joined their room.`);
    }

    // Only allow joining own user room
    socket.on('join_room', (userId) => {
      if (userId === authenticatedUserId) {
        socket.join(userId);
      } else {
        console.warn(`User ${authenticatedUserId} denied joining unauthorized room ${userId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
