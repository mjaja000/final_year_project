import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_URL || '';
const socket = API_BASE ? io(API_BASE) : io(); // fall back to same host

export default function DriverDashboard() {
  const [driver, setDriver] = useState<any>(null);
  const [status, setStatus] = useState('offline');
  const { toast } = useToast();

  const [trip, setTrip] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [adminUser, setAdminUser] = useState<any>(null);
  const [adminTyping, setAdminTyping] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);
  const lastTypingRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const driverIdRef = useRef<number | null>(null);
  const adminIdRef = useRef<number | null>(null);

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