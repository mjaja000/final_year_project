# Frontend-Backend Integration Guide

## ✅ Setup Complete!

Your frontend is now configured to connect to your backend running at `http://localhost:5000`.

## 📁 Files Created/Modified

1. **`src/lib/api.ts`** - API service layer with all backend endpoints
2. **`.env.local`** - Environment configuration for API URL
3. **`vite.config.ts`** - Added proxy configuration for development
4. **`src/pages/Index.tsx`** - Updated to fetch routes from backend

## 🚀 How to Run

### 1. Start the Backend
```bash
cd C:\Users\Peter Muriithi\final_year_project_backend
node server.js
```
The backend should be running on http://localhost:5000

### 2. Start the Frontend
Open a new terminal:
```bash
cd C:\Users\Peter Muriithi\final_year_project_front\front\ride-aid-kenya
npm run dev
```
The frontend will run on http://localhost:8080

## 🔌 API Usage Examples

### Using React Query (Recommended)
```tsx
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';

// Fetch data
function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['routes'],
    queryFn: api.routes.getAll,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{/* render data */}</div>;
}

// Create/Update data
function CreateRoute() {
  const mutation = useMutation({
    mutationFn: api.routes.create,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
  });

  const handleSubmit = (formData) => {
    mutation.mutate(formData);
  };
}
```

### Using async/await
```tsx
import api from '@/lib/api';

async function fetchRoutes() {
  try {
    const routes = await api.routes.getAll();
    console.log(routes);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

## 📡 Available API Methods

### Routes
- `api.routes.getAll()` - Get all routes
- `api.routes.getById(id)` - Get route by ID
- `api.routes.create(data)` - Create new route
- `api.routes.update(id, data)` - Update route
- `api.routes.delete(id)` - Delete route

### Vehicles
- `api.vehicles.getAll()` - Get all vehicles
- `api.vehicles.getById(id)` - Get vehicle by ID
- `api.vehicles.getByRoute(routeId)` - Get vehicles by route
- `api.vehicles.create(data)` - Create new vehicle
- `api.vehicles.update(id, data)` - Update vehicle
- `api.vehicles.delete(id)` - Delete vehicle

### Occupancy
- `api.occupancy.getByVehicle(vehicleId)` - Get occupancy status
- `api.occupancy.update(vehicleId, { current_occupancy })` - Update occupancy

### Payments
- `api.payments.create(data)` - Create new payment
- `api.payments.getAll()` - Get all payments
- `api.payments.getById(id)` - Get payment by ID

### Feedback
- `api.feedback.create(data)` - Submit feedback
- `api.feedback.getAll()` - Get all feedback
- `api.feedback.getById(id)` - Get feedback by ID

### Users/Admin
- `api.users.login({ username, password })` - Admin login
- `api.users.register(data)` - Register new user

## 🔧 Configuration

### Change Backend URL
Edit `.env.local`:
```env
VITE_API_URL=http://your-backend-url:port
```

### Development vs Production
- **Development**: Uses proxy in `vite.config.ts` → requests go to http://localhost:5000
- **Production**: Set `VITE_API_URL` environment variable before building

## 🐛 Troubleshooting

### CORS Errors
If you see CORS errors:
1. Make sure your backend has CORS enabled
2. The proxy in `vite.config.ts` should handle this in development
3. Check your backend's CORS configuration allows `http://localhost:8080`

### Connection Refused
- Ensure backend is running on port 5000
- Check firewall settings
- Verify the URL in `.env.local` is correct

### Data Not Showing
1. Open browser DevTools → Network tab
2. Check if API requests are being made
3. Look at the response data
4. Check for errors in the Console tab

## 📝 Example: Update Other Pages

### Occupancy Page
```tsx
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

function Occupancy() {
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: api.vehicles.getAll,
  });

  // Use vehicles data...
}
```

### Admin Login
```tsx
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';

function AdminLogin() {
  const loginMutation = useMutation({
    mutationFn: api.users.login,
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      navigate('/admin/dashboard');
    },
  });

  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };
}
```

## 🎯 Next Steps

1. ✅ Backend is running
2. ✅ Frontend is configured
3. ✅ API service created
4. ✅ Example implementation done (Index page)
5. 🔲 Update other pages (Occupancy, Payment, Feedback, AdminDashboard)
6. 🔲 Add authentication/authorization
7. 🔲 Add error handling and loading states
8. 🔲 Test all functionality

## 📞 Testing the Connection

Visit http://localhost:8080 and:
- The homepage should load routes from your database
- Open DevTools → Network tab
- You should see a request to `/api/routes`
- If routes exist in your database, they will display

If you don't have routes yet, add some from your backend or create an admin interface!
