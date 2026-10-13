import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, shadow } from '../theme';
import { loadReports, loadSessionProfile } from '../services/reportsApi';
import { levelFor, reportCategory, reportText, statusColors, statusLabel, timeAgo } from '../utils/reports';

const ROLE_LABEL = { citizen: 'Ciudadano', collector: 'Recolector', admin: 'Administrador' };

export default function HomeScreen({ navigation, onOpenTab }) {
  const [profile, setProfile] = useState(null);
  const [reports, setReports] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [{ profile: nextProfile }, nextReports] = await Promise.all([
        loadSessionProfile(),
        loadReports(),
      ]);
      setProfile(nextProfile);
      setReports(nextReports);
    } catch (error) {
      console.log(error);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const points = profile?.eco_points || 0;
  const level = levelFor(points);
  const progress = level.next ? Math.min(1, (points - level.floor) / (level.next - level.floor)) : 1;
  const pending = reports.filter((item) => item.status !== 'resolved').length;
  const resolved = reports.filter((item) => item.status === 'resolved').length;
  const mine = reports.filter((item) => item.user_id === profile?.id);
  const role = profile?.role || 'citizen';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.green} />}
    >
      <Text style={styles.kicker}>Sincelejo Limpio</Text>
      <Text style={styles.title}>Hola, {ROLE_LABEL[role] || 'vecino'}</Text>
      <Text style={styles.subtitle}>Hoy hay {pending} reportes esperando recolección.</Text>

      <View style={styles.hero}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroLabel}>Tus eco-puntos</Text>
          <Text style={styles.heroPoints}>{points}</Text>
          <Text style={styles.heroLevel}>{level.name}</Text>
          <View style={styles.track}><View style={[styles.fill, { width: `${progress * 100}%` }]} /></View>
          <Text style={styles.heroHint}>{level.next ? `Te faltan ${level.next - points} para el siguiente nivel` : 'Nivel máximo'}</Text>
        </View>
        {role !== 'collector' && (
          <TouchableOpacity style={styles.reportBtn} onPress={() => navigation.navigate('Report')}>
            <Text style={styles.reportBtnText}>+ Reportar</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.stats}>
        <Stat value={reports.length} label="En la ciudad" />
        <Stat value={pending} label="Abiertos" />
        <Stat value={resolved} label="Resueltos" />
        <Stat value={mine.length} label="Míos" />
      </View>

      <View style={styles.actions}>
        <Action label="Ver mapa" onPress={() => onOpenTab('map')} />
        <Action label="Comunidad" onPress={() => onOpenTab('community')} />
        <Action label="Guía" onPress={() => onOpenTab('learn')} />
        {role === 'admin' && <Action label="Gestionar" onPress={() => navigation.navigate('Admin')} />}
      </View>

      <View style={styles.tip}>
        <Text style={styles.tipTitle}>Consejo de hoy</Text>
        <Text style={styles.tipText}>Una botella enjuagada y aplastada ocupa menos y sí entra al reciclaje. Las pilas van al punto limpio, nunca a la caneca.</Text>
      </View>

      <Text style={styles.section}>Actividad reciente</Text>
      {reports.slice(0, 4).map((item) => {
        const tone = statusColors(item.status);
        return (
          <View key={item.id} style={styles.row}>
            {item.image_url ? <Image source={{ uri: item.image_url }} style={styles.thumb} /> : <View style={styles.thumb} />}
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle} numberOfLines={1}>{reportText(item)}</Text>
              <Text style={styles.rowMeta}>{reportCategory(item)} · {timeAgo(item.created_at)}</Text>
            </View>
            <Text style={[styles.pill, { color: tone.fg, backgroundColor: tone.bg }]}>{statusLabel(item.status)}</Text>
          </View>
        );
      })}
      {reports.length === 0 && <Text style={styles.empty}>Aún no hay reportes. Sé la primera persona en marcar un punto.</Text>}
    </ScrollView>
  );
}

function Stat({ value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Action({ label, onPress }) {
  return (
    <TouchableOpacity style={styles.action} onPress={onPress}>
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 28 },
  kicker: { color: colors.green, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase', fontSize: 12 },
  title: { fontSize: 30, fontWeight: '800', color: colors.ink, marginTop: 4 },
  subtitle: { color: colors.muted, marginTop: 6, marginBottom: 16, fontSize: 15 },
  hero: { backgroundColor: colors.greenDark, borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  heroLabel: { color: '#d7f5e5', fontWeight: '700' },
  heroPoints: { color: '#fff', fontSize: 42, fontWeight: '800', lineHeight: 46 },
  heroLevel: { color: '#fff', fontWeight: '700', marginBottom: 10 },
  track: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 99, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: '#8ee0b5' },
  heroHint: { color: '#d7f5e5', marginTop: 8, fontSize: 12 },
  reportBtn: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 },
  reportBtnText: { color: colors.greenDark, fontWeight: '800' },
  stats: { flexDirection: 'row', gap: 8, marginTop: 14 },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: 16, paddingVertical: 12, alignItems: 'center', ...shadow },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.ink },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 2, textAlign: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  action: { backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.line },
  actionText: { color: colors.ink, fontWeight: '700' },
  tip: { marginTop: 16, backgroundColor: colors.amberSoft, borderRadius: 18, padding: 16 },
  tipTitle: { color: colors.amber, fontWeight: '800', marginBottom: 4 },
  tipText: { color: '#7c4a12', lineHeight: 20 },
  section: { marginTop: 22, marginBottom: 10, fontSize: 18, fontWeight: '800', color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: 16, padding: 10, marginBottom: 8 },
  thumb: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.greenSoft },
  rowTitle: { fontWeight: '700', color: colors.ink },
  rowMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  pill: { overflow: 'hidden', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, fontSize: 11, fontWeight: '800' },
  empty: { color: colors.muted, lineHeight: 20 },
});
