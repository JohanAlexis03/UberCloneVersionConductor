// AI-assisted: see docs/AI_LOG.md #22

/**
 * Utilidades de coordenadas para el mapa.
 *
 * Módulo puro: no importa React ni react-native-maps, así que se puede
 * probar con Node sin montar la aplicación.
 */

/**
 * Normaliza un punto del viaje a la forma que entiende react-native-maps.
 *
 * El esquema de docs/PROMPT_MAESTRO.md usa `lat` / `lng`, pero el simulador
 * escribe `latitude` / `longitude`. Aceptamos las dos formas para que el
 * mapa funcione con los viajes viejos y con los nuevos, sin depender de
 * cuál de las dos gane.
 *
 * @param {Object|null} point
 * @returns {{latitude: number, longitude: number}|null} null si el punto no sirve
 */
export function toLatLng(point) {
    if (!point) return null;

    const latitude = typeof point.latitude === 'number' ? point.latitude : point.lat;
    const longitude = typeof point.longitude === 'number' ? point.longitude : point.lng;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;
    return { latitude, longitude };
}

/**
 * Construye las coordenadas que se dibujan con <Polyline />.
 *
 * Si el viaje trae `routeCoordinates` se usa tal cual, porque es el trazado
 * real por calles. Si no lo trae (documentos viejos, o viajes creados antes
 * del commit que lo genera), se une origen y destino en línea recta: es una
 * aproximación, pero deja la ruta visible en vez de un mapa vacío.
 *
 * @param {Array<Object>|undefined} stored - routeCoordinates del viaje
 * @param {Object|null} origin - Punto de recogida ya normalizado
 * @param {Object|null} destination - Destino ya normalizado
 * @returns {Array<{latitude: number, longitude: number}>}
 */
export function buildRouteCoordinates(stored, origin, destination) {
    const points = Array.isArray(stored)
        ? stored.map(toLatLng).filter(Boolean)
        : [];

    if (points.length >= 2) return points;

    return [origin, destination].filter(Boolean);
}

/**
 * Convierte la respuesta de OSRM al formato que come el mapa.
 *
 * OJO CON EL ORDEN: OSRM responde cada punto como `[longitud, latitud]`.
 * Si se copia tal cual a `coordinates` del `<Polyline />`, la ruta aparece
 * en el océano o en otro continente. Es el error clásico de esta API.
 *
 * OJO CON LOS EXTREMOS: OSRM pega el punto pedido a la vía más cercana, así
 * que el primer y el último punto de la geometría son los puntos REALES de la
 * ruta. Hay que guardar esos, no los pedidos: si el marcador se dibuja en el
 * punto pedido y la ruta en el punto pegado, quedan separados y la dirección
 * de pantalla no corresponde al trazado.
 *
 * @param {Object} data - Respuesta cruda de /route/v1/driving
 * @returns {{coordinates: Array<Object>, distanceKm: number, durationMin: number}|null}
 */
export function routeFromOsrm(data) {
    const route = data?.routes?.[0];
    const points = route?.geometry?.coordinates;

    if (!Array.isArray(points) || points.length < 2) return null;

    // Cada punto llega como [longitud, latitud]: se invierte al normalizar.
    // Se valida antes de desestructurar porque un punto nulo revienta el map.
    const coordinates = points
        .map((point) =>
            Array.isArray(point) && point.length >= 2
                ? toLatLng({ lat: point[1], lng: point[0] })
                : null
        )
        .filter(Boolean);

    if (coordinates.length < 2) return null;

    return {
        coordinates,
        distanceKm: Math.round((route.distance / 1000) * 10) / 10,
        durationMin: Math.round(route.duration / 60),
    };
}

/**
 * Distancia en línea recta entre dos puntos, en kilómetros.
 *
 * Es solo el respaldo cuando no hay ruta por calles: sirve para que la
 * tarifa no se calcule sobre un número inventado.
 *
 * @param {Object|null} from
 * @param {Object|null} to
 * @returns {number}
 */
export function haversineKm(from, to) {
    if (!from || !to) return 0;

    const EARTH_RADIUS_KM = 6371;
    const toRadians = (degrees) => (degrees * Math.PI) / 180;

    const deltaLat = toRadians(to.latitude - from.latitude);
    const deltaLng = toRadians(to.longitude - from.longitude);

    const a =
        Math.sin(deltaLat / 2) ** 2 +
        Math.cos(toRadians(from.latitude)) *
            Math.cos(toRadians(to.latitude)) *
            Math.sin(deltaLng / 2) ** 2;

    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}
