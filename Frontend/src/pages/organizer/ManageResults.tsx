import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calculator,
  Trophy,
  Loader2,
  Eye,
  EyeOff,
  BarChart3,
  Medal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import EmptyState from '@/components/common/EmptyState';
import { hackathonApi, resultsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Hackathon, Round, Result } from '@/types';

const ManageResults = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [selectedRound, setSelectedRound] = useState<string>('overall');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchHackathon();
    }
  }, [id]);

  useEffect(() => {
    if (hackathon && selectedRound) {
      fetchResults();
    }
  }, [hackathon, selectedRound]);

  const fetchHackathon = async () => {
    try {
      const response: any = await hackathonApi.getById(id!);
      setHackathon(response.data);
    } catch (error) {
      console.error('Failed to fetch hackathon:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      let response: any;
      if (selectedRound === 'overall') {
        response = await resultsApi.getOverallResults(id!, false);
      } else {
        response = await resultsApi.getRoundResults(selectedRound, false);
      }
      setResults(response.data || []);
    } catch (error) {
      console.error('Failed to fetch results:', error);
      setResults([]);
    }
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      if (selectedRound === 'overall') {
        await resultsApi.calculateOverall(id!);
      } else {
        await resultsApi.calculateRound(selectedRound);
      }
      await fetchResults();
      toast({
        title: 'Results calculated',
        description: 'Rankings have been updated based on evaluations.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to calculate results.',
        variant: 'destructive',
      });
    } finally {
      setCalculating(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const isPublished = results.some((r) => r.isPublished);
      if (isPublished) {
        await resultsApi.unpublish(id!, selectedRound !== 'overall' ? selectedRound : undefined);
        toast({
          title: 'Results unpublished',
          description: 'Results are now hidden from participants.',
        });
      } else {
        await resultsApi.publish(id!, selectedRound !== 'overall' ? selectedRound : undefined);
        toast({
          title: 'Results published',
          description: 'Participants can now view the results.',
        });
      }
      await fetchResults();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update publication status.',
        variant: 'destructive',
      });
    } finally {
      setPublishing(false);
    }
  };

  const isPublished = results.some((r) => r.isPublished);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Medal className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-muted-foreground font-medium">#{rank}</span>;
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
    <div className="max-w-5xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Hackathon
        </Button>

        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">
              Results & Rankings
            </h1>
            {hackathon && (
              <p className="text-muted-foreground">{hackathon.title}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCalculate}
              disabled={calculating}
            >
              {calculating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Calculator className="w-4 h-4 mr-2" />
              )}
              Calculate
            </Button>
            <Button
              variant={isPublished ? 'outline' : 'default'}
              onClick={handlePublish}
              disabled={publishing || results.length === 0}
            >
              {publishing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : isPublished ? (
                <EyeOff className="w-4 h-4 mr-2" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              {isPublished ? 'Unpublish' : 'Publish'}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Round Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-4"
      >
        <Select value={selectedRound} onValueChange={setSelectedRound}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select round" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overall">Overall Results</SelectItem>
            {hackathon?.rounds?.map((round) => (
              <SelectItem key={round._id} value={round._id}>
                Round {round.roundNumber}: {round.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isPublished && (
          <Badge variant="secondary" className="bg-success/10 text-success border-success/30">
            Published
          </Badge>
        )}
      </motion.div>

      {/* Results Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-border bg-card"
      >
        {results.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Weighted Score</TableHead>
                <TableHead>Prize</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result._id}>
                  <TableCell className="font-medium">
                    {getRankBadge(result.rank)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">
                        {result.team?.name || 'Unknown Team'}
                      </p>
                      {result.team?.projectName && (
                        <p className="text-sm text-muted-foreground">
                          {result.team.projectName}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {result.totalScore.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {result.weightedScore.toFixed(2)}%
                  </TableCell>
                  <TableCell>
                    {result.prize ? (
                      <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/30">
                        <Trophy className="w-3 h-3 mr-1" />
                        {result.prize}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-12">
            <EmptyState
              icon={BarChart3}
              title="No results yet"
              description="Calculate results after evaluations are complete."
            />
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ManageResults;
