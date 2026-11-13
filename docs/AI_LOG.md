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
---

### Entrada #9 (Commit 9/32)
- **Fecha:** 2026-11-06
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** Corregir los datos que se guardaban mal en Firestore (fechas imposibles, marcas con emojis, año y capacidad como texto), reemplazar los campos de fecha escritos a mano por un calendario nativo y guardar cada conductor con su cédula como identificador del documento.
- **Prompt:** "Revisa la base de datos, hay demasiados bugs, no se guardó con la cédula y la fecha la necesito desde el calendario; con las fechas posteriores a hoy, si pongo 40 o 32 deja pasar; revisa bien y haz el debug en cada uno de los campos, prueba de todo"
- **Resumen de la respuesta:** Se reescribió `validators.js` con funciones puras y una validación de fecha que compara año, mes y día del objeto `Date`, de modo que `2026-02-31` o `2026-11-40` se rechazan. Se creó `DateField` con `@react-native-community/datetimepicker` para elegir fechas desde el calendario del sistema, con fecha mínima y máxima. `DocumentsScreen` ahora guarda con `doc(db, 'drivers', personalData.idNumber)` y normaliza los textos antes de escribir.
- **Qué se usó / modificó / descartó:** Se usó `@react-native-community/datetimepicker` (incluido en Expo Go) y `Number()` para convertir `year` y `passengerCapacity` antes de guardarlos. Se descartó seguir validando fechas con expresiones regulares solas, porque aceptan días como 40 o 31 en meses de 30 días.
- **Archivos y commit:** `uberclone-conductor/src/utils/validators.js`, `uberclone-conductor/src/components/DateField.js`, `uberclone-conductor/src/screens/auth/PersonalDataScreen.js`, `uberclone-conductor/src/screens/auth/VehicleDataScreen.js`, `uberclone-conductor/src/screens/auth/DocumentsScreen.js`, `uberclone-conductor/package.json` — `5005426`
- **Verificación:** 48 pruebas sobre los validadores ejecutadas con Node (todas en verde), incluyendo los casos reportados: `1000-01-11`, marca `🔥🔥`, año `1990abc` y `1990.5`, vencimientos `2026-11-40` y `2026-40-32`. Bundle de desarrollo compilado sin errores de resolución (HTTP 200).
- **Aprendizaje:** `new Date(2026, 1, 31)` no falla: se desborda al 3 de marzo. Para validar una fecha hay que construir el objeto y comparar si el año, el mes y el día siguen siendo los que se ingresaron. Además, un `TextInput` con teclado numérico sigue aceptando texto pegado, así que la validación debe vivir en el código y no en el teclado.
---

