import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

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

  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [currentOccupancy, setCurrentOccupancy] = useState<string>("");

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

  // Load occupancy for the selected vehicle
  const occupancyQuery = useQuery({
    queryKey: ["occupancy", selectedVehicleId],
    queryFn: () => api.occupancy.getByVehicle(Number(selectedVehicleId)),
    enabled: selectedVehicleId !== null,
  });

  useEffect(() => {
    if (vehicles.length > 0 && selectedVehicleId === null) {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [vehicles, selectedVehicleId]);

  useEffect(() => {
    if (occupancyQuery.data && typeof occupancyQuery.data.current_occupancy !== "undefined") {
      setCurrentOccupancy(String(occupancyQuery.data.current_occupancy));
    }
  }, [occupancyQuery.data]);

  const updateOccupancy = useMutation({
    mutationFn: ({ vehicleId, value }: { vehicleId: number; value: number }) =>
      api.occupancy.update(vehicleId, { current_occupancy: value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["occupancy", selectedVehicleId] });
      toast({ title: "Occupancy updated" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    },
  });

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) ?? null;

  const handleSave = () => {
    if (selectedVehicleId === null) return;
    const value = Number(currentOccupancy);
    if (Number.isNaN(value)) {
      toast({ title: "Invalid number", description: "Please enter a numeric occupancy", variant: "destructive" });
      return;
    }
    updateOccupancy.mutate({ vehicleId: selectedVehicleId, value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Set live occupancy for vehicles</p>
          <h3 className="text-lg font-semibold">Occupancy Control</h3>
        </div>
        <Button variant="outline" size="sm" onClick={() => vehiclesQuery.refetch()} disabled={vehiclesQuery.isFetching}>
          {vehiclesQuery.isFetching ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.1fr,1fr]">
        <div className="border border-border rounded-lg p-4 bg-card space-y-4">
          <div className="space-y-2">
            <Label>Vehicle</Label>
            <select
              className="w-full rounded-md border px-3 py-2 bg-background"
              value={selectedVehicleId ?? ""}
              onChange={(e) => setSelectedVehicleId(Number(e.target.value))}
            >
              {vehicles.map((v) => {
                const label = v.vehicle_number || v.vehicleNumber || `Vehicle ${v.id}`;
                return (
                  <option key={v.id} value={v.id}>
                    {label} {v.capacity ? `• Capacity ${v.capacity}` : ""}
                  </option>
                );
              })}
            </select>
            {vehicles.length === 0 && (
              <p className="text-sm text-muted-foreground">No vehicles found. Add vehicles first.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Current Occupancy</Label>
            <Input
              type="number"
              value={currentOccupancy}
              onChange={(e) => setCurrentOccupancy(e.target.value)}
              placeholder={occupancyQuery.isLoading ? "Loading..." : "Passengers on board"}
            />
            {occupancyQuery.isLoading && <p className="text-xs text-muted-foreground">Fetching current occupancy...</p>}
            {occupancyQuery.isError && (
              <p className="text-xs text-destructive">Failed to load occupancy. Select a vehicle and retry.</p>
            )}
            {occupancyQuery.data && (
              <p className="text-xs text-muted-foreground">
                Backend value: {occupancyQuery.data.current_occupancy ?? "N/A"}
              </p>
            )}
          </div>

          <Button onClick={handleSave} className="w-full" variant="hero" disabled={updateOccupancy.isPending || vehicles.length === 0}>
            {updateOccupancy.isPending ? "Saving..." : "Update Occupancy"}
          </Button>
        </div>

        <div className="border border-border rounded-lg p-4 bg-card space-y-3">
          <h4 className="font-semibold">Vehicle Details</h4>
          <Separator />
          {selectedVehicle ? (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><span className="font-semibold text-foreground">Vehicle:</span> {selectedVehicle.vehicle_number || selectedVehicle.vehicleNumber || selectedVehicle.id}</p>
              {typeof selectedVehicle.capacity !== "undefined" && (
                <p><span className="font-semibold text-foreground">Capacity:</span> {selectedVehicle.capacity}</p>
              )}
              {typeof selectedVehicle.route_id !== "undefined" && (
                <p><span className="font-semibold text-foreground">Route ID:</span> {selectedVehicle.route_id}</p>
              )}
              {typeof selectedVehicle.routeId !== "undefined" && (
                <p><span className="font-semibold text-foreground">Route ID:</span> {selectedVehicle.routeId}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select a vehicle to view details.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OccupancyManager;
