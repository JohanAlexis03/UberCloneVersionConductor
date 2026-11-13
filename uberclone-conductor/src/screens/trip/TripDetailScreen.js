// AI-assisted: see docs/AI_LOG.md #29
import React, { useMemo, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatCOP } from '../../config/pricing';
import { getPaymentMethod } from '../../constants/paymentMethods';
import { getStatusLabel } from '../../config/tripStatus';
import { toLatLng, buildRouteCoordinates } from '../../utils/geo';
import { getPaymentBreakdown } from '../../utils/payment';

const CATEGORY_LABELS = {
    economy: 'Económico',
    xl: 'XL',
    premium: 'Premium',
};

const MONTHS_SHORT = [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
];

function formatDetailDate(dateValue) {
    if (!dateValue) return 'Sin fecha';
    const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (Number.isNaN(d.getTime())) return 'Sin fecha';

    const day = String(d.getDate()).padStart(2, '0');
    const month = MONTHS_SHORT[d.getMonth()] || '';
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day} ${month} ${year} · ${hours}:${minutes}`;
}

export default function TripDetailScreen({ route, navigation }) {
    const insets = useSafeAreaInsets();
    const mapRef = useRef(null);
    const trip = route?.params?.trip || null;

    const origin = useMemo(() => toLatLng(trip?.origin), [trip?.origin]);
    const destination = useMemo(
        () => toLatLng(trip?.destination),
        [trip?.destination]
    );

    const routeCoords = useMemo(
        () => buildRouteCoordinates(trip?.routeCoordinates, origin, destination),
        [trip?.routeCoordinates, origin, destination]
    );

    const breakdown = useMemo(() => getPaymentBreakdown(trip), [trip]);

    useEffect(() => {
        if (!mapRef.current || routeCoords.length < 2) return;
        const timer = setTimeout(() => {
            if (mapRef.current) {
                mapRef.current.fitToCoordinates(routeCoords, {
                    edgePadding: { top: 44, right: 44, bottom: 44, left: 44 },
                    animated: true,
                });
            }
        }, 250);
        return () => clearTimeout(timer);
    }, [routeCoords]);

    if (!trip) {
        return (
            <View style={styles.centered}>
                <Text style={styles.emptyText}>No se encontró el detalle del viaje.</Text>
                <TouchableOpacity
                    style={styles.backFallbackBtn}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backFallbackText}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const payment = getPaymentMethod(trip.paymentMethod);
    const isCash = String(trip.paymentMethod || 'cash').toLowerCase() === 'cash';
    const categoryLabel =
        CATEGORY_LABELS[trip.category] || trip.category || 'Económico';
    const km = Math.round((Number(trip.distanceKm) || 0) * 10) / 10;
    const min = Math.round(Number(trip.durationMin) || 0);

    return (
        <View style={styles.container}>
            {/* Encabezado compacto */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.8}
                >
                    <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerTexts}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        Detalle de Carrera
                    </Text>
                    <Text style={styles.headerSub} numberOfLines={1}>
                        {formatDetailDate(trip.completedDate)} · {getStatusLabel(trip.status)}
                    </Text>
                </View>
            </View>

            {/* Mapa interactivo con <Polyline /> (prohibido Google Static Maps) */}
            <View style={styles.mapBlock}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    provider={PROVIDER_DEFAULT}
                    initialRegion={{
                        latitude: origin?.latitude ?? 6.2442,
                        longitude: origin?.longitude ?? -75.5812,
                        latitudeDelta: 0.035,
                        longitudeDelta: 0.035,
                    }}
                >
                    {routeCoords.length >= 2 && (
                        <Polyline
                            coordinates={routeCoords}
                            strokeColor="#111827"
                            strokeWidth={4}
                        />
                    )}
                    {origin && (
                        <Marker
                            coordinate={origin}
                            title="Recogida"
                            pinColor="#16A34A"
                        />
                    )}
                    {destination && (
                        <Marker
                            coordinate={destination}
                            title="Destino"
                            pinColor="#111827"
                        />
                    )}
                </MapView>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + 20 },
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Recorrido y métricas */}
                <View style={styles.card}>
                    <View style={styles.routePointRow}>
                        <View style={styles.originDot} />
                        <View style={styles.routeTexts}>
                            <Text style={styles.routeLabel}>Punto de recogida</Text>
                            <Text style={styles.routeAddress}>
                                {trip.origin?.address || 'Origen no disponible'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.routeConnector} />

                    <View style={styles.routePointRow}>
                        <View style={styles.destinationDot} />
                        <View style={styles.routeTexts}>
                            <Text style={styles.routeLabel}>Destino final</Text>
                            <Text style={styles.routeAddress}>
                                {trip.destination?.address || 'Destino no disponible'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.metricsStrip}>
                        <View style={styles.metricItem}>
                            <Ionicons name="speedometer-outline" size={15} color="#6B7280" />
                            <Text style={styles.metricText}>{km} km</Text>
                        </View>
                        <View style={styles.metricItem}>
                            <Ionicons name="hourglass-outline" size={15} color="#6B7280" />
                            <Text style={styles.metricText}>{min} min</Text>
                        </View>
                        <View style={styles.metricItem}>
                            <Ionicons name="car-outline" size={15} color="#6B7280" />
                            <Text style={styles.metricText}>{categoryLabel}</Text>
                        </View>
                    </View>
                </View>

                {/* Desglose financiero con semántica de color */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Desglose financiero</Text>

                    <View style={styles.lineRow}>
                        <Text style={styles.lineLabel}>Tarifa base del viaje</Text>
                        <Text style={styles.lineValueNeutral}>
                            {formatCOP(breakdown.fare)}
                        </Text>
                    </View>

                    {breakdown.tip > 0 && (
                        <View style={styles.lineRow}>
                            <Text style={styles.lineLabel}>Propina (100% conductor)</Text>
                            <Text style={styles.lineValuePositive}>
                                +{formatCOP(breakdown.tip)}
                            </Text>
                        </View>
                    )}

                    <View style={styles.lineRow}>
                        <Text style={styles.lineLabel}>
                            Comisión plataforma ({breakdown.commissionPercent}%)
                        </Text>
                        <Text style={styles.lineValueNegative}>
                            −{formatCOP(breakdown.commission)}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.lineRow}>
                        <Text style={styles.netTitle}>Tu ganancia neta</Text>
                        <Text style={styles.netAmount}>
                            +{formatCOP(breakdown.driverEarnings)}
                        </Text>
                    </View>
                </View>

                {/* Método de pago y efecto en el saldo */}
                <View style={styles.card}>
                    <View style={styles.methodHeader}>
                        <View
                            style={[
                                styles.methodBadge,
                                isCash ? styles.cashBadge : styles.digitalBadge,
                            ]}
                        >
                            <Ionicons
                                name={payment.icon}
                                size={16}
                                color={isCash ? '#B45309' : '#0369A1'}
                            />
                            <Text
                                style={[
                                    styles.methodBadgeText,
                                    isCash ? styles.cashBadgeText : styles.digitalBadgeText,
                                ]}
                            >
                                {payment.label}
                            </Text>
                        </View>

                        {trip.paymentId && (
                            <Text style={styles.paymentIdText} numberOfLines={1}>
                                Ref: {trip.paymentId}
                            </Text>
                        )}
                    </View>

                    <Text style={styles.balanceEffectNote}>
                        {isCash
                            ? `Cobrado en efectivo al pasajero. Se descontaron −${formatCOP(breakdown.commission)} de comisión de tu saldo acumulado.`
                            : `Pagado por pasarela digital. Se acreditaron +${formatCOP(breakdown.driverEarnings)} a tu saldo disponible.`}
                    </Text>
                </View>
            </ScrollView>
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
        padding: 24,
    },
    emptyText: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 12,
    },
    backFallbackBtn: {
        backgroundColor: '#111827',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    backFallbackText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 13,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111827',
        paddingHorizontal: 14,
        paddingBottom: 12,
    },
    backBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    headerTexts: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    headerSub: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 1,
    },
    mapBlock: {
        height: 190,
        backgroundColor: '#E5E7EB',
    },
    map: {
        flex: 1,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: 12,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    routePointRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    routeTexts: {
        flex: 1,
        marginLeft: 10,
    },
    routeLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
    },
    routeAddress: {
        fontSize: 12.5,
        fontWeight: '600',
        color: '#111827',
        marginTop: 2,
    },
    originDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#16A34A',
        marginTop: 4,
    },
    destinationDot: {
        width: 8,
        height: 8,
        borderRadius: 2,
        backgroundColor: '#111827',
        marginTop: 4,
    },
    routeConnector: {
        width: 1.5,
        height: 14,
        backgroundColor: '#D1D5DB',
        marginLeft: 3.25,
        marginVertical: 3,
    },
    metricsStrip: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        paddingVertical: 8,
        marginTop: 12,
    },
    metricItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metricText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        marginLeft: 5,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    lineRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 5,
    },
    lineLabel: {
        fontSize: 12.5,
        color: '#4B5563',
    },
    lineValueNeutral: {
        fontSize: 12.5,
        fontWeight: '600',
        color: '#111827',
    },
    lineValuePositive: {
        fontSize: 12.5,
        fontWeight: '700',
        color: '#16A34A',
    },
    lineValueNegative: {
        fontSize: 12.5,
        fontWeight: '700',
        color: '#DC2626',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 8,
    },
    netTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111827',
    },
    netAmount: {
        fontSize: 16,
        fontWeight: '800',
        color: '#16A34A',
    },
    methodHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    methodBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    cashBadge: {
        backgroundColor: '#FEF3C7',
    },
    digitalBadge: {
        backgroundColor: '#E0F2FE',
    },
    methodBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 6,
    },
    cashBadgeText: {
        color: '#B45309',
    },
    digitalBadgeText: {
        color: '#0369A1',
    },
    paymentIdText: {
        flexShrink: 1,
        fontSize: 11,
        color: '#6B7280',
        marginLeft: 8,
    },
    balanceEffectNote: {
        fontSize: 12,
        color: '#4B5563',
        lineHeight: 17,
    },
});
