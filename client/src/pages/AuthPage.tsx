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
    onSuccess: async () => {
      console.log('[AuthPage] Registration mutation onSuccess called');
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      console.log('[AuthPage] Queries invalidated, showing toast');
      toast({ title: 'Welcome to Heartbeat Studio!', description: 'Your account has been created.' });
      console.log('[AuthPage] Redirecting to /dashboard');
      setTimeout(() => {
        setLocation('/dashboard');
      }, 100);
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
    onSuccess: async () => {
      console.log('[AuthPage] Login mutation onSuccess called');
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      console.log('[AuthPage] Queries invalidated, showing toast');
      toast({ title: 'Welcome back!', description: 'You have successfully signed in.' });
      console.log('[AuthPage] Redirecting to /dashboard');
      setTimeout(() => {
        setLocation('/dashboard');
      }, 100);
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
