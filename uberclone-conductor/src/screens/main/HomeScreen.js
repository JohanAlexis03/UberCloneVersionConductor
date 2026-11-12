// AI-assisted: see docs/AI_LOG.md #23
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useDriver } from '../../context/DriverContext';
import { useTrip } from '../../context/TripContext';
import { useDriverLocation } from '../../hooks/useDriverLocation';
import { useTripRequests } from '../../hooks/useTripRequests';
import IncomingRequestScreen from '../trip/IncomingRequestScreen';
import { calculateFare } from '../../config/pricing';
import { fetchRoadRoute } from '../../services/routing';
import { haversineKm } from '../../utils/geo';
import { pickSimulatedTrip } from '../../utils/simulator';

/**
 * Texto de dirección de un punto, obtenido de SUS coordenadas.
 *
 * El simulador escribía direcciones de barrios inventados mientras las
 * coordenadas eran otras, así que la tarjeta mostraba una dirección que no
 * existía en ese lugar. Con geocodificación inversa la dirección y el punto
 * son el mismo dato.
 *
 * @param {{latitude: number, longitude: number}} point
 * @param {string|null} [fallbackLabel] - Nombre del lugar, si el punto viene
 *   del catálogo del simulador. Solo se usa si la geocodificación falla.
 * @returns {Promise<string>}
 */
async function describePoint(point, fallbackLabel) {
  const fallback = fallbackLabel || 'Dirección no disponible';

  try {
    const results = await Location.reverseGeocodeAsync(point);
    const place = results?.[0];
    if (!place) return fallback;

    // En Android llega armada; en iOS se compone con las partes
    if (place.formattedAddress) return place.formattedAddress;

    const streetLine = [place.street, place.streetNumber].filter(Boolean).join(' ');
    const zone = place.district || place.subregion || place.city;
    const composed = [streetLine, zone].filter(Boolean).join(', ');

    return composed || place.name || fallback;
  } catch (error) {
    console.warn('No se pudo obtener la dirección del punto:', error.message);
    return fallback;
  }
}

