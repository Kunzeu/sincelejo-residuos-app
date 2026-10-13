import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity, Modal, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { colors } from '../theme';
import { loadReports } from '../services/reportsApi';
import { reportCategory, reportText, statusColors, statusLabel, timeAgo } from '../utils/reports';

const FILTERS = [
  { id: 'all', label: 'Todos', icon: '📋' },
  { id: 'pending', label: 'Pendientes', icon: '🗑️' },
  { id: 'in_progress', label: 'En ruta', icon: '🚛' },
  { id: 'resolved', label: 'Resueltos', icon: '✅' },
];

export default function CommunityScreen() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchCommunityReports = useCallback(async () => {
    try {
      setReports(await loadReports());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchCommunityReports(); }, [fetchCommunityReports]));

  const handleUpvote = async (reportId) => {
    try {
      const { error } = await supabase.rpc('upvote_report', { p_report_id: reportId });
      if (error) throw error;
      setReports((current) => current.map((item) => (
        item.id === reportId ? { ...item, upvotes: (item.upvotes || 0) + 1 } : item
      )));
    } catch (error) {
      console.log(error);
    }
  };

  const visible = reports.filter((item) => filter === 'all' || item.status === filter);

  return (
    <View style={styles.screen}>
      <Text style={styles.kicker}>Comunidad</Text>
      <Text style={styles.title}>Muro de la ciudad</Text>
      <View style={styles.filters}>
        {FILTERS.map((item) => (
          <TouchableOpacity key={item.id} style={[styles.chip, filter === item.id && styles.chipOn]} onPress={() => setFilter(item.id)}>
            <Text style={styles.chipIcon}>{item.icon}</Text>
            <Text style={[styles.chipText, filter === item.id && styles.chipTextOn]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? <ActivityIndicator color={colors.green} /> : (
        <FlatList
          style={{ flex: 1 }}
          data={visible}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchCommunityReports} tintColor={colors.green} />}
          ListEmptyComponent={<Text style={styles.empty}>No hay reportes en este filtro.</Text>}
          renderItem={({ item }) => {
            const tone = statusColors(item.status);
            return (
              <View style={styles.card}>
                {item.image_url && (
                  <TouchableOpacity onPress={() => setSelectedImage(item.image_url)}>
                    <Image source={{ uri: item.image_url }} style={styles.image} />
                  </TouchableOpacity>
                )}
                <View style={styles.body}>
                  <Text style={[styles.badge, { color: tone.fg, backgroundColor: tone.bg }]}>{statusLabel(item.status)}</Text>
                  <Text style={styles.desc}>{reportText(item)}</Text>
                  <Text style={styles.meta}>{reportCategory(item)} · {timeAgo(item.created_at)} · {item.upvotes || 0} apoyos</Text>
                  <TouchableOpacity style={styles.support} onPress={() => handleUpvote(item.id)}>
                    <Text style={styles.supportText}>Apoyar este reporte</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
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
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, paddingTop: 8 },
  kicker: { color: colors.green, fontWeight: '800', fontSize: 12, textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink, marginBottom: 12 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.line },
  chipIcon: { fontSize: 15, marginRight: 6 },
  chipOn: { backgroundColor: colors.green, borderColor: colors.green },
  chipText: { color: colors.muted, fontWeight: '700', fontSize: 13 },
  chipTextOn: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 12 },
  image: { width: '100%', height: 170, backgroundColor: colors.greenSoft },
  body: { padding: 14 },
  badge: { alignSelf: 'flex-start', overflow: 'hidden', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, fontWeight: '800', fontSize: 12 },
  desc: { fontSize: 16, fontWeight: '700', color: colors.ink, marginTop: 8 },
  meta: { color: colors.muted, marginTop: 4 },
  support: { marginTop: 12, alignSelf: 'flex-start', backgroundColor: colors.greenSoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  supportText: { color: colors.greenDark, fontWeight: '800' },
  empty: { color: colors.muted, marginTop: 20 },
  modal: { flex: 1, backgroundColor: 'rgba(8,20,14,0.92)', justifyContent: 'center' },
  full: { width: '100%', height: '75%' },
  close: { position: 'absolute', top: 54, right: 20 },
  closeText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
