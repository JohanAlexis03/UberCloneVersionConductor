// AI-assisted: see docs/AI_LOG.md #24
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
    canTransitionTo,
    getStatusLabel,
    TRIP_STATUS,
} from '../config/tripStatus';

const TripContext = createContext(null);

/**
 * Estado del viaje activo del conductor.
 *
 * Es la UNICA fuente de verdad sobre si el conductor esta ocupado.
 * El hook useTripRequests recibe `busy` desde aqui en lugar de mantener
 * su propia copia: dos copias del mismo hecho se desincronizan, y esa
 * desincronizacion deja solicitudes escritas en Firestore sin mostrarse.
 */
export function TripProvider({ children }) {
    const [activeTripId, setActiveTripId] = useState(null);
    const [activeTrip, setActiveTrip] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Bloque 1: escuchar el viaje activo en tiempo real.
    // Si otro proceso cambia el estado (el pasajero cancela, el backend
    // confirma el pago), la pantalla se entera sin recargar.
    useEffect(() => {
        if (!activeTripId) {
            setActiveTrip(null);
            return;
        }

        setLoading(true);
        const tripRef = doc(db, 'trips', activeTripId);

        const unsubscribe = onSnapshot(
            tripRef,
            (snapshot) => {
                if (!snapshot.exists()) {
                    setActiveTrip(null);
                    setLoading(false);
                    return;
                }
                setActiveTrip({ id: snapshot.id, ...snapshot.data() });
                setLoading(false);
            },
            (err) => {
                console.warn('Error escuchando el viaje activo:', err.message);
                setError(err.message);
                setLoading(false);
            }
        );

        // CLEANUP: cortar la suscripcion al cambiar de viaje o desmontar
        return () => unsubscribe();
    }, [activeTripId]);

    // Bloque 2: empezar a seguir un viaje (se llama despues de aceptar)
    const startTrip = useCallback((tripId) => {
        setError(null);
        setActiveTripId(tripId);
    }, []);

    // Bloque 3: avanzar de estado, validando la transicion antes de escribir.
    // Sin esta validacion cualquier pantalla podria saltar de 'accepted'
    // a 'paid' y dejar la máquina de estados sin sentido.
    const advanceStatus = useCallback(
        async (nextStatus) => {
            if (!activeTripId || !activeTrip) return false;

            const currentStatus = activeTrip.status;
            if (!canTransitionTo(currentStatus, nextStatus)) {
                setError(
                    `Transición no permitida: ${currentStatus} → ${nextStatus}`
                );
                return false;
            }

            try {
                const payload = { status: nextStatus };
                if (nextStatus === 'completed') {
                    payload.completedAt = serverTimestamp();
                }
                await updateDoc(doc(db, 'trips', activeTripId), payload);
                return true;
            } catch (err) {
                console.warn('Error avanzando el viaje:', err.message);
                setError(err.message);
                return false;
            }
        },
        [activeTripId, activeTrip]
    );

    // Bloque 3b: confirmar el cobro en efectivo.
    // No es un simple cambio de estado: además de `paid`, deja constancia de
    // que el dinero se recibió. La comisión no se resta acá porque el saldo
    // es un valor derivado (utils/payment): marcar el viaje como pagado es
    // justamente lo que hace que esa comisión empiece a contar.
    const confirmCashPayment = useCallback(
        async () => {
            if (!activeTripId || !activeTrip) return false;

            // Un viaje con pasarela no se cobra a mano: la confirmación
            // llega desde el servidor. Sin este guardo, tocar el botón de
            // efectivo cerraría un viaje que nadie pagó.
            const method = String(activeTrip.paymentMethod || 'cash').toLowerCase();
            if (method !== 'cash') {
                setError('El cobro con pasarela se confirma desde el servidor.');
                return false;
            }

            if (!canTransitionTo(activeTrip.status, TRIP_STATUS.PAID)) {
                setError(
                    `Transición no permitida: ${activeTrip.status} → ${TRIP_STATUS.PAID}`
                );
                return false;
            }

            try {
                await updateDoc(doc(db, 'trips', activeTripId), {
                    status: TRIP_STATUS.PAID,
                    paymentStatus: 'paid',
                    paidAt: serverTimestamp(),
                });
                return true;
            } catch (err) {
                console.warn('Error confirmando el cobro:', err.message);
                setError(err.message);
                return false;
            }
        },
        [activeTripId, activeTrip]
    );

    // Bloque 3c: confirmar el pago por pasarela digital (Mercado Pago / Stripe).
    // Según docs/PROMPT_MAESTRO.md (Sección 3.4), cuando el viaje es por pasarela
    // permite confirmar/cerrar el flujo de prueba actualizando paymentStatus,
    // paymentId y status: 'paid', lo que acredita driverEarnings al saldo.
    const confirmGatewayPayment = useCallback(
        async (customPaymentId) => {
            if (!activeTripId || !activeTrip) return false;

            const method = String(activeTrip.paymentMethod || '').toLowerCase();
            if (method === 'cash') {
                setError('Este viaje es en efectivo; usa la confirmación de efectivo.');
                return false;
            }

            if (!canTransitionTo(activeTrip.status, TRIP_STATUS.PAID)) {
                setError(
                    `Transición no permitida: ${activeTrip.status} → ${TRIP_STATUS.PAID}`
                );
                return false;
            }

            const paymentId =
                customPaymentId ||
                `${method}_${Date.now()}`;

            try {
                await updateDoc(doc(db, 'trips', activeTripId), {
                    status: TRIP_STATUS.PAID,
                    paymentStatus: 'paid',
                    paymentId,
                    paidAt: serverTimestamp(),
                });
                return true;
            } catch (err) {
                console.warn('Error confirmando el pago digital:', err.message);
                setError(err.message);
                return false;
            }
        },
        [activeTripId, activeTrip]
    );

    // Bloque 4: soltar el viaje (terminado, cancelado o pago confirmado)
    const clearTrip = useCallback(() => {
        setActiveTripId(null);
        setActiveTrip(null);
        setError(null);
    }, []);

    return (
        <TripContext.Provider
            value={{
                activeTripId,
                activeTrip,
                isOnTrip: Boolean(activeTripId),
                loading,
                error,
                statusLabel: activeTrip ? getStatusLabel(activeTrip.status) : null,
                startTrip,
                advanceStatus,
                confirmCashPayment,
                confirmGatewayPayment,
                clearTrip,
            }}
        >
            {children}
        </TripContext.Provider>
    );
}

export function useTrip() {
    const context = useContext(TripContext);
    if (!context) {
        throw new Error('useTrip debe usarse dentro de un TripProvider');
    }
    return context;
}
