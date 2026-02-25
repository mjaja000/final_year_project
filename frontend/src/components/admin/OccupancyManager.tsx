import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import io from 'socket.io-client';

interface RouteRecord {
  id: number;
  route_name?: string;
  start_location?: string;
  end_location?: string;
  startLocation?: string;
  endLocation?: string;
}

interface VehicleRecord {
  id: number;
  vehicle_number?: string;
  vehicleNumber?: string;
  route_id?: number;
  routeId?: number;
  capacity?: number;
}

interface OccupancyRecord {
  vehicle_id?: number;
  vehicleId?: number;
  registration_number?: string;
  vehicle_number?: string;
  vehicleNumber?: string;
  route_id?: number;
  routeId?: number;
  route_name?: string;
  start_location?: string;
  end_location?: string;
  current_occupancy?: number;
  occupancy_status?: string;
  updated_at?: string;
}

const OccupancyManager = ({ station = '' }: { station?: string }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const vehiclesQuery = useQuery({
    queryKey: ["vehicles"],
    queryFn: api.vehicles.getAll,
  });

  const routesQuery = useQuery({
    queryKey: ["routes"],
    queryFn: api.routes.getAll,
  });

  const occupancyQuery = useQuery({
    queryKey: ["occupancy"],
    queryFn: api.occupancy.getAll,
  });

  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [vehicleName, setVehicleName] = useState<string>("");
  const [occupancyCount, setOccupancyCount] = useState<number>(0);

  const vehicles: VehicleRecord[] = useMemo(() => {
    const raw = Array.isArray(vehiclesQuery.data)
      ? vehiclesQuery.data
      : Array.isArray((vehiclesQuery.data as any)?.vehicles)
        ? (vehiclesQuery.data as any).vehicles
        : [];

    return raw
      .map((v: any) => ({
        ...v,
        id: Number(v.id ?? v.vehicle_id ?? v.vehicleId ?? 0),
      }))
      .filter((v: VehicleRecord) => Number.isFinite(v.id));
  }, [vehiclesQuery.data]);

  const routes: RouteRecord[] = useMemo(() => {
    const raw = Array.isArray(routesQuery.data)
      ? routesQuery.data
      : Array.isArray((routesQuery.data as any)?.routes)
        ? (routesQuery.data as any).routes
        : [];

    return raw
      .map((r: any) => ({
        ...r,
        id: Number(r.id ?? r.route_id ?? r.routeId ?? 0),
      }))
      .filter((r: RouteRecord) => Number.isFinite(r.id))
      .filter((r: RouteRecord) =>
        !station || r.start_location === station || r.end_location === station
      );
  }, [routesQuery.data, station]);

  const occupancies: OccupancyRecord[] = useMemo(() => {
    const raw = Array.isArray(occupancyQuery.data)
      ? occupancyQuery.data
      : Array.isArray((occupancyQuery.data as any)?.occupancies)
        ? (occupancyQuery.data as any).occupancies
        : [];

    return raw
      .map((o: any) => ({
        ...o,
        vehicle_id: Number(o.vehicle_id ?? o.vehicleId ?? 0),
        route_id: Number(o.route_id ?? o.routeId ?? 0),
      }))
      .filter((o: OccupancyRecord) => Number.isFinite(o.vehicle_id))
      .filter((o: OccupancyRecord) =>
        !station || o.start_location === station || o.end_location === station
      );
  }, [occupancyQuery.data, station]);

  useEffect(() => {
    if (routes.length > 0 && selectedRouteId === null) {
      setSelectedRouteId(routes[0].id);
    }
  }, [routes, selectedRouteId]);

  // Socket: listen for booking.created events and refresh occupancy if relevant
  useEffect(() => {
    const socket = io();
    socket.on('connect', () => {
      socket.emit('join', 'admin');
    });

    socket.on('booking.created', (payload: any) => {
      try {
        const trip = payload.trip;
        if (payload?.booking || trip) {
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
          queryClient.invalidateQueries({ queryKey: ['occupancy'] });
          toast({ title: 'New booking', description: 'A booking was just created', variant: 'default' });
        }
      } catch (err) {
        // ignore
      }
    });

    socket.on('trip.updated', (trip: any) => {
      if (trip) {
        queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        queryClient.invalidateQueries({ queryKey: ['occupancy'] });
        toast({ title: 'Trip updated', description: `Trip ${trip.id} status changed to ${trip.status}`, variant: 'default' });
      }
    });

    return () => {
      socket.off('booking.created');
      socket.off('trip.updated');
      socket.disconnect();
    };
  }, [queryClient, toast]);

  const updateOccupancy = useMutation({
    mutationFn: async ({ routeId, registrationNumber, count }: { routeId: number; registrationNumber: string; count: number }) => {
      const normalized = registrationNumber.trim();
      const existing = vehicles.find((v) => {
        const name = (v.vehicle_number || v.vehicleNumber || "").toLowerCase();
        return name === normalized.toLowerCase();
      });

      let vehicle = existing;

      if (!vehicle) {
        const created = await api.vehicles.create({
          registration_number: normalized,
          route_id: routeId,
        });
        vehicle = created?.vehicle || created;
      }

      return api.occupancy.update(Number(vehicle?.id), { current_occupancy: count });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["occupancy"] });
      toast({ title: "Occupancy updated" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    },
  });

  const deleteOccupancy = useMutation({
    mutationFn: (vehicleId: number) => api.occupancy.delete(vehicleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["occupancy"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast({ title: "Occupancy deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to delete occupancy", description: err.message, variant: "destructive" });
    },
  });

  const formatUpdatedAt = (value?: string) => {
    if (!value) return "Unknown";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) ?? null;
  const filteredOccupancies = selectedRouteId
    ? occupancies.filter((o) => Number(o.route_id ?? 0) === selectedRouteId)
    : occupancies;

  const handleSave = () => {
    if (!selectedRouteId) {
      toast({ title: "Select a route", description: "Please choose a route first", variant: "destructive" });
      return;
    }
    if (!vehicleName.trim()) {
      toast({ title: "Vehicle name required", description: "Please enter a vehicle name", variant: "destructive" });
      return;
    }
    updateOccupancy.mutate({
      routeId: selectedRouteId,
      registrationNumber: vehicleName,
      count: occupancyCount,
    });
  };

  const handleDeleteOccupancy = (record: OccupancyRecord) => {
    const vehicleId = Number(record.vehicle_id ?? record.vehicleId ?? 0);
    if (!vehicleId) return;
    const vehicleLabel = record.registration_number || record.vehicle_number || record.vehicleNumber || `Vehicle ${vehicleId}`;
    const confirmed = window.confirm(`Delete occupancy for ${vehicleLabel}?`);
    if (!confirmed) return;
    deleteOccupancy.mutate(vehicleId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Set live occupancy for vehicles</p>
          <h3 className="text-lg font-semibold">Occupancy Control</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            routesQuery.refetch();
            vehiclesQuery.refetch();
            occupancyQuery.refetch();
          }}
          disabled={routesQuery.isFetching || vehiclesQuery.isFetching || occupancyQuery.isFetching}
        >
          {routesQuery.isFetching || vehiclesQuery.isFetching || occupancyQuery.isFetching ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.1fr,1fr]">
        <div className="border border-border rounded-lg p-4 bg-card space-y-4">
          <div className="space-y-2">
            <Label>Route Number</Label>
            <select
              className="w-full rounded-md border px-3 py-2 bg-background"
              value={selectedRouteId ?? ""}
              onChange={(e) => setSelectedRouteId(Number(e.target.value))}
            >
              {routes.map((r) => {
                const numberLabel = r.route_name || `Route ${r.id}`;
                return (
                  <option key={r.id} value={r.id}>
                    {numberLabel}
                  </option>
                );
              })}
            </select>
            {routes.length === 0 && (
              <p className="text-sm text-muted-foreground">No routes found. Add routes first.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Route Name</Label>
            <select
              className="w-full rounded-md border px-3 py-2 bg-background"
              value={selectedRouteId ?? ""}
              onChange={(e) => setSelectedRouteId(Number(e.target.value))}
            >
              {routes.map((r) => {
                const start = r.start_location || r.startLocation || "";
                const end = r.end_location || r.endLocation || "";
                const label = `${start} to ${end}`.trim();
                return (
                  <option key={r.id} value={r.id}>
                    {label || `Route ${r.id}`}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Vehicle Name</Label>
            <Input
              value={vehicleName}
              onChange={(e) => setVehicleName(e.target.value)}
              placeholder="e.g., KCA 123X"
            />
          </div>

          <div className="space-y-2">
            <Label>Number of Passengers (manual / cash payment)</Label>
            <Input
              type="number"
              min={0}
              max={selectedRouteId ? (vehicles.find(v => {
                const vName = (v.vehicle_number || v.vehicleNumber || "").toLowerCase();
                return vName === vehicleName.toLowerCase();
              })?.capacity ?? 14) : 14}
              value={occupancyCount}
              onChange={(e) => setOccupancyCount(Math.max(0, Number(e.target.value)))}
              placeholder="e.g., 8"
            />
            <p className="text-xs text-muted-foreground">Enter actual passenger count (0 = empty, up to vehicle capacity)</p>
          </div>

          <Button onClick={handleSave} className="w-full" variant="hero" disabled={updateOccupancy.isPending || routes.length === 0}>
            {updateOccupancy.isPending ? "Saving..." : "Update Occupancy"}
          </Button>
        </div>

        <div className="border border-border rounded-lg p-4 bg-card space-y-3">
          <h4 className="font-semibold">Selection Details</h4>
          <Separator />
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-semibold text-foreground">Route:</span>{" "}
              {selectedRoute
                ? `${selectedRoute.start_location || selectedRoute.startLocation || ""} to ${selectedRoute.end_location || selectedRoute.endLocation || ""}`.trim()
                : "Select a route"}
            </p>
            <p>
              <span className="font-semibold text-foreground">Vehicle:</span>{" "}
              {vehicleName.trim() || "Enter a vehicle name"}
            </p>
            <p>
              <span className="font-semibold text-foreground">Occupancy:</span>{" "}
              {occupancyCount} passengers
            </p>
          </div>
        </div>
      </div>

      <div className="border border-border rounded-lg p-4 bg-card space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Remove incorrect entries</p>
            <h4 className="font-semibold">Current Occupancies</h4>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => occupancyQuery.refetch()}
            disabled={occupancyQuery.isFetching}
          >
            {occupancyQuery.isFetching ? "Refreshing..." : "Refresh list"}
          </Button>
        </div>
        <Separator />

        <div className="space-y-3">
          {filteredOccupancies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No occupancy records found for this route.</p>
          ) : (
            filteredOccupancies.map((record, idx) => {
              const vehicleLabel = record.registration_number || record.vehicle_number || record.vehicleNumber || "Unknown vehicle";
              const keyValue = String(record.vehicle_id ?? record.vehicleId ?? vehicleLabel);
              const start = record.start_location || "";
              const end = record.end_location || "";
              const routeLabel = (start && end) ? `${start} to ${end}` : (record.route_name || "Route not set");
              const occupancyValue = typeof record.current_occupancy === "number" ? record.current_occupancy : 0;
              // Active vehicle = first non-full one per route (ordered by vehicle_id asc)
              const capacityVal = (record as any).capacity ?? 14;
              const isActive = idx === filteredOccupancies.findIndex(
                r => (r.current_occupancy ?? 0) < ((r as any).capacity ?? 14)
              );

              return (
                <div
                  key={keyValue}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border bg-background p-3 ${isActive ? 'border-green-400 bg-green-50' : 'border-border'}`}
                >
                  <div className="space-y-1">
                    <p className="font-semibold flex items-center gap-2">
                      {vehicleLabel}
                      {isActive && <span className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded-full">● Filling Now</span>}
                    </p>
                    <p className="text-sm text-muted-foreground">{routeLabel}</p>
                    <p className="text-xs font-bold text-foreground">
                      {occupancyValue} / {capacityVal} passengers
                      <span className="ml-2 text-muted-foreground font-normal">| Updated: {formatUpdatedAt(record.updated_at)}</span>
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteOccupancy(record)}
                    disabled={deleteOccupancy.isPending}
                  >
                    Delete
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default OccupancyManager;
