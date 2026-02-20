import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  console.log('🚗 VehicleManager component is rendering');
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
        setVehicles(Array.isArray(data.vehicles) ? data.vehicles : Array.isArray(data) ? data : []);
        console.log('Vehicles loaded:', data.vehicles?.length || data?.length || 0);
      } else {
        console.error('Failed to fetch vehicles:', data);
        toast({ title: 'Failed to load vehicles', description: data.message || 'Error', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      toast({ title: 'Error loading vehicles', description: 'Please check console for details', variant: 'destructive' });
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
    <div className="w-full space-y-6">
      {/* Prominent header to confirm rendering */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-2">🚗 Vehicle Management System</h2>
        <p className="text-white/90">Add and manage vehicles in your fleet</p>
      </div>

      {/* Debug indicator */}
      <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg">
        <p className="text-green-900 font-semibold">✅ Component is ACTIVE - Currently showing {vehicles.length} vehicles</p>
        <p className="text-green-700 text-sm mt-1">API Base: {API_BASE}</p>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Manage Vehicles</h3>
            <p className="text-sm text-gray-600 mt-1">Add vehicles that drivers can be assigned to</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchVehicles} disabled={loading}>
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </Button>
        </div>

        <div className="space-y-6">
        {/* Create Vehicle Form */}
        <form onSubmit={handleCreate} className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-cyan-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-cyan-500 text-white p-3 rounded-lg">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900">Add New Vehicle</h4>
              <p className="text-sm text-gray-600">Fill in the vehicle details below</p>
            </div>
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

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all" 
            disabled={loading}
          >
            {loading ? '⏳ Creating Vehicle...' : '➕ Add Vehicle to Fleet'}
          </Button>
        </form>

        <div className="my-6 border-t-2 border-gray-200" />

        {/* Vehicles List */}
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
            <h4 className="text-lg font-bold text-gray-900">📋 Current Vehicles ({vehicles.length})</h4>
            <p className="text-sm text-gray-600 mt-1">View and manage your fleet</p>
          </div>

          {vehicles.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Truck className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-semibold text-gray-700">No vehicles yet</p>
              <p className="text-sm text-gray-500 mt-2">Add your first vehicle using the form above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="p-4 border-2 border-gray-200 rounded-lg bg-white hover:border-cyan-400 hover:shadow-md transition-all flex items-center justify-between">
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
    </div>
  );
}
