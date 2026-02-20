import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean; // If true, continuously watch position
}

export const useGeolocation = (options: GeolocationOptions = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    watch = false
  } = options;

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true
  });

  const [watchId, setWatchId] = useState<number | null>(null);

  const onSuccess = useCallback((position: GeolocationPosition) => {
    setState({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      error: null,
      loading: false
    });
  }, []);

  const onError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Unable to retrieve location';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location permission denied. Please enable location access.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out.';
        break;
    }

    setState({
      latitude: null,
      longitude: null,
      accuracy: null,
      error: errorMessage,
      loading: false
    });
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        latitude: null,
        longitude: null,
        accuracy: null,
        error: 'Geolocation is not supported by your browser',
        loading: false
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    const geoOptions: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge
    };

    if (watch) {
      // Watch position continuously
      const id = navigator.geolocation.watchPosition(
        onSuccess,
        onError,
        geoOptions
      );
      setWatchId(id);
    } else {
      // Get position once
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        onError,
        geoOptions
      );
    }
  }, [enableHighAccuracy, timeout, maximumAge, watch, onSuccess, onError]);

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  useEffect(() => {
    requestLocation();

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [requestLocation, watchId]);

  return {
    ...state,
    requestLocation,
    stopWatching,
    isSupported: 'geolocation' in navigator
  };
};

// Helper function to calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  
  return distance;
};

// Find nearest vehicle to user location
export const findNearestVehicle = <T extends { latitude: number; longitude: number }>(
  userLat: number,
  userLon: number,
  vehicles: T[]
): { vehicle: T; distance: number } | null => {
  if (vehicles.length === 0) return null;

  let nearest = vehicles[0];
  let minDistance = calculateDistance(userLat, userLon, nearest.latitude, nearest.longitude);

  for (let i = 1; i < vehicles.length; i++) {
    const distance = calculateDistance(userLat, userLon, vehicles[i].latitude, vehicles[i].longitude);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = vehicles[i];
    }
  }

  return { vehicle: nearest, distance: minDistance };
};
