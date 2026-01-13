'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { ProcessCostDialog } from './ProcessCostDialog';

interface ProcessCost {
  id: string;
  opNbr: number;
  description: string;
  location?: string;
  group: string;
  processRoute: string;
  operation: string;
  processCalculatorId?: string;
  mhrId: string;
  lsrId: string;
  machineName: string;
  labourType: string;
  operationName: string;
  processRouteName: string;
  machineRate: number;
  labourRate: number;
  setupManning: number;
  setupTime: number;
  batchSize: number;
  heads: number;
  cycleTime: number;
  partsPerCycle: number;
  scrap: number;
  machineValue: number;
  totalCost: number;
}

export function ManufacturingProcessSection() {
  const [processes, setProcesses] = useState<ProcessCost[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProcess, setEditProcess] = useState<ProcessCost | null>(null);

  const handleAddProcess = () => {
    setEditProcess(null);
    setDialogOpen(true);
  };

  const handleEditProcess = (process: ProcessCost) => {
    setEditProcess(process);
    setDialogOpen(true);
  };

  const handleDialogSubmit = (data: any) => {
    const processData: ProcessCost = {
      id: data.id || Date.now().toString(),
      opNbr: data.opNbr,
      description: data.description,
      location: data.location,
      group: data.group,
      processRoute: data.processRoute,
      operation: data.operation,
      processCalculatorId: data.processCalculatorId,
      mhrId: data.mhrId,
      lsrId: data.lsrId,
      machineName: data.machineName,
      labourType: data.labourType,
      operationName: data.operationName,
      processRouteName: data.processRouteName,
      machineRate: data.machineRate,
      labourRate: data.labourRate,
      setupManning: data.setupManning,
      setupTime: data.setupTime,
      batchSize: data.batchSize,
      heads: data.heads,
      cycleTime: data.cycleTime,
      partsPerCycle: data.partsPerCycle,
      scrap: data.scrap,
      machineValue: data.machineValue,
      totalCost: data.totalCost,
    };

    if (data.id) {
      // Update existing process
      setProcesses(processes.map(p => p.id === data.id ? processData : p));
    } else {
      // Add new process
      setProcesses([...processes, processData]);
    }

    setDialogOpen(false);
    setEditProcess(null);
  };

  const handleDeleteProcess = (id: string) => {
    setProcesses(processes.filter(p => p.id !== id));
  };

  const calculateTotal = () => {
    return processes.reduce((sum, p) => sum + p.totalCost, 0).toFixed(2);
  };

  return (
    <div className="card border-l-4 border-l-primary shadow-md mb-4 mt-3 rounded-lg overflow-hidden">
      <div className="bg-primary py-3 px-4">
        <h6 className="m-0 font-semibold text-primary-foreground">Process Costs</h6>
      </div>
      <div className="bg-card p-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">Op#</th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">Description</th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">Group</th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">Process Route</th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">Operation</th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">Machine</th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">Labour</th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">Setup (min)</th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">Batch</th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">Cycle (s)</th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">Parts/Cycle</th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">Scrap %</th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">Total Cost (₹)</th>
                <th className="p-3 text-center text-xs font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {processes.length === 0 ? (
                <tr>
                  <td colSpan={14} className="p-8 text-center text-muted-foreground">
                    <p className="text-sm">No manufacturing processes added yet</p>
                    <p className="text-xs mt-1">Click "Add Process" to get started</p>
                  </td>
                </tr>
              ) : (
                <>
                  {processes.map((process) => (
                    <tr key={process.id} className="hover:bg-secondary/50">
                      <td className="p-3 border-r border-border text-xs">{process.opNbr}</td>
                      <td className="p-3 border-r border-border text-xs">{process.description}</td>
                      <td className="p-3 border-r border-border text-xs">{process.group}</td>
                      <td className="p-3 border-r border-border text-xs">{process.processRoute}</td>
                      <td className="p-3 border-r border-border text-xs">{process.operation}</td>
                      <td className="p-3 border-r border-border text-xs">
                        <div className="font-medium">{process.machineName}</div>
                        <div className="text-muted-foreground text-[10px]">₹{process.machineRate.toFixed(2)}/hr</div>
                      </td>
                      <td className="p-3 border-r border-border text-xs">
                        <div className="font-medium">{process.labourType}</div>
                        <div className="text-muted-foreground text-[10px]">₹{process.labourRate.toFixed(2)}/hr</div>
                      </td>
                      <td className="p-3 border-r border-border text-xs text-right">{process.setupTime}</td>
                      <td className="p-3 border-r border-border text-xs text-right">{process.batchSize}</td>
                      <td className="p-3 border-r border-border text-xs text-right">{process.cycleTime}</td>
                      <td className="p-3 border-r border-border text-xs text-right">{process.partsPerCycle}</td>
                      <td className="p-3 border-r border-border text-xs text-right">{process.scrap}%</td>
                      <td className="p-3 border-r border-border text-xs text-right font-semibold">
                        ₹{process.totalCost.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleEditProcess(process)}
                            title="Edit"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteProcess(process.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  <tr className="bg-secondary/30 font-semibold">
                    <td colSpan={12} className="p-3 text-right border-r border-border text-xs">
                      Total:
                    </td>
                    <td className="p-3 border-r border-border text-xs text-right">
                      ₹{calculateTotal()}
                    </td>
                    <td className="p-3"></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={handleAddProcess}>
            <Plus className="h-3 w-3 mr-1" />
            Add Process
          </Button>
        </div>
      </div>

      <ProcessCostDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleDialogSubmit}
        editData={editProcess}
      />
    </div>
  );
}
