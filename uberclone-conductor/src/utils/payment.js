// AI-assisted: see docs/AI_LOG.md #24
import { PRICING_CONFIG } from '../config/pricing';

/**
 * Reglas de dinero del cobro, fuera de las pantallas.
 *
 * Las dos funciones de acá son puras: reciben el documento del viaje y
 * devuelven números. Eso permite probarlas sin montar React ni Firestore, y
 * deja una sola definición de "cuánto se cobra" y "cuánto mueve el saldo".
 */

/**
 * Desglose de cobro de un viaje.
 *
 * La tarifa y la comisión son las que quedaron guardadas al terminar el
 * viaje; si el documento es viejo y no las trae, se reconstruyen con la
 * misma regla de pricing. La propina se suma completa al conductor.
 *
 * @param {Object} trip
 * @returns {{
 *   fare: number,
 *   tip: number,
 *   totalToCollect: number,
 *   commission: number,
 *   driverEarnings: number,
 *   commissionRate: number,
 *   commissionPercent: number
 * }}
 */
export function getPaymentBreakdown(trip) {
    const fare = Math.max(0, Math.round(Number(trip?.fare) || 0));
    const tip = Math.max(0, Math.round(Number(trip?.tip) || 0));

    // El commissionRate se guarda con cada viaje justamente para que un
    // cambio futuro de la comisión no reescriba el pasado.
    const storedRate = Number(trip?.commissionRate);
    const commissionRate =
        Number.isFinite(storedRate) && storedRate >= 0 && storedRate <= 1
            ? storedRate
            : PRICING_CONFIG.commissionRate;

    const storedCommission = Number(trip?.commission);
    const commission =
        Number.isFinite(storedCommission) && storedCommission >= 0
            ? Math.round(storedCommission)
            : Math.round(fare * commissionRate);

    const storedEarnings = Number(trip?.driverEarnings);
    const driverEarnings = Number.isFinite(storedEarnings)
        ? Math.round(storedEarnings)
        : fare - commission + tip;

    return {
        fare,
        tip,
        totalToCollect: fare + tip,
        commission,
        driverEarnings,
        commissionRate,
        commissionPercent: Math.round(commissionRate * 100),
    };
}

/**
 * Cuánto mueve un viaje el saldo del conductor.
 *
 * Regla del negocio:
 * - pasarela: la plataforma recibió el dinero, retuvo la comisión y le debe
 *   al conductor la ganancia neta (+driverEarnings, con propina incluida);
 * - efectivo: el conductor cobró todo en mano, así que debe la comisión
 *   (-commission) y el saldo puede quedar en negativo.
 *
 * Solo cuenta lo cobrado: un viaje en `completed` todavía no está pagado, y
 * acreditarlo antes sería plata que no existe.
 *
 * @param {Object} trip
 * @returns {number} Variación del saldo, en COP
 */
export function getTripBalanceEffect(trip) {
    const isPaid = String(trip?.status || '').toLowerCase() === 'paid';
    if (!isPaid) return 0;

    const method = String(trip?.paymentMethod || 'cash').toLowerCase();
    const { commission, driverEarnings } = getPaymentBreakdown(trip);

    return method === 'cash' ? -commission : driverEarnings;
}
