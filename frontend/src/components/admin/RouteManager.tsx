import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import LocationPicker from "./LocationPicker";

interface RouteRecord {
  id: number;
  route_name?: string;
  start_location?: string;
  end_location?: string;
  price?: number;
  distance_km?: number;
  base_fare?: number;
  status?: string;
}

const initialForm = {
  route_name: "",
  start_location: "",
  end_location: "",
  start_latitude: null as number | null,
  start_longitude: null as number | null,
  end_latitude: null as number | null,
  end_longitude: null as number | null,
  price: "",
  distance_km: "",
};

const RouteManager = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState(initialForm);

  const routesQuery = useQuery({
    queryKey: ["routes"],
    queryFn: api.routes.getAll,
  });

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
      .filter((r: RouteRecord) => Number.isFinite(r.id) && r.status !== "inactive");
  }, [routesQuery.data]);

  const createRoute = useMutation({
    mutationFn: (payload: any) => api.routes.create(payload),
    onSuccess: () => {
      setForm(initialForm);
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      toast({ title: "Route created successfully!" });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to create route",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteRoute = useMutation({
    mutationFn: (routeId: number) => api.routes.delete(routeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      toast({ title: "Route deleted" });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to delete route",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.route_name.trim() || !form.start_location || !form.end_location) {
      toast({
        title: "Fill all fields",
        description: "Route name, start location, and end location are required",
        variant: "destructive",
      });
      return;
    }

    if (
      !form.start_latitude ||
      !form.start_longitude ||
      !form.end_latitude ||
      !form.end_longitude
    ) {
      toast({
        title: "Select locations on map",
        description:
          "Please use the location pickers to select both start and end points",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      route_name: form.route_name.trim(),
      start_location: form.start_location,
      end_location: form.end_location,
      base_fare: Number(form.price) || 0,
      distance_km: Number(form.distance_km) || 0,
      start_latitude: form.start_latitude,
      start_longitude: form.start_longitude,
      end_latitude: form.end_latitude,
      end_longitude: form.end_longitude,
    };

    console.log('[RouteManager] Submitting payload:', payload);
    createRoute.mutate(payload);
  };

  const handleDelete = (route: RouteRecord) => {
    const routeLabel = route.route_name || `Route ${route.id}`;
    const confirmed = window.confirm(`Delete ${routeLabel}?`);
    if (!confirmed) return;
    deleteRoute.mutate(route.id);
  };

  return (
    <div className="border border-border rounded-xl p-4 sm:p-5 bg-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">Manage routes & fares</p>
          <h3 className="text-lg font-semibold">Routes Management</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => routesQuery.refetch()}
          disabled={routesQuery.isFetching}
        >
          {routesQuery.isFetching ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="space-y-6">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Create a new route</p>
            <h3 className="text-lg font-semibold">Add Route</h3>
          </div>

          <div className="space-y-4">
            {/* Route Name */}
            <div className="space-y-1">
              <Label>Route Name</Label>
              <Input
                value={form.route_name}
                onChange={(e) =>
                  setForm({ ...form, route_name: e.target.value })
                }
                placeholder="e.g., Route 23"
                required
              />
            </div>

            {/* Price and Distance - moved up before maps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Price (KES)</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="e.g., 80"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Distance (km)</Label>
                <Input
                  type="number"
                  value={form.distance_km}
                  onChange={(e) =>
                    setForm({ ...form, distance_km: e.target.value })
                  }
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Location Pickers - Side by Side on Desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Location Picker */}
              <div className="min-h-0">
                <LocationPicker
                  label="Start Location"
                  locationName={form.start_location}
                  latitude={form.start_latitude}
                  longitude={form.start_longitude}
                  mapHeight="h-48"
                  onLocationChange={(name, lat, lng) =>
                    setForm({
                      ...form,
                      start_location: name,
                      start_latitude: lat,
                      start_longitude: lng,
                    })
                  }
                />
              </div>

              {/* End Location Picker */}
              <div className="min-h-0">
                <LocationPicker
                  label="End Location"
                  locationName={form.end_location}
                  latitude={form.end_latitude}
                  longitude={form.end_longitude}
                  mapHeight="h-48"
                  onLocationChange={(name, lat, lng) =>
                    setForm({
                      ...form,
                      end_location: name,
                      end_latitude: lat,
                      end_longitude: lng,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
            <p className="font-semibold text-green-900 mb-2">✨ How to Create Routes</p>
            <ul className="text-green-800 text-xs space-y-1">
              <li>
                <strong>1. Route Name:</strong> Give your route a name (e.g., "CBD to Westlands")
              </li>
              <li>
                <strong>2. Price & Distance:</strong> Enter fare in KES and optional distance
              </li>
              <li>
                <strong>3. Start Location:</strong> Type a place name or click the map to pin
              </li>
              <li>
                <strong>4. End Location:</strong> Type a place name or click the map to pin
              </li>
              <li>
                <strong>5. Save:</strong> Click "Create Route" and see it on the occupancy map!
              </li>
            </ul>
          </div>

          <Separator />

          <Button
            type="submit"
            className="w-full"
            variant="hero"
            disabled={createRoute.isPending}
          >
            {createRoute.isPending ? "Saving..." : "Create Route"}
          </Button>
        </form>

        <Separator />

        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Manage existing routes</p>
            <h3 className="text-lg font-semibold">Route List</h3>
          </div>

          {routes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No routes available.</p>
          ) : (
            <div className="space-y-2">
              {routes.map((route) => {
                const routeLabel = route.route_name || `Route ${route.id}`;
                const start = route.start_location || "";
                const end = route.end_location || "";
                const fare = Number(route.base_fare ?? route.price ?? 0);
                const distance =
                  typeof route.distance_km === "number"
                    ? route.distance_km
                    : null;

                return (
                  <div
                    key={route.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border bg-background p-3"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold">{routeLabel}</p>
                      <p className="text-sm text-muted-foreground">
                        {start} → {end}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Fare: KES {fare}
                        {distance !== null ? ` | Distance: ${distance} km` : ""}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(route)}
                      disabled={deleteRoute.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteManager;
