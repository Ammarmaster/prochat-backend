// src/app.js
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth.routes.js');

// Load environment variables
dotenv.config();

const app = express();

// ✅ Parse request bodies and cookies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// ✅ CORS configuration (for cookies + cross-origin JWT)
const allowedOrigins = [
  // 'https://prochat-frontend-six.vercel.app', // Deployed frontend
  'http://localhost:5173',                   // Local dev frontend
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
    credentials: true, // Allow cookies
  })
);

// ✅ Health check
app.get('/', (req, res) => {
  res.send('🚀 ProChat API is running successfully!');
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

module.exports = app;
