// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const decoded = jwt.verify(token, process.env.jwtsecret);

    req.user = {
      id: decoded.id,
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
  }
}

module.exports = authMiddleware;
