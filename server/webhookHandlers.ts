import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';

// Credit amounts for each product type
const CREDIT_AMOUNTS: Record<string, number> = {
  'Credit Pack': 5,
  'Date Night Kit': 3,
  'Birthday Blast': 1,
  'Gospel Greeting': 2,
  'Classroom Cheers': 5,
};

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    // First, let the sync library process the webhook
    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    // Then, handle our custom credit granting logic
    try {
      const stripe = await getUncachableStripeClient();
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );

      if (event.type === 'checkout.session.completed') {
        await WebhookHandlers.handleCheckoutCompleted(event.data.object);
      }
    } catch (error: any) {
      // If webhook secret isn't set, try parsing without signature verification
      // This is for development environments
      if (error.message?.includes('webhook_secret')) {
        console.log('[Webhook] Processing without signature verification (dev mode)');
        const event = JSON.parse(payload.toString());
        if (event.type === 'checkout.session.completed') {
          await WebhookHandlers.handleCheckoutCompleted(event.data.object);
        }
      } else {
        console.error('[Webhook] Error processing custom logic:', error.message);
      }
    }
  }

  static async handleCheckoutCompleted(session: any): Promise<void> {
    try {
      const stripe = await getUncachableStripeClient();
      const customerId = session.customer;
      const mode = session.mode;

      if (!customerId) {
        console.log('[Webhook] No customer ID in session, skipping credit grant');
        return;
      }

      // Get user by Stripe customer ID
      const user = await storage.getUserByStripeCustomerId(customerId);
      if (!user) {
        console.log(`[Webhook] No user found for customer ${customerId}`);
        return;
      }

      // Handle one-time payments (credit packs and kits)
      if (mode === 'payment') {
        // Get line items to determine what was purchased
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        
        for (const item of lineItems.data) {
          const product = await stripe.products.retrieve(item.price?.product as string);
          const productName = product.name;
          const creditsToAdd = CREDIT_AMOUNTS[productName] || 0;

          if (creditsToAdd > 0) {
            const newCredits = (user.songsRemaining ?? 0) + creditsToAdd;
            await storage.updateUser(user.id, { songsRemaining: newCredits });
            console.log(`[Webhook] Granted ${creditsToAdd} credits to user ${user.id} for ${productName}. New total: ${newCredits}`);
          }
        }
      }

      // Handle subscription payments
      if (mode === 'subscription') {
        // Grant 15 songs for subscription
        const subscriptionCredits = 15;
        const newCredits = (user.songsRemaining ?? 0) + subscriptionCredits;
        await storage.updateUser(user.id, { 
          songsRemaining: newCredits,
          subscriptionStatus: 'active',
        });
        console.log(`[Webhook] Subscription activated for user ${user.id}. Granted ${subscriptionCredits} credits. New total: ${newCredits}`);
      }
    } catch (error: any) {
      console.error('[Webhook] Error handling checkout completed:', error.message);
    }
  }
}
