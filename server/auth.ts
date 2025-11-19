import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { storage } from './storage';
import type { User } from '@shared/schema';

const PgSession = connectPgSimple(session);

// Session secret from environment - REQUIRED for security
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required for secure session management. Please set it in your environment.');
}

const JWT_SECRET = process.env.JWT_SECRET || SESSION_SECRET;

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const BASE_URL = process.env.REPLIT_DEV_DOMAIN 
  ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
  : 'http://localhost:5000';

export async function setupAuth(app: Express) {
  // SESSION_SECRET is guaranteed to exist due to check above
  const sessionSecret = SESSION_SECRET as string;
  
  // Session configuration
  app.use(
    session({
      store: new PgSession({
        conString: process.env.DATABASE_URL,
        tableName: 'sessions',
      }),
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Passport serialization
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Local Strategy (Email/Password)
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          
          if (!user) {
            return done(null, false, { message: 'Invalid email or password' });
          }

          if (!user.password) {
            return done(null, false, { message: 'Please use Google sign-in or magic link for this account' });
          }

          const isValidPassword = await bcrypt.compare(password, user.password);
          
          if (!isValidPassword) {
            return done(null, false, { message: 'Invalid email or password' });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Google OAuth Strategy (only if credentials are configured)
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          callbackURL: `${BASE_URL}/api/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            
            if (!email) {
              return done(new Error('No email found in Google profile'));
            }

            let user = await storage.getUserByGoogleId(profile.id);

            if (!user) {
              user = await storage.getUserByEmail(email);
              
              if (user) {
                // Link Google account to existing user
                user = await storage.updateUser(user.id, {
                  googleId: profile.id,
                  profileImageUrl: user.profileImageUrl || profile.photos?.[0]?.value,
                });
              } else {
                // Create new user
                user = await storage.createUser({
                  email,
                  googleId: profile.id,
                  firstName: profile.name?.givenName || profile.displayName?.split(' ')[0],
                  lastName: profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' '),
                  profileImageUrl: profile.photos?.[0]?.value,
                });
              }
            }

            return done(null, user);
          } catch (error) {
            return done(error as Error);
          }
        }
      )
    );
  }
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}

// Generate magic link token
export function generateMagicLinkToken(email: string): string {
  return jwt.sign({ email }, JWT_SECRET, { expiresIn: '10m' });
}

// Verify magic link token
export function verifyMagicLinkToken(token: string): { email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { email: string };
  } catch (error) {
    return null;
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
