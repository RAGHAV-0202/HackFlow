import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { CheckCircle, Circle, Clock, FileText, Video, Github, Globe, Image, File } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Round } from '@/types';
import { cn } from '@/lib/utils';

interface RoundTimelineProps {
  rounds: Round[];
  onRoundClick?: (round: Round) => void;
  showCriteria?: boolean;
}

const submissionTypeIcons: Record<string, React.ElementType> = {
  ppt: FileText,
  video: Video,
  github: Github,
  live_demo: Globe,
  screenshot: Image,
  document: File,
  multiple: File,
};

const RoundTimeline = ({ rounds, onRoundClick, showCriteria = false }: RoundTimelineProps) => {
  const getRoundStatus = (round: Round) => {
    const now = new Date();
    const start = new Date(round.startDate);
    const end = new Date(round.endDate);

    // Check if end date has fully passed (end of day)
    if (now > end) return 'completed';
    // Check if start date hasn't arrived yet
    if (now < start) return 'upcoming';
    // Otherwise, we're in the active period
    return 'active';
  };

  const sortedRounds = [...rounds].sort((a, b) => a.roundNumber - b.roundNumber);

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-6">
        {sortedRounds.map((round, index) => {
          const status = getRoundStatus(round);
          const Icon = submissionTypeIcons[round.submissionType] || FileText;

          return (
            <motion.div
              key={round._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'relative pl-14 cursor-pointer group',
                onRoundClick && 'hover:bg-muted/50 -ml-2 pl-16 py-2 rounded-lg transition-colors'
              )}
              onClick={() => onRoundClick?.(round)}
            >
              {/* Status Indicator */}
              <div
                className={cn(
                  'absolute left-4 w-5 h-5 rounded-full flex items-center justify-center',
                  status === 'completed' && 'bg-success text-success-foreground',
                  status === 'active' && 'bg-primary text-primary-foreground animate-pulse',
                  status === 'upcoming' && 'bg-muted border-2 border-muted-foreground/30'
                )}
              >
                {status === 'completed' ? (
                  <CheckCircle className="w-3 h-3" />
                ) : status === 'active' ? (
                  <Clock className="w-3 h-3" />
                ) : (
                  <Circle className="w-2 h-2" />
                )}
              </div>

              {/* Content */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h4 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors">
                    Round {round.roundNumber}: {round.name}
                  </h4>
                  <Badge
                    variant={status === 'active' ? 'default' : 'outline'}
                    className={cn(
                      status === 'completed' && 'bg-success/10 text-success border-success/30',
                      status === 'active' && 'bg-primary/10 text-primary border-primary/30',
                      status === 'upcoming' && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {status === 'active' ? 'In Progress' : status}
                  </Badge>
                </div>

                {round.description && (
                  <p className="text-sm text-muted-foreground">{round.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {format(new Date(round.startDate), 'MMM d')} - {format(new Date(round.endDate), 'MMM d, yyyy')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon className="w-4 h-4" />
                    {round.submissionType.replace('_', ' ')}
                  </span>
                  <span>Max {round.maxMarks} marks</span>
                </div>

                {showCriteria && round.criteria && round.criteria.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {round.criteria.map((c) => (
                      <Badge key={c._id} variant="secondary" className="text-xs">
                        {c.name} ({c.weight}%)
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default RoundTimeline;
