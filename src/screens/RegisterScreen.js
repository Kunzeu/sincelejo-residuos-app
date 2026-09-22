import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('citizen'); // 'citizen' or 'collector'

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa correo y contraseña');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Guardar el rol en Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email,
        role: role,
        ecoPoints: 0,
        createdAt: new Date()
      });

      Alert.alert('Éxito', 'Cuenta creada correctamente');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error de registro', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrar Usuario</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Correo electrónico" 
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput 
        style={styles.input} 
        placeholder="Contraseña (Mín. 6 caracteres)" 
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Text style={styles.roleTitle}>Selecciona tu Perfil:</Text>
      <View style={styles.roleContainer}>
        <TouchableOpacity 
          style={[styles.roleButton, role === 'citizen' && styles.roleActive]} 
          onPress={() => setRole('citizen')}
        >
          <Text style={[styles.roleText, role === 'citizen' && styles.roleTextActive]}>Ciudadano</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.roleButton, role === 'collector' && styles.roleActive]} 
          onPress={() => setRole('collector')}
        >
          <Text style={[styles.roleText, role === 'collector' && styles.roleTextActive]}>Recolector</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.buttonContainer}>
        <Button title="Registrarse" onPress={handleRegister} color="#16a34a" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f0fdf4' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#166534' },
  input: { borderWidth: 1, borderColor: '#bbf7d0', backgroundColor: '#fff', padding: 15, marginBottom: 15, borderRadius: 10 },
  roleTitle: { textAlign: 'center', marginBottom: 10, color: '#15803d', fontWeight: 'bold' },
  roleContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  roleButton: { paddingVertical: 10, paddingHorizontal: 20, borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 20, marginHorizontal: 5, backgroundColor: '#fff' },
  roleActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  roleText: { color: '#666', fontWeight: 'bold' },
  roleTextActive: { color: '#fff' },
  buttonContainer: { borderRadius: 10, overflow: 'hidden' }
});
