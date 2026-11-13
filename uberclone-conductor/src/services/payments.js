// AI-assisted: see docs/AI_LOG.md #26
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
 * y abre la URL de pago en modo de prueba si está disponible.
 *
 * @param {Object} params
 * @param {string} params.tripId
 * @param {number} params.amount
 * @param {string} [params.title]
 * @returns {Promise<{paymentId: string, checkoutUrl: string|null, mode: string}>}
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

        if (data.checkoutUrl) {
            try {
                await Linking.openURL(data.checkoutUrl);
            } catch (openErr) {
                console.warn('No se pudo abrir el navegador de Checkout Pro:', openErr.message);
            }
        }

        return {
            paymentId: data.paymentId || `mp_${Date.now()}`,
            checkoutUrl: data.checkoutUrl || null,
            mode: data.mode || 'mercadopago_sandbox',
        };
    } catch (networkErr) {
        // Si el teléfono físico en Expo Go no alcanza localhost:4000 porque el
        // backend no está en la misma IP LAN, generamos referencia de prueba
        // sandbox para no bloquear el cierre del viaje en la demostración.
        console.warn('[MercadoPago Service]: usando respaldo sandbox local:', networkErr.message);
        return {
            paymentId: `mp_sandbox_${Date.now()}`,
            checkoutUrl: null,
            mode: 'offline_sandbox',
        };
    }
}
