import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity, Modal } from 'react-native';
import { collection, getDocs, updateDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function AdminScreen() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchAllReports();
  }, []);

  const fetchAllReports = async () => {
    try {
      const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const reportsData = [];
      querySnapshot.forEach((docSnap) => {
        reportsData.push({ id: docSnap.id, ...docSnap.data() });
      });
      setReports(reportsData);
    } catch (error) {
      console.error("Error fetching all reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (id, newStatus) => {
    try {
      const reportRef = doc(db, 'reports', id);
      await updateDoc(reportRef, { status: newStatus });
      // Actualizar estado local
      setReports(reports.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (error) {
      console.error("Error updating status:", error);
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
      <View style={styles.cardHeader}>
        {item.imageUrl && (
          <TouchableOpacity onPress={() => setSelectedImage(item.imageUrl)}>
            <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
          </TouchableOpacity>
        )}
        <View style={styles.reportInfo}>
          <Text style={styles.desc}>{item.description}</Text>
          <Text style={styles.date}>
            {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Reciente'}
          </Text>
          <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
            Estado: {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.btn, item.status === 'pending' && styles.btnActive, { borderColor: '#FF9800' }]} 
          onPress={() => changeStatus(item.id, 'pending')}
        >
          <Text style={{color: '#FF9800', fontWeight: 'bold'}}>Pendiente</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.btn, item.status === 'in_progress' && styles.btnActive, { borderColor: '#2196F3' }]} 
          onPress={() => changeStatus(item.id, 'in_progress')}
        >
          <Text style={{color: '#2196F3', fontWeight: 'bold'}}>En Proceso</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.btn, item.status === 'resolved' && styles.btnActive, { borderColor: '#4CAF50' }]} 
          onPress={() => changeStatus(item.id, 'resolved')}
        >
          <Text style={{color: '#4CAF50', fontWeight: 'bold'}}>Resuelto</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panel de Control</Text>
      <Text style={styles.subtitle}>Gestión total de reportes ciudadanos</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#9C27B0" />
      ) : reports.length === 0 ? (
        <Text style={styles.emptyText}>No hay reportes en la ciudad.</Text>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.list}
        />
      )}

      {/* Modal para ver la imagen en grande */}
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
  container: { flex: 1, padding: 15, backgroundColor: '#f0f0f0' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#9C27B0' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  list: { width: '100%' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#666' },
  reportCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 15
  },
  thumbnail: { width: 70, height: 70, borderRadius: 8, marginRight: 15, backgroundColor: '#eee' },
  reportInfo: { flex: 1, justifyContent: 'center' },
  desc: { fontSize: 16, fontWeight: 'bold' },
  date: { fontSize: 12, color: '#888', marginTop: 2 },
  status: { marginTop: 5, fontWeight: 'bold' },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  btn: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 8,
    borderRadius: 5,
    marginHorizontal: 3,
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  btnActive: {
    backgroundColor: '#f5f5f5'
  },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: '90%', height: '80%' },
  modalCloseButton: { position: 'absolute', top: 50, right: 20, zIndex: 1, padding: 10 },
  modalCloseText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});
