// AI-assisted: see docs/AI_LOG.md #11
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDriver } from '../../context/DriverContext';

export default function ProfileScreen({ navigation }) {
  const { driver, loading, refreshDriver, t } = useDriver();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshDriver();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  const personal = driver?.personalData || {};
  const vehicle = driver?.vehicleData || {};
  const docs = driver?.documentsData || {};
  const isPending = !driver || driver.status === 'pending';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>{t('profile')}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.settingsIconBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Avatar y Nombre Principal */}
        <View style={styles.avatarSection}>
          {personal.profilePhoto ? (
            <Image source={{ uri: personal.profilePhoto }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={54} color="#9CA3AF" />
            </View>
          )}
          <Text style={styles.driverName}>{personal.fullName || 'Conductor'}</Text>
          <Text style={styles.driverSubtext}>
            {personal.idNumber ? `C.C. ${personal.idNumber}` : 'Sin Cédula Registrada'}
          </Text>
        </View>

        {/* Tarjeta de Estado de Validación */}
        <View style={[styles.statusCard, isPending ? styles.statusPendingCard : styles.statusApprovedCard]}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={isPending ? 'time-outline' : 'checkmark-circle-outline'}
              size={22}
              color={isPending ? '#B45309' : '#15803D'}
            />
            <Text style={[styles.statusTitle, isPending ? styles.statusPendingText : styles.statusApprovedText]}>
              {isPending ? t('statusPending') : t('statusApproved')}
            </Text>
          </View>
          {isPending && <Text style={styles.statusNotice}>{t('pendingNotice')}</Text>}
        </View>

        {/* Sección: Datos Personales */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle-outline" size={20} color="#111827" />
            <Text style={styles.cardTitle}>{t('personalInfo')}</Text>
          </View>
          <InfoRow label={t('email')} value={personal.email} icon="mail-outline" />
          <InfoRow label={t('phone')} value={personal.phone} icon="call-outline" />
          <InfoRow label={t('idNumber')} value={personal.idNumber} icon="card-outline" isLast />
        </View>

        {/* Sección: Datos del Vehículo */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="car-outline" size={20} color="#111827" />
            <Text style={styles.cardTitle}>{t('vehicleInfo')}</Text>
          </View>
          <InfoRow label={t('plate')} value={vehicle.plate} icon="barcode-outline" highlight />
          <InfoRow
            label={t('brandModel')}
            value={vehicle.brand && vehicle.model ? `${vehicle.brand} ${vehicle.model}` : null}
            icon="car-sport-outline"
          />
          <InfoRow label={t('year')} value={vehicle.year ? String(vehicle.year) : null} icon="calendar-outline" />
          <InfoRow label={t('category')} value={vehicle.category ? vehicle.category.toUpperCase() : null} icon="star-outline" />
          <InfoRow
            label={t('capacity')}
            value={vehicle.passengerCapacity ? `${vehicle.passengerCapacity} pasajeros` : null}
            icon="people-outline"
            isLast
          />
        </View>

        {/* Sección: Documentación y Pagos */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text-outline" size={20} color="#111827" />
            <Text style={styles.cardTitle}>{t('documentsInfo')}</Text>
          </View>
          <InfoRow label={t('licenseNumber')} value={docs.licenseNumber} icon="id-card-outline" />
          <InfoRow label={t('soatExpiry')} value={docs.soatExpiry} icon="shield-checkmark-outline" />
          {docs.techExpiry ? (
            <InfoRow label={t('techExpiry')} value={docs.techExpiry} icon="construct-outline" />
          ) : null}
          <InfoRow
            label={t('mercadoPago')}
            value={docs.mercadoPagoEmail || 'No configurado'}
            icon="wallet-outline"
            isLast
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, icon, isLast = false, highlight = false }) {
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <View style={styles.infoLabelContainer}>
        {icon && <Ionicons name={icon} size={16} color="#6B7280" style={styles.infoIcon} />}
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, highlight && styles.infoHighlight]}>
        {value || '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  settingsIconBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatarImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: '#000000',
  },
  avatarPlaceholder: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  driverName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  driverSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  statusCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  statusPendingCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  statusApprovedCard: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  statusPendingText: {
    color: '#B45309',
  },
  statusApprovedText: {
    color: '#15803D',
  },
  statusNotice: {
    fontSize: 13,
    color: '#92400E',
    marginTop: 6,
    lineHeight: 18,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    maxWidth: '55%',
    textAlign: 'right',
  },
  infoHighlight: {
    color: '#000000',
    fontWeight: '800',
    letterSpacing: 1,
  },
});

