'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface ProcuredPart {
  id: string;
  imageUrl?: string;
  part: string;
  currencyCode: string;
  unitCostOrigin: number;
  exchangeRate: number;
  unitCostEstimate: number;
  noOff: number;
  scrapPercentage: number;
  overheadPercentage: number;
  totalCost: number;
}

export function ProcuredPartsSection() {
  const [procuredParts, setProcuredParts] = useState<ProcuredPart[]>([]);

  const handleAddProcuredPart = () => {
    const newPart: ProcuredPart = {
      id: Date.now().toString(),
      part: '',
      currencyCode: '',
      unitCostOrigin: 0,
      exchangeRate: 0,
      unitCostEstimate: 0,
      noOff: 0,
      scrapPercentage: 0,
      overheadPercentage: 0,
      totalCost: 0,
    };
    setProcuredParts([...procuredParts, newPart]);
  };

  const handleDeleteProcuredPart = (id: string) => {
    setProcuredParts(procuredParts.filter(p => p.id !== id));
  };

  const calculateTotal = () => {
    return procuredParts.reduce((sum, p) => sum + p.totalCost, 0).toFixed(2);
  };

  return (
    <div className="card border-l-4 border-l-primary shadow-md mb-4 mt-3 rounded-lg overflow-hidden">
      <div className="bg-primary py-3 px-4">
        <h6 className="m-0 font-semibold text-primary-foreground">Procured Parts</h6>
      </div>
      <div className="bg-card p-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  Image
                </th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  Part
                </th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  Currency Code
                </th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  Unit Cost Country of Origin
                </th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  Exchange Rate
                </th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  Unit Cost Country of Estimate
                </th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  No Off
                </th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  Scrap %
                </th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  Overhead %
                </th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  Total Cost
                </th>
                <th className="p-3 text-center text-xs font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {procuredParts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-3 text-right border-r border-border"></td>
                  <td className="p-3 border-r border-border">-</td>
                  <td></td>
                </tr>
              ) : (
                <>
                  {procuredParts.map((part) => (
                    <tr key={part.id} className="hover:bg-secondary/50">
                      <td className="p-3 border-r border-border">
                        {part.imageUrl ? (
                          <img
                            src={part.imageUrl}
                            alt={part.part}
                            className="w-[200px] h-auto inline-block"
                          />
                        ) : (
                          <div className="w-[200px] h-[100px] bg-secondary rounded flex items-center justify-center text-xs text-muted-foreground">
                            No Image
                          </div>
                        )}
                      </td>
                      <td className="p-3 border-r border-border">
                        <Input
                          value={part.part}
                          onChange={(e) => {
                            const updated = procuredParts.map(p =>
                              p.id === part.id ? { ...p, part: e.target.value } : p
                            );
                            setProcuredParts(updated);
                          }}
                          className="h-8 text-xs"
                          placeholder="Part name"
                        />
                      </td>
                      <td className="p-3 border-r border-border">
                        <Input
                          value={part.currencyCode}
                          onChange={(e) => {
                            const updated = procuredParts.map(p =>
                              p.id === part.id ? { ...p, currencyCode: e.target.value } : p
                            );
                            setProcuredParts(updated);
                          }}
                          className="h-8 text-xs w-20"
                          placeholder="USD"
                        />
                      </td>
                      <td className="p-3 border-r border-border">
                        <Input
                          type="number"
                          step="0.01"
                          value={part.unitCostOrigin}
                          onChange={(e) => {
                            const updated = procuredParts.map(p =>
                              p.id === part.id ? { ...p, unitCostOrigin: parseFloat(e.target.value) || 0 } : p
                            );
                            setProcuredParts(updated);
                          }}
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="p-3 border-r border-border">
                        <Input
                          type="number"
                          step="0.01"
                          value={part.exchangeRate}
                          onChange={(e) => {
                            const updated = procuredParts.map(p =>
                              p.id === part.id ? { ...p, exchangeRate: parseFloat(e.target.value) || 0 } : p
                            );
                            setProcuredParts(updated);
                          }}
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="p-3 border-r border-border">
                        <Input
                          type="number"
                          step="0.01"
                          value={part.unitCostEstimate}
                          onChange={(e) => {
                            const updated = procuredParts.map(p =>
                              p.id === part.id ? { ...p, unitCostEstimate: parseFloat(e.target.value) || 0 } : p
                            );
                            setProcuredParts(updated);
                          }}
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="p-3 border-r border-border">
                        <Input
                          type="number"
                          step="1"
                          value={part.noOff}
                          onChange={(e) => {
                            const updated = procuredParts.map(p =>
                              p.id === part.id ? { ...p, noOff: parseInt(e.target.value) || 0 } : p
                            );
                            setProcuredParts(updated);
                          }}
                          className="h-8 text-xs w-20"
                        />
                      </td>
                      <td className="p-3 border-r border-border">
                        <Input
                          type="number"
                          step="0.1"
                          value={part.scrapPercentage}
                          onChange={(e) => {
                            const updated = procuredParts.map(p =>
                              p.id === part.id ? { ...p, scrapPercentage: parseFloat(e.target.value) || 0 } : p
                            );
                            setProcuredParts(updated);
                          }}
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="p-3 border-r border-border">
                        <Input
                          type="number"
                          step="0.1"
                          value={part.overheadPercentage}
                          onChange={(e) => {
                            const updated = procuredParts.map(p =>
                              p.id === part.id ? { ...p, overheadPercentage: parseFloat(e.target.value) || 0 } : p
                            );
                            setProcuredParts(updated);
                          }}
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="p-3 border-r border-border">
                        <Input
                          type="number"
                          step="0.01"
                          value={part.totalCost}
                          onChange={(e) => {
                            const updated = procuredParts.map(p =>
                              p.id === part.id ? { ...p, totalCost: parseFloat(e.target.value) || 0 } : p
                            );
                            setProcuredParts(updated);
                          }}
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            title="Edit"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteProcuredPart(part.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-secondary/30 font-semibold">
                    <td colSpan={9} className="p-3 text-right border-r border-border"></td>
                    <td className="p-3 border-r border-border">
                      {calculateTotal()}
                    </td>
                    <td></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <Button
            onClick={handleAddProcuredPart}
            variant="outline"
            size="sm"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Procured Part
          </Button>
        </div>
      </div>
    </div>
  );
}
