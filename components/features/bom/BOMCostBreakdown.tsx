'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface CostBreakdownProps {
  bomId: string;
}

interface ProcessCost {
  process: string;
  machineTime: number;
  laborTime: number;
  cycleTime: number;
  setupTime: number;
  variableCost: number;
  fixedCost: number;
  totalCost: number;
}

export function BOMCostBreakdown({ bomId: _bomId }: CostBreakdownProps) {
  // Mock data - replace with actual API call
  // TODO: Use bomId to fetch actual cost data
  const processes: ProcessCost[] = [
    {
      process: 'Casting',
      machineTime: 12.34,
      laborTime: 11.92,
      cycleTime: 172,
      setupTime: 25.0,
      variableCost: 156.19,
      fixedCost: 78.4,
      totalCost: 234.59,
    },
    {
      process: 'Bridgeport V...',
      machineTime: 7.65,
      laborTime: 7.12,
      cycleTime: 137,
      setupTime: 18.0,
      variableCost: 89.23,
      fixedCost: 45.6,
      totalCost: 134.83,
    },
    {
      process: 'Finishing',
      machineTime: 8.12,
      laborTime: 8.12,
      cycleTime: 112.16,
      setupTime: 9.0,
      variableCost: 174.45,
      fixedCost: 24.5,
      totalCost: 198.95,
    },
    {
      process: 'Inspection',
      machineTime: 0.0,
      laborTime: 6.0,
      cycleTime: 17.0,
      setupTime: 2.0,
      variableCost: 26.4,
      fixedCost: 8.2,
      totalCost: 34.6,
    },
    {
      process: 'Packaging',
      machineTime: 1.5,
      laborTime: 3.5,
      cycleTime: 11.5,
      setupTime: 1.0,
      variableCost: 11.45,
      fixedCost: 4.3,
      totalCost: 15.75,
    },
  ];

  const totalVariableCost = processes.reduce((sum, p) => sum + p.variableCost, 0);
  const totalFixedCost = processes.reduce((sum, p) => sum + p.fixedCost, 0);
  const grandTotal = totalVariableCost + totalFixedCost;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Cost Breakdown</CardTitle>
          <Badge variant="secondary" className="font-mono">
            Total: ${grandTotal.toFixed(2)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[180px] font-semibold">Process</TableHead>
                <TableHead className="text-right font-semibold">
                  <div>Machine</div>
                  <div className="text-xs text-muted-foreground font-normal">(hrs)</div>
                </TableHead>
                <TableHead className="text-right font-semibold">
                  <div>Labor</div>
                  <div className="text-xs text-muted-foreground font-normal">(hrs)</div>
                </TableHead>
                <TableHead className="text-right font-semibold">
                  <div>Cycle</div>
                  <div className="text-xs text-muted-foreground font-normal">(min)</div>
                </TableHead>
                <TableHead className="text-right font-semibold">
                  <div>Setup</div>
                  <div className="text-xs text-muted-foreground font-normal">(min)</div>
                </TableHead>
                <TableHead className="text-right font-semibold bg-blue-50 dark:bg-blue-950/30">
                  <div>Variable</div>
                  <div className="text-xs text-muted-foreground font-normal">($)</div>
                </TableHead>
                <TableHead className="text-right font-semibold bg-orange-50 dark:bg-orange-950/30">
                  <div>Fixed</div>
                  <div className="text-xs text-muted-foreground font-normal">($)</div>
                </TableHead>
                <TableHead className="text-right font-semibold bg-green-50 dark:bg-green-950/30">
                  <div>Total Cost</div>
                  <div className="text-xs text-muted-foreground font-normal">($)</div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processes.map((process, idx) => (
                <TableRow key={idx} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{process.process}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {process.machineTime.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {process.laborTime.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {process.cycleTime.toFixed(0)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {process.setupTime.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm bg-blue-50/50 dark:bg-blue-950/20">
                    ${process.variableCost.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm bg-orange-50/50 dark:bg-orange-950/20">
                    ${process.fixedCost.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold bg-green-50/50 dark:bg-green-950/20">
                    ${process.totalCost.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2 bg-muted/50 font-bold">
                <TableCell colSpan={5} className="text-right">
                  TOTALS:
                </TableCell>
                <TableCell className="text-right font-mono bg-blue-100 dark:bg-blue-900/40">
                  ${totalVariableCost.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-mono bg-orange-100 dark:bg-orange-900/40">
                  ${totalFixedCost.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-mono text-lg bg-green-100 dark:bg-green-900/40">
                  ${grandTotal.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
