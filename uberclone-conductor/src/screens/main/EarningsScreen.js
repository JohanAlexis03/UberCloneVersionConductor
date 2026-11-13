// AI-assisted: see docs/AI_LOG.md #30
import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDriver } from '../../context/DriverContext';
import { useEarnings } from '../../hooks/useEarnings';
import { formatCOP } from '../../config/pricing';

const PERIOD_TABS = [
    { key: 'today', label: 'Hoy' },
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mes' },
];

export default function EarningsScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { driver } = useDriver();
    const driverId = driver?.personalData?.idNumber || null;

    const { metrics, loading, refreshEarnings } = useEarnings(driverId);

    const [selectedPeriod, setSelectedPeriod] = useState('today');
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await refreshEarnings();
        setRefreshing(false);
    }, [refreshEarnings]);

    const handleGoBack = useCallback(() => {
        if (navigation?.canGoBack?.()) {
            navigation.goBack();
        } else if (navigation?.navigate) {
            navigation.navigate('Home');
        }
    }, [navigation]);

    const currentBlock = metrics?.[selectedPeriod] || {
        tripsCount: 0,
        totalFares: 0,
        totalCommissions: 0,
        totalTips: 0,
        netEarnings: 0,
        averageEarnings: 0,
    };

    const balance = Math.round(Number(metrics?.balance) || 0);
    const isNegativeBalance = balance < 0;

    return (
        <View style={styles.container}>
            {/* Encabezado compacto */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={handleGoBack}
                    activeOpacity={0.8}
                >
                    <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerTexts}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        Mis Ganancias
                    </Text>
                    <Text style={styles.headerSub} numberOfLines={1}>
                        Resumen financiero y saldo de cuenta
                    </Text>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="small" color="#111827" />
                    <Text style={styles.loadingText}>Calculando métricas…</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: insets.bottom + 24 },
                    ]}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor="#111827"
                        />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {/* Tarjeta de Saldo Acumulado (Pasarela suma, Efectivo descuenta comisión) */}
                    <View
                        style={[
                            styles.balanceCard,
                            isNegativeBalance
                                ? styles.balanceCardNegative
                                : styles.balanceCardPositive,
                        ]}
                    >
                        <View style={styles.balanceTopRow}>
                            <Text style={styles.balanceLabel}>
                                Saldo actual del conductor
                            </Text>
                            <View
                                style={[
                                    styles.balanceStatusChip,
                                    isNegativeBalance
                                        ? styles.chipDebt
                                        : styles.chipCredit,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.balanceStatusText,
                                        isNegativeBalance
                                            ? styles.chipDebtText
                                            : styles.chipCreditText,
                                    ]}
                                >
                                    {isNegativeBalance
                                        ? 'Comisión pendiente'
                                        : 'Saldo a favor'}
                                </Text>
                            </View>
                        </View>

                        <Text
                            style={[
                                styles.balanceValue,
                                isNegativeBalance
                                    ? styles.balanceValueNegative
                                    : styles.balanceValuePositive,
                            ]}
                        >
                            {isNegativeBalance
                                ? `−${formatCOP(Math.abs(balance))}`
                                : formatCOP(balance)}
                        </Text>

                        <Text style={styles.balanceExplanation}>
                            {isNegativeBalance
                                ? 'Recibiste pagos en efectivo y debes este monto de comisiones (20%) a la plataforma. Se compensará con tus próximos viajes por pasarela.'
                                : 'Disponible para dispersión a tu cuenta bancaria o billetera (Nequi / Daviplata). Calcula ganancias por pasarela menos comisiones en efectivo.'}
                        </Text>
                    </View>

                    {/* Selector de Período: Hoy / Semana / Mes */}
                    <View style={styles.periodTabsRow}>
                        {PERIOD_TABS.map((tab) => {
                            const active = selectedPeriod === tab.key;
                            return (
                                <TouchableOpacity
                                    key={tab.key}
                                    style={[
                                        styles.periodTab,
                                        active && styles.periodTabActive,
                                    ]}
                                    onPress={() => setSelectedPeriod(tab.key)}
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={[
                                            styles.periodTabText,
                                            active && styles.periodTabTextActive,
                                        ]}
                                    >
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Ganancia neta del período elegido */}
                    <View style={styles.netHighlightCard}>
                        <View>
                            <Text style={styles.netHighlightLabel}>
                                Ganancia neta ({PERIOD_TABS.find((t) => t.key === selectedPeriod)?.label})
                            </Text>
                            <Text style={styles.netHighlightValue}>
                                +{formatCOP(currentBlock.netEarnings)}
                            </Text>
                        </View>

                        <View style={styles.tripsCountBadge}>
                            <Ionicons name="car-sport-outline" size={16} color="#0369A1" />
                            <Text style={styles.tripsCountText}>
                                {currentBlock.tripsCount}{' '}
                                {currentBlock.tripsCount === 1 ? 'viaje' : 'viajes'}
                            </Text>
                        </View>
                    </View>

                    {/* Desglose completo de las 6 métricas obligatorias */}
                    <View style={styles.breakdownCard}>
                        <Text style={styles.sectionTitle}>
                            Desglose del período
                        </Text>

                        <View style={styles.lineRow}>
                            <Text style={styles.lineLabel}>
                                Viajes completados / pagados
                            </Text>
                            <Text style={styles.lineValueNeutral}>
                                {currentBlock.tripsCount}
                            </Text>
                        </View>

                        <View style={styles.lineRow}>
                            <Text style={styles.lineLabel}>
                                Total facturado (tarifas brutas)
                            </Text>
                            <Text style={styles.lineValueNeutral}>
                                {formatCOP(currentBlock.totalFares)}
                            </Text>
                        </View>

                        <View style={styles.lineRow}>
                            <Text style={styles.lineLabel}>
                                Comisiones de plataforma (20%)
                            </Text>
                            <Text style={styles.lineValueNegative}>
                                −{formatCOP(currentBlock.totalCommissions)}
                            </Text>
                        </View>

                        <View style={styles.lineRow}>
                            <Text style={styles.lineLabel}>
                                Total de propinas (100% conductor)
                            </Text>
                            <Text style={styles.lineValuePositive}>
                                +{formatCOP(currentBlock.totalTips)}
                            </Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.lineRow}>
                            <Text style={styles.lineLabelStrong}>
                                Ganancia neta total
                            </Text>
                            <Text style={styles.lineValueNet}>
                                +{formatCOP(currentBlock.netEarnings)}
                            </Text>
                        </View>

                        <View style={styles.lineRow}>
                            <Text style={styles.lineLabel}>
                                Promedio de ganancia por viaje
                            </Text>
                            <Text style={styles.lineValueNeutral}>
                                {formatCOP(currentBlock.averageEarnings)}
                            </Text>
                        </View>
                    </View>

                    {/* Comparativa rápida de los 3 períodos */}
                    <View style={styles.comparisonGrid}>
                        <View style={styles.miniCard}>
                            <Text style={styles.miniCardLabel}>Hoy</Text>
                            <Text style={styles.miniCardValue}>
                                {formatCOP(metrics?.today?.netEarnings || 0)}
                            </Text>
                            <Text style={styles.miniCardSub}>
                                {metrics?.today?.tripsCount || 0} viajes
                            </Text>
                        </View>

                        <View style={styles.miniCard}>
                            <Text style={styles.miniCardLabel}>Semana</Text>
                            <Text style={styles.miniCardValue}>
                                {formatCOP(metrics?.week?.netEarnings || 0)}
                            </Text>
                            <Text style={styles.miniCardSub}>
                                {metrics?.week?.tripsCount || 0} viajes
                            </Text>
                        </View>

                        <View style={styles.miniCard}>
                            <Text style={styles.miniCardLabel}>Mes</Text>
                            <Text style={styles.miniCardValue}>
                                {formatCOP(metrics?.month?.netEarnings || 0)}
                            </Text>
                            <Text style={styles.miniCardSub}>
                                {metrics?.month?.tripsCount || 0} viajes
                            </Text>
                        </View>
                    </View>

                    {/* Acceso rápido al historial detallado */}
                    <TouchableOpacity
                        style={styles.historyLinkBtn}
                        onPress={() => navigation.navigate('History')}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="time-outline" size={18} color="#111827" />
                        <Text style={styles.historyLinkText}>
                            Ver historial detallado de carreras
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                    </TouchableOpacity>
                </ScrollView>
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
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: 12,
    },
    balanceCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
    },
    balanceCardPositive: {
        borderColor: '#A7F3D0',
    },
    balanceCardNegative: {
        borderColor: '#FECACA',
    },
    balanceTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    balanceLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#6B7280',
        textTransform: 'uppercase',
    },
    balanceStatusChip: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    chipCredit: {
        backgroundColor: '#ECFDF5',
    },
    chipDebt: {
        backgroundColor: '#FEF2F2',
    },
    balanceStatusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    chipCreditText: {
        color: '#047857',
    },
    chipDebtText: {
        color: '#DC2626',
    },
    balanceValue: {
        fontSize: 22,
        fontWeight: '800',
        marginTop: 6,
    },
    balanceValuePositive: {
        color: '#16A34A',
    },
    balanceValueNegative: {
        color: '#DC2626',
    },
    balanceExplanation: {
        fontSize: 11.5,
        color: '#6B7280',
        lineHeight: 16,
        marginTop: 6,
    },
    periodTabsRow: {
        flexDirection: 'row',
        backgroundColor: '#E5E7EB',
        borderRadius: 10,
        padding: 3,
        marginBottom: 12,
    },
    periodTab: {
        flex: 1,
        paddingVertical: 7,
        borderRadius: 8,
        alignItems: 'center',
    },
    periodTabActive: {
        backgroundColor: '#FFFFFF',
    },
    periodTabText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    periodTabTextActive: {
        color: '#111827',
        fontWeight: '700',
    },
    netHighlightCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    netHighlightLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#6B7280',
        textTransform: 'uppercase',
    },
    netHighlightValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#16A34A',
        marginTop: 2,
    },
    tripsCountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0F2FE',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    tripsCountText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0369A1',
        marginLeft: 5,
    },
    breakdownCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
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
    lineLabelStrong: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111827',
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
    lineValueNet: {
        fontSize: 14,
        fontWeight: '800',
        color: '#16A34A',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 8,
    },
    comparisonGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    miniCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 10,
        marginHorizontal: 3,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    miniCardLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
    },
    miniCardValue: {
        fontSize: 12,
        fontWeight: '800',
        color: '#16A34A',
        marginTop: 3,
    },
    miniCardSub: {
        fontSize: 10,
        color: '#6B7280',
        marginTop: 1,
    },
    historyLinkBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    historyLinkText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '700',
        color: '#111827',
        marginLeft: 8,
    },
});
