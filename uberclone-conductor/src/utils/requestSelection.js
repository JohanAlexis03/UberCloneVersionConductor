// AI-assisted: see docs/AI_LOG.md #21

/**
 * Reglas puras para decidir qué solicitud se le muestra al conductor.
 *
 * Vive fuera del hook a propósito: así se puede probar sin montar React,
 * sin Firestore y sin relojes. El hook solo aplica la regla.
 */

/**
 * Fecha de creación de un viaje, en milisegundos.
 *
 * `createdAt` es un Timestamp de Firestore, pero un viaje recién escrito
 * todavía puede traerlo en `null` mientras el servidor resuelve
 * `serverTimestamp()`. Ese caso se trata como el más nuevo: si no, la
 * solicitud que acaba de entrar se ordenaría al final y perdería contra
 * una vieja que quedó abierta.
 *
 * @param {Object} trip
 * @returns {number}
 */
function createdAtMillis(trip) {
    const value = trip?.createdAt;
    if (value && typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value === 'number') return value;
    return Number.MAX_SAFE_INTEGER;
}

/**
 * Elige la solicitud que debe ver el conductor.
 *
 * Firestore devuelve los documentos en orden de ID, y ese ID lo genera el
 * cliente: llegan en orden arbitrario, no cronológico. Sin ordenar, con dos
 * solicitudes abiertas la tarjeta mostraba cualquiera, y la que el pasajero
 * acababa de pedir podía quedar escondida detrás de una vieja.
 *
 * @param {Array<Object>} trips - Documentos en estado 'requested'
 * @param {string} driverId - Cédula del conductor
 * @returns {Object|null} La solicitud más reciente, o null si no hay
 */
export function pickNewestRequest(trips, driverId) {
    if (!Array.isArray(trips) || trips.length === 0) return null;

    const available = trips.filter(
        (trip) => trip.rejectedByDriverId !== driverId
    );
    if (available.length === 0) return null;

    return available.reduce((newest, trip) =>
        createdAtMillis(trip) > createdAtMillis(newest) ? trip : newest
    );
}
