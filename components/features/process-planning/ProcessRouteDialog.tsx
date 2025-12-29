'use client';

import { useState } from 'react';
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
import { useCreateProcessRoute } from '@/lib/api/hooks/useProcessRoutes';

interface ProcessRouteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bomItemId: string;
}

export function ProcessRouteDialog({
  open,
  onOpenChange,
  bomItemId,
}: ProcessRouteDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const createMutation = useCreateProcessRoute();

  const handleSubmit = () => {
    if (!name.trim()) {
      return;
    }

    createMutation.mutate(
      {
        bomItemId,
        name: name.trim(),
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Process Route</DialogTitle>
          <DialogDescription>
            Define a new manufacturing process route for this BOM item
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Route Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Injection Molding Process"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of the process route"
              rows={3}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || createMutation.isPending}
            className="w-full"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Route'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
