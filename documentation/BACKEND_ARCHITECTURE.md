# MatatuConnect Backend Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React Frontend)                   │
│                      http://localhost:3000                       │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                    HTTP/HTTPS (REST API calls)
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS SERVER (Backend)                       │
│                    http://localhost:5000                         │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Middleware Layer                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │ │
│  │  │ authMiddleware│  │errorMiddleware│  │ CORS/Helmet    │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Routes Layer                            │ │
│  │                                                            │ │
│  │  ┌──────────────┐  ┌────────────┐  ┌──────────────────┐  │ │
│  │  │  Auth Routes  │  │Feedback    │  │Payment Routes   │  │ │
│  │  │  /api/auth/*  │  │Routes      │  │/api/payments/*  │  │ │
│  │  │               │  │/api/...    │  │                 │  │ │
│  │  └──────────────┘  └────────────┘  └──────────────────┘  │ │
│  │                                                            │ │
│  │  ┌──────────────────┐  ┌────────────────────────────┐    │ │
│  │  │Occupancy Routes  │  │Admin Routes                │    │ │
│  │  │/api/occupancy/*  │  │/api/admin/* (Dashboard)   │    │ │
│  │  └──────────────────┘  └────────────────────────────┘    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  Controllers Layer                         │ │
│  │                                                            │ │
│  │  ┌──────────┐  ┌──────────────┐  ┌─────────────────┐    │ │
│  │  │Auth       │  │Feedback      │  │Payment         │    │ │
│  │  │Controller │  │Controller    │  │Controller      │    │ │
│  │  │           │  │(FR1)         │  │(FR2)           │    │ │
│  │  └──────────┘  └──────────────┘  └─────────────────┘    │ │
│  │                                                            │ │
│  │  ┌──────────────────┐  ┌──────────────────────────┐      │ │
│  │  │Occupancy         │  │Admin                     │      │ │
│  │  │Controller        │  │Controller                │      │ │
│  │  │(FR3)             │  │(FR5 - Dashboard)         │      │ │
│  │  └──────────────────┘  └──────────────────────────┘      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                 Services Layer                             │ │
│  │            (External API Integrations)                     │ │
│  │                                                            │ │
│  │  ┌──────────────────┐  ┌────────────────────────────┐    │ │
│  │  │M-Pesa Service    │  │SMS Service                 │    │ │
│  │  │(Daraja API)      │  │(Africa's Talking)          │    │ │
│  │  │- getAccessToken()│  │- formatPhoneNumber()       │    │ │
│  │  │- initiatePayment │  │- sendSms()                 │    │ │
│  │  └──────────────────┘  └────────────────────────────┘    │ │
│  │                                                            │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │WhatsApp Service (Meta Business API)                │  │ │
│  │  │- sendMessage() - sendFeedbackConfirmation()        │  │ │
│  │  │- sendPaymentNotification() - sendOccupancyAlert()  │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  Models Layer                              │ │
│  │         (Database Interaction & Business Logic)            │ │
│  │                                                            │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐           │ │
│  │  │User      │  │Route     │  │Vehicle       │           │ │
│  │  │Model     │  │Model     │  │Model         │           │ │
│  │  └──────────┘  └──────────┘  └──────────────┘           │ │
│  │                                                            │ │
│  │  ┌──────────────┐  ┌─────────────┐  ┌────────────────┐  │ │
│  │  │Feedback      │  │Payment      │  │Occupancy       │  │ │
│  │  │Model (FR1)   │  │Model (FR2)  │  │Model (FR3)     │  │ │
│  │  │              │  │             │  │                │  │ │
│  │  └──────────────┘  └─────────────┘  └────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Utilities & Middleware                        │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │validation.js                                         │ │ │
│  │  │- validateEmail() - validatePhoneNumber()             │ │ │
│  │  │- validatePassword() - sanitizeInput()                │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────┬────────────────────────────────┘
                                 │
                   Database Connection (pg library)
                                 │
                                 ▼
         ┌──────────────────────────────────────────┐
         │   PostgreSQL Database (matatuconnect)    │
         │                                          │
         │  ┌──────────────────────────────────┐  │
         │  │ Tables:                          │  │
         │  │ • users                          │  │
         │  │ • routes                         │  │
         │  │ • vehicles                       │  │
         │  │ • feedback           (FR1)       │  │
         │  │ • payments           (FR2)       │  │
         │  │ • vehicle_occupancy  (FR3)       │  │
         │  └──────────────────────────────────┘  │
         └──────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### FR1: Feedback Submission Flow

```
┌─────────────────┐
│ Passenger       │
│ Submits Form    │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────┐
│ POST /api/feedback           │
│ {routeId, vehicleId,         │
│  feedbackType, comment}      │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ FeedbackController           │
│ - Validate inputs            │
│ - Check feedback type        │
│   (Complaint/Compliment)     │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ FeedbackModel.submitFeedback │
│ - Insert into database       │
│ - Return feedback record     │
└────────┬─────────────────────┘
         │
         ├─────────────────────────────────┐
         │                                 │
         ▼                                 ▼
┌─────────────────┐          ┌──────────────────────┐
│ Save in DB      │          │ Trigger Notifications│
│ (feedback table)│          │                      │
└─────────────────┘          │ ┌────────────────┐  │
                             │ │ SmsService     │  │
                             │ │ Send SMS       │  │
                             │ └────────────────┘  │
                             │                      │
                             │ ┌────────────────┐  │
                             │ │WhatsAppService │  │
                             │ │ Send WhatsApp  │  │
                             │ └────────────────┘  │
                             └──────────────────────┘
         │
         └─────────────────────────────────┐
         │                                 │
         ▼                                 ▼
    ┌─────────┐                   ┌────────────────┐
    │ 200 OK  │                   │ Notifications  │
    │ Response│                   │ Sent (SMS/WA)  │
    └─────────┘                   └────────────────┘
```

### FR2: Payment Simulation Flow

```
┌──────────────────────────┐
│ Passenger Initiates      │
│ Payment                  │
└────────┬─────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ POST /api/payments/simulate │
│ {routeId, amount,           │
│  phoneNumber}               │
└────────┬────────────────────┘
         │
         ▼
┌────────────────────────────┐
│ PaymentController          │
│ - Validate amount > 0      │
│ - Create payment record    │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ PaymentModel.initiatePayment
│ - Insert pending payment   │
└────────┬───────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ MpesaService.initiatePayment()  │
│ - Get access token               │
│ - Call Daraja API (Sandbox)      │
│ - Simulate STK Push              │
└────────┬─────────────────────────┘
         │
         ├─────────────────────────┐
         │                         │
         ▼                         ▼
    ┌──────────────────┐     ┌──────────────────┐
    │ API Response     │     │ 2-Second Delay   │
    │ (Mocked)         │     │ Simulates User   │
    │                  │     │ Interaction      │
    └────────┬─────────┘     └────────┬─────────┘
             │                       │
             └───────────┬───────────┘
                         │
                         ▼
            ┌──────────────────────────────┐
            │ PaymentModel.updatePaymentStatus
            │ - Set status = 'completed'   │
            │ - Set transaction_id         │
            └────────┬─────────────────────┘
                     │
                     ├──────────────────────┐
                     │                      │
                     ▼                      ▼
             ┌──────────────┐     ┌──────────────────────┐
             │ Update DB    │     │ Send Notifications   │
             │              │     │                      │
             │              │     │ SmsService.send()    │
             │              │     │ WhatsAppService.send │
             │              │     │ with amount & TX ID  │
             └──────────────┘     └──────────────────────┘
                     │
                     └──────────────┬──────────────┐
                                    │              │
                                    ▼              ▼
                              ┌──────────┐    ┌─────────┐
                              │ SMS Sent │    │ WA Sent │
                              └──────────┘    └─────────┘
                                    │              │
                                    └──────┬───────┘
                                           │
                                           ▼
                                    ┌──────────────┐
                                    │ 201 Response │
                                    │ with payment │
                                    │ details      │
                                    └──────────────┘
```

### FR3: Occupancy Status Update Flow

```
┌──────────────┐
│ Driver Taps  │
│ Button       │
│ (Avail/Full)│
└────────┬─────┘
         │
         ▼
┌──────────────────────────────────┐
│ POST /api/occupancy/status       │
│ {vehicleId, status}              │
│ status = 'available' | 'full'    │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ OccupancyController          │
│ - Validate status            │
│ - Verify vehicle ownership   │
└────────┬─────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ OccupancyModel.updateOccupancyStatus
│ - Use PostgreSQL UPSERT            │
│ - Insert if new, Update if exists  │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Database Updated         │
│ vehicle_occupancy table  │
└────────┬─────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 200 JSON Response       │
│ with updated status     │
│ and timestamp           │
└─────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Frontend Updates             │
│ Shows vehicle availability   │
│ for passengers at stop       │
└──────────────────────────────┘
```

### FR5: Admin Dashboard Query Flow

```
┌──────────────┐
│ Admin User   │
│ Logs In      │
└────────┬─────┘
         │
         ▼
┌─────────────────────────┐
│ GET /api/admin/dashboard│
│ (With JWT Token)        │
└────────┬────────────────┘
         │
         ▼
┌──────────────────────────┐
│ authMiddleware           │
│ - Verify JWT token       │
│ - Extract admin ID       │
└────────┬─────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ AdminController                │
│ - getDashboardOverview()       │
└────────┬───────────────────────┘
         │
         ├─────────────────────────────┬──────────────────────┐
         │                             │                      │
         ▼                             ▼                      ▼
    ┌──────────────┐          ┌──────────────┐      ┌──────────────┐
    │FeedbackModel │          │PaymentModel  │      │UserModel     │
    │getFeedback   │          │getPaymentStats      │getAllUsers   │
    │Stats()       │          │()             │      │()            │
    └──────┬───────┘          └──────┬───────┘      └──────┬───────┘
           │                         │                     │
           └─────────────────────┬───┴─────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
        ┌─────────────────────┐    ┌──────────────────────┐
        │ Query Results from  │    │ Data Aggregation     │
        │ Database            │    │ Processing           │
        │                     │    │                      │
        │ - Total Feedback    │    │ - Combine stats      │
        │ - Complaints Count  │    │ - Calculate totals   │
        │ - Compliments Count │    │ - Format JSON        │
        │ - Total Payments    │    │                      │
        │ - Success/Failed    │    │                      │
        │ - Total Users       │    │                      │
        └─────────────────────┘    └──────────────────────┘
                    │                         │
                    └─────────────┬───────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │ 200 JSON Response        │
                    │ Dashboard Data:          │
                    │ {                        │
                    │  totalUsers,             │
                    │  feedbackStats,          │
                    │  paymentStats            │
                    │ }                        │
                    └──────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │ Admin Dashboard Renders  │
                    │ Charts & Statistics      │
                    │ Real-time Insights       │
                    └──────────────────────────┘
```

---

## Technology Stack

### Frontend
- React.js with TypeScript
- (To be implemented by frontend team)

### Backend
```
├── Runtime: Node.js 14+
├── Framework: Express.js 5.2.1
├── Authentication: JWT (jsonwebtoken)
├── Password Security: bcryptjs
├── HTTP Client: axios (for external APIs)
├── Request Parsing: express.json/urlencoded
├── Security: helmet, cors
│
├── Database
│   └── PostgreSQL 12+
│   └── pg client 8.17.1
│
├── External Services
│   ├── M-Pesa Daraja (Safaricom) - Payment Simulation
│   ├── Africa's Talking - SMS Notifications
│   └── Meta WhatsApp Business API - WhatsApp Notifications
│
└── Development Tools
    ├── nodemon - Auto-reload
    ├── jest - Unit testing
    └── supertest - API testing
```

---

## API Endpoints Summary

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| **AUTH** |
| POST | /api/auth/register | Create new user | No |
| POST | /api/auth/login | Authenticate user | No |
| GET | /api/auth/profile | Get user profile | Yes |
| PUT | /api/auth/profile | Update profile | Yes |
| POST | /api/auth/change-password | Change password | Yes |
| **FEEDBACK (FR1)** |
| POST | /api/feedback | Submit feedback | Yes |
| GET | /api/feedback | Get user feedback | Yes |
| GET | /api/feedback/:id | Get specific feedback | Yes |
| DELETE | /api/feedback/:id | Delete feedback | Yes |
| **PAYMENTS (FR2)** |
| POST | /api/payments/simulate | Simulate payment | Yes |
| GET | /api/payments | Get user payments | Yes |
| GET | /api/payments/:id | Get payment status | Yes |
| GET | /api/payments/stats | Payment stats | Yes |
| **OCCUPANCY (FR3)** |
| POST | /api/occupancy/status | Update occupancy | Yes |
| GET | /api/occupancy/:id | Get vehicle occupancy | Yes |
| GET | /api/occupancy | Get all occupancy | Yes |
| **ADMIN (FR5)** |
| GET | /api/admin/dashboard | Dashboard overview | Yes |
| GET | /api/admin/feedback | All feedback | Yes |
| GET | /api/admin/feedback/stats | Feedback stats | Yes |
| GET | /api/admin/payments | All payments | Yes |
| GET | /api/admin/payments/stats | Payment stats | Yes |

---

## Database Schema Relationships

```
users (1) ──────┬────── (∞) vehicles
               │
               ├────── (∞) feedback
               │
               ├────── (∞) payments
               │
               └────── (∞) vehicle_occupancy

vehicles (1) ──┬────── (∞) feedback
              │
              └────── (1) vehicle_occupancy

routes (1) ────┬────── (∞) feedback
              │
              └────── (∞) payments
```

---

## Deployment Architecture

```
┌──────────────────────────────────────────────────┐
│         GitHub Repository (Code)                 │
│  https://github.com/mjaja000/final_year_project │
└────────────────────┬─────────────────────────────┘
                     │
                     │ (Git Push)
                     │
                     ▼
        ┌────────────────────────────┐
        │ Hosting Platform           │
        │ (Render/Heroku/Railway)    │
        │                            │
        │ ┌──────────────────────┐  │
        │ │ Node.js App          │  │
        │ │ Express Server       │  │
        │ │ Port 5000            │  │
        │ └──────────────────────┘  │
        │                            │
        │ ┌──────────────────────┐  │
        │ │ Environment Variables │  │
        │ │ (Secrets)            │  │
        │ └──────────────────────┘  │
        └────────┬─────────────────┘
                 │
                 ├──────────────────────┐
                 │                      │
                 ▼                      ▼
        ┌────────────────┐    ┌──────────────────┐
        │ PostgreSQL DB  │    │ External APIs    │
        │ (Cloud hosted) │    │ - M-Pesa Daraja │
        │                │    │ - Africa's Talking
        │ (AWS RDS,      │    │ - Meta WhatsApp  │
        │  Heroku DB,    │    └──────────────────┘
        │  etc.)         │
        └────────────────┘
```

---

**Architecture Diagram Last Updated:** January 16, 2026
