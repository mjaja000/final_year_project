# MatatuConnect - Complete Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Features](#features)
4. [Technology Stack](#technology-stack)
5. [Installation & Setup](#installation--setup)
6. [API Documentation](#api-documentation)
7. [Frontend Guide](#frontend-guide)
8. [Database Schema](#database-schema)
9. [WhatsApp Integration](#whatsapp-integration)
10. [Security Features](#security-features)
11. [Testing](#testing)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)
14. [Contributing](#contributing)

---

## Project Overview

**MatatuConnect** is a comprehensive smart feedback, payment, and occupancy awareness platform designed for Kenya's informal public transport system (matatus). The platform connects passengers, drivers, and administrators to improve service quality, safety, and efficiency.

### Purpose
- Enable passengers to provide real-time feedback about their transport experience
- Allow drivers to report and manage vehicle occupancy status
- Facilitate payment simulation and tracking
- Provide administrators with insights through analytics
- Enable real-time communication via WhatsApp notifications

### Target Users
- **Passengers**: Submit feedback, make payments, track trips
- **Drivers**: Report occupancy, manage trips, receive feedback
- **Administrators**: Monitor system, analyze data, manage users

---

## System Architecture

### High-Level Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│   React SPA     │◄────────┤   Express API   │◄────────┤   PostgreSQL    │
│  (Frontend)     │  REST   │   (Backend)     │   SQL   │   (Database)    │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
        │                           │
        │ Socket.IO                 │ Twilio API
        ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│   Real-time     │         │   WhatsApp      │
│   Messaging     │         │   Notifications │
└─────────────────┘         └─────────────────┘
```

### Technology Stack Details

#### Backend
- **Framework**: Express.js 5.2.1
- **Runtime**: Node.js >=14.0.0
- **Database**: PostgreSQL 8.17.1
- **Authentication**: JWT + bcryptjs
- **Real-time**: Socket.IO 4.8.3
- **WhatsApp**: Twilio SDK 5.12.1
- **Security**: Helmet.js, CORS

#### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.19
- **Language**: TypeScript
- **UI Library**: Radix UI
- **State Management**: TanStack Query
- **Styling**: Tailwind CSS
- **Real-time**: Socket.IO Client 4.8.3

#### Database
- **RDBMS**: PostgreSQL
- **Connection Pooling**: pg library
- **Schema**: Normalized relational design with 11+ tables

---

## Features

### 1. User Management
- **Multi-role authentication**: Passenger, Driver, Admin
- **Secure registration and login**
- **Profile management**
- **Password hashing** with bcrypt
- **JWT-based sessions**

### 2. Feedback System
- **Submit feedback** (Complaints/Compliments)
- **Route and vehicle selection**
- **Real-time notifications** to drivers
- **Feedback tracking** and history
- **WhatsApp notifications**

### 3. Payment Simulation
- **M-Pesa STK Push simulation**
- **Payment tracking and history**
- **Transaction receipts**
- **WhatsApp payment confirmations**

### 4. Occupancy Management
- **Real-time occupancy reporting** by drivers
- **Live occupancy status** for passengers
- **Route-based occupancy tracking**
- **Historical occupancy data**

### 5. Trip Management
- **Create and manage trips**
- **Driver assignment**
- **Route tracking**
- **Trip history**

### 6. Real-time Messaging
- **Admin-Driver chat** via Socket.IO
- **Read receipts**
- **Message history**
- **Online/offline status**

### 7. WhatsApp Integration
- **Send automated notifications**
- **Two-way messaging** (via webhook)
- **Payment confirmations**
- **Feedback alerts**
- **Twilio WhatsApp Sandbox**

### 8. Admin Dashboard
- **User management**
- **System analytics**
- **Feedback monitoring**
- **Payment tracking**
- **Activity logs**

---

## Installation & Setup

### Prerequisites

```bash
# Required software
Node.js >= 14.0.0
npm >= 6.0.0
PostgreSQL >= 12.0
```

### Backend Setup

```bash
# 1. Navigate to backend directory
cd final_year_project/backend

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your credentials

# 4. Start PostgreSQL
sudo systemctl start postgresql  # Linux
# OR use PostgreSQL.app on macOS
# OR pg_ctl start on Windows

# 5. Create database
psql -U postgres
CREATE DATABASE matatuconnect;
\q

# 6. Run the server (auto-creates tables)
npm run dev
```

### Frontend Setup

```bash
# 1. Navigate to frontend directory
cd final_year_project/frontend/ride-aid-kenya

# 2. Install dependencies
npm install

# 3. Configure environment
# Create .env file with:
VITE_API_URL=http://localhost:5000

# 4. Run development server
npm run dev
```

### Environment Variables

#### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=matatuconnect

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=24h

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```

---

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+254712345678",
  "password": "securepassword",
  "role": "passenger"
}

Response: 201 Created
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": { ... }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}

Response: 200 OK
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": { ... }
}
```

### Feedback Endpoints

#### Submit Feedback
```http
POST /api/feedback
Authorization: Bearer {token}
Content-Type: application/json

{
  "routeId": 1,
  "vehicleId": 2,
  "feedbackType": "Complaint",
  "comment": "Driver was rude",
  "phoneNumber": "+254712345678"
}

Response: 201 Created
{
  "message": "Feedback submitted successfully",
  "feedback": { ... },
  "notificationSent": true
}
```

#### Get All Feedback
```http
GET /api/feedback
Authorization: Bearer {token}

Response: 200 OK
{
  "feedbacks": [ ... ]
}
```

### Payment Endpoints

#### Simulate Payment
```http
POST /api/payments/simulate
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 100,
  "phoneNumber": "+254712345678",
  "routeId": 1
}

Response: 200 OK
{
  "message": "Payment simulation successful",
  "payment": { ... },
  "whatsappSent": true
}
```

### Occupancy Endpoints

#### Report Occupancy
```http
POST /api/occupancy
Authorization: Bearer {token}
Content-Type: application/json

{
  "routeId": 1,
  "vehicleId": 2,
  "currentOccupancy": 12,
  "maxCapacity": 14
}

Response: 201 Created
{
  "message": "Occupancy reported successfully",
  "occupancy": { ... }
}
```

### WhatsApp Endpoints

#### Send WhatsApp Message
```http
POST /api/whatsapp/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "phoneNumber": "+254712345678",
  "message": "Your payment was successful!"
}

Response: 200 OK
{
  "success": true,
  "messageId": "SM..."
}
```

#### WhatsApp Status
```http
GET /api/whatsapp/status

Response: 200 OK
{
  "configured": true,
  "whatsappNumber": "whatsapp:+14155238886"
}
```

### Message Endpoints (Admin-Driver Chat)

#### Send Message
```http
POST /api/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "receiverId": 5,
  "content": "Hello, how are you?"
}

Response: 201 Created
{
  "message": "Message sent successfully",
  "data": { ... }
}
```

#### Get Conversations
```http
GET /api/messages/conversations
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "userId": 5,
    "userName": "Driver Name",
    "lastMessage": "Hello",
    "timestamp": "2026-02-15T10:00:00Z",
    "unreadCount": 2
  }
]
```

---

## Frontend Guide

### Project Structure
```
frontend/ride-aid-kenya/
├── src/
│   ├── components/
│   │   ├── admin/          # Admin-specific components
│   │   ├── driver/         # Driver-specific components
│   │   ├── ui/             # Reusable UI components
│   │   └── layout/         # Layout components
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── AdminDashboard.tsx
│   │   └── DriverDashboard.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useAnalytics.ts
│   │   └── useMessages.ts
│   ├── services/
│   │   └── api.ts          # API client
│   └── App.tsx
├── public/
├── index.html
└── package.json
```

### Key Components

#### Authentication Hook
```typescript
// src/hooks/useAuth.ts
export const useAuth = () => {
  const login = async (email: string, password: string) => { ... };
  const register = async (userData: RegisterData) => { ... };
  const logout = () => { ... };
  return { user, login, register, logout };
};
```

#### API Service
```typescript
// src/services/api.ts
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = {
  get: (endpoint: string) => { ... },
  post: (endpoint: string, data: any) => { ... },
  put: (endpoint: string, data: any) => { ... },
  delete: (endpoint: string) => { ... }
};
```

### Socket.IO Integration
```typescript
import { io } from 'socket.io-client';

const socket = io(API_BASE);

// Listen for messages
socket.on('new_message', (message) => {
  console.log('New message:', message);
});

// Send message
socket.emit('send_message', { receiverId, content });
```

---

## Database Schema

### Core Tables

#### users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'passenger',
  status VARCHAR(50) DEFAULT 'active',
  profile_image TEXT,
  chat_id BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### feedback
```sql
CREATE TABLE feedback (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  route_id INTEGER REFERENCES routes(id),
  vehicle_id INTEGER REFERENCES vehicles(id),
  feedback_type VARCHAR(50) NOT NULL,
  comment TEXT NOT NULL,
  phone_number VARCHAR(20),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### payments
```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  route_id INTEGER REFERENCES routes(id),
  transaction_id VARCHAR(255) UNIQUE,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### occupancy
```sql
CREATE TABLE occupancy (
  id SERIAL PRIMARY KEY,
  route_id INTEGER REFERENCES routes(id),
  vehicle_id INTEGER REFERENCES vehicles(id),
  driver_id INTEGER REFERENCES users(id),
  current_occupancy INTEGER NOT NULL,
  max_capacity INTEGER NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### messages
```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id),
  receiver_id INTEGER REFERENCES users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Relationships
- `users.id` → `feedback.user_id`
- `users.id` → `payments.user_id`
- `users.id` → `occupancy.driver_id`
- `users.id` → `messages.sender_id`
- `users.id` → `messages.receiver_id`
- `routes.id` → `feedback.route_id`
- `routes.id` → `payments.route_id`
- `routes.id` → `occupancy.route_id`
- `vehicles.id` → `feedback.vehicle_id`
- `vehicles.id` → `occupancy.vehicle_id`

---

## WhatsApp Integration

### Twilio Setup

1. **Create Twilio Account**: https://www.twilio.com/try-twilio
2. **Enable WhatsApp Sandbox**: Console → Messaging → Try it out → Send a WhatsApp message
3. **Join Sandbox**: Send "join <your-code>" to +1 415 523 8886
4. **Get Credentials**: Account SID and Auth Token from console

### Configuration

```env
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
WHATSAPP_WEBHOOK_TOKEN=your_webhook_token
```

### Webhook Setup

For receiving messages:
1. Install localtunnel: `npm install -g localtunnel`
2. Start backend: `npm run dev`
3. Create tunnel: `npx localtunnel --port 5000`
4. Copy tunnel URL (e.g., https://xxx.loca.lt)
5. Go to Twilio Console → WhatsApp Sandbox Settings
6. Paste webhook URL: `https://xxx.loca.lt/api/whatsapp/webhook`
7. Select POST method
8. Save

### Sending Messages

```javascript
const whatsappService = require('./services/whatsappService');

await whatsappService.sendMessage(
  '+254712345678',
  'Your payment was successful!'
);
```

---

## Security Features

### Implemented Security Measures

1. **Authentication**
   - JWT-based authentication
   - Password hashing with bcrypt (10 rounds)
   - Token expiration (24h default)

2. **Authorization**
   - Role-based access control (RBAC)
   - Middleware validation for protected routes
   - User-scoped data access

3. **Input Validation**
   - Email format validation
   - Phone number validation
   - SQL injection prevention via parameterized queries

4. **HTTP Security**
   - Helmet.js for security headers
   - CORS configuration
   - Rate limiting (recommended for production)

5. **Data Protection**
   - Message read authorization (receiver-only)
   - User profile privacy controls
   - Secure password storage

### Known Issues to Address

⚠️ **High Priority Security Issues:**

1. **CORS Configuration**
   - Issue: Wildcard origin with credentials
   - Fix: Set specific allowed origins

2. **Public Endpoints**
   - Issue: WhatsApp status/messages publicly accessible
   - Fix: Add authentication middleware

3. **PII Exposure**
   - Issue: /api/drivers/public exposes email, phone, license
   - Fix: Remove sensitive fields from response

---

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Manual Testing

#### Test Authentication
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"test123","role":"passenger"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

#### Test WhatsApp
```bash
# Check status
curl http://localhost:5000/api/whatsapp/status

# Send test message (requires auth token)
curl -X POST http://localhost:5000/api/whatsapp/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+254712345678","message":"Test message"}'
```

---

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Configure production database
- [ ] Set up SSL/TLS certificates
- [ ] Configure proper CORS origins
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure error tracking (Sentry)
- [ ] Set up automated backups
- [ ] Use environment variables for all secrets
- [ ] Configure production WhatsApp webhook URL
- [ ] Set up CI/CD pipeline

### Recommended Platforms

- **Backend**: Railway, Render, Heroku, DigitalOcean
- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Database**: Supabase, Railway, Heroku Postgres

### Sample Deployment (Railway)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# Set environment variables
railway variables set DB_HOST=...
railway variables set JWT_SECRET=...
```

---

## Troubleshooting

### Common Issues

#### Database Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Start PostgreSQL service
```bash
sudo systemctl start postgresql  # Linux
brew services start postgresql    # macOS
```

#### CORS Errors
```
Access to fetch at 'http://localhost:5000' has been blocked by CORS policy
```
**Solution**: Check ALLOWED_ORIGINS in .env matches frontend URL

#### Socket.IO Not Connecting
**Solution**: Ensure VITE_API_URL is set correctly in frontend .env

#### WhatsApp Messages Not Sending
**Solution**: 
1. Check Twilio credentials
2. Verify sandbox is joined
3. Check phone number format (+254...)

#### JWT Token Expired
```
Error: jwt expired
```
**Solution**: Login again to get new token

---

## Contributing

### Development Workflow

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Style

- Use ES6+ features
- Follow Airbnb JavaScript Style Guide
- Use meaningful variable names
- Add comments for complex logic
- Write tests for new features

### Commit Messages

```
feat: Add new feature
fix: Fix bug in component
docs: Update documentation
style: Format code
refactor: Refactor service
test: Add tests
chore: Update dependencies
```

---

## Additional Documentation

For more detailed information, see:

- [API Endpoints](API_ENDPOINTS.md) - Complete API reference
- [Backend Architecture](BACKEND_ARCHITECTURE.md) - System design details
- [Database ERD](DATABASE_ERD.md) - Database relationships
- [Setup Guide](SETUP_GUIDE.md) - Detailed setup instructions
- [WhatsApp Integration](TWILIO_WHATSAPP_SETUP.md) - WhatsApp setup guide
- [Testing Guide](README_TESTING.md) - Testing documentation

---

## License

ISC License

---

## Support

For issues and questions:
- GitHub Issues: https://github.com/mjaja000/final_year_project/issues
- Email: support@matatuconnect.co.ke

---

**Last Updated**: February 15, 2026
**Version**: 1.0.0
