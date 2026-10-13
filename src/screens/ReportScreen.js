import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Image, Alert, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { colors } from '../theme';
import { CATEGORIES } from '../utils/reports';
import { createReport, loadSessionProfile } from '../services/reportsApi';

export default function ReportScreen({ navigation }) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cámara', 'Necesitamos permiso para tomar la evidencia.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.3,
      base64: true,
    });
    if (!result.canceled) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.3,
      base64: true,
    });
    if (!result.canceled) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ubicación', 'Necesitamos tu ubicación para marcar el punto.');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setLocation(loc.coords);
  };

  const handleSubmit = async () => {
    if (!description || !image || !location) {
      Alert.alert('Incompleto', 'Agrega foto, ubicación y una descripción.');
      return;
    }
    setLoading(true);
    try {
      const { user } = await loadSessionProfile();
      if (!user) {
        Alert.alert('Sesión', 'Inicia sesión para enviar un reporte.');
        return;
      }
      await createReport({
        description: description.trim(),
        category,
        image_url: image,
        latitude: location.latitude,
        longitude: location.longitude,
        user_id: user.id,
        status: 'pending',
      });
      Alert.alert('Enviado', 'Tu reporte ya está en el mapa de la ciudad.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('No se pudo enviar', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.lead}>Elige el tipo de residuo, toma la evidencia y marca el punto.</Text>
      <Text style={styles.label}>Tipo</Text>
      <View style={styles.categories}>
        {CATEGORIES.map((item) => (
          <TouchableOpacity key={item.id} style={[styles.category, category === item.id && styles.categoryOn]} onPress={() => setCategory(item.id)}>
            <Text style={[styles.categoryTitle, category === item.id && styles.categoryTitleOn]}>{item.id}</Text>
            <Text style={[styles.categoryHint, category === item.id && styles.categoryTitleOn]}>{item.hint}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.photoRow}>
        <TouchableOpacity style={styles.secondary} onPress={takePhoto}><Text style={styles.secondaryText}>Tomar foto</Text></TouchableOpacity>
        <TouchableOpacity style={styles.secondary} onPress={pickPhoto}><Text style={styles.secondaryText}>Elegir de galería</Text></TouchableOpacity>
      </View>
      {image && <Image source={{ uri: image }} style={styles.preview} />}

      <TouchableOpacity style={[styles.secondary, location && styles.locationOn]} onPress={getLocation}>
        <Text style={[styles.secondaryText, location && { color: '#fff' }]}>
          {location ? `Punto listo · ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Usar mi ubicación'}
        </Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Qué está pasando y desde cuándo"
        placeholderTextColor="#8aa094"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Publicar reporte</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  lead: { color: colors.muted, marginBottom: 14, lineHeight: 20 },
  label: { fontWeight: '800', color: colors.ink, marginBottom: 8 },
  categories: { gap: 8, marginBottom: 14 },
  category: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.line },
  categoryOn: { backgroundColor: colors.green, borderColor: colors.green },
  categoryTitle: { fontWeight: '800', color: colors.ink },
  categoryTitleOn: { color: '#fff' },
  categoryHint: { color: colors.muted, marginTop: 2, fontSize: 13 },
  photoRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  secondary: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.line, marginBottom: 10 },
  secondaryText: { fontWeight: '800', color: colors.ink, textAlign: 'center' },
  locationOn: { backgroundColor: colors.green, borderColor: colors.green },
  preview: { width: '100%', height: 190, borderRadius: 18, marginBottom: 10, backgroundColor: colors.greenSoft },
  input: { backgroundColor: '#fff', borderRadius: 16, padding: 14, minHeight: 110, textAlignVertical: 'top', fontSize: 16, color: colors.ink, marginBottom: 14 },
  button: { backgroundColor: colors.green, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
