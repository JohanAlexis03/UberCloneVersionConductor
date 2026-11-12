// AI-assisted: see docs/AI_LOG.md #20

/**
 * Estados oficiales de un viaje y transiciones permitidas.
 *
 * Modulo puro: no toca React ni Firestore. Se puede razonar (y probar)
 * sin montar la app, y es la unica fuente de verdad sobre que movimientos
 * son legales en la maquina de estados.
 */

export const TRIP_STATUS = {
    REQUESTED: 'requested',
    ACCEPTED: 'accepted',
    DRIVER_ARRIVING: 'driver_arriving',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    PAID: 'paid',
    CANCELLED: 'cancelled',
    REJECTED: 'rejected',
};

/**
 * Que estado puede seguir a cual.
 *
 * Regla del negocio: un viaje solo se cancela ANTES de que el pasajero
 * este a bordo (in_progress). Una vez el pasajero sube, el unico final
 * posible es completar el viaje.
 */
export const ALLOWED_TRANSITIONS = {
    requested: ['accepted', 'rejected', 'cancelled'],
    accepted: ['driver_arriving', 'cancelled'],
    driver_arriving: ['in_progress', 'cancelled'],
    in_progress: ['completed'],
    completed: ['paid'],
    paid: [],
    cancelled: [],
    rejected: [],
};

// Camino feliz del viaje, en orden. Lo usa la pantalla para saber cual
// es el "siguiente paso" que ofrece el boton principal.
export const TRIP_FLOW = [
    TRIP_STATUS.ACCEPTED,
    TRIP_STATUS.DRIVER_ARRIVING,
    TRIP_STATUS.IN_PROGRESS,
    TRIP_STATUS.COMPLETED,
    TRIP_STATUS.PAID,
];

// Texto que ve el conductor para cada estado
export const STATUS_LABELS = {
    requested: 'Solicitud recibida',
    accepted: 'Viaje aceptado',
    driver_arriving: 'En camino al pasajero',
    in_progress: 'Viaje en curso',
    completed: 'Viaje completado',
    paid: 'Pago confirmado',
    cancelled: 'Viaje cancelado',
    rejected: 'Viaje rechazado',
};

// Texto del boton que dispara la siguiente accion del camino feliz
export const NEXT_ACTION_LABELS = {
    accepted: 'Ir a recoger al pasajero',
    driver_arriving: 'El pasajero subió',
    in_progress: 'Terminar viaje',
    completed: 'Confirmar pago',
};

/**
 * @param {string} from - Estado actual del viaje
 * @param {string} to - Estado al que se quiere pasar
 * @returns {boolean} true si la transicion es legal
 */
export function canTransitionTo(from, to) {
    const allowed = ALLOWED_TRANSITIONS[from];
    if (!allowed) return false;
    return allowed.includes(to);
}

/**
 * Siguiente estado del camino feliz, o null si ya no hay a donde ir.
 * @param {string} current
 * @returns {string|null}
 */
export function nextFlowStatus(current) {
    const index = TRIP_FLOW.indexOf(current);
    if (index === -1 || index === TRIP_FLOW.length - 1) return null;
    return TRIP_FLOW[index + 1];
}

/**
 * @param {string} status
 * @returns {string} Texto legible, con el valor crudo como respaldo
 */
export function getStatusLabel(status) {
    return STATUS_LABELS[status] || status;
}
