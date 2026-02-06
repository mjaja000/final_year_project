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

const OccupancyManager = () => {
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

  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [vehicleName, setVehicleName] = useState<string>("");
  const [occupancyStatus, setOccupancyStatus] = useState<string>("empty");

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
      .filter((r: RouteRecord) => Number.isFinite(r.id));
  }, [routesQuery.data]);

  useEffect(() => {
    if (routes.length > 0 && selectedRouteId === null) {
      setSelectedRouteId(routes[0].id);
    }
  }, [routes, selectedRouteId]);

  // Socket: listen for booking.created events and refresh occupancy if relevant
  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || '';
    const socket = io(API_BASE.replace(/http(s?):\/\//, ''));
    socket.on('connect', () => {
      socket.emit('join', 'admin');
    });

    socket.on('booking.created', (payload: any) => {
      try {
        const trip = payload.trip;
        if (payload?.booking || trip) {
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
          toast({ title: 'New booking', description: 'A booking was just created', variant: 'default' });
        }
      } catch (err) {
        // ignore
      }
    });

    socket.on('trip.updated', (trip: any) => {
      if (trip) {
        queryClient.invalidateQueries({ queryKey: ['vehicles'] });
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
    mutationFn: async ({ routeId, registrationNumber, status }: { routeId: number; registrationNumber: string; status: string }) => {
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

      const capacity = Number(vehicle?.capacity ?? 14);
      const normalizedStatus = status.toLowerCase();
      const occupancyValue = normalizedStatus === "full"
        ? capacity
        : normalizedStatus === "half-full"
          ? Math.ceil(capacity / 2)
          : 0;

      return api.occupancy.update(Number(vehicle?.id), { current_occupancy: occupancyValue });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast({ title: "Occupancy updated" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    },
  });

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) ?? null;

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
      status: occupancyStatus,
    });
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
          }}
          disabled={routesQuery.isFetching || vehiclesQuery.isFetching}
        >
          {routesQuery.isFetching || vehiclesQuery.isFetching ? "Refreshing..." : "Refresh"}
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
            <Label>Current Occupancy</Label>
            <select
              className="w-full rounded-md border px-3 py-2 bg-background"
              value={occupancyStatus}
              onChange={(e) => setOccupancyStatus(e.target.value)}
            >
              <option value="empty">Empty</option>
              <option value="half-full">Half-full</option>
              <option value="full">Full</option>
            </select>
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
              {occupancyStatus}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OccupancyManager;
