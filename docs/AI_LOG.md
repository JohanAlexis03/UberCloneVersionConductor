# Bitácora de Asistencia con Inteligencia Artificial (AI_LOG)

Este documento registra cronológicamente cada intervención, diseño arquitectónico y bloque de código generado con asistencia de Inteligencia Artificial en el proyecto **UberClone — Versión Conductor**, cumpliendo estrictamente con el protocolo técnico de trazabilidad y autoría definido en [PROMPT_MAESTRO.md](file:///Users/alexis/Documents/ProyectoUberCloneVerConduc/docs/PROMPT_MAESTRO.md).

---

## Plantilla Oficial de Registro

Cada módulo o avance realizado con asistencia de IA debe documentarse usando esta estructura:

```markdown
### Entrada #N
- **Fecha:** YYYY-MM-DD
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** [Objetivo del módulo o funcionalidad]
- **Prompt:** "[Prompt exacto utilizado]"
- **Resumen de la respuesta:** [Resumen conciso de 2 a 3 líneas sobre lo entregado]
- **Qué se usó / modificó / descartó:** [Decisiones técnicas, qué se adoptó y qué se descartó]
- **Archivos y commit:** [Rutas relativas de archivos creados/modificados] — [Hash del commit]
- **Verificación:** [Cómo se probó y validó técnica o visualmente]
- **Aprendizaje:** [Concepto arquitectónico o lección técnica aprendida]
```

---

### Entrada #1 (Commit 1/32)
- **Fecha:** 2026-11-02
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** Inicializar la estructura base de Expo en React Native y carpetas de arquitectura y documentación.
- **Prompt:** "chore: initialize expo app structure and docs directory"
- **Resumen de la respuesta:** Se configuró el proyecto base con Expo SDK 57, React 19, navegación por React Navigation, react-native-maps y estructura inicial de carpetas `src/` y `docs/`.
- **Qué se usó / modificó / descartó:** Se adoptó Expo para desarrollo ágil y multiplataforma; se descartó CLI nativo para simplificar pruebas en Expo Go.
- **Archivos y commit:** `uberclone-conductor/package.json`, `uberclone-conductor/app.json`, `docs/PROMPT_MAESTRO.md`, `README.md` — `dbff148`
- **Verificación:** Inicio correcto del bundler de Metro y lectura de dependencias sin conflictos.
- **Aprendizaje:** Estructuración de un monorepo ligero con soporte de documentación técnica centralizada.

---

### Entrada #2 (Commit 2/32)
- **Fecha:** 2026-11-02
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** Implementar motor de cálculo de tarifas puras en COP, comisión de la plataforma y ganancias del conductor.
- **Prompt:** "feat(config): add pricing module with pure calculateFare function"
- **Resumen de la respuesta:** Se implementó `pricing.js` exportando constantes oficiales (`baseFare: 3500`, `perKm: 1200`, `perMin: 250`, `minFare: 6000`, `commissionRate: 0.20`), función pura `calculateFare` con redondeo a múltiplos de 100 COP y helper `formatCOP`.
- **Qué se usó / modificó / descartó:** Se aplicó manejo estricto de números enteros en pesos colombianos para evitar errores de coma flotante. Las propinas van 100% al conductor.
- **Archivos y commit:** `uberclone-conductor/src/config/pricing.js` — `f66eec5`
- **Verificación:** Pruebas unitarias de cálculo con categoría economy, xl y premium, validando piso de tarifa mínima de $6.000 COP y cálculo de comisión exacto del 20%.
- **Aprendizaje:** Separación de funciones matemáticas puras fuera del ciclo de vida de React para testing predecible y cero efectos secundarios.

---

### Entrada #3 (Commit 3/32)
- **Fecha:** 2026-11-02
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** Configurar Bottom Tabs para las 3 pestañas de registro del conductor.
- **Prompt:** "feat(nav): setup bottom tabs navigation for registration"
- **Resumen de la respuesta:** Se implementó `RegisterTabsNavigator.js` utilizando `createBottomTabNavigator` con las rutas `PersonalData`, `VehicleData` y `Documents`, barra de navegación inferior estilizada y placeholders interactivos de avance de paso.
- **Qué se usó / modificó / descartó:** Se utilizó `@react-navigation/bottom-tabs` ya disponible en dependencias base; se descartó `material-top-tabs` para evitar instalar dependencias nativas adicionales.
- **Archivos y commit:** `uberclone-conductor/src/navigation/RegisterTabsNavigator.js` — `2b2bb75`
- **Verificación:** Validación del árbol de rutas de navegación y transiciones entre pasos.
- **Aprendizaje:** Orquestación de flujos multipaso mediante navegación por pestañas desacoplada.

---

### Entrada #4 (Commit 4/32)
- **Fecha:** 2026-11-02
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** Implementar la Pestaña 1 (Datos Personales) con validaciones en línea en tiempo real, selección de foto de perfil y persistencia de idioma en AsyncStorage.
- **Prompt:** "feat(auth): implement PersonalDataScreen layout and inline validations"
- **Resumen de la respuesta:** Se construyó `PersonalDataScreen.js` y las constantes en `options.js`, aplicando validaciones en línea bajo cada campo (nombre con regex, documento, celular de 10 dígitos, fecha +18 años, formato correo e idioma) sin usar `Alert`.
- **Qué se usó / modificó / descartó:** Se usó `expo-image-picker` para foto de perfil y cálculo de edad; se descartó `Alert` respetando la regla estricta de validación visual en línea.
- **Archivos y commit:** `uberclone-conductor/src/screens/auth/PersonalDataScreen.js`, `uberclone-conductor/src/constants/options.js`, `uberclone-conductor/src/navigation/RegisterTabsNavigator.js` — `c9157c8`
- **Verificación:** Validación interactiva en Expo Go con feedback inmediato bajo cada input al tocar los campos.
- **Aprendizaje:** Manejo de estado granular de errores por campo (`errors[field]`) en React Native para garantizar una UX sin interrupciones modales.

---

### Entrada #5 (Commit 5/32)
- **Fecha:** 2026-11-02
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** Implementar la Pestaña 2 (Datos del Vehículo) con selector de categoría, formateo de placa colombiana en mayúsculas (ABC123), validaciones de año, regla condicional de capacidad de pasajeros (mínimo 6 para XL) y carga de foto del vehículo.
- **Prompt:** "feat(auth): implement Tab 2 vehicle data screen layout and inline validations"
- **Resumen de la respuesta:** Se creó `VehicleDataScreen.js` con campos de categoría, placa con auto-uppercase, marca, modelo, año (1990-actual), selector de color, capacidad condicional y foto de vehículo con `expo-image-picker`. Se agregaron opciones en `options.js` y se integró en `RegisterTabsNavigator.js`.
- **Qué se usó / modificó / descartó:** Se implementó validación en línea de placa mediante regex colombiano `^[A-Z]{3}\d{3}$` y lógica condicional de capacidad según la categoría seleccionada; se descartó `Alert` para mantener coherencia visual.
- **Archivos y commit:** `uberclone-conductor/src/screens/auth/VehicleDataScreen.js`, `uberclone-conductor/src/constants/options.js`, `uberclone-conductor/src/navigation/RegisterTabsNavigator.js` — `[5af590e]`
- **Verificación:** Validación visual en Expo Go del paso de pestaña, auto-formateo de placa y mensajes en línea al cambiar de categoría.
- **Aprendizaje:** Implementación de validaciones dependientes del estado cruzado (categoría vs capacidad de pasajeros) en formularios reactivos.
---

### Entrada #6 (Commit 6/32)
- **Fecha:** 2026-11-06
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** Configurar Firebase (Firestore y Auth) en el proyecto Expo con las credenciales protegidas en variables de entorno.
- **Prompt:** "Configurar Firebase en el proyecto Expo, crear el archivo de conexion y las variables de entorno"
- **Resumen de la respuesta:** Se instalo el SDK de JavaScript de Firebase y se creo `src/config/firebase.js` con `initializeApp`, `initializeAuth` con persistencia en `AsyncStorage` y `getFirestore`, leyendo las credenciales desde `EXPO_PUBLIC_FIREBASE_*`.
- **Qué se usó / modificó / descartó:** Se uso el SDK de JavaScript (compatible con Expo Go) en lugar de `@react-native-firebase` para no requerir un development build; se descarto versionar el `.env` real y se creo `.env.example` sin valores.
- **Archivos y commit:** `uberclone-conductor/src/config/firebase.js`, `uberclone-conductor/.env.example`, `uberclone-conductor/package.json` — `856a526`
- **Verificación:** Lectura de un documento inexistente en Firestore desde Expo Go, confirmando la conexion sin crear datos.
- **Aprendizaje:** Las variables `EXPO_PUBLIC_*` se inyectan al construir el bundle, por lo que exigen reiniciar Metro con `--clear`; en React Native la persistencia de Auth se configura con `getReactNativePersistence(AsyncStorage)`.

---

### Entrada #7 (Commit 7/32)
- **Fecha:** 2026-11-06
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** Guardar el registro completo del conductor en Firestore con estado `pending` y bloquear el envio hasta completar las tres pestanas.
- **Prompt:** "Guardar el registro del conductor en Firestore y agregar el log de IA"
- **Resumen de la respuesta:** Las pestanas 1 y 2 escriben sus datos en `DriverRegistrationContext` al validar, y la pestana 3 envia un documento a la coleccion `drivers` con los tres bloques de datos, `status: 'pending'` y marcas de tiempo del servidor.
- **Qué se usó / modificó / descartó:** Se uso `doc(collection(db, 'drivers'))` para generar el ID del conductor, `setDoc` con `serverTimestamp()` y una bandera `registrationComplete` derivada del contexto; se descarto `Alert` para los mensajes de exito y error.
- **Archivos y commit:** `uberclone-conductor/src/screens/auth/PersonalDataScreen.js`, `uberclone-conductor/src/screens/auth/VehicleDataScreen.js`, `uberclone-conductor/src/screens/auth/DocumentsScreen.js`, `uberclone-conductor/src/context/DriverRegistrationContext.js` — `817a5da`
- **Verificación:** Pendiente en Expo Go: completar las tres pestanas, enviar el registro y revisar la coleccion `drivers` en la consola de Firestore con `status: pending`.
- **Aprendizaje:** El estado compartido entre pestanas se resuelve con Context, y `serverTimestamp()` garantiza que la fecha la escriba el servidor y no el dispositivo.
---

### Entrada #8 (Commit 8/32)
- **Fecha:** 2026-11-06
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** Mejorar la interfaz de las tres pestañas con iconos, respeto de las áreas seguras, diseño adaptable al tamaño de pantalla y corrección del teclado que tapaba los campos.
- **Prompt:** "Agreguemos iconos, recuerda el safe area, valida el responsive y que el teclado no tape el correo"
- **Resumen de la respuesta:** Se crearon `FormScreen` y `FieldLabel` como componentes compartidos. `FormScreen` envuelve los formularios en `KeyboardAvoidingView` con `behavior="padding"` y el alto del encabezado como `keyboardVerticalOffset`; `FieldLabel` agrega el icono a cada etiqueta usando Ionicons.
- **Qué se usó / modificó / descartó:** Se usó `@expo/vector-icons` para los iconos, `useSafeAreaInsets` para la barra inferior y `useWindowDimensions` para adaptar el tamaño de las fotos; se descartó `react-native-keyboard-controller` porque no está incluido en Expo Go y exigiría un development build.
- **Archivos y commit:** `uberclone-conductor/src/components/FormScreen.js`, `uberclone-conductor/src/components/FieldLabel.js`, `uberclone-conductor/src/navigation/RegisterTabsNavigator.js`, `uberclone-conductor/src/screens/auth/PersonalDataScreen.js`, `uberclone-conductor/src/screens/auth/VehicleDataScreen.js`, `uberclone-conductor/src/screens/auth/DocumentsScreen.js`, `uberclone-conductor/App.js` — `817a5da` (mismo commit que la entrada #7)
- **Verificación:** Bundle de desarrollo compilado sin errores de resolución (HTTP 200) y validación de los 23 nombres de iconos contra el mapa de glifos de Ionicons.
- **Aprendizaje:** En Android con edge-to-edge la ventana ya no se redimensiona sola, por lo que `KeyboardAvoidingView` necesita `behavior` en ambas plataformas; además, superponer la altura fija de la barra de pestañas ignora el área segura inferior del dispositivo.
