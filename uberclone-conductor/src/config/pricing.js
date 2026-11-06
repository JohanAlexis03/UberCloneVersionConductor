// AI-assisted: see docs/AI_LOG.md #2
export const PRICING_CONFIG = {
  baseFare: 3500, // tarifa base
  perKm: 1200, // costo por kilonetro
  perMin: 250, // costo por minuto
  minFare: 6000, // tarifa minima
  commissionRate: 0.2, // comision de uber
  multipliers: {
    economy: 1.0, // tarifa base
    xl: 1.4, // tarifa economica
    premium: 1.8, // tarifa premium
  },
};

/**
 * Rounds a number to the nearest multiple of 100 COP.
 *
 * @param {number} value
 * @returns {number}
 */
export function roundToNearest100(value) {
  return Math.round(value / 100) * 100;
}

/**
 * Calculates trip fare, platform commission, and driver net earnings in Colombian Pesos (COP).
 * Strictly implements Section 5 of project specifications:
 * 1. Fare = max(minFare, roundToNearest100((baseFare + distanceKm * perKm + durationMin * perMin) * multiplier))
 * 2. Commission = Math.round(Fare * commissionRate)
 * 3. DriverEarnings = Fare - Commission + Tip (tips are 100% credited to driver)
 *
 * @param {Object} params
 * @param {number} params.distanceKm - Distance in kilometers.
 * @param {number} params.durationMin - Duration in minutes.
 * @param {'economy'|'xl'|'premium'} [params.category='economy'] - Vehicle category.
 * @param {number} [params.tip=0] - Optional tip from passenger.
 * @returns {{
 *   fare: number,
 *   commission: number,
 *   driverEarnings: number,
 *   commissionRate: number,
 *   tip: number,
 *   category: string,
 *   multiplier: number
 * }}
 */
export function calculateFare({
  distanceKm = 0,
  durationMin = 0,
  category = 'economy',
  tip = 0,
}) {
  const safeDistance = Math.max(0, Number(distanceKm) || 0);
  const safeDuration = Math.max(0, Number(durationMin) || 0);
  const safeTip = Math.max(0, Math.round(Number(tip) || 0));

  const normalizedCategory = String(category || 'economy').toLowerCase();
  const multiplier = PRICING_CONFIG.multipliers[normalizedCategory] || PRICING_CONFIG.multipliers.economy;

  const rawSum = PRICING_CONFIG.baseFare +
    (safeDistance * PRICING_CONFIG.perKm) +
    (safeDuration * PRICING_CONFIG.perMin);

  const scaledFare = rawSum * multiplier;
  const roundedFare = roundToNearest100(scaledFare);
  const fare = Math.max(PRICING_CONFIG.minFare, roundedFare);

  const commission = Math.round(fare * PRICING_CONFIG.commissionRate);
  const driverEarnings = (fare - commission) + safeTip;

  return {
    fare,
    commission,
    driverEarnings,
    commissionRate: PRICING_CONFIG.commissionRate,
    tip: safeTip,
    category: normalizedCategory,
    multiplier,
  };
}

/**
 * Formats an amount as COP currency string.
 *
 * @param {number} amount
 * @returns {string} E.g. "$ 15.000 COP"
 */
export function formatCOP(amount) {
  const cleanAmount = Math.round(Number(amount) || 0);
  const formatted = cleanAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$ ${formatted} COP`;
}
