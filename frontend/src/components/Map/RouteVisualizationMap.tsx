import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const greenIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [30, 48],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [30, 48],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Route {
  id: number;
  route_name: string;
  start_location: string;
  end_location: string;
  start_latitude: number;
  start_longitude: number;
  end_latitude: number;
  end_longitude: number;
  vehicle_count?: number;
  base_fare?: number;
}

interface MapBoundsProps {
  bounds: L.LatLngBounds | null;
}

function MapBounds({ bounds }: MapBoundsProps) {
  const map = useMap();

  if (bounds) {
    map.fitBounds(bounds, { padding: [50, 50] });
  }

  return null;
}

const RouteVisualizationMap = () => {
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [routePaths, setRoutePaths] = useState<Record<number, L.LatLngExpression[]>>({});
  const routePathRequested = useRef<Set<number>>(new Set());
  const [isRoutePathLoading, setIsRoutePathLoading] = useState(false);

  const { data: routesData = [], isLoading: routesLoading } = useQuery({
    queryKey: ["routes"],
    queryFn: async () => {
      const baseURL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${baseURL}/api/routes`);
      if (!response.ok) throw new Error('Failed to fetch routes');
      const data = await response.json();
      // Handle both direct array and {routes: []} format
      const routesArray = Array.isArray(data) ? data : (data.routes || []);
      console.log('[RouteVisualizationMap] Fetched routes:', routesArray.length, 'routes');
      if (routesArray.length > 0) {
        console.log('[RouteVisualizationMap] First route:', routesArray[0]);
      }
      return routesArray;
    },
    refetchInterval: 5000,
  });

  // Ensure routes is always an array
  const routes = useMemo(() => {
    if (Array.isArray(routesData)) return routesData;
    if (routesData && typeof routesData === 'object' && 'routes' in routesData) {
      return Array.isArray(routesData.routes) ? routesData.routes : [];
    }
    return [];
  }, [routesData]);

  const selectedRoute = useMemo(
    () => routes && Array.isArray(routes) ? routes.find((r: Route) => r.id === selectedRouteId) : null,
    [routes, selectedRouteId]
  );

  const validRoutes = useMemo(
    () =>
      Array.isArray(routes) ? routes.filter(
        (r: Route) =>
          r.id &&
          r.start_latitude &&
          r.start_longitude &&
          r.end_latitude &&
          r.end_longitude
      ) : [],
    [routes]
  );

  useEffect(() => {
    let isActive = true;

    if (!selectedRoute) {
      setIsRoutePathLoading(false);
      return () => {
        isActive = false;
      };
    }

    const fetchRoutePath = async (route: Route) => {
      if (routePathRequested.current.has(route.id)) return;
      routePathRequested.current.add(route.id);
      setIsRoutePathLoading(true);

      const start = `${route.start_longitude},${route.start_latitude}`;
      const end = `${route.end_longitude},${route.end_latitude}`;
      const url = `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`;

      try {
        const response = await fetch(url);
        if (!response.ok) return;
        const data = await response.json();
        const coords = data?.routes?.[0]?.geometry?.coordinates;
        if (!Array.isArray(coords)) return;

        const path = coords.map((point: [number, number]) => [point[1], point[0]] as [number, number]);
        if (isActive) {
          setRoutePaths((prev) => ({ ...prev, [route.id]: path }));
        }
      } catch (error) {
        console.error("[RouteVisualizationMap] Failed to fetch route path", error);
      } finally {
        if (isActive) {
          setIsRoutePathLoading(false);
        }
      }
    };

    fetchRoutePath(selectedRoute);

    return () => {
      isActive = false;
    };
  }, [selectedRoute]);

  const mapBounds = useMemo(() => {
    if (validRoutes.length === 0) return null;

    const bounds = L.latLngBounds([]);
    validRoutes.forEach((route: Route) => {
      bounds.extend([route.start_latitude, route.start_longitude]);
      bounds.extend([route.end_latitude, route.end_longitude]);
    });

    return bounds;
  }, [validRoutes]);

  const selectedRouteBounds = useMemo(() => {
    if (!selectedRoute) return null;

    const bounds = L.latLngBounds([]);
    bounds.extend([selectedRoute.start_latitude, selectedRoute.start_longitude]);
    bounds.extend([selectedRoute.end_latitude, selectedRoute.end_longitude]);

    return bounds;
  }, [selectedRoute]);

  const visibleRoutes = useMemo(
    () => (selectedRoute ? [selectedRoute] : validRoutes),
    [selectedRoute, validRoutes]
  );

  const defaultCenter: [number, number] = [-1.2864, 36.8172];

  if (routesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (validRoutes.length === 0) {
    return (
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <p className="text-amber-900">No routes with valid coordinates yet.</p>
          <p className="text-sm text-amber-800 mt-2">
            Go to Admin Dashboard to create routes with location selection.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Layout */}
      <div className="hidden md:grid md:grid-cols-4 md:gap-4 md:h-96">
        {/* Route Sidebar */}
        <div className="md:col-span-1 bg-white border border-border rounded-lg overflow-hidden flex flex-col">
          <div className="bg-blue-50 border-b border-border p-3">
            <h3 className="font-semibold text-sm text-blue-900">Available Routes</h3>
            <p className="text-xs text-blue-700 mt-1">
              {validRoutes.length} route{validRoutes.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="overflow-y-auto flex-1">
            {validRoutes.map((route: Route) => (
              route.id ? (
                <button
                  key={route.id}
                  onClick={() => setSelectedRouteId(route.id)}
                  className={`w-full text-left px-3 py-3 border-b border-border transition-colors ${
                    selectedRouteId === route.id
                      ? "bg-blue-100 border-l-4 border-l-blue-600"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <p className="font-medium text-sm text-gray-900">
                    {route.route_name}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    📍 {route.start_location}
                  </p>
                  <p className="text-xs text-gray-600">
                    📍 {route.end_location}
                  </p>
                  {route.vehicle_count !== undefined && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {route.vehicle_count} vehicle{route.vehicle_count !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </button>
              ) : null
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="md:col-span-3 border border-border rounded-lg overflow-hidden">
          {isRoutePathLoading && selectedRoute && (
            <div className="bg-blue-50 text-blue-900 text-xs px-3 py-2 border-b border-border">
              Loading road path for {selectedRoute.route_name}...
            </div>
          )}
          <MapContainer
            center={defaultCenter}
            zoom={13}
            scrollWheelZoom={true}
            style={{ width: "100%", height: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {visibleRoutes.map((route: Route) => (
              <div key={route.id}>
                <Marker
                  position={[route.start_latitude, route.start_longitude]}
                  icon={greenIcon}
                  riseOnHover={true}
                  zIndexOffset={1000}
                >
                  <Popup>
                    <div>
                      <p className="font-semibold text-sm">{route.route_name}</p>
                      <p className="text-xs text-gray-600">
                        📍 {route.start_location}
                      </p>
                    </div>
                  </Popup>
                </Marker>

                <Marker
                  position={[route.end_latitude, route.end_longitude]}
                  icon={redIcon}
                  riseOnHover={true}
                  zIndexOffset={1000}
                >
                  <Popup>
                    <div>
                      <p className="font-semibold text-sm">{route.route_name}</p>
                      <p className="text-xs text-gray-600">
                        📍 {route.end_location}
                      </p>
                    </div>
                  </Popup>
                </Marker>

                <Polyline
                  positions={
                    routePaths[route.id] || [
                      [route.start_latitude, route.start_longitude],
                      [route.end_latitude, route.end_longitude],
                    ]
                  }
                  color={selectedRouteId === route.id ? "#1d4ed8" : "#3b82f6"}
                  weight={selectedRouteId === route.id ? 5 : 3}
                  opacity={selectedRouteId === route.id ? 1 : 0.85}
                  dashArray="0"
                  lineCap="round"
                  lineJoin="round"
                />
              </div>
            ))}

            {selectedRouteBounds ? <MapBounds bounds={selectedRouteBounds} /> : (mapBounds && <MapBounds bounds={mapBounds} />)}
          </MapContainer>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-3">
        <Select
          value={selectedRouteId?.toString() || ""}
          onValueChange={(id) => setSelectedRouteId(Number(id))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a route" />
          </SelectTrigger>
          <SelectContent>
            {validRoutes.map((route: Route) => (
              route.id ? (
                <SelectItem key={route.id} value={route.id.toString()}>
                  <div className="flex items-center justify-between gap-2">
                    <span>{route.route_name}</span>
                    {route.vehicle_count !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        {route.vehicle_count} car{route.vehicle_count !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ) : null
            ))}
          </SelectContent>
        </Select>

        <div className="border border-border rounded-lg overflow-hidden h-64">
          {isRoutePathLoading && selectedRoute && (
            <div className="bg-blue-50 text-blue-900 text-xs px-3 py-2 border-b border-border">
              Loading road path for {selectedRoute.route_name}...
            </div>
          )}
          <MapContainer
            center={defaultCenter}
            zoom={13}
            scrollWheelZoom={true}
            style={{ width: "100%", height: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {visibleRoutes.map((route: Route) => (
              <div key={route.id}>
                <Marker
                  position={[route.start_latitude, route.start_longitude]}
                  icon={greenIcon}
                  riseOnHover={true}
                  zIndexOffset={1000}
                >
                  <Popup>{route.start_location}</Popup>
                </Marker>

                <Marker
                  position={[route.end_latitude, route.end_longitude]}
                  icon={redIcon}
                  riseOnHover={true}
                  zIndexOffset={1000}
                >
                  <Popup>{route.end_location}</Popup>
                </Marker>

                <Polyline
                  positions={
                    routePaths[route.id] || [
                      [route.start_latitude, route.start_longitude],
                      [route.end_latitude, route.end_longitude],
                    ]
                  }
                  color={selectedRouteId === route.id ? "#1d4ed8" : "#3b82f6"}
                  weight={selectedRouteId === route.id ? 5 : 3}
                  opacity={selectedRouteId === route.id ? 1 : 0.85}
                  dashArray="0"
                  lineCap="round"
                  lineJoin="round"
                />
              </div>
            ))}

            {selectedRouteBounds ? <MapBounds bounds={selectedRouteBounds} /> : (mapBounds && <MapBounds bounds={mapBounds} />)}
          </MapContainer>
        </div>
      </div>

      {/* Route Details Card */}
      {selectedRoute && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-blue-900">
              {selectedRoute.route_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs font-semibold text-blue-800">Route Summary</p>
              <p className="text-sm text-blue-700 mt-1">
                📍 {selectedRoute.start_location} → 📍 {selectedRoute.end_location}
              </p>
            </div>
            {selectedRoute.base_fare && (
              <div>
                <p className="text-xs font-semibold text-blue-800">Base Fare</p>
                <p className="text-sm text-blue-700">KES {selectedRoute.base_fare}</p>
              </div>
            )}
            {selectedRoute.vehicle_count !== undefined && (
              <div>
                <p className="text-xs font-semibold text-blue-800">Vehicles Active</p>
                <Badge className="mt-1">{selectedRoute.vehicle_count}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RouteVisualizationMap;