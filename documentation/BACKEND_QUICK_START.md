# MatatuConnect Backend - Quick Start Guide

## Prerequisites
- Node.js 14+ and npm
- PostgreSQL 12+
- Git

## Installation & Setup

### 1. Install Dependencies
```bash
cd final_year_project
npm install
```

This installs:
- `express` - Web framework
- `pg` - PostgreSQL client (changed from mysql2)
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `axios` - HTTP requests for external APIs
- `cors` - Cross-origin support
- `helmet` - Security headers
- `dotenv` - Environment variables

### 2. Create PostgreSQL Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE matatuconnect;

# Exit psql
\q
```

### 3. Configure Environment Variables
Update `.env` file with your values:

```bash
# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matatuconnect
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_SSL=false

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d

# M-Pesa Daraja (Sandbox)
MPESA_API_URL=https://sandbox.safaricom.co.ke
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_BUSINESS_CODE=175808
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd1a503b00
MPESA_CALLBACK_URL=http://localhost:5000/api/payments/callback

# SMS (Africa's Talking)
AFRICAS_TALKING_API_KEY=your_api_key
AFRICAS_TALKING_USERNAME=sandbox

# WhatsApp (Meta Business API)
WHATSAPP_BUSINESS_PHONE_ID=your_phone_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_API_VERSION=v18.0

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 4. Start Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server will run on `http://localhost:5000`

### 5. Verify Setup
```bash
# Check health
curl http://localhost:5000/health

# Expected Response:
# {"message":"API is running","timestamp":"2026-01-16T..."}
```

---

## API Testing

### 1. User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "254712345678",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!"
  }'
```

### 2. User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Save the returned `token` for authenticated requests.**

### 3. Submit Feedback (Requires Token)
```bash
curl -X POST http://localhost:5000/api/feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "routeId": 1,
    "vehicleId": 1,
    "feedbackType": "Complaint",
    "comment": "Reckless driving on the route",
    "phoneNumber": "254712345678"
  }'
```

### 4. Simulate Payment (Requires Token)
```bash
curl -X POST http://localhost:5000/api/payments/simulate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "routeId": 1,
    "amount": 100,
    "phoneNumber": "254712345678"
  }'
```

### 5. Update Occupancy Status (Requires Token)
```bash
curl -X POST http://localhost:5000/api/occupancy/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "vehicleId": 1,
    "status": "available"
  }'
```

### 6. Get Admin Dashboard (Requires Token)
```bash
curl -X GET http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Database Schema

The system automatically creates the following tables on startup:

### users
- Stores user accounts (passengers, drivers, admins)
- Fields: id, name, email, phone, password, role, status, created_at

### routes
- Stores matatu routes (e.g., Thika-Nairobi)
- Fields: id, route_name, start_location, end_location, base_fare, created_at

### vehicles
- Stores vehicle information
- Fields: id, user_id, registration_number, vehicle_type, color, make, model, year, created_at

### feedback
- Stores passenger feedback on routes and vehicles
- Fields: id, user_id, route_id, vehicle_id, feedback_type, comment, created_at
- Types: "Complaint" or "Compliment"

### payments
- Logs simulated M-Pesa transactions
- Fields: id, user_id, route_id, amount, phone_number, status, transaction_id, created_at

### vehicle_occupancy
- Tracks real-time vehicle occupancy status
- Fields: id, vehicle_id, driver_id, occupancy_status (available/full), updated_at

---

## Testing

### Run Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

---

## Project Structure

```
final_year_project/
├── server.js                 # Entry point
├── package.json              # Dependencies
├── .env                       # Configuration
├── src/
│   ├── app.js               # Express app setup
│   ├── config/
│   │   └── database.js      # PostgreSQL connection
│   ├── models/              # Database models
│   │   ├── userModel.js
│   │   ├── routeModel.js
│   │   ├── vehicleModel.js
│   │   ├── feedbackModel.js      # FR1
│   │   ├── paymentModel.js       # FR2
│   │   └── occupancyModel.js     # FR3
│   ├── controllers/         # Request handlers
│   │   ├── authController.js
│   │   ├── feedbackController.js  # FR1
│   │   ├── paymentController.js   # FR2
│   │   ├── occupancyController.js # FR3
│   │   └── adminController.js     # FR5
│   ├── routes/              # API endpoints
│   │   ├── authRoutes.js
│   │   ├── feedbackRoutes.js      # FR1
│   │   ├── paymentRoutes.js       # FR2
│   │   ├── occupancyRoutes.js     # FR3
│   │   └── adminRoutes.js         # FR5
│   ├── services/            # External integrations
│   │   ├── mpesaService.js        # M-Pesa Daraja
│   │   ├── smsService.js          # Africa's Talking
│   │   └── whatsappService.js     # Meta WhatsApp
│   ├── middlewares/         # Express middleware
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   └── utils/
│       └── validation.js    # Input validation
```

---

## Key Features Implemented

### ✅ FR1: Feedback Management
- Submit feedback with route, vehicle, type, comment
- View user feedback history
- Admin dashboard with feedback filtering

### ✅ FR2: Payment Simulation (M-Pesa Daraja)
- Simulate STK Push payment process
- Record payment status in database
- Support for sandbox testing

### ✅ FR3: Occupancy Reporting
- Driver updates vehicle occupancy (Available/Full)
- Passengers check vehicle availability
- Real-time status updates

### ✅ FR4: Notification Service
- SMS confirmations via Africa's Talking
- WhatsApp messages via Meta Business API
- Automated notifications on feedback/payment/occupancy

### ✅ FR5: Admin Dashboard
- View all feedback with filtering (date, route, vehicle)
- Payment management and statistics
- User and transaction analytics

---

## Security Features

- ✅ **JWT Authentication** - Token-based API security
- ✅ **Password Hashing** - bcryptjs with salt rounds
- ✅ **SQL Injection Prevention** - Parameterized queries
- ✅ **XSS Prevention** - Input sanitization
- ✅ **CORS** - Configurable cross-origin access
- ✅ **Helmet** - Security headers
- ✅ **Input Validation** - Email, phone, password format validation

---

## Troubleshooting

### PostgreSQL Connection Error
```
✗ PostgreSQL Database connection failed: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:** Ensure PostgreSQL service is running:
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Windows
net start postgresql-x64-14 (or your version)
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Change PORT in `.env` or kill the process using port 5000.

### Missing API Credentials
If external APIs fail, check `.env` has all required credentials. During development, SMS/WhatsApp failures won't stop the main API.

---

## API Documentation

Full API documentation is available at:
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- [API_EXAMPLES.md](./API_EXAMPLES.md)

---

## Frontend Connection

The backend is ready to connect with frontend on:
- **URL:** `http://localhost:5000/api`
- **CORS Origin:** Configure in `.env` (default: `http://localhost:3000`)

Connect your React frontend and use the JWT tokens from login endpoint for authenticated requests.

---

## Deployment

For production deployment to Render, Heroku, or Railway:

1. Create account on hosting platform
2. Connect GitHub repository
3. Add environment variables in platform dashboard
4. Platform automatically:
   - Detects Node.js project
   - Installs dependencies
   - Runs `npm start`

---

## Support

For issues or questions:
1. Check [BACKEND_ALIGNMENT_REPORT.md](./BACKEND_ALIGNMENT_REPORT.md)
2. Review error logs: `npm run dev` for verbose output
3. Test endpoints manually with curl or Postman

---

**MatatuConnect Backend is ready for development and testing!** 🚀
