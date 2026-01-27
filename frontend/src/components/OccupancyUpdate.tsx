import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { routes as allRoutes } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Occ = 'empty' | 'half' | 'full';
const storageKey = 'matatu_occupancy_v1';

const OccupancyUpdate = () => {
  const [routeId, setRouteId] = useState(allRoutes[0]?.id ?? '');
  const [vehicle, setVehicle] = useState(allRoutes[0]?.vehicles[0] ?? '');
  const [status, setStatus] = useState<Occ>('half');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleRouteChange = (id: string) => {
    setRouteId(id);
    const r = allRoutes.find((x) => x.id === id);
    setVehicle(r?.vehicles[0] ?? '');
  };

  const getStatusColor = (s: Occ) => {
    switch (s) {
      case 'empty':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'half':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'full':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  };

  const save = () => {
    setLoading(true);
    setTimeout(() => {
      try {
        const raw = localStorage.getItem(storageKey);
        const map = raw ? JSON.parse(raw) : {};
        map[routeId] = map[routeId] || {};
        map[routeId][vehicle] = status;
        localStorage.setItem(storageKey, JSON.stringify(map));
        
        const statusLabel = status === 'empty' ? 'Empty' : status === 'half' ? 'Half-Full' : 'Full';
        toast({ 
          title: 'Occupancy Updated',
          description: `${vehicle} on ${allRoutes.find(r => r.id === routeId)?.name} is now ${statusLabel}.`
        });
      } catch (e) {
        toast({ 
          title: 'Error', 
          description: 'Failed to update occupancy.',
          variant: 'destructive'
        });
      }
      setLoading(false);
    }, 600);
  };

  const selectedRoute = allRoutes.find(r => r.id === routeId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center pb-4 border-b border-border">
        <h2 className="text-2xl font-bold text-foreground mb-2">Update Vehicle Occupancy</h2>
        <p className="text-sm text-muted-foreground">
          Driver / Conductor: Update your vehicle's current passenger status
        </p>
      </div>

      <div className="space-y-4">
        {/* Route Selection */}
        <div className="space-y-2">
          <Label htmlFor="routeSelect" className="font-semibold">Route</Label>
          <select 
            id="routeSelect"
            value={routeId} 
            onChange={(e) => handleRouteChange(e.target.value)} 
            className="w-full rounded-md border px-3 py-2 bg-background"
          >
            {allRoutes.map((r) => (
              <option key={r.id} value={r.id}>{r.name} — {r.from} → {r.to}</option>
            ))}
          </select>
        </div>

        {/* Vehicle Selection */}
        <div className="space-y-2">
          <Label htmlFor="vehicleSelect" className="font-semibold">Vehicle</Label>
          <select 
            id="vehicleSelect"
            value={vehicle} 
            onChange={(e) => setVehicle(e.target.value)} 
            className="w-full rounded-md border px-3 py-2 bg-background"
          >
            {(allRoutes.find((r) => r.id === routeId)?.vehicles ?? []).map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        {/* Route Info */}
        {selectedRoute && (
          <div className="p-3 bg-secondary/50 rounded-lg text-sm text-secondary-foreground">
            <p className="mb-1">Route: <span className="font-semibold">{selectedRoute.name}</span></p>
            <p>Fare: <span className="font-semibold">KES {selectedRoute.fare}</span></p>
          </div>
        )}
      </div>

      {/* Occupancy Status Selection */}
      <div className="space-y-3">
        <Label className="font-semibold">Current Occupancy Status</Label>
        <div className="space-y-2">
          {(['empty', 'half', 'full'] as const).map((occ) => {
            const labels = {
              empty: '🚕 Empty - No Passengers',
              half: '🚗 Half-Full - Some Seats Available',
              full: '🚙 Full - All Seats Taken'
            };
            return (
              <button
                key={occ}
                onClick={() => setStatus(occ)}
                className={cn(
                  'w-full p-3 rounded-lg border-2 transition-all text-left',
                  status === occ
                    ? `border-primary ${getStatusColor(occ)}`
                    : 'border-border hover:border-primary/50'
                )}
              >
                <p className="font-semibold">{labels[occ]}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Status Display */}
      <div className={cn(
        'p-4 rounded-lg text-center text-sm font-semibold',
        getStatusColor(status)
      )}>
        <p className="text-xs opacity-75 mb-1">Currently set to:</p>
        <p className="text-lg">{status === 'empty' ? '🚕 Empty' : status === 'half' ? '🚗 Half-Full' : '🚙 Full'}</p>
      </div>

      {/* Submit Button */}
      <Button 
        onClick={save} 
        disabled={loading} 
        variant="hero"
        className="w-full"
      >
        {loading ? 'Updating...' : 'Update Occupancy Status'}
      </Button>
    </div>
  );
};

export default OccupancyUpdate;
