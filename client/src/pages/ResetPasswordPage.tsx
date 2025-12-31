import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useSearch } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Heart, Lock, Mail, Phone, MessageSquare } from 'lucide-react';

const requestResetSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

const requestResetSMSSchema = z.object({
  phoneNumber: z.string().min(10, 'Please enter a valid phone number'),
});

const setPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RequestResetForm = z.infer<typeof requestResetSchema>;
type RequestResetSMSForm = z.infer<typeof requestResetSMSSchema>;
type SetPasswordForm = z.infer<typeof setPasswordSchema>;

export default function ResetPasswordPage() {
  const search = useSearch();
  const token = new URLSearchParams(search).get('token');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [resetMethod, setResetMethod] = useState<'email' | 'sms'>('email');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const requestForm = useForm<RequestResetForm>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: { email: '' },
  });

  const requestSMSForm = useForm<RequestResetSMSForm>({
    resolver: zodResolver(requestResetSMSSchema),
    defaultValues: { phoneNumber: '' },
  });

  const setPasswordForm = useForm<SetPasswordForm>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const requestResetMutation = useMutation({
    mutationFn: async (data: RequestResetForm) => {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send reset email');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: 'Check your email!', 
        description: 'If an account exists with this email, you will receive a password reset link.' 
      });
      requestForm.reset();
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Failed to send reset email', description: error.message });
    },
  });

  const requestResetSMSMutation = useMutation({
    mutationFn: async (data: RequestResetSMSForm) => {
      const response = await fetch('/api/auth/reset-password-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send reset SMS');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: 'Check your phone!', 
        description: 'If an account exists with this phone number, you will receive a password reset link via SMS.' 
      });
      requestSMSForm.reset();
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Failed to send reset SMS', description: error.message });
    },
  });

  const setPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to set password');
      }
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({ title: 'Password set successfully!', description: 'You are now logged in.' });
      setTimeout(() => setLocation('/dashboard'), 100);
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Failed to set password', description: error.message });
    },
  });

  const handleSetPassword = (data: SetPasswordForm) => {
    if (token) {
      setPasswordMutation.mutate({ token, password: data.password });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-8 h-8 text-primary heartbeat" fill="currentColor" />
            <h1 className="text-2xl font-fredoka font-semibold text-primary">Heartbeat Studio</h1>
          </div>
          <CardTitle className="text-xl">
            {token ? 'Set Your New Password' : 'Reset Your Password'}
          </CardTitle>
          <CardDescription>
            {token 
              ? 'Enter your new password below' 
              : resetMethod === 'email'
                ? 'Enter your email and we\'ll send you a link to reset your password'
                : 'Enter your phone number and we\'ll send you a reset link via SMS'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {token ? (
            <Form {...setPasswordForm}>
              <form onSubmit={setPasswordForm.handleSubmit(handleSetPassword)} className="space-y-3">
                <FormField
                  control={setPasswordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
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
                  control={setPasswordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            type="password" 
                            placeholder="••••••••" 
                            className="pl-10"
                            data-testid="input-confirm-password"
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
                  disabled={setPasswordMutation.isPending}
                  data-testid="button-set-password"
                >
                  {setPasswordMutation.isPending ? 'Setting password...' : 'Set Password'}
                </Button>
              </form>
            </Form>
          ) : (
            <>
              {/* Method toggle */}
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={resetMethod === 'email' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setResetMethod('email')}
                  data-testid="button-reset-email"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button
                  type="button"
                  variant={resetMethod === 'sms' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setResetMethod('sms')}
                  data-testid="button-reset-sms"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  SMS
                </Button>
              </div>

              {resetMethod === 'email' ? (
                <Form {...requestForm}>
                  <form onSubmit={requestForm.handleSubmit((data) => requestResetMutation.mutate(data))} className="space-y-3">
                    <FormField
                      control={requestForm.control}
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
                      className="w-full" 
                      disabled={requestResetMutation.isPending}
                      data-testid="button-request-reset"
                    >
                      {requestResetMutation.isPending ? 'Sending...' : 'Send Reset Link via Email'}
                    </Button>
                  </form>
                </Form>
              ) : (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (phoneNumber.replace(/\D/g, '').length < 10) {
                    setPhoneError('Please enter a valid phone number');
                    return;
                  }
                  setPhoneError('');
                  requestResetSMSMutation.mutate({ phoneNumber });
                }} className="space-y-3">
                  <div className="space-y-2">
                    <label htmlFor="phone-input" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <input
                        id="phone-input"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="(555) 123-4567"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        data-testid="input-phone"
                      />
                    </div>
                    {phoneError && (
                      <p className="text-sm font-medium text-destructive">{phoneError}</p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={requestResetSMSMutation.isPending}
                    data-testid="button-request-reset-sms"
                  >
                    {requestResetSMSMutation.isPending ? 'Sending...' : 'Send Reset Link via SMS'}
                  </Button>
                </form>
              )}
            </>
          )}

          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => setLocation('/auth')}
              className="text-primary hover:underline"
              data-testid="link-back-to-login"
            >
              Back to sign in
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
