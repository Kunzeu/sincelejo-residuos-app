import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { colors } from '../theme';
import { loadReports } from '../services/reportsApi';
import { reportCategory, reportText, statusColors, statusLabel, timeAgo } from '../utils/reports';

const NEXT = [
  { id: 'pending', label: 'Pendiente' },
  { id: 'in_progress', label: 'En ruta' },
  { id: 'resolved', label: 'Resuelto' },
];

export default function AdminScreen() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchAllReports = useCallback(async () => {
    try {
      setReports(await loadReports());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchAllReports(); }, [fetchAllReports]));

  const changeStatus = async (id, newStatus) => {
    const { error } = await supabase.rpc('set_report_status', { p_report_id: id, p_status: newStatus });
    if (error) {
      console.error(error);
      return;
    }
    setReports((current) => current.map((item) => item.id === id ? { ...item, status: newStatus } : item));
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.lead}>Cambia el estado. Al marcarlo resuelto, quien lo reportó gana 10 eco-puntos.</Text>
      {loading ? <ActivityIndicator color={colors.green} /> : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.empty}>No hay reportes.</Text>}
          renderItem={({ item }) => {
            const tone = statusColors(item.status);
            return (
              <View style={styles.card}>
                <View style={styles.top}>
                  {item.image_url && (
                    <TouchableOpacity onPress={() => setSelectedImage(item.image_url)}>
                      <Image source={{ uri: item.image_url }} style={styles.thumb} />
                    </TouchableOpacity>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.desc}>{reportText(item)}</Text>
                    <Text style={styles.meta}>{reportCategory(item)} · {timeAgo(item.created_at)}</Text>
                    <Text style={{ color: tone.fg, fontWeight: '800', marginTop: 4 }}>{statusLabel(item.status)}</Text>
                  </View>
                </View>
                <View style={styles.actions}>
                  {NEXT.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[styles.action, item.status === option.id && { backgroundColor: tone.bg }]}
                      onPress={() => changeStatus(item.id, option.id)}
                    >
                      <Text style={styles.actionText}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
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
  screen: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  lead: { color: colors.muted, marginBottom: 12, lineHeight: 20 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 12, marginBottom: 10 },
  top: { flexDirection: 'row', gap: 10 },
  thumb: { width: 64, height: 64, borderRadius: 12, backgroundColor: colors.greenSoft },
  desc: { fontWeight: '800', color: colors.ink },
  meta: { color: colors.muted, marginTop: 2, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 6, marginTop: 12 },
  action: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center', backgroundColor: colors.bg },
  actionText: { fontWeight: '800', color: colors.ink, fontSize: 12 },
  empty: { color: colors.muted },
  modal: { flex: 1, backgroundColor: 'rgba(8,20,14,0.92)', justifyContent: 'center' },
  full: { width: '100%', height: '75%' },
  close: { position: 'absolute', top: 54, right: 20 },
  closeText: { color: '#fff', fontWeight: '800' },
});
