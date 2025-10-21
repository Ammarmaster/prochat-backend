// controllers/auth.controller.js
const userModel = require('../models/user.model.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ===============================
// ✅ Register User
// ===============================
// In your auth.controller.js - registerUser function
async function registerUser(req, res) {
  try {
    const { name, email, password, userId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const isEmailExist = await userModel.findOne({ email });
    if (isEmailExist) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Generate userId if not provided
    const generatedUserId = userId || 
      name.toLowerCase().replace(/\s+/g, '_') + '_' + Math.floor(Math.random() * 1000);

    const isUserIdExist = await userModel.findOne({ userId: generatedUserId });
    if (isUserIdExist) {
      return res.status(400).json({ message: 'User ID already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
      userId: generatedUserId.toLowerCase(), // Ensure lowercase
    });

    // ... rest of your registration code
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// ===============================
// ✅ Login User
// ===============================
async function LoginUser(req, res) {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isPass = await bcrypt.compare(password, user.password);
    if (!isPass) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id }, process.env.jwtsecret, {
      expiresIn: '7d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userId: user.userId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// ===============================
// ✅ Logout User
// ===============================
function LogoutUser(req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
  });
  res.status(200).json({ message: 'Logout successful' });
}

module.exports = {
  registerUser,
  LoginUser,
  LogoutUser,
};
