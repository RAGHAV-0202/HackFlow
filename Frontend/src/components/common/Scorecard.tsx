import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Info, Save, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Criteria, Score } from '@/types';
import { cn } from '@/lib/utils';

interface ScorecardProps {
  criteria: Criteria[];
  initialScores?: Score[];
  initialFeedback?: string;
  initialStrengths?: string[];
  initialImprovements?: string[];
  onSave: (data: {
    scores: Score[];
    feedback: string;
    strengths: string[];
    improvements: string[];
    status: 'draft' | 'submitted';
  }) => Promise<void>;
  isSubmitting?: boolean;
}

const Scorecard = ({
  criteria,
  initialScores = [],
  initialFeedback = '',
  initialStrengths = [],
  initialImprovements = [],
  onSave,
  isSubmitting = false,
}: ScorecardProps) => {
  const buildScoresFromInitial = () => {
    const initial: Record<string, { score: number; comments: string }> = {};
    criteria.forEach((c) => {
      // Handle different formats: criteria can be string ID, object with _id, or object with id
      const existing = initialScores.find((s) => {
        const criteriaId = typeof s.criteria === 'string' 
          ? s.criteria 
          : (s.criteria?._id || (s.criteria as any)?.id);
        return criteriaId === c._id;
      });
      initial[c._id] = {
        score: existing?.score ?? 0,
        comments: existing?.comments ?? '',
      };
    });
    return initial;
  };

  const [scores, setScores] = useState<Record<string, { score: number; comments: string }>>(buildScoresFromInitial);

  // Update scores when initialScores changes (e.g., when existing evaluation loads)
  useEffect(() => {
    if (initialScores.length > 0) {
      setScores(buildScoresFromInitial());
    }
  }, [initialScores, criteria]);

  const [feedback, setFeedback] = useState(initialFeedback);
  const [strengthsText, setStrengthsText] = useState(initialStrengths.join('\n'));
  const [improvementsText, setImprovementsText] = useState(initialImprovements.join('\n'));

  // Update feedback fields when initial values change
  useEffect(() => {
    setFeedback(initialFeedback);
  }, [initialFeedback]);

  useEffect(() => {
    setStrengthsText(initialStrengths.join('\n'));
  }, [initialStrengths]);

  useEffect(() => {
    setImprovementsText(initialImprovements.join('\n'));
  }, [initialImprovements]);

  const totalScore = useMemo(() => {
    return criteria.reduce((sum, c) => sum + (scores[c._id]?.score || 0), 0);
  }, [criteria, scores]);

  const weightedScore = useMemo(() => {
    return criteria.reduce((sum, c) => {
      const score = scores[c._id]?.score || 0;
      const normalizedScore = (score / c.maxScore) * c.weight;
      return sum + normalizedScore;
    }, 0);
  }, [criteria, scores]);

  const maxTotalScore = useMemo(() => {
    return criteria.reduce((sum, c) => sum + c.maxScore, 0);
  }, [criteria]);

  const handleScoreChange = (criteriaId: string, value: number) => {
    setScores((prev) => ({
      ...prev,
      [criteriaId]: { ...prev[criteriaId], score: value },
    }));
  };

  const handleCommentChange = (criteriaId: string, value: string) => {
    setScores((prev) => ({
      ...prev,
      [criteriaId]: { ...prev[criteriaId], comments: value },
    }));
  };

  const handleSubmit = async (status: 'draft' | 'submitted') => {
    const formattedScores: Score[] = criteria.map((c) => ({
      criteria: c._id,
      score: scores[c._id]?.score || 0,
      maxScore: c.maxScore,
      weight: c.weight,
      comments: scores[c._id]?.comments || undefined,
    }));

    await onSave({
      scores: formattedScores,
      feedback,
      strengths: strengthsText.split('\n').filter((s) => s.trim()),
      improvements: improvementsText.split('\n').filter((s) => s.trim()),
      status,
    });
  };

  const scorePercentage = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Score Summary */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold">Score Summary</h3>
          <Badge
            variant="outline"
            className={cn(
              'text-lg font-bold px-4 py-1',
              scorePercentage >= 80 && 'bg-success/10 text-success border-success/30',
              scorePercentage >= 60 && scorePercentage < 80 && 'bg-warning/10 text-warning border-warning/30',
              scorePercentage < 60 && 'bg-destructive/10 text-destructive border-destructive/30'
            )}
          >
            {totalScore} / {maxTotalScore}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{scorePercentage.toFixed(1)}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <motion.div
              className={cn(
                'h-full rounded-full',
                scorePercentage >= 80 && 'bg-success',
                scorePercentage >= 60 && scorePercentage < 80 && 'bg-warning',
                scorePercentage < 60 && 'bg-destructive'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${scorePercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
          <div>
            <p className="text-sm text-muted-foreground">Total Score</p>
            <p className="text-xl font-bold text-foreground">{totalScore}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Weighted Score</p>
            <p className="text-xl font-bold text-foreground">{weightedScore.toFixed(2)}%</p>
          </div>
        </div>
      </div>

      {/* Criteria Scores */}
      <div className="space-y-4">
        <h3 className="font-heading font-semibold">Evaluation Criteria</h3>
        
        {criteria.map((c, index) => (
          <motion.div
            key={c._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-xl border border-border bg-card p-5 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-foreground">{c.name}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {c.weight}%
                  </Badge>
                </div>
                {c.description && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 cursor-help">
                        <Info className="w-3 h-3" />
                        {c.description.substring(0, 50)}...
                      </p>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{c.description}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-foreground">
                  {scores[c._id]?.score || 0}
                </span>
                <span className="text-muted-foreground"> / {c.maxScore}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Slider
                value={[scores[c._id]?.score || 0]}
                onValueChange={([value]) => handleScoreChange(c._id, value)}
                max={c.maxScore}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>{c.maxScore}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Comments (optional)</Label>
              <Textarea
                placeholder="Add specific feedback for this criteria..."
                value={scores[c._id]?.comments || ''}
                onChange={(e) => handleCommentChange(c._id, e.target.value)}
                rows={2}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Overall Feedback */}
      <div className="space-y-4">
        <h3 className="font-heading font-semibold">Overall Feedback</h3>
        
        <div className="space-y-2">
          <Label>General Feedback</Label>
          <Textarea
            placeholder="Provide overall feedback for the submission..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-success">Strengths</Label>
            <Textarea
              placeholder="List strengths (one per line)..."
              value={strengthsText}
              onChange={(e) => setStrengthsText(e.target.value)}
              rows={4}
              className="border-success/30 focus:ring-success/30"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-warning">Areas for Improvement</Label>
            <Textarea
              placeholder="List improvements (one per line)..."
              value={improvementsText}
              onChange={(e) => setImprovementsText(e.target.value)}
              rows={4}
              className="border-warning/30 focus:ring-warning/30"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={() => handleSubmit('draft')}
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save as Draft
        </Button>
        <Button
          onClick={() => handleSubmit('submitted')}
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Submit Evaluation
        </Button>
      </div>
    </div>
  );
};

export default Scorecard;
