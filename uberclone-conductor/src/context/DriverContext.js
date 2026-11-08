// AI-assisted: see docs/AI_LOG.md #11
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { TRANSLATIONS } from '../constants/translations';

const ASYNC_KEYS = {
  LANGUAGE: '@uberclone_language',
  IS_AVAILABLE: '@uberclone_is_available',
  DRIVER_ID: '@uberclone_active_driver_id',
};

const DriverContext = createContext(null);

export function DriverProvider({ children }) {
  const [driver, setDriver] = useState(null);
  const [driverId, setDriverId] = useState(null);
  const [language, setLanguageState] = useState('es');
  const [isAvailable, setIsAvailableState] = useState(false);
  const [loading, setLoading] = useState(true);

  // Helper de traducción según el idioma activo
  const t = useCallback(
    (key) => {
      const langDict = TRANSLATIONS[language] || TRANSLATIONS.es;
      return langDict[key] || key;
    },
    [language]
  );

  // Cargar preferencias iniciales desde AsyncStorage
  useEffect(() => {
    async function loadPreferences() {
      try {
        const [savedLang, savedDriverId] = await Promise.all([
          AsyncStorage.getItem(ASYNC_KEYS.LANGUAGE),
          AsyncStorage.getItem(ASYNC_KEYS.DRIVER_ID),
        ]);

        if (savedLang) {
          setLanguageState(savedLang);
        }

        if (savedDriverId) {
          setDriverId(savedDriverId);
          await fetchDriverFromFirestore(savedDriverId);
        }
      } catch (error) {
        console.error('Error cargando preferencias de conductor:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, []);

  // Consultar conductor desde Firestore
  const fetchDriverFromFirestore = async (id) => {
    try {
      const docRef = doc(db, 'drivers', id);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        setDriver(data);

        // Si el conductor está 'pending', forzar disponibilidad a false
        if (data.status === 'pending') {
          setIsAvailableState(false);
          await AsyncStorage.setItem(ASYNC_KEYS.IS_AVAILABLE, 'false');
        } else {
          // Si está aprobado, restaurar disponibilidad guardada
          const savedAvailable = await AsyncStorage.getItem(ASYNC_KEYS.IS_AVAILABLE);
          setIsAvailableState(savedAvailable === 'true');
        }
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo conductor de Firestore:', error);
      return null;
    }
  };

  // Cambiar idioma (persiste en AsyncStorage)
  const setLanguage = async (newLang) => {
    try {
      setLanguageState(newLang);
      await AsyncStorage.setItem(ASYNC_KEYS.LANGUAGE, newLang);
    } catch (error) {
      console.error('Error guardando idioma:', error);
    }
  };

  // Cambiar disponibilidad con regla estricta:
  // Bloquear si el conductor está en estado 'pending'
  const setAvailability = async (available) => {
    if (available && (!driver || driver.status === 'pending')) {
      return {
        success: false,
        reason: 'pending',
        message: t('pendingNotice'),
      };
    }

    try {
      setIsAvailableState(available);
      await AsyncStorage.setItem(ASYNC_KEYS.IS_AVAILABLE, available ? 'true' : 'false');
      return { success: true };
    } catch (error) {
      console.error('Error guardando disponibilidad:', error);
      return { success: false, reason: 'storage_error', message: error.message };
    }
  };

  // Autenticar / Establecer conductor activo
  const loginDriver = async (idNumber) => {
    const cleanId = String(idNumber).trim();
    setDriverId(cleanId);
    await AsyncStorage.setItem(ASYNC_KEYS.DRIVER_ID, cleanId);
    const data = await fetchDriverFromFirestore(cleanId);
    return data;
  };

  // Cerrar sesión
  const logoutDriver = async () => {
    try {
      setDriver(null);
      setDriverId(null);
      setIsAvailableState(false);
      await AsyncStorage.multiRemove([ASYNC_KEYS.DRIVER_ID, ASYNC_KEYS.IS_AVAILABLE]);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const refreshDriver = async () => {
    if (driverId) {
      await fetchDriverFromFirestore(driverId);
    }
  };

  return (
    <DriverContext.Provider
      value={{
        driver,
        driverId,
        language,
        isAvailable,
        loading,
        t,
        setLanguage,
        setAvailability,
        loginDriver,
        logoutDriver,
        refreshDriver,
      }}
    >
      {children}
    </DriverContext.Provider>
  );
}

export function useDriver() {
  const context = useContext(DriverContext);
  if (!context) {
    throw new Error('useDriver debe usarse dentro de un DriverProvider');
  }
  return context;
}

