const express = require("express");
const router = express.Router();
const userModel = require("../models/user.model.js");
const messageModel = require("../models/messageModel.js");
const authController = require("../controllers/auth.controller.js");
const authMiddleware = require("../middleware/auth.middleware.js");

// -------------------- AUTH ROUTES --------------------

// Register, Login, Logout
router.post("/user/register", authController.registerUser);
router.post("/user/login", authController.LoginUser);
router.post("/user/logout", authController.LogoutUser);

// ✅ Check if user is authenticated (fixes redirect issue)
router.get("/user", authMiddleware, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Auth check error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// -------------------- SEARCH ROUTE --------------------

// Search users by userId or name
router.get("/search", authMiddleware, async (req, res) => {
  const query = (req.query.query || "").trim();
  if (!query) return res.status(400).json({ error: "Query is required" });

  try {
    const users = await userModel
      .find({
        $or: [
          { userId: { $regex: query, $options: "i" } },
          { name: { $regex: query, $options: "i" } },
        ],
      })
      .select("-password");

    res.json({ users });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// -------------------- FRIEND ROUTES --------------------

// Add friend by userId
router.post("/user/add-friend", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const currentUser = await userModel.findById(req.user.id);
    const friendUser = await userModel.findOne({ userId: userId.toLowerCase().trim() });
    if (!friendUser) return res.status(404).json({ error: "User not found" });

    if (currentUser._id.toString() === friendUser._id.toString()) {
      return res.status(400).json({ error: "You can't add yourself" });
    }

    const isAlreadyFriend = currentUser.friends.some(
      (fId) => fId.toString() === friendUser._id.toString()
    );
    if (isAlreadyFriend) return res.status(400).json({ error: "Already friends" });

    currentUser.friends.push(friendUser._id);
    await currentUser.save();

    res.json({
      message: "Friend added successfully",
      friend: {
        _id: friendUser._id,
        name: friendUser.name,
        userId: friendUser.userId,
        email: friendUser.email,
      },
    });
  } catch (err) {
    console.error("Add friend error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Remove friend by userId
router.post("/user/remove-friend", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const currentUser = await userModel.findById(req.user.id);
    const friendUser = await userModel.findOne({ userId: userId.toLowerCase().trim() });
    if (!friendUser) return res.status(404).json({ error: "User not found" });

    currentUser.friends = currentUser.friends.filter(
      (fId) => fId.toString() !== friendUser._id.toString()
    );
    await currentUser.save();

    res.json({ message: "Friend removed successfully" });
  } catch (err) {
    console.error("Remove friend error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get friends list
router.get("/user/friends", authMiddleware, async (req, res) => {
  try {
    const user = await userModel
      .findById(req.user.id)
      .populate("friends", "name userId email");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ friends: user.friends });
  } catch (err) {
    console.error("Fetch friends error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// -------------------- MESSAGE ROUTES --------------------

// Fetch conversation with a friend
router.get("/messages/conversation/:friendId", authMiddleware, async (req, res) => {
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

    res.json({ messages });
  } catch (err) {
    console.error("Conversation error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Send a message
router.post("/messages/send", authMiddleware, async (req, res) => {
  try {
    const senderId = req.user.id;
    const { recipientId, text } = req.body;

    if (!recipientId || !text?.trim()) {
      return res.status(400).json({ error: "Recipient and message text required" });
    }

    const newMessage = await messageModel.create({
      sender: senderId,
      recipient: recipientId,
      text: text.trim(),
    });

    res.json({ message: newMessage });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
