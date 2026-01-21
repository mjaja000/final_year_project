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

    // Create tables in dependency order
    await UserModel.createTable();
    await RouteModel.createTable();
    await VehicleModel.createTable();
    await OccupancyModel.createTable();
    await PaymentModel.createTable();
    await FeedbackModel.createTable();

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
process.on('exit', (code) => {
  console.log(`🛑 Process exiting with code: ${code}`);
});

// Log when process receives termination signals
process.on('beforeExit', (code) => {
  console.log(`⚠️ Process beforeExit event with code: ${code}`);
});

console.log('🔄 Server initialization complete. Listening for requests...');

module.exports = server;
