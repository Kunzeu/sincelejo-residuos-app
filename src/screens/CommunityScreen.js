import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity, Modal } from 'react-native';
import { collection, query, orderBy, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function CommunityScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchCommunityReports();
  }, []);

  const fetchCommunityReports = async () => {
    try {
      const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const reportsData = [];
      querySnapshot.forEach((docSnap) => {
        reportsData.push({ id: docSnap.id, ...docSnap.data() });
      });
      setReports(reportsData);
    } catch (error) {
      console.error('Error fetching community reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (reportId) => {
    try {
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, {
        upvotes: increment(1)
      });
      // Actualizar estado local
      setReports(reports.map(r => 
        r.id === reportId ? { ...r, upvotes: (r.upvotes || 0) + 1 } : r
      ));
    } catch (error) {
      console.log('Error upvoting', error);
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En Proceso';
      case 'resolved': return 'Resuelto';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#FF9800';
      case 'in_progress': return '#2196F3';
      case 'resolved': return '#4CAF50';
      default: return '#666';
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.reportCard}>
      {item.imageUrl && (
        <TouchableOpacity onPress={() => setSelectedImage(item.imageUrl)}>
          <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
        </TouchableOpacity>
      )}
      <View style={styles.reportInfo}>
        <Text style={styles.desc}>{item.description}</Text>
        <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
          Estado: {getStatusText(item.status)}
        </Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.upvoteButton} onPress={() => handleUpvote(item.id)}>
            <Text style={styles.upvoteText}>👍 {item.upvotes || 0} Apoyar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Muro de la Comunidad</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" />
      ) : reports.length === 0 ? (
        <Text style={styles.emptyText}>No hay reportes comunitarios.</Text>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.list}
          refreshing={loading}
          onRefresh={fetchCommunityReports}
        />
      )}

      {/* Modal Visor de Imagen */}
      <Modal visible={!!selectedImage} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setSelectedImage(null)}>
            <Text style={styles.modalCloseText}>Cerrar X</Text>
          </TouchableOpacity>
          {selectedImage && <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f0f4f8' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  list: { flex: 1 },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 20 },
  reportCard: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 15, 
    marginBottom: 15, 
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  thumbnail: { width: 80, height: 80, borderRadius: 8, marginRight: 15, backgroundColor: '#eee' },
  reportInfo: { flex: 1, justifyContent: 'space-between' },
  desc: { fontSize: 16, fontWeight: '600', color: '#222' },
  status: { marginTop: 5, fontWeight: 'bold', fontSize: 13 },
  actionRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center' },
  upvoteButton: { backgroundColor: '#E3F2FD', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  upvoteText: { color: '#1976D2', fontWeight: 'bold', fontSize: 13 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: '90%', height: '80%' },
  modalCloseButton: { position: 'absolute', top: 50, right: 20, zIndex: 1, padding: 10 },
  modalCloseText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});
