const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const occupancyRoutes = require('./routes/occupancyRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const reportRoutes = require('./routes/reportRoutes');
const routeRoutes = require('./routes/routeRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const tripRoutes = require('./routes/tripRoutes');
const adminRoutes = require('./routes/adminRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const driverRoutes = require('./routes/driverRoutes');
const messageRoutes = require('./routes/messageRoutes');
const lostAndFoundRoutes = require('./routes/lostAndFoundRoutes');
const locationRoutes = require('./routes/locationRoutes');
const customerRoutes = require('./routes/customerRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Security and transport middleware.
// CORS policy is environment-driven so deployments can whitelist specific frontends.
app.use(helmet());

// CORS Configuration - Smart private network detection for mobile/local network access
const corsOriginSetting = (process.env.CORS_ORIGIN || 'auto').trim();
const allowedOrigins = corsOriginSetting === 'auto' ? [] : corsOriginSetting.split(',').map(o => o.trim());

// Private network IP patterns (RFC 1918 + localhost)
const privateNetworkPatterns = [
  /^https?:\/\/localhost(:\d+)?$/,           // localhost
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,        // loopback
  /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,  // 192.168.x.x
  /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,  // 10.x.x.x
  /^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$/,  // 172.16-31.x.x
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Allow all origins if wildcard is explicitly set
    if (allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    
    // Allow if explicitly listed in CORS_ORIGIN
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // In development with 'auto' mode: allow private network IPs only
    if ((process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev') && corsOriginSetting === 'auto') {
      const isPrivateNetwork = privateNetworkPatterns.some(pattern => pattern.test(origin));
      if (isPrivateNetwork) {
        console.log(`[CORS] Auto-allowed private network origin: ${origin}`);
        return callback(null, true);
      }
    }
    
    // Reject all others with clear error message
    console.warn(`[CORS] Blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Expose uploaded assets (driver photos, evidence files) under a stable URL prefix.
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ message: 'API is running', timestamp: new Date() });
});

// Route mounting by feature area keeps handlers small and domain-focused.
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/occupancy', occupancyRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/locations', locationRoutes); // Location tracking for vehicles
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/lost-and-found', lostAndFoundRoutes);
app.use('/api/customers', customerRoutes); // Customer location tracking for map
app.use('/api/sessions', sessionRoutes); // Session management for single-device login

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'MatatuConnect: Smart Feedback, Payment, and Occupancy Awareness Platform',
    version: '1.0.0',
    status: 'operational',
    description: 'Digital platform for informal public transport in Kenya',
    endpoints: {
      auth: '/api/auth (register, login, profile management)',
      feedback: '/api/feedback (FR1 - Feedback management)',
      reports: '/api/reports (Reporting & Feedback - GENERAL & INCIDENT)',
      occupancy: '/api/occupancy (FR3 - Occupancy reporting)',
      payments: '/api/payments (FR2 - Payment simulation)',
      admin: '/api/admin (FR5 - Administrative oversight)',
    },
    requirements: {
      FR1: 'Feedback Management (route, vehicle, type, comment)',
      FR2: 'Payment Simulation (M-Pesa sandbox)',
      FR3: 'Occupancy Reporting (Seats Available/Full)',
      FR4: 'Notification Service (SMS/WhatsApp)',
      FR5: 'Administrative Oversight (dashboard with filters)',
    },
    reportingFeatures: {
      description: 'High-integrity reporting backend with PostgreSQL and Repository Pattern',
      reportTypes: ['GENERAL (feedback with 1-5 star rating)', 'INCIDENT (categorized incidents)'],
      incidentCategories: ['Speeding', 'Reckless', 'Overcharging', 'Harassment', 'Loud Music', 'Poor Condition', 'Unsafe Driving', 'Other'],
      features: ['Discriminated union validation with Zod', 'Priority scoring for incidents', 'Urgent alerts for high-priority incidents', 'Matatu health score calculation', 'Transaction-based data integrity'],
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use(errorMiddleware);

module.exports = app;
