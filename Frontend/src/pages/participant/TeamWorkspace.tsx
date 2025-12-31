import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Users,
  Plus,
  Loader2,
  Crown,
  Mail,
  Send,
  FileText,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import TeamMemberManager from '@/components/common/TeamMemberManager';
import EmptyState from '@/components/common/EmptyState';
import { teamApi, hackathonApi, submissionApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { Team, Hackathon, Submission, Round } from '@/types';

const TeamWorkspace = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [team, setTeam] = useState<Team | null>(null);
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teamId) {
      fetchData();
    }
  }, [teamId]);

  const fetchData = async () => {
    try {
      const teamRes: any = await teamApi.getById(teamId!);
      setTeam(teamRes.data);

      const hackathonId = typeof teamRes.data.hackathon === 'string' 
        ? teamRes.data.hackathon 
        : teamRes.data.hackathon._id;

      const [hackathonRes, submissionsRes]: any = await Promise.all([
        hackathonApi.getById(hackathonId),
        submissionApi.getByTeam(teamId!),
      ]);

      setHackathon(hackathonRes.data);
      setSubmissions(submissionsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isLeader = user && team && (
    typeof team.leader === 'string' ? team.leader === user._id : team.leader._id === user._id
  );

  const handleInvite = async (email: string) => {
    await teamApi.inviteMember(teamId!, email);
    await fetchData();
    toast({
      title: 'Invitation sent',
      description: `Invitation sent to ${email}`,
    });
  };

  const handleRemoveMember = async (userId: string) => {
    await teamApi.removeMember(teamId!, userId);
    await fetchData();
    toast({
      title: 'Member removed',
      description: 'Team member has been removed.',
    });
  };

  const getActiveRound = (): Round | null => {
    if (!hackathon?.rounds) return null;
    const now = new Date();
    return hackathon.rounds.find((round) => {
      const start = new Date(round.startDate);
      const end = new Date(round.endDate);
      return now >= start && now <= end;
    }) || null;
  };

  const activeRound = getActiveRound();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!team) {
    return (
      <EmptyState
        icon={Users}
        title="Team not found"
        description="The team you're looking for doesn't exist."
        action={{
          label: 'Back to Teams',
          onClick: () => navigate('/dashboard/teams'),
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-heading font-bold text-foreground">
                {team.name}
              </h1>
              {isLeader && (
                <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/30">
                  <Crown className="w-3 h-3 mr-1" />
                  Leader
                </Badge>
              )}
            </div>
            {hackathon && (
              <Link
                to={`/hackathons/${hackathon._id}`}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {hackathon.title}
              </Link>
            )}
          </div>

          {activeRound && (
            <Button asChild>
              <Link to={`/teams/${teamId}/submit/${activeRound._id}`}>
                <Send className="w-4 h-4 mr-2" />
                Submit for {activeRound.name}
              </Link>
            </Button>
          )}
        </div>

        {/* Project Info */}
        {team.projectName && (
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold text-foreground mb-1">{team.projectName}</h3>
            {team.projectDescription && (
              <p className="text-sm text-muted-foreground mb-3">{team.projectDescription}</p>
            )}
            {team.technologies && team.technologies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {team.technologies.map((tech, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="members" className="space-y-6">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="rounds">Rounds</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <TeamMemberManager
              members={team.members || []}
              invitedMembers={team.invitedMembers || []}
              leaderId={typeof team.leader === 'string' ? team.leader : team.leader._id}
              currentUserId={user?._id || ''}
              maxMembers={hackathon?.maxTeamSize || 4}
              onInvite={handleInvite}
              onRemoveMember={isLeader ? handleRemoveMember : undefined}
              isLeader={isLeader || false}
            />
          </motion.div>
        </TabsContent>

        <TabsContent value="submissions">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {submissions.length > 0 ? (
              submissions.map((submission) => (
                <div
                  key={submission._id}
                  className="rounded-xl border border-border bg-card p-5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{submission.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Round: {typeof submission.round === 'string' ? submission.round : submission.round.name}
                      </p>
                    </div>
                    <Badge
                      variant={submission.status === 'evaluated' ? 'default' : 'secondary'}
                    >
                      {submission.status}
                    </Badge>
                  </div>
                  {submission.description && (
                    <p className="text-sm text-muted-foreground">{submission.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      Submitted: {format(new Date(submission.submittedAt), 'PPp')}
                    </span>
                    {submission.averageScore > 0 && (
                      <span className="flex items-center gap-1">
                        <Trophy className="w-4 h-4" />
                        Score: {submission.averageScore.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={FileText}
                title="No submissions yet"
                description="Submit your work when a round is active."
              />
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="rounds">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {hackathon?.rounds && hackathon.rounds.length > 0 ? (
              hackathon.rounds.map((round) => {
                const now = new Date();
                const start = new Date(round.startDate);
                const end = new Date(round.endDate);
                const isActive = now >= start && now <= end;
                const isPast = now > end;
                const hasSubmission = submissions.some(
                  (s) => (typeof s.round === 'string' ? s.round : s.round._id) === round._id
                );

                return (
                  <div
                    key={round._id}
                    className="rounded-xl border border-border bg-card p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">Round {round.roundNumber}</Badge>
                          <h3 className="font-semibold text-foreground">{round.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(round.startDate), 'MMM d')} -{' '}
                          {format(new Date(round.endDate), 'MMM d, yyyy')}
                        </p>
                      </div>
                      {isActive ? (
                        hasSubmission ? (
                          <Badge variant="secondary" className="bg-success/10 text-success">
                            Submitted
                          </Badge>
                        ) : (
                          <Button asChild size="sm">
                            <Link to={`/teams/${teamId}/submit/${round._id}`}>
                              Submit
                            </Link>
                          </Button>
                        )
                      ) : isPast ? (
                        <Badge variant="secondary">Ended</Badge>
                      ) : (
                        <Badge variant="secondary">Upcoming</Badge>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                icon={Trophy}
                title="No rounds yet"
                description="Rounds will appear here when the organizer adds them."
              />
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamWorkspace;
