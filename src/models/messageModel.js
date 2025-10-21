const mongoose = require('mongoose');

// 💬 Define the Message Schema
const messageSchema = new mongoose.Schema(
  {
    // 📨 Sender (reference to User)
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },

    // 🎯 Recipient (reference to User)
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },

    // 📝 Message content
    text: {
      type: String,
      required: true,
      trim: true,
    },

    // ⏱ Timestamp (automatically handled by `timestamps: true`)
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// 📦 Compile the schema into a Mongoose model
const messageModel = mongoose.model('message', messageSchema);

// 🚀 Export the model
module.exports = messageModel;
