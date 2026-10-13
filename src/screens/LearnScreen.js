import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../theme';
import { CLEAN_POINTS, GUIDE, SCHEDULE } from '../utils/reports';

const SECTIONS = ['Separar', 'Rutas', 'Puntos'];

export default function LearnScreen({ onOpenTab }) {
  const [section, setSection] = useState('Separar');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>Aprende</Text>
      <Text style={styles.title}>Guía de Sincelejo</Text>
      <Text style={styles.subtitle}>Cómo separar, cuándo pasa el carro y dónde llevar lo que no va a la caneca.</Text>

      <View style={styles.switcher}>
        {SECTIONS.map((item) => (
          <TouchableOpacity key={item} style={[styles.chip, section === item && styles.chipOn]} onPress={() => setSection(item)}>
            <Text style={[styles.chipText, section === item && styles.chipTextOn]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {section === 'Separar' && GUIDE.map((item) => (
        <View key={item.title} style={styles.card}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardText}>{item.text}</Text>
        </View>
      ))}

      {section === 'Rutas' && (
        <>
          <Text style={styles.note}>Horario de referencia para la demo. Confírmalo con la ruta oficial de tu barrio.</Text>
          {SCHEDULE.map((item) => (
            <View key={item.day} style={styles.route}>
              <Text style={styles.day}>{item.day}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.zone}</Text>
                <Text style={styles.cardText}>{item.waste}</Text>
              </View>
            </View>
          ))}
        </>
      )}

      {section === 'Puntos' && CLEAN_POINTS.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardText}>{item.detail}</Text>
          <TouchableOpacity onPress={() => onOpenTab('map')}>
            <Text style={styles.link}>Ver en el mapa</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.pointsBox}>
        <Text style={styles.cardTitle}>Cómo sumas eco-puntos</Text>
        <Text style={styles.cardText}>Cuando un recolector o el administrador marca tu reporte como resuelto, ganas 10 puntos. Apoyar reportes de vecinos no resta ni suma puntos: ayuda a priorizar la ruta.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 28 },
  kicker: { color: colors.green, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase', fontSize: 12 },
  title: { fontSize: 30, fontWeight: '800', color: colors.ink, marginTop: 4 },
  subtitle: { color: colors.muted, marginTop: 6, marginBottom: 16, lineHeight: 21 },
  switcher: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line },
  chipOn: { backgroundColor: colors.green, borderColor: colors.green },
  chipText: { color: colors.muted, fontWeight: '700' },
  chipTextOn: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 10 },
  cardTitle: { fontWeight: '800', color: colors.ink, fontSize: 16 },
  cardText: { color: colors.muted, marginTop: 4, lineHeight: 20 },
  note: { color: colors.muted, marginBottom: 10, fontSize: 13 },
  route: { flexDirection: 'row', gap: 12, backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 8, alignItems: 'center' },
  day: { width: 78, fontWeight: '800', color: colors.green },
  link: { marginTop: 8, color: colors.green, fontWeight: '800' },
  pointsBox: { marginTop: 8, backgroundColor: colors.greenSoft, borderRadius: 18, padding: 16 },
});
