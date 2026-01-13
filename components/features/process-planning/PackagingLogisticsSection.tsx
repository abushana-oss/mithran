'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface LogisticsItem {
  id: string;
  logisticsType: string;
  description: string;
  calculator: string;
  costBasis: string;
  parameters: string;
  unitCost: number;
  quantity: number;
  totalCost: number;
}

export function PackagingLogisticsSection() {
  const [logisticsItems, setLogisticsItems] = useState<LogisticsItem[]>([]);

  const handleAddLogisticsItem = () => {
    const newItem: LogisticsItem = {
      id: Date.now().toString(),
      logisticsType: '',
      description: '',
      calculator: '',
      costBasis: '',
      parameters: '',
      unitCost: 0,
      quantity: 0,
      totalCost: 0,
    };
    setLogisticsItems([...logisticsItems, newItem]);
  };

  const handleDeleteLogisticsItem = (id: string) => {
    setLogisticsItems(logisticsItems.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return logisticsItems.reduce((sum, item) => sum + item.totalCost, 0).toFixed(2);
  };

  return (
    <div className="card border-l-4 border-l-primary shadow-md mb-4 mt-3 rounded-lg overflow-hidden">
      <div className="bg-primary py-3 px-4">
        <h6 className="m-0 font-semibold text-primary-foreground">Packaging & Logistics</h6>
      </div>
      <div className="bg-card p-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  Logistics Type
                </th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  Description
                </th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  Calculator
                </th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  Cost Basis
                </th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  Parameters
                </th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  Unit Cost
                </th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  Quantity
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
              {logisticsItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    <p className="text-sm">No packaging or logistics items added yet</p>
                    <p className="text-xs mt-1">Click "Add Logistics Item" to get started</p>
                  </td>
                </tr>
              ) : (
                <>
                  {logisticsItems.map((item) => (
                <tr key={item.id} className="hover:bg-secondary/50">
                  <td className="p-3 border-r border-border">
                    <Select
                      value={item.logisticsType}
                      onValueChange={(value) => {
                        const updated = logisticsItems.map(i =>
                          i.id === item.id ? { ...i, logisticsType: value } : i
                        );
                        setLogisticsItems(updated);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Packaging">Packaging</SelectItem>
                        <SelectItem value="Delivery/Shipping">Delivery/Shipping</SelectItem>
                        <SelectItem value="Storage">Storage</SelectItem>
                        <SelectItem value="Handling">Handling</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3 border-r border-border">
                    <Input
                      value={item.description}
                      onChange={(e) => {
                        const updated = logisticsItems.map(i =>
                          i.id === item.id ? { ...i, description: e.target.value } : i
                        );
                        setLogisticsItems(updated);
                      }}
                      className="h-8 text-xs"
                      placeholder="e.g., Corrugated box"
                    />
                  </td>
                  <td className="p-3 border-r border-border">
                    <Select
                      value={item.calculator}
                      onValueChange={(value) => {
                        const updated = logisticsItems.map(i =>
                          i.id === item.id ? { ...i, calculator: value } : i
                        );
                        setLogisticsItems(updated);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Assign calculator" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Package Cost Calculator">Package Cost Calculator</SelectItem>
                        <SelectItem value="Shipping Calculator">Shipping Calculator</SelectItem>
                        <SelectItem value="Storage Calculator">Storage Calculator</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3 border-r border-border">
                    <Select
                      value={item.costBasis}
                      onValueChange={(value) => {
                        const updated = logisticsItems.map(i =>
                          i.id === item.id ? { ...i, costBasis: value } : i
                        );
                        setLogisticsItems(updated);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Cost basis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Per Unit">Per Unit</SelectItem>
                        <SelectItem value="Per Km">Per Km</SelectItem>
                        <SelectItem value="Per Weight">Per Weight</SelectItem>
                        <SelectItem value="Per Volume">Per Volume</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3 border-r border-border">
                    <Input
                      value={item.parameters}
                      onChange={(e) => {
                        const updated = logisticsItems.map(i =>
                          i.id === item.id ? { ...i, parameters: e.target.value } : i
                        );
                        setLogisticsItems(updated);
                      }}
                      className="h-8 text-xs"
                      placeholder="Distance, weight, etc."
                    />
                  </td>
                  <td className="p-3 border-r border-border">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitCost}
                      onChange={(e) => {
                        const updated = logisticsItems.map(i =>
                          i.id === item.id ? { ...i, unitCost: parseFloat(e.target.value) || 0 } : i
                        );
                        setLogisticsItems(updated);
                      }}
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="p-3 border-r border-border">
                    <Input
                      type="number"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = logisticsItems.map(i =>
                          i.id === item.id ? { ...i, quantity: parseFloat(e.target.value) || 0 } : i
                        );
                        setLogisticsItems(updated);
                      }}
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="p-3 border-r border-border">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.totalCost}
                      onChange={(e) => {
                        const updated = logisticsItems.map(i =>
                          i.id === item.id ? { ...i, totalCost: parseFloat(e.target.value) || 0 } : i
                        );
                        setLogisticsItems(updated);
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
                        onClick={() => handleDeleteLogisticsItem(item.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

                  <tr className="bg-secondary/30 font-semibold">
                    <td colSpan={7} className="p-3 text-right border-r border-border">
                      Total:
                    </td>
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
            onClick={handleAddLogisticsItem}
            variant="outline"
            size="sm"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Logistics Item
          </Button>
        </div>
      </div>
    </div>
  );
}
