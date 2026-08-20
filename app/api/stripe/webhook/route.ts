import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getStripeClient, licenseDurationDays, type LicenseType } from '@/lib/stripe'
import type Stripe from 'stripe'

/**
 * Recent Stripe API versions moved the subscription reference off `Invoice`
 * directly and under `invoice.parent.subscription_details.subscription`
 * (see the `stripe` package's bundled Invoices.d.ts for the current shape).
 */
function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const subscription = invoice.parent?.subscription_details?.subscription
  return typeof subscription === 'string' ? subscription : subscription?.id ?? null
}

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

/**
 * Stripe webhook — the only place license renewals actually take effect.
 * Never trust the client (web redirect or mobile WebView) to confirm a
 * payment; only a signature-verified event from Stripe can extend a
 * license, matching how app/bo-zoro-control-2026-secure/actions.ts treats
 * license changes as a privileged, backend-only operation.
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is missing')
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 500 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 })
  }

  const rawBody = await request.text()
  const stripe = getStripeClient()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (error: any) {
    console.error('Stripe webhook signature verification failed:', error.message)
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const organizationId = session.metadata?.organization_id
      const licenseType = session.metadata?.license_type as LicenseType | undefined
      if (!organizationId || !licenseType) break

      const expiresAt = new Date(Date.now() + licenseDurationDays(licenseType) * 24 * 60 * 60 * 1000)

      await supabaseAdmin
        .from('organizations')
        .update({
          license_type: licenseType,
          license_status: 'active',
          expires_at: expiresAt.toISOString(),
          stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : null,
        })
        .eq('id', organizationId)

      await supabaseAdmin
        .from('subscription_payments')
        .update({
          status: 'succeeded',
          stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
          stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : null,
          completed_at: new Date().toISOString(),
        })
        .eq('stripe_checkout_session_id', session.id)

      const { data: dgs } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('organization_id', organizationId)
        .in('rbac_role', ['admin', 'executive'])

      for (const dg of dgs || []) {
        await supabaseAdmin.from('notifications').insert({
          organization_id: organizationId,
          user_id: dg.id,
          type: 'success',
          title: 'Licence renouvelée',
          content: `Votre abonnement (${licenseType}) a été renouvelé avec succès jusqu'au ${expiresAt.toLocaleDateString('fr-FR')}.`,
          link: '/settings?section=billing',
        })
      }
      break
    }

    // Recurring renewal on a subscription created via the flow above.
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = subscriptionIdFromInvoice(invoice)
      if (!subscriptionId) break

      const { data: org } = await supabaseAdmin
        .from('organizations')
        .select('id, license_type')
        .eq('stripe_subscription_id', subscriptionId)
        .maybeSingle()

      if (!org) break

      const licenseType = (org.license_type as LicenseType) || 'mensuelle'
      const expiresAt = new Date(Date.now() + licenseDurationDays(licenseType) * 24 * 60 * 60 * 1000)

      await supabaseAdmin
        .from('organizations')
        .update({ license_status: 'active', expires_at: expiresAt.toISOString() })
        .eq('id', org.id)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = subscriptionIdFromInvoice(invoice)
      if (!subscriptionId) break

      const { data: org } = await supabaseAdmin
        .from('organizations')
        .select('id, name')
        .eq('stripe_subscription_id', subscriptionId)
        .maybeSingle()

      if (!org) break

      const { data: dgs } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('organization_id', org.id)
        .in('rbac_role', ['admin', 'executive'])

      for (const dg of dgs || []) {
        await supabaseAdmin.from('notifications').insert({
          organization_id: org.id,
          user_id: dg.id,
          type: 'alert',
          title: 'Échec du paiement',
          content: `Le renouvellement de votre abonnement a échoué. Mettez à jour votre moyen de paiement pour éviter une interruption de service.`,
          link: '/settings?section=billing',
        })
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await supabaseAdmin
        .from('organizations')
        .update({ license_status: 'expiree' })
        .eq('stripe_subscription_id', subscription.id)
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
