import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { colors } from '../theme';
import { loadReports, loadSessionProfile } from '../services/reportsApi';
import { CLEAN_POINTS, reportText, statusLabel } from '../utils/reports';

let MapView, Marker, Polygon;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Polygon = Maps.Polygon;
}

const ZONA_RECOLECCION = [
  { latitude: 9.3100, longitude: -75.4050 },
  { latitude: 9.3200, longitude: -75.4000 },
  { latitude: 9.3150, longitude: -75.3850 },
  { latitude: 9.3050, longitude: -75.3900 },
];

export default function MapScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [role, setRole] = useState('citizen');
  const [filters, setFilters] = useState({ pendientes: true, resueltos: true, puntos: true, zonas: true });

  const refresh = useCallback(async () => {
    try {
      const [{ profile }, nextReports] = await Promise.all([loadSessionProfile(), loadReports()]);
      setRole(profile?.role || 'citizen');
      setReports(nextReports);
    } catch (error) {
      console.log(error);
    }
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const toggle = (key) => setFilters((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleMarkerPress = (report) => {
    if (role !== 'collector' || report.status === 'resolved') return;
    Alert.alert('Recolección', '¿Marcar este residuo como recogido?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          const { error } = await supabase.rpc('set_report_status', {
            p_report_id: report.id,
            p_status: 'resolved',
          });
          if (error) {
            Alert.alert('No se pudo actualizar', error.message);
            return;
          }
          Alert.alert('Listo', 'El reporte quedó resuelto y sumó 10 eco-puntos.');
          refresh();
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mapa</Text>
          <Text style={styles.subtitle}>{role === 'collector' ? 'Toca un punto naranja para recogerlo' : 'Pendientes en naranja, resueltos en verde'}</Text>
        </View>
        {role !== 'collector' && (
          <TouchableOpacity style={styles.add} onPress={() => navigation.navigate('Report')}>
            <Text style={styles.addText}>+</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.filters}>
        <Chip icon="🗑️" label="Pendientes" active={filters.pendientes} onPress={() => toggle('pendientes')} />
        <Chip icon="✅" label="Resueltos" active={filters.resueltos} onPress={() => toggle('resueltos')} />
        <Chip icon="♻️" label="Puntos limpios" active={filters.puntos} onPress={() => toggle('puntos')} />
        <Chip icon="🗺️" label="Zona norte" active={filters.zonas} onPress={() => toggle('zonas')} />
      </View>

      {Platform.OS !== 'web' ? (
        <MapView
          style={styles.map}
          initialRegion={{ latitude: 9.3047, longitude: -75.3978, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
          showsUserLocation
        >
          {reports.map((report) => {
            if (report.latitude == null || report.longitude == null) return null;
            if (report.status === 'resolved' && !filters.resueltos) return null;
            if (report.status !== 'resolved' && !filters.pendientes) return null;
            return (
              <Marker
                key={report.id}
                coordinate={{ latitude: report.latitude, longitude: report.longitude }}
                title={statusLabel(report.status)}
                description={reportText(report)}
                tracksViewChanges
                onCalloutPress={() => handleMarkerPress(report)}
              >
                <View style={[styles.pin, report.status === 'resolved' ? styles.pinDone : styles.pinOpen]}>
                  <Text style={styles.pinIcon}>{report.status === 'resolved' ? '✅' : '🗑️'}</Text>
                </View>
              </Marker>
            );
          })}
          {filters.puntos && CLEAN_POINTS.map((punto) => (
            <Marker
              key={punto.id}
              coordinate={{ latitude: punto.latitude, longitude: punto.longitude }}
              title={punto.title}
              description={punto.detail}
              tracksViewChanges
            >
              <View style={[styles.pin, styles.pinClean]}>
                <Text style={styles.pinIcon}>♻️</Text>
              </View>
            </Marker>
          ))}
          {filters.zonas && (
            <Polygon coordinates={ZONA_RECOLECCION} strokeColor="rgba(14,122,69,0.9)" fillColor="rgba(14,122,69,0.18)" strokeWidth={2} />
          )}
        </MapView>
      ) : (
        <View style={styles.webFallback}>
          <Text style={styles.webTitle}>El mapa se abre en el celular</Text>
          <Text style={styles.webText}>{reports.length} reportes cargados. En el navegador puedes revisar Inicio, Ciudad, Guía y Perfil.</Text>
        </View>
      )}
    </View>
  );
}

function Chip({ icon, label, active, onPress }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipOn]} onPress={onPress}>
      <Text style={styles.chipIcon}>{icon}</Text>
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  subtitle: { color: colors.muted, marginTop: 2, maxWidth: 250 },
  add: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  addText: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: -2 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.line },
  chipOn: { backgroundColor: colors.green, borderColor: colors.green },
  chipIcon: { fontSize: 16, marginRight: 6 },
  chipText: { color: colors.muted, fontWeight: '700' },
  chipTextOn: { color: '#fff' },
  pin: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  pinOpen: { backgroundColor: '#f59e0b' },
  pinDone: { backgroundColor: '#0e7a45' },
  pinClean: { backgroundColor: '#1d4ed8' },
  pinIcon: { fontSize: 16 },
  map: { flex: 1 },
  webFallback: { flex: 1, margin: 16, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 24 },
  webTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  webText: { color: colors.muted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
