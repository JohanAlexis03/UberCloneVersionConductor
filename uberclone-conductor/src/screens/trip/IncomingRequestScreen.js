// AI-assisted: see docs/AI_LOG.md #19
import React, { useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCOP } from '../../config/pricing';
import { getPaymentMethod } from '../../constants/paymentMethods';

// Tiempo total que dura una solicitud antes de rechazarse sola.
// Debe coincidir con REQUEST_TIMEOUT_SECONDS del hook useTripRequests.
const TOTAL_SECONDS = 15;

// Valores crudos de Firestore traducidos a texto para el conductor
const CATEGORY_LABELS = {
    economy: 'Económico',
    xl: 'XL',
    premium: 'Premium',
};

/**
 * Tarjeta de solicitud entrante.
 *
 * Es un componente presentacional: no consulta Firestore ni maneja el reloj.
 * Recibe el viaje, los segundos restantes y las acciones ya resueltas por
 * useTripRequests, y solo se encarga de mostrarlas.
 *
 * @param {Object|null} trip - Viaje en estado 'requested'
 * @param {number} timeLeft - Segundos restantes del temporizador
 * @param {boolean} accepting - true mientras se confirma en Firestore
 * @param {(tripId: string) => void} onAccept
 * @param {(tripId: string, reason: string) => void} onReject
 */
