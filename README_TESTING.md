# MatatuConnect - Testing Branch

Integrated testing branch containing both backend and frontend code for the MatatuConnect platform.

## Project Structure

```
.
├── backend/                    # Node.js/Express Backend
│   ├── src/
│   │   ├── app.js             # Express application setup
│   │   ├── server.js          # Server entry point
│   │   ├── config/            # Configuration files
│   │   ├── controllers/       # Route controllers
│   │   ├── middlewares/       # Express middlewares
│   │   ├── models/            # Database models
│   │   ├── routes/            # API route definitions
│   │   ├── services/          # Business logic services
│   │   └── utils/             # Utility functions
│   ├── package.json           # Backend dependencies
│   └── .env                   # Environment variables
│
├── frontend/                   # React + Vite Frontend
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── pages/             # Page components
│   │   ├── lib/               # Utility libraries & API
│   │   ├── hooks/             # Custom React hooks
│   │   ├── styles/            # Tailwind CSS
│   │   └── main.tsx           # Entry point
│   ├── package.json           # Frontend dependencies
│   ├── vite.config.ts         # Vite configuration
│   └── tailwind.config.ts     # Tailwind CSS config
│
└── docs/                      # Documentation files
```

## Backend Setup

### Prerequisites
- Node.js 16+
- PostgreSQL 12+

### Installation

```bash
cd backend
npm install
```

### Environment Variables

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matatuconnect
DB_USER=postgres
DB_PASSWORD=postgres

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
```

### Running the Backend

```bash
cd backend
npm start        # Production mode
npm run dev      # Development mode with nodemon
```

Backend will be available at: **http://localhost:5000**

### API Endpoints

- **Auth**: `/api/auth` - User registration, login, profile
- **Occupancy**: `/api/occupancy` - Report and view occupancy
- **Payments**: `/api/payments` - Payment simulation
- **Feedback**: `/api/feedback` - Submit and view feedback
- **Admin**: `/api/admin` - Dashboard and analytics
- **Health**: `/health` - Server health check

## Frontend Setup

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Running the Frontend

```bash
cd frontend
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

Frontend will be available at: **http://localhost:5173**

## Integration

### Backend API Configuration

The frontend is configured to connect to the backend at:
```
http://localhost:5000/api
```

Update this in `frontend/src/lib/api.ts` if using a different backend URL.

### Database Setup

1. Ensure PostgreSQL is running
2. The backend will automatically create all required tables on startup
3. Database tables created:
   - users
   - routes
   - vehicles
   - vehicle_occupancy_status
   - payments
   - feedback

## Features Implemented

### Backend Features (FR1-FR5)
- ✅ User authentication (registration, login, JWT tokens)
- ✅ Feedback submission and management (FR1)
- ✅ Payment simulation via M-Pesa (FR2)
- ✅ Occupancy reporting and tracking (FR3)
- ✅ Admin dashboard with analytics
- ✅ Route and vehicle management

### Frontend Features
- ✅ User authentication interface
- ✅ Feedback submission form
- ✅ Payment simulation interface
- ✅ Occupancy display and updates
- ✅ Admin dashboard with charts
- ✅ Route management interface
- ✅ Responsive design with Tailwind CSS
- ✅ Toast notifications
- ✅ Digital ticket display

## Development Workflow

### Making Changes

1. **Backend Changes**:
   ```bash
   cd backend
   npm run dev    # Auto-restart on file changes
   ```

2. **Frontend Changes**:
   ```bash
   cd frontend
   npm run dev    # Hot module replacement
   ```

3. **Test Your Changes**:
   - Backend: http://localhost:5000/api/health
   - Frontend: http://localhost:5173

### Committing Changes

```bash
git add .
git commit -m "type: description"
```

Commit types:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code restructuring
- `docs:` - Documentation changes
- `style:` - Code style changes
- `test:` - Test additions/changes

## Deployment

### Backend Deployment
- Set `NODE_ENV=production`
- Configure production database credentials
- Deploy to your hosting platform (Heroku, AWS, DigitalOcean, etc.)

### Frontend Deployment
- Run: `npm run build`
- Deploy the `dist` folder to your static hosting (Vercel, Netlify, etc.)

## Troubleshooting

### Backend Won't Start
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify database credentials in `.env`
- Check if port 5000 is available

### Frontend Won't Load
- Clear browser cache
- Check if backend API is running
- Verify API URL in `frontend/src/lib/api.ts`

### Database Errors
- Ensure PostgreSQL is installed and running
- Create database: `createdb matatuconnect`
- Check `.env` credentials

## Testing the Full Stack

### Manual Testing
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm run dev`
3. Visit: http://localhost:5173
4. Test user flows:
   - Register new user
   - Submit feedback
   - View occupancy
   - Simulate payment
   - Access admin dashboard

## Branch Information

- **Branch**: `testing`
- **Created From**: Merged `backend` and `front` branches
- **Contains**: Full integrated codebase with backend and frontend
- **Status**: Ready for testing and integration

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test thoroughly
3. Commit with clear messages
4. Push to remote: `git push origin feature/your-feature`
5. Create pull request to `testing` or `main`

## License

ISC

## Contact

For issues or questions, please open a GitHub issue.
