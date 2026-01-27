# API Testing Guide & Examples

This guide provides detailed examples of how to test each endpoint of the Parking Management System API.

## Base URL

```
http://localhost:5000
```

## Authentication

Most endpoints require a JWT token. You get this token from the login endpoint.

### Header Format

```
Authorization: Bearer <your_jwt_token>
```

---

## 1. AUTHENTICATION ENDPOINTS

### 1.1 Register New User

**Endpoint**: `POST /api/auth/register`
**Authentication**: Not required

**Request**:

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

**Response** (201 Created):

```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "254712345678",
    "role": "user"
  }
}
```

**Validation Rules**:

- Name: Required, string
- Email: Required, valid email format
- Phone: Required, Kenya format (254... or 07...)
- Password: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
- Passwords must match

---

### 1.2 Login

**Endpoint**: `POST /api/auth/login`
**Authentication**: Not required

**Request**:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Response** (200 OK):

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Error** (401 Unauthorized):

```json
{
  "message": "Invalid email or password"
}
```

---

### 1.3 Get User Profile

**Endpoint**: `GET /api/auth/profile`
**Authentication**: Required

**Request**:

```bash
TOKEN="your_jwt_token_here"

curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

**Response** (200 OK):

```json
{
  "message": "Profile fetched",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "254712345678",
    "role": "user",
    "status": "active",
    "profile_image": null
  }
}
```

---

### 1.4 Update User Profile

**Endpoint**: `PUT /api/auth/profile`
**Authentication**: Required

**Request**:

```bash
TOKEN="your_jwt_token_here"

curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated",
    "phone": "254712345679"
  }'
```

**Response** (200 OK):

```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "name": "John Updated",
    "email": "john@example.com",
    "phone": "254712345679",
    "role": "user",
    "status": "active"
  }
}
```

---

### 1.5 Change Password

**Endpoint**: `POST /api/auth/change-password`
**Authentication**: Required

**Request**:

```bash
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "SecurePass123!",
    "newPassword": "NewSecurePass456!",
    "confirmPassword": "NewSecurePass456!"
  }'
```

**Response** (200 OK):

```json
{
  "message": "Password changed successfully"
}
```

---

## 2. OCCUPANCY ENDPOINTS

### 2.1 Record Parking Entry

**Endpoint**: `POST /api/occupancy/entry`
**Authentication**: Required

**Request**:

```bash
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:5000/api/occupancy/entry \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": 1,
    "lotNumber": "A-101"
  }'
```

**Response** (201 Created):

```json
{
  "message": "Entry recorded successfully",
  "occupancy": {
    "id": 1,
    "user_id": 1,
    "vehicle_id": 1,
    "lot_number": "A-101",
    "entry_time": "2026-01-16T12:30:45.000Z",
    "exit_time": null,
    "duration_hours": null,
    "status": "active"
  }
}
```

---

### 2.2 Record Parking Exit

**Endpoint**: `POST /api/occupancy/exit`
**Authentication**: Required

**Request**:

```bash
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:5000/api/occupancy/exit \
  -H "Authorization: Bearer $TOKEN"
```

**Response** (200 OK):

```json
{
  "message": "Exit recorded successfully",
  "occupancy": {
    "id": 1,
    "user_id": 1,
    "vehicle_id": 1,
    "lot_number": "A-101",
    "entry_time": "2026-01-16T12:30:45.000Z",
    "exit_time": "2026-01-16T14:30:45.000Z",
    "duration_hours": 2,
    "status": "completed"
  }
}
```

---

### 2.3 Get Current Parking

**Endpoint**: `GET /api/occupancy/current`
**Authentication**: Required

**Request**:

```bash
TOKEN="your_jwt_token_here"

curl -X GET http://localhost:5000/api/occupancy/current \
  -H "Authorization: Bearer $TOKEN"
```

**Response** (200 OK):

```json
{
  "message": "Current parking fetched",
  "parking": {
    "id": 1,
    "user_id": 1,
    "vehicle_id": 1,
    "lot_number": "A-101",
    "entry_time": "2026-01-16T12:30:45.000Z",
    "status": "active"
  }
}
```

---

### 2.4 Get Parking History

**Endpoint**: `GET /api/occupancy/history?limit=50&offset=0`
**Authentication**: Required

**Request**:

```bash
TOKEN="your_jwt_token_here"

curl -X GET "http://localhost:5000/api/occupancy/history?limit=50&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

**Response** (200 OK):

