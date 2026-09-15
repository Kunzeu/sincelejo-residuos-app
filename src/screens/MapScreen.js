import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

export default function MapScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const webViewRef = useRef(null);

  useEffect(() => {
    checkUserRole();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchReports();
    });
    return unsubscribe;
  }, [navigation]);

  // Inyectar marcadores cuando el mapa esté listo y tengamos reportes
  useEffect(() => {
    if (mapReady && reports.length > 0) {
      injectMarkers();
    }
  }, [mapReady, reports]);

  const checkUserRole = async () => {
    try {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
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
      console.error('Error fetching map reports:', error);
    }
  };

  const injectMarkers = () => {
    // Filtrar solo reportes con ubicación válida
    const validReports = reports.filter(
      (r) => r.location && r.location.latitude && r.location.longitude
    );
    const markersJSON = JSON.stringify(validReports.map((r) => ({
      lat: r.location.latitude,
      lng: r.location.longitude,
      desc: r.description || 'Sin descripción',
      status: r.status || 'pending',
    })));
    const js = `
      if (typeof addMarkers === 'function') {
        addMarkers(${markersJSON});
      }
      true;
    `;
    webViewRef.current?.injectJavaScript(js);
  };

  // HTML del mapa con Google Maps JavaScript API (embed gratuito, sin clave)
  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #map { width: 100%; height: 100vh; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map;
        var markers = [];

        function statusColor(status) {
          if (status === 'resolved') return '#4CAF50';
          if (status === 'in_progress') return '#2196F3';
          return '#FF9800'; // pending
        }

        function addMarkers(data) {
          // Eliminar marcadores previos
          markers.forEach(function(m) { m.setMap(null); });
          markers = [];
          data.forEach(function(r) {
            var marker = new google.maps.Marker({
              position: { lat: r.lat, lng: r.lng },
              map: map,
              title: r.desc,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: statusColor(r.status),
                fillOpacity: 0.95,
                strokeWeight: 2,
                strokeColor: '#fff'
              }
            });
            var info = new google.maps.InfoWindow({
              content: '<div style="max-width:180px;font-family:sans-serif"><b>Residuo</b><br>' + r.desc + '</div>'
            });
            marker.addListener('click', function() {
              info.open(map, marker);
            });
            markers.push(marker);
          });
        }

        function initMap() {
          map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: 9.3047, lng: -75.3978 },
            zoom: 13,
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
            zoomControl: true,
            styles: [
              { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
            ]
          });
          // Avisar a React Native que el mapa está listo
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage('MAP_READY');
        }
      </script>
      <script
        src="https://maps.googleapis.com/maps/api/js?callback=initMap"
        async defer>
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={(event) => {
          if (event.nativeEvent.data === 'MAP_READY') {
            setMapReady(true);
          }
        }}
        onError={(e) => console.error('WebView error:', e.nativeEvent)}
      />

      {!mapReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#9C27B0" />
          <Text style={styles.loadingText}>Cargando mapa...</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        {isAdmin && (
          <TouchableOpacity
            style={[styles.button, styles.adminButton]}
            onPress={() => navigation.navigate('Admin')}
          >
            <Text style={styles.buttonText}>🛡️ Panel Admin</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Report')}>
          <Text style={styles.buttonText}>+ Reportar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.profileButton]}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.buttonText}>Mi Perfil</Text>
        </TouchableOpacity>
      </View>

      {/* Leyenda de colores */}
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: '#FF9800' }]} />
          <Text style={styles.legendText}>Pendiente</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: '#2196F3' }]} />
          <Text style={styles.legendText}>En Proceso</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Resuelto</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9C27B0',
    fontWeight: '600',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  adminButton: { backgroundColor: '#9C27B0' },
  profileButton: { backgroundColor: '#2196F3' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  legend: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  legendText: { fontSize: 12, color: '#333', fontWeight: '500' },
});
