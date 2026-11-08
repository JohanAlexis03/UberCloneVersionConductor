// AI-assisted: see docs/AI_LOG.md #11
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RegisterTabsNavigator from './RegisterTabsNavigator';
import ProfileScreen from '../screens/main/ProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function RootStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Register"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Register" component={RegisterTabsNavigator} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

