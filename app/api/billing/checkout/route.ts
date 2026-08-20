import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getStripeClient, priceIdForLicenseType, type LicenseType } from '@/lib/stripe'
import { isOwnerOrSuperAdmin } from '@/lib/roles'

const VALID_LICENSE_TYPES: LicenseType[] = ['mensuelle', 'trimestrielle', 'semestrielle', 'annuelle']

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

/**
 * Mobile equivalent of app/settings/billing-actions.ts::createLicenseCheckoutSession
 * — Server Actions aren't callable from Flutter, so this exposes the same
 * logic over HTTP. Auth is via the caller's Supabase access token (the
 * mobile app already holds one from supabase_flutter), verified here with
 * the admin client rather than trusted from the request body.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace(/^Bearer\s+/i, '')
    if (!accessToken) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
    }

    const { licenseType } = await request.json()
    if (!VALID_LICENSE_TYPES.includes(licenseType)) {
      return NextResponse.json({ error: 'Type de licence invalide.' }, { status: 400 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('La clé SUPABASE_SERVICE_ROLE_KEY est manquante.')
    }

    const supabaseAdmin = createAdminClient()
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken)
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Session invalide.' }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('organization_id, rbac_role, email, name')
      .eq('id', userData.user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organisation introuvable pour votre compte.' }, { status: 400 })
    }
    if (!isOwnerOrSuperAdmin(profile.rbac_role)) {
      return NextResponse.json({ error: 'Seul le DG peut renouveler la licence de l’organisation.' }, { status: 403 })
    }

    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name, stripe_customer_id')
      .eq('id', profile.organization_id)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organisation introuvable.' }, { status: 404 })
    }

    const stripe = getStripeClient()

    let customerId = org.stripe_customer_id as string | null
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: org.name,
        email: profile.email,
        metadata: { organization_id: org.id },
      })
      customerId = customer.id
      await supabaseAdmin.from('organizations').update({ stripe_customer_id: customerId }).eq('id', org.id)
    }

    // Mobile has no web page to redirect back to — success/cancel land on a
    // custom URL scheme the app registers, which reopens it directly.
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceIdForLicenseType(licenseType), quantity: 1 }],
      success_url: 'zoropilote://billing/success',
      cancel_url: 'zoropilote://billing/cancelled',
      metadata: {
        organization_id: org.id,
        license_type: licenseType,
        created_by: userData.user.id,
      },
      subscription_data: {
        metadata: { organization_id: org.id, license_type: licenseType },
      },
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Impossible de créer la session de paiement.' }, { status: 500 })
    }

    await supabaseAdmin.from('subscription_payments').insert({
      organization_id: org.id,
      stripe_checkout_session_id: session.id,
      license_type: licenseType,
      status: 'pending',
      created_by: userData.user.id,
    })

    return NextResponse.json({ checkoutUrl: session.url })
  } catch (error: any) {
    console.error('POST /api/billing/checkout error:', error)
    return NextResponse.json({ error: error.message || 'Erreur lors de la création de la session de paiement.' }, { status: 500 })
  }
}
