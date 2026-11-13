// AI-assisted: see docs/AI_LOG.md #29
import React, { useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDriver } from '../../context/DriverContext';
import { useEarnings } from '../../hooks/useEarnings';
import { formatCOP } from '../../config/pricing';
import { getPaymentMethod } from '../../constants/paymentMethods';
import { getStatusLabel } from '../../config/tripStatus';

/**
 * Límite estricto por lote exigido por docs/PROMPT_MAESTRO.md (Sección 6):
 * 20 viajes por carga mediante FlatList + onEndReached / botón Cargar más.
 */
export const HISTORY_PAGE_SIZE = 20;

const DATE_FILTERS = [
    { key: 'all', label: 'Todos' },
    { key: 'today', label: 'Hoy' },
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mes' },
];

const PAYMENT_FILTERS = [
    { key: 'all', label: 'Todos' },
    { key: 'cash', label: 'Efectivo' },
    { key: 'mercadopago', label: 'Mercado Pago' },
    { key: 'stripe', label: 'Stripe' },
];

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

function formatTripDate(dateValue) {
    if (!dateValue) return 'Sin fecha';
    const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (Number.isNaN(d.getTime())) return 'Sin fecha';

    const day = String(d.getDate()).padStart(2, '0');
    const month = MONTHS_SHORT[d.getMonth()] || '';
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day} ${month} · ${hours}:${minutes}`;
}

function formatMetrics(distanceKm, durationMin) {
    const km = Math.round((Number(distanceKm) || 0) * 10) / 10;
    const min = Math.round(Number(durationMin) || 0);
    return `${km} km · ${min} min`;
}

export default function HistoryScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { driver } = useDriver();
    const driverId = driver?.personalData?.idNumber || null;

    const { trips, loading, refreshEarnings } = useEarnings(driverId);

    const [dateFilter, setDateFilter] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [visibleCount, setVisibleCount] = useState(HISTORY_PAGE_SIZE);
    const [refreshing, setRefreshing] = useState(false);

    const filteredTrips = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            0,
            0,
            0,
            0
        );
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(
            now.getFullYear(),
            now.getMonth(),
            1,
            0,
            0,
            0,
            0
        );

        return trips.filter((trip) => {
            if (paymentFilter !== 'all') {
                const method = String(trip.paymentMethod || 'cash').toLowerCase();
                if (method !== paymentFilter) return false;
            }

            if (dateFilter !== 'all') {
                const tripDate =
                    trip.completedDate instanceof Date
                        ? trip.completedDate
                        : new Date(trip.completedDate || 0);

                if (dateFilter === 'today' && tripDate < startOfToday) return false;
                if (dateFilter === 'week' && tripDate < startOfWeek) return false;
                if (dateFilter === 'month' && tripDate < startOfMonth) return false;
            }

            return true;
        });
    }, [trips, dateFilter, paymentFilter]);

    const paginatedTrips = useMemo(
        () => filteredTrips.slice(0, visibleCount),
        [filteredTrips, visibleCount]
    );

    const hasMore = visibleCount < filteredTrips.length;

    const handleSelectDateFilter = useCallback((key) => {
        setDateFilter(key);
        setVisibleCount(HISTORY_PAGE_SIZE);
    }, []);

    const handleSelectPaymentFilter = useCallback((key) => {
        setPaymentFilter(key);
        setVisibleCount(HISTORY_PAGE_SIZE);
    }, []);

    const handleResetFilters = useCallback(() => {
        setDateFilter('all');
        setPaymentFilter('all');
        setVisibleCount(HISTORY_PAGE_SIZE);
    }, []);

    const handleLoadMore = useCallback(() => {
        if (!hasMore) return;
        setVisibleCount((prev) => prev + HISTORY_PAGE_SIZE);
    }, [hasMore]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        setVisibleCount(HISTORY_PAGE_SIZE);
        await refreshEarnings();
        setRefreshing(false);
    }, [refreshEarnings]);

    const keyExtractor = useCallback((item) => String(item.id), []);

    const renderTripItem = useCallback(
        ({ item }) => {
            const payment = getPaymentMethod(item.paymentMethod);
            const methodKey = String(item.paymentMethod || 'cash').toLowerCase();
            const isCash = methodKey === 'cash';
            const isStripe = methodKey === 'stripe';
            const isPaid = String(item.status || '').toLowerCase() === 'paid';
            const categoryLabel =
                CATEGORY_LABELS[item.category] || item.category || 'Económico';

            const fare = Math.round(Number(item.fare) || 0);
            const commission = Math.round(Number(item.commission) || 0);
            const net = Math.round(
                Number(item.driverEarnings) || Math.max(0, fare - commission)
            );

            const methodPillStyle = isCash
                ? styles.cashMethodPill
                : isStripe
                ? styles.stripeMethodPill
                : styles.digitalMethodPill;
            const methodTextStyle = isCash
                ? styles.cashMethodText
                : isStripe
                ? styles.stripeMethodText
                : styles.digitalMethodText;
            const methodIconColor = isCash
                ? '#B45309'
                : isStripe
                ? '#4F46E5'
                : '#0369A1';

            return (
                <TouchableOpacity
                    style={styles.tripCard}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('TripDetail', { trip: item })}
                >
                    {/* Cabecera compacta: Fecha + Estado */}
                    <View style={styles.cardHeaderRow}>
                        <View style={styles.dateBox}>
                            <Ionicons
                                name="time-outline"
                                size={13}
                                color="#6B7280"
                            />
                            <Text style={styles.dateText} numberOfLines={1}>
                                {formatTripDate(item.completedDate)}
                            </Text>
                            <Text style={styles.dotSeparator}>·</Text>
                            <Text style={styles.metricsInlineText} numberOfLines={1}>
                                {formatMetrics(item.distanceKm, item.durationMin)}
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.statusBadge,
                                isPaid
                                    ? styles.statusBadgePaid
                                    : styles.statusBadgeCompleted,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.statusBadgeText,
                                    isPaid
                                        ? styles.statusTextPaid
                                        : styles.statusTextCompleted,
                                ]}
                            >
                                {getStatusLabel(item.status)}
                            </Text>
                        </View>
                    </View>

                    {/* Ruta limpia en 2 líneas compactas */}
                    <View style={styles.routeBox}>
                        <View style={styles.routeLine}>
                            <View style={styles.originDot} />
                            <Text style={styles.routeAddress} numberOfLines={1}>
                                {item.origin?.address || 'Origen no disponible'}
                            </Text>
                        </View>

                        <View style={styles.routeConnector} />

                        <View style={styles.routeLine}>
                            <View style={styles.destinationDot} />
                            <Text style={styles.routeAddress} numberOfLines={1}>
                                {item.destination?.address || 'Destino no disponible'}
                            </Text>
                        </View>
                    </View>

                    {/* Fila 3: Píldoras a la izquierda y Ganancia neta a la derecha */}
                    <View style={styles.footerRow}>
                        <View style={styles.pillsGroup}>
                            <View style={[styles.tagPill, methodPillStyle]}>
                                <Ionicons
                                    name={payment.icon}
                                    size={12}
                                    color={methodIconColor}
                                />
                                <Text style={[styles.tagText, methodTextStyle]}>
                                    {payment.label}
                                </Text>
                            </View>

                            <View style={styles.tagPill}>
                                <Text style={styles.tagText}>{categoryLabel}</Text>
                            </View>
                        </View>

                        <Text style={styles.netEarningsValue}>
                            +{formatCOP(net)}
                        </Text>
                    </View>

                    {/* Fila 4 exclusiva para desglose: Tarifa a la izquierda, Comisión descontada a la derecha */}
                    <View style={styles.breakdownBar}>
                        <Text style={styles.fareSubText}>
                            Tarifa: {formatCOP(fare)}
                        </Text>
                        {commission > 0 && (
                            <Text style={styles.commissionDiscountText}>
                                Comisión (20%): −{formatCOP(commission)}
                            </Text>
                        )}
                    </View>
                </TouchableOpacity>
            );
        },
        [navigation]
    );

    const hasActiveFilters = dateFilter !== 'all' || paymentFilter !== 'all';

    const renderEmptyState = useCallback(() => {
        if (loading) return null;
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                    <Ionicons
                        name={hasActiveFilters ? 'filter-outline' : 'car-sport-outline'}
                        size={34}
                        color="#9CA3AF"
                    />
                </View>
                <Text style={styles.emptyTitle}>
                    {hasActiveFilters
                        ? 'Sin carreras en este filtro'
                        : 'Sin carreras registradas'}
                </Text>
                <Text style={styles.emptySubtitle}>
                    {hasActiveFilters
                        ? 'No encontramos viajes que coincidan con el período o método de pago seleccionado.'
                        : 'Aún no tienes viajes completados. Ponte en línea en el mapa de inicio para recibir solicitudes.'}
                </Text>
                <TouchableOpacity
                    style={styles.emptyBtn}
                    onPress={hasActiveFilters ? handleResetFilters : handleRefresh}
                    activeOpacity={0.85}
                >
                    <Ionicons
                        name={hasActiveFilters ? 'close-circle-outline' : 'refresh-outline'}
                        size={16}
                        color="#FFFFFF"
                    />
                    <Text style={styles.emptyBtnText}>
                        {hasActiveFilters ? 'Limpiar filtros' : 'Actualizar'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }, [loading, hasActiveFilters, handleResetFilters, handleRefresh]);

    const renderFooter = useCallback(() => {
        if (!hasMore) {
            if (paginatedTrips.length > 0) {
                return (
                    <Text style={styles.endOfListText}>
                        Mostrando {paginatedTrips.length} de {filteredTrips.length} carreras
                    </Text>
                );
            }
            return null;
        }

        return (
            <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={handleLoadMore}
                activeOpacity={0.85}
            >
                <Text style={styles.loadMoreText}>
                    Cargar más ({paginatedTrips.length}/{filteredTrips.length})
                </Text>
                <Ionicons name="chevron-down" size={16} color="#111827" />
            </TouchableOpacity>
        );
    }, [hasMore, paginatedTrips.length, filteredTrips.length, handleLoadMore]);

    return (
        <View style={styles.container}>
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
                        Historial de Carreras
                    </Text>
                    <Text style={styles.headerSub} numberOfLines={1}>
                        {filteredTrips.length}{' '}
                        {filteredTrips.length === 1 ? 'viaje' : 'viajes'} · {HISTORY_PAGE_SIZE} por página
                    </Text>
                </View>
            </View>

            {/* Barra simple y limpia de filtros con colores suaves y agradables */}
            <View style={styles.filtersContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScrollRow}
                >
                    <Text style={styles.filterGroupLabel}>Fecha:</Text>
                    {DATE_FILTERS.map((f) => {
                        const active = dateFilter === f.key;
                        return (
                            <TouchableOpacity
                                key={f.key}
                                style={[
                                    styles.filterChip,
                                    active && styles.dateChipActive,
                                ]}
                                onPress={() => handleSelectDateFilter(f.key)}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        active && styles.filterChipTextActive,
                                    ]}
                                >
                                    {f.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[styles.filterScrollRow, { marginTop: 6 }]}
                >
                    <Text style={styles.filterGroupLabel}>Pago:</Text>
                    {PAYMENT_FILTERS.map((f) => {
                        const active = paymentFilter === f.key;
                        const activeStyle =
                            f.key === 'cash'
                                ? styles.cashChipActive
                                : f.key === 'stripe'
                                ? styles.stripeChipActive
                                : f.key === 'mercadopago'
                                ? styles.digitalChipActive
                                : styles.dateChipActive;
                        const activeTextStyle =
                            f.key === 'cash'
                                ? styles.cashChipTextActive
                                : f.key === 'stripe'
                                ? styles.stripeChipTextActive
                                : f.key === 'mercadopago'
                                ? styles.digitalChipTextActive
                                : styles.filterChipTextActive;

                        return (
                            <TouchableOpacity
                                key={f.key}
                                style={[
                                    styles.filterChip,
                                    active && activeStyle,
                                ]}
                                onPress={() => handleSelectPaymentFilter(f.key)}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        active && activeTextStyle,
                                    ]}
                                >
                                    {f.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="small" color="#111827" />
                    <Text style={styles.loadingText}>Cargando historial…</Text>
                </View>
            ) : (
                <FlatList
                    data={paginatedTrips}
                    keyExtractor={keyExtractor}
                    renderItem={renderTripItem}
                    ListEmptyComponent={renderEmptyState}
                    ListFooterComponent={renderFooter}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.4}
                    initialNumToRender={10}
                    maxToRenderPerBatch={HISTORY_PAGE_SIZE}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingBottom: insets.bottom + 20 },
                        paginatedTrips.length === 0 && styles.listContentEmpty,
                    ]}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor="#111827"
                        />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
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
    filtersContainer: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    filterScrollRow: {
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    filterGroupLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#6B7280',
        marginRight: 6,
    },
    filterChip: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 14,
        marginRight: 6,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    dateChipActive: {
        backgroundColor: '#EEF2FF',
        borderColor: '#C7D2FE',
    },
    cashChipActive: {
        backgroundColor: '#FEF3C7',
        borderColor: '#FDE68A',
    },
    digitalChipActive: {
        backgroundColor: '#E0F2FE',
        borderColor: '#BAE6FD',
    },
    stripeChipActive: {
        backgroundColor: '#EEF2FF',
        borderColor: '#C7D2FE',
    },
    filterChipText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#4B5563',
    },
    filterChipTextActive: {
        color: '#3730A3',
        fontWeight: '700',
    },
    cashChipTextActive: {
        color: '#B45309',
        fontWeight: '700',
    },
    digitalChipTextActive: {
        color: '#0369A1',
        fontWeight: '700',
    },
    stripeChipTextActive: {
        color: '#4F46E5',
        fontWeight: '700',
    },
    loadingBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 8,
        fontSize: 13,
        color: '#6B7280',
    },
    listContent: {
        padding: 12,
    },
    listContentEmpty: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    tripCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    dateBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    dateText: {
        fontSize: 11,
        color: '#4B5563',
        fontWeight: '600',
        marginLeft: 4,
    },
    dotSeparator: {
        fontSize: 11,
        color: '#9CA3AF',
        marginHorizontal: 4,
    },
    metricsInlineText: {
        flexShrink: 1,
        fontSize: 11,
        color: '#6B7280',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        flexShrink: 0,
    },
    statusBadgePaid: {
        backgroundColor: '#ECFDF5',
    },
    statusBadgeCompleted: {
        backgroundColor: '#FEF3C7',
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    statusTextPaid: {
        color: '#047857',
    },
    statusTextCompleted: {
        color: '#B45309',
    },
    routeBox: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginBottom: 8,
    },
    routeLine: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    routeAddress: {
        flex: 1,
        fontSize: 12,
        fontWeight: '500',
        color: '#111827',
        marginLeft: 8,
    },
    originDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: '#16A34A',
    },
    destinationDot: {
        width: 7,
        height: 7,
        borderRadius: 1.5,
        backgroundColor: '#111827',
    },
    routeConnector: {
        width: 1.5,
        height: 8,
        backgroundColor: '#D1D5DB',
        marginLeft: 2.75,
        marginVertical: 2,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pillsGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
        marginRight: 8,
    },
    tagPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 6,
        marginRight: 6,
    },
    cashMethodPill: {
        backgroundColor: '#FEF3C7',
    },
    digitalMethodPill: {
        backgroundColor: '#E0F2FE',
    },
    stripeMethodPill: {
        backgroundColor: '#EEF2FF',
    },
    tagText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#4B5563',
        marginLeft: 3,
    },
    cashMethodText: {
        color: '#B45309',
    },
    digitalMethodText: {
        color: '#0369A1',
    },
    stripeMethodText: {
        color: '#4F46E5',
    },
    netEarningsValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#16A34A',
        flexShrink: 0,
    },
    breakdownBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        marginTop: 8,
        paddingTop: 6,
    },
    fareSubText: {
        fontSize: 11,
        fontWeight: '500',
        color: '#6B7280',
    },
    commissionDiscountText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#DC2626',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 32,
    },
    emptyIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 6,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 16,
    },
    emptyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111827',
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 8,
    },
    emptyBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 6,
    },
    loadMoreBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 10,
        paddingVertical: 10,
        marginTop: 2,
    },
    loadMoreText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#111827',
        marginRight: 4,
    },
    endOfListText: {
        textAlign: 'center',
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 6,
    },
});
