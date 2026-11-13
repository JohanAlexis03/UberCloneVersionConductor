// AI-assisted: see docs/AI_LOG.md #27
import React, { useCallback, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTrip } from '../../context/TripContext';
import { TRIP_STATUS } from '../../config/tripStatus';
import { formatCOP } from '../../config/pricing';
import { getPaymentBreakdown } from '../../utils/payment';
import { getPaymentMethod } from '../../constants/paymentMethods';
import {
    processMercadoPagoCheckout,
    processStripePayment,
    openExternalCheckoutUrl,
} from '../../services/payments';

/**
 * Pantalla de cobro y cierre del viaje (`completed` -> `paid`).
 *
 * El navegador la monta cuando el viaje queda en `completed`: la tarifa ya
 * está calculada y lo único que falta es cobrar. No escribe en Firestore ni
 * decide transiciones; le pide el cobro a TripContext, que valida y escribe.
 *
 * Si el método es pasarela (`mercadopago` o `stripe`), primero consulta al
 * backend para crear la preferencia o PaymentIntent y abre el modal interactivo
 * de prueba (Mercado Pago Checkout Pro o Stripe PaymentSheet) dentro de la app,
 * antes de confirmar el estado `paid`.
 */
export default function TripPaymentScreen() {
    // Zonas seguras reales del dispositivo (notch arriba, indicador abajo)
    const insets = useSafeAreaInsets();

    // Bloque 1: estado compartido del viaje y del cobro.
    const {
        activeTrip,
        statusLabel,
        confirmCashPayment,
        confirmGatewayPayment,
        clearTrip,
        error,
    } = useTrip();

    // Bloque 2: estado local de la operación en curso y modal de pasarela.
    // El error de negocio no se muestra con Alert: va en línea, bajo el botón.
    const [working, setWorking] = useState(false);
    const [localError, setLocalError] = useState(null);
    const [gatewaySession, setGatewaySession] = useState(null);

    // Bloque 3: dinero del viaje. Se deriva de lo guardado en el documento
    // con la misma regla que usa el saldo, para que la pantalla y el saldo
    // no puedan decir cosas distintas.
    const breakdown = useMemo(() => getPaymentBreakdown(activeTrip), [activeTrip]);

    // Bloque 4: en qué punto del cobro está el viaje.
    const status = activeTrip?.status || null;
    const isPaid = status === TRIP_STATUS.PAID;
    const methodKey = String(activeTrip?.paymentMethod || 'cash').toLowerCase();
    const paymentMethod = getPaymentMethod(methodKey);
    const isCash = methodKey === 'cash';

    // Bloque 5: confirmar el cobro en efectivo.
    const handleConfirmCash = useCallback(async () => {
        setLocalError(null);
        setWorking(true);
        const ok = await confirmCashPayment();
        if (!ok) {
            setLocalError('No se pudo confirmar el cobro. Revisa tu conexión.');
        }
        setWorking(false);
    }, [confirmCashPayment]);

    // Bloque 5b: iniciar el flujo de pasarela en el backend y abrir la ventana
    // interactiva (Checkout Pro o Stripe PaymentSheet) en la misma app.
    const handleOpenGateway = useCallback(async () => {
        if (!activeTrip) return;
        setLocalError(null);
        setWorking(true);

        try {
            const title = `Viaje UberClone - ${activeTrip.destination?.address || 'Destino'}`;

            if (methodKey === 'mercadopago') {
                const mpData = await processMercadoPagoCheckout({
                    tripId: activeTrip.id,
                    amount: breakdown.totalToCollect,
                    title,
                });
                setGatewaySession({
                    gateway: 'mercadopago',
                    title,
                    amount: breakdown.totalToCollect,
                    paymentId: mpData.paymentId,
                    reference: mpData.preferenceId,
                    checkoutUrl: mpData.checkoutUrl,
                    mode: mpData.mode,
                });
            } else {
                const stripeData = await processStripePayment({
                    tripId: activeTrip.id,
                    amount: breakdown.totalToCollect,
                    title,
                });
                setGatewaySession({
                    gateway: 'stripe',
                    title,
                    amount: breakdown.totalToCollect,
                    paymentId: stripeData.paymentId,
                    reference: stripeData.clientSecret,
                    checkoutUrl: stripeData.checkoutUrl,
                    mode: stripeData.mode,
                });
            }
        } catch (err) {
            setLocalError(err.message || 'Error al conectar con la pasarela de pagos.');
        } finally {
            setWorking(false);
        }
    }, [activeTrip, methodKey, breakdown.totalToCollect]);

    // Bloque 5c: aprobar el pago dentro del modal de prueba y registrar en Firestore.
    const handleCompleteGatewayPayment = useCallback(async () => {
        if (!gatewaySession) return;
        setLocalError(null);
        setWorking(true);

        try {
            const ok = await confirmGatewayPayment(gatewaySession.paymentId);
            if (ok) {
                setGatewaySession(null);
            } else {
                setLocalError('No se pudo registrar el pago digital en Firestore.');
            }
        } catch (err) {
            setLocalError(err.message || 'Error al confirmar el pago digital.');
        } finally {
            setWorking(false);
        }
    }, [gatewaySession, confirmGatewayPayment]);

    // Bloque 6: cerrar el viaje y volver a estar disponible.
    const handleFinish = useCallback(() => {
        clearTrip();
    }, [clearTrip]);

    // Bloque 7: mientras el contexto resuelve el documento todavía no hay
    // nada que cobrar, pero tampoco hay que salir de la pantalla.
    if (!activeTrip) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#000000" />
                <Text style={styles.centeredText}>Cargando el cobro…</Text>
            </View>
        );
    }

    const isMercadoPagoModal = gatewaySession?.gateway === 'mercadopago';

    return (
        <View style={styles.container}>
            {/* Bloque 8: encabezado fijo con el estado del viaje. */}
            <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
                <Text style={styles.headerLabel}>Cobro del viaje</Text>
                <Text style={styles.headerStatus}>{statusLabel}</Text>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Bloque 9: total que paga el pasajero. */}
                <View style={styles.totalCard}>
                    <Text style={styles.totalLabel}>
                        {isPaid ? 'Total cobrado' : 'Total a cobrar'}
                    </Text>
                    <Text style={styles.totalValue}>
                        {formatCOP(breakdown.totalToCollect)}
                    </Text>
                    <Text style={styles.totalHint}>
                        {activeTrip.distanceKm ?? 0} km · {activeTrip.durationMin ?? 0} min
                    </Text>
                </View>

                {/* Bloque 10: desglose. */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Desglose</Text>

                    <View style={styles.line}>
                        <Text style={styles.lineLabel}>Tarifa del viaje</Text>
                        <Text style={styles.lineValue}>{formatCOP(breakdown.fare)}</Text>
                    </View>

                    {breakdown.tip > 0 && (
                        <View style={styles.line}>
                            <Text style={styles.lineLabel}>Propina</Text>
                            <Text style={styles.lineValue}>{formatCOP(breakdown.tip)}</Text>
                        </View>
                    )}

                    <View style={styles.line}>
                        <Text style={styles.lineLabel}>
                            Comisión plataforma ({breakdown.commissionPercent}%)
                        </Text>
                        <Text style={styles.lineValueNegative}>
                            −{formatCOP(breakdown.commission)}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.line}>
                        <Text style={styles.netLabel}>Tu ganancia neta</Text>
                        <Text style={styles.netValue}>
                            {formatCOP(breakdown.driverEarnings)}
                        </Text>
                    </View>
                </View>

                {/* Bloque 11: método de pago y qué pasa con el saldo. */}
                <View style={styles.card}>
                    <View style={styles.methodRow}>
                        <View style={styles.methodIcon}>
                            <Ionicons
                                name={paymentMethod.icon}
                                size={22}
                                color="#111827"
                            />
                        </View>
                        <View style={styles.methodTexts}>
                            <Text style={styles.methodLabel}>Método de pago</Text>
                            <Text style={styles.methodValue}>{paymentMethod.label}</Text>
                        </View>
                    </View>

                    {isCash ? (
                        <Text style={styles.methodNote}>
                            Recibes {formatCOP(breakdown.totalToCollect)} en efectivo del
                            pasajero. De tu saldo se descuentan{' '}
                            {formatCOP(breakdown.commission)} de comisión.
                        </Text>
                    ) : (
                        <Text style={styles.methodNote}>
                            El pasajero paga por {paymentMethod.label}. Se acreditan{' '}
                            {formatCOP(breakdown.driverEarnings)} netos a tu saldo disponible
                            para dispersión a tu cuenta o billetera registrada.
                        </Text>
                    )}
                </View>

                {/* Bloque 12: recibo cuando el cobro ya quedó registrado. */}
                {isPaid && (
                    <View style={styles.receiptCard}>
                        <Ionicons name="checkmark-circle" size={28} color="#16A34A" />
                        <View style={styles.receiptTexts}>
                            <Text style={styles.receiptTitle}>Pago confirmado</Text>
                            <Text style={styles.receiptText}>
                                {isCash
                                    ? `Se descontaron ${formatCOP(breakdown.commission)} de comisión de tu saldo.`
                                    : `Se acreditaron ${formatCOP(breakdown.driverEarnings)} a tu saldo (${activeTrip.paymentId || paymentMethod.label}).`}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Bloque 13: errores en línea, nunca con Alert */}
                {(localError || error) && (
                    <Text style={styles.errorText}>{localError || error}</Text>
                )}
            </ScrollView>

            {/* Bloque 14: acciones ancladas abajo. */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
                {isPaid ? (
                    <TouchableOpacity
                        style={styles.mainButton}
                        onPress={handleFinish}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.mainButtonText}>
                            Volver a estar disponible
                        </Text>
                        <Ionicons
                            name="checkmark"
                            size={18}
                            color="#FFFFFF"
                            style={styles.mainButtonIcon}
                        />
                    </TouchableOpacity>
                ) : isCash ? (
                    <TouchableOpacity
                        style={styles.mainButton}
                        onPress={handleConfirmCash}
                        disabled={working}
                        activeOpacity={0.85}
                    >
                        {working ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Text style={styles.mainButtonText}>
                                    Confirmar cobro en efectivo recibido
                                </Text>
                                <Ionicons
                                    name="cash-outline"
                                    size={18}
                                    color="#FFFFFF"
                                    style={styles.mainButtonIcon}
                                />
                            </>
                        )}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[
                            styles.mainButton,
                            methodKey === 'mercadopago'
                                ? styles.mpButton
                                : styles.stripeButton,
                        ]}
                        onPress={handleOpenGateway}
                        disabled={working}
                        activeOpacity={0.85}
                    >
                        {working ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Text style={styles.mainButtonText}>
                                    Abrir pasarela {paymentMethod.label} (Modo Prueba)
                                </Text>
                                <Ionicons
                                    name={paymentMethod.icon}
                                    size={18}
                                    color="#FFFFFF"
                                    style={styles.mainButtonIcon}
                                />
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {/* Bloque 15: MODAL INTERACTIVO DE PASARELA (Mercado Pago Checkout Pro / Stripe PaymentSheet) */}
            <Modal
                visible={Boolean(gatewaySession)}
                transparent
                animationType="slide"
                onRequestClose={() => !working && setGatewaySession(null)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={[styles.gatewaySheet, { paddingBottom: insets.bottom + 20 }]}>
                        {/* Cabecera con el color e identidad de la pasarela */}
                        <View
                            style={[
                                styles.gatewayHeader,
                                isMercadoPagoModal
                                    ? styles.mpHeaderBg
                                    : styles.stripeHeaderBg,
                            ]}
                        >
                            <View style={styles.gatewayHeaderRow}>
                                <View style={styles.gatewayBadge}>
                                    <Text style={styles.gatewayBadgeText}>
                                        {isMercadoPagoModal
                                            ? 'MERCADO PAGO · CHECKOUT PRO (SANDBOX)'
                                            : 'STRIPE · PAYMENTSHEET (TEST MODE)'}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setGatewaySession(null)}
                                    disabled={working}
                                >
                                    <Ionicons name="close-circle" size={26} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.gatewayTitle}>
                                {gatewaySession?.title}
                            </Text>
                            <Text style={styles.gatewayAmount}>
                                {formatCOP(gatewaySession?.amount || 0)}
                            </Text>
                        </View>

                        <View style={styles.gatewayBody}>
                            {isMercadoPagoModal ? (
                                <>
                                    <Text style={styles.gatewaySectionLabel}>
                                        Medio de pago en Checkout Pro (Prueba)
                                    </Text>
                                    <View style={styles.simulatedCardBox}>
                                        <Ionicons
                                            name="phone-portrait-outline"
                                            size={22}
                                            color="#009EE3"
                                        />
                                        <View style={styles.simulatedCardTexts}>
                                            <Text style={styles.simulatedCardTitle}>
                                                Cuenta Mercado Pago / PSE (Nequi · Bancolombia)
                                            </Text>
                                            <Text style={styles.simulatedCardSub}>
                                                Preferencia: {gatewaySession?.reference}
                                            </Text>
                                        </View>
                                    </View>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.gatewaySectionLabel}>
                                        Tarjeta de prueba Stripe (PaymentSheet)
                                    </Text>
                                    <View style={styles.simulatedCardBox}>
                                        <Ionicons
                                            name="card-outline"
                                            size={22}
                                            color="#635BFF"
                                        />
                                        <View style={styles.simulatedCardTexts}>
                                            <Text style={styles.simulatedCardTitle}>
                                                Visa •••• •••• •••• 4242 · Exp 12/34 · CVC 424
                                            </Text>
                                            <Text style={styles.simulatedCardSub} numberOfLines={1}>
                                                PaymentIntent: {gatewaySession?.paymentId}
                                            </Text>
                                        </View>
                                    </View>
                                </>
                            )}

                            <View style={styles.gatewayMetaBox}>
                                <Text style={styles.gatewayMetaLine}>
                                    ID Transacción: {gatewaySession?.paymentId}
                                </Text>
                                <Text style={styles.gatewayMetaLine}>
                                    Ganancia neta a acreditar a tu saldo:{' '}
                                    {formatCOP(breakdown.driverEarnings)}
                                </Text>
                            </View>

                            {gatewaySession?.checkoutUrl && (
                                <TouchableOpacity
                                    style={styles.externalLinkBtn}
                                    onPress={() =>
                                        openExternalCheckoutUrl(gatewaySession.checkoutUrl)
                                    }
                                >
                                    <Ionicons
                                        name="open-outline"
                                        size={16}
                                        color="#4B5563"
                                    />
                                    <Text style={styles.externalLinkText}>
                                        Ver comprobante web del servidor backend
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={[
                                    styles.mainButton,
                                    isMercadoPagoModal
                                        ? styles.mpButton
                                        : styles.stripeButton,
                                ]}
                                onPress={handleCompleteGatewayPayment}
                                disabled={working}
                                activeOpacity={0.85}
                            >
                                {working ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Ionicons
                                            name="shield-checkmark-outline"
                                            size={18}
                                            color="#FFFFFF"
                                        />
                                        <Text
                                            style={[
                                                styles.mainButtonText,
                                                { marginLeft: 8 },
                                            ]}
                                        >
                                            {isMercadoPagoModal
                                                ? `Pagar ${formatCOP(gatewaySession?.amount || 0)} en Mercado Pago`
                                                : `Pagar ${formatCOP(gatewaySession?.amount || 0)} con Stripe`}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    totalCard: {
        backgroundColor: '#111827',
        borderRadius: 14,
        padding: 18,
    },
    totalLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
    },
    totalValue: {
        fontSize: 30,
        fontWeight: '800',
        color: '#FFFFFF',
        marginTop: 6,
    },
    totalHint: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 16,
        marginTop: 12,
    },
    cardTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    line: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    lineLabel: {
        fontSize: 14,
        color: '#4B5563',
        flexShrink: 1,
        paddingRight: 12,
    },
    lineValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    lineValueNegative: {
        fontSize: 14,
        fontWeight: '600',
        color: '#DC2626',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 8,
    },
    netLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    netValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#16A34A',
    },
    methodRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    methodIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    methodTexts: {
        flex: 1,
        marginLeft: 12,
    },
    methodLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
    },
    methodValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginTop: 2,
    },
    methodNote: {
        fontSize: 13,
        color: '#4B5563',
        lineHeight: 19,
        marginTop: 12,
    },
    receiptCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        borderRadius: 14,
        padding: 16,
        marginTop: 12,
    },
    receiptTexts: {
        flex: 1,
        marginLeft: 12,
    },
    receiptTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#065F46',
    },
    receiptText: {
        fontSize: 13,
        color: '#047857',
        marginTop: 2,
        lineHeight: 18,
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
        paddingHorizontal: 16,
    },
    mpButton: {
        backgroundColor: '#009EE3',
    },
    stripeButton: {
        backgroundColor: '#635BFF',
    },
    mainButtonText: {
        flexShrink: 1,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    mainButtonIcon: {
        marginLeft: 8,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    gatewaySheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    gatewayHeader: {
        padding: 20,
    },
    mpHeaderBg: {
        backgroundColor: '#009EE3',
    },
    stripeHeaderBg: {
        backgroundColor: '#635BFF',
    },
    gatewayHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    gatewayBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    gatewayBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
    },
    gatewayTitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: '600',
    },
    gatewayAmount: {
        color: '#FFFFFF',
        fontSize: 30,
        fontWeight: '800',
        marginTop: 4,
    },
    gatewayBody: {
        padding: 20,
    },
    gatewaySectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    simulatedCardBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
    },
    simulatedCardTexts: {
        flex: 1,
        marginLeft: 12,
    },
    simulatedCardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    simulatedCardSub: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    gatewayMetaBox: {
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
    },
    gatewayMetaLine: {
        fontSize: 12,
        color: '#374151',
        marginVertical: 2,
    },
    externalLinkBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        marginBottom: 12,
    },
    externalLinkText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4B5563',
        marginLeft: 6,
        textDecorationLine: 'underline',
    },
});
