import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import MapScreen from '../screens/MapScreen';
import ReportScreen from '../screens/ReportScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminScreen from '../screens/AdminScreen';
import CommunityScreen from '../screens/CommunityScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Registro' }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Mapa de Reportes' }} />
        <Stack.Screen name="Community" component={CommunityScreen} options={{ title: 'Comunidad' }} />
        <Stack.Screen name="Report" component={ReportScreen} options={{ title: 'Nuevo Reporte' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Mi Perfil' }} />
        <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Panel de Administración' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
