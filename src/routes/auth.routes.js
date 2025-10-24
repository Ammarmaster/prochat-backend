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

// ➕ ADD FRIEND ROUTE
router.post('/user/add-friend', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body; // The userId of the friend to add
    const currentUserId = req.user.id; // From auth middleware

    // 🛑 Validation: Check if userId is provided
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // 🔍 Find the friend user by userId
    const friendToAdd = await userModel.findOne({ userId });
    
    if (!friendToAdd) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 🛑 Check if user is trying to add themselves
    if (friendToAdd._id.toString() === currentUserId) {
      return res.status(400).json({ error: 'You cannot add yourself as a friend' });
    }

    // 🔍 Find the current user
    const currentUser = await userModel.findById(currentUserId);
    
    if (!currentUser) {
      return res.status(404).json({ error: 'Current user not found' });
    }

    // 🛑 Check if already friends
    const isAlreadyFriend = currentUser.friends.includes(friendToAdd._id);
    if (isAlreadyFriend) {
      return res.status(400).json({ error: 'User is already in your friends list' });
    }

    // ➕ Add friend to current user's friends list
    currentUser.friends.push(friendToAdd._id);
    await currentUser.save();

    // ✅ Success response
    res.status(200).json({
      success: true,
      message: 'Friend added successfully',
      friend: {
        _id: friendToAdd._id,
        name: friendToAdd.name,
        userId: friendToAdd.userId,
        email: friendToAdd.email
      }
    });

  } catch (err) {
    console.error('Add friend error:', err);
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Friend already exists in your list' });
    }

    // Handle validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Invalid data provided' });
    }

    // General server error
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 👥 GET FRIENDS ROUTE
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

// ✉️ SEND MESSAGE ROUTE
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