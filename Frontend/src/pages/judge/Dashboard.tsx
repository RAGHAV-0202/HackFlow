import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import StatCard from '@/components/common/StatCard';
import EmptyState from '@/components/common/EmptyState';
import { evaluationApi } from '@/lib/api';
import { Hackathon, Submission } from '@/types';
import { ClipboardCheck, Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const JudgeDashboard = () => {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch hackathons and submissions in parallel
        const [hackathonsResponse, submissionsResponse]: any = await Promise.all([
          evaluationApi.getJudgeHackathons(),
          evaluationApi.getJudgeSubmissions()
        ]);
        
        setHackathons(hackathonsResponse?.data || []);
        setSubmissions(submissionsResponse?.data || []);
      } catch (error) {
        console.error('Failed to fetch judge data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const pendingSubmissions = submissions.filter(s => s.evaluationStatus === 'pending');
  const inProgressSubmissions = submissions.filter(s => s.evaluationStatus === 'in_progress');
  const completedSubmissions = submissions.filter(s => s.evaluationStatus === 'completed');

  const stats = [
    {
      title: 'Assigned Hackathons',
      value: hackathons.length,
      icon: ClipboardCheck,
      description: 'Total hackathons to judge'
    },
    {
      title: 'Pending Evaluations',
      value: pendingSubmissions.length + inProgressSubmissions.length,
      icon: Clock,
      description: 'Submissions awaiting review'
    },
    {
      title: 'Completed',
      value: completedSubmissions.length,
      icon: CheckCircle,
      description: 'Evaluations completed'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Judge Dashboard</h1>
        <p className="text-muted-foreground">Review and evaluate hackathon submissions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending Evaluations</CardTitle>
            <Link to="/judge/evaluations">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pendingSubmissions.length === 0 && inProgressSubmissions.length === 0 ? (
              <EmptyState
                icon={CheckCircle}
                title="All caught up!"
                description="No pending evaluations at the moment"
              />
            ) : (
              <div className="space-y-4">
                {[...pendingSubmissions, ...inProgressSubmissions].slice(0, 5).map((submission) => (
                  <div
                    key={submission._id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{submission.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {submission.team?.name} • Round {submission.round?.roundNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={submission.evaluationStatus === 'in_progress' ? 'default' : 'secondary'}>
                        {submission.evaluationStatus === 'in_progress' ? 'In Progress' : 'Pending'}
                      </Badge>
                      <Link to={`/judge/evaluate/${submission._id}`}>
                        <Button size="sm">
                          {submission.evaluationStatus === 'in_progress' ? 'Continue' : 'Evaluate'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Assigned Hackathons</CardTitle>
            <Link to="/judge/hackathons">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {hackathons.length === 0 ? (
              <EmptyState
                icon={AlertCircle}
                title="No assignments"
                description="You haven't been assigned to any hackathons yet"
              />
            ) : (
              <div className="space-y-4">
                {hackathons.slice(0, 5).map((hackathon) => (
                  <div
                    key={hackathon._id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{hackathon.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(hackathon.startDate), 'MMM d')} - {format(new Date(hackathon.endDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge variant={hackathon.status === 'ongoing' ? 'default' : 'secondary'}>
                      {hackathon.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JudgeDashboard;
