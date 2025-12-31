import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ExternalLink, Clock, CheckCircle, AlertCircle, Github, Video, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EmptyState from '@/components/common/EmptyState';
import { useAuthStore } from '@/stores/authStore';
import { hackathonApi, submissionApi } from '@/lib/api';
import { Submission, Team, Hackathon } from '@/types';
import { format } from 'date-fns';

const Submissions = () => {
  const { user } = useAuthStore();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        // Fetch all hackathons to find user's teams and their submissions
        const hackathonRes: any = await hackathonApi.getAll();
        const allSubmissions: Submission[] = [];
        
        for (const hackathon of hackathonRes.data || []) {
          // Find teams where user is a member
          const userTeams = hackathon.teams?.filter((team: Team) =>
            team.members?.some((m: any) => m._id === user?._id || m === user?._id) ||
            (team.leader as any)?._id === user?._id || team.leader === user?._id
          ) || [];
          
          // Fetch submissions for each team
          for (const team of userTeams) {
            try {
              const submissionsRes: any = await submissionApi.getByTeam(team._id);
              if (submissionsRes.data) {
                allSubmissions.push(...submissionsRes.data.map((s: Submission) => ({
                  ...s,
                  team: { ...team, hackathon }
                })));
              }
            } catch (error) {
              console.error('Error fetching team submissions:', error);
            }
          }
        }
        
        setSubmissions(allSubmissions);
      } catch (error) {
        console.error('Error fetching submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSubmissions();
    }
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'draft':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'evaluated':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'draft':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'evaluated':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getSubmissionTypeIcon = (type: string) => {
    switch (type) {
      case 'github':
        return <Github className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'ppt':
        return <FileText className="w-4 h-4" />;
      case 'screenshot':
        return <FileImage className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-muted rounded animate-pulse" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">My Submissions</h1>
          <p className="text-muted-foreground">Track your hackathon submissions</p>
        </div>
      </div>

      {submissions.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No submissions yet"
          description="You haven't made any submissions yet. Join a team and submit your projects!"
          action={{
            label: 'View My Teams',
            onClick: () => window.location.href = '/dashboard/teams',
          }}
        />
      ) : (
        <div className="space-y-4">
          {submissions.map((submission, index) => (
            <motion.div
              key={submission._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-foreground text-lg">{submission.title}</h3>
                    <Badge className={getStatusColor(submission.status)}>
                      {getStatusIcon(submission.status)}
                      <span className="ml-1">{submission.status}</span>
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{submission.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {format(new Date(submission.submittedAt), 'MMM d, yyyy HH:mm')}
                    </span>
                    <span className="flex items-center gap-1">
                      {getSubmissionTypeIcon(submission.submissionType)}
                      {submission.submissionType}
                    </span>
                  </div>

                  {submission.technologies && submission.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {submission.technologies.map((tech, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {submission.githubUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={submission.githubUrl} target="_blank" rel="noopener noreferrer">
                        <Github className="w-4 h-4 mr-2" />
                        GitHub
                      </a>
                    </Button>
                  )}
                  {submission.liveDemoUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={submission.liveDemoUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Live Demo
                      </a>
                    </Button>
                  )}
                  <Button asChild>
                    <Link to={`/dashboard/submissions/${submission._id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>

              {submission.evaluationStatus === 'completed' && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Score</span>
                    <span className="text-lg font-bold text-primary">
                      {submission.averageScore?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Submissions;
