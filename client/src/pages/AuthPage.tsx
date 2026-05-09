import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Heart, Mail, Lock, User, Sparkles, Phone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits').regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  marketingConsent: z.boolean().optional().default(false),
  termsAccepted: z.boolean().refine((val) => val === true, { message: 'You must agree to the Terms of Service' }),
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const magicLinkSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type RegisterForm = z.infer<typeof registerSchema>;
type LoginForm = z.infer<typeof loginSchema>;
type MagicLinkForm = z.infer<typeof magicLinkSchema>;

const getRedirectTarget = (): string => {
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get('returnTo');
  if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') && returnTo !== '/auth') {
    return returnTo;
  }
  return '/dashboard';
};

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register' | 'magic'>('login');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to intended destination when user becomes authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      console.log('[AuthPage] User is authenticated, redirecting');
      window.location.href = getRedirectTarget();
    }
  }, [isAuthenticated, isLoading]);

  // Fallback redirect when login succeeds
  useEffect(() => {
    if (loginSuccess) {
      console.log('[AuthPage] Login success state detected, forcing redirect');
      const timer = setTimeout(() => {
        window.location.href = getRedirectTarget();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loginSuccess]);

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', phoneNumber: '', firstName: '', lastName: '', marketingConsent: false },
  });

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const magicLinkForm = useForm<MagicLinkForm>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: '' },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      console.log('[AuthPage] Submitting registration:', { email: data.email });
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      console.log('[AuthPage] Registration response status:', response.status);
      if (!response.ok) {
        const error = await response.json();
        console.error('[AuthPage] Registration failed:', error);
        throw new Error(error.message || 'Registration failed');
      }
      const result = await response.json();
      console.log('[AuthPage] Registration successful:', result);
      return result;
    },
    onSuccess: () => {
      console.log('[AuthPage] Registration mutation onSuccess called');
      // Show toast immediately
      toast({ title: 'Welcome to Heartbeat Studio!', description: 'Your account has been created.' });
      // Set login success state to trigger redirect via useEffect
      setLoginSuccess(true);
      // Invalidate cache to update auth state
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      console.log('[AuthPage] Registration success, redirect will happen via useEffect');
    },
    onError: (error: any) => {
      console.error('[AuthPage] Registration mutation error:', error);
      toast({ variant: 'destructive', title: 'Registration failed', description: error.message });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      console.log('[AuthPage] Submitting login:', { email: data.email });
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      console.log('[AuthPage] Login response status:', response.status);
      if (!response.ok) {
        const error = await response.json();
        console.error('[AuthPage] Login failed:', error);
        throw new Error(error.message || 'Login failed');
      }
      const result = await response.json();
      console.log('[AuthPage] Login successful:', result);
      return result;
    },
    onSuccess: () => {
      console.log('[AuthPage] Login mutation onSuccess called');
      // Show toast immediately
      toast({ title: 'Welcome back!', description: 'You have successfully signed in.' });
      // Set login success state to trigger redirect via useEffect
      setLoginSuccess(true);
      // Invalidate cache to update auth state
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      console.log('[AuthPage] Login success, redirect will happen via useEffect');
    },
    onError: (error: any) => {
      console.error('[AuthPage] Login mutation error:', error);
      toast({ variant: 'destructive', title: 'Login failed', description: error.message });
    },
  });

  const magicLinkMutation = useMutation({
    mutationFn: async (data: MagicLinkForm) => {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send magic link');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: 'Magic link sent!', 
        description: 'Check your email for a link to sign in. The link expires in 10 minutes.' 
      });
      magicLinkForm.reset();
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Failed to send magic link', description: error.message });
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-8 h-8 text-primary heartbeat" fill="currentColor" />
            <h1 className="text-2xl font-fredoka font-semibold text-primary">Heartbeat Studio</h1>
          </div>
          <CardTitle className="text-xl">
            {mode === 'register' && 'Create your account'}
            {mode === 'login' && 'Welcome back'}
            {mode === 'magic' && 'Sign in with magic link'}
          </CardTitle>
          <CardDescription>
            {mode === 'register' && 'Join us and start creating personalized celebrations'}
            {mode === 'login' && 'Sign in to continue creating and sharing joy'}
            {mode === 'magic' && 'Enter your email to receive a sign-in link'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {mode === 'register' && (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={registerForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="John" 
                            data-testid="input-firstname"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Doe" 
                            data-testid="input-lastname"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            type="email" 
                            placeholder="you@example.com" 
                            className="pl-10"
                            data-testid="input-email"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            type="tel" 
                            placeholder="(555) 123-4567" 
                            className="pl-10"
                            data-testid="input-phone"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            type="password" 
                            placeholder="••••••••" 
                            className="pl-10"
                            data-testid="input-password"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registerForm.control}
                  name="termsAccepted"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value === true}
                          onCheckedChange={(checked) => field.onChange(checked ? true : false)}
                          data-testid="checkbox-terms"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          I agree to the{' '}
                          <a 
                            href="/terms" 
                            target="_blank" 
                            className="text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Terms of Service
                          </a>
                          {' '}and understand how my content will be used
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="marketingConsent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-marketing-consent"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          Send me updates about new features, special offers, and celebration tips
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={registerMutation.isPending}
                  data-testid="button-register"
                >
                  {registerMutation.isPending ? 'Creating account...' : 'Create account'}
                </Button>
              </form>
            </Form>
          )}

          {mode === 'login' && (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-3">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            type="email" 
                            placeholder="you@example.com" 
                            className="pl-10"
                            data-testid="input-email"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            type="password" 
                            placeholder="••••••••" 
                            className="pl-10"
                            data-testid="input-password"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
            </Form>
          )}

          {mode === 'magic' && (
            <Form {...magicLinkForm}>
              <form onSubmit={magicLinkForm.handleSubmit((data) => magicLinkMutation.mutate(data))} className="space-y-3">
                <FormField
                  control={magicLinkForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            type="email" 
                            placeholder="you@example.com" 
                            className="pl-10"
                            data-testid="input-email"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full gap-2" 
                  disabled={magicLinkMutation.isPending}
                  data-testid="button-magic-link"
                >
                  <Sparkles className="w-4 h-4" />
                  {magicLinkMutation.isPending ? 'Sending...' : 'Send magic link'}
                </Button>
              </form>
            </Form>
          )}

          <div className="space-y-2 text-center text-sm">
            {mode === 'login' && (
              <>
                <button
                  type="button"
                  onClick={() => setMode('magic')}
                  className="text-primary hover:underline"
                  data-testid="link-magic-signin"
                >
                  Sign in with magic link instead
                </button>
                <button
                  type="button"
                  onClick={() => setLocation('/auth/reset-password')}
                  className="text-primary hover:underline block"
                  data-testid="link-forgot-password"
                >
                  Forgot your password?
                </button>
                <div className="text-muted-foreground">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-primary hover:underline"
                    data-testid="link-register"
                  >
                    Sign up
                  </button>
                </div>
              </>
            )}
            
            {mode === 'register' && (
              <div className="text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-primary hover:underline"
                  data-testid="link-login"
                >
                  Sign in
                </button>
              </div>
            )}
            
            {mode === 'magic' && (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-primary hover:underline"
                data-testid="link-password-signin"
              >
                Sign in with password instead
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
