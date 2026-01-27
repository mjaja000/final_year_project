# Setup Guide

This guide will help you set up and run the Parking Management System API.

## Prerequisites

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** (comes with Node.js)

## Step-by-Step Setup

### 1. Database Setup

#### Windows & macOS

```bash
# Open PostgreSQL command line
psql -U postgres

# Create database
CREATE DATABASE parking_management;

# Create user (optional)
CREATE USER parking_user WITH PASSWORD 'secure_password';
ALTER ROLE parking_user SET client_encoding TO 'utf8';
ALTER ROLE parking_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE parking_user SET default_transaction_deferrable TO on;
ALTER ROLE parking_user SET default_transaction_read_only TO off;
GRANT ALL PRIVILEGES ON DATABASE parking_management TO parking_user;

# Exit psql
\q
```

#### Linux

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database
CREATE DATABASE parking_management;

# Create user
CREATE USER parking_user WITH PASSWORD 'secure_password';
ALTER ROLE parking_user SET client_encoding TO 'utf8';
ALTER ROLE parking_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE parking_user SET default_transaction_deferrable TO on;
ALTER ROLE parking_user SET default_transaction_read_only TO off;
GRANT ALL PRIVILEGES ON DATABASE parking_management TO parking_user;

# Exit
\q
```

### 2. Project Setup

```bash
# Navigate to project directory
cd /path/to/final_year_project

# Install dependencies
npm install
```

### 3. Environment Configuration

```bash
# Create .env file in root directory
cp .env .env.local  # For backup

# Edit .env with your values
nano .env  # or use your preferred editor
```

Update the following in `.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=parking_management
DB_USER=postgres          # or parking_user if you created one
DB_PASSWORD=your_password

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration (generate a strong secret)
JWT_SECRET=your_super_secret_key_change_this_in_production
JWT_EXPIRE=7d

# M-Pesa Configuration (Get from Safaricom)
MPESA_API_URL=https://sandbox.safaricom.co.ke
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_BUSINESS_CODE=your_business_code
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://your-domain.com/api/payments/mpesa/callback

# Twilio SMS Configuration (Get from Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# WhatsApp Configuration
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_BUSINESS_PHONE_ID=your_phone_id
WHATSAPP_ACCESS_TOKEN=your_access_token

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 4. Generate JWT Secret

Use this command to generate a strong JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it in the `JWT_SECRET` environment variable.

### 5. Run the Application

#### Development Mode (with auto-reload)

```bash
npm run dev
```

#### Production Mode

```bash
npm start
```

#### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Verifying the Setup

Once the server is running, you should see:
```
🚀 Server running on port 5000
Environment: development
Database tables initialized successfully
```

To verify the API is working:
```bash
# Check health endpoint
curl http://localhost:5000/health

# Get API info
curl http://localhost:5000/
```

## API Testing

### Using cURL

#### Register a User

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

#### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

#### Using JWT Token

```bash
# Set your token
TOKEN="your_jwt_token_here"

# Get profile
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman

1. Import the API collection (if provided)
2. Set environment variables in Postman:
   - `base_url`: http://localhost:5000
   - `token`: Your JWT token from login

3. Use the pre-configured requests to test endpoints

## Troubleshooting

### Port Already in Use

```bash
# Find what's using port 5000
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process or change PORT in .env
```

### Database Connection Error

```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Verify credentials in .env
# Test connection
psql -h localhost -U postgres -d parking_management
```

### npm install fails

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Module not found errors

```bash
# Make sure all dependencies are installed
npm install

# Check for missing dependencies
npm list
```

## Project Structure Overview

```
final_year_project/
├── src/
│   ├── config/           # Database configuration
│   ├── controllers/      # Business logic
│   ├── models/          # Database operations
│   ├── routes/          # API endpoints
│   ├── middlewares/     # Authentication & error handling
│   ├── services/        # External services (M-Pesa, SMS, etc)
│   ├── utils/           # Validation functions
│   └── app.js           # Express app setup
├── server.js            # Server entry point
├── package.json         # Dependencies
├── .env                 # Environment variables
└── .gitignore          # Git ignore patterns
```

## Next Steps

1. **Test the API** using cURL, Postman, or Thunder Client
2. **Create admin user** - You'll need to manually set role to 'admin' in database
3. **Configure M-Pesa** - Get credentials from Safaricom
4. **Setup Twilio** - Get credentials for SMS notifications
5. **Deploy** - Once tested, deploy to your server

## Security Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Change database passwords
- [ ] Update `CORS_ORIGIN` to your frontend URL
- [ ] Use HTTPS in production
- [ ] Set `NODE_ENV=production`
- [ ] Use environment variables for all secrets
- [ ] Implement rate limiting
- [ ] Enable HTTPS for database connections
- [ ] Regularly update dependencies: `npm audit`

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT Documentation](https://jwt.io/)
- [Safaricom M-Pesa API](https://developer.safaricom.co.ke/)
- [Twilio Documentation](https://www.twilio.com/docs/)

## Support & Contact

For issues or questions:
1. Check the [API Documentation](./API_DOCUMENTATION.md)
2. Review error logs in console
3. Check PostgreSQL logs
4. Open an issue on GitHub

## Useful Commands

```bash
# Start development server
npm run dev

# Check database connection
npm run test:db

# Run linting
npm run lint

# Format code
npm run format

# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix security vulnerabilities
npm audit fix
```

---

**Happy Coding! 🚀**
