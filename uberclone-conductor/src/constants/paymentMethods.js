// AI-assisted: see docs/AI_LOG.md #24

/**
 * Métodos de pago que maneja la app, con el texto y el icono de cada uno.
 *
 * Las etiquetas estaban duplicadas en la pantalla de solicitud y en la del
 * viaje. Con la pantalla de cobro serían tres copias: si mañana cambia una,
 * las otras dos seguirían mostrando la vieja.
 */
export const PAYMENT_METHODS = {
    cash: { label: 'Efectivo', icon: 'cash-outline' },
    mercadopago: { label: 'Mercado Pago', icon: 'phone-portrait-outline' },
    stripe: { label: 'Stripe (Tarjeta)', icon: 'card-outline' },
};

/**
 * @param {string} [method] - Valor guardado en el viaje
 * @returns {{label: string, icon: string}} El valor crudo como respaldo
 */
export function getPaymentMethod(method) {
    return (
        PAYMENT_METHODS[method] || {
            label: method || '',
            icon: 'help-circle-outline',
        }
    );
}
