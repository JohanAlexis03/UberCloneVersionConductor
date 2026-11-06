import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRegistration } from '../../context/DriverRegistrationContext';

export default function DocumentsScreen() {
    const {
        documentsData,
        updateDocumentsData,
    } = useRegistration();

    const [errors, setErrors] = useState({});

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
                updateField(fieldName, result.assets[0].uri);
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

    // Validar fecha de vencimiento
    const isValidExpiry = (date) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return false;
        }

        const [year, month, day] = date.split('-').map(Number);
        const parsedDate = new Date(year, month - 1, day);

        if (
            parsedDate.getFullYear() !== year ||
            parsedDate.getMonth() !== month - 1 ||
            parsedDate.getDate() !== day
        ) {
            return false;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return parsedDate > today;
    };

    // Validar formulario
    const validateForm = () => {
        const newErrors = {};

        if (!documentsData.licenseNumber.trim()) {
            newErrors.licenseNumber = 'Ingresa el número de licencia.';
        }

        if (!documentsData.licensePhoto) {
            newErrors.licensePhoto = 'Debes subir la foto de la licencia.';
        }

        if (!isValidExpiry(documentsData.licenseExpiry)) {
            newErrors.licenseExpiry = 'Ingresa la fecha de vencimiento (posterior a hoy).';
        }

        if (!documentsData.soatPhoto) {
            newErrors.soatPhoto = 'Debes subir el SOAT.';
        }

        if (!isValidExpiry(documentsData.soatExpiry)) {
            newErrors.soatExpiry = 'Ingresa la fecha de vencimiento (posterior a hoy).';
        }

        if (!documentsData.techPhoto) {
            newErrors.techPhoto = 'Debes subir la revisión técnico-mecánica.';
        }

        if (!isValidExpiry(documentsData.techExpiry)) {
            newErrors.techExpiry = 'Ingresa la fecha de vencimiento (posterior a hoy).';
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
        title,
        description,
        photoField,
        expiryField
    ) => (
        <View style={styles.documentCard}>
            <Text style={styles.documentTitle}>{title}</Text>
            <Text style={styles.documentDescription}>{description}</Text>

            <TouchableOpacity
                style={styles.photoButton}
                onPress={() => pickDocumentPhoto(photoField)}
            >
                {documentsData[photoField] ? (
                    <Image
                        source={{ uri: documentsData[photoField] }}
                        style={styles.documentImage}
                    />
                ) : (
                    <View style={styles.photoPlaceholder}>
                        <Text style={styles.photoIcon}>📷</Text>
                        <Text style={styles.photoText}>Subir fotografía</Text>
                    </View>
                )}
            </TouchableOpacity>

            {errors[photoField] && (
                <Text style={styles.errorText}>{errors[photoField]}</Text>
            )}

            <Text style={styles.inputLabel}>Fecha de vencimiento</Text>

            <TextInput
                style={[
                    styles.input,
                    errors[expiryField] && styles.inputError,
                ]}
                placeholder="AAAA-MM-DD"
                placeholderTextColor="#999"
                value={documentsData[expiryField]}
                onChangeText={(value) => updateField(expiryField, value)}
            />

            {errors[expiryField] && (
                <Text style={styles.errorText}>{errors[expiryField]}</Text>
            )}
        </View>
    );

    // Guardar documentos
    const handleSaveDocuments = () => {
        if (!validateForm()) {
            return;
        }

        // El envio final del registro se conecta en la siguiente etapa
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <Text style={styles.title}>Documentación</Text>

            <Text style={styles.subtitle}>
                Sube los documentos necesarios para completar tu registro.
            </Text>

            {/* Licencia de conducción */}
            <View style={styles.documentCard}>
                <Text style={styles.documentTitle}>
                    Licencia de conducción
                </Text>

                <Text style={styles.documentDescription}>
                    Ingresa el número de tu licencia y adjunta una fotografía.
                </Text>

                <Text style={styles.inputLabel}>Número de licencia</Text>

                <TextInput
                    style={[
                        styles.input,
                        errors.licenseNumber && styles.inputError,
                    ]}
                    placeholder="Número de licencia"
                    placeholderTextColor="#999"
                    value={documentsData.licenseNumber}
                    onChangeText={(value) => updateField('licenseNumber', value)}
                />

                {errors.licenseNumber && (
                    <Text style={styles.errorText}>{errors.licenseNumber}</Text>
                )}

                <TouchableOpacity
                    style={styles.photoButton}
                    onPress={() => pickDocumentPhoto('licensePhoto')}
                >
                    {documentsData.licensePhoto ? (
                        <Image
                            source={{ uri: documentsData.licensePhoto }}
                            style={styles.documentImage}
                        />
                    ) : (
                        <View style={styles.photoPlaceholder}>
                            <Text style={styles.photoIcon}>📷</Text>
                            <Text style={styles.photoText}>Subir licencia</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {errors.licensePhoto && (
                    <Text style={styles.errorText}>{errors.licensePhoto}</Text>
                )}

                <Text style={styles.inputLabel}>Fecha de vencimiento</Text>

                <TextInput
                    style={[
                        styles.input,
                        errors.licenseExpiry && styles.inputError,
                    ]}
                    placeholder="AAAA-MM-DD"
                    placeholderTextColor="#999"
                    value={documentsData.licenseExpiry}
                    onChangeText={(value) => updateField('licenseExpiry', value)}
                />

                {errors.licenseExpiry && (
                    <Text style={styles.errorText}>{errors.licenseExpiry}</Text>
                )}
            </View>

            {/* SOAT */}
            {renderDocument(
                'SOAT',
                'Sube una fotografía del Seguro Obligatorio de Accidentes de Tránsito.',
                'soatPhoto',
                'soatExpiry'
            )}

            {/* Revisión técnico-mecánica */}
            {renderDocument(
                'Revisión técnico-mecánica',
                'Adjunta el documento de la revisión técnico-mecánica.',
                'techPhoto',
                'techExpiry'
            )}

            {/* Mercado Pago */}
            <View style={styles.documentCard}>
                <Text style={styles.documentTitle}>Mercado Pago</Text>

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

            {/* Botón guardar */}
            <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveDocuments}
            >
                <Text style={styles.saveButtonText}>
                    Finalizar registro
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
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
    inputLabel: {
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
    photoIcon: {
        fontSize: 28,
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
});
