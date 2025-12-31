import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Calendar,
  Users,
  Trophy,
  Clock,
  MapPin,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Play,
  FileText,
  Video,
  Github,
  Globe,
  Image,
  File,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { hackathonApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Hackathon, Round } from '@/types';

const submissionTypeIcons: Record<string, any> = {
  ppt: FileText,
  video: Video,
  github: Github,
  live_demo: Globe,
  screenshot: Image,
  document: File,
  multiple: File,
};

const HackathonDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already registered
  const isRegistered = hackathon?.participants?.some(
    (p: any) => (typeof p === 'string' ? p : p._id) === user?._id
  );

  // Find user's team in this hackathon
  const userTeam = hackathon?.teams?.find((team: any) =>
    team.members?.some((m: any) => (typeof m === 'string' ? m : m._id) === user?._id) ||
    (typeof team.leader === 'string' ? team.leader : team.leader?._id) === user?._id
  );

  useEffect(() => {
    if (id) {
      fetchHackathon();
    }
  }, [id]);

  const fetchHackathon = async () => {
    try {
      const response: any = await hackathonApi.getById(id!);
      setHackathon(response.data);
    } catch (error) {
      console.error('Failed to fetch hackathon:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!hackathon) return null;
    switch (hackathon.status) {
      case 'upcoming':
        return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-sm">Upcoming</Badge>;
      case 'ongoing':
        return <Badge variant="secondary" className="bg-success/20 text-success border-success/30 text-sm">🔴 Live Now</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-muted text-muted-foreground text-sm">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="text-sm">Cancelled</Badge>;
      default:
        return null;
    }
  };

  const handleRegister = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate(`/participant/hackathons/${id}/register`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-heading font-bold mb-2">Hackathon not found</h2>
          <p className="text-muted-foreground mb-6">The hackathon you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/hackathons">Browse Hackathons</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative h-80 md:h-96 overflow-hidden">
        {hackathon.banner ? (
          <img
            src={hackathon.banner}
            alt={hackathon.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full gradient-primary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto">
            <Link
              to="/hackathons"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to hackathons
            </Link>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {getStatusBadge()}
            </div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
              {hackathon.title}
            </h1>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="rounds">Rounds ({hackathon.rounds?.length || 0})</TabsTrigger>
                  <TabsTrigger value="prizes">Prizes</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="glass rounded-2xl p-6">
                      <h2 className="text-xl font-heading font-semibold mb-4">About</h2>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {hackathon.description}
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="glass rounded-xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Start Date</p>
                          <p className="font-medium">{format(new Date(hackathon.startDate), 'PPP')}</p>
                        </div>
                      </div>
                      <div className="glass rounded-xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                          <Clock className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">End Date</p>
                          <p className="font-medium">{format(new Date(hackathon.endDate), 'PPP')}</p>
                        </div>
                      </div>
                      <div className="glass rounded-xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Team Size</p>
                          <p className="font-medium">Max {hackathon.maxTeamSize} members</p>
                        </div>
                      </div>
                      <div className="glass rounded-xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Participants</p>
                          <p className="font-medium">{hackathon.participants?.length || 0} / {hackathon.maxParticipants || '∞'}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="rounds">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {hackathon.rounds && hackathon.rounds.length > 0 ? (
                      hackathon.rounds.map((round: Round, index: number) => {
                        const Icon = submissionTypeIcons[round.submissionType] || FileText;
                        return (
                          <div key={round._id} className="glass rounded-xl p-5">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                                  <span className="text-primary-foreground font-bold">{round.roundNumber}</span>
                                </div>
                                <div>
                                  <h3 className="font-heading font-semibold">{round.name}</h3>
                                  <p className="text-sm text-muted-foreground">{round.description}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Icon className="w-3 h-3" />
                                {round.submissionType.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(round.startDate), 'MMM d')} - {format(new Date(round.endDate), 'MMM d, yyyy')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Trophy className="w-4 h-4" />
                                Max {round.maxMarks} marks
                              </span>
                            </div>
                            {round.criteria && round.criteria.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-border">
                                <p className="text-sm font-medium mb-2">Evaluation Criteria</p>
                                <div className="flex flex-wrap gap-2">
                                  {round.criteria.map((c) => (
                                    <Badge key={c._id} variant="secondary" className="text-xs">
                                      {c.name} ({c.weight}%)
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 glass rounded-xl">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No rounds have been added yet</p>
                      </div>
                    )}
                  </motion.div>
                </TabsContent>

                <TabsContent value="prizes">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {hackathon.prizes && hackathon.prizes.length > 0 ? (
                      hackathon.prizes.map((prize, index) => (
                        <div key={index} className="glass rounded-xl p-5 flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                            index === 1 ? 'bg-gray-400/20 text-gray-400' :
                            index === 2 ? 'bg-amber-600/20 text-amber-600' :
                            'bg-primary/20 text-primary'
                          }`}>
                            <Trophy className="w-7 h-7" />
                          </div>
                          <div>
                            <p className="font-heading font-semibold text-lg">{prize.position}</p>
                            <p className="text-muted-foreground">{prize.reward}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 glass rounded-xl">
                        <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">Prizes will be announced soon</p>
                      </div>
                    )}
                  </motion.div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Registration Card */}
              <div className="glass rounded-2xl p-6 sticky top-24">
                <h3 className="font-heading font-semibold text-lg mb-4">Join This Hackathon</h3>
                
                {hackathon.registrationDeadline && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Clock className="w-4 h-4" />
                    Registration ends {format(new Date(hackathon.registrationDeadline), 'PPP')}
                  </div>
                )}

                {isRegistered && userTeam ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">You're registered!</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Team: <span className="text-foreground font-medium">{userTeam.name}</span>
                    </p>
                    <Button size="lg" className="w-full" variant="hero" asChild>
                      <Link to={`/teams/${userTeam._id}`}>
                        <Play className="w-4 h-4 mr-2" />
                        Go to Workspace
                      </Link>
                    </Button>
                  </div>
                ) : hackathon.status === 'upcoming' || hackathon.status === 'ongoing' ? (
                  <Button size="lg" className="w-full" variant="hero" onClick={handleRegister}>
                    <Play className="w-4 h-4 mr-2" />
                    Register Now
                  </Button>
                ) : (
                  <Button size="lg" className="w-full" disabled>
                    Registration Closed
                  </Button>
                )}

                <div className="mt-6 pt-6 border-t border-border">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Participants</span>
                      <span className="font-medium">{hackathon.participants?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Teams</span>
                      <span className="font-medium">{hackathon.teams?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Rounds</span>
                      <span className="font-medium">{hackathon.rounds?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Judges</span>
                      <span className="font-medium">{hackathon.judges?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HackathonDetails;
