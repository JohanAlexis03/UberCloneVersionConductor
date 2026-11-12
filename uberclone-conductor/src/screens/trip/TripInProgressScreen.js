// AI-assisted: see docs/AI_LOG.md #21
import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTrip } from '../../context/TripContext';
import {
    TRIP_STATUS,
    TRIP_FLOW,
    NEXT_ACTION_LABELS,
    nextFlowStatus,
    canTransitionTo,
} from '../../config/tripStatus';
import { formatCOP } from '../../config/pricing';

// Valores crudos de Firestore traducidos a texto para el conductor
const PAYMENT_LABELS = {
    cash: 'Efectivo',
    mercadopago: 'Mercado Pago',
    stripe: 'Tarjeta',
};

/**
 * Pantalla del viaje en curso.
 *
 * No escribe en Firestore directamente ni decide qué transiciones son
 * legales: eso vive en TripContext y en tripStatus. Esta pantalla solo
 * muestra el estado y pide el siguiente paso.
 *
 * Cuando el viaje termina en 'paid' no hay siguiente estado, así que el
 * botón deja de avanzar y libera al conductor con clearTrip(). Ese
 * clearTrip es justo lo que destraba el flujo: mientras no se llame, el
 * conductor sigue ocupado y no le vuelven a entrar solicitudes.
 */
export default function TripInProgressScreen() {
    // Zonas seguras reales del dispositivo (notch arriba, indicador de inicio abajo)
    const insets = useSafeAreaInsets();

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

    // Bloque 3: datos derivados del estado actual.
    // La verdad sobre qué se puede hacer la tienen tripStatus y el contexto;
    // acá solo se leen para saber qué ofrecer.
    const status = activeTrip?.status || null;
    const nextStatus = status ? nextFlowStatus(status) : null;
    const canAdvance = Boolean(nextStatus) && canTransitionTo(status, nextStatus);
    const canCancel = status ? canTransitionTo(status, TRIP_STATUS.CANCELLED) : false;

    const isFinished = status === TRIP_STATUS.PAID;
    const isCancelled = status === TRIP_STATUS.CANCELLED;

    const actionLabel = isFinished || isCancelled
        ? 'Volver a estar disponible'
        : NEXT_ACTION_LABELS[status] || 'Siguiente paso';

    const flowIndex = TRIP_FLOW.indexOf(status);
    const progress = flowIndex >= 0 ? ((flowIndex + 1) / TRIP_FLOW.length) * 100 : 0;

    const paymentLabel = PAYMENT_LABELS[activeTrip?.paymentMethod] || activeTrip?.paymentMethod;

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
