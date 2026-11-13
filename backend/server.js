// AI-assisted: see docs/AI_LOG.md #26
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Middlewares globales: CORS para permitir peticiones desde Expo Go y parseo JSON
app.use(cors());
app.use(express.json());

/**
 * Validación de payload base para operaciones de cobro de viajes.
 * Según docs/PROMPT_MAESTRO.md (Sección 4), el servidor recibe:
 * { tripId, amount, title, paymentMethod }
 */
function validatePaymentPayload(body = {}) {
  const { tripId, amount, title, paymentMethod } = body;
  const numericAmount = Math.round(Number(amount));

  if (!tripId || typeof tripId !== 'string' || !tripId.trim()) {
    return { valid: false, error: 'El campo tripId es obligatorio.' };
  }

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return { valid: false, error: 'El monto (amount) debe ser un entero positivo en COP.' };
  }

  const allowedMethods = ['mercadopago', 'stripe'];
  const normalizedMethod = String(paymentMethod || '').toLowerCase();
  if (!allowedMethods.includes(normalizedMethod)) {
    return {
      valid: false,
      error: 'El campo paymentMethod debe ser mercadopago o stripe.',
    };
  }

  return {
    valid: true,
    data: {
      tripId: tripId.trim(),
      amount: numericAmount,
      title: String(title || `Viaje UberClone #${tripId.slice(0, 6)}`).trim(),
      paymentMethod: normalizedMethod,
    },
  };
}

// Exportar antes de requerir rutas hijas para evitar dependencia circular en CommonJS
module.exports = { app, validatePaymentPayload };

/**
 * GET /health
 * Endpoint de diagnóstico para verificar que el servidor está activo
 * y si las llaves de entorno están configuradas (sin exponer sus valores).
 */
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'uberclone-conductor-backend',
    port: PORT,
    gatewaysConfigured: {
      mercadopago: Boolean(process.env.MP_ACCESS_TOKEN),
      stripe: Boolean(process.env.STRIPE_SECRET_KEY),
    },
    timestamp: new Date().toISOString(),
  });
});

// Rutas de pasarelas de pago
const mercadopagoRoutes = require('./routes/mercadopago');
app.use('/api/payments/mercadopago', mercadopagoRoutes);

// Manejador de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// Manejador centralizado de errores
app.use((err, _req, res, _next) => {
  console.error('[Backend Error]:', err.message);
  res.status(500).json({
    ok: false,
    error: 'Error interno en el servidor de pagos.',
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Backend] Servidor de pagos escuchando en http://localhost:${PORT}`);
  });
}
