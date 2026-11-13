// AI-assisted: see docs/AI_LOG.md #30
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import HistoryScreen from '../screens/main/HistoryScreen';
import EarningsScreen from '../screens/main/EarningsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

const Drawer = createDrawerNavigator();

/**
 * Menú principal del conductor con Drawer Navigator (Sección 1 de PROMPT_MAESTRO):
 * 1. Inicio (Mapa)
 * 2. Mi Perfil
 * 3. Historial de Carreras
 * 4. Mis Ganancias
 * 5. Ajustes
 */
export default function MainDrawerNavigator() {
    return (
        <Drawer.Navigator
            initialRouteName="Home"
            screenOptions={{
                headerShown: false,
                drawerActiveTintColor: '#111827',
                drawerActiveBackgroundColor: '#F3F4F6',
                drawerInactiveTintColor: '#4B5563',
                drawerLabelStyle: {
                    fontSize: 14,
                    fontWeight: '600',
                },
                drawerStyle: {
                    backgroundColor: '#FFFFFF',
                    width: 270,
                },
            }}
        >
            <Drawer.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    title: 'Inicio (Mapa)',
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="map-outline" size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    title: 'Mi Perfil',
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="History"
                component={HistoryScreen}
                options={{
                    title: 'Historial de Carreras',
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="time-outline" size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Earnings"
                component={EarningsScreen}
                options={{
                    title: 'Mis Ganancias',
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="wallet-outline" size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    title: 'Ajustes',
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="settings-outline" size={size} color={color} />
                    ),
                }}
            />
        </Drawer.Navigator>
    );
}
