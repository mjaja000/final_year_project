# 🔐 MatatuConnect Admin Credentials

## Production Environment

**Frontend:** https://matconnect-client.vercel.app/
**Backend:**  https://final-year-project-wzom.onrender.com/

## Admin Login Credentials

```
Email:    admin@matatuconnect.real
Password: Admin@Matatu2024!
```

## Login Endpoint

**URL:** `https://final-year-project-wzom.onrender.com/api/auth/login`

**Method:** POST

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "email": "admin@matatuconnect.real",
  "password": "Admin@Matatu2024!"
}
```

## Test Results

✅ **Status:** Login tested and working on production (HTTP 200)
✅ **Response:** Successful authentication with JWT token
✅ **User Role:** admin
✅ **User ID:** 1

## Quick Test Command

```bash
curl -X POST https://final-year-project-wzom.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@matatuconnect.real","password":"Admin@Matatu2024!"}'
```

## User Details

- **ID:** 1
- **Name:** System Administrator
- **Email:** admin@matatuconnect.real
- **Username:** admin
- **Role:** admin
- **Status:** active

---
*Last tested: 2026-04-03*
*Environment: Production (Render + Vercel)*
