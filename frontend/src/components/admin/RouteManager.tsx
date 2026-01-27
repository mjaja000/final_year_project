import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface RouteRecord {
  id: number;
  route_name?: string;
  start_location?: string;
  end_location?: string;
  price?: number;
  distance_km?: number;
}

const initialForm = {
  route_name: "",
  start_location: "",
  end_location: "",
  price: "",
  distance_km: "",
};

const RouteManager = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState(initialForm);
  const [priceEdits, setPriceEdits] = useState<Record<number, string>>({});

  const routesQuery = useQuery({
    queryKey: ["routes"],
    queryFn: api.routes.getAll,
  });

  const createRoute = useMutation({
    mutationFn: (payload: any) => api.routes.create(payload),
    onSuccess: () => {
      setForm(initialForm);
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      toast({ title: "Route created" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to create route", description: err.message, variant: "destructive" });
    },
  });

  const updatePrice = useMutation({
    mutationFn: ({ id, price }: { id: number; price: number }) => api.routes.update(id, { price }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      toast({ title: "Price updated" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update price", description: err.message, variant: "destructive" });
    },
  });

  const deleteRoute = useMutation({
    mutationFn: (id: number) => api.routes.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      toast({ title: "Route deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to delete route", description: err.message, variant: "destructive" });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      route_name: form.route_name.trim(),
      start_location: form.start_location.trim(),
      end_location: form.end_location.trim(),
      price: Number(form.price) || 0,
      distance_km: Number(form.distance_km) || 0,
    };
    if (!payload.route_name || !payload.start_location || !payload.end_location) {
      toast({ title: "Fill all fields", description: "Route name, start and end locations are required", variant: "destructive" });
      return;
    }
    createRoute.mutate(payload);
  };

  const handlePriceSave = (route: RouteRecord) => {
    const value = priceEdits[route.id] ?? route.price ?? 0;
    const price = Number(value);
    if (Number.isNaN(price)) {
      toast({ title: "Invalid price", description: "Enter a numeric value", variant: "destructive" });
      return;
    }
    updatePrice.mutate({ id: route.id, price });
  };

  const sortedRoutes = useMemo(() => {
    const raw = Array.isArray(routesQuery.data)
      ? routesQuery.data
      : Array.isArray((routesQuery.data as any)?.routes)
        ? (routesQuery.data as any).routes
        : [];

    const normalized = raw
      .map((r: any) => ({
        ...r,
        id: Number(r.id ?? r.route_id ?? r.routeId ?? 0),
      }))
      .filter((r: RouteRecord) => Number.isFinite(r.id));

    return normalized.sort((a: RouteRecord, b: RouteRecord) => a.id - b.id);
  }, [routesQuery.data]);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-[1.2fr,1fr]">
        {/* Existing routes */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">Manage routes & fares</p>
              <h3 className="text-lg font-semibold">Routes & Prices</h3>
            </div>
            <Button variant="outline" size="sm" onClick={() => routesQuery.refetch()} disabled={routesQuery.isFetching}>
              {routesQuery.isFetching ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {routesQuery.isLoading && <p className="text-sm text-muted-foreground">Loading routes...</p>}
            {routesQuery.isError && (
              <p className="text-sm text-destructive">Failed to load routes. Ensure the backend is running.</p>
            )}

            {sortedRoutes.map((route) => {
              const priceValue = priceEdits[route.id] ?? (route.price ?? "").toString();
              return (
                <div key={route.id} className="border border-border rounded-md p-3 space-y-2 bg-background">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{route.route_name ?? `Route #${route.id}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {(route.start_location ?? "?")} → {(route.end_location ?? "?")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => {
                        if (window.confirm("Delete this route?")) {
                          deleteRoute.mutate(route.id);
                        }
                      }}
                      disabled={deleteRoute.isPending}
                    >
                      Delete
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[1fr,120px,110px] gap-3 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs">Price (KES)</Label>
                      <Input
                        type="number"
                        value={priceValue}
                        onChange={(e) => setPriceEdits((prev) => ({ ...prev, [route.id]: e.target.value }))}
                      />
                    </div>
                    <Button
                      onClick={() => handlePriceSave(route)}
                      disabled={updatePrice.isPending}
                      variant="hero"
                    >
                      Save Price
                    </Button>
                    <div className="text-xs text-muted-foreground sm:text-right">
                      {route.distance_km ? `${route.distance_km} km` : ""}
                    </div>
                  </div>
                </div>
              );
            })}

            {routesQuery.data && sortedRoutes.length === 0 && (
              <p className="text-sm text-muted-foreground">No routes found. Add one using the form on the right.</p>
            )}
          </div>
        </div>

        {/* Create route */}
        <form onSubmit={handleCreate} className="border border-border rounded-lg p-4 bg-card space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Create a new route</p>
            <h3 className="text-lg font-semibold">Add Route</h3>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Route Name</Label>
              <Input
                value={form.route_name}
                onChange={(e) => setForm({ ...form, route_name: e.target.value })}
                placeholder="e.g., Route 23"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Start Location</Label>
              <Input
                value={form.start_location}
                onChange={(e) => setForm({ ...form, start_location: e.target.value })}
                placeholder="e.g., CBD Nairobi"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>End Location</Label>
              <Input
                value={form.end_location}
                onChange={(e) => setForm({ ...form, end_location: e.target.value })}
                placeholder="e.g., Westlands"
                required
              />
            </div>
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
                  onChange={(e) => setForm({ ...form, distance_km: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          <Separator />

          <Button type="submit" className="w-full" variant="hero" disabled={createRoute.isPending}>
            {createRoute.isPending ? "Saving..." : "Create Route"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RouteManager;
