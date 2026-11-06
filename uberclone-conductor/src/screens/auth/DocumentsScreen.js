import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Image, } from 'react-native';
import * as ImagePicker from 'expo-image-picker';


export default function DocumentsScreen({ navigation }) {
    const [licenseNumber, setLicenseNumber] = useState('');
    const [licensePhoto, setLicensePhoto] = useState(null);
    const [licenseExpiry, setLicenseExpiry] = useState('');
    const [soatPhoto, setSoatPhoto] = useState(null);
    const [soatExpiry, setSoatExpiry] = useState('');
    const [techPhoto, setTechPhoto] = useState(null);
    const [techExpiry, setTechExpiry] = useState('');
    const [mercadoPagoEmail, setMercadoPagoEmail] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    //estado para guardar errores
    const [errors, setErrors] = useState({});

    // Selecciona una foto de la galería y la asigna al campo indicado
    const pickDocumentPhoto = async (setPhoto, fieldName) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            setErrors((prev) => ({
                ...prev,
                [fieldName]: 'Se requiere permiso para acceder a la galería.',
            }));
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets?.length > 0) {
            setPhoto(result.assets[0].uri);
            setErrors((prev) => ({ ...prev, [fieldName]: null }));
        }
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Documentos — en construcción</Text>
        </View>
    );
}
const styles = StyleSheet.create({})


