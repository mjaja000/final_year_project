require('dotenv').config();
const app = require('./src/app');
const pool = require('./src/config/database');

// Initialize database tables
const initializeTables = async () => {
  try {
    const UserModel = require('./src/models/userModel');
    const VehicleModel = require('./src/models/vehicleModel');
    const RouteModel = require('./src/models/routeModel');
    const OccupancyModel = require('./src/models/occupancyModel');
    const PaymentModel = require('./src/models/paymentModel');
    const FeedbackModel = require('./src/models/feedbackModel');
    const ActivityLogModel = require('./src/models/activityLogModel');
    const DatabaseStatsModel = require('./src/models/databaseStatsModel');
    const DriverModel = require('./src/models/driverModel');
    const TripModel = require('./src/models/tripModel');
    const BookingModel = require('./src/models/bookingModel');
    const MessageModel = require('./src/models/messageModel');

    // Create tables in dependency order
    await UserModel.createTable();
    await RouteModel.createTable();
    await VehicleModel.createTable();
    await DriverModel.createTable();
    await TripModel.createTable();
    await BookingModel.createTable();
    await MessageModel.createTable();
    await OccupancyModel.createTable();
    await PaymentModel.createTable();
    await FeedbackModel.createTable();
    await ActivityLogModel.createTable();

    console.log('✓ All database tables initialized successfully');
  } catch (error) {
    console.error('✗ Error initializing database tables:', error.message);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
  console.log(`\n🚀 MatatuConnect Server Running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}\n`);

  // Initialize database
  await initializeTables();

  // Initialize Socket.IO for real-time updates
  try {
    const { Server } = require('socket.io');
    const io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST']
      }
    });

    const presenceCounts = new Map();
    const updatePresence = (userId, delta) => {
      if (!userId) return;
      const current = presenceCounts.get(userId) || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) presenceCounts.delete(userId);
      else presenceCounts.set(userId, next);
      io.to('admin').emit('chat.presence', { userId, isOnline: next > 0 });
    };

    io.on('connection', (socket) => {
      console.log('⚡️ Socket connected:', socket.id);

      socket.on('join', (room) => {
        socket.join(room);
      });

      socket.on('leave', (room) => {
        socket.leave(room);
      });

      socket.on('driver:updateStatus', (payload) => {
        // payload should include { userId, status, vehicleId }
        // broadcast to admin/dashboard and occupancy rooms
        console.log('Socket driver:updateStatus', payload);
        io.to('admin').emit('driver.statusUpdated', payload);
        io.to(`route_${payload.routeId || 'all'}`).emit('driver.statusUpdated', payload);
      });

      // Chat: driver or admin can join their user room: 'user_<id>'
      socket.on('chat.join', (userId) => {
        if (!userId) return;
        socket.data.userId = userId;
        socket.join(`user_${userId}`);
        updatePresence(userId, 1);
      });

      socket.on('chat.leave', (userId) => {
        if (!userId) return;
        socket.leave(`user_${userId}`);
        updatePresence(userId, -1);
      });

      socket.on('chat.message', (payload) => {
        // payload: { senderId, receiverId, tripId, message }
        const { senderId, receiverId, tripId, message } = payload || {};
        console.log('Socket chat.message', payload);
        // Forward to the receiver room
        if (receiverId) io.to(`user_${receiverId}`).emit('chat.message', payload);
        // Notify admin room (so admin UI can show a summary/notification)
        io.to('admin').emit('chat.notification', { from: senderId, to: receiverId, tripId, message });
      });

      socket.on('chat.typing', (payload) => {
        // payload: { senderId, receiverId, isTyping }
        const { receiverId } = payload || {};
        if (receiverId) io.to(`user_${receiverId}`).emit('chat.typing', payload);
      });

      socket.on('disconnect', () => {
        if (socket.data?.userId) updatePresence(socket.data.userId, -1);
        console.log('⚡️ Socket disconnected:', socket.id);
      });
    });

    // Attach io to app for use in controllers/services
    app.set('io', io);
    console.log('✓ Socket.IO initialized');
  } catch (err) {
    console.error('✗ Failed to initialize Socket.IO:', err.message);
  }
});

// Keep the server alive
server.on('close', () => {
  console.log('⚠️ Server closed event triggered');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await pool.end();
    console.log('Database pool closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await pool.end();
    console.log('Database pool closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  console.error('Stack:', err.stack);
  // Don't exit - just log the error for debugging
  // server.close(async () => {
  //   await pool.end();
  //   process.exit(1);
  // });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  console.error('Stack:', err.stack);
  // Don't exit - just log the error for debugging
});

// Log when process is about to exit
// process.on('exit', (code) => {
//   console.log(`🛑 Process exiting with code: ${code}`);
// });

// Log when process receives termination signals
// process.on('beforeExit', (code) => {
//   console.log(`⚠️ Process beforeExit event with code: ${code}`);
// });

console.log('🔄 Server initialization complete. Listening for requests...');
