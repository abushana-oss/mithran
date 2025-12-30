'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, ChevronsUpDown, Package, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useMaterials,
  useMaterial,
  useLinkMaterialToBOMItem,
  useUnlinkMaterialFromBOMItem,
  useMaterialFilterOptions,
  type Material,
} from '@/lib/api/hooks/useMaterials';

interface MaterialSelectionCardProps {
  bomItemId: string;
  currentMaterialId?: string;
}

export function MaterialSelectionCard({ bomItemId, currentMaterialId }: MaterialSelectionCardProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Filters
  const [materialGroup, setMaterialGroup] = useState<string>('');
  const [materialType, setMaterialType] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: currentMaterial } = useMaterial(currentMaterialId);
  const { data: filterOptions } = useMaterialFilterOptions();

  const { data: materialsData, isLoading } = useMaterials({
    search: searchValue,
    materialGroup: materialGroup || undefined,
    material: materialType || undefined,
    location: location || undefined,
    limit: 50,
  });

  const materials = materialsData?.materials || [];

  const linkMutation = useLinkMaterialToBOMItem();
  const unlinkMutation = useUnlinkMaterialFromBOMItem();

  const handleSelectMaterial = (materialId: string) => {
    linkMutation.mutate(
      { bomItemId, materialId },
      {
        onSuccess: () => {
          setOpen(false);
          setSearchValue('');
        },
      }
    );
  };

  const handleUnlinkMaterial = () => {
    if (confirm('Remove material from this BOM item?')) {
      unlinkMutation.mutate(bomItemId);
    }
  };

  const clearFilters = () => {
    setMaterialGroup('');
    setMaterialType('');
    setLocation('');
  };

  const formatCost = (material: Material) => {
    if (material.avgCost) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(material.avgCost);
    }
    return 'N/A';
  };

  // Group materials by materialGroup and material type
  const groupedMaterials = useMemo(() => {
    const grouped: Record<string, Record<string, Material[]>> = {};

    materials.forEach((mat) => {
      const groupKey = mat.materialGroup;
      const typeKey = mat.material;
      const group = (grouped[groupKey] ??= {});
      const list = (group[typeKey] ??= []);
      list.push(mat);
    });

    return grouped;
  }, [materials]);

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Material Selection
            </CardTitle>
            <CardDescription className="mt-1">
              Select raw material for cost estimation and process planning
            </CardDescription>
          </div>
          {currentMaterial && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnlinkMaterial}
              disabled={unlinkMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Material Display */}
        {currentMaterial ? (
          <div className="p-4 bg-blue-50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-blue-900">{currentMaterial.material}</div>
                <div className="text-sm text-blue-700">
                  {currentMaterial.materialGroup}
                  {currentMaterial.materialGrade && ` - ${currentMaterial.materialGrade}`}
                </div>
              </div>
              <Badge variant="secondary">{formatCost(currentMaterial)}</Badge>
            </div>

            {/* Material Properties */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {currentMaterial.meltingTempCelsius && (
                <div>
                  <span className="text-muted-foreground">Melting Temp:</span>{' '}
                  <span className="font-medium">{currentMaterial.meltingTempCelsius}°C</span>
                </div>
              )}
              {currentMaterial.moldTempCelsius && (
                <div>
                  <span className="text-muted-foreground">Mold Temp:</span>{' '}
                  <span className="font-medium">{currentMaterial.moldTempCelsius}°C</span>
                </div>
              )}
              {currentMaterial.densityKgPerM3 && (
                <div>
                  <span className="text-muted-foreground">Density:</span>{' '}
                  <span className="font-medium">{currentMaterial.densityKgPerM3} kg/m³</span>
                </div>
              )}
              {currentMaterial.location && (
                <div>
                  <span className="text-muted-foreground">Location:</span>{' '}
                  <span className="font-medium">{currentMaterial.location}</span>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(true)}
              className="w-full mt-2"
            >
              Change Material
            </Button>
          </div>
        ) : (
          <Button onClick={() => setOpen(true)} className="w-full">
            <Package className="h-4 w-4 mr-2" />
            Select Material
          </Button>
        )}

        {/* Material Selection Popover */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between hidden"
            >
              {currentMaterial?.material || 'Select material...'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[600px] p-0" align="start">
            <Command shouldFilter={false}>
              <div className="flex items-center border-b px-3">
                <CommandInput
                  placeholder="Search materials..."
                  value={searchValue}
                  onValueChange={setSearchValue}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="ml-2"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              {/* Filters */}
              {showFilters && filterOptions && (
                <div className="p-3 border-b space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Material Group</Label>
                      <Select value={materialGroup} onValueChange={setMaterialGroup}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Groups</SelectItem>
                          {filterOptions.materialGroups.map((group) => (
                            <SelectItem key={group} value={group}>
                              {group}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Material Type</Label>
                      <Select value={materialType} onValueChange={setMaterialType}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Types</SelectItem>
                          {filterOptions.materialTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Location</Label>
                      <Select value={location} onValueChange={setLocation}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Locations</SelectItem>
                          {filterOptions.locations.filter(Boolean).map((loc) => (
                            <SelectItem key={loc as string} value={loc as string}>
                              {loc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full text-xs"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}

              <CommandList>
                <CommandEmpty>
                  {isLoading ? 'Loading materials...' : 'No materials found.'}
                </CommandEmpty>

                {Object.entries(groupedMaterials).map(([group, types]) => (
                  <CommandGroup key={group} heading={group}>
                    {Object.entries(types).map(([type, mats]) => (
                      <div key={type}>
                        <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                          {type}
                        </div>
                        {mats.map((material) => (
                          <CommandItem
                            key={material.id}
                            value={material.id}
                            onSelect={() => handleSelectMaterial(material.id)}
                            className="flex items-center justify-between"
                          >
                            <div className="flex-1">
                              <div className="font-medium">
                                {material.materialGrade || material.material}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {material.location && `${material.location} • `}
                                {material.regrind && 'Regrind • '}
                                {formatCost(material)}
                              </div>
                            </div>
                            <Check
                              className={cn(
                                'h-4 w-4',
                                currentMaterialId === material.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                          </CommandItem>
                        ))}
                      </div>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </CardContent>
    </Card>
  );
}
