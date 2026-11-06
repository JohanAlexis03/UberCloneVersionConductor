import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import RegisterTabsNavigator from './src/navigation/RegisterTabsNavigator';
import { RegistrationProvider } from './src/context/DriverRegistrationContext';

export default function App() {
  return (
    <RegistrationProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <RegisterTabsNavigator />
      </NavigationContainer>
    </RegistrationProvider>
  );
};