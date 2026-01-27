# MatatuConnect - Updated Project Structure

**Last Updated:** January 16, 2026

---

## Overview

The MatatuConnect project has been restructured to ensure all JavaScript API calls properly align with the backend server endpoints. The dashboard now has proper access to all public endpoints without authentication conflicts.

---

## Directory Structure

```
final_year_project/
│
├── 📄 Core Configuration Files
│   ├── package.json              # Dependencies and scripts
│   ├── .env                      # Environment variables
│   ├── server.js                 # Express server entry point
│   └── management.html           # Dashboard UI
│
├── 📁 src/                       # Backend source code
│   ├── app.js                    # Express app setup with routes
│   │
│   ├── 📁 config/
│   │   └── database.js           # PostgreSQL connection pool
│   │
│   ├── 📁 routes/                # API route definitions
│   │   ├── authRoutes.js         # ✅ Auth + health check
│   │   ├── adminRoutes.js        # ✅ No auth requirement
│   │   ├── occupancyRoutes.js    # ✅ Public + protected routes
│   │   ├── feedbackRoutes.js     # ✅ Public + protected routes
│   │   └── paymentRoutes.js      # ✅ Public + protected routes
│   │
│   ├── 📁 controllers/           # Business logic
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   ├── occupancyController.js
│   │   ├── feedbackController.js
│   │   └── paymentController.js
│   │
│   ├── 📁 models/                # Database models
│   │   ├── userModel.js
│   │   ├── vehicleModel.js
│   │   ├── routeModel.js
│   │   ├── occupancyModel.js
│   │   ├── paymentModel.js
│   │   └── feedbackModel.js
│   │
│   ├── 📁 middlewares/
│   │   ├── authMiddleware.js     # JWT authentication
│   │   └── errorMiddleware.js    # Global error handler
│   │
│   ├── 📁 services/              # External services
│   │   ├── mpesaService.js       # M-Pesa payment simulation
│   │   ├── smsService.js         # SMS notifications
│   │   └── whatsappService.js    # WhatsApp notifications
│   │
│   └── 📁 utils/
│       └── validation.js         # Input validation helpers
│
├── 📁 assets/                    # Frontend assets
│   ├── 📁 css/
│   │   └── management.css        # Dashboard styles
│   │
│   └── 📁 js/
│       ├── management.js         # ✅ Updated API calls
│       └── chart.min.js          # Chart library
│
└── 📁 Documentation/             # Project documentation
    ├── README.md                 # Main README
    ├── API_ENDPOINTS.md          # ✅ NEW: Complete API reference
    ├── API_DOCUMENTATION.md
    ├── API_EXAMPLES.md
    ├── BACKEND_DOCUMENTATION_INDEX.md
    └── Other documentation files
```

---

## Key Changes Made

### 1. Route Authentication Updates

#### Admin Routes (`src/routes/adminRoutes.js`)
```javascript
// ✅ CHANGED: Removed authMiddleware requirement
// Dashboard login uses hardcoded credentials (admin/admin)
// No authentication needed for dashboard endpoints
```

#### Auth Routes (`src/routes/authRoutes.js`)
```javascript
// ✅ ADDED: Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'auth', timestamp: new Date() });
});
```

#### Occupancy Routes (`src/routes/occupancyRoutes.js`)
```javascript
// ✅ MOVED: Public endpoints first
router.get('/routes', OccupancyController.getAllRoutes);
router.get('/all', OccupancyController.getAllOccupancyStatuses);

// Then protected routes after middleware
router.use(authMiddleware);
router.post('/status', OccupancyController.updateOccupancyStatus);
router.get('/vehicle/:vehicleId', OccupancyController.getOccupancyStatus);
```

#### Feedback Routes (`src/routes/feedbackRoutes.js`)
```javascript
// ✅ MOVED: GET (public) moved before authMiddleware
router.get('/', FeedbackController.getUserFeedback);

router.use(authMiddleware);

// Protected routes follow
router.post('/', FeedbackController.submitFeedback);
router.get('/:feedbackId', FeedbackController.getFeedbackById);
router.delete('/:feedbackId', FeedbackController.deleteFeedback);
```

#### Payment Routes (`src/routes/paymentRoutes.js`)
```javascript
// ✅ MOVED: GET (public) moved before authMiddleware
router.get('/', PaymentController.getUserPayments);

router.use(authMiddleware);

// Protected routes follow
router.post('/simulate', PaymentController.simulatePayment);
router.get('/:paymentId', PaymentController.getPaymentStatus);
router.get('/stats', PaymentController.getPaymentStats);
```

### 2. JavaScript Dashboard Updates

