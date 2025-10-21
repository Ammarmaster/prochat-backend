const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth.routes.js');

// Load environment variables
dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: true }));

// ✅ Enable CORS with credentials
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173', // Frontend URL
    credentials: true, // Allow cookies across origins
}));

// ✅ Parse incoming JSON and cookies
app.use(express.json());
app.use(cookieParser());

// ✅ Health check route
app.get('/', (req, res) => {
    res.send('Server is up and running!');
});

// ✅ Routes
app.use('/api/auth', authRoutes);

// ❌ 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// ⚠️ Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
});

module.exports = app;
