// AI-assisted: see docs/AI_LOG.md #22
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTrip } from '../../context/TripContext';
import { useDriver } from '../../context/DriverContext';
import { useDriverLocation } from '../../hooks/useDriverLocation';
import {
    TRIP_STATUS,
    TRIP_FLOW,
    NEXT_ACTION_LABELS,
    nextFlowStatus,
    canTransitionTo,
} from '../../config/tripStatus';
import { formatCOP } from '../../config/pricing';
import { getPaymentMethod } from '../../constants/paymentMethods';
import { toLatLng, buildRouteCoordinates, haversineKm } from '../../utils/geo';
import { fetchRoadRoute } from '../../services/routing';

// Alto del mapa. Fijo para que las tarjetas de abajo siempre tengan espacio.
const MAP_HEIGHT = 220;

// Colores de las dos rutas: azul el tramo de recogida, negro la del viaje.
const PICKUP_COLOR = '#2563EB';
const TRIP_COLOR = '#111827';

// Cada cuántos metros se vuelve a pedir la ruta de recogida. Pedirla en cada
// lectura del GPS sería una petición por segundo contra un servidor público.
const PICKUP_RECHECK_METERS = 150;

/**
 * Pantalla del viaje en curso.
 *
 * No escribe en Firestore directamente ni decide qué transiciones son
 * legales: eso vive en TripContext y en tripStatus. Esta pantalla solo
 * muestra el estado y pide el siguiente paso.
 *
 * Cuando el viaje queda en `completed`, el navegador desmonta esta pantalla
 * y monta la de cobro. Acá solo queda el cierre de un viaje cancelado, que
 * no tiene siguiente estado: el botón libera al conductor con clearTrip().
 * Ese clearTrip es justo lo que destraba el flujo: mientras no se llame, el
 * conductor sigue ocupado y no le vuelven a entrar solicitudes.
 */
