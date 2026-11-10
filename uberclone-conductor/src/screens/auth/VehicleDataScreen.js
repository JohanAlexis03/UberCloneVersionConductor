//captura de los datos del vehiculo
import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, useWindowDimensions, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_OPTIONS, COLOR_OPTIONS } from '../../constants/options';
import { isValidColombianPlate, isValidVehicleYear, isValidVehicleBrand, isValidVehicleModel } from '../../utils/validators';
import { uploadToCloudinary } from '../../services/cloudinary';
import { useRegistration } from '../../context/DriverRegistrationContext';
import FormScreen, { useScrollToEnd } from '../../components/FormScreen';
import FieldLabel from '../../components/FieldLabel';

export default function VehicleDataScreen({ navigation }) {
    //estado de la aplicacion
    const [category, setCategory] = useState('economy');
    const [plate, setPlate] = useState('');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [year, setYear] = useState('');
    const [color, setColor] = useState('');
    const [passengerCapacity, setPassengerCapacity] = useState('4');
    const [vehiclePhoto, setVehiclePhoto] = useState(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    //Estado de errores
    const [errors, setErrors] = useState({});

    const { updateVehicleData } = useRegistration();

    // Referencia al scroll para acercar los campos que quedan al final
    const scrollRef = useRef(null);
    const scrollToEnd = useScrollToEnd(scrollRef);

    // La foto del vehiculo se adapta al ancho real de la pantalla
    const { width } = useWindowDimensions();
    const photoHeight = Math.min(190, Math.round(width * 0.5));

    //funcion para escoger la foto del vehiculo
    const handlePickVehiclePhoto = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            setErrors((prev) => ({
                ...prev,
                vehiclePhoto: 'Se requiere permiso para acceder a la galería.',
            }));
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setUploadingPhoto(true);

            try {
                // Se guarda la URL de Cloudinary, no la ruta temporal del telefono.
                const url = await uploadToCloudinary(result.assets[0]);
                setVehiclePhoto(url);
                setErrors((prev) => ({ ...prev, vehiclePhoto: null }));
            } catch (error) {
                setErrors((prev) => ({
                    ...prev,
                    vehiclePhoto: error.message,
                }));
            } finally {
                setUploadingPhoto(false);
            }
        }
    };

    //formato placas colombianas
    const handlePlateChange = (val) => {
        const uppercaseVal = val.toUpperCase().trim();
        setPlate(uppercaseVal);

        if (errors.plate) {
            if (isValidColombianPlate(uppercaseVal)) {
                setErrors((prev) => ({ ...prev, plate: null }));
            }
        }
    };

    const validateForm = () => {
        const newErrors = {};

        //validacion estrictas sobre la categoria
        if (!category) {
            newErrors.category = 'Selecciona una categoría.';
        }
        //validacion de la placa colombiana
        if (!plate) {
            newErrors.plate = 'La placa es obligatoria.';
        } else if (!isValidColombianPlate(plate)) {
            newErrors.plate = 'Formato inválido. Ejemplo: ABC123';
        }

        //validacion de la marca obligatoria
        if (!brand.trim()) {
            newErrors.brand = 'La marca es obligatoria.';
        } else if (!isValidVehicleBrand(brand)) {
            newErrors.brand = 'Marca inválida. Solo letras (ej: Toyota).';
        }

        //validacion del modelo obligatorio
        if (!model.trim()) {
            newErrors.model = 'El modelo es obligatorio.';
        } else if (!isValidVehicleModel(model)) {
            newErrors.model = 'Modelo inválido. Solo letras y números (ej: J88).';
        }
        //validacion de año obligatorio
        if (!isValidVehicleYear(year)) {
            newErrors.year = `Año inválido (entre 1990 y ${new Date().getFullYear() + 1}).`;
        }
        //Validacion de color obligatorio
        if (!color) {
            newErrors.color = 'El color es obligatorio.';
        }
        //Capacidad minima y maxima segun la categoria
        const passengerMin = category === 'xl' ? 6 : 4;
        const passengerMax = category === 'xl' ? 8 : 5;
        const capacityValue = Number(passengerCapacity);

        if (
            !passengerCapacity ||
            !Number.isInteger(capacityValue) ||
            capacityValue < passengerMin ||
            capacityValue > passengerMax
        ) {
            newErrors.passengerCapacity = `La capacidad debe estar entre ${passengerMin} y ${passengerMax} pasajeros.`;
        }
        //no permite continuar sin la foto del vehiculo
        if (!vehiclePhoto) {
            newErrors.vehiclePhoto = 'La foto del vehículo es obligatoria.';
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    }

    //boton para guardar los datos del vehiculo
    const handleSaveVehicleData = () => {
        if (validateForm()) {
            updateVehicleData({
                category,
                plate: plate.trim().toUpperCase(),
                brand: brand.trim().replace(/\s+/g, ' '),
                model: model.trim().replace(/\s+/g, ' '),
                // Los campos numericos se guardan como numeros, no como texto
                year: Number(year),
                color,
                passengerCapacity: Number(passengerCapacity),
                vehiclePhoto,
            });
            navigation.navigate('Documents');
        }
    };

    //Renderizado de la interfaz de usuario
    return (
        <FormScreen scrollRef={scrollRef}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Datos del Vehículo</Text>
                <Text style={styles.headerSubtitle}>
                    Paso 2 de 3 — Información del vehículo
                </Text>
            </View>

            {/* Categoría */}
            <View style={styles.fieldGroup}>
                <FieldLabel icon="car-outline">Categoría *</FieldLabel>
                <View style={styles.optionsRow}>
                    {CATEGORY_OPTIONS.map((opt) => (
                        <TouchableOpacity
                            key={opt.value}
                            style={[
                                styles.optionChip,
                                category === opt.value && styles.optionChipSelected,
                            ]}
                            onPress={() => {
                                setCategory(opt.value);
                                if (errors.category) {
                                    setErrors((prev) => ({ ...prev, category: null }));
                                }
                            }}
                        >
                            <Text
                                style={[
                                    styles.optionChipText,
                                    category === opt.value && styles.optionChipTextSelected,
                                ]}
                            >
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
            </View>

            {/* Placa */}
            <View style={styles.fieldGroup}>
                <FieldLabel icon="pricetag-outline">Placa *</FieldLabel>
                <TextInput
                    style={[styles.input, errors.plate && styles.inputError]}
                    placeholder="ABC123"
                    placeholderTextColor="#9CA3AF"
                    value={plate}
                    onChangeText={handlePlateChange}
                    maxLength={6}
                    autoCapitalize="characters"
                    autoCorrect={false}
                />
                <Text style={styles.helperText}>3 letras y 3 números (ej: ABC123).</Text>
                {errors.plate && <Text style={styles.errorText}>{errors.plate}</Text>}
            </View>

            {/* Marca */}
            <View style={styles.fieldGroup}>
                <FieldLabel icon="business-outline">Marca *</FieldLabel>
                <TextInput
                    style={[styles.input, errors.brand && styles.inputError]}
                    placeholder="Ej: Toyota"
                    placeholderTextColor="#9CA3AF"
                    value={brand}
                    maxLength={30}
                    onChangeText={(val) => {
                        setBrand(val);
                        if (errors.brand) setErrors((prev) => ({ ...prev, brand: null }));
                    }}
                />
                {errors.brand && <Text style={styles.errorText}>{errors.brand}</Text>}
            </View>

            {/* Modelo */}
            <View style={styles.fieldGroup}>
                <FieldLabel icon="cube-outline">Modelo *</FieldLabel>
                <TextInput
                    style={[styles.input, errors.model && styles.inputError]}
                    placeholder="Ej: Corolla"
                    placeholderTextColor="#9CA3AF"
                    value={model}
                    maxLength={30}
                    onChangeText={(val) => {
                        setModel(val);
                        if (errors.model) setErrors((prev) => ({ ...prev, model: null }));
                    }}
                />
                {errors.model && <Text style={styles.errorText}>{errors.model}</Text>}
            </View>

            {/* Año */}
            <View style={styles.fieldGroup}>
                <FieldLabel icon="calendar-outline">Año *</FieldLabel>
                <TextInput
                    style={[styles.input, errors.year && styles.inputError]}
                    placeholder="Ej: 2020"
                    placeholderTextColor="#9CA3AF"
                    value={year}
                    keyboardType="numeric"
                    maxLength={4}
                    onChangeText={(val) => {
                        setYear(val);
                        if (errors.year) setErrors((prev) => ({ ...prev, year: null }));
                    }}
                />
                <Text style={styles.helperText}>Entre 1990 y el año actual.</Text>
                {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}
            </View>

            {/* Color */}
            <View style={styles.fieldGroup}>
                <FieldLabel icon="color-palette-outline">Color *</FieldLabel>
                <View style={styles.optionsRow}>
                    {COLOR_OPTIONS.map((opt) => (
                        <TouchableOpacity
                            key={opt.value}
                            style={[
                                styles.optionChip,
                                color === opt.value && styles.optionChipSelected,
                            ]}
                            onPress={() => {
                                setColor(opt.value);
                                if (errors.color) {
                                    setErrors((prev) => ({ ...prev, color: null }));
                                }
                            }}
                        >
                            <Text
                                style={[
                                    styles.optionChipText,
                                    color === opt.value && styles.optionChipTextSelected,
                                ]}
                            >
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                {errors.color && <Text style={styles.errorText}>{errors.color}</Text>}
            </View>

            {/* Capacidad de pasajeros */}
            <View style={styles.fieldGroup}>
                <FieldLabel icon="people-outline">Capacidad de pasajeros *</FieldLabel>
                <TextInput
                    style={[styles.input, errors.passengerCapacity && styles.inputError]}
                    placeholder="4"
                    placeholderTextColor="#9CA3AF"
                    value={passengerCapacity}
                    keyboardType="numeric"
                    maxLength={2}
                    onFocus={scrollToEnd}
                    onChangeText={(val) => {
                        setPassengerCapacity(val);
                        if (errors.passengerCapacity) {
                            setErrors((prev) => ({ ...prev, passengerCapacity: null }));
                        }
                    }}
                />
                <Text style={styles.helperText}>
                    XL: entre 6 y 8 pasajeros. Otras categorías: entre 4 y 5.
                </Text>
                {errors.passengerCapacity && (
                    <Text style={styles.errorText}>{errors.passengerCapacity}</Text>
                )}
            </View>

            {/* Foto del vehículo */}
            <View style={styles.photoSection}>
                <TouchableOpacity
                    style={[styles.photoContainer, { height: photoHeight }]}
                    onPress={handlePickVehiclePhoto}
                    activeOpacity={0.8}
                    disabled={uploadingPhoto}
                >
                    {uploadingPhoto ? (
                        <View style={styles.photoPlaceholder}>
                            <ActivityIndicator color="#111827" />
                            <Text style={styles.photoSubtext}>Subiendo...</Text>
                        </View>
                    ) : vehiclePhoto ? (
                        <Image source={{ uri: vehiclePhoto }} style={styles.photoPreview} />
                    ) : (
                        <View style={styles.photoPlaceholder}>
                            <Ionicons name="camera-outline" size={28} color="#6B7280" />
                            <Text style={styles.photoSubtext}>Subir foto</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <Text style={styles.helperText}>Foto donde se vea la placa.</Text>
                {errors.vehiclePhoto && (
                    <Text style={styles.errorText}>{errors.vehiclePhoto}</Text>
                )}
            </View>

            <TouchableOpacity
                style={styles.continueButton}
                onPress={handleSaveVehicleData}
                activeOpacity={0.8}
            >
                <Text style={styles.continueButtonText}>Continuar a Documentos →</Text>
            </TouchableOpacity>
        </FormScreen>
    );
}

const styles = StyleSheet.create({
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
    fieldGroup: {
        marginBottom: 16,
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
    photoSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    photoContainer: {
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
    },
    photoPreview: {
        width: '100%',
        height: '100%',
    },
    photoPlaceholder: {
        alignItems: 'center',
    },
    photoSubtext: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '600',
        marginTop: 2,
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