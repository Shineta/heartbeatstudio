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

  // Themed Kits
  if (!productNames.includes('Date Night Kit')) {
    console.log('Creating Date Night Kit product...');
    const dateNightKit = await stripe.products.create({
      name: 'Date Night Kit',
      description: '3 love songs + 3 covers - Perfect for romantic celebrations',
      metadata: {
        type: 'kit',
        songs: '3',
        covers: '3',
        theme: 'love',
      },
    });

    await stripe.prices.create({
      product: dateNightKit.id,
      unit_amount: 500,
      currency: 'usd',
      metadata: { plan: 'date_night_kit' },
    });
    console.log('Date Night Kit created:', dateNightKit.id);
  } else {
    console.log('Date Night Kit already exists, skipping...');
  }

  if (!productNames.includes('Birthday Blast')) {
    console.log('Creating Birthday Blast product...');
    const birthdayBlast = await stripe.products.create({
      name: 'Birthday Blast',
      description: '1 birthday song + 1 visual animation',
      metadata: {
        type: 'kit',
        songs: '1',
        visuals: '1',
        theme: 'birthday',
      },
    });

    await stripe.prices.create({
      product: birthdayBlast.id,
      unit_amount: 250,
      currency: 'usd',
      metadata: { plan: 'birthday_blast' },
    });
    console.log('Birthday Blast created:', birthdayBlast.id);
  } else {
    console.log('Birthday Blast already exists, skipping...');
  }

  if (!productNames.includes('Gospel Greeting')) {
    console.log('Creating Gospel Greeting product...');
    const gospelGreeting = await stripe.products.create({
      name: 'Gospel Greeting',
      description: '2 spiritual messages + 2 images',
      metadata: {
        type: 'kit',
        songs: '2',
        images: '2',
        theme: 'spiritual',
      },
    });

    await stripe.prices.create({
      product: gospelGreeting.id,
      unit_amount: 300,
      currency: 'usd',
      metadata: { plan: 'gospel_greeting' },
    });
    console.log('Gospel Greeting created:', gospelGreeting.id);
  } else {
    console.log('Gospel Greeting already exists, skipping...');
  }

  if (!productNames.includes('Classroom Cheers')) {
    console.log('Creating Classroom Cheers product...');
    const classroomCheers = await stripe.products.create({
      name: 'Classroom Cheers',
      description: '5 group songs for teachers & students',
      metadata: {
        type: 'kit',
        songs: '5',
        theme: 'education',
      },
    });

    await stripe.prices.create({
      product: classroomCheers.id,
      unit_amount: 500,
      currency: 'usd',
      metadata: { plan: 'classroom_cheers' },
    });
    console.log('Classroom Cheers created:', classroomCheers.id);
  } else {
    console.log('Classroom Cheers already exists, skipping...');
  }

  console.log('Stripe products seeded successfully!');
}

seedProducts().catch(console.error);
