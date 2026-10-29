# UberClone — Versión Conductor

Aplicación móvil multiplataforma desarrollada en **React Native con Expo** para conductores de servicio de transporte, integrada con servicios en tiempo real y pasarelas de pago.

---

## Requisitos Previos

- [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
- [Expo Go](https://expo.dev/go) en tu dispositivo móvil o un emulador configurado (Android Studio / Xcode)

---

## Instalación y Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/JohanAlexis03/UberCloneVersionConductor.git
   cd UberCloneVersionConductor
   ```

2. **Instalar dependencias:**
   ```bash
   cd uberclone-conductor
   npm install
   ```

3. **Configurar variables de entorno:**
   Copia el archivo de plantilla a la raíz del proyecto y en la app:
   ```bash
   cp .env.example .env
   ```
   Ajusta las claves públicas requeridas para mapas, Cloudinary y pasarelas en modo prueba.

4. **Ejecutar la aplicación:**
   ```bash
   npm start
   ```

---

## Arquitectura y Módulos

- **Navegación Multinivel:** Tabs (registro de 3 pasos), Stack (flujo y detalle del viaje) y Drawer (menú principal).
- **Tarifas (COP):** Motor de cálculo con valores enteros en pesos colombianos y comisión fija del 20%.
- **Seguridad:** Aislamiento total de credenciales sensibles fuera del cliente móvil.
