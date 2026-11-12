// AI-assisted: see docs/AI_LOG.md #16
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useDriver } from '../../context/DriverContext';
import { useDriverLocation } from '../../hooks/useDriverLocation';
import { useTripRequests } from '../../hooks/useTripRequests';
import { calculateFare } from '../../config/pricing';

// Coordenadas iniciales por defecto (Medellín / Valle de Aburrá)
const DEFAULT_COORDS = {
  latitude: 6.2442,
  longitude: -75.5812,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

export default function HomeScreen({ navigation }) {
  const mapRef = useRef(null);

  const { driver, isAvailable, setAvailability } = useDriver();
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
  // La tarjeta con el temporizador de 15s se conecta en el siguiente paso.
  useTripRequests({
    isAvailable,
    driverId,
    category: driverCategory,
  });

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

      // Calcular tarifa de prueba con pricing.js
      const fareInfo = calculateFare({
        distanceKm: 4.8,
        durationMin: 14,
        category: driverCategory,
      });

      // Crear documento en colección 'trips'
      await addDoc(collection(db, 'trips'), {
        passengerId: 'p_demo_101',
        passengerName: 'Camila Ospina',
        origin: {
          latitude: currentLat + 0.003,
          longitude: currentLng + 0.002,
          address: 'Calle 10 #43E-12, El Poblado',
        },
        destination: {
          latitude: currentLat + 0.035,
          longitude: currentLng - 0.015,
          address: 'Carrera 43A #1-50, San Fernando Plaza',
        },
        distanceKm: 4.8,
        durationMin: 14,
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* MAPA PRINCIPAL */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={DEFAULT_COORDS}
        showsUserLocation={false}
        showsCompass={false}
        showsMyLocationButton={false}
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

      {/* BARRA SUPERIOR FLOTANTE */}
      <View style={styles.topCard}>
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

      {/* BOTONES FLOTANTES DE ACCIÓN RÁPIDA */}
      <View style={styles.floatingControls}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
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
    marginHorizontal: 16,
    marginTop: 8,
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
    bottom: 24,
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

