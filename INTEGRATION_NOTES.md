# Integration Notes - Testing Branch

This document provides integration details for the testing branch combining backend and frontend code.

## Branch Merge History

**Created**: January 21, 2026
**Merged From**: 
- Backend branch (`origin/backend`)
- Frontend branch (`origin/front`)

## Directory Organization

### Professional Structure

```
testing-branch/
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   ├── .env
│   └── node_modules/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── lib/
│   │   ├── hooks/
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── index.html
│
└── docs/
    ├── README_TESTING.md (this project overview)
    ├── INTEGRATION_NOTES.md (this file)
    └── API_DOCUMENTATION.md
```

## Backend Details

### Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT
- **API**: RESTful

### Key Endpoints
- `GET /health` - Health check
- `GET /` - API info
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/occupancy` - Get occupancy data
- `POST /api/payments/initiate` - Initiate payment
- `POST /api/feedback` - Submit feedback
- `GET /api/admin/dashboard` - Admin dashboard

### Database Tables
1. **users** - User accounts and authentication
2. **routes** - Transportation routes
3. **vehicles** - Vehicle information
4. **vehicle_occupancy_status** - Real-time occupancy data
5. **payments** - Payment records
6. **feedback** - User feedback

## Frontend Details

### Technology Stack
- **Framework**: React 18+
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React hooks
- **API Client**: Custom axios wrapper

### Key Pages
- `/` - Home page
- `/feedback` - Feedback submission
- `/occupancy` - Occupancy display
- `/payment` - Payment simulation
- `/admin` - Admin dashboard
- `/admin/login` - Admin login

### UI Components
- Header with navigation
- Feedback form
- Occupancy display
- Payment simulation interface
- Digital ticket display
- Admin dashboard with charts
- Route management
- Data tables

## Integration Points

### API Communication
Frontend connects to backend via:
- **Base URL**: `http://localhost:5000/api`
- **Config File**: `frontend/src/lib/api.ts`

### Authentication Flow
1. User registers/logs in on frontend
2. Backend validates and issues JWT token
3. Frontend stores token in localStorage
4. Frontend includes token in Authorization header for authenticated requests

### Data Flow
```
Frontend Form → Backend API → Database → Backend Response → Frontend Display
```

## Running the Full Stack

### Development Mode

**Terminal 1 - Backend**:
```bash
cd backend
npm install
npm start
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm install
npm run dev
```

### Access Points
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Backend Health: http://localhost:5000/health

## Testing Checklist

### Backend Tests
- [ ] Database connection
- [ ] User registration endpoint
- [ ] User login endpoint
- [ ] JWT token generation
- [ ] Occupancy endpoints
- [ ] Payment endpoints
- [ ] Feedback endpoints
- [ ] Admin endpoints

### Frontend Tests
- [ ] Page loads correctly
- [ ] Navigation works
- [ ] Feedback form submits
- [ ] Occupancy data displays
- [ ] Payment simulation works
- [ ] Admin dashboard loads
- [ ] Authentication flows

### Integration Tests
- [ ] Frontend connects to backend
- [ ] API calls work end-to-end
- [ ] Data persists in database
- [ ] Error handling works
- [ ] Loading states display
- [ ] Notifications appear

## Known Issues & Limitations

1. **M-Pesa Integration**: Currently simulated, not connected to real M-Pesa API
2. **SMS Service**: Placeholder implementation (Africa's Talking)
3. **WhatsApp**: Placeholder implementation (Meta API)
4. **Admin Methods**: Some dashboard methods need implementation
5. **Validation**: Basic validation, can be enhanced

## Configuration & Environment

### Backend .env Variables
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matatuconnect
DB_USER=postgres
DB_PASSWORD=postgres
PORT=5000
NODE_ENV=development
JWT_SECRET=your_secret_key
MPESA_API_URL=https://sandbox.safaricom.co.ke
CORS_ORIGIN=*
```

### Frontend Environment
- Uses Vite for environment variables
- Create `.env.local` for local overrides
- API URL defined in `src/lib/api.ts`

## Deployment Considerations

### Backend
- Use managed PostgreSQL (AWS RDS, Heroku Postgres, etc.)
- Set `NODE_ENV=production`
- Use environment variables for secrets
- Deploy to cloud platform (Heroku, AWS, DigitalOcean, etc.)

### Frontend
- Run `npm run build` to create production bundle
- Deploy `dist` folder to CDN or static hosting
- Update API URL for production backend
- Configure CORS on backend for frontend domain

## Performance Notes

### Backend
- Database queries optimized with indexes
- Connection pooling configured
- Error handling implemented
- Request validation in place

### Frontend
- Lazy loading for components
- Optimized bundle with Vite
- Tailwind CSS purged for production
- Images can be optimized further

## Security Considerations

1. **Authentication**: JWT-based, tokens expire
2. **CORS**: Currently allows all origins (configure for production)
3. **Environment Variables**: Secrets in .env files
4. **Database**: Use strong PostgreSQL passwords
5. **API Validation**: Input validation on all endpoints
6. **Error Handling**: Generic error messages to prevent info leakage

## Future Improvements

1. Implement real M-Pesa integration
2. Add SMS notifications via Africa's Talking
3. Implement WhatsApp notifications
4. Add comprehensive testing suite
5. Implement caching strategies
6. Add rate limiting
7. Enhance admin dashboard features
8. Implement user feedback analytics
9. Add real-time occupancy updates (WebSocket)
10. Mobile app version

## Support & Documentation

- Backend API docs: See `API_DOCUMENTATION.md`
- Frontend components: See component comments
- Setup guide: See `README_TESTING.md`
- Integration guide: See `frontend/INTEGRATION_GUIDE.md`

## Version Information

- **Node.js**: 16+
- **React**: 18+
- **Express**: 4.18+
- **PostgreSQL**: 12+
- **Vite**: Latest
- **TypeScript**: 5+

## Maintainers

- Backend Team
- Frontend Team
- DevOps Team

---

Last Updated: January 21, 2026
