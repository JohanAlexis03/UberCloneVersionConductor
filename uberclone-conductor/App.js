// AI-assisted: see docs/AI_LOG.md #11
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootStackNavigator from './src/navigation/RootStackNavigator';
import { RegistrationProvider } from './src/context/DriverRegistrationContext';
import { DriverProvider } from './src/context/DriverContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <DriverProvider>
        <RegistrationProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <RootStackNavigator />
          </NavigationContainer>
        </RegistrationProvider>
      </DriverProvider>
    </SafeAreaProvider>
  );
}
