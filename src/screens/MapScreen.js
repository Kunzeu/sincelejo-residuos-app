import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { collection, getDocs, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

let MapView, Marker, Polygon;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Polygon = Maps.Polygon;
}

export default function MapScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCollector, setIsCollector] = useState(false);
  const [filters, setFilters] = useState({
    pendientes: true,
    resueltos: true,
    puntosLimpios: true,
    zonas: true,
  });

  useEffect(() => {
    checkUserRole();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchReports();
    });
    return unsubscribe;
  }, [navigation]);

  const checkUserRole = async () => {
    try {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const role = userDoc.data().role;
          if (role === 'admin') setIsAdmin(true);
          if (role === 'collector') setIsCollector(true);
        }
      }
    } catch (error) {
      console.log('Error fetching user role:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'reports'));
      const reportsData = [];
      querySnapshot.forEach((docSnap) => {
        reportsData.push({ id: docSnap.id, ...docSnap.data() });
      });
      setReports(reportsData);
    } catch (error) {
      console.error("Error fetching map reports:", error);
    }
  };

  const initialRegion = {
    latitude: 9.3047,
    longitude: -75.3978,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const customMapStyle = [
    {
      "featureType": "poi.park",
      "elementType": "geometry.fill",
      "stylers": [{"color": "#a8de97"}]
    },
    {
      "featureType": "water",
      "elementType": "geometry.fill",
      "stylers": [{"color": "#a4c9d4"}]
    }
  ];

  const PUNTOS_LIMPIOS = [
    { id: 'p1', title: 'Punto Limpio Centro', description: 'Reciclaje de plásticos y cartón', coordinate: { latitude: 9.3000, longitude: -75.3950 } },
    { id: 'p2', title: 'Punto Limpio Norte', description: 'Vidrio y electrónicos', coordinate: { latitude: 9.3150, longitude: -75.3900 } }
  ];

  const ZONA_RECOLECCION = [
    { latitude: 9.3100, longitude: -75.4050 },
    { latitude: 9.3200, longitude: -75.4000 },
    { latitude: 9.3150, longitude: -75.3850 },
    { latitude: 9.3050, longitude: -75.3900 },
  ];

  const toggleFilter = (key) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleMarkerPress = (report) => {
    if (isCollector && report.status !== 'resolved') {
      Alert.alert(
        "Recolección",
        "¿Marcar este residuo como recogido?",
        [
          { text: "Cancelar", style: "cancel" },
          { 
            text: "Confirmar", 
            onPress: async () => {
              try {
                await updateDoc(doc(db, 'reports', report.id), { status: 'resolved' });
                // Gamification (dar puntos al que lo reportó)
                if (report.userId && report.userId !== 'anonymous') {
                  await updateDoc(doc(db, 'users', report.userId), { ecoPoints: increment(10) });
                }
                Alert.alert("Éxito", "Residuo recogido");
                fetchReports(); // recargar
              } catch (e) {
                console.log(e);
              }
            }
          }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hola, {isCollector ? 'Recolector' : 'Ciudadano'} 👋</Text>
        <Text style={styles.headerSubtitle}>Mantengamos a Sincelejo Limpio</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity style={[styles.filterChip, filters.pendientes && styles.filterChipActive]} onPress={() => toggleFilter('pendientes')}>
            <Text style={[styles.filterText, filters.pendientes && styles.filterTextActive]}>🗑️ Pendientes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterChip, filters.resueltos && styles.filterChipActive]} onPress={() => toggleFilter('resueltos')}>
            <Text style={[styles.filterText, filters.resueltos && styles.filterTextActive]}>✅ Resueltos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterChip, filters.puntosLimpios && styles.filterChipActive]} onPress={() => toggleFilter('puntosLimpios')}>
            <Text style={[styles.filterText, filters.puntosLimpios && styles.filterTextActive]}>♻️ Puntos Limpios</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterChip, filters.zonas && styles.filterChipActive]} onPress={() => toggleFilter('zonas')}>
            <Text style={[styles.filterText, filters.zonas && styles.filterTextActive]}>🗺️ Zonas</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {Platform.OS !== 'web' ? (
        <MapView 
          style={styles.map} 
          initialRegion={initialRegion}
          customMapStyle={customMapStyle}
          showsUserLocation={true}
        >
          {reports.map(report => {
            if (!report.location) return null;
            if (report.status === 'resolved' && !filters.resueltos) return null;
            if (report.status !== 'resolved' && !filters.pendientes) return null;

            return (
              <Marker 
                key={report.id}
                coordinate={{ 
                  latitude: report.location.latitude, 
                  longitude: report.location.longitude 
                }}
                title={`Residuo - ${report.status}`}
                description={report.description + (isCollector && report.status !== 'resolved' ? '\n(Toca para marcar recogido)' : '')}
                pinColor={report.status === 'resolved' ? 'green' : 'orange'}
                onCalloutPress={() => handleMarkerPress(report)}
              />
            );
          })}

          {filters.puntosLimpios && PUNTOS_LIMPIOS.map(punto => (
            <Marker
              key={punto.id}
              coordinate={punto.coordinate}
              title={punto.title}
              description={punto.description}
              pinColor="blue"
            />
          ))}

          {filters.zonas && (
            <Polygon
              coordinates={ZONA_RECOLECCION}
              strokeColor="rgba(33, 150, 243, 0.8)"
              fillColor="rgba(33, 150, 243, 0.2)"
              strokeWidth={2}
            />
          )}
        </MapView>
      ) : (
        <View style={[styles.map, {justifyContent: 'center', alignItems: 'center', backgroundColor: '#e2e8f0'}]}>
          <Text style={{fontSize: 18, color: '#64748b'}}>Mapa no disponible en versión Web</Text>
        </View>
      )}

      <View style={styles.bottomNav}>
        {isAdmin && (
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Admin')}>
            <Text style={styles.navIcon}>🛡️</Text>
            <Text style={styles.navText}>Admin</Text>
          </TouchableOpacity>
        )}
        {!isCollector && (
          <TouchableOpacity style={styles.navItemMain} onPress={() => navigation.navigate('Report')}>
            <View style={styles.mainActionBtn}>
              <Text style={styles.mainActionText}>+</Text>
            </View>
            <Text style={styles.navTextMain}>Reportar</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Community')}>
          <Text style={styles.navIcon}>👥</Text>
          <Text style={styles.navText}>Comunidad</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 2,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#166534' },
  headerSubtitle: { fontSize: 14, color: '#15803d', marginTop: 4 },
  map: { width: '100%', height: '100%', position: 'absolute' },
  filterContainer: {
    position: 'absolute',
    top: 130,
    width: '100%',
    zIndex: 1,
    paddingHorizontal: 10,
  },
  filterChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 }
  },
  filterChipActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  filterText: { color: '#64748b', fontWeight: 'bold' },
  filterTextActive: { color: '#fff' },
  bottomNav: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    width: '90%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  navItem: { alignItems: 'center', padding: 5 },
  navIcon: { fontSize: 24, marginBottom: 2 },
  navText: { fontSize: 10, color: '#64748b', fontWeight: 'bold' },
  navItemMain: { alignItems: 'center', marginTop: -30 },
  mainActionBtn: {
    backgroundColor: '#16a34a',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#16a34a',
    shadowOpacity: 0.4,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    borderWidth: 3,
    borderColor: '#fff'
  },
  mainActionText: { color: 'white', fontSize: 32, fontWeight: 'bold', marginTop: -2 },
  navTextMain: { fontSize: 10, color: '#16a34a', fontWeight: 'bold', marginTop: 5 }
});
