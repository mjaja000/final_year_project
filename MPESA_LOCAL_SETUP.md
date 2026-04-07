# M-Pesa Local Setup Guide

## Quick Steps to Get M-Pesa Working Locally

### Step 1: Start ngrok
Run this command in a **separate terminal window**:
```bash
ngrok http 5000
```

Or use the helper script:
```bash
start-ngrok.bat
```

### Step 2: Copy Your ngrok URL
Once ngrok starts, you'll see something like:
```
Forwarding  https://abc123-xyz456.ngrok-free.app -> http://localhost:5000
```

**Copy the HTTPS URL** (e.g., `https://abc123-xyz456.ngrok-free.app`)

### Step 3: Update backend\.env
Open `backend\.env` and update line 51:

**Change from:**
```env
MPESA_CALLBACK_URL=https://maryland-suspendible-unexpansively.ngrok-free.dev/api/payments/mpesa/callback
```

**Change to:**
```env
MPESA_CALLBACK_URL=https://YOUR-NEW-NGROK-URL.ngrok-free.app/api/payments/mpesa/callback
```

Replace `YOUR-NEW-NGROK-URL` with the URL you copied from ngrok.

### Step 4: Restart Your Backend Server
```bash
cd backend
npm start
```

### Step 5: Test M-Pesa
Your M-Pesa integration should now work! When you initiate a payment:
1. STK push will be sent to your phone
2. Safaricom will send the callback to your ngrok URL
3. ngrok forwards it to your local backend
4. Payment status updates in your database

## Important Notes

- **Keep ngrok running** while testing M-Pesa
- **ngrok URL changes** each time you restart ngrok (unless you have a paid account)
- **Update the callback URL** in `backend\.env` whenever you restart ngrok
- For testing without real M-Pesa, keep `PAYMENT_ASSUME_SUCCESS=true` in your .env

## Alternative: Use M-Pesa Sandbox Simulation

If you don't want to deal with callbacks right now, you can test payments in simulation mode:

In `backend\.env`, ensure this is set:
```env
PAYMENT_ASSUME_SUCCESS=true
```

This will simulate successful payments without needing M-Pesa callbacks.

## Troubleshooting

### ngrok says "command not found"
- Download from: https://ngrok.com/download
- Extract the ZIP and add to your PATH
- Or run directly: `C:\path\to\ngrok.exe http 5000`

### M-Pesa callback not working
1. Check ngrok is running
2. Verify the callback URL in `backend\.env` matches your ngrok URL
3. Check backend logs for callback requests
4. Ensure your ngrok URL starts with `https://` (not `http://`)

### Need a permanent URL?
- Sign up for ngrok (free tier): https://dashboard.ngrok.com/signup
- Get a static domain or reserved subdomain
- Use it in your callback URL permanently
