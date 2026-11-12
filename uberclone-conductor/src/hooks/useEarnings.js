// AI-assisted: see docs/AI_LOG.md #16
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Custom Hook: useEarnings
 *
 * Responsabilidades:
 * 1. Consultar en Firestore los viajes completados y pagados del conductor.
 * 2. Calcular con useMemo (optimización de rendimiento) las métricas financieras:
 *    - Hoy
 *    - Esta Semana (últimos 7 días)
 *    - Este Mes
 * 3. Calcular el saldo actual del conductor según regla de negocio oficial:
 *    Saldo = Σ(Ganancias por Pasarela) - Σ(Comisiones por Efectivo)
 * 4. Exponer refreshEarnings y el historial ordenado de carreras.
 *
 * @param {string|null} driverId - Cédula / ID del conductor
 * @returns {{
 *   metrics: {
 *     today: MetricBlock,
 *     week: MetricBlock,
 *     month: MetricBlock,
 *     balance: number,
 *   },
 *   trips: Array<Object>,
 *   loading: boolean,
 *   refreshEarnings: () => Promise<void>
 * }}
 */

// Estructura vacía para inicializar acumuladores
function createEmptyMetricBlock() {
  return {
    tripsCount: 0,
    totalFares: 0,
    totalCommissions: 0,
    totalTips: 0,
    netEarnings: 0,
    averageEarnings: 0,
  };
}

export function useEarnings(driverId) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Consultar viajes en Firestore
  // useCallback sirve para memorizar funciones y evitar que se recarguen innecesariamente
  const fetchTrips = useCallback(async () => {
    if (!driverId) { // Si no hay conductor, no hay viajes
      setTrips([]);
      setLoading(false);
      return;
    }

    setLoading(true); // Mientras carga, ponemos el loading en true
    try {
      const tripsRef = collection(db, 'trips');
      const q = query(
        tripsRef,
        where('driverId', '==', String(driverId).trim()),
        where('status', 'in', ['completed', 'paid'])
      );

      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        let completedDate = new Date();

        if (data.completedAt?.toDate) {
          completedDate = data.completedAt.toDate();
        } else if (data.createdAt?.toDate) {
          completedDate = data.createdAt.toDate();
        } else if (data.completedAt) {
          completedDate = new Date(data.completedAt);
        }

        return {
          id: docSnap.id,
          ...data,
          completedDate,
        };
      });

      // Ordenar por fecha descendente (más recientes primero)
      docs.sort((a, b) => b.completedDate - a.completedDate);
      setTrips(docs);
    } catch (error) {
      console.warn('Error al cargar historial de ganancias:', error.message);
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // CÁLCULO MEMORIZADO CON useMemo (REQUISITO ARQUITECTÓNICO)
  // Solo se recalcula si el array de viajes cambia.
  const metrics = useMemo(() => {
    const now = new Date();

    // Límites de tiempo
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const today = createEmptyMetricBlock();
    const week = createEmptyMetricBlock();
    const month = createEmptyMetricBlock();

    let balance = 0;

    for (const trip of trips) {
      const fare = Number(trip.fare) || 0;
      const commission = Number(trip.commission) || 0;
      const tip = Number(trip.tip) || 0;
      const driverEarnings = Number(trip.driverEarnings) || (fare - commission + tip);
      const tripDate = trip.completedDate || new Date();
      const paymentMethod = String(trip.paymentMethod || 'cash').toLowerCase();

      // Regla de Negocio: Cálculo del Saldo Acumulado
      // Pasarela: la plataforma retuvo el dinero, se lo debe al conductor (+driverEarnings).
      // Efectivo: el conductor cobró todo en mano, debe la comisión del 20% a la plataforma (-commission).
      if (paymentMethod === 'cash') {
        balance -= commission;
      } else {
        balance += driverEarnings;
      }

      // Agregación para Hoy
      if (tripDate >= startOfToday) {
        today.tripsCount += 1;
        today.totalFares += fare;
        today.totalCommissions += commission;
        today.totalTips += tip;
        today.netEarnings += driverEarnings;
      }

      // Agregación para la Semana (últimos 7 días)
      if (tripDate >= startOfWeek) {
        week.tripsCount += 1;
        week.totalFares += fare;
        week.totalCommissions += commission;
        week.totalTips += tip;
        week.netEarnings += driverEarnings;
      }

      // Agregación para el Mes en curso
      if (tripDate >= startOfMonth) {
        month.tripsCount += 1;
        month.totalFares += fare;
        month.totalCommissions += commission;
        month.totalTips += tip;
        month.netEarnings += driverEarnings;
      }
    }

    // Calcular promedios por viaje
    if (today.tripsCount > 0) {
      today.averageEarnings = Math.round(today.netEarnings / today.tripsCount);
    }
    if (week.tripsCount > 0) {
      week.averageEarnings = Math.round(week.netEarnings / week.tripsCount);
    }
    if (month.tripsCount > 0) {
      month.averageEarnings = Math.round(month.netEarnings / month.tripsCount);
    }

    return {
      today,
      week,
      month,
      balance,
    };
  }, [trips]);

  return {
    metrics,
    trips,
    loading,
    refreshEarnings: fetchTrips,
  };
}

