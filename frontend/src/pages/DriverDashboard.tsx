import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Navigation } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';
const socket = API_BASE ? io(API_BASE) : io(); // fall back to same host

export default function DriverDashboard() {
  const [driver, setDriver] = useState<any>(null);
  const [status, setStatus] = useState('offline');
  const { toast } = useToast();
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const locationWatchId = useRef<number | null>(null);

  const [trip, setTrip] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
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
        const tRes = await fetch(API_BASE + '/api/drivers/me/trip', { headers });
        if (tRes.ok) {
          const tdata = await tRes.json();
          setTrip(tdata.trip);
        }

        // fetch bookings for trip
        const bRes = await fetch(API_BASE + '/api/drivers/me/trip/bookings', { headers });
        if (bRes.ok) {
          const bdata = await bRes.json();
          setBookings(bdata.bookings || []);
        }

        // fetch vehicle tickets
        try {
          const ticketsRes = await fetch(API_BASE + '/api/drivers/me/tickets', { headers });
          if (ticketsRes.ok) {
            const ticketsData = await ticketsRes.json();
            console.log('Vehicle tickets response:', ticketsData);
            setTickets(ticketsData.tickets || []);
          } else {
            console.error('Failed to fetch tickets:', ticketsRes.status, await ticketsRes.text());
          }
        } catch (ticketsError) {
          console.error('Error fetching tickets:', ticketsError);
        }

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

    return () => {
      socket.off('driver.statusUpdated');
      socket.off('chat.message');
      socket.off('chat.notification');
      socket.off('chat.typing');
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, adminTyping]);

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

  const requestLocationAutomatic = async () => {
    if (!navigator.geolocation || !driver) return;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 30000,
          maximumAge: 1000
        });
      });

      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      
      setCurrentLocation(location);
      setLocationEnabled(true);

      // Start watching position for continuous updates
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newLoc = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          };
          setCurrentLocation(newLoc);
          
          // Send location update to server
          socket.emit('driver:updateLocation', {
            userId: driver.id,
            vehicleId: driver.assigned_vehicle_id || driver.vehicleId,
            latitude: newLoc.latitude,
            longitude: newLoc.longitude,
            accuracy: pos.coords.accuracy
          });
        },
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
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 30000,
            maximumAge: 1000
          });
        });

        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        
        setCurrentLocation(location);
        setLocationEnabled(true);

        // Start watching position for continuous updates
        const watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const newLoc = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
            };
            setCurrentLocation(newLoc);
            
            socket.emit('driver:updateLocation', {
              userId: driver.id,
              vehicleId: driver.assigned_vehicle_id || driver.vehicleId,
              latitude: newLoc.latitude,
              longitude: newLoc.longitude,
              accuracy: pos.coords.accuracy
            });
          },
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
          helpText = 'Please ensure:\n1. Your device location services are enabled\n2. You have a clear view of the sky (for GPS)\n3. Your internet connection is working';
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
      vehicleId: driver.assigned_vehicle_id || driver.vehicleId
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
    if (!trip || !trip.id) return;
    try {
      const token = localStorage.getItem('token');
      const body: any = { action };
      if (action === 'set') body.value = Number(value || 0);
      const res = await fetch(API_BASE + `/api/drivers/me/trip/${trip.id}/occupancy`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        setTrip(data.trip);
        toast({ title: 'Occupancy updated', description: `Now ${data.trip.current_occupancy}` });
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


  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Driver Dashboard</h1>

      {/* Location Permission Helper Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-6">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="col-span-2 bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">{driver.name} ({driver.username})</div>
                <div className="text-sm text-muted-foreground">{driver.email} • {driver.phone}</div>
                {locationEnabled && currentLocation && (
                  <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                    <MapPin className="h-3 w-3" />
                    <span>Location active: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button 
                    onClick={toggleStatus} 
                    className={status === 'online' ? 'flex-1 bg-green-600 hover:bg-green-700' : 'flex-1 bg-gray-500 hover:bg-gray-600'}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    {status === 'online' ? 'Go Offline' : 'Go Online'}
                  </Button>
                  <Button 
                    onClick={toggleLocationTracking}
                    className={locationEnabled ? 'flex-1 bg-blue-600 hover:bg-blue-700' : 'flex-1 bg-slate-400 hover:bg-slate-500'}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {locationEnabled ? 'Stop Sharing' : 'Share Location'}
                  </Button>
                </div>
                {!locationEnabled && (
                  <div className="text-xs text-amber-600 text-center bg-amber-50 rounded p-2">
                    ⚠️ Location sharing disabled
                  </div>
                )}
                {locationEnabled && status === 'online' && (
                  <div className="text-xs text-green-600 text-center bg-green-50 rounded p-2">
                    ✓ Online and sharing location
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Assigned Vehicle</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshDriverData}
                  className="text-xs"
                >
                  🔄 Refresh
                </Button>
              </div>
              {console.log('Driver object in render:', {
                id: driver.id,
                name: driver.name,
                assigned_vehicle_id: driver.assigned_vehicle_id,
                vehicle_reg: driver.vehicle_reg
              })}
              {driver.assigned_vehicle_id ? (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  ✓ {driver.vehicle_reg || `Vehicle ID: ${driver.assigned_vehicle_id}`}
                </p>
              ) : (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                  ⚠ No vehicle assigned. Contact admin to assign a vehicle.
                </p>
              )}
            </div>

            <div className="mt-6">
              <h3 className="font-semibold">Active Trip</h3>
              {trip ? (
                <div className="mt-2">
                  <p><strong>Route:</strong> {trip.route_name || trip.route || 'N/A'}</p>
                  <p><strong>Vehicle:</strong> {trip.vehicle_reg || trip.vehicle_id}</p>
                  <p><strong>Status:</strong> {trip.status || 'unknown'}</p>
                  <p><strong>Capacity:</strong> {trip.capacity || 'N/A'}</p>
                  <p><strong>Occupancy:</strong> {trip.current_occupancy || 0}</p>

                  <div className="flex items-center gap-2 mt-3">
                    <Button onClick={() => adjustOccupancy('decrement')} variant="outline">-</Button>
                    <Button onClick={() => adjustOccupancy('increment')} variant="outline">+</Button>
                    <div className="flex items-center gap-2">
                      <input id="setOccupancy" className="border px-2 py-1 rounded" placeholder="set" type="number" />
                      <Button onClick={() => {
                        const el: any = document.getElementById('setOccupancy');
                        const v = Number(el?.value || 0);
                        adjustOccupancy('set', v);
                      }}>Set</Button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No active trip assigned.</p>
              )}
            </div>

            <div className="mt-6">
              <h3 className="font-semibold">Bookings</h3>
              {bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bookings for the active trip.</p>
              ) : (
                <div className="mt-2 space-y-3">
                  {bookings.map(b => (
                    <div key={b.id} className="p-3 border rounded">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-semibold">{b.passenger_name || b.user_name || 'Passenger'}</div>
                          <div className="text-sm text-muted-foreground">{b.phone || b.user_phone}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">{b.origin_stop} → {b.destination_stop}</div>
                          <div className="text-xs text-muted-foreground">{b.status || b.booking_status}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6">
              <h3 className="font-semibold">Vehicle Tickets ({tickets.length})</h3>
              <p className="text-xs text-muted-foreground mb-2">Completed payments for {driver.vehicle_reg || 'your vehicle'}</p>
              {tickets.length === 0 ? (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>No tickets yet.</p>
                  {!driver.assigned_vehicle_id && (
                    <p className="text-amber-600 dark:text-amber-400">⚠ You don't have an assigned vehicle. Contact admin.</p>
                  )}
                  {driver.assigned_vehicle_id && (
                    <p className="text-xs">Tickets will appear here when customers pay in vehicle {driver.vehicle_reg}</p>
                  )}
                </div>
              ) : (
                <div className="mt-2 space-y-2 max-h-64 overflow-auto">
                  {tickets.slice(0, 20).map(t => (
                    <div key={t.id} className="p-3 border rounded bg-white/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-semibold">KES {t.amount}</div>
                          <div className="text-xs text-muted-foreground">
                            {t.route_name || `Route ${t.route_id}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t.phone_number}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-mono text-success">
                            {t.transaction_id || t.checkout_request_id?.slice(-8)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(t.created_at).toLocaleDateString('en-KE', { 
                              day: '2-digit', 
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur p-4 rounded-xl border shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-semibold">
                  {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div>
                  <div className="text-sm font-semibold">Admin Support</div>
                  <div className="text-xs text-muted-foreground">Online help desk</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Online</div>
            </div>

            <div className="h-64 overflow-auto border rounded-lg mt-3 bg-[radial-gradient(circle_at_1px_1px,rgba(16,185,129,0.12)_1px,transparent_0)] bg-[length:16px_16px] p-4 flex flex-col gap-2">
              {messageRows.map((row, idx) => {
                if (row.type === 'day') {
                  return (
                    <div key={`day-${row.day}-${idx}`} className="self-center text-[11px] text-muted-foreground bg-white/80 border rounded-full px-3 py-1">
                      {row.day}
                    </div>
                  );
                }
                const m = row.msg;
                return (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${m.sender_id === driver.id ? 'self-end bg-emerald-200' : 'self-start bg-white border border-emerald-100'}`}
                  >
                    <div>{m.message}</div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{new Date(m.created_at).toLocaleString()}</span>
                      {m.sender_id === driver.id && (
                        <span>{m.is_read ? 'Read' : 'Sent'}</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {adminTyping && (
                <div className="self-start rounded-2xl bg-white px-3 py-2 text-sm text-muted-foreground animate-pulse border border-emerald-100">
                  Typing...
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="mt-3 flex gap-2 items-center">
              <input
                className="flex-1 border rounded-full px-4 py-2"
                value={messageText}
                onChange={e => handleInputChange(e.target.value)}
                onBlur={handleInputBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Message admin..."
              />
              <Button onClick={sendMessage} className="rounded-full px-5">Send</Button>
            </div>
          </div>
        </div>
      ) : (
        <p>Loading driver profile...</p>
      )}
    </div>
  );
}