// AI-assisted: see docs/AI_LOG.md #8
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Etiqueta de campo con su icono.
 * Reemplaza el <Text style={styles.label}> que se repetia en cada campo.
 */
export default function FieldLabel({ icon, children, style }) {
    return (
        <View style={styles.row}>
            {icon ? (
                <Ionicons
                    name={icon}
                    size={16}
                    color="#6B7280"
                    style={styles.icon}
                />
            ) : null}
            <Text style={[styles.text, style]}>{children}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    icon: {
        marginRight: 6,
    },
    text: {
        flexShrink: 1,
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
    },
});
