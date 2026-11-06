// AI-assisted: see docs/AI_LOG.md #8
import React, { useCallback, useEffect, useRef } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native';
import { HeaderHeightContext } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Contenedor comun de los formularios.
 *
 * Resuelve tres cosas que se repiten en las tres pestanas:
 * 1. El teclado no tapa el campo que se esta editando.
 * 2. El contenido respeta las areas seguras (notch, barra inferior).
 * 3. El ancho se limita para que en tablets y horizontal no se estire.
 */
export default function FormScreen({ scrollRef, children }) {
    const insets = useSafeAreaInsets();

    // Alto del encabezado de navegacion. Si no existe, queda en 0.
    const headerHeight = React.useContext(HeaderHeightContext) ?? 0;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior="padding"
            keyboardVerticalOffset={headerHeight}
        >
            <ScrollView
                ref={scrollRef}
                style={styles.container}
                contentContainerStyle={[
                    styles.content,
                    { paddingBottom: 40 + insets.bottom },
                ]}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
            >
                {children}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

/**
 * Devuelve una funcion para usar en el onFocus de los campos que quedan
 * cerca del final de la pantalla. Espera a que el teclado termine de
 * animarse y recien ahi desplaza el contenido hasta el final.
 */
export function useScrollToEnd(scrollRef) {
    const timer = useRef(null);

    useEffect(() => () => clearTimeout(timer.current), []);

    return useCallback(() => {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            scrollRef.current?.scrollToEnd({ animated: true });
        }, 250);
    }, [scrollRef]);
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        width: '100%',
        maxWidth: 640,
        alignSelf: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
});
