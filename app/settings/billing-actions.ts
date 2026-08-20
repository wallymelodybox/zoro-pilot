'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { getStripeClient, priceIdForLicenseType, type LicenseType } from '@/lib/stripe'
import { isOwnerOrSuperAdmin } from '@/lib/roles'

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

/**
 * Creates a Stripe Checkout Session for renewing the caller's organization
 * license. Returns the hosted Checkout URL — the web app redirects to it
 * directly, the mobile app opens it in a WebView. Same backend, same
 * payment path for both clients.
 * 🔒 Réservé au DG (executive) ou super admin de l'organisation.
 */
export async function createLicenseCheckoutSession(licenseType: LicenseType) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non autorisé.' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, rbac_role, email, name')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) return { error: 'Organisation introuvable pour votre compte.' }
    if (!isOwnerOrSuperAdmin(profile.rbac_role)) {
      return { error: 'Seul le DG peut renouveler la licence de l’organisation.' }
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('La clé SUPABASE_SERVICE_ROLE_KEY est manquante.')
    }

    const supabaseAdmin = createAdminClient()
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name, stripe_customer_id')
      .eq('id', profile.organization_id)
      .single()

    if (orgError || !org) return { error: 'Organisation introuvable.' }

    const stripe = getStripeClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Reuse the existing Stripe Customer for this org if we have one, so
    // repeat renewals show up under the same customer in the Stripe
    // dashboard instead of creating a new one every time.
    let customerId = org.stripe_customer_id as string | null
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: org.name,
        email: profile.email,
        metadata: { organization_id: org.id },
      })
      customerId = customer.id
      await supabaseAdmin
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', org.id)
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceIdForLicenseType(licenseType), quantity: 1 }],
      success_url: `${appUrl}/settings?section=billing&checkout=success`,
      cancel_url: `${appUrl}/settings?section=billing&checkout=cancelled`,
      metadata: {
        organization_id: org.id,
        license_type: licenseType,
        created_by: user.id,
      },
      subscription_data: {
        metadata: { organization_id: org.id, license_type: licenseType },
      },
    })

    if (!session.url) return { error: 'Impossible de créer la session de paiement.' }

    await supabaseAdmin.from('subscription_payments').insert({
      organization_id: org.id,
      stripe_checkout_session_id: session.id,
      license_type: licenseType,
      status: 'pending',
      created_by: user.id,
    })

    return { success: true, checkoutUrl: session.url }
  } catch (error: any) {
    console.error('createLicenseCheckoutSession error:', error)
    return { error: error.message || 'Erreur lors de la création de la session de paiement.' }
  }
}

/**
 * Returns the organization's current billing state, including Stripe
 * subscription status when one exists — used by both the web settings page
 * and (via a thin API route) the mobile app.
 */
export async function getBillingState() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non autorisé.' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) return { error: 'Organisation introuvable.' }

    const { data: org, error } = await supabase
      .from('organizations')
      .select('license_type, license_status, expires_at, trial_ends_at')
      .eq('id', profile.organization_id)
      .single()

    if (error || !org) return { error: 'Organisation introuvable.' }

    return { success: true, organization: org }
  } catch (error: any) {
    console.error('getBillingState error:', error)
    return { error: error.message || 'Erreur lors de la récupération de l’abonnement.' }
  }
}
