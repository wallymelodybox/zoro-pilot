import Stripe from 'stripe'

/**
 * Server-only Stripe client. Never import this from a "use client" file —
 * it reads STRIPE_SECRET_KEY, which must never reach the browser bundle.
 */
export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('La clé STRIPE_SECRET_KEY est manquante.')
  }
  return new Stripe(secretKey)
}

export type LicenseType = 'mensuelle' | 'trimestrielle' | 'semestrielle' | 'annuelle'

/**
 * Stripe Price IDs per license duration, configured once in the Stripe
 * dashboard (recurring prices) and referenced here by env var so the actual
 * price/currency can be changed without a code deploy.
 */
export function priceIdForLicenseType(licenseType: LicenseType): string {
  const envVar = {
    mensuelle: 'STRIPE_PRICE_MENSUELLE',
    trimestrielle: 'STRIPE_PRICE_TRIMESTRIELLE',
    semestrielle: 'STRIPE_PRICE_SEMESTRIELLE',
    annuelle: 'STRIPE_PRICE_ANNUELLE',
  }[licenseType]

  const priceId = process.env[envVar]
  if (!priceId) {
    throw new Error(`Le prix Stripe pour la licence "${licenseType}" n'est pas configuré (${envVar}).`)
  }
  return priceId
}

export function licenseDurationDays(licenseType: LicenseType): number {
  return { mensuelle: 30, trimestrielle: 90, semestrielle: 180, annuelle: 365 }[licenseType]
}
