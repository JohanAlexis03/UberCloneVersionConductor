// AI-assisted: see docs/AI_LOG.md #4
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Image, } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GENDER_OPTIONS } from '../../constants/options';
import { isValidFullName, isValidColombianId, isValidPhone, isValidEmail, validateAge } from '../../utils/validators';



export default function PersonalDataScreen({ navigation }) {
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('es');

  const [errors, setErrors] = useState({});

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setErrors((prev) => ({
        ...prev,
        profilePhoto: 'Se requiere permiso para acceder a la galería.',
      }));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfilePhoto(result.assets[0].uri);
      setErrors((prev) => ({ ...prev, profilePhoto: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!profilePhoto) {
      newErrors.profilePhoto = 'La foto de perfil es obligatoria.';
    }

    if (!fullName.trim()) {
      newErrors.fullName = 'El nombre completo es obligatorio.';
    } else if (!isValidFullName(fullName.trim())) {
      newErrors.fullName = 'Solo se permiten letras y espacios (máximo 50 caracteres).';
    }

    if (!idNumber.trim()) {
      newErrors.idNumber = 'El documento de identidad es obligatorio.';
    } else if (!isValidColombianId(idNumber.trim())) {
      newErrors.idNumber = 'Debe contener entre 6 y 10 dígitos numéricos.';
    }

    if (!phone.trim()) {
      newErrors.phone = 'El número de celular es obligatorio.';
    } else if (!isValidPhone(phone.trim())) {
      newErrors.phone = 'El número celular debe tener exactamente 10 dígitos.';
    }

    if (!birthDate.trim()) {
      newErrors.birthDate = 'La fecha de nacimiento es obligatoria.';
    } else {
      const ageError = validateAge(birthDate.trim());
      if (ageError) newErrors.birthDate = ageError;
    }

    if (!gender) {
      newErrors.gender = 'Por favor selecciona tu género.';
    }

    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio.';
    } else if (!isValidEmail(email.trim())) {
      newErrors.email = 'Ingresa un correo electrónico válido.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLanguageChange = async (selectedLang) => {
    setLanguage(selectedLang);
    try {
      await AsyncStorage.setItem('driver_language', selectedLang);
    } catch (e) {
      console.warn('Error al guardar el lenguaje de preferencia', e);
    }
  };

  const handleNext = () => {
    if (validateForm()) {
      navigation.navigate('VehicleData');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Datos Personales</Text>
        <Text style={styles.headerSubtitle}>
          Paso 1 de 3 — Información básica del conductor
        </Text>
      </View>

      {/* Profile Photo Section */}
      <View style={styles.photoSection}>
        <TouchableOpacity
          style={styles.photoContainer}
          onPress={handlePickImage}
          activeOpacity={0.8}
        >
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.photoPreview} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>📷</Text>
              <Text style={styles.photoSubtext}>Subir foto</Text>
            </View>
          )}
        </TouchableOpacity>
        {errors.profilePhoto && (
          <Text style={styles.errorText}>{errors.profilePhoto}</Text>
        )}
      </View>

      {/* Full Name Field */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Nombre Completo *</Text>
        <TextInput
          style={[styles.input, errors.fullName && styles.inputError]}
          placeholder="Ej: Carlos Alberto Gómez"
          placeholderTextColor="#9CA3AF"
          value={fullName}
          maxLength={50}
          onChangeText={(val) => {
            setFullName(val);
            if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: null }));
          }}
        />
        {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
      </View>

      {/* Identity Document Field */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Documento de Identidad (C.C.) *</Text>
        <TextInput
          style={[styles.input, errors.idNumber && styles.inputError]}
          placeholder="Ej: 1020304050"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          maxLength={10}
          value={idNumber}
          onChangeText={(val) => {
            setIdNumber(val);
            if (errors.idNumber) setErrors((prev) => ({ ...prev, idNumber: null }));
          }}
        />
        {errors.idNumber && <Text style={styles.errorText}>{errors.idNumber}</Text>}
      </View>

      {/* Phone Number Field */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Número de Celular *</Text>
        <TextInput
          style={[styles.input, errors.phone && styles.inputError]}
          placeholder="Ej: 3001234567"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          maxLength={10}
          value={phone}
          onChangeText={(val) => {
            setPhone(val);
            if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }));
          }}
        />
        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
      </View>

      {/* Birth Date Field */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Fecha de Nacimiento</Text>
        <TextInput
          style={[styles.input, errors.birthDate && styles.inputError]}
          placeholder="Ej: 1995-08-24"
          placeholderTextColor="#9CA3AF"
          value={birthDate}
          maxLength={10}
          onChangeText={(val) => {
            setBirthDate(val);
            if (errors.birthDate) setErrors((prev) => ({ ...prev, birthDate: null }));
          }}
        />
        <Text style={styles.helperText}>Debes ser mayor de 18 años.</Text>
        {errors.birthDate && <Text style={styles.errorText}>{errors.birthDate}</Text>}
      </View>

      {/* Gender Selection */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Género *</Text>
        <View style={styles.optionsRow}>
          {GENDER_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.optionChip,
                gender === opt.value && styles.optionChipSelected,
              ]}
              onPress={() => {
                setGender(opt.value);
                if (errors.gender) setErrors((prev) => ({ ...prev, gender: null }));
              }}
            >
              <Text
                style={[
                  styles.optionChipText,
                  gender === opt.value && styles.optionChipTextSelected,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
      </View>

      {/* Email Field */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Correo Electrónico *</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="conductor@correo.com"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(val) => {
            setEmail(val);
            if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
          }}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      {/* Language Preference Section */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Idioma Preferido (AsyncStorage)</Text>
        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={[
              styles.optionChip,
              language === 'es' && styles.optionChipSelected,
            ]}
            onPress={() => handleLanguageChange('es')}
          >
            <Text
              style={[
                styles.optionChipText,
                language === 'es' && styles.optionChipTextSelected,
              ]}
            >
              🇨🇴 Español (es)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.optionChip,
              language === 'en' && styles.optionChipSelected,
            ]}
            onPress={() => handleLanguageChange('en')}
          >
            <Text
              style={[
                styles.optionChipText,
                language === 'en' && styles.optionChipTextSelected,
              ]}
            >
              🇺🇸 English (en)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Continue to Step 2 Button */}
      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleNext}
        activeOpacity={0.8}
      >
        <Text style={styles.continueButtonText}>Continuar a Datos del Vehículo →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// BLOCK 5: Visual Styling (StyleSheet)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 28,
  },
  photoSubtext: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionChipSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  optionChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  optionChipTextSelected: {
    color: '#FFFFFF',
  },
  continueButton: {
    backgroundColor: '#000000',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
