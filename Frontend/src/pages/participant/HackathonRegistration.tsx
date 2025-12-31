import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Users,
  Calendar,
  Trophy,
  Loader2,
  UserPlus,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import RoundTimeline from '@/components/common/RoundTimeline';
import { hackathonApi, teamApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { Hackathon } from '@/types';

const HackathonRegistration = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (id) {
      fetchHackathon();
    }
  }, [id, isAuthenticated]);

  const fetchHackathon = async () => {
    try {
      const response: any = await hackathonApi.getById(id!);
      setHackathon(response.data);
    } catch (error) {
      console.error('Failed to fetch hackathon:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a team name.',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      const response: any = await teamApi.create(id!, {
        name: teamName,
        projectName: projectName || undefined,
      });

      toast({
        title: 'Team created!',
        description: 'You are now registered for this hackathon.',
      });

      navigate(`/teams/${response.data._id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create team.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  // Check if user is already registered
  const isRegistered = hackathon?.participants?.some(
    (p: any) => (typeof p === 'string' ? p : p._id) === user?._id
  );

  // Find user's team in this hackathon
  const userTeam = hackathon?.teams?.find((team: any) =>
    team.members?.some((m: any) => (typeof m === 'string' ? m : m._id) === user?._id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Hackathon not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <Badge
              variant="secondary"
              className={
                hackathon.status === 'ongoing'
                  ? 'bg-success/10 text-success border-success/30 mb-2'
                  : hackathon.status === 'upcoming'
                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/30 mb-2'
                  : 'mb-2'
              }
            >
              {hackathon.status}
            </Badge>
            <h1 className="text-2xl font-heading font-bold text-foreground">
              {hackathon.title}
            </h1>
            <p className="text-muted-foreground mt-1">{hackathon.description}</p>
          </div>
        </div>
      </motion.div>

      {/* Registration Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        {isRegistered && userTeam ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-success" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-semibold text-foreground">
                You're registered!
              </h2>
              <p className="text-muted-foreground">
                Team: <span className="text-foreground font-medium">{userTeam.name}</span>
              </p>
            </div>
            <Button asChild>
              <Link to={`/teams/${userTeam._id}`}>
                <Play className="w-4 h-4 mr-2" />
                Go to Team Workspace
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-heading font-semibold text-foreground mb-2">
                Join this Hackathon
              </h2>
              <p className="text-muted-foreground">
                Create a team to register for this hackathon
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size="lg">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create a Team
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Your Team</DialogTitle>
                    <DialogDescription>
                      Start a new team for {hackathon.title}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="teamName">Team Name *</Label>
                      <Input
                        id="teamName"
                        placeholder="Enter your team name"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="projectName">Project Name (optional)</Label>
                      <Input
                        id="projectName"
                        placeholder="What will you build?"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleCreateTeam}
                      disabled={creating}
                    >
                      {creating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Team & Register'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
      </motion.div>

      {/* Hackathon Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-6 space-y-4"
        >
          <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Schedule
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start Date</span>
              <span className="font-medium">{format(new Date(hackathon.startDate), 'PPP')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">End Date</span>
              <span className="font-medium">{format(new Date(hackathon.endDate), 'PPP')}</span>
            </div>
            {hackathon.registrationDeadline && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Registration Deadline</span>
                <span className="font-medium">
                  {format(new Date(hackathon.registrationDeadline), 'PPP')}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card p-6 space-y-4"
        >
          <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Participation
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Team Size</span>
              <span className="font-medium">{hackathon.maxTeamSize} members</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Participants</span>
              <span className="font-medium">{hackathon.participants?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Teams Registered</span>
              <span className="font-medium">{hackathon.teams?.length || 0}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Rounds */}
      {hackathon.rounds && hackathon.rounds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-border bg-card p-6 space-y-4"
        >
          <h3 className="font-heading font-semibold text-foreground">Hackathon Rounds</h3>
          <RoundTimeline rounds={hackathon.rounds} showCriteria />
        </motion.div>
      )}

      {/* Prizes */}
      {hackathon.prizes && hackathon.prizes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border border-border bg-card p-6 space-y-4"
        >
          <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Prizes
          </h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {hackathon.prizes.map((prize, index) => (
              <div
                key={index}
                className={`rounded-lg p-4 text-center ${
                  index === 0
                    ? 'bg-yellow-500/10 border border-yellow-500/30'
                    : index === 1
                    ? 'bg-gray-400/10 border border-gray-400/30'
                    : index === 2
                    ? 'bg-amber-600/10 border border-amber-600/30'
                    : 'bg-muted border border-border'
                }`}
              >
                <Trophy
                  className={`w-8 h-8 mx-auto mb-2 ${
                    index === 0
                      ? 'text-yellow-400'
                      : index === 1
                      ? 'text-gray-400'
                      : index === 2
                      ? 'text-amber-600'
                      : 'text-muted-foreground'
                  }`}
                />
                <p className="font-semibold text-foreground">{prize.position}</p>
                <p className="text-sm text-muted-foreground">{prize.reward}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default HackathonRegistration;
