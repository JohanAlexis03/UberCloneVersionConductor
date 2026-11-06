// AI-assisted: see docs/AI_LOG.md #6
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Evita reinicializar la app cuando Fast Refresh recarga el modulo
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// La sesion se guarda en AsyncStorage para que sobreviva al cerrar la app
let auth;
try {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
    });
} catch (error) {
    // Si Auth ya estaba inicializado (Fast Refresh), reutiliza la instancia
    auth = getAuth(app);
}

export const db = getFirestore(app);
export { auth };
export default app;
