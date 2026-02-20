import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue with Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

// Set default icon
const DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom vehicle icon (matatu/bus)
const createVehicleIcon = (isOnline: boolean) => {
  const color = isOnline ? '#22c55e' : '#ef4444';
  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="position: relative;">
        <svg width="40" height="40" viewBox="0 0 40 40" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          <circle cx="20" cy="20" r="18" fill="${color}" opacity="0.3"/>
          <circle cx="20" cy="20" r="12" fill="${color}"/>
          <path d="M15 15 L25 15 L25 25 L15 25 Z" fill="white" opacity="0.9"/>
          <circle cx="17" cy="22" r="1.5" fill="${color}"/>
          <circle cx="23" cy="22" r="1.5" fill="${color}"/>
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

// User location icon
const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `
    <div style="position: relative;">
      <svg width="30" height="30" viewBox="0 0 30 30">
        <circle cx="15" cy="15" r="12" fill="#3b82f6" opacity="0.3"/>
        <circle cx="15" cy="15" r="8" fill="#3b82f6"/>
        <circle cx="15" cy="15" r="4" fill="white"/>
      </svg>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

interface Vehicle {
  id: number;
  driver_name: string;
  registration_number?: string;
  vehicle_type?: string;
  latitude: number;
  longitude: number;
  is_online: boolean;
  last_update?: string;
}

interface VehicleMapProps {
  vehicles: Vehicle[];
  userLocation?: { latitude: number; longitude: number } | null;
  center?: [number, number];
  zoom?: number;
  height?: string;
  onVehicleClick?: (vehicle: Vehicle) => void;
}

// Component to recenter map when vehicles change
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

const VehicleMap = ({ 
  vehicles, 
  userLocation, 
  center = [-1.286389, 36.817223], // Nairobi, Kenya default
  zoom = 12,
  height = '600px',
  onVehicleClick
}: VehicleMapProps) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const [mapZoom, setMapZoom] = useState(zoom);

  // Calculate center based on vehicles or user location
  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.latitude, userLocation.longitude]);
      setMapZoom(14);
    } else if (vehicles.length > 0) {
      // Calculate bounds to show all vehicles
      const bounds = vehicles.map(v => [v.latitude, v.longitude] as [number, number]);
      if (bounds.length === 1) {
        setMapCenter(bounds[0]);
        setMapZoom(14);
      } else {
        // Calculate center of all vehicles
        const avgLat = bounds.reduce((sum, coord) => sum + coord[0], 0) / bounds.length;
        const avgLng = bounds.reduce((sum, coord) => sum + coord[1], 0) / bounds.length;
        setMapCenter([avgLat, avgLng]);
        setMapZoom(12);
      }
    }
  }, [vehicles, userLocation]);

  return (
    <div style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <MapUpdater center={mapCenter} zoom={mapZoom} />
        
        {/* OpenStreetMap Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* User Location Marker */}
        {userLocation && (
          <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
            <Popup>
              <div className="text-sm font-semibold">Your Location</div>
            </Popup>
          </Marker>
        )}

        {/* Vehicle Markers */}
        {vehicles.map((vehicle) => (
          <Marker
            key={vehicle.id}
            position={[vehicle.latitude, vehicle.longitude]}
            icon={createVehicleIcon(vehicle.is_online)}
            eventHandlers={{
              click: () => {
                if (onVehicleClick) {
                  onVehicleClick(vehicle);
                }
              }
            }}
          >
            <Popup>
              <div className="space-y-1 min-w-[200px]">
                <div className="font-bold text-base">{vehicle.driver_name}</div>
                {vehicle.registration_number && (
                  <div className="text-sm text-gray-600">
                    Vehicle: {vehicle.registration_number}
                  </div>
                )}
                {vehicle.vehicle_type && (
                  <div className="text-sm text-gray-600 capitalize">
                    Type: {vehicle.vehicle_type}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-2 h-2 rounded-full ${vehicle.is_online ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-xs font-medium">
                    {vehicle.is_online ? 'Online' : 'Offline'}
                  </span>
                </div>
                {vehicle.last_update && (
                  <div className="text-xs text-gray-500 mt-1">
                    Updated: {new Date(vehicle.last_update).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default VehicleMap;
