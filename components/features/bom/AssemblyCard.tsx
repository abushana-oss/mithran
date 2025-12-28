'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Plus,
  Package,
  Download,
  Trash2,
} from 'lucide-react';
import { BOMItem } from '@/lib/api/hooks/useBOMItems';
import { BOMItemType } from '@/lib/types/bom.types';

interface AssemblyCardProps {
  assembly: BOMItem & { children?: BOMItem[] };
  onEdit: (item: BOMItem) => void;
  onAddChild: (parentId: string, type: BOMItemType) => void;
  onViewFiles: (item: BOMItem) => void;
  onDelete?: (item: BOMItem) => void;
}

interface TreeItemProps {
  item: BOMItem & { children?: BOMItem[] };
  level: number;
  isLast: boolean;
  onEdit: (item: BOMItem) => void;
  onAddChild: (parentId: string, type: BOMItemType) => void;
  onDelete?: (item: BOMItem) => void;
}

function TreeItem({ item, level, isLast: _isLast, onEdit, onAddChild, onDelete }: TreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = item.children && item.children.length > 0;

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'sub_assembly':
        return 'Sub-Assembly';
      case 'child_part':
        return 'Child Part';
      default:
        return type;
    }
  };

  const getChildType = (itemType: string): BOMItemType | null => {
    if (itemType === 'sub_assembly') return BOMItemType.CHILD_PART;
    // Child parts are now the last level - no BOP
    return null;
  };

  const getBorderColor = (_type: string, level: number) => {
    // Cycle through colors based on level
    const colors = [
      'border-l-blue-500',
      'border-l-teal-500',
      'border-l-amber-500',
      'border-l-purple-500',
      'border-l-pink-500',
    ];
    return colors[level % colors.length];
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'sub_assembly':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'child_part':
        return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const childType = getChildType(item.itemType);
  const indent = level * 32; // 32px per level for better spacing

  const total = item.quantity * (item.unitCost || 0);

  return (
    <div className="relative" style={{ marginLeft: `${indent}px` }}>
      {/* Item Card */}
      <div
        className={`bg-card rounded-lg border-l-4 ${getBorderColor(
          item.itemType,
          level
        )} border border-border/40 mb-3 shadow-sm hover:shadow-md transition-shadow`}
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Left side - Collapse button and item name */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Collapse/Expand button */}
              {hasChildren && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-8 w-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center flex-shrink-0 mt-1"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}

              {/* Item Name */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <Badge variant="outline" className={`text-xs flex-shrink-0 ${getBadgeStyle(item.itemType)}`}>
                    {getItemTypeLabel(item.itemType)}
                  </Badge>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Part No: </span>
                    <span className="font-medium">{item.partNumber || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Quantity: </span>
                    <span className="font-medium">{item.quantity}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Description: </span>
                    <span className="font-medium">{item.description || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">UOM: </span>
                    <span className="font-medium">{item.unit || 'nos'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Material Grade: </span>
                    <span className="font-medium">{item.materialGrade || 'No material'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Annual Volume: </span>
                    <span className="font-medium">{item.annualVolume?.toLocaleString() || '—'}</span>
                  </div>
                  {item.unitCost && (
                    <>
                      <div>
                        <span className="text-muted-foreground">Unit Cost: </span>
                        <span className="font-medium">₹{item.unitCost.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total: </span>
                        <span className="font-medium">₹{total.toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right side - Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {childType && (
                <button
                  onClick={() => onAddChild(item.id, childType)}
                  className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center shadow-sm"
                  title={`Add ${getItemTypeLabel(childType)}`}
                >
                  <Plus className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={() => onEdit(item)}
                className="h-10 w-10 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center shadow-sm"
                title="Edit"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              {onDelete && (
                <button
                  onClick={() => onDelete(item)}
                  className="h-10 w-10 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center justify-center shadow-sm"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Render children recursively */}
      {isExpanded && hasChildren && (
        <div className="space-y-0">
          {item.children?.map((child, index) => (
            <TreeItem
              key={child.id}
              item={child}
              level={level + 1}
              isLast={index === (item.children?.length || 0) - 1}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AssemblyCard({ assembly, onEdit, onAddChild, onViewFiles, onDelete }: AssemblyCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = assembly.children && assembly.children.length > 0;

  return (
    <Card className="mb-4 shadow-sm border-l-4 border-l-emerald-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            {/* Assembly Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <CardTitle className="text-lg font-semibold text-foreground truncate">
                  {assembly.name}
                </CardTitle>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                  Assembly
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                <div className="text-sm">
                  <p className="text-muted-foreground text-xs mb-0.5">Part Number</p>
                  <p className="font-medium text-foreground">{assembly.partNumber || '—'}</p>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground text-xs mb-0.5">Quantity</p>
                  <p className="font-medium text-foreground">
                    {assembly.quantity} {assembly.unit || 'pcs'}
                  </p>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground text-xs mb-0.5">Annual Volume</p>
                  <p className="font-medium text-foreground">{assembly.annualVolume?.toLocaleString()}</p>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground text-xs mb-0.5">Material</p>
                  <p className="font-medium text-foreground truncate" title={assembly.materialGrade || ''}>
                    {assembly.materialGrade || '—'}
                  </p>
                </div>
              </div>

              {assembly.description && (
                <div className="mt-3 text-sm text-muted-foreground border-t pt-2">
                  <p className="line-clamp-2">{assembly.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-4">
            <Button variant="outline" size="sm" onClick={() => onAddChild(assembly.id, BOMItemType.SUB_ASSEMBLY)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Component
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEdit(assembly)}>
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </Button>
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(assembly)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
            {(assembly.file3dPath || assembly.file2dPath) && (
              <Button variant="outline" size="sm" onClick={() => onViewFiles(assembly)}>
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Components List - Always show, even if empty */}
      <CardContent className="pt-0">
        <div className="border-t pt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-semibold hover:text-foreground transition-colors w-full mb-3 text-left"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
            )}
            <span>
              Components ({assembly.children?.length || 0})
            </span>
          </button>

          {isExpanded && (
            <div className="space-y-0">
              {hasChildren ? (
                assembly.children?.map((child, index) => (
                  <TreeItem
                    key={child.id}
                    item={child}
                    level={0}
                    isLast={index === (assembly.children?.length || 0) - 1}
                    onEdit={onEdit}
                    onAddChild={onAddChild}
                    onDelete={onDelete}
                  />
                ))
              ) : (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No components yet</p>
                  <p className="text-xs mt-1">Click "Add Component" to add sub-assemblies and parts</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
