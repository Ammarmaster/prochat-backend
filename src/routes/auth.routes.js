// routes/auth.route.js
const express = require("express");
const router = express.Router();
const userModel = require("../models/user.model.js");
const messageModel = require("../models/messageModel.js");
const authController = require("../controllers/auth.controller.js");
const authMiddleware = require("../middleware/auth.middleware.js");

// ===============================
// 🔹 AUTH ROUTES
// ===============================
router.post("/user/register", authController.registerUser);
router.post("/user/login", authController.LoginUser);
router.post("/user/logout", authController.LogoutUser);

// ✅ Verify login status
router.get("/user", authMiddleware, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json({ user });
  } catch (err) {
    console.error("Auth check error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===============================
// 🔹 FRIEND ROUTES
// ===============================

// ➕ ADD FRIEND (mutual add)
router.post("/user/add-friend", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user.id;

    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const currentUser = await userModel.findById(currentUserId);
    const friendToAdd = await userModel.findOne({ userId });

    if (!friendToAdd)
      return res.status(404).json({ error: "User not found" });

    if (friendToAdd._id.toString() === currentUserId)
      return res
        .status(400)
        .json({ error: "You cannot add yourself as a friend" });

    // 🚫 Already friends check
    if (currentUser.friends.includes(friendToAdd._id))
      return res.status(400).json({ error: "User is already your friend" });

    // ✅ Add each other mutually
    currentUser.friends.push(friendToAdd._id);
    friendToAdd.friends.push(currentUser._id);

    await currentUser.save();
    await friendToAdd.save();

    // ✅ Return updated friend data for frontend
    const newFriend = await userModel
      .findById(friendToAdd._id)
      .select("name userId email");

    res.status(200).json({
      success: true,
      message: "Friend added successfully",
      friend: newFriend,
    });
  } catch (err) {
    console.error("Add friend error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 👥 GET FRIENDS
router.get("/user/friends", authMiddleware, async (req, res) => {
  try {
    const user = await userModel
      .findById(req.user.id)
      .populate("friends", "name userId email");

    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ friends: user.friends });
  } catch (err) {
    console.error("Fetch friends error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ❌ REMOVE FRIEND (Mutual Remove)
router.post("/user/remove-friend", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user.id;

    if (!userId)
      return res.status(400).json({ error: "User ID is required" });

    const currentUser = await userModel.findById(currentUserId);
    const friendToRemove = await userModel.findOne({ userId });

    if (!friendToRemove)
      return res.status(404).json({ error: "User not found" });

    // ✅ Remove each other mutually
    currentUser.friends = currentUser.friends.filter(
      (id) => id.toString() !== friendToRemove._id.toString()
    );
    friendToRemove.friends = friendToRemove.friends.filter(
      (id) => id.toString() !== currentUser._id.toString()
    );

    await currentUser.save();
    await friendToRemove.save();

    res.status(200).json({
      success: true,
      message: "Friend removed successfully",
    });
  } catch (err) {
    console.error("Remove friend error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===============================
// 🔹 SEARCH USERS
// ===============================
router.get("/search", authMiddleware, async (req, res) => {
  try {
    const query = req.query.query?.trim();
    if (!query) return res.status(400).json({ users: [] });

    const users = await userModel
      .find({
        $or: [
          { name: { $regex: query, $options: "i" } },
          { userId: { $regex: query, $options: "i" } },
        ],
      })
      .select("-password");

    const filtered = users.filter((u) => u._id.toString() !== req.user.id);
    res.status(200).json({ users: filtered });
  } catch (err) {
    console.error("Search users error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===============================
// 🔹 MESSAGE ROUTES
// ===============================
router.get(
  "/messages/conversation/:friendId",
  authMiddleware,
  async (req, res) => {
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
      console.error("Conversation error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ✉️ SEND MESSAGE
router.post("/messages/send", authMiddleware, async (req, res) => {
  try {
    const senderId = req.user.id;
    const { recipientId, text } = req.body;

    if (!recipientId || !text?.trim())
      return res
        .status(400)
        .json({ error: "Recipient and message text required" });

    const newMessage = await messageModel.create({
      sender: senderId,
      recipient: recipientId,
      text: text.trim(),
    });

    res.status(200).json({ message: newMessage });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Catch-all for client-side routes
router.get('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = router;
