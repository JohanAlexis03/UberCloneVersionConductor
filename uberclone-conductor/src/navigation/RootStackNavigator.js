// AI-assisted: see docs/AI_LOG.md #18
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RegisterTabsNavigator from './RegisterTabsNavigator';
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import { useDriver } from '../context/DriverContext';

const Stack = createNativeStackNavigator();

/**
 * Navegacion gobernada por la sesion.
 *
 * Las pantallas disponibles dependen de si hay conductor activo:
 * sin sesion solo existe el registro; con sesion solo existe la app.
 * Asi el inicio y el cierre de sesion no dependen de navegacion manual
 * (navigate / reset / popToTop), que se desincroniza cuando el estado
 * cambia por debajo.
 */
export default function RootStackNavigator() {
  const { driverId, loading } = useDriver();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {driverId ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      ) : (
        <Stack.Screen name="Register" component={RegisterTabsNavigator} />
      )}
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
