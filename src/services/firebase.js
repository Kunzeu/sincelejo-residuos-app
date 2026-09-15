import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// La analítica puede causar problemas en Expo sin la configuración adecuada,
// por lo que la omitimos en esta etapa.

const firebaseConfig = {
  apiKey: "AIzaSyB15em9KJAlGTJtckYzUSxjRJ9ANSdI5bA",
  authDomain: "sincelejoapp-5b87a.firebaseapp.com",
  projectId: "sincelejoapp-5b87a",
  storageBucket: "sincelejoapp-5b87a.firebasestorage.app",
  messagingSenderId: "131010878924",
  appId: "1:131010878924:web:c0234b5bf881d5fbc65169",
  measurementId: "G-MP6F9NED1W"
};

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);

// Exportamos los servicios que usamos en el resto de la app
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);