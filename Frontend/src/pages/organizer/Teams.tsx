import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Trophy, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import EmptyState from '@/components/common/EmptyState';
import { useAuthStore } from '@/stores/authStore';
import { hackathonApi, teamApi } from '@/lib/api';
import { Team, Hackathon } from '@/types';

const OrganizerTeams = () => {
  const { user } = useAuthStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTeams = async () => {
      if (!user) return;
      try {
        const hackathonRes: any = await hackathonApi.getAll();
        const myHackathons = hackathonRes.data?.filter((h: Hackathon) =>
          (h.organizer as any)?._id === user._id || h.organizer === user._id
        ) || [];

        const allTeams: Team[] = [];
        for (const hackathon of myHackathons) {
          try {
            const teamsRes: any = await teamApi.getByHackathon(hackathon._id);
            if (teamsRes.data) {
              allTeams.push(...teamsRes.data.map((t: Team) => ({ ...t, hackathon })));
            }
          } catch (error) {
            console.error('Error fetching teams for hackathon:', hackathon._id);
          }
        }
        setTeams(allTeams);
      } catch (error) {
        console.error('Error fetching teams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [user]);

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Manage Teams</h1>
        <p className="text-muted-foreground">All teams across your hackathons</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search teams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <EmptyState
          icon={Users}
          title={teams.length === 0 ? "No teams yet" : "No matching teams"}
          description={
            teams.length === 0
              ? "Teams will appear here when participants register for your hackathons."
              : "Try adjusting your search query."
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team, index) => {
            const hackathon = team.hackathon as Hackathon;
            
            return (
              <motion.div
                key={team._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl border border-border bg-card p-6 space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground text-lg">{team.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Trophy className="w-3 h-3" />
                    {hackathon.title}
                  </div>
                </div>

                {team.projectName && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-foreground">{team.projectName}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Members</p>
                  <div className="flex -space-x-2">
                    {team.members?.slice(0, 5).map((member: any) => (
                      <Avatar key={member._id || member} className="w-8 h-8 border-2 border-background">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(member.name || 'U')}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {(team.members?.length || 0) > 5 && (
                      <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">
                          +{(team.members?.length || 0) - 5}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {team.technologies && team.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {team.technologies.slice(0, 3).map((tech, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                    {team.technologies.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{team.technologies.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrganizerTeams;
