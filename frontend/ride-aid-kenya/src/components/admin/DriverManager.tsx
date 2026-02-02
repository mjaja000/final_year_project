import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function DriverManager() {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', driving_license: '', assigned_vehicle_id: '' });

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE + '/api/drivers');
      const data = await res.json();
      if (res.ok) setDrivers(data.drivers || []);
      else toast({ title: 'Failed to load drivers', description: data.message || 'Error' });
    } catch (err: any) {
      toast({ title: 'Failed to load drivers', description: err.message || 'Error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrivers(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      toast({ title: 'Missing fields', description: 'Name, email and password are required', variant: 'destructive' });
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(API_BASE + '/api/drivers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form })
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Driver created', description: `Username: ${data.user.username}` });
        setForm({ name: '', email: '', phone: '', password: '', driving_license: '', assigned_vehicle_id: '' });
        fetchDrivers();
      } else {
        toast({ title: 'Create failed', description: data.message || 'Error', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Create failed', description: err.message || 'Error', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <Input placeholder="Driving License" value={form.driving_license} onChange={(e) => setForm({ ...form, driving_license: e.target.value })} />
        <Input placeholder="Assigned Vehicle ID (optional)" value={form.assigned_vehicle_id} onChange={(e) => setForm({ ...form, assigned_vehicle_id: e.target.value })} />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleCreate} disabled={loading} className="bg-green-600">Create Driver</Button>
        <Button variant="outline" onClick={fetchDrivers} disabled={loading}>Refresh</Button>
      </div>

      <div className="mt-4">
        <h3 className="font-semibold">Drivers ({drivers.length})</h3>
        <div className="grid gap-2 mt-2">
          {drivers.map((d) => (
            <div key={d.id} className="p-3 bg-card rounded-lg border"> 
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{d.username} — {d.name}</div>
                  <div className="text-sm text-muted-foreground">{d.email} {d.phone ? `• ${d.phone}` : ''}</div>
                </div>
                <div className="text-sm text-muted-foreground">Vehicle: {d.vehicle_reg || 'none'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
