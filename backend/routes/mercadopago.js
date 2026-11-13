// AI-assisted: see docs/AI_LOG.md #26
const express = require('express');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const { validatePaymentPayload } = require('../server');

const router = express.Router();

/**
 * POST /api/payments/mercadopago/preference
 *
 * Recibe { tripId, amount, title, paymentMethod: 'mercadopago' }
 * Crea una preferencia de pago en Mercado Pago Checkout Pro (modo sandbox/test)
 * usando exclusivamente MP_ACCESS_TOKEN desde backend/.env.
 */
router.post('/preference', async (req, res) => {
  const validation = validatePaymentPayload({
    ...req.body,
    paymentMethod: req.body?.paymentMethod || 'mercadopago',
  });

  if (!validation.valid) {
    return res.status(400).json({
      ok: false,
      error: validation.error,
    });
  }

  const { tripId, amount, title } = validation.data;
  const baseUrl = (process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 4000}`).replace(/\/$/, '');
  const accessToken = (process.env.MP_ACCESS_TOKEN || '').trim();

  // Si hay MP_ACCESS_TOKEN configurado en backend/.env, creamos la preferencia real en Mercado Pago
  if (accessToken) {
    try {
      const client = new MercadoPagoConfig({ accessToken });
      const preferenceClient = new Preference(client);

      const response = await preferenceClient.create({
        body: {
          items: [
            {
              id: tripId,
              title,
              quantity: 1,
              unit_price: amount,
              currency_id: 'COP',
            },
          ],
          external_reference: tripId,
          back_urls: {
            success: `${baseUrl}/api/payments/mercadopago/callback?status=approved&tripId=${encodeURIComponent(tripId)}`,
            failure: `${baseUrl}/api/payments/mercadopago/callback?status=rejected&tripId=${encodeURIComponent(tripId)}`,
            pending: `${baseUrl}/api/payments/mercadopago/callback?status=pending&tripId=${encodeURIComponent(tripId)}`,
          },
        },
      });

      const checkoutUrl = response.sandbox_init_point || response.init_point;
      const paymentId = `mp_pref_${response.id}`;

      return res.json({
        ok: true,
        mode: 'mercadopago_sandbox',
        tripId,
        amount,
        preferenceId: response.id,
        paymentId,
        checkoutUrl,
        paymentStatus: 'approved',
      });
    } catch (mpError) {
      console.warn('[MercadoPago SDK]:', mpError.message);
      return res.status(502).json({
        ok: false,
        error: `Error al crear preferencia en Mercado Pago: ${mpError.message}`,
      });
    }
  }

  // Modo sandbox de prueba cuando MP_ACCESS_TOKEN está vacío en .env
  const simulatedPrefId = `sandbox_pref_${tripId}_${Date.now()}`;
  const paymentId = `mp_test_${Date.now()}`;
  const checkoutUrl = `${baseUrl}/api/payments/mercadopago/sandbox-checkout?tripId=${encodeURIComponent(tripId)}&amount=${amount}&title=${encodeURIComponent(title)}&paymentId=${encodeURIComponent(paymentId)}`;



  return res.json({
    ok: true,
    mode: 'local_sandbox',
    tripId,
    amount,
    preferenceId: simulatedPrefId,
    paymentId,
    checkoutUrl,
    paymentStatus: 'approved',
  });
});

/**
 * GET /api/payments/mercadopago/sandbox-checkout
 * Vista HTML ligera de Checkout Pro Sandbox para pruebas cuando no se ha
 * cargado un MP_ACCESS_TOKEN real o se prueba en red local.
 */
router.get('/sandbox-checkout', (req, res) => {
  const tripId = String(req.query.tripId || 'trip');
  const amount = Number(req.query.amount) || 0;
  const title = String(req.query.title || 'Viaje UberClone');
  const paymentId = String(req.query.paymentId || `mp_test_${Date.now()}`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Mercado Pago Checkout Pro (Sandbox)</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #009EE3; color: #fff; margin: 0; padding: 24px; display: flex; align-items: center; justify-content: center; min-height: 90vh; }
    .card { background: #fff; color: #111827; border-radius: 16px; padding: 24px; max-width: 380px; width: 100%; box-shadow: 0 10px 25px rgba(0,0,0,0.2); text-align: center; }
    .badge { display: inline-block; background: #E0F2FE; color: #0369A1; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; margin-bottom: 12px; }
    .amount { font-size: 32px; font-weight: 800; margin: 12px 0; color: #111827; }
    .meta { font-size: 13px; color: #6B7280; margin-bottom: 16px; }
    .ok { background: #ECFDF5; color: #065F46; padding: 12px; border-radius: 10px; font-weight: 600; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">MERCADO PAGO · MODO PRUEBA</div>
    <h2 style="margin: 4px 0;">${title}</h2>
    <div class="amount">$${amount.toLocaleString('es-CO')} COP</div>
    <div class="meta">Viaje: ${tripId}<br/>Referencia: ${paymentId}</div>
    <div class="ok">Pago aprobado en entorno de pruebas. Ya puedes volver a la app del conductor.</div>
  </div>
</body>
</html>`);
});

/**
 * GET /api/payments/mercadopago/callback
 * Retorno de back_urls de Mercado Pago Checkout Pro.
 */
router.get('/callback', (req, res) => {
  const status = String(req.query.status || 'approved');
  const tripId = String(req.query.tripId || '');
  res.json({ ok: true, tripId, status });
});

module.exports = router;
