import bcrypt from 'bcrypt';
import { eq, and } from 'drizzle-orm';
import { db } from '../server/db.js';
import { users, lovedOnes, creations } from '../shared/schema.js';

const PRODUCTION_URL_FRAGMENT = 'heartbeatstudio.org';

function guardProduction(): void {
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: Refusing to seed — NODE_ENV is "production".');
    process.exit(1);
  }
  const appUrl = process.env.APP_URL ?? '';
  const baseUrl = process.env.BASE_URL ?? '';
  if (
    appUrl.includes(PRODUCTION_URL_FRAGMENT) ||
    baseUrl.includes(PRODUCTION_URL_FRAGMENT)
  ) {
    console.error(
      `ERROR: Refusing to seed — APP_URL/BASE_URL contains "${PRODUCTION_URL_FRAGMENT}".`
    );
    process.exit(1);
  }
}

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

type SeedUser = {
  email: string;
  isAdmin: boolean;
  songsRemaining: number;
  role: string;
};

const SEED_USERS: SeedUser[] = [
  {
    email: 'wuanconsults+qa-normal@gmail.com',
    isAdmin: false,
    songsRemaining: 3,
    role: 'normal',
  },
  {
    email: 'wuanconsults+qa-zero@gmail.com',
    isAdmin: false,
    songsRemaining: 0,
    role: 'zero-credits',
  },
  {
    email: 'wuanconsults+qa-admin@gmail.com',
    isAdmin: true,
    songsRemaining: 9999,
    role: 'admin',
  },
];

type LovedOneSpec = { name: string; relationship: string; birthday: string; interests: string };

const LOVED_ONES_BY_ROLE: Record<string, LovedOneSpec[]> = {
  normal: [
    {
      name: 'Alex Rivera',
      relationship: 'best friend',
      birthday: '06-15',
      interests: 'hiking, coffee, jazz music',
    },
    {
      name: 'Mom',
      relationship: 'mother',
      birthday: '03-22',
      interests: 'gardening, cooking, classic films',
    },
  ],
  'zero-credits': [
    {
      name: 'Jordan Lee',
      relationship: 'sibling',
      birthday: '11-08',
      interests: 'gaming, sci-fi, skateboarding',
    },
    {
      name: 'Sam Park',
      relationship: 'partner',
      birthday: '07-04',
      interests: 'yoga, travel, photography',
    },
  ],
  admin: [
    {
      name: 'Test Recipient A',
      relationship: 'colleague',
      birthday: '01-01',
      interests: 'reading, chess, classical music',
    },
    {
      name: 'Test Recipient B',
      relationship: 'friend',
      birthday: '12-31',
      interests: 'painting, cycling, poetry',
    },
  ],
};

const FAKE_SONG_TITLE = '[SEED] Birthday Song for Alex';
const FAKE_SONG_LYRICS = `Happy birthday to you, Alex, our best friend so true,
We celebrate today with laughter and cheer so bright,
Your smile lights up every room and fills the night,
May this year bring you joy, adventure, and delight,
Here's to you, keep shining your beautiful light,
Wishing you happiness through every moment of life.`;

async function upsertUser(spec: SeedUser, passwordHash: string): Promise<string> {
  const [row] = await db
    .insert(users)
    .values({
      email: spec.email,
      password: passwordHash,
      isAdmin: spec.isAdmin,
      songsRemaining: spec.songsRemaining,
      firstName: spec.role === 'admin' ? 'Admin' : 'Test',
      lastName: 'User',
      marketingConsent: false,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        password: passwordHash,
        isAdmin: spec.isAdmin,
        songsRemaining: spec.songsRemaining,
        updatedAt: new Date(),
      },
    })
    .returning({ id: users.id });

  return row.id;
}

async function upsertLovedOne(
  userId: string,
  spec: LovedOneSpec
): Promise<{ created: boolean }> {
  const [existing] = await db
    .select({ id: lovedOnes.id })
    .from(lovedOnes)
    .where(and(eq(lovedOnes.userId, userId), eq(lovedOnes.name, spec.name)));

  if (existing) {
    await db
      .update(lovedOnes)
      .set({
        relationship: spec.relationship,
        birthday: spec.birthday,
        interests: spec.interests,
        updatedAt: new Date(),
      })
      .where(eq(lovedOnes.id, existing.id));
    return { created: false };
  }

  await db.insert(lovedOnes).values({
    userId,
    name: spec.name,
    relationship: spec.relationship,
    birthday: spec.birthday,
    interests: spec.interests,
  });
  return { created: true };
}

async function upsertFakeSong(userId: string, lovedOneId: string): Promise<{ created: boolean }> {
  const [existing] = await db
    .select({ id: creations.id })
    .from(creations)
    .where(
      and(
        eq(creations.userId, userId),
        eq(creations.title, FAKE_SONG_TITLE)
      )
    );

  if (existing) {
    await db
      .update(creations)
      .set({
        content: FAKE_SONG_LYRICS,
        status: 'ready',
        updatedAt: new Date(),
      })
      .where(eq(creations.id, existing.id));
    return { created: false };
  }

  await db.insert(creations).values({
    userId,
    lovedOneId,
    type: 'song',
    tone: 'sweet',
    genre: 'pop',
    title: FAKE_SONG_TITLE,
    content: FAKE_SONG_LYRICS,
    status: 'ready',
  });
  return { created: true };
}

async function main(): Promise<void> {
  guardProduction();

  const rawPassword = process.env.TEST_SEED_PASSWORD;
  if (!rawPassword) {
    console.error('ERROR: TEST_SEED_PASSWORD environment variable is not set.');
    process.exit(1);
  }

  console.log('Seeding development database...\n');

  const passwordHash = await hashPassword(rawPassword);

  for (const spec of SEED_USERS) {
    const userId = await upsertUser(spec, passwordHash);
    console.log(`[${spec.role}] ${spec.email} — upserted (id: ${userId})`);

    const lovedOneSpecs = LOVED_ONES_BY_ROLE[spec.role] ?? [];
    let firstLovedOneId: string | null = null;

    for (const loSpec of lovedOneSpecs) {
      const { created } = await upsertLovedOne(userId, loSpec);

      if (!firstLovedOneId) {
        const [row] = await db
          .select({ id: lovedOnes.id })
          .from(lovedOnes)
          .where(and(eq(lovedOnes.userId, userId), eq(lovedOnes.name, loSpec.name)));
        firstLovedOneId = row?.id ?? null;
      }

      console.log(
        `  Loved one "${loSpec.name}" (${loSpec.relationship}) — ${created ? 'created' : 'updated'}`
      );
    }

    if (spec.role === 'normal' && firstLovedOneId) {
      const { created } = await upsertFakeSong(userId, firstLovedOneId);
      console.log(
        `  Song "${FAKE_SONG_TITLE}" (${FAKE_SONG_LYRICS.length} chars) — ${created ? 'created' : 'updated'}`
      );
    }

    console.log('');
  }

  console.log('Done. Seed complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
