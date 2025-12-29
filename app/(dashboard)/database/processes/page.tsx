'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/common/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { useProcesses, useCreateProcess } from '@/lib/api/hooks/useProcesses';

export default function Processes() {
  const [open, setOpen] = useState(false);
  const [processName, setProcessName] = useState('');
  const [processCategory, setProcessCategory] = useState('');
  const [description, setDescription] = useState('');
  const [machineRequired, setMachineRequired] = useState(false);
  const [machineType, setMachineType] = useState('');
  const [setupTime, setSetupTime] = useState('');
  const [cycleTime, setCycleTime] = useState('');

  const { data: processesData, isLoading } = useProcesses();
  const processes = processesData?.processes || [];

  const createMutation = useCreateProcess();

  const handleCreateProcess = () => {
    if (!processName || !processCategory) {
      toast.error('Process name and category are required');
      return;
    }

    createMutation.mutate(
      {
        processName,
        processCategory,
        description: description || undefined,
        machineRequired,
        machineType: machineType || undefined,
        setupTimeMinutes: setupTime ? parseFloat(setupTime) : undefined,
        cycleTimeMinutes: cycleTime ? parseFloat(cycleTime) : undefined,
        laborRequired: true,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setProcessName('');
          setProcessCategory('');
          setDescription('');
          setMachineRequired(false);
          setMachineType('');
          setSetupTime('');
          setCycleTime('');
        },
        onError: (e: Error) => toast.error(e.message),
      }
    );
  };

  const columns = [
    { key: 'processName', header: 'Process Name' },
    { key: 'processCategory', header: 'Category' },
    {
      key: 'machineType',
      header: 'Machine Type',
      render: (p: any) => p.machineType || '-'
    },
    {
      key: 'setupTimeMinutes',
      header: 'Setup Time',
      render: (p: any) => p.setupTimeMinutes ? `${p.setupTimeMinutes} min` : '-'
    },
    {
      key: 'cycleTimeMinutes',
      header: 'Cycle Time',
      render: (p: any) => p.cycleTimeMinutes ? `${p.cycleTimeMinutes} min` : '-'
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Process Library"
        description="Manage manufacturing processes for production planning"
      >
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Process
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Manufacturing Process</DialogTitle>
              <DialogDescription>
                Define a new manufacturing process for your process library
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Process Name *</Label>
                  <Input
                    value={processName}
                    onChange={(e) => setProcessName(e.target.value)}
                    placeholder="e.g., CNC Machining"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Process Category *</Label>
                  <Select value={processCategory} onValueChange={setProcessCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Machining">Machining</SelectItem>
                      <SelectItem value="Casting">Casting</SelectItem>
                      <SelectItem value="Molding">Molding</SelectItem>
                      <SelectItem value="Finishing">Finishing</SelectItem>
                      <SelectItem value="Assembly">Assembly</SelectItem>
                      <SelectItem value="Inspection">Inspection</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the process"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Setup Time (minutes)</Label>
                  <Input
                    type="number"
                    value={setupTime}
                    onChange={(e) => setSetupTime(e.target.value)}
                    placeholder="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cycle Time (minutes)</Label>
                  <Input
                    type="number"
                    value={cycleTime}
                    onChange={(e) => setCycleTime(e.target.value)}
                    placeholder="15"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="machineRequired"
                    checked={machineRequired}
                    onCheckedChange={(checked) => setMachineRequired(checked as boolean)}
                  />
                  <Label
                    htmlFor="machineRequired"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Machine Required
                  </Label>
                </div>

                {machineRequired && (
                  <div className="space-y-2 pl-6">
                    <Label>Machine Type</Label>
                    <Input
                      value={machineType}
                      onChange={(e) => setMachineType(e.target.value)}
                      placeholder="e.g., CNC Mill, Lathe"
                    />
                  </div>
                )}
              </div>

              <Button
                onClick={handleCreateProcess}
                disabled={!processName || !processCategory || createMutation.isPending}
                className="w-full"
              >
                {createMutation.isPending ? 'Creating...' : 'Add Process'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <DataTable
        data={processes}
        columns={columns}
        loading={isLoading}
        emptyMessage="No processes yet. Add your first manufacturing process to get started."
      />
    </div>
  );
}
