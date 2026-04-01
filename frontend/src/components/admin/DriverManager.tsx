import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import AdminResetLogs from '@/components/admin/AdminResetLogs';
import EditDriverModal from '@/components/admin/modals/EditDriverModal';
import PasswordResetModal from '@/components/admin/modals/PasswordResetModal';
import FormSection from '@/components/admin/FormSection';
import DriverCard from '@/components/admin/cards/DriverCard';
import { Loader2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

type Driver = {
  id: number;
  user_id?: number;
  userId?: number;
  username?: string;
  user_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  profile_image?: string | null;
  driving_license?: string | null;
  assigned_vehicle_id?: number | null;
  vehicle_reg?: string | null;
};

type Vehicle = {
  id: number;
  registration_number?: string;
  route_id?: number | null;
  route_name?: string | null;
};

type Route = {
  id: number;
  status?: string;
};

type DriverAssignmentStatus = {
  user_id: number;
  driver_id: number;
  driver_name?: string | null;
  driver_email?: string | null;
  assigned_vehicle_id?: number | null;
  vehicle_registration?: string | null;
  route_id?: number | null;
  route_name?: string | null;
  start_location?: string | null;
  end_location?: string | null;
  has_vehicle_assigned: boolean;
};

export default function DriverManager() {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [assignmentDrafts, setAssignmentDrafts] = useState<Record<number, string>>({});
  const [assignmentRoutes, setAssignmentRoutes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', driving_license: '', assigned_vehicle_id: '', assigned_route_id: '' });
  const [showAllDrivers, setShowAllDrivers] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [uploadingPhotoUserId, setUploadingPhotoUserId] = useState<number | null>(null);

  const [lastCreated, setLastCreated] = useState<{ username: string; password: string } | null>(null);
  const [showTempPasswordModal, setShowTempPasswordModal] = useState(false);
  const [tempPassword, setTempPassword] = useState<{ username?: string; password?: string } | null>(null);
  const [showResetLogs, setShowResetLogs] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalLoading, setEditModalLoading] = useState(false);
  const [expandedAssignmentDriver, setExpandedAssignmentDriver] = useState<number | null>(null);
  const [assignmentStatusByDriver, setAssignmentStatusByDriver] = useState<Record<number, DriverAssignmentStatus | null>>({});
  const [assignmentStatusLoading, setAssignmentStatusLoading] = useState<Record<number, boolean>>({});

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const getDriverUserId = (driver: Driver) => Number(driver.user_id || driver.userId || driver.id || 0);

  const resolveImageUrl = (value?: string | null) => {
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) {
      if (typeof window !== 'undefined' && window.location.protocol === 'https:' && value.startsWith('http://')) {
        return '';
      }
      return value;
    }
    const normalized = value.startsWith('/') ? value : `/${value}`;
    // In dev, serve uploads via Vite proxy to avoid mixed-content issues on https://localhost:8080.
    if (normalized.startsWith('/uploads/')) return normalized;
    return `${API_BASE}${normalized}`;
  };

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE + '/api/drivers', { headers: { ...getAuthHeaders() } });
      const data = await res.json();
      if (res.ok) {
        setDrivers(data.drivers || []);
        setAssignmentStatusByDriver({});
        setAssignmentStatusLoading({});
      }
      else toast({ title: 'Failed to load drivers', description: data.message || 'Error' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error';
      toast({ title: 'Failed to load drivers', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, toast]);

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch(API_BASE + '/api/vehicles');
      const data = await res.json();
      if (res.ok) setVehicles(data.vehicles || []);
    } catch (err: unknown) {
      console.error('Failed to load vehicles:', err);
    }
  }, []);

  const fetchRoutes = useCallback(async () => {
    try {
      const res = await fetch(API_BASE + '/api/routes', { headers: { ...getAuthHeaders() } });
      const data = await res.json();
      if (!res.ok) return;
      const routesList = Array.isArray(data.routes) ? data.routes : Array.isArray(data) ? data : [];
      setRoutes(routesList);
    } catch (err: unknown) {
      console.error('Failed to load routes:', err);
    }
  }, [getAuthHeaders]);

  const uploadDriverPhoto = async (userId: number, file: File | null) => {
    if (!file) return;
    try {
      setUploadingPhotoUserId(userId);
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch(API_BASE + `/api/drivers/${userId}/photo`, {
        method: 'POST',
        headers: { ...getAuthHeaders() },
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        toast({ title: 'Driver photo updated' });
        fetchDrivers();
      } else {
        toast({ title: 'Photo upload failed', description: data.message || 'Error', variant: 'destructive' });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error';
      toast({ title: 'Photo upload failed', description: message, variant: 'destructive' });
    } finally {
      setUploadingPhotoUserId(null);
    }
  };

  // Helper to check if vehicle is assigned to any driver
  const isVehicleAssigned = (vehicleId: number): { assigned: boolean; driverName?: string } => {
    const driver = drivers.find(d => Number(d.assigned_vehicle_id) === Number(vehicleId));
    return driver 
      ? { assigned: true, driverName: driver.name || driver.username }
      : { assigned: false };
  };

  const getActiveRoutes = () => {
    return routes.filter((r) => String(r.status || 'active').toLowerCase() !== 'inactive');
  };

  const getVehiclesForRoute = (routeId: string | number, currentDriverUserId?: number) => {
    if (!routeId) return [];
    const routeIdNum = Number(routeId);
    return vehicles.filter((v) => {
      // Only show vehicles from the selected route
      if (!v.route_id || Number(v.route_id) !== routeIdNum) return false;

      // Exclude vehicles assigned to other drivers
      const assignedDriver = drivers.find((d) => Number(d.assigned_vehicle_id) === Number(v.id));
      if (!assignedDriver) return true;
      if (!currentDriverUserId) return false;
      return Number(assignedDriver.user_id || assignedDriver.userId) === Number(currentDriverUserId);
    });
  };

  const getAssignableVehicles = (currentDriverUserId?: number) => {
    const activeRouteIds = new Set(
      routes
        .filter((r) => String(r.status || 'active').toLowerCase() !== 'inactive')
        .map((r) => Number(r.id))
    );

    return vehicles.filter((v) => {
      // Only list vehicles attached to currently available (active) routes.
      if (!v.route_id || !activeRouteIds.has(Number(v.route_id))) return false;

      const assignedDriver = drivers.find((d) => Number(d.assigned_vehicle_id) === Number(v.id));
      if (!assignedDriver) return true;
      if (!currentDriverUserId) return false;
      return Number(assignedDriver.user_id || assignedDriver.userId) === Number(currentDriverUserId);
    });
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
        fetchVehicles(); // Refresh to update assignment status
        fetchDriverAssignmentStatus(userId);
      } else {
        toast({ title: 'Assignment update failed', description: data.message || data.error || 'Error', variant: 'destructive' });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error';
      toast({ title: 'Assignment update failed', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverAssignmentStatus = useCallback(async (userId: number) => {
    if (!userId) return;
    setAssignmentStatusLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      const res = await fetch(API_BASE + `/api/drivers/${userId}/assignment-status`, {
        headers: { ...getAuthHeaders() },
      });
      const data = await res.json();
      if (res.ok && data?.assignment) {
        setAssignmentStatusByDriver((prev) => ({ ...prev, [userId]: data.assignment }));
      } else {
        setAssignmentStatusByDriver((prev) => ({ ...prev, [userId]: null }));
      }
    } catch (error) {
      console.error('Failed to fetch assignment status:', error);
      setAssignmentStatusByDriver((prev) => ({ ...prev, [userId]: null }));
    } finally {
      setAssignmentStatusLoading((prev) => ({ ...prev, [userId]: false }));
    }
  }, [getAuthHeaders]);

  const handleEditDriver = async (updates: { name?: string; phone?: string; driving_license?: string }) => {
    if (!editingDriver) return;
    try {
      setEditModalLoading(true);
      const payload: any = { ...updates };

      const res = await fetch(API_BASE + '/api/drivers/' + (editingDriver.user_id || editingDriver.userId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        toast({ title: 'Driver updated successfully' });
        fetchDrivers();
        setShowEditModal(false);
      } else {
        toast({ title: 'Update failed', description: data.message || data.error || 'Error', variant: 'destructive' });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error';
      toast({ title: 'Update failed', description: message, variant: 'destructive' });
    } finally {
      setEditModalLoading(false);
    }
  };

  useEffect(() => { 
    fetchDrivers();
    fetchVehicles();
    fetchRoutes();
    try {
      const raw = localStorage.getItem('lastCreatedDriver');
      if (raw) setLastCreated(JSON.parse(raw));
    } catch (e) {
      console.warn('Unable to read lastCreatedDriver from storage', e);
    }
    
    // Auto-refresh vehicles and occupancy every 30 seconds
    const intervalId = setInterval(() => {
      fetchVehicles();
      fetchRoutes();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchDrivers, fetchVehicles, fetchRoutes]);

  useEffect(() => {
    if (drivers.length === 0) {
      setSelectedDriverId('');
      return;
    }

    const exists = drivers.some((d) => String(getDriverUserId(d)) === selectedDriverId);
    if (!selectedDriverId || !exists) {
      setSelectedDriverId(String(getDriverUserId(drivers[0])));
    }
  }, [drivers, selectedDriverId]);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      toast({ title: 'Missing fields', description: 'Name, email and password are required', variant: 'destructive' });
      return;
    }
    try {
      setLoading(true);
      // sanitize assigned_vehicle_id: convert empty -> null, string -> number
      const assignedVehicleId = form.assigned_vehicle_id ? Number(form.assigned_vehicle_id) : null;
      const payload: {
        name: string;
        email: string;
        phone: string | null;
        password: string;
        driving_license: string | null;
        assigned_vehicle_id: number | null;
      } = {
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
        setForm({ name: '', email: '', phone: '', password: '', driving_license: '', assigned_vehicle_id: '', assigned_route_id: '' });
        fetchDrivers();
        fetchVehicles(); // Refresh to update assignment status
      } else {
        toast({ title: 'Create failed', description: data.message || 'Error', variant: 'destructive' });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err || 'Error');
      toast({ title: 'Create failed', description: message || 'Error', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const selectedDriverIndex = drivers.findIndex((d) => String(getDriverUserId(d)) === selectedDriverId);
  const visibleDrivers = showAllDrivers
    ? drivers
    : drivers.filter((d) => String(getDriverUserId(d)) === selectedDriverId);

  const goToDriverOffset = (offset: number) => {
    if (drivers.length === 0) return;
    const currentIndex = selectedDriverIndex >= 0 ? selectedDriverIndex : 0;
    const nextIndex = (currentIndex + offset + drivers.length) % drivers.length;
    setSelectedDriverId(String(getDriverUserId(drivers[nextIndex])));
    setShowAllDrivers(false);
  };

  useEffect(() => {
    visibleDrivers.forEach((driver) => {
      const userId = getDriverUserId(driver);
      if (!userId) return;
      if (assignmentStatusByDriver[userId] !== undefined || assignmentStatusLoading[userId]) return;
      fetchDriverAssignmentStatus(userId);
    });
  }, [visibleDrivers, assignmentStatusByDriver, assignmentStatusLoading, fetchDriverAssignmentStatus]);

  return (
    <div className="space-y-8">
      {/* Create Driver Section */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">Create New Driver</h2>
          <p className="text-sm text-slate-600 mt-1">Add a new driver to the system with basic information and vehicle assignment.</p>
        </div>

        <FormSection title="Basic Information" description="Enter driver's personal details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name *</Label>
              <Input
                id="create-name"
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email *</Label>
              <Input
                id="create-email"
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-phone">Phone</Label>
              <Input
                id="create-phone"
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-license">Driving License</Label>
              <Input
                id="create-license"
                placeholder="License number"
                value={form.driving_license}
                onChange={(e) => setForm({ ...form, driving_license: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Login Credentials" description="Password for driver account login">
          <div className="space-y-2">
            <Label htmlFor="create-password">Password *</Label>
            <Input
              id="create-password"
              type="password"
              placeholder="Secure password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              disabled={loading}
            />
            <p className="text-xs text-slate-600">Driver can change this after their first login.</p>
          </div>
        </FormSection>

        <FormSection title="Route & Vehicle Assignment (Optional)" description="Select a route and vehicle for the new driver">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-route">Route</Label>
              <select
                id="create-route"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={form.assigned_route_id}
                onChange={(e) => {
                  setForm({ ...form, assigned_route_id: e.target.value, assigned_vehicle_id: '' });
                }}
                disabled={loading}
              >
                <option value="">Select a route...</option>
                {getActiveRoutes().map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    Route {r.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-vehicle">Vehicle</Label>
              <select
                id="create-vehicle"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={form.assigned_vehicle_id}
                onChange={(e) => setForm({ ...form, assigned_vehicle_id: e.target.value })}
                disabled={!form.assigned_route_id || loading}
              >
                <option value="">Select a vehicle...</option>
                {form.assigned_route_id && getVehiclesForRoute(form.assigned_route_id).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registration_number} - {v.route_name || 'No route'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </FormSection>

        <div className="flex gap-2 mt-6 pt-6 border-t">
          <Button onClick={handleCreate} disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              '➕ Create Driver'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              fetchDrivers();
              fetchVehicles();
            }}
            disabled={loading}
          >
            🔄 Refresh
          </Button>
        </div>
      </div>
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

        <div className="mt-3 rounded-lg border bg-muted/30 p-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Driver view</label>
            <select
              className="w-full lg:max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedDriverId}
              onChange={(e) => {
                setSelectedDriverId(e.target.value);
                setShowAllDrivers(false);
              }}
              disabled={drivers.length === 0}
            >
              {drivers.length === 0 && <option value="">No drivers available</option>}
              {drivers.map((d) => {
                const id = getDriverUserId(d);
                return (
                  <option key={id} value={String(id)}>
                    {d.username} - {d.name || 'Unnamed'}
                  </option>
                );
              })}
            </select>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => goToDriverOffset(-1)} disabled={drivers.length <= 1}>Prev</Button>
              <Button size="sm" variant="outline" onClick={() => goToDriverOffset(1)} disabled={drivers.length <= 1}>Next</Button>
              <Button
                size="sm"
                variant={showAllDrivers ? 'default' : 'outline'}
                onClick={() => setShowAllDrivers((prev) => !prev)}
              >
                {showAllDrivers ? 'Show selected only' : 'Show all'}
              </Button>
            </div>
          </div>
          {!showAllDrivers && (
            <p className="text-xs text-muted-foreground mt-2">
              Showing one driver at a time to reduce scrolling. Use Prev/Next or dropdown to switch.
            </p>
          )}
        </div>

        <div className="grid gap-2 mt-2">
          {visibleDrivers.map((d) => (
            <div key={d.id} className="p-3 bg-card rounded-lg border"> 
              {(() => {
                const rowUserId = Number(d.user_id || d.userId);
                const assignmentStatus = assignmentStatusByDriver[rowUserId];
                const isCheckingStatus = Boolean(assignmentStatusLoading[rowUserId]);
                return (
                  <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-full overflow-hidden border bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                    {d.profile_image ? (
                      <img
                        src={resolveImageUrl(d.profile_image)}
                        alt={`${d.name || d.username} profile`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{String((d.name || d.username || 'D')).charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  <div>
                  <div className="font-medium">{d.username} — {d.name}</div>
                  <div className="text-sm text-muted-foreground">{d.email} {d.phone ? `• ${d.phone}` : ''}</div>
                  <div className="mt-1 text-xs">
                    {isCheckingStatus ? (
                      <span className="text-muted-foreground">Checking assignment status...</span>
                    ) : assignmentStatus?.has_vehicle_assigned ? (
                      <span className="text-green-700">
                        Assignment verified: {assignmentStatus.vehicle_registration || `Vehicle ID ${assignmentStatus.assigned_vehicle_id}`}
                        {assignmentStatus.route_name ? ` on ${assignmentStatus.route_name}` : ''}
                      </span>
                    ) : (
                      <span className="text-red-600">Assignment missing in backend</span>
                    )}
                  </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Vehicle: {d.vehicle_reg || 'none'}</div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => fetchDriverAssignmentStatus(rowUserId)}
                    disabled={isCheckingStatus || !rowUserId}
                  >
                    {isCheckingStatus ? 'Checking...' : 'Recheck assignment'}
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <label className="inline-flex items-center gap-2 cursor-pointer text-sm rounded-md border px-3 py-1.5 hover:bg-muted">
                  <span>{uploadingPhotoUserId === Number(d.user_id || d.userId) ? 'Uploading...' : 'Upload photo'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    disabled={uploadingPhotoUserId === Number(d.user_id || d.userId)}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      uploadDriverPhoto(Number(d.user_id || d.userId), file);
                      e.currentTarget.value = '';
                    }}
                  />
                </label>
                <span className="text-xs text-muted-foreground">JPG, PNG, WEBP up to 5MB</span>
              </div>

              <div className="flex gap-2 mt-3">
                <Button
                  onClick={async () => {
                    const name = window.prompt('Name', d.name || '') || d.name;
                    const phone = window.prompt('Phone', d.phone || '') || d.phone;
                    const driving_license = window.prompt('Driving license', d.driving_license || '') || d.driving_license;
                    const vehicleInput = window.prompt('Assigned vehicle id (enter number, or leave blank to keep current)', d.assigned_vehicle_id ? String(d.assigned_vehicle_id) : '');

                    try {
                      const payload: { name?: string; phone?: string; driving_license?: string; assigned_vehicle_id?: number | null } = { name, phone };
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

                      const res = await fetch(API_BASE + '/api/drivers/' + (d.user_id || d.userId), {
                        method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                        body: JSON.stringify(payload)
                      });
                      const data = await res.json();
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
                  const manualPasswordInput = window.prompt('Enter a new password for this driver. Leave blank to auto-generate one.');
                  if (manualPasswordInput === null) return;
                  const manualPassword = manualPasswordInput;
                  try {
                    const payload = manualPassword.trim() ? { newPassword: manualPassword.trim() } : {};
                    const res = await fetch(API_BASE + '/api/drivers/' + (d.user_id || d.userId) + '/reset_password', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                      body: JSON.stringify(payload),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      // show modal with password, copy button, and persist for quick-login convenience
                      try { navigator.clipboard.writeText(data.password); } catch (e) { console.warn('Clipboard write failed', e); }
                      try { localStorage.setItem('lastCreatedDriver', JSON.stringify({ username: d.username || d.user_name || d.name, password: data.password })); } catch (e) { console.warn('Storage write failed', e); }
                      setTempPassword({ username: d.username || d.user_name || d.name, password: data.password });
                      setShowTempPasswordModal(true);
                    } else {
                      toast({ title: 'Reset failed', description: data.message || data.error || 'Error', variant: 'destructive' });
                    }
                  } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : 'Error';
                    toast({ title: 'Reset failed', description: message, variant: 'destructive' });
                  }
                }}>
                  Reset Password
                </Button>

                <Button variant="destructive" onClick={async () => {
                  if (!window.confirm('Delete this driver? This will also remove the user account.')) return;
                  try {
                    const res = await fetch(API_BASE + '/api/drivers/' + (d.user_id || d.userId), { method: 'DELETE', headers: { ...getAuthHeaders() } });
                    const data = await res.json();
                    if (res.ok) {
                      toast({ title: 'Driver deleted' });
                      fetchDrivers();
                    } else {
                      toast({ title: 'Delete failed', description: data.message || data.error || 'Error', variant: 'destructive' });
                    }
                  } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : 'Error';
                    toast({ title: 'Delete failed', description: message, variant: 'destructive' });
                  }
                }}>Delete</Button>

              </div>

              <div className="mt-4 border-t pt-3">
                <p className="text-sm font-medium mb-3">Assign Route & Vehicle</p>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      className="w-full sm:max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={assignmentRoutes[getDriverUserId(d)] ?? ''}
                      onChange={(e) => {
                        setAssignmentRoutes((prev) => ({ ...prev, [getDriverUserId(d)]: e.target.value }));
                        setAssignmentDrafts((prev) => ({ ...prev, [getDriverUserId(d)]: '' }));
                      }}
                    >
                      <option value="">Select route...</option>
                      {getActiveRoutes().map((r) => (
                        <option key={r.id} value={String(r.id)}>
                          Route {r.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  {assignmentRoutes[getDriverUserId(d)] && (
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                      <select
                        className="w-full sm:max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={assignmentDrafts[getDriverUserId(d)] ?? (d.assigned_vehicle_id ? String(d.assigned_vehicle_id) : '')}
                        onChange={(e) => setAssignmentDrafts((prev) => ({ ...prev, [getDriverUserId(d)]: e.target.value }))}
                      >
                        <option value="">Unassign vehicle</option>
                        {getVehiclesForRoute(assignmentRoutes[getDriverUserId(d)], Number(d.user_id || d.userId)).map((v) => (
                          <option key={v.id} value={String(v.id)}>
                            {v.registration_number} — {v.route_name || 'No route'} [Available]
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="outline"
                        onClick={() => saveDriverAssignment(
                          Number(d.user_id || d.userId),
                          assignmentDrafts[getDriverUserId(d)] ?? (d.assigned_vehicle_id ? String(d.assigned_vehicle_id) : '')
                        )}
                        disabled={loading}
                      >
                        Save Assignment
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Select a route first, then choose an available vehicle from that route.
                  </p>
                </div>
              </div>

                  </>
                );
              })()}

            </div>
          ))}
        </div>

      {/* Temp password modal */}
      <Dialog open={showTempPasswordModal} onOpenChange={(open) => { if (!open) { setShowTempPasswordModal(false); setTempPassword(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Reset Result</DialogTitle>
            <DialogDescription>Use this password to log in. Copy it and share it with the driver securely.</DialogDescription>
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

