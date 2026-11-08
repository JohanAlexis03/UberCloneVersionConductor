// AI-assisted: see docs/AI_LOG.md #9
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { formatIsoDate, parseIsoDate } from '../utils/validators';

/**
 * Campo de fecha que abre el calendario del sistema.
 * Ya no se puede escribir "40" o "32" a mano: el calendario solo
 * permite fechas que existen.
 */
export default function DateField({
    value,
    onChange,
    placeholder = 'Selecciona una fecha',
    hasError,
    minimumDate,
    maximumDate,
}) {
    const [open, setOpen] = useState(false);
    // En iOS el spinner se mueve sin cerrar el componente; el borrador
    // guarda lo que se ve y solo se confirma al tocar "Listo".
    const [draft, setDraft] = useState(null);

    // Si todavia no hay fecha, el calendario abre en la fecha limite permitida
    const selected =
        parseIsoDate(value) ?? maximumDate ?? minimumDate ?? new Date();
    const shown = draft ?? selected;

    const handleChange = (event, date) => {
        // Android: el dialogo se cierra solo y devuelve la fecha elegida
        if (Platform.OS === 'android') {
            setOpen(false);
            if (event.type === 'dismissed' || !date) return;
            onChange(formatIsoDate(date));
            return;
        }

        if (event.type === 'dismissed' || !date) return;
        setDraft(date);
    };

    const handleDone = () => {
        if (draft) onChange(formatIsoDate(draft));
        setDraft(null);
        setOpen(false);
    };

    return (
        <View>
            <TouchableOpacity
                style={[styles.field, hasError && styles.fieldError]}
                onPress={() => {
                    setDraft(null);
                    setOpen(true);
                }}
                activeOpacity={0.8}
            >
                <Text style={value ? styles.value : styles.placeholderText}>
                    {value || placeholder}
                </Text>
                <Ionicons name="calendar-outline" size={18} color="#6B7280" />
            </TouchableOpacity>

            {open && (
                <View style={Platform.OS === 'ios' ? styles.iosPicker : null}>
                    <DateTimePicker
                        value={shown}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        minimumDate={minimumDate}
                        maximumDate={maximumDate}
                        onChange={handleChange}
                    />

                    {Platform.OS === 'ios' && (
                        <TouchableOpacity
                            style={styles.doneButton}
                            onPress={handleDone}
                        >
                            <Text style={styles.doneText}>Listo</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    field: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    fieldError: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
    },
    value: {
        fontSize: 15,
        color: '#111827',
    },
    placeholderText: {
        fontSize: 15,
        color: '#9CA3AF',
    },
    iosPicker: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        marginTop: 8,
        paddingBottom: 8,
    },
    doneButton: {
        alignSelf: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    doneText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
});
