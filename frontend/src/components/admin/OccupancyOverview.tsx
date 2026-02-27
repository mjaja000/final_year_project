import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Car, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
  Navigation
} from "lucide-react";
import io from 'socket.io-client';

interface OccupancyOverviewProps {
  station?: string;
}

const OccupancyOverview = ({ station = '' }: OccupancyOverviewProps) => {
  const [socket, setSocket] = useState<any>(null);

  // Fetch occupancy overview data
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'occupancy', 'overview', station],
    queryFn: async () => {
      const url = station 
        ? `/api/admin/occupancy/overview?station=${encodeURIComponent(station)}`
        : '/api/admin/occupancy/overview';
      
      const res = await fetch((import.meta.env.VITE_API_URL || '') + url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!res.ok) throw new Error('Failed to fetch occupancy overview');
      return res.json();
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Setup socket for real-time updates
  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || '';
    const newSocket = API_BASE ? io(API_BASE) : io();
    setSocket(newSocket);

    newSocket.on('occupancy:updated', () => {
      refetch();
    });

    return () => {
      newSocket.disconnect();
    };
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading occupancy data...</p>
        </div>
      </div>
    );
  }

  const { routes, vehiclesByRoute, routeStats, overallStats } = data || {};

  // Find top performing routes
  const topRoutes = routeStats?.slice(0, 3) || [];
  const totalRevenue = overallStats?.total_revenue || 0;
  const totalTrips = overallStats?.total_trips || 0;
  const avgTripCost = overallStats?.avg_trip_cost || 0;

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Today's Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              KSh {totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {totalTrips} trips • Avg KSh {avgTripCost.toFixed(0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Navigation className="h-4 w-4 text-blue-600" />
              Active Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {overallStats?.active_routes || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {routes?.length || 0} total routes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Car className="h-4 w-4 text-purple-600" />
              Vehicles in Use
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              {overallStats?.vehicles_used || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-600" />
              Total Passengers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">
              {totalTrips}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Today's count
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Routes */}
      {topRoutes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Top Performing Routes Today
            </CardTitle>
            <CardDescription>Highest revenue generating routes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topRoutes.map((route: any, index: number) => (
                <div key={route.route_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-slate-100 text-slate-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{route.route_name}</p>
                      <p className="text-xs text-slate-600">
                        {route.total_trips} trips • {route.active_vehicles} vehicles
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-700">KSh {parseFloat(route.total_revenue || 0).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Routes and Vehicles */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Car className="h-5 w-5 text-blue-600" />
          Vehicles by Route
        </h3>

        {routes && routes.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No routes found for this station</p>
            </CardContent>
          </Card>
        )}

        {routes?.map((route: any) => {
          const routeVehicles = vehiclesByRoute?.[route.id]?.vehicles || [];
          const currentlyFilling = routeVehicles.find((v: any) => v.is_filling);
          const nextInLine = routeVehicles.filter((v: any) => v.is_next_in_line);
          const others = routeVehicles.filter((v: any) => !v.is_filling && !v.is_next_in_line);
          const routeStat = routeStats?.find((s: any) => s.route_id === route.id);

          return (
            <Card key={route.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{route.route_name}</CardTitle>
                    <CardDescription>
                      {route.start_location} → {route.end_location} • KSh {route.fare}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-700">
                      KSh {parseFloat(routeStat?.total_revenue || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-600">
                      {routeStat?.total_trips || 0} trips today
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {routeVehicles.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Car className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No vehicles assigned to this route</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Currently Filling */}
                    {currentlyFilling && (
                      <div>
                        <p className="text-xs font-semibold text-green-600 mb-2 flex items-center gap-1">
                          <Activity className="h-3 w-3" /> CURRENTLY FILLING
                        </p>
                        <VehicleCard vehicle={currentlyFilling} highlight="filling" />
                      </div>
                    )}

                    {/* Next in Line */}
                    {nextInLine.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-blue-600 mb-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> NEXT IN LINE ({nextInLine.length})
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {nextInLine.map((vehicle: any) => (
                            <VehicleCard key={vehicle.id} vehicle={vehicle} highlight="next" />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Other Vehicles */}
                    {others.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                          <Car className="h-3 w-3" /> OTHER VEHICLES ({others.length})
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {others.map((vehicle: any) => (
                            <VehicleCard key={vehicle.id} vehicle={vehicle} highlight="none" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// Vehicle Card Component
const VehicleCard = ({ vehicle, highlight }: { vehicle: any; highlight: 'filling' | 'next' | 'none' }) => {
  const occupancyPercentage = (vehicle.current_occupancy / vehicle.capacity) * 100;
  
  const borderColor = 
    highlight === 'filling' ? 'border-green-500' :
    highlight === 'next' ? 'border-blue-500' :
    'border-slate-200';

  const bgColor =
    highlight === 'filling' ? 'bg-green-50' :
    highlight === 'next' ? 'bg-blue-50' :
    'bg-white';

  return (
    <div className={`border-2 ${borderColor} ${bgColor} rounded-lg p-3 transition-all`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-bold text-sm text-slate-900">{vehicle.registration_number}</p>
          <p className="text-xs text-slate-600">
            {vehicle.make} {vehicle.model}
          </p>
        </div>
        <Badge variant={vehicle.is_full ? "destructive" : vehicle.is_filling ? "default" : "secondary"}>
          {vehicle.occupancy_status}
        </Badge>
      </div>

      {/* Occupancy Bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-600">Occupancy</span>
          <span className="font-semibold">
            {vehicle.current_occupancy}/{vehicle.capacity}
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full transition-all ${
              occupancyPercentage >= 100 ? 'bg-red-600' :
              occupancyPercentage >= 70 ? 'bg-yellow-500' :
              'bg-green-500'
            }`}
            style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Driver Info */}
      {vehicle.has_driver ? (
        <div className="flex items-center gap-1 text-xs text-green-700">
          <CheckCircle className="h-3 w-3" />
          <span>{vehicle.driver_name}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-xs text-amber-600">
          <AlertCircle className="h-3 w-3" />
          <span>No driver assigned</span>
        </div>
      )}
    </div>
  );
};

export default OccupancyOverview;
