// AI-assisted: see docs/AI_LOG.md #27
import { Linking } from 'react-native';

/**
 * URL del servidor backend.
 * En desarrollo toma EXPO_PUBLIC_BACKEND_URL si está definida; de lo contrario
 * usa la IP LAN del entorno de desarrollo (192.168.1.137:4000).
 * Nunca contiene credenciales privadas.
 */
const BACKEND_BASE_URL = (
    process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.1.137:4000'
).replace(/\/$/, '');

/**
 * Solicita al backend la creación de una preferencia de Mercado Pago Checkout Pro
 * en modo de prueba.
 *
 * @param {Object} params
 * @param {string} params.tripId
 * @param {number} params.amount
 * @param {string} [params.title]
 * @returns {Promise<{paymentId: string, preferenceId: string, checkoutUrl: string|null, mode: string}>}
 */
export async function processMercadoPagoCheckout({ tripId, amount, title }) {
    const payload = {
        tripId,
        amount: Math.round(Number(amount) || 0),
        title: title || `Viaje UberClone #${String(tripId).slice(0, 6)}`,
        paymentMethod: 'mercadopago',
    };

    try {
        const response = await fetch(
            `${BACKEND_BASE_URL}/api/payments/mercadopago/preference`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(data.error || 'No se pudo crear la preferencia de Mercado Pago.');
        }

        return {
            paymentId: data.paymentId || `mp_${Date.now()}`,
            preferenceId: data.preferenceId || `pref_${Date.now()}`,
            checkoutUrl: data.checkoutUrl || null,
            mode: data.mode || 'mercadopago_sandbox',
        };
    } catch (networkErr) {
        console.warn('[MercadoPago Service]: usando respaldo sandbox local:', networkErr.message);
        const ts = Date.now();
        return {
            paymentId: `mp_sandbox_${ts}`,
            preferenceId: `sandbox_pref_${tripId}_${ts}`,
            checkoutUrl: null,
            mode: 'offline_sandbox',
        };
    }
}

/**
 * Solicita al backend la creación de un PaymentIntent de Stripe en modo de
 * prueba (PaymentSheet test flow).
 *
 * @param {Object} params
 * @param {string} params.tripId
 * @param {number} params.amount
 * @param {string} [params.title]
 * @returns {Promise<{paymentId: string, clientSecret: string, checkoutUrl: string|null, mode: string}>}
 */
export async function processStripePayment({ tripId, amount, title }) {
    const payload = {
        tripId,
        amount: Math.round(Number(amount) || 0),
        title: title || `Viaje UberClone #${String(tripId).slice(0, 6)}`,
        paymentMethod: 'stripe',
    };

    try {
        const response = await fetch(
            `${BACKEND_BASE_URL}/api/payments/stripe/payment-intent`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(data.error || 'No se pudo crear el PaymentIntent de Stripe.');
        }

        return {
            paymentId: data.paymentId || `pi_${Date.now()}`,
            clientSecret: data.clientSecret || `pi_${Date.now()}_secret_test`,
            checkoutUrl: data.checkoutUrl || null,
            mode: data.mode || 'stripe_test',
        };
    } catch (networkErr) {
        console.warn('[Stripe Service]: usando respaldo sandbox local:', networkErr.message);
        const ts = Date.now();
        return {
            paymentId: `pi_sandbox_${ts}`,
            clientSecret: `pi_sandbox_${ts}_secret_test`,
            checkoutUrl: null,
            mode: 'offline_sandbox',
        };
    }
}

/**
 * Abre opcionalmente la vista web externa de la pasarela si el usuario lo solicita.
 *
 * @param {string|null} url
 */
export async function openExternalCheckoutUrl(url) {
    if (!url) return false;
    try {
        await Linking.openURL(url);
        return true;
    } catch (err) {
        console.warn('No se pudo abrir URL externa:', err.message);
        return false;
    }
}
