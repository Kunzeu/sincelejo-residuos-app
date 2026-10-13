import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase';
import { colors } from '../theme';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('citizen');
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Faltan datos', 'Escribe correo y contraseña.');
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { role } },
      });
      if (error) throw error;
      if (!data.session) {
        Alert.alert('Confirma tu correo', 'Abre el enlace que te enviamos y después inicia sesión.', [
          { text: 'Ir a iniciar sesión', onPress: () => navigation.goBack() },
        ]);
        return;
      }
      Alert.alert('Listo', 'Cuenta creada.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('No se pudo registrar', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Crear cuenta</Text>
      <Text style={styles.subtitle}>Elige si vas a reportar o a recoger.</Text>
      <TextInput style={styles.input} placeholder="Correo" placeholderTextColor="#8aa094" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Contraseña, mínimo 6 caracteres" placeholderTextColor="#8aa094" value={password} onChangeText={setPassword} secureTextEntry />
      <View style={styles.roles}>
        <Role label="Ciudadano" active={role === 'citizen'} onPress={() => setRole('citizen')} />
        <Role label="Recolector" active={role === 'collector'} onPress={() => setRole('collector')} />
      </View>
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Registrarme</Text>}
      </TouchableOpacity>
    </View>
  );
}

function Role({ label, active, onPress }) {
  return (
    <TouchableOpacity style={[styles.role, active && styles.roleOn]} onPress={onPress}>
      <Text style={[styles.roleText, active && styles.roleTextOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 20 },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink, marginTop: 12 },
  subtitle: { color: colors.muted, marginTop: 6, marginBottom: 18 },
  input: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, fontSize: 16, color: colors.ink },
  roles: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  role: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: colors.line },
  roleOn: { backgroundColor: colors.green, borderColor: colors.green },
  roleText: { fontWeight: '800', color: colors.muted },
  roleTextOn: { color: '#fff' },
  button: { backgroundColor: colors.green, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
