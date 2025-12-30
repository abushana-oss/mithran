'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useDeleteRouteStep, type ProcessRouteStep } from '@/lib/api/hooks/useProcessRoutes';
import { ProcessStepDialog } from './ProcessStepDialog';

interface ProcessStepsListProps {
  routeId: string;
  steps: ProcessRouteStep[];
}

export function ProcessStepsList({ routeId, steps }: ProcessStepsListProps) {
  const [addStepDialogOpen, setAddStepDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<ProcessRouteStep | null>(null);

  const deleteStepMutation = useDeleteRouteStep();

  const handleDeleteStep = (stepId: string) => {
    if (confirm('Are you sure you want to delete this step?')) {
      deleteStepMutation.mutate({ routeId, stepId });
    }
  };

  const handleEditStep = (step: ProcessRouteStep) => {
    setEditingStep(step);
  };

  const formatCost = (cost?: number) => {
    if (!cost) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(cost);
  };

  const formatTime = (minutes?: number) => {
    if (!minutes) return '-';
    return `${minutes} min`;
  };

  const formatHours = (hours?: number) => {
    if (!hours) return '-';
    return `${hours}h`;
  };

  // Sort steps by step number
  const sortedSteps = [...steps].sort((a, b) => a.stepNumber - b.stepNumber);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Process Steps</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAddStepDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Step
        </Button>
      </div>

      {sortedSteps.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg bg-muted/20">
          No steps added yet. Add your first process step to get started.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Step</TableHead>
                <TableHead>Operation</TableHead>
                <TableHead className="text-right">Setup Time</TableHead>
                <TableHead className="text-right">Cycle Time</TableHead>
                <TableHead className="text-right">Labor (h)</TableHead>
                <TableHead className="text-right">Machine (h)</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSteps.map((step) => (
                <TableRow key={step.id}>
                  <TableCell>
                    <Badge variant="outline">{step.stepNumber}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>{step.operationName}</div>
                    {step.notes && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {step.notes}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatTime(step.setupTimeMinutes)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatTime(step.cycleTimeMinutes)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatHours(step.laborHours)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatHours(step.machineHours)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-green-700">
                    {formatCost(step.calculatedCost)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStep(step)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStep(step.id)}
                        disabled={deleteStepMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Step Dialog */}
      <ProcessStepDialog
        open={addStepDialogOpen}
        onOpenChange={setAddStepDialogOpen}
        routeId={routeId}
        nextStepNumber={sortedSteps.length + 1}
      />

      {/* Edit Step Dialog */}
      {editingStep && (
        <ProcessStepDialog
          open={!!editingStep}
          onOpenChange={(open) => !open && setEditingStep(null)}
          routeId={routeId}
          step={editingStep}
          nextStepNumber={sortedSteps.length + 1}
        />
      )}
    </div>
  );
}
