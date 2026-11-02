// AI-assisted: see docs/AI_LOG.md #4
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Image, } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GENDER_OPTIONS } from '../../constants/options';


export default function PersonalDataScreen({ navigation }) {
  // BLOCK 1: Component State for Form Fields
  // We use useState so React re-renders when values change.
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState(''); // Format: YYYY-MM-DD
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('es');

  // BLOCK 2: Inline Error State (Zero native Alert modals permitted)
  // An object containing field-specific error messages.
  const [errors, setErrors] = useState({});

  // BLOCK 3: Helper & Validation Functions

  // Pick or take a photo using expo-image-picker
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setErrors((prev) => ({
        ...prev,
        profilePhoto: 'Permission is required to access your gallery.',
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
      // Clear the photo error if it was previously set
      setErrors((prev) => ({ ...prev, profilePhoto: null }));
    }
  };

  // Validate that driver is at least 18 years old today
  const validateAge = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) {
      return 'Use YYYY-MM-DD format (example: 2000-05-15).';
    }

    const birth = new Date(dateString);
    if (isNaN(birth.getTime())) {
      return 'Invalid date.';
    }

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    if (age < 18) {
      return `Driver must be at least 18 years old (current: ${age} years).`;
    }
    return null;
  };

  // Validate all fields before advancing to Step 2
  const validateForm = () => {
    const newErrors = {};

    if (!profilePhoto) {
      newErrors.profilePhoto = 'Profile photo is required.';
    }

    // Name: letters and spaces only, max 50 characters
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{1,50}$/;
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    } else if (!nameRegex.test(fullName.trim())) {
      newErrors.fullName = 'Only letters and spaces allowed (max 50 characters).';
    }

    // ID document: 6 to 10 numeric digits
    const idRegex = /^\d{6,10}$/;
    if (!idNumber.trim()) {
      newErrors.idNumber = 'Identity document is required.';
    } else if (!idRegex.test(idNumber.trim())) {
      newErrors.idNumber = 'Must contain between 6 and 10 numeric digits.';
    }

    // Phone: exactly 10 digits
    const phoneRegex = /^\d{10}$/;
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    } else if (!phoneRegex.test(phone.trim())) {
      newErrors.phone = 'Phone number must have exactly 10 digits.';
    }

    // Birth date validation (+18 check)
    if (!birthDate.trim()) {
      newErrors.birthDate = 'Birth date is required.';
    } else {
      const ageError = validateAge(birthDate.trim());
      if (ageError) newErrors.birthDate = ageError;
    }

    // Gender selection
    if (!gender) {
      newErrors.gender = 'Please select your gender.';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Enter a valid email address.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save selected language to persistent AsyncStorage
  const handleLanguageChange = async (selectedLang) => {
    setLanguage(selectedLang);
    try {
      await AsyncStorage.setItem('driver_language', selectedLang);
    } catch (e) {
      console.warn('Error saving language preference', e);
    }
  };

  // Navigate to Step 2 if all fields are 100% valid
  const handleNext = () => {
    if (validateForm()) {
      navigation.navigate('VehicleData');
    }
  };

  // BLOCK 4: Screen JSX Layout
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