### Entrada #10 (Commit 9/32)
- **Fecha:** 2026-11-06
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** Dejar de guardar rutas temporales del teléfono como si fueran fotos y subir las imágenes a Cloudinary para guardar en Firestore su URL pública.
- **Prompt:** "cx3t5rmq este es el cloudname, ya cree la cuenta lo ideal es que sea en Cloudinary"
- **Resumen de la respuesta:** Se creó el servicio `uploadToCloudinary`, que arma un `FormData` con el archivo y el `upload_preset`, hace un POST a `https://api.cloudinary.com/v1_1/<cloud_name>/image/upload` y devuelve el `secure_url`. Las tres pestañas suben la imagen en el momento de elegirla y guardan la URL; mientras sube, el botón muestra "Subiendo..." con un `ActivityIndicator` y se deshabilita.
- **Qué se usó / modificó / descartó:** Se usó la API REST de Cloudinary con un **unsigned upload preset**, porque una app móvil no puede guardar el API secret (cualquiera podría extraerlo del APK). Se descartó Firebase Storage porque exige habilitar facturación con tarjeta, y se descartó el SDK de Cloudinary porque es solo para servidor.
- **Archivos y commit:** `uberclone-conductor/src/services/cloudinary.js`, `uberclone-conductor/.env.example`, `uberclone-conductor/src/screens/auth/PersonalDataScreen.js`, `uberclone-conductor/src/screens/auth/VehicleDataScreen.js`, `uberclone-conductor/src/screens/auth/DocumentsScreen.js` — `5005426` (mismo commit que la entrada #9)
- **Verificación:** Se confirmó contra la API real que el cloud name `cx3t5rmq` existe y que el formato de error es `{"error":{"message":"..."}}`, que es el que lee el código. Bundle de desarrollo compilado sin errores de resolución (HTTP 200) y el cloud name aparece inlined en el bundle.
- **Aprendizaje:** La URI que devuelve `expo-image-picker` apunta a la carpeta de caché de la app (`file:///.../Library/Caches/ImagePicker/...`), no a la galería del usuario: el sistema puede borrarla y ningún otro dispositivo puede abrirla. En una app móvil el secreto de un servicio de medios nunca va en el cliente; por eso se usa un preset unsigned con permisos limitados.

---

### Entrada #11 (Commit 11/32)
- **Fecha:** 2026-11-08
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** Implementar la sesión global del conductor con DriverContext persistido en AsyncStorage, bloqueo estricto de disponibilidad en estado 'pending', pantalla de Perfil con badge de validación y pantalla de Ajustes con selector interactivo de idioma (es/en).
- **Prompt:** "continuemos con la pantalla de Perfil y Ajustes con selector de idioma"
- **Resumen de la respuesta:** Se creó `DriverContext` con persistencia en `AsyncStorage` exclusivamente para datos no sensibles (`language`, `isAvailable`, `activeDriverId`). Se aplicó la regla de negocio que bloquea la disponibilidad si el estado del conductor es `pending`. Se maquetaron `ProfileScreen` (con foto de Cloudinary, datos del vehículo, badge de aprobación y pull-to-refresh) y `SettingsScreen` (con selector interactivo es/en vía `TRANSLATIONS` y cierre de sesión).
- **Qué se usó / modificó / descartó:** Se usó `AsyncStorage` solo para preferencias ligeras y `Firestore` para el documento completo del conductor. Se descartó almacenar datos sensibles localmente. Se integró `RootStackNavigator` para enlazar el registro con el perfil del conductor.
- **Archivos y commit:** `uberclone-conductor/src/context/DriverContext.js`, `uberclone-conductor/src/constants/translations.js`, `uberclone-conductor/src/navigation/RootStackNavigator.js`, `uberclone-conductor/src/screens/main/ProfileScreen.js`, `uberclone-conductor/src/screens/main/SettingsScreen.js`, `uberclone-conductor/src/screens/auth/DocumentsScreen.js`, `uberclone-conductor/App.js` — `89a4a2d`
- **Verificación:** Verificación sintáctica con Node sin errores. Verificación de lógica de bloqueo: `setAvailability(true)` rechaza la activación cuando el conductor está en estado `pending`.
- **Aprendizaje:** Separación estricta de responsabilidades entre almacenamiento local (`AsyncStorage` solo para preferencias de UI y sesión) y base de datos remota (`Firestore` para información sensible y estado de validación). El switch de disponibilidad no puede ser un simple booleano en memoria; debe estar gobernado por el estado de verificación del backend.

---

### Entrada #12 (Commit 12/32)
- **Fecha:** 2026-11-09
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** Adaptar las validaciones del vehículo y documentación a la normativa de transporte de Colombia (RUNT y Mintransporte): permitir año modelo entrante (currentYear + 1) y sincronizar la licencia de conducción con la cédula de ciudadanía.
- **Prompt:** "en colombia se expiden carros con matricula del año siguiente... adicional, la cédula con el número de licencia ha de ser el mismo; hazle test a toda la app, valida todos los bugs"
- **Resumen de la respuesta:** Se modificó `isValidVehicleYear` para permitir modelos hasta `currentYear + 1` conforme a la regla del RUNT. En `DocumentsScreen`, se implementó reactividad con `useEffect` para pre-llenar la licencia con la cédula de la Pestaña 1 y se agregó validación cruzada para evitar discrepancias. Se ejecutó una suite de 17 pruebas automatizadas con Node validando fechas, identidades, placas, modelos, motor de tarifas (`pricing.js`) y paridad i18n (`es`/`en`).
- **Qué se usó / modificó / descartó:** Se aplicó el principio de Única Fuente de Verdad (SSOT) para la identidad del conductor. Se descartó solicitar el número de licencia como campo aislado desconectado de la cédula.
- **Archivos y commit:** `uberclone-conductor/src/utils/validators.js`, `uberclone-conductor/src/screens/auth/VehicleDataScreen.js`, `uberclone-conductor/src/screens/auth/DocumentsScreen.js` — `7e395ee`
- **Verificación:** Suite de 17 pruebas automatizadas ejecutadas con Node (17/17 aprobadas al 100%), verificando límites del año (1989, 1990, actual, actual+1, actual+2), bisiestos y desbordes, tarifas mínimas y propinas, y paridad total de claves en el diccionario de traducciones.
- **Aprendizaje:** Las validaciones de software nunca deben diseñarse con supuestos técnicos aislados del dominio real. La ley colombiana permite matricular modelos del año siguiente a mitad de año y unifica la licencia con la cédula; ignorar estas reglas de negocio generaba falsos rechazos a usuarios legítimos.

---

### Entrada #13 (Commit 13/32)
- **Fecha:** 2026-11-09
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** Implementar el custom hook obligatorio useDriverLocation con gestión de permisos, geolocalización continua de alta precisión condicionada a la disponibilidad, sincronización en tiempo real con Firestore y función de limpieza (cleanup) estricta en el retorno de useEffect.
- **Prompt:** "listo hagamosle"
- **Resumen de la respuesta:** Se creó `useDriverLocation.js` en `src/hooks/`. Maneja permisos de geolocalización en primer plano, obtiene ubicación inicial rápida de respaldo con `getLastKnownPositionAsync()`, inicia `watchPositionAsync` con precisión alta (`Accuracy.High`) únicamente cuando `isAvailable === true`, sincroniza las coordenadas en Firestore (`currentLocation`) y cancela la suscripción en el cleanup de `useEffect` mediante `subscription.remove()`.
- **Qué se usó / modificó / descartó:** Se utilizó `expo-location` con intervalos de 10 metros y 3 segundos. Se descartó mantener el GPS encendido cuando el conductor está desconectado para evitar el drenaje de batería y la saturación de lecturas/escrituras en Firestore.
- **Archivos y commit:** `uberclone-conductor/src/hooks/useDriverLocation.js`, `uberclone-conductor/package.json` — `3193f1e`
- **Verificación:** Análisis sintáctico con Node sin errores. Verificación de arquitectura de React: control de componente desmontado con `isMountedRef` y cancelación de suscripción de hardware en el `return` de `useEffect`.
- **Aprendizaje:** Las suscripciones a sensores de hardware (como el GPS) deben estar estrictamente gobernadas por el estado de negocio (`isAvailable`) y limpiadas en el retorno de `useEffect`. Desacoplar el hardware en un custom hook evita que la pantalla del mapa se sobrecargue de responsabilidades.

---

### Entrada #14 (Commit 14/32)
- **Fecha:** 2026-11-09
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** Implementar el custom hook obligatorio useTripRequests con escucha en tiempo real de viajes en Firestore, temporizador regresivo de 15 segundos con auto-rechazo por timeout, optimización con useCallback y limpieza estricta en useEffect.
- **Prompt:** "yo probe y tood al pelo continuemos"
- **Resumen de la respuesta:** Se implementó `useTripRequests.js` en `src/hooks/`. Escucha solicitudes entrantes en Firestore con `onSnapshot` únicamente cuando el conductor está disponible (`isAvailable === true`), activa un temporizador regresivo de 15 segundos que cancela automáticamente con motivo `timeout` al expirar, expone `acceptTrip` y `rejectTrip` memorizados con `useCallback` para evitar re-renders en cada segundo del reloj y realiza la limpieza estricta (`clearInterval` y `unsubscribe`) en el retorno de `useEffect`.
- **Qué se usó / modificó / descartó:** Se utilizó `setInterval` controlado por `timerRef` y `useCallback` para los manejadores. Se descartó ejecutar suscripciones cuando el conductor está inactivo y se garantizó la desconexión inmediata de la consulta en Firestore.
- **Archivos y commit:** `uberclone-conductor/src/hooks/useTripRequests.js` — `dff90a4`
- **Verificación:** Análisis sintáctico con Node sin errores. Verificación del ciclo de vida del temporizador: cancelación garantizada mediante `clearInterval` al aceptar, rechazar o desmontar el hook.
- **Aprendizaje:** En estados que mutan cada segundo (como un reloj regresivo), no usar `useCallback` en los handlers pasados a la vista produce renders innecesarios en toda la pantalla a 1 Hz. Limpiar el intervalo en el retorno de `useEffect` es mandatorio para evitar temporizadores zombis en segundo plano.

---

### Entrada #15 (Commit 15/32)
- **Fecha:** 2026-11-09
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** Implementar el tercer custom hook obligatorio useEarnings con cálculo financiero memorizado mediante useMemo para Hoy, Semana y Mes, y ajuste de saldo del conductor con deducción de comisión en viajes de efectivo.
- **Prompt:** "dale, de una, adicional dime que porcentaje vamos del proyecto y que nos falta para completarlo todo que quede melo ?"
- **Resumen de la respuesta:** Se creó `useEarnings.js` en `src/hooks/`. Consulta el historial de viajes completados y pagados en Firestore, procesa las métricas de Hoy, Semana y Mes optimizadas con `useMemo` para evitar cálculos pesados en cada render y computa el saldo neto acumulado descontando el 20% de comisión de los pagos en efectivo y sumando las ganancias netas de pasarela.
- **Qué se usó / modificó / descartó:** Se utilizó `useMemo` con dependencia exclusiva en `[trips]`. Se descartó recalcular métricas en el cuerpo del componente y se aisló la lógica financiera en el hook.
- **Archivos y commit:** `uberclone-conductor/src/hooks/useEarnings.js` — `4caefb2`
- **Verificación:** Verificación sintáctica con Node y prueba matemática unitaria validando acumulación de tarifas, comisiones y cálculo de saldo mixto (efectivo + pasarela).
- **Aprendizaje:** En paneles analíticos, iterar listas de transacciones en cada render degrada los 60 fps; `useMemo` garantiza costo computacional cero si los datos no cambiaron. La regla de cobro en efectivo exige deducción en saldo porque el dinero físico ingresa 100% al conductor.

---

### Entrada #16 (Commit 16/32)
- **Fecha:** 2026-11-09
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** Implementar la pantalla principal HomeScreen con mapa interactivo de react-native-maps, switch de disponibilidad con bloqueo estricto en estado 'pending', marcador dinámico con rumbo (heading), botón de recentrado y simulador de carreras para testing.
- **Prompt:** "listo ya subi el push"
- **Resumen de la respuesta:** Se construyó `HomeScreen.js` en `src/screens/main/`. Orquesta `useDriverLocation` para el seguimiento en tiempo real y rotación del marcador, `useDriver` para gobernar el switch de conexión (bloqueado con modal explicativo si el conductor está en estado `pending`), botón flotante de recentrado suave con `animateToRegion` y botón para simular carreras entrantes escribiendo en la colección `trips` de Firestore con tarifas puras de `pricing.js`. Se integró `HomeScreen` en `RootStackNavigator`.
- **Qué se usó / modificó / descartó:** Se utilizó `react-native-maps` con `Marker` plano rotado por `heading`. Se descartó conectar al conductor si el backend reporta estado `pending`.
- **Archivos y commit:** `uberclone-conductor/src/screens/main/HomeScreen.js`, `uberclone-conductor/src/navigation/RootStackNavigator.js`, `uberclone-conductor/src/screens/main/ProfileScreen.js` — `[2d6075f]`
- **Verificación:** Análisis sintáctico con Node sin errores. Verificación de regla de negocio: al intentar activar el switch con cuenta en `pending`, se despliega el modal explicativo y se previene la conexión.
- **Aprendizaje:** El mapa debe ser un componente presentacional puro que consuma la ubicación ya filtrada por el custom hook. Acoplar la lógica del GPS o Firebase directamente dentro del render del mapa genera bloqueos en el hilo de UI (UI thread).

### Entrada #17 (Fix del Commit 20/32)
- **Fecha:** 2026-11-11
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** Corregir el mapa que se renderizaba en negro en la pantalla de Inicio y ajustar los elementos flotantes a las zonas seguras reales del dispositivo (notch superior e indicador de inicio).
- **Prompt:** "primero el mapa me sale en negro no se ve el fondo... adicional valida bien la safe zone en esa pantalla"
- **Resumen de la respuesta:** Se reemplazó `StyleSheet.absoluteFillObject` en el estilo del mapa por `flex: 1`, de modo que el `MapView` ocupe la pantalla dentro del flujo normal de layout en lugar de depender de medidas absolutas. Se añadieron `loadingEnabled`, `loadingBackgroundColor` y `loadingIndicatorColor` como estado de carga visible, junto con los callbacks `onMapReady` y `onMapLoaded` para diagnóstico. En la misma pasada se sustituyó el `SafeAreaView` contenedor por un `View` simple con `useSafeAreaInsets`, aplicando `insets.top` a la tarjeta superior e `insets.bottom` a los botones flotantes.
- **Qué se usó / modificó / descartó:** Se usó `useSafeAreaInsets` en lugar de `SafeAreaView` porque este último aplica padding a todo el contenido y el mapa debe llegar de borde a borde. Se descartó el posicionamiento absoluto del mapa: depende de que el contenedor resuelva sus medidas antes del primer layout y, cuando no ocurre, la vista queda con altura cero y se ve solo el color de fondo del contenedor.
- **Archivos y commit:** `uberclone-conductor/src/screens/main/HomeScreen.js` — `71a7d41`
- **Verificación:** Bundle completo generado con Metro (`index.bundle?platform=ios&dev=true`) respondiendo HTTP 200 sobre 1574 módulos, sin errores de resolución. Auditoría estática con Babel sobre los 22 archivos: sin errores de sintaxis, imports sin usar, estilos huérfanos ni identificadores indefinidos. Verificación visual pendiente en Expo Go con los logs `[Mapa] vista nativa lista` y `[Mapa] teselas cargadas`.
- **Aprendizaje:** Un componente nativo como el mapa no debe heredar el padding del área segura: lo que respeta el notch son los elementos flotantes que van encima, no el mapa. Y `absoluteFillObject` no es equivalente a `flex: 1` cuando el padre todavía no tiene medidas resueltas.

### Entrada #18 (Navegación gobernada por sesión)
- **Fecha:** 2026-11-11
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** Reemplazar el `initialRouteName` estático por un conjunto de pantallas condicionado al estado de sesión, para que iniciar y cerrar sesión no dependan de navegación manual y no dejen al usuario en un callejón sin salida.
- **Prompt:** "usemos esto A) Arreglar el navegador gobernado por sesión. En vez de initialRouteName estático, las pantallas cambian según driverId"
- **Resumen de la respuesta:** `RootStackNavigator` ahora renderiza dos conjuntos de pantallas mutuamente excluyentes: si existe `driverId` registra `Home`, `Profile` y `Settings`; si no existe registra únicamente `Register`. Se eliminó la llamada a `navigation.popToTop()` en `SettingsScreen`, porque al borrarse la sesión el navegador descarta las pantallas privadas y cae solo en el registro.
- **Qué se usó / modificó / descartó:** Se adoptó el patrón de autenticación de React Navigation basado en pantallas condicionales. Se descartó navegación imperativa (`navigate`, `reset`, `popToTop`) porque se desincroniza cuando el estado de sesión cambia por debajo del árbol de navegación.
- **Archivos y commit:** `uberclone-conductor/src/navigation/RootStackNavigator.js`, `uberclone-conductor/src/screens/main/SettingsScreen.js` — `d9c9678`
- **Verificación:** Auditoría estática con Babel sobre los 22 archivos sin hallazgos y bundle de Metro en HTTP 200. Prueba en Expo Go pendiente: cerrar sesión desde Ajustes debe llevar al registro sin recargar la app, y completar el registro debe entrar a Inicio sin navegación explícita.
- **Aprendizaje:** `initialRouteName` se evalúa una sola vez, cuando el navegador se monta; no reacciona a cambios de estado. Cuando la sesión define qué pantallas existen, la navegación deja de ser una tarea y pasa a ser una consecuencia.

### Entrada #19 (Commit 21/32)
- **Fecha:** 2026-11-11
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** Construir la tarjeta de solicitud entrante con origen, destino, distancia, duración, categoría, método de pago, tarifa, ganancia neta, temporizador regresivo de 15 segundos y botones de Aceptar y Rechazar.
- **Prompt:** "lo que no deja es simular carrera pero lo demas ok"
- **Resumen de la respuesta:** Se creó `IncomingRequestScreen.js` en `src/screens/trip/` como componente presentacional puro: recibe `trip`, `timeLeft` y las acciones ya resueltas por `useTripRequests`, y no consulta Firestore ni maneja relojes. Muestra la ruta de recogida y destino, tres métricas (distancia, duración, pago), el bloque de dinero con la tarifa total y la ganancia neta destacada, una barra que se vacía con el tiempo y el contador que cambia a rojo en los últimos 5 segundos. Los handlers se memorizan con `useCallback` y se conecta desde `HomeScreen`.
- **Qué se usó / modificó / descartó:** Se reutilizó `formatCOP` de `config/pricing.js` en lugar de escribir un formateador nuevo, y `useTripRequests` para el estado y las acciones. Se descartó convertir la tarjeta en una pantalla de navegación: al vivir 15 segundos y depender del estado del hook, un `Modal` montado desde `HomeScreen` evita carreras de navegación.
- **Archivos y commit:** `uberclone-conductor/src/screens/trip/IncomingRequestScreen.js`, `uberclone-conductor/src/screens/main/HomeScreen.js` — `0c2020a`
- **Verificación:** Auditoría estática con Babel sobre los 23 archivos sin hallazgos, y bundle de Metro en HTTP 200. Prueba en Expo Go pendiente: simular una carrera con el switch en Disponible, comprobar la tarjeta con el contador corriendo, aceptar antes de los 15 segundos y verificar en Firestore que el viaje pasa a `accepted` con `driverId`.
- **Aprendizaje:** Un temporizador que vive en el hook mantiene la tarjeta como componente tonto; si el reloj viviera dentro del componente, desmontarlo reiniciaría la cuenta y el rechazo automático dejaría de ser confiable. La separación también permite que `acceptTrip` corte el intervalo desde donde se originó.

### Entrada #20 (Commit 6/32)
- **Fecha:** 2026-11-11
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** Crear `TripContext` con la máquina de estados del viaje y corregir el defecto por el cual una solicitud simulada se escribía en Firestore sin llegar a mostrarse en pantalla.
- **Prompt:** "hay un pequeño bug en simular carrera a veces uno le presiona y no sale la carrera a simular pero si aparece en la base de datos revisa eso tambien"
- **Resumen de la respuesta:** Se añadió `src/config/tripStatus.js` como módulo puro con los estados oficiales, la tabla de transiciones legales, el camino feliz y las etiquetas de texto. Sobre él se construyó `TripContext`, que escucha el viaje activo con `onSnapshot`, valida cada transición antes de escribirla en Firestore y calcula `completedAt` al completar. Además se eliminó el estado `activeTrip` duplicado de `useTripRequests`: el hook ahora recibe `busy` desde el contexto, que pasa a ser la única fuente de verdad sobre si el conductor está ocupado.
- **Qué se usó / modificó / descartó:** Se usó `onSnapshot` sobre el documento del viaje para que el estado se actualice sin recargar. Se descartó guardar el viaje activo en `AsyncStorage`: el modelo de datos ya vive en Firestore y persistir el identificador agregaría una tercera copia del mismo hecho. Se descartó también mantener el `activeTrip` interno del hook, que era la causa del bug.
- **Archivos y commit:** `uberclone-conductor/src/config/tripStatus.js`, `uberclone-conductor/src/context/TripContext.js`, `uberclone-conductor/src/hooks/useTripRequests.js`, `uberclone-conductor/src/screens/main/HomeScreen.js`, `uberclone-conductor/App.js` — `13ddfe8`
- **Verificación:** Se ejecutaron 15 casos de la tabla de transiciones con Node, todos correctos: rechaza saltos ilegales (`accepted → completed`), retrocesos (`completed → in_progress`) y cancelación con pasajero a bordo (`in_progress → cancelled`), y confirma que `paid` es final. Auditoría estática sin hallazgos y bundle de Metro en HTTP 200 sobre 1668 módulos.
- **Aprendizaje:** La causa raíz del bug fue tener el mismo hecho en dos estados: `useTripRequests` guardaba su propio `activeTrip` y nunca lo limpiaba, así que el listener seguía existiendo pero descartaba todas las instantáneas; las solicitudes quedaban escritas en Firestore en estado `requested` sin temporizador y sin tarjeta. Cuando dos piezas necesitan saber si el conductor está ocupado, una de las dos debe preguntar, no copiar.

### Entrada #21 (Commit 22/32)
- **Fecha:** 2026-11-11
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** Cerrar el flujo del viaje aceptado con la pantalla `TripInProgressScreen` y corregir la selección de la solicitud que se muestra al conductor.
- **Prompt:** "prbe de nuevo y sigue el fallo, hice dos nuevos sumilados y solo me sale el primero el segundo no me aparecio en pantalla"
- **Resumen de la respuesta:** Se agregó `TripInProgressScreen`, que muestra el estado del viaje, el avance del flujo, pasajero, ruta, métricas y dinero, y ofrece el siguiente paso del camino feliz. El botón usa `nextFlowStatus` para saber a qué estado ir y `advanceStatus` del contexto para escribirlo; cuando el viaje llega a `paid` el botón deja de avanzar y llama a `clearTrip()`, que es lo que libera al conductor. El `RootStackNavigator` pasó a tener tres escenarios: sin sesión solo el registro, con viaje activo solo la pantalla del viaje, y sin viaje la app normal. Además se extrajo `pickNewestRequest` a `src/utils/requestSelection.js` porque Firestore entrega los documentos por ID, no por fecha. El encabezado y el pie de la pantalla del viaje toman las zonas seguras del dispositivo con `useSafeAreaInsets`, igual que el mapa del inicio: sin eso, en un iPhone con notch el estado del viaje queda debajo de la hora y los botones chocan con el indicador de inicio.
- **Qué se usó / modificó / descartó:** Se reutilizaron `advanceStatus`, `clearTrip`, `statusLabel` y `canTransitionTo` de los commits anteriores, y `formatCOP` para el dinero. Se descartó navegar con `navigation.navigate` al aceptar: la pantalla depende del estado del viaje, así que el navegador la muestra y la retira solo, igual que ya hacía con la sesión. Se descartó también ordenar con `orderBy` en la consulta de Firestore, porque una igualdad sobre dos campos más un ordenamiento exige crear un índice compuesto en la consola; el arreglo se hizo ordenando en el cliente.
- **Archivos y commit:** `uberclone-conductor/src/screens/trip/TripInProgressScreen.js`, `uberclone-conductor/src/utils/requestSelection.js`, `uberclone-conductor/src/navigation/RootStackNavigator.js`, `uberclone-conductor/src/hooks/useTripRequests.js` — `a6a81d6`
- **Verificación:** Se ejecutaron 11 casos contra el archivo real de `requestSelection.js` con Node, todos correctos: con la solicitud vieja primero gana la nueva, con la nueva primero gana la nueva, `createdAt` nulo cuenta como la más reciente, se ignora la rechazada por el mismo conductor y no se muta el arreglo de entrada. Auditoría estática sobre 27 archivos sin hallazgos y bundle de Metro en HTTP 200, comprobando que `TripInProgressScreen` y `pickNewestRequest` aparecen dentro del bundle. Prueba en Expo Go pendiente: simular, aceptar, avanzar por los cuatro estados, confirmar el pago y verificar que al volver al inicio entra una nueva solicitud sin recargar.
- **Aprendizaje:** Los dos fallos venían del mismo camino. El primero era un estado sin salida: al aceptar, el conductor quedaba marcado como ocupado y ninguna pantalla llamaba a `clearTrip`, así que dejaba de recibir solicitudes para siempre. El segundo era de orden: `docs.find(...)` devuelve el primer documento, y Firestore no ordena por fecha si no se lo piden explícitamente; con más de una solicitud abierta la tarjeta mostraba cualquiera. Un estado que solo tiene entrada y no tiene salida, y una lista sin criterio de orden, terminan pareciendo el mismo bug aleatorio.

### Entrada #22 (Commit 23/32)
- **Fecha:** 2026-11-11
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** Dibujar con `<Polyline />` el trazado real por calles del tramo de recogida y del viaje, de modo que la dirección en pantalla, la coordenada y la línea del mapa sean el mismo dato.
- **Prompt:** "ojo ojoooo, no es ir directo, al punto o donde creas que sea el punto, mira bien que la direccion de recogida es una linea directa en la parte de viaje en curso, en la parte en camino al pasajero y la coordenada en el mapa es directo debes tner muy muy en cuenta el patron de coordenada exacta punto a punto, por donde deberia recorrer el carro si hace el recorrido completo,eso solo hace una linea recta donde cree y se supone que esta, no no, mira bien bien el sistema de coordenadas y porque hace eso, dime que pasa y que deberias tener encuenta para hacer el trascurso igual que indriver que te muestra el carro donde esta, la moto o lo que sea, el punto de recogida tuyo la direccion exacta no algo inventado, tener en cuenta la direccion que se pone en pantalla no solo una linea a lo largo"
- **Resumen de la respuesta:** Se diagnosticaron tres datos inventados antes de tocar el mapa: (1) el simulador escribía direcciones de barrios fijos ("Calle 10 #43E-12, El Poblado") sobre coordenadas que estaban a 13,3 km y 16,6 km de esos barrios; (2) `distanceKm: 4.8` y `durationMin: 14` eran constantes, mientras la recta entre esos puntos es 4,02 km y la ruta real por calles 5,59 km; (3) el viaje no llevaba `routeCoordinates`, así que el `<Polyline />` unía dos puntos y una recta de dos puntos es una línea recta por definición, no un error de coordenadas. Se agregó `src/services/routing.js` (`fetchRoadRoute`) contra OSRM, el trazado real de los dos tramos y geocodificación inversa con `expo-location` para que la dirección salga de la coordenada mostrada. Además, el tramo de recogida se vuelve a pedir cada 150 m para que la línea salga de donde está el carro y no de donde aceptó.
- **Qué se usó / modificó / descartó:** Se usaron `Polyline`, `Marker` y `fitToCoordinates` de `react-native-maps`; `useDriverLocation` para la posición real; OSRM (`router.project-osrm.org`), que el spec autoriza en la línea 201 como alternativa libre a Google Directions; y `Location.reverseGeocodeAsync` de `expo-location`. Se descartó Google Static Maps (prohibido por el spec) y se descartó inventar duración cuando no hay ruta: sin trazado real, `durationMin` queda en 0 y la tarifa se calcula solo con base más kilómetros medidos.
- **Trampa documentada:** OSRM responde cada punto como `[longitud, latitud]`. Copiarlo tal cual a `coordinates` del `<Polyline />` manda la ruta al océano; la inversión vive en `routeFromOsrm` (`src/utils/geo.js`) y está cubierta por prueba.
- **Trampa documentada 2:** OSRM pega el punto pedido a la vía más cercana. Medido con la API `nearest`: un lugar real queda a 4–26 m de la vía, pero la coordenada inventada del viaje de prueba quedaba a 573 m. Por eso el punto guardado, el que se geocodifica y el extremo de la ruta son ahora el mismo: los extremos que devuelve la ruta, no los pedidos. Si el marcador se dibujara en el punto pedido y la línea en el punto pegado, quedaría un hueco y la dirección no correspondería al trazado.
- **Discrepancia señalada:** el esquema de `docs/PROMPT_MAESTRO.md` define `origin` y `destination` como `{ lat, lng, address }`. `toLatLng` acepta también `latitude`/`longitude` para no romper los viajes ya guardados, y el simulador ya escribe la forma del spec.
- **Archivos y commit:** `uberclone-conductor/src/screens/trip/TripInProgressScreen.js`, `uberclone-conductor/src/screens/main/HomeScreen.js`, `uberclone-conductor/src/utils/geo.js`, `uberclone-conductor/src/services/routing.js` — `52949bf`
- **Verificación:** 13 casos de `toLatLng` y `buildRouteCoordinates`, más 23 casos de `routeFromOsrm` y `haversineKm` contra la respuesta real de OSRM del recorrido Parque Lleras → Parque Berrío (232 puntos, 6,25 km, 9,2 min): la primera y la última coordenada caen a menos de 30 m de los puntos pedidos, ninguna queda invertida, y todas las respuestas inválidas (`routes` vacío, geometría de un punto, puntos nulos) devuelven `null` sin lanzar. Auditoría estática sobre 29 archivos sin hallazgos y bundle de Metro en HTTP 200. `expo lint` sobre los archivos del commit sin advertencias nuevas.
- **Aprendizaje:** Un mapa no miente sobre lo que dibuja: si le das dos puntos, dibuja una recta, y por eso el problema nunca estuvo en el mapa sino en los datos. La distancia que se cobra, la dirección que se lee y el punto que se toca tienen que salir todos del mismo trazado; mientras cada uno venga de una fuente distinta, la pantalla va a mostrar tres verdades diferentes.

### Entrada #23 (Commit 24/32)
- **Fecha:** 2026-11-12
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** Sacar el generador de carreras simuladas a `src/utils/simulator.js` y hacerlo trabajar con lugares reales, para que el botón de pruebas produzca viajes con dirección y coordenada coherentes.
- **Prompt:** "continuemos con algunas cositas de una vez" — continuación del commit #24 del plan.
- **Resumen de la respuesta:** El simulador vivía dentro de `HomeScreen` y construía los puntos sumando grados a la posición del conductor (`+0.003` de latitud, `+0.035` para el destino). Ese offset caía donde cayera: podía quedar en el interior de una manzana o en una zona sin calles mapeadas, y en esa prueba el destino quedó a 573 m de la vía más cercana. Ahora el módulo tiene un catálogo de 10 lugares que existen en el área metropolitana de Medellín, con coordenadas consultadas en Nominatim; la recogida es el lugar real más cercano al conductor y el destino otro lugar del catálogo, sorteado. `pickSimulatedTrip` recibe la fuente de aleatoriedad como parámetro para poder probarse con valores fijos.
- **Qué se usó / modificó / descartó:** Se usaron `Nominatim` (OpenStreetMap) para obtener las coordenadas de los lugares y `OSRM` para verificar que cada uno esté a menos de 130 m de una vía para vehículo; `haversineKm` de `utils/geo.js` para elegir el más cercano y descartar carreras de menos de 2 km. Se descartó seguir con offsets desde la posición del conductor: un offset no es un lugar, y por eso el punto podía no tener calle. Se descartaron también las coordenadas "de memoria" de sitios conocidos: todas salieron de una consulta real salvo que no se pudieran verificar, como Parque Lleras, que Nominatim no resolvió dentro de Medellín y quedó fuera del catálogo.
- **Comportamiento fuera de Medellín:** si el conductor está a más de 30 km de todos los lugares del catálogo, la recogida se hace en su propia posición y el destino sigue siendo un lugar real del catálogo. Así el botón no manda una recogida a otra ciudad al probar en otro sitio.
- **Limpieza incluida:** se quitaron dos `console.log` de depuración del mapa en `HomeScreen.js` (`onMapReady` y `onMapLoaded`), que venían del commit `71a7d41`.
- **Archivos y commit:** `uberclone-conductor/src/utils/simulator.js`, `uberclone-conductor/src/screens/main/HomeScreen.js` — `36fd266`
- **Verificación:** 20 casos sobre `simulator.js` con aleatoriedad inyectada: catálogo sin ids ni coordenadas repetidas y dentro del área metropolitana; el lugar más cercano correcto en El Poblado y en Bello; el destino nunca es la recogida; ninguna carrera por debajo de 2 km en 20 sorteos; al menos 5 destinos distintos; `random = 1` no rompe el índice; fuera del área la recogida es el conductor. Prueba de flujo completo del botón con OSRM real en dos posiciones: el trazado del viaje es real, la línea azul arranca en la vía más cercana al carro (brecha ≤ pegado + 20 m), termina en el pin de recogida, y la línea negra arranca en ese mismo pin.
- **Aprendizaje:** Un dato de prueba también puede mentir. Si el simulador no parte de un lugar que existe, ninguna capa de arriba puede arreglarlo: ni el geocodificador, ni OSRM, ni el mapa. La calidad de la demo empieza en los datos de entrada.

### Entrada #24 (Commit 25/32)
- **Fecha:** 2026-11-12
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** Construir la pantalla de Resumen de Tarifa y Cobro (`TripPaymentScreen`) soportando tanto el cobro en efectivo con deducción del 20% de comisión como la confirmación de pagos digitales (`mercadopago`, `stripe`) con acreditación al saldo del conductor.
- **Prompt:** "hice el add pero no quiero agregar eso porque hay un bug en la parte del cobro como tal si soy conductor yo espero que haya pago en transferencia tambien y solo me pagan en efectivo... diria que mantener el promnt maestro es lo mejor"
- **Resumen de la respuesta:** Se implementaron `TripPaymentScreen.js`, `src/utils/payment.js` (`getPaymentBreakdown` y `getTripBalanceEffect`) y `src/constants/paymentMethods.js`. Se conectaron `confirmCashPayment` y `confirmGatewayPayment` en `TripContext.js`, se enrutó el estado `completed`/`paid` desde `RootStackNavigator.js`, se integró `getTripBalanceEffect` en `useEarnings.js` y se actualizó `simulator.js` + `HomeScreen.js` para sortear entre los 3 métodos oficiales (`cash`, `mercadopago`, `stripe`) en lugar de forzar solo efectivo.
- **Qué se usó / modificó / descartó:** Se mantuvieron estrictamente los 3 métodos de pago de `docs/PROMPT_MAESTRO.md` (`cash`, `mercadopago`, `stripe`), habilitando en `TripPaymentScreen` tanto la confirmación de efectivo (que descuenta `-commission` del saldo) como el flujo de confirmación de pasarela en prueba (que registra `paymentId`, `paymentStatus: 'paid'` y acredita `+driverEarnings` al saldo). Se descartó dejar bloqueado el botón cuando el método no es efectivo.
- **Archivos y commit:** `uberclone-conductor/src/screens/trip/TripPaymentScreen.js`, `uberclone-conductor/src/utils/payment.js`, `uberclone-conductor/src/constants/paymentMethods.js`, `uberclone-conductor/src/context/TripContext.js`, `uberclone-conductor/src/hooks/useEarnings.js`, `uberclone-conductor/src/navigation/RootStackNavigator.js`, `uberclone-conductor/src/screens/trip/IncomingRequestScreen.js`, `uberclone-conductor/src/screens/trip/TripInProgressScreen.js`, `uberclone-conductor/src/utils/simulator.js`, `uberclone-conductor/src/screens/main/HomeScreen.js` — `74bf615`
- **Verificación:** Pruebas unitarias de `getPaymentBreakdown`, `getTripBalanceEffect` y sorteo de `paymentMethod` en `pickSimulatedTrip`. Verificación de renderizado en Expo Go para cobros en efectivo y digitales.
- **Aprendizaje:** Un flujo de estados no puede depender de un único método de pago cableado en el simulador: tanto el generador de pruebas como la pantalla de cierre deben cubrir todas las ramas del contrato (`cash`, `mercadopago`, `stripe`) para que el conductor nunca quede atrapado en un estado intermedio (`completed`) sin salida hacia `paid`.

### Entrada #25 (Commit 26/32)
- **Fecha:** 2026-11-12
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** Inicializar el servidor Express en `backend/` con configuración de CORS, variables de entorno seguras en `.env.example`, validación de payload de pagos (`{ tripId, amount, title, paymentMethod }`) y endpoint de diagnóstico `/health`.
- **Prompt:** "eso explicamelo el paso que vamos a hacer asi tal cual o un poco mas especifico, porque es importante como se creara, y si entiendo correctamente. continuemos con eos"
- **Resumen de la respuesta:** Se creó la carpeta `backend/` con `package.json`, `.env.example` y `server.js`. El servidor expone `GET /health` informando el estado de las credenciales sin revelar llaves privadas, configura CORS y `express.json()`, y exporta `validatePaymentPayload` para validar que `tripId`, `amount` (entero positivo en COP) y `paymentMethod` (`mercadopago` o `stripe`) cumplan el contrato antes de invocar cualquier SDK de pasarela.
- **Qué se usó / modificó / descartó:** Se usó `express`, `cors` y `dotenv` en un módulo separado fuera de `uberclone-conductor/` para garantizar que `MP_ACCESS_TOKEN` y `STRIPE_SECRET_KEY` jamás sean empaquetados por Metro dentro del bundle móvil. Se descartó colocar llaves privadas en variables `EXPO_PUBLIC_*`.
- **Archivos y commit:** `backend/package.json`, `backend/.env.example`, `backend/server.js`, `docs/AI_LOG.md` — `7f81542`
- **Verificación:** Verificación de sintaxis y pruebas unitarias con Node sobre `validatePaymentPayload` (rechazo de montos inválidos, `tripId` vacío o métodos desconocidos, y normalización de enteros COP).
- **Aprendizaje:** Separar el backend en su propio directorio y `package.json` establece una frontera física de seguridad: lo que vive en `backend/.env` solo se lee en el servidor Node.js, impidiendo que un atacante extraiga credenciales privadas al descompilar la aplicación móvil.

### Entrada #26 (Commit 27/32)
- **Fecha:** 2026-11-12
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** Integrar Mercado Pago Checkout Pro en modo de prueba conectando el endpoint `POST /api/payments/mercadopago/preference` en `backend/` con el servicio `src/services/payments.js` y la pantalla `TripPaymentScreen.js`.
- **Prompt:** "7f81542 listo" — continuación al Commit #27 (Mercado Pago Checkout Pro).
- **Resumen de la respuesta:** Se creó `backend/routes/mercadopago.js` usando el SDK oficial `mercadopago` (`MercadoPagoConfig` y `Preference`) para generar preferencias en COP con `MP_ACCESS_TOKEN` de `backend/.env`, más una vista de respaldo `/sandbox-checkout` para pruebas locales sin token. En el cliente se creó `src/services/payments.js` (`processMercadoPagoCheckout`), que invoca al backend, abre la URL de Checkout Pro y entrega el `paymentId` a `TripPaymentScreen` para actualizar el viaje a `status: 'paid'`.
- **Qué se usó / modificó / descartó:** Se usó el SDK v2 de `mercadopago` en el servidor y `Linking.openURL` en el cliente para abrir el Checkout Pro sin requerir módulos nativos fuera de Expo Go. Se descartó exponer `MP_ACCESS_TOKEN` en la app móvil.
- **Archivos y commit:** `backend/routes/mercadopago.js`, `backend/server.js`, `uberclone-conductor/src/services/payments.js`, `uberclone-conductor/src/screens/trip/TripPaymentScreen.js`, `docs/AI_LOG.md` — `c449f8a`
- **Verificación:** Prueba de integración contra el router de Express verificando creación de preferencia, respuesta JSON con `preferenceId`, `paymentId` y `checkoutUrl`, y parseo estático con Babel en el cliente.
- **Aprendizaje:** El servidor actúa como intermediario de confianza: recibe los datos públicos del viaje (`tripId`, `amount`, `title`), firma la petición ante Mercado Pago con su credencial privada y devuelve al cliente únicamente la URL de checkout y el identificador de pago.

### Entrada #27 (Commit 28/32)
- **Fecha:** 2026-11-12
- **Integrante:** Johan Alexis García
- **Herramienta:** Google Antigravity
- **Objetivo:** Integrar Stripe (`PaymentIntent` / `PaymentSheet` en modo de prueba) mediante el endpoint `POST /api/payments/stripe/payment-intent` en `backend/routes/stripe.js` y conectarlo con `src/services/payments.js` y `TripPaymentScreen.js`.
- **Prompt:** "c449f8a" — continuación al Commit #28 (Stripe PaymentSheet test configuration).
- **Resumen de la respuesta:** Se creó `backend/routes/stripe.js` que utiliza el SDK oficial `stripe` con `STRIPE_SECRET_KEY` de `backend/.env` para crear un `PaymentIntent` en COP (`amount * 100`, `currency: 'cop'`) y devolver `clientSecret` y `paymentId` (con respaldo sandbox en `/api/payments/stripe/sandbox-checkout`). En el cliente se añadió `processStripePayment` en `src/services/payments.js` y se conectó en `TripPaymentScreen.js`.
- **Qué se usó / modificó / descartó:** Se usó el SDK de `stripe` en el backend manteniendo `STRIPE_SECRET_KEY` exclusivamente en `backend/.env`. Se descartó incluir llaves secretas (`sk_test_...`) en el código móvil.
- **Archivos y commit:** `backend/routes/stripe.js`, `backend/server.js`, `uberclone-conductor/src/services/payments.js`, `uberclone-conductor/src/screens/trip/TripPaymentScreen.js`, `docs/AI_LOG.md` — `[PENDIENTE_HASH]`
- **Verificación:** Prueba en memoria del endpoint `POST /api/payments/stripe/payment-intent` comprobando retorno HTTP 200 con `paymentId`, `clientSecret` y `checkoutUrl`, y validación de sintaxis con `@babel/parser`.
- **Aprendizaje:** Stripe exige expresar la moneda en su unidad mínima (centavos), por lo que un monto entero en COP debe multiplicarse por 100 en el servidor antes de crear el `PaymentIntent`, entregando al cliente únicamente el `clientSecret` efímero.
