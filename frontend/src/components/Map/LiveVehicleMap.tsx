import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import VehicleMap from './VehicleMap';
import { useGeolocation, findNearestVehicle, calculateDistance } from '@/hooks/useGeolocation';
import io from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL || '';
const socket = API_BASE ? io(API_BASE) : io();

interface Vehicle {
  id: number;
  driver_name: string;
  registration_number?: string;
  vehicle_type?: string;
  latitude: number;
  longitude: number;
  is_online: boolean;
  occupancy_status?: string;
  current_occupancy?: number;
  last_update?: string;
}

interface LiveVehicleMapProps {
  height?: string;
  showLocationToggle?: boolean;
  autoRequestLocation?: boolean;
}

const LiveVehicleMap = ({ 
  height = '500px', 
  showLocationToggle = true,
  autoRequestLocation = false 
}: LiveVehicleMapProps) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [userWantsLocation, setUserWantsLocation] = useState(false); // Never auto-request
  const [nearestVehicle, setNearestVehicle] = useState<{ vehicle: Vehicle; distance: number } | null>(null);
  const { toast } = useToast();

  const {
    latitude,
    longitude,
    error: locationError,
    loading: locationLoading,
    requestLocation,
    requestLocationOnce
  } = useGeolocation({
    enableHighAccuracy: true,
    watch: userWantsLocation, // Only watch when user enables it
    timeout: 10000,
    autoRequest: false // Never auto-request location on mount
  });

  const isRequestingLocation = userWantsLocation ? locationLoading : false;

  // Fetch initial vehicles from backend
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/locations/locations`);
        if (response.ok) {
          const data = await response.json();
          setVehicles(data.vehicles || []);
        }
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
      }
    };

    fetchVehicles();

    // Poll every 30 seconds so freshly-loaded pages get current driver positions
    const pollInterval = setInterval(fetchVehicles, 30000);

    // Listen for real-time vehicle location updates
    socket.on('vehicle:locationUpdate', (data: any) => {
      setVehicles((prev) => {
        const index = prev.findIndex((v) => v.id === data.id || v.id === data.vehicleId);
        if (index >= 0) {
          // Update existing vehicle
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            latitude: data.latitude,
            longitude: data.longitude,
            is_online: data.is_online ?? data.isOnline ?? true,
            driver_name: data.driver_name || updated[index].driver_name,
            last_update: new Date().toISOString()
          };
          return updated;
        } else if (data.latitude && data.longitude) {
          // Add new vehicle
          return [
            ...prev,
            {
              id: data.id || data.vehicleId,
              driver_name: data.driver_name || data.driverName || 'Unknown Driver',
              registration_number: data.registration_number || data.registrationNumber,
              vehicle_type: data.vehicle_type || data.vehicleType || 'matatu',
              latitude: data.latitude,
              longitude: data.longitude,
              is_online: data.is_online ?? data.isOnline ?? true,
              last_update: new Date().toISOString()
            }
          ];
        }
        return prev;
      });
    });

    // Listen for driver going offline
    socket.on('driver:statusUpdate', (data: any) => {
      if (data.status === 'offline') {
        setVehicles((prev) => prev.filter((v) => v.id !== data.vehicleId && v.id !== data.userId));
      }
    });

    socket.on('driver.statusUpdated', (data: any) => {
      if (data.status === 'offline') {
        setVehicles((prev) => prev.filter((v) => v.id !== data.vehicleId));
      }
    });

    return () => {
      clearInterval(pollInterval);
      socket.off('vehicle:locationUpdate');
      socket.off('driver:statusUpdate');
      socket.off('driver.statusUpdated');
    };
  }, []);

  // Save customer location to database when location is obtained
  useEffect(() => {
    if (latitude && longitude && userWantsLocation) {
      const saveLocation = async () => {
        try {
          const response = await fetch(`${API_BASE}/api/customers/location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude,
              longitude,
              timestamp: new Date().toISOString()
            })
          });
          if (!response.ok) {
            console.error('Failed to save customer location');
          }
        } catch (error) {
          console.error('Error saving location:', error);
        }
      };
      
      saveLocation();
    }
  }, [latitude, longitude, userWantsLocation]);

  // Calculate nearest non-full vehicle when user location or vehicles change
  useEffect(() => {
    if (latitude && longitude && vehicles.length > 0) {
      // Only consider online vehicles that are NOT full
      const availableVehicles = vehicles.filter(
        v => v.is_online && v.occupancy_status !== 'full'
      );
      const nearest = findNearestVehicle(latitude, longitude, availableVehicles);
      setNearestVehicle(nearest);
    } else {
      setNearestVehicle(null);
    }
  }, [latitude, longitude, vehicles]);

  // Show location error
  useEffect(() => {
    if (locationError) {
      toast({
        title: 'Location Error',
        description: locationError,
        variant: 'destructive'
      });
    }
  }, [locationError, toast]);

  const handleToggleLocation = () => {
    if (!userWantsLocation) {
      setUserWantsLocation(true);
      // Use requestLocationOnce instead to avoid watch dependency issue
      requestLocationOnce();
    } else {
      setUserWantsLocation(false);
    }
  };

  const onlineVehicles = vehicles.filter(v => v.is_online);

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
        <div>
          <h2 className="text-xl font-bold">Live Vehicle Tracking</h2>
          <p className="text-sm text-muted-foreground">
            {onlineVehicles.length} vehicle{onlineVehicles.length !== 1 ? 's' : ''} online now
          </p>
        </div>

        {showLocationToggle && (
          <div className="flex items-center gap-2">
            {userWantsLocation && latitude && longitude ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <MapPin className="h-4 w-4" />
                  <span>Location Active</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleToggleLocation}
                >
                  <X className="h-4 w-4 mr-1" />
                  Disable
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleToggleLocation}
                disabled={isRequestingLocation}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4"
                title="Click to share your location and find nearby vehicles"
              >
                <Navigation className="h-5 w-5 mr-2" />
                {isRequestingLocation ? 'Requesting location...' : 'Find Nearest Vehicle'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Location request help text */}
      {!userWantsLocation && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
          <p className="text-amber-900 mb-2">
            💡 <strong>Find nearby vehicles:</strong>
          </p>
          <p className="text-amber-800">
            Click the <strong>"Find Nearest Vehicle"</strong> button below to share your location. You'll see your position as a blue dot on the map, and the nearest available driver highlighted with a yellow circle.
          </p>
        </div>
      )}

      {/* Nearest vehicle info */}
      {nearestVehicle && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-lg">Nearest Available Vehicle</h3>
              </div>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">Driver:</span> {nearestVehicle.vehicle.driver_name}
                </p>
                {nearestVehicle.vehicle.registration_number && (
                  <p className="text-sm">
                    <span className="font-medium">Vehicle:</span> {nearestVehicle.vehicle.registration_number}
                  </p>
                )}
                <p className="text-sm font-bold text-blue-600">
                  📍 Distance: {nearestVehicle.distance < 1
                    ? `${(nearestVehicle.distance * 1000).toFixed(0)} m`
                    : `${nearestVehicle.distance.toFixed(2)} km`} away
                </p>
                <p className="text-sm">
                  <span className="font-medium">Status:</span>{' '}
                  <span className="text-green-600 font-semibold">
                    {nearestVehicle.vehicle.occupancy_status === 'full' ? '🔴 Full' : '🟢 Available'}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-green-700">Online</span>
            </div>
          </div>
        </div>
      )}

      {/* Driver locations legend */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
        <div className="flex flex-wrap gap-4 items-center justify-start text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 border border-green-700"></div>
            <span className="font-medium">Online Drivers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 border border-red-700"></div>
            <span className="font-medium">Offline Drivers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 border border-blue-700"></div>
            <span className="font-medium">Your Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400 border-2 border-yellow-600"></div>
            <span className="font-medium">Nearest Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 border-t-2 border-dashed border-blue-500"></div>
            <span className="font-medium">Distance Line</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <VehicleMap
        vehicles={onlineVehicles}
        userLocation={
          userWantsLocation && latitude && longitude
            ? { latitude, longitude }
            : null
        }
        nearestVehicleId={nearestVehicle?.vehicle.id ?? null}
        height={height}
        onVehicleClick={(vehicle) => {
          if (latitude && longitude) {
            const distance = calculateDistance(latitude, longitude, vehicle.latitude, vehicle.longitude);
            toast({
              title: vehicle.driver_name,
              description: `${distance < 1 ? `${(distance * 1000).toFixed(0)} m` : `${distance.toFixed(2)} km`} away${vehicle.occupancy_status === 'full' ? ' · Full' : ' · Available'}`,
            });
          }
        }}
      />

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 p-3 bg-gray-50 rounded-lg text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500" />
          <span>Online Vehicle</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500" />
          <span>Your Location</span>
        </div>
      </div>
    </div>
  );
};

export default LiveVehicleMap;