```json
{
  "message": "Parking history fetched",
  "history": [
    {
      "id": 1,
      "user_id": 1,
      "vehicle_id": 1,
      "lot_number": "A-101",
      "entry_time": "2026-01-16T12:30:45.000Z",
      "exit_time": "2026-01-16T14:30:45.000Z",
      "duration_hours": 2,
      "status": "completed"
    }
  ]
}
```

---

### 2.5 Get Lot Availability

**Endpoint**: `GET /api/occupancy/availability`
**Authentication**: Required

**Request**:

```bash
TOKEN="your_jwt_token_here"

curl -X GET http://localhost:5000/api/occupancy/availability \
  -H "Authorization: Bearer $TOKEN"
```

**Response** (200 OK):

```json
{
  "message": "Lot availability fetched",
  "availability": [
    {
      "lot_number": "A-101",
      "total_parked": 1
    },
    {
      "lot_number": "A-102",
      "total_parked": 0
    }
  ]
}
```

---

## 3. PAYMENT ENDPOINTS

### 3.1 Initiate Payment

**Endpoint**: `POST /api/payments/initiate`
**Authentication**: Required

**Request**:

```bash
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:5000/api/payments/initiate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "occupancyId": 1,
    "amount": 100,
    "paymentMethod": "mpesa",
    "phone": "254712345678"
  }'
```

**Response** (201 Created):

```json
{
  "message": "M-Pesa payment initiated",
  "payment": {
    "id": 1,
    "occupancy_id": 1,
    "user_id": 1,
    "amount": 100,
    "payment_method": "mpesa",
    "status": "pending"
  },
  "mpesaResponse": {
    "ResponseCode": "0",
    "ResponseDescription": "Success"
  }
}
```

---

### 3.2 Verify Payment

**Endpoint**: `GET /api/payments/:paymentId`
**Authentication**: Required

**Request**:

```bash
TOKEN="your_jwt_token_here"
PAYMENT_ID=1

curl -X GET http://localhost:5000/api/payments/$PAYMENT_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Response** (200 OK):

```json
{
  "message": "Payment status fetched",
  "payment": {
    "id": 1,
    "occupancy_id": 1,
    "user_id": 1,
    "amount": 100,
    "payment_method": "mpesa",
    "transaction_id": "LEX20160118000001",
    "status": "completed",
    "mpesa_receipt": "NJGE8AQ68"
  }
}
```

---

### 3.3 Get User Payments

**Endpoint**: `GET /api/payments?limit=50&offset=0`
**Authentication**: Required

**Request**:

```bash
TOKEN="your_jwt_token_here"

curl -X GET "http://localhost:5000/api/payments?limit=50&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

**Response** (200 OK):

```json
{
  "message": "User payments fetched",
  "payments": [
    {
      "id": 1,
      "amount": 100,
      "payment_method": "mpesa",
      "status": "completed",
      "entry_time": "2026-01-16T12:30:45.000Z",
      "exit_time": "2026-01-16T14:30:45.000Z",
      "lot_number": "A-101"
    }
  ]
}
```

---

## 4. FEEDBACK ENDPOINTS

### 4.1 Submit Feedback

**Endpoint**: `POST /api/feedback`
**Authentication**: Required

**Request**:

```bash
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:5000/api/feedback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "comment": "Great parking service!",
    "category": "service"
  }'
```

**Response** (201 Created):

```json
{
  "message": "Feedback submitted successfully",
  "feedback": {
    "id": 1,
    "user_id": 1,
    "rating": 5,
    "comment": "Great parking service!",
    "category": "service",
    "status": "pending"
  }
}
```

---

### 4.2 Get User Feedback

**Endpoint**: `GET /api/feedback`
**Authentication**: Required

**Request**:

```bash
TOKEN="your_jwt_token_here"

curl -X GET http://localhost:5000/api/feedback \
  -H "Authorization: Bearer $TOKEN"
```

**Response** (200 OK):

```json
{
  "message": "User feedback fetched",
  "feedback": [
    {
      "id": 1,
      "user_id": 1,
      "rating": 5,
      "comment": "Great parking service!",
      "category": "service",
      "status": "pending"
    }
  ]
}
```

---

### 4.3 Delete Feedback

**Endpoint**: `DELETE /api/feedback/:feedbackId`
**Authentication**: Required

**Request**:

```bash
TOKEN="your_jwt_token_here"
FEEDBACK_ID=1

curl -X DELETE http://localhost:5000/api/feedback/$FEEDBACK_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Response** (200 OK):

```json
{
  "message": "Feedback deleted successfully"
}
```

---

## 5. ADMIN ENDPOINTS

All admin endpoints require admin role.

### 5.1 Get All Users

**Endpoint**: `GET /api/admin/users`
**Authentication**: Required (Admin only)

**Request**:

```bash
TOKEN="your_admin_token"

curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer $TOKEN"
```

**Response** (200 OK):

```json
{
  "message": "All users fetched",
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "254712345678",
      "role": "user",
      "status": "active",
      "created_at": "2026-01-16T10:00:00.000Z"
    }
  ]
}
```

---

### 5.2 Get Revenue Statistics

**Endpoint**: `GET /api/admin/revenue/stats?startDate=2026-01-01&endDate=2026-01-31`
**Authentication**: Required (Admin only)

**Request**:

```bash
TOKEN="your_admin_token"

curl -X GET "http://localhost:5000/api/admin/revenue/stats?startDate=2026-01-01&endDate=2026-01-31" \
  -H "Authorization: Bearer $TOKEN"
```

**Response** (200 OK):

```json
{
  "message": "Revenue statistics fetched",
  "stats": {
    "total_payments": 150,
    "total_revenue": 15000,
    "avg_payment": 100,
    "successful_payments": 148,
    "failed_payments": 2
  }
}
```

---

### 5.3 Get Daily Revenue

**Endpoint**: `GET /api/admin/revenue/daily?days=30`
**Authentication**: Required (Admin only)

**Request**:

```bash
TOKEN="your_admin_token"

curl -X GET "http://localhost:5000/api/admin/revenue/daily?days=30" \
  -H "Authorization: Bearer $TOKEN"
```

**Response** (200 OK):

```json
{
  "message": "Daily revenue fetched",
  "revenue": [
    {
      "date": "2026-01-16",
      "transactions": 25,
      "revenue": 2500
    },
    {
      "date": "2026-01-15",
      "transactions": 22,
      "revenue": 2200
    }
  ]
}
```

---

### 5.4 Get All Feedback

**Endpoint**: `GET /api/admin/feedback?limit=100&offset=0`
**Authentication**: Required (Admin only)

**Request**:

```bash
TOKEN="your_admin_token"

curl -X GET "http://localhost:5000/api/admin/feedback?limit=100&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

**Response** (200 OK):

```json
{
  "message": "All feedback fetched",
  "feedback": [
    {
      "id": 1,
      "user_id": 1,
      "rating": 5,
      "comment": "Great service!",
      "category": "service",
      "status": "pending",
      "name": "John Doe",
      "email": "john@example.com"
    }
  ]
}
```

---

### 5.5 Update Feedback Status

**Endpoint**: `PUT /api/admin/feedback/:feedbackId`
**Authentication**: Required (Admin only)

**Request**:

```bash
TOKEN="your_admin_token"
FEEDBACK_ID=1

curl -X PUT http://localhost:5000/api/admin/feedback/$FEEDBACK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "resolved"
  }'
```

**Response** (200 OK):

```json
{
  "message": "Feedback status updated",
  "feedback": {
    "id": 1,
    "user_id": 1,
    "rating": 5,
    "status": "resolved"
  }
}
```

---

## Error Handling

### Common Error Responses

**400 Bad Request**:

```json
{
  "message": "Validation error message",
  "error": {}
}
```

**401 Unauthorized**:

```json
{
  "message": "Authorization token is missing"
}
```

**403 Forbidden**:

```json
{
  "message": "Insufficient permissions"
}
```

**404 Not Found**:

```json
{
  "message": "Resource not found"
}
```

**500 Internal Server Error**:

```json
{
  "message": "Internal Server Error",
  "error": {}
}
```

---

## Testing Tools

### Using Postman

1. Import the endpoints
2. Set environment variables (base_url, token)
3. Use pre-request scripts to set up data
4. Use tests to verify responses

### Using cURL

```bash
# Save token to variable
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}' | jq -r '.token')

# Use token in subsequent requests
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/auth/profile
```

### Using Insomnia

Similar to Postman - import requests and set up environment variables.

---

## Rate Limiting

The API implements rate limiting:

- **100 requests per 15 minutes** per IP address
- Returns `429 Too Many Requests` when exceeded

---

## API Response Format

All responses follow this format:

**Success**:

```json
{
  "message": "Operation description",
  "data": { /* ... */ }
}
```

**Error**:

```json
{
  "message": "Error description",
  "error": { /* error details */ }
}
```

---

## Best Practices

1. **Store tokens securely** - Never expose in code
2. **Use HTTPS** in production - Never use HTTP
3. **Handle errors gracefully** - Check status codes
4. **Implement retry logic** - For failed requests
5. **Cache responses** - To reduce API calls
6. **Validate input** - Before sending requests
7. **Log requests** - For debugging purposes

---

**Last Updated**: January 16, 2026
