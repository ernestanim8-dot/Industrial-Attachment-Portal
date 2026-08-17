import { Server as SocketIOServer } from 'socket.io';
import { Server } from 'http';

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

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join_room', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room.`);
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
