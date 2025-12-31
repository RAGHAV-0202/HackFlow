import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Search,
  UserPlus,
  Loader2,
  Mail,
  X,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import EmptyState from '@/components/common/EmptyState';
import { hackathonApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Hackathon, User } from '@/types';

const AssignJudges = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      const [hackathonRes, judgesRes]: any = await Promise.all([
        hackathonApi.getById(id!),
        hackathonApi.getJudges(),
      ]);
      setHackathon(hackathonRes.data);
      setAllUsers(judgesRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const assignedJudgeIds = hackathon?.judges?.map((j: any) => 
    typeof j === 'string' ? j : j._id
  ) || [];

  const availableJudges = allUsers.filter(
    (user) =>
      !assignedJudgeIds.includes(user._id) &&
      (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAssign = async (judgeId: string) => {
    setAssigning(judgeId);
    try {
      await hackathonApi.assignJudge(id!, judgeId);
      await fetchData();
      toast({
        title: 'Judge assigned',
        description: 'The judge has been successfully assigned to this hackathon.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign judge.',
        variant: 'destructive',
      });
    } finally {
      setAssigning(null);
    }
  };

  const handleRemove = async (judgeId: string) => {
    setRemoving(judgeId);
    try {
      await hackathonApi.removeJudge(id!, judgeId);
      await fetchData();
      toast({
        title: 'Judge removed',
        description: 'The judge has been removed from this hackathon.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove judge.',
        variant: 'destructive',
      });
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
          Back to Hackathon
        </Button>

        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Assign Judges</h1>
          {hackathon && (
            <p className="text-muted-foreground">
              Manage judges for {hackathon.title}
            </p>
          )}
        </div>
      </motion.div>

      {/* Assigned Judges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Assigned Judges
          </h2>
          <Badge variant="outline">{hackathon?.judges?.length || 0} judges</Badge>
        </div>

        {hackathon?.judges && hackathon.judges.length > 0 ? (
          <div className="grid gap-3">
            {hackathon.judges.map((judge: any) => (
              <div
                key={judge._id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(judge.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{judge.name}</p>
                    <p className="text-sm text-muted-foreground">{judge.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(judge._id)}
                  disabled={removing === judge._id}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {removing === judge._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-6">
            No judges assigned yet
          </p>
        )}
      </motion.div>

      {/* Available Judges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-border bg-card p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" />
          Add Judges
        </h2>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search judges by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {availableJudges.length > 0 ? (
          <div className="grid gap-3 max-h-96 overflow-y-auto">
            {availableJudges.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAssign(user._id)}
                  disabled={assigning === user._id}
                >
                  {assigning === user._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Assign
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-6">
            {searchQuery
              ? 'No judges found matching your search'
              : 'No available judges to assign'}
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default AssignJudges;
