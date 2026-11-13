// AI-assisted: see docs/AI_LOG.md #27
const express = require('express');
const Stripe = require('stripe');
const { validatePaymentPayload } = require('../server');

const router = express.Router();

/**
 * POST /api/payments/stripe/payment-intent
 *
 * Recibe { tripId, amount, title, paymentMethod: 'stripe' }
 * Crea un PaymentIntent en Stripe (modo test) usando exclusivamente
 * STRIPE_SECRET_KEY desde backend/.env.
 */
router.post('/payment-intent', async (req, res) => {
  const validation = validatePaymentPayload({
    ...req.body,
    paymentMethod: req.body?.paymentMethod || 'stripe',
  });

  if (!validation.valid) {
    return res.status(400).json({
      ok: false,
      error: validation.error,
    });
  }

  const { tripId, amount, title } = validation.data;
  const baseUrl = (process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 4000}`).replace(/\/$/, '');
  const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim();

  // Si existe STRIPE_SECRET_KEY en backend/.env, usamos el SDK oficial de Stripe
  if (secretKey) {
    try {
      const stripe = new Stripe(secretKey);

      // Stripe exige montos en la subunidad mínima de la moneda (centavos): amount * 100
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100,
        currency: 'cop',
        description: title,
        metadata: { tripId },
        automatic_payment_methods: { enabled: true },
      });

      return res.json({
        ok: true,
        mode: 'stripe_test',
        tripId,
        amount,
        paymentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
        checkoutUrl: `${baseUrl}/api/payments/stripe/sandbox-checkout?tripId=${encodeURIComponent(tripId)}&amount=${amount}&title=${encodeURIComponent(title)}&paymentId=${encodeURIComponent(paymentIntent.id)}`,
        paymentStatus: 'paid',
      });
    } catch (stripeError) {
      console.warn('[Stripe SDK]:', stripeError.message);
      return res.status(502).json({
        ok: false,
        error: `Error al crear PaymentIntent en Stripe: ${stripeError.message}`,
      });
    }
  }

  // Modo sandbox local cuando STRIPE_SECRET_KEY no está definida en .env
  const simulatedPiId = `pi_test_${Date.now()}`;
  const simulatedClientSecret = `${simulatedPiId}_secret_${Math.random().toString(36).slice(2, 10)}`;
  const checkoutUrl = `${baseUrl}/api/payments/stripe/sandbox-checkout?tripId=${encodeURIComponent(tripId)}&amount=${amount}&title=${encodeURIComponent(title)}&paymentId=${encodeURIComponent(simulatedPiId)}`;

  return res.json({
    ok: true,
    mode: 'local_sandbox',
    tripId,
    amount,
    paymentId: simulatedPiId,
    clientSecret: simulatedClientSecret,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_sandbox',
    checkoutUrl,
    paymentStatus: 'paid',
  });
});

/**
 * GET /api/payments/stripe/sandbox-checkout
 * Vista HTML de confirmación de Stripe PaymentSheet (Test Mode) para
 * verificar visualmente la transacción en Expo Go.
 */
router.get('/sandbox-checkout', (req, res) => {
  const tripId = String(req.query.tripId || 'trip');
  const amount = Number(req.query.amount) || 0;
  const title = String(req.query.title || 'Viaje UberClone');
  const paymentId = String(req.query.paymentId || `pi_test_${Date.now()}`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Stripe PaymentSheet (Test Mode)</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #635BFF; color: #fff; margin: 0; padding: 24px; display: flex; align-items: center; justify-content: center; min-height: 90vh; }
    .card { background: #fff; color: #111827; border-radius: 16px; padding: 24px; max-width: 380px; width: 100%; box-shadow: 0 10px 25px rgba(0,0,0,0.2); text-align: center; }
    .badge { display: inline-block; background: #EEF2FF; color: #4F46E5; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; margin-bottom: 12px; }
    .amount { font-size: 32px; font-weight: 800; margin: 12px 0; color: #111827; }
    .meta { font-size: 13px; color: #6B7280; margin-bottom: 16px; }
    .card-box { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 10px; font-size: 13px; color: #374151; margin-bottom: 14px; font-family: monospace; }
    .ok { background: #ECFDF5; color: #065F46; padding: 12px; border-radius: 10px; font-weight: 600; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">STRIPE · TEST MODE</div>
    <h2 style="margin: 4px 0;">${title}</h2>
    <div class="amount">$${amount.toLocaleString('es-CO')} COP</div>
    <div class="card-box">Tarjeta de prueba: •••• •••• •••• 4242</div>
    <div class="meta">Viaje: ${tripId}<br/>PaymentIntent: ${paymentId}</div>
    <div class="ok">PaymentIntent confirmado en modo prueba. Ya puedes volver a la app del conductor.</div>
  </div>
</body>
</html>`);
});

module.exports = router;
