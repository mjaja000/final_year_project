# Vehicle Visibility Troubleshooting Guide

## Quick Diagnostic Checklist

If vehicles are still not appearing on the user homepage, check these items in order:

### 1. Check Backend is Running
```bash
ps aux | grep "node.*server" | grep -v grep
# Should show: node server.js

# Or check the backend terminal for:
# "✓ All database tables initialized successfully"
# "✓ Restored X vehicle locations from database"
```

### 2. Verify Database Connection
```bash
curl http://localhost:5000/health
# Expected: {"message":"API is running","timestamp":"..."}
```

### 3. Check if Drivers Have Assigned Vehicles
**This is the #1 reason vehicles don't appear!**

**SQL Query**:
```sql
SELECT u.id, u.name, u.email, u.assigned_vehicle_id, v.registration_number
FROM users u
LEFT JOIN vehicles v ON v.id = u.assigned_vehicle_id
WHERE u.role = 'driver'
ORDER BY u.id;
```

**Expected Output**:
- assigned_vehicle_id should NOT be NULL
- registration_number should show actual vehicle

**If NULL**: Driver needs to be assigned a vehicle in Admin Dashboard

### 4. Test Location API Endpoint
```bash
curl http://localhost:5000/api/locations/locations | jq '.'
```

**Expected Output**:
```json
{
  "success": true,
  "count": 1,
  "vehicles": [
    {
      "id": 1,
      "driver_name": "John Doe",
      "latitude": -1.2921,
      "longitude": 36.8219,
      "is_online": true,
      "registration_number": "KAA 123B",
      "occupancy_status": "available"
    }
  ]
}
```

**If count is 0**: See troubleshooting steps below

### 5. Check Frontend Can Reach Backend
Open browser console on user homepage and run:
```javascript
fetch('/api/locations/locations')
  .then(r => r.json())
  .then(data => console.log('Vehicles:', data))
  .catch(err => console.error('Error:', err));
```

### 6. Verify Real-Time Updates (Socket.IO)
Open browser console on user homepage:
```javascript
// Check Socket.IO connection
console.log('Socket connected:', window.io ? 'Yes' : 'No');

// Listen for location updates
const socket = io();
socket.on('connect', () => console.log('Socket connected!'));
socket.on('vehicle:locationUpdate', (data) => {
  console.log('Vehicle update:', data);
});
```

---

## Detailed Troubleshooting

### Problem: `count: 0` in API Response

#### **Cause A: No Drivers Have Shared Location Yet**

**Solution**: Have a driver log in and share location

**Steps**:
1. Open Driver Dashboard: `http://localhost:8080/driver/login`
2. Login with driver credentials
3. Click "Allow" when browser asks for location permission
4. Click "Go Online" button
5. Verify location appears on driver's map

**Check**:
```bash
# After driver shares location
curl http://localhost:5000/api/locations/locations
# Should now show count: 1
```

#### **Cause B: Driver Not Assigned to Vehicle**

**Symptoms**:
- Driver can login successfully
- Driver shares location
- API call returns 400: "No vehicle assigned to driver"

**Solution**:
1. Login as Admin
2. Go to Admin Dashboard → Drivers
3. Click "Assign Vehicle" for the driver
4. Select a vehicle from the dropdown
5. Save

**Or via SQL**:
```sql
-- Assign vehicle ID 1 to driver with user ID 49
UPDATE users 
SET assigned_vehicle_id = 1 
WHERE id = 49 AND role = 'driver';
```

#### **Cause C: Server Restarted and Map Not Restored**

**Symptoms**:
- Vehicles were visible before
- After server restart, count is 0
- Backend logs don't show: "✓ Restored X vehicle locations"

**Check Logs**:
```bash
# Look for this in backend terminal:
# "✓ Restored 3 vehicle locations from database"

# If missing, check for errors:
# "Note: Could not restore vehicle locations from database: ..."
```

**Solutions**:
1. **If no error**: No vehicles in database yet (normal on first run)
2. **If error**: Check database connection or vehicle_locations table

**Manual Test**:
```bash
# Check if vehicle_locations table has data
curl -s "http://localhost:5000/api/locations/locations" | jq '.count'
# If 0, have drivers share location again
```

#### **Cause D: Vehicle Location Too Old**

The restoration query only fetches locations from the last 2 hours.

**Check**:
```sql
SELECT COUNT(*) 
FROM vehicle_locations 
WHERE recorded_at > NOW() - INTERVAL '2 hours';
```

**If 0**: Vehicles haven't updated in 2+ hours. Drivers need to share location again.

**Solution**: Reduce interval if needed (in locationController.js line 23):
```javascript
WHERE vl.recorded_at > NOW() - INTERVAL '24 hours'  -- Increased to 24 hours
```

---

### Problem: Frontend Shows Empty Map

#### **Cause A: CORS Error**

**Symptoms** (Browser Console):
```
Access to fetch at 'http://localhost:5000/api/locations/locations' 
from origin 'https://localhost:8080' has been blocked by CORS policy
```

**Solution**:
1. Check backend CORS configuration
2. Ensure VITE_API_URL is empty in `frontend/.env`
3. Let Vite proxy handle requests

