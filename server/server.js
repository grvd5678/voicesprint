require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const taskRoutes = require('./routes/taskRoutes');
const sprintRoutes = require('./routes/sprintRoutes');
const userRoutes = require('./routes/userRoutes');
const voiceRoutes = require('./routes/voiceRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Attach io to express app so controllers can access it
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Health Check & Root
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date(), service: 'VoiceSprint API' });
});

app.get('/api', (req, res) => {
  res.json({
    message: '🚀 VoiceSprint API is active',
    endpoints: {
      tasks: '/api/tasks',
      sprints: '/api/sprints',
      users: '/api/users',
      voice: '/api/voice (coming in Phase 2)',
    },
  });
});

// Mount Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/users', userRoutes);
app.use('/api/voice', voiceRoutes);

// Socket.io Connection Handler
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error(`[Server Error]`, err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Serve frontend client build in production
const path = require('path');
const fs = require('fs');
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  🎙️  VoiceSprint Server listening on port ${PORT}`);
  console.log(`  🔗  API: http://localhost:${PORT}/api`);
  console.log(`  ⚡  WebSockets active on ws://localhost:${PORT}`);
  console.log(`===============================================`);
});

module.exports = { app, server, io };

