const dotenv = require('dotenv');
dotenv.config();

const { server } = require('./src/app.js');
const connectdb = require('./src/db/db.js');

// Connect to MongoDB
connectdb();

// Start the server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`⚡ Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS enabled for:`);
  console.log(`   - https://prochat-frontend-six.vercel.app`);
  console.log(`   - http://localhost:5173`);
  console.log(`   - http://localhost:3000`);
  console.log(`💬 Socket.io ready for real-time messaging`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔴 Shutting down server gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🔴 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Unhandled promise rejection
process.on('unhandledRejection', (err) => {
  console.error('🔥 Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Uncaught exception
process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught Exception:', err);
  server.close(() => {
    process.exit(1);
  });
});