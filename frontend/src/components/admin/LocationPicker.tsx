import { useState, useRef, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationPickerProps {
  label: string;
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (name: string, lat: number, lng: number) => void;
}

interface SearchResult {
  name: string;
  lat: number;
  lon: number;
  display_name: string;
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapUpdater({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (latitude && longitude) {
      map.setView([latitude, longitude], 15);
    }
  }, [latitude, longitude, map]);

  return null;
}

const LocationPicker = ({
  label,
  locationName,
  latitude,
  longitude,
  onLocationChange,
}: LocationPickerProps) => {
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const defaultLat = latitude || -1.2864;
  const defaultLng = longitude || 36.8172;

  const searchLocations = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&limit=10`
      );

      if (!response.ok) throw new Error("Search failed");

      const results = await response.json();
      const formatted: SearchResult[] = results.map((result: any) => ({
        name:
          result.name ||
          result.display_name.split(",")[0] ||
          "Unknown Location",
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        display_name: result.display_name,
      }));

      setSearchResults(formatted);
      setShowResults(true);
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Could not search locations. Try again.",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchInput(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(value);
    }, 500);
  };

  const selectResult = (result: SearchResult) => {
    onLocationChange(result.name, result.lat, result.lon);
    setSearchInput(result.name);
    setShowResults(false);
    setSearchResults([]);
    toast({
      title: "Location selected",
      description: `${result.name}`,
    });
  };

  const handleMapClick = (lat: number, lng: number) => {
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    )
      .then((res) => res.json())
      .then((data) => {
        const name =
          data.name ||
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          "Selected Location";
        onLocationChange(name, lat, lng);
        setSearchInput(name);
        setShowResults(false);
        toast({
          title: "Location pinned",
          description: name,
        });
      })
      .catch(() => {
        onLocationChange("Custom Location", lat, lng);
        setSearchInput("Custom Location");
        toast({
          title: "Location pinned",
          description: `Coordinates saved`,
        });
      });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Search for a place or click on the map
        </p>
      </div>

      <div className="relative">
        <Input
          placeholder="e.g., CBD Nairobi, Westlands, Thika..."
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full"
        />
        {isSearching && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}

        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-border rounded-md shadow-lg z-50 mt-1 max-h-48 overflow-y-auto">
            {searchResults.map((result, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectResult(result)}
                className="w-full text-left px-3 py-2 hover:bg-accent border-b border-border last:border-b-0 transition-colors"
              >
                <p className="text-sm font-medium">{result.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {result.display_name}
                </p>
              </button>
            ))}
          </div>
        )}

        {showResults && searchInput.trim() && searchResults.length === 0 && !isSearching && (
          <div className="absolute top-full left-0 right-0 bg-white border border-border rounded-md shadow-lg z-50 mt-1 p-3">
            <p className="text-sm text-muted-foreground">No locations found</p>
          </div>
        )}
      </div>

      <div className="border border-border rounded-lg overflow-hidden h-64 sm:h-80">
        <MapContainer
          center={[defaultLat, defaultLng]}
          zoom={13}
          scrollWheelZoom={true}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {latitude && longitude && (
            <Marker position={[latitude, longitude]}>
              <Popup>{locationName}</Popup>
            </Marker>
          )}

          <MapClickHandler onMapClick={handleMapClick} />
          <MapUpdater latitude={latitude} longitude={longitude} />
        </MapContainer>
      </div>

      {latitude && longitude && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-blue-900 mb-1">📍 Coordinates</p>
          <p className="text-xs text-blue-800 font-mono">
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
