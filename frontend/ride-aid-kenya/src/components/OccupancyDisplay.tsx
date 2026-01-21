import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { routes as allRoutes } from '@/lib/mockData';
import { cn } from '@/lib/utils';

type Occ = 'empty' | 'half' | 'full';

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

const defaultOccupancy = () => {
  const map: Record<string, Record<string, Occ>> = {};
  allRoutes.forEach((r) => {
    map[r.id] = {};
    r.vehicles.forEach((v) => {
      const rnd = Math.random();
      const s: Occ = rnd < 0.4 ? 'empty' : rnd < 0.85 ? 'half' : 'full';
      map[r.id][v] = s;
    });
  });
  return map;
};

const storageKey = 'matatu_occupancy_v1';

const OccupancyDisplay = () => {
  const [data, setData] = useState<Record<string, Record<string, Occ>>>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : defaultOccupancy();
    } catch (e) {
      return defaultOccupancy();
    }
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => {
      // auto refresh to simulate near-real-time
      refresh();
    }, 15000);
    return () => clearInterval(id);
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          setData(JSON.parse(raw));
        } else {
          const d = defaultOccupancy();
          localStorage.setItem(storageKey, JSON.stringify(d));
          setData(d);
        }
      } catch (e) {
        setData(defaultOccupancy());
      }
      setLastUpdated(new Date());
      setLoading(false);
    }, 600);
  }, []);

  const getStats = () => {
    let empty = 0, half = 0, full = 0;
    Object.values(data).forEach((routeVehicles) => {
      Object.values(routeVehicles).forEach((status) => {
        if (status === 'empty') empty++;
        else if (status === 'half') half++;
        else if (status === 'full') full++;
      });
    });
    return { empty, half, full };
  };

  const stats = getStats();
  const total = stats.empty + stats.half + stats.full;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Occupancy Overview</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time vehicle capacity status across all routes
          </p>
        </div>
        <Button onClick={refresh} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-600 dark:text-blue-300 font-medium mb-1">Empty</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.empty}</p>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">{total > 0 ? Math.round((stats.empty / total) * 100) : 0}% of fleet</p>
        </div>
        <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-xs text-yellow-600 dark:text-yellow-300 font-medium mb-1">Half-Full</p>
          <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.half}</p>
          <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">{total > 0 ? Math.round((stats.half / total) * 100) : 0}% of fleet</p>
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-300 font-medium mb-1">Full</p>
          <p className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.full}</p>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">{total > 0 ? Math.round((stats.full / total) * 100) : 0}% of fleet</p>
        </div>
      </div>

      {/* Last Updated */}
      <p className="text-xs text-muted-foreground text-center">
        Last updated: {lastUpdated.toLocaleTimeString('en-KE')}
      </p>

      {/* Routes */}
      <div className="space-y-4">
        {allRoutes.map((r) => (
          <div key={r.id} className="p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors">
            {/* Route Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-semibold text-foreground">{r.name}</p>
                <p className="text-sm text-muted-foreground">{r.from} → {r.to}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">KES {r.fare}</p>
                <p className="text-xs text-muted-foreground">{r.vehicles.length} vehicles</p>
              </div>
            </div>

            {/* Vehicles Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {r.vehicles.map((v) => {
                const s = (data[r.id] && data[r.id][v]) || 'empty';
                return (
                  <div
                    key={v}
                    className={cn(
                      'p-3 rounded-lg border-2 transition-all cursor-default',
                      statusColor(s)
                    )}
                  >
                    <p className="font-mono text-sm font-semibold mb-1">{v}</p>
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
      <div className="p-3 bg-muted rounded-lg flex gap-2 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>This occupancy data is updated by drivers and conductors in real-time.</p>
      </div>
    </div>
  );
};

export default OccupancyDisplay;
