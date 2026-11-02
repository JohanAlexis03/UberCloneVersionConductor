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
- **Archivos y commit:** `uberclone-conductor/src/config/pricing.js` — `[PENDIENTE_HASH]`
- **Verificación:** Pruebas unitarias de cálculo con categoría economy, xl y premium, validando piso de tarifa mínima de $6.000 COP y cálculo de comisión exacto del 20%.
- **Aprendizaje:** Separación de funciones matemáticas puras fuera del ciclo de vida de React para testing predecible y cero efectos secundarios.