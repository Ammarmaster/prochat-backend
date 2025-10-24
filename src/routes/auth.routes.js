// routes/auth.route.js
const express = require('express');
const router = express.Router();
const userModel = require('../models/user.model.js');
const messageModel = require('../models/messageModel.js');
const authController = require('../controllers/auth.controller.js');
const authMiddleware = require('../middleware/auth.middleware.js');

// ===============================
// 🔹 AUTH ROUTES
// ===============================
router.post('/user/register', authController.registerUser);
router.post('/user/login', authController.LoginUser);
router.post('/user/logout', authController.LogoutUser);

// ✅ Verify login status
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ user });
  } catch (err) {
    console.error('Auth check error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===============================
// 🔹 FRIEND ROUTES
// ===============================
router.get('/user/friends', authMiddleware, async (req, res) => {
  try {
    const user = await userModel
      .findById(req.user.id)
      .populate('friends', 'name userId email');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({ friends: user.friends });
  } catch (err) {
    console.error('Fetch friends error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===============================
// 🔹 MESSAGE ROUTES
// ===============================
router.get('/messages/conversation/:friendId', authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { friendId } = req.params;

    const messages = await messageModel
      .find({
        $or: [
          { sender: userId, recipient: friendId },
          { sender: friendId, recipient: userId },
        ],
      })
      .sort({ createdAt: 1 });

    res.status(200).json({ messages });
  } catch (err) {
    console.error('Conversation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===============================
// 🔹 SEARCH USERS
// ===============================
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const query = req.query.query?.trim();
    if (!query) return res.status(400).json({ users: [] });

    // Find users whose name or userId matches (case-insensitive)
    const users = await userModel.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { userId: { $regex: query, $options: 'i' } },
      ],
    }).select('-password');

    // Exclude the current user
    const filtered = users.filter((u) => u._id.toString() !== req.user.id);

    res.status(200).json({ users: filtered });
  } catch (err) {
    console.error('Search users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/messages/send', authMiddleware, async (req, res) => {
  try {
    const senderId = req.user.id;
    const { recipientId, text } = req.body;

    if (!recipientId || !text?.trim()) {
      return res.status(400).json({ error: 'Recipient and message text required' });
    }

    const newMessage = await messageModel.create({
      sender: senderId,
      recipient: recipientId,
      text: text.trim(),
    });

    res.status(200).json({ message: newMessage });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
