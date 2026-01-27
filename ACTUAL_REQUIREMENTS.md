# Transportation/Matatu Feedback System - Backend

This is the actual backend implementation for a **transportation/matatu feedback system**, NOT a parking system.

## Overview

The system allows passengers to submit feedback about transportation routes, drivers to report vehicle occupancy status, and provide payment simulation capabilities.

## Functional Requirements (FR)

### FR1: Feedback Management

- Route selection dropdown
- Vehicle ID input
- Feedback type: **Complaint** or **Compliment**
- Comment/description text field
- Submit feedback endpoint: `POST /api/feedback`

**Endpoint:**

```
POST /api/feedback
Content-Type: application/json
Authorization: Bearer {token}

{
  "routeId": 1,
  "vehicleId": 2,
  "feedbackType": "Complaint",
  "comment": "Driver was rude",
  "phoneNumber": "+254712345678"
}

Response:
{
  "message": "Feedback submitted successfully",
  "feedback": { ... },
  "notificationSent": true
}
```

### FR2: Payment Simulation

- Fare amount input
- Simulate M-Pesa STK Push (no real funds transferred)
- Mock "Payment Successful" response
- Endpoint: `POST /api/payments/simulate`

**Endpoint:**

```
POST /api/payments/simulate
Content-Type: application/json
Authorization: Bearer {token}

{
  "routeId": 1,
  "amount": 100.00,
  "phoneNumber": "+254712345678"
}

Response:
{
  "message": "M-Pesa STK simulation initiated",
  "payment": { ... },
  "simulatedStatus": "STK Prompt Sent (Simulated)",
  "notificationSent": true
}
```

### FR3: Occupancy Reporting

- Driver interface with two buttons:
  - "Seats Available" → status = "available"
  - "Full" → status = "full"
- Updates vehicle occupancy status
- Endpoint: `POST /api/occupancy/status`

**Endpoint:**

POST /api/occupancy/status
Content-Type: application/json
Authorization: Bearer {token}

{
  "vehicleId": 2,
  "status": "available"
}

Response:
{
  "message": "Vehicle occupancy status updated successfully",
  "occupancy": {
    "id": 1,
    "vehicle_id": 2,
    "driver_id": 5,
    "occupancy_status": "available",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:35:00Z"
  }
}

### FR4: Notification Service

- SMS confirmation on feedback submission
- SMS confirmation on payment simulation
- WhatsApp notifications (ready for integration)
- Automatic notifications via Twilio SMS Service

**Triggered on:**

- Successful feedback submission
- Successful payment simulation

### FR5: Administrative Oversight

- Authenticated admin dashboard
- View all feedback with statistics
- View all payments with statistics
- Filter by:
  - **Date range** (startDate, endDate)
  - **Route** (routeId)
  - **Vehicle** (vehicleId)
  - **Feedback type** (feedbackType: Complaint/Compliment)
  - **Payment status** (status: pending/completed/failed)

**Endpoints:**

GET /api/admin/dashboard
GET /api/admin/feedback?routeId=1&startDate=2024-01-01&endDate=2024-01-31&feedbackType=Complaint
GET /api/admin/feedback/stats
GET /api/admin/payments?routeId=1&status=completed&startDate=2024-01-01&endDate=2024-01-31
GET /api/admin/payments/stats

## Non-Functional Requirements (NFR)

### NFR1: Usability

- Intuitive UI design
- 3-minute target for first-time user to:
  - Submit feedback, OR
  - Check occupancy, OR
  - Check payment status

### NFR2: Reliability/Availability

- 95% uptime target during testing period
- Graceful error handling
- Data persistence via PostgreSQL

### NFR3: Performance

- Dashboard load time: < 3 seconds on 3G
- API response time: < 2 seconds
- Optimized queries with filtering support

### NFR4: Security

- SQL injection prevention via parameterized queries
- XSS prevention via input validation
- Hashed admin credentials (bcryptjs)
- JWT authentication for protected routes
- CORS enabled with Helmet middleware

### NFR5: Compatibility

- Responsive design (mobile-first)
- Support for:
  - Chrome (latest versions)
  - Firefox (latest versions)
  - Safari (latest versions)
- Works on mobile and desktop

## Technology Stack

### Backend

- **Runtime:** Node.js
- **Framework:** Express.js 5.2
- **Database:** PostgreSQL 12+
- **Authentication:** JWT + bcryptjs
- **Notifications:** Twilio SMS Service
- **Security:** CORS + Helmet middleware

### Database Schema

#### Users Table

- Stores passenger and driver information
- Fields: id, name, email, phone, password (hashed), role, created_at

#### Routes Table

- Transportation routes (matatu routes)
- Fields: id, route_name, start_location, end_location, base_fare, status, created_at

#### Vehicles Table

- Registered vehicles (matatus)
- Fields: id, registration_number, owner_id, capacity, created_at

#### Occupancy Table

- Vehicle occupancy status (simple: available/full)
- Fields: id, vehicle_id, driver_id, occupancy_status, created_at, updated_at

#### Feedback Table

- Customer feedback on routes/vehicles
- Fields: id, user_id, route_id, vehicle_id, feedback_type (Complaint/Compliment), comment, created_at

#### Payments Table

- Simulated payment records
- Fields: id, user_id, route_id, amount, phone_number, status, transaction_id, created_at

## API Response Format

All endpoints return JSON with consistent structure:

```json
{
  "message": "Operation description",
  "data": {},
  "filters": {},
  "statistics": {},
  "error": "Error message if applicable"
}
```

## Authentication

All endpoints (except `/api/auth/register` and `/api/auth/login`) require:

Authorization: Bearer {JWT_TOKEN}

## Error Handling

- **400:** Bad Request (missing/invalid parameters)
- **401:** Unauthorized (missing/invalid token)
- **403:** Forbidden (insufficient permissions)
- **404:** Not Found (resource doesn't exist)
- **500:** Server Error (internal error)

## Models & Controllers

### Models

- **UserModel:** Authentication & user management
- **VehicleModel:** Vehicle registration
- **RouteModel:** Transportation routes
- **FeedbackModel:** Feedback with filtering by route, vehicle, type, date
- **PaymentModel:** Payment simulation records with filtering
- **OccupancyModel:** Simple occupancy status (available/full)

### Controllers

- **AuthController:** Register, login, token refresh
- **FeedbackController:** Submit, retrieve, filter feedback (FR1)
- **PaymentController:** Simulate M-Pesa, check status (FR2)
- **OccupancyController:** Update/retrieve occupancy status (FR3)
- **AdminController:** Dashboard, filtering, statistics (FR5)

## Removed Components

The following parking-specific features were **removed** as they are not in the actual requirements:

- Complex parking entry/exit tracking
- Parking lot management
- Duration calculation
- Revenue analytics
- Real M-Pesa integration
- M-Pesa callback webhooks
- Parking statistics

## Next Steps

1. Build frontend UI (React/Vue.js) for:
   - Feedback submission form
   - Occupancy status buttons
   - Payment simulation interface
   - Admin dashboard with filters

2. Deploy to production with:
   - Proper Twilio credentials
   - PostgreSQL database setup
   - JWT secret management
   - HTTPS/SSL configuration

3. Testing:
   - Integration tests for all 5 functional requirements
   - Load testing for performance (NFR3)
   - Security penetration testing (NFR4)
   - Browser compatibility testing (NFR5)
