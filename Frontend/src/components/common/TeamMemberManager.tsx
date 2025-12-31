import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, X, Crown, Clock, Check, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, InvitedMember } from '@/types';
import { cn } from '@/lib/utils';

interface TeamMemberManagerProps {
  members: User[];
  invitedMembers: InvitedMember[];
  leaderId: string;
  currentUserId: string;
  maxMembers: number;
  onInvite: (email: string) => Promise<void>;
  onRemoveMember?: (userId: string) => Promise<void>;
  onCancelInvite?: (email: string) => Promise<void>;
  isLeader: boolean;
}

const TeamMemberManager = ({
  members,
  invitedMembers,
  leaderId,
  currentUserId,
  maxMembers,
  onInvite,
  onRemoveMember,
  onCancelInvite,
  isLeader,
}: TeamMemberManagerProps) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalMembers = members.length + invitedMembers.filter(m => m.status === 'pending').length;
  const canInvite = totalMembers < maxMembers && isLeader;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    
    setError(null);
    setIsInviting(true);
    
    try {
      await onInvite(inviteEmail.trim());
      setInviteEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Member Count */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold">Team Members</h3>
        <Badge variant="outline">
          {members.length} / {maxMembers} members
        </Badge>
      </div>

      {/* Current Members */}
      <div className="space-y-3">
        <AnimatePresence>
          {members.map((member, index) => (
            <motion.div
              key={member._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{member.name}</span>
                    {member._id === leaderId && (
                      <Crown className="w-4 h-4 text-warning" />
                    )}
                    {member._id === currentUserId && (
                      <Badge variant="secondary" className="text-xs">You</Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{member.email}</span>
                </div>
              </div>

              {isLeader && member._id !== leaderId && onRemoveMember && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveMember(member._id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pending Invitations */}
      {invitedMembers.filter(m => m.status === 'pending').length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending Invitations
          </h4>
          <AnimatePresence>
            {invitedMembers
              .filter((m) => m.status === 'pending')
              .map((invited, index) => (
                <motion.div
                  key={invited.email}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg border border-dashed border-border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-muted">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-medium text-muted-foreground">{invited.email}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        Invitation pending
                      </div>
                    </div>
                  </div>

                  {isLeader && onCancelInvite && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onCancelInvite(invited.email)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      )}

      {/* Invite Form */}
      {canInvite && (
        <div className="space-y-3 pt-4 border-t border-border">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Invite Team Member
          </h4>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            />
            <Button onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()}>
              {isInviting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Invite'
              )}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}

      {!canInvite && !isLeader && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Only the team leader can manage members
        </p>
      )}

      {!canInvite && isLeader && totalMembers >= maxMembers && (
        <p className="text-sm text-warning text-center py-4">
          Team is at maximum capacity
        </p>
      )}
    </div>
  );
};

export default TeamMemberManager;
