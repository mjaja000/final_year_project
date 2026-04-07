// Force IPv4 DNS resolution - must be before any other require.
// pg calls dns.lookup with { all: true } which returns both IPv4 and IPv6;
// on hosts without IPv6 internet, the IPv6 connection hangs until timeout.
const dns = require('dns');
const _origLookup = dns.lookup.bind(dns);
dns.lookup = (hostname, options, callback) => {
  if (typeof options === 'function') {
    // No options provided - simple callback, force IPv4
    return _origLookup(hostname, { family: 4 }, options);
  }
  if (options && options.all) {
    // pg-pool passes { all: true } - return results but filter to IPv4 only
    return _origLookup(hostname, options, (err, addresses) => {
      if (err) return callback(err, addresses);
      const ipv4 = Array.isArray(addresses)
        ? addresses.filter(a => a.family === 4)
        : addresses;
      callback(null, ipv4.length ? ipv4 : addresses);
    });
  }
  return _origLookup(hostname, { ...options, family: 4 }, callback);
};

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const app = require('./src/app');
const pool = require('./src/config/database');

// Initialize database tables
const initializeTables = async () => {
  try {
    const dbReady = await pool.waitForDatabaseReady();
    if (!dbReady) {
      console.error('✗ Skipping table initialization because database connection is unavailable.');
      return;
    }

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
    const LostAndFoundModel = require('./src/models/lostAndFoundModel');
    const SessionModel = require('./src/models/sessionModel');
    const CustomerLocationModel = require('./src/models/customerLocationModel');
    const { createReportsTable } = require('./src/migrations/createReportsTable');
    const { createVehicleLocationsTable } = require('./src/migrations/createVehicleLocationsTable');
    const { addAssignedVehicleIdColumn } = require('./src/migrations/addAssignedVehicleId');
    const SaccoSettingsModel = require('./src/models/saccoSettingsModel');

    // Create tables in dependency order
    await UserModel.createTable();
    await SessionModel.createTable();
    await RouteModel.createTable();
    await VehicleModel.createTable();
    
    // Run migration to add assigned_vehicle_id column
    await addAssignedVehicleIdColumn();
    
    await DriverModel.createTable();
    await TripModel.createTable();
    await BookingModel.createTable();
    await MessageModel.createTable();
    await OccupancyModel.createTable();
    await PaymentModel.createTable();
    await FeedbackModel.createTable();
    await ActivityLogModel.createTable();
    await createReportsTable();
    await LostAndFoundModel.createTable();
    await createVehicleLocationsTable();
    await CustomerLocationModel.createTable();
    await SaccoSettingsModel.createTable();

    console.log('✓ All database tables initialized successfully');
    
    // Restore recent vehicle locations to in-memory cache
    const locationController = require('./src/controllers/locationController');
    await locationController.restoreVehicleLocationsFromDB();
  } catch (error) {
    console.error('✗ Error initializing database tables:', error.message);
  }
};

// Start server
const PORT = process.env.PORT || 5000;
const HTTPS_ENABLED = process.env.ENABLE_HTTPS === 'true';

let server;

