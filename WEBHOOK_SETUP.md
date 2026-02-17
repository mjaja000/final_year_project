# WhatsApp Webhook Setup Guide

## Option 1: Using ngrok (Recommended for Testing)

### Step 1: Install ngrok

**Manual Installation:**
```bash
# Download ngrok
cd ~/Downloads
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz

# Extract and install
tar xzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/

# Verify installation
ngrok version
```

### Step 2: Start Your Backend Server

```bash
cd "/home/generalli/Desktop/files/final year project/final_year_project/backend"
npm run dev
```

Keep this terminal open.

### Step 3: Start ngrok

Open a **new terminal** and run:

```bash
ngrok http 5000
```

You'll see output like:
```
Session Status                online
Account                       ...
Version                       3.x.x
Region                        United States (us)
Latency                       ...
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123xyz.ngrok-free.app -> http://localhost:5000
```

**Copy the HTTPS URL** (e.g., `https://abc123xyz.ngrok-free.app`)

### Step 4: Configure Twilio Webhook

1. Go to: https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox

2. Under **"When a message comes in"**:
   - URL: `https://abc123xyz.ngrok-free.app/api/whatsapp/webhook`
   - HTTP Method: `POST`

3. Click **Save**

### Step 5: Test Receiving Messages

1. Send a WhatsApp message to: **+1 (415) 523-8886**
2. Message: `join break-additional`
3. Wait for confirmation
4. Send any message: `Hello!`
5. Check your backend terminal - you should see:
   ```
   [WhatsApp] Twilio webhook received: {...}
   ✓ Twilio message stored: {...}
   ```

---

## Option 2: Using Tailscale Funnel (Alternative)

If you have Tailscale installed:

```bash
# Start backend
cd "/home/generalli/Desktop/files/final year project/final_year_project/backend"
npm run dev

# In another terminal, enable funnel
tailscale funnel 5000
```

This gives you a public HTTPS URL that you can use in Twilio.

---

## Option 3: Deploy to Production

For permanent webhook (not just testing):

### Deploy to Railway.app (Free Tier)

1. Go to: https://railway.app/
2. Sign up with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your repository
5. Add environment variables from `.env`
6. Note the public URL (e.g., `https://yourapp.up.railway.app`)
7. Configure Twilio webhook: `https://yourapp.up.railway.app/api/whatsapp/webhook`

### Deploy to Render.com (Free Tier)

1. Go to: https://render.com/
2. Sign up with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your repository
5. Set build command: `cd backend && npm install`
6. Set start command: `cd backend && npm start`
7. Add environment variables
8. Note the public URL
9. Configure Twilio webhook

---

## Quick Start (Manual ngrok)

If you can't get ngrok to install automatically, download it manually:

1. Visit: https://ngrok.com/download
2. Download Linux 64-bit
3. Extract to `/usr/local/bin/`
4. Run: `ngrok http 5000`
5. Copy the HTTPS URL and add `/api/whatsapp/webhook` to the end
6. Paste into Twilio Console

---

## Troubleshooting

**ngrok not found**
- Re-download from https://ngrok.com/download
- Ensure it's in your PATH: `echo $PATH`
- Try running: `./ngrok http 5000` from download folder

**Webhook not receiving messages**
- Ensure backend is running (port 5000)
- Check ngrok is active and shows requests in terminal
- Verify URL in Twilio ends with `/api/whatsapp/webhook`
- Check backend logs for incoming requests

**403 Forbidden**
- ngrok free tier shows a warning page
- Users must click "Visit Site" button first
- For production, use a deployed URL

---

## Next Steps

Once webhook is configured:
1. Test by sending WhatsApp messages
2. Check `/api/whatsapp/messages` endpoint to see received messages
3. Implement auto-reply logic in webhook handler