export default function TripInProgressScreen() {
    // Zonas seguras reales del dispositivo (notch arriba, indicador de inicio abajo)
    const insets = useSafeAreaInsets();

    // Referencia al mapa para poder encuadrar la ruta cuando llega
    const mapRef = useRef(null);

    // Posición del conductor para el tramo de recogida. Es el mismo hook del
    // inicio: al aceptar el viaje, HomeScreen se desmonta y el seguimiento
    // pasa a vivir aquí, sin abrir una segunda suscripción de GPS.
    const { driver, isAvailable } = useDriver();
    const driverId = driver?.personalData?.idNumber || null;
    const { location: driverLocation } = useDriverLocation({ isAvailable, driverId });

    // Bloque 1: estado compartido del viaje activo.
    const {
        activeTrip,
        statusLabel,
        advanceStatus,
        clearTrip,
        error,
    } = useTrip();

    // Bloque 2: estado local de la operación en curso.
    // El error de negocio no se muestra con Alert: va en línea, bajo el botón.
    const [working, setWorking] = useState(false);
    const [localError, setLocalError] = useState(null);

    // Trazado de recogida calculado desde donde está el carro ahora.
    const [livePickupRoute, setLivePickupRoute] = useState([]);

    // Simulador de movimiento del vehículo punto a punto sobre la polilínea
    const [isSimulatingDrive, setIsSimulatingDrive] = useState(true);
    const [simStepIndex, setSimStepIndex] = useState(0);

    // Último punto desde el que se pidió ese trazado, para no repetir la
    // petición con cada lectura del GPS.
    const lastPickupFetchRef = useRef(null);

    // Viaje y estado con los que ya se encuadró el mapa. Evita que el mapa se
    // mueva cada vez que la ruta en vivo se refresca.
    const lastFitKeyRef = useRef(null);

    // Bloque 3: datos derivados del estado actual.
    // La verdad sobre qué se puede hacer la tienen tripStatus y el contexto;
    // acá solo se leen para saber qué ofrecer.
    const status = activeTrip?.status || null;
    const nextStatus = status ? nextFlowStatus(status) : null;
    const canAdvance = Boolean(nextStatus) && canTransitionTo(status, nextStatus);
    const canCancel = status ? canTransitionTo(status, TRIP_STATUS.CANCELLED) : false;

    const isCancelled = status === TRIP_STATUS.CANCELLED;

    const actionLabel = isCancelled
        ? 'Volver a estar disponible'
        : NEXT_ACTION_LABELS[status] || 'Siguiente paso';

    const flowIndex = TRIP_FLOW.indexOf(status);
    const progress = flowIndex >= 0 ? ((flowIndex + 1) / TRIP_FLOW.length) * 100 : 0;

    const paymentLabel = getPaymentMethod(activeTrip?.paymentMethod).label;

    // Puntos del viaje, ya normalizados para el mapa. Se memorizan para que
    // los efectos que los leen no se disparen en cada render.
    const origin = useMemo(() => toLatLng(activeTrip?.origin), [activeTrip?.origin]);
    const destination = useMemo(
        () => toLatLng(activeTrip?.destination),
        [activeTrip?.destination]
    );

    // Ruta del viaje. `routeCoordinates` es el trazado real por calles; si el
    // documento es viejo y no lo trae, unimos origen y destino en línea recta
    // para no dejar el mapa vacío.
    const tripRoute = useMemo(
        () => buildRouteCoordinates(activeTrip?.routeCoordinates, origin, destination),
        [activeTrip?.routeCoordinates, origin, destination]
    );

    // Tramo de recogida: del conductor al punto de recogida. Solo tiene
    // sentido mientras el pasajero no ha subido.
    const needsPickupLeg =
        status === TRIP_STATUS.ACCEPTED || status === TRIP_STATUS.DRIVER_ARRIVING;

    // Bloque 3b: ruta de recogida desde la posición actual del carro.
    //
    // El trazado guardado con el viaje sale del punto donde el conductor
    // aceptó, que a los dos minutos ya no es donde está. Se pide la ruta real
    // otra vez cuando el carro avanza PICKUP_RECHECK_METERS, no en cada
    // lectura del GPS.
    const driverLat = driverLocation?.latitude;
    const driverLng = driverLocation?.longitude;
    const driverPoint = useMemo(
        () =>
            typeof driverLat === 'number' && typeof driverLng === 'number'
                ? { latitude: driverLat, longitude: driverLng }
                : null,
        [driverLat, driverLng]
    );

    useEffect(() => {
        if (!needsPickupLeg || !driverPoint || !origin) return;

        const lastFetched = lastPickupFetchRef.current;
        const movedMeters = lastFetched ? haversineKm(lastFetched, driverPoint) * 1000 : Infinity;
        if (movedMeters < PICKUP_RECHECK_METERS) return;

        lastPickupFetchRef.current = driverPoint;
        let cancelled = false;

        fetchRoadRoute(driverPoint, origin).then((route) => {
            // Si el componente se desmontó o el punto cambió, este resultado
            // ya no sirve: escribirlo dejaría una ruta vieja en el mapa.
            if (cancelled) return;

            // Si el servicio no respondió se conserva el último trazado bueno:
            // borrarlo dejaría la recta como única opción.
            if (route) setLivePickupRoute(route.coordinates);
        });

        return () => {
            cancelled = true;
        };
    }, [needsPickupLeg, driverPoint, origin]);

    // Se prefiere la ruta en vivo; si todavía no llegó, el trazado guardado
    // con el viaje; y si el viaje es viejo y no lo trae, la recta para no
    // dejar el mapa sin la ruta de recogida.
    const pickupRoute = useMemo(() => {
        if (!needsPickupLeg) return [];
        if (livePickupRoute.length >= 2) return livePickupRoute;

        return buildRouteCoordinates(
            activeTrip?.pickupRouteCoordinates,
            driverPoint,
            origin
        );
    }, [
        needsPickupLeg,
        livePickupRoute,
        activeTrip?.pickupRouteCoordinates,
        driverPoint,
        origin,
    ]);

    // Ruta activa sobre la que se mueve el carrito según la etapa del viaje:
    // - En camino al pasajero (accepted / driver_arriving) -> pickupRoute
    // - Con pasajero a bordo (in_progress) -> tripRoute
    const activeLegRoute = useMemo(() => {
        if (needsPickupLeg && pickupRoute.length >= 2) return pickupRoute;
        if (status === TRIP_STATUS.IN_PROGRESS && tripRoute.length >= 2) return tripRoute;
        return [];
    }, [needsPickupLeg, pickupRoute, status, tripRoute]);

    // Reiniciar el paso del carrito cuando cambia la etapa del viaje
    useEffect(() => {
        setSimStepIndex(0);
    }, [status, activeTrip?.id]);

    // Efecto con cleanup estricto que mueve el carrito por las coordenadas de la calle
    useEffect(() => {
        if (!isSimulatingDrive || activeLegRoute.length < 2) return;

        // Salto proporcional para que el recorrido completo tome ~20-25 segundos en demo
        const stepIncrement = Math.max(1, Math.ceil(activeLegRoute.length / 45));

        const intervalId = setInterval(() => {
            setSimStepIndex((prev) => {
                const next = prev + stepIncrement;
                if (next >= activeLegRoute.length - 1) {
                    return activeLegRoute.length - 1;
                }
                return next;
            });
        }, 550);

        // CLEANUP OBLIGATORIO: limpiar el intervalo al pausar, cambiar estado o desmontar
        return () => clearInterval(intervalId);
    }, [isSimulatingDrive, activeLegRoute]);

    // Posición actual del carrito en el mapa y tramo restante por recorrer
    const carPosition = useMemo(() => {
        if (activeLegRoute.length >= 2) {
            const safeIdx = Math.min(simStepIndex, activeLegRoute.length - 1);
            return activeLegRoute[safeIdx];
        }
        return driverPoint || origin;
    }, [activeLegRoute, simStepIndex, driverPoint, origin]);

    const visiblePickupRoute = useMemo(() => {
        if (!needsPickupLeg || pickupRoute.length < 2) return [];
        const safeIdx = Math.min(simStepIndex, pickupRoute.length - 2);
        return pickupRoute.slice(safeIdx);
    }, [needsPickupLeg, pickupRoute, simStepIndex]);

    const visibleTripRoute = useMemo(() => {
        if (tripRoute.length < 2) return [];
        if (status === TRIP_STATUS.IN_PROGRESS) {
            const safeIdx = Math.min(simStepIndex, tripRoute.length - 2);
            return tripRoute.slice(safeIdx);
        }
        return tripRoute;
    }, [tripRoute, status, simStepIndex]);

    // Bloque 4: un solo manejador. Avanza si hay a dónde ir; si el viaje ya
    // cerró, libera al conductor.
    const handleMainAction = useCallback(async () => {
        setLocalError(null);

        if (!canAdvance) {
            clearTrip();
            return;
        }

        setWorking(true);
        const ok = await advanceStatus(nextStatus);
        if (!ok) {
            setLocalError('No se pudo actualizar el viaje. Revisa tu conexión.');
        }
        setWorking(false);
    }, [canAdvance, clearTrip, advanceStatus, nextStatus]);

    const handleCancel = useCallback(async () => {
        setLocalError(null);
        setWorking(true);
        const ok = await advanceStatus(TRIP_STATUS.CANCELLED);
        if (!ok) {
            setLocalError('No se pudo cancelar el viaje. Revisa tu conexión.');
        }
        setWorking(false);
    }, [advanceStatus]);

    // Bloque 4b: encuadrar la ruta en el mapa.
    // Se encuadra una sola vez por viaje y estado. La ruta en vivo se refresca
    // cada 150 metros y el mapa no debe moverse debajo del conductor en cada
    // refresco; cuando el estado cambia, el encuadre sí cambia de significado.
    const fitKey = activeTrip?.id ? `${activeTrip.id}:${status}` : null;

    useEffect(() => {
        if (!mapRef.current || !fitKey) return;
        if (lastFitKeyRef.current === fitKey) return;

        const points = pickupRoute.length >= 2 ? [...pickupRoute, ...tripRoute] : tripRoute;
        if (points.length < 2) return;

        lastFitKeyRef.current = fitKey;
        mapRef.current.fitToCoordinates(points, {
            edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
            animated: true,
        });
    }, [fitKey, pickupRoute, tripRoute]);

    // Bloque 5: mientras el contexto resuelve el documento, no hay nada
    // que mostrar pero tampoco hay que salir de la pantalla.
    if (!activeTrip) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#000000" />
                <Text style={styles.centeredText}>Cargando el viaje…</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Bloque 6: encabezado fijo con el estado y el avance del flujo.
                Va fuera del ScrollView para que no se desplace, y su relleno
                superior sale del área segura: en un iPhone con notch el
                estado del viaje quedaría debajo de la hora y el wifi. */}
            <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
                <Text style={styles.headerLabel}>Viaje en curso</Text>
                <Text style={styles.headerStatus}>{statusLabel}</Text>

                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>
                    Paso {Math.max(flowIndex + 1, 1)} de {TRIP_FLOW.length}
                </Text>
            </View>

            {/* Bloque 6b: mapa con las rutas dibujadas y carrito en movimiento */}
            <View style={styles.mapBlock}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    provider={PROVIDER_DEFAULT}
                    showsUserLocation={false}
                    initialRegion={{
                        latitude: origin?.latitude ?? 6.2442,
                        longitude: origin?.longitude ?? -75.5812,
                        latitudeDelta: 0.03,
                        longitudeDelta: 0.03,
                    }}
                >
                    {/* Tramo de recogida restante: carrito -> punto de recogida */}
                    {visiblePickupRoute.length >= 2 && (
                        <Polyline
                            coordinates={visiblePickupRoute}
                            strokeColor={PICKUP_COLOR}
                            strokeWidth={4}
                        />
                    )}

                    {/* Ruta del viaje restante: recogida/carrito -> destino */}
                    {visibleTripRoute.length >= 2 && (
                        <Polyline
                            coordinates={visibleTripRoute}
                            strokeColor={TRIP_COLOR}
                            strokeWidth={4}
                        />
                    )}

                    {origin && (
                        <Marker coordinate={origin} title="Punto de recogida" pinColor="#16A34A" />
                    )}
                    {destination && (
                        <Marker coordinate={destination} title="Destino" pinColor="#111827" />
                    )}

                    {/* Marcador del carrito del conductor avanzando por las calles */}
                    {carPosition && (
                        <Marker
                            coordinate={carPosition}
                            title="Tu vehículo"
                            anchor={{ x: 0.5, y: 0.5 }}
                        >
                            <View style={styles.carMarkerBubble}>
                                <Ionicons name="car-sport" size={18} color="#FFFFFF" />
                            </View>
                        </Marker>
                    )}
                </MapView>

                {/* Botón flotante para pausar/reanudar o reiniciar el movimiento del carrito */}
                {activeLegRoute.length >= 2 && (
                    <View style={styles.simOverlayRow}>
                        <TouchableOpacity
                            style={styles.simPillBtn}
                            onPress={() => {
                                if (simStepIndex >= activeLegRoute.length - 1) {
                                    setSimStepIndex(0);
                                    setIsSimulatingDrive(true);
                                } else {
                                    setIsSimulatingDrive((prev) => !prev);
                                }
                            }}
                            activeOpacity={0.85}
                        >
                            <Ionicons
                                name={
                                    simStepIndex >= activeLegRoute.length - 1
                                        ? 'refresh'
                                        : isSimulatingDrive
                                        ? 'pause'
                                        : 'play'
                                }
                                size={13}
                                color="#FFFFFF"
                            />
                            <Text style={styles.simPillText}>
                                {simStepIndex >= activeLegRoute.length - 1
                                    ? 'Repetir recorrido'
                                    : isSimulatingDrive
                                    ? 'Carrito en marcha'
                                    : 'Mover carrito'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Bloque 7: pasajero */}
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Ionicons name="person-circle-outline" size={22} color="#6B7280" />
                        <Text style={styles.passengerName} numberOfLines={1}>
                            {activeTrip.passengerName || 'Pasajero'}
                        </Text>
                    </View>
                </View>

                {/* Bloque 8: ruta de recogida y destino */}
                <View style={styles.card}>
                    <View style={styles.routeRow}>
                        <View style={styles.originDot} />
                        <View style={styles.routeTexts}>
                            <Text style={styles.routeLabel}>Recogida</Text>
                            <Text style={styles.routeAddress} numberOfLines={2}>
                                {activeTrip.origin?.address || 'Dirección no disponible'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.routeConnector} />

                    <View style={styles.routeRow}>
                        <View style={styles.destinationDot} />
                        <View style={styles.routeTexts}>
                            <Text style={styles.routeLabel}>Destino</Text>
                            <Text style={styles.routeAddress} numberOfLines={2}>
                                {activeTrip.destination?.address || 'Dirección no disponible'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Bloque 9: métricas y método de pago */}
                <View style={styles.card}>
                    <View style={styles.metricsRow}>
                        <View style={styles.metric}>
                            <Ionicons name="speedometer-outline" size={18} color="#6B7280" />
                            <Text style={styles.metricValue}>{activeTrip.distanceKm ?? 0} km</Text>
                            <Text style={styles.metricLabel}>Distancia</Text>
                        </View>

                        <View style={styles.metric}>
                            <Ionicons name="hourglass-outline" size={18} color="#6B7280" />
                            <Text style={styles.metricValue}>{activeTrip.durationMin ?? 0} min</Text>
                            <Text style={styles.metricLabel}>Duración</Text>
                        </View>

                        <View style={styles.metric}>
                            <Ionicons name="wallet-outline" size={18} color="#6B7280" />
                            <Text style={styles.metricValue} numberOfLines={1}>
                                {paymentLabel || '—'}
                            </Text>
                            <Text style={styles.metricLabel}>Pago</Text>
                        </View>
                    </View>
                </View>

                {/* Bloque 10: dinero */}
                <View style={styles.moneyBox}>
                    <View>
                        <Text style={styles.moneyLabel}>Tarifa del viaje</Text>
                        <Text style={styles.moneyValue}>{formatCOP(activeTrip.fare)}</Text>
                    </View>
                    <View style={styles.netBox}>
                        <Text style={styles.moneyLabel}>Tu ganancia</Text>
                        <Text style={styles.netValue}>{formatCOP(activeTrip.driverEarnings)}</Text>
                    </View>
                </View>

                {/* Bloque 11: errores en línea, nunca con Alert */}
                {(localError || error) && (
                    <Text style={styles.errorText}>{localError || error}</Text>
                )}
            </ScrollView>

            {/* Bloque 12: acciones ancladas abajo. El relleno inferior toma el
                área segura para no chocar con el indicador de inicio. */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
                <TouchableOpacity
                    style={styles.mainButton}
                    onPress={handleMainAction}
                    disabled={working}
                    activeOpacity={0.85}
                >
                    {working ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <>
                            <Text style={styles.mainButtonText}>{actionLabel}</Text>
                            <Ionicons
                                name={canAdvance ? 'arrow-forward' : 'checkmark'}
                                size={18}
                                color="#FFFFFF"
                                style={styles.mainButtonIcon}
                            />
                        </>
                    )}
                </TouchableOpacity>

                {canCancel && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancel}
                        disabled={working}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.cancelText}>Cancelar viaje</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    centeredText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },
    scroll: {
        flex: 1,
    },
    mapBlock: {
        height: MAP_HEIGHT,
        backgroundColor: '#E5E7EB',
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    carMarkerBubble: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#111827',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000000',
        shadowOpacity: 0.25,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    simOverlayRow: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    simPillBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(17, 24, 39, 0.85)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    simPillText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 5,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 24,
    },
    header: {
        backgroundColor: '#111827',
        paddingHorizontal: 18,
        paddingBottom: 18,
    },
    headerLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
    },
    headerStatus: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        marginTop: 4,
    },
    progressTrack: {
        height: 5,
        borderRadius: 3,
        backgroundColor: '#374151',
        marginTop: 14,
        overflow: 'hidden',
    },
    progressFill: {
        height: 5,
        borderRadius: 3,
        backgroundColor: '#4ADE80',
    },
    progressText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 8,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 16,
        marginTop: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    passengerName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginLeft: 8,
    },
    routeRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    routeTexts: {
        flex: 1,
        marginLeft: 10,
    },
    routeLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
    },
    routeAddress: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginTop: 2,
    },
    originDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#16A34A',
        marginTop: 4,
    },
    destinationDot: {
        width: 10,
        height: 10,
        borderRadius: 2,
        backgroundColor: '#111827',
        marginTop: 4,
    },
    routeConnector: {
        width: 2,
        height: 18,
        backgroundColor: '#D1D5DB',
        marginLeft: 4,
        marginVertical: 4,
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    metric: {
        flex: 1,
        alignItems: 'center',
    },
    metricValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        marginTop: 4,
    },
    metricLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 2,
    },
    moneyBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 16,
        marginTop: 12,
    },
    moneyLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
    },
    moneyValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginTop: 2,
    },
    netBox: {
        alignItems: 'flex-end',
    },
    netValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#16A34A',
        marginTop: 2,
    },
    errorText: {
        fontSize: 13,
        color: '#DC2626',
        marginTop: 14,
        textAlign: 'center',
    },
    footer: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    mainButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
        borderRadius: 12,
        paddingVertical: 15,
    },
    mainButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    mainButtonIcon: {
        marginLeft: 8,
    },
    cancelButton: {
        alignItems: 'center',
        paddingVertical: 12,
        marginTop: 6,
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#DC2626',
    },
});
