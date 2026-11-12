// AI-assisted: see docs/AI_LOG.md #23
import { haversineKm } from './geo';

/**
 * Generador de carreras simuladas para probar la app en Expo Go.
 *
 * El simulador anterior inventaba todo: sumaba grados a la posición del
 * conductor, escribía una dirección de barrio fija y ponía distancia y
 * duración constantes. El resultado era un viaje con dirección falsa, tarifa
 * falsa y un punto que podía caer en una zona sin calles mapeadas.
 *
 * Acá los puntos salen de un catálogo de lugares que existen, con coordenadas
 * verificadas contra OpenStreetMap (Nominatim). La ruta y la dirección se
 * calculan después desde esas coordenadas, así que el pin, la dirección en
 * pantalla y el trazado son el mismo dato.
 */

/**
 * Lugares reales del área metropolitana de Medellín.
 *
 * Coordenadas consultadas en Nominatim (openstreetmap.org) y verificadas
 * contra OSRM: todas quedan a menos de 130 m de una vía para vehículo.
 * El `name` solo se usa como respaldo de la dirección si la geocodificación
 * inversa falla; la dirección real se obtiene de la coordenada.
 */
export const SIMULATED_PLACES = [
    {
        id: 'santafe',
        name: 'Centro Comercial Santafé',
        latitude: 6.1964218,
        longitude: -75.5738748,
    },
    {
        id: 'laureles',
        name: 'Primer Parque de Laureles',
        latitude: 6.2459659,
        longitude: -75.5934622,
    },
    {
        id: 'plaza-botero',
        name: 'Plaza Botero',
        latitude: 6.2518468,
        longitude: -75.5686386,
    },
    {
        id: 'belen',
        name: 'Parque de Belén',
        latitude: 6.2324771,
        longitude: -75.5966721,
    },
    {
        id: 'sabaneta',
        name: 'Parque Principal de Sabaneta',
        latitude: 6.1515736,
        longitude: -75.6154278,
    },
    {
        id: 'bello',
        name: 'Parque Principal de Bello',
        latitude: 6.3349881,
        longitude: -75.5582772,
    },
    {
        id: 'unicentro',
        name: 'Unicentro Medellín',
        latitude: 6.2408625,
        longitude: -75.587071,
    },
    {
        id: 'olaya-herrera',
        name: 'Aeropuerto Olaya Herrera',
        latitude: 6.2200225,
        longitude: -75.5890373,
    },
    {
        id: 'industriales',
        name: 'Estación Industriales',
        latitude: 6.230205,
        longitude: -75.5744065,
    },
    {
        id: 'envigado',
        name: 'Parque de Envigado',
        latitude: 6.170119,
        longitude: -75.5874231,
    },
];

/**
 * Si el conductor está más lejos que esto de todos los lugares del catálogo,
 * no tiene sentido mandarle una recogida a Medellín: se usa su propia
 * posición. Pasa al probar la app fuera del área metropolitana.
 */
const MAX_PICKUP_DISTANCE_KM = 30;

/**
 * Distancia mínima entre recogida y destino. Sin este piso, dos lugares del
 * mismo barrio generarían una carrera de 900 metros con tarifa mínima.
 */
const MIN_TRIP_DISTANCE_KM = 2;

/**
 * Lugar del catálogo más cercano a un punto.
 *
 * @param {{latitude: number, longitude: number}} point
 * @returns {{id: string, name: string, latitude: number, longitude: number}|null}
 */
export function findNearestPlace(point) {
    if (!point) return null;

    let nearest = null;
    let shortest = Infinity;

    for (const place of SIMULATED_PLACES) {
        const distanceKm = haversineKm(point, place);
        if (distanceKm < shortest) {
            shortest = distanceKm;
            nearest = place;
        }
    }

    return nearest;
}

/**
 * Construye una carrera simulada creíble alrededor del conductor.
 *
 * La recogida es el lugar real más cercano a él, así que la distancia del
 * tramo de recogida es la que de verdad tiene que manejar. El destino es otro
 * lugar del catálogo, sorteado para que cada prueba sea distinta.
 *
 * `random` se recibe como parámetro para poder probar la función con valores
 * fijos: con Math.random dentro, el resultado no se podría verificar.
 *
 * @param {{latitude: number, longitude: number}} driverPoint - Posición actual
 * @param {() => number} [random] - Fuente de aleatoriedad, por defecto Math.random
 * @returns {{
 *   origin: {latitude: number, longitude: number, name: string|null},
 *   destination: {latitude: number, longitude: number, name: string|null}
 * }}
 */
export function pickSimulatedTrip(driverPoint, random = Math.random) {
    const nearest = findNearestPlace(driverPoint);
    const nearestDistanceKm = nearest ? haversineKm(driverPoint, nearest) : Infinity;
    const originIsPlace = Boolean(nearest) && nearestDistanceKm <= MAX_PICKUP_DISTANCE_KM;

    // Conductor fuera del área metropolitana: se recoge donde está.
    const origin = originIsPlace
        ? {
              latitude: nearest.latitude,
              longitude: nearest.longitude,
              name: nearest.name,
          }
        : {
              latitude: driverPoint.latitude,
              longitude: driverPoint.longitude,
              name: null,
          };

    // Destinos posibles: cualquier lugar que no sea la recogida y que quede
    // a una distancia de carrera razonable. Si la recogida es el propio
    // conductor, el lugar más cercano también sirve como destino.
    const differentPlaces = originIsPlace
        ? SIMULATED_PLACES.filter((place) => place.id !== nearest.id)
        : SIMULATED_PLACES;
    const farEnough = differentPlaces.filter(
        (place) => haversineKm(origin, place) >= MIN_TRIP_DISTANCE_KM
    );
    const candidates = farEnough.length > 0 ? farEnough : differentPlaces;

    // Math.min protege el índice si `random` devolviera exactamente 1.
    const index = Math.min(Math.floor(random() * candidates.length), candidates.length - 1);
    const chosen = candidates[index];

    return {
        origin,
        destination: {
            latitude: chosen.latitude,
            longitude: chosen.longitude,
            name: chosen.name,
        },
    };
}
