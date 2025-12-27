import { getUncachableStripeClient } from './stripeClient';

async function seedProducts() {
  console.log('Creating Stripe products for Heartbeat Studio...');
  const stripe = await getUncachableStripeClient();

  const existingProducts = await stripe.products.list({ limit: 100 });
  const productNames = existingProducts.data.map(p => p.name);

  if (!productNames.includes('Credit Pack')) {
    console.log('Creating Credit Pack product...');
    const creditPack = await stripe.products.create({
      name: 'Credit Pack',
      description: '5 songs + cover art - Perfect for a special occasion',
      metadata: {
        type: 'one_time',
        songs: '5',
      },
    });

    await stripe.prices.create({
      product: creditPack.id,
      unit_amount: 499,
      currency: 'usd',
      metadata: { plan: 'credit_pack' },
    });
    console.log('Credit Pack created:', creditPack.id);
  } else {
    console.log('Credit Pack already exists, skipping...');
  }

  if (!productNames.includes('Subscription')) {
    console.log('Creating Subscription product...');
    const subscription = await stripe.products.create({
      name: 'Subscription',
      description: '15 songs per month - For those who celebrate often',
      metadata: {
        type: 'subscription',
        songs_per_month: '15',
      },
    });

    await stripe.prices.create({
      product: subscription.id,
      unit_amount: 1000,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { plan: 'subscription' },
    });
    console.log('Subscription created:', subscription.id);
  } else {
    console.log('Subscription already exists, skipping...');
  }

  console.log('Stripe products seeded successfully!');
}

seedProducts().catch(console.error);
