# MatatuConnect - Backend API

A comprehensive backend API for the MatatuConnect platform (informal public transport system) built with Node.js, Express, and PostgreSQL.

## Features

- **User Management**: Registration, login, profile management, password change
- **Vehicle Management**: Add and manage vehicles with registration tracking
- **Vehicle Occupancy**: Track real-time occupancy status, view occupancy history and vehicle availability
- **Payment Integration**: M-Pesa integration for seamless fare payments
- **Feedback System**: User feedback and ratings with admin management
- **Admin Dashboard**: Complete system analytics and management
- **Security**: JWT authentication, password hashing, input validation
- **Communications**: SMS (Africa's Talking) and WhatsApp notifications

## Prerequisites

- Node.js >= 14.0.0
- PostgreSQL >= 12
- npm >= 6.0.0

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/mjaja000/final_year_project.git
   cd final_year_project
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create PostgreSQL database**

   ```sql
   CREATE DATABASE parking_management;
   ```

4. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:

   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=parking_management
   DB_USER=postgres
   DB_PASSWORD=your_password

   # Server
   PORT=5000
   NODE_ENV=development

   # JWT
   JWT_SECRET=your_secret_key
   JWT_EXPIRE=7d

   # M-Pesa
   MPESA_API_URL=https://sandbox.safaricom.co.ke
   MPESA_CONSUMER_KEY=your_consumer_key
   MPESA_CONSUMER_SECRET=your_consumer_secret
   MPESA_BUSINESS_CODE=your_business_code
   MPESA_PASSKEY=your_passkey
   MPESA_CALLBACK_URL=your_callback_url

   # Twilio SMS
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890

   # WhatsApp
   WHATSAPP_API_URL=https://api.whatsapp.com
   WHATSAPP_BUSINESS_PHONE_ID=your_phone_id
   WHATSAPP_ACCESS_TOKEN=your_access_token

   # CORS
   CORS_ORIGIN=http://localhost:3000
   ```

## Running the Application

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

### Testing

```bash
npm test
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## API Documentation

### Base URL

<http://localhost:5000/api>

### Authentication

Most endpoints require a JWT token in the Authorization header:

Authorization: Bearer <token>

## Endpoints

### Authentication (`/auth`)

- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /profile` - Get user profile (protected)
- `PUT /profile` - Update user profile (protected)
- `POST /change-password` - Change password (protected)
- `POST /logout` - Logout user (protected)

### Occupancy (`/occupancy`)

- `POST /entry` - Record parking entry (protected)
- `POST /exit` - Record parking exit (protected)
- `GET /current` - Get current parking (protected)
- `GET /history` - Get parking history (protected)
- `GET /statistics` - Get parking statistics (protected)
- `GET /availability` - Get lot availability (protected)

### Payments (`/payments`)

- `POST /initiate` - Initiate payment (protected)
- `GET /:paymentId` - Verify payment (protected)
- `GET /` - Get user payments (protected)
- `POST /mpesa/callback` - M-Pesa webhook (no auth)

### Feedback (`/feedback`)

- `POST /` - Submit feedback (protected)
- `GET /` - Get user feedback (protected)
- `GET /:feedbackId` - Get specific feedback (protected)
- `DELETE /:feedbackId` - Delete feedback (protected)

### Admin (`/admin`)

- `GET /users` - Get all users (admin only)
- `GET /users/:userId` - Get user details (admin only)
- `DELETE /users/:userId` - Delete user (admin only)
- `GET /vehicles` - Get all vehicles (admin only)
- `GET /payments` - Get all payments (admin only)
- `GET /revenue/stats` - Get revenue statistics (admin only)
- `GET /revenue/daily` - Get daily revenue (admin only)
- `GET /feedback` - Get all feedback (admin only)
- `GET /feedback/stats` - Get feedback statistics (admin only)
- `PUT /feedback/:feedbackId` - Update feedback status (admin only)
- `GET /parking/stats` - Get parking statistics (admin only)

## Project Structure

src/
├── config/
│   └── database.js              # PostgreSQL connection setup
├── controllers/
│   ├── authController.js        # Authentication logic
│   ├── occupancyController.js   # Parking occupancy logic
│   ├── paymentController.js     # Payment handling
│   ├── feedbackController.js    # Feedback management
│   └── adminController.js       # Admin operations
├── models/
│   ├── userModel.js             # User database operations
│   ├── vehicleModel.js          # Vehicle database operations
│   ├── occupancyModel.js        # Occupancy database operations
│   ├── paymentModel.js          # Payment database operations
│   └── feedbackModel.js         # Feedback database operations
├── routes/
│   ├── authRoutes.js
│   ├── occupancyRoutes.js
│   ├── paymentRoutes.js
│   ├── feedbackRoutes.js
│   └── adminRoutes.js
├── middlewares/
│   ├── authMiddleware.js        # JWT verification
│   └── errorMiddleware.js       # Global error handler
├── services/
│   ├── mpesaService.js          # M-Pesa integration
│   ├── smsService.js            # Twilio SMS service
│   └── whatsappService.js       # WhatsApp service
├── utils/
│   └── validation.js            # Input validation functions
└── app.js                       # Express app configuration

## Database Schema

### Users Table

- id (SERIAL PRIMARY KEY)
- name (VARCHAR)
- email (VARCHAR UNIQUE)
- phone (VARCHAR UNIQUE)
- password (VARCHAR)
- role (VARCHAR) - 'user' or 'admin'
- status (VARCHAR) - 'active' or 'inactive'
- profile_image (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### Vehicles Table

- id (SERIAL PRIMARY KEY)
- user_id (FOREIGN KEY)
- registration_number (VARCHAR UNIQUE)
- vehicle_type (VARCHAR)
- color (VARCHAR)
- make (VARCHAR)
- model (VARCHAR)
- year (INTEGER)
- status (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### Occupancy Table

- id (SERIAL PRIMARY KEY)
- user_id (FOREIGN KEY)
- vehicle_id (FOREIGN KEY)
- lot_number (VARCHAR)
- entry_time (TIMESTAMP)
- exit_time (TIMESTAMP)
- duration_hours (DECIMAL)
- status (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### Payments Table

- id (SERIAL PRIMARY KEY)
- occupancy_id (FOREIGN KEY)
- user_id (FOREIGN KEY)
- amount (DECIMAL)
- payment_method (VARCHAR)
- transaction_id (VARCHAR UNIQUE)
- status (VARCHAR) - 'pending', 'completed', 'failed'
- mpesa_receipt (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### Feedback Table

- id (SERIAL PRIMARY KEY)
- user_id (FOREIGN KEY)
- rating (INTEGER) - 1-5
- comment (TEXT)
- category (VARCHAR)
- status (VARCHAR) - 'pending', 'resolved'
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

## Environment Variables Explained

| Variable | Description |
| ---------- | ------------- |
| DB_HOST | PostgreSQL server host |
| DB_PORT | PostgreSQL server port |
| DB_NAME | Database name |
| DB_USER | Database user |
| DB_PASSWORD | Database password |
| PORT | Server port |
| NODE_ENV | Environment (development/production) |
| JWT_SECRET | Secret key for JWT signing |
| JWT_EXPIRE | Token expiration time |
| MPESA_* | M-Pesa API credentials |
| TWILIO_* | Twilio SMS credentials |
| WHATSAPP_* | WhatsApp API credentials |
| CORS_ORIGIN | Allowed CORS origin |

## API Response Format

All responses follow this format:

### Success Response

```json
{
  "message": "Operation successful",
  "data": {}
}
```

### Error Response

```json
{
  "message": "Error message",
  "error": {}
}
```

## Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required/failed)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

## Security Features

1. **Password Hashing**: bcryptjs for secure password storage
2. **JWT Authentication**: Token-based API authentication
3. **Input Validation**: Comprehensive input sanitization
4. **CORS**: Cross-origin request handling
5. **Helmet**: HTTP header security
6. **Error Handling**: Global error middleware

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Support

For support, email <support@parkingapi.com> or open an issue on GitHub.

## Future Enhancements

- Real-time parking lot monitoring with WebSockets
- Mobile app integration
- Automated rate calculation based on parking duration
- Email notifications
- Advanced reporting and analytics
- Multi-language support
- QR code-based parking entry/exit
- Subscription plans for frequent parkers
