# MatatuConnect

> Smart Feedback, Payment, and Occupancy Awareness Platform for Kenya's Informal Public Transport

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12%2B-blue)](https://www.postgresql.org/)

## 📋 Overview

MatatuConnect is a comprehensive smart platform designed for Kenya's informal public transport system (matatus). It enables passengers to provide feedback, drivers to manage occupancy, and administrators to monitor the entire system in real-time.

### Key Features

- ✅ **Multi-role Authentication** (Passenger, Driver, Admin)
- 📝 **Feedback System** (Complaints & Compliments)
- 💰 **Payment Simulation** (M-Pesa STK Push)
- 🚌 **Real-time Occupancy Tracking**
- 💬 **Admin-Driver Messaging** (Socket.IO)
- 📱 **WhatsApp Integration** (Twilio)
- 📊 **Analytics Dashboard**
- 🔒 **JWT Authentication & Authorization**

## 🚀 Quick Start

### Prerequisites
- Node.js >= 14.0.0
- PostgreSQL >= 12.0
- npm >= 6.0.0

### Backend Setup
```bash
cd final_year_project/backend
npm install
cp .env.example .env  # Configure your environment
npm run dev           # Start on http://localhost:5000
```

### Frontend Setup
```bash
cd final_year_project/frontend/ride-aid-kenya
npm install
npm run dev           # Start on http://localhost:5173
```

### Database Setup
```bash
# Start PostgreSQL
sudo systemctl start postgresql

# Create database
psql -U postgres
CREATE DATABASE matatuconnect;
\q
```

## 📚 Documentation

- **[Complete Documentation](COMPLETE_DOCUMENTATION.md)** - Full project documentation
- **[API Documentation](API_DOCUMENTATION.md)** - REST API reference
- **[Setup Guide](SETUP_GUIDE.md)** - Detailed installation guide
- **[Backend Architecture](BACKEND_ARCHITECTURE.md)** - System design
- **[WhatsApp Integration](TWILIO_WHATSAPP_SETUP.md)** - WhatsApp setup guide
- **[Testing Guide](README_TESTING.md)** - Testing documentation

## 🛠️ Technology Stack

### Backend
- Express.js 5.2.1
- PostgreSQL 8.17.1
- Socket.IO 4.8.3
- Twilio WhatsApp SDK
- JWT + bcrypt

### Frontend
- React 18.3.1
- Vite 5.4.19
- TypeScript
- Tailwind CSS
- Radix UI

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Feedback
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback` - Get all feedback

### Payments
- `POST /api/payments/simulate` - Simulate M-Pesa payment

### Occupancy
- `POST /api/occupancy` - Report vehicle occupancy
- `GET /api/occupancy/route/:routeId` - Get route occupancy

### WhatsApp
- `POST /api/whatsapp/send` - Send WhatsApp message
- `GET /api/whatsapp/status` - Check WhatsApp configuration

### Messages (Admin-Driver Chat)
- `POST /api/messages` - Send message
- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/conversation/:userId` - Get conversation history

**[View Complete API Reference →](API_DOCUMENTATION.md)**

## 🔐 Environment Variables

### Backend (.env)
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
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# CORS
ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test
npm run test:coverage

# Manual API tests
curl http://localhost:5000/api/health
```

## 📦 Project Structure

```
final_year_project/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── middlewares/     # Auth, error handling
│   │   └── config/          # Configuration
│   ├── server.js            # Entry point
│   └── package.json
├── frontend/
│   └── ride-aid-kenya/
│       ├── src/
│       │   ├── components/  # React components
│       │   ├── pages/       # Page components
│       │   ├── hooks/       # Custom hooks
│       │   └── services/    # API client
│       └── package.json
└── docs/                    # Documentation files
```

## 🚢 Deployment

### Recommended Platforms
- **Backend**: Railway, Render, Heroku
- **Frontend**: Vercel, Netlify
- **Database**: Supabase, Railway Postgres

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Configure production database
- [ ] Set up SSL/TLS
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up monitoring
- [ ] Configure production WhatsApp webhook

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

ISC License - See [LICENSE](LICENSE) file for details

## 👥 Team

MatatuConnect Team

## 📞 Support

- GitHub Issues: [Create an issue](https://github.com/mjaja000/final_year_project/issues)
- Email: support@matatuconnect.co.ke

## 🙏 Acknowledgments

- Kenya's matatu transport sector for inspiration
- Open source community for tools and libraries
- Twilio for WhatsApp API

---

**Made with ❤️ for Kenya's Public Transport**