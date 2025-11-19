import { useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Heart, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VerifyMagicLink() {
  const searchParams = new URLSearchParams(useSearch());
  const token = searchParams.get('token');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const verifyMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await fetch(`/api/auth/verify-magic-link?token=${encodeURIComponent(token)}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Verification failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({ title: 'Success!', description: 'You have been signed in.' });
      setTimeout(() => setLocation('/dashboard'), 1000);
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Verification failed', description: error.message });
    },
  });

  useEffect(() => {
    if (token && !verifyMutation.isSuccess && !verifyMutation.isError) {
      verifyMutation.mutate(token);
    }
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-2" />
            <CardTitle>Invalid Link</CardTitle>
            <CardDescription>No verification token found</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setLocation('/auth')} data-testid="button-back-to-auth">
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-8 h-8 text-primary heartbeat" fill="currentColor" />
            <h1 className="text-2xl font-fredoka font-semibold text-primary">Heartbeat Studio</h1>
          </div>
          
          {verifyMutation.isPending && (
            <>
              <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
              <CardTitle>Verifying your magic link...</CardTitle>
              <CardDescription>Please wait a moment</CardDescription>
            </>
          )}
          
          {verifyMutation.isSuccess && (
            <>
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <CardTitle>Success!</CardTitle>
              <CardDescription>Redirecting to your dashboard...</CardDescription>
            </>
          )}
          
          {verifyMutation.isError && (
            <>
              <XCircle className="w-12 h-12 text-destructive mx-auto" />
              <CardTitle>Verification Failed</CardTitle>
              <CardDescription>{verifyMutation.error?.message || 'Something went wrong'}</CardDescription>
            </>
          )}
        </CardHeader>
        
        {verifyMutation.isError && (
          <CardContent className="text-center">
            <Button onClick={() => setLocation('/auth')} data-testid="button-back-to-auth">
              Back to Sign In
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
