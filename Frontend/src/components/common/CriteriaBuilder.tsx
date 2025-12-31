import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface CriteriaItem {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  weight: number;
}

interface CriteriaBuilderProps {
  criteria: CriteriaItem[];
  onChange: (criteria: CriteriaItem[]) => void;
  maxTotalWeight?: number;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const CriteriaBuilder = ({ criteria, onChange, maxTotalWeight = 100 }: CriteriaBuilderProps) => {
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const isOverweight = totalWeight > maxTotalWeight;

  const addCriteria = () => {
    onChange([
      ...criteria,
      {
        id: generateId(),
        name: '',
        description: '',
        maxScore: 10,
        weight: Math.max(0, maxTotalWeight - totalWeight),
      },
    ]);
  };

  const updateCriteria = (id: string, updates: Partial<CriteriaItem>) => {
    onChange(
      criteria.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const removeCriteria = (id: string) => {
    onChange(criteria.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold">Evaluation Criteria</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Define how submissions will be scored
          </p>
        </div>
        <div className="text-right">
          <span
            className={`text-sm font-medium ${
              isOverweight ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            Total Weight: {totalWeight}%
          </span>
          {isOverweight && (
            <p className="text-xs text-destructive">
              Weight exceeds {maxTotalWeight}%
            </p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {criteria.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-border bg-card p-4 space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <GripVertical className="w-4 h-4 cursor-grab" />
                <span className="text-sm font-medium">Criteria {index + 1}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeCriteria(item.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="e.g., Innovation"
                  value={item.name}
                  onChange={(e) => updateCriteria(item.id, { name: e.target.value })}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label>Max Score</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={item.maxScore}
                    onChange={(e) =>
                      updateCriteria(item.id, { maxScore: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Weight (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={item.weight}
                    onChange={(e) =>
                      updateCriteria(item.id, { weight: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Describe what judges should look for..."
                value={item.description}
                onChange={(e) => updateCriteria(item.id, { description: e.target.value })}
                rows={2}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <Button
        type="button"
        variant="outline"
        onClick={addCriteria}
        className="w-full border-dashed"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Criteria
      </Button>
    </div>
  );
};

export default CriteriaBuilder;
