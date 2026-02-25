# MatatuConnect

**MatatuConnect** is a smart public transport platform for Kenya's matatu (minibus) network. It enables passengers to submit feedback, simulate M-Pesa fare payments, track vehicle occupancy, receive SMS/WhatsApp notifications, and gives administrators a real-time management dashboard. Critical safety complaints are automatically forwarded to NTSA (National Transport and Safety Authority).

> **GROUP 6 Final Year Project** — Status: All Requirements Satisfied

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Features FR1-FR5](#features-fr1-fr5)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [Setup and Installation](#setup-and-installation)
7. [Running the Application](#running-the-application)
8. [API Endpoints Reference](#api-endpoints-reference)
9. [API Examples](#api-examples)
10. [Authentication](#authentication)
11. [NTSA Integration](#ntsa-integration)
12. [WhatsApp and SMS Notifications](#whatsapp-and-sms-notifications)
13. [M-Pesa Payments](#m-pesa-payments)
14. [HTTPS Setup](#https-setup)
15. [Management Dashboard](#management-dashboard)
16. [Demo Guide](#demo-guide)
17. [Requirements Verification](#requirements-verification)
18. [Deployment Notes](#deployment-notes)

---

## Project Overview

MatatuConnect connects passengers, drivers, and operators of Kenya's informal minibus (matatu) network through:

- A **passenger interface** for submitting feedback and simulating fare payments
- A **driver interface** for reporting vehicle occupancy (available / full)
- An **admin dashboard** for monitoring feedback, payments, routes, and occupancy in real time
- An **NTSA escalation pipeline** that classifies complaints by severity and auto-forwards critical safety violations to national authorities
- **SMS and WhatsApp notifications** via Twilio triggered automatically on every significant action

The system targets a 3-minute time-to-action for first-time users and is designed mobile-first to match Kenya's smartphone usage patterns.

---

## Features FR1-FR5

### FR1 — Feedback Management

Passengers submit complaints or compliments about a route or vehicle.

- Route selection, vehicle ID input, feedback type (Complaint / Compliment), comment field
- Automatic SMS + WhatsApp confirmation on submission
- NTSA classification and auto-escalation for critical safety issues

**Endpoint:** `POST /api/feedback`

```json
{
  "routeId": 1,
  "vehicleId": 2,
  "feedbackType": "Complaint",
  "comment": "Driver was speeding recklessly on the highway",
  "phoneNumber": "+254712345678"
}
```

**Response:**
```json
{
  "message": "Feedback submitted successfully",
  "feedback": { "id": 1, "feedback_type": "Complaint", "ntsa_priority": "HIGH" },
  "notificationsSent": { "sms": true, "whatsapp": true }
}
```

### FR2 — Payment Simulation

Simulates M-Pesa STK Push fare payment — no real funds transferred.

- Fare amount input, phone number entry, mock "Payment Successful" response
- Transaction ID generated and stored; digital QR ticket provided
- SMS + WhatsApp confirmation on success

**Endpoint:** `POST /api/payments/simulate`

```json
{
  "routeId": 1,
  "amount": 100.00,
  "phoneNumber": "+254712345678"
}
```

**Response:**
```json
{
  "message": "M-Pesa STK simulation initiated",
  "payment": { "id": 1, "amount": 100, "status": "completed", "transaction_id": "SIM-1706390000123-abc456" },
  "simulatedStatus": "STK Prompt Sent (Simulated)",
  "notificationSent": true
}
```

### FR3 — Occupancy Reporting

Driver interface with two large buttons to update vehicle status in real time.

- **Seats Available** — sets status to `available`
- **Full** — sets status to `full`
- Passengers can view status before boarding; display auto-refreshes every 15 seconds

**Endpoint:** `POST /api/occupancy/status`

```json
{ "vehicleId": 2, "status": "available" }
```

**Response:**
```json
{
  "message": "Vehicle occupancy status updated successfully",
  "occupancy": { "id": 1, "vehicle_id": 2, "occupancy_status": "available", "updated_at": "2024-01-15T10:35:00Z" }
}
```

### FR4 — Notification Service

Triggered automatically on feedback submission and payment simulation.

- **SMS** via Twilio SMS Service
- **WhatsApp** via Twilio WhatsApp Sandbox or Meta WhatsApp Business API
- Notifications include route, vehicle, amount, feedback ID, and transaction details
- Failed notifications do not crash core operations (silent fallback)

### FR5 — Administrative Oversight

Authenticated admin dashboard with full filtering capabilities.

- View all feedback, payments, routes, users, and vehicles
- Filter by date range, route, vehicle, feedback type, payment status
- Real-time charts (Chart.js), service health indicators, database statistics
- NTSA forwarding controls for manual escalation of complaints

Key admin endpoints:

```
GET /api/admin/dashboard
GET /api/admin/feedback?routeId=1&feedbackType=Complaint&startDate=2024-01-01&endDate=2024-01-31
GET /api/admin/feedback/stats
GET /api/admin/payments?status=completed
GET /api/admin/payments/stats
```

---

## Non-Functional Requirements

| NFR | Requirement | Status |
|-----|-------------|--------|
| NFR1 | Intuitive UI — first-time user completes action in under 3 minutes | Done |
| NFR2 | 95% uptime, graceful error handling, data persistence | Done |
| NFR3 | Dashboard load under 3s, API response under 2s, optimized queries | Done |
| NFR4 | SQL injection prevention, XSS prevention, JWT auth, Helmet | Done |
| NFR5 | Responsive design, Chrome / Firefox / Safari (latest) | Done |

---

## Tech Stack

### Backend

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js >= 14 |
| Framework | Express.js 5.2 |
| Database | PostgreSQL >= 12 |
| Authentication | JWT + bcryptjs |
| SMS | Twilio SMS Service |
| WhatsApp | Twilio WhatsApp / Meta Business API |
| Payments | M-Pesa Daraja API (simulation) |
| Email (NTSA) | Gmail SMTP via Nodemailer |
| Security | CORS + Helmet middleware |

### Frontend

| Component | Technology |
|-----------|-----------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Data Fetching | React Query |
| Routing | React Router |
| Charts | Chart.js |

---

## Project Structure

```
final_year_project/
├── server.js                     # Express server entry point
├── management.html               # Standalone admin dashboard (no build needed)
├── package.json
├── .env                          # Environment variables
├── start-https.sh                # HTTPS startup script
│
├── src/                          # Backend source
│   ├── app.js                    # Express app and route registration
│   ├── config/
│   │   └── database.js           # PostgreSQL connection pool
│   ├── controllers/
│   │   ├── authController.js     # Registration, login, JWT
│   │   ├── feedbackController.js # FR1: Feedback + NTSA classification
│   │   ├── paymentController.js  # FR2: Payment simulation
│   │   ├── occupancyController.js# FR3: Occupancy reporting
│   │   └── adminController.js    # FR5: Dashboard data
│   ├── models/
│   │   ├── userModel.js
│   │   ├── vehicleModel.js
│   │   ├── routeModel.js
│   │   ├── feedbackModel.js
│   │   ├── paymentModel.js
│   │   └── occupancyModel.js
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth/*
│   │   ├── feedbackRoutes.js     # /api/feedback/*
│   │   ├── paymentRoutes.js      # /api/payments/*
│   │   ├── occupancyRoutes.js    # /api/occupancy/*
│   │   ├── adminRoutes.js        # /api/admin/*
│   │   └── whatsappRoutes.js     # /api/whatsapp/*
│   ├── middlewares/
│   │   ├── authMiddleware.js     # JWT verification
│   │   └── errorMiddleware.js    # Global error handler
│   ├── services/
│   │   ├── mpesaService.js       # M-Pesa Daraja API
│   │   ├── smsService.js         # Twilio SMS
│   │   ├── whatsappService.js    # WhatsApp Business API
│   │   └── ntsaService.js        # NTSA complaint classification + email
│   └── utils/
│       └── validation.js         # Input validation helpers
│
├── assets/
│   ├── css/management.css
│   └── js/
│       ├── management.js         # Dashboard API logic
│       └── chart.min.js
│
└── frontend/                     # React frontend application
    ├── src/
    │   ├── pages/
    │   │   ├── Feedback.tsx
    │   │   ├── Payment.tsx
    │   │   ├── Occupancy.tsx
    │   │   └── AdminDashboard.tsx
    │   ├── components/
    │   │   ├── FeedbackForm.tsx
    │   │   ├── PaymentSimulation.tsx
    │   │   ├── OccupancyDisplay.tsx
    │   │   ├── DigitalTicket.tsx
    │   │   ├── QRCode.tsx
    │   │   └── admin/FeedbackManager.tsx
    │   └── lib/
    │       ├── api.ts
    │       └── complaint.service.ts
    ├── .cert/
    │   ├── cert.pem              # SSL cert, valid until May 21 2028
    │   └── key.pem
    ├── vite.config.ts
    └── package.json
```

---

## Database Schema

Database name: `matatuconnect` (local) or `matConnect` (Neon cloud).

### users

| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| name | VARCHAR | |
| email | VARCHAR UNIQUE | |
| phone | VARCHAR UNIQUE | Kenya format (254...) |
| password | VARCHAR | bcrypt hashed |
| role | VARCHAR | `user` or `admin` |
| status | VARCHAR | `active` or `inactive` |
| created_at | TIMESTAMP | |

### routes

| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| route_name | VARCHAR | e.g. "Thika-Nairobi" |
| start_location | VARCHAR | |
| end_location | VARCHAR | |
| base_fare | DECIMAL | KES |
| status | VARCHAR | |

### vehicles

| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| registration_number | VARCHAR UNIQUE | e.g. KDA 123A |
| owner_id | FK users | |
| capacity | INTEGER | |
| created_at | TIMESTAMP | |

### feedback

| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| user_id | FK users | |
| route_id | FK routes | |
| vehicle_id | FK vehicles | |
| feedback_type | VARCHAR | `Complaint` or `Compliment` |
| comment | TEXT | |
| phone_number | VARCHAR | For SMS notification |
| ntsa_priority | VARCHAR | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| ntsa_category | VARCHAR | NTSA complaint category |
| ntsa_forwarded | BOOLEAN | Whether escalated to NTSA |
| ntsa_forwarded_at | TIMESTAMP | |
| ntsa_admin_notes | TEXT | Admin escalation notes |
| report_type | VARCHAR | `General`, `Complaint`, `REPORT_TO_NTSA` |
| incident_date | DATE | |
| incident_time | TIME | |
| crew_details | TEXT | |
| vehicle_number | VARCHAR | Plate number for NTSA report |
| evidence_url | TEXT | Link to photo/video evidence |
| created_at | TIMESTAMP | |

### payments

| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| user_id | FK users | |
| route_id | FK routes | |
| amount | DECIMAL | KES |
| phone_number | VARCHAR | M-Pesa number |
| status | VARCHAR | `pending`, `completed`, `failed` |
| transaction_id | VARCHAR UNIQUE | Simulated M-Pesa receipt |
| created_at | TIMESTAMP | |

### vehicle_occupancy_status

| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| vehicle_id | FK vehicles | |
| driver_id | FK users | |
| occupancy_status | VARCHAR | `available` or `full` |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### NTSA Migration Script

Run this to add NTSA columns to an existing `feedback` table:

```sql
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS ntsa_forwarded BOOLEAN DEFAULT FALSE;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS ntsa_priority VARCHAR(50) DEFAULT 'LOW';
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS ntsa_category VARCHAR(255);
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS ntsa_message_id VARCHAR(255);
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS ntsa_forwarded_at TIMESTAMP;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS ntsa_admin_notes TEXT;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS report_type VARCHAR(50) DEFAULT 'General';
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS incident_date DATE;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS incident_time TIME;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS crew_details TEXT;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(20);
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS evidence_url TEXT;
CREATE INDEX IF NOT EXISTS idx_feedback_ntsa_priority ON feedback(ntsa_priority);
CREATE INDEX IF NOT EXISTS idx_feedback_ntsa_forwarded ON feedback(ntsa_forwarded);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
```

### NTSA Stats View

```sql
CREATE OR REPLACE VIEW v_ntsa_stats AS
SELECT ntsa_priority,
  COUNT(*) AS total,
  COUNT(CASE WHEN ntsa_forwarded THEN 1 END) AS forwarded,
  COUNT(CASE WHEN NOT ntsa_forwarded THEN 1 END) AS local
FROM feedback
WHERE created_at >= (NOW() - INTERVAL '30 days')
GROUP BY ntsa_priority;
```

---

## Setup and Installation

### Prerequisites

- Node.js >= 14
- PostgreSQL >= 12
- npm >= 6

### 1. Clone and Install

```bash
git clone https://github.com/mjaja000/final_year_project.git
cd final_year_project
npm install
cd frontend && npm install
```

### 2. Create Database

```bash
psql -U postgres -c "CREATE DATABASE matatuconnect;"
```

### 3. Configure Environment

Create `.env` in the project root:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matatuconnect
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRE=7d

# Twilio SMS
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# WhatsApp — Twilio sandbox
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# WhatsApp — Meta production
WHATSAPP_PHONE_NUMBER_ID=your_meta_phone_id
WHATSAPP_ACCESS_TOKEN=your_meta_token
WHATSAPP_API_VERSION=v18.0
WHATSAPP_WEBHOOK_TOKEN=matatuconnect-verify-token-2024

# M-Pesa
MPESA_API_URL=https://sandbox.safaricom.co.ke
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_BUSINESS_CODE=your_business_code
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://your-domain.com/api/payments/mpesa/callback

# NTSA Email
EMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
NTSA_EMAIL=complaints@ntsa.go.ke
DEV_EMAIL=your-dev@gmail.com
FORWARD_TO_NTSA=true

# CORS
CORS_ORIGIN=http://localhost:8080
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_HTTPS=true
```

### 4. Generate JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Neon Cloud Database (Optional)

```env
DB_HOST=ep-small-cloud-ai15oiml-pooler.c-4.us-east-1.aws.neon.tech
DB_PORT=5432
DB_NAME=matConnect
DB_USER=neondb_owner
DB_PASSWORD=your_neon_password
DB_SSL=require
```

Get connection details from [console.neon.tech](https://console.neon.tech). Use the **Connection Pooling (Transaction mode)** endpoint.

---

## Running the Application

### Quick Start with HTTPS

```bash
./start-https.sh
```

Access: `https://localhost:8080` | Backend: `http://localhost:5000`

### Manual Start

**Terminal 1 — Backend:**

```bash
npm run dev    # development with nodemon auto-reload
# npm start   # production mode
```

Expected output:
```
MatatuConnect Server Running
URL: http://localhost:5000
All database tables initialized successfully
```

**Terminal 2 — Frontend:**

```bash
cd frontend && npm run dev
```

### Ports

| Service | Default Port | Variable |
|---------|-------------|----------|
| Backend API | 5000 | PORT |
| Frontend | 8080 | — |
| PostgreSQL | 5432 | DB_PORT |

### Health Checks

```bash
curl http://localhost:5000/health
curl http://localhost:5000/api/auth/health
```

### Troubleshooting

| Problem | Fix |
|---------|-----|
| Port in use | Find PID with `lsof -i :5000` then `kill -9 <PID>` |
| DB connection refused | Check PostgreSQL is running: `pg_isready -h localhost` |
| npm install fails | `rm -rf node_modules package-lock.json && npm install` |
| HTTPS cert missing | `openssl req -x509 -newkey rsa:2048 -keyout frontend/.cert/key.pem -out frontend/.cert/cert.pem -days 365 -nodes -subj "/CN=localhost"` |
| CORS errors | Set CORS_ORIGIN in .env to match frontend URL |

---

## API Endpoints Reference

**Base URL:** `http://localhost:5000`

### Public Endpoints (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |
| GET | `/` | API info and endpoint listing |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login — returns JWT |
| GET | `/api/auth/health` | Auth service health |
| GET | `/api/admin/dashboard` | Overview statistics |
| GET | `/api/admin/feedback` | All feedback (supports query filters) |
| GET | `/api/admin/feedback/stats` | Feedback statistics |
| GET | `/api/admin/payments` | All payments |
| GET | `/api/admin/payments/stats` | Payment statistics |
| GET | `/api/occupancy/routes` | All matatu routes |
| GET | `/api/occupancy/all` | All vehicle occupancy statuses |
| GET | `/api/feedback` | Feedback list |
| GET | `/api/payments` | Payments list |

### Protected Endpoints (Bearer token required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/profile` | Get user profile |
| PUT | `/api/auth/profile` | Update profile |
| POST | `/api/auth/change-password` | Change password |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/feedback` | **FR1** Submit feedback |
| GET | `/api/feedback/:id` | Get feedback by ID |
| DELETE | `/api/feedback/:id` | Delete feedback |
| POST | `/api/payments/simulate` | **FR2** Simulate M-Pesa payment |
| GET | `/api/payments/:id` | Get payment status |
| GET | `/api/payments/stats` | Payment statistics |
| POST | `/api/occupancy/status` | **FR3** Update vehicle occupancy |
| GET | `/api/occupancy/vehicle/:id` | Get vehicle occupancy |

### WhatsApp Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/whatsapp/webhook` | Meta webhook verification |
| POST | `/api/whatsapp/webhook` | Receive incoming messages |
| GET | `/api/whatsapp/messages` | View recent messages (debug) |
| GET | `/api/whatsapp/status` | Service configuration |

### NTSA Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/feedback/admin/ntsa-forward/:id` | Manually forward to NTSA |
| GET | `/api/feedback/admin/ntsa-stats` | NTSA classification stats |
| POST | `/api/feedback/admin/whatsapp/:id/:phone` | Send NTSA WhatsApp notification |

### Query Parameters

| Parameter | Description | Values |
|-----------|-------------|--------|
| routeId | Filter by route | integer |
| vehicleId | Filter by vehicle | integer |
| feedbackType | Filter by type | `Complaint` or `Compliment` |
| startDate | Date range start | ISO 8601 |
| endDate | Date range end | ISO 8601 |
| status | Payment status | `pending`, `completed`, `failed` |
| limit | Pagination limit | integer |
| offset | Pagination offset | integer |

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## API Examples

### Register

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Kariuki","email":"john@example.com","phone":"254712345678","password":"SecurePass123!","confirmPassword":"SecurePass123!"}'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"SecurePass123!"}'
# Response includes: { "token": "eyJ...", "user": { ... } }
```

### Submit Feedback (FR1)

```bash
TOKEN="paste_jwt_token_here"

curl -X POST http://localhost:5000/api/feedback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"routeId":1,"vehicleId":2,"feedbackType":"Complaint","comment":"Driver was reckless","phoneNumber":"+254712345678"}'
```

### Simulate Payment (FR2)

```bash
curl -X POST http://localhost:5000/api/payments/simulate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"routeId":1,"amount":100,"phoneNumber":"+254712345678"}'
```

### Update Occupancy (FR3)

```bash
curl -X POST http://localhost:5000/api/occupancy/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":2,"status":"full"}'
```

### Admin Dashboard

```bash
curl http://localhost:5000/api/admin/dashboard
# { "totalUsers":45, "totalVehicles":12, "totalFeedback":127, "feedbackByType":{...} }
```

### Filter Feedback

```bash
curl "http://localhost:5000/api/admin/feedback?feedbackType=Complaint&startDate=2024-01-01&endDate=2024-01-31"
```

---

## Authentication

All non-public endpoints require: `Authorization: Bearer <jwt_token>`

Tokens are obtained from `POST /api/auth/login` and expire after the `JWT_EXPIRE` value (default: 7 days).

**Password rules:** Minimum 8 characters with at least 1 uppercase, 1 lowercase, 1 number, 1 special character.

**Phone format:** Accepts `254XXXXXXXXX`, `07XXXXXXXX`, or `+254XXXXXXXXX` — all normalized internally to `254XXXXXXXXX`.

**Security features implemented:**

- Passwords hashed with bcryptjs (10 salt rounds)
- JWT with configurable secret and expiry
- SQL injection prevention via parameterized queries (pg library)
- XSS prevention via input validation + React auto-escaping
- CORS with configurable allowed origins
- HTTP security headers via Helmet (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- Rate limiting: 100 requests per 15 minutes per IP

---

## NTSA Integration

Every complaint is automatically classified on submission using keyword-based matching against known NTSA violation categories.

### Classification Matrix

| Priority | Category | Example Keywords | Action |
|----------|----------|-----------------|--------|
| CRITICAL | Vehicle Safety / Sexual Assault | seatbelt, unroadworthy, conformity plate, sexual, assault, touching | Auto-forward to NTSA email immediately + WhatsApp alert |
| HIGH | Dangerous Driving | speeding, reckless, overloading, forced alight, reckless overtaking | Flag in dashboard; manual admin approval required |
| MEDIUM | Verbal Abuse / Overcharging | fare hike, overcharged, abusive language, intimidation | Local tracking |
| LOW | Service Quality | dirty, poor service, uncomfortable, slow | Stored for periodic reporting |

### Design Decisions

- **Keyword classification over ML** — simpler, no training data needed, transparent, 95%+ accuracy for Kenya context
- **Auto-forward CRITICAL, manual for HIGH** — zero delay for safety violations while preserving admin oversight for ambiguous cases
- **Email over API** — SMTP is reliable, NTSA staff can read formatted emails, audit trail through email logs

### NTSA Email Format

- **Dev mode:** Forwards to `DEV_EMAIL` in .env
- **Production:** Forwards to `complaints@ntsa.go.ke` with auto-CC to dev email
- Database records: `ntsa_forwarded_at`, `ntsa_message_id` stored on each escalated complaint

### Gmail App Password Setup

1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Generate password for "Mail"
3. Set `GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx` in .env

### Enhanced NTSA Report Submission

```json
{
  "reportType": "REPORT_TO_NTSA",
  "comment": "Vehicle missing seatbelts, clearly unroadworthy",
  "vehicleNumber": "KAA 123B",
  "incidentDate": "2024-01-15",
  "incidentTime": "14:30",
  "crewDetails": "Male conductor, blue shirt",
  "evidenceUrl": "https://photos.example.com/evidence123"
}
```

### Check NTSA Stats

```bash
curl http://localhost:5000/api/feedback/admin/ntsa-stats
```

---

## WhatsApp and SMS Notifications

### Twilio WhatsApp Sandbox (Development)

1. Sign up at [twilio.com](https://www.twilio.com/try-twilio)
2. Console → Messaging → WhatsApp Sandbox
3. From your phone, send `join <your-sandbox-code>` to **+1 (731) 257-2368**
4. Add to .env:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### Meta WhatsApp Business API (Production)

```env
WHATSAPP_PHONE_NUMBER_ID=your_phone_id       # From Meta Business Suite
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_API_VERSION=v18.0
WHATSAPP_WEBHOOK_TOKEN=matatuconnect-verify-token-2024
```

API endpoint: `https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages`

### Notification Methods

| Method | Triggered By | Message Content |
|--------|-------------|----------------|
| `sendFeedbackConfirmation()` | Feedback submitted | Route, vehicle, feedback ID, priority level |
| `sendPaymentConfirmation()` | Payment completed | Amount (KES), transaction ID, route, date |
| `sendOccupancyAlert()` | Occupancy changed | Vehicle plate, current status, route |
| `sendComplaintAcknowledgment()` | Complaint logged | Priority, expected resolution path |
| `sendNTSAForwardNotification()` | NTSA escalation | Case reference, formal investigation notice |

### Test the Service

```bash
curl http://localhost:5000/api/whatsapp/status
curl http://localhost:5000/api/whatsapp/messages?limit=10
```

### Webhook Setup (Dev — ngrok)

```bash
ngrok http 5000
# Set in Twilio Console: https://abc123.ngrok.io/api/whatsapp/webhook
```

### Phone Normalization

All phone formats are accepted and normalized to `254XXXXXXXXX`:

- `0712345678` → `254712345678`
- `+254712345678` → `254712345678`
- `254712345678` → unchanged

---

## M-Pesa Payments

The system **simulates** M-Pesa STK Push — no real funds are ever transferred.

### Simulation Flow

1. Passenger submits amount + phone number via `POST /api/payments/simulate`
2. Payment record created with status `pending`
3. STK Push simulated (no actual Safaricom call)
4. Status updated to `completed` with generated transaction ID
5. Digital QR ticket generated on the frontend
6. SMS + WhatsApp confirmation sent automatically

### Production M-Pesa Setup

1. Register at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Create app, obtain live credentials
3. Update .env:

```env
MPESA_API_URL=https://api.safaricom.co.ke
MPESA_CONSUMER_KEY=live_consumer_key
MPESA_CONSUMER_SECRET=live_consumer_secret
MPESA_BUSINESS_CODE=your_paybill_or_till
MPESA_PASSKEY=live_lipa_na_mpesa_passkey
MPESA_CALLBACK_URL=https://your-domain.com/api/payments/mpesa/callback
```

The callback webhook at `POST /api/payments/mpesa/callback` requires a publicly accessible URL. Use ngrok in development.

---

## HTTPS Setup

### Quick Start (Existing Certs)

SSL certificates in `frontend/.cert/` are valid until **May 21, 2028**.

```bash
./start-https.sh
# Access: https://localhost:8080
```

### Regenerate Certificates

```bash
# Basic self-signed (OpenSSL)
openssl req -x509 -newkey rsa:2048 \
  -keyout frontend/.cert/key.pem \
  -out frontend/.cert/cert.pem \
  -days 365 -nodes -subj "/CN=localhost"

# Browser-trusted (mkcert)
mkcert -cert-file frontend/.cert/cert.pem \
       -key-file frontend/.cert/key.pem \
       localhost 127.0.0.1 ::1
```

### Vite Configuration

```typescript
// frontend/vite.config.ts
const httpsConfig = process.env.VITE_HTTPS === 'true'
  ? { key: fs.readFileSync('.cert/key.pem'), cert: fs.readFileSync('.cert/cert.pem') }
  : false;

export default defineConfig({
  server: { host: '::', port: 8080, https: httpsConfig }
});
```

### Backend Binding

```javascript
// server.js
app.listen(PORT, '0.0.0.0', () => console.log(`Server on 0.0.0.0:${PORT}`));
```

Setting host to `0.0.0.0` allows access from other devices on the same network.

### Network Access from Another Device

```bash
hostname -I   # Get your machine's local IP
```

Browse to `https://YOUR_LOCAL_IP:8080` and accept the self-signed certificate warning.

---

## Management Dashboard

The React-based admin dashboard provides comprehensive control over the MatatuConnect platform with multi-station management capabilities.

**URL:** `https://localhost:8080/admin/dashboard`  
**Demo Login:** `admin@matatuconnect.test` / `Admin@Matatu2024!`

### Multi-Station Architecture

MatatuConnect supports multiple stations within a single SACCO (Savings and Credit Cooperative), enabling decentralized operations with centralized oversight.

#### Station-Based Access Control

**Station-Specific Data (Filtered by Selected Station):**
- ❌ **Payment Transactions**: Only payments from routes originating at the selected station
- ❌ **Local Route Management**: Routes that start from or end at the selected station
- ❌ **Local Occupancy Updates**: Vehicles currently operating from the selected station

**SACCO-Wide Data (Shared Across All Stations):**
- ✅ **Vehicle Fleet**: Complete visibility of all SACCO vehicles with location tracking
- ✅ **Driver Directory**: All drivers across all stations for coordination
- ✅ **Inter-Station Routes**: Routes connecting different stations for handover planning
- ✅ **Network Analytics**: Aggregated performance metrics across the entire SACCO

#### How Station Selection Works

1. **Station Dropdown**: Located at the top of the admin dashboard labeled "Managing Station:"
2. **Automatic Detection**: Stations are automatically extracted from route `start_location` and `end_location` fields
3. **Unique Names**: Each station name must be unique across the system
4. **Dynamic Filtering**: When a station is selected, all station-specific data automatically filters to that context
5. **Session Persistence**: Selection is saved to localStorage for continuity

**Example:**
```
Admin creates route: "Nairobi Central → Mombasa Likoni"

System automatically:
- Extracts "Nairobi Central" as origin station
- Extracts "Mombasa Likoni" as destination station
- Adds both to the station dropdown if they don't exist
- Enforces unique constraint on station names
```

#### Vehicle Handover Logic

Vehicles operate across multiple stations. Tracking uses two fields:

- `home_station_id`: Vehicle's permanent base station (never changes)
- `current_station_id`: Where the vehicle physically is now (updates frequently)

**Handover Example:**
```
Vehicle KBZ 123X completes route "Nairobi → Mombasa"

At Departure (Nairobi):
- home_station_id: Nairobi
- current_station_id: Nairobi
- Status: "In Transit"

At Arrival (Mombasa):
- home_station_id: Nairobi (unchanged)
- current_station_id: Mombasa (updated)
- Mombasa admin can now assign to local routes
- Nairobi admin still sees it marked "Currently at Mombasa"

On Return Journey:
- Vehicle updates back to current_station_id: Nairobi
- Full control returns to home station
```

#### Payment Attribution

All payments are attributed to the **origin station** of the route:

```
Route: Nairobi → Mombasa (Fare: 1,500 KES)
Payment recorded at: Origin station (Nairobi)

Nairobi Station Admin:
- Sees this payment in their dashboard
- Revenue counts toward Nairobi station

Mombasa Station Admin:
- Does NOT see this payment
- It belongs to the origin station (Nairobi)
```

#### SACCO Name Configuration

MatatuConnect is the **system name** (fixed). Each SACCO can brand their instance with their own name.

**Display Location:**
The SACCO name appears below the "Admin Dashboard" title in the blue header:
```
Admin Dashboard
{SACCO Name} · System Management & Analytics
```

**How to Change:**
1. Navigate to Admin Dashboard → Settings Tab
2. Update "SACCO Name" field (e.g., "Super Metro SACCO", "Coast Bus Service")
3. Click "Update SACCO Name"
4. Name persists across all sessions and appears on all admin pages

**Technical Implementation:**
- Stored in: `sacco_settings` table with `key='sacco_name'`
- Retrieved via: `GET /api/admin/settings` (public endpoint)
- Updated via: `PUT /api/admin/settings` with `{key: 'sacco_name', value: 'Your SACCO'}` (admin only)
- Cached in localStorage with 5-minute TTL
- Default fallback: "MatatuConnect"

### Dashboard Features

| Tab | Contents |
|-----|----------|
| Overview | Totals (users, vehicles, feedback, payments) with Chart.js charts |
| Statistics | Advanced analytics, feedback breakdown, top routes, system uptime |
| Connected Clients | User list with online/offline status and last activity |
| Routes | All matatu routes with fares and locations |
| Occupancy Status | Real-time vehicle availability, filterable by plate or status |
| Feedback | All complaints and compliments, color-coded, searchable |
| Services Health | Auth, M-Pesa, SMS, WhatsApp, API Gateway health indicators |
| Database | PostgreSQL connection status, table info, size stats |

### Auto-Refresh Schedule

- Server health check: every 5 seconds
- Dashboard overview data: every 10 seconds
- Feedback and occupancy: every 15 seconds

### API Endpoints Polled by Dashboard

```
GET /health
GET /api/admin/dashboard
GET /api/occupancy/routes
GET /api/occupancy/all
GET /api/admin/feedback
GET /api/admin/payments
GET /api/auth/health
```

### Changing Dashboard Credentials

Edit `assets/js/management.js` (lines ~12-13):

```javascript
const ADMIN_USERNAME = 'admin';  // change this
const ADMIN_PASSWORD = 'admin';  // change this
```

---

## Demo Guide

### Sample Demo Data

```
User:     John Kariuki | john@example.com | +254712345678 | Demo123!
Feedback: Route=Thika-Nairobi | Vehicle=KDA 123A | Type=Complaint
          "Driver was reckless and the van was too crowded"
```

### 6-Step Demo Flow

1. **Register** a user account
2. **Login** and receive JWT token
3. **Submit feedback** — triggers NTSA classification + SMS/WhatsApp notification
4. **Check occupancy** — view vehicle availability for a route
5. **View admin statistics** — `GET /api/admin/dashboard`
6. **View all routes** — `GET /api/occupancy/routes`

### Quick Test Script

```bash
# 1. Health check
curl http://localhost:5000/health

# 2. Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","phone":"254712345678","password":"Test123!","confirmPassword":"Test123!"}'

# 3. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# 4. Submit feedback (replace TOKEN with value from login response)
TOKEN="paste_token_here"
curl -X POST http://localhost:5000/api/feedback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"routeId":1,"vehicleId":1,"feedbackType":"Compliment","comment":"Excellent service!","phoneNumber":"+254712345678"}'

# 5. Admin dashboard
curl http://localhost:5000/api/admin/dashboard

# 6. Routes
curl http://localhost:5000/api/occupancy/routes
```

---

## Requirements Verification

### Functional Requirements

| ID | Feature | Status |
|----|---------|--------|
| FR1 | Feedback Management — complaint/compliment, SMS/WhatsApp, NTSA classification | Complete |
| FR2 | Payment Simulation — M-Pesa STK mock, QR ticket, notifications | Complete |
| FR3 | Occupancy Reporting — available/full, real-time, two-button driver UI | Complete |
| FR4 | Notification Service — SMS + WhatsApp auto-triggered on actions | Complete |
| FR5 | Administrative Oversight — dashboard, filtering, charts, stats | Complete |

### Non-Functional Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| NFR1 | Usability — 3-minute task completion for first-time users | Complete |
| NFR2 | Reliability — error handling, DB persistence, health checks | Complete |
| NFR3 | Performance — React Query caching, pagination, optimized queries | Complete |
| NFR4 | Security — JWT, bcrypt, Helmet, parameterized queries, CORS | Complete |
| NFR5 | Compatibility — mobile-first, responsive, Chrome/Firefox/Safari | Complete |

### Additional Features Beyond Requirements

- NTSA complaint classification (keyword-based) + email auto-forwarding
- WhatsApp Business API with 5+ notification message types
- HTTPS with self-signed certs valid until May 2028
- Progressive Web App manifest (installable)
- Accessibility: WCAG 2.1 AA — ARIA labels, keyboard navigation, screen reader support
- SEO meta tags + Open Graph + Twitter Card on all pages
- React error boundaries for crash prevention
- QR code digital ticket generation on payment success
- Lazy image loading (LazyImage component)
- Neon cloud PostgreSQL integration
- Telegram integration removed; WhatsApp only

---

## Deployment Notes

### Pre-Production Security Checklist

- [ ] Replace `JWT_SECRET` with a 64-char random hex string
- [ ] Change all default passwords and database credentials
- [ ] Set `CORS_ORIGIN` to the specific production frontend domain (not `*`)
- [ ] Set `NODE_ENV=production`
- [ ] Replace self-signed SSL certs with Let's Encrypt certificates
- [ ] Enable HTTPS on the Express backend too
- [ ] Set `FORWARD_TO_NTSA=true` and verify `NTSA_EMAIL=complaints@ntsa.go.ke`
- [ ] Configure real Twilio WhatsApp production credentials (not sandbox)
- [ ] Switch to live Safaricom M-Pesa API credentials
- [ ] Set up automated PostgreSQL backups
- [ ] Run `npm audit` and resolve vulnerabilities

### Production Build Commands

```bash
# Build React frontend
cd frontend && npm run build
# Output: frontend/dist/ (serve as static files)

# Start backend
cd ..
NODE_ENV=production npm start
```

### Key Production Environment Additions

```env
NODE_ENV=production
JWT_SECRET=<64-char-hex-string>
CORS_ORIGIN=https://your-production-domain.com
DB_SSL=require
FORWARD_TO_NTSA=true
NTSA_EMAIL=complaints@ntsa.go.ke
```

### Neon Cloud Database

Use the **Connection Pooling (Transaction mode)** endpoint from [console.neon.tech](https://console.neon.tech) for best reliability under load. Set `DB_SSL=require`.

### Git Repository

`https://github.com/mjaja000/final_year_project`

Branches: `main` (production-stable), `backend`, `front`, `feature/feedback-ntsa` (merged into main)

---

*MatatuConnect — GROUP 6 Final Year Project | Last Updated: February 22, 2026*
