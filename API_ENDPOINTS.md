# MatatuConnect API Endpoints - Complete Reference

## Overview
All endpoints are prefixed with `http://localhost:5000`

---

## Public Endpoints (No Authentication Required)

### Health Check
- **GET** `/health`
  - Status: ✅ Active
  - Response: API health status
  - Used by: Dashboard server health check

### Authentication Routes (`/api/auth`)

#### Register
- **POST** `/api/auth/register`
  - Body: `{ name, email, phone, password, confirmPassword }`
  - Response: User object with ID

#### Login
- **POST** `/api/auth/login`
  - Body: `{ email, password }`
  - Response: JWT token + user info

#### Health Check
- **GET** `/api/auth/health`
  - Status: ✅ Active
  - Response: Service health status
  - Used by: Dashboard service health checks

---

## Dashboard Public Routes (No Authentication)

### Admin Dashboard (`/api/admin`)

#### Dashboard Overview
- **GET** `/api/admin/dashboard`
  - Status: ✅ Active
  - Returns: `{ totalUsers, totalVehicles, totalRoutes, totalFeedback, totalPayments, feedbackByType }`
  - Used by: Dashboard overview cards, statistics

#### All Feedback
- **GET** `/api/admin/feedback`
  - Status: ✅ Active
  - Query params: `limit`, `offset`, `routeId`, `vehicleId`, `feedbackType`, `startDate`, `endDate`
  - Returns: Feedback list with statistics

#### Feedback Statistics
- **GET** `/api/admin/feedback/stats`
  - Status: ✅ Active
  - Query params: `routeId`, `startDate`, `endDate`
  - Returns: Feedback statistics

#### All Payments
- **GET** `/api/admin/payments`
  - Status: ✅ Active
  - Query params: `limit`, `offset`
  - Returns: Payment list

#### Payment Statistics
- **GET** `/api/admin/payments/stats`
  - Status: ✅ Active
  - Returns: Payment statistics

### Occupancy Routes (`/api/occupancy`)

#### All Routes
- **GET** `/api/occupancy/routes`
  - Status: ✅ Active
  - Returns: `{ routes: [{ id, routeName, startLocation, endLocation, baseFare }] }`
  - Used by: Dashboard routes tab

#### All Occupancy Status
- **GET** `/api/occupancy/all`
  - Status: ✅ Active
  - Returns: `{ occupancyStatuses: [{ vehicleId, status, updatedAt }] }`
  - Used by: Dashboard occupancy tab

### Feedback Routes (`/api/feedback`)

#### Get All Feedback
- **GET** `/api/feedback`
  - Status: ✅ Active
  - Returns: User feedback list
  - Used by: Dashboard feedback tab

### Payment Routes (`/api/payments`)

#### Get User Payments
- **GET** `/api/payments`
  - Status: ✅ Active
  - Returns: User payment list
  - Used by: Dashboard payments section

---

## Protected Routes (Authentication Required)

### Authentication Routes (`/api/auth`)

#### Get Profile
- **GET** `/api/auth/profile`
  - Headers: `Authorization: Bearer <token>`
  - Returns: User profile data

#### Update Profile
- **PUT** `/api/auth/profile`
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ name, email, phone }`
  - Returns: Updated user profile

#### Change Password
- **POST** `/api/auth/change-password`
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ oldPassword, newPassword }`
  - Returns: Success message

#### Logout
- **POST** `/api/auth/logout`
  - Headers: `Authorization: Bearer <token>`
  - Returns: Success message

### Occupancy Routes (`/api/occupancy`)

#### Update Occupancy Status
- **POST** `/api/occupancy/status`
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ vehicleId, status: "available" | "full" }`
  - Returns: Updated occupancy status

#### Get Vehicle Occupancy
- **GET** `/api/occupancy/vehicle/:vehicleId`
  - Headers: `Authorization: Bearer <token>`
  - Returns: Vehicle occupancy status

### Feedback Routes (`/api/feedback`)

#### Submit Feedback
- **POST** `/api/feedback`
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ route, vehicle, type: "Complaint" | "Compliment", comment }`
  - Returns: Feedback ID