if (HTTPS_ENABLED) {
  // HTTPS mode (optional - for production-like testing)
  const https = require('https');
  const fs = require('fs');
  const path = require('path');
  
  const certDir = path.join(__dirname, '.cert');
  const certPath = path.join(certDir, 'cert.pem');
  const keyPath = path.join(certDir, 'key.pem');
  
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
    
    server = https.createServer(httpsOptions, app);
    server.listen(PORT, '0.0.0.0', async () => {
      console.log(`\n🚀 MatatuConnect Server Running (HTTPS)`);
      console.log(`📡 URL: https://localhost:${PORT}`);
      console.log(`📡 Network: https://0.0.0.0:${PORT}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}\n`);
      await initializeTables();
    });
  } else {
    console.error('\n❌ HTTPS certificates not found!');
    console.error(`Expected certificates in: ${certDir}`);
    console.error('Run: npm run setup:https in the frontend directory');
    console.error('Or set ENABLE_HTTPS=false to use HTTP\n');
    process.exit(1);
  }
} else {
  // HTTP mode (default - simpler development)
  server = app.listen(PORT, '0.0.0.0', async () => {
    console.log(`\n🚀 MatatuConnect Server Running`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`📡 Network: http://0.0.0.0:${PORT}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    await initializeTables();
  });
}

// Initialize Socket.IO after server is created
(async () => {
  if (HTTPS_ENABLED) {
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for HTTPS
  }
  
  // Initialize Socket.IO for real-time updates
  try {
    const { Server } = require('socket.io');
    
    console.log(`\n🔌 Initializing Socket.IO...`);
    console.log(`   Server: ${HTTPS_ENABLED ? 'HTTPS' : 'HTTP'}`);
    console.log(`   Port: ${PORT}`);
    console.log(`   CORS Origin: ${process.env.CORS_ORIGIN || 'auto (allows all private networks)'}`);
    
    const io = new Server(server, {
      cors: {
        origin: (process.env.CORS_ORIGIN || '*').split(',').map(o => o.trim()),
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    console.log(`✓ Socket.IO initialized successfully`);
    console.log(`📍 WebSocket URL: ws${HTTPS_ENABLED ? 's' : ''}://localhost:${PORT}/socket.io/`);

    // Import in-memory vehicle locations cache from locationController
    const locationController = require('./src/controllers/locationController');
    const { vehicleLocations } = locationController;

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
        // payload should include { userId, status, vehicleId, latitude, longitude, driverName }
        console.log('Socket driver:updateStatus', payload);
        io.to('admin').emit('driver.statusUpdated', payload);
        io.to(`route_${payload.routeId || 'all'}`).emit('driver.statusUpdated', payload);
        
        const isOnline = payload.status === 'online';

        if (payload.vehicleId) {
          if (!isOnline) {
            // Remove from cache when driver goes offline
            vehicleLocations.delete(payload.vehicleId);
            io.emit('driver:statusUpdate', { vehicleId: payload.vehicleId, userId: payload.userId, status: 'offline' });
          } else if (payload.latitude && payload.longitude) {
            // Update cache when going online with location
            const locEntry = {
              id: payload.vehicleId,
              driver_id: payload.userId,
              driver_name: payload.driverName || payload.driver_name || 'Unknown Driver',
              latitude: parseFloat(payload.latitude),
              longitude: parseFloat(payload.longitude),
              accuracy: payload.accuracy || null,
              is_online: true,
              last_update: new Date().toISOString()
            };
            vehicleLocations.set(payload.vehicleId, locEntry);
            io.emit('vehicle:locationUpdate', {
              ...locEntry,
              vehicleId: payload.vehicleId,
              isOnline: true,
            });
          }
        }
      });

      // Real-time location updates from drivers
      socket.on('driver:updateLocation', (payload) => {
        // payload: { userId, vehicleId, latitude, longitude, accuracy, driverName }
        console.log('Socket driver:updateLocation', payload);
        
        if (!payload.latitude || !payload.longitude) return;

        const vehicleId = payload.vehicleId;
        const locEntry = {
          id: vehicleId,
          driver_id: payload.userId,
          driver_name: payload.driverName || payload.driver_name || 
            (vehicleLocations.get(vehicleId)?.driver_name) || 'Unknown Driver',
          latitude: parseFloat(payload.latitude),
          longitude: parseFloat(payload.longitude),
          accuracy: payload.accuracy || null,
          is_online: true,
          last_update: new Date().toISOString()
        };

        // Update the in-memory cache so REST API /api/locations/locations reflects current positions
        if (vehicleId) {
          vehicleLocations.set(vehicleId, locEntry);
        }
        
        // Broadcast to all clients (for live map)
        io.emit('vehicle:locationUpdate', {
          ...locEntry,
          vehicleId,
          isOnline: true,
        });
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