export default function IncomingRequestScreen({
    trip,
    timeLeft = TOTAL_SECONDS,
    accepting = false,
    onAccept,
    onReject,
}) {
    // Bloque 1: acciones del conductor.
    // El componente se vuelve a renderizar cada segundo por el temporizador,
    // asi que memorizamos los handlers para no recrearlos en cada tick.
    const handleAccept = useCallback(() => {
        if (!trip) return;
        onAccept(trip.id);
    }, [trip, onAccept]);

    const handleReject = useCallback(() => {
        if (!trip) return;
        onReject(trip.id, 'driver_rejected');
    }, [trip, onReject]);

    // Bloque 2: sin solicitud pendiente la tarjeta no existe en pantalla.
    if (!trip) {
        return null;
    }

    // Bloque 3: datos derivados para la vista.
    const seconds = Math.max(timeLeft, 0);
    const progress = (seconds / TOTAL_SECONDS) * 100;
    const isUrgent = seconds <= 5;

    const categoryLabel = CATEGORY_LABELS[trip.category] || trip.category;
    const paymentMethod = getPaymentMethod(trip.paymentMethod);

    return (
        <Modal visible transparent animationType="fade" onRequestClose={handleReject}>
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    {/* Bloque 4: encabezado con pasajero y contador */}
                    <View style={styles.headerRow}>
                        <View style={styles.passengerBox}>
                            <Text style={styles.passengerName} numberOfLines={1}>
                                {trip.passengerName || 'Pasajero'}
                            </Text>
                            <Text style={styles.categoryText}>{categoryLabel}</Text>
                        </View>

                        <View style={[styles.timerBadge, isUrgent && styles.timerBadgeUrgent]}>
                            <Ionicons
                                name="time-outline"
                                size={16}
                                color={isUrgent ? '#FFFFFF' : '#111827'}
                            />
                            <Text style={[styles.timerText, isUrgent && styles.timerTextUrgent]}>
                                {seconds}s
                            </Text>
                        </View>
                    </View>

                    {/* Barra que se vacia mientras corre el tiempo */}
                    <View style={styles.timerTrack}>
                        <View
                            style={[
                                styles.timerFill,
                                { width: `${progress}%` },
                                isUrgent && styles.timerFillUrgent,
                            ]}
                        />
                    </View>

                    {/* Bloque 5: ruta de recogida y destino */}
                    <View style={styles.routeBox}>
                        <View style={styles.routeRow}>
                            <View style={styles.originDot} />
                            <View style={styles.routeTexts}>
                                <Text style={styles.routeLabel}>Recogida</Text>
                                <Text style={styles.routeAddress} numberOfLines={2}>
                                    {trip.origin?.address || 'Dirección no disponible'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.routeConnector} />

                        <View style={styles.routeRow}>
                            <View style={styles.destinationDot} />
                            <View style={styles.routeTexts}>
                                <Text style={styles.routeLabel}>Destino</Text>
                                <Text style={styles.routeAddress} numberOfLines={2}>
                                    {trip.destination?.address || 'Dirección no disponible'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Bloque 6: metricas del viaje */}
                    <View style={styles.metricsRow}>
                        <View style={styles.metric}>
                            <Ionicons name="speedometer-outline" size={18} color="#6B7280" />
                            <Text style={styles.metricValue}>{trip.distanceKm ?? 0} km</Text>
                            <Text style={styles.metricLabel}>Distancia</Text>
                        </View>

                        <View style={styles.metric}>
                            <Ionicons name="hourglass-outline" size={18} color="#6B7280" />
                            <Text style={styles.metricValue}>{trip.durationMin ?? 0} min</Text>
                            <Text style={styles.metricLabel}>Duración</Text>
                        </View>

                        <View style={styles.metric}>
                            <Ionicons name={paymentMethod.icon} size={18} color="#6B7280" />
                            <Text style={styles.metricValue} numberOfLines={1}>
                                {paymentMethod.label}
                            </Text>
                            <Text style={styles.metricLabel}>Pago</Text>
                        </View>
                    </View>

                    {/* Bloque 7: dinero. Lo que paga el pasajero y lo que
                        realmente le queda al conductor despues de la comision. */}
                    <View style={styles.moneyBox}>
                        <View style={styles.moneyColumn}>
                            <Text style={styles.moneyLabel}>Tarifa del viaje</Text>
                            <Text style={styles.moneyValue}>{formatCOP(trip.fare)}</Text>
                        </View>

                        <View style={styles.netBox}>
                            <Text style={styles.netLabel}>Tu ganancia</Text>
                            <Text style={styles.netValue}>{formatCOP(trip.driverEarnings)}</Text>
                        </View>
                    </View>

                    {/* Bloque 8: acciones */}
                    <View style={styles.actionsRow}>
                        <TouchableOpacity
                            style={styles.rejectButton}
                            onPress={handleReject}
                            disabled={accepting}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="close" size={18} color="#DC2626" />
                            <Text style={styles.rejectText}>Rechazar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.acceptButton}
                            onPress={handleAccept}
                            disabled={accepting}
                            activeOpacity={0.85}
                        >
                            {accepting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                                    <Text style={styles.acceptText}>Aceptar</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'flex-end',
        padding: 16,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        elevation: 8,
        shadowColor: '#000000',
        shadowOpacity: 0.2,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    passengerBox: {
        flex: 1,
        marginRight: 12,
    },
    passengerName: {
        fontSize: 17,
        fontWeight: '800',
        color: '#111827',
    },
    categoryText: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    timerBadgeUrgent: {
        backgroundColor: '#DC2626',
    },
    timerText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#111827',
        marginLeft: 4,
    },
    timerTextUrgent: {
        color: '#FFFFFF',
    },
    timerTrack: {
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E5E7EB',
        marginTop: 12,
        overflow: 'hidden',
    },
    timerFill: {
        height: 4,
        borderRadius: 2,
        backgroundColor: '#111827',
    },
    timerFillUrgent: {
        backgroundColor: '#DC2626',
    },
    routeBox: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 14,
        marginTop: 16,
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
        marginTop: 16,
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
        backgroundColor: '#111827',
        borderRadius: 12,
        padding: 14,
        marginTop: 16,
    },
    moneyColumn: {
        flex: 1,
    },
    moneyLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        textTransform: 'uppercase',
        fontWeight: '700',
    },
    moneyValue: {
        fontSize: 15,
        color: '#FFFFFF',
        fontWeight: '600',
        marginTop: 2,
    },
    netBox: {
        alignItems: 'flex-end',
    },
    netLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        textTransform: 'uppercase',
        fontWeight: '700',
    },
    netValue: {
        fontSize: 18,
        color: '#4ADE80',
        fontWeight: '800',
        marginTop: 2,
    },
    actionsRow: {
        flexDirection: 'row',
        marginTop: 18,
    },
    rejectButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FCA5A5',
        borderRadius: 12,
        paddingVertical: 14,
        marginRight: 10,
    },
    rejectText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#DC2626',
        marginLeft: 6,
    },
    acceptButton: {
        flex: 1.4,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
        borderRadius: 12,
        paddingVertical: 14,
    },
    acceptText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
        marginLeft: 6,
    },
});
