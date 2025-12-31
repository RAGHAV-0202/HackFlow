import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, CheckCircle, XCircle, Loader2, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { teamApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const TeamInvite = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, user, isLoading: authLoading, checkAuth } = useAuthStore();

  const [status, setStatus] = useState<'loading' | 'accepting' | 'success' | 'error' | 'not-registered' | 'ready'>('loading');
  const [message, setMessage] = useState('');
  const [teamName, setTeamName] = useState('');

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Update status based on auth state
  useEffect(() => {
    if (authLoading) {
      setStatus('loading');
      return;
    }

    if (isAuthenticated && user) {
      setStatus('ready');
    } else {
      setStatus('not-registered');
    }
  }, [isAuthenticated, user, authLoading]);

  const handleAcceptInvite = async () => {
    if (!teamId || !email) {
      setStatus('error');
      setMessage('Invalid invitation link');
      return;
    }

    setStatus('accepting');

    try {
      const response: any = await teamApi.acceptInvitation(teamId, email);
      
      if (response.message === "User not registered, redirect to signup") {
        setStatus('not-registered');
        setMessage('Please register to accept this invitation');
        return;
      }

      setTeamName(response.data?.name || 'the team');
      setStatus('success');
      setMessage('You have successfully joined the team!');
      
      toast({
        title: 'Invitation Accepted',
        description: `You have joined ${response.data?.name || 'the team'}!`,
      });

      // Redirect to team workspace after a short delay
      setTimeout(() => {
        navigate(`/teams/${teamId}`);
      }, 2000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error?.message || 'Failed to accept invitation');
      toast({
        title: 'Error',
        description: error?.message || 'Failed to accept invitation',
        variant: 'destructive',
      });
    }
  };

  const handleLoginRedirect = () => {
    const returnUrl = `/team-invite/${teamId}?email=${encodeURIComponent(email)}`;
    navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
  };

  const handleRegisterRedirect = () => {
    const returnUrl = `/team-invite/${teamId}?email=${encodeURIComponent(email)}`;
    navigate(`/register?returnUrl=${encodeURIComponent(returnUrl)}&email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-heading">Team Invitation</CardTitle>
            <CardDescription>
              {email && `Invitation for ${decodeURIComponent(email)}`}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {status === 'loading' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Verifying invitation...</p>
              </div>
            )}

            {status === 'not-registered' && (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground">
                    Please log in or create an account to accept this team invitation.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <Button onClick={handleLoginRedirect} className="w-full">
                    <LogIn className="w-4 h-4 mr-2" />
                    Log In
                  </Button>
                  <Button onClick={handleRegisterRedirect} variant="outline" className="w-full">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Account
                  </Button>
                </div>
              </div>
            )}

            {status === 'ready' && (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <p className="text-foreground">
                    You've been invited to join a team!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Click the button below to accept the invitation and join the team.
                  </p>
                </div>
                <Button onClick={handleAcceptInvite} className="w-full" size="lg">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept Invitation
                </Button>
              </div>
            )}

            {status === 'accepting' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Joining team...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-foreground font-medium">Welcome to {teamName}!</p>
                  <p className="text-sm text-muted-foreground">{message}</p>
                  <p className="text-xs text-muted-foreground">Redirecting to team workspace...</p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-destructive" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-foreground font-medium">Unable to Accept Invitation</p>
                  <p className="text-sm text-muted-foreground">{message}</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" asChild>
                    <Link to="/dashboard">Go to Dashboard</Link>
                  </Button>
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default TeamInvite;
