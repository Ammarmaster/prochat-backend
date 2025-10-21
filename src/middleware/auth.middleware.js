// middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

async function authMiddleware(req, res, next) {
  try {
    // ✅ Extract token from cookies
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    // ✅ Verify token (make sure the env key matches the one used in auth.controller)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Attach decoded info to request
    req.user = { id: decoded.id };

    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

module.exports = authMiddleware;
