// AI-assisted: see docs/AI_LOG.md #3
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

/**
 * Placeholder screen for Step 1: Personal Data.
 * Will be fully implemented in Commit #9 / #10.
 */
function PersonalDataPlaceholder({ navigation }) {
  return (
    <View style={styles.screenContainer}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Paso 1 de 3</Text>
      </View>
      <Text style={styles.title}>Datos Personales</Text>
      <Text style={styles.subtitle}>
        Nombre, documento de identidad, celular, fecha de nacimiento (+18), género e idioma.
      </Text>
      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => navigation.navigate('VehicleData')}
        activeOpacity={0.8}
      >
        <Text style={styles.nextButtonText}>Siguiente: Datos del Vehículo →</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Placeholder screen for Step 2: Vehicle Data.
 * Will be fully implemented in Commit #11 / #12.
 */
function VehicleDataPlaceholder({ navigation }) {
  return (
    <View style={styles.screenContainer}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Paso 2 de 3</Text>
      </View>
      <Text style={styles.title}>Datos del Vehículo</Text>
      <Text style={styles.subtitle}>
        Categoría (Económico, XL, Premium), placa (ABC123), marca, modelo, año y capacidad.
      </Text>
      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => navigation.navigate('Documents')}
        activeOpacity={0.8}
      >
        <Text style={styles.nextButtonText}>Siguiente: Documentación →</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Placeholder screen for Step 3: Documents and Payments.
 * Will be fully implemented in Commit #13 / #15.
 */
function DocumentsPlaceholder({ navigation }) {
  return (
    <View style={styles.screenContainer}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Paso 3 de 3</Text>
      </View>
      <Text style={styles.title}>Documentación y Pagos</Text>
      <Text style={styles.subtitle}>
        Licencia de conducción, SOAT, Técnico-mecánica, cuenta de pago y aceptación de términos (20 % comisión).
      </Text>
      <TouchableOpacity
        style={[styles.nextButton, styles.disabledButton]}
        disabled={true}
        activeOpacity={0.8}
      >
        <Text style={styles.nextButtonText}>Enviar Registro (Pendiente de validar)</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Bottom Tabs Navigator for the 3-step Driver Registration flow.
 * Implements Section 2 of project specifications.
 */
export default function RegisterTabsNavigator() {
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
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
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
        component={PersonalDataPlaceholder}
        options={{
          title: 'Registro de Conductor',
          tabBarLabel: '1. Personal',
          tabBarAccessibilityLabel: 'Paso 1: Datos Personales',
        }}
      />
      <Tab.Screen
        name="VehicleData"
        component={VehicleDataPlaceholder}
        options={{
          title: 'Vehículo del Conductor',
          tabBarLabel: '2. Vehículo',
          tabBarAccessibilityLabel: 'Paso 2: Datos del Vehículo',
        }}
      />
      <Tab.Screen
        name="Documents"
        component={DocumentsPlaceholder}
        options={{
          title: 'Documentos y Pagos',
          tabBarLabel: '3. Documentos',
          tabBarAccessibilityLabel: 'Paso 3: Documentación y Pagos',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 320,
  },
  nextButton: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
