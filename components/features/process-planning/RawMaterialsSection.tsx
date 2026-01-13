'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { RawMaterialDialog } from './RawMaterialDialog';

interface RawMaterial {
  id: string;
  material: string;
  unitCost: number;
  grossUsage: number;
  netUsage: number;
  scrapPercentage: number;
  reclaim: number;
  overheadPercentage: number;
  totalCost: number;
  imageUrl?: string;
}

export function RawMaterialsSection() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAddMaterial = () => {
    setDialogOpen(true);
  };

  const handleDialogSubmit = (data: any) => {
    const newMaterial: RawMaterial = {
      id: Date.now().toString(),
      material: data.materialName,
      unitCost: data.unitCost,
      grossUsage: data.grossUsage,
      netUsage: data.netUsage,
      scrapPercentage: data.scrap,
      reclaim: data.reclaim,
      overheadPercentage: data.overhead,
      totalCost: data.totalCost,
    };
    setMaterials([...materials, newMaterial]);
    setDialogOpen(false);
  };

  const handleDeleteMaterial = (id: string) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  const calculateTotal = () => {
    return materials.reduce((sum, m) => sum + m.totalCost, 0).toFixed(2);
  };

  return (
    <div className="card border-l-4 border-l-primary shadow-md mb-4 mt-3 rounded-lg overflow-hidden">
      <div className="bg-primary py-3 px-4">
        <h6 className="m-0 font-semibold text-primary-foreground">Raw Materials</h6>
      </div>
      <div className="bg-card p-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  Material
                </th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  Unit Cost
                </th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  Gross Usage
                </th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  Net Usage
                </th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  Scrap %
                </th>
                <th className="p-3 text-left text-xs font-semibold border-r border-primary-foreground/20">
                  Reclaim
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
              {materials.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    <p className="text-sm">No raw materials added yet</p>
                    <p className="text-xs mt-1">Click "Add Material" to get started</p>
                  </td>
                </tr>
              ) : (
                <>
                  {materials.map((material) => (
                <tr key={material.id} className="hover:bg-secondary/50">
                  <td className="p-3 border-r border-border">
                    <Input
                      value={material.material}
                      onChange={(e) => {
                        const updated = materials.map(m =>
                          m.id === material.id ? { ...m, material: e.target.value } : m
                        );
                        setMaterials(updated);
                      }}
                      className="h-8 text-xs"
                      placeholder="Material name"
                    />
                  </td>
                  <td className="p-3 border-r border-border">
                    <Input
                      type="number"
                      step="0.01"
                      value={material.unitCost}
                      onChange={(e) => {
                        const updated = materials.map(m =>
                          m.id === material.id ? { ...m, unitCost: parseFloat(e.target.value) || 0 } : m
                        );
                        setMaterials(updated);
                      }}
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="p-3 border-r border-border">
                    <Input
                      type="number"
                      step="0.01"
                      value={material.grossUsage}
                      onChange={(e) => {
                        const updated = materials.map(m =>
                          m.id === material.id ? { ...m, grossUsage: parseFloat(e.target.value) || 0 } : m
                        );
                        setMaterials(updated);
                      }}
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="p-3 border-r border-border">
                    <Input
                      type="number"
                      step="0.01"
                      value={material.netUsage}
                      onChange={(e) => {
                        const updated = materials.map(m =>
                          m.id === material.id ? { ...m, netUsage: parseFloat(e.target.value) || 0 } : m
                        );
                        setMaterials(updated);
                      }}
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="p-3 border-r border-border">
                    <Input
                      type="number"
                      step="0.1"
                      value={material.scrapPercentage}
                      onChange={(e) => {
                        const updated = materials.map(m =>
                          m.id === material.id ? { ...m, scrapPercentage: parseFloat(e.target.value) || 0 } : m
                        );
                        setMaterials(updated);
                      }}
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="p-3 border-r border-border">
                    <Input
                      type="number"
                      step="0.01"
                      value={material.reclaim}
                      onChange={(e) => {
                        const updated = materials.map(m =>
                          m.id === material.id ? { ...m, reclaim: parseFloat(e.target.value) || 0 } : m
                        );
                        setMaterials(updated);
                      }}
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="p-3 border-r border-border">
                    <Input
                      type="number"
                      step="0.1"
                      value={material.overheadPercentage}
                      onChange={(e) => {
                        const updated = materials.map(m =>
                          m.id === material.id ? { ...m, overheadPercentage: parseFloat(e.target.value) || 0 } : m
                        );
                        setMaterials(updated);
                      }}
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="p-3 border-r border-border">
                    <Input
                      type="number"
                      step="0.01"
                      value={material.totalCost}
                      onChange={(e) => {
                        const updated = materials.map(m =>
                          m.id === material.id ? { ...m, totalCost: parseFloat(e.target.value) || 0 } : m
                        );
                        setMaterials(updated);
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
                        onClick={() => handleDeleteMaterial(material.id)}
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
            onClick={handleAddMaterial}
            variant="outline"
            size="sm"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Material
          </Button>
        </div>
      </div>

      <RawMaterialDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleDialogSubmit}
      />
    </div>
  );
}
