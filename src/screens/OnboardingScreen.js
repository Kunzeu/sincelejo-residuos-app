import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Cuida tu Ciudad 🌍',
    description: 'Reporta acumulación de basura y ayuda a mantener a Sincelejo limpio para todos.',
    image: 'https://cdn-icons-png.flaticon.com/512/3299/3299935.png'
  },
  {
    id: '2',
    title: 'Gana Eco-Puntos ♻️',
    description: 'Cada vez que tu reporte sea resuelto, ganarás puntos y subirás de nivel ciudadano.',
    image: 'https://cdn-icons-png.flaticon.com/512/3299/3299966.png'
  },
  {
    id: '3',
    title: 'Forma Comunidad 👥',
    description: 'Apoya los reportes de otros vecinos y construye un mejor ecosistema.',
    image: 'https://cdn-icons-png.flaticon.com/512/3299/3299863.png'
  }
];

export default function OnboardingScreen({ navigation }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    } catch (e) {
      // Ignore errors
    }
    navigation.replace('Map');
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      finishOnboarding();
    }
  };

  const skip = () => {
    finishOnboarding();
  };

  return (
    <View style={styles.container}>
      <View style={styles.skipContainer}>
        <TouchableOpacity onPress={skip}>
          <Text style={styles.skipText}>Saltar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.slideContainer}>
        <Image source={{ uri: slides[currentSlide].image }} style={styles.image} resizeMode="contain" />
        <Text style={styles.title}>{slides[currentSlide].title}</Text>
        <Text style={styles.description}>{slides[currentSlide].description}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.indicatorContainer}>
          {slides.map((_, index) => (
            <View key={index} style={[styles.indicator, currentSlide === index && styles.indicatorActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={nextSlide}>
          <Text style={styles.buttonText}>
            {currentSlide === slides.length - 1 ? 'Empezar' : 'Siguiente'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  skipContainer: { marginTop: 50, paddingHorizontal: 20, alignItems: 'flex-end' },
  skipText: { fontSize: 16, color: '#16a34a', fontWeight: 'bold' },
  slideContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  image: { width: width * 0.7, height: height * 0.3, marginBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: '#166534', textAlign: 'center', marginBottom: 15 },
  description: { fontSize: 16, color: '#15803d', textAlign: 'center', lineHeight: 24 },
  footer: { padding: 30, paddingBottom: 50 },
  indicatorContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
  indicator: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#bbf7d0', marginHorizontal: 5 },
  indicatorActive: { backgroundColor: '#16a34a', width: 20 },
  button: { backgroundColor: '#16a34a', paddingVertical: 15, borderRadius: 30, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});
