import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import AdminResetLogs from '@/components/admin/AdminResetLogs';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface OccupancyVehicleOption {
  vehicleId: number;
  registrationNumber: string;
  routeLabel: string;
}

export default function DriverManager() {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [occupancyVehicles, setOccupancyVehicles] = useState<OccupancyVehicleOption[]>([]);
  const [assignmentDrafts, setAssignmentDrafts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingOccupancyVehicles, setLoadingOccupancyVehicles] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', driving_license: '', assigned_vehicle_id: '' });

  const [lastCreated, setLastCreated] = useState<{ username: string; password: string } | null>(null);
  const [showTempPasswordModal, setShowTempPasswordModal] = useState(false);
  const [tempPassword, setTempPassword] = useState<{ username?: string; password?: string } | null>(null);
  const [showResetLogs, setShowResetLogs] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE + '/api/drivers', { headers: { ...getAuthHeaders() } });
      const data = await res.json();
      if (res.ok) setDrivers(data.drivers || []);
      else toast({ title: 'Failed to load drivers', description: data.message || 'Error' });
    } catch (err: any) {
      toast({ title: 'Failed to load drivers', description: err.message || 'Error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchOccupancyVehicles = async () => {
    setLoadingOccupancyVehicles(true);
    try {
      const res = await fetch(API_BASE + '/api/occupancy/all', { headers: { ...getAuthHeaders() } });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Failed to load occupancy vehicles', description: data.message || 'Error', variant: 'destructive' });
        return;
      }

      const raw = Array.isArray(data)
        ? data
        : Array.isArray(data?.occupancies)
          ? data.occupancies
          : [];

      const seen = new Map<number, OccupancyVehicleOption>();
      for (const entry of raw) {
        const vehicleId = Number(entry.vehicle_id ?? entry.vehicleId ?? entry.id ?? 0);
        if (!Number.isFinite(vehicleId) || vehicleId <= 0 || seen.has(vehicleId)) continue;

        const registrationNumber = String(
          entry.registration_number ?? entry.vehicle_number ?? entry.vehicleNumber ?? `Vehicle ${vehicleId}`
        );
        const routeName = String(entry.route_name ?? '').trim();
        const start = String(entry.start_location ?? entry.startLocation ?? '').trim();
        const end = String(entry.end_location ?? entry.endLocation ?? '').trim();
        const routeLabel = routeName || [start, end].filter(Boolean).join(' → ') || `Route ${entry.route_id ?? entry.routeId ?? 'N/A'}`;

        seen.set(vehicleId, { vehicleId, registrationNumber, routeLabel });
      }

      setOccupancyVehicles(Array.from(seen.values()));
    } catch (err: any) {
      toast({ title: 'Failed to load occupancy vehicles', description: err.message || 'Error', variant: 'destructive' });
    } finally {
      setLoadingOccupancyVehicles(false);
    }
  };

  const saveDriverAssignment = async (userId: number, assignedVehicleValue: string) => {
    try {
      setLoading(true);
      const payload = {
        assigned_vehicle_id: assignedVehicleValue ? Number(assignedVehicleValue) : null,
      };

      const res = await fetch(API_BASE + '/api/drivers/' + userId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        toast({ title: 'Driver assignment updated' });
        setAssignmentDrafts((prev) => ({ ...prev, [userId]: assignedVehicleValue }));
        fetchDrivers();
      } else {
        toast({ title: 'Assignment update failed', description: data.message || data.error || 'Error', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Assignment update failed', description: err.message || 'Error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchDrivers();
    fetchOccupancyVehicles();
    try {
      const raw = localStorage.getItem('lastCreatedDriver');
      if (raw) setLastCreated(JSON.parse(raw));
    } catch (e) {}
  }, []);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      toast({ title: 'Missing fields', description: 'Name, email and password are required', variant: 'destructive' });
      return;
    }
    try {
      setLoading(true);
      // sanitize assigned_vehicle_id: convert empty -> null, string -> number
      const assignedVehicleId = form.assigned_vehicle_id ? Number(form.assigned_vehicle_id) : null;
      const payload: any = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        password: form.password,
        driving_license: form.driving_license || null,
        assigned_vehicle_id: assignedVehicleId,
      };

      const res = await fetch(API_BASE + '/api/drivers', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Driver created', description: `Username: ${data.user.username}` });
        // persist last created credentials so drivers can use them to login and show inline
        try {
          const creds = { username: data.user.username, password: form.password };
          localStorage.setItem('lastCreatedDriver', JSON.stringify(creds));
          setLastCreated(creds);
        } catch (e) { /* ignore storage errors */ }
        setForm({ name: '', email: '', phone: '', password: '', driving_license: '', assigned_vehicle_id: '' });
        fetchDrivers();
      } else {
        toast({ title: 'Create failed', description: data.message || 'Error', variant: 'destructive' });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err || 'Error');
      toast({ title: 'Create failed', description: message || 'Error', variant: 'destructive' });
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
        <select
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={form.assigned_vehicle_id}
          onChange={(e) => setForm({ ...form, assigned_vehicle_id: e.target.value })}
        >
          <option value="">Assign vehicle from occupancy (optional)</option>
          {occupancyVehicles.map((v) => (
            <option key={v.vehicleId} value={String(v.vehicleId)}>
              {v.registrationNumber} — {v.routeLabel}
            </option>
          ))}
        </select>
      </div>
      <p className="text-xs text-muted-foreground">
        Available vehicles come from Occupancy entries{loadingOccupancyVehicles ? ' (loading...)' : ''}.
      </p>
      <div className="flex gap-2">
        <Button onClick={handleCreate} disabled={loading} className="bg-green-600">Create Driver</Button>
        <Button
          variant="outline"
          onClick={() => {
            fetchDrivers();
            fetchOccupancyVehicles();
          }}
          disabled={loading || loadingOccupancyVehicles}
        >
          Refresh
        </Button>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Drivers ({drivers.length})</h3>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowResetLogs(true)}>View reset logs</Button>
            {lastCreated && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <div>Last created: <span className="font-mono ml-1">{lastCreated.username}</span></div>
              <Button size="sm" variant="ghost" onClick={() => {
                try { navigator.clipboard.writeText(`Username: ${lastCreated.username}\nPassword: ${lastCreated.password}`); toast({ title: 'Copied credentials to clipboard' }); } catch (e) { toast({ title: 'Copy failed' }); }
              }}>Copy creds</Button>
              <Button size="sm" variant="outline" onClick={() => { window.open('/driver/login', '_blank'); }}>Open driver login</Button>
            </div>
            )}
          </div>
        </div>

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

              <div className="flex gap-2 mt-3">
                <Button
                  onClick={async () => {
                    const name = window.prompt('Name', d.name || '') || d.name;
                    const phone = window.prompt('Phone', d.phone || '') || d.phone;
                    const driving_license = window.prompt('Driving license', d.driving_license || '') || d.driving_license;
                    const vehicleInput = window.prompt('Assigned vehicle id (enter number, or leave blank to keep current)', d.assigned_vehicle_id ? String(d.assigned_vehicle_id) : '');

                    try {
                      const payload: any = { name, phone };
                      if (driving_license) payload.driving_license = driving_license;
                      
                      // Handle vehicle assignment
                      if (vehicleInput !== null) { // User didn't click cancel
                        const trimmed = String(vehicleInput).trim();
                        if (trimmed === '') {
                          // Keep current assignment - don't include in payload
                          // This way backend won't update the field
                        } else if (trimmed.toLowerCase() === 'none' || trimmed === '0') {
                          // Explicitly clear assignment
                          payload.assigned_vehicle_id = null;
                        } else {
                          // Set new vehicle ID
                          const av = Number(trimmed);
                          if (!Number.isNaN(av) && av > 0) {
                            payload.assigned_vehicle_id = av;
                          } else {
                            toast({ title: 'Invalid vehicle ID', description: 'Please enter a valid number', variant: 'destructive' });
                            return;
                          }
                        }
                      }

                      console.log('Updating driver with payload:', payload);

                      const res = await fetch(API_BASE + '/api/drivers/' + (d.user_id || d.userId), {
                        method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                        body: JSON.stringify(payload)
                      });
                      const data = await res.json();
                      console.log('Update response:', data);
                      if (res.ok) {
                        toast({ title: 'Driver updated' });
                        fetchDrivers();
                      } else {
                        toast({ title: 'Update failed', description: data.message || data.error || 'Error', variant: 'destructive' });
                      }
                    } catch (err: unknown) {
                      const message = err instanceof Error ? err.message : String(err || 'Error');
                      toast({ title: 'Update failed', description: message || 'Error', variant: 'destructive' });
                    }
                  }}
                >
                  Edit
                </Button>

                <Button variant="secondary" onClick={async () => {
                  if (!window.confirm('Reset this driver password? This will generate a new temporary password and show it once.')) return;
                  try {
                    const res = await fetch(API_BASE + '/api/drivers/' + (d.user_id || d.userId || d.userId) + '/reset_password', { method: 'POST', headers: { ...getAuthHeaders() } });
                    const data = await res.json();
                    if (res.ok) {
                      // show modal with password, copy button, and persist for quick-login convenience
                      try { navigator.clipboard.writeText(data.password); } catch (e) {}
                      try { localStorage.setItem('lastCreatedDriver', JSON.stringify({ username: d.username || d.user_name || d.name, password: data.password })); } catch (e) {}
                      setTempPassword({ username: d.username || d.user_name || d.name, password: data.password });
                      setShowTempPasswordModal(true);
                    } else {
                      toast({ title: 'Reset failed', description: data.message || data.error || 'Error', variant: 'destructive' });
                    }
                  } catch (err: any) {
                    toast({ title: 'Reset failed', description: err.message || 'Error', variant: 'destructive' });
                  }
                }}>
                  Reset Password
                </Button>

                <Button variant="destructive" onClick={async () => {
                  if (!window.confirm('Delete this driver? This will also remove the user account.')) return;
                  try {
                    const res = await fetch(API_BASE + '/api/drivers/' + (d.user_id || d.userId || d.userId), { method: 'DELETE', headers: { ...getAuthHeaders() } });
                    const data = await res.json();
                    if (res.ok) {
                      toast({ title: 'Driver deleted' });
                      fetchDrivers();
                    } else {
                      toast({ title: 'Delete failed', description: data.message || data.error || 'Error', variant: 'destructive' });
                    }
                  } catch (err: any) {
                    toast({ title: 'Delete failed', description: err.message || 'Error', variant: 'destructive' });
                  }
                }}>Delete</Button>

              </div>

              <div className="mt-4 border-t pt-3">
                <p className="text-sm font-medium mb-2">Assign vehicle from occupancy</p>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <select
                    className="w-full sm:max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={assignmentDrafts[d.user_id] ?? (d.assigned_vehicle_id ? String(d.assigned_vehicle_id) : '')}
                    onChange={(e) => setAssignmentDrafts((prev) => ({ ...prev, [d.user_id]: e.target.value }))}
                  >
                    <option value="">Unassign vehicle</option>
                    {occupancyVehicles.map((v) => (
                      <option key={v.vehicleId} value={String(v.vehicleId)}>
                        {v.registrationNumber} — {v.routeLabel}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    onClick={() => saveDriverAssignment(
                      Number(d.user_id || d.userId),
                      assignmentDrafts[d.user_id] ?? (d.assigned_vehicle_id ? String(d.assigned_vehicle_id) : '')
                    )}
                    disabled={loading}
                  >
                    Save Assignment
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>


      </div>

      {/* Temp password modal */}
      <Dialog open={showTempPasswordModal} onOpenChange={(open) => { if (!open) { setShowTempPasswordModal(false); setTempPassword(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Temporary Password</DialogTitle>
            <DialogDescription>This password is shown once. Copy it and give it to the driver securely.</DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <div className="font-mono bg-slate-100 p-3 rounded">{tempPassword?.username}</div>
            <div className="mt-2 flex items-center gap-2">
              <div className="font-mono text-lg">{tempPassword?.password}</div>
              <Button size="sm" variant="outline" onClick={() => { try { navigator.clipboard.writeText(String(tempPassword?.password || '')); toast({ title: 'Copied' }); } catch (e) { toast({ title: 'Copy failed' }); } }}>Copy</Button>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => { setShowTempPasswordModal(false); setTempPassword(null); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset logs modal */}
      <Dialog open={showResetLogs} onOpenChange={(open) => { if (!open) setShowResetLogs(open); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Driver Password Reset Logs</DialogTitle>
            <DialogDescription>Recent password resets performed by admins.</DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <AdminResetLogs onClose={() => setShowResetLogs(false)} />
          </div>

          <DialogFooter>
            <DialogClose>Close</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

