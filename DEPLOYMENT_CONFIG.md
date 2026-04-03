# Deployment Configuration

## URLs Configuration

### Frontend (Vercel)
- **URL**: https://matconnect-client.vercel.app/
- **Environment**: Production

### Backend (Render)
- **URL**: https://final-year-project-wzom.onrender.com/
- **Environment**: Production

## Configuration Changes Made

### 1. Frontend Configuration (`frontend/.env`)
```env
VITE_API_URL=https://final-year-project-wzom.onrender.com
```

This tells the frontend to connect to your production backend on Render.

### 2. Backend Configuration (`backend/.env`)

#### CORS Settings
```env
CORS_ORIGIN=https://matconnect-client.vercel.app
```

This allows your Vercel frontend to make requests to the backend.

#### Environment
```env
NODE_ENV=production
```

This sets the backend to run in production mode.

#### M-Pesa Callback URL
```env
MPESA_CALLBACK_URL=https://final-year-project-wzom.onrender.com/api/payments/mpesa/callback
```

Updated to use your production backend URL instead of ngrok.

## Deployment Checklist

### Backend (Render)
- [ ] Ensure all environment variables from `backend/.env` are set in Render dashboard
- [ ] Particularly important:
  - Database credentials (PGHOST, PGDATABASE, PGUSER, PGPASSWORD)
  - JWT_SECRET
  - CORS_ORIGIN=https://matconnect-client.vercel.app
  - NODE_ENV=production
  - M-Pesa credentials
  - Twilio WhatsApp credentials

### Frontend (Vercel)
- [ ] Ensure environment variables are set in Vercel dashboard:
  - VITE_API_URL=https://final-year-project-wzom.onrender.com
- [ ] Rebuild and redeploy after setting environment variables

## Testing

After deployment, test the following:

1. **Health Check**
   ```bash
   curl https://final-year-project-wzom.onrender.com/health
   ```

2. **CORS**
   - Visit https://matconnect-client.vercel.app/
   - Open browser console
   - Check for CORS errors (there should be none)

3. **WebSocket Connection**
   - Check real-time features (vehicle tracking, occupancy updates)
   - Verify Socket.IO connections in browser dev tools

4. **API Calls**
   - Test login/authentication
   - Test data fetching from frontend

## Important Notes

1. **Render Free Tier**: Backend may sleep after 15 minutes of inactivity. First request after sleep will be slow (30-60 seconds).

2. **Database**: Using Neon cloud PostgreSQL. Connection pooling is configured for production.

3. **HTTPS**: Both frontend and backend use HTTPS, ensuring secure communication.

4. **WebSocket**: Socket.IO is configured to work with CORS for real-time features.

## Troubleshooting

### CORS Errors
- Verify CORS_ORIGIN in Render environment variables matches exactly: `https://matconnect-client.vercel.app` (no trailing slash)
- Check backend logs in Render dashboard

### Connection Errors
- Ensure backend is awake (visit health endpoint)
- Check VITE_API_URL in Vercel environment variables
- Verify no trailing slashes in URLs

### M-Pesa Callback Issues
- Ensure MPESA_CALLBACK_URL in Render points to: `https://final-year-project-wzom.onrender.com/api/payments/mpesa/callback`
- Update callback URL in Safaricom Daraja portal if needed