#### Get Specific Feedback
- **GET** `/api/feedback/:feedbackId`
  - Headers: `Authorization: Bearer <token>`
  - Returns: Feedback details

#### Delete Feedback
- **DELETE** `/api/feedback/:feedbackId`
  - Headers: `Authorization: Bearer <token>`
  - Returns: Success message

### Payment Routes (`/api/payments`)

#### Simulate Payment
- **POST** `/api/payments/simulate`
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ amount, phoneNumber }`
  - Returns: Payment simulation result

#### Get Payment Status
- **GET** `/api/payments/:paymentId`
  - Headers: `Authorization: Bearer <token>`
  - Returns: Payment details

#### Get Payment Statistics
- **GET** `/api/payments/stats`
  - Headers: `Authorization: Bearer <token>`
  - Returns: Payment statistics

---

## Root Endpoint

### API Information
- **GET** `/`
  - Returns: Full API documentation with all endpoints and functional requirements
  - Status: ✅ Active

---

## JavaScript Dashboard Integration

### API Endpoints Called by Dashboard

The management dashboard (`assets/js/management.js`) calls:

1. **`/health`** - Server health check (every 5s)
2. **`/api/admin/dashboard`** - Overview data (every 10s)
3. **`/api/occupancy/routes`** - Routes listing
4. **`/api/occupancy/all`** - Occupancy data
5. **`/api/admin/feedback`** - Feedback data
6. **`/api/admin/payments`** - Payment data
7. **`/api/auth/health`** - Auth service health (fallback)

### Dashboard Authentication
- **Method**: Hardcoded credentials
- **Username**: `admin`
- **Password**: `admin`
- **Token Storage**: `localStorage.dashboardToken`
- **No JWT required** for dashboard endpoints

---

## Error Responses

All endpoints return errors in format:
```json
{
  "message": "Error description",
  "error": "detailed error message"
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error

---

## Summary Table

| Endpoint | Method | Auth Required | Status |
|----------|--------|---------------|--------|
| `/health` | GET | No | ✅ Active |
| `/api/auth/register` | POST | No | ✅ Active |
| `/api/auth/login` | POST | No | ✅ Active |
| `/api/auth/health` | GET | No | ✅ Active |
| `/api/auth/profile` | GET | Yes | ✅ Active |
| `/api/auth/profile` | PUT | Yes | ✅ Active |
| `/api/admin/dashboard` | GET | No | ✅ Active |
| `/api/admin/feedback` | GET | No | ✅ Active |
| `/api/admin/payments` | GET | No | ✅ Active |
| `/api/occupancy/routes` | GET | No | ✅ Active |
| `/api/occupancy/all` | GET | No | ✅ Active |
| `/api/occupancy/status` | POST | Yes | ✅ Active |
| `/api/feedback` | GET | No | ✅ Active |
| `/api/feedback` | POST | Yes | ✅ Active |
| `/api/payments` | GET | No | ✅ Active |
| `/api/payments/simulate` | POST | Yes | ✅ Active |

---

## Project Structure

```
final_year_project/
├── src/
│   ├── app.js                 (Main Express app)
│   ├── routes/
│   │   ├── adminRoutes.js     (/api/admin)
│   │   ├── authRoutes.js      (/api/auth)
│   │   ├── occupancyRoutes.js (/api/occupancy)
│   │   ├── feedbackRoutes.js  (/api/feedback)
│   │   └── paymentRoutes.js   (/api/payments)
│   ├── controllers/           (Business logic)
│   ├── models/                (Database models)
│   └── middlewares/           (Auth, error handling)
├── assets/
│   └── js/
│       └── management.js      (Dashboard frontend)
├── management.html            (Dashboard UI)
└── server.js                  (Entry point)
```

---

## Last Updated
January 16, 2026

## Changes Made
- ✅ Removed auth requirement from dashboard public endpoints
- ✅ Added `/api/auth/health` endpoint for service checks
- ✅ Made `/api/occupancy/routes` and `/api/occupancy/all` public
- ✅ Made `/api/feedback` GET and `/api/payments` GET public for dashboard
- ✅ Updated management.js to use correct `/health` endpoint
- ✅ All JavaScript API calls now match server endpoints
