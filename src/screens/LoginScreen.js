import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { colors } from '../theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        try {
          const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
          navigation.replace(hasSeenOnboarding === 'true' ? 'Main' : 'Onboarding');
        } catch (error) {
          navigation.replace('Onboarding');
        }
      } else {
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [navigation]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Faltan datos', 'Escribe correo y contraseña.');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    } catch (error) {
      Alert.alert('No se pudo entrar', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.hero}>
        <Text style={styles.brand}>Sincelejo Limpio</Text>
        <Text style={styles.lead}>Reporta, sigue la ruta y suma eco-puntos con tu barrio.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Entrar</Text>
        <TextInput style={styles.input} placeholder="Correo" placeholderTextColor="#8aa094" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor="#8aa094" value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Iniciar sesión</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Crear una cuenta</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.greenDark },
  center: { justifyContent: 'center', alignItems: 'center' },
  hero: { flex: 1, justifyContent: 'flex-end', padding: 28 },
  brand: { color: '#fff', fontSize: 36, fontWeight: '800' },
  lead: { color: '#d7f5e5', marginTop: 8, fontSize: 16, lineHeight: 22 },
  card: { backgroundColor: colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36 },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, marginBottom: 14 },
  input: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, fontSize: 16, color: colors.ink },
  button: { backgroundColor: colors.green, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 6 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  link: { textAlign: 'center', marginTop: 16, color: colors.green, fontWeight: '800' },
});
