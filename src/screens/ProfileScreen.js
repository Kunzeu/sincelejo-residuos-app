import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { colors } from '../theme';
import { achievements, levelFor, reportText, statusColors, statusLabel, timeAgo } from '../utils/reports';

export default function ProfileScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [ecoPoints, setEcoPoints] = useState(0);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchMyReports = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReports(data ?? []);
      const { data: profile } = await supabase
        .from('profiles')
        .select('eco_points, email')
        .eq('id', user.id)
        .maybeSingle();
      setEcoPoints(profile?.eco_points || 0);
      setEmail(profile?.email || user.email || '');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchMyReports(); }, [fetchMyReports]));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigation.replace('Login');
  };

  const level = levelFor(ecoPoints);
  const progress = level.next ? Math.min(1, (ecoPoints - level.floor) / (level.next - level.floor)) : 1;
  const resolvedCount = reports.filter((item) => item.status === 'resolved').length;
  const badges = achievements(ecoPoints, reports.length, resolvedCount);

  return (
    <View style={{ flex: 1 }}>
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={reports}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={(
        <View>
          <Text style={styles.kicker}>Tu cuenta</Text>
          <Text style={styles.title}>{email || 'Mi perfil'}</Text>
          <View style={styles.hero}>
            <Text style={styles.points}>{ecoPoints}</Text>
            <Text style={styles.level}>{level.name}</Text>
            <View style={styles.track}><View style={[styles.fill, { width: `${progress * 100}%` }]} /></View>
            <Text style={styles.hint}>{resolvedCount} de tus reportes ya fueron resueltos</Text>
          </View>
          <Text style={styles.section}>Logros</Text>
          <View style={styles.badges}>
            {badges.map((item) => (
              <View key={item.title} style={[styles.badge, !item.done && styles.badgeOff]}>
                <Text style={styles.badgeTitle}>{item.title}</Text>
                <Text style={styles.badgeDetail}>{item.done ? 'Conseguido' : item.detail}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.section}>Mis reportes</Text>
          {loading && <ActivityIndicator color={colors.green} />}
          {!loading && reports.length === 0 && <Text style={styles.empty}>Todavía no has publicado un reporte.</Text>}
        </View>
      )}
      renderItem={({ item }) => {
        const tone = statusColors(item.status);
        return (
          <View style={styles.card}>
            {item.image_url && (
              <TouchableOpacity onPress={() => setSelectedImage(item.image_url)}>
                <Image source={{ uri: item.image_url }} style={styles.thumb} />
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.desc}>{reportText(item)}</Text>
              <Text style={{ color: tone.fg, fontWeight: '800', marginTop: 4 }}>{statusLabel(item.status)} · {timeAgo(item.created_at)}</Text>
            </View>
          </View>
        );
      }}
      ListFooterComponent={(
        <TouchableOpacity style={styles.logout} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      )}
      ListFooterComponentStyle={{ marginTop: 8 }}
    />
    <Modal visible={!!selectedImage} transparent animationType="fade">
      <View style={styles.modal}>
        <TouchableOpacity style={styles.close} onPress={() => setSelectedImage(null)}>
          <Text style={styles.closeText}>Cerrar</Text>
        </TouchableOpacity>
        {selectedImage && <Image source={{ uri: selectedImage }} style={styles.full} resizeMode="contain" />}
      </View>
    </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 28 },
  kicker: { color: colors.green, fontWeight: '800', fontSize: 12, textTransform: 'uppercase' },
  title: { fontSize: 24, fontWeight: '800', color: colors.ink, marginTop: 4, marginBottom: 12 },
  hero: { backgroundColor: colors.greenDark, borderRadius: 22, padding: 18 },
  points: { color: '#fff', fontSize: 40, fontWeight: '800' },
  level: { color: '#d7f5e5', fontWeight: '700' },
  track: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 99, marginTop: 12, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: '#8ee0b5' },
  hint: { color: '#d7f5e5', marginTop: 8 },
  section: { fontSize: 18, fontWeight: '800', color: colors.ink, marginTop: 18, marginBottom: 8 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { width: '48%', backgroundColor: colors.greenSoft, borderRadius: 16, padding: 12 },
  badgeOff: { backgroundColor: '#fff' },
  badgeTitle: { fontWeight: '800', color: colors.ink },
  badgeDetail: { color: colors.muted, marginTop: 4, fontSize: 12 },
  card: { flexDirection: 'row', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 8, alignItems: 'center' },
  thumb: { width: 56, height: 56, borderRadius: 12, backgroundColor: colors.greenSoft },
  desc: { fontWeight: '700', color: colors.ink },
  empty: { color: colors.muted },
  logout: { marginTop: 16, borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: '#fff' },
  logoutText: { color: colors.red, fontWeight: '800' },
  modal: { flex: 1, backgroundColor: 'rgba(8,20,14,0.92)', justifyContent: 'center' },
  full: { width: '100%', height: '75%' },
  close: { position: 'absolute', top: 54, right: 20 },
  closeText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});