const mongoose = require('mongoose');

// 📄 Define the User Schema
const userSchema = new mongoose.Schema(
  {
    // 🧑 User's full name
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // 📧 Email address (must be unique)
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // 🔒 Hashed password
    password: {
      type: String,
      required: true,
    },

    // 🔑 Custom, unique user identifier for easy search (e.g. 'jalal_123')
    userId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // 👥 Friends list (references to other users)
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
      },
    ],
  },
  {
    timestamps: true, // ⏱ Automatically manage createdAt and updatedAt
  }
);

// 📦 Compile the schema into a Mongoose model
const userModel = mongoose.model('user', userSchema);

// 🚀 Export the model so it can be used in routes, controllers, etc.
module.exports = userModel;