// Coordenadas iniciales por defecto (Medellín / Valle de Aburrá)
const DEFAULT_COORDS = {
  latitude: 6.2442,
  longitude: -75.5812,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

export default function HomeScreen({ navigation }) {
  const mapRef = useRef(null);
  // Zonas seguras reales del dispositivo (notch arriba, indicador de inicio abajo)
  const insets = useSafeAreaInsets();

  const { driver, isAvailable, setAvailability } = useDriver();
  // El viaje activo manda: si hay uno en curso, no se escuchan solicitudes
  const { isOnTrip, startTrip } = useTrip();
  const driverId = driver?.personalData?.idNumber || null;
  const driverName = driver?.personalData?.fullName || 'Conductor';
  const driverCategory = driver?.vehicleData?.category || 'economy';
  const isPending = !driver || driver.status === 'pending';

  // Modal para explicar bloqueo en estado pending
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Hook 1: GPS continuo condicionado a la disponibilidad
  const { location, heading, errorMsg } = useDriverLocation({
    isAvailable,
    driverId,
  });

  // Hook 2: Solicitudes de viaje en tiempo real.
  // El hook trae la solicitud y su temporizador; la vista solo los dibuja.
  const {
    incomingTrip,
    timeLeft,
    acceptTrip,
    rejectTrip,
    loading: acceptingTrip,
  } = useTripRequests({
    isAvailable,
    driverId,
    category: driverCategory,
    busy: isOnTrip,
  });

  // Aceptar la solicitud: el hook confirma en Firestore y el contexto
  // toma el control del viaje para el resto del flujo
  const handleAcceptTrip = useCallback(
    async (tripId) => {
      const accepted = await acceptTrip(tripId);
      if (accepted) {
        startTrip(tripId);
      }
      return accepted;
    },
    [acceptTrip, startTrip]
  );

  // Centrar mapa al recibir la primera posición GPS
  useEffect(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        },
        1000
      );
    }
  }, [location?.latitude, location?.longitude]);

  // Manejador del Switch con regla de negocio
  const handleToggleAvailability = async () => {
    if (!isAvailable && isPending) {
      // Bloqueo de negocio: cuenta en estado pending
      setShowPendingModal(true);
      return;
    }

    const nextState = !isAvailable;
    const result = await setAvailability(nextState);

    if (!result.success && result.reason === 'pending') {
      setShowPendingModal(true);
    }
  };

  // Botón para recentrar mapa en el conductor
  const handleRecenter = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        },
        800
      );
    }
  };

  // Simulador de carrera entrante para pruebas en desarrollo
  const handleSimulateRequest = async () => {
    // El boton ya esta deshabilitado en la interfaz cuando el conductor
    // esta desconectado; este corte es solo una segunda barrera.
    if (!isAvailable) return;

    setSimulating(true);
    try {
      const currentLat = location?.latitude || DEFAULT_COORDS.latitude;
      const currentLng = location?.longitude || DEFAULT_COORDS.longitude;

      const driverPoint = { latitude: currentLat, longitude: currentLng };

      // La carrera sale de un catálogo de lugares que existen: la recogida es
      // el lugar real más cercano al conductor y el destino otro lugar del
      // área metropolitana. Antes se sumaban grados a la posición actual y se
      // escribía una dirección de barrio fija, que no correspondía al punto.
      const simulated = pickSimulatedTrip(driverPoint);
      const requestedOrigin = simulated.origin;
      const requestedDestination = simulated.destination;

      // Trazado real por calles. OSRM devuelve cientos de puntos, que es lo
      // que permite dibujar el recorrido y no una linea recta entre dos
      // coordenadas. Si el servicio no responde, queda el respaldo recto.
      const tripRoute = await fetchRoadRoute(requestedOrigin, requestedDestination);

      // OSRM pega el punto pedido a la via mas cercana, asi que el primer y
      // el ultimo punto de la ruta son la recogida y el destino REALES.
      // Se guardan esos, no los pedidos: si el marcador se dibujara en un
      // punto y la ruta terminara en otro, la direccion de pantalla no
      // corresponderia al trazado y quedaria un hueco en el mapa.
      const origin = tripRoute ? tripRoute.coordinates[0] : requestedOrigin;
      const destination = tripRoute
        ? tripRoute.coordinates[tripRoute.coordinates.length - 1]
        : requestedDestination;

      // El tramo de recogida termina exactamente en el punto anterior
      const pickupRoute = await fetchRoadRoute(driverPoint, origin);

      // La distancia y la duracion salen de la ruta, no de numeros fijos:
      // si el mapa dibuja un recorrido de 5.6 km, la tarifa debe ser de 5.6 km.
      const straightKm = Math.round(haversineKm(origin, destination) * 10) / 10;
      const distanceKm = tripRoute ? tripRoute.distanceKm : straightKm;

      // Sin ruta real no inventamos duracion: la tarifa se calcula solo con
      // la base y los kilometros, que si son datos medidos.
      const durationMin = tripRoute ? tripRoute.durationMin : 0;

      const fareInfo = calculateFare({
        distanceKm,
        durationMin,
        category: driverCategory,
      });

      // Las direcciones se obtienen de las coordenadas de cada punto, una
      // detras de otra: geocodificar en paralelo satura el servicio.
      const originAddress = await describePoint(origin, requestedOrigin.name);
      const destinationAddress = await describePoint(destination, requestedDestination.name);

      // Crear documento en colección 'trips'
      // origin y destination usan lat/lng, como define el esquema del spec.
      await addDoc(collection(db, 'trips'), {
        passengerId: 'p_demo_101',
        passengerName: 'Camila Ospina',
        origin: {
          lat: origin.latitude,
          lng: origin.longitude,
          address: originAddress,
        },
        destination: {
          lat: destination.latitude,
          lng: destination.longitude,
          address: destinationAddress,
        },
        // Trazado de ida y de recogida, guardado con el viaje para que la
        // pantalla del viaje lo dibuje sin volver a pedirlo.
        routeCoordinates: tripRoute ? tripRoute.coordinates : [origin, destination],
        pickupRouteCoordinates: pickupRoute ? pickupRoute.coordinates : [driverPoint, origin],
        distanceKm,
        durationMin,
        category: driverCategory,
        fare: fareInfo.fare,
        commission: fareInfo.commission,
        tip: 0,
        driverEarnings: fareInfo.driverEarnings,
        commissionRate: fareInfo.commissionRate,
        paymentMethod: 'cash',
        paymentStatus: 'pending',
        status: 'requested',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Error al simular carrera:', err.message);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* MAPA PRINCIPAL: ocupa toda la pantalla, incluso bajo el notch */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={DEFAULT_COORDS}
        showsUserLocation={false}
        showsCompass={false}
        showsMyLocationButton={false}
        loadingEnabled
        loadingBackgroundColor="#FFFFFF"
        loadingIndicatorColor="#111827"
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={driverName}
            rotation={heading}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
          >
            <View style={styles.carMarker}>
              <Ionicons name="car" size={24} color="#FFFFFF" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* BARRA SUPERIOR FLOTANTE: baja por debajo del notch con el inset real */}
      <View style={[styles.topCard, { top: insets.top + 8 }]}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            <Ionicons name="person-circle" size={38} color="#111827" />
            <View style={styles.nameContainer}>
              <Text style={styles.greetingText}>Hola,</Text>
              <Text style={styles.driverNameText} numberOfLines={1}>
                {driverName.split(' ')[0]}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Switch de Disponibilidad */}
          <View style={styles.switchContainer}>
            <View
              style={[
                styles.statusDot,
                isAvailable ? styles.dotOnline : styles.dotOffline,
              ]}
            />
            <Text style={styles.switchLabel}>
              {isAvailable ? 'En línea' : 'Desconectado'}
            </Text>
            <Switch
              value={isAvailable}
              onValueChange={handleToggleAvailability}
              trackColor={{ false: '#D1D5DB', true: '#16A34A' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Banner informativo de estado si está pending */}
        {isPending && (
          <TouchableOpacity
            style={styles.pendingBanner}
            onPress={() => setShowPendingModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="alert-circle" size={18} color="#B45309" />
            <Text style={styles.pendingBannerText}>
              Cuenta en revisión. Disponibilidad bloqueada.
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#B45309" />
          </TouchableOpacity>
        )}

        {errorMsg && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={16} color="#DC2626" />
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
          </View>
        )}
      </View>

      {/* BOTONES FLOTANTES: se elevan por encima del indicador de inicio */}
      <View style={[styles.floatingControls, { bottom: insets.bottom + 16 }]}>
        {/* Botón Recentrar */}
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={handleRecenter}
          activeOpacity={0.8}
        >
          <Ionicons name="locate" size={24} color="#111827" />
        </TouchableOpacity>

        {/* Botón Simular Solicitud (para testing) */}
        <TouchableOpacity
          style={[styles.simulateBtn, !isAvailable && styles.simulateBtnDisabled]}
          onPress={handleSimulateRequest}
          disabled={!isAvailable || simulating}
          activeOpacity={0.8}
        >
          {simulating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="flash" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.simulateBtnText}>Simular Carrera</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* MODAL: EXPLICACIÓN DE BLOQUEO POR ESTADO PENDING */}
      <Modal
        visible={showPendingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPendingModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Ionicons name="time" size={38} color="#D97706" />
            </View>
            <Text style={styles.modalTitle}>Verificación en Proceso</Text>
            <Text style={styles.modalDesc}>
              Tus documentos y datos de vehículo fueron enviados y están siendo revisados por nuestro equipo administrativo.
            </Text>
            <Text style={styles.modalSubDesc}>
              Por políticas de seguridad y cumplimiento legal en Colombia, no puedes recibir viajes ni ponerte en línea hasta que tu perfil esté en estado aprobado.
            </Text>

            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setShowPendingModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalBtnText}>Entendido</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalLinkBtn}
              onPress={() => {
                setShowPendingModal(false);
                navigation.navigate('Profile');
              }}
            >
              <Text style={styles.modalLinkText}>Consultar mi Perfil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* TARJETA DE SOLICITUD ENTRANTE (se rechaza sola a los 15s) */}
      <IncomingRequestScreen
        trip={incomingTrip}
        timeLeft={timeLeft}
        accepting={acceptingTrip}
        onAccept={handleAcceptTrip}
        onReject={rejectTrip}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  map: {
    flex: 1,
  },
  carMarker: {
    backgroundColor: '#000000',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  topCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    elevation: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nameContainer: {
    marginLeft: 8,
  },
  greetingText: {
    fontSize: 12,
    color: '#6B7280',
  },
  driverNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dotOnline: {
    backgroundColor: '#16A34A',
  },
  dotOffline: {
    backgroundColor: '#9CA3AF',
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    marginLeft: 6,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
  },
  errorBannerText: {
    fontSize: 12,
    color: '#DC2626',
    marginLeft: 6,
  },
  floatingControls: {
    position: 'absolute',
    right: 16,
    left: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  circleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  simulateBtnDisabled: {
    backgroundColor: '#6B7280',
    opacity: 0.7,
  },
  simulateBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
  },
  modalIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  modalSubDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalBtn: {
    width: '100%',
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalLinkBtn: {
    paddingVertical: 8,
  },
  modalLinkText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

