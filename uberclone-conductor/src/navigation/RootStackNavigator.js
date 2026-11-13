// AI-assisted: see docs/AI_LOG.md #28
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RegisterTabsNavigator from './RegisterTabsNavigator';
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import HistoryScreen from '../screens/main/HistoryScreen';
import TripInProgressScreen from '../screens/trip/TripInProgressScreen';
import TripPaymentScreen from '../screens/trip/TripPaymentScreen';
import { useDriver } from '../context/DriverContext';
import { useTrip } from '../context/TripContext';
import { TRIP_STATUS } from '../config/tripStatus';

const Stack = createNativeStackNavigator();

/**
 * Navegacion gobernada por el estado de la app.
 *
 * Tres escenarios, y cada uno tiene sus propias pantallas:
 * - sin sesion: solo existe el registro;
 * - con sesion y sin viaje: la app normal;
 * - con sesion y viaje activo: solo el viaje.
 *
 * Asi ni el inicio de sesion, ni el fin del viaje dependen de navegacion
 * manual (navigate / reset / popToTop), que se desincroniza cuando el
 * estado cambia por debajo.
 */
export default function RootStackNavigator() {
  const { driverId, loading } = useDriver();
  // El viaje activo manda sobre la pantalla: mientras haya uno, el
  // conductor no puede volver al inicio a recibir otra solicitud.
  const { isOnTrip, activeTrip } = useTrip();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  let screens;

  if (!driverId) {
    screens = <Stack.Screen name="Register" component={RegisterTabsNavigator} />;
  } else if (isOnTrip) {
    // El viaje termina en `completed` y lo que sigue es cobrar, no seguir
    // navegando. Por eso el escenario del viaje tiene dos pantallas: la del
    // recorrido y la del cobro. `paid` se queda en la de cobro para mostrar
    // el recibo; recién clearTrip devuelve al conductor al inicio.
    const status = activeTrip?.status;
    const isPaymentStage =
      status === TRIP_STATUS.COMPLETED || status === TRIP_STATUS.PAID;

    screens = isPaymentStage ? (
      <Stack.Screen name="TripPayment" component={TripPaymentScreen} />
    ) : (
      <Stack.Screen name="TripInProgress" component={TripInProgressScreen} />
    );
  } else {
    screens = (
      <>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {screens}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
