// AI-assisted: see docs/AI_LOG.md #11
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDriver } from '../../context/DriverContext';

export default function SettingsScreen({ navigation }) {
  const { language, setLanguage, logoutDriver, t } = useDriver();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLanguageChange = (newLang) => {
    if (newLang !== language) {
      setLanguage(newLang);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      t('logoutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            await logoutDriver();
            if (navigation.canGoBack()) {
              navigation.popToTop();
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Barra de Encabezado */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Sección: Selector de Idioma */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="globe-outline" size={20} color="#111827" />
            <Text style={styles.cardTitle}>{t('languageSection')}</Text>
          </View>

          <TouchableOpacity
            style={[styles.languageOption, language === 'es' && styles.languageOptionSelected]}
            onPress={() => handleLanguageChange('es')}
            activeOpacity={0.8}
          >
            <View style={styles.languageTextContainer}>
              <Text style={styles.languageFlag}>🇨🇴</Text>
              <Text style={[styles.languageName, language === 'es' && styles.languageNameSelected]}>
                {t('spanish')}
              </Text>
            </View>
            <Ionicons
              name={language === 'es' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={language === 'es' ? '#000000' : '#9CA3AF'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.languageOption, language === 'en' && styles.languageOptionSelected, { borderBottomWidth: 0 }]}
            onPress={() => handleLanguageChange('en')}
            activeOpacity={0.8}
          >
            <View style={styles.languageTextContainer}>
              <Text style={styles.languageFlag}>🇺🇸</Text>
              <Text style={[styles.languageName, language === 'en' && styles.languageNameSelected]}>
                {t('english')}
              </Text>
            </View>
            <Ionicons
              name={language === 'en' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={language === 'en' ? '#000000' : '#9CA3AF'}
            />
          </TouchableOpacity>
        </View>

        {/* Sección: Notificaciones */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="notifications-outline" size={20} color="#111827" />
            <Text style={styles.cardTitle}>{t('notifications')}</Text>
          </View>
          <View style={styles.switchRow}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchLabel}>{t('notificationsDesc')}</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#D1D5DB', true: '#000000' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Sección: Información del Sistema y Términos */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#111827" />
            <Text style={styles.cardTitle}>{t('appInfo')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>{t('version')}</Text>
            <Text style={styles.infoValue}>1.0.0 (Build 32)</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View>
              <Text style={styles.infoKey}>{t('terms')}</Text>
              <Text style={styles.termsDescText}>{t('termsDesc')}</Text>
            </View>
          </View>
        </View>

        {/* Botón de Cierre de Sesión */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" style={{ marginRight: 8 }} />
          <Text style={styles.logoutButtonText}>{t('logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    borderRadius: 8,
  },
  languageOptionSelected: {
    backgroundColor: '#F3F4F6',
  },
  languageTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageFlag: {
    fontSize: 20,
    marginRight: 10,
  },
  languageName: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  languageNameSelected: {
    color: '#000000',
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  switchTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  switchLabel: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoKey: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  infoValue: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  termsDescText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 18,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
});

