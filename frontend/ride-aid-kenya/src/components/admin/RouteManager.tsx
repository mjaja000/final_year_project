import { useState } from "react";
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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      route_name: form.route_name.trim(),
      start_location: form.start_location.trim(),
      end_location: form.end_location.trim(),
      base_fare: Number(form.price) || 0,
      distance_km: Number(form.distance_km) || 0,
    };
    if (!payload.route_name || !payload.start_location || !payload.end_location) {
      toast({ title: "Fill all fields", description: "Route name, start and end locations are required", variant: "destructive" });
      return;
    }
    createRoute.mutate(payload);
  };

  return (
    <div className="border border-border rounded-xl p-4 sm:p-5 bg-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">Manage routes & fares</p>
          <h3 className="text-lg font-semibold">Routes Management</h3>
        </div>
        <Button variant="outline" size="sm" onClick={() => routesQuery.refetch()} disabled={routesQuery.isFetching}>
          {routesQuery.isFetching ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="space-y-6">
        <form onSubmit={handleCreate} className="space-y-4">
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
