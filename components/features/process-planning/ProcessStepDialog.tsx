'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAddRouteStep,
  useUpdateRouteStep,
  type ProcessRouteStep,
} from '@/lib/api/hooks/useProcessRoutes';
import { useProcesses } from '@/lib/api/hooks/useProcesses';

interface ProcessStepDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routeId: string;
  step?: ProcessRouteStep;
  nextStepNumber: number;
}

export function ProcessStepDialog({
  open,
  onOpenChange,
  routeId,
  step,
  nextStepNumber,
}: ProcessStepDialogProps) {
  const isEditing = !!step;

  const [processId, setProcessId] = useState(step?.processId || '');
  const [operationName, setOperationName] = useState(step?.operationName || '');
  const [setupTime, setSetupTime] = useState(step?.setupTimeMinutes?.toString() || '');
  const [cycleTime, setCycleTime] = useState(step?.cycleTimeMinutes?.toString() || '');
  const [laborHours, setLaborHours] = useState(step?.laborHours?.toString() || '');
  const [machineHours, setMachineHours] = useState(step?.machineHours?.toString() || '');
  const [notes, setNotes] = useState(step?.notes || '');

  const { data: processesData } = useProcesses({ limit: 100 });
  const processes = processesData?.processes || [];

  const addStepMutation = useAddRouteStep();
  const updateStepMutation = useUpdateRouteStep();

  // Auto-fill operation name when process is selected
  const handleProcessSelect = (selectedProcessId: string) => {
    setProcessId(selectedProcessId);
    const selectedProcess = processes.find((p) => p.id === selectedProcessId);
    if (selectedProcess && !operationName) {
      setOperationName(selectedProcess.processName);
    }
    // Auto-fill times from process if available
    if (selectedProcess) {
      if (selectedProcess.setupTimeMinutes && !setupTime) {
        setSetupTime(selectedProcess.setupTimeMinutes.toString());
      }
      if (selectedProcess.cycleTimeMinutes && !cycleTime) {
        setCycleTime(selectedProcess.cycleTimeMinutes.toString());
      }
    }
  };

  const handleSubmit = () => {
    if (!processId || !operationName.trim()) {
      return;
    }

    const data = {
      processRouteId: routeId,
      processId,
      stepNumber: step?.stepNumber || nextStepNumber,
      operationName: operationName.trim(),
      setupTimeMinutes: setupTime ? parseFloat(setupTime) : undefined,
      cycleTimeMinutes: cycleTime ? parseFloat(cycleTime) : undefined,
      laborHours: laborHours ? parseFloat(laborHours) : undefined,
      machineHours: machineHours ? parseFloat(machineHours) : undefined,
      notes: notes.trim() || undefined,
    };

    if (isEditing) {
      updateStepMutation.mutate(
        {
          routeId,
          stepId: step.id,
          data,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    } else {
      addStepMutation.mutate(data, {
        onSuccess: () => {
          // Reset form
          setProcessId('');
          setOperationName('');
          setSetupTime('');
          setCycleTime('');
          setLaborHours('');
          setMachineHours('');
          setNotes('');
          onOpenChange(false);
        },
      });
    }
  };

  const isPending = addStepMutation.isPending || updateStepMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Process Step' : 'Add Process Step'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details for this process step'
              : 'Add a new operation to the process route'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Process Selection */}
          <div className="space-y-2">
            <Label htmlFor="process">Process *</Label>
            <Select value={processId} onValueChange={handleProcessSelect}>
              <SelectTrigger id="process">
                <SelectValue placeholder="Select a process" />
              </SelectTrigger>
              <SelectContent>
                {processes.map((process) => (
                  <SelectItem key={process.id} value={process.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{process.processName}</span>
                      <span className="text-xs text-muted-foreground ml-4">
                        {process.processCategory}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operation Name */}
          <div className="space-y-2">
            <Label htmlFor="operationName">Operation Name *</Label>
            <Input
              id="operationName"
              value={operationName}
              onChange={(e) => setOperationName(e.target.value)}
              placeholder="e.g., Injection Molding - Part A"
            />
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="setupTime">Setup Time (minutes)</Label>
              <Input
                id="setupTime"
                type="number"
                min="0"
                step="0.01"
                value={setupTime}
                onChange={(e) => setSetupTime(e.target.value)}
                placeholder="30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cycleTime">Cycle Time (minutes)</Label>
              <Input
                id="cycleTime"
                type="number"
                min="0"
                step="0.01"
                value={cycleTime}
                onChange={(e) => setCycleTime(e.target.value)}
                placeholder="15"
              />
            </div>
          </div>

          {/* Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="laborHours">Labor Hours</Label>
              <Input
                id="laborHours"
                type="number"
                min="0"
                step="0.01"
                value={laborHours}
                onChange={(e) => setLaborHours(e.target.value)}
                placeholder="2.5"
              />
              <p className="text-xs text-muted-foreground">
                Used to calculate labor cost with labor hour rate
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="machineHours">Machine Hours</Label>
              <Input
                id="machineHours"
                type="number"
                min="0"
                step="0.01"
                value={machineHours}
                onChange={(e) => setMachineHours(e.target.value)}
                placeholder="1.5"
              />
              <p className="text-xs text-muted-foreground">
                Used to calculate machine cost with machine hour rate
              </p>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this step"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!processId || !operationName.trim() || isPending}
            >
              {isPending ? 'Saving...' : isEditing ? 'Update Step' : 'Add Step'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
