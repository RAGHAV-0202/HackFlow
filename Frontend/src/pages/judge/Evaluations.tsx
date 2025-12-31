import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmptyState from '@/components/common/EmptyState';
import { evaluationApi } from '@/lib/api';
import { Submission } from '@/types';
import { ClipboardCheck, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const Evaluations = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response: any = await evaluationApi.getJudgeSubmissions();
        // Axios interceptor returns response.data, so response is { statusCode, data: [...], message, success }
        const submissionsData = response?.data || [];
        setSubmissions(submissionsData);
      } catch (error) {
        console.error('Failed to fetch submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const pendingSubmissions = submissions.filter(s => s.evaluationStatus === 'pending');
  const inProgressSubmissions = submissions.filter(s => s.evaluationStatus === 'in_progress');
  const completedSubmissions = submissions.filter(s => s.evaluationStatus === 'completed');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <ClipboardCheck className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const SubmissionCard = ({ submission }: { submission: Submission }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold">{submission.title}</h3>
            <p className="text-sm text-muted-foreground">{submission.team?.name}</p>
          </div>
          <Badge variant={submission.evaluationStatus === 'completed' ? 'default' : 'secondary'}>
            {getStatusIcon(submission.evaluationStatus)}
            <span className="ml-1 capitalize">{submission.evaluationStatus}</span>
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {submission.description}
        </p>

        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <span>Round {submission.round?.roundNumber}</span>
          <span>Submitted {format(new Date(submission.submittedAt), 'MMM d, yyyy')}</span>
        </div>

        {submission.evaluationStatus === 'completed' ? (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Score: {submission.averageScore?.toFixed(1) || 'N/A'}</span>
            <Link to={`/judge/evaluate/${submission._id}`}>
              <Button variant="outline" size="sm">View Details</Button>
            </Link>
          </div>
        ) : (
          <Link to={`/judge/evaluate/${submission._id}`}>
            <Button className="w-full">
              {submission.evaluationStatus === 'in_progress' ? 'Continue Evaluation' : 'Start Evaluation'}
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Evaluations</h1>
        <p className="text-muted-foreground">Review and score hackathon submissions</p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress ({inProgressSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedSubmissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingSubmissions.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="No pending evaluations"
              description="All submissions have been reviewed"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingSubmissions.map((submission) => (
                <SubmissionCard key={submission._id} submission={submission} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="in_progress">
          {inProgressSubmissions.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No evaluations in progress"
              description="Start evaluating pending submissions"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inProgressSubmissions.map((submission) => (
                <SubmissionCard key={submission._id} submission={submission} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedSubmissions.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="No completed evaluations"
              description="Your completed evaluations will appear here"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedSubmissions.map((submission) => (
                <SubmissionCard key={submission._id} submission={submission} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Evaluations;
