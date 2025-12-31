import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Trophy, Users, Calendar, FileText, Award, 
  ArrowLeft, Plus, Clock, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatCard from '@/components/common/StatCard';
import EmptyState from '@/components/common/EmptyState';
import { hackathonApi, teamApi, submissionApi } from '@/lib/api';
import { Hackathon, Team, Submission } from '@/types';
import { format } from 'date-fns';

const ManageHackathon = () => {
  const { id } = useParams();
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [hackathonRes, teamsRes]: any = await Promise.all([
          hackathonApi.getById(id),
          teamApi.getByHackathon(id),
        ]);
        setHackathon(hackathonRes.data);
        setTeams(teamsRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'ongoing':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'completed':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <EmptyState
        icon={Trophy}
        title="Hackathon not found"
        description="The hackathon you're looking for doesn't exist."
        action={{
          label: 'Go Back',
          onClick: () => window.history.back(),
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Button variant="ghost" asChild className="gap-2">
          <Link to="/organizer/hackathons">
            <ArrowLeft className="w-4 h-4" />
            Back to Hackathons
          </Link>
        </Button>

        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-heading font-bold text-foreground">
                {hackathon.title}
              </h1>
              <Badge className={getStatusColor(hackathon.status)}>
                {hackathon.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(hackathon.startDate), 'MMM d')} - {format(new Date(hackathon.endDate), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`/organizer/hackathons/${id}/judges`}>
                <Award className="w-4 h-4 mr-2" />
                Judges
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/organizer/hackathons/${id}/results`}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Results
              </Link>
            </Button>
            <Button asChild>
              <Link to={`/organizer/hackathons/${id}/rounds`}>
                <Plus className="w-4 h-4 mr-2" />
                Add Round
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Participants"
          value={hackathon.participants?.length || 0}
          icon={Users}
        />
        <StatCard
          title="Teams"
          value={teams.length}
          icon={Trophy}
        />
        <StatCard
          title="Rounds"
          value={hackathon.rounds?.length || 0}
          icon={Calendar}
        />
        <StatCard
          title="Judges"
          value={hackathon.judges?.length || 0}
          icon={Award}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="teams" className="space-y-6">
        <TabsList>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="rounds">Rounds</TabsTrigger>
          <TabsTrigger value="judges">Judges</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-4">
          {teams.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No teams yet"
              description="Teams will appear here when participants register."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => (
                <motion.div
                  key={team._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border bg-card p-4 space-y-3"
                >
                  <h3 className="font-semibold text-foreground">{team.name}</h3>
                  {team.projectName && (
                    <p className="text-sm text-muted-foreground">{team.projectName}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {team.members?.length || 0} members
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    View Details
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rounds" className="space-y-4">
          {hackathon.rounds?.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No rounds yet"
              description="Add rounds to structure your hackathon."
              action={{
                label: 'Add Round',
                onClick: () => window.location.href = `/organizer/hackathons/${id}/rounds`,
              }}
            />
          ) : (
            <div className="space-y-4">
              {hackathon.rounds?.map((round, index) => (
                <motion.div
                  key={round._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Round {round.roundNumber}</Badge>
                        <h3 className="font-semibold text-foreground">{round.name}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(new Date(round.startDate), 'MMM d')} - {format(new Date(round.endDate), 'MMM d')}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {round.submissionType}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">View Submissions</Button>
                      <Button size="sm">Manage</Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="judges" className="space-y-4">
          {hackathon.judges?.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No judges assigned"
              description="Assign judges to evaluate submissions."
              action={{
                label: 'Assign Judges',
                onClick: () => {},
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hackathon.judges?.map((judge: any) => (
                <motion.div
                  key={judge._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border bg-card p-4 space-y-3"
                >
                  <h3 className="font-semibold text-foreground">{judge.name}</h3>
                  <p className="text-sm text-muted-foreground">{judge.email}</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Remove
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <EmptyState
            icon={BarChart3}
            title="No results yet"
            description="Results will be available after evaluations are complete."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManageHackathon;
