'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { toast } from 'sonner';
import { createBOMItem, updateBOMItem } from '@/lib/api/hooks/useBOMItems';

export enum BOMItemType {
  ASSEMBLY = 'assembly',
  SUB_ASSEMBLY = 'sub_assembly',
  CHILD_PART = 'child_part',
  BOP = 'bop',
}

const ITEM_TYPE_LABELS = {
  [BOMItemType.ASSEMBLY]: 'Assembly',
  [BOMItemType.SUB_ASSEMBLY]: 'Sub-Assembly',
  [BOMItemType.CHILD_PART]: 'Child Part',
  [BOMItemType.BOP]: 'BOP (Bill of Process)',
};

interface BOMItemDialogProps {
  bomId: string;
  item?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BOMItemDialog({ bomId, item, open, onOpenChange, onSuccess }: BOMItemDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    partNumber: '',
    description: '',
    itemType: BOMItemType.ASSEMBLY,
    quantity: 1,
    annualVolume: 1000,
    unit: 'pcs',
    material: '',
    materialGrade: '',
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        partNumber: item.partNumber || '',
        description: item.description || '',
        itemType: item.itemType || BOMItemType.ASSEMBLY,
        quantity: item.quantity || 1,
        annualVolume: item.annualVolume || 1000,
        unit: item.unit || 'pcs',
        material: item.material || '',
        materialGrade: item.materialGrade || '',
      });
    } else {
      setFormData({
        name: '',
        partNumber: '',
        description: '',
        itemType: BOMItemType.ASSEMBLY,
        quantity: 1,
        annualVolume: 1000,
        unit: 'pcs',
        material: '',
        materialGrade: '',
      });
    }
  }, [item, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        bomId,
        name: formData.name,
        partNumber: formData.partNumber || undefined,
        description: formData.description || undefined,
        itemType: formData.itemType,
        quantity: formData.quantity,
        annualVolume: formData.annualVolume,
        unit: formData.unit,
        material: formData.material || undefined,
        materialGrade: formData.materialGrade || undefined,
      };

      if (item) {
        await updateBOMItem(item.id, payload);
        toast.success('Item updated successfully');
      } else {
        await createBOMItem(payload);
        toast.success('Item added successfully');
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error saving BOM item:', error);
      }
      toast.error(error?.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit BOM Item' : 'Create BOM Item'}</DialogTitle>
          <DialogDescription>
            {item ? 'Update item details' : 'Add a new item to the Bill of Materials'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Cylinder Head Assembly"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="partNumber">Part Number</Label>
              <Input
                id="partNumber"
                placeholder="e.g., CH-2024-001"
                value={formData.partNumber}
                onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the part..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="materialGrade">Material Grade</Label>
              <Input
                id="materialGrade"
                placeholder="e.g., EN-GJL-250, AlSi10Mg"
                value={formData.materialGrade}
                onChange={(e) => setFormData({ ...formData, materialGrade: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="annualVolume">Annual Volume *</Label>
                <Input
                  id="annualVolume"
                  type="number"
                  min="1"
                  value={formData.annualVolume}
                  onChange={(e) => setFormData({ ...formData, annualVolume: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="unit">UOM</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData({ ...formData, unit: value })}
                >
                  <SelectTrigger id="unit">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">Pieces</SelectItem>
                    <SelectItem value="kg">Kilograms</SelectItem>
                    <SelectItem value="lbs">Pounds</SelectItem>
                    <SelectItem value="m">Meters</SelectItem>
                    <SelectItem value="ft">Feet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="itemType">Type *</Label>
                <Select
                  value={formData.itemType}
                  onValueChange={(value) => setFormData({ ...formData, itemType: value as BOMItemType })}
                >
                  <SelectTrigger id="itemType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ITEM_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  {item ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                item ? 'Update Item' : 'Create Item'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
