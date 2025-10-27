const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const authRoutes = require('./routes/auth.routes.js');
const messageModel = require('./models/messageModel.js');
const userModel = require('./models/user.model.js');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io configuration
const io = socketIo(server, {
  cors: {
    origin: [
      'https://prochat-frontend-six.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const allowedOrigins = [
  'https://prochat-frontend-six.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn('❌ CORS blocked for origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// ✅ Parse request bodies and cookies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  // Join user to their personal room
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined room`);
  });

  // Handle sending messages
  socket.on('sendMessage', async (data) => {
    try {
      const { senderId, recipientId, text } = data;
      
      console.log('💬 New message:', { senderId, recipientId, text });

      // Validate required fields
      if (!senderId || !recipientId || !text?.trim()) {
        socket.emit('messageError', { error: 'Missing required fields' });
        return;
      }

      // Save message to database
      const newMessage = await messageModel.create({
        sender: senderId,
        recipient: recipientId,
        text: text.trim(),
      });

      // Populate sender and recipient info
      const populatedMessage = await messageModel.findById(newMessage._id)
        .populate('sender', 'name userId')
        .populate('recipient', 'name userId');

      console.log('✅ Message saved:', populatedMessage._id);

      // Emit to sender
      socket.emit('newMessage', {
        _id: populatedMessage._id,
        text: populatedMessage.text,
        sender: populatedMessage.sender,
        recipient: populatedMessage.recipient,
        createdAt: populatedMessage.createdAt
      });
      
      // Emit to recipient
      io.to(recipientId).emit('newMessage', {
        _id: populatedMessage._id,
        text: populatedMessage.text,
        sender: populatedMessage.sender,
        recipient: populatedMessage.recipient,
        createdAt: populatedMessage.createdAt
      });

      console.log('📤 Message delivered to recipients');

    } catch (error) {
      console.error('❌ Send message error:', error);
      socket.emit('messageError', { error: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    try {
      const { recipientId, isTyping, userId } = data;
      console.log('⌨️ Typing:', { userId, recipientId, isTyping });
      
      if (recipientId) {
        socket.to(recipientId).emit('userTyping', { 
          userId: userId, 
          isTyping 
        });
      }
    } catch (error) {
      console.error('❌ Typing indicator error:', error);
    }
  });

  // Handle user online status
  socket.on('userOnline', (userId) => {
    console.log('🟢 User online:', userId);
    socket.broadcast.emit('userStatus', { userId, status: 'online' });
  });

  // Handle user offline status
  socket.on('userOffline', (userId) => {
    console.log('🔴 User offline:', userId);
    socket.broadcast.emit('userStatus', { userId, status: 'offline' });
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });
});

// ✅ Health check
app.get('/', (req, res) => {
  res.send('🚀 ProChat API is running successfully!');
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ProChat API is running',
    timestamp: new Date().toISOString()
  });
});

// ✅ Auth routes
app.use('/api/auth', authRoutes);

// ❌ 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ⚠️ Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled Error:', err.message);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Export both app and server
module.exports = { app, server };