import { useState, useEffect } from 'react';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';

export interface PermissionsState {
  camera: boolean;
  location: boolean;
  loading: boolean;
  error: string | null;
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionsState>({
    camera: false,
    location: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const cameraStatus = await Camera.getCameraPermissionsAsync();
      const locationStatus = await Location.getForegroundPermissionsAsync();

      setPermissions({
        camera: cameraStatus.granted,
        location: locationStatus.granted,
        loading: false,
        error: null,
      });
    } catch {
      setPermissions({
        camera: false,
        location: false,
        loading: false,
        error: 'Failed to check permissions',
      });
    }
  };

  const requestPermissions = async () => {
    setPermissions((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      const locationPermission = await Location.requestForegroundPermissionsAsync();

      setPermissions({
        camera: cameraPermission.granted,
        location: locationPermission.granted,
        loading: false,
        error: null,
      });

      return {
        camera: cameraPermission.granted,
        location: locationPermission.granted,
      };
    } catch {
      setPermissions((prev) => ({
        ...prev,
        loading: false,
        error: 'Failed to request permissions',
      }));
      return { camera: false, location: false };
    }
  };

  return {
    permissions,
    requestPermissions,
    checkPermissions,
  };
}
