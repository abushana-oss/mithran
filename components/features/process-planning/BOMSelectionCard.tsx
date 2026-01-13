'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter } from 'lucide-react';

interface BOMItem {
  id: string;
  partNumber: string;
  description: string;
  itemType: 'assembly' | 'sub_assembly' | 'child_part';
  status: 'pending' | 'in_progress' | 'completed';
}

interface BOM {
  id: string;
  name: string;
  version: string;
  items: BOMItem[];
}

interface BOMSelectionCardProps {
  boms: BOM[];
  selectedBomId: string;
  selectedPartNumber: string;
  searchTerm: string;
  statusFilter: string;
  typeFilter: string;
  onBomChange: (bomId: string) => void;
  onPartChange: (partNumber: string) => void;
  onSearchChange: (search: string) => void;
  onStatusFilterChange: (status: string) => void;
  onTypeFilterChange: (type: string) => void;
  onCreateRoute: () => void;
}

export function BOMSelectionCard({
  boms,
  selectedBomId,
  selectedPartNumber,
  searchTerm,
  statusFilter,
  typeFilter,
  onBomChange,
  onPartChange,
  onSearchChange,
  onStatusFilterChange,
  onTypeFilterChange,
  onCreateRoute,
}: BOMSelectionCardProps) {
  const selectedBom = boms.find(b => b.id === selectedBomId);

  // Filter items based on search and filters
  const filteredItems = useMemo(() => {
    if (!selectedBom) return [];

    return selectedBom.items.filter(item => {
      const matchesSearch = searchTerm === '' ||
        item.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesType = typeFilter === 'all' || item.itemType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [selectedBom, searchTerm, statusFilter, typeFilter]);

  const totalItems = selectedBom?.items.length || 0;
  const completedItems = selectedBom?.items.filter(i => i.status === 'completed').length || 0;
  const pendingItems = totalItems - completedItems;

  return (
    <div className="card border-l-4 border-l-primary shadow-md mb-4 rounded-lg overflow-hidden">
      <div className="bg-primary py-3 px-4 flex items-center justify-between">
        <div>
          <h6 className="m-0 font-semibold text-primary-foreground">BOM Selection & Filters</h6>
          <p className="text-xs text-primary-foreground/80 mt-0.5">Select BOM and filter parts to create process planning</p>
        </div>
      </div>
      <div className="bg-card p-4">
        {/* BOM Selection */}
        <div className="space-y-2 mb-4">
          <label className="text-xs font-semibold">Select BOM</label>
          <Select value={selectedBomId} onValueChange={onBomChange}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select BOM" />
            </SelectTrigger>
            <SelectContent>
              {boms.map((bom) => (
                <SelectItem key={bom.id} value={bom.id}>
                  {bom.name} (v{bom.version})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedBomId && (
          <>
            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 p-3 bg-secondary/30 rounded-lg border border-border">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-semibold flex items-center gap-1">
                  <Search className="h-3 w-3" />
                  Search Parts
                </label>
                <Input
                  placeholder="Search by part number or description..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  Status
                </label>
                <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  Type
                </label>
                <Select value={typeFilter} onValueChange={onTypeFilterChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="assembly">Assembly</SelectItem>
                    <SelectItem value="sub_assembly">Sub-Assembly</SelectItem>
                    <SelectItem value="child_part">Child Part</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Part Selection Dropdown */}
            <div className="space-y-2 mb-4">
              <label className="text-xs font-semibold">
                Select Part ({filteredItems.length} of {totalItems} items)
              </label>
              <Select
                value={selectedPartNumber}
                onValueChange={onPartChange}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select part from filtered results" />
                </SelectTrigger>
                <SelectContent>
                  {filteredItems.length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground">No parts match the filters</div>
                  ) : (
                    filteredItems.map((item) => (
                      <SelectItem key={item.id} value={item.partNumber}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] px-1 py-0">
                            {item.itemType === 'assembly' ? 'ASM' : item.itemType === 'sub_assembly' ? 'SUB' : 'PRT'}
                          </Badge>
                          <span>{item.partNumber} - {item.description}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Progress Summary */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-secondary/30 rounded-lg p-3 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Total Items</p>
                <p className="text-xl font-bold">{totalItems}</p>
              </div>
              <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                <p className="text-xs text-muted-foreground mb-1">Routes Defined</p>
                <p className="text-xl font-bold text-green-600">{completedItems}</p>
              </div>
              <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/20">
                <p className="text-xs text-muted-foreground mb-1">Pending</p>
                <p className="text-xl font-bold text-orange-600">{pendingItems}</p>
              </div>
            </div>

            {/* Workflow Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
              <p className="text-xs text-foreground">
                <span className="font-semibold">Workflow:</span> Use filters above to find parts, then select to create process planning. Each part can have raw materials, process steps, and logistics defined separately.
              </p>
            </div>

            {/* Selected Part Info */}
            {selectedPartNumber && (
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Selected Part</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">
                      {selectedPartNumber}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {selectedBom?.items.find(i => i.partNumber === selectedPartNumber)?.description}
                    </span>
                  </div>
                </div>
                <Button onClick={onCreateRoute} size="sm">
                  <Plus className="h-3 w-3 mr-1" />
                  Create Route
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
