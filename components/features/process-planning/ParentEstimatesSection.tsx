'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface ParentEstimate {
  id: string;
  imageUrl?: string;
  name: string;
  description: string;
  location: string;
  currency: string;
  sgaPercentage: number;
  profitPercentage: number;
  total: number;
}

export function ParentEstimatesSection() {
  const [parentEstimates, setParentEstimates] = useState<ParentEstimate[]>([]);

  const handleAddParentEstimate = () => {
    const newEstimate: ParentEstimate = {
      id: Date.now().toString(),
      name: '',
      description: '',
      location: '',
      currency: '',
      sgaPercentage: 0,
      profitPercentage: 0,
      total: 0,
    };
    setParentEstimates([...parentEstimates, newEstimate]);
  };

  const handleDeleteParentEstimate = (id: string) => {
    setParentEstimates(parentEstimates.filter(e => e.id !== id));
  };

  return (
    <div className="card border-l-4 border-l-primary shadow-md mb-4 mt-3 rounded-lg overflow-hidden">
      <div className="bg-primary py-3 px-4">
        <h6 className="m-0 font-semibold text-primary-foreground">Parent Estimates Where this Estimate is a Child</h6>
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
                  Name
                </th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  Description
                </th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  Location
                </th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  Currency
                </th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  SGA %
                </th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  Profit %
                </th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  Total
                </th>
                <th className="p-3 text-center text-xs font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {parentEstimates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    <p className="text-sm">No parent estimates added yet</p>
                    <p className="text-xs mt-1">Click "Add Parent Estimate" to get started</p>
                  </td>
                </tr>
              ) : (
                parentEstimates.map((estimate) => (
                <tr key={estimate.id} className="hover:bg-secondary/50">
                  <td className="p-3 border-r border-border">
                    {estimate.imageUrl ? (
                      <img
                        src={estimate.imageUrl}
                        alt={estimate.name}
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
                      value={estimate.name}
                      onChange={(e) => {
                        const updated = parentEstimates.map(est =>
                          est.id === estimate.id ? { ...est, name: e.target.value } : est
                        );
                        setParentEstimates(updated);
                      }}
                      className="h-8 text-xs"
                      placeholder="Estimate name"
                    />
                  </td>
                  <td className="p-3 border-r border-border">
                    <Input
                      value={estimate.description}
                      onChange={(e) => {
                        const updated = parentEstimates.map(est =>
                          est.id === estimate.id ? { ...est, description: e.target.value } : est
                        );
                        setParentEstimates(updated);
                      }}
                      className="h-8 text-xs"
                      placeholder="Description"
                    />
                  </td>
                  <td className="p-3 border-r border-border">
                    <Input
                      value={estimate.location}
                      onChange={(e) => {
                        const updated = parentEstimates.map(est =>
                          est.id === estimate.id ? { ...est, location: e.target.value } : est
                        );
                        setParentEstimates(updated);
                      }}
                      className="h-8 text-xs"
                      placeholder="Location"
                    />
                  </td>
                  <td className="p-3 border-r border-border">
                    <Input
                      value={estimate.currency}
                      onChange={(e) => {
                        const updated = parentEstimates.map(est =>
                          est.id === estimate.id ? { ...est, currency: e.target.value } : est
                        );
                        setParentEstimates(updated);
                      }}
                      className="h-8 text-xs w-20"
                      placeholder="USD"
                    />
                  </td>
                  <td className="p-3 border-r border-border">
                    <Input
                      type="number"
                      step="0.1"
                      value={estimate.sgaPercentage}
                      onChange={(e) => {
                        const updated = parentEstimates.map(est =>
                          est.id === estimate.id ? { ...est, sgaPercentage: parseFloat(e.target.value) || 0 } : est
                        );
                        setParentEstimates(updated);
                      }}
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="p-3 border-r border-border">
                    <Input
                      type="number"
                      step="0.1"
                      value={estimate.profitPercentage}
                      onChange={(e) => {
                        const updated = parentEstimates.map(est =>
                          est.id === estimate.id ? { ...est, profitPercentage: parseFloat(e.target.value) || 0 } : est
                        );
                        setParentEstimates(updated);
                      }}
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="p-3 border-r border-border">
                    <Input
                      type="number"
                      step="0.01"
                      value={estimate.total}
                      onChange={(e) => {
                        const updated = parentEstimates.map(est =>
                          est.id === estimate.id ? { ...est, total: parseFloat(e.target.value) || 0 } : est
                        );
                        setParentEstimates(updated);
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
                        onClick={() => handleDeleteParentEstimate(estimate.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <Button
            onClick={handleAddParentEstimate}
            variant="outline"
            size="sm"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Parent Estimate
          </Button>
        </div>
      </div>
    </div>
  );
}
