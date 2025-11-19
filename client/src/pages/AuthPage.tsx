import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Heart, Mail, Lock, User, Sparkles } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
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

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register' | 'magic'>('login');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', firstName: '', lastName: '' },
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({ title: 'Welcome to Heartbeat Studio!', description: 'Your account has been created.' });
      setLocation('/dashboard');
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Registration failed', description: error.message });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({ title: 'Welcome back!', description: 'You have successfully signed in.' });
      setLocation('/dashboard');
    },
    onError: (error: any) => {
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

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-8 h-8 text-primary" fill="currentColor" />
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

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              or
            </span>
          </div>

          <Button 
            variant="outline" 
            className="w-full gap-2" 
            onClick={handleGoogleLogin}
            data-testid="button-google-login"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

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
