// server.js
const dotenv = require('dotenv');
dotenv.config();

const app = require('./src/app.js');
const connectdb = require('./src/db/db.js');

// Connect to MongoDB
connectdb();

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`⚡ Server running on port ${PORT}`);
});
