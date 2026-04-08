import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { AlertCircle, CheckCircle, Circle, CreditCard, LogOut, Mail, MapPin, Minus, Navigation, Phone, Plus, Printer, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PaymentDialog from '@/components/PaymentDialog';
import createAppSocket from '@/lib/socket';

const API_BASE = import.meta.env.VITE_API_URL || '';
const socket = createAppSocket();

export default function DriverDashboard() {
  const [driver, setDriver] = useState<any>(null);
  const [status, setStatus] = useState('offline');
  const { toast } = useToast();
  const navigate = useNavigate();
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const locationWatchId = useRef<number | null>(null);

  const [trip, setTrip] = useState<any>(null);
  const [driverOccupancy, setDriverOccupancy] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [adminUser, setAdminUser] = useState<any>(null);
  const [adminTyping, setAdminTyping] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);
  const lastTypingRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const driverIdRef = useRef<number | null>(null);
  const adminIdRef = useRef<number | null>(null);
  const vehicleIdRef = useRef<number | null>(null);
  const vehicleRegRef = useRef<string>('');
  
  // Payment dialog state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(50);

  const resolveFareValue = (...values: any[]) => {
    for (const value of values) {
      const num = Number(value);
      if (Number.isFinite(num) && num > 0) return num;
    }
    return null;
  };

  const normalizePlate = (value: any) =>
    String(value || '')
      .toUpperCase()
      .replace(/[-\s]/g, '');

  const fetchVehicleTickets = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const ticketsRes = await fetch(API_BASE + '/api/drivers/me/tickets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json();
        setTickets(ticketsData.tickets || []);
      }
    } catch (ticketsError) {
      console.error('Error fetching tickets:', ticketsError);
    }
  };

  const refreshDriverData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await fetch(API_BASE + '/api/auth/profile', { headers });
      const data = await res.json();
      if (res.ok) {
        console.log('🔄 Refreshed driver profile data:', data.user);
        setDriver(data.user);
        toast({ title: 'Profile refreshed', description: 'Vehicle assignment updated' });
      }
    } catch (err) {
      console.error('Error refreshing driver data:', err);
      toast({ title: 'Refresh failed', description: 'Could not update profile', variant: 'destructive' });
    }
  };

  useEffect(() => {
    driverIdRef.current = driver?.id ?? null;
    vehicleIdRef.current = driver?.assigned_vehicle_id ?? null;
    vehicleRegRef.current = driver?.vehicle_reg ?? '';
  }, [driver]);

  useEffect(() => {
    adminIdRef.current = adminUser?.id ?? null;
  }, [adminUser]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    (async () => {
      try {
        const res = await fetch(API_BASE + '/api/auth/profile', { headers });
        const data = await res.json();
        if (res.ok) {
          console.log('Driver profile data:', data.user);
          console.log('Assigned vehicle ID:', data.user?.assigned_vehicle_id);
          console.log('Vehicle registration:', data.user?.vehicle_reg);
          setDriver(data.user);
        } else {
          console.error('Failed to fetch profile:', data);
        }

        // fetch active trip
        let tripData: any = null;
        const tRes = await fetch(API_BASE + '/api/drivers/me/trip', { headers });
        if (tRes.ok) {
          const tdata = await tRes.json();
          tripData = tdata?.trip || null;
          setTrip(tripData);
        } else {
          setTrip(null);
        }

        // fetch assigned vehicle occupancy context (works even without active trip)
        const oRes = await fetch(API_BASE + '/api/drivers/me/occupancy', { headers });
        if (oRes.ok) {
          const odata = await oRes.json();
          if (odata?.trip) {
            setTrip(odata.trip);
          }
          setDriverOccupancy(odata?.occupancy || null);

          // Keep payment amount aligned with the assigned vehicle route fare shown in occupancy context
          let routeIdForFare = Number(
            odata?.trip?.route_id ||
            tripData?.route_id ||
            data?.user?.route_id ||
            0
          );

          const inlineFare = resolveFareValue(
            odata?.trip?.base_fare,
            odata?.trip?.fare,
            tripData?.base_fare,
            tripData?.fare,
            data?.user?.base_fare,
            data?.user?.fare
          );

          if (inlineFare) {
            setPaymentAmount(inlineFare);
          } else {
            if (routeIdForFare <= 0 && data?.user?.assigned_vehicle_id) {
              try {
                const vehicleRes = await fetch(API_BASE + `/api/vehicles/${data.user.assigned_vehicle_id}`, { headers });
                if (vehicleRes.ok) {
                  const vehicleData = await vehicleRes.json();
                  const vehicle = vehicleData?.vehicle || vehicleData;
                  routeIdForFare = Number(vehicle?.route_id || routeIdForFare || 0);
                }
              } catch {
                // keep fallback value
              }
            }

            if (routeIdForFare > 0) {
            try {
              const routeRes = await fetch(API_BASE + `/api/routes/${routeIdForFare}`, { headers });
              if (routeRes.ok) {
                const routeData = await routeRes.json();
                const route = routeData?.route || routeData;
                const fetchedFare = resolveFareValue(route?.base_fare, route?.baseFare, route?.fare, route?.price);
                if (fetchedFare) {
                  setPaymentAmount(fetchedFare);
                }
              }
            } catch {
              // keep existing amount if route fare fetch fails
            }
            }
          }
        }

        await fetchVehicleTickets();

        // fetch admin user for chat routing
        try {
          const aRes = await fetch(API_BASE + '/api/messages/admin-user', { headers });
          if (aRes.ok) {
            const adata = await aRes.json();
            setAdminUser(adata.admin || null);
          }
        } catch (e) {
          // ignore
        }
      } catch (err) {
        // ignore
      }
    })();

    socket.on('connect', () => {
      console.log('socket connected', socket.id);
      // join my user room
      const tokenStr = localStorage.getItem('token');
      try {
        if (tokenStr) {
          const payload = JSON.parse(decodeURIComponent(escape(atob(String(tokenStr).split('.')[1] || ''))));
          if (payload && payload.id) socket.emit('chat.join', payload.id);
        }
      } catch (e) {
        // ignore invalid token
      }
    });

    socket.on('chat.message', (m: any) => {
      console.log('received chat.message', m);
      setMessages(prev => [...prev, m]);
      if (driverIdRef.current && m.receiver_id === driverIdRef.current && m.id) {
        markMessagesRead([m.id]);
      }
    });

    socket.on('chat.notification', (n: any) => {
      console.log('chat.notification', n);
      toast({ title: 'New chat', description: n.message || 'New chat message' });
    });

    socket.on('chat.typing', (payload: any) => {
      const driverId = driverIdRef.current;
      const adminId = adminIdRef.current;
      if (!driverId) return;
      if (payload.receiverId !== driverId) return;
      if (adminId && payload.senderId === adminId) {
        setAdminTyping(Boolean(payload.isTyping));
      }
    });

    socket.on('driver.statusUpdated', (payload: any) => {
      console.log('driver.statusUpdated', payload);
    });

    socket.on('vehicle.occupancyUpdated', (payload: any) => {
      if (!payload) return;
      // Update local occupancy state when a payment triggers it
      const updatedVehicleId = Number(payload.vehicle_id);
      const myVehicleId = Number(vehicleIdRef.current || 0);
      setDriverOccupancy((prev: any) => {
        const prevVehicleId = Number(prev?.vehicle_id ?? driver?.assigned_vehicle_id);
        if (prevVehicleId && prevVehicleId === updatedVehicleId) {
          return { ...(prev || {}), current_occupancy: payload.current_occupancy, capacity: payload.capacity };
        }
        return prev;
      });
      setTrip((prev: any) => {
        if (prev && Number(prev.vehicle_id) === updatedVehicleId) {
          return { ...prev, current_occupancy: payload.current_occupancy, capacity: payload.capacity };
        }
        return prev;
      });
      if (myVehicleId && myVehicleId === updatedVehicleId) {
        fetchVehicleTickets();
      }
      toast({ title: 'Passenger boarded', description: `Occupancy: ${payload.current_occupancy} / ${payload.capacity}` });
    });

    socket.on('payment.statusUpdated', (payload: any) => {
      if (!payload) return;
      const myVehicleId = Number(vehicleIdRef.current || 0);
      const payloadVehicleId = Number(payload.vehicle_id || 0);
      const myVehicleReg = normalizePlate(vehicleRegRef.current);
      const payloadVehicleReg = normalizePlate(payload.vehicle_number);
      const isMyVehicle =
        (myVehicleId && payloadVehicleId && myVehicleId === payloadVehicleId) ||
        (myVehicleReg && payloadVehicleReg && myVehicleReg === payloadVehicleReg);
      if (
        isMyVehicle &&
        String(payload.status || '').toLowerCase() === 'completed'
      ) {
        fetchVehicleTickets();
      }
    });

    return () => {
      socket.off('driver.statusUpdated');
      socket.off('vehicle.occupancyUpdated');
      socket.off('chat.message');
      socket.off('chat.notification');
      socket.off('chat.typing');
      socket.off('payment.statusUpdated');
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, adminTyping]);

  useEffect(() => {
    const derivedFare = resolveFareValue((trip as any)?.base_fare, (trip as any)?.fare);
    if (derivedFare) {
      setPaymentAmount(derivedFare);
    }
  }, [trip]);

  useEffect(() => {
    if (!adminUser?.id) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    (async () => {
      try {
        const mRes = await fetch(API_BASE + `/api/messages/conversation?otherId=${adminUser.id}`, { headers });
        if (mRes.ok) {
          const mdata = await mRes.json();
          setMessages(mdata.messages || []);
          const unreadIds = (mdata.messages || []).filter((m: any) => m.receiver_id === driverIdRef.current && !m.is_read).map((m: any) => m.id);
          if (unreadIds.length > 0) {
            markMessagesRead(unreadIds);
          }
        }
      } catch (e) {
        // ignore
      }
    })();
  }, [adminUser?.id]);

  const markMessagesRead = async (ids: number[]) => {
    if (!ids.length) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(API_BASE + '/api/messages/mark_read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids }),
      });
    } catch (e) {
      // ignore
    }
  };

  // Auto-request location when component mounts
  useEffect(() => {
    if (!driver) return;
    requestLocationAutomatic();
  }, [driver]);

  const getPosition = (options: PositionOptions) =>
    new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });

  const resolvePosition = async () => {
    const baseOptions = { enableHighAccuracy: false, timeout: 30000, maximumAge: 1000 };
    try {
      return await getPosition(baseOptions);
    } catch (error: any) {
      if (error?.code === 2 || error?.code === 3) {
        const retryOptions = { enableHighAccuracy: true, timeout: 60000, maximumAge: 0 };
        return await getPosition(retryOptions);
      }
      throw error;
    }
  };

  const emitLocationUpdate = (pos: GeolocationPosition) => {
    if (!driver) return;
    const newLoc = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude
    };
    setCurrentLocation(newLoc);
    const vehicleId = driver.assigned_vehicle_id || driver.vehicleId;
    socket.emit('driver:updateLocation', {
      userId: driver.id,
      vehicleId,
      driverName: driver.name,
      latitude: newLoc.latitude,
      longitude: newLoc.longitude,
      accuracy: pos.coords.accuracy
    });

    // Also persist location to server REST cache so new page loads pick it up
    if (vehicleId) {
      const token = localStorage.getItem('token');
      fetch(API_BASE + '/api/locations/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ latitude: newLoc.latitude, longitude: newLoc.longitude, status: 'online', accuracy: pos.coords.accuracy })
      }).catch(() => {}); // fire-and-forget
    }
  };

  const startLocationWatch = () => {
    if (!navigator.geolocation || !driver) return;
    if (locationWatchId.current !== null) {
      navigator.geolocation.clearWatch(locationWatchId.current);
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => emitLocationUpdate(pos),
      (error) => {
        console.error('Location watch error:', error);
      },
      {
        enableHighAccuracy: false,
        timeout: 60000,
        maximumAge: 5000
      }
    );
    locationWatchId.current = watchId;
  };

  const requestLocationAutomatic = async () => {
    if (!navigator.geolocation || !driver) return;

    try {
      const position = await resolvePosition();
      setLocationEnabled(true);
      emitLocationUpdate(position);
      startLocationWatch();
    } catch (error: any) {
      console.error('Auto-location request failed:', error);
      // Silent fail for auto-request
    }
  };

  const toggleLocationTracking = async () => {
    if (!driver) return;

    if (locationEnabled) {
      // Turn off location
      if (locationWatchId.current !== null) {
        navigator.geolocation.clearWatch(locationWatchId.current);
        locationWatchId.current = null;
      }
      setLocationEnabled(false);
      setCurrentLocation(null);
      toast({
        title: 'Location tracking disabled',
        description: 'Your location is no longer being shared'
      });
    } else {
      // Turn on location
      if (!navigator.geolocation) {
        toast({
          title: 'Location not supported',
          description: 'Your browser does not support location services',
          variant: 'destructive'
        });
        return;
      }

      try {
        const position = await resolvePosition();
        setLocationEnabled(true);
        emitLocationUpdate(position);
        startLocationWatch();

        toast({
          title: 'Location tracking enabled',
          description: 'Your location is now being shared',
          icon: <MapPin className="h-4 w-4" />
        });
      } catch (error: any) {
        let errorMsg = 'Unable to access location';
        let helpText = '';

        if (error.code === 1) {
          errorMsg = 'Location permission denied';
          helpText = 'Please enable location permission for this browser:\n1. Click the lock icon in the address bar\n2. Find "Location"\n3. Change it from "Block" to "Allow"';
        } else if (error.code === 2) {
          errorMsg = 'Location service unavailable';
          helpText = 'Please ensure:\n1. Location services are enabled on your device\n2. Wi-Fi or GPS is turned on\n3. Try a different browser if this persists';
        } else if (error.code === 3) {
          errorMsg = 'Location request timed out';
          helpText = 'The location request took too long. Please:\n1. Check your network connection\n2. Enable location services on your device\n3. Try again in a moment';
        }

        toast({
          title: 'Location access failed',
          description: errorMsg + (helpText ? '\n\n' + helpText : ''),
          variant: 'destructive'
        });
      }
    }
  };

  const toggleStatus = async () => {
    if (!driver) return;
    
    const newStatus = status === 'online' ? 'offline' : 'online';
    setStatus(newStatus);
    
    socket.emit('driver:updateStatus', { 
      userId: driver.id, 
      status: newStatus, 
      vehicleId: driver.assigned_vehicle_id || driver.vehicleId,
      driverName: driver.name,
      ...(currentLocation ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude } : {})
    });

    if (currentLocation) {
      // Update server with location
      try {
        const token = localStorage.getItem('token');
        await fetch(API_BASE + '/api/drivers/location', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            status: newStatus
          })
        });
      } catch (err) {
        console.error('Failed to update location on server:', err);
      }
    }

    toast({ 
      title: `Status: ${newStatus.toUpperCase()}`,
      description: newStatus === 'online' ? 'You are now online for ride requests' : 'You are now offline'
    });
  };

  const adjustOccupancy = async (action: 'increment' | 'decrement' | 'set', value?: number) => {
    if (!driver?.assigned_vehicle_id) return;
    
    // If incrementing (adding passenger), show payment dialog first
    if (action === 'increment') {
      setShowPaymentDialog(true);
      return;
    }
    
    // For decrement or set, proceed directly
    try {
      const token = localStorage.getItem('token');
      const body: any = { action };
      if (action === 'set') body.value = Number(value || 0);
      const res = await fetch(API_BASE + `/api/drivers/me/occupancy`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        if (data.trip) setTrip(data.trip);
        if (data.occupancy) setDriverOccupancy(data.occupancy);
        const nextValue = data?.trip?.current_occupancy ?? data?.occupancy?.current_occupancy ?? 0;
        toast({ title: 'Occupancy updated', description: `Now ${nextValue} passengers` });
      } else {
        toast({ title: 'Failed', description: data.message || 'Could not update occupancy' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Network error' });
    }
  };
  
  const handlePaymentSuccess = async () => {
    // Payment was successful, now increment occupancy
    try {
      const token = localStorage.getItem('token');
      const body = { action: 'increment' };
      const res = await fetch(API_BASE + `/api/drivers/me/occupancy`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
        body: JSON.stringify(body) 
      });
      const data = await res.json();
      if (res.ok) {
        if (data.trip) setTrip(data.trip);
        if (data.occupancy) setDriverOccupancy(data.occupancy);
        const nextValue = data?.trip?.current_occupancy ?? data?.occupancy?.current_occupancy ?? 0;
        
        // Refresh tickets to show new payment
        fetchVehicleTickets();
        
        toast({ 
          title: 'Passenger Added', 
          description: `Payment recorded. Now ${nextValue} passengers onboard` 
        });
      } else {
        toast({ title: 'Failed', description: data.message || 'Could not update occupancy' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Network error' });
    }
  };

  const sendMessage = async () => {
    if (!messageText || messageText.trim().length === 0) return;
    try {
      if (!adminUser?.id) {
        toast({ title: 'Admin unavailable', description: 'Admin chat user is not ready yet.' });
        return;
      }
      emitTyping(false);
      const token = localStorage.getItem('token');
      const res = await fetch(API_BASE + '/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ receiverId: adminUser.id, tripId: trip?.id, message: messageText }) });
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, data.msg]);
        setMessageText('');
        toast({ title: 'Sent', description: 'Message sent to admin' });
      } else {
        toast({ title: 'Failed', description: data.message || 'Could not send' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Network error' });
    }
  };

  const emitTyping = (isTyping: boolean) => {
    if (!driver || !socket || !adminUser?.id) return;
    if (lastTypingRef.current === isTyping) return;
    socket.emit('chat.typing', { senderId: driver.id, receiverId: adminUser.id, isTyping });
    lastTypingRef.current = isTyping;
  };

  const handleInputChange = (value: string) => {
    setMessageText(value);
    emitTyping(true);
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      emitTyping(false);
    }, 1200);
  };

  const handleInputBlur = () => {
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    emitTyping(false);
  };

  const formatDayLabel = (value: string) => {
    const d = new Date(value);
    return d.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const messageRows = (() => {
    let lastDay = '';
    const rows: Array<{ type: 'day' | 'msg'; day?: string; msg?: any }> = [];
    messages.forEach((m) => {
      const day = formatDayLabel(m.created_at);
      if (day !== lastDay) {
        rows.push({ type: 'day', day });
        lastDay = day;
      }
      rows.push({ type: 'msg', msg: m });
    });
    return rows;
  })();

  const effectiveCapacity = Number(trip?.capacity || driverOccupancy?.capacity || 14);
  const effectiveOccupancy = Number(trip?.current_occupancy ?? driverOccupancy?.current_occupancy ?? 0);
  const isFull = effectiveOccupancy >= effectiveCapacity;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast({ title: 'Logged out', description: 'Your session has ended.' });
    navigate('/driver/login');
  };

  const printTicket = (ticket: any) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      toast({
        title: 'Print blocked',
        description: 'Please allow pop-ups to print tickets.',
        variant: 'destructive',
      });
      return;
    }

    const paidAt = new Date(ticket?.created_at || Date.now());
    const dateText = paidAt.toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeText = paidAt.toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const transactionId = ticket?.transaction_id || ticket?.checkout_request_id || `DRV-${ticket?.id || Date.now()}`;
    const status = String(ticket?.status || 'completed').toUpperCase();

    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket - ${transactionId}</title>
          <style>
            body { font-family: Arial, sans-serif; background: #f5f7fb; margin: 0; padding: 24px; color: #111827; }
            .ticket { max-width: 520px; margin: 0 auto; background: #ffffff; border: 2px dashed #9ca3af; border-radius: 16px; padding: 24px; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
            .title { font-size: 20px; font-weight: 700; }
            .status { font-size: 12px; font-weight: 600; color: #065f46; background: #d1fae5; border-radius: 999px; padding: 4px 10px; }
            .row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 14px; }
            .label { color: #6b7280; }
            .value { font-weight: 600; }
            .amount { margin-top: 16px; padding-top: 14px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 18px; font-weight: 700; }
            .footer { margin-top: 22px; font-size: 12px; color: #6b7280; text-align: center; }
            @media print { body { background: #ffffff; padding: 0; } .ticket { border: 2px dashed #9ca3af; box-shadow: none; } }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <div class="title">MatatuConnect Ticket</div>
              <div class="status">${status}</div>
            </div>
            <div class="row"><span class="label">Transaction ID</span><span class="value">${transactionId}</span></div>
            <div class="row"><span class="label">Vehicle</span><span class="value">${ticket?.vehicle_number || driver?.vehicle_reg || 'N/A'}</span></div>
            <div class="row"><span class="label">Route</span><span class="value">${ticket?.route_name || `Route ${ticket?.route_id || 'N/A'}`}</span></div>
            <div class="row"><span class="label">Date</span><span class="value">${dateText}</span></div>
            <div class="row"><span class="label">Time</span><span class="value">${timeText}</span></div>
            <div class="amount"><span>Amount Paid</span><span>KES ${Number(ticket?.amount || 0)}</span></div>
            <div class="footer">Printed by Driver Dashboard • ${new Date().toLocaleString('en-KE')}</div>
          </div>
          <script>window.onload = function(){ window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex flex-col">
      <Header />

      <div className="bg-gradient-to-r from-primary via-blue-600 to-cyan-600 text-white py-6 sm:py-10 shadow-xl border-b-4 border-cyan-300">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-11 h-11 sm:w-14 sm:h-14 flex-shrink-0 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <Truck className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight">Driver Dashboard</h1>
                <p className="text-xs sm:text-sm text-blue-100 mt-0.5 font-medium truncate">Live operations, location sharing &amp; ride management</p>
              </div>
            </div>

            <Button
              onClick={handleLogout}
              className="w-full sm:w-auto flex-shrink-0 bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 px-4 sm:px-6 py-2 h-auto"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <main className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pt-4 md:pt-6 pb-6 flex-1">
        {/* Location Permission Helper Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">📍 Location Sharing Active</h3>
              <p className="text-sm text-blue-800">
                Your location is being automatically shared when you load this page. You can control location sharing using the <strong>"Share Location"</strong> button below.
                <br />
                <strong>Go Online:</strong> Click "Go Online" to accept new ride requests. Location must be shared first.
              </p>
            </div>
          </div>
        </div>

        {driver ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2">
          {/* Driver Info Card */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-5 md:p-6 mb-4 md:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{driver.name}</h2>
                  <p className="text-slate-600 text-sm md:text-base">@{driver.username}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-3 text-xs md:text-sm text-slate-600">
                  <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {driver.phone}</span>
                  <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {driver.email}</span>
                </div>
                {locationEnabled && currentLocation && (
                  <div className="flex items-start gap-2 text-xs md:text-sm text-green-700 bg-green-50 rounded-lg p-2 mt-3">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span className="break-all">Location active: {currentLocation.latitude.toFixed(4)}°, {currentLocation.longitude.toFixed(4)}°</span>
                  </div>
                )}
              </div>

              {/* Status Buttons - Stack on mobile, row on desktop */}
              <div className="w-full sm:w-auto flex flex-col sm:flex-col gap-2">
                <Button 
                  onClick={toggleStatus} 
                  className={`flex-1 sm:flex-initial text-sm md:text-base ${
                    status === 'online' 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white' 
                      : 'bg-gray-400 hover:bg-gray-500 text-white'
                  }`}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  {status === 'online' ? 'Go Offline' : 'Go Online'}
                </Button>
                <Button 
                  onClick={toggleLocationTracking}
                  className={`flex-1 sm:flex-initial text-sm md:text-base ${
                    locationEnabled 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white' 
                      : 'bg-slate-400 hover:bg-slate-500 text-white'
                  }`}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {locationEnabled ? 'Stop Sharing' : 'Share Location'}
                </Button>
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200">
              {locationEnabled && status === 'online' ? (
                <div className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                  <CheckCircle className="h-3 w-3" /> Online & Sharing Location
                </div>
              ) : locationEnabled ? (
                <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                  <MapPin className="h-3 w-3" /> Location Shared
                </div>
              ) : status === 'online' ? (
                <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
                  <AlertCircle className="h-3 w-3" /> Online (No Location)
                </div>
              ) : (
                <div className="flex items-center gap-1 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-medium">
                  <Circle className="h-3 w-3" /> Offline
                </div>
              )}
            </div>
          </div>

          {/* Assigned Vehicle Card */}
          <div className="mb-4 md:mb-6">
            <div className="bg-white rounded-xl shadow-md p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-600" />
                  Assigned Vehicle
                </h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshDriverData}
                  className="text-xs"
                >
                  🔄
                </Button>
              </div>
              {driver.assigned_vehicle_id ? (
                <div className="space-y-3">
                  <div className="text-2xl font-bold text-green-700">{driver.vehicle_reg || `Vehicle ID: ${driver.assigned_vehicle_id}`}</div>
                  <p className="text-xs md:text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> Vehicle assigned
                  </p>
                  
                  {/* Route Information */}
                  {driver.route_name && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">
                        <Navigation className="h-3 w-3" /> Current Route
                      </p>
                      <p className="text-sm font-bold text-blue-900">{driver.route_name}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        {driver.start_location} → {driver.end_location}
                      </p>
                    </div>
                  )}

                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <p className="text-xs text-slate-600 font-medium mb-2">CURRENT PASSENGERS</p>
                    {/* Big numeric display */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-4xl font-bold ${isFull ? 'text-red-600' : 'text-green-700'}`}>{effectiveOccupancy}</span>
                      <span className="text-slate-500 text-lg">/ {effectiveCapacity}</span>
                      {isFull && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">FULL</span>}
                    </div>
                    {/* +/- controls for driver to adjust (e.g. passenger got off) */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 min-w-0 border-red-300 text-red-700 hover:bg-red-50 text-xs sm:text-sm"
                        onClick={() => adjustOccupancy('decrement')}
                        disabled={effectiveOccupancy <= 0}
                      >
                        <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                        <span className="truncate">Passenger Off</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 min-w-0 border-green-400 text-green-700 hover:bg-green-50 text-xs sm:text-sm"
                        onClick={() => adjustOccupancy('increment')}
                        disabled={isFull}
                      >
                        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                        <span className="truncate">Add Passenger</span>
                      </Button>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">
                      Use "Add Passenger" and "Passenger Off" to keep live occupancy in sync for this vehicle.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm md:text-base text-gray-600 font-medium">No vehicle assigned</p>
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> Contact admin to assign a vehicle
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tickets Section */}
          <div>
            <div className="bg-white rounded-xl shadow-md p-5 md:p-6">
              <h3 className="font-bold text-lg text-slate-900 mb-1 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                Vehicle Tickets
              </h3>
              <p className="text-xs text-slate-600 mb-4">Completed payments for {driver.vehicle_reg || 'your vehicle'}</p>
              {tickets.length === 0 ? (
                <div className="text-sm text-slate-600 space-y-1">
                  <p>No tickets yet</p>
                  {!driver.assigned_vehicle_id && (
                    <p className="text-amber-600 text-xs">⚠ No vehicle assigned. Contact admin.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {tickets.slice(0, 20).map(t => (
                    <div key={t.id} className="p-3 border border-slate-200 rounded-lg hover:bg-green-50 transition">
                      <div className="flex flex-col xs:flex-row justify-between items-start gap-1 xs:gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-green-700">KES {t.amount}</div>
                          <div className="text-xs text-slate-600 truncate">{t.route_name || `Route ${t.route_id}`}</div>
                          <div className="text-xs text-slate-600 font-mono truncate">{t.phone_number}</div>
                        </div>
                        <div className="text-left xs:text-right flex-shrink-0">
                          <div className="text-xs font-mono text-green-700 font-semibold break-all">{t.transaction_id || t.checkout_request_id?.slice(-8)}</div>
                          <div className="text-xs text-slate-600">{new Date(t.created_at).toLocaleDateString('en-KE', { day: '2-digit', month: 'short' })}</div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-1 h-7 px-2 text-xs"
                            onClick={() => printTicket(t)}
                          >
                            <Printer className="h-3 w-3 mr-1" />
                            Print
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Admin Chat Card - Full width on mobile, sidebar on desktop */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-xl shadow-md overflow-hidden border border-emerald-200">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-semibold">
                  {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">Admin Support</div>
                  <div className="text-xs text-emerald-100">Online</div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="h-56 sm:h-72 lg:h-80 overflow-auto bg-white p-3 md:p-4 space-y-2">
              {messageRows.map((row, idx) => {
                if (row.type === 'day') {
                  return (
                    <div key={`day-${row.day}-${idx}`} className="text-center">
                      <span className="text-[11px] text-slate-500 bg-slate-100 rounded-full px-3 py-1 inline-block">{row.day}</span>
                    </div>
                  );
                }
                const m = row.msg;
                return (
                  <div
                    key={m.id}
                    className={`flex ${m.sender_id === driver.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        m.sender_id === driver.id 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-200 text-slate-900'
                      }`}
                    >
                      <div className="break-words">{m.message}</div>
                      <div className={`mt-1 text-[10px] ${m.sender_id === driver.id ? 'text-emerald-100' : 'text-slate-600'}`}>
                        {new Date(m.created_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                        {m.sender_id === driver.id && (
                          <span className="ml-2">{m.is_read ? '✓✓' : '✓'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {adminTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-200 text-slate-700 rounded-lg px-3 py-2 text-sm animate-pulse">
                    Typing...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-emerald-200 p-3">
              <div className="flex gap-2">
                <input
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={messageText}
                  onChange={e => handleInputChange(e.target.value)}
                  onBlur={handleInputBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Message admin..."
                />
                <Button onClick={sendMessage} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-lg text-sm">
                  Send
                </Button>
              </div>
            </div>
          </div>
          </div>
          </div>
        ) : (
          <p>Loading driver profile...</p>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <span>© {new Date().getFullYear()} MatatuConnect Driver Portal</span>
          <span className="text-slate-500">Ride updates, location sharing and admin support in one place.</span>
        </div>
      </footer>

      {/* Payment Dialog */}
      {driver?.assigned_vehicle_id && (
        <PaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          vehicleId={driver.assigned_vehicle_id}
          vehicleReg={driver.vehicle_reg}
          routeId={trip?.route_id || driver?.route_id}
          routeName={trip?.route_name || driver?.route_name || 'Standard Route'}
          amount={paymentAmount}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

    </div>
  );
}