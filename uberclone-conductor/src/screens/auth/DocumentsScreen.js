// AI-assisted: see docs/AI_LOG.md #11
import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, useWindowDimensions, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRegistration } from '../../context/DriverRegistrationContext';
import { useDriver } from '../../context/DriverContext';
import { db } from '../../config/firebase';
import { uploadToCloudinary } from '../../services/cloudinary';
import { isValidExpiryDate, isValidLicenseNumber } from '../../utils/validators';
import FormScreen, { useScrollToEnd } from '../../components/FormScreen';
import FieldLabel from '../../components/FieldLabel';
import DateField from '../../components/DateField';

export default function DocumentsScreen({ navigation }) {
    const {
        personalData,
        vehicleData,
        documentsData,
        updateDocumentsData,
    } = useRegistration();
    const { loginDriver } = useDriver();

    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    // Guarda el nombre del campo que se esta subiendo a Cloudinary
    const [uploadingField, setUploadingField] = useState(null);

    // Referencia al scroll para acercar los campos que quedan al final
    const scrollRef = useRef(null);
    const scrollToEnd = useScrollToEnd(scrollRef);

    // Las fotos de documentos se adaptan al ancho real de la pantalla
    const { width } = useWindowDimensions();
    const photoHeight = Math.min(190, Math.round(width * 0.5));

    // Seleccionar foto de un documento
    const pickDocumentPhoto = async (fieldName) => {
        try {
            const permission =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                setErrors((previous) => ({
                    ...previous,
                    [fieldName]: 'Necesitamos permiso para acceder a tus fotografías.',
                }));
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled) {
                setUploadingField(fieldName);

                try {
                    // Se sube la imagen y se guarda la URL de Cloudinary.
                    // La ruta file:// del telefono dejaria de existir al limpiar cache.
                    const url = await uploadToCloudinary(result.assets[0]);
                    updateField(fieldName, url);
                } catch (error) {
                    setErrors((previous) => ({
                        ...previous,
                        [fieldName]: error.message,
                    }));
                } finally {
                    setUploadingField(null);
                }
            }
        } catch (error) {
            setErrors((previous) => ({
                ...previous,
                [fieldName]: 'No se pudo seleccionar la imagen.',
            }));
        }
    };

    // Actualizar datos del formulario
    const updateField = (field, value) => {
        updateDocumentsData({ [field]: value });

        setErrors((previous) => ({
            ...previous,
            [field]: null,
        }));
    };

    // Las fechas de vencimiento deben ser posteriores a hoy, por eso el
    // calendario arranca en manana y no deja elegir hoy ni el pasado.
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // Vehículos con más de 5 años necesitan revisión técnico-mecánica.
    // Si todavía no hay año, se exige por seguridad.
    const vehicleAge = vehicleData.year
        ? new Date().getFullYear() - Number(vehicleData.year)
        : 0;
    const requiresTechInspection = !vehicleData.year || vehicleAge > 5;

    // Validar formulario
    const validateForm = () => {
        const newErrors = {};

        if (!documentsData.licenseNumber.trim()) {
            newErrors.licenseNumber = 'Ingresa el número de licencia.';
        } else if (!isValidLicenseNumber(documentsData.licenseNumber)) {
            newErrors.licenseNumber = 'Licencia inválida (6 a 16 caracteres alfanuméricos).';
        }

        if (!documentsData.licensePhoto) {
            newErrors.licensePhoto = 'Debes subir la foto de la licencia.';
        }

        if (!isValidExpiryDate(documentsData.licenseExpiry)) {
            newErrors.licenseExpiry = 'Selecciona una fecha posterior a hoy.';
        }

        if (!documentsData.soatPhoto) {
            newErrors.soatPhoto = 'Debes subir el SOAT.';
        }

        if (!isValidExpiryDate(documentsData.soatExpiry)) {
            newErrors.soatExpiry = 'Selecciona una fecha posterior a hoy.';
        }

        // La técnico-mecánica solo es obligatoria si el vehículo tiene más
        // de 5 años (spec de la Pestaña 3).
        if (requiresTechInspection) {
            if (!documentsData.techPhoto) {
                newErrors.techPhoto = 'Debes subir la revisión técnico-mecánica.';
            }

            if (!isValidExpiryDate(documentsData.techExpiry)) {
                newErrors.techExpiry = 'Selecciona una fecha posterior a hoy.';
            }
        }

        if (
            documentsData.mercadoPagoEmail.trim() &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(documentsData.mercadoPagoEmail)
        ) {
            newErrors.mercadoPagoEmail = 'Ingresa un correo válido.';
        }

        if (!documentsData.acceptedTerms) {
            newErrors.acceptedTerms = 'Debes aceptar los términos y condiciones.';
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    // Componente para cada documento
    const renderDocument = (
        icon,
        title,
        description,
        photoField,
        expiryField,
        optional = false
    ) => (
        <View style={styles.documentCard}>
            <FieldLabel icon={icon} style={styles.documentTitle}>
                {title}
            </FieldLabel>
            <Text style={styles.documentDescription}>
                {optional ? `${description} (opcional para tu vehículo)` : description}
            </Text>

            <TouchableOpacity
                style={[styles.photoButton, { height: photoHeight }]}
                onPress={() => pickDocumentPhoto(photoField)}
                disabled={uploadingField === photoField}
            >
                {uploadingField === photoField ? (
                    <View style={styles.photoPlaceholder}>
                        <ActivityIndicator color="#111827" />
                        <Text style={styles.photoText}>Subiendo...</Text>
                    </View>
                ) : documentsData[photoField] ? (
                    <Image
                        source={{ uri: documentsData[photoField] }}
                        style={styles.documentImage}
                    />
                ) : (
                    <View style={styles.photoPlaceholder}>
                        <Ionicons name="camera-outline" size={28} color="#6B7280" />
                        <Text style={styles.photoText}>Subir fotografía</Text>
                    </View>
                )}
            </TouchableOpacity>

            {errors[photoField] && (
                <Text style={styles.errorText}>{errors[photoField]}</Text>
            )}

            <FieldLabel icon="calendar-outline">Fecha de vencimiento</FieldLabel>

            <DateField
                value={documentsData[expiryField]}
                onChange={(value) => updateField(expiryField, value)}
                hasError={Boolean(errors[expiryField])}
                minimumDate={tomorrow}
                placeholder="Selecciona la fecha de vencimiento"
            />

            {errors[expiryField] && (
                <Text style={styles.errorText}>{errors[expiryField]}</Text>
            )}
        </View>
    );

    // El registro solo se puede enviar con las pestanas 1 y 2 completas
    const registrationComplete = Boolean(
        personalData.profilePhoto &&
        personalData.fullName &&
        personalData.idNumber &&
        personalData.phone &&
        personalData.birthDate &&
        personalData.gender &&
        personalData.email &&
        vehicleData.plate &&
        vehicleData.brand &&
        vehicleData.model &&
        vehicleData.year &&
        vehicleData.color &&
        vehicleData.vehiclePhoto
    );

    // Guardar documentos
    const handleSaveDocuments = async () => {
        if (!validateForm() || saving || saved) {
            return;
        }

        setSaving(true);
        setErrors((previous) => ({ ...previous, form: null }));

        try {
            // El documento se identifica con la cedula del conductor.
            // Asi la misma persona no genera un registro nuevo cada vez.
            const driverId = personalData.idNumber.trim();
            const driverRef = doc(db, 'drivers', driverId);

            // Normalizamos los textos una vez mas al escribir: lo que llega
            // a Firestore siempre va limpio, sin espacios ni mayusculas sueltas.
            await setDoc(driverRef, {
                personalData: {
                    ...personalData,
                    fullName: personalData.fullName.trim().replace(/\s+/g, ' '),
                    idNumber: driverId,
                    email: personalData.email.trim().toLowerCase(),
                },
                vehicleData: {
                    ...vehicleData,
                    plate: vehicleData.plate.trim().toUpperCase(),
                    brand: vehicleData.brand.trim().replace(/\s+/g, ' '),
                    model: vehicleData.model.trim().replace(/\s+/g, ' '),
                    // Se fuerzan a numero: Firestore distingue "4" de 4
                    year: Number(vehicleData.year),
                    passengerCapacity: Number(vehicleData.passengerCapacity),
                },
                documentsData: {
                    ...documentsData,
                    licenseNumber: documentsData.licenseNumber.trim().toUpperCase(),
                    mercadoPagoEmail: documentsData.mercadoPagoEmail.trim().toLowerCase(),
                    driverId,
                },
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            await loginDriver(driverId);
            updateDocumentsData({ driverId });
            setSaved(true);
        } catch (error) {
            setErrors((previous) => ({
                ...previous,
                form: 'No se pudo enviar el registro. Revisa tu conexión e inténtalo de nuevo.',
            }));
        } finally {
            setSaving(false);
        }
    };

    return (
        <FormScreen scrollRef={scrollRef}>
            <Text style={styles.title}>Documentación</Text>

            <Text style={styles.subtitle}>
                Sube los documentos necesarios para completar tu registro.
            </Text>

            {/* Licencia de conducción */}
            <View style={styles.documentCard}>
                <FieldLabel icon="id-card-outline" style={styles.documentTitle}>
                    Licencia de conducción
                </FieldLabel>

                <Text style={styles.documentDescription}>
                    Ingresa el número de tu licencia y adjunta una fotografía.
                </Text>

                <FieldLabel icon="barcode-outline">Número de licencia</FieldLabel>

                <TextInput
                    style={[
                        styles.input,
                        errors.licenseNumber && styles.inputError,
                    ]}
                    placeholder="Número de licencia"
                    placeholderTextColor="#999"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={16}
                    value={documentsData.licenseNumber}
                    onChangeText={(value) =>
                        updateField('licenseNumber', value.toUpperCase().trim())
                    }
                />

                {errors.licenseNumber && (
                    <Text style={styles.errorText}>{errors.licenseNumber}</Text>
                )}

                <TouchableOpacity
                    style={[styles.photoButton, { height: photoHeight }]}
                    onPress={() => pickDocumentPhoto('licensePhoto')}
                    disabled={uploadingField === 'licensePhoto'}
                >
                    {uploadingField === 'licensePhoto' ? (
                        <View style={styles.photoPlaceholder}>
                            <ActivityIndicator color="#111827" />
                            <Text style={styles.photoText}>Subiendo...</Text>
                        </View>
                    ) : documentsData.licensePhoto ? (
                        <Image
                            source={{ uri: documentsData.licensePhoto }}
                            style={styles.documentImage}
                        />
                    ) : (
                        <View style={styles.photoPlaceholder}>
                            <Ionicons name="camera-outline" size={28} color="#6B7280" />
                            <Text style={styles.photoText}>Subir licencia</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {errors.licensePhoto && (
                    <Text style={styles.errorText}>{errors.licensePhoto}</Text>
                )}

                <FieldLabel icon="calendar-outline">Fecha de vencimiento</FieldLabel>

                <DateField
                    value={documentsData.licenseExpiry}
                    onChange={(value) => updateField('licenseExpiry', value)}
                    hasError={Boolean(errors.licenseExpiry)}
                    minimumDate={tomorrow}
                    placeholder="Selecciona la fecha de vencimiento"
                />

                {errors.licenseExpiry && (
                    <Text style={styles.errorText}>{errors.licenseExpiry}</Text>
                )}
            </View>

            {/* SOAT */}
            {renderDocument(
                'shield-checkmark-outline',
                'SOAT',
                'Sube una fotografía del Seguro Obligatorio de Accidentes de Tránsito.',
                'soatPhoto',
                'soatExpiry'
            )}

            {/* Revisión técnico-mecánica */}
            {renderDocument(
                'construct-outline',
                'Revisión técnico-mecánica',
                'Adjunta el documento de la revisión técnico-mecánica.',
                'techPhoto',
                'techExpiry',
                !requiresTechInspection
            )}

            {/* Mercado Pago */}
            <View style={styles.documentCard}>
                <FieldLabel icon="wallet-outline" style={styles.documentTitle}>
                    Mercado Pago
                </FieldLabel>

                <Text style={styles.documentDescription}>
                    Ingresa el correo asociado a tu cuenta de Mercado Pago.
                </Text>

                <TextInput
                    style={[
                        styles.input,
                        errors.mercadoPagoEmail && styles.inputError,
                    ]}
                    placeholder="Correo electrónico"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={scrollToEnd}
                    value={documentsData.mercadoPagoEmail}
                    onChangeText={(value) =>
                        updateField('mercadoPagoEmail', value)
                    }
                />

                {errors.mercadoPagoEmail && (
                    <Text style={styles.errorText}>
                        {errors.mercadoPagoEmail}
                    </Text>
                )}
            </View>

            {/* Términos y condiciones */}
            <TouchableOpacity
                style={styles.termsContainer}
                onPress={() =>
                    updateField(
                        'acceptedTerms',
                        !documentsData.acceptedTerms
                    )
                }
            >
                <View
                    style={[
                        styles.checkbox,
                        documentsData.acceptedTerms && styles.checkboxSelected,
                    ]}
                >
                    {documentsData.acceptedTerms && (
                        <Text style={styles.checkmark}>✓</Text>
                    )}
                </View>

                <Text style={styles.termsText}>
                    Acepto los términos y condiciones del servicio y la comisión del 20 % por viaje.
                </Text>
            </TouchableOpacity>

            {errors.acceptedTerms && (
                <Text style={styles.errorText}>
                    {errors.acceptedTerms}
                </Text>
            )}

            {errors.form && (
                <Text style={styles.errorText}>{errors.form}</Text>
            )}

            {saved && (
                <View style={styles.savedCard}>
                    <Text style={styles.successText}>
                        ¡Registro enviado exitosamente! Tu cuenta quedó en estado pendiente de aprobación.
                    </Text>
                    <TouchableOpacity
                        style={styles.profileNavButton}
                        onPress={() => navigation.navigate('Profile')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="person-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.profileNavButtonText}>Ver mi Perfil de Conductor</Text>
                    </TouchableOpacity>
                </View>
            )}

            {!registrationComplete && !saved && (
                <Text style={styles.helperText}>
                    Completa las pestañas 1 y 2 para poder enviar tu registro.
                </Text>
            )}

            {/* Botón guardar */}
            {!saved && (
                <TouchableOpacity
                    style={[
                        styles.saveButton,
                        (!registrationComplete || saving) && styles.saveButtonDisabled,
                    ]}
                    onPress={handleSaveDocuments}
                    disabled={!registrationComplete || saving}
                >
                    <Text style={styles.saveButtonText}>
                        {saving ? 'Enviando...' : 'Finalizar registro'}
                    </Text>
                </TouchableOpacity>
            )}
        </FormScreen>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
        marginBottom: 20,
    },
    documentCard: {
        marginBottom: 20,
    },
    documentTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    documentDescription: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 12,
        lineHeight: 17,
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
        marginBottom: 12,
    },
    inputError: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
    },
    errorText: {
        fontSize: 12,
        color: '#EF4444',
        fontWeight: '600',
        marginTop: 4,
        marginBottom: 8,
    },
    photoButton: {
        width: '100%',
        height: 160,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: 16,
    },
    photoPlaceholder: {
        alignItems: 'center',
    },
    photoText: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '600',
        marginTop: 2,
    },
    documentImage: {
        width: '100%',
        height: '100%',
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 16,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        borderRadius: 6,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        backgroundColor: '#000000',
        borderColor: '#000000',
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    termsText: {
        flex: 1,
        fontSize: 13,
        color: '#374151',
        lineHeight: 18,
    },
    saveButton: {
        backgroundColor: '#000000',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 16,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    saveButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    helperText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    successText: {
        fontSize: 14,
        color: '#15803D',
        fontWeight: '600',
        marginBottom: 12,
        textAlign: 'center',
        lineHeight: 20,
    },
    savedCard: {
        backgroundColor: '#DCFCE7',
        borderWidth: 1,
        borderColor: '#BBF7D0',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        alignItems: 'center',
    },
    profileNavButton: {
        flexDirection: 'row',
        backgroundColor: '#000000',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    profileNavButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
});
