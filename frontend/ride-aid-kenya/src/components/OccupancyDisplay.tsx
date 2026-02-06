import { useEffect, useState, useCallback, useMemo } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';

type Occ = 'empty' | 'half' | 'full';

type RouteRecord = {
  id: number;
  route_name?: string;
  start_location?: string;
  end_location?: string;
  base_fare?: number;
};

type OccupancyRecord = {
  vehicle_id?: number;
  vehicleId?: number;
  registration_number?: string;
  occupancy_status?: string;
  current_occupancy?: number;
  capacity?: number;
  route_id?: number;
};

type DisplayRoute = {
  id: number;
  name: string;
  from: string;
  to: string;
  fare: number;
  vehicles: Array<{ id: number; name: string; status: Occ }>;
};

const statusColor = (s: Occ) => {
  switch (s) {
    case 'empty':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'half':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'full':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  }
};

const statusEmoji = (s: Occ) => {
  switch (s) {
    case 'empty':
      return '🚕';
    case 'half':
      return '🚗';
    case 'full':
      return '🚙';
  }
};

const statusLabel = (s: Occ) => {
  switch (s) {
    case 'empty':
      return 'Empty';
    case 'half':
      return 'Half-Full';
    case 'full':
      return 'Full';
  }
};

const OccupancyDisplay = ({ interactive = true, showPayButton = true }: OccupancyDisplayProps) => {
  const [routes, setRoutes] = useState<DisplayRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [routesRes, occRes] = await Promise.all([
        api.routes.getAll(),
        api.occupancy.getAll(),
      ]);

      const routeList: RouteRecord[] = Array.isArray(routesRes)
        ? routesRes
        : Array.isArray((routesRes as any)?.routes)
          ? (routesRes as any).routes
          : [];

      const occList: OccupancyRecord[] = Array.isArray(occRes)
        ? occRes
        : Array.isArray((occRes as any)?.occupancies)
          ? (occRes as any).occupancies
          : [];

      const routeMap = new Map<number, DisplayRoute>();
      routeList.forEach((r) => {
        routeMap.set(Number(r.id), {
          id: Number(r.id),
          name: r.route_name || `Route ${r.id}`,
          from: r.start_location || '',
          to: r.end_location || '',
          fare: Number(r.base_fare || 0),
          vehicles: [],
        });
      });

      const toStatus = (record: OccupancyRecord): Occ => {
        const capacity = Number(record.capacity ?? 14);
        const current = Number(record.current_occupancy ?? 0);
        if (Number.isFinite(current)) {
          if (current <= 0) return 'empty';
          if (current >= capacity) return 'full';
          return 'half';
        }
        const raw = (record.occupancy_status || '').toLowerCase();
        if (raw === 'full') return 'full';
        return 'empty';
      };

      occList.forEach((o, index) => {
        const routeId = Number(o.route_id ?? 0);
        const vehicleId = Number(o.vehicle_id ?? o.vehicleId ?? index + 1);
        const name = o.registration_number || `Vehicle ${vehicleId}`;
        const status = toStatus(o);

        if (!routeMap.has(routeId)) {
          routeMap.set(routeId, {
            id: routeId,
            name: (o as any).route_name || `Route ${routeId || 'Unknown'}`,
            from: (o as any).start_location || '',
            to: (o as any).end_location || '',
            fare: Number((o as any).base_fare || 0),
            vehicles: [],
          });
        }

        routeMap.get(routeId)!.vehicles.push({ id: vehicleId, name, status });
      });

      const mapped = Array.from(routeMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      setRoutes(mapped);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.message || 'Failed to load occupancy');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(() => {
      // auto refresh to simulate near-real-time
      refresh();
    }, 15000);
    return () => clearInterval(id);
  }, [refresh]);

  const stats = useMemo(() => {
    let empty = 0, half = 0, full = 0;
    routes.forEach((route) => {
      route.vehicles.forEach((v) => {
        if (v.status === 'empty') empty++;
        else if (v.status === 'half') half++;
        else if (v.status === 'full') full++;
      });
    });
    return { empty, half, full };
  }, [routes]);
  const total = stats.empty + stats.half + stats.full;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-foreground">Occupancy Overview</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time vehicle capacity status across all routes
          </p>
        </div>
        <Button onClick={refresh} variant="outline" size="sm" disabled={loading} className="w-full sm:w-auto">
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="p-2 sm:p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-600 dark:text-blue-300 font-medium mb-1">Empty</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.empty}</p>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">{total > 0 ? Math.round((stats.empty / total) * 100) : 0}%</p>
        </div>
        <div className="p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-xs text-yellow-600 dark:text-yellow-300 font-medium mb-1">Half-Full</p>
          <p className="text-xl sm:text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.half}</p>
          <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">{total > 0 ? Math.round((stats.half / total) * 100) : 0}%</p>
        </div>
        <div className="p-2 sm:p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-300 font-medium mb-1">Full</p>
          <p className="text-xl sm:text-2xl font-bold text-red-900 dark:text-red-100">{stats.full}</p>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">{total > 0 ? Math.round((stats.full / total) * 100) : 0}%</p>
        </div>
      </div>

      {/* Last Updated */}
      <p className="text-xs text-muted-foreground text-center">
        Last updated: {lastUpdated.toLocaleTimeString('en-KE')}
      </p>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs sm:text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Routes */}
      <div className="space-y-3 sm:space-y-4">
        {routes.length === 0 && !loading && (
          <div className="p-4 bg-card border border-border rounded-lg text-sm text-muted-foreground">
            No occupancy data yet. Add routes and update occupancy from the admin dashboard.
          </div>
        )}
        {routes.map((r) => (
          <div key={r.id} className="p-3 sm:p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors">
            {/* Route Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
              <div className="flex-1">
                <p className="font-semibold text-sm sm:text-base text-foreground">{r.name}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{r.from} → {r.to}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs sm:text-sm font-medium text-foreground">KES {r.fare}</p>
                <p className="text-xs text-muted-foreground">{r.vehicles.length} vehicles</p>
                {showPayButton && (
                  <div className="mt-3">
                    <Button
                      onClick={() => navigate(`/payment?routeId=${encodeURIComponent(r.id)}`)}
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Pay KES {r.fare}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicles Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2">
              {r.vehicles.length === 0 && (
                <div className="col-span-2 sm:col-span-3 lg:col-span-4 text-xs sm:text-sm text-muted-foreground">
                  No vehicles updated for this route yet.
                </div>
              )}
              {r.vehicles.map((v) => {
                const s = v.status || 'empty';
                const cardClass = cn(
                  'p-2 sm:p-3 rounded-lg border-2 transition-all text-left',
                  statusColor(s),
                  interactive ? 'cursor-pointer hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40' : 'cursor-default'
                );

                if (interactive) {
                  return (
                    <button
                      type="button"
                      key={v.id}
                      onClick={() => navigate(`/payment?routeId=${encodeURIComponent(r.id)}&vehicle=${encodeURIComponent(v.name)}`)}
                      className={cardClass}
                    >
                      <p className="font-mono text-xs sm:text-sm font-semibold mb-1">{v.name}</p>
                      <p className="text-xs font-medium">
                        {statusEmoji(s)} {statusLabel(s)}
                      </p>
                    </button>
                  );
                }

                return (
                  <div key={v.id} className={cardClass}>
                    <p className="font-mono text-xs sm:text-sm font-semibold mb-1">{v.name}</p>
                    <p className="text-xs font-medium">
                      {statusEmoji(s)} {statusLabel(s)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="p-3 bg-muted rounded-lg flex gap-2 text-xs sm:text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>This occupancy data is updated by drivers and admins in real-time.</p>
      </div>
    </div>
  );
};

export default OccupancyDisplay;
