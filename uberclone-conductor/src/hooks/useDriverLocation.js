// AI-assisted: see docs/AI_LOG.md #13
import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Custom Hook: useDriverLocation
 *
 * Maneja de forma aislada:
 * 1. Permisos de geolocalización en primer plano.
 * 2. Obtención de posición inicial (para evitar pantallas en blanco).
 * 3. Seguimiento continuo de GPS de alta precisión CONDICIONADO a la disponibilidad (isAvailable).
 * 4. Actualización en tiempo real de la ubicación del conductor en Firestore.
 * 5. Función de limpieza (cleanup) estricta en el retorno de useEffect para evitar memory leaks y consumo de batería.
 *
 * @param {Object} options
 * @param {boolean} options.isAvailable - Estado de disponibilidad del conductor
 * @param {string|null} options.driverId - ID del conductor en Firestore (cédula)
 * @returns {{
 *   location: { latitude: number, longitude: number, accuracy?: number } | null,
 *   heading: number,
 *   errorMsg: string | null,
 *   isTracking: boolean,
 *   permissionGranted: boolean
 * }}
 */
export function useDriverLocation({ isAvailable = false, driverId = null } = {}) {
  const [location, setLocation] = useState(null);
  const [heading, setHeading] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Referencia para evitar actualizar estado si el componente ya se desmontó
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    let subscription = null;

    async function initLocation() {
      try {
        // 1. Verificar y solicitar permisos de ubicación en primer plano
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          if (isMountedRef.current) {
            setErrorMsg('Permiso de ubicación denegado. Es obligatorio para recibir y navegar viajes.');
            setPermissionGranted(false);
            setIsTracking(false);
          }
          return;
        }

        if (isMountedRef.current) {
          setPermissionGranted(true);
          setErrorMsg(null);
        }

        // 2. Obtener la última posición conocida como respaldo rápido
        const lastKnown = await Location.getLastKnownPositionAsync({});
        if (lastKnown && isMountedRef.current && !location) {
          setLocation({
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
            accuracy: lastKnown.coords.accuracy,
          });
          if (typeof lastKnown.coords.heading === 'number' && lastKnown.coords.heading >= 0) {
            setHeading(lastKnown.coords.heading);
          }
        }

        // 3. Si no está disponible, NO iniciar la suscripción activa (ahorro de batería)
        if (!isAvailable) {
          if (isMountedRef.current) {
            setIsTracking(false);
          }
          return;
        }

        // 4. Iniciar seguimiento continuo de alta precisión
        if (isMountedRef.current) {
          setIsTracking(true);
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10, // Notificar cada 10 metros
            timeInterval: 3000,   // O cada 3 segundos
          },
          async (newLocation) => {
            if (!isMountedRef.current) return;

            const coords = {
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              accuracy: newLocation.coords.accuracy,
            };

            setLocation(coords);

            if (typeof newLocation.coords.heading === 'number' && newLocation.coords.heading >= 0) {
              setHeading(newLocation.coords.heading);
            }

            // 5. Enviar coordenadas a Firestore en tiempo real si hay conductor activo
            if (driverId) {
              try {
                const driverRef = doc(db, 'drivers', String(driverId).trim());
                await updateDoc(driverRef, {
                  currentLocation: {
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    heading: newLocation.coords.heading || 0,
                    speed: newLocation.coords.speed || 0,
                    updatedAt: serverTimestamp(),
                  },
                  isAvailable: true,
                });
              } catch (dbError) {
                // Si falla la red temporalmente, el hook sigue rastreando localmente
                console.warn('Error sincronizando ubicación con Firestore:', dbError.message);
              }
            }
          }
        );
      } catch (error) {
        if (isMountedRef.current) {
          setErrorMsg(error.message || 'Error al acceder a la geolocalización');
          setIsTracking(false);
        }
      }
    }

    initLocation();

    // 6. FUNCIÓN DE LIMPIEZA (CLEANUP OBLIGATORIO)
    // Se ejecuta al desmontar el componente o cuando cambia isAvailable / driverId
    return () => {
      isMountedRef.current = false;
      if (subscription) {
        subscription.remove();
        subscription = null;
      }
    };
  }, [isAvailable, driverId]);

  return {
    location,
    heading,
    errorMsg,
    isTracking,
    permissionGranted,
  };
}

