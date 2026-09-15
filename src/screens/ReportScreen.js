import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../services/firebase';

export default function ReportScreen({ navigation }) {
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara para reportar el problema.');
      return;
    }
    
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.3, // Reducimos la calidad para que el texto base64 no sea tan grande
      base64: true, // Solicitamos la imagen en formato base64
    });

    if (!result.canceled) {
      // Guardamos el base64 con el prefijo necesario para mostrarlo luego
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación.');
      return;
    }
    
    let loc = await Location.getCurrentPositionAsync({});
    setLocation(loc.coords);
  };

  const handleSubmit = async () => {
    if (!description || !image || !location) {
      Alert.alert('Campos incompletos', 'Por favor añade foto, ubicación y descripción.');
      return;
    }
    
    setLoading(true);
    try {
      // 2. Guardar en Firestore (Incluyendo la imagen en texto base64 directamente)
      await addDoc(collection(db, 'reports'), {
        description,
        imageUrl: image, // Ahora 'image' es el texto Base64
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        userId: auth.currentUser?.uid || 'anonymous',
        createdAt: serverTimestamp(),
        status: 'pending' // pending, in_progress, resolved
      });

      Alert.alert('Éxito', 'Reporte creado correctamente');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Hubo un problema al subir el reporte: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nuevo Reporte de Residuo</Text>
      
      <Button title="Tomar Foto" onPress={takePhoto} />
      {image && <Image source={{ uri: image }} style={styles.imagePreview} />}
      
      <View style={styles.space} />
      
      <Button title={location ? "Ubicación obtenida ✅" : "Obtener mi ubicación"} onPress={getLocation} color={location ? "green" : "#2196F3"} />
      {location && <Text style={styles.locText}>Lat: {location.latitude.toFixed(4)}, Lng: {location.longitude.toFixed(4)}</Text>}
      
      <View style={styles.space} />
      
      <TextInput 
        style={styles.input} 
        placeholder="Descripción del problema (Ej. Basura acumulada)"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />
      
      <View style={styles.space} />
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : (
        <Button title="Enviar Reporte" onPress={handleSubmit} color="#4CAF50" />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  space: { height: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, textAlignVertical: 'top' },
  imagePreview: { width: '100%', height: 200, marginTop: 10, borderRadius: 10, backgroundColor: '#eee' },
  locText: { marginTop: 5, textAlign: 'center', color: '#555' }
});
