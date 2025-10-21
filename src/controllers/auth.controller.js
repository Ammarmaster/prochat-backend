// controllers/auth.controller.js
const userModel = require('../models/user.model.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ===============================
// ✅ Register User
// ===============================
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

    const generatedUserId =
      userId ||
      name.toLowerCase().replace(/\s+/g, '_') +
        '_' +
        Math.floor(Math.random() * 1000);

    const isUserIdExist = await userModel.findOne({
      userId: generatedUserId.toLowerCase(),
    });
    if (isUserIdExist) {
      return res.status(400).json({ message: 'User ID already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
      userId: generatedUserId.toLowerCase(),
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user._id, name: user.name, email: user.email, userId: user.userId },
    });
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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    // ✅ Set cookie for cross-domain (Vercel + Render)
    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // Render uses HTTPS
      sameSite: 'None', // allow cookies from Vercel
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
    secure: true,
    sameSite: 'None',
  });
  res.status(200).json({ message: 'Logout successful' });
}

module.exports = {
  registerUser,
  LoginUser,
  LogoutUser,
};
