# MatatuConnect - Quick Start Guide

This guide will get you up and running with MatatuConnect in minutes.

## 🚀 Prerequisites

- Node.js >= 14.0.0
- PostgreSQL >= 12.0
- npm >= 6.0.0

## 📦 Installation

### 1. Clone & Install

```bash
# Navigate to project
cd final_year_project

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend/ride-aid-kenya
npm install
```

### 2. Database Setup

```bash
# Start PostgreSQL
sudo systemctl start postgresql  # Linux
# OR
brew services start postgresql    # macOS

# Create database
psql -U postgres
CREATE DATABASE matatuconnect;
\q
```

### 3. Configure Environment

#### Backend Configuration

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with minimum required variables:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=matatuconnect

# JWT
JWT_SECRET=your_random_secret_key_here_change_in_production

# CORS (frontend URL)
ALLOWED_ORIGINS=http://localhost:5173
```

#### Frontend Configuration

```bash
cd frontend/ride-aid-kenya
```

Create `.env` file:

```env
VITE_API_URL=http://localhost:5000
```

### 4. Start Services

#### Terminal 1 - Backend

```bash
cd backend
npm run dev
```

You should see:
```
🚀 MatatuConnect Server Running
📡 URL: http://localhost:5000
✓ All database tables initialized successfully
```

#### Terminal 2 - Frontend

```bash
cd frontend/ride-aid-kenya
npm run dev
```

You should see:
```
VITE v5.4.19  ready in XXX ms

➜  Local:   http://localhost:5173/
```

## 🎉 Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

## 👤 Create Admin Account

### Option 1: Via API

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@matatuconnect.com",
    "phone": "+254712345678",
    "password": "admin123",
    "role": "admin"
  }'
```

### Option 2: Via Frontend

1. Go to http://localhost:5173
2. Click "Register"
3. Fill in details
4. Select role: "Admin"
5. Click "Create Account"

## 📱 Optional: WhatsApp Setup

To enable WhatsApp notifications:

### 1. Get Twilio Credentials

1. Sign up at https://www.twilio.com/try-twilio
2. Go to Console → Messaging → WhatsApp Sandbox
3. Send "join <code>" to +1 415 523 8886 from your phone
4. Get credentials:
   - Account SID
   - Auth Token
   - Sandbox Number: whatsapp:+14155238886

### 2. Configure Backend

Add to `backend/.env`:

```env
TWILIO_ACCOUNT_SID=AC...your_sid...
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 3. Restart Backend

```bash
cd backend
npm run dev
```

## 🧪 Test the Setup

### 1. Test Backend API

```bash
# Health check
curl http://localhost:5000/health

# Response: {"message":"API is running","timestamp":"..."}
```

### 2. Test Authentication

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@matatuconnect.com",
    "password": "admin123"
  }'

# Response: {"message":"Login successful","token":"...","user":{...}}
```

### 3. Test Frontend

1. Open http://localhost:5173
2. Login with your credentials
3. You should see the dashboard

## 🐛 Troubleshooting

### Database Connection Failed

**Error**: `connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:
```bash
sudo systemctl start postgresql  # Linux
brew services start postgresql    # macOS
```

### Port Already in Use

**Error**: `Port 5000 is already in use`

**Solution**:
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9

# OR change PORT in backend/.env
PORT=5001
```

### CORS Errors in Browser

**Solution**: Check `ALLOWED_ORIGINS` in backend `.env` matches frontend URL

### NPM Install Errors

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📚 Next Steps

1. **Read Documentation**: [COMPLETE_DOCUMENTATION.md](COMPLETE_DOCUMENTATION.md)
2. **API Reference**: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
3. **Setup WhatsApp**: [TWILIO_WHATSAPP_SETUP.md](TWILIO_WHATSAPP_SETUP.md)
4. **Test Features**: Try feedback, payments, occupancy tracking

## 🎯 Quick Feature Test

### Submit Feedback

```bash
# Get auth token from login response
TOKEN="your_jwt_token_here"

# Submit feedback
curl -X POST http://localhost:5000/api/feedback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "routeId": 1,
    "vehicleId": 1,
    "feedbackType": "Compliment",
    "comment": "Great service!",
    "phoneNumber": "+254712345678"
  }'
```

### Simulate Payment

```bash
curl -X POST http://localhost:5000/api/payments/simulate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "routeId": 1,
    "amount": 100,
    "phoneNumber": "+254712345678"
  }'
```

### Report Occupancy

```bash
curl -X POST http://localhost:5000/api/occupancy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "routeId": 1,
    "vehicleId": 1,
    "currentOccupancy": 10,
    "maxCapacity": 14
  }'
```

## 🎊 Success!

You're now running MatatuConnect locally! 

**Happy coding! 🚗💨**

---

For detailed information, see [COMPLETE_DOCUMENTATION.md](COMPLETE_DOCUMENTATION.md)
