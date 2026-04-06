# HTTPS Setup Guide for MatatuConnect

This guide explains how to set up and use HTTPS for local development with MatatuConnect.

## Table of Contents
- [Why HTTPS for Local Development?](#why-https-for-local-development)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Advanced Configuration](#advanced-configuration)

---

## Why HTTPS for Local Development?

Running your development server with HTTPS provides several benefits:

1. **Production Parity**: Matches production environment more closely
2. **No Mixed Content Errors**: Avoids browser security warnings when frontend is HTTPS
3. **Service Workers**: Required for PWA features and service worker testing
4. **Secure Contexts**: Required for many modern browser APIs (geolocation, camera, etc.)
5. **Mobile Testing**: Test on mobile devices without certificate warnings

---

## Quick Start

### 1. Install mkcert (one-time setup)

**macOS:**
```bash
brew install mkcert
brew install nss  # For Firefox support
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt install libnss3-tools
wget https://dl.filippo.io/mkcert/latest?for=linux/amd64 -O mkcert
chmod +x mkcert
sudo mv mkcert /usr/local/bin/
```

**Linux (Arch):**
```bash
sudo pacman -S mkcert
```

**Linux (Fedora):**
```bash
sudo dnf install mkcert
```

**Windows:**
```bash
winget install FiloSottile.mkcert
```

Or download from: https://github.com/FiloSottile/mkcert/releases

### 2. Generate Certificates

From the project root:
```bash
cd frontend
npm run setup:https
```

This will:
- Install the local Certificate Authority (CA) on your system
- Generate trusted SSL certificates in `frontend/.cert/`
- Configure your system to trust these certificates

### 3. Run with HTTPS

```bash
npm run dev:https
```

Or simply:
```bash
npm run dev
```
(Auto-enables HTTPS when certificates exist)

### 4. Access Your App

Open your browser to:
```
https://localhost:8080
```

✅ No certificate warnings!
✅ Fully trusted by your browser!

---

## Detailed Setup

### Certificate Generation Process

The `setup:https` script does the following:

1. **Checks for mkcert**: Verifies that mkcert is installed and accessible
2. **Creates .cert directory**: Creates `frontend/.cert/` if it doesn't exist
3. **Installs CA**: Runs `mkcert -install` to add the local CA to your system
4. **Generates certificates**: Creates `cert.pem` and `key.pem` for localhost
5. **Configures domains**: Certificates are valid for:
   - `localhost`
   - `127.0.0.1`
   - `::1` (IPv6 localhost)

### What Gets Created

```
frontend/
├── .cert/
│   ├── cert.pem    # SSL certificate
│   └── key.pem     # Private key
└── scripts/
    └── setup-dev-cert.mjs
```

**Important**: The `.cert/` directory is gitignored and should never be committed!

---

## Usage

### Available npm Scripts

```bash
# Auto-detect: Uses HTTPS if certificates exist
npm run dev

# Force HTTPS (uses mkcert certs or falls back to basic SSL)
npm run dev:https

# Force HTTP (disables HTTPS)
npm run dev:http

# Generate/regenerate certificates
npm run setup:https
```

### Environment Variables

In `frontend/.env`:

```bash
# Force HTTPS on/off (overrides auto-detection)
VITE_DEV_HTTPS=true   # Force HTTPS
VITE_DEV_HTTPS=false  # Force HTTP
# (omit for auto-detection)

# API URL (leave empty for proxy, recommended)
VITE_API_URL=
```

### How Auto-Detection Works

1. If `VITE_DEV_HTTPS=true` → **HTTPS enabled**
2. If `VITE_DEV_HTTPS=false` → **HTTP only**
3. If not set and certificates exist → **HTTPS enabled**
4. If not set and no certificates → **HTTP only**

### Certificate Priority

When HTTPS is enabled:

1. **mkcert certificates** (`.cert/cert.pem` and `.cert/key.pem`)
   - ✅ Fully trusted by browser
   - ✅ No warnings
   - ✅ Best development experience

2. **Basic SSL fallback** (if no mkcert certs)
   - ⚠️ Self-signed certificate
   - ⚠️ Browser warnings expected
   - ⚠️ Must manually accept certificate

---

## Troubleshooting

### Problem: Certificate warnings in browser

**Symptoms**: Browser shows "Your connection is not private" or similar warning

**Solution**:
```bash
cd frontend
npm run setup:https
```

Then restart the dev server and reload the page.

**Why it happens**: You're using basic SSL fallback instead of mkcert certificates.

---

### Problem: "mkcert is not installed"

**Symptoms**: Setup script fails with "mkcert is not installed or not in PATH"

**Solution**: Install mkcert for your platform (see [Quick Start](#quick-start))

**Verification**:
```bash
mkcert -help
```

Should display mkcert help text.

---

### Problem: Mixed content errors

**Symptoms**: Console shows "Mixed Content: The page at 'https://...' was loaded over HTTPS..."

**Solution**: Ensure `VITE_API_URL` is empty in `frontend/.env`

```bash
# frontend/.env
VITE_API_URL=
```

**Why it happens**: When the API URL is set to an HTTP address, the browser blocks requests from the HTTPS frontend.

**How the proxy solves it**:
- Frontend makes requests to `/api` (relative URL)
- Vite proxy forwards to `http://localhost:5000`
- Browser only sees HTTPS requests
- No mixed content errors!

---

### Problem: Certificate expired or invalid

**Symptoms**: Browser suddenly shows warnings after previously working

**Solution**: Regenerate certificates
```bash
cd frontend
npm run setup:https
```

**Why it happens**: mkcert certificates have an expiration date (usually 1-2 years).

---

### Problem: Certificates not working on mobile device

**Symptoms**: Mobile browser shows certificate warning when accessing `https://<your-ip>:8080`

**Solution**: 
1. Generate certificates for your local IP:
```bash
cd frontend/.cert
mkcert localhost 127.0.0.1 ::1 192.168.x.x
```
(Replace `192.168.x.x` with your actual IP)

2. Install mkcert CA on mobile device:
   - Find CA location: `mkcert -CAROOT`
   - Transfer `rootCA.pem` to device
   - Install as trusted certificate

---

### Problem: "Address already in use"

**Symptoms**: Dev server fails to start with EADDRINUSE error

**Solution**: Port 8080 is already in use. Either:
1. Stop the other process using port 8080
2. Change the port in `vite.config.ts`

**Find what's using the port**:
```bash
# Linux/Mac
lsof -i :8080

# Windows
netstat -ano | findstr :8080
```

---

### Problem: Backend API calls fail with CORS errors

**Symptoms**: Browser console shows CORS policy errors

**Solution**: This is a backend configuration issue, not HTTPS-related. See `CORS_FINAL_SOLUTION.md` for details.

**Quick check**: Ensure backend is running on `http://localhost:5000`

---

### Problem: WebSocket connection fails

**Symptoms**: Socket.io connection errors in console

**Solution**: Ensure backend is running and the proxy is configured correctly.

**Verify**:
1. Backend is running on port 5000
2. Vite config has `/socket.io` proxy configured
3. Backend CORS allows the frontend origin

---

## Advanced Configuration

### Customizing Certificate Domains

Edit `frontend/scripts/setup-dev-cert.mjs` and modify the domains array:

```javascript
runMkcert([
  "-key-file", keyPath,
  "-cert-file", certPath,
  "localhost",
  "127.0.0.1",
  "::1",
  "myapp.local",        // Add custom domain
  "192.168.1.100",      // Add your IP
]);
```

Then run `npm run setup:https` again.

---

### Using Custom Certificates

If you have your own SSL certificates:

1. Place them in `frontend/.cert/`:
   - `cert.pem` - Certificate file
   - `key.pem` - Private key file

2. Vite will automatically use them

---

### Backend HTTPS (Optional)

For production-like testing, you can run the backend on HTTPS too:

**See**: `backend-https` todo (optional enhancement)

---

### Production Deployment

**Important**: This setup is for **development only**!

For production:
1. Use proper SSL certificates (Let's Encrypt, commercial CA, etc.)
2. Configure your web server (Nginx, Apache) or hosting platform
3. Set `VITE_API_URL` to your production API URL
4. Build the app: `npm run build`

---

## Architecture Overview

### Development Flow

```
Browser (https://localhost:8080)
    ↓
Frontend (Vite Dev Server with HTTPS)
    ↓
Vite Proxy (/api, /socket.io, /uploads)
    ↓
Backend (HTTP on localhost:5000)
    ↓
Database (Neon Cloud with SSL)
```

### Key Points

1. **Frontend**: Always HTTPS in development (when certificates exist)
2. **Proxy**: Bridges HTTPS frontend → HTTP backend
3. **Backend**: Can stay on HTTP for simpler development
4. **Database**: Uses SSL in production (Neon Cloud)

---

## Best Practices

### ✅ Do:
- Use `npm run setup:https` once per machine/project
- Keep `.cert/` in `.gitignore`
- Use the Vite proxy for API calls
- Regenerate certificates if they expire
- Test on mobile devices with proper certificate setup

### ❌ Don't:
- Commit `.cert/` directory to git
- Use production certificates for development
- Hardcode API URLs in code
- Skip HTTPS for features requiring secure context
- Share your private keys

---

## Security Notes

1. **Local CA Trust**: The mkcert CA is only trusted on your machine
2. **Private Keys**: Certificate private keys are local to your machine
3. **Not for Production**: mkcert certificates are for development only
4. **Browser Trust**: Certificates are trusted without warnings
5. **Safe Sharing**: Safe to share code - certificates are gitignored

---

## Additional Resources

- [mkcert GitHub](https://github.com/FiloSottile/mkcert)
- [Vite HTTPS Configuration](https://vitejs.dev/config/server-options.html#server-https)
- [Why HTTPS for localhost?](https://web.dev/when-to-use-local-https/)
- [Mixed Content Explained](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content)

---

## Support

If you encounter issues not covered here:

1. Check the browser console for error messages
2. Check the Vite dev server logs
3. Verify backend is running: `curl http://localhost:5000/api`
4. Review `HTTPS_FIX_SUMMARY.md` for mixed content solutions
5. Check `CORS_FINAL_SOLUTION.md` for CORS-related issues

---

**Last Updated**: March 2026
**MatatuConnect Development Team**
