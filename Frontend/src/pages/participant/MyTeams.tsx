import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Trophy, UserPlus, Settings, Crown, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import EmptyState from '@/components/common/EmptyState';
import { useAuthStore } from '@/stores/authStore';
import { hackathonApi, teamApi } from '@/lib/api';
import { Team, Hackathon } from '@/types';

const MyTeams = () => {
  const { user } = useAuthStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        // Fetch all hackathons to get teams
        const hackathonRes: any = await hackathonApi.getAll();
        const hackathons = hackathonRes?.data || hackathonRes || [];
        const allTeams: Team[] = [];
        
        for (const hackathon of hackathons) {
          if (hackathon.teams) {
            for (const team of hackathon.teams) {
              // Check if user is a member or leader
              const memberId = (m: any) => typeof m === 'string' ? m : m?._id;
              const leaderId = typeof team.leader === 'string' ? team.leader : team.leader?._id;
              
              const isMember = team.members?.some((m: any) => memberId(m) === user?._id);
              const isLeader = leaderId === user?._id;
              
              if (isMember || isLeader) {
                allTeams.push({ ...team, hackathon });
              }
            }
          }
        }
        
        setTeams(allTeams);
      } catch (error) {
        console.error('Error fetching teams:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchTeams();
    }
  }, [user]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">My Teams</h1>
          <p className="text-muted-foreground">Teams you're part of across hackathons</p>
        </div>
      </div>

      {teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description="You're not part of any team yet. Join a hackathon and create or join a team!"
          action={{
            label: 'Browse Hackathons',
            onClick: () => window.location.href = '/hackathons',
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((team, index) => {
            const hackathon = team.hackathon as Hackathon;
            const isLeader = (team.leader as any)?._id === user?._id || team.leader === user?._id;
            
            return (
              <motion.div
                key={team._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl border border-border bg-card p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground text-lg">{team.name}</h3>
                      {isLeader && (
                        <Badge variant="outline" className="text-primary border-primary/20">
                          <Crown className="w-3 h-3 mr-1" />
                          Leader
                        </Badge>
                      )}
                    </div>
                    <Link 
                      to={`/hackathons/${hackathon._id}`}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <Trophy className="w-3 h-3" />
                      {hackathon.title}
                    </Link>
                  </div>
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`/teams/${team._id}`}>
                      <Settings className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
                {team.projectName && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-foreground">{team.projectName}</p>
                    {team.projectDescription && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {team.projectDescription}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Team Members</p>
                  <div className="flex flex-wrap gap-2">
                    {team.members?.map((member: any) => (
                      <div
                        key={member._id || member}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted"
                      >
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(member.name || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-foreground">{member.name || 'Unknown'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {team.invitedMembers && team.invitedMembers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Pending Invites</p>
                    <div className="flex flex-wrap gap-2">
                      {team.invitedMembers.filter(i => i.status === 'pending').map((invite, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10"
                        >
                          <Mail className="w-3 h-3 text-yellow-500" />
                          <span className="text-sm text-yellow-600">{invite.email}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {team.technologies && team.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {team.technologies.map((tech, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link to={`/teams/${team._id}`}>View Team</Link>
                  </Button>
                  {isLeader && (
                    <Button variant="outline" size="icon" asChild>
                      <Link to={`/teams/${team._id}`}>
                        <UserPlus className="w-4 h-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyTeams;
