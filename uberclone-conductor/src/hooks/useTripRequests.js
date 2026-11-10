// AI-assisted: see docs/AI_LOG.md #14
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const REQUEST_TIMEOUT_SECONDS = 15;

/**
 * Custom Hook: useTripRequests
 *
 * Responsabilidades:
 * 1. Escuchar solicitudes entrantes en tiempo real (status: 'requested') vía onSnapshot.
 * 2. Manejar temporizador regresivo estricto de 15 segundos por solicitud.
 * 3. Si se agota el tiempo (15s), rechazar automáticamente la solicitud ('timeout').
 * 4. Exponer acceptTrip y rejectTrip optimizados con useCallback.
 * 5. Limpieza estricta (clearInterval y unsubscribe) en el retorno de useEffect.
 *
 * @param {Object} options
 * @param {boolean} options.isAvailable - Disponibilidad del conductor
 * @param {string|null} options.driverId - Cédula / ID del conductor en Firestore
 * @param {string} [options.category='economy'] - Categoría del vehículo
 * @returns {{
 *   incomingTrip: Object | null,
 *   timeLeft: number,
 *   acceptTrip: (tripId: string) => Promise<boolean>,
 *   rejectTrip: (tripId: string, reason?: string) => Promise<boolean>,
 *   activeTrip: Object | null,
 *   loading: boolean
 * }}
 */
export function useTripRequests({
  isAvailable = false,
  driverId = null,
  category = 'economy',
} = {}) {
  const [incomingTrip, setIncomingTrip] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [timeLeft, setTimeLeft] = useState(REQUEST_TIMEOUT_SECONDS);
  const [loading, setLoading] = useState(false);

  // Referencias para evitar fugas de memoria al desmontar
  const timerRef = useRef(null);
  const incomingTripRef = useRef(null);
  const isMountedRef = useRef(true);

  // Mantener la referencia actualizada para el timer sin recrear intervalos
  useEffect(() => {
    incomingTripRef.current = incomingTrip;
  }, [incomingTrip]);

  // Limpiar el temporizador activo de forma segura
  const clearTripTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimeLeft(REQUEST_TIMEOUT_SECONDS);
  }, []);

  // Función para rechazar viaje (memorizada con useCallback)
  const rejectTrip = useCallback(
    async (tripId, reason = 'driver_rejected') => {
      clearTripTimer();
      setIncomingTrip(null);

      if (!tripId) return false;

      try {
        const tripRef = doc(db, 'trips', tripId);
        await updateDoc(tripRef, {
          status: 'rejected',
          rejectionReason: reason,
          rejectedAt: serverTimestamp(),
          rejectedByDriverId: driverId || null,
        });
        return true;
      } catch (error) {
        console.warn('Error al rechazar solicitud:', error.message);
        return false;
      }
    },
    [clearTripTimer, driverId]
  );

  // Función para aceptar viaje (memorizada con useCallback)
  const acceptTrip = useCallback(
    async (tripId) => {
      clearTripTimer();

      const tripToAccept = incomingTripRef.current;
      setIncomingTrip(null);

      if (!tripId || !driverId) return false;

      setLoading(true);
      try {
        const tripRef = doc(db, 'trips', tripId);
        await updateDoc(tripRef, {
          status: 'accepted',
          driverId: String(driverId).trim(),
          acceptedAt: serverTimestamp(),
        });

        if (isMountedRef.current && tripToAccept && tripToAccept.id === tripId) {
          setActiveTrip({
            ...tripToAccept,
            status: 'accepted',
            driverId,
          });
        }
        return true;
      } catch (error) {
        console.error('Error al aceptar viaje:', error);
        return false;
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [clearTripTimer, driverId]
  );

  // Efecto para gestionar el temporizador regresivo de 15 segundos
  useEffect(() => {
    if (!incomingTrip) {
      clearTripTimer();
      return;
    }

    // Inicializar el reloj en 15 segundos
    setTimeLeft(REQUEST_TIMEOUT_SECONDS);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Temporizador vencido: rechazo automático por timeout
          if (incomingTripRef.current) {
            rejectTrip(incomingTripRef.current.id, 'timeout');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // CLEANUP OBLIGATORIO: Detiene el reloj si el viaje cambia, se acepta, o se desmonta
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [incomingTrip, clearTripTimer, rejectTrip]);

  // Efecto para escuchar solicitudes en Firestore (onSnapshot)
  useEffect(() => {
    isMountedRef.current = true;

    // Si el conductor NO está disponible o no hay driverId, no escuchar solicitudes
    if (!isAvailable || !driverId) {
      setIncomingTrip(null);
      clearTripTimer();
      return;
    }

    // Consulta: viajes en estado 'requested' asignados al conductor o a su categoría
    const tripsCollection = collection(db, 'trips');
    const tripsQuery = query(
      tripsCollection,
      where('status', '==', 'requested'),
      where('category', '==', category)
    );

    const unsubscribe = onSnapshot(
      tripsQuery,
      (snapshot) => {
        if (!isMountedRef.current) return;

        // Si ya hay un viaje activo en curso, no aceptar nuevas solicitudes
        if (activeTrip) return;

        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Filtrar viaje no rechazado previamente por este conductor
        const candidate = docs.find((t) => t.rejectedByDriverId !== driverId);

        if (candidate) {
          // Solo si es una solicitud nueva la cargamos
          if (!incomingTripRef.current || incomingTripRef.current.id !== candidate.id) {
            setIncomingTrip(candidate);
          }
        } else {
          setIncomingTrip(null);
        }
      },
      (error) => {
        console.warn('Error en listener de viajes en tiempo real:', error.message);
      }
    );

    // CLEANUP OBLIGATORIO: Cancelar la suscripción de Firestore al desconectarse o desmontar
    return () => {
      isMountedRef.current = false;
      unsubscribe();
      clearTripTimer();
    };
  }, [isAvailable, driverId, category, activeTrip, clearTripTimer]);

  return {
    incomingTrip,
    activeTrip,
    timeLeft,
    acceptTrip,
    rejectTrip,
    loading,
  };
}

