// AI-assisted: see docs/AI_LOG.md #5
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PersonalDataScreen from '../screens/auth/PersonalDataScreen';
import VehicleDataScreen from '../screens/auth/VehicleDataScreen';
import DocumentsScreen from '../screens/auth/DocumentsScreen';
const Tab = createBottomTabNavigator();

/**
 * Bottom Tabs Navigator for the 3-step Driver Registration flow.
 * Implements Section 2 of project specifications.
 */
export default function RegisterTabsNavigator() {
  // Altura de la barra inferior del sistema (home indicator en iOS)
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="PersonalData"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#000000',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        // Oculta la barra de pestanas mientras se escribe
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="PersonalData"
        component={PersonalDataScreen}
        options={{
          title: 'Registro de Conductor',
          tabBarLabel: '1. Personal',
          tabBarAccessibilityLabel: 'Paso 1: Datos Personales',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="VehicleData"
        component={VehicleDataScreen}
        options={{
          title: 'Vehículo del Conductor',
          tabBarLabel: '2. Vehículo',
          tabBarAccessibilityLabel: 'Paso 2: Datos del Vehículo',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'car' : 'car-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{
          title: 'Documentos y Pagos',
          tabBarLabel: '3. Documentos',
          tabBarAccessibilityLabel: 'Paso 3: Documentación y Pagos',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'document-text' : 'document-text-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