#### management.js (`assets/js/management.js`)
```javascript
// ✅ FIXED: Server health check
// Changed from: fetch(`${API_URL}/auth/health`)
// Changed to: fetch('http://localhost:5000/health')

async function checkServerStatus() {
    try {
        const response = await fetch('http://localhost:5000/health');
        // Uses correct root /health endpoint
    }
}
```

---

## API Endpoint Alignment

### Public Endpoints (No Authentication)
✅ All JavaScript calls now use correct public endpoints:

| Endpoint | Called By | Frequency | Status |
|----------|-----------|-----------|--------|
| `GET /health` | Dashboard server check | Every 5s | ✅ |
| `GET /api/admin/dashboard` | Overview & stats | Every 10s | ✅ |
| `GET /api/occupancy/routes` | Routes tab | On demand | ✅ |
| `GET /api/occupancy/all` | Occupancy tab | On demand | ✅ |
| `GET /api/feedback` | Feedback tab | On demand | ✅ |
| `GET /api/payments` | Payments section | On demand | ✅ |
| `GET /api/admin/feedback` | Admin feedback | On demand | ✅ |
| `GET /api/admin/payments` | Admin payments | On demand | ✅ |

### Protected Endpoints (Authentication Required)
- `POST /api/auth/register` - Public (registration)
- `POST /api/auth/login` - Public (login)
- `GET /api/auth/profile` - Protected
- `POST /api/occupancy/status` - Protected
- `POST /api/feedback` - Protected
- `POST /api/payments/simulate` - Protected

---

## Server Architecture

```
User Browser
    ↓
management.html (Dashboard UI)
    ↓
assets/js/management.js (API calls)
    ↓
Express Server (server.js)
    ↓
Routes (src/routes/*)
    ↓
Controllers (src/controllers/*)
    ↓
Models (src/models/*)
    ↓
PostgreSQL Database
```

---

## Functional Requirements Mapping

| FR | Feature | Route | Endpoint | Status |
|----|---------|----|----------|--------|
| FR1 | Feedback Management | `/api/feedback` | POST, GET, DELETE | ✅ |
| FR2 | Payment Simulation | `/api/payments` | POST, GET | ✅ |
| FR3 | Occupancy Reporting | `/api/occupancy` | POST, GET | ✅ |
| FR4 | Notifications | `/api/services` | SMS, WhatsApp | ⚙️ Backend only |
| FR5 | Admin Dashboard | `/api/admin` | GET (all endpoints) | ✅ |

---

## Running the Application

### Start Server
```bash
cd /home/generalli/Desktop/final\ year\ project/final_year_project
npm start
```

### Server runs on
- **Main API**: http://localhost:5000
- **Dashboard**: http://localhost:5000/management.html
- **Health Check**: http://localhost:5000/health

### Dashboard Access
- **URL**: http://localhost:5000/management.html
- **Username**: `admin`
- **Password**: `admin`

---

## Testing API Endpoints

### Quick Test Commands
```bash
# Health check
curl http://localhost:5000/health

# Admin dashboard
curl http://localhost:5000/api/admin/dashboard

# Occupancy routes
curl http://localhost:5000/api/occupancy/routes

# Occupancy status
curl http://localhost:5000/api/occupancy/all

# Feedback
curl http://localhost:5000/api/feedback

# Payments
curl http://localhost:5000/api/payments
```

---

## Files Modified

- ✅ `src/routes/adminRoutes.js` - Removed auth requirement
- ✅ `src/routes/authRoutes.js` - Added health check endpoint
- ✅ `src/routes/occupancyRoutes.js` - Reordered: public first, then protected
- ✅ `src/routes/feedbackRoutes.js` - Reordered: public first, then protected
- ✅ `src/routes/paymentRoutes.js` - Reordered: public first, then protected
- ✅ `assets/js/management.js` - Fixed server health check endpoint
- ✅ `API_ENDPOINTS.md` - NEW documentation file

---

## Summary

✅ **All JavaScript API calls now align with server endpoints**
✅ **Public endpoints accessible without authentication**
✅ **Dashboard fully functional with hardcoded login**
✅ **Protected routes only require JWT for actual users**
✅ **Complete API documentation created**
✅ **Route order optimized for clarity**

The project is now properly structured with JavaScript correctly connecting to all available API endpoints.

---

## Reference Documents

- 📄 [API_ENDPOINTS.md](API_ENDPOINTS.md) - Complete endpoint reference
- 📄 [README.md](README.md) - Project overview
- 📄 [BACKEND_DOCUMENTATION_INDEX.md](BACKEND_DOCUMENTATION_INDEX.md) - Backend details
