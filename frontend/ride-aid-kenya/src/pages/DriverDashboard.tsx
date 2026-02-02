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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(API_BASE + '/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok) {
          setDriver(data.user);
        }
      } catch (err) {
        // ignore
      }
    })();

    socket.on('connect', () => {
      console.log('socket connected', socket.id);
    });

    socket.on('driver.statusUpdated', (payload: any) => {
      console.log('driver.statusUpdated', payload);
    });

    return () => {
      socket.off('driver.statusUpdated');
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
      const res = await fetch(API_BASE + '/api/drivers/assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: driver.id }) });
      // ignore response for now
    } catch (err) {
      // ignore
    }
  };

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Driver Dashboard</h1>
      {driver ? (
        <div className="bg-white p-4 rounded-lg shadow">
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
        </div>
      ) : (
        <p>Loading driver profile...</p>
      )}
    </div>
  );
}