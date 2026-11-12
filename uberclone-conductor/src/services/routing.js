// AI-assisted: see docs/AI_LOG.md #22
import { routeFromOsrm } from '../utils/geo';

/**
 * Cliente de rutas por calles.
 *
 * OSRM es la alternativa libre que el propio spec autoriza (línea 201) para
 * no gastar el cupo de Google Directions. A diferencia de unir dos puntos,
 * devuelve la geometría completa del recorrido: cientos de coordenadas que
 * siguen las calles reales.
 *
 * La conversión de coordenadas vive en utils/geo.js porque OSRM responde
 * [longitud, latitud] y el mapa necesita { latitude, longitude }.
 */

const OSRM_BASE_URL = 'https://router.project-osrm.org';
const REQUEST_TIMEOUT_MS = 8000;

/**
 * Traza la ruta por calles entre dos puntos.
 *
 * Nunca lanza: si no hay red, si el servidor falla o si tarda demasiado,
 * devuelve null y quien llama decide el respaldo. Un simulador de pruebas
 * no debe romperse porque un servicio externo no respondió.
 *
 * @param {{latitude: number, longitude: number}} from
 * @param {{latitude: number, longitude: number}} to
 * @returns {Promise<{
 *   coordinates: Array<{latitude: number, longitude: number}>,
 *   distanceKm: number,
 *   durationMin: number
 * }|null>}
 */
export async function fetchRoadRoute(from, to) {
    if (!from || !to) return null;

    // OSRM espera "longitud,latitud" y separa los puntos con punto y coma
    const points = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
    const url = `${OSRM_BASE_URL}/route/v1/driving/${points}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) return null;

        const data = await response.json();
        return routeFromOsrm(data);
    } catch (error) {
        console.warn('No se pudo trazar la ruta por calles:', error.message);
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}
