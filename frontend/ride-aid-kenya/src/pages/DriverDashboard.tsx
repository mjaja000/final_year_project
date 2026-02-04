import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_URL || '';
const socket = io(API_BASE.replace(/http(s?):\/\//, '')); // rely on same host

export default function DriverDashboard() {
  const [driver, setDriver] = useState<any>(null);
  const [status, setStatus] = useState('offline');
  const { toast } = useToast();

  const [trip, setTrip] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    (async () => {
      try {
        const res = await fetch(API_BASE + '/api/auth/profile', { headers });
        const data = await res.json();
        if (res.ok) {
          setDriver(data.user);
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

        // fetch conversation with admin (default admin id = 1)
        try {
          const mRes = await fetch(API_BASE + '/api/messages/conversation?otherId=1', { headers });
          if (mRes.ok) {
            const mdata = await mRes.json();
            setMessages(mdata.messages || []);
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
    });

    socket.on('chat.notification', (n: any) => {
      console.log('chat.notification', n);
      toast({ title: 'New chat', description: n.message || 'New chat message' });
    });

    socket.on('driver.statusUpdated', (payload: any) => {
      console.log('driver.statusUpdated', payload);
    });

    return () => {
      socket.off('driver.statusUpdated');
      socket.off('chat.message');
      socket.off('chat.notification');
      socket.disconnect();
    };
  }, []);

  const toggleStatus = async () => {
    if (!driver) return;
    const newStatus = status === 'online' ? 'offline' : 'online';
    setStatus(newStatus);
    // emit socket update
    socket.emit('driver:updateStatus', { userId: driver.id, status: newStatus, vehicleId: driver.vehicleId || null });
    toast({ title: `Status: ${newStatus}`, description: 'Status updated' });
    // Update server-side record (optional)
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_BASE + '/api/drivers/assign', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ userId: driver.id }) });
      // ignore response for now
    } catch (err) {
      // ignore
    }
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
      const token = localStorage.getItem('token');
      const res = await fetch(API_BASE + '/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ receiverId: 1, tripId: trip?.id, message: messageText }) });
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


  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Driver Dashboard</h1>

      {driver ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="col-span-2 bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">{driver.name} ({driver.username})</div>
                <div className="text-sm text-muted-foreground">{driver.email} • {driver.phone}</div>
              </div>
              <div>
                <Button onClick={toggleStatus} className={status === 'online' ? 'bg-green-600' : 'bg-gray-500'}>
                  {status === 'online' ? 'Go Offline' : 'Go Online'}
                </Button>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold">Assigned Vehicle</h3>
              <p className="text-sm">{driver.vehicle_reg || 'Not assigned'}</p>
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
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold">Driver Chat (Admin)</h3>
            <div className="h-64 overflow-auto border rounded p-2 mt-2">
              {messages.map(m => (
                <div key={m.id} className={`mb-2 p-2 rounded ${m.sender_id === driver.id ? 'bg-blue-100 self-end' : 'bg-gray-100'}`}>
                  <div className="text-sm">{m.message}</div>
                  <div className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <input className="flex-1 border rounded px-2 py-1" value={messageText} onChange={e => setMessageText(e.target.value)} placeholder="Message admin..." />
              <Button onClick={sendMessage}>Send</Button>
            </div>
          </div>
        </div>
      ) : (
        <p>Loading driver profile...</p>
      )}
    </div>
  );
}