**Test**:
```bash
# Check if proxy is working
curl https://localhost:8080/api/locations/locations
```

#### **Cause B: Frontend Not Fetching**

**Check** (Browser Console):
- Network tab → Filter by "locations"
- Should see request to `/api/locations/locations`
- Status should be 200

**If No Request**:
- Component may not be mounted
- Check React component lifecycle

**If 401/403**:
- Authentication issue (shouldn't happen for public endpoint)

**If 500**:
- Backend error - check server logs

#### **Cause C: Frontend Filters Out Vehicles**

**Check** (LiveVehicleMap.tsx line 194):
```tsx
const onlineVehicles = vehicles.filter(v => v.is_online);
```

**Debug** (Browser Console):
```javascript
// Check raw data from API
fetch('/api/locations/locations')
  .then(r => r.json())
  .then(data => {
    console.log('All vehicles:', data.vehicles);
    console.log('Online vehicles:', data.vehicles.filter(v => v.is_online));
  });
```

**If is_online is false**:
- Driver sent `status: 'offline'`
- Fixed in latest commit (defaults to online)

---

### Problem: Vehicles Appear But No "Nearest Vehicle"

#### **Cause A: User Location Not Shared**

**Symptoms**:
- Map shows vehicles (green markers)
- No blue marker for user location
- "Find Nearest Vehicle" button shows no result

**Solution**:
1. Click "Find Nearest Vehicle" button
2. Click "Allow" when browser asks for location
3. Blue marker should appear
4. Yellow pulsing marker shows nearest vehicle

#### **Cause B: All Vehicles are Full**

**Check** (LiveVehicleMap.tsx line 163):
```tsx
const availableVehicles = vehicles.filter(
  v => v.is_online && v.occupancy_status !== 'full'
);
```

**Solution**:
- Driver needs to update occupancy status
- Or manually set occupancy to "available"

---

## Common Error Messages

### "No vehicle assigned to driver"
**Meaning**: Driver's `assigned_vehicle_id` is NULL

**Fix**: Assign vehicle via Admin Dashboard or SQL update

### "Invalid token" / "Token expired"
**Meaning**: Driver's JWT token is invalid or expired

**Fix**: Log out and log in again

### "customer_locations table does not exist"
**Meaning**: Missing table (already fixed in recent commit)

**Fix**: Restart backend to create table

### "Unauthorized"
**Meaning**: Driver not sending JWT token or wrong format

**Fix**: Check Authorization header format: `Bearer <token>`

---

## Manual Testing Script

Save as `test_vehicle_visibility.sh`:

```bash
#!/bin/bash

echo "=== Vehicle Visibility Test ==="

# 1. Check backend health
echo -e "\n1. Backend Health Check"
HEALTH=$(curl -s http://localhost:5000/health)
echo "$HEALTH" | jq '.'

# 2. Check vehicle locations
echo -e "\n2. Vehicle Locations API"
LOCATIONS=$(curl -s http://localhost:5000/api/locations/locations)
echo "$LOCATIONS" | jq '.'
COUNT=$(echo "$LOCATIONS" | jq -r '.count')

if [ "$COUNT" = "0" ]; then
  echo "⚠️  No vehicles found!"
  echo "Possible reasons:"
  echo "  - No drivers have shared location yet"
  echo "  - Drivers not assigned to vehicles"
  echo "  - Server recently restarted and no recent locations in DB"
else
  echo "✓ Found $COUNT vehicles"
fi

# 3. Check frontend accessibility
echo -e "\n3. Frontend Proxy Test"
curl -sk https://localhost:8080/api/locations/locations | jq '.' 2>/dev/null || echo "❌ Frontend not accessible"

echo -e "\n=== Test Complete ==="
```

Run: `chmod +x test_vehicle_visibility.sh && ./test_vehicle_visibility.sh`

---

## Next Steps if Still Not Working

1. **Restart Backend Server**
   ```bash
   # Stop: Ctrl+C
   # Start: npm run dev
   ```

2. **Check Backend Logs**
   - Look for errors during startup
   - Check if restoration succeeded

3. **Verify Driver Assignment**
   ```sql
   SELECT * FROM users WHERE role = 'driver' AND assigned_vehicle_id IS NOT NULL;
   ```

4. **Have Driver Share Location**
   - Login as driver
   - Click "Go Online"
   - Check if location appears in API

5. **Check Browser Console**
   - Network tab for API errors
   - Console for JavaScript errors
   - Socket.IO connection status

---

## Summary of Recent Fixes

### Commit: 24ab36b
**Fix**: authMiddleware now sets both `req.userId` and `req.user.id`
**Impact**: Location updates now work (was failing with 401)

### Commit: 5f66b17
**Fix**: Restore vehicle locations from database on startup
**Impact**: Vehicles persist across server restarts

### What's Working Now:
✅ Driver location updates save to database
✅ Locations restored on server startup
✅ Default to online status when sharing location
✅ Frontend receives vehicle data
✅ Real-time updates via Socket.IO

### What to Check:
⚠️ Drivers must have assigned_vehicle_id set
⚠️ Drivers must share location (click "Go Online")
⚠️ Server must be running and database connected
