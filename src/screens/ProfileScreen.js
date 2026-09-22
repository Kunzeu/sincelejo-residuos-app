import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity, Modal } from 'react-native';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export default function ProfileScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [ecoPoints, setEcoPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchMyReports();
  }, []);

  const fetchMyReports = async () => {
    try {
      if (!auth.currentUser) return;
      const q = query(
        collection(db, 'reports'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const reportsData = [];
      querySnapshot.forEach((docSnap) => {
        reportsData.push({ id: docSnap.id, ...docSnap.data() });
      });
      setReports(reportsData);

      // Fetch user points
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists() && userDoc.data().ecoPoints) {
        setEcoPoints(userDoc.data().ecoPoints);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    navigation.replace('Login');
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
      case 'pending': return '#FF9800'; // Naranja
      case 'in_progress': return '#2196F3'; // Azul
      case 'resolved': return '#4CAF50'; // Verde
      default: return '#666'; // Gris por defecto
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
      </View>
    </View>
  );

  const getLevel = (points) => {
    if (points >= 100) return '🏅 Guardián del Medio Ambiente';
    if (points >= 50) return '🥈 Reciclador Experto';
    if (points >= 10) return '🥉 Colaborador';
    return '🌱 Novato';
  };

  return (
    <View style={styles.container}>
      <View style={styles.pointsContainer}>
        <Text style={styles.pointsTitle}>Mis Eco-Puntos</Text>
        <Text style={styles.pointsValue}>{ecoPoints}</Text>
        <Text style={styles.levelText}>{getLevel(ecoPoints)}</Text>
      </View>

      <Text style={styles.title}>Mis Reportes</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" />
      ) : reports.length === 0 ? (
        <Text style={styles.emptyText}>No has realizado ningún reporte aún.</Text>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.list}
        />
      )}
      
      <View style={styles.space} />
      <Button title="Cerrar Sesión" onPress={handleLogout} color="#f44336" />

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
  container: { flex: 1, padding: 20 },
  pointsContainer: {
    backgroundColor: '#4CAF50',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  pointsTitle: { color: 'white', fontSize: 18, fontWeight: '600' },
  pointsValue: { color: 'white', fontSize: 40, fontWeight: 'bold', marginVertical: 5 },
  levelText: { color: 'white', fontSize: 16, fontStyle: 'italic' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  space: { height: 20 },
  list: { flex: 1 },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 20 },
  reportCard: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 10, 
    marginBottom: 10, 
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  thumbnail: { width: 60, height: 60, borderRadius: 5, marginRight: 15, backgroundColor: '#eee' },
  reportInfo: { flex: 1, justifyContent: 'center' },
  desc: { fontSize: 16, fontWeight: 'bold' },
  status: { marginTop: 5, fontWeight: 'bold' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: '90%', height: '80%' },
  modalCloseButton: { position: 'absolute', top: 50, right: 20, zIndex: 1, padding: 10 },
  modalCloseText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});
