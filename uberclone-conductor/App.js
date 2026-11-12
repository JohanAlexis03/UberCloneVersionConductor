// AI-assisted: see docs/AI_LOG.md #20
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootStackNavigator from './src/navigation/RootStackNavigator';
import { RegistrationProvider } from './src/context/DriverRegistrationContext';
import { DriverProvider } from './src/context/DriverContext';
import { TripProvider } from './src/context/TripContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <DriverProvider>
        <TripProvider>
          <RegistrationProvider>
            <NavigationContainer>
              <StatusBar style="light" />
              <RootStackNavigator />
            </NavigationContainer>
          </RegistrationProvider>
        </TripProvider>
      </DriverProvider>
    </SafeAreaProvider>
  );
}
