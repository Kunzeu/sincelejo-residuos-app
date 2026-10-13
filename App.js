import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from './src/services/supabase';
import AppNavigator from './src/navigation/AppNavigator';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  async function registerForPushNotificationsAsync() {
    let token;
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      
      try {
        // En Expo Go a veces falla si no hay un projectId configurado en app.json
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('Expo Push Token:', token);
        
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase
            .from('profiles')
            .update({ push_token: token })
            .eq('id', session.user.id);
        }
      } catch (error) {
        console.log('No se pudo obtener el token Push (normal en desarrollo):', error);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }
  }

  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}
