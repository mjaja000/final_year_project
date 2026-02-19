import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface Vehicle {
  id: number;
  registration_number: string;
  vehicle_type: string;
  color?: string;
  make?: string;
  model?: string;
  year?: number;
  capacity?: number;
  route_id?: number;
  status: string;
  created_at: string;
}

export default function VehicleManager() {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    registration_number: '',
    vehicle_type: 'matatu',
    color: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    capacity: 14,
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE + '/api/vehicles', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setVehicles(Array.isArray(data.vehicles) ? data.vehicles : data);
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.registration_number.trim()) {
      toast({ title: 'Required field', description: 'Registration number is required', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        registration_number: form.registration_number.toUpperCase().trim(),
        vehicle_type: form.vehicle_type,
        color: form.color || null,
        make: form.make || null,
        model: form.model || null,
        year: form.year ? Number(form.year) : null,
        capacity: form.capacity ? Number(form.capacity) : 14,
      };

      const res = await fetch(API_BASE + '/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Vehicle created', description: `${payload.registration_number} added successfully` });
        setForm({
          registration_number: '',
          vehicle_type: 'matatu',
          color: '',
          make: '',
          model: '',
          year: new Date().getFullYear(),
          capacity: 14,
        });
        fetchVehicles();
      } else {
        toast({ title: 'Create failed', description: data.message || 'Error creating vehicle', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Create failed', description: err.message || 'Error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vehicleId: number, regNumber: string) => {
    if (!window.confirm(`Delete vehicle ${regNumber}?`)) return;

    try {
      setLoading(true);
      const res = await fetch(API_BASE + '/api/vehicles/' + vehicleId, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        toast({ title: 'Vehicle deleted' });
        fetchVehicles();
      } else {
        toast({ title: 'Delete failed', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-border rounded-xl p-4 sm:p-5 bg-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">Manage vehicles that drivers can be assigned to</p>
          <h3 className="text-lg font-semibold">Vehicle Management</h3>
        </div>
        <Button variant="outline" size="sm" onClick={fetchVehicles} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Create Vehicle Form */}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Add a new vehicle</p>
            <h4 className="text-base font-semibold">Add Vehicle</h4>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Registration Number *</Label>
                <Input
                  placeholder="e.g., KBZ 123FG"
                  value={form.registration_number}
                  onChange={(e) => setForm({ ...form, registration_number: e.target.value.toUpperCase() })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Vehicle Type</Label>
                <select
                  className="w-full rounded-md border px-3 py-2 bg-background"
                  value={form.vehicle_type}
                  onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
                >
                  <option value="matatu">Matatu</option>
                  <option value="van">Van</option>
                  <option value="bus">Bus</option>
                  <option value="minibus">Minibus</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Make (Brand)</Label>
                <Input
                  placeholder="e.g., Toyota"
                  value={form.make}
                  onChange={(e) => setForm({ ...form, make: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Model</Label>
                <Input
                  placeholder="e.g., Hiace"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Color</Label>
                <Input
                  placeholder="e.g., White"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Year</Label>
                <Input
                  type="number"
                  placeholder="2020"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                  min="2000"
                  max={new Date().getFullYear()}
                />
              </div>
              <div className="space-y-1">
                <Label>Capacity (seats)</Label>
                <Input
                  type="number"
                  placeholder="14"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                  min="1"
                  max="60"
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Vehicle'}
          </Button>
        </form>

        <div className="border-t" />

        {/* Vehicles List */}
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Manage existing vehicles</p>
            <h4 className="text-base font-semibold">Vehicles ({vehicles.length})</h4>
          </div>

          {vehicles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No vehicles created yet. Add one above to get started.</p>
          ) : (
            <div className="space-y-2">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="p-3 border rounded-lg bg-white/50 dark:bg-white/5 flex items-center justify-between hover:bg-white/80 dark:hover:bg-white/10 transition">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{vehicle.registration_number}</div>
                    <div className="text-xs text-muted-foreground">
                      {vehicle.make && vehicle.model && `${vehicle.make} ${vehicle.model}`}
                      {vehicle.year && ` • ${vehicle.year}`}
                      {vehicle.color && ` • ${vehicle.color}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Type: {vehicle.vehicle_type} • Capacity: {vehicle.capacity} seats
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(vehicle.id, vehicle.registration_number)}
                    disabled={loading}
                    className="ml-3"
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
