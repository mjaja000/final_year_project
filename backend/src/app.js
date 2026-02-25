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
const { createReportsTable } = require('./migrations/createReportsTable');

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ message: 'API is running', timestamp: new Date() });
});

// API Routes
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